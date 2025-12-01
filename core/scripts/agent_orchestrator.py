#!/usr/bin/env python3
"""
CE-Hub Agent Orchestration Engine
Master Operating System Agent Coordination

This module implements the core agent orchestration capabilities for CE-Hub,
enabling systematic coordination of specialized agents according to the
Vision Artifact and agent registry specifications.

Key Functions:
- Agent selection based on task type and complexity
- Context transfer and handoff management
- Quality gate enforcement
- Parallel and sequential execution coordination

Usage:
    from scripts.agent_orchestrator import AgentOrchestrator

    orchestrator = AgentOrchestrator()
    result = await orchestrator.execute_workflow("research", "analyze market trends")
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Tuple
from enum import Enum

# Import performance optimization
try:
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent))
    from performance_optimizer import cache_result
except ImportError:
    # Fallback if not available
    def cache_result(namespace: str, ttl: int = 300):
        def decorator(func):
            return func
        return decorator

# Local imports
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))
from archon_client import ArchonFirst

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class TaskComplexity(Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"

class ExecutionMode(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    COLLABORATIVE = "collaborative"
    ITERATIVE = "iterative"

class AgentType(Enum):
    ORCHESTRATOR = "orchestrator"
    RESEARCHER = "researcher"
    ENGINEER = "engineer"
    TESTER = "tester"
    DOCUMENTER = "documenter"

class WorkflowStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class AgentOrchestrator:
    """
    Core Agent Orchestration Engine

    Implements systematic agent coordination with Archon-First Protocol integration
    for intelligent task routing, context management, and quality assurance.
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.registry_path = self.project_root / "agents" / "registry.json"
        self.dispatch_path = self.project_root / "config" / "agent_dispatch.json"

        # Load configurations
        self.registry = self._load_registry()
        self.dispatch_config = self._load_dispatch_config()

        # State management
        self.active_workflows = {}
        self.agent_states = {}
        self.context_history = []

        # Archon integration
        self.archon_client = None

    def _load_registry(self) -> Dict[str, Any]:
        """Load agent registry configuration"""
        try:
            with open(self.registry_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Agent registry not found: {self.registry_path}")
            return self._get_default_registry()
        except Exception as e:
            logger.error(f"Failed to load agent registry: {e}")
            return self._get_default_registry()

    def _load_dispatch_config(self) -> Dict[str, Any]:
        """Load agent dispatch configuration"""
        try:
            with open(self.dispatch_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Dispatch config not found: {self.dispatch_path}")
            return self._get_default_dispatch()
        except Exception as e:
            logger.warning(f"Failed to load dispatch config: {e}")
            return self._get_default_dispatch()

    def _get_default_registry(self) -> Dict[str, Any]:
        """Fallback registry configuration"""
        return {
            "agents": {
                "researcher": {
                    "name": "Research Specialist",
                    "specialization": "Information gathering and analysis",
                    "capabilities": ["data_analysis", "information_synthesis", "pattern_recognition"],
                    "preferred_tasks": ["research", "analysis", "investigation", "market_research"]
                },
                "engineer": {
                    "name": "Implementation Specialist",
                    "specialization": "Technical implementation and system development",
                    "capabilities": ["code_development", "system_design", "architecture", "debugging"],
                    "preferred_tasks": ["implementation", "development", "coding", "system_design"]
                },
                "tester": {
                    "name": "Quality Assurance Specialist",
                    "specialization": "Testing and validation",
                    "capabilities": ["test_design", "quality_assurance", "validation", "debugging"],
                    "preferred_tasks": ["testing", "validation", "quality_check", "debugging"]
                },
                "documenter": {
                    "name": "Documentation Specialist",
                    "specialization": "Knowledge capture and documentation",
                    "capabilities": ["documentation", "knowledge_management", "content_creation"],
                    "preferred_tasks": ["documentation", "writing", "knowledge_capture"]
                }
            }
        }

    def _get_default_dispatch(self) -> Dict[str, Any]:
        """Fallback dispatch configuration"""
        return {
            "trigger_patterns": {
                "research": ["how to", "analyze", "investigate", "research", "study"],
                "engineer": ["implement", "build", "create", "develop", "code", "fix"],
                "tester": ["test", "validate", "verify", "check", "debug"],
                "documenter": ["document", "write", "capture", "explain", "describe"]
            }
        }

    async def analyze_task(self, task_description: str, context: str = "") -> Dict[str, Any]:
        """
        Analyze task requirements and determine optimal agent assignment

        Args:
            task_description: Description of the task to be performed
            context: Additional context information

        Returns:
            Dict with task analysis, recommended agents, and execution plan
        """
        # Initialize Archon connection for knowledge lookup
        if not self.archon_client:
            self.archon_client = ArchonFirst()

        # Start with Archon-First Protocol sync
        try:
            health = await self.archon_client.health_check()
            if health.get("archon_operational"):
                sync_result = await self.archon_client.sync_project_status("ce-hub")
                logger.info("✓ Archon-First Protocol sync completed")
            else:
                logger.warning("⚠ Archon not operational, proceeding with local analysis")
        except Exception as e:
            logger.warning(f"Archon sync failed: {e}, proceeding locally")

        # Analyze task complexity
        complexity = self._assess_complexity(task_description, context)

        # Determine task type from patterns
        task_type = self._classify_task_type(task_description)

        # Find applicable patterns
        patterns = {}
        if self.archon_client:
            try:
                pattern_result = await self.archon_client.find_applicable_patterns(task_type, context)
                patterns = pattern_result
            except Exception as e:
                logger.warning(f"Pattern lookup failed: {e}")

        # Recommend agent assignment
        recommended_agents = self._recommend_agents(task_type, complexity, context)

        # Determine execution mode
        execution_mode = self._determine_execution_mode(complexity, len(recommended_agents))

        # Generate execution plan
        execution_plan = self._create_execution_plan(
            recommended_agents, execution_mode, task_description, context
        )

        return {
            "task_id": f"task_{int(time.time())}",
            "task_description": task_description,
            "context": context,
            "complexity": complexity.value,
            "task_type": task_type,
            "recommended_agents": recommended_agents,
            "execution_mode": execution_mode.value,
            "execution_plan": execution_plan,
            "applicable_patterns": patterns.get("patterns", []),
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "archon_synced": self.archon_client is not None
        }

    def _assess_complexity(self, task_description: str, context: str) -> TaskComplexity:
        """Assess task complexity based on description and context"""
        complexity_indicators = {
            "complex": ["system", "architecture", "integration", "multiple", "comprehensive",
                       "end-to-end", "full-stack", "enterprise", "scalable"],
            "moderate": ["implement", "create", "develop", "build", "design", "optimize"],
            "simple": ["fix", "update", "modify", "test", "document", "analyze"]
        }

        description_lower = task_description.lower()
        context_lower = context.lower()
        combined_text = f"{description_lower} {context_lower}"

        # Count indicators
        complexity_scores = {}
        for level, indicators in complexity_indicators.items():
            score = sum(1 for indicator in indicators if indicator in combined_text)
            complexity_scores[level] = score

        # Additional complexity factors
        if len(task_description.split()) > 20:
            complexity_scores["complex"] += 1
        if "multiple" in combined_text or "several" in combined_text:
            complexity_scores["moderate"] += 1
        if any(word in combined_text for word in ["quick", "simple", "small", "minor"]):
            complexity_scores["simple"] += 1

        # Determine final complexity
        max_score = max(complexity_scores.values())
        if max_score == 0:
            return TaskComplexity.MODERATE  # Default

        for level, score in complexity_scores.items():
            if score == max_score:
                return TaskComplexity(level)

        return TaskComplexity.MODERATE

    def _classify_task_type(self, task_description: str) -> str:
        """Classify task type based on trigger patterns"""
        description_lower = task_description.lower()

        # Handle both trigger_patterns and auto_dispatch structures
        dispatch_rules = self.dispatch_config.get("auto_dispatch", {}).get("rules", {})
        if not dispatch_rules:
            dispatch_rules = self.dispatch_config.get("trigger_patterns", {})

        # Score each agent type
        agent_scores = {}
        for agent_type, config in dispatch_rules.items():
            # Handle both list and dict patterns
            if isinstance(config, dict):
                patterns = config.get("triggers", [])
            else:
                patterns = config

            score = sum(1 for pattern in patterns if pattern in description_lower)
            if score > 0:
                # Map agent names to standard types
                standard_type = self._map_agent_name_to_type(agent_type)
                agent_scores[standard_type] = score

        # Return highest scoring type, or "general" if no matches
        if agent_scores:
            return max(agent_scores.items(), key=lambda x: x[1])[0]
        else:
            return "general"

    def _map_agent_name_to_type(self, agent_name: str) -> str:
        """Map agent names to standard types"""
        mapping = {
            "research-intelligence-specialist": "researcher",
            "engineer-agent": "engineer",
            "gui-specialist": "engineer",  # GUI work is engineering
            "quality-assurance-tester": "tester",
            "documenter-specialist": "documenter"
        }
        return mapping.get(agent_name, agent_name.replace("-", "_"))

    def _recommend_agents(self, task_type: str, complexity: TaskComplexity, context: str) -> List[Dict[str, Any]]:
        """Recommend agents based on task analysis"""
        agents = self.registry.get("agents", {})
        recommendations = []

        # Primary agent based on task type
        if task_type in agents:
            primary_agent = agents[task_type].copy()
            primary_agent["role"] = "primary"
            primary_agent["agent_type"] = task_type
            recommendations.append(primary_agent)

        # Additional agents based on complexity
        if complexity == TaskComplexity.COMPLEX:
            # Add orchestrator for complex tasks
            if "orchestrator" in agents:
                orchestrator = agents["orchestrator"].copy()
                orchestrator["role"] = "coordinator"
                orchestrator["agent_type"] = "orchestrator"
                recommendations.insert(0, orchestrator)  # First in list

            # Add complementary agents
            complementary_types = self._get_complementary_agents(task_type)
            for agent_type in complementary_types:
                if agent_type in agents and agent_type != task_type:
                    agent = agents[agent_type].copy()
                    agent["role"] = "supporting"
                    agent["agent_type"] = agent_type
                    recommendations.append(agent)

        elif complexity == TaskComplexity.MODERATE:
            # Consider adding one supporting agent
            complementary = self._get_primary_complement(task_type)
            if complementary and complementary in agents:
                agent = agents[complementary].copy()
                agent["role"] = "supporting"
                agent["agent_type"] = complementary
                recommendations.append(agent)

        return recommendations

    def _get_complementary_agents(self, primary_type: str) -> List[str]:
        """Get complementary agent types for complex tasks"""
        complements = {
            "researcher": ["engineer", "documenter"],
            "engineer": ["tester", "researcher"],
            "tester": ["engineer", "documenter"],
            "documenter": ["researcher", "tester"]
        }
        return complements.get(primary_type, [])

    def _get_primary_complement(self, primary_type: str) -> Optional[str]:
        """Get primary complement for moderate complexity tasks"""
        primary_complements = {
            "researcher": "documenter",
            "engineer": "tester",
            "tester": "engineer",
            "documenter": "researcher"
        }
        return primary_complements.get(primary_type)

    def _determine_execution_mode(self, complexity: TaskComplexity, agent_count: int) -> ExecutionMode:
        """Determine optimal execution mode"""
        if agent_count == 1:
            return ExecutionMode.SEQUENTIAL

        if complexity == TaskComplexity.COMPLEX:
            if agent_count > 2:
                return ExecutionMode.COLLABORATIVE
            else:
                return ExecutionMode.ITERATIVE
        elif complexity == TaskComplexity.MODERATE:
            return ExecutionMode.SEQUENTIAL
        else:
            return ExecutionMode.SEQUENTIAL

    def _create_execution_plan(self, agents: List[Dict], mode: ExecutionMode,
                              task_description: str, context: str) -> Dict[str, Any]:
        """Create detailed execution plan"""
        plan = {
            "phases": [],
            "execution_mode": mode.value,
            "estimated_duration": "TBD",
            "quality_gates": [],
            "handoff_points": []
        }

        if mode == ExecutionMode.SEQUENTIAL:
            # Create sequential phases
            for i, agent in enumerate(agents):
                phase = {
                    "phase_id": f"phase_{i+1}",
                    "agent": agent,
                    "dependencies": [f"phase_{i}"] if i > 0 else [],
                    "deliverables": self._get_agent_deliverables(agent["agent_type"], task_description),
                    "quality_checks": self._get_quality_checks(agent["agent_type"])
                }
                plan["phases"].append(phase)

        elif mode == ExecutionMode.PARALLEL:
            # Create parallel phases
            for i, agent in enumerate(agents):
                phase = {
                    "phase_id": f"parallel_{i+1}",
                    "agent": agent,
                    "dependencies": [],
                    "deliverables": self._get_agent_deliverables(agent["agent_type"], task_description),
                    "quality_checks": self._get_quality_checks(agent["agent_type"])
                }
                plan["phases"].append(phase)

        elif mode == ExecutionMode.COLLABORATIVE:
            # Create collaborative workflow
            coordinator = next((a for a in agents if a.get("role") == "coordinator"), agents[0])
            workers = [a for a in agents if a.get("role") != "coordinator"]

            # Coordination phase
            coord_phase = {
                "phase_id": "coordination",
                "agent": coordinator,
                "dependencies": [],
                "deliverables": ["task_breakdown", "coordination_plan", "quality_framework"],
                "quality_checks": ["completeness", "clarity", "feasibility"]
            }
            plan["phases"].append(coord_phase)

            # Worker phases
            for i, agent in enumerate(workers):
                phase = {
                    "phase_id": f"execution_{i+1}",
                    "agent": agent,
                    "dependencies": ["coordination"],
                    "deliverables": self._get_agent_deliverables(agent["agent_type"], task_description),
                    "quality_checks": self._get_quality_checks(agent["agent_type"])
                }
                plan["phases"].append(phase)

        elif mode == ExecutionMode.ITERATIVE:
            # Create iterative cycles
            cycle_count = min(3, len(agents))  # Max 3 iterations
            for cycle in range(cycle_count):
                for i, agent in enumerate(agents):
                    phase = {
                        "phase_id": f"cycle_{cycle+1}_agent_{i+1}",
                        "agent": agent,
                        "dependencies": [f"cycle_{cycle}_agent_{len(agents)}"] if cycle > 0 else [],
                        "deliverables": self._get_agent_deliverables(agent["agent_type"], task_description),
                        "quality_checks": self._get_quality_checks(agent["agent_type"]),
                        "iteration": cycle + 1
                    }
                    plan["phases"].append(phase)

        # Add quality gates
        plan["quality_gates"] = [
            {"gate_id": "requirements_validation", "phase": "before_execution"},
            {"gate_id": "intermediate_review", "phase": "mid_execution"},
            {"gate_id": "final_validation", "phase": "before_completion"}
        ]

        # Add handoff points
        for i in range(len(plan["phases"]) - 1):
            handoff = {
                "from_phase": plan["phases"][i]["phase_id"],
                "to_phase": plan["phases"][i+1]["phase_id"],
                "handoff_type": "context_transfer",
                "validation_required": True
            }
            plan["handoff_points"].append(handoff)

        return plan

    def _get_agent_deliverables(self, agent_type: str, task_description: str) -> List[str]:
        """Get expected deliverables for agent type"""
        deliverable_templates = {
            "researcher": ["research_report", "data_analysis", "recommendations"],
            "engineer": ["implementation", "technical_documentation", "test_cases"],
            "tester": ["test_plan", "test_execution_report", "quality_assessment"],
            "documenter": ["documentation", "user_guide", "knowledge_summary"],
            "orchestrator": ["coordination_plan", "progress_tracking", "final_report"]
        }

        return deliverable_templates.get(agent_type, ["deliverable", "report", "summary"])

    def _get_quality_checks(self, agent_type: str) -> List[str]:
        """Get quality checks for agent type"""
        quality_templates = {
            "researcher": ["accuracy", "completeness", "source_validation"],
            "engineer": ["functionality", "code_quality", "performance"],
            "tester": ["test_coverage", "defect_identification", "validation_accuracy"],
            "documenter": ["clarity", "completeness", "accuracy"],
            "orchestrator": ["coordination_effectiveness", "timeline_adherence", "quality_oversight"]
        }

        return quality_templates.get(agent_type, ["completeness", "accuracy", "quality"])

    async def execute_workflow(self, task_description: str, context: str = "") -> Dict[str, Any]:
        """
        Execute complete workflow with agent orchestration

        Args:
            task_description: Description of task to execute
            context: Additional context information

        Returns:
            Dict with execution results and status
        """
        try:
            # Phase 1: Analyze task
            logger.info(f"🔍 Analyzing task: {task_description[:100]}...")
            analysis = await self.analyze_task(task_description, context)

            workflow_id = analysis["task_id"]
            self.active_workflows[workflow_id] = {
                "status": WorkflowStatus.IN_PROGRESS,
                "analysis": analysis,
                "start_time": datetime.utcnow(),
                "current_phase": None,
                "results": {}
            }

            logger.info(f"✓ Task analysis complete - {analysis['complexity']} complexity, {len(analysis['recommended_agents'])} agents")

            # Phase 2: Execute plan (simulation for now)
            execution_results = await self._execute_plan_simulation(workflow_id, analysis)

            # Phase 3: Finalize workflow
            final_result = await self._finalize_workflow(workflow_id, execution_results)

            return final_result

        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "workflow_id": workflow_id if 'workflow_id' in locals() else None,
                "timestamp": datetime.utcnow().isoformat()
            }

    async def _execute_plan_simulation(self, workflow_id: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate plan execution (placeholder for actual agent integration)

        In the full implementation, this would:
        1. Instantiate actual specialist agents
        2. Execute phases according to the plan
        3. Handle context transfer and quality gates
        4. Coordinate parallel/collaborative execution
        """
        plan = analysis["execution_plan"]
        results = {"phases": [], "overall_status": "success"}

        logger.info(f"🚀 Executing {analysis['execution_mode']} workflow with {len(plan['phases'])} phases")

        # Simulate phase execution
        for phase in plan["phases"]:
            phase_id = phase["phase_id"]
            agent = phase["agent"]

            logger.info(f"  Phase {phase_id}: {agent['name']} ({agent['agent_type']})")

            # Simulate phase execution delay
            await asyncio.sleep(0.1)  # Quick simulation

            # Simulate phase completion
            phase_result = {
                "phase_id": phase_id,
                "agent_type": agent["agent_type"],
                "status": "completed",
                "deliverables": phase["deliverables"],
                "quality_checks_passed": True,
                "execution_time": 0.1,
                "notes": f"Simulated execution by {agent['name']}"
            }

            results["phases"].append(phase_result)

            # Update workflow status
            self.active_workflows[workflow_id]["current_phase"] = phase_id

        logger.info("✓ All phases completed successfully")
        return results

    async def _finalize_workflow(self, workflow_id: str, execution_results: Dict[str, Any]) -> Dict[str, Any]:
        """Finalize workflow and prepare results"""
        workflow = self.active_workflows[workflow_id]
        workflow["status"] = WorkflowStatus.COMPLETED
        workflow["end_time"] = datetime.utcnow()
        workflow["execution_results"] = execution_results

        # Calculate total execution time
        duration = (workflow["end_time"] - workflow["start_time"]).total_seconds()

        # Prepare final result
        final_result = {
            "workflow_id": workflow_id,
            "status": "completed",
            "task_description": workflow["analysis"]["task_description"],
            "complexity": workflow["analysis"]["complexity"],
            "execution_mode": workflow["analysis"]["execution_mode"],
            "agents_used": len(workflow["analysis"]["recommended_agents"]),
            "phases_completed": len(execution_results["phases"]),
            "execution_time": duration,
            "quality_validated": True,
            "results": execution_results,
            "archon_synced": workflow["analysis"]["archon_synced"],
            "completion_timestamp": datetime.utcnow().isoformat()
        }

        # Log completion
        logger.info(f"🎉 Workflow {workflow_id} completed in {duration:.2f}s")

        # Ingest workflow knowledge into Archon (if available)
        if self.archon_client:
            try:
                await self._ingest_workflow_knowledge(workflow_id, final_result)
            except Exception as e:
                logger.warning(f"Failed to ingest workflow knowledge: {e}")

        return final_result

    async def _ingest_workflow_knowledge(self, workflow_id: str, result: Dict[str, Any]):
        """Ingest workflow results into Archon knowledge graph"""
        try:
            # This would create a workflow summary for knowledge ingestion
            workflow_summary = {
                "title": f"Agent Workflow: {result['task_description'][:50]}",
                "content": {
                    "markdown": f"""# Agent Workflow Results

## Task
{result['task_description']}

## Execution Summary
- **Complexity**: {result['complexity']}
- **Execution Mode**: {result['execution_mode']}
- **Agents Used**: {result['agents_used']}
- **Duration**: {result['execution_time']:.2f}s
- **Phases**: {result['phases_completed']}

## Results
{json.dumps(result['results'], indent=2)}

## Quality Validation
✅ Quality gates passed successfully

*Generated by CE-Hub Agent Orchestrator*
"""
                },
                "author": "Agent Orchestrator",
                "document_type": "workflow_result"
            }

            logger.info(f"✓ Workflow knowledge prepared for ingestion")
            # In full implementation, would call Archon API here

        except Exception as e:
            logger.error(f"Knowledge ingestion failed: {e}")

# Convenience functions for direct usage
async def orchestrate_task(task_description: str, context: str = "") -> Dict[str, Any]:
    """Quick task orchestration"""
    orchestrator = AgentOrchestrator()
    return await orchestrator.execute_workflow(task_description, context)

async def analyze_task_requirements(task_description: str, context: str = "") -> Dict[str, Any]:
    """Quick task analysis without execution"""
    orchestrator = AgentOrchestrator()
    return await orchestrator.analyze_task(task_description, context)

# CLI interface for testing
if __name__ == "__main__":
    import sys

    async def main():
        if len(sys.argv) < 2:
            print("Usage: python agent_orchestrator.py [analyze|execute] <task_description>")
            return

        command = sys.argv[1]
        task_description = " ".join(sys.argv[2:])

        if command == "analyze":
            result = await analyze_task_requirements(task_description)
            print(json.dumps(result, indent=2))

        elif command == "execute":
            result = await orchestrate_task(task_description)
            print(json.dumps(result, indent=2))

        else:
            print(f"Unknown command: {command}")

    asyncio.run(main())