// Basic Service Worker for caching static assets and pages.
// Place this file at repo root (/) so scope covers the whole site.

const CACHE_NAME = 'devanalytics-static-v1';
const OFFLINE_PAGE = '/offline.html'; // optional: implement an offline.html in your site if desired

// Files to pre-cache - add or remove as appropriate
const PRECACHE_URLS = [
  '/', // root
  '/index.html',
  '/style.css',
  '/script.js',
  // add other critical assets or logos you want cached by default
];

// Install - precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => { /* ignore addAll failures */ });
    }).then(() => self.skipWaiting())
  );
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (k !== CACHE_NAME) return caches.delete(k);
    }))).then(() => self.clients.claim())
  );
});

// Fetch - network-first for navigation, cache-first for images/static
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // For navigation requests, try network then fallback to cache/offline page
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => {
        return caches.match(req).then((cached) => cached || caches.match(OFFLINE_PAGE) || new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  // For images and static assets: cache-first
  if (req.destination === 'image' || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => cached || new Response('', { status: 404 })))
    );
    return;
  }

  // default: try network then cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});