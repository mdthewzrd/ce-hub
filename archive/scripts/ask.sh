#!/bin/bash
#
# Ask Claude - Simple wrapper for Claude CLI
# Usage: ask.sh "your question here"
#

if [ $# -eq 0 ]; then
    echo "📝 Ask Claude - Simple CLI Wrapper"
    echo ""
    echo "Usage:"
    echo "  ./ask.sh \"your question here\""
    echo ""
    echo "Examples:"
    echo "  ./ask.sh \"What files are in this directory?\""
    echo "  ./ask.sh \"How do I use git to commit changes?\""
    echo "  ./ask.sh \"Explain this error message\""
    echo ""
    echo "💡 For interactive mode, use your mobile VS Code:"
    echo "   https://michaels-macbook-pro-2.tail6d4c6d.ts.net/"
    exit 0
fi

# Combine all arguments into a single question
question="$*"

echo "🤖 Asking Claude: $question"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Use Claude in print mode
claude --print "$question"