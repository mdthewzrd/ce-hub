"""
Archon MCP Client

Handles communication with Archon MCP server for knowledge storage and retrieval.
"""

import json
import subprocess
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ArchonConfig:
    """Archon MCP configuration."""
    mcp_wrapper_path: str = "/Users/michaeldurante/archon/mcp_stdio_wrapper.py"
    timeout: int = 30


class ArchonClient:
    """Client for interacting with Archon MCP server."""

    def __init__(self, config: Optional[ArchonConfig] = None):
        self.config = config or ArchonConfig()
        self._request_id = 0

    def _send_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send a request to Archon MCP server."""
        self._request_id += 1

        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
        }

        if params:
            request["params"] = params

        try:
            result = subprocess.run(
                ["python3", self.config.mcp_wrapper_path],
                input=json.dumps(request),
                capture_output=True,
                text=True,
                timeout=self.config.timeout
            )

            if result.returncode != 0:
                return {
                    "error": f"MCP wrapper exited with code {result.returncode}",
                    "stderr": result.stderr[:500] if result.stderr else ""
                }

            if result.stdout:
                try:
                    response = json.loads(result.stdout)
                    return response
                except json.JSONDecodeError:
                    return {
                        "error": "Could not parse MCP response as JSON",
                        "raw_output": result.stdout[:500]
                    }

            return {"error": "No output from MCP wrapper"}

        except subprocess.TimeoutExpired:
            return {"error": "Request timed out"}
        except Exception as e:
            return {"error": str(e)}

    def health_check(self) -> Dict[str, Any]:
        """Check if Archon server is running."""
        # Try to connect to the HTTP health endpoint
        import requests
        try:
            response = requests.get("http://localhost:8051/health", timeout=2)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass

        # Fall back to MCP ping
        return self._send_request("ping")

    def list_projects(self, query: Optional[str] = None) -> Dict[str, Any]:
        """List projects in Archon."""
        params = {}
        if query:
            params["query"] = query
        return self._send_request("list_projects", params)

    def create_project(self, title: str, description: str = "") -> Dict[str, Any]:
        """Create a new project in Archon."""
        return self._send_request("create_project", {
            "title": title,
            "description": description
        })

    def get_project(self, project_id: str) -> Dict[str, Any]:
        """Get project details."""
        return self._send_request("get_project", {
            "project_id": project_id
        })

    def list_tasks(self, project_id: str, status: Optional[str] = None) -> Dict[str, Any]:
        """List tasks in a project."""
        params = {"project_id": project_id}
        if status:
            params["status"] = status
        return self._send_request("list_tasks", params)

    def create_task(
        self,
        project_id: str,
        title: str,
        description: str = "",
        status: str = "todo"
    ) -> Dict[str, Any]:
        """Create a new task."""
        return self._send_request("create_task", {
            "project_id": project_id,
            "title": title,
            "description": description,
            "status": status
        })

    def update_task(
        self,
        task_id: str,
        status: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update a task."""
        params = {"task_id": task_id}
        if status:
            params["status"] = status
        if description:
            params["description"] = description
        return self._send_request("update_task", params)

    def store_knowledge(
        self,
        project_id: str,
        content: str,
        document_type: str = "knowledge",
        title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Store knowledge in Archon."""
        params = {
            "project_id": project_id,
            "content": content,
            "document_type": document_type
        }
        if title:
            params["title"] = title
        if metadata:
            params["metadata"] = metadata
        return self._send_request("store_knowledge", params)

    def search_knowledge(
        self,
        project_id: str,
        query: str,
        match_count: int = 5
    ) -> Dict[str, Any]:
        """Search knowledge base using RAG."""
        return self._send_request("rag_search_knowledge_base", {
            "project_id": project_id,
            "query": query,
            "match_count": match_count
        })

    def search_code_examples(
        self,
        project_id: str,
        query: str,
        match_count: int = 3
    ) -> Dict[str, Any]:
        """Search code examples."""
        return self._send_request("rag_search_code_examples", {
            "project_id": project_id,
            "query": query,
            "match_count": match_count
        })

    def list_documents(
        self,
        project_id: str,
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """List documents in a project."""
        params = {"project_id": project_id}
        if document_type:
            params["document_type"] = document_type
        return self._send_request("list_documents", params)

    def create_document(
        self,
        project_id: str,
        title: str,
        content: str,
        document_type: str = "knowledge"
    ) -> Dict[str, Any]:
        """Create a document in Archon."""
        return self._send_request("create_document", {
            "project_id": project_id,
            "title": title,
            "content": content,
            "document_type": document_type
        })

    def update_document(
        self,
        document_id: str,
        content: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update a document."""
        params = {"document_id": document_id}
        if content:
            params["content"] = content
        if title:
            params["title"] = title
        return self._send_request("update_document", params)

    def get_available_sources(self) -> Dict[str, Any]:
        """Get available RAG sources."""
        return self._send_request("get_available_sources")
