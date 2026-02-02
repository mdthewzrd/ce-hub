"""
Pydantic models for API request/response schemas
"""

from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, validator, Field


class ScanFilters(BaseModel):
    """Optional filters for scan execution"""
    min_volume: Optional[float] = Field(default=10000000, description="Minimum volume filter")
    min_dollar_volume: Optional[float] = Field(default=500000000, description="Minimum dollar volume filter")
    min_price: Optional[float] = Field(default=5.0, description="Minimum price filter")
    max_price: Optional[float] = Field(default=None, description="Maximum price filter")
    exclude_tickers: Optional[List[str]] = Field(default=[], description="Tickers to exclude from scan")
    include_tickers: Optional[List[str]] = Field(default=[], description="Specific tickers to include (if empty, scan all)")


class ScanRequest(BaseModel):
    """Request model for scan execution"""
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    filters: Optional[ScanFilters] = Field(default=None, description="Optional scan filters")

    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        """Validate date format"""
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

    @validator('end_date')
    def validate_date_range(cls, v, values):
        """Validate that end_date is after start_date"""
        if 'start_date' in values:
            start = datetime.strptime(values['start_date'], '%Y-%m-%d')
            end = datetime.strptime(v, '%Y-%m-%d')
            if end < start:
                raise ValueError('End date must be after start date')
        return v


class ScanResponse(BaseModel):
    """Response model for scan initiation"""
    success: bool
    scan_id: str
    message: str
    status: str = Field(description="Current scan status")


class ScanProgress(BaseModel):
    """Model for scan progress tracking"""
    scan_id: str
    status: str = Field(description="Scan status: initializing, running, completed, failed")
    progress_percent: float = Field(default=0.0, description="Progress percentage (0-100)")
    message: str = Field(default="", description="Current status message")
    current_ticker: str = Field(default="", description="Currently processing ticker")
    total_tickers: int = Field(default=0, description="Total tickers to process")
    processed_tickers: int = Field(default=0, description="Number of processed tickers")

    # Scan configuration
    start_date: Optional[str] = Field(default=None, description="Scan start date")
    end_date: Optional[str] = Field(default=None, description="Scan end date")

    # Timing information
    created_at: Optional[datetime] = Field(default_factory=datetime.now, description="Scan creation timestamp")
    started_at: Optional[datetime] = Field(default=None, description="Scan start timestamp")
    completed_at: Optional[datetime] = Field(default=None, description="Scan completion timestamp")
    execution_time: Optional[float] = Field(default=None, description="Execution time in seconds")

    # Results summary
    results_found: int = Field(default=0, description="Number of results found")

    # Error information
    error: Optional[str] = Field(default=None, description="Error message if scan failed")


class ScanResult(BaseModel):
    """Model for individual scan result"""
    ticker: str
    date: str
    gap_pct: float
    parabolic_score: float
    lc_frontside_d2_extended: int
    lc_frontside_d3_extended_1: int
    volume: float
    dollar_volume: float
    close_price: float
    high_price: float
    low_price: float
    open_price: float

    # Technical indicators
    ema9: Optional[float] = None
    ema20: Optional[float] = None
    ema50: Optional[float] = None
    ema200: Optional[float] = None
    atr: Optional[float] = None

    # Additional metrics
    high_chg_atr: Optional[float] = None
    dist_h_9ema_atr: Optional[float] = None
    dist_h_20ema_atr: Optional[float] = None
    close_range: Optional[float] = None

    # Raw data for debugging
    raw_data: Optional[Dict[str, Any]] = Field(default=None, description="Raw scan data for debugging")


class UniverseInfo(BaseModel):
    """Model for ticker universe information"""
    total_tickers: int
    active_tickers: int
    date_range: Dict[str, str]
    last_updated: datetime
    data_source: str = "Polygon API"


class ErrorResponse(BaseModel):
    """Standard error response model"""
    success: bool = False
    error: str
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class WebSocketMessage(BaseModel):
    """Model for WebSocket messages"""
    type: str = Field(description="Message type: progress, error, complete")
    scan_id: str
    data: Dict[str, Any] = Field(description="Message payload")
    timestamp: datetime = Field(default_factory=datetime.now)