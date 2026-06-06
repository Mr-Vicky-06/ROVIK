from typing import Protocol

from routeiq.domain.events import OperationalEvent


class EventPublisher(Protocol):
    async def publish(self, event: OperationalEvent) -> None:
        """Publish an operational event."""


class EventStore(Protocol):
    async def append(self, event: OperationalEvent) -> None:
        """Persist an operational event."""
