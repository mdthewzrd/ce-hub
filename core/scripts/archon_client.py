#!/usr/bin/env python3
"""
Archon-First Protocol Implementation
Context Engineering Hub Master Operating System

This module implements the core Archon-First Protocol that ensures all CE-Hub
workflows begin with knowledge graph synchronization as mandated by the Vision Artifact.

Key Functions:
- Project synchronization and status queries
- Knowledge graph search and retrieval
- Task coordination through Archon
- Systematic intelligence accumulation

Usage:
    from scripts.archon_client import ArchonFirst

    archon = ArchonFirst()
    status = await archon.sync_project_status("ce-hub")
    knowledge = await archon.search_knowledge("context engineering")
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import httpx

# Import performance optimization
try:
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent))
    from performance_optimizer import cache_result
except ImportError:
    # Fallback if not available
    def cache_result(namespace: str, ttl: int = 300):
        def decorator(func):
            return func
        return decorator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class ArchonFirst:
    """
    Archon-First Protocol Implementation

    Ensures all CE-Hub operations begin with knowledge graph synchronization
    and leverage existing intelligence before generating new solutions.
    """

    def __init__(self, base_url: str = "http://localhost:8181"):
        self.base_url = base_url.rstrip('/')
        self.session = httpx.AsyncClient(timeout=30.0)
        self.last_sync = None
        self._project_cache = {}
        self._knowledge_cache = {}

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.aclose()

    async def health_check(self) -> Dict[str, Any]:
        """
        Verify Archon connectivity and service health

        Returns:
            Dict with health status, response time, and service info
        """
        start_time = time.time()
        try:
            response = await self.session.get(f"{self.base_url}/api/health")
            response.raise_for_status()

            elapsed = time.time() - start_time
            health_data = response.json()

            return {
                "status": "healthy",
                "response_time_ms": round(elapsed * 1000, 2),
                "service": health_data.get("service", "unknown"),
                "timestamp": health_data.get("timestamp"),
                "archon_operational": True
            }

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"Archon health check failed: {e}")
            return {
                "status": "unhealthy",
                "response_time_ms": round(elapsed * 1000, 2),
                "error": str(e),
                "archon_operational": False
            }

    async def sync_project_status(self, project_name: str = "ce-hub") -> Dict[str, Any]:
        """
        Synchronize project status with Archon knowledge graph

        This is the mandatory first step in all Archon-First workflows.

        Args:
            project_name: Name of the project to synchronize

        Returns:
            Dict with project status, recent activities, and context
        """
        try:
            # Get all projects
            response = await self.session.get(f"{self.base_url}/api/projects")
            response.raise_for_status()

            projects_data = response.json()
            projects = projects_data.get("projects", [])

            # Find target project or get overview
            target_project = None
            for project in projects:
                if project_name.lower() in project.get("title", "").lower():
                    target_project = project
                    break

            sync_result = {
                "sync_timestamp": datetime.utcnow().isoformat(),
                "total_projects": len(projects),
                "target_project_found": target_project is not None,
                "archon_status": "connected"
            }

            if target_project:
                sync_result.update({
                    "project_id": target_project.get("id"),
                    "project_title": target_project.get("title"),
                    "created_at": target_project.get("created_at"),
                    "updated_at": target_project.get("updated_at"),
                    "docs_count": len(target_project.get("docs", [])),
                    "github_repo": target_project.get("github_repo")
                })

                # Cache project for faster subsequent access
                self._project_cache[project_name] = target_project
            else:
                # Provide general project landscape
                recent_projects = sorted(
                    projects,
                    key=lambda x: x.get("updated_at", ""),
                    reverse=True
                )[:5]

                sync_result.update({
                    "recent_projects": [
                        {
                            "title": p.get("title"),
                            "updated": p.get("updated_at", "")[:10],
                            "docs": len(p.get("docs", []))
                        }
                        for p in recent_projects
                    ]
                })

            self.last_sync = datetime.utcnow()
            logger.info(f"✓ Project sync completed for '{project_name}'")
            return sync_result

        except Exception as e:
            logger.error(f"Project synchronization failed: {e}")
            return {
                "sync_timestamp": datetime.utcnow().isoformat(),
                "archon_status": "error",
                "error": str(e),
                "fallback_mode": True
            }

    async def search_knowledge(
        self,
        query: str,
        limit: int = 10,
        include_metadata: bool = True
    ) -> Dict[str, Any]:
        """
        Search Archon knowledge graph using RAG

        This replaces memory-based approaches with systematic knowledge retrieval.

        Args:
            query: Search query for knowledge graph
            limit: Maximum number of results to return
            include_metadata: Whether to include result metadata

        Returns:
            Dict with search results, metadata, and retrieval info
        """
        try:
            # Multiple endpoint attempts since exact path might vary
            endpoints_to_try = [
                f"{self.base_url}/api/knowledge-items/search",
                f"{self.base_url}/api/knowledge/search",
                f"{self.base_url}/api/search",
                f"{self.base_url}/api/rag/search",
                f"{self.base_url}/api/documents/search"
            ]

            search_payload = {
                "query": query,
                "limit": limit,
                "include_metadata": include_metadata
            }

            for endpoint in endpoints_to_try:
                try:
                    response = await self.session.post(
                        endpoint,
                        json=search_payload,
                        headers={"Content-Type": "application/json"}
                    )

                    if response.status_code == 200:
                        results = response.json()

                        return {
                            "status": "success",
                            "query": query,
                            "endpoint_used": endpoint,
                            "result_count": len(results) if isinstance(results, list) else 1,
                            "results": results,
                            "search_timestamp": datetime.utcnow().isoformat()
                        }

                except httpx.HTTPStatusError:
                    continue  # Try next endpoint

            # If all knowledge search endpoints fail, search through projects
            logger.warning("Knowledge search endpoints not available, falling back to project search")

            # Fallback: search through project titles and descriptions
            projects_response = await self.session.get(f"{self.base_url}/api/projects")
            projects_response.raise_for_status()

            projects_data = projects_response.json()
            projects = projects_data.get("projects", [])

            # Simple text matching in projects
            query_lower = query.lower()
            matching_projects = []

            for project in projects[:limit]:
                title = project.get("title", "").lower()
                description = project.get("description", "").lower()

                if query_lower in title or query_lower in description:
                    matching_projects.append({
                        "title": project.get("title"),
                        "description": project.get("description", "")[:200],
                        "id": project.get("id"),
                        "updated_at": project.get("updated_at"),
                        "relevance": "project_match"
                    })

            return {
                "status": "fallback_success",
                "query": query,
                "fallback_method": "project_text_search",
                "result_count": len(matching_projects),
                "results": matching_projects,
                "search_timestamp": datetime.utcnow().isoformat(),
                "note": "Using project fallback - RAG endpoints not yet configured"
            }

        except Exception as e:
            logger.error(f"Knowledge search failed: {e}")
            return {
                "status": "error",
                "query": query,
                "error": str(e),
                "search_timestamp": datetime.utcnow().isoformat(),
                "fallback_mode": True
            }

    @cache_result("pattern_search", ttl=1800)  # Cache for 30 minutes
    async def find_applicable_patterns(self, task_type: str, context: str = "") -> Dict[str, Any]:
        """
        Search for applicable patterns and templates from previous work

        Args:
            task_type: Type of task (implementation, research, documentation, etc.)
            context: Additional context for pattern matching

        Returns:
            Dict with applicable patterns, templates, and recommendations
        """
        search_queries = [
            f"{task_type} patterns",
            f"{task_type} templates",
            f"{context} {task_type}" if context else task_type,
            "best practices"
        ]

        all_patterns = []
        for query in search_queries:
            results = await self.search_knowledge(query, limit=3)
            if results.get("status") in ["success", "fallback_success"]:
                all_patterns.extend(results.get("results", []))

        return {
            "task_type": task_type,
            "context": context,
            "patterns_found": len(all_patterns),
            "patterns": all_patterns[:10],  # Limit to top 10
            "search_timestamp": datetime.utcnow().isoformat(),
            "recommendation": "Review patterns before implementing new solutions"
        }

    async def log_workflow_start(self, workflow_type: str, description: str) -> Dict[str, Any]:
        """
        Log the start of a new workflow for knowledge tracking

        Args:
            workflow_type: Type of workflow (PRP, research, implementation, etc.)
            description: Description of the workflow

        Returns:
            Dict with workflow ID and tracking info
        """
        workflow_data = {
            "workflow_id": f"wf_{int(time.time())}",
            "type": workflow_type,
            "description": description,
            "started_at": datetime.utcnow().isoformat(),
            "archon_sync_status": "completed" if self.last_sync else "pending"
        }

        # In a full implementation, this would create a new task/project in Archon
        # For now, we'll log it and return tracking info
        logger.info(f"Started {workflow_type} workflow: {description}")

        return workflow_data

    async def validate_archon_first_compliance(self) -> Dict[str, Any]:
        """
        Validate that current session is compliant with Archon-First Protocol

        Returns:
            Dict with compliance status and recommendations
        """
        compliance = {
            "archon_connection": False,
            "recent_sync": False,
            "knowledge_accessible": False,
            "overall_compliance": False
        }

        # Test connection
        health = await self.health_check()
        compliance["archon_connection"] = health.get("archon_operational", False)

        # Check recent sync
        if self.last_sync:
            sync_age = datetime.utcnow() - self.last_sync
            compliance["recent_sync"] = sync_age.seconds < 3600  # Within last hour

        # Test knowledge access
        if compliance["archon_connection"]:
            knowledge_test = await self.search_knowledge("test", limit=1)
            compliance["knowledge_accessible"] = knowledge_test.get("status") in ["success", "fallback_success"]

        # Overall compliance
        compliance["overall_compliance"] = all([
            compliance["archon_connection"],
            compliance["recent_sync"] or not self.last_sync,  # Allow for first run
            compliance["knowledge_accessible"]
        ])

        recommendations = []
        if not compliance["archon_connection"]:
            recommendations.append("Verify Archon MCP server is running on localhost:8181")
        if not compliance["recent_sync"]:
            recommendations.append("Run sync_project_status() to update project context")
        if not compliance["knowledge_accessible"]:
            recommendations.append("Verify knowledge search endpoints or check fallback methods")

        return {
            "compliance_status": compliance,
            "overall_compliant": compliance["overall_compliance"],
            "recommendations": recommendations,
            "validation_timestamp": datetime.utcnow().isoformat()
        }

# Convenience functions for direct usage
async def archon_health() -> Dict[str, Any]:
    """Quick health check for Archon connectivity"""
    async with ArchonFirst() as archon:
        return await archon.health_check()

async def archon_sync(project: str = "ce-hub") -> Dict[str, Any]:
    """Quick project synchronization"""
    async with ArchonFirst() as archon:
        return await archon.sync_project_status(project)

async def archon_search(query: str, limit: int = 5) -> Dict[str, Any]:
    """Quick knowledge search"""
    async with ArchonFirst() as archon:
        return await archon.search_knowledge(query, limit)

async def archon_validate() -> Dict[str, Any]:
    """Quick compliance validation"""
    async with ArchonFirst() as archon:
        return await archon.validate_archon_first_compliance()

# CLI interface for testing
if __name__ == "__main__":
    import sys

    async def main():
        if len(sys.argv) < 2:
            print("Usage: python archon_client.py [health|sync|search|validate] [args...]")
            return

        command = sys.argv[1]

        if command == "health":
            result = await archon_health()
            print(json.dumps(result, indent=2))

        elif command == "sync":
            project = sys.argv[2] if len(sys.argv) > 2 else "ce-hub"
            result = await archon_sync(project)
            print(json.dumps(result, indent=2))

        elif command == "search":
            if len(sys.argv) < 3:
                print("Usage: python archon_client.py search <query>")
                return
            query = " ".join(sys.argv[2:])
            result = await archon_search(query)
            print(json.dumps(result, indent=2))

        elif command == "validate":
            result = await archon_validate()
            print(json.dumps(result, indent=2))

        else:
            print(f"Unknown command: {command}")

    asyncio.run(main())