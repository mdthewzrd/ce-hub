"""
🔧 Critical Bug Fixes for Universal Scanner Robustness Engine v2.0
Addresses the two critical issues found during comprehensive testing:

BUG 1: Success Criteria Logic - marking successful executions as failed
BUG 2: Optimal Pass-Through Execution - hanging/looping during optimal scanner execution

Target: Fix these issues to achieve true 100% success rate
"""

import asyncio
import logging
import time
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def diagnose_success_criteria_bug():
    """
    Diagnose why scan2.0_copy was marked as failed despite generating 80 results
    """
    logger.info("🔍 DIAGNOSING BUG 1: Success Criteria Logic")
    logger.info("="*60)

    from core.universal_scanner_robustness_engine_v2 import process_uploaded_scanner_robust_v2

    try:
        # Read the scan2.0 copy scanner
        scanner_path = "/Users/michaeldurante/Downloads/scan2.0 copy.py"
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()

        logger.info(f"✅ Read scanner: {len(scanner_code):,} characters")

        # Test with v2.0 engine - minimal date range for faster testing
        start_time = time.time()
        result = await process_uploaded_scanner_robust_v2(
            scanner_code, "2025-01-01", "2025-01-03"  # Just 3 days for diagnostic
        )
        execution_time = time.time() - start_time

        # Analyze the success determination logic
        logger.info(f"\n📊 DIAGNOSTIC RESULTS:")
        logger.info(f"   Engine Success: {result['success']}")
        logger.info(f"   Results Count: {len(result['results'])}")
        logger.info(f"   Execution Time: {execution_time:.2f}s")

        if 'diagnostics' in result:
            diag = result['diagnostics']
            logger.info(f"   Function Detected: {diag.get('function_detected', 'None')}")
            logger.info(f"   Pattern Type: {diag.get('pattern_type', 'None')}")
            logger.info(f"   Successful Count: {diag.get('successful_count', 0)}")
            logger.info(f"   Error Count: {diag.get('error_count', 0)}")
            logger.info(f"   Success Rate: {diag.get('success_rate', 0):.1%}")

        # Check individual results for errors
        logger.info(f"\n🔍 SAMPLE RESULTS ANALYSIS:")
        valid_results = 0
        error_results = 0

        for i, res in enumerate(result['results'][:10]):  # Check first 10
            if isinstance(res, dict):
                if 'error' in res:
                    error_results += 1
                    logger.info(f"   {i+1}. ERROR: {res.get('error', 'Unknown error')}")
                else:
                    valid_results += 1
                    ticker = res.get('symbol', res.get('ticker', 'Unknown'))
                    date = res.get('date', 'Unknown')
                    logger.info(f"   {i+1}. VALID: {ticker} on {date}")
            else:
                logger.info(f"   {i+1}. RAW: {res}")

        logger.info(f"\n🎯 SUCCESS CRITERIA ANALYSIS:")
        logger.info(f"   Valid Results: {valid_results}")
        logger.info(f"   Error Results: {error_results}")
        logger.info(f"   Has Results: {len(result['results']) > 0}")
        logger.info(f"   Should Be Success: {len(result['results']) > 0 and valid_results > 0}")

        # Identify the bug
        if len(result['results']) > 0 and valid_results > 0 and not result['success']:
            logger.info(f"\n🚨 BUG CONFIRMED: Engine has valid results but reports failure!")
            logger.info(f"   This indicates a bug in the success criteria logic in v2.0 engine")
            return {"bug_confirmed": True, "bug_type": "success_criteria_logic", "results": result}
        else:
            logger.info(f"\n✅ Success criteria working correctly for this test")
            return {"bug_confirmed": False, "results": result}

    except Exception as e:
        logger.error(f"❌ Diagnostic failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"bug_confirmed": False, "error": str(e)}

async def diagnose_optimal_passthrough_bug():
    """
    Diagnose why SC DMR SCAN hangs during optimal pass-through execution
    """
    logger.info(f"\n🔍 DIAGNOSING BUG 2: Optimal Pass-Through Execution Hang")
    logger.info("="*60)

    from core.universal_scanner_robustness_engine_v2 import UniversalScannerRobustnessEngineV2

    try:
        # Read the optimal batch scanner
        scanner_path = "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py"
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()

        logger.info(f"✅ Read optimal scanner: {len(scanner_code):,} characters")

        # Create engine instance for step-by-step diagnosis
        engine = UniversalScannerRobustnessEngineV2()

        # Phase 1: Test optimal detection (this worked in the previous test)
        logger.info(f"\n📊 Phase 1: Testing Optimal Detection...")
        is_optimal, reason = engine.optimal_detector.is_optimal_scanner(scanner_code)
        logger.info(f"   Optimal Detected: {is_optimal}")
        logger.info(f"   Reason: {reason}")

        if not is_optimal:
            logger.info(f"   ✅ No bug here - scanner not detected as optimal")
            return {"bug_confirmed": False, "reason": "not_optimal"}

        # Phase 2: Test pass-through creation (this also worked)
        logger.info(f"\n📊 Phase 2: Testing Pass-Through Creation...")
        try:
            enhanced_code = engine.async_support.create_optimal_passthrough(scanner_code, reason)
            logger.info(f"   ✅ Pass-through creation successful: {len(enhanced_code):,} characters")
        except Exception as e:
            logger.info(f"   ❌ Pass-through creation failed: {e}")
            return {"bug_confirmed": True, "bug_type": "passthrough_creation", "error": str(e)}

        # Phase 3: Test execution with timeout (this is where it likely hangs)
        logger.info(f"\n📊 Phase 3: Testing Execution with Short Timeout...")

        # Use a very short timeout for diagnostic
        timeout_seconds = 10

        try:
            start_time = time.time()

            # Execute with timeout
            result = await asyncio.wait_for(
                engine.execution_engine.execute_enhanced_scanner(
                    enhanced_code, "2025-01-01", "2025-01-02", {"execution_mode": "optimal_passthrough"}
                ),
                timeout=timeout_seconds
            )

            execution_time = time.time() - start_time
            logger.info(f"   ✅ Execution completed in {execution_time:.2f}s")
            logger.info(f"   Results: {len(result)} items")
            return {"bug_confirmed": False, "execution_time": execution_time, "results": len(result)}

        except asyncio.TimeoutError:
            execution_time = time.time() - start_time
            logger.info(f"   🚨 EXECUTION HUNG: Timed out after {timeout_seconds}s")
            logger.info(f"   This confirms the optimal pass-through execution bug!")
            return {
                "bug_confirmed": True,
                "bug_type": "optimal_execution_hang",
                "timeout_after": timeout_seconds,
                "execution_time": execution_time
            }
        except Exception as e:
            execution_time = time.time() - start_time
            logger.info(f"   ❌ Execution error after {execution_time:.2f}s: {e}")
            return {
                "bug_confirmed": True,
                "bug_type": "optimal_execution_error",
                "error": str(e),
                "execution_time": execution_time
            }

    except Exception as e:
        logger.error(f"❌ Diagnostic failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"bug_confirmed": False, "error": str(e)}

async def run_targeted_diagnostics():
    """Run both targeted diagnostics to identify specific bugs"""
    logger.info("🔧 STARTING TARGETED V2.0 BUG DIAGNOSTICS")
    logger.info("🎯 Goal: Identify and fix the two critical bugs preventing 100% success rate")

    overall_start = time.time()

    # Diagnostic 1: Success Criteria Logic Bug
    bug1_result = await diagnose_success_criteria_bug()

    # Diagnostic 2: Optimal Pass-Through Execution Hang
    bug2_result = await diagnose_optimal_passthrough_bug()

    total_time = time.time() - overall_start

    # Generate diagnostic report
    logger.info(f"\n" + "="*80)
    logger.info("📋 TARGETED DIAGNOSTIC REPORT")
    logger.info("="*80)

    logger.info(f"🕒 Total Diagnostic Time: {total_time:.2f}s")

    logger.info(f"\n🔍 BUG 1 - SUCCESS CRITERIA LOGIC:")
    if bug1_result.get('bug_confirmed'):
        logger.info(f"   🚨 CONFIRMED: Success criteria logic bug exists")
        logger.info(f"   📊 Engine has valid results but reports failure")
        logger.info(f"   🎯 Fix needed: Update success determination logic in v2.0")
    else:
        logger.info(f"   ✅ No bug detected or diagnostic failed")

    logger.info(f"\n🔍 BUG 2 - OPTIMAL PASS-THROUGH EXECUTION:")
    if bug2_result.get('bug_confirmed'):
        bug_type = bug2_result.get('bug_type')
        if bug_type == "optimal_execution_hang":
            logger.info(f"   🚨 CONFIRMED: Optimal execution hangs/loops indefinitely")
            logger.info(f"   ⏱️  Timed out after {bug2_result.get('timeout_after')}s")
            logger.info(f"   🎯 Fix needed: Debug optimal pass-through execution path")
        elif bug_type == "optimal_execution_error":
            logger.info(f"   🚨 CONFIRMED: Optimal execution throws error")
            logger.info(f"   ❌ Error: {bug2_result.get('error')}")
            logger.info(f"   🎯 Fix needed: Handle error in optimal execution")
        elif bug_type == "passthrough_creation":
            logger.info(f"   🚨 CONFIRMED: Pass-through creation fails")
            logger.info(f"   ❌ Error: {bug2_result.get('error')}")
            logger.info(f"   🎯 Fix needed: Fix pass-through code creation")
    else:
        logger.info(f"   ✅ No bug detected or diagnostic failed")

    # Recommendations
    logger.info(f"\n🚀 RECOMMENDED FIXES:")

    fixes_needed = []
    if bug1_result.get('bug_confirmed'):
        fixes_needed.append("1. Fix success criteria evaluation logic in v2.0 engine")

    if bug2_result.get('bug_confirmed'):
        bug_type = bug2_result.get('bug_type')
        if bug_type == "optimal_execution_hang":
            fixes_needed.append("2. Fix infinite loop/deadlock in optimal pass-through execution")
        elif bug_type == "optimal_execution_error":
            fixes_needed.append("2. Fix error handling in optimal pass-through execution")
        elif bug_type == "passthrough_creation":
            fixes_needed.append("2. Fix optimal pass-through code creation logic")

    if fixes_needed:
        for fix in fixes_needed:
            logger.info(f"   {fix}")
        logger.info(f"\n🎯 With these fixes, v2.0 should achieve 100% success rate")
    else:
        logger.info(f"   🎉 No critical bugs detected - v2.0 may already be working!")

    # Save diagnostic results
    diagnostic_report = {
        "timestamp": datetime.now().isoformat(),
        "total_diagnostic_time": total_time,
        "bug_1_success_criteria": bug1_result,
        "bug_2_optimal_execution": bug2_result,
        "fixes_needed": fixes_needed,
        "next_steps": "Apply targeted fixes based on diagnostic results"
    }

    with open("v2_critical_bug_diagnostic_report.json", "w") as f:
        import json
        json.dump(diagnostic_report, f, indent=2, default=str)

    logger.info(f"\n💾 Diagnostic report saved to: v2_critical_bug_diagnostic_report.json")
    logger.info("="*80)

    return diagnostic_report

if __name__ == "__main__":
    asyncio.run(run_targeted_diagnostics())