#!/usr/bin/env python3
"""
Script to clear all projects from the backend
This will temporarily move the projects directory so the API returns empty results
"""

import os
import shutil
import sys
from pathlib import Path

def clear_projects():
    """Clear all projects by temporarily moving the projects directory"""

    # Backend projects directory
    projects_dir = Path("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/projects")
    backup_dir = projects_dir.parent / "projects_backup"

    try:
        if projects_dir.exists():
            print(f"📁 Found projects directory: {projects_dir}")

            # Create backup if it doesn't exist
            if not backup_dir.exists():
                backup_dir.mkdir(exist_ok=True)
                print(f"📦 Created backup directory: {backup_dir}")

            # Move all project directories to backup
            moved_count = 0
            for item in projects_dir.iterdir():
                if item.is_dir() and item.name != ".gitkeep":
                    target = backup_dir / item.name
                    if target.exists():
                        shutil.rmtree(target)
                    shutil.move(str(item), str(target))
                    moved_count += 1
                    print(f"  ✅ Moved project: {item.name}")

            print(f"\n🎯 SUCCESS: Moved {moved_count} projects to backup")
            print("🔄 The backend should now return 0 projects")

            # Keep the directory structure
            keep_file = projects_dir / ".gitkeep"
            if not keep_file.exists():
                keep_file.touch()
                print("📄 Created .gitkeep to maintain directory structure")

        else:
            print("❌ Projects directory not found")

    except Exception as e:
        print(f"❌ Error clearing projects: {e}")
        return False

    return True

def restore_projects():
    """Restore all projects from backup"""

    projects_dir = Path("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/projects")
    backup_dir = projects_dir.parent / "projects_backup"

    try:
        if backup_dir.exists():
            print(f"📦 Restoring projects from: {backup_dir}")

            restored_count = 0
            for item in backup_dir.iterdir():
                if item.is_dir():
                    target = projects_dir / item.name
                    if target.exists():
                        shutil.rmtree(target)
                    shutil.move(str(item), str(target))
                    restored_count += 1
                    print(f"  ✅ Restored project: {item.name}")

            print(f"\n🎯 SUCCESS: Restored {restored_count} projects")

        else:
            print("❌ Backup directory not found")

    except Exception as e:
        print(f"❌ Error restoring projects: {e}")
        return False

    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        print("🔄 Restoring projects...")
        restore_projects()
    else:
        print("🗑️  Clearing projects...")
        clear_projects()