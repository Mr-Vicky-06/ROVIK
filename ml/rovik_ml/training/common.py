from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from rovik_ml.config import data_paths, pipeline_config


def split_frame(frame: pd.DataFrame, target: str):
    train_frame, test_frame = train_test_split(
        frame,
        test_size=pipeline_config.test_size,
        random_state=pipeline_config.random_seed,
        stratify=frame[target] if frame[target].nunique() <= 10 else None,
    )
    train_frame, validation_frame = train_test_split(
        train_frame,
        test_size=pipeline_config.validation_size,
        random_state=pipeline_config.random_seed,
        stratify=train_frame[target] if train_frame[target].nunique() <= 10 else None,
    )
    return train_frame, validation_frame, test_frame


def save_pipeline(model_name: str, pipeline: Pipeline, metadata: dict) -> Path:
    data_paths.ensure()
    artifact = data_paths.registry / f"{model_name}.joblib"
    joblib.dump({"pipeline": pipeline, "metadata": metadata}, artifact, compress=3)
    return artifact
