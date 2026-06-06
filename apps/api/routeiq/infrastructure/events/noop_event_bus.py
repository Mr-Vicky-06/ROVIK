from routeiq.application.events.ports import EventPublisher
from routeiq.domain.events import OperationalEvent


class NoopEventPublisher(EventPublisher):
    async def publish(self, event: OperationalEvent) -> None:
        return None
