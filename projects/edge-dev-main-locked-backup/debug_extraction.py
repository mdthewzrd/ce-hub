#!/usr/bin/env python3
"""
🔍 Debug Scanner Extraction
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from main import extract_scanner_code

# Load test file
test_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

with open(test_file_path, 'r') as f:
    full_code = f.read()

# Try a simpler logical scanner test
scanner_info = {
    "type": "logical_scanner",
    "name": "Simple Test",
    "pattern": "score_atr"  # This should be a simpler pattern
}

print("🔍 Debugging with score_atr pattern...")

try:
    extracted_code = extract_scanner_code(full_code, scanner_info)

    print(f"Extracted code length: {len(extracted_code)}")

    # Save for inspection
    with open("debug_extracted.py", 'w') as f:
        f.write(extracted_code)

    # Check first 50 lines to see the structure
    lines = extracted_code.split('\n')
    print("\nFirst 50 lines of extracted code:")
    print("=" * 50)
    for i, line in enumerate(lines[:50], 1):
        print(f"{i:3d}: {line}")

    # Check for syntax issues around line 226
    print("\nLines around 220-230:")
    print("=" * 30)
    for i in range(220, min(235, len(lines))):
        print(f"{i+1:3d}: {lines[i]}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()