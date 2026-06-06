from functools import lru_cache

from routeiq.application.dispatch.use_cases import CreateDispatchPlanUseCase
from routeiq.application.optimization.use_cases import OptimizeRoutesUseCase
from routeiq.core.config import get_settings
from routeiq.infrastructure.events.memory_event_store import InMemoryEventStore
from routeiq.infrastructure.events.redis_event_bus import RedisEventPublisher
from routeiq.infrastructure.optimization.heuristic_optimizer import HeuristicOptimizationService
from routeiq.infrastructure.optimization.ortools_optimizer import OrToolsOptimizationService
from routeiq.infrastructure.routing.haversine_router import HaversineRoutingService


@lru_cache
def get_optimize_routes_use_case() -> OptimizeRoutesUseCase:
    settings = get_settings()
    routing = HaversineRoutingService()
    if settings.optimization_provider == "ortools":
        optimizer = OrToolsOptimizationService(routing_service=routing)
    else:
        optimizer = HeuristicOptimizationService(routing_service=routing)
    return OptimizeRoutesUseCase(optimizer=optimizer)


@lru_cache
def get_dispatch_plan_use_case() -> CreateDispatchPlanUseCase:
    return CreateDispatchPlanUseCase(
        optimizer=get_optimize_routes_use_case(),
        publisher=RedisEventPublisher(),
        event_store=InMemoryEventStore(),
    )
