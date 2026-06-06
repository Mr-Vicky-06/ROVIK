import json

from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline

from rovik_ml.datasets.synthetic import generate_demo_dataset
from rovik_ml.preprocessing.features import NUMERIC_FEATURES, build_preprocessor, load_training_frame
from rovik_ml.training.common import save_pipeline


def train() -> dict:
    generate_demo_dataset()
    frame = load_training_frame()
    pipeline = Pipeline(
        steps=[
            ("features", build_preprocessor()),
            ("model", IsolationForest(n_estimators=120, contamination=0.04, random_state=42, n_jobs=-1)),
        ]
    )
    x_train = frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    pipeline.fit(x_train)
    anomaly_scores = pipeline.decision_function(x_train)
    metrics = {
        "estimated_anomaly_rate": float((pipeline.predict(x_train) == -1).mean()),
        "mean_anomaly_score": float(anomaly_scores.mean()),
    }
    artifact = save_pipeline(
        "operational_anomaly_v1",
        pipeline,
        {"target": "unsupervised_anomaly", "features": NUMERIC_FEATURES, "metrics": metrics},
    )
    return {"artifact": str(artifact), "metrics": metrics, "training_rows": len(frame)}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
