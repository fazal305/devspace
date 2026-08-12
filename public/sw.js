// Hand-written service worker (no vite-plugin-pwa) so the caching mechanics
// stay visible rather than hidden behind generated config.
//
// Strategy:
//  - App shell (/, index.html, favicon) is precached on install.
//  - Navigations: network-first, falling back to the cached shell when offline.
//  - Same-origin built assets (hashed JS/CSS/fonts): cache-first, populated
//    lazily on first successful fetch (stale-while-revalidate-lite) — this
//    means a single online visit is enough to make the next load fully
//    offline-capable, without needing a build-time asset manifest.
//
// IndexedDB data is never touched here — the app stays usable offline purely
// because projects/files/snippets already live client-side.

const SHELL_CACHE = "devspace-shell-v1";
const RUNTIME_CACHE = "devspace-runtime-v1";
const SHELL_URLS = ["/", "/index.html", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
