// Motor del juego: une todas las piezas. La UI solo llama a estas funciones.
import { prepareMatch, finishMatch, resolveMoment } from './match.js';
import { maybeEvent, resolveEventOption } from './events.js';
import { endSeason, generateOffers, acceptOffer, legacy } from './offseason.js';
import { isSeasonOver } from './season.js';

function afterFinish(G) {
  if (!isSeasonOver(G)) maybeEvent(G);
}

function closeSeason(G) {
  endSeason(G);
  G.screen = 'seasonEnd';
}

export function startMatch(G) {
  const ctx = prepareMatch(G);
  if (!ctx) return;
  G.pending = ctx;
  if (ctx.moment) {
    G.screen = 'moment';
  } else {
    finishMatch(G, ctx);
    afterFinish(G);
    G.screen = 'result';
  }
}

export function chooseMoment(G, idx) {
  const ctx = G.pending;
  if (!ctx || ctx.result) return;
  resolveMoment(G, ctx, idx);
  finishMatch(G, ctx);
  afterFinish(G);
  G.screen = 'result';
}

export function continueFromResult(G) {
  G.pending = null;
  if (G.pendingEvent) {
    G.screen = 'event';
    return;
  }
  if (isSeasonOver(G)) closeSeason(G);
  else G.screen = 'hub';
}

export function chooseEvent(G, idx) {
  if (G.eventResult) return;
  G.eventResult = resolveEventOption(G, G.pendingEvent, idx);
}

export function continueFromEvent(G) {
  G.pendingEvent = null;
  G.eventResult = null;
  if (isSeasonOver(G)) closeSeason(G);
  else G.screen = 'hub';
}

export function retirePlayer(G) {
  G.legacy = legacy(G);
  G.screen = 'end';
}

export function goTransfer(G) {
  if (G.lastSummary?.retireForced) {
    retirePlayer(G);
    return;
  }
  G.offers = generateOffers(G);
  G.screen = 'transfer';
}

export function pickOffer(G, idx) {
  acceptOffer(G, idx);
  G.screen = 'hub';
}
