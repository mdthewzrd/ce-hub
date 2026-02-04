#!/bin/bash

# EdgeDev AI Agent - Deployment Script
# This script builds and prepares the application for production

set -e

echo "=== EdgeDev AI Agent - Production Build ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production not found${NC}"
    echo "Creating from .env.production.example..."
    cp .env.production.example .env.production
    echo -e "${YELLOW}Please edit .env.production with your values${NC}"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Run type checking
echo "Running type check..."
npm run type-check

# Run linter
echo "Running linter..."
npm run lint

# Build application
echo "Building application..."
npm run build

# Check if build was successful
if [ -d ".next" ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    echo "Build output: .next/"
    echo ""
    echo "To start production server:"
    echo "  npm run start"
    echo ""
    echo "Or deploy to Vercel:"
    echo "  vercel deploy --prod"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo "=== Build Complete ==="
