from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math

def compute_haversine_distance_matrix(locations):
    """
    Computes a distance matrix in meters using Haversine formula.
    locations: list of tuples (lat, lng)
    """
    def haversine(coord1, coord2):
        R = 6371000  # Radius of Earth in meters
        lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
        lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return int(R * c)

    size = len(locations)
    matrix = []
    for i in range(size):
        row = []
        for j in range(size):
            if i == j:
                row.append(0)
            else:
                row.append(haversine(locations[i], locations[j]))
        matrix.append(row)
    return matrix

def solve_vrp(orders_locations, num_vehicles=3, depot_index=0):
    """
    Solves the Vehicle Routing Problem using Google OR-Tools.
    orders_locations: list of (lat, lng) tuples where the first item is the depot.
    """
    if num_vehicles < 1:
        return {"status": "INVALID_PARAMETERS"}
        
    # 1. Create Data Model
    data = {}
    data['distance_matrix'] = compute_haversine_distance_matrix(orders_locations)
    data['num_vehicles'] = num_vehicles
    data['depot'] = depot_index

    # 2. Create Routing Index Manager and Model
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    # 3. Create Distance Callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 4. Set Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    
    # 5. Solve
    solution = routing.SolveWithParameters(search_parameters)

    # 6. Parse Solution
    if not solution:
        return {"status": "NO_SOLUTION_FOUND"}

    routes = []
    max_route_distance = 0
    total_distance = 0
    
    for vehicle_id in range(data['num_vehicles']):
        index = routing.Start(vehicle_id)
        route_distance = 0
        route_path = []
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route_path.append(node)
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
            
        route_path.append(manager.IndexToNode(index))
        routes.append({
            "vehicle_id": vehicle_id,
            "route": route_path,
            "distance_meters": route_distance
        })
        total_distance += route_distance

    return {
        "status": "SUCCESS",
        "total_distance_meters": total_distance,
        "routes": routes
    }
