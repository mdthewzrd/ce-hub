"""
Test lc d2 scan - oct 25 new ideas (2).py with Universal Scanner Robustness Engine
Date Range: 1/1/25 to 11/1/25

Analysis: This scanner uses async main() pattern with advanced parabolic scoring system
and already implements full market scanning (ALL tickers from Polygon API).
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the robustness engine
from core.universal_scanner_robustness_engine import process_uploaded_scanner_robust

async def test_lc_d2_scan():
    """Test lc d2 scan - oct 25 new ideas (2).py with Universal Scanner Robustness Engine"""
    logger.info("🧪 Testing lc d2 scan - oct 25 new ideas (2).py")
    logger.info("="*80)

    # Read the scanner code
    scanner_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(scanner_file_path, 'r') as f:
            scanner_code = f.read()

        logger.info(f"OK Successfully read scanner file: {scanner_file_path}")
        logger.info(f"  Code length: {len(scanner_code):,} characters")

        # Analyze the scanner structure
        logger.info("\n📋 Scanner Analysis:")
        if 'async def main()' in scanner_code:
            logger.info("  OK Detected async main pattern: async def main()")
        if 'fetch_intial_stock_list' in scanner_code:
            logger.info("  OK Detected market data fetching: fetch_intial_stock_list()")
        if 'aiohttp.ClientSession' in scanner_code:
            logger.info("  OK Uses async HTTP client: aiohttp.ClientSession")
        if 'api.polygon.io' in scanner_code:
            logger.info("  OK Full market data source: Polygon API")
        if 'parabolic_score' in scanner_code:
            logger.info("  OK Advanced scoring system: parabolic scoring methodology")
        if 'lc_frontside_d3_extended_1' in scanner_code:
            logger.info("  OK LC D2/D3 pattern detection: advanced multi-day analysis")
        if 'ProcessPoolExecutor' in scanner_code:
            logger.info("  OK Uses parallel processing: ProcessPoolExecutor")
        if 'df_lc.to_csv' in scanner_code:
            logger.info("  OK Export format: CSV (lc_backtest.csv)")

        logger.info("\n🚀 Testing with Universal Scanner Robustness Engine...")
        logger.info("   Date Range: 2025-01-01 to 2025-11-01")
        logger.info("   Expected: Advanced LC D2 pattern results with parabolic scoring")

        start_time = time.time()

        # Process with Universal Scanner Robustness Engine
        result = await process_uploaded_scanner_robust(
            scanner_code, "2025-01-01", "2025-11-01"
        )

        execution_time = time.time() - start_time

        # Analyze results
        logger.info("\n" + "="*80)
        logger.info("📊 TEST RESULTS - LC D2 SCAN")
        logger.info("="*80)

        logger.info(f"✅ Execution Success: {result['success']}")
        logger.info(f"⏱️  Execution Time: {execution_time:.2f} seconds")
        logger.info(f"📈 Results Count: {len(result['results'])}")

        # Diagnostics
        if 'diagnostics' in result:
            diag = result['diagnostics']
            logger.info(f"\n🔍 Diagnostics:")
            logger.info(f"   Function Detected: {diag.get('function_detected', 'None')}")
            logger.info(f"   Pattern Type: {diag.get('pattern_type', 'None')}")
            logger.info(f"   Execution Model: {diag.get('execution_model', 'None')}")
            logger.info(f"   Ticker Count: {diag.get('ticker_count', 'Unknown')}")
            logger.info(f"   Success Rate: {diag.get('success_rate', 0):.1%}")

            if 'sample_errors' in diag and diag['sample_errors']:
                logger.info(f"   ⚠️  Sample Errors: {len(diag['sample_errors'])}")
                for error in diag['sample_errors'][:3]:  # Show first 3 errors
                    logger.info(f"      • {error}")

        # Sample results
        if result['results'] and len(result['results']) > 0:
            logger.info(f"\n📋 Sample Results (First 5):")
            for i, res in enumerate(result['results'][:5]):
                if isinstance(res, dict):
                    ticker = res.get('symbol', res.get('ticker', 'Unknown'))
                    date = res.get('date', 'Unknown')
                    score = res.get('parabolic_score', res.get('score', 'N/A'))
                    logger.info(f"   {i+1}. {ticker} on {date} (Score: {score})")
                else:
                    logger.info(f"   {i+1}. {res}")

        # Performance validation
        logger.info(f"\n🎯 Performance Validation:")
        success_criteria = {
            "Execution Success": result['success'],
            "Has Results": len(result['results']) > 0,
            "Execution Time < 5min": execution_time < 300,
            "Function Detection": 'diagnostics' in result and result['diagnostics'].get('function_detected'),
            "Ticker Standardization": 'diagnostics' in result and result['diagnostics'].get('ticker_count', 0) > 100
        }

        for criteria, passed in success_criteria.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            logger.info(f"   {criteria}: {status}")

        overall_success = all(success_criteria.values())
        logger.info(f"\n🏆 Overall Test Result: {'✅ SUCCESS' if overall_success else '❌ FAILED'}")

        # Additional Analysis for async main pattern
        if result['diagnostics'].get('function_detected') == '':
            logger.info("\n⚠️  ASYNC MAIN PATTERN DETECTION ISSUE:")
            logger.info("   This scanner uses async def main() pattern")
            logger.info("   Similar to lc ext frontside - expects event loop conflicts")
            logger.info("   Universal Scanner Robustness Engine needs async main enhancement")

        # Analysis for large complex scanners
        if len(scanner_code) > 25000:
            logger.info(f"\n📊 LARGE SCANNER ANALYSIS:")
            logger.info(f"   Code Size: {len(scanner_code):,} characters")
            logger.info(f"   Complexity: Very High (advanced parabolic scoring)")
            logger.info(f"   Architecture: Already optimal (full market scanning)")

        # Save detailed results
        test_results = {
            "test_name": "lc_d2_scan_test",
            "scanner_file": scanner_file_path,
            "date_range": "2025-01-01 to 2025-11-01",
            "execution_time": execution_time,
            "success": overall_success,
            "result_count": len(result['results']),
            "diagnostics": result.get('diagnostics', {}),
            "success_criteria": success_criteria,
            "pattern_notes": "async main() pattern with advanced parabolic scoring - already implements full market scanning",
            "code_size": len(scanner_code),
            "complexity": "Very High",
            "timestamp": datetime.now().isoformat()
        }

        with open("test_lc_d2_scan_results.json", "w") as f:
            json.dump(test_results, f, indent=2, default=str)

        logger.info(f"\n💾 Detailed results saved to: test_lc_d2_scan_results.json")
        logger.info("="*80)

        return overall_success, result

    except Exception as e:
        logger.error(f"❌ Test failed with exception: {e}")
        logger.error(f"   Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return False, None

async def main():
    """Run the LC D2 SCAN test"""
    success, result = await test_lc_d2_scan()
    if success:
        print("\n🎉 LC D2 SCAN test completed successfully!")
    else:
        print("\n⚠️  LC D2 SCAN test encountered issues - check logs for details")

if __name__ == "__main__":
    asyncio.run(main())