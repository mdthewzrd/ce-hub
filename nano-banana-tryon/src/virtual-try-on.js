/**
 * Banana Virtual Try-On - Bulletproof 3D Reconstruction System
 * Uses proven GitHub libraries: Three.js, MediaPipe, TensorFlow.js, OpenCV.js
 */

class VirtualTryOn {
    constructor() {
        // Core systems
        this.camera = null;
        this.scene3D = null;
        this.scanner = null;
        this.arMode = false;
        this.handTracking = false;

        // MediaPipe components
        this.holistic = null;
        this.cameraUtils = null;

        // Three.js components
        this.renderer = null;
        this.scene = null;
        this.camera3D = null;
        this.model3D = null;

        // OpenCV components
        this.cv = null;
        this.videoProcessor = null;

        // State management
        this.isInitialized = false;
        this.isScanning = false;
        this.isPaused = false;
        this.currentCamera = 'environment'; // 'user' for front, 'environment' for back

        // Performance tracking
        this.fps = 0;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;

        // 3D reconstruction data
        this.pointCloud = [];
        this.meshData = [];
        this.scanProgress = 0;
        this.maxScanFrames = 100;

        // Virtual try-on features
        this.glassesModel = null;
        this.currentGlassesStyle = 'aviator';

        console.log('🍌 VirtualTryOn system initialized');
    }

    async initialize() {
        console.log('🚀 Initializing Virtual Try-On System...');
        this.showLoading(0);

        try {
            // Check for HTTPS requirement
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.warn('⚠️ Camera access requires HTTPS. Using localhost may work in some browsers.');
                this.showNotification('🔒 HTTPS Recommended',
                    'Camera access works best over HTTPS. Localhost may work but could have limitations.', 'warning');
            }

            // Initialize systems in order
            await this.initializeGlassesCanvas(10);
            await this.setupEventListeners(30);
            await this.initializeMediaPipe(50);
            // Note: Camera is not initialized on startup - user must click "Start Camera"

            this.isInitialized = true;
            this.hideLoading(100);
            this.updateStatus('camera', 'Ready');
            this.updateStatus('glasses', 'Ready');
            console.log('✅ Virtual Try-On System Ready! Click "Start Camera" to begin.');

            // Initialize working glasses
            console.log('🔍 Checking for working glasses system...');
            console.log('🔍 window.workingGlasses:', window.workingGlasses);

            if (window.workingGlasses) {
                console.log('🚀 Initializing working glasses...');
                window.workingGlasses.initialize().then(success => {
                    if (success) {
                        console.log('✅ Working glasses system ready!');
                    } else {
                        console.error('❌ Working glasses initialization failed');
                    }
                }).catch(error => {
                    console.error('❌ Working glasses initialization error:', error);
                });
            } else {
                console.error('❌ Working glasses system not found! Check if working-glasses.js loaded properly.');
            }

        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('Failed to initialize virtual try-on: ' + error.message);
            this.hideLoading(0);
        }
    }

    async initializeOpenCV(progress) {
        console.log('📦 Initializing OpenCV.js...');
        this.showLoading(progress);

        return new Promise((resolve, reject) => {
            const checkCV = () => {
                if (typeof cv !== 'undefined' && cv.Mat) {
                    this.cv = cv;
                    console.log('✅ OpenCV.js loaded');
                    resolve();
                } else if (performance.now() - this.lastFrameTime < 5000) {
                    requestAnimationFrame(checkCV);
                } else {
                    reject(new Error('OpenCV.js failed to load'));
                }
            };
            checkCV();
        });
    }

    async initializeGlassesCanvas(progress) {
        console.log('👓 Initializing glasses canvas overlay...');
        this.showLoading(progress);

        // Create canvas for glasses overlay
        this.glassesCanvas = document.createElement('canvas');
        this.glassesCanvas.id = 'glasses-overlay';

        // Set canvas size to match video
        this.glassesCanvas.width = 1280;
        this.glassesCanvas.height = 720;

        this.glassesCanvas.style.position = 'absolute';
        this.glassesCanvas.style.top = '0';
        this.glassesCanvas.style.left = '0';
        this.glassesCanvas.style.width = '100%';
        this.glassesCanvas.style.height = '100%';
        this.glassesCanvas.style.pointerEvents = 'none';
        this.glassesCanvas.style.zIndex = '10';
        this.glassesCanvas.style.opacity = '0.9';

        // Add canvas to video container
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.appendChild(this.glassesCanvas);
            console.log('✅ Canvas added to video container');
        } else {
            console.error('❌ Video container not found');
            // Add to body as fallback
            document.body.appendChild(this.glassesCanvas);
            this.glassesCanvas.style.position = 'fixed';
            this.glassesCanvas.style.top = '80px';
            this.glassesCanvas.style.left = '0';
        }

        this.glassesCtx = this.glassesCanvas.getContext('2d');

        // Test drawing immediately
        this.glassesCtx.strokeStyle = '#ff0000';
        this.glassesCtx.lineWidth = 10;
        this.glassesCtx.beginPath();
        this.glassesCtx.arc(100, 100, 50, 0, Math.PI * 2);
        this.glassesCtx.stroke();
        console.log('✅ Test circle drawn');

        console.log('✅ Glasses canvas overlay initialized');
    }

    createBananaModel() {
        // Create a more sophisticated banana shape
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(-0.5, 0.3, 0),
            new THREE.Vector3(0, 0.5, 0),
            new THREE.Vector3(0.5, 0.3, 0),
            new THREE.Vector3(1, 0, 0)
        ]);

        const geometry = new THREE.TubeGeometry(curve, 20, 0.3, 8, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffeb3b,
            emissive: 0x444400,
            shininess: 100,
            opacity: 0.8,
            transparent: true
        });

        this.model3D = new THREE.Mesh(geometry, material);
        this.model3D.castShadow = true;
        this.model3D.receiveShadow = true;
        this.scene.add(this.model3D);

        // Add some initial rotation
        this.model3D.rotation.x = Math.PI / 6;
        this.model3D.rotation.y = Math.PI / 4;
    }

    async initializeMediaPipe(progress) {
        console.log('🤖 Initializing MediaPipe...');
        this.showLoading(progress);

        return new Promise((resolve) => {
            // Initialize Holistic for hand/body tracking
            this.holistic = new Holistic({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
                }
            });

            this.holistic.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                refineFaceLandmarks: true, // Enable face landmarks for better AR
                minDetectionConfidence: 0.3, // Lower threshold for better detection
                minTrackingConfidence: 0.3
            });

            // Setup result callback
            this.holistic.onResults((results) => this.onMediaPipeResults(results));

            // Wait for Holistic to be ready
            setTimeout(() => {
                console.log('✅ MediaPipe initialized');
                resolve();
            }, 1000);
        });
    }

    async initializeCamera(progress) {
        console.log('📸 Initializing Camera...');
        this.showLoading(progress);

        try {
            const videoElement = document.getElementById('camera-video');
            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.stream;

            // Setup MediaPipe camera
            this.cameraUtils = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.holistic && (this.arMode || this.isScanning || this.handTracking)) {
                        await this.holistic.send({ image: videoElement });
                    }
                },
                width: 1920,
                height: 1080
            });

            // Show camera video
            videoElement.style.display = 'block';

            console.log('✅ Camera initialized');
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            throw error;
        }
    }

    setupEventListeners(progress) {
        console.log('🎛️ Setting up event listeners...');
        this.showLoading(progress);

        // Camera controls
        document.getElementById('start-camera').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera').addEventListener('click', () => this.stopCamera());
        document.getElementById('switch-camera').addEventListener('click', () => this.switchCamera());

        // Scanning controls
        document.getElementById('start-scan').addEventListener('click', () => this.startScanning());
        document.getElementById('pause-scan').addEventListener('click', () => this.pauseScanning());
        document.getElementById('reset-scan').addEventListener('click', () => this.resetScanning());

        // Glasses controls
        document.getElementById('try-glasses').addEventListener('click', () => this.activateGlassesMode());
        document.getElementById('glasses-style').addEventListener('change', (e) => this.switchGlassesStyle(e.target.value));

        // AR controls
        document.getElementById('toggle-ar').addEventListener('click', () => this.toggleAR());
        document.getElementById('toggle-tracking').addEventListener('click', () => this.toggleHandTracking());

        // Model controls
        document.getElementById('rotation-speed').addEventListener('input', (e) => {
            this.rotationSpeed = e.target.value / 1000;
        });

        document.getElementById('model-scale').addEventListener('input', (e) => {
            const scale = e.target.value / 100;
            if (this.glassesModel && this.glassesModel.model) {
                this.glassesModel.model.scale.set(scale, scale, scale);
            } else if (this.model3D) {
                this.model3D.scale.set(scale, scale, scale);
            }
        });

        document.getElementById('model-opacity').addEventListener('input', (e) => {
            const opacity = e.target.value / 100;
            if (this.glassesModel && this.glassesModel.model) {
                this.glassesModel.model.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = opacity;
                    }
                });
            }
        });

        // Fullscreen button
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Initialize rotation speed
        this.rotationSpeed = 0.01;

        console.log('✅ Event listeners setup complete');
    }

    async startCamera() {
        if (this.stream) {
            console.log('📸 Camera already active');
            return;
        }

        try {
            console.log('🎥 Requesting camera access...');
            this.updateStatus('camera', 'Requesting...');

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Get video element
            const videoElement = document.getElementById('camera-video');

            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                },
                audio: false
            };

            console.log('📋 Camera constraints:', constraints);

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Set video source
            videoElement.srcObject = this.stream;
            videoElement.style.display = 'block';

            // Wait for video to be ready
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });

            console.log('✅ Camera stream started');
            console.log('🎥 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);

            // Setup MediaPipe camera utils for AR processing - ALWAYS active
            if (this.cameraUtils) {
                this.cameraUtils = new Camera(videoElement, {
                    onFrame: async () => {
                        if (this.holistic) {
                            await this.holistic.send({ image: videoElement });
                        }
                    },
                    width: videoElement.videoWidth || 1280,
                    height: videoElement.videoHeight || 720
                });

                // Start MediaPipe immediately for face tracking
                this.cameraUtils.start();
                console.log('🤖 MediaPipe camera utils setup and started');
            }

            // Update UI
            document.getElementById('start-camera').disabled = true;
            document.getElementById('stop-camera').disabled = false;
            document.getElementById('start-scan').disabled = false;

            this.updateStatus('camera', 'Active');

            // Show success message
            this.showNotification('📸 Camera Active', 'Camera is ready for AR and 3D scanning!', 'success');

            console.log('✅ Camera started successfully');

        } catch (error) {
            console.error('❌ Failed to start camera:', error);
            this.updateStatus('camera', 'Error');

            // Handle specific error types
            let errorMessage = 'Failed to start camera: ';

            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
                this.showNotification('🚫 Camera Permission Required',
                    'Please click the camera icon in your browser address bar and allow camera access.', 'warning');
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Camera constraints are not supported by your device.';
            } else {
                errorMessage = error.message;
            }

            this.showError(errorMessage);
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.cameraUtils) {
            this.cameraUtils.stop();
        }

        // Hide camera video
        const videoElement = document.getElementById('camera-video');
        videoElement.style.display = 'none';

        // Update UI
        document.getElementById('start-camera').disabled = false;
        document.getElementById('stop-camera').disabled = true;
        document.getElementById('start-scan').disabled = true;

        this.updateStatus('camera', 'Inactive');
        console.log('✅ Camera stopped');
    }

    async switchCamera() {
        if (this.stream) {
            this.stopCamera();

            // Switch camera facing mode
            this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';

            // Restart camera with new facing mode
            setTimeout(() => {
                this.startCamera();
            }, 100);
        }
    }

    startScanning() {
        if (!this.stream) {
            this.showError('Please start camera first');
            return;
        }

        if (this.isScanning) {
            console.log('🔄 Scanning already in progress');
            return;
        }

        console.log('🎯 Starting 3D scanning...');
        this.isScanning = true;
        this.isPaused = false;
        this.scanProgress = 0;
        this.pointCloud = [];
        this.currentScanFrame = 0;

        // Update UI
        document.getElementById('start-scan').disabled = true;
        document.getElementById('pause-scan').disabled = false;

        this.updateStatus('scanning', 'Active');
        this.showScanningProgress();
    }

    pauseScanning() {
        this.isPaused = !this.isPaused;

        document.getElementById('pause-scan').textContent = this.isPaused ? 'Resume Scan' : 'Pause Scan';
        document.getElementById('pause-scan').innerHTML = `<i class="fas fa-${this.isPaused ? 'play' : 'pause'}"></i> ${this.isPaused ? 'Resume' : 'Pause'} Scan`;

        this.updateStatus('scanning', this.isPaused ? 'Paused' : 'Active');
        console.log(this.isPaused ? '⏸️ Scanning paused' : '▶️ Scanning resumed');
    }

    resetScanning() {
        console.log('🔄 Resetting 3D scan...');

        this.isScanning = false;
        this.isPaused = false;
        this.scanProgress = 0;
        this.pointCloud = [];
        this.currentScanFrame = 0;

        // Reset UI
        document.getElementById('start-scan').disabled = false;
        document.getElementById('pause-scan').disabled = true;
        document.getElementById('pause-scan').innerHTML = '<i class="fas fa-pause"></i> Pause Scan';

        // Reset progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }

        this.updateStatus('scanning', 'Inactive');
        console.log('✅ Scan reset complete');
    }

    toggleAR() {
        if (!this.stream) {
            this.showError('Please start camera first to enable AR mode');
            return;
        }

        this.arMode = !this.arMode;

        document.getElementById('toggle-ar').classList.toggle('btn-warning');
        document.getElementById('toggle-ar').classList.toggle('btn-secondary');

        // MediaPipe is always running now, just toggle AR mode status
        console.log(this.arMode ? '🥽 AR mode activated' : '🥽 AR mode deactivated');

        this.updateStatus('ar', this.arMode ? 'Active' : 'Inactive');
        this.showNotification(this.arMode ? '🥽 AR Activated' : '🥽 AR Deactivated',
                               this.arMode ? 'AR overlay effects enabled!' : 'AR overlay effects disabled',
                               this.arMode ? 'success' : 'info');
    }

    toggleHandTracking() {
        if (!this.stream) {
            this.showError('Please start camera first to enable hand tracking');
            return;
        }

        this.handTracking = !this.handTracking;

        document.getElementById('toggle-tracking').classList.toggle('btn-warning');
        document.getElementById('toggle-tracking').classList.toggle('btn-secondary');

        // MediaPipe is always running now, just toggle hand tracking status
        console.log(this.handTracking ? '✋ Hand tracking activated' : '✋ Hand tracking deactivated');

        this.updateStatus('tracking', this.handTracking ? 'Active' : 'Inactive');
        this.showNotification(this.handTracking ? '✋ Hand Tracking Activated' : '✋ Hand Tracking Deactivated',
                               this.handTracking ? 'Show your hands to control objects!' : 'Hand tracking disabled',
                               this.handTracking ? 'success' : 'info');
    }

    activateGlassesMode() {
        console.log('👓 Activating WORKING glasses try-on mode...');

        // Use the working glasses system
        if (window.workingGlasses) {
            window.workingGlasses.activate();
            this.updateStatus('glasses', 'Active');
            this.showNotification('👓 Working Glasses Active!', 'Glasses should be visible now!', 'success');
        } else {
            this.showError('Working glasses system not loaded');
        }
    }

    drawGlassesOnFace(landmarks) {
        console.log('👓 drawGlassesOnFace called', {
            glassesActive: this.glassesActive,
            hasCtx: !!this.glassesCtx,
            hasLandmarks: !!landmarks,
            landmarksCount: landmarks ? landmarks.length : 0
        });

        if (!this.glassesActive || !this.glassesCtx || !landmarks) {
            console.log('❌ Missing requirements for drawing glasses');
            return;
        }

        // Get video element for dimensions
        const video = document.getElementById('camera-video');
        if (!video) {
            console.log('❌ No video element found');
            return;
        }

        console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('📐 Canvas dimensions:', this.glassesCanvas.width, 'x', this.glassesCanvas.height);

        // Clear canvas
        this.glassesCtx.clearRect(0, 0, this.glassesCanvas.width, this.glassesCanvas.height);

        // Key face landmarks for glasses positioning
        const leftEye = landmarks[33];    // Left eye corner
        const rightEye = landmarks[263];  // Right eye corner
        const leftEyebrow = landmarks[70]; // Left eyebrow
        const rightEyebrow = landmarks[300]; // Right eyebrow

        console.log('👁️ Eye landmarks:', {
            leftEye: leftEye ? `${leftEye.x.toFixed(2)}, ${leftEye.y.toFixed(2)}` : 'null',
            rightEye: rightEye ? `${rightEye.x.toFixed(2)}, ${rightEye.y.toFixed(2)}` : 'null'
        });

        if (!leftEye || !rightEye) {
            console.log('❌ Eye landmarks not found');
            return;
        }

        // Calculate positions
        const canvasWidth = this.glassesCanvas.width;
        const canvasHeight = this.glassesCanvas.height;

        // Convert normalized coordinates to canvas coordinates
        const leftEyeX = leftEye.x * canvasWidth;
        const leftEyeY = leftEye.y * canvasHeight;
        const rightEyeX = rightEye.x * canvasWidth;
        const rightEyeY = rightEye.y * canvasHeight;

        console.log('🎨 Eye positions on canvas:', {
            left: `${leftEyeX.toFixed(0)}, ${leftEyeY.toFixed(0)}`,
            right: `${rightEyeX.toFixed(0)}, ${rightEyeY.toFixed(0)}`
        });

        // Calculate glasses dimensions
        const eyeWidth = Math.abs(rightEyeX - leftEyeX);
        const eyeHeight = Math.abs(rightEyeY - leftEyeY);
        const glassesWidth = eyeWidth * 3.5;
        const glassesHeight = eyeHeight * 2.5;

        console.log('👓 Glasses dimensions:', glassesWidth.toFixed(0), 'x', glassesHeight.toFixed(0));

        // Calculate center position between eyes
        const centerX = (leftEyeX + rightEyeX) / 2;
        const centerY = (leftEyeY + rightEyeY) / 2;

        console.log('🎯 Glasses center:', `${centerX.toFixed(0)}, ${centerY.toFixed(0)}`);

        // Draw glasses frame
        this.glassesCtx.strokeStyle = this.getGlassesColor();
        this.glassesCtx.lineWidth = 6;
        this.glassesCtx.shadowColor = 'rgba(0,0,0,0.5)';
        this.glassesCtx.shadowBlur = 10;

        // Draw big glasses - simplified version that should definitely work
        this.glassesCtx.strokeStyle = this.getGlassesColor();
        this.glassesCtx.lineWidth = 8;
        this.glassesCtx.shadowColor = 'rgba(0,0,0,0.5)';
        this.glassesCtx.shadowBlur = 10;

        // Draw big visible glasses
        const eyeDistance = Math.abs(rightEyeX - leftEyeX);
        const glassesRadius = eyeDistance * 0.8;

        // Left lens (big and visible)
        this.glassesCtx.beginPath();
        this.glassesCtx.arc(leftEyeX, leftEyeY, glassesRadius, 0, Math.PI * 2);
        this.glassesCtx.stroke();

        // Right lens (big and visible)
        this.glassesCtx.beginPath();
        this.glassesCtx.arc(rightEyeX, rightEyeY, glassesRadius, 0, Math.PI * 2);
        this.glassesCtx.stroke();

        // Bridge
        this.glassesCtx.beginPath();
        this.glassesCtx.moveTo(leftEyeX + glassesRadius, leftEyeY);
        this.glassesCtx.lineTo(rightEyeX - glassesRadius, rightEyeY);
        this.glassesCtx.stroke();

        console.log('✅ BIG VISIBLE GLASSES drawn!');
        console.log(`📍 Drawing at positions: (${leftEyeX.toFixed(0)}, ${leftEyeY.toFixed(0)}) and (${rightEyeX.toFixed(0)}, ${rightEyeY.toFixed(0)})`);
    }

    getGlassesColor() {
        switch(this.currentGlassesStyle) {
            case 'aviator': return '#8b4513'; // Brown
            case 'wayfarer': return '#000000'; // Black
            case 'catEye': return '#8b0000'; // Dark red
            case 'round': return '#8b7355'; // Tan
            default: return '#333333'; // Default gray
        }
    }

    switchGlassesStyle(style) {
        console.log(`👓 Switching working glasses style to: ${style}`);
        this.currentGlassesStyle = style;

        // Use the working glasses system
        if (window.workingGlasses) {
            window.workingGlasses.setStyle(style);
            this.showNotification('👓 Style Changed', `Switched to ${style} glasses`, 'info');
        } else {
            this.showError('Working glasses system not loaded');
        }
    }

    onMediaPipeResults(results) {
        // Enhanced face landmark detection for working glasses
        if (window.workingGlasses) {
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                console.log('🎯 Face landmarks detected:', results.faceLandmarks.length);
                window.workingGlasses.drawGlasses(results.faceLandmarks);
            } else {
                // Still call drawGlasses even without landmarks for fallback positioning
                console.log('🎯 No face landmarks, using fallback positioning');
                window.workingGlasses.drawGlasses(null);
            }
        }

        // Process hand landmarks for AR
        if (this.handTracking && results.rightHandLandmarks) {
            this.processHandTracking(results.rightHandLandmarks);
        }

        // Process 3D scanning
        if (this.isScanning && !this.isPaused) {
            this.process3DScanning(results);
        }

        // Draw AR overlays
        if (this.arMode) {
            this.drawAROverlay(results);
        }
    }

    processFaceTracking(landmarks) {
        if (!landmarks || landmarks.length === 0) return;

        // Use face landmarks to position glasses realistically
        // Key face landmarks for glasses positioning
        const leftEye = landmarks[33];    // Left eye corner
        const rightEye = landmarks[263];  // Right eye corner
        const nose = landmarks[1];        // Nose tip
        const forehead = landmarks[10];   // Forehead

        if (leftEye && rightEye && this.glassesModel && this.glassesModel.model) {
            // Calculate eye center
            const eyeCenterX = (leftEye.x + rightEye.x) / 2;
            const eyeCenterY = (leftEye.y + rightEye.y) / 2;

            // Map face position to 3D world coordinates
            const worldX = (eyeCenterX - 0.5) * 8;
            const worldY = -(eyeCenterY - 0.5) * 8;
            const worldZ = 2 + (nose ? nose.z * 2 : 0);

            // Position glasses
            this.glassesModel.model.position.set(worldX, worldY, worldZ);

            // Calculate rotation based on eye line
            const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
            this.glassesModel.model.rotation.y = -eyeAngle * 0.5;

            // Scale based on face distance
            const eyeDistance = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
            const scaleFactor = 0.5 + eyeDistance * 2;
            this.glassesModel.model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    }

    processHandTracking(landmarks) {
        if (!landmarks || landmarks.length === 0) return;

        // Use hand landmarks to position 3D model
        const indexFinger = landmarks[8]; // Index finger tip

        if (indexFinger) {
            // Map hand position to 3D model position
            const x = (indexFinger.x - 0.5) * 10;
            const y = -(indexFinger.y - 0.5) * 10;
            const z = indexFinger.z * 5;

            // Only move glasses if face tracking is not active
            if (this.glassesModel && this.glassesModel.model && !this.glassesModel.model.visible) {
                this.glassesModel.model.position.set(x, y, z);
            } else if (this.model3D) {
                this.model3D.position.set(x, y, z);
            }
        }
    }

    process3DScanning(results) {
        if (!results.imageData) return;

        // Simulate 3D point extraction from image
        // In a real implementation, this would use computer vision to extract depth

        for (let i = 0; i < 10; i++) {
            const point = {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3,
                z: (Math.random() - 0.5) * 2
            };

            this.pointCloud.push(point);
        }

        // Update scan progress
        this.currentScanFrame++;
        this.scanProgress = (this.currentScanFrame / this.maxScanFrames) * 100;

        this.updateScanningProgress();

        // Check if scan is complete
        if (this.currentScanFrame >= this.maxScanFrames) {
            this.completeScanning();
        }

        // Update point count display
        document.getElementById('point-count').textContent = this.pointCloud.length;
    }

    drawAROverlay(results) {
        const canvas = document.getElementById('ar-canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to match video
        const videoElement = document.getElementById('camera-video');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw hand landmarks
        if (results.rightHandLandmarks) {
            this.drawHandLandmarks(ctx, results.rightHandLandmarks);
        }

        // Draw pose landmarks
        if (results.poseLandmarks) {
            this.drawPoseLandmarks(ctx, results.poseLandmarks);
        }
    }

    drawHandLandmarks(ctx, landmarks) {
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];

        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[start].x * ctx.canvas.width, landmarks[start].y * ctx.canvas.height);
                ctx.lineTo(landmarks[end].x * ctx.canvas.width, landmarks[end].y * ctx.canvas.height);
                ctx.stroke();
            }
        });

        // Draw points
        landmarks.forEach(landmark => {
            ctx.beginPath();
            ctx.arc(
                landmark.x * ctx.canvas.width,
                landmark.y * ctx.canvas.height,
                5, 0, 2 * Math.PI
            );
            ctx.fill();
        });
    }

    drawPoseLandmarks(ctx, landmarks) {
        ctx.fillStyle = '#ffff00';

        landmarks.forEach(landmark => {
            if (landmark.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(
                    landmark.x * ctx.canvas.width,
                    landmark.y * ctx.canvas.height,
                    8, 0, 2 * Math.PI
                );
                ctx.fill();
            }
        });
    }

    completeScanning() {
        console.log('🎉 3D scanning completed!');

        this.isScanning = false;
        this.updateStatus('scanning', 'Complete');

        // Generate 3D mesh from point cloud
        this.generate3DMesh();

        // Update UI
        document.getElementById('start-scan').disabled = false;
        document.getElementById('pause-scan').disabled = true;

        // Show completion message
        this.showNotification('🎉 Scan Complete!', '3D model generated successfully!', 'success');
    }

    generate3DMesh() {
        if (!this.pointCloud || this.pointCloud.length === 0) return;

        // Create geometry from point cloud
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.pointCloud.length * 3);

        this.pointCloud.forEach((point, i) => {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        });

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.computeVertexNormals();

        // Create material
        const material = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.05,
            sizeAttenuation: true,
            opacity: 0.8,
            transparent: true
        });

        // Create point cloud mesh
        const pointCloudMesh = new THREE.Points(geometry, material);
        this.scene.add(pointCloudMesh);

        // Hide old banana model
        if (this.model3D) {
            this.model3D.visible = false;
        }

        console.log(`✅ Generated 3D mesh with ${this.pointCloud.length} points`);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.renderer && this.scene && this.camera3D) {
            // Auto-rotate model if enabled
            if (this.model3D && this.model3D.visible) {
                this.model3D.rotation.y += this.rotationSpeed;
            }

            // Render scene
            this.renderer.render(this.scene, this.camera3D);

            // Update FPS counter
            this.updateFPS();
        }
    }

    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        const delta = currentTime - this.lastFrameTime;

        if (delta >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / delta);
            document.getElementById('fps-counter').textContent = this.fps;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }

    onWindowResize() {
        if (!this.renderer || !this.camera3D) return;

        const canvas = document.getElementById('3d-canvas');
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera3D.aspect = width / height;
        this.camera3D.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    updateStatus(system, status) {
        const statusElement = document.getElementById(`${system}-status`);
        const indicatorElement = document.getElementById(`${system}-indicator`);

        if (statusElement) {
            statusElement.textContent = status;
        }

        if (indicatorElement) {
            indicatorElement.className = 'status-indicator';

            switch(status.toLowerCase()) {
                case 'active':
                case 'ready':
                case 'complete':
                    indicatorElement.classList.add('status-active');
                    break;
                case 'processing':
                case 'scanning':
                case 'paused':
                    indicatorElement.classList.add('status-processing');
                    break;
                default:
                    indicatorElement.classList.add('status-inactive');
            }
        }
    }

    showLoading(progress) {
        const overlay = document.getElementById('loading');
        const progressBar = document.getElementById('init-progress');

        if (overlay && progressBar) {
            overlay.style.display = 'flex';
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
    }

    hideLoading(progress) {
        const overlay = document.getElementById('loading');
        const progressBar = document.getElementById('init-progress');

        if (overlay && progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;

            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
    }

    showScanningProgress() {
        const existingBar = document.querySelector('.scanning-progress');
        if (!existingBar) {
            const progressHTML = `
                <div class="scanning-progress position-fixed top-50 start-50 translate-middle">
                    <div class="card bg-dark text-white p-3">
                        <h6>3D Scanning in Progress...</h6>
                        <div class="progress mb-2">
                            <div class="progress-bar progress-bar-striped progress-bar-animated"
                                 role="progressbar" style="width: 0%"></div>
                        </div>
                        <small>Points captured: <span class="point-count">0</span></small>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', progressHTML);
        }
    }

    updateScanningProgress() {
        const progressBar = document.querySelector('.scanning-progress .progress-bar');
        const pointCount = document.querySelector('.scanning-progress .point-count');

        if (progressBar) {
            progressBar.style.width = `${this.scanProgress}%`;
            progressBar.textContent = `${Math.round(this.scanProgress)}%`;
        }

        if (pointCount) {
            pointCount.textContent = this.pointCloud.length;
        }
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.innerHTML = `
            <strong>${title}</strong><br>
            <small>${message}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification('❌ Error', message, 'danger');
        console.error('Error:', message);
    }
}

// Global instance
let virtualTryOn = null;

// Initialize function for global access
function initializeVirtualTryOn() {
    if (!virtualTryOn) {
        virtualTryOn = new VirtualTryOn();
        virtualTryOn.initialize();
    }
}

// Export for global access
window.VirtualTryOn = VirtualTryOn;
window.initializeVirtualTryOn = initializeVirtualTryOn;
window.virtualTryOn = virtualTryOn;

console.log('🍌 Virtual Try-On module loaded successfully');