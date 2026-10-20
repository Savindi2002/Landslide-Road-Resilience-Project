
from pathlib import Path
import geopandas as gpd
import pandas as pd
import numpy as np
import networkx as nx

ROOT = Path(__file__).resolve().parent.parent

ROAD_FILE = ROOT / "data/processed/road_risk_scores.gpkg"
OUTPUT_FILE = ROOT / "data/processed/road_priority_ranking.csv"

if not ROAD_FILE.exists():
    raise FileNotFoundError(
        f"Missing {ROAD_FILE}. Run create_road_risk_score.py first."
    )

roads = gpd.read_file(ROAD_FILE)

required = ["u", "v", "length", "risk_proxy_score"]
missing = [c for c in required if c not in roads.columns]

if missing:
    raise ValueError(f"Missing required columns: {missing}")

roads = roads.dropna(subset=required).copy()
roads = roads[roads["length"] > 0].copy()

# Build the road graph.
G = nx.Graph()

for idx, row in roads.iterrows():
    u, v = str(row["u"]), str(row["v"])
    G.add_edge(
        u,
        v,
        length=float(row["length"]),
        road_index=idx,
    )

print("Nodes:", G.number_of_nodes())
print("Edges:", G.number_of_edges())
print("Connected components:", nx.number_connected_components(G))

# Estimate road importance using edge betweenness centrality.
# This can take time on a large road network.
centrality = nx.edge_betweenness_centrality(
    G,
    normalized=True,
    weight="length",
)

def edge_key(u, v):
    return tuple(sorted((str(u), str(v))))

centrality_by_pair = {
    edge_key(u, v): score
    for (u, v), score in centrality.items()
}

roads["network_centrality"] = roads.apply(
    lambda r: centrality_by_pair.get(
        edge_key(r["u"], r["v"]), 0.0
    ),
    axis=1,
)

def minmax(series):
    low, high = series.min(), series.max()
    if pd.isna(low) or pd.isna(high) or high == low:
        return pd.Series(0.0, index=series.index)
    return (series - low) / (high - low)

roads["centrality_score"] = minmax(roads["network_centrality"])

# Equal weighting is a baseline, not an optimized or validated policy.
roads["combined_priority_score"] = (
    roads["risk_proxy_score"] + roads["centrality_score"]
) / 2

roads = roads.sort_values(
    "combined_priority_score", ascending=False
)

roads.drop(columns="geometry").to_csv(OUTPUT_FILE, index=False)

print("\nSaved:", OUTPUT_FILE)
print("\nTop 15 priority roads:")
print(
    roads[
        [
            "u",
            "v",
            "length",
            "risk_proxy_score",
            "network_centrality",
            "combined_priority_score",
        ]
    ].head(15).to_string(index=False)
)
