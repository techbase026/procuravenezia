const SESSION_KEY = "procura_session";
const USERS = [
  { email: "franco.bruno@spid.it", password: "Francy09@", role: "pm", label: "Pubblico Ministero" },
  { email: "franco.bruno@pm.it", password: "Francy09@", role: "pm", label: "Pubblico Ministero" }
];

const WRITE_PERMISSIONS = {
  pm: ["all"],
  magistrato: ["mandati", "sentenze", "udienze"],
  fdo: []
};

const STORAGE_KEYS = {
  cases: "procura_cases",
  warrants: "procura_warrants",
  sentences: "procura_sentences",
  departments: "procura_departments",
  people: "procura_people",
  hearings: "procura_hearings",
  audit: "procura_audit_log",
  summaryReset: "procura_summary_reset"
};

const DEFAULT_CASES = [
  { id: "#901", title: "Associazione criminale", state: "urgent", prosecutor: "PM De Luca", priority: "Alta", createdAt: "2026-02-14T08:30:00" },
  { id: "#897", title: "Riciclaggio internazionale", state: "inquiry", prosecutor: "PM Moretti", priority: "Media", createdAt: "2026-02-14T09:10:00" },
  { id: "#894", title: "Rapina aggravata", state: "open", prosecutor: "PM Gori", priority: "Media", createdAt: "2026-02-14T10:25:00" },
  { id: "#882", title: "Frode fiscale", state: "closed", prosecutor: "PM Neri", priority: "Bassa", createdAt: "2026-02-14T11:00:00" },
  { id: "#878", title: "Sequestro di persona", state: "open", prosecutor: "PM Pagani", priority: "Alta", createdAt: "2026-02-14T11:45:00" }
];

const DEFAULT_WARRANTS = [
  { id: "M-44", caseId: "#901", type: "Perquisizione", signer: "PM De Luca", status: "active", createdAt: "2026-02-14T09:00:00" },
  { id: "M-39", caseId: "#897", type: "Sequestro beni", signer: "PM Moretti", status: "pending", createdAt: "2026-02-14T10:00:00" },
  { id: "M-31", caseId: "#882", type: "Intercettazioni", signer: "PM Neri", status: "closed", createdAt: "2026-02-14T11:00:00" }
];

const DEFAULT_SENTENCES = [
  { id: "S-120", caseId: "#882", outcome: "Condanna", judge: "Pres. Donati", penalty: "4 anni reclusione", status: "final", createdAt: "2026-02-14T09:30:00" },
  { id: "S-118", caseId: "#894", outcome: "Rinvio a giudizio", judge: "Pres. Valli", penalty: "Udienza plenaria", status: "issued", createdAt: "2026-02-14T10:20:00" },
  { id: "S-111", caseId: "#897", outcome: "Condanna", judge: "Pres. Serra", penalty: "6 anni reclusione", status: "appeal", createdAt: "2026-02-14T11:10:00" }
];

const DEFAULT_DEPARTMENTS = [
  { id: "R-01", name: "Nucleo reati economici", chief: "Isp. Riva", activeCases: 7, status: "operational", createdAt: "2026-02-14T08:45:00" },
  { id: "R-02", name: "Sezione crimini violenti", chief: "Isp. Conti", activeCases: 11, status: "operational", createdAt: "2026-02-14T09:35:00" },
  { id: "R-03", name: "Unita cybercrime", chief: "Isp. Sala", activeCases: 5, status: "understaffed", createdAt: "2026-02-14T10:35:00" }
];

const DEFAULT_PEOPLE = [
  { id: "C-204", name: "Marco Vitale", role: "Indagato", caseId: "#901", createdAt: "2026-02-14T09:40:00" },
  { id: "C-188", name: "Giulia Neri", role: "Persona informata", caseId: "#897", createdAt: "2026-02-14T10:40:00" },
  { id: "C-144", name: "Andrea Fabbri", role: "Parte offesa", caseId: "#894", createdAt: "2026-02-14T11:20:00" }
];

const DEFAULT_HEARINGS = [
  { id: "U-301", dateTime: "2026-02-14T08:45", room: "Aula 1", caseId: "#894", type: "Udienza preliminare", status: "open", createdAt: "2026-02-14T08:00:00" },
  { id: "U-302", dateTime: "2026-02-14T10:30", room: "Aula 2", caseId: "#901", type: "Conferma misura cautelare", status: "open", createdAt: "2026-02-14T09:00:00" },
  { id: "U-303", dateTime: "2026-02-14T16:15", room: "Aula 3", caseId: "#897", type: "Deposito perizia tecnica", status: "pending", createdAt: "2026-02-14T10:00:00" }
];

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getCurrentRole() {
  return getSession()?.role || "fdo";
}

function roleLabel(role) {
  if (role === "pm") return "Pubblico Ministero";
  if (role === "magistrato") return "Magistrato";
  return "Forze dell'Ordine";
}

function roleClass(role) {
  if (role === "pm") return "role-pm";
  if (role === "magistrato") return "role-magistrato";
  return "role-fdo";
}

function canWriteSection(section) {
  const role = getCurrentRole();
  const allowed = WRITE_PERMISSIONS[role] || [];
  return allowed.includes("all") || allowed.includes(section);
}

function isAuthenticated() {
  const session = getSession();
  return Boolean(session && session.email && session.role);
}

function loginWithCredentials(email, password) {
  const error = document.getElementById("error");
  if (!error) return;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  if (!normalizedEmail || !normalizedPassword) {
    error.textContent = "Inserisci email e password.";
    return;
  }

  const user = USERS.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword);
  if (!user) {
    error.textContent = "Credenziali non valide";
    return;
  }

  localStorage.setItem("loggedIn", "true");
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, role: user.role, label: user.label }));
  appendAudit("auth", "login", user.email, { role: user.role });
  window.location.href = "dashboard.html";
}

function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  loginWithCredentials(email, password);
}

function loginWithIdentity(provider) {
  const presets = {
    spid: { email: "franco.bruno@spid.it", password: "Francy09@" },
    cie: { email: "franco.bruno@pm.it", password: "Francy09@" }
  };

  const preset = presets[provider];
  if (!preset) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (emailInput) emailInput.value = preset.email;
  if (passwordInput) passwordInput.value = preset.password;
  loginWithCredentials(preset.email, preset.password);
}

function logout(force = false) {
  if (!force) {
    showLogoutConfirm();
    return;
  }
  const session = getSession();
  if (session) appendAudit("auth", "logout", session.email, { role: session.role });
  localStorage.removeItem("loggedIn");
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "logout.html";
}

function showLogoutConfirm() {
  let modal = document.querySelector(".confirm-overlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "confirm-overlay";
    modal.innerHTML = `
      <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p class="confirm-kicker">Conferma operazione</p>
        <h3 id="confirm-title">Disconnessione sessione</h3>
        <p>Stai per terminare la sessione istituzionale. Vuoi procedere?</p>
        <div class="confirm-actions">
          <button type="button" class="secondary-btn" id="confirm-cancel">Annulla</button>
          <button type="button" id="confirm-accept">Disconnetti</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.classList.add("open");

  const cancel = modal.querySelector("#confirm-cancel");
  const accept = modal.querySelector("#confirm-accept");
  const close = () => modal.classList.remove("open");

  cancel.onclick = () => close();
  accept.onclick = () => {
    close();
    logout(true);
  };
  modal.onclick = (event) => {
    if (event.target === modal) close();
  };
}

function formatTimestamp() {
  return new Date().toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateLastRefresh() {
  const el = document.getElementById("last-update");
  if (el) el.textContent = formatTimestamp();
}

function setupNavigation() {
  const page = document.body.dataset.page;
  const links = document.querySelectorAll(".sidebar a[data-nav]");
  links.forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });
}

function renderRoleInfo() {
  const session = getSession();
  if (!session) return;

  const target = document.querySelector(".sidebar-head p");
  if (target) target.textContent = "Centro fascicoli";
}

function injectInstitutionalMasthead() {
  if (!document.body.classList.contains("dashboard-page")) return;
  if (document.querySelector(".gov-header")) return;

  const shell = document.querySelector(".dashboard-shell");
  if (!shell) return;

  const header = document.createElement("header");
  header.className = "gov-header";
  header.innerHTML = `
    <div class="gov-topbar">Governo Italiano</div>
    <div class="gov-brandbar">
      <div class="gov-brand-inner">
        <div class="gov-logo" aria-hidden="true"></div>
        <h2>Ministero della Giustizia - Procura RP</h2>
        <div class="lang-switch">
          <button type="button">ITA</button>
          <button type="button">ENG</button>
        </div>
      </div>
    </div>
  `;

  shell.insertAdjacentElement("beforebegin", header);
}

function displayNameFromEmail(email) {
  const local = String(email || "").split("@")[0] || "Operatore";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderUserSessionPanel() {
  const session = getSession();
  const sidebar = document.querySelector(".sidebar");
  const logoutBtn = document.querySelector(".logout-btn");
  if (!session || !sidebar || !logoutBtn) return;

  let panel = document.querySelector(".session-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "session-panel";
    logoutBtn.insertAdjacentElement("beforebegin", panel);
  }

  const name = displayNameFromEmail(session.email);
  panel.innerHTML = `
    <p class="session-kicker">Sessione attiva</p>
    <strong>${name}</strong>
    <span class="session-mail">${session.email}</span>
    <span class="session-role-chip ${roleClass(session.role)}">${roleLabel(session.role)}</span>
  `;
}

function renderWelcomeMessage() {
  const session = getSession();
  const topbar = document.querySelector(".topbar > div");
  if (!session || !topbar) return;

  let welcome = topbar.querySelector(".welcome-note");
  if (!welcome) {
    welcome = document.createElement("p");
    welcome.className = "welcome-note";
    topbar.appendChild(welcome);
  }

  const name = displayNameFromEmail(session.email);
  welcome.innerHTML = `Benvenuto <strong>${name}</strong> - Profilo <span class="welcome-role ${roleClass(session.role)}">${roleLabel(session.role)}</span>`;
}

function isProtectedPage() {
  const path = window.location.pathname.toLowerCase();
  return !path.endsWith("index.html") && !path.endsWith("/") && !path.endsWith("logout.html");
}

function setupLogoutPage() {
  const countdown = document.getElementById("logout-countdown");
  if (!countdown) return;

  let seconds = 8;
  const timer = setInterval(() => {
    seconds -= 1;
    countdown.textContent = String(seconds);
    if (seconds <= 0) {
      clearInterval(timer);
      window.location.href = "index.html";
    }
  }, 1000);
}

function readCollection(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return [...fallback];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function writeCollection(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function ensureSeedData() {
  if (!localStorage.getItem(STORAGE_KEYS.cases)) writeCollection(STORAGE_KEYS.cases, DEFAULT_CASES);
  if (!localStorage.getItem(STORAGE_KEYS.warrants)) writeCollection(STORAGE_KEYS.warrants, DEFAULT_WARRANTS);
  if (!localStorage.getItem(STORAGE_KEYS.sentences)) writeCollection(STORAGE_KEYS.sentences, DEFAULT_SENTENCES);
  if (!localStorage.getItem(STORAGE_KEYS.departments)) writeCollection(STORAGE_KEYS.departments, DEFAULT_DEPARTMENTS);
  if (!localStorage.getItem(STORAGE_KEYS.people)) writeCollection(STORAGE_KEYS.people, DEFAULT_PEOPLE);
  if (!localStorage.getItem(STORAGE_KEYS.hearings)) writeCollection(STORAGE_KEYS.hearings, DEFAULT_HEARINGS);
  if (!localStorage.getItem(STORAGE_KEYS.audit)) writeCollection(STORAGE_KEYS.audit, []);
}

function updatePublicStats() {
  const path = window.location.pathname.toLowerCase();
  if (!path.endsWith("index.html") && !path.endsWith("/")) return;

  const cases = readCollection(STORAGE_KEYS.cases, []);
  const warrants = readCollection(STORAGE_KEYS.warrants, []);
  const hearings = readCollection(STORAGE_KEYS.hearings, []);
  const departments = readCollection(STORAGE_KEYS.departments, []);

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };

  setValue("stat-cases", cases.length);
  setValue("stat-warrants", warrants.length);
  setValue("stat-hearings", hearings.length);
  setValue("stat-departments", departments.length);
}

function getCases() { return readCollection(STORAGE_KEYS.cases, DEFAULT_CASES); }
function getWarrants() { return readCollection(STORAGE_KEYS.warrants, DEFAULT_WARRANTS); }
function getSentences() { return readCollection(STORAGE_KEYS.sentences, DEFAULT_SENTENCES); }
function getDepartments() { return readCollection(STORAGE_KEYS.departments, DEFAULT_DEPARTMENTS); }
function getPeople() { return readCollection(STORAGE_KEYS.people, DEFAULT_PEOPLE); }
function getHearings() { return readCollection(STORAGE_KEYS.hearings, DEFAULT_HEARINGS); }

function saveCases(data) { writeCollection(STORAGE_KEYS.cases, data); }
function saveWarrants(data) { writeCollection(STORAGE_KEYS.warrants, data); }
function saveSentences(data) { writeCollection(STORAGE_KEYS.sentences, data); }
function saveDepartments(data) { writeCollection(STORAGE_KEYS.departments, data); }
function savePeople(data) { writeCollection(STORAGE_KEYS.people, data); }
function saveHearings(data) { writeCollection(STORAGE_KEYS.hearings, data); }

function getAuditLogs() { return readCollection(STORAGE_KEYS.audit, []); }
function saveAuditLogs(data) { writeCollection(STORAGE_KEYS.audit, data); }

function appendAudit(section, action, itemId, details = {}) {
  const session = getSession();
  const entry = {
    id: `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    section,
    action,
    itemId,
    actor: session?.email || "sistema",
    role: session?.role || "n/a",
    details,
    createdAt: new Date().toISOString()
  };
  const next = [entry, ...getAuditLogs()].slice(0, 200);
  saveAuditLogs(next);
  localStorage.removeItem(STORAGE_KEYS.summaryReset);
}

function isSummaryAdmin() {
  const email = getSession()?.email?.toLowerCase() || "";
  return email === "franco.bruno@spid.it" || email === "franco.bruno@pm.it";
}

function clearOperationalSummary() {
  localStorage.setItem(STORAGE_KEYS.summaryReset, new Date().toISOString());
  saveAuditLogs([]);
}

function caseLink(caseId) {
  const safe = String(caseId || "").trim();
  return `<a class="case-link" href="fascicoli.html?case=${encodeURIComponent(safe)}">${safe || "-"}</a>`;
}

function pageQueryParam(name) {
  const params = new URLSearchParams(window.location.search || "");
  return params.get(name) || "";
}

function buildCsv(rows) {
  const csvRows = rows.map((row) => row.map((cell) => {
    const value = String(cell ?? "");
    return `"${value.replace(/"/g, '""')}"`;
  }).join(","));
  return csvRows.join("\n");
}

function downloadCsv(filename, rows) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportTableToCsv(tableBodyId, filename) {
  const body = document.getElementById(tableBodyId);
  if (!body) return;
  const table = body.closest("table");
  if (!table) return;

  const header = Array.from(table.querySelectorAll("thead th"))
    .map((th) => th.textContent?.trim() || "")
    .filter((name) => name.toLowerCase() !== "azioni");

  const rows = Array.from(body.querySelectorAll("tr"))
    .filter((row) => !row.classList.contains("hidden-row"))
    .map((row) => Array.from(row.querySelectorAll("td"))
      .slice(0, header.length)
      .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() || ""));

  if (rows.length === 0) return;
  downloadCsv(filename, [header, ...rows]);
}

function normalizeId(value, prefix = "") {
  const clean = value.trim();
  if (!prefix) return clean;
  return clean.startsWith(prefix) ? clean : `${prefix}${clean}`;
}

function caseStateLabel(state) { if (state === "urgent") return "Urgente"; if (state === "inquiry") return "Indagine"; if (state === "closed") return "Chiuso"; return "Aperto"; }
function warrantStateLabel(state) { if (state === "active") return "Attivo"; if (state === "pending") return "In lavorazione"; return "Concluso"; }
function sentenceStateLabel(state) { if (state === "issued") return "Emessa"; if (state === "appeal") return "In appello"; return "Definitiva"; }
function departmentStateLabel(state) { if (state === "operational") return "Operativo"; if (state === "understaffed") return "Sotto organico"; return "Sospeso"; }
function hearingStatusLabel(state) { if (state === "open") return "Programmato"; if (state === "pending") return "Rinviato"; return "Concluso"; }

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function setMessage(elementId, text, ok = true) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "#2c7b45" : "#9b2f2f";
}

function setReadOnlyMessage(elementId, text) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.style.color = "#5a6b80";
}

function setFormEditMode(form, submitLabel, isEditing) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  button.textContent = isEditing ? submitLabel : button.dataset.defaultLabel || button.textContent;
}

function ensureDefaultButtonLabel(form) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent;
}

function startEdit(form, originalId, values, submitLabel) {
  form.dataset.editingId = originalId;
  Object.entries(values).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (field) field.value = value;
  });
  setFormEditMode(form, submitLabel, true);
}

function clearEdit(form, submitLabel) {
  delete form.dataset.editingId;
  form.reset();
  setFormEditMode(form, submitLabel, false);
}

function setupSearchFilter(tableBodyId, searchId) {
  const body = document.getElementById(tableBodyId);
  const search = document.getElementById(searchId);
  if (!body || !search) return;

  const requestedCase = pageQueryParam("case");
  if (requestedCase && !search.value.trim()) search.value = requestedCase;

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    const statusFilter = body.dataset.statusFilter || "all";
    const rows = Array.from(body.querySelectorAll("tr"));
    rows.forEach((row) => {
      const rowSearch = (row.dataset.search || "").toLowerCase();
      const rowStatus = row.dataset.state || row.dataset.status || "";
      const matchQuery = query.length === 0 || rowSearch.includes(query);
      const matchStatus = statusFilter === "all" || rowStatus === statusFilter;
      row.classList.toggle("hidden-row", !(matchQuery && matchStatus));
    });
  };

  if (search.dataset.bound !== "true") {
    search.addEventListener("input", apply);
    search.dataset.bound = "true";
  }

  apply();
}

function setupAdvancedFilterControls(section, bodyId) {
  const body = document.getElementById(bodyId);
  if (!body) return;

  const panelHead = body.closest(".panel")?.querySelector(".panel-head");
  if (!panelHead) return;

  const config = {
    fascicoli: {
      label: "Stato",
      options: [["all", "Tutti"], ["open", "Aperto"], ["inquiry", "Indagine"], ["urgent", "Urgente"], ["closed", "Chiuso"]]
    },
    mandati: {
      label: "Stato",
      options: [["all", "Tutti"], ["active", "Attivo"], ["pending", "In lavorazione"], ["closed", "Concluso"]]
    },
    sentenze: {
      label: "Stato",
      options: [["all", "Tutti"], ["issued", "Emessa"], ["appeal", "In appello"], ["final", "Definitiva"]]
    },
    udienze: {
      label: "Stato",
      options: [["all", "Tutti"], ["open", "Programmato"], ["pending", "Rinviato"], ["closed", "Concluso"]]
    }
  }[section];

  if (!config || panelHead.querySelector(".advanced-filter")) return;

  const select = document.createElement("select");
  select.className = "advanced-filter";
  select.setAttribute("aria-label", `Filtro ${config.label.toLowerCase()}`);
  select.innerHTML = config.options.map(([value, label]) => `<option value="${value}">${config.label}: ${label}</option>`).join("");

  select.addEventListener("change", () => {
    body.dataset.statusFilter = select.value;
    const search = panelHead.querySelector('input[type="search"]');
    if (search) search.dispatchEvent(new Event("input"));
  });

  panelHead.appendChild(select);
}

function setupDashboardFilters() {
  const body = document.getElementById("cases-body");
  const filter = document.getElementById("case-filter");
  const search = document.getElementById("quick-search");
  if (!body || !filter || !search) return;

  const apply = () => {
    const state = filter.value;
    const query = search.value.trim().toLowerCase();

    Array.from(body.querySelectorAll("tr")).forEach((row) => {
      const rowState = row.dataset.state || "";
      const rowSearch = (row.dataset.search || "").toLowerCase();
      const matchState = state === "all" || rowState === state;
      const matchQuery = query.length === 0 || rowSearch.includes(query);
      row.classList.toggle("hidden-row", !(matchState && matchQuery));
    });
  };

  if (filter.dataset.bound !== "true") {
    filter.addEventListener("change", apply);
    filter.dataset.bound = "true";
  }

  if (search.dataset.bound !== "true") {
    search.addEventListener("input", apply);
    search.dataset.bound = "true";
  }

  apply();
}

function renderDashboard() {
  const cases = getCases();
  const warrants = getWarrants();
  const sentences = getSentences();
  const departments = getDepartments();
  const hearings = getHearings();
  const people = getPeople();
  const role = getCurrentRole();
  const now = new Date();

  const kpi = document.getElementById("kpi-grid");
  if (kpi) {
    const activeCases = cases.filter((c) => c.state !== "closed").length;
    const activeWarrants = warrants.filter((w) => w.status !== "closed").length;
    const finalSentences = sentences.filter((s) => s.status === "final").length;
    const roleKpi = role === "fdo"
      ? [
        ["Fascicoli monitorati", activeCases, "Visione operativa in sola lettura"],
        ["Mandati attivi", warrants.filter((w) => w.status === "active").length, "Da eseguire sul territorio"],
        ["Udienze programmate", hearings.filter((h) => h.status === "open").length, "Impegni in calendario"],
        ["Reparti operativi", departments.filter((d) => d.status === "operational").length, `Su ${departments.length} unita totali`]
      ]
      : role === "magistrato"
        ? [
          ["Mandati aperti", activeWarrants, "Attivi e in lavorazione"],
          ["Sentenze definitive", finalSentences, "Aggiornate dal registro"],
          ["Udienze aperte", hearings.filter((h) => h.status === "open").length, "Con stato programmato"],
          ["Fascicoli urgenti", cases.filter((c) => c.state === "urgent").length, "Priorita alta"]
        ]
        : [
          ["Fascicoli attivi", activeCases, "Esclusi i procedimenti chiusi"],
          ["Mandati aperti", activeWarrants, "Attivi e in lavorazione"],
          ["Sentenze definitive", finalSentences, "Aggiornate dal registro"],
          ["Reparti operativi", departments.filter((d) => d.status === "operational").length, `Su ${departments.length} unita totali`]
        ];

    kpi.innerHTML = roleKpi
      .map(([title, value, note]) => `<article class="kpi-card"><p>${title}</p><h3>${value}</h3><span>${note}</span></article>`)
      .join("");
  }

  const casesBody = document.getElementById("cases-body");
  if (casesBody) {
    const sorted = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 7);
    casesBody.innerHTML = sorted.map((item) => `
      <tr data-state="${item.state}" data-search="${`${item.id} ${item.title} ${item.prosecutor}`.toLowerCase()}">
        <td>${caseLink(item.id)}</td>
        <td>${item.title}</td>
        <td><span class="badge ${item.state}">${caseStateLabel(item.state)}</span></td>
        <td>${item.prosecutor}</td>
        <td>${item.priority}</td>
      </tr>
    `).join("");
  }

  const summary = document.getElementById("dashboard-summary");
  if (summary) {
    const resetAt = localStorage.getItem(STORAGE_KEYS.summaryReset);
    if (resetAt) {
      summary.innerHTML = `
        <li><p>Sintesi operativa</p><strong>Azzerata</strong><span>Operazione eseguita ${formatDateTime(resetAt)}</span></li>
      `;
    } else {
      const audits = getAuditLogs().slice(0, 5);
      summary.innerHTML = `
        <li><p>Mandati</p><strong>${warrants.length} registrati</strong><span>${warrants.filter((w) => w.status === "active").length} attivi</span></li>
        <li><p>Sentenze</p><strong>${sentences.length} registrate</strong><span>${sentences.filter((s) => s.status === "appeal").length} in appello</span></li>
        <li><p>Reparti</p><strong>${departments.length} unita</strong><span>${departments.reduce((sum, d) => sum + Number(d.activeCases || 0), 0)} fascicoli assegnati</span></li>
        <li><p>Udienze</p><strong>${hearings.length} in calendario</strong><span>${hearings.filter((h) => h.status === "open").length} programmate</span></li>
        <li><p>Anagrafe</p><strong>${people.length} soggetti censiti</strong><span>${people.filter((p) => p.role === "Indagato").length} indagati</span></li>
        ${audits.map((entry) => `<li><p>Audit</p><strong>${entry.action.toUpperCase()} ${entry.itemId}</strong><span>${entry.actor} - ${formatDateTime(entry.createdAt)}</span></li>`).join("")}
      `;
    }
  }

  const activity = document.getElementById("activity-list");
  if (activity) {
    const latestCases = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);
    const latestWarrants = [...warrants].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 1);
    const latestSentences = [...sentences].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 1);

    const rows = [
      ...latestCases.map((c) => `<li><strong>${c.id}</strong> Fascicolo aggiornato: ${c.title}</li>`),
      ...latestWarrants.map((w) => `<li><strong>${w.id}</strong> Mandato ${warrantStateLabel(w.status).toLowerCase()} su ${w.caseId}</li>`),
      ...latestSentences.map((s) => `<li><strong>${s.id}</strong> Sentenza ${sentenceStateLabel(s.status).toLowerCase()} su ${s.caseId}</li>`)
    ];

    activity.innerHTML = rows.join("");
  }

  const deadlinesPanel = Array.from(document.querySelectorAll(".panel")).find((panel) => panel.querySelector("h2")?.textContent?.includes("Documenti prioritari"));
  if (deadlinesPanel) {
    const upcomingHearings = hearings
      .filter((item) => item.status !== "closed")
      .map((item) => ({ ...item, dateObj: new Date(item.dateTime) }))
      .filter((item) => !Number.isNaN(item.dateObj.getTime()))
      .filter((item) => item.dateObj >= now && (item.dateObj.getTime() - now.getTime()) <= 48 * 60 * 60 * 1000)
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 4);

    const docs = upcomingHearings.length > 0
      ? upcomingHearings.map((item) => `
        <div class="doc-item">
          <p>${item.type} - ${caseLink(item.caseId)}</p>
          <span>Scadenza: ${formatDateTime(item.dateTime)} - ${item.room}</span>
        </div>
      `).join("")
      : `<div class="doc-item"><p>Nessuna scadenza entro 48h</p><span>Monitoraggio aggiornato in tempo reale</span></div>`;

    deadlinesPanel.innerHTML = `<h2>Scadenze e alert (48h)</h2>${docs}`;
  }

  setupDashboardFilters();
  updateLastRefresh();
}

function setupSummaryAdminControls() {
  const button = document.getElementById("clear-summary-btn");
  if (!button) return;
  button.style.display = isSummaryAdmin() ? "inline-flex" : "none";
  if (button.dataset.bound === "true") return;
  button.addEventListener("click", () => {
    clearOperationalSummary();
    renderDashboard();
  });
  button.dataset.bound = "true";
}

function actionCell(section, editAttr, deleteAttr, duplicateAttr, detailsAttr, id, label) {
  const detailButton = `<button class="action-btn detail-btn" type="button" ${detailsAttr}="${id}">Dettaglio</button>`;
  if (!canWriteSection(section)) return `${detailButton}<span class="read-only-tag">Sola lettura</span>`;
  return `${detailButton}<button class="action-btn duplicate-btn" type="button" ${duplicateAttr}="${id}">Duplica</button><button class="action-btn edit-btn" type="button" ${editAttr}="${id}">Modifica</button><button class="action-btn delete-btn" type="button" ${deleteAttr}="${id}" aria-label="Elimina ${label} ${id}">Elimina</button>`;
}

function renderCasesTable(data) {
  const body = document.getElementById("fascicoli-body");
  if (!body) return;
  body.innerHTML = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => `
    <tr data-search="${`${item.id} ${item.title} ${item.prosecutor}`.toLowerCase()}" data-state="${item.state}">
      <td>${item.id}</td><td>${item.title}</td><td><span class="badge ${item.state}">${caseStateLabel(item.state)}</span></td><td>${item.prosecutor}</td><td>${item.priority}</td>
      <td>${actionCell("fascicoli", "data-edit-case", "data-delete-case", "data-duplicate-case", "data-detail-case", item.id, "fascicolo")}</td>
    </tr>`).join("");
}

function renderWarrantsTable(data) {
  const body = document.getElementById("mandati-body");
  if (!body) return;
  body.innerHTML = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => `
    <tr data-search="${`${item.id} ${item.caseId} ${item.type} ${item.signer}`.toLowerCase()}" data-status="${item.status}">
      <td>${item.id}</td><td>${caseLink(item.caseId)}</td><td>${item.type}</td><td>${item.signer}</td><td><span class="badge ${item.status}">${warrantStateLabel(item.status)}</span></td>
      <td>${actionCell("mandati", "data-edit-warrant", "data-delete-warrant", "data-duplicate-warrant", "data-detail-warrant", item.id, "mandato")}</td>
    </tr>`).join("");
}

function renderSentencesTable(data) {
  const body = document.getElementById("sentenze-body");
  if (!body) return;
  body.innerHTML = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => `
    <tr data-search="${`${item.id} ${item.caseId} ${item.judge} ${item.outcome}`.toLowerCase()}" data-status="${item.status}">
      <td>${item.id}</td><td>${caseLink(item.caseId)}</td><td>${item.outcome}</td><td>${item.judge}</td><td>${item.penalty}</td><td><span class="badge ${item.status}">${sentenceStateLabel(item.status)}</span></td>
      <td>${actionCell("sentenze", "data-edit-sentence", "data-delete-sentence", "data-duplicate-sentence", "data-detail-sentence", item.id, "sentenza")}</td>
    </tr>`).join("");
}

function renderDepartmentsTable(data) {
  const body = document.getElementById("reparti-body");
  if (!body) return;
  body.innerHTML = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => `
    <tr data-search="${`${item.id} ${item.name} ${item.chief}`.toLowerCase()}" data-status="${item.status}">
      <td>${item.id}</td><td>${item.name}</td><td>${item.chief}</td><td>${item.activeCases}</td><td><span class="badge ${item.status}">${departmentStateLabel(item.status)}</span></td>
      <td>${actionCell("reparti", "data-edit-department", "data-delete-department", "data-duplicate-department", "data-detail-department", item.id, "reparto")}</td>
    </tr>`).join("");
}

function renderPeopleTable(data) {
  const body = document.getElementById("persone-body");
  if (!body) return;
  body.innerHTML = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => `
    <tr data-search="${`${item.id} ${item.name} ${item.role} ${item.caseId}`.toLowerCase()}">
      <td>${item.id}</td><td>${item.name}</td><td>${item.role}</td><td>${caseLink(item.caseId)}</td>
      <td>${actionCell("persone", "data-edit-person", "data-delete-person", "data-duplicate-person", "data-detail-person", item.id, "soggetto")}</td>
    </tr>`).join("");
}

function renderHearingsTable(data) {
  const body = document.getElementById("udienze-body");
  if (!body) return;
  body.innerHTML = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => `
    <tr data-search="${`${item.id} ${item.room} ${item.type} ${item.caseId}`.toLowerCase()}" data-status="${item.status}">
      <td>${item.id}</td><td>${formatDateTime(item.dateTime)}</td><td>${item.room}</td><td>${caseLink(item.caseId)}</td><td>${item.type}</td><td><span class="badge ${item.status}">${hearingStatusLabel(item.status)}</span></td>
      <td>${actionCell("udienze", "data-edit-hearing", "data-delete-hearing", "data-duplicate-hearing", "data-detail-hearing", item.id, "udienza")}</td>
    </tr>`).join("");
}

function findCaseById(caseId) {
  return getCases().find((item) => item.id === normalizeId(String(caseId || ""), "#"));
}

function validateCaseWorkflow(payload, editingItem) {
  if (!editingItem) {
    if ((payload.state || "open") === "closed") return { ok: false, message: "Un nuovo fascicolo non puo nascere gia chiuso." };
    return { ok: true };
  }

  const transitions = {
    open: ["inquiry", "urgent"],
    inquiry: ["urgent", "closed"],
    urgent: ["inquiry", "closed"],
    closed: ["closed"]
  };

  const currentState = editingItem.state || "open";
  const nextState = payload.state || currentState;
  const allowed = transitions[currentState] || [currentState];
  if (!allowed.includes(nextState)) {
    return { ok: false, message: `Transizione non valida: ${caseStateLabel(currentState)} -> ${caseStateLabel(nextState)}.` };
  }

  if (nextState === "closed") {
    const linked = getWarrants().some((item) => item.caseId === editingItem.id)
      || getHearings().some((item) => item.caseId === editingItem.id)
      || getSentences().some((item) => item.caseId === editingItem.id);
    if (!linked) return { ok: false, message: "Per chiudere un fascicolo serve almeno un atto collegato (mandato/udienza/sentenza)." };
  }

  return { ok: true };
}

function ensureLinkedCase(caseId) {
  return Boolean(findCaseById(caseId));
}

function detailDialog(title, html) {
  let modal = document.querySelector(".detail-overlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "detail-overlay";
    modal.innerHTML = `
      <div class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div class="detail-head">
          <h3 id="detail-title"></h3>
          <button type="button" class="secondary-btn detail-close">Chiudi</button>
        </div>
        <div class="detail-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.remove("open");
    });
    modal.querySelector(".detail-close")?.addEventListener("click", () => modal.classList.remove("open"));
  }

  const titleEl = modal.querySelector("#detail-title");
  const bodyEl = modal.querySelector(".detail-body");
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = html;
  modal.classList.add("open");
}

function openCaseDetail(caseId) {
  const item = findCaseById(caseId);
  if (!item) return;
  const warrants = getWarrants().filter((row) => row.caseId === item.id);
  const hearings = getHearings().filter((row) => row.caseId === item.id);
  const sentences = getSentences().filter((row) => row.caseId === item.id);
  const people = getPeople().filter((row) => row.caseId === item.id);
  const audits = getAuditLogs().filter((row) => row.itemId === item.id || row.details?.caseId === item.id).slice(0, 8);

  detailDialog(`Scheda fascicolo ${item.id}`, `
    <div class="detail-grid">
      <article><p>Reato principale</p><strong>${item.title}</strong></article>
      <article><p>Stato</p><strong>${caseStateLabel(item.state)}</strong></article>
      <article><p>PM assegnato</p><strong>${item.prosecutor}</strong></article>
      <article><p>Priorita</p><strong>${item.priority}</strong></article>
    </div>
    <h4>Collegamenti</h4>
    <ul class="detail-list">
      <li>Mandati: ${warrants.length}</li>
      <li>Udienze: ${hearings.length}</li>
      <li>Sentenze: ${sentences.length}</li>
      <li>Soggetti: ${people.length}</li>
    </ul>
    <h4>Timeline audit</h4>
    <ul class="detail-list">${audits.map((entry) => `<li>${entry.action} - ${entry.actor} - ${formatDateTime(entry.createdAt)}</li>`).join("") || "<li>Nessuna attivita registrata.</li>"}</ul>
  `);
}

function openGenericDetail(entityName, item) {
  if (!item) return;
  const fields = Object.entries(item)
    .filter(([key]) => key !== "createdAt")
    .map(([key, value]) => `<li><strong>${key}</strong>: ${value}</li>`)
    .join("");
  const audits = getAuditLogs().filter((entry) => entry.itemId === item.id).slice(0, 8);
  detailDialog(`${entityName} ${item.id}`, `
    <ul class="detail-list">${fields}</ul>
    <h4>Storico</h4>
    <ul class="detail-list">${audits.map((entry) => `<li>${entry.action} - ${entry.actor} - ${formatDateTime(entry.createdAt)}</li>`).join("") || "<li>Nessuna attivita.</li>"}</ul>
  `);
}

function attachSectionTools(section, bodyId, searchId, filename) {
  setupAdvancedFilterControls(section, bodyId);
  const body = document.getElementById(bodyId);
  if (!body) return;
  const panelHead = body.closest(".panel")?.querySelector(".panel-head");
  if (!panelHead || panelHead.querySelector(".export-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ghost-btn export-btn";
  btn.textContent = "Esporta CSV";
  btn.addEventListener("click", () => exportTableToCsv(bodyId, filename));
  panelHead.appendChild(btn);

  const search = document.getElementById(searchId);
  if (search && pageQueryParam("case") && !search.value.trim()) {
    search.value = pageQueryParam("case");
    search.dispatchEvent(new Event("input"));
  }
}

function renderHearingsCalendar() {
  const page = document.body.dataset.page;
  if (page !== "udienze") return;

  const grid = document.querySelector(".layout-grid");
  if (!grid) return;

  let panel = document.getElementById("hearings-calendar-panel");
  if (!panel) {
    panel = document.createElement("article");
    panel.id = "hearings-calendar-panel";
    panel.className = "panel panel-wide";
    grid.appendChild(panel);
  }

  const now = new Date();
  const upcoming = getHearings()
    .map((item) => ({ ...item, dateObj: new Date(item.dateTime) }))
    .filter((item) => !Number.isNaN(item.dateObj.getTime()) && item.dateObj >= now)
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 10);

  panel.innerHTML = `
    <h2>Calendario udienze (prossime 10)</h2>
    <ul class="timeline">
      ${upcoming.map((item) => `<li><p>${formatDateTime(item.dateTime)}</p><strong>${item.id} - ${item.type}</strong><span>${item.room} - ${caseLink(item.caseId)}</span></li>`).join("") || "<li><p>Nessuna udienza in calendario</p></li>"}
    </ul>
  `;
}

function initCasesPage() {
  initCrudPage("fascicoli", "case-form", "case-form-message", "fascicoli-body", "fascicoli-search", getCases, saveCases, renderCasesTable, (d) => ({ id: normalizeId(String(d.get("id") || ""), "#"), title: String(d.get("title") || "").trim(), state: String(d.get("state") || "open"), prosecutor: String(d.get("prosecutor") || "").trim(), priority: String(d.get("priority") || "Media"), createdAt: new Date().toISOString() }), (i) => ({ id: i.id, title: i.title, state: i.state, prosecutor: i.prosecutor, priority: i.priority }), "data-edit-case", "data-delete-case", "data-duplicate-case", "data-detail-case", "Fascicolo", {
    exportFile: "fascicoli.csv",
    validate: (payload, _current, editingItem) => validateCaseWorkflow(payload, editingItem)
  });
}

function initWarrantsPage() {
  initCrudPage("mandati", "warrant-form", "warrant-form-message", "mandati-body", "mandati-search", getWarrants, saveWarrants, renderWarrantsTable, (d) => ({ id: normalizeId(String(d.get("id") || "").toUpperCase()), caseId: normalizeId(String(d.get("caseId") || ""), "#"), type: String(d.get("type") || "").trim(), signer: String(d.get("signer") || "").trim(), status: String(d.get("status") || "active"), createdAt: new Date().toISOString() }), (i) => ({ id: i.id, caseId: i.caseId, type: i.type, signer: i.signer, status: i.status }), "data-edit-warrant", "data-delete-warrant", "data-duplicate-warrant", "data-detail-warrant", "Mandato", {
    exportFile: "mandati.csv",
    validate: (payload) => ensureLinkedCase(payload.caseId) ? { ok: true } : { ok: false, message: "Fascicolo collegato non trovato." }
  });
}

function initSentencesPage() {
  initCrudPage("sentenze", "sentence-form", "sentence-form-message", "sentenze-body", "sentenze-search", getSentences, saveSentences, renderSentencesTable, (d) => ({ id: normalizeId(String(d.get("id") || "").toUpperCase()), caseId: normalizeId(String(d.get("caseId") || ""), "#"), outcome: String(d.get("outcome") || "").trim(), judge: String(d.get("judge") || "").trim(), penalty: String(d.get("penalty") || "").trim(), status: String(d.get("status") || "issued"), createdAt: new Date().toISOString() }), (i) => ({ id: i.id, caseId: i.caseId, outcome: i.outcome, judge: i.judge, penalty: i.penalty, status: i.status }), "data-edit-sentence", "data-delete-sentence", "data-duplicate-sentence", "data-detail-sentence", "Sentenza", {
    exportFile: "sentenze.csv",
    validate: (payload) => ensureLinkedCase(payload.caseId) ? { ok: true } : { ok: false, message: "Fascicolo collegato non trovato." }
  });
}

function initDepartmentsPage() {
  initCrudPage("reparti", "department-form", "department-form-message", "reparti-body", "reparti-search", getDepartments, saveDepartments, renderDepartmentsTable, (d) => ({ id: normalizeId(String(d.get("id") || "").toUpperCase()), name: String(d.get("name") || "").trim(), chief: String(d.get("chief") || "").trim(), activeCases: Number(String(d.get("activeCases") || "0")), status: String(d.get("status") || "operational"), createdAt: new Date().toISOString() }), (i) => ({ id: i.id, name: i.name, chief: i.chief, activeCases: i.activeCases, status: i.status }), "data-edit-department", "data-delete-department", "data-duplicate-department", "data-detail-department", "Reparto", { exportFile: "reparti.csv" });
}

function initPeoplePage() {
  initCrudPage("persone", "person-form", "person-form-message", "persone-body", "persone-search", getPeople, savePeople, renderPeopleTable, (d) => ({ id: normalizeId(String(d.get("id") || "").toUpperCase()), name: String(d.get("name") || "").trim(), role: String(d.get("role") || "").trim(), caseId: normalizeId(String(d.get("caseId") || ""), "#"), createdAt: new Date().toISOString() }), (i) => ({ id: i.id, name: i.name, role: i.role, caseId: i.caseId }), "data-edit-person", "data-delete-person", "data-duplicate-person", "data-detail-person", "Soggetto", {
    exportFile: "anagrafe.csv",
    validate: (payload) => ensureLinkedCase(payload.caseId) ? { ok: true } : { ok: false, message: "Fascicolo collegato non trovato." }
  });
}

function initHearingsPage() {
  initCrudPage("udienze", "hearing-form", "hearing-form-message", "udienze-body", "udienze-search", getHearings, saveHearings, renderHearingsTable, (d) => ({ id: normalizeId(String(d.get("id") || "").toUpperCase()), dateTime: String(d.get("dateTime") || "").trim(), room: String(d.get("room") || "").trim(), caseId: normalizeId(String(d.get("caseId") || ""), "#"), type: String(d.get("type") || "").trim(), status: String(d.get("status") || "open"), createdAt: new Date().toISOString() }), (i) => ({ id: i.id, dateTime: i.dateTime, room: i.room, caseId: i.caseId, type: i.type, status: i.status }), "data-edit-hearing", "data-delete-hearing", "data-duplicate-hearing", "data-detail-hearing", "Udienza", {
    exportFile: "udienze.csv",
    validate: (payload) => {
      if (!ensureLinkedCase(payload.caseId)) return { ok: false, message: "Fascicolo collegato non trovato." };
      const date = new Date(payload.dateTime);
      if (Number.isNaN(date.getTime())) return { ok: false, message: "Data udienza non valida." };
      return { ok: true };
    },
    afterRender: () => renderHearingsCalendar()
  });
}

function initCrudPage(section, formId, messageId, bodyId, searchId, getter, saver, renderer, extractor, editValues, editAttr, deleteAttr, duplicateAttr, detailAttr, entityName, options = {}) {
  renderer(getter());
  setupSearchFilter(bodyId, searchId);
  attachSectionTools(section, bodyId, searchId, options.exportFile || `${section}.csv`);
  if (typeof options.afterRender === "function") options.afterRender();

  const form = document.getElementById(formId);
  const body = document.getElementById(bodyId);
  if (!form || !body) return;

  ensureDefaultButtonLabel(form);

  const canWrite = canWriteSection(section);
  if (!canWrite) {
    const controls = form.querySelectorAll("input, select, button");
    controls.forEach((c) => { c.disabled = true; });
    setReadOnlyMessage(messageId, `Profilo ${roleLabel(getCurrentRole())}: accesso in sola lettura su questa sezione.`);
    return;
  }

  if (form.dataset.bound !== "true") {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = extractor(data);
      const id = payload.id;
      const editingId = form.dataset.editingId || "";

      if (!id) {
        setMessage(messageId, "Compila i campi obbligatori.", false);
        return;
      }

      const current = getter();
      const editingItem = current.find((item) => item.id === editingId);
      if (typeof options.validate === "function") {
        const validation = options.validate(payload, current, editingItem);
        if (!validation?.ok) {
          setMessage(messageId, validation?.message || "Dati non validi.", false);
          return;
        }
      }

      if (current.some((item) => String(item.id).toLowerCase() === String(id).toLowerCase() && item.id !== editingId)) {
        setMessage(messageId, `ID ${entityName.toLowerCase()} gia presente.`, false);
        return;
      }

      const next = editingId
        ? current.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
        : [payload, ...current];

      saver(next);
      appendAudit(section, editingId ? "update" : "create", id, { previousId: editingId || null, caseId: payload.caseId || null });
      renderer(next);
      setupSearchFilter(bodyId, searchId);
      if (typeof options.afterRender === "function") options.afterRender();
      clearEdit(form, "Salva modifica");
      setMessage(messageId, editingId ? `${entityName} ${id} aggiornato con successo.` : `${entityName} ${id} aggiunto con successo.`);
    });
    form.dataset.bound = "true";
  }

  if (body.dataset.bound !== "true") {
    body.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const editId = target.getAttribute(editAttr);
      if (editId) {
        const item = getter().find((it) => it.id === editId);
        if (!item) return;
        startEdit(form, item.id, editValues(item), "Salva modifica");
        setReadOnlyMessage(messageId, `Modifica ${entityName.toLowerCase()} ${item.id} in corso.`);
        return;
      }

      const deleteId = target.getAttribute(deleteAttr);
      if (deleteId) {
        const next = getter().filter((item) => item.id !== deleteId);
        saver(next);
        appendAudit(section, "delete", deleteId);
        renderer(next);
        setupSearchFilter(bodyId, searchId);
        if (typeof options.afterRender === "function") options.afterRender();
        return;
      }

      const duplicateId = target.getAttribute(duplicateAttr);
      if (duplicateId) {
        const current = getter();
        const source = current.find((item) => item.id === duplicateId);
        if (!source) return;
        const clone = { ...source, id: normalizeId(`${String(source.id).replace(/^#/, "")}-COPY`, source.id.startsWith("#") ? "#" : ""), createdAt: new Date().toISOString() };
        if (current.some((item) => item.id === clone.id)) clone.id = `${clone.id}-${Math.floor(Math.random() * 100)}`;
        const next = [clone, ...current];
        saver(next);
        appendAudit(section, "duplicate", clone.id, { sourceId: source.id, caseId: clone.caseId || null });
        renderer(next);
        setupSearchFilter(bodyId, searchId);
        if (typeof options.afterRender === "function") options.afterRender();
        return;
      }

      const detailId = target.getAttribute(detailAttr);
      if (!detailId) return;

      if (section === "fascicoli") {
        openCaseDetail(detailId);
        return;
      }
      const item = getter().find((row) => row.id === detailId);
      openGenericDetail(entityName, item);
    });
    body.dataset.bound = "true";
  }
}

function setupRefreshButton() {
  const refresh = document.getElementById("refresh-btn");
  if (!refresh || refresh.dataset.bound === "true") return;
  refresh.addEventListener("click", () => renderDashboard());
  refresh.dataset.bound = "true";
}

function bootstrapProtectedPages() {
  setupLogoutPage();

  if (!isProtectedPage()) return;

  if (!isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  ensureSeedData();
  injectInstitutionalMasthead();
  setupNavigation();
  renderRoleInfo();
  renderUserSessionPanel();
  renderWelcomeMessage();

  const page = document.body.dataset.page;
  if (page === "dashboard") {
    renderDashboard();
    setupRefreshButton();
    setupSummaryAdminControls();
  }

  if (page === "fascicoli") initCasesPage();
  if (page === "mandati") initWarrantsPage();
  if (page === "sentenze") initSentencesPage();
  if (page === "udienze") initHearingsPage();
  if (page === "persone") initPeoplePage();
  if (page === "reparti") initDepartmentsPage();
}

bootstrapProtectedPages();
updatePublicStats();
