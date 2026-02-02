#!/usr/bin/env python3
"""
Claude Session Bridge - Use browser session for API calls
This attempts to bridge your claude.ai subscription session for mobile use
"""

import requests
import json
import os
import sys
from pathlib import Path

class ClaudeSessionBridge:
    def __init__(self):
        self.session = requests.Session()
        self.base_url = "https://claude.ai"

    def extract_browser_session(self):
        """
        Extract session from browser - requires manual cookie export
        """
        print("🍪 Claude Session Bridge")
        print("=" * 25)
        print("To use your Claude subscription in the mobile interface:")
        print()
        print("1. 🌐 Open claude.ai in your browser")
        print("2. 🔓 Make sure you're logged in")
        print("3. 🔧 Open Developer Tools (F12)")
        print("4. 📋 Go to Application/Storage → Cookies → claude.ai")
        print("5. 🔑 Copy the 'sessionKey' cookie value")
        print("6. 📝 Paste it when prompted below")
        print()

        session_key = input("Enter your claude.ai session key: ").strip()

        if not session_key:
            print("❌ No session key provided")
            return False

        # Set up session
        self.session.cookies.set('sessionKey', session_key, domain='claude.ai')

        return self.test_session()

    def test_session(self):
        """Test if session works"""
        try:
            response = self.session.get(f"{self.base_url}/api/organizations")

            if response.status_code == 200:
                data = response.json()
                print("✅ Session is valid!")

                if data and len(data) > 0:
                    org = data[0]
                    print(f"   Organization: {org.get('name', 'Unknown')}")
                    print(f"   Plan: {org.get('plan', {}).get('name', 'Unknown')}")
                    return True
                else:
                    print("⚠️ No organizations found")
                    return False

            elif response.status_code == 401:
                print("❌ Session expired or invalid")
                return False
            else:
                print(f"❌ Error: {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

    def create_mobile_config(self, session_key):
        """Create config file for mobile interface"""
        config = {
            "claude_session": {
                "session_key": session_key,
                "base_url": self.base_url,
                "active": True
            }
        }

        config_file = Path(".claude-mobile-config.json")
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"✅ Mobile config saved to {config_file}")
        return True

def main():
    print("🚀 Claude Subscription Bridge for Mobile")
    print("=" * 40)
    print()
    print("This tool bridges your claude.ai subscription")
    print("to work with the mobile interface.")
    print()
    print("⚠️  IMPORTANT:")
    print("   • This requires your browser session cookies")
    print("   • Session may expire and need renewal")
    print("   • This is a workaround, not official API")
    print()

    bridge = ClaudeSessionBridge()

    if bridge.extract_browser_session():
        print()
        print("🎉 Success! Your mobile interface should now")
        print("   be able to use your Claude subscription.")
        print()
        print("💡 If this stops working:")
        print("   • Re-run this script to refresh session")
        print("   • Or get Claude API access for permanent solution")
        return True
    else:
        print()
        print("❌ Failed to set up session bridge.")
        print()
        print("💡 Alternative options:")
        print("   1. Get Claude API key: https://console.anthropic.com")
        print("   2. Continue using Claude CLI (current setup)")
        print("   3. Use GLM models (your API key works)")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)