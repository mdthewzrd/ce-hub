/**
 * Service Worker for CE-Hub Mobile Shell
 * Provides offline functionality and PWA features
 */

const CACHE_NAME = 'ce-hub-mobile-v1.0.0';
const STATIC_CACHE = 'ce-hub-static-v1';
const DYNAMIC_CACHE = 'ce-hub-dynamic-v1';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/mobile-layout.css',
    '/css/mobile-components.css',
    '/js/mobile-controller.js',
    '/js/gesture-handler.js',
    '/js/vscode-bridge.js',
    '/js/mobile-navigation.js',
    '/manifest.json'
];

// VS Code resources that should be cached dynamically
const VS_CODE_PATTERNS = [
    /^https:\/\/.*\.tail.*\.ts\.net.*\/static\//,
    /^https:\/\/.*\.tail.*\.ts\.net.*\/vscode/,
    /^https:\/\/.*\.tail.*\.ts\.net.*\.(css|js|woff2|ttf)$/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES.map(url => new Request(url, {credentials: 'same-origin'})));
            }),

            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),

            // Take control of all pages immediately
            self.clients.claim()
        ])
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (isStaticFile(request)) {
        event.respondWith(handleStaticFile(request));
    } else if (isVSCodeResource(request)) {
        event.respondWith(handleVSCodeResource(request));
    } else if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

// Handle static files (cache first strategy)
async function handleStaticFile(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If not in cache, fetch and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Static file fetch failed:', error);
        return new Response('File not available offline', { status: 503 });
    }
}

// Handle VS Code resources (network first, then cache)
async function handleVSCodeResource(request) {
    try {
        // Try network first for VS Code resources
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network timeout')), 5000)
            )
        ]);

        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }

        throw new Error('Network response not ok');
    } catch (error) {
        console.log('VS Code resource network failed, trying cache:', error);

        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If no cache, return offline page for VS Code iframe
        if (request.destination === 'document') {
            return createOfflineVSCodePage();
        }

        return new Response('Resource not available offline', { status: 503 });
    }
}

// Handle API requests (network only with error handling)
async function handleApiRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('API request failed:', error);
        return new Response(
            JSON.stringify({ error: 'API not available offline' }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle other dynamic requests (network first, then cache)
async function handleDynamicRequest(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback
        return createOfflinePage();
    }
}

// Helper functions
function isStaticFile(request) {
    const url = new URL(request.url);
    return STATIC_FILES.some(file => url.pathname === file || url.pathname.endsWith(file));
}

function isVSCodeResource(request) {
    return VS_CODE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isApiRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') || url.pathname.includes('/api/');
}

function createOfflineVSCodePage() {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>VS Code - Offline</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .offline-message {
                    padding: 2rem;
                    border-radius: 8px;
                    background: #252526;
                }
                .icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                button {
                    background: #007acc;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="offline-message">
                <div class="icon">⚡</div>
                <h2>VS Code Offline</h2>
                <p>VS Code server is not available right now.</p>
                <p>Check your connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        </body>
        </html>
    `;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}

function createOfflinePage() {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CE-Hub - Offline</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .offline-message {
                    padding: 2rem;
                    border-radius: 8px;
                    background: #252526;
                }
                .icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                button {
                    background: #007acc;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="offline-message">
                <div class="icon">📱</div>
                <h2>CE-Hub Mobile</h2>
                <p>You're currently offline.</p>
                <p>Some features may not be available.</p>
                <button onclick="window.location.reload()">Try Again</button>
            </div>
        </body>
        </html>
    `;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');

    if (event.tag === 'file-save') {
        event.waitUntil(syncFileSaves());
    } else if (event.tag === 'search-cache') {
        event.waitUntil(cacheSearchResults());
    }
});

// Handle file saves when coming back online
async function syncFileSaves() {
    try {
        // Check if there are pending file saves in IndexedDB
        const pendingSaves = await getPendingFileSaves();

        for (const save of pendingSaves) {
            try {
                // Attempt to save file to VS Code
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(save)
                });

                if (response.ok) {
                    // Remove from pending saves
                    await removePendingFileSave(save.id);
                    console.log('File save synced:', save.filename);
                }
            } catch (error) {
                console.error('Failed to sync file save:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Cache search results for offline use
async function cacheSearchResults() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        // Cache frequently searched files and patterns
        // Implementation depends on your search API
    } catch (error) {
        console.error('Search cache sync failed:', error);
    }
}

// IndexedDB helpers for offline storage
async function getPendingFileSaves() {
    // Implementation for retrieving pending saves from IndexedDB
    return [];
}

async function removePendingFileSave(id) {
    // Implementation for removing completed saves from IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge.png',
        tag: data.tag || 'ce-hub-notification',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action) {
        // Handle notification action
        handleNotificationAction(event.action, event.notification.data);
    } else {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

function handleNotificationAction(action, data) {
    switch (action) {
        case 'open-file':
            clients.openWindow(`/#files?file=${encodeURIComponent(data.filename)}`);
            break;
        case 'view-changes':
            clients.openWindow(`/#editor?changes=${data.changeId}`);
            break;
        default:
            clients.openWindow('/');
    }
}

// Share target handling
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname === '/' && url.searchParams.has('share-target')) {
        event.respondWith(handleShareTarget(event.request));
    }
});

async function handleShareTarget(request) {
    const url = new URL(request.url);
    const title = url.searchParams.get('title') || '';
    const text = url.searchParams.get('text') || '';
    const sharedUrl = url.searchParams.get('url') || '';

    // Create a new file with shared content
    const content = `# Shared Content\n\n**Title:** ${title}\n\n**Text:**\n${text}\n\n**URL:** ${sharedUrl}\n`;

    // Store in IndexedDB for processing when app opens
    await storeSharedContent({
        title,
        text,
        url: sharedUrl,
        content,
        timestamp: Date.now()
    });

    // Return response that opens the app
    return Response.redirect('/?shared=true', 302);
}

async function storeSharedContent(content) {
    // Implementation for storing shared content in IndexedDB
    console.log('Storing shared content:', content);
}

console.log('Service Worker: Script loaded');