const CACHE_PREFIX = "nbs-pwa";
const CACHE_VERSION = "v2";
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/nbs-icon.svg",
  "/icons/nbs-icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      await cache.addAll(PRECACHE_URLS);
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== PAGE_CACHE &&
              key !== ASSET_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(cacheFirstPage(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  event.respondWith(networkFallingBackToCache(request));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    updatePageCache(request, cache);
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    // fall through
  }
  const fallback = await cache.match("/offline.html");
  if (fallback) return fallback;
  return offlineResponse();
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (
    response &&
    response.status === 200 &&
    (response.type === "basic" || response.type === "cors")
  ) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFallingBackToCache(request) {
  try {
    const response = await fetch(request);
    if (
      response &&
      response.status === 200 &&
      response.type === "basic"
    ) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    return offlineResponse();
  }
}

function updatePageCache(request, cache) {
  fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
    })
    .catch(() => {});
}

function offlineResponse() {
  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  });
}
