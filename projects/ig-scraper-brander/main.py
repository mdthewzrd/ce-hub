#!/usr/bin/env python3
"""
Instagram Video Scraper & Brand Overlay Tool
Main orchestration script
"""

import json
import logging
from pathlib import Path
import argparse
from datetime import datetime

from scraper import InstagramScraper
from video_processor import VideoProcessor


class InstagramScraperOrchestrator:
    """Main orchestrator for the scraping and processing pipeline."""

    def __init__(self, config_path: str = "config.json"):
        """Initialize with configuration."""
        self.config_path = Path(config_path)
        self.config = self._load_config()

        # Setup logging
        log_config = self.config.get('logging', {})
        if log_config.get('enabled', True):
            logging.basicConfig(
                level=getattr(logging, log_config.get('log_level', 'INFO')),
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                handlers=[
                    logging.FileHandler(log_config.get('log_file', 'scraper.log')),
                    logging.StreamHandler()
                ]
            )

        self.logger = logging.getLogger(__name__)

        # Setup directories
        self.output_dir = Path(self.config['output']['base_directory'])
        self.originals_dir = self.output_dir / self.config['output']['originals_folder']
        self.processed_dir = self.output_dir / self.config['output']['processed_folder']

        # Create directories
        self.originals_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def _load_config(self) -> dict:
        """Load configuration from JSON file."""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Config file not found: {self.config_path}")
            print("Please copy config.example.json to config.json and configure it.")
            raise

    def scrape(self) -> dict:
        """
        Scrape videos from configured Instagram accounts.

        Returns:
            Dictionary with scrape results
        """
        ig_config = self.config['instagram']
        target_accounts = ig_config.get('target_accounts', [])

        if not target_accounts:
            self.logger.error("No target accounts configured in config.json")
            return {"success": False, "error": "No target accounts"}

        self.logger.info(f"Starting scrape from {len(target_accounts)} accounts...")

        # Initialize scraper
        scraper = InstagramScraper(
            username=ig_config['burner_username'],
            password=ig_config['burner_password'],
            config=self.config
        )

        # Login
        if not scraper.login():
            return {"success": False, "error": "Login failed"}

        # Scrape all accounts
        results = scraper.download_from_multiple_profiles(
            profile_names=target_accounts,
            output_dir=self.originals_dir
        )

        self.logger.info(f"Scrape complete. Downloaded {results['total_downloaded']} videos total.")

        return results

    def process_scraped_videos(self) -> dict:
        """
        Process all scraped videos (blur + logo overlay).

        Returns:
            Dictionary with processing results
        """
        self.logger.info("Starting video processing...")

        # Find all downloaded videos
        video_files = list(self.originals_dir.rglob("*.mp4"))

        if not video_files:
            self.logger.warning("No video files found to process")
            return {"success": True, "processed": 0, "message": "No videos found"}

        self.logger.info(f"Found {len(video_files)} videos to process")

        # Initialize processor
        processor = VideoProcessor(self.config)

        # Process batch
        results = processor.process_batch(video_files, self.processed_dir)

        self.logger.info(
            f"Processing complete: {len(results['successful'])} successful, "
            f"{len(results['failed'])} failed"
        )

        return results

    def run_full_pipeline(self) -> dict:
        """
        Run the complete pipeline: scrape then process.

        Returns:
            Dictionary with complete results
        """
        start_time = datetime.now()
        self.logger.info("="*60)
        self.logger.info("Starting full pipeline: scrape + process")
        self.logger.info("="*60)

        # Step 1: Scrape
        scrape_results = self.scrape()
        if not scrape_results.get("success"):
            return {"success": False, "error": "Scraping failed", "details": scrape_results}

        # Step 2: Process
        process_results = self.process_scraped_videos()

        # Summary
        duration = (datetime.now() - start_time).total_seconds()

        summary = {
            "success": True,
            "duration_seconds": duration,
            "scrape_results": scrape_results,
            "process_results": process_results,
            "timestamp": datetime.now().isoformat()
        }

        self.logger.info("="*60)
        self.logger.info(f"Pipeline complete in {duration:.1f} seconds")
        self.logger.info("="*60)

        return summary

    def generate_report(self, results: dict) -> str:
        """Generate a human-readable report from results."""
        report = []
        report.append("="*60)
        report.append("INSTAGRAM SCRAPER & BRANDER - REPORT")
        report.append("="*60)
        report.append(f"Timestamp: {results.get('timestamp', 'N/A')}")
        report.append(f"Duration: {results.get('duration_seconds', 0):.1f} seconds")
        report.append("")

        # Scrape results
        scrape = results.get('scrape_results', {})
        report.append("SCRAPING RESULTS:")
        report.append(f"  Total downloaded: {scrape.get('total_downloaded', 0)} videos")

        for account, account_results in scrape.get('accounts', {}).items():
            report.append(f"\n  @{account}:")
            report.append(f"    Downloaded: {account_results.get('total', 0)}")
            report.append(f"    Failed: {len(account_results.get('failed', []))}")

        # Process results
        process = results.get('process_results', {})
        report.append("\nPROCESSING RESULTS:")
        report.append(f"  Successful: {len(process.get('successful', []))}")
        report.append(f"  Failed: {len(process.get('failed', []))}")

        report.append("")
        report.append("="*60)
        report.append(f"Processed videos saved to: {self.processed_dir}")
        report.append("="*60)

        return "\n".join(report)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Instagram Video Scraper & Brand Overlay Tool"
    )
    parser.add_argument(
        '--config',
        default='config.json',
        help='Path to configuration file (default: config.json)'
    )
    parser.add_argument(
        '--scrape-only',
        action='store_true',
        help='Only scrape, skip video processing'
    )
    parser.add_argument(
        '--process-only',
        action='store_true',
        help='Only process existing videos, skip scraping'
    )
    parser.add_argument(
        '--no-report',
        action='store_true',
        help='Skip printing the report'
    )

    args = parser.parse_args()

    try:
        orchestrator = InstagramScraperOrchestrator(config_path=args.config)

        if args.process_only:
            results = {"process_results": orchestrator.process_scraped_videos()}
        elif args.scrape_only:
            results = {"scrape_results": orchestrator.scrape()}
        else:
            results = orchestrator.run_full_pipeline()

        if not args.no_report:
            print("\n" + orchestrator.generate_report(results))

        # Save results to JSON
        results_file = Path("output") / f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        results_file.parent.mkdir(exist_ok=True)
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)

        print(f"\nResults saved to: {results_file}")

    except Exception as e:
        logging.error(f"Fatal error: {e}")
        raise


if __name__ == "__main__":
    main()
