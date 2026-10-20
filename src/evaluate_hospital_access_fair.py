
from pathlib import Path
import pandas as pd
import networkx as nx
import math

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "processed"

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


# Clean and identify road edges
roads = roads.dropna(
    subset=["u", "v", "length", "risk_proxy_score"]
).copy()

roads = roads[roads["length"] > 0].copy()
roads["_edge_id"] = roads.apply(edge_id, axis=1)
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

# Build the road graph
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

# Protection selections for each strategy
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


# Test multiple failure levels using nested high-risk failure sets
results = []
failure_percentages = [2, 5, 10]

sorted_roads = roads.sort_values(
    "risk_proxy_score", ascending=False
).copy()

for failure_percent in failure_percentages:

    failure_count = max(
        1,
        math.ceil(len(sorted_roads) * failure_percent / 100)
    )

    failed_ids = set(
        sorted_roads.head(failure_count)["_edge_id"]
    )

    print(
        f"\nTesting {failure_percent}% failure scenario "
        f"({len(failed_ids)} unique failed road IDs)"
    )

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

        results.append({
            "failure_percent": failure_percent,
            "strategy": strategy,
            "initial_failure_set_size": len(failed_ids),
            "roads_closed_after_protection": len(closed_ids),
            **evaluate(H),
        })

# Save results to a new file
out = pd.DataFrame(results)

output_file = DATA / "hospital_access_sensitivity.csv"
out.to_csv(output_file, index=False)

print("\n=== HOSPITAL ACCESS SENSITIVITY ANALYSIS ===")
print(out.round(3).to_string(index=False))
print("\nSaved:", output_file)
print(
    "\nNote: Failure sets contain the highest-risk roads. "
    "Protected roads are assumed to remain operational."
)
