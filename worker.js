import webpush from "web-push";

export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        };

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        if (
            url.pathname === "/" &&
            request.method === "GET"
        ) {
            return Response.json({
                status: "ok",
                app: "plano-alimentar-push",
                message: "Backend ativo"
            });
        }

        if (
            url.pathname === "/subscribe" &&
            request.method === "POST"
        ) {

            const subscription =
                await request.json();

            if (
                !subscription ||
                !subscription.endpoint
            ) {
                return Response.json(
                    {
                        error: "Assinatura inválida"
                    },
                    {
                        status: 400
                    }
                );
            }

            const chave =
                await gerarHash(
                    subscription.endpoint
                );

            await env
                .PUSH_SUBSCRIPTIONS
                .put(
                    chave,
                    JSON.stringify(
                        subscription
                    )
                );

            return Response.json(
                {
                    status: "ok",
                    message:
                        "Assinatura salva com sucesso",
                    id: chave
                },
                {
                    status: 201
                }
            );
        }

        if (
            url.pathname === "/send-test" &&
            request.method === "POST"
        ) {

            webpush.setVapidDetails(
                env.VAPID_SUBJECT,
                env.VAPID_PUBLIC_KEY,
                env.VAPID_PRIVATE_KEY
            );

            const lista =
                await env
                    .PUSH_SUBSCRIPTIONS
                    .list();

            if (
                lista.keys.length === 0
            ) {
                return Response.json(
                    {
                        error:
                            "Nenhuma assinatura cadastrada"
                    },
                    {
                        status: 404
                    }
                );
            }

            const resultados = [];

            for (
                const item of lista.keys
            ) {

                const valor =
                    await env
                        .PUSH_SUBSCRIPTIONS
                        .get(item.name);

                if (!valor) {
                    continue;
                }

                const subscription =
                    JSON.parse(valor);

                try {

                    await webpush
                        .sendNotification(
                            subscription,
                            JSON.stringify({
                                title:
                                    "Meu Plano Alimentar",
                                body:
                                    "Push real funcionando no iPhone ✅"
                            })
                        );

                    resultados.push({
                        id: item.name,
                        status: "enviado"
                    });

                } catch (erro) {

                    resultados.push({
                        id: item.name,
                        status: "erro",
                        erro:
                            erro.message
                    });
                }
            }

            return Response.json({
                status: "ok",
                resultados
            });
        }

        return Response.json(
            {
                error:
                    "Rota não encontrada"
            },
            {
                status: 404
            }
        );
    }
};


async function gerarHash(texto) {

    const dados =
        new TextEncoder()
            .encode(texto);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            dados
        );

    return Array.from(
        new Uint8Array(hashBuffer)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}