import json

from redis.asyncio import Redis

from routeiq.application.events.ports import EventPublisher
from routeiq.core.config import get_settings
from routeiq.domain.events import OperationalEvent


class RedisEventPublisher(EventPublisher):
    def __init__(self, redis: Redis | None = None) -> None:
        settings = get_settings()
        self._redis = redis or Redis.from_url(settings.redis_url, decode_responses=True)

    async def publish(self, event: OperationalEvent) -> None:
        channel = f"rovik:tenant:{event.organization_id}:events"
        await self._redis.publish(
            channel,
            json.dumps(
                {
                    "event_id": event.event_id,
                    "event_type": event.event_type,
                    "organization_id": event.organization_id,
                    "occurred_at": event.occurred_at.isoformat(),
                    "payload": event.payload,
                }
            ),
        )
