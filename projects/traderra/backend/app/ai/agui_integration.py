"""
AG-UI Integration for Renata Agent

This module provides the integration layer between the Renata AI agent
and the AG-UI frontend tools. It registers tools with PydanticAI that
the agent can call to control the UI.

When the agent calls a tool, it returns a structured response that tells
the frontend to execute the tool with specific parameters.
"""

import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from pydantic_ai import Tool

from .agui_tools import FrontendToolRegistry, ToolCategory

logger = logging.getLogger(__name__)


class FrontendToolCall(BaseModel):
    """Model representing a frontend tool call to be executed"""
    tool_name: str = Field(..., description="Name of the tool to execute")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the tool")
    category: ToolCategory = Field(..., description="Tool category")

    def to_frontend_format(self) -> Dict[str, Any]:
        """Convert to format expected by frontend"""
        return FrontendToolRegistry.format_tool_call_for_frontend(
            self.tool_name,
            self.parameters
        )


class AGUIResponse(BaseModel):
    """Response model for AG-UI tool calls"""
    type: str = "frontend_tool_call"  # Response type marker
    tool_call: Optional[FrontendToolCall] = None
    message: Optional[str] = None
    requires_frontend_execution: bool = True


def create_agui_tool(
    tool_name: str,
    description: str,
    parameter_schema: Dict[str, Any]
):
    """
    Factory function to create a PydanticAI tool from an AG-UI tool definition.

    This creates a tool that, when called by the agent, returns a structured
    response telling the frontend to execute the corresponding tool.
    """
    async def execute_tool_call(**kwargs) -> Dict[str, Any]:
        """Execute the tool call by returning instructions for the frontend"""
        logger.info(f"Agent calling frontend tool: {tool_name} with args: {kwargs}")

        # Get the tool definition to validate parameters
        tool_def = FrontendToolRegistry.get_tool_by_name(tool_name)
        if not tool_def:
            logger.error(f"Tool not found: {tool_name}")
            return {
                "success": False,
                "error": f"Unknown tool: {tool_name}",
                "frontend_execution": False
            }

        # Create the tool call object
        tool_call = FrontendToolCall(
            tool_name=tool_name,
            parameters=kwargs,
            category=tool_def["category"]
        )

        # Return structured response for frontend
        return {
            "success": True,
            "type": "frontend_tool_call",
            "tool_call": tool_call.to_frontend_format(),
            "requires_frontend_execution": True,
            "message": f"Calling frontend tool: {tool_name}"
        }

    # Create PydanticAI tool with proper schema
    return Tool(execute_tool_call)


class AGUIIntegration:
    """
    AG-UI Integration layer for Renata Agent.

    This class provides methods to register all AG-UI frontend tools
    with a PydanticAI agent, enabling the agent to control the UI.
    """

    def __init__(self):
        self.tools = {}
        self._initialize_tools()

    def _initialize_tools(self):
        """Initialize all AG-UI tools"""
        tool_definitions = FrontendToolRegistry.get_all_tools()

        for tool_def in tool_definitions:
            tool_name = tool_def["name"]
            description = tool_def["description"]
            parameter_schema = tool_def["parameters"]

            # Create the tool
            self.tools[tool_name] = {
                "definition": tool_def,
                "callable": create_agui_tool(tool_name, description, parameter_schema),
                "description": description,
                "parameters": parameter_schema
            }

        logger.info(f"Initialized {len(self.tools)} AG-UI tools")

    def register_tools_with_agent(self, agent):
        """
        Register all AG-UI tools with a PydanticAI agent.

        This adds each tool to the agent so it can be called during
        conversation.
        """
        registered_count = 0

        for tool_name, tool_data in self.tools.items():
            try:
                # Register the tool with the agent
                agent.tool(tool_data["callable"])
                registered_count += 1
                logger.debug(f"Registered tool: {tool_name}")
            except Exception as e:
                logger.error(f"Failed to register tool {tool_name}: {e}")

        logger.info(f"Registered {registered_count}/{len(self.tools)} AG-UI tools with agent")
        return registered_count

    def get_tools_for_agent_prompt(self) -> str:
        """
        Get a formatted description of all tools for the agent's system prompt.

        This helps the agent understand what tools are available and when to use them.
        """
        prompt_parts = ["\n## Available Frontend Tools\n"]
        prompt_parts.append("You can call the following frontend tools to control the UI:\n\n")

        # Group by category
        categories = {}
        for tool_name, tool_data in self.tools.items():
            category = tool_data["definition"]["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(tool_data)

        # Format each category
        for category, tools in categories.items():
            prompt_parts.append(f"### {category.value.title()} Tools\n")
            for tool_data in tools:
                tool_def = tool_data["definition"]
                prompt_parts.append(f"- **{tool_def['name']}**: {tool_def['description']}\n")
            prompt_parts.append("\n")

        prompt_parts.append("When the user asks you to perform UI actions, call the appropriate tool.")
        prompt_parts.append("The tool will be executed on the frontend and the user will see the results.")

        return "".join(prompt_parts)

    def validate_tool_call(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a tool call before execution.

        Returns validation result with any errors.
        """
        tool_def = FrontendToolRegistry.get_tool_by_name(tool_name)

        if not tool_def:
            return {
                "valid": False,
                "error": f"Unknown tool: {tool_name}"
            }

        errors = []
        parameter_schema = tool_def["parameters"]

        # Check required parameters
        for param_name, param_def in parameter_schema.items():
            if not param_def.get("optional", False) and param_name not in parameters:
                errors.append(f"Missing required parameter: {param_name}")

        # Validate parameter types (basic validation)
        for param_name, param_value in parameters.items():
            if param_name not in parameter_schema:
                errors.append(f"Unknown parameter: {param_name}")
                continue

            param_def = parameter_schema[param_name]
            param_type = param_def.get("type")

            if param_type == "string":
                if not isinstance(param_value, str):
                    errors.append(f"Parameter '{param_name}' should be a string")

            elif param_type == "number":
                if not isinstance(param_value, (int, float)):
                    errors.append(f"Parameter '{param_name}' should be a number")

            elif param_type == "array":
                if not isinstance(param_value, list):
                    errors.append(f"Parameter '{param_name}' should be an array")

        return {
            "valid": len(errors) == 0,
            "errors": errors
        }


def create_agui_integration() -> AGUIIntegration:
    """Factory function to create AG-UI integration instance"""
    return AGUIIntegration()


# Standalone tool functions that can be registered directly with PydanticAI
# These are simpler versions that can be used directly without the integration class

async def navigate_to_page(page: str) -> Dict[str, Any]:
    """Navigate to a specific page in the application"""
    return {
        "success": True,
        "type": "frontend_tool_call",
        "tool_call": FrontendToolRegistry.format_tool_call_for_frontend("navigateToPage", {"page": page}),
        "requires_frontend_execution": True
    }


async def set_date_range(range: str) -> Dict[str, Any]:
    """Set the date range for displayed data"""
    return {
        "success": True,
        "type": "frontend_tool_call",
        "tool_call": FrontendToolRegistry.format_tool_call_for_frontend("setDateRange", {"range": range}),
        "requires_frontend_execution": True
    }


async def set_display_mode(mode: str) -> Dict[str, Any]:
    """Set the display mode for P&L and values"""
    return {
        "success": True,
        "type": "frontend_tool_call",
        "tool_call": FrontendToolRegistry.format_tool_call_for_frontend("setDisplayMode", {"mode": mode}),
        "requires_frontend_execution": True
    }


async def set_pnl_mode(mode: str) -> Dict[str, Any]:
    """Set the P&L calculation mode"""
    return {
        "success": True,
        "type": "frontend_tool_call",
        "tool_call": FrontendToolRegistry.format_tool_call_for_frontend("setPnLMode", {"mode": mode}),
        "requires_frontend_execution": True
    }


async def set_account_size(size: float) -> Dict[str, Any]:
    """Set the account size for calculations"""
    return {
        "success": True,
        "type": "frontend_tool_call",
        "tool_call": FrontendToolRegistry.format_tool_call_for_frontend("setAccountSize", {"size": size}),
        "requires_frontend_execution": True
    }


# Export all standalone tools
STANDALONE_AGUI_TOOLS = [
    navigate_to_page,
    set_date_range,
    set_display_mode,
    set_pnl_mode,
    set_account_size,
]


if __name__ == "__main__":
    # Test the AG-UI integration
    print("=== AG-UI Integration Test ===")

    integration = create_agui_integration()
    print(f"\nInitialized {len(integration.tools)} tools")

    # Test tool validation
    print("\n--- Testing Tool Validation ---")

    # Valid call
    valid_result = integration.validate_tool_call("navigate_to_page", {"page": "dashboard"})
    print(f"Valid call: {valid_result['valid']}")

    # Invalid call (missing parameter)
    invalid_result = integration.validate_tool_call("navigate_to_page", {})
    print(f"Invalid call (missing param): {not invalid_result['valid']}")
    print(f"  Errors: {invalid_result['errors']}")

    # Test tool prompt generation
    print("\n--- Testing Agent Prompt Generation ---")
    prompt = integration.get_tools_for_agent_prompt()
    print(f"Generated prompt length: {len(prompt)} chars")
    print("\nFirst 500 chars of prompt:")
    print(prompt[:500])

    print("\n✅ AG-UI Integration test complete")
