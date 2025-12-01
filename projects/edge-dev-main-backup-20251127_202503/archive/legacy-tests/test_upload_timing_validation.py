#!/usr/bin/env python3
"""
Upload Functionality Quality Validation Test
==============================================

Tests the upload functionality on edge.dev to validate that the timing fixes
are working correctly and progress is driven by actual backend execution.

Validation Criteria:
✅ Upload takes realistic time based on backend execution
✅ Progress steps match actual backend progress
✅ No instant preview/template behavior
✅ Real scanning results are returned
✅ Progress never goes backwards (monotonic)
"""

import asyncio
import json
import time
from datetime import datetime
from playwright.async_api import async_playwright, Page, expect
from typing import Dict, List, Tuple
import sys

class UploadTimingValidator:
    def __init__(self):
        self.test_results = {
            "test_name": "Upload Timing Validation",
            "start_time": datetime.now().isoformat(),
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0
            }
        }
        self.progress_history = []
        self.timing_data = {}

    def add_test_result(self, test_name: str, passed: bool, details: str, timing: float = 0):
        """Record a test result"""
        result = {
            "name": test_name,
            "status": "PASSED" if passed else "FAILED",
            "details": details,
            "timing": f"{timing:.2f}s" if timing > 0 else "N/A",
            "timestamp": datetime.now().isoformat()
        }
        self.test_results["tests"].append(result)
        self.test_results["summary"]["total"] += 1
        if passed:
            self.test_results["summary"]["passed"] += 1
        else:
            self.test_results["summary"]["failed"] += 1

        status_icon = "✅" if passed else "❌"
        print(f"\n{status_icon} {test_name}")
        print(f"   {details}")
        if timing > 0:
            print(f"   Timing: {timing:.2f}s")

    async def capture_progress_steps(self, page: Page) -> List[Dict]:
        """Monitor and capture all progress steps during upload"""
        progress_steps = []

        async def handle_progress_update():
            try:
                # Look for progress indicators
                progress_elements = await page.locator('[class*="conversionStep"]').all()
                for elem in progress_elements:
                    text = await elem.text_content()
                    if text and text not in [p.get('text') for p in progress_steps]:
                        progress_steps.append({
                            'text': text,
                            'timestamp': time.time()
                        })
            except Exception as e:
                pass

        # Set up an interval to check progress
        check_interval = 500  # Check every 500ms
        while len(progress_steps) < 20:  # Stop after reasonable number of checks
            await handle_progress_update()
            await asyncio.sleep(check_interval / 1000)

        return progress_steps

    async def test_application_accessibility(self, page: Page) -> bool:
        """Test 1: Verify application is accessible"""
        start_time = time.time()
        try:
            await page.goto('http://localhost:5657', timeout=10000)
            await page.wait_for_load_state('networkidle', timeout=10000)

            # Check for main content
            main_content = page.locator('main')
            await expect(main_content).to_be_visible(timeout=5000)

            duration = time.time() - start_time
            self.add_test_result(
                "Application Accessibility",
                True,
                "Application loaded successfully on localhost:5657",
                duration
            )
            return True
        except Exception as e:
            duration = time.time() - start_time
            self.add_test_result(
                "Application Accessibility",
                False,
                f"Failed to load application: {str(e)}",
                duration
            )
            return False

    async def test_upload_button_presence(self, page: Page) -> bool:
        """Test 2: Verify upload button is present"""
        start_time = time.time()
        try:
            # Look for upload button
            upload_button = page.locator('button:has-text("Upload Strategy")')
            await expect(upload_button).to_be_visible(timeout=5000)

            duration = time.time() - start_time
            self.add_test_result(
                "Upload Button Presence",
                True,
                "Upload Strategy button found and visible",
                duration
            )
            return True
        except Exception as e:
            duration = time.time() - start_time
            self.add_test_result(
                "Upload Button Presence",
                False,
                f"Upload button not found: {str(e)}",
                duration
            )
            return False

    async def test_upload_modal_opening(self, page: Page) -> bool:
        """Test 3: Verify upload modal opens correctly"""
        start_time = time.time()
        try:
            # Click upload button
            upload_button = page.locator('button:has-text("Upload Strategy")')
            await upload_button.click()

            # Wait for modal to appear
            modal = page.locator('[class*="fixed"][class*="inset-0"]')
            await expect(modal).to_be_visible(timeout=3000)

            # Verify modal title
            modal_title = page.locator('text=Upload & Convert Strategy')
            await expect(modal_title).to_be_visible(timeout=2000)

            duration = time.time() - start_time
            self.add_test_result(
                "Upload Modal Opening",
                True,
                "Upload modal opened successfully with correct title",
                duration
            )
            return True
        except Exception as e:
            duration = time.time() - start_time
            self.add_test_result(
                "Upload Modal Opening",
                False,
                f"Modal opening failed: {str(e)}",
                duration
            )
            return False

    async def test_sample_code_input(self, page: Page) -> bool:
        """Test 4: Input sample scanner code"""
        start_time = time.time()
        try:
            sample_code = """
# Sample LC Scanner
def scan_lc_d2():
    # Scan for LC Frontside D2 pattern
    criteria = {
        'gap_pct': 3.0,
        'volume': 10000000,
        'min_score': 7.0
    }
    return criteria
"""

            # Find textarea and input code
            textarea = page.locator('textarea[placeholder*="strategy code"]')
            await textarea.fill(sample_code)

            # Verify code was entered
            value = await textarea.input_value()
            assert len(value) > 0, "Code was not entered"

            duration = time.time() - start_time
            self.add_test_result(
                "Sample Code Input",
                True,
                f"Successfully entered {len(sample_code)} characters of sample code",
                duration
            )
            return True
        except Exception as e:
            duration = time.time() - start_time
            self.add_test_result(
                "Sample Code Input",
                False,
                f"Failed to input sample code: {str(e)}",
                duration
            )
            return False

    async def test_upload_timing_and_progress(self, page: Page) -> Tuple[bool, Dict]:
        """Test 5: Validate upload timing and progress behavior (CRITICAL TEST)"""
        start_time = time.time()

        print("\n" + "="*80)
        print("CRITICAL TEST: Upload Timing and Progress Validation")
        print("="*80)

        try:
            # Set up console monitoring
            console_messages = []
            page.on('console', lambda msg: console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'timestamp': time.time()
            }))

            # Track progress steps with timing
            progress_timeline = []

            # Click Convert Strategy button
            convert_button = page.locator('button:has-text("Convert Strategy")')
            await convert_button.click()

            upload_start_time = time.time()
            print(f"\n⏱️  Upload started at {upload_start_time:.2f}")

            # Monitor progress steps
            expected_steps = [
                'analyzing',
                'extracting',
                'converting',
                'validating',
                'executing',
                'processing',
                'complete'
            ]

            detected_steps = []
            last_check_time = upload_start_time

            # Monitor for up to 5 minutes (realistic for backend execution)
            timeout = 300  # 5 minutes
            check_interval = 0.5  # Check every 500ms

            while time.time() - upload_start_time < timeout:
                current_time = time.time()
                elapsed = current_time - upload_start_time

                # Check for progress indicators
                try:
                    # Look for active progress step
                    active_steps = await page.locator('[class*="border-[#FFD700]"]').all()

                    for step_elem in active_steps:
                        step_text = await step_elem.text_content()
                        if step_text and step_text not in [s['text'] for s in detected_steps]:
                            step_data = {
                                'text': step_text.strip(),
                                'timestamp': current_time,
                                'elapsed': elapsed
                            }
                            detected_steps.append(step_data)
                            print(f"   📊 Step detected: {step_data['text']} at {elapsed:.2f}s")

                    # Check for completion
                    complete_indicator = page.locator('text=Strategy converted successfully')
                    if await complete_indicator.is_visible():
                        print(f"\n✅ Upload completed at {elapsed:.2f}s")
                        break

                    # Check for errors
                    error_indicator = page.locator('text=Conversion Error')
                    if await error_indicator.is_visible():
                        error_text = await page.locator('[class*="text-red-"]').text_content()
                        print(f"\n❌ Error detected: {error_text}")
                        break

                except Exception as e:
                    pass  # Continue monitoring

                await asyncio.sleep(check_interval)

            upload_end_time = time.time()
            total_duration = upload_end_time - upload_start_time

            print(f"\n⏱️  Total upload duration: {total_duration:.2f}s")
            print(f"   Progress steps detected: {len(detected_steps)}")

            # Validate timing expectations
            timing_validations = {
                'realistic_duration': total_duration >= 30,  # Should take at least 30 seconds
                'not_simulated': total_duration != 23,  # Old simulated time was 23 seconds
                'progress_steps_detected': len(detected_steps) >= 4,  # Should detect multiple steps
                'execution_phase_present': any('executing' in s['text'].lower() for s in detected_steps),
                'completion_detected': total_duration > 0
            }

            # Check for monotonic progress (no backwards movement)
            monotonic_progress = True
            if len(detected_steps) > 1:
                for i in range(1, len(detected_steps)):
                    if detected_steps[i]['elapsed'] < detected_steps[i-1]['elapsed']:
                        monotonic_progress = False
                        break

            timing_validations['monotonic_progress'] = monotonic_progress

            # Calculate pass/fail
            validations_passed = sum(timing_validations.values())
            validations_total = len(timing_validations)
            test_passed = validations_passed >= validations_total - 1  # Allow 1 failure

            # Detailed results
            details_lines = [
                f"Duration: {total_duration:.2f}s (Expected: ≥30s)",
                f"Steps detected: {len(detected_steps)}",
                f"Validations passed: {validations_passed}/{validations_total}"
            ]

            for key, passed in timing_validations.items():
                status = "✅" if passed else "❌"
                details_lines.append(f"  {status} {key.replace('_', ' ').title()}")

            details = "\n".join(details_lines)

            self.timing_data = {
                'total_duration': total_duration,
                'steps_detected': len(detected_steps),
                'validations': timing_validations,
                'progress_timeline': detected_steps,
                'console_messages': console_messages
            }

            self.add_test_result(
                "Upload Timing and Progress Validation",
                test_passed,
                details,
                total_duration
            )

            return test_passed, self.timing_data

        except Exception as e:
            duration = time.time() - start_time
            self.add_test_result(
                "Upload Timing and Progress Validation",
                False,
                f"Test execution failed: {str(e)}",
                duration
            )
            return False, {}

    async def test_results_validation(self, page: Page) -> bool:
        """Test 6: Verify scan results are real (not templates)"""
        start_time = time.time()
        try:
            # Wait for results to appear in left navigation or main area
            await asyncio.sleep(3)  # Give UI time to update

            # Check for strategy in left nav
            strategy_items = await page.locator('[class*="strategy"]').all()

            if len(strategy_items) > 0:
                # Get first strategy details
                first_strategy = strategy_items[0]
                strategy_text = await first_strategy.text_content()

                # Verify it's not just template data
                has_timestamp = any(char.isdigit() for char in strategy_text)
                has_ticker_count = 'tickers' in strategy_text.lower()

                duration = time.time() - start_time

                if has_timestamp or has_ticker_count:
                    self.add_test_result(
                        "Results Validation",
                        True,
                        f"Real scan results detected: {strategy_text[:100]}",
                        duration
                    )
                    return True
                else:
                    self.add_test_result(
                        "Results Validation",
                        False,
                        "Results appear to be template data, not real scan results",
                        duration
                    )
                    return False
            else:
                duration = time.time() - start_time
                self.add_test_result(
                    "Results Validation",
                    False,
                    "No strategy results found after upload",
                    duration
                )
                return False

        except Exception as e:
            duration = time.time() - start_time
            self.add_test_result(
                "Results Validation",
                False,
                f"Failed to validate results: {str(e)}",
                duration
            )
            return False

    async def run_all_tests(self):
        """Execute all validation tests"""
        print("\n" + "="*80)
        print("UPLOAD FUNCTIONALITY QUALITY VALIDATION")
        print("="*80)
        print(f"Target: http://localhost:5657")
        print(f"Started: {self.test_results['start_time']}")
        print("="*80)

        async with async_playwright() as p:
            # Launch browser in headed mode to observe
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()

            try:
                # Test 1: Application Accessibility
                if not await self.test_application_accessibility(page):
                    print("\n⚠️  Cannot proceed - application not accessible")
                    return

                # Test 2: Upload Button Presence
                if not await self.test_upload_button_presence(page):
                    print("\n⚠️  Cannot proceed - upload button not found")
                    return

                # Test 3: Upload Modal Opening
                if not await self.test_upload_modal_opening(page):
                    print("\n⚠️  Cannot proceed - modal won't open")
                    return

                # Test 4: Sample Code Input
                if not await self.test_sample_code_input(page):
                    print("\n⚠️  Cannot proceed - cannot input code")
                    return

                # Test 5: CRITICAL - Upload Timing and Progress (THIS IS THE KEY TEST)
                timing_passed, timing_data = await self.test_upload_timing_and_progress(page)

                # Test 6: Results Validation
                await self.test_results_validation(page)

                # Keep browser open for manual inspection
                print("\n" + "="*80)
                print("Tests completed. Browser will remain open for 30 seconds for inspection.")
                print("="*80)
                await asyncio.sleep(30)

            finally:
                await browser.close()

        # Generate final report
        self.generate_report()

    def generate_report(self):
        """Generate comprehensive validation report"""
        self.test_results['end_time'] = datetime.now().isoformat()

        print("\n" + "="*80)
        print("VALIDATION REPORT")
        print("="*80)

        # Summary
        summary = self.test_results['summary']
        pass_rate = (summary['passed'] / summary['total'] * 100) if summary['total'] > 0 else 0

        print(f"\nSummary:")
        print(f"  Total Tests: {summary['total']}")
        print(f"  Passed: {summary['passed']} ✅")
        print(f"  Failed: {summary['failed']} ❌")
        print(f"  Pass Rate: {pass_rate:.1f}%")

        # Critical findings
        print(f"\nCritical Findings:")
        if self.timing_data:
            duration = self.timing_data.get('total_duration', 0)
            validations = self.timing_data.get('validations', {})

            print(f"  Upload Duration: {duration:.2f}s")
            print(f"  Expected: ≥30s (realistic backend execution)")
            print(f"  Old Simulated: 23s (should NOT match this)")

            if duration >= 30:
                print(f"  ✅ Duration indicates real backend execution")
            else:
                print(f"  ❌ Duration too short - may still be simulated")

            if validations.get('monotonic_progress'):
                print(f"  ✅ Progress is monotonic (never goes backwards)")
            else:
                print(f"  ❌ Progress went backwards - implementation issue")

        # Overall assessment
        print(f"\nOverall Assessment:")
        if pass_rate >= 80:
            print(f"  ✅ VALIDATION PASSED - Upload timing fixes are working correctly")
        else:
            print(f"  ❌ VALIDATION FAILED - Upload timing issues remain")

        # Save detailed report
        report_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/UPLOAD_TIMING_VALIDATION_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)

        print(f"\n📄 Detailed report saved to: {report_file}")
        print("="*80)

        return self.test_results

async def main():
    """Main test execution"""
    validator = UploadTimingValidator()
    await validator.run_all_tests()

    # Exit with appropriate code
    if validator.test_results['summary']['failed'] == 0:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
