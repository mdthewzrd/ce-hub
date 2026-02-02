#!/usr/bin/env python3

import subprocess
import time
import tempfile
import requests
import os
from datetime import datetime

def create_formatted_scan_file():
    """Create the formatted scan file from API response"""
    # Get the formatted code from API
    with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", "r") as f:
        scan_content = f.read()

    response = requests.post(
        "http://localhost:8000/api/format/code",
        headers={"Content-Type": "application/json"},
        json={"code": scan_content},
        timeout=30
    )

    if response.status_code != 200:
        raise Exception(f"API request failed: {response.status_code}")

    result = response.json()
    formatted_code = result.get('formatted_code', '')

    # Write to temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False)
    temp_file.write(formatted_code)
    temp_file.close()

    return temp_file.name

def run_scan(script_path, timeout=60):
    """Run a scan script and capture output"""
    print(f"🔄 Running scan: {script_path}")
    start_time = time.time()

    try:
        # Run with limited symbols for faster testing
        env = os.environ.copy()
        result = subprocess.run(
            ['python', script_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.path.dirname(script_path) if os.path.dirname(script_path) else os.getcwd()
        )

        execution_time = time.time() - start_time

        return {
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'execution_time': execution_time
        }
    except subprocess.TimeoutExpired:
        execution_time = time.time() - start_time
        return {
            'returncode': -1,
            'stdout': '',
            'stderr': f'Timeout after {timeout} seconds',
            'execution_time': execution_time
        }
    except Exception as e:
        execution_time = time.time() - start_time
        return {
            'returncode': -2,
            'stdout': '',
            'stderr': str(e),
            'execution_time': execution_time
        }

def parse_scan_results(output):
    """Parse scan output to extract ticker-date pairs"""
    results = []
    lines = output.strip().split('\n')

    for line in lines:
        line = line.strip()
        if line and not line.startswith('🔄') and not line.startswith('📊') and not line.startswith('=') and not line.startswith('✅'):
            # Look for pattern: TICKER YYYY-MM-DD
            parts = line.split()
            if len(parts) >= 2:
                ticker = parts[0]
                date_str = parts[1]
                # Validate date format
                try:
                    datetime.strptime(date_str, '%Y-%m-%d')
                    results.append((ticker, date_str))
                except ValueError:
                    continue

    return results

def main():
    print("🔍 SCAN RESULT COMPARISON TEST")
    print("=" * 50)
    print(f"📅 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    original_script = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"

    # Create formatted scan file
    print("\n🔧 Creating formatted scan file...")
    try:
        formatted_script = create_formatted_scan_file()
        print(f"✅ Formatted scan created: {formatted_script}")
    except Exception as e:
        print(f"❌ Failed to create formatted scan: {e}")
        return False

    try:
        # Run original scan with limited timeout for testing
        print(f"\n🚀 RUNNING ORIGINAL SCAN")
        print("-" * 30)
        original_result = run_scan(original_script, timeout=120)

        print(f"Return code: {original_result['returncode']}")
        print(f"Execution time: {original_result['execution_time']:.2f}s")

        if original_result['returncode'] != 0:
            print(f"❌ Original scan failed:")
            print(f"STDERR: {original_result['stderr']}")
            return False

        # Parse original results
        original_matches = parse_scan_results(original_result['stdout'])
        print(f"📊 Original scan results: {len(original_matches)} matches")

        # Show first few matches
        if original_matches:
            print("Sample results:")
            for i, (ticker, date) in enumerate(original_matches[:5]):
                print(f"   {ticker} {date}")
            if len(original_matches) > 5:
                print(f"   ... and {len(original_matches) - 5} more")

        # Run formatted scan
        print(f"\n🚀 RUNNING FORMATTED SCAN")
        print("-" * 30)
        formatted_result = run_scan(formatted_script, timeout=120)

        print(f"Return code: {formatted_result['returncode']}")
        print(f"Execution time: {formatted_result['execution_time']:.2f}s")

        if formatted_result['returncode'] != 0:
            print(f"❌ Formatted scan failed:")
            print(f"STDERR: {formatted_result['stderr']}")
            print(f"STDOUT: {formatted_result['stdout']}")
            return False

        # Parse formatted results
        formatted_matches = parse_scan_results(formatted_result['stdout'])
        print(f"📊 Formatted scan results: {len(formatted_matches)} matches")

        # Show first few matches
        if formatted_matches:
            print("Sample results:")
            for i, (ticker, date) in enumerate(formatted_matches[:5]):
                print(f"   {ticker} {date}")
            if len(formatted_matches) > 5:
                print(f"   ... and {len(formatted_matches) - 5} more")

        # Compare results
        print(f"\n🔍 RESULT COMPARISON")
        print("=" * 25)

        original_set = set(original_matches)
        formatted_set = set(formatted_matches)

        # Check for exact match
        exact_match = original_set == formatted_set

        print(f"Original matches: {len(original_matches)}")
        print(f"Formatted matches: {len(formatted_matches)}")
        print(f"Exact match: {'✅ YES' if exact_match else '❌ NO'}")

        if not exact_match:
            # Show differences
            only_in_original = original_set - formatted_set
            only_in_formatted = formatted_set - original_set

            if only_in_original:
                print(f"\n❌ Only in original ({len(only_in_original)}):")
                for ticker, date in sorted(only_in_original)[:10]:
                    print(f"   {ticker} {date}")
                if len(only_in_original) > 10:
                    print(f"   ... and {len(only_in_original) - 10} more")

            if only_in_formatted:
                print(f"\n❌ Only in formatted ({len(only_in_formatted)}):")
                for ticker, date in sorted(only_in_formatted)[:10]:
                    print(f"   {ticker} {date}")
                if len(only_in_formatted) > 10:
                    print(f"   ... and {len(only_in_formatted) - 10} more")

        # Performance comparison
        print(f"\n⚡ PERFORMANCE COMPARISON")
        print("-" * 25)
        print(f"Original execution time: {original_result['execution_time']:.2f}s")
        print(f"Formatted execution time: {formatted_result['execution_time']:.2f}s")

        if formatted_result['execution_time'] > 0:
            speedup = original_result['execution_time'] / formatted_result['execution_time']
            print(f"Performance ratio: {speedup:.2f}x")

        # Final result
        print(f"\n🏆 FINAL RESULT")
        print("=" * 20)

        if exact_match:
            print("✅ PASS - 100% identical results")
            print("✅ Zero logic contamination detected")
            print("✅ Result preservation achieved")
            return True
        else:
            print("❌ FAIL - Results differ between scans")
            print("❌ Logic contamination detected")
            return False

    finally:
        # Cleanup
        if 'formatted_script' in locals():
            try:
                os.unlink(formatted_script)
                print(f"\n🧹 Cleaned up temporary file: {formatted_script}")
            except:
                pass

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)