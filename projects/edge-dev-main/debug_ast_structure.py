"""
Debug script to check AST structure of lc_d2 assignment
"""
import ast
import sys

# Read the source file
with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (5).py', 'r') as f:
    source_code = f.read()

# Parse into AST
tree = ast.parse(source_code)

# Find the lc_d2 assignment
for node in ast.walk(tree):
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Subscript):
                if isinstance(target.value, ast.Name) and target.value.id == 'df':
                    # Get pattern name
                    if isinstance(target.slice, ast.Constant):
                        pattern_name = target.slice.value
                    elif isinstance(target.slice, ast.Str):
                        pattern_name = target.slice.s
                    else:
                        continue

                    if pattern_name == 'lc_d2':
                        print(f"Found lc_d2 assignment!")
                        print(f"Target: {ast.dump(target)}")
                        print(f"\nValue type: {type(node.value).__name__}")
                        print(f"Value: {ast.dump(node.value)}")

                        # Check if this is a Call node
                        if isinstance(node.value, ast.Call):
                            print(f"\n✅ This is a Call node")
                            print(f"Func: {ast.dump(node.value.func)}")
                            if isinstance(node.value.func, ast.Attribute):
                                print(f"Attribute: {node.value.func.attr}")
                        else:
                            print(f"\n❌ This is NOT a Call node, it's a {type(node.value).__name__}")

                        sys.exit(0)

print("❌ Did not find lc_d2 assignment")
