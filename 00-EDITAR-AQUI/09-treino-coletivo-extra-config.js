// Arquivo editavel pelo administrador do site.
// Use este arquivo para abrir, fechar e configurar o segundo treino coletivo.
const collectiveExtraSystemConfig = window.VIDA_CORRIDA_SYSTEM_CONFIG || {};
const collectiveExtraSharedGoogleScriptUrl = String(
  ((collectiveExtraSystemConfig.googleAppsScript || {}).url) ||
  "https://script.google.com/macros/s/AKfycbwLuQlpLIMw2j0s4sc0Ytjwt3WAQEjqfM4Avgrwtr8baNuh1nXZLphqFbiz18BCMhHR/exec"
).trim();
const collectiveExtraSharedConfig = collectiveExtraSystemConfig.collectiveTrainingSecondary || {};

window.COLLECTIVE_TRAINING_CONFIG = {
  // Coloque true para exibir a pagina e liberar o segundo evento.
  // Coloque false quando nao houver este evento aberto.
  enabled: true,

  // A URL principal do Apps Script fica em 01-sistema-config.js.
  googleScriptUrl: collectiveExtraSharedGoogleScriptUrl,

  // Mantenha true para a lista mostrar apenas o que estiver salvo online na planilha.
  // Troque para false apenas se quiser permitir funcionamento local no navegador.
  googleSheetsOnlyMode: collectiveExtraSharedConfig.googleSheetsOnlyMode !== false,

  // Nao precisa alterar estas duas linhas, a menos que o backend do Apps Script mude.
  listAction: String(collectiveExtraSharedConfig.listAction || "collective-training-list").trim(),
  resource: String(collectiveExtraSharedConfig.resource || "collectiveTrainingSecondary").trim(),
  session: {
    // Atualize os campos abaixo sempre que abrir uma nova lista de presenca.

    // Identificador unico da sessao.
    // Sugestao de formato: treino-coletivo-extra-AAAA-MM-DD-HHMM
    id: "treino-coletivo-extra-2026-04-26-0930",

    // Titulo exibido na pagina e usado no resumo enviado ao Telegram.
    title: "TREINO COLETIVO - EVENTO 2",

    // Texto curto de apoio exibido abaixo do titulo da pagina.
    description: "Use esta pagina para abrir um segundo evento sem misturar as mensagens do outro treino.",

    // Data e horario do treino no formato ISO com fuso.
    startsAtIso: "2026-04-26T09:30:00-03:00",

    // Prazo final para decidir se o treino vai acontecer.
    decisionDeadlineIso: "2026-04-25T22:00:00-03:00",

    // Local que aparecera na pagina e na mensagem do Telegram.
    location: "DEFINIR LOCAL DO EVENTO 2",

    // Quantidade minima de confirmacoes para o treino ser considerado confirmado.
    minimumParticipants: 5,

    // Deixe automatic para usar a regra normal do minimo de atletas.
    // Troque para cancelled quando precisar cancelar manualmente por clima ou outro motivo.
    statusMode: "automatic",

    // Motivo opcional para aparecer no site e no Telegram quando statusMode estiver como cancelled.
    statusReason: ""
  }
};
