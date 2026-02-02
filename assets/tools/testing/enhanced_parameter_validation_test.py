#!/usr/bin/env python3
"""
Enhanced Parameter Discovery Validation Test
============================================

This test validates that the enhanced AST-based parameter discovery system
can properly extract the critical parameters that were missed in previous tests,
including complex Boolean conditions, array values, and default parameters.

Test Targets:
- atr_mult >= 3 conditions
- [20, 18, 15, 12] scoring arrays
- default=0 fallback values
- Complex np.select patterns
- Scanner type classification accuracy

Expected Improvements:
- From 50% to 90%+ parameter extraction accuracy
- Proper handling of complex conditions
- Complete array value extraction
- Accurate scanner type detection
"""

import sys
import os
import asyncio
import json
import time
from pathlib import Path

# Add the backend path to sys.path
backend_path = Path(__file__).parent / "edge-dev" / "backend"
sys.path.insert(0, str(backend_path))

from core.enhanced_parameter_discovery import enhanced_parameter_extractor

def load_test_file(file_path: str) -> str:
    """Load test scanner file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Failed to load test file {file_path}: {e}")
        return ""

def validate_lc_d2_parameters(parameters, extraction_result):
    """Validate that critical LC D2 parameters were extracted"""

    # Critical parameters we expect to find
    expected_critical_params = {
        'atr_mult_conditions': {
            'description': 'ATR multiplier threshold conditions (>=3, >=2, >=1, >=0.5)',
            'values': [3, 2, 1, 0.5],
            'found': False
        },
        'scoring_arrays': {
            'description': 'Scoring arrays like [20, 18, 15, 12]',
            'values': [[20, 18, 15, 12], [30, 25, 20, 15], [20, 17.5, 15, 12.5, 10], [10, 8, 5, 2], [15, 10, 5]],
            'found': False
        },
        'default_values': {
            'description': 'Default fallback values (0, 10)',
            'values': [0, 10],
            'found': False
        },
        'np_select_patterns': {
            'description': 'Complex np.select conditional patterns',
            'values': ['np.select'],
            'found': False
        }
    }

    validation_results = {
        'total_parameters': len(parameters),
        'critical_parameters_found': 0,
        'parameter_details': [],
        'missing_critical': [],
        'accuracy_score': 0.0
    }

    print(f"\n🔍 VALIDATION: Analyzing {len(parameters)} extracted parameters")

    # Check each parameter against expected critical patterns
    for param in parameters:
        param_detail = {
            'name': param['name'] if isinstance(param, dict) else param.name,
            'value': param['value'] if isinstance(param, dict) else param.value,
            'type': param['type'] if isinstance(param, dict) else param.type,
            'confidence': param['confidence'] if isinstance(param, dict) else param.confidence,
            'complexity': param.get('complexity_level', 'unknown') if isinstance(param, dict) else getattr(param, 'complexity_level', 'unknown'),
            'is_critical': False
        }

        # Check for ATR multiplier conditions
        if ('atr' in param_detail['name'].lower() or
            (isinstance(param_detail['value'], (int, float)) and param_detail['value'] in [3, 2, 1, 0.5])):
            expected_critical_params['atr_mult_conditions']['found'] = True
            param_detail['is_critical'] = True
            print(f"✅ CRITICAL: Found ATR condition - {param_detail['name']}: {param_detail['value']}")

        # Check for scoring arrays
        if (isinstance(param_detail['value'], list) and len(param_detail['value']) > 2):
            for expected_array in expected_critical_params['scoring_arrays']['values']:
                if param_detail['value'] == expected_array:
                    expected_critical_params['scoring_arrays']['found'] = True
                    param_detail['is_critical'] = True
                    print(f"✅ CRITICAL: Found scoring array - {param_detail['name']}: {param_detail['value']}")
                    break

        # Check for default values
        if ('default' in param_detail['name'].lower() and
            isinstance(param_detail['value'], (int, float)) and
            param_detail['value'] in [0, 10]):
            expected_critical_params['default_values']['found'] = True
            param_detail['is_critical'] = True
            print(f"✅ CRITICAL: Found default value - {param_detail['name']}: {param_detail['value']}")

        # Check for np.select patterns
        if ('select' in param_detail['name'].lower() or param_detail['type'] == 'condition'):
            expected_critical_params['np_select_patterns']['found'] = True
            param_detail['is_critical'] = True
            print(f"✅ CRITICAL: Found np.select pattern - {param_detail['name']}: {param_detail['value']}")

        validation_results['parameter_details'].append(param_detail)
        if param_detail['is_critical']:
            validation_results['critical_parameters_found'] += 1

    # Identify missing critical parameters
    for param_name, param_info in expected_critical_params.items():
        if not param_info['found']:
            validation_results['missing_critical'].append({
                'name': param_name,
                'description': param_info['description'],
                'expected_values': param_info['values']
            })
            print(f"❌ MISSING: {param_name} - {param_info['description']}")

    # Calculate accuracy score
    critical_found = sum(1 for p in expected_critical_params.values() if p['found'])
    total_critical = len(expected_critical_params)
    validation_results['accuracy_score'] = (critical_found / total_critical) * 100

    return validation_results

def test_lc_d2_scanner():
    """Test parameter extraction on LC D2 scanner"""
    print("🚀 TESTING: LC D2 Scanner Parameter Extraction")
    print("=" * 60)

    # Load the problematic LC D2 scanner file
    test_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"
    code = load_test_file(test_file_path)

    if not code:
        print("❌ Test file not found or empty")
        return

    print(f"📂 Loaded file: {test_file_path}")
    print(f"📏 File size: {len(code)} characters")

    # Extract parameters using enhanced system
    print("\n🔬 Starting enhanced parameter extraction...")
    start_time = time.time()

    try:
        result = enhanced_parameter_extractor.extract_parameters(code)
        extraction_time = time.time() - start_time

        print(f"⏱️ Extraction completed in {extraction_time:.2f} seconds")
        print(f"✅ Success: {result.success}")
        print(f"📊 Scanner Type: {result.scanner_type}")
        print(f"🎯 Confidence Score: {result.confidence_score:.2f}")
        print(f"🔢 Total Parameters: {len(result.parameters)}")

        if hasattr(result, 'extraction_methods_used'):
            print(f"🛠️ Methods Used: {result.extraction_methods_used}")

        if hasattr(result, 'complexity_analysis'):
            print(f"🧩 Complexity Analysis: {result.complexity_analysis}")

        print(f"\n💡 AI Suggestions:")
        for suggestion in result.suggestions:
            print(f"   • {suggestion}")

        # Validate parameters
        print(f"\n🔍 PARAMETER VALIDATION")
        print("=" * 40)

        validation_results = validate_lc_d2_parameters(result.parameters, result)

        print(f"\n📈 VALIDATION SUMMARY:")
        print(f"   Total Parameters Found: {validation_results['total_parameters']}")
        print(f"   Critical Parameters Found: {validation_results['critical_parameters_found']}")
        print(f"   Missing Critical Parameters: {len(validation_results['missing_critical'])}")
        print(f"   Accuracy Score: {validation_results['accuracy_score']:.1f}%")

        # Detailed parameter breakdown
        print(f"\n📋 DETAILED PARAMETER BREAKDOWN:")
        for param in validation_results['parameter_details']:
            status = "🟢 CRITICAL" if param['is_critical'] else "🔵 Standard"
            print(f"   {status} | {param['name']:<25} | {str(param['value']):<15} | {param['type']:<12} | {param['confidence']:.2f} | {param['complexity']}")

        # Missing parameters analysis
        if validation_results['missing_critical']:
            print(f"\n❌ MISSING CRITICAL PARAMETERS:")
            for missing in validation_results['missing_critical']:
                print(f"   • {missing['name']}: {missing['description']}")
                print(f"     Expected: {missing['expected_values']}")

        # Success criteria check
        print(f"\n🎯 SUCCESS CRITERIA CHECK:")
        if validation_results['accuracy_score'] >= 90:
            print(f"✅ PASSED: Accuracy {validation_results['accuracy_score']:.1f}% meets 90% target")
        else:
            print(f"❌ FAILED: Accuracy {validation_results['accuracy_score']:.1f}% below 90% target")

        if validation_results['critical_parameters_found'] >= 3:
            print(f"✅ PASSED: Found {validation_results['critical_parameters_found']} critical parameters")
        else:
            print(f"❌ FAILED: Only found {validation_results['critical_parameters_found']} critical parameters")

        if result.scanner_type in ['lc_d2_scanner', 'lc_scanner']:
            print(f"✅ PASSED: Correctly identified as {result.scanner_type}")
        else:
            print(f"❌ FAILED: Incorrectly identified as {result.scanner_type}")

        return {
            'extraction_result': result,
            'validation_results': validation_results,
            'test_passed': validation_results['accuracy_score'] >= 90
        }

    except Exception as e:
        print(f"❌ Extraction failed with error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_sc_dmr_scanner():
    """Test parameter extraction on SC DMR scanner"""
    print("\n\n🚀 TESTING: SC DMR Scanner Parameter Extraction")
    print("=" * 60)

    # Load the SC DMR scanner file
    test_file_path = "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py"
    code = load_test_file(test_file_path)

    if not code:
        print("❌ Test file not found or empty")
        return

    print(f"📂 Loaded file: {test_file_path}")
    print(f"📏 File size: {len(code)} characters")

    # Extract parameters
    print("\n🔬 Starting enhanced parameter extraction...")
    start_time = time.time()

    try:
        result = enhanced_parameter_extractor.extract_parameters(code)
        extraction_time = time.time() - start_time

        print(f"⏱️ Extraction completed in {extraction_time:.2f} seconds")
        print(f"✅ Success: {result.success}")
        print(f"📊 Scanner Type: {result.scanner_type}")
        print(f"🎯 Confidence Score: {result.confidence_score:.2f}")
        print(f"🔢 Total Parameters: {len(result.parameters)}")

        return result

    except Exception as e:
        print(f"❌ Extraction failed with error: {e}")
        return None

def main():
    """Main test execution"""
    print("🧪 Enhanced Parameter Discovery Validation Test Suite")
    print("=" * 80)
    print("Testing the enhanced AST-based parameter extraction system")
    print("against real-world scanner files that showed poor extraction results.\n")

    # Test 1: LC D2 Scanner (primary target)
    lc_d2_results = test_lc_d2_scanner()

    # Test 2: SC DMR Scanner (secondary validation)
    sc_dmr_results = test_sc_dmr_scanner()

    # Overall test summary
    print("\n\n🏁 OVERALL TEST SUMMARY")
    print("=" * 40)

    if lc_d2_results:
        if lc_d2_results['test_passed']:
            print("✅ LC D2 Scanner: PASSED - Enhanced extraction successful")
        else:
            print("❌ LC D2 Scanner: FAILED - Needs further improvement")

    if sc_dmr_results:
        print(f"📊 SC DMR Scanner: {sc_dmr_results.confidence_score:.1f}% confidence")

    print("\n🎯 Next Steps:")
    print("• Integrate enhanced system with frontend interface")
    print("• Add human-in-the-loop confirmation workflow")
    print("• Test with additional scanner types")
    print("• Deploy to production environment")

if __name__ == "__main__":
    main()