from fastapi import APIRouter, Depends
from pydantic import BaseModel

from routeiq.security.auth import require_roles
from routeiq.schemas.auth import Principal, Role
from routeiq.application.intelligence.ml_service import ml_service

router = APIRouter()

class MLPredictionRequest(BaseModel):
    distance_km: float
    hour_of_day: int
    day_of_week: int
    is_weekend: int
    rider_historical_speed: float
    rider_deliveries: int
    package_weight: float
    priority_level: int
    traffic_congestion_index: float
    weather_severity_index: int

class ETAPredictionResponse(BaseModel):
    predicted_eta_minutes: float
    
class DelayPredictionResponse(BaseModel):
    predicted_delay_minutes: float

class SLARiskResponse(BaseModel):
    is_at_risk: bool
    risk_probability: float

@router.post("/predict-eta", response_model=ETAPredictionResponse)
async def predict_eta(
    request: MLPredictionRequest,
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER))
):
    features = request.model_dump()
    pred = ml_service.predict_eta_minutes(features)
    return ETAPredictionResponse(predicted_eta_minutes=pred)

@router.post("/predict-delay", response_model=DelayPredictionResponse)
async def predict_delay(
    request: MLPredictionRequest,
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER))
):
    features = request.model_dump()
    pred = ml_service.predict_delay_minutes(features)
    return DelayPredictionResponse(predicted_delay_minutes=pred)

@router.post("/risk-assessment", response_model=SLARiskResponse)
async def predict_sla_risk(
    request: MLPredictionRequest,
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER))
):
    features = request.model_dump()
    is_at_risk, risk_prob = ml_service.predict_sla_risk(features)
    
    return SLARiskResponse(
        is_at_risk=is_at_risk,
        risk_probability=risk_prob
    )
