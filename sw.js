// Service Worker for CE-Hub Pro Mobile Push Notifications
const CACHE_NAME = 'ce-hub-pro-v3';
const API_BASE_URL = 'http://100.95.223.19:8107';

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching essential files');
                return cache.addAll([
                    '/',
                    '/mobile-pro-v3-fixed.html',
                    // Add other essential files if needed
                ]);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('📬 Service Worker: Push message received');

    let notificationData = {
        title: 'CE-Hub Pro',
        body: 'You have a new notification',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23ffa657"/><text x="50" y="65" text-anchor="middle" font-size="40" fill="%23000">🤖</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="10" fill="%23ff0000"/></svg>',
        tag: 'ce-hub-notification',
        requireInteraction: false,
        silent: false
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
            console.log('📨 Service Worker: Push notification data:', data);
        } catch (error) {
            console.error('❌ Service Worker: Error parsing push data:', error);
            notificationData.body = event.data.text() || 'New notification from CE-Hub';
        }
    }

    const notificationOptions = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        silent: notificationData.silent,
        actions: [
            {
                action: 'open',
                title: 'Open CE-Hub'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: {
            url: '/mobile-pro-v3-fixed.html',
            timestamp: Date.now()
        },
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationOptions)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Service Worker: Notification clicked', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        console.log('👋 Service Worker: Notification dismissed');
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url.includes('mobile-pro-v3-fixed.html') && 'focus' in client) {
                        console.log('🎯 Service Worker: Focusing existing client');
                        return client.focus();
                    }
                }

                // Open new window if no existing one found
                if (clients.openWindow) {
                    console.log('🆕 Service Worker: Opening new client window');
                    return clients.openWindow('/mobile-pro-v3-fixed.html');
                }
            })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Service Worker: Notification closed', event);
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    console.log('📦 Service Worker: Serving from cache:', event.request.url);
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response since it can only be consumed once
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                console.log('💾 Service Worker: Caching new response:', event.request.url);
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('❌ Service Worker: Fetch failed:', error);
                        // You could return a custom offline page here
                    });
            })
    );
});

// Background sync for messages (optional enhancement)
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: Background sync triggered', event);

    if (event.tag === 'claude-message') {
        event.waitUntil(syncClaudeMessages());
    }
});

// Function to sync Claude messages (placeholder for future enhancement)
async function syncClaudeMessages() {
    try {
        console.log('🤖 Service Worker: Syncing Claude messages...');
        // Add message syncing logic here if needed
    } catch (error) {
        console.error('❌ Service Worker: Error syncing messages:', error);
    }
}

// Handle subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('🔄 Service Worker: Push subscription changed', event);

    event.waitUntil(
        self.registration.pushManager.getSubscription()
            .then((subscription) => {
                if (!subscription) {
                    console.log('❌ Service Worker: No subscription found');
                    return;
                }

                // Send new subscription to server
                return fetch(`${API_BASE_URL}/api/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        subscription: subscription.toJSON()
                    })
                });
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to update subscription on server');
                }
                console.log('✅ Service Worker: Subscription updated on server');
            })
            .catch((error) => {
                console.error('❌ Service Worker: Error updating subscription:', error);
            })
    );
});