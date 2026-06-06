from math import asin, cos, radians, sin, sqrt
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, UTC

from routeiq.infrastructure.database.models import OrderModel, EventModel
from routeiq.domain.events import EventType, OperationalEvent
from routeiq.infrastructure.events.redis_event_bus import RedisEventPublisher

logger = logging.getLogger(__name__)


class DeviationService:
    """GIS Geofencing and Route Deviation Auditing Engine."""

    def __init__(self) -> None:
        self._publisher = RedisEventPublisher()

    async def audit_rider_position(
        self, 
        db: AsyncSession, 
        rider_id: str, 
        lat: float, 
        lng: float, 
        organization_id: str
    ) -> None:
        """
        Audits a rider's current coordinates against active deliveries to trigger
        automatic geofencing status updates and course deviations.
        """
        # 1. SQL Bounding Box Proximity Query (approx 150m box: 0.00135 degrees lat/lng)
        # This allows PostgreSQL to utilize normal indices, scanning only local pending deliveries.
        lat_bound = 0.00135
        lng_bound = 0.00135
        
        box_query = select(OrderModel).where(
            OrderModel.organization_id == organization_id
        ).where(
            OrderModel.status == "pending"
        ).where(
            OrderModel.delivery_latitude.between(lat - lat_bound, lat + lat_bound)
        ).where(
            OrderModel.delivery_longitude.between(lng - lng_bound, lng + lng_bound)
        )
        
        result_box = await db.execute(box_query)
        close_deliveries = list(result_box.scalars().all())

        # 2. Global Assigned Queries:
        # Load only the active 'assigned' deliveries (always small, avoiding loop bloat).
        assigned_query = select(OrderModel).where(
            OrderModel.organization_id == organization_id
        ).where(
            OrderModel.status == "assigned"
        )
        result_assigned = await db.execute(assigned_query)
        close_deliveries.extend(result_assigned.scalars().all())

        for delivery in close_deliveries:
            dist_m = self._haversine_meters(lat, lng, delivery.delivery_latitude, delivery.delivery_longitude)

            # A. GEOFENCING ARRIVAL TRIGGER (Radius < 150 meters):
            # When a rider gets close to the dropoff, automatically mark delivery as completed!
            if dist_m < 150.0:
                logger.info(f"Geofence: Rider {rider_id} arrived at delivery {delivery.id} (distance {dist_m:.2f}m)")
                
                # 1. Update delivery status to completed
                delivery.status = "completed"
                await db.commit()

                # 2. Save delivery_completed to SQL event stream
                event = OperationalEvent(
                    event_type=EventType.DELIVERY_COMPLETED,
                    organization_id=organization_id,
                    payload={
                        "order_id": delivery.external_id,
                        "delivery_id": delivery.id,
                        "rider_id": rider_id,
                        "arrived_at": datetime.now(UTC).isoformat(),
                        "geofence_distance_m": round(dist_m, 2)
                    }
                )
                event_model = EventModel(
                    id=event.event_id,
                    organization_id=organization_id,
                    event_type=event.event_type,
                    payload=event.payload,
                    occurred_at=datetime.now(UTC)
                )
                db.add(event_model)
                await db.commit()

                # 3. Publish to Redis so live dispatch maps reload instantly
                try:
                    await self._publisher.publish(event)
                except Exception:
                    pass
                return  # Process one geofence transition at a time

            # B. ROUTE DEVIATION ANOMALY (Distance > 8km while assigned):
            # If rider is heading away or straying extremely far, raise an anomaly alert
            elif dist_m > 8000.0 and delivery.status == "assigned":
                logger.warning(f"Deviation Alert: Rider {rider_id} is straying {dist_m/1000:.2f}km from target!")
                
                event = OperationalEvent(
                    event_type=EventType.SLA_ALERT_GENERATED,
                    organization_id=organization_id,
                    payload={
                        "alert_type": "route_deviation",
                        "rider_id": rider_id,
                        "delivery_id": delivery.id,
                        "distance_km": round(dist_m / 1000, 2),
                        "description": f"Rider is currently {dist_m/1000:.1f}km away from delivery point, suggesting major route deviation."
                    }
                )
                # Log deviation operational alert
                event_model = EventModel(
                    id=event.event_id,
                    organization_id=organization_id,
                    event_type=event.event_type,
                    payload=event.payload,
                    occurred_at=datetime.now(UTC)
                )
                db.add(event_model)
                await db.commit()

                try:
                    await self._publisher.publish(event)
                except Exception:
                    pass

    @staticmethod
    def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        earth_radius_m = 6371008.8
        d_lat = radians(lat2 - lat1)
        d_lon = radians(lng2 - lng1)
        a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
        return 2 * earth_radius_m * asin(sqrt(a))


# Global singleton instance
deviation_service = DeviationService()
