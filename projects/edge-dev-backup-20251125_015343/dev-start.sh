#!/bin/bash

# CE-Hub Edge-Dev Development Environment Starter
# Comprehensive orchestration for frontend + backend

echo "🚀 CE-Hub Edge-Dev Environment Starting..."
echo "======================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js.${NC}"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python3 not found. Please install Python 3.${NC}"
    exit 1
fi

# Check for existing processes on ports
if port_in_use 5657; then
    echo -e "${YELLOW}⚠️  Port 5657 is already in use. Stopping existing process...${NC}"
    pkill -f "next dev -p 5657" || true
    sleep 2
fi

if port_in_use 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use. Stopping existing process...${NC}"
    pkill -f "uvicorn.*8000" || true
    sleep 2
fi

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Frontend dependencies installation failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📝 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements (try minimal first for faster setup)
if [ -f "requirements-minimal.txt" ]; then
    echo -e "${BLUE}📦 Installing minimal backend dependencies...${NC}"
    pip install -r requirements-minimal.txt
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Minimal install failed, trying full requirements...${NC}"
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ Backend dependencies installation failed${NC}"
                exit 1
            fi
        fi
    fi
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Backend dependencies installation failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  No requirements.txt found in backend directory${NC}"
fi

# Return to root directory
cd ..

# Check if concurrently is available
if ! command_exists npx; then
    echo -e "${RED}❌ npx not found. Cannot run concurrent processes.${NC}"
    exit 1
fi

# Create health check script if it doesn't exist
if [ ! -f "scripts/health-check.js" ]; then
    mkdir -p scripts
    cat > scripts/health-check.js << 'EOF'
const http = require('http');

async function checkService(name, url, timeout = 10000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve({ name, status: 'timeout', url });
        }, timeout);

        const req = http.get(url, (res) => {
            clearTimeout(timer);
            resolve({
                name,
                status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
                code: res.statusCode,
                url
            });
        });

        req.on('error', () => {
            clearTimeout(timer);
            resolve({ name, status: 'unreachable', url });
        });
    });
}

async function healthCheck() {
    console.log('🏥 Running health check...');

    const checks = [
        { name: 'Frontend', url: 'http://localhost:5657' },
        { name: 'Backend', url: 'http://localhost:8000/docs' }
    ];

    for (const check of checks) {
        const result = await checkService(check.name, check.url);
        const status = result.status === 'healthy' ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.status} (${result.url})`);
    }
}

// Run health check in 10 seconds to allow services to start
setTimeout(healthCheck, 10000);
EOF
    echo -e "${GREEN}✅ Health check script created${NC}"
fi

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up processes...${NC}"
    pkill -f "next dev -p 5657" 2>/dev/null || true
    pkill -f "uvicorn.*8000" 2>/dev/null || true
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}🎯 Starting services...${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:5657"
echo -e "${BLUE}Backend:${NC}  http://localhost:8000"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "======================================"

# Start services using concurrently
npx concurrently \
    --names "FRONTEND,BACKEND,HEALTH" \
    --prefix-colors "blue,green,yellow" \
    "npm run dev" \
    "cd backend && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000" \
    "node scripts/health-check.js"

# This should not be reached due to concurrently, but just in case
cleanup