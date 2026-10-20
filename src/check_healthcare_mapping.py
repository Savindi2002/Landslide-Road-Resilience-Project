
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

files = [
    ROOT / "data/processed/healthcare_graph_locations.csv",
    ROOT / "data/processed/road_priority_ranking.csv",
]

for path in files:
    print(f"\n{'=' * 60}")
    print("FILE:", path.name)
    print("=" * 60)

    if not path.exists():
        print("FILE NOT FOUND")
        continue

    df = pd.read_csv(path)

    print("Rows:", len(df))
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head().to_string(index=False))

    if "node_id" in df.columns:
        print("\nNon-missing node IDs:", df["node_id"].notna().sum())

print("\nMapping check complete.")
