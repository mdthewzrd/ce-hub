#!/bin/bash

# Instagram Automation System - Startup Script
# Starts all services in the correct order

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(pwd)"
CAPTION_ENGINE_DIR="$PROJECT_ROOT/backend/caption_engine"
INSTAGRAM_AUTO_DIR="$PROJECT_ROOT/backend/instagram_automation"
SESSION_DIR="$PROJECT_ROOT/.sessions"

# Ports
CAPTION_ENGINE_PORT=3131
INSTAGRAM_API_PORT=4400
MANYCHAT_PORT=4401
DASHBOARD_PORT=8181

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}INSTAGRAM AUTOMATION SYSTEM STARTUP${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from template...${NC}"
    cp "$PROJECT_ROOT/.env.local.example" "$PROJECT_ROOT/.env.local"
    echo -e "${RED}ERROR: .env.local not configured!${NC}"
    echo -e "${YELLOW}Please edit .env.local with your API keys and credentials:${NC}"
    echo -e "  - OPENROUTER_API_KEY${NC}"
    echo -e "  - INSTAGRAM_USERNAME${NC}"
    echo -e "  - INSTAGRAM_PASSWORD${NC}"
    echo -e "  - MANYCHAT_API_KEY${NC}"
    exit 1
fi

# Load environment variables
source "$PROJECT_ROOT/.env.local"

# Create session directory
mkdir -p "$SESSION_DIR"

echo -e "${GREEN}✓ Environment configuration loaded${NC}"
echo ""

# Initialize databases
echo -e "${BLUE}[1/4] Initializing databases...${NC}"

# Caption engine database
echo -e "  Initializing caption engine database..."
cd "$CAPTION_ENGINE_DIR"
python3 -c "from database_schema import init_database, load_initial_templates; init_database(); load_initial_templates()" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Caption engine database initialized${NC}"
else
    echo -e "${RED}  ✗ Failed to initialize caption engine database${NC}"
fi

# Instagram automation database
echo -e "  Initializing Instagram automation database..."
cd "$INSTAGRAM_AUTO_DIR"
python3 -c "from database_schema import init_database, load_initial_categories; init_database(); load_initial_categories()" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Instagram automation database initialized${NC}"
else
    echo -e "${RED}  ✗ Failed to initialize Instagram automation database${NC}"
fi

echo ""

# Function to check if port is in use
check_port() {
    PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Start services
echo -e "${BLUE}[2/4] Starting backend services...${NC}"

# Caption Engine API
if check_port $CAPTION_ENGINE_PORT; then
    echo -e "${YELLOW}  ! Caption Engine API already running on port $CAPTION_ENGINE_PORT${NC}"
else
    echo -e "  Starting Caption Engine API (port $CAPTION_ENGINE_PORT)..."
    cd "$CAPTION_ENGINE_DIR"
    python3 api.py > "$SESSION_DIR/caption_engine.log" 2>&1 &
    CAPTION_ENGINE_PID=$!
    echo $CAPTION_ENGINE_PID > "$SESSION_DIR/caption_engine.pid"
    echo -e "${GREEN}  ✓ Caption Engine API started (PID: $CAPTION_ENGINE_PID)${NC}"
    sleep 2
fi

# Instagram Automation API
if check_port $INSTAGRAM_API_PORT; then
    echo -e "${YELLOW}  ! Instagram API already running on port $INSTAGRAM_API_PORT${NC}"
else
    echo -e "  Starting Instagram Automation API (port $INSTAGRAM_API_PORT)..."
    cd "$INSTAGRAM_AUTO_DIR"
    python3 api.py > "$SESSION_DIR/instagram_api.log" 2>&1 &
    INSTAGRAM_API_PID=$!
    echo $INSTAGRAM_API_PID > "$SESSION_DIR/instagram_api.pid"
    echo -e "${GREEN}  ✓ Instagram Automation API started (PID: $INSTAGRAM_API_PID)${NC}"
    sleep 2
fi

# ManyChat Webhook Handler
if check_port $MANYCHAT_PORT; then
    echo -e "${YELLOW}  ! ManyChat webhook already running on port $MANYCHAT_PORT${NC}"
else
    echo -e "  Starting ManyChat webhook handler (port $MANYCHAT_PORT)..."
    cd "$INSTAGRAM_AUTO_DIR"
    python3 manychat_integration.py > "$SESSION_DIR/manychat.log" 2>&1 &
    MANYCHAT_PID=$!
    echo $MANYCHAT_PID > "$SESSION_DIR/manychat.pid"
    echo -e "${GREEN}  ✓ ManyChat webhook handler started (PID: $MANYCHAT_PID)${NC}"
    sleep 2
fi

echo ""

# Health checks
echo -e "${BLUE}[3/4] Checking service health...${NC}"

# Caption Engine health
if curl -s http://localhost:$CAPTION_ENGINE_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Caption Engine API is healthy${NC}"
else
    echo -e "${RED}  ✗ Caption Engine API is not responding${NC}"
fi

# Instagram API health
if curl -s http://localhost:$INSTAGRAM_API_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Instagram Automation API is healthy${NC}"
else
    echo -e "${RED}  ✗ Instagram Automation API is not responding${NC}"
fi

# ManyChat health
if curl -s http://localhost:$MANYCHAT_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ ManyChat webhook handler is healthy${NC}"
else
    echo -e "${RED}  ✗ ManyChat webhook handler is not responding${NC}"
fi

echo ""

# Dashboard
echo -e "${BLUE}[4/4] Starting React dashboard...${NC}"
echo -e "${YELLOW}  To start the dashboard, run:${NC}"
echo -e "  ${GREEN}npm run dev:instagram${NC}"
echo -e ""
echo -e "${YELLOW}  Dashboard will be available at:${NC}"
echo -e "  ${BLUE}http://localhost:$DASHBOARD_PORT/instagram-dashboard${NC}"
echo ""

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "Service URLs:"
echo -e "  Caption Engine API:    ${BLUE}http://localhost:$CAPTION_ENGINE_PORT${NC}"
echo -e "  Instagram API:          ${BLUE}http://localhost:$INSTAGRAM_API_PORT${NC}"
echo -e "  ManyChat Webhooks:      ${BLUE}http://localhost:$MANYCHAT_PORT${NC}"
echo -e "  Dashboard:              ${BLUE}http://localhost:$DASHBOARD_PORT/instagram-dashboard${NC}"
echo ""
echo -e "API Documentation:"
echo -e "  Caption Engine:         ${BLUE}http://localhost:$CAPTION_ENGINE_PORT/docs${NC}"
echo -e "  Instagram API:          ${BLUE}http://localhost:$INSTAGRAM_API_PORT/docs${NC}"
echo ""
echo -e "Logs:"
echo -e "  Caption Engine:         ${YELLOW}$SESSION_DIR/caption_engine.log${NC}"
echo -e "  Instagram API:          ${YELLOW}$SESSION_DIR/instagram_api.log${NC}"
echo -e "  ManyChat:               ${YELLOW}$SESSION_DIR/manychat.log${NC}"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo -e "  ${GREEN}./stop-instagram-automation.sh${NC}"
echo ""

# Keep script running or exit
if [ "$1" != "--no-wait" ]; then
    echo -e "Press Ctrl+C to stop all services..."
    trap "echo -e '${RED}Stopping all services...${NC}'; ./stop-instagram-automation.sh; exit" INT

    # Wait for interrupt
    while true; do
        sleep 1
    done
fi
