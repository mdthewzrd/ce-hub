#!/usr/bin/env python3
"""
🔍 COMPREHENSIVE QUALITY VALIDATION TEST
========================================

This test validates the entire scanner splitter → formatter → scanner execution pipeline
using the provided real file: 'lc d2 scan - oct 25 new ideas (2).py'

Test Requirements:
1. Complete Workflow Test with real file
2. Validate Scanner Splitting - Extract individual scanners with proper parameter retention
3. Validate Formatting Process - Ensure split scanners format correctly with configurable parameters
4. Validate Scanner Execution - Test actual scan results for 2025 date range (1/1/25 - now)
5. Performance Validation - Verify multiple results per scanner as expected

Critical Quality Gates:
✅ Parameter preservation: Split scanners should maintain original parameter structure
✅ Code validity: Extracted scanners must be syntactically correct and executable
✅ Formatting success: Interactive formatter should show >0 configurable parameters
✅ Scan execution: Scanners should produce actual trading results for 2025
✅ Data accuracy: Results should contain valid stock data with proper date ranges
"""

import os
import sys
import ast
import json
import asyncio
import traceback
from pathlib import Path
from datetime import datetime, date
from typing import List, Dict, Any

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

class QualityValidationTester:
    """Comprehensive quality validation tester for scanner pipeline"""

    def __init__(self):
        self.test_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"
        self.results = {
            "scanner_splitting": {"passed": False, "details": {}, "errors": []},
            "formatting_process": {"passed": False, "details": {}, "errors": []},
            "scanner_execution": {"passed": False, "details": {}, "errors": []},
            "performance_validation": {"passed": False, "details": {}, "errors": []},
            "overall_quality": {"passed": False, "score": 0}
        }

    async def run_comprehensive_validation(self):
        """Execute complete quality validation workflow"""
        print("🔍 COMPREHENSIVE QUALITY VALIDATION TEST")
        print("=" * 60)
        print(f"📁 Test File: {self.test_file_path}")
        print(f"🕐 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # Load test file
        if not os.path.exists(self.test_file_path):
            print(f"❌ CRITICAL ERROR: Test file not found: {self.test_file_path}")
            return False

        with open(self.test_file_path, 'r') as f:
            full_code = f.read()

        print(f"✅ Loaded test file ({len(full_code)} characters)")

        # Test Phase 1: Scanner Splitting
        await self.test_scanner_splitting(full_code)

        # Test Phase 2: Formatting Process
        await self.test_formatting_process()

        # Test Phase 3: Scanner Execution with 2025 Date Range
        await self.test_scanner_execution_2025()

        # Test Phase 4: Performance Validation
        await self.test_performance_validation()

        # Generate Quality Report
        self.generate_quality_report()

        return self.results["overall_quality"]["passed"]

    async def test_scanner_splitting(self, full_code: str):
        """Test Phase 1: Validate scanner splitter functionality"""
        print("\n🧪 PHASE 1: Scanner Splitting Validation")
        print("-" * 40)

        try:
            # Import the scanner extraction function
            from main import extract_scanner_code
            print("✅ Successfully imported extract_scanner_code function")

            # Test different scanner types from the file
            scanner_tests = [
                {
                    "type": "logical_scanner",
                    "name": "Parabolic Score Scanner",
                    "pattern": "parabolic_score"
                },
                {
                    "type": "logical_scanner",
                    "name": "LC Frontside D2 Extended Scanner",
                    "pattern": "lc_frontside_d2_extended"
                },
                {
                    "type": "logical_scanner",
                    "name": "LC Frontside D3 Extended Scanner",
                    "pattern": "lc_frontside_d3_extended_1"
                }
            ]

            successful_extractions = 0
            total_extractions = len(scanner_tests)

            for scanner_info in scanner_tests:
                print(f"\n🔧 Testing extraction: {scanner_info['name']}")

                try:
                    extracted_code = extract_scanner_code(full_code, scanner_info)
                    print(f"   ✅ Code extracted: {len(extracted_code)} characters")

                    # Validate syntax
                    ast.parse(extracted_code)
                    print(f"   ✅ AST validation passed")

                    # Check for required imports
                    required_imports = ["import pandas as pd", "import numpy as np", "import requests", "import asyncio"]
                    missing_imports = [imp for imp in required_imports if imp not in extracted_code]

                    if missing_imports:
                        print(f"   ❌ Missing imports: {missing_imports}")
                        continue

                    print(f"   ✅ All required imports present")

                    # Check for global variables
                    required_globals = ["API_KEY", "BASE_URL", "DATE"]
                    missing_globals = [glob for glob in required_globals if glob not in extracted_code]

                    if missing_globals:
                        print(f"   ❌ Missing global variables: {missing_globals}")
                        continue

                    print(f"   ✅ All required global variables present")

                    # Check for parameter preservation
                    parameter_patterns = [
                        r'>=\s*[0-9.]+',  # Numeric thresholds
                        r'<=\s*[0-9.]+',  # Numeric limits
                        r'\[[0-9.,\s]+\]',  # Arrays/lists
                    ]

                    parameter_count = 0
                    for pattern in parameter_patterns:
                        import re
                        matches = re.findall(pattern, extracted_code)
                        parameter_count += len(matches)

                    print(f"   ✅ Found {parameter_count} parameterizable values")

                    # Save extracted scanner for inspection
                    output_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_extracted_{scanner_info['pattern']}.py"
                    with open(output_file, 'w') as f:
                        f.write(extracted_code)
                    print(f"   📁 Saved to: {output_file}")

                    successful_extractions += 1

                except Exception as e:
                    print(f"   ❌ Extraction failed: {e}")
                    self.results["scanner_splitting"]["errors"].append(f"{scanner_info['name']}: {str(e)}")

            # Calculate success rate
            success_rate = (successful_extractions / total_extractions) * 100
            self.results["scanner_splitting"]["details"] = {
                "successful_extractions": successful_extractions,
                "total_extractions": total_extractions,
                "success_rate": success_rate
            }

            if success_rate >= 80:
                self.results["scanner_splitting"]["passed"] = True
                print(f"\n✅ PHASE 1 PASSED: {success_rate:.1f}% success rate")
            else:
                print(f"\n❌ PHASE 1 FAILED: {success_rate:.1f}% success rate (required: ≥80%)")

        except Exception as e:
            print(f"❌ PHASE 1 CRITICAL ERROR: {e}")
            self.results["scanner_splitting"]["errors"].append(f"Critical error: {str(e)}")

    async def test_formatting_process(self):
        """Test Phase 2: Validate formatting process with extracted scanners"""
        print("\n🧪 PHASE 2: Formatting Process Validation")
        print("-" * 40)

        try:
            # Import the smart infrastructure formatter
            from core.smart_infrastructure_formatter import format_code_with_smart_infrastructure
            print("✅ Successfully imported smart infrastructure formatter")

            # Test formatting with extracted scanners
            test_patterns = ["parabolic_score", "lc_frontside_d2_extended", "lc_frontside_d3_extended_1"]
            formatted_successfully = 0
            configurable_parameters_found = 0

            for pattern in test_patterns:
                extracted_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_extracted_{pattern}.py"

                if not os.path.exists(extracted_file):
                    print(f"   ⚠️ Skipping {pattern}: extracted file not found")
                    continue

                print(f"\n🔧 Testing formatter: {pattern}")

                with open(extracted_file, 'r') as f:
                    extracted_code = f.read()

                try:
                    # Apply smart infrastructure formatting
                    formatted_code = format_code_with_smart_infrastructure(extracted_code)
                    print(f"   ✅ Formatting successful: {len(formatted_code)} characters")

                    # Check for smart infrastructure features
                    smart_features = [
                        "SmartTickerFiltering",
                        "EfficientApiBatching",
                        "PolygonApiWrapper",
                        "MemoryOptimizedExecution",
                        "RateLimitHandling"
                    ]

                    features_found = [feature for feature in smart_features if feature in formatted_code]
                    print(f"   ✅ Smart features added: {len(features_found)}/5")

                    # Count configurable parameters in formatted code
                    import re
                    parameter_patterns = [
                        r'SMART_CONFIG\.',  # Smart config parameters
                        r'max_tickers\s*=',  # Configurable limits
                        r'batch_size\s*=',  # Batch parameters
                        r'>=\s*[0-9.]+',  # Threshold parameters
                    ]

                    total_parameters = 0
                    for pattern_regex in parameter_patterns:
                        matches = re.findall(pattern_regex, formatted_code)
                        total_parameters += len(matches)

                    print(f"   ✅ Configurable parameters: {total_parameters}")

                    if total_parameters > 0:
                        configurable_parameters_found += 1

                    # Save formatted code
                    formatted_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_formatted_{pattern}.py"
                    with open(formatted_file, 'w') as f:
                        f.write(formatted_code)
                    print(f"   📁 Saved formatted code: {formatted_file}")

                    formatted_successfully += 1

                except Exception as e:
                    print(f"   ❌ Formatting failed: {e}")
                    self.results["formatting_process"]["errors"].append(f"{pattern}: {str(e)}")

            # Calculate success metrics
            total_tests = len(test_patterns)
            format_success_rate = (formatted_successfully / total_tests) * 100 if total_tests > 0 else 0
            parameter_success_rate = (configurable_parameters_found / total_tests) * 100 if total_tests > 0 else 0

            self.results["formatting_process"]["details"] = {
                "formatted_successfully": formatted_successfully,
                "total_tests": total_tests,
                "format_success_rate": format_success_rate,
                "configurable_parameters_found": configurable_parameters_found,
                "parameter_success_rate": parameter_success_rate
            }

            if format_success_rate >= 80 and parameter_success_rate >= 60:
                self.results["formatting_process"]["passed"] = True
                print(f"\n✅ PHASE 2 PASSED: Format {format_success_rate:.1f}%, Parameters {parameter_success_rate:.1f}%")
            else:
                print(f"\n❌ PHASE 2 FAILED: Format {format_success_rate:.1f}%, Parameters {parameter_success_rate:.1f}%")

        except Exception as e:
            print(f"❌ PHASE 2 CRITICAL ERROR: {e}")
            self.results["formatting_process"]["errors"].append(f"Critical error: {str(e)}")

    async def test_scanner_execution_2025(self):
        """Test Phase 3: Execute scanners with 2025 date range and validate results"""
        print("\n🧪 PHASE 3: Scanner Execution 2025 Validation")
        print("-" * 40)

        try:
            # Test execution with 2025 date range (Jan 1 to current date)
            start_date = "2025-01-01"
            end_date = datetime.now().strftime("%Y-%m-%d")
            print(f"📅 Test date range: {start_date} to {end_date}")

            # Import execution system
            from core.universal_scanner_robustness_engine_v2 import process_uploaded_scanner_robust_v2
            print("✅ Successfully imported robust scanner execution engine")

            # Test formatted scanners
            test_patterns = ["parabolic_score", "lc_frontside_d2_extended", "lc_frontside_d3_extended_1"]
            successful_executions = 0
            total_results = 0

            for pattern in test_patterns:
                formatted_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_formatted_{pattern}.py"

                if not os.path.exists(formatted_file):
                    print(f"   ⚠️ Skipping {pattern}: formatted file not found")
                    continue

                print(f"\n🚀 Executing scanner: {pattern}")

                with open(formatted_file, 'r') as f:
                    formatted_code = f.read()

                try:
                    # Execute with timeout (30 seconds per scanner)
                    result = await asyncio.wait_for(
                        process_uploaded_scanner_robust_v2(formatted_code, start_date, end_date),
                        timeout=30.0
                    )

                    if result["success"]:
                        results = result["results"]
                        result_count = len(results)
                        print(f"   ✅ Execution successful: {result_count} results")

                        # Validate result structure
                        if results:
                            sample_result = results[0]
                            required_fields = ["ticker", "date"]
                            missing_fields = [field for field in required_fields if field not in sample_result]

                            if missing_fields:
                                print(f"   ⚠️ Missing required fields: {missing_fields}")
                            else:
                                print(f"   ✅ Result structure valid")

                            # Validate date range
                            valid_dates = 0
                            for res in results:
                                try:
                                    result_date = datetime.strptime(str(res.get('date', '')).split(' ')[0], '%Y-%m-%d')
                                    test_start = datetime.strptime(start_date, '%Y-%m-%d')
                                    test_end = datetime.strptime(end_date, '%Y-%m-%d')

                                    if test_start <= result_date <= test_end:
                                        valid_dates += 1
                                except:
                                    pass

                            print(f"   ✅ Valid 2025 dates: {valid_dates}/{result_count}")

                            if result_count > 0:
                                successful_executions += 1
                                total_results += result_count

                            # Save results for inspection
                            results_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_results_{pattern}.json"
                            with open(results_file, 'w') as f:
                                json.dump(results, f, indent=2, default=str)
                            print(f"   📁 Results saved: {results_file}")
                        else:
                            print(f"   ❌ No results returned")

                    else:
                        print(f"   ❌ Execution failed: {result.get('error', 'Unknown error')}")

                except asyncio.TimeoutError:
                    print(f"   ❌ Execution timeout (30s)")
                    self.results["scanner_execution"]["errors"].append(f"{pattern}: Execution timeout")

                except Exception as e:
                    print(f"   ❌ Execution error: {e}")
                    self.results["scanner_execution"]["errors"].append(f"{pattern}: {str(e)}")

            # Calculate success metrics
            total_tests = len(test_patterns)
            execution_success_rate = (successful_executions / total_tests) * 100 if total_tests > 0 else 0
            avg_results_per_scanner = total_results / successful_executions if successful_executions > 0 else 0

            self.results["scanner_execution"]["details"] = {
                "successful_executions": successful_executions,
                "total_tests": total_tests,
                "execution_success_rate": execution_success_rate,
                "total_results": total_results,
                "avg_results_per_scanner": avg_results_per_scanner
            }

            if execution_success_rate >= 70 and total_results > 0:
                self.results["scanner_execution"]["passed"] = True
                print(f"\n✅ PHASE 3 PASSED: {execution_success_rate:.1f}% success, {total_results} results")
            else:
                print(f"\n❌ PHASE 3 FAILED: {execution_success_rate:.1f}% success, {total_results} results")

        except Exception as e:
            print(f"❌ PHASE 3 CRITICAL ERROR: {e}")
            self.results["scanner_execution"]["errors"].append(f"Critical error: {str(e)}")

    async def test_performance_validation(self):
        """Test Phase 4: Validate performance and data accuracy"""
        print("\n🧪 PHASE 4: Performance & Data Accuracy Validation")
        print("-" * 40)

        try:
            # Analyze saved results for performance metrics
            test_patterns = ["parabolic_score", "lc_frontside_d2_extended", "lc_frontside_d3_extended_1"]
            total_performance_score = 0
            performance_tests = 0

            for pattern in test_patterns:
                results_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_results_{pattern}.json"

                if not os.path.exists(results_file):
                    print(f"   ⚠️ Skipping {pattern}: results file not found")
                    continue

                print(f"\n📊 Analyzing performance: {pattern}")

                with open(results_file, 'r') as f:
                    results = json.load(f)

                if not results:
                    print(f"   ❌ No results to analyze")
                    continue

                # Performance metrics
                result_count = len(results)
                unique_tickers = len(set(res.get('ticker', '') for res in results))
                date_range_days = 0

                try:
                    dates = [datetime.strptime(str(res.get('date', '')).split(' ')[0], '%Y-%m-%d')
                            for res in results if res.get('date')]
                    if dates:
                        date_range_days = (max(dates) - min(dates)).days + 1
                except:
                    pass

                print(f"   📈 Results: {result_count}")
                print(f"   🏢 Unique tickers: {unique_tickers}")
                print(f"   📅 Date range coverage: {date_range_days} days")

                # Data quality checks
                valid_tickers = 0
                valid_dates = 0

                for result in results:
                    ticker = result.get('ticker', '')
                    if ticker and len(ticker) <= 5 and ticker.isalpha():
                        valid_tickers += 1

                    try:
                        result_date = datetime.strptime(str(result.get('date', '')).split(' ')[0], '%Y-%m-%d')
                        if result_date.year == 2025:
                            valid_dates += 1
                    except:
                        pass

                ticker_quality = (valid_tickers / result_count) * 100 if result_count > 0 else 0
                date_quality = (valid_dates / result_count) * 100 if result_count > 0 else 0

                print(f"   ✅ Ticker quality: {ticker_quality:.1f}%")
                print(f"   ✅ Date quality: {date_quality:.1f}%")

                # Performance score (0-100)
                performance_score = 0
                if result_count >= 1:
                    performance_score += 20  # Has results
                if result_count >= 5:
                    performance_score += 15  # Multiple results
                if unique_tickers >= 3:
                    performance_score += 15  # Multiple tickers
                if ticker_quality >= 90:
                    performance_score += 25  # High ticker quality
                if date_quality >= 90:
                    performance_score += 25  # High date quality

                print(f"   🏆 Performance score: {performance_score}/100")

                total_performance_score += performance_score
                performance_tests += 1

            # Calculate overall performance
            avg_performance_score = total_performance_score / performance_tests if performance_tests > 0 else 0

            self.results["performance_validation"]["details"] = {
                "performance_tests": performance_tests,
                "avg_performance_score": avg_performance_score,
                "total_performance_score": total_performance_score
            }

            if avg_performance_score >= 70:
                self.results["performance_validation"]["passed"] = True
                print(f"\n✅ PHASE 4 PASSED: {avg_performance_score:.1f}/100 performance score")
            else:
                print(f"\n❌ PHASE 4 FAILED: {avg_performance_score:.1f}/100 performance score (required: ≥70)")

        except Exception as e:
            print(f"❌ PHASE 4 CRITICAL ERROR: {e}")
            self.results["performance_validation"]["errors"].append(f"Critical error: {str(e)}")

    def generate_quality_report(self):
        """Generate comprehensive quality validation report"""
        print("\n📋 COMPREHENSIVE QUALITY VALIDATION REPORT")
        print("=" * 60)

        # Calculate overall score
        phase_weights = {
            "scanner_splitting": 0.25,
            "formatting_process": 0.25,
            "scanner_execution": 0.30,
            "performance_validation": 0.20
        }

        total_score = 0
        passed_phases = 0

        for phase, weight in phase_weights.items():
            phase_result = self.results[phase]
            if phase_result["passed"]:
                total_score += weight * 100
                passed_phases += 1
                status = "✅ PASS"
            else:
                status = "❌ FAIL"

            print(f"{phase.replace('_', ' ').title():<25}: {status}")

            # Show details
            details = phase_result.get("details", {})
            for key, value in details.items():
                if isinstance(value, float):
                    print(f"  └─ {key}: {value:.1f}")
                else:
                    print(f"  └─ {key}: {value}")

            # Show errors
            errors = phase_result.get("errors", [])
            if errors:
                print(f"  └─ Errors ({len(errors)}):")
                for error in errors[:3]:  # Show first 3 errors
                    print(f"     • {error}")

        print(f"\nOverall Quality Score: {total_score:.1f}/100")
        print(f"Phases Passed: {passed_phases}/{len(phase_weights)}")

        # Determine overall pass/fail
        if total_score >= 70 and passed_phases >= 3:
            self.results["overall_quality"]["passed"] = True
            self.results["overall_quality"]["score"] = total_score
            print(f"\n🎉 OVERALL RESULT: ✅ PASSED")
            print("The scanner pipeline demonstrates production-ready quality!")
        else:
            self.results["overall_quality"]["score"] = total_score
            print(f"\n💥 OVERALL RESULT: ❌ FAILED")
            print("The scanner pipeline requires additional improvements.")

        # Save detailed report
        report_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/quality_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        print(f"\n📁 Detailed report saved: {report_file}")


async def main():
    """Main test execution"""
    print("🚀 Initializing Comprehensive Quality Validation System")
    print("🎯 Target: Complete Scanner Pipeline (Split → Format → Execute)")
    print()

    tester = QualityValidationTester()
    success = await tester.run_comprehensive_validation()

    if success:
        print("\n🎉 Quality validation PASSED! Pipeline is production-ready.")
        return 0
    else:
        print("\n💥 Quality validation FAILED! Pipeline needs improvements.")
        return 1


if __name__ == "__main__":
    import asyncio
    result = asyncio.run(main())
    sys.exit(result)