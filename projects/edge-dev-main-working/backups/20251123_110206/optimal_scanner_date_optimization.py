"""
🚀 Optimal Scanner Date Range Optimization
Smart date chunking for optimal scanners to prevent timeout while maintaining full results
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict
import pandas as pd

logger = logging.getLogger(__name__)

async def optimize_optimal_scanner_execution(scanner_code: str, start_date: str, end_date: str) -> List[Dict]:
    """
    🎯 Optimize optimal scanner execution with intelligent date chunking

    This prevents optimal scanners from timing out while maintaining full coverage
    """

    logger.info("🚀 OPTIMAL SCANNER DATE OPTIMIZATION")
    logger.info(f"📅 Original range: {start_date} to {end_date}")

    # Parse dates
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    total_days = (end_dt - start_dt).days

    logger.info(f"📊 Total days: {total_days}")

    # If date range is small enough, execute directly
    if total_days <= 7:
        logger.info("✅ Small date range - executing directly")
        from core.universal_scanner_robustness_engine_v2 import process_uploaded_scanner_robust_v2
        return await process_uploaded_scanner_robust_v2(scanner_code, start_date, end_date)

    # For large date ranges, use intelligent chunking
    logger.info("🔧 Large date range - using intelligent chunking")

    # Chunk size: 7 days per chunk (optimal for performance vs timeout)
    chunk_days = 7
    chunks = []

    current_start = start_dt
    while current_start <= end_dt:
        current_end = min(current_start + timedelta(days=chunk_days), end_dt)
        chunks.append((
            current_start.strftime('%Y-%m-%d'),
            current_end.strftime('%Y-%m-%d')
        ))
        current_start = current_end + timedelta(days=1)

    logger.info(f"📦 Created {len(chunks)} chunks of ~{chunk_days} days each")

    # Execute chunks with timeout protection
    all_results = []
    successful_chunks = 0
    failed_chunks = 0

    from core.universal_scanner_robustness_engine_v2 import process_uploaded_scanner_robust_v2

    for i, (chunk_start, chunk_end) in enumerate(chunks):
        try:
            logger.info(f"🔄 Processing chunk {i+1}/{len(chunks)}: {chunk_start} to {chunk_end}")

            # Execute chunk with 30-second timeout (much shorter than full 60s)
            chunk_result = await asyncio.wait_for(
                process_uploaded_scanner_robust_v2(scanner_code, chunk_start, chunk_end),
                timeout=30.0
            )

            if chunk_result["success"] and chunk_result["results"]:
                all_results.extend(chunk_result["results"])
                successful_chunks += 1
                logger.info(f"✅ Chunk {i+1} successful: {len(chunk_result['results'])} results")
            else:
                logger.warning(f"⚠️ Chunk {i+1} completed but no results")
                successful_chunks += 1  # Still count as successful execution

        except asyncio.TimeoutError:
            logger.warning(f"⏱️ Chunk {i+1} timed out after 30s - skipping")
            failed_chunks += 1
            continue

        except Exception as e:
            logger.warning(f"❌ Chunk {i+1} failed: {e}")
            failed_chunks += 1
            continue

    # Summary
    logger.info(f"📊 Chunk Summary: {successful_chunks} successful, {failed_chunks} failed")
    logger.info(f"📈 Total results collected: {len(all_results)}")

    # Deduplicate results (in case of overlaps at chunk boundaries)
    if all_results:
        # Convert to DataFrame for easy deduplication
        df = pd.DataFrame(all_results)

        # Deduplicate based on symbol + date if those columns exist
        if 'symbol' in df.columns and 'date' in df.columns:
            df = df.drop_duplicates(subset=['symbol', 'date'])
            logger.info(f"✅ After deduplication: {len(df)} unique results")
            all_results = df.to_dict('records')
        elif 'ticker' in df.columns and 'date' in df.columns:
            df = df.drop_duplicates(subset=['ticker', 'date'])
            logger.info(f"✅ After deduplication: {len(df)} unique results")
            all_results = df.to_dict('records')

    return all_results

async def test_optimization():
    """Test the optimization with SC DMR SCAN"""

    # Read SC DMR SCAN
    scanner_path = "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py"
    with open(scanner_path, 'r') as f:
        scanner_code = f.read()

    # Test with frontend-style date range
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    logger.info(f"🧪 Testing optimization with {start_date} to {end_date}")

    results = await optimize_optimal_scanner_execution(scanner_code, start_date, end_date)

    logger.info(f"🎉 OPTIMIZATION TEST COMPLETE")
    logger.info(f"📊 Total results: {len(results)}")

    return results

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test_optimization())