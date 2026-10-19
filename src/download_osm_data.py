
from pathlib import Path

import osmnx as ox
import pandas as pd


STUDY_AREA = "Ratnapura District, Sri Lanka"


def main():
    project_root = Path(__file__).resolve().parents[1]
    output_dir = project_root / "data" / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Identify the study-area boundary.
    print(f"Downloading boundary for {STUDY_AREA}...")

    boundary = ox.geocode_to_gdf(STUDY_AREA)

    boundary_file = output_dir / "study_area.gpkg"
    boundary.to_file(boundary_file, driver="GPKG")

    # Download the mapped drivable road network.
    print("Downloading road network. This may take a few minutes...")

    graph = ox.graph_from_place(
        STUDY_AREA,
        network_type="drive",
        simplify=True,
    )

    # Convert the road graph into geographic tables.
    nodes, edges = ox.graph_to_gdfs(graph)

    nodes_file = output_dir / "road_nodes.gpkg"
    edges_file = output_dir / "road_edges.gpkg"

    nodes.to_file(nodes_file, driver="GPKG")
    edges.to_file(edges_file, driver="GPKG")

    # Also save CSV versions without geometry columns.
    nodes.drop(columns="geometry").to_csv(
        output_dir / "road_nodes.csv"
    )

    edges.drop(columns="geometry").to_csv(
        output_dir / "road_edges.csv"
    )

    print(f"Road nodes downloaded: {len(nodes)}")
    print(f"Road segments downloaded: {len(edges)}")

    # Download mapped hospitals and clinics.
    print("Downloading mapped hospitals and clinics...")

    healthcare = ox.features_from_place(
        STUDY_AREA,
        tags={"amenity": ["hospital", "clinic"]},
    )

    if healthcare.empty:
        print(
            "No matching healthcare facilities were returned. "
            "Check the area name or try a different data query."
        )
    else:
        healthcare_file = output_dir / "healthcare_facilities.gpkg"
        healthcare.to_file(healthcare_file, driver="GPKG")

        # Create representative coordinates for each facility.
        points = healthcare.geometry.representative_point()

        healthcare_csv = healthcare.drop(
            columns="geometry"
        ).copy()

        healthcare_csv["longitude"] = points.x
        healthcare_csv["latitude"] = points.y

        healthcare_csv.to_csv(
            output_dir / "healthcare_facilities.csv",
            index=False,
        )

        print(f"Healthcare facilities downloaded: {len(healthcare)}")

    print("\nDownload process finished.")
    print(f"Files saved in: {output_dir}")
    print(
        "Remember: OpenStreetMap coverage may be incomplete, "
        "and mapped facilities must be checked."
    )


if __name__ == "__main__":
    main()
