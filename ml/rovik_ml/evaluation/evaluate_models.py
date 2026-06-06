import json
from pathlib import Path

import joblib

from rovik_ml.config import data_paths


def evaluate_registry() -> dict[str, dict]:
    registry = data_paths.registry
    results: dict[str, dict] = {}
    if not registry.exists():
        return results
    for artifact in registry.glob("*.joblib"):
        bundle = joblib.load(artifact)
        metadata = bundle.get("metadata", {})
        results[artifact.stem] = metadata.get("metrics", {})
    return results


def write_evaluation_report() -> Path:
    data_paths.ensure()
    report = data_paths.processed / "model_evaluation_report.json"
    report.write_text(json.dumps(evaluate_registry(), indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    print(write_evaluation_report())
