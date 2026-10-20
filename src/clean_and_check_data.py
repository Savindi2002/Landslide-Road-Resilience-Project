
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"

PROCESSED.mkdir(parents=True, exist_ok=True)

files = {
    "Road terrain": PROCESSED / "road_terrain_features.gpkg",
    "Healthcare facilities": RAW / "healthcare_facilities.gpkg",
    "Landslide proximity": PROCESSED / "landslide_road_proximity.gpkg",
}

print("\n===== DATA QUALITY CHECK =====")

for name, path in files.items():
    print(f"\n--- {name} ---")

    if not path.exists():
        print(f"NOT FOUND: {path}")
        continue

    try:
        gdf = gpd.read_file(path)

        print("Rows:", len(gdf))
        print("CRS:", gdf.crs)
        print("Geometry types:", gdf.geom_type.value_counts().to_dict())
        print("Empty geometries:", gdf.geometry.is_empty.sum())
        print("Missing geometries:", gdf.geometry.isna().sum())
        print("Duplicate rows:", gdf.drop(columns="geometry").duplicated().sum())

        missing = gdf.drop(columns="geometry").isna().sum()
        missing = missing[missing > 0]

        print("Missing attribute values:")
        print(missing.to_dict() if len(missing) else "None")

        if name == "Road terrain":
            for col in [
                "length",
                "slope_mean_deg",
                "slope_max_deg",
                "elevation_mean_m",
            ]:
                if col in gdf.columns:
                    print(f"{col}: min={gdf[col].min()}, max={gdf[col].max()}")

            if "length" in gdf.columns:
                print("Non-positive road lengths:", (gdf["length"] <= 0).sum())

            for col in ["slope_mean_deg", "slope_max_deg"]:
                if col in gdf.columns:
                    invalid = (
                        (gdf[col] < 0) | (gdf[col] > 90)
                    ) & gdf[col].notna()
                    print(f"Invalid {col} values:", invalid.sum())

    except Exception as e:
        print("ERROR:", e)

print("\n===== CHECK COMPLETE =====")
