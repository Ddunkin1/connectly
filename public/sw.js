const CACHE_NAME = 'connectly-shell-v2';

// App shell resources to cache on install
const SHELL_URLS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip API calls, non-GET, cross-origin (Vite dev server on :5174, etc.)
    if (request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/')) return;
    if (url.origin !== self.location.origin) return; // never cache Vite dev server assets

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                // Only cache the HTML app shell, not JS/CSS (Vite manages those)
                if (
                    response.ok &&
                    (request.destination === 'document' ||
                        url.pathname === '/' ||
                        url.pathname === '/manifest.json')
                ) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
