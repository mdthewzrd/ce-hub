#!/usr/bin/env python3
"""
Debug script to check scanner_code_storage contents
"""

import sys
import os

# Add the backend directory to the path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend')

# Import the backend module to check storage
try:
    import backside_b_scan as backend

    print("🔍 Debugging scanner_code_storage...")
    print(f"📊 Projects in storage: {len(backend.projects_storage)}")
    print(f"📁 Scanner codes in storage: {len(backend.scanner_code_storage)}")
    print(f"🔑 Scanner storage keys: {list(backend.scanner_code_storage.keys())}")

    # Show project details
    for project in backend.projects_storage:
        project_id = project['id']
        has_code = project_id in backend.scanner_code_storage
        code_length = len(backend.scanner_code_storage.get(project_id, '')) if has_code else 0
        print(f"  Project {project_id}: {project['name']} - Has code: {has_code} ({code_length} chars)")

        if has_code:
            code_preview = backend.scanner_code_storage[project_id][:200]
            print(f"    Code preview: {code_preview}...")

    # Test which project should have real execution
    if backend.scanner_code_storage:
        print("\n✅ Some projects have scanner code - they should execute in 3-8 seconds")
    else:
        print("\n🚨 CRITICAL: No scanner code found in storage!")
        print("   This means ALL executions will fall back to fake instant results")
        print("   The bug is that uploaded scanners are not being stored properly")

except ImportError as e:
    print(f"❌ Cannot import backend module: {e}")
except Exception as e:
    print(f"❌ Error debugging storage: {e}")