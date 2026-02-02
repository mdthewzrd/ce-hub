#!/usr/bin/env python3
"""
Comprehensive Renata Validation Test
Validates that Renata AI chat is fully functional across all modes and integrations
"""

import asyncio
import httpx
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class RenataValidator:
    def __init__(self):
        self.backend_url = "http://localhost:6500"
        self.frontend_url = "http://localhost:6565"
        self.archon_url = "http://localhost:8052"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": {},
            "overall_status": "unknown"
        }

    async def run_all_tests(self):
        """Run comprehensive validation of Renata functionality"""
        print("🧪 COMPREHENSIVE RENATA VALIDATION")
        print("=" * 50)

        # Test 1: Service Health Check
        await self.test_service_health()

        # Test 2: Archon Integration
        await self.test_archon_integration()

        # Test 3: Backend AI Endpoints
        await self.test_backend_ai_endpoints()

        # Test 4: AI Chat Functionality
        await self.test_ai_chat_functionality()

        # Test 5: Different AI Modes
        await self.test_ai_modes()

        # Test 6: Frontend Integration
        await self.test_frontend_integration()

        # Calculate overall status
        self.calculate_overall_status()

        # Generate report
        self.generate_report()

    async def test_service_health(self):
        """Test that all required services are running and healthy"""
        print("\n🏥 TEST 1: Service Health Check")

        results = {}

        # Test Backend
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.backend_url}/health", timeout=5)
                results["backend"] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_code": response.status_code,
                    "response_time": response.elapsed.total_seconds()
                }
                print(f"  ✅ Backend: {response.status_code} ({response.elapsed.total_seconds():.2f}s)")
        except Exception as e:
            results["backend"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Backend: {e}")

        # Test Archon
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.archon_url}/health", timeout=5)
                results["archon"] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_code": response.status_code,
                    "response_time": response.elapsed.total_seconds()
                }
                print(f"  ✅ Archon: {response.status_code} ({response.elapsed.total_seconds():.2f}s)")
        except Exception as e:
            results["archon"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Archon: {e}")

        # Test Frontend
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.frontend_url}", timeout=5)
                results["frontend"] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_code": response.status_code,
                    "response_time": response.elapsed.total_seconds()
                }
                print(f"  ✅ Frontend: {response.status_code} ({response.elapsed.total_seconds():.2f}s)")
        except Exception as e:
            results["frontend"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Frontend: {e}")

        self.results["tests"]["service_health"] = results

    async def test_archon_integration(self):
        """Test Archon knowledge base integration"""
        print("\n🔍 TEST 2: Archon Integration")

        results = {}

        # Test Knowledge Search
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.archon_url}/rag_search_knowledge_base",
                    json={"query": "trading performance", "match_count": 3},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    results["knowledge_search"] = {
                        "status": "working",
                        "response_time": response.elapsed.total_seconds(),
                        "results_count": len(data.get("results", [])),
                        "success": data.get("success", False)
                    }
                    print(f"  ✅ Knowledge Search: {len(data.get('results', []))} results ({response.elapsed.total_seconds():.2f}s)")
                else:
                    results["knowledge_search"] = {
                        "status": "failed",
                        "response_code": response.status_code
                    }
                    print(f"  ❌ Knowledge Search: {response.status_code}")
        except Exception as e:
            results["knowledge_search"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Knowledge Search: {e}")

        # Test Code Examples Search
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.archon_url}/rag_search_code_examples",
                    json={"query": "risk calculation", "match_count": 2},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    results["code_search"] = {
                        "status": "working",
                        "response_time": response.elapsed.total_seconds(),
                        "results_count": len(data.get("results", [])),
                        "success": data.get("success", False)
                    }
                    print(f"  ✅ Code Search: {len(data.get('results', []))} results ({response.elapsed.total_seconds():.2f}s)")
                else:
                    results["code_search"] = {
                        "status": "failed",
                        "response_code": response.status_code
                    }
                    print(f"  ❌ Code Search: {response.status_code}")
        except Exception as e:
            results["code_search"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Code Search: {e}")

        self.results["tests"]["archon_integration"] = results

    async def test_backend_ai_endpoints(self):
        """Test backend AI-related endpoints"""
        print("\n🤖 TEST 3: Backend AI Endpoints")

        results = {}

        # Test AI Status
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.backend_url}/ai/status", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    results["ai_status"] = {
                        "status": "working",
                        "connected": data.get("connected", False),
                        "archon_healthy": data.get("health", {}).get("success", False),
                        "project_id": data.get("project_id")
                    }
                    print(f"  ✅ AI Status: Connected={data.get('connected', False)}")
                else:
                    results["ai_status"] = {
                        "status": "failed",
                        "response_code": response.status_code
                    }
                    print(f"  ❌ AI Status: {response.status_code}")
        except Exception as e:
            results["ai_status"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ AI Status: {e}")

        # Test AI Chat Endpoint (Enhanced)
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/ai/renata/chat-enhanced",
                    json={
                        "message": "Hello, this is a test message",
                        "mode": "analyst",
                        "context": "validation_test"
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    results["chat_endpoint"] = {
                        "status": "working",
                        "response_time": response.elapsed.total_seconds(),
                        "has_response": "response" in data,
                        "has_required_fields": all(field in data for field in ["command_type", "intent", "confidence"])
                    }
                    print(f"  ✅ Chat Endpoint: Working ({response.elapsed.total_seconds():.2f}s)")
                else:
                    results["chat_endpoint"] = {
                        "status": "failed",
                        "response_code": response.status_code
                    }
                    print(f"  ❌ Chat Endpoint: {response.status_code}")
        except Exception as e:
            results["chat_endpoint"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Chat Endpoint: {e}")

        self.results["tests"]["backend_ai_endpoints"] = results

    async def test_ai_chat_functionality(self):
        """Test actual AI chat responses"""
        print("\n💬 TEST 4: AI Chat Functionality")

        results = {}
        test_messages = [
            {
                "name": "general_trading",
                "message": "What are some key risk management principles?",
                "mode": "analyst"
            },
            {
                "name": "trading_psychology",
                "message": "How can I improve emotional discipline in trading?",
                "mode": "coach"
            }
        ]

        for test_case in test_messages:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.backend_url}/ai/renata/chat-enhanced",
                        json={
                            "message": test_case["message"],
                            "mode": test_case["mode"],
                            "context": "validation_test"
                        },
                        timeout=15
                    )

                    if response.status_code == 200:
                        data = response.json()
                        ai_response = data.get("response", "")
                        results[test_case["name"]] = {
                            "status": "working",
                            "response_time": response.elapsed.total_seconds(),
                            "response_length": len(ai_response),
                            "has_meaningful_content": len(ai_response) > 50,
                            "ai_confidence": data.get("confidence", 0),
                            "intent_detected": data.get("intent", "") != ""
                        }
                        print(f"  ✅ {test_case['name']}: {len(ai_response)} chars ({response.elapsed.total_seconds():.2f}s)")
                    else:
                        results[test_case["name"]] = {
                            "status": "failed",
                            "response_code": response.status_code
                        }
                        print(f"  ❌ {test_case['name']}: {response.status_code}")
            except Exception as e:
                results[test_case["name"]] = {
                    "status": "error",
                    "error": str(e)
                }
                print(f"  ❌ {test_case['name']}: {e}")

        self.results["tests"]["ai_chat_functionality"] = results

    async def test_ai_modes(self):
        """Test all three AI modes (Analyst, Coach, Mentor)"""
        print("\n🎭 TEST 5: AI Modes")

        results = {}
        modes = ["analyst", "coach", "mentor"]
        test_message = "Give me some trading advice"

        for mode in modes:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.backend_url}/ai/renata/chat-enhanced",
                        json={
                            "message": test_message,
                            "mode": mode,
                            "context": "mode_validation"
                        },
                        timeout=15
                    )

                    if response.status_code == 200:
                        data = response.json()
                        ai_response = data.get("response", "")
                        results[mode] = {
                            "status": "working",
                            "response_time": response.elapsed.total_seconds(),
                            "response_length": len(ai_response),
                            "mode_specific_content": mode in ai_response.lower() or len(ai_response) > 100,
                            "confidence": data.get("confidence", 0),
                            "learning_applied": data.get("learning_applied", False)
                        }
                        print(f"  ✅ {mode.title()}: {len(ai_response)} chars ({response.elapsed.total_seconds():.2f}s)")
                    else:
                        results[mode] = {
                            "status": "failed",
                            "response_code": response.status_code
                        }
                        print(f"  ❌ {mode.title()}: {response.status_code}")
            except Exception as e:
                results[mode] = {
                    "status": "error",
                    "error": str(e)
                }
                print(f"  ❌ {mode.title()}: {e}")

        self.results["tests"]["ai_modes"] = results

    async def test_frontend_integration(self):
        """Test that frontend can access AI endpoints"""
        print("\n🌐 TEST 6: Frontend Integration")

        results = {}

        # Test frontend can reach backend AI endpoint
        try:
            async with httpx.AsyncClient() as client:
                # This simulates what the frontend would do
                response = await client.get(
                    f"{self.backend_url}/ai/status",
                    headers={"Origin": self.frontend_url},
                    timeout=5
                )

                results["frontend_backend_connection"] = {
                    "status": "working" if response.status_code == 200 else "failed",
                    "response_code": response.status_code,
                    "cors_headers": "access-control-allow-origin" in response.headers
                }
                print(f"  ✅ Frontend-Backend Connection: {response.status_code}")
        except Exception as e:
            results["frontend_backend_connection"] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ❌ Frontend-Backend Connection: {e}")

        self.results["tests"]["frontend_integration"] = results

    def calculate_overall_status(self):
        """Calculate overall validation status"""
        total_tests = 0
        passed_tests = 0

        for test_category, tests in self.results["tests"].items():
            if isinstance(tests, dict):
                for test_name, result in tests.items():
                    total_tests += 1
                    if isinstance(result, dict) and result.get("status") == "working":
                        passed_tests += 1

        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

        if success_rate >= 90:
            overall_status = "excellent"
        elif success_rate >= 75:
            overall_status = "good"
        elif success_rate >= 50:
            overall_status = "partial"
        else:
            overall_status = "failing"

        self.results["overall_status"] = overall_status
        self.results["success_rate"] = success_rate
        self.results["total_tests"] = total_tests
        self.results["passed_tests"] = passed_tests

    def generate_report(self):
        """Generate final validation report"""
        print("\n" + "=" * 50)
        print("📊 VALIDATION REPORT")
        print("=" * 50)

        status_emoji = {
            "excellent": "🟢",
            "good": "🟡",
            "partial": "🟠",
            "failing": "🔴",
            "unknown": "⚪"
        }

        print(f"Overall Status: {status_emoji.get(self.results['overall_status'], '⚪')} {self.results['overall_status'].upper()}")
        print(f"Success Rate: {self.results.get('success_rate', 0):.1f}%")
        print(f"Tests Passed: {self.results.get('passed_tests', 0)}/{self.results.get('total_tests', 0)}")

        print("\nDetailed Results:")
        for category, tests in self.results["tests"].items():
            print(f"\n{category.replace('_', ' ').title()}:")
            if isinstance(tests, dict):
                for test_name, result in tests.items():
                    status = result.get("status", "unknown") if isinstance(result, dict) else "invalid"
                    emoji = "✅" if status == "working" else "❌" if status in ["failed", "error"] else "⚪"
                    print(f"  {emoji} {test_name}: {status}")

        # Save report to file
        report_file = f"renata_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        print(f"\n📁 Detailed report saved to: {report_file}")

        return self.results

async def main():
    """Run the comprehensive validation"""
    validator = RenataValidator()
    results = await validator.run_all_tests()

    # Exit with appropriate code
    if results["overall_status"] in ["excellent", "good"]:
        print("\n🎉 Renata validation PASSED!")
        return 0
    else:
        print("\n⚠️ Renata validation needs attention!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)