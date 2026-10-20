import { LEAGUES, getLeague } from '../data/leagues.js';
import { ATTRS, ATTR_LABELS, POSITIONS, FOCUS, START, NATIONALITIES, LOOKS, overall, roleFor, marketValue } from '../game/player.js';
import { standings, describeNext } from '../game/season.js';
import { EVENTS } from '../game/events.js';
import { avatar, kitColors } from './avatar.js';

export { avatar };

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (k) => (k >= 1000 ? `${(k / 1000).toFixed(k >= 10000 ? 0 : 1)} M€` : `${k} k€`);
const kitColor = (name) => kitColors(name).primary;
const posLabel = (p) => POSITIONS[p].label;
const roleClass = { Titular: 'good', 'Rotación': 'mid', Suplente: 'low', Cantera: 'low' };

// ---------- Piezas pequeñas ----------
const bar = (label, val, cls = '') =>
  `<div class="bar-row"><span>${label}</span><div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, val))}%"></i></div><b>${Math.round(val)}</b></div>`;

const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;

const shell = (inner, cls = '') => `<main class="wrap ${cls}">${inner}</main>`;

// ---------- Menú ----------
export function menu(hasSave) {
  return shell(`
    <section class="hero">
      <div class="logo">⚽</div>
      <h1>Carrera Pro</h1>
      <p class="muted">Crea tu jugador, elige tu liga y construye tu leyenda: traspasos, clásicos, finales y decisiones que cambian tu historia.</p>
      <div class="stack">
        ${hasSave ? `<button class="btn primary big" data-action="continue">Continuar carrera</button>` : ''}
        <button class="btn ${hasSave ? '' : 'primary'} big" data-action="new">${hasSave ? 'Nueva carrera (borra la guardada)' : 'Nueva carrera'}</button>
      </div>
      <p class="tiny muted">${LEAGUES.length} ligas · ${LEAGUES.reduce((n, l) => n + l.clubs.length, 0)} clubes</p>
    </section>`);
}

// ---------- Crear jugador (paso 1) ----------
export function create1(d) {
  const left = START.pool - ATTRS.reduce((s, a) => s + d.attrs[a] - START.base, 0);
  const ovr = overall({ pos: d.pos, attrs: d.attrs });
  const attrRows = ATTRS.map((a) => `
    <div class="attr-row">
      <span>${ATTR_LABELS[a]}</span>
      <button class="btn mini" data-action="attr" data-attr="${a}" data-d="-1" ${d.attrs[a] <= START.base ? 'disabled' : ''}>−</button>
      <b>${d.attrs[a]}</b>
      <button class="btn mini" data-action="attr" data-attr="${a}" data-d="1" ${left <= 0 || d.attrs[a] >= START.max ? 'disabled' : ''}>+</button>
    </div>`).join('');
  return shell(`
    <header class="topbar"><button class="btn mini" data-action="toMenu">← Menú</button><h2>Crea tu jugador</h2><span></span></header>
    <div class="grid2">
      <section class="card center">
        ${avatar({ skin: d.skin, hairStyle: d.hairStyle, hairColor: d.hairColor, beard: d.beard }, 'Carrera Pro', 9, 'full')}
        <div class="ovr-big">${ovr}<small>OVR</small></div>
        <p class="muted">${posLabel(d.pos)} · 17 años</p>
      </section>
      <section class="card">
        <label class="field">Nombre<input type="text" maxlength="24" data-field="name" value="${esc(d.name)}" placeholder="Tu nombre de jugador" /></label>
        <label class="field">Nacionalidad<select data-field="nationality">${NATIONALITIES.map((n) => `<option ${n === d.nationality ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field">Posición<select data-field="pos">${Object.entries(POSITIONS).map(([k, v]) => `<option value="${k}" ${k === d.pos ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
        <div class="field">Piel<div class="swatches">${LOOKS.skins.map((c) => `<button class="swatch ${d.skin === c ? 'on' : ''}" style="background:${c}" data-action="skin" data-value="${c}" aria-label="Color de piel"></button>`).join('')}</div></div>
        <label class="field">Peinado<select data-field="hairStyle">${LOOKS.hairStyles.map((h) => `<option value="${h.id}" ${h.id === d.hairStyle ? 'selected' : ''}>${h.label}</option>`).join('')}</select></label>
        <label class="field">Barba<select data-field="beard">${LOOKS.beards.map((b) => `<option value="${b.id}" ${b.id === d.beard ? 'selected' : ''}>${b.label}</option>`).join('')}</select></label>
        <div class="field">Color de pelo<div class="swatches">${LOOKS.hairColors.map((c) => `<button class="swatch ${d.hairColor === c ? 'on' : ''}" style="background:${c}" data-action="hairColor" data-value="${c}" aria-label="Color de pelo"></button>`).join('')}</div></div>
      </section>
    </div>
    <section class="card">
      <h3>Atributos <span class="chip ${left === 0 ? 'good' : 'mid'}">${left} puntos por repartir</span></h3>
      <p class="tiny muted">Todos arrancan en ${START.base}. Reparte ${START.pool} puntos (máximo ${START.max} por atributo). Tu potencial es un secreto: lo descubrirás jugando.</p>
      ${attrRows}
    </section>
    <button class="btn primary big" data-action="next1" ${left > 0 ? 'disabled' : ''}>${left > 0 ? `Te faltan ${left} puntos` : 'Siguiente: elegir liga y club →'}</button>`);
}

// ---------- Crear jugador (paso 2) ----------
export function create2(d) {
  const ovr = overall({ pos: d.pos, attrs: d.attrs });
  const league = d.leagueId ? getLeague(d.leagueId) : null;
  const clubs = league ? [...league.clubs].sort((a, b) => b.rating - a.rating) : [];
  return shell(`
    <header class="topbar"><button class="btn mini" data-action="back1">← Atrás</button><h2>Liga y club</h2><span></span></header>
    <p class="muted">Eres un chico de 17 años con OVR ${ovr}. Un club grande te va a dejar en la cantera; uno más modesto te dará minutos. Tú decides.</p>
    <section class="card">
      <h3>1. Elige tu liga</h3>
      <div class="league-grid">${LEAGUES.map((l) => `<button class="league ${d.leagueId === l.id ? 'on' : ''}" data-action="league" data-id="${l.id}"><span>${l.flag}</span><b>${esc(l.name)}</b><small>${esc(l.country)}</small></button>`).join('')}</div>
    </section>
    ${league ? `<section class="card">
      <h3>2. Elige tu club</h3>
      <div class="club-list">${clubs.map((c) => {
        const role = roleFor(ovr, c.rating);
        return `<button class="club ${d.clubName === c.name ? 'on' : ''}" data-action="club" data-name="${esc(c.name)}">
          <span class="dot" style="background:${kitColor(c.name)}"></span><b>${esc(c.name)}</b>
          <span class="chip">${c.rating}</span>${chip(role, roleClass[role])}</button>`;
      }).join('')}</div>
      <p class="tiny muted">El número es la fuerza del club. La etiqueta es tu rol probable al llegar.</p>
    </section>` : ''}
    <button class="btn primary big" data-action="start" ${d.clubName ? '' : 'disabled'}>${d.clubName ? '¡Empezar mi carrera!' : 'Elige liga y club'}</button>`);
}

// ---------- Hub ----------
export function hub(G) {
  const p = G.player;
  const s = G.season;
  const ovr = overall(p);
  const table = standings(s);
  const pos = table.findIndex((t) => t.name === G.club.name) + 1;
  const next = describeNext(G);
  const league = getLeague(s.leagueId);
  const done = s.calendar.filter((sl, i) => i < s.idx).length;
  return shell(`
    <header class="topbar"><span class="muted">${esc(s.label)} · ${league.flag} ${esc(league.name)}</span>
      <div><button class="btn mini" data-action="career">Carrera</button> <button class="btn mini" data-action="toMenu">Salir</button></div></header>
    <section class="card player-card">
      <div class="pc-left">${avatar(p.look, G.club.name, 9)}</div>
      <div class="pc-main">
        <h2>${esc(p.name)}</h2>
        <p class="muted">${p.age} años · ${posLabel(p.pos)} · ${esc(p.nationality)}</p>
        <p>${esc(G.club.name)} ${chip(G.contract.role, roleClass[G.contract.role])}</p>
        <p class="tiny muted">${money(G.contract.wage)}/año · contrato ${Math.max(0, G.contract.years)} ${G.contract.years === 1 ? 'año' : 'años'} · valor ${marketValue(p)} M€</p>
      </div>
      <div class="ovr-big">${ovr}<small>OVR</small></div>
    </section>
    ${p.injury > 0 ? `<div class="banner bad">🩹 Estás lesionado: ${p.injury} ${p.injury === 1 ? 'partido' : 'partidos'} fuera.</div>` : ''}
    <div class="grid2">
      <section class="card">
        <h3>Estado</h3>
        ${bar('Energía', p.energy, p.energy < 40 ? 'bad' : '')}
        ${bar('Moral', p.morale, p.morale < 40 ? 'bad' : '')}
        ${bar('Reputación', p.reputation, 'gold')}
        <h3 class="mt">Atributos</h3>
        ${ATTRS.map((a) => bar(ATTR_LABELS[a], p.attrs[a])).join('')}
      </section>
      <section class="card">
        <h3>Próximo partido</h3>
        <div class="match-next">
          <div class="teams"><b>${esc(next.home)}</b><span>vs</span><b>${esc(next.away)}</b></div>
          <p class="muted tiny">${esc(next.label)}</p>
          ${next.tags.map((t) => chip(`⭐ ${t}`, 'gold')).join(' ')}
        </div>
        <h3 class="mt">Plan de la semana</h3>
        <div class="chips">${[['normal', 'Normal'], ['train', 'Entrenar fuerte'], ['rest', 'Descansar']].map(([k, l]) => `<button class="chip btn-chip ${s.plan === k ? 'on' : ''}" data-action="plan" data-value="${k}">${l}</button>`).join('')}</div>
        <h3 class="mt">Foco de entrenamiento</h3>
        <div class="chips">${Object.entries(FOCUS).map(([k, f]) => `<button class="chip btn-chip ${s.focus === k ? 'on' : ''}" data-action="focus" data-value="${k}">${f.label}</button>`).join('')}</div>
        <button class="btn primary big mt" data-action="play">Jugar partido</button>
        <p class="tiny muted">Temporada: ${s.stats.apps} PJ · ${s.stats.goals} goles · ${s.stats.assists} asist. (${done}/${s.calendar.length} fechas)</p>
      </section>
    </div>
    <section class="card">
      <h3>Tabla <span class="chip">Tu posición: ${pos}°</span></h3>
      <table class="table"><thead><tr><th>#</th><th>Club</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead><tbody>
        ${table.map((t, i) => `<tr class="${t.name === G.club.name ? 'me' : ''}"><td>${i + 1}</td><td>${esc(t.name)}</td><td>${t.P}</td><td>${t.GD > 0 ? '+' : ''}${t.GD}</td><td><b>${t.Pts}</b></td></tr>`).join('')}
      </tbody></table>
      ${s.cupAlive ? `<p class="tiny muted">🏆 Sigues vivo en la Copa.</p>` : s.cupWon ? `<p class="tiny">🏆 ¡Ganaste la Copa!</p>` : `<p class="tiny muted">Eliminado de la Copa.</p>`}
    </section>`);
}

// ---------- Momento clave (estilo MadFut) ----------
const KEEPER_SVG = `<svg viewBox="0 0 60 90" aria-hidden="true">
  <rect x="21" y="30" width="18" height="30" rx="6" fill="#f59e0b"/>
  <rect x="22" y="58" width="7" height="26" rx="3" fill="#1a1a1a"/><rect x="31" y="58" width="7" height="26" rx="3" fill="#1a1a1a"/>
  <path d="M22 34 L6 18" stroke="#f59e0b" stroke-width="7" stroke-linecap="round"/><path d="M38 34 L54 18" stroke="#f59e0b" stroke-width="7" stroke-linecap="round"/>
  <circle cx="5" cy="16" r="6" fill="#fff"/><circle cx="55" cy="16" r="6" fill="#fff"/>
  <circle cx="30" cy="20" r="9" fill="#e8b98a"/><path d="M21 18 Q30 8 39 18 Q30 14 21 18Z" fill="#2a1a10"/>
</svg>`;

const goalSvg = `<svg class="scene-bg" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14502e"/><stop offset="1" stop-color="#0c3a20"/></linearGradient>
    <pattern id="net" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0 L4 4 M4 0 L0 4" stroke="#ffffff" stroke-opacity=".13" stroke-width=".35"/></pattern>
  </defs>
  <rect width="160" height="90" fill="url(#grass)"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${i * 40}" y="0" width="20" height="90" fill="#fff" opacity=".025"/>`).join('')}
  <rect x="10" y="8" width="140" height="72" fill="#06140c" opacity=".55"/>
  <rect x="10" y="8" width="140" height="72" fill="url(#net)"/>
  <path d="M10 80 L10 8 L150 8 L150 80" fill="none" stroke="#f4f4f4" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M0 80 L160 80" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
</svg>`;

export function moment(G, shotIdx = null) {
  const c = G.pending;
  const m = c.moment;
  const tags = c.reasons.map((r) => chip(`⭐ ${r}`, 'gold')).join(' ');
  const sp = shotIdx != null ? m.spots[shotIdx] : null;

  // Antes del disparo todos los puntos son grises e iguales: hay que adivinar. Después se revela cuál era gol.
  const dots = m.spots.map((d, i) => {
    const cls = sp ? (d.ok ? 'g' : 'r') : 'u';
    return `<button class="shot-dot ${cls} ${shotIdx === i ? 'picked' : ''}" data-action="shoot" data-idx="${i}" ${sp ? 'disabled' : ''}
      style="left:${d.x}%;top:${d.y}%;--dl:${(-(i * 0.43)).toFixed(2)}s" aria-label="Punto de tiro ${i + 1}"></button>`;
  }).join('');

  // Portero: si es gol se tira al lado contrario; si es falla, va al balón (y la ataja).
  let keeperStyle = '';
  let ballStyle = '';
  if (sp) {
    const side = sp.x < 50 ? -1 : 1;
    const centered = Math.abs(sp.x - 50) < 10;
    const dir = sp.ok ? -side : side;
    const kx = sp.ok ? (centered ? 50 + (Math.random() < 0.5 ? -1 : 1) * 24 : 50 + dir * 26) : sp.x;
    const ky = sp.ok ? 62 : Math.min(72, sp.y + 8);
    keeperStyle = `--kx:${kx}%;--ky:${ky}%;--rot:${sp.ok && centered ? 0 : dir * 65}deg`;
    ballStyle = `--bx:${sp.x}%;--by:${sp.y}%`;
  }
  const factors = m.factors.map((f) => `<span class="chip ${f.pct > 0 ? 'good' : f.pct < 0 ? 'low' : ''}">${esc(f.label)} ${f.pct > 0 ? '+' : ''}${f.pct}%</span>`).join(' ');

  return shell(`
    <section class="card center moment">
      <p class="muted tiny">${esc(c.competition)}</p>
      <div class="teams"><b>${esc(c.home)}</b><span class="score-mini">${c.homeGoals} - ${c.awayGoals}</span><b>${esc(c.away)}</b></div>
      ${tags}
      <h2>⚡ ${esc(m.title)}</h2>
      <p>${esc(m.intro)}</p>
      <div class="scene ${sp ? 'shooting' : ''}" style="${ballStyle};${keeperStyle}">
        ${goalSvg}
        <div class="keeper ${sp ? 'dive' : ''}">${KEEPER_SVG}</div>
        ${dots}
        <div class="ball ${sp ? 'shot' : ''}"></div>
      </div>
      ${sp
        ? `<p class="muted"><b>¡Disparo!</b></p>`
        : `<p><b>Elige dónde patear.</b> Todos los puntos se ven iguales: ¡adivina cuál es gol!</p>
      <p class="muted">Probabilidad de gol: <b>${m.prob}%</b> (${m.greens} de ${m.total} puntos son gol)</p>`}
      <div class="chips center-chips">${factors}</div>
    </section>`);
}

// ---------- Resultado ----------
export function result(G) {
  const c = G.pending;
  const r = c.result;
  const label = { W: 'Victoria', D: 'Empate', L: 'Derrota' }[r.outcome];
  let perf;
  if (c.inv.played) {
    perf = `<p><b>${c.inv.minutes}'</b> en cancha · ${c.pGoals} ${c.pGoals === 1 ? 'gol' : 'goles'} · ${c.pAssists} asist. · nota <b>${r.rating}</b></p>`;
  } else {
    perf = `<p class="muted">${c.inv.reason === 'lesionado' ? 'Estás lesionado y no jugaste.' : 'Te quedaste en el banco: el técnico no te usó.'}</p>`;
  }
  const mo = c.moment && c.moment.chosen != null
    ? `<div class="banner ${c.moment.success ? 'good' : 'bad'}"><b>${esc(c.moment.title)}:</b> ${esc(c.moment.text)} <small>(${c.moment.greens} de ${c.moment.total} puntos verdes)</small></div>` : '';
  return shell(`
    <section class="card center">
      <p class="muted tiny">${esc(c.competition)}</p>
      <div class="scoreboard"><b>${esc(c.home)}</b><span class="score">${c.homeGoals} - ${c.awayGoals}</span><b>${esc(c.away)}</b></div>
      ${c.penalties ? `<p class="muted">${esc(c.penalties)}</p>` : ''}
      <h2 class="${r.outcome === 'W' ? 'goodtxt' : r.outcome === 'L' ? 'badtxt' : ''}">${label}</h2>
      ${perf}${mo}
      ${c.notes.map((n) => `<div class="banner">${esc(n)}</div>`).join('')}
      ${c.cupName === 'Final' && r.outcome === 'W' ? `<div class="banner good">🏆 ¡Campeón de Copa!</div>` : ''}
      ${c.slotType === 'cup' && r.outcome === 'L' ? `<div class="banner bad">Quedaste eliminado de la Copa.</div>` : ''}
      <button class="btn primary big" data-action="next">Continuar</button>
    </section>`);
}

// ---------- Evento ----------
export function event(G) {
  const ev = EVENTS.find((e) => e.id === G.pendingEvent);
  if (G.eventResult) {
    return shell(`
      <section class="card center">
        <h2>${esc(ev.title)}</h2>
        <p>${esc(G.eventResult.text)}</p>
        ${G.eventResult.list.map((t) => chip(t)).join(' ')}
        <button class="btn primary big mt" data-action="eventNext">Continuar</button>
      </section>`);
  }
  return shell(`
    <section class="card center">
      <p class="muted tiny">Decisión importante</p>
      <h2>${esc(ev.title)}</h2>
      <p>${esc(ev.text)}</p>
      <div class="stack">${ev.options.map((o, i) => `<button class="btn big" data-action="eventPick" data-idx="${i}">${esc(o.label)}</button>`).join('')}</div>
    </section>`);
}

// ---------- Fin de temporada ----------
export function seasonEnd(G) {
  const S = G.lastSummary;
  const league = getLeague(G.season.leagueId);
  const deltas = ATTRS.map((a) => `<span class="chip ${S.deltas[a] > 0 ? 'good' : S.deltas[a] < 0 ? 'low' : ''}">${ATTR_LABELS[a]} ${S.deltas[a] > 0 ? '+' : ''}${S.deltas[a]}</span>`).join(' ');
  return shell(`
    <section class="card center">
      <p class="muted tiny">Fin de la temporada ${esc(S.label)}</p>
      <h2>${esc(league.name)}: terminaste ${S.position}° con ${S.pts} pts</h2>
      ${S.trophies.length ? S.trophies.map((t) => chip(`🏆 ${t}`, 'gold')).join(' ') : '<p class="muted">Sin títulos esta temporada.</p>'}
      <div class="stats-grid">
        <div><b>${S.stats.apps}</b><small>Partidos</small></div>
        <div><b>${S.stats.goals}</b><small>Goles</small></div>
        <div><b>${S.stats.assists}</b><small>Asistencias</small></div>
        <div><b>${S.avg || '-'}</b><small>Nota media</small></div>
      </div>
      <h3>Tu evolución (ahora tienes ${S.age} años)</h3>
      <p>OVR ${S.ovrBefore} → <b>${S.ovrAfter}</b></p>
      <div class="chips">${deltas}</div>
      <button class="btn primary big mt" data-action="toTransfer">${S.retireForced ? 'Colgar los botines' : 'Ir al mercado de fichajes'}</button>
    </section>`);
}

// ---------- Mercado ----------
export function transfer(G) {
  const p = G.player;
  const offers = G.offers.map((o, i) => `
    <article class="offer ${o.kind}">
      <div><b>${o.flag} ${esc(o.club)}</b> <span class="chip">${o.rating}</span> ${chip(o.role, roleClass[o.role])}</div>
      <p class="tiny muted">${esc(o.leagueName)} · ${money(o.wage)}/año · ${o.years} ${o.years === 1 ? 'año' : 'años'}</p>
      <button class="btn ${o.kind === 'new' ? 'primary' : ''}" data-action="offer" data-idx="${i}">${o.kind === 'stay' ? 'Seguir en el club' : o.kind === 'renew' ? 'Renovar contrato' : 'Fichar por este club'}</button>
    </article>`).join('');
  return shell(`
    <header class="topbar"><span></span><h2>Mercado de fichajes</h2><span></span></header>
    <p class="muted">${esc(p.name)}, ${p.age} años · OVR ${overall(p)} · reputación ${p.reputation}. Estas son tus opciones:</p>
    <div class="offers">${offers}</div>
    ${p.age >= 33 ? `<button class="btn big" data-action="retire">Retirarme del fútbol</button>` : ''}`);
}

// ---------- Fin de carrera ----------
export function end(G) {
  const L = G.legacy;
  return shell(`
    <section class="card center">
      ${avatar(G.player.look, G.club.name, 9, 'full')}
      <p class="muted tiny">Te retiraste a los ${G.player.age} años</p>
      <h1>${esc(G.player.name)}</h1>
      <h2 class="gold-text">${esc(L.tier)}</h2>
      <p class="muted">Puntaje de legado: ${L.score}</p>
      <div class="stats-grid">
        <div><b>${G.career.apps}</b><small>Partidos</small></div>
        <div><b>${G.career.goals}</b><small>Goles</small></div>
        <div><b>${G.career.assists}</b><small>Asistencias</small></div>
        <div><b>${G.peakOvr}</b><small>OVR máximo</small></div>
      </div>
      <h3>Palmarés</h3>
      ${G.trophies.length ? `<div class="chips">${G.trophies.map((t) => chip(`🏆 ${t.name} ${t.season}`, 'gold')).join(' ')}</div>` : '<p class="muted">Sin títulos.</p>'}
      <button class="btn big mt" data-action="career">Ver mi trayectoria</button>
      <button class="btn primary big" data-action="newCareer">Empezar otra carrera</button>
    </section>`);
}

// ---------- Trayectoria ----------
export function career(G) {
  return shell(`
    <header class="topbar"><button class="btn mini" data-action="backGame">← Volver</button><h2>Mi trayectoria</h2><span></span></header>
    <section class="card">
      <h3>${esc(G.player.name)} · ${G.career.apps} partidos · ${G.career.goals} goles · ${G.career.assists} asist.</h3>
      <div class="table-wrap"><table class="table"><thead><tr><th>Temp.</th><th>Club</th><th>Edad</th><th>OVR</th><th>PJ</th><th>G</th><th>A</th><th>Nota</th><th>Pos.</th></tr></thead><tbody>
        ${G.history.length ? G.history.map((h) => `<tr><td>${esc(h.season)}</td><td>${esc(h.club)}${h.trophies.length ? ' 🏆' : ''}</td><td>${h.age}</td><td>${h.ovr}</td><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.avg || '-'}</td><td>${h.position}°</td></tr>`).join('') : '<tr><td colspan="9" class="muted">Aún no terminas ninguna temporada.</td></tr>'}
      </tbody></table></div>
    </section>
    <section class="card"><h3>Palmarés</h3>
      ${G.trophies.length ? `<div class="chips">${G.trophies.map((t) => chip(`🏆 ${t.name} ${t.season} (${t.club})`, 'gold')).join(' ')}</div>` : '<p class="muted">Todavía no hay títulos. ¡A trabajar!</p>'}
    </section>`);
}

export const screens = { hub, moment, result, event, seasonEnd, transfer, end };
