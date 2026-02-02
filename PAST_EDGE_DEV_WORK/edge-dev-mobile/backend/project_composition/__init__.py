"""
Project Composition Engine for edge.dev

This module provides the foundation for composing multiple isolated scanners
into unified projects with signal aggregation capabilities.

Components:
- Project Configuration System: Manages project metadata and scanner references
- Parameter Management: Handles scanner-specific parameters with isolation
- Signal Aggregation: Combines signals from multiple scanners
- Composition Engine: Core orchestration and execution engine

Built on top of the proven AI Scanner Isolation System with 96% contamination reduction.
"""

from .project_config import ProjectConfig, ScannerReference, AggregationMethod
from .parameter_manager import ParameterManager
from .signal_aggregation import SignalAggregator, AggregatedSignals
from .composition_engine import ProjectCompositionEngine

__all__ = [
    'ProjectConfig',
    'ScannerReference',
    'AggregationMethod',
    'ParameterManager',
    'SignalAggregator',
    'AggregatedSignals',
    'ProjectCompositionEngine'
]

__version__ = "1.0.0"