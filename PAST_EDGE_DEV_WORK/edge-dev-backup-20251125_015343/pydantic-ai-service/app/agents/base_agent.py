"""
Base agent class for PydanticAI integration
Provides common functionality for all trading agents
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging
from pydantic_ai import Agent
from pydantic import BaseModel

from app.core.config import settings
from app.models.schemas import WebSocketMessage, AgentType

logger = logging.getLogger(__name__)


class AgentState(BaseModel):
    """Base state model for agents"""
    initialized: bool = False
    last_activity: Optional[datetime] = None
    error_count: int = 0
    total_requests: int = 0
    performance_metrics: Dict[str, float] = {}


class BaseAgent(ABC):
    """
    Base class for all PydanticAI trading agents
    Provides common functionality and interface
    """

    def __init__(self, agent_type: AgentType, model: str = None):
        self.agent_type = agent_type
        self.model = model or settings.AGENT_MODEL
        self.state = AgentState()
        self.logger = logging.getLogger(f"{__name__}.{agent_type.value}")

        # Initialize PydanticAI agent (will be set up in child classes)
        self.pydantic_agent: Optional[Agent] = None

        self.logger.info(f"Initializing {agent_type.value} agent with model: {self.model}")

    async def initialize(self) -> bool:
        """
        Initialize the agent and its PydanticAI instance
        Must be implemented by child classes
        """
        try:
            await self._setup_pydantic_agent()
            self.state.initialized = True
            self.state.last_activity = datetime.utcnow()
            self.logger.info(f"✅ {self.agent_type.value} agent initialized successfully")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize {self.agent_type.value} agent: {str(e)}")
            self.state.error_count += 1
            return False

    @abstractmethod
    async def _setup_pydantic_agent(self):
        """Setup the PydanticAI agent - must be implemented by child classes"""
        pass

    async def _update_activity(self):
        """Update agent activity tracking"""
        self.state.last_activity = datetime.utcnow()
        self.state.total_requests += 1

    async def _handle_error(self, error: Exception, context: str = ""):
        """Handle and log errors consistently"""
        self.state.error_count += 1
        error_msg = f"Error in {self.agent_type.value} {context}: {str(error)}"
        self.logger.error(error_msg)

        # Update performance metrics
        if 'error_rate' not in self.state.performance_metrics:
            self.state.performance_metrics['error_rate'] = 0.0

        self.state.performance_metrics['error_rate'] = (
            self.state.error_count / max(self.state.total_requests, 1) * 100
        )

    def is_ready(self) -> bool:
        """Check if agent is ready to handle requests"""
        return self.state.initialized and self.pydantic_agent is not None

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the AI model being used"""
        return {
            "model": self.model,
            "provider": "openai" if "gpt" in self.model else "anthropic",
            "temperature": settings.AGENT_TEMPERATURE,
            "max_tokens": settings.MAX_TOKENS
        }

    def get_last_activity(self) -> Optional[datetime]:
        """Get timestamp of last activity"""
        return self.state.last_activity

    def get_performance_metrics(self) -> Dict[str, float]:
        """Get performance metrics for the agent"""
        return {
            **self.state.performance_metrics,
            "total_requests": float(self.state.total_requests),
            "error_count": float(self.state.error_count),
            "uptime_hours": self._get_uptime_hours()
        }

    def _get_uptime_hours(self) -> float:
        """Calculate uptime in hours"""
        if not self.state.last_activity:
            return 0.0
        return (datetime.utcnow() - self.state.last_activity).total_seconds() / 3600

    async def handle_websocket_message(self, message: WebSocketMessage) -> Dict[str, Any]:
        """
        Handle WebSocket messages - can be overridden by child classes
        """
        await self._update_activity()

        try:
            # Default implementation - delegate to specific method based on message type
            if message.type.value == "scan_creation":
                return await self._handle_scan_creation_ws(message.data)
            elif message.type.value == "backtest_generation":
                return await self._handle_backtest_generation_ws(message.data)
            elif message.type.value == "parameter_optimization":
                return await self._handle_parameter_optimization_ws(message.data)
            elif message.type.value == "pattern_analysis":
                return await self._handle_pattern_analysis_ws(message.data)
            else:
                return {
                    "type": "error",
                    "message": f"Unsupported message type: {message.type}",
                    "agent": self.agent_type.value
                }

        except Exception as e:
            await self._handle_error(e, "WebSocket message handling")
            return {
                "type": "error",
                "message": str(e),
                "agent": self.agent_type.value
            }

    async def _handle_scan_creation_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scan creation WebSocket messages - override in child classes"""
        return {
            "type": "error",
            "message": f"Scan creation not supported by {self.agent_type.value}"
        }

    async def _handle_backtest_generation_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle backtest generation WebSocket messages - override in child classes"""
        return {
            "type": "error",
            "message": f"Backtest generation not supported by {self.agent_type.value}"
        }

    async def _handle_parameter_optimization_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle parameter optimization WebSocket messages - override in child classes"""
        return {
            "type": "error",
            "message": f"Parameter optimization not supported by {self.agent_type.value}"
        }

    async def _handle_pattern_analysis_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern analysis WebSocket messages - override in child classes"""
        return {
            "type": "error",
            "message": f"Pattern analysis not supported by {self.agent_type.value}"
        }

    def get_status_summary(self) -> Dict[str, Any]:
        """Get a summary of the agent's current status"""
        return {
            "agent_type": self.agent_type.value,
            "ready": self.is_ready(),
            "model_info": self.get_model_info(),
            "last_activity": self.get_last_activity(),
            "performance_metrics": self.get_performance_metrics(),
            "state": {
                "initialized": self.state.initialized,
                "error_count": self.state.error_count,
                "total_requests": self.state.total_requests
            }
        }

    async def shutdown(self):
        """Cleanup resources when shutting down"""
        self.logger.info(f"Shutting down {self.agent_type.value} agent")
        self.state.initialized = False
        # Child classes can override to add specific cleanup