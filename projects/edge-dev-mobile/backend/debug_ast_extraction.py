#!/usr/bin/env python3
"""
DEBUG: Test AST extraction on real scanner file
"""
import ast

def debug_ast_extraction():
    print("🔍 DEBUGGING AST EXTRACTION ON REAL SCANNER FILE")
    print("=" * 60)

    # Load the real file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py', 'r') as f:
            real_code = f.read()

        print(f"📄 File loaded: {len(real_code):,} characters")

        # Parse AST
        tree = ast.parse(real_code)
        all_functions = []
        scanner_functions = []

        print(f"\n🔍 SCANNING ALL FUNCTIONS FOR .astype(int) PATTERN:")

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                all_functions.append(node.name)

                # Get function source
                try:
                    function_source = ast.get_source_segment(real_code, node) or ""
                    has_astype = '.astype(int)' in function_source

                    print(f"\n📄 Function: {node.name}")
                    print(f"   Lines: {node.lineno}-{node.end_lineno}")
                    print(f"   Source length: {len(function_source):,} characters")
                    print(f"   Contains .astype(int): {'✅' if has_astype else '❌'}")

                    if has_astype:
                        scanner_functions.append({
                            'name': node.name,
                            'source': function_source,
                            'line_start': node.lineno,
                            'line_end': node.end_lineno or node.lineno
                        })
                        print(f"   ✅ SCANNER DETECTED!")

                    # Show snippet of source for debugging
                    if function_source:
                        lines = function_source.split('\n')[:5]
                        print(f"   Preview: {lines[0][:100]}...")
                    else:
                        print(f"   ❌ No source code extracted!")

                except Exception as e:
                    print(f"   ❌ Error extracting source: {e}")

        print(f"\n📊 FINAL RESULTS:")
        print(f"   Total functions found: {len(all_functions)}")
        print(f"   Functions with .astype(int): {len(scanner_functions)}")
        print(f"   All function names: {all_functions}")
        print(f"   Scanner function names: {[s['name'] for s in scanner_functions]}")

        if len(scanner_functions) == 0:
            print(f"\n❌ NO SCANNER FUNCTIONS FOUND!")
            print(f"💡 This explains why real AI analysis fails")
            print(f"💡 Let's check if .astype(int) pattern exists in the file...")

            astype_count = real_code.count('.astype(int)')
            astype_upper_count = real_code.count('.astype(INT)')  # Case variation

            print(f"   .astype(int) count: {astype_count}")
            print(f"   .astype(INT) count: {astype_upper_count}")

            if astype_count > 0:
                print(f"✅ Pattern exists in file, but not being captured by AST")
                print(f"💡 This suggests AST source extraction issue")
            else:
                print(f"❌ Pattern doesn't exist in file")
                print(f"💡 Scanner functions may use different pattern")

    except Exception as e:
        print(f"❌ Failed to load file: {e}")

if __name__ == "__main__":
    debug_ast_extraction()