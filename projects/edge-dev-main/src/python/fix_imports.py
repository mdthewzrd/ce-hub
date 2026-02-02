#!/usr/bin/env python3
"""
Fix imports in renata_rebuild modules for EdgeDev integration
"""

import re
from pathlib import Path

# Directory to fix
base_dir = Path("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/python/renata_rebuild")

# Import replacements
replacements = [
    (r'from knowledge_base\.', 'from renata_rebuild.knowledge_base.'),
    (r'from input_handlers\.', 'from renata_rebuild.input_handlers.'),
    (r'from core_utils\.', 'from renata_rebuild.core_utils.'),
    (r'from processing_engine\.', 'from renata_rebuild.processing_engine.'),
    (r'from output_validator\.', 'from renata_rebuild.output_validator.'),
]

# Files to fix (exclude __init__.py and api_service.py)
python_files = []
for pattern in ['**/*.py']:
    python_files.extend(base_dir.rglob(pattern))

# Filter out specific files
exclude_files = ['__init__.py', 'api_service.py', 'fix_imports.py']
python_files = [f for f in python_files if f.name not in exclude_files]

print(f"Found {len(python_files)} Python files to process")

fixed_count = 0
for py_file in python_files:
    try:
        content = py_file.read_text()
        original_content = content

        # Apply replacements
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)

        # Only write if changed
        if content != original_content:
            py_file.write_text(content)
            fixed_count += 1
            print(f"✅ Fixed: {py_file.relative_to(base_dir)}")
    except Exception as e:
        print(f"❌ Error fixing {py_file}: {e}")

print(f"\n✅ Fixed {fixed_count} files")
