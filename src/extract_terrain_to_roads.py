
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio


def find_road_file(root):
    candidates = [
        root / "data" / "raw" / "road_edges.gpkg",
        root / "data" / "processed" / "road_edges.gpkg",
    ]

    for path in candidates:
        if path.exists():
            return path

    raise FileNotFoundError(
        "Could not find road_edges.gpkg in data/raw or data/processed. "
        "Check where your downloaded road network was saved."
    )


def sample_raster(raster_path, points):
    """Return raster values sampled at a list of points."""
    with rasterio.open(raster_path) as src:
        coordinates = [(point.x, point.y) for point in points]
        values = []

        for result in src.sample(coordinates, masked=True):
            value = result[0]

            if np.ma.is_masked(value) or not np.isfinite(value):
                values.append(np.nan)
            else:
                values.append(float(value))

    return values


def main():
    root = Path(__file__).resolve().parents[1]
    dem_path = root / "data" / "raw" / "ratnapura_dem_projected.tif"
    slope_path = root / "data" / "raw" / "ratnapura_slope.tif"
    output_dir = root / "data" / "processed"

    output_dir.mkdir(parents=True, exist_ok=True)

    for path in [dem_path, slope_path]:
        if not path.exists():
            raise FileNotFoundError(
                f"Missing {path.name}. Complete the DEM and slope steps first."
            )

    road_path = find_road_file(root)
    print(f"Reading roads from: {road_path}")

    roads = gpd.read_file(road_path)

    if roads.empty:
        raise ValueError("The road layer contains no road segments.")

    if roads.crs is None:
        raise ValueError("The road layer has no CRS defined.")

    with rasterio.open(dem_path) as dem:
        raster_crs = dem.crs

    if raster_crs is None:
        raise ValueError("The DEM has no CRS defined.")

    roads = roads.to_crs(raster_crs)
    roads = roads[roads.geometry.notna() & ~roads.geometry.is_empty].copy()

    print(f"Road segments to process: {len(roads)}")

    # Sample five positions along each road segment.
    sample_points = []
    road_sample_counts = []

    fractions = [0.1, 0.3, 0.5, 0.7, 0.9]

    for geometry in roads.geometry:
        points = []

        if geometry.geom_type == "LineString":
            points = [
                geometry.interpolate(fraction, normalized=True)
                for fraction in fractions
            ]
        elif geometry.geom_type == "MultiLineString":
            line = max(geometry.geoms, key=lambda part: part.length)
            points = [
                line.interpolate(fraction, normalized=True)
                for fraction in fractions
            ]
        else:
            points = [geometry.representative_point()]

        road_sample_counts.append(len(points))
        sample_points.extend(points)

    print("Sampling elevation...")
    elevations = sample_raster(dem_path, sample_points)

    print("Sampling slope...")
    slopes = sample_raster(slope_path, sample_points)

    elevation_means = []
    slope_means = []
    slope_maxima = []
    valid_counts = []

    offset = 0

    for count in road_sample_counts:
        road_elevations = np.array(
            elevations[offset:offset + count], dtype=float
        )
        road_slopes = np.array(
            slopes[offset:offset + count], dtype=float
        )
        offset += count

        valid_elevation = road_elevations[np.isfinite(road_elevations)]
        valid_slope = road_slopes[np.isfinite(road_slopes)]

        elevation_means.append(
            float(valid_elevation.mean()) if len(valid_elevation) else np.nan
        )
        slope_means.append(
            float(valid_slope.mean()) if len(valid_slope) else np.nan
        )
        slope_maxima.append(
            float(valid_slope.max()) if len(valid_slope) else np.nan
        )
        valid_counts.append(
            int(np.isfinite(road_elevations).sum())
        )

    roads["elevation_mean_m"] = elevation_means
    roads["slope_mean_deg"] = slope_means
    roads["slope_max_deg"] = slope_maxima
    roads["valid_elevation_samples"] = valid_counts

    # Save the spatial layer and a table for later analysis.
    gpkg_path = output_dir / "road_terrain_features.gpkg"
    csv_path = output_dir / "road_terrain_features.csv"

    roads.to_file(gpkg_path, driver="GPKG")

    table = pd.DataFrame(roads.drop(columns="geometry"))
    table.to_csv(csv_path, index=False)

    print("\nTerrain extraction complete!")
    print(f"Spatial output: {gpkg_path}")
    print(f"CSV output:     {csv_path}")
    print(f"Road segments:  {len(roads)}")
    print(
        "Segments with missing slope:",
        int(roads["slope_mean_deg"].isna().sum())
    )
    print("\nSummary:")
    print(
        roads[
            ["elevation_mean_m", "slope_mean_deg", "slope_max_deg"]
        ].describe().round(2)
    )


if __name__ == "__main__":
    main()
