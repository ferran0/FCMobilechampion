/* script.js - GAMER UI + Jornadas + Jugado checkbox + Pro visuals
   Mantiene todas las funciones previas:
   - Admin key: 48279509
   - Códigos 4 dígitos (uso único)
   - Registro con PIN (se muestra una vez)
   - Calendario con jornada (libre)
   - Cuando se registra resultado: marca match.played = true, checkbox en calendario y toast con nombres del partido
   - Tabla automática con PJ, PG, PE, PP, GF, GC, DG, PTS
   - Eliminar jugador desde admin
   - Guardado local (localStorage)
*/

// ===== Storage keys =====
const LS_PLAYERS = 'fc_players_vfinal';
const LS_MATCHES = 'fc_matches_vfinal';
const LS_RESULTS = 'fc_results_vfinal';
const LS_CODES = 'fc_codes_vfinal';

// ===== Admin key =====
const ADMIN_KEY = '48279509';

// ===== Utils =====
const uid = () => 'id_' + Math.random().toString(36).slice(2,9);
const genPin = () => Math.random().toString(36).slice(2,10);
const gen4 = () => String(Math.floor(1000 + Math.random()*9000));
const load = k => JSON.parse(localStorage.getItem(k) || '[]');
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const toastEl = document.getElementById('toast') || (function(){ const t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); return t; })();

function showToast(msg, ms=2800){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=> toastEl.classList.remove('show'), ms);
}

// ===== Seed if empty =====
(function seedIfEmpty(){
 if (load(LS_PLAYERS).length === 0 && load(LS_MATCHES).length === 0 && load(LS_RESULTS).length === 0){
    const p1 = { id: uid(), name: 'eca', pin: 'entoec6el', logo: null };
    const p2 = { id: uid(), name: 'rival', pin: genPin(), logo: null };
    save(LS_PLAYERS, [p1,p2]);
    const mId = uid(); const now = new Date().toISOString();
    save(LS_MATCHES, [{ id: mId, datetime: now, playerA: p1.id, playerB: p2.id, round: 1, played: true }]);
    save(LS_RESULTS, [{ id: uid(), matchId: mId, goalsA: 2, goalsB: 1, evidence: null, submittedBy: p1.id, createdAt: new Date().toISOString() }]);
  }
})();

// ===== Elements =====
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

// ===== Tabs =====
function setActiveTab(tab){
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  if(tab==='register'){ btnRegister.classList.add('active'); panelRegister.classList.remove('hidden'); refreshAll(); }
  if(tab==='calendar'){ btnCalendar.classList.add('active'); panelCalendar.classList.remove('hidden'); refreshAll(); }
  if(tab==='table'){ btnTable.classList.add('active'); panelTable.classList.remove('hidden'); refreshAll(); }
  if(tab==='adminLogin'){ btnAdmin.classList.add('active'); panelAdminLogin.classList.remove('hidden'); }
  if(tab==='admin'){ btnAdmin.classList.add('active'); panelAdmin.classList.remove('hidden'); refreshAll(); }
}
btnRegister.addEventListener('click', ()=> setActiveTab('register'));
btnCalendar.addEventListener('click', ()=> setActiveTab('calendar'));
btnTable.addEventListener('click', ()=> setActiveTab('table'));
btnAdmin.addEventListener('click', ()=> setActiveTab('adminLogin'));
setActiveTab('register');

// ===== Register =====
formRegister.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  registerMsg.textContent=''; showPin.textContent='';
  const name = inputName.value.trim();
  const code = inputCode.value.trim();
  if(!name || !code){ registerMsg.textContent = 'Completa los campos'; return; }
  const codes = load(LS_CODES);
  const idx = codes.findIndex(c => c.code === code && c.used === false);
  if(idx === -1){ registerMsg.textContent = 'Código inválido o ya usado'; return; }
  const players = load(LS_PLAYERS);
  if(players.find(p => p.name.toLowerCase() === name.toLowerCase())){ registerMsg.textContent = 'Ese nombre ya está registrado'; return; }
  const newPin = genPin();
  players.push({ id: uid(), name, pin: newPin, logo: null });
  save(LS_PLAYERS, players);
  codes[idx].used = true; save(LS_CODES, codes);
  registerMsg.textContent = 'Registro exitoso. Guarda tu PIN (se muestra una sola vez)';
  showPin.innerHTML = `<strong>PIN:</strong> <code>${newPin}</code>`;
  inputName.value=''; inputCode.value='';
  showToast('Jugador registrado ✅');
  refreshAll();
});

// ===== Admin Login =====
formAdminLogin.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const key = adminKeyInput.value.trim(); adminKeyInput.value='';
  if(key === ADMIN_KEY){ setActiveTab('admin'); showToast('Bienvenido, Admin'); }
  else { adminLoginMsg.textContent = 'Clave incorrecta'; showToast('Clave incorrecta',1600); }
});

// ===== Generate Code =====
btnGenerateCode.addEventListener('click', ()=>{
  const codes = load(LS_CODES);
  const code = { id: uid(), code: gen4(), used: false, createdAt: new Date().toISOString() };
  codes.push(code); save(LS_CODES, codes);
  renderCodes();
  navigator.clipboard?.writeText(code.code).catch(()=>{});
  showToast('Código generado y copiado: ' + code.code, 2200);
});
function renderCodes(){
  const codes = load(LS_CODES);
  const active = codes.filter(c=>!c.used).map(c=>c.code);
  codesActive.innerHTML = active.length ? `<div class="small">Códigos activos: ${active.join(' · ')}</div>` : '<div class="small">No hay códigos activos</div>';
}

// ===== Add Match =====
formAddMatch.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const round = Number(matchRoundInput.value) || 1;
  const dt = matchDatetime.value;
  const a = selectPlayerA.value;
  const b = selectPlayerB.value;
  if(!dt || !a || !b){ alert('Completa todos los campos'); return; }
  if(a===b){ alert('Selecciona jugadores distintos'); return; }
  const matches = load(LS_MATCHES);
  matches.push({ id: uid(), datetime: new Date(dt).toISOString(), playerA: a, playerB: b, round, played: false });
  save(LS_MATCHES, matches);
  matchRoundInput.value=''; matchDatetime.value=''; selectPlayerA.value=''; selectPlayerB.value='';
  refreshAll();
  showToast('Partido agregado · Jornada ' + round, 1800);
});

// ===== Admin: Save Result =====
formAdminResult.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const matchId = selectAdminMatch.value;
  const gA = parseInt(adminGoalsA.value,10);
  const gB = parseInt(adminGoalsB.value,10);
  if(!matchId || isNaN(gA) || isNaN(gB)){ alert('Completa todo'); return; }
  const matches = load(LS_MATCHES);
  const midx = matches.findIndex(m=>m.id===matchId);
  const match = matches[midx];
  const results = load(LS_RESULTS);

  results.push({ id: uid(), matchId, goalsA: gA, goalsB: gB, evidence: null, submittedBy: 'admin', createdAt: new Date().toISOString() });
  save(LS_RESULTS, results);

  matches[midx].played = true;
  save(LS_MATCHES, matches);

  adminGoalsA.value=''; adminGoalsB.value='';
  refreshAll();

  const players = load(LS_PLAYERS); const mp = {}; players.forEach(p=>mp[p.id]=p.name);
  showToast(`Resultado guardado: ${mp[match.playerA]} ${gA} - ${gB} ${mp[match.playerB]}`, 3200);
});

// ===== Delete Player =====
function deletePlayer(playerId){
  if(!confirm('Eliminar jugador y partidos/resultados relacionados?')) return;
  let players = load(LS_PLAYERS); players = players.filter(p=>p.id!==playerId); save(LS_PLAYERS, players);
  let matches = load(LS_MATCHES);
  const removed = matches.filter(m => m.playerA===playerId || m.playerB===playerId).map(m=>m.id);
  matches = matches.filter(m => m.playerA!==playerId && m.playerB!==playerId); save(LS_MATCHES, matches);
  let results = load(LS_RESULTS); results = results.filter(r => !removed.includes(r.matchId)); save(LS_RESULTS, results);
  refreshAll();
  showToast('Jugador eliminado',1400);
}

// ===== Compute Stats =====
function computeStats(){
  const players = load(LS_PLAYERS);
  const matches = load(LS_MATCHES);
  const results = load(LS_RESULTS);
  const stats = {};
  players.forEach(p => stats[p.id] = { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 });
  const matchMap = {}; matches.forEach(m => matchMap[m.id]=m);
  results.forEach(r => {
    const m = matchMap[r.matchId]; if(!m) return;
    const a = m.playerA; const b = m.playerB;
    stats[a].pj++; stats[b].pj++;
    stats[a].gf += r.goalsA; stats[a].gc += r.goalsB;
    stats[b].gf += r.goalsB; stats[b].gc += r.goalsA;
    if(r.goalsA > r.goalsB){ stats[a].pg++; stats[b].pp++; stats[a].pts += 3; }
    else if(r.goalsA < r.goalsB){ stats[b].pg++; stats[a].pp++; stats[b].pts += 3; }
    else { stats[a].pe++; stats[b].pe++; stats[a].pts++; stats[b].pts++; }
  });
  const out = []; players.forEach(p=>{
    const s = stats[p.id];
    out.push({ id:p.id, name:p.name, pj:s.pj, pg:s.pg, pe:s.pe, pp:s.pp, gf:s.gf, gc:s.gc, gd:s.gf - s.gc, pts:s.pts });
  });
  return out;
}

// ===== Render Standings =====
function renderStandings(){
  const data = computeStats();
  data.sort((x,y)=> { if(y.pts!==x.pts) return y.pts-x.pts; if(y.gd!==x.gd) return y.gd-x.gd; return y.gf-x.gf; });
  let html = `<table><thead><tr><th>#</th><th>Jugador</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>`;
  data.forEach((s,i)=> html += `<tr><td>${i+1}</td><td>${escapeHtml(s.name)}</td><td>${s.pj}</td><td>${s.pg}</td><td>${s.pe}</td><td>${s.pp}</td><td>${s.gf}</td><td>${s.gc}</td><td>${s.gd}</td><td>${s.pts}</td></tr>`);
  html += `</tbody></table>`;
  standingsWrap.innerHTML = html;
}

// ===== Render Matches =====
function renderMatchesList(){
  const matches = load(LS_MATCHES).slice().sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
  const players = load(LS_PLAYERS); const map = {}; players.forEach(p=>map[p.id]=p.name);
  if(matches.length===0) { matchesList.innerHTML = '<p class="small">No hay partidos.</p>'; return; }
  let html = '';
  matches.forEach(m=>{
    const res = load(LS_RESULTS).find(r=> r.matchId === m.id);
    html += `<div class="match-row"><div class="match-left"><div class="info-players"><strong>${escapeHtml(map[m.playerA]||'--')} vs ${escapeHtml(map[m.playerB]||'--')}</strong><div class="small">Jornada ${m.round} · ${new Date(m.datetime).toLocaleString()}</div></div></div><div>${ res ? `<strong>${res.goalsA} - ${res.goalsB}</strong>` : '<span class="small">Pendiente</span>' }</div></div>`;
  });
  matchesList.innerHTML = html;
}

// ===== Render Calendar =====
function renderCalendar(){
  const matches = load(LS_MATCHES).slice().sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
  const players = load(LS_PLAYERS); const map = {}; players.forEach(p=>map[p.id]=p.name);
  const filter = filterRound.value;
  let html = '';
  const rounds = [...new Set(matches.map(m=>m.round))].sort((a,b)=>a-b);
  filterRound.innerHTML = '<option value="">Todas</option>';
  rounds.forEach(r=> filterRound.insertAdjacentHTML('beforeend', `<option value="${r}">Jornada ${r}</option>`));
  matches.forEach(m=>{
    if(filter && String(m.round) !== filter) return;
    const res = load(LS_RESULTS).find(r=> r.matchId===m.id);
    const played = !!res || m.played;
    html += `<div class="match-row">
      <div>
        <div><strong>${escapeHtml(map[m.playerA]||'--')} <span class="muted">vs</span> ${escapeHtml(map[m.playerB]||'--')}</strong></div>
        <div class="small">Jornada ${m.round} · ${new Date(m.datetime).toLocaleString()}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        ${ played ? `<label class="played"><input type="checkbox" checked disabled> Jugado</label>` : `<label class="played"><input type="checkbox" disabled> Jugado</label>`}
        ${ res ? `<div class="small">Resultado: <strong>${res.goalsA} - ${res.goalsB}</strong></div>` : '' }
      </div>
    </div>`;
  });
  calendarList.innerHTML = html || '<p class="small">No hay partidos.</p>';
}

// ===== Fill Admin Selects =====
function fillAdminSelects(){
  const players = load(LS_PLAYERS);
  selectPlayerA.innerHTML = '<option value="">Jugador A</option>';
  selectPlayerB.innerHTML = '<option value="">Jugador B</option>';
  const matches = load(LS_MATCHES);
  selectAdminMatch.innerHTML = '<option value="">Seleccionar partido</option>';

  players.forEach(p=>{
    selectPlayerA.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
    selectPlayerB.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
  });

  matches.forEach(m=>{
    const pmap = load(LS_PLAYERS).reduce((a,p)=> (a[p.id]=p.name, a), {});
    const label = `${escapeHtml(pmap[m.playerA])} vs ${escapeHtml(pmap[m.playerB])} · J${m.round}`;
    selectAdminMatch.insertAdjacentHTML('beforeend', `<option value="${m.id}">${label}</option>`);
  });
}

// ===== Admin Players =====
function renderAdminPlayers(){
  const players = load(LS_PLAYERS);
  if(players.length===0){ adminPlayersBox.innerHTML = '<p class="small">No hay jugadores.</p>'; return; }
  let html='';
  players.forEach(p=> html += `<div class="player-row"><div><strong>${escapeHtml(p.name)}</strong><div class="small">PIN: <code>${escapeHtml(p.pin)}</code></div></div><div><button data-id="${p.id}" class="btn delete-player">Eliminar</button></div></div>`);
  adminPlayersBox.innerHTML = html;
  document.querySelectorAll('.delete-player').forEach(b=> b.addEventListener('click', ()=> deletePlayer(b.getAttribute('data-id'))));
}

// ===== Admin Results =====
function renderAdminResults(){
  const results = load(LS_RESULTS).slice().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  const matches = load(LS_MATCHES);
  const players = load(LS_PLAYERS);
  const pmap = {}; players.forEach(p=> pmap[p.id] = p.name);

  if(results.length===0){
    adminResultsBox.innerHTML = '<p class="small">No hay resultados registrados.</p>';
    return;
  }

  let html = '';
  results.forEach(r=>{
    const m = matches.find(x=>x.id===r.matchId);
    if(!m) return;
    html += `
      <div class="result-row">
        <div><strong>${escapeHtml(pmap[m.playerA])} ${r.goalsA} - ${r.goalsB} ${escapeHtml(pmap[m.playerB])}</strong></div>
        <div class="small">J${m.round} · ${new Date(r.createdAt).toLocaleString()}</div>
      </div>
    `;
  });

  adminResultsBox.innerHTML = html;
}

// ===== Refresh All =====
function refreshAll(){
  renderCodes();
  renderStandings();
  renderMatchesList();
  renderCalendar();
  fillAdminSelects();
  renderAdminPlayers();
  renderAdminResults();
}

// ===== Escape HTML =====
function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"']/g, m=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
