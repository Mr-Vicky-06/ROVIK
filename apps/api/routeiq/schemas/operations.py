from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from routeiq.schemas.optimization import GeoPointSchema


class DeliveryCreate(BaseModel):
    external_id: str = Field(min_length=1)
    priority: int = Field(default=3, ge=1, le=5)
    service_minutes: int = Field(default=5, ge=0, le=240)
    dropoff: GeoPointSchema


class DeliveryRead(DeliveryCreate):
    id: str
    status: str




class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=255)
    customer_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_address: str = Field(min_length=5)
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    delivery_latitude: float
    delivery_longitude: float
    priority: int = Field(default=3, ge=1, le=5)
    package_weight: Optional[float] = None
    package_dimensions: Optional[str] = None
    vehicle_requirement: Optional[str] = None
    delivery_deadline: Optional[datetime] = None
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    priority: Optional[int] = None
    package_weight: Optional[float] = None
    package_dimensions: Optional[str] = None
    vehicle_requirement: Optional[str] = None
    delivery_deadline: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class OrderRead(OrderCreate):
    id: str
    organization_id: str
    status: str
    created_at: datetime



class RiderCreate(BaseModel):
    external_id: str = Field(min_length=1)
    vehicle_type: str = Field(min_length=1)
    capacity: int = Field(default=1, ge=1, le=500)
    start_location: GeoPointSchema | None = None


class RiderRead(RiderCreate):
    id: str
    status: str


class RiderLocationUpdate(BaseModel):
    rider_id: str = Field(min_length=1)
    location: GeoPointSchema
    heading_degrees: float | None = Field(default=None, ge=0, le=360)
    speed_kmph: float | None = Field(default=None, ge=0)
