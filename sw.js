const VER='sr-v5',CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=VER&&x.startsWith('sr-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!='GET')return;
  const u=new URL(r.url);
  if(r.mode=='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(VER).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html').then(h=>h||caches.match('./'))));return}
  if(u.origin==location.origin||u.hostname=='fonts.googleapis.com'||u.hostname=='fonts.gstatic.com'||u.hostname=='unpkg.com'){
    e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{if(res.ok||res.type=='opaque'){const cp=res.clone();caches.open(VER).then(c=>c.put(r,cp))}return res}).catch(()=>h)));
  }
});
