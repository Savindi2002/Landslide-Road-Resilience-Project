
from pathlib import Path
import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent

INPUT = ROOT / "data/processed/road_risk_scores.gpkg"
OUTPUT = ROOT / "data/processed/road_risk_scores_unique.gpkg"

if not INPUT.exists():
    raise FileNotFoundError(f"Input file not found: {INPUT}")

roads = gpd.read_file(INPUT)

# Check required columns
required = ["u", "v"]
missing = [col for col in required if col not in roads.columns]

if missing:
    raise ValueError(f"Missing required columns: {missing}")

# Treat u-v and v-u as the same road direction pair
roads["_u"] = roads["u"].astype(str)
roads["_v"] = roads["v"].astype(str)

roads["_node_a"] = roads[["_u", "_v"]].min(axis=1)
roads["_node_b"] = roads[["_u", "_v"]].max(axis=1)

# Identify duplicate road segments
identity = ["_node_a", "_node_b"]

for col in ["osmid", "key"]:
    if col in roads.columns:
        identity.append(col)

if "length" in roads.columns:
    roads["_length_key"] = roads["length"].round(2)
    identity.append("_length_key")

before = len(roads)

roads = roads.drop_duplicates(
    subset=identity,
    keep="first"
).copy()

# Remove temporary columns
temporary_columns = [
    "_u",
    "_v",
    "_node_a",
    "_node_b",
    "_length_key",
]

roads = roads.drop(
    columns=temporary_columns,
    errors="ignore"
)

# Save cleaned road data
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
roads.to_file(OUTPUT, driver="GPKG")

print("Original rows:", before)
print("Rows after deduplication:", len(roads))
print("Rows removed:", before - len(roads))
print("Saved:", OUTPUT)
