from fastapi import APIRouter, Depends

from routeiq.application.optimization.use_cases import OptimizeRoutesUseCase
from routeiq.dependencies import get_optimize_routes_use_case
from routeiq.schemas.optimization import OptimizationRequest, OptimizationResponse

router = APIRouter()


@router.post("/fleet", response_model=OptimizationResponse, status_code=202)
async def create_optimization(
    payload: OptimizationRequest,
    use_case: OptimizeRoutesUseCase = Depends(get_optimize_routes_use_case),
) -> OptimizationResponse:
    return await use_case.execute(payload)
