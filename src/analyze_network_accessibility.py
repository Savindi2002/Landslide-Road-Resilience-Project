
from pathlib import Path

import geopandas as gpd
import networkx as nx
import pandas as pd


def main():
    root = Path(__file__).resolve().parents[1]
    processed = root / "data" / "processed"

    roads_path = processed / "road_terrain_features.gpkg"
    healthcare_path = processed / "healthcare_graph_locations.csv"

    for path in [roads_path, healthcare_path]:
        if not path.exists():
            raise FileNotFoundError(
                f"Missing {path}. Complete the previous steps first."
            )

    roads = gpd.read_file(roads_path)
    facilities = pd.read_csv(healthcare_path)

    graph = nx.MultiGraph()

    for row in roads.itertuples(index=False):
        u = str(row.u)
        v = str(row.v)
        length = float(row.length)

        if length <= 0:
            continue

        graph.add_edge(u, v, length=length)

    if graph.number_of_nodes() == 0:
        raise ValueError("The road graph contains no nodes.")

    # Identify connected components.
    components = sorted(
        nx.connected_components(graph),
        key=len,
        reverse=True,
    )

    component_lookup = {
        node: component_id
        for component_id, component in enumerate(components)
        for node in component
    }

    print("\nROAD NETWORK CONNECTIVITY")
    print("=" * 45)
    print("Nodes:", graph.number_of_nodes())
    print("Edges:", graph.number_of_edges())
    print("Connected components:", len(components))
    print("Largest component nodes:", len(components[0]))

    # Calculate betweenness centrality using distance as the weight.
    # This is a distance-weighted measure, not a risk score.
    print("\nCalculating betweenness centrality...")
    centrality = nx.edge_betweenness_centrality(
        graph,
        weight="length",
        normalized=True,
    )

    centrality_rows = []

    for (u, v, key), value in centrality.items():
        data = graph[u][v][key]
        centrality_rows.append({
            "u": u,
            "v": v,
            "key": key,
            "length_m": data["length"],
            "edge_betweenness": value,
        })

    centrality_df = pd.DataFrame(centrality_rows)
    centrality_path = processed / "road_edge_centrality.csv"
    centrality_df.to_csv(centrality_path, index=False)

    # Compute shortest paths from every mapped facility node.
    facility_nodes = (
        facilities["nearest_node_id"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    valid_facility_nodes = [
        node for node in facility_nodes if node in graph
    ]

    if not valid_facility_nodes:
        raise ValueError(
            "No healthcare facility nodes match the road graph. "
            "Check the node identifiers and CRS."
        )

    # Use the largest connected component for the initial baseline.
    largest_nodes = set(components[0])
    largest_graph = graph.subgraph(largest_nodes).copy()

    valid_destinations = [
        node for node in valid_facility_nodes
        if node in largest_graph
    ]

    if not valid_destinations:
        raise ValueError(
            "No mapped healthcare facilities lie in the largest "
            "connected component. Inspect the graph and facility matches."
        )

    print("\nCalculating shortest distances to healthcare...")
    distances_to_healthcare = {}

    for source in valid_destinations:
        distances = nx.single_source_dijkstra_path_length(
            largest_graph,
            source,
            weight="length",
        )

        for node, distance in distances.items():
            current = distances_to_healthcare.get(node)

            if current is None or distance < current:
                distances_to_healthcare[node] = distance

    node_rows = []

    for node in largest_graph.nodes:
        node_rows.append({
            "node_id": node,
            "component_id": component_lookup[node],
            "distance_to_healthcare_m": distances_to_healthcare.get(node),
        })

    node_df = pd.DataFrame(node_rows)
    node_path = processed / "node_healthcare_accessibility.csv"
    node_df.to_csv(node_path, index=False)

    reachable = node_df["distance_to_healthcare_m"].notna()

    print("\nACCESSIBILITY BASELINE")
    print("=" * 45)
    print("Healthcare facilities in largest component:", len(valid_destinations))
    print("Nodes in largest component:", len(node_df))
    print("Nodes with a path to healthcare:", int(reachable.sum()))

    if reachable.any():
        print("Distance to nearest mapped healthcare facility (km):")
        print(
            (
                node_df.loc[reachable, "distance_to_healthcare_m"] / 1000
            ).describe().round(2)
        )

    print("\nSaved:")
    print(centrality_path)
    print(node_path)


if __name__ == "__main__":
    main()
