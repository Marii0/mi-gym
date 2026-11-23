/* Service worker: hace que la app abra y funcione sin internet.
   - El código de la app se guarda al instalarla (caché "gym-app-<VERSION>").
   - Las fotos se guardan aparte ("gym-img-v1") para no volver a bajarlas en cada actualización.
   IMPORTANTE: cuando cambies cualquier archivo de la app, sube el número de VERSION
   para que los teléfonos descarguen la versión nueva. */
const VERSION = 'v1';
const APP = 'gym-app-' + VERSION;
const FOTOS = 'gym-img-v1';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/config.js', 'js/exercises.js', 'js/generator.js', 'js/store.js', 'js/drive.js', 'js/audio.js', 'js/app.js',
  'fonts/barlow-condensed-latin-600-normal.woff2', 'fonts/barlow-condensed-latin-700-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(APP);
    await c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves.filter(k => k.startsWith('gym-app-') && k !== APP).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Google Drive y demás pasan directo
  const esFoto = u.pathname.indexOf('/img/') >= 0;
  e.respondWith((async () => {
    const c = await caches.open(esFoto ? FOTOS : APP);
    const guardado = await c.match(e.request, { ignoreSearch: true });
    if (guardado) return guardado;
    try {
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      if (e.request.mode === 'navigate') return (await c.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
