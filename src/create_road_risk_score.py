
from pathlib import Path

import geopandas as gpd
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent.parent

ROAD_FILE = ROOT / "data/processed/road_terrain_clean.gpkg"
LANDSLIDE_FILE = ROOT / "data/raw/landslide_inventory.gpkg"
STUDY_AREA_FILE = ROOT / "data/raw/study_area.gpkg"

OUTPUT_FILE = ROOT / "data/processed/road_risk_scores.gpkg"
OUTPUT_CSV = ROOT / "data/processed/road_risk_scores.csv"

print("Loading road, landslide, and study-area data...")

roads = gpd.read_file(ROAD_FILE)
landslides = gpd.read_file(LANDSLIDE_FILE)
study_area = gpd.read_file(STUDY_AREA_FILE)

# Check that the road dataset has a projected CRS.
if roads.crs is None:
    raise ValueError("Road dataset has no CRS.")

if not roads.crs.is_projected:
    raise ValueError(
        "Road CRS must be projected in metres for distance calculations."
    )

# Keep roads with usable terrain measurements.
required = ["slope_mean_deg", "slope_max_deg"]
roads = roads.dropna(subset=required).copy()

# Remove invalid road geometries.
roads = roads[
    roads.geometry.notna()
    & ~roads.geometry.is_empty
].copy()

if roads.empty:
    raise ValueError("No valid roads with terrain measurements.")

# Transform the other datasets to the road CRS.
landslides = landslides.to_crs(roads.crs)
study_area = study_area.to_crs(roads.crs)

# Keep valid landslide point events only.
landslides = landslides[
    landslides.geometry.notna()
    & ~landslides.geometry.is_empty
    & (landslides.geometry.geom_type == "Point")
].copy()

if landslides.empty:
    raise ValueError("No usable landslide point events found.")

# Create the study-area boundary and a 10 km buffer.
study_boundary = study_area.geometry.union_all()
analysis_area = study_boundary.buffer(10_000)

# Retain events inside Ratnapura and the surrounding buffer.
landslides = landslides[
    landslides.geometry.within(analysis_area)
].copy()

if landslides.empty:
    raise ValueError(
        "No landslide points found within the study area "
        "and its 10 km buffer."
    )

print("Local landslide events used:", len(landslides))

# Calculate the distance from each road midpoint to the nearest
# local catalogued landslide event.
midpoints = roads[["geometry"]].copy()
midpoints["geometry"] = roads.geometry.interpolate(
    0.5, normalized=True
)

nearest = gpd.sjoin_nearest(
    midpoints,
    landslides[["geometry"]],
    how="left",
    distance_col="nearest_landslide_m"
)

# Resolve tied nearest-event matches.
nearest_distances = nearest.groupby(level=0)[
    "nearest_landslide_m"
].min()

roads["nearest_landslide_m"] = nearest_distances.reindex(
    roads.index
)

# Normalize indicators to a 0–1 scale.
def minmax(series):
    low = series.min()
    high = series.max()

    if pd.isna(low) or pd.isna(high) or high == low:
        return pd.Series(0.0, index=series.index)

    return (series - low) / (high - low)


roads["mean_slope_score"] = minmax(
    roads["slope_mean_deg"]
)

roads["max_slope_score"] = minmax(
    roads["slope_max_deg"]
)

# A shorter distance receives a higher proximity score.
roads["landslide_proximity_score"] = (
    1 - minmax(roads["nearest_landslide_m"])
)

# Equal-weight exploratory risk proxy, not a probability.
roads["risk_proxy_score"] = (
    roads["mean_slope_score"]
    + roads["max_slope_score"]
    + roads["landslide_proximity_score"]
) / 3

roads["risk_proxy_rank"] = roads[
    "risk_proxy_score"
].rank(method="average", ascending=False)

roads = roads.sort_values(
    "risk_proxy_score", ascending=False
)

# Save the results.
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

roads.to_file(OUTPUT_FILE, driver="GPKG")

roads.drop(columns="geometry").to_csv(
    OUTPUT_CSV, index=False
)

print("\nRisk proxy created successfully.")
print("Road segments scored:", len(roads))
print("Local catalog events used:", len(landslides))
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
            "risk_proxy_rank",
        ]
    ].head(10).to_string(index=False)
)
