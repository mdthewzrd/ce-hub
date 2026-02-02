"""
Test Pattern Extraction for LC D2 Code

Tests if pattern extraction is working correctly
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main')

from RENATA_V2.core.transformer import RenataTransformer
from RENATA_V2.core.ast_parser import ClassificationResult, ScannerType

# Read the actual LC D2 code
lc_d2_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas_safe_enhanced.py'

with open(lc_d2_file, 'r') as f:
    lc_d2_code = f.read()

print("="*80)
print("Test: Pattern Extraction for LC D2 Code")
print("="*80)

# Create a mock AST result
ast_result = ClassificationResult(
    scanner_type=ScannerType.MULTI_SCANNER,
    confidence='high',
    indicators={'pattern_count': 6}
)

# Create transformer (without AI agent)
from RENATA_V2.core.transformer import RenataTransformer

# Mock the AI agent to avoid API key requirement
class MockAIAgent:
    pass

# Monkey-patch the __init__ to skip AI agent
original_init = RenataTransformer.__init__

def new_init(self, template_dir=None, config=None):
    self.template_dir = template_dir
    self.config = config or {}
    self.parser = None  # Skip parser initialization
    self.validator = None  # Skip validator
    self.template_engine = None  # Skip template engine
    self.ai_agent = MockAIAgent()  # Use mock

RenataTransformer.__init__ = new_init

transformer = RenataTransformer()

print(f"\n📊 AST Classification:")
print(f"   Scanner Type: {ast_result.scanner_type.value}")
print(f"   Confidence: {ast_result.confidence}")
print(f"   Pattern Count: {ast_result.indicators.get('pattern_count', 0)}")

# Test multi-scanner detection
is_multi = transformer._is_multi_scanner(ast_result, lc_d2_code)

print(f"\n🔍 Multi-Scanner Detection:")
print(f"   _is_multi_scanner(): {is_multi}")

# Now test pattern extraction
print("\n" + "="*80)
print("TESTING PATTERN EXTRACTION")
print("="*80)

import re

# Look for pattern assignments like df['lc_frontside_d3'] = ...
pattern_assignment_pattern = r"df\[['\"]([^'\"]+?)['\"]\]\s*=\s*\("

pattern_assignments = []
for match in re.finditer(pattern_assignment_pattern, lc_d2_code):
    pattern_name = match.group(1)
    pattern_assignments.append(pattern_name)

print(f"\n📊 Found {len(pattern_assignments)} pattern assignments:")
for pattern in pattern_assignments[:20]:  # Show first 20
    print(f"  • {pattern}")

if len(pattern_assignments) > 20:
    print(f"  ... and {len(pattern_assignments) - 20} more")

# Check for LC patterns specifically
lc_patterns = [p for p in pattern_assignments if 'lc' in p.lower()]
print(f"\n🔍 LC-specific patterns ({len(lc_patterns)}):")
for pattern in lc_patterns[:10]:
    print(f"  • {pattern}")

# Check for D2/D3/D4 patterns
d_patterns = [p for p in pattern_assignments if 'd2' in p.lower() or 'd3' in p.lower() or 'd4' in p.lower()]
print(f"\n🔍 D2/D3/D4 patterns ({len(d_patterns)}):")
for pattern in d_patterns[:10]:
    print(f"  • {pattern}")

print("\n" + "="*80)
print("ANALYSIS")
print("="*80)

if len(pattern_assignments) == 0:
    print("❌ NO PATTERNS FOUND!")
    print("   This explains why the generated code shows '0 patterns'")
    print("\nPossible issues:")
    print("  1. Pattern assignments use different syntax (not df['pattern'] = ...)")
    print("  2. Pattern logic is in functions instead of direct assignments")
    print("  3. Pattern detection regex is not matching LC D2 pattern syntax")
elif len(pattern_assignments) < 3:
    print(f"⚠️  Only {len(pattern_assignments)} patterns found")
    print("   This might be below the threshold for multi-scanner detection")
else:
    print(f"✅ {len(pattern_assignments)} patterns found")
    print("   This should trigger multi-scanner detection")

print("="*80)
