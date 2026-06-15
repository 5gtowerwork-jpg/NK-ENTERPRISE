// NK ENT - Service Worker
// Bump CACHE_NAME version whenever index.html / assets change to force refresh.
const CACHE_NAME = 'nk-ent-cache-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, fall back to network,
// and dynamically cache third-party assets (e.g. PDF library) for offline use.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached - if it's a navigation request, fall back to index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return cached;
        });
    })
  );
});
