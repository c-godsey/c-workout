// C-Workout service worker — caches the app shell for offline use.
// Bump CACHE_NAME whenever you deploy a new version so old caches get cleared.
const CACHE_NAME='c-workout-v1';
const APP_SHELL=[
  './',
  './c-workout.html',
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const isSameOrigin=url.origin===self.location.origin;
  const isGoogleFonts=url.origin==='https://fonts.googleapis.com'||url.origin==='https://fonts.gstatic.com';
  // Only handle the app shell + fonts. Everything else (YouTube, GitHub API, CDN chart libs, etc.)
  // passes straight through to the network untouched — never intercept those.
  if(!isSameOrigin&&!isGoogleFonts)return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise=fetch(e.request).then(networkRes=>{
        if(networkRes&&networkRes.status===200){
          const clone=networkRes.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(e.request,clone)).catch(()=>{});
        }
        return networkRes;
      }).catch(()=>cached);
      return cached||fetchPromise;
    })
  );
});
