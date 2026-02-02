"""
Learning System

Extracts insights, logs results, and evolves patterns from
completed workflows and agent interactions.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
import re


@dataclass
class WorkflowLog:
    """A log of a completed workflow/session."""
    session_id: str
    timestamp: str
    user_request: str
    agent_used: str
    outcome: str  # 'success', 'partial', 'failed'
    code_generated: bool
    code_validated: bool
    execution_results: Optional[Dict[str, Any]] = None
    learnings: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)


@dataclass
class PatternInsight:
    """An insight about what works or doesn't work."""
    pattern_type: str  # 'scanner', 'strategy', 'parameter', etc.
    context: str  # When does this apply?
    insight: str  # What was learned?
    confidence: float  # 0.0 to 1.0
    success_rate: Optional[float] = None  # If known
    evidence: List[str] = field(default_factory=list)  # Examples
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)


class LearningExtractor:
    """Extracts learnings from agent interactions and results."""

    def __init__(self):
        """Initialize learning extractor."""
        self.patterns = {
            "successful_indicators": [],
            "failed_indicators": [],
            "parameter_ranges": {},
            "approaches": [],
        }

    def extract_from_code_generation(
        self,
        code: str,
        validation_result: Dict[str, Any],
        user_request: str
    ) -> List[str]:
        """Extract learnings from code generation.

        Args:
            code: Generated code
            validation_result: Result from code validator
            user_request: Original user request

        Returns:
            List of learning insights
        """
        learnings = []

        # What was requested vs what was generated
        request_lower = user_request.lower()

        # Extract patterns used
        if "rsi" in code.lower() and "rsi" in request_lower:
            learnings.append("RSI-based scanner pattern validated")

        if "bollinger" in code.lower() and "bollinger" in request_lower:
            learnings.append("Bollinger Bands pattern validated")

        # Check validation results
        if validation_result.get("is_valid"):
            if validation_result.get("info", {}).get("found_methods"):
                methods = validation_result["info"]["found_methods"]
                v31_methods = ["fetch_grouped_data", "compute_simple_features",
                             "apply_smart_filters", "compute_full_features", "detect_patterns"]
                has_all = all(m in methods for m in v31_methods)
                if has_all:
                    learnings.append("V31 complete structure validated")
        else:
            # What went wrong?
            for error in validation_result.get("errors", []):
                learnings.append(f"Validation error: {error['message']}")

        return learnings

    def extract_from_execution_results(
        self,
        results: Dict[str, Any],
        strategy_description: str
    ) -> List[str]:
        """Extract learnings from execution/backtest results.

        Args:
            results: Execution results with metrics
            strategy_description: Description of what was tested

        Returns:
            List of learning insights
        """
        learnings = []

        if not results:
            return learnings

        metrics = results.get("metrics", {})

        # Extract what worked
        if metrics.get("sharpe_ratio", 0) > 1.5:
            learnings.append(f"High Sharpe ratio achieved ({metrics['sharpe_ratio']:.2f})")

        if metrics.get("win_rate", 0) > 0.50:
            learnings.append(f"High win rate achieved ({metrics['win_rate']:.1%})")

        if metrics.get("max_drawdown", 1) < 0.15:
            learnings.append(f"Controlled drawdown ({metrics['max_drawdown']:.1%})")

        # Edge assessment
        profit_factor = metrics.get("profit_factor", 0)
        if profit_factor > 2.0:
            learnings.append(f"Strong edge confirmed (profit factor: {profit_factor:.1f})")
        elif profit_factor < 1.3:
            learnings.append(f"Weak edge detected (profit factor: {profit_factor:.1f})")

        return learnings

    def extract_parameter_insights(
        self,
        successful_params: Dict[str, float],
        failed_params: Dict[str, float],
        param_names: List[str]
    ) -> List[str]:
        """Extract insights about parameter ranges.

        Args:
            successful_params: Parameters that worked
            failed_params: Parameters that didn't work
            param_names: Names of parameters

        Returns:
            List of parameter insights
        """
        learnings = []

        for param in param_names:
            success_values = successful_params.get(param, [])
            failed_values = failed_params.get(param, [])

            if success_values and failed_values:
                # Find the sweet spot
                if isinstance(success_values, list):
                    avg_success = sum(success_values) / len(success_values)
                    learnings.append(f"{param}: Successful range around {avg_success:.2f}")

        return learnings

    def extract_from_conversation(
        self,
        messages: List[Dict[str, str]],
        outcome: str
    ) -> List[str]:
        """Extract learnings from conversation flow.

        Args:
            messages: Conversation messages
            outcome: Final outcome

        Returns:
            List of conversation insights
        """
        learnings = []

        # Count messages
        user_messages = [m for m in messages if m.get("role") == "user"]
        agent_messages = [m for m in messages if m.get("role") == "assistant"]

        learnings.append(f"Conversation required {len(user_messages)} user interactions")

        # What led to success?
        if outcome == "success":
            if len(user_messages) <= 3:
                learnings.append("Direct request pattern: achieved goal in few interactions")

            # Check for refinement
            for i, msg in enumerate(user_messages):
                if "refine" in msg.get("content", "").lower():
                    learnings.append("User refinement led to better results")
                    break

        return learnings


class ResultLogger:
    """Logs results and maintains performance database."""

    def __init__(self, log_dir: Optional[str] = None):
        """Initialize result logger.

        Args:
            log_dir: Directory for log files
        """
        self.log_dir = Path(log_dir or "logs")
        self.log_dir.mkdir(parents=True, exist_ok=True)

        self.workflow_log = self.log_dir / "workflows.jsonl"
        self.metrics_db = self.log_dir / "metrics.json"
        self.insights_db = self.log_dir / "insights.json"

    def log_workflow(self, workflow: WorkflowLog):
        """Log a completed workflow.

        Args:
            workflow: WorkflowLog to save
        """
        # Append to workflow log
        with open(self.workflow_log, 'a') as f:
            f.write(json.dumps(workflow.to_dict()) + '\n')

        # Update metrics database
        self._update_metrics(workflow)

        # Store insights
        for learning in workflow.learnings:
            self._add_insight(
                pattern_type=workflow.agent_used,
                insight=learning,
                context=workflow.user_request,
                evidence=[workflow.session_id]
            )

    def _update_metrics(self, workflow: WorkflowLog):
        """Update metrics database with workflow results.

        Args:
            workflow: Completed workflow
        """
        # Load existing metrics
        if self.metrics_db.exists():
            with open(self.metrics_db, 'r') as f:
                try:
                    metrics = json.load(f)
                except json.JSONDecodeError:
                    metrics = {}
        else:
            metrics = {}

        # Update agent-specific metrics
        agent = workflow.agent_used
        if agent not in metrics:
            metrics[agent] = {
                "total_workflows": 0,
                "successful": 0,
                "code_generated": 0,
                "code_validated": 0,
            }

        metrics[agent]["total_workflows"] += 1
        if workflow.outcome == "success":
            metrics[agent]["successful"] += 1
        if workflow.code_generated:
            metrics[agent]["code_generated"] += 1
        if workflow.code_validated:
            metrics[agent]["code_validated"] += 1

        # Add workflow metrics
        if workflow.metrics:
            for key, value in workflow.metrics.items():
                if key not in metrics[agent]:
                    metrics[agent][key] = []
                metrics[agent][key].append(value)

        # Save metrics
        with open(self.metrics_db, 'w') as f:
            json.dump(metrics, f, indent=2)

    def _add_insight(self, pattern_type: str, insight: str, context: str, evidence: List[str]):
        """Add an insight to the insights database.

        Args:
            pattern_type: Type of pattern
            insight: What was learned
            context: Context for the insight
            evidence: Supporting evidence
        """
        # Load existing insights
        if self.insights_db.exists():
            with open(self.insights_db, 'r') as f:
                try:
                    insights = json.load(f)
                except json.JSONDecodeError:
                    insights = []
        else:
            insights = []

        # Add new insight
        insight_obj = PatternInsight(
            pattern_type=pattern_type,
            context=context,
            insight=insight,
            confidence=0.7,  # Default confidence
            evidence=evidence
        )

        insights.append(insight_obj)

        # Save insights
        with open(self.insights_db, 'w') as f:
            json.dump([i.to_dict() for i in insights], f, indent=2)

    def get_agent_stats(self, agent_name: str) -> Dict[str, Any]:
        """Get statistics for an agent.

        Args:
            agent_name: Name of the agent

        Returns:
            Statistics dict
        """
        if not self.metrics_db.exists():
            return {}

        with open(self.metrics_db, 'r') as f:
            metrics = json.load(f)

        return metrics.get(agent_name, {})

    def get_all_insights(self, pattern_type: Optional[str] = None) -> List[PatternInsight]:
        """Get stored insights.

        Args:
            pattern_type: Filter by pattern type (optional)

        Returns:
            List of insights
        """
        if not self.insights_db.exists():
            return []

        with open(self.insights_db, 'r') as f:
            insights_data = json.load(f)

        insights = [PatternInsight(**i) for i in insights_data]

        if pattern_type:
            insights = [i for i in insights if i.pattern_type == pattern_type]

        return insights
