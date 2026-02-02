/**
 * WORKING Virtual Try-On Glasses - Based on successful GitHub projects
 * Simple canvas overlay that actually works!
 */

class WorkingGlasses {
    constructor() {
        this.isActive = false;
        this.canvas = null;
        this.ctx = null;
        this.video = null;
        this.currentStyle = 'aviator';
        this.faceDetection = null;

        // Manual positioning for debugging
        this.manualX = 0;
        this.manualY = 0;
        this.useManual = false;
        this.scale = 1.0;
    }

    async initialize() {
        console.log('👓 Initializing WORKING glasses try-on...');

        try {
            // Get video element (it might not be ready yet, and that's OK)
            this.video = document.getElementById('camera-video');
            if (!this.video) {
                console.warn('⚠️ Video element not found yet, will initialize later when camera starts');
                // Don't return false - we can still create the canvas structure
            } else {
                console.log('✅ Video element found:', this.video);
            }

            // Create overlay canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'glasses-overlay-working';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '1000';

            // Find a container for the canvas
            let container = null;
            if (this.video) {
                container = this.video.parentElement;
            } else {
                // Fallback: find the video container by class or ID
                container = document.querySelector('.video-container') || document.body;
            }

            if (!container) {
                console.error('❌ No suitable container found for canvas');
                return false;
            }

            container.appendChild(this.canvas);
            console.log('✅ Canvas added to container:', container);

            // Get 2D context
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.error('❌ Could not get 2D context');
                return false;
            }

            console.log('✅ 2D context obtained');

            // Add keyboard controls
            this.setupKeyboardControls();

            console.log('✅ Working glasses initialized successfully!');
            return true;

        } catch (error) {
            console.error('❌ Error during initialization:', error);
            return false;
        }
    }

    testDraw() {
        console.log('🎨 Testing canvas drawing...');
        if (!this.ctx || !this.canvas) {
            console.error('❌ Cannot test draw - no context or canvas');
            return;
        }

        // Draw a test rectangle
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(50, 50, 100, 100);
        console.log('✅ Test rectangle drawn at (50, 50) size 100x100');

        // Draw test text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('GLASSES TEST', 50, 200);
        console.log('✅ Test text drawn');
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            const moveSpeed = 10;
            const scaleSpeed = 0.1;

            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.manualY = Math.max(0, this.manualY - moveSpeed);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.manualY = Math.min(this.canvas.height, this.manualY + moveSpeed);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.manualX = Math.max(0, this.manualX - moveSpeed);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.manualX = Math.min(this.canvas.width, this.manualX + moveSpeed);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.scale = Math.min(2.0, this.scale + scaleSpeed);
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    this.scale = Math.max(0.5, this.scale - scaleSpeed);
                    break;
                case ' ':
                    e.preventDefault();
                    this.useManual = !this.useManual;
                    console.log(this.useManual ? '✅ Manual mode activated' : '🔄 Auto mode activated');
                    break;
            }
        });
    }

    activate() {
        console.log('👓 Activating WORKING glasses...');

        // Try to get video element again if we don't have it
        if (!this.video) {
            this.video = document.getElementById('camera-video');
            if (this.video) {
                console.log('✅ Video element found during activation');
            }
        }

        this.isActive = true;

        // Start drawing loop
        this.startDrawingLoop();

        console.log('✅ Working glasses activated!');
    }

    deactivate() {
        console.log('👓 Deactivating working glasses...');
        this.isActive = false;

        // Clear canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        console.log('✅ Working glasses deactivated');
    }

    startDrawingLoop() {
        const draw = () => {
            if (this.isActive) {
                this.updateCanvasSize();
                this.drawGlasses();
                requestAnimationFrame(draw);
            }
        };

        requestAnimationFrame(draw);
    }

    updateCanvasSize() {
        if (this.video && this.canvas) {
            // Match canvas size to video ACTUAL dimensions, not just display rect
            this.canvas.width = this.video.videoWidth || 1280;
            this.canvas.height = this.video.videoHeight || 720;

            // Style to match video display size
            const rect = this.video.getBoundingClientRect();
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
        }
    }

    drawGlasses(landmarks = null) {
        if (!this.isActive || !this.ctx || !this.video) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let centerX, centerY, radius;

        // If manual mode is enabled, use manual position
        if (this.useManual) {
            centerX = this.manualX;
            centerY = this.manualY;
            radius = 100 * this.scale;
        } else if (landmarks && landmarks.length > 0) {
            // Try face landmarks - MediaPipe Face Mesh has 468 landmarks
            const leftEyeCorner = landmarks[33];   // Left eye outer corner
            const rightEyeCorner = landmarks[263]; // Right eye outer corner
            const leftEyeCenter = landmarks[159];  // Left eye center
            const rightEyeCenter = landmarks[386]; // Right eye center
            const noseTip = landmarks[1];          // Nose tip
            const noseBridge = landmarks[6];        // Nose bridge

            console.log('👁️ Face detection debug:', {
                hasLandmarks: landmarks.length,
                hasLeftEye: !!leftEyeCorner,
                hasRightEye: !!rightEyeCorner,
                hasNose: !!noseTip,
                leftEyePos: leftEyeCorner ? `${leftEyeCorner.x.toFixed(3)}, ${leftEyeCorner.y.toFixed(3)}` : 'null',
                rightEyePos: rightEyeCorner ? `${rightEyeCorner.x.toFixed(3)}, ${rightEyeCorner.y.toFixed(3)}` : 'null'
            });

            if (leftEyeCorner && rightEyeCorner) {
                // Calculate eye center for glasses positioning
                const leftEyeX = leftEyeCorner.x * this.canvas.width;
                const leftEyeY = leftEyeCorner.y * this.canvas.height;
                const rightEyeX = rightEyeCorner.x * this.canvas.width;
                const rightEyeY = rightEyeCorner.y * this.canvas.height;

                // Position glasses at the midpoint between eyes
                centerX = (leftEyeX + rightEyeX) / 2;
                centerY = (leftEyeY + rightEyeY) / 2;

                // Calculate radius based on eye distance - this is crucial for proper scaling
                const eyeDistance = Math.sqrt(Math.pow(rightEyeX - leftEyeX, 2) + Math.pow(rightEyeY - leftEyeY, 2));
                radius = eyeDistance * 0.8; // Glasses should be about 80% of eye distance

                console.log('✅ Eyes detected - Glasses positioning:', {
                    centerX: centerX.toFixed(0),
                    centerY: centerY.toFixed(0),
                    eyeDistance: eyeDistance.toFixed(0),
                    radius: radius.toFixed(0)
                });
            } else if (noseTip) {
                // Use nose as fallback
                centerX = noseTip.x * this.canvas.width;
                centerY = noseTip.y * this.canvas.height;
                radius = 120;
                console.log('👃 Using nose position:', `${centerX.toFixed(0)}, ${centerY.toFixed(0)}`);
            } else {
                // Fallback to center of upper third of screen
                centerX = this.canvas.width / 2;
                centerY = this.canvas.height / 3;
                radius = 100;
                console.log('❌ No face landmarks detected, using center position');
            }
        } else {
            // Draw glasses at center when no face detected
            centerX = this.canvas.width / 2;
            centerY = this.canvas.height / 3;
            radius = 100;
        }

        // Set glasses style with better visibility
        this.ctx.strokeStyle = this.getColor();
        this.ctx.lineWidth = Math.max(6, radius * 0.08); // Dynamic line width
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Add shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;

        // Draw lenses (bigger and more visible)
        const lensRadius = radius * 0.9;
        const lensDistance = radius * 1.2;

        // Left lens
        this.ctx.beginPath();
        this.ctx.arc(centerX - lensDistance/2, centerY, lensRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Right lens
        this.ctx.beginPath();
        this.ctx.arc(centerX + lensDistance/2, centerY, lensRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Draw bridge (thicker and more prominent)
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - lensDistance/2 + lensRadius, centerY);
        this.ctx.lineTo(centerX + lensDistance/2 - lensRadius, centerY);
        this.ctx.stroke();

        // Draw left temple arm
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - lensDistance/2 - lensRadius, centerY);
        this.ctx.quadraticCurveTo(centerX - lensDistance/2 - lensRadius - 20, centerY - 5,
                                  centerX - lensDistance/2 - lensRadius - 40, centerY - 15);
        this.ctx.stroke();

        // Draw right temple arm
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + lensDistance/2 + lensRadius, centerY);
        this.ctx.quadraticCurveTo(centerX + lensDistance/2 + lensRadius + 20, centerY - 5,
                                  centerX + lensDistance/2 + lensRadius + 40, centerY - 15);
        this.ctx.stroke();

        // Reset shadow for lens tint
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Add subtle lens tint effect
        this.ctx.fillStyle = 'rgba(200, 200, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - lensDistance/2, centerY, lensRadius - 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(centerX + lensDistance/2, centerY, lensRadius - 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Show tracking status and controls
        this.ctx.fillStyle = landmarks ? '#00ff00' : '#ffff00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(this.useManual ? 'MANUAL MODE' : (landmarks ? 'FACE TRACKING' : 'CENTER POSITION'), 20, 30);

        // Show position info
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Position: ${centerX.toFixed(0)}, ${centerY.toFixed(0)}`, 20, 55);
        this.ctx.fillText(`Use Arrow Keys to Move, +/- to Scale`, 20, 75);

        // Manual mode indicator
        if (this.useManual) {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillText('MANUAL MODE - Use Arrow Keys to Position Glasses', 20, 95);
        }
    }

    getColor() {
        switch(this.currentStyle) {
            case 'aviator': return '#D2691E'; // Light brown (more visible)
            case 'wayfarer': return '#1a1a1a'; // Dark black (better contrast)
            case 'catEye': return '#DC143C'; // Crimson (more visible than pink)
            case 'round': return '#4169E1'; // Royal blue (brighter)
            default: return '#2F4F4F'; // Dark slate gray (more visible)
        }
    }

    setStyle(style) {
        console.log(`👓 Changing glasses style to: ${style}`);
        this.currentStyle = style;
    }
}

// Create global instance
const workingGlasses = new WorkingGlasses();

// Export for global use
window.workingGlasses = workingGlasses;
window.WorkingGlasses = WorkingGlasses;

console.log('👓 Working glasses module loaded!');