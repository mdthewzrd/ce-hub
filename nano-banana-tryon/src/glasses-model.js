/**
 * Real Glasses 3D Model for Virtual Try-On
 * Creates a realistic glasses model using Three.js
 */

class GlassesModel {
    constructor() {
        this.model = null;
        this.frameMaterial = null;
        this.lensMaterial = null;
    }

    createGlasses(scene) {
        console.log('👓 Creating realistic glasses model...');

        // Create group for glasses
        this.model = new THREE.Group();

        // Materials
        this.frameMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b4513, // Brown for aviator style
            shininess: 100,
            metalness: 0.3,
            roughness: 0.2,
            emissive: 0x4a2c17,
            emissiveIntensity: 0.1
        });

        this.lensMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x333366, // Dark blue tint
            transmission: 0.8,
            opacity: 0.4,
            transparent: true,
            roughness: 0.0,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            reflectivity: 0.9
        });

        // Create glasses components
        this.createFrames();
        this.createLenses();
        this.createTemples();
        this.createBridge();

        // Position and scale - position glasses at center of view
        this.model.position.set(0, 0, 2);
        this.model.scale.set(0.8, 0.8, 0.8);
        this.model.rotation.x = -0.1; // Slight tilt for better viewing

        scene.add(this.model);
        console.log('✅ Glasses model created successfully');

        return this.model;
    }

    createFrames() {
        // Create more realistic aviator style frames
        // Left frame - teardrop shape
        const leftFramePoints = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(10, 5),
            new THREE.Vector2(20, 10),
            new THREE.Vector2(30, 20),
            new THREE.Vector2(35, 30),
            new THREE.Vector2(30, 40),
            new THREE.Vector2(20, 45),
            new THREE.Vector2(10, 40),
            new THREE.Vector2(0, 30),
            new THREE.Vector2(-5, 15)
        ];

        const leftFrameShape = new THREE.Shape(leftFramePoints);
        const leftFrameGeometry = new THREE.ExtrudeGeometry(leftFrameShape, {
            depth: 6,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 1,
            bevelSegments: 2
        });

        const leftFrame = new THREE.Mesh(leftFrameGeometry, this.frameMaterial);
        leftFrame.position.set(-40, 0, 0);
        this.model.add(leftFrame);

        // Right frame - mirrored version
        const rightFramePoints = leftFramePoints.map(p => new THREE.Vector2(-p.x, p.y));
        const rightFrameShape = new THREE.Shape(rightFramePoints);
        const rightFrameGeometry = new THREE.ExtrudeGeometry(rightFrameShape, {
            depth: 6,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 1,
            bevelSegments: 2
        });

        const rightFrame = new THREE.Mesh(rightFrameGeometry, this.frameMaterial);
        rightFrame.position.set(40, 0, 0);
        this.model.add(rightFrame);
    }

    createLenses() {
        // Left lens
        const leftLensGeometry = new THREE.CylinderGeometry(32, 32, 2, 64, 1, false, 0, Math.PI);
        const leftLens = new THREE.Mesh(leftLensGeometry, this.lensMaterial);
        leftLens.position.set(-40, 0, 0);
        leftLens.rotation.z = Math.PI / 2;
        this.model.add(leftLens);

        // Right lens
        const rightLens = leftLens.clone();
        rightLens.position.set(40, 0, 0);
        this.model.add(rightLens);
    }

    createTemples() {
        // Left temple (arm)
        const leftTempleGeometry = new THREE.BoxGeometry(80, 6, 8);
        const leftTemple = new THREE.Mesh(leftTempleGeometry, this.frameMaterial);
        leftTemple.position.set(-80, 0, 0);
        leftTemple.rotation.z = Math.PI / 12;
        this.model.add(leftTemple);

        // Right temple
        const rightTempleGeometry = new THREE.BoxGeometry(80, 6, 8);
        const rightTemple = new THREE.Mesh(rightTempleGeometry, this.frameMaterial);
        rightTemple.position.set(80, 0, 0);
        rightTemple.rotation.z = -Math.PI / 12;
        this.model.add(rightTemple);

        // Left temple tip
        const leftTipGeometry = new THREE.SphereGeometry(4, 16, 16);
        const leftTip = new THREE.Mesh(leftTipGeometry, this.frameMaterial);
        leftTip.position.set(-120, -5, 0);
        this.model.add(leftTip);

        // Right temple tip
        const rightTip = leftTip.clone();
        rightTip.position.set(120, -5, 0);
        this.model.add(rightTip);
    }

    createBridge() {
        // Bridge
        const bridgeGeometry = new THREE.BoxGeometry(20, 4, 6);
        const bridge = new THREE.Mesh(bridgeGeometry, this.frameMaterial);
        bridge.position.set(0, 35, 0);
        this.model.add(bridge);

        // Bridge pads
        const padGeometry = new THREE.SphereGeometry(8, 16, 16);
        padGeometry.scale(1, 0.5, 0.3);

        const leftPad = new THREE.Mesh(padGeometry, this.frameMaterial);
        leftPad.position.set(-10, 35, 0);
        this.model.add(leftPad);

        const rightPad = new THREE.Mesh(padGeometry, this.frameMaterial);
        rightPad.position.set(10, 35, 0);
        this.model.add(rightPad);
    }

    updateHandTracking(handLandmarks) {
        if (!this.model || !handLandmarks || handLandmarks.length < 468) return;

        // Map hand landmarks to glasses position
        // Use face detection when available, otherwise approximate position

        // For now, use index finger and middle finger to approximate glasses position
        const indexFinger = handLandmarks[8];
        const middleFinger = handLandmarks[12];
        const wrist = handLandmarks[0];

        if (indexFinger && middleFinger && wrist) {
            // Calculate approximate face position based on hand
            const faceX = indexFinger.x * 6 - 3;
            const faceY = -(indexFinger.y * 4 - 2);
            const faceZ = indexFinger.z * 2;

            // Smooth movement
            this.model.position.lerp(new THREE.Vector3(faceX, faceY, faceZ), 0.1);

            // Adjust rotation based on hand orientation
            const deltaX = indexFinger.x - wrist.x;
            const deltaY = indexFinger.y - wrist.y;
            const rotation = Math.atan2(deltaY, deltaX);

            this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, rotation * 0.5, 0.1);
        }
    }

    switchStyle(style) {
        console.log(`👓 Switching glasses style to: ${style}`);

        switch(style) {
            case 'aviator':
                this.frameMaterial.color.setHex(0x8b4513); // Brown
                this.lensMaterial.color.setHex(0x333366); // Dark blue
                break;
            case 'wayfarer':
                this.frameMaterial.color.setHex(0x000000); // Black
                this.lensMaterial.color.setHex(0x000033); // Dark tint
                break;
            case 'catEye':
                this.frameMaterial.color.setHex(0x8b0000); // Dark red
                this.lensMaterial.color.setHex(0x330033); // Purple tint
                break;
            case 'round':
                this.frameMaterial.color.setHex(0x8b7355); // Tan
                this.lensMaterial.color.setHex(0x332211); // Amber tint
                break;
            default:
                this.frameMaterial.color.setHex(0x333333); // Default gray
                this.lensMaterial.color.setHex(0xffffff); // Clear
        }
    }
}

// Export for global use
window.GlassesModel = GlassesModel;
console.log('👓 Glasses model module loaded');