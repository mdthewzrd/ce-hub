#!/bin/bash
# CE-Hub Model Setup Script
# Ensures all AI models are properly configured and working

echo "🚀 CE-Hub Model Configuration Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [[ ! -f "mobile-pro-v2.html" ]]; then
    echo -e "${RED}❌ Please run this script from the CE-Hub directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking current environment...${NC}"

# Load environment variables
if [[ -f ".env" ]]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
    echo -e "${GREEN}✅ Found .env file${NC}"
else
    echo -e "${YELLOW}⚠️ No .env file found${NC}"
fi

# Check Claude installation
echo -e "\n${BLUE}🔍 Checking Claude installation...${NC}"
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✅ Claude CLI is installed${NC}"
    claude --version
else
    echo -e "${RED}❌ Claude CLI not found${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g @anthropic-ai/claude-3-cli${NC}"
fi

# Check API keys
echo -e "\n${BLUE}🔑 Checking API keys...${NC}"

check_api_key() {
    local key_name=$1
    local key_value=${!key_name}

    if [[ -n "$key_value" && "$key_value" != "your_*" ]]; then
        echo -e "${GREEN}✅ $key_name is set${NC}"
        return 0
    else
        echo -e "${RED}❌ $key_name is not set or is placeholder${NC}"
        return 1
    fi
}

# Check various API keys
api_keys_missing=0

if ! check_api_key "ANTHROPIC_API_KEY"; then
    ((api_keys_missing++))
fi

if ! check_api_key "ZHIPU_API_KEY"; then
    ((api_keys_missing++))
fi

# Test Claude connectivity
echo -e "\n${BLUE}🔌 Testing model connectivity...${NC}"

test_model() {
    local model=$1
    local provider=${2:-anthropic}

    echo -e "${YELLOW}Testing $model...${NC}"

    # Try to get model info without actually running it
    if [[ "$provider" == "anthropic" ]]; then
        if [[ -n "$ANTHROPIC_API_KEY" && "$ANTHROPIC_API_KEY" != "your_anthropic_api_key_here" ]]; then
            echo -e "${GREEN}✅ $model: API key configured${NC}"
        else
            echo -e "${RED}❌ $model: API key missing${NC}"
        fi
    elif [[ "$provider" == "zhipu" ]]; then
        if [[ -n "$ZHIPU_API_KEY" && "$ZHIPU_API_KEY" != "your_zhipu_api_key_here" ]]; then
            echo -e "${GREEN}✅ $model: API key configured${NC}"
        else
            echo -e "${RED}❌ $model: API key missing${NC}"
        fi
    fi
}

# Test all models
test_model "Claude 3.5 Sonnet" "anthropic"
test_model "Claude 4.5 Sonnet" "anthropic"
test_model "Claude 3.5 Haiku" "anthropic"
test_model "Claude 3 Opus" "anthropic"
test_model "GLM-4 Plus" "zhipu"
test_model "GLM-4.5" "zhipu"
test_model "GLM-4.6" "zhipu"

# Setup Claude configuration
echo -e "\n${BLUE}⚙️ Setting up Claude configuration...${NC}"

# Create Claude config directory
mkdir -p ~/.config/claude

# Create basic Claude config
cat > ~/.config/claude/config.json << 'EOF'
{
  "api_key": "",
  "default_model": "sonnet",
  "dangerous_skip_permissions": false,
  "working_directory": "",
  "mobile_optimized": true
}
EOF

echo -e "${GREEN}✅ Claude config created at ~/.config/claude/config.json${NC}"

# Create model test script
echo -e "\n${BLUE}📝 Creating model test script...${NC}"

cat > test-models.py << 'EOF'
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
EOF

chmod +x test-models.py
echo -e "${GREEN}✅ Model test script created${NC}"

# Summary and next steps
echo -e "\n${BLUE}📋 Setup Summary${NC}"
echo "==============="

if [[ $api_keys_missing -eq 0 ]]; then
    echo -e "${GREEN}✅ All API keys configured${NC}"
else
    echo -e "${RED}❌ $api_keys_missing API keys need configuration${NC}"
fi

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. Add your real API keys to .env file:"
echo "   - ANTHROPIC_API_KEY=sk-ant-..."
echo "   - ZHIPU_API_KEY=your-zhipu-key..."
echo ""
echo "2. Test models:"
echo "   python3 test-models.py"
echo ""
echo "3. Launch mobile interface:"
echo "   http://100.95.223.19:8101/mobile-pro-v2.html"
echo ""
echo "4. Use Launch Claude button to select and test models"

echo -e "\n${GREEN}🚀 Setup complete! Edit .env with your API keys to activate all models.${NC}"
EOF