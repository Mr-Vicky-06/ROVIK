import xgboost as xgb
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

def train_eta_xgboost(data_path: str, model_output_path: str):
    """
    Trains an XGBoost regressor for predicting delivery ETA.
    """
    print(f"Loading data from {data_path}...")
    # In reality, load the engineered parquet file
    # df = pd.read_parquet(data_path)
    
    # Mocking data for scaffolding
    df = pd.DataFrame({
        "distance_m": [1000, 2500, 5000, 8000] * 100,
        "historical_traffic_index": [2, 5, 8, 3] * 100,
        "hour_of_day": [10, 14, 18, 22] * 100,
        "actual_duration_sec": [300, 800, 2000, 2500] * 100
    })
    
    features = ["distance_m", "historical_traffic_index", "hour_of_day"]
    X = df[features]
    y = df["actual_duration_sec"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        objective='reg:squarederror'
    )
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Model Validation MAE: {mae:.2f} seconds")
    
    # Save the model
    import os
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    print(f"Model saved to {model_output_path}")

if __name__ == "__main__":
    train_eta_xgboost("../datasets/eta_features.parquet", "../models/eta_xgboost_v1.joblib")
