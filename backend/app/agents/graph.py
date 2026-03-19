from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.agents.nodes.competitor import competitor_node
from app.agents.nodes.explainer import explainer_node
from app.agents.nodes.fetcher import fetcher_node
from app.agents.nodes.footfall import footfall_node
from app.agents.nodes.scoring import scoring_node
from app.agents.nodes.transit import transit_node
from app.agents.state import PipelineState


def route_enrichment(state: PipelineState) -> list[Send]:
    """Fan out to all enrichment nodes in parallel."""
    return [
        Send("footfall", state),
        Send("competitor", state),
        Send("transit", state),
    ]


def build_graph() -> object:
    """Build and compile the LangGraph search pipeline.

    Flow: fetcher → [footfall, competitor, transit] (parallel) → scoring → explainer
    """
    graph = StateGraph(PipelineState)

    # Add all nodes
    graph.add_node("fetcher", fetcher_node)
    graph.add_node("footfall", footfall_node)
    graph.add_node("competitor", competitor_node)
    graph.add_node("transit", transit_node)
    graph.add_node("scoring", scoring_node)
    graph.add_node("explainer", explainer_node)

    # Entry: START → fetcher
    graph.add_edge(START, "fetcher")

    # Fetcher fans out to 3 enrichment nodes in parallel
    graph.add_conditional_edges(
        "fetcher",
        route_enrichment,
        ["footfall", "competitor", "transit"],
    )

    # All enrichment nodes converge to scoring
    graph.add_edge("footfall", "scoring")
    graph.add_edge("competitor", "scoring")
    graph.add_edge("transit", "scoring")

    # Scoring → explainer → END
    graph.add_edge("scoring", "explainer")
    graph.add_edge("explainer", END)

    return graph.compile()


pipeline = build_graph()
