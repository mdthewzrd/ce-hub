"""
RENATA_V2 AI Agent Data Models

Data structures for representing extracted strategy information
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum


class StrategyType(Enum):
    """Types of trading strategies"""
    TREND_FOLLOWING = "trend_following"
    MEAN_REVERSION = "mean_reversion"
    MOMENTUM = "momentum"
    BREAKOUT = "breakout"
    GAP = "gap"
    LIQUIDITY = "liquidity"
    PATTERN = "pattern"
    OTHER = "other"


@dataclass
class StrategySpec:
    """Strategy specification extracted from scanner code"""
    name: str
    description: str
    strategy_type: StrategyType
    entry_conditions: List[str]
    exit_conditions: List[str]
    parameters: Dict[str, Any]
    timeframe: str  # 'daily', 'intraday', 'multi_day'
    rationale: str
    scanner_type: str  # 'single' or 'multi'

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'description': self.description,
            'strategy_type': self.strategy_type.value,
            'entry_conditions': self.entry_conditions,
            'exit_conditions': self.exit_conditions,
            'parameters': self.parameters,
            'timeframe': self.timeframe,
            'rationale': self.rationale,
            'scanner_type': self.scanner_type
        }


@dataclass
class ParameterSpec:
    """Parameter specification"""
    price_thresholds: Dict[str, Any]
    volume_thresholds: Dict[str, Any]
    gap_thresholds: Dict[str, Any]
    ema_periods: Dict[str, Any]
    consecutive_day_requirements: Dict[str, Any]
    other_parameters: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'price_thresholds': self.price_thresholds,
            'volume_thresholds': self.volume_thresholds,
            'gap_thresholds': self.gap_thresholds,
            'ema_periods': self.ema_periods,
            'consecutive_day_requirements': self.consecutive_day_requirements,
            'other_parameters': self.other_parameters
        }


@dataclass
class PatternFilterSpec:
    """Pattern-specific filter specification for multi-scanners"""
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_volume: Optional[float] = None
    max_volume: Optional[float] = None
    min_gap_pct: Optional[float] = None
    max_gap_pct: Optional[float] = None
    min_gap_consecutive: Optional[int] = None
    custom_filters: Optional[List[Dict[str, Any]]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'min_price': self.min_price,
            'max_price': self.max_price,
            'min_volume': self.min_volume,
            'max_volume': self.max_volume,
            'min_gap_pct': self.min_gap_pct,
            'max_gap_pct': self.max_gap_pct,
            'min_gap_consecutive': self.min_gap_consecutive,
            'custom_filters': self.custom_filters
        }


@dataclass
class V31Mapping:
    """Mapping of strategy to v31 components"""
    needs_polygon_api: bool
    needs_smart_filters: bool
    pattern_detection_method: str
    result_format: List[str]
    stage1_workers: int
    stage3_workers: int
