
from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "processed"

file = DATA / "hospital_access_random_trials.csv"
df = pd.read_csv(file)

baseline = (
    df[df["strategy"] == "No protection"]
    [["failure_percent", "trial", "reachable_percent",
      "mean_distance_km"]]
    .rename(columns={
        "reachable_percent": "baseline_reachable",
        "mean_distance_km": "baseline_distance_km",
    })
)

comparison = df[
    df["strategy"] != "No protection"
].merge(
    baseline,
    on=["failure_percent", "trial"],
    how="inner",
    validate="many_to_one",
)

# Positive accessibility improvement means more nodes stay connected.
comparison["accessibility_improvement_pp"] = (
    comparison["reachable_percent"]
    - comparison["baseline_reachable"]
)

# Positive distance improvement means a shorter mean distance.
# This metric only covers nodes that remain connected.
comparison["distance_improvement_km"] = (
    comparison["baseline_distance_km"]
    - comparison["mean_distance_km"]
)

rows = []

for (failure, strategy), group in comparison.groupby(
    ["failure_percent", "strategy"]
):
    n = len(group)

    for metric, label in [
        ("accessibility_improvement_pp",
         "accessibility_improvement_pp"),
        ("distance_improvement_km",
         "distance_improvement_km"),
    ]:
        values = group[metric].dropna()
        count = len(values)

        if count < 2:
            continue

        mean = values.mean()
        sd = values.std(ddof=1)
        se = sd / np.sqrt(count)

        # Approximate 95% t confidence interval for 30 paired trials.
        # 2.045 is the two-sided t critical value for df=29.
        critical = 2.045 if count == 30 else 1.96

        rows.append({
            "failure_percent": failure,
            "strategy": strategy,
            "metric": label,
            "trials": count,
            "mean_improvement": mean,
            "sd_improvement": sd,
            "ci95_lower": mean - critical * se,
            "ci95_upper": mean + critical * se,
        })

out = pd.DataFrame(rows)

output_file = DATA / "random_strategy_improvements.csv"
out.to_csv(output_file, index=False)

print("\n=== PAIRED IMPROVEMENT OVER NO PROTECTION ===")
print(out.round(3).to_string(index=False))
print("\nSaved:", output_file)
print(
    "\nPositive accessibility improvement is better. "
    "Positive distance improvement means a shorter mean distance "
    "among nodes that remain connected."
)
