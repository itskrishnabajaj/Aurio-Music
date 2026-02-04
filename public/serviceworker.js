// Aurio Service Worker - v2.1 (Auth Fix)
const CACHE_NAME = 'aurio-v2.1';
const RUNTIME_CACHE = 'aurio-runtime-v2.1';

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/firebase.js',
  '/cloudinary.js',
  '/auth-module.js',
  '/auth-styles.css',
  '/manifest.json',
  '/admin.html',
  '/admin.css',
  '/admin.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch(err => console.error('❌ Cache failed:', err))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests except Firebase and Cloudinary
  if (url.origin !== location.origin && 
      !url.origin.includes('firebase') && 
      !url.origin.includes('cloudinary') &&
      !url.origin.includes('googleapis')) {
    return;
  }

  // CRITICAL: Never cache Firebase Auth requests
  // This prevents login loop issues on mobile
  if (url.pathname.includes('firebasedatabase') || 
      url.pathname.includes('googleapis') ||
      url.pathname.includes('identitytoolkit') ||
      url.pathname.includes('securetoken') ||
      url.pathname.includes('identitytoolkit.googleapis.com') ||
      url.pathname.includes('securetoken.googleapis.com') ||
      url.href.includes('firebaseapp.com/__/auth') ||
      url.href.includes('accounts.google.com') ||
      url.href.includes('www.googleapis.com/identitytoolkit') ||
      url.href.includes('www.googleapis.com/securetoken')) {
    // Always fetch from network, never cache
    event.respondWith(fetch(request));
    return;
  }

  // Cache first for static assets
  if (request.destination === 'image' || 
      request.destination === 'audio' ||
      request.url.includes('cloudinary')) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;
          
          return fetch(request).then(response => {
            // Clone and cache the response
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
            return response;
          });
        })
        .catch(() => {
          // Fallback for images
          if (request.destination === 'image') {
            return new Response(
              '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#333"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="#666">♪</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        })
    );
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;
          
          // Fallback for HTML pages
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background sync for play counts
self.addEventListener('sync', event => {
  if (event.tag === 'sync-play-counts') {
    event.waitUntil(syncPlayCounts());
  }
});

async function syncPlayCounts() {
  console.log('🔄 Syncing play counts...');
  // Implement play count syncing logic
}

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    const { url } = event.data;
    caches.open(RUNTIME_CACHE).then(cache => {
      cache.add(url);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ status: 'Cache cleared' });
    });
  }
});

// Push notifications (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
