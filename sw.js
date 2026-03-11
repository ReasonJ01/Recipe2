const CACHE = 'recipe-pwa-v1';
const CORE = ['/', '/index.html', '/styles.css', '/src/app.mjs', '/src/recipe-parser.mjs', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, clone));
      return res;
    }))
  );
});
