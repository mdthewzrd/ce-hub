#!/bin/bash
#
# Claude CLI Fix Script
# Resolves TTY and terminal issues for Claude Code
#

echo "🔧 Claude CLI Fix Utility"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to create a TTY-compatible Claude wrapper
create_claude_wrapper() {
    local wrapper_path="/usr/local/bin/claude-tty"

    echo "📝 Creating TTY-compatible Claude wrapper..."

    sudo tee "$wrapper_path" > /dev/null << 'EOF'
#!/bin/bash
# Claude TTY Wrapper - Forces proper terminal behavior

# Set terminal environment
export TERM="${TERM:-xterm-256color}"

# Check if we need to allocate a pseudo-TTY
if [ ! -t 0 ] || [ ! -t 1 ]; then
    # Try to run with script command to allocate TTY
    if command -v script >/dev/null 2>&1; then
        # macOS/BSD script command
        script -q /dev/null claude "$@"
    else
        # Fall back to print mode
        echo "⚠️  Running in print mode (no TTY available)"
        claude --print "$@"
    fi
else
    # We have a proper TTY, run normally
    claude "$@"
fi
EOF

    sudo chmod +x "$wrapper_path"
    echo "✅ Created Claude TTY wrapper at $wrapper_path"
}

# Function to fix npm permissions if needed
fix_npm_permissions() {
    local npm_dir="$(npm config get prefix 2>/dev/null)/lib/node_modules"
    if [ -d "$npm_dir" ] && [ ! -w "$npm_dir" ]; then
        echo "🔒 Fixing npm permissions..."
        sudo chown -R "$(whoami)" "$(npm config get prefix)"/{lib/node_modules,bin,share}
        echo "✅ npm permissions fixed"
    fi
}

# Function to add aliases to shell profile
add_shell_aliases() {
    local shell_config=""

    if [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        shell_config="$HOME/.bashrc"
    fi

    if [ -n "$shell_config" ]; then
        echo "📋 Adding helpful aliases to $shell_config..."

        # Add aliases if they don't exist
        if ! grep -q "claude-print" "$shell_config" 2>/dev/null; then
            cat >> "$shell_config" << 'EOF'

# Claude CLI helpers
alias claude-print='claude --print'
alias claude-help='claude --help'
alias claude-version='claude --version'
alias claude-check='echo "Testing Claude..." | claude --print'

# Quick Claude commands
alias ask='claude --print'
alias ai='claude --print'
EOF
            echo "✅ Added Claude aliases to $shell_config"
            echo "💡 Run 'source $shell_config' to load aliases in current session"
        else
            echo "ℹ️  Aliases already exist in $shell_config"
        fi
    fi
}

# Main execution
echo "1. Checking Claude installation..."
if ! command -v claude >/dev/null 2>&1; then
    echo "❌ Claude not found in PATH"
    echo "💡 Try: npm install -g @anthropic-ai/claude-code"
    exit 1
else
    echo "✅ Claude found at: $(which claude)"
    echo "📦 Version: $(claude --version 2>/dev/null || echo 'Unknown')"
fi

echo ""
echo "2. Testing Claude functionality..."

# Test print mode
if echo "hello" | claude --print >/dev/null 2>&1; then
    echo "✅ Print mode works"
else
    echo "❌ Print mode failed"
fi

echo ""
echo "3. Setting up TTY compatibility..."
create_claude_wrapper

echo ""
echo "4. Adding shell aliases..."
add_shell_aliases

echo ""
echo "✅ Claude CLI Fix Complete!"
echo ""
echo "📋 Usage Options:"
echo "   • claude --print 'your question'     (Works in any environment)"
echo "   • claude-tty                         (TTY-compatible wrapper)"
echo "   • ask 'your question'                (Alias for claude --print)"
echo "   • ai 'your question'                 (Short alias)"
echo ""
echo "🌐 For full interactive experience:"
echo "   • Mobile VS Code: https://michaels-macbook-pro-2.tail6d4c6d.ts.net/"
echo "   • CE-Hub Mobile: /Users/michaeldurante/ai dev/ce-hub/mobile/"
echo ""
echo "🔄 Reload your shell: source ~/.zshrc (or ~/.bashrc)"