console.log("Aplicativo carregado com sucesso.");

// ======================================================
// AMBIENTE / SERVICE WORKER
// ======================================================

const AMBIENTE_LOCAL =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

if ("serviceWorker" in navigator) {
    if (AMBIENTE_LOCAL) {
        navigator.serviceWorker
            .getRegistrations()
            .then(registrations => {
                registrations.forEach(registration => registration.unregister());
                console.log("Service Worker desativado no ambiente local.");
            });

        if ("caches" in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => caches.delete(cacheName));
            });
        }
    } else {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("Service Worker registrado com sucesso.");
            })
            .catch(error => {
                console.error("Erro ao registrar Service Worker:", error);
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

const VAPID_PUBLIC_KEY =
    "BD9JIHKQ2sBaUxBByxAtv8PgWzjbYnhDKmfTxijWrKtt7HbxjBJXGd1Oa6mk9p_gsgMRVoJGrRPhN7l7sleRC5Y";

const URL_BACKEND =
    "https://plano-alimentar-push.matos-felipe-a78.workers.dev/subscribe";

let ultimoDiaDetectado = null;

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function criarDataComHorario(dataBase, horario) {
    const [hora, minuto] = horario.split(":").map(Number);

    if (Number.isNaN(hora) || Number.isNaN(minuto)) {
        return null;
    }

    const data = new Date(dataBase);
    data.setHours(hora, minuto, 0, 0);
    return data;
}

function obterDataDoDia(offsetDias = 0) {
    const data = new Date();
    data.setDate(data.getDate() + offsetDias);
    data.setHours(0, 0, 0, 0);
    return data;
}

function formatarTempoRestante(dataFutura, prefixo = "Faltam") {
    const diferenca = dataFutura.getTime() - Date.now();

    if (diferenca <= 0) {
        return "Agora";
    }

    const minutosTotais = Math.ceil(diferenca / 60000);
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;

    if (horas > 0) {
        return `${prefixo} ${horas}h ${minutos}min`;
    }

    return `${prefixo} ${minutos} min`;
}

function obterPeriodoDoCard(card, dataBase) {
    const horarioElemento = card.querySelector(".meal-time");

    if (!horarioElemento) {
        return null;
    }

    const inicioTexto = horarioElemento.dataset.start;
    const fimTexto = horarioElemento.dataset.end;

    if (!inicioTexto || !fimTexto) {
        return null;
    }

    const inicio = criarDataComHorario(dataBase, inicioTexto);
    const fim = criarDataComHorario(dataBase, fimTexto);

    if (!inicio || !fim) {
        return null;
    }

    return {
        inicio,
        fim,
        inicioTexto,
        fimTexto,
        periodoTexto: `${inicioTexto} - ${fimTexto}`
    };
}

// ======================================================
// TROCA DOS DIAS
// ======================================================

function switchTab(dayId, button = null) {
    document
        .querySelectorAll(".day-section")
        .forEach(section => section.classList.remove("active"));

    document
        .querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("active"));

    const selectedSection = document.getElementById(dayId);

    if (selectedSection) {
        selectedSection.classList.add("active");
    }

    if (button) {
        button.classList.add("active");
    } else {
        const automaticButton = document.querySelector(
            `[data-day="${dayId}"]`
        );

        if (automaticButton) {
            automaticButton.classList.add("active");
        }
    }
}

window.switchTab = switchTab;

function abrirDiaAtual() {
    const numeroDia = new Date().getDay();
    switchTab(DIAS[numeroDia]);
    ultimoDiaDetectado = numeroDia;
}

// ======================================================
// MACROS DO DIA ATUAL
// ======================================================

function atualizarMacrosDoDia() {
    const hoje = new Date().getDay();

    const metas = {
        0: { calorias: "2.400 kcal", proteina: "150g", carbo: "280g", gordura: "60g" },
        1: { calorias: "2.000 kcal", proteina: "150g", carbo: "210g", gordura: "55g" },
        2: { calorias: "2.000 kcal", proteina: "150g", carbo: "210g", gordura: "55g" },
        3: { calorias: "2.150 kcal", proteina: "150g", carbo: "240g", gordura: "55g" },
        4: { calorias: "2.000 kcal", proteina: "150g", carbo: "210g", gordura: "55g" },
        5: { calorias: "2.150 kcal", proteina: "150g", carbo: "240g", gordura: "55g" },
        6: { calorias: "2.300 kcal", proteina: "140g", carbo: "240g", gordura: "70g" }
    };

    const metaHoje = metas[hoje];

    document.getElementById("macro-calorias").textContent = metaHoje.calorias;
    document.getElementById("macro-proteina").textContent = metaHoje.proteina;
    document.getElementById("macro-carbo").textContent = metaHoje.carbo;
    document.getElementById("macro-gordura").textContent = metaHoje.gordura;
}

// ======================================================
// EVENTOS DOS CARDS
// ======================================================

function obterEventosDoDia(numeroDia, dataBase, tipo) {
    const diaId = DIAS[numeroDia];
    const secaoDoDia = document.getElementById(diaId);

    if (!secaoDoDia) {
        return [];
    }

    const seletor =
        tipo === "meal"
            ? '.meal-card[data-type="meal"]'
            : '.meal-card[data-type="water"]';

    const cards = secaoDoDia.querySelectorAll(seletor);
    const eventos = [];

    cards.forEach(card => {
        const tituloElemento = card.querySelector(".meal-title");
        const periodo = obterPeriodoDoCard(card, dataBase);

        if (!tituloElemento || !periodo) {
            return;
        }

        const titulo = tituloElemento.textContent
            .replace(/^🍽️\s*/, "")
            .replace(/^💧\s*/, "")
            .trim();

        eventos.push({
            titulo,
            card,
            ...periodo
        });
    });

    return eventos;
}

function encontrarEventoAtualOuProximo(tipo) {
    const agora = new Date();

    for (let offset = 0; offset <= 7; offset++) {
        const dataBase = obterDataDoDia(offset);
        const numeroDia = dataBase.getDay();
        const eventos = obterEventosDoDia(numeroDia, dataBase, tipo);

        for (const evento of eventos) {
            if (offset === 0 && agora >= evento.inicio && agora < evento.fim) {
                return {
                    evento,
                    offset,
                    emAndamento: true
                };
            }

            if (evento.inicio > agora) {
                return {
                    evento,
                    offset,
                    emAndamento: false
                };
            }
        }
    }

    return null;
}

function prefixoDia(offset, dataEvento) {
    if (offset === 0) {
        return "";
    }

    if (offset === 1) {
        return "Amanhã • ";
    }

    return `${NOMES_DIAS[dataEvento.getDay()]} • `;
}

// ======================================================
// PRÓXIMA / ATUAL REFEIÇÃO
// ======================================================

function atualizarProximaRefeicao() {
    document
        .querySelectorAll('.meal-card[data-type="meal"]')
        .forEach(card => card.classList.remove("next-meal-highlight"));

    const resultado = encontrarEventoAtualOuProximo("meal");

    const label = document.getElementById("next-meal-label");
    const nome = document.getElementById("next-meal-name");
    const horario = document.getElementById("next-meal-time");
    const countdown = document.getElementById("next-meal-countdown");

    if (!label || !nome || !horario || !countdown) {
        return;
    }

    if (!resultado) {
        label.textContent = "Refeição";
        nome.textContent = "Nenhuma refeição encontrada";
        horario.textContent = "";
        countdown.textContent = "";
        return;
    }

    const { evento, offset, emAndamento } = resultado;
    const prefixo = prefixoDia(offset, evento.inicio);

    if (emAndamento) {
        label.textContent = "Período de alimentação atual";
        nome.textContent = evento.titulo;
        horario.textContent = evento.periodoTexto;
        countdown.textContent = formatarTempoRestante(evento.fim, "Termina em");
    } else {
        label.textContent = "Próxima refeição";
        nome.textContent = prefixo + evento.titulo;
        horario.textContent = evento.periodoTexto;
        countdown.textContent = formatarTempoRestante(evento.inicio);
    }

    evento.card.classList.add("next-meal-highlight");
}

// ======================================================
// PRÓXIMA / ATUAL HIDRATAÇÃO
// ======================================================

function atualizarProximaHidratacao() {
    document
        .querySelectorAll('.meal-card[data-type="water"]')
        .forEach(card => card.classList.remove("next-water-highlight"));

    const resultado = encontrarEventoAtualOuProximo("water");

    const label = document.getElementById("next-water-label");
    const nome = document.getElementById("next-water-name");
    const horario = document.getElementById("next-water-time");
    const countdown = document.getElementById("next-water-countdown");

    if (!label || !nome || !horario || !countdown) {
        return;
    }

    if (!resultado) {
        label.textContent = "Hidratação";
        nome.textContent = "Nenhum lembrete encontrado";
        horario.textContent = "";
        countdown.textContent = "";
        return;
    }

    const { evento, offset, emAndamento } = resultado;
    const prefixo = prefixoDia(offset, evento.inicio);

    if (emAndamento) {
        label.textContent = "Período de hidratação atual";
        nome.textContent = evento.titulo;
        horario.textContent = evento.periodoTexto;
        countdown.textContent = formatarTempoRestante(evento.fim, "Termina em");
    } else {
        label.textContent = "Próxima hidratação";
        nome.textContent = prefixo + evento.titulo;
        horario.textContent = evento.periodoTexto;
        countdown.textContent = formatarTempoRestante(evento.inicio);
    }

    evento.card.classList.add("next-water-highlight");
}

// ======================================================
// PROGRESSO DO CICLO DE 8 SEMANAS
// ======================================================

function atualizarProgressoCiclo() {
    const dataInicio = new Date(2026, 9, 5);
    const totalSemanas = 8;
    const totalDias = totalSemanas * 7;

    dataInicio.setHours(0, 0, 0, 0);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const fimCiclo = new Date(dataInicio);
    fimCiclo.setDate(dataInicio.getDate() + totalDias - 1);

    const diferencaDias = Math.floor((hoje - dataInicio) / 86400000);
    let semanaAtual = Math.floor(diferencaDias / 7) + 1;
    let concluido = hoje > fimCiclo;

    if (semanaAtual < 1) semanaAtual = 1;
    if (semanaAtual > totalSemanas) semanaAtual = totalSemanas;

    const percentual = concluido
        ? 100
        : (semanaAtual / totalSemanas) * 100;

    const inicioSemana = new Date(dataInicio);
    inicioSemana.setDate(dataInicio.getDate() + (semanaAtual - 1) * 7);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);

    const formatar = data => data.toLocaleDateString("pt-BR");

    const semanaElemento = document.getElementById("cycle-week");
    const percentualElemento = document.getElementById("cycle-percentage");
    const barraElemento = document.getElementById("cycle-progress-fill");
    const periodoElemento = document.getElementById("cycle-period");

    if (!semanaElemento || !percentualElemento || !barraElemento || !periodoElemento) {
        return;
    }

    if (concluido) {
        semanaElemento.textContent = "Ciclo concluído • 8/8";
        percentualElemento.textContent = "100%";
        periodoElemento.textContent = `Ciclo: ${formatar(dataInicio)} a ${formatar(fimCiclo)}`;
    } else if (hoje < dataInicio) {
        semanaElemento.textContent = "Ciclo ainda não iniciado";
        percentualElemento.textContent = "0%";
        periodoElemento.textContent = `Início: ${formatar(dataInicio)}`;
        barraElemento.style.width = "0%";
        return;
    } else {
        semanaElemento.textContent = `Semana ${semanaAtual}/8`;
        percentualElemento.textContent = `${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
        periodoElemento.textContent = `${formatar(inicioSemana)} a ${formatar(fimSemana)}`;
    }

    barraElemento.style.width = `${percentual}%`;
}

// ======================================================
// VIRADA DO DIA
// ======================================================

function verificarMudancaDeDia() {
    const diaAtual = new Date().getDay();

    if (ultimoDiaDetectado === null) {
        ultimoDiaDetectado = diaAtual;
        return;
    }

    if (diaAtual !== ultimoDiaDetectado) {
        ultimoDiaDetectado = diaAtual;
        abrirDiaAtual();
        atualizarMacrosDoDia();
        atualizarProgressoCiclo();
    }
}

// ======================================================
// NOTIFICAÇÕES / WEB PUSH
// ======================================================

function atualizarStatusNotificacoes() {
    const statusElemento = document.getElementById("notification-status");
    const botao = document.getElementById("enable-notifications");

    if (!statusElemento || !botao) {
        return;
    }

    if (!("Notification" in window)) {
        statusElemento.textContent = "Este dispositivo não suporta notificações.";
        botao.disabled = true;
        return;
    }

    if (Notification.permission === "granted") {
        statusElemento.textContent = "Notificações ativadas";
        botao.textContent = "Ativadas";
        botao.disabled = true;
        return;
    }

    if (Notification.permission === "denied") {
        statusElemento.textContent = "Permissão bloqueada nas configurações";
        botao.textContent = "Bloqueadas";
        botao.disabled = true;
        return;
    }

    statusElemento.textContent = "Não ativadas";
    botao.textContent = "Ativar notificações";
    botao.disabled = false;
}

async function solicitarPermissaoNotificacoes() {
    if (!("Notification" in window)) {
        alert("Este dispositivo não suporta notificações.");
        return;
    }

    try {
        const permissao = await Notification.requestPermission();
        atualizarStatusNotificacoes();

        if (permissao === "granted") {
            if (!AMBIENTE_LOCAL) {
                await enviarNotificacaoTeste();
                await criarAssinaturaPush();
            }
        }
    } catch (erro) {
        console.error("Erro ao solicitar permissão:", erro);
    }
}

async function enviarNotificacaoTeste() {
    if (
        AMBIENTE_LOCAL ||
        Notification.permission !== "granted" ||
        !("serviceWorker" in navigator)
    ) {
        return;
    }

    try {
        const registro = await navigator.serviceWorker.ready;

        await registro.showNotification(
            "Meu Plano Alimentar",
            {
                body: "Notificações ativadas com sucesso ✅",
                icon: "./icons/icon-192.png",
                badge: "./icons/icon-192.png",
                tag: "teste-notificacao"
            }
        );
    } catch (erro) {
        console.error("Erro ao enviar notificação de teste:", erro);
    }
}

function urlBase64ParaUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(char => char.charCodeAt(0))
    );
}

async function criarAssinaturaPush() {
    if (AMBIENTE_LOCAL) {
        return null;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Web Push não suportado neste dispositivo.");
        return null;
    }

    if (Notification.permission !== "granted") {
        return null;
    }

    try {
        const registro = await navigator.serviceWorker.ready;

        let assinatura = await registro.pushManager.getSubscription();

        if (!assinatura) {
            assinatura = await registro.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ParaUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        await salvarAssinaturaNoBackend(assinatura);
        return assinatura;
    } catch (erro) {
        console.error("Erro ao criar assinatura Push:", erro);
        return null;
    }
}

async function salvarAssinaturaNoBackend(assinatura) {
    try {
        const resposta = await fetch(URL_BACKEND, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(assinatura)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error("Erro retornado pelo backend:", dados);
            return;
        }

        console.log("Assinatura salva no backend:", dados);
    } catch (erro) {
        console.error("Erro ao enviar assinatura ao backend:", erro);
    }
}

function configurarBotaoNotificacoes() {
    const botao = document.getElementById("enable-notifications");

    if (!botao) {
        return;
    }

    botao.addEventListener("click", solicitarPermissaoNotificacoes);
    atualizarStatusNotificacoes();
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    abrirDiaAtual();
    atualizarMacrosDoDia();
    atualizarProgressoCiclo();
    atualizarProximaRefeicao();
    atualizarProximaHidratacao();
    configurarBotaoNotificacoes();

    if (
        !AMBIENTE_LOCAL &&
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        criarAssinaturaPush();
    }
});

setInterval(() => {
    verificarMudancaDeDia();
    atualizarProximaRefeicao();
    atualizarProximaHidratacao();
}, 60000);
