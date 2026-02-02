"""
Phase 1: Agent Standardization Framework
PydanticAI-based standardized agent architecture for CE-Hub
"""

from typing import Dict, List, Optional, Any, Union, Callable, Type
from pydantic import BaseModel, Field, validator, Extra, constr
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
from datetime import datetime
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentStatus(str, Enum):
    """Standardized agent status enumeration"""
    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    PAUSED = "paused"

class AgentCapability(str, Enum):
    """Standardized agent capability enumeration"""
    SCANNING = "scanning"
    ANALYSIS = "analysis"
    BACKTESTING = "backtesting"
    EXECUTION = "execution"
    MONITORING = "monitoring"
    OPTIMIZATION = "optimization"

class MessageType(str, Enum):
    """Standardized message types for agent communication"""
    REQUEST = "request"
    RESPONSE = "response"
    ERROR = "error"
    STATUS_UPDATE = "status_update"
    DATA = "data"
    COMMAND = "command"

class QualityMetric(BaseModel):
    """Standardized quality metrics for agent validation"""
    name: str = Field(..., description="Metric name")
    value: float = Field(..., ge=0, le=1, description="Quality score (0-1)")
    threshold: float = Field(..., ge=0, le=1, description="Minimum acceptable threshold")
    description: str = Field(..., description="Metric description")
    measured_at: datetime = Field(default_factory=datetime.now)

class AgentConfiguration(BaseModel):
    """Standardized agent configuration"""
    name: str = Field(..., min_length=1, max_length=100)
    version: str = Field(default="1.0.0", regex=r'^\d+\.\d+\.\d+$')
    capabilities: List[AgentCapability] = Field(default_factory=list)
    max_execution_time: int = Field(default=300, ge=1, le=3600)  # seconds
    retry_attempts: int = Field(default=3, ge=0, le=10)
    quality_threshold: float = Field(default=0.8, ge=0, le=1)
    custom_parameters: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True

class AgentMessage(BaseModel):
    """Standardized agent communication message"""
    id: str = Field(..., description="Unique message identifier")
    type: MessageType = Field(..., description="Message type")
    sender: str = Field(..., description="Sending agent ID")
    receiver: Optional[str] = Field(None, description="Receiving agent ID")
    content: Dict[str, Any] = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now)
    correlation_id: Optional[str] = Field(None, description="Correlation with other messages")
    priority: int = Field(default=5, ge=1, le=10, description="Message priority (1=highest)")

    class Config:
        use_enum_values = True

class AgentResult(BaseModel):
    """Standardized agent execution result"""
    success: bool = Field(..., description="Execution success status")
    data: Optional[Dict[str, Any]] = Field(None, description="Result data")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    execution_time: float = Field(..., ge=0, description="Execution time in seconds")
    quality_metrics: List[QualityMetric] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.now)

    @validator('error_message')
    def validate_error_message(cls, v, values):
        if not values.get('success') and not v:
            raise ValueError('error_message is required when success is False')
        return v

class QualityValidator:
    """Agent quality validation framework"""

    def __init__(self):
        self.metrics: Dict[str, QualityMetric] = {}
        self.validators: Dict[str, Callable] = {}

    def register_metric(self, metric: QualityMetric):
        """Register a quality metric"""
        self.metrics[metric.name] = metric

    def register_validator(self, name: str, validator: Callable):
        """Register a custom validator function"""
        self.validators[name] = validator

    def validate_result(self, result: AgentResult) -> bool:
        """Validate agent result against quality metrics"""
        for metric in result.quality_metrics:
            if metric.value < metric.threshold:
                logger.warning(f"Quality metric {metric.name} failed: {metric.value} < {metric.threshold}")
                return False
        return True

    def calculate_overall_quality(self, result: AgentResult) -> float:
        """Calculate overall quality score from metrics"""
        if not result.quality_metrics:
            return 1.0

        total_score = sum(metric.value for metric in result.quality_metrics)
        return total_score / len(result.quality_metrics)

class StandardizedAgent(ABC):
    """Base class for all standardized agents"""

    def __init__(self, config: AgentConfiguration):
        self.config = config
        self.status = AgentStatus.IDLE
        self.quality_validator = QualityValidator()
        self.execution_history: List[AgentResult] = []
        self.message_handlers: Dict[MessageType, Callable] = {}
        self._setup_quality_metrics()
        self._setup_message_handlers()

    @abstractmethod
    def _setup_quality_metrics(self):
        """Setup agent-specific quality metrics"""
        pass

    @abstractmethod
    def _setup_message_handlers(self):
        """Setup message type handlers"""
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> AgentResult:
        """Execute the agent's primary function"""
        pass

    async def handle_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """Handle incoming messages"""
        handler = self.message_handlers.get(message.type)
        if handler:
            try:
                return await handler(message)
            except Exception as e:
                logger.error(f"Error handling message {message.type}: {e}")
                return self._create_error_response(message, str(e))
        else:
            logger.warning(f"No handler for message type: {message.type}")
            return None

    def _create_error_response(self, original_message: AgentMessage, error: str) -> AgentMessage:
        """Create error response message"""
        return AgentMessage(
            id=f"error_{datetime.now().timestamp()}",
            type=MessageType.ERROR,
            sender=self.config.name,
            receiver=original_message.sender,
            content={"error": error, "original_message_id": original_message.id},
            correlation_id=original_message.correlation_id
        )

    def update_status(self, status: AgentStatus, message: Optional[str] = None):
        """Update agent status"""
        old_status = self.status
        self.status = status
        logger.info(f"Agent {self.config.name} status: {old_status} -> {status}{f' ({message})' if message else ''}")

    def add_quality_metric(self, metric: QualityMetric):
        """Add a quality metric to the validator"""
        self.quality_validator.register_metric(metric)

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get agent performance statistics"""
        if not self.execution_history:
            return {"total_executions": 0}

        successful_executions = [r for r in self.execution_history if r.success]
        avg_execution_time = sum(r.execution_time for r in self.execution_history) / len(self.execution_history)
        avg_quality = sum(self.quality_validator.calculate_overall_quality(r) for r in self.execution_history) / len(self.execution_history)

        return {
            "total_executions": len(self.execution_history),
            "successful_executions": len(successful_executions),
            "success_rate": len(successful_executions) / len(self.execution_history),
            "average_execution_time": avg_execution_time,
            "average_quality_score": avg_quality,
            "current_status": self.status.value
        }

    async def _execute_with_quality_control(self, execution_func: Callable, **kwargs) -> AgentResult:
        """Execute function with quality control and monitoring"""
        start_time = datetime.now()
        self.update_status(AgentStatus.RUNNING)

        try:
            # Execute the agent function
            result = await execution_func(**kwargs)

            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()

            # Ensure result is AgentResult
            if not isinstance(result, AgentResult):
                result = AgentResult(
                    success=True,
                    data=result if isinstance(result, dict) else {"result": result},
                    execution_time=execution_time
                )

            # Validate quality
            quality_score = self.quality_validator.calculate_overall_quality(result)
            is_valid = self.quality_validator.validate_result(result)

            if not is_valid:
                logger.warning(f"Agent {self.config.name} execution failed quality validation")
                result.success = False
                result.error_message = "Quality validation failed"

            # Update status
            if result.success:
                self.update_status(AgentStatus.COMPLETED)
            else:
                self.update_status(AgentStatus.ERROR)

            # Store in history
            self.execution_history.append(result)

            return result

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"Agent {self.config.name} execution failed: {e}")
            logger.error(traceback.format_exc())

            error_result = AgentResult(
                success=False,
                error_message=str(e),
                execution_time=execution_time
            )

            self.update_status(AgentStatus.ERROR)
            self.execution_history.append(error_result)

            return error_result

class AgentRegistry:
    """Registry for managing all standardized agents"""

    def __init__(self):
        self.agents: Dict[str, StandardizedAgent] = {}
        self.agent_types: Dict[str, Type[StandardizedAgent]] = {}

    def register_agent_type(self, agent_type: str, agent_class: Type[StandardizedAgent]):
        """Register an agent type"""
        self.agent_types[agent_type] = agent_class
        logger.info(f"Registered agent type: {agent_type}")

    def create_agent(self, agent_type: str, config: AgentConfiguration) -> StandardizedAgent:
        """Create and register an agent instance"""
        if agent_type not in self.agent_types:
            raise ValueError(f"Unknown agent type: {agent_type}")

        agent_class = self.agent_types[agent_type]
        agent = agent_class(config)
        self.agents[config.name] = agent

        logger.info(f"Created agent: {config.name} (type: {agent_type})")
        return agent

    def get_agent(self, name: str) -> Optional[StandardizedAgent]:
        """Get an agent by name"""
        return self.agents.get(name)

    def get_agents_by_capability(self, capability: AgentCapability) -> List[StandardizedAgent]:
        """Get all agents with a specific capability"""
        return [
            agent for agent in self.agents.values()
            if capability in agent.config.capabilities
        ]

    def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents"""
        return [
            {
                "name": agent.config.name,
                "status": agent.status.value,
                "capabilities": [c.value for c in agent.config.capabilities],
                "version": agent.config.version
            }
            for agent in self.agents.values()
        ]

    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        agent_stats = []
        for agent in self.agents.values():
            stats = agent.get_performance_stats()
            stats["name"] = agent.config.name
            stats["capabilities"] = [c.value for c in agent.config.capabilities]
            agent_stats.append(stats)

        return {
            "total_agents": len(self.agents),
            "agent_types": list(self.agent_types.keys()),
            "agents": agent_stats
        }

# Global agent registry instance
agent_registry = AgentRegistry()

# Standard message handling functions
async def handle_status_update(message: AgentMessage) -> Optional[AgentMessage]:
    """Default status update message handler"""
    logger.info(f"Status update: {message.content}")
    return None

async def handle_data_message(message: AgentMessage) -> Optional[AgentMessage]:
    """Default data message handler"""
    logger.info(f"Data message received: {message.content}")
    return None

async def handle_command(message: AgentMessage) -> Optional[AgentMessage]:
    """Default command message handler"""
    logger.info(f"Command received: {message.content}")
    return None

# Standard quality metrics
class StandardQualityMetrics:
    """Standard quality metric definitions"""

    @staticmethod
    def execution_speed_metric(execution_time: float, max_time: float) -> QualityMetric:
        """Calculate execution speed quality metric"""
        score = max(0, 1 - (execution_time / max_time))
        return QualityMetric(
            name="execution_speed",
            value=score,
            threshold=0.7,
            description=f"Execution time: {execution_time:.2f}s (max: {max_time}s)"
        )

    @staticmethod
    def result_completeness_metric(result_data: Dict[str, Any], required_fields: List[str]) -> QualityMetric:
        """Calculate result completeness quality metric"""
        if not result_data:
            return QualityMetric(
                name="result_completeness",
                value=0.0,
                threshold=0.8,
                description="No result data provided"
            )

        present_fields = sum(1 for field in required_fields if field in result_data)
        score = present_fields / len(required_fields)

        return QualityMetric(
            name="result_completeness",
            value=score,
            threshold=0.8,
            description=f"Present fields: {present_fields}/{len(required_fields)}"
        )

    @staticmethod
    def data_quality_metric(data: Any) -> QualityMetric:
        """Calculate data quality metric"""
        score = 0.8  # Default score
        issues = []

        if data is None:
            score = 0.0
            issues.append("Data is None")
        elif isinstance(data, dict) and not data:
            score = 0.5
            issues.append("Data dictionary is empty")
        elif isinstance(data, str) and not data.strip():
            score = 0.3
            issues.append("Data string is empty")

        return QualityMetric(
            name="data_quality",
            value=score,
            threshold=0.6,
            description=f"Data quality score: {score:.2f}" + (f" - {', '.join(issues)}" if issues else "")
        )