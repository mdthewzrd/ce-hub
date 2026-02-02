#!/bin/bash

# Instagram Automation - Quick Setup Script
# Automates database initialization and environment setup

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}INSTAGRAM AUTOMATION SETUP${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

PROJECT_ROOT="$(pwd)"
CAPTION_ENGINE_DIR="$PROJECT_ROOT/backend/caption_engine"
INSTAGRAM_AUTO_DIR="$PROJECT_ROOT/backend/instagram_automation"

# ============================================================
# Phase 1: Check Prerequisites
# ============================================================

echo -e "${BLUE}[Phase 1/5] Checking prerequisites...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    echo -e "${GREEN}  ✓ Python $PYTHON_VERSION found${NC}"
else
    echo -e "${RED}  ✗ Python 3 not found${NC}"
    echo -e "${YELLOW}  Install Python 3.8+ from https://python.org${NC}"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}  ✓ Node.js $NODE_VERSION found${NC}"
else
    echo -e "${YELLOW}  ! Node.js not found (optional for backend)${NC}"
fi

# Check SQLite
if command -v sqlite3 &> /dev/null; then
    echo -e "${GREEN}  ✓ SQLite3 found${NC}"
else
    echo -e "${YELLOW}  ! SQLite3 not found${NC}"
fi

echo ""

# ============================================================
# Phase 2: Install Dependencies
# ============================================================

echo -e "${BLUE}[Phase 2/5] Installing dependencies...${NC}"

# Caption Engine dependencies
echo -e "  Installing caption engine dependencies..."
cd "$CAPTION_ENGINE_DIR"

# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo -e "    Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}  ✓ Caption engine dependencies installed${NC}"

# Instagram automation dependencies
echo -e "  Installing Instagram automation dependencies..."
cd "$INSTAGRAM_AUTO_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "    Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}  ✓ Instagram automation dependencies installed${NC}"

cd "$PROJECT_ROOT"
echo ""

# ============================================================
# Phase 3: Setup Environment File
# ============================================================

echo -e "${BLUE}[Phase 3/5] Setting up environment...${NC}"

ENV_FILE="$PROJECT_ROOT/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "  Creating .env.local from template..."
    cp "$PROJECT_ROOT/.env.local.example" "$ENV_FILE"
    echo -e "${GREEN}  ✓ .env.local created${NC}"
    echo -e "${YELLOW}  ⚠️  EDIT .env.local WITH YOUR CREDENTIALS:${NC}"
    echo -e "     - OPENROUTER_API_KEY (get from https://openrouter.ai/keys)"
    echo -e "     - INSTAGRAM_USERNAME"
    echo -e "     - INSTAGRAM_PASSWORD"
    echo ""
    read -p "Press Enter to open editor now, or Ctrl+C to edit later..."
    ${EDITOR:-nano} "$ENV_FILE"
else
    echo -e "${GREEN}  ✓ .env.local already exists${NC}"
fi

echo ""

# ============================================================
# Phase 4: Initialize Databases
# ============================================================

echo -e "${BLUE}[Phase 4/5] Initializing databases...${NC}"

# Caption engine database
echo -e "  Initializing caption engine database..."
cd "$CAPTION_ENGINE_DIR"
source venv/bin/activate

python3 -c "
from database_schema import init_database, load_initial_templates
init_database()
load_initial_templates()
print('✓ Caption engine database initialized')
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Caption engine database initialized${NC}"
else
    echo -e "${RED}  ✗ Failed to initialize caption engine database${NC}"
fi

# Instagram automation database
echo -e "  Initializing Instagram automation database..."
cd "$INSTAGRAM_AUTO_DIR"
source venv/bin/activate

python3 -c "
from database_schema import init_database, load_initial_categories
init_database()
load_initial_categories()
print('✓ Instagram automation database initialized')
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Instagram automation database initialized${NC}"
else
    echo -e "${RED}  ✗ Failed to initialize Instagram automation database${NC}"
fi

cd "$PROJECT_ROOT"
echo ""

# ============================================================
# Phase 5: Verify Setup
# ============================================================

echo -e "${BLUE}[Phase 5/5] Verifying setup...${NC}"

# Check databases
if [ -f "$CAPTION_ENGINE_DIR/instagram_captions.db" ]; then
    TABLES=$(sqlite3 "$CAPTION_ENGINE_DIR/instagram_captions.db" ".tables" | wc -l)
    echo -e "${GREEN}  ✓ Caption engine database ($TABLES tables)${NC}"
else
    echo -e "${RED}  ✗ Caption engine database not found${NC}"
fi

if [ -f "$INSTAGRAM_AUTO_DIR/instagram_automation.db" ]; then
    TABLES=$(sqlite3 "$INSTAGRAM_AUTO_DIR/instagram_automation.db" ".tables" | wc -l)
    echo -e "${GREEN}  ✓ Instagram automation database ($TABLES tables)${NC}"
else
    echo -e "${RED}  ✗ Instagram automation database not found${NC}"
fi

# Check .env.local
if [ -f "$ENV_FILE" ]; then
    if grep -q "sk-or-" "$ENV_FILE" 2>/dev/null; then
        echo -e "${GREEN}  ✓ OpenRouter API key configured${NC}"
    else
        echo -e "${YELLOW}  ! OpenRouter API key not set${NC}"
    fi

    if grep -q "INSTAGRAM_USERNAME=" "$ENV_FILE" && ! grep -q "INSTAGRAM_USERNAME=$" "$ENV_FILE"; then
        echo -e "${GREEN}  ✓ Instagram credentials configured${NC}"
    else
        echo -e "${YELLOW}  ! Instagram credentials not set${NC}"
    fi
fi

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}SETUP COMPLETE!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. ${GREEN}Edit .env.local${NC} with your credentials (if not done)"
echo -e "  2. ${GREEN}Start services:${NC} ./start-instagram-automation.sh"
echo -e "  3. ${GREEN}Open dashboard:${NC} http://localhost:8181/instagram-dashboard"
echo ""
echo -e "For detailed setup guide, see: ${BLUE}INSTAGRAM_SETUP_CHECKLIST.md${NC}"
echo ""
