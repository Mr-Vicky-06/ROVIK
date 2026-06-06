import json

from rovik_ml.evaluation.evaluate_models import write_evaluation_report
from rovik_ml.training.train_anomaly import train as train_anomaly
from rovik_ml.training.train_delay import train as train_delay
from rovik_ml.training.train_delivery_risk import train as train_delivery_risk
from rovik_ml.training.train_eta import train as train_eta
from rovik_ml.training.train_rider_efficiency import train as train_rider_efficiency


def main() -> None:
    results = {
        "eta": train_eta(),
        "delay": train_delay(),
        "rider_efficiency": train_rider_efficiency(),
        "delivery_risk": train_delivery_risk(),
        "operational_anomaly": train_anomaly(),
        "evaluation_report": str(write_evaluation_report()),
    }
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
