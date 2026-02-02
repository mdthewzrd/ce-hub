#!/usr/bin/env python3
"""
DEBUG: Check why scanner function detection is failing
"""

import ast

def debug_scanner_detection():
    print("🔍 DEBUGGING SCANNER FUNCTION DETECTION")
    print("=" * 50)

    # Load the real file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py', 'r') as f:
            real_code = f.read()

        print(f"📄 File loaded: {len(real_code):,} characters")

        # Test 1: Check for function names manually
        print(f"\n🔍 MANUAL FUNCTION NAME CHECK:")
        for func_name in ['lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_fbo']:
            if f"def {func_name}(" in real_code:
                print(f"✅ Found: def {func_name}(")
            else:
                print(f"❌ Missing: def {func_name}(")

        # Test 2: Check for .astype(int) pattern
        astype_count = real_code.count('.astype(int)')
        print(f"\n🔍 .astype(int) PATTERN CHECK:")
        print(f"Found {astype_count} occurrences of '.astype(int)'")

        # Test 3: Try AST parsing
        print(f"\n🔍 AST PARSING TEST:")
        try:
            tree = ast.parse(real_code)
            all_functions = []
            scanner_functions = []

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    all_functions.append(node.name)

                    # Try to get function source
                    try:
                        function_source = ast.get_source_segment(real_code, node)
                        if function_source and '.astype(int)' in function_source:
                            scanner_functions.append(node.name)
                            print(f"✅ Scanner found: {node.name}")

                            # Show a snippet of the function
                            lines = function_source.split('\n')[:5]
                            print(f"   Preview: {lines[0][:80]}...")
                        else:
                            print(f"❌ Not scanner: {node.name} (no .astype(int) found)")
                    except Exception as e:
                        print(f"❌ Source extraction failed for {node.name}: {e}")

            print(f"\n📊 SUMMARY:")
            print(f"Total functions found: {len(all_functions)}")
            print(f"Scanner functions found: {len(scanner_functions)}")
            print(f"All functions: {all_functions}")
            print(f"Scanner functions: {scanner_functions}")

        except Exception as e:
            print(f"❌ AST parsing failed: {e}")

        # Test 4: Try regex approach
        print(f"\n🔍 REGEX APPROACH TEST:")
        import re

        pattern = r"def\s+(\w+)\(.*?\):\s*.*?\.astype\(int\)"
        matches = re.findall(pattern, real_code, re.DOTALL)
        print(f"Regex found {len(matches)} scanner functions: {matches}")

        # Test 5: Search for specific functions with context
        print(f"\n🔍 SPECIFIC FUNCTION CONTEXT:")
        for func_name in ['lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_fbo']:
            # Find the function definition
            start_pattern = f"def {func_name}("
            start_pos = real_code.find(start_pattern)

            if start_pos != -1:
                # Get some context around the function
                context_start = max(0, start_pos - 50)
                context_end = min(len(real_code), start_pos + 500)
                context = real_code[context_start:context_end]

                print(f"\n📄 Function: {func_name}")
                print(f"   Found at position: {start_pos}")
                print(f"   Context snippet:")
                lines = context.split('\n')[:10]
                for i, line in enumerate(lines):
                    print(f"     {i+1:2d}: {line[:100]}")

                # Check if .astype(int) is in the function
                # Look for the function end (next def or end of file)
                next_def = real_code.find('\ndef ', start_pos + 1)
                if next_def == -1:
                    func_content = real_code[start_pos:]
                else:
                    func_content = real_code[start_pos:next_def]

                if '.astype(int)' in func_content:
                    print(f"   ✅ Contains .astype(int)")
                else:
                    print(f"   ❌ Missing .astype(int)")
            else:
                print(f"\n❌ Function {func_name} not found in file")

    except Exception as e:
        print(f"❌ Failed to load file: {e}")

if __name__ == "__main__":
    debug_scanner_detection()