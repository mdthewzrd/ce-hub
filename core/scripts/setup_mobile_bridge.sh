#!/bin/bash

# CE-Hub Mobile Bridge Setup and Validation Script
# This script ensures the complete mobile integration platform is ready

set -e

echo "🚀 CE-Hub Mobile Bridge Setup & Validation"
echo "============================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [[ ! -f "ce-hub" ]]; then
    echo -e "${RED}❌ Please run this script from the CE-Hub root directory${NC}"
    exit 1
fi

echo -e "\n${BLUE}📋 Phase 1: Environment Validation${NC}"

# Check bridge directory
if [[ -d "$HOME/.claude-bridge" ]]; then
    echo -e "${GREEN}✅ Bridge directory exists${NC}"
else
    echo -e "${RED}❌ Bridge directory missing${NC}"
    exit 1
fi

# Check token file
if [[ -f "$HOME/.claude-bridge/token.txt" ]]; then
    TOKEN=$(cat "$HOME/.claude-bridge/token.txt")
    echo -e "${GREEN}✅ Authentication token found: ${TOKEN:0:16}...${NC}"
else
    echo -e "${RED}❌ Authentication token missing${NC}"
    exit 1
fi

# Check tmux session
if tmux has-session -t claude 2>/dev/null; then
    echo -e "${GREEN}✅ Claude tmux session active${NC}"
else
    echo -e "${YELLOW}⚠️  Creating Claude tmux session${NC}"
    tmux new -s claude -d
    echo -e "${GREEN}✅ Claude tmux session created${NC}"
fi

echo -e "\n${BLUE}🔧 Phase 2: Bridge Server Validation${NC}"

# Check if bridge server is running
if curl -s http://127.0.0.1:8008/healthz >/dev/null; then
    echo -e "${GREEN}✅ Bridge server responding${NC}"
    HEALTH_DATA=$(curl -s http://127.0.0.1:8008/healthz)
    echo -e "   Status: ${HEALTH_DATA}"
else
    echo -e "${YELLOW}⚠️  Starting bridge server${NC}"
    launchctl start com.michaeldurante.claude-bridge 2>/dev/null || echo "LaunchAgent not configured"
    sleep 3

    if curl -s http://127.0.0.1:8008/healthz >/dev/null; then
        echo -e "${GREEN}✅ Bridge server started successfully${NC}"
    else
        echo -e "${RED}❌ Bridge server failed to start${NC}"
        exit 1
    fi
fi

echo -e "\n${BLUE}📱 Phase 3: Mobile CLI Validation${NC}"

# Test mobile CLI
echo "Testing mobile CLI commands..."
python3 scripts/mobile_desktop_cli.py status > /dev/null
echo -e "${GREEN}✅ Mobile CLI operational${NC}"

echo -e "\n${BLUE}🔌 Phase 4: Connection Test${NC}"

# Run mobile bridge test
echo "Running comprehensive connection test..."
if python3 scripts/test_mobile_bridge.py > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Mobile bridge connection test passed${NC}"
else
    echo -e "${RED}❌ Mobile bridge connection test failed${NC}"
    echo "Run: python3 scripts/test_mobile_bridge.py for details"
    exit 1
fi

echo -e "\n${BLUE}🌐 Phase 5: Network Setup Check${NC}"

# Check Tailscale status
if command -v tailscale >/dev/null 2>&1; then
    if tailscale status >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Tailscale connected${NC}"
        echo -e "   To expose bridge: ${YELLOW}tailscale serve --https=443 --bg localhost:8008${NC}"
    else
        echo -e "${YELLOW}⚠️  Tailscale not connected${NC}"
        echo -e "   Connect with: ${YELLOW}tailscale up${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Tailscale not installed${NC}"
    echo -e "   Install from: ${YELLOW}https://tailscale.com/download${NC}"
fi

echo -e "\n${BLUE}🎯 Phase 6: Quick Functionality Test${NC}"

# Test actual command execution
echo "Testing command execution..."
TEST_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text":"echo Mobile bridge test: $(date)", "wait_ms": 1500}' \
    http://127.0.0.1:8008/send)

if echo "$TEST_RESULT" | grep -q "Mobile bridge test:"; then
    echo -e "${GREEN}✅ Command execution working${NC}"
    JOB_ID=$(echo "$TEST_RESULT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "   Test job ID: ${JOB_ID}"
else
    echo -e "${RED}❌ Command execution failed${NC}"
    echo "Response: $TEST_RESULT"
    exit 1
fi

echo -e "\n${GREEN}🎉 Mobile Bridge Setup Complete!${NC}"
echo -e "=========================================="
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo -e "1. Set up Tailscale: ${YELLOW}tailscale serve --https=443 --bg localhost:8008${NC}"
echo -e "2. Create iOS shortcuts using the token: ${YELLOW}${TOKEN:0:32}...${NC}"
echo -e "3. Test from mobile device"
echo -e "4. Read full guide: ${YELLOW}docs/mobile-integration-guide.md${NC}"

echo -e "\n${BLUE}🔧 Available Commands:${NC}"
echo -e "• ${YELLOW}ce-hub mobile status${NC}      - Check mobile sessions"
echo -e "• ${YELLOW}ce-hub mobile list${NC}        - List mobile work"
echo -e "• ${YELLOW}python3 scripts/test_mobile_bridge.py${NC} - Test connection"

echo -e "\n${BLUE}🌐 Bridge URLs:${NC}"
echo -e "• Local: ${YELLOW}http://127.0.0.1:8008${NC}"
echo -e "• Health: ${YELLOW}http://127.0.0.1:8008/healthz${NC}"
echo -e "• Docs: ${YELLOW}http://127.0.0.1:8008/docs${NC}"

echo -e "\n✨ Your mobile development bridge is ready for use!"