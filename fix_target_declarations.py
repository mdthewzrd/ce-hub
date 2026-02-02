#!/usr/bin/env python3
"""
Fix multiple const target declarations in page.tsx
"""

import re

def fix_target_declarations(file_path):
    """Fix multiple const target declarations in event handlers"""

    with open(file_path, 'r') as f:
        content = f.read()

    # Pattern to find event handlers with multiple const target declarations
    # This matches: onMouseEnter={(e) => { const target = ...; const target = ...; }}
    pattern = r'(onMouseEnter|onMouseLeave)=\{(e) => \{\s*const target = e\.target as HTMLElement;\s*(target\.style\.[^;]+;)\s*const target = e\.target as HTMLElement;\s*(target\.style\.[^;]+;)([^}]*?)\}'

    def replacement(match):
        event_type = match.group(1)
        param = match.group(2)
        first_style = match.group(3)
        second_style = match.group(4)
        rest_content = match.group(5)

        # Combine into single target declaration
        return event_type + "=(" + param + ") => {" + "\n" + \
               "                  const target = e.target as HTMLElement;\n" + \
               "                  " + first_style + "\n" + \
               "                  " + second_style + rest_content + "\n" + \
               "                }"

    # Apply the replacement
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

    # Handle the case with three target declarations
    pattern_three = r'(onMouseEnter|onMouseLeave)=\{(e) => \{\s*const target = e\.target as HTMLElement;\s*(target\.style\.[^;]+;)\s*const target = e\.target as HTMLElement;\s*(target\.style\.[^;]+;)\s*const target = e\.target as HTMLElement;\s*(target\.style\.[^;]+;)([^}]*?)\}'

    def replacement_three(match):
        event_type = match.group(1)
        param = match.group(2)
        first_style = match.group(3)
        second_style = match.group(4)
        third_style = match.group(5)
        rest_content = match.group(6)

        return event_type + "=(" + param + ") => {" + "\n" + \
               "                  const target = e.target as HTMLElement;\n" + \
               "                  " + first_style + "\n" + \
               "                  " + second_style + "\n" + \
               "                  " + third_style + rest_content + "\n" + \
               "                }"

    content = re.sub(pattern_three, replacement_three, content, flags=re.MULTILINE | re.DOTALL)

    # Write the fixed content back
    with open(file_path, 'w') as f:
        f.write(content)

    print(f"Fixed target declarations in {file_path}")

if __name__ == "__main__":
    fix_target_declarations("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/page.tsx")