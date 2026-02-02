"""
AG-UI Chat Endpoint

This endpoint implements AG-UI protocol for Renata chat.
It allows the AI agent to call frontend tools directly instead of
using DOM scraping or custom UI actions.
"""

import base64
import logging
import re
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.dependencies import AIContext, get_ai_context
from pydantic_ai import Agent
import pandas as pd

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agui", tags=["AG-UI"])


class AGUIChatRequest(BaseModel):
    """Request for AG-UI chat"""
    message: str = Field(..., description="User message")
    context: Optional[Dict[str, Any]] = Field(None, description="Current UI context")
    attachedFile: Optional[Dict[str, str]] = Field(None, description="Attached file with 'name' and 'content' (base64)")
    userId: Optional[str] = Field(None, description="User ID for file uploads")


class AGUIChatResponse(BaseModel):
    """Response from AG-UI chat"""
    response: str
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


# Define AG-UI tool functions at module level for PydanticAI
def navigate_to_page_tool(page: str) -> str:
    """Navigate to a specific page in the application.

    Valid pages: dashboard, trades, journal, analytics, calendar, settings, daily-summary
    """
    return f"Navigating to {page} page."


def set_date_range_tool(date_range: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> str:
    """Set the date range for displayed data.

    Valid ranges: today, 7d, 30d, 90d, ytd, 1y, all, custom
    Use custom_start and custom_end (YYYY-MM-DD) for custom ranges.
    """
    if date_range == "custom" and custom_start and custom_end:
        return f"Setting custom date range from {custom_start} to {custom_end}."
    return f"Setting date range to {date_range}."


def set_display_mode_tool(mode: str) -> str:
    """Set the display mode for P&L and values.

    Valid modes: dollar, percent, r-multiple
    """
    return f"Switching to {mode} display mode."


def set_pnl_mode_tool(mode: str) -> str:
    """Set the P&L calculation mode.

    Valid modes: net, gross
    """
    return f"Switching to {mode} P&L mode."


def set_account_size_tool(size: float) -> str:
    """Set the account size for calculations."""
    return f"Setting account size to {size:,.0f}."


async def process_attached_file(
    file_data: Dict[str, str],
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Process an attached CSV file and upload trades.

    Args:
        file_data: Dict with 'name' and 'content' (base64)
        user_id: User identifier

    Returns:
        Dict with upload results
    """
    try:
        file_name = file_data.get('name', 'unknown.csv')
        base64_content = file_data.get('content', '')

        if not base64_content:
            return {
                "success": False,
                "message": "No file content provided"
            }

        # Decode base64 content
        try:
            csv_bytes = base64.b64decode(base64_content)
            csv_text = csv_bytes.decode('utf-8-sig')
        except Exception as e:
            logger.error(f"Base64 decode error: {e}")
            return {
                "success": False,
                "message": f"Failed to decode file: {str(e)}"
            }

        # Parse CSV to get trade count
        try:
            df = pd.read_csv(StringIO(csv_text))
            trade_count = len(df)

            # Basic validation for Tradervue format
            required_cols = ['Symbol', 'Side', 'Entry Price', 'Exit Price', 'Volume']
            missing = [col for col in required_cols if col not in df.columns]
            if missing:
                return {
                    "success": False,
                    "message": f"Invalid CSV format. Missing columns: {missing}"
                }

        except Exception as e:
            logger.error(f"CSV parse error: {e}")
            return {
                "success": False,
                "message": f"Failed to parse CSV: {str(e)}"
            }

        # Import the trade upload processing logic
        from .trade_upload_endpoints import (
            parse_tradervue_csv,
            generate_trade_hash
        )
        from ..core.database import get_database_connection
        import json

        # Parse trades
        trades = await parse_tradervue_csv(csv_text)

        if not trades:
            return {
                "success": False,
                "message": "No valid trades found in CSV"
            }

        # Create batch ID
        import hashlib
        batch_id = hashlib.sha256(
            f"{user_id}_{file_name}_{datetime.now().isoformat()}".encode()
        ).hexdigest()[:32]

        # Upload to database
        async with get_database_connection() as conn:
            async with conn.transaction():
                new_count = 0
                updated_count = 0
                duplicate_count = 0

                # Get root folder
                root_folder = await conn.fetchval(
                    "SELECT id FROM folders WHERE user_id = $1 AND parent_id IS NULL LIMIT 1",
                    user_id
                )

                for trade in trades:
                    trade_hash = generate_trade_hash(trade)

                    # Check for existing trade
                    existing = await conn.fetchrow(
                        """
                        SELECT id FROM content_items
                        WHERE user_id = $1
                        AND type = 'trade_entry'
                        AND content->>'trade_hash' = $2
                        LIMIT 1
                        """,
                        user_id, trade_hash
                    )

                    trade_content = {
                        "trade_hash": trade_hash,
                        "trade_data": {
                            "symbol": trade.symbol,
                            "side": trade.side,
                            "entry_price": trade.entry_price,
                            "exit_price": trade.exit_price,
                            "quantity": trade.quantity,
                            "pnl": trade.pnl,
                            "commissions": trade.commissions,
                            "fees": trade.fees,
                            "entry_date": trade.entry_date,
                            "exit_date": trade.exit_date
                        },
                        "blocks": [],
                        "import_batch": batch_id
                    }

                    title = f"{trade.symbol} {trade.side} {trade.quantity}"

                    if existing:
                        # Update existing trade
                        await conn.execute(
                            """
                            UPDATE content_items
                            SET content = $1, updated_at = NOW()
                            WHERE id = $2
                            """,
                            json.dumps(trade_content),
                            existing['id']
                        )
                        updated_count += 1
                    else:
                        # Create new trade
                        await conn.execute(
                            """
                            INSERT INTO content_items (
                                user_id, type, title, content, metadata,
                                folder_id, tags, created_at, updated_at
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                            """,
                            user_id,
                            'trade_entry',
                            title,
                            json.dumps(trade_content),
                            {
                                "import_batch": batch_id,
                                "symbol": trade.symbol,
                                "side": trade.side,
                                "entry_date": trade.entry_date
                            },
                            root_folder,
                            ["trade", trade.symbol.lower(), trade.side.lower()]
                        )
                        new_count += 1

        logger.info(f"File upload complete: {new_count} new, {updated_count} updated")

        return {
            "success": True,
            "message": f"✅ Import complete: {new_count} new trades added, {updated_count} existing trades updated.",
            "file_name": file_name,
            "new_count": new_count,
            "updated_count": updated_count,
            "total_trades": trade_count
        }

    except Exception as e:
        logger.error(f"File processing error: {e}", exc_info=True)
        return {
            "success": False,
            "message": f"Failed to process file: {str(e)}"
        }


# Create a simple agent with AG-UI tools
def create_agui_agent() -> Agent:
    """Create a PydanticAI agent with AG-UI frontend tools"""

    system_prompt = """You are Renata, a trading journal assistant for Traderra.

You can control the UI using these tools:
- navigate_to_page_tool: Go to dashboard, trades, journal, analytics, calendar, settings, daily-summary
- set_date_range_tool: Set date range (today, 7d, 30d, 90d, ytd, 1y, all, custom)
  - For custom ranges: set_date_range_tool(date_range="custom", custom_start="YYYY-MM-DD", custom_end="YYYY-MM-DD")
- set_display_mode_tool: Set display mode (dollar, percent, r-multiple)
- set_pnl_mode_tool: Set P&L mode (net, gross)
- set_account_size_tool: Set account size

FILE UPLOAD: When a user uploads a CSV file, the system will automatically process it and include the results in the message. You will see a [FILE UPLOADED] section with the import results. Acknowledge the results and provide a brief summary.

When users ask you to do something, call the appropriate tool.
After calling the tool, confirm what you did to the user.

Examples:
- "Go to trades" → Call navigate_to_page_tool(page="trades")
- "Show last 30 days" → Call set_date_range_tool(date_range="30d")
- "Change to percent" → Call set_display_mode_tool(mode="percent")
- "Switch to net P&L" → Call set_pnl_mode_tool(mode="net")
- "Set account to 100k" → Call set_account_size_tool(size=100000)
- "Set custom date range from December 1, 2024 to December 31, 2024" → Call set_date_range_tool(date_range="custom", custom_start="2024-12-01", custom_end="2024-12-31")
"""

    # Get model from settings and configure OpenRouter
    try:
        from ..core.config import settings
        if settings.enable_openrouter and settings.openrouter_api_key:
            # Set OpenRouter API key as environment variable for PydanticAI
            os.environ['OPENROUTER_API_KEY'] = settings.openrouter_api_key
            # Also set OPENAI_API_KEY as some versions of PydanticAI check this
            os.environ['OPENAI_API_KEY'] = settings.openrouter_api_key
            model = f"openrouter:{settings.openrouter_model}"
            logger.info(f"Configured OpenRouter with model: {settings.openrouter_model}")
        else:
            model = f"openai:{settings.openai_model}"
    except Exception as e:
        logger.warning(f"Failed to load settings, using fallback: {e}")
        model = "openai:gpt-4o-mini"  # Fallback

    # Create agent without deps_type
    agent = Agent(
        model=model,
        system_prompt=system_prompt,
    )

    # Register tools using decorator pattern
    agent.tool(navigate_to_page_tool)
    agent.tool(set_date_range_tool)
    agent.tool(set_display_mode_tool)
    agent.tool(set_pnl_mode_tool)
    agent.tool(set_account_size_tool)

    logger.info(f"Created AG-UI agent with model: {model}")

    return agent


# Store agent instance
_agui_agent: Optional[Agent] = None


def get_agui_agent() -> Agent:
    """Get or create the AG-UI agent"""
    global _agui_agent
    if _agui_agent is None:
        _agui_agent = create_agui_agent()
    return _agui_agent


def enhanced_fallback_parser(message: str, attached_file: Optional[Dict[str, str]] = None) -> tuple[str, List[Dict[str, Any]]]:
    """
    Enhanced fallback parser with better command detection.
    Returns (response_text, tool_calls)
    """
    tool_calls = []
    response_text = f"I understood you want: {message}"
    message_lower = message.lower()

    # === FILE UPLOAD DETECTION ===
    # Check if message contains file upload result
    if "[FILE UPLOADED:" in message:
        # Extract the file upload result and return a friendly response
        lines = message.split('\n')
        for i, line in enumerate(lines):
            if "[FILE UPLOADED:" in line:
                file_name = line.split(": ")[1].split("]")[0] if ": " in line else "uploaded file"
                if i + 1 < len(lines) and "Result:" in lines[i + 1]:
                    result_msg = lines[i + 1].split("Result: ")[1]
                    return f"I've successfully processed your file upload ({file_name}). {result_msg}", tool_calls
        return "I've received your file upload. The trades have been imported successfully.", tool_calls

    # === ACCOUNT SIZE COMMANDS (Check first to avoid conflicts) ===
    if any(word in message_lower for word in ["account", "capital"]):
        # Match numbers with optional k suffix (e.g., "50k", "100k", "100000")
        number_match = re.search(r'(\d+)\s*k', message_lower)
        if not number_match:
            number_match = re.search(r'\d{3,}', message_lower)
        if number_match:
            size = int(number_match.group(1))
            # Handle "k" shorthand
            if "k" in message_lower:
                size = size * 1000
            tool_calls.append({"tool": "setAccountSize", "args": {"size": size}, "result": {"success": True}})
            response_text = f"Setting account size to {size:,}."
            return response_text, tool_calls

    # === NAVIGATION COMMANDS ===
    nav_keywords = ["navigate", "go to", "take me to", "open", "show"]
    if any(word in message_lower for word in nav_keywords):
        if "trade" in message_lower:
            tool_calls.append({"tool": "navigateToPage", "args": {"page": "trades"}, "result": {"success": True}})
            response_text = "Navigating to trades page."
        elif "journal" in message_lower:
            tool_calls.append({"tool": "navigateToPage", "args": {"page": "journal"}, "result": {"success": True}})
            response_text = "Navigating to journal page."
        elif any(word in message_lower for word in ["analytic", "stat"]):
            tool_calls.append({"tool": "navigateToPage", "args": {"page": "analytics"}, "result": {"success": True}})
            response_text = "Navigating to analytics page."
        elif "dashboard" in message_lower:
            tool_calls.append({"tool": "navigateToPage", "args": {"page": "dashboard"}, "result": {"success": True}})
            response_text = "Navigating to dashboard."
        elif "calendar" in message_lower:
            tool_calls.append({"tool": "navigateToPage", "args": {"page": "calendar"}, "result": {"success": True}})
            response_text = "Navigating to calendar."
        elif "setting" in message_lower:
            tool_calls.append({"tool": "navigateToPage", "args": {"page": "settings"}, "result": {"success": True}})
            response_text = "Navigating to settings."

    # === CUSTOM DATE RANGE COMMANDS ===
    # Check for custom date range patterns first (before generic date range patterns)
    custom_date_pattern = r'(?:from|between)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+(?:to|and|through|-)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})'
    custom_date_match = re.search(custom_date_pattern, message_lower, re.IGNORECASE)
    if custom_date_match:
        # Parse the dates
        from dateutil import parser
        try:
            start_date_str = custom_date_match.group(1)
            end_date_str = custom_date_match.group(2)

            # Parse dates and convert to YYYY-MM-DD format
            start_date = parser.parse(start_date_str)
            end_date = parser.parse(end_date_str)

            custom_start = start_date.strftime("%Y-%m-%d")
            custom_end = end_date.strftime("%Y-%m-%d")

            tool_calls.append({
                "tool": "setDateRange",
                "args": {
                    "range": "custom",
                    "customStart": custom_start,
                    "customEnd": custom_end
                },
                "result": {"success": True}
            })
            response_text = f"Setting custom date range from {custom_start} to {custom_end}."
        except Exception as e:
            logger.warning(f"Failed to parse custom date range: {e}")
            # Fall through to default handling

    # === DATE RANGE COMMANDS ===
    elif any(word in message_lower for word in ["show", "date range", "last", "past", "previous"]):
        number_match = re.search(r'\d+', message_lower)
        if number_match:
            number = int(number_match.group())
            if "day" in message_lower or number in [7, 30, 90]:
                range_value = f"{number}d"
            elif "week" in message_lower:
                range_value = "7d"
            elif "month" in message_lower:
                range_value = "30d"
            else:
                range_value = "90d"

            tool_calls.append({"tool": "setDateRange", "args": {"range": range_value}, "result": {"success": True}})
            response_text = f"Setting date range to {range_value}."
        elif "today" in message_lower:
            tool_calls.append({"tool": "setDateRange", "args": {"range": "today"}, "result": {"success": True}})
            response_text = "Setting date range to today."
        elif "ytd" in message_lower or "year to date" in message_lower:
            tool_calls.append({"tool": "setDateRange", "args": {"range": "ytd"}, "result": {"success": True}})
            response_text = "Setting date range to year to date."
        elif "all" in message_lower or "all time" in message_lower:
            tool_calls.append({"tool": "setDateRange", "args": {"range": "all"}, "result": {"success": True}})
            response_text = "Setting date range to all time."

    # === P&L MODE COMMANDS (Check before display mode to avoid conflicts) ===
    elif any(word in message_lower for word in ["pnl", "p&l", "profit and loss"]):
        if "net" in message_lower:
            tool_calls.append({"tool": "setPnLMode", "args": {"mode": "net"}, "result": {"success": True}})
            response_text = "Switching to net P&L mode."
        elif "gross" in message_lower:
            tool_calls.append({"tool": "setPnLMode", "args": {"mode": "gross"}, "result": {"success": True}})
            response_text = "Switching to gross P&L mode."

    # === DISPLAY MODE COMMANDS ===
    elif any(word in message_lower for word in ["switch", "change", "set", "display", "mode"]):
        if "percent" in message_lower or "percentage" in message_lower:
            tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "percent"}, "result": {"success": True}})
            response_text = "Switching to percent display mode."
        elif "dollar" in message_lower or "$" in message_lower or "usd" in message_lower:
            tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "dollar"}, "result": {"success": True}})
            response_text = "Switching to dollar display mode."
        elif "r-multiple" in message_lower or "r multiple" in message_lower or (message_lower.strip() == "r"):
            tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "r-multiple"}, "result": {"success": True}})
            response_text = "Switching to R-multiple display mode."
        elif " in r" in message_lower:
            # Catch "in R" pattern for R-multiple mode
            tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "r-multiple"}, "result": {"success": True}})
            response_text = "Switching to R-multiple display mode."

    return response_text, tool_calls


@router.post("/chat", response_model=AGUIChatResponse)
async def agui_chat(
    request: AGUIChatRequest,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    AG-UI chat endpoint with frontend tool support

    This endpoint allows the Renata agent to call frontend tools directly
    using the AG-UI protocol, replacing the old DOM scraping approach.

    Also handles attached CSV files for trade import.
    """
    try:
        # Check if file is attached and process it first
        file_result = None
        enhanced_message = request.message

        if request.attachedFile:
            logger.info(f"File attached: {request.attachedFile.get('name')}")
            file_result = await process_attached_file(
                request.attachedFile,
                request.userId or ai_ctx.user_id if ai_ctx else "default_user"
            )

            if file_result.get("success"):
                # Add file processing result to the message context
                file_info = (
                    f"\n\n[FILE UPLOADED: {file_result['file_name']}]\n"
                    f"Result: {file_result['message']}"
                )
                enhanced_message = request.message + file_info
            else:
                # File processing failed
                return AGUIChatResponse(
                    response=file_result.get("message", "Failed to process file"),
                    tool_calls=[],
                    timestamp=datetime.now().isoformat()
                )

        # Get AG-UI agent
        agent = get_agui_agent()

        # Run the agent with the enhanced message
        logger.info(f"AG-UI chat request: {enhanced_message[:100]}...")
        result = await agent.run(enhanced_message)

        # Extract tool calls from result
        tool_calls = []
        response_text = result.data

        # Check if any tools were called
        if hasattr(result, 'all_messages'):
            for msg in result.all_messages():
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    for tc in msg.tool_calls:
                        # Map tool names to frontend format
                        tool_name_mapping = {
                            "navigate_to_page_tool": "navigateToPage",
                            "set_date_range_tool": "setDateRange",
                            "set_display_mode_tool": "setDisplayMode",
                            "set_pnl_mode_tool": "setPnLMode",
                            "set_account_size_tool": "setAccountSize",
                        }
                        frontend_tool = tool_name_mapping.get(tc.function_name, tc.function_name)
                        tool_calls.append({
                            "tool": frontend_tool,
                            "args": tc.function_args,
                            "result": {"success": True}
                        })

        logger.info(f"AG-UI chat response: {len(response_text)} chars, {len(tool_calls)} tool calls")

        return AGUIChatResponse(
            response=response_text,
            tool_calls=tool_calls,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"AG-UI chat failed: {e}", exc_info=True)

        # Enhanced Fallback: Try to parse the message for simple commands
        response_text, tool_calls = enhanced_fallback_parser(request.message, request.attachedFile)

        return AGUIChatResponse(
            response=response_text,
            tool_calls=tool_calls,
            timestamp=datetime.now().isoformat()
        )


@router.get("/status")
async def agui_status():
    """AG-UI system status"""
    return {
        "status": "ok",
        "tools_available": [
            "navigate_to_page",
            "set_date_range",
            "set_display_mode",
            "set_pnl_mode",
            "set_account_size",
        ],
        "features": {
            "file_upload": True,
            "csv_import": True,
            "trade_processing": True
        },
        "agent_initialized": _agui_agent is not None,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/test")
async def test_agui():
    """Test AG-UI endpoint"""
    return {
        "status": "ok",
        "message": "AG-UI endpoints are working",
        "tools": ["navigate_to_page", "set_date_range", "set_display_mode", "set_pnl_mode", "set_account_size"]
    }
