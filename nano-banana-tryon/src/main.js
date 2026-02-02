/**
 * Nano Banana 3D Reconstruction - Main JavaScript Module
 * Handles core application initialization and Three.js setup
 */

// Global variables
let scene, camera, renderer, bananaModel;
let isARMode = false;
let isRotating = false;
let rotationSpeed = 0.01;

// Initialize Three.js scene
function initThreeJS() {
    console.log('🍌 Initializing Three.js scene...');

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    const viewer = document.getElementById('3d-viewer');
    const width = viewer.clientWidth;
    const height = viewer.clientHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    viewer.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add temporary placeholder geometry
    const geometry = new THREE.BoxGeometry(2, 1, 0.5);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0x444400,
        shininess: 100
    });
    bananaModel = new THREE.Mesh(geometry, material);
    bananaModel.castShadow = true;
    bananaModel.receiveShadow = true;
    scene.add(bananaModel);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Start animation loop
    animate();

    updateStatus('engine', 'Active');
    console.log('✅ Three.js scene initialized successfully');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (isRotating && bananaModel) {
        bananaModel.rotation.y += rotationSpeed;
    }

    renderer.render(scene, camera);

    // Update FPS counter
    updateFPS();
}

// Load banana 3D model (placeholder for actual model loading)
function loadBananaModel() {
    console.log('🍌 Loading detailed banana model...');

    // For now, update the placeholder with a more banana-like shape
    if (bananaModel) {
        scene.remove(bananaModel);
    }

    // Create a banana-like shape using cylinder + scale
    const bananaGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
    const bananaMaterial = new THREE.MeshPhongMaterial({
        color: 0xffeb3b,
        emissive: 0x444400,
        shininess: 50
    });

    bananaModel = new THREE.Mesh(bananaGeometry, bananaMaterial);
    bananaModel.rotation.x = Math.PI / 6;
    bananaModel.castShadow = true;
    bananaModel.receiveShadow = true;
    scene.add(bananaModel);

    // Add some curvature to make it more banana-like
    bananaModel.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 0.7));

    console.log('✅ Banana model loaded');
    hideLoading();
}

// Setup event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize, false);

    // Slider controls
    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
        rotationSpeed = e.target.value / 5000;
    });

    document.getElementById('zoomLevel').addEventListener('input', (e) => {
        const zoom = e.target.value / 100;
        camera.position.z = 5 / zoom;
    });

    document.getElementById('modelScale').addEventListener('input', (e) => {
        const scale = e.target.value / 100;
        if (bananaModel) {
            bananaModel.scale.set(scale, scale, scale);
        }
    });

    // Mouse controls for 3D viewer
    const viewer = document.getElementById('3d-viewer');
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    viewer.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    viewer.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    viewer.addEventListener('mousemove', (e) => {
        if (!mouseDown || !bananaModel) return;

        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;

        bananaModel.rotation.y += deltaX * 0.01;
        bananaModel.rotation.x += deltaY * 0.01;

        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Touch controls for mobile
    viewer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    });

    viewer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && bananaModel) {
            const deltaX = e.touches[0].clientX - mouseX;
            const deltaY = e.touches[0].clientY - mouseY;

            bananaModel.rotation.y += deltaX * 0.01;
            bananaModel.rotation.x += deltaY * 0.01;

            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    });
}

// Handle window resize
function onWindowResize() {
    const viewer = document.getElementById('3d-viewer');
    const width = viewer.clientWidth;
    const height = viewer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Show/hide loading overlay
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Update FPS counter
let lastTime = performance.now();
let frameCount = 0;

function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    if (delta >= 1000) {
        const fps = Math.round(frameCount * 1000 / delta);
        document.getElementById('fps-counter').textContent = fps;
        frameCount = 0;
        lastTime = currentTime;
    }
}

// Utility functions
function toggleWireframe() {
    if (bananaModel && bananaModel.material) {
        bananaModel.material.wireframe = !bananaModel.material.wireframe;
        console.log('🔲 Wireframe toggled:', bananaModel.material.wireframe);
    }
}

function autoRotate() {
    isRotating = !isRotating;
    console.log('🔄 Auto rotation:', isRotating ? 'ON' : 'OFF');
}

// Export functions for global scope
window.initThreeJS = initThreeJS;
window.loadBananaModel = loadBananaModel;
window.setupEventListeners = setupEventListeners;
window.toggleWireframe = toggleWireframe;
window.autoRotate = autoRotate;
window.onWindowResize = onWindowResize;

console.log('🍌 Main.js module loaded successfully');