import pandas as pd

class DataQualityValidator:
    """
    ROVIK Data Quality Validation Engine
    Enforces strict governance constraints on raw logistics data before entering the ML pipeline.
    """
    
    # Bounding boxes for valid Indian operations (Chennai, Bangalore, Hyderabad)
    VALID_BOUNDS = [
        {"lat_min": 12.85, "lat_max": 13.10, "lon_min": 77.45, "lon_max": 77.75}, # BLR
        {"lat_min": 12.90, "lat_max": 13.15, "lon_min": 80.15, "lon_max": 80.30}, # MAA
        {"lat_min": 17.30, "lat_max": 17.55, "lon_min": 78.35, "lon_max": 78.60}  # HYD
    ]
    
    MAX_SPEED_KMH = 120.0  # Impossible speed threshold for urban logistics
    
    @staticmethod
    def is_valid_coordinate(lat, lon):
        if pd.isna(lat) or pd.isna(lon):
            return False
            
        # Check if coordinate falls within ANY of our approved operational bounding boxes
        for b in DataQualityValidator.VALID_BOUNDS:
            if (b["lat_min"] <= lat <= b["lat_max"]) and (b["lon_min"] <= lon <= b["lon_max"]):
                return True
        return False

    @staticmethod
    def validate_telemetry(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
        """
        Validates raw telemetry records.
        Returns the cleansed DataFrame and a Data Quality Scorecard.
        """
        initial_count = len(df)
        if initial_count == 0:
            return df, {"score": 100.0}
            
        print(f"Validating {initial_count} telemetry records...")
        
        # 1. Check for Missing Coordinates
        df['valid_coords'] = df.apply(lambda r: DataQualityValidator.is_valid_coordinate(r['latitude'], r['longitude']), axis=1)
        missing_or_invalid_coords = df[~df['valid_coords']]
        df = df[df['valid_coords']]
        
        # 2. Check for Duplicate Records (same rider, same exact timestamp)
        # Using a subset if telemetry is tracked per rider
        if 'rider_id' in df.columns and 'timestamp' in df.columns:
            duplicates = df[df.duplicated(subset=['rider_id', 'timestamp'], keep='first')]
            df = df.drop_duplicates(subset=['rider_id', 'timestamp'], keep='first')
        else:
            duplicates = pd.DataFrame()
            
        # 3. Check Impossible Speeds
        if 'speed' in df.columns:
            impossible_speeds = df[df['speed'] > DataQualityValidator.MAX_SPEED_KMH]
            df = df[df['speed'] <= DataQualityValidator.MAX_SPEED_KMH]
        else:
            impossible_speeds = pd.DataFrame()
            
        # 4. Check Future Timestamps
        if 'timestamp' in df.columns:
            # Ensure timestamp is datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            now = pd.Timestamp.now(tz=df['timestamp'].dt.tz)
            future_timestamps = df[df['timestamp'] > now]
            df = df[df['timestamp'] <= now]
        else:
            future_timestamps = pd.DataFrame()
            
        # Compile Scorecard
        final_count = len(df)
        rejected_count = initial_count - final_count
        quality_score = (final_count / initial_count) * 100.0
        
        scorecard = {
            "initial_records": initial_count,
            "final_records": final_count,
            "rejected_records": rejected_count,
            "quality_score": round(quality_score, 2),
            "rejections": {
                "invalid_coordinates": len(missing_or_invalid_coords),
                "duplicates": len(duplicates),
                "impossible_speeds": len(impossible_speeds),
                "future_timestamps": len(future_timestamps)
            }
        }
        
        print(f"Data Quality Score: {scorecard['quality_score']}%")
        if scorecard['quality_score'] < 95.0:
            print("WARNING: Dataset quality is below the 95% threshold!")
            
        # Cleanup temporary column
        df = df.drop(columns=['valid_coords'])
        
        return df, scorecard

if __name__ == "__main__":
    # Quick self-test using a mock dataframe
    mock_data = pd.DataFrame({
        "rider_id": ["r1", "r1", "r2", "r3", "r4"],
        "timestamp": ["2024-01-01 10:00:00", "2024-01-01 10:00:00", "2050-01-01", "2024-01-01 10:05:00", "2024-01-01 10:10:00"],
        "latitude": [12.97, 12.97, 13.0, 50.0, 17.4],  # 50.0 is invalid
        "longitude": [77.59, 77.59, 80.2, 50.0, 78.4], # 50.0 is invalid
        "speed": [40, 40, 150, 20, 60] # 150 is impossible
    })
    
    print("Running Validator Self-Test...")
    clean_df, stats = DataQualityValidator.validate_telemetry(mock_data)
    print("Scorecard:", stats)
