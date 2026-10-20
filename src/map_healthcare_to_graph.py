
from pathlib import Path

import geopandas as gpd
import networkx as nx
import pandas as pd
from shapely.geometry import Point


def main():
    root = Path(__file__).resolve().parents[1]
    raw_dir = root / "data" / "raw"
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    roads_path = processed_dir / "road_terrain_features.gpkg"
    healthcare_path = raw_dir / "healthcare_facilities.gpkg"

    for path in [roads_path, healthcare_path]:
        if not path.exists():
            raise FileNotFoundError(f"Missing required file: {path}")

    roads = gpd.read_file(roads_path)
    facilities = gpd.read_file(healthcare_path)

    if roads.empty or facilities.empty:
        raise ValueError("The road network or healthcare layer is empty.")

    if roads.crs is None or facilities.crs is None:
        raise ValueError("Both layers must have a defined CRS.")

    # Convert facilities to the projected CRS used by the roads.
    facilities = facilities.to_crs(roads.crs)

    # Build a graph from the road endpoint identifiers.
    graph = nx.MultiGraph()

    for row in roads.itertuples(index=False):
        u = str(getattr(row, "u"))
        v = str(getattr(row, "v"))
        length = float(getattr(row, "length"))

        graph.add_edge(u, v, length=length)

    # Find each node's coordinates from the road geometries.
    node_points = {}

    for row in roads.itertuples(index=False):
        u = str(getattr(row, "u"))
        v = str(getattr(row, "v"))
        geom = row.geometry

        if geom is None or geom.is_empty:
            continue

        node_points.setdefault(u, Point(geom.coords[0]))
        node_points.setdefault(v, Point(geom.coords[-1]))

    nodes = gpd.GeoDataFrame(
        [
            {"node_id": node, "geometry": point}
            for node, point in node_points.items()
        ],
        geometry="geometry",
        crs=roads.crs,
    )

    if nodes.empty:
        raise ValueError("Could not derive road-node coordinates.")

    # Match each facility to its nearest graph node.
    nearest = gpd.sjoin_nearest(
        facilities,
        nodes,
        how="left",
        distance_col="snap_distance_m",
    )

    nearest = nearest.rename(columns={"node_id": "nearest_node_id"})
    nearest["nearest_node_id"] = nearest["nearest_node_id"].astype("string")

    nearest["facility_id"] = [
        f"HF{i:04d}" for i in range(1, len(nearest) + 1)
    ]

    # Save the matched facilities as a spatial layer.
    spatial_output = processed_dir / "healthcare_graph_locations.gpkg"
    nearest.to_file(spatial_output, driver="GPKG")

    # Save a compact table for later accessibility analysis.
    table = pd.DataFrame(nearest.drop(columns="geometry"))
    table.to_csv(
        processed_dir / "healthcare_graph_locations.csv",
        index=False,
    )

    print("\nHEALTHCARE-TO-GRAPH SUMMARY")
    print("=" * 45)
    print("Healthcare facilities:", len(nearest))
    print("Facilities matched to nodes:", nearest["nearest_node_id"].notna().sum())

    print("\nNearest-node distance (metres):")
    print(nearest["snap_distance_m"].describe().round(2))

    print("\nFacilities over 100 m from their matched node:")
    print(int((nearest["snap_distance_m"] > 100).sum()))

    print("\nSaved:")
    print(spatial_output)
    print(processed_dir / "healthcare_graph_locations.csv")


if __name__ == "__main__":
    main()
