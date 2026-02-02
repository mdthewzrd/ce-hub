"""
CE Hub Base Agent Framework

This module provides the base agent class that all CE Hub agents will inherit from.
It implements the PydanticAI framework integration, standardized validation,
communication patterns, and agent lifecycle management.
"""

from typing import Dict, List, Any, Optional, Union, Callable, Type, get_type_hints
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import asyncio
import json
import logging
import traceback
from pathlib import Path

# PydanticAI imports
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.tools import Tool
from pydantic_ai.result import Result

# Local imports
from .cehub_dependencies import (
    CEHubDependencies,
    CEHubRunContext,
    AgentCapabilities,
    AgentRole,
    TaskComplexity,
    ValidationResult,
    ValidationConfig,
    ProjectRequirements,
    ProjectContext,
    TaskContext,
    create_cehub_dependencies
)
from .validation_engine import ValidationEngine, validate


class AgentState(str, str):
    """Agent lifecycle states"""
    INITIALIZING = "initializing"
    READY = "ready"
    PROCESSING = "processing"
    VALIDATING = "validating"
    COMPLETED = "completed"
    ERROR = "error"
    RETRYING = "retrying"


class TaskResult(BaseModel):
    """Standard result format for agent tasks"""
    success: bool = Field(..., description="Whether the task completed successfully")
    content: str = Field(..., description="Main output content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional result metadata")
    validation_result: Optional[ValidationResult] = Field(None, description="Validation result")
    execution_time: float = Field(0.0, description="Time taken to execute in seconds")
    artifacts: List[str] = Field(default_factory=list, description="Files or resources created")
    next_steps: List[str] = Field(default_factory=list, description="Suggested next steps")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    error_traceback: Optional[str] = Field(None, description="Full error traceback if failed")
    retry_count: int = Field(0, description="Number of retries attempted")
    agent_version: str = Field("1.0.0", description="Agent version that produced this result")


class RequirementQuestion(BaseModel):
    """A question to gather requirements from the user"""
    question: str = Field(..., description="The question to ask")
    type: str = Field("text", description="Question type: text, choice, multiple_choice, file")
    options: Optional[List[str]] = Field(None, description="Options for choice questions")
    required: bool = Field(True, description="Whether this question is required")
    validation_rule: Optional[str] = Field(None, description="Validation rule for the answer")
    context: Optional[str] = Field(None, description="Additional context for the question")


class CommunicationProtocol:
    """Standardized communication protocol for agents"""

    def __init__(self, dependencies: CEHubDependencies):
        self.deps = dependencies
        self.logger = dependencies.logger

    async def send_status_update(self, message: str, level: str = "info", progress: Optional[float] = None):
        """Send a status update to the user"""
        await self.deps.send_update(f"[{self.deps.agent_capabilities.name}] {message}", level)
        if progress is not None:
            self.deps.record_metric("progress", progress)

    async def ask_requirement_question(self, question: RequirementQuestion) -> str:
        """Ask a requirement gathering question"""
        self.logger.info(f"Asking requirement question: {question.question}")

        options = question.options if question.type in ["choice", "multiple_choice"] else None
        response = await self.deps.ask_question(question.question, options)

        # Validate response if rule specified
        if question.validation_rule and response:
            if not self._validate_response(response, question.validation_rule):
                self.logger.warning(f"Response validation failed: {response}")
                return await self.ask_requirement_question(question)  # Ask again

        return response

    def _validate_response(self, response: str, rule: str) -> bool:
        """Validate a response against a rule"""
        if rule == "non_empty":
            return bool(response.strip())
        elif rule.startswith("length:"):
            min_length = int(rule.split(":")[1])
            return len(response) >= min_length
        elif rule.startswith("regex:"):
            import re
            pattern = rule.split(":", 1)[1]
            return bool(re.match(pattern, response))
        return True

    async def confirm_understanding(self, summary: str) -> bool:
        """Confirm understanding with the user"""
        response = await self.deps.ask_question(
            f"Please confirm this understanding is correct:\n\n{summary}\n\nRespond with 'yes' to confirm or provide corrections.",
            ["yes", "no", "correct"]
        )
        return response.lower() in ["yes", "correct", "confirmed"]

    async def report_progress(self, current_step: int, total_steps: int, step_description: str):
        """Report progress on a multi-step task"""
        progress = current_step / total_steps
        await self.send_status_update(f"Step {current_step}/{total_steps}: {step_description}", "info", progress)


class CEHubAgentBase(ABC):
    """
    Base class for all CE Hub agents using PydanticAI framework.

    This class provides:
    - Standardized agent initialization and lifecycle
    - Built-in validation and quality control
    - Communication protocols
    - Error handling and retry logic
    - Performance monitoring and metrics
    - Requirement gathering and confirmation
    """

    def __init__(
        self,
        capabilities: AgentCapabilities,
        model_name: str = "claude-3-5-sonnet-20241022",
        model_provider: str = "anthropic",
        validation_config: Optional[ValidationConfig] = None,
        custom_validators: Optional[Dict[str, Callable]] = None
    ):
        """
        Initialize the CE Hub agent

        Args:
            capabilities: Agent capabilities definition
            model_name: AI model to use
            model_provider: Model provider (openai, anthropic, etc.)
            validation_config: Validation configuration
            custom_validators: Custom validation functions
        """
        self.capabilities = capabilities
        self.validation_config = validation_config or ValidationConfig()
        self.custom_validators = custom_validators or {}
        self.state = AgentState.INITIALIZING
        self.logger = logging.getLogger(f"cehub_agent_{capabilities.name}")

        # Initialize AI model
        self.model = self._initialize_model(model_name, model_provider)

        # Initialize validation engine
        self.validation_engine = ValidationEngine()
        self._register_custom_validators()

        # Initialize communication protocol
        self.communication_protocol = None  # Will be set when dependencies are provided

        # Performance tracking
        self.metrics = {
            "tasks_completed": 0,
            "tasks_failed": 0,
            "total_execution_time": 0.0,
            "average_task_time": 0.0,
            "last_execution_time": None,
            "validation_scores": []
        }

        # Task history
        self.task_history: List[TaskResult] = []

        self.logger.info(f"Initialized {capabilities.name} agent with model {model_name}")

    def _initialize_model(self, model_name: str, provider: str) -> Union[OpenAIModel, AnthropicModel]:
        """Initialize the AI model"""
        try:
            if provider.lower() == "openai":
                return OpenAIModel(model_name)
            elif provider.lower() == "anthropic":
                return AnthropicModel(model_name)
            else:
                raise ValueError(f"Unsupported model provider: {provider}")
        except Exception as e:
            self.logger.error(f"Failed to initialize model {model_name}: {e}")
            # Fallback to a basic configuration
            return AnthropicModel("claude-3-5-sonnet-20241022")

    def _register_custom_validators(self):
        """Register custom validation functions"""
        for name, validator_func in self.custom_validators.items():
            self.validation_engine.register_validator(name, validator_func)

    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Get the system prompt for this agent.

        Returns:
            System prompt string that defines the agent's behavior and capabilities
        """
        pass

    @abstractmethod
    def get_tools(self) -> List[Tool]:
        """
        Get the tools available to this agent.

        Returns:
            List of tools the agent can use
        """
        pass

    async def initialize_dependencies(
        self,
        project_context: ProjectContext,
        task_context: TaskContext,
        requirements: ProjectRequirements,
        archon_client: Any,
        file_system: Any,
        git_operations: Any,
        orchestrator_client: Any,
        user_interface: Any,
        config: Optional[Dict[str, Any]] = None,
        environment: Optional[Dict[str, str]] = None,
        metrics_collector: Any = None
    ) -> CEHubDependencies:
        """
        Initialize dependencies for this agent

        Returns:
            Configured CEHubDependencies instance
        """
        dependencies = create_cehub_dependencies(
            project_context=project_context,
            task_context=task_context,
            requirements=requirements,
            agent_capabilities=self.capabilities,
            archon_client=archon_client,
            file_system=file_system,
            git_operations=git_operations,
            orchestrator_client=orchestrator_client,
            user_interface=user_interface,
            validation_config=self.validation_config,
            config=config or {},
            environment=environment or {},
            metrics_collector=metrics_collector
        )

        # Initialize communication protocol
        self.communication_protocol = CommunicationProtocol(dependencies)

        self.state = AgentState.READY
        self.logger.info(f"{self.capabilities.name} agent ready")

        return dependencies

    async def gather_requirements(self, user_input: str, dependencies: CEHubDependencies) -> ProjectRequirements:
        """
        Gather and clarify requirements from user input

        Args:
            user_input: Initial user input
            dependencies: Agent dependencies

        Returns:
            Structured project requirements
        """
        self.communication_protocol = CommunicationProtocol(dependencies)
        await self.communication_protocol.send_status_update("Gathering requirements...")

        # Analyze initial input
        analysis = await self._analyze_user_input(user_input, dependencies)

        # Generate targeted questions
        questions = await self._generate_requirement_questions(analysis, dependencies)

        # Ask questions and collect answers
        answers = {}
        for question in questions:
            if question.required or await self._should_ask_optional_question(question, dependencies):
                answer = await self.communication_protocol.ask_requirement_question(question)
                answers[question.question] = answer

        # Build requirements object
        requirements = await self._build_requirements(user_input, analysis, answers, dependencies)

        # Confirm understanding
        summary = self._generate_requirements_summary(requirements)
        confirmed = await self.communication_protocol.confirm_understanding(summary)

        if not confirmed:
            # Allow user to provide corrections
            corrections = await dependencies.ask_question("Please provide corrections or additional information:")
            if corrections:
                # Parse corrections and update requirements
                requirements = await self._apply_corrections(requirements, corrections, dependencies)

        await self.communication_protocol.send_status_update("Requirements gathering completed")
        return requirements

    async def _analyze_user_input(self, user_input: str, dependencies: CEHubDependencies) -> Dict[str, Any]:
        """Analyze the initial user input"""
        analysis = {
            "complexity": TaskComplexity.MODERATE,
            "estimated_effort": "2-4 hours",
            "missing_information": [],
            "suggested_approaches": [],
            "risk_factors": []
        }

        # Use Archon to find similar projects
        similar_projects = await dependencies.search_knowledge(user_input, match_count=3)
        analysis["similar_projects"] = similar_projects

        # Analyze complexity based on keywords
        complexity_keywords = {
            TaskComplexity.SIMPLE: ["simple", "basic", "quick", "minor"],
            TaskComplexity.MODERATE: ["feature", "implement", "create", "build"],
            TaskComplexity.COMPLEX: ["system", "architecture", "integration", "refactor"],
            TaskComplexity.EXPERT: ["performance", "security", "scalability", "migration"]
        }

        input_lower = user_input.lower()
        for complexity, keywords in complexity_keywords.items():
            if any(keyword in input_lower for keyword in keywords):
                analysis["complexity"] = complexity
                break

        # Estimate effort based on complexity
        effort_map = {
            TaskComplexity.SIMPLE: "30 minutes - 2 hours",
            TaskComplexity.MODERATE: "2-8 hours",
            TaskComplexity.COMPLEX: "8-24 hours",
            TaskComplexity.EXPERT: "24+ hours"
        }
        analysis["estimated_effort"] = effort_map[analysis["complexity"]]

        # Identify missing information
        missing_indicators = [
            "requirements" if "requirement" not in input_lower else None,
            "constraints" if "constraint" not in input_lower else None,
            "deadline" if "deadline" not in input_lower and "due" not in input_lower else None,
            "testing" if "test" not in input_lower else None,
            "dependencies" if "depend" not in input_lower else None
        ]
        analysis["missing_information"] = [item for item in missing_indicators if item]

        return analysis

    async def _generate_requirement_questions(
        self,
        analysis: Dict[str, Any],
        dependencies: CEHubDependencies
    ) -> List[RequirementQuestion]:
        """Generate targeted questions based on analysis"""
        questions = []

        # Basic project questions
        questions.extend([
            RequirementQuestion(
                question="What is the specific success criteria for this task?",
                type="text",
                required=True,
                validation_rule="non_empty"
            ),
            RequirementQuestion(
                question="What are the technical constraints or limitations we need to consider?",
                type="text",
                required=False
            ),
            RequirementQuestion(
                question="Which parts of the codebase might this affect?",
                type="text",
                required=False
            )
        ])

        # Questions based on missing information
        for missing in analysis.get("missing_information", []):
            if missing == "testing":
                questions.append(RequirementQuestion(
                    question="What level of testing is required for this?",
                    type="choice",
                    options=["basic", "comprehensive", "production-grade"],
                    required=False
                ))
            elif missing == "deadline":
                questions.append(RequirementQuestion(
                    question="Is there a specific deadline or timeline for this?",
                    type="text",
                    required=False
                ))

        # Complexity-specific questions
        if analysis["complexity"] in [TaskComplexity.COMPLEX, TaskComplexity.EXPERT]:
            questions.extend([
                RequirementQuestion(
                    question="Are there any performance or scalability requirements?",
                    type="text",
                    required=False
                ),
                RequirementQuestion(
                    question="What are the security considerations for this task?",
                    type="text",
                    required=False
                )
            ])

        # Questions based on similar projects
        similar_projects = analysis.get("similar_projects", [])
        if similar_projects:
            questions.append(RequirementQuestion(
                question=f"I found similar projects: {', '.join([p.get('title', 'unknown') for p in similar_projects[:2]])}. Should we follow similar patterns or approaches?",
                type="choice",
                options=["follow similar patterns", "use different approach", "not sure"],
                required=False
            ))

        return questions

    async def _should_ask_optional_question(self, question: RequirementQuestion, dependencies: CEHubDependencies) -> bool:
        """Determine if we should ask an optional question"""
        # For now, ask all optional questions
        # Could be made smarter based on context, complexity, etc.
        return True

    async def _build_requirements(
        self,
        user_input: str,
        analysis: Dict[str, Any],
        answers: Dict[str, str],
        dependencies: CEHubDependencies
    ) -> ProjectRequirements:
        """Build the requirements object from gathered information"""
        # Extract title from user input
        title = user_input.split('\n')[0].strip()
        if len(title) > 100:
            title = title[:97] + "..."

        # Build description
        description = user_input

        # Extract success criteria
        success_criteria = []
        for question, answer in answers.items():
            if "success criteria" in question.lower():
                success_criteria.extend([c.strip() for c in answer.split('\n') if c.strip()])

        # Extract technical constraints
        technical_constraints = []
        for question, answer in answers.items():
            if "constraint" in question.lower():
                technical_constraints.extend([c.strip() for c in answer.split('\n') if c.strip()])

        # Extract affected components
        affected_components = []
        for question, answer in answers.items():
            if "affect" in question.lower() or "codebase" in question.lower():
                affected_components.extend([c.strip() for c in answer.split(',') if c.strip()])

        # Extract testing level
        testing_answer = None
        for question, answer in answers.items():
            if "testing" in question.lower():
                testing_answer = answer
                break

        testing_level_map = {
            "basic": TaskComplexity.SIMPLE,
            "comprehensive": TaskComplexity.MODERATE,
            "production-grade": TaskComplexity.COMPLEX
        }
        testing_level = testing_level_map.get(testing_answer.lower() if testing_answer else None, TaskComplexity.MODERATE)

        return ProjectRequirements(
            title=title,
            description=description,
            success_criteria=success_criteria or ["Complete the task as specified"],
            technical_constraints=technical_constraints,
            affected_components=affected_components,
            testing_level=testing_level,
            # Add other fields as needed
        )

    def _generate_requirements_summary(self, requirements: ProjectRequirements) -> str:
        """Generate a summary of requirements for confirmation"""
        summary_parts = [
            f"**Task:** {requirements.title}",
            f"**Description:** {requirements.description}",
            f"**Success Criteria:** {', '.join(requirements.success_criteria)}",
        ]

        if requirements.technical_constraints:
            summary_parts.append(f"**Constraints:** {', '.join(requirements.technical_constraints)}")

        if requirements.affected_components:
            summary_parts.append(f"**Affected Components:** {', '.join(requirements.affected_components)}")

        return "\n\n".join(summary_parts)

    async def _apply_corrections(
        self,
        requirements: ProjectRequirements,
        corrections: str,
        dependencies: CEHubDependencies
    ) -> ProjectRequirements:
        """Apply user corrections to requirements"""
        # For now, just add corrections to description
        # In a more sophisticated implementation, we could parse and modify specific fields
        updated_description = f"{requirements.description}\n\n**User Corrections:**\n{corrections}"
        requirements.description = updated_description
        return requirements

    def create_agent(self) -> Agent[CEHubDependencies, str]:
        """
        Create the PydanticAI agent instance

        Returns:
            Configured PydanticAI Agent
        """
        agent = Agent[CEHubDependencies, str](
            model=self.model,
            system_prompt=self.get_system_prompt(),
            tools=self.get_tools()
        )

        # Add result validator
        @agent.result_validator
        async def validate_result(ctx: RunContext[CEHubDependencies], result: str) -> str:
            """Validate agent results"""
            if ctx.deps.should_validate():
                validation_result = await validate(result, ctx, ctx.deps.validation_config)

                if not validation_result.is_valid:
                    error_msg = f"Validation failed: {'; '.join(validation_result.errors)}"
                    ctx.deps.logger.error(error_msg)

                    # Store validation result in context for error handling
                    ctx.deps.set_state("last_validation_result", validation_result)

                    # Depending on configuration, either raise error or continue with warnings
                    if ctx.deps.validation_config.level == ValidationLevel.PRODUCTION:
                        raise ValueError(error_msg)
                    else:
                        ctx.deps.logger.warning(f"Validation warnings: {'; '.join(validation_result.warnings)}")

                # Record validation metrics
                ctx.deps.record_metric("validation_score", validation_result.score)
                ctx.deps.record_metric("validation_errors", len(validation_result.errors))
                ctx.deps.record_metric("validation_warnings", len(validation_result.warnings))

            return result

        return agent

    async def execute_task(
        self,
        task_input: str,
        dependencies: CEHubDependencies,
        requirements: Optional[ProjectRequirements] = None
    ) -> TaskResult:
        """
        Execute a task with comprehensive error handling and validation

        Args:
            task_input: The task input/request
            dependencies: Agent dependencies
            requirements: Optional pre-gathered requirements

        Returns:
            TaskResult with execution details
        """
        start_time = datetime.now()
        self.state = AgentState.PROCESSING

        try:
            # Initialize communication if not already done
            if not self.communication_protocol:
                self.communication_protocol = CommunicationProtocol(dependencies)

            # Gather requirements if not provided
            if not requirements:
                requirements = await self.gather_requirements(task_input, dependencies)
                dependencies.requirements = requirements  # Update dependencies

            await self.communication_protocol.send_status_update(f"Starting task: {requirements.title}")

            # Create and run agent
            agent = self.create_agent()

            # Record task start
            task_timer = dependencies.start_timer("task_execution")

            try:
                # Run the agent
                result = await agent.run(task_input, deps= dependencies)
                content = result.output

                # Validate result
                self.state = AgentState.VALIDATING
                validation_result = await self.validation_engine.validate_agent_output(
                    self.capabilities.name,
                    content,
                    RunContext(deps=dependencies, retry=0, result=None)
                )

                # End task timer
                execution_time = dependencies.end_timer(task_timer)

                # Create successful result
                task_result = TaskResult(
                    success=True,
                    content=content,
                    validation_result=validation_result,
                    execution_time=execution_time,
                    metadata={
                        "agent_name": self.capabilities.name,
                        "model_used": str(self.model),
                        "task_complexity": requirements.testing_level.value,
                        "validation_score": validation_result.score
                    }
                )

                # Update metrics
                self._update_metrics(task_result, True)

                # Send completion message
                await self.communication_protocol.send_status_update(
                    f"Task completed successfully (validation score: {validation_result.score:.2f})"
                )

                self.state = AgentState.COMPLETED
                return task_result

            except Exception as e:
                # End task timer on error
                dependencies.end_timer(task_timer)

                # Handle execution error
                return await self._handle_execution_error(
                    e, task_input, dependencies, requirements, start_time
                )

        except Exception as e:
            # Handle critical error
            self.state = AgentState.ERROR
            self.logger.error(f"Critical error in {self.capabilities.name}: {e}")

            return TaskResult(
                success=False,
                content="",
                error_message=f"Critical error: {str(e)}",
                error_traceback=traceback.format_exc(),
                execution_time=(datetime.now() - start_time).total_seconds(),
                metadata={"error_type": "critical_error"}
            )

    async def _handle_execution_error(
        self,
        error: Exception,
        task_input: str,
        dependencies: CEHubDependencies,
        requirements: ProjectRequirements,
        start_time: datetime
    ) -> TaskResult:
        """Handle execution errors with retry logic"""
        current_attempt = dependencies.task_context.current_attempt
        max_attempts = dependencies.task_context.max_attempts

        self.logger.error(f"Task execution failed (attempt {current_attempt + 1}/{max_attempts}): {error}")

        # Check if we should retry
        if current_attempt < max_attempts - 1:
            self.state = AgentState.RETRYING

            await self.communication_protocol.send_status_update(
                f"Task failed, retrying... (attempt {current_attempt + 2}/{max_attempts})"
            )

            # Update attempt count
            dependencies.task_context.current_attempt += 1

            # Wait before retry (exponential backoff)
            wait_time = min(2 ** current_attempt, 30)  # Max 30 seconds
            await asyncio.sleep(wait_time)

            # Retry the task
            return await self.execute_task(task_input, dependencies, requirements)
        else:
            # Max attempts reached
            self.state = AgentState.ERROR

            await self.communication_protocol.send_status_update(
                f"Task failed after {max_attempts} attempts",
                level="error"
            )

            execution_time = (datetime.now() - start_time).total_seconds()

            return TaskResult(
                success=False,
                content="",
                error_message=str(error),
                error_traceback=traceback.format_exc(),
                execution_time=execution_time,
                retry_count=max_attempts - 1,
                metadata={
                    "error_type": "max_attempts_exceeded",
                    "total_attempts": max_attempts
                }
            )

    def _update_metrics(self, result: TaskResult, success: bool):
        """Update agent metrics"""
        if success:
            self.metrics["tasks_completed"] += 1
            if result.validation_result:
                self.metrics["validation_scores"].append(result.validation_result.score)
        else:
            self.metrics["tasks_failed"] += 1

        self.metrics["total_execution_time"] += result.execution_time
        self.metrics["last_execution_time"] = datetime.now()

        total_tasks = self.metrics["tasks_completed"] + self.metrics["tasks_failed"]
        if total_tasks > 0:
            self.metrics["average_task_time"] = self.metrics["total_execution_time"] / total_tasks

    def get_metrics(self) -> Dict[str, Any]:
        """Get current agent metrics"""
        metrics = self.metrics.copy()

        # Add calculated metrics
        metrics["success_rate"] = (
            self.metrics["tasks_completed"] /
            (self.metrics["tasks_completed"] + self.metrics["tasks_failed"])
            if (self.metrics["tasks_completed"] + self.metrics["tasks_failed"]) > 0
            else 0.0
        )

        # Add average validation score
        if self.metrics["validation_scores"]:
            metrics["average_validation_score"] = sum(self.metrics["validation_scores"]) / len(self.metrics["validation_scores"])
        else:
            metrics["average_validation_score"] = 0.0

        return metrics

    def get_task_history(self, limit: Optional[int] = None) -> List[TaskResult]:
        """Get task history with optional limit"""
        if limit:
            return self.task_history[-limit:]
        return self.task_history.copy()

    async def cleanup(self):
        """Clean up agent resources"""
        self.state = AgentState.INITIALIZING
        self.communication_protocol = None
        self.logger.info(f"{self.capabilities.name} agent cleaned up")


# Decorator for automatic dependency injection
def cehub_agent(
    role: AgentRole,
    capabilities_override: Optional[Dict[str, Any]] = None,
    model_name: str = "claude-3-5-sonnet-20241022",
    validation_level: str = "basic"
):
    """
    Decorator to automatically create a CE Hub agent class

    Args:
        role: Agent role
        capabilities_override: Override default capabilities
        model_name: AI model to use
        validation_level: Default validation level
    """
    def decorator(cls):
        # Create default capabilities based on role
        default_capabilities = {
            AgentRole.ENGINEER: {
                "name": "ce-hub-engineer",
                "description": "Technical implementation specialist for CE-Hub",
                "primary_skills": ["coding", "architecture", "debugging", "API development"],
                "secondary_skills": ["documentation", "testing", "optimization"],
                "frameworks_known": ["React", "Node.js", "Python", "TypeScript"]
            },
            AgentRole.GUI_SPECIALIST: {
                "name": "ce-hub-gui-specialist",
                "description": "UI/UX design and frontend development specialist",
                "primary_skills": ["UI design", "React", "CSS", "user experience"],
                "secondary_skills": ["accessibility", "responsive design", "animation"]
            },
            AgentRole.QA_TESTER: {
                "name": "qa-tester",
                "description": "Quality assurance and testing specialist",
                "primary_skills": ["testing", "validation", "debugging", "automation"],
                "secondary_skills": ["performance testing", "security testing", "documentation"]
            }
        }

        capabilities_data = default_capabilities.get(role, {
            "name": role.value,
            "description": f"CE Hub agent with role: {role.value}",
            "primary_skills": [],
            "secondary_skills": []
        })

        # Apply overrides
        if capabilities_override:
            capabilities_data.update(capabilities_override)

        # Create capabilities object
        capabilities = AgentCapabilities(
            name=capabilities_data["name"],
            role=role,
            description=capabilities_data["description"],
            primary_skills=capabilities_data.get("primary_skills", []),
            secondary_skills=capabilities_data.get("secondary_skills", []),
            frameworks_known=capabilities_data.get("frameworks_known", [])
        )

        # Create validation config
        validation_config = ValidationConfig(level=ValidationLevel(validation_level))

        # Store metadata on the class
        cls._cehub_metadata = {
            "capabilities": capabilities,
            "model_name": model_name,
            "validation_config": validation_config
        }

        return cls

    return decorator