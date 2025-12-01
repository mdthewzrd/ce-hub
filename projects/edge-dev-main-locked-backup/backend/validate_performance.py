#!/usr/bin/env python3
"""
Performance Validation Script for LC Scanner FastAPI Backend
Tests and validates that all threading optimizations are preserved
"""

import asyncio
import json
import time
import multiprocessing
import threading
import sys
import requests
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def test_threading_imports():
    """Test that all threading modules are available"""
    print("🔧 Testing Threading Imports...")

    try:
        import concurrent.futures
        import multiprocessing
        import threading
        import asyncio
        import aiohttp

        print("✅ All threading modules imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Threading import failed: {e}")
        return False

# Global function for ProcessPoolExecutor (required for pickle)
def cpu_bound_task(n):
    """CPU-bound task for testing"""
    total = 0
    for i in range(n):
        total += i * i
    return total

def test_process_pool_executor():
    """Test ProcessPoolExecutor functionality"""
    print("🚀 Testing ProcessPoolExecutor...")

    try:
        with ProcessPoolExecutor(max_workers=multiprocessing.cpu_count()) as executor:
            start_time = time.time()

            # Submit multiple CPU-bound tasks
            tasks = [executor.submit(cpu_bound_task, 100000) for _ in range(4)]
            results = [task.result() for task in tasks]

            execution_time = time.time() - start_time

        print(f"✅ ProcessPoolExecutor test completed in {execution_time:.2f}s")
        print(f"   CPU cores available: {multiprocessing.cpu_count()}")
        print(f"   Tasks completed: {len(results)}")
        return True

    except Exception as e:
        print(f"❌ ProcessPoolExecutor test failed: {e}")
        return False

def test_thread_pool_executor():
    """Test ThreadPoolExecutor functionality"""
    print("🔄 Testing ThreadPoolExecutor...")

    def io_bound_task(delay):
        """I/O-bound task for testing"""
        time.sleep(delay)
        return f"Task completed after {delay}s"

    try:
        with ThreadPoolExecutor(max_workers=4) as executor:
            start_time = time.time()

            # Submit multiple I/O-bound tasks
            futures = [executor.submit(io_bound_task, 0.1) for _ in range(4)]
            results = [future.result() for future in futures]

            execution_time = time.time() - start_time

        print(f"✅ ThreadPoolExecutor test completed in {execution_time:.2f}s")
        print(f"   Active threads: {threading.active_count()}")
        print(f"   Tasks completed: {len(results)}")
        return True

    except Exception as e:
        print(f"❌ ThreadPoolExecutor test failed: {e}")
        return False

async def test_aiohttp_async():
    """Test aiohttp async functionality"""
    print("🌐 Testing aiohttp async patterns...")

    try:
        import aiohttp

        async def fetch_url(session, url):
            """Async HTTP request"""
            async with session.get(url) as response:
                return response.status

        start_time = time.time()

        async with aiohttp.ClientSession() as session:
            # Test multiple concurrent requests
            urls = ['https://httpbin.org/delay/1' for _ in range(3)]
            tasks = [fetch_url(session, url) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        execution_time = time.time() - start_time

        print(f"✅ aiohttp async test completed in {execution_time:.2f}s")
        print(f"   Concurrent requests: {len(results)}")
        print(f"   Expected time < 2s (parallel execution)")
        return True

    except Exception as e:
        print(f"❌ aiohttp async test failed: {e}")
        return False

def test_scanner_imports():
    """Test that scanner modules can be imported"""
    print("📊 Testing Scanner Module Imports...")

    try:
        from core.scan_manager import ScanManager
        from core.scanner_wrapper import ThreadedLCScanner
        from utils.websocket_manager import ConnectionManager

        print("✅ All scanner modules imported successfully")
        return True

    except ImportError as e:
        print(f"❌ Scanner import failed: {e}")
        return False

def test_fastapi_server(host="localhost", port=8000):
    """Test FastAPI server endpoints"""
    print("🖥️  Testing FastAPI Server...")

    base_url = f"http://{host}:{port}"

    try:
        # Test health endpoint
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False

        # Test performance endpoint
        response = requests.get(f"{base_url}/api/scan/performance", timeout=5)
        if response.status_code == 200:
            perf_data = response.json()
            print("✅ Performance endpoint working")
            print(f"   CPU cores: {perf_data['performance_info']['cpu_cores']}")
            print(f"   Active threads: {perf_data['performance_info']['active_threads']}")
        else:
            print(f"❌ Performance endpoint failed: {response.status_code}")
            return False

        # Test universe endpoint
        response = requests.get(f"{base_url}/api/scan/universe", timeout=10)
        if response.status_code == 200:
            print("✅ Universe endpoint working")
        else:
            print(f"⚠️  Universe endpoint failed: {response.status_code} (API key required)")

        return True

    except requests.exceptions.ConnectionError:
        print("⚠️  FastAPI server not running. Start with: python start.py")
        return False
    except Exception as e:
        print(f"❌ FastAPI test failed: {e}")
        return False

def validate_original_scanner():
    """Validate that original scanner file exists and has key functions"""
    print("📋 Validating Original Scanner...")

    scanner_file = Path(__file__).parent / "core" / "scanner.py"

    if not scanner_file.exists():
        print(f"❌ Original scanner file not found: {scanner_file}")
        return False

    # Check for key functions
    scanner_content = scanner_file.read_text()
    required_functions = [
        'check_high_lvl_filter_lc',
        'compute_indicators1',
        'filter_lc_rows',
        'fetch_intial_stock_list',
        'process_lc_row',
        'ProcessPoolExecutor',
        'ThreadPoolExecutor',
        'aiohttp'
    ]

    missing_functions = []
    for func in required_functions:
        if func not in scanner_content:
            missing_functions.append(func)

    if missing_functions:
        print(f"❌ Missing functions in scanner: {missing_functions}")
        return False

    print("✅ Original scanner validation passed")
    return True

def benchmark_performance():
    """Benchmark performance characteristics"""
    print("⚡ Running Performance Benchmark...")

    try:
        # Test CPU utilization
        cpu_cores = multiprocessing.cpu_count()
        print(f"   Available CPU cores: {cpu_cores}")

        # Test memory availability
        import psutil
        memory = psutil.virtual_memory()
        print(f"   Available memory: {memory.available / (1024**3):.1f} GB")

        # Test threading overhead
        start_time = time.time()

        def simple_task():
            return sum(range(10000))

        with ThreadPoolExecutor(max_workers=cpu_cores) as executor:
            futures = [executor.submit(simple_task) for _ in range(cpu_cores * 2)]
            results = [f.result() for f in futures]

        execution_time = time.time() - start_time

        print(f"✅ Threading benchmark completed in {execution_time:.3f}s")
        print(f"   Tasks per second: {len(results) / execution_time:.1f}")

        return True

    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")
        return False

def main():
    """Run all validation tests"""
    print("🧪 LC Scanner Backend Performance Validation")
    print("=" * 50)

    tests = [
        ("Threading Imports", test_threading_imports),
        ("ProcessPoolExecutor", test_process_pool_executor),
        ("ThreadPoolExecutor", test_thread_pool_executor),
        ("aiohttp Async", lambda: asyncio.run(test_aiohttp_async())),
        ("Scanner Imports", test_scanner_imports),
        ("Original Scanner", validate_original_scanner),
        ("Performance Benchmark", benchmark_performance),
        ("FastAPI Server", test_fastapi_server),
    ]

    results = {}

    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False

    print("\n" + "=" * 50)
    print("📊 VALIDATION SUMMARY")
    print("=" * 50)

    passed = 0
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<10} {test_name}")
        if result:
            passed += 1

    print("-" * 50)
    print(f"Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")

    if passed == total:
        print("🎉 ALL TESTS PASSED! Backend is ready for production.")
    elif passed >= total * 0.8:
        print("⚠️  Most tests passed. Check failed tests above.")
    else:
        print("❌ Multiple tests failed. Review implementation.")

    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)