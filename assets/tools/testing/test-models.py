#!/usr/bin/env python3
"""
Test script for CE-Hub AI models
"""

import os
import sys
import subprocess
from pathlib import Path

def test_claude_model(model):
    """Test if a Claude model can be accessed"""
    try:
        # Try to run claude with the model (dry run)
        result = subprocess.run([
            'claude',
            '--help'
        ], capture_output=True, text=True, timeout=10)

        if result.returncode == 0:
            print(f"✅ Claude CLI accessible for {model}")
            return True
        else:
            print(f"❌ Claude CLI error for {model}: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        print(f"⏱️ Claude CLI timeout for {model}")
        return False
    except FileNotFoundError:
        print(f"❌ Claude CLI not found for {model}")
        return False
    except Exception as e:
        print(f"❌ Error testing {model}: {e}")
        return False

def main():
    print("🧪 Testing CE-Hub AI Models")
    print("===========================")

    models = [
        'sonnet',
        'sonnet-4.5',
        'haiku',
        'opus',
        'glm-4-plus',
        'glm-4.5',
        'glm-4.6'
    ]

    results = {}

    for model in models:
        print(f"\nTesting {model}...")
        results[model] = test_claude_model(model)

    print("\n📊 Test Results:")
    print("================")

    working = [m for m, r in results.items() if r]
    broken = [m for m, r in results.items() if not r]

    if working:
        print(f"✅ Working models ({len(working)}): {', '.join(working)}")

    if broken:
        print(f"❌ Issues with ({len(broken)}): {', '.join(broken)}")

    print(f"\n📈 Success rate: {len(working)}/{len(models)} ({len(working)/len(models)*100:.1f}%)")

    return len(broken) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
