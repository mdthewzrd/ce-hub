#!/usr/bin/env python3
"""
Simple Safe Formatter - Uses existing smart formatter but preserves API keys
"""

import sys
import re

def extract_api_key(file_path: str) -> str:
    """Extract API key from the source file"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        api_key_match = re.search(r'API_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', content)
        if api_key_match:
            return api_key_match.group(1)
        else:
            return "Fm7brz4s23eSocDErnL68cE7wspz2K1I"  # fallback
    except Exception:
        return "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

def fix_api_key_in_enhanced_file(enhanced_file_path: str, original_api_key: str):
    """Replace the API key in the enhanced file with the original one"""
    try:
        with open(enhanced_file_path, 'r') as f:
            content = f.read()

        # Replace the hardcoded API key with the original one
        modified_content = re.sub(
            r'API_KEY\s*=\s*[\'"][^\'"]+[\'"]',
            f'API_KEY = \'{original_api_key}\'',
            content
        )

        with open(enhanced_file_path, 'w') as f:
            f.write(modified_content)

        print(f"✅ Fixed API key in enhanced file: {original_api_key[:10]}...")
        return True
    except Exception as e:
        print(f"❌ Error fixing API key: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python simple_safe_formatter.py <enhanced_file_path>")
        sys.exit(1)

    enhanced_file = sys.argv[1]

    # Try to find the original file by removing _safe_enhanced or similar suffixes
    original_file = enhanced_file.replace('_safe_enhanced.py', '.py')
    original_file = original_file.replace('_smart_optimized.py', '.py')
    original_file = original_file.replace('_multi_enhanced.py', '.py')

    if original_file == enhanced_file:
        # If no change, look for the most recently modified original file
        import os
        from pathlib import Path

        # Find recent scan files in Downloads
        downloads_path = Path("/Users/michaeldurante/Downloads")
        scan_files = []

        try:
            for file_path in downloads_path.glob("*.py"):
                if "scan" in file_path.name.lower() and "enhanced" not in file_path.name:
                    scan_files.append(file_path)

            if scan_files:
                original_file = str(max(scan_files, key=lambda f: f.stat().st_mtime))
                print(f"📂 Found original file: {original_file}")
            else:
                print("❌ Could not find original file")
                sys.exit(1)
        except Exception:
            print("❌ Could not find original file")
            sys.exit(1)

    print(f"🔍 Extracting API key from: {original_file}")
    api_key = extract_api_key(original_file)
    print(f"🔑 API Key: {api_key[:10]}...")

    print(f"🔧 Fixing API key in: {enhanced_file}")
    if fix_api_key_in_enhanced_file(enhanced_file, api_key):
        print("🎉 SUCCESS! API key fixed. You can now run the enhanced file.")
        print(f"🚀 Run: python3 {enhanced_file}")
    else:
        print("❌ Failed to fix API key")
        sys.exit(1)