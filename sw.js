const CACHE = "gaman-chokin-v3.1.0";
const ASSETS = [
  "./",
  "./index.html",
  "./legal.html",
  "./styles.css?v=3.1.0",
  "./forest.js?v=3.1.0",
  "./games.js?v=3.1.0",
  "./chess.js?v=3.1.0",
  "./games-board.js?v=3.1.0",
  "./games-action.js?v=3.1.0",
  "./app.js?v=3.1.0",
  "./manifest.webmanifest",
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("gaman-chokin-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ページはネット優先（更新をすぐ届ける）、オフラインならキャッシュ
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            const key = url.pathname.endsWith("legal.html") ? "./legal.html" : "./index.html";
            caches.open(CACHE).then((cache) => cache.put(key, copy));
          }
          return res;
        })
        .catch(() => caches.match(url.pathname.endsWith("legal.html") ? "./legal.html" : "./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // それ以外はキャッシュ優先＋裏で更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
