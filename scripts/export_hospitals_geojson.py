
from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]

source = ROOT / "data" / "processed" / "healthcare_graph_locations.gpkg"
output = ROOT / "dashboard" / "public" / "data" / "hospitals.geojson"

if not source.exists():
    raise FileNotFoundError(f"Healthcare data not found: {source}")

facilities = gpd.read_file(source)

if facilities.crs is None:
    raise ValueError("Healthcare dataset has no CRS.")

if "geometry" not in facilities.columns:
    raise ValueError("Healthcare dataset has no geometry column.")

facilities = facilities[
    facilities.geometry.notna() & ~facilities.geometry.is_empty
].copy()

# Keep only facilities tagged as hospitals in the source data.
if "amenity" in facilities.columns:
    facilities = facilities[
        facilities["amenity"].astype(str).str.lower().eq("hospital")
    ].copy()

columns = [
    "facility_id",
    "name",
    "amenity",
    "healthcare",
    "emergency",
    "phone",
    "website",
    "nearest_node_id",
    "snap_distance_m",
    "geometry",
]
columns = [c for c in columns if c in facilities.columns]
facilities = facilities[columns].copy()

# Leaflet requires longitude/latitude coordinates.
facilities = facilities.to_crs("EPSG:4326")

output.parent.mkdir(parents=True, exist_ok=True)
facilities.to_file(output, driver="GeoJSON")

print(f"Exported hospitals/facilities: {len(facilities)}")
print(f"Output: {output}")
print(f"CRS: {facilities.crs}")
print("Names available:", int(facilities["name"].notna().sum())
      if "name" in facilities.columns else "No name column")
