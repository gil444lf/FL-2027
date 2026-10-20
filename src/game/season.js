import { getLeague } from '../data/leagues.js';
import { pick, chance } from './rng.js';

// Calendario round-robin (método del círculo). Devuelve rondas con pares [idxLocal, idxVisita].
export function roundRobin(n) {
  const teams = [...Array(n).keys()];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i];
      const b = teams[n - 1 - i];
      pairs.push(r % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    teams.splice(1, 0, teams.pop());
  }
  return rounds;
}

const CUP_AFTER_ROUND = { 2: 'Cuartos de final', 6: 'Semifinal', 10: 'Final' };

export function buildSeason(G, year) {
  const league = getLeague(G.club.leagueId);
  const clubs = league.clubs.map((c) => c.name);
  const first = roundRobin(clubs.length).map((r) => r.map(([a, b]) => [clubs[a], clubs[b]]));
  const second = first.map((r) => r.map(([a, b]) => [b, a]));
  const rounds = [...first, ...second];
  const table = Object.fromEntries(clubs.map((n) => [n, { P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }]));
  const ratings = Object.fromEntries(league.clubs.map((c) => [c.name, c.rating]));
  const calendar = [];
  rounds.forEach((_, m) => {
    calendar.push({ type: 'league', round: m });
    if (CUP_AFTER_ROUND[m]) calendar.push({ type: 'cup', name: CUP_AFTER_ROUND[m] });
  });
  return {
    year,
    label: `${year}/${String(year + 1).slice(2)}`,
    leagueId: league.id,
    clubs,
    ratings,
    rounds,
    table,
    calendar,
    idx: 0,
    cupAlive: true,
    cupWon: false,
    usedEvents: [],
    focus: G.season?.focus || 'attack',
    plan: 'normal',
    stats: { apps: 0, starts: 0, goals: 0, assists: 0, ratingSum: 0, minutes: 0 },
    trophies: [],
  };
}

export const clubRating = (s, name) => s.ratings[name];

export function applyResult(table, h, a, hg, ag) {
  const H = table[h];
  const A = table[a];
  H.P++; A.P++;
  H.GF += hg; H.GA += ag;
  A.GF += ag; A.GA += hg;
  if (hg > ag) { H.W++; A.L++; H.Pts += 3; }
  else if (hg < ag) { A.W++; H.L++; A.Pts += 3; }
  else { H.D++; A.D++; H.Pts++; A.Pts++; }
}

export function standings(s) {
  return Object.entries(s.table)
    .map(([name, t]) => ({ name, ...t, GD: t.GF - t.GA }))
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.name.localeCompare(b.name));
}

// Siguiente partido pendiente (salta los de copa si ya fuiste eliminado).
export function nextSlot(s) {
  while (s.idx < s.calendar.length) {
    const sl = s.calendar[s.idx];
    if (sl.type === 'cup' && !s.cupAlive) {
      s.idx++;
      continue;
    }
    return sl;
  }
  return null;
}

export const isSeasonOver = (G) => nextSlot(G.season) === null;

export function describeNext(G) {
  const s = G.season;
  const slot = nextSlot(s);
  if (!slot) return null;
  const me = G.club.name;
  const league = getLeague(s.leagueId);
  const tags = [];
  let home;
  let away;
  let label;
  if (slot.type === 'league') {
    [home, away] = s.rounds[slot.round].find(([h, a]) => h === me || a === me);
    label = `${league.name} · Jornada ${slot.round + 1} de ${s.rounds.length}`;
    if (slot.round === s.rounds.length - 1) tags.push('Última jornada');
  } else {
    if (!slot.opp) {
      slot.opp = pick(s.clubs.filter((n) => n !== me));
      slot.homeMe = chance(0.5);
    }
    home = slot.homeMe ? me : slot.opp;
    away = slot.homeMe ? slot.opp : me;
    label = `Copa ${league.country} · ${slot.name}`;
    if (slot.name !== 'Cuartos de final') tags.push(`${slot.name} de Copa`);
  }
  const opp = home === me ? away : home;
  if (G.club.rival === opp) tags.push('Clásico');
  return { label, home, away, opp, tags };
}
