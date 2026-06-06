from fastapi import APIRouter, Depends

from routeiq.domain.events import EventType
from routeiq.schemas.auth import Principal, Role
from routeiq.security.auth import require_roles

router = APIRouter()


@router.get("/types", response_model=list[str])
async def event_types(
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER)),
) -> list[str]:
    _ = principal
    return [event_type.value for event_type in EventType]
