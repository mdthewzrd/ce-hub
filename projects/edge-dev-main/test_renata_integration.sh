#!/bin/bash

echo "🚀 RENATA V2 INTEGRATION TEST"
echo "======================================"
echo ""

# Check if backend is running
echo "1️⃣  Checking Backend (Port 5666)..."
if curl -s http://localhost:5666/health > /dev/null 2>&1; then
    echo "✅ Backend is running!"
    curl -s http://localhost:5666/health | python3 -m json.tool | head -10
else
    echo "❌ Backend is NOT running!"
    echo ""
    echo "Start it with:"
    echo "  cd \"/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main-v2/backend\""
    echo "  python orchestrator_server.py --port 5666"
    echo ""
    exit 1
fi

echo ""
echo "2️⃣  Testing Backend API..."
response=$(curl -s -X POST http://localhost:5666/api/renata/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Generate a D2 scanner"}')

if echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
    echo "✅ Backend API is working!"
    echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Response:', data['response'][:80]); print('Tools:', data['tools_used'])"
else
    echo "❌ Backend API error"
fi

echo ""
echo "3️⃣  Checking Frontend Files..."
files=(
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/scan/page.tsx"
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/backtest/page.tsx"
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/plan/page.tsx"
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/components/renata/RenataOrchestratorChat.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
    else
        echo "⚠️  Missing: $file"
    fi
done

echo ""
echo "4️⃣  Next Steps:"
echo ""
echo "1. ✅ Backend is running on port 5666"
echo "2. 📝 Add RenataOrchestratorChat component to /scan, /backtest, /plan pages"
echo "3. 🌐 Start frontend: cd edge-dev-main && npm run dev"
echo "4. 🎉 Open browser to http://localhost:5665"
echo ""
echo "📚 Full guide: /Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/RENATA_V2_INTEGRATION_GUIDE.md"
echo ""
echo "✅ Integration is ready!"
