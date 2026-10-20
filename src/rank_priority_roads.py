
from pathlib import Path

import geopandas as gpd
import pandas as pd
import networkx as nx

ROOT = Path(__file__).resolve().parent.parent

# Read the cleaned road dataset
ROAD_FILE = ROOT / "data/processed/road_risk_scores_unique.gpkg"
OUTPUT_FILE = ROOT / "data/processed/road_priority_ranking.csv"

if not ROAD_FILE.exists():
    raise FileNotFoundError(
        f"Missing {ROAD_FILE}. Run remove_duplicate_roads.py first."
    )

roads = gpd.read_file(ROAD_FILE)

required = ["u", "v", "length", "risk_proxy_score"]
missing = [c for c in required if c not in roads.columns]

if missing:
    raise ValueError(f"Missing required columns: {missing}")

roads = roads.dropna(subset=required).copy()
roads = roads[roads["length"] > 0].copy()

if roads.empty:
    raise ValueError("No valid road segments remain after cleaning.")

# Create canonical endpoint IDs for undirected connections.
roads["_u"] = roads["u"].astype(str)
roads["_v"] = roads["v"].astype(str)

roads["_node_a"] = roads[["_u", "_v"]].min(axis=1)
roads["_node_b"] = roads[["_u", "_v"]].max(axis=1)

# Build a simple graph for network-level centrality.
# Keep every road segment in the GeoDataFrame and CSV.
# For parallel connections, use the shortest length in the
# topology graph to represent the available connection.
G = nx.Graph()

for (a, b), group in roads.groupby(["_node_a", "_node_b"]):
    if a == b:
        continue

    G.add_edge(
        a,
        b,
        length=float(group["length"].min())
    )

print("Input road segments:", len(roads))
print("Unique undirected node pairs:", G.number_of_edges())
print("Nodes:", G.number_of_nodes())
print("Connected components:", nx.number_connected_components(G))

# Approximate edge betweenness for faster computation.
centrality = nx.edge_betweenness_centrality(
    G,
    k=min(500, G.number_of_nodes()),
    normalized=True,
    weight="length",
    seed=42,
)

def edge_key(u, v):
    return tuple(sorted((str(u), str(v))))

centrality_by_pair = {
    edge_key(u, v): score
    for (u, v), score in centrality.items()
}

# Parallel physical road segments share the centrality of
# their node pair, but retain their own risk and length values.
roads["network_centrality"] = [
    centrality_by_pair.get(edge_key(u, v), 0.0)
    for u, v in zip(roads["_u"], roads["_v"])
]

def minmax(series):
    low = series.min()
    high = series.max()

    if pd.isna(low) or pd.isna(high) or high == low:
        return pd.Series(0.0, index=series.index)

    return (series - low) / (high - low)

roads["centrality_score"] = minmax(roads["network_centrality"])

# Baseline weighting: 50% risk and 50% centrality.
roads["combined_priority_score"] = (
    roads["risk_proxy_score"] + roads["centrality_score"]
) / 2

# Restore original columns; retain individual road segments.
roads = roads.drop(
    columns=["_u", "_v", "_node_a", "_node_b"]
)

roads = roads.sort_values(
    "combined_priority_score",
    ascending=False
)

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

roads.drop(columns="geometry", errors="ignore").to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nSaved ranking:", OUTPUT_FILE)
print("Ranked road segments:", len(roads))

print("\nTop 15 priority roads:")

display_columns = [
    "u",
    "v",
    "length",
    "risk_proxy_score",
    "network_centrality",
    "combined_priority_score",
]

print(roads[display_columns].head(15).to_string(index=False))
