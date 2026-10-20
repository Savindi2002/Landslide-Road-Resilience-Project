
from pathlib import Path
import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

input_file = ROOT / "data/processed/road_terrain_features.gpkg"
output_file = ROOT / "data/processed/road_terrain_clean.gpkg"

gdf = gpd.read_file(input_file)

print("Original road segments:", len(gdf))

# Remove records only if geometry or essential graph attributes are invalid.
valid = (
    gdf.geometry.notna()
    & ~gdf.geometry.is_empty
    & gdf["u"].notna()
    & gdf["v"].notna()
    & gdf["length"].notna()
    & (gdf["length"] > 0)
)

clean = gdf.loc[valid].copy()

# Check terrain values without inventing replacements.
for col in ["elevation_mean_m", "slope_mean_deg", "slope_max_deg"]:
    if col in clean.columns:
        clean[col] = pd.to_numeric(clean[col], errors="coerce")

        invalid = clean[col].notna() & (
            (clean[col] < 0) if col.startswith("slope")
            else pd.Series(False, index=clean.index)
        )

        if col.startswith("slope"):
            invalid |= clean[col] > 90

        clean.loc[invalid, col] = float("nan")

print("Valid road segments:", len(clean))
print("Removed invalid essential records:", len(gdf) - len(clean))

print("\nMissing terrain values:")
for col in ["elevation_mean_m", "slope_mean_deg", "slope_max_deg"]:
    if col in clean.columns:
        print(f"{col}: {clean[col].isna().sum()}")

clean.to_file(output_file, driver="GPKG")

print("\nSaved cleaned dataset:", output_file)
print("Original data remains unchanged.")
