(function () {
  const systemConfig = window.VIDA_CORRIDA_SYSTEM_CONFIG || {};
  const googleScriptUrl = String(
    ((systemConfig.googleAppsScript || {}).url) || ""
  ).trim();
  const ADMIN_TOKEN_KEY = "vida-corrida-admin-token";
  const ADMIN_TIME_ZONE_OFFSET = "-03:00";

  const loginForm = document.getElementById("admin-login-form");
  const passwordInput = document.getElementById("admin-password");
  const loginButton = document.getElementById("admin-login-button");
  const logoutButton = document.getElementById("admin-logout-button");
  const configForm = document.getElementById("admin-config-form");
  const refreshButton = document.getElementById("admin-refresh-button");
  const statusElement = document.getElementById("admin-status");
  const toastElement = document.getElementById("admin-toast");
  const loginPanel = document.getElementById("admin-login-panel");
  const configPanel = document.getElementById("admin-config-panel");

  const fields = {
    kitLocked: document.getElementById("admin-kit-locked"),
    kitSubmitLocked: document.getElementById("admin-kit-submit-locked"),
    kitEventName: document.getElementById("admin-kit-event-name"),
    kitPickupTip: document.getElementById("admin-kit-pickup-tip"),
    collectiveEnabled: document.getElementById("admin-collective-enabled"),
    collectiveId: document.getElementById("admin-collective-id"),
    collectiveTitle: document.getElementById("admin-collective-title"),
    collectiveDescription: document.getElementById("admin-collective-description"),
    collectiveStartDate: document.getElementById("admin-collective-start-date"),
    collectiveStartTime: document.getElementById("admin-collective-start-time"),
    collectiveDeadlineDate: document.getElementById("admin-collective-deadline-date"),
    collectiveDeadlineTime: document.getElementById("admin-collective-deadline-time"),
    collectiveLocation: document.getElementById("admin-collective-location"),
    collectiveMinimumParticipants: document.getElementById("admin-collective-minimum"),
    collectiveStatusMode: document.getElementById("admin-collective-status-mode"),
    collectiveStatusReason: document.getElementById("admin-collective-status-reason"),
    collectiveSecondaryEnabled: document.getElementById("admin-collective-secondary-enabled"),
    collectiveSecondaryId: document.getElementById("admin-collective-secondary-id"),
    collectiveSecondaryTitle: document.getElementById("admin-collective-secondary-title"),
    collectiveSecondaryDescription: document.getElementById("admin-collective-secondary-description"),
    collectiveSecondaryStartDate: document.getElementById("admin-collective-secondary-start-date"),
    collectiveSecondaryStartTime: document.getElementById("admin-collective-secondary-start-time"),
    collectiveSecondaryDeadlineDate: document.getElementById("admin-collective-secondary-deadline-date"),
    collectiveSecondaryDeadlineTime: document.getElementById("admin-collective-secondary-deadline-time"),
    collectiveSecondaryLocation: document.getElementById("admin-collective-secondary-location"),
    collectiveSecondaryMinimumParticipants: document.getElementById("admin-collective-secondary-minimum"),
    collectiveSecondaryStatusMode: document.getElementById("admin-collective-secondary-status-mode"),
    collectiveSecondaryStatusReason: document.getElementById("admin-collective-secondary-status-reason"),
    guideStravaGroupUrl: document.getElementById("admin-guide-strava"),
    guideHandbookUrl: document.getElementById("admin-guide-handbook"),
    guideFeedbackUrl: document.getElementById("admin-guide-feedback")
  };

  let adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  let toastTimeoutId = null;

  if (!loginForm || !configForm || !statusElement) {
    return;
  }

  loginForm.addEventListener("submit", handleLoginSubmit);
  configForm.addEventListener("submit", handleConfigSubmit);

  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      void loadConfig();
    });
  }

  if (!googleScriptUrl) {
    showStatus("Configure a URL do Apps Script em 00-EDITAR-AQUI/01-sistema-config.js.", true);
    setLoginDisabled(true);
    return;
  }

  if (adminToken) {
    void loadConfig();
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const password = String(passwordInput.value || "");
    if (!password) {
      showStatus("Digite a senha do painel.", true);
      passwordInput.focus();
      return;
    }

    setLoginDisabled(true);
    showStatus("Entrando...");

    try {
      const data = await postAdmin({
        action: "login",
        password
      });

      if (!data.ok) {
        throw new Error(getAdminErrorMessage(data.message || "Nao foi possivel entrar."));
      }

      adminToken = String(data.token || "");
      sessionStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      passwordInput.value = "";
      fillForm(data.config || {});
      showConfigPanel();
      showStatus("Acesso liberado.", false, true);
    } catch (error) {
      adminToken = "";
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      showLoginPanel();
      showStatus(error.message || "Nao foi possivel entrar.", true);
    } finally {
      setLoginDisabled(false);
    }
  }

  async function handleConfigSubmit(event) {
    event.preventDefault();

    if (!adminToken) {
      showLoginPanel();
      showStatus("Entre novamente para salvar.", true);
      return;
    }

    setConfigDisabled(true);
    showStatus("Salvando configuracoes...");

    try {
      const data = await postAdmin({
        action: "saveConfig",
        token: adminToken,
        config: readForm()
      });

      if (!data.ok) {
        throw new Error(getAdminErrorMessage(data.message || "Nao foi possivel salvar."));
      }

      fillForm(data.config || {});
      showStatus("Configuracoes salvas. As paginas publicas ja podem carregar os novos dados.", false, true);
      showToast("Configuracoes salvas com sucesso.");
    } catch (error) {
      if (/sessao/i.test(error.message || "")) {
        handleLogout();
      }

      showStatus(error.message || "Nao foi possivel salvar.", true);
      showToast(error.message || "Nao foi possivel salvar.", true);
    } finally {
      setConfigDisabled(false);
    }
  }

  async function loadConfig() {
    if (!adminToken) {
      showLoginPanel();
      return;
    }

    setConfigDisabled(true);
    showStatus("Carregando configuracoes...");

    try {
      const data = await postAdmin({
        action: "getConfig",
        token: adminToken
      });

      if (!data.ok) {
        throw new Error(getAdminErrorMessage(data.message || "Nao foi possivel carregar."));
      }

      fillForm(data.config || {});
      showConfigPanel();
      showStatus("Configuracoes carregadas.", false, true);
    } catch (error) {
      adminToken = "";
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      showLoginPanel();
      showStatus(error.message || "Entre novamente para acessar o painel.", true);
    } finally {
      setConfigDisabled(false);
    }
  }

  async function postAdmin(payload) {
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        resource: "admin",
        ...payload
      })
    });

    if (!response.ok) {
      throw new Error(`Resposta inesperada do Apps Script: ${response.status}`);
    }

    return await response.json();
  }

  function getAdminErrorMessage(message) {
    const safeMessage = String(message || "").trim();

    if (/Campos obrigatorios ausentes/i.test(safeMessage)) {
      return "O Apps Script publicado ainda nao esta com o painel admin atualizado. Publique uma nova versao do Web App com Admin.gs e Code.gs atualizados.";
    }

    return safeMessage;
  }

  function fillForm(config) {
    const kit = config.kitWithdrawal || {};
    const collective = config.collectiveTraining || {};
    const session = collective.session || {};
    const collectiveSecondary = config.collectiveTrainingSecondary || {};
    const secondarySession = collectiveSecondary.session || {};
    const guide = config.athleteGuide || {};

    fields.kitLocked.checked = kit.locked === true;
    fields.kitSubmitLocked.checked = kit.submitLocked === true;
    fields.kitEventName.value = kit.eventName || "";
    fields.kitPickupTip.value = kit.pickupTip || "";

    fillCollectiveFields("primary", collective, session);
    fillCollectiveFields("secondary", collectiveSecondary, secondarySession);

    fields.guideStravaGroupUrl.value = guide.stravaGroupUrl || "";
    fields.guideHandbookUrl.value = guide.handbookUrl || "";
    fields.guideFeedbackUrl.value = guide.feedbackUrl || "";
  }

  function readForm() {
    return {
      kitWithdrawal: {
        locked: fields.kitLocked.checked,
        submitLocked: fields.kitSubmitLocked.checked,
        eventName: getFieldValue(fields.kitEventName),
        pickupTip: getFieldValue(fields.kitPickupTip)
      },
      collectiveTraining: readCollectiveConfig("primary"),
      collectiveTrainingSecondary: readCollectiveConfig("secondary"),
      athleteGuide: {
        stravaGroupUrl: getFieldValue(fields.guideStravaGroupUrl),
        handbookUrl: getFieldValue(fields.guideHandbookUrl),
        feedbackUrl: getFieldValue(fields.guideFeedbackUrl)
      }
    };
  }

  function buildCollectiveSessionId(startsAtIso) {
    const normalizedDate = String(startsAtIso || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 12);

    if (!normalizedDate) {
      return "";
    }

    return `treino-coletivo-${normalizedDate.slice(0, 4)}-${normalizedDate.slice(4, 6)}-${normalizedDate.slice(6, 8)}-${normalizedDate.slice(8, 12)}`;
  }

  function buildSecondaryCollectiveSessionId(startsAtIso) {
    const normalizedDate = String(startsAtIso || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 12);

    if (!normalizedDate) {
      return "";
    }

    return `treino-coletivo-extra-${normalizedDate.slice(0, 4)}-${normalizedDate.slice(4, 6)}-${normalizedDate.slice(6, 8)}-${normalizedDate.slice(8, 12)}`;
  }

  function fillCollectiveFields(mode, collectiveConfig, session) {
    const isSecondary = mode === "secondary";
    const enabledField = isSecondary ? fields.collectiveSecondaryEnabled : fields.collectiveEnabled;
    const idField = isSecondary ? fields.collectiveSecondaryId : fields.collectiveId;
    const titleField = isSecondary ? fields.collectiveSecondaryTitle : fields.collectiveTitle;
    const descriptionField = isSecondary ? fields.collectiveSecondaryDescription : fields.collectiveDescription;
    const startDateField = isSecondary ? fields.collectiveSecondaryStartDate : fields.collectiveStartDate;
    const startTimeField = isSecondary ? fields.collectiveSecondaryStartTime : fields.collectiveStartTime;
    const deadlineDateField = isSecondary ? fields.collectiveSecondaryDeadlineDate : fields.collectiveDeadlineDate;
    const deadlineTimeField = isSecondary ? fields.collectiveSecondaryDeadlineTime : fields.collectiveDeadlineTime;
    const locationField = isSecondary ? fields.collectiveSecondaryLocation : fields.collectiveLocation;
    const minimumField = isSecondary ? fields.collectiveSecondaryMinimumParticipants : fields.collectiveMinimumParticipants;
    const statusModeField = isSecondary ? fields.collectiveSecondaryStatusMode : fields.collectiveStatusMode;
    const statusReasonField = isSecondary ? fields.collectiveSecondaryStatusReason : fields.collectiveStatusReason;

    enabledField.checked = collectiveConfig.enabled === true;
    idField.value = session.id || "";
    titleField.value = session.title || "";
    descriptionField.value = session.description || "";
    fillDateTimeFields(session.startsAtIso, startDateField, startTimeField);
    fillDateTimeFields(session.decisionDeadlineIso, deadlineDateField, deadlineTimeField);
    locationField.value = session.location || "";
    minimumField.value = session.minimumParticipants || 5;
    statusModeField.value = session.statusMode === "cancelled" ? "cancelled" : "automatic";
    statusReasonField.value = session.statusReason || "";
  }

  function readCollectiveConfig(mode) {
    const isSecondary = mode === "secondary";
    const startDateField = isSecondary ? fields.collectiveSecondaryStartDate : fields.collectiveStartDate;
    const startTimeField = isSecondary ? fields.collectiveSecondaryStartTime : fields.collectiveStartTime;
    const deadlineDateField = isSecondary ? fields.collectiveSecondaryDeadlineDate : fields.collectiveDeadlineDate;
    const deadlineTimeField = isSecondary ? fields.collectiveSecondaryDeadlineTime : fields.collectiveDeadlineTime;
    const startsAtIso = toAdminIsoDateTime(startDateField, startTimeField);
    const idField = isSecondary ? fields.collectiveSecondaryId : fields.collectiveId;
    const titleField = isSecondary ? fields.collectiveSecondaryTitle : fields.collectiveTitle;
    const descriptionField = isSecondary ? fields.collectiveSecondaryDescription : fields.collectiveDescription;
    const locationField = isSecondary ? fields.collectiveSecondaryLocation : fields.collectiveLocation;
    const minimumField = isSecondary ? fields.collectiveSecondaryMinimumParticipants : fields.collectiveMinimumParticipants;
    const statusModeField = isSecondary ? fields.collectiveSecondaryStatusMode : fields.collectiveStatusMode;
    const statusReasonField = isSecondary ? fields.collectiveSecondaryStatusReason : fields.collectiveStatusReason;
    const enabledField = isSecondary ? fields.collectiveSecondaryEnabled : fields.collectiveEnabled;

    return {
      enabled: enabledField.checked,
      session: {
        id: getFieldValue(idField) || (
          isSecondary
            ? buildSecondaryCollectiveSessionId(startsAtIso)
            : buildCollectiveSessionId(startsAtIso)
        ),
        title: getFieldValue(titleField),
        description: getFieldValue(descriptionField),
        startsAtIso,
        decisionDeadlineIso: toAdminIsoDateTime(deadlineDateField, deadlineTimeField),
        location: getFieldValue(locationField),
        minimumParticipants: Number(minimumField.value || 5),
        statusMode: getFieldValue(statusModeField) === "cancelled" ? "cancelled" : "automatic",
        statusReason: getFieldValue(statusReasonField)
      }
    };
  }

  function fillDateTimeFields(isoValue, dateField, timeField) {
    const parts = toDateTimeParts(isoValue);

    if (dateField) {
      dateField.value = parts.date;
    }

    if (timeField) {
      timeField.value = parts.time;
    }
  }

  function toDateTimeParts(isoValue) {
    const safeValue = String(isoValue || "").trim();
    const match = safeValue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);

    return {
      date: match ? match[1] : "",
      time: match ? match[2] : ""
    };
  }

  function toAdminIsoDateTime(dateField, timeField) {
    const dateValue = getFieldValue(dateField);
    const timeValue = getFieldValue(timeField);

    if (!dateValue || !timeValue) {
      return "";
    }

    return `${dateValue}T${timeValue}:00${ADMIN_TIME_ZONE_OFFSET}`;
  }

  function getFieldValue(field) {
    return String((field && field.value) || "").trim();
  }

  function handleLogout() {
    adminToken = "";
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    showLoginPanel();
    showStatus("Sessao encerrada.");
    if (passwordInput) {
      passwordInput.focus();
    }
  }

  function showLoginPanel() {
    loginPanel.hidden = false;
    configPanel.hidden = true;
  }

  function showConfigPanel() {
    loginPanel.hidden = true;
    configPanel.hidden = false;
  }

  function showStatus(message, isError = false, isSuccess = false) {
    statusElement.textContent = message;
    statusElement.classList.toggle("admin-status-error", isError);
    statusElement.classList.toggle("admin-status-success", isSuccess && !isError);
  }

  function showToast(message, isError = false) {
    if (!toastElement) {
      return;
    }

    clearTimeout(toastTimeoutId);
    toastElement.textContent = message;
    toastElement.classList.toggle("admin-toast-error", isError);
    toastElement.classList.toggle("admin-toast-success", !isError);
    toastElement.classList.remove("admin-toast-hidden");

    toastTimeoutId = setTimeout(() => {
      toastElement.classList.add("admin-toast-hidden");
    }, 4200);
  }

  function setLoginDisabled(disabled) {
    [passwordInput, loginButton].forEach((element) => {
      if (element) {
        element.disabled = disabled;
      }
    });
  }

  function setConfigDisabled(disabled) {
    const elements = configForm.querySelectorAll("input, select, textarea, button");
    elements.forEach((element) => {
      element.disabled = disabled;
    });

    if (logoutButton) {
      logoutButton.disabled = false;
    }
  }
}());
