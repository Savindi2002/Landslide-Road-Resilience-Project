"""Create a synthetic ML CSV to test the pipeline. NOT real Sri Lankan data."""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "processed" / "ml_samples.csv"
OUT.parent.mkdir(parents=True, exist_ok=True)

rng = np.random.default_rng(42)
n = 1200
slope = rng.uniform(0, 50, n)
elevation = rng.uniform(20, 1800, n)
rainfall = rng.gamma(shape=2.0, scale=35.0, size=n)
distance_stream = rng.exponential(scale=500, size=n)
landcover = rng.integers(1, 7, n)

# Synthetic relationship only, used to test code—not a scientific risk model.
linear = -4.0 + 0.085 * slope + 0.0012 * rainfall - 0.0007 * distance_stream
linear += 0.00035 * elevation + np.where(landcover == 4, 0.6, 0)
prob = 1 / (1 + np.exp(-linear))
landslide = rng.binomial(1, prob)

# Coordinates are synthetic projected-like values and MUST NOT be mapped as Sri Lanka.
x = rng.uniform(0, 100, n)
y = rng.uniform(0, 100, n)

df = pd.DataFrame({
    "slope": slope,
    "elevation_m": elevation,
    "rainfall_7d_mm": rainfall,
    "distance_to_stream_m": distance_stream,
    "landcover_code": landcover,
    "landslide": landslide,
    "x": x,
    "y": y,
})
df.to_csv(OUT, index=False)
print(f"Wrote {OUT}")
print("WARNING: this is SYNTHETIC DEMONSTRATION DATA, not real Sri Lankan data.")
print(df.head())
