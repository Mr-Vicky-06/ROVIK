from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os

# Ensure rovik_ml is in path so we can import the VRP solver
ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../../ml"))
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

try:
    from rovik_ml.optimization.vrp_solver import solve_vrp
except ImportError as e:
    raise RuntimeError(f"Could not import rovik_ml. Ensure the path is correct. Error: {e}")

router = APIRouter(prefix="/optimize", tags=["Fleet Optimization"])

class GeoLocation(BaseModel):
    lat: float
    lng: float

class FleetOptimizationRequest(BaseModel):
    depot: GeoLocation
    orders: list[GeoLocation]
    num_vehicles: int

@router.post("/fleet")
async def optimize_fleet(request: FleetOptimizationRequest):
    try:
        # Construct locations list: depot at index 0, followed by all orders
        locations = [(request.depot.lat, request.depot.lng)]
        for order in request.orders:
            locations.append((order.lat, order.lng))
            
        result = solve_vrp(locations, num_vehicles=request.num_vehicles, depot_index=0)
        
        if result["status"] == "NO_SOLUTION_FOUND":
            raise HTTPException(status_code=400, detail="VRP Solver could not find a solution for these parameters.")
        if result["status"] == "INVALID_PARAMETERS":
            raise HTTPException(status_code=400, detail="VRP Solver could not find a solution for these parameters.")
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
