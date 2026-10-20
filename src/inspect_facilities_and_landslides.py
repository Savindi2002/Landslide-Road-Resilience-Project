
from pathlib import Path
import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent

files = {
    "Healthcare facilities": ROOT / "data/raw/healthcare_facilities.gpkg",
    "Landslide inventory": ROOT / "data/raw/landslide_inventory.gpkg",
    "Landslide proximity": ROOT / "data/processed/landslide_road_proximity.gpkg",
}

for label, path in files.items():
    print(f"\n{'=' * 50}\n{label}\n{'=' * 50}")

    if not path.exists():
        print("File not found:", path)
        continue

    gdf = gpd.read_file(path)
    print("Total rows:", len(gdf))
    print("Columns:", list(gdf.columns))

    for col in ["name", "amenity", "healthcare", "event_time", "source"]:
        if col in gdf.columns:
            print(f"\n{col} values:")
            print(gdf[col].value_counts(dropna=False).head(20).to_dict())

    if label == "Healthcare facilities":
        cols = [
            c for c in ["name", "amenity", "healthcare", "emergency"]
            if c in gdf.columns
        ]
        if cols:
            print("\nFacility details:")
            print(gdf[cols].to_string(index=False))

    if label == "Landslide inventory":
        print("\nSample landslide records:")
        print(gdf.drop(columns="geometry").head(10).to_string(index=False))

print("\nInspection complete.")
