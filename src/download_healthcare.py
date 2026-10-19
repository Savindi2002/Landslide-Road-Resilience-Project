
from pathlib import Path
import time

import osmnx as ox
import pandas as pd
import geopandas as gpd


def main():
    root = Path(__file__).resolve().parents[1]
    data_dir = root / "data" / "raw"
    data_dir.mkdir(parents=True, exist_ok=True)

    boundary_file = data_dir / "study_area.gpkg"

    if not boundary_file.exists():
        raise FileNotFoundError(
            "study_area.gpkg was not found. "
            "Run the original download script first."
        )

    # Read the previously downloaded study-area boundary.
    boundary = gpd.read_file(boundary_file)

    if boundary.empty:
        raise ValueError("The study-area boundary file is empty.")

    polygon = boundary.geometry.union_all()

    # Alternative public Overpass servers.
    endpoints = [
        "https://overpass.private.coffee/api",
        "https://maps.mail.ru/osm/tools/overpass/api",
    ]

    tags = {"amenity": ["hospital", "clinic"]}

    ox.settings.requests_timeout = 180
    ox.settings.use_cache = True

    for endpoint in endpoints:
        try:
            print(f"\nTrying Overpass server: {endpoint}")

            ox.settings.overpass_url = endpoint

            facilities = ox.features_from_polygon(
                polygon, tags
            )

            if facilities.empty:
                print("No matching facilities found on this server.")
                continue

            # Save the geographic data.
            gpkg_path = data_dir / "healthcare_facilities.gpkg"
            facilities.to_file(gpkg_path, driver="GPKG")

            # Create a CSV with representative coordinates.
            points = facilities.geometry.representative_point()
            table = facilities.drop(columns="geometry").copy()
            table["longitude"] = points.x
            table["latitude"] = points.y

            csv_path = data_dir / "healthcare_facilities.csv"
            table.to_csv(csv_path, index=False)

            print(f"Facilities found: {len(facilities)}")
            print(f"Saved: {gpkg_path}")
            print(f"Saved: {csv_path}")
            print("\nHealthcare download completed successfully.")
            return

        except Exception as error:
            print(f"Server request failed: {error}")
            print("Will try the next endpoint.")
            time.sleep(3)

    print(
        "\nBoth servers failed. Existing road files "
        "will not be downloaded again or deleted."
    )
    print(
        "Try again later, or use a smaller study area "
        "or an official healthcare dataset."
    )


if __name__ == "__main__":
    main()
