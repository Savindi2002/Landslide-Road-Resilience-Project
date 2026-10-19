
from pathlib import Path

import numpy as np
import rasterio
from rasterio.warp import (
    calculate_default_transform,
    reproject,
    Resampling,
)


def main():
    root = Path(__file__).resolve().parents[1]
    data_dir = root / "data" / "raw"

    dem_path = data_dir / "ratnapura_dem.tif"
    projected_path = data_dir / "ratnapura_dem_projected.tif"
    slope_path = data_dir / "ratnapura_slope.tif"

    if not dem_path.exists():
        raise FileNotFoundError(
            f"DEM not found: {dem_path}\n"
            "Complete Step 15 and download the DEM first."
        )

    # UTM zone 44N, appropriate for the Ratnapura region.
    target_crs = "EPSG:32644"

    print("Reading elevation raster...")

    with rasterio.open(dem_path) as src:
        if src.crs is None:
            raise ValueError(
                "The DEM has no coordinate reference system. "
                "Check the downloaded file."
            )

        src_data = src.read(1).astype("float32")
        src_nodata = src.nodata

        valid = np.isfinite(src_data)

        if src_nodata is not None:
            valid &= src_data != src_nodata

        if not valid.any():
            raise ValueError("The DEM contains no valid elevation pixels.")

        # Store invalid source pixels as NaN for correct masking.
        src_data[~valid] = np.nan

        transform, width, height = calculate_default_transform(
            src.crs,
            target_crs,
            src.width,
            src.height,
            *src.bounds,
        )

        # Reproject elevation data to a metric CRS.
        destination = np.full(
            (height, width),
            np.nan,
            dtype="float32",
        )

        reproject(
            source=src_data,
            destination=destination,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=np.nan,
            dst_transform=transform,
            dst_crs=target_crs,
            dst_nodata=np.nan,
            resampling=Resampling.bilinear,
        )

        profile = src.profile.copy()

    print("Saving projected DEM...")

    profile.update(
        driver="GTiff",
        crs=target_crs,
        transform=transform,
        width=width,
        height=height,
        dtype="float32",
        count=1,
        nodata=np.nan,
        compress="deflate",
    )

    with rasterio.open(projected_path, "w", **profile) as dst:
        dst.write(destination, 1)

    # Pixel dimensions are in metres after reprojection.
    pixel_width = abs(transform.a)
    pixel_height = abs(transform.e)

    # np.gradient expects array-axis spacing:
    # first axis = rows (north-south), second = columns (east-west).
    print("Calculating slope in degrees...")

    safe_dem = np.where(np.isfinite(destination), destination, 0.0)

    dz_dy, dz_dx = np.gradient(
        safe_dem,
        pixel_height,
        pixel_width,
    )

    slope_degrees = np.degrees(
        np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
    ).astype("float32")

    # Mask invalid elevation pixels and their immediate neighbours
    # so the zero-filled nodata areas do not create false slopes.
    valid = np.isfinite(destination)

    interior_valid = valid.copy()
    interior_valid[1:-1, 1:-1] &= (
        valid[:-2, 1:-1]
        & valid[2:, 1:-1]
        & valid[1:-1, :-2]
        & valid[1:-1, 2:]
    )

    slope_degrees[~interior_valid] = np.nan

    slope_profile = profile.copy()
    slope_profile.update(
        dtype="float32",
        nodata=np.nan,
        compress="deflate",
    )

    with rasterio.open(slope_path, "w", **slope_profile) as dst:
        dst.write(slope_degrees, 1)

    values = slope_degrees[np.isfinite(slope_degrees)]

    print("\nSlope calculation complete.")
    print(f"Projected DEM: {projected_path}")
    print(f"Slope raster: {slope_path}")
    print(f"Valid slope pixels: {len(values)}")

    if len(values):
        print(f"Minimum slope: {values.min():.2f} degrees")
        print(f"Median slope: {np.median(values):.2f} degrees")
        print(f"Maximum slope: {values.max():.2f} degrees")


if __name__ == "__main__":
    main()
