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

function renderizarSemanaTreino() {
    const semana = obterSemanaCiclo();
    const plano = PLANO_CORRIDA_16_SEMANAS[semana - 1];
    document.getElementById('training-current-week').textContent = `Semana ${semana}/16`;
    document.getElementById('training-phase').textContent = plano.fase;
    document.getElementById('home-today-training').textContent = treinamentoDoDia();

    const dias = [
        ['SEG','Full Body A + Esteira leve','Força total • esteira inclinada 15–20 min Z2','strength'],
        ['TER','Corrida',plano.terca,'run'],
        ['QUA','Full Body B + Cardio leve','Força total • bike/elíptico 10–15 min','strength'],
        ['QUI',plano.quinta, plano.quinta.includes('Funcional') ? 'Aula intensa com a professora' : 'Sessão de qualidade da corrida','run'],
        ['SEX','Full Body C + Esteira leve','Força total • esteira inclinada 10–15 min','strength'],
        ['SÁB','Longão',plano.sabado,'run'],
        ['DOM','Descanso total','Recovery • mobilidade leve opcional','rest']
    ];
    const root=document.getElementById('weekly-training-list');
    root.innerHTML=dias.map(([d,t,det,type])=>`<div class="training-card"><div class="training-day ${type==='run'?'run':type==='rest'?'rest':''}">${d}</div><div><h3>${t}</h3><p>${det}</p></div></div>`).join('');

    document.getElementById('current-running-week').innerHTML=`<div class="training-summary-top"><strong>Semana ${semana}/16 • ${plano.fase}</strong><span>Meta 21,1 km</span></div><p style="margin:8px 0 0;font-size:.76rem;color:#475569"><b>Terça:</b> ${plano.terca}<br><b>Quinta:</b> ${plano.quinta}<br><b>Sábado:</b> ${plano.sabado}</p>`;
}

function renderizarPlanoCorridaCompleto() {
    const root=document.getElementById('running-plan-list');
    root.innerHTML=PLANO_CORRIDA_16_SEMANAS.map(p=>`<div class="phase-card"><strong>Semana ${p.semana} • ${p.fase}</strong><p>Ter: ${p.terca}<br>Qui: ${p.quinta}<br>Sáb: ${p.sabado}</p></div>`).join('');
}

// ======================================================
// TIMER DE DESCANSO DO FULL BODY
// ======================================================

let descansoOriginalSegundos = 90;
let descansoRestanteSegundos = 90;
let descansoEmExecucao = false;
let intervaloDescanso = null;

function formatarTimerDescanso(segundos) {
    const negativo = segundos < 0;
    const absoluto = Math.abs(segundos);
    const minutos = Math.floor(absoluto / 60);
    const segundosRestantes = absoluto % 60;
    return `${negativo ? "-" : ""}${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
}

function atualizarInterfaceTimerDescanso() {
    const display = document.getElementById("rest-timer-display");
    const status = document.getElementById("rest-timer-status");
    const botaoToggle = document.getElementById("rest-toggle-button");

    if (!display || !status || !botaoToggle) return;

    display.textContent = formatarTimerDescanso(descansoRestanteSegundos);
    display.classList.toggle("overtime", descansoRestanteSegundos < 0);

    if (descansoEmExecucao) {
        botaoToggle.textContent = "⏸ Parar";
        status.textContent = descansoRestanteSegundos < 0 ? "Tempo excedido" : `Descanso de ${descansoOriginalSegundos}s`;
    } else {
        botaoToggle.textContent = "▶ Play";
        status.textContent = descansoRestanteSegundos < 0 ? "Parado no tempo excedido" : `Preparado • ${descansoOriginalSegundos}s`;
    }

    document.querySelectorAll("[data-rest-seconds]").forEach(botao => {
        botao.classList.toggle(
            "active",
            Number(botao.dataset.restSeconds) === descansoOriginalSegundos
        );
    });
}

function pararTimerDescanso() {
    descansoEmExecucao = false;
    if (intervaloDescanso) {
        clearInterval(intervaloDescanso);
        intervaloDescanso = null;
    }
    atualizarInterfaceTimerDescanso();
}

function iniciarTimerDescanso() {
    if (descansoEmExecucao) return;

    descansoEmExecucao = true;
    atualizarInterfaceTimerDescanso();

    intervaloDescanso = setInterval(() => {
        descansoRestanteSegundos -= 1;
        atualizarInterfaceTimerDescanso();
    }, 1000);
}

function selecionarTempoDescanso(segundos) {
    pararTimerDescanso();
    descansoOriginalSegundos = segundos;
    descansoRestanteSegundos = segundos;
    iniciarTimerDescanso();
}

function reiniciarTimerDescanso() {
    pararTimerDescanso();
    descansoRestanteSegundos = descansoOriginalSegundos;
    atualizarInterfaceTimerDescanso();
}

function adicionarTempoDescanso(segundos = 30) {
    descansoRestanteSegundos += segundos;
    atualizarInterfaceTimerDescanso();
}

function configurarTimerDescanso() {
    const botaoToggle = document.getElementById("rest-toggle-button");
    const botaoReset = document.getElementById("rest-reset-button");
    const botaoAdd = document.getElementById("rest-add-button");

    document.querySelectorAll("[data-rest-seconds]").forEach(botao => {
        botao.addEventListener("click", () => {
            selecionarTempoDescanso(Number(botao.dataset.restSeconds));
        });
    });

    botaoToggle?.addEventListener("click", () => {
        if (descansoEmExecucao) {
            pararTimerDescanso();
        } else {
            iniciarTimerDescanso();
        }
    });

    botaoReset?.addEventListener("click", reiniciarTimerDescanso);
    botaoAdd?.addEventListener("click", () => adicionarTempoDescanso(30));

    atualizarInterfaceTimerDescanso();
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    abrirDiaAtual();
    atualizarMacrosDoDia();
    atualizarProgressoCiclo();
    atualizarResumoHome();
    renderizarSemanaTreino();
    renderizarPlanoCorridaCompleto();
    configurarTimerDescanso();
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
