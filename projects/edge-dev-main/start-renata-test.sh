#!/bin/bash

# CE-Hub Backend Startup for RENATA Testing
# This script starts the backend service needed to test RENATA integration

echo "🚀 Starting CE-Hub Backend for RENATA Testing..."
echo "=============================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi

cd backend

# Load environment variables from .env.local if it exists
if [ -f ../.env.local ]; then
    echo -e "${BLUE}📋 Loading environment variables from .env.local...${NC}"
    export $(cat ../.env.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📝 Creating virtual environment...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Activate virtual environment
echo -e "${BLUE}🔧 Activating virtual environment...${NC}"
source venv/bin/activate

# Install requirements
echo -e "${BLUE}📦 Installing/upgrading dependencies...${NC}"
pip install -q --upgrade pip
pip install -q fastapi uvicorn pandas python-multipart requests python-dotenv pydantic

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check if port 5666 is already in use
if lsof -Pi :5666 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5666 is already in use. Stopping existing process...${NC}"
    pkill -f "uvicorn.*5666" || true
    sleep 2
fi

# Start the backend
echo -e "\n${GREEN}🚀 Starting backend server on port 5666...${NC}"
echo -e "${BLUE}Backend API:${NC}  http://localhost:5666"
echo -e "${BLUE}API Docs:${NC}    http://localhost:5666/docs"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo "=============================================="

# Check if main.py exists
if [ -f "main.py" ]; then
    uvicorn main:app --reload --host 0.0.0.0 --port 5666
elif [ -f "app.py" ]; then
    uvicorn app:app --reload --host 0.0.0.0 --port 5666
else
    echo -e "${RED}❌ Could not find main.py or app.py in backend directory${NC}"
    exit 1
fi
