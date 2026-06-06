from routeiq.application.events.ports import EventPublisher, EventStore
from routeiq.application.optimization.use_cases import OptimizeRoutesUseCase
from routeiq.domain.events import EventType, OperationalEvent
from routeiq.schemas.dispatch import DispatchPlanRequest, DispatchPlanResponse


class CreateDispatchPlanUseCase:
    def __init__(
        self,
        optimizer: OptimizeRoutesUseCase,
        publisher: EventPublisher,
        event_store: EventStore,
    ) -> None:
        self._optimizer = optimizer
        self._publisher = publisher
        self._event_store = event_store

    async def execute(self, organization_id: str, request: DispatchPlanRequest) -> DispatchPlanResponse:
        optimization = await self._optimizer.execute(request.optimization)
        event = OperationalEvent(
            event_type=EventType.ROUTE_GENERATED,
            organization_id=organization_id,
            payload=optimization.model_dump(),
        )
        await self._event_store.append(event)
        await self._publisher.publish(event)
        return DispatchPlanResponse(plan_id=event.event_id, optimization=optimization)
