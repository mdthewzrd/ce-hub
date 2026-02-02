#!/usr/bin/env python3
"""
Fix Unicode characters (-> and OK) in Python files that cause syntax errors
"""
import os
import glob

def fix_unicode_chars():
    print("🔧 FIXING UNICODE CHARACTERS IN PYTHON FILES")
    print("=" * 60)

    backend_dir = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend"

    # Find all Python files with problematic Unicode characters
    problematic_files = []
    for py_file in glob.glob(os.path.join(backend_dir, "**/*.py"), recursive=True):
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if '->' in content or 'OK' in content:
                    problematic_files.append(py_file)
        except Exception as e:
            print(f"❌ Error reading {py_file}: {e}")

    print(f"📄 Found {len(problematic_files)} files with Unicode characters")

    for file_path in problematic_files:
        print(f"\n🔄 Processing: {os.path.basename(file_path)}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Count occurrences
            arrow_count = content.count('->')
            check_count = content.count('OK')

            print(f"   Found: {arrow_count} -> characters, {check_count} OK characters")

            if arrow_count > 0 or check_count > 0:
                # Replace Unicode characters with ASCII equivalents
                fixed_content = content.replace('->', '->')
                fixed_content = fixed_content.replace('OK', 'OK')

                # Write the fixed content back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)

                print(f"   ✅ Fixed: {arrow_count + check_count} characters replaced")
            else:
                print(f"   ✅ No changes needed")

        except Exception as e:
            print(f"   ❌ Error processing {file_path}: {e}")

    print(f"\n🎉 UNICODE FIX COMPLETE!")
    print("=" * 30)

if __name__ == "__main__":
    fix_unicode_chars()