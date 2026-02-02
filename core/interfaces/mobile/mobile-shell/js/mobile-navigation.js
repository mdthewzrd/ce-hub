/**
 * Mobile Navigation Component for CE-Hub Mobile Shell
 * Handles navigation state, tab management, and mobile-specific navigation patterns
 */

class MobileNavigation {
    constructor() {
        this.navigationElement = null;
        this.navItems = [];
        this.currentTab = 'editor';
        this.tabHistory = ['editor'];
        this.maxHistoryLength = 10;

        // Navigation state
        this.state = {
            activeTab: 'editor',
            tabStates: {
                editor: { hasUnsavedChanges: false },
                files: { isLoading: false },
                terminal: { hasOutput: false },
                search: { hasResults: false },
                settings: { isDirty: false }
            },
            notifications: new Map()
        };

        this.init();
    }

    init() {
        this.navigationElement = document.querySelector('.mobile-navigation');
        if (!this.navigationElement) {
            console.warn('Mobile navigation element not found');
            return;
        }

        this.navItems = Array.from(this.navigationElement.querySelectorAll('.nav-item'));
        this.setupEventListeners();
        this.initializeTabStates();
        this.setupKeyboardShortcuts();

        console.log('✅ Mobile navigation initialized');
    }

    setupEventListeners() {
        // Tab click events
        this.navItems.forEach(item => {
            item.addEventListener('click', this.handleTabClick.bind(this));
            item.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            item.addEventListener('touchend', this.handleTouchEnd.bind(this));
        });

        // Hardware back button (Android)
        window.addEventListener('popstate', this.handleBackButton.bind(this));

        // App state changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Custom events from other components
        window.addEventListener('vscode-file-changed', this.handleFileChanged.bind(this));
        window.addEventListener('vscode-terminal-output', this.handleTerminalOutput.bind(this));
        window.addEventListener('search-results', this.handleSearchResults.bind(this));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.metaKey || e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToTab('editor');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToTab('files');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToTab('terminal');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToTab('search');
                        break;
                    case '5':
                        e.preventDefault();
                        this.navigateToTab('settings');
                        break;
                    case '`':
                        e.preventDefault();
                        this.togglePreviousTab();
                        break;
                }
            }

            // Escape key to return to editor
            if (e.key === 'Escape') {
                this.navigateToTab('editor');
            }
        });
    }

    // Event Handlers
    handleTabClick(e) {
        const tab = e.currentTarget.dataset.action;
        this.navigateToTab(tab);
    }

    handleTouchStart(e) {
        // Add visual feedback for touch
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }

    handleTouchEnd(e) {
        // Remove visual feedback
        setTimeout(() => {
            e.currentTarget.style.backgroundColor = '';
        }, 150);
    }

    handleBackButton(e) {
        // Handle hardware back button on Android
        if (this.currentTab !== 'editor') {
            e.preventDefault();
            this.goBack();
        }
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // App became visible, refresh current tab if needed
            this.refreshCurrentTab();
        }
    }

    // Navigation Logic
    navigateToTab(tab) {
        if (tab === this.currentTab) {
            // Same tab clicked - perform tab-specific action
            this.handleSameTabAction(tab);
            return;
        }

        // Save current tab state
        this.saveTabState(this.currentTab);

        // Update history
        this.updateTabHistory(tab);

        // Deactivate current tab
        this.deactivateTab(this.currentTab);

        // Activate new tab
        this.activateTab(tab);

        // Update current tab reference
        this.currentTab = tab;

        // Trigger navigation event
        this.emitNavigationEvent('tab-changed', { from: this.currentTab, to: tab });

        console.log(`Navigated to: ${tab}`);
    }

    handleSameTabAction(tab) {
        switch (tab) {
            case 'files':
                this.refreshFileTree();
                break;
            case 'terminal':
                this.clearTerminal();
                break;
            case 'search':
                this.focusSearchInput();
                break;
            case 'settings':
                this.toggleSettingsMenu();
                break;
        }
    }

    activateTab(tab) {
        // Update visual state
        const tabElement = this.getTabElement(tab);
        if (tabElement) {
            tabElement.classList.add('active');
            this.addActivationAnimation(tabElement);
        }

        // Update tab state
        this.state.activeTab = tab;

        // Show corresponding panel or content
        this.showTabContent(tab);

        // Load tab content if needed
        this.loadTabContent(tab);

        // Update browser history (for web apps)
        if (history.pushState && tab !== 'editor') {
            history.pushState({ tab }, '', `#${tab}`);
        }
    }

    deactivateTab(tab) {
        // Update visual state
        const tabElement = this.getTabElement(tab);
        if (tabElement) {
            tabElement.classList.remove('active');
        }

        // Hide corresponding panel
        this.hideTabContent(tab);
    }

    showTabContent(tab) {
        if (window.mobileController) {
            window.mobileController.navigateTo(tab);
        }
    }

    hideTabContent(tab) {
        if (window.mobileController) {
            window.mobileController.hidePanel(this.getTabPanelId(tab));
        }
    }

    loadTabContent(tab) {
        switch (tab) {
            case 'files':
                this.loadFiles();
                break;
            case 'terminal':
                this.initializeTerminal();
                break;
            case 'search':
                this.initializeSearch();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Tab State Management
    initializeTabStates() {
        this.navItems.forEach(item => {
            const tab = item.dataset.action;
            if (!this.state.tabStates[tab]) {
                this.state.tabStates[tab] = {};
            }
        });

        // Set initial active tab
        this.activateTab(this.currentTab);
    }

    saveTabState(tab) {
        const state = this.state.tabStates[tab];

        switch (tab) {
            case 'files':
                state.scrollPosition = this.getFileTreeScrollPosition();
                state.expandedFolders = this.getExpandedFolders();
                break;
            case 'terminal':
                state.scrollPosition = this.getTerminalScrollPosition();
                state.commandHistory = this.getTerminalHistory();
                break;
            case 'search':
                state.query = this.getSearchQuery();
                state.results = this.getSearchResults();
                break;
        }
    }

    restoreTabState(tab) {
        const state = this.state.tabStates[tab];

        switch (tab) {
            case 'files':
                if (state.scrollPosition) this.setFileTreeScrollPosition(state.scrollPosition);
                if (state.expandedFolders) this.restoreExpandedFolders(state.expandedFolders);
                break;
            case 'terminal':
                if (state.scrollPosition) this.setTerminalScrollPosition(state.scrollPosition);
                if (state.commandHistory) this.restoreTerminalHistory(state.commandHistory);
                break;
            case 'search':
                if (state.query) this.setSearchQuery(state.query);
                if (state.results) this.restoreSearchResults(state.results);
                break;
        }
    }

    // History Management
    updateTabHistory(tab) {
        // Remove tab from history if it exists
        this.tabHistory = this.tabHistory.filter(t => t !== tab);

        // Add tab to front of history
        this.tabHistory.unshift(tab);

        // Limit history length
        if (this.tabHistory.length > this.maxHistoryLength) {
            this.tabHistory = this.tabHistory.slice(0, this.maxHistoryLength);
        }
    }

    goBack() {
        if (this.tabHistory.length > 1) {
            // Get previous tab (skip current tab at index 0)
            const previousTab = this.tabHistory[1];
            this.navigateToTab(previousTab);
        } else {
            // Default to editor
            this.navigateToTab('editor');
        }
    }

    togglePreviousTab() {
        this.goBack();
    }

    // Tab Actions
    refreshFileTree() {
        if (window.mobileController) {
            window.mobileController.loadFileTree();
        }
        this.showTabNotification('files', 'Refreshed', 'success');
    }

    clearTerminal() {
        const terminalContent = document.querySelector('#terminal-content .terminal-content');
        if (terminalContent) {
            terminalContent.innerHTML = '';
        }
        this.showTabNotification('terminal', 'Cleared', 'info');
    }

    focusSearchInput() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    toggleSettingsMenu() {
        // Implementation for settings menu toggle
        this.showTabNotification('settings', 'Coming soon', 'info');
    }

    refreshCurrentTab() {
        this.loadTabContent(this.currentTab);
    }

    // Tab Content Loaders
    async loadFiles() {
        this.setTabLoading('files', true);
        try {
            if (window.mobileController) {
                await window.mobileController.loadFileTree();
            }
            this.restoreTabState('files');
        } finally {
            this.setTabLoading('files', false);
        }
    }

    initializeTerminal() {
        if (window.mobileController) {
            window.mobileController.initializeTerminal();
        }
        this.restoreTabState('terminal');
    }

    initializeSearch() {
        this.restoreTabState('search');
    }

    loadSettings() {
        // Implementation for settings loading
        console.log('Loading settings...');
    }

    // Notification System
    showTabNotification(tab, message, type = 'info', duration = 2000) {
        const notification = { message, type, timestamp: Date.now() };
        this.state.notifications.set(tab, notification);

        // Update tab visual state
        this.updateTabBadge(tab, type);

        // Show toast notification
        if (window.mobileController) {
            window.mobileController.showToast(message, type);
        }

        // Auto-remove notification
        setTimeout(() => {
            this.clearTabNotification(tab);
        }, duration);
    }

    clearTabNotification(tab) {
        this.state.notifications.delete(tab);
        this.updateTabBadge(tab, null);
    }

    updateTabBadge(tab, type) {
        const tabElement = this.getTabElement(tab);
        if (!tabElement) return;

        // Remove existing badges
        tabElement.classList.remove('has-notification', 'has-error', 'has-success', 'has-warning');

        if (type) {
            tabElement.classList.add('has-notification', `has-${type}`);
        }
    }

    // Tab State Helpers
    setTabLoading(tab, isLoading) {
        this.state.tabStates[tab].isLoading = isLoading;
        this.updateTabLoadingState(tab, isLoading);
    }

    updateTabLoadingState(tab, isLoading) {
        const tabElement = this.getTabElement(tab);
        if (tabElement) {
            tabElement.classList.toggle('loading', isLoading);
        }
    }

    // Event Handlers for Other Components
    handleFileChanged(e) {
        this.state.tabStates.editor.hasUnsavedChanges = true;
        this.updateTabBadge('editor', 'warning');
    }

    handleTerminalOutput(e) {
        this.state.tabStates.terminal.hasOutput = true;
        if (this.currentTab !== 'terminal') {
            this.updateTabBadge('terminal', 'info');
        }
    }

    handleSearchResults(e) {
        const hasResults = e.detail && e.detail.count > 0;
        this.state.tabStates.search.hasResults = hasResults;
        if (hasResults && this.currentTab !== 'search') {
            this.updateTabBadge('search', 'success');
        }
    }

    // Animation Helpers
    addActivationAnimation(tabElement) {
        tabElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            tabElement.style.transform = '';
        }, 200);
    }

    // Utility Methods
    getTabElement(tab) {
        return this.navItems.find(item => item.dataset.action === tab);
    }

    getTabPanelId(tab) {
        const panelMap = {
            files: 'file-panel',
            terminal: 'terminal-panel',
            search: 'search-panel'
        };
        return panelMap[tab];
    }

    // State Persistence Helpers
    getFileTreeScrollPosition() {
        const fileContent = document.getElementById('file-content');
        return fileContent ? fileContent.scrollTop : 0;
    }

    setFileTreeScrollPosition(position) {
        const fileContent = document.getElementById('file-content');
        if (fileContent) {
            fileContent.scrollTop = position;
        }
    }

    getExpandedFolders() {
        const expandedFolders = document.querySelectorAll('.file-tree-item.folder.expanded');
        return Array.from(expandedFolders).map(folder => folder.dataset.file);
    }

    restoreExpandedFolders(folders) {
        folders.forEach(folderName => {
            const folderElement = document.querySelector(`[data-file="${folderName}"]`);
            if (folderElement) {
                folderElement.classList.add('expanded');
            }
        });
    }

    getTerminalScrollPosition() {
        const terminalContent = document.querySelector('#terminal-content .terminal-content');
        return terminalContent ? terminalContent.scrollTop : 0;
    }

    setTerminalScrollPosition(position) {
        const terminalContent = document.querySelector('#terminal-content .terminal-content');
        if (terminalContent) {
            terminalContent.scrollTop = position;
        }
    }

    getTerminalHistory() {
        // Implementation for getting terminal command history
        return [];
    }

    restoreTerminalHistory(history) {
        // Implementation for restoring terminal command history
        console.log('Restoring terminal history:', history);
    }

    getSearchQuery() {
        const searchInput = document.getElementById('search-input');
        return searchInput ? searchInput.value : '';
    }

    setSearchQuery(query) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = query;
        }
    }

    getSearchResults() {
        // Implementation for getting current search results
        return [];
    }

    restoreSearchResults(results) {
        // Implementation for restoring search results
        console.log('Restoring search results:', results);
    }

    // Event System
    emitNavigationEvent(eventType, data) {
        window.dispatchEvent(new CustomEvent(`mobile-nav-${eventType}`, { detail: data }));
    }

    // Public API
    getCurrentTab() {
        return this.currentTab;
    }

    getTabHistory() {
        return [...this.tabHistory];
    }

    getTabState(tab) {
        return { ...this.state.tabStates[tab] };
    }

    hasNotification(tab) {
        return this.state.notifications.has(tab);
    }

    // Cleanup
    destroy() {
        this.navItems.forEach(item => {
            item.removeEventListener('click', this.handleTabClick);
            item.removeEventListener('touchstart', this.handleTouchStart);
            item.removeEventListener('touchend', this.handleTouchEnd);
        });

        window.removeEventListener('popstate', this.handleBackButton);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileNavigation = new MobileNavigation();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigation;
}