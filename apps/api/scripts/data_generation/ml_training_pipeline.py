import pandas as pd
import os
import joblib

try:
    import xgboost as xgb
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, f1_score, accuracy_score, roc_auc_score
except ImportError:
    print("WARNING: Missing ML dependencies. Please run: pip install xgboost lightgbm scikit-learn")
    xgb = None

class MLTrainingPipeline:
    """
    ROVIK Machine Learning Pipeline
    Trains the core operational intelligence models.
    """
    
    def __init__(self, data_path="ml_historical_deliveries.csv", model_dir="models"):
        self.data_path = data_path
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)
        
    def load_data(self):
        print(f"Loading feature dataset from {self.data_path}...")
        self.df = pd.read_csv(self.data_path)
        
        # Features used across models
        self.feature_cols = [
            "distance_km", "hour_of_day", "day_of_week", "is_weekend",
            "rider_historical_speed", "rider_deliveries", "package_weight",
            "priority_level", "traffic_congestion_index", "weather_severity_index"
        ]
        
        self.X = self.df[self.feature_cols]
        print(f"Loaded {len(self.df)} records for training.")

    def train_eta_model(self):
        """Train XGBoost Regressor for continuous ETA prediction"""
        print("\n--- Training ETA Prediction Model (XGBoost) ---")
        y = self.df["target_actual_duration_min"]
        
        X_train, X_test, y_train, y_test = train_test_split(self.X, y, test_size=0.2, random_state=42)
        
        model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6
        )
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        print(f"ETA Model Validation MAE: {mae:.2f} minutes")
        
        model_path = os.path.join(self.model_dir, "eta_xgboost.pkl")
        joblib.dump(model, model_path)
        print(f"Model saved to {model_path}")

    def train_delay_model(self):
        """Train LightGBM Regressor for Delay prediction"""
        print("\n--- Training Delay Prediction Model (LightGBM) ---")
        y = self.df["target_delay_min"]
        
        X_train, X_test, y_train, y_test = train_test_split(self.X, y, test_size=0.2, random_state=42)
        
        model = lgb.LGBMRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=7
        )
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        # Assuming delay is mostly 0, MAE might be skewed. Let's output it anyway.
        mae = mean_absolute_error(y_test, preds)
        print(f"Delay Model Validation MAE: {mae:.2f} minutes")
        
        model_path = os.path.join(self.model_dir, "delay_lightgbm.pkl")
        joblib.dump(model, model_path)
        print(f"Model saved to {model_path}")

    def train_sla_risk_model(self):
        """Train XGBoost Classifier for binary SLA Breach Risk prediction"""
        print("\n--- Training SLA Risk Model (XGBoost Classifier) ---")
        y = self.df["target_sla_breached"]
        
        X_train, X_test, y_train, y_test = train_test_split(self.X, y, test_size=0.2, random_state=42)
        
        model = xgb.XGBClassifier(
            eval_metric='logloss',
            use_label_encoder=False,
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5
        )
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        pred_probs = model.predict_proba(X_test)[:, 1]
        
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, zero_division=0)
        roc = roc_auc_score(y_test, pred_probs)
        
        print(f"SLA Model Validation Accuracy: {acc*100:.2f}%")
        print(f"SLA Model Validation F1 Score: {f1:.4f}")
        print(f"SLA Model Validation ROC-AUC: {roc:.4f}")
        
        model_path = os.path.join(self.model_dir, "sla_risk_xgboost.pkl")
        joblib.dump(model, model_path)
        print(f"Model saved to {model_path}")

if __name__ == "__main__":
    if xgb is None:
        exit(1)
        
    pipeline = MLTrainingPipeline()
    try:
        pipeline.load_data()
        pipeline.train_eta_model()
        pipeline.train_delay_model()
        pipeline.train_sla_risk_model()
        print("\n=== ML PIPELINE COMPLETE ===")
    except FileNotFoundError:
        print("ERROR: ml_historical_deliveries.csv not found. Run feature engineering first.")
