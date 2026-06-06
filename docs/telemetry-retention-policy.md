# Telemetry Retention Policy

## Rider Telemetry

| Data Type | Retention | Purpose |
| --- | ---: | --- |
| Raw GPS pings | 14 days | Live tracking, route reconstruction, incident debugging |
| Hourly aggregates | 365 days | Rider analytics, model training, performance trends |
| Daily summaries | 730 days | Long-range operational reporting |

## Operational Events

| Data Type | Retention | Purpose |
| --- | ---: | --- |
| Raw operational events | 90 days | Replay, debugging, AI context |
| Event summaries | 730 days | Analytics and training features |
| Critical incident events | 1095 days | Audit and operational learning |

## Model Artifacts

Keep:

- Latest production model per model family
- Latest 5 candidate models per model family
- Evaluation reports for active models

Delete:

- Temporary checkpoints
- Failed experiments older than 30 days
- Duplicate feature snapshots

## Cleanup Rules

- Cleanup jobs must never delete current production model artifacts.
- Raw telemetry cleanup runs after aggregation succeeds.
- Feature snapshots are compressed with Zstandard Parquet.
- Docker caches and temporary files are excluded from source control and should be pruned frequently.
