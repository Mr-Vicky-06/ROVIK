from pydantic import BaseModel, Field


class OperationalPredictionRequest(BaseModel):
    priority: int = Field(default=3, ge=1, le=5)
    distance_km: float = Field(gt=0)
    traffic_level: float = Field(ge=0, le=1)
    weather_severity: float = Field(default=0, ge=0, le=1)
    road_complexity: float = Field(default=0.4, ge=0, le=1)
    rider_workload: int = Field(default=2, ge=0)
    delivery_density: float = Field(default=10, ge=0)
    hour_of_day: int = Field(default=12, ge=0, le=23)
    day_of_week: int = Field(default=1, ge=0, le=6)
    predicted_eta_min: float = Field(default=20, gt=0)
    promised_eta_min: float = Field(default=35, gt=0)
    rider_avg_speed_kmph: float = Field(default=22, gt=0)
    rider_idle_ratio: float = Field(default=0.05, ge=0, le=1)
    rider_completion_rate: float = Field(default=0.92, ge=0, le=1)
    area_delay_rate: float = Field(default=0.15, ge=0, le=1)
    area_avg_traffic_level: float = Field(default=0.35, ge=0, le=1)
    vehicle_type: str = "bike"
    area: str = "T Nagar"


class OperationalPredictionResponse(BaseModel):
    model_version: str
    eta_minutes: float
    delay_probability: float
    eta_model: str
    delay_model: str
    confidence: str
