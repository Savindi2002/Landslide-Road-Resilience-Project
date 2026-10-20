
from pathlib import Path
import geopandas as gpd
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent.parent

ROAD_FILE = ROOT / "data/processed/road_terrain_clean.gpkg"
LANDSLIDE_FILE = ROOT / "data/raw/landslide_inventory.gpkg"
OUTPUT_FILE = ROOT / "data/processed/road_risk_scores.gpkg"
OUTPUT_CSV = ROOT / "data/processed/road_risk_scores.csv"

print("Loading road and landslide data...")

roads = gpd.read_file(ROAD_FILE)
landslides = gpd.read_file(LANDSLIDE_FILE)

# Keep only records with usable terrain measurements.
required = ["slope_mean_deg", "slope_max_deg"]
roads = roads.dropna(subset=required).copy()

if roads.empty:
    raise ValueError("No roads have valid slope measurements.")

# Ensure both datasets use the same projected CRS.
landslides = landslides.to_crs(roads.crs)

# Keep point events only; do not treat polygons as point locations.
landslides = landslides[
    landslides.geometry.notna()
    & ~landslides.geometry.is_empty
].copy()

if landslides.empty:
    raise ValueError("No usable landslide geometries found.")

# Calculate distance from each road midpoint to the nearest catalog event.
midpoints = roads[["geometry"]].copy()
midpoints["geometry"] = roads.geometry.interpolate(0.5, normalized=True)

nearest = gpd.sjoin_nearest(
    midpoints,
    landslides[["geometry"]],
    how="left",
    distance_col="nearest_landslide_m"
)

# If nearest joins return tied events, retain the smallest distance per road.
nearest = nearest.groupby(level=0)["nearest_landslide_m"].min()
roads["nearest_landslide_m"] = nearest.reindex(roads.index)

# Normalize each indicator to a 0–1 scale.
def minmax(series):
    low = series.min()
    high = series.max()

    if pd.isna(low) or pd.isna(high) or high == low:
        return pd.Series(0.0, index=series.index)

    return (series - low) / (high - low)

roads["mean_slope_score"] = minmax(roads["slope_mean_deg"])
roads["max_slope_score"] = minmax(roads["slope_max_deg"])

# Closer to a catalog event means a higher proximity score.
distance = roads["nearest_landslide_m"]
roads["landslide_proximity_score"] = 1 - minmax(distance)

# Equal-weight exploratory score, not a probability.
roads["risk_proxy_score"] = (
    roads["mean_slope_score"]
    + roads["max_slope_score"]
    + roads["landslide_proximity_score"]
) / 3

roads["risk_proxy_rank"] = (
    roads["risk_proxy_score"]
    .rank(method="average", ascending=False)
)

roads = roads.sort_values("risk_proxy_score", ascending=False)

roads.to_file(OUTPUT_FILE, driver="GPKG")

roads.drop(columns="geometry").to_csv(OUTPUT_CSV, index=False)

print("\nRisk proxy created successfully.")
print("Road segments scored:", len(roads))
print("Catalog events used:", len(landslides))
print("Saved:", OUTPUT_FILE)
print("Saved:", OUTPUT_CSV)

print("\nTop 10 roads by exploratory risk proxy:")
print(
    roads[
        [
            "u",
            "v",
            "slope_mean_deg",
            "slope_max_deg",
            "nearest_landslide_m",
            "risk_proxy_score",
        ]
    ].head(10).to_string(index=False)
)
