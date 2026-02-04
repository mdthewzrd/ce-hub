#!/bin/bash
################################################################################
# Local Testing Script
# For testing the VPS Mobile VSCode system locally before deployment
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}
╔════════════════════════════════════════════════════════════╗
║     VPS Mobile VSCode - Local Testing Setup              ║
╚════════════════════════════════════════════════════════════╝
${NC}"

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install python3
    else
        sudo apt-get install -y python3
    fi
fi

if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}tmux not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install tmux
    else
        sudo apt-get install -y tmux
    fi
fi

# Setup Python environment
echo -e "${BLUE}Setting up Python environment...${NC}"
cd "$PROJECT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p "$PROJECT_DIR"/{backend/{instances,sessions,users},workspace,logs}

# Test Claude CLI
echo -e "${BLUE}Checking Claude CLI...${NC}"
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✓ Claude CLI found$(NC}"
else
    echo -e "${YELLOW}⚠ Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code${NC}"
fi

# Create test user
echo -e "${BLUE}Creating test user...${NC}"
python3 << EOF
import sys
sys.path.insert(0, '.')
from auth import UserManager

manager = UserManager()
try:
    user = manager.create_user("testuser", "testpass123", "test@example.com")
    print(f"✓ Test user created: {user['username']}")
except ValueError as e:
    if "already exists" in str(e):
        print("✓ Test user already exists")
    else:
        print(f"✗ Error: {e}")
EOF

# Start server
echo -e "${BLUE}Starting API server...${NC}"
echo -e "${GREEN}API will be available at: http://localhost:8112${NC}"
echo -e "${GREEN}Test credentials: testuser / testpass123${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

# Kill any existing server on port 8112
lsof -ti:8112 | xargs kill -9 2>/dev/null || true

# Start server
uvicorn main:app --host 127.0.0.1 --port 8112 --reload
