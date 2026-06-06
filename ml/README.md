# ROVIK ML and Data Infrastructure

This subsystem provides storage-constrained data and ML infrastructure for ROVIK. It is optimized for investor-grade demos, realistic operational intelligence, and lightweight predictive models within a 90-100 GB total AI/data storage budget.

## Scope

- Synthetic operational data generation
- ETA prediction dataset preparation
- Delay prediction dataset preparation
- Rider efficiency feature generation
- Lightweight model training and evaluation
- Model export for inference
- Telemetry retention and aggregation policies
- Geospatial data budget planning
- Future pgvector operational memory strategy

## Storage Budget

| Category | Target |
| --- | ---: |
| Geospatial routing assets | 2-8 GB |
| Rider telemetry | 5-15 GB |
| Operational events | 2-8 GB |
| Processed ML datasets | 5-12 GB |
| Models and checkpoints | <5 GB |
| Vector memory | 1-3 GB |
| Logs and temporary artifacts | 5-10 GB |
| Reserved growth buffer | 40-50 GB |

## Local Workflow

```powershell
cd ml
python -m pip install -e ".[dev]"
python -m rovik_ml.pipelines.generate_demo_dataset --rows 5000
python -m rovik_ml.training.train_eta
python -m rovik_ml.training.train_delay
python -m rovik_ml.pipelines.train_all
python -m rovik_ml.evaluation.evaluate_models
```

The default outputs are intentionally small and live under `ml/datasets/processed` and `ml/models/registry`.
