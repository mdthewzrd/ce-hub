"""
Pydantic schemas for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum


class AgentType(str, Enum):
    """Types of AI agents available"""
    TRADING_AGENT = "trading_agent"
    SCAN_CREATOR = "scan_creator"
    BACKTEST_GENERATOR = "backtest_generator"
    PARAMETER_OPTIMIZER = "parameter_optimizer"


class MessageType(str, Enum):
    """WebSocket message types"""
    SCAN_CREATION = "scan_creation"
    BACKTEST_GENERATION = "backtest_generation"
    PARAMETER_OPTIMIZATION = "parameter_optimization"
    PATTERN_ANALYSIS = "pattern_analysis"
    PROGRESS_UPDATE = "progress_update"
    ERROR = "error"


class MarketCondition(str, Enum):
    """Market condition types"""
    BULLISH = "bullish"
    BEARISH = "bearish"
    SIDEWAYS = "sideways"
    VOLATILE = "volatile"
    UNKNOWN = "unknown"


# Base Models
class BaseResponse(BaseModel):
    """Base response model"""
    success: bool
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AgentResponse(BaseResponse):
    """Response from AI agent operations"""
    data: Dict[str, Any] = {}
    agent_type: AgentType
    execution_time: Optional[float] = None


# Scan Creation Models
class ScanCreationRequest(BaseModel):
    """Request to create a new scan using AI"""
    description: str = Field(..., min_length=10, description="Natural language description of desired scan")
    market_conditions: MarketCondition = Field(MarketCondition.UNKNOWN, description="Current market conditions")
    preferences: Dict[str, Any] = Field(default={}, description="User preferences for scan parameters")
    existing_scanners: List[Dict[str, Any]] = Field(default=[], description="Existing scanners to reference")
    timeframe: str = Field("1D", description="Preferred timeframe")
    volume_threshold: float = Field(1000000, description="Minimum volume threshold")


class ScanCreationResponse(BaseModel):
    """Response from scan creation"""
    scan_code: str = Field(..., description="Generated Python scan code")
    parameters: Dict[str, Any] = Field(..., description="Scan parameters")
    explanation: str = Field(..., description="Explanation of the generated scan")
    confidence_score: float = Field(..., ge=0, le=1, description="AI confidence in the scan")
    suggested_improvements: List[str] = Field(default=[], description="Suggested improvements")


# Backtest Generation Models
class BacktestRequest(BaseModel):
    """Request to generate a backtest"""
    strategy_name: str = Field(..., min_length=3, description="Name of the trading strategy")
    strategy_description: str = Field(..., min_length=20, description="Detailed strategy description")
    scan_parameters: Dict[str, Any] = Field(..., description="Parameters from the scan")
    timeframe: str = Field("1D", description="Timeframe for backtesting")
    market_conditions: MarketCondition = Field(MarketCondition.UNKNOWN, description="Market conditions")
    risk_parameters: Dict[str, Any] = Field(default={}, description="Risk management parameters")


class BacktestResponse(BaseModel):
    """Response from backtest generation"""
    strategy_config: Dict[str, Any] = Field(..., description="Complete strategy configuration")
    entry_rules: List[str] = Field(..., description="Entry conditions")
    exit_rules: List[str] = Field(..., description="Exit conditions")
    risk_management: Dict[str, Any] = Field(..., description="Risk management rules")
    expected_performance: Dict[str, Any] = Field(..., description="Expected performance metrics")
    code_template: str = Field(..., description="Backtest code template")


# Parameter Optimization Models
class ParameterOptimizationRequest(BaseModel):
    """Request to optimize scan parameters"""
    scan_id: str = Field(..., description="ID of the scan to optimize")
    current_parameters: Dict[str, Any] = Field(..., description="Current parameter values")
    performance_metrics: Dict[str, float] = Field(..., description="Current performance metrics")
    optimization_goals: List[str] = Field(..., description="Optimization objectives")
    historical_data: Optional[Dict[str, Any]] = Field(None, description="Historical performance data")
    constraints: Dict[str, Any] = Field(default={}, description="Parameter constraints")


class ParameterOptimizationResponse(BaseModel):
    """Response from parameter optimization"""
    optimized_parameters: Dict[str, Any] = Field(..., description="Optimized parameter values")
    expected_improvement: Dict[str, float] = Field(..., description="Expected performance improvement")
    optimization_rationale: str = Field(..., description="Explanation of optimization decisions")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence in optimization")
    alternative_configurations: List[Dict[str, Any]] = Field(default=[], description="Alternative parameter sets")


# Pattern Analysis Models
class PatternAnalysisRequest(BaseModel):
    """Request for market pattern analysis"""
    timeframe: str = Field("1D", description="Analysis timeframe")
    market_conditions: MarketCondition = Field(MarketCondition.UNKNOWN, description="Current market conditions")
    volume_threshold: float = Field(1000000, description="Volume threshold")
    sectors: List[str] = Field(default=[], description="Specific sectors to analyze")
    historical_days: int = Field(30, ge=1, le=365, description="Days of historical data to analyze")


class PatternAnalysisResponse(BaseModel):
    """Response from pattern analysis"""
    identified_patterns: List[Dict[str, Any]] = Field(..., description="Market patterns found")
    market_sentiment: Dict[str, Any] = Field(..., description="Overall market sentiment")
    trading_opportunities: List[Dict[str, Any]] = Field(..., description="Potential trading opportunities")
    risk_factors: List[str] = Field(..., description="Current risk factors")
    recommendations: List[str] = Field(..., description="AI recommendations")


# WebSocket Models
class WebSocketMessage(BaseModel):
    """WebSocket message structure"""
    type: MessageType
    data: Dict[str, Any] = {}
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WebSocketResponse(BaseModel):
    """WebSocket response structure"""
    type: MessageType
    data: Dict[str, Any] = {}
    success: bool = True
    message: str = ""
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Agent Status Models
class AgentStatus(BaseModel):
    """Status of an AI agent"""
    agent_type: AgentType
    ready: bool = False
    model_info: Dict[str, Any] = {}
    last_activity: Optional[datetime] = None
    performance_metrics: Dict[str, float] = {}
    error_count: int = 0


class SystemStatus(BaseModel):
    """Overall system status"""
    agents: Dict[AgentType, AgentStatus]
    websocket_connections: int = 0
    total_requests: int = 0
    average_response_time: float = 0.0
    uptime: str = ""


# Trading Data Models
class TradingSignal(BaseModel):
    """Trading signal generated by AI"""
    ticker: str
    signal_type: str = Field(..., description="buy, sell, hold")
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    parameters_used: Dict[str, Any] = {}


class ScanResult(BaseModel):
    """Result from a scan execution"""
    ticker: str
    date: str
    metrics: Dict[str, float] = {}
    score: float = Field(..., ge=0, le=100)
    signals: List[TradingSignal] = []


# Error Models
class APIError(BaseModel):
    """API error response"""
    error_type: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None