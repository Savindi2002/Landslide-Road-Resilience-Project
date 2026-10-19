
from pathlib import Path
import argparse
import json

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


FEATURES = [
    "slope",
    "elevation_m",
    "rainfall_7d_mm",
    "distance_to_stream_m",
    "landcover_code",
]

TARGET = "landslide"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default="data/processed/ml_samples.csv",
        help="Path to the input CSV file",
    )
    parser.add_argument(
        "--synthetic",
        action="store_true",
        help="Explicitly acknowledge that the input is synthetic",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    input_path = root / args.input
    output_dir = root / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {input_path}\n"
            "Run src/make_demo_data.py first."
        )

    if not args.synthetic:
        raise ValueError(
            "This starter script requires --synthetic to run the "
            "demonstration dataset. For real research data, adapt "
            "the validation and data-splitting process first."
        )

    df = pd.read_csv(input_path)

    required = FEATURES + [TARGET]
    missing = [column for column in required if column not in df.columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.dropna(subset=[TARGET]).copy()
    X = df[FEATURES]
    y = df[TARGET].astype(int)

    if y.nunique() != 2:
        raise ValueError("The target must contain both classes: 0 and 1.")

    # This random split is for demonstration only.
    # Real spatial data should use spatially separated validation.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    models = {
        "Logistic Regression": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", LogisticRegression(max_iter=2000)),
        ]),
        "Random Forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=300,
                    min_samples_leaf=3,
                    random_state=42,
                    class_weight="balanced",
                ),
            ),
        ]),
    }

    results = []
    curves = {}

    for name, model in models.items():
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        probabilities = model.predict_proba(X_test)[:, 1]

        auc = roc_auc_score(y_test, probabilities)

        results.append({
            "model": name,
            "accuracy": accuracy_score(y_test, predictions),
            "roc_auc": auc,
        })

        fpr, tpr, _ = roc_curve(y_test, probabilities)
        curves[name] = (fpr, tpr)

        print(f"\n{name}")
        print(f"Accuracy: {accuracy_score(y_test, predictions):.3f}")
        print(f"ROC-AUC: {auc:.3f}")
        print(classification_report(y_test, predictions, zero_division=0))

    results_df = pd.DataFrame(results)
    results_df.to_csv(output_dir / "ml_metrics.csv", index=False)

    best_name = results_df.sort_values(
        "roc_auc", ascending=False
    ).iloc[0]["model"]
    best_model = models[best_name]

    joblib.dump(best_model, output_dir / "best_model.joblib")

    # ROC curve figure
    plt.figure(figsize=(8, 6))

    for name, (fpr, tpr) in curves.items():
        auc = results_df.loc[
            results_df["model"] == name, "roc_auc"
        ].iloc[0]
        plt.plot(fpr, tpr, label=f"{name} (AUC={auc:.3f})")

    plt.plot([0, 1], [0, 1], linestyle="--", label="Random baseline")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("Demonstration Model Comparison")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "ml_roc_curves.png", dpi=200)
    plt.close()

    metadata = {
        "dataset": str(input_path),
        "data_type": "synthetic demonstration data",
        "features": FEATURES,
        "target": TARGET,
        "best_model_by_auc": best_name,
        "validation": "random stratified holdout; demonstration only",
        "warning": (
            "Do not report these metrics as real-world Sri Lankan "
            "landslide prediction performance."
        ),
    }

    with open(output_dir / "ml_run_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("\nSaved results in the outputs folder.")
    print(results_df.to_string(index=False))
    print(f"\nBest demonstration model: {best_name}")


if __name__ == "__main__":
    main()

