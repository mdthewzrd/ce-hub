"""
AG-UI Frontend Tools Bridge

This module defines the frontend tools that the AI agent can call.
These tools are registered with PydanticAI and executed on the frontend.

This is the backend-side definition of frontend tools - they describe
what tools are available, their parameters, and how to call them.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class ToolCategory(str, Enum):
    """Categories for organizing tools"""
    NAVIGATION = "navigation"
    DISPLAY = "display"
    ACCOUNT = "account"
    JOURNAL = "journal"
    TRADES = "trades"
    ANALYTICS = "analytics"


class ToolCall(BaseModel):
    """Represents a tool call from the agent"""
    tool_name: str = Field(..., description="Name of the tool to call")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the tool")
    category: ToolCategory = Field(..., description="Tool category")


class ToolResult(BaseModel):
    """Result from executing a tool"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class FrontendToolRegistry:
    """
    Registry of all frontend tools that the AI agent can call.

    The agent will use these tool definitions to understand what
    actions are available and how to call them.
    """

    @staticmethod
    def get_all_tools() -> List[Dict[str, Any]]:
        """
        Get all available frontend tools with their schemas.

        Returns a list of tool definitions that can be registered
        with the PydanticAI agent.
        """
        return [
            # Navigation Tools
            {
                "name": "navigate_to_page",
                "category": ToolCategory.NAVIGATION,
                "description": "Navigate to a specific page in the application. Use this when the user wants to go to dashboard, trades, journal, analytics, calendar, settings, or daily-summary pages.",
                "parameters": {
                    "page": {
                        "type": "string",
                        "enum": ["dashboard", "trades", "journal", "analytics", "calendar", "settings", "daily-summary"],
                        "description": "The page to navigate to"
                    }
                }
            },

            # Display Tools
            {
                "name": "set_date_range",
                "category": ToolCategory.DISPLAY,
                "description": "Set the date range for displayed data. Options: today, 7d (last 7 days), 30d (last 30 days), 90d (last 90 days), ytd (year to date), 1y (last year), all (all data).",
                "parameters": {
                    "range": {
                        "type": "string",
                        "enum": ["today", "7d", "30d", "90d", "ytd", "1y", "all"],
                        "description": "The date range to set"
                    },
                    "customStart": {
                        "type": "string",
                        "description": "Custom start date (ISO format), required if range is 'custom'",
                        "optional": True
                    },
                    "customEnd": {
                        "type": "string",
                        "description": "Custom end date (ISO format), required if range is 'custom'",
                        "optional": True
                    }
                }
            },
            {
                "name": "set_display_mode",
                "category": ToolCategory.DISPLAY,
                "description": "Set the display mode for P&L and values. Options: dollar (show $ amounts), percent (show % changes), r-multiple (show R-multiple values).",
                "parameters": {
                    "mode": {
                        "type": "string",
                        "enum": ["dollar", "percent", "r-multiple"],
                        "description": "The display mode to set"
                    }
                }
            },
            {
                "name": "set_pnl_mode",
                "category": ToolCategory.DISPLAY,
                "description": "Set the P&L calculation mode. Options: net (after fees and commissions), gross (before fees).",
                "parameters": {
                    "mode": {
                        "type": "string",
                        "enum": ["net", "gross"],
                        "description": "The P&L mode to set"
                    }
                }
            },
            {
                "name": "set_chart_type",
                "category": ToolCategory.DISPLAY,
                "description": "Set the chart type for visualizations. Options: line, bar, area, candlestick, equity_curve, drawdown.",
                "parameters": {
                    "type": {
                        "type": "string",
                        "enum": ["line", "bar", "area", "candlestick", "equity_curve", "drawdown"],
                        "description": "The chart type to set"
                    }
                }
            },

            # Account Tools
            {
                "name": "set_account_size",
                "category": ToolCategory.ACCOUNT,
                "description": "Set the account size for calculations. This should be a positive number representing the total trading account value.",
                "parameters": {
                    "size": {
                        "type": "number",
                        "minimum": 0,
                        "description": "The account size to set"
                    }
                }
            },

            # Journal Tools
            {
                "name": "create_journal_entry",
                "category": ToolCategory.JOURNAL,
                "description": "Create a new journal entry. Requires date, title, and content. Optionally accepts tags array, mood (positive/neutral/negative), and attachments.",
                "parameters": {
                    "date": {
                        "type": "string",
                        "description": "The date for the journal entry (ISO format)"
                    },
                    "title": {
                        "type": "string",
                        "minLength": 1,
                        "description": "The title of the journal entry"
                    },
                    "content": {
                        "type": "string",
                        "minLength": 1,
                        "description": "The content of the journal entry"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional tags for the entry",
                        "optional": True
                    },
                    "mood": {
                        "type": "string",
                        "enum": ["positive", "neutral", "negative"],
                        "description": "Optional mood indicator",
                        "optional": True
                    }
                }
            },
            {
                "name": "update_journal_entry",
                "category": ToolCategory.JOURNAL,
                "description": "Update an existing journal entry. Requires the entry ID and the fields to update.",
                "parameters": {
                    "id": {
                        "type": "string",
                        "description": "The ID of the journal entry to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New title for the entry",
                        "optional": True
                    },
                    "content": {
                        "type": "string",
                        "description": "New content for the entry",
                        "optional": True
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "New tags for the entry",
                        "optional": True
                    },
                    "mood": {
                        "type": "string",
                        "enum": ["positive", "neutral", "negative"],
                        "description": "New mood for the entry",
                        "optional": True
                    }
                }
            },
            {
                "name": "delete_journal_entry",
                "category": ToolCategory.JOURNAL,
                "description": "Delete a journal entry by its ID.",
                "parameters": {
                    "id": {
                        "type": "string",
                        "description": "The ID of the journal entry to delete"
                    }
                }
            },

            # Trade Tools
            {
                "name": "import_trades",
                "category": ToolCategory.TRADES,
                "description": "Import trades into the journal. Accepts an array of trades with date, symbol, side, quantity, entryPrice, exitPrice, and optional pnl, rMultiple, strategy, notes.",
                "parameters": {
                    "trades": {
                        "type": "array",
                        "description": "Array of trades to import",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "symbol": {"type": "string"},
                                "side": {"type": "string", "enum": ["Long", "Short"]},
                                "quantity": {"type": "number"},
                                "entryPrice": {"type": "number"},
                                "exitPrice": {"type": "number"},
                                "pnl": {"type": "number"},
                                "rMultiple": {"type": "number"},
                                "strategy": {"type": "string"},
                                "notes": {"type": "string"}
                            },
                            "required": ["date", "symbol", "side", "quantity", "entryPrice", "exitPrice"]
                        }
                    }
                }
            },

            # Filter Tools
            {
                "name": "set_trade_filter",
                "category": ToolCategory.ANALYTICS,
                "description": "Set filters for the trade list. Can filter by symbols, strategies, side (Long/Short/both), P&L range, and date range.",
                "parameters": {
                    "symbols": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Symbols to filter by",
                        "optional": True
                    },
                    "strategies": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Strategies to filter by",
                        "optional": True
                    },
                    "side": {
                        "type": "string",
                        "enum": ["Long", "Short", "both"],
                        "description": "Side to filter by",
                        "optional": True
                    },
                    "pnlMin": {
                        "type": "number",
                        "description": "Minimum P&L",
                        "optional": True
                    },
                    "pnlMax": {
                        "type": "number",
                        "description": "Maximum P&L",
                        "optional": True
                    },
                    "dateRange": {
                        "type": "string",
                        "enum": ["today", "7d", "30d", "90d", "ytd", "1y", "all"],
                        "description": "Date range for filter",
                        "optional": True
                    }
                }
            },
            {
                "name": "set_search_query",
                "category": ToolCategory.ANALYTICS,
                "description": "Set the search query for filtering trades or journal entries.",
                "parameters": {
                    "query": {
                        "type": "string",
                        "description": "The search query to set"
                    }
                }
            },
        ]

    @staticmethod
    def get_tool_by_name(name: str) -> Optional[Dict[str, Any]]:
        """Get a specific tool by name"""
        tools = FrontendToolRegistry.get_all_tools()
        for tool in tools:
            if tool["name"] == name:
                return tool
        return None

    @staticmethod
    def format_tool_call_for_frontend(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format a tool call for the frontend to execute.

        This creates a structured object that the frontend AG-UI listener
        can parse and execute.
        """
        return {
            "action": "execute_tool",
            "tool": tool_name,
            "parameters": parameters,
            "timestamp": None  # Will be set by frontend
        }


# Validation function to verify tool definitions
def validate_tool_definitions() -> Dict[str, Any]:
    """
    Validate that all tool definitions are properly structured.

    Returns validation results with any errors found.
    """
    tools = FrontendToolRegistry.get_all_tools()
    errors = []
    warnings = []

    required_fields = ["name", "category", "description", "parameters"]

    for i, tool in enumerate(tools):
        # Check required fields
        for field in required_fields:
            if field not in tool:
                errors.append(f"Tool {i}: Missing required field '{field}'")

        # Check name format (should be snake_case)
        if "name" in tool:
            name = tool["name"]
            if not name.islower() or "_" not in name:
                warnings.append(f"Tool '{name}': Name should be snake_case")

        # Check parameters have descriptions
        if "parameters" in tool:
            for param_name, param_def in tool["parameters"].items():
                if isinstance(param_def, dict) and "description" not in param_def:
                    warnings.append(f"Tool '{tool.get('name', 'unknown')}': Parameter '{param_name}' missing description")

    return {
        "valid": len(errors) == 0,
        "total_tools": len(tools),
        "errors": errors,
        "warnings": warnings
    }


if __name__ == "__main__":
    # Test: Validate tool definitions
    validation = validate_tool_definitions()
    print("=== AG-UI Tool Definitions Validation ===")
    print(f"Valid: {validation['valid']}")
    print(f"Total Tools: {validation['total_tools']}")
    print(f"Errors: {len(validation['errors'])}")
    print(f"Warnings: {len(validation['warnings'])}")

    if validation['errors']:
        print("\nErrors:")
        for error in validation['errors']:
            print(f"  - {error}")

    if validation['warnings']:
        print("\nWarnings:")
        for warning in validation['warnings']:
            print(f"  - {warning}")

    # Print all tool names
    print("\nAvailable Tools:")
    for tool in FrontendToolRegistry.get_all_tools():
        print(f"  - {tool['name']} ({tool['category']})")
