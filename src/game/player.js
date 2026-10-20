import { rand, clamp } from './rng.js';

export const ATTRS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
export const ATTR_LABELS = {
  pace: 'Ritmo', shooting: 'Tiro', passing: 'Pase', dribbling: 'Regate', defending: 'Defensa', physical: 'Físico',
};

// goalShare / assistShare: qué parte de los goles del equipo suele producir esa posición.
export const POSITIONS = {
  ST: { label: 'Delantero', short: 'DEL', w: { pace: 0.2, shooting: 0.35, passing: 0.05, dribbling: 0.2, defending: 0, physical: 0.2 }, goalShare: 0.38, assistShare: 0.1 },
  W: { label: 'Extremo', short: 'EXT', w: { pace: 0.3, shooting: 0.2, passing: 0.15, dribbling: 0.3, defending: 0, physical: 0.05 }, goalShare: 0.22, assistShare: 0.2 },
  CM: { label: 'Mediocampista', short: 'MED', w: { pace: 0.1, shooting: 0.1, passing: 0.35, dribbling: 0.2, defending: 0.15, physical: 0.1 }, goalShare: 0.12, assistShare: 0.25 },
  CB: { label: 'Defensa', short: 'DEF', w: { pace: 0.1, shooting: 0, passing: 0.1, dribbling: 0, defending: 0.45, physical: 0.35 }, goalShare: 0.04, assistShare: 0.03 },
};

export const ROLES = ['Cantera', 'Suplente', 'Rotación', 'Titular'];

export const FOCUS = {
  attack: { label: 'Ataque', attrs: ['shooting', 'dribbling'] },
  technique: { label: 'Técnica', attrs: ['passing', 'dribbling'] },
  physical: { label: 'Físico', attrs: ['pace', 'physical'] },
  defense: { label: 'Defensa', attrs: ['defending', 'physical'] },
};

// Puntos para repartir al crear el jugador.
export const START = { pool: 30, base: 45, max: 70 };

export const NATIONALITIES = [
  'Colombia', 'Argentina', 'Brasil', 'España', 'Inglaterra', 'Francia', 'Alemania', 'Italia',
  'Portugal', 'México', 'Estados Unidos', 'Uruguay', 'Chile', 'Ecuador', 'Países Bajos', 'Otro',
];

export const LOOKS = {
  skins: ['#f6d3b3', '#e8b98a', '#d39a6a', '#c68642', '#8d5524', '#5c3a1e'],
  hairColors: ['#1b1b1b', '#4a2c12', '#b5651d', '#e8c872', '#c0392b'],
  hairStyles: [
    { id: 'corto', label: 'Corto' },
    { id: 'rizado', label: 'Rizado' },
    { id: 'largo', label: 'Largo' },
    { id: 'cresta', label: 'Cresta' },
    { id: 'afro', label: 'Afro' },
    { id: 'calvo', label: 'Rapado' },
  ],
  beards: [
    { id: 'none', label: 'Sin barba' },
    { id: 'goatee', label: 'Candado' },
    { id: 'full', label: 'Barba completa' },
  ],
};

export function overall(p) {
  const w = POSITIONS[p.pos].w;
  let s = 0;
  let t = 0;
  for (const a of ATTRS) {
    s += p.attrs[a] * w[a];
    t += w[a];
  }
  return Math.round(s / t);
}

// Rol esperado según qué tan bueno eres comparado con el club.
export function roleFor(ovr, clubRating) {
  const d = ovr - clubRating;
  if (d >= -4) return 'Titular';
  if (d >= -12) return 'Rotación';
  if (d >= -20) return 'Suplente';
  return 'Cantera';
}

// Salario anual en miles de euros.
export function salary(ovr, clubRating) {
  return Math.max(15, Math.round(30 * Math.pow(1.17, ovr - 50) * (0.6 + clubRating / 150)));
}

// Valor de mercado en millones de euros.
export function marketValue(p) {
  const o = overall(p);
  const youth = p.age < 24 ? 1 : p.age < 29 ? 0.3 : 0;
  const agePen = p.age >= 31 ? Math.max(0.25, 1 - (p.age - 30) * 0.18) : 1;
  const v = 0.4 * Math.pow(1.17, o - 50) * (1 + (Math.max(0, p.potential - o) / 60) * youth * 2) * agePen;
  return Math.max(0.05, Math.round(v * 10) / 10);
}

export function createPlayer({ name, nationality, pos, look, attrs }) {
  return {
    name: (name || '').trim() || 'Jugador',
    nationality,
    pos,
    look: { ...look },
    attrs: { ...attrs },
    age: 17,
    potential: rand(74, 92), // oculto para el jugador
    energy: 100,
    morale: 70,
    reputation: 5,
    injury: 0,
  };
}

const PLAYING_TIME = { Titular: 1.2, Rotación: 1, Suplente: 0.8, Cantera: 0.6 };

// Desarrollo de fin de temporada. Devuelve los cambios por atributo.
export function developPlayer(p, role, focusKey) {
  const ovr = overall(p);
  const gap = clamp((p.potential - ovr) / 15, 0.3, 1.5);
  const pt = PLAYING_TIME[role] ?? 1;
  const focus = FOCUS[focusKey]?.attrs ?? [];
  const deltas = {};
  for (const a of ATTRS) {
    let d;
    if (p.age <= 21) d = Math.round(rand(1, 4) * gap * pt);
    else if (p.age <= 26) d = Math.round(rand(0, 2) * gap * pt);
    else if (p.age <= 30) d = rand(-1, 1);
    else d = a === 'pace' || a === 'physical' ? -rand(1, 3) : -rand(0, 1);
    if (focus.includes(a) && p.age <= 26) d += 1;
    // Nadie crece mucho más allá de su potencial.
    if (d > 0 && p.attrs[a] >= p.potential + 3) d = 0;
    const next = clamp(p.attrs[a] + d, 30, 99);
    deltas[a] = next - p.attrs[a];
    p.attrs[a] = next;
  }
  return deltas;
}
