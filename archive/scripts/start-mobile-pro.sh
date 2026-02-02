#!/bin/bash
#
# Start CE-Hub Mobile Pro Interface
# Serves mobile-pro-v2.html on port 8105
#

echo "🚀 Starting CE-Hub Mobile Pro Interface"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set working directory
cd "/Users/michaeldurante/ai dev/ce-hub"

# Check if port is already in use
if lsof -i :8105 >/dev/null 2>&1; then
    echo "⚠️  Port 8105 is already in use. Checking process..."
    lsof -i :8105
    echo ""
    echo "🔄 Killing existing process..."
    pkill -f "mobile-server-pro.py.*8105"
    sleep 2
fi

# Start the server
echo "🌐 Starting mobile server on port 8105..."
python3 mobile-server-pro.py --port 8105 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Verify server is running
if lsof -i :8105 >/dev/null 2>&1; then
    echo "✅ Mobile Pro interface is now running!"
    echo ""
    echo "📱 Access URLs:"
    echo "   Local:     http://localhost:8105/mobile-pro-v2.html"
    echo "   Tailscale: http://100.95.223.19:8105/mobile-pro-v2.html"
    echo ""
    echo "🔧 Server PID: $SERVER_PID"
    echo "💾 Logs: Check terminal output or server process"
    echo ""
    echo "🛑 To stop: pkill -f 'mobile-server-pro.py.*8105'"
else
    echo "❌ Failed to start mobile server"
    exit 1
fi