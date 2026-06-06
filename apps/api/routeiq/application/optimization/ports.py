from typing import Protocol

from routeiq.domain.geo import GeoPoint
from routeiq.domain.optimization import (
    DeliveryOrder,
    OptimizationObjective,
    OptimizationPlan,
    Vehicle,
)


class RoutingService(Protocol):
    async def distance_km(self, origin: GeoPoint, destination: GeoPoint) -> float:
        """Return route distance in kilometers."""


class OptimizationService(Protocol):
    async def optimize(
        self,
        depot: GeoPoint,
        vehicles: list[Vehicle],
        orders: list[DeliveryOrder],
        objective: OptimizationObjective,
    ) -> OptimizationPlan:
        """Build a dispatch and sequencing plan."""
