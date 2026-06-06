import pandas as pd
import numpy as np

def engineer_eta_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw delivery telemetry into features suitable for XGBoost ETA prediction.
    """
    # Assuming df contains 'start_time', 'distance_m', 'historical_traffic_index', 'rider_avg_speed'
    if 'start_time' in df.columns:
        df['start_time'] = pd.to_datetime(df['start_time'])
        # 1. Time-based features
        df['hour_of_day'] = df['start_time'].dt.hour
        df['day_of_week'] = df['start_time'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # 2. Distance and Speed features
    if 'distance_m' in df.columns and 'rider_avg_speed' in df.columns:
        # Avoid division by zero
        safe_speed = np.where(df['rider_avg_speed'] == 0, 1.0, df['rider_avg_speed'])
        df['estimated_duration_base'] = df['distance_m'] / (safe_speed * (1000/3600)) # base seconds
    
    # 3. Traffic interaction
    if 'historical_traffic_index' in df.columns:
        # Higher traffic index = slower travel
        df['traffic_multiplier'] = 1 + (df['historical_traffic_index'] / 10.0)
    
    return df

def engineer_risk_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature engineering for SLA Risk Scoring.
    """
    if 'remaining_sla_seconds' in df.columns and 'estimated_eta_seconds' in df.columns:
        df['sla_buffer_ratio'] = df['remaining_sla_seconds'] / (df['estimated_eta_seconds'] + 1)
        # Binary classification target or feature
        df['is_high_risk'] = (df['sla_buffer_ratio'] < 1.2).astype(int)
    return df
