from pydantic import BaseModel, Field


class DeliveryTrainingRecord(BaseModel):
    distance_km: float = Field(ge=0)
    traffic_level: float = Field(ge=0, le=1)
    weather_severity: float = Field(ge=0, le=1)
    rider_avg_speed_kmph: float = Field(gt=0)
    delivery_density: float = Field(ge=0)
    vehicle_type: str
    road_complexity: float = Field(ge=0, le=1)
    historical_route_duration_min: float = Field(ge=0)
    hour_of_day: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    rider_workload: int = Field(ge=0)
    promised_eta_min: float = Field(ge=0)
    actual_eta_min: float = Field(ge=0)
    delayed: int = Field(ge=0, le=1)
    rider_efficiency_score: float = Field(ge=0, le=100)


class ModelMetrics(BaseModel):
    model_name: str
    dataset_rows: int
    metrics: dict[str, float]
    artifact_path: str
