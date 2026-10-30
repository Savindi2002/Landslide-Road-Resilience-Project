# LANDSAFE: Landslide-Resilient Road Networks in Sri Lanka's Hill Country

### A Graph-Theoretical, Budget-Constrained Road Protection Study

**Study Area:** Ratnapura District, Sri Lanka

LANDSAFE is a research project that investigates how graph theory can support road-network resilience and road-protection prioritisation in landslide-prone areas of Sri Lanka's hill country.

The project compares different road-selection strategies under a limited road-length budget and evaluates their performance using simulated road-failure scenarios. It also investigates network reachability and healthcare-access optimisation.

---

## 1. Research Background

Landslides can disrupt transportation networks, reduce road connectivity and affect communities' access to essential services, including healthcare facilities.

When resources are limited, protecting every road segment may not be practical. Therefore, identifying critical road segments and prioritising protection is important for improving transportation-network resilience.

This project applies graph-theoretical approaches to analyse road-network structure and compare alternative road-protection strategies.

## 2. Research Objectives

The main objectives are:

- To represent the road network as a graph using nodes and edges.
- To analyse road-network structure and connectivity.
- To develop an exploratory risk-proxy score using available road and terrain attributes.
- To identify important road segments using graph centrality.
- To compare risk-based, centrality-based and combined road-selection strategies.
- To evaluate network reachability under simulated road failures.
- To investigate healthcare-access optimisation under different failure scenarios.
- To compare road-protection strategies under a limited road-length budget.

## 3. Methodology

The project follows a computational case-study approach consisting of the following stages:

1. **Data collection:** Obtain road-network data from OpenStreetMap and collect terrain attributes and mapped healthcare facilities.
2. **Data preprocessing:** Clean the road data, remove duplicate road-segment records and prepare spatial datasets.
3. **Graph construction:** Represent road junctions as nodes and road segments as edges.
4. **Risk assessment:** Calculate an exploratory risk-proxy score using available terrain and road attributes.
5. **Centrality analysis:** Identify structurally important road segments using graph-based centrality measures.
6. **Road selection:** Compare risk-based, centrality-based and combined selection strategies.
7. **Budget allocation:** Apply a nominal budget constraint based on 10% of the total road length.
8. **Simulation and evaluation:** Evaluate network reachability and healthcare-access optimisation under simulated road failures.

## 4. Road Selection Strategies

Three main road-selection strategies are investigated.

| Strategy | Description |
|---|---|
| Risk-based | Prioritises road segments with higher exploratory risk-proxy scores. |
| Centrality-based | Prioritises road segments according to their structural importance in the road network. |
| Combined | Considers both risk-proxy scores and network centrality. |

A separate hospital-access optimisation experiment is also conducted to investigate reachability under repeated simulated failures.

## 5. Dataset Overview

The project uses spatial and network-related datasets for Ratnapura District.

| Dataset | Description |
|---|---|
| Road network | Road segments and junction information from OpenStreetMap. |
| Terrain attributes | Elevation, slope and other available terrain-related variables. |
| Healthcare facilities | Mapped healthcare locations used in accessibility analysis. |
| Risk scores | Exploratory risk-proxy values assigned to road segments. |
| Road-selection results | Selected road segments under different strategies. |
| Simulation results | Network reachability and healthcare-access results under simulated road failures. |

### Dataset summary

- Cleaned road-segment records: **14,535**
- Reported graph nodes: **12,635**
- Mapped healthcare facilities: **30**

## 6. Key Research Results

### Main strategy comparison

The main simulated scenario reported the following network reachability results:

| Strategy | Reachability |
|---|---:|
| No protection | 86.751% |
| Risk-based | 99.921% |
| Centrality-based | 90.700% |
| Combined | 97.420% |

The risk-based strategy achieved the highest reported reachability in this particular simulated scenario.

### Road-selection results

| Strategy | Selected road segments |
|---|---:|
| Risk-based | 720 |
| Centrality-based | 1,705 |
| Combined | 965 |

The nominal road-length budget was approximately **568.546 km**, equivalent to 10% of the reported total road length.

### Hospital-access optimisation

A separate experiment using 30 random trials compared no protection with hospital-access optimisation.

| Failure level | No protection | Hospital-access optimisation |
|---|---:|---:|
| 2% | 96.658% | 97.290% |
| 5% | 90.016% | 91.730% |
| 10% | 73.466% | 78.359% |

Hospital-access optimisation achieved higher mean reachability at all three tested failure levels.

*Note: These are simulation-based findings and should not be interpreted as measured real-world impacts.*

## 7. Technologies and Tools

The project uses the following technologies and tools:

- **Python** – Data processing, analysis and modelling.
- **GeoPandas** – Geospatial data processing.
- **NetworkX** – Graph construction and network analysis.
- **Pandas** – Data manipulation and analysis.
- **NumPy** – Numerical computation.
- **Matplotlib / Seaborn** – Data visualisation.
- **QGIS** – Spatial data inspection and mapping.
- **VS Code** – Development environment.
- **Git and GitHub** – Version control and project management.

## 8. Project Structure

The project is organised into the following main directories:

```text
Landslide-Road-Resilience-Project/
│
├── data/
│   ├── raw/
│   │   ├── road_edges.gpkg
│   │   └── healthcare_facilities.gpkg
│   │
│   └── processed/
│       ├── road_terrain_features.gpkg
│       ├── rainfall_features.csv
│       └── road_risk_scores_unique.gpkg
│
├── src/
│   ├── data collection and preprocessing scripts
│   ├── graph construction scripts
│   ├── risk assessment scripts
│   ├── road selection scripts
│   └── simulation and evaluation scripts
│
├── results/
│   ├── road_priority_ranking.csv
│   ├── strategy comparison results
│   ├── simulation results
│   └── visualisations/
│
├── notebooks/
│
├── README.md
├── requirements.txt
└── .gitignore
```

*Note: Update the folder and file names above to match the exact contents of your final GitHub repository.*

## 9. Installation and Setup

### Step 1: Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Navigate to the project directory

```bash
cd Landslide-Road-Resilience-Project
```

### Step 3: Create a virtual environment

```bash
python -m venv .venv
```

### Step 4: Activate the virtual environment

For Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

### Step 5: Install dependencies

```bash
pip install -r requirements.txt
```

### Step 6: Run the project

Run the Python scripts from the project root directory according to the pipeline and execution order documented in the source files.

## 10. Limitations

- The risk score is an exploratory proxy and has not been validated as a landslide probability.
- Random road-failure scenarios may not represent the spatial clustering of actual landslides.
- The road-protection budget is based on road length rather than actual monetary intervention costs.
- General network reachability does not necessarily represent population-weighted or patient-level healthcare accessibility.
- Simulation outcomes do not establish actual real-world reductions in road closures.

## 11. Future Improvements

Future development could include:

- Validating risk scores using a verified historical landslide inventory.
- Incorporating rainfall and additional environmental variables.
- Testing spatially clustered road-failure scenarios.
- Integrating machine-learning models after obtaining suitable labelled data.
- Incorporating actual road-protection and maintenance costs.
- Improving healthcare accessibility using population-weighted measures.
- Evaluating the framework using observed landslide events.

## 12. Research Contribution

LANDSAFE demonstrates how graph theory and network optimisation can support the analysis of road connectivity and the prioritisation of road segments under limited resources.

The study provides a computational framework for comparing road-protection strategies and investigating healthcare accessibility in a landslide-risk context in Sri Lanka.

---

**Project:** LANDSAFE  
**Study Area:** Ratnapura District, Sri Lanka  
**Research Area:** Graph Theory | Transportation Network Resilience | Geospatial Analysis | Network Optimisation

**Disclaimer:** This project is an academic research study. Its risk scores and simulated outcomes are exploratory and are not intended to function as a real-time landslide prediction or road-closure warning system.
