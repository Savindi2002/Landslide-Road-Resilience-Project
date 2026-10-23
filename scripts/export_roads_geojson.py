
from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]

source = ROOT / "data" / "processed" / "road_risk_scores_unique.gpkg"
output = ROOT / "dashboard" / "public" / "data" / "roads.geojson"

if not source.exists():
    raise FileNotFoundError(f"Road dataset not found: {source}")

roads = gpd.read_file(source)

required = [
    "risk_proxy_score",
    "slope_mean_deg",
    "nearest_landslide_m",
    "length",
    "geometry",
]

missing = [column for column in required if column not in roads.columns]
if missing:
    raise ValueError(f"Missing required columns: {missing}")

# Keep only useful fields for the public-facing map.
keep = [
    "u",
    "v",
    "highway",
    "length",
    "slope_mean_deg",
    "nearest_landslide_m",
    "risk_proxy_score",
    "risk_proxy_rank",
    "geometry",
]
keep = [column for column in keep if column in roads.columns]
roads = roads[keep].copy()

# Remove invalid or empty geometries.
roads = roads[
    roads.geometry.notna()
    & ~roads.geometry.is_empty
].copy()

# Simplify in the projected CRS, where distances are in metres.
if roads.crs is None:
    raise ValueError("Road dataset has no CRS; cannot safely export map.")

if roads.crs.is_geographic:
    raise ValueError("Expected a projected CRS for metre-based simplification.")

roads["geometry"] = roads.geometry.simplify(
    tolerance=5,
    preserve_topology=True,
)

# Leaflet expects longitude/latitude coordinates.
roads = roads.to_crs("EPSG:4326")

output.parent.mkdir(parents=True, exist_ok=True)
roads.to_file(output, driver="GeoJSON")

print(f"Export complete: {output}")
print(f"Road features exported: {len(roads):,}")
print(f"Output CRS: {roads.crs}")
print(f"File size: {output.stat().st_size / (1024 * 1024):.2f} MB")
print("Risk score range:",
      round(float(roads["risk_proxy_score"].min()), 3),
      "to",
      round(float(roads["risk_proxy_score"].max()), 3))
