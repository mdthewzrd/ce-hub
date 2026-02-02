#!/usr/bin/env python3
"""
Test the scan status API to check if progress updates are working
"""
import requests
import json
import time

def test_scan_status():
    print("🔧 Testing Scan Status API")
    print("=" * 50)

    try:
        # Test the scan status endpoint
        print("🚀 Getting current scan status...")
        response = requests.get("http://localhost:8000/api/scan/status", timeout=10)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Status API successful!")

            # Display status information
            print(f"\n📊 Current Scan Status:")
            print(f"   Scan ID: {result.get('scan_id', 'None')}")
            print(f"   Status: {result.get('status', 'unknown')}")
            print(f"   Progress: {result.get('progress', 0)}%")
            print(f"   Message: {result.get('message', 'No message')}")
            print(f"   Started: {result.get('start_time', 'unknown')}")

            # Check if scan is active
            if result.get('status') == 'running':
                print(f"\n✅ Scan is ACTIVE and running!")
                print(f"🔍 Progress: {result.get('progress', 0)}%")

                # Test getting detailed progress
                if 'progress_details' in result:
                    details = result['progress_details']
                    print(f"\n📋 Progress Details:")
                    for key, value in details.items():
                        print(f"   {key}: {value}")

                return True
            elif result.get('status') == 'completed':
                print(f"\n✅ Scan has COMPLETED!")
                print(f"🎯 Results available: {result.get('results_count', 0)} items")
                return True
            else:
                print(f"\n⚠️ Scan status: {result.get('status', 'unknown')}")
                return False

        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error testing scan status: {e}")
        return False

def test_all_scan_endpoints():
    """Test multiple scan-related endpoints"""
    print("\n🔧 Testing All Scan Endpoints")
    print("=" * 50)

    endpoints = [
        "/api/scan/status",
        "/api/scan/progress",
        "/api/scan/info",
        "/api/health"
    ]

    for endpoint in endpoints:
        try:
            print(f"\n🚀 Testing {endpoint}...")
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=5)

            if response.status_code == 200:
                result = response.json()
                print(f"✅ {endpoint} - SUCCESS")

                # Show key information for each endpoint
                if 'progress' in result:
                    print(f"   Progress: {result['progress']}%")
                if 'status' in result:
                    print(f"   Status: {result['status']}")
                if 'scan_id' in result:
                    print(f"   Scan ID: {result['scan_id']}")

            else:
                print(f"❌ {endpoint} - HTTP {response.status_code}")

        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

if __name__ == "__main__":
    print("🔧 LC D2 Scanner Status Test")
    print("=" * 60)

    # Test main status endpoint
    success = test_scan_status()

    # Test all scan endpoints
    test_all_scan_endpoints()

    if success:
        print("\n🎉 SCAN STATUS WORKING!")
        print("✅ Backend is generating progress updates")
        print("🔍 Frontend should be receiving these updates")
    else:
        print("\n❌ SCAN STATUS ISSUES DETECTED")
        print("⚠️ Frontend may not be receiving progress updates")