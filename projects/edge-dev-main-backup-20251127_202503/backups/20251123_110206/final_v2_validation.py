"""
🏆 Final V2.0 Validation Test - Measuring Actual Success Rate Achievement
Tests all 4 uploaded scanners with the fixed v2.0 engine to validate success rate

Expected Results:
✅ Optimal scanners (3/4) should work perfectly
🔧 Standard scanner (1/4) may have minor remaining issues
Target: 75%+ success rate (vs original 25%)
"""

import asyncio
import json
import logging
import time
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the fixed v2.0 engine
from core.universal_scanner_robustness_engine_v2 import process_uploaded_scanner_robust_v2

async def test_all_scanners_final():
    """Final validation test for all 4 scanners with fixed v2.0 engine"""

    scanners = {
        "scan2.0_copy": {
            "path": "/Users/michaeldurante/Downloads/scan2.0 copy.py",
            "type": "Standard (ticker-based)",
            "expected": "Improved but may have minor issues"
        },
        "sc_dmr_scan": {
            "path": "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py",
            "type": "Optimal (batch processing)",
            "expected": "Should work perfectly"
        },
        "lc_ext_frontside": {
            "path": "/Users/michaeldurante/Downloads/lc ext frontside copy.py",
            "type": "Optimal (async main)",
            "expected": "Should work perfectly"
        },
        "lc_d2_scan": {
            "path": "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py",
            "type": "Optimal (async main + complex)",
            "expected": "Should work perfectly"
        }
    }

    logger.info("🏆 FINAL V2.0 VALIDATION TEST")
    logger.info("🎯 Goal: Measure actual success rate achievement with fixed v2.0 engine")
    logger.info(f"📊 Testing {len(scanners)} scanners...")
    logger.info("=" * 80)

    results = {}
    start_time = time.time()

    for scanner_name, info in scanners.items():
        logger.info(f"\n🧪 TESTING: {scanner_name}")
        logger.info(f"📂 Type: {info['type']}")
        logger.info(f"🎯 Expected: {info['expected']}")
        logger.info("-" * 60)

        try:
            # Read scanner
            with open(info['path'], 'r') as f:
                scanner_code = f.read()

            logger.info(f"✅ Read scanner: {len(scanner_code):,} characters")

            # Test with fixed v2.0 engine - short date range for speed
            test_start = time.time()
            result = await process_uploaded_scanner_robust_v2(
                scanner_code, "2025-01-01", "2025-01-03"  # 3 days for quick test
            )
            test_time = time.time() - test_start

            # Analyze results
            success = result['success']
            result_count = len(result['results'])

            # Determine if this represents functional success
            functional_success = False
            if success:
                functional_success = True
            elif result_count > 0:
                # Check if results contain actual data vs just errors
                error_count = sum(1 for r in result['results'] if isinstance(r, dict) and 'error' in r)
                valid_count = result_count - error_count
                if valid_count > 0:
                    functional_success = True

            results[scanner_name] = {
                "success": success,
                "functional_success": functional_success,
                "result_count": result_count,
                "execution_time": test_time,
                "type": info['type'],
                "expected": info['expected'],
                "diagnostics": result.get('diagnostics', {})
            }

            # Log results
            status = "✅ SUCCESS" if functional_success else "❌ FAILED"
            logger.info(f"🏆 Result: {status}")
            logger.info(f"📊 Engine Success: {success}")
            logger.info(f"📈 Results: {result_count}")
            logger.info(f"⏱️  Time: {test_time:.1f}s")

            if 'diagnostics' in result:
                diag = result['diagnostics']
                logger.info(f"🔍 Function: {diag.get('function_detected', 'None')}")
                logger.info(f"🔍 Pattern: {diag.get('pattern_type', 'None')}")

        except Exception as e:
            logger.error(f"❌ FAILED: {e}")
            results[scanner_name] = {
                "success": False,
                "functional_success": False,
                "result_count": 0,
                "execution_time": 0,
                "type": info['type'],
                "expected": info['expected'],
                "error": str(e)
            }

    total_time = time.time() - start_time

    # Generate final report
    logger.info("\n" + "=" * 80)
    logger.info("🏆 FINAL V2.0 VALIDATION REPORT")
    logger.info("=" * 80)

    # Calculate success rates
    total_scanners = len(results)
    engine_successes = sum(1 for r in results.values() if r.get('success', False))
    functional_successes = sum(1 for r in results.values() if r.get('functional_success', False))

    engine_success_rate = (engine_successes / total_scanners) * 100
    functional_success_rate = (functional_successes / total_scanners) * 100

    logger.info(f"📊 ENGINE SUCCESS RATE: {engine_success_rate:.0f}% ({engine_successes}/{total_scanners})")
    logger.info(f"🎯 FUNCTIONAL SUCCESS RATE: {functional_success_rate:.0f}% ({functional_successes}/{total_scanners})")
    logger.info(f"⏱️  Total Test Time: {total_time:.1f}s")

    # Individual results
    logger.info(f"\n📋 INDIVIDUAL RESULTS:")
    for name, result in results.items():
        functional_status = "✅ WORKS" if result['functional_success'] else "❌ FAILED"
        engine_status = "✅" if result['success'] else "❌"
        logger.info(f"   {name}: {functional_status} (Engine: {engine_status}, Results: {result['result_count']})")

    # Category analysis
    logger.info(f"\n🔍 CATEGORY ANALYSIS:")
    optimal_scanners = [name for name, result in results.items() if "Optimal" in result['type']]
    optimal_successes = sum(1 for name in optimal_scanners if results[name]['functional_success'])

    standard_scanners = [name for name, result in results.items() if "Standard" in result['type']]
    standard_successes = sum(1 for name in standard_scanners if results[name]['functional_success'])

    logger.info(f"   🌟 Optimal Scanners: {optimal_successes}/{len(optimal_scanners)} working ({(optimal_successes/len(optimal_scanners)*100) if optimal_scanners else 0:.0f}%)")
    logger.info(f"   🔧 Standard Scanners: {standard_successes}/{len(standard_scanners)} working ({(standard_successes/len(standard_scanners)*100) if standard_scanners else 0:.0f}%)")

    # Achievement assessment
    logger.info(f"\n🎯 ACHIEVEMENT ASSESSMENT:")

    if functional_success_rate >= 100:
        logger.info(f"   🏆 TARGET EXCEEDED: 100% functional success rate achieved!")
        achievement = "Perfect"
    elif functional_success_rate >= 75:
        logger.info(f"   ✅ TARGET ACHIEVED: {functional_success_rate:.0f}% functional success rate (target: 75%+)")
        achievement = "Excellent"
    elif functional_success_rate >= 50:
        logger.info(f"   📈 MAJOR IMPROVEMENT: {functional_success_rate:.0f}% functional success rate (was 25%)")
        achievement = "Good"
    else:
        logger.info(f"   ⚠️  NEEDS WORK: {functional_success_rate:.0f}% functional success rate")
        achievement = "Needs improvement"

    # Comparison with original v1.0
    original_success_rate = 25
    improvement = functional_success_rate - original_success_rate

    logger.info(f"\n📈 IMPROVEMENT ANALYSIS:")
    logger.info(f"   📊 Original v1.0 Success Rate: {original_success_rate}%")
    logger.info(f"   📊 Fixed v2.0 Success Rate: {functional_success_rate:.0f}%")
    logger.info(f"   📈 Improvement: +{improvement:.0f} percentage points")

    if improvement > 0:
        logger.info(f"   🎉 SUCCESS: {improvement:.0f}% improvement achieved!")
    else:
        logger.info(f"   ⚠️  No improvement detected")

    # Save detailed results
    final_report = {
        "test_summary": {
            "engine_success_rate": engine_success_rate,
            "functional_success_rate": functional_success_rate,
            "total_scanners": total_scanners,
            "engine_successes": engine_successes,
            "functional_successes": functional_successes,
            "total_time": total_time,
            "achievement": achievement,
            "improvement_vs_v1": improvement
        },
        "individual_results": results,
        "category_analysis": {
            "optimal_scanners": {
                "count": len(optimal_scanners),
                "successes": optimal_successes,
                "success_rate": (optimal_successes/len(optimal_scanners)*100) if optimal_scanners else 0
            },
            "standard_scanners": {
                "count": len(standard_scanners),
                "successes": standard_successes,
                "success_rate": (standard_successes/len(standard_scanners)*100) if standard_scanners else 0
            }
        },
        "timestamp": datetime.now().isoformat()
    }

    with open("final_v2_validation_report.json", "w") as f:
        json.dump(final_report, f, indent=2, default=str)

    logger.info(f"\n💾 Final report saved to: final_v2_validation_report.json")
    logger.info("=" * 80)

    return final_report

if __name__ == "__main__":
    asyncio.run(test_all_scanners_final())