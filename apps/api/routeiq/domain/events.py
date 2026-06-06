from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4


class EventType(StrEnum):
    ORDER_CREATED = "order_created"
    RIDER_ASSIGNED = "rider_assigned"
    ROUTE_GENERATED = "route_generated"
    ROUTE_REOPTIMIZED = "route_reoptimized"
    RIDER_LOCATION_UPDATED = "rider_location_updated"
    DELIVERY_COMPLETED = "delivery_completed"
    DELIVERY_FAILED = "delivery_failed"
    ETA_UPDATED = "eta_updated"


@dataclass(frozen=True)
class OperationalEvent:
    event_type: EventType
    organization_id: str
    payload: dict[str, Any]
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))
