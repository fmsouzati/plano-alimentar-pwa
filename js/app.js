console.log("Aplicativo carregado com sucesso. • frontend v12");

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
            .register("./service-worker.js?v=12")
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
        0: { calorias: "2.300 kcal", proteina: "140g", carbo: "240g", gordura: "70g" },
        1: { calorias: "2.000 kcal", proteina: "150g", carbo: "210g", gordura: "55g" },
        2: { calorias: "2.000 kcal", proteina: "150g", carbo: "210g", gordura: "55g" },
        3: { calorias: "2.150 kcal", proteina: "150g", carbo: "240g", gordura: "55g" },
        4: { calorias: "2.000 kcal", proteina: "150g", carbo: "210g", gordura: "55g" },
        5: { calorias: "2.150 kcal", proteina: "150g", carbo: "240g", gordura: "55g" },
        6: { calorias: "2.400 kcal", proteina: "150g", carbo: "280g", gordura: "60g" }
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
// PROGRESSO DO CICLO INTEGRADO DE 16 SEMANAS
// ======================================================

function atualizarProgressoCiclo() {
    const dataInicio = new Date(2026, 9, 25);
    const totalSemanas = 16;
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
        semanaElemento.textContent = "Ciclo concluído • 16/16";
        percentualElemento.textContent = "100%";
        periodoElemento.textContent = `Ciclo: ${formatar(dataInicio)} a ${formatar(fimCiclo)}`;
    } else if (hoje < dataInicio) {
        semanaElemento.textContent = "Ciclo ainda não iniciado";
        percentualElemento.textContent = "0%";
        periodoElemento.textContent = `Início: ${formatar(dataInicio)}`;
        barraElemento.style.width = "0%";
        return;
    } else {
        semanaElemento.textContent = `Semana ${semanaAtual}/16`;
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
// NAVEGAÇÃO PRINCIPAL / TREINOS
// ======================================================

const INICIO_CICLO = new Date(2026, 9, 25);
const TOTAL_SEMANAS = 16;

const PLANO_CORRIDA_16_SEMANAS = [
    { semana: 1, fase: "Base & adaptação", terca: "6 km Z2 + bloco moderado curto", quinta: "Funcional intenso", sabado: "10 km Z2" },
    { semana: 2, fase: "Base & adaptação", terca: "7 km Z2", quinta: "Tiros: 6 × 400 m, recuperação leve", sabado: "11 km Z2" },
    { semana: 3, fase: "Base & adaptação", terca: "7–8 km com 3 km moderados", quinta: "Funcional intenso", sabado: "12 km Z2" },
    { semana: 4, fase: "Redução", terca: "6 km leve", quinta: "Tiros controlados: 4 × 400 m", sabado: "9–10 km Z2" },
    { semana: 5, fase: "Desenvolvimento", terca: "8 km com bloco de ritmo", quinta: "Funcional intenso", sabado: "13 km Z2" },
    { semana: 6, fase: "Desenvolvimento", terca: "8 km Z2", quinta: "Tiros: 4–5 × 800 m", sabado: "14 km Z2" },
    { semana: 7, fase: "Desenvolvimento", terca: "8–9 km com ritmo", quinta: "Funcional intenso", sabado: "15 km Z2" },
    { semana: 8, fase: "Redução", terca: "7 km leve", quinta: "Tiros reduzidos: 4 × 400 m", sabado: "11–12 km Z2" },
    { semana: 9, fase: "Específica 21K", terca: "9 km com trecho moderado", quinta: "Funcional intenso", sabado: "16 km Z2" },
    { semana: 10, fase: "Específica 21K", terca: "8–9 km Z2", quinta: "Tiros: 4–5 × 1 km", sabado: "17 km Z2" },
    { semana: 11, fase: "Específica 21K", terca: "9–10 km com ritmo sustentado", quinta: "Funcional intenso", sabado: "18 km Z2" },
    { semana: 12, fase: "Redução", terca: "7–8 km leve", quinta: "Tiros controlados, volume reduzido", sabado: "13–14 km Z2" },
    { semana: 13, fase: "Pico específico", terca: "9–10 km com ritmo", quinta: "Funcional intenso", sabado: "18 km Z2" },
    { semana: 14, fase: "Pico específico", terca: "8 km Z2", quinta: "Último treino forte de tiros: 4 × 1 km", sabado: "19–20 km Z2" },
    { semana: 15, fase: "Taper", terca: "7 km leve", quinta: "Funcional moderado, sem buscar fadiga máxima", sabado: "12–14 km Z2" },
    { semana: 16, fase: "Taper & meta", terca: "5–6 km leve", quinta: "Corrida curta + 2–4 acelerações", sabado: "21,1 km • meta" }
];

function obterSemanaCiclo() {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const inicio = new Date(INICIO_CICLO); inicio.setHours(0,0,0,0);
    const dias = Math.floor((hoje - inicio) / 86400000);
    let semana = Math.floor(dias / 7) + 1;
    if (semana < 1) semana = 1;
    if (semana > TOTAL_SEMANAS) semana = TOTAL_SEMANAS;
    return semana;
}

function openScreen(screen, trainingTab = null) {
    document.querySelectorAll('.app-screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`screen-${screen}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('[data-screen-nav]').forEach(btn => btn.classList.toggle('active', btn.dataset.screenNav === screen));
    if (screen === 'training' && trainingTab) switchTrainingTab(trainingTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.openScreen = openScreen;

function openFoodTab(dayId) {
    openScreen('food');
    switchTab(dayId);
}
window.openFoodTab = openFoodTab;

function openFoodToday() {
    openScreen('food');
    abrirDiaAtual();
}
window.openFoodToday = openFoodToday;

function switchTrainingTab(tab) {
    document.querySelectorAll('.training-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.training-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`training-${tab}`)?.classList.add('active');
    document.querySelector(`[data-training-tab="${tab}"]`)?.classList.add('active');

    // Revalida os cards ao abrir a aba Corrida. Isso também protege contra
    // estados antigos do PWA após uma atualização de frontend.
    if (tab === 'running') {
        if (!semanaCorridaSelecionada) semanaCorridaSelecionada = obterSemanaCiclo();
        requestAnimationFrame(() => renderizarSemanaCorrida(semanaCorridaSelecionada));
    }
}
window.switchTrainingTab = switchTrainingTab;

function atualizarResumoHome() {
    const semana = obterSemanaCiclo();
    const percentual = (semana / TOTAL_SEMANAS) * 100;
    const inicio = new Date(INICIO_CICLO); inicio.setDate(inicio.getDate() + (semana - 1) * 7);
    const fim = new Date(inicio); fim.setDate(inicio.getDate() + 6);
    const f = d => d.toLocaleDateString('pt-BR');
    document.getElementById('home-cycle-week').textContent = `Semana ${semana}/16`;
    document.getElementById('home-cycle-percentage').textContent = `${percentual.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
    document.getElementById('home-cycle-period').textContent = `${f(inicio)} a ${f(fim)}`;
    document.getElementById('home-cycle-progress-fill').style.width = `${percentual}%`;
}

function treinamentoDoDia() {
    const semana = obterSemanaCiclo();
    const plano = PLANO_CORRIDA_16_SEMANAS[semana - 1];
    const dia = new Date().getDay();
    const mapa = {
        1: 'Full Body A + esteira inclinada 15–20 min',
        2: `Corrida • ${plano.terca}`,
        3: 'Full Body B + bike/elíptico leve 10–15 min',
        4: plano.quinta,
        5: 'Full Body C + esteira inclinada 10–15 min',
        6: `Longão • ${plano.sabado}`,
        0: 'Descanso total • mobilidade leve opcional'
    };
    return mapa[dia];
}

function dataInicioDaSemana(numeroSemana) {
    const inicio = new Date(INICIO_CICLO);
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() + (numeroSemana - 1) * 7);
    return inicio;
}

function formatarDataCurta(data) {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatarDataCompleta(data) {
    return data.toLocaleDateString("pt-BR");
}

function periodoDaSemana(numeroSemana) {
    const inicio = dataInicioDaSemana(numeroSemana);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return { inicio, fim };
}

function renderizarSemanaTreino() {
    const semana = obterSemanaCiclo();
    const plano = PLANO_CORRIDA_16_SEMANAS[semana - 1];
    const { inicio, fim } = periodoDaSemana(semana);

    document.getElementById("training-current-week").textContent = `Semana ${semana}/16`;
    document.getElementById("training-phase").textContent = plano.fase;
    document.getElementById("training-week-period").textContent = `${formatarDataCompleta(inicio)} a ${formatarDataCompleta(fim)}`;
    document.getElementById("home-today-training").textContent = treinamentoDoDia();

    const atividades = [
        { offset:0, sigla:"DOM", titulo:"Descanso total", detalhe:"Recovery • mobilidade leve opcional", tipo:"rest", icone:"🌿", curto:"Descanso" },
        { offset:1, sigla:"SEG", titulo:"Full Body A + Esteira leve", detalhe:"Força total • esteira inclinada 15–20 min Z2", tipo:"strength", icone:"🏋️", curto:"FB A" },
        { offset:2, sigla:"TER", titulo:"Corrida", detalhe:plano.terca, tipo:"run", icone:"🏃", curto:"Corrida" },
        { offset:3, sigla:"QUA", titulo:"Full Body B + Cardio leve", detalhe:"Força total • bike/elíptico 10–15 min", tipo:"strength", icone:"🏋️", curto:"FB B" },
        { offset:4, sigla:"QUI", titulo:plano.quinta, detalhe:plano.quinta.includes("Funcional") ? "Aula intensa com a professora" : "Sessão de qualidade da corrida", tipo:"run", icone:plano.quinta.includes("Funcional") ? "⚡" : "🏃", curto:plano.quinta.includes("Funcional") ? "Funcional" : "Tiros" },
        { offset:5, sigla:"SEX", titulo:"Full Body C + Esteira leve", detalhe:"Força total • esteira inclinada 10–15 min", tipo:"strength", icone:"🏋️", curto:"FB C" },
        { offset:6, sigla:"SÁB", titulo:"Longão", detalhe:plano.sabado, tipo:"run", icone:"🏃", curto:"Longão" }
    ];

    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const dias = atividades.map(item => {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + item.offset);
        return { ...item, data };
    });

    document.getElementById("training-week-days").innerHTML = dias.map(item => {
        const ehHoje = item.data.getTime() === hoje.getTime();
        return `<div class="week-day-chip ${ehHoje ? "today" : ""}" title="${item.titulo}"><span class="wd-name">${item.sigla}</span><span class="wd-date">${formatarDataCurta(item.data)}</span><span class="wd-icon">${item.icone}</span><span class="wd-short">${item.curto}</span></div>`;
    }).join("");

    document.getElementById("weekly-training-list").innerHTML = dias.map(item => `<div class="training-card"><div class="training-day ${item.tipo === "run" ? "run" : item.tipo === "rest" ? "rest" : ""}">${item.sigla}<span class="training-date">${formatarDataCurta(item.data)}</span></div><div><h3>${item.titulo}</h3><p>${item.detalhe}</p></div></div>`).join("");

}

let semanaCorridaSelecionada = null;

function obterDataSessaoCorrida(numeroSemana, offset) {
    const inicio = dataInicioDaSemana(numeroSemana);
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + offset);
    data.setHours(0,0,0,0);
    return data;
}

function tipoSessaoQuinta(texto) {
    if (texto.includes("Funcional")) {
        return { titulo:"Funcional", icone:"⚡", classe:"functional", tipo:"Condicionamento" };
    }
    return { titulo:"Tiros / qualidade", icone:"🏃", classe:"", tipo:"Velocidade" };
}

function renderizarSemanaCorrida(numeroSemana = semanaCorridaSelecionada || obterSemanaCiclo()) {
    const semana = Math.max(1, Math.min(TOTAL_SEMANAS, numeroSemana));
    semanaCorridaSelecionada = semana;
    const plano = PLANO_CORRIDA_16_SEMANAS[semana - 1];
    const { inicio, fim } = periodoDaSemana(semana);
    const semanaAtual = obterSemanaCiclo();

    const label = document.getElementById("running-selected-label");
    const period = document.getElementById("running-selected-period");
    if (label) label.textContent = `Semana ${semana}/16 • ${plano.fase}`;
    if (period) period.textContent = `${formatarDataCompleta(inicio)} a ${formatarDataCompleta(fim)}`;

    const quinta = tipoSessaoQuinta(plano.quinta);
    const sessoes = [
        { dia:"Terça", offset:2, titulo:"Rodagem / ritmo", detalhe:plano.terca, icone:"🏃", classe:"tuesday", tipo:"Corrida" },
        { dia:"Quinta", offset:4, titulo:quinta.titulo, detalhe:plano.quinta, icone:quinta.icone, classe:"thursday", tipo:plano.quinta.includes("Funcional") ? "Condic." : "Velocidade" },
        { dia:"Sábado", offset:6, titulo:"Longão", detalhe:plano.sabado, icone:"🏃", classe:"saturday", tipo:"Resist." }
    ];

    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const cards = document.getElementById("running-week-cards");
    if (cards) {
        cards.innerHTML = sessoes.map(sessao => {
            const data = obterDataSessaoCorrida(semana, sessao.offset);
            const ehHoje = data.getTime() === hoje.getTime();
            return `<article class="running-session-card ${sessao.classe} ${ehHoje ? "today" : ""}" aria-label="${sessao.dia}, ${formatarDataCurta(data)}: ${sessao.titulo}. ${sessao.detalhe}"><span class="run-icon" aria-hidden="true">${sessao.icone}</span><div class="run-card-head"><span class="run-day">${sessao.dia}</span><span class="run-date">${formatarDataCurta(data)}</span></div><h3>${sessao.titulo}</h3><p>${sessao.detalhe}</p><span class="run-kind">${sessao.tipo}</span></article>`;
        }).join("");
    }

    const anterior = document.getElementById("running-prev-week");
    const proxima = document.getElementById("running-next-week");
    if (anterior) anterior.disabled = semana <= 1;
    if (proxima) proxima.disabled = semana >= TOTAL_SEMANAS;
}

function configurarNavegacaoCorrida() {
    semanaCorridaSelecionada = obterSemanaCiclo();
    const anterior = document.getElementById("running-prev-week");
    const proxima = document.getElementById("running-next-week");

    if (anterior) anterior.onclick = () => renderizarSemanaCorrida((semanaCorridaSelecionada || 1) - 1);
    if (proxima) proxima.onclick = () => renderizarSemanaCorrida((semanaCorridaSelecionada || 1) + 1);

    renderizarSemanaCorrida(semanaCorridaSelecionada);
}

function switchFullBodyTab(tab) {
    document.querySelectorAll(".fullbody-panel").forEach(panel => panel.classList.remove("active"));
    document.querySelectorAll(".fullbody-subtab-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`fullbody-${tab}`)?.classList.add("active");
    document.querySelector(`[data-fullbody-tab="${tab}"]`)?.classList.add("active");
}
window.switchFullBodyTab = switchFullBodyTab;

// ======================================================
// TIMERS DE DESCANSO DO FULL BODY
// Baseados no relógio real para sobreviver à suspensão do app.
// ======================================================

const timersDescanso = {};
let intervaloGlobalDescanso = null;

function estadoPadraoTimer() { return { originalSegundos:90, restanteSegundos:90, emExecucao:false, alvoTimestamp:null }; }
function chaveStorageTimer(id) { return `plano-hibrido:timer-descanso:${id}`; }
function carregarEstadoTimer(id) { try { const salvo=localStorage.getItem(chaveStorageTimer(id)); const estado=salvo?{...estadoPadraoTimer(),...JSON.parse(salvo)}:estadoPadraoTimer(); if(estado.emExecucao&&estado.alvoTimestamp) estado.restanteSegundos=Math.ceil((estado.alvoTimestamp-Date.now())/1000); return estado; } catch { return estadoPadraoTimer(); } }
function salvarEstadoTimer(id) { try { localStorage.setItem(chaveStorageTimer(id),JSON.stringify(timersDescanso[id])); } catch {} }
function atualizarRestantePeloRelogio(estado) { if(estado.emExecucao&&estado.alvoTimestamp) estado.restanteSegundos=Math.ceil((estado.alvoTimestamp-Date.now())/1000); }
function formatarTimerDescanso(segundos) { const negativo=segundos<0; const abs=Math.abs(segundos); return `${negativo?"-":""}${String(Math.floor(abs/60)).padStart(2,"0")}:${String(abs%60).padStart(2,"0")}`; }
function atualizarInterfaceTimer(id) {
    const card = document.querySelector(`[data-timer-id="${id}"]`);
    const estado = timersDescanso[id];
    if (!card || !estado) return;

    atualizarRestantePeloRelogio(estado);

    const display = card.querySelector('[data-role="display"]');
    const status = card.querySelector('[data-role="status"]');
    const toggle = card.querySelector('[data-role="toggle"]');

    display.textContent = formatarTimerDescanso(estado.restanteSegundos);
    display.classList.toggle("overtime", estado.restanteSegundos < 0);

    toggle.textContent = estado.emExecucao ? "⏸ Parar" : "▶ Play";
    toggle.setAttribute("aria-pressed", estado.emExecucao ? "true" : "false");

    status.textContent = estado.emExecucao
        ? (estado.restanteSegundos < 0 ? "Tempo excedido" : `Rodando • ${estado.originalSegundos}s`)
        : (estado.restanteSegundos < 0 ? "Parado • excedido" : `Preparado • ${estado.originalSegundos}s`);

    card.querySelectorAll('[data-role="preset"]').forEach(btn => {
        const ativo = Number(btn.dataset.seconds) === estado.originalSegundos;
        btn.classList.toggle("active", ativo);
        btn.setAttribute("aria-pressed", ativo ? "true" : "false");
    });
}
function atualizarTodosTimers(){Object.keys(timersDescanso).forEach(atualizarInterfaceTimer);}
function iniciarTimer(id){const e=timersDescanso[id]; if(!e||e.emExecucao)return; e.emExecucao=true; e.alvoTimestamp=Date.now()+e.restanteSegundos*1000; salvarEstadoTimer(id); atualizarInterfaceTimer(id);}
function pararTimer(id){const e=timersDescanso[id]; if(!e)return; atualizarRestantePeloRelogio(e); e.emExecucao=false; e.alvoTimestamp=null; salvarEstadoTimer(id); atualizarInterfaceTimer(id);}
function selecionarTempoTimer(id,segundos){const e=timersDescanso[id]; e.originalSegundos=segundos; e.restanteSegundos=segundos; e.emExecucao=true; e.alvoTimestamp=Date.now()+segundos*1000; salvarEstadoTimer(id); atualizarInterfaceTimer(id);}
function reiniciarTimer(id){const e=timersDescanso[id]; e.restanteSegundos=e.originalSegundos; e.emExecucao=false; e.alvoTimestamp=null; salvarEstadoTimer(id); atualizarInterfaceTimer(id);}
function adicionarTempoTimer(id,segundos=30){const e=timersDescanso[id]; atualizarRestantePeloRelogio(e); e.restanteSegundos+=segundos; if(e.emExecucao)e.alvoTimestamp=Date.now()+e.restanteSegundos*1000; salvarEstadoTimer(id); atualizarInterfaceTimer(id);}
function configurarTimersDescanso(){document.querySelectorAll('[data-timer-id]').forEach(card=>{const id=card.dataset.timerId; timersDescanso[id]=carregarEstadoTimer(id); card.querySelectorAll('[data-role="preset"]').forEach(btn=>btn.addEventListener("click",()=>selecionarTempoTimer(id,Number(btn.dataset.seconds)))); card.querySelector('[data-role="toggle"]')?.addEventListener("click",()=>timersDescanso[id].emExecucao?pararTimer(id):iniciarTimer(id)); card.querySelector('[data-role="reset"]')?.addEventListener("click",()=>reiniciarTimer(id)); card.querySelector('[data-role="add"]')?.addEventListener("click",()=>adicionarTempoTimer(id,30)); atualizarInterfaceTimer(id);}); if(intervaloGlobalDescanso)clearInterval(intervaloGlobalDescanso); intervaloGlobalDescanso=setInterval(atualizarTodosTimers,250); document.addEventListener("visibilitychange",()=>{if(!document.hidden)atualizarTodosTimers();}); window.addEventListener("pageshow",atualizarTodosTimers); window.addEventListener("focus",atualizarTodosTimers);}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    abrirDiaAtual();
    atualizarMacrosDoDia();
    atualizarProgressoCiclo();
    atualizarResumoHome();
    renderizarSemanaTreino();
    configurarNavegacaoCorrida();
    configurarTimersDescanso();
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
