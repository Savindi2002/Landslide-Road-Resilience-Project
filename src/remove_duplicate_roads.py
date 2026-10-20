
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

INPUT = ROOT / "data/processed/road_risk_scores.gpkg"
OUTPUT = ROOT / "data/processed/road_risk_scores_unique.gpkg"

roads = gpd.read_file(INPUT)

# Canonicalize endpoints so u-v and v-u can be compared.
roads["_u"] = roads["u"].astype(str)
roads["_v"] = roads["v"].astype(str)
roads["_node_a"] = roads[["_u", "_v"]].min(axis=1)
roads["_node_b"] = roads[["_u", "_v"]].max(axis=1)

# Retain distinct parallel edges when their OSM identifiers or keys differ.
identity = ["_node_a", "_node_b"]

for col in ["osmid", "key"]:
    if col in roads.columns:
        identity.append(col)

if "length" in roads.columns:
    roads["_length_key"] = roads["length"].round(2)
    identity.append("_length_key")

before = len(roads)
roads = roads.drop_duplicates(subset=identity, keep="first").copy()

roads = roads.drop(
    columns=[
        "_u", "_v", "_node_a", "_node_b", "_length_key"
    ],
    errors="ignore",
)

roads.to_file(OUTPUT, driver="GPKG")

print("Original rows:", before)
print("Rows after deduplication:", len(roads))
print("Rows removed:", before - len(roads))
print("Saved:", OUTPUT)
