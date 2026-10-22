
from pathlib import Path

import geopandas as gpd
import pandas as pd
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt


# ============================================================
# 1. PATHS AND SETTINGS
# ============================================================

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "processed"
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)

ROAD_FILE = DATA / "road_risk_scores_unique.gpkg"
RANK_FILE = DATA / "road_priority_ranking.csv"
HOSPITAL_FILE = DATA / "healthcare_graph_locations.csv"
OPT_FILE = OUT / "exact_hospital_optimization_selected_roads.csv"

BUDGET_FRACTION = 0.10
FAILURE_LEVELS = [2, 5, 10]
N_TRIALS = 30
RANDOM_SEED = 42


# ============================================================
# 2. CONSISTENT ROAD IDENTIFIERS
# ============================================================

def normalize_value(value):
    """Normalize identifiers read from GeoPackage or CSV files."""

    if isinstance(value, (list, tuple, np.ndarray)):
        return "[" + ",".join(normalize_value(x) for x in value) + "]"

    if value is None:
        return "NA"

    if isinstance(value, (float, np.floating)):
        if np.isnan(value):
            return "NA"
        if value.is_integer():
            return str(int(value))
        return str(value)

    if isinstance(value, (int, np.integer)):
        return str(int(value))

    text = str(value).strip()

    if not text or text.lower() in {"nan", "none"}:
        return "NA"

    # Standardize numeric strings such as "123.0".
    try:
        number = float(text)
        if np.isfinite(number) and number.is_integer():
            return str(int(number))
    except ValueError:
        pass

    # Standardize list-like OSM ID strings from CSV files.
    if text.startswith("[") and text.endswith("]"):
        text = text.replace(" ", "")

    return text


def add_road_ids(df):
    """Create road IDs consistent across the project's data files."""

    df = df.copy()

    for column in ["u", "v", "key", "osmid", "length"]:
        if column not in df.columns:
            raise ValueError(f"Road data is missing column: {column}")

    df["u_norm"] = df["u"].map(normalize_value)
    df["v_norm"] = df["v"].map(normalize_value)
    df["key_norm"] = df["key"].map(normalize_value)
    df["osmid_norm"] = df["osmid"].map(normalize_value)

    df["length"] = pd.to_numeric(df["length"], errors="coerce")
    df["length_norm"] = df["length"].round(3).map(normalize_value)

    endpoints = df.apply(
        lambda r: sorted([r["u_norm"], r["v_norm"]]),
        axis=1,
    )

    df["road_id"] = [
        f"{ends[0]}|{ends[1]}|{key}|{osm}|{length}"
        for ends, key, osm, length in zip(
            endpoints,
            df["key_norm"],
            df["osmid_norm"],
            df["length_norm"],
        )
    ]

    return df


# ============================================================
# 3. SELECT ROADS WITHIN A LENGTH BUDGET
# ============================================================

def greedy_budget_selection(df, score_column, budget_m):
    """
    Select highest-scoring complete road segments.
    Skip segments that do not fit so later smaller segments
    can still be selected.
    """

    ranked = df.sort_values(
        score_column,
        ascending=False,
        kind="stable",
    )

    selected_ids = set()
    used_length = 0.0

    for row in ranked.itertuples(index=False):
        road_id = row.road_id
        length = float(row.length)
        score = getattr(row, score_column)

        if not np.isfinite(length) or length <= 0:
            continue

        if not np.isfinite(score):
            continue

        if used_length + length <= budget_m:
            selected_ids.add(road_id)
            used_length += length

    return selected_ids


# ============================================================
# 4. ROUTING AND ACCESSIBILITY EVALUATION
# ============================================================

def evaluate_scenario(graph, hospital_nodes, failed_ids, protected_ids):
    """
    Remove failed, unprotected road segments and measure
    the proportion of nodes reachable from a hospital.

    A MultiGraph preserves parallel road segments.
    """

    test_graph = graph.copy()

    for u, v, key in list(
        test_graph.edges(keys=True)
    ):
        if key in failed_ids and key not in protected_ids:
            test_graph.remove_edge(u, v, key=key)

    distances = nx.multi_source_dijkstra_path_length(
        test_graph,
        hospital_nodes,
        weight="length",
    )

    reachable_percent = (
        100.0 * len(distances) / graph.number_of_nodes()
    )

    mean_distance_km = (
        float(np.mean(list(distances.values()))) / 1000.0
        if distances
        else np.nan
    )

    return reachable_percent, mean_distance_km


# ============================================================
# 5. LOAD AND VALIDATE DATA
# ============================================================

def main():
    for path in [
        ROAD_FILE,
        RANK_FILE,
        HOSPITAL_FILE,
        OPT_FILE,
    ]:
        if not path.exists():
            raise FileNotFoundError(f"Required file not found: {path}")

    print("Loading road network, rankings and hospital locations...")

    roads = gpd.read_file(ROAD_FILE)
    ranking = pd.read_csv(RANK_FILE)
    hospitals = pd.read_csv(
        HOSPITAL_FILE,
        dtype={"nearest_node_id": "string"},
    )
    optimized = pd.read_csv(OPT_FILE)

    roads = add_road_ids(roads)
    ranking = add_road_ids(ranking)
    optimized = add_road_ids(optimized)

    # Self-loops cannot connect distinct network nodes.
    roads = roads[roads["u_norm"] != roads["v_norm"]].copy()
    ranking = ranking[ranking["u_norm"] != ranking["v_norm"]].copy()
    optimized = optimized[
        optimized["u_norm"] != optimized["v_norm"]
    ].copy()

    roads = roads[
        roads["length"].notna() & (roads["length"] > 0)
    ].copy()

    # Check whether road IDs are unique before using them.
    duplicate_count = int(roads["road_id"].duplicated().sum())

    if duplicate_count:
        raise ValueError(
            f"{duplicate_count} duplicate road IDs found. "
            "Inspect the road identifiers before continuing."
        )

    required_scores = [
        "risk_proxy_score",
        "centrality_score",
        "combined_priority_score",
    ]

    missing = [c for c in required_scores if c not in ranking.columns]
    if missing:
        raise ValueError(f"Ranking file is missing columns: {missing}")

    ranking = ranking.drop_duplicates("road_id")

    # Use the ranking file's actual strategy scores.
    score_columns = ranking[
        ["road_id"] + required_scores
    ]

    roads = roads.drop(
        columns=required_scores,
        errors="ignore",
    ).merge(
        score_columns,
        on="road_id",
        how="left",
        validate="one_to_one",
    )

    unmatched_scores = int(roads[required_scores].isna().any(axis=1).sum())

    if unmatched_scores:
        raise ValueError(
            f"{unmatched_scores} roads could not be matched to ranking "
            "scores. Do not continue until road IDs are reconciled."
        )

    total_length_m = float(roads["length"].sum())
    budget_m = total_length_m * BUDGET_FRACTION

    print(f"Road records used: {len(roads):,}")
    print(f"Total road length: {total_length_m / 1000:.2f} km")
    print(f"10% protection budget: {budget_m / 1000:.2f} km")

    # ========================================================
    # 6. DEFINE PROTECTION STRATEGIES
    # ========================================================

    risk_ids = greedy_budget_selection(
        roads, "risk_proxy_score", budget_m
    )

    centrality_ids = greedy_budget_selection(
        roads, "centrality_score", budget_m
    )

    combined_ids = greedy_budget_selection(
        roads, "combined_priority_score", budget_m
    )

    road_id_set = set(roads["road_id"])

    optimized_ids = set(optimized["road_id"])
    optimized_matched = optimized_ids.intersection(road_id_set)
    optimized_unmatched = optimized_ids - road_id_set

    if optimized_unmatched:
        print(
            "WARNING: "
            f"{len(optimized_unmatched)} optimized road IDs did not "
            "match the comparison road network."
        )

    strategies = {
        "No protection": set(),
        "Risk-based": risk_ids,
        "Centrality-based": centrality_ids,
        "Combined score": combined_ids,
        "Hospital-access optimization": optimized_matched,
    }

    length_by_id = roads.set_index("road_id")["length"].to_dict()

    selection_rows = []

    for strategy, selected_ids in strategies.items():
        valid_ids = selected_ids.intersection(road_id_set)
        protected_length = sum(
            length_by_id[rid] for rid in valid_ids
        )

        selection_rows.append({
            "strategy": strategy,
            "selected_roads": len(valid_ids),
            "protected_length_km": protected_length / 1000,
            "budget_used_percent": (
                100 * protected_length / budget_m
                if budget_m else 0
            ),
        })

    selection_summary = pd.DataFrame(selection_rows)
    selection_summary.to_csv(
        OUT / "protection_strategy_selection_summary.csv",
        index=False,
    )

    print("\n=== PROTECTION SELECTION SUMMARY ===")
    print(selection_summary.round(3).to_string(index=False))

    # ========================================================
    # 7. BUILD THE ROAD GRAPH
    # ========================================================

    graph = nx.MultiGraph()

    # Keep parallel road segments instead of collapsing them.
    for u, v, length, road_id in roads[
        ["u_norm", "v_norm", "length", "road_id"]
    ].itertuples(index=False, name=None):

        if u == v:
            continue

        graph.add_edge(
            u,
            v,
            key=road_id,
            road_id=road_id,
            length=float(length),
        )

    hospital_nodes = {
        normalize_value(node)
        for node in hospitals["nearest_node_id"].dropna()
    }

    hospital_nodes.intersection_update(graph.nodes)

    if not hospital_nodes:
        raise ValueError(
            "No hospital nodes match the road graph. "
            "Check nearest_node_id formatting."
        )

    print(f"\nGraph nodes: {graph.number_of_nodes():,}")
    print(f"Graph road segments: {graph.number_of_edges():,}")
    print(f"Distinct hospital source nodes: {len(hospital_nodes)}")

    # ========================================================
    # 8. FAIR RANDOM FAILURE TESTS
    # ========================================================

    rng = np.random.default_rng(RANDOM_SEED)
    all_road_ids = np.array(roads["road_id"].tolist(), dtype=object)
    trial_rows = []

    for failure_pct in FAILURE_LEVELS:
        n_failed = max(
            1,
            int(round(len(all_road_ids) * failure_pct / 100)),
        )

        print(
            f"\nEvaluating {failure_pct}% road failures "
            f"across {N_TRIALS} trials..."
        )

        for trial in range(1, N_TRIALS + 1):
            failed_ids = set(
                rng.choice(
                    all_road_ids,
                    size=min(n_failed, len(all_road_ids)),
                    replace=False,
                ).tolist()
            )

            # The same failed roads are tested against every strategy.
            for strategy, protected_ids in strategies.items():
                reachability, mean_distance = evaluate_scenario(
                    graph,
                    hospital_nodes,
                    failed_ids,
                    protected_ids,
                )

                trial_rows.append({
                    "failure_percent": failure_pct,
                    "trial": trial,
                    "strategy": strategy,
                    "reachable_percent": reachability,
                    "mean_distance_km": mean_distance,
                    "failed_roads_sampled": len(failed_ids),
                })

    trials_df = pd.DataFrame(trial_rows)
    trials_path = OUT / "protection_strategy_comparison_trials.csv"
    trials_df.to_csv(trials_path, index=False)

    summary = (
        trials_df.groupby(["failure_percent", "strategy"])
        .agg(
            trials=("trial", "count"),
            mean_reachable_percent=("reachable_percent", "mean"),
            sd_reachable_percent=("reachable_percent", "std"),
            mean_distance_km=("mean_distance_km", "mean"),
            sd_mean_distance_km=("mean_distance_km", "std"),
        )
        .reset_index()
    )

    summary_path = OUT / "protection_strategy_comparison_summary.csv"
    summary.to_csv(summary_path, index=False)

    print("\n=== FINAL HOSPITAL-ACCESS COMPARISON ===")
    print(summary.round(3).to_string(index=False))

    # ========================================================
    # 9. CREATE A REPORT-READY REACHABILITY GRAPH
    # ========================================================

    plot_data = summary.pivot(
        index="failure_percent",
        columns="strategy",
        values="mean_reachable_percent",
    )

    ax = plot_data.plot(
        marker="o",
        figsize=(10, 6),
    )

    ax.set_title("Hospital-Network Reachability Under Random Road Failures")
    ax.set_xlabel("Random road failures (%)")
    ax.set_ylabel("Reachable road-network nodes (%)")
    ax.set_ylim(0, 100)
    ax.grid(True, alpha=0.3)
    ax.legend(title="Protection strategy", fontsize=8)
    plt.tight_layout()

    plot_path = OUT / "protection_strategy_reachability.png"
    plt.savefig(plot_path, dpi=300, bbox_inches="tight")
    plt.close()

    print("\nSaved output files:")
    print(OUT / "protection_strategy_selection_summary.csv")
    print(trials_path)
    print(summary_path)
    print(plot_path)

    print(
        "\nInterpretation note: random failures are stress-test scenarios, "
        "not calibrated landslide probabilities. Reachable nodes are a "
        "proxy for access, not a measure of population served."
    )


if __name__ == "__main__":
    main()
