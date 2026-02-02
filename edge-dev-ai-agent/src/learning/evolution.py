"""
Pattern Evolution System

Analyzes performance data and updates pattern recommendations
based on what actually works.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
from statistics import mean
import re


@dataclass
class PatternRecommendation:
    """A recommendation for using a specific pattern."""
    pattern_name: str
    description: str
    confidence: float  # 0.0 to 1.0
    success_rate: float
    avg_return: float
    use_cases: List[str]
    last_validated: str
    sample_count: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "pattern_name": self.pattern_name,
            "description": self.description,
            "confidence": self.confidence,
            "success_rate": self.success_rate,
            "avg_return": self.avg_return,
            "use_cases": self.use_cases,
            "last_validated": self.last_validated,
            "sample_count": self.sample_count,
        }


@dataclass
class ParameterRange:
    """Recommended parameter range."""
    parameter: str
    min_value: float
    max_value: float
    recommended: float
    confidence: float
    based_on: int  # Number of samples


class PatternEvolution:
    """Evolves pattern recommendations based on performance data."""

    def __init__(self, storage_dir: Optional[str] = None):
        """Initialize pattern evolution system.

        Args:
            storage_dir: Directory for pattern storage
        """
        self.storage_dir = Path(storage_dir or "memory/patterns")
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        self.recommendations_file = self.storage_dir / "recommendations.json"
        self.parameters_file = self.storage_dir / "parameters.json"

        # Load existing recommendations
        self.recommendations = self._load_recommendations()
        self.parameter_ranges = self._load_parameters()

    def _load_recommendations(self) -> Dict[str, PatternRecommendation]:
        """Load pattern recommendations."""
        if not self.recommendations_file.exists():
            return {}

        with open(self.recommendations_file, 'r') as f:
            data = json.load(f)

        return {
            name: PatternRecommendation(**rec)
            for name, rec in data.items()
        }

    def _load_parameters(self) -> Dict[str, List[ParameterRange]]:
        """Load parameter ranges."""
        if not self.parameters_file.exists():
            return {}

        with open(self.parameters_file, 'r') as f:
            data = json.load(f)

        return {
            param: [ParameterRange(**p) for p in ranges]
            for param, ranges in data.items()
        }

    def save_recommendations(self):
        """Save current recommendations to storage."""
        # Save recommendations
        with open(self.recommendations_file, 'w') as f:
            json.dump(
                {name: r.to_dict() for name, r in self.recommendations.items()},
                f,
                indent=2
            )

        # Save parameter ranges
        with open(self.parameters_file, 'w') as f:
            json.dump(
                {
                    param: [p.__dict__ for p in ranges]
                    for param, ranges in self.parameter_ranges.items()
                },
                f,
                indent=2
            )

    def update_from_result(
        self,
        pattern_name: str,
        result: Dict[str, Any],
        context: str
    ):
        """Update pattern recommendations based on a result.

        Args:
            pattern_name: Name of the pattern/strategy
            result: Execution result
            context: Context of when this was used
        """
        metrics = result.get("metrics", {})

        # Extract key metrics
        success = metrics.get("sharpe_ratio", 0) > 1.0
        return_pct = metrics.get("total_return", 0)
        profit_factor = metrics.get("profit_factor", 0)

        # Update or create recommendation
        if pattern_name not in self.recommendations:
            self.recommendations[pattern_name] = PatternRecommendation(
                pattern_name=pattern_name,
                description=context,
                confidence=0.5,
                success_rate=0.5,
                avg_return=0.0,
                use_cases=[],
                last_validated=datetime.now().isoformat(),
                sample_count=0,
            )

        rec = self.recommendations[pattern_name]

        # Update based on result
        rec.sample_count += 1

        if success:
            rec.success_rate = (
                (rec.success_rate * (rec.sample_count - 1) + 1.0) / rec.sample_count
            )
            rec.avg_return = (
                (rec.avg_return * (rec.sample_count - 1) + return_pct) / rec.sample_count
            )
            rec.confidence = min(1.0, rec.confidence + 0.1)

            if context not in rec.use_cases:
                rec.use_cases.append(context)

        rec.last_validated = datetime.now().isoformat()

        # Save updated recommendations
        self.save_recommendations()

    def update_parameter_from_result(
        self,
        parameter: str,
        value: float,
        result: Dict[str, Any]
    ):
        """Update parameter range based on result.

        Args:
            parameter: Parameter name
            value: Parameter value used
            result: Result achieved
        """
        metrics = result.get("metrics", {})
        success = metrics.get("sharpe_ratio", 0) > 1.0

        # Initialize parameter range if needed
        if parameter not in self.parameter_ranges:
            self.parameter_ranges[parameter] = []

        ranges = self.parameter_ranges[parameter]

        # Add new data point
        if success:
            # Update range
            values = [p.min_value for p in ranges]
            values.append(value)

            new_min = min(values)
            new_max = max(values)

            # Recommended value (mean of successful values)
            successful_values = [p.recommended for p in ranges if p.confidence > 0.5]
            successful_values.append(value)

            recommended = mean(successful_values) if successful_values else value

            # Create or update range
            param_range = ParameterRange(
                parameter=parameter,
                min_value=new_min,
                max_value=new_max,
                recommended=recommended,
                confidence=min(1.0, len(successful_values) / 10),  # Confidence with more data
                based_on=len(values),
            )

            # Replace old range with updated one
            self.parameter_ranges[parameter] = [param_range]

            # Save
            self.save_recommendations()

    def get_recommendation(self, pattern_name: str) -> Optional[PatternRecommendation]:
        """Get recommendation for a pattern.

        Args:
            pattern_name: Pattern name

        Returns:
            Recommendation or None
        """
        return self.recommendations.get(pattern_name)

    def get_parameter_range(self, parameter: str) -> Optional[ParameterRange]:
        """Get recommended range for a parameter.

        Args:
            parameter: Parameter name

        Returns:
            Parameter range or None
        """
        ranges = self.parameter_ranges.get(parameter)
        return ranges[0] if ranges else None

    def suggest_parameters(
        self,
        pattern_name: str,
        context: str
    ) -> Dict[str, float]:
        """Suggest parameter values for a pattern.

        Args:
            pattern_name: Pattern to get parameters for
            context: Context of the request

        Returns:
            Dict of parameter -> recommended value
        """
        suggestions = {}

        # Get pattern recommendation
        rec = self.get_recommendation(pattern_name)
        if not rec:
            # No data - return defaults
            return {
                "lookback": 20,
                "threshold": 2.0,
                "stop_atr": 1.5,
            }

        # Use parameter ranges if available
        for param, ranges_list in self.parameter_ranges.items():
            if ranges_list:
                best_range = max(ranges_list, key=lambda p: p.confidence)
                suggestions[param] = best_range.recommended

        return suggestions

    def get_top_patterns(self, n: int = 5) -> List[PatternRecommendation]:
        """Get top performing patterns.

        Args:
            n: Number of top patterns

        Returns:
            List of top patterns
        """
        all_patterns = list(self.recommendations.values())

        # Filter by minimum sample size
        valid_patterns = [p for p in all_patterns if p.sample_count >= 3]

        # Sort by success rate, then avg return
        sorted_patterns = sorted(
            valid_patterns,
            key=lambda p: (p.success_rate, p.avg_return),
            reverse=True
        )

        return sorted_patterns[:n]

    def analyze_degrading_patterns(self) -> List[str]:
        """Identify patterns that are performing worse over time.

        Returns:
            List of pattern names that are degrading
        """
        degrading = []

        for name, rec in self.recommendations.items():
            if rec.sample_count < 3:
                continue

            # Check if recent performance is worse
            # (simplified - would need timestamp tracking)
            if rec.success_rate < 0.4:
                degrading.append(name)

        return degrading


# Singleton instance
_default_evolution: Optional[PatternEvolution] = None


def get_pattern_evolution() -> PatternEvolution:
    """Get or create pattern evolution instance."""
    global _default_evolution
    if _default_evolution is None:
        _default_evolution = PatternEvolution()
    return _default_evolution
