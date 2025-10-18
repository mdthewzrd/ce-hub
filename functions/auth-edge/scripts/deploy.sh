#!/bin/bash

# CE-Hub Authentication Edge Function Deployment Script
# This script handles the complete deployment of the auth edge function to Vercel

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

print_status "Starting CE-Hub Auth Edge Function deployment..."
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

# Check if logged into Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "Not logged into Vercel"
    print_status "Please log in to Vercel..."
    vercel login
fi

# Environment validation
print_status "Validating environment configuration..."

if [ ! -f "$PROJECT_DIR/.env" ] && [ ! -f "$PROJECT_DIR/.env.local" ]; then
    print_warning "No .env file found"
    print_status "Please ensure environment variables are set in Vercel dashboard or create .env file"
    print_status "Required variables:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - ALLOWED_ORIGINS (optional)"
    echo "  - RATE_LIMIT_MAX (optional)"
fi

# Build the project
print_status "Building the project..."
cd "$PROJECT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run TypeScript compilation
print_status "Compiling TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    print_error "TypeScript compilation failed"
    exit 1
fi

print_success "Build completed successfully"

# Deploy to Vercel
print_status "Deploying to Vercel..."

# Check if this is the first deployment
if [ ! -f ".vercel/project.json" ]; then
    print_status "First time deployment - setting up project..."
    vercel --prod
else
    print_status "Deploying to production..."
    vercel --prod
fi

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"

    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls --prod | grep auth-edge | head -1 | awk '{print $2}')
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        print_success "Your auth edge function is available at: https://$DEPLOYMENT_URL"

        # Test the deployment
        print_status "Testing deployment..."

        # Test health endpoint
        HEALTH_URL="https://$DEPLOYMENT_URL/health"
        print_status "Testing health endpoint: $HEALTH_URL"

        if curl -s -f "$HEALTH_URL" > /dev/null; then
            print_success "Health check passed!"
        else
            print_warning "Health check failed - please check the logs"
        fi
    fi

    print_success "Deployment complete!"
    print_status "Available endpoints:"
    echo "  - GET  /health  - Health check"
    echo "  - GET  /verify  - Token verification (Authorization header)"
    echo "  - POST /verify  - Token verification (JSON body)"
    echo "  - POST /refresh - Token refresh"

else
    print_error "Deployment failed"
    print_status "Check the Vercel dashboard for more details"
    exit 1
fi

print_status "Don't forget to:"
print_status "1. Set up environment variables in Vercel dashboard"
print_status "2. Configure your applications to use the new auth endpoint"
print_status "3. Update CORS settings if needed"
print_status "4. Monitor the function performance and logs"