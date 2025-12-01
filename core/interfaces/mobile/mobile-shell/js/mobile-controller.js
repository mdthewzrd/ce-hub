/**
 * Mobile Controller for CE-Hub Mobile Shell
 * Main coordination system for mobile interface components
 */

class MobileController {
    constructor() {
        this.loadingScreen = null;
        this.mobileShell = null;
        this.activePanels = new Set();
        this.currentTab = null;
        this.connectionStatus = 'disconnected';
        this.vscodeFrame = null;

        // State management
        this.state = {
            isLoading: true,
            currentView: 'editor',
            panelState: {
                files: false,
                terminal: false,
                search: false
            },
            orientation: 'portrait',
            quickActionsVisible: false
        };

        this.init();
    }

    init() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.mobileShell = document.getElementById('mobile-shell');
        this.vscodeFrame = document.getElementById('vscode-frame');

        this.setupEventListeners();
        this.initializeInterface();
        this.startConnectionMonitoring();

        console.log('✅ Mobile controller initialized');
    }

    setupEventListeners() {
        // Header button events
        const menuBtn = document.getElementById('menu-btn');
        const saveBtn = document.getElementById('save-btn');
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        menuBtn?.addEventListener('click', this.toggleMainMenu.bind(this));
        saveBtn?.addEventListener('click', this.triggerSave.bind(this));
        fullscreenBtn?.addEventListener('click', this.toggleFullscreen.bind(this));

        // Navigation events
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Panel close events
        const panelCloses = document.querySelectorAll('.panel-close');
        panelCloses.forEach(close => {
            close.addEventListener('click', this.handlePanelClose.bind(this));
        });

        // VS Code iframe events
        this.vscodeFrame?.addEventListener('load', this.handleVSCodeLoad.bind(this));

        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Visibility change for PWA
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    initializeInterface() {
        // Set initial theme
        this.applyTheme();

        // Initialize loading state
        this.showLoading('Initializing mobile interface...');

        // Setup initial layout
        this.updateLayout();

        // Initialize panels
        this.initializePanels();

        // Set default navigation state
        this.setActiveNavItem('editor');

        // Start VS Code loading process
        this.loadVSCode();
    }

    async loadVSCode() {
        this.updateLoadingMessage('Connecting to VS Code...');

        try {
            // Simulate initialization process
            await this.waitForVSCodeLoad();

            this.updateLoadingMessage('Optimizing for mobile...');
            await this.optimizeVSCodeForMobile();

            this.updateLoadingMessage('Ready!');
            await this.delay(500);

            this.hideLoading();
            this.setConnectionStatus('connected');
        } catch (error) {
            console.error('Failed to load VS Code:', error);
            this.showError('Failed to connect to VS Code');
            this.setConnectionStatus('disconnected');
        }
    }

    waitForVSCodeLoad() {
        return new Promise((resolve, reject) => {
            if (this.vscodeFrame.contentDocument || this.vscodeFrame.contentWindow) {
                this.vscodeFrame.onload = () => resolve();
                this.vscodeFrame.onerror = () => reject(new Error('VS Code failed to load'));
            } else {
                // Timeout after 15 seconds
                setTimeout(() => reject(new Error('VS Code load timeout')), 15000);
            }
        });
    }

    async optimizeVSCodeForMobile() {
        // Wait a bit for VS Code to fully initialize
        await this.delay(2000);

        // Try to apply mobile optimizations to iframe content
        try {
            if (this.vscodeFrame.contentWindow) {
                this.vscodeFrame.contentWindow.postMessage({
                    type: 'mobile-optimization',
                    config: {
                        enableMobileLayout: true,
                        hideMinimap: true,
                        enableTouchMode: true
                    }
                }, '*');
            }
        } catch (error) {
            console.warn('Could not apply VS Code optimizations:', error);
        }
    }

    // Loading and UI State Management
    showLoading(message = 'Loading...') {
        this.state.isLoading = true;
        if (this.loadingScreen) {
            this.updateLoadingMessage(message);
            this.loadingScreen.classList.remove('hidden');
        }
    }

    hideLoading() {
        this.state.isLoading = false;
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    updateLoadingMessage(message) {
        const loadingText = this.loadingScreen?.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    // Navigation Management
    handleNavigation(e) {
        const action = e.currentTarget.dataset.action;
        this.navigateTo(action);
    }

    navigateTo(section) {
        this.setActiveNavItem(section);

        switch (section) {
            case 'editor':
                this.hideAllPanels();
                this.focusEditor();
                break;
            case 'files':
                this.showPanel('file-panel');
                break;
            case 'terminal':
                this.showPanel('terminal-panel');
                break;
            case 'search':
                this.showPanel('search-panel');
                break;
            case 'settings':
                this.showSettingsMenu();
                break;
        }

        this.state.currentView = section;
        this.updateLayout();
    }

    setActiveNavItem(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`[data-action="${section}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // Panel Management
    showPanel(panelId) {
        this.hideAllPanels();

        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            this.activePanels.add(panelId);

            // Initialize panel content if needed
            this.initializePanelContent(panelId);
        }
    }

    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('active');
            this.activePanels.delete(panelId);
        }
    }

    hideAllPanels() {
        this.activePanels.forEach(panelId => {
            this.hidePanel(panelId);
        });
        this.activePanels.clear();
    }

    handlePanelClose(e) {
        const panelId = e.currentTarget.dataset.panel;
        this.hidePanel(panelId);

        // Return to editor view
        this.navigateTo('editor');
    }

    initializePanelContent(panelId) {
        switch (panelId) {
            case 'file-panel':
                this.loadFileTree();
                break;
            case 'terminal-panel':
                this.initializeTerminal();
                break;
            case 'search-panel':
                this.initializeSearch();
                break;
        }
    }

    initializePanels() {
        // File panel initialization
        this.loadFileTree();

        // Search panel initialization
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');

        searchBtn?.addEventListener('click', this.performSearch.bind(this));
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    }

    // File Management
    async loadFileTree() {
        const fileContent = document.getElementById('file-content');
        if (!fileContent) return;

        try {
            // Show loading state
            fileContent.innerHTML = '<div class="loading-files">Loading files...</div>';

            // Simulate file tree loading
            await this.delay(1000);

            // Generate mock file tree
            const fileTree = this.generateMockFileTree();
            fileContent.innerHTML = fileTree;

            // Add file click handlers
            this.setupFileClickHandlers();
        } catch (error) {
            console.error('Failed to load file tree:', error);
            fileContent.innerHTML = '<div class="mobile-error"><div class="mobile-error-title">Error</div><div class="mobile-error-message">Failed to load files</div></div>';
        }
    }

    generateMockFileTree() {
        const files = [
            { name: 'src/', type: 'folder', icon: '📁' },
            { name: 'components/', type: 'folder', icon: '📁', parent: 'src' },
            { name: 'utils/', type: 'folder', icon: '📁', parent: 'src' },
            { name: 'index.js', type: 'file', icon: '📄' },
            { name: 'package.json', type: 'file', icon: '📦' },
            { name: 'README.md', type: 'file', icon: '📝' },
        ];

        return files.map(file => `
            <div class="file-tree-item ${file.type}" data-file="${file.name}">
                <span class="file-tree-icon">${file.icon}</span>
                <span class="file-tree-name">${file.name}</span>
            </div>
        `).join('');
    }

    setupFileClickHandlers() {
        const fileItems = document.querySelectorAll('.file-tree-item');
        fileItems.forEach(item => {
            item.addEventListener('click', this.handleFileClick.bind(this));
        });
    }

    handleFileClick(e) {
        const fileName = e.currentTarget.dataset.file;
        const fileType = e.currentTarget.classList.contains('folder') ? 'folder' : 'file';

        if (fileType === 'file') {
            this.openFile(fileName);
        } else {
            this.toggleFolder(fileName);
        }
    }

    openFile(fileName) {
        // Forward file open request to VS Code
        if (this.vscodeFrame.contentWindow) {
            this.vscodeFrame.contentWindow.postMessage({
                type: 'open-file',
                fileName: fileName
            }, '*');
        }

        // Close file panel and return to editor
        this.hideAllPanels();
        this.navigateTo('editor');
    }

    // Terminal Management
    initializeTerminal() {
        const terminalContent = document.getElementById('terminal-content');
        if (!terminalContent) return;

        // Create mock terminal interface
        terminalContent.innerHTML = `
            <div class="mobile-terminal">
                <div class="terminal-header">
                    <span class="terminal-title">Terminal</span>
                    <div class="terminal-controls">
                        <div class="terminal-control close"></div>
                        <div class="terminal-control minimize"></div>
                        <div class="terminal-control maximize"></div>
                    </div>
                </div>
                <div class="terminal-content">
                    <div class="terminal-line">
                        <span class="terminal-prompt">$</span>
                        <span class="terminal-command">pwd</span>
                    </div>
                    <div class="terminal-output">/Users/user/project</div>
                    <div class="terminal-line">
                        <span class="terminal-prompt">$</span>
                        <span class="terminal-command">_</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Search Management
    async performSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (!searchInput || !searchResults) return;

        const query = searchInput.value.trim();
        if (!query) return;

        try {
            searchResults.innerHTML = '<div class="mobile-loading"><div class="mobile-loading-spinner"></div><div class="mobile-loading-text">Searching...</div></div>';

            // Simulate search delay
            await this.delay(1000);

            // Generate mock search results
            const results = this.generateMockSearchResults(query);
            searchResults.innerHTML = results;

            // Setup result click handlers
            this.setupSearchResultHandlers();
        } catch (error) {
            console.error('Search failed:', error);
            searchResults.innerHTML = '<div class="mobile-error"><div class="mobile-error-title">Search Error</div><div class="mobile-error-message">Failed to search files</div></div>';
        }
    }

    generateMockSearchResults(query) {
        const results = [
            { file: 'src/index.js', snippet: `function ${query}() { return 'Hello World'; }`, line: 15 },
            { file: 'components/Header.js', snippet: `export default ${query}Component;`, line: 23 },
            { file: 'utils/helper.js', snippet: `const ${query}Util = () => { ... }`, line: 8 }
        ];

        if (results.length === 0) {
            return '<div class="mobile-error"><div class="mobile-error-title">No Results</div><div class="mobile-error-message">No matches found</div></div>';
        }

        return results.map(result => `
            <div class="search-result-item" data-file="${result.file}" data-line="${result.line}">
                <div class="search-result-file">${result.file}:${result.line}</div>
                <div class="search-result-snippet">${this.highlightMatch(result.snippet, query)}</div>
            </div>
        `).join('');
    }

    highlightMatch(snippet, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return snippet.replace(regex, '<span class="search-result-match">$1</span>');
    }

    setupSearchResultHandlers() {
        const resultItems = document.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', this.handleSearchResultClick.bind(this));
        });
    }

    handleSearchResultClick(e) {
        const file = e.currentTarget.dataset.file;
        const line = e.currentTarget.dataset.line;

        // Forward to VS Code
        if (this.vscodeFrame.contentWindow) {
            this.vscodeFrame.contentWindow.postMessage({
                type: 'open-file',
                fileName: file,
                line: parseInt(line)
            }, '*');
        }

        // Close search panel and return to editor
        this.hideAllPanels();
        this.navigateTo('editor');
    }

    // Quick Actions
    showQuickActions() {
        // Toggle quick actions menu
        this.state.quickActionsVisible = !this.state.quickActionsVisible;
        this.updateQuickActionsDisplay();
    }

    updateQuickActionsDisplay() {
        // This would be implemented with a floating action button menu
        console.log('Quick actions:', this.state.quickActionsVisible ? 'shown' : 'hidden');
    }

    // Theme and Layout Management
    applyTheme() {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    updateLayout() {
        // Handle orientation and layout updates
        const isLandscape = window.innerWidth > window.innerHeight;
        this.state.orientation = isLandscape ? 'landscape' : 'portrait';

        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
    }

    // Connection Management
    startConnectionMonitoring() {
        // Check VS Code connection status periodically
        setInterval(() => {
            this.checkConnectionStatus();
        }, 5000);
    }

    checkConnectionStatus() {
        try {
            if (this.vscodeFrame.contentWindow && this.vscodeFrame.contentDocument) {
                this.setConnectionStatus('connected');
            } else {
                this.setConnectionStatus('disconnected');
            }
        } catch (error) {
            this.setConnectionStatus('disconnected');
        }
    }

    setConnectionStatus(status) {
        this.connectionStatus = status;
        const statusElement = document.getElementById('connection-status');

        if (statusElement) {
            statusElement.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
            statusElement.className = `project-status ${status}`;
        }
    }

    // Event Handlers
    handleVSCodeLoad() {
        console.log('VS Code iframe loaded');
        this.setConnectionStatus('connected');
    }

    handleResize() {
        this.updateLayout();
    }

    handleOrientationChange() {
        setTimeout(() => {
            this.updateLayout();
        }, 100);
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            this.checkConnectionStatus();
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.triggerSave();
                    break;
                case '1':
                    e.preventDefault();
                    this.navigateTo('editor');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateTo('files');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateTo('terminal');
                    break;
            }
        }
    }

    // Actions
    triggerSave() {
        if (this.vscodeFrame.contentWindow) {
            this.vscodeFrame.contentWindow.postMessage({
                type: 'save-file'
            }, '*');
        }

        this.showToast('File saved', 'success');
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    toggleMainMenu() {
        // Implementation for main menu toggle
        this.showQuickActions();
    }

    focusEditor() {
        if (this.vscodeFrame.contentWindow) {
            this.vscodeFrame.contentWindow.focus();
        }
    }

    showSettingsMenu() {
        // Implementation for settings
        this.showToast('Settings menu coming soon', 'info');
    }

    // Utility Methods
    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `mobile-toast mobile-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public API
    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.updateLayout();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileController = new MobileController();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileController;
}