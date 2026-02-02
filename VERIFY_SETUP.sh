#!/bin/bash
# CE-Hub Complete Setup Verification
# This script verifies that Cole's Gold Standard + Archon is fully operational

echo "═════════════════════════════════════════════════════════"
echo "🔍 CE-HUB SETUP VERIFICATION"
echo "═════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_passed=0
check_failed=0

# Function to check a service
check_service() {
    local name="$1"
    local command="$2"
    local url="$3"

    echo -n "Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        if [ -n "$url" ]; then
            echo "  → $url"
        fi
        ((check_passed++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((check_failed++))
        return 1
    fi
}

# 1. Docker Status
echo "━━━ DOCKER ━━━"
check_service "Docker Desktop" "docker info > /dev/null 2>&1"
echo ""

# 2. Archon Services
echo "━━━ ARCHON SERVICES ━━━"
check_service "Archon UI" "curl -s http://localhost:3737 > /dev/null" "http://localhost:3737"
check_service "Archon Server" "curl -s http://localhost:8181/health > /dev/null" "http://localhost:8181"
check_service "Archon MCP" "curl -s http://localhost:8051 > /dev/null" "http://localhost:8051"
echo ""

# 3. Container Status
echo "━━━ DOCKER CONTAINERS ━━━"
if docker ps | grep -q "archon-mcp.*healthy"; then
    echo -e "${GREEN}✓${NC} archon-mcp (healthy)"
    ((check_passed++))
else
    echo -e "${RED}✗${NC} archon-mcp not healthy"
    ((check_failed++))
fi

if docker ps | grep -q "archon-server.*healthy"; then
    echo -e "${GREEN}✓${NC} archon-server (healthy)"
    ((check_passed++))
else
    echo -e "${RED}✗${NC} archon-server not healthy"
    ((check_failed++))
fi

if docker ps | grep -q "archon-ui.*healthy"; then
    echo -e "${GREEN}✓${NC} archon-ui (healthy)"
    ((check_passed++))
else
    echo -e "${RED}✗${NC} archon-ui not healthy"
    ((check_failed++))
fi
echo ""

# 4. MCP Configuration
echo "━━━ MCP CONFIGURATION ━━━"
if [ -f "/Users/michaeldurante/ai dev/ce-hub/.mcp.json" ]; then
    echo -e "${GREEN}✓${NC} .mcp.json exists"
    ((check_passed++))
    if grep -q "archon" "/Users/michaeldurante/ai dev/ce-hub/.mcp.json"; then
        echo -e "${GREEN}✓${NC} Archon MCP configured"
        ((check_passed++))
    else
        echo -e "${RED}✗${NC} Archon MCP not found in config"
        ((check_failed++))
    fi
else
    echo -e "${RED}✗${NC} .mcp.json not found"
    ((check_failed++))
fi
echo ""

# 5. Workflow Files
echo "━━━ COLE'S GOLD STANDARD WORKFLOW ━━━"
workflow_files=(
    "MASTER_PLAN.md"
    "YOUR_DAILY_WORKFLOW.md"
    "COLES_GOLD_STANDARD_COMPLETE.md"
    "DAILY_WORKFLOW_GUIDE.md"
    "CORRECT_WORKFLOW.md"
    ".claude/instructions/MESSAGE_AUTO_TRANSFORM.md"
    ".claude/instructions/SESSION_INIT.md"
    ".claude/instructions/SESSION_HANDOFF.md"
)

for file in "${workflow_files[@]}"; do
    if [ -f "/Users/michaeldurante/ai dev/ce-hub/$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((check_passed++))
    else
        echo -e "${RED}✗${NC} $file missing"
        ((check_failed++))
    fi
done
echo ""

# 6. Knowledge Base Structure
echo "━━━ KNOWLEDGE BASE STRUCTURE ━━━"
if [ -d "/Users/michaeldurante/ai dev/ce-hub/_KNOWLEDGE_BASE_" ]; then
    echo -e "${GREEN}✓${NC} _KNOWLEDGE_BASE_/ directory exists"
    ((check_passed++))
else
    echo -e "${YELLOW}⚠${NC} _KNOWLEDGE_BASE_/ directory missing (will be created on first use)"
fi

# Check subdirectories
kb_dirs=("learnings" "patterns" "decisions")
for dir in "${kb_dirs[@]}"; do
    full_path="/Users/michaeldurante/ai dev/ce-hub/_KNOWLEDGE_BASE_/$dir"
    if [ -d "$full_path" ]; then
        echo -e "${GREEN}✓${NC} _KNOWLEDGE_BASE_/$dir/"
        ((check_passed++))
    else
        echo -e "${YELLOW}⚠${NC} _KNOWLED_BASE_/$dir/ missing (will be created on first use)"
    fi
done
echo ""

# 7. Commands
echo "━━━ QUICK COMMANDS ━━━"
if [ -x "/Users/michaeldurante/ai dev/ce-hub/plan" ]; then
    echo -e "${GREEN}✓${NC} plan command"
    ((check_passed++))
else
    echo -e "${RED}✗${NC} plan command not executable"
    ((check_failed++))
fi

if [ -x "/Users/michaeldurante/ai dev/ce-hub/status" ]; then
    echo -e "${GREEN}✓${NC} status command"
    ((check_passed++))
else
    echo -e "${RED}✗${NC} status command not executable"
    ((check_failed++))
fi

if [ -x "/Users/michaeldurante/ai dev/ce-hub/claude" ]; then
    echo -e "${GREEN}✓${NC} claude command"
    ((check_passed++))
else
    echo -e "${RED}✗${NC} claude command not executable"
    ((check_failed++))
fi
echo ""

# Summary
echo "═════════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "═════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}$check_passed${NC}"
echo -e "Failed: ${RED}$check_failed${NC}"
echo ""

if [ $check_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! You're ready to work!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open Archon UI: http://localhost:3737"
    echo "2. Set up your API key in Archon"
    echo "3. Start working from CE-Hub:"
    echo "   cd '/Users/michaeldurante/ai dev/ce-hub'"
    echo "   status               # Check current status"
    echo "   plan                 # See master plan"
    echo ""
    echo "Your workflow:"
    echo "1. Start NEW chat in Claude Code (from ce-hub directory)"
    echo "2. Work on your tasks"
    echo "3. Capture learnings to _KNOWLEDGE_BASE_/learnings/"
    echo "4. Do session handoff when done"
    echo ""
    echo "Archon will be available for knowledge search during work!"
else
    echo -e "${YELLOW}⚠ Some checks failed. Review above for details.${NC}"
fi
echo "═════════════════════════════════════════════════════════"
