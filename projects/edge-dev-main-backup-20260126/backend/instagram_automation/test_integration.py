#!/usr/bin/env python3
"""
Integration Test Suite for Instagram Automation Platform
Tests all API endpoints and validates the complete workflow
"""

import requests
import json
from typing import Dict, List, Tuple
from datetime import datetime

API_BASE = "http://localhost:4400"
UI_BASE = "http://localhost:8181"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(title: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title.center(60)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_test(name: str, status: bool, details: str = ""):
    symbol = f"{Colors.GREEN}✓{Colors.RESET}" if status else f"{Colors.RED}✗{Colors.RESET}"
    print(f"  {symbol} {Colors.BOLD}{name}{Colors.RESET}")
    if details:
        print(f"    {details}")

def test_endpoint(method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Tuple[bool, any]:
    """Test an API endpoint"""
    url = f"{API_BASE}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data, timeout=5)
        else:
            return False, "Invalid method"

        return response.status_code < 400, response.json()
    except Exception as e:
        return False, str(e)

def run_tests():
    """Run all integration tests"""
    print_header("INSTAGRAM AUTOMATION PLATFORM - INTEGRATION TEST")

    results = {"passed": 0, "failed": 0, "tests": []}

    # Test 1: API Server Health
    print(f"{Colors.BOLD}1. API SERVER HEALTH{Colors.RESET}")
    success, _ = test_endpoint("GET", "/api/database/tables")
    results["tests"].append(("API Health Check", success))
    if success:
        results["passed"] += 1
        print_test("API Server", True, f"Running at {API_BASE}")
    else:
        results["failed"] += 1
        print_test("API Server", False, "Server not reachable")

    # Test 2: Database Endpoints
    print(f"\n{Colors.BOLD}2. DATABASE ENDPOINTS{Colors.RESET}")
    success, data = test_endpoint("GET", "/api/database/tables")
    results["tests"].append(("List Database Tables", success))
    if success:
        results["passed"] += 1
        table_count = len(data.get("tables", []))
        print_test("List Tables", True, f"Found {table_count} tables")
    else:
        results["failed"] += 1
        print_test("List Tables", False, str(data))

    success, data = test_endpoint("GET", "/api/database/table/source_content")
    results["tests"].append(("View Table Data", success))
    if success:
        results["passed"] += 1
        row_count = len(data.get("rows", []))
        print_test("View source_content", True, f"Found {row_count} rows")
    else:
        results["failed"] += 1
        print_test("View source_content", False, str(data))

    # Test 3: Source Content Endpoints
    print(f"\n{Colors.BOLD}3. SOURCE CONTENT ENDPOINTS{Colors.RESET}")
    success, data = test_endpoint("GET", "/api/source", params={"status": "pending"})
    results["tests"].append(("List Pending Content", success))
    if success:
        results["passed"] += 1
        count = data.get("count", 0)
        print_test("List Pending Source", True, f"Found {count} items")
    else:
        results["failed"] += 1
        print_test("List Pending Source", False, str(data))

    success, data = test_endpoint("GET", "/api/source")
    results["tests"].append(("List All Content", success))
    if success:
        results["passed"] += 1
        count = data.get("count", 0)
        print_test("List All Source", True, f"Found {count} items")
    else:
        results["failed"] += 1
        print_test("List All Source", False, str(data))

    # Test 4: Library/Ready Content Endpoints
    print(f"\n{Colors.BOLD}4. LIBRARY / READY CONTENT ENDPOINTS{Colors.RESET}")
    success, data = test_endpoint("GET", "/api/library")
    results["tests"].append(("List Ready Content", success))
    if success:
        results["passed"] += 1
        count = data.get("count", 0)
        print_test("List Library", True, f"Found {count} items")
    else:
        results["failed"] += 1
        print_test("List Library", False, str(data))

    # Test 5: Scraper Endpoints
    print(f"\n{Colors.BOLD}5. SCRAPER ENDPOINTS{Colors.RESET}")
    success, data = test_endpoint("GET", "/api/scraper/status")
    results["tests"].append(("Scraper Status", success))
    if success:
        results["passed"] += 1
        active = data.get("active_targets", 0)
        total = data.get("total_scraped", 0)
        print_test("Scraper Status", True, f"Active: {active}, Total: {total}")
    else:
        results["failed"] += 1
        print_test("Scraper Status", False, str(data))

    success, data = test_endpoint("GET", "/api/scraper/targets")
    results["tests"].append(("List Scraper Targets", success))
    if success:
        results["passed"] += 1
        count = data.get("count", 0)
        print_test("List Targets", True, f"Found {count} targets")
    else:
        results["failed"] += 1
        print_test("List Targets", False, str(data))

    success, data = test_endpoint("GET", "/api/scraper/runs")
    results["tests"].append(("List Scraper Runs", success))
    if success:
        results["passed"] += 1
        print_test("List Runs", True, "Scraper runs history")
    else:
        results["failed"] += 1
        print_test("List Runs", False, str(data))

    # Test 6: Notification Endpoints
    print(f"\n{Colors.BOLD}6. NOTIFICATION ENDPOINTS{Colors.RESET}")
    success, data = test_endpoint("GET", "/api/notifications/stats")
    results["tests"].append(("Notification Stats", success))
    if success:
        results["passed"] += 1
        total = data.get("total", 0)
        unread = data.get("unread", 0)
        print_test("Notification Stats", True, f"Total: {total}, Unread: {unread}")
    else:
        results["failed"] += 1
        print_test("Notification Stats", False, str(data))

    success, data = test_endpoint("GET", "/api/notifications")
    results["tests"].append(("List Notifications", success))
    if success:
        results["passed"] += 1
        count = data.get("count", 0)
        print_test("List Notifications", True, f"Found {count} notifications")
    else:
        results["failed"] += 1
        print_test("List Notifications", False, str(data))

    # Test 7: Stats Endpoints
    print(f"\n{Colors.BOLD}7. STATISTICS ENDPOINTS{Colors.RESET}")
    success, data = test_endpoint("GET", "/api/stats")
    results["tests"].append(("System Stats", success))
    if success:
        results["passed"] += 1
        print_test("System Stats", True, "Statistics retrieved")
    else:
        results["failed"] += 1
        print_test("System Stats", False, str(data))

    success, data = test_endpoint("GET", "/api/stats/ready-content")
    results["tests"].append(("Ready Content Stats", success))
    if success:
        results["passed"] += 1
        print_test("Ready Content Stats", True, "Content statistics retrieved")
    else:
        results["failed"] += 1
        print_test("Ready Content Stats", False, str(data))

    # Test 8: UI Server
    print(f"\n{Colors.BOLD}8. UI SERVER{Colors.RESET}")
    try:
        response = requests.get(UI_BASE, timeout=5)
        success = response.status_code == 200 and "Instagram Automation Platform" in response.text
        results["tests"].append(("UI Access", success))
        if success:
            results["passed"] += 1
            print_test("UI Server", True, f"Running at {UI_BASE}")
        else:
            results["failed"] += 1
            print_test("UI Server", False, "UI not responding correctly")
    except Exception as e:
        results["failed"] += 1
        results["tests"].append(("UI Access", False))
        print_test("UI Server", False, str(e))

    # Summary
    print_header("TEST SUMMARY")
    total = results["passed"] + results["failed"]
    passed_pct = (results["passed"] / total * 100) if total > 0 else 0

    print(f"{Colors.BOLD}Total Tests:{Colors.RESET} {total}")
    print(f"{Colors.GREEN}{Colors.BOLD}Passed:{Colors.RESET} {results['passed']}")
    print(f"{Colors.RED}{Colors.BOLD}Failed:{Colors.RESET} {results['failed']}")
    print(f"\n{Colors.BOLD}Success Rate:{Colors.RESET} {passed_pct:.1f}%")

    if results["failed"] > 0:
        print(f"\n{Colors.YELLOW}Failed Tests:{Colors.RESET}")
        for name, success in results["tests"]:
            if not success:
                print(f"  {Colors.RED}✗{Colors.RESET} {name}")

    print(f"\n{Colors.BOLD}API Base URL:{Colors.RESET} {API_BASE}")
    print(f"{Colors.BOLD}UI Base URL:{Colors.RESET} {UI_BASE}")
    print(f"{Colors.BOLD}Test Time:{Colors.RESET} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
    if results["failed"] == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}ALL TESTS PASSED!{Colors.RESET}".center(60))
    else:
        print(f"{Colors.YELLOW}SOME TESTS FAILED{Colors.RESET}".center(60))
    print(f"{Colors.GREEN}{'='*60}{Colors.RESET}\n")

    return results

if __name__ == "__main__":
    run_tests()
