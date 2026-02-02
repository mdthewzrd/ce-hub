#!/usr/bin/env python3
"""
🔍 Debug LC D2 Scanner Issues - Simple Analysis
================================================

Analyze the LC D2 scanner code to find specific issues without running it.
"""

import re
import ast

def analyze_lc_d2_structure():
    """Analyze LC D2 scanner structure without executing"""

    print("🔍 Analyzing LC D2 Scanner Structure")
    print("=" * 60)

    # Load the LC D2 scanner
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    with open(lc_d2_file, 'r') as f:
        code = f.read()

    print(f"📄 Code length: {len(code)} characters")

    # 1. Check pattern detection criteria
    print(f"\n🎯 Pattern Detection Check:")
    has_async_main = 'async def main(' in code
    has_dates = 'DATES' in code
    has_asyncio_run = 'asyncio.run(main())' in code

    print(f"   async def main(: {has_async_main}")
    print(f"   DATES variable: {has_dates}")
    print(f"   asyncio.run(main()): {has_asyncio_run}")
    print(f"   → Pattern 5 match: {has_async_main and has_dates and has_asyncio_run}")

    # 2. Look for result variable assignments
    print(f"\n📊 Result Variable Analysis:")
    expected_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']

    for var in expected_vars:
        # Look for variable assignments
        pattern = rf'{var}\s*='
        matches = re.findall(pattern, code)
        if matches:
            print(f"   ✅ Found assignments to '{var}': {len(matches)} times")
        else:
            print(f"   ❌ No assignments to '{var}' found")

    # 3. Look for ANY variable assignments that might contain results
    print(f"\n🔍 All Variable Assignments:")
    # Find all variable assignments
    assignments = re.findall(r'(\w+)\s*=\s*(?!.*def |.*class |.*import )', code)
    assignment_counts = {}
    for var in assignments:
        if not var.startswith('_') and var not in ['i', 'j', 'k', 'x', 'y', 'z']:  # Skip obvious loop vars
            assignment_counts[var] = assignment_counts.get(var, 0) + 1

    # Show top assigned variables
    sorted_assignments = sorted(assignment_counts.items(), key=lambda x: x[1], reverse=True)
    print(f"   Top variable assignments:")
    for var, count in sorted_assignments[:10]:
        print(f"     {var}: {count} assignments")

    # 4. Check for DataFrame operations
    print(f"\n📈 DataFrame Operations:")
    df_operations = [
        'pd.DataFrame',
        'df.append',
        'df.concat',
        'to_dict(',
        '.empty',
        '.shape'
    ]

    for op in df_operations:
        count = code.count(op)
        if count > 0:
            print(f"   {op}: {count} occurrences")

    # 5. Look for print statements or result handling
    print(f"\n🖨️ Output/Results Handling:")
    output_patterns = [
        'print(',
        'tabulate(',
        'webbrowser.open',
        'to_csv(',
        'to_excel('
    ]

    for pattern in output_patterns:
        count = code.count(pattern)
        if count > 0:
            print(f"   {pattern}: {count} occurrences")

    # 6. Check main function structure
    print(f"\n🔧 Main Function Analysis:")
    try:
        # Extract main function body
        main_match = re.search(r'async def main\(\):(.*?)(?=\n\w|\nif __name__|$)', code, re.DOTALL)
        if main_match:
            main_body = main_match.group(1)
            print(f"   Main function body length: {len(main_body)} characters")

            # Look for return statements
            return_statements = re.findall(r'return\s+(.+)', main_body)
            if return_statements:
                print(f"   Return statements: {len(return_statements)}")
                for i, ret in enumerate(return_statements[:3]):
                    print(f"     {i+1}: return {ret.strip()}")
            else:
                print(f"   No return statements found")

            # Check if main function assigns to global variables
            global_assignments = []
            for var in expected_vars:
                if f'{var} =' in main_body:
                    global_assignments.append(var)

            if global_assignments:
                print(f"   Global assignments in main: {global_assignments}")
            else:
                print(f"   No global assignments to expected result variables")

        else:
            print(f"   Could not extract main function body")

    except Exception as e:
        print(f"   Error analyzing main function: {e}")

if __name__ == "__main__":
    analyze_lc_d2_structure()