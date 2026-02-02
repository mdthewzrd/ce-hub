#!/usr/bin/env python
"""
Test script for LC D2 multi-scanner transformation
"""
import os
import sys
from pathlib import Path

# Mock the API key for testing
os.environ['OPENROUTER_API_KEY'] = 'test_key_for_testing'

from RENATA_V2.core.transformer import RenataTransformer

def main():
    """Run the transformation"""
    print("="*60)
    print("TESTING LC D2 MULTI-SCANNER TRANSFORMATION")
    print("="*60)

    # Read the source file
    source_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (5).py'
    print(f"\n📂 Reading source file: {source_file}")

    with open(source_file, 'r') as f:
        source_code = f.read()

    print(f"   ✓ Source file loaded: {len(source_code)} characters")

    # Initialize transformer
    print("\n🤖 Initializing RENATA transformer...")
    transformer = RenataTransformer()
    print("   ✓ Transformer initialized")

    # Transform
    print("\n🔄 Running transformation...")
    result = transformer.transform(
        source_code=source_code,
        scanner_name="LC_D2_Multi_Scanner",
        date_range="2024-10-01 to 2024-10-31",
        verbose=True
    )

    print("\n" + "="*60)
    print("TRANSFORMATION COMPLETE!")
    print("="*60)

    # Save output
    output_file = '/Users/michaeldurante/Downloads/LC_D2_Multi_Scanner_V31.py'
    print(f"\n💾 Saving output to: {output_file}")

    with open(output_file, 'w') as f:
        f.write(result.generated_code)

    print(f"   ✓ Output saved: {len(result.generated_code)} characters")

    # Print summary
    print(f"\n📊 SUMMARY:")
    print(f"   Transformation completed successfully!")
    print(f"   Output file: {output_file}")
    if hasattr(result, 'metadata') and result.metadata:
        print(f"   Scanner type: {result.metadata.get('scanner_type', 'unknown')}")
        print(f"   Stages completed: {', '.join(result.metadata.get('stages_completed', []))}")

    return output_file

if __name__ == '__main__':
    try:
        output_file = main()
        print(f"\n✅ SUCCESS! Output saved to: {output_file}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
