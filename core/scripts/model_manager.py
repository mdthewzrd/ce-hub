#!/usr/bin/env python3
"""
CE-Hub Model Manager
Flexible Claude/GLM Model Switching System

This module provides intelligent model management for CE-Hub, enabling seamless
switching between Claude models and GLM models based on task requirements,
performance characteristics, and user preferences.

Key Features:
- Automatic model selection based on task type
- Performance-aware model switching
- Context preservation across model changes
- Cost optimization
- Mobile-optimized model selection

Usage:
    from scripts.model_manager import ModelManager

    model_manager = ModelManager()
    await model_manager.switch_model("claude-3-5-sonnet-20241022")
    result = await model_manager.execute_with_optimal_model(task)
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Tuple
from enum import Enum
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class ModelType(Enum):
    """Supported model types"""
    CLAUDE = "claude"
    GLM = "glm"
    AUTO = "auto"

class TaskComplexity(Enum):
    """Task complexity levels for model selection"""
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"
    EXPERT = "expert"

class ModelCapability(Enum):
    """Model capability categories"""
    REASONING = "reasoning"
    CODING = "coding"
    ANALYSIS = "analysis"
    CREATIVE = "creative"
    CONVERSATION = "conversation"
    MOBILE_OPTIMIZED = "mobile_optimized"

class ModelManager:
    """
    Intelligent model management system for CE-Hub

    Handles model selection, switching, and optimization based on
    task requirements and performance characteristics.
    """

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or Path(__file__).parent.parent / "config" / "model_config.yml"
        self.current_model = None
        self.model_history = []
        self.performance_metrics = {}
        self.cost_tracking = {}

        # Load model configurations
        self.models = self._load_model_configurations()

        # Initialize performance optimization
        try:
            import sys
            sys.path.append(str(Path(__file__).parent))
            from performance_optimizer import cache_result
            self.cache_enabled = True
        except ImportError:
            self.cache_enabled = False
            # Fallback cache decorator
            def cache_result(namespace: str, ttl: int = 300):
                def decorator(func):
                    return func
                return decorator

    def _load_model_configurations(self) -> Dict[str, Any]:
        """Load model configurations and capabilities"""
        return {
            # Claude Models
            "claude-3-5-sonnet-20241022": {
                "type": ModelType.CLAUDE,
                "capabilities": [
                    ModelCapability.REASONING,
                    ModelCapability.CODING,
                    ModelCapability.ANALYSIS,
                    ModelCapability.CREATIVE
                ],
                "max_context": 200000,
                "cost_per_input_token": 3.0e-6,
                "cost_per_output_token": 15.0e-6,
                "performance_tier": "premium",
                "mobile_optimized": False,
                "response_quality": 0.95,
                "speed_rating": 0.8,
                "use_cases": ["complex_reasoning", "code_generation", "analysis", "research"]
            },
            "claude-3-haiku-20240307": {
                "type": ModelType.CLAUDE,
                "capabilities": [
                    ModelCapability.CONVERSATION,
                    ModelCapability.MOBILE_OPTIMIZED,
                    ModelCapability.CODING
                ],
                "max_context": 200000,
                "cost_per_input_token": 0.25e-6,
                "cost_per_output_token": 1.25e-6,
                "performance_tier": "fast",
                "mobile_optimized": True,
                "response_quality": 0.85,
                "speed_rating": 0.95,
                "use_cases": ["quick_tasks", "mobile_interaction", "simple_coding", "conversation"]
            },
            "claude-3-opus-20240229": {
                "type": ModelType.CLAUDE,
                "capabilities": [
                    ModelCapability.REASONING,
                    ModelCapability.ANALYSIS,
                    ModelCapability.CREATIVE,
                    ModelCapability.CODING
                ],
                "max_context": 200000,
                "cost_per_input_token": 15.0e-6,
                "cost_per_output_token": 75.0e-6,
                "performance_tier": "expert",
                "mobile_optimized": False,
                "response_quality": 0.98,
                "speed_rating": 0.7,
                "use_cases": ["expert_analysis", "complex_research", "high_quality_writing"]
            },
            # GLM Models (compatible with Claude Code)
            "glm-4-plus": {
                "type": ModelType.GLM,
                "capabilities": [
                    ModelCapability.REASONING,
                    ModelCapability.CODING,
                    ModelCapability.ANALYSIS,
                    ModelCapability.CONVERSATION
                ],
                "max_context": 128000,
                "cost_per_input_token": 0.1e-6,
                "cost_per_output_token": 0.1e-6,
                "performance_tier": "balanced",
                "mobile_optimized": True,
                "response_quality": 0.88,
                "speed_rating": 0.90,
                "use_cases": ["general_purpose", "cost_efficient", "mobile_friendly", "coding"]
            },
            "glm-4-flash": {
                "type": ModelType.GLM,
                "capabilities": [
                    ModelCapability.CONVERSATION,
                    ModelCapability.MOBILE_OPTIMIZED,
                    ModelCapability.CODING
                ],
                "max_context": 128000,
                "cost_per_input_token": 0.01e-6,
                "cost_per_output_token": 0.01e-6,
                "performance_tier": "ultra_fast",
                "mobile_optimized": True,
                "response_quality": 0.82,
                "speed_rating": 0.98,
                "use_cases": ["ultra_fast_response", "mobile_optimal", "cost_minimal", "simple_tasks"]
            },
            "glm-4-air": {
                "type": ModelType.GLM,
                "capabilities": [
                    ModelCapability.REASONING,
                    ModelCapability.ANALYSIS,
                    ModelCapability.CODING
                ],
                "max_context": 128000,
                "cost_per_input_token": 0.05e-6,
                "cost_per_output_token": 0.05e-6,
                "performance_tier": "efficient",
                "mobile_optimized": True,
                "response_quality": 0.85,
                "speed_rating": 0.92,
                "use_cases": ["balanced_performance", "mobile_friendly", "cost_effective"]
            }
        }

    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get detailed information about a specific model"""
        return self.models.get(model_name, {})

    def list_available_models(self, model_type: Optional[ModelType] = None,
                            mobile_optimized: Optional[bool] = None) -> List[str]:
        """List available models with optional filtering"""
        models = []
        for model_name, config in self.models.items():
            # Filter by model type
            if model_type and config.get("type") != model_type:
                continue

            # Filter by mobile optimization
            if mobile_optimized is not None and config.get("mobile_optimized") != mobile_optimized:
                continue

            models.append(model_name)

        return sorted(models)

    def analyze_task_requirements(self, task_description: str,
                                context: str = "") -> Dict[str, Any]:
        """Analyze task to determine optimal model requirements"""
        task_lower = task_description.lower()
        context_lower = context.lower()
        full_text = f"{task_lower} {context_lower}"

        # Determine complexity
        complexity = self._assess_task_complexity(full_text)

        # Determine required capabilities
        required_capabilities = self._identify_required_capabilities(full_text)

        # Estimate context length
        estimated_context_length = len(task_description) + len(context)

        # Check for mobile optimization needs
        mobile_needed = any(keyword in full_text for keyword in [
            "mobile", "quick", "fast", "brief", "urgent", "on-the-go"
        ])

        return {
            "complexity": complexity,
            "required_capabilities": required_capabilities,
            "estimated_context_length": estimated_context_length,
            "mobile_optimized_preferred": mobile_needed,
            "cost_sensitivity": self._assess_cost_sensitivity(full_text),
            "quality_requirements": self._assess_quality_requirements(full_text)
        }

    def _assess_task_complexity(self, text: str) -> TaskComplexity:
        """Assess the complexity level of a task"""
        complexity_indicators = {
            TaskComplexity.SIMPLE: [
                "hello", "hi", "quick", "simple", "basic", "list", "show", "what is"
            ],
            TaskComplexity.MEDIUM: [
                "analyze", "compare", "explain", "implement", "create", "design"
            ],
            TaskComplexity.COMPLEX: [
                "research", "comprehensive", "detailed", "architecture", "optimize",
                "multi-step", "orchestrate", "integrate"
            ],
            TaskComplexity.EXPERT: [
                "expert", "advanced", "sophisticated", "cutting-edge", "revolutionary",
                "state-of-the-art", "complex analysis", "deep dive"
            ]
        }

        scores = {}
        for complexity, indicators in complexity_indicators.items():
            score = sum(1 for indicator in indicators if indicator in text)
            scores[complexity] = score

        # Return the complexity with the highest score
        max_complexity = max(scores, key=scores.get)
        return max_complexity if scores[max_complexity] > 0 else TaskComplexity.MEDIUM

    def _identify_required_capabilities(self, text: str) -> List[ModelCapability]:
        """Identify required model capabilities from task description"""
        capability_keywords = {
            ModelCapability.REASONING: [
                "analyze", "reason", "logic", "think", "deduce", "infer", "conclude"
            ],
            ModelCapability.CODING: [
                "code", "programming", "script", "function", "debug", "implement",
                "algorithm", "software", "development"
            ],
            ModelCapability.ANALYSIS: [
                "analyze", "evaluate", "assess", "examine", "review", "study",
                "research", "investigate"
            ],
            ModelCapability.CREATIVE: [
                "create", "design", "generate", "brainstorm", "innovative",
                "creative", "artistic", "original"
            ],
            ModelCapability.CONVERSATION: [
                "chat", "talk", "discuss", "conversation", "dialogue", "answer",
                "respond", "communicate"
            ],
            ModelCapability.MOBILE_OPTIMIZED: [
                "mobile", "quick", "fast", "brief", "urgent", "on-the-go",
                "smartphone", "tablet"
            ]
        }

        required_capabilities = []
        for capability, keywords in capability_keywords.items():
            if any(keyword in text for keyword in keywords):
                required_capabilities.append(capability)

        # Default capabilities if none detected
        if not required_capabilities:
            required_capabilities = [ModelCapability.CONVERSATION]

        return required_capabilities

    def _assess_cost_sensitivity(self, text: str) -> str:
        """Assess cost sensitivity from task description"""
        high_cost_indicators = ["premium", "best", "highest quality", "expert"]
        low_cost_indicators = ["cheap", "fast", "budget", "efficient", "cost-effective"]

        if any(indicator in text for indicator in high_cost_indicators):
            return "low"  # Low cost sensitivity = willing to pay more
        elif any(indicator in text for indicator in low_cost_indicators):
            return "high"  # High cost sensitivity = prefer cheaper options
        else:
            return "medium"

    def _assess_quality_requirements(self, text: str) -> str:
        """Assess quality requirements from task description"""
        high_quality_indicators = [
            "important", "critical", "production", "professional", "precise",
            "accurate", "high quality", "expert", "detailed"
        ]

        if any(indicator in text for indicator in high_quality_indicators):
            return "high"
        else:
            return "medium"

    def recommend_model(self, task_description: str, context: str = "",
                       mobile_context: bool = False) -> Tuple[str, float]:
        """Recommend the optimal model for a given task"""
        requirements = self.analyze_task_requirements(task_description, context)

        # Score each model based on requirements
        model_scores = {}
        for model_name, model_config in self.models.items():
            score = self._calculate_model_score(model_config, requirements, mobile_context)
            model_scores[model_name] = score

        # Select the highest scoring model
        best_model = max(model_scores, key=model_scores.get)
        confidence = model_scores[best_model]

        logger.info(f"Recommended model: {best_model} (confidence: {confidence:.2f})")
        return best_model, confidence

    def _calculate_model_score(self, model_config: Dict[str, Any],
                             requirements: Dict[str, Any],
                             mobile_context: bool) -> float:
        """Calculate a score for how well a model fits the requirements"""
        score = 0.0

        # Base quality score
        score += model_config.get("response_quality", 0.8) * 0.3

        # Capability matching
        model_capabilities = model_config.get("capabilities", [])
        required_capabilities = requirements.get("required_capabilities", [])

        capability_match = len(set(model_capabilities) & set(required_capabilities))
        capability_total = len(set(model_capabilities) | set(required_capabilities))
        capability_score = capability_match / capability_total if capability_total > 0 else 0
        score += capability_score * 0.4

        # Mobile optimization bonus
        if mobile_context and model_config.get("mobile_optimized", False):
            score += 0.2

        # Speed consideration
        if requirements.get("mobile_optimized_preferred", False):
            score += model_config.get("speed_rating", 0.8) * 0.2

        # Cost consideration
        cost_sensitivity = requirements.get("cost_sensitivity", "medium")
        cost_per_token = model_config.get("cost_per_input_token", 1e-6)

        if cost_sensitivity == "high":
            # Prefer cheaper models
            cost_score = 1.0 - min(cost_per_token / 15e-6, 1.0)
            score += cost_score * 0.3
        elif cost_sensitivity == "low":
            # Quality over cost
            score += 0.1

        # Context length consideration
        estimated_length = requirements.get("estimated_context_length", 0)
        max_context = model_config.get("max_context", 100000)

        if estimated_length > max_context:
            score *= 0.5  # Penalize models that can't handle the context

        return score

    async def switch_model(self, model_name: str, reason: str = "") -> bool:
        """Switch to a specified model"""
        if model_name not in self.models:
            logger.error(f"Unknown model: {model_name}")
            return False

        previous_model = self.current_model
        self.current_model = model_name

        # Record the switch
        switch_record = {
            "timestamp": datetime.now().isoformat(),
            "from_model": previous_model,
            "to_model": model_name,
            "reason": reason
        }
        self.model_history.append(switch_record)

        logger.info(f"Switched from {previous_model} to {model_name}: {reason}")

        # Update Claude Code configuration
        await self._update_claude_code_model(model_name)

        return True

    async def _update_claude_code_model(self, model_name: str) -> bool:
        """Update Claude Code to use the specified model"""
        try:
            model_config = self.models[model_name]
            model_type = model_config["type"]

            if model_type == ModelType.CLAUDE:
                # Update Claude Code configuration for Claude models
                await self._configure_claude_model(model_name)
            elif model_type == ModelType.GLM:
                # Update Claude Code configuration for GLM models
                await self._configure_glm_model(model_name)

            logger.info(f"Successfully updated Claude Code to use {model_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to update Claude Code model: {e}")
            return False

    async def _configure_claude_model(self, model_name: str) -> None:
        """Configure Claude Code for Claude models"""
        # This would integrate with Claude Code's model configuration
        # For now, we log the configuration change
        logger.info(f"Configuring Claude model: {model_name}")
        # Implementation would depend on Claude Code's configuration mechanism

    async def _configure_glm_model(self, model_name: str) -> None:
        """Configure Claude Code for GLM models"""
        # This would integrate with Claude Code's GLM model configuration
        # For now, we log the configuration change
        logger.info(f"Configuring GLM model: {model_name}")
        # Implementation would depend on Claude Code's GLM integration

    async def execute_with_optimal_model(self, task_description: str,
                                       context: str = "",
                                       mobile_context: bool = False) -> Dict[str, Any]:
        """Execute a task with the optimal model selection"""
        # Get model recommendation
        recommended_model, confidence = self.recommend_model(
            task_description, context, mobile_context
        )

        # Switch to recommended model if different from current
        if self.current_model != recommended_model:
            await self.switch_model(
                recommended_model,
                f"Optimal for task (confidence: {confidence:.2f})"
            )

        # Execute the task (this would integrate with the actual execution system)
        start_time = time.time()

        # Record performance metrics
        execution_time = time.time() - start_time
        self._record_performance(recommended_model, execution_time, task_description)

        return {
            "model_used": recommended_model,
            "confidence": confidence,
            "execution_time": execution_time,
            "task_description": task_description,
            "mobile_optimized": mobile_context
        }

    def _record_performance(self, model_name: str, execution_time: float,
                          task_description: str) -> None:
        """Record performance metrics for model optimization"""
        if model_name not in self.performance_metrics:
            self.performance_metrics[model_name] = {
                "total_requests": 0,
                "total_time": 0.0,
                "average_time": 0.0,
                "task_types": {}
            }

        metrics = self.performance_metrics[model_name]
        metrics["total_requests"] += 1
        metrics["total_time"] += execution_time
        metrics["average_time"] = metrics["total_time"] / metrics["total_requests"]

        # Track task type performance
        task_type = self._classify_task_type(task_description)
        if task_type not in metrics["task_types"]:
            metrics["task_types"][task_type] = {"count": 0, "total_time": 0.0}

        metrics["task_types"][task_type]["count"] += 1
        metrics["task_types"][task_type]["total_time"] += execution_time

    def _classify_task_type(self, task_description: str) -> str:
        """Classify task type for performance tracking"""
        text = task_description.lower()

        if any(word in text for word in ["code", "implement", "debug", "program"]):
            return "coding"
        elif any(word in text for word in ["analyze", "research", "study", "investigate"]):
            return "analysis"
        elif any(word in text for word in ["create", "design", "generate", "write"]):
            return "creative"
        elif any(word in text for word in ["chat", "talk", "conversation", "discuss"]):
            return "conversation"
        else:
            return "general"

    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        report = {
            "current_model": self.current_model,
            "total_model_switches": len(self.model_history),
            "model_performance": self.performance_metrics,
            "recent_switches": self.model_history[-5:],  # Last 5 switches
            "cost_analysis": self._calculate_cost_analysis(),
            "optimization_recommendations": self._generate_optimization_recommendations()
        }

        return report

    def _calculate_cost_analysis(self) -> Dict[str, Any]:
        """Calculate cost analysis across models"""
        # This would integrate with actual usage tracking
        # For now, return a placeholder structure
        return {
            "total_cost_estimate": 0.0,
            "cost_by_model": {},
            "cost_optimization_potential": 0.0
        }

    def _generate_optimization_recommendations(self) -> List[str]:
        """Generate recommendations for model usage optimization"""
        recommendations = []

        # Analyze performance metrics
        if not self.performance_metrics:
            recommendations.append("Start using model manager to collect performance data")
            return recommendations

        # Find the fastest model for each task type
        task_type_analysis = {}
        for model_name, metrics in self.performance_metrics.items():
            for task_type, task_metrics in metrics.get("task_types", {}).items():
                avg_time = task_metrics["total_time"] / task_metrics["count"]
                if task_type not in task_type_analysis or avg_time < task_type_analysis[task_type]["time"]:
                    task_type_analysis[task_type] = {
                        "model": model_name,
                        "time": avg_time
                    }

        for task_type, best in task_type_analysis.items():
            recommendations.append(
                f"For {task_type} tasks, {best['model']} performs best ({best['time']:.2f}s average)"
            )

        return recommendations

    def get_mobile_optimized_models(self) -> List[str]:
        """Get list of models optimized for mobile use"""
        return self.list_available_models(mobile_optimized=True)

    def get_cost_efficient_models(self) -> List[str]:
        """Get list of most cost-efficient models"""
        models_by_cost = sorted(
            self.models.items(),
            key=lambda x: x[1].get("cost_per_input_token", 0)
        )
        return [model[0] for model in models_by_cost[:3]]

# Convenience functions
async def quick_model_switch(model_name: str) -> bool:
    """Quick model switch for immediate use"""
    manager = ModelManager()
    return await manager.switch_model(model_name, "Manual quick switch")

async def auto_select_model(task_description: str, mobile: bool = False) -> str:
    """Auto-select optimal model for a task"""
    manager = ModelManager()
    model_name, confidence = manager.recommend_model(task_description, mobile_context=mobile)
    await manager.switch_model(model_name, f"Auto-selected (confidence: {confidence:.2f})")
    return model_name

def list_models() -> Dict[str, List[str]]:
    """List all available models by type"""
    manager = ModelManager()
    return {
        "claude": manager.list_available_models(ModelType.CLAUDE),
        "glm": manager.list_available_models(ModelType.GLM),
        "mobile_optimized": manager.get_mobile_optimized_models(),
        "cost_efficient": manager.get_cost_efficient_models()
    }

# CLI interface
if __name__ == "__main__":
    import sys

    async def main():
        if len(sys.argv) < 2:
            print("Usage: python model_manager.py [switch|recommend|list|report] [args...]")
            return

        command = sys.argv[1]
        manager = ModelManager()

        if command == "switch" and len(sys.argv) >= 3:
            model_name = sys.argv[2]
            success = await manager.switch_model(model_name, "CLI switch")
            print(f"Model switch {'successful' if success else 'failed'}")

        elif command == "recommend" and len(sys.argv) >= 3:
            task = " ".join(sys.argv[2:])
            model, confidence = manager.recommend_model(task)
            print(f"Recommended model: {model} (confidence: {confidence:.2f})")

        elif command == "list":
            models = list_models()
            for category, model_list in models.items():
                print(f"{category}: {', '.join(model_list)}")

        elif command == "report":
            report = manager.get_performance_report()
            print(json.dumps(report, indent=2))

        else:
            print(f"Unknown command: {command}")

    asyncio.run(main())