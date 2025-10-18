#!/bin/bash

# CE-Hub Authentication Edge Function Local Testing Script
# This script tests the auth edge function locally using Vercel dev

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_status "Starting CE-Hub Auth Edge Function local testing..."
print_status "Project directory: $PROJECT_DIR"

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    print_error "package.json not found in $PROJECT_DIR"
    print_error "Please run this script from the auth-edge function directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed"
    print_status "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check environment
print_status "Checking environment configuration..."

if [ ! -f "$PROJECT_DIR/.env" ] && [ ! -f "$PROJECT_DIR/.env.local" ]; then
    print_warning "No .env file found"
    print_status "Creating .env from .env.example..."
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        print_warning "Please update .env with your actual values before testing"
    fi
fi

# Install dependencies
cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the project
print_status "Building the project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Build completed successfully"

# Start local development server
print_status "Starting local development server..."
print_status "The server will be available at http://localhost:3000"
print_status "Available endpoints:"
echo "  - GET  http://localhost:3000/health"
echo "  - GET  http://localhost:3000/verify"
echo "  - POST http://localhost:3000/verify"
echo "  - POST http://localhost:3000/refresh"
print_status ""
print_status "Press Ctrl+C to stop the server"
print_status ""

# Start Vercel dev server
vercel dev --port 3000