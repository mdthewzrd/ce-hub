"""
AG-UI Integration Module for CE Hub
Provides structured agent interactions with user interface components
"""

from typing import Dict, List, Any, Optional, Protocol
from dataclasses import dataclass, field
from enum import Enum
import json
import asyncio
from datetime import datetime

class UIComponentType(Enum):
    """Supported UI component types"""
    FORM = "form"
    TABLE = "table"
    CHART = "chart"
    MODAL = "modal"
    SIDEBAR = "sidebar"
    DASHBOARD = "dashboard"
    WORKFLOW = "workflow"
    KANBAN = "kanban"

class InteractionMode(Enum):
    """UI interaction modes"""
    READ_ONLY = "read_only"
    EDITABLE = "editable"
    INTERACTIVE = "interactive"
    COLLABORATIVE = "collaborative"

@dataclass
class UIComponent:
    """Represents a UI component with agent integration"""
    component_id: str
    component_type: UIComponentType
    title: str
    data: Dict[str, Any] = field(default_factory=dict)
    config: Dict[str, Any] = field(default_factory=dict)
    interaction_mode: InteractionMode = InteractionMode.READ_ONLY
    dependencies: List[str] = field(default_factory=list)
    update_triggers: List[str] = field(default_factory=list)
    agent_handlers: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for UI rendering"""
        return {
            "id": self.component_id,
            "type": self.component_type.value,
            "title": self.title,
            "data": self.data,
            "config": self.config,
            "interactionMode": self.interaction_mode.value,
            "dependencies": self.dependencies,
            "updateTriggers": self.update_triggers,
            "agentHandlers": self.agent_handlers,
            "lastUpdated": datetime.now().isoformat()
        }

class AGUIIntegration:
    """Advanced GUI Integration for CE Hub Agents"""

    def __init__(self):
        self.components: Dict[str, UIComponent] = {}
        self.workflows: Dict[str, List[str]] = {}
        self.event_handlers: Dict[str, List[callable]] = {}
        self.state_manager = UIStateManager()

    def register_component(self, component: UIComponent) -> str:
        """Register a UI component for agent interaction"""
        self.components[component.component_id] = component

        # Register event handlers
        for trigger in component.update_triggers:
            if trigger not in self.event_handlers:
                self.event_handlers[trigger] = []

        return component.component_id

    def create_workflow(self, workflow_id: str, component_ids: List[str]) -> None:
        """Create a workflow connecting multiple UI components"""
        self.workflows[workflow_id] = component_ids

        # Establish dependencies
        for component_id in component_ids:
            if component_id in self.components:
                component = self.components[component_id]
                for dep_id in component_ids:
                    if dep_id != component_id and dep_id not in component.dependencies:
                        component.dependencies.append(dep_id)

    def update_component_data(self, component_id: str, data: Dict[str, Any],
                            trigger_event: Optional[str] = None) -> bool:
        """Update component data and trigger dependent updates"""
        if component_id not in self.components:
            return False

        # Update component data
        self.components[component_id].data.update(data)

        # Trigger event handlers
        if trigger_event and trigger_event in self.event_handlers:
            for handler in self.event_handlers[trigger_event]:
                asyncio.create_task(handler(component_id, data))

        # Cascade updates to dependencies
        self._cascade_updates(component_id)

        return True

    def _cascade_updates(self, source_component_id: str) -> None:
        """Cascade updates to dependent components"""
        source_component = self.components[source_component_id]

        for dep_id in source_component.dependencies:
            if dep_id in self.components:
                dep_component = self.components[dep_id]

                # Check if update triggers match
                for trigger in dep_component.update_triggers:
                    if trigger in source_component.agent_handlers:
                        # Trigger agent handler
                        agent_id = source_component.agent_handlers[trigger]
                        asyncio.create_task(
                            self._trigger_agent_handler(agent_id, dep_id, trigger)
                        )

    async def _trigger_agent_handler(self, agent_id: str, component_id: str,
                                   trigger: str) -> None:
        """Trigger agent handler for component update"""
        # This would integrate with the agent framework
        # to trigger specific agent actions
        pass

    def get_component_state(self, component_id: str) -> Optional[Dict[str, Any]]:
        """Get current component state"""
        if component_id not in self.components:
            return None

        component = self.components[component_id]
        return {
            "component": component.to_dict(),
            "state": self.state_manager.get_state(component_id),
            "dependencies": [self.components[dep_id].to_dict()
                           for dep_id in component.dependencies
                           if dep_id in self.components]
        }

    def get_workflow_state(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow state with all components"""
        if workflow_id not in self.workflows:
            return None

        component_states = {}
        for component_id in self.workflows[workflow_id]:
            component_states[component_id] = self.get_component_state(component_id)

        return {
            "workflow_id": workflow_id,
            "components": component_states,
            "state": self.state_manager.get_workflow_state(workflow_id),
            "last_updated": datetime.now().isoformat()
        }

class UIStateManager:
    """Manages UI component state and transitions"""

    def __init__(self):
        self.component_states: Dict[str, Dict[str, Any]] = {}
        self.workflow_states: Dict[str, Dict[str, Any]] = {}
        self.state_history: List[Dict[str, Any]] = []

    def update_state(self, component_id: str, state: Dict[str, Any]) -> None:
        """Update component state"""
        if component_id not in self.component_states:
            self.component_states[component_id] = {}

        self.component_states[component_id].update(state)

        # Record state change
        self.state_history.append({
            "component_id": component_id,
            "state": state.copy(),
            "timestamp": datetime.now().isoformat()
        })

    def get_state(self, component_id: str) -> Dict[str, Any]:
        """Get component state"""
        return self.component_states.get(component_id, {})

    def get_workflow_state(self, workflow_id: str) -> Dict[str, Any]:
        """Get workflow state"""
        return self.workflow_states.get(workflow_id, {})

# Integration with CE Hub Agents
class AgentUIBridge:
    """Bridge between CE Hub agents and UI components"""

    def __init__(self, agui_integration: AGUIIntegration):
        self.agui = agui_integration
        self.agent_ui_mappings: Dict[str, List[str]] = {}

    def register_agent_ui(self, agent_id: str, component_ids: List[str]) -> None:
        """Register agent-UI component mappings"""
        self.agent_ui_mappings[agent_id] = component_ids

        # Set up agent handlers for components
        for component_id in component_ids:
            if component_id in self.agui.components:
                component = self.agui.components[component_id]
                component.agent_handlers[agent_id] = f"agent_{agent_id}_handler"

    async def trigger_agent_update(self, agent_id: str, update_data: Dict[str, Any]) -> None:
        """Trigger UI updates from agent activity"""
        if agent_id not in self.agent_ui_mappings:
            return

        for component_id in self.agent_ui_mappings[agent_id]:
            self.agui.update_component_data(
                component_id,
                update_data,
                trigger_event=f"agent_{agent_id}_update"
            )

    def get_agent_ui_state(self, agent_id: str) -> Dict[str, Any]:
        """Get UI state for agent's components"""
        if agent_id not in self.agent_ui_mappings:
            return {}

        agent_state = {}
        for component_id in self.agent_ui_mappings[agent_id]:
            component_state = self.agui.get_component_state(component_id)
            if component_state:
                agent_state[component_id] = component_state

        return agent_state