import { ATTRS, ATTR_LABELS, ROLES, overall } from './player.js';
import { chance, pick, clamp } from './rng.js';

const sign = (n) => (n > 0 ? `+${n}` : `${n}`);

export function applyEffects(G, eff = {}) {
  const p = G.player;
  const out = [];
  if (eff.morale) { p.morale = clamp(p.morale + eff.morale, 0, 100); out.push(`Moral ${sign(eff.morale)}`); }
  if (eff.reputation) { p.reputation = clamp(p.reputation + eff.reputation, 0, 100); out.push(`Reputación ${sign(eff.reputation)}`); }
  if (eff.energy) { p.energy = clamp(p.energy + eff.energy, 10, 100); out.push(`Energía ${sign(eff.energy)}`); }
  if (eff.injury) { p.injury = eff.injury; out.push(`Fuera ${eff.injury} partidos`); }
  if (eff.attrRandom) {
    const a = pick(ATTRS);
    p.attrs[a] = Math.min(99, p.attrs[a] + eff.attrRandom);
    out.push(`${ATTR_LABELS[a]} ${sign(eff.attrRandom)}`);
  }
  if (eff.wagePct) {
    G.contract.wage = Math.round(G.contract.wage * (1 + eff.wagePct / 100));
    out.push(`Salario ${sign(eff.wagePct)}%`);
  }
  if (eff.roleBoost) {
    G.contract.role = ROLES[Math.min(ROLES.length - 1, ROLES.indexOf(G.contract.role) + 1)];
    out.push(`Nuevo rol: ${G.contract.role}`);
  }
  return out;
}

// Cada opción puede tener `effects` fijos o `random` (lista de {p, effects, result}).
export const EVENTS = [
  {
    id: 'prensa',
    title: 'Conferencia de prensa',
    text: 'Los periodistas te rodean después del entrenamiento y quieren una declaración sobre tu momento en el club.',
    when: () => true,
    options: [
      { label: 'Elogiar al equipo y al técnico', effects: { morale: 3, reputation: 1 }, result: 'Quedaste como un jugador humilde y el vestuario lo agradece.' },
      { label: 'Ser frontal y polémico', random: [
        { p: 0.5, effects: { reputation: 4, morale: 2 }, result: 'Tus declaraciones se hicieron virales. Hay quienes te aman y quienes te odian, pero todos hablan de ti.' },
        { p: 0.5, effects: { reputation: -3, morale: -4 }, result: 'La frase se sacó de contexto y el club te llamó la atención.' },
      ] },
      { label: 'Decir que prefieres hablar en la cancha', effects: { morale: 1 }, result: 'Respuesta corta y segura. Nada de polémicas.' },
    ],
  },
  {
    id: 'agente',
    title: 'Llamada de tu agente',
    text: 'Tu agente te cuenta que un club más grande preguntó por ti. Puedes aprovecharlo, pero hay riesgos.',
    when: (G) => overall(G.player) >= 62 && G.player.reputation >= 10,
    options: [
      { label: 'Filtrarlo a la prensa', random: [
        { p: 0.6, effects: { reputation: 3, morale: 3, wagePct: 10 }, result: 'Tu club subió tu valor para retenerte. Te mejoraron el salario.' },
        { p: 0.4, effects: { reputation: -2, morale: -5 }, result: 'El vestuario se molestó con la filtración y te sientes aislado.' },
      ] },
      { label: 'Ignorarlo y concentrarte', effects: { morale: 1, attrRandom: 1 }, result: 'Te enfocaste en entrenar y se nota la mejora.' },
      { label: 'Pedir un aumento a tu club', random: [
        { p: 0.45, effects: { wagePct: 15, morale: 3 }, result: 'El club aceptó y mejoró tu contrato.' },
        { p: 0.55, effects: { morale: -3 }, result: 'El club dijo que debes ganártelo en la cancha primero.' },
      ] },
    ],
  },
  {
    id: 'fiesta',
    title: 'Invitación a una fiesta',
    text: 'Un amigo te invita a una fiesta de cumpleaños esta noche. Mañana hay entrenamiento fuerte.',
    when: () => true,
    options: [
      { label: 'Ir y pasarla bien', random: [
        { p: 0.5, effects: { morale: 6, energy: -15 }, result: 'Te divertiste muchísimo, pero amaneciste sin pilas.' },
        { p: 0.5, effects: { morale: 2, energy: -12, reputation: -4 }, result: 'Alguien subió una foto tuya en redes y la prensa lo comentó. Mala imagen.' },
      ] },
      { label: 'Quedarte descansando', effects: { energy: 10, morale: -1 }, result: 'Noche tranquila. Recuperaste energías.' },
      { label: 'Ir un rato y salir temprano', effects: { morale: 3, energy: -3 }, result: 'Equilibrio perfecto: te divertiste sin pasarte.' },
    ],
  },
  {
    id: 'veterano',
    title: 'El capitán te ofrece consejos',
    text: 'Un jugador veterano del plantel te ve con potencial y te ofrece entrenar juntos después de la práctica.',
    when: (G) => G.player.age <= 23,
    options: [
      { label: 'Escucharlo y entrenar extra', effects: { attrRandom: 1, energy: -5, morale: 2 }, result: 'Aprendiste detalles que no se enseñan en ningún lado.' },
      { label: 'Agradecer, pero ir a tu ritmo', effects: { morale: 1 }, result: 'Prefieres hacerlo a tu manera. Todo bien.' },
    ],
  },
  {
    id: 'molestia',
    title: 'Molestia muscular',
    text: 'Sientes un tirón en el muslo. El médico recomienda parar, pero hay partidos importantes.',
    when: (G) => G.player.energy < 65,
    options: [
      { label: 'Descansar unos partidos', effects: { injury: 2, energy: 25 }, result: 'Parar a tiempo evitó algo peor. Volverás recuperado.' },
      { label: 'Jugar con infiltración', random: [
        { p: 0.5, effects: { energy: -5, morale: 2 }, result: 'Aguantaste. El dolor desapareció por ahora.' },
        { p: 0.5, effects: { injury: 5, energy: -10, morale: -4 }, result: 'Se agravó. Ahora estarás varios partidos fuera.' },
      ] },
    ],
  },
  {
    id: 'seleccion',
    title: 'Convocatoria a la selección',
    text: 'El técnico de la selección nacional te convocó para la próxima fecha FIFA.',
    when: (G) => overall(G.player) >= 68 && G.player.reputation >= 20,
    options: [
      { label: 'Aceptar con orgullo', effects: { reputation: 5, morale: 8, energy: -10 }, result: 'Vestir los colores de tu país es un sueño cumplido.' },
      { label: 'Pedir descanso por carga de partidos', effects: { reputation: -1, energy: 10 }, result: 'Te dieron el descanso, aunque algunos hinchas no quedaron felices.' },
    ],
  },
  {
    id: 'patrocinio',
    title: 'Oferta de patrocinio',
    text: 'Una marca de botines te ofrece ser su imagen. Implica sesiones de fotos y compromisos.',
    when: (G) => G.player.reputation >= 25,
    options: [
      { label: 'Aceptar el contrato', effects: { morale: 2, reputation: 2, wagePct: 5 }, result: 'Tu cara aparece en vallas y comerciales. Más ingresos y más fama.' },
      { label: 'Rechazar y enfocarte en jugar', effects: { morale: 1, attrRandom: 1 }, result: 'Más tiempo para entrenar. Se notó en tu juego.' },
    ],
  },
  {
    id: 'tecnico',
    title: 'Charla con el entrenador',
    text: 'El técnico te llama a su oficina para hablar sobre tu rol en el equipo.',
    when: (G) => ['Cantera', 'Suplente'].includes(G.contract.role),
    options: [
      { label: 'Pedirle más minutos', random: [
        { p: 0.4, effects: { morale: 4, roleBoost: true }, result: 'Le gustó tu actitud. Te dará más oportunidades.' },
        { p: 0.6, effects: { morale: -3 }, result: 'Te dijo que debes ganártelo entrenando.' },
      ] },
      { label: 'Trabajar en silencio', effects: { attrRandom: 1, energy: -5 }, result: 'Tu esfuerzo no pasó desapercibido en los entrenamientos.' },
    ],
  },
];

export function maybeEvent(G) {
  if (!chance(0.3)) return;
  const s = G.season;
  const pool = EVENTS.filter((e) => !s.usedEvents.includes(e.id) && e.when(G));
  if (!pool.length) return;
  const ev = pick(pool);
  s.usedEvents.push(ev.id);
  G.pendingEvent = ev.id;
}

export function resolveEventOption(G, eventId, idx) {
  const ev = EVENTS.find((e) => e.id === eventId);
  const opt = ev.options[idx];
  let res = opt;
  if (opt.random) {
    let r = Math.random();
    res = opt.random[opt.random.length - 1];
    for (const o of opt.random) {
      r -= o.p;
      if (r < 0) { res = o; break; }
    }
  }
  const list = applyEffects(G, res.effects);
  return { text: res.result, list };
}
