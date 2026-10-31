// Kastkeur service worker: app werkt offline, updates komen automatisch binnen.
const VERSIE = "kastkeur-v4";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];
const CDN = ["https://cdnjs.cloudflare.com/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  // Bibliotheken en lettertypen: eerst uit de cache
  if (CDN.some(p => url.startsWith(p))) {
    e.respondWith(caches.open(VERSIE).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res;
    }));
    return;
  }
  // Eigen bestanden: eerst het netwerk (nieuwste versie), anders de cache
  if (new URL(url).origin === self.location.origin) {
    e.respondWith(fetch(req).then(res => { if (res.ok) caches.open(VERSIE).then(c => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  }
});
