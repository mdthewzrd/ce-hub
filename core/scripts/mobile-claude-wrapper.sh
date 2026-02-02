#!/bin/bash
#
# Mobile Claude Wrapper
# Fixes dollar sign and terminal issues for mobile interface
#

# Function to clean and escape input
clean_input() {
    local input="$1"
    # Remove leading/trailing whitespace
    input=$(echo "$input" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    # Handle dollar signs properly
    input=$(echo "$input" | sed 's/\$/\\$/g')
    echo "$input"
}

# Main execution
if [ $# -eq 0 ]; then
    echo "📱 Mobile Claude Wrapper"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "This wrapper fixes terminal issues for Claude on mobile."
    echo ""
    echo "Usage:"
    echo "  $0 \"your question here\""
    echo ""
    echo "Examples:"
    echo "  $0 \"What files are in this directory?\""
    echo "  $0 \"How do I use git?\""
    echo "  $0 \"Explain this error message\""
    echo ""
    echo "💡 This wrapper handles:"
    echo "  • Dollar sign escaping"
    echo "  • Terminal prompt issues"
    echo "  • Mobile input formatting"
    exit 0
fi

# Combine all arguments and clean them
question="$*"
cleaned_question=$(clean_input "$question")

echo "🤖 Mobile Claude Query"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Query: $cleaned_question"
echo ""

# Use Claude in print mode with proper escaping
if [ -n "$cleaned_question" ]; then
    claude --print "$cleaned_question"
else
    echo "❌ No valid input provided after cleaning"
    exit 1
fi