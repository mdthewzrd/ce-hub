#!/usr/bin/env python3
import json
import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from ai_scanner_service import ai_scanner_service

async def test_scanner_analysis():
    """Test the updated AI scanner analysis with the user's actual file"""

    # Read the actual scanner file
    with open("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py", "r") as f:
        code_content = f.read()

    print(f"🔍 Testing AI Analysis with {len(code_content)} characters")
    print("="*60)

    try:
        # Test AI analysis with updated prompts
        analysis = await ai_scanner_service.analyze_scanner(code_content, "lc d2 scan - oct 25 new ideas (2).py")

        print(f"📊 Analysis Results:")
        print(f"   - Patterns found: {len(analysis.patterns)}")
        print(f"   - Confidence: {analysis.confidence}")
        print(f"   - Total complexity: {analysis.total_complexity}")
        print()

        # Show each pattern found
        for i, pattern in enumerate(analysis.patterns, 1):
            print(f"Pattern {i}: {pattern.name}")
            print(f"  Description: {pattern.description}")
            print(f"  Complexity: {pattern.complexity}")
            print(f"  Parameters: {len(pattern.trading_parameters)}")
            print(f"  Code snippet preview: {pattern.code_snippet[:100]}...")
            print()

        # Check if scoring functions are still being identified
        scoring_patterns = [p for p in analysis.patterns if any(word in p.name.lower()
                          for word in ['parabolic', 'score', 'grade', 'tier', 'filter'])]

        if scoring_patterns:
            print("⚠️  WARNING: Scoring functions still identified as scanners:")
            for pattern in scoring_patterns:
                print(f"   - {pattern.name}")
        else:
            print("✅ SUCCESS: No scoring functions identified as scanners")

        return analysis

    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(test_scanner_analysis())