
from pathlib import Path
import math
import random
import pandas as pd
import networkx as nx

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "processed"

# Reproducible experiment settings
RANDOM_SEED = 42
N_TRIALS = 30
FAILURE_PERCENTAGES = [2, 5, 10]

roads = pd.read_csv(DATA / "road_priority_ranking.csv")
facilities = pd.read_csv(DATA / "healthcare_graph_locations.csv")
selected = pd.read_csv(DATA / "selected_protection_roads.csv")


def norm(x):
    if pd.isna(x):
        return "NA"
    if isinstance(x, (int, float)) and float(x).is_integer():
        return str(int(x))
    return str(x).strip()


def edge_id(row):
    a, b = sorted([norm(row["u"]), norm(row["v"])])
    key = norm(row["key"]) if "key" in row.index else "NA"
    osmid = norm(row["osmid"]) if "osmid" in row.index else "NA"
    length = round(float(row["length"]), 2)
    return f"{a}|{b}|{key}|{osmid}|{length}"


# Clean roads and create stable edge identifiers
roads = roads.dropna(
    subset=["u", "v", "length", "risk_proxy_score"]
).copy()
roads = roads[roads["length"] > 0].copy()
roads["_edge_id"] = roads.apply(edge_id, axis=1)

# Use unique edge IDs for sampling and graph construction
roads = roads.drop_duplicates(subset="_edge_id").copy()
roads = roads.reset_index(drop=True)

selected["_edge_id"] = selected.apply(edge_id, axis=1)

# Identify hospital locations
amenity = facilities.get(
    "amenity", pd.Series("", index=facilities.index)
).fillna("").astype(str).str.lower()

healthcare = facilities.get(
    "healthcare", pd.Series("", index=facilities.index)
).fillna("").astype(str).str.lower()

hospitals = facilities[
    (amenity == "hospital") | (healthcare == "hospital")
].dropna(subset=["nearest_node_id"])

# Build the base road network
G = nx.MultiGraph()

for _, r in roads.iterrows():
    G.add_edge(
        norm(r["u"]),
        norm(r["v"]),
        key=r["_edge_id"],
        length=float(r["length"]),
    )

hospital_nodes = set(hospitals["nearest_node_id"].map(norm))
hospital_nodes &= set(G.nodes)

if not hospital_nodes:
    raise ValueError("No hospital nodes match the road graph.")

# Protected road IDs for each strategy
strategies = [
    "No protection",
    "Risk-based",
    "Centrality-based",
    "Combined",
]

protected = {
    name: set(
        selected.loc[
            selected["strategy"].astype(str).str.lower()
            == name.lower(),
            "_edge_id",
        ]
    )
    for name in strategies[1:]
}

available_ids = set(roads["_edge_id"])

for name, ids in protected.items():
    unmatched = ids - available_ids
    if unmatched:
        print(
            f"Warning: {len(unmatched)} protected edge IDs "
            f"for {name} do not match the road network."
        )


def evaluate(graph):
    distances = nx.multi_source_dijkstra_path_length(
        graph, hospital_nodes, weight="length"
    )
    vals = list(distances.values())

    return {
        "reachable_nodes": len(vals),
        "total_nodes": graph.number_of_nodes(),
        "reachable_percent": (
            100 * len(vals) / graph.number_of_nodes()
        ),
        "mean_distance_km": (
            sum(vals) / len(vals) / 1000
            if vals else float("nan")
        ),
        "median_distance_km": (
            pd.Series(vals).median() / 1000
            if vals else float("nan")
        ),
    }


# Random failures are sampled uniformly from road IDs.
# All strategies receive the same failures within each trial.
rng = random.Random(RANDOM_SEED)
road_ids = roads["_edge_id"].tolist()
trial_results = []

print(f"Unique road edges: {len(road_ids)}")
print(f"Hospital network nodes: {len(hospital_nodes)}")
print(f"Random trials per failure level: {N_TRIALS}")
print(f"Random seed: {RANDOM_SEED}")

for failure_percent in FAILURE_PERCENTAGES:
    failure_count = max(
        1, math.ceil(len(road_ids) * failure_percent / 100)
    )

    print(
        f"\nRunning {failure_percent}% failure scenario: "
        f"{failure_count} failed roads per trial"
    )

    for trial in range(1, N_TRIALS + 1):
        failed_ids = set(rng.sample(road_ids, failure_count))

        for strategy in strategies:
            protected_ids = protected.get(strategy, set())
            closed_ids = failed_ids - protected_ids

            H = G.copy()

            for _, r in roads[
                roads["_edge_id"].isin(closed_ids)
            ].iterrows():
                u = norm(r["u"])
                v = norm(r["v"])
                eid = r["_edge_id"]

                if H.has_edge(u, v, key=eid):
                    H.remove_edge(u, v, key=eid)

            metrics = evaluate(H)

            trial_results.append({
                "failure_percent": failure_percent,
                "trial": trial,
                "strategy": strategy,
                "initial_failure_set_size": len(failed_ids),
                "roads_closed_after_protection": len(closed_ids),
                **metrics,
            })

# Save every trial so results can be inspected later
trial_df = pd.DataFrame(trial_results)
trial_file = DATA / "hospital_access_random_trials.csv"
trial_df.to_csv(trial_file, index=False)

# Summarize average performance and variation across trials
summary = (
    trial_df.groupby(["failure_percent", "strategy"])
    .agg(
        trials=("trial", "count"),
        mean_reachable_percent=("reachable_percent", "mean"),
        sd_reachable_percent=("reachable_percent", "std"),
        mean_distance_km=("mean_distance_km", "mean"),
        sd_mean_distance_km=("mean_distance_km", "std"),
        mean_roads_closed=("roads_closed_after_protection", "mean"),
    )
    .reset_index()
)

summary_file = DATA / "hospital_access_random_summary.csv"
summary.to_csv(summary_file, index=False)

print("\n=== RANDOM FAILURE SUMMARY ===")
print(summary.round(3).to_string(index=False))
print("\nDetailed trial results saved to:", trial_file)
print("Summary results saved to:", summary_file)
print(
    "\nScenario: uniformly random road failures; the same failure "
    "set is applied to all strategies in each trial. Protected "
    "roads are assumed to remain operational."
)
