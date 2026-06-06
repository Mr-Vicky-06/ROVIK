import json

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline

from rovik_ml.datasets.synthetic import generate_demo_dataset
from rovik_ml.preprocessing.features import NUMERIC_FEATURES, build_preprocessor, load_training_frame
from rovik_ml.training.common import save_pipeline, split_frame


def train() -> dict:
    generate_demo_dataset()
    frame = load_training_frame()
    train_frame, validation_frame, test_frame = split_frame(frame, "rider_efficiency_score")
    pipeline = Pipeline(
        steps=[
            ("features", build_preprocessor()),
            ("model", RandomForestRegressor(n_estimators=80, max_depth=10, random_state=42, n_jobs=-1)),
        ]
    )
    x_train = train_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    y_train = train_frame["rider_efficiency_score"]
    pipeline.fit(x_train, y_train)

    x_test = test_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    y_test = test_frame["rider_efficiency_score"]
    predictions = pipeline.predict(x_test)
    metrics = {
        "mae_score_points": float(mean_absolute_error(y_test, predictions)),
        "r2": float(r2_score(y_test, predictions)),
    }
    artifact = save_pipeline(
        "rider_efficiency_v1",
        pipeline,
        {"target": "rider_efficiency_score", "features": NUMERIC_FEATURES, "metrics": metrics},
    )
    return {"artifact": str(artifact), "metrics": metrics, "validation_rows": len(validation_frame)}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
