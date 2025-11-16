/**
 * Service Worker for WatchTogether
 * Provides offline support and asset caching
 */

const CACHE_NAME = 'watchtogether-v2';
const RUNTIME_CACHE = 'watchtogether-runtime-v2';

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
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    // Invalid URL, skip
    return;
  }

  // Skip WebSocket and Socket.io requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.pathname.includes('/socket.io/')) {
    return;
  }

  // Skip unsupported schemes (chrome-extension, moz-extension, data, blob, etc.)
  // Check BEFORE any cache operations
  const unsupportedSchemes = ['chrome-extension:', 'moz-extension:', 'data:', 'blob:', 'file:'];
  if (unsupportedSchemes.some(scheme => url.protocol.startsWith(scheme))) {
    return; // Let the browser handle these requests normally - don't intercept
  }

  // Only cache http/https requests from same origin
  const isCacheableScheme = url.protocol === 'http:' || url.protocol === 'https:';
  const isSameOrigin = url.origin === self.location.origin;
  
  // Skip external domains that might not be cacheable (optional - for Cloudflare, analytics, etc.)
  const skipExternalDomains = [
    'static.cloudflareinsights.com',
    'www.google-analytics.com',
    'www.googletagmanager.com'
  ];
  const shouldSkipExternal = skipExternalDomains.some(domain => url.hostname.includes(domain));

  // If not cacheable, just fetch normally without intercepting
  if (!isCacheableScheme || !isSameOrigin || shouldSkipExternal) {
    return; // Let browser handle normally
  }

  // Cache strategy: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200 && response.type === 'basic') {
          // Clone the response before caching
          const responseToCache = response.clone();

          // Cache in background (don't wait for it)
          caches.open(RUNTIME_CACHE).then((cache) => {
            // Double-check the request is cacheable before putting
            try {
              const requestUrl = new URL(request.url);
              if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
                cache.put(request, responseToCache).catch((error) => {
                  // Silently fail if cache.put fails
                  // This can happen for various reasons (CORS, unsupported schemes, etc.)
                });
              }
            } catch (error) {
              // Invalid URL or other error, skip caching
            }
          }).catch(() => {
            // Cache open failed, ignore
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

