"""
Unit Tests for Project Composition Engine

This module contains comprehensive test suites for all components of the
Project Composition Engine, ensuring:

- Complete scanner isolation validation
- Parameter management integrity
- Signal aggregation accuracy
- Project configuration robustness
- Composition engine reliability

Test Categories:
- Unit Tests: Individual component testing
- Integration Tests: Component interaction testing
- Isolation Tests: Scanner contamination prevention
- Performance Tests: Execution efficiency validation
"""

import sys
import os
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

__all__ = [
    'test_project_config',
    'test_parameter_manager',
    'test_signal_aggregation',
    'test_composition_engine',
    'test_models',
    'test_integration',
    'test_isolation',
    'test_performance'
]