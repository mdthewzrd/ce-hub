#!/usr/bin/env python3
"""
Test the current issue to understand what's still broken
"""
import asyncio
import aiohttp
import json

async def test_current_api_state():
    """Test the current state of the API"""
    print("🔧 TESTING CURRENT API STATE")
    print("=" * 70)

    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Testing LC file: {len(code)} characters")

        # Test analyze endpoint multiple times to check for intermittent issues
        for i in range(5):
            print(f"\n🧪 Test {i+1}/5:")

            url = "http://localhost:8000/api/format/analyze-code"
            payload = {"code": code}

            async with aiohttp.ClientSession() as session:
                try:
                    async with session.post(url, json=payload) as response:
                        print(f"   Status: {response.status}")

                        if response.status == 200:
                            result = await response.json()
                            print(f"   Scanner type: {result.get('scanner_type', 'Unknown')}")
                            print(f"   Confidence: {result.get('confidence', 0)}")

                            if result.get('confidence', 0) == 100:
                                print("   ✅ 100% confidence achieved!")
                            else:
                                print(f"   ❌ Still {result.get('confidence', 0)}% confidence")
                        else:
                            error_text = await response.text()
                            print(f"   ❌ Error: {error_text[:200]}...")

                except Exception as e:
                    print(f"   ❌ Exception: {e}")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def check_syntax_issue():
    """Check what might be causing the syntax error"""
    print(f"\n🔍 CHECKING SYNTAX ISSUE")
    print("=" * 70)

    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()

        print(f"📄 Checking syntax around line 14:")
        start_line = max(0, 14-5)
        end_line = min(len(lines), 14+5)

        for i in range(start_line, end_line):
            line_num = i + 1
            line_content = lines[i].rstrip()
            marker = " >>> " if line_num == 14 else "     "
            print(f"{marker}Line {line_num:2d}: {line_content}")

        print(f"\n🔍 Checking for common syntax issues:")
        print(f"   - Encoding: {repr(lines[13][:50]) if len(lines) > 13 else 'N/A'}")
        print(f"   - Line 14 length: {len(lines[13]) if len(lines) > 13 else 0}")

        # Check for potential issues
        if len(lines) > 13:
            line14 = lines[13]
            if '\t' in line14:
                print(f"   - Contains tabs: Yes")
            if not line14.strip():
                print(f"   - Empty line: Yes")
            if line14.endswith('\\\n'):
                print(f"   - Line continuation: Yes")

        return True

    except Exception as e:
        print(f"❌ Syntax check failed: {e}")
        return False

async def main():
    """Test current issues"""
    print("🔧 DIAGNOSING CURRENT ISSUES")
    print("=" * 70)
    print("Testing API state and syntax issues")
    print()

    # Test API state
    await test_current_api_state()

    # Check syntax issue
    await check_syntax_issue()

    print("\n" + "=" * 70)
    print("🎯 ISSUE SUMMARY")
    print("=" * 70)
    print("1. Detection fix may be working but intermittent 500 errors persist")
    print("2. Syntax error at line 14 during execution needs investigation")
    print("3. May need to check execution engine for code processing issues")

if __name__ == "__main__":
    asyncio.run(main())