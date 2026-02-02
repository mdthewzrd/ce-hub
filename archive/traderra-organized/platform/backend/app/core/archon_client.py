"""
Archon MCP Client for Traderra AI Knowledge Backend

This module provides the interface between Traderra's FastAPI backend and the Archon
MCP server for AI knowledge management and RAG queries.

Following CE-Hub principles:
- Plan → Research → Produce → Ingest workflow
- Archon-First protocol for all AI operations
- Context as product for knowledge accumulation
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime
import json

import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ArchonConfig(BaseModel):
    """Configuration for Archon MCP connection"""
    base_url: str = "http://localhost:8181"
    timeout: int = 30
    max_retries: int = 3
    project_id: str = "7816e33d-2c75-41ab-b232-c40e3ffc2c19"  # Traderra project


class KnowledgeQuery(BaseModel):
    """Structure for RAG queries to Archon"""
    query: str = Field(description="Search query (keep short and focused)")
    source_id: Optional[str] = Field(None, description="Filter by specific source")
    match_count: int = Field(5, description="Maximum results to return")


class TradingInsight(BaseModel):
    """Structure for trading insights to be ingested into Archon"""
    content: Dict[str, Any]
    tags: List[str]
    metadata: Optional[Dict[str, Any]] = None
    insight_type: str = Field(description="Type: analysis, pattern, coaching, etc.")


@dataclass
class ArchonResponse:
    """Standardized response from Archon operations"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ArchonClient:
    """
    Archon MCP Client for Traderra AI Knowledge Operations

    This client implements the CE-Hub Archon-First protocol:
    1. All AI intelligence flows through Archon RAG queries
    2. Knowledge is systematically ingested for continuous learning
    3. Context is preserved and enhanced across interactions
    """

    def __init__(self, config: ArchonConfig = None):
        self.config = config or ArchonConfig()
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=self.config.timeout
        )
        self.project_id = self.config.project_id

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    # === RAG QUERY OPERATIONS ===

    async def search_trading_knowledge(
        self,
        query: str,
        source_id: Optional[str] = None,
        match_count: int = 5
    ) -> ArchonResponse:
        """
        Search Archon knowledge base for trading-related insights

        Args:
            query: Short, focused search query (2-5 keywords)
            source_id: Optional source filter
            match_count: Maximum results to return

        Returns:
            ArchonResponse with search results

        Example:
            results = await archon.search_trading_knowledge(
                query="risk management expectancy",
                match_count=5
            )
        """
        try:
            payload = {
                "query": query,
                "match_count": match_count
            }
            if source_id:
                payload["source_id"] = source_id

            response = await self.client.post(
                "/rag_search_knowledge_base",
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            return ArchonResponse(
                success=data.get("success", False),
                data=data.get("results", []),
                metadata={
                    "query": query,
                    "match_count": match_count,
                    "reranked": data.get("reranked", False)
                }
            )

        except Exception as e:
            logger.error(f"Archon knowledge search failed: {e}")
            return ArchonResponse(success=False, error=str(e))

    async def search_trading_code_examples(
        self,
        query: str,
        source_id: Optional[str] = None,
        match_count: int = 3
    ) -> ArchonResponse:
        """
        Search for relevant code examples in Archon knowledge base

        Args:
            query: Technical search query
            source_id: Optional source filter
            match_count: Maximum examples to return

        Returns:
            ArchonResponse with code examples
        """
        try:
            payload = {
                "query": query,
                "match_count": match_count
            }
            if source_id:
                payload["source_id"] = source_id

            response = await self.client.post(
                "/rag_search_code_examples",
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            return ArchonResponse(
                success=data.get("success", False),
                data=data.get("results", []),
                metadata={
                    "query": query,
                    "match_count": match_count,
                    "reranked": data.get("reranked", False)
                }
            )

        except Exception as e:
            logger.error(f"Archon code search failed: {e}")
            return ArchonResponse(success=False, error=str(e))

    # === KNOWLEDGE INGESTION ===

    async def ingest_trading_insight(
        self,
        insight: TradingInsight,
        title: Optional[str] = None
    ) -> ArchonResponse:
        """
        Ingest trading insight into Archon knowledge graph

        This implements the INGEST phase of Plan → Research → Produce → Ingest

        Args:
            insight: TradingInsight object with content and metadata
            title: Optional title for the document

        Returns:
            ArchonResponse with ingestion result
        """
        try:
            document_title = title or f"Trading Insight - {insight.insight_type} - {datetime.now().isoformat()}"

            payload = {
                "action": "create",
                "project_id": self.project_id,
                "title": document_title,
                "document_type": "insight",
                "content": insight.content,
                "tags": insight.tags,
                "author": "Traderra AI System"
            }

            if insight.metadata:
                payload["content"]["metadata"] = insight.metadata

            response = await self.client.post(
                "/manage_document",
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            return ArchonResponse(
                success=data.get("success", False),
                data=data.get("document"),
                metadata={
                    "document_id": data.get("document", {}).get("id"),
                    "insight_type": insight.insight_type
                }
            )

        except Exception as e:
            logger.error(f"Archon insight ingestion failed: {e}")
            return ArchonResponse(success=False, error=str(e))

    async def ingest_performance_analysis(
        self,
        user_id: str,
        analysis_data: Dict[str, Any],
        ai_insights: Dict[str, Any]
    ) -> ArchonResponse:
        """
        Ingest performance analysis results for future coaching

        Args:
            user_id: User identifier (anonymized for cross-user learning)
            analysis_data: Performance metrics and patterns
            ai_insights: AI-generated insights and coaching recommendations

        Returns:
            ArchonResponse with ingestion result
        """
        insight = TradingInsight(
            content={
                "performance_data": analysis_data,
                "ai_insights": ai_insights,
                "user_profile": user_id,  # Could be anonymized hash
                "timestamp": datetime.now().isoformat()
            },
            tags=["performance_analysis", "ai_coaching", "trading_patterns"],
            insight_type="performance_analysis",
            metadata={
                "user_id": user_id,
                "analysis_date": datetime.now().isoformat()
            }
        )

        return await self.ingest_trading_insight(
            insight,
            title=f"Performance Analysis - User {user_id[:8]} - {datetime.now().strftime('%Y-%m-%d')}"
        )

    # === PROJECT MANAGEMENT ===

    async def update_task_status(
        self,
        task_id: str,
        status: str,
        assignee: Optional[str] = None
    ) -> ArchonResponse:
        """Update task status in Archon project management"""
        try:
            payload = {
                "action": "update",
                "task_id": task_id,
                "status": status
            }
            if assignee:
                payload["assignee"] = assignee

            response = await self.client.post(
                "/manage_task",
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            return ArchonResponse(
                success=data.get("success", False),
                data=data.get("task"),
                metadata={"task_id": task_id, "status": status}
            )

        except Exception as e:
            logger.error(f"Archon task update failed: {e}")
            return ArchonResponse(success=False, error=str(e))

    # === HEALTH & STATUS ===

    async def health_check(self) -> ArchonResponse:
        """Check Archon MCP server health"""
        try:
            response = await self.client.get("/health")
            response.raise_for_status()

            data = response.json()
            return ArchonResponse(
                success=True,
                data=data,
                metadata={"timestamp": datetime.now().isoformat()}
            )

        except Exception as e:
            logger.error(f"Archon health check failed: {e}")
            return ArchonResponse(success=False, error=str(e))


# === TRADING-SPECIFIC QUERY PATTERNS ===

class TradingQueryPatterns:
    """
    Pre-defined query patterns for common trading analysis scenarios

    These patterns follow RAG best practices:
    - Short, focused queries (2-5 keywords)
    - Domain-specific terminology
    - Optimized for semantic search
    """

    PERFORMANCE_ANALYSIS = [
        "trading performance expectancy analysis",
        "risk management position sizing",
        "drawdown recovery patterns",
        "win rate profit factor correlation"
    ]

    COACHING_PATTERNS = [
        "trading psychology emotional control",
        "discipline adherence coaching strategies",
        "losing streak recovery methods",
        "overconfidence bias correction"
    ]

    RISK_MANAGEMENT = [
        "stop loss placement strategies",
        "position sizing risk control",
        "portfolio heat management",
        "maximum adverse excursion patterns"
    ]

    STRATEGY_OPTIMIZATION = [
        "backtesting validation methods",
        "strategy parameter optimization",
        "market regime adaptation",
        "performance attribution analysis"
    ]


# === SINGLETON INSTANCE ===

_archon_client: Optional[ArchonClient] = None

async def get_archon_client() -> ArchonClient:
    """Get singleton Archon client instance"""
    global _archon_client
    if _archon_client is None:
        _archon_client = ArchonClient()
    return _archon_client

async def close_archon_client():
    """Close Archon client connection"""
    global _archon_client
    if _archon_client:
        await _archon_client.client.aclose()
        _archon_client = None