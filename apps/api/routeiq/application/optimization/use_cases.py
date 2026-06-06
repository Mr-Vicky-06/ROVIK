from routeiq.application.optimization.ports import OptimizationService
from routeiq.domain.geo import GeoPoint
from routeiq.domain.optimization import DeliveryOrder, OptimizationObjective, Vehicle
from routeiq.schemas.optimization import OptimizationRequest, OptimizationResponse


class OptimizeRoutesUseCase:
    def __init__(self, optimizer: OptimizationService) -> None:
        self._optimizer = optimizer

    async def execute(self, request: OptimizationRequest) -> OptimizationResponse:
        plan = await self._optimizer.optimize(
            depot=GeoPoint(**request.depot.model_dump()),
            vehicles=[
                Vehicle(
                    id=vehicle.id,
                    vehicle_type=vehicle.vehicle_type,
                    capacity=vehicle.capacity,
                    start_location=GeoPoint(**vehicle.start_location.model_dump()),
                    cost_per_km=vehicle.cost_per_km,
                )
                for vehicle in request.vehicles
            ],
            orders=[
                DeliveryOrder(
                    id=order.id,
                    priority=order.priority,
                    service_minutes=order.service_minutes,
                    dropoff=GeoPoint(**order.dropoff.model_dump()),
                )
                for order in request.orders
            ],
            objective=OptimizationObjective(**request.objective.model_dump()),
        )
        return OptimizationResponse.from_domain(plan)
