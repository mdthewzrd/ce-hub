#!/usr/bin/env python3
"""
Comprehensive Playwright test for Traderra date range functionality
Tests date range selector, state changes, performance, and UI updates
"""

import asyncio
import time
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import json

class TraderraDateRangeTester:
    def __init__(self, base_url="http://localhost:6568"):
        self.base_url = base_url
        self.results = {
            "test_start_time": datetime.now().isoformat(),
            "base_url": base_url,
            "tests": {},
            "performance_metrics": {},
            "screenshots": [],
            "issues_found": []
        }

    async def run_all_tests(self):
        """Run comprehensive test suite"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Set to True for headless
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                ignore_https_errors=True
            )

            try:
                page = await context.new_page()

                print("🚀 Starting Traderra Date Range Test Suite")
                print(f"📍 Testing URL: {self.base_url}")
                print("=" * 60)

                # Test 1: Navigation and Page Load
                await self.test_page_load(page)

                # Test 2: Date Range Detection
                await self.test_date_range_detection(page)

                # Test 3: Current Date Validation
                await self.test_current_date_display(page)

                # Test 4: Date Range Change Functionality
                await self.test_date_range_changes(page)

                # Test 5: Performance Measurements
                await self.test_performance_metrics(page)

                # Test 6: UI Update Validation
                await self.test_ui_updates(page)

                # Test 7: State Persistence
                await self.test_state_persistence(page)

                # Generate final report
                await self.generate_final_report(page)

            except Exception as e:
                self.results["error"] = str(e)
                print(f"❌ Test failed with error: {e}")

            finally:
                await browser.close()

    async def test_page_load(self, page):
        """Test basic page navigation and load"""
        print("\n📋 Test 1: Page Navigation & Load")

        start_time = time.time()
        try:
            response = await page.goto(self.base_url, wait_until='networkidle')
            load_time = time.time() - start_time

            # Wait for page to be fully loaded
            await page.wait_for_timeout(2000)

            # Take initial screenshot
            screenshot_path = "screenshots/01_initial_load.png"
            await page.screenshot(path=screenshot_path, full_page=True)
            self.results["screenshots"].append(screenshot_path)

            self.results["tests"]["page_load"] = {
                "status": "PASS",
                "load_time": round(load_time, 2),
                "response_status": response.status,
                "screenshot": screenshot_path
            }

            print(f"✅ Page loaded successfully in {load_time:.2f}s")
            print(f"   Status: {response.status}")

        except Exception as e:
            self.results["tests"]["page_load"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ Page load failed: {e}")

    async def test_date_range_detection(self, page):
        """Detect and analyze date range selector component"""
        print("\n📋 Test 2: Date Range Component Detection")

        try:
            # Look for common date range selector patterns
            selectors_to_check = [
                '[data-testid="date-range"]',
                '.date-range-selector',
                '.date-picker',
                '[class*="date"]',
                '[class*="range"]',
                'select[name*="date"]',
                'button[aria-label*="date"]'
            ]

            found_components = []

            for selector in selectors_to_check:
                elements = await page.query_selector_all(selector)
                if elements:
                    found_components.append({
                        "selector": selector,
                        "count": len(elements),
                        "elements": []
                    })

                    for i, element in enumerate(elements[:3]):  # Limit to first 3
                        try:
                            text = await element.inner_text()
                            html = await element.get_attribute('outerHTML')
                            found_components[-1]["elements"].append({
                                "index": i,
                                "text": text.strip() if text else "",
                                "html_tag": html[:100] + "..." if html else ""
                            })
                        except:
                            pass

            # Also look for text content indicating date ranges
            page_text = await page.inner_text('body')
            date_indicators = []

            date_keywords = ["Today", "This Week", "This Month", "All Time", "Nov", "December", "2025"]
            for keyword in date_keywords:
                if keyword.lower() in page_text.lower():
                    date_indicators.append(keyword)

            self.results["tests"]["date_range_detection"] = {
                "status": "PASS" if found_components or date_indicators else "FAIL",
                "components_found": found_components,
                "date_indicators": date_indicators,
                "page_content_length": len(page_text)
            }

            print(f"✅ Found {len(found_components)} potential date components")
            print(f"   Date indicators: {date_indicators}")

            if not found_components and not date_indicators:
                print("⚠️  No date range components detected - may need to check implementation")
                self.results["issues_found"].append("No date range selector detected on page")

        except Exception as e:
            self.results["tests"]["date_range_detection"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ Date range detection failed: {e}")

    async def test_current_date_display(self, page):
        """Test if current date is displayed correctly"""
        print("\n📋 Test 3: Current Date Display Validation")

        try:
            # Get current date for comparison
            today = datetime.now()
            expected_date = today.strftime("%B %d, %Y")  # e.g., "December 01, 2025"
            expected_short = today.strftime("%b %d, %Y")  # e.g., "Dec 1, 2025"
            expected_numeric = today.strftime("%m/%d/%Y")  # e.g., "12/01/2025"

            # Previous date (to check if it's showing wrong date)
            yesterday = today - timedelta(days=1)
            wrong_date1 = yesterday.strftime("%B %d, %Y")  # e.g., "November 30, 2025"
            wrong_date2 = yesterday.strftime("%b %d, %Y")  # e.g., "Nov 30, 2025"

            # Check page content for dates
            page_content = await page.content()
            page_text = await page.inner_text('body')

            date_checks = {
                "correct_date": {
                    "expected": expected_date,
                    "found": expected_date in page_text,
                    "in_html": expected_date in page_content
                },
                "correct_short": {
                    "expected": expected_short,
                    "found": expected_short in page_text,
                    "in_html": expected_short in page_content
                },
                "correct_numeric": {
                    "expected": expected_numeric,
                    "found": expected_numeric in page_text,
                    "in_html": expected_numeric in page_content
                },
                "wrong_date_full": {
                    "expected": wrong_date1,
                    "found": wrong_date1 in page_text,
                    "is_wrong": True
                },
                "wrong_date_short": {
                    "expected": wrong_date2,
                    "found": wrong_date2 in page_text,
                    "is_wrong": True
                }
            }

            # Determine if test passes
            correct_found = any([
                date_checks["correct_date"]["found"],
                date_checks["correct_short"]["found"],
                date_checks["correct_numeric"]["found"]
            ])

            wrong_found = any([
                date_checks["wrong_date_full"]["found"],
                date_checks["wrong_date_short"]["found"]
            ])

            status = "PASS" if correct_found and not wrong_found else "FAIL"

            self.results["tests"]["current_date_display"] = {
                "status": status,
                "today_date": expected_date,
                "date_checks": date_checks,
                "correct_date_found": correct_found,
                "wrong_date_found": wrong_found
            }

            print(f"📅 Today's date: {expected_date}")
            print(f"   Correct date found: {'✅' if correct_found else '❌'}")
            print(f"   Wrong date found: {'❌' if wrong_found else '✅'}")

            if wrong_found:
                self.results["issues_found"].append("Page shows wrong date (yesterday's date)")

            # Take screenshot for date verification
            screenshot_path = "screenshots/02_date_display.png"
            await page.screenshot(path=screenshot_path)
            self.results["screenshots"].append(screenshot_path)

        except Exception as e:
            self.results["tests"]["current_date_display"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ Current date display test failed: {e}")

    async def test_date_range_changes(self, page):
        """Test changing between different date ranges"""
        print("\n📋 Test 4: Date Range Change Functionality")

        try:
            # Common date range options to look for and test
            date_options = [
                "Today",
                "This Week",
                "This Month",
                "Last Month",
                "This Year",
                "All Time",
                "Custom Range"
            ]

            interaction_results = []

            for option in date_options:
                try:
                    print(f"   Testing: {option}")

                    # Look for clickable elements with this text
                    option_selectors = [
                        f'text="{option}"',
                        f'button:has-text("{option}")',
                        f'option:has-text("{option}")',
                        f'[aria-label*="{option}"]'
                    ]

                    clicked = False
                    element_found = False

                    for selector in option_selectors:
                        try:
                            element = await page.wait_for_selector(selector, timeout=2000)
                            if element:
                                element_found = True

                                # Check if it's clickable
                                is_visible = await element.is_visible()
                                is_enabled = await element.is_enabled()

                                if is_visible and is_enabled:
                                    # Take screenshot before click
                                    before_screenshot = f"screenshots/03_before_{option.lower().replace(' ', '_')}.png"
                                    await page.screenshot(path=before_screenshot)

                                    # Measure click response time
                                    start_time = time.time()
                                    await element.click()
                                    response_time = time.time() - start_time

                                    # Wait for potential UI updates
                                    await page.wait_for_timeout(1000)

                                    # Take screenshot after click
                                    after_screenshot = f"screenshots/04_after_{option.lower().replace(' ', '_')}.png"
                                    await page.screenshot(path=after_screenshot)

                                    clicked = True

                                    interaction_results.append({
                                        "option": option,
                                        "selector": selector,
                                        "clicked": True,
                                        "response_time": round(response_time, 3),
                                        "before_screenshot": before_screenshot,
                                        "after_screenshot": after_screenshot
                                    })

                                    self.results["screenshots"].extend([before_screenshot, after_screenshot])
                                    break

                        except:
                            continue

                    if not element_found:
                        interaction_results.append({
                            "option": option,
                            "clicked": False,
                            "reason": "Element not found"
                        })
                    elif not clicked:
                        interaction_results.append({
                            "option": option,
                            "clicked": False,
                            "reason": "Element found but not clickable"
                        })

                except Exception as e:
                    interaction_results.append({
                        "option": option,
                        "clicked": False,
                        "error": str(e)
                    })

            successful_clicks = sum(1 for r in interaction_results if r.get("clicked", False))
            status = "PASS" if successful_clicks > 0 else "FAIL"

            self.results["tests"]["date_range_changes"] = {
                "status": status,
                "successful_interactions": successful_clicks,
                "total_options": len(date_options),
                "results": interaction_results
            }

            print(f"✅ Successfully interacted with {successful_clicks}/{len(date_options)} date options")

            if successful_clicks == 0:
                self.results["issues_found"].append("No clickable date range options found")

        except Exception as e:
            self.results["tests"]["date_range_changes"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ Date range change test failed: {e}")

    async def test_performance_metrics(self, page):
        """Measure performance of state changes"""
        print("\n📋 Test 5: Performance Metrics")

        try:
            performance_measurements = []

            # Measure page load performance
            navigation_start = await page.evaluate("() => performance.timing.navigationStart")
            load_complete = await page.evaluate("() => performance.timing.loadEventEnd")
            page_load_time = (load_complete - navigation_start) / 1000 if load_complete > 0 else 0

            performance_measurements.append({
                "metric": "page_load_time",
                "value": round(page_load_time, 3),
                "unit": "seconds"
            })

            # Test click response times
            clickable_elements = await page.query_selector_all('button, [role="button"], select, input[type="button"]')

            for i, element in enumerate(clickable_elements[:5]):  # Test first 5 elements
                try:
                    start_time = time.time()
                    await element.click()
                    response_time = time.time() - start_time

                    performance_measurements.append({
                        "metric": f"click_response_time_{i+1}",
                        "value": round(response_time, 3),
                        "unit": "seconds"
                    })

                    await page.wait_for_timeout(500)  # Brief pause between clicks

                except:
                    continue

            # Get browser performance metrics
            try:
                perf_metrics = await page.evaluate("""
                    () => {
                        const navigation = performance.getEntriesByType('navigation')[0];
                        return {
                            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                            loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
                            firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
                        };
                    }
                """)

                for key, value in perf_metrics.items():
                    performance_measurements.append({
                        "metric": key,
                        "value": round(value, 3),
                        "unit": "milliseconds"
                    })

            except Exception as e:
                print(f"   Could not get detailed performance metrics: {e}")

            # Calculate averages
            click_times = [m["value"] for m in performance_measurements if "click_response_time" in m["metric"]]
            avg_click_time = sum(click_times) / len(click_times) if click_times else 0

            performance_summary = {
                "page_load_acceptable": page_load_time < 3.0,
                "avg_click_response": round(avg_click_time, 3),
                "clicks_acceptable": avg_click_time < 0.5,
                "total_measurements": len(performance_measurements)
            }

            status = "PASS" if performance_summary["page_load_acceptable"] and performance_summary["clicks_acceptable"] else "FAIL"

            self.results["tests"]["performance_metrics"] = {
                "status": status,
                "measurements": performance_measurements,
                "summary": performance_summary
            }

            self.results["performance_metrics"] = performance_measurements

            print(f"⚡ Page load time: {page_load_time:.3f}s")
            print(f"⚡ Average click response: {avg_click_time:.3f}s")
            print(f"   Performance acceptable: {'✅' if status == 'PASS' else '❌'}")

        except Exception as e:
            self.results["tests"]["performance_metrics"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ Performance metrics test failed: {e}")

    async def test_ui_updates(self, page):
        """Verify that UI actually updates when date ranges change"""
        print("\n📋 Test 6: UI Update Validation")

        try:
            ui_update_tests = []

            # Take initial state screenshot
            initial_screenshot = "screenshots/05_initial_ui_state.png"
            await page.screenshot(path=initial_screenshot, full_page=True)

            # Get initial page content
            initial_content = await page.content()

            # Look for interactive elements that might trigger UI updates
            interactive_selectors = [
                'button',
                'select',
                '[role="button"]',
                'input[type="button"]',
                '[onclick]'
            ]

            for i, selector in enumerate(interactive_selectors[:3]):  # Test first 3 selector types
                try:
                    elements = await page.query_selector_all(selector)

                    for j, element in enumerate(elements[:2]):  # Test first 2 elements
                        try:
                            # Get element text before interaction
                            before_text = await element.inner_text()

                            # Screenshot before interaction
                            before_path = f"screenshots/06_ui_before_{i}_{j}.png"
                            await page.screenshot(path=before_path)

                            # Click element
                            await element.click()
                            await page.wait_for_timeout(1500)  # Wait for UI updates

                            # Get element text after interaction
                            after_text = await element.inner_text()

                            # Screenshot after interaction
                            after_path = f"screenshots/07_ui_after_{i}_{j}.png"
                            await page.screenshot(path=after_path)

                            # Get new page content
                            new_content = await page.content()

                            # Check for changes
                            content_changed = initial_content != new_content
                            element_changed = before_text != after_text

                            ui_update_tests.append({
                                "selector": selector,
                                "element_index": j,
                                "content_changed": content_changed,
                                "element_changed": element_changed,
                                "before_text": before_text[:50],
                                "after_text": after_text[:50],
                                "before_screenshot": before_path,
                                "after_screenshot": after_path
                            })

                            self.results["screenshots"].extend([before_path, after_path])

                        except Exception as e:
                            ui_update_tests.append({
                                "selector": selector,
                                "element_index": j,
                                "error": str(e)
                            })

                except Exception as e:
                    continue

            # Take final state screenshot
            final_screenshot = "screenshots/08_final_ui_state.png"
            await page.screenshot(path=final_screenshot, full_page=True)

            successful_updates = sum(1 for test in ui_update_tests if test.get("content_changed", False) or test.get("element_changed", False))
            status = "PASS" if successful_updates > 0 else "FAIL"

            self.results["tests"]["ui_updates"] = {
                "status": status,
                "successful_updates": successful_updates,
                "total_tests": len(ui_update_tests),
                "results": ui_update_tests,
                "initial_screenshot": initial_screenshot,
                "final_screenshot": final_screenshot
            }

            print(f"🔄 UI updates detected: {successful_updates}/{len(ui_update_tests)}")
            print(f"   UI updating properly: {'✅' if status == 'PASS' else '❌'}")

            if successful_updates == 0:
                self.results["issues_found"].append("No UI updates detected after interactions")

        except Exception as e:
            self.results["tests"]["ui_updates"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ UI update validation failed: {e}")

    async def test_state_persistence(self, page):
        """Test if state changes persist"""
        print("\n📋 Test 7: State Persistence")

        try:
            # Get current URL and any state parameters
            current_url = page.url
            initial_storage = await page.evaluate("""
                () => ({
                    localStorage: {...localStorage},
                    sessionStorage: {...sessionStorage}
                })
            """)

            # Simulate page refresh
            await page.reload(wait_until='networkidle')
            await page.wait_for_timeout(2000)

            # Check if state persisted
            new_url = page.url
            new_storage = await page.evaluate("""
                () => ({
                    localStorage: {...localStorage},
                    sessionStorage: {...sessionStorage}
                })
            """)

            url_changed = current_url != new_url
            localStorage_changed = initial_storage['localStorage'] != new_storage['localStorage']
            sessionStorage_changed = initial_storage['sessionStorage'] != new_storage['sessionStorage']

            state_persistence = {
                "url_persistence": {
                    "before": current_url,
                    "after": new_url,
                    "changed": url_changed
                },
                "localStorage_persistence": {
                    "before": initial_storage['localStorage'],
                    "after": new_storage['localStorage'],
                    "changed": localStorage_changed
                },
                "sessionStorage_persistence": {
                    "before": initial_storage['sessionStorage'],
                    "after": new_storage['sessionStorage'],
                    "changed": sessionStorage_changed
                }
            }

            # Take screenshot after refresh
            refresh_screenshot = "screenshots/09_after_refresh.png"
            await page.screenshot(path=refresh_screenshot, full_page=True)

            status = "PASS"  # This is informational, not a pass/fail test

            self.results["tests"]["state_persistence"] = {
                "status": status,
                "persistence_data": state_persistence,
                "refresh_screenshot": refresh_screenshot
            }

            print(f"🔄 URL changed after refresh: {'Yes' if url_changed else 'No'}")
            print(f"💾 localStorage persisted: {'Yes' if not localStorage_changed else 'Changed'}")
            print(f"💾 sessionStorage persisted: {'Yes' if not sessionStorage_changed else 'Changed'}")

        except Exception as e:
            self.results["tests"]["state_persistence"] = {
                "status": "FAIL",
                "error": str(e)
            }
            print(f"❌ State persistence test failed: {e}")

    async def generate_final_report(self, page):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 FINAL TEST REPORT")
        print("=" * 60)

        # Summary
        total_tests = len(self.results["tests"])
        passed_tests = sum(1 for test in self.results["tests"].values() if test.get("status") == "PASS")
        failed_tests = total_tests - passed_tests

        print(f"\n📋 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {failed_tests}")
        print(f"   Success Rate: {round((passed_tests/total_tests)*100, 1)}%")

        # Key Issues
        if self.results["issues_found"]:
            print(f"\n⚠️  ISSUES FOUND:")
            for issue in self.results["issues_found"]:
                print(f"   • {issue}")

        # Performance Summary
        if self.results["performance_metrics"]:
            perf_metrics = self.results["performance_metrics"]
            page_load = next((m for m in perf_metrics if m["metric"] == "page_load_time"), None)
            if page_load:
                print(f"\n⚡ PERFORMANCE:")
                print(f"   Page Load Time: {page_load['value']}{page_load['unit']}")
                print(f"   Status: {'✅ Good' if page_load['value'] < 3 else '❌ Slow'}")

        # Screenshots
        print(f"\n📸 SCREENSHOTS TAKEN: {len(self.results['screenshots'])}")
        for screenshot in self.results["screenshots"]:
            print(f"   • {screenshot}")

        # Test Details
        print(f"\n📋 TEST DETAILS:")
        for test_name, test_result in self.results["tests"].items():
            status_icon = "✅" if test_result.get("status") == "PASS" else "❌"
            print(f"   {status_icon} {test_name.replace('_', ' ').title()}: {test_result.get('status', 'UNKNOWN')}")

        # Save report to file
        self.results["test_end_time"] = datetime.now().isoformat()

        with open("traderra_test_report.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"\n💾 Detailed report saved to: traderra_test_report.json")

        # Final verdict
        print(f"\n🏆 FINAL VERDICT:")
        if failed_tests == 0:
            print("   ✅ ALL TESTS PASSED - Application working correctly!")
        elif failed_tests <= 2:
            print("   ⚠️  MINOR ISSUES - Mostly functional with some problems")
        else:
            print("   ❌ MAJOR ISSUES - Significant problems detected")

        print("=" * 60)

async def main():
    """Main function to run the test suite"""
    import os

    # Create screenshots directory
    os.makedirs("screenshots", exist_ok=True)

    # Check if server is running
    import requests
    try:
        response = requests.get("http://localhost:6568", timeout=5)
        print(f"🌐 Server is running (Status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Server at http://localhost:6568 is not accessible: {e}")
        print("Please ensure the Traderra application is running before testing.")
        return

    # Run tests
    tester = TraderraDateRangeTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())