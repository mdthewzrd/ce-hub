/**
 * Mobile Pro Controller - Revolutionary Mobile Development Interface
 * Handles the three-section layout, terminal commands, and mobile testing
 */

class MobileProController {
    constructor() {
        this.terminalHistory = [];
        this.currentDirectory = '/Users/user/ce-hub';
        this.connectionStatus = 'connected';
        this.terminalOutput = null;
        this.commandInput = null;
        this.deviceFrame = null;

        this.init();
    }

    init() {
        this.terminalOutput = document.getElementById('terminal-output');
        this.commandInput = document.getElementById('command-input');
        this.deviceFrame = document.getElementById('device-frame');

        this.setupEventListeners();
        this.initializeTerminal();
        this.setupMobileTester();
        this.startConnectionMonitoring();

        console.log('✅ Mobile Pro Controller initialized');
    }

    setupEventListeners() {
        // Connection indicator
        const connectionBtn = document.getElementById('connection-indicator');
        connectionBtn?.addEventListener('click', this.toggleConnection.bind(this));

        // File explorer
        const refreshBtn = document.getElementById('refresh-files');
        refreshBtn?.addEventListener('click', this.refreshExplorer.bind(this));

        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.addEventListener('click', this.handleFileClick.bind(this));
        });

        // Quick actions
        const saveBtn = document.getElementById('save-btn');
        const formatBtn = document.getElementById('format-btn');
        const searchBtn = document.getElementById('search-btn');

        saveBtn?.addEventListener('click', this.saveFile.bind(this));
        formatBtn?.addEventListener('click', this.formatCode.bind(this));
        searchBtn?.addEventListener('click', this.openSearch.bind(this));

        // Terminal controls
        const clearTerminal = document.getElementById('clear-terminal');
        const newTerminal = document.getElementById('new-terminal');

        clearTerminal?.addEventListener('click', this.clearTerminal.bind(this));
        newTerminal?.addEventListener('click', this.newTerminal.bind(this));

        // Quick commands
        const quickCmds = document.querySelectorAll('.cmd-btn');
        quickCmds.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmd = e.currentTarget.dataset.cmd;
                this.executeQuickCommand(cmd);
            });
        });

        // Command input
        const sendBtn = document.getElementById('send-command');
        sendBtn?.addEventListener('click', this.executeCommand.bind(this));

        this.commandInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            }
        });

        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Mobile tester
        const deviceBtns = document.querySelectorAll('.device-btn');
        deviceBtns.forEach(btn => {
            btn.addEventListener('click', this.switchDevice.bind(this));
        });

        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        settingsBtn?.addEventListener('click', this.openSettings.bind(this));
    }

    // File Explorer Functions
    refreshExplorer() {
        this.addTerminalOutput('$ ls -la', 'command');

        // Simulate file refresh
        setTimeout(() => {
            this.addTerminalOutput('total 24', 'output');
            this.addTerminalOutput('drwxr-xr-x  8 user staff  256 Nov 22 16:30 .', 'output');
            this.addTerminalOutput('drwxr-xr-x  3 user staff   96 Nov 22 16:30 ..', 'output');
            this.addTerminalOutput('drwxr-xr-x  3 user staff   96 Nov 22 16:30 src', 'output');
            this.addTerminalOutput('-rw-r--r--  1 user staff 1024 Nov 22 16:30 index.js', 'output');
            this.addTerminalOutput('-rw-r--r--  1 user staff  512 Nov 22 16:30 package.json', 'output');
            this.addTerminalOutput('-rw-r--r--  1 user staff  256 Nov 22 16:30 README.md', 'output');
        }, 500);

        this.animateButton(document.getElementById('refresh-files'));
    }

    handleFileClick(e) {
        const fileName = e.currentTarget.querySelector('.file-name').textContent;
        const isFolder = e.currentTarget.classList.contains('folder');

        if (isFolder) {
            this.addTerminalOutput(`$ cd ${fileName}`, 'command');
            this.currentDirectory = `${this.currentDirectory}/${fileName}`;
            this.addTerminalOutput(`Changed directory to: ${this.currentDirectory}`, 'output');
        } else {
            this.addTerminalOutput(`$ code ${fileName}`, 'command');
            this.addTerminalOutput(`Opening ${fileName} in editor...`, 'output');

            // Send message to VS Code iframe to open file
            this.sendToVSCode({
                type: 'open-file',
                fileName: fileName
            });
        }

        this.animateFileItem(e.currentTarget);
    }

    // Quick Actions
    saveFile() {
        this.addTerminalOutput('$ Auto-save triggered', 'command');
        this.addTerminalOutput('✅ File saved successfully', 'success');
        this.sendToVSCode({ type: 'save-file' });
        this.showToast('💾 File saved', 'success');
    }

    formatCode() {
        this.addTerminalOutput('$ Format document', 'command');
        this.addTerminalOutput('✨ Code formatted', 'success');
        this.sendToVSCode({ type: 'format-document' });
        this.showToast('✨ Code formatted', 'success');
    }

    openSearch() {
        this.addTerminalOutput('$ Search in files', 'command');
        this.addTerminalOutput('🔍 Search panel opened', 'output');
        this.sendToVSCode({ type: 'open-search' });
        this.showToast('🔍 Search opened', 'info');
    }

    // Terminal Functions
    initializeTerminal() {
        this.addTerminalOutput('CE-Hub Mobile Pro Terminal v1.0', 'system');
        this.addTerminalOutput(`Current directory: ${this.currentDirectory}`, 'system');
        this.addTerminalOutput('Type commands or use quick buttons below', 'system');
    }

    clearTerminal() {
        if (this.terminalOutput) {
            this.terminalOutput.innerHTML = `
                <div class="terminal-line">
                    <span class="prompt">$</span>
                    <span class="command">Terminal cleared</span>
                </div>
                <div class="terminal-line active">
                    <span class="prompt">$</span>
                    <span class="cursor">█</span>
                </div>
            `;
        }
        this.showToast('🗑 Terminal cleared', 'info');
    }

    newTerminal() {
        this.addTerminalOutput('$ New terminal session started', 'system');
        this.showToast('➕ New terminal', 'success');
    }

    executeQuickCommand(cmd) {
        if (!cmd.trim()) return;

        this.commandInput.value = cmd;
        this.executeCommand();
    }

    executeCommand() {
        const command = this.commandInput?.value.trim();
        if (!command) return;

        // Add to history
        this.terminalHistory.unshift(command);
        if (this.terminalHistory.length > 50) {
            this.terminalHistory.pop();
        }

        // Show command in terminal
        this.addTerminalOutput(`$ ${command}`, 'command');

        // Process command
        this.processCommand(command);

        // Clear input
        this.commandInput.value = '';
        this.historyIndex = -1;
    }

    processCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
            case 'ls':
            case 'll':
                this.simulateLs(args);
                break;
            case 'cd':
                this.simulateCd(args[0]);
                break;
            case 'pwd':
                this.addTerminalOutput(this.currentDirectory, 'output');
                break;
            case 'git':
                this.simulateGit(args);
                break;
            case 'npm':
            case 'yarn':
                this.simulatePackageManager(cmd, args);
                break;
            case 'clear':
                setTimeout(() => this.clearTerminal(), 100);
                break;
            case 'code':
                this.addTerminalOutput(`Opening ${args[0] || '.'} in VS Code...`, 'output');
                if (args[0]) {
                    this.sendToVSCode({ type: 'open-file', fileName: args[0] });
                }
                break;
            case 'touch':
                this.addTerminalOutput(`Created file: ${args[0]}`, 'success');
                break;
            case 'mkdir':
                this.addTerminalOutput(`Created directory: ${args[0]}`, 'success');
                break;
            case 'echo':
                this.addTerminalOutput(args.join(' '), 'output');
                break;
            case 'help':
                this.showHelp();
                break;
            default:
                this.addTerminalOutput(`Command not found: ${cmd}`, 'error');
                this.addTerminalOutput('Try: ls, cd, git, npm, code, help', 'output');
        }
    }

    simulateLs(args) {
        const files = [
            'src/',
            'node_modules/',
            'package.json',
            'index.js',
            'README.md',
            '.git/',
            '.gitignore'
        ];

        if (args.includes('-la') || args.includes('-al')) {
            this.addTerminalOutput('total 24', 'output');
            files.forEach(file => {
                const isDir = file.endsWith('/');
                const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                const size = isDir ? '256' : Math.floor(Math.random() * 1000 + 100);
                this.addTerminalOutput(
                    `${perms}  1 user staff ${size} Nov 22 16:30 ${file}`,
                    'output'
                );
            });
        } else {
            files.forEach(file => {
                this.addTerminalOutput(file, 'output');
            });
        }
    }

    simulateCd(dir) {
        if (!dir || dir === '~') {
            this.currentDirectory = '/Users/user';
        } else if (dir === '..') {
            const parts = this.currentDirectory.split('/');
            parts.pop();
            this.currentDirectory = parts.join('/') || '/';
        } else if (dir.startsWith('/')) {
            this.currentDirectory = dir;
        } else {
            this.currentDirectory = `${this.currentDirectory}/${dir}`;
        }
        this.addTerminalOutput(`Changed to: ${this.currentDirectory}`, 'output');
    }

    simulateGit(args) {
        const subcommand = args[0];
        switch (subcommand) {
            case 'status':
                this.addTerminalOutput('On branch main', 'output');
                this.addTerminalOutput('Your branch is up to date with \'origin/main\'.', 'output');
                this.addTerminalOutput('nothing to commit, working tree clean', 'success');
                break;
            case 'add':
                this.addTerminalOutput(`Added: ${args[1] || '.'} to staging`, 'success');
                break;
            case 'commit':
                this.addTerminalOutput('Commit created successfully', 'success');
                break;
            case 'push':
                this.addTerminalOutput('Pushing to origin...', 'output');
                setTimeout(() => {
                    this.addTerminalOutput('✅ Pushed to remote successfully', 'success');
                }, 1000);
                break;
            case 'pull':
                this.addTerminalOutput('Pulling from origin...', 'output');
                setTimeout(() => {
                    this.addTerminalOutput('Already up to date.', 'success');
                }, 1000);
                break;
            default:
                this.addTerminalOutput(`git ${subcommand}: Unknown git command`, 'error');
        }
    }

    simulatePackageManager(cmd, args) {
        const subcommand = args[0];
        switch (subcommand) {
            case 'install':
            case 'i':
                this.addTerminalOutput('Installing dependencies...', 'output');
                setTimeout(() => {
                    this.addTerminalOutput('✅ Dependencies installed successfully', 'success');
                }, 1500);
                break;
            case 'run':
                const script = args[1] || 'start';
                this.addTerminalOutput(`Running script: ${script}`, 'output');
                this.addTerminalOutput(`> ${cmd} run ${script}`, 'output');
                this.addTerminalOutput('🚀 Server started on port 3000', 'success');
                break;
            case 'start':
                this.addTerminalOutput('Starting development server...', 'output');
                this.addTerminalOutput('🚀 Server running on http://localhost:3000', 'success');
                break;
            case 'test':
                this.addTerminalOutput('Running tests...', 'output');
                setTimeout(() => {
                    this.addTerminalOutput('✅ All tests passed', 'success');
                }, 1000);
                break;
            default:
                this.addTerminalOutput(`${cmd} ${subcommand}: Unknown command`, 'error');
        }
    }

    showHelp() {
        const helpText = [
            'CE-Hub Mobile Pro Terminal Commands:',
            '',
            'File Operations:',
            '  ls, ll         - List files and directories',
            '  cd <dir>       - Change directory',
            '  pwd            - Print working directory',
            '  touch <file>   - Create new file',
            '  mkdir <dir>    - Create directory',
            '',
            'Development:',
            '  code <file>    - Open file in editor',
            '  git <cmd>      - Git commands (status, add, commit, push, pull)',
            '  npm/yarn <cmd> - Package manager (install, run, start, test)',
            '',
            'Terminal:',
            '  clear          - Clear terminal',
            '  echo <text>    - Display text',
            '  help           - Show this help'
        ];

        helpText.forEach(line => {
            this.addTerminalOutput(line, 'output');
        });
    }

    addTerminalOutput(text, type = 'output') {
        if (!this.terminalOutput) return;

        const line = document.createElement('div');
        line.className = 'terminal-line';

        switch (type) {
            case 'command':
                line.innerHTML = `
                    <span class="prompt">$</span>
                    <span class="command">${text.replace(/^\$ /, '')}</span>
                `;
                break;
            case 'output':
                line.innerHTML = `<span class="output">${text}</span>`;
                break;
            case 'success':
                line.innerHTML = `<span class="output" style="color: var(--accent-bg);">${text}</span>`;
                break;
            case 'error':
                line.innerHTML = `<span class="output" style="color: #ff4444;">${text}</span>`;
                break;
            case 'system':
                line.innerHTML = `<span class="output" style="color: var(--text-muted);">${text}</span>`;
                break;
        }

        // Remove active cursor from previous line
        const activeLines = this.terminalOutput.querySelectorAll('.terminal-line.active');
        activeLines.forEach(activeLine => {
            activeLine.classList.remove('active');
            const cursor = activeLine.querySelector('.cursor');
            if (cursor) cursor.remove();
        });

        this.terminalOutput.appendChild(line);

        // Add new active line with cursor
        const activeLine = document.createElement('div');
        activeLine.className = 'terminal-line active';
        activeLine.innerHTML = `
            <span class="prompt">$</span>
            <span class="cursor">█</span>
        `;
        this.terminalOutput.appendChild(activeLine);

        // Scroll to bottom
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;

        // Limit terminal history
        const lines = this.terminalOutput.querySelectorAll('.terminal-line');
        if (lines.length > 100) {
            lines[0].remove();
        }
    }

    navigateHistory(direction) {
        if (this.terminalHistory.length === 0) return;

        if (direction === 'up') {
            this.historyIndex = Math.min(this.historyIndex + 1, this.terminalHistory.length - 1);
        } else {
            this.historyIndex = Math.max(this.historyIndex - 1, -1);
        }

        if (this.historyIndex >= 0) {
            this.commandInput.value = this.terminalHistory[this.historyIndex];
        } else {
            this.commandInput.value = '';
        }
    }

    // Navigation Functions
    handleNavigation(e) {
        const view = e.currentTarget.dataset.view;

        // Update active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        // Handle view switch
        this.addTerminalOutput(`$ Switched to ${view} view`, 'system');
        this.showToast(`📱 ${view.toUpperCase()} mode`, 'info');
    }

    // Mobile Testing Functions
    setupMobileTester() {
        // Initialize device frame
        if (this.deviceFrame) {
            this.deviceFrame.dataset.device = 'iphone-14';
        }
    }

    switchDevice(e) {
        const device = e.currentTarget.dataset.device;

        // Update active button
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        // Update device frame
        if (this.deviceFrame) {
            this.deviceFrame.dataset.device = device;
        }

        this.showToast(`📱 ${device.replace('-', ' ').toUpperCase()}`, 'info');
    }

    // VS Code Integration
    sendToVSCode(message) {
        const iframe = document.getElementById('vscode-frame-pro');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage(message, '*');
            } catch (error) {
                console.warn('Could not send message to VS Code:', error);
            }
        }
    }

    // Connection Management
    toggleConnection() {
        this.connectionStatus = this.connectionStatus === 'connected' ? 'disconnected' : 'connected';
        this.updateConnectionStatus();

        if (this.connectionStatus === 'connected') {
            this.addTerminalOutput('✅ Reconnected to VS Code server', 'success');
            this.showToast('🔗 Connected', 'success');
        } else {
            this.addTerminalOutput('❌ Disconnected from VS Code server', 'error');
            this.showToast('📡 Disconnected', 'error');
        }
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            indicator.className = `connection-indicator ${this.connectionStatus}`;
        }
    }

    startConnectionMonitoring() {
        setInterval(() => {
            // Simulate connection check
            if (Math.random() > 0.95) {
                this.connectionStatus = 'disconnected';
                this.updateConnectionStatus();
                setTimeout(() => {
                    this.connectionStatus = 'connected';
                    this.updateConnectionStatus();
                }, 2000);
            }
        }, 10000);
    }

    // Settings
    openSettings() {
        this.addTerminalOutput('$ Opening settings...', 'command');
        this.addTerminalOutput('⚙️ Settings panel opened', 'output');
        this.showToast('⚙️ Settings', 'info');
    }

    // Utility Functions
    animateButton(button) {
        if (!button) return;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    animateFileItem(item) {
        if (!item) return;
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
            item.style.transform = '';
        }, 150);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--secondary-bg);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: var(--border-radius);
            border: 1px solid var(--border-color);
            z-index: 9999;
            font-size: 14px;
            font-weight: 600;
            box-shadow: var(--shadow-dark);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            toast.style.borderColor = 'var(--accent-bg)';
            toast.style.boxShadow = 'var(--shadow-glow)';
        } else if (type === 'error') {
            toast.style.borderColor = '#ff4444';
            toast.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.3)';
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileProController = new MobileProController();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileProController;
}