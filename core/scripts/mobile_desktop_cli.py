#!/usr/bin/env python3
"""
CE-Hub Mobile Desktop CLI
Command-line interface for managing mobile work from desktop

This tool provides desktop commands for reviewing, merging, and managing
mobile work sessions with complete safety and integration.

Commands:
- ce-hub mobile status      # Show mobile session status
- ce-hub mobile list        # List pending mobile work
- ce-hub mobile review {id} # Review specific mobile session
- ce-hub mobile merge {id}  # Merge mobile work safely
- ce-hub mobile reject {id} # Reject mobile work
- ce-hub mobile cleanup     # Clean up old mobile sessions

Author: CE-Hub Master Orchestrator
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import asyncio

# Add CE-Hub scripts to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from mobile_safety_manager import MobileSessionGlobalManager
except ImportError:
    print("❌ Could not import mobile_safety_manager. Please ensure it exists.")
    sys.exit(1)

class MobileMergeAssistant:
    """Assists with safely merging mobile work"""

    def __init__(self, ce_hub_path: Path):
        self.ce_hub_path = ce_hub_path

    async def analyze_mobile_branch(self, branch_name: str) -> Dict[str, Any]:
        """Analyze mobile branch for safety and conflicts"""
        try:
            # Switch to main to compare
            subprocess.run(["git", "checkout", "main"], cwd=self.ce_hub_path, check=True)
            subprocess.run(["git", "pull", "origin", "main"], cwd=self.ce_hub_path, check=True)

            # Get changes summary
            changes = await self.get_branch_changes(branch_name)

            # Check for conflicts
            conflicts = await self.check_merge_conflicts(branch_name)

            # Calculate safety score
            safety_score = await self.calculate_safety_score(changes, conflicts)

            # Get file analysis
            file_analysis = await self.analyze_changed_files(branch_name)

            return {
                "branch_name": branch_name,
                "changes_summary": changes,
                "conflicts": conflicts,
                "safety_score": safety_score,
                "file_analysis": file_analysis,
                "recommended_action": self.get_recommendation(safety_score, conflicts),
                "merge_strategy": self.suggest_merge_strategy(conflicts)
            }

        except Exception as e:
            return {"error": f"Analysis failed: {e}", "safety_score": 0}

    async def get_branch_changes(self, branch_name: str) -> Dict[str, Any]:
        """Get summary of changes in mobile branch"""
        try:
            # Get commit count
            result = subprocess.run([
                "git", "rev-list", "--count", f"main..{branch_name}"
            ], cwd=self.ce_hub_path, capture_output=True, text=True, check=True)

            commit_count = int(result.stdout.strip())

            # Get changed files
            result = subprocess.run([
                "git", "diff", "--name-status", f"main..{branch_name}"
            ], cwd=self.ce_hub_path, capture_output=True, text=True, check=True)

            changed_files = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    status, filename = line.split('\t', 1)
                    changed_files.append({"status": status, "file": filename})

            # Get diff stats
            result = subprocess.run([
                "git", "diff", "--stat", f"main..{branch_name}"
            ], cwd=self.ce_hub_path, capture_output=True, text=True, check=True)

            diff_stats = result.stdout.strip()

            return {
                "commit_count": commit_count,
                "changed_files": changed_files,
                "diff_stats": diff_stats,
                "total_files_changed": len(changed_files)
            }

        except Exception as e:
            return {"error": str(e)}

    async def check_merge_conflicts(self, branch_name: str) -> Dict[str, Any]:
        """Check for potential merge conflicts"""
        try:
            # Test merge without actually merging
            result = subprocess.run([
                "git", "merge-tree", "main", branch_name
            ], cwd=self.ce_hub_path, capture_output=True, text=True)

            if result.returncode == 0 and not result.stdout:
                return {"has_conflicts": False, "clean_merge": True}

            # Parse merge conflicts if any
            conflicts = []
            if result.stdout:
                # This is a simplified conflict detection
                # In practice, you'd want more sophisticated parsing
                conflict_markers = ["<<<<<<<", "=======", ">>>>>>>"]
                if any(marker in result.stdout for marker in conflict_markers):
                    conflicts.append("Potential merge conflicts detected")

            return {
                "has_conflicts": len(conflicts) > 0,
                "conflicts": conflicts,
                "clean_merge": len(conflicts) == 0
            }

        except Exception as e:
            return {"has_conflicts": True, "error": str(e)}

    async def calculate_safety_score(self, changes: Dict, conflicts: Dict) -> float:
        """Calculate safety score (0-1) for mobile work"""
        score = 1.0

        # Reduce score for conflicts
        if conflicts.get("has_conflicts"):
            score -= 0.4

        # Reduce score for many file changes
        file_count = changes.get("total_files_changed", 0)
        if file_count > 10:
            score -= 0.2
        elif file_count > 5:
            score -= 0.1

        # Reduce score for many commits
        commit_count = changes.get("commit_count", 0)
        if commit_count > 5:
            score -= 0.1

        return max(0.0, score)

    async def analyze_changed_files(self, branch_name: str) -> Dict[str, Any]:
        """Analyze what types of files were changed"""
        try:
            result = subprocess.run([
                "git", "diff", "--name-only", f"main..{branch_name}"
            ], cwd=self.ce_hub_path, capture_output=True, text=True, check=True)

            files = result.stdout.strip().split('\n')

            categories = {
                "code_files": [],
                "config_files": [],
                "docs_files": [],
                "other_files": []
            }

            for file in files:
                if not file:
                    continue

                ext = Path(file).suffix.lower()

                if ext in ['.py', '.js', '.ts', '.html', '.css', '.json']:
                    categories["code_files"].append(file)
                elif ext in ['.yml', '.yaml', '.env', '.config']:
                    categories["config_files"].append(file)
                elif ext in ['.md', '.txt', '.rst']:
                    categories["docs_files"].append(file)
                else:
                    categories["other_files"].append(file)

            return categories

        except Exception as e:
            return {"error": str(e)}

    def get_recommendation(self, safety_score: float, conflicts: Dict) -> str:
        """Get recommended action based on analysis"""
        if safety_score >= 0.8 and not conflicts.get("has_conflicts"):
            return "auto_merge_safe"
        elif safety_score >= 0.6 and not conflicts.get("has_conflicts"):
            return "review_then_merge"
        elif conflicts.get("has_conflicts"):
            return "manual_conflict_resolution"
        else:
            return "careful_review_required"

    def suggest_merge_strategy(self, conflicts: Dict) -> str:
        """Suggest merge strategy"""
        if not conflicts.get("has_conflicts"):
            return "fast_forward_merge"
        else:
            return "manual_merge_with_review"

class MobileDesktopCLI:
    """Main CLI class for mobile desktop integration"""

    def __init__(self):
        self.ce_hub_path = Path("/Users/michaeldurante/ai dev/ce-hub")
        self.session_manager = MobileSessionGlobalManager()
        self.merge_assistant = MobileMergeAssistant(self.ce_hub_path)

    async def status(self, args):
        """Show mobile session status"""
        print("📱 CE-Hub Mobile Status")
        print("=" * 40)

        # Active sessions
        active_sessions = self.session_manager.list_active_sessions()
        print(f"\n🟢 Active Mobile Sessions: {len(active_sessions)}")

        for session in active_sessions:
            print(f"  • {session['session_id']} (started: {session['start_time']})")
            print(f"    Branch: {session['branch_name']}")
            print(f"    Workspace: {session['workspace_path']}")

        # Pending reviews
        pending_reviews = self.session_manager.list_pending_reviews()
        print(f"\n📋 Pending Reviews: {len(pending_reviews)}")

        for session in pending_reviews:
            print(f"  • {session['session_id']} (completed: {session.get('end_time', 'unknown')})")
            print(f"    Branch: {session['branch_name']}")
            print(f"    Status: Ready for review")

        if not active_sessions and not pending_reviews:
            print("\n✨ No mobile sessions active or pending")

        print("\n🔧 Available Commands:")
        print("  ce-hub mobile list      # List all mobile work")
        print("  ce-hub mobile review    # Review mobile work")
        print("  ce-hub mobile merge     # Merge mobile work")
        print("  ce-hub mobile cleanup   # Clean up old sessions")

    async def list_sessions(self, args):
        """List all mobile sessions"""
        print("📱 Mobile Work Sessions")
        print("=" * 40)

        pending = self.session_manager.list_pending_reviews()
        active = self.session_manager.list_active_sessions()

        all_sessions = pending + active

        if not all_sessions:
            print("No mobile sessions found.")
            return

        for session in sorted(all_sessions, key=lambda x: x.get('start_time', ''), reverse=True):
            status_emoji = "🟢" if session.get('status') == 'active' else "📋"
            status_text = session.get('status', 'unknown')

            print(f"\n{status_emoji} {session['session_id']}")
            print(f"   Status: {status_text}")
            print(f"   Branch: {session['branch_name']}")
            print(f"   Started: {session.get('start_time', 'unknown')}")

            if session.get('ready_for_review'):
                print(f"   ✅ Ready for review")
                print(f"   Commands:")
                print(f"     ce-hub mobile review {session['session_id']}")
                print(f"     ce-hub mobile merge {session['session_id']}")

    async def review_session(self, args):
        """Review a specific mobile session"""
        if not args.session_id:
            print("❌ Please provide a session ID")
            return

        session_info = self.session_manager.get_session_info(args.session_id)
        if not session_info:
            print(f"❌ Session not found: {args.session_id}")
            return

        print(f"📋 Reviewing Mobile Session: {args.session_id}")
        print("=" * 50)

        # Basic session info
        print(f"Branch: {session_info['branch_name']}")
        print(f"Started: {session_info.get('start_time', 'unknown')}")
        print(f"Status: {session_info.get('status', 'unknown')}")

        # Analyze the branch
        print("\n🔍 Analyzing mobile work...")
        analysis = await self.merge_assistant.analyze_mobile_branch(session_info['branch_name'])

        if 'error' in analysis:
            print(f"❌ Analysis failed: {analysis['error']}")
            return

        # Display analysis results
        print(f"\n📊 Analysis Results:")
        print(f"   Safety Score: {analysis['safety_score']:.2f}/1.0")
        print(f"   Recommendation: {analysis['recommended_action']}")
        print(f"   Merge Strategy: {analysis['merge_strategy']}")

        # Changes summary
        changes = analysis['changes_summary']
        print(f"\n📝 Changes Summary:")
        print(f"   Commits: {changes.get('commit_count', 0)}")
        print(f"   Files Changed: {changes.get('total_files_changed', 0)}")

        # File categories
        file_analysis = analysis['file_analysis']
        if file_analysis and 'error' not in file_analysis:
            print(f"\n📁 File Categories:")
            print(f"   Code files: {len(file_analysis.get('code_files', []))}")
            print(f"   Config files: {len(file_analysis.get('config_files', []))}")
            print(f"   Doc files: {len(file_analysis.get('docs_files', []))}")

        # Conflicts
        conflicts = analysis['conflicts']
        if conflicts.get('has_conflicts'):
            print(f"\n⚠️  Potential Conflicts Detected")
            print(f"   Manual review required before merge")
        else:
            print(f"\n✅ No conflicts detected")

        # Next steps
        print(f"\n🚀 Next Steps:")
        if analysis['recommended_action'] == 'auto_merge_safe':
            print(f"   ✅ Safe to auto-merge")
            print(f"   Command: ce-hub mobile merge {args.session_id}")
        elif analysis['recommended_action'] == 'review_then_merge':
            print(f"   📝 Review changes then merge")
            print(f"   Command: git diff main..{session_info['branch_name']}")
            print(f"   Then: ce-hub mobile merge {args.session_id}")
        else:
            print(f"   ⚠️  Manual review required")
            print(f"   Check conflicts manually before merging")

    async def merge_session(self, args):
        """Merge a mobile session safely"""
        if not args.session_id:
            print("❌ Please provide a session ID")
            return

        session_info = self.session_manager.get_session_info(args.session_id)
        if not session_info:
            print(f"❌ Session not found: {args.session_id}")
            return

        print(f"🔄 Merging Mobile Session: {args.session_id}")
        print("=" * 50)

        # Pre-merge safety check
        print("🛡️ Running safety checks...")
        analysis = await self.merge_assistant.analyze_mobile_branch(session_info['branch_name'])

        if 'error' in analysis:
            print(f"❌ Safety check failed: {analysis['error']}")
            return

        safety_score = analysis['safety_score']
        has_conflicts = analysis['conflicts'].get('has_conflicts', False)

        # Safety confirmation
        if safety_score < 0.6 or has_conflicts:
            print(f"⚠️  Safety Score: {safety_score:.2f}/1.0")
            if has_conflicts:
                print(f"⚠️  Conflicts detected!")

            if not args.force:
                confirm = input("\n🤔 Continue with merge? (y/N): ").lower()
                if confirm != 'y':
                    print("❌ Merge cancelled")
                    return
        else:
            print(f"✅ Safety Score: {safety_score:.2f}/1.0")

        # Create pre-merge backup
        print("\n💾 Creating pre-merge backup...")
        try:
            backup_tag = f"pre-merge-{args.session_id}"
            subprocess.run([
                "git", "tag", backup_tag
            ], cwd=self.ce_hub_path, check=True)
            print(f"✅ Backup created: {backup_tag}")
        except subprocess.CalledProcessError:
            print("⚠️ Backup creation failed, continuing...")

        # Perform merge
        print(f"\n🔀 Merging branch: {session_info['branch_name']}")
        try:
            # Checkout main
            subprocess.run(["git", "checkout", "main"], cwd=self.ce_hub_path, check=True)
            subprocess.run(["git", "pull", "origin", "main"], cwd=self.ce_hub_path, check=True)

            # Merge mobile branch
            subprocess.run([
                "git", "merge", "--no-ff", session_info['branch_name'],
                "-m", f"Merge mobile session {args.session_id}\n\n✅ Merged via CE-Hub Mobile Safety System"
            ], cwd=self.ce_hub_path, check=True)

            print("✅ Merge completed successfully!")

            # Clean up mobile branch
            subprocess.run([
                "git", "branch", "-d", session_info['branch_name']
            ], cwd=self.ce_hub_path, check=True)

            print(f"🧹 Cleaned up mobile branch: {session_info['branch_name']}")

            # Update session status
            session_file = Path(f"/tmp/ce-hub-mobile-sessions/{args.session_id}.json")
            if session_file.exists():
                session_data = json.loads(session_file.read_text())
                session_data['status'] = 'merged'
                session_data['merged_at'] = datetime.now(timezone.utc).isoformat()
                session_file.write_text(json.dumps(session_data, indent=2))

            print(f"\n🎉 Mobile work successfully integrated!")
            print(f"   Session: {args.session_id}")
            print(f"   Rollback available: git reset --hard {backup_tag}")

        except subprocess.CalledProcessError as e:
            print(f"❌ Merge failed: {e}")
            print(f"🔄 Rollback with: git reset --hard HEAD")

    async def reject_session(self, args):
        """Reject/discard a mobile session"""
        if not args.session_id:
            print("❌ Please provide a session ID")
            return

        session_info = self.session_manager.get_session_info(args.session_id)
        if not session_info:
            print(f"❌ Session not found: {args.session_id}")
            return

        print(f"🗑️ Rejecting Mobile Session: {args.session_id}")
        print("=" * 50)

        if not args.force:
            confirm = input(f"⚠️ This will permanently discard mobile work from {args.session_id}. Continue? (y/N): ").lower()
            if confirm != 'y':
                print("❌ Rejection cancelled")
                return

        try:
            # Delete mobile branch
            subprocess.run([
                "git", "branch", "-D", session_info['branch_name']
            ], cwd=self.ce_hub_path, check=False)  # Don't fail if branch doesn't exist

            # Delete remote branch if it exists
            subprocess.run([
                "git", "push", "origin", "--delete", session_info['branch_name']
            ], cwd=self.ce_hub_path, check=False)

            # Update session status
            session_file = Path(f"/tmp/ce-hub-mobile-sessions/{args.session_id}.json")
            if session_file.exists():
                session_data = json.loads(session_file.read_text())
                session_data['status'] = 'rejected'
                session_data['rejected_at'] = datetime.now(timezone.utc).isoformat()
                session_file.write_text(json.dumps(session_data, indent=2))

            print(f"✅ Mobile session rejected: {args.session_id}")
            print(f"🧹 Branch deleted: {session_info['branch_name']}")

        except Exception as e:
            print(f"❌ Rejection failed: {e}")

    async def cleanup_sessions(self, args):
        """Clean up old mobile sessions"""
        print("🧹 Cleaning up old mobile sessions...")

        sessions_path = Path("/tmp/ce-hub-mobile-sessions")
        archives_path = Path("/tmp/ce-hub-mobile-archives")

        cleaned = 0

        # Clean up old session files
        if sessions_path.exists():
            for session_file in sessions_path.glob("*.json"):
                try:
                    session_data = json.loads(session_file.read_text())
                    if session_data.get('status') in ['merged', 'rejected']:
                        session_file.unlink()
                        cleaned += 1
                except:
                    continue

        # Clean up old archives
        if archives_path.exists() and args.deep:
            import shutil
            for archive_dir in archives_path.iterdir():
                if archive_dir.is_dir():
                    shutil.rmtree(archive_dir, ignore_errors=True)
                    cleaned += 1

        print(f"✅ Cleaned up {cleaned} old mobile sessions")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="CE-Hub Mobile Desktop CLI")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Status command
    subparsers.add_parser('status', help='Show mobile session status')

    # List command
    subparsers.add_parser('list', help='List mobile sessions')

    # Review command
    review_parser = subparsers.add_parser('review', help='Review mobile session')
    review_parser.add_argument('session_id', nargs='?', help='Session ID to review')

    # Merge command
    merge_parser = subparsers.add_parser('merge', help='Merge mobile session')
    merge_parser.add_argument('session_id', nargs='?', help='Session ID to merge')
    merge_parser.add_argument('--force', action='store_true', help='Force merge without safety checks')

    # Reject command
    reject_parser = subparsers.add_parser('reject', help='Reject mobile session')
    reject_parser.add_argument('session_id', nargs='?', help='Session ID to reject')
    reject_parser.add_argument('--force', action='store_true', help='Force rejection without confirmation')

    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean up old sessions')
    cleanup_parser.add_argument('--deep', action='store_true', help='Deep cleanup including archives')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Run the command
    cli = MobileDesktopCLI()

    try:
        if args.command == 'status':
            asyncio.run(cli.status(args))
        elif args.command == 'list':
            asyncio.run(cli.list_sessions(args))
        elif args.command == 'review':
            asyncio.run(cli.review_session(args))
        elif args.command == 'merge':
            asyncio.run(cli.merge_session(args))
        elif args.command == 'reject':
            asyncio.run(cli.reject_session(args))
        elif args.command == 'cleanup':
            asyncio.run(cli.cleanup_sessions(args))
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()