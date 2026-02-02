"""
Memory Manager

Stores and retrieves conversation history, projects, and context
for the learning system.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, field, asdict


@dataclass
class Project:
    """A trading strategy project."""
    project_id: str
    name: str
    description: str
    created_at: str
    updated_at: str
    scanners: List[str] = field(default_factory=list)
    strategies: List[str] = field(default_factory=list)
    backtests: List[str] = field(default_factory=list)
    results: List[Dict[str, Any]] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class ConversationMemory:
    """Stored conversation with metadata."""
    conversation_id: str
    timestamp: str
    summary: str
    user_goal: str
    outcome: str
    key_learnings: List[str]
    tags: List[str] = field(default_factory=list)
    related_projects: List[str] = field(default_factory=list)
    messages: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class MemoryManager:
    """Manages long-term memory storage and retrieval."""

    def __init__(self, storage_dir: Optional[str] = None):
        """Initialize memory manager.

        Args:
            storage_dir: Directory for memory storage
        """
        self.storage_dir = Path(storage_dir or "memory")
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Subdirectories
        (self.storage_dir / "projects").mkdir(exist_ok=True)
        (self.storage_dir / "conversations").mkdir(exist_ok=True)
        (self.storage_dir / "patterns").mkdir(exist_ok=True)

    def save_project(self, project: Project):
        """Save a project to memory.

        Args:
            project: Project to save
        """
        projects_dir = self.storage_dir / "projects"
        file_path = projects_dir / f"{project.project_id}.json"

        with open(file_path, 'w') as f:
            json.dump(project.to_dict(), f, indent=2)

    def load_project(self, project_id: str) -> Optional[Project]:
        """Load a project from memory.

        Args:
            project_id: Project ID

        Returns:
            Project or None if not found
        """
        projects_dir = self.storage_dir / "projects"
        file_path = projects_dir / f"{project_id}.json"

        if not file_path.exists():
            return None

        with open(file_path, 'r') as f:
            data = json.load(f)

        return Project(**data)

    def list_projects(self, tag: Optional[str] = None) -> List[Project]:
        """List all projects.

        Args:
            tag: Optional tag filter

        Returns:
            List of projects
        """
        projects_dir = self.storage_dir / "projects"
        projects = []

        for file_path in projects_dir.glob("*.json"):
            with open(file_path, 'r') as f:
                data = json.load(f)
                project = Project(**data)

                # Filter by tag
                if tag and tag not in project.tags:
                    continue

                projects.append(project)

        return sorted(projects, key=lambda p: p.updated_at, reverse=True)

    def save_conversation(self, conversation: ConversationMemory):
        """Save a conversation to memory.

        Args:
            conversation: Conversation to save
        """
        conv_dir = self.storage_dir / "conversations"
        file_path = conv_dir / f"{conversation.conversation_id}.json"

        with open(file_path, 'w') as f:
            json.dump(conversation.to_dict(), f, indent=2)

    def load_conversation(self, conversation_id: str) -> Optional[ConversationMemory]:
        """Load a conversation from memory.

        Args:
            conversation_id: Conversation ID

        Returns:
            Conversation or None if not found
        """
        conv_dir = self.storage_dir / "conversations"
        file_path = conv_dir / f"{conversation_id}.json"

        if not file_path.exists():
            return None

        with open(file_path, 'r') as f:
            data = json.load(f)

        return ConversationMemory(**data)

    def search_conversations(
        self,
        query: str,
        tag: Optional[str] = None
    ) -> List[ConversationMemory]:
        """Search conversations by keyword.

        Args:
            query: Search query
            tag: Optional tag filter

        Returns:
            List of matching conversations
        """
        conversations = []
        conv_dir = self.storage_dir / "conversations"

        if not conv_dir.exists():
            return conversations

        query_lower = query.lower()

        for file_path in conv_dir.glob("*.json"):
            with open(file_path, 'r') as f:
                data = json.load(f)

            # Simple keyword search
            text = " ".join([data.get("summary", ""),
                            data.get("user_goal", ""),
                            " ".join(data.get("key_learnings", []))])

            if query_lower in text.lower():
                conv = ConversationMemory(**data)

                # Filter by tag
                if tag and tag not in conv.tags:
                    continue

                conversations.append(conv)

        return conversations

    def get_relevant_context(
        self,
        user_request: str,
        max_results: int = 3
    ) -> List[Dict[str, Any]]:
        """Get relevant past context for a new request.

        Args:
            user_request: Current user request
            max_results: Maximum results to return

        Returns:
            List of relevant context items
        """
        context = []

        # Search related projects
        projects = self.list_projects()
        for project in projects[:max_results]:
            context.append({
                "type": "project",
                "name": project.name,
                "description": project.description,
                "results": project.results,
                "tags": project.tags,
                "updated_at": project.updated_at,
            })

        # Search related conversations
        conversations = self.search_conversations(user_request)
        for conv in conversations[:max_results]:
            context.append({
                "type": "conversation",
                "summary": conv.summary,
                "outcome": conv.outcome,
                "learnings": conv.key_learnings,
                "tags": conv.tags,
                "timestamp": conv.timestamp,
            })

        return context

    def create_project_from_session(
        self,
        session_id: str,
        messages: List[Dict[str, str]],
        name: Optional[str] = None
    ) -> Project:
        """Create a project from a completed session.

        Args:
            session_id: Session ID
            messages: Conversation messages
            name: Optional project name

        Returns:
            Created project
        """
        # Extract project details from conversation
        user_goal = self._extract_user_goal(messages)

        # Generate project ID
        project_id = f"proj_{session_id[:8]}"

        # Create project
        project = Project(
            project_id=project_id,
            name=name or f"Project from {datetime.now().strftime('%Y-%m-%d')}",
            description=user_goal,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=self._extract_tags(messages)
        )

        # Save project
        self.save_project(project)

        return project

    def _extract_user_goal(self, messages: List[Dict[str, str]]) -> str:
        """Extract user's goal from messages."""
        # Get first user message
        for msg in messages:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                # Return first 200 chars
                return content[:200] + "..." if len(content) > 200 else content
        return "Unknown goal"

    def _extract_tags(self, messages: List[Dict[str, str]]) -> List[str]:
        """Extract tags from conversation."""
        all_text = " ".join([m.get("content", "") for m in messages])
        all_text_lower = all_text.lower()

        tags = []

        # Common trading tags
        tag_keywords = {
            "scanner": ["scanner", "scan", "screen"],
            "backtest": ["backtest", "validation", "testing"],
            "mean_reversion": ["mean reversion", "reversal"],
            "momentum": ["momentum", "breakout"],
            "strategy": ["strategy", "execution", "rules"],
            "v31": ["v31", "pipeline", "stages"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in all_text_lower for kw in keywords):
                tags.append(tag)

        return tags


class SessionPersistence:
    """Manages saving and loading of conversation sessions."""

    def __init__(self, persistence_dir: Optional[str] = None):
        """Initialize session persistence.

        Args:
            persistence_dir: Directory for session files
        """
        self.persistence_dir = Path(persistence_dir or "sessions")
        self.persistence_dir.mkdir(parents=True, exist_ok=True)

    def save_session(
        self,
        session_id: str,
        messages: List[Dict[str, str]],
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Save a session to disk.

        Args:
            session_id: Session ID
            messages: Conversation messages
            metadata: Optional metadata
        """
        file_path = self.persistence_dir / f"{session_id}.json"

        data = {
            "session_id": session_id,
            "saved_at": datetime.now().isoformat(),
            "messages": messages,
            "metadata": metadata or {},
        }

        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def load_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load a session from disk.

        Args:
            session_id: Session ID

        Returns:
            Session data or None if not found
        """
        file_path = self.persistence_dir / f"{session_id}.json"

        if not file_path.exists():
            return None

        with open(file_path, 'r') as f:
            return json.load(f)

    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all saved sessions.

        Returns:
            List of session info
        """
        sessions = []

        for file_path in self.persistence_dir.glob("*.json"):
            with open(file_path, 'r') as f:
                data = json.load(f)

            sessions.append({
                "session_id": data["session_id"],
                "saved_at": data["saved_at"],
                "message_count": len(data.get("messages", [])),
                "metadata": data.get("metadata", {}),
            })

        return sorted(sessions, key=lambda s: s["saved_at"], reverse=True)
