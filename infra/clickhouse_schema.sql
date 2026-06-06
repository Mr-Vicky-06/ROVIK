CREATE DATABASE IF NOT EXISTS rovik_telemetry;

-- High-frequency telemetry table
CREATE TABLE IF NOT EXISTS rovik_telemetry.rider_gps
(
    tenant_id UUID,
    rider_id UUID,
    timestamp DateTime64(3, 'UTC'),
    lat Float64,
    lng Float64,
    speed_kmph Float32,
    heading_degrees Float32
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, rider_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY DELETE; -- Automatically purges data older than 30 days to save space

-- Aggregated table for downsampling (to be populated via materialized view or background cron)
CREATE TABLE IF NOT EXISTS rovik_telemetry.rider_gps_1min_agg
(
    tenant_id UUID,
    rider_id UUID,
    timestamp_minute DateTime,
    avg_lat Float64,
    avg_lng Float64,
    avg_speed Float32
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp_minute)
ORDER BY (tenant_id, rider_id, timestamp_minute)
TTL timestamp_minute + INTERVAL 365 DAY DELETE; -- Keep aggregated data longer
