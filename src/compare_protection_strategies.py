
from pathlib import Path
import geopandas as gpd
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent.parent

INPUT = ROOT / "data/processed/road_priority_ranking.csv"
OUTPUT = ROOT / "data/processed/protection_strategy_comparison.csv"
SELECTED_OUTPUT = ROOT / "data/processed/selected_protection_roads.csv"

if not INPUT.exists():
    raise FileNotFoundError(
        f"Missing {INPUT}. Run rank_priority_roads.py first."
    )

roads = pd.read_csv(INPUT)

required = [
    "length",
    "risk_proxy_score",
    "centrality_score",
    "combined_priority_score",
]
missing = [c for c in required if c not in roads.columns]

if missing:
    raise ValueError(f"Missing columns: {missing}")

roads = roads.dropna(subset=required).copy()
roads = roads[roads["length"] > 0].copy()

# Hypothetical budget: protect up to 10% of total road length.
budget = roads["length"].sum() * 0.10

strategies = {
    "Risk-based": "risk_proxy_score",
    "Centrality-based": "centrality_score",
    "Combined": "combined_priority_score",
}

comparison = []
selected_rows = []

for strategy, score_column in strategies.items():
    ranked = roads.sort_values(
        score_column, ascending=False
    ).copy()

    # Select whole road segments without exceeding the length budget.
    ranked["cumulative_length"] = ranked["length"].cumsum()
    selected = ranked[
        ranked["cumulative_length"] <= budget
    ].copy()

    protected_length = selected["length"].sum()

    comparison.append({
        "strategy": strategy,
        "budget_road_length_m": budget,
        "protected_road_length_m": protected_length,
        "roads_selected": len(selected),
        "budget_used_percent": (
            protected_length / budget * 100 if budget else 0
        ),
        "mean_risk_score_selected": (
            selected["risk_proxy_score"].mean()
            if len(selected) else np.nan
        ),
        "mean_centrality_selected": (
            selected["centrality_score"].mean()
            if len(selected) else np.nan
        ),
    })

    selected["strategy"] = strategy
    selected_rows.append(selected)

comparison_df = pd.DataFrame(comparison)
comparison_df.to_csv(OUTPUT, index=False)

if selected_rows:
    pd.concat(selected_rows, ignore_index=True).to_csv(
        SELECTED_OUTPUT, index=False
    )

print("\n=== PROTECTION STRATEGY COMPARISON ===")
print(comparison_df.to_string(index=False))
print("\nSaved comparison:", OUTPUT)
print("Saved selected roads:", SELECTED_OUTPUT)
print("\nNote: This is a road-length budget proxy, not a monetary budget.")
