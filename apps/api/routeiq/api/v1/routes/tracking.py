from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from routeiq.core.config import get_settings
from routeiq.realtime.connection_manager import connection_manager
from routeiq.security.auth import decode_token
from routeiq.infrastructure.routing.telemetry_filter import telemetry_filter

router = APIRouter()


@router.websocket("/ws")
@router.websocket("/ws/{organization_id}")
async def tracking_socket(
    websocket: WebSocket, 
    organization_id: str | None = None,
    token: str | None = Query(None)
) -> None:
    try:
        settings = get_settings()
        actual_token = token
        if not actual_token and settings.auth_disabled:
            actual_token = "local-dev"

        if not actual_token:
            await websocket.accept()
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
            return

        principal = decode_token(actual_token)
        if organization_id is None:
            organization_id = principal.organization_id
            
        if principal.organization_id != organization_id:
            await websocket.accept()
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Tenant mismatch")
            return
    except Exception:
        await websocket.accept()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized token")
        return

    await connection_manager.connect(organization_id, websocket)
    try:
        while True:
            message = await websocket.receive_json()
            # Enforce strict tenant boundary on broadcast packets
            message["organization_id"] = organization_id

            # Telemetry validation & smoothing
            rider_id = message.get("rider_id")
            lat = message.get("lat")
            lng = message.get("lng")
            speed = message.get("speed")
            timestamp = message.get("timestamp")

            if rider_id and lat is not None and lng is not None:
                should_filter, smoothed_lat, smoothed_lng = await telemetry_filter.filter_and_smooth(
                    rider_id, float(lat), float(lng), 
                    float(speed) if speed is not None else None, 
                    float(timestamp) if timestamp is not None else None
                )
                if should_filter:
                    # Skip broadcasting noisy or stationary packets to reduce load
                    continue
                message["lat"] = smoothed_lat
                message["lng"] = smoothed_lng

            await connection_manager.broadcast(organization_id, message)
    except WebSocketDisconnect:
        connection_manager.disconnect(organization_id, websocket)
