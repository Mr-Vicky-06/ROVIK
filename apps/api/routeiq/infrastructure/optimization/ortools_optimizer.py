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
from routeiq.infrastructure.optimization.heuristic_optimizer import HeuristicOptimizationService
from routeiq.application.intelligence.ml_service import ml_service
import datetime


class OrToolsOptimizationService:
    """Vehicle-routing optimizer backed by Google OR-Tools with a heuristic safety fallback."""

    def __init__(self, routing_service: RoutingService) -> None:
        self._routing_service = routing_service
        self._fallback = HeuristicOptimizationService(routing_service)

    async def optimize(
        self,
        depot: GeoPoint,
        vehicles: list[Vehicle],
        orders: list[DeliveryOrder],
        objective: OptimizationObjective,
    ) -> OptimizationPlan:
        _ = depot
        _ = objective
        try:
            from ortools.constraint_solver import pywrapcp, routing_enums_pb2
        except ImportError:
            return await self._fallback.optimize(depot, vehicles, orders, objective)

        if not vehicles or not orders:
            return await self._fallback.optimize(depot, vehicles, orders, objective)

        locations = [vehicle.start_location for vehicle in vehicles] + [order.dropoff for order in orders]
        starts = list(range(len(vehicles)))
        manager = pywrapcp.RoutingIndexManager(len(locations), len(vehicles), starts, starts)
        routing = pywrapcp.RoutingModel(manager)
        distance_matrix = await self._distance_matrix(locations)

        def distance_callback(from_index: int, to_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        demands = [0 for _vehicle in vehicles] + [1 for _order in orders]

        def demand_callback(from_index: int) -> int:
            return demands[manager.IndexToNode(from_index)]

        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,
            [max(vehicle.capacity, 0) for vehicle in vehicles],
            True,
            "capacity",
        )

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(3)
        solution = routing.SolveWithParameters(search_parameters)
        if solution is None:
            return await self._fallback.optimize(depot, vehicles, orders, objective)

        routes: list[VehicleRoute] = []
        assigned_order_ids: set[str] = set()
        for vehicle_index, vehicle in enumerate(vehicles):
            index = routing.Start(vehicle_index)
            route = VehicleRoute(vehicle_id=vehicle.id)
            previous_node = manager.IndexToNode(index)
            while not routing.IsEnd(index):
                index = solution.Value(routing.NextVar(index))
                node = manager.IndexToNode(index)
                if node >= len(vehicles):
                    order = orders[node - len(vehicles)]
                    distance_km = distance_matrix[previous_node][node] / 1000
                    route.total_distance_km += distance_km
                    route.total_cost += distance_km * vehicle.cost_per_km
                    route.estimated_duration_minutes += self._estimate_minutes(distance_km)
                    route.stops.append(
                        RouteStop(
                            sequence=len(route.stops) + 1,
                            order_id=order.id,
                            location=order.dropoff,
                            distance_from_previous_km=round(distance_km, 3),
                            eta_minutes=route.estimated_duration_minutes,
                        )
                    )
                    assigned_order_ids.add(order.id)
                previous_node = node
            route.total_distance_km = round(route.total_distance_km, 3)
            route.total_cost = round(route.total_cost, 2)
            routes.append(route)

        return OptimizationPlan(
            routes=routes,
            unassigned_order_ids=[order.id for order in orders if order.id not in assigned_order_ids],
            total_distance_km=round(sum(route.total_distance_km for route in routes), 3),
            total_cost=round(sum(route.total_cost for route in routes), 2),
        )

    async def _distance_matrix(self, locations: list[GeoPoint]) -> list[list[int]]:
        import httpx
        from routeiq.core.config import get_settings
        
        settings = get_settings()
        
        # If configured for OSRM or as high-speed default, query bulk table API
        try:
            coords = ";".join([f"{loc.longitude},{loc.latitude}" for loc in locations])
            # Attempt both internal docker networks and local localhost hosts
            urls = [
                f"http://osrm-driving:5000/table/v1/driving/{coords}?annotations=distance",
                f"http://localhost:5000/table/v1/driving/{coords}?annotations=distance",
                f"http://127.0.0.1:5000/table/v1/driving/{coords}?annotations=distance"
            ]
            async with httpx.AsyncClient(timeout=2.0) as client:
                for url in urls:
                    try:
                        response = await client.get(url)
                        if response.status_code == 200:
                            data = response.json()
                            if "distances" in data:
                                # OSRM returns distances in meters, which fits OR-Tools perfectly
                                return [[int(val) for val in row] for row in data["distances"]]
                    except Exception:
                        continue
        except Exception:
            pass # Fall back to Haversine calculations if OSRM is not initialized

        # Safe fallback Haversine distance matrix logic
        matrix: list[list[int]] = []
        for origin in locations:
            row: list[int] = []
            for destination in locations:
                distance_km = await self._routing_service.distance_km(origin, destination)
                row.append(round(distance_km * 1000))
            matrix.append(row)
        return matrix

    @staticmethod
    def _estimate_minutes(distance_km: float) -> int:
        now = datetime.datetime.now()
        features = {
            "distance_km": distance_km,
            "hour_of_day": now.hour,
            "day_of_week": now.weekday(),
            "is_weekend": 1 if now.weekday() >= 5 else 0,
            "rider_historical_speed": 24.0, # Assumed baseline
            "package_weight": 5.0, # Assumed baseline
            "traffic_congestion_index": 1.2 if now.hour in [8, 9, 17, 18] else 1.0
        }
        pred_minutes = ml_service.predict_eta_minutes(features)
        return max(1, round(pred_minutes))
