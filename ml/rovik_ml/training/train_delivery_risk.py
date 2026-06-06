import json

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.pipeline import Pipeline

from rovik_ml.datasets.synthetic import generate_demo_dataset
from rovik_ml.preprocessing.features import NUMERIC_FEATURES, build_preprocessor, load_training_frame
from rovik_ml.training.common import save_pipeline


def train() -> dict:
    generate_demo_dataset()
    frame = load_training_frame()
    frame = frame.copy()
    high_risk = (
        (frame["delayed"] == 1)
        | (frame["traffic_level"] > 0.72)
        | (frame["rider_workload"] >= 6)
        | (frame["road_complexity"] > 0.68)
    )
    frame["delivery_risk"] = high_risk.astype(int)
    rng = np.random.default_rng(42)
    mask = rng.random(len(frame))
    train_frame = frame[mask < 0.7]
    test_frame = frame[mask >= 0.7]

    pipeline = Pipeline(
        steps=[
            ("features", build_preprocessor()),
            ("model", HistGradientBoostingClassifier(max_iter=140, learning_rate=0.08, random_state=42)),
        ]
    )
    x_train = train_frame.drop(
        columns=["actual_eta_min", "delayed", "rider_efficiency_score", "delivery_risk"]
    )
    y_train = train_frame["delivery_risk"]
    pipeline.fit(x_train, y_train)

    x_test = test_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score", "delivery_risk"])
    y_test = test_frame["delivery_risk"]
    probabilities = pipeline.predict_proba(x_test)[:, 1]
    metrics = {
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "average_precision": float(average_precision_score(y_test, probabilities)),
    }
    artifact = save_pipeline(
        "delivery_risk_v1",
        pipeline,
        {"target": "delivery_risk", "features": NUMERIC_FEATURES, "metrics": metrics},
    )
    return {"artifact": str(artifact), "metrics": metrics, "test_rows": len(test_frame)}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
