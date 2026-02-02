"""
Archon MCP Client Integration
Client for interacting with Archon knowledge graph service
"""
import httpx
from typing import Any, Optional, List
from .config import settings
import json


class ArchonClient:
    """
    Client for Archon MCP operations.
    Provides methods for knowledge retrieval, storage, and search.
    """

    def __init__(self, base_url: str = settings.ARCHON_MCP_URL):
        self.base_url = base_url.rstrip("/")
        self.enabled = settings.ARCHON_MCP_ENABLED
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            timeout = httpx.Timeout(30.0, connect=10.0)
            self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)
        return self._client

    async def close(self) -> None:
        """Close the HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _check_enabled(self) -> None:
        """Raise error if Archon is disabled"""
        if not self.enabled:
            raise RuntimeError("Archon MCP integration is disabled")

    # Knowledge Operations

    async def search_knowledge(
        self,
        query: str,
        knowledge_type: Optional[str] = None,
        limit: int = 5,
        filters: Optional[dict[str, Any]] = None,
    ) -> List[dict[str, Any]]:
        """
        Search knowledge graph using RAG

        Args:
            query: Search query text
            knowledge_type: Optional type filter (e.g., "brand_voice", "writing_template")
            limit: Maximum results to return
            filters: Additional filter criteria

        Returns:
            List of matching knowledge items with scores
        """
        self._check_enabled()
        client = await self._get_client()

        payload = {
            "query": query,
            "limit": limit,
        }
        if knowledge_type:
            payload["knowledge_type"] = knowledge_type
        if filters:
            payload["filters"] = filters

        try:
            response = await client.post("/rag/search_knowledge_base", json=payload)
            response.raise_for_status()
            return response.json().get("results", [])
        except httpx.HTTPError as e:
            print(f"Archon search error: {e}")
            return []

    async def store_knowledge(
        self,
        knowledge_type: str,
        content: str,
        metadata: dict[str, Any],
        project_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Store knowledge in the graph

        Args:
            knowledge_type: Type of knowledge (brand_voice, writing_template, etc.)
            content: Knowledge content text
            metadata: Additional metadata dictionary
            project_id: Optional project association

        Returns:
            Knowledge ID if successful
        """
        self._check_enabled()
        client = await self._get_client()

        payload = {
            "knowledge_type": knowledge_type,
            "content": content,
            "metadata": metadata,
        }
        if project_id:
            payload["project_id"] = project_id

        try:
            response = await client.post("/knowledge/store", json=payload)
            response.raise_for_status()
            return response.json().get("knowledge_id")
        except httpx.HTTPError as e:
            print(f"Archon store error: {e}")
            return None

    async def get_similar_articles(
        self,
        announcement_type: str,
        industry: str,
        limit: int = 3,
    ) -> List[dict[str, Any]]:
        """
        Get similar completed press releases for reference

        Args:
            announcement_type: Type of announcement
            industry: Industry category
            limit: Maximum results

        Returns:
            List of similar press releases
        """
        query = f"{announcement_type} press release {industry}"
        return await self.search_knowledge(
            query=query,
            knowledge_type="completed_press_release",
            limit=limit,
        )

    async def get_brand_voice(
        self,
        client_id: str,
    ) -> Optional[dict[str, Any]]:
        """
        Retrieve client's brand voice profile

        Args:
            client_id: Client identifier

        Returns:
            Brand voice profile if found
        """
        results = await self.search_knowledge(
            query=f"brand voice {client_id}",
            knowledge_type="brand_voice",
            limit=1,
            filters={"client_id": client_id},
        )
        return results[0] if results else None

    async def store_brand_voice(
        self,
        client_id: str,
        tone: dict[str, Any],
        style_keywords: List[str],
        forbidden_phrases: List[str],
        example_texts: List[str],
    ) -> Optional[str]:
        """
        Store or update client brand voice

        Args:
            client_id: Client identifier
            tone: Tone attributes (formal, casual, etc.)
            style_keywords: Keywords to use
            forbidden_phrases: Phrases to avoid
            example_texts: Example writings

        Returns:
            Knowledge ID if successful
        """
        content = f"Brand voice for {client_id}: {json.dumps(tone)}"
        metadata = {
            "client_id": client_id,
            "tone": tone,
            "style_keywords": style_keywords,
            "forbidden_phrases": forbidden_phrases,
            "example_texts": example_texts,
        }
        return await self.store_knowledge("brand_voice", content, metadata)

    async def store_completed_article(
        self,
        request_id: str,
        client_id: str,
        headline: str,
        body_text: str,
        quality_metrics: dict[str, float],
        feedback: Optional[str] = None,
    ) -> Optional[str]:
        """
        Store completed press release for learning

        Args:
            request_id: Original request ID
            client_id: Client identifier
            headline: Article headline
            body_text: Full article body
            quality_metrics: Quality scores
            feedback: Optional client feedback

        Returns:
            Knowledge ID if successful
        """
        content = f"{headline}\n\n{body_text}"
        metadata = {
            "request_id": request_id,
            "client_id": client_id,
            "quality_metrics": quality_metrics,
            "feedback": feedback,
        }
        return await self.store_knowledge("completed_press_release", content, metadata)

    async def search_code_examples(
        self,
        query: str,
        language: Optional[str] = None,
        limit: int = 5,
    ) -> List[dict[str, Any]]:
        """
        Search code examples (for agent development)

        Args:
            query: Search query
            language: Programming language filter
            limit: Maximum results

        Returns:
            List of code examples
        """
        filters = {"language": language} if language else None
        return await self.search_knowledge(
            query=query,
            knowledge_type="code_example",
            limit=limit,
            filters=filters,
        )

    async def health_check(self) -> bool:
        """
        Check if Archon service is healthy

        Returns:
            True if service is responding
        """
        if not self.enabled:
            return False
        try:
            client = await self._get_client()
            response = await client.get("/health")
            return response.status_code == 200
        except Exception:
            return False


# Global client instance
_archon_client: Optional[ArchonClient] = None


async def get_archon_client() -> ArchonClient:
    """Get or create global Archon client"""
    global _archon_client
    if _archon_client is None:
        _archon_client = ArchonClient()
    return _archon_client
