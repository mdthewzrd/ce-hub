"""
Learning and Memory System

Extraction, logging, pattern evolution, and memory management.
"""

__version__ = "0.1.0"

from .extractor import (
    LearningExtractor,
    ResultLogger,
    WorkflowLog,
    PatternInsight,
)
from .memory import (
    MemoryManager,
    Project,
    ConversationMemory,
    SessionPersistence,
)
from .evolution import (
    PatternEvolution,
    PatternRecommendation,
    ParameterRange,
    get_pattern_evolution,
)

__all__ = [
    "LearningExtractor",
    "ResultLogger",
    "WorkflowLog",
    "PatternInsight",
    "MemoryManager",
    "Project",
    "ConversationMemory",
    "SessionPersistence",
    "PatternEvolution",
    "PatternRecommendation",
    "ParameterRange",
    "get_pattern_evolution",
]
