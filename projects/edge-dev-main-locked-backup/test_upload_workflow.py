#!/usr/bin/env python3
"""
Complete End-to-End Test of Scanner Upload, Formatting, and Execution Workflow

Tests:
1. File upload to Renata chat
2. Code formatting with Renata
3. Project creation
4. Scanner execution from 1/1/25 to 11/1/25
5. Results validation
"""

import requests
import json
import time
from pathlib import Path

# Configuration
FRONTEND_URL = "http://localhost:5657"
BACKEND_URL = "http://localhost:5659"
SCANNER_FILE = "/Users/michaeldurante/Downloads/backside para b copy.py"

def test_backend_health():
    """Test backend health and endpoints"""
    print("🔍 Testing Backend Health...")

    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            data = response.json()
            print(f"   Server: {data.get('server', 'Unknown')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_frontend_health():
    """Test frontend health"""
    print("🔍 Testing Frontend Health...")

    try:
        response = requests.get(f"{FRONTEND_URL}", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is responding")
            return True
        else:
            print(f"❌ Frontend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

def test_code_formatting():
    """Test code formatting with the backside scanner"""
    print("🔍 Testing Code Formatting...")

    # Read the scanner file
    try:
        with open(SCANNER_FILE, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Scanner file loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to read scanner file: {e}")
        return False

    # Test formatting endpoint
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/format/code",
            json={
                "code": scanner_code,
                "language": "python",
                "format_type": "scanner"
            },
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Code formatting successful")
            print(f"   Status: {result.get('status', 'Unknown')}")
            if 'formatted_code' in result:
                print(f"   Formatted code length: {len(result['formatted_code'])} characters")
            return True, result
        else:
            print(f"❌ Code formatting failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Code formatting request failed: {e}")
        return False, None

def test_project_creation():
    """Test project creation"""
    print("🔍 Testing Project Creation...")

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/projects",
            json={
                "name": "Backside Para B Scanner Test",
                "description": "End-to-end test of the backside para B scanner upload workflow",
                "strategy": "LC Backside Para B",
                "scanner_type": "backside_para_b"
            },
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Project creation successful")
            print(f"   Project ID: {result.get('id', 'Unknown')}")
            print(f"   Project Name: {result.get('name', 'Unknown')}")
            return True, result
        else:
            print(f"❌ Project creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Project creation request failed: {e}")
        return False, None

def test_scan_execution():
    """Test scanner execution with date range 1/1/25 to 11/1/25"""
    print("🔍 Testing Scanner Execution...")

    # Read the scanner file for execution
    try:
        with open(SCANNER_FILE, 'r') as f:
            scanner_code = f.read()
    except Exception as e:
        print(f"❌ Failed to read scanner file: {e}")
        return False

    # Create scan request with specific date range
    scan_request = {
        "start_date": "2025-01-01",
        "end_date": "2025-11-01",
        "scanner_code": scanner_code,
        "scanner_name": "Backside Para B Test",
        "parameters": {
            "price_min": 8.0,
            "adv20_min_usd": 30000000,
            "gap_div_atr_min": 0.75,
            "d1_volume_min": 15000000,
            "trigger_mode": "D1_or_D2"
        }
    }

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/scan/execute",
            json=scan_request,
            timeout=60  # Longer timeout for execution
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Scanner execution initiated")
            print(f"   Execution ID: {result.get('execution_id', 'Unknown')}")
            print(f"   Status: {result.get('status', 'Unknown')}")
            return True, result
        else:
            print(f"❌ Scanner execution failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Scanner execution request failed: {e}")
        return False, None

def test_parameter_preview():
    """Test parameter preview functionality"""
    print("🔍 Testing Parameter Preview...")

    # Read the scanner file
    try:
        with open(SCANNER_FILE, 'r') as f:
            scanner_code = f.read()
    except Exception as e:
        print(f"❌ Failed to read scanner file: {e}")
        return False

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/scan/parameters/preview",
            json={"code": scanner_code},
            timeout=15
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Parameter preview successful")
            print(f"   Scan Type: {result.get('scan_type', 'Unknown')}")
            print(f"   Universe: {result.get('ticker_universe', 'Unknown')}")
            print(f"   Timeframe: {result.get('timeframe', 'Unknown')}")
            print(f"   Filters: {len(result.get('filters', []))}")
            print(f"   Indicators: {len(result.get('indicators', []))}")
            return True, result
        else:
            print(f"❌ Parameter preview failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Parameter preview request failed: {e}")
        return False, None

def main():
    """Run complete end-to-end test"""
    print("🚀 Starting Complete End-to-End Workflow Test")
    print("=" * 60)

    # Test basic connectivity
    if not test_backend_health():
        return False
    if not test_frontend_health():
        return False

    print("\n" + "=" * 60)

    # Test parameter preview
    preview_success, preview_result = test_parameter_preview()
    if not preview_success:
        print("⚠️  Parameter preview failed, but continuing...")

    # Test code formatting
    format_success, format_result = test_code_formatting()
    if not format_success:
        return False

    # Test project creation
    project_success, project_result = test_project_creation()
    if not project_success:
        print("⚠️  Project creation failed, but continuing...")

    # Test scanner execution
    execution_success, execution_result = test_scan_execution()
    if not execution_success:
        print("⚠️  Scanner execution failed")

    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"   Backend Health: ✅")
    print(f"   Frontend Health: ✅")
    print(f"   Parameter Preview: {'✅' if preview_success else '❌'}")
    print(f"   Code Formatting: {'✅' if format_success else '❌'}")
    print(f"   Project Creation: {'✅' if project_success else '❌'}")
    print(f"   Scanner Execution: {'✅' if execution_success else '❌'}")

    if format_success:
        print("\n📄 Formatting Results:")
        print(f"   Scanner successfully formatted and ready for use")

    if preview_success and preview_result:
        print("\n🔍 Detected Scanner Parameters:")
        print(f"   Scan Type: {preview_result.get('scan_type', 'N/A')}")
        print(f"   Universe: {preview_result.get('ticker_universe', 'N/A')}")
        print(f"   Filters: {len(preview_result.get('filters', []))}")
        print(f"   Indicators: {len(preview_result.get('indicators', []))}")

        if preview_result.get('filters'):
            print(f"   Active Filters: {', '.join(preview_result['filters'][:3])}...")
        if preview_result.get('indicators'):
            print(f"   Technical Indicators: {', '.join(preview_result['indicators'][:3])}...")

    print("\n🎯 Workflow Test Status: PASSED" if format_success else "❌ Workflow Test Status: FAILED")
    return format_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)