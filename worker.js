import webpush from "web-push";


// ======================================================
// CONFIGURAÇÕES DO PLANO
// ======================================================

const DATA_INICIO_PLANO = "2026-10-05";
const DATA_FIM_PLANO = "2026-11-29";

const DURACAO_REFEICAO = 30;
const DURACAO_HIDRATACAO = 15;


// ======================================================
// PLANO DE REFEIÇÕES
//
// 0 = Domingo
// 1 = Segunda
// 2 = Terça
// 3 = Quarta
// 4 = Quinta
// 5 = Sexta
// 6 = Sábado
// ======================================================

const PLANO_REFEICOES = {

    1: [
        {
            nome: "Pré-Treino Imediato",
            horario: "05:40",
            conteudo:
                "900 ml de água + 5g Creatina + 3g Arginina • " +
                "1 banana média + 1 col. sopa de mel (ou aveia) • " +
                "1 xícara de café sem açúcar"
        },
        {
            nome: "Pós-Treino / Café da Manhã",
            horario: "08:30",
            conteudo:
                "2 fatias de pão de fôrma (ou 1 pão francês sem miolo) • " +
                "2 ovos inteiros • " +
                "Requeijão cremoso light • " +
                "Café sem açúcar. " +
                "Opção: Whey + leite + banana + 30g de aveia"
        },
        {
            nome: "Almoço",
            horario: "12:30",
            conteudo:
                "4 col. de arroz • " +
                "1 concha de feijão • " +
                "140g de frango ou carne de porco magra • " +
                "Salada + azeite"
        },
        {
            nome: "Lanche da Tarde",
            horario: "16:30",
            conteudo:
                "Pão com pastinha de frango ou tapioca com queijo • " +
                "1 porção de fruta • " +
                "Café sem açúcar ou chá"
        },
        {
            nome: "Jantar",
            horario: "20:00",
            conteudo:
                "3 col. de arroz • " +
                "1 concha pequena de feijão • " +
                "130g de carne cozida ou moída magra • " +
                "Salada ou verduras"
        }
    ],


    2: [
        {
            nome: "Pré-Treino",
            horario: "05:40",
            conteudo:
                "900 ml de água + Creatina + Arginina • " +
                "1 banana + 15g de aveia • " +
                "Café sem açúcar"
        },
        {
            nome: "Pós-Treino",
            horario: "08:30",
            conteudo:
                "Whey + 200 ml de leite + banana + 30g de aveia • " +
                "OU 2 fatias de pão com 2 ovos + requeijão light"
        },
        {
            nome: "Almoço",
            horario: "12:30",
            conteudo:
                "150g de mandioca ou batata • " +
                "1 concha de feijão • " +
                "140g de carne cozida ou bife magro • " +
                "Salada folhosa"
        },
        {
            nome: "Lanche da Tarde",
            horario: "16:30",
            conteudo:
                "Tapioca com queijo + ovo ou frango • " +
                "1 maçã • " +
                "Café sem açúcar"
        },
        {
            nome: "Jantar",
            horario: "20:00",
            conteudo:
                "Mexido: arroz + feijão + 130g de carne + legumes + pouca farinha"
        }
    ],


    3: [
        {
            nome: "Pré-Treino",
            horario: "05:40",
            conteudo:
                "900 ml de água + Creatina + Arginina • " +
                "1 banana grande + mel • " +
                "Café sem açúcar"
        },
        {
            nome: "Pós-Treino Reestruturador",
            horario: "08:30",
            conteudo:
                "2 fatias de pão + 2 ovos + requeijão light • " +
                "Mamão, melão ou melancia"
        },
        {
            nome: "Almoço",
            horario: "12:30",
            conteudo:
                "5 col. de arroz • " +
                "1 concha de feijão • " +
                "150g de frango ou carne magra • " +
                "Salada colorida"
        },
        {
            nome: "Lanche da Tarde",
            horario: "16:30",
            conteudo:
                "Whey com aveia e leite/água OU pão com frango • " +
                "1 laranja ou maçã"
        },
        {
            nome: "Jantar",
            horario: "20:00",
            conteudo:
                "Macarrão alho e óleo • " +
                "2 col. de arroz • " +
                "130g de frango ou carne • " +
                "Vegetais verdes"
        }
    ],


    4: [
        {
            nome: "Pré-Treino",
            horario: "05:40",
            conteudo:
                "900 ml de água + Creatina + Arginina • " +
                "1 banana • " +
                "Café sem açúcar"
        },
        {
            nome: "Pós-Treino",
            horario: "08:30",
            conteudo:
                "1 pão francês com ovo + requeijão light • " +
                "Café com pingo de leite"
        },
        {
            nome: "Almoço",
            horario: "12:30",
            conteudo:
                "4 col. de arroz • " +
                "1 concha de feijão • " +
                "140g de porco ou frango • " +
                "Abóbora + salada verde"
        },
        {
            nome: "Lanche da Tarde",
            horario: "16:30",
            conteudo:
                "Tapioca com queijo ou pão com frango • " +
                "Melão • " +
                "Café sem açúcar"
        },
        {
            nome: "Jantar",
            horario: "20:00",
            conteudo:
                "1 pão francês + 120g de carne moída magra + molho natural + salada"
        }
    ],


    5: [
        {
            nome: "Pré-Treino",
            horario: "05:40",
            conteudo:
                "900 ml de água + Creatina + Arginina • " +
                "1 banana + mel • " +
                "Café"
        },
        {
            nome: "Pós-Treino",
            horario: "08:30",
            conteudo:
                "Whey com aveia e fruta OU 2 fatias de pão + 2 ovos"
        },
        {
            nome: "Almoço",
            horario: "12:30",
            conteudo:
                "4 col. de arroz + feijão • " +
                "140g de proteína magra • " +
                "Salada completa"
        },
        {
            nome: "Lanche da Tarde",
            horario: "16:30",
            conteudo:
                "Pão com ovo/frango ou tapioca • " +
                "Café sem açúcar"
        },
        {
            nome: "Jantar / Opção Social",
            horario: "20:30",
            conteudo:
                "Opção caseira: cachorro-quente caseiro • " +
                "OU sushi: 12 a 16 peças com foco em sashimis/niguiris"
        }
    ],


    6: [
        {
            nome: "Manhã / Pré-Vôlei",
            horario: "08:00",
            conteudo:
                "900 ml de água + Creatina + Arginina • " +
                "2 fatias de pão com ovo e requeijão light ou shake • " +
                "1 banana antes de entrar em quadra"
        },
        {
            nome: "Almoço Pós-Vôlei",
            horario: "13:00",
            conteudo:
                "Churrasco: 1 pão de alho • " +
                "2 a 3 fatias de carnes • " +
                "2 col. de farofa • " +
                "Vinagrete"
        },
        {
            nome: "Lanche da Tarde",
            horario: "17:00",
            conteudo:
                "1 porção de fruta fresca OU café sem açúcar com biscoito caseiro em porção moderada"
        },
        {
            nome: "Jantar / Refeição Livre",
            horario: "20:30",
            conteudo:
                "2 a 3 fatias de pizza • " +
                "OU 1 hambúrguer artesanal + refrigerante zero"
        }
    ],


    0: [
        {
            nome: "Pré-Longão",
            horario: "06:00",
            conteudo:
                "900 ml de água + Creatina + Arginina • " +
                "2 fatias de pão com geleia/mel ou banana grande • " +
                "Café sem açúcar"
        },
        {
            nome: "Pós-Longão",
            horario: "09:30",
            conteudo:
                "Whey com leite, banana e aveia • " +
                "OU pão com ovos + suco natural sem açúcar"
        },
        {
            nome: "Almoço de Domingo",
            horario: "13:00",
            conteudo:
                "Arroz + feijão em porção moderada • " +
                "Salada • " +
                "Proteína magra"
        },
        {
            nome: "Jantar",
            horario: "19:30",
            conteudo:
                "Sopa de legumes com frango/carne moída OU mexido leve"
        }
    ]
};


// ======================================================
// HIDRATAÇÃO DIÁRIA
// ======================================================

const PLANO_HIDRATACAO = [

    {
        horario: "05:30",
        descricao:
            "900 ml de água ao acordar + Creatina + Arginina"
    },

    {
        horario: "07:45",
        descricao:
            "300 ml de água durante o treino"
    },

    {
        horario: "10:00",
        descricao:
            "500 ml de água — Garrafa 1, metade da manhã"
    },

    {
        horario: "11:30",
        descricao:
            "500 ml de água — Garrafa 1, final da manhã"
    },

    {
        horario: "14:30",
        descricao:
            "500 ml de água — Garrafa 2, início da tarde"
    },

    {
        horario: "16:00",
        descricao:
            "500 ml de água — Garrafa 2, final da tarde"
    },

    {
        horario: "19:30",
        descricao:
            "500 ml de água — início da noite"
    }
];


// ======================================================
// WORKER
// ======================================================

export default {

    // ==================================================
    // ROTAS HTTP
    // ==================================================

    async fetch(request, env) {

        const url =
            new URL(request.url);


        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
                "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers":
                "Content-Type"
        };


        // CORS
        if (
            request.method ===
            "OPTIONS"
        ) {

            return new Response(
                null,
                {
                    status: 204,
                    headers: corsHeaders
                }
            );
        }


        // ==============================================
        // GET /
        // ==============================================

        if (
            url.pathname === "/" &&
            request.method === "GET"
        ) {

            return Response.json({
                status: "ok",
                app:
                    "plano-alimentar-push",
                message:
                    "Backend ativo",
                ciclo:
                    `${DATA_INICIO_PLANO} a ${DATA_FIM_PLANO}`
            });
        }


        // ==============================================
        // POST /subscribe
        // ==============================================

        if (
            url.pathname ===
                "/subscribe" &&
            request.method ===
                "POST"
        ) {

            try {

                const subscription =
                    await request.json();


                if (
                    !subscription ||
                    !subscription.endpoint
                ) {

                    return Response.json(
                        {
                            error:
                                "Assinatura inválida"
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

                        id:
                            chave
                    },
                    {
                        status: 201
                    }
                );


            } catch (erro) {

                console.error(
                    "Erro ao salvar assinatura:",
                    erro
                );


                return Response.json(
                    {
                        error:
                            "Erro ao salvar assinatura"
                    },
                    {
                        status: 500
                    }
                );
            }
        }


        // ==============================================
        // POST /send-test
        // Mantido para testes manuais
        // ==============================================

        if (
            url.pathname ===
                "/send-test" &&
            request.method ===
                "POST"
        ) {

            const resultados =
                await enviarParaTodasAssinaturas(
                    env,
                    {
                        title:
                            "Meu Plano Alimentar",

                        body:
                            "Push manual funcionando ✅"
                    }
                );


            return Response.json({
                status: "ok",
                resultados
            });
        }


        // ==============================================
        // ROTA NÃO ENCONTRADA
        // ==============================================

        return Response.json(
            {
                error:
                    "Rota não encontrada"
            },
            {
                status: 404
            }
        );
    },


    // ==================================================
    // CRON
    // Executado a cada minuto
    // ==================================================

    async scheduled(
        controller,
        env,
        ctx
    ) {

        try {

            const agora =
                obterHorarioBrasil(
                    controller
                        .scheduledTime
                );


            console.log(
                "Cron:",
                agora
            );


            // ==========================================
            // SÓ ENVIA DURANTE AS 8 SEMANAS
            // ==========================================

            if (
                agora.data <
                    DATA_INICIO_PLANO ||
                agora.data >
                    DATA_FIM_PLANO
            ) {

                console.log(
                    "Fora do período do plano."
                );

                return;
            }


            const eventos =
                criarEventosDoDia(
                    agora.diaSemanaNumero
                );


            const minutoAtual =
                agora.hora * 60 +
                agora.minuto;


            const eventosAgora =
                eventos.filter(
                    evento =>
                        evento.minuto ===
                        minutoAtual
                );


            if (
                eventosAgora.length ===
                0
            ) {

                return;
            }


            for (
                const evento
                of eventosAgora
            ) {

                await processarEvento(
                    env,
                    agora,
                    evento
                );
            }


        } catch (erro) {

            console.error(
                "Erro no Cron:",
                erro
            );
        }
    }
};


// ======================================================
// CRIAR TODOS OS EVENTOS DO DIA
// ======================================================

function criarEventosDoDia(
    diaSemana
) {

    const eventos =
        [];


    const refeicoes =
        PLANO_REFEICOES[
            diaSemana
        ] || [];


    // ==================================================
    // REFEIÇÕES
    // ==================================================

    refeicoes.forEach(
        (
            refeicao,
            indice
        ) => {

            const inicio =
                horarioParaMinutos(
                    refeicao.horario
                );


            const fim =
                inicio +
                DURACAO_REFEICAO;


            const horarioFim =
                minutosParaHorario(
                    fim
                );


            // ------------------------------------------
            // 5 MIN ANTES DO INÍCIO
            // ------------------------------------------

            eventos.push({

                id:
                    `refeicao-${indice}-pre`,

                minuto:
                    inicio - 5,

                mensagem: {

                    title:
                        "🍽️ Próxima refeição em 5 min",

                    body:
                        `${refeicao.nome} começa às ${refeicao.horario}.`
                }
            });


            // ------------------------------------------
            // INÍCIO
            // ------------------------------------------

            eventos.push({

                id:
                    `refeicao-${indice}-inicio`,

                minuto:
                    inicio,

                mensagem: {

                    title:
                        "🍽️ Seu período de alimentação começou",

                    body:
                        `${refeicao.nome} • ${refeicao.horario}–${horarioFim}\n` +
                        `${refeicao.conteudo}`
                }
            });


            // ------------------------------------------
            // 5 MIN ANTES DO FIM
            // ------------------------------------------

            eventos.push({

                id:
                    `refeicao-${indice}-fim`,

                minuto:
                    fim - 5,

                mensagem: {

                    title:
                        "⏳ Seu período de alimentação está terminando",

                    body:
                        `Faltam 5 minutos para o período de ${refeicao.nome} acabar.`
                }
            });
        }
    );


    // ==================================================
    // HIDRATAÇÃO
    // ==================================================

    PLANO_HIDRATACAO.forEach(
        (
            hidratacao,
            indice
        ) => {

            const inicio =
                horarioParaMinutos(
                    hidratacao.horario
                );


            const fim =
                inicio +
                DURACAO_HIDRATACAO;


            const horarioFim =
                minutosParaHorario(
                    fim
                );


            // ------------------------------------------
            // 5 MIN ANTES DO INÍCIO
            // ------------------------------------------

            eventos.push({

                id:
                    `hidratacao-${indice}-pre`,

                minuto:
                    inicio - 5,

                mensagem: {

                    title:
                        "💧 Hidratação em 5 min",

                    body:
                        `Seu próximo período de hidratação começa às ${hidratacao.horario}.`
                }
            });


            // ------------------------------------------
            // INÍCIO
            // ------------------------------------------

            eventos.push({

                id:
                    `hidratacao-${indice}-inicio`,

                minuto:
                    inicio,

                mensagem: {

                    title:
                        "💧 Seu período de hidratação começou",

                    body:
                        `${hidratacao.horario}–${horarioFim}\n` +
                        `${hidratacao.descricao}`
                }
            });


            // ------------------------------------------
            // 5 MIN ANTES DO FIM
            // ------------------------------------------

            eventos.push({

                id:
                    `hidratacao-${indice}-fim`,

                minuto:
                    fim - 5,

                mensagem: {

                    title:
                        "⏳ Seu período de hidratação está terminando",

                    body:
                        "Faltam 5 minutos para o período de hidratação acabar."
                }
            });
        }
    );


    return eventos;
}


// ======================================================
// PROCESSAR EVENTO
// ======================================================

async function processarEvento(
    env,
    agora,
    evento
) {

    const identificador =
        `notify:${agora.data}:${evento.id}`;


    // ==================================================
    // EVITA DUPLICIDADE
    // ==================================================

    const jaEnviado =
        await env
            .PUSH_SUBSCRIPTIONS
            .get(
                identificador
            );


    if (jaEnviado) {

        console.log(
            "Notificação já enviada:",
            identificador
        );

        return;
    }


    const resultados =
        await enviarParaTodasAssinaturas(
            env,
            evento.mensagem
        );


    const houveSucesso =
        resultados.some(
            resultado =>
                resultado.status ===
                "enviado"
        );


    if (
        houveSucesso
    ) {

        await env
            .PUSH_SUBSCRIPTIONS
            .put(
                identificador,
                "1",
                {
                    expirationTtl:
                        172800
                }
            );


        console.log(
            "Notificação enviada:",
            identificador
        );

    } else {

        console.error(
            "Nenhuma assinatura recebeu:",
            identificador
        );
    }
}


// ======================================================
// ENVIAR PUSH
// ======================================================

async function enviarParaTodasAssinaturas(
    env,
    mensagem
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


    const resultados =
        [];


    for (
        const item
        of lista.keys
    ) {

        // Ignora os marcadores de
        // notificações já enviadas.
        if (
            item.name.startsWith(
                "notify:"
            )
        ) {

            continue;
        }


        const valor =
            await env
                .PUSH_SUBSCRIPTIONS
                .get(
                    item.name
                );


        if (!valor) {

            continue;
        }


        let assinatura;


        try {

            assinatura =
                JSON.parse(
                    valor
                );

        } catch {

            continue;
        }


        if (
            !assinatura ||
            !assinatura.endpoint
        ) {

            continue;
        }


        try {

            await webpush
                .sendNotification(
                    assinatura,
                    JSON.stringify(
                        mensagem
                    )
                );


            resultados.push({

                id:
                    item.name,

                status:
                    "enviado"
            });


        } catch (erro) {

            console.error(
                "Erro ao enviar push:",
                erro
            );


            resultados.push({

                id:
                    item.name,

                status:
                    "erro",

                erro:
                    erro.message
            });


            // Assinatura expirada ou inválida.
            if (
                erro.statusCode === 404 ||
                erro.statusCode === 410
            ) {

                await env
                    .PUSH_SUBSCRIPTIONS
                    .delete(
                        item.name
                    );


                console.log(
                    "Assinatura inválida removida:",
                    item.name
                );
            }
        }
    }


    return resultados;
}


// ======================================================
// HORÁRIO DE SÃO PAULO
// ======================================================

function obterHorarioBrasil(
    timestamp
) {

    const data =
        new Date(
            timestamp
        );


    const formatador =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/Sao_Paulo",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false
            }
        );


    const partes =
        formatador
            .formatToParts(
                data
            );


    const pegar =
        tipo =>
            partes.find(
                item =>
                    item.type ===
                    tipo
            )?.value;


    const ano =
        Number(
            pegar("year")
        );


    const mes =
        Number(
            pegar("month")
        );


    const dia =
        Number(
            pegar("day")
        );


    const hora =
        Number(
            pegar("hour")
        );


    const minuto =
        Number(
            pegar("minute")
        );


    // Calcula o dia da semana usando
    // a data civil de São Paulo.
    const diaSemanaNumero =
        new Date(
            Date.UTC(
                ano,
                mes - 1,
                dia
            )
        )
            .getUTCDay();


    const dataTexto =
        `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;


    return {

        data:
            dataTexto,

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


// ======================================================
// CONVERTER HH:MM → MINUTOS
// ======================================================

function horarioParaMinutos(
    horario
) {

    const [
        hora,
        minuto
    ] =
        horario
            .split(":")
            .map(Number);


    return (
        hora * 60 +
        minuto
    );
}


// ======================================================
// CONVERTER MINUTOS → HH:MM
// ======================================================

function minutosParaHorario(
    minutos
) {

    const minutosDia =
        (
            minutos +
            1440
        ) %
        1440;


    const hora =
        Math.floor(
            minutosDia / 60
        );


    const minuto =
        minutosDia % 60;


    return (
        `${String(hora).padStart(2, "0")}:` +
        `${String(minuto).padStart(2, "0")}`
    );
}


// ======================================================
// GERAR HASH DA ASSINATURA
// ======================================================

async function gerarHash(
    texto
) {

    const dados =
        new TextEncoder()
            .encode(
                texto
            );


    const hashBuffer =
        await crypto
            .subtle
            .digest(
                "SHA-256",
                dados
            );


    return Array.from(
        new Uint8Array(
            hashBuffer
        )
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");
}