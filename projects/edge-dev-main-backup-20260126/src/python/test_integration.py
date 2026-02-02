#!/usr/bin/env python3
"""
Test Renata Rebuild Integration
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from renata_rebuild.processing_engine.code_generator import CodeGenerator
from renata_rebuild.output_validator.output_validator import OutputValidator

print("=" * 70)
print("RENATA REBUILD INTEGRATION TEST")
print("=" * 70)

# Test code
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

print("\n📝 Test Code:")
print("-" * 70)
print(test_code)
print("-" * 70)

# Initialize
print("\n🔧 Initializing components...")
templates_dir = Path(__file__).parent / "renata_rebuild" / "templates"
generator = CodeGenerator(str(templates_dir))
validator = OutputValidator(str(templates_dir))

print("✅ Components initialized")

# Analyze
print("\n🔍 Analyzing code...")
analysis = generator.analyzer.analyze_code(test_code, "test_scanner.py")

print(f"   Scanner Type: {analysis.scanner_type.value}")
print(f"   Structure: {analysis.structure_type.value}")
print(f"   Confidence: {analysis.confidence:.2%}")

# Transform
print("\n🔄 Transforming code...")
result = generator.generate_from_code(test_code, "test_scanner.py")

if result.transformed_code:
    print("✅ Transformation successful!")
    print(f"   Scanner Type: {result.scanner_type.value}")
    print(f"   Parameters Extracted: {len(result.parameters)}")
    print(f"   Changes Made: {len(result.changes_made)}")
    print(f"   Validation Passed: {result.validation_passed}")
    if result.warnings:
        print(f"   Warnings: {len(result.warnings)}")
        for warning in result.warnings[:3]:
            print(f"      • {warning}")
else:
    print("❌ Transformation failed:")
    if result.warnings:
        for warning in result.warnings:
            print(f"   • {warning}")

# Validate
print("\n✓ Validating output...")
validation = validator.validate_all(result.transformed_code, "test_scanner.py")

print(f"   Overall Valid: {validation['valid']}")
print(f"   Syntax Valid: {validation['syntax_valid']}")
print(f"   Structure Valid: {validation['structure_valid']}")
print(f"   Standards Valid: {validation['standards_valid']}")

# Summary
print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print(f"Analysis: {'✅ PASS' if analysis.confidence > 0 else '❌ FAIL'}")
print(f"Transformation: {'✅ PASS' if result.transformed_code else '❌ FAIL'}")
print(f"Validation: {'✅ PASS' if validation['valid'] else '❌ FAIL'}")

overall_pass = analysis.confidence > 0 and result.transformed_code and validation['valid']
print(f"\nOverall: {'✅ ALL TESTS PASSED' if overall_pass else '❌ SOME TESTS FAILED'}")
print("=" * 70)

if overall_pass:
    print("\n🎉 Renata Rebuild integration is working correctly!")
    print("\nNext steps:")
    print("1. Start the API server: ./start_renata_rebuild.sh")
    print("2. Test through Renata Chat in EdgeDev")
    print("3. Format your scanner files!")
else:
    print("\n⚠️ Some tests failed. Check the output above for details.")
