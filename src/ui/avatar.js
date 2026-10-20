// Avatares SVG: cabeza detallada + uniforme del club.
// Modos: 'bust' (busto, para el hub) y 'full' (cuerpo completo, para crear el jugador y el retiro).
import { kitFor } from '../data/kits.js';

let uid = 0;

// ---------- Utilidades de color ----------
const c255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => c255(v).toString(16).padStart(2, '0')).join('');
// amt: -1 (negro) .. 0 (igual) .. 1 (blanco)
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Camiseta local real del club (src/data/kits.js). Si el club no está, se inventa una estable.
export function kitColors(name) {
  const real = kitFor(name);
  if (real) return real;
  let h = 0;
  for (const ch of name || 'x') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const secs = ['#ffffff', '#f5c542', '#101010'];
  const patterns = ['solid', 'stripes', 'hoops', 'sash', 'stripes'];
  return {
    primary: hslToHex(h % 360, 62, 40),
    secondary: secs[(h >>> 3) % secs.length],
    pattern: patterns[(h >>> 5) % patterns.length],
    shorts: null,
  };
}

function pattern(kind, sec, x0, y0, x1, y1) {
  const w = x1 - x0;
  const h = y1 - y0;
  let s = '';
  if (kind === 'stripes') {
    for (let x = x0 + 7; x < x1; x += 18) s += `<rect x="${x}" y="${y0}" width="9" height="${h}" fill="${sec}" opacity=".9"/>`;
  } else if (kind === 'hoops') {
    for (let y = y0 + 8; y < y1; y += 18) s += `<rect x="${x0}" y="${y}" width="${w}" height="9" fill="${sec}" opacity=".9"/>`;
  } else if (kind === 'band') {
    s = `<rect x="${x0}" y="${y0 + Math.round(h * 0.24)}" width="${w}" height="15" fill="${sec}" opacity=".95"/>`;
  } else if (kind === 'sash') {
    s = `<polygon points="${x0},${y0 + 4} ${x0 + 26},${y0 + 4} ${x1},${y1 - 4} ${x1 - 26},${y1 - 4}" fill="${sec}" opacity=".92"/>`;
  }
  return s;
}

// ---------- Cabeza ----------
// Coordenadas: centro de la cara en (60, 52). Devuelve capas para dibujar en orden.
function head(look, id) {
  const skin = look.skin || '#e8b98a';
  const hair = look.hairColor || '#1b1b1b';
  const style = look.hairStyle || 'corto';
  const beard = look.beard || 'none';
  const skinD = shade(skin, -0.18);
  const skinDD = shade(skin, -0.35);
  const skinL = shade(skin, 0.18);
  const hairD = shade(hair, -0.2);
  const hairL = shade(hair, 0.3);
  const brow = style === 'calvo' ? skinDD : hairD;
  const lip = beard === 'none' ? '#a04c4c' : '#c47070';

  let back = '';
  let front = '';
  switch (style) {
    case 'largo':
      back = `<path d="M32 50 C28 16 92 16 88 50 L95 104 Q60 114 25 104 Z" fill="${hairD}"/>`;
      front = `<path d="M36 52 C33 28 46 19 60 19 C74 19 87 28 84 52 C80 44 74 36 62 33 C52 34 42 40 36 52Z" fill="${hair}"/>
        <path d="M43 27 Q60 18 77 27" stroke="${hairL}" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>`;
      break;
    case 'rizado':
      front = [[41, 37, 9], [49, 29, 9], [60, 25, 9], [71, 29, 9], [79, 37, 9], [37, 46, 6], [83, 46, 6], [54, 33, 9], [66, 33, 9]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}"/>`).join('')
        + [[46, 27], [62, 23], [76, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${hairL}" opacity=".35"/>`).join('');
      break;
    case 'cresta':
      front = `<path d="M37.5 48 C37.5 33 43 26 50 24 L48 50 Q42 52 37.5 48Z" fill="${skinDD}" opacity=".3"/>
        <path d="M82.5 48 C82.5 33 77 26 70 24 L72 50 Q78 52 82.5 48Z" fill="${skinDD}" opacity=".3"/>
        <path d="M51 32 L50 14 L55 22 L58 8 L62 8 L65 22 L70 14 L69 32 Q60 27 51 32Z" fill="${hair}"/>
        <path d="M56 12 L58 24" stroke="${hairL}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`;
      break;
    case 'afro':
      back = `<circle cx="60" cy="40" r="35" fill="${hair}"/><circle cx="46" cy="28" r="11" fill="${hairL}" opacity=".18"/><circle cx="75" cy="30" r="8" fill="${hairL}" opacity=".12"/>`;
      front = `<path d="M38 46 C40 33 80 33 82 46 C78 40 68 37 60 37 C52 37 42 40 38 46Z" fill="${hair}"/>`;
      break;
    case 'calvo':
      front = `<ellipse cx="52" cy="29" rx="9" ry="4" fill="#fff" opacity=".22" transform="rotate(-20 52 29)"/>`;
      break;
    case 'corto':
    default:
      front = `<path d="M36 52 C33 28 46 19 60 19 C74 19 87 28 84 52 C82 42 78 36 70 33 C62 36 50 36 44 33 C40 37 37 44 36 52Z" fill="${hair}"/>
        <path d="M42 27 Q60 18 78 27" stroke="${hairL}" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }

  const beardSvg = beard === 'goatee'
    ? `<path d="M52 72 Q60 86 68 72 Q64 77 60 77 Q56 77 52 72Z" fill="${hairD}"/>
       <path d="M51 64.5 Q60 60.5 69 64.5 Q64 67 60 66 Q56 67 51 64.5Z" fill="${hairD}"/>`
    : beard === 'full'
      ? `<path d="M37.5 54 C37 76 46 84 60 84 C74 84 83 76 82.5 54 C80 68 72 72 60 72 C48 72 40 68 37.5 54Z" fill="${hairD}"/>
         <path d="M50 65 Q60 60.5 70 65 Q65 68 60 67 Q55 68 50 65Z" fill="${hairD}"/>`
      : '';

  const eye = (cx) => `<ellipse cx="${cx}" cy="48" rx="4.8" ry="3.4" fill="#fff"/>
    <circle cx="${cx}" cy="48" r="2.7" fill="#3a2a20"/><circle cx="${cx}" cy="48" r="1.3" fill="#0a0a0a"/>
    <circle cx="${cx + 1}" cy="47" r=".8" fill="#fff"/>
    <path d="M${cx - 5} 47 Q${cx} 43.5 ${cx + 5} 47" stroke="${skinDD}" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/>`;

  const defs = `<radialGradient id="sk${id}" cx=".38" cy=".32" r=".85">
      <stop offset="0" stop-color="${skinL}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/>
    </radialGradient>`;

  const ears = style === 'afro' ? '' : `
    <ellipse cx="36.5" cy="54" rx="5" ry="7" fill="${skinD}"/><ellipse cx="37.5" cy="54" rx="2.6" ry="4.2" fill="${skinDD}" opacity=".5"/>
    <ellipse cx="83.5" cy="54" rx="5" ry="7" fill="${skinD}"/><ellipse cx="82.5" cy="54" rx="2.6" ry="4.2" fill="${skinDD}" opacity=".5"/>`;

  const neck = `<path d="M50 68 L50 96 Q60 102 70 96 L70 68Z" fill="${skinD}"/>
    <ellipse cx="60" cy="80" rx="10" ry="6" fill="${skinDD}" opacity=".35"/>`;

  const face = `${ears}
    <path d="M37 46 C37 28 47 22 60 22 C73 22 83 28 83 46 C83 66 74 80 60 80 C46 80 37 66 37 46Z" fill="url(#sk${id})"/>
    <circle cx="47" cy="62" r="6" fill="#e0707a" opacity=".12"/><circle cx="73" cy="62" r="6" fill="#e0707a" opacity=".12"/>
    ${eye(50)}${eye(70)}
    <path d="M43.5 41 Q49.5 37.5 56 40" stroke="${brow}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M64 40 Q70.5 37.5 76.5 41" stroke="${brow}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M60 50 C58.5 56 56.5 59 56 60.5 Q60 63.5 64 60.5 C63.5 59 61.5 56 60 50" fill="${skinD}" opacity=".35"/>
    <path d="M56 60.5 Q60 63.5 64 60.5" stroke="${skinDD}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
    ${beardSvg}
    <path d="M53 68.5 Q60 74 67 68.5 Q60 71 53 68.5Z" fill="#fff" opacity=".92"/>
    <path d="M52 68 Q60 74.5 68 68" stroke="${lip}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${front}`;

  return { defs, back, neck, face, skinD, skin };
}

const numberText = (x, y, size, num, fill = '#fff') => {
  const stroke = luminance(fill) > 140 ? '#000' : '#fff';
  return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${fill}" stroke="${stroke}" stroke-opacity=".45" stroke-width="1.2" paint-order="stroke" font-family="system-ui,Arial,sans-serif">${num}</text>`;
};
// Color del número según la camiseta: oscuro sobre claras, claro sobre oscuras (o el secundario si contrasta).
const numColor = (kit) => (luminance(kit.primary) > 150 ? (luminance(kit.secondary) < 90 ? kit.secondary : '#111111') : '#ffffff');

// ---------- Busto ----------
function bust(look, kit, num, id) {
  const h = head(look, id);
  const jersey = 'M6 150 C8 108 28 96 48 92 L72 92 C92 96 112 108 114 150Z';
  return `<svg class="avatar" viewBox="0 0 120 150" role="img" aria-label="Tu jugador">
    <defs>${h.defs}
      <clipPath id="cp${id}"><path d="${jersey}"/></clipPath>
      <linearGradient id="sh${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
    </defs>
    ${h.back}${h.neck}
    <g clip-path="url(#cp${id})">
      <path d="${jersey}" fill="${kit.primary}"/>
      ${pattern(kit.pattern, kit.secondary, 0, 92, 120, 150)}
      <rect x="0" y="92" width="120" height="58" fill="url(#sh${id})"/>
    </g>
    <path d="M49 90 L60 103 L71 90Z" fill="${h.skinD}"/>
    <path d="M44 91 L60 110 L76 91 L71 90 L60 103 L49 90Z" fill="${kit.secondary}"/>
    ${numberText(60, 140, 18, num, numColor(kit))}
    ${h.face}
  </svg>`;
}

// ---------- Cuerpo completo ----------
function full(look, kit, num, id) {
  const h = head(look, id);
  const skin = h.skin;
  const jersey = 'M44 94 Q62 88 80 90 Q98 88 116 94 L134 108 L125 132 L116 124 L116 180 L44 180 L44 124 L35 132 L26 108 Z';
  const shortsColor = kit.shorts || (kit.secondary === '#f5c542' ? shade(kit.primary, -0.45) : kit.secondary);
  const shortsText = luminance(shortsColor) > 140 ? '#111' : '#fff';
  return `<svg class="avatar full" viewBox="0 0 160 292" role="img" aria-label="Tu jugador">
    <defs>${h.defs}
      <clipPath id="cp${id}"><path d="${jersey}"/></clipPath>
      <linearGradient id="sh${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
    </defs>
    <ellipse cx="80" cy="283" rx="56" ry="6" fill="#000" opacity=".35"/>
    <g transform="translate(20 2)">${h.back}${h.neck}</g>
    <rect x="24" y="122" width="13" height="50" rx="6.5" fill="${h.skinD}" transform="rotate(6 30 122)"/>
    <rect x="123" y="122" width="13" height="50" rx="6.5" fill="${h.skinD}" transform="rotate(-6 130 122)"/>
    <circle cx="25.5" cy="174" r="7" fill="${skin}"/><circle cx="134.5" cy="174" r="7" fill="${skin}"/>
    <rect x="48" y="224" width="26" height="40" fill="${skin}"/><rect x="86" y="224" width="26" height="40" fill="${skin}"/>
    <rect x="47" y="244" width="28" height="22" rx="3" fill="${kit.primary}"/><rect x="47" y="244" width="28" height="4" fill="${kit.secondary}"/>
    <rect x="85" y="244" width="28" height="22" rx="3" fill="${kit.primary}"/><rect x="85" y="244" width="28" height="4" fill="${kit.secondary}"/>
    <path d="M44 264 L76 264 L78 272 Q76 278 62 278 L42 278 Q38 276 40 270 Z" fill="#161616"/><rect x="40" y="276" width="40" height="3" rx="1.5" fill="#e8e8e8"/>
    <path d="M84 264 L116 264 L120 270 Q122 276 118 278 L98 278 Q84 278 82 272 Z" fill="#161616"/><rect x="80" y="276" width="40" height="3" rx="1.5" fill="#e8e8e8"/>
    <path d="M44 178 L116 178 L124 226 L84 226 L80 200 L76 226 L36 226 Z" fill="${shortsColor}"/>
    <path d="M44 178 L116 178 L124 226 L84 226 L80 200 L76 226 L36 226 Z" fill="#000" opacity=".12"/>
    ${numberText(54, 210, 11, num, shortsText)}
    <g clip-path="url(#cp${id})">
      <path d="${jersey}" fill="${kit.primary}"/>
      ${pattern(kit.pattern, kit.secondary, 26, 88, 134, 180)}
      <rect x="26" y="88" width="108" height="92" fill="url(#sh${id})"/>
    </g>
    <path d="M66 90 Q80 103 94 90Z" fill="${h.skinD}"/>
    <path d="M62 90 Q80 108 98 90 L94 88 Q80 99 66 88Z" fill="${kit.secondary}"/>
    ${numberText(80, 150, 30, num, numColor(kit))}
    <g transform="translate(20 2)">${h.face}</g>
    <circle cx="138" cy="272" r="11" fill="#fff" stroke="#222" stroke-width="1.5"/>
    <polygon points="138,265 143,269 141,275 135,275 133,269" fill="#222"/>
  </svg>`;
}

export function avatar(look, clubName = '', num = 9, mode = 'bust') {
  const id = ++uid;
  const kit = kitColors(clubName);
  return mode === 'full' ? full(look, kit, num, id) : bust(look, kit, num, id);
}
