#!/usr/bin/env python3
"""
CE-Hub Agent Manager

Manages the five specialized agents in the CE-Hub ecosystem:
- Orchestrator: Master coordinator
- Researcher: Information gathering and synthesis
- Engineer: Technical implementation
- Tester: Quality assurance and validation
- Documenter: Knowledge capture and documentation
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Union

# CE-Hub root directory
CE_HUB_ROOT = Path(__file__).parent.parent

class AgentManager:
    """Manages CE-Hub agent operations and coordination."""

    def __init__(self):
        self.agents_dir = CE_HUB_ROOT / "agents"
        self.registry_path = self.agents_dir / "registry.json"
        self.agents = self._load_registry()

    def _load_registry(self) -> Dict:
        """Load the agent registry."""
        try:
            with open(self.registry_path) as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Agent registry not found at {self.registry_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in agent registry: {e}")
            sys.exit(1)

    def _load_agent_sop(self, agent_name: str) -> str:
        """Load agent SOP content."""
        sop_path = self.agents_dir / f"{agent_name}.md"
        try:
            with open(sop_path) as f:
                return f.read()
        except FileNotFoundError:
            return f"❌ SOP not found for {agent_name}"

    def list_agents(self) -> None:
        """List all available agents with their capabilities."""
        print("🤖 CE-Hub Digital Team Agents\n")

        for agent_id, agent_info in self.agents["agents"].items():
            name = agent_info["name"]
            description = agent_info["description"]
            specializations = ", ".join(agent_info["specializations"])

            print(f"### {name}")
            print(f"**Role**: {description}")
            print(f"**Specializations**: {specializations}")
            print(f"**ID**: `{agent_id}`")
            print()

        print("## Usage")
        print("- `/agent <agent-id>` - Get detailed agent information")
        print("- `/agent <agent-id> <task>` - Execute task with agent")
        print("- `/agent parallel <agent1>,<agent2> <task>` - Parallel execution")

    def get_agent_info(self, agent_name: str) -> None:
        """Display detailed information about a specific agent."""
        agent_name = agent_name.lower()

        if agent_name not in self.agents["agents"]:
            print(f"❌ Agent '{agent_name}' not found")
            print("Available agents:", ", ".join(self.agents["agents"].keys()))
            return

        agent_info = self.agents["agents"][agent_name]
        sop_content = self._load_agent_sop(agent_name)

        print(f"🤖 {agent_info['name']} Agent")
        print("=" * 50)
        print(f"**Description**: {agent_info['description']}")
        print()

        print("### Specializations")
        for spec in agent_info["specializations"]:
            print(f"- {spec}")
        print()

        print("### Capabilities")
        for category, capabilities in agent_info["capabilities"].items():
            print(f"**{category}**:")
            for cap, enabled in capabilities.items():
                status = "✅" if enabled else "❌"
                print(f"  {status} {cap}")
        print()

        print("### Preferred For")
        for use_case in agent_info["preferredFor"]:
            print(f"- {use_case}")
        print()

        print("### Limitations")
        for limitation in agent_info["limitations"]:
            print(f"- {limitation}")
        print()

        print("### Standard Operating Procedure")
        print("```")
        print("Use Task tool to launch this agent:")
        print(f"Task(description='Execute with {agent_name}', ")
        print(f"     prompt='[Your task description here]',")
        print(f"     subagent_type='{agent_name}')")
        print("```")

    def execute_agent_task(self, agent_name: str, task_description: str) -> None:
        """Execute a task with a specific agent."""
        agent_name = agent_name.lower()

        if agent_name not in self.agents["agents"]:
            print(f"❌ Agent '{agent_name}' not found")
            return

        agent_info = self.agents["agents"][agent_name]

        print(f"🚀 Executing task with {agent_info['name']} agent")
        print(f"**Task**: {task_description}")
        print()

        # Determine if Orchestrator coordination is needed
        complexity = self._assess_task_complexity(task_description)

        if complexity == "complex" or agent_name == "orchestrator":
            print("🎯 **Archon-First Protocol**: Initiating with knowledge graph sync")
            print("📋 **Plan-Mode**: Comprehensive plan will be presented for approval")
            print("🔄 **Workflow**: Plan → Research → Produce → Ingest")

        print("## Agent Instructions")
        print(f"Agent '{agent_name}' should execute the following:")
        print(f"1. Follow Archon-First protocol (MCP sync)")
        if complexity == "complex":
            print("2. Present comprehensive plan for user approval")
            print("3. Coordinate with other agents as needed")
        else:
            print("2. Execute task following established patterns")
        print("4. Prepare knowledge artifacts for Archon ingestion")
        print("5. Report completion status")

        print("\n🔧 **Implementation Note**: Use Claude Code's Task tool to launch this agent with the above instructions.")

    def execute_parallel_tasks(self, agent_names: str, task_description: str) -> None:
        """Execute parallel tasks with multiple agents."""
        agent_list = [name.strip().lower() for name in agent_names.split(",")]

        # Validate all agents exist
        invalid_agents = [name for name in agent_list if name not in self.agents["agents"]]
        if invalid_agents:
            print(f"❌ Invalid agents: {', '.join(invalid_agents)}")
            return

        print(f"🚀 Executing parallel tasks with {len(agent_list)} agents")
        print(f"**Agents**: {', '.join([self.agents['agents'][name]['name'] for name in agent_list])}")
        print(f"**Task**: {task_description}")
        print()

        print("🎯 **Orchestrator Coordination Required**")
        print("📋 **Plan-Mode**: Comprehensive plan will be presented for approval")
        print("🔄 **Parallel Workflow**: Synchronized execution with handoff coordination")
        print()

        print("## Execution Strategy")
        print("1. **Orchestrator** will coordinate overall workflow")
        print("2. **Archon-First** protocol for all agents")
        print("3. **Parallel Execution** with synchronized handoffs")
        print("4. **Quality Gates** enforced at each phase")
        print("5. **Knowledge Integration** for all artifacts")
        print()

        print("## Agent Assignments")
        for agent_name in agent_list:
            agent_info = self.agents["agents"][agent_name]
            print(f"### {agent_info['name']}")
            print(f"- **Role**: {agent_info['description']}")
            print(f"- **Focus**: {self._suggest_agent_focus(agent_name, task_description)}")
            print()

        print("🔧 **Implementation Note**: Use Claude Code's Task tool with parallel execution:")
        print("```")
        for i, agent_name in enumerate(agent_list):
            print(f"Task{i+1}(description='{agent_name} execution',")
            print(f"      prompt='{task_description} [focus: {self._suggest_agent_focus(agent_name, task_description)}]',")
            print(f"      subagent_type='{agent_name}')")
        print("```")

    def _assess_task_complexity(self, task_description: str) -> str:
        """Assess task complexity based on description."""
        task_lower = task_description.lower()

        complex_indicators = [
            "implement", "design", "create", "build", "develop",
            "system", "architecture", "integration", "multiple",
            "workflow", "process", "coordination"
        ]

        complexity_score = sum(1 for indicator in complex_indicators if indicator in task_lower)

        if complexity_score >= 3:
            return "complex"
        elif complexity_score >= 1:
            return "moderate"
        else:
            return "simple"

    def _suggest_agent_focus(self, agent_name: str, task_description: str) -> str:
        """Suggest specific focus area for agent based on task."""
        agent_info = self.agents["agents"][agent_name]
        specializations = agent_info["specializations"]

        # Simple keyword matching for suggestions
        task_lower = task_description.lower()

        if agent_name == "researcher":
            if "api" in task_lower or "integration" in task_lower:
                return "API research and integration patterns"
            elif "security" in task_lower or "auth" in task_lower:
                return "Security patterns and best practices"
            else:
                return "Requirements analysis and pattern discovery"

        elif agent_name == "engineer":
            if "api" in task_lower:
                return "API implementation and development"
            elif "auth" in task_lower or "security" in task_lower:
                return "Authentication and security implementation"
            else:
                return "Core technical implementation"

        elif agent_name == "tester":
            if "api" in task_lower:
                return "API testing and validation"
            elif "security" in task_lower or "auth" in task_lower:
                return "Security testing and validation"
            else:
                return "Quality assurance and test coverage"

        elif agent_name == "documenter":
            if "api" in task_lower:
                return "API documentation and specifications"
            elif "user" in task_lower:
                return "User guides and documentation"
            else:
                return "Technical documentation and knowledge capture"

        elif agent_name == "orchestrator":
            return "Workflow coordination and quality oversight"

        return ", ".join(specializations[:2])  # Fallback to first two specializations


def main():
    """Main entry point for agent manager."""
    parser = argparse.ArgumentParser(
        description="CE-Hub Agent Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python agent_manager.py list
  python agent_manager.py info researcher
  python agent_manager.py execute engineer "implement user auth API"
  python agent_manager.py parallel engineer,tester "build auth system"
        """
    )

    parser.add_argument("action", choices=["list", "info", "execute", "parallel"],
                        help="Action to perform")
    parser.add_argument("target", nargs="?", help="Agent name or agent list (for parallel)")
    parser.add_argument("task", nargs="?", help="Task description (for execute/parallel)")

    args = parser.parse_args()

    manager = AgentManager()

    if args.action == "list":
        manager.list_agents()

    elif args.action == "info":
        if not args.target:
            print("❌ Agent name required for info command")
            sys.exit(1)
        manager.get_agent_info(args.target)

    elif args.action == "execute":
        if not args.target or not args.task:
            print("❌ Agent name and task description required for execute command")
            sys.exit(1)
        manager.execute_agent_task(args.target, args.task)

    elif args.action == "parallel":
        if not args.target or not args.task:
            print("❌ Agent list and task description required for parallel command")
            sys.exit(1)
        manager.execute_parallel_tasks(args.target, args.task)


if __name__ == "__main__":
    main()