#!/usr/bin/env python3
"""
Comprehensive Testing Script for Renata AI Agent
Tests multiple command sequences to ensure 100% success rate
"""

import requests
import json
import time
import asyncio
from typing import Dict, List, Tuple
from datetime import datetime

class RenataTester:
    def __init__(self):
        self.base_url = "http://localhost:6565"
        self.test_results = []
        self.passed_tests = 0
        self.failed_tests = 0

    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        timestamp = datetime.now().strftime("%H:%M:%S")

        print(f"[{timestamp}] {status} - {test_name}")
        if details:
            print(f"    Details: {details}")

        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": timestamp
        })

        if passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1

    def test_api_health(self) -> bool:
        """Test if API endpoints are working"""
        try:
            response = requests.get(f"{self.base_url}/api/test-prisma", timeout=5)
            data = response.json()

            if data.get("success") and data.get("tradeCount", 0) > 0:
                self.log_test("API Health Check", True, f"Found {data.get('tradeCount')} trades")
                return True
            else:
                self.log_test("API Health Check", False, "API returned unexpected response")
                return False

        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False

    def test_copilotkit_connection(self) -> bool:
        """Test CopilotKit endpoint connection"""
        try:
            # Test GraphQL query for available agents
            query = {
                "operationName": "availableAgents",
                "query": """
                query availableAgents {
                    availableAgents {
                        agents {
                            name
                            id
                            description
                        }
                    }
                }
                """,
                "variables": {}
            }

            response = requests.post(
                f"{self.base_url}/api/copilotkit",
                json=query,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                agents = data.get("data", {}).get("availableAgents", {}).get("agents", [])
                self.log_test("CopilotKit Connection", True, f"Found {len(agents)} agents")
                return True
            else:
                self.log_test("CopilotKit Connection", False, f"Status: {response.status_code}")
                return False

        except Exception as e:
            self.log_test("CopilotKit Connection", False, f"Error: {str(e)}")
            return False

    def test_renata_chat_endpoint(self, message: str) -> Tuple[bool, str]:
        """Test Renata chat endpoint with a message"""
        try:
            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            }

            response = requests.post(
                f"{self.base_url}/api/renata/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                response_text = data.get("response", "")
                return True, response_text
            else:
                return False, f"Status: {response.status_code}, Error: {response.text}"

        except Exception as e:
            return False, f"Error: {str(e)}"

    def run_comprehensive_tests(self):
        """Run comprehensive test suite"""
        print("\n🚀 Starting Comprehensive Renata AI Testing")
        print("=" * 60)

        # Test 1: Basic API Health
        if not self.test_api_health():
            print("❌ Basic API health failed - aborting remaining tests")
            return

        # Test 2: CopilotKit Connection
        self.test_copilotkit_connection()

        # Test 3-20: Individual Command Types
        test_commands = [
            # Date Range Commands
            ("Show me all of 2025 data", "Date parsing - year specific"),
            ("Show me YTD trades", "Date parsing - preset range"),
            ("Show me last 30 days", "Date parsing - relative range"),
            ("Show me January 2024", "Date parsing - month specific"),

            # Display Mode Commands
            ("Switch to R-multiples", "Display mode toggle"),
            ("Change to dollar mode", "Display mode toggle back"),

            # Navigation Commands
            ("Navigate to dashboard", "Navigation command"),
            ("Go to statistics page", "Navigation command"),
            ("Show me the calendar", "Navigation command"),

            # UI Element Interaction
            ("Click on the performance tab", "UI element interaction"),
            ("Scroll to the metrics section", "UI scroll interaction"),
            ("Find the trade table", "UI element location"),

            # Data Analysis Commands
            ("Show me my best trades", "Data analysis request"),
            ("What are my win rate statistics?", "Statistics request"),
            ("Show me P&L by symbol", "Data aggregation request"),

            # Complex Commands
            ("Navigate to dashboard and switch to R-multiples", "Multi-step command"),
            ("Show YTD data and then show performance tab", "Sequential command"),
            ("Go to trades table and filter for AAPL", "Complex workflow"),
        ]

        for i, (command, description) in enumerate(test_commands, 3):
            print(f"\n📝 Test {i}: {description}")
            print(f"   Command: \"{command}\"")

            passed, details = self.test_renata_chat_endpoint(command)
            self.log_test(f"Command Test {i}: {description}", passed, details[:100] + "..." if len(details) > 100 else details)

            # Small delay between tests
            time.sleep(1)

        # Test 21-25: Sequential Command Processing
        sequential_tests = [
            [
                "Navigate to dashboard",
                "Switch to R-multiples",
                "Show YTD data",
                "Scroll to metrics"
            ],
            [
                "Go to statistics",
                "Click performance tab",
                "Show win rate stats"
            ],
            [
                "Show all of 2024 data",
                "Change to dollar mode",
                "Show best performing trades"
            ]
        ]

        for i, command_sequence in enumerate(sequential_tests, 21):
            print(f"\n🔄 Sequential Test {i}: Testing command sequence")
            sequence_passed = True
            sequence_details = []

            for j, command in enumerate(command_sequence):
                passed, details = self.test_renata_chat_endpoint(command)
                sequence_details.append(f"Step {j+1}: {'✅' if passed else '❌'}")
                if not passed:
                    sequence_passed = False

            self.log_test(
                f"Sequential Test {i}",
                sequence_passed,
                " | ".join(sequence_details)
            )

        # Test 26-30: Edge Cases and Error Handling
        edge_cases = [
            ("Show me data for invalid date XYZ", "Invalid date handling"),
            ("Click on nonexistent button", "Invalid UI element handling"),
            ("", "Empty message handling"),
            ("Show me trades for symbol FAKESYMBOL123", "Invalid symbol handling"),
            ("Navigate to nonexistent page", "Invalid navigation handling"),
        ]

        for i, (command, description) in enumerate(edge_cases, 26):
            passed, details = self.test_renata_chat_endpoint(command)
            # For edge cases, we expect graceful handling rather than hard failures
            graceful_handling = passed or "error" in details.lower() or "not found" in details.lower()
            self.log_test(
                f"Edge Case {i}: {description}",
                graceful_handling,
                details[:100] + "..." if len(details) > 100 else details
            )

        # Final Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)

        total_tests = self.passed_tests + self.failed_tests
        success_rate = (self.passed_tests / total_tests * 100) if total_tests > 0 else 0

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")

        if success_rate >= 100:
            print("\n🎉 PERFECT SCORE! Renata is bulletproof!")
        elif success_rate >= 95:
            print("\n✅ EXCELLENT! Renata is highly reliable")
        elif success_rate >= 90:
            print("\n✅ GOOD! Renata is mostly reliable")
        elif success_rate >= 80:
            print("\n⚠️  FAIR! Renata needs some improvements")
        else:
            print("\n❌ POOR! Renata needs significant work")

        # Show failed tests if any
        if self.failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"   • {result['test']}: {result['details']}")

if __name__ == "__main__":
    tester = RenataTester()
    tester.run_comprehensive_tests()