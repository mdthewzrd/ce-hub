#!/usr/bin/env python3
"""
CE-Hub Weekly Archon Ingestion System
Archon-First Protocol compliant knowledge ingestion for chat summaries
"""

import os
import sys
import yaml
import json
import argparse
import logging
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import glob

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

class WeeklyIngest:
    """Weekly Archon MCP ingestion system for chat summaries"""

    def __init__(self, config_path: Optional[str] = None):
        self.project_root = Path(__file__).parent.parent
        self.config_path = config_path or self.project_root / "config" / "chat_config.yml"
        self.config = self._load_config()
        self._setup_logging()

        # Initialize paths
        self.summaries_dir = self.project_root / "chats" / "summaries"
        self.summaries_dir.mkdir(parents=True, exist_ok=True)

        # Archon MCP configuration
        self.archon_config = self.config.get('archon', {})
        self.archon_host = self.archon_config.get('host', 'localhost')
        self.archon_port = self.archon_config.get('port', 8051)
        self.archon_timeout = self.archon_config.get('timeout', 30)
        self.retry_attempts = self.archon_config.get('retry_attempts', 3)
        self.retry_delay = self.archon_config.get('retry_delay', 2)

    def _load_config(self) -> Dict:
        """Load configuration with fallback defaults"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.error(f"Configuration file not found: {self.config_path}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict:
        """Get default configuration"""
        return {
            'default_project': 'ce-hub',
            'archon': {
                'host': 'localhost',
                'port': 8051,
                'timeout': 30
            },
            'file_management': {
                'summary_batch_size': 10
            }
        }

    def _setup_logging(self):
        """Setup logging configuration"""
        log_config = self.config.get('logging', {})
        log_file = self.project_root / log_config.get('file', 'chats/chat_system.log')
        log_file.parent.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=getattr(logging, log_config.get('level', 'INFO')),
            format=log_config.get('format', '[%(asctime)s] %(levelname)s: %(message)s'),
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def check_archon_connection(self) -> bool:
        """Test Archon MCP connection"""
        try:
            # Test basic connectivity
            url = f"http://{self.archon_host}:{self.archon_port}/health"
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            self.logger.warning(f"Archon connection check failed: {e}")
            return False

    def find_summaries(self, project: Optional[str] = None, since_days: int = 7) -> List[Path]:
        """Find summary files for ingestion"""
        project = project or self.config['default_project']
        cutoff_date = datetime.now() - timedelta(days=since_days)

        # Pattern for summary files
        if project:
            pattern = f"*__{project}__*__S*.md"
        else:
            pattern = "*__*__*__S*.md"

        summary_files = []
        for file_path in self.summaries_dir.glob(pattern):
            try:
                # Check file modification time
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if mtime >= cutoff_date:
                    # Check if ready for ingestion
                    if self._is_ready_for_ingestion(file_path):
                        summary_files.append(file_path)
            except Exception as e:
                self.logger.warning(f"Error processing {file_path}: {e}")

        # Sort by modification time (oldest first)
        summary_files.sort(key=lambda x: x.stat().st_mtime)

        self.logger.info(f"Found {len(summary_files)} summaries for ingestion")
        return summary_files

    def _is_ready_for_ingestion(self, file_path: Path) -> bool:
        """Check if summary is ready for Archon ingestion"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Parse frontmatter
            if not content.startswith('---'):
                return False

            parts = content.split('---', 2)
            if len(parts) < 3:
                return False

            metadata = yaml.safe_load(parts[1])
            return metadata.get('ready_for_ingestion', False)

        except Exception as e:
            self.logger.warning(f"Error checking ingestion readiness for {file_path}: {e}")
            return False

    def extract_summary_metadata(self, file_path: Path) -> Dict:
        """Extract metadata and content from summary file"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Parse frontmatter
            if not content.startswith('---'):
                raise ValueError("No frontmatter found")

            parts = content.split('---', 2)
            if len(parts) < 3:
                raise ValueError("Invalid frontmatter format")

            metadata = yaml.safe_load(parts[1])
            body_content = parts[2].strip()

            # Extract key information for Archon
            summary_data = {
                'title': metadata.get('topic', 'Chat Summary'),
                'content': body_content,
                'metadata': {
                    'source_file': str(file_path.name),
                    'project': metadata.get('project', 'unknown'),
                    'topic': metadata.get('topic', 'unknown'),
                    'created': metadata.get('summary_created', datetime.now().isoformat()),
                    'type': 'chat_summary',
                    'ce_hub_version': '2.0'
                },
                'tags': self._extract_tags(metadata)
            }

            return summary_data

        except Exception as e:
            self.logger.error(f"Error extracting metadata from {file_path}: {e}")
            raise

    def _extract_tags(self, metadata: Dict) -> List[str]:
        """Extract and standardize tags for Archon ingestion"""
        # Start with configured tags
        tags = metadata.get('tags', [])

        # Ensure required tags
        required_tags = ['type:summary', 'scope:project']
        for tag in required_tags:
            if tag not in tags:
                tags.append(tag)

        # Add project tag
        project = metadata.get('project')
        if project:
            project_tag = f'project:{project}'
            if project_tag not in tags:
                tags.append(project_tag)

        # Add stage tag
        if 'stage:weekly' not in tags:
            tags.append('stage:weekly')

        return tags

    def ingest_to_archon(self, summary_data: Dict, dry_run: bool = False) -> Optional[str]:
        """Ingest summary into Archon knowledge graph via MCP"""
        if dry_run:
            self.logger.info(f"DRY RUN - Would ingest: {summary_data['title']}")
            self.logger.info(f"Tags: {summary_data['tags']}")
            self.logger.info(f"Content preview: {summary_data['content'][:200]}...")
            return "dry-run-source-id"

        if not self.check_archon_connection():
            self.logger.error("Archon connection failed, skipping ingestion")
            return None

        try:
            # Prepare MCP ingestion payload
            payload = {
                'method': 'ingest_knowledge',
                'params': {
                    'title': summary_data['title'],
                    'content': summary_data['content'],
                    'metadata': summary_data['metadata'],
                    'tags': summary_data['tags'],
                    'source_type': 'ce_hub_chat_summary'
                }
            }

            # Make MCP call to Archon
            url = f"http://{self.archon_host}:{self.archon_port}/mcp/ingest"
            response = requests.post(
                url,
                json=payload,
                timeout=self.archon_timeout,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 200:
                result = response.json()
                source_id = result.get('source_id')
                self.logger.info(f"Successfully ingested: {summary_data['title']} -> {source_id}")
                return source_id
            else:
                self.logger.error(f"Archon ingestion failed: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            self.logger.error(f"Error during Archon ingestion: {e}")
            return None

    def mark_ingested(self, file_path: Path, source_id: str):
        """Mark summary file as successfully ingested"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Update frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    metadata = yaml.safe_load(parts[1])
                    metadata['ingested_to_archon'] = True
                    metadata['archon_source_id'] = source_id
                    metadata['ingestion_date'] = datetime.now().isoformat()

                    updated_content = f"---\n{yaml.dump(metadata, default_flow_style=False)}---{parts[2]}"

                    with open(file_path, 'w') as f:
                        f.write(updated_content)

                    self.logger.info(f"Marked as ingested: {file_path.name}")

        except Exception as e:
            self.logger.warning(f"Could not mark file as ingested: {e}")

    def run_weekly_ingestion(self, project: Optional[str] = None, since_days: int = 7, dry_run: bool = False) -> Dict:
        """Run complete weekly ingestion process"""
        self.logger.info(f"Starting weekly ingestion process (project: {project}, since: {since_days}d, dry_run: {dry_run})")

        results = {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'source_ids': [],
            'errors': []
        }

        # Find summaries to process
        summary_files = self.find_summaries(project, since_days)

        if not summary_files:
            self.logger.info("No summaries found for ingestion")
            return results

        # Process batch size
        batch_size = self.config.get('file_management', {}).get('summary_batch_size', 10)

        for i, file_path in enumerate(summary_files[:batch_size]):
            try:
                self.logger.info(f"Processing ({i+1}/{len(summary_files[:batch_size])}): {file_path.name}")

                # Extract summary data
                summary_data = self.extract_summary_metadata(file_path)

                # Ingest to Archon
                source_id = self.ingest_to_archon(summary_data, dry_run)

                results['processed'] += 1

                if source_id:
                    results['successful'] += 1
                    results['source_ids'].append(source_id)

                    # Mark as ingested (unless dry run)
                    if not dry_run:
                        self.mark_ingested(file_path, source_id)
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to ingest: {file_path.name}")

            except Exception as e:
                results['processed'] += 1
                results['failed'] += 1
                error_msg = f"Error processing {file_path.name}: {e}"
                results['errors'].append(error_msg)
                self.logger.error(error_msg)

        # Log summary
        self.logger.info(f"Ingestion complete: {results['successful']}/{results['processed']} successful")
        if results['errors']:
            self.logger.warning(f"Errors encountered: {len(results['errors'])}")

        return results

def main():
    """Command line interface for weekly ingestion"""
    parser = argparse.ArgumentParser(description="CE-Hub Weekly Archon Ingestion System")
    parser.add_argument('--project', help='Specific project to ingest')
    parser.add_argument('--since', type=int, default=7, help='Days to look back for summaries (default: 7)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be ingested without actually doing it')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()

    # Initialize ingestion system
    ingest_system = WeeklyIngest()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Run ingestion
        results = ingest_system.run_weekly_ingestion(
            project=args.project,
            since_days=args.since,
            dry_run=args.dry_run
        )

        # Print results
        print(f"\n📊 **Ingestion Results:**")
        print(f"- Processed: {results['processed']}")
        print(f"- Successful: {results['successful']}")
        print(f"- Failed: {results['failed']}")

        if results['source_ids']:
            print(f"\n🔗 **Source IDs:**")
            for source_id in results['source_ids']:
                print(f"  - {source_id}")

        if results['errors']:
            print(f"\n❌ **Errors:**")
            for error in results['errors']:
                print(f"  - {error}")

        if args.dry_run:
            print(f"\n💡 **This was a dry run - no actual ingestion performed**")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()