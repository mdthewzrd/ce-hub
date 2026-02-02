"""
Test Complete Generic v31 Transformation

Tests the new generic v31 transformation that:
1. Extracts parameters from ANY code
2. Extracts detection logic from ANY code
3. Wraps in complete 5-stage v31 pipeline
4. Uses extracted parameters for smart filtering
5. Implements proper D0 date filtering
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/RENATA_V2')

from core.transformer import Transformer, StrategySpec

# Create a simple test scanner (NOT Backside Para B)
test_code = '''
# Simple RSI oversold scanner
P = {
    "price_min": 10.0,
    "rsi_oversold": 30
}

def scan_rsi_oversold(df):
    """Scan for RSI oversold conditions"""
    results = []

    for ticker, group in df.groupby('ticker'):
        group = group.sort_values('date')

        # Filter to D0 range
        d0_start = "2024-01-01"
        d0_end = "2024-12-31"
        group_d0 = group[group['date'].between(d0_start, d0_end)]

        for idx, row in group_d0.iterrows():
            if row['rsi'] < P['rsi_oversold'] and row['close'] >= P['price_min']:
                results.append({
                    'ticker': ticker,
                    'date': row['date'],
                    'close': row['close'],
                    'rsi': row['rsi']
                })

    return pd.DataFrame(results)

if __name__ == "__main__":
    # Test with sample data
    scan_rsi_oversold(df)
'''

print("="*80)
print("Testing Generic v31 Transformation")
print("="*80)

# Create transformer
transformer = Transformer()

# Create strategy spec
strategy = StrategySpec(
    name='TestRSIScanner',
    description='Simple RSI oversold scanner',
    parameters={'price_min': 10.0, 'rsi_oversold': 30}
)

# Generate transformation
print("\n📊 Applying generic v31 transformation...")

result = transformer.generate_with_validation(
    source_code=test_code,
    scanner_name='TestRSIScanner',
    strategy=strategy,
    date_range='2024-01-01 to 2024-12-31',
    template_name='v31_generic'
)

print("\n✅ TRANSFORMATION COMPLETE!")
print("="*80)

# Check for key components
checks = {
    'Has 5-stage pipeline': 'Stage 1:' in result and 'Stage 2a:' in result and 'Stage 3a:' in result,
    'Has smart filters': 'apply_smart_filters' in result,
    'Has historical/D0 separation': 'df_historical' in result and 'df_output_range' in result,
    'Has parameter extraction': 'detected_params' in result or 'self.params' in result,
    'Has parallel processing': 'ThreadPoolExecutor' in result,
    'Has per-ticker operations': 'groupby' in result,
    'Has D0 filtering': 'd0_start_dt' in result and 'd0_end_dt' in result,
    'Preserves original code': 'scan_rsi_oversold' in result or 'RSI' in result,
    'Uses fetch_all_grouped_data': 'fetch_all_grouped_data' in result,
    'Has v31 pillars comment': 'TRUE v31 Architecture' in result
}

print("\n📋 Transformation Checks:")
print("-" * 80)
for check, passed in checks.items():
    status = "✅" if passed else "❌"
    print(f"{status} {check}")

# Summary
all_passed = all(checks.values())
print("\n" + "="*80)
if all_passed:
    print("✅ ALL CHECKS PASSED!")
    print("\nThe generic v31 transformation now includes:")
    print("  • Complete 5-stage pipeline")
    print("  • Smart filtering based on extracted parameters")
    print("  • Historical/D0 data separation")
    print("  • Parallel processing")
    print("  • Full v31 architecture")
    print("  • Original detection logic preserved")
else:
    print("❌ SOME CHECKS FAILED")
    failed = [k for k, v in checks.items() if not v]
    print(f"Failed checks: {failed}")

print("="*80)

# Show sample of generated code
print("\n📊 Sample of Generated Code (first 2000 chars):")
print("-" * 80)
print(result[:2000])
print("..." if len(result) > 2000 else "")
