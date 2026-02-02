#!/usr/bin/env python3
"""
CE-Hub Mobile Platform Validator and Tester
Validates all mobile CE-Hub components and provides comprehensive testing
"""

import requests
import json
import time
from pathlib import Path

class CEHubValidator:
    def __init__(self):
        self.base_ip = "100.95.223.19"
        self.ports = {
            'mobile_interface': 8106,  # New simple mobile
            'api_server': 8107,      # Existing API
            'file_server': 8105,     # Existing file server
        }
        self.results = {}

    def test_connectivity(self):
        """Test basic connectivity to all servers"""
        print("🔍 Testing Server Connectivity...")
        print("=" * 50)

        for service_name, port in self.ports.items():
            try:
                # Test mobile interface
                if service_name == 'mobile_interface':
                    url = f"http://{self.base_ip}:{port}/mobile"
                else:
                    url = f"http://{self.base_ip}:{port}/"

                response = requests.get(url, timeout=5)
                status = "✅ ONLINE" if response.status_code == 200 else f"❌ ERROR {response.status_code}"
                self.results[service_name] = {'status': response.status_code, 'url': url}
                print(f"{service_name:15} Port {port}: {status}")

            except Exception as e:
                print(f"{service_name:15} Port {port}: ❌ OFFLINE ({str(e)[:30]})")
                self.results[service_name] = {'status': 'offline', 'error': str(e)}

    def test_api_endpoints(self):
        """Test API server endpoints"""
        print("\n🔍 Testing API Endpoints...")
        print("=" * 50)

        if self.results.get('api_server', {}).get('status') != 200:
            print("❌ API server not available - skipping API tests")
            return

        # Test agents endpoint
        try:
            response = requests.get(f"http://{self.base_ip}:8107/agents", timeout=5)
            if response.status_code == 200:
                data = response.json()
                agents = data.get('agents', [])
                print(f"✅ Agents API: {len(agents)} agents available")
                for agent in agents[:3]:
                    print(f"   - {agent.get('name', 'Unknown')}: {agent.get('description', '')[:50]}")
            else:
                print(f"❌ Agents API: Failed (Status {response.status_code})")
        except Exception as e:
            print(f"❌ Agents API: Error - {str(e)}")

        # Test files API
        try:
            response = requests.get(f"http://{self.base_ip}:8107/files-api?path=", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    items = data.get('items', [])
                    dirs = [i for i in items if i.get('type') == 'directory']
                    files = [i for i in items if i.get('type') == 'file']
                    print(f"✅ Files API: {len(dirs)} directories, {len(files)} files")
                    print(f"   📁 Main directories: {[d.get('name') for d in dirs if d.get('name') in ['core', 'projects', 'assets']]}")
                else:
                    print(f"❌ Files API: {data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Files API: Failed (Status {response.status_code})")
        except Exception as e:
            print(f"❌ Files API: Error - {str(e)}")

    def test_simple_mobile_api(self):
        """Test the new simple mobile API"""
        print("\n🔍 Testing Simple Mobile API...")
        print("=" * 50)

        if self.results.get('mobile_interface', {}).get('status') != 200:
            print("❌ Simple mobile server not available - skipping tests")
            return

        # Test files API
        try:
            response = requests.get(f"http://{self.base_ip}:8106/api/files?path=", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    items = data.get('items', [])
                    dirs = [i for i in items if i.get('type') == 'directory']
                    files = [i for i in items if i.get('type') == 'file']
                    print(f"✅ Mobile Files API: {len(dirs)} directories, {len(files)} files")
                    print(f"   📁 Main directories: {[d.get('name') for d in dirs if d.get('name') in ['core', 'projects', 'assets']]}")
                    print(f"   📄 Sample files: {[f.get('name') for f in files[:3]]}")
                else:
                    print(f"❌ Mobile Files API: {data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Mobile Files API: Failed (Status {response.status_code})")
        except Exception as e:
            print(f"❌ Mobile Files API: Error - {str(e)}")

        # Test read file API
        try:
            response = requests.get(f"http://{self.base_ip}:8106/api/read?path=README.md", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    content_length = len(data.get('content', ''))
                    print(f"✅ Mobile Read API: README.md ({content_length} characters)")
                else:
                    print(f"❌ Mobile Read API: {data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Mobile Read API: Failed (Status {response.status_code})")
        except Exception as e:
            print(f"❌ Mobile Read API: Error - {str(e)}")

    def test_mobile_interface_content(self):
        """Test mobile interface HTML content"""
        print("\n🔍 Testing Mobile Interface Content...")
        print("=" * 50)

        if self.results.get('mobile_interface', {}).get('status') != 200:
            print("❌ Mobile interface not available")
            return

        try:
            response = requests.get(f"http://{self.base_ip}:8106/mobile", timeout=5)
            if response.status_code == 200:
                content = response.text
                if "CE-Hub Mobile" in content:
                    print("✅ Mobile interface: Title found")
                if "api/files" in content:
                    print("✅ Mobile interface: API calls present")
                if "loadFiles" in content or "fetch(" in content:
                    print("✅ Mobile interface: JavaScript present")
                if "breadcrumb" in content:
                    print("✅ Mobile interface: Navigation present")
                print(f"✅ Mobile interface: {len(content)} characters loaded")
            else:
                print(f"❌ Mobile interface: Failed (Status {response.status_code})")
        except Exception as e:
            print(f"❌ Mobile interface: Error - {str(e)}")

    def test_ce_hub_directory_structure(self):
        """Test that we're serving the correct CE-Hub directory"""
        print("\n🔍 Testing CE-Hub Directory Structure...")
        print("=" * 50)

        expected_dirs = ['core', 'projects', 'assets', 'archive', 'workspace']
        expected_files = ['README.md', 'mobile-pro-v3-fixed.html']

        try:
            response = requests.get(f"http://{self.base_ip}:8106/api/files?path=", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    items = data.get('items', [])
                    item_names = [item.get('name') for item in items]

                    found_dirs = [d for d in expected_dirs if d in item_names]
                    found_files = [f for f in expected_files if f in item_names]

                    print(f"📁 Expected directories: {len(found_dirs)}/{len(expected_dirs)} found")
                    for d in expected_dirs:
                        status = "✅" if d in item_names else "❌"
                        print(f"   {status} {d}")

                    print(f"📄 Expected files: {len(found_files)}/{len(expected_files)} found")
                    for f in expected_files:
                        status = "✅" if f in item_names else "❌"
                        print(f"   {status} {f}")

                    if len(found_dirs) >= 3:
                        print("✅ CE-Hub directory structure verified")
                    else:
                        print("❌ CE-Hub directory structure incomplete")
                else:
                    print(f"❌ Directory check failed: {data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Directory check failed (Status {response.status_code})")
        except Exception as e:
            print(f"❌ Directory check error: {str(e)}")

    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "="*60)
        print("🎯 CE-HUB MOBILE PLATFORM VALIDATION SUMMARY")
        print("="*60)

        # Server status
        online_services = sum(1 for r in self.results.values() if r.get('status') == 200)
        total_services = len(self.results)
        print(f"📊 Services: {online_services}/{total_services} online")

        # Mobile interface access
        mobile_url = f"http://{self.base_ip}:8106/mobile"
        print(f"📱 Mobile Interface: {mobile_url}")

        # Recommendations
        print(f"\n📋 RECOMMENDATIONS:")
        if online_services >= 1:
            if self.results.get('mobile_interface', {}).get('status') == 200:
                print("✅ Use the simple mobile interface (port 8106) - it's clean and working")
            if self.results.get('api_server', {}).get('status') == 200:
                print("✅ API server available for agent functionality")
        else:
            print("❌ No services are online - check server configuration")

        print(f"\n🔍 FOR FURTHER TESTING:")
        print(f"1. Open {mobile_url} in a desktop browser first")
        print(f"2. Test the interface loads and shows CE-Hub directories")
        print(f"3. Try accessing from your mobile device")
        print(f"4. Check browser console for any JavaScript errors")

        return mobile_url

    def run_full_validation(self):
        """Run complete validation suite"""
        print("🚀 CE-HUB MOBILE PLATFORM VALIDATOR")
        print("Running comprehensive tests...\n")

        self.test_connectivity()
        self.test_api_endpoints()
        self.test_simple_mobile_api()
        self.test_mobile_interface_content()
        self.test_ce_hub_directory_structure()

        return self.generate_summary_report()

if __name__ == "__main__":
    validator = CEHubValidator()
    validator.run_full_validation()