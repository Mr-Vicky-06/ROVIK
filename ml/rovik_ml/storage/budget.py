from pathlib import Path

from rovik_ml.config import data_paths, storage_budget


def directory_size_gb(path: Path) -> float:
    if not path.exists():
        return 0.0
    total = sum(file.stat().st_size for file in path.rglob("*") if file.is_file())
    return round(total / (1024**3), 4)


def storage_report() -> dict[str, float | int]:
    data_paths.ensure()
    report = {
        "raw_gb": directory_size_gb(data_paths.raw),
        "processed_gb": directory_size_gb(data_paths.processed),
        "features_gb": directory_size_gb(data_paths.features),
        "models_gb": directory_size_gb(data_paths.registry) + directory_size_gb(data_paths.checkpoints),
        "logs_tmp_gb": directory_size_gb(data_paths.logs) + directory_size_gb(data_paths.tmp),
        "budget_gb": storage_budget.total_gb,
    }
    report["used_gb"] = round(
        float(report["raw_gb"])
        + float(report["processed_gb"])
        + float(report["features_gb"])
        + float(report["models_gb"])
        + float(report["logs_tmp_gb"]),
        4,
    )
    return report


if __name__ == "__main__":
    print(storage_report())
