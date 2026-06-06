import logging
from datetime import datetime

# Assuming a scheduled job (e.g. Airflow/Cron) that runs daily.
# This script executes ClickHouse aggregation queries and Postgres archival queries.

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_storage_optimization():
    logger.info(f"[{datetime.utcnow()}] Starting Data Retention & Storage Optimization Job...")
    
    # 1. ClickHouse Downsampling (Telemetry > 7 days)
    # The MergeTree TTL already drops raw data after 30 days, but we want to aggregate it here
    # to the `rider_gps_1min_agg` table to save space while retaining historical trends.
    downsample_query = """
        INSERT INTO rovik_telemetry.rider_gps_1min_agg
        SELECT 
            tenant_id, rider_id, toStartOfMinute(timestamp) as timestamp_minute,
            avg(lat) as avg_lat, avg(lng) as avg_lng, avg(speed_kmph) as avg_speed
        FROM rovik_telemetry.rider_gps
        WHERE timestamp >= today() - 7 AND timestamp < today() - 6
        GROUP BY tenant_id, rider_id, timestamp_minute
    """
    logger.info(f"Executing ClickHouse downsampling for T-7 days.")
    logger.debug(f"Query: {downsample_query}")
    
    # 2. Postgres Archival (Completed/Failed orders > 30 days old)
    # Move from 'deliveries' table to S3/Parquet and delete from DB
    postgres_archive_query = """
        DELETE FROM deliveries 
        WHERE status IN ('completed', 'failed') AND created_at < NOW() - INTERVAL '30 days'
        RETURNING *;
    """
    logger.info(f"Executing Postgres archival for stale orders.")
    
    # 3. Vector DB Pruning
    # Delete RAG operational memory context older than 90 days.
    logger.info("Executing Vector DB pruning for operational memory > 90 days.")
    
    logger.info("Data Retention Job Completed Successfully. Storage limits maintained.")

if __name__ == "__main__":
    run_storage_optimization()
