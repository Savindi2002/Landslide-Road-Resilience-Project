
from pathlib import Path
import math
import pandas as pd
import networkx as nx

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "processed"

ROAD_FILE = DATA / "road_priority_ranking.csv"
FACILITY_FILE = DATA / "healthcare_graph_locations.csv"
SELECTED_FILE = DATA / "selected_protection_roads.csv"
OUTPUT_FILE = DATA / "hospital_access_simulation.csv"

for path in [ROAD_FILE, FACILITY_FILE, SELECTED_FILE]:
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path}. Check that the previous steps ran successfully."
        )

roads = pd.read_csv(ROAD_FILE)
facilities = pd.read_csv(FACILITY_FILE)
selected = pd.read_csv(SELECTED_FILE)

# Normalize IDs so CSV values such as 123 and 123.0 match.
def norm(value):
    if pd.isna(value):
        return "NA"
    if isinstance(value, (int, float)) and float(value).is_integer():
        return str(int(value))
    return str(value).strip()

def edge_id(row):
    a, b = sorted([norm(row["u"]), norm(row["v"])])
    key = norm(row["key"]) if "key" in row.index else "NA"
    osmid = norm(row["osmid"]) if "osmid" in row.index else "NA"
    length = round(float(row["length"]), 2)
    return f"{a}|{b}|{key}|{osmid}|{length}"

# Validate the road table.
required = ["u", "v", "length", "risk_proxy_score"]
missing = [c for c in required if c not in roads.columns]
if missing:
    raise ValueError(f"Road table is missing columns: {missing}")

roads = roads.dropna(subset=["u", "v", "length", "risk_proxy_score"]).copy()
roads = roads[roads["length"] > 0].copy()
roads["_edge_id"] = roads.apply(edge_id, axis=1)

if roads["_edge_id"].duplicated().any():
    print("WARNING: duplicate edge identities found; checking them is necessary.")
    roads = roads.drop_duplicates("_edge_id").copy()

# Select actual hospitals, not all healthcare facilities.
amenity = facilities.get(
    "amenity", pd.Series("", index=facilities.index)
).fillna("").astype(str).str.lower()

healthcare = facilities.get(
    "healthcare", pd.Series("", index=facilities.index)
).fillna("").astype(str).str.lower()

hospitals = facilities[
    (amenity == "hospital") | (healthcare == "hospital")
].copy()

if "nearest_node_id" not in hospitals.columns:
    raise ValueError("nearest_node_id is missing from the facility file.")

hospitals = hospitals.dropna(subset=["nearest_node_id"]).copy()
hospital_nodes = set(hospitals["nearest_node_id"].map(norm))

# Build an undirected multigraph to preserve parallel road edges.
G = nx.MultiGraph()

for _, row in roads.iterrows():
    u, v = norm(row["u"]), norm(row["v"])
    G.add_edge(
        u, v,
        key=row["_edge_id"],
        length=float(row["length"]),
    )

hospital_nodes &= set(G.nodes)

if not hospital_nodes:
    raise ValueError(
        "No mapped hospital nodes match the road graph. "
        "Check nearest_node_id against road node IDs."
    )

print("Road edges:", G.number_of_edges())
print("Road nodes:", G.number_of_nodes())
print("Mapped hospital facilities:", len(hospitals))
print("Distinct hospital network nodes:", len(hospital_nodes))

# Identify protected edges for each strategy.
if "strategy" not in selected.columns:
    raise ValueError("strategy column missing from selected roads file.")

selected["_edge_id"] = selected.apply(edge_id, axis=1)

strategy_names = ["Risk-based", "Centrality-based", "Combined"]
protected = {}

for name in strategy_names:
    subset = selected[
        selected["strategy"].astype(str).str.lower() == name.lower()
    ]
    protected[name] = set(subset["_edge_id"]) & set(roads["_edge_id"])

# Stress test: close the same number of high-risk, unprotected edges
# under each strategy. This is a hypothetical disruption scenario.
failure_count = max(1, math.ceil(len(roads) * 0.05))

def assess(graph):
    distances = nx.multi_source_dijkstra_path_length(
        graph, hospital_nodes, weight="length"
    )
    reachable = len(distances)
    total_nodes = graph.number_of_nodes()

    values_km = [distance / 1000 for distance in distances.values()]

    return {
        "nodes_reachable_to_hospital": reachable,
        "total_road_nodes": total_nodes,
        "reachable_nodes_percent": 100 * reachable / total_nodes,
        "mean_distance_to_nearest_hospital_km": (
            sum(values_km) / len(values_km) if values_km else float("nan")
        ),
        "median_distance_to_nearest_hospital_km": (
            pd.Series(values_km).median() if values_km else float("nan")
        ),
    }

results = []

# Reference: intact network, without simulated closures.
reference = assess(G)
results.append({
    "scenario": "No disruption (reference)",
    "edges_closed": 0,
    **reference,
})

# Compare no protection with the three protection strategies.
for name in ["No protection"] + strategy_names:
    protected_ids = set() if name == "No protection" else protected[name]

    candidates = roads[~roads["_edge_id"].isin(protected_ids)]
    candidates = candidates.sort_values(
        "risk_proxy_score", ascending=False
    )

    failed_ids = set(candidates.head(failure_count)["_edge_id"])

    H = G.copy()

    for _, row in roads[roads["_edge_id"].isin(failed_ids)].iterrows():
        u, v = norm(row["u"]), norm(row["v"])
        eid = row["_edge_id"]

        if H.has_edge(u, v, key=eid):
            H.remove_edge(u, v, key=eid)

    metrics = assess(H)

    results.append({
        "scenario": name,
        "edges_closed": len(failed_ids),
        **metrics,
    })

result_df = pd.DataFrame(results)
result_df.to_csv(OUTPUT_FILE, index=False)

print("\n=== HOSPITAL ACCESS SIMULATION ===")
print(result_df.round(3).to_string(index=False))
print("\nSaved results:", OUTPUT_FILE)
print(
    "\nInterpretation: simulated closures and road distances only; "
    "not observed disaster outcomes or travel times."
)
