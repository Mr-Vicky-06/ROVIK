from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from rovik_ml.config import data_paths

NUMERIC_FEATURES = [
    "distance_km",
    "traffic_level",
    "weather_severity",
    "rider_avg_speed_kmph",
    "delivery_density",
    "road_complexity",
    "historical_route_duration_min",
    "hour_of_day",
    "day_of_week",
    "rider_workload",
    "promised_eta_min",
]

CATEGORICAL_FEATURES = ["vehicle_type"]


def load_training_frame(path: Path | None = None) -> pd.DataFrame:
    source = path or data_paths.raw / "rovik_demo_deliveries.parquet"
    return pd.read_parquet(source)


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def write_feature_snapshot(frame: pd.DataFrame, name: str) -> Path:
    data_paths.ensure()
    destination = data_paths.features / f"{name}.parquet"
    frame.to_parquet(destination, index=False, compression="zstd")
    return destination
