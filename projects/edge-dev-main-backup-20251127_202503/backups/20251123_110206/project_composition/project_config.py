"""
Project Configuration System for edge.dev Project Composition Engine

This module defines the core data structures for managing multi-scanner projects
while maintaining complete scanner isolation and zero parameter contamination.

Design Principles:
- Scanner Isolation: Each scanner maintains its own parameter space
- Zero Contamination: Projects cannot introduce parameter mixing
- Unified Execution: Multiple scanners execute as a cohesive unit
- Signal Aggregation: Combined outputs with attribution tracking
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum
import json
import os
from pathlib import Path
import uuid


class AggregationMethod(Enum):
    """Signal aggregation methods for combining scanner outputs"""
    UNION = "union"  # Combine all unique signals (default)
    INTERSECTION = "intersection"  # Only signals found by multiple scanners
    WEIGHTED = "weighted"  # Apply scanner-specific weights
    CUSTOM = "custom"  # User-defined aggregation logic


@dataclass
class ScannerReference:
    """
    Reference to an isolated scanner with its configuration

    Maintains strict isolation while enabling project-level coordination
    """
    scanner_id: str  # Unique identifier for the scanner
    scanner_file: str  # Path to the isolated scanner file
    parameter_file: str  # Path to scanner-specific parameters
    enabled: bool = True  # Whether to include in project execution
    weight: float = 1.0  # Weight for weighted aggregation
    order_index: int = 0  # Execution order within project

    def __post_init__(self):
        """Validate scanner reference configuration"""
        if not self.scanner_id:
            raise ValueError("Scanner ID cannot be empty")
        if not self.scanner_file:
            raise ValueError("Scanner file path cannot be empty")
        if self.weight < 0:
            raise ValueError("Scanner weight must be non-negative")


@dataclass
class ExecutionConfig:
    """Configuration for project execution runs"""
    date_range: Dict[str, str]  # start_date, end_date
    symbols: Optional[List[str]] = None  # Specific symbols to scan (None = all)
    filters: Optional[Dict[str, Any]] = None  # Additional scan filters
    parallel_execution: bool = True  # Execute scanners in parallel
    timeout_seconds: int = 300  # Maximum execution time per scanner


@dataclass
class ProjectConfig:
    """
    Core project configuration managing multiple isolated scanners

    This class orchestrates scanner composition while guaranteeing:
    - Complete parameter isolation between scanners
    - Zero contamination from project-level operations
    - Unified execution with signal aggregation
    - Comprehensive audit trail and versioning
    """
    project_id: str
    name: str
    description: str
    scanners: List[ScannerReference]
    aggregation_method: AggregationMethod = AggregationMethod.UNION
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    version: int = 1
    tags: List[str] = field(default_factory=list)

    # Metadata
    created_by: Optional[str] = None
    last_executed: Optional[datetime] = None
    execution_count: int = 0

    def __post_init__(self):
        """Validate project configuration"""
        if not self.project_id:
            self.project_id = str(uuid.uuid4())

        if not self.name:
            raise ValueError("Project name cannot be empty")

        # Note: Allow empty scanner list during creation - validation moved to execution time

        # Validate scanner IDs are unique
        scanner_ids = [s.scanner_id for s in self.scanners]
        if len(scanner_ids) != len(set(scanner_ids)):
            raise ValueError("Scanner IDs must be unique within project")

        # Validate scanner files exist
        for scanner in self.scanners:
            if not os.path.exists(scanner.scanner_file):
                raise ValueError(f"Scanner file not found: {scanner.scanner_file}")

    def add_scanner(self, scanner: ScannerReference) -> None:
        """Add a scanner to the project with validation"""
        # Check for duplicate scanner ID
        if any(s.scanner_id == scanner.scanner_id for s in self.scanners):
            raise ValueError(f"Scanner ID already exists: {scanner.scanner_id}")

        # Validate scanner file exists
        if not os.path.exists(scanner.scanner_file):
            raise ValueError(f"Scanner file not found: {scanner.scanner_file}")

        self.scanners.append(scanner)
        self.updated_at = datetime.now()
        self.version += 1

    def remove_scanner(self, scanner_id: str) -> bool:
        """Remove a scanner from the project"""
        original_count = len(self.scanners)
        self.scanners = [s for s in self.scanners if s.scanner_id != scanner_id]

        if len(self.scanners) < original_count:
            self.updated_at = datetime.now()
            self.version += 1
            return True
        return False

    def get_scanner(self, scanner_id: str) -> Optional[ScannerReference]:
        """Get a scanner by ID"""
        return next((s for s in self.scanners if s.scanner_id == scanner_id), None)

    def get_enabled_scanners(self) -> List[ScannerReference]:
        """Get only enabled scanners, sorted by order_index"""
        enabled = [s for s in self.scanners if s.enabled]
        return sorted(enabled, key=lambda s: s.order_index)

    def update_scanner_order(self, scanner_order: List[str]) -> None:
        """Update the execution order of scanners"""
        for i, scanner_id in enumerate(scanner_order):
            scanner = self.get_scanner(scanner_id)
            if scanner:
                scanner.order_index = i

        self.updated_at = datetime.now()
        self.version += 1

    def to_dict(self) -> Dict[str, Any]:
        """Convert project config to dictionary for serialization"""
        return {
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'scanners': [
                {
                    'scanner_id': s.scanner_id,
                    'scanner_file': s.scanner_file,
                    'parameter_file': s.parameter_file,
                    'enabled': s.enabled,
                    'weight': s.weight,
                    'order_index': s.order_index
                } for s in self.scanners
            ],
            'aggregation_method': self.aggregation_method.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'version': self.version,
            'tags': self.tags,
            'created_by': self.created_by,
            'last_executed': self.last_executed.isoformat() if self.last_executed else None,
            'execution_count': self.execution_count
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProjectConfig':
        """Create project config from dictionary"""
        scanners = [
            ScannerReference(
                scanner_id=s['scanner_id'],
                scanner_file=s['scanner_file'],
                parameter_file=s['parameter_file'],
                enabled=s.get('enabled', True),
                weight=s.get('weight', 1.0),
                order_index=s.get('order_index', 0)
            ) for s in data['scanners']
        ]

        return cls(
            project_id=data['project_id'],
            name=data['name'],
            description=data['description'],
            scanners=scanners,
            aggregation_method=AggregationMethod(data.get('aggregation_method', 'union')),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            version=data.get('version', 1),
            tags=data.get('tags', []),
            created_by=data.get('created_by'),
            last_executed=datetime.fromisoformat(data['last_executed']) if data.get('last_executed') else None,
            execution_count=data.get('execution_count', 0)
        )

    def save_to_file(self, file_path: str) -> None:
        """Save project configuration to JSON file"""
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load_from_file(cls, file_path: str) -> 'ProjectConfig':
        """Load project configuration from JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)

    def validate_isolation(self) -> Dict[str, Any]:
        """
        Validate that scanner isolation is maintained in project configuration
        Returns validation report with any issues found
        """
        report = {
            'isolation_maintained': True,
            'issues': [],
            'warnings': [],
            'scanner_count': len(self.scanners),
            'enabled_scanner_count': len(self.get_enabled_scanners())
        }

        # Check for parameter file conflicts
        parameter_files = []
        for scanner in self.scanners:
            if scanner.parameter_file in parameter_files:
                report['isolation_maintained'] = False
                report['issues'].append(f"Parameter file conflict: {scanner.parameter_file}")
            parameter_files.append(scanner.parameter_file)

        # Check for scanner file conflicts
        scanner_files = []
        for scanner in self.scanners:
            if scanner.scanner_file in scanner_files:
                report['warnings'].append(f"Same scanner file used multiple times: {scanner.scanner_file}")
            scanner_files.append(scanner.scanner_file)

        # Validate parameter files exist
        for scanner in self.scanners:
            if scanner.parameter_file and not os.path.exists(scanner.parameter_file):
                report['warnings'].append(f"Parameter file not found: {scanner.parameter_file}")

        return report


class ProjectManager:
    """
    Manager class for CRUD operations on project configurations
    """

    def __init__(self, base_path: str = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/projects"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def create_project(self, config: ProjectConfig) -> str:
        """Create a new project and return its file path"""
        project_dir = self.base_path / config.project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        config_path = project_dir / "project.config.json"
        config.save_to_file(str(config_path))

        # Create parameter directory
        param_dir = project_dir / "parameters"
        param_dir.mkdir(exist_ok=True)

        return str(config_path)

    def load_project(self, project_id: str) -> Optional[ProjectConfig]:
        """Load a project by ID"""
        config_path = self.base_path / project_id / "project.config.json"
        if config_path.exists():
            return ProjectConfig.load_from_file(str(config_path))
        return None

    def update_project(self, config: ProjectConfig) -> bool:
        """Update an existing project configuration"""
        project_dir = self.base_path / config.project_id
        if not project_dir.exists():
            return False

        config.updated_at = datetime.now()
        config.version += 1

        config_path = project_dir / "project.config.json"
        config.save_to_file(str(config_path))
        return True

    def delete_project(self, project_id: str) -> bool:
        """Delete a project and all its files"""
        project_dir = self.base_path / project_id
        if project_dir.exists():
            import shutil
            shutil.rmtree(project_dir)
            return True
        return False

    def list_projects(self) -> List[ProjectConfig]:
        """List all available projects"""
        projects = []
        for project_dir in self.base_path.iterdir():
            if project_dir.is_dir():
                config_path = project_dir / "project.config.json"
                if config_path.exists():
                    try:
                        projects.append(ProjectConfig.load_from_file(str(config_path)))
                    except Exception as e:
                        print(f"Warning: Failed to load project {project_dir.name}: {e}")
        return sorted(projects, key=lambda p: p.updated_at, reverse=True)

    def get_project_directory(self, project_id: str) -> Path:
        """Get the directory path for a project"""
        return self.base_path / project_id