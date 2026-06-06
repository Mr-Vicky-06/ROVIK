import asyncio
import logging
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

logger = logging.getLogger(__name__)

class GeocodingService:
    def __init__(self):
        # Define a unique user_agent per Nominatim terms of service
        self.geolocator = Nominatim(user_agent="rovik_logistics_platform_v1")
        
        # Simple memory cache to avoid pounding the rate limit for duplicate addresses
        self._cache = {}

    async def geocode_address(self, address: str) -> tuple[float, float] | None:
        """
        Converts an address string into (latitude, longitude) coordinates.
        Runs the synchronous Geopy call inside asyncio.to_thread to prevent event loop blocking.
        Adheres to Nominatim's 1-request-per-second rate limit.
        """
        if not address or len(address.strip()) < 5:
            return None
            
        address_clean = address.strip().lower()
        if address_clean in self._cache:
            return self._cache[address_clean]
            
        try:
            # Respect the strict Nominatim rate limits (1 req/sec)
            await asyncio.sleep(1.1)
            
            # Execute synchronous geocode in a thread
            location = await asyncio.to_thread(self.geolocator.geocode, address_clean, timeout=10)
            
            if location:
                result = (location.latitude, location.longitude)
                self._cache[address_clean] = result
                return result
            else:
                return None
                
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Geocoding service failed for {address}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected geocoding error for {address}: {e}")
            return None

geocoding_service = GeocodingService()
