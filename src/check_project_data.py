
from pathlib import Path

import geopandas as gpd
import pandas as pd


def main():
    root = Path(__file__).resolve().parents[1]

    files = {
        "Road network": [
            root / "data/raw/road_edges.gpkg",
            root / "data/processed/road_edges.gpkg",
        ],
        "Road terrain features": [
            root / "data/processed/road_terrain_features.gpkg",
        ],
        "Rainfall features": [
            root / "data/processed/rainfall_features.csv",
        ],
        "Healthcare facilities": [
            root / "data/raw/healthcare_facilities.gpkg",
        ],
        "Landslide inventory": [
            root / "data/raw/landslide_inventory.gpkg",
            root / "data/raw/landslides.gpkg",
            root / "data/raw/landslide_inventory.csv",
        ],
    }

    print("\nPROJECT DATA CHECK")
    print("=" * 55)

    found = {}

    for name, candidates in files.items():
        existing = [path for path in candidates if path.exists()]
        found[name] = existing

        if existing:
            for path in existing:
                print(f"[FOUND] {name}: {path.relative_to(root)}")
        else:
            print(f"[MISSING] {name}")

    print("\nDETAILS")
    print("=" * 55)

    for path in found["Road terrain features"]:
        roads = gpd.read_file(path)
        print("\nRoad terrain dataset")
        print("Rows:", len(roads))
        print("CRS:", roads.crs)
        print("Columns:", roads.columns.tolist())

        for column in [
            "elevation_mean_m",
            "slope_mean_deg",
            "slope_max_deg",
        ]:
            if column in roads.columns:
                print(f"{column} missing:", roads[column].isna().sum())

    for path in found["Rainfall features"]:
        rainfall = pd.read_csv(path)
        print("\nRainfall dataset")
        print("Rows:", len(rainfall))
        print("Columns:", rainfall.columns.tolist())
        print(rainfall.head(3).to_string(index=False))

    for path in found["Landslide inventory"]:
        print("\nPotential landslide inventory:", path.name)

        if path.suffix.lower() == ".gpkg":
            inventory = gpd.read_file(path)
            print("Rows:", len(inventory))
            print("Columns:", inventory.columns.tolist())
            print("CRS:", inventory.crs)
        elif path.suffix.lower() == ".csv":
            inventory = pd.read_csv(path)
            print("Rows:", len(inventory))
            print("Columns:", inventory.columns.tolist())
            print(inventory.head(3).to_string(index=False))

    print("\nNext: use these results to decide which risk-model approach is valid.")


if __name__ == "__main__":
    main()
