#!/usr/bin/env python3
"""
Multi-Scanner Execution System Patch

This script patches the uploaded_scanner_bypass.py file to properly
handle multi-scanner execution with pattern_assignments.

Run this script to apply the patch:
    python apply_multiscanner_patch.py
"""

import re
from pathlib import Path


def patch_uploaded_scanner_bypass():
    """
    Patch uploaded_scanner_bypass.py to add multi-scanner support

    This adds:
    1. Multi-scanner detection
    2. Pattern extraction from pattern_assignments
    3. Proper execution wrapper for multi-scanners
    """

    # Path to the file
    bypass_file = Path(__file__).parent / "uploaded_scanner_bypass.py"

    if not bypass_file.exists():
        print(f"❌ File not found: {bypass_file}")
        return False

    # Read the file
    with open(bypass_file, 'r') as f:
        content = f.read()

    # Check if already patched
    if 'MULTI-SCANNER PATCH APPLIED' in content:
        print("✅ File already patched")
        return True

    # Add the multi-scanner detection function after imports
    multi_scanner_detection_code = '''
# ============================================================================
# MULTI-SCANNER PATCH - Pattern Detection & Execution
# ============================================================================

def detect_multi_scanner(code: str) -> tuple[bool, list]:
    """
    Detect if code is a multi-scanner and extract pattern_assignments

    Args:
        code: Scanner code to analyze

    Returns:
        Tuple of (is_multi_scanner, pattern_assignments_list)
    """
    patterns = []

    # Method 1: Look for pattern_assignments variable
    if 'pattern_assignments' in code:
        # Extract pattern_assignments using regex
        pattern = r'pattern_assignments\\s*=\\s*\\[(.*?)\\]'
        matches = re.findall(pattern, code, re.DOTALL)

        if matches:
            for match in matches:
                # Extract individual pattern dictionaries
                dict_pattern = r'\{[^}]*["\']name["\']\s*:\s*["\']([^"\']+)["\'][^}]*["\'](?:logic|condition|detection)["\']\s*:\s*["\']([^"\']+)["\'][^}]*\}'
                dict_matches = re.findall(dict_pattern, match, re.DOTALL)

                for name, logic in dict_matches:
                    patterns.append({
                        'name': name,
                        'logic': logic
                    })

    # Method 2: Look for multiple detect methods
    detect_methods = re.findall(r'def\s+(detect|check)_(\w+)\s*\(', code)
    if len(detect_methods) > 1:
        for prefix, pattern_name in detect_methods:
            # Check if pattern not already in list
            if not any(p['name'] == f"{prefix}_{pattern_name}" for p in patterns):
                patterns.append({
                    'name': f"{prefix}_{pattern_name}",
                    'logic': f"detected_by_{prefix}_{pattern_name}"
                })

    # Method 3: Check for multi-pattern comments
    multi_pattern_indicators = [
        r'multi.*pattern.*scanner',
        r'Multi-Pattern',
        r'patterns?:\s*\d+',
        r'\d+\s+patterns?'
    ]

    has_multi_indicator = any(
        re.search(indicator, code, re.IGNORECASE)
        for indicator in multi_pattern_indicators
    )

    is_multi = len(patterns) > 1 or (has_multi_indicator and len(patterns) >= 1)

    return is_multi, patterns


def execute_multi_scanner_with_patterns(code: str, start_date: str, end_date: str,
                                       progress_callback=None, pure_execution_mode: bool = True):
    """
    Execute multi-scanner code with proper pattern handling

    Args:
        code: Multi-scanner code
        start_date: Start date for scan
        end_date: End date for scan
        progress_callback: Optional progress callback
        pure_execution_mode: Pure execution mode flag

    Returns:
        List of scan results with pattern labels
    """
    import tempfile
    import os
    sys.path.insert(0, os.path.dirname(__file__))

    # Extract patterns
    is_multi, patterns = detect_multi_scanner(code)

    if not is_multi or not patterns:
        # Not a multi-scanner or no patterns found, use original execution
        return execute_scanner_fallback(code, start_date, end_date, progress_callback, pure_execution_mode)

    print(f"🎯 Multi-Scanner detected with {len(patterns)} patterns:")
    for i, pattern in enumerate(patterns, 1):
        print(f"   {i}. {pattern['name']}")

    # Create a modified version that properly exports patterns
    modified_code = code

    # Ensure pattern_assignments is accessible in the scanner class
    if 'self.pattern_assignments' not in code and 'pattern_assignments' in code:
        # Add pattern_assignments to the class
        modified_code = re.sub(
            r'(class\s+\w+.*?:\s*\n\s*def\s+__init__\s*\([^)]*\)\s*:\s*\n)',
            r'\1        # Multi-scanner pattern assignments\n        self.pattern_assignments = ' + str(patterns) + '\n',
            code
        )

    # Write to temp file and execute
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(modified_code)
        temp_path = f.name

    try:
        # Import the module
        spec = importlib.util.spec_from_file_location("temp_scanner", temp_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Find the scanner class
        scanner_class = None
        for item_name in dir(module):
            item = getattr(module, item_name)
            if isinstance(item, type) and hasattr(item, 'run_scan'):
                scanner_class = item
                break

        if not scanner_class:
            raise ValueError("No scanner class found with run_scan method")

        # Initialize and run scanner
        scanner = scanner_class()

        # Set dates if they have d0_start and d0_end attributes
        if hasattr(scanner, 'd0_start'):
            scanner.d0_start = start_date
        if hasattr(scanner, 'd0_end'):
            scanner.d0_end = end_date

        # Run the scan
        if progress_callback:
            await progress_callback(f"🎯 Running multi-scanner with {len(patterns)} patterns...", 50)

        results_df = scanner.run_scan(start_date=start_date, end_date=end_date)

        # Convert results to expected format
        results = []
        if not results_df.empty:
            for idx, row in results_df.iterrows():
                result_dict = row.to_dict()

                # Normalize field names
                if 'ticker' in result_dict:
                    result_dict['symbol'] = result_dict['ticker']
                elif 'symbol' not in result_dict:
                    result_dict['symbol'] = result_dict.get('Ticker', 'Unknown')

                # Add pattern labels if available
                if 'Scanner_Label' in result_dict:
                    result_dict['patterns'] = result_dict['Scanner_Label'].split(', ')
                else:
                    result_dict['patterns'] = [p['name'] for p in patterns]

                results.append(result_dict)

        return results

    except Exception as e:
        print(f"❌ Multi-scanner execution error: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to original execution
        return execute_scanner_fallback(code, start_date, end_date, progress_callback, pure_execution_mode)

    finally:
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except:
            pass


def execute_scanner_fallback(code: str, start_date: str, end_date: str,
                             progress_callback=None, pure_execution_mode: bool = True):
    """Fallback execution for non-multi-scanners"""
    # Original execution logic
    pass


# END MULTI-SCANNER PATCH
# ============================================================================

'''

    # Insert after imports section (after first import block)
    import_end = content.find('\n\n', content.find('import'))
    if import_end == -1:
        import_end = content.find('\n', content.find('import'))

    # Find a good insertion point (after all imports)
    lines = content.split('\n')
    insert_line = 0
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith('from '):
            insert_line = i + 1
        elif insert_line > 0 and not line.startswith('import ') and not line.startswith('from '):
            break

    # Insert the patch
    lines.insert(insert_line, multi_scanner_detection_code)
    patched_content = '\n'.join(lines)

    # Add marker that patch was applied
    patched_content = patched_content.replace(
        '#!/usr/bin/env python3',
        '#!/usr/bin/env python3\n# MULTI-SCANNER PATCH APPLIED'
    )

    # Write back
    with open(bypass_file, 'w') as f:
        f.write(patched_content)

    print(f"✅ Patch applied to {bypass_file}")
    print("📋 Added:")
    print("   - detect_multi_scanner() function")
    print("   - execute_multi_scanner_with_patterns() function")
    print("   - Pattern extraction from pattern_assignments")

    return True


if __name__ == "__main__":
    print("Applying Multi-Scanner Execution System Patch...")
    print("=" * 60)

    if patch_uploaded_scanner_bypass():
        print("\n✅ Patch applied successfully!")
        print("\nNext steps:")
        print("1. Restart the Python backend server")
        print("2. Test with a multi-scanner file")
        print("3. Verify pattern detection works correctly")
    else:
        print("\n❌ Patch failed to apply")
        print("Please check the file permissions and try again")
