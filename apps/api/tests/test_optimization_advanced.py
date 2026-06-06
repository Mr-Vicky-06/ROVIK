from fastapi.testclient import TestClient
from routeiq.main import app

client = TestClient(app)

def test_fleet_optimization_valid():
    payload = {
        "depot": {"latitude": 13.0, "longitude": 80.0},
        "vehicles": [
            {"id": "V1", "vehicle_type": "truck", "capacity": 10, "start_location": {"latitude": 13.0, "longitude": 80.0}, "cost_per_km": 1.5},
            {"id": "V2", "vehicle_type": "van", "capacity": 10, "start_location": {"latitude": 13.0, "longitude": 80.0}, "cost_per_km": 1.0}
        ],
        "orders": [
            {"id": "O1", "priority": 1, "service_minutes": 5, "dropoff": {"latitude": 13.1, "longitude": 80.1}},
            {"id": "O2", "priority": 1, "service_minutes": 5, "dropoff": {"latitude": 13.2, "longitude": 80.2}}
        ]
    }
    
    response = client.post("/api/v1/optimize/fleet", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "routes" in data
    assert len(data["routes"]) > 0

def test_fleet_optimization_invalid_payload():
    payload = {
        "depot": {"latitude": 13.0, "longitude": 80.0},
        "vehicles": [], # Invalid: zero vehicles
        "orders": []
    }
    
    response = client.post("/api/v1/optimize/fleet", json=payload)
    
    # Pydantic should catch the validation error and return 422
    assert response.status_code == 422
    assert response.json()["detail"] == "VRP Solver could not find a solution for these parameters."
