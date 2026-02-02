#!/bin/bash
#
# Start Clean Claude Chat Interface
# No dollar signs, no terminal prompts - just clean messaging
#

echo "💬 Starting Clean Claude Chat Interface"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set working directory
cd "/Users/michaeldurante/ai dev/ce-hub"

# Check if Claude API is running
if ! lsof -i :8106 >/dev/null 2>&1; then
    echo "🚀 Starting Claude API server..."
    python3 mobile-claude-api.py --port 8106 &
    sleep 3

    if lsof -i :8106 >/dev/null 2>&1; then
        echo "✅ Claude API started on port 8106"
    else
        echo "❌ Failed to start Claude API"
        exit 1
    fi
else
    echo "✅ Claude API already running on port 8106"
fi

# Check if mobile server is running
if ! lsof -i :8105 >/dev/null 2>&1; then
    echo "🚀 Starting mobile server..."
    python3 mobile-server-pro.py --port 8105 &
    sleep 3

    if lsof -i :8105 >/dev/null 2>&1; then
        echo "✅ Mobile server started on port 8105"
    else
        echo "❌ Failed to start mobile server"
        exit 1
    fi
else
    echo "✅ Mobile server already running on port 8105"
fi

echo ""
echo "🎉 Clean Claude Chat is now ready!"
echo ""
echo "📱 Access URLs:"
echo "   Clean Chat: http://100.95.223.19:8105/mobile-clean-chat.html"
echo "   Full Interface: http://100.95.223.19:8105/mobile-pro-v2.html"
echo ""
echo "💡 Features:"
echo "   ✅ No dollar sign prompts"
echo "   ✅ Clean messaging interface"
echo "   ✅ Direct Claude communication"
echo "   ✅ Mobile-optimized design"
echo ""
echo "🛑 To stop all servers:"
echo "   pkill -f 'mobile.*8105'; pkill -f 'mobile.*8106'"