const CACHE_NAME = "plano-alimentar-v4";

const arquivosParaCache = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./manifest.json"
];


// ======================================================
// INSTALAÇÃO
// ======================================================

self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(arquivosParaCache);
            })
    );
});


// ======================================================
// ATIVAÇÃO
// ======================================================

self.addEventListener("activate", event => {

    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {

                return Promise.all(
                    cacheNames.map(cacheName => {

                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }

                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});


// ======================================================
// REQUISIÇÕES
// ======================================================

self.addEventListener("fetch", event => {

    const request = event.request;

    const url = new URL(request.url);

    // Ignora requisições que não sejam HTTP ou HTTPS
    if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
    ) {
        return;
    }


    event.respondWith(

        fetch(request)

            .then(response => {

                // Só cacheia respostas válidas
                if (
                    !response ||
                    response.status !== 200 ||
                    response.type === "opaque"
                ) {
                    return response;
                }

                const copia = response.clone();

                caches
                    .open(CACHE_NAME)
                    .then(cache => {
                        cache.put(
                            request,
                            copia
                        );
                    });

                return response;
            })

            .catch(() => {

                return caches.match(
                    request
                );

            })

    );
});