/* Mera Wakeel AI — Service Worker (PWA / offline support)
 * Cache strategy:
 *  - App shell (navigation): network-first with cache fallback (offline)
 *  - Static assets (hashed JS/CSS/images): stale-while-revalidate
 *  - API calls (fetch to /api/*): network-only (never cache sensitive data)
 */

const CACHE_NAME = 'mera-wakeel-shell-v2';
const SHELL_CACHE_NAME = 'mera-wakeel-static-v2';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/hero-advocate.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== SHELL_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // NEVER cache API / analytics / webhook endpoints (privacy + freshness)
  if (url.pathname.startsWith('/api/')) return;

  // For extension/unknown requests fall through to network
  const isNavigation = request.mode === 'navigate';

  event.respondWith(
    (async () => {
      // NAVIGATION: network-first, fall back to cached shell for offline/3G
      if (isNavigation) {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match('/index.html');
          if (shell) return shell;
          throw err;
        }
      }

      // STATIC ASSETS: stale-while-revalidate
      const cache = await caches.open(SHELL_CACHE_NAME);
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((resp) => {
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        })
        .catch(() => null);

      if (cached) { return cached; }
      const network = await networkPromise;
      if (network) return network;
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })()
  );
});

// Allow the page to tell the SW to update (used after a new build)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});
