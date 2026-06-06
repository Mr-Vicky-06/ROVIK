from routeiq.application.events.ports import EventStore
from routeiq.domain.events import OperationalEvent


class InMemoryEventStore(EventStore):
    def __init__(self) -> None:
        self.events: list[OperationalEvent] = []

    async def append(self, event: OperationalEvent) -> None:
        self.events.append(event)
