import { getLeague } from '../data/leagues.js';
import { ATTR_LABELS, FOCUS, POSITIONS, overall } from './player.js';
import { rand, chance, pick, clamp, poisson } from './rng.js';
import { standings, applyResult, nextSlot, clubRating, describeNext } from './season.js';

function simGoals(hr, ar) {
  const d = clamp(hr + 3 - ar, -25, 25);
  return [poisson(1.45 * Math.pow(1.04, d)), poisson(1.15 * Math.pow(1.04, -d))];
}

// ---------- Momentos clave (estilo MadFut) ----------
// Se ve el arco con 12 puntos: verde = gol, rojo = falla.
// Más probabilidad de gol => más puntos verdes (y más grandes y lentos). Menos => más rojos.
export const TOTAL_SPOTS = 12;
const SPOTS = [
  [14, 24], [38, 20], [62, 20], [86, 24],
  [12, 52], [36, 50], [64, 50], [88, 52],
  [16, 78], [39, 76], [61, 76], [84, 78],
];

// base: probabilidad de partida · k: cuánto pesa tu atributo · oppK: cuánto pesa el nivel del rival
const MOMENTS = {
  penalty: {
    title: 'Penal decisivo', attrs: ['shooting'], attrLabel: 'tiro', base: 0.78, k: 0.5, oppK: 0.5, rep: 2, failRep: -2,
    intro: (o) => `Te cobran un penal a favor y el balón queda en tus manos. Enfrente tienes al arquero de ${o}.`,
    win: ['¡GOOOL! Lo clavaste donde no llegaba el arquero.', '¡Gol! Penal ejecutado con frialdad total.'],
    lose: ['El arquero adivinó el lado y la atajó.', 'Se fue al palo y salió. ¡Qué mala suerte!', 'Te fuiste por encima del travesaño.'],
  },
  one_on_one: {
    title: 'Mano a mano', attrs: ['shooting', 'dribbling'], attrLabel: 'definición', base: 0.62, k: 0.6, oppK: 1, rep: 2, failRep: -1,
    intro: (o) => `Una pelota filtrada te deja solo frente al arquero de ${o}. Tienes un segundo para decidir.`,
    win: ['¡Gol! Definiste con calma y el arquero no pudo hacer nada.', '¡Qué clase! Lo dejaste sentado y la mandaste adentro.'],
    lose: ['El arquero salió bien y le tapó el ángulo.', 'Te apuraste y la mandaste afuera.'],
  },
  free_kick: {
    title: 'Tiro libre peligroso', attrs: ['shooting', 'passing'], attrLabel: 'balón parado', base: 0.32, k: 0.8, oppK: 0.8, rep: 3, failRep: -1,
    intro: (o) => `Falta al borde del área de ${o}. Tus compañeros te miran y te dejan el balón.`,
    win: ['¡GOLAZO de tiro libre! Se clavó en el ángulo.', '¡Gol! Pasó rozando la barrera y entró.'],
    lose: ['La barrera la tapó.', 'El arquero llegó a desviarla al córner.', 'Se fue por encima del arco.'],
  },
  header: {
    title: 'Cabezazo en el área', attrs: ['physical', 'shooting'], attrLabel: 'juego aéreo', base: 0.45, k: 0.8, oppK: 1.2, rep: 2, failRep: -1,
    intro: (o) => `Llega el centro al área de ${o} y tú subes con todo para el remate de cabeza.`,
    win: ['¡Cabezazo brutal! Ganaste el salto y la mandaste adentro.', '¡Gol de cabeza! Se elevó por encima de todos.'],
    lose: ['Te ganaron la posición y el cabezazo salió desviado.', 'El arquero se quedó con el balón.'],
  },
  long_shot: {
    title: 'Remate de media distancia', attrs: ['shooting'], attrLabel: 'tiro', base: 0.3, k: 0.7, oppK: 1, rep: 3, failRep: -2,
    intro: (o) => `La pelota te cae al borde del área de ${o}. ¡Hay que sacar el latigazo!`,
    win: ['¡GOLAZO de otro planeta! Se clavó en el ángulo.', '¡Misilazo! El arquero ni se movió.'],
    lose: ['Le pegaste mal y se fue a la tribuna.', 'El arquero se estiró y la sacó al córner.'],
  },
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Probabilidad de gol del momento y por qué. Cuenta tu atributo, el rival, tu equipo, moral, cansancio y presión.
function shotProb(G, ctx, t) {
  const p = G.player;
  const opp = ctx.home === ctx.me ? ctx.away : ctx.home;
  const oppR = clubRating(G.season, opp);
  const attr = t.attrs.reduce((sum, a) => sum + p.attrs[a], 0) / t.attrs.length;
  const factors = [];
  let prob = t.base;
  const add = (label, v, always = false) => {
    prob += v;
    if (always || Math.abs(v) >= 0.005) factors.push({ label, pct: Math.round(v * 100) });
  };
  add(`Tu ${t.attrLabel} (${Math.round(attr)})`, ((attr - 60) * t.k) / 100, true);
  add(`Rival: ${opp} (${oppR})`, -((oppR - 72) * 0.004 * t.oppK), true);
  add('Tu equipo vs rival', clamp((G.club.rating - oppR) * 0.002, -0.04, 0.04));
  add('Moral', (p.morale - 70) / 400);
  add('Cansancio', p.energy < 60 ? -(60 - p.energy) / 450 : 0);
  const big = ctx.reasons.some((r) => /Final|título/i.test(r));
  const clasico = ctx.reasons.includes('Clásico');
  add('Presión del partido', (big ? -0.03 : 0) + (clasico ? -0.02 : 0));
  return { prob: clamp(prob, 0.08, 0.92), factors, opp };
}

function buildMoment(G, ctx) {
  const pos = G.player.pos;
  const ids = {
    ST: ['penalty', 'one_on_one', 'header', 'long_shot'],
    W: ['one_on_one', 'free_kick', 'long_shot', 'penalty'],
    CM: ['free_kick', 'long_shot', 'penalty'],
    CB: ['header', 'penalty'],
  }[pos];
  const id = pick(ids);
  const t = MOMENTS[id];
  const { prob, factors, opp } = shotProb(G, ctx, t);
  const greens = clamp(Math.round(prob * TOTAL_SPOTS), 1, TOTAL_SPOTS - 1);
  const okSet = new Set(shuffle([...Array(TOTAL_SPOTS).keys()]).slice(0, greens));
  return {
    id, title: t.title, intro: t.intro(opp), attrLabel: t.attrLabel,
    prob: Math.round(prob * 100), greens, total: TOTAL_SPOTS, factors, time: 7,
    spots: SPOTS.map(([x, y], i) => ({ x: x + rand(-3, 3), y: y + rand(-3, 3), ok: okSet.has(i) })),
    chosen: null, text: '',
  };
}

// Para partidas guardadas con el formato anterior.
export function ensureMoment(G) {
  const ctx = G.pending;
  if (ctx?.moment && !ctx.moment.spots) ctx.moment = buildMoment(G, ctx);
}

export function resolveMoment(G, ctx, idx) {
  const m = ctx.moment;
  const t = MOMENTS[m.id];
  const sp = m.spots[idx] ?? m.spots[0];
  m.chosen = m.spots[idx] ? idx : 0;
  m.success = sp.ok;
  if (sp.ok) {
    ctx.pGoals++;
    if (ctx.home === ctx.me) ctx.homeGoals++;
    else ctx.awayGoals++;
    m.text = pick(t.win);
    m.rep = t.rep;
    m.morale = 6;
  } else {
    m.text = pick(t.lose);
    m.rep = t.failRep;
    m.morale = -6;
  }
}

// ---------- Preparar y terminar partido ----------
const PLAY_PROBS = { Titular: [0.9, 0.05], 'Rotación': [0.45, 0.2], Suplente: [0.12, 0.28], Cantera: [0.03, 0.12] };

function involvement(G) {
  const p = G.player;
  if (p.injury > 0) return { played: false, started: false, minutes: 0, reason: 'lesionado' };
  const [start, sub] = PLAY_PROBS[G.contract.role] ?? PLAY_PROBS.Rotación;
  const x = Math.random();
  if (x < start) return { played: true, started: true, minutes: rand(60, 90), reason: null };
  if (x < start + sub) return { played: true, started: false, minutes: rand(12, 35), reason: null };
  return { played: false, started: false, minutes: 0, reason: 'banca' };
}

export function prepareMatch(G) {
  const s = G.season;
  const slot = nextSlot(s);
  if (!slot) return null;
  const me = G.club.name;
  const d = describeNext(G);
  const reasons = [...d.tags];
  let others = [];
  if (slot.type === 'league') {
    others = s.rounds[slot.round]
      .filter(([h, a]) => h !== me && a !== me)
      .map(([h, a]) => {
        const [hg, ag] = simGoals(clubRating(s, h), clubRating(s, a));
        return [h, a, hg, ag];
      });
    const pos = standings(s).findIndex((t) => t.name === me) + 1;
    if (pos > 0 && pos <= 2 && slot.round >= 10) reasons.push('Partido clave por el título');
  }
  const [hg, ag] = simGoals(clubRating(s, d.home), clubRating(s, d.away));
  const inv = involvement(G);
  const ctx = {
    me, home: d.home, away: d.away, homeGoals: hg, awayGoals: ag,
    competition: d.label, slotType: slot.type, cupName: slot.name || null, round: slot.round ?? null,
    others, important: reasons.length > 0, reasons, inv, pGoals: 0, pAssists: 0, moment: null, notes: [], result: null,
  };
  if (inv.played) {
    const p = G.player;
    const pos = POSITIONS[p.pos];
    const form = (overall(p) / 70) * (inv.minutes / 90) * (0.7 + (0.3 * p.energy) / 100) * (0.85 + (0.3 * p.morale) / 100);
    const myG = ctx.home === me ? hg : ag;
    for (let i = 0; i < myG; i++) {
      const r = Math.random();
      const gp = pos.goalShare * form;
      const ap = pos.assistShare * form;
      if (r < gp) ctx.pGoals++;
      else if (r < gp + ap) ctx.pAssists++;
    }
    if (ctx.important && inv.minutes >= 15) ctx.moment = buildMoment(G, ctx);
  }
  return ctx;
}

export function finishMatch(G, ctx) {
  const s = G.season;
  const p = G.player;
  const me = ctx.me;
  const league = getLeague(s.leagueId);
  const myG = ctx.home === me ? ctx.homeGoals : ctx.awayGoals;
  const oppG = ctx.home === me ? ctx.awayGoals : ctx.homeGoals;
  const opp = ctx.home === me ? ctx.away : ctx.home;
  let outcome = myG > oppG ? 'W' : myG < oppG ? 'L' : 'D';

  if (ctx.slotType === 'league') {
    applyResult(s.table, ctx.home, ctx.away, ctx.homeGoals, ctx.awayGoals);
    for (const [h, a, hg, ag] of ctx.others) applyResult(s.table, h, a, hg, ag);
  } else {
    if (outcome === 'D') {
      const win = chance(clamp(0.5 + (G.club.rating - clubRating(s, opp)) / 100, 0.2, 0.8));
      ctx.penalties = win ? 'Ganan en la tanda de penales' : 'Pierden en la tanda de penales';
      outcome = win ? 'W' : 'L';
    }
    if (outcome === 'W') {
      if (ctx.cupName === 'Final') {
        s.cupWon = true;
        s.cupAlive = false;
        const name = `Copa ${league.country}`;
        s.trophies.push(name);
        G.trophies.push({ name, season: s.label, club: me });
      }
    } else {
      s.cupAlive = false;
    }
  }

  let rating = null;
  if (ctx.inv.played) {
    rating = clamp(6 + ctx.pGoals + ctx.pAssists * 0.5 + (outcome === 'W' ? 0.5 : outcome === 'L' ? -0.4 : 0) + (Math.random() - 0.5), 4.5, 10);
    rating = Math.round(rating * 10) / 10;
    s.stats.apps++;
    if (ctx.inv.started) s.stats.starts++;
    s.stats.goals += ctx.pGoals;
    s.stats.assists += ctx.pAssists;
    s.stats.ratingSum += rating;
    s.stats.minutes += ctx.inv.minutes;
    G.career.apps++;
    G.career.goals += ctx.pGoals;
    G.career.assists += ctx.pAssists;
  }

  // Reputación y moral
  let rep = 0;
  if (ctx.moment?.chosen != null) rep += ctx.moment.rep || 0;
  if (ctx.important && ctx.pGoals > 0) rep += 2;
  if (rating !== null && rating >= 8.5) rep += 1;
  if (rating !== null && rating < 5.5) rep -= 1;
  p.reputation = clamp(p.reputation + rep, 0, 100);

  let morale = 0;
  if (ctx.inv.played) morale += outcome === 'W' ? 4 : outcome === 'L' ? -4 : 0;
  else morale -= 1;
  morale += ctx.pGoals * 2;
  if (ctx.moment?.chosen != null) morale += ctx.moment.morale || 0;
  p.morale = clamp(p.morale + morale, 0, 100);

  // Energía, plan semanal e lesiones
  let energy = p.energy + 8;
  if (ctx.inv.played) energy -= Math.round((ctx.inv.minutes / 90) * 16);
  if (s.plan === 'rest') energy += 14;
  if (s.plan === 'train') {
    energy -= 6;
    if (chance(0.25)) {
      const a = pick(FOCUS[s.focus].attrs);
      p.attrs[a] = Math.min(99, p.attrs[a] + 1);
      ctx.notes.push(`Entrenamiento: +1 ${ATTR_LABELS[a]}`);
    }
  }
  p.energy = clamp(energy, 10, 100);

  if (ctx.inv.reason === 'lesionado') {
    p.injury = Math.max(0, p.injury - 1);
  } else if (ctx.inv.played && chance(0.02 + (100 - p.energy) / 1500)) {
    p.injury = rand(2, 6);
    ctx.notes.push(`Te lesionaste: estarás fuera ${p.injury} partidos`);
  }

  ctx.result = { outcome, myG, oppG, opp, rating };
  s.idx++;
  return ctx;
}
