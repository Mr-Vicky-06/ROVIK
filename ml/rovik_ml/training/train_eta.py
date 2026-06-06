import json

from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

from rovik_ml.datasets.synthetic import generate_demo_dataset
from rovik_ml.preprocessing.features import NUMERIC_FEATURES, build_preprocessor, load_training_frame
from rovik_ml.training.common import save_pipeline, split_frame


def train() -> dict:
    generate_demo_dataset()
    frame = load_training_frame()
    train_frame, validation_frame, test_frame = split_frame(frame, "actual_eta_min")
    pipeline = Pipeline(
        steps=[
            ("features", build_preprocessor()),
            ("model", HistGradientBoostingRegressor(max_iter=180, learning_rate=0.065, random_state=42)),
        ]
    )
    x_train = train_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    y_train = train_frame["actual_eta_min"]
    pipeline.fit(x_train, y_train)

    x_test = test_frame.drop(columns=["actual_eta_min", "delayed", "rider_efficiency_score"])
    y_test = test_frame["actual_eta_min"]
    predictions = pipeline.predict(x_test)
    metrics = {
        "mae_minutes": float(mean_absolute_error(y_test, predictions)),
        "rmse_minutes": float(mean_squared_error(y_test, predictions, squared=False)),
        "r2": float(r2_score(y_test, predictions)),
    }
    artifact = save_pipeline(
        "eta_prediction_v1",
        pipeline,
        {"target": "actual_eta_min", "features": NUMERIC_FEATURES, "metrics": metrics},
    )
    return {"artifact": str(artifact), "metrics": metrics, "validation_rows": len(validation_frame)}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
