/**
 * VS Code Integration Bridge for CE-Hub Mobile Shell
 * Handles communication and interaction with VS Code iframe
 */

class VSCodeBridge {
    constructor() {
        this.iframe = null;
        this.isReady = false;
        this.messageQueue = [];
        this.eventHandlers = new Map();
        this.retryCount = 0;
        this.maxRetries = 5;

        // Communication timeouts
        this.RESPONSE_TIMEOUT = 5000;
        this.PING_INTERVAL = 10000;

        this.init();
    }

    init() {
        this.iframe = document.getElementById('vscode-frame');
        if (!this.iframe) {
            console.error('VS Code iframe not found');
            return;
        }

        this.setupEventListeners();
        this.startHealthCheck();
        console.log('✅ VS Code bridge initialized');
    }

    setupEventListeners() {
        // Listen for iframe load
        this.iframe.addEventListener('load', this.handleIframeLoad.bind(this));
        this.iframe.addEventListener('error', this.handleIframeError.bind(this));

        // Listen for messages from VS Code
        window.addEventListener('message', this.handleMessage.bind(this));

        // Handle iframe navigation changes
        this.iframe.addEventListener('locationchange', this.handleLocationChange.bind(this));

        // Monitor iframe accessibility
        setInterval(this.checkIframeHealth.bind(this), this.PING_INTERVAL);
    }

    handleIframeLoad() {
        console.log('VS Code iframe loaded');
        this.retryCount = 0;
        this.startInitializationSequence();
    }

    handleIframeError(error) {
        console.error('VS Code iframe error:', error);
        this.isReady = false;
        this.handleConnectionFailure();
    }

    async startInitializationSequence() {
        try {
            // Wait for VS Code to fully initialize
            await this.waitForVSCodeReady();

            // Setup mobile optimizations
            await this.setupMobileOptimizations();

            // Register event handlers
            this.registerEventHandlers();

            // Process queued messages
            this.processMessageQueue();

            this.isReady = true;
            this.emitEvent('bridge-ready');
            console.log('✅ VS Code bridge ready');

        } catch (error) {
            console.error('Failed to initialize VS Code bridge:', error);
            this.handleConnectionFailure();
        }
    }

    async waitForVSCodeReady() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;

            const checkReady = () => {
                attempts++;

                try {
                    // Check if VS Code's Monaco editor is available
                    this.sendMessage({ type: 'ping' }, (response) => {
                        if (response && response.type === 'pong') {
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            reject(new Error('VS Code initialization timeout'));
                        } else {
                            setTimeout(checkReady, 1000);
                        }
                    });
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        reject(error);
                    } else {
                        setTimeout(checkReady, 1000);
                    }
                }
            };

            checkReady();
        });
    }

    async setupMobileOptimizations() {
        const optimizations = {
            type: 'configure-mobile',
            config: {
                // Force mobile-friendly settings
                enableTouchMode: true,
                hideMinimap: true,
                enableWordWrap: true,
                increaseFontSize: true,
                bottomPanelLayout: true,
                hideActivityBar: true,

                // Editor configurations
                editor: {
                    fontSize: 16,
                    lineHeight: 26,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    renderWhitespace: 'none'
                },

                // Workbench configurations
                workbench: {
                    activityBar: { visible: false },
                    sideBar: { location: 'bottom' },
                    panel: { defaultLocation: 'bottom' },
                    colorTheme: 'Default Dark+'
                }
            }
        };

        await this.sendMessage(optimizations);
    }

    registerEventHandlers() {
        // File operations
        this.registerHandler('open-file', this.handleOpenFile.bind(this));
        this.registerHandler('save-file', this.handleSaveFile.bind(this));
        this.registerHandler('close-file', this.handleCloseFile.bind(this));

        // Editor operations
        this.registerHandler('goto-line', this.handleGotoLine.bind(this));
        this.registerHandler('find-replace', this.handleFindReplace.bind(this));
        this.registerHandler('format-document', this.handleFormatDocument.bind(this));

        // Terminal operations
        this.registerHandler('open-terminal', this.handleOpenTerminal.bind(this));
        this.registerHandler('run-command', this.handleRunCommand.bind(this));

        // Layout operations
        this.registerHandler('toggle-panel', this.handleTogglePanel.bind(this));
        this.registerHandler('focus-editor', this.handleFocusEditor.bind(this));
    }

    // Message handling
    handleMessage(event) {
        // Only accept messages from VS Code iframe
        if (event.source !== this.iframe.contentWindow) return;

        try {
            const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            this.processMessage(message);
        } catch (error) {
            console.warn('Invalid message from VS Code:', error);
        }
    }

    processMessage(message) {
        const { type, id, data, error } = message;

        switch (type) {
            case 'pong':
                this.handlePong(message);
                break;
            case 'file-changed':
                this.handleFileChanged(data);
                break;
            case 'editor-selection':
                this.handleEditorSelection(data);
                break;
            case 'terminal-output':
                this.handleTerminalOutput(data);
                break;
            case 'error':
                this.handleVSCodeError(error);
                break;
            default:
                this.emitEvent('vscode-message', message);
        }

        // Handle message callbacks
        if (id && this.eventHandlers.has(id)) {
            const callback = this.eventHandlers.get(id);
            this.eventHandlers.delete(id);
            callback(message);
        }
    }

    sendMessage(message, callback = null) {
        return new Promise((resolve, reject) => {
            if (!this.isReady && message.type !== 'ping') {
                this.messageQueue.push({ message, callback, resolve, reject });
                return;
            }

            const messageId = this.generateMessageId();
            const fullMessage = {
                id: messageId,
                timestamp: Date.now(),
                ...message
            };

            try {
                this.iframe.contentWindow.postMessage(fullMessage, '*');

                if (callback || message.expectResponse !== false) {
                    // Setup response handler
                    const timeoutId = setTimeout(() => {
                        this.eventHandlers.delete(messageId);
                        reject(new Error('Message timeout'));
                    }, this.RESPONSE_TIMEOUT);

                    this.eventHandlers.set(messageId, (response) => {
                        clearTimeout(timeoutId);
                        if (callback) callback(response);
                        resolve(response);
                    });
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const { message, callback, resolve, reject } = this.messageQueue.shift();
            this.sendMessage(message, callback).then(resolve).catch(reject);
        }
    }

    // File operations
    async handleOpenFile(data) {
        const { fileName, line, column } = data;
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'vscode.open',
            args: [{
                resource: fileName,
                options: {
                    selection: line ? {
                        startLineNumber: line,
                        startColumn: column || 1
                    } : undefined
                }
            }]
        });
    }

    async handleSaveFile() {
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'workbench.action.files.save'
        });
    }

    async handleCloseFile() {
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'workbench.action.closeActiveEditor'
        });
    }

    // Editor operations
    async handleGotoLine(data) {
        const { line } = data;
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'workbench.action.gotoLine',
            args: [line]
        });
    }

    async handleFindReplace(data) {
        const { query, replace, options } = data;
        return await this.sendMessage({
            type: 'editor-find-replace',
            query,
            replace,
            options
        });
    }

    async handleFormatDocument() {
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'editor.action.formatDocument'
        });
    }

    // Terminal operations
    async handleOpenTerminal() {
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'workbench.action.terminal.new'
        });
    }

    async handleRunCommand(data) {
        const { command } = data;
        return await this.sendMessage({
            type: 'terminal-command',
            command
        });
    }

    // Layout operations
    async handleTogglePanel(data) {
        const { panel } = data;
        return await this.sendMessage({
            type: 'vscode-command',
            command: `workbench.action.toggle${panel}`
        });
    }

    async handleFocusEditor() {
        return await this.sendMessage({
            type: 'vscode-command',
            command: 'workbench.action.focusActiveEditorGroup'
        });
    }

    // Event handlers for VS Code events
    handlePong(message) {
        this.lastPong = Date.now();
    }

    handleFileChanged(data) {
        this.emitEvent('file-changed', data);

        // Update mobile UI if needed
        if (window.mobileController) {
            window.mobileController.showToast('File changed', 'info');
        }
    }

    handleEditorSelection(data) {
        this.emitEvent('editor-selection', data);
    }

    handleTerminalOutput(data) {
        this.emitEvent('terminal-output', data);

        // Update terminal panel if visible
        this.updateTerminalDisplay(data);
    }

    handleVSCodeError(error) {
        console.error('VS Code error:', error);
        this.emitEvent('vscode-error', error);

        if (window.mobileController) {
            window.mobileController.showError(`VS Code Error: ${error.message}`);
        }
    }

    // Health monitoring
    startHealthCheck() {
        setInterval(() => {
            if (this.isReady) {
                this.pingVSCode();
            }
        }, this.PING_INTERVAL);
    }

    async pingVSCode() {
        try {
            await this.sendMessage({ type: 'ping' });
        } catch (error) {
            console.warn('VS Code ping failed:', error);
            this.handleConnectionFailure();
        }
    }

    checkIframeHealth() {
        try {
            // Check if iframe is still accessible
            const contentWindow = this.iframe.contentWindow;
            if (!contentWindow || !contentWindow.document) {
                throw new Error('Iframe not accessible');
            }

            // Check if VS Code is responsive
            const lastPongAge = Date.now() - (this.lastPong || 0);
            if (lastPongAge > this.PING_INTERVAL * 3) {
                throw new Error('VS Code not responsive');
            }

        } catch (error) {
            console.warn('Iframe health check failed:', error);
            this.handleConnectionFailure();
        }
    }

    handleConnectionFailure() {
        this.isReady = false;
        this.retryCount++;

        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying connection (${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => {
                this.reconnect();
            }, 2000 * this.retryCount);
        } else {
            console.error('Max retries exceeded, connection failed');
            this.emitEvent('connection-failed');

            if (window.mobileController) {
                window.mobileController.setConnectionStatus('disconnected');
                window.mobileController.showError('VS Code connection lost');
            }
        }
    }

    reconnect() {
        try {
            // Force reload iframe
            const currentSrc = this.iframe.src;
            this.iframe.src = 'about:blank';
            setTimeout(() => {
                this.iframe.src = currentSrc;
            }, 1000);
        } catch (error) {
            console.error('Reconnection failed:', error);
        }
    }

    // Terminal display update
    updateTerminalDisplay(data) {
        const terminalContent = document.querySelector('#terminal-content .terminal-content');
        if (!terminalContent) return;

        const outputLine = document.createElement('div');
        outputLine.className = 'terminal-output';
        outputLine.textContent = data.output;

        terminalContent.appendChild(outputLine);
        terminalContent.scrollTop = terminalContent.scrollHeight;

        // Limit terminal history
        const lines = terminalContent.querySelectorAll('.terminal-output');
        if (lines.length > 100) {
            lines[0].remove();
        }
    }

    // Event system
    registerHandler(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    emitEvent(event, data = null) {
        // Emit to window for other components
        window.dispatchEvent(new CustomEvent(`vscode-${event}`, { detail: data }));

        // Also emit to mobile controller if available
        if (window.mobileController && window.mobileController.handleVSCodeEvent) {
            window.mobileController.handleVSCodeEvent(event, data);
        }
    }

    // Public API methods
    async openFile(fileName, line = null, column = null) {
        return await this.handleOpenFile({ fileName, line, column });
    }

    async saveFile() {
        return await this.handleSaveFile();
    }

    async runTerminalCommand(command) {
        return await this.handleRunCommand({ command });
    }

    async gotoLine(line) {
        return await this.handleGotoLine({ line });
    }

    async formatDocument() {
        return await this.handleFormatDocument();
    }

    // Utility methods
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    handleLocationChange() {
        console.log('VS Code navigation detected');
        this.isReady = false;
        this.startInitializationSequence();
    }

    isConnected() {
        return this.isReady;
    }

    getConnectionStatus() {
        return {
            isReady: this.isReady,
            retryCount: this.retryCount,
            lastPong: this.lastPong
        };
    }

    // Cleanup
    destroy() {
        this.isReady = false;
        this.eventHandlers.clear();
        this.messageQueue = [];

        window.removeEventListener('message', this.handleMessage);
        this.iframe?.removeEventListener('load', this.handleIframeLoad);
        this.iframe?.removeEventListener('error', this.handleIframeError);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.vscodeBridge = new VSCodeBridge();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VSCodeBridge;
}