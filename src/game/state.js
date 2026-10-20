import { getLeague } from '../data/leagues.js';
import { createPlayer, overall, roleFor, salary } from './player.js';
import { buildSeason } from './season.js';

const KEY = 'carrera-pro-save-v1';
export const START_YEAR = 2026;

export function save(G) {
  try { localStorage.setItem(KEY, JSON.stringify(G)); } catch { /* sin almacenamiento */ }
}
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
}

// setup: { name, nationality, pos, look, attrs, leagueId, clubName }
export function newGame(setup) {
  const league = getLeague(setup.leagueId);
  const club = league.clubs.find((c) => c.name === setup.clubName);
  const player = createPlayer(setup);
  const ovr = overall(player);
  const G = {
    version: 1,
    screen: 'hub',
    player,
    club: { name: club.name, leagueId: league.id, rating: club.rating, rival: club.rival || null },
    contract: { wage: Math.round(salary(ovr, club.rating) * 0.5), years: 3, role: roleFor(ovr, club.rating) },
    season: null,
    career: { apps: 0, goals: 0, assists: 0, seasons: 0 },
    history: [],
    trophies: [],
    pending: null,
    pendingEvent: null,
    eventResult: null,
    lastSummary: null,
    offers: null,
    legacy: null,
    peakOvr: ovr,
  };
  G.season = buildSeason(G, START_YEAR);
  return G;
}
