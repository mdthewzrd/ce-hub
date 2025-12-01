#!/bin/bash
#
# Claude Terminal Launcher
# Fixes TTY issues for Claude CLI interactive mode
#

echo "🚀 Claude Terminal Launcher"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in a proper terminal
if [ -t 0 ] && [ -t 1 ]; then
    echo "✅ Proper TTY detected"
    echo "🎯 Launching Claude in interactive mode..."
    echo ""
    exec claude "$@"
else
    echo "⚠️  No TTY detected - Claude interactive mode requires a proper terminal"
    echo ""
    echo "📋 Available options:"
    echo "   1. Use 'claude --print' for non-interactive mode"
    echo "   2. Run this script from a proper terminal (iTerm, Terminal.app, etc.)"
    echo "   3. Use the mobile VS Code interface"
    echo ""

    # If arguments provided, try print mode
    if [ $# -gt 0 ]; then
        echo "🔄 Attempting to run in print mode..."
        claude --print "$@"
    else
        echo "💡 Example usage:"
        echo "   claude-terminal-launcher.sh --help"
        echo "   claude-terminal-launcher.sh 'What files are in the current directory?'"
        echo ""
        echo "🌐 For full interactive experience, use your mobile VS Code:"
        echo "   https://michaels-macbook-pro-2.tail6d4c6d.ts.net/"
    fi
fi