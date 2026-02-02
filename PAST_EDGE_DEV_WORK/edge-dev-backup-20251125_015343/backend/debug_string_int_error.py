"""
🔍 Debug String vs Int Comparison Error
Targeted diagnostic to identify exactly where the error occurs
"""

import asyncio
import logging
import traceback
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_exact_error():
    """Debug the exact string vs int comparison error"""

    logger.info("🔍 DEBUGGING EXACT ERROR: String vs Int Comparison")
    logger.info("="*60)

    try:
        # Import the v2.0 engine
        from core.universal_scanner_robustness_engine_v2 import process_uploaded_scanner_robust_v2

        # Read SC DMR SCAN (the problematic scanner)
        scanner_path = "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py"
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()

        logger.info(f"✅ Read SC DMR SCAN: {len(scanner_code):,} characters")

        # Test with minimal date range and detailed error tracking
        logger.info("🧪 Testing with minimal date range: 2025-01-01 to 2025-01-02")

        try:
            result = await process_uploaded_scanner_robust_v2(
                scanner_code,
                "2025-01-01",
                "2025-01-02"
            )

            logger.info(f"✅ SUCCESS: {result['success']}")
            logger.info(f"📊 Results: {len(result['results'])}")

            if result['success']:
                logger.info("🎉 No error occurred - scanner executed successfully!")
            else:
                logger.info("❌ Execution failed but no exception thrown")
                if 'error' in result:
                    logger.info(f"📋 Error details: {result['error']}")

        except Exception as e:
            error_message = str(e)
            full_traceback = traceback.format_exc()

            logger.error(f"❌ CAUGHT EXCEPTION: {error_message}")
            logger.error(f"📋 Exception type: {type(e).__name__}")

            if "'>' not supported between instances of 'str' and 'int'" in error_message:
                logger.error("🎯 CONFIRMED: This is the exact error we're hunting!")

                # Analyze the traceback to find the exact line
                lines = full_traceback.split('\n')
                error_location_lines = []

                for i, line in enumerate(lines):
                    if 'File "' in line and ('/core/' in line or '/backend/' in line):
                        error_location_lines.append(f"  {line}")
                        if i+1 < len(lines):
                            error_location_lines.append(f"    {lines[i+1]}")

                logger.error("🔍 ERROR LOCATION ANALYSIS:")
                for line in error_location_lines[-6:]:  # Show last 3 file/line pairs
                    logger.error(line)

                # Look for specific file where error occurs
                if "scanner.py" in full_traceback:
                    logger.error("📂 Error occurs in scanner.py")
                elif "universal_scanner_robustness_engine_v2.py" in full_traceback:
                    logger.error("📂 Error occurs in v2.0 engine")
                elif "data_fetcher.py" in full_traceback:
                    logger.error("📂 Error occurs in data fetcher")
                else:
                    logger.error("📂 Error occurs in unknown file")

            logger.error(f"\n📋 FULL TRACEBACK:\n{full_traceback}")

        logger.info("="*60)

    except Exception as setup_error:
        logger.error(f"❌ Setup error: {setup_error}")
        logger.error(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(debug_exact_error())