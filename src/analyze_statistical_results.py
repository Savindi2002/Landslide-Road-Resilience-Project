
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "outputs" / "protection_strategy_comparison_trials.csv"
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(INPUT)

required = [
    "failure_percent",
    "trial",
    "strategy",
    "reachable_percent",
    "mean_distance_km",
]
missing = [column for column in required if column not in df.columns]
if missing:
    raise ValueError(f"Missing required CSV columns: {missing}")

# Validate that each strategy has one row per trial and failure level.
if df.duplicated(["failure_percent", "trial", "strategy"]).any():
    raise ValueError("Duplicate failure_percent/trial/strategy combinations found.")

strategies = sorted(df["strategy"].unique())
if "No protection" not in strategies:
    raise ValueError("The baseline strategy 'No protection' was not found.")

# --------------------------------------------------
# 1. Descriptive statistics and 95% confidence intervals
# --------------------------------------------------
summary = (
    df.groupby(["failure_percent", "strategy"])
    .agg(
        trials=("trial", "nunique"),
        mean_reachability=("reachable_percent", "mean"),
        sd_reachability=("reachable_percent", "std"),
        mean_distance_km=("mean_distance_km", "mean"),
        sd_distance_km=("mean_distance_km", "std"),
    )
    .reset_index()
)

def mean_ci(mean, sd, n):
    if n < 2 or pd.isna(sd):
        return np.nan, np.nan
    margin = stats.t.ppf(0.975, n - 1) * sd / np.sqrt(n)
    return mean - margin, mean + margin

for metric, sd_col, low_col, high_col in [
    (
        "mean_reachability",
        "sd_reachability",
        "reachability_ci95_low",
        "reachability_ci95_high",
    ),
    (
        "mean_distance_km",
        "sd_distance_km",
        "distance_ci95_low",
        "distance_ci95_high",
    ),
]:
    bounds = summary.apply(
        lambda row: mean_ci(row[metric], row[sd_col], row["trials"]),
        axis=1,
    )
    summary[low_col] = [bound[0] for bound in bounds]
    summary[high_col] = [bound[1] for bound in bounds]

summary.to_csv(OUT / "statistical_descriptive_summary.csv", index=False)

# --------------------------------------------------
# 2. Paired comparisons against no protection
# --------------------------------------------------
results = []

for failure in sorted(df["failure_percent"].unique()):
    part = df[df["failure_percent"] == failure]

    baseline = (
        part[part["strategy"] == "No protection"]
        .set_index("trial")
    )

    for strategy in sorted(set(part["strategy"]) - {"No protection"}):
        other = part[part["strategy"] == strategy].set_index("trial")

        for metric in ["reachable_percent", "mean_distance_km"]:
            paired = pd.concat(
                [
                    other[metric].rename("strategy_value"),
                    baseline[metric].rename("baseline_value"),
                ],
                axis=1,
                join="inner",
            ).dropna()

            differences = (
                paired["strategy_value"] - paired["baseline_value"]
            ).to_numpy()

            n = len(differences)
            if n < 2:
                continue

            mean_diff = differences.mean()
            sd_diff = differences.std(ddof=1)
            se = stats.sem(differences)
            critical = stats.t.ppf(0.975, n - 1)

            test = stats.ttest_1samp(differences, popmean=0)

            results.append({
                "failure_percent": failure,
                "strategy": strategy,
                "metric": metric,
                "n_paired_trials": n,
                "mean_difference": mean_diff,
                "sd_difference": sd_diff,
                "ci95_low": mean_diff - critical * se,
                "ci95_high": mean_diff + critical * se,
                "paired_t_p_value": test.pvalue,
            })

comparisons = pd.DataFrame(results)

# Holm correction across all paired tests in this analysis.
def holm_adjust(p_values):
    p_values = np.asarray(p_values, dtype=float)
    m = len(p_values)

    order = np.argsort(p_values)
    sorted_p = p_values[order]

    adjusted_sorted = np.maximum.accumulate(
        (m - np.arange(m)) * sorted_p
    )
    adjusted_sorted = np.minimum(adjusted_sorted, 1.0)

    adjusted = np.empty(m)
    adjusted[order] = adjusted_sorted
    return adjusted

if not comparisons.empty:
    comparisons["holm_adjusted_p_value"] = holm_adjust(
        comparisons["paired_t_p_value"].to_numpy()
    )
    comparisons["significant_after_holm_0_05"] = (
        comparisons["holm_adjusted_p_value"] < 0.05
    )

comparisons.to_csv(
    OUT / "statistical_paired_comparisons.csv",
    index=False,
)

# --------------------------------------------------
# 3. Graph: mean reachability with 95% confidence intervals
# --------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6))

for strategy in strategies:
    part = summary[summary["strategy"] == strategy].sort_values(
        "failure_percent"
    )
    if part.empty:
        continue

    lower = (
        part["mean_reachability"] - part["reachability_ci95_low"]
    ).to_numpy()
    upper = (
        part["reachability_ci95_high"] - part["mean_reachability"]
    ).to_numpy()

    ax.errorbar(
        part["failure_percent"],
        part["mean_reachability"],
        yerr=np.vstack([lower, upper]),
        marker="o",
        capsize=4,
        label=strategy,
    )

ax.set_title("Network Reachability Under Simulated Road Failures")
ax.set_xlabel("Failed roads (%)")
ax.set_ylabel("Reachable nodes (%)")
ax.set_xticks(sorted(df["failure_percent"].unique()))
ax.grid(True, alpha=0.3)
ax.legend(fontsize=8)
fig.tight_layout()
fig.savefig(
    OUT / "reachability_with_95ci.png",
    dpi=300,
    bbox_inches="tight",
)
plt.close(fig)

# --------------------------------------------------
# 4. Graph: mean distance with 95% confidence intervals
# --------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6))

for strategy in strategies:
    part = summary[summary["strategy"] == strategy].sort_values(
        "failure_percent"
    )
    if part.empty:
        continue

    lower = (
        part["mean_distance_km"] - part["distance_ci95_low"]
    ).to_numpy()
    upper = (
        part["distance_ci95_high"] - part["mean_distance_km"]
    ).to_numpy()

    ax.errorbar(
        part["failure_percent"],
        part["mean_distance_km"],
        yerr=np.vstack([lower, upper]),
        marker="o",
        capsize=4,
        label=strategy,
    )

ax.set_title("Mean Distance Among Reachable Nodes")
ax.set_xlabel("Failed roads (%)")
ax.set_ylabel("Mean distance (km)")
ax.set_xticks(sorted(df["failure_percent"].unique()))
ax.grid(True, alpha=0.3)
ax.legend(fontsize=8)
fig.tight_layout()
fig.savefig(
    OUT / "mean_distance_with_95ci.png",
    dpi=300,
    bbox_inches="tight",
)
plt.close(fig)

print("\n=== DESCRIPTIVE SUMMARY WITH 95% CIs ===")
print(summary.round(3).to_string(index=False))

print("\n=== PAIRED COMPARISONS WITH HOLM CORRECTION ===")
if not comparisons.empty:
    print(
        comparisons[
            [
                "failure_percent",
                "strategy",
                "metric",
                "mean_difference",
                "ci95_low",
                "ci95_high",
                "paired_t_p_value",
                "holm_adjusted_p_value",
                "significant_after_holm_0_05",
            ]
        ].round(4).to_string(index=False)
    )

print("\nSaved files in outputs:")
for filename in [
    "statistical_descriptive_summary.csv",
    "statistical_paired_comparisons.csv",
    "reachability_with_95ci.png",
    "mean_distance_with_95ci.png",
]:
    print(f"- {filename}")
