#!/bin/bash
################################################################################
# VPS Mobile VSCode - Service Startup Script
# Manages all services for the multi-instance Claude system
################################################################################

set -e

INSTALL_DIR="/opt/mobile-vscode"
LOG_DIR="/var/log/mobile-vscode"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

start_api() {
    echo -e "${BLUE}Starting API server...${NC}"
    cd $INSTALL_DIR/backend
    source venv/bin/activate
    nohup uvicorn main:app --host 0.0.0.0 --port 8112 --workers 4 > $LOG_DIR/api.log 2>&1 &
    echo $! > $LOG_DIR/api.pid
    echo -e "${GREEN}✓ API server started (PID: $(cat $LOG_DIR/api.pid))${NC}"
}

start_monitor() {
    echo -e "${BLUE}Starting resource monitor...${NC}"
    cd $INSTALL_DIR/backend
    source venv/bin/activate
    nohup python monitor.py > $LOG_DIR/monitor.log 2>&1 &
    echo $! > $LOG_DIR/monitor.pid
    echo -e "${GREEN}✓ Resource monitor started (PID: $(cat $LOG_DIR/monitor.pid))${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"

    if [ -f "$LOG_DIR/api.pid" ]; then
        kill $(cat $LOG_DIR/api.pid) 2>/dev/null || true
        rm -f $LOG_DIR/api.pid
        echo -e "${GREEN}✓ API server stopped${NC}"
    fi

    if [ -f "$LOG_DIR/monitor.pid" ]; then
        kill $(cat $LOG_DIR/monitor.pid) 2>/dev/null || true
        rm -f $LOG_DIR/monitor.pid
        echo -e "${GREEN}✓ Resource monitor stopped${NC}"
    fi
}

restart_services() {
    stop_services
    sleep 2
    start_api
    start_monitor
}

status_services() {
    echo -e "${BLUE}Service Status:${NC}"

    if [ -f "$LOG_DIR/api.pid" ]; then
        PID=$(cat $LOG_DIR/api.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API server running (PID: $PID)${NC}"
        else
            echo -e "${YELLOW}✗ API server not running (stale PID file)${NC}"
            rm -f $LOG_DIR/api.pid
        fi
    else
        echo -e "${YELLOW}✗ API server not running${NC}"
    fi

    if [ -f "$LOG_DIR/monitor.pid" ]; then
        PID=$(cat $LOG_DIR/monitor.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Resource monitor running (PID: $PID)${NC}"
        else
            echo -e "${YELLOW}✗ Resource monitor not running (stale PID file)${NC}"
            rm -f $LOG_DIR/monitor.pid
        fi
    else
        echo -e "${YELLOW}✗ Resource monitor not running${NC}"
    fi

    # Show Claude instances
    echo -e "\n${BLUE}Claude Instances:${NC}"
    tmux list-sessions 2>/dev/null | grep "^mobile-vscode-" || echo -e "${YELLOW}No instances running${NC}"
}

case "${1:-start}" in
    start)
        start_api
        start_monitor
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        status_services
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
