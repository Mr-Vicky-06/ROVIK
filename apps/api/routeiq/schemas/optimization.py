from pydantic import BaseModel, Field

from routeiq.domain.optimization import OptimizationPlan


class GeoPointSchema(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class VehicleInput(BaseModel):
    id: str = Field(min_length=1)
    vehicle_type: str = Field(min_length=1)
    capacity: int = Field(ge=0, le=500)
    start_location: GeoPointSchema
    cost_per_km: float = Field(gt=0)


class OrderInput(BaseModel):
    id: str = Field(min_length=1)
    priority: int = Field(default=3, ge=1, le=5)
    service_minutes: int = Field(default=5, ge=0, le=240)
    dropoff: GeoPointSchema


class ObjectiveInput(BaseModel):
    minimize_distance: bool = True
    balance_workload: bool = True
    priority_weight: float = Field(default=1.0, ge=0, le=10)


class OptimizationRequest(BaseModel):
    depot: GeoPointSchema
    vehicles: list[VehicleInput] = Field(min_length=1, max_length=500)
    orders: list[OrderInput] = Field(min_length=1, max_length=5000)
    objective: ObjectiveInput = Field(default_factory=ObjectiveInput)


class RouteStopOutput(BaseModel):
    sequence: int
    order_id: str
    location: GeoPointSchema
    distance_from_previous_km: float
    eta_minutes: int


class VehicleRouteOutput(BaseModel):
    vehicle_id: str
    stops: list[RouteStopOutput]
    total_distance_km: float
    total_cost: float
    estimated_duration_minutes: int


class OptimizationResponse(BaseModel):
    routes: list[VehicleRouteOutput]
    unassigned_order_ids: list[str]
    total_distance_km: float
    total_cost: float

    @classmethod
    def from_domain(cls, plan: OptimizationPlan) -> "OptimizationResponse":
        return cls(
            routes=[
                VehicleRouteOutput(
                    vehicle_id=route.vehicle_id,
                    stops=[
                        RouteStopOutput(
                            sequence=stop.sequence,
                            order_id=stop.order_id,
                            location=GeoPointSchema(
                                latitude=stop.location.latitude,
                                longitude=stop.location.longitude,
                            ),
                            distance_from_previous_km=stop.distance_from_previous_km,
                            eta_minutes=stop.eta_minutes,
                        )
                        for stop in route.stops
                    ],
                    total_distance_km=route.total_distance_km,
                    total_cost=route.total_cost,
                    estimated_duration_minutes=route.estimated_duration_minutes,
                )
                for route in plan.routes
            ],
            unassigned_order_ids=plan.unassigned_order_ids,
            total_distance_km=plan.total_distance_km,
            total_cost=plan.total_cost,
        )
