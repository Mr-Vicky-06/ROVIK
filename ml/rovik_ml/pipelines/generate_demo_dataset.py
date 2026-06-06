import argparse

from rovik_ml.datasets.synthetic import generate_demo_dataset


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=None)
    args = parser.parse_args()
    path = generate_demo_dataset(rows=args.rows)
    print(path)


if __name__ == "__main__":
    main()
