from routeiq.application.optimization.ports import RoutingService
from routeiq.domain.geo import GeoPoint
from routeiq.domain.optimization import (
    DeliveryOrder,
    OptimizationObjective,
    OptimizationPlan,
    RouteStop,
    Vehicle,
    VehicleRoute,
)


class HeuristicOptimizationService:
    """Deterministic Phase 1 optimizer with the same boundary an OR-Tools adapter will use."""

    def __init__(self, routing_service: RoutingService) -> None:
        self._routing_service = routing_service

    async def optimize(
        self,
        depot: GeoPoint,
        vehicles: list[Vehicle],
        orders: list[DeliveryOrder],
        objective: OptimizationObjective,
    ) -> OptimizationPlan:
        if not vehicles:
            return OptimizationPlan(
                routes=[],
                unassigned_order_ids=[order.id for order in orders],
                total_distance_km=0.0,
                total_cost=0.0,
            )

        ordered = sorted(orders, key=lambda order: (order.priority, order.id))
        routes = {vehicle.id: VehicleRoute(vehicle_id=vehicle.id) for vehicle in vehicles}
        current_locations = {vehicle.id: vehicle.start_location for vehicle in vehicles}
        assigned_counts = {vehicle.id: 0 for vehicle in vehicles}
        unassigned: list[str] = []

        for order in ordered:
            candidates = [
                vehicle
                for vehicle in vehicles
                if assigned_counts[vehicle.id] < max(vehicle.capacity, 0)
            ]
            if not candidates:
                unassigned.append(order.id)
                continue

            vehicle = await self._select_vehicle(
                candidates=candidates,
                current_locations=current_locations,
                assigned_counts=assigned_counts,
                order=order,
                objective=objective,
            )
            previous = current_locations[vehicle.id]
            distance = await self._routing_service.distance_km(previous, order.dropoff)
            route = routes[vehicle.id]
            route.total_distance_km += distance
            route.total_cost += distance * vehicle.cost_per_km
            route.estimated_duration_minutes += self._estimate_minutes(distance) + order.service_minutes
            route.stops.append(
                RouteStop(
                    sequence=len(route.stops) + 1,
                    order_id=order.id,
                    location=order.dropoff,
                    distance_from_previous_km=round(distance, 3),
                    eta_minutes=route.estimated_duration_minutes,
                )
            )
            current_locations[vehicle.id] = order.dropoff
            assigned_counts[vehicle.id] += 1

        route_list = list(routes.values())
        for route in route_list:
            route.total_distance_km = round(route.total_distance_km, 3)
            route.total_cost = round(route.total_cost, 2)

        return OptimizationPlan(
            routes=route_list,
            unassigned_order_ids=unassigned,
            total_distance_km=round(sum(route.total_distance_km for route in route_list), 3),
            total_cost=round(sum(route.total_cost for route in route_list), 2),
        )

    async def _select_vehicle(
        self,
        candidates: list[Vehicle],
        current_locations: dict[str, GeoPoint],
        assigned_counts: dict[str, int],
        order: DeliveryOrder,
        objective: OptimizationObjective,
    ) -> Vehicle:
        scored: list[tuple[float, str, Vehicle]] = []
        for vehicle in candidates:
            distance = await self._routing_service.distance_km(
                current_locations[vehicle.id],
                order.dropoff,
            )
            workload_penalty = assigned_counts[vehicle.id] * 0.8 if objective.balance_workload else 0.0
            priority_discount = (5 - order.priority) * objective.priority_weight * 0.05
            score = distance + workload_penalty - priority_discount
            scored.append((score, vehicle.id, vehicle))
        return min(scored, key=lambda item: (item[0], item[1]))[2]

    @staticmethod
    def _estimate_minutes(distance_km: float) -> int:
        average_urban_speed_kmph = 24
        return max(1, round((distance_km / average_urban_speed_kmph) * 60))
