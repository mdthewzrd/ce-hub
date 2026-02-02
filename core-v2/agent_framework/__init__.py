"""
CE Hub v2 Agent Framework - Declarative Agent System

This package provides tools for defining and building agents using declarative
JSON configurations instead of complex Python code.
"""

# Note: Using local imports in CLI to avoid module path issues
# from core_v2.agent_framework.declarative.builders.agent_builder import AgentBuilder, build_agent_cli
# from core_v2.agent_framework.rag_enabled.rag_base import (
#     RAGEnabledAgent,
#     RAGConfig,
#     Neo4jVectorDB,
#     ChromaVectorDB,
#     KnowledgeRetrievalResult
# )

__all__ = [
    "AgentBuilder",
    "build_agent_cli",
    "RAGEnabledAgent",
    "RAGConfig",
    "Neo4jVectorDB",
    "ChromaVectorDB",
    "KnowledgeRetrievalResult"
]

__version__ = "2.0.0-alpha"
