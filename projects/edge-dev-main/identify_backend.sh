#!/bin/bash

# 🔍 Edge-Dev Backend Identification Script
# This script helps identify which backend server is the correct one

echo "🔍 Checking Edge-Dev Backend Servers..."
echo "====================================="

# Check if correct backend is running on port 8003
echo "📍 Testing localhost:8003/health endpoint..."

response=$(curl -s http://localhost:8003/health 2>/dev/null)

if [[ $? -eq 0 ]]; then
    service_name=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('service', 'Unknown'))" 2>/dev/null)

    if [[ "$service_name" == *"CORRECT ONE"* ]]; then
        echo "✅ CORRECT BACKEND DETECTED!"
        echo "   Service: $service_name"
        echo "   Status: Working"
        echo "   Port: 8003"
        echo ""
        echo "📋 Details:"
        echo "$response" | python3 -m json.tool
        echo ""
        echo "🎯 This is the backend you should use:"
        echo "   • File: backend/minimal_backend.py"
        echo "   • Features: DeepSeek + OpenRouter integration"
        echo "   • Status: ✅ Fully functional"
    else
        echo "❌ Wrong backend detected on port 8003"
        echo "   Service: $service_name"
        echo "   Please restart the correct backend"
    fi
else
    echo "❌ No backend running on port 8003"
    echo "   Please start the correct backend with:"
    echo "   cd '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main'"
    echo "   python backend/minimal_backend.py"
fi

echo ""
echo "====================================="
echo "✅ Backend identification complete"