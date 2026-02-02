"""
Multi-Agent Coordinator for CE Hub
Provides intelligent agent orchestration and coordination
"""

from typing import Dict, List, Any, Optional, Set, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import json
from datetime import datetime, timedelta
from collections import defaultdict, deque

class AgentRole(Enum):
    """Agent roles in coordination"""
    LEAD = "lead"
    CONTRIBUTOR = "contributor"
    VALIDATOR = "validator"
    SPECIALIST = "specialist"
    FACILITATOR = "facilitator"

class CoordinationMode(Enum):
    """Coordination modes"""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    PIPELINE = "pipeline"
    COLLABORATIVE = "collaborative"
    COMPETITIVE = "competitive"

class Priority(Enum):
    """Task priorities"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4
    URGENT = 5

@dataclass
class AgentCapability:
    """Agent capability definition"""
    agent_id: str
    capabilities: Set[str] = field(default_factory=set)
    specializations: Set[str] = field(default_factory=set)
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    availability: float = 1.0  # 0.0 to 1.0
    current_load: int = 0
    max_concurrent_tasks: int = 3
    role: AgentRole = AgentRole.CONTRIBUTOR

@dataclass
class CoordinationTask:
    """Task to be coordinated among agents"""
    task_id: str
    description: str
    required_capabilities: Set[str] = field(default_factory=set)
    preferred_agents: List[str] = field(default_factory=list)
    excluded_agents: List[str] = field(default_factory=list)
    coordination_mode: CoordinationMode = CoordinationMode.SEQUENTIAL
    priority: Priority = Priority.MEDIUM
    estimated_duration: timedelta = field(default_factory=lambda: timedelta(minutes=30))
    dependencies: Set[str] = field(default_factory=set)
    input_data: Dict[str, Any] = field(default_factory=dict)
    output_requirements: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    deadline: Optional[datetime] = None

@dataclass
class TaskAssignment:
    """Task assignment to agents"""
    task_id: str
    agent_id: str
    assignment_time: datetime = field(default_factory=datetime.now)
    status: str = "assigned"  # assigned, in_progress, completed, failed
    progress: float = 0.0
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class MultiAgentCoordinator:
    """Intelligent multi-agent coordination system"""

    def __init__(self):
        self.agents: Dict[str, AgentCapability] = {}
        self.tasks: Dict[str, CoordinationTask] = {}
        self.assignments: Dict[str, List[TaskAssignment]] = defaultdict(list)
        self.task_queue: deque = deque()
        self.completed_tasks: List[str] = []
        self.failed_tasks: List[str] = []
        self.performance_history: Dict[str, List[float]] = defaultdict(list)
        self.coordination_strategies = {
            CoordinationMode.SEQUENTIAL: self._sequential_coordination,
            CoordinationMode.PARALLEL: self._parallel_coordination,
            CoordinationMode.PIPELINE: self._pipeline_coordination,
            CoordinationMode.COLLABORATIVE: self._collaborative_coordination,
            CoordinationMode.COMPETITIVE: self._competitive_coordination
        }
        self.load_balancer = LoadBalancer()
        self.conflict_resolver = ConflictResolver()

    def register_agent(self, capability: AgentCapability) -> None:
        """Register an agent with its capabilities"""
        self.agents[capability.agent_id] = capability
        self.load_balancer.register_agent(capability)

    def submit_task(self, task: CoordinationTask) -> str:
        """Submit a task for coordination"""
        self.tasks[task.task_id] = task
        self.task_queue.append(task.task_id)
        asyncio.create_task(self._process_task_queue())
        return task.task_id

    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get current task status"""
        if task_id not in self.tasks:
            return {"status": "not_found"}

        task = self.tasks[task_id]
        assignments = self.assignments[task_id]

        return {
            "task": {
                "id": task.task_id,
                "description": task.description,
                "priority": task.priority.name,
                "coordination_mode": task.coordination_mode.value,
                "created_at": task.created_at.isoformat(),
                "deadline": task.deadline.isoformat() if task.deadline else None
            },
            "assignments": [
                {
                    "agent_id": assignment.agent_id,
                    "status": assignment.status,
                    "progress": assignment.progress,
                    "assigned_at": assignment.assignment_time.isoformat()
                }
                for assignment in assignments
            ],
            "overall_status": self._calculate_task_status(task_id),
            "completion_percentage": self._calculate_completion_percentage(task_id)
        }

    async def _process_task_queue(self) -> None:
        """Process the task queue"""
        while self.task_queue:
            task_id = self.task_queue.popleft()
            task = self.tasks[task_id]

            # Check dependencies
            if not self._check_dependencies(task):
                # Re-queue if dependencies not met
                self.task_queue.append(task_id)
                await asyncio.sleep(1)
                continue

            # Assign agents and start coordination
            assigned_agents = await self._assign_agents(task)
            if assigned_agents:
                asyncio.create_task(
                    self._execute_coordination(task, assigned_agents)
                )
            else:
                # No suitable agents available
                self.failed_tasks.append(task_id)

    async def _assign_agents(self, task: CoordinationTask) -> List[str]:
        """Assign agents to a task based on capabilities"""
        suitable_agents = []

        for agent_id, capability in self.agents.items():
            if agent_id in task.excluded_agents:
                continue

            # Check capability match
            if task.required_capabilities.issubset(capability.capabilities):
                # Check availability
                if capability.current_load < capability.max_concurrent_tasks:
                    suitable_agents.append(agent_id)

        # Sort by preference and availability
        suitable_agents.sort(
            key=lambda aid: (
                aid in task.preferred_agents,
                self.agents[aid].availability,
                -self.agents[aid].current_load
            ),
            reverse=True
        )

        # Select optimal number of agents
        num_agents = self._determine_optimal_agent_count(task, suitable_agents)
        selected_agents = suitable_agents[:num_agents]

        # Create assignments
        for agent_id in selected_agents:
            assignment = TaskAssignment(task_id=task.task_id, agent_id=agent_id)
            self.assignments[task.task_id].append(assignment)
            self.agents[agent_id].current_load += 1

        return selected_agents

    def _determine_optimal_agent_count(self, task: CoordinationTask,
                                     suitable_agents: List[str]) -> int:
        """Determine optimal number of agents for a task"""
        if task.coordination_mode == CoordinationMode.SEQUENTIAL:
            return 1
        elif task.coordination_mode == CoordinationMode.PARALLEL:
            return min(3, len(suitable_agents))
        elif task.coordination_mode == CoordinationMode.PIPELINE:
            return min(2, len(suitable_agents))
        elif task.coordination_mode == CoordinationMode.COLLABORATIVE:
            return min(4, len(suitable_agents))
        elif task.coordination_mode == CoordinationMode.COMPETITIVE:
            return min(2, len(suitable_agents))
        else:
            return 1

    async def _execute_coordination(self, task: CoordinationTask,
                                  assigned_agents: List[str]) -> None:
        """Execute task coordination"""
        try:
            # Get coordination strategy
            strategy = self.coordination_strategies[task.coordination_mode]

            # Execute coordination
            result = await strategy(task, assigned_agents)

            # Update task status
            for assignment in self.assignments[task.task_id]:
                assignment.status = "completed"
                assignment.progress = 1.0
                assignment.result = result

            # Update agent loads
            for agent_id in assigned_agents:
                self.agents[agent_id].current_load -= 1

            # Record completion
            self.completed_tasks.append(task.task_id)

        except Exception as e:
            # Handle coordination failure
            for assignment in self.assignments[task.task_id]:
                assignment.status = "failed"
                assignment.error_message = str(e)

            for agent_id in assigned_agents:
                self.agents[agent_id].current_load -= 1

            self.failed_tasks.append(task.task_id)

    async def _sequential_coordination(self, task: CoordinationTask,
                                     agents: List[str]) -> Dict[str, Any]:
        """Sequential task execution"""
        results = []
        current_data = task.input_data.copy()

        for i, agent_id in enumerate(agents):
            # Get assignment
            assignment = next(a for a in self.assignments[task.task_id] if a.agent_id == agent_id)
            assignment.status = "in_progress"

            # Execute agent task (would integrate with actual agent framework)
            result = await self._execute_agent_task(agent_id, current_data, task)
            results.append(result)
            current_data.update(result.get("output", {}))

            assignment.progress = (i + 1) / len(agents)

        return {"results": results, "final_output": current_data}

    async def _parallel_coordination(self, task: CoordinationTask,
                                   agents: List[str]) -> Dict[str, Any]:
        """Parallel task execution"""
        # Create parallel tasks
        tasks = []
        for agent_id in agents:
            assignment = next(a for a in self.assignments[task.task_id] if a.agent_id == agent_id)
            assignment.status = "in_progress"
            tasks.append(self._execute_agent_task(agent_id, task.input_data, task))

        # Wait for all to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Update assignments
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                assignments[i].error_message = str(result)
                assignments[i].status = "failed"
            else:
                assignments[i].result = result
                assignments[i].progress = 1.0
                assignments[i].status = "completed"

        return {"results": [r for r in results if not isinstance(r, Exception)]}

    async def _pipeline_coordination(self, task: CoordinationTask,
                                   agents: List[str]) -> Dict[str, Any]:
        """Pipeline task execution with data flow"""
        pipeline_results = []
        current_data = task.input_data.copy()

        for i, agent_id in enumerate(agents):
            assignment = next(a for a in self.assignments[task.task_id] if a.agent_id == agent_id)
            assignment.status = "in_progress"

            # Execute with pipeline data
            pipeline_data = {
                "input": current_data,
                "pipeline_stage": i,
                "total_stages": len(agents),
                "previous_results": pipeline_results
            }

            result = await self._execute_agent_task(agent_id, pipeline_data, task)
            pipeline_results.append(result)
            current_data.update(result.get("output", {}))

            assignment.progress = (i + 1) / len(agents)

        return {"pipeline_results": pipeline_results, "final_output": current_data}

    async def _collaborative_coordination(self, task: CoordinationTask,
                                        agents: List[str]) -> Dict[str, Any]:
        """Collaborative task execution with shared state"""
        shared_state = task.input_data.copy()
        contributions = {}
        iterations = 3  # Number of collaboration rounds

        for round_num in range(iterations):
            round_tasks = []
            for agent_id in agents:
                assignment = next(a for a in self.assignments[task.task_id] if a.agent_id == agent_id)
                if round_num == 0:
                    assignment.status = "in_progress"

                collaboration_data = {
                    "shared_state": shared_state,
                    "round": round_num,
                    "total_rounds": iterations,
                    "contributions": contributions
                }

                round_tasks.append(self._execute_agent_task(agent_id, collaboration_data, task))

            # Execute round in parallel
            round_results = await asyncio.gather(*round_tasks, return_exceptions=True)

            # Update shared state and contributions
            for i, result in enumerate(round_results):
                if not isinstance(result, Exception):
                    agent_id = agents[i]
                    contributions[agent_id] = result
                    shared_state.update(result.get("output", {}))

        # Update final progress
        for assignment in self.assignments[task.task_id]:
            assignment.progress = 1.0
            assignment.status = "completed"

        return {"shared_state": shared_state, "contributions": contributions}

    async def _competitive_coordination(self, task: CoordinationTask,
                                      agents: List[str]) -> Dict[str, Any]:
        """Competitive task execution - best result wins"""
        competition_tasks = []

        for agent_id in agents:
            assignment = next(a for a in self.assignments[task.task_id] if a.agent_id == agent_id)
            assignment.status = "in_progress"

            competition_data = {
                "input": task.input_data,
                "competition_mode": True,
                "agents_competing": agents
            }

            competition_tasks.append(self._execute_agent_task(agent_id, competition_data, task))

        # Wait for all competitors
        results = await asyncio.gather(*competition_tasks, return_exceptions=True)

        # Evaluate and select best result
        valid_results = [(agents[i], r) for i, r in enumerate(results)
                        if not isinstance(r, Exception)]

        best_result = await self._evaluate_competition_results(valid_results, task)

        # Update assignments
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                assignments[i].error_message = str(result)
                assignments[i].status = "failed"
            else:
                assignments[i].result = result
                if result == best_result:
                    assignments[i].status = "completed"
                else:
                    assignments[i].status = "superseded"

        return {"winning_result": best_result, "all_results": valid_results}

    async def _execute_agent_task(self, agent_id: str, data: Dict[str, Any],
                                task: CoordinationTask) -> Dict[str, Any]:
        """Execute task on specific agent (integration point)"""
        # This would integrate with the actual CE Hub agent framework
        # For now, simulate execution
        await asyncio.sleep(0.1)  # Simulate processing time

        return {
            "agent_id": agent_id,
            "output": {"processed": True, "agent_input": data},
            "execution_time": datetime.now().isoformat(),
            "quality_score": 0.85
        }

    async def _evaluate_competition_results(self, results: List[Tuple[str, Dict[str, Any]]],
                                          task: CoordinationTask) -> Dict[str, Any]:
        """Evaluate competition results and select winner"""
        if not results:
            return {}

        # Simple selection based on quality score
        best_agent, best_result = max(results, key=lambda x: x[1].get("quality_score", 0))
        best_result["winner"] = best_agent
        return best_result

    def _check_dependencies(self, task: CoordinationTask) -> bool:
        """Check if task dependencies are satisfied"""
        for dep_id in task.dependencies:
            if dep_id not in self.completed_tasks:
                return False
        return True

    def _calculate_task_status(self, task_id: str) -> str:
        """Calculate overall task status"""
        if task_id in self.completed_tasks:
            return "completed"
        if task_id in self.failed_tasks:
            return "failed"

        assignments = self.assignments[task_id]
        if not assignments:
            return "pending"

        statuses = [a.status for a in assignments]
        if any(s == "failed" for s in statuses):
            return "failed"
        elif all(s == "completed" for s in statuses):
            return "completed"
        elif any(s == "in_progress" for s in statuses):
            return "in_progress"
        else:
            return "assigned"

    def _calculate_completion_percentage(self, task_id: str) -> float:
        """Calculate task completion percentage"""
        assignments = self.assignments[task_id]
        if not assignments:
            return 0.0

        return sum(a.progress for a in assignments) / len(assignments)

class LoadBalancer:
    """Load balancing for agents"""

    def __init__(self):
        self.agent_loads: Dict[str, int] = defaultdict(int)

    def register_agent(self, capability: AgentCapability) -> None:
        """Register agent for load balancing"""
        self.agent_loads[capability.agent_id] = capability.current_load

    def get_least_loaded_agent(self, agent_ids: List[str]) -> Optional[str]:
        """Get least loaded agent from list"""
        if not agent_ids:
            return None

        return min(agent_ids, key=lambda aid: self.agent_loads.get(aid, 0))

class ConflictResolver:
    """Resolve conflicts in multi-agent coordination"""

    async def resolve_assignment_conflicts(self, task: CoordinationTask,
                                         conflicts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Resolve agent assignment conflicts"""
        resolution = {
            "conflicts_resolved": [],
            "agent_reassignments": {},
            "strategy": "performance_based"
        }

        # Simple resolution based on performance metrics
        for conflict in conflicts:
            agents = conflict["agents"]
            best_agent = max(agents, key=lambda aid: self._get_agent_performance(aid))
            resolution["agent_reassignments"][conflict["task_id"]] = best_agent
            resolution["conflicts_resolved"].append(conflict["task_id"])

        return resolution

    def _get_agent_performance(self, agent_id: str) -> float:
        """Get agent performance score"""
        # This would integrate with actual agent metrics
        return 0.8  # Placeholder