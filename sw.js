const CACHE_NAME = 'mjc-conect-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://raw.githubusercontent.com/GealFox/App-MJC-Conect/refs/heads/main/MJC-Logo.png',
  'https://raw.githubusercontent.com/GealFox/App-MJC-Conect/refs/heads/main/icon-192.png',
  'https://raw.githubusercontent.com/GealFox/App-MJC-Conect/refs/heads/main/icon-512.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Instalar Service Worker y guardar recursos esenciales en caché
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

// Interceptar peticiones: Si no hay red, sirve el index.html en memoria
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Manejo especial para peticiones de navegación de página (modo offline)
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }

  // Para imágenes y recursos estáticos: Cache First con respaldo en Red
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
