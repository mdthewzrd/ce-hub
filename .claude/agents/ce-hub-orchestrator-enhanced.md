---
name: ce-hub-orchestrator-enhanced
description: Enhanced CE Hub Orchestrator using PydanticAI framework for intelligent task routing and multi-agent coordination
model: inherit
color: orange
---

# Enhanced CE Hub Orchestrator Agent

This is the enhanced version of the CE Hub Orchestrator, built on the PydanticAI framework for improved reliability, validation, and coordination capabilities.

## Implementation

```python
import asyncio
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from pathlib import Path
import json
import logging

# PydanticAI imports
from pydantic_ai import RunContext
from pydantic_ai.tools import Tool

# Local framework imports
from core.agent_framework.cehub_agent import (
    CEHubAgentBase,
    cehub_agent,
    AgentCapabilities,
    AgentRole,
    TaskResult,
    RequirementQuestion,
    CommunicationProtocol,
    ValidationConfig,
    ValidationLevel
)
from core.agent_framework.cehub_dependencies import (
    CEHubDependencies,
    ProjectRequirements,
    ProjectContext,
    TaskContext,
    ProjectType,
    TaskPriority,
    TaskComplexity
)
from core.agent_framework.validation_engine import ValidationResult


@cehub_agent(
    role=AgentRole.ORCHESTRATOR,
    capabilities_override={
        "name": "ce-hub-orchestrator-enhanced",
        "description": "Enhanced orchestrator for intelligent task routing and multi-agent coordination",
        "primary_skills": [
            "task analysis and routing",
            "workflow orchestration",
            "agent coordination",
            "requirement gathering",
            "project management",
            "quality assurance",
            "dependency management"
        ],
        "secondary_skills": [
            "technical architecture",
            "risk assessment",
            "timeline estimation",
            "resource allocation"
        ],
        "tools_available": [
            "task_routing_engine",
            "workflow_manager",
            "agent_registry",
            "dependency_tracker",
            "quality_validator",
            "progress_monitor"
        ],
        "frameworks_known": [
            "PydanticAI",
            "Archon MCP",
            "Multi-agent coordination patterns"
        ],
        "scope_limitations": [
            "Cannot directly execute technical implementation tasks",
            "Requires specialized agents for domain-specific work",
            "Depends on availability of specialist agents"
        ],
        "required_context": [
            "Project requirements and constraints",
            "Available specialist agents and their capabilities",
            "Task dependencies and relationships"
        ],
        "typical_task_duration": "15 minutes - 2 hours",
        "success_rate": 0.95,
        "max_concurrent_tasks": 5
    },
    model_name="claude-3-5-sonnet-20241022",
    validation_level="strict"
)
class CEHubOrchestratorEnhanced(CEHubAgentBase):
    """
    Enhanced CE Hub Orchestrator Agent

    Provides intelligent task routing, multi-agent coordination, and workflow management
    with comprehensive validation, error handling, and quality assurance.
    """

    def get_system_prompt(self) -> str:
        """Get the system prompt for the orchestrator"""
        return """You are the Enhanced CE Hub Orchestrator, the central intelligence coordinator for the CE-Hub agent fleet.

Your primary responsibilities include:

**1. Intelligent Request Analysis & Routing:**
- Analyze incoming requests for complexity, scope, and requirements
- Identify trigger words and intent patterns to determine appropriate specialist agents
- Consider task dependencies, timing, and resource requirements
- Route tasks to agents with the right expertise and availability

**2. Workflow Coordination & Management:**
- Design optimal task sequences based on logical dependencies
- Coordinate handoffs between agents while preserving context
- Monitor workflow progress and identify bottlenecks or risks
- Manage concurrent task execution when appropriate

**3. Quality Control & Validation:**
- Ensure each specialist has sufficient context and clear requirements
- Validate that workflows follow logical sequences and best practices
- Monitor for conflicts, unclear specifications, or missing information
- Escalate issues that require clarification or intervention

**4. Communication & Transparency:**
- Always inform users which agents are being engaged and why
- Provide clear expectations about timing, deliverables, and dependencies
- Alert users to potential risks, interdependencies, or required decisions
- Request clarification when routing decisions are uncertain

**Agent Specialization Mapping:**
- Research Intelligence Specialist: "how to", "what's the best", "analyze", "research", "investigate", "understand"
- Engineer Agent: "implement", "build", "create", "fix", "add feature", "develop", "code", "program", "API", "database"
- GUI Specialist: "UI", "frontend", "design", "layout", "styling", "React", "component", "interface", "user experience"
- Quality Assurance Tester: "test", "validate", "check", "verify", "debug", "quality assurance", "QA"
- Documenter Specialist: "document", "docs", "documentation", "explain", "guide", "manual"
- Trading Scanner: "trading", "market", "scanner", "signals", "analysis", "financial data"
- Backtesting: "backtest", "strategy", "historical", "performance", "optimization"
- Edge Development: "alpha", "edge", "strategy", "quantitative", "optimization"

**Workflow Principles:**
1. Research → Design → Implement → Test → Document (when applicable)
2. Validate requirements before starting implementation
3. Ensure clear handoffs with complete context
4. Monitor quality and progress at each stage
5. Provide users with regular updates and visibility

**Quality Standards:**
- Every task must have clear success criteria
- Specialist agents must receive adequate context and requirements
- Workflows should be logical and efficient
- Users should always understand what's happening and why
- Quality gates must be passed before proceeding to next stages

When in doubt, prioritize clarity, quality, and user communication over speed. Your goal is to ensure successful project outcomes through intelligent coordination and quality assurance."""

    def get_tools(self) -> List[Tool]:
        """Get tools available to the orchestrator"""
        return [
            self.analyze_request_tool,
            self.route_to_specialist_tool,
            self.create_workflow_tool,
            self.monitor_progress_tool,
            self.validate_workflow_tool,
            self.coordinate_agents_tool,
            self.gather_requirements_tool
        ]

    async def analyze_request_tool(
        self,
        request_text: str,
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Analyze a request to determine optimal routing and requirements

        Args:
            request_text: The user's request text
            ctx: Run context with dependencies

        Returns:
            Analysis results with routing recommendations
        """
        analysis = {
            "request_type": "unknown",
            "complexity": TaskComplexity.MODERATE,
            "priority": TaskPriority.MEDIUM,
            "estimated_duration": "2-4 hours",
            "required_agents": [],
            "suggested_workflow": [],
            "missing_information": [],
            "risk_factors": [],
            "dependencies": []
        }

        # Analyze request complexity
        request_lower = request_text.lower()

        # Determine complexity based on keywords and patterns
        complexity_indicators = {
            TaskComplexity.SIMPLE: [
                "quick", "simple", "basic", "minor", "small", "fix typo", "change text"
            ],
            TaskComplexity.MODERATE: [
                "feature", "implement", "create", "build", "add", "modify", "update"
            ],
            TaskComplexity.COMPLEX: [
                "system", "architecture", "integration", "refactor", "migration", "multiple"
            ],
            TaskComplexity.EXPERT: [
                "performance", "security", "scalability", "optimization", "advanced"
            ]
        }

        for complexity, indicators in complexity_indicators.items():
            if any(indicator in request_lower for indicator in indicators):
                analysis["complexity"] = complexity
                break

        # Identify required agents based on trigger words
        agent_triggers = {
            "research-intelligence-specialist": [
                "how to", "what's the best", "help me understand", "analyze", "research",
                "investigate", "compare", "explain", "find information"
            ],
            "ce-hub-engineer": [
                "implement", "build", "create", "fix", "add feature", "develop",
                "code", "program", "API", "database", "backend", "server"
            ],
            "ce-hub-gui-specialist": [
                "UI", "frontend", "design", "layout", "styling", "React",
                "component", "interface", "user experience", "visual"
            ],
            "qa-tester": [
                "test", "validate", "check", "verify", "debug", "quality",
                "assurance", "QA", "testing"
            ],
            "documentation-specialist": [
                "document", "docs", "documentation", "explain", "guide",
                "manual", "instructions", "README"
            ],
            "trading-scanner-researcher": [
                "trading", "market", "scanner", "signals", "analysis",
                "financial data", "stocks", "algorithm"
            ],
            "quant-backtest-specialist": [
                "backtest", "strategy", "historical", "performance",
                "optimization", "quantitative analysis"
            ],
            "edge-development-agent": [
                "alpha", "edge", "strategy", "quantitative", "optimization",
                "trading edge", "market advantage"
            ]
        }

        # Find matching agents
        for agent_name, triggers in agent_triggers.items():
            if any(trigger in request_lower for trigger in triggers):
                if agent_name not in analysis["required_agents"]:
                    analysis["required_agents"].append(agent_name)

        # Default to engineer if no specific agent identified
        if not analysis["required_agents"]:
            analysis["required_agents"].append("ce-hub-engineer")

        # Determine workflow based on complexity and agents
        if len(analysis["required_agents"]) == 1:
            # Single agent workflow
            analysis["suggested_workflow"] = [
                {"agent": analysis["required_agents"][0], "stage": "implementation", "dependencies": []}
            ]
        else:
            # Multi-agent workflow
            analysis["suggested_workflow"] = self._create_multi_agent_workflow(
                analysis["required_agents"],
                analysis["complexity"]
            )

        # Estimate duration based on complexity and agent count
        duration_map = {
            TaskComplexity.SIMPLE: "30 minutes - 2 hours",
            TaskComplexity.MODERATE: "2-6 hours",
            TaskComplexity.COMPLEX: "6-24 hours",
            TaskComplexity.EXPERT: "24+ hours"
        }
        base_duration = duration_map[analysis["complexity"]]

        # Adjust for multiple agents
        if len(analysis["required_agents"]) > 1:
            agent_multiplier = 1 + (len(analysis["required_agents"]) - 1) * 0.3
            # Simple duration estimation adjustment
            hours = self._parse_duration_to_hours(base_duration)
            adjusted_hours = hours * agent_multiplier
            analysis["estimated_duration"] = f"{adjusted_hours:.1f} hours"

        # Identify missing information
        missing_patterns = [
            ("success criteria", ["success criteria", "requirements", "specifications"]),
            ("technical constraints", ["constraints", "limitations", "restrictions"]),
            ("timeline", ["deadline", "timeline", "when", "urgency"]),
            ("scope", ["scope", "boundaries", "what's included"]),
            ("dependencies", ["dependencies", "prerequisites", "requirements"])
        ]

        for missing_type, keywords in missing_patterns:
            if not any(keyword in request_lower for keyword in keywords):
                analysis["missing_information"].append(missing_type)

        # Identify risk factors
        risk_patterns = [
            ("ambiguous requirements", ["unclear", "not sure", "maybe", "think about"]),
            ("complex integration", ["integrate", "connect", "combine with"]),
            ("performance concerns", ["performance", "speed", "optimization"]),
            ("security implications", ["security", "authentication", "authorization"]),
            ("limited information", ["limited info", "not much detail", "basic idea"])
        ]

        for risk_type, keywords in risk_patterns:
            if any(keyword in request_lower for keyword in keywords):
                analysis["risk_factors"].append(risk_type)

        # Determine priority based on keywords
        if any(word in request_lower for word in ["urgent", "asap", "critical", "emergency"]):
            analysis["priority"] = TaskPriority.CRITICAL
        elif any(word in request_lower for word in ["high priority", "important", "soon"]):
            analysis["priority"] = TaskPriority.HIGH
        elif any(word in request_lower for word in ["when possible", "low priority", "no rush"]):
            analysis["priority"] = TaskPriority.LOW

        # Search for similar tasks in knowledge base
        try:
            similar_tasks = await ctx.deps.search_knowledge(request_text, match_count=3)
            analysis["similar_tasks"] = similar_tasks
        except Exception as e:
            ctx.deps.logger.warning(f"Failed to search for similar tasks: {e}")
            analysis["similar_tasks"] = []

        return analysis

    async def route_to_specialist_tool(
        self,
        agent_name: str,
        task_description: str,
        context: Dict[str, Any],
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Route a task to a specialist agent with proper context

        Args:
            agent_name: Name of the target specialist agent
            task_description: Description of the task to be routed
            context: Additional context for the agent
            ctx: Run context

        Returns:
            Routing result with task ID and status
        """
        routing_result = {
            "success": False,
            "task_id": None,
            "agent_name": agent_name,
            "status": "pending",
            "message": "",
            "estimated_start": None,
            "estimated_completion": None
        }

        try:
            # Validate agent exists
            available_agents = [
                "research-intelligence-specialist",
                "ce-hub-engineer",
                "ce-hub-gui-specialist",
                "qa-tester",
                "documentation-specialist",
                "trading-scanner-researcher",
                "quant-backtest-specialist",
                "edge-development-agent"
            ]

            if agent_name not in available_agents:
                routing_result["message"] = f"Unknown agent: {agent_name}"
                return routing_result

            # Generate task ID
            task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{agent_name}"
            routing_result["task_id"] = task_id

            # Create enhanced context for the specialist
            specialist_context = {
                "original_request": task_description,
                "orchestrator_analysis": context,
                "routing_info": {
                    "routed_by": "ce-hub-orchestrator-enhanced",
                    "routing_timestamp": datetime.now().isoformat(),
                    "task_id": task_id
                },
                "project_context": ctx.deps.project_context.dict(),
                "requirements": ctx.deps.requirements.dict() if ctx.deps.requirements else None
            }

            # Store task in orchestrator state
            ctx.deps.set_shared_state(f"task_{task_id}", {
                "agent": agent_name,
                "description": task_description,
                "context": specialist_context,
                "status": "routed",
                "created_at": datetime.now().isoformat(),
                "dependencies": context.get("dependencies", [])
            })

            # Estimate timing
            current_time = datetime.now()
            routing_result["estimated_start"] = current_time.isoformat()

            # Estimate completion based on complexity
            complexity = context.get("complexity", TaskComplexity.MODERATE)
            duration_map = {
                TaskComplexity.SIMPLE: timedelta(hours=2),
                TaskComplexity.MODERATE: timedelta(hours=6),
                TaskComplexity.COMPLEX: timedelta(hours=24),
                TaskComplexity.EXPERT: timedelta(hours=48)
            }
            estimated_completion = current_time + duration_map[complexity]
            routing_result["estimated_completion"] = estimated_completion.isoformat()

            # Log routing
            ctx.deps.logger.info(f"Routed task {task_id} to {agent_name}")

            routing_result["success"] = True
            routing_result["status"] = "routed"
            routing_result["message"] = f"Successfully routed task to {agent_name}"

        except Exception as e:
            ctx.deps.logger.error(f"Failed to route task to {agent_name}: {e}")
            routing_result["message"] = f"Routing failed: {str(e)}"

        return routing_result

    async def create_workflow_tool(
        self,
        tasks: List[Dict[str, Any]],
        dependencies: List[Dict[str, str]],
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Create a multi-agent workflow with task dependencies

        Args:
            tasks: List of tasks to execute
            dependencies: List of task dependencies
            ctx: Run context

        Returns:
            Workflow definition with execution plan
        """
        workflow = {
            "workflow_id": f"workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "tasks": tasks,
            "dependencies": dependencies,
            "execution_plan": [],
            "estimated_duration": "0 hours",
            "risk_factors": [],
            "critical_path": []
        }

        try:
            # Validate tasks
            if not tasks:
                workflow["risk_factors"].append("No tasks defined in workflow")
                return workflow

            # Create task mapping
            task_map = {task["id"]: task for task in tasks}

            # Validate dependencies
            for dep in dependencies:
                if dep["task"] not in task_map:
                    workflow["risk_factors"].append(f"Invalid dependency task: {dep['task']}")
                if dep["depends_on"] not in task_map:
                    workflow["risk_factors"].append(f"Invalid dependency: {dep['depends_on']}")

            # Build execution plan using topological sort
            execution_plan = []
            completed_tasks = set()
            remaining_tasks = set(task["id"] for task in tasks)

            while remaining_tasks:
                # Find tasks with all dependencies completed
                ready_tasks = []
                for task_id in remaining_tasks:
                    task_deps = [
                        dep["depends_on"] for dep in dependencies
                        if dep["task"] == task_id
                    ]

                    if all(dep_id in completed_tasks for dep_id in task_deps):
                        ready_tasks.append(task_id)

                if not ready_tasks:
                    workflow["risk_factors"].append("Circular dependency detected in workflow")
                    break

                # Add ready tasks to execution plan (can run in parallel)
                execution_plan.append(ready_tasks)
                completed_tasks.update(ready_tasks)
                remaining_tasks -= set(ready_tasks)

            workflow["execution_plan"] = execution_plan

            # Calculate estimated duration
            total_duration = 0
            for stage in execution_plan:
                # Within a stage, tasks run in parallel, so take the longest
                stage_duration = max(
                    task.get("estimated_duration", 0)
                    for task_id in stage
                    for task in tasks
                    if task["id"] == task_id
                )
                total_duration += stage_duration

            workflow["estimated_duration"] = f"{total_duration:.1f} hours"

            # Identify critical path
            if execution_plan:
                workflow["critical_path"] = execution_plan[0] if execution_plan else []

            # Store workflow in shared state
            ctx.deps.set_shared_state(f"workflow_{workflow['workflow_id']}", workflow)

            ctx.deps.logger.info(f"Created workflow {workflow['workflow_id']} with {len(tasks)} tasks")

        except Exception as e:
            ctx.deps.logger.error(f"Failed to create workflow: {e}")
            workflow["risk_factors"].append(f"Workflow creation error: {str(e)}")

        return workflow

    async def monitor_progress_tool(
        self,
        workflow_id: Optional[str] = None,
        task_id: Optional[str] = None,
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Monitor progress of workflows and tasks

        Args:
            workflow_id: Optional workflow ID to monitor
            task_id: Optional task ID to monitor
            ctx: Run context

        Returns:
            Current progress status and metrics
        """
        progress_report = {
            "timestamp": datetime.now().isoformat(),
            "workflows": {},
            "tasks": {},
            "overall_status": "unknown",
            "completion_percentage": 0.0,
            "issues": []
        }

        try:
            # Monitor specific workflow
            if workflow_id:
                workflow = ctx.deps.get_shared_state(f"workflow_{workflow_id}")
                if workflow:
                    progress_report["workflows"][workflow_id] = await self._monitor_workflow_progress(workflow, ctx)

            # Monitor specific task
            if task_id:
                task = ctx.deps.get_shared_state(f"task_{task_id}")
                if task:
                    progress_report["tasks"][task_id] = await self._monitor_task_progress(task, ctx)

            # If no specific items provided, monitor all active workflows and tasks
            if not workflow_id and not task_id:
                # Monitor all workflows
                for key in ctx.deps.shared_memory.keys():
                    if key.startswith("workflow_"):
                        workflow_id = key.replace("workflow_", "")
                        workflow = ctx.deps.get_shared_state(key)
                        if workflow:
                            progress_report["workflows"][workflow_id] = await self._monitor_workflow_progress(workflow, ctx)

                # Monitor all tasks
                for key in ctx.deps.shared_memory.keys():
                    if key.startswith("task_"):
                        task_id = key.replace("task_", "")
                        task = ctx.deps.get_shared_state(key)
                        if task:
                            progress_report["tasks"][task_id] = await self._monitor_task_progress(task, ctx)

            # Calculate overall status
            total_workflows = len(progress_report["workflows"])
            total_tasks = len(progress_report["tasks"])

            if total_workflows > 0 or total_tasks > 0:
                completed_items = sum(
                    1 for status in progress_report["workflows"].values()
                    if status.get("status") == "completed"
                ) + sum(
                    1 for status in progress_report["tasks"].values()
                    if status.get("status") == "completed"
                )

                progress_report["completion_percentage"] = (
                    (completed_items / (total_workflows + total_tasks)) * 100
                )

                # Determine overall status
                if progress_report["completion_percentage"] == 100:
                    progress_report["overall_status"] = "completed"
                elif any(status.get("status") == "error" for status in list(progress_report["workflows"].values()) + list(progress_report["tasks"].values())):
                    progress_report["overall_status"] = "has_issues"
                else:
                    progress_report["overall_status"] = "in_progress"

        except Exception as e:
            ctx.deps.logger.error(f"Failed to monitor progress: {e}")
            progress_report["issues"].append(f"Monitoring error: {str(e)}")

        return progress_report

    async def validate_workflow_tool(
        self,
        workflow_id: str,
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Validate workflow design and execution plan

        Args:
            workflow_id: Workflow ID to validate
            ctx: Run context

        Returns:
            Validation results with recommendations
        """
        validation_result = {
            "workflow_id": workflow_id,
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "recommendations": [],
            "score": 1.0
        }

        try:
            workflow = ctx.deps.get_shared_state(f"workflow_{workflow_id}")
            if not workflow:
                validation_result["is_valid"] = False
                validation_result["errors"].append("Workflow not found")
                return validation_result

            tasks = workflow.get("tasks", [])
            dependencies = workflow.get("dependencies", [])
            execution_plan = workflow.get("execution_plan", [])

            # Validate tasks
            if not tasks:
                validation_result["is_valid"] = False
                validation_result["errors"].append("No tasks defined in workflow")
            else:
                # Check for required task fields
                for task in tasks:
                    if "id" not in task:
                        validation_result["warnings"].append(f"Task missing ID: {task}")
                    if "agent" not in task:
                        validation_result["errors"].append(f"Task {task.get('id', 'unknown')} missing agent assignment")
                        validation_result["is_valid"] = False
                    if "description" not in task:
                        validation_result["warnings"].append(f"Task {task.get('id', 'unknown')} missing description")

            # Validate dependencies
            task_ids = {task["id"] for task in tasks if "id" in task}
            for dep in dependencies:
                if dep.get("task") not in task_ids:
                    validation_result["errors"].append(f"Dependency refers to non-existent task: {dep.get('task')}")
                    validation_result["is_valid"] = False
                if dep.get("depends_on") not in task_ids:
                    validation_result["errors"].append(f"Dependency refers to non-existent task: {dep.get('depends_on')}")
                    validation_result["is_valid"] = False

            # Validate execution plan
            if not execution_plan:
                validation_result["warnings"].append("No execution plan defined")
            else:
                # Check that all tasks are in the execution plan
                planned_tasks = set()
                for stage in execution_plan:
                    planned_tasks.update(stage)

                missing_tasks = task_ids - planned_tasks
                if missing_tasks:
                    validation_result["errors"].append(f"Tasks not in execution plan: {missing_tasks}")
                    validation_result["is_valid"] = False

            # Generate recommendations
            if len(tasks) > 10:
                validation_result["recommendations"].append("Consider breaking large workflow into smaller sub-workflows")

            if any(dep.get("type") == "strong" for dep in dependencies):
                validation_result["recommendations"].append("Strong dependencies detected - ensure sequence is critical")

            if not any(task.get("agent") == "qa-tester" for task in tasks):
                validation_result["recommendations"].append("Consider adding QA testing to ensure quality")

            # Calculate score
            if validation_result["errors"]:
                validation_result["score"] = 0.3
            elif validation_result["warnings"]:
                validation_result["score"] = 0.7
            elif validation_result["recommendations"]:
                validation_result["score"] = 0.9

        except Exception as e:
            ctx.deps.logger.error(f"Failed to validate workflow {workflow_id}: {e}")
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"Validation error: {str(e)}")
            validation_result["score"] = 0.0

        return validation_result

    async def coordinate_agents_tool(
        self,
        coordination_request: Dict[str, Any],
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Coordinate between multiple agents for complex tasks

        Args:
            coordination_request: Coordination request details
            ctx: Run context

        Returns:
            Coordination results and next steps
        """
        coordination_result = {
            "success": False,
            "coordination_id": f"coord_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "agents_involved": [],
            "coordination_plan": [],
            "status": "pending",
            "message": ""
        }

        try:
            coordination_type = coordination_request.get("type", "sequential")
            agents = coordination_request.get("agents", [])
            tasks = coordination_request.get("tasks", [])

            if not agents or not tasks:
                coordination_result["message"] = "Missing agents or tasks for coordination"
                return coordination_result

            coordination_result["agents_involved"] = agents

            # Create coordination plan based on type
            if coordination_type == "sequential":
                coordination_result["coordination_plan"] = self._create_sequential_plan(agents, tasks)
            elif coordination_type == "parallel":
                coordination_result["coordination_plan"] = self._create_parallel_plan(agents, tasks)
            elif coordination_type == "pipeline":
                coordination_result["coordination_plan"] = self._create_pipeline_plan(agents, tasks)
            else:
                coordination_result["message"] = f"Unknown coordination type: {coordination_type}"
                return coordination_result

            # Store coordination in shared state
            ctx.deps.set_shared_state(
                f"coordination_{coordination_result['coordination_id']}",
                {
                    "type": coordination_type,
                    "agents": agents,
                    "tasks": tasks,
                    "plan": coordination_result["coordination_plan"],
                    "status": "created",
                    "created_at": datetime.now().isoformat()
                }
            )

            coordination_result["success"] = True
            coordination_result["status"] = "ready"
            coordination_result["message"] = "Coordination plan created successfully"

        except Exception as e:
            ctx.deps.logger.error(f"Failed to coordinate agents: {e}")
            coordination_result["message"] = f"Coordination failed: {str(e)}"

        return coordination_result

    async def gather_requirements_tool(
        self,
        user_input: str,
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """
        Enhanced requirements gathering for orchestrator

        Args:
            user_input: Initial user input
            ctx: Run context

        Returns:
            Structured requirements and analysis
        """
        # Use the base agent's requirement gathering with orchestrator-specific enhancements
        requirements = await self.gather_requirements(user_input, ctx.deps)

        # Add orchestrator-specific analysis
        analysis = await self.analyze_request_tool(user_input, ctx)

        return {
            "requirements": requirements.dict(),
            "analysis": analysis,
            "orchestrator_recommendations": self._generate_orchestrator_recommendations(requirements, analysis),
            "next_steps": self._generate_next_steps(requirements, analysis)
        }

    # Helper methods
    def _create_multi_agent_workflow(self, agents: List[str], complexity: TaskComplexity) -> List[Dict[str, Any]]:
        """Create workflow for multiple agents"""
        workflow = []

        # Common workflow patterns
        if "research-intelligence-specialist" in agents:
            workflow.append({
                "agent": "research-intelligence-specialist",
                "stage": "research",
                "dependencies": []
            })

        # Engineering stage (often comes after research)
        engineering_agents = [agent for agent in agents if "engineer" in agent or "gui" in agent]
        if engineering_agents:
            for agent in engineering_agents:
                workflow.append({
                    "agent": agent,
                    "stage": "implementation",
                    "dependencies": ["research"] if "research-intelligence-specialist" in agents else []
                })

        # QA stage
        if "qa-tester" in agents:
            workflow.append({
                "agent": "qa-tester",
                "stage": "testing",
                "dependencies": ["implementation"]
            })

        # Documentation stage
        if "documentation-specialist" in agents:
            workflow.append({
                "agent": "documentation-specialist",
                "stage": "documentation",
                "dependencies": ["testing"] if "qa-tester" in agents else ["implementation"]
            })

        return workflow

    def _parse_duration_to_hours(self, duration_str: str) -> float:
        """Parse duration string to hours"""
        try:
            if "hours" in duration_str:
                return float(duration_str.split("hours")[0].strip())
            elif "-" in duration_str:
                parts = duration_str.split("-")
                if "hour" in parts[1]:
                    return float(parts[1].split("hour")[0].strip())
            return 4.0  # Default
        except:
            return 4.0

    async def _monitor_workflow_progress(self, workflow: Dict[str, Any], ctx: RunContext[CEHubDependencies]) -> Dict[str, Any]:
        """Monitor progress of a specific workflow"""
        status = {
            "workflow_id": workflow.get("workflow_id"),
            "status": "unknown",
            "completed_tasks": 0,
            "total_tasks": len(workflow.get("tasks", [])),
            "current_stage": 0,
            "issues": []
        }

        # Check status of workflow tasks
        tasks = workflow.get("tasks", [])
        completed_count = 0

        for task in tasks:
            task_id = task.get("id")
            if task_id:
                task_progress = await self._monitor_task_progress({"id": task_id}, ctx)
                if task_progress.get("status") == "completed":
                    completed_count += 1
                elif task_progress.get("status") == "error":
                    status["issues"].append(f"Task {task_id} has errors")

        status["completed_tasks"] = completed_count

        if completed_count == len(tasks):
            status["status"] = "completed"
        elif completed_count > 0:
            status["status"] = "in_progress"
        else:
            status["status"] = "pending"

        return status

    async def _monitor_task_progress(self, task: Dict[str, Any], ctx: RunContext[CEHubDependencies]) -> Dict[str, Any]:
        """Monitor progress of a specific task"""
        return {
            "task_id": task.get("id"),
            "status": task.get("status", "unknown"),
            "agent": task.get("agent"),
            "created_at": task.get("created_at"),
            "updated_at": task.get("updated_at")
        }

    def _create_sequential_plan(self, agents: List[str], tasks: List[str]) -> List[Dict[str, Any]]:
        """Create sequential coordination plan"""
        return [
            {
                "step": i + 1,
                "agent": agents[i] if i < len(agents) else agents[0],
                "task": tasks[i] if i < len(tasks) else "Execute task",
                "dependencies": [f"step_{i}"] if i > 0 else []
            }
            for i in range(max(len(agents), len(tasks)))
        ]

    def _create_parallel_plan(self, agents: List[str], tasks: List[str]) -> List[Dict[str, Any]]:
        """Create parallel coordination plan"""
        return [
            {
                "step": 1,
                "agents": agents,
                "tasks": tasks,
                "dependencies": [],
                "execution": "parallel"
            }
        ]

    def _create_pipeline_plan(self, agents: List[str], tasks: List[str]) -> List[Dict[str, Any]]:
        """Create pipeline coordination plan"""
        return [
            {
                "step": i + 1,
                "agent": agents[i] if i < len(agents) else agents[-1],
                "task": tasks[i] if i < len(tasks) else tasks[-1],
                "dependencies": [f"step_{i}"] if i > 0 else [],
                "execution": "pipeline"
            }
            for i in range(max(len(agents), len(tasks)))
        ]

    def _generate_orchestrator_recommendations(self, requirements: ProjectRequirements, analysis: Dict[str, Any]) -> List[str]:
        """Generate orchestrator-specific recommendations"""
        recommendations = []

        # Based on complexity
        if analysis.get("complexity") == TaskComplexity.EXPERT:
            recommendations.append("Consider breaking this into multiple smaller tasks for better manageability")

        # Based on agents needed
        required_agents = analysis.get("required_agents", [])
        if len(required_agents) > 3:
            recommendations.append("Multiple agents required - ensure clear handoffs and context preservation")

        # Based on risk factors
        risk_factors = analysis.get("risk_factors", [])
        if "ambiguous requirements" in risk_factors:
            recommendations.append("Requirements need clarification before proceeding with implementation")
        if "complex integration" in risk_factors:
            recommendations.append("Integration complexity suggests thorough testing will be required")

        # Based on missing information
        missing_info = analysis.get("missing_information", [])
        if missing_info:
            recommendations.append(f"Gather missing information: {', '.join(missing_info)}")

        return recommendations

    def _generate_next_steps(self, requirements: ProjectRequirements, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommended next steps"""
        steps = []

        # Start with requirements validation
        steps.append("Validate and finalize requirements with user confirmation")

        # Check if research is needed
        if "research-intelligence-specialist" in analysis.get("required_agents", []):
            steps.append("Conduct research to inform implementation approach")

        # Implementation steps
        if "ce-hub-engineer" in analysis.get("required_agents", []):
            steps.append("Implement core functionality and technical components")

        if "ce-hub-gui-specialist" in analysis.get("required_agents", []):
            steps.append("Design and implement user interface components")

        # Quality assurance
        if "qa-tester" in analysis.get("required_agents", []):
            steps.append("Perform comprehensive testing and quality assurance")

        # Documentation
        if "documentation-specialist" in analysis.get("required_agents", []):
            steps.append("Create documentation and user guides")

        # Final step
        steps.append("Review completed work against success criteria")

        return steps


# Factory function for easy instantiation
def create_enhanced_orchestrator() -> CEHubOrchestratorEnhanced:
    """Create an enhanced orchestrator instance"""
    return CEHubOrchestratorEnhanced()
```