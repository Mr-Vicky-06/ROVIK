from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum

from routeiq.domain.geo import GeoPoint


class DeliveryStatus(StrEnum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    FAILED = "failed"


class RiderStatus(StrEnum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    OFFLINE = "offline"
    BREAK = "break"


@dataclass(frozen=True)
class Delivery:
    id: str
    organization_id: str
    external_id: str
    dropoff: GeoPoint
    priority: int
    status: DeliveryStatus
    promised_at: datetime | None = None


@dataclass(frozen=True)
class Rider:
    id: str
    organization_id: str
    external_id: str
    vehicle_type: str
    capacity: int
    status: RiderStatus
    last_location: GeoPoint | None = None
