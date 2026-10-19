
from pathlib import Path

import geopandas as gpd
import pandas as pd


def main():
    root = Path(__file__).resolve().parents[1]
    raw = root / "data" / "raw"
    processed = root / "data" / "processed"
    processed.mkdir(parents=True, exist_ok=True)

    inventory_path = raw / "landslide_inventory.gpkg"
    roads_path = processed / "road_terrain_features.gpkg"
    boundary_path = raw / "study_area.gpkg"

    for path in [inventory_path, roads_path]:
        if not path.exists():
            raise FileNotFoundError(f"Required file not found: {path}")

    events = gpd.read_file(inventory_path)
    roads = gpd.read_file(roads_path)

    if events.empty:
        raise ValueError("The landslide inventory is empty.")

    if roads.empty:
        raise ValueError("The road network is empty.")

    if events.crs is None or roads.crs is None:
        raise ValueError("Both datasets must have a defined CRS.")

    # Use the projected CRS of the road-terrain dataset.
    events = events.to_crs(roads.crs)
    roads = roads[
        roads.geometry.notna() & ~roads.geometry.is_empty
    ].copy()

    # Keep only events inside the study boundary, if available.
    if boundary_path.exists():
        boundary = gpd.read_file(boundary_path).to_crs(roads.crs)
        study_area = boundary.geometry.union_all()
        events = events[events.geometry.within(study_area)].copy()

    if events.empty:
        print("No events remain inside the study boundary.")
        return

    # Create a stable ID for each event.
    events = events.reset_index(drop=True)
    events["event_id"] = range(1, len(events) + 1)

    # Find the nearest mapped road for each event.
    nearest = gpd.sjoin_nearest(
        events,
        roads[["u", "v", "key", "highway", "length", "geometry"]],
        how="left",
        distance_col="nearest_road_distance_m",
    )

    nearest["within_100m"] = nearest["nearest_road_distance_m"] <= 100
    nearest["within_500m"] = nearest["nearest_road_distance_m"] <= 500
    nearest["within_1km"] = nearest["nearest_road_distance_m"] <= 1000

    # Save the spatial results and a plain CSV table.
    gpkg_out = processed / "landslide_road_proximity.gpkg"
    csv_out = processed / "landslide_road_proximity.csv"

    nearest.to_file(gpkg_out, driver="GPKG")
    pd.DataFrame(nearest.drop(columns="geometry")).to_csv(
        csv_out, index=False
    )

    print("\nLANDSLIDE-ROAD PROXIMITY RESULTS")
    print("=" * 45)
    print("Events analyzed:", len(events))
    print(
        "Events within 100 m:",
        int(nearest["within_100m"].sum()),
    )
    print(
        "Events within 500 m:",
        int(nearest["within_500m"].sum()),
    )
    print(
        "Events within 1 km:",
        int(nearest["within_1km"].sum()),
    )

    print("\nNearest road distance (m):")
    print(nearest["nearest_road_distance_m"].describe().round(2))

    print("\nEvent-level results:")
    print(
        nearest[
            ["event_id", "nearest_road_distance_m",
             "within_100m", "within_500m", "within_1km"]
        ].to_string(index=False)
    )

    print("\nSaved:", gpkg_out)
    print("Saved:", csv_out)


if __name__ == "__main__":
    main()
