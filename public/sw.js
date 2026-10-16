/* global self, caches, fetch, Response, URL */

const CACHE_NAME = "cofeed-shell-v3";
const APP_SHELL = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function putInCache(request, response) {
  if (response.ok) {
    const responseCopy = response.clone();
    void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
  }
  return response;
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() =>
      caches
        .match(request)
        .then((cachedResponse) => cachedResponse ?? caches.match("/"))
        .then((cachedResponse) => cachedResponse ?? Response.error()),
    );
}

function cacheFirst(request) {
  return caches
    .match(request)
    .then(
      (cachedResponse) =>
        cachedResponse ??
        fetch(request).then((response) => putInCache(request, response)),
    );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
  }
});
