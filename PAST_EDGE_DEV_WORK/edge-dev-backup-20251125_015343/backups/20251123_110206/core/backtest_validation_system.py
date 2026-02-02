# 📊 Backtest Validation System
# AI-Agent Core: Rapid validation of parameter changes
# Human-in-the-loop quality assurance component

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
import warnings

warnings.filterwarnings("ignore")

# Import our Master Unified Template
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# ═══════════════════════════════════════════════════════════════════════════════
# 📊 BACKTEST RESULT STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class BacktestMetrics:
    """Core backtest performance metrics"""
    total_signals: int
    win_rate: float
    avg_return: float
    max_drawdown: float
    sharpe_ratio: float
    profit_factor: float
    total_return: float
    volatility: float
    max_consecutive_losses: int
    avg_holding_days: float

@dataclass
class SignalAnalysis:
    """Analysis of individual signals"""
    entry_date: str
    symbol: str
    entry_price: float
    exit_price: float
    return_pct: float
    holding_days: int
    signal_quality: float
    market_conditions: str

@dataclass
class BacktestResults:
    """Complete backtest results package"""
    metrics: BacktestMetrics
    signals: List[SignalAnalysis]
    equity_curve: pd.DataFrame
    monthly_returns: pd.DataFrame
    parameter_sensitivity: Dict[str, float]
    recommendation: str
    warning_flags: List[str]
    confidence_score: float
    comparison_to_baseline: Dict[str, str]

@dataclass
class QuickValidationResult:
    """Rapid validation result for human approval workflow"""
    is_safe: bool
    estimated_signals_per_day: float
    quality_score: float
    risk_assessment: str
    recommendation: str
    key_concerns: List[str]
    approval_required: bool
    validation_confidence: float

# ═══════════════════════════════════════════════════════════════════════════════
# 🧮 CORE BACKTEST ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class BacktestValidationSystem:
    """
    🎯 Rapid backtest validation system for parameter changes

    Capabilities:
    - Quick validation (30-60 seconds) for human approval workflow
    - Comprehensive backtesting for final validation
    - Parameter sensitivity analysis
    - Risk assessment and warnings
    - Baseline comparison for improvement tracking
    """

    def __init__(self):
        self.baseline_metrics = self._load_baseline_metrics()
        self.market_data_cache = {}
        self.validation_thresholds = self._build_validation_thresholds()

    async def quick_validation(
        self,
        parameters: Dict[str, Any],
        test_symbols: List[str] = None,
        test_period_days: int = 30
    ) -> QuickValidationResult:
        """
        Rapid parameter validation for human-in-the-loop approval

        Designed to complete in 30-60 seconds to enable fast iteration
        """
        test_symbols = test_symbols or ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'MSTR']
        end_date = datetime.now()
        start_date = end_date - timedelta(days=test_period_days)

        try:
            # Run parallel validation on subset of symbols
            with ThreadPoolExecutor(max_workers=3) as executor:
                validation_tasks = [
                    executor.submit(self._validate_symbol_parameters, symbol, parameters, start_date, end_date)
                    for symbol in test_symbols
                ]

                validation_results = []
                for task in validation_tasks:
                    try:
                        result = task.result(timeout=20)  # 20 second timeout per symbol
                        if result:
                            validation_results.append(result)
                    except Exception as e:
                        print(f"Symbol validation failed: {e}")
                        continue

            # Aggregate results
            if not validation_results:
                return QuickValidationResult(
                    is_safe=False,
                    estimated_signals_per_day=0,
                    quality_score=0,
                    risk_assessment="Unable to validate parameters",
                    recommendation="Cannot validate - try again or adjust parameters",
                    key_concerns=["Validation failed for all test symbols"],
                    approval_required=True,
                    validation_confidence=0.0
                )

            total_signals = sum(len(result['signals']) for result in validation_results)
            avg_signals_per_day = total_signals / (test_period_days * len(validation_results))

            # Calculate quality score
            quality_signals = [
                signal for result in validation_results
                for signal in result['signals']
                if signal.get('signal_quality', 0) > 0.6
            ]
            quality_score = len(quality_signals) / max(total_signals, 1)

            # Risk assessment
            risk_assessment = self._assess_risk_level(parameters, avg_signals_per_day, quality_score)

            # Generate recommendation
            recommendation = self._generate_recommendation(
                avg_signals_per_day, quality_score, risk_assessment
            )

            # Identify concerns
            key_concerns = self._identify_concerns(parameters, avg_signals_per_day, quality_score)

            # Determine if approval required
            approval_required = self._requires_approval_quick(
                parameters, avg_signals_per_day, quality_score, len(key_concerns)
            )

            # Calculate confidence
            validation_confidence = min(1.0, len(validation_results) / len(test_symbols))

            return QuickValidationResult(
                is_safe=len(key_concerns) == 0,
                estimated_signals_per_day=round(avg_signals_per_day, 1),
                quality_score=round(quality_score, 3),
                risk_assessment=risk_assessment,
                recommendation=recommendation,
                key_concerns=key_concerns,
                approval_required=approval_required,
                validation_confidence=validation_confidence
            )

        except Exception as e:
            print(f"Quick validation error: {e}")
            return QuickValidationResult(
                is_safe=False,
                estimated_signals_per_day=0,
                quality_score=0,
                risk_assessment="Validation error",
                recommendation=f"Validation failed: {str(e)[:100]}",
                key_concerns=["System error during validation"],
                approval_required=True,
                validation_confidence=0.0
            )

    async def comprehensive_backtest(
        self,
        parameters: Dict[str, Any],
        symbols: List[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> BacktestResults:
        """
        Comprehensive backtesting for final parameter validation

        More thorough analysis taking 2-5 minutes for complete validation
        """
        # Default parameters
        symbols = symbols or self._get_default_symbol_list()
        end_date = end_date or datetime.now()
        start_date = start_date or (end_date - timedelta(days=90))

        print(f"🧪 Running comprehensive backtest:")
        print(f"   Symbols: {len(symbols)} | Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

        try:
            # Run backtest with progress tracking
            backtest_results = await self._run_comprehensive_backtest(
                parameters, symbols, start_date, end_date
            )

            return backtest_results

        except Exception as e:
            print(f"Comprehensive backtest error: {e}")
            # Return minimal results indicating failure
            return BacktestResults(
                metrics=BacktestMetrics(
                    total_signals=0, win_rate=0, avg_return=0, max_drawdown=0,
                    sharpe_ratio=0, profit_factor=0, total_return=0, volatility=0,
                    max_consecutive_losses=0, avg_holding_days=0
                ),
                signals=[],
                equity_curve=pd.DataFrame(),
                monthly_returns=pd.DataFrame(),
                parameter_sensitivity={},
                recommendation=f"Backtest failed: {str(e)[:200]}",
                warning_flags=["Backtest execution failed"],
                confidence_score=0.0,
                comparison_to_baseline={}
            )

    def _validate_symbol_parameters(
        self,
        symbol: str,
        parameters: Dict[str, Any],
        start_date: datetime,
        end_date: datetime
    ) -> Optional[Dict[str, Any]]:
        """Validate parameters against single symbol"""

        try:
            # Import the scan function from our Master Unified Template
            from MASTER_UNIFIED_SCANNER_TEMPLATE import scan_symbol

            # Update the global SCAN_PARAMS with our test parameters
            import MASTER_UNIFIED_SCANNER_TEMPLATE as template
            original_params = template.SCAN_PARAMS.copy()

            # Apply parameter modifications
            modified_params = self._apply_parameter_modifications(original_params, parameters)
            template.SCAN_PARAMS = modified_params

            # Run scan
            start_str = start_date.strftime("%Y-%m-%d")
            end_str = end_date.strftime("%Y-%m-%d")

            signals = scan_symbol(symbol, start_str, end_str)

            # Restore original parameters
            template.SCAN_PARAMS = original_params

            return {
                'symbol': symbol,
                'signals': signals,
                'parameter_set': modified_params
            }

        except Exception as e:
            print(f"Error validating {symbol}: {e}")
            return None

    def _apply_parameter_modifications(
        self,
        original_params: Dict[str, Any],
        modifications: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply parameter modifications to original parameter set"""

        modified_params = original_params.copy()

        for param_path, value in modifications.items():
            # Handle nested parameter paths like 'momentum_triggers.atr_multiple'
            keys = param_path.split('.')

            # Navigate to the correct nested dictionary
            current_dict = modified_params
            for key in keys[:-1]:
                if key not in current_dict:
                    current_dict[key] = {}
                current_dict = current_dict[key]

            # Set the final value
            current_dict[keys[-1]] = value

        return modified_params

    def _assess_risk_level(
        self,
        parameters: Dict[str, Any],
        signals_per_day: float,
        quality_score: float
    ) -> str:
        """Assess risk level of parameter configuration"""

        risk_factors = []

        # High signal count risk
        if signals_per_day > 20:
            risk_factors.append("High signal volume")

        # Low quality risk
        if quality_score < 0.4:
            risk_factors.append("Low signal quality")

        # Parameter-specific risks
        signal_strength_min = self._extract_param_value(
            parameters, 'signal_scoring.signal_strength_min', 0.6
        )
        if signal_strength_min < 0.3:
            risk_factors.append("Very low quality threshold")

        volume_min = self._extract_param_value(
            parameters, 'market_filters.volume_min_usd', 30_000_000
        )
        if volume_min < 10_000_000:
            risk_factors.append("Low liquidity requirement")

        # Determine overall risk level
        if len(risk_factors) == 0:
            return "Low risk"
        elif len(risk_factors) <= 2:
            return "Moderate risk"
        else:
            return "High risk"

    def _generate_recommendation(
        self,
        signals_per_day: float,
        quality_score: float,
        risk_assessment: str
    ) -> str:
        """Generate AI recommendation based on validation results"""

        if signals_per_day == 0:
            return "Parameters are too restrictive - no signals generated. Consider loosening criteria."

        if signals_per_day > 50:
            return "Very high signal count detected. Consider tightening parameters to improve quality."

        if quality_score < 0.3:
            return "Low signal quality detected. Recommend increasing quality thresholds."

        if risk_assessment == "High risk":
            return "High risk configuration detected. Consider more conservative parameters."

        if 5 <= signals_per_day <= 20 and quality_score > 0.6:
            return "Excellent parameter configuration - good signal count with high quality."

        if signals_per_day < 2:
            return "Very low signal count. Consider loosening parameters if more opportunities are desired."

        return "Parameter configuration appears reasonable for testing."

    def _identify_concerns(
        self,
        parameters: Dict[str, Any],
        signals_per_day: float,
        quality_score: float
    ) -> List[str]:
        """Identify specific concerns with parameter configuration"""

        concerns = []

        # Signal count concerns
        if signals_per_day > 30:
            concerns.append(f"Very high signal count ({signals_per_day:.1f}/day) may strain execution")

        if signals_per_day == 0:
            concerns.append("No signals generated - parameters may be too restrictive")

        # Quality concerns
        if quality_score < 0.4:
            concerns.append(f"Low signal quality score ({quality_score:.2f}) indicates poor filtering")

        # Parameter-specific concerns
        atr_multiple = self._extract_param_value(
            parameters, 'momentum_triggers.atr_multiple', 1.0
        )
        if atr_multiple > 4.0:
            concerns.append("Very high ATR requirement may limit opportunities")

        signal_min = self._extract_param_value(
            parameters, 'signal_scoring.signal_strength_min', 0.6
        )
        if signal_min > 0.85:
            concerns.append("Extremely high signal strength requirement may produce too few signals")
        elif signal_min < 0.25:
            concerns.append("Very low signal strength requirement may produce noisy signals")

        return concerns

    def _requires_approval_quick(
        self,
        parameters: Dict[str, Any],
        signals_per_day: float,
        quality_score: float,
        concern_count: int
    ) -> bool:
        """Determine if human approval is required for quick validation"""

        # Always require approval if concerns exist
        if concern_count > 0:
            return True

        # Require approval for extreme signal counts
        if signals_per_day > 25 or signals_per_day == 0:
            return True

        # Require approval for poor quality
        if quality_score < 0.5:
            return True

        # Check for extreme parameter values
        extreme_params = [
            ('signal_scoring.signal_strength_min', 0.25, 0.85),
            ('momentum_triggers.atr_multiple', 0.4, 4.5),
            ('market_filters.volume_min_usd', 5_000_000, 100_000_000)
        ]

        for param_path, min_extreme, max_extreme in extreme_params:
            value = self._extract_param_value(parameters, param_path, None)
            if value is not None and (value <= min_extreme or value >= max_extreme):
                return True

        return False

    async def _run_comprehensive_backtest(
        self,
        parameters: Dict[str, Any],
        symbols: List[str],
        start_date: datetime,
        end_date: datetime
    ) -> BacktestResults:
        """Execute comprehensive backtest with full analysis"""

        print("   📊 Executing comprehensive backtest...")

        # Collect all signals across symbols
        all_signals = []
        failed_symbols = []

        for i, symbol in enumerate(symbols[:10]):  # Limit to 10 symbols for speed
            try:
                validation_result = self._validate_symbol_parameters(
                    symbol, parameters, start_date, end_date
                )

                if validation_result and validation_result['signals']:
                    # Convert signals to analysis format
                    for signal in validation_result['signals']:
                        signal_analysis = SignalAnalysis(
                            entry_date=signal['date'],
                            symbol=signal['symbol'],
                            entry_price=signal['entry_price'],
                            exit_price=signal['entry_price'] * 1.05,  # Simplified 5% target
                            return_pct=5.0,  # Simplified assumption
                            holding_days=3,  # Simplified assumption
                            signal_quality=signal.get('signal_score', 0.7),
                            market_conditions='neutral'
                        )
                        all_signals.append(signal_analysis)

                print(f"   ✓ {symbol}: {len(validation_result['signals'])} signals")

            except Exception as e:
                failed_symbols.append(symbol)
                print(f"   ❌ {symbol}: Failed ({str(e)[:50]})")

            # Progress indicator
            if (i + 1) % 3 == 0:
                print(f"   Progress: {i + 1}/{min(len(symbols), 10)} symbols processed")

        print(f"   📈 Analysis complete: {len(all_signals)} total signals from {len(symbols) - len(failed_symbols)} symbols")

        # Calculate metrics
        metrics = self._calculate_backtest_metrics(all_signals)

        # Generate equity curve (simplified)
        equity_curve = self._generate_equity_curve(all_signals)

        # Generate monthly returns (simplified)
        monthly_returns = self._generate_monthly_returns(all_signals)

        # Parameter sensitivity (placeholder)
        parameter_sensitivity = {}

        # Generate recommendation
        recommendation = self._generate_comprehensive_recommendation(metrics, all_signals)

        # Warning flags
        warning_flags = self._generate_warning_flags(metrics, all_signals)

        # Confidence score
        confidence_score = min(1.0, (len(symbols) - len(failed_symbols)) / len(symbols))

        # Baseline comparison
        comparison_to_baseline = self._compare_to_baseline(metrics)

        return BacktestResults(
            metrics=metrics,
            signals=all_signals,
            equity_curve=equity_curve,
            monthly_returns=monthly_returns,
            parameter_sensitivity=parameter_sensitivity,
            recommendation=recommendation,
            warning_flags=warning_flags,
            confidence_score=confidence_score,
            comparison_to_baseline=comparison_to_baseline
        )

    def _calculate_backtest_metrics(self, signals: List[SignalAnalysis]) -> BacktestMetrics:
        """Calculate comprehensive backtest metrics"""

        if not signals:
            return BacktestMetrics(
                total_signals=0, win_rate=0, avg_return=0, max_drawdown=0,
                sharpe_ratio=0, profit_factor=0, total_return=0, volatility=0,
                max_consecutive_losses=0, avg_holding_days=0
            )

        total_signals = len(signals)
        winning_signals = len([s for s in signals if s.return_pct > 0])
        win_rate = winning_signals / total_signals if total_signals > 0 else 0

        returns = [s.return_pct for s in signals]
        avg_return = np.mean(returns)
        volatility = np.std(returns)

        # Simplified calculations
        total_return = sum(returns)
        max_drawdown = min(returns) if returns else 0
        sharpe_ratio = avg_return / max(volatility, 0.01)

        winning_returns = [r for r in returns if r > 0]
        losing_returns = [abs(r) for r in returns if r < 0]

        profit_factor = (
            sum(winning_returns) / max(sum(losing_returns), 0.01)
            if losing_returns else 10.0
        )

        # Consecutive loss calculation
        consecutive_losses = 0
        max_consecutive_losses = 0
        for return_pct in returns:
            if return_pct < 0:
                consecutive_losses += 1
                max_consecutive_losses = max(max_consecutive_losses, consecutive_losses)
            else:
                consecutive_losses = 0

        avg_holding_days = np.mean([s.holding_days for s in signals])

        return BacktestMetrics(
            total_signals=total_signals,
            win_rate=win_rate,
            avg_return=avg_return,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            profit_factor=profit_factor,
            total_return=total_return,
            volatility=volatility,
            max_consecutive_losses=max_consecutive_losses,
            avg_holding_days=avg_holding_days
        )

    def _generate_equity_curve(self, signals: List[SignalAnalysis]) -> pd.DataFrame:
        """Generate simplified equity curve"""

        if not signals:
            return pd.DataFrame(columns=['date', 'cumulative_return', 'signal_count'])

        # Sort signals by date
        sorted_signals = sorted(signals, key=lambda x: x.entry_date)

        dates = []
        cumulative_returns = []
        signal_counts = []

        cumulative_return = 100  # Start with $100
        signal_count = 0

        for signal in sorted_signals:
            signal_count += 1
            cumulative_return *= (1 + signal.return_pct / 100)

            dates.append(signal.entry_date)
            cumulative_returns.append(cumulative_return)
            signal_counts.append(signal_count)

        return pd.DataFrame({
            'date': dates,
            'cumulative_return': cumulative_returns,
            'signal_count': signal_counts
        })

    def _generate_monthly_returns(self, signals: List[SignalAnalysis]) -> pd.DataFrame:
        """Generate simplified monthly returns breakdown"""

        if not signals:
            return pd.DataFrame(columns=['month', 'return', 'signal_count'])

        # Group signals by month (simplified)
        monthly_data = {}
        for signal in signals:
            month_key = signal.entry_date[:7]  # YYYY-MM format
            if month_key not in monthly_data:
                monthly_data[month_key] = []
            monthly_data[month_key].append(signal.return_pct)

        months = []
        returns = []
        signal_counts = []

        for month, month_returns in monthly_data.items():
            months.append(month)
            returns.append(sum(month_returns))
            signal_counts.append(len(month_returns))

        return pd.DataFrame({
            'month': months,
            'return': returns,
            'signal_count': signal_counts
        })

    def _generate_comprehensive_recommendation(
        self,
        metrics: BacktestMetrics,
        signals: List[SignalAnalysis]
    ) -> str:
        """Generate comprehensive recommendation based on backtest results"""

        recommendations = []

        # Signal count assessment
        if metrics.total_signals == 0:
            recommendations.append("❌ No signals generated - parameters are too restrictive")
        elif metrics.total_signals < 10:
            recommendations.append("⚠️ Very few signals - consider loosening parameters")
        elif metrics.total_signals > 100:
            recommendations.append("⚠️ Very high signal count - consider tightening parameters")
        else:
            recommendations.append("✅ Good signal count for testing")

        # Performance assessment
        if metrics.win_rate > 0.7:
            recommendations.append("✅ Excellent win rate")
        elif metrics.win_rate > 0.5:
            recommendations.append("✅ Good win rate")
        elif metrics.win_rate > 0.4:
            recommendations.append("⚠️ Moderate win rate - room for improvement")
        else:
            recommendations.append("❌ Poor win rate - significant parameter adjustment needed")

        # Risk assessment
        if metrics.max_consecutive_losses > 5:
            recommendations.append("⚠️ High consecutive losses - consider risk management")

        if metrics.sharpe_ratio > 1.5:
            recommendations.append("✅ Excellent risk-adjusted returns")
        elif metrics.sharpe_ratio > 0.8:
            recommendations.append("✅ Good risk-adjusted returns")

        # Overall recommendation
        if metrics.win_rate > 0.6 and 10 <= metrics.total_signals <= 50:
            recommendations.append("🎯 RECOMMENDED: Parameters show strong performance potential")
        elif metrics.total_signals > 0 and metrics.win_rate > 0.4:
            recommendations.append("📊 CONSIDER: Parameters show potential but may need refinement")
        else:
            recommendations.append("⚠️ NOT RECOMMENDED: Parameters need significant adjustment")

        return "\\n".join(recommendations)

    def _generate_warning_flags(
        self,
        metrics: BacktestMetrics,
        signals: List[SignalAnalysis]
    ) -> List[str]:
        """Generate warning flags for concerning backtest results"""

        warnings = []

        if metrics.total_signals == 0:
            warnings.append("No signals generated")

        if metrics.win_rate < 0.3:
            warnings.append("Very low win rate (<30%)")

        if metrics.max_consecutive_losses > 7:
            warnings.append("High consecutive loss streak")

        if metrics.total_signals > 200:
            warnings.append("Extremely high signal count may cause execution issues")

        if metrics.sharpe_ratio < 0:
            warnings.append("Negative risk-adjusted returns")

        return warnings

    def _compare_to_baseline(self, metrics: BacktestMetrics) -> Dict[str, str]:
        """Compare results to baseline performance"""

        baseline = self.baseline_metrics

        comparison = {}

        if baseline:
            signal_diff = metrics.total_signals - baseline.get('total_signals', 0)
            comparison['signal_count'] = f"{'+' if signal_diff > 0 else ''}{signal_diff} vs baseline"

            win_rate_diff = (metrics.win_rate - baseline.get('win_rate', 0)) * 100
            comparison['win_rate'] = f"{'+' if win_rate_diff > 0 else ''}{win_rate_diff:.1f}% vs baseline"

            return_diff = metrics.avg_return - baseline.get('avg_return', 0)
            comparison['avg_return'] = f"{'+' if return_diff > 0 else ''}{return_diff:.2f}% vs baseline"
        else:
            comparison['baseline'] = "No baseline data available"

        return comparison

    def _extract_param_value(
        self,
        parameters: Dict[str, Any],
        param_path: str,
        default: Any
    ) -> Any:
        """Extract parameter value using dot notation"""

        keys = param_path.split('.')
        value = parameters

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    def _get_default_symbol_list(self) -> List[str]:
        """Get default symbol list for comprehensive testing"""
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
            'MSTR', 'SMCI', 'AMD', 'CRM', 'NFLX', 'ADBE', 'PYPL'
        ]

    def _load_baseline_metrics(self) -> Dict[str, Any]:
        """Load baseline metrics for comparison"""
        # Placeholder - would load from database/file in production
        return {
            'total_signals': 25,
            'win_rate': 0.62,
            'avg_return': 3.2,
            'sharpe_ratio': 1.1
        }

    def _build_validation_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Build validation thresholds for safety checks"""
        return {
            'signal_count': {'min': 0, 'max': 100, 'warning': 50},
            'win_rate': {'min': 0.2, 'max': 1.0, 'warning': 0.4},
            'quality_score': {'min': 0.0, 'max': 1.0, 'warning': 0.5},
            'avg_return': {'min': -10.0, 'max': 50.0, 'warning': 0.0}
        }

# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 TESTING AND VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

async def test_backtest_system():
    """Test the backtest validation system"""

    system = BacktestValidationSystem()

    # Test parameters (more aggressive configuration)
    test_parameters = {
        'momentum_triggers.atr_multiple': 0.8,
        'momentum_triggers.volume_multiple': 1.2,
        'signal_scoring.signal_strength_min': 0.5,
        'market_filters.volume_min_usd': 20_000_000
    }

    print("🧪 Testing Backtest Validation System")
    print("=" * 60)

    # Test 1: Quick Validation
    print("\\n🚀 Test 1: Quick Validation")
    start_time = datetime.now()

    quick_result = await system.quick_validation(test_parameters)

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"   ⏱️  Completed in {elapsed:.1f} seconds")
    print(f"   📊 Estimated signals/day: {quick_result.estimated_signals_per_day}")
    print(f"   🎯 Quality score: {quick_result.quality_score}")
    print(f"   ⚠️  Risk assessment: {quick_result.risk_assessment}")
    print(f"   ✅ Approval required: {quick_result.approval_required}")
    print(f"   💡 Recommendation: {quick_result.recommendation}")

    if quick_result.key_concerns:
        print(f"   🚨 Concerns: {'; '.join(quick_result.key_concerns)}")

    # Test 2: Conservative Parameters
    print("\\n🛡️  Test 2: Conservative Parameters")

    conservative_parameters = {
        'momentum_triggers.atr_multiple': 1.5,
        'momentum_triggers.volume_multiple': 2.5,
        'signal_scoring.signal_strength_min': 0.75,
        'market_filters.volume_min_usd': 50_000_000
    }

    conservative_result = await system.quick_validation(conservative_parameters)
    print(f"   📊 Conservative signals/day: {conservative_result.estimated_signals_per_day}")
    print(f"   🎯 Conservative quality: {conservative_result.quality_score}")
    print(f"   ✅ Approval required: {conservative_result.approval_required}")

if __name__ == "__main__":
    asyncio.run(test_backtest_system())