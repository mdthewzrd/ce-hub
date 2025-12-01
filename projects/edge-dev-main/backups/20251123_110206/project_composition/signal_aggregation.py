"""
Signal Aggregation System for edge.dev Project Composition Engine

This module combines signals from multiple isolated scanners into unified results
while preserving complete attribution and maintaining signal integrity.

Aggregation Methods:
- Union: Combine all unique signals (default)
- Intersection: Only signals found by multiple scanners
- Weighted: Apply scanner-specific weights to signals
- Custom: User-defined aggregation logic

Core Principles:
- Signal Integrity: Original scanner outputs preserved
- Attribution Tracking: Track which scanners generated each signal
- Deduplication: Handle duplicate signals across scanners
- Performance: Efficient aggregation for large signal sets
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum
import pandas as pd
import logging
from collections import defaultdict
import json


logger = logging.getLogger(__name__)


@dataclass
class ScannerSignal:
    """Individual signal from a specific scanner"""
    ticker: str
    date: str  # YYYY-MM-DD format
    scanner_id: str
    signal_data: Dict[str, Any]  # Original scanner output
    confidence: float = 1.0  # Signal confidence (0-1)
    weight: float = 1.0  # Scanner weight for aggregation

    def __post_init__(self):
        """Validate signal data"""
        if not self.ticker:
            raise ValueError("Ticker cannot be empty")
        if not self.scanner_id:
            raise ValueError("Scanner ID cannot be empty")
        if not (0 <= self.confidence <= 1):
            raise ValueError("Confidence must be between 0 and 1")

    def get_signal_key(self) -> str:
        """Generate unique key for signal deduplication"""
        return f"{self.ticker}:{self.date}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert signal to dictionary for serialization"""
        return {
            'ticker': self.ticker,
            'date': self.date,
            'scanner_id': self.scanner_id,
            'signal_data': self.signal_data,
            'confidence': self.confidence,
            'weight': self.weight
        }


@dataclass
class AggregatedSignal:
    """Aggregated signal from multiple scanners"""
    ticker: str
    date: str
    contributing_scanners: List[str]  # Scanners that generated this signal
    aggregated_data: Dict[str, Any]  # Combined signal data
    confidence_score: float  # Aggregated confidence
    signal_count: int  # Number of contributing signals

    # Attribution details
    scanner_signals: List[ScannerSignal] = field(default_factory=list)
    aggregation_method: str = "union"
    created_at: datetime = field(default_factory=datetime.now)

    def get_signal_key(self) -> str:
        """Generate unique key for this aggregated signal"""
        return f"{self.ticker}:{self.date}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'ticker': self.ticker,
            'date': self.date,
            'contributing_scanners': self.contributing_scanners,
            'aggregated_data': self.aggregated_data,
            'confidence_score': self.confidence_score,
            'signal_count': self.signal_count,
            'scanner_signals': [s.to_dict() for s in self.scanner_signals],
            'aggregation_method': self.aggregation_method,
            'created_at': self.created_at.isoformat()
        }


@dataclass
class AggregatedSignals:
    """Container for all aggregated signals from a project execution"""
    signals: List[AggregatedSignal]
    execution_summary: Dict[str, Any]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Initialize summary statistics"""
        if not self.execution_summary:
            self.execution_summary = self._calculate_summary()

    def _calculate_summary(self) -> Dict[str, Any]:
        """Calculate execution summary statistics"""
        total_signals = len(self.signals)
        unique_tickers = len(set(s.ticker for s in self.signals))
        unique_dates = len(set(s.date for s in self.signals))

        scanner_counts = defaultdict(int)
        for signal in self.signals:
            for scanner_id in signal.contributing_scanners:
                scanner_counts[scanner_id] += 1

        avg_confidence = sum(s.confidence_score for s in self.signals) / max(total_signals, 1)

        return {
            'total_signals': total_signals,
            'unique_tickers': unique_tickers,
            'unique_dates': unique_dates,
            'scanner_contributions': dict(scanner_counts),
            'average_confidence': avg_confidence,
            'date_range': self._get_date_range()
        }

    def _get_date_range(self) -> Dict[str, str]:
        """Get the date range of all signals"""
        if not self.signals:
            return {'start': '', 'end': ''}

        dates = [s.date for s in self.signals]
        return {
            'start': min(dates),
            'end': max(dates)
        }

    def to_dataframe(self) -> pd.DataFrame:
        """Convert aggregated signals to pandas DataFrame"""
        if not self.signals:
            return pd.DataFrame()

        rows = []
        for signal in self.signals:
            row = {
                'ticker': signal.ticker,
                'date': signal.date,
                'confidence_score': signal.confidence_score,
                'signal_count': signal.signal_count,
                'contributing_scanners': ','.join(signal.contributing_scanners),
                'aggregation_method': signal.aggregation_method
            }

            # Add aggregated data fields
            row.update(signal.aggregated_data)
            rows.append(row)

        return pd.DataFrame(rows)

    def filter_by_confidence(self, min_confidence: float) -> 'AggregatedSignals':
        """Filter signals by minimum confidence score"""
        filtered_signals = [s for s in self.signals if s.confidence_score >= min_confidence]
        return AggregatedSignals(
            signals=filtered_signals,
            execution_summary={},  # Will be recalculated
            metadata=self.metadata.copy()
        )

    def filter_by_scanner_count(self, min_scanners: int) -> 'AggregatedSignals':
        """Filter signals by minimum number of contributing scanners"""
        filtered_signals = [s for s in self.signals if s.signal_count >= min_scanners]
        return AggregatedSignals(
            signals=filtered_signals,
            execution_summary={},  # Will be recalculated
            metadata=self.metadata.copy()
        )


class SignalAggregator:
    """
    Aggregates signals from multiple isolated scanners

    This class provides various methods for combining signals while maintaining
    complete attribution and preserving the integrity of the original scanner outputs.
    """

    def __init__(self):
        self.aggregation_methods = {
            'union': self._aggregate_union,
            'intersection': self._aggregate_intersection,
            'weighted': self._aggregate_weighted,
            'custom': self._aggregate_custom
        }

    def aggregate_signals(self,
                         scanner_outputs: Dict[str, List[Dict[str, Any]]],
                         method: str = 'union',
                         scanner_weights: Optional[Dict[str, float]] = None,
                         custom_rules: Optional[Dict[str, Any]] = None) -> AggregatedSignals:
        """
        Aggregate signals from multiple scanners

        Args:
            scanner_outputs: Dict mapping scanner_id to list of signal results
            method: Aggregation method ('union', 'intersection', 'weighted', 'custom')
            scanner_weights: Weight for each scanner (for weighted aggregation)
            custom_rules: Custom aggregation rules (for custom aggregation)

        Returns:
            AggregatedSignals containing the combined results
        """
        logger.info(f"Aggregating signals from {len(scanner_outputs)} scanners using {method} method")

        # Convert raw outputs to ScannerSignal objects
        scanner_signals = self._convert_to_scanner_signals(scanner_outputs, scanner_weights or {})

        # Apply aggregation method
        if method not in self.aggregation_methods:
            raise ValueError(f"Unknown aggregation method: {method}")

        aggregated_signals = self.aggregation_methods[method](scanner_signals, custom_rules or {})

        # Create execution metadata
        metadata = {
            'aggregation_method': method,
            'scanner_count': len(scanner_outputs),
            'total_input_signals': sum(len(signals) for signals in scanner_signals.values()),
            'aggregated_at': datetime.now().isoformat()
        }

        result = AggregatedSignals(
            signals=aggregated_signals,
            execution_summary={},  # Will be calculated automatically
            metadata=metadata
        )

        logger.info(f"Aggregation complete: {len(aggregated_signals)} signals generated")
        return result

    def _convert_to_scanner_signals(self,
                                   scanner_outputs: Dict[str, List[Dict[str, Any]]],
                                   scanner_weights: Dict[str, float]) -> Dict[str, List[ScannerSignal]]:
        """Convert raw scanner outputs to ScannerSignal objects"""
        scanner_signals = {}

        for scanner_id, outputs in scanner_outputs.items():
            signals = []
            weight = scanner_weights.get(scanner_id, 1.0)

            for output in outputs:
                try:
                    signal = ScannerSignal(
                        ticker=output.get('ticker', ''),
                        date=output.get('date', ''),
                        scanner_id=scanner_id,
                        signal_data=output,
                        confidence=output.get('confidence', 1.0),
                        weight=weight
                    )
                    signals.append(signal)
                except Exception as e:
                    logger.warning(f"Failed to create signal from output: {e}")
                    continue

            scanner_signals[scanner_id] = signals
            logger.debug(f"Converted {len(signals)} signals for scanner {scanner_id}")

        return scanner_signals

    def _aggregate_union(self,
                        scanner_signals: Dict[str, List[ScannerSignal]],
                        custom_rules: Dict[str, Any]) -> List[AggregatedSignal]:
        """
        Union aggregation: Combine all unique signals

        This is the default method that includes any signal found by any scanner.
        Duplicate signals (same ticker + date) are merged with attribution.
        """
        signal_map = {}  # signal_key -> AggregatedSignal

        for scanner_id, signals in scanner_signals.items():
            for signal in signals:
                signal_key = signal.get_signal_key()

                if signal_key in signal_map:
                    # Merge with existing signal
                    existing = signal_map[signal_key]
                    existing.contributing_scanners.append(scanner_id)
                    existing.scanner_signals.append(signal)
                    existing.signal_count += 1

                    # Update confidence (average of all contributing signals)
                    total_confidence = sum(s.confidence * s.weight for s in existing.scanner_signals)
                    total_weight = sum(s.weight for s in existing.scanner_signals)
                    existing.confidence_score = total_confidence / max(total_weight, 1)

                    # Merge signal data (keep all unique fields)
                    existing.aggregated_data.update(signal.signal_data)

                else:
                    # Create new aggregated signal
                    aggregated = AggregatedSignal(
                        ticker=signal.ticker,
                        date=signal.date,
                        contributing_scanners=[scanner_id],
                        aggregated_data=signal.signal_data.copy(),
                        confidence_score=signal.confidence * signal.weight,
                        signal_count=1,
                        scanner_signals=[signal],
                        aggregation_method='union'
                    )
                    signal_map[signal_key] = aggregated

        return list(signal_map.values())

    def _aggregate_intersection(self,
                               scanner_signals: Dict[str, List[ScannerSignal]],
                               custom_rules: Dict[str, Any]) -> List[AggregatedSignal]:
        """
        Intersection aggregation: Only signals found by multiple scanners

        Requires signals to be found by at least min_scanners (default: 2)
        """
        min_scanners = custom_rules.get('min_scanners', 2)

        # First, do union aggregation to identify all signals
        union_signals = self._aggregate_union(scanner_signals, custom_rules)

        # Filter to only signals with sufficient scanner agreement
        intersection_signals = []
        for signal in union_signals:
            if signal.signal_count >= min_scanners:
                signal.aggregation_method = 'intersection'
                intersection_signals.append(signal)

        logger.info(f"Intersection aggregation: {len(intersection_signals)}/{len(union_signals)} signals meet minimum scanner requirement ({min_scanners})")
        return intersection_signals

    def _aggregate_weighted(self,
                           scanner_signals: Dict[str, List[ScannerSignal]],
                           custom_rules: Dict[str, Any]) -> List[AggregatedSignal]:
        """
        Weighted aggregation: Apply scanner-specific weights

        Similar to union but with enhanced weighting based on scanner reliability
        """
        # Start with union aggregation
        union_signals = self._aggregate_union(scanner_signals, custom_rules)

        # Apply enhanced weighting
        for signal in union_signals:
            signal.aggregation_method = 'weighted'

            # Calculate weighted confidence score
            total_weighted_confidence = 0
            total_weight = 0

            for scanner_signal in signal.scanner_signals:
                weight = scanner_signal.weight
                confidence = scanner_signal.confidence
                total_weighted_confidence += confidence * weight * weight  # Square weight for emphasis
                total_weight += weight

            signal.confidence_score = total_weighted_confidence / max(total_weight, 1)

            # Add weight-based ranking
            signal.aggregated_data['weighted_score'] = signal.confidence_score * total_weight

        return union_signals

    def _aggregate_custom(self,
                         scanner_signals: Dict[str, List[ScannerSignal]],
                         custom_rules: Dict[str, Any]) -> List[AggregatedSignal]:
        """
        Custom aggregation: User-defined rules

        Supports custom filtering, weighting, and combination logic
        """
        # Default to union if no custom rules provided
        if not custom_rules:
            return self._aggregate_union(scanner_signals, custom_rules)

        # Start with base aggregation method
        base_method = custom_rules.get('base_method', 'union')
        if base_method in self.aggregation_methods and base_method != 'custom':
            base_signals = self.aggregation_methods[base_method](scanner_signals, custom_rules)
        else:
            base_signals = self._aggregate_union(scanner_signals, custom_rules)

        # Apply custom filters
        filtered_signals = base_signals

        # Filter by custom confidence threshold
        if 'min_confidence' in custom_rules:
            min_conf = custom_rules['min_confidence']
            filtered_signals = [s for s in filtered_signals if s.confidence_score >= min_conf]

        # Filter by required scanners
        if 'required_scanners' in custom_rules:
            required = set(custom_rules['required_scanners'])
            filtered_signals = [s for s in filtered_signals
                              if required.issubset(set(s.contributing_scanners))]

        # Filter by excluded scanners
        if 'excluded_scanners' in custom_rules:
            excluded = set(custom_rules['excluded_scanners'])
            filtered_signals = [s for s in filtered_signals
                              if not excluded.intersection(set(s.contributing_scanners))]

        # Apply custom ranking
        if 'ranking_field' in custom_rules:
            ranking_field = custom_rules['ranking_field']
            reverse = custom_rules.get('ranking_descending', True)

            def get_ranking_value(signal):
                return signal.aggregated_data.get(ranking_field, 0)

            filtered_signals.sort(key=get_ranking_value, reverse=reverse)

        # Limit results
        if 'max_results' in custom_rules:
            max_results = custom_rules['max_results']
            filtered_signals = filtered_signals[:max_results]

        # Mark as custom aggregation
        for signal in filtered_signals:
            signal.aggregation_method = 'custom'

        logger.info(f"Custom aggregation applied: {len(filtered_signals)} signals after filtering")
        return filtered_signals

    def validate_signal_integrity(self, aggregated_signals: AggregatedSignals) -> Dict[str, Any]:
        """
        Validate the integrity of aggregated signals

        Returns:
            Validation report with any issues found
        """
        report = {
            'valid': True,
            'issues': [],
            'warnings': [],
            'statistics': {
                'total_signals': len(aggregated_signals.signals),
                'unique_tickers': len(set(s.ticker for s in aggregated_signals.signals)),
                'date_range_days': 0
            }
        }

        # Check for duplicate signals
        signal_keys = [s.get_signal_key() for s in aggregated_signals.signals]
        if len(signal_keys) != len(set(signal_keys)):
            duplicates = [key for key in set(signal_keys) if signal_keys.count(key) > 1]
            report['issues'].append(f"Duplicate signals found: {duplicates}")
            report['valid'] = False

        # Check for missing required fields
        for i, signal in enumerate(aggregated_signals.signals):
            if not signal.ticker:
                report['issues'].append(f"Signal {i}: Missing ticker")
                report['valid'] = False
            if not signal.date:
                report['issues'].append(f"Signal {i}: Missing date")
                report['valid'] = False
            if not signal.contributing_scanners:
                report['issues'].append(f"Signal {i}: No contributing scanners")
                report['valid'] = False

        # Check confidence scores
        invalid_confidence = [i for i, s in enumerate(aggregated_signals.signals)
                            if not (0 <= s.confidence_score <= 1)]
        if invalid_confidence:
            report['warnings'].append(f"Invalid confidence scores at indices: {invalid_confidence}")

        # Calculate date range
        if aggregated_signals.signals:
            dates = [s.date for s in aggregated_signals.signals]
            try:
                from datetime import datetime
                date_objects = [datetime.strptime(d, '%Y-%m-%d') for d in dates]
                date_range = (max(date_objects) - min(date_objects)).days
                report['statistics']['date_range_days'] = date_range
            except ValueError:
                report['warnings'].append("Invalid date formats detected")

        return report