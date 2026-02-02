#!/usr/bin/env python3
"""
Mobile Platform Testing Script
Tests the mobile CE-Hub platform functionality
"""

import json
import requests
import subprocess
import time
import sys
from pathlib import Path

class MobilePlatformTester:
    def __init__(self):
        self.base_url = "http://100.95.223.19:8106"
        self.api_endpoints = {
            "claude_chat": "http://100.95.223.19:8115/claude-chat",
            "file_server": "http://100.95.223.19:8109",
            "mobile_bridge": "http://localhost:8110"
        }
        self.test_results = []

    def log_test_result(self, test_name, status, details=""):
        """Log a test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)

        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_mobile_interface_accessibility(self):
        """Test if mobile interface loads properly"""
        try:
            response = requests.get(f"{self.base_url}/mobile-pro-v3-fixed.html", timeout=5)
            if response.status_code == 200 and "CE-Hub Pro" in response.text:
                self.log_test_result("Mobile Interface Accessibility", "PASS",
                    f"Status: {response.status_code}, Page loads correctly")
            else:
                self.log_test_result("Mobile Interface Accessibility", "FAIL",
                    f"Status: {response.status_code}, Content check failed")
        except Exception as e:
            self.log_test_result("Mobile Interface Accessibility", "FAIL", str(e))

    def test_file_server_connectivity(self):
        """Test file server endpoint connectivity"""
        try:
            response = requests.get(f"{self.api_endpoints['file_server']}/", timeout=5)
            if response.status_code == 200:
                self.log_test_result("File Server Connectivity", "PASS",
                    f"Status: {response.status_code}, Server responding")
            else:
                self.log_test_result("File Server Connectivity", "FAIL",
                    f"Status: {response.status_code}")
        except Exception as e:
            self.log_test_result("File Server Connectivity", "FAIL", str(e))

    def test_api_endpoints(self):
        """Test various API endpoints"""

        # Test Claude Chat endpoint (this will likely fail but we should document it)
        try:
            test_payload = {
                "question": "Hello, can you help me?",
                "use_archon": True,
                "context": {"ce_hub_mobile": True}
            }
            response = requests.post(
                self.api_endpoints['claude_chat'],
                json=test_payload,
                timeout=10
            )
            if response.status_code == 200:
                self.log_test_result("Claude Chat API", "PASS", "API responding")
            else:
                self.log_test_result("Claude Chat API", "FAIL",
                    f"Status: {response.status_code}")
        except Exception as e:
            self.log_test_result("Claude Chat API", "FAIL", f"Connection error: {str(e)}")

    def test_archon_mcp_connectivity(self):
        """Test Archon MCP connectivity"""
        try:
            # Try to connect to Archon MCP tools
            response = requests.get("http://localhost:8051/health", timeout=5)
            if response.status_code == 200:
                self.log_test_result("Archon MCP Connectivity", "PASS", "Archon responding")
            else:
                self.log_test_result("Archon MCP Connectivity", "FAIL",
                    f"Status: {response.status_code}")
        except Exception as e:
            self.log_test_result("Archon MCP Connectivity", "FAIL", f"Connection error: {str(e)}")

    def test_local_services(self):
        """Test if local bridge services are running"""

        # Check for any Python bridge processes
        try:
            result = subprocess.run(['pgrep', '-f', 'bridge'],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                self.log_test_result("Bridge Service Processes", "PASS",
                    f"Found {len(pids)} bridge process(es)")
            else:
                self.log_test_result("Bridge Service Processes", "FAIL",
                    "No bridge processes found")
        except Exception as e:
            self.log_test_result("Bridge Service Processes", "FAIL", str(e))

    def test_file_structure_analysis(self):
        """Analyze the mobile platform file structure"""
        try:
            mobile_file = Path("mobile-pro-v3-fixed.html")
            if mobile_file.exists():
                content = mobile_file.read_text()

                # Check for key features
                features_found = []
                if "claude-chat" in content:
                    features_found.append("Claude Chat Integration")
                if "Archon" in content:
                    features_found.append("Archon MCP Support")
                if "file-tree" in content:
                    features_found.append("File Browser")
                if "terminal" in content:
                    features_found.append("Terminal Interface")
                if "model-selector" in content:
                    features_found.append("Model Selection")

                self.log_test_result("Mobile Platform Feature Analysis", "PASS",
                    f"Features found: {', '.join(features_found)}")
            else:
                self.log_test_result("Mobile Platform Feature Analysis", "FAIL",
                    "Mobile platform file not found")
        except Exception as e:
            self.log_test_result("Mobile Platform Feature Analysis", "FAIL", str(e))

    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("MOBILE CE-HUB PLATFORM TEST REPORT")
        print("="*60)
        print(f"Test Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total Tests: {len(self.test_results)}")

        passed = len([t for t in self.test_results if t['status'] == 'PASS'])
        failed = len([t for t in self.test_results if t['status'] == 'FAIL'])
        warnings = len([t for t in self.test_results if t['status'] == 'WARN'])

        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Warnings: {warnings} ⚠️")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")

        print("\nDetailed Results:")
        print("-"*40)
        for result in self.test_results:
            status_icon = "✅" if result['status'] == 'PASS' else "❌" if result['status'] == 'FAIL' else "⚠️"
            print(f"{status_icon} {result['test']}: {result['status']}")
            if result['details']:
                print(f"   {result['details']}")

        print("\n" + "="*60)
        print("CRITICAL ISSUES IDENTIFIED:")
        print("-"*40)

        critical_issues = [t for t in self.test_results if 'FAIL' in t['status'] and
                          ('API' in t['test'] or 'Claude' in t['test'] or 'Archon' in t['test'])]

        if critical_issues:
            for issue in critical_issues:
                print(f"❌ {issue['test']}: {issue['details']}")
        else:
            print("✅ No critical issues found")

        print("\nRECOMMENDATIONS:")
        print("-"*40)

        if failed > 0:
            print("1. Start missing backend services:")
            print("   - Mobile bridge service")
            print("   - Claude Code bridge")
            print("   - Archon MCP server")

        print("2. Test conversational flow with working backend")
        print("3. Verify file operations and code analysis")
        print("4. Test agent orchestration capabilities")
        print("5. Validate mobile responsiveness and UX")

    def run_all_tests(self):
        """Run all platform tests"""
        print("🚀 Starting Mobile CE-Hub Platform Testing...")
        print("="*60)

        self.test_mobile_interface_accessibility()
        self.test_file_server_connectivity()
        self.test_api_endpoints()
        self.test_archon_mcp_connectivity()
        self.test_local_services()
        self.test_file_structure_analysis()

        self.generate_test_report()

if __name__ == "__main__":
    tester = MobilePlatformTester()
    tester.run_all_tests()