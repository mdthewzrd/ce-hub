"""
Debug script to list ALL df['...'] assignments found by AST
"""
import ast
import sys

# Read the source file
with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (5).py', 'r') as f:
    source_code = f.read()

# Try to parse
try:
    tree = ast.parse(source_code)
    print("✅ AST parsing successful")
except SyntaxError as e:
    print(f"❌ SyntaxError: {e}")
    print(f"Line {e.lineno}: {e.text}")
    sys.exit(1)

# Find ALL df['...'] assignments
assignments = []
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
                        pattern_name = str(target.slice)

                    assignments.append({
                        'name': pattern_name,
                        'value_type': type(node.value).__name__,
                        'lineno': node.lineno
                    })

print(f"\nFound {len(assignments)} df['...'] assignments:")
for i, assignment in enumerate(assignments, 1):
    print(f"  {i}. Line {assignment['lineno']:4d}: df['{assignment['name']}'] = {assignment['value_type']}")

# Filter for .astype(int) patterns
astype_patterns = [a for a in assignments if a['value_type'] == 'Call']
print(f"\n{len(astype_patterns)} are Call nodes (potential .astype() patterns)")
