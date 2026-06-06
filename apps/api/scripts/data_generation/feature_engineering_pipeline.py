import pandas as pd
import numpy as np
import random
from datetime import timedelta

class FeatureEngineeringPipeline:
    """
    ROVIK Feature Engineering Pipeline
    Transforms raw operational data (Orders, Riders, Traffic) into flattened ML datasets for XGBoost/LightGBM.
    """
    
    @staticmethod
    def generate_historical_deliveries(orders_df: pd.DataFrame, riders_df: pd.DataFrame) -> pd.DataFrame:
        print("Generating Historical Deliveries (ML Features)...")
        
        features = []
        # We simulate the joining of Telemetry and Orders by synthesizing historical delivery records.
        # In production, this is a SQL view joining orders, routes, route_stops, and telemetry_history.
        
        for _, order in orders_df.iterrows():
            # Pick a random rider to simulate assignment
            rider = riders_df.sample(1).iloc[0]
            
            # Base Spatial Features (Mocking OSM distance)
            # In reality, calculated via osmnx or postgis ST_Distance
            euclidean_dist_km = np.sqrt(
                (order['pickup_latitude'] - order['delivery_latitude'])**2 +
                (order['pickup_longitude'] - order['delivery_longitude'])**2
            ) * 111.0 # rough conversion to km
            
            osm_distance_km = euclidean_dist_km * random.uniform(1.2, 1.8) # Manhattan/Network multiplier
            
            # Base Temporal Features
            created_dt = pd.to_datetime(order['created_at'])
            hour_of_day = created_dt.hour
            day_of_week = created_dt.dayofweek
            is_weekend = 1 if day_of_week >= 5 else 0
            
            # Contextual Intelligence (Traffic & Weather)
            # Simulate historical traffic multipliers based on hour
            traffic_multiplier = 1.0
            if hour_of_day in [8, 9, 10, 17, 18, 19]:
                traffic_multiplier = random.uniform(1.5, 3.0) # Rush hour
            elif hour_of_day in [0, 1, 2, 3, 4, 5]:
                traffic_multiplier = random.uniform(0.8, 1.0) # Night
                
            weather_severity = random.choices([0, 1, 2, 3], weights=[0.7, 0.15, 0.1, 0.05])[0] # 0=Clear, 3=Heavy Rain
            
            # Calculate Ground Truths (Targets for ML)
            base_duration_min = (osm_distance_km / rider['average_speed_kmh']) * 60
            actual_duration_min = base_duration_min * traffic_multiplier * (1 + (weather_severity * 0.15))
            
            # Add random operational noise
            actual_duration_min += random.uniform(-2, 10)
            
            # ETA (Simulate the system's baseline naive ETA prediction at the time)
            naive_eta_min = base_duration_min * 1.2
            
            # Delay
            delay_minutes = max(0, actual_duration_min - naive_eta_min)
            
            # SLA Violation
            deadline_dt = pd.to_datetime(order['delivery_deadline'])
            delivery_time = created_dt + timedelta(minutes=actual_duration_min)
            sla_breached = 1 if delivery_time > deadline_dt else 0
            
            features.append({
                "order_id": order['id'],
                "rider_id": rider['id'],
                "city": order['city'],
                
                # Spatial Features
                "pickup_lat": order['pickup_latitude'],
                "pickup_lon": order['pickup_longitude'],
                "delivery_lat": order['delivery_latitude'],
                "delivery_lon": order['delivery_longitude'],
                "distance_km": round(osm_distance_km, 2),
                
                # Temporal Features
                "hour_of_day": hour_of_day,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                
                # Rider/Vehicle Features
                "rider_historical_speed": rider['average_speed_kmh'],
                "rider_deliveries": rider['completed_deliveries'],
                "package_weight": order['package_weight'],
                "priority_level": 4 if order['priority'] == 'urgent' else 3 if order['priority'] == 'high' else 2 if order['priority'] == 'medium' else 1,
                
                # Intelligence Features
                "traffic_congestion_index": round(traffic_multiplier, 2),
                "weather_severity_index": weather_severity,
                
                # TARGETS
                "target_actual_duration_min": round(actual_duration_min, 2),
                "target_delay_min": round(delay_minutes, 2),
                "target_sla_breached": sla_breached
            })
            
        ml_df = pd.DataFrame(features)
        return ml_df

if __name__ == "__main__":
    print("=== ROVIK FEATURE ENGINEERING PIPELINE ===")
    
    try:
        orders = pd.read_csv("synthetic_orders.csv")
        riders = pd.read_csv("synthetic_riders.csv")
        
        ml_dataset = FeatureEngineeringPipeline.generate_historical_deliveries(orders, riders)
        ml_dataset.to_csv("ml_historical_deliveries.csv", index=False)
        
        print(f"Successfully generated Feature Dataset with {len(ml_dataset)} rows and {len(ml_dataset.columns)} features.")
        print("-> ml_historical_deliveries.csv created.")
        
    except FileNotFoundError:
        print("ERROR: Run generate_synthetic_data.py first to create the base CSV files.")
