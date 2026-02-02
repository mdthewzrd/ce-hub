"""
Debug script to check what patterns AST extraction finds
"""
import ast
import sys

# Read the source file
with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (5).py', 'r') as f:
    source_code = f.read()

# Parse into AST
tree = ast.parse(source_code)

# Find all pattern assignments
pattern_assignments = []
seen_patterns = set()

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

                    # Check if value is .astype(int)
                    value = node.value
                    if isinstance(value, ast.Call):
                        if isinstance(value.func, ast.Attribute) and value.func.attr == 'astype':
                            if pattern_name not in seen_patterns:
                                seen_patterns.add(pattern_name)
                                pattern_assignments.append(pattern_name)

print(f"Found {len(pattern_assignments)} unique patterns:")
for i, pattern in enumerate(pattern_assignments, 1):
    print(f"  {i}. {pattern}")
