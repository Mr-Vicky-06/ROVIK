from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from rovik_ml.config import data_paths


def load_model(model_name: str) -> dict[str, Any]:
    artifact = data_paths.registry / f"{model_name}.joblib"
    return joblib.load(artifact)


def predict_one(model_name: str, features: dict[str, Any]) -> float:
    bundle = load_model(model_name)
    frame = pd.DataFrame([features])
    prediction = bundle["pipeline"].predict(frame)[0]
    return float(prediction)


def artifact_size_mb(path: Path) -> float:
    return round(path.stat().st_size / (1024 * 1024), 3)
