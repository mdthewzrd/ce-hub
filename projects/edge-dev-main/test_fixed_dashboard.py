#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime

def test_fixed_dashboard():
    """Test that the main dashboard now properly finds and executes the Enhanced Backside B Scanner"""

    print("🔧 Testing Fixed Dashboard Scan Execution")
    print("=" * 50)

    # Step 1: Get frontend projects
    print("1. Getting frontend projects...")
    try:
        frontend_response = requests.get("http://localhost:5656/api/projects")
        if frontend_response.status_code == 200:
            frontend_data = frontend_response.json()
            print(f"✅ Frontend projects API working")
            print(f"   Found {len(frontend_data.get('data', {}).get('data', []))} projects")

            # Find Enhanced Backside B Scanner
            projects = frontend_data.get('data', {}).get('data', [])
            enhanced_project = None
            for project in projects:
                if project.get('name') == 'Enhanced Backside B Scanner' or 'Backside B' in project.get('name', ''):
                    enhanced_project = project
                    break

            if enhanced_project:
                print(f"✅ Found target project: {enhanced_project['name']}")
                print(f"   Project ID: {enhanced_project['id']}")
                print(f"   Has code: {'✅' if enhanced_project.get('code') else '❌'}")
                print(f"   Code length: {len(enhanced_project.get('code', ''))} characters")
            else:
                print("❌ No Enhanced Backside B Scanner found")
                return False
        else:
            print(f"❌ Frontend API failed: {frontend_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting frontend projects: {e}")
        return False

    # Step 2: Test project execution directly
    if enhanced_project:
        print(f"\n2. Testing project execution...")

        execute_payload = {
            "scanner_code": enhanced_project['code'],
            "start_date": "2025-01-01",
            "end_date": "2025-11-01",
            "parallel_execution": True,
            "timeout_seconds": 300
        }

        try:
            execute_response = requests.post(
                f"http://localhost:5656/api/projects/{enhanced_project['id']}/execute",
                headers={'Content-Type': 'application/json'},
                json=execute_payload,
                timeout=60
            )

            print(f"   Status: {execute_response.status_code}")
            print(f"   Response headers: {dict(execute_response.headers)}")

            if execute_response.status_code == 200:
                result = execute_response.json()
                print(f"✅ Execution successful!")
                print(f"   Success: {result.get('success', False)}")
                print(f"   Execution ID: {result.get('execution_id', 'N/A')}")
                print(f"   Results count: {len(result.get('results', []))}")

                if result.get('results'):
                    print(f"   First 3 results:")
                    for i, res in enumerate(result['results'][:3]):
                        print(f"     {i+1}. {res.get('ticker', 'N/A')} - {res.get('date', 'N/A')} - Gap: {res.get('gap_percent', 0)}%")

                return True
            else:
                print(f"❌ Execution failed with status {execute_response.status_code}")
                try:
                    error_data = execute_response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {execute_response.text}")
                return False

        except Exception as e:
            print(f"❌ Error executing project: {e}")
            return False

    return False

def test_browser_execution():
    """Test the actual browser workflow"""
    print(f"\n3. Testing browser workflow...")

    from playwright.sync_api import sync_playwright

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, slow_mo=1000)
            context = browser.new_context(viewport={'width': 1920, 'height': 1080})
            page = context.new_page()

            # Navigate to dashboard
            print("   Navigating to dashboard...")
            page.goto("http://localhost:5656", wait_until='networkidle')
            page.wait_for_timeout(3000)

            # Look for Run Scan button
            run_scan_button = page.locator('text="Run Scan"').first
            if run_scan_button.is_visible():
                print("   ✅ Run Scan button found")

                # Click it
                print("   Clicking Run Scan button...")
                run_scan_button.click()

                # Wait for results
                print("   Waiting for scan to complete...")
                page.wait_for_timeout(10000)  # 10 seconds

                # Check for results
                results_text = page.text_content()
                if "Total Results:" in results_text and "Total Results: 0" not in results_text:
                    print("   ✅ Scan results appear to be displayed!")

                    # Take screenshot
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    screenshot_path = f"fixed_dashboard_success_{timestamp}.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"   📸 Screenshot saved: {screenshot_path}")

                    return True
                else:
                    print("   ❌ No scan results found in dashboard")

                    # Take screenshot for debugging
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    screenshot_path = f"fixed_dashboard_debug_{timestamp}.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"   📸 Debug screenshot saved: {screenshot_path}")

                    return False
            else:
                print("   ❌ Run Scan button not found")
                return False

            browser.close()

    except Exception as e:
        print(f"   ❌ Browser test error: {e}")
        return False

if __name__ == "__main__":
    # Test the API fix
    api_success = test_fixed_dashboard()

    if api_success:
        print(f"\n🎯 API test passed! Testing browser workflow...")
        browser_success = test_browser_execution()

        if browser_success:
            print(f"\n🎉 SUCCESS: Dashboard scan execution is now working!")
            print(f"   ✅ API endpoint working correctly")
            print(f"   ✅ Frontend displaying results properly")
            print(f"   ✅ End-to-end workflow functional")
        else:
            print(f"\n⚠️  API working but browser test failed")
    else:
        print(f"\n❌ API test failed - fix not successful")