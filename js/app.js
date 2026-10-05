console.log("Aplicativo carregado com sucesso.");


// ======================================================
// SERVICE WORKER
// ======================================================

const ambienteLocal =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

if ("serviceWorker" in navigator) {

    if (ambienteLocal) {

        // No localhost, evita cache durante o desenvolvimento.
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

        if ("caches" in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });
            });
        }

    } else {

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

const DURACAO_REFEICAO_MIN = 30;
const DURACAO_HIDRATACAO_MIN = 15;
const ANTECEDENCIA_MIN = 5;
const AVISO_FIM_MIN = 5;

let ultimoDiaDetectado = null;


// ======================================================
// DADOS DE HIDRATAÇÃO
// ======================================================

const LEMBRETES_HIDRATACAO = [
    {
        horario: "05:30",
        descricao: "900 ml de água ao acordar (Creatina + Arginina)"
    },
    {
        horario: "07:45",
        descricao: "300 ml de água durante o treino"
    },
    {
        horario: "10:00",
        descricao: "500 ml de água (Garrafa 1 - Metade da Manhã)"
    },
    {
        horario: "11:30",
        descricao: "500 ml de água (Garrafa 1 - Final da Manhã)"
    },
    {
        horario: "14:30",
        descricao: "500 ml de água (Garrafa 2 - Início da Tarde)"
    },
    {
        horario: "16:00",
        descricao: "500 ml de água (Garrafa 2 - Final da Tarde)"
    },
    {
        horario: "19:30",
        descricao: "500 ml de água (Início da Noite)"
    }
];


// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function formatarHorario(data) {
    return data.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );
}


function formatarPeriodo(inicio, fim) {
    return `${formatarHorario(inicio)} - ${formatarHorario(fim)}`;
}


function formatarTempoRestante(dataFutura, prefixo = "Faltam") {

    const agora = new Date();

    const diferenca =
        dataFutura.getTime() - agora.getTime();

    if (diferenca <= 0) {
        return "Agora";
    }

    const minutosTotais =
        Math.ceil(diferenca / 60000);

    const horas =
        Math.floor(minutosTotais / 60);

    const minutos =
        minutosTotais % 60;

    if (horas > 0) {
        return `${prefixo} ${horas}h ${minutos}min`;
    }

    return `${prefixo} ${minutos} min`;
}


function criarDataComHorario(dataBase, horario) {

    const partes =
        horario.split(":");

    if (partes.length !== 2) {
        return null;
    }

    const hora = Number(partes[0]);
    const minuto = Number(partes[1]);

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


function adicionarMinutos(data, minutos) {

    const resultado =
        new Date(data);

    resultado.setMinutes(
        resultado.getMinutes() + minutos
    );

    return resultado;
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


function nomeRelativoDia(data, offset) {

    if (offset === 0) {
        return "";
    }

    if (offset === 1) {
        return "Amanhã • ";
    }

    return `${NOMES_DIAS[data.getDay()]} • `;
}


function obterConteudoRefeicao(card) {

    if (!card) {
        return "";
    }

    const itens =
        Array.from(
            card.querySelectorAll(".meal-content li")
        )
            .map(item => item.textContent.trim())
            .filter(Boolean);

    return itens.join(" • ");
}


function criarChaveNotificacao(
    tipo,
    momento,
    dataReferencia,
    identificador
) {

    const ano =
        dataReferencia.getFullYear();

    const mes =
        String(
            dataReferencia.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            dataReferencia.getDate()
        ).padStart(2, "0");

    return [
        "notif",
        ano,
        mes,
        dia,
        tipo,
        momento,
        identificador
    ].join(":");
}


function estaNoMinutoAlvo(alvo) {

    const agora =
        new Date();

    const diferenca =
        agora.getTime() - alvo.getTime();

    return (
        diferenca >= 0 &&
        diferenca < 60000
    );
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
// REFEIÇÕES E PERÍODOS
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

    const refeicoes = [];

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

        const horarioInicio =
            horario.dataset.start ||
            (
                horario.textContent
                    .match(/\d{2}:\d{2}/) || []
            )[0];

        if (!horarioInicio) {
            return;
        }

        const inicio =
            criarDataComHorario(
                dataBase,
                horarioInicio
            );

        if (!inicio) {
            return;
        }

        const fim =
            adicionarMinutos(
                inicio,
                DURACAO_REFEICAO_MIN
            );

        refeicoes.push({
            titulo:
                titulo.textContent
                    .replace(
                        /^\d+\.\s*/,
                        ""
                    )
                    .trim(),

            inicio,
            fim,
            horarioInicio,
            horarioFim:
                formatarHorario(fim),

            periodo:
                formatarPeriodo(
                    inicio,
                    fim
                ),

            conteudo:
                obterConteudoRefeicao(
                    card
                ),

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
                "next-meal-highlight",
                "current-meal-highlight"
            );
        });

    let refeicaoAtual = null;
    let proximaRefeicao = null;
    let diasAFrente = 0;

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

        if (offset === 0) {

            refeicaoAtual =
                refeicoes.find(
                    refeicao =>
                        agora >= refeicao.inicio &&
                        agora < refeicao.fim
                ) || null;

            if (refeicaoAtual) {
                break;
            }
        }

        proximaRefeicao =
            refeicoes.find(
                refeicao =>
                    refeicao.inicio > agora
            ) || null;

        if (proximaRefeicao) {
            diasAFrente =
                offset;

            break;
        }
    }

    const labelElemento =
        document.getElementById(
            "next-meal-label"
        );

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
        !labelElemento ||
        !nomeElemento ||
        !horarioElemento ||
        !countdownElemento
    ) {
        return;
    }

    if (refeicaoAtual) {

        labelElemento.textContent =
            "Período de alimentação atual";

        nomeElemento.textContent =
            refeicaoAtual.titulo;

        horarioElemento.textContent =
            refeicaoAtual.periodo;

        countdownElemento.textContent =
            formatarTempoRestante(
                refeicaoAtual.fim,
                "Termina em"
            );

        refeicaoAtual.card
            .classList
            .add(
                "current-meal-highlight"
            );

        return;
    }

    if (!proximaRefeicao) {

        labelElemento.textContent =
            "Próxima refeição";

        nomeElemento.textContent =
            "Nenhuma refeição encontrada";

        horarioElemento.textContent =
            "";

        countdownElemento.textContent =
            "";

        return;
    }

    const prefixo =
        nomeRelativoDia(
            proximaRefeicao.inicio,
            diasAFrente
        );

    labelElemento.textContent =
        "Próxima refeição";

    nomeElemento.textContent =
        prefixo +
        proximaRefeicao.titulo;

    horarioElemento.textContent =
        proximaRefeicao.periodo;

    countdownElemento.textContent =
        formatarTempoRestante(
            proximaRefeicao.inicio
        );

    proximaRefeicao.card
        .classList
        .add(
            "next-meal-highlight"
        );
}


// ======================================================
// HIDRATAÇÃO E PERÍODOS
// ======================================================

function obterLembretesHidratacao(
    dataBase
) {

    return LEMBRETES_HIDRATACAO
        .map(lembrete => {

            const inicio =
                criarDataComHorario(
                    dataBase,
                    lembrete.horario
                );

            if (!inicio) {
                return null;
            }

            const fim =
                adicionarMinutos(
                    inicio,
                    DURACAO_HIDRATACAO_MIN
                );

            return {
                ...lembrete,
                inicio,
                fim,
                periodo:
                    formatarPeriodo(
                        inicio,
                        fim
                    )
            };
        })
        .filter(Boolean);
}


function atualizarProximaHidratacao() {

    const agora =
        new Date();

    let hidratacaoAtual = null;
    let proximaHidratacao = null;
    let diasAFrente = 0;

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

        if (offset === 0) {

            hidratacaoAtual =
                lembretes.find(
                    item =>
                        agora >= item.inicio &&
                        agora < item.fim
                ) || null;

            if (hidratacaoAtual) {
                break;
            }
        }

        proximaHidratacao =
            lembretes.find(
                item =>
                    item.inicio > agora
            ) || null;

        if (proximaHidratacao) {
            diasAFrente =
                offset;

            break;
        }
    }

    const labelElemento =
        document.getElementById(
            "next-water-label"
        );

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
        !labelElemento ||
        !nomeElemento ||
        !horarioElemento ||
        !countdownElemento
    ) {
        return;
    }

    if (hidratacaoAtual) {

        labelElemento.textContent =
            "Período de hidratação atual";

        nomeElemento.textContent =
            hidratacaoAtual.descricao;

        horarioElemento.textContent =
            hidratacaoAtual.periodo;

        countdownElemento.textContent =
            formatarTempoRestante(
                hidratacaoAtual.fim,
                "Termina em"
            );

        return;
    }

    if (!proximaHidratacao) {

        labelElemento.textContent =
            "Próxima hidratação";

        nomeElemento.textContent =
            "Nenhum lembrete encontrado";

        horarioElemento.textContent =
            "";

        countdownElemento.textContent =
            "";

        return;
    }

    const prefixo =
        nomeRelativoDia(
            proximaHidratacao.inicio,
            diasAFrente
        );

    labelElemento.textContent =
        "Próxima hidratação";

    nomeElemento.textContent =
        prefixo +
        proximaHidratacao.descricao;

    horarioElemento.textContent =
        proximaHidratacao.periodo;

    countdownElemento.textContent =
        formatarTempoRestante(
            proximaHidratacao.inicio
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
// PERMISSÃO E EXIBIÇÃO DE NOTIFICAÇÕES
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

    botao.disabled = false;
}


async function exibirNotificacao(
    titulo,
    corpo,
    tag
) {

    if (
        !("Notification" in window) ||
        Notification.permission !==
        "granted"
    ) {
        return;
    }

    try {

        if (
            ambienteLocal ||
            !("serviceWorker" in navigator)
        ) {

            new Notification(
                titulo,
                {
                    body: corpo,
                    icon:
                        "./icons/icon-192.png",
                    tag
                }
            );

            return;
        }

        const registro =
            await navigator
                .serviceWorker
                .ready;

        await registro.showNotification(
            titulo,
            {
                body: corpo,
                icon:
                    "./icons/icon-192.png",
                badge:
                    "./icons/icon-192.png",
                tag
            }
        );

    } catch (erro) {

        console.error(
            "Erro ao exibir notificação:",
            erro
        );
    }
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
            await Notification
                .requestPermission();

        atualizarStatusNotificacoes();

        if (
            permissao ===
            "granted"
        ) {

            await exibirNotificacao(
                "Meu Plano Alimentar",
                "Notificações ativadas com sucesso ✅",
                "teste-notificacao"
            );
        }

    } catch (erro) {

        console.error(
            "Erro ao solicitar permissão:",
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
// NOTIFICAÇÕES DE REFEIÇÃO E HIDRATAÇÃO
// enquanto o app estiver ativo.
// O Web Push em segundo plano entra na próxima etapa.
// ======================================================

async function enviarNotificacaoUmaVez(
    chave,
    titulo,
    corpo
) {

    if (
        localStorage.getItem(chave)
    ) {
        return;
    }

    await exibirNotificacao(
        titulo,
        corpo,
        chave
    );

    localStorage.setItem(
        chave,
        "1"
    );
}


async function verificarNotificacoesRefeicoes() {

    if (
        !("Notification" in window) ||
        Notification.permission !==
        "granted"
    ) {
        return;
    }

    const hoje =
        obterDataDoDia(0);

    const numeroDia =
        hoje.getDay();

    const refeicoes =
        obterRefeicoesDoDia(
            numeroDia,
            hoje
        );

    for (
        const refeicao
        of refeicoes
    ) {

        const cincoAntesInicio =
            adicionarMinutos(
                refeicao.inicio,
                -ANTECEDENCIA_MIN
            );

        const cincoAntesFim =
            adicionarMinutos(
                refeicao.fim,
                -AVISO_FIM_MIN
            );

        const idBase =
            `${numeroDia}-${refeicao.horarioInicio}-${refeicao.titulo}`;

        if (
            estaNoMinutoAlvo(
                cincoAntesInicio
            )
        ) {

            await enviarNotificacaoUmaVez(
                criarChaveNotificacao(
                    "refeicao",
                    "pre-inicio",
                    refeicao.inicio,
                    idBase
                ),
                "🍽️ Sua próxima refeição está chegando",
                `${refeicao.titulo} começa em 5 minutos, às ${refeicao.horarioInicio}.`
            );
        }

        if (
            estaNoMinutoAlvo(
                refeicao.inicio
            )
        ) {

            const conteudo =
                refeicao.conteudo
                    ? ` O que ingerir: ${refeicao.conteudo}`
                    : "";

            await enviarNotificacaoUmaVez(
                criarChaveNotificacao(
                    "refeicao",
                    "inicio",
                    refeicao.inicio,
                    idBase
                ),
                "🍽️ Seu período de alimentação começou",
                `${refeicao.titulo} • ${refeicao.periodo}.${conteudo}`
            );
        }

        if (
            estaNoMinutoAlvo(
                cincoAntesFim
            )
        ) {

            await enviarNotificacaoUmaVez(
                criarChaveNotificacao(
                    "refeicao",
                    "pre-fim",
                    refeicao.inicio,
                    idBase
                ),
                "⏳ Seu período de alimentação está terminando",
                `${refeicao.titulo}: faltam 5 minutos para o período acabar.`
            );
        }
    }
}


async function verificarNotificacoesHidratacao() {

    if (
        !("Notification" in window) ||
        Notification.permission !==
        "granted"
    ) {
        return;
    }

    const hoje =
        obterDataDoDia(0);

    const lembretes =
        obterLembretesHidratacao(
            hoje
        );

    for (
        const item
        of lembretes
    ) {

        const cincoAntesInicio =
            adicionarMinutos(
                item.inicio,
                -ANTECEDENCIA_MIN
            );

        const cincoAntesFim =
            adicionarMinutos(
                item.fim,
                -AVISO_FIM_MIN
            );

        const idBase =
            `${item.horario}-${item.descricao}`;

        if (
            estaNoMinutoAlvo(
                cincoAntesInicio
            )
        ) {

            await enviarNotificacaoUmaVez(
                criarChaveNotificacao(
                    "hidratacao",
                    "pre-inicio",
                    item.inicio,
                    idBase
                ),
                "💧 Sua próxima hidratação está chegando",
                `Seu próximo período de hidratação começa em 5 minutos, às ${item.horario}.`
            );
        }

        if (
            estaNoMinutoAlvo(
                item.inicio
            )
        ) {

            await enviarNotificacaoUmaVez(
                criarChaveNotificacao(
                    "hidratacao",
                    "inicio",
                    item.inicio,
                    idBase
                ),
                "💧 Seu período de hidratação começou",
                `${item.periodo}. O que ingerir: ${item.descricao}.`
            );
        }

        if (
            estaNoMinutoAlvo(
                cincoAntesFim
            )
        ) {

            await enviarNotificacaoUmaVez(
                criarChaveNotificacao(
                    "hidratacao",
                    "pre-fim",
                    item.inicio,
                    idBase
                ),
                "⏳ Seu período de hidratação está terminando",
                "Faltam 5 minutos para o período de hidratação acabar."
            );
        }
    }
}


async function verificarNotificacoesAgendadas() {

    await verificarNotificacoesRefeicoes();

    await verificarNotificacoesHidratacao();
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

        verificarNotificacoesAgendadas();
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

        verificarNotificacoesAgendadas();

    },
    30000
);
