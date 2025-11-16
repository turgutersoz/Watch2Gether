/**
 * Service Worker for WatchTogether
 * Provides offline support and asset caching
 */

const CACHE_NAME = 'watchtogether-v1';
const RUNTIME_CACHE = 'watchtogether-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add each asset individually to handle missing files gracefully
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((error) => {
            console.warn(`Failed to cache ${url}:`, error);
            return null; // Continue even if one file fails
          })
        )
      );
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip WebSocket and Socket.io requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.pathname.includes('/socket.io/')) {
    return;
  }

  // Skip unsupported schemes (chrome-extension, moz-extension, data, blob, etc.)
  const unsupportedSchemes = ['chrome-extension:', 'moz-extension:', 'data:', 'blob:', 'file:'];
  if (unsupportedSchemes.some(scheme => url.protocol.startsWith(scheme))) {
    return; // Let the browser handle these requests normally
  }

  // Only cache http/https requests
  const isCacheableScheme = url.protocol === 'http:' || url.protocol === 'https:';
  
  // Skip external domains that might not be cacheable (optional - for Cloudflare, analytics, etc.)
  const skipExternalDomains = [
    'static.cloudflareinsights.com',
    'www.google-analytics.com',
    'www.googletagmanager.com'
  ];
  const shouldSkipExternal = skipExternalDomains.some(domain => url.hostname.includes(domain));

  // Cache strategy: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache successful responses (only for cacheable schemes and not external domains)
        if (response.status === 200 && isCacheableScheme && !shouldSkipExternal) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache).catch((error) => {
              // Silently fail if cache.put fails (e.g., for unsupported schemes)
              console.warn('Cache put failed:', error);
            });
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If it's a navigation request, return the index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // Otherwise return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Background sync for offline actions (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // Sync offline messages when back online
      Promise.resolve()
    );
  }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Watch Together';
  const options = {
    body: data.body || 'Yeni bildirim',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

