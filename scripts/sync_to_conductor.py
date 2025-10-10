#!/usr/bin/env python3
"""
CE-Hub Conductor Sync Script
Sync local development changes to GitHub repository for Conductor access
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class ConductorSync:
    """Sync local CE-Hub development to GitHub repository"""

    def __init__(self):
        self.local_dev = Path("/Users/michaeldurante/ai dev/ce-hub")
        self.github_repo = Path("/Users/michaeldurante/ce-hub")

        # Files/directories to exclude from sync
        self.exclude_patterns = {
            '.git',
            '__pycache__',
            '*.pyc',
            '*.log',
            'chats/chat_system.log',
            '.DS_Store',
            'temp/',
            'tmp/',
            'chats/active/*temp*',
            'chats/summaries/*temp*'
        }

    def check_paths(self):
        """Verify both paths exist"""
        if not self.local_dev.exists():
            print(f"❌ Local development path not found: {self.local_dev}")
            return False

        if not self.github_repo.exists():
            print(f"❌ GitHub repository path not found: {self.github_repo}")
            return False

        if not (self.github_repo / ".git").exists():
            print(f"❌ Not a Git repository: {self.github_repo}")
            return False

        return True

    def should_exclude(self, path):
        """Check if file/directory should be excluded"""
        name = path.name
        return (
            name.startswith('.git') or
            name == '__pycache__' or
            name.endswith('.pyc') or
            name.endswith('.log') or
            name == '.DS_Store' or
            'temp' in name.lower()
        )

    def sync_files(self, dry_run=False):
        """Sync files from local development to GitHub repo"""
        print(f"🔄 Syncing from:")
        print(f"   📁 {self.local_dev}")
        print(f"   📁 {self.github_repo}")
        print()

        synced_count = 0

        for item in self.local_dev.rglob('*'):
            if self.should_exclude(item):
                continue

            # Calculate relative path
            rel_path = item.relative_to(self.local_dev)
            target_path = self.github_repo / rel_path

            if item.is_file():
                # Check if file needs updating
                needs_update = False

                if not target_path.exists():
                    needs_update = True
                    action = "CREATE"
                else:
                    # Compare modification times
                    if item.stat().st_mtime > target_path.stat().st_mtime:
                        needs_update = True
                        action = "UPDATE"

                if needs_update:
                    if dry_run:
                        print(f"   {action}: {rel_path}")
                    else:
                        # Ensure target directory exists
                        target_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(item, target_path)
                        print(f"   ✅ {action}: {rel_path}")
                    synced_count += 1

            elif item.is_dir():
                # Ensure directory exists
                if not target_path.exists():
                    if dry_run:
                        print(f"   CREATE DIR: {rel_path}/")
                    else:
                        target_path.mkdir(parents=True, exist_ok=True)
                        print(f"   📁 CREATE DIR: {rel_path}/")

        return synced_count

    def git_status(self):
        """Check Git status of repository"""
        try:
            os.chdir(self.github_repo)
            result = subprocess.run(['git', 'status', '--porcelain'],
                                  capture_output=True, text=True)
            return result.stdout.strip()
        except Exception as e:
            print(f"❌ Error checking Git status: {e}")
            return None

    def git_commit_and_push(self, message=None):
        """Commit and push changes to GitHub"""
        try:
            os.chdir(self.github_repo)

            # Add all changes
            subprocess.run(['git', 'add', '-A'], check=True)

            # Create commit message
            if not message:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
                message = f"Sync from local development - {timestamp}\n\n🧠 Generated with Claude Code\nCo-Authored-By: Claude <noreply@anthropic.com>"

            # Commit
            result = subprocess.run(['git', 'commit', '-m', message],
                                  capture_output=True, text=True)

            if result.returncode == 0:
                print(f"   ✅ Committed changes")

                # Push to GitHub
                push_result = subprocess.run(['git', 'push'],
                                           capture_output=True, text=True)

                if push_result.returncode == 0:
                    print(f"   🚀 Pushed to GitHub")
                    return True
                else:
                    print(f"   ❌ Push failed: {push_result.stderr}")
                    return False
            else:
                if "nothing to commit" in result.stdout:
                    print(f"   ℹ️  No changes to commit")
                    return True
                else:
                    print(f"   ❌ Commit failed: {result.stderr}")
                    return False

        except Exception as e:
            print(f"❌ Git operation failed: {e}")
            return False

    def run_sync(self, commit_message=None, dry_run=False, push=True):
        """Run complete sync process"""
        print("🔄 CE-Hub Conductor Sync")
        print("=" * 40)

        if not self.check_paths():
            return False

        # Sync files
        synced_count = self.sync_files(dry_run)

        if dry_run:
            print(f"\n💡 DRY RUN: Would sync {synced_count} files/directories")
            return True

        if synced_count == 0:
            print("\n✅ All files are up to date")

            # Still check for git changes
            status = self.git_status()
            if status and push:
                print("\n📝 Found uncommitted changes, committing...")
                return self.git_commit_and_push(commit_message)
            return True

        print(f"\n✅ Synced {synced_count} files/directories")

        # Commit and push to GitHub
        if push:
            print("\n📝 Committing and pushing to GitHub...")
            return self.git_commit_and_push(commit_message)

        return True

def main():
    """Command line interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Sync CE-Hub local development to GitHub repository")
    parser.add_argument('--dry-run', action='store_true', help='Show what would be synced without doing it')
    parser.add_argument('--no-push', action='store_true', help='Sync files but do not commit/push to GitHub')
    parser.add_argument('--message', '-m', help='Custom commit message')

    args = parser.parse_args()

    sync = ConductorSync()
    success = sync.run_sync(
        commit_message=args.message,
        dry_run=args.dry_run,
        push=not args.no_push
    )

    if success:
        if not args.dry_run:
            print(f"\n🎉 Sync complete! Conductor can now access the latest changes.")
            print(f"   GitHub: https://github.com/mdthewzrd/ce-hub")
        sys.exit(0)
    else:
        print(f"\n❌ Sync failed")
        sys.exit(1)

if __name__ == "__main__":
    main()