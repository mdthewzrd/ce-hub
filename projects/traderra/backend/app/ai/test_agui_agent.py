"""
Simple AG-UI Test Agent

This is a minimal test agent that uses AG-UI frontend tools.
It's used to validate that the tool calling flow works end-to-end
before integrating with the full Renata agent.
"""

import asyncio
import logging
from typing import Dict, Any

from pydantic_ai import Agent, RunContext

from .agui_integration import (
    navigate_to_page,
    set_date_range,
    set_display_mode,
    set_pnl_mode,
    set_account_size,
)
from .renata_agent import TradingContext

logger = logging.getLogger(__name__)


class SimpleTestAgent:
    """
    Simple test agent with AG-UI tool support.

    This agent is used to test that AG-UI tools can be called
    by a PydanticAI agent and executed on the frontend.
    """

    def __init__(self, model: str = "openai:gpt-4o-mini"):
        self.model = model
        self.agent = None
        self._setup_agent()

    def _setup_agent(self):
        """Set up the PydanticAI agent with AG-UI tools"""

        system_prompt = """You are a test AI assistant for Traderra trading journal.

Your capabilities:
- You can navigate to different pages (dashboard, trades, journal, analytics, calendar, settings, daily-summary)
- You can change display settings (date range, display mode, P&L mode, account size)

When users ask you to do something, use the appropriate tool. For example:
- "Go to the trades page" → call navigate_to_page with page="trades"
- "Show me the last 30 days" → call set_date_range with range="30d"
- "Change to percent mode" → call set_display_mode with mode="percent"
- "Switch to net P&L" → call set_pnl_mode with mode="net"
- "Set account size to 100000" → call set_account_size with size=100000

After calling a tool, confirm to the user what you did.
"""

        # Create agent with tools
        self.agent = Agent(
            model=self.model,
            system_prompt=system_prompt,
            deps_type=TradingContext,
        )

        # Register AG-UI tools
        self.agent.tool(navigate_to_page)
        self.agent.tool(set_date_range)
        self.agent.tool(set_display_mode)
        self.agent.tool(set_pnl_mode)
        self.agent.tool(set_account_size)

        logger.info(f"Set up test agent with model: {self.model}")
        logger.info("Registered 5 AG-UI tools: navigate_to_page, set_date_range, set_display_mode, set_pnl_mode, set_account_size")

    async def process_message(
        self,
        message: str,
        context: TradingContext
    ) -> Dict[str, Any]:
        """
        Process a user message and return the agent's response.

        Args:
            message: User's message
            context: Trading context (deps for the agent)

        Returns:
            Response dict with text and any tool calls
        """
        try:
            logger.info(f"Processing message: {message[:100]}...")

            # Run the agent
            result = await self.agent.run(
                message,
                deps=context
            )

            logger.info(f"Agent response: {result.data[:100]}...")

            # Check if any tools were called
            tool_calls = []
            if hasattr(result, 'tool_calls') and result.tool_calls:
                tool_calls = result.tool_calls
                logger.info(f"Tool calls made: {len(tool_calls)}")

            return {
                "success": True,
                "response": result.data,
                "tool_calls": tool_calls,
                "all_data": result.all_messages(),
                "raw_result": str(result)
            }

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": f"I apologize, but I encountered an error: {str(e)}"
            }


async def test_simple_agent():
    """Test the simple AG-UI agent with a few example messages"""

    print("=== Simple AG-UI Agent Test ===\n")

    # Create a simple trading context for testing
    context = TradingContext(
        current_page="dashboard",
        date_range="90d",
        display_mode="dollar",
        pnl_mode="net",
        account_size=50000,
        symbols=["AAPL", "TSLA", "NVDA"]
    )

    # Create agent
    agent = SimpleTestAgent()

    test_messages = [
        "Navigate to the trades page",
        "Change the date range to 30 days",
        "Switch to percent display mode",
        "Set my account size to 75000",
    ]

    for i, message in enumerate(test_messages, 1):
        print(f"\n--- Test {i}: {message} ---")
        result = await agent.process_message(message, context)

        if result["success"]:
            print(f"Response: {result['response']}")
            if result.get("tool_calls"):
                print(f"Tool calls: {len(result['tool_calls'])}")
                for tc in result['tool_calls']:
                    print(f"  - {tc}")
        else:
            print(f"Error: {result.get('error')}")

        print("-" * 50)

    print("\n✅ Simple agent test complete")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_simple_agent())
