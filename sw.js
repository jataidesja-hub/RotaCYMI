/* ============================================================================
 * ROTA CYMI - SERVICE WORKER (PWA OFFLINE COMPLETO: APP SHELL + MAPA + ROTAS)
 * ============================================================================ */

const CACHE_NAME = 'rotacymi-pwa-v1.14.0';
const RUNTIME_CACHE = 'rotacymi-runtime-v1.14.0';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !allowedCaches.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Chamadas de leitura/escrita da API Google Apps Script são tratadas pela fila Offline no app.js
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('script.googleusercontent.com')
  ) {
    return;
  }

  // Cache dinâmico (Stale-While-Revalidate / Cache-Fallback) para Bibliotecas CDN, Fontes, Tiles do Mapa (Carto/Esri) e Geometrias OSRM para funcionar SEM INTERNET
  const isCacheableExternal =
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('project-osrm.org');

  if (isCacheableExternal) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const cloned = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // Estratégia Network-First com fallback imediato para Cache nos arquivos principais da aplicação
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin
        ) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
