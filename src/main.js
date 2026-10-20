import './style.css';
import * as V from './ui/views.js';
import { newGame, save, load, clearSave } from './game/state.js';
import { ATTRS, START } from './game/player.js';
import { LOOKS } from './game/player.js';
import { ensureMoment } from './game/match.js';
import {
  startMatch, chooseMoment, continueFromResult, chooseEvent, continueFromEvent,
  goTransfer, pickOffer, retirePlayer,
} from './game/engine.js';

const app = document.getElementById('app');

let G = null; // estado de la partida
let ui = 'menu'; // menu | create1 | create2 | game | career
let draft = null; // borrador del jugador mientras se crea
let lastKey = '';
let shooting = null; // índice del punto elegido mientras corre la animación del disparo

const newDraft = () => ({
  name: '',
  nationality: 'Colombia',
  pos: 'ST',
  skin: LOOKS.skins[1],
  hairStyle: 'corto',
  hairColor: LOOKS.hairColors[0],
  beard: 'none',
  attrs: Object.fromEntries(ATTRS.map((a) => [a, START.base])),
  leagueId: null,
  clubName: null,
});

function render() {
  let html;
  if (ui === 'menu') html = V.menu(!!load());
  else if (ui === 'create1') html = V.create1(draft);
  else if (ui === 'create2') html = V.create2(draft);
  else if (ui === 'career') html = V.career(G);
  else if (G.screen === 'moment') html = V.moment(G, shooting);
  else html = V.screens[G.screen](G);
  app.innerHTML = html;
  const key = ui + (ui === 'game' ? G.screen + (G.eventResult ? 'r' : '') : '');
  if (key !== lastKey) window.scrollTo(0, 0);
  lastKey = key;
  if (G) save(G);
}

function shoot(idx) {
  if (!G || G.screen !== 'moment' || shooting !== null) return;
  shooting = idx;
  render();
  setTimeout(() => {
    chooseMoment(G, idx);
    shooting = null;
    render();
  }, 1900);
}

function act(action, d) {
  switch (action) {
    case 'new': clearSave(); G = null; draft = newDraft(); ui = 'create1'; break;
    case 'newCareer': clearSave(); G = null; draft = newDraft(); ui = 'create1'; break;
    case 'continue': G = load(); if (G) ensureMoment(G); ui = G ? 'game' : 'menu'; break;
    case 'toMenu': ui = 'menu'; break;
    case 'skin': draft.skin = d.value; break;
    case 'hairColor': draft.hairColor = d.value; break;
    case 'attr': draft.attrs[d.attr] += Number(d.d); break;
    case 'next1': ui = 'create2'; break;
    case 'back1': ui = 'create1'; break;
    case 'league': draft.leagueId = d.id; draft.clubName = null; break;
    case 'club': draft.clubName = d.name; break;
    case 'start':
      G = newGame({
        name: draft.name, nationality: draft.nationality, pos: draft.pos,
        look: { skin: draft.skin, hairStyle: draft.hairStyle, hairColor: draft.hairColor, beard: draft.beard },
        attrs: draft.attrs, leagueId: draft.leagueId, clubName: draft.clubName,
      });
      ui = 'game';
      break;
    case 'play': startMatch(G); break;
    case 'plan': G.season.plan = d.value; break;
    case 'focus': G.season.focus = d.value; break;
    case 'shoot': shoot(Number(d.idx)); return;
    case 'next': continueFromResult(G); break;
    case 'eventPick': chooseEvent(G, Number(d.idx)); break;
    case 'eventNext': continueFromEvent(G); break;
    case 'toTransfer': goTransfer(G); break;
    case 'offer': pickOffer(G, Number(d.idx)); break;
    case 'retire': retirePlayer(G); break;
    case 'career': ui = 'career'; break;
    case 'backGame': ui = 'game'; break;
    default: return;
  }
  render();
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  act(el.dataset.action, el.dataset);
});

app.addEventListener('input', (e) => {
  const f = e.target.dataset.field;
  if (!f || !draft) return;
  draft[f] = e.target.value;
  if (f !== 'name') render(); // el nombre no re-renderiza para no perder el foco
});

render();
