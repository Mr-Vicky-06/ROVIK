from math import asin, cos, radians, sin, sqrt
from typing import Any
import logging
import json
from redis.asyncio import Redis

from routeiq.core.config import get_settings

logger = logging.getLogger(__name__)


class TelemetryFilter:
    """On-the-fly GPS filtering, compression, and smoothing compactor with Redis backend."""

    def __init__(self) -> None:
        # Local cache fallback to store last known state for each rider: (latitude, longitude, speed_kmph)
        self._local_state: dict[str, dict[str, Any]] = {}
        settings = get_settings()
        self._redis = Redis.from_url(settings.redis_url, decode_responses=True)

    async def filter_and_smooth(
        self, 
        rider_id: str, 
        lat: float, 
        lng: float, 
        speed: float | None,
        timestamp: float | None = None
    ) -> tuple[bool, float, float]:
        """
        Processes an incoming coordinate.
        Returns:
            (should_filter: bool, smoothed_latitude: float, smoothed_longitude: float)
        """
        # 1. Validation: Coordinate Bounds Check
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
            logger.warning(f"TelemetryFilter: Discarded invalid coordinates for rider {rider_id}: ({lat}, {lng})")
            return True, lat, lng

        # 2. Validation: Timestamp Check
        now = datetime_now_epoch()
        if timestamp is not None:
            # Timestamp must not be in the future (with 5 min grace) or >24h old
            if timestamp > now + 300 or timestamp < now - 86400:
                logger.warning(f"TelemetryFilter: Discarded invalid timestamp for rider {rider_id}: {timestamp}")
                return True, lat, lng

        # 3. Fetch last state from Redis cache for cluster-safe checks
        try:
            cache_key = f"rovik:rider:{rider_id}:last_state"
            data = await self._redis.get(cache_key)
            last = json.loads(data) if data else None
        except Exception:
            last = self._local_state.get(rider_id)

        if last is None:
            # First coordinate: always accept and record state
            state = {
                "lat": lat,
                "lng": lng,
                "speed": speed or 0.0,
                "recorded_at": datetime_now_epoch()
            }
            try:
                cache_key = f"rovik:rider:{rider_id}:last_state"
                await self._redis.set(cache_key, json.dumps(state), ex=86400) # Expire in 1 day
            except Exception:
                pass
            self._local_state[rider_id] = state
            return False, lat, lng

        last_lat = last["lat"]
        last_lng = last["lng"]
        last_speed = last["speed"]
        
        # 4. Calculate spatial delta (distance in meters)
        dist_m = self._haversine_meters(last_lat, last_lng, lat, lng)
        
        # 5. STATIONARY COMPRESSION:
        # If the rider is stationary (speed < 1.0 km/h) and has moved less than 8 meters,
        # drop this ping to compress DB logs footprint.
        is_stationary = (speed is not None and speed < 1.0) or (speed is None and last_speed < 1.0)
        if is_stationary and dist_m < 8.0:
            logger.debug(f"TelemetryFilter: Filtered stationary ping for rider {rider_id} (moved {dist_m:.2f}m)")
            return True, last_lat, last_lng

        # 6. VELOCITY GATE / NOISE CHECKER:
        # If the coordinate represents a velocity spike of > 300 meters within high frequency,
        # flag it as sensor noise and filter it.
        if dist_m > 300.0:
            logger.warning(f"TelemetryFilter: Discarded noisy GPS coordinate jump for rider {rider_id} (jumped {dist_m:.2f}m)")
            return True, last_lat, last_lng

        # 7. MOVING AVERAGE PATH SMOOTHING:
        smoothed_lat = round(last_lat * 0.4 + lat * 0.6, 6)
        smoothed_lng = round(last_lng * 0.4 + lng * 0.6, 6)

        # Update Redis and local cache states
        state = {
            "lat": smoothed_lat,
            "lng": smoothed_lng,
            "speed": speed or 0.0,
            "recorded_at": datetime_now_epoch()
        }
        try:
            cache_key = f"rovik:rider:{rider_id}:last_state"
            await self._redis.set(cache_key, json.dumps(state), ex=86400)
        except Exception:
            pass
        self._local_state[rider_id] = state

        return False, smoothed_lat, smoothed_lng

    @staticmethod
    def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        earth_radius_m = 6371008.8
        d_lat = radians(lat2 - lat1)
        d_lon = radians(lng2 - lng1)
        a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
        return 2 * earth_radius_m * asin(sqrt(a))


def datetime_now_epoch() -> float:
    import time
    return time.time()


# Global singleton instance
telemetry_filter = TelemetryFilter()
