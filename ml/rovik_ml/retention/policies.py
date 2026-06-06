from dataclasses import dataclass


@dataclass(frozen=True)
class RetentionPolicy:
    name: str
    raw_days: int
    aggregate_days: int
    archive_days: int
    max_gb: int


POLICIES = {
    "rider_telemetry": RetentionPolicy("rider_telemetry", raw_days=14, aggregate_days=365, archive_days=730, max_gb=15),
    "operational_events": RetentionPolicy("operational_events", raw_days=90, aggregate_days=730, archive_days=1095, max_gb=8),
    "training_artifacts": RetentionPolicy("training_artifacts", raw_days=30, aggregate_days=180, archive_days=365, max_gb=5),
    "logs_tmp": RetentionPolicy("logs_tmp", raw_days=7, aggregate_days=30, archive_days=60, max_gb=10),
}
