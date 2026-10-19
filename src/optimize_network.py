
from pathlib import Path
import json

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd


BUDGET = 10
N_SCENARIOS = 1500
SEED = 42


def build_demo_graph():
    """Build a small artificial road network."""

    graph = nx.Graph()

    nodes = {
        "Village_A": (0, 2),
        "Village_B": (0, 0),
        "Junction_1": (2, 1),
        "Junction_2": (4, 2),
        "Junction_3": (4, 0),
        "Hospital_A": (6, 2),
        "Hospital_B": (6, 0),
    }

    for node, position in nodes.items():
        graph.add_node(node, pos=position)

    # risk = assumed probability of failure in a scenario.
    # cost = assumed protection cost units.
    edges = [
        ("Village_A", "Junction_1", 0.20, 4),
        ("Village_B", "Junction_1", 0.25, 3),
        ("Junction_1", "Junction_2", 0.35, 5),
        ("Junction_1", "Junction_3", 0.15, 3),
        ("Junction_2", "Hospital_A", 0.30, 4),
        ("Junction_3", "Hospital_B", 0.20, 3),
        ("Junction_2", "Junction_3", 0.10, 2),
        ("Junction_3", "Hospital_A", 0.25, 4),
    ]

    for u, v, risk, cost in edges:
        graph.add_edge(
            u,
            v,
            risk=risk,
            cost=cost,
            residual_multiplier=0.25,
        )

    return graph


def create_scenarios(graph, n_scenarios, rng):
    """Sample artificial road failures from assumed edge risks."""

    edges = list(graph.edges(data=True))
    scenarios = []

    for _ in range(n_scenarios):
        failed = set()

        for u, v, data in edges:
            if rng.random() < data["risk"]:
                failed.add(frozenset((u, v)))

        scenarios.append(failed)

    return scenarios


def accessible_population(graph, failed_edges, protected_edges):
    """Count village population with a route to either hospital."""

    # Artificial population values for this toy example.
    populations = {
        "Village_A": 500,
        "Village_B": 400,
    }
    hospitals = {"Hospital_A", "Hospital_B"}

    usable = nx.Graph()
    usable.add_nodes_from(graph.nodes)

    for u, v, data in graph.edges(data=True):
        edge_id = frozenset((u, v))
        failed = edge_id in failed_edges

        if failed and edge_id not in protected_edges:
            continue

        usable.add_edge(u, v)

    total = 0

    for village, population in populations.items():
        if any(
            nx.has_path(usable, village, hospital)
            for hospital in hospitals
        ):
            total += population

    return total


def strategy_edges(graph, strategy, rng):
    edges = list(graph.edges(data=True))
    costs = {frozenset((u, v)): data["cost"] for u, v, data in edges}
    selected = set()
    remaining = BUDGET

    if strategy == "No protection":
        return selected

    if strategy == "Random":
        candidates = [frozenset((u, v)) for u, v, _ in edges]
        rng.shuffle(candidates)

        for edge in candidates:
            if costs[edge] <= remaining:
                selected.add(edge)
                remaining -= costs[edge]

        return selected

    if strategy == "Betweenness":
        centrality = nx.edge_betweenness_centrality(graph, weight=None)
        ranked = sorted(
            centrality,
            key=lambda edge: centrality[edge],
            reverse=True,
        )
        candidates = [frozenset(edge) for edge in ranked]

    elif strategy == "Risk-aware greedy":
        # Select the affordable edge with the highest risk reduction
        # per cost unit. This is a heuristic, not a global optimum.
        candidates = [
            frozenset((u, v))
            for u, v, data in edges
        ]
        candidates.sort(
            key=lambda edge: (
                graph.edges[tuple(edge)]["risk"]
                * (1 - graph.edges[tuple(edge)]["residual_multiplier"])
                / graph.edges[tuple(edge)]["cost"]
            ),
            reverse=True,
        )

    else:
        raise ValueError(f"Unknown strategy: {strategy}")

    for edge in candidates:
        if costs[edge] <= remaining:
            selected.add(edge)
            remaining -= costs[edge]

    return selected


def evaluate_strategy(graph, scenarios, protected_edges):
    totals = [
        accessible_population(graph, failed, protected_edges)
        for failed in scenarios
    ]
    return float(np.mean(totals))


def main():
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(SEED)
    graph = build_demo_graph()
    scenarios = create_scenarios(graph, N_SCENARIOS, rng)

    strategies = [
        "No protection",
        "Random",
        "Betweenness",
        "Risk-aware greedy",
    ]

    rows = []

    for strategy in strategies:
        protected = strategy_edges(graph, strategy, rng)
        score = evaluate_strategy(graph, scenarios, protected)
        total_cost = sum(
            graph.edges[tuple(edge)]["cost"]
            for edge in protected
        )

        rows.append({
            "strategy": strategy,
            "budget": BUDGET,
            "protection_cost": total_cost,
            "protected_edges": len(protected),
            "mean_accessible_population": score,
        })

    results = pd.DataFrame(rows)
    results.to_csv(output_dir / "optimization_comparison.csv", index=False)

    # Plot the comparison
    plt.figure(figsize=(9, 5))
    plt.bar(
        results["strategy"],
        results["mean_accessible_population"],
    )
    plt.ylabel("Mean population with hospital access")
    plt.title("Toy Road Network: Protection Strategy Comparison")
    plt.xticks(rotation=20, ha="right")
    plt.tight_layout()
    plt.savefig(output_dir / "strategy_comparison.png", dpi=200)
    plt.close()

    # Draw the artificial graph
    positions = nx.get_node_attributes(graph, "pos")
    plt.figure(figsize=(9, 5))
    nx.draw(
        graph,
        positions,
        with_labels=True,
        node_size=1800,
        font_size=8,
    )
    plt.title("Artificial Road Network")
    plt.tight_layout()
    plt.savefig(output_dir / "toy_road_graph.png", dpi=200)
    plt.close()

    assumptions = {
        "data_type": "artificial demonstration network",
        "budget_units": BUDGET,
        "number_of_scenarios": N_SCENARIOS,
        "seed": SEED,
        "failure_probabilities": "assumed, not estimated from real data",
        "population": "assumed, not census data",
        "limitations": [
            "Not a real Sri Lankan road network",
            "Not a real hospital accessibility estimate",
            "Greedy and centrality methods are heuristics",
            "The global optimum has not been computed",
            "Protection costs and residual risk are illustrative",
        ],
    }

    with open(
        output_dir / "optimization_assumptions.json",
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(assumptions, f, indent=2)

    print("\nStrategy comparison:")
    print(results.to_string(index=False))
    print("\nResults saved in the outputs folder.")
    print("WARNING: All network inputs are artificial.")


if __name__ == "__main__":
    main()
