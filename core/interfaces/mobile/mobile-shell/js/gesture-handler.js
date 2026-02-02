/**
 * Mobile Gesture Handler for CE-Hub Mobile Shell
 * Handles touch gestures, swipes, and mobile interactions
 */

class GestureHandler {
    constructor() {
        this.gestureOverlay = null;
        this.isGestureActive = false;
        this.gestureState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            startTime: 0,
            direction: null,
            velocity: 0
        };

        // Gesture thresholds
        this.SWIPE_THRESHOLD = 50;
        this.VELOCITY_THRESHOLD = 0.3;
        this.TAP_THRESHOLD = 10;
        this.LONG_PRESS_DURATION = 500;

        this.init();
    }

    init() {
        this.gestureOverlay = document.getElementById('gesture-overlay');
        if (!this.gestureOverlay) {
            console.warn('Gesture overlay not found');
            return;
        }

        this.bindEvents();
        console.log('✅ Gesture handler initialized');
    }

    bindEvents() {
        // Touch events for gesture recognition
        this.gestureOverlay.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.gestureOverlay.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.gestureOverlay.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.gestureOverlay.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        // Prevent default touch behaviors
        this.gestureOverlay.addEventListener('gesturestart', this.preventDefault);
        this.gestureOverlay.addEventListener('gesturechange', this.preventDefault);
        this.gestureOverlay.addEventListener('gestureend', this.preventDefault);

        // Handle device orientation changes
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }

    preventDefault(e) {
        e.preventDefault();
    }

    handleTouchStart(e) {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        this.gestureState = {
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            startTime: Date.now(),
            direction: null,
            velocity: 0
        };

        this.isGestureActive = true;
        this.showGestureIndicator();

        // Setup long press detection
        this.longPressTimer = setTimeout(() => {
            if (this.isGestureActive) {
                this.handleLongPress(touch.clientX, touch.clientY);
            }
        }, this.LONG_PRESS_DURATION);
    }

    handleTouchMove(e) {
        if (!this.isGestureActive || e.touches.length !== 1) return;

        e.preventDefault(); // Prevent scrolling during gesture

        const touch = e.touches[0];
        this.gestureState.currentX = touch.clientX;
        this.gestureState.currentY = touch.clientY;

        const deltaX = this.gestureState.currentX - this.gestureState.startX;
        const deltaY = this.gestureState.currentY - this.gestureState.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Cancel long press if finger moves too much
        if (distance > this.TAP_THRESHOLD && this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Update gesture direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.gestureState.direction = deltaX > 0 ? 'right' : 'left';
        } else {
            this.gestureState.direction = deltaY > 0 ? 'down' : 'up';
        }

        // Update gesture indicators
        this.updateGestureIndicators(deltaX, deltaY);
    }

    handleTouchEnd(e) {
        if (!this.isGestureActive) return;

        this.isGestureActive = false;
        this.hideGestureIndicator();

        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        const deltaX = this.gestureState.currentX - this.gestureState.startX;
        const deltaY = this.gestureState.currentY - this.gestureState.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = Date.now() - this.gestureState.startTime;

        this.gestureState.velocity = distance / duration;

        // Determine gesture type
        if (distance < this.TAP_THRESHOLD) {
            this.handleTap(this.gestureState.startX, this.gestureState.startY);
        } else if (distance > this.SWIPE_THRESHOLD && this.gestureState.velocity > this.VELOCITY_THRESHOLD) {
            this.handleSwipe(this.gestureState.direction, distance, this.gestureState.velocity);
        }
    }

    handleTouchCancel(e) {
        this.isGestureActive = false;
        this.hideGestureIndicator();

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    handleTap(x, y) {
        // Forward tap to VS Code iframe if no gesture overlay action needed
        this.forwardEventToVSCode('click', x, y);
        this.showGestureFeedback('Tap', 300);
    }

    handleLongPress(x, y) {
        // Show context menu or special actions
        this.showGestureFeedback('Long Press', 500);
        this.triggerContextMenu(x, y);
    }

    handleSwipe(direction, distance, velocity) {
        console.log(`Swipe ${direction}: distance=${distance}, velocity=${velocity}`);

        switch (direction) {
            case 'left':
                this.handleLeftSwipe();
                break;
            case 'right':
                this.handleRightSwipe();
                break;
            case 'up':
                this.handleUpSwipe();
                break;
            case 'down':
                this.handleDownSwipe();
                break;
        }

        this.showGestureFeedback(`Swipe ${direction.toUpperCase()}`, 400);
    }

    handleLeftSwipe() {
        // Show next panel or hide current panel
        if (window.mobileController) {
            window.mobileController.showPanel('search');
        }
    }

    handleRightSwipe() {
        // Show previous panel or files panel
        if (window.mobileController) {
            window.mobileController.showPanel('files');
        }
    }

    handleUpSwipe() {
        // Show terminal or bottom panel
        if (window.mobileController) {
            window.mobileController.showPanel('terminal');
        }
    }

    handleDownSwipe() {
        // Hide all panels or show editor
        if (window.mobileController) {
            window.mobileController.hideAllPanels();
        }
    }

    forwardEventToVSCode(eventType, x, y) {
        const iframe = document.getElementById('vscode-frame');
        if (!iframe || !iframe.contentWindow) return;

        try {
            // Calculate relative coordinates within iframe
            const iframeRect = iframe.getBoundingClientRect();
            const relativeX = x - iframeRect.left;
            const relativeY = y - iframeRect.top;

            // Create and dispatch event in iframe
            const event = new MouseEvent(eventType, {
                view: iframe.contentWindow,
                bubbles: true,
                cancelable: true,
                clientX: relativeX,
                clientY: relativeY
            });

            // Try to forward to iframe content
            iframe.contentWindow.postMessage({
                type: 'gesture-event',
                eventType: eventType,
                x: relativeX,
                y: relativeY
            }, '*');
        } catch (error) {
            console.warn('Could not forward event to VS Code:', error);
        }
    }

    triggerContextMenu(x, y) {
        // Trigger quick actions menu
        if (window.mobileController) {
            window.mobileController.showQuickActions();
        }
    }

    showGestureIndicator() {
        this.gestureOverlay.classList.add('active');
    }

    hideGestureIndicator() {
        this.gestureOverlay.classList.remove('active');
        this.clearSwipeIndicators();
    }

    updateGestureIndicators(deltaX, deltaY) {
        const leftIndicator = document.querySelector('.swipe-indicator.left');
        const rightIndicator = document.querySelector('.swipe-indicator.right');

        if (!leftIndicator || !rightIndicator) return;

        // Show appropriate swipe indicator
        if (Math.abs(deltaX) > this.SWIPE_THRESHOLD / 2) {
            if (deltaX > 0) {
                rightIndicator.classList.add('show');
                leftIndicator.classList.remove('show');
            } else {
                leftIndicator.classList.add('show');
                rightIndicator.classList.remove('show');
            }
        } else {
            leftIndicator.classList.remove('show');
            rightIndicator.classList.remove('show');
        }
    }

    clearSwipeIndicators() {
        const indicators = document.querySelectorAll('.swipe-indicator');
        indicators.forEach(indicator => indicator.classList.remove('show'));
    }

    showGestureFeedback(message, duration = 300) {
        const feedback = document.getElementById('gesture-feedback');
        if (!feedback) return;

        feedback.textContent = message;
        feedback.classList.add('show');

        setTimeout(() => {
            feedback.classList.remove('show');
        }, duration);
    }

    handleOrientationChange() {
        // Recalibrate gesture thresholds for new orientation
        setTimeout(() => {
            this.calibrateForOrientation();
        }, 100);
    }

    calibrateForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;

        if (isLandscape) {
            this.SWIPE_THRESHOLD = 80; // Increase threshold for landscape
        } else {
            this.SWIPE_THRESHOLD = 50; // Default threshold for portrait
        }
    }

    // Public methods for external control
    enableGestures() {
        this.gestureOverlay.style.pointerEvents = 'auto';
    }

    disableGestures() {
        this.gestureOverlay.style.pointerEvents = 'none';
    }

    destroy() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }

        // Remove event listeners
        this.gestureOverlay?.removeEventListener('touchstart', this.handleTouchStart);
        this.gestureOverlay?.removeEventListener('touchmove', this.handleTouchMove);
        this.gestureOverlay?.removeEventListener('touchend', this.handleTouchEnd);
        this.gestureOverlay?.removeEventListener('touchcancel', this.handleTouchCancel);

        window.removeEventListener('orientationchange', this.handleOrientationChange);
    }
}

// Initialize gesture handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gestureHandler = new GestureHandler();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestureHandler;
}