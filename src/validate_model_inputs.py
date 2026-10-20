
from pathlib import Path
import pandas as pd
import networkx as nx

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "processed"

roads = pd.read_csv(DATA / "road_priority_ranking.csv")
selected = pd.read_csv(DATA / "selected_protection_roads.csv")
facilities = pd.read_csv(DATA / "healthcare_graph_locations.csv")


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


# Prepare the road network
roads = roads.dropna(
    subset=["u", "v", "length", "risk_proxy_score"]
).copy()
roads = roads[roads["length"] > 0].copy()

roads["_edge_id"] = roads.apply(edge_id, axis=1)
selected["_edge_id"] = selected.apply(edge_id, axis=1)

road_ids = set(roads["_edge_id"])
graph = nx.MultiGraph()

for _, row in roads.iterrows():
    graph.add_edge(
        norm(row["u"]),
        norm(row["v"]),
        key=row["_edge_id"],
        length=float(row["length"]),
    )

print("\n=== ROAD NETWORK VALIDATION ===")
print("Road rows:", len(roads))
print("Unique edge IDs:", len(road_ids))
print("Graph nodes:", graph.number_of_nodes())
print("Graph edges:", graph.number_of_edges())
print("Connected components:", nx.number_connected_components(graph))

print("\n=== PROTECTED ROAD MATCHING ===")

for strategy, group in selected.groupby("strategy"):
    ids = set(group["_edge_id"])
    matched = ids & road_ids
    unmatched = ids - road_ids

    print(f"\n{strategy}")
    print("Selected rows:", len(group))
    print("Unique selected IDs:", len(ids))
    print("Matched IDs:", len(matched))
    print("Unmatched IDs:", len(unmatched))
    print("Protected length (km):", round(group["length"].sum() / 1000, 2))

# Check risk-score values
print("\n=== RISK SCORE CHECK ===")
print(roads["risk_proxy_score"].describe().round(4).to_string())
print(
    "Missing risk scores:",
    roads["risk_proxy_score"].isna().sum()
)
print(
    "Risk scores outside [0, 1]:",
    ((roads["risk_proxy_score"] < 0) |
     (roads["risk_proxy_score"] > 1)).sum()
)

# Check hospital mapping
amenity = facilities.get(
    "amenity", pd.Series("", index=facilities.index)
).fillna("").astype(str).str.lower()

healthcare = facilities.get(
    "healthcare", pd.Series("", index=facilities.index)
).fillna("").astype(str).str.lower()

hospitals = facilities[
    (amenity == "hospital") | (healthcare == "hospital")
].copy()

mapped = hospitals["nearest_node_id"].dropna().map(norm)
graph_nodes = set(graph.nodes)

print("\n=== HOSPITAL MAPPING CHECK ===")
print("Hospital facility records:", len(hospitals))
print("Hospitals with a mapped node:", len(mapped))
print("Mapped hospital nodes in graph:", len(set(mapped) & graph_nodes))
print("Hospital node IDs missing from graph:", len(set(mapped) - graph_nodes))

print("\nValidation report completed.")
