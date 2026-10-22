
from pathlib import Path
import random
import json
import time

import pandas as pd
import geopandas as gpd
import networkx as nx
import pulp as pl


# =========================================================
# 1. Configuration
# =========================================================
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "processed"
OUTPUTS = ROOT / "outputs"
OUTPUTS.mkdir(parents=True, exist_ok=True)

ROAD_FILE = DATA / "road_risk_scores_unique.gpkg"
HOSPITAL_FILE = DATA / "healthcare_graph_locations.csv"

BUDGET_FRACTION = 0.10

# Design scenario
DESIGN_FAILURE_PERCENT = 20
DESIGN_SEED = 2026

# Independent evaluation scenarios
TEST_FAILURE_PERCENTAGES = [2, 5, 10]
TEST_TRIALS = 30
TEST_SEED = 42

# CBC solver time limit
SOLVER_TIME_LIMIT_SECONDS = 600


# =========================================================
# 2. Helper functions
# =========================================================
def norm(value):
    """Normalize node identifiers from different file types."""
    if pd.isna(value):
        return "NA"

    text = str(value).strip()

    if text.endswith(".0") and text[:-2].isdigit():
        text = text[:-2]

    return text


def safe_value(variable):
    """Return a variable value, or None if unavailable."""
    value = pl.value(variable)
    return None if value is None else float(value)


# =========================================================
# 3. Load project data
# =========================================================
if not ROAD_FILE.exists():
    raise FileNotFoundError(f"Missing road file: {ROAD_FILE}")

if not HOSPITAL_FILE.exists():
    raise FileNotFoundError(f"Missing hospital file: {HOSPITAL_FILE}")

# Read the original data without modifying the source file.
roads = gpd.read_file(ROAD_FILE).reset_index(drop=True)
hospitals = pd.read_csv(HOSPITAL_FILE)

required_road_columns = {
    "u", "v", "length", "risk_proxy_score"
}
missing = required_road_columns - set(roads.columns)

if missing:
    raise ValueError(
        f"Missing road columns: {sorted(missing)}"
    )

required_hospital_columns = {
    "nearest_node_id", "amenity", "healthcare"
}
missing = required_hospital_columns - set(hospitals.columns)

if missing:
    raise ValueError(
        f"Missing hospital columns: {sorted(missing)}"
    )

roads["u_norm"] = roads["u"].map(norm)
roads["v_norm"] = roads["v"].map(norm)
roads["length"] = pd.to_numeric(
    roads["length"], errors="coerce"
)

if roads["length"].isna().any() or (roads["length"] <= 0).any():
    raise ValueError(
        "Road lengths contain missing or non-positive values."
    )

if roads[["u_norm", "v_norm"]].isna().any().any():
    raise ValueError("Missing road endpoint identifiers.")

# ---------------------------------------------------------
# FIX: Exclude self-loop records from the optimization graph.
# The original GeoPackage is not modified.
# ---------------------------------------------------------
self_loop_mask = roads["u_norm"] == roads["v_norm"]
self_loop_count = int(self_loop_mask.sum())

if self_loop_count > 0:
    print(
        f"Excluding {self_loop_count} self-loop records "
        "from the optimization graph."
    )

    roads = roads.loc[~self_loop_mask].copy()

# Rebuild stable edge indices after filtering.
roads = roads.reset_index(drop=True)
roads["edge_index"] = range(len(roads))

print(f"Road records used for optimization: {len(roads):,}")

# Build the network nodes and indices.
nodes = sorted(
    set(roads["u_norm"]) | set(roads["v_norm"])
)

node_index = {node: i for i, node in enumerate(nodes)}

N = len(nodes)
M = len(roads)

total_length_m = float(roads["length"].sum())
budget_m = BUDGET_FRACTION * total_length_m

if N == 0 or M == 0:
    raise ValueError(
        "The road graph is empty after filtering self-loops."
    )

# Identify hospital records using existing tags.
amenity = (
    hospitals["amenity"]
    .fillna("")
    .astype(str)
    .str.lower()
)

healthcare = (
    hospitals["healthcare"]
    .fillna("")
    .astype(str)
    .str.lower()
)

hospital_rows = hospitals[
    (amenity == "hospital") |
    (healthcare == "hospital")
].copy()

hospital_nodes = set(
    hospital_rows["nearest_node_id"]
    .dropna()
    .map(norm)
)

# Only retain hospital nodes present in the filtered graph.
hospital_nodes &= set(nodes)

if not hospital_nodes:
    raise ValueError(
        "No hospital nodes match the road graph. "
        "Check nearest_node_id and road endpoint identifiers."
    )

print("=" * 70)
print("EXACT HOSPITAL-ACCESS ROAD PROTECTION MODEL")
print("=" * 70)
print(f"Original road records: {len(roads) + self_loop_count:,}")
print(f"Excluded self-loops: {self_loop_count:,}")
print(f"Road records used: {M:,}")
print(f"Graph nodes: {N:,}")
print(f"Hospital records: {len(hospital_rows):,}")
print(f"Distinct hospital nodes: {len(hospital_nodes):,}")
print(f"Total road length: {total_length_m:,.2f} m")
print(f"Length budget: {budget_m:,.2f} m")


# =========================================================
# 4. Create design failure scenario
# =========================================================
# This is a random stress test, not a landslide forecast.
design_rng = random.Random(DESIGN_SEED)

all_edge_indices = list(range(M))

design_failure_count = round(
    M * DESIGN_FAILURE_PERCENT / 100
)

design_failed = set(
    design_rng.sample(
        all_edge_indices,
        design_failure_count
    )
)

print(f"\nDesign failure rate: {DESIGN_FAILURE_PERCENT}%")
print(f"Failed roads in design scenario: {len(design_failed):,}")
print("Creating mixed-integer network-flow model...")


# =========================================================
# 5. Build mixed-integer linear programming model
# =========================================================
model = pl.LpProblem(
    "Exact_Hospital_Access_Protection",
    pl.LpMaximize,
)

# protect[e] = 1 if failed road e is protected.
protect = {
    e: pl.LpVariable(
        f"protect_{e}",
        cat=pl.LpBinary
    )
    for e in sorted(design_failed)
}

# reachable[v] = 1 if node v can be reached from a hospital.
reachable = {
    node: pl.LpVariable(
        f"reachable_{node_index[node]}",
        cat=pl.LpBinary,
    )
    for node in nodes
}

# Directed mathematical flow variables.
flow_uv = {}
flow_vu = {}

incoming = {node: [] for node in nodes}
outgoing = {node: [] for node in nodes}

for row in roads.itertuples(index=False):
    e = int(row.edge_index)
    u = row.u_norm
    v = row.v_norm

    f_uv = pl.LpVariable(
        f"flow_{e}_uv",
        lowBound=0,
        upBound=N,
    )

    f_vu = pl.LpVariable(
        f"flow_{e}_vu",
        lowBound=0,
        upBound=N,
    )

    flow_uv[e] = f_uv
    flow_vu[e] = f_vu

    outgoing[u].append(f_uv)
    incoming[v].append(f_uv)

    outgoing[v].append(f_vu)
    incoming[u].append(f_vu)

    # Failed roads carry flow only if protected.
    if e in design_failed:
        model += (
            f_uv <= N * protect[e],
            f"failed_edge_capacity_uv_{e}",
        )

        model += (
            f_vu <= N * protect[e],
            f"failed_edge_capacity_vu_{e}",
        )

# Hospital nodes supply flow to the network.
source_flow = {
    node: pl.LpVariable(
        f"hospital_source_{node_index[node]}",
        lowBound=0,
        upBound=N,
    )
    for node in sorted(hospital_nodes)
}

# Flow conservation constraints.
for node in nodes:
    supply = (
        source_flow[node]
        if node in hospital_nodes
        else 0
    )

    model += (
        pl.lpSum(incoming[node])
        - pl.lpSum(outgoing[node])
        + supply
        == reachable[node],
        f"node_flow_balance_{node_index[node]}",
    )

# Total protected length must not exceed the budget.
model += (
    pl.lpSum(
        float(roads.iloc[e]["length"]) * protect[e]
        for e in protect
    ) <= budget_m,
    "Protection_length_budget",
)

# Maximize the number of reachable graph nodes.
model += (
    pl.lpSum(reachable.values()),
    "Reachable_nodes",
)


# =========================================================
# 6. Solve the optimization model
# =========================================================
solver = pl.PULP_CBC_CMD(
    msg=True,
    gapRel=0.0,
    timeLimit=SOLVER_TIME_LIMIT_SECONDS,
)

if not solver.available():
    raise RuntimeError(
        "CBC is unavailable. Install it with:\n"
        'python -m pip install "pulp[cbc]"'
    )

start_time = time.time()
model.solve(solver)
elapsed_seconds = time.time() - start_time

status = pl.LpStatus[model.status]

print("\n" + "=" * 70)
print("SOLVER FINISHED")
print("=" * 70)
print(f"Solver status: {status}")
print(f"Elapsed time: {elapsed_seconds:.2f} seconds")

# Check whether CBC returned variable values.
has_incumbent = any(
    safe_value(var) is not None
    for var in reachable.values()
)

if not has_incumbent:
    raise RuntimeError(
        "No feasible incumbent solution was returned. "
        "Try a longer time limit or a smaller test network."
    )

selected_indices = {
    e
    for e, var in protect.items()
    if (
        safe_value(var) is not None
        and safe_value(var) > 0.5
    )
}

roads["exact_hospital_protection"] = 0

roads.loc[
    roads["edge_index"].isin(selected_indices),
    "exact_hospital_protection",
] = 1

selected_roads = roads[
    roads["edge_index"].isin(selected_indices)
].copy()

protected_length_m = float(selected_roads["length"].sum())
budget_remaining_m = budget_m - protected_length_m

if protected_length_m > budget_m + 1e-4:
    raise RuntimeError(
        "The selected roads exceed the length budget."
    )

reachable_solution = {
    node: safe_value(var)
    for node, var in reachable.items()
}

if any(
    value is None
    for value in reachable_solution.values()
):
    raise RuntimeError(
        "Some reachability variables have no solution values."
    )

design_reachable_nodes = sum(
    value > 0.5
    for value in reachable_solution.values()
)

optimality_proven = status == "Optimal"

if optimality_proven:
    print("CBC proved optimality for this MILP.")
else:
    print(
        "WARNING: CBC did not prove optimality. "
        "The incumbent is a candidate solution, "
        "not a proven optimum."
    )


# =========================================================
# 7. Save optimization outputs
# =========================================================
selected_csv = (
    OUTPUTS /
    "exact_hospital_optimization_selected_roads.csv"
)

selected_gpkg = (
    OUTPUTS /
    "exact_hospital_optimization_selected_roads.gpkg"
)

all_roads_csv = (
    OUTPUTS /
    "exact_hospital_optimization_all_roads.csv"
)

summary_csv = (
    OUTPUTS /
    "exact_hospital_optimization_summary.csv"
)

summary_json = (
    OUTPUTS /
    "exact_hospital_optimization_summary.json"
)

# Save selected roads.
selected_roads.drop(
    columns=["geometry"],
    errors="ignore",
).to_csv(selected_csv, index=False)

# Save all filtered optimization roads.
roads.drop(
    columns=["geometry"],
    errors="ignore",
).to_csv(all_roads_csv, index=False)

# Save selected road geometries separately.
if not selected_roads.empty:
    selected_roads.to_file(
        selected_gpkg,
        layer="selected_roads",
        driver="GPKG",
        index=False,
    )

summary = {
    "solver": "PuLP/CBC",
    "solver_status": status,
    "optimality_proven": optimality_proven,
    "elapsed_seconds": elapsed_seconds,
    "original_road_count": M + self_loop_count,
    "excluded_self_loop_count": self_loop_count,
    "road_count": M,
    "node_count": N,
    "hospital_records": int(len(hospital_rows)),
    "distinct_hospital_nodes": int(len(hospital_nodes)),
    "design_failure_percent": DESIGN_FAILURE_PERCENT,
    "design_seed": DESIGN_SEED,
    "design_failed_road_count": len(design_failed),
    "budget_fraction": BUDGET_FRACTION,
    "total_road_length_m": total_length_m,
    "budget_length_m": budget_m,
    "selected_road_count": len(selected_indices),
    "protected_length_m": protected_length_m,
    "budget_remaining_m": budget_remaining_m,
    "design_reachable_node_count": int(
        design_reachable_nodes
    ),
    "design_reachable_percent": (
        100 * design_reachable_nodes / N if N else 0
    ),
    "objective": "Maximize nodes reachable from any hospital",
    "limitation": (
        "One randomly generated design-failure scenario. "
        "Random road failures are not calibrated landslide probabilities. "
        "Nodes are used as a proxy for access, not population."
    ),
}

pd.DataFrame([summary]).to_csv(
    summary_csv,
    index=False,
)

with open(summary_json, "w", encoding="utf-8") as file:
    json.dump(summary, file, indent=2)

print("\nOptimization summary:")

for key, value in summary.items():
    print(f"{key}: {value}")

print("\nSaved:")
print(selected_csv)

print(
    selected_gpkg
    if not selected_roads.empty
    else "No selected roads; GeoPackage not created."
)

print(all_roads_csv)
print(summary_csv)
print(summary_json)


# =========================================================
# 8. Independent evaluation on random test scenarios
# =========================================================
def evaluate_graph(closed_indices):
    """Evaluate network reachability and distances after failures."""
    closed_indices = set(closed_indices)

    graph = nx.MultiGraph()
    graph.add_nodes_from(nodes)

    for row in roads.itertuples(index=False):
        e = int(row.edge_index)

        if e in closed_indices:
            continue

        graph.add_edge(
            row.u_norm,
            row.v_norm,
            key=e,
            length=float(row.length),
        )

    distances = nx.multi_source_dijkstra_path_length(
        graph,
        hospital_nodes,
        weight="length",
    )

    count_reachable = len(distances)

    return {
        "reachable_nodes": count_reachable,
        "total_nodes": N,
        "reachable_percent": (
            100 * count_reachable / N if N else 0
        ),
        "mean_distance_km": (
            sum(distances.values()) / count_reachable / 1000
            if count_reachable
            else float("nan")
        ),
    }


test_rng = random.Random(TEST_SEED)
trial_rows = []

print("\nRunning independent evaluation scenarios...")

for failure_percent in TEST_FAILURE_PERCENTAGES:
    failure_count = round(
        M * failure_percent / 100
    )

    print(
        f"Evaluating {failure_percent}% failures "
        f"({failure_count} failed roads per trial)"
    )

    for trial in range(1, TEST_TRIALS + 1):
        failed_indices = set(
            test_rng.sample(
                all_edge_indices,
                failure_count,
            )
        )

        # Both strategies use the same initial failure set.
        scenarios = {
            "No protection": failed_indices,
            "Exact hospital-access optimization": (
                failed_indices - selected_indices
            ),
        }

        for strategy, closed in scenarios.items():
            metrics = evaluate_graph(closed)

            trial_rows.append({
                "failure_percent": failure_percent,
                "trial": trial,
                "strategy": strategy,
                "initial_failure_set_size": len(failed_indices),
                "roads_closed_after_protection": len(closed),
                **metrics,
            })

trials = pd.DataFrame(trial_rows)

trials_file = (
    OUTPUTS /
    "exact_hospital_optimization_test_trials.csv"
)

summary_file = (
    OUTPUTS /
    "exact_hospital_optimization_test_summary.csv"
)

trials.to_csv(trials_file, index=False)

test_summary = (
    trials.groupby(
        ["failure_percent", "strategy"],
        as_index=False,
    )
    .agg(
        trials=("trial", "count"),
        mean_reachable_percent=("reachable_percent", "mean"),
        sd_reachable_percent=("reachable_percent", "std"),
        mean_distance_km=("mean_distance_km", "mean"),
        sd_mean_distance_km=("mean_distance_km", "std"),
        mean_roads_closed=("roads_closed_after_protection", "mean"),
    )
)

test_summary.to_csv(summary_file, index=False)

print("\n" + "=" * 70)
print("INDEPENDENT TEST RESULTS")
print("=" * 70)

print(test_summary.round(3).to_string(index=False))

print(f"\nDetailed trials saved to: {trials_file}")
print(f"Summary saved to: {summary_file}")
