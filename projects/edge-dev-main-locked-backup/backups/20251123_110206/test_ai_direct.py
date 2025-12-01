#!/usr/bin/env python3
"""
Direct test of AI scanner analysis functionality
"""
import asyncio
import sys
sys.path.insert(0, '.')
from ai_scanner_service_fixed import ai_scanner_service_fixed

async def test_ai_direct():
    try:
        # Read the user's scanner file
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()

        print(f'🧪 Testing AI Scanner Analysis (Direct)')
        print(f'📄 File size: {len(code):,} characters')

        # Test AI analysis directly
        result = await ai_scanner_service_fixed.split_scanner_intelligent(code, 'lc d2 scan - oct 25 new ideas (2).py')

        print(f'✅ AI Analysis Complete')
        print(f'📊 Success: {result["success"]}')
        print(f'🔢 Total scanners: {result["total_scanners"]}')

        if result["success"] and "scanners" in result:
            total_params = sum(len(scanner.get("parameters", [])) for scanner in result["scanners"])
            print(f'🔧 Total parameters: {total_params}')
            for i, scanner in enumerate(result["scanners"], 1):
                params = len(scanner.get("parameters", []))
                print(f'   {i}. {scanner["scanner_name"]} - {params} parameters')

            if total_params >= 15:
                print(f'🎉 EXCELLENT: Parameter extraction working! ({total_params} parameters)')
                print(f'✅ User\'s "0 Parameters Made Configurable" issue should be FIXED!')
            elif total_params >= 5:
                print(f'⚠️ MODERATE: Some parameters extracted ({total_params}) but could be more')
            else:
                print(f'❌ POOR: Insufficient parameters extracted ({total_params})')
        else:
            print(f'❌ Error: {result.get("error", "Unknown error")}')

    except Exception as e:
        print(f'❌ Exception: {str(e)}')

if __name__ == "__main__":
    asyncio.run(test_ai_direct())