/**
 * Nano Banana 3D Reconstruction - AR Controller
 * Handles Augmented Reality functionality and device camera access
 */

class ARController {
    constructor() {
        this.isARActive = false;
        this.arScene = null;
        this.stream = null;
        this.devices = [];
        this.currentDevice = null;
    }

    async initializeAR() {
        console.log('🥽 Initializing AR Controller...');

        try {
            // Check for WebRTC support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('WebRTC not supported in this browser');
            }

            // Get available camera devices
            this.devices = await this.getCameraDevices();
            console.log('📷 Available cameras:', this.devices.length);

            // Initialize AR scene
            await this.setupARScene();

            updateStatus('ar', 'Active');
            console.log('✅ AR Controller initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ AR initialization failed:', error);
            updateStatus('ar', 'Error');
            this.showError('AR initialization failed: ' + error.message);
            return false;
        }
    }

    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting camera devices:', error);
            return [];
        }
    }

    async startCamera() {
        try {
            console.log('📸 Starting camera...');

            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            // If we have specific devices, try to use the back camera
            if (this.devices.length > 0) {
                const backCamera = this.devices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear')
                );

                if (backCamera) {
                    constraints.video.deviceId = { exact: backCamera.deviceId };
                    this.currentDevice = backCamera;
                }
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            updateStatus('camera', 'Active');
            console.log('✅ Camera started successfully');

            return this.stream;
        } catch (error) {
            console.error('❌ Failed to start camera:', error);
            updateStatus('camera', 'Error');
            this.showError('Failed to access camera: ' + error.message);
            return null;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            updateStatus('camera', 'Inactive');
            console.log('🛑 Camera stopped');
        }
    }

    async setupARScene() {
        console.log('🎮 Setting up AR scene...');

        const arViewer = document.getElementById('ar-viewer');
        if (!arViewer) {
            throw new Error('AR viewer element not found');
        }

        // For now, we'll use A-Frame for AR functionality
        // This will be enhanced with custom AR implementation
        if (typeof AFRAME !== 'undefined') {
            console.log('🎯 A-Frame detected, setting up AR scene...');

            // Wait for A-Frame to be ready
            if (arViewer.querySelector('a-scene')) {
                const scene = arViewer.querySelector('a-scene');

                scene.addEventListener('loaded', () => {
                    console.log('✅ A-Frame AR scene loaded');
                    this.placeBananaInAR();
                });
            }
        }

        this.isARActive = true;
    }

    placeBananaInAR() {
        console.log('🍌 Placing banana in AR...');

        // Create a simple 3D banana for AR
        const bananaEntity = document.getElementById('banana-model');
        if (bananaEntity) {
            // Set banana properties for AR
            bananaEntity.setAttribute('geometry', 'primitive: cylinder; height: 3; radius: 0.3');
            bananaEntity.setAttribute('material', 'color: #ffeb3b; roughness: 0.5; metalness: 0.1');
            bananaEntity.setAttribute('rotation', '-30 0 0');
            bananaEntity.setAttribute('scale', '0.5 0.5 0.5');

            console.log('✅ Banana placed in AR scene');
        }
    }

    async enableAR() {
        console.log('🥽 Enabling AR mode...');

        if (!this.isARActive) {
            const initialized = await this.initializeAR();
            if (!initialized) {
                return false;
            }
        }

        // Start camera for AR
        const cameraStream = await this.startCamera();
        if (!cameraStream) {
            return false;
        }

        // Switch to AR view
        this.switchToARView();

        return true;
    }

    disableAR() {
        console.log('🥽 Disabling AR mode...');

        this.stopCamera();
        this.switchTo3DView();
        updateStatus('ar', 'Inactive');
    }

    switchToARView() {
        const viewer3d = document.getElementById('3d-viewer');
        const viewerAR = document.getElementById('ar-viewer');

        if (viewer3d && viewerAR) {
            viewer3d.style.display = 'none';
            viewerAR.style.display = 'block';

            // Add video background for AR
            this.addVideoBackground();

            console.log('✅ Switched to AR view');
        }
    }

    switchTo3DView() {
        const viewer3d = document.getElementById('3d-viewer');
        const viewerAR = document.getElementById('ar-viewer');

        if (viewer3d && viewerAR) {
            viewer3d.style.display = 'block';
            viewerAR.style.display = 'none';

            this.removeVideoBackground();

            console.log('✅ Switched to 3D view');
        }
    }

    addVideoBackground() {
        const arViewer = document.getElementById('ar-viewer');

        if (this.stream && arViewer) {
            const video = document.createElement('video');
            video.id = 'ar-video-background';
            video.autoplay = true;
            video.playsInline = true;
            video.style.position = 'absolute';
            video.style.top = '0';
            video.style.left = '0';
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.zIndex = '-1';
            video.style.objectFit = 'cover';

            video.srcObject = this.stream;
            arViewer.insertBefore(video, arViewer.firstChild);
        }
    }

    removeVideoBackground() {
        const video = document.getElementById('ar-video-background');
        if (video) {
            video.remove();
        }
    }

    showError(message) {
        console.error('❌ AR Error:', message);

        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
            <strong>AR Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    detectMarkers() {
        console.log('🔍 Detecting AR markers...');

        // Placeholder for marker detection
        // In a real implementation, this would use computer vision
        // to detect QR codes, image targets, or other markers
    }

    toggleAR() {
        if (this.isARActive) {
            this.disableAR();
        } else {
            this.enableAR();
        }
    }
}

// Create global AR controller instance
const arController = new ARController();

// Global functions for HTML onclick handlers
window.toggleAR = function() {
    arController.toggleAR();
};

window.enableAR = async function() {
    showLoading();
    const success = await arController.enableAR();
    hideLoading();

    if (!success) {
        console.log('❌ Failed to enable AR mode');
    }
};

window.disableAR = function() {
    arController.disableAR();
};

// Initialize AR when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check for AR support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('✅ Device supports camera access for AR');
    } else {
        console.warn('⚠️ Device does not support camera access');
        updateStatus('ar', 'Unsupported');
    }
});

console.log('🥽 AR Controller module loaded successfully');