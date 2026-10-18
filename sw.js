/* Smart Remplacement — service worker (hors ligne)
   Pour forcer la mise à jour chez tous les utilisateurs : changez simplement VERSION. */
const VERSION = 'sr-v5';
const SHELL = VERSION + '-shell';
const LIB = 'sr-libs'; /* moteur de lecture des numéros (Tesseract) : conservé entre les versions */

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(['./', './index.html']))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== LIB).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* 1) La page de l'application : réseau d'abord (nouvelle version dès qu'il y a Internet),
        sinon la copie enregistrée (fonctionne sur le terrain sans réseau). */
  if (url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html'))) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put('./index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  /* 2) Moteur de lecture des numéros (jsDelivr / Tesseract) : copie locale après le premier chargement. */
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'tessdata.projectnaptha.com') {
    e.respondWith(
      caches.open(LIB).then(c =>
        c.match(req).then(hit => hit || fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }
  /* 3) Tout le reste (fonds de carte, etc.) : inchangé, géré par l'application elle-même. */
});
