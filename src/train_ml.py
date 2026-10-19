"""Train and evaluate landslide susceptibility models from a prepared CSV."""
from pathlib import Path
import argparse
import json
import warnings

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, precision_score, recall_score, roc_auc_score, RocCurveDisplay
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
FEATURES = [
    "slope", "elevation_m", "rainfall_7d_mm",
    "distance_to_stream_m", "landcover_code"
]
TARGET = "landslide"


def spatial_split(df, test_size=0.25, random_state=42):
    """Use a coordinate-quadrant holdout if x/y are available; otherwise random split."""
    if {"x", "y"}.issubset(df.columns):
        xmid, ymid = df["x"].median(), df["y"].median()
        # Hold out the north-east quadrant as the test set.
        test_mask = (df["x"] >= xmid) & (df["y"] >= ymid)
        train_mask = ~test_mask
        # If this creates a single-class partition or too-small set, fall back.
        if (test_mask.sum() >= 20 and train_mask.sum() >= 50
                and df.loc[test_mask, TARGET].nunique() == 2
                and df.loc[train_mask, TARGET].nunique() == 2):
            return np.flatnonzero(train_mask), np.flatnonzero(test_mask)
        warnings.warn("Coordinate holdout unsuitable; using stratified random split.")
    else:
        warnings.warn(
            "No x/y coordinates found. Using stratified random split; "
            "nearby spatial samples may leak information across train/test."
        )
    idx = np.arange(len(df))
    train_idx, test_idx = train_test_split(
        idx, test_size=test_size, random_state=random_state,
        stratify=df[TARGET]
    )
    return train_idx, test_idx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(ROOT / "data/processed/ml_samples.csv"))
    parser.add_argument("--output-dir", default=str(ROOT / "outputs"))
    parser.add_argument("--synthetic", action="store_true",
                        help="Label outputs as synthetic demonstration results.")
    args = parser.parse_args()

    in_path = Path(args.input)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not in_path.exists():
        raise FileNotFoundError(
            f"Could not find {in_path}. Run `python src/make_demo_data.py` "
            "for a synthetic code test, or supply your prepared real CSV."
        )

    df = pd.read_csv(in_path)
    required = FEATURES + [TARGET]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}. Found: {list(df.columns)}")
    df = df[required + [c for c in ["x", "y"] if c in df.columns]].copy()
    df = df.dropna(subset=[TARGET])
    df[TARGET] = df[TARGET].astype(int)
    if not set(df[TARGET].unique()).issubset({0, 1}) or df[TARGET].nunique() != 2:
        raise ValueError("Target `landslide` must contain both classes 0 and 1.")
    if len(df) < 50:
        warnings.warn("Small dataset: metrics may be unstable.")

    train_idx, test_idx = spatial_split(df)
    X_train, X_test = df.iloc[train_idx][FEATURES], df.iloc[test_idx][FEATURES]
    y_train, y_test = df.iloc[train_idx][TARGET], df.iloc[test_idx][TARGET]

    models = {
        "LogisticRegression": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
            ("model", LogisticRegression(max_iter=2000, class_weight="balanced"))
        ]),
        "RandomForest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", RandomForestClassifier(
                n_estimators=400, min_samples_leaf=3,
                class_weight="balanced_subsample", random_state=42, n_jobs=-1
            ))
        ])
    }

    rows, fitted = [], {}
    plt.figure(figsize=(7, 6))
    for name, model in models.items():
        model.fit(X_train, y_train)
        prob = model.predict_proba(X_test)[:, 1]
        pred = (prob >= 0.5).astype(int)
        row = {
            "model": name,
            "n_train": int(len(train_idx)),
            "n_test": int(len(test_idx)),
            "accuracy": float(accuracy_score(y_test, pred)),
            "precision": float(precision_score(y_test, pred, zero_division=0)),
            "recall": float(recall_score(y_test, pred, zero_division=0)),
            "f1": float(f1_score(y_test, pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_test, prob)),
        }
        rows.append(row)
        fitted[name] = model
        RocCurveDisplay.from_predictions(y_test, prob, name=name)

        print(f"\n=== {name} ===")
        print(json.dumps(row, indent=2))
        print("Confusion matrix:\n", confusion_matrix(y_test, pred))
        print(classification_report(y_test, pred, zero_division=0))

    plt.title("Susceptibility model ROC curves")
    plt.tight_layout()
    plt.savefig(out_dir / "ml_roc_curves.png", dpi=180)
    plt.close()

    metrics = pd.DataFrame(rows).sort_values("roc_auc", ascending=False)
    metrics.to_csv(out_dir / "ml_metrics.csv", index=False)
    best_name = str(metrics.iloc[0]["model"])
    joblib.dump(fitted[best_name], out_dir / "best_model.joblib")

    # Save a permutation-free, model-based feature importance for RF.
    rf = fitted["RandomForest"].named_steps["model"]
    importances = pd.DataFrame({
        "feature": FEATURES,
        "importance": rf.feature_importances_
    }).sort_values("importance", ascending=False)
    importances.to_csv(out_dir / "rf_feature_importance.csv", index=False)

    with open(out_dir / "ml_run_metadata.json", "w", encoding="utf-8") as f:
        json.dump({
            "input_file": str(in_path),
            "best_model_by_test_auc": best_name,
            "data_status": "SYNTHETIC DEMONSTRATION" if args.synthetic else
                "USER-SUPPLIED DATA; verify provenance and labels",
            "warning": (
                "Metrics are only scientifically interpretable if labels and features "
                "are real, correctly defined, and evaluation split is appropriate."
            )
        }, f, indent=2)

    print(f"\nSaved metrics and plots to {out_dir}")
    print("IMPORTANT: inspect the input provenance before reporting these results.")


if __name__ == "__main__":
    main()
