/* W-Envelope Cute v21: only cache same-origin static assets, never Firebase data or auth. */
const CACHE='wenv-static-v21.0';
const CORE=['./','./index.html','./manifest.webmanifest','./assets/pwa-192.png','./assets/pwa-512.png','./css/style.css','./css/v21-enhancements.css','./js/app.js','./js/anonymous.js','./js/pwa.js'];
self.addEventListener('install',evt=>{
 evt.waitUntil(caches.open(CACHE).then(async c=>{for(const url of CORE){try{await c.add(new Request(url,{cache:'reload'}));}catch(e){/* Some static files may not be available during initial install. */}}}));self.skipWaiting();
});
self.addEventListener('activate',evt=>evt.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('wenv-static-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',evt=>{
 const req=evt.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   evt.respondWith(fetch(req).catch(async()=>await caches.match('./index.html')||Response.error()));return;
 }
 if(!/\.(?:js|css|png|jpe?g|webp|svg|webmanifest|ico)$/i.test(url.pathname))return;
 evt.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(req)));
});
