"""
Unit Tests for Signal Aggregation System

Tests the signal aggregation functionality including:
- Signal creation and validation
- Union aggregation method
- Intersection aggregation method
- Weighted aggregation method
- Custom aggregation method
- Signal deduplication
- Attribution tracking
- Result validation
"""

import unittest
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any

# Import the modules to test
from backend.project_composition.signal_aggregation import (
    ScannerSignal,
    AggregatedSignal,
    AggregatedSignals,
    SignalAggregator
)


class TestScannerSignal(unittest.TestCase):
    """Test ScannerSignal functionality"""

    def test_scanner_signal_creation(self):
        """Test creating a valid scanner signal"""
        signal = ScannerSignal(
            ticker="AAPL",
            date="2024-01-15",
            scanner_id="test_scanner",
            signal_data={'volume': 1000000, 'price': 150.0},
            confidence=0.85,
            weight=1.5
        )

        self.assertEqual(signal.ticker, "AAPL")
        self.assertEqual(signal.date, "2024-01-15")
        self.assertEqual(signal.scanner_id, "test_scanner")
        self.assertEqual(signal.confidence, 0.85)
        self.assertEqual(signal.weight, 1.5)

    def test_scanner_signal_validation(self):
        """Test scanner signal validation"""
        # Test empty ticker
        with self.assertRaises(ValueError):
            ScannerSignal(
                ticker="",
                date="2024-01-15",
                scanner_id="test_scanner",
                signal_data={}
            )

        # Test empty scanner ID
        with self.assertRaises(ValueError):
            ScannerSignal(
                ticker="AAPL",
                date="2024-01-15",
                scanner_id="",
                signal_data={}
            )

        # Test invalid confidence (too high)
        with self.assertRaises(ValueError):
            ScannerSignal(
                ticker="AAPL",
                date="2024-01-15",
                scanner_id="test_scanner",
                signal_data={},
                confidence=1.5
            )

        # Test invalid confidence (too low)
        with self.assertRaises(ValueError):
            ScannerSignal(
                ticker="AAPL",
                date="2024-01-15",
                scanner_id="test_scanner",
                signal_data={},
                confidence=-0.1
            )

    def test_scanner_signal_key_generation(self):
        """Test signal key generation for deduplication"""
        signal = ScannerSignal(
            ticker="AAPL",
            date="2024-01-15",
            scanner_id="test_scanner",
            signal_data={}
        )

        key = signal.get_signal_key()
        self.assertEqual(key, "AAPL:2024-01-15")

    def test_scanner_signal_serialization(self):
        """Test signal to dictionary conversion"""
        signal_data = {'volume': 1000000, 'price': 150.0}
        signal = ScannerSignal(
            ticker="AAPL",
            date="2024-01-15",
            scanner_id="test_scanner",
            signal_data=signal_data,
            confidence=0.9,
            weight=2.0
        )

        data = signal.to_dict()

        self.assertEqual(data['ticker'], "AAPL")
        self.assertEqual(data['date'], "2024-01-15")
        self.assertEqual(data['scanner_id'], "test_scanner")
        self.assertEqual(data['signal_data'], signal_data)
        self.assertEqual(data['confidence'], 0.9)
        self.assertEqual(data['weight'], 2.0)


class TestAggregatedSignal(unittest.TestCase):
    """Test AggregatedSignal functionality"""

    def test_aggregated_signal_creation(self):
        """Test creating an aggregated signal"""
        scanner_signals = [
            ScannerSignal("AAPL", "2024-01-15", "scanner1", {"price": 150.0}),
            ScannerSignal("AAPL", "2024-01-15", "scanner2", {"volume": 1000000})
        ]

        aggregated = AggregatedSignal(
            ticker="AAPL",
            date="2024-01-15",
            contributing_scanners=["scanner1", "scanner2"],
            aggregated_data={"price": 150.0, "volume": 1000000},
            confidence_score=0.85,
            signal_count=2,
            scanner_signals=scanner_signals
        )

        self.assertEqual(aggregated.ticker, "AAPL")
        self.assertEqual(aggregated.signal_count, 2)
        self.assertEqual(len(aggregated.contributing_scanners), 2)
        self.assertEqual(len(aggregated.scanner_signals), 2)

    def test_aggregated_signal_key_generation(self):
        """Test aggregated signal key generation"""
        aggregated = AggregatedSignal(
            ticker="AAPL",
            date="2024-01-15",
            contributing_scanners=["scanner1"],
            aggregated_data={},
            confidence_score=0.8,
            signal_count=1
        )

        key = aggregated.get_signal_key()
        self.assertEqual(key, "AAPL:2024-01-15")

    def test_aggregated_signal_serialization(self):
        """Test aggregated signal to dictionary conversion"""
        scanner_signals = [
            ScannerSignal("AAPL", "2024-01-15", "scanner1", {"price": 150.0})
        ]

        aggregated = AggregatedSignal(
            ticker="AAPL",
            date="2024-01-15",
            contributing_scanners=["scanner1"],
            aggregated_data={"price": 150.0},
            confidence_score=0.9,
            signal_count=1,
            scanner_signals=scanner_signals,
            aggregation_method="union"
        )

        data = aggregated.to_dict()

        self.assertEqual(data['ticker'], "AAPL")
        self.assertEqual(data['contributing_scanners'], ["scanner1"])
        self.assertEqual(data['aggregation_method'], "union")
        self.assertEqual(len(data['scanner_signals']), 1)


class TestAggregatedSignals(unittest.TestCase):
    """Test AggregatedSignals container functionality"""

    def test_aggregated_signals_creation(self):
        """Test creating aggregated signals container"""
        signals = [
            AggregatedSignal("AAPL", "2024-01-15", ["scanner1"], {}, 0.8, 1),
            AggregatedSignal("MSFT", "2024-01-15", ["scanner2"], {}, 0.9, 1)
        ]

        aggregated_signals = AggregatedSignals(
            signals=signals,
            execution_summary={}
        )

        self.assertEqual(len(aggregated_signals.signals), 2)
        self.assertIsInstance(aggregated_signals.execution_summary, dict)

    def test_execution_summary_calculation(self):
        """Test automatic execution summary calculation"""
        signals = [
            AggregatedSignal("AAPL", "2024-01-15", ["scanner1"], {}, 0.8, 1),
            AggregatedSignal("MSFT", "2024-01-15", ["scanner2"], {}, 0.9, 1),
            AggregatedSignal("AAPL", "2024-01-16", ["scanner1", "scanner2"], {}, 0.85, 2)
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})

        summary = aggregated_signals.execution_summary
        self.assertEqual(summary['total_signals'], 3)
        self.assertEqual(summary['unique_tickers'], 2)  # AAPL, MSFT
        self.assertEqual(summary['unique_dates'], 2)    # 2024-01-15, 2024-01-16

        # Check scanner contributions
        self.assertEqual(summary['scanner_contributions']['scanner1'], 2)
        self.assertEqual(summary['scanner_contributions']['scanner2'], 2)

        # Check average confidence
        expected_avg = (0.8 + 0.9 + 0.85) / 3
        self.assertAlmostEqual(summary['average_confidence'], expected_avg, places=2)

    def test_to_dataframe_conversion(self):
        """Test converting aggregated signals to DataFrame"""
        signals = [
            AggregatedSignal(
                "AAPL", "2024-01-15", ["scanner1"],
                {"price": 150.0, "volume": 1000000}, 0.8, 1
            ),
            AggregatedSignal(
                "MSFT", "2024-01-15", ["scanner2"],
                {"price": 200.0, "volume": 500000}, 0.9, 1
            )
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})
        df = aggregated_signals.to_dataframe()

        self.assertIsInstance(df, pd.DataFrame)
        self.assertEqual(len(df), 2)
        self.assertIn('ticker', df.columns)
        self.assertIn('date', df.columns)
        self.assertIn('confidence_score', df.columns)
        self.assertIn('price', df.columns)
        self.assertIn('volume', df.columns)

    def test_filter_by_confidence(self):
        """Test filtering signals by confidence threshold"""
        signals = [
            AggregatedSignal("AAPL", "2024-01-15", ["scanner1"], {}, 0.7, 1),
            AggregatedSignal("MSFT", "2024-01-15", ["scanner2"], {}, 0.9, 1),
            AggregatedSignal("GOOGL", "2024-01-15", ["scanner3"], {}, 0.6, 1)
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})
        filtered = aggregated_signals.filter_by_confidence(0.8)

        self.assertEqual(len(filtered.signals), 1)
        self.assertEqual(filtered.signals[0].ticker, "MSFT")

    def test_filter_by_scanner_count(self):
        """Test filtering signals by minimum scanner count"""
        signals = [
            AggregatedSignal("AAPL", "2024-01-15", ["scanner1"], {}, 0.8, 1),
            AggregatedSignal("MSFT", "2024-01-15", ["scanner1", "scanner2"], {}, 0.9, 2),
            AggregatedSignal("GOOGL", "2024-01-15", ["scanner1", "scanner2", "scanner3"], {}, 0.85, 3)
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})
        filtered = aggregated_signals.filter_by_scanner_count(2)

        self.assertEqual(len(filtered.signals), 2)
        tickers = [s.ticker for s in filtered.signals]
        self.assertIn("MSFT", tickers)
        self.assertIn("GOOGL", tickers)


class TestSignalAggregator(unittest.TestCase):
    """Test SignalAggregator functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.aggregator = SignalAggregator()

        # Create test scanner outputs
        self.scanner_outputs = {
            'scanner1': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'price': 150.0, 'confidence': 0.8},
                {'ticker': 'MSFT', 'date': '2024-01-15', 'price': 200.0, 'confidence': 0.9}
            ],
            'scanner2': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'volume': 1000000, 'confidence': 0.7},
                {'ticker': 'GOOGL', 'date': '2024-01-15', 'price': 100.0, 'confidence': 0.85}
            ],
            'scanner3': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'signal_strength': 5, 'confidence': 0.95}
            ]
        }

    def test_convert_to_scanner_signals(self):
        """Test converting raw outputs to ScannerSignal objects"""
        scanner_weights = {'scanner1': 1.0, 'scanner2': 1.5, 'scanner3': 2.0}
        scanner_signals = self.aggregator._convert_to_scanner_signals(
            self.scanner_outputs, scanner_weights
        )

        self.assertEqual(len(scanner_signals), 3)
        self.assertEqual(len(scanner_signals['scanner1']), 2)
        self.assertEqual(len(scanner_signals['scanner2']), 2)
        self.assertEqual(len(scanner_signals['scanner3']), 1)

        # Check weight assignment
        self.assertEqual(scanner_signals['scanner1'][0].weight, 1.0)
        self.assertEqual(scanner_signals['scanner2'][0].weight, 1.5)
        self.assertEqual(scanner_signals['scanner3'][0].weight, 2.0)

    def test_union_aggregation(self):
        """Test union aggregation method"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='union'
        )

        self.assertIsInstance(result, AggregatedSignals)

        # Should have 3 unique signals: AAPL, MSFT, GOOGL (all on same date)
        self.assertEqual(len(result.signals), 3)

        # Check AAPL signal (should combine all three scanners)
        aapl_signals = [s for s in result.signals if s.ticker == 'AAPL']
        self.assertEqual(len(aapl_signals), 1)

        aapl_signal = aapl_signals[0]
        self.assertEqual(aapl_signal.signal_count, 3)
        self.assertEqual(len(aapl_signal.contributing_scanners), 3)

        # Check aggregated data contains fields from all scanners
        self.assertIn('price', aapl_signal.aggregated_data)
        self.assertIn('volume', aapl_signal.aggregated_data)
        self.assertIn('signal_strength', aapl_signal.aggregated_data)

    def test_intersection_aggregation(self):
        """Test intersection aggregation method"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='intersection',
            custom_rules={'min_scanners': 2}
        )

        # Only AAPL should pass (found by 3 scanners, >= 2)
        self.assertEqual(len(result.signals), 1)
        self.assertEqual(result.signals[0].ticker, 'AAPL')
        self.assertEqual(result.signals[0].signal_count, 3)

    def test_intersection_aggregation_higher_threshold(self):
        """Test intersection aggregation with higher threshold"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='intersection',
            custom_rules={'min_scanners': 4}  # Higher than any signal
        )

        # No signals should pass
        self.assertEqual(len(result.signals), 0)

    def test_weighted_aggregation(self):
        """Test weighted aggregation method"""
        scanner_weights = {'scanner1': 1.0, 'scanner2': 2.0, 'scanner3': 3.0}

        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='weighted',
            scanner_weights=scanner_weights
        )

        self.assertEqual(len(result.signals), 3)

        # Check that weighted scores are calculated
        for signal in result.signals:
            self.assertIn('weighted_score', signal.aggregated_data)
            self.assertGreater(signal.aggregated_data['weighted_score'], 0)

        # AAPL should have highest weighted score due to contributing from all scanners
        aapl_signal = next(s for s in result.signals if s.ticker == 'AAPL')
        other_signals = [s for s in result.signals if s.ticker != 'AAPL']

        for other_signal in other_signals:
            self.assertGreater(
                aapl_signal.aggregated_data['weighted_score'],
                other_signal.aggregated_data['weighted_score']
            )

    def test_custom_aggregation_min_confidence(self):
        """Test custom aggregation with confidence filtering"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='custom',
            custom_rules={'min_confidence': 0.85}
        )

        # Only signals with confidence >= 0.85 should remain
        for signal in result.signals:
            self.assertGreaterEqual(signal.confidence_score, 0.85)

    def test_custom_aggregation_required_scanners(self):
        """Test custom aggregation with required scanners"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='custom',
            custom_rules={'required_scanners': ['scanner1', 'scanner2']}
        )

        # Only signals found by both scanner1 and scanner2 should remain
        for signal in result.signals:
            self.assertIn('scanner1', signal.contributing_scanners)
            self.assertIn('scanner2', signal.contributing_scanners)

        # Should only be AAPL
        self.assertEqual(len(result.signals), 1)
        self.assertEqual(result.signals[0].ticker, 'AAPL')

    def test_custom_aggregation_excluded_scanners(self):
        """Test custom aggregation with excluded scanners"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='custom',
            custom_rules={'excluded_scanners': ['scanner3']}
        )

        # No signal should include scanner3
        for signal in result.signals:
            self.assertNotIn('scanner3', signal.contributing_scanners)

    def test_custom_aggregation_max_results(self):
        """Test custom aggregation with result limit"""
        result = self.aggregator.aggregate_signals(
            self.scanner_outputs,
            method='custom',
            custom_rules={'max_results': 2}
        )

        # Should have at most 2 results
        self.assertLessEqual(len(result.signals), 2)

    def test_signal_deduplication(self):
        """Test that duplicate signals are properly deduplicated"""
        # Create scanner outputs with duplicate signals
        duplicate_outputs = {
            'scanner1': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'value1': 100},
            ],
            'scanner2': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'value2': 200},
            ]
        }

        result = self.aggregator.aggregate_signals(duplicate_outputs, method='union')

        # Should have only one AAPL signal with combined data
        self.assertEqual(len(result.signals), 1)

        aapl_signal = result.signals[0]
        self.assertEqual(aapl_signal.ticker, 'AAPL')
        self.assertEqual(aapl_signal.signal_count, 2)
        self.assertIn('value1', aapl_signal.aggregated_data)
        self.assertIn('value2', aapl_signal.aggregated_data)

    def test_confidence_score_calculation(self):
        """Test confidence score calculation for aggregated signals"""
        # Create signals with different confidence levels
        confidence_outputs = {
            'scanner1': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'confidence': 0.8},
            ],
            'scanner2': [
                {'ticker': 'AAPL', 'date': '2024-01-15', 'confidence': 0.6},
            ]
        }

        result = self.aggregator.aggregate_signals(confidence_outputs, method='union')

        # Should average the confidence scores
        aapl_signal = result.signals[0]
        expected_confidence = (0.8 + 0.6) / 2
        self.assertAlmostEqual(aapl_signal.confidence_score, expected_confidence, places=2)

    def test_signal_integrity_validation(self):
        """Test signal integrity validation"""
        signals = [
            AggregatedSignal("AAPL", "2024-01-15", ["scanner1"], {}, 0.8, 1),
            AggregatedSignal("MSFT", "2024-01-15", ["scanner2"], {}, 0.9, 1)
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})

        report = self.aggregator.validate_signal_integrity(aggregated_signals)

        self.assertTrue(report['valid'])
        self.assertEqual(len(report['issues']), 0)
        self.assertEqual(report['statistics']['total_signals'], 2)
        self.assertEqual(report['statistics']['unique_tickers'], 2)

    def test_signal_integrity_validation_with_duplicates(self):
        """Test signal integrity validation with duplicate signals"""
        # Create duplicate signals (same ticker and date)
        signals = [
            AggregatedSignal("AAPL", "2024-01-15", ["scanner1"], {}, 0.8, 1),
            AggregatedSignal("AAPL", "2024-01-15", ["scanner2"], {}, 0.9, 1)  # Duplicate
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})

        report = self.aggregator.validate_signal_integrity(aggregated_signals)

        self.assertFalse(report['valid'])
        self.assertGreater(len(report['issues']), 0)

    def test_signal_integrity_validation_missing_fields(self):
        """Test signal integrity validation with missing required fields"""
        signals = [
            AggregatedSignal("", "2024-01-15", ["scanner1"], {}, 0.8, 1),  # Empty ticker
            AggregatedSignal("MSFT", "", ["scanner2"], {}, 0.9, 1),        # Empty date
            AggregatedSignal("GOOGL", "2024-01-15", [], {}, 0.85, 0)       # No contributing scanners
        ]

        aggregated_signals = AggregatedSignals(signals=signals, execution_summary={})

        report = self.aggregator.validate_signal_integrity(aggregated_signals)

        self.assertFalse(report['valid'])
        self.assertEqual(len(report['issues']), 3)  # One for each missing field

    def test_empty_scanner_outputs(self):
        """Test aggregation with empty scanner outputs"""
        empty_outputs = {}

        result = self.aggregator.aggregate_signals(empty_outputs, method='union')

        self.assertEqual(len(result.signals), 0)
        self.assertEqual(result.execution_summary['total_signals'], 0)

    def test_invalid_aggregation_method(self):
        """Test aggregation with invalid method"""
        with self.assertRaises(ValueError):
            self.aggregator.aggregate_signals(
                self.scanner_outputs,
                method='invalid_method'
            )


if __name__ == '__main__':
    unittest.main()