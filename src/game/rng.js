// Utilidades de azar. Todo el juego usa estas funciones.
export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function poisson(mean) {
  const L = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Devuelve el índice elegido según el peso de cada elemento.
export function weightedPick(items, weightFn) {
  const w = items.map(weightFn);
  const total = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return items.length - 1;
}
