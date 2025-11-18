// Estructura de datos en localStorage
const STORAGE = {
    codes: 'tournament_codes',      // [{code: "1234", used: false}]
    players: 'tournament_players',  // [{id:1, name:"Juan", stats:...}]
    matches: 'tournament_matches',  // [{id:1, playerA:"Juan", playerB:"Pedro", date:"2025-04-01", time:"20:00", goalsA:null, goalsB:null}]
    admin: 'tournament_admin'
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
    loadMatches();
    updateStandings();
    showSection('register');
    
    // Inicializar códigos si no existen
    if (!localStorage.getItem(STORAGE.codes)) {
        localStorage.setItem(STORAGE.codes, JSON.stringify([]));
    }
});

// Mostrar sección
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    
    if (sectionId === 'calendar') loadMatches();
    if (sectionId === 'table') updateStandings();
    if (sectionId === 'admin' && isAdmin()) loadAdminPanel();
}

// Admin
function promptAdmin() {
    const pass = prompt("Ingresa la clave de administrador:");
    if (pass === "0007") {
        localStorage.setItem(STORAGE.admin, "true");
        showSection('admin');
        loadAdminPanel();
    } else if (pass !== null) {
        alert("Clave incorrecta");
    }
}

function isAdmin() {
    return localStorage.getItem(STORAGE.admin) === "true";
}

function logoutAdmin() {
    localStorage.removeItem(STORAGE.admin);
    showSection('register');
    document.getElementById('admin').classList.add('hidden');
}

// Generar código
function generateCode() {
    if (!isAdmin()) return alert("Acceso denegado");
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const codes = JSON.parse(localStorage.getItem(STORAGE.codes));
    codes.push({code, used: false});
    localStorage.setItem(STORAGE.codes, JSON.stringify(codes));
    
    document.getElementById('newCode').textContent = code;
}

// Registro de jugador
function registerPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const code = document.getElementById('regCode').value.trim();
    
    if (!name || !code || code.length !== 4) {
        document.getElementById('regMessage').textContent = "Completa todos los campos correctamente";
        return;
    }
    
    const codes = JSON.parse(localStorage.getItem(STORAGE.codes));
    const codeObj = codes.find(c => c.code === code);
    
    if (!codeObj) {
        document.getElementById('regMessage').textContent = "Código inválido";
        return;
    }
    
    if (codeObj.used) {
        document.getElementById('regMessage').textContent = "Código ya usado";
        return;
    }
    
    const players = JSON.parse(localStorage.getItem(STORAGE.players) || '[]');
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        document.getElementById('regMessage').textContent = "Jugador ya registrado";
        return;
    }
    
    // Marcar código como usado
    codeObj.used = true;
    localStorage.setItem(STORAGE.codes, JSON.stringify(codes));
    
    // Registrar jugador
    players.push({
        id: Date.now(),
        name,
        stats: { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0, pts:0 }
    });
    
    localStorage.setItem(STORAGE.players, JSON.stringify(players));
    
    document.getElementById('regMessage').textContent = "¡Registrado con éxito!";
    document.getElementById('playerName').value = '';
    document.getElementById('regCode').value = '';
    
    loadPlayers();
    updateStandings();
}

// Cargar selectores de jugadores
function loadPlayers() {
    const players = JSON.parse(localStorage.getItem(STORAGE.players) || '[]');
    const selects = ['playerA', 'playerB', 'playersList'];
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'playersList') {
            el.innerHTML = players.map(p => `
                <li>${p.name} 
                    <button onclick="deletePlayer(${p.id})" style="background:#ff0066; padding:5px 10px; font-size:0.8em;">Eliminar</button>
                </li>
            `).join('');
        } else {
            el.innerHTML = '<option value="">Seleccionar jugador</option>' + 
                players.map(p => `<option value="\( {p.name}"> \){p.name}</option>`).join('');
        }
    });
}

// Crear partido
function createMatch() {
    if (!isAdmin()) return;
    
    const a = document.getElementById('playerA').value;
    const b = document.getElementById('playerB').value;
    const date = document.getElementById('matchDate').value;
    const time = document.getElementById('matchTime').value;
    
    if (!a || !b || a === b || !date || !time) {
        alert("Completa todos los campos y selecciona jugadores distintos");
        return;
    }
    
    const matches = JSON.parse(localStorage.getItem(STORAGE.matches) || '[]');
    matches.push({
        id: Date.now(),
        playerA: a,
        playerB: b,
        date,
        time,
        goalsA: null,
        goalsB: null
    });
    
    localStorage.setItem(STORAGE.matches, JSON.stringify(matches));
    loadMatches();
    alert("Partido creado");
}

// Cargar partidos
function loadMatches() {
    const matches = JSON.parse(localStorage.getItem(STORAGE.matches) || '[]');
    const list = document.getElementById('matchesList');
    
    if (matches.length === 0) {
        list.innerHTML = "<p>No hay partidos programados</p>";
        return;
    }
    
    list.innerHTML = matches.map(m => `
        <div class="match-card" style="background:rgba(157,0,255,0.2); padding:15px; margin:10px 0; border-radius:10px;">
            <strong>\( {m.playerA} vs \){m.playerB}</strong><br>
            📅 \( {m.date} ⏰ \){m.time}<br>
            \( {m.goalsA === null ? '⏳ Pendiente' : ` \){m.goalsA} - ${m.goalsB}`}
        </div>
    `).join('');
    
    if (isAdmin()) {
        const select = document.getElementById('resultMatch');
        select.innerHTML = '<option value="">Seleccionar partido</option>' +
            matches.filter(m => m.goalsA === null).map(m => 
                `<option value="\( {m.id}"> \){m.playerA} vs \( {m.playerB} ( \){m.date} ${m.time})</option>`
            ).join('');
    }
}

// Cargar inputs de resultado
function loadResultInputs() {
    const matchId = document.getElementById('resultMatch').value;
    if (!matchId) {
        document.getElementById('resultInputs').innerHTML = '';
        return;
    }
    
    const matches = JSON.parse(localStorage.getItem(STORAGE.matches));
    const match = matches.find(m => m.id == matchId);
    
    document.getElementById('resultInputs').innerHTML = `
        <input type="number" id="goalsA" min="0" value="0" style="width:80px;"> 
        \( {match.playerA} - \){match.playerB} 
        <input type="number" id="goalsB" min="0" value="0" style="width:80px;">
    `;
}

// Guardar resultado
function saveResult() {
    if (!isAdmin()) return;
    
    const matchId = document.getElementById('resultMatch').value;
    const goalsA = parseInt(document.getElementById('goalsA').value) || 0;
    const goalsB = parseInt(document.getElementById('goalsB').value) || 0;
    
    let matches = JSON.parse(localStorage.getItem(STORAGE.matches));
    const match = matches.find(m => m.id == matchId);
    if (!match || match.goalsA !== null) return;
    
    match.goalsA = goalsA;
    match.goalsB = goalsB;
    localStorage.setItem(STORAGE.matches, JSON.stringify(matches));
    
    updatePlayerStats(match.playerA, match.playerB, goalsA, goalsB);
    loadMatches();
    updateStandings();
    alert("Resultado guardado");
}

// Actualizar estadísticas
function updatePlayerStats(playerA, playerB, goalsA, goalsB) {
    let players = JSON.parse(localStorage.getItem(STORAGE.players));
    
    const pA = players.find(p => p.name === playerA);
    const pB = players.find(p => p.name === playerB);
    
    // Actualizar ambos
    [pA, pB].forEach((p, i) => {
        const gf = i === 0 ? goalsA : goalsB;
        const gc = i === 0 ? goalsB : goalsA;
        const won = gf > gc ? 1 : 0;
        const draw = gf === gc ? 1 : 0;
        const lost = gf < gc ? 1 : 0;
        
        p.stats.pj += 1;
        p.stats.pg += won;
        p.stats.pe += draw;
        p.stats.pp += lost;
        p.stats.gf += gf;
        p.stats.gc += gc;
        p.stats.dg += gf - gc;
        p.stats.pts += won ? 3 : draw ? 1 : 0;
    });
    
    localStorage.setItem(STORAGE.players, JSON.stringify(players));
}

// Tabla de posiciones
function updateStandings() {
    let players = JSON.parse(localStorage.getItem(STORAGE.players) || '[]');
    
    players.sort((a,b) => b.stats.pts - a.stats.pts || b.stats.dg - a.stats.dg || b.stats.gf - a.stats.gf);
    
    const tbody = document.getElementById('standingsBody');
    tbody.innerHTML = players.map((p, i) => `
        <tr>
            <td>${i+1}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.stats.pj}</td>
            <td>${p.stats.pg}</td>
            <td>${p.stats.pe}</td>
            <td>${p.stats.pp}</td>
            <td>${p.stats.gf}</td>
            <td>${p.stats.gc}</td>
            <td>${p.stats.dg}</td>
            <td><strong>${p.stats.pts}</strong></td>
        </tr>
    `).join('');
}

// Eliminar jugador
function deletePlayer(id) {
    if (!confirm("¿Eliminar este jugador y todos sus datos?")) return;
    
    let players = JSON.parse(localStorage.getItem(STORAGE.players));
    players = players.filter(p => p.id !== id);
    localStorage.setItem(STORAGE.players, JSON.stringify(players));
    
    loadPlayers();
    updateStandings();
    loadMatches();
}

// Panel admin
function loadAdminPanel() {
    if (!isAdmin()) return;
    loadPlayers();
    loadMatches();
}
