console.log("Aplicativo carregado com sucesso.");


// ======================================================
// SERVICE WORKER
// ======================================================

if ("serviceWorker" in navigator) {

    const ambienteLocal =
        location.hostname === "127.0.0.1" ||
        location.hostname === "localhost";


    if (ambienteLocal) {

        // Durante o desenvolvimento local,
        // remove Service Workers antigos para evitar
        // que arquivos em cache atrapalhem os testes.

        navigator.serviceWorker
            .getRegistrations()
            .then(registrations => {

                registrations.forEach(registration => {
                    registration.unregister();
                });

                console.log(
                    "Service Worker desativado no ambiente local."
                );
            });


        // Limpa caches antigos no localhost.
        if ("caches" in window) {

            caches.keys().then(cacheNames => {

                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });

            });
        }


    } else {

        // Em produção, como GitHub Pages,
        // o Service Worker continua funcionando.

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {

                console.log(
                    "Service Worker registrado com sucesso."
                );

            })
            .catch(error => {

                console.error(
                    "Erro ao registrar Service Worker:",
                    error
                );

            });
    }
}


// ======================================================
// CONFIGURAÇÕES GERAIS
// ======================================================

const DIAS = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado"
];

const NOMES_DIAS = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado"
];

let ultimoDiaDetectado = null;


// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function formatarTempoRestante(dataFutura) {

    const agora = new Date();

    const diferenca =
        dataFutura.getTime() - agora.getTime();

    if (diferenca <= 0) {
        return "Agora";
    }

    const minutosTotais =
        Math.floor(diferenca / 60000);

    const horas =
        Math.floor(minutosTotais / 60);

    const minutos =
        minutosTotais % 60;

    if (horas > 0) {
        return `Faltam ${horas}h ${minutos}min`;
    }

    return `Faltam ${minutos} min`;
}


function criarDataComHorario(dataBase, horario) {

    const partes =
        horario.split(":");

    if (partes.length !== 2) {
        return null;
    }

    const hora =
        Number(partes[0]);

    const minuto =
        Number(partes[1]);

    if (
        Number.isNaN(hora) ||
        Number.isNaN(minuto)
    ) {
        return null;
    }

    const data =
        new Date(dataBase);

    data.setHours(
        hora,
        minuto,
        0,
        0
    );

    return data;
}


function obterDataDoDia(offsetDias = 0) {

    const data =
        new Date();

    data.setDate(
        data.getDate() + offsetDias
    );

    data.setHours(
        0,
        0,
        0,
        0
    );

    return data;
}


// ======================================================
// TROCA DOS DIAS
// ======================================================

function switchTab(dayId, button = null) {

    const sections =
        document.querySelectorAll(
            ".day-section"
        );

    sections.forEach(section => {
        section.classList.remove(
            "active"
        );
    });


    const buttons =
        document.querySelectorAll(
            ".tab-btn"
        );

    buttons.forEach(btn => {
        btn.classList.remove(
            "active"
        );
    });


    const selectedSection =
        document.getElementById(
            dayId
        );

    if (selectedSection) {
        selectedSection.classList.add(
            "active"
        );
    }


    if (button) {

        button.classList.add(
            "active"
        );

    } else {

        const automaticButton =
            document.querySelector(
                `[data-day="${dayId}"]`
            );

        if (automaticButton) {
            automaticButton.classList.add(
                "active"
            );
        }
    }
}


// ======================================================
// IDENTIFICAR DIA ATUAL
// ======================================================

function abrirDiaAtual() {

    const hoje =
        new Date();

    const numeroDia =
        hoje.getDay();

    const diaAtual =
        DIAS[numeroDia];

    console.log(
        "Dia identificado:",
        diaAtual
    );

    switchTab(
        diaAtual
    );

    ultimoDiaDetectado =
        numeroDia;
}


// ======================================================
// MACROS DO DIA ATUAL
// ======================================================

function atualizarMacrosDoDia() {

    const hoje =
        new Date().getDay();

    const metas = {

        0: {
            calorias: "2.400 kcal",
            proteina: "150g",
            carbo: "280g",
            gordura: "60g"
        },

        1: {
            calorias: "2.000 kcal",
            proteina: "150g",
            carbo: "210g",
            gordura: "55g"
        },

        2: {
            calorias: "2.000 kcal",
            proteina: "150g",
            carbo: "210g",
            gordura: "55g"
        },

        3: {
            calorias: "2.150 kcal",
            proteina: "150g",
            carbo: "240g",
            gordura: "55g"
        },

        4: {
            calorias: "2.000 kcal",
            proteina: "150g",
            carbo: "210g",
            gordura: "55g"
        },

        5: {
            calorias: "2.150 kcal",
            proteina: "150g",
            carbo: "240g",
            gordura: "55g"
        },

        6: {
            calorias: "2.300 kcal",
            proteina: "140g",
            carbo: "240g",
            gordura: "70g"
        }
    };

    const metaHoje =
        metas[hoje];


    document.getElementById(
        "macro-calorias"
    ).textContent =
        metaHoje.calorias;


    document.getElementById(
        "macro-proteina"
    ).textContent =
        metaHoje.proteina;


    document.getElementById(
        "macro-carbo"
    ).textContent =
        metaHoje.carbo;


    document.getElementById(
        "macro-gordura"
    ).textContent =
        metaHoje.gordura;
}


// ======================================================
// PRÓXIMA REFEIÇÃO
// ======================================================

function obterRefeicoesDoDia(
    numeroDia,
    dataBase
) {

    const diaId =
        DIAS[numeroDia];

    const secaoDoDia =
        document.getElementById(
            diaId
        );

    if (!secaoDoDia) {
        return [];
    }


    const cards =
        secaoDoDia.querySelectorAll(
            ".meal-card"
        );

    const refeicoes =
        [];


    cards.forEach(card => {

        const titulo =
            card.querySelector(
                ".meal-title"
            );

        const horario =
            card.querySelector(
                ".meal-time"
            );


        if (
            !titulo ||
            !horario
        ) {
            return;
        }


        const horarioTexto =
            horario.textContent.trim();


        if (
            !/^\d{2}:\d{2}$/.test(
                horarioTexto
            )
        ) {
            return;
        }


        const dataRefeicao =
            criarDataComHorario(
                dataBase,
                horarioTexto
            );


        if (!dataRefeicao) {
            return;
        }


        refeicoes.push({

            titulo:
                titulo.textContent
                    .replace(
                        /^\d+\.\s*/,
                        ""
                    )
                    .trim(),

            horario:
                horarioTexto,

            data:
                dataRefeicao,

            card:
                card
        });
    });


    return refeicoes;
}


function atualizarProximaRefeicao() {

    const agora =
        new Date();


    document
        .querySelectorAll(
            ".meal-card"
        )
        .forEach(card => {

            card.classList.remove(
                "next-meal-highlight"
            );
        });


    let proximaRefeicao =
        null;

    let diasAFrente =
        0;


    // Procura hoje e, se necessário,
    // nos próximos 7 dias.
    for (
        let offset = 0;
        offset <= 7;
        offset++
    ) {

        const dataBase =
            obterDataDoDia(
                offset
            );


        const numeroDia =
            dataBase.getDay();


        const refeicoes =
            obterRefeicoesDoDia(
                numeroDia,
                dataBase
            );


        for (
            const refeicao
            of refeicoes
        ) {

            if (
                refeicao.data > agora
            ) {

                proximaRefeicao =
                    refeicao;

                diasAFrente =
                    offset;

                break;
            }
        }


        if (proximaRefeicao) {
            break;
        }
    }


    const nomeElemento =
        document.getElementById(
            "next-meal-name"
        );

    const horarioElemento =
        document.getElementById(
            "next-meal-time"
        );

    const countdownElemento =
        document.getElementById(
            "next-meal-countdown"
        );


    if (
        !nomeElemento ||
        !horarioElemento ||
        !countdownElemento
    ) {
        return;
    }


    if (!proximaRefeicao) {

        nomeElemento.textContent =
            "Nenhuma refeição encontrada";

        horarioElemento.textContent =
            "";

        countdownElemento.textContent =
            "";

        return;
    }


    let prefixo =
        "";


    if (diasAFrente === 1) {

        prefixo =
            "Amanhã • ";

    } else if (
        diasAFrente > 1
    ) {

        const numeroDia =
            proximaRefeicao
                .data
                .getDay();

        prefixo =
            `${NOMES_DIAS[numeroDia]} • `;
    }


    nomeElemento.textContent =
        prefixo +
        proximaRefeicao.titulo;


    horarioElemento.textContent =
        proximaRefeicao.horario;


    countdownElemento.textContent =
        formatarTempoRestante(
            proximaRefeicao.data
        );


    // Destaca o card correspondente.
    // Se for amanhã, ele ficará destacado
    // quando o usuário abrir a aba daquele dia.
    proximaRefeicao
        .card
        .classList
        .add(
            "next-meal-highlight"
        );
}


// ======================================================
// PRÓXIMA HIDRATAÇÃO
// ======================================================

function obterLembretesHidratacao(
    dataBase
) {

    const lembretes = [

        {
            horario: "05:30",
            descricao:
                "900 ml de água ao acordar"
        },

        {
            horario: "07:45",
            descricao:
                "300 ml de água durante o treino"
        },

        {
            horario: "10:00",
            descricao:
                "500 ml de água"
        },

        {
            horario: "11:30",
            descricao:
                "500 ml de água"
        },

        {
            horario: "14:30",
            descricao:
                "500 ml de água"
        },

        {
            horario: "16:00",
            descricao:
                "500 ml de água"
        },

        {
            horario: "19:30",
            descricao:
                "500 ml de água"
        }
    ];


    return lembretes.map(
        lembrete => ({

            ...lembrete,

            data:
                criarDataComHorario(
                    dataBase,
                    lembrete.horario
                )
        })
    );
}


function atualizarProximaHidratacao() {

    const agora =
        new Date();

    let proximaHidratacao =
        null;

    let diasAFrente =
        0;


    // Hoje ou próximos dias.
    for (
        let offset = 0;
        offset <= 7;
        offset++
    ) {

        const dataBase =
            obterDataDoDia(
                offset
            );


        const lembretes =
            obterLembretesHidratacao(
                dataBase
            );


        for (
            const lembrete
            of lembretes
        ) {

            if (
                lembrete.data > agora
            ) {

                proximaHidratacao =
                    lembrete;

                diasAFrente =
                    offset;

                break;
            }
        }


        if (proximaHidratacao) {
            break;
        }
    }


    const nomeElemento =
        document.getElementById(
            "next-water-name"
        );

    const horarioElemento =
        document.getElementById(
            "next-water-time"
        );

    const countdownElemento =
        document.getElementById(
            "next-water-countdown"
        );


    if (
        !nomeElemento ||
        !horarioElemento ||
        !countdownElemento
    ) {
        return;
    }


    if (!proximaHidratacao) {

        nomeElemento.textContent =
            "Nenhum lembrete encontrado";

        horarioElemento.textContent =
            "";

        countdownElemento.textContent =
            "";

        return;
    }


    let prefixo =
        "";


    if (diasAFrente === 1) {

        prefixo =
            "Amanhã • ";

    } else if (
        diasAFrente > 1
    ) {

        const numeroDia =
            proximaHidratacao
                .data
                .getDay();

        prefixo =
            `${NOMES_DIAS[numeroDia]} • `;
    }


    nomeElemento.textContent =
        prefixo +
        proximaHidratacao.descricao;


    horarioElemento.textContent =
        proximaHidratacao.horario;


    countdownElemento.textContent =
        formatarTempoRestante(
            proximaHidratacao.data
        );
}


// ======================================================
// VIRADA DO DIA
// ======================================================

function verificarMudancaDeDia() {

    const diaAtual =
        new Date().getDay();


    if (
        ultimoDiaDetectado === null
    ) {

        ultimoDiaDetectado =
            diaAtual;

        return;
    }


    if (
        diaAtual !==
        ultimoDiaDetectado
    ) {

        console.log(
            "Novo dia detectado."
        );


        ultimoDiaDetectado =
            diaAtual;


        abrirDiaAtual();

        atualizarMacrosDoDia();

        atualizarProximaRefeicao();

        atualizarProximaHidratacao();
    }
}

// ======================================================
// NOTIFICAÇÕES
// ======================================================

function atualizarStatusNotificacoes() {

    const statusElemento =
        document.getElementById(
            "notification-status"
        );

    const botao =
        document.getElementById(
            "enable-notifications"
        );

    if (
        !statusElemento ||
        !botao
    ) {
        return;
    }


    if (
        !("Notification" in window)
    ) {

        statusElemento.textContent =
            "Este dispositivo não suporta notificações.";

        botao.disabled = true;

        return;
    }


    if (
        Notification.permission ===
        "granted"
    ) {

        statusElemento.textContent =
            "Notificações ativadas";

        botao.textContent =
            "Ativadas";

        botao.disabled = true;

        return;
    }


    if (
        Notification.permission ===
        "denied"
    ) {

        statusElemento.textContent =
            "Permissão bloqueada nas configurações";

        botao.textContent =
            "Bloqueadas";

        botao.disabled = true;

        return;
    }


    statusElemento.textContent =
        "Não ativadas";

    botao.textContent =
        "Ativar notificações";
}


async function solicitarPermissaoNotificacoes() {

    if (
        !("Notification" in window)
    ) {

        alert(
            "Este dispositivo não suporta notificações."
        );

        return;
    }


    try {

        const permissao =
            await Notification.requestPermission();


        atualizarStatusNotificacoes();


        if (
            permissao ===
            "granted"
        ) {

            await enviarNotificacaoTeste();

        }

    } catch (erro) {

        console.error(
            "Erro ao solicitar permissão:",
            erro
        );

    }
}


async function enviarNotificacaoTeste() {

    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }


    try {

        const registro =
            await navigator
                .serviceWorker
                .ready;


        await registro.showNotification(
            "Meu Plano Alimentar",
            {
                body:
                    "Notificações ativadas com sucesso ✅",

                icon:
                    "./icons/icon-192.png",

                badge:
                    "./icons/icon-192.png",

                tag:
                    "teste-notificacao"
            }
        );


    } catch (erro) {

        console.error(
            "Erro ao enviar notificação:",
            erro
        );

    }
}


function configurarBotaoNotificacoes() {

    const botao =
        document.getElementById(
            "enable-notifications"
        );


    if (!botao) {
        return;
    }


    botao.addEventListener(
        "click",
        solicitarPermissaoNotificacoes
    );


    atualizarStatusNotificacoes();
}

// ======================================================
// INICIALIZAÇÃO DO APP
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        abrirDiaAtual();

        atualizarMacrosDoDia();

        atualizarProximaRefeicao();

        atualizarProximaHidratacao();

        configurarBotaoNotificacoes();
    }
);


// ======================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ======================================================

setInterval(
    () => {

        verificarMudancaDeDia();

        atualizarProximaRefeicao();

        atualizarProximaHidratacao();

    },
    60000
);