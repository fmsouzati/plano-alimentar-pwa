const CACHE_NAME = "plano-alimentar-v1";

const arquivosParaCache = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(arquivosParaCache))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});