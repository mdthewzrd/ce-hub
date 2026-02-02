"""
LangGraph Workflow State
State management for Press Agent multi-agent workflow
"""
from typing import TypedDict, List, Dict, Any, Optional
from typing_extensions import Annotated
from langgraph.graph import add_messages


class PressGraphState(TypedDict):
    """
    Main state object for Press Agent LangGraph workflow.
    Flows through Onboarding → Writer → Editor → QA agents.
    """

    # Identifiers
    request_id: str
    client_id: str

    # Workflow status
    onboarding_complete: bool
    current_agent: str  # onboarding, writer, editor, qa, finalize
    workflow_step: str  # Current step in the process

    # Collected information
    collected_info: Dict[str, Any]  # All data gathered during onboarding
    brand_voice: Dict[str, Any]  # Retrieved or constructed brand voice

    # Press release content
    press_release: Dict[str, Any]  # Generated article (headline, body, etc.)
    research_data: Dict[str, Any]  # Research gathered during writing

    # Quality assessment
    qa_report: Dict[str, Any]  # Quality check results
    quality_score: float  # Overall quality 0-100
    plagiarism_score: float  # 0-100 (lower is better)
    ai_detection_score: float  # 0-100 (lower is better)

    # Approval and delivery
    approved: bool  # Final approval flag
    approved_by: Optional[str]  # Who approved (client/team)
    approved_at: Optional[str]  # Approval timestamp

    # Tracking
    messages: Annotated[List, add_messages]  # LangGraph message history
    tokens_used: int  # Total tokens consumed
    cost_usd: float  # Total cost in USD

    # Errors and retries
    errors: List[str]  # Error messages
    retry_count: int  # Number of retries
    max_retries: int  # Maximum retry attempts

    # Timestamps
    started_at: str  # Workflow start time
    completed_at: Optional[str]  # Workflow completion time


def create_initial_state(
    request_id: str,
    client_id: str,
) -> PressGraphState:
    """
    Create initial state for a new press request workflow

    Args:
        request_id: Press request identifier
        client_id: Client identifier

    Returns:
        Initial workflow state
    """
    from datetime import datetime

    return {
        "request_id": request_id,
        "client_id": client_id,
        "onboarding_complete": False,
        "current_agent": "onboarding",
        "workflow_step": "initialize",
        "collected_info": {},
        "brand_voice": {},
        "press_release": {},
        "research_data": {},
        "qa_report": {},
        "quality_score": 0.0,
        "plagiarism_score": 100.0,
        "ai_detection_score": 100.0,
        "approved": False,
        "approved_by": None,
        "approved_at": None,
        "messages": [],
        "tokens_used": 0,
        "cost_usd": 0.0,
        "errors": [],
        "retry_count": 0,
        "max_retries": 3,
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
    }


def state_to_dict(state: PressGraphState) -> Dict[str, Any]:
    """Convert state to serializable dictionary"""
    return {
        "request_id": state["request_id"],
        "client_id": state["client_id"],
        "onboarding_complete": state["onboarding_complete"],
        "current_agent": state["current_agent"],
        "workflow_step": state["workflow_step"],
        "collected_info": state["collected_info"],
        "brand_voice": state["brand_voice"],
        "press_release": state["press_release"],
        "research_data": state["research_data"],
        "qa_report": state["qa_report"],
        "quality_score": state["quality_score"],
        "plagiarism_score": state["plagiarism_score"],
        "ai_detection_score": state["ai_detection_score"],
        "approved": state["approved"],
        "approved_by": state["approved_by"],
        "approved_at": state["approved_at"],
        "tokens_used": state["tokens_used"],
        "cost_usd": float(state["cost_usd"]),
        "errors": state["errors"],
        "retry_count": state["retry_count"],
        "started_at": state["started_at"],
        "completed_at": state["completed_at"],
    }
