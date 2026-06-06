from pydantic import BaseModel

from routeiq.schemas.optimization import OptimizationRequest, OptimizationResponse


class DispatchPlanRequest(BaseModel):
    optimization: OptimizationRequest


class DispatchPlanResponse(BaseModel):
    plan_id: str
    optimization: OptimizationResponse
