from pathlib import Path

from pydantic import BaseModel, Field


ML_ROOT = Path(__file__).resolve().parents[1]


class StorageBudget(BaseModel):
    total_gb: int = 100
    geospatial_gb: tuple[int, int] = (2, 8)
    telemetry_gb: tuple[int, int] = (5, 15)
    events_gb: tuple[int, int] = (2, 8)
    processed_datasets_gb: tuple[int, int] = (5, 12)
    model_registry_gb: int = 5
    vector_store_gb: tuple[int, int] = (1, 3)
    logs_tmp_gb: tuple[int, int] = (5, 10)


class DataPaths(BaseModel):
    root: Path = ML_ROOT
    raw: Path = ML_ROOT / "datasets" / "raw"
    processed: Path = ML_ROOT / "datasets" / "processed"
    features: Path = ML_ROOT / "datasets" / "features"
    registry: Path = ML_ROOT / "models" / "registry"
    checkpoints: Path = ML_ROOT / "models" / "checkpoints"
    logs: Path = ML_ROOT / "logs"
    tmp: Path = ML_ROOT / "tmp"

    def ensure(self) -> None:
        for path in self.model_dump().values():
            if isinstance(path, Path):
                path.mkdir(parents=True, exist_ok=True)


class PipelineConfig(BaseModel):
    random_seed: int = 42
    demo_rows: int = Field(default=5000, ge=100, le=500000)
    test_size: float = Field(default=0.15, gt=0, lt=0.5)
    validation_size: float = Field(default=0.15, gt=0, lt=0.5)
    max_model_artifacts: int = 20


storage_budget = StorageBudget()
data_paths = DataPaths()
pipeline_config = PipelineConfig()
