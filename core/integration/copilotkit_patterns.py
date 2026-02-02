"""
CopilotKit Integration Patterns
Implementation of AG-UI protocol for agent-user interactions
"""

import asyncio
import json
from typing import Dict, List, Optional, Any, Union, Callable, AsyncGenerator
from dataclasses import dataclass, field
from enum import Enum
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MessageRole(Enum):
    """Roles in agent-user communication"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"
    FUNCTION = "function"

class FrontendToolType(Enum):
    """Types of frontend tools"""
    UI_COMPONENT = "ui_component"
    FORM_UPDATE = "form_update"
    NAVIGATION = "navigation"
    NOTIFICATION = "notification"
    MODAL = "modal"
    DATA_UPDATE = "data_update"

@dataclass
class AGUIMessage:
    """AG-UI protocol message structure"""
    role: MessageRole
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    frontend_tools: List['FrontendTool'] = field(default_factory=list)
    attachments: Dict[str, Any] = field(default_factory=dict)

@dataclass
class FrontendTool:
    """Frontend tool for AG-UI protocol"""
    name: str
    tool_type: FrontendToolType
    parameters: Dict[str, Any] = field(default_factory=dict)
    description: str = ""
    result_path: Optional[str] = None

@dataclass
class SharedState:
    """Shared state between frontend and agent"""
    key: str
    value: Any
    scope: str = "global"  # global, session, user
    timestamp: datetime = field(default_factory=datetime.now)
    ttl: Optional[float] = None  # Time to live in seconds

@dataclass
class CustomEvent:
    """Custom event for AG-UI protocol"""
    event_name: str
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    target: Optional[str] = None  # Target component or agent

class CopilotKitBridge:
    """
    Bridge implementing AG-UI protocol for CE Hub agents
    """

    def __init__(self):
        self.message_history: List[AGUIMessage] = []
        self.shared_state: Dict[str, SharedState] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.frontend_tools: Dict[str, FrontendTool] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.logger = logging.getLogger(__name__)

    def register_frontend_tool(self, tool: FrontendTool):
        """Register a frontend tool for agent use"""
        self.frontend_tools[tool.name] = tool
        self.logger.info(f"Registered frontend tool: {tool.name}")

    def get_frontend_tool(self, tool_name: str) -> Optional[FrontendTool]:
        """Get a frontend tool by name"""
        return self.frontend_tools.get(tool_name)

    def list_frontend_tools(self) -> List[str]:
        """List all registered frontend tools"""
        return list(self.frontend_tools.keys())

    async def create_session(
        self,
        session_id: str,
        user_context: Dict[str, Any] = None,
        initial_state: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create a new AG-UI session

        Args:
            session_id: Unique session identifier
            user_context: User context and preferences
            initial_state: Initial shared state

        Returns:
            Session configuration
        """

        session = {
            "session_id": session_id,
            "created_at": datetime.now(),
            "user_context": user_context or {},
            "active": True,
            "message_count": 0,
            "last_activity": datetime.now()
        }

        self.active_sessions[session_id] = session

        # Initialize shared state
        if initial_state:
            for key, value in initial_state.items():
                self.update_shared_state(key, value, scope="session", session_id=session_id)

        self.logger.info(f"Created AG-UI session: {session_id}")
        return session

    async def send_message(
        self,
        session_id: str,
        role: MessageRole,
        content: str,
        frontend_tools: List[FrontendTool] = None,
        metadata: Dict[str, Any] = None
    ) -> AGUIMessage:
        """
        Send a message through AG-UI protocol

        Args:
            session_id: Target session
            role: Message role
            content: Message content
            frontend_tools: Tools to invoke on frontend
            metadata: Additional metadata

        Returns:
            Created message
        """

        message = AGUIMessage(
            role=role,
            content=content,
            timestamp=datetime.now(),
            metadata=metadata or {},
            frontend_tools=frontend_tools or []
        )

        # Add to history
        self.message_history.append(message)

        # Update session
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["message_count"] += 1
            self.active_sessions[session_id]["last_activity"] = datetime.now()

        self.logger.info(f"Sent message in session {session_id}: {role.value} - {content[:50]}...")
        return message

    async def stream_response(
        self,
        session_id: str,
        content_generator: AsyncGenerator[str, None],
        frontend_tools: List[FrontendTool] = None
    ) -> AsyncGenerator[AGUIMessage, None]:
        """
        Stream a response through AG-UI protocol

        Args:
            session_id: Target session
            content_generator: Async generator of content chunks
            frontend_tools: Tools to invoke on completion

        Yields:
            Progressive messages
        """

        accumulated_content = ""

        async for chunk in content_generator:
            accumulated_content += chunk

            message = AGUIMessage(
                role=MessageRole.ASSISTANT,
                content=accumulated_content,
                timestamp=datetime.now(),
                metadata={"streaming": True, "chunk": True},
                frontend_tools=[]  # Don't send tools until complete
            )

            self.message_history.append(message)
            yield message

        # Send final message with tools
        final_message = AGUIMessage(
            role=MessageRole.ASSISTANT,
            content=accumulated_content,
            timestamp=datetime.now(),
            metadata={"streaming": False, "complete": True},
            frontend_tools=frontend_tools or []
        )

        self.message_history.append(final_message)
        yield final_message

    def update_shared_state(
        self,
        key: str,
        value: Any,
        scope: str = "global",
        session_id: Optional[str] = None,
        ttl: Optional[float] = None
    ):
        """
        Update shared state

        Args:
            key: State key
            value: State value
            scope: State scope (global, session, user)
            session_id: Session ID for session-scoped state
            ttl: Time to live in seconds
        """

        state_key = f"{scope}:{key}"
        if session_id:
            state_key = f"{state_key}:{session_id}"

        self.shared_state[state_key] = SharedState(
            key=key,
            value=value,
            scope=scope,
            ttl=ttl
        )

        # Emit state change event
        self.emit_event("state_changed", {
            "key": key,
            "value": value,
            "scope": scope,
            "session_id": session_id
        })

    def get_shared_state(
        self,
        key: str,
        scope: str = "global",
        session_id: Optional[str] = None,
        default: Any = None
    ) -> Any:
        """Get shared state value"""

        state_key = f"{scope}:{key}"
        if session_id:
            state_key = f"{state_key}:{session_id}"

        state = self.shared_state.get(state_key)

        if not state:
            return default

        # Check TTL
        if state.ttl and (datetime.now() - state.timestamp).total_seconds() > state.ttl:
            del self.shared_state[state_key]
            return default

        return state.value

    def emit_event(self, event_name: str, data: Dict[str, Any], target: Optional[str] = None):
        """Emit a custom event"""

        event = CustomEvent(
            event_name=event_name,
            data=data,
            target=target
        )

        # Trigger handlers
        if event_name in self.event_handlers:
            for handler in self.event_handlers[event_name]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        asyncio.create_task(handler(event))
                    else:
                        handler(event)
                except Exception as e:
                    self.logger.error(f"Error in event handler for {event_name}: {e}")

    def register_event_handler(self, event_name: str, handler: Callable):
        """Register an event handler"""
        if event_name not in self.event_handlers:
            self.event_handlers[event_name] = []
        self.event_handlers[event_name].append(handler)

    async def process_frontend_tool_result(
        self,
        session_id: str,
        tool_name: str,
        result: Dict[str, Any]
    ):
        """
        Process result from frontend tool execution

        Args:
            session_id: Session ID
            tool_name: Name of the tool that was executed
            result: Result data from frontend
        """

        self.logger.info(f"Received frontend tool result: {tool_name} in session {session_id}")

        # Update shared state with result
        self.update_shared_state(
            f"tool_result_{tool_name}",
            result,
            scope="session",
            session_id=session_id
        )

        # Emit tool completion event
        self.emit_event("frontend_tool_completed", {
            "tool_name": tool_name,
            "result": result,
            "session_id": session_id
        })

    def export_session_data(self, session_id: str) -> Dict[str, Any]:
        """Export all data for a session"""

        session_messages = [
            msg for msg in self.message_history
            if session_id in self.active_sessions  # Simplified filtering
        ]

        session_state = {
            key: state.value for key, state in self.shared_state.items()
            if state.scope == "session" or session_id in key
        }

        return {
            "session_id": session_id,
            "session_info": self.active_sessions.get(session_id, {}),
            "messages": [
                {
                    "role": msg.role.value,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "metadata": msg.metadata,
                    "frontend_tools": [
                        {
                            "name": tool.name,
                            "type": tool.tool_type.value,
                            "parameters": tool.parameters,
                            "description": tool.description
                        }
                        for tool in msg.frontend_tools
                    ]
                }
                for msg in session_messages
            ],
            "shared_state": session_state,
            "export_timestamp": datetime.now().isoformat()
        }

class CEHubAgentIntegration:
    """
    Integration layer for CE Hub agents with CopilotKit AG-UI protocol
    """

    def __init__(self, copilotkit_bridge: CopilotKitBridge):
        self.bridge = copilotkit_bridge
        self.agent_sessions: Dict[str, str] = {}  # agent_name -> session_id
        self.logger = logging.getLogger(__name__)

        # Register standard CE Hub frontend tools
        self._register_standard_tools()

    def _register_standard_tools(self):
        """Register standard CE Hub frontend tools"""

        # Component rendering tool
        component_tool = FrontendTool(
            name="render_component",
            tool_type=FrontendToolType.UI_COMPONENT,
            description="Render a UI component with specified properties",
            parameters={
                "component_type": {"type": "string", "required": True},
                "props": {"type": "object", "required": False},
                "animation": {"type": "object", "required": False}
            }
        )
        self.bridge.register_frontend_tool(component_tool)

        # Status update tool
        status_tool = FrontendTool(
            name="update_status",
            tool_type=FrontendToolType.NOTIFICATION,
            description="Update status indicator",
            parameters={
                "status": {"type": "string", "required": True},
                "message": {"type": "string", "required": True},
                "progress": {"type": "number", "required": False}
            }
        )
        self.bridge.register_frontend_tool(status_tool)

        # Form update tool
        form_tool = FrontendTool(
            name="update_form",
            tool_type=FrontendToolType.FORM_UPDATE,
            description="Update form fields and validation",
            parameters={
                "form_id": {"type": "string", "required": True},
                "fields": {"type": "object", "required": True},
                "validation": {"type": "object", "required": False}
            }
        )
        self.bridge.register_frontend_tool(form_tool)

        # Navigation tool
        nav_tool = FrontendTool(
            name="navigate",
            tool_type=FrontendToolType.NAVIGATION,
            description="Navigate to a new view or section",
            parameters={
                "target": {"type": "string", "required": True},
                "params": {"type": "object", "required": False}
            }
        )
        self.bridge.register_frontend_tool(nav_tool)

    async def register_agent_session(
        self,
        agent_name: str,
        user_context: Dict[str, Any] = None
    ) -> str:
        """
        Register a CE Hub agent with CopilotKit session

        Args:
            agent_name: Name of the agent
            user_context: User context and preferences

        Returns:
            Session ID
        """

        session_id = f"cehub_{agent_name}_{int(datetime.now().timestamp())}"

        await self.bridge.create_session(
            session_id=session_id,
            user_context=user_context,
            initial_state={
                "agent_name": agent_name,
                "agent_capabilities": self._get_agent_capabilities(agent_name)
            }
        )

        self.agent_sessions[agent_name] = session_id

        self.logger.info(f"Registered agent {agent_name} with session {session_id}")
        return session_id

    def _get_agent_capabilities(self, agent_name: str) -> List[str]:
        """Get capabilities for an agent"""
        # This would be expanded based on actual agent capabilities
        capabilities = {
            "ce-hub-orchestrator": ["task_coordination", "workflow_management", "agent_routing"],
            "ce-hub-engineer": ["code_generation", "system_design", "technical_analysis"],
            "trading-scanner": ["market_analysis", "pattern_detection", "alert_generation"],
            "quant-backtest": ["strategy_testing", "performance_analysis", "risk_assessment"]
        }

        return capabilities.get(agent_name, ["general_assistance"])

    async def send_agent_message(
        self,
        agent_name: str,
        content: str,
        include_tools: bool = True,
        metadata: Dict[str, Any] = None
    ) -> AGUIMessage:
        """
        Send a message from a CE Hub agent

        Args:
            agent_name: Name of the agent
            content: Message content
            include_tools: Whether to include relevant frontend tools
            metadata: Additional metadata

        Returns:
            Created message
        """

        session_id = self.agent_sessions.get(agent_name)
        if not session_id:
            raise ValueError(f"Agent {agent_name} not registered with session")

        # Determine relevant tools based on content
        frontend_tools = []
        if include_tools:
            frontend_tools = self._infer_frontend_tools(content, agent_name)

        return await self.bridge.send_message(
            session_id=session_id,
            role=MessageRole.ASSISTANT,
            content=content,
            frontend_tools=frontend_tools,
            metadata={
                "agent_name": agent_name,
                **(metadata or {})
            }
        )

    def _infer_frontend_tools(
        self,
        content: str,
        agent_name: str
    ) -> List[FrontendTool]:
        """Infer relevant frontend tools based on content"""

        tools = []

        # Look for component rendering requests
        if "component" in content.lower() or "ui" in content.lower():
            tools.append(self.bridge.get_frontend_tool("render_component"))

        # Look for status updates
        if "status" in content.lower() or "progress" in content.lower():
            tools.append(self.bridge.get_frontend_tool("update_status"))

        # Look for form-related content
        if "form" in content.lower() or "input" in content.lower() or "validation" in content.lower():
            tools.append(self.bridge.get_frontend_tool("update_form"))

        # Look for navigation requests
        if "navigate" in content.lower() or "go to" in content.lower() or "page" in content.lower():
            tools.append(self.bridge.get_frontend_tool("navigate"))

        return [tool for tool in tools if tool is not None]

    async def stream_agent_response(
        self,
        agent_name: str,
        response_generator: AsyncGenerator[str, None]
    ) -> AsyncGenerator[AGUIMessage, None]:
        """
        Stream a response from a CE Hub agent

        Args:
            agent_name: Name of the agent
            response_generator: Async generator of response chunks

        Yields:
            Progressive messages
        """

        session_id = self.agent_sessions.get(agent_name)
        if not session_id:
            raise ValueError(f"Agent {agent_name} not registered with session")

        # Infer tools for final message
        accumulated_content = ""
        async for chunk in response_generator:
            accumulated_content += chunk

        frontend_tools = self._infer_frontend_tools(accumulated_content, agent_name)

        # Stream with final tools
        async for message in self.bridge.stream_response(
            session_id=session_id,
            content_generator=response_generator,
            frontend_tools=frontend_tools
        ):
            yield message

    async def update_agent_state(
        self,
        agent_name: str,
        state_key: str,
        state_value: Any
    ):
        """Update shared state for an agent"""

        session_id = self.agent_sessions.get(agent_name)
        if session_id:
            self.bridge.update_shared_state(
                key=f"agent_{agent_name}_{state_key}",
                value=state_value,
                scope="session",
                session_id=session_id
            )

    def get_agent_session_id(self, agent_name: str) -> Optional[str]:
        """Get session ID for an agent"""
        return self.agent_sessions.get(agent_name)

    def list_active_agents(self) -> List[str]:
        """List all active agents"""
        return list(self.agent_sessions.keys())

# Global instances
default_copilotkit_bridge = CopilotKitBridge()
default_cehub_integration = CEHubAgentIntegration(default_copilotkit_bridge)

# Utility functions
async def register_agent_with_copilotkit(
    agent_name: str,
    user_context: Dict[str, Any] = None
) -> str:
    """Register a CE Hub agent with CopilotKit"""
    return await default_cehub_integration.register_agent_session(agent_name, user_context)

async def send_agent_message_with_ui(
    agent_name: str,
    content: str,
    metadata: Dict[str, Any] = None
) -> AGUIMessage:
    """Send agent message with automatic UI tool inference"""
    return await default_cehub_integration.send_agent_message(
        agent_name, content, include_tools=True, metadata=metadata
   )

async def stream_agent_response_with_ui(
    agent_name: str,
    response_generator: AsyncGenerator[str, None]
) -> AsyncGenerator[AGUIMessage, None]:
    """Stream agent response with UI integration"""
    async for message in default_cehub_integration.stream_agent_response(
        agent_name, response_generator
    ):
        yield message