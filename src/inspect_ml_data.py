
from pathlib import Path

import pandas as pd
import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]

files = [
    "data/processed/road_terrain_clean.gpkg",
    "data/processed/road_risk_scores_unique.gpkg",
    "data/raw/landslide_inventory.gpkg",
    "data/processed/landslide_road_proximity.csv",
    "data/processed/road_risk_scores.csv",
    "data/processed/rainfall_features.csv",
]

for filename in files:
    path = ROOT / filename
    print("\n" + "=" * 70)
    print(f"FILE: {filename}")

    if not path.exists():
        print("NOT FOUND")
        continue

    try:
        if path.suffix.lower() == ".gpkg":
            df = gpd.read_file(path)
            print("CRS:", df.crs)
            print("Geometry types:", df.geometry.geom_type.value_counts().to_dict())
            print("Bounds:", df.total_bounds)
        else:
            df = pd.read_csv(path)

        print("Shape:", df.shape)
        print("Columns:", df.columns.tolist())
        print("\nSample:")
        print(df.head(3).to_string(index=False))

    except Exception as exc:
        print("ERROR:", exc)
