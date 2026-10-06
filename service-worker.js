const CACHE_NAME = "plano-alimentar-v6";

const arquivosParaCache = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(arquivosParaCache))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames =>
                Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                if (
                    !response ||
                    response.status !== 200 ||
                    response.type === "opaque"
                ) {
                    return response;
                }

                const copia = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, copia);
                });

                return response;
            })
            .catch(() => caches.match(request))
    );
});

self.addEventListener("push", event => {
    let dados = {
        title: "Meu Plano Alimentar",
        body: "Você tem um novo lembrete.",
        tag: `plano-${Date.now()}`
    };

    if (event.data) {
        try {
            dados = {
                ...dados,
                ...event.data.json()
            };
        } catch {
            dados.body = event.data.text();
        }
    }

    const opcoes = {
        body: dados.body,
        icon: "./icons/icon-192.png",
        badge: "./icons/icon-192.png",
        tag: dados.tag || `plano-${Date.now()}`,
        data: {
            url: "./"
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            dados.title || "Meu Plano Alimentar",
            opcoes
        )
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if ("focus" in client) {
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow("./");
                }
            })
    );
});
