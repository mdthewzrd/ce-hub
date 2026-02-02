#!/usr/bin/env python3
import re

# Read the actual broken file
with open('/Users/michaeldurante/Downloads/Backside_B_scanner (16).py', 'r') as f:
    actual_code = f.read()

print("First 300 characters of actual file:")
print(repr(actual_code[:300]))
print()

# Check for thinking tags
first_line = actual_code.split('\n')[0]
print(f"First line: {repr(first_line)}")

# Use character-by-character check to avoid parsing issues
starts_with_think = actual_code.startswith('<think')
print(f"File starts with '<think': {starts_with_think}")

# Check for opening tag
if '<think' in actual_code:
    print("❌ Found opening think tag in file")
    # Find position
    pos = actual_code.find('<think')
    print(f"   Position: {pos}")
    print(f"   Context: {repr(actual_code[pos:pos+50])}")
else:
    print("✅ No opening think tag found")

# Check for closing tag
close_tag_seq = actual_code[actual_code.find('<'):actual_code.find('<')+20] if '<' in actual_code else ''
has_close = '</think>' in actual_code
print(f"File contains closing think tag: {has_close}")

# Now test the cleaning function
print("\n" + "="*60)
print("Testing enhance_scanner_infrastructure function:")
print("="*60)

# Import the function
import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend')

# Need to import without executing the main block
import importlib.util
spec = importlib.util.spec_from_file_location("intelligent_enhancement",
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/intelligent_enhancement.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

enhance_function = module.enhance_scanner_infrastructure

# Test with the actual file content
cleaned_code = enhance_function(actual_code, pure_execution_mode=True)

print("\nCleaned code (first 300 chars):")
print(repr(cleaned_code[:300]))

# Verify tags are gone
if '<think' in cleaned_code or '</think>' in cleaned_code:
    print("\n❌ FAIL: Thinking tags still present after cleaning")
else:
    print("\n✅ PASS: Thinking tags successfully removed")
