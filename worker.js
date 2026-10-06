import webpush from "web-push";

// ======================================================
// CONFIGURAÇÕES DO PLANO
// ======================================================

const DATA_INICIO_PLANO = "2026-10-05";
const DATA_FIM_PLANO = "2026-11-29";

const DURACAO_REFEICAO = 30;
const DURACAO_HIDRATACAO = 15;

// 0 = domingo | 1 = segunda | ... | 6 = sábado
const PLANO_REFEICOES = {
    1: ["05:50", "08:30", "12:30", "16:30", "20:00"],
    2: ["05:50", "08:30", "12:30", "16:30", "20:00"],
    3: ["05:50", "08:30", "12:30", "16:30", "20:00"],
    4: ["05:50", "08:30", "12:30", "16:30", "20:00"],
    5: ["05:50", "08:30", "12:30", "16:30", "20:30"],
    6: ["08:30", "12:30", "17:00", "20:30"],
    0: ["06:00", "09:00", "13:00", "16:30", "20:00"]
};

const PLANO_HIDRATACAO = [
    "05:45",
    "07:45",
    "10:00",
    "11:30",
    "14:30",
    "16:00",
    "19:30"
];

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

        if (url.pathname === "/" && request.method === "GET") {
            return Response.json({
                status: "ok",
                app: "plano-alimentar-push",
                message: "Backend ativo",
                ciclo: `${DATA_INICIO_PLANO} a ${DATA_FIM_PLANO}`
            });
        }

        if (url.pathname === "/subscribe" && request.method === "POST") {
            try {
                const subscription = await request.json();

                if (!subscription || !subscription.endpoint) {
                    return Response.json(
                        { error: "Assinatura inválida" },
                        { status: 400 }
                    );
                }

                const chave = await gerarHash(subscription.endpoint);

                await env.PUSH_SUBSCRIPTIONS.put(
                    chave,
                    JSON.stringify(subscription)
                );

                return Response.json(
                    {
                        status: "ok",
                        message: "Assinatura salva com sucesso",
                        id: chave
                    },
                    { status: 201 }
                );
            } catch (erro) {
                console.error("Erro ao salvar assinatura:", erro);

                return Response.json(
                    { error: "Erro ao salvar assinatura" },
                    { status: 500 }
                );
            }
        }

        if (url.pathname === "/send-test" && request.method === "POST") {
            const resultados = await enviarParaTodasAssinaturas(env, {
                title: "Meu Plano Alimentar",
                body: "Push manual funcionando ✅",
                tag: `teste-${Date.now()}`
            });

            return Response.json({
                status: "ok",
                resultados
            });
        }

        return Response.json(
            { error: "Rota não encontrada" },
            { status: 404 }
        );
    },

    async scheduled(controller, env, ctx) {
        try {
            const agora = obterHorarioBrasil(controller.scheduledTime);

            console.log("Cron:", agora);

            if (
                agora.data < DATA_INICIO_PLANO ||
                agora.data > DATA_FIM_PLANO
            ) {
                return;
            }

            const eventos = criarEventosDoDia(agora.diaSemanaNumero);
            const minutoAtual = agora.hora * 60 + agora.minuto;

            const eventosAgora = eventos.filter(
                evento => evento.minuto === minutoAtual
            );

            for (const evento of eventosAgora) {
                await processarEvento(env, agora, evento);
            }
        } catch (erro) {
            console.error("Erro no Cron:", erro);
        }
    }
};

// ======================================================
// EVENTOS DE REFEIÇÃO E HIDRATAÇÃO
// ======================================================

function criarEventosDoDia(diaSemana) {
    const eventos = [];
    const refeicoes = PLANO_REFEICOES[diaSemana] || [];

    refeicoes.forEach((horario, indice) => {
        const inicio = horarioParaMinutos(horario);
        const fim = inicio + DURACAO_REFEICAO;

        eventos.push({
            id: `refeicao-${indice}-pre`,
            minuto: inicio - 5,
            mensagem: {
                title: "🍽️ Refeição em 5 min",
                body: "Sua próxima refeição está chegando."
            }
        });

        eventos.push({
            id: `refeicao-${indice}-inicio`,
            minuto: inicio,
            mensagem: {
                title: "🍽️ Refeição",
                body: "Seu período de alimentação começou."
            }
        });

        eventos.push({
            id: `refeicao-${indice}-fim`,
            minuto: fim - 5,
            mensagem: {
                title: "⏳ Refeição",
                body: "Faltam 5 minutos para seu período de alimentação acabar."
            }
        });
    });

    PLANO_HIDRATACAO.forEach((horario, indice) => {
        const inicio = horarioParaMinutos(horario);
        const fim = inicio + DURACAO_HIDRATACAO;

        eventos.push({
            id: `hidratacao-${indice}-pre`,
            minuto: inicio - 5,
            mensagem: {
                title: "💧 Hidratação em 5 min",
                body: "Seu próximo período de hidratação está chegando."
            }
        });

        eventos.push({
            id: `hidratacao-${indice}-inicio`,
            minuto: inicio,
            mensagem: {
                title: "💧 Hidratação",
                body: "Seu período de hidratação começou."
            }
        });

        eventos.push({
            id: `hidratacao-${indice}-fim`,
            minuto: fim - 5,
            mensagem: {
                title: "⏳ Hidratação",
                body: "Faltam 5 minutos para seu período de hidratação acabar."
            }
        });
    });

    return eventos;
}

// ======================================================
// PROCESSAMENTO / ANTIDUPLICIDADE
// ======================================================

async function processarEvento(env, agora, evento) {
    const identificador = `notify:${agora.data}:${evento.id}`;

    const jaEnviado = await env.PUSH_SUBSCRIPTIONS.get(identificador);

    if (jaEnviado) {
        return;
    }

    const mensagem = {
        ...evento.mensagem,
        tag: identificador
    };

    const resultados = await enviarParaTodasAssinaturas(env, mensagem);

    const houveSucesso = resultados.some(
        resultado => resultado.status === "enviado"
    );

    if (houveSucesso) {
        await env.PUSH_SUBSCRIPTIONS.put(
            identificador,
            "1",
            {
                expirationTtl: 172800
            }
        );
    }
}

// ======================================================
// ENVIO WEB PUSH
// ======================================================

async function enviarParaTodasAssinaturas(env, mensagem) {
    webpush.setVapidDetails(
        env.VAPID_SUBJECT,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
    );

    const lista = await env.PUSH_SUBSCRIPTIONS.list();
    const resultados = [];

    for (const item of lista.keys) {
        if (item.name.startsWith("notify:")) {
            continue;
        }

        const valor = await env.PUSH_SUBSCRIPTIONS.get(item.name);

        if (!valor) {
            continue;
        }

        let assinatura;

        try {
            assinatura = JSON.parse(valor);
        } catch {
            continue;
        }

        if (!assinatura || !assinatura.endpoint) {
            continue;
        }

        try {
            await webpush.sendNotification(
                assinatura,
                JSON.stringify(mensagem)
            );

            resultados.push({
                id: item.name,
                status: "enviado"
            });
        } catch (erro) {
            console.error("Erro ao enviar push:", erro);

            resultados.push({
                id: item.name,
                status: "erro",
                erro: erro.message
            });

            if (erro.statusCode === 404 || erro.statusCode === 410) {
                await env.PUSH_SUBSCRIPTIONS.delete(item.name);
            }
        }
    }

    return resultados;
}

// ======================================================
// DATA / HORÁRIO DO BRASIL
// ======================================================

function obterHorarioBrasil(timestamp) {
    const data = new Date(timestamp);

    const formatador = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

    const partes = formatador.formatToParts(data);

    const pegar = tipo =>
        partes.find(item => item.type === tipo)?.value;

    const ano = Number(pegar("year"));
    const mes = Number(pegar("month"));
    const dia = Number(pegar("day"));
    const hora = Number(pegar("hour"));
    const minuto = Number(pegar("minute"));

    const diaSemanaNumero = new Date(
        Date.UTC(ano, mes - 1, dia)
    ).getUTCDay();

    const dataTexto =
        `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    return {
        data: dataTexto,
        ano,
        mes,
        dia,
        hora,
        minuto,
        diaSemanaNumero,
        horaFormatada:
            `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`
    };
}

function horarioParaMinutos(horario) {
    const [hora, minuto] = horario.split(":").map(Number);
    return hora * 60 + minuto;
}

async function gerarHash(texto) {
    const dados = new TextEncoder().encode(texto);

    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        dados
    );

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}
