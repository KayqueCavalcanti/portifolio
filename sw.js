const CACHE_NAME = 'kc-portfolio-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './translations.js',
  './manifest.json',
  './favicon.svg',
  './perfil.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

// Estratégia: cache-first para assets locais, com atualização em segundo
// plano (stale-while-revalidate). Navegações offline caem no index.html
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match('./index.html');
          return cached;
        });

      return cached || network;
    })
  );
});
