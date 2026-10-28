const CACHE_NAME = 'cyberlingo-arcade-v1.0.0';
const CORE_ASSETS = [
  './',
  './index.html',
  './core_lingo_bank.js',
  './daily_timeline_data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first for daily_timeline.json so daily 17:30 lessons always stay fresh
  if (url.pathname.endsWith('daily_timeline.json')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for MP3 audio (supports offline replay after hearing once)
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

  // Stale-while-revalidate for app shell
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((netRes) => {
          if (netRes && netRes.status === 200) {
            const copy = netRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return netRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
