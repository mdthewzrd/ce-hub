"""
Debug Template Selection for LC D2 Code

Tests if LC D2 scan is correctly classified to use generic transformation
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main')

from RENATA_V2.core.transformer import RenataTransformer, StrategySpec
from RENATA_V2.core.models import StrategyType

# Read the actual LC D2 code
lc_d2_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas_safe_enhanced.py'

with open(lc_d2_file, 'r') as f:
    lc_d2_code = f.read()

print("="*80)
print("Debug: Template Selection for LC D2 Code")
print("="*80)

# Create transformer
transformer = RenataTransformer()

# Create AST result
ast_result = transformer._parse_source_code(lc_d2_code)

print(f"\n📊 AST Classification:")
print(f"   Scanner Type: {ast_result.scanner_type.value}")
print(f"   Confidence: {ast_result.confidence}")

# Test template selection
strategy = StrategySpec(
    name='LC_D2_Test',
    description='LC D2 scanner test',
    strategy_type=StrategyType.OTHER,
    entry_conditions=[],
    exit_conditions=[],
    parameters={},
    timeframe='daily',
    rationale='Test scanner',
    scanner_type='multi'
)

template_name = transformer._select_template(ast_result, strategy, lc_d2_code)

print(f"\n🎯 SELECTED TEMPLATE: {template_name}")
print("="*80)

if template_name == 'v31_hybrid':
    print("❌ BUG: Selected 'v31_hybrid' (Backside B transformation)")
    print("   This will REPLACE LC D2 code with Backside B code!")
elif template_name == 'v31_generic':
    print("✅ CORRECT: Selected 'v31_generic' (generic transformation)")
    print("   This will PRESERVE LC D2 code with v31 architecture")
elif template_name == 'v31_hybrid_multi':
    print("⚠️  Selected 'v31_hybrid_multi' (multi-scanner transformation)")
    print("   This is for multi-pattern scanners")
else:
    print(f"❓ Selected: {template_name}")

print("="*80)

# Test the classification checks
print("\n🔍 Classification Checks:")
print("-" * 80)

is_standalone = transformer._is_standalone_scanner(ast_result, lc_d2_code)
is_multi = transformer._is_multi_scanner(ast_result, lc_d2_code)

print(f"   _is_standalone_scanner(): {is_standalone}")
print(f"   _is_multi_scanner(): {is_multi}")

print("\n" + "="*80)
print("EXPECTED BEHAVIOR:")
print("="*80)
print("LC D2 code should:")
print("  - NOT be classified as standalone (Backside B)")
print("  - NOT be classified as multi-scanner")
print("  - Use 'v31_generic' transformation")
print("  - Preserve original LC D2 logic")
print("="*80)
