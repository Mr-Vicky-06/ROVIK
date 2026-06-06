from collections import defaultdict
from typing import Any
import json
from redis.asyncio import Redis

from fastapi import WebSocket
from routeiq.core.config import get_settings


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        settings = get_settings()
        self._redis = Redis.from_url(settings.redis_url, decode_responses=True)

    async def connect(self, organization_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[organization_id].add(websocket)

    def disconnect(self, organization_id: str, websocket: WebSocket) -> None:
        self._connections[organization_id].discard(websocket)
        if not self._connections[organization_id]:
            del self._connections[organization_id]

    async def broadcast(self, organization_id: str, message: dict[str, Any]) -> None:
        # Publish broadcast to Redis so all clustered backend nodes synchronize
        try:
            channel = f"rovik:tenant:{organization_id}:events"
            await self._redis.publish(channel, json.dumps(message))
        except Exception:
            # Fallback directly to local sockets broadcast if Redis is offline
            await self._local_broadcast(organization_id, message)

    async def _local_broadcast(self, organization_id: str, message: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for connection in self._connections.get(organization_id, set()):
            try:
                await connection.send_json(message)
            except RuntimeError:
                stale.append(connection)
        for connection in stale:
            self.disconnect(organization_id, connection)

    async def start_redis_listener(self) -> None:
        import asyncio
        pubsub = self._redis.pubsub()
        await pubsub.psubscribe("rovik:tenant:*:events")
        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    try:
                        channel = message["channel"]
                        parts = channel.split(":")
                        if len(parts) >= 3:
                            organization_id = parts[2]
                            data = json.loads(message["data"])
                            await self._local_broadcast(organization_id, data)
                    except Exception:
                        pass
        except asyncio.CancelledError:
            await pubsub.punsubscribe("rovik:tenant:*:events")
        except Exception:
            pass


connection_manager = ConnectionManager()
