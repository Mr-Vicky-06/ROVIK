import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any


MODEL_PATH = Path(__file__).resolve().parent / "model_artifacts" / "selected_operational_model.json"


@lru_cache
def load_selected_model() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        return {}
    return json.loads(MODEL_PATH.read_text(encoding="utf-8"))


def predict_operational_intelligence(features: dict[str, Any]) -> dict[str, Any]:
    artifact = load_selected_model()
    if not artifact:
        return _fallback_prediction(features)

    vector = _vectorize(features, artifact["features"])
    eta_bundle = artifact["selected_models"]["eta_prediction"]
    delay_bundle = artifact["selected_models"]["delay_prediction"]
    eta = _predict_regression(eta_bundle, vector, features)
    delay_probability = _predict_delay(delay_bundle, vector, features)
    return {
        "model_version": artifact["version"],
        "eta_minutes": round(max(1.0, eta), 2),
        "delay_probability": round(min(0.99, max(0.01, delay_probability)), 4),
        "eta_model": eta_bundle["name"],
        "delay_model": delay_bundle["name"],
        "confidence": _confidence(delay_probability),
    }


def _vectorize(features: dict[str, Any], feature_spec: dict[str, Any]) -> list[float]:
    values = [float(features.get(name, 0) or 0) for name in feature_spec["numeric"]]
    for name in feature_spec["categorical"]:
        categories = feature_spec["categories"][name]
        values.extend(1.0 if features.get(name, "unknown") == category else 0.0 for category in categories)
    means = feature_spec["scaler"]["means"]
    stds = feature_spec["scaler"]["stds"]
    return [(value - means[index]) / stds[index] for index, value in enumerate(values)]


def _predict_regression(model_bundle: dict[str, Any], vector: list[float], features: dict[str, Any]) -> float:
    model = model_bundle["model"]
    if model_bundle["type"] == "baseline_mean":
        return float(model["value"])
    if model_bundle["type"] == "linear_regression":
        return float(model["bias"]) + sum(weight * value for weight, value in zip(model["weights"], vector))
    return float(features.get("predicted_eta_min", 20))


def _predict_delay(model_bundle: dict[str, Any], vector: list[float], features: dict[str, Any]) -> float:
    model = model_bundle["model"]
    if model_bundle["type"] == "logistic_regression":
        score = float(model["bias"]) + sum(weight * value for weight, value in zip(model["weights"], vector))
        return 1 / (1 + math.exp(-max(-40, min(40, score))))
    if model_bundle["type"] == "rule_threshold":
        return min(
            0.98,
            max(
                0.02,
                float(features.get("traffic_level", 0)) * 0.45
                + float(features.get("area_delay_rate", 0)) * 0.35
                + float(features.get("rider_workload", 0)) * 0.035,
            ),
        )
    return 0.2


def _confidence(delay_probability: float) -> str:
    distance_from_uncertainty = abs(delay_probability - 0.5)
    if distance_from_uncertainty > 0.35:
        return "high"
    if distance_from_uncertainty > 0.18:
        return "medium"
    return "low"


def _fallback_prediction(features: dict[str, Any]) -> dict[str, Any]:
    distance = float(features.get("distance_km", 4))
    speed = max(8.0, float(features.get("rider_avg_speed_kmph", 22)))
    traffic = float(features.get("traffic_level", 0.3))
    eta = (distance / (speed * (1 - min(0.7, traffic * 0.35)))) * 60 + 8
    delay_probability = min(0.95, max(0.03, traffic * 0.55 + float(features.get("rider_workload", 2)) * 0.04))
    return {
        "model_version": "fallback_rule_v1",
        "eta_minutes": round(eta, 2),
        "delay_probability": round(delay_probability, 4),
        "eta_model": "fallback_eta_rule",
        "delay_model": "fallback_delay_rule",
        "confidence": _confidence(delay_probability),
    }
