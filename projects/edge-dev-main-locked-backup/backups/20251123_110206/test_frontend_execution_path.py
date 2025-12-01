"""
🔍 Test Frontend Execution Path
Test the exact same execution path and conditions as the frontend
"""

import asyncio
import logging
from datetime import datetime, timedelta

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_frontend_execution_path():
    """Test the exact execution path the frontend uses"""

    logger.info("🔍 TESTING FRONTEND EXECUTION PATH")
    logger.info("="*60)

    try:
        # Import the main.py function that frontend calls
        from main import execute_uploaded_scanner_robust

        # Read SC DMR SCAN
        scanner_path = "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py"
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()

        logger.info(f"✅ Read SC DMR SCAN: {len(scanner_code):,} characters")

        # Test with frontend-style date range (user typically uses recent dates)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        logger.info(f"📅 Testing with frontend date range: {start_date} to {end_date}")

        # Mock progress callback like frontend uses
        async def mock_progress_callback(message, progress):
            logger.info(f"📊 Progress {progress}%: {message}")

        # Test EXACT same execution path as frontend
        logger.info("🎯 Calling execute_uploaded_scanner_robust (same as frontend)")

        try:
            results = await execute_uploaded_scanner_robust(
                scanner_code,
                start_date,
                end_date,
                mock_progress_callback,
                pure_execution_mode=True  # Frontend default
            )

            logger.info(f"✅ SUCCESS: Got {len(results)} results")
            logger.info(f"📊 Sample results: {results[:3] if results else 'None'}")

            # Check if results contain errors
            error_count = sum(1 for r in results if isinstance(r, dict) and 'error' in r)
            success_count = len(results) - error_count

            logger.info(f"📈 Success: {success_count}, Errors: {error_count}")

            if error_count == 0:
                logger.info("🎉 FRONTEND EXECUTION SUCCESSFUL - NO ERRORS!")
            else:
                logger.info(f"⚠️ Frontend execution had {error_count} errors")
                # Show first error
                for result in results:
                    if isinstance(result, dict) and 'error' in result:
                        logger.info(f"🔍 First error: {result['error']}")
                        break

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ FRONTEND EXECUTION FAILED: {error_msg}")

            if "'>' not supported between instances of 'str' and 'int'" in error_msg:
                logger.error("🎯 CONFIRMED: This is the exact error users see!")

                # This means the v2.0 engine failed and fallback also failed
                logger.error("💡 Analysis: v2.0 engine failed -> fallback to old system -> old system also failed")
                logger.error("🔧 Solution needed: Fix the string vs int error in ALL execution paths")

            import traceback
            logger.error(f"📋 Full traceback:\n{traceback.format_exc()}")

    except Exception as setup_error:
        logger.error(f"❌ Setup error: {setup_error}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_frontend_execution_path())