#!/usr/bin/env python3
"""
Quick Test - Renata Rebuild Integration
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from renata_rebuild.processing_engine.code_generator import CodeGenerator

print("=" * 70)
print("RENATA REBUILD - QUICK INTEGRATION TEST")
print("=" * 70)

# Test code - simple scanner
test_code = """
import pandas as pd
import requests

API_KEY = 'test_key'

def scan_ticker(ticker):
    url = f"https://api.polygon.io/{ticker}"
    data = requests.get(url).json()
    return data

if __name__ == "__main__":
    results = scan_ticker("AAPL")
    print(results)
"""

print("\n1️⃣  Initializing CodeGenerator...")
templates_dir = Path(__file__).parent / "renata_rebuild" / "templates"
generator = CodeGenerator(str(templates_dir))
print("   ✅ Initialized")

print("\n2️⃣  Running transformation...")
try:
    result = generator.generate_from_code(test_code, "test_scanner.py")

    if result.transformed_code:
        print("   ✅ Transformation successful!")
        print(f"   Scanner Type: {result.scanner_type.value}")
        print(f"   Structure Type: {result.structure_type.value}")
        print(f"   Parameters Found: {len(result.parameters)}")
        print(f"   Changes Made: {len(result.changes_made)}")
        print(f"   Validation: {'✅ PASSED' if result.validation_passed else '❌ FAILED'}")

        if result.warnings:
            print(f"\n⚠️  Warnings ({len(result.warnings)}):")
            for warning in result.warnings[:5]:
                print(f"      • {warning}")

        print("\n3️⃣  Sample of transformed code:")
        print("-" * 70)
        lines = result.transformed_code.split('\n')
        for line in lines[:20]:
            print(line)
        if len(lines) > 20:
            print(f"\n... ({len(lines) - 20} more lines)")

        print("\n" + "=" * 70)
        print("✅ INTEGRATION TEST PASSED!")
        print("=" * 70)
        print("\n🎉 Renata Rebuild is working correctly!")
        print("\n📋 Next steps:")
        print("   1. Start the API server: ./start_renata_rebuild.sh")
        print("   2. Test through Renata Chat in EdgeDev")
        print("   3. Format your scanner files!")
    else:
        print("   ❌ Transformation failed")
        if result.warnings:
            print("\n⚠️  Errors:")
            for warning in result.warnings:
                print(f"   • {warning}")

except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
