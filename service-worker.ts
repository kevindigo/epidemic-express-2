/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Dynamic cache name with version for automatic cache management
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `epidemic-express-${CACHE_VERSION}`;

// Base path detection for different deployment scenarios
const getBasePath = () => {
  if (self.location.pathname.startsWith('/epidemic-express-2/')) {
    return '/epidemic-express-2/';
  }
  return '/';
};

const basePath = getBasePath();

const urlsToCache = [
  basePath,
  `${basePath}index.html`,
  `${basePath}styles.css`,
  `${basePath}main.js`,
  `${basePath}manifest.json`,
  
  // Game images
  `${basePath}assets/images/avian.png`,
  `${basePath}assets/images/swine.png`,
  `${basePath}assets/images/sars.png`,
  `${basePath}assets/images/smallpox.png`,
  `${basePath}assets/images/ebola.png`,
  `${basePath}assets/images/panic.png`,
  `${basePath}assets/images/medic.png`,
  `${basePath}assets/images/researcher.png`,
  `${basePath}assets/images/prexpert.png`,
  `${basePath}assets/images/scientist.png`,
  `${basePath}assets/images/epidemiologist.png`,
  `${basePath}assets/images/bioterrorist.png`,
  `${basePath}assets/images/shot.png`,
  `${basePath}assets/images/lost.png`,
  `${basePath}assets/images/checkmark.png`,
  `${basePath}assets/images/board.png`
];

// Install event - cache all required assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('Service Worker: Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match our current version
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          console.log('Service Worker: Keeping cache:', cacheName);
          return undefined;
        })
      );
    }).then(() => {
      // Claim all clients to ensure service worker controls them immediately
      console.log('Service Worker: Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // For navigation requests, use network-first strategy
  // This ensures fresh content loads on first visit
  if (request.mode === 'navigate') {
    console.log('Service Worker: Handling navigation request:', request.url);
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          console.log('Service Worker: Navigation network fetch succeeded');
          // Cache the fresh response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('Service Worker: Navigation network fetch failed, using cache:', error);
          // Network failed, serve index.html from cache
          // Handle both deployment scenarios
          if (location.pathname.startsWith('/epidemic-express-2/')) {
            return caches.match('/epidemic-express-2/index.html');
          } else {
            return caches.match('/index.html');
          }
        })
    );
    return;
  }
  
  // For JavaScript files, use network-first to ensure latest code
  if (request.url.includes('.js')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // For all other requests (images, CSS, etc.), use cache-first with network update
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          // Update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              }
            })
            .catch(() => {
              // Ignore network errors for background updates
            });
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed and not in cache
            // For HTML requests, fall back to index.html
            if (request.headers.get('accept')?.includes('text/html')) {
              if (self.location.pathname.startsWith('/epidemic-express-2/')) {
                return caches.match('/epidemic-express-2/index.html');
              } else {
                return caches.match('/index.html');
              }
            }
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
      })
  );
});