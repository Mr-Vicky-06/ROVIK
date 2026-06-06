from pathlib import Path

import numpy as np
import pandas as pd

from rovik_ml.config import data_paths, pipeline_config

VEHICLES = np.array(["bike", "scooter", "ev_scooter", "van"])


def generate_demo_dataset(rows: int | None = None, output: Path | None = None) -> Path:
    cfg_rows = rows or pipeline_config.demo_rows
    rng = np.random.default_rng(pipeline_config.random_seed)

    vehicle_type = rng.choice(VEHICLES, size=cfg_rows, p=[0.42, 0.34, 0.16, 0.08])
    distance_km = rng.gamma(shape=2.1, scale=2.4, size=cfg_rows).clip(0.4, 28)
    traffic_level = rng.beta(2.4, 3.2, size=cfg_rows)
    weather_severity = rng.beta(1.3, 8.0, size=cfg_rows)
    delivery_density = rng.gamma(shape=2.0, scale=4.0, size=cfg_rows).clip(0, 40)
    road_complexity = rng.beta(2.0, 4.5, size=cfg_rows)
    hour_of_day = rng.integers(0, 24, size=cfg_rows)
    day_of_week = rng.integers(0, 7, size=cfg_rows)
    rider_workload = rng.integers(0, 8, size=cfg_rows)

    base_speed = np.select(
        [
            vehicle_type == "bike",
            vehicle_type == "scooter",
            vehicle_type == "ev_scooter",
            vehicle_type == "van",
        ],
        [19, 25, 24, 21],
        default=22,
    )
    rush_hour_penalty = np.where(np.isin(hour_of_day, [8, 9, 10, 17, 18, 19, 20]), 0.78, 1.0)
    rider_avg_speed_kmph = (
        base_speed
        * rush_hour_penalty
        * (1 - traffic_level * 0.36)
        * (1 - weather_severity * 0.18)
        + rng.normal(0, 1.8, size=cfg_rows)
    ).clip(7, 38)

    historical_route_duration_min = (distance_km / rider_avg_speed_kmph) * 60
    operational_drag = (
        traffic_level * 9
        + weather_severity * 6
        + road_complexity * 5
        + rider_workload * 1.4
        + delivery_density * 0.18
    )
    actual_eta_min = (historical_route_duration_min + operational_drag + rng.normal(0, 3.0, cfg_rows)).clip(3, 180)
    promised_eta_min = (historical_route_duration_min + 18 + rng.normal(0, 5.0, cfg_rows)).clip(8, 200)
    delayed = (actual_eta_min > promised_eta_min).astype(int)
    rider_efficiency_score = (
        100
        - traffic_level * 11
        - weather_severity * 7
        - rider_workload * 2.2
        - delayed * 8
        + rng.normal(0, 4.0, cfg_rows)
    ).clip(35, 99)

    frame = pd.DataFrame(
        {
            "distance_km": distance_km.round(3),
            "traffic_level": traffic_level.round(4),
            "weather_severity": weather_severity.round(4),
            "rider_avg_speed_kmph": rider_avg_speed_kmph.round(3),
            "delivery_density": delivery_density.round(3),
            "vehicle_type": vehicle_type,
            "road_complexity": road_complexity.round(4),
            "historical_route_duration_min": historical_route_duration_min.round(3),
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "rider_workload": rider_workload,
            "promised_eta_min": promised_eta_min.round(3),
            "actual_eta_min": actual_eta_min.round(3),
            "delayed": delayed,
            "rider_efficiency_score": rider_efficiency_score.round(3),
        }
    )

    data_paths.ensure()
    destination = output or data_paths.raw / "rovik_demo_deliveries.parquet"
    frame.to_parquet(destination, index=False, compression="zstd")
    return destination
