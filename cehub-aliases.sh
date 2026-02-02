#!/bin/bash
# CE-Hub Quick Access Aliases
# Source this file in your ~/.zshrc or ~/.bashrc

# CE-Hub base directory
export CEHUB_PATH="/Users/michaeldurante/ai dev/ce-hub"

# Add CE-Hub to PATH if not already there
if [[ ":$PATH:" != *":$CEHUB_PATH:"* ]]; then
    export PATH="$CEHUB_PATH:$PATH"
fi

# Navigation
alias ce-hub="cd \"$CEHUB_PATH\""
alias ce-projects="cd \"$CEHUB_PATH/projects\""
alias ce-edge="cd \"$CEHUB_PATH/projects/edge-dev-main\""
alias ce-traderra="cd \"$CEHUB_PATH/projects/traderra\""

# Plan & Status (QUICK REFERENCE!)
alias plan="$CEHUB_PATH/plan"
alias status="$CEHUB_PATH/status"
alias ce-status="$CEHUB_PATH/status"
alias ce-progress="cat \"$CEHUB_PATH/MASTER_PLAN.md\" | grep -A 20 '## 📍 Where We Are Right Now'"

# Claude CLI
alias claude="$CEHUB_PATH/claude"

# Session templates
alias session-init="cat \"$CEHUB_PATH/.claude/instructions/SESSION_INIT.md\""
alias session-handoff="cat \"$CEHUB_PATH/.claude/instructions/SESSION_HANDOFF.md\""

# Verification
alias verify="$CEHUB_PATH/VERIFY_SETUP.sh"
alias ce-verify="$CEHUB_PATH/VERIFY_SETUP.sh"

# Guides
alias templates="cat \"$CEHUB_PATH/COPY_PASTE_TEMPLATES.md\""
alias ce-workflow="cat \"$CEHUB_PATH/DAILY_WORKFLOW_GUIDE.md\""
alias ce-cole="cat \"$CEHUB_PATH/COLES_PRACTICES_GUIDE.md\""
alias ce-quick="cat \"$CEHUB_PATH/QUICK_REFERENCE.txt\""
alias ce-integration="cat \"$CEHUB_PATH/COMPLETE_INTEGRATION_GUIDE.md\""

# List
alias ce-templates="ls -la \"$CEHUB_PATH/_NEW_WORKFLOWS_/prompts/phases/\""
alias ce-list="ls -la \"$CEHUB_PATH/projects/\""

echo "✅ CE-Hub loaded!"
echo ""
echo "Quick commands:"
echo "  plan                 → Show master plan"
echo "  status               → Quick status check"
echo "  verify               → Verify setup is running"
echo "  templates            → Show copy-paste templates"
echo "  claude \"msg\"         → Transform message"
echo "  ce-edge              → Go to edge-dev-main"
echo ""
echo "Guides:"
echo "  ce-quick             → Quick reference card"
echo "  ce-integration       → Complete integration guide"
echo "  ce-workflow          → Daily workflow guide"
echo ""
echo "💡 Keep 'COPY_PASTE_TEMPLATES.md' open for quick reference!"
echo ""
