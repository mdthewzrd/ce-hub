/**
 * Nano Banana 3D Reconstruction - 3D Scanner Module
 * Handles 3D scanning functionality and point cloud generation
 */

class Scanner3D {
    constructor() {
        this.isScanning = false;
        this.isPaused = false;
        this.pointCloud = null;
        this.scanProgress = 0;
        this.captureInterval = null;
        this.totalCaptures = 0;
        this.maxCaptures = 50;
        this.capturedPoints = [];
    }

    async initializeScanner() {
        console.log('📡 Initializing 3D Scanner...');

        try {
            // Initialize camera for scanning
            await this.initializeScanningCamera();

            // Setup point cloud geometry
            this.setupPointCloud();

            // Check browser compatibility
            this.checkBrowserCompatibility();

            console.log('✅ 3D Scanner initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Scanner initialization failed:', error);
            this.showError('Failed to initialize scanner: ' + error.message);
            return false;
        }
    }

    checkBrowserCompatibility() {
        const requiredFeatures = [
            'getUserMedia',
            'RTCPeerConnection',
            'Blob',
            'FileReader'
        ];

        for (const feature of requiredFeatures) {
            if (!(feature in navigator || feature in window)) {
                throw new Error(`Browser does not support ${feature}`);
            }
        }

        console.log('✅ Browser compatibility check passed');
    }

    async initializeScanningCamera() {
        console.log('📷 Initializing scanning camera...');

        try {
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'environment'
                }
            };

            this.scanningStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Scanning camera initialized');

            return this.scanningStream;
        } catch (error) {
            console.error('❌ Failed to initialize scanning camera:', error);
            throw error;
        }
    }

    setupPointCloud() {
        console.log('☁️ Setting up point cloud...');

        // Create point cloud geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxCaptures * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 0.05,
            sizeAttenuation: true
        });

        this.pointCloud = new THREE.Points(geometry, material);
        this.pointCloud.visible = false;

        if (window.scene) {
            window.scene.add(this.pointCloud);
        }

        console.log('✅ Point cloud setup complete');
    }

    async startScanning() {
        console.log('🚀 Starting 3D scan...');

        if (this.isScanning) {
            console.log('⚠️ Scan already in progress');
            return;
        }

        try {
            this.isScanning = true;
            this.isPaused = false;
            this.scanProgress = 0;
            this.totalCaptures = 0;
            this.capturedPoints = [];

            showLoading();
            updateStatus('camera', 'Processing');

            // Start capture loop
            this.startCaptureLoop();

            // Start progress simulation
            this.startProgressSimulation();

            console.log('✅ 3D scanning started');
        } catch (error) {
            console.error('❌ Failed to start scanning:', error);
            this.stopScanning();
            this.showError('Failed to start scan: ' + error.message);
        }
    }

    startCaptureLoop() {
        console.log('🔄 Starting capture loop...');

        this.captureInterval = setInterval(() => {
            if (!this.isScanning || this.isPaused) return;

            // Capture frame data
            this.captureFrame();

            this.totalCaptures++;

            // Update scan progress
            this.scanProgress = (this.totalCaptures / this.maxCaptures) * 100;

            // Check if scan is complete
            if (this.totalCaptures >= this.maxCaptures) {
                this.completeScan();
            }

        }, 100); // Capture every 100ms
    }

    captureFrame() {
        console.log(`📸 Capturing frame ${this.totalCaptures + 1}/${this.maxCaptures}`);

        // Simulate 3D point capture
        // In a real implementation, this would:
        // 1. Process the camera frame
        // 2. Extract depth information
        // 3. Generate 3D points
        // 4. Add to point cloud

        const point = this.generateSimulatedPoint();
        this.capturedPoints.push(point);

        // Update point cloud
        this.updatePointCloud(point);
    }

    generateSimulatedPoint() {
        // Generate simulated 3D points around a banana-like shape
        const angle = (this.totalCaptures / this.maxCaptures) * Math.PI * 2;
        const radius = 0.3 + Math.sin(angle * 2) * 0.1;
        const height = (this.totalCaptures / this.maxCaptures) * 3 - 1.5;

        const x = Math.cos(angle) * radius;
        const y = height;
        const z = Math.sin(angle) * radius;

        return new THREE.Vector3(x, y, z);
    }

    updatePointCloud(point) {
        if (!this.pointCloud || !this.pointCloud.geometry) return;

        const positions = this.pointCloud.geometry.attributes.position.array;
        const index = this.totalCaptures * 3;

        positions[index] = point.x;
        positions[index + 1] = point.y;
        positions[index + 2] = point.z;

        this.pointCloud.geometry.attributes.position.needsUpdate = true;
        this.pointCloud.geometry.setDrawRange(0, this.totalCaptures + 1);
        this.pointCloud.visible = true;
    }

    startProgressSimulation() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const progressInterval = setInterval(() => {
                if (!this.isScanning) {
                    clearInterval(progressInterval);
                    return;
                }

                progressBar.style.width = `${this.scanProgress}%`;
                progressBar.setAttribute('aria-valuenow', this.scanProgress);
                progressBar.textContent = `${Math.round(this.scanProgress)}%`;

            }, 200);
        }
    }

    pauseScanning() {
        if (!this.isScanning) {
            console.log('⚠️ No scan in progress to pause');
            return;
        }

        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? '⏸️ Scanning paused' : '▶️ Scanning resumed');
    }

    stopScanning() {
        console.log('🛑 Stopping 3D scan...');

        this.isScanning = false;
        this.isPaused = false;

        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }

        if (this.scanningStream) {
            this.scanningStream.getTracks().forEach(track => track.stop());
            this.scanningStream = null;
        }

        updateStatus('camera', 'Inactive');
        hideLoading();

        console.log('✅ 3D scanning stopped');
    }

    completeScan() {
        console.log('🎉 3D scan completed!');

        this.isScanning = false;

        // Process captured points
        this.processScanData();

        // Generate final 3D model
        this.generate3DModel();

        updateStatus('camera', 'Active');
        hideLoading();

        // Show completion message
        this.showCompletionMessage();
    }

    processScanData() {
        console.log('🔄 Processing scan data...');

        // Apply filtering and smoothing to captured points
        this.filterPoints();
        this.smoothPointCloud();

        console.log(`✅ Processed ${this.capturedPoints.length} points`);
    }

    filterPoints() {
        // Remove outliers and noise
        const filteredPoints = [];

        for (const point of this.capturedPoints) {
            // Simple distance-based filtering
            if (point.length() < 5) {
                filteredPoints.push(point);
            }
        }

        this.capturedPoints = filteredPoints;
    }

    smoothPointCloud() {
        // Apply smoothing algorithm to point cloud
        // This is a placeholder for more sophisticated smoothing
        console.log('🔧 Smoothing point cloud...');
    }

    generate3DModel() {
        console.log('🏗️ Generating 3D model from scan data...');

        // Create geometry from point cloud
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(this.capturedPoints.length * 3);
        for (let i = 0; i < this.capturedPoints.length; i++) {
            const point = this.capturedPoints[i];
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.computeVertexNormals();

        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: 0xffeb3b,
            shininess: 50,
            opacity: 0.9,
            transparent: true
        });

        // Create mesh
        const scanMesh = new THREE.Mesh(geometry, material);
        scanMesh.position.y = 0;
        scanMesh.castShadow = true;
        scanMesh.receiveShadow = true;

        // Add to scene
        if (window.scene) {
            window.scene.add(scanMesh);

            // Remove old banana model if exists
            if (window.bananaModel) {
                window.scene.remove(window.bananaModel);
            }

            // Update global reference
            window.bananaModel = scanMesh;

            // Hide point cloud
            if (this.pointCloud) {
                this.pointCloud.visible = false;
            }
        }

        console.log('✅ 3D model generation complete');
    }

    showCompletionMessage() {
        console.log('🎊 Scan completed successfully!');

        const message = document.createElement('div');
        message.className = 'alert alert-success alert-dismissible fade show position-fixed';
        message.style.top = '20px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.zIndex = '9999';
        message.innerHTML = `
            <strong>🎉 Scan Complete!</strong> Your 3D model has been generated successfully.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    resetScan() {
        console.log('🔄 Resetting 3D scanner...');

        this.stopScanning();

        // Clear captured data
        this.capturedPoints = [];
        this.totalCaptures = 0;
        this.scanProgress = 0;

        // Clear point cloud
        if (this.pointCloud && this.pointCloud.geometry) {
            const positions = this.pointCloud.geometry.attributes.position.array;
            positions.fill(0);
            this.pointCloud.geometry.attributes.position.needsUpdate = true;
            this.pointCloud.geometry.setDrawRange(0, 0);
            this.pointCloud.visible = false;
        }

        // Reset progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
            progressBar.textContent = '0%';
        }

        console.log('✅ Scanner reset complete');
    }

    showError(message) {
        console.error('❌ Scanner Error:', message);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
            <strong>Scanner Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    exportScanData() {
        console.log('💾 Exporting scan data...');

        const scanData = {
            points: this.capturedPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
            timestamp: new Date().toISOString(),
            metadata: {
                totalPoints: this.capturedPoints.length,
                scanDuration: this.scanProgress
            }
        };

        const blob = new Blob([JSON.stringify(scanData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `banana-scan-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Scan data exported');
    }
}

// Create global scanner instance
const scanner3D = new Scanner3D();

// Global functions for HTML onclick handlers
window.startScanning = async function() {
    const initialized = await scanner3D.initializeScanner();
    if (initialized) {
        scanner3D.startScanning();
    }
};

window.pauseScanning = function() {
    scanner3D.pauseScanning();
};

window.resetScan = function() {
    scanner3D.resetScan();
};

window.exportScanData = function() {
    scanner3D.exportScanData();
};

// Make scanner globally accessible
window.scanner3D = scanner3D;

console.log('📡 3D Scanner module loaded successfully');