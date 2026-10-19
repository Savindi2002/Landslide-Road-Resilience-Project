
from pathlib import Path

import geopandas as gpd
import pandas as pd
import requests


def main():
    root = Path(__file__).resolve().parents[1]
    raw_dir = root / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    url = (
        "https://data.nasa.gov/docs/legacy/"
        "Global_Landslide_Catalog_Export/"
        "Global_Landslide_Catalog_Export_rows.csv"
    )

    csv_path = raw_dir / "global_landslide_catalog.csv"
    sri_lanka_path = raw_dir / "sri_lanka_landslides.csv"
    gpkg_path = raw_dir / "landslide_inventory.gpkg"

    print("Downloading NASA Global Landslide Catalog...")

    response = requests.get(url, timeout=120)
    response.raise_for_status()
    csv_path.write_bytes(response.content)

    df = pd.read_csv(csv_path, low_memory=False)
    print("Downloaded rows:", len(df))
    print("Available columns:", df.columns.tolist())

    # Inspect the actual column names before filtering.
    lower_to_original = {
        col.strip().lower(): col for col in df.columns
    }

    country_col = next(
        (
            lower_to_original[name]
            for name in ["country", "country_name"]
            if name in lower_to_original
        ),
        None,
    )

    lat_col = next(
        (
            lower_to_original[name]
            for name in ["latitude", "lat"]
            if name in lower_to_original
        ),
        None,
    )

    lon_col = next(
        (
            lower_to_original[name]
            for name in ["longitude", "lon", "long"]
            if name in lower_to_original
        ),
        None,
    )

    if country_col is None or lat_col is None or lon_col is None:
        print(
            "\nCould not identify country/latitude/longitude columns "
            "automatically."
        )
        print("Keep the downloaded global CSV and check its column names.")
        return

    country = (
        df[country_col]
        .astype("string")
        .str.strip()
        .str.casefold()
    )

    sri_lanka = df[country.isin(["sri lanka", "ceylon"])].copy()

    sri_lanka[lat_col] = pd.to_numeric(
        sri_lanka[lat_col], errors="coerce"
    )
    sri_lanka[lon_col] = pd.to_numeric(
        sri_lanka[lon_col], errors="coerce"
    )

    sri_lanka = sri_lanka.dropna(subset=[lat_col, lon_col])

    sri_lanka.to_csv(sri_lanka_path, index=False)

    print("\nSri Lanka records:", len(sri_lanka))
    print("Saved:", sri_lanka_path)

    if sri_lanka.empty:
        print(
            "No Sri Lankan records were found in this export. "
            "We will need another inventory source."
        )
        return

    points = gpd.GeoDataFrame(
        sri_lanka,
        geometry=gpd.points_from_xy(
            sri_lanka[lon_col], sri_lanka[lat_col]
        ),
        crs="EPSG:4326",
    )

    points.to_file(gpkg_path, driver="GPKG")
    print("Saved spatial inventory:", gpkg_path)

    # Check how many reported events are within the study boundary.
    boundary_path = raw_dir / "study_area.gpkg"

    if boundary_path.exists():
        boundary = gpd.read_file(boundary_path).to_crs(points.crs)
        study_area = boundary.geometry.union_all()
        within = points.geometry.within(study_area)

        print("Records within study boundary:", int(within.sum()))

        if within.sum() == 0:
            print(
                "No catalog records fall inside the study boundary. "
                "Do not train a local model using this inventory alone."
            )


if __name__ == "__main__":
    main()
