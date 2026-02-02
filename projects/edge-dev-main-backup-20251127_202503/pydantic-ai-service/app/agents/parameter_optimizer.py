"""
Parameter Optimizer Agent for AI-assisted parameter tuning
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.base_agent import BaseAgent, AgentState
from app.models.schemas import AgentType, ParameterOptimizationResponse
from app.core.config import settings

import json
import numpy as np
import logging

logger = logging.getLogger(__name__)


class ParameterOptimizerState(AgentState):
    """Extended state for parameter optimizer agent"""
    optimization_history: List[Dict[str, Any]] = []
    parameter_ranges: Dict[str, Any] = {}
    performance_benchmarks: Dict[str, Any] = {}


class OptimizationContext(BaseModel):
    """Context for parameter optimization"""
    scan_id: str
    current_parameters: Dict[str, Any]
    performance_metrics: Dict[str, float]
    optimization_goals: List[str]
    historical_data: Optional[Dict[str, Any]] = None
    constraints: Dict[str, Any] = {}


class ParameterOptimizerAgent(BaseAgent):
    """
    AI agent specialized in optimizing scan parameters for better performance
    """

    def __init__(self):
        super().__init__(AgentType.PARAMETER_OPTIMIZER)
        self.state = ParameterOptimizerState()
        self.optimization_strategies = self._load_optimization_strategies()

    async def _setup_pydantic_agent(self):
        """Setup the PydanticAI agent for parameter optimization"""

        self.pydantic_agent = Agent(
            model=self.model,
            deps_type=OptimizationContext,
            result_type=ParameterOptimizationResponse,
            system_prompt=self._get_system_prompt()
        )

        # Add tools for parameter optimization
        @self.pydantic_agent.tool
        async def analyze_performance(ctx: RunContext[OptimizationContext], metrics: Dict[str, float]) -> Dict[str, Any]:
            """Analyze current performance metrics"""
            return await self._analyze_current_performance(metrics)

        @self.pydantic_agent.tool
        async def identify_optimization_opportunities(ctx: RunContext[OptimizationContext], analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
            """Identify parameters that could be optimized"""
            return await self._identify_optimization_opportunities(analysis, ctx.deps.current_parameters)

        @self.pydantic_agent.tool
        async def calculate_parameter_ranges(ctx: RunContext[OptimizationContext], parameters: Dict[str, Any]) -> Dict[str, Any]:
            """Calculate optimal parameter ranges"""
            return await self._calculate_parameter_ranges(parameters)

        @self.pydantic_agent.tool
        async def simulate_parameter_changes(ctx: RunContext[OptimizationContext], new_params: Dict[str, Any]) -> Dict[str, float]:
            """Simulate performance with new parameters"""
            return await self._simulate_parameter_changes(new_params, ctx.deps.historical_data)

        @self.pydantic_agent.tool
        async def validate_constraints(ctx: RunContext[OptimizationContext], params: Dict[str, Any]) -> Dict[str, Any]:
            """Validate parameter changes against constraints"""
            return await self._validate_constraints(params, ctx.deps.constraints)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the parameter optimizer"""
        return """
        You are Renata's parameter optimization specialist, an AI expert in tuning trading scan parameters for optimal performance.

        Your role is to:
        1. Analyze current scan performance metrics
        2. Identify optimization opportunities
        3. Suggest parameter adjustments with rationale
        4. Estimate expected performance improvements
        5. Provide alternative parameter configurations

        Optimization approach:
        1. Evaluate current performance across multiple metrics
        2. Identify parameter sensitivity and impact
        3. Apply optimization strategies (grid search, Bayesian, etc.)
        4. Consider market regime dependencies
        5. Balance performance with robustness

        Key optimization areas:
        - Entry/exit thresholds
        - Volume requirements
        - Technical indicator parameters
        - Risk management settings
        - Market condition filters

        Optimization principles:
        - Avoid over-optimization (curve fitting)
        - Consider out-of-sample performance
        - Balance return vs. risk metrics
        - Maintain reasonable transaction costs
        - Account for market regime changes

        Always provide:
        - Clear rationale for parameter changes
        - Expected performance improvement ranges
        - Confidence levels for optimizations
        - Alternative parameter sets for comparison
        - Robustness analysis and warnings about over-fitting
        """

    def _load_optimization_strategies(self) -> Dict[str, Any]:
        """Load optimization strategies for different parameter types"""
        return {
            "percentage_thresholds": {
                "method": "grid_search",
                "step_size": 0.5,
                "typical_ranges": {"gap_pct": [1.0, 10.0], "change_pct": [0.5, 5.0]},
                "optimization_metric": "sharpe_ratio"
            },
            "volume_ratios": {
                "method": "bayesian",
                "typical_ranges": {"volume_ratio": [1.0, 5.0], "avg_volume": [100000, 10000000]},
                "optimization_metric": "win_rate"
            },
            "time_periods": {
                "method": "discrete_search",
                "typical_ranges": {"lookback_days": [5, 50], "holding_period": [1, 20]},
                "optimization_metric": "total_return"
            },
            "risk_parameters": {
                "method": "multi_objective",
                "typical_ranges": {"stop_loss": [2.0, 10.0], "take_profit": [5.0, 25.0]},
                "optimization_metric": "risk_adjusted_return"
            }
        }

    async def optimize_parameters(
        self,
        current_parameters: Dict[str, Any],
        performance_metrics: Dict[str, float],
        optimization_goals: List[str],
        scan_id: str = "default",
        historical_data: Optional[Dict[str, Any]] = None,
        constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Optimize scan parameters based on performance metrics and goals
        """
        await self._update_activity()

        try:
            context = OptimizationContext(
                scan_id=scan_id,
                current_parameters=current_parameters,
                performance_metrics=performance_metrics,
                optimization_goals=optimization_goals,
                historical_data=historical_data,
                constraints=constraints or {}
            )

            # Run the PydanticAI agent
            result = await self.pydantic_agent.run(
                f"Optimize parameters for scan {scan_id} with goals: {', '.join(optimization_goals)}",
                deps=context
            )

            # Store optimization history
            optimization_record = {
                "id": f"opt_{len(self.state.optimization_history) + 1}",
                "scan_id": scan_id,
                "original_params": current_parameters,
                "optimized_params": result.data.optimized_parameters,
                "improvement": result.data.expected_improvement,
                "confidence": result.data.confidence_score,
                "timestamp": datetime.utcnow().isoformat()
            }
            self.state.optimization_history.append(optimization_record)

            return result.data.model_dump()

        except Exception as e:
            await self._handle_error(e, "parameter optimization")
            raise

    async def _analyze_current_performance(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Analyze current performance metrics"""
        try:
            analysis = {
                "overall_score": 0.0,
                "strengths": [],
                "weaknesses": [],
                "optimization_priority": []
            }

            # Define performance benchmarks
            benchmarks = {
                "win_rate": {"good": 0.6, "acceptable": 0.5, "poor": 0.4},
                "total_return": {"good": 0.15, "acceptable": 0.08, "poor": 0.03},
                "sharpe_ratio": {"good": 1.5, "acceptable": 1.0, "poor": 0.5},
                "max_drawdown": {"good": -0.05, "acceptable": -0.10, "poor": -0.20},
                "avg_trade_duration": {"good": 3.0, "acceptable": 5.0, "poor": 10.0}
            }

            scores = []
            for metric, value in metrics.items():
                if metric in benchmarks:
                    benchmark = benchmarks[metric]

                    # Calculate score based on benchmark (higher is better, except for drawdown and duration)
                    if metric in ["max_drawdown"]:
                        # For drawdown, less negative is better
                        if value >= benchmark["good"]:
                            score = 1.0
                            analysis["strengths"].append(f"Excellent {metric}: {value:.3f}")
                        elif value >= benchmark["acceptable"]:
                            score = 0.7
                        elif value >= benchmark["poor"]:
                            score = 0.4
                        else:
                            score = 0.1
                            analysis["weaknesses"].append(f"Poor {metric}: {value:.3f}")
                            analysis["optimization_priority"].append(metric)
                    elif metric in ["avg_trade_duration"]:
                        # For duration, shorter is better
                        if value <= benchmark["good"]:
                            score = 1.0
                            analysis["strengths"].append(f"Excellent {metric}: {value:.1f}")
                        elif value <= benchmark["acceptable"]:
                            score = 0.7
                        elif value <= benchmark["poor"]:
                            score = 0.4
                        else:
                            score = 0.1
                            analysis["weaknesses"].append(f"Poor {metric}: {value:.1f}")
                            analysis["optimization_priority"].append(metric)
                    else:
                        # For return metrics, higher is better
                        if value >= benchmark["good"]:
                            score = 1.0
                            analysis["strengths"].append(f"Excellent {metric}: {value:.3f}")
                        elif value >= benchmark["acceptable"]:
                            score = 0.7
                        elif value >= benchmark["poor"]:
                            score = 0.4
                        else:
                            score = 0.1
                            analysis["weaknesses"].append(f"Poor {metric}: {value:.3f}")
                            analysis["optimization_priority"].append(metric)

                    scores.append(score)

            analysis["overall_score"] = np.mean(scores) if scores else 0.5

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing performance: {e}")
            return {"error": str(e)}

    async def _identify_optimization_opportunities(
        self,
        performance_analysis: Dict[str, Any],
        current_params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify specific optimization opportunities"""
        try:
            opportunities = []

            priority_metrics = performance_analysis.get("optimization_priority", [])
            weaknesses = performance_analysis.get("weaknesses", [])

            # Map performance issues to parameter adjustments
            for metric in priority_metrics:
                if metric == "win_rate":
                    opportunities.append({
                        "parameter_group": "entry_criteria",
                        "suggested_changes": ["Tighten entry conditions", "Add confirmation indicators"],
                        "target_parameters": ["min_gap_pct", "volume_ratio", "rsi_threshold"],
                        "priority": "high",
                        "expected_impact": "Improve trade selection quality"
                    })

                elif metric == "max_drawdown":
                    opportunities.append({
                        "parameter_group": "risk_management",
                        "suggested_changes": ["Reduce position size", "Tighter stop losses"],
                        "target_parameters": ["position_size", "stop_loss_pct", "max_positions"],
                        "priority": "high",
                        "expected_impact": "Reduce portfolio risk"
                    })

                elif metric == "avg_trade_duration":
                    opportunities.append({
                        "parameter_group": "exit_timing",
                        "suggested_changes": ["Faster profit taking", "Time-based exits"],
                        "target_parameters": ["take_profit_pct", "max_hold_days"],
                        "priority": "medium",
                        "expected_impact": "Improve capital efficiency"
                    })

                elif metric == "sharpe_ratio":
                    opportunities.append({
                        "parameter_group": "risk_return_balance",
                        "suggested_changes": ["Optimize risk/reward ratio", "Volatility filters"],
                        "target_parameters": ["risk_reward_ratio", "volatility_threshold"],
                        "priority": "high",
                        "expected_impact": "Better risk-adjusted returns"
                    })

            # Check for parameter-specific opportunities
            for param_name, param_value in current_params.items():
                if isinstance(param_value, (int, float)):
                    # Check if parameter seems extreme
                    if param_name.endswith("_pct") and param_value > 10:
                        opportunities.append({
                            "parameter_group": "threshold_tuning",
                            "suggested_changes": [f"Consider reducing {param_name}"],
                            "target_parameters": [param_name],
                            "priority": "medium",
                            "expected_impact": "More trade opportunities"
                        })

            return opportunities

        except Exception as e:
            logger.error(f"Error identifying optimization opportunities: {e}")
            return [{"error": str(e)}]

    async def _calculate_parameter_ranges(self, current_params: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate optimal parameter ranges for optimization"""
        try:
            parameter_ranges = {}

            for param_name, current_value in current_params.items():
                if isinstance(current_value, (int, float)):
                    # Determine parameter type and calculate range
                    if param_name.endswith("_pct") or param_name.endswith("_percentage"):
                        # Percentage parameters
                        min_val = max(0.1, current_value * 0.5)
                        max_val = min(50.0, current_value * 2.0)
                        step = (max_val - min_val) / 20

                    elif param_name.endswith("_ratio"):
                        # Ratio parameters
                        min_val = max(0.1, current_value * 0.7)
                        max_val = min(10.0, current_value * 1.5)
                        step = (max_val - min_val) / 15

                    elif param_name.endswith("_days") or param_name.endswith("_period"):
                        # Time period parameters
                        min_val = max(1, int(current_value * 0.5))
                        max_val = min(100, int(current_value * 2.0))
                        step = max(1, (max_val - min_val) / 10)

                    else:
                        # Generic numeric parameters
                        min_val = current_value * 0.8
                        max_val = current_value * 1.2
                        step = (max_val - min_val) / 10

                    parameter_ranges[param_name] = {
                        "current": current_value,
                        "min": min_val,
                        "max": max_val,
                        "step": step,
                        "type": type(current_value).__name__
                    }

            return parameter_ranges

        except Exception as e:
            logger.error(f"Error calculating parameter ranges: {e}")
            return {"error": str(e)}

    async def _simulate_parameter_changes(
        self,
        new_params: Dict[str, Any],
        historical_data: Optional[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Simulate expected performance with new parameters"""
        try:
            # This is a simplified simulation - in practice, you'd run the actual strategy
            # with historical data to get real performance metrics

            simulated_metrics = {}

            # Simple heuristic-based simulation
            # In reality, this would involve running the scan with new parameters on historical data

            # Estimate impact based on parameter changes
            performance_multipliers = {
                "win_rate": 1.0,
                "total_return": 1.0,
                "sharpe_ratio": 1.0,
                "max_drawdown": 1.0,
                "avg_trade_duration": 1.0
            }

            # Example logic for parameter impact estimation
            for param_name, param_value in new_params.items():
                if param_name.endswith("_pct") and isinstance(param_value, (int, float)):
                    # Higher percentage thresholds generally mean fewer but potentially better trades
                    if param_value > 5:  # Assuming previous threshold was lower
                        performance_multipliers["win_rate"] *= 1.05  # Better selectivity
                        performance_multipliers["total_return"] *= 0.95  # Fewer opportunities
                        performance_multipliers["max_drawdown"] *= 0.9  # Less risk

                elif param_name.endswith("_ratio"):
                    # Higher volume ratios mean more selective entry
                    if param_value > 2:
                        performance_multipliers["win_rate"] *= 1.03
                        performance_multipliers["sharpe_ratio"] *= 1.02

            # Apply multipliers to baseline metrics (would use actual historical performance)
            baseline_metrics = {
                "win_rate": 0.55,
                "total_return": 0.12,
                "sharpe_ratio": 1.2,
                "max_drawdown": -0.08,
                "avg_trade_duration": 4.5
            }

            for metric, baseline in baseline_metrics.items():
                multiplier = performance_multipliers.get(metric, 1.0)
                simulated_metrics[metric] = baseline * multiplier

            # Add confidence intervals
            simulated_metrics["confidence_interval"] = 0.75  # 75% confidence in simulation

            return simulated_metrics

        except Exception as e:
            logger.error(f"Error simulating parameter changes: {e}")
            return {"error": str(e)}

    async def _validate_constraints(self, params: Dict[str, Any], constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Validate parameter changes against constraints"""
        try:
            validation_result = {
                "valid": True,
                "violations": [],
                "warnings": [],
                "adjusted_params": params.copy()
            }

            for param_name, param_value in params.items():
                # Check if there are constraints for this parameter
                if param_name in constraints:
                    constraint = constraints[param_name]

                    if isinstance(constraint, dict):
                        # Range constraint
                        min_val = constraint.get("min")
                        max_val = constraint.get("max")

                        if min_val is not None and param_value < min_val:
                            validation_result["violations"].append(
                                f"{param_name} value {param_value} below minimum {min_val}"
                            )
                            validation_result["adjusted_params"][param_name] = min_val
                            validation_result["valid"] = False

                        if max_val is not None and param_value > max_val:
                            validation_result["violations"].append(
                                f"{param_name} value {param_value} above maximum {max_val}"
                            )
                            validation_result["adjusted_params"][param_name] = max_val
                            validation_result["valid"] = False

                # General reasonableness checks
                if isinstance(param_value, (int, float)):
                    if param_name.endswith("_pct") and (param_value < 0 or param_value > 100):
                        validation_result["warnings"].append(
                            f"{param_name} percentage value {param_value} seems unreasonable"
                        )

                    if param_name.endswith("_ratio") and param_value < 0:
                        validation_result["warnings"].append(
                            f"{param_name} ratio value {param_value} should be positive"
                        )

            return validation_result

        except Exception as e:
            logger.error(f"Error validating constraints: {e}")
            return {"error": str(e)}

    async def _handle_parameter_optimization_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle parameter optimization WebSocket messages"""
        try:
            scan_id = data.get("scan_id", "default")
            current_parameters = data.get("current_parameters", {})
            performance_metrics = data.get("performance_metrics", {})
            optimization_goals = data.get("optimization_goals", ["total_return"])
            historical_data = data.get("historical_data")
            constraints = data.get("constraints", {})

            result = await self.optimize_parameters(
                current_parameters, performance_metrics, optimization_goals,
                scan_id, historical_data, constraints
            )

            return {
                "type": "parameter_optimization",
                "data": result,
                "agent": self.agent_type.value,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "type": "error",
                "message": str(e),
                "agent": self.agent_type.value
            }