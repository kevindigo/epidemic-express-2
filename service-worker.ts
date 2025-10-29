/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'epidemic-express-v2.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/manifest.json',
  
  // Game images
  '/assets/images/avian.png',
  '/assets/images/swine.png',
  '/assets/images/sars.png',
  '/assets/images/smallpox.png',
  '/assets/images/ebola.png',
  '/assets/images/panic.png',
  '/assets/images/medic.png',
  '/assets/images/researcher.png',
  '/assets/images/prexpert.png',
  '/assets/images/scientist.png',
  '/assets/images/epidemiologist.png',
  '/assets/images/bioterrorist.png',
  '/assets/images/shot.png',
  '/assets/images/lost.png',
  '/assets/images/checkmark.png',
  '/assets/images/board.png'
];

// Install event - cache all required assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return undefined;
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Handle navigation requests (HTML pages) by serving index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then((response) => {
          return response || fetch('/index.html');
        })
    );
    return;
  }
  
  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});