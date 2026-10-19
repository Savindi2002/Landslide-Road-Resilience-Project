"""Toy network demonstration: simulate failures and compare protection strategies.

All node populations, edge risks, costs and graph structure below are illustrative,
not real data from Ratnapura or Sri Lanka.
"""
from pathlib import Path
from itertools import combinations
import json

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(7)

# Toy road graph: nodes represent village access points, junctions and hospitals.
G = nx.Graph()
nodes = {
    "V1": {"kind": "village", "population": 900},
    "V2": {"kind": "village", "population": 700},
    "V3": {"kind": "village", "population": 500},
    "J1": {"kind": "junction", "population": 0},
    "J2": {"kind": "junction", "population": 0},
    "J3": {"kind": "junction", "population": 0},
    "H1": {"kind": "hospital", "population": 0},
    "H2": {"kind": "hospital", "population": 0},
}
G.add_nodes_from((n, attrs) for n, attrs in nodes.items())

# failure_prob is an assumed scenario probability, not a measured blockage probability.
edges = [
    ("V1", "J1", 0.30, 3),
    ("V2", "J1", 0.20, 2),
    ("V3", "J2", 0.35, 3),
    ("J1", "J2", 0.25, 4),
    ("J2", "J3", 0.30, 3),
    ("J1", "H1", 0.10, 2),
    ("J3", "H2", 0.12, 2),
    ("J1", "J3", 0.18, 4),
]
for u, v, p, cost in edges:
    G.add_edge(u, v, failure_prob=p, cost=cost, travel_time=1.0)

VILLAGES = [n for n, d in G.nodes(data=True) if d["kind"] == "village"]
HOSPITALS = [n for n, d in G.nodes(data=True) if d["kind"] == "hospital"]
POP = {n: G.nodes[n]["population"] for n in VILLAGES}
CANDIDATES = list(G.edges())
BUDGET = 6
N_SCENARIOS = 200
PROTECTION_MULTIPLIER = 0.25  # assumed residual risk if strengthened


def reachable_population(graph):
    total = 0
    for village in VILLAGES:
        if any(nx.has_path(graph, village, hospital) for hospital in HOSPITALS):
            total += POP[village]
    return total


def simulate_scenarios():
    """Generate a shared set of failure draws for fair method comparisons."""
    base_probs = [G.edges[e]["failure_prob"] for e in CANDIDATES]
    return RNG.random((N_SCENARIOS, len(CANDIDATES))) < np.array(base_probs)


SCENARIOS = simulate_scenarios()


# Shared uniforms enable common random numbers for fair comparison.
UNIFORMS = RNG.random((N_SCENARIOS, len(CANDIDATES)))


def effective_probability(edge, protected):
    p = G.edges[edge]["failure_prob"]
    return p * PROTECTION_MULTIPLIER if edge in protected else p


def score_protection_set(protected):
    protected = set(protected)
    total = 0.0
    for s in range(N_SCENARIOS):
        H = G.copy()
        for j, edge in enumerate(CANDIDATES):
            if UNIFORMS[s, j] < effective_probability(edge, protected):
                H.remove_edge(*edge)
        total += reachable_population(H)
    return total / N_SCENARIOS


def cost_of(protected):
    return sum(G.edges[e]["cost"] for e in protected)


def feasible_sets():
    # Exact exhaustive search is feasible only because this toy graph has few edges.
    for r in range(len(CANDIDATES) + 1):
        for subset in combinations(CANDIDATES, r):
            if cost_of(subset) <= BUDGET:
                yield subset


def centrality_strategy():
    centrality = nx.edge_betweenness_centrality(G, normalized=True)
    ranked = sorted(CANDIDATES, key=lambda e: centrality.get(e, centrality.get((e[1], e[0]), 0)),
                    reverse=True)
    chosen, spent = [], 0
    for edge in ranked:
        c = G.edges[edge]["cost"]
        if spent + c <= BUDGET:
            chosen.append(edge)
            spent += c
    return chosen


def greedy_strategy():
    chosen, spent = [], 0
    current = score_protection_set(chosen)
    while True:
        best_edge, best_gain = None, 0
        for edge in CANDIDATES:
            if edge in chosen or (edge[1], edge[0]) in chosen:
                continue
            c = G.edges[edge]["cost"]
            if spent + c > BUDGET:
                continue
            value = score_protection_set(chosen + [edge])
            gain = value - current
            if gain > best_gain:
                best_edge, best_gain = edge, gain
        if best_edge is None:
            break
        chosen.append(best_edge)
        spent += G.edges[best_edge]["cost"]
        current += best_gain
    return chosen


def random_strategy(seed=12):
    rng = np.random.default_rng(seed)
    ranked = list(CANDIDATES)
    rng.shuffle(ranked)
    chosen, spent = [], 0
    for edge in ranked:
        c = G.edges[edge]["cost"]
        if spent + c <= BUDGET:
            chosen.append(edge)
            spent += c
    return chosen


def main():
    methods = {
        "No protection": [],
        "Random": random_strategy(),
        "Betweenness": centrality_strategy(),
        "Greedy": greedy_strategy(),
    }
    # Exact optimum under the toy scenario model.
    best_set, best_score = (), -1
    for subset in feasible_sets():
        value = score_protection_set(subset)
        if value > best_score:
            best_set, best_score = subset, value
    methods["Exhaustive optimum"] = list(best_set)

    rows = []
    for method, chosen in methods.items():
        rows.append({
            "method": method,
            "expected_population_with_hospital_access": round(score_protection_set(chosen), 2),
            "budget_spent_units": cost_of(chosen),
            "protected_edges": "; ".join(f"{u}-{v}" for u, v in chosen) or "None"
        })
    df = pd.DataFrame(rows)
    df.to_csv(OUT / "optimization_comparison.csv", index=False)
    print(df.to_string(index=False))
    with open(OUT / "optimization_assumptions.json", "w", encoding="utf-8") as f:
        json.dump({
            "data_status": "SYNTHETIC TOY NETWORK; not Sri Lankan empirical data",
            "budget_units": BUDGET,
            "scenarios": N_SCENARIOS,
            "residual_risk_multiplier_for_protected_edges": PROTECTION_MULTIPLIER,
            "note": "Replace graph, populations, costs, and risk assumptions with documented data."
        }, f, indent=2)

    # Plot strategy comparison.
    plt.figure(figsize=(9, 5))
    plt.bar(df["method"], df["expected_population_with_hospital_access"])
    plt.ylabel("Expected population retaining hospital access (toy population)")
    plt.title("Strategy comparison — synthetic demonstration only")
    plt.xticks(rotation=20, ha="right")
    plt.tight_layout()
    plt.savefig(OUT / "strategy_comparison.png", dpi=180)
    plt.close()

    # Graph visualization.
    pos = nx.spring_layout(G, seed=10)
    plt.figure(figsize=(9, 6))
    node_colors = [
        "#d95f02" if G.nodes[n]["kind"] == "hospital"
        else "#1b9e77" if G.nodes[n]["kind"] == "village"
        else "#7570b3" for n in G.nodes
    ]
    protected = set(best_set)
    edge_colors = [
        "#e41a1c" if e in protected or (e[1], e[0]) in protected else "#999999"
        for e in G.edges
    ]
    nx.draw_networkx(G, pos, with_labels=True, node_color=node_colors,
                     edge_color=edge_colors, node_size=900, font_size=9)
    plt.title("Toy road graph (red edges = selected by exhaustive search)")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(OUT / "toy_road_graph.png", dpi=180)
    plt.close()
    print(f"\nOutputs saved to {OUT}")
    print("WARNING: all graph values are synthetic assumptions.")


if __name__ == "__main__":
    main()
