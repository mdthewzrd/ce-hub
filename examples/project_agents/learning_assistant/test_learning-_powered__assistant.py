"""
Tests for Learning-Powered Assistant Agent
"""

import pytest
from learning-_powered__assistant_agent import Learning-PoweredAssistantAgent
from core_v2.agent_framework.rag_enabled.rag_base import RAGConfig


class TestLearning-PoweredAssistantAgent:
    """Test suite for Learning-Powered Assistant agent"""

    @pytest.fixture
    async def agent(self):
        """Create agent instance"""
        agent = Learning-PoweredAssistantAgent()
        # Disable RAG for testing
        agent.rag_config.enabled = False
        return agent

    @pytest.mark.asyncio
    async def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent is not None
        assert agent.max_tools == 10
        assert len(agent.tools) == 10

    @pytest.mark.asyncio
    async def test_system_prompt(self, agent):
        """Test system prompt is generated"""
        prompt = agent.get_system_prompt()
        assert prompt is not None
        assert len(prompt) > 0
        assert "Role:" in prompt or "role" in prompt.lower()

    @pytest.mark.asyncio
    async def test_execute_basic_task(self, agent):
        """Test basic task execution"""
        result = await agent.execute(
            task="Test task",
            use_knowledge=False
        )
        assert result is not None
        assert result["status"] == "completed"

    @pytest.mark.asyncio
    async def test_tool_limit_enforcement(self, agent):
        """Test tool limit is enforced"""
        initial_count = len(agent.tools)

        # Try to add tool beyond limit
        for i in range(agent.max_tools + 1):
            dummy_tool = type("Tool", (), {"name": "dummy_" + str(i)})()
            agent.add_tool(dummy_tool)

        # Should not exceed max_tools
        assert len(agent.tools) <= agent.max_tools

    @pytest.mark.asyncio
    async def test_metrics(self, agent):
        """Test agent metrics"""
        metrics = agent.get_metrics()
        assert metrics is not None
        assert "tool_count" in metrics
        assert "max_tools" in metrics
        assert metrics["tool_count"] == 10
