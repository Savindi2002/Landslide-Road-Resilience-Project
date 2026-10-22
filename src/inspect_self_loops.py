
from pathlib import Path
import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]
INPUT_FILE = ROOT / "data" / "processed" / "road_risk_scores_unique.gpkg"

print("Loading road network...")
roads = gpd.read_file(INPUT_FILE)

print(f"\nTotal road records: {len(roads):,}")
print("Available columns:", list(roads.columns))

# Check whether the graph's start and end nodes are identical.
roads["u_check"] = roads["u"].astype(str).str.strip()
roads["v_check"] = roads["v"].astype(str).str.strip()

self_loops = roads[roads["u_check"] == roads["v_check"]].copy()

print(f"\nSelf-loop roads found: {len(self_loops):,}")

if self_loops.empty:
    print("No self-loops found in the original road data.")
else:
    columns_to_show = [
        c for c in [
            "u", "v", "key", "osmid", "length",
            "highway", "name", "risk_proxy_score"
        ]
        if c in self_loops.columns
    ]

    print("\nSelf-loop road records:")
    print(self_loops[columns_to_show].to_string(index=False))

    output_file = ROOT / "outputs" / "self_loop_roads_inspection.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    self_loops[columns_to_show].to_csv(output_file, index=False)

    print(f"\nInspection file saved to: {output_file}")
