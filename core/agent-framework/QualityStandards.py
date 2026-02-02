"""
Agent Quality Standards and Validation Frameworks
Phase 1: Agent Standardization & Quality Improvement
"""

from typing import Dict, List, Optional, Any, Union, Callable, Type, Literal
from pydantic import BaseModel, Field, validator, Extra
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
from datetime import datetime, timedelta
import statistics
import time
import traceback
import inspect
from concurrent.futures import ThreadPoolExecutor
import psutil
import sys

logger = logging.getLogger(__name__)

class QualityLevel(str, Enum):
    """Quality level enumeration"""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    CRITICAL = "critical"

class ValidationType(str, Enum):
    """Validation type enumeration"""
    INPUT = "input"
    OUTPUT = "output"
    PERFORMANCE = "performance"
    SECURITY = "security"
    RELIABILITY = "reliability"
    CONSISTENCY = "consistency"

class QualityStandard(BaseModel):
    """Quality standard definition"""
    name: str = Field(..., description="Standard name")
    description: str = Field(..., description="Standard description")
    category: ValidationType = Field(..., description="Validation category")
    threshold_excellent: float = Field(..., ge=0, le=1, description="Excellent threshold")
    threshold_good: float = Field(..., ge=0, le=1, description="Good threshold")
    threshold_acceptable: float = Field(..., ge=0, le=1, description="Acceptable threshold")
    measurement_method: str = Field(..., description="How to measure this standard")
    weight: float = Field(default=1.0, ge=0, le=10, description="Importance weight")

    class Config:
        use_enum_values = True

class ValidationRule(BaseModel):
    """Validation rule definition"""
    name: str = Field(..., description="Rule name")
    description: str = Field(..., description="Rule description")
    validator: str = Field(..., description="Validation function name")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    error_message: str = Field(..., description="Error message if validation fails")
    is_critical: bool = Field(default=False, description="Whether failure is critical")

class QualityAssessment(BaseModel):
    """Quality assessment result"""
    agent_name: str
    assessment_id: str = Field(default_factory=lambda: f"qa_{int(time.time())}")
    timestamp: datetime = Field(default_factory=datetime.now)
    overall_score: float = Field(ge=0, le=1)
    quality_level: QualityLevel
    standard_scores: Dict[str, float] = Field(default_factory=dict)
    validation_results: Dict[str, Any] = Field(default_factory=dict)
    performance_metrics: Dict[str, float] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    critical_issues: List[str] = Field(default_factory=list)

    class Config:
        use_enum_values = True

class PerformanceMetric(BaseModel):
    """Performance metric measurement"""
    name: str
    value: float
    unit: str
    timestamp: datetime = Field(default_factory=datetime.now)
    context: Dict[str, Any] = Field(default_factory=dict)

class QualityValidator(ABC):
    """Abstract base class for quality validators"""

    @abstractmethod
    def validate(self, data: Any, standard: QualityStandard) -> float:
        """Validate data against a standard and return score (0-1)"""
        pass

class InputQualityValidator(QualityValidator):
    """Validator for input data quality"""

    def validate(self, data: Any, standard: QualityStandard) -> float:
        """Validate input data quality"""
        score = 1.0

        # Check for None
        if data is None:
            logger.warning(f"Input is None for {standard.name}")
            return 0.0

        # Check data type consistency
        expected_type = standard.parameters.get("expected_type")
        if expected_type and not isinstance(data, expected_type):
            logger.warning(f"Input type mismatch for {standard.name}: expected {expected_type}")
            score -= 0.3

        # Check data completeness
        if isinstance(data, dict):
            required_fields = standard.parameters.get("required_fields", [])
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                logger.warning(f"Missing required fields for {standard.name}: {missing_fields}")
                score -= 0.4 * len(missing_fields) / len(required_fields)

        # Check data size
        if isinstance(data, (list, str)):
            min_size = standard.parameters.get("min_size", 0)
            max_size = standard.parameters.get("max_size", float('inf'))
            actual_size = len(data)
            if actual_size < min_size:
                logger.warning(f"Input too small for {standard.name}: {actual_size} < {min_size}")
                score -= 0.3
            elif actual_size > max_size:
                logger.warning(f"Input too large for {standard.name}: {actual_size} > {max_size}")
                score -= 0.2

        return max(0.0, score)

class OutputQualityValidator(QualityValidator):
    """Validator for output data quality"""

    def validate(self, data: Any, standard: QualityStandard) -> float:
        """Validate output data quality"""
        score = 1.0

        # Check for None
        if data is None:
            logger.warning(f"Output is None for {standard.name}")
            return 0.0

        # Check result structure
        expected_structure = standard.parameters.get("expected_structure")
        if expected_structure and isinstance(data, dict):
            structure_score = self._validate_structure(data, expected_structure)
            score *= structure_score

        # Check result completeness
        if isinstance(data, dict):
            completeness_score = self._check_completeness(data, standard)
            score *= completeness_score

        # Check for data consistency
        consistency_score = self._check_consistency(data, standard)
        score *= consistency_score

        return max(0.0, score)

    def _validate_structure(self, data: Dict, expected_structure: Dict) -> float:
        """Validate data structure against expected structure"""
        score = 1.0
        total_checks = 0
        passed_checks = 0

        for key, expected_type in expected_structure.items():
            total_checks += 1
            if key in data and isinstance(data[key], expected_type):
                passed_checks += 1
            else:
                logger.warning(f"Structure validation failed: {key} should be {expected_type}")

        return passed_checks / total_checks if total_checks > 0 else 1.0

    def _check_completeness(self, data: Dict, standard: QualityStandard) -> float:
        """Check result completeness"""
        required_outputs = standard.parameters.get("required_outputs", [])
        if not required_outputs:
            return 1.0

        present_outputs = sum(1 for output in required_outputs if output in data)
        return present_outputs / len(required_outputs)

    def _check_consistency(self, data: Any, standard: QualityStandard) -> float:
        """Check internal data consistency"""
        # Basic consistency checks
        if isinstance(data, dict):
            # Check numeric consistency
            numeric_fields = standard.parameters.get("numeric_fields", [])
            for field in numeric_fields:
                if field in data and isinstance(data[field], (int, float)):
                    if data[field] < 0 and standard.parameters.get("positive_only", False):
                        logger.warning(f"Negative value in positive-only field: {field}")
                        return 0.9

        return 1.0

class PerformanceQualityValidator(QualityValidator):
    """Validator for performance quality"""

    def __init__(self):
        self.performance_history: Dict[str, List[PerformanceMetric]] = {}

    def validate(self, data: Any, standard: QualityStandard) -> float:
        """Validate performance against standards"""
        if not isinstance(data, PerformanceMetric):
            logger.warning(f"Invalid performance data for {standard.name}")
            return 0.0

        # Store metric for historical analysis
        if data.name not in self.performance_history:
            self.performance_history[data.name] = []
        self.performance_history[data.name].append(data)

        # Check against thresholds
        max_threshold = standard.parameters.get("max_threshold")
        min_threshold = standard.parameters.get("min_threshold")
        optimal_value = standard.parameters.get("optimal_value")

        score = 1.0

        if max_threshold is not None and data.value > max_threshold:
            excess = (data.value - max_threshold) / max_threshold
            score = max(0.0, 1.0 - excess)

        if min_threshold is not None and data.value < min_threshold:
            deficit = (min_threshold - data.value) / min_threshold
            score = max(0.0, 1.0 - deficit)

        if optimal_value is not None:
            deviation = abs(data.value - optimal_value) / optimal_value
            score *= max(0.0, 1.0 - deviation)

        return max(0.0, score)

class SecurityQualityValidator(QualityValidator):
    """Validator for security quality"""

    def validate(self, data: Any, standard: QualityStandard) -> float:
        """Validate security aspects"""
        score = 1.0

        # Check for sensitive data exposure
        if isinstance(data, str):
            sensitive_patterns = standard.parameters.get("sensitive_patterns", [])
            for pattern in sensitive_patterns:
                if pattern in data.lower():
                    logger.warning(f"Sensitive data detected: {pattern}")
                    score -= 0.5

        # Check input sanitization
        if isinstance(data, str):
            dangerous_patterns = ["<script>", "javascript:", "eval(", "exec("]
            for pattern in dangerous_patterns:
                if pattern in data.lower():
                    logger.warning(f"Potentially dangerous pattern detected: {pattern}")
                    score -= 0.3

        # Check data size limits (DOS protection)
        max_data_size = standard.parameters.get("max_data_size", 1024 * 1024)  # 1MB default
        if isinstance(data, str) and len(data) > max_data_size:
            logger.warning(f"Data size exceeds limit: {len(data)} > {max_data_size}")
            score -= 0.4

        return max(0.0, score)

class ReliabilityQualityValidator(QualityValidator):
    """Validator for reliability quality"""

    def __init__(self):
        self.error_history: Dict[str, List[Dict]] = {}
        self.uptime_history: Dict[str, List[datetime]] = {}

    def validate(self, data: Any, standard: QualityStandard) -> float:
        """Validate reliability metrics"""
        agent_name = standard.parameters.get("agent_name", "unknown")

        # Calculate error rate
        error_rate = self._calculate_error_rate(agent_name)
        if error_rate > 0.1:  # More than 10% error rate
            logger.warning(f"High error rate for {agent_name}: {error_rate:.2%}")
            return max(0.0, 1.0 - error_rate)

        # Calculate uptime
        uptime_percentage = self._calculate_uptime(agent_name)
        min_uptime = standard.parameters.get("min_uptime", 0.95)
        if uptime_percentage < min_uptime:
            logger.warning(f"Low uptime for {agent_name}: {uptime_percentage:.2%}")
            return uptime_percentage / min_uptime

        return 1.0

    def _calculate_error_rate(self, agent_name: str) -> float:
        """Calculate error rate for agent"""
        history = self.error_history.get(agent_name, [])
        if not history:
            return 0.0

        recent_errors = [e for e in history if (datetime.now() - e["timestamp"]).hours < 24]
        total_executions = len(recent_errors)
        error_count = sum(1 for e in recent_errors if e["error"])

        return error_count / total_executions if total_executions > 0 else 0.0

    def _calculate_uptime(self, agent_name: str) -> float:
        """Calculate uptime percentage"""
        history = self.uptime_history.get(agent_name, [])
        if not history:
            return 1.0

        # Simple uptime calculation based on recent activity
        recent_activity = [t for t in history if (datetime.now() - t).hours < 24]
        expected_checks = 24 * 60  # Assume checks every minute
        actual_checks = len(recent_activity)

        return min(1.0, actual_checks / expected_checks)

class QualityStandardsFramework:
    """Main quality standards framework"""

    def __init__(self):
        self.validators: Dict[ValidationType, QualityValidator] = {}
        self.standards: Dict[str, QualityStandard] = {}
        self.assessment_history: List[QualityAssessment] = []
        self.benchmark_data: Dict[str, List[float]] = {}

        # Initialize validators
        self._initialize_validators()
        # Initialize standards
        self._initialize_standards()

    def _initialize_validators(self):
        """Initialize quality validators"""
        self.validators[ValidationType.INPUT] = InputQualityValidator()
        self.validators[ValidationType.OUTPUT] = OutputQualityValidator()
        self.validators[ValidationType.PERFORMANCE] = PerformanceQualityValidator()
        self.validators[ValidationType.SECURITY] = SecurityQualityValidator()
        self.validators[ValidationType.RELIABILITY] = ReliabilityQualityValidator()
        logger.info("Initialized quality validators")

    def _initialize_standards(self):
        """Initialize quality standards"""
        standards = [
            QualityStandard(
                name="input_completeness",
                description="Input data completeness and structure",
                category=ValidationType.INPUT,
                threshold_excellent=0.95,
                threshold_good=0.85,
                threshold_acceptable=0.70,
                measurement_method="validate required fields and data types",
                parameters={"required_fields": [], "expected_type": dict}
            ),
            QualityStandard(
                name="output_accuracy",
                description="Output data accuracy and completeness",
                category=ValidationType.OUTPUT,
                threshold_excellent=0.95,
                threshold_good=0.85,
                threshold_acceptable=0.75,
                measurement_method="validate output structure and completeness",
                parameters={"required_outputs": [], "expected_structure": {}}
            ),
            QualityStandard(
                name="execution_speed",
                description="Execution speed and performance",
                category=ValidationType.PERFORMANCE,
                threshold_excellent=0.90,
                threshold_good=0.75,
                threshold_acceptable=0.60,
                measurement_method="measure execution time against benchmarks",
                parameters={"max_threshold": 30.0, "optimal_value": 10.0}
            ),
            QualityStandard(
                name="resource_efficiency",
                description="Resource usage efficiency",
                category=ValidationType.PERFORMANCE,
                threshold_excellent=0.85,
                threshold_good=0.70,
                threshold_acceptable=0.55,
                measurement_method="monitor CPU and memory usage",
                parameters={"max_memory_mb": 512, "max_cpu_percent": 80.0}
            ),
            QualityStandard(
                name="security_compliance",
                description="Security and data protection compliance",
                category=ValidationType.SECURITY,
                threshold_excellent=0.95,
                threshold_good=0.85,
                threshold_acceptable=0.70,
                measurement_method="check for security vulnerabilities",
                parameters={"sensitive_patterns": ["password", "token", "key"], "max_data_size": 1048576}
            ),
            QualityStandard(
                name="reliability",
                description="System reliability and error handling",
                category=ValidationType.RELIABILITY,
                threshold_excellent=0.95,
                threshold_good=0.85,
                threshold_acceptable=0.70,
                measurement_method="track error rates and uptime",
                parameters={"min_uptime": 0.95}
            )
        ]

        for standard in standards:
            self.standards[standard.name] = standard

        logger.info(f"Initialized {len(standards)} quality standards")

    def register_standard(self, standard: QualityStandard):
        """Register a custom quality standard"""
        self.standards[standard.name] = standard
        logger.info(f"Registered quality standard: {standard.name}")

    def register_validator(self, validation_type: ValidationType, validator: QualityValidator):
        """Register a custom quality validator"""
        self.validators[validation_type] = validator
        logger.info(f"Registered quality validator: {validation_type}")

    async def assess_agent_quality(
        self,
        agent_name: str,
        input_data: Any,
        output_data: Any,
        execution_time: float,
        context: Dict[str, Any] = None
    ) -> QualityAssessment:
        """Assess agent quality across all standards"""
        standard_scores = {}
        validation_results = {}
        performance_metrics = {}

        # Assess each standard
        for standard_name, standard in self.standards.items():
            validator = self.validators.get(standard.category)
            if not validator:
                logger.warning(f"No validator for category: {standard.category}")
                continue

            try:
                if standard.category == ValidationType.INPUT:
                    score = validator.validate(input_data, standard)
                    validation_results[f"{standard_name}_input"] = score

                elif standard.category == ValidationType.OUTPUT:
                    score = validator.validate(output_data, standard)
                    validation_results[f"{standard_name}_output"] = score

                elif standard.category == ValidationType.PERFORMANCE:
                    if standard_name == "execution_speed":
                        metric = PerformanceMetric(
                            name="execution_time",
                            value=execution_time,
                            unit="seconds"
                        )
                    elif standard_name == "resource_efficiency":
                        # Get current resource usage
                        process = psutil.Process()
                        memory_mb = process.memory_info().rss / 1024 / 1024
                        cpu_percent = process.cpu_percent()

                        metric = PerformanceMetric(
                            name="resource_usage",
                            value=max(memory_mb / 512, cpu_percent / 80),  # Normalized
                            unit="normalized"
                        )
                    else:
                        continue

                    score = validator.validate(metric, standard)
                    validation_results[standard_name] = score
                    performance_metrics[standard_name] = metric.value

                elif standard.category in [ValidationType.SECURITY, ValidationType.RELIABILITY]:
                    # For these, validate both input and output
                    input_score = validator.validate(input_data, standard)
                    output_score = validator.validate(output_data, standard)
                    score = (input_score + output_score) / 2
                    validation_results[standard_name] = score

                standard_scores[standard_name] = score

            except Exception as e:
                logger.error(f"Error validating {standard_name}: {e}")
                standard_scores[standard_name] = 0.0
                validation_results[f"{standard_name}_error"] = str(e)

        # Calculate overall weighted score
        overall_score = self._calculate_weighted_score(standard_scores)

        # Determine quality level
        quality_level = self._determine_quality_level(overall_score)

        # Generate recommendations
        recommendations = self._generate_recommendations(standard_scores)

        # Identify critical issues
        critical_issues = [
            name for name, score in standard_scores.items()
            if score < self.standards[name].threshold_acceptable
        ]

        # Create assessment
        assessment = QualityAssessment(
            agent_name=agent_name,
            overall_score=overall_score,
            quality_level=quality_level,
            standard_scores=standard_scores,
            validation_results=validation_results,
            performance_metrics=performance_metrics,
            recommendations=recommendations,
            critical_issues=critical_issues
        )

        # Store assessment
        self.assessment_history.append(assessment)

        # Update benchmark data
        for standard_name, score in standard_scores.items():
            if standard_name not in self.benchmark_data:
                self.benchmark_data[standard_name] = []
            self.benchmark_data[standard_name].append(score)
            # Keep only last 100 assessments
            if len(self.benchmark_data[standard_name]) > 100:
                self.benchmark_data[standard_name] = self.benchmark_data[standard_name][-100:]

        return assessment

    def _calculate_weighted_score(self, standard_scores: Dict[str, float]) -> float:
        """Calculate weighted overall score"""
        total_weight = 0.0
        weighted_sum = 0.0

        for standard_name, score in standard_scores.items():
            standard = self.standards.get(standard_name)
            if standard:
                weighted_sum += score * standard.weight
                total_weight += standard.weight

        return weighted_sum / total_weight if total_weight > 0 else 0.0

    def _determine_quality_level(self, score: float) -> QualityLevel:
        """Determine quality level from score"""
        if score >= 0.9:
            return QualityLevel.EXCELLENT
        elif score >= 0.75:
            return QualityLevel.GOOD
        elif score >= 0.6:
            return QualityLevel.ACCEPTABLE
        elif score >= 0.4:
            return QualityLevel.POOR
        else:
            return QualityLevel.CRITICAL

    def _generate_recommendations(self, standard_scores: Dict[str, float]) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []

        for standard_name, score in standard_scores.items():
            standard = self.standards.get(standard_name)
            if not standard:
                continue

            if score < standard.threshold_acceptable:
                if standard_name == "input_completeness":
                    recommendations.append("Improve input validation and required field checking")
                elif standard_name == "output_accuracy":
                    recommendations.append("Enhance output validation and result completeness")
                elif standard_name == "execution_speed":
                    recommendations.append("Optimize algorithms and reduce execution time")
                elif standard_name == "resource_efficiency":
                    recommendations.append("Optimize memory usage and CPU consumption")
                elif standard_name == "security_compliance":
                    recommendations.append("Review and strengthen security measures")
                elif standard_name == "reliability":
                    recommendations.append("Improve error handling and system reliability")

        if not recommendations:
            recommendations.append("Agent meets all quality standards")

        return recommendations

    def get_quality_report(self, agent_name: str = None, days: int = 7) -> Dict[str, Any]:
        """Generate quality report"""
        cutoff_date = datetime.now() - timedelta(days=days)

        assessments = [
            a for a in self.assessment_history
            if (agent_name is None or a.agent_name == agent_name) and
               a.timestamp >= cutoff_date
        ]

        if not assessments:
            return {"message": "No assessments found in specified period"}

        # Calculate statistics
        scores = [a.overall_score for a in assessments]
        avg_score = statistics.mean(scores)
        min_score = min(scores)
        max_score = max(scores)

        # Quality level distribution
        level_counts = {}
        for level in QualityLevel:
            level_counts[level.value] = sum(1 for a in assessments if a.quality_level == level)

        # Standard-specific analysis
        standard_analysis = {}
        for standard_name in self.standards.keys():
            standard_scores = [a.standard_scores.get(standard_name, 0) for a in assessments]
            if standard_scores:
                standard_analysis[standard_name] = {
                    "average": statistics.mean(standard_scores),
                    "min": min(standard_scores),
                    "max": max(standard_scores),
                    "trend": "improving" if len(standard_scores) > 1 and standard_scores[-1] > standard_scores[0] else "stable"
                }

        # Common issues
        all_issues = []
        for assessment in assessments:
            all_issues.extend(assessment.critical_issues)

        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

        # Top recommendations
        recommendations = {}
        for assessment in assessments:
            for rec in assessment.recommendations:
                recommendations[rec] = recommendations.get(rec, 0) + 1

        top_recommendations = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "period": f"Last {days} days",
            "agent_filter": agent_name or "All agents",
            "total_assessments": len(assessments),
            "score_statistics": {
                "average": avg_score,
                "minimum": min_score,
                "maximum": max_score
            },
            "quality_distribution": level_counts,
            "standard_analysis": standard_analysis,
            "common_issues": sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "top_recommendations": top_recommendations,
            "benchmark_comparison": self._get_benchmark_comparison()
        }

    def _get_benchmark_comparison(self) -> Dict[str, Any]:
        """Compare current performance against benchmarks"""
        comparison = {}

        for standard_name, scores in self.benchmark_data.items():
            if len(scores) < 5:  # Need sufficient data
                continue

            recent_scores = scores[-10:]  # Last 10 assessments
            avg_recent = statistics.mean(recent_scores)
            avg_all = statistics.mean(scores)

            standard = self.standards.get(standard_name)
            if standard:
                comparison[standard_name] = {
                    "recent_average": avg_recent,
                    "overall_average": avg_all,
                    "target_excellent": standard.threshold_excellent,
                    "target_good": standard.threshold_good,
                    "meets_excellent": avg_recent >= standard.threshold_excellent,
                    "meets_good": avg_recent >= standard.threshold_good,
                    "trend": "improving" if avg_recent > avg_all else "declining"
                }

        return comparison

# Global quality framework instance
quality_framework = QualityStandardsFramework()