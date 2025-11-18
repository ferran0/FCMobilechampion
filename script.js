/* script.js - FC Mobile Campeonato PRO - Versión Limpia 2025 */
const LS_PLAYERS = 'fc_players_v2025';
const LS_MATCHES = 'fc_matches_v2025';
const LS_RESULTS = 'fc_results_v2025';
const LS_CODES = 'fc_codes_v2025';

const ADMIN_KEY = '007';  // Cambia esta clave si quieres

const uid = () => 'id_' + Math.random().toString(36).slice(2,9);
const genPin = () => Math.random().toString(36).slice(2,10);
const gen4 = () => String(Math.floor(1000 + Math.random()*9000));
const load = k => JSON.parse(localStorage.getItem(k) || '[]');
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));

const toastEl = document.getElementById('toast');
function showToast(msg, ms=2800){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=> toastEl.classList.remove('show'), ms);
}

// Elementos
const btnRegister = document.getElementById('btn-register');
const btnCalendar = document.getElementById('btn-calendar');
const btnTable = document.getElementById('btn-table');
const btnAdmin = document.getElementById('btn-admin');

const panelRegister = document.getElementById('panel-register');
const panelCalendar = document.getElementById('panel-calendar');
const panelTable = document.getElementById('panel-table');
const panelAdminLogin = document.getElementById('panel-admin-login');
const panelAdmin = document.getElementById('panel-admin');

const formRegister = document.getElementById('form-register');
const inputName = document.getElementById('input-name');
const inputCode = document.getElementById('input-code');
const registerMsg = document.getElementById('register-msg');
const showPin = document.getElementById('show-pin');

const calendarList = document.getElementById('calendar-list');
const standingsWrap = document.getElementById('standings-wrap');
const matchesList = document.getElementById('matches-list');
const filterRound = document.getElementById('filter-round');
const exportCsvBtn = document.getElementById('export-csv');

const formAdminLogin = document.getElementById('form-admin-login');
const adminKeyInput = document.getElementById('admin-key');
const adminLoginMsg = document.getElementById('admin-login-msg');

const btnGenerateCode = document.getElementById('btn-generate-code');
const codesActive = document.getElementById('codes-active');

const formAddMatch = document.getElementById('form-add-match');
const matchRoundInput = document.getElementById('match-round');
const selectPlayerA = document.getElementById('select-player-a');
const selectPlayerB = document.getElementById('select-player-b');
const matchDatetime = document.getElementById('match-datetime');

const formAdminResult = document.getElementById('form-admin-result');
const selectAdminMatch = document.getElementById('select-admin-match');
const adminGoalsA = document.getElementById('admin-goals-a');
const adminGoalsB = document.getElementById('admin-goals-b');

const adminPlayersBox = document.getElementById('admin-players');
const adminResultsBox = document.getElementById('admin-results');
const btnExportAll = document.getElementById('btn-export-all');
const btnLogoutAdmin = document.getElementById('btn-logout-admin');

// Navegación
function setActiveTab(tab){
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  if(tab==='register'){ btnRegister.classList.add('active'); panelRegister.classList.remove('hidden'); }
  if(tab==='calendar'){ btnCalendar.classList.add('active'); panelCalendar.classList.remove('hidden'); refreshAll(); }
  if(tab==='table'){ btnTable.classList.add('active'); panelTable.classList.remove('hidden'); refreshAll(); }
  if(tab==='adminLogin'){ btnAdmin.classList.add('active'); panelAdminLogin.classList.remove('hidden'); }
  if(tab==='admin'){ btnAdmin.classList.add('active'); panelAdmin.classList.remove('hidden'); refreshAll(); }
}
btnRegister.onclick = () => setActiveTab('register');
btnCalendar.onclick = () => setActiveTab('calendar');
btnTable.onclick = () => setActiveTab('table');
btnAdmin.onclick = () => setActiveTab('adminLogin');
setActiveTab('register');

// Registro
formRegister.onsubmit = (e) => {
  e.preventDefault();
  registerMsg.textContent=''; showPin.innerHTML='';
  const name = inputName.value.trim();
  const code = inputCode.value.trim();
  if(!name || !code){ registerMsg.textContent = 'Completa ambos campos'; return; }
  const codes = load(LS_CODES);
  const idx = codes.findIndex(c => c.code === code && !c.used);
  if(idx === -1){ registerMsg.textContent = 'Código inválido o ya usado'; return; }
  const players = load(LS_PLAYERS);
  if(players.some(p => p.name.toLowerCase() === name.toLowerCase())){
    registerMsg.textContent = 'Ese nombre ya está registrado'; return;
  }
  const newPin = genPin();
  players.push({ id: uid(), name, pin: newPin, logo: null });
  save(LS_PLAYERS, players);
  codes[idx].used = true; save(LS_CODES, codes);
  registerMsg.textContent = '¡Registrado con éxito! Guarda tu PIN (solo se muestra una vez)';
  showPin.innerHTML = `<strong>PIN:</strong> <code style="background:#000;padding:4px 8px;border-radius:6px;">${newPin}</code>`;
  inputName.value=''; inputCode.value='';
  showToast('Jugador registrado');
  refreshAll();
};

// Admin login
formAdminLogin.onsubmit = (e) => {
  e.preventDefault();
  if(adminKeyInput.value.trim() === ADMIN_KEY){
    setActiveTab('admin');
    showToast('Bienvenido, Admin');
  } else {
    adminLoginMsg.textContent = 'Clave incorrecta';
    showToast('Acceso denegado');
  }
  adminKeyInput.value = '';
};

// Generar código
btnGenerateCode.onclick = () => {
  const codes = load(LS_CODES);
  const code = { id: uid(), code: gen4(), used: false, createdAt: new Date().toISOString() };
  codes.push(code); save(LS_CODES, codes);
  renderCodes();
  navigator.clipboard?.writeText(code.code);
  showToast('Código copiado: ' + code.code, 3000);
};

function renderCodes(){
  const active = load(LS_CODES).filter(c => !c.used).map(c => c.code);
  codesActive.innerHTML = active.length 
    ? `<div class="small">Códigos activos: <strong>${active.join(' · ')}</strong></div>`
    : '<div class="small muted">No hay códigos activos</div>';
}

// Resto del código (igual que antes, solo renderizados vacíos)
formAddMatch.onsubmit = (e) => { /* ... mismo código ... */ };
formAdminResult.onsubmit = (e) => { /* ... mismo código ... */ };

function deletePlayer(id){ /* ... mismo código ... */ }

function computeStats(){ /* ... mismo código ... */ }

function renderStandings(){ /* ... mismo código ... */ }
function renderMatchesList(){ /* ... mismo código ... */ }
function renderCalendar(){ /* ... mismo código ... */ }
function fillAdminSelects(){ /* ... mismo código ... */ }
function renderAdminPlayers(){ /* ... mismo código ... */ }
function renderAdminResults(){ /* ... mismo código ... */ }

exportCsvBtn.onclick = () => downloadBlob(buildStandingsCSV(), 'text/csv', 'tabla_posiciones.csv');
btnExportAll.onclick = () => downloadBlob(buildAllCSV(), 'text/csv', 'resultados_completos.csv');

function refreshAll(){
  renderCodes(); renderStandings(); renderMatchesList(); renderCalendar();
  fillAdminSelects(); renderAdminPlayers(); renderAdminResults();
}
refreshAll();

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
window.deletePlayer = deletePlayer;
