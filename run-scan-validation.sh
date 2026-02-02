#!/bin/bash

# Scan Page Validation Test Runner
# This script sets up and runs the Playwright validation test for the scan page

echo "🎯 CE-Hub Scan Page Historical Data Validation"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if server is running on port 5665
echo ""
echo "🌐 Checking if server is running on http://localhost:5665..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5665 | grep -q "200\|404"; then
    echo "✅ Server is responding on port 5665"
else
    echo "❌ Server is not responding on port 5665"
    echo "Please make sure your server is running before running this test."
    echo ""
    echo "To start the server, navigate to your project directory and run:"
    echo "  cd projects/edge-dev-main"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Install dependencies if needed
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/playwright" ]; then
    echo "📥 Installing Playwright..."

    # Use the dedicated package.json for this test
    if [ -f "package-scan-test.json" ]; then
        cp package-scan-test.json package-test-temp.json
        npm install --prefix . --package-lock=false < package-test-temp.json
        rm package-test-temp.json
    else
        npm install playwright
    fi

    if [ $? -eq 0 ]; then
        echo "✅ Playwright installed successfully"
    else
        echo "❌ Failed to install Playwright"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Install Playwright browsers if needed
echo ""
echo "🌍 Checking Playwright browsers..."
if ! npx playwright --version &> /dev/null; then
    echo "📥 Installing Playwright browsers..."
    npx playwright install
    if [ $? -eq 0 ]; then
        echo "✅ Playwright browsers installed"
    else
        echo "❌ Failed to install Playwright browsers"
        exit 1
    fi
else
    echo "✅ Playwright browsers available"
fi

# Run the validation test
echo ""
echo "🚀 Running scan page validation test..."
echo "This will test that historical data (SPY, QQQ, NVDA from 2025) is displayed correctly."
echo ""

node validate-scan-page-historical-data.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 TEST PASSED - Historical data is displaying correctly!"
    echo "📸 Screenshots have been saved in the test-screenshots directory"
else
    echo ""
    echo "❌ TEST FAILED - Issues detected with historical data display"
    echo "📸 Screenshots and logs have been saved for debugging"
    echo ""
    echo "Please check the test-screenshots directory for visual evidence"
    echo "and review the detailed results in the JSON output file."
fi

echo ""
echo "🏁 Validation test completed"