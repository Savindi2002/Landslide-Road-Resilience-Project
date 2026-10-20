
from pathlib import Path

import geopandas as gpd
import networkx as nx
import pandas as pd


def main():
    root = Path(__file__).resolve().parents[1]
    roads_path = root / "data" / "processed" / "road_terrain_features.gpkg"
    output_dir = root / "data" / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not roads_path.exists():
        raise FileNotFoundError(
            f"Road terrain dataset not found: {roads_path}"
        )

    roads = gpd.read_file(roads_path)

    required = {"u", "v", "length", "geometry"}
    missing = required - set(roads.columns)

    if missing:
        raise ValueError(f"Missing required road columns: {missing}")

    roads = roads.dropna(subset=["u", "v", "length"]).copy()
    roads = roads[roads["length"] > 0].copy()

    # OSMnx road edges use u and v as endpoint node identifiers.
    graph = nx.MultiGraph()

    for row in roads.itertuples(index=False):
        u = str(getattr(row, "u"))
        v = str(getattr(row, "v"))
        length = float(getattr(row, "length"))

        graph.add_edge(
            u,
            v,
            length=length,
            slope_mean_deg=float(getattr(row, "slope_mean_deg", 0.0))
            if pd.notna(getattr(row, "slope_mean_deg", None))
            else None,
            slope_max_deg=float(getattr(row, "slope_max_deg", 0.0))
            if pd.notna(getattr(row, "slope_max_deg", None))
            else None,
            highway=str(getattr(row, "highway", "unknown")),
        )

    # Save a node table.
    node_rows = [
        {"node_id": node, "degree": degree}
        for node, degree in graph.degree()
    ]
    nodes_df = pd.DataFrame(node_rows)
    nodes_path = output_dir / "road_graph_nodes.csv"
    nodes_df.to_csv(nodes_path, index=False)

    # Save an edge table for later risk and optimization work.
    edge_rows = []

    for u, v, key, data in graph.edges(keys=True, data=True):
        edge_rows.append({
            "u": u,
            "v": v,
            "key": key,
            "length_m": data["length"],
            "slope_mean_deg": data["slope_mean_deg"],
            "slope_max_deg": data["slope_max_deg"],
            "highway": data["highway"],
        })

    edges_df = pd.DataFrame(edge_rows)
    edges_path = output_dir / "road_graph_edges.csv"
    edges_df.to_csv(edges_path, index=False)

    # Calculate basic graph statistics.
    print("\nROAD GRAPH SUMMARY")
    print("=" * 45)
    print("Nodes:", graph.number_of_nodes())
    print("Edges:", graph.number_of_edges())
    print("Connected components:", nx.number_connected_components(graph))
    print("Average degree:", round(
        sum(dict(graph.degree()).values()) / graph.number_of_nodes(), 3
    ))
    print("Total road length (km):", round(
        edges_df["length_m"].sum() / 1000, 2
    ))

    print("\nSaved:")
    print(nodes_path)
    print(edges_path)


if __name__ == "__main__":
    main()
