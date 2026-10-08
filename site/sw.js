// AJ Class A — offline-first service worker (app shell + data stay available offline)
var CACHE = 'aj-class-a-v1';
var CORE = ['./', './index.html', './css/app.css', './manifest.webmanifest', './icon.svg',
  './js/core.js','./js/auth.js','./js/router.js','./js/views.js','./js/views2.js',
  './js/community.js','./js/ai.js','./js/admin.js','./js/fbsync.js'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // AI/Firebase pass through
  e.respondWith(caches.match(e.request).then(function(hit){
    var net = fetch(e.request).then(function(res){
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
      return res;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
