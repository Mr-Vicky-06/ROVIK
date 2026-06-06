import os
import joblib
import pandas as pd
from typing import Dict, Any

class MLIntelligenceService:
    """
    ROVIK ML Intelligence Singleton
    Provides shared, in-memory access to XGBoost and LightGBM models
    for both the FastAPI router and the background OR-Tools routing engine.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLIntelligenceService, cls).__new__(cls)
            cls._instance._models = {"eta": None, "delay": None, "sla": None}
            cls._instance._model_dir = os.path.join(os.getcwd(), "scripts", "data_generation", "models")
            cls._instance._initialized = False
        return cls._instance
        
    def _load_models(self):
        if self._initialized:
            return
            
        try:
            if self._models["eta"] is None:
                self._models["eta"] = joblib.load(os.path.join(self._model_dir, "eta_xgboost.pkl"))
            if self._models["delay"] is None:
                self._models["delay"] = joblib.load(os.path.join(self._model_dir, "delay_lightgbm.pkl"))
            if self._models["sla"] is None:
                self._models["sla"] = joblib.load(os.path.join(self._model_dir, "sla_risk_xgboost.pkl"))
            self._initialized = True
        except Exception as e:
            print(f"ML Intelligence Warning: Failed to load models. Using fallback heuristics. Error: {e}")
            
    def _prepare_features(self, features: Dict[str, Any]) -> pd.DataFrame:
        feature_cols = [
            "distance_km", "hour_of_day", "day_of_week", "is_weekend",
            "rider_historical_speed", "rider_deliveries", "package_weight",
            "priority_level", "traffic_congestion_index", "weather_severity_index"
        ]
        
        # Ensure default values for missing features
        defaults = {
            "distance_km": 0.0, "hour_of_day": 12, "day_of_week": 0, "is_weekend": 0,
            "rider_historical_speed": 24.0, "rider_deliveries": 100, "package_weight": 5.0,
            "priority_level": 2, "traffic_congestion_index": 1.0, "weather_severity_index": 0
        }
        
        row = {col: features.get(col, defaults[col]) for col in feature_cols}
        return pd.DataFrame([row])[feature_cols]

    def predict_eta_minutes(self, features: Dict[str, Any]) -> float:
        self._load_models()
        if not self._initialized or self._models["eta"] is None:
            # Fallback heuristic: 24 km/h
            distance = features.get("distance_km", 0.0)
            return max(1.0, (distance / 24.0) * 60.0)
            
        X = self._prepare_features(features)
        pred = self._models["eta"].predict(X)[0]
        return max(0.0, float(pred))
        
    def predict_delay_minutes(self, features: Dict[str, Any]) -> float:
        self._load_models()
        if not self._initialized or self._models["delay"] is None:
            return 0.0
            
        X = self._prepare_features(features)
        pred = self._models["delay"].predict(X)[0]
        return max(0.0, float(pred))
        
    def predict_sla_risk(self, features: Dict[str, Any]) -> tuple[bool, float]:
        self._load_models()
        if not self._initialized or self._models["sla"] is None:
            return False, 0.0
            
        X = self._prepare_features(features)
        pred_class = self._models["sla"].predict(X)[0]
        pred_prob = self._models["sla"].predict_proba(X)[0][1]
        
        return bool(pred_class == 1), float(pred_prob)

# Global singleton export
ml_service = MLIntelligenceService()
