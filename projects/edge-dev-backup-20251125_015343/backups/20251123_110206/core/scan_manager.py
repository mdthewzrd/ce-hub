"""
Scan Manager - High-performance wrapper for the original LC scanner
Preserves all threading optimizations while adding FastAPI integration
"""

import asyncio
import json
import logging
import os
import pickle
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import pandas as pd

from models.schemas import ScanRequest, ScanProgress, ScanResult
from .scanner_wrapper import ThreadedLCScanner

logger = logging.getLogger(__name__)


class ScanManager:
    """
    Manages LC scan execution, progress tracking, and results storage
    Preserves all threading optimizations from the original scanner
    """

    def __init__(self, results_dir: str = "scan_results"):
        self.results_dir = results_dir
        self.active_scans: Dict[str, ScanProgress] = {}
        self.completed_scans: Dict[str, ScanProgress] = {}
        self.scanner = ThreadedLCScanner()

        # Ensure results directory exists
        os.makedirs(self.results_dir, exist_ok=True)

    async def initialize(self):
        """Initialize the scan manager"""
        logger.info("Initializing ScanManager...")

        # Load any previously completed scans
        await self._load_completed_scans()

        # Initialize the scanner
        await self.scanner.initialize()

        logger.info(f"ScanManager initialized. Loaded {len(self.completed_scans)} completed scans.")

    async def cleanup(self):
        """Cleanup resources"""
        logger.info("Cleaning up ScanManager...")

        # Save completed scans
        await self._save_completed_scans()

        # Cleanup scanner
        await self.scanner.cleanup()

    async def execute_scan(
        self,
        scan_id: str,
        scan_request: ScanRequest,
        websocket_manager
    ):
        """
        Execute a scan in the background with progress tracking
        Preserves all threading optimizations from original scanner
        """
        progress = self.active_scans[scan_id]
        start_time = time.time()

        try:
            # Update progress
            progress.status = "running"
            progress.started_at = datetime.now()
            progress.start_date = scan_request.start_date
            progress.end_date = scan_request.end_date
            progress.message = "Starting scan execution..."

            # Execute the scan using the threaded scanner
            results = await self.scanner.execute_scan(
                start_date=scan_request.start_date,
                end_date=scan_request.end_date,
                filters=scan_request.filters,
                progress_callback=lambda p: self._update_progress(scan_id, p, websocket_manager)
            )

            # Calculate execution time
            execution_time = time.time() - start_time

            # Save results
            results_file = await self._save_results(scan_id, results)

            # Update final progress
            progress.status = "completed"
            progress.completed_at = datetime.now()
            progress.execution_time = execution_time
            progress.progress_percent = 100.0
            progress.results_found = len(results)
            progress.message = f"Scan completed successfully. Found {len(results)} results."

            # Move to completed scans
            self.completed_scans[scan_id] = progress
            del self.active_scans[scan_id]

            # Send completion notification
            await websocket_manager.send_completion(scan_id, {
                "total_results": len(results),
                "execution_time": execution_time,
                "results_file": results_file
            })

            logger.info(f"Scan {scan_id} completed successfully in {execution_time:.2f} seconds with {len(results)} results")

        except Exception as e:
            logger.error(f"Scan {scan_id} failed: {str(e)}", exc_info=True)

            # Update progress with error
            progress.status = "failed"
            progress.completed_at = datetime.now()
            progress.execution_time = time.time() - start_time
            progress.error = str(e)
            progress.message = f"Scan failed: {str(e)}"

            # Move to completed scans
            self.completed_scans[scan_id] = progress
            del self.active_scans[scan_id]

            # Send error notification
            await websocket_manager.send_error(scan_id, str(e))

    async def _update_progress(self, scan_id: str, progress_data: dict, websocket_manager):
        """Update scan progress and notify WebSocket clients"""
        if scan_id not in self.active_scans:
            return

        progress = self.active_scans[scan_id]

        # Update progress fields
        if 'progress_percent' in progress_data:
            # Enforce monotonic progress
            new_progress = max(
                progress.progress_percent,
                min(100, max(0, progress_data['progress_percent']))
            )

            # Only update if actually changing
            if new_progress != progress.progress_percent:
                progress.progress_percent = new_progress

                # Log regression attempts for debugging
                if progress_data['progress_percent'] < progress.progress_percent:
                    logger.warning(
                        f"Progress regression blocked for scan {scan_id}: "
                        f"{progress.progress_percent}% -> {progress_data['progress_percent']}%"
                    )
        if 'current_ticker' in progress_data:
            progress.current_ticker = progress_data['current_ticker']
        if 'total_tickers' in progress_data:
            progress.total_tickers = progress_data['total_tickers']
        if 'processed_tickers' in progress_data:
            progress.processed_tickers = progress_data['processed_tickers']
        if 'message' in progress_data:
            progress.message = progress_data['message']
        if 'results_found' in progress_data:
            progress.results_found = progress_data['results_found']

        # Send update via WebSocket
        await websocket_manager.send_progress_update(scan_id, progress)

    async def get_scan_results(self, scan_id: str) -> List[dict]:
        """Load scan results from storage"""
        results_file = os.path.join(self.results_dir, f"{scan_id}_results.json")

        if not os.path.exists(results_file):
            raise FileNotFoundError(f"Results file not found for scan {scan_id}")

        try:
            with open(results_file, 'r') as f:
                results = json.load(f)
            return results
        except Exception as e:
            logger.error(f"Error loading results for scan {scan_id}: {str(e)}")
            raise

    async def _save_results(self, scan_id: str, results: List[dict]) -> str:
        """Save scan results to storage"""
        results_file = os.path.join(self.results_dir, f"{scan_id}_results.json")

        try:
            # Convert DataFrame to JSON if needed
            if isinstance(results, pd.DataFrame):
                results = results.to_dict('records')

            # Save as JSON
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)

            # Also save as CSV for easy viewing
            csv_file = os.path.join(self.results_dir, f"{scan_id}_results.csv")
            if isinstance(results, list) and results:
                df = pd.DataFrame(results)
                df.to_csv(csv_file, index=False)

            logger.info(f"Results saved for scan {scan_id}: {len(results)} records")
            return results_file

        except Exception as e:
            logger.error(f"Error saving results for scan {scan_id}: {str(e)}")
            raise

    async def _save_completed_scans(self):
        """Save completed scans metadata to storage"""
        metadata_file = os.path.join(self.results_dir, "completed_scans.json")

        try:
            # Convert to JSON-serializable format
            metadata = {}
            for scan_id, progress in self.completed_scans.items():
                metadata[scan_id] = progress.dict()

            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Error saving completed scans metadata: {str(e)}")

    async def _load_completed_scans(self):
        """Load completed scans metadata from storage"""
        metadata_file = os.path.join(self.results_dir, "completed_scans.json")

        if not os.path.exists(metadata_file):
            return

        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)

            for scan_id, progress_data in metadata.items():
                # Convert back to ScanProgress object
                progress = ScanProgress(**progress_data)
                self.completed_scans[scan_id] = progress

            logger.info(f"Loaded {len(self.completed_scans)} completed scans")

        except Exception as e:
            logger.error(f"Error loading completed scans metadata: {str(e)}")

    async def get_universe_info(self) -> dict:
        """Get information about the ticker universe"""
        try:
            return await self.scanner.get_universe_info()
        except Exception as e:
            logger.error(f"Error getting universe info: {str(e)}")
            raise

    def get_scan_status(self, scan_id: str) -> Optional[ScanProgress]:
        """Get current status of a scan"""
        if scan_id in self.active_scans:
            return self.active_scans[scan_id]
        elif scan_id in self.completed_scans:
            return self.completed_scans[scan_id]
        else:
            return None

    def cancel_scan(self, scan_id: str) -> bool:
        """Cancel an active scan"""
        if scan_id not in self.active_scans:
            return False

        try:
            # Update progress
            progress = self.active_scans[scan_id]
            progress.status = "cancelled"
            progress.completed_at = datetime.now()
            progress.message = "Scan cancelled by user"

            # Move to completed scans
            self.completed_scans[scan_id] = progress
            del self.active_scans[scan_id]

            logger.info(f"Scan {scan_id} cancelled")
            return True

        except Exception as e:
            logger.error(f"Error cancelling scan {scan_id}: {str(e)}")
            return False

    def cleanup_old_scans(self, days_old: int = 7):
        """Clean up old scan results and metadata"""
        cutoff_date = datetime.now() - timedelta(days=days_old)

        scans_to_remove = []
        for scan_id, progress in self.completed_scans.items():
            if progress.completed_at and progress.completed_at < cutoff_date:
                scans_to_remove.append(scan_id)

        for scan_id in scans_to_remove:
            try:
                # Remove results files
                results_file = os.path.join(self.results_dir, f"{scan_id}_results.json")
                csv_file = os.path.join(self.results_dir, f"{scan_id}_results.csv")

                for file_path in [results_file, csv_file]:
                    if os.path.exists(file_path):
                        os.remove(file_path)

                # Remove from completed scans
                del self.completed_scans[scan_id]

                logger.info(f"Cleaned up old scan {scan_id}")

            except Exception as e:
                logger.error(f"Error cleaning up scan {scan_id}: {str(e)}")

        if scans_to_remove:
            # Save updated metadata
            asyncio.create_task(self._save_completed_scans())