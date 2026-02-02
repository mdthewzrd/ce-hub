"""
CE Hub Dependencies Framework

This module defines the standard dependencies and context that all CE Hub agents
will receive when using the PydanticAI framework. This ensures consistency
across all agents and provides access to shared resources like the Archon
knowledge base, project context, and validation rules.
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import json
import logging
from pathlib import Path

# Pydantic for type safety
from pydantic import BaseModel, Field, validator
from pydantic_ai import RunContext
from pydantic_ai.tools import Tool


class ProjectType(str, Enum):
    """Types of projects CE Hub handles"""
    WEB_APPLICATION = "web_application"
    MOBILE_APP = "mobile_app"
    API_SERVICE = "api_service"
    DATA_PIPELINE = "data_pipeline"
    TRADING_SYSTEM = "trading_system"
    AUTOMATION_WORKFLOW = "automation_workflow"
    RESEARCH_PROJECT = "research_project"
    UNKNOWN = "unknown"


class TaskPriority(str, Enum):
    """Priority levels for agent tasks"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskComplexity(str, Enum):
    """Complexity levels for task estimation"""
    SIMPLE = "simple"      # 1-2 hours
    MODERATE = "moderate"  # 2-8 hours
    COMPLEX = "complex"    # 8-24 hours
    EXPERT = "expert"      # 24+ hours


class ValidationLevel(str, Enum):
    """Levels of validation strictness"""
    NONE = "none"          # No validation
    BASIC = "basic"        # Basic output validation
    STRICT = "strict"      # Comprehensive validation
    PRODUCTION = "production"  # Production-grade validation


class AgentRole(str, Enum):
    """Standardized agent roles in CE Hub"""
    ORCHESTRATOR = "ce-hub-orchestrator"
    ENGINEER = "ce-hub-engineer"
    GUI_SPECIALIST = "ce-hub-gui-specialist"
    QA_TESTER = "qa-tester"
    DOCUMENTATION_SPECIALIST = "documentation-specialist"
    RESEARCH_INTELLIGENCE = "research-intelligence-specialist"
    TRADING_SCANNER = "trading-scanner-researcher"
    BACKTESTING = "quant-backtest-specialist"
    EDGE_DEVELOPMENT = "edge-development-agent"


class ProjectRequirements(BaseModel):
    """Structured project requirements gathered from user"""
    title: str = Field(..., description="Clear, concise title of the task/project")
    description: str = Field(..., description="Detailed description of what needs to be done")
    success_criteria: List[str] = Field(default_factory=list, description="Specific success criteria")
    technical_constraints: List[str] = Field(default_factory=list, description="Technical limitations or requirements")
    affected_components: List[str] = Field(default_factory=list, description="Codebase components this affects")
    existing_patterns: Optional[str] = Field(None, description="Existing patterns or conventions to follow")
    testing_level: TaskComplexity = Field(TaskComplexity.MODERATE, description="Level of testing required")
    performance_requirements: List[str] = Field(default_factory=list, description="Performance or scalability requirements")
    security_considerations: List[str] = Field(default_factory=list, description="Security requirements")
    deliverables: List[str] = Field(default_factory=list, description="Expected deliverables")
    timeline: Optional[str] = Field(None, description="Expected timeline or deadline")
    stakeholders: List[str] = Field(default_factory=list, description="People who need to review/approve this")

    @validator('success_criteria')
    def validate_success_criteria(cls, v):
        if not v:
            raise ValueError("Success criteria must be specified for clear task completion")
        return v


class TaskContext(BaseModel):
    """Context information for the current task"""
    task_id: str = Field(..., description="Unique identifier for this task")
    parent_task_id: Optional[str] = Field(None, description="Parent task if this is a subtask")
    dependencies: List[str] = Field(default_factory=list, description="Other tasks this depends on")
    subtasks: List[str] = Field(default_factory=list, description="Subtasks that need to be completed")
    previous_attempts: List[Dict[str, Any]] = Field(default_factory=list, description="Previous attempts and their outcomes")
    current_attempt: int = Field(0, description="Current attempt number")
    max_attempts: int = Field(3, description="Maximum allowed attempts")

    class Config:
        # Allow datetime objects
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class ValidationResult(BaseModel):
    """Result of validation checks"""
    is_valid: bool = Field(..., description="Whether the validation passed")
    errors: List[str] = Field(default_factory=list, description="Validation errors encountered")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")
    score: float = Field(0.0, ge=0.0, le=1.0, description="Quality score from 0 to 1")
    metrics: Dict[str, float] = Field(default_factory=dict, description="Detailed quality metrics")

    def add_error(self, error: str):
        """Add an error and mark as invalid"""
        self.errors.append(error)
        self.is_valid = False
        self.score = max(0, self.score - 0.1)

    def add_warning(self, warning: str):
        """Add a warning"""
        self.warnings.append(warning)
        self.score = max(0, self.score - 0.05)


class ValidationRule(BaseModel):
    """A specific validation rule with configuration"""
    name: str = Field(..., description="Name of the validation rule")
    description: str = Field(..., description="What this rule validates")
    enabled: bool = Field(True, description="Whether this rule is active")
    severity: str = Field("warning", description="Error level: error, warning, info")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Rule-specific parameters")
    custom_validator: Optional[str] = Field(None, description="Path to custom validation function")


class ValidationConfig(BaseModel):
    """Configuration for agent validation"""
    level: ValidationLevel = Field(ValidationLevel.BASIC, description="Overall validation strictness")
    rules: Dict[str, ValidationRule] = Field(default_factory=dict, description="Specific validation rules")
    skip_on_retry: bool = Field(True, description="Skip validation on retry attempts")
    fail_fast: bool = Field(False, description="Stop on first validation error")
    auto_fix: bool = Field(False, description="Attempt to automatically fix validation errors")
    timeout: int = Field(30, description="Validation timeout in seconds")

    def get_rule(self, name: str) -> Optional[ValidationRule]:
        """Get a specific validation rule"""
        return self.rules.get(name)

    def is_rule_enabled(self, name: str) -> bool:
        """Check if a rule is enabled"""
        rule = self.get_rule(name)
        return rule.enabled if rule else False


class ProjectContext(BaseModel):
    """Comprehensive project context for agents"""
    project_id: str = Field(..., description="Unique project identifier")
    project_type: ProjectType = Field(ProjectType.UNKNOWN, description="Type of project")
    name: str = Field(..., description="Project name")
    description: str = Field(..., description="Project description")
    repository_url: Optional[str] = Field(None, description="Git repository URL")
    main_branch: str = Field("main", description="Main development branch")
    working_directory: str = Field(..., description="Working directory path")

    # Technology stack
    languages: List[str] = Field(default_factory=list, description="Programming languages used")
    frameworks: List[str] = Field(default_factory=list, description="Frameworks and libraries")
    databases: List[str] = Field(default_factory=list, description="Database technologies")
    deployment_targets: List[str] = Field(default_factory=list, description="Where this is deployed")

    # Development context
    environment: str = Field("development", description="Current environment")
    version: str = Field("1.0.0", description="Current version")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

    # File structure
    source_directories: List[str] = Field(default_factory=list, description="Main source code directories")
    test_directories: List[str] = Field(default_factory=list, description="Test directories")
    config_files: List[str] = Field(default_factory=list, description="Configuration files")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class AgentCapabilities(BaseModel):
    """Defines what an agent can do"""
    name: str = Field(..., description="Agent name")
    role: AgentRole = Field(..., description="Agent role")
    description: str = Field(..., description="What this agent does")

    # Capabilities
    primary_skills: List[str] = Field(default_factory=list, description="Main skills and abilities")
    secondary_skills: List[str] = Field(default_factory=list, description="Secondary/related skills")
    tools_available: List[str] = Field(default_factory=list, description="Tools the agent can use")
    frameworks_known: List[str] = Field(default_factory=list, description="Frameworks the agent knows")

    # Limitations
    scope_limitations: List[str] = Field(default_factory=list, description="What this agent cannot do")
    required_context: List[str] = Field(default_factory=list, description="Context needed to work effectively")

    # Performance characteristics
    typical_task_duration: str = Field("1-4 hours", description="Typical time for tasks")
    success_rate: float = Field(0.8, ge=0.0, le=1.0, description="Historical success rate")
    max_concurrent_tasks: int = Field(1, description="Maximum concurrent tasks")


@dataclass
class CEHubDependencies:
    """
    Standard dependencies for all CE Hub agents using PydanticAI.

    This class provides agents with access to all necessary tools, context,
    and resources to perform their tasks effectively and consistently.
    """

    # Core context
    project_context: ProjectContext = field(..., description="Project information and context")
    task_context: TaskContext = field(..., description="Current task information")
    requirements: ProjectRequirements = field(..., description="Requirements for this task")
    validation_config: ValidationConfig = field(..., description="Validation configuration")

    # Agent capabilities
    agent_capabilities: AgentCapabilities = field(..., description="This agent's capabilities")

    # External services
    archon_client: Any = field(..., description="Archon knowledge base client")
    file_system: Any = field(..., description="File system operations")
    git_operations: Any = field(..., description="Git repository operations")

    # Communication and coordination
    orchestrator_client: Any = field(..., description="Orchestrator communication client")
    user_interface: Any = field(..., description="User interaction interface")

    # State management
    state_store: Dict[str, Any] = field(default_factory=dict, description="Agent state storage")
    shared_memory: Dict[str, Any] = field(default_factory=dict, description="Shared memory between agents")

    # Configuration
    config: Dict[str, Any] = field(default_factory=dict, description="General configuration")
    environment: Dict[str, str] = field(default_factory=dict, description="Environment variables")

    # Logging and monitoring
    logger: logging.Logger = field(default_factory=lambda: logging.getLogger("cehub_agent"))
    metrics_collector: Any = field(None, description="Metrics collection system")

    def __post_init__(self):
        """Post-initialization setup"""
        # Ensure basic structure exists
        if not self.state_store:
            self.state_store = {}
        if not self.shared_memory:
            self.shared_memory = {}

        # Set up logging
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

    # State management methods
    def get_state(self, key: str, default: Any = None) -> Any:
        """Get a value from the agent's state store"""
        return self.state_store.get(key, default)

    def set_state(self, key: str, value: Any):
        """Set a value in the agent's state store"""
        self.state_store[key] = value
        self.logger.debug(f"Set state: {key} = {value}")

    def get_shared_state(self, key: str, default: Any = None) -> Any:
        """Get a value from shared memory"""
        return self.shared_memory.get(key, default)

    def set_shared_state(self, key: str, value: Any):
        """Set a value in shared memory"""
        self.shared_memory[key] = value
        self.logger.debug(f"Set shared state: {key} = {value}")

    # Configuration helpers
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get a configuration value"""
        return self.config.get(key, default)

    def get_env(self, key: str, default: str = "") -> str:
        """Get an environment variable"""
        return self.environment.get(key, default)

    # Validation helpers
    def should_validate(self) -> bool:
        """Check if validation should be performed"""
        return (
            self.validation_config.level != ValidationLevel.NONE and
            not (self.validation_config.skip_on_retry and self.task_context.current_attempt > 0)
        )

    def get_validation_rules(self) -> List[ValidationRule]:
        """Get enabled validation rules"""
        return [rule for rule in self.validation_config.rules.values() if rule.enabled]

    # Context helpers
    def get_working_directory(self) -> Path:
        """Get the project working directory as a Path object"""
        return Path(self.project_context.working_directory)

    def get_source_files(self, pattern: str = "**/*") -> List[Path]:
        """Get source files matching a pattern"""
        base_path = self.get_working_directory()
        source_files = []

        for source_dir in self.project_context.source_directories:
            dir_path = base_path / source_dir
            if dir_path.exists():
                source_files.extend(dir_path.glob(pattern))

        return source_files

    def is_test_environment(self) -> bool:
        """Check if we're in a test environment"""
        return self.project_context.environment.lower() in ['test', 'testing', 'qa']

    def is_production_environment(self) -> bool:
        """Check if we're in production environment"""
        return self.project_context.environment.lower() in ['production', 'prod']

    # Communication helpers
    async def send_update(self, message: str, level: str = "info"):
        """Send an update to the user/orchestrator"""
        if hasattr(self.user_interface, 'send_update'):
            await self.user_interface.send_update(message, level)
        else:
            self.logger.info(f"Update: {message}")

    async def ask_question(self, question: str, options: Optional[List[str]] = None) -> str:
        """Ask a question and get a response"""
        if hasattr(self.user_interface, 'ask_question'):
            return await self.user_interface.ask_question(question, options)
        else:
            # Fallback: log and return default response
            self.logger.info(f"Question: {question}")
            return input(f"{question} (Enter response): ")

    # Archon knowledge base helpers
    async def search_knowledge(self, query: str, match_count: int = 5) -> List[Dict[str, Any]]:
        """Search the Archon knowledge base"""
        try:
            if hasattr(self.archon_client, 'search_knowledge_base'):
                result = await self.archon_client.search_knowledge_base(
                    query=query,
                    match_count=match_count
                )
                return result.get('results', []) if isinstance(result, dict) else []
            else:
                self.logger.warning("Archon client does not support search_knowledge_base")
                return []
        except Exception as e:
            self.logger.error(f"Error searching knowledge base: {e}")
            return []

    async def get_code_examples(self, query: str, match_count: int = 3) -> List[Dict[str, Any]]:
        """Get code examples from knowledge base"""
        try:
            if hasattr(self.archon_client, 'search_code_examples'):
                result = await self.archon_client.search_code_examples(
                    query=query,
                    match_count=match_count
                )
                return result.get('results', []) if isinstance(result, dict) else []
            else:
                self.logger.warning("Archon client does not support search_code_examples")
                return []
        except Exception as e:
            self.logger.error(f"Error searching code examples: {e}")
            return []

    # File system helpers
    def read_file(self, file_path: Union[str, Path], encoding: str = 'utf-8') -> str:
        """Read file content safely"""
        if hasattr(self.file_system, 'read'):
            return self.file_system.read(str(file_path), encoding=encoding)
        else:
            # Fallback implementation
            path = Path(file_path)
            if path.exists():
                return path.read_text(encoding=encoding)
            else:
                raise FileNotFoundError(f"File not found: {file_path}")

    def write_file(self, file_path: Union[str, Path], content: str, encoding: str = 'utf-8'):
        """Write file content safely"""
        if hasattr(self.file_system, 'write'):
            self.file_system.write(str(file_path), content, encoding=encoding)
        else:
            # Fallback implementation
            path = Path(file_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding=encoding)
            self.logger.info(f"Wrote file: {file_path}")

    # Metrics and monitoring
    def record_metric(self, name: str, value: Union[int, float], tags: Optional[Dict[str, str]] = None):
        """Record a metric for monitoring"""
        if self.metrics_collector and hasattr(self.metrics_collector, 'record'):
            self.metrics_collector.record(name, value, tags or {})
        else:
            self.logger.debug(f"Metric: {name} = {value}")

    def start_timer(self, operation_name: str) -> str:
        """Start timing an operation"""
        timer_id = f"{operation_name}_{datetime.now().timestamp()}"
        self.set_state(f"timer_{timer_id}", datetime.now())
        return timer_id

    def end_timer(self, timer_id: str) -> float:
        """End timing an operation and return duration"""
        start_time = self.get_state(f"timer_{timer_id}")
        if start_time:
            duration = (datetime.now() - start_time).total_seconds()
            self.record_metric(f"operation_duration", duration, {"operation": timer_id.split('_')[0]})
            return duration
        return 0.0


# Factory function for creating dependencies
def create_cehub_dependencies(
    project_context: ProjectContext,
    task_context: TaskContext,
    requirements: ProjectRequirements,
    agent_capabilities: AgentCapabilities,
    archon_client: Any,
    file_system: Any,
    git_operations: Any,
    orchestrator_client: Any,
    user_interface: Any,
    validation_config: Optional[ValidationConfig] = None,
    config: Optional[Dict[str, Any]] = None,
    environment: Optional[Dict[str, str]] = None,
    metrics_collector: Any = None
) -> CEHubDependencies:
    """
    Factory function to create CEHubDependencies with all required components.

    Args:
        project_context: Project information and context
        task_context: Current task information
        requirements: Requirements for this task
        agent_capabilities: This agent's capabilities
        archon_client: Archon knowledge base client
        file_system: File system operations
        git_operations: Git repository operations
        orchestrator_client: Orchestrator communication client
        user_interface: User interaction interface
        validation_config: Validation configuration (defaults to basic)
        config: General configuration
        environment: Environment variables
        metrics_collector: Metrics collection system

    Returns:
        Fully configured CEHubDependencies instance
    """

    # Use defaults if not provided
    if validation_config is None:
        validation_config = ValidationConfig(level=ValidationLevel.BASIC)

    if config is None:
        config = {}

    if environment is None:
        environment = {}

    return CEHubDependencies(
        project_context=project_context,
        task_context=task_context,
        requirements=requirements,
        validation_config=validation_config,
        agent_capabilities=agent_capabilities,
        archon_client=archon_client,
        file_system=file_system,
        git_operations=git_operations,
        orchestrator_client=orchestrator_client,
        user_interface=user_interface,
        config=config,
        environment=environment,
        metrics_collector=metrics_collector
    )


# Type alias for PydanticAI RunContext with CE Hub dependencies
CEHubRunContext = RunContext[CEHubDependencies]