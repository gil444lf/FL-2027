// Simula carreras completas sin interfaz para revisar que el motor no falle y que el balance sea razonable.
// Uso: npm run simular
import { newGame } from '../src/game/state.js';
import { overall } from '../src/game/player.js';
import { startMatch, chooseMoment, continueFromResult, chooseEvent, continueFromEvent, goTransfer, pickOffer, retirePlayer } from '../src/game/engine.js';
import { EVENTS } from '../src/game/events.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

function playCareer(verbose = false) {
  const G = newGame({
    name: 'Prueba', nationality: 'Colombia', pos: 'ST',
    look: { skin: '#e8b98a', hairStyle: 'corto', hairColor: '#1b1b1b' },
    attrs: { pace: 55, shooting: 60, passing: 45, dribbling: 55, defending: 45, physical: 55 },
    leagueId: 'col', clubName: 'Once Caldas',
  });
  let guard = 0;
  while (G.screen !== 'end' && guard++ < 20000) {
    switch (G.screen) {
      case 'hub': startMatch(G); break;
      case 'moment': chooseMoment(G, Math.floor(Math.random() * 12)); break;
      case 'result': continueFromResult(G); break;
      case 'event': {
        const ev = EVENTS.find((e) => e.id === G.pendingEvent);
        if (!G.eventResult) chooseEvent(G, Math.floor(Math.random() * ev.options.length));
        else continueFromEvent(G);
        break;
      }
      case 'seasonEnd': goTransfer(G); break;
      case 'transfer':
        if (G.player.age >= 34 && Math.random() < 0.5) retirePlayer(G);
        else pickOffer(G, Math.floor(Math.random() * G.offers.length));
        break;
      default: throw new Error('Pantalla desconocida: ' + G.screen);
    }
  }
  if (G.screen !== 'end') throw new Error('La carrera no terminó');
  if (verbose) {
    for (const h of G.history) console.log(`${h.season} ${h.club.padEnd(22)} edad ${h.age} OVR ${h.ovr} | ${h.apps} PJ ${h.goals}G ${h.assists}A nota ${h.avg} | pos ${h.position}`);
  }
  return G;
}

console.log('--- Una carrera de ejemplo ---');
const one = playCareer(true);
console.log(`Legado: ${one.legacy.tier} (${one.legacy.score}) · trofeos: ${one.trophies.length}\n`);

const N = 200;
let peak = 0, goals = 0, seasons = 0, trophies = 0;
const tiers = {};
for (let i = 0; i < N; i++) {
  const G = playCareer();
  peak += G.peakOvr; goals += G.career.goals; seasons += G.career.seasons; trophies += G.trophies.length;
  tiers[G.legacy.tier] = (tiers[G.legacy.tier] || 0) + 1;
}
console.log(`--- ${N} carreras aleatorias ---`);
console.log(`OVR pico promedio: ${(peak / N).toFixed(1)}`);
console.log(`Temporadas promedio: ${(seasons / N).toFixed(1)}`);
console.log(`Goles promedio por carrera: ${(goals / N).toFixed(0)}`);
console.log(`Trofeos promedio: ${(trophies / N).toFixed(1)}`);
console.log('Legados:', tiers);
