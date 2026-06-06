from dataclasses import dataclass, field

from routeiq.domain.geo import GeoPoint


@dataclass(frozen=True)
class Vehicle:
    id: str
    vehicle_type: str
    capacity: int
    start_location: GeoPoint
    cost_per_km: float


@dataclass(frozen=True)
class DeliveryOrder:
    id: str
    priority: int
    service_minutes: int
    dropoff: GeoPoint


@dataclass(frozen=True)
class OptimizationObjective:
    minimize_distance: bool = True
    balance_workload: bool = True
    priority_weight: float = 1.0


@dataclass
class RouteStop:
    sequence: int
    order_id: str
    location: GeoPoint
    distance_from_previous_km: float
    eta_minutes: int


@dataclass
class VehicleRoute:
    vehicle_id: str
    stops: list[RouteStop] = field(default_factory=list)
    total_distance_km: float = 0.0
    total_cost: float = 0.0
    estimated_duration_minutes: int = 0


@dataclass
class OptimizationPlan:
    routes: list[VehicleRoute]
    unassigned_order_ids: list[str]
    total_distance_km: float
    total_cost: float
