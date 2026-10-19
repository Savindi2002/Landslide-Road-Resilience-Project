
from pathlib import Path
import os

import geopandas as gpd
import requests


def main():
    root = Path(__file__).resolve().parents[1]
    data_dir = root / "data" / "raw"
    data_dir.mkdir(parents=True, exist_ok=True)

    boundary_file = data_dir / "study_area.gpkg"
    output_file = data_dir / "ratnapura_dem.tif"

    api_key = os.environ.get("OPENTOPOGRAPHY_API_KEY")

    if not api_key:
        raise ValueError(
            "API key not found. Set the OPENTOPOGRAPHY_API_KEY "
            "environment variable in your terminal first."
        )

    if not boundary_file.exists():
        raise FileNotFoundError(
            "study_area.gpkg is missing. Run the OSM download script first."
        )

    boundary = gpd.read_file(boundary_file).to_crs("EPSG:4326")
    west, south, east, north = boundary.total_bounds

    url = "https://portal.opentopography.org/API/globaldem"

    params = {
        "demtype": "SRTMGL1",
        "south": south,
        "north": north,
        "west": west,
        "east": east,
        "outputFormat": "GTiff",
        "API_Key": api_key,
    }

    print("Downloading the SRTM elevation raster...")
    print(f"Bounds: west={west:.4f}, south={south:.4f}, "
          f"east={east:.4f}, north={north:.4f}")

    response = requests.get(url, params=params, timeout=300)
    response.raise_for_status()

    # Avoid accidentally saving an API error message as a TIFF.
    if not response.content.startswith((b"II*\x00", b"MM\x00*")):
        message = response.text[:1000]
        raise RuntimeError(
            "The API did not return a valid GeoTIFF. "
            f"Response: {message}"
        )

    output_file.write_bytes(response.content)

    print("\nElevation data downloaded successfully.")
    print(f"File: {output_file}")
    print(f"Size: {output_file.stat().st_size / (1024 * 1024):.2f} MB")
    print("Source: OpenTopography SRTM GL1")
    print("Check the dataset licence and resolution before analysis.")


if __name__ == "__main__":
    main()
