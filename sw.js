const CACHE_PREFIX = 'cyberlingo-arcade-';
const CACHE_NAME = CACHE_PREFIX + 'v4.1.1-streak';
const CORE_ASSETS = [
  './',
  './index.html',
  './core_lingo_bank.js',
  './daily_timeline_data.js',
  './arcade_core_v4.js',
  './games_v2_extra.js',
  './games_v3_top10.js',
  './cyber_streak_engine.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Do NOT swallow failures silently: a partial precache must be visible
      // in the console, otherwise the app can ship with an empty offline cache.
      cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Precache incomplete:', err);
      })
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      // Only evict OUR old versions. This origin also hosts other PWAs
      // (e.g. cyberbird-lingo), whose caches must survive our activation.
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(url.href);
        if (cached) return cached;
        try {
          const netRes = await fetch(url.href, { mode: 'cors' });
          if (netRes && netRes.status === 200) {
            cache.put(url.href, netRes.clone()).catch(() => {});
          }
          return netRes;
        } catch (err) {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((netRes) => {
        if (netRes && netRes.status === 200) {
          const copy = netRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return netRes;
      })
      .catch(() => caches.match(req))
  );
});
