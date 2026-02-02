#!/usr/bin/env python3
"""
CE-Hub Monthly Pruning System
Automated archival and cleanup for chat knowledge system
"""

import os
import sys
import yaml
import argparse
import logging
import shutil
import gzip
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import calendar

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

class MonthlyPrune:
    """Monthly archival and pruning system for CE-Hub chat knowledge"""

    def __init__(self, config_path: Optional[str] = None):
        self.project_root = Path(__file__).parent.parent
        self.config_path = config_path or self.project_root / "config" / "chat_config.yml"
        self.config = self._load_config()
        self._setup_logging()

        # Initialize paths
        self.chats_dir = self.project_root / "chats"
        self.active_dir = self.chats_dir / "active"
        self.summaries_dir = self.chats_dir / "summaries"
        self.archive_dir = self.chats_dir / "archive"

        # Ensure directories exist
        for dir_path in [self.active_dir, self.summaries_dir, self.archive_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

        # Configuration
        self.retention_days = self.config.get('file_management', {}).get('active_retention_days', 30)
        self.enable_compression = self.config.get('file_management', {}).get('archive_compression', False)
        self.backup_before_prune = self.config.get('file_management', {}).get('backup_before_prune', True)

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
            'file_management': {
                'active_retention_days': 30,
                'archive_compression': False,
                'backup_before_prune': True
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

    def find_old_chats(self, project: Optional[str] = None, cutoff_days: Optional[int] = None) -> List[Path]:
        """Find chat files older than retention period"""
        cutoff_days = cutoff_days or self.retention_days
        cutoff_date = datetime.now() - timedelta(days=cutoff_days)

        pattern = f"*__{project}__*.md" if project else "*.md"
        old_files = []

        for file_path in self.active_dir.glob(pattern):
            try:
                # Check file modification time
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if mtime < cutoff_date:
                    old_files.append(file_path)
            except Exception as e:
                self.logger.warning(f"Error checking {file_path}: {e}")

        # Sort by modification time (oldest first)
        old_files.sort(key=lambda x: x.stat().st_mtime)

        self.logger.info(f"Found {len(old_files)} chat files older than {cutoff_days} days")
        return old_files

    def extract_chat_info(self, file_path: Path) -> Dict:
        """Extract metadata from chat file"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Parse frontmatter
            metadata = {}
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    metadata = yaml.safe_load(parts[1]) or {}

            # Extract info from filename
            filename_parts = file_path.stem.split('__')
            file_info = {
                'date': filename_parts[0] if len(filename_parts) > 0 else 'unknown',
                'project': filename_parts[1] if len(filename_parts) > 1 else 'unknown',
                'topic': filename_parts[2] if len(filename_parts) > 2 else 'unknown',
                'version': filename_parts[3] if len(filename_parts) > 3 else 'v1'
            }

            return {
                'metadata': metadata,
                'file_info': file_info,
                'has_summary': self._check_for_summary(file_path),
                'file_size': file_path.stat().st_size,
                'modified': datetime.fromtimestamp(file_path.stat().st_mtime)
            }

        except Exception as e:
            self.logger.warning(f"Error extracting info from {file_path}: {e}")
            return {
                'metadata': {},
                'file_info': {'project': 'unknown', 'topic': 'unknown'},
                'has_summary': False,
                'file_size': 0,
                'modified': datetime.now()
            }

    def _check_for_summary(self, chat_file: Path) -> bool:
        """Check if a summary exists for the chat file"""
        # Extract topic from filename
        filename_parts = chat_file.stem.split('__')
        if len(filename_parts) >= 3:
            project = filename_parts[1]
            topic = filename_parts[2]

            # Look for summary file
            pattern = f"*__{project}__{topic}*__S*.md"
            matches = list(self.summaries_dir.glob(pattern))
            return len(matches) > 0

        return False

    def create_monthly_archive_dir(self, archive_date: datetime) -> Path:
        """Create monthly archive directory"""
        year_month = archive_date.strftime("%Y-%m")
        archive_path = self.archive_dir / year_month
        archive_path.mkdir(parents=True, exist_ok=True)
        return archive_path

    def archive_chat_file(self, file_path: Path, archive_dir: Path, compress: bool = False) -> bool:
        """Archive a single chat file"""
        try:
            destination = archive_dir / file_path.name

            if compress:
                # Compress and archive
                compressed_dest = archive_dir / f"{file_path.name}.gz"
                with open(file_path, 'rb') as f_in:
                    with gzip.open(compressed_dest, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                destination = compressed_dest
            else:
                # Copy without compression
                shutil.copy2(file_path, destination)

            self.logger.info(f"Archived: {file_path.name} -> {destination}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to archive {file_path}: {e}")
            return False

    def ensure_summary_exists(self, chat_file: Path, chat_info: Dict, dry_run: bool = False) -> bool:
        """Ensure summary exists before archiving chat"""
        if chat_info['has_summary']:
            return True

        # Create minimal summary for archival
        topic = chat_info['file_info']['topic']
        project = chat_info['file_info']['project']

        summary_filename = f"{datetime.now().strftime('%Y-%m-%d')}__{project}__{topic}__S01.md"
        summary_path = self.summaries_dir / summary_filename

        if dry_run:
            self.logger.info(f"DRY RUN - Would create summary: {summary_path}")
            return True

        try:
            # Create basic summary
            summary_content = self._create_archival_summary(chat_file, chat_info)

            with open(summary_path, 'w') as f:
                f.write(summary_content)

            self.logger.info(f"Created archival summary: {summary_path}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to create summary for {chat_file}: {e}")
            return False

    def _create_archival_summary(self, chat_file: Path, chat_info: Dict) -> str:
        """Create minimal summary for archival purposes"""
        metadata = chat_info['metadata']
        file_info = chat_info['file_info']

        # Create summary frontmatter
        summary_frontmatter = {
            'topic': metadata.get('topic', file_info['topic']),
            'project': metadata.get('project', file_info['project']),
            'original_created': metadata.get('created', 'unknown'),
            'summary_created': datetime.now().isoformat(),
            'type': 'archival_summary',
            'scope': 'project',
            'archived': True,
            'original_file': chat_file.name,
            'tags': [
                'type:summary',
                'scope:project',
                f'project:{file_info["project"]}',
                'stage:archival'
            ]
        }

        summary_body = f"""# Archival Summary: {file_info['topic']}

## Overview
- **Project**: {file_info['project']}
- **Original File**: {chat_file.name}
- **File Size**: {chat_info['file_size']} bytes
- **Last Modified**: {chat_info['modified'].strftime('%Y-%m-%d %H:%M')}
- **Archive Date**: {datetime.now().strftime('%Y-%m-%d')}

## Archive Notes
This is an automatically generated summary created during the monthly archival process.
The original chat file has been moved to the archive directory.

## Technical Details
- Archival Process: Monthly automated cleanup
- Summary Type: Minimal archival record
- Created by: CE-Hub monthly_prune.py
- Archive Location: chats/archive/{chat_info['modified'].strftime('%Y-%m')}/
"""

        return f"---\n{yaml.dump(summary_frontmatter, default_flow_style=False)}---\n\n{summary_body}"

    def run_monthly_prune(self, project: Optional[str] = None, cutoff_days: Optional[int] = None,
                         dry_run: bool = False, force: bool = False) -> Dict:
        """Run complete monthly pruning process"""
        self.logger.info(f"Starting monthly pruning process (project: {project}, cutoff: {cutoff_days or self.retention_days}d, dry_run: {dry_run})")

        results = {
            'processed': 0,
            'archived': 0,
            'failed': 0,
            'summaries_created': 0,
            'bytes_archived': 0,
            'errors': []
        }

        # Find old chat files
        old_files = self.find_old_chats(project, cutoff_days)

        if not old_files:
            self.logger.info("No files found for archival")
            return results

        # Create backup if enabled
        if self.backup_before_prune and not dry_run:
            backup_success = self._create_backup()
            if not backup_success and not force:
                raise Exception("Backup failed and force=False. Aborting pruning.")

        # Group files by month for archival
        monthly_groups = {}
        for file_path in old_files:
            try:
                chat_info = self.extract_chat_info(file_path)
                archive_month = chat_info['modified'].replace(day=1)

                if archive_month not in monthly_groups:
                    monthly_groups[archive_month] = []
                monthly_groups[archive_month].append((file_path, chat_info))

            except Exception as e:
                results['errors'].append(f"Error processing {file_path.name}: {e}")

        # Process each monthly group
        for archive_month, file_group in monthly_groups.items():
            try:
                # Create monthly archive directory
                archive_dir = self.create_monthly_archive_dir(archive_month)
                self.logger.info(f"Processing {len(file_group)} files for {archive_month.strftime('%Y-%m')}")

                for file_path, chat_info in file_group:
                    try:
                        results['processed'] += 1

                        # Ensure summary exists
                        if not self.ensure_summary_exists(file_path, chat_info, dry_run):
                            if not force:
                                results['errors'].append(f"No summary for {file_path.name}, skipping")
                                continue
                        else:
                            if not chat_info['has_summary']:
                                results['summaries_created'] += 1

                        if not dry_run:
                            # Archive the file
                            if self.archive_chat_file(file_path, archive_dir, self.enable_compression):
                                results['archived'] += 1
                                results['bytes_archived'] += chat_info['file_size']

                                # Remove original file
                                file_path.unlink()
                                self.logger.info(f"Removed original: {file_path.name}")
                            else:
                                results['failed'] += 1
                        else:
                            self.logger.info(f"DRY RUN - Would archive: {file_path.name}")
                            results['archived'] += 1

                    except Exception as e:
                        results['failed'] += 1
                        error_msg = f"Error archiving {file_path.name}: {e}"
                        results['errors'].append(error_msg)
                        self.logger.error(error_msg)

                # Compress archive directory if enabled
                if self.enable_compression and not dry_run and results['archived'] > 0:
                    self._compress_archive_directory(archive_dir)

            except Exception as e:
                error_msg = f"Error processing monthly group {archive_month}: {e}"
                results['errors'].append(error_msg)
                self.logger.error(error_msg)

        # Log summary
        self.logger.info(f"Pruning complete: {results['archived']}/{results['processed']} archived")
        if results['errors']:
            self.logger.warning(f"Errors encountered: {len(results['errors'])}")

        return results

    def _create_backup(self) -> bool:
        """Create backup of active chats before pruning"""
        try:
            backup_name = f"backup_active_chats_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            backup_path = self.chats_dir / backup_name

            shutil.copytree(self.active_dir, backup_path)
            self.logger.info(f"Created backup: {backup_path}")
            return True

        except Exception as e:
            self.logger.error(f"Backup failed: {e}")
            return False

    def _compress_archive_directory(self, archive_dir: Path):
        """Compress entire archive directory"""
        try:
            archive_tarball = archive_dir.with_suffix('.tar.gz')
            shutil.make_archive(str(archive_dir), 'gztar', archive_dir)

            # Remove original directory after compression
            shutil.rmtree(archive_dir)
            self.logger.info(f"Compressed archive: {archive_tarball}")

        except Exception as e:
            self.logger.warning(f"Failed to compress archive directory: {e}")

def main():
    """Command line interface for monthly pruning"""
    parser = argparse.ArgumentParser(description="CE-Hub Monthly Pruning System")
    parser.add_argument('--project', help='Specific project to prune')
    parser.add_argument('--cutoff-days', type=int, help='Days to look back for archival (default: from config)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be archived without actually doing it')
    parser.add_argument('--force', action='store_true', help='Force archival even without summaries or backup failures')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()

    # Initialize pruning system
    prune_system = MonthlyPrune()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Run pruning
        results = prune_system.run_monthly_prune(
            project=args.project,
            cutoff_days=args.cutoff_days,
            dry_run=args.dry_run,
            force=args.force
        )

        # Print results
        print(f"\n📊 **Pruning Results:**")
        print(f"- Processed: {results['processed']}")
        print(f"- Archived: {results['archived']}")
        print(f"- Failed: {results['failed']}")
        print(f"- Summaries Created: {results['summaries_created']}")
        print(f"- Bytes Archived: {results['bytes_archived']:,}")

        if results['errors']:
            print(f"\n❌ **Errors:**")
            for error in results['errors']:
                print(f"  - {error}")

        if args.dry_run:
            print(f"\n💡 **This was a dry run - no actual archival performed**")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()