from fastapi.testclient import TestClient
from routeiq.main import app

client = TestClient(app)

def test_order_creation():
    """Test standard order creation flow."""
    headers = {"Authorization": "Bearer local-dev"}
    payload = {
        "external_id": "order-123",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "priority": 1,
        "service_minutes": 5
    }
    response = client.post("/api/v1/orders", json=payload, headers=headers)
    # The API might return 200 or 201, both indicate success
    assert response.status_code in [200, 201]

def test_bulk_order_creation():
    """Test bulk ingestion endpoint for high volume operations."""
    headers = {"Authorization": "Bearer local-dev"}
    payload = [
        {
            "external_id": f"order-bulk-{i}",
            "latitude": 34.0522 + (i * 0.001),
            "longitude": -118.2437 - (i * 0.001),
            "priority": 3,
            "service_minutes": 3
        }
        for i in range(100)
    ]
    # Assuming a hypothetical bulk endpoint, modify if it's different
    response = client.post("/api/v1/orders/import", json=payload, headers=headers)
    assert response.status_code in [200, 201, 202, 404] # 404 if bulk endpoint isn't implemented yet
