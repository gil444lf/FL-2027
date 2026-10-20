import { allClubs, getLeague } from '../data/leagues.js';
import { overall, roleFor, salary, developPlayer } from './player.js';
import { standings, buildSeason } from './season.js';
import { rand, clamp, weightedPick } from './rng.js';

// Cierra la temporada: posición final, trofeos, reputación, desarrollo y envejecimiento.
export function endSeason(G) {
  const s = G.season;
  const p = G.player;
  const league = getLeague(s.leagueId);
  const table = standings(s);
  const position = table.findIndex((t) => t.name === G.club.name) + 1;
  const me = table[position - 1];
  if (position === 1) {
    s.trophies.push(league.name);
    G.trophies.push({ name: league.name, season: s.label, club: G.club.name });
  }
  const avg = s.stats.apps ? s.stats.ratingSum / s.stats.apps : 0;
  const ovrBefore = overall(p);
  const rep =
    (position === 1 ? 4 : position <= 3 ? 2 : 0) +
    (s.stats.goals >= 15 ? 3 : s.stats.goals >= 8 ? 1 : 0) +
    (avg >= 7.2 ? 2 : 0) +
    (s.cupWon ? 2 : 0) +
    (ovrBefore >= 75 ? 1 : 0) -
    (s.stats.apps < 4 ? 1 : 0);
  p.reputation = clamp(p.reputation + rep, 0, 100);

  const deltas = developPlayer(p, G.contract.role, s.focus);
  p.age++;
  G.contract.years--;
  const ovrAfter = overall(p);
  G.peakOvr = Math.max(G.peakOvr, ovrAfter);
  G.career.seasons++;
  p.energy = 100;
  p.injury = 0;

  G.history.push({
    season: s.label, club: G.club.name, league: league.name, position,
    apps: s.stats.apps, goals: s.stats.goals, assists: s.stats.assists,
    avg: Math.round(avg * 10) / 10, ovr: ovrAfter, age: p.age, trophies: [...s.trophies],
  });

  const summary = {
    label: s.label, position, pts: me.Pts, stats: { ...s.stats }, avg: Math.round(avg * 10) / 10,
    trophies: [...s.trophies], deltas, ovrBefore, ovrAfter, age: p.age,
    retireForced: p.age >= 38,
  };
  G.lastSummary = summary;
  return summary;
}

function makeOffer(G, club, kind) {
  const p = G.player;
  const ovr = overall(p);
  const base = salary(ovr, club.rating);
  let wage = base;
  let years;
  if (kind === 'stay') {
    wage = G.contract.wage;
    years = G.contract.years;
  } else if (kind === 'renew') {
    wage = Math.round(base * 1.05);
    years = rand(2, 4);
  } else {
    wage = Math.round(base * (0.9 + Math.random() * 0.25));
    years = rand(2, 5);
  }
  return {
    kind, club: club.name, leagueId: club.leagueId, leagueName: club.leagueName, flag: club.flag,
    rating: club.rating, rival: club.rival || null, wage, years, role: roleFor(ovr, club.rating),
  };
}

export function generateOffers(G) {
  const p = G.player;
  const ovr = overall(p);
  const level = ovr + p.reputation * 0.1 + (p.age < 22 ? (p.potential - ovr) * 0.25 : 0);
  const clubs = allClubs();
  const current = clubs.find((c) => c.name === G.club.name);
  const offers = [makeOffer(G, current, G.contract.years > 0 ? 'stay' : 'renew')];

  const pool = clubs.filter((c) => c.name !== G.club.name);
  const top = level + 4 + p.reputation / 15;
  const low = level - 16;
  let cands = [];
  for (let widen = 0; widen < 5; widen++) {
    cands = pool.filter((c) => c.rating <= top + widen * 4 && c.rating >= low - widen * 4);
    if (cands.length >= 4) break;
  }
  const want = Math.min(4, cands.length);
  while (offers.length - 1 < want) {
    const i = weightedPick(cands, (c) => 1 / (1 + Math.abs(c.rating - (level - 2)) / 4));
    offers.push(makeOffer(G, cands[i], 'new'));
    cands.splice(i, 1);
  }
  return offers;
}

export function acceptOffer(G, idx) {
  const o = G.offers[idx];
  const p = G.player;
  const prevRating = G.club.rating;
  if (o.kind === 'stay') {
    G.contract.role = roleFor(overall(p), G.club.rating);
  } else {
    G.club = { name: o.club, leagueId: o.leagueId, rating: o.rating, rival: o.rival };
    G.contract = { wage: o.wage, years: o.years, role: o.role };
    if (o.kind === 'new') {
      p.morale = clamp(p.morale + 8, 0, 100);
      if (o.rating > prevRating) p.reputation = clamp(p.reputation + 2, 0, 100);
    } else {
      p.morale = clamp(p.morale + 3, 0, 100);
    }
  }
  G.season = buildSeason(G, G.season.year + 1);
  G.offers = null;
  G.lastSummary = null;
}

export function legacy(G) {
  const t = G.trophies.length;
  const score = Math.round(G.peakOvr * 1.2 + t * 4 + G.career.goals / 8 + G.career.assists / 20 + G.player.reputation * 0.5);
  const tier =
    score >= 235 ? 'Leyenda del fútbol'
    : score >= 205 ? 'Estrella mundial'
    : score >= 170 ? 'Jugador de élite'
    : score >= 135 ? 'Profesional sólido'
    : 'Carrera discreta';
  return { score, tier };
}
