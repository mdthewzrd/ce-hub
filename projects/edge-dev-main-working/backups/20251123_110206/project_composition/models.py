"""
Database Models for Project Composition System

This module defines the data models for the project composition system,
supporting both file-based and SQL database storage approaches.

Models:
- Project: Core project information
- ProjectScanner: Scanner references within projects
- ProjectExecution: Historical execution records
- ProjectExecutionSignal: Individual signals from executions
"""

from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
import uuid


class AggregationMethodEnum(str, Enum):
    """Aggregation method enumeration"""
    UNION = "union"
    INTERSECTION = "intersection"
    WEIGHTED = "weighted"
    CUSTOM = "custom"


class ProjectStatus(str, Enum):
    """Project status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class ExecutionStatus(str, Enum):
    """Execution status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Project(BaseModel):
    """Project model for database storage"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique project identifier")
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(default="", description="Project description")
    status: ProjectStatus = Field(default=ProjectStatus.ACTIVE, description="Project status")
    aggregation_method: AggregationMethodEnum = Field(default=AggregationMethodEnum.UNION, description="Signal aggregation method")

    # Metadata
    tags: List[str] = Field(default_factory=list, description="Project tags for categorization")
    created_by: Optional[str] = Field(default=None, description="User who created the project")
    version: int = Field(default=1, description="Project configuration version")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    last_executed: Optional[datetime] = Field(default=None, description="Last execution timestamp")

    # Statistics
    execution_count: int = Field(default=0, description="Total number of executions")
    total_signals_generated: int = Field(default=0, description="Total signals generated across all executions")

    # Configuration
    settings: Dict[str, Any] = Field(default_factory=dict, description="Additional project settings")

    @validator('name')
    def validate_name(cls, v):
        """Validate project name"""
        if not v.strip():
            raise ValueError('Project name cannot be empty')
        return v.strip()

    @validator('tags')
    def validate_tags(cls, v):
        """Validate and clean tags"""
        return [tag.strip().lower() for tag in v if tag.strip()]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for file storage"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status.value,
            'aggregation_method': self.aggregation_method.value,
            'tags': self.tags,
            'created_by': self.created_by,
            'version': self.version,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_executed': self.last_executed.isoformat() if self.last_executed else None,
            'execution_count': self.execution_count,
            'total_signals_generated': self.total_signals_generated,
            'settings': self.settings
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Project':
        """Create from dictionary"""
        return cls(
            id=data['id'],
            name=data['name'],
            description=data.get('description', ''),
            status=ProjectStatus(data.get('status', 'active')),
            aggregation_method=AggregationMethodEnum(data.get('aggregation_method', 'union')),
            tags=data.get('tags', []),
            created_by=data.get('created_by'),
            version=data.get('version', 1),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            last_executed=datetime.fromisoformat(data['last_executed']) if data.get('last_executed') else None,
            execution_count=data.get('execution_count', 0),
            total_signals_generated=data.get('total_signals_generated', 0),
            settings=data.get('settings', {})
        )


class ProjectScanner(BaseModel):
    """Scanner reference within a project"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique scanner reference ID")
    project_id: str = Field(..., description="Project ID this scanner belongs to")
    scanner_id: str = Field(..., description="Scanner identifier")
    scanner_name: str = Field(..., description="Human-readable scanner name")
    scanner_file: str = Field(..., description="Path to scanner file")
    parameter_file: str = Field(..., description="Path to parameter file")

    # Configuration
    enabled: bool = Field(default=True, description="Whether scanner is enabled")
    weight: float = Field(default=1.0, ge=0.0, description="Scanner weight for aggregation")
    order_index: int = Field(default=0, description="Execution order")

    # Metadata
    scanner_type: Optional[str] = Field(default=None, description="Scanner type/category")
    description: Optional[str] = Field(default="", description="Scanner description")
    parameters_hash: Optional[str] = Field(default=None, description="Hash of current parameters")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    last_executed: Optional[datetime] = Field(default=None, description="Last execution timestamp")

    # Statistics
    execution_count: int = Field(default=0, description="Number of executions")
    avg_execution_time: float = Field(default=0.0, description="Average execution time in seconds")
    total_signals_generated: int = Field(default=0, description="Total signals generated")
    success_rate: float = Field(default=1.0, ge=0.0, le=1.0, description="Execution success rate")

    @validator('scanner_id')
    def validate_scanner_id(cls, v):
        """Validate scanner ID format"""
        if not v.strip():
            raise ValueError('Scanner ID cannot be empty')
        return v.strip()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'scanner_id': self.scanner_id,
            'scanner_name': self.scanner_name,
            'scanner_file': self.scanner_file,
            'parameter_file': self.parameter_file,
            'enabled': self.enabled,
            'weight': self.weight,
            'order_index': self.order_index,
            'scanner_type': self.scanner_type,
            'description': self.description,
            'parameters_hash': self.parameters_hash,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_executed': self.last_executed.isoformat() if self.last_executed else None,
            'execution_count': self.execution_count,
            'avg_execution_time': self.avg_execution_time,
            'total_signals_generated': self.total_signals_generated,
            'success_rate': self.success_rate
        }


class ProjectExecution(BaseModel):
    """Project execution record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique execution ID")
    project_id: str = Field(..., description="Project ID")
    execution_name: Optional[str] = Field(default=None, description="Optional execution name")

    # Execution configuration
    execution_config: Dict[str, Any] = Field(..., description="Execution configuration")
    aggregation_method: AggregationMethodEnum = Field(..., description="Aggregation method used")

    # Status and timing
    status: ExecutionStatus = Field(default=ExecutionStatus.PENDING, description="Execution status")
    started_at: Optional[datetime] = Field(default=None, description="Execution start time")
    completed_at: Optional[datetime] = Field(default=None, description="Execution completion time")
    execution_time_seconds: Optional[float] = Field(default=None, description="Total execution time")

    # Results summary
    total_signals: int = Field(default=0, description="Total signals generated")
    unique_tickers: int = Field(default=0, description="Unique tickers in results")
    unique_dates: int = Field(default=0, description="Unique dates in results")
    scanner_success_count: int = Field(default=0, description="Number of successfully executed scanners")
    scanner_error_count: int = Field(default=0, description="Number of failed scanners")

    # Detailed results
    scanner_results: Dict[str, Any] = Field(default_factory=dict, description="Results from each scanner")
    execution_errors: Dict[str, str] = Field(default_factory=dict, description="Execution errors by scanner")
    aggregation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Aggregation process metadata")

    # Performance metrics
    average_confidence: float = Field(default=0.0, description="Average signal confidence")
    scanner_contributions: Dict[str, int] = Field(default_factory=dict, description="Signal count by scanner")

    # Metadata
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    notes: Optional[str] = Field(default=None, description="Execution notes")

    @property
    def was_successful(self) -> bool:
        """Check if execution was successful"""
        return self.status == ExecutionStatus.COMPLETED and self.scanner_error_count == 0

    @property
    def duration_minutes(self) -> Optional[float]:
        """Get execution duration in minutes"""
        if self.execution_time_seconds:
            return self.execution_time_seconds / 60
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'execution_name': self.execution_name,
            'execution_config': self.execution_config,
            'aggregation_method': self.aggregation_method.value,
            'status': self.status.value,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'execution_time_seconds': self.execution_time_seconds,
            'total_signals': self.total_signals,
            'unique_tickers': self.unique_tickers,
            'unique_dates': self.unique_dates,
            'scanner_success_count': self.scanner_success_count,
            'scanner_error_count': self.scanner_error_count,
            'scanner_results': self.scanner_results,
            'execution_errors': self.execution_errors,
            'aggregation_metadata': self.aggregation_metadata,
            'average_confidence': self.average_confidence,
            'scanner_contributions': self.scanner_contributions,
            'created_at': self.created_at.isoformat(),
            'notes': self.notes
        }


class ProjectExecutionSignal(BaseModel):
    """Individual signal from a project execution"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique signal ID")
    execution_id: str = Field(..., description="Execution ID this signal belongs to")
    project_id: str = Field(..., description="Project ID")

    # Signal identification
    ticker: str = Field(..., description="Stock ticker")
    signal_date: str = Field(..., description="Signal date (YYYY-MM-DD)")
    signal_key: str = Field(..., description="Unique signal key (ticker:date)")

    # Signal details
    contributing_scanners: List[str] = Field(..., description="Scanners that generated this signal")
    scanner_count: int = Field(..., description="Number of contributing scanners")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Aggregated confidence score")

    # Signal data
    signal_data: Dict[str, Any] = Field(..., description="Complete signal data")
    aggregation_method: AggregationMethodEnum = Field(..., description="Aggregation method used")

    # Individual scanner signals
    scanner_signals: List[Dict[str, Any]] = Field(default_factory=list, description="Individual scanner signal data")

    # Metadata
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")

    @validator('signal_key')
    def validate_signal_key(cls, v, values):
        """Validate signal key format"""
        if 'ticker' in values and 'signal_date' in values:
            expected_key = f"{values['ticker']}:{values['signal_date']}"
            if v != expected_key:
                raise ValueError(f'Signal key must be {expected_key}, got {v}')
        return v

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'execution_id': self.execution_id,
            'project_id': self.project_id,
            'ticker': self.ticker,
            'signal_date': self.signal_date,
            'signal_key': self.signal_key,
            'contributing_scanners': self.contributing_scanners,
            'scanner_count': self.scanner_count,
            'confidence_score': self.confidence_score,
            'signal_data': self.signal_data,
            'aggregation_method': self.aggregation_method.value,
            'scanner_signals': self.scanner_signals,
            'created_at': self.created_at.isoformat()
        }


# SQL Migration Scripts (for future SQL database implementation)
SQL_MIGRATIONS = {
    'create_projects_table': """
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        aggregation_method VARCHAR(20) DEFAULT 'union' CHECK (aggregation_method IN ('union', 'intersection', 'weighted', 'custom')),
        tags JSON DEFAULT '[]',
        created_by VARCHAR(255),
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_executed TIMESTAMP,
        execution_count INTEGER DEFAULT 0,
        total_signals_generated INTEGER DEFAULT 0,
        settings JSON DEFAULT '{}'
    );
    """,

    'create_project_scanners_table': """
    CREATE TABLE IF NOT EXISTS project_scanners (
        id UUID PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        scanner_id VARCHAR(255) NOT NULL,
        scanner_name VARCHAR(255) NOT NULL,
        scanner_file VARCHAR(500) NOT NULL,
        parameter_file VARCHAR(500) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        weight DECIMAL(5,2) DEFAULT 1.0 CHECK (weight >= 0),
        order_index INTEGER DEFAULT 0,
        scanner_type VARCHAR(100),
        description TEXT,
        parameters_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_executed TIMESTAMP,
        execution_count INTEGER DEFAULT 0,
        avg_execution_time DECIMAL(10,3) DEFAULT 0.0,
        total_signals_generated INTEGER DEFAULT 0,
        success_rate DECIMAL(3,2) DEFAULT 1.0 CHECK (success_rate >= 0 AND success_rate <= 1),
        UNIQUE(project_id, scanner_id)
    );
    """,

    'create_project_executions_table': """
    CREATE TABLE IF NOT EXISTS project_executions (
        id UUID PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        execution_name VARCHAR(255),
        execution_config JSON NOT NULL,
        aggregation_method VARCHAR(20) NOT NULL CHECK (aggregation_method IN ('union', 'intersection', 'weighted', 'custom')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        execution_time_seconds DECIMAL(10,3),
        total_signals INTEGER DEFAULT 0,
        unique_tickers INTEGER DEFAULT 0,
        unique_dates INTEGER DEFAULT 0,
        scanner_success_count INTEGER DEFAULT 0,
        scanner_error_count INTEGER DEFAULT 0,
        scanner_results JSON DEFAULT '{}',
        execution_errors JSON DEFAULT '{}',
        aggregation_metadata JSON DEFAULT '{}',
        average_confidence DECIMAL(3,2) DEFAULT 0.0,
        scanner_contributions JSON DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
    );
    """,

    'create_project_execution_signals_table': """
    CREATE TABLE IF NOT EXISTS project_execution_signals (
        id UUID PRIMARY KEY,
        execution_id UUID REFERENCES project_executions(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        ticker VARCHAR(10) NOT NULL,
        signal_date DATE NOT NULL,
        signal_key VARCHAR(20) NOT NULL,
        contributing_scanners JSON NOT NULL,
        scanner_count INTEGER NOT NULL,
        confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
        signal_data JSON NOT NULL,
        aggregation_method VARCHAR(20) NOT NULL CHECK (aggregation_method IN ('union', 'intersection', 'weighted', 'custom')),
        scanner_signals JSON DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(execution_id, signal_key)
    );
    """,

    'create_indexes': """
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
    CREATE INDEX IF NOT EXISTS idx_project_scanners_project_id ON project_scanners(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_scanners_enabled ON project_scanners(enabled);
    CREATE INDEX IF NOT EXISTS idx_project_executions_project_id ON project_executions(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_executions_status ON project_executions(status);
    CREATE INDEX IF NOT EXISTS idx_project_executions_created_at ON project_executions(created_at);
    CREATE INDEX IF NOT EXISTS idx_project_execution_signals_execution_id ON project_execution_signals(execution_id);
    CREATE INDEX IF NOT EXISTS idx_project_execution_signals_ticker_date ON project_execution_signals(ticker, signal_date);
    """
}


# File-based storage helper functions
def create_database_directories(base_path: str) -> None:
    """Create directory structure for file-based database"""
    from pathlib import Path

    base = Path(base_path)
    directories = [
        base / "projects",
        base / "executions",
        base / "signals",
        base / "backups"
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


def get_migration_sql() -> List[str]:
    """Get all SQL migration statements"""
    return list(SQL_MIGRATIONS.values())