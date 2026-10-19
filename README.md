# Landslide-Resilient Road Networks in Ratnapura, Sri Lanka

**Project aim:** investigate whether landslide susceptibility-informed road protection can improve population access to hospitals under a limited budget.

## Important scientific limitation

The starter project is runnable immediately, but its generated sample data and toy road network are **synthetic demonstration data**. They are only for checking that the code runs; they are not measurements from Sri Lanka and must not be reported as empirical findings.

A landslide-susceptibility model is not the same as a road-blockage probability model. To claim that the model predicts road closures, you need historical road-segment blockage labels. If you only have landslide locations and environmental factors, describe the output as susceptibility and conduct sensitivity analysis for any assumed conversion to road risk.

## Project structure

```text
landslide_road_resilience_project/
├── README.md
├── requirements.txt
├── .gitignore
├── data/
│   ├── raw/                 # Place source data here; don't commit large/licensed files
│   └── processed/           # Prepared CSV files
├── notebooks/
│   └── 01_project_walkthrough.ipynb
├── src/
│   ├── train_ml.py           # Random Forest + Logistic Regression baseline
│   ├── make_demo_data.py     # Creates clearly labelled synthetic example data
│   └── optimize_network.py   # Scenario simulation and small-network optimization
└── outputs/                  # Metrics, figures and tables created by scripts
```

## Run in Google Colab

1. Upload this folder to your GitHub repository, or open a Colab notebook.
2. Install packages: `!pip install -r requirements.txt`
3. Run `python src/make_demo_data.py` to create synthetic example inputs.
4. Run `python src/train_ml.py --input data/processed/ml_samples.csv`
5. Run `python src/optimize_network.py`
6. Inspect `outputs/`.

You can also run each script from a Colab cell by prefixing the command with `!`.

## Replace the synthetic ML data with real data

Prepare a CSV with one row per sampled location and these columns:

- `slope` (degrees)
- `elevation_m` (metres)
- `rainfall_7d_mm` (millimetres over preceding 7 days, if temporally appropriate)
- `distance_to_stream_m` (metres)
- `landcover_code` (numeric category code)
- `landslide` (1 = recorded landslide; 0 = sampled non-landslide)

The script also accepts optional `x` and `y` coordinate columns. These are used only to make a spatial holdout split if present; they are not model predictors.

**Do not invent missing measurements.** If your source dataset has different column names, map them to these names after reading its documentation. Record the source, date, resolution, license and preprocessing steps.

For a robust evaluation, use a spatially separated test set. The starter script uses a coarse coordinate-based holdout when coordinates exist; otherwise it uses a stratified random split and warns that this may overestimate generalization because nearby samples can be similar.

## Optimization assumptions

The network script contains a small toy network to demonstrate the methodology. Edge failure probabilities and protection costs in that network are illustrative assumptions. The code simulates edge failures and evaluates candidate protection sets by the population that can still reach at least one hospital.

It uses exhaustive subset search on a small candidate set, which gives an exact optimum for that small demonstration but does not scale to a large real road network. For a larger network, use an ILP formulation with explicit scenario-specific flow/connectivity constraints or a suitable optimization heuristic.

The script compares:
- random selection,
- betweenness-centrality selection,
- greedy marginal-accessibility selection,
- exhaustive optimum on the toy candidate set.

## Research gap (preliminary, must be verified)

Prior work has studied landslide susceptibility mapping and road-network vulnerability separately, and Sri Lankan work has also considered GIS-based road alignment. The defensible proposed contribution is to **implement and evaluate a local, budget-constrained, scenario-based graph framework for maintaining hospital accessibility, using susceptibility-informed risk and transparent uncertainty assumptions**. Do not claim that no prior study exists until the literature search is complete.

## Suggested citation practice

Cite all research papers and data sources you actually use. If adapting a repository, follow its license and cite its associated publication. Do not cite this starter code as a validated scientific model.
