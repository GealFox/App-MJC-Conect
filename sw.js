const CACHE_NAME = 'mjc-conect-v1';
const ASSETS = [
  './',
  './mjc-conect.html',
  './manifest.json',
  'https://raw.githubusercontent.com/GealFox/App-MJC-Conect/refs/heads/main/MJC-Logo.png',
  'https://raw.githubusercontent.com/GealFox/App-MJC-Conect/refs/heads/main/icon-192.png',
  'https://raw.githubusercontent.com/GealFox/App-MJC-Conect/refs/heads/main/icon-512.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Instalar Service Worker y guardar recursos esenciales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Network First con respaldo en Caché para solicitudes GET
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});
