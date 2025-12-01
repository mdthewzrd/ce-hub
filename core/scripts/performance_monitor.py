#!/usr/bin/env python3
"""
CE-Hub Performance Monitoring & Optimization System
Master Operating System Performance Analytics

This module implements comprehensive performance monitoring, metrics collection,
and optimization recommendations for the CE-Hub ecosystem to ensure production-grade
performance and scalability.

Key Functions:
- Real-time performance metrics collection
- System health monitoring and alerting
- Bottleneck identification and recommendations
- Load testing and capacity planning
- Performance optimization automation

Usage:
    from scripts.performance_monitor import PerformanceMonitor

    monitor = PerformanceMonitor()
    await monitor.start_monitoring()
    health = await monitor.get_system_health()
"""

import asyncio
import json
import logging
import time
import psutil
import httpx
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from statistics import mean, median

# Local imports
import sys
sys.path.append(str(Path(__file__).parent))
from archon_client import ArchonFirst

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    timestamp: str
    metric_name: str
    value: float
    unit: str
    component: str
    status: str = "normal"

@dataclass
class SystemHealth:
    overall_score: float
    status: str
    components: Dict[str, Dict[str, Any]]
    recommendations: List[str]
    timestamp: str

class PerformanceMonitor:
    """
    Comprehensive Performance Monitoring System

    Monitors CE-Hub ecosystem performance, identifies bottlenecks,
    and provides optimization recommendations for production readiness.
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.metrics_history = []
        self.monitoring_active = False
        self.performance_thresholds = {
            "archon_response_time": {"warning": 100, "critical": 500},  # ms
            "agent_execution_time": {"warning": 5.0, "critical": 15.0},  # seconds
            "memory_usage": {"warning": 80, "critical": 95},  # percentage
            "cpu_usage": {"warning": 80, "critical": 95},  # percentage
            "disk_usage": {"warning": 85, "critical": 95}  # percentage
        }

        # Initialize components
        self.archon_client = None
        self.session = httpx.AsyncClient(timeout=30.0)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.aclose()
        if self.archon_client:
            await self.archon_client.__aexit__(exc_type, exc_val, exc_tb)

    async def start_monitoring(self, duration_seconds: int = 60, interval_seconds: int = 5) -> Dict[str, Any]:
        """
        Start comprehensive system monitoring

        Args:
            duration_seconds: How long to monitor (default: 60s)
            interval_seconds: Measurement interval (default: 5s)

        Returns:
            Dict with monitoring results and performance analysis
        """
        logger.info(f"🔍 Starting performance monitoring for {duration_seconds}s (interval: {interval_seconds}s)")

        self.monitoring_active = True
        start_time = time.time()
        end_time = start_time + duration_seconds

        monitoring_results = {
            "start_time": datetime.utcnow().isoformat(),
            "duration_seconds": duration_seconds,
            "metrics_collected": [],
            "performance_analysis": {},
            "recommendations": []
        }

        # Initialize Archon client
        self.archon_client = ArchonFirst()

        try:
            while time.time() < end_time and self.monitoring_active:
                cycle_start = time.time()

                # Collect all metrics
                metrics = await self._collect_all_metrics()
                monitoring_results["metrics_collected"].extend(metrics)
                self.metrics_history.extend(metrics)

                # Log key metrics
                self._log_key_metrics(metrics)

                # Wait for next interval
                cycle_time = time.time() - cycle_start
                sleep_time = max(0, interval_seconds - cycle_time)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

            # Generate analysis
            monitoring_results["performance_analysis"] = await self._analyze_performance()
            monitoring_results["recommendations"] = self._generate_recommendations()
            monitoring_results["end_time"] = datetime.utcnow().isoformat()

            logger.info("✓ Performance monitoring completed")
            return monitoring_results

        except Exception as e:
            logger.error(f"Performance monitoring failed: {e}")
            self.monitoring_active = False
            return {
                "error": str(e),
                "partial_results": monitoring_results
            }

    async def _collect_all_metrics(self) -> List[PerformanceMetric]:
        """Collect all performance metrics for current cycle"""
        metrics = []
        timestamp = datetime.utcnow().isoformat()

        # System metrics
        metrics.extend(self._collect_system_metrics(timestamp))

        # Archon metrics
        archon_metrics = await self._collect_archon_metrics(timestamp)
        metrics.extend(archon_metrics)

        # Chat system metrics
        chat_metrics = self._collect_chat_system_metrics(timestamp)
        metrics.extend(chat_metrics)

        # Agent orchestration metrics
        agent_metrics = self._collect_agent_metrics(timestamp)
        metrics.extend(agent_metrics)

        return metrics

    def _collect_system_metrics(self, timestamp: str) -> List[PerformanceMetric]:
        """Collect system resource metrics"""
        metrics = []

        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.1)
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="cpu_usage",
                value=cpu_percent,
                unit="percent",
                component="system",
                status=self._get_status("cpu_usage", cpu_percent)
            ))

            # Memory usage
            memory = psutil.virtual_memory()
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="memory_usage",
                value=memory.percent,
                unit="percent",
                component="system",
                status=self._get_status("memory_usage", memory.percent)
            ))

            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="memory_available",
                value=memory.available / (1024**3),  # GB
                unit="GB",
                component="system"
            ))

            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="disk_usage",
                value=disk_percent,
                unit="percent",
                component="system",
                status=self._get_status("disk_usage", disk_percent)
            ))

            # Process count
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="process_count",
                value=len(psutil.pids()),
                unit="count",
                component="system"
            ))

        except Exception as e:
            logger.warning(f"Failed to collect system metrics: {e}")

        return metrics

    async def _collect_archon_metrics(self, timestamp: str) -> List[PerformanceMetric]:
        """Collect Archon performance metrics"""
        metrics = []

        try:
            # Health check response time
            start_time = time.time()
            health = await self.archon_client.health_check()
            response_time = (time.time() - start_time) * 1000  # ms

            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="archon_response_time",
                value=response_time,
                unit="ms",
                component="archon",
                status=self._get_status("archon_response_time", response_time)
            ))

            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="archon_operational",
                value=1.0 if health.get("archon_operational") else 0.0,
                unit="boolean",
                component="archon"
            ))

            # Project sync time
            if health.get("archon_operational"):
                start_time = time.time()
                sync_result = await self.archon_client.sync_project_status("ce-hub")
                sync_time = (time.time() - start_time) * 1000  # ms

                metrics.append(PerformanceMetric(
                    timestamp=timestamp,
                    metric_name="archon_sync_time",
                    value=sync_time,
                    unit="ms",
                    component="archon"
                ))

                metrics.append(PerformanceMetric(
                    timestamp=timestamp,
                    metric_name="archon_project_count",
                    value=sync_result.get("total_projects", 0),
                    unit="count",
                    component="archon"
                ))

        except Exception as e:
            logger.warning(f"Failed to collect Archon metrics: {e}")
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="archon_operational",
                value=0.0,
                unit="boolean",
                component="archon",
                status="critical"
            ))

        return metrics

    def _collect_chat_system_metrics(self, timestamp: str) -> List[PerformanceMetric]:
        """Collect chat system performance metrics"""
        metrics = []

        try:
            # Count files in chat directories
            chat_dirs = {
                "active": self.project_root / "chats" / "active",
                "summaries": self.project_root / "chats" / "summaries",
                "completed": self.project_root / "chats" / "completed",
                "ingested": self.project_root / "chats" / "ingested"
            }

            for dir_name, dir_path in chat_dirs.items():
                if dir_path.exists():
                    file_count = len(list(dir_path.glob("*.md")))
                    metrics.append(PerformanceMetric(
                        timestamp=timestamp,
                        metric_name=f"chat_{dir_name}_count",
                        value=file_count,
                        unit="count",
                        component="chat_system"
                    ))

            # Check chat system configuration
            config_path = self.project_root / "config" / "chat_config.yml"
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="chat_config_available",
                value=1.0 if config_path.exists() else 0.0,
                unit="boolean",
                component="chat_system"
            ))

        except Exception as e:
            logger.warning(f"Failed to collect chat system metrics: {e}")

        return metrics

    def _collect_agent_metrics(self, timestamp: str) -> List[PerformanceMetric]:
        """Collect agent orchestration performance metrics"""
        metrics = []

        try:
            # Check agent registry availability
            registry_path = self.project_root / "agents" / "registry.json"
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="agent_registry_available",
                value=1.0 if registry_path.exists() else 0.0,
                unit="boolean",
                component="agent_system"
            ))

            # Check dispatch configuration
            dispatch_path = self.project_root / "config" / "agent_dispatch.json"
            metrics.append(PerformanceMetric(
                timestamp=timestamp,
                metric_name="agent_dispatch_available",
                value=1.0 if dispatch_path.exists() else 0.0,
                unit="boolean",
                component="agent_system"
            ))

            # Count available agent types
            if registry_path.exists():
                try:
                    with open(registry_path) as f:
                        registry = json.load(f)
                    agent_count = len(registry.get("agents", {}))
                    metrics.append(PerformanceMetric(
                        timestamp=timestamp,
                        metric_name="available_agent_types",
                        value=agent_count,
                        unit="count",
                        component="agent_system"
                    ))
                except Exception:
                    pass

        except Exception as e:
            logger.warning(f"Failed to collect agent metrics: {e}")

        return metrics

    def _get_status(self, metric_name: str, value: float) -> str:
        """Determine status based on thresholds"""
        thresholds = self.performance_thresholds.get(metric_name, {})

        critical = thresholds.get("critical")
        warning = thresholds.get("warning")

        if critical and value >= critical:
            return "critical"
        elif warning and value >= warning:
            return "warning"
        else:
            return "normal"

    def _log_key_metrics(self, metrics: List[PerformanceMetric]) -> None:
        """Log key performance indicators"""
        key_metrics = {}
        for metric in metrics:
            if metric.metric_name in ["cpu_usage", "memory_usage", "archon_response_time"]:
                key_metrics[metric.metric_name] = f"{metric.value:.1f}{metric.unit}"
                if metric.status != "normal":
                    key_metrics[metric.metric_name] += f" ({metric.status})"

        if key_metrics:
            logger.info(f"📊 Metrics: {', '.join(f'{k}={v}' for k, v in key_metrics.items())}")

    async def _analyze_performance(self) -> Dict[str, Any]:
        """Analyze collected performance data"""
        if not self.metrics_history:
            return {"error": "No metrics collected"}

        analysis = {
            "summary": {},
            "trends": {},
            "bottlenecks": [],
            "optimizations": []
        }

        # Group metrics by component and name
        metrics_by_type = {}
        for metric in self.metrics_history:
            key = f"{metric.component}.{metric.metric_name}"
            if key not in metrics_by_type:
                metrics_by_type[key] = []
            metrics_by_type[key].append(metric.value)

        # Generate summary statistics
        for metric_type, values in metrics_by_type.items():
            if len(values) > 0:
                analysis["summary"][metric_type] = {
                    "count": len(values),
                    "min": min(values),
                    "max": max(values),
                    "mean": mean(values),
                    "median": median(values)
                }

        # Identify performance issues
        analysis["bottlenecks"] = self._identify_bottlenecks()
        analysis["optimizations"] = self._suggest_optimizations()

        return analysis

    def _identify_bottlenecks(self) -> List[Dict[str, Any]]:
        """Identify performance bottlenecks"""
        bottlenecks = []

        # Check for consistent high response times
        archon_times = [m.value for m in self.metrics_history
                       if m.metric_name == "archon_response_time" and m.status != "normal"]
        if len(archon_times) > 0:
            bottlenecks.append({
                "component": "archon",
                "issue": "High response times",
                "severity": "high" if any(t > 200 for t in archon_times) else "medium",
                "suggestion": "Check Archon server load and database performance"
            })

        # Check for high resource usage
        cpu_usage = [m.value for m in self.metrics_history
                    if m.metric_name == "cpu_usage" and m.status != "normal"]
        if len(cpu_usage) > 0:
            bottlenecks.append({
                "component": "system",
                "issue": "High CPU usage",
                "severity": "high" if mean(cpu_usage) > 90 else "medium",
                "suggestion": "Consider optimizing algorithms or scaling resources"
            })

        memory_usage = [m.value for m in self.metrics_history
                       if m.metric_name == "memory_usage" and m.status != "normal"]
        if len(memory_usage) > 0:
            bottlenecks.append({
                "component": "system",
                "issue": "High memory usage",
                "severity": "high" if mean(memory_usage) > 90 else "medium",
                "suggestion": "Check for memory leaks and optimize data structures"
            })

        return bottlenecks

    def _suggest_optimizations(self) -> List[Dict[str, Any]]:
        """Suggest performance optimizations"""
        optimizations = []

        # Archon optimizations
        archon_metrics = [m for m in self.metrics_history if m.component == "archon"]
        if archon_metrics:
            avg_response = mean([m.value for m in archon_metrics if m.metric_name == "archon_response_time"])
            if avg_response > 50:  # > 50ms
                optimizations.append({
                    "component": "archon",
                    "optimization": "Enable connection pooling",
                    "expected_improvement": "30-50% response time reduction",
                    "priority": "high"
                })

            if avg_response > 20:  # > 20ms
                optimizations.append({
                    "component": "archon",
                    "optimization": "Implement response caching",
                    "expected_improvement": "50-80% response time reduction for repeated queries",
                    "priority": "medium"
                })

        # Agent system optimizations
        optimizations.append({
            "component": "agent_system",
            "optimization": "Implement agent result caching",
            "expected_improvement": "Faster repeated task analysis",
            "priority": "low"
        })

        # Chat system optimizations
        active_chats = [m.value for m in self.metrics_history if m.metric_name == "chat_active_count"]
        if active_chats and max(active_chats) > 100:
            optimizations.append({
                "component": "chat_system",
                "optimization": "Implement chat file archiving",
                "expected_improvement": "Reduced file system load",
                "priority": "medium"
            })

        return optimizations

    def _generate_recommendations(self) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        analysis = self.performance_thresholds

        # Check recent metrics for issues
        recent_metrics = [m for m in self.metrics_history[-10:] if m.status != "normal"]

        if any(m.metric_name == "archon_response_time" and m.status == "critical" for m in recent_metrics):
            recommendations.append("CRITICAL: Archon response times are high - check server health and database performance")

        if any(m.metric_name == "memory_usage" and m.value > 90 for m in recent_metrics):
            recommendations.append("HIGH: Memory usage critical - investigate memory leaks and consider increasing available memory")

        if any(m.metric_name == "cpu_usage" and m.value > 90 for m in recent_metrics):
            recommendations.append("HIGH: CPU usage critical - optimize computationally intensive operations")

        # General recommendations
        if not recommendations:
            recommendations.extend([
                "Consider implementing response caching for frequently accessed data",
                "Monitor long-term trends to identify gradual performance degradation",
                "Set up automated alerts for critical performance thresholds",
                "Implement load testing to validate performance under stress"
            ])

        return recommendations

    async def get_system_health(self) -> SystemHealth:
        """Get current system health snapshot"""
        logger.info("🔍 Collecting system health snapshot...")

        # Collect current metrics
        current_metrics = await self._collect_all_metrics()

        # Calculate component scores
        components = {}

        # Archon component
        archon_metrics = [m for m in current_metrics if m.component == "archon"]
        archon_score = 100.0
        archon_status = "healthy"

        for metric in archon_metrics:
            if metric.status == "critical":
                archon_score = min(archon_score, 30.0)
                archon_status = "critical"
            elif metric.status == "warning":
                archon_score = min(archon_score, 70.0)
                if archon_status != "critical":
                    archon_status = "warning"

        components["archon"] = {
            "score": archon_score,
            "status": archon_status,
            "metrics": [asdict(m) for m in archon_metrics]
        }

        # System component
        system_metrics = [m for m in current_metrics if m.component == "system"]
        system_score = 100.0
        system_status = "healthy"

        for metric in system_metrics:
            if metric.status == "critical":
                system_score = min(system_score, 20.0)
                system_status = "critical"
            elif metric.status == "warning":
                system_score = min(system_score, 60.0)
                if system_status != "critical":
                    system_status = "warning"

        components["system"] = {
            "score": system_score,
            "status": system_status,
            "metrics": [asdict(m) for m in system_metrics]
        }

        # Chat system component
        chat_metrics = [m for m in current_metrics if m.component == "chat_system"]
        components["chat_system"] = {
            "score": 100.0,  # No critical thresholds defined yet
            "status": "healthy",
            "metrics": [asdict(m) for m in chat_metrics]
        }

        # Agent system component
        agent_metrics = [m for m in current_metrics if m.component == "agent_system"]
        components["agent_system"] = {
            "score": 100.0,  # No critical thresholds defined yet
            "status": "healthy",
            "metrics": [asdict(m) for m in agent_metrics]
        }

        # Calculate overall score
        scores = [comp["score"] for comp in components.values()]
        overall_score = mean(scores) if scores else 0.0

        # Determine overall status
        if overall_score >= 90:
            overall_status = "excellent"
        elif overall_score >= 75:
            overall_status = "healthy"
        elif overall_score >= 50:
            overall_status = "warning"
        else:
            overall_status = "critical"

        # Generate recommendations
        recommendations = self._generate_health_recommendations(components)

        health = SystemHealth(
            overall_score=overall_score,
            status=overall_status,
            components=components,
            recommendations=recommendations,
            timestamp=datetime.utcnow().isoformat()
        )

        logger.info(f"✓ System health: {overall_status} (score: {overall_score:.1f}/100)")
        return health

    def _generate_health_recommendations(self, components: Dict[str, Dict]) -> List[str]:
        """Generate health-based recommendations"""
        recommendations = []

        for comp_name, comp_data in components.items():
            if comp_data["status"] == "critical":
                recommendations.append(f"URGENT: {comp_name} component requires immediate attention")
            elif comp_data["status"] == "warning":
                recommendations.append(f"MONITOR: {comp_name} component showing warning indicators")

        if not recommendations:
            recommendations.append("System health is excellent - continue monitoring trends")

        return recommendations

    async def run_performance_benchmark(self) -> Dict[str, Any]:
        """Run comprehensive performance benchmark"""
        logger.info("🚀 Starting performance benchmark...")

        benchmark_results = {
            "start_time": datetime.utcnow().isoformat(),
            "tests": {},
            "overall_performance": {}
        }

        # Archon performance test
        if self.archon_client:
            archon_test = await self._benchmark_archon()
            benchmark_results["tests"]["archon"] = archon_test

        # Agent orchestration performance test
        agent_test = await self._benchmark_agent_orchestration()
        benchmark_results["tests"]["agent_orchestration"] = agent_test

        # Chat system performance test
        chat_test = self._benchmark_chat_system()
        benchmark_results["tests"]["chat_system"] = chat_test

        # Calculate overall performance score
        test_scores = []
        for test_name, test_result in benchmark_results["tests"].items():
            if "performance_score" in test_result:
                test_scores.append(test_result["performance_score"])

        if test_scores:
            benchmark_results["overall_performance"] = {
                "score": mean(test_scores),
                "grade": self._get_performance_grade(mean(test_scores)),
                "recommendation": self._get_performance_recommendation(mean(test_scores))
            }

        benchmark_results["end_time"] = datetime.utcnow().isoformat()
        logger.info("✓ Performance benchmark completed")

        return benchmark_results

    async def _benchmark_archon(self) -> Dict[str, Any]:
        """Benchmark Archon performance"""
        test_iterations = 10
        response_times = []

        for i in range(test_iterations):
            start_time = time.time()
            try:
                health = await self.archon_client.health_check()
                response_time = (time.time() - start_time) * 1000
                response_times.append(response_time)
            except Exception as e:
                logger.warning(f"Archon benchmark iteration {i+1} failed: {e}")

        if response_times:
            avg_response = mean(response_times)
            performance_score = max(0, 100 - (avg_response / 2))  # 100 score at 0ms, 0 score at 200ms

            return {
                "test_name": "archon_response_time",
                "iterations": len(response_times),
                "avg_response_ms": avg_response,
                "min_response_ms": min(response_times),
                "max_response_ms": max(response_times),
                "performance_score": performance_score,
                "status": "pass" if avg_response < 100 else "warning" if avg_response < 500 else "fail"
            }
        else:
            return {
                "test_name": "archon_response_time",
                "status": "error",
                "error": "All test iterations failed",
                "performance_score": 0
            }

    async def _benchmark_agent_orchestration(self) -> Dict[str, Any]:
        """Benchmark agent orchestration performance"""
        try:
            # Import and test orchestrator
            from agent_orchestrator import analyze_task_requirements

            start_time = time.time()
            result = await analyze_task_requirements("Test performance analysis task")
            execution_time = time.time() - start_time

            performance_score = max(0, 100 - (execution_time * 10))  # 100 score at 0s, 0 score at 10s

            return {
                "test_name": "agent_orchestration",
                "execution_time_seconds": execution_time,
                "task_analyzed": True,
                "agents_recommended": len(result.get("recommended_agents", [])),
                "archon_synced": result.get("archon_synced", False),
                "performance_score": performance_score,
                "status": "pass" if execution_time < 2.0 else "warning" if execution_time < 5.0 else "fail"
            }
        except Exception as e:
            return {
                "test_name": "agent_orchestration",
                "status": "error",
                "error": str(e),
                "performance_score": 0
            }

    def _benchmark_chat_system(self) -> Dict[str, Any]:
        """Benchmark chat system performance"""
        try:
            # Test file I/O performance for chat system
            test_file = self.project_root / "chats" / "active" / "performance_test.md"
            test_content = "# Performance Test\n\nThis is a test file for performance monitoring.\n" * 100

            # Write test
            start_time = time.time()
            test_file.write_text(test_content)
            write_time = time.time() - start_time

            # Read test
            start_time = time.time()
            content = test_file.read_text()
            read_time = time.time() - start_time

            # Cleanup
            test_file.unlink()

            total_time = write_time + read_time
            performance_score = max(0, 100 - (total_time * 1000))  # 100 score at 0s, 0 score at 0.1s

            return {
                "test_name": "chat_file_io",
                "write_time_seconds": write_time,
                "read_time_seconds": read_time,
                "total_time_seconds": total_time,
                "file_size_bytes": len(test_content),
                "performance_score": performance_score,
                "status": "pass" if total_time < 0.01 else "warning" if total_time < 0.1 else "fail"
            }
        except Exception as e:
            return {
                "test_name": "chat_file_io",
                "status": "error",
                "error": str(e),
                "performance_score": 0
            }

    def _get_performance_grade(self, score: float) -> str:
        """Convert score to letter grade"""
        if score >= 95:
            return "A+"
        elif score >= 90:
            return "A"
        elif score >= 85:
            return "A-"
        elif score >= 80:
            return "B+"
        elif score >= 75:
            return "B"
        elif score >= 70:
            return "B-"
        elif score >= 65:
            return "C+"
        elif score >= 60:
            return "C"
        else:
            return "D"

    def _get_performance_recommendation(self, score: float) -> str:
        """Get recommendation based on score"""
        if score >= 90:
            return "Excellent performance - monitor for consistency"
        elif score >= 75:
            return "Good performance - minor optimizations may help"
        elif score >= 60:
            return "Acceptable performance - consider optimization review"
        else:
            return "Performance issues detected - optimization required"

# Convenience functions
async def monitor_performance(duration: int = 60, interval: int = 5) -> Dict[str, Any]:
    """Quick performance monitoring"""
    async with PerformanceMonitor() as monitor:
        return await monitor.start_monitoring(duration, interval)

async def check_system_health() -> SystemHealth:
    """Quick system health check"""
    async with PerformanceMonitor() as monitor:
        return await monitor.get_system_health()

async def run_benchmark() -> Dict[str, Any]:
    """Quick performance benchmark"""
    async with PerformanceMonitor() as monitor:
        return await monitor.run_performance_benchmark()

# CLI interface for testing
if __name__ == "__main__":
    import sys

    async def main():
        if len(sys.argv) < 2:
            print("Usage: python performance_monitor.py [monitor|health|benchmark]")
            return

        command = sys.argv[1]

        if command == "monitor":
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            result = await monitor_performance(duration)
            print(json.dumps(result, indent=2))

        elif command == "health":
            result = await check_system_health()
            print(json.dumps(asdict(result), indent=2))

        elif command == "benchmark":
            result = await run_benchmark()
            print(json.dumps(result, indent=2))

        else:
            print(f"Unknown command: {command}")

    asyncio.run(main())