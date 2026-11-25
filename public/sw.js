// Service worker: guarda la app para que la versión web también funcione sin internet.
const CACHE = 'laplace-v1';
const FILES = [
  './', 'index.html', 'css/styles.css', 'css/theme.css', 'vendor/fonts.css', 'vendor/katex.min.js',
  'js/lp-core.js', 'js/ejercicios.js', 'js/app.js', 'manifest.webmanifest', 'img/icon.svg', 'img/icon-192.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  // Red primero (para ver cambios), caché si no hay internet.
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
