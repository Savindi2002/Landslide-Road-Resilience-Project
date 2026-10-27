
import json
from pathlib import Path
from datetime import datetime

import pandas as pd


PROJECT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_DIR / "outputs"
PROCESSED_DIR = PROJECT_DIR / "data" / "processed"
DASHBOARD_DATA_DIR = PROJECT_DIR / "dashboard" / "public" / "data"


def read_csv(path):
    if not path.exists():
        raise FileNotFoundError(f"Required file not found: {path}")
    return pd.read_csv(path)


def clean_records(df):
    df = df.astype(object).where(pd.notna(df), None)
    return df.to_dict(orient="records")


def standard_name(name):
    aliases = {
        "Combined score": "Combined",
        "Combined": "Combined",
    }
    return aliases.get(str(name), str(name))


def main():
    selection = read_csv(
        OUTPUT_DIR / "protection_strategy_selection_summary.csv"
    )
    fair = read_csv(
        PROCESSED_DIR / "hospital_access_fair_comparison.csv"
    )
    random_summary = read_csv(
        OUTPUT_DIR / "protection_strategy_comparison_summary.csv"
    )
    sensitivity = read_csv(
        PROCESSED_DIR / "hospital_access_sensitivity.csv"
    )
    optimization = read_csv(
        OUTPUT_DIR / "exact_hospital_optimization_summary.csv"
    )

    opt = optimization.iloc[0]

    strategies = []
    for _, row in selection.iterrows():
        name = standard_name(row["strategy"])
        match = fair[fair["strategy"].map(standard_name) == name]
        access = match.iloc[0] if not match.empty else None

        strategies.append({
            "name": name,
            "roadsSelected": int(row["selected_roads"]),
            "lengthKm": round(float(row["protected_length_km"]), 3),
            "budgetUsedPercent": round(
                float(row["budget_used_percent"]), 3
            ),
            "meanRisk": None,
            "centrality": None,
            "reachabilityPercent": (
                round(float(access["reachable_percent"]), 3)
                if access is not None else None
            ),
            "reachableNodes": (
                int(access["reachable_nodes"])
                if access is not None else None
            ),
            "closedRoads": (
                int(access["roads_closed_after_protection"])
                if access is not None else None
            ),
            "meanDistanceKm": (
                round(float(access["mean_distance_km"]), 3)
                if access is not None else None
            ),
        })

    connectivity = []
    for _, row in fair.iterrows():
        connectivity.append({
            "name": standard_name(row["strategy"]),
            "initialFailureSetSize": int(row["initial_failure_set_size"]),
            "closedRoads": int(row["roads_closed_after_protection"]),
            "reachableNodes": int(row["reachable_nodes"]),
            "totalNodes": int(row["total_nodes"]),
            "reachabilityPercent": round(
                float(row["reachable_percent"]), 3
            ),
            "meanDistanceKm": round(float(row["mean_distance_km"]), 3),
            "medianDistanceKm": round(
                float(row["median_distance_km"]), 3
            ),
        })

    random_trials = []
    for _, row in random_summary.iterrows():
        random_trials.append({
            "failurePercent": float(row["failure_percent"]),
            "strategy": standard_name(row["strategy"]),
            "trials": int(row["trials"]),
            "meanReachablePercent": round(
                float(row["mean_reachable_percent"]), 3
            ),
            "sdReachablePercent": round(
                float(row["sd_reachable_percent"]), 3
            ),
            "meanDistanceKm": round(float(row["mean_distance_km"]), 3),
            "sdMeanDistanceKm": round(
                float(row["sd_mean_distance_km"]), 3
            ),
        })

    sensitivity_results = []
    for _, row in sensitivity.iterrows():
        sensitivity_results.append({
            "failurePercent": float(row["failure_percent"]),
            "strategy": standard_name(row["strategy"]),
            "initialFailureSetSize": int(row["initial_failure_set_size"]),
            "closedRoads": int(row["roads_closed_after_protection"]),
            "reachableNodes": int(row["reachable_nodes"]),
            "totalNodes": int(row["total_nodes"]),
            "reachabilityPercent": round(
                float(row["reachable_percent"]), 3
            ),
            "meanDistanceKm": round(float(row["mean_distance_km"]), 3),
            "medianDistanceKm": round(
                float(row["median_distance_km"]), 3
            ),
        })

    results = {
        "lastUpdated": datetime.now().astimezone().isoformat(
            timespec="seconds"
        ),
        "summary": {
            "roadSegments": int(opt["original_road_count"]),
            "optimizationRoadCount": int(opt["road_count"]),
            "healthcareFacilities": int(opt["hospital_records"]),
            "distinctHospitalNodes": int(opt["distinct_hospital_nodes"]),
            "budgetPercent": round(float(opt["budget_fraction"]) * 100, 2),
            "budgetLengthKm": round(
                float(opt["budget_length_m"]) / 1000, 3
            ),
            "designFailurePercent": float(opt["design_failure_percent"]),
            "designFailedRoadCount": int(opt["design_failed_road_count"]),
        },
        "strategies": strategies,
        "connectivity": connectivity,
        "randomTrialComparison": random_trials,
        "sensitivity": sensitivity_results,
        "optimization": {
            "solver": str(opt["solver"]),
            "status": str(opt["solver_status"]),
            "optimalityProven": bool(opt["optimality_proven"]),
            "elapsedSeconds": round(float(opt["elapsed_seconds"]), 2),
            "selectedRoadCount": int(opt["selected_road_count"]),
            "protectedLengthKm": round(
                float(opt["protected_length_m"]) / 1000, 3
            ),
            "budgetRemainingKm": round(
                float(opt["budget_remaining_m"]) / 1000, 3
            ),
            "reachableNodeCount": int(opt["design_reachable_node_count"]),
            "reachablePercent": round(
                float(opt["design_reachable_percent"]), 3
            ),
            "objective": str(opt["objective"]),
            "limitation": str(opt["limitation"]),
        },
        "notes": {
            "budgetDefinition": (
                "Budget is measured by selected road length, "
                "not monetary cost."
            ),
            "interpretation": (
                "These are modelled disruption scenarios, not live "
                "landslide predictions or guaranteed hospital access."
            ),
            "fairComparison": (
                "The fair comparison uses a fixed initial set of failed roads."
            ),
            "randomTrials": (
                "Random-trial results are averages across repeated simulations."
            ),
            "missingMetrics": (
                "Mean risk and centrality are null because the selection "
                "summary does not contain these fields."
            ),
        },
    }

    DASHBOARD_DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DASHBOARD_DATA_DIR / "research-results.json"

    output_path.write_text(
        json.dumps(results, indent=2, allow_nan=False),
        encoding="utf-8",
    )

    print("\nResearch results exported successfully!")
    print(f"Output: {output_path}")
    print(f"Strategy rows: {len(strategies)}")
    print(f"Fair comparison rows: {len(connectivity)}")
    print(f"Random-trial rows: {len(random_trials)}")
    print(f"Sensitivity rows: {len(sensitivity_results)}")


if __name__ == "__main__":
    main()
