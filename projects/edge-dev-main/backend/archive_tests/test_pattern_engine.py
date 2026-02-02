#!/usr/bin/env python3
"""
Test the Edge-Dev Pattern Recognition Engine
"""

import asyncio
from edge_dev_pattern_engine import EdgeDevPatternEngine

async def test_pattern_engine():
    print("🧪 TESTING EDGE-DEV PATTERN RECOGNITION ENGINE")
    print("=" * 60)

    # Initialize the pattern engine
    engine = EdgeDevPatternEngine()

    # Load the user's actual scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded user scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    print(f"\n🔍 ANALYZING WITH PATTERN ENGINE...")

    # Test the pattern engine
    try:
        result = engine.analyze_scanner_code(code)

        print(f"✅ ANALYSIS COMPLETE!")
        print(f"📊 Results Summary:")
        print(f"   🎯 Success: {result['success']}")
        print(f"   🔢 Total Scanners: {result['total_scanners']}")
        print(f"   🔧 Total Parameters: {result['total_parameters']}")
        print(f"   📏 Total Complexity: {result['total_complexity']}")
        print(f"   📈 Analysis Confidence: {result['analysis_confidence']:.2f}")
        print(f"   🤖 Method: {result['method']}")

        print(f"\n📋 DETAILED SCANNER BREAKDOWN:")
        if 'scanners' in result:
            for i, scanner in enumerate(result['scanners'], 1):
                name = scanner['scanner_name']
                desc = scanner['description']
                complexity = scanner['complexity']
                param_count = len(scanner['parameters'])
                patterns = scanner.get('patterns_detected', [])

                print(f"\n   📄 Scanner {i}: {name}")
                print(f"      📝 Description: {desc[:100]}...")
                print(f"      📏 Complexity: {complexity}")
                print(f"      🔧 Parameters: {param_count}")
                print(f"      🔍 Patterns: {', '.join(patterns)}")

                if scanner['parameters']:
                    print(f"      🎛️ Parameter Details:")
                    for j, param in enumerate(scanner['parameters'][:5], 1):  # Show first 5
                        name_p = param['name']
                        value = param['current_value']
                        ptype = param['type']
                        category = param['category']
                        priority = param['optimization_priority']
                        print(f"         {j}. {name_p} = {value} ({ptype}, {category}, {priority} priority)")

                    if len(scanner['parameters']) > 5:
                        print(f"         ... and {len(scanner['parameters']) - 5} more parameters")

        print(f"\n📈 PROCESSING NOTES:")
        notes = result.get('processing_notes', {})
        print(f"   🎯 Patterns Detected: {notes.get('patterns_detected', 0)}")
        print(f"   📊 Avg Params per Scanner: {notes.get('avg_params_per_scanner', 0):.1f}")

        complexity_breakdown = notes.get('complexity_breakdown', {})
        print(f"   📏 Complexity Breakdown:")
        for level, count in complexity_breakdown.items():
            print(f"      - {level.title()}: {count} scanners")

        # Compare with expected results
        print(f"\n🎉 COMPARISON WITH USER'S EXPECTED RESULTS:")
        expected_scanners = 3
        if result['total_scanners'] == expected_scanners:
            print(f"   ✅ Scanner Count: PERFECT ({result['total_scanners']}/{expected_scanners})")
        else:
            print(f"   ❌ Scanner Count: MISMATCH ({result['total_scanners']}/{expected_scanners})")

        if result['total_parameters'] >= 15:
            print(f"   ✅ Parameter Extraction: EXCELLENT ({result['total_parameters']} parameters)")
            print(f"   ✅ User's '0 Parameters Made Configurable' issue: FIXED!")
        elif result['total_parameters'] >= 5:
            print(f"   ⚠️ Parameter Extraction: MODERATE ({result['total_parameters']} parameters)")
        else:
            print(f"   ❌ Parameter Extraction: POOR ({result['total_parameters']} parameters)")

        print(f"\n⚡ PERFORMANCE ASSESSMENT:")
        if result['analysis_confidence'] >= 0.9:
            print(f"   ✅ High Confidence Analysis ({result['analysis_confidence']:.2f})")
        elif result['analysis_confidence'] >= 0.7:
            print(f"   ⚠️ Moderate Confidence Analysis ({result['analysis_confidence']:.2f})")
        else:
            print(f"   ❌ Low Confidence Analysis ({result['analysis_confidence']:.2f})")

        # Expected scanners from user's file
        expected_scanner_names = [
            'lc_frontside_d3_extended_1',
            'lc_frontside_d2_extended',
            'lc_fbo'
        ]

        found_names = [s['scanner_name'] for s in result.get('scanners', [])]
        print(f"\n🎯 TARGET SCANNER VALIDATION:")
        for expected_name in expected_scanner_names:
            if expected_name in found_names:
                print(f"   ✅ Found: {expected_name}")
            else:
                print(f"   ❌ Missing: {expected_name}")

        return result

    except Exception as e:
        print(f"❌ PATTERN ENGINE ERROR: {str(e)}")
        import traceback
        print(f"🔍 Full traceback:")
        traceback.print_exc()
        return None

if __name__ == "__main__":
    asyncio.run(test_pattern_engine())