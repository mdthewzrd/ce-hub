#!/usr/bin/env python3
"""
Fix all const target redeclarations in page.tsx
"""

def fix_target_declarations(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()

    new_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if line has "const target" with style assignment on the same line
        if "const target = e.target as HTMLElement;" in line and "target.style." in line:
            # Split the line into two lines
            parts = line.strip().split("target.style.")
            if len(parts) > 1:
                target_declaration = "const target = e.target as HTMLElement;"
                style_assignment = "target.style." + parts[1]
                new_lines.append(target_declaration + "\n")
                new_lines.append("                  " + style_assignment)
            else:
                new_lines.append(line)
        # Check if next line also has const target declaration
        elif (i + 1 < len(lines) and
              "const target = e.target as HTMLElement;" in line and
              "const target = e.target as HTMLElement;" in lines[i + 1]):
            # Fix duplicate declaration
            # Keep first line, modify second line to remove const target
            first_line = line
            second_line = lines[i + 1].replace("const target = e.target as HTMLElement;", "                  ")
            new_lines.append(first_line)
            new_lines.append(second_line)
            i += 1  # Skip next line
        else:
            new_lines.append(line)

        i += 1

    # Write back the fixed content
    with open(file_path, 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    fix_target_declarations("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/page.tsx")
    print("Fixed all const target redeclarations")