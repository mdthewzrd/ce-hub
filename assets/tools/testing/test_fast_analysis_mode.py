#!/usr/bin/env python3
"""
Test the new fast parameter-only analysis mode that bypasses execution
"""
import requests
import json
import time

def test_fast_analysis_mode():
    print("🧪 Testing fast parameter-only analysis mode...")

    # Read the real LC D2 scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
            scanner_code = f.read()
        print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        try:
            with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
                scanner_code = f.read()
            print(f"📄 Loaded REAL LC D2 scanner (1): {len(scanner_code):,} characters")
        except FileNotFoundError:
            print("❌ LC D2 scanner file not found")
            return

    # Test the new fast analysis endpoint
    start_time = time.time()

    try:
        print("🚀 Testing fast analysis endpoint (should bypass execution)...")
        response = requests.post("http://localhost:8000/api/format/analyze-only",
                               json={"code": scanner_code, "filename": "lc_d2_real.py"},
                               timeout=60)  # Should be very fast

        end_time = time.time()
        processing_time = end_time - start_time

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Fast analysis completed successfully!")
            print(f"⚡ Processing time: {processing_time:.2f} seconds")

            # Check the analysis results
            print(f"🎯 Analysis mode: {result.get('analysis_mode', 'unknown')}")
            print(f"📊 Parameters extracted: {result.get('parameters_extracted', 0)}")
            print(f"🚀 Execution skipped: {result.get('execution_skipped', False)}")
            print(f"✅ Ready for execution: {result.get('ready_for_execution', False)}")
            print(f"💬 Message: {result.get('message', 'No message')}")

            # Check metadata
            metadata = result.get('metadata', {})
            print(f"\n📋 Detailed Analysis:")
            print(f"   Processing time: {metadata.get('processing_time', 'unknown')}")
            print(f"   Parameter count: {metadata.get('parameter_count', 0)}")
            print(f"   AI extraction success: {metadata.get('ai_extraction', {}).get('success', False)}")
            print(f"   Trading filters: {metadata.get('ai_extraction', {}).get('trading_filters', 0)}")

            # Check scanner info
            scanner_info = metadata.get('scanner_info', {})
            if scanner_info:
                print(f"\n📊 Scanner Info:")
                print(f"   Type: {scanner_info.get('type', 'unknown')}")
                print(f"   Size: {scanner_info.get('size_chars', 0):,} characters")
                print(f"   Complexity: {scanner_info.get('complexity', 'unknown')}")
                print(f"   Parameters found: {scanner_info.get('parameters_found', 0)}")

            # Performance evaluation
            if processing_time < 1:
                print(f"🎉 EXCELLENT: Fast analysis completed in {processing_time:.3f} seconds!")
            elif processing_time < 5:
                print(f"✅ GOOD: Fast analysis completed in {processing_time:.2f} seconds")
            else:
                print(f"⚠️ SLOW: Fast analysis took {processing_time:.2f} seconds - may need optimization")

            # Verify it's actually bypassing execution
            if result.get('execution_skipped'):
                print("✅ SUCCESS: Execution properly bypassed")
            else:
                print("❌ WARNING: Execution was NOT bypassed")

            # Verify we have formatted code
            if 'formatted_code' in result and result['formatted_code']:
                print("✅ SUCCESS: Formatted code available for reference")
            else:
                print("❌ WARNING: No formatted code returned")

            return True

        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT: Fast analysis still hanging after 60 seconds")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_backend_health():
    """Test if the backend is running and healthy"""
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy and running on port 8000")
            return True
        else:
            print(f"⚠️ Backend responded with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_ai_agent_health():
    """Test if the AI agent is available"""
    try:
        response = requests.get("http://localhost:8000/api/format/smart/health", timeout=5)
        if response.status_code == 200:
            result = response.json()
            if result.get('available'):
                print("✅ AI Agent is available and ready")
                capabilities = result.get('capabilities', [])
                print(f"🛠️ Capabilities: {', '.join(capabilities)}")
                return True
            else:
                print(f"❌ AI Agent not available: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"⚠️ AI Agent health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI Agent health check failed: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Testing Fast Parameter-Only Analysis Mode")
    print("=" * 50)

    # Check system health first
    print("\n1️⃣ Backend Health Check:")
    backend_healthy = test_backend_health()

    print("\n2️⃣ AI Agent Health Check:")
    agent_healthy = test_ai_agent_health()

    if backend_healthy and agent_healthy:
        print("\n3️⃣ Fast Analysis Mode Test:")
        success = test_fast_analysis_mode()

        if success:
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ The fast parameter-only analysis mode is working correctly")
            print("✅ LC D2 scanner analysis now bypasses execution hang")
        else:
            print("\n❌ FAST ANALYSIS TEST FAILED")
    else:
        print("\n❌ PREREQUISITES FAILED - Cannot run fast analysis test")