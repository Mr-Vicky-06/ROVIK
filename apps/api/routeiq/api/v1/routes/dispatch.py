from fastapi import APIRouter, Depends

from routeiq.application.dispatch.use_cases import CreateDispatchPlanUseCase
from routeiq.dependencies import get_dispatch_plan_use_case
from routeiq.schemas.auth import Principal, Role
from routeiq.schemas.dispatch import DispatchPlanRequest, DispatchPlanResponse
from routeiq.security.auth import require_roles

router = APIRouter()


@router.post("/plans", response_model=DispatchPlanResponse, status_code=202)
async def create_dispatch_plan(
    payload: DispatchPlanRequest,
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER)),
    use_case: CreateDispatchPlanUseCase = Depends(get_dispatch_plan_use_case),
) -> DispatchPlanResponse:
    return await use_case.execute(principal.organization_id, payload)
