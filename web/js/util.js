// FireSync shared helpers. Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0

// Month index t: 0 = 2000-11 (first MODIS Terra month in FIRMS).
export const T_AQUA = 20;    // 2002-07
export const T_SNPP = 135;   // 2012-02
export const T_NOAA20 = 312; // 2026-11

export const yearOf = t => 2000 + Math.floor((t + 10) / 12);
export const monthOf = t => (t + 10) % 12;            // 0 = January
export const tOf = (y, m) => (y - 2000) * 12 + m - 10; // m 0-based
export const isRecon = t => t < T_SNPP;
export const refSatOf = t => (t < T_AQUA ? 'Terra' : t < T_SNPP ? 'Aqua' : t < T_NOAA20 ? 'Suomi NPP' : 'NOAA-20');

export function fmt(n, lang = 'en', digits = 0) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(lang === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: digits }).format(n);
}
export function compact(n) {
  if (n == null || Number.isNaN(n)) return '';
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (a >= 1e4) return Math.round(n / 1e3) + 'k';
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  if (a >= 10) return String(Math.round(n));
  if (a === 0) return '0';
  return n.toFixed(1).replace(/\.0$/, '');
}
export const pct = (v, lang) => (v == null || !isFinite(v) ? '—' : (v >= 0 ? '+' : '') + fmt(v * 100, lang, Math.abs(v) < 0.1 ? 1 : 0) + '%');

// ------------------------------------------------------------ statistics
export function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q, i = Math.floor(pos), f = pos - i;
  return i + 1 < sorted.length ? sorted[i] * (1 - f) + sorted[i + 1] * f : sorted[i];
}
export const median = arr => quantile([...arr].sort((a, b) => a - b), 0.5);
// Log colour scale stretched between the 3rd percentile of positive values and the maximum of this area.
export function logScale(values, n) {
  const pos = [];
  for (let t = 0; t < n; t++) if (values[t] > 0) pos.push(values[t]);
  pos.sort((a, b) => a - b);
  const lo = Math.max(0.5, quantile(pos, 0.03) || 0.5), hi = Math.max(lo * 1.5, pos[pos.length - 1] || 1);
  const a = Math.log10(lo), b = Math.log10(hi);
  return v => (v > 0 ? Math.max(0, Math.min(1, (Math.log10(v) - a) / (b - a))) : -1);
}

// ------------------------------------------------------------ colors
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rampFn(stops) {
  const s = stops.map(([p, c]) => [p, hexToRgb(c)]);
  return x => {
    x = Math.max(0, Math.min(1, x));
    for (let i = 1; i < s.length; i++) {
      if (x <= s[i][0]) {
        const [p0, c0] = s[i - 1], [p1, c1] = s[i], f = (x - p0) / (p1 - p0 || 1);
        return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * f)},${Math.round(c0[1] + (c1[1] - c0[1]) * f)},${Math.round(c0[2] + (c1[2] - c0[2]) * f)})`;
      }
    }
    const c = s[s.length - 1][1];
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };
}
// Perceptually uniform, colorblind-safe sequential ramp (matplotlib "inferno", starting above black for dark UIs).
export const INFERNO = [[0, '#1f0c48'], [0.12, '#420a68'], [0.25, '#6a176e'], [0.38, '#932667'], [0.5, '#bc3754'], [0.62, '#dd513a'], [0.74, '#f37819'], [0.84, '#fca50a'], [0.93, '#f6d746'], [1, '#fcffa4']];
export const inferno = rampFn(INFERNO);
// Diverging blue-orange with a dark neutral centre (safe for red-green colour blindness).
export const DIVERGING = [[0, '#b4d3f0'], [0.25, '#3f76b0'], [0.5, '#2a2722'], [0.75, '#c2410c'], [1, '#fdba74']];
export const diverging = rampFn(DIVERGING);
// Globe points ramp (fire glow).
export const FIRE = [[0, '#8a1c12'], [0.3, '#d9480f'], [0.55, '#f97316'], [0.78, '#fbbf24'], [1, '#fff7c2']];
export const fire = rampFn(FIRE);
export const cssGradient = stops => `linear-gradient(90deg, ${stops.map(([p, c]) => `${c} ${Math.round(p * 100)}%`).join(', ')})`;
export function textOn(rgb) {
  const m = rgb.match(/\d+/g).map(Number);
  const l = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
  return l > 0.55 ? '#140b1f' : '#ffffff';
}

// ------------------------------------------------------------ geo
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function circlePath(lat, lon, radiusKm, steps = 96, alt = 0.006) {
  const pts = [], d = radiusKm / 6371, toR = Math.PI / 180, toD = 180 / Math.PI;
  const la = lat * toR, lo = lon * toR;
  for (let i = 0; i <= steps; i++) {
    const b = (i / steps) * 2 * Math.PI;
    const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
    pts.push([la2 * toD, ((lo2 * toD + 540) % 360) - 180, alt]);
  }
  return pts;
}

// ------------------------------------------------------------ misc
export function download(filename, content, type = 'text/csv;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
export const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export function animateNumber(el, to, { lang = 'en', duration = 700, format } = {}) {
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (!isFinite(to)) { el.textContent = '—'; return; }
  const f = format || (v => fmt(v, lang));
  const start = performance.now();
  const step = now => {
    const p = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
