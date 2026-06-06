CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    external_id TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    last_location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    external_id TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    external_id TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3,
    service_minutes INTEGER NOT NULL DEFAULT 5,
    pickup_location GEOGRAPHY(Point, 4326),
    dropoff_location GEOGRAPHY(Point, 4326) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    external_id TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS rider_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    rider_id UUID NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    speed_kmph DOUBLE PRECISION,
    heading_degrees DOUBLE PRECISION,
    route_id UUID,
    delivery_id UUID,
    state TEXT NOT NULL DEFAULT 'active',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rider_telemetry_hourly (
    tenant_id UUID NOT NULL,
    rider_id UUID NOT NULL,
    bucket_start TIMESTAMPTZ NOT NULL,
    avg_speed_kmph DOUBLE PRECISION,
    idle_minutes DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    location_count INTEGER NOT NULL,
    PRIMARY KEY (tenant_id, rider_id, bucket_start)
);

CREATE TABLE IF NOT EXISTS ml_training_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    metrics JSONB NOT NULL,
    artifact_path TEXT NOT NULL,
    artifact_size_mb DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_operational_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    -- Local Stage 1 uses a portable array. Production can migrate this to pgvector VECTOR(384).
    embedding DOUBLE PRECISION[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles USING GIST (last_location);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_dropoff ON delivery_orders USING GIST (dropoff_location);
CREATE INDEX IF NOT EXISTS idx_riders_tenant_status ON riders (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_status ON deliveries (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_operational_events_tenant_time ON operational_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_rider_telemetry_location ON rider_telemetry USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_rider_telemetry_tenant_time ON rider_telemetry (tenant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operational_memory_tenant_type ON ai_operational_memory (tenant_id, memory_type);
