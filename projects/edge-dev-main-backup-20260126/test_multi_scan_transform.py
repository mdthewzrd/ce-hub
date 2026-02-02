"""
Test Multi-Scanner Transformation

This script tests RENATA V2's multi-scanner transformation capabilities
by transforming the LC D2 multi-scanner file.
"""

import os
import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main')

# Set OpenRouter API key
os.environ['OPENROUTER_API_KEY'] = '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'

from RENATA_V2.core.transformer import RenataTransformer

def test_lc_d2_transformation():
    """Test transformation of LC D2 multi-scanner"""

    # Read the LC D2 multi-scanner file
    lc_d2_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (5).py'

    print(f"📂 Reading LC D2 file: {lc_d2_file}")

    with open(lc_d2_file, 'r') as f:
        source_code = f.read()

    print(f"📊 File size: {len(source_code)} characters")
    print(f"📊 Lines: {len(source_code.split(chr(10)))}")

    # Initialize transformer
    transformer = RenataTransformer(
        max_correction_attempts=3,
        template_dir='RENATA_V2/templates'
    )

    # Transform the code
    print("\n" + "="*70)
    print("🚀 STARTING MULTI-SCANNER TRANSFORMATION")
    print("="*70)

    result = transformer.transform(
        source_code=source_code,
        scanner_name="LC_D2_Multi_Scanner",
        date_range="2024-01-01 to 2024-12-31",
        verbose=True
    )

    # Print results
    print("\n" + "="*70)
    print("✅ TRANSFORMATION COMPLETE")
    print("="*70)
    print(f"Success: {result.success}")
    print(f"Corrections: {result.corrections_made}")
    print(f"Errors: {result.errors}")

    # Save the transformed code
    if result.generated_code:
        output_file = '/tmp/lc_d2_multi_transformed.py'
        with open(output_file, 'w') as f:
            f.write(result.generated_code)

        print(f"\n✅ Transformed code saved to: {output_file}")
        print(f"📊 Output size: {len(result.generated_code)} characters")
        print(f"📊 Lines: {len(result.generated_code.split(chr(10)))}")

    return result


if __name__ == "__main__":
    test_lc_d2_transformation()
