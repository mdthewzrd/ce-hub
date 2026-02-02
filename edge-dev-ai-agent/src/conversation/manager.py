"""
Conversation Manager

Manages chat sessions, message history, and provides a unified interface
for interacting with the EdgeDev AI Agent system.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from ..llm.openrouter_client import Message
from ..agents.orchestrator import OrchestratorAgent, create_orchestrator
from ..agents.scanner_builder import create_scanner_builder
from ..agents.strategy_builder import create_strategy_builder
from ..agents.backtest_builder import create_backtest_builder
from ..agents.optimizer import create_optimizer
from ..agents.validator import create_validator
from ..agents.trading_advisor import create_trading_advisor
from ..learning.extractor import LearningExtractor, ResultLogger, WorkflowLog
from ..learning.memory import MemoryManager, SessionPersistence


class SessionStatus(Enum):
    """Status of a conversation session."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    ERROR = "error"


@dataclass
class ConversationSession:
    """A conversation session with the AI agent."""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    status: SessionStatus = SessionStatus.ACTIVE
    messages: List[Message] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to the session."""
        self.messages.append(Message(
            role=role,
            content=content,
            metadata=metadata or {}
        ))
        self.updated_at = datetime.now()

    def get_recent_messages(self, count: int = 10) -> List[Message]:
        """Get recent messages."""
        return self.messages[-count:]


class ConversationManager:
    """Manages conversation sessions and orchestrator interactions."""

    def __init__(
        self,
        orchestrator: Optional[OrchestratorAgent] = None,
        max_sessions: int = 100
    ):
        """Initialize conversation manager.

        Args:
            orchestrator: Orchestrator agent (creates default if None)
            max_sessions: Maximum number of active sessions to maintain
        """
        self.orchestrator = orchestrator or self._create_default_orchestrator()
        self.max_sessions = max_sessions
        self.sessions: Dict[str, ConversationSession] = {}
        self.current_session_id: Optional[str] = None

        # Learning system components
        self.learning_extractor = LearningExtractor()
        self.result_logger = ResultLogger()
        self.memory_manager = MemoryManager()
        self.session_persistence = SessionPersistence()

    def _create_default_orchestrator(self) -> OrchestratorAgent:
        """Create default orchestrator with available subagents."""
        # Create all subagents
        subagents = {
            "scanner_builder": create_scanner_builder(),
            "strategy_builder": create_strategy_builder(),
            "backtest_builder": create_backtest_builder(),
            "optimizer": create_optimizer(),
            "validator": create_validator(),
            "trading_advisor": create_trading_advisor(),
        }

        return create_orchestrator(subagents=subagents)

    def create_session(self, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Create a new conversation session.

        Args:
            metadata: Optional metadata for the session

        Returns:
            Session ID
        """
        # Enforce max sessions limit
        if len(self.sessions) >= self.max_sessions:
            self._archive_oldest_session()

        session = ConversationSession(metadata=metadata or {})
        self.sessions[session.session_id] = session
        self.current_session_id = session.session_id

        return session.session_id

    def get_session(self, session_id: str) -> Optional[ConversationSession]:
        """Get a session by ID."""
        return self.sessions.get(session_id)

    def get_current_session(self) -> Optional[ConversationSession]:
        """Get the current active session."""
        if self.current_session_id:
            return self.sessions.get(self.current_session_id)
        return None

    def _archive_oldest_session(self):
        """Archive the oldest session when limit is reached."""
        oldest = min(
            self.sessions.items(),
            key=lambda x: x[1].created_at
        )
        oldest[1].status = SessionStatus.ARCHIVED

    async def send_message(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a message and get response.

        Args:
            message: User message
            session_id: Session ID (uses current if None)

        Returns:
            Response dict with session_id, response, metadata
        """
        # Use current session if not specified
        if session_id is None:
            session_id = self.current_session_id

        # Create session if needed
        if session_id is None:
            session_id = self.create_session()
        elif session_id not in self.sessions:
            self.create_session()
            session_id = self.current_session_id

        session = self.sessions[session_id]

        # Add user message to session
        session.add_message("user", message)

        # Get conversation history for context
        context = {
            "conversation_history": session.get_recent_messages(),
        }

        # Get response from orchestrator
        try:
            response = await self.orchestrator.chat(
                message=message,
                conversation_history=context["conversation_history"]
            )

            # Add assistant response to session
            session.add_message("assistant", response)

            # Log to learning system
            self._log_workflow(session_id, message, response, "success")

            return {
                "session_id": session_id,
                "response": response,
                "status": "success",
            }

        except Exception as e:
            error_msg = f"Error processing request: {str(e)}"
            session.status = SessionStatus.ERROR
            session.metadata["error"] = str(e)

            return {
                "session_id": session_id,
                "response": error_msg,
                "status": "error",
                "error": str(e),
            }

    def get_session_history(
        self,
        session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get message history for a session.

        Args:
            session_id: Session ID (uses current if None)

        Returns:
            List of message dicts
        """
        if session_id is None:
            session_id = self.current_session_id

        session = self.sessions.get(session_id)
        if not session:
            return []

        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.metadata.get("timestamp"),
            }
            for msg in session.messages
        ]

    def _log_workflow(
        self,
        session_id: str,
        user_request: str,
        agent_response: str,
        outcome: str
    ):
        """Log a completed workflow to the learning system.

        Args:
            session_id: Session ID
            user_request: Original user request
            agent_response: Agent's response
            outcome: Outcome of the workflow
        """
        # Determine which agent was used
        agent_used = "orchestrator"  # Default

        # Try to determine which subagent handled this
        response_lower = agent_response.lower()
        for agent in ["scanner_builder", "strategy_builder", "backtest_builder",
                     "optimizer", "validator", "trading_advisor"]:
            if agent.replace("_", " ") in response_lower:
                agent_used = agent
                break

        # Check if code was generated
        from ..code.generator import CodeExtractor
        extractor = CodeExtractor()
        parsed = extractor.parse_agent_response(agent_response)
        code_generated = parsed["has_code"]

        # Create workflow log
        workflow = WorkflowLog(
            session_id=session_id,
            timestamp=datetime.now().isoformat(),
            user_request=user_request[:200],  # Truncate if needed
            agent_used=agent_used,
            outcome=outcome,
            code_generated=code_generated,
            code_validated=False,  # Would need actual validation
            learnings=[],  # Will be extracted
            tags=self._extract_tags_from_conversation(user_request, agent_response),
            metrics={}
        )

        # Log to result logger
        self.result_logger.log_workflow(workflow)

    def _extract_tags_from_conversation(
        self,
        user_request: str,
        agent_response: str
    ) -> List[str]:
        """Extract tags from conversation.

        Args:
            user_request: User's request
            agent_response: Agent's response

        Returns:
            List of tags
        """
        combined = f"{user_request} {agent_response}".lower()

        tags = []

        # Common trading tags
        tag_keywords = {
            "scanner": ["scanner", "scan", "screen", "detect"],
            "backtest": ["backtest", "validate", "test", "performance"],
            "strategy": ["strategy", "execution", "rules"],
            "v31": ["v31", "pipeline", "stages"],
            "mean_reversion": ["mean reversion", "reversal"],
            "momentum": ["momentum", "breakout", "trend"],
            "optimization": ["optim", "tune", "improve"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in combined for kw in keywords):
                tags.append(tag)

        return list(set(tags))  # Remove duplicates

    def clear_session(self, session_id: Optional[str] = None):
        """Clear messages from a session.

        Args:
            session_id: Session ID (uses current if None)
        """
        if session_id is None:
            session_id = self.current_session_id

        if session_id in self.sessions:
            self.sessions[session_id].messages = []
            self.sessions[session_id].updated_at = datetime.now()

    def delete_session(self, session_id: str):
        """Delete a session.

        Args:
            session_id: Session ID to delete
        """
        if session_id in self.sessions:
            del self.sessions[session_id]

        if self.current_session_id == session_id:
            self.current_session_id = None

    def get_status(self) -> Dict[str, Any]:
        """Get manager status."""
        return {
            "total_sessions": len(self.sessions),
            "active_sessions": sum(
                1 for s in self.sessions.values()
                if s.status == SessionStatus.ACTIVE
            ),
            "current_session": self.current_session_id,
            "orchestrator_status": self.orchestrator.get_status(),
        }

    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all sessions.

        Returns:
            List of session summary dicts
        """
        return [
            {
                "session_id": s.session_id,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
                "status": s.status.value,
                "message_count": len(s.messages),
                "metadata": s.metadata,
            }
            for s in sorted(
                self.sessions.values(),
                key=lambda x: x.updated_at,
                reverse=True
            )
        ]
