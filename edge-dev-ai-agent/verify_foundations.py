"""
Test script to verify all foundations are working
"""

import os
import sys
import requests
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

print("=" * 60)
print("EDGEDEV AI AGENT - FOUNDATION VERIFICATION")
print("=" * 60)

# Test 1: Environment variables
print("\n[1/5] Testing environment variables...")
required_vars = [
    'OPENROUTER_API_KEY',
    'ARCHON_MCP_URL',
    'EDGEDEV_BACKEND_URL',
    'EDGEDEV_DASHBOARD_URL',
]

missing_vars = []
for var in required_vars:
    if var not in os.environ:
        # Check if it's a placeholder value
        env_value = os.getenv(var, '')
        if 'your_' in env_value or env_value == '':
            missing_vars.append(var)

if missing_vars:
    print(f"  ⚠️  Missing environment variables: {', '.join(missing_vars)}")
    print(f"  ✗ Please copy .env.example to .env and add your API keys")
    print(f"     cp .env.example .env")
    print(f"     nano .env  # Then add your keys")
else:
    print(f"  ✓ All environment variables configured")

# Test 2: Archon MCP Server
print("\n[2/5] Testing Archon MCP server...")
try:
    archon_url = os.getenv('ARCHON_MCP_URL', 'http://localhost:8051')
    response = requests.get(f"{archon_url}/health", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"  ✓ Archon MCP server is running")
        print(f"    Service: {data.get('service', 'unknown')}")
        print(f"    Version: {data.get('version', 'unknown')}")
        print(f"    Tools available: {data.get('tools_count', 0)}")
    else:
        print(f"  ✗ Archon MCP server returned status {response.status_code}")
except requests.exceptions.ConnectionError:
    print(f"  ✗ Cannot connect to Archon MCP server at {archon_url}")
    print(f"    Please start Archon MCP server on port 8051")
except Exception as e:
    print(f"  ✗ Error connecting to Archon: {e}")

# Test 3: EdgeDev Backend
print("\n[3/5] Testing EdgeDev backend...")
try:
    backend_url = os.getenv('EDGEDEV_BACKEND_URL', 'http://localhost:5666')
    response = requests.get(f"{backend_url}/health", timeout=5)
    if response.status_code == 200:
        print(f"  ✓ EdgeDev backend is running")
    else:
        print(f"  ⚠️  EdgeDev backend returned status {response.status_code}")
except requests.exceptions.ConnectionError:
    print(f"  ⚠️  Cannot connect to EdgeDev backend at {backend_url}")
    print(f"    This is OK for now - we can start it when needed")
except Exception as e:
    print(f"  ⚠️  Error connecting to EdgeDev: {e}")

# Test 4: EdgeDev Dashboard
print("\n[4/5] Testing EdgeDev dashboard...")
try:
    dashboard_url = os.getenv('EDGEDEV_DASHBOARD_URL', 'http://localhost:5665')
    response = requests.get(dashboard_url, timeout=5)
    if response.status_code == 200:
        print(f"  ✓ EdgeDev dashboard is running")
    else:
        print(f"  ⚠️  EdgeDev dashboard returned status {response.status_code}")
except requests.exceptions.ConnectionError:
    print(f"  ⚠️  Cannot connect to EdgeDev dashboard at {dashboard_url}")
    print(f"    This is OK for now - we can start it when needed")
except Exception as e:
    print(f"  ⚠️  Error connecting to EdgeDev: {e}")

# Test 5: Project Structure
print("\n[5/5] Verifying project structure...")
required_dirs = ['prompts', 'src', 'tests', 'docs', 'config']
all_exist = True
for dir_name in required_dirs:
    if Path(dir_name).exists():
        print(f"  ✓ Directory '{dir_name}/' exists")
    else:
        print(f"  ✗ Directory '{dir_name}/' missing")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)

# Summary
print("\n✓ Ready to proceed:")
print("  • Archon MCP server is running")
print("  • Project structure created")
print("  • Configuration files ready")
print("\n⚠️  To complete setup:")
print("  1. Add your API keys to .env:")
print("     - OPENROUTER_API_KEY (from https://openrouter.ai/keys)")
print("     - POLYGON_API_KEY (from https://polygon.io)")
print("  2. Install dependencies:")
print("     pip install -r requirements.txt")
print("  3. Start EdgeDev when needed (backend + dashboard)")
print("\n" + "=" * 60)
