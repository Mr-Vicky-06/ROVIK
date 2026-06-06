import json

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, average_precision_score, roc_auc_score
from sklearn.pipeline import Pipeline

from rovik_ml.datasets.synthetic import generate_demo_dataset
from rovik_ml.preprocessing.features import NUMERIC_FEATURES, build_preprocessor, load_training_frame
from rovik_ml.training.common import save_pipeline, split_frame


def train() -> dict:
    generate_demo_dataset()
    frame = load_training_frame()
    train_frame, validation_frame, test_frame = split_frame(frame, "delayed")
    pipeline = Pipeline(
        steps=[
            ("features", build_preprocessor()),
            ("model", HistGradientBoostingClassifier(max_iter=160, learning_rate=0.07, random_state=42)),
        ]
    )
    x_train = train_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    y_train = train_frame["delayed"]
    pipeline.fit(x_train, y_train)

    x_test = test_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    y_test = test_frame["delayed"]
    probabilities = pipeline.predict_proba(x_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "average_precision": float(average_precision_score(y_test, probabilities)),
    }
    artifact = save_pipeline(
        "delay_prediction_v1",
        pipeline,
        {"target": "delayed", "features": NUMERIC_FEATURES, "metrics": metrics},
    )
    return {"artifact": str(artifact), "metrics": metrics, "validation_rows": len(validation_frame)}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
