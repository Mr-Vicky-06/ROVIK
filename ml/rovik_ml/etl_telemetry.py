import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from datetime import datetime, timedelta
import os

def extract_telemetry_to_parquet(clickhouse_client, output_path: str, days_back: int = 30):
    """
    Extracts high-frequency GPS telemetry from ClickHouse, aggregates it, 
    and saves it as a highly compressed Parquet file for ML training.
    """
    # Mocking the ClickHouse extraction query for aggregation
    query = f"""
        SELECT 
            tenant_id, rider_id, toStartOfMinute(timestamp) as timestamp_minute,
            avg(lat) as avg_lat, avg(lng) as avg_lng, avg(speed_kmph) as avg_speed
        FROM rovik_telemetry.rider_gps
        WHERE timestamp >= today() - {days_back}
        GROUP BY tenant_id, rider_id, timestamp_minute
        ORDER BY timestamp_minute
    """
    print(f"Executing query: {query}")
    
    # In a real environment, this would be:
    # df = clickhouse_client.query_dataframe(query)
    
    # Simulating data extraction
    dummy_data = {
        "tenant_id": ["tenant-1"] * 1000,
        "rider_id": ["rider-1"] * 1000,
        "timestamp_minute": pd.date_range(end=datetime.now(), periods=1000, freq='min'),
        "avg_lat": [34.0522] * 1000,
        "avg_lng": [-118.2437] * 1000,
        "avg_speed": [25.5] * 1000
    }
    df = pd.DataFrame(dummy_data)
    
    # Save to Parquet using PyArrow for efficient compression (snappy)
    table = pa.Table.from_pandas(df)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pq.write_table(table, output_path, compression='snappy')
    print(f"Data successfully extracted to {output_path}")

if __name__ == "__main__":
    extract_telemetry_to_parquet(None, "../datasets/telemetry_extract.parquet")
