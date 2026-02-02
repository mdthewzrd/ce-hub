#!/usr/bin/env python3
"""
Custom Playwright Bridge for CE-Hub Validation System

This bridge connects Claude Code to the sophisticated Edge.dev Playwright setup
enabling proper user experience validation through actual browser automation.

Key Features:
- Integrates with existing 44+ test scripts
- Supports multi-device testing (desktop, mobile, tablet)
- Provides visual regression testing
- Performance validation capabilities
- Real-time test results and confidence scoring
"""

import sys
import json
import asyncio
import subprocess
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import time

class CEHubPlaywrightBridge:
    def __init__(self):
        self.project_root = Path("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")
        self.test_results_dir = self.project_root / "test-results"
        self.base_url = "http://localhost:5657"
        self.confidence_threshold = 0.9

    async def run_validation_test(self, test_type: str = "smoke", device: str = "chromium-desktop") -> Dict[str, Any]:
        """
        Run Playwright validation tests and return results with confidence score

        Args:
            test_type: Type of test (smoke, e2e, visual, mobile, performance)
            device: Target device/browser for testing

        Returns:
            Dict containing test results, confidence score, and validation status
        """
        start_time = time.time()

        try:
            # Change to project directory
            os.chdir(self.project_root)

            # Determine test command based on type
            test_commands = {
                "smoke": f"npm run test:smoke",
                "e2e": f"npm run test:e2e -- --project={device}",
                "visual": f"npm run test:visual -- --project={device}",
                "mobile": f"npm run test:mobile",
                "performance": f"npm run test:performance",
                "basic": f"npm run test:basic",
                "trading": f"npm run test:trading -- --project={device}",
                "charts": f"npm run test:charts -- --project={device}"
            }

            command = test_commands.get(test_type, test_commands["smoke"])

            # Run the test
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            execution_time = time.time() - start_time

            # Parse test results
            test_results = await self._parse_test_results(result, execution_time)

            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(test_results)

            # Determine validation status
            validation_status = "PASS" if confidence_score >= self.confidence_threshold else "FAIL"

            return {
                "status": validation_status,
                "confidence_score": confidence_score,
                "execution_time": execution_time,
                "test_type": test_type,
                "device": device,
                "test_results": test_results,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }

        except subprocess.TimeoutExpired:
            return {
                "status": "FAIL",
                "confidence_score": 0.0,
                "execution_time": time.time() - start_time,
                "test_type": test_type,
                "device": device,
                "error": "Test execution timed out after 5 minutes"
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "confidence_score": 0.0,
                "execution_time": time.time() - start_time,
                "test_type": test_type,
                "device": device,
                "error": str(e)
            }

    async def _parse_test_results(self, result: subprocess.CompletedProcess, execution_time: float) -> Dict[str, Any]:
        """Parse Playwright test output and extract key metrics"""
        stdout = result.stdout
        stderr = result.stderr

        # Look for test summary in output
        test_summary = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "flaky_tests": 0,
            "skipped_tests": 0,
            "duration": execution_time
        }

        # Parse common Playwright output patterns
        lines = stdout.split('\n') + stderr.split('\n')

        for line in lines:
            if 'passed' in line.lower() and ('tests' in line.lower() or 'test' in line.lower()):
                # Extract numbers from output like "3 passed, 1 failed"
                parts = line.lower().replace(',', '').split()
                for i, part in enumerate(parts):
                    if part.isdigit() and i + 1 < len(parts):
                        if parts[i + 1] in ['passed', 'pass']:
                            test_summary["passed_tests"] = int(part)
                        elif parts[i + 1] in ['failed', 'fail']:
                            test_summary["failed_tests"] = int(part)
                        elif parts[i + 1] in ['flaky']:
                            test_summary["flaky_tests"] = int(part)
                        elif parts[i + 1] in ['skipped', 'skip']:
                            test_summary["skipped_tests"] = int(part)

            # Look for total test count
            if 'tests' in line.lower() and any(char.isdigit() for char in line):
                # Extract total count
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    test_summary["total_tests"] = max(map(int, numbers))

        # Calculate derived metrics
        test_summary["success_rate"] = (
            test_summary["passed_tests"] / max(test_summary["total_tests"], 1) * 100
        )

        # Check for HTML report generation
        html_report_path = self.test_results_dir / "html-report" / "index.html"
        test_summary["html_report_exists"] = html_report_path.exists()

        return test_summary

    def _calculate_confidence_score(self, test_results: Dict[str, Any]) -> float:
        """
        Calculate confidence score based on test results

        Scoring factors:
        - Test success rate (70% weight)
        - Execution time consistency (15% weight)
        - Error/exception presence (15% weight)
        """
        base_score = 0.0

        # Success rate scoring (70% weight)
        success_rate = test_results.get("success_rate", 0)
        success_score = (success_rate / 100) * 0.7

        # Execution time scoring (15% weight)
        # Prefer tests that complete within reasonable time (30-180 seconds)
        duration = test_results.get("duration", 0)
        if 30 <= duration <= 180:
            time_score = 0.15
        elif duration < 30:
            time_score = 0.1  # Too fast might indicate incomplete testing
        elif duration <= 300:
            time_score = 0.05  # Slow but acceptable
        else:
            time_score = 0.0  # Too slow

        # Error scoring (15% weight)
        # Deduct points for failed tests and errors
        failed_tests = test_results.get("failed_tests", 0)
        total_tests = test_results.get("total_tests", 1)
        error_ratio = failed_tests / total_tests
        error_score = max(0, 0.15 - (error_ratio * 0.15))

        # Calculate final score
        confidence_score = success_score + time_score + error_score

        return min(1.0, max(0.0, confidence_score))

    async def run_user_workflow_validation(self, workflow_name: str) -> Dict[str, Any]:
        """
        Run specific user workflow validation

        Examples:
        - Trading scanner creation and execution
        - AI assistant chat interaction
        - Project management workflow
        - Mobile responsiveness validation
        """

        workflow_configs = {
            "trading_scanner": {
                "tests": ["test:trading", "test:charts"],
                "devices": ["chromium-desktop", "mobile-chrome"],
                "description": "Validate trading scanner functionality"
            },
            "ai_assistant": {
                "tests": ["test:basic", "test:e2e"],
                "devices": ["chromium-desktop", "mobile-safari"],
                "description": "Validate AI assistant interaction"
            },
            "mobile_responsive": {
                "tests": ["test:mobile-responsive"],
                "devices": ["mobile-chrome", "mobile-safari", "tablet-chrome"],
                "description": "Validate mobile responsiveness"
            },
            "performance": {
                "tests": ["test:performance"],
                "devices": ["performance-chrome"],
                "description": "Validate performance metrics"
            }
        }

        config = workflow_configs.get(workflow_name, workflow_configs["trading_scanner"])

        # Run tests across all specified devices
        all_results = []
        for device in config["devices"]:
            for test_type in config["tests"]:
                result = await self.run_validation_test(test_type, device)
                all_results.append(result)

        # Aggregate results
        avg_confidence = sum(r["confidence_score"] for r in all_results) / len(all_results)
        all_passed = all(r["status"] == "PASS" for r in all_results)

        return {
            "workflow_name": workflow_name,
            "description": config["description"],
            "overall_status": "PASS" if all_passed else "FAIL",
            "average_confidence_score": avg_confidence,
            "individual_results": all_results,
            "recommendations": self._generate_workflow_recommendations(all_results)
        }

    def _generate_workflow_recommendations(self, results: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []

        failed_tests = [r for r in results if r["status"] == "FAIL"]
        if failed_tests:
            recommendations.append(f"Fix {len(failed_tests)} failing tests before deployment")

        low_confidence_tests = [r for r in results if r["confidence_score"] < 0.8]
        if low_confidence_tests:
            recommendations.append("Improve test stability and reliability")

        slow_tests = [r for r in results if r.get("test_results", {}).get("duration", 0) > 180]
        if slow_tests:
            recommendations.append("Optimize test execution time")

        if not recommendations:
            recommendations.append("All tests passing - ready for deployment")

        return recommendations

async def main():
    """Main function for MCP server communication"""
    bridge = CEHubPlaywrightBridge()

    # Simple MCP protocol handling
    while True:
        try:
            # Read command from stdin (MCP protocol)
            line = sys.stdin.readline()
            if not line:
                break

            try:
                request = json.loads(line.strip())
                method = request.get("method")
                params = request.get("params", {})

                if method == "run_validation":
                    test_type = params.get("test_type", "smoke")
                    device = params.get("device", "chromium-desktop")
                    result = await bridge.run_validation_test(test_type, device)

                elif method == "run_workflow_validation":
                    workflow = params.get("workflow", "trading_scanner")
                    result = await bridge.run_user_workflow_validation(workflow)

                else:
                    result = {"error": f"Unknown method: {method}"}

                # Send response
                response = {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "result": result
                }
                print(json.dumps(response))
                sys.stdout.flush()

            except json.JSONDecodeError:
                # Invalid JSON, continue
                continue

        except KeyboardInterrupt:
            break
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "error": {"code": -1, "message": str(e)}}
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())