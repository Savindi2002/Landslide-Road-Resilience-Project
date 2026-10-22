
from pathlib import Path
import json

import pandas as pd
import pulp as pl

try:
    import geopandas as gpd
except ImportError:
    gpd = None


# ---------------------------------------------------------
# 1. Project paths and settings
# ---------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
OUTPUTS = ROOT / "outputs"
OUTPUTS.mkdir(parents=True, exist_ok=True)

BUDGET_FRACTION = 0.10

INPUT_CANDIDATES = [
    PROCESSED / "road_risk_scores_unique.gpkg",
    PROCESSED / "road_risk_scores.gpkg",
    PROCESSED / "road_risk_scores_unique.csv",
    PROCESSED / "road_risk_scores.csv",
]

SCORE_CANDIDATES = [
    "risk_proxy_score",
    "risk_score",
    "risk_score_normalized",
    "risk",
]

LENGTH_CANDIDATES = [
    "length",
    "length_m",
    "length_meters",
    "road_length_m",
]


def find_column(columns, candidates):
    """Find a column while ignoring uppercase/lowercase differences."""
    lookup = {str(col).lower(): col for col in columns}
    for candidate in candidates:
        if candidate.lower() in lookup:
            return lookup[candidate.lower()]
    return None


# ---------------------------------------------------------
# 2. Inspect and load the real project data
# ---------------------------------------------------------
input_path = next(
    (path for path in INPUT_CANDIDATES if path.exists()),
    None,
)

if input_path is None:
    expected = "\n".join(str(p) for p in INPUT_CANDIDATES)
    raise FileNotFoundError(
        "Could not find the road-risk dataset.\n"
        "Checked these locations:\n" + expected
    )

print("=" * 65)
print("EXACT ROAD PROTECTION OPTIMIZATION")
print("=" * 65)
print(f"Project folder: {ROOT}")
print(f"Input file:     {input_path}")

if input_path.suffix.lower() == ".gpkg":
    if gpd is None:
        raise ImportError(
            "GeoPandas is required to read this GeoPackage. "
            "Install it in your project virtual environment."
        )
    roads = gpd.read_file(input_path)
else:
    roads = pd.read_csv(input_path)

roads = roads.reset_index(drop=True)
roads["source_row_id"] = range(len(roads))

print(f"Road records loaded: {len(roads):,}")
print("Available columns:")
print(", ".join(map(str, roads.columns)))

score_col = find_column(roads.columns, SCORE_CANDIDATES)
length_col = find_column(roads.columns, LENGTH_CANDIDATES)

if score_col is None:
    raise ValueError(
        "No recognized risk-score column was found. "
        "Available columns are listed above. "
        "Add the actual score-column name to SCORE_CANDIDATES."
    )

if length_col is not None:
    road_lengths = pd.to_numeric(roads[length_col], errors="coerce")
elif gpd is not None and isinstance(roads, gpd.GeoDataFrame):
    if roads.crs is None or not roads.crs.is_projected:
        raise ValueError(
            "Road lengths cannot safely be calculated from geometry "
            "because the dataset is not in a projected CRS."
        )
    road_lengths = roads.geometry.length
    length_col = "geometry.length"
else:
    raise ValueError(
        "No road-length column was found, and geometry lengths "
        "are unavailable."
    )

risk_scores = pd.to_numeric(roads[score_col], errors="coerce")

if risk_scores.isna().any():
    raise ValueError(
        f"{risk_scores.isna().sum()} roads have missing risk scores. "
        "Investigate these rows before optimization."
    )

if road_lengths.isna().any() or (road_lengths <= 0).any():
    raise ValueError(
        "Road lengths contain missing or non-positive values. "
        "Clean the input before optimization."
    )

if ((risk_scores < 0) | (risk_scores > 1)).any():
    raise ValueError(
        "The selected risk score is not entirely between 0 and 1. "
        "Confirm that the correct normalized score column was selected."
    )

roads["_risk_score"] = risk_scores.astype(float)
roads["_length_m"] = road_lengths.astype(float)

print(f"Risk-score column: {score_col}")
print(f"Length source:     {length_col}")
print(f"Total road length: {roads['_length_m'].sum():,.2f} m")
print(
    f"Risk-score range:  {roads['_risk_score'].min():.4f} "
    f"to {roads['_risk_score'].max():.4f}"
)

# This input should be the deduplicated road dataset.
edge_id_col = find_column(
    roads.columns,
    ["edge_id", "unique_edge_id", "road_id", "edge_uid"],
)
if edge_id_col is not None:
    if roads[edge_id_col].duplicated().any():
        raise ValueError(
            f"The input has duplicate IDs in '{edge_id_col}'. "
            "Use the deduplicated road dataset before proceeding."
        )

# ---------------------------------------------------------
# 3. Define the exact binary optimization model
# ---------------------------------------------------------
total_length_m = float(roads["_length_m"].sum())
budget_m = BUDGET_FRACTION * total_length_m

# Binary decision: 1 = protect the road, 0 = do not protect it.
model = pl.LpProblem(
    "Ratnapura_Road_Protection",
    pl.LpMaximize,
)

protect = {
    i: pl.LpVariable(f"protect_{i}", cat=pl.LpBinary)
    for i in range(len(roads))
}

# Objective: maximize risk-weighted road length protected.
# This is a risk-priority proxy, not a calibrated monetary benefit.
model += pl.lpSum(
    roads.at[i, "_risk_score"]
    * roads.at[i, "_length_m"]
    * protect[i]
    for i in range(len(roads))
), "Total_Risk_Weighted_Length"

# Constraint: total protected road length must fit the budget.
model += pl.lpSum(
    roads.at[i, "_length_m"] * protect[i]
    for i in range(len(roads))
) <= budget_m, "Road_Length_Budget"

print("\nOptimization model created.")
print(f"Binary decision variables: {len(protect):,}")
print(f"Road-length budget:        {budget_m:,.2f} m")
print("Starting CBC solver...")

# ---------------------------------------------------------
# 4. Solve and verify optimality
# ---------------------------------------------------------
solver = pl.PULP_CBC_CMD(msg=True, gapRel=0.0)

if not solver.available():
    raise RuntimeError(
        "CBC solver is unavailable. Run: "
        'python -m pip install "pulp[cbc]"'
    )

model.solve(solver)
status = pl.LpStatus[model.status]

print(f"\nSolver status: {status}")

if status != "Optimal":
    raise RuntimeError(
        "The solver did not report a proven optimum. "
        f"Status: {status}. Do not report this result as optimal."
    )

selected_indices = [
    i for i, variable in protect.items()
    if pl.value(variable) is not None
    and pl.value(variable) > 0.5
]

roads["optimization_selected"] = 0
roads.loc[selected_indices, "optimization_selected"] = 1
roads["risk_weighted_length"] = (
    roads["_risk_score"] * roads["_length_m"]
)

selected = roads.loc[selected_indices].copy()

protected_length_m = float(selected["_length_m"].sum())
objective_value = float(pl.value(model.objective))
budget_used_pct = (
    100 * protected_length_m / total_length_m
    if total_length_m else 0.0
)

if protected_length_m > budget_m + 1e-4:
    raise RuntimeError(
        "Budget validation failed: selected roads exceed the budget."
    )

# ---------------------------------------------------------
# 5. Save outputs
# ---------------------------------------------------------
selected_csv = OUTPUTS / "exact_optimization_selected_roads.csv"
all_csv = OUTPUTS / "exact_optimization_all_roads.csv"
summary_csv = OUTPUTS / "exact_optimization_summary.csv"
summary_json = OUTPUTS / "exact_optimization_summary.json"

# CSV outputs do not include geometry columns.
selected.drop(
    columns=["geometry"], errors="ignore"
).to_csv(selected_csv, index=False)

roads.drop(
    columns=["geometry"], errors="ignore"
).to_csv(all_csv, index=False)

summary = {
    "input_file": str(input_path),
    "input_road_records": int(len(roads)),
    "risk_score_column": str(score_col),
    "length_source": str(length_col),
    "objective": (
        "Maximize sum(risk_proxy_score * road_length_m "
        "* protection_binary_variable)"
    ),
    "budget_fraction": BUDGET_FRACTION,
    "total_road_length_m": total_length_m,
    "budget_length_m": budget_m,
    "selected_road_count": int(len(selected)),
    "protected_length_m": protected_length_m,
    "budget_used_percent_of_total_network": budget_used_pct,
    "unused_budget_m": budget_m - protected_length_m,
    "objective_value": objective_value,
    "solver": "PuLP / CBC",
    "solver_status": status,
    "interpretation": (
        "Exact optimum for the specified risk-weighted-length "
        "knapsack model. This does not yet prove optimal hospital "
        "accessibility or real-world landslide protection."
    ),
}

pd.DataFrame([summary]).to_csv(summary_csv, index=False)

with open(summary_json, "w", encoding="utf-8") as file:
    json.dump(summary, file, indent=2)

# Preserve selected road geometries when the input is a GeoPackage.
if gpd is not None and isinstance(roads, gpd.GeoDataFrame):
    selected_gpkg = OUTPUTS / "exact_optimization_selected_roads.gpkg"
    selected.to_file(
        selected_gpkg,
        layer="selected_roads",
        driver="GPKG",
        index=False,
    )
    print(f"Selected-road GeoPackage: {selected_gpkg}")

print("\n" + "=" * 65)
print("OPTIMIZATION RESULTS")
print("=" * 65)
print(f"Solver status:       {status}")
print(f"Roads selected:      {len(selected):,}")
print(f"Protected length:    {protected_length_m:,.2f} m")
print(f"Allowed budget:      {budget_m:,.2f} m")
print(f"Budget used:         {budget_used_pct:.3f}% of total road length")
print(f"Unused budget:       {budget_m - protected_length_m:,.2f} m")
print(f"Objective value:     {objective_value:,.4f}")
print(f"\nSaved: {selected_csv}")
print(f"Saved: {summary_csv}")
print(f"Saved: {summary_json}")
print("\nReminder: the objective is a risk-priority proxy, not a")
print("measured probability of road failure or hospital access.")
