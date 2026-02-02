"""
LangGraph Workflow - Press Agent Production Pipeline
Orchestrates the multi-agent workflow for press release creation
"""
from typing import Dict, Any, Optional, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .workflow_state import PressGraphState, create_initial_state
from ..agents.onboarding_agent import OnboardingAgent
from ..agents.writer_agent import WriterAgent
from ..agents.editor_agent import EditorAgent
from ..agents.qa_agent import QAAgent
from ..core.config import settings


class PressAgentWorkflow:
    """
    Main workflow orchestration for press release production.
    Coordinates Onboarding → Writer → Editor → QA agents.
    """

    def __init__(self):
        """Initialize the workflow with all agents"""
        self.onboarding_agent = OnboardingAgent()
        self.writer_agent = WriterAgent()
        self.editor_agent = EditorAgent()
        self.qa_agent = QAAgent()

        # Build the workflow graph
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state machine"""
        workflow = StateGraph(PressGraphState)

        # Add nodes for each agent
        workflow.add_node("onboarding", self._onboarding_node)
        workflow.add_node("writer", self._writer_node)
        workflow.add_node("editor", self._editor_node)
        workflow.add_node("qa", self._qa_node)
        workflow.add_node("finalize", self._finalize_node)
        workflow.add_node("error_handler", self._error_handler_node)

        # Set entry point
        workflow.set_entry_point("onboarding")

        # Define conditional edges based on workflow step
        workflow.add_conditional_edges(
            "onboarding",
            self._route_from_onboarding,
            {
                "writer": "writer",
                "continue_onboarding": "onboarding",
                "error": "error_handler",
            }
        )

        workflow.add_conditional_edges(
            "writer",
            self._route_from_writer,
            {
                "editor": "editor",
                "error": "error_handler",
            }
        )

        workflow.add_conditional_edges(
            "editor",
            self._route_from_editor,
            {
                "qa": "qa",
                "writer": "writer",  # Back to writer for major revision
                "editor": "editor",  # Another editorial pass
                "error": "error_handler",
            }
        )

        workflow.add_conditional_edges(
            "qa",
            self._route_from_qa,
            {
                "finalize": "finalize",
                "writer": "writer",  # Back to writer for revision
                "editor": "editor",  # To editor for fixes
                "error": "error_handler",
            }
        )

        # Finalize and error always end
        workflow.add_edge("finalize", END)
        workflow.add_edge("error_handler", END)

        # Compile with memory for checkpointing
        memory = MemorySaver()
        return workflow.compile(checkpointer=memory)

    # Node functions

    async def _onboarding_node(
        self,
        state: PressGraphState,
    ) -> PressGraphState:
        """Onboarding agent node"""
        try:
            input_data = {
                "message": state.get("user_message", ""),
                "conversation_history": state.get("messages", []),
            }

            new_state = await self.onboarding_agent.execute(state, input_data)

            # Track tokens and cost
            self._track_agent_metrics(state, "onboarding")

            return new_state

        except Exception as e:
            state["errors"].append(f"Onboarding error: {str(e)}")
            state["workflow_step"] = "error"
            return state

    async def _writer_node(
        self,
        state: PressGraphState,
    ) -> PressGraphState:
        """Writer agent node"""
        try:
            input_data = {
                "onboarding_data": state.get("collected_info", {}),
            }

            new_state = await self.writer_agent.execute(state, input_data)
            self._track_agent_metrics(state, "writer")
            return new_state

        except Exception as e:
            state["errors"].append(f"Writer error: {str(e)}")
            state["workflow_step"] = "error"
            return state

    async def _editor_node(
        self,
        state: PressGraphState,
    ) -> PressGraphState:
        """Editor agent node"""
        try:
            input_data = {
                "press_release": state.get("press_release", {}),
                "action": "review",
            }

            # Check if we need revision instead
            if state.get("editor_revision_needed"):
                input_data["action"] = "create_revision"
                input_data["review_feedback"] = state.get("editor_review", {})

            new_state = await self.editor_agent.execute(state, input_data)
            self._track_agent_metrics(state, "editor")
            return new_state

        except Exception as e:
            state["errors"].append(f"Editor error: {str(e)}")
            state["workflow_step"] = "error"
            return state

    async def _qa_node(
        self,
        state: PressGraphState,
    ) -> PressGraphState:
        """QA agent node"""
        try:
            input_data = {
                "press_release": state.get("press_release", {}),
            }

            new_state = await self.qa_agent.execute(state, input_data)
            self._track_agent_metrics(state, "qa")

            # Update approval status
            if new_state.get("workflow_step") == "qa_passed":
                new_state["approved"] = True

            return new_state

        except Exception as e:
            state["errors"].append(f"QA error: {str(e)}")
            state["workflow_step"] = "error"
            return state

    async def _finalize_node(
        self,
        state: PressGraphState,
    ) -> PressGraphState:
        """Finalize node - mark workflow complete"""
        from datetime import datetime

        state["completed_at"] = datetime.utcnow().isoformat()
        state["workflow_step"] = "completed"
        state["current_agent"] = "finalize"

        # Store to Archon for learning
        await self._store_to_archon(state)

        return state

    async def _error_handler_node(
        self,
        state: PressGraphState,
    ) -> PressGraphState:
        """Error handler node"""
        state["workflow_step"] = "failed"
        state["current_agent"] = "error_handler"

        # Check if we should retry
        if state["retry_count"] < state["max_retries"]:
            state["retry_count"] += 1
            # Route back to the last successful step
            last_success = self._get_last_successful_step(state)
            state["workflow_step"] = last_success

        return state

    # Routing functions

    def _route_from_onboarding(
        self,
        state: PressGraphState,
    ) -> Literal["writer", "continue_onboarding", "error"]:
        """Route after onboarding"""
        if "error" in state.get("workflow_step", ""):
            return "error"
        if state.get("onboarding_complete"):
            return "writer"
        return "continue_onboarding"

    def _route_from_writer(
        self,
        state: PressGraphState,
    ) -> Literal["editor", "error"]:
        """Route after writer"""
        if "error" in state.get("workflow_step", ""):
            return "error"
        return "editor"

    def _route_from_editor(
        self,
        state: PressGraphState,
    ) -> Literal["qa", "writer", "editor", "error"]:
        """Route after editor"""
        if "error" in state.get("workflow_step", ""):
            return "error"

        workflow_step = state.get("workflow_step", "")

        if workflow_step == "editor_revision_needed":
            # Check revision severity
            review = state.get("editor_review", {})
            issues = len(review.get("issues_found", []))

            if issues > 5:
                return "writer"  # Major revision needed
            return "editor"  # Minor fixes

        return "qa"

    def _route_from_qa(
        self,
        state: PressGraphState,
    ) -> Literal["finalize", "writer", "editor", "error"]:
        """Route after QA"""
        if "error" in state.get("workflow_step", ""):
            return "error"

        if not state.get("passed", False):
            # Determine what needs fixing based on QA report
            qa_report = state.get("qa_report", {})
            checks = qa_report.get("checks", {})

            # Grammar or AP style issues -> Editor
            if not checks.get("grammar", {}).get("passed", True):
                return "editor"
            if not checks.get("ap_style", {}).get("passed", True):
                return "editor"

            # Content quality issues -> Writer
            if not checks.get("journalistic_quality", {}).get("passed", True):
                return "writer"

            # Readability -> Editor
            if not checks.get("readability", {}).get("passed", True):
                return "editor"

        return "finalize"

    # Helper functions

    def _track_agent_metrics(
        self,
        state: PressGraphState,
        agent_name: str,
    ) -> None:
        """Track tokens and cost for an agent"""
        agent = getattr(self, f"{agent_name}_agent", None)
        if agent:
            metrics = agent.get_metrics()
            state["tokens_used"] += metrics.get("tokens_used", 0)
            state["cost_usd"] += metrics.get("cost_usd", 0)

    def _get_last_successful_step(self, state: PressGraphState) -> str:
        """Determine the last successful workflow step"""
        if state.get("press_release"):
            return "qa"
        if state.get("collected_info"):
            return "writer"
        return "onboarding"

    async def _store_to_archon(self, state: PressGraphState) -> None:
        """Store completed press release to Archon for learning"""
        try:
            from ..core.archon_client import get_archon_client

            archon = await get_archon_client()

            press_release = state.get("press_release", {})
            qa_report = state.get("qa_report", {})

            await archon.store_completed_article(
                request_id=state["request_id"],
                client_id=state["client_id"],
                headline=press_release.get("headline", ""),
                body_text=press_release.get("full_text", ""),
                quality_metrics={
                    "overall_score": state.get("quality_score", 0),
                    "plagiarism_score": state.get("plagiarism_score", 100),
                    "ai_detection_score": state.get("ai_detection_score", 100),
                    "checks": qa_report.get("checks", {}),
                },
                feedback=state.get("client_feedback"),
            )

        except Exception as e:
            print(f"Failed to store to Archon: {e}")

    # Public API

    async def start_workflow(
        self,
        request_id: str,
        client_id: str,
    ) -> PressGraphState:
        """
        Start a new press release workflow

        Args:
            request_id: Press request ID
            client_id: Client ID

        Returns:
            Initial workflow state
        """
        return create_initial_state(request_id, client_id)

    async def process_message(
        self,
        state: PressGraphState,
        message: str,
    ) -> PressGraphState:
        """
        Process a user message through the workflow

        Args:
            state: Current workflow state
            message: User message

        Returns:
            Updated workflow state
        """
        state["user_message"] = message

        # Run the workflow graph
        config = {"configurable": {"thread_id": state["request_id"]}}
        result = await self.graph.ainvoke(state, config)

        return result

    async def get_workflow_status(
        self,
        state: PressGraphState,
    ) -> Dict[str, Any]:
        """
        Get current workflow status

        Args:
            state: Current workflow state

        Returns:
            Status summary
        """
        return {
            "request_id": state["request_id"],
            "client_id": state["client_id"],
            "current_agent": state.get("current_agent"),
            "workflow_step": state.get("workflow_step"),
            "onboarding_complete": state.get("onboarding_complete", False),
            "approved": state.get("approved", False),
            "quality_score": state.get("quality_score", 0),
            "tokens_used": state.get("tokens_used", 0),
            "cost_usd": float(state.get("cost_usd", 0)),
            "errors": state.get("errors", []),
            "started_at": state.get("started_at"),
            "completed_at": state.get("completed_at"),
        }

    def get_all_metrics(self) -> Dict[str, Any]:
        """Get metrics from all agents"""
        return {
            "onboarding": self.onboarding_agent.get_metrics(),
            "writer": self.writer_agent.get_metrics(),
            "editor": self.editor_agent.get_metrics(),
            "qa": self.qa_agent.get_metrics(),
            "total": {
                "tokens_used": (
                    self.onboarding_agent.tokens_used
                    + self.writer_agent.tokens_used
                    + self.editor_agent.tokens_used
                    + self.qa_agent.tokens_used
                ),
                "cost_usd": round(
                    self.onboarding_agent.cost_usd
                    + self.writer_agent.cost_usd
                    + self.editor_agent.cost_usd
                    + self.qa_agent.cost_usd,
                    4,
                ),
            },
        }


# Global workflow instance
_press_workflow: Optional[PressAgentWorkflow] = None


def get_press_workflow() -> PressAgentWorkflow:
    """Get or create global workflow instance"""
    global _press_workflow
    if _press_workflow is None:
        _press_workflow = PressAgentWorkflow()
    return _press_workflow
