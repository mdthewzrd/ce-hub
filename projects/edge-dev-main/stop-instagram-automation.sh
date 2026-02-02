#!/bin/bash

# Instagram Automation System - Stop Script
# Stops all running services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SESSION_DIR="./.sessions"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}STOPPING INSTAGRAM AUTOMATION${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to stop a service
stop_service() {
    SERVICE_NAME=$1
    PID_FILE=$2

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "Stopping $SERVICE_NAME (PID: $PID)..."
            kill $PID
            rm "$PID_FILE"
            echo -e "${GREEN}  ✓ Stopped $SERVICE_NAME${NC}"
        else
            echo -e "${YELLOW}  ! $SERVICE_NAME not running (stale PID file)${NC}"
            rm "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}  ! $SERVICE_NAME not running (no PID file)${NC}"
    fi
}

# Stop all services
echo -e "${BLUE}Stopping services...${NC}"

stop_service "Caption Engine API" "$SESSION_DIR/caption_engine.pid"
stop_service "Instagram Automation API" "$SESSION_DIR/instagram_api.pid"
stop_service "ManyChat Webhook Handler" "$SESSION_DIR/manychat.pid"

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
