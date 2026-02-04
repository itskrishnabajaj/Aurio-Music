// Aurio Service Worker - v2.0
const CACHE_NAME = 'aurio-v2';
const RUNTIME_CACHE = 'aurio-runtime-v2';

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/firebase.js',
  '/cloudinary.js',
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

  // Skip cross-origin requests
  if (url.origin !== location.origin && 
      !url.origin.includes('firebase') && 
      !url.origin.includes('cloudinary')) {
    return;
  }

  // Network first for API calls
  if (url.pathname.includes('firebasedatabase') || 
      url.pathname.includes('googleapis')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
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
              '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#333"/></svg>',
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
  // This would sync any offline play counts
  // For now, just log
  console.log('🔄 Syncing play counts...');
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
});
