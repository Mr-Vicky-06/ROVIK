from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Enum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func
import enum


class Base(DeclarativeBase):
    pass


# ==============================================================================
# ENUMS
# ==============================================================================
class OrderStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    picked_up = "picked_up"
    in_transit = "in_transit"
    delivered = "delivered"
    failed = "failed"
    cancelled = "cancelled"

class RiderStatus(str, enum.Enum):
    offline = "offline"
    available = "available"
    busy = "busy"
    break_time = "break"
    inactive = "inactive"

class RouteStatus(str, enum.Enum):
    draft = "draft"
    optimized = "optimized"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"

class OptimizationStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


# ==============================================================================
# CORE SAAS & TENANCY
# ==============================================================================
class OrganizationModel(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="enterprise")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class OrganizationSettingsModel(Base):
    __tablename__ = "organization_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), unique=True)
    routing_preferences: Mapped[dict] = mapped_column(JSONB, nullable=True)
    sla_settings: Mapped[dict] = mapped_column(JSONB, nullable=True)
    branding_settings: Mapped[dict] = mapped_column(JSONB, nullable=True)
    notification_settings: Mapped[dict] = mapped_column(JSONB, nullable=True)

class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ==============================================================================
# LOGISTICS OPERATIONS
# ==============================================================================
class VehicleModel(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class RiderModel(Base):
    __tablename__ = "riders"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True)
    vehicle_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("vehicles.id"), nullable=True)
    status: Mapped[RiderStatus] = mapped_column(Enum(RiderStatus), nullable=False, default=RiderStatus.offline)
    current_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    availability: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class OrderModel(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    order_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pickup_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    pickup_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    delivery_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False, default="medium")
    package_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    package_dimensions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    delivery_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class OrderImportJobModel(Base):
    __tablename__ = "order_import_jobs"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    import_type: Mapped[str] = mapped_column(String(50), nullable=False, default="csv")
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    success_rows: Mapped[int] = mapped_column(Integer, default=0)
    failed_rows: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    metadata_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class OrderImportRowModel(Base):
    __tablename__ = "order_import_rows"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    job_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("order_import_jobs.id", ondelete="CASCADE"), index=True)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    parsed_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    validation_errors: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class RouteModel(Base):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    route_name: Mapped[str] = mapped_column(String(255), nullable=False)
    optimization_job_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("optimization_jobs.id"), nullable=True)
    total_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_duration_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[RouteStatus] = mapped_column(Enum(RouteStatus), nullable=False, default=RouteStatus.draft)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class RouteStopModel(Base):
    __tablename__ = "route_stops"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    route_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("routes.id"), index=True)
    order_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("orders.id"), index=True)
    stop_sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class DispatchAssignmentModel(Base):
    __tablename__ = "dispatch_assignments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    route_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("routes.id"), index=True)
    rider_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("riders.id"), index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")


# ==============================================================================
# TELEMETRY & OBSERVABILITY
# ==============================================================================
class TelemetryCurrentModel(Base):
    __tablename__ = "telemetry_current"
    # Using BIGSERIAL for hyper-fast inserts or string UUID. Spec asks for ID BIGSERIAL, let's stick to spec.
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rider_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("riders.id"), unique=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    heading: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class TelemetryHistoryModel(Base):
    __tablename__ = "telemetry_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rider_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("riders.id"), index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    heading: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

class EventModel(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    correlation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trace_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class OptimizationJobModel(Base):
    __tablename__ = "optimization_jobs"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    total_riders: Mapped[int] = mapped_column(Integer, default=0)
    optimization_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[OptimizationStatus] = mapped_column(Enum(OptimizationStatus), nullable=False, default=OptimizationStatus.queued)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class OperationalIncidentModel(Base):
    __tablename__ = "operational_incidents"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    incident_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_entity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class AiContextModel(Base):
    __tablename__ = "ai_context"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    context_type: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(String(100), nullable=False)
    source_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    embedding_reference: Mapped[str | None] = mapped_column(String(255), nullable=True) # Will become vector(1536) in pgvector
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class NotificationModel(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[Text] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="unread")

class AuditLogModel(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    actor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    metadata_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class FileModel(Base):
    __tablename__ = "files"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), index=True)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_provider: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
