/* script.js - FC Mobile Campeonato PRO 2025 - DISEÑO ÉPICO + LÓGICA ORIGINAL 100% FUNCIONAL */
const LS_PLAYERS = 'fc_players_pro2025';
const LS_MATCHES = 'fc_matches_pro2025';
const LS_RESULTS = 'fc_results_pro2025';
const LS_CODES = 'fc_codes_pro2025';

const ADMIN_KEY = '007';

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

// === Elementos ===
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

// === Navegación ===
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

// === Registro con código 4 dígitos ===
formRegister.onsubmit = (e) => {
  e.preventDefault();
  registerMsg.textContent = ''; showPin.innerHTML = '';
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
  codes[idx].used = true;
  save(LS_CODES, codes);

  registerMsg.textContent = '¡Registrado! Guarda tu PIN (solo se muestra una vez)';
  showPin.innerHTML = `<strong>PIN:</strong> <code style="background:#000;padding:6px 12px;border-radius:8px;font-size:16px;">${newPin}</code>`;
  inputName.value = ''; inputCode.value = '';
  showToast('¡Jugador registrado exitosamente!');
  refreshAll();
};

// === Admin login ===
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

// === Generar código 4 dígitos ===
btnGenerateCode.onclick = () => {
  const codes = load(LS_CODES);
  const newCode = { id: uid(), code: gen4(), used: false, createdAt: new Date().toISOString() };
  codes.push(newCode);
  save(LS_CODES, codes);
  renderCodes();
  navigator.clipboard?.writeText(newCode.code);
  showToast(`Código copiado: ${newCode.code}`, 3000);
};

function renderCodes(){
  const active = load(LS_CODES).filter(c => !c.used).map(c => c.code);
  codesActive.innerHTML = active.length 
    ? `<div class="small">Códigos activos: <strong>${active.join(' · ')}</strong></div>`
    : '<div class="small muted">No hay códigos activos</div>';
}

// === Agregar partido ===
formAddMatch.onsubmit = (e) => {
  e.preventDefault();
  const round = Number(matchRoundInput.value) || 1;
  const dt = matchDatetime.value;
  const a = selectPlayerA.value;
  const b = selectPlayerB.value;
  if(!dt || !a || !b) return showToast('Completa todos los campos');
  if(a === b) return showToast('Elige jugadores distintos');

  const matches = load(LS_MATCHES);
  matches.push({ id: uid(), datetime: new Date(dt).toISOString(), playerA: a, playerB: b, round, played: false });
  save(LS_MATCHES, matches);

  matchRoundInput.value = ''; matchDatetime.value = ''; selectPlayerA.value = ''; selectPlayerB.value = '';
  showToast(`Partido agregado - Jornada ${round}`);
  refreshAll();
};

// === Guardar resultado (admin) ===
formAdminResult.onsubmit = (e) => {
  e.preventDefault();
  const matchId = selectAdminMatch.value;
  const gA = parseInt(adminGoalsA.value);
  const gB = parseInt(adminGoalsB.value);
  if(!matchId || isNaN(gA) || isNaN(gB)) return showToast('Completa todo');

  const matches = load(LS_MATCHES);
  const idx = matches.findIndex(m => m.id === matchId);
  if(idx === -1) return showToast('Partido no encontrado');

  const results = load(LS_RESULTS);
  results.push({ id: uid(), matchId, goalsA: gA, goalsB: gB, evidence: null, submittedBy: 'admin', createdAt: new Date().toISOString() });
  save(LS_RESULTS, results);
  matches[idx].played = true;
  save(LS_MATCHES, matches);

  adminGoalsA.value = ''; adminGoalsB.value = '';
  const pA = load(LS_PLAYERS).find(p => p.id === matches[idx].playerA).name;
  const pB = load(LS_PLAYERS).find(p => p.id === matches[idx].playerB).name;
  showToast(`\( {pA} \){gA} - \( {gB} \){pB} ✓`, 3500);
  refreshAll();
};

// === Eliminar jugador ===
function deletePlayer(id){
  if(!confirm('¿Eliminar jugador y todos sus partidos?')) return;
  let players = load(LS_PLAYERS).filter(p => p.id !== id); save(LS_PLAYERS, players);
  let matches = load(LS_MATCHES);
  const removedMatchIds = matches.filter(m => m.playerA === id || m.playerB === id).map(m => m.id);
  matches = matches.filter(m => m.playerA !== id && m.playerB !== id);
  save(LS_MATCHES, matches);
  let results = load(LS_RESULTS).filter(r => !removedMatchIds.includes(r.matchId));
  save(LS_RESULTS, results);
  showToast('Jugador eliminado');
  refreshAll();
}

// === Cálculo de tabla ===
function computeStats(){
  const players = load(LS_PLAYERS);
  const results = load(LS_RESULTS);
  const matches = load(LS_MATCHES);
  const stats = {};
  players.forEach(p => stats[p.id] = {pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0});

  results.forEach(r => {
    const m = matches.find(m => m.id === r.matchId);
    if(!m) return;
    const a = m.playerA, b = m.playerB;
    stats[a].pj++; stats[b].pj++;
    stats[a].gf += r.goalsA; stats[a].gc += r.goalsB;
    stats[b].gf += r.goalsB; stats[b].gc += r.goalsA;
    if(r.goalsA > r.goalsB){ stats[a].pg++; stats[b].pp++; stats[a].pts += 3; }
    else if(r.goalsA < r.goalsB){ stats[b].pg++; stats[a].pp++; stats[b].pts += 3; }
    else { stats[a].pe++; stats[b].pe++; stats[a].pts++; stats[b].pts++; }
  });

  return players.map(p => {
    const s = stats[p.id] || {pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0};
    return {id: p.id, name: p.name, ...s, gd: s.gf - s.gc};
  });
}

// === Renderizado ===
function renderStandings(){
  const data = computeStats().sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  if(data.length === 0){
    standingsWrap.innerHTML = '<p class="empty-state">No hay jugadores registrados</p>';
    return;
  }
  let html = `<table><thead><tr><th>#</th><th>Jugador</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>`;
  data.forEach((s,i) => html += `<tr><td>\( {i+1}</td><td> \){s.name}</td><td>\( {s.pj}</td><td> \){s.pg}</td><td>\( {s.pe}</td><td> \){s.pp}</td><td>\( {s.gf}</td><td> \){s.gc}</td><td>\( {s.gd}</td><td><strong> \){s.pts}</strong></td></tr>`);
  standingsWrap.innerHTML = html + '</tbody></table>';
}

function renderCalendar(){
  const matches = load(LS_MATCHES).sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
  const players = load(LS_PLAYERS); const map = {}; players.forEach(p => map[p.id] = p.name);
  const filter = filterRound.value;
  const rounds = [...new Set(matches.map(m => m.round))].sort((a,b)=>a-b);
  filterRound.innerHTML = '<option value="">Todas las jornadas</option>' + rounds.map(r => `<option value="\( {r}">Jornada \){r}</option>`).join('');

  let html = '';
  matches.forEach(m => {
    if(filter && m.round != filter) return;
    const res = load(LS_RESULTS).find(r => r.matchId === m.id);
    const played = !!res;
    html += `<div class="match-row">
      <div>
        <strong>\( {map[m.playerA] || '--'} <span class="muted">vs</span> \){map[m.playerB] || '--'}</strong>
        <div class="small">Jornada \( {m.round} · \){new Date(m.datetime).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        \( {played ? `✓ <strong> \){res.goalsA}-${res.goalsB}</strong>` : '<span class="muted">Pendiente</span>'}
      </div>
    </div>`;
  });
  calendarList.innerHTML = html || '<p class="empty-state">No hay partidos programados</p>';
}

function renderMatchesList(){
  const matches = load(LS_MATCHES).sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
  const players = load(LS_PLAYERS); const map = {}; players.forEach(p => map[p.id] = p.name);
  if(matches.length === 0){
    matchesList.innerHTML = '<p class="empty-state">No hay partidos</p>';
    return;
  }
  let html = '';
  matches.forEach(m => {
    const res = load(LS_RESULTS).find(r => r.matchId === m.id);
    html += `<div class="match-row">
      <div><strong>\( {map[m.playerA]} vs \){map[m.playerB]}</strong><div class="small">Jornada \( {m.round} · \){new Date(m.datetime).toLocaleString()}</div></div>
      <div>\( {res ? `<strong> \){res.goalsA} - ${res.goalsB}</strong>` : '<span class="muted">Pendiente</span>'}</div>
    </div>`;
  });
  matchesList.innerHTML = html;
}

function fillAdminSelects(){
  const players = load(LS_PLAYERS);
  ['select-player-a', 'select-player-b'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">Seleccionar jugador</option>';
    players.forEach(p => sel.innerHTML += `<option value="\( {p.id}"> \){p.name}</option>`);
  });

  const matches = load(LS_MATCHES);
  selectAdminMatch.innerHTML = '<option value="">Seleccionar partido</option>';
  matches.forEach(m => {
    const pa = players.find(p=>p.id===m.playerA)?.name || '--';
    const pb = players.find(p=>p.id===m.playerB)?.name || '--';
    selectAdminMatch.innerHTML += `<option value="\( {m.id}">J \){m.round} → \( {pa} vs \){pb} · ${new Date(m.datetime).toLocaleDateString()}</option>`;
  });
}

function renderAdminPlayers(){
  const players = load(LS_PLAYERS);
  if(players.length === 0){
    adminPlayersBox.innerHTML = '<p class="empty-state">No hay jugadores registrados</p>';
    return;
  }
  let html = '';
  players.forEach(p => {
    html += `<div class="player-row">
      <div><strong>\( {p.name}</strong><div class="small">PIN: <code> \){p.pin}</code></div></div>
      <button data-id="${p.id}" class="btn danger delete-player">Eliminar</button>
    </div>`;
  });
  adminPlayersBox.innerHTML = html;
  document.querySelectorAll('.delete-player').forEach(b => b.onclick = () => deletePlayer(b.dataset.id));
}

function renderAdminResults(){
  const results = load(LS_RESULTS).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if(results.length === 0){
    adminResultsBox.innerHTML = '<p class="empty-state">No hay resultados</p>';
    return;
  }
  const players = load(LS_PLAYERS); const map = {}; players.forEach(p=>map[p.id]=p.name);
  const matches = load(LS_MATCHES);
  let html = '';
  results.forEach(r => {
    const m = matches.find(m=>m.id===r.matchId);
    if(!m) return;
    html += `<div class="res-row">
      <div><strong>\( {map[m.playerA]} \){r.goalsA} - \( {r.goalsB} \){map[m.playerB]}</strong>
      <div class="small">\( {new Date(r.createdAt).toLocaleString()} · por \){r.submittedBy}</div></div>
    </div>`;
  });
  adminResultsBox.innerHTML = html;
}

// === Exportar CSV ===
function downloadCSV(data, filename){
  const blob = new Blob([data], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

exportCsvBtn.onclick = () => {
  const stats = computeStats().sort((a,b)=>b.pts-a.pts);
  let csv = 'Pos,Jugador,PJ,PG,PE,PP,GF,GC,DG,PTS\n';
  stats.forEach((s,i) => csv += `\( {i+1}, \){s.name},\( {s.pj}, \){s.pg},\( {s.pe}, \){s.pp},\( {s.gf}, \){s.gc},\( {s.gd}, \){s.pts}\n`);
  downloadCSV(csv, 'tabla_posiciones.csv');
};

btnExportAll.onclick = () => {
  let csv = 'Fecha,Jornada,Jugador A,Goles A,Goles B,Jugador B,Enviado por\n';
  load(LS_RESULTS).forEach(r => {
    const m = load(LS_MATCHES).find(m=>m.id===r.matchId);
    if(!m) return;
    const pa = load(LS_PLAYERS).find(p=>p.id===m.playerA)?.name || '--';
    const pb = load(LS_PLAYERS).find(p=>p.id===m.playerB)?.name || '--';
    csv += `\( {new Date(m.datetime).toLocaleString()}, \){m.round},\( {pa}, \){r.goalsA},\( {r.goalsB}, \){pb},${r.submittedBy}\n`;
  });
  downloadCSV(csv, 'resultados_completos.csv');
};

// === Refresh ===
function refreshAll(){
  renderCodes();
  renderStandings();
  renderCalendar();
  renderMatchesList();
  fillAdminSelects();
  renderAdminPlayers();
  renderAdminResults();
}

// Cerrar sesión admin
btnLogoutAdmin.onclick = () => { setActiveTab('register'); showToast('Sesión cerrada'); };

// Inicio
refreshAll();
window.deletePlayer = deletePlayer;
