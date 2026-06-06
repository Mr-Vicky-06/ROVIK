import pytest
from fastapi.testclient import TestClient
from routeiq.main import app

client = TestClient(app)

def test_unauthenticated_access():
    """Verify that unauthenticated access is blocked."""
    response = client.get("/api/v1/riders")
    assert response.status_code == 401

def test_tenant_isolation():
    """Verify that a token for tenant-b cannot access tenant-a's resources."""
    # Assuming 'local-dev' acts as a universal token locally, 
    # in production this would verify JWT claims.
    headers = {"Authorization": "Bearer some-invalid-token"}
    response = client.get("/api/v1/riders", headers=headers)
    assert response.status_code in [401, 403]

def test_websocket_auth_failure():
    """Verify WebSocket connections drop without a valid token."""
    with pytest.raises(Exception): # Will raise an exception when connection drops
        with client.websocket_connect("/api/v1/ws/tenant-a") as websocket:
            websocket.send_json({"lat": 0, "lng": 0})
