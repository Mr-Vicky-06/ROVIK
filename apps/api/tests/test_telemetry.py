from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from routeiq.main import app

client = TestClient(app)

@patch("routeiq.realtime.connection_manager.connection_manager.broadcast")
@patch("routeiq.api.v1.routes.tracking.decode_token")
@patch("routeiq.api.v1.routes.tracking.telemetry_filter.filter_and_smooth")
def test_websocket_telemetry(mock_filter, mock_decode, mock_broadcast):
    mock_principal = MagicMock()
    mock_principal.tenant_id = "tenant-1"
    mock_decode.return_value = mock_principal
    
    # Ensure the telemetry filter doesn't discard our payload due to an old timestamp
    mock_filter.return_value = (False, 13.0827, 80.2707)

    # Establish a websocket connection to the tracking router
    with client.websocket_connect("/api/v1/tracking/ws/tenant-1?token=test-token") as websocket:
        # Send a valid GPS payload
        payload = {
            "tenant_id": "tenant-1",
            "rider_id": "rider-1",
            "lat": 13.0827,
            "lng": 80.2707,
            "speed": 25.5,
            "timestamp": 1234567890
        }
        websocket.send_json(payload)
        
        # Verify the backend broadcasted it to Redis via connection_manager
        # We can't verify the ACK easily because this websocket logic doesn't send ACKs, it just broadcasts.
        assert mock_broadcast.called
