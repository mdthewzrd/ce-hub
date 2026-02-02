// Mobile VS Code CSS Injection Bookmarklet
// Add this as a bookmark in your mobile browser and run it on the VS Code page

(function() {
    // Remove existing mobile styles if any
    const existingStyle = document.getElementById('mobile-vscode-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    // Create and inject mobile CSS
    const style = document.createElement('style');
    style.id = 'mobile-vscode-styles';
    style.textContent = `
        /* Force Mobile Layout for VS Code Web */
        html {
            -webkit-text-size-adjust: 100% !important;
            -webkit-tap-highlight-color: transparent !important;
            touch-action: manipulation !important;
        }

        body {
            font-size: 16px !important;
            line-height: 1.5 !important;
        }

        /* Mobile-first responsive optimizations */
        @media screen and (max-width: 768px) {
            /* Larger touch targets */
            .monaco-action-bar .action-item,
            .monaco-button,
            .tab,
            .monaco-tree-row {
                min-height: 48px !important;
                min-width: 48px !important;
                padding: 12px !important;
                font-size: 16px !important;
            }

            /* Editor optimizations */
            .monaco-editor {
                font-size: 20px !important;
                line-height: 30px !important;
            }

            /* Terminal optimizations */
            .terminal-wrapper .xterm-screen {
                font-size: 18px !important;
                line-height: 26px !important;
            }

            /* Explorer optimizations */
            .explorer-viewlet .monaco-tree .monaco-tree-row {
                min-height: 48px !important;
                line-height: 48px !important;
                font-size: 16px !important;
                padding-left: 20px !important;
            }

            /* Sidebar width */
            .sidebar {
                min-width: 300px !important;
            }

            /* Activity bar improvements */
            .activitybar .monaco-action-bar .action-item {
                width: 60px !important;
                height: 60px !important;
            }

            /* Tab improvements */
            .tabs-container .tab {
                min-height: 52px !important;
                padding: 14px 20px !important;
                font-size: 18px !important;
                min-width: 120px !important;
            }

            /* Status bar */
            .statusbar {
                height: 36px !important;
                font-size: 16px !important;
            }

            /* Quick input */
            .quick-input-widget {
                width: 95% !important;
                max-width: none !important;
                font-size: 18px !important;
            }

            .quick-input-list .monaco-list-row {
                min-height: 50px !important;
                line-height: 50px !important;
                font-size: 16px !important;
            }

            /* Context menus */
            .context-view .monaco-menu .action-item {
                min-height: 50px !important;
                padding: 14px 18px !important;
                font-size: 16px !important;
            }

            /* Welcome page */
            .welcome-page .card {
                margin: 12px 0 !important;
                padding: 20px !important;
                border-radius: 12px !important;
            }

            .welcome-page .card .card-content {
                font-size: 18px !important;
                line-height: 1.6 !important;
            }

            /* Force dark GitHub colors */
            .monaco-editor {
                background-color: #0d1117 !important;
                color: #f0f6fc !important;
            }

            .sidebar {
                background-color: #161b22 !important;
            }

            .activitybar {
                background-color: #21262d !important;
            }

            .statusbar {
                background-color: #21262d !important;
                color: #f0f6fc !important;
            }

            .tab.active {
                background-color: #161b22 !important;
                color: #f0f6fc !important;
            }

            .tab {
                background-color: #0d1117 !important;
                color: #8b949e !important;
            }
        }

        /* Phone-specific optimizations */
        @media screen and (max-width: 480px) {
            /* Even larger text on phones */
            .monaco-editor {
                font-size: 22px !important;
                line-height: 34px !important;
            }

            /* Hide line numbers on tiny screens */
            .monaco-editor .line-numbers {
                display: none !important;
            }

            /* Single tab mode on phones */
            .tabs-container .tab:not(.active) {
                max-width: 80px !important;
                overflow: hidden !important;
            }

            /* Sidebar takes full width on phones */
            .sidebar {
                width: 100% !important;
            }
        }
    `;

    document.head.appendChild(style);

    // Add mobile-friendly viewport if not present
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
    } else {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }

    // Force reload of some VS Code components to apply styles
    setTimeout(() => {
        // Trigger a small resize to force re-render
        window.dispatchEvent(new Event('resize'));

        console.log('🎯 Mobile VS Code optimizations applied!');

        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #238636;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        notification.textContent = '📱 Mobile optimizations applied!';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }, 500);
})();