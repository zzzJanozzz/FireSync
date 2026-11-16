// FireSync third level: departments / counties / districts of every country geoBoundaries covers
// (gbOpen ADM2, ~180 countries), nested inside the Natural Earth provinces / states and joined to the
// harmonized 0.25-degree cells. Output: one small file per province / state, so the app never has to
// download a whole country's subdivisions (Brazil alone is 40 MB) at judging time.
// Developed with SI (Claude, Anthropic) assistance. License: Apache-2.0
//
// Usage:
//   curl -sS -o data/raw/gb/all_adm2.json https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM2/
//   (download each simplifiedGeometryGeoJSON into data/raw/gb/<ISO>.geojson, see docs)
//   node scripts/build_adm2.mjs data/raw/gb web/data <path-to-mapshaper>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [, , GB = 'data/raw/gb', WEB = 'web/data', MAPSHAPER = 'mapshaper'] = process.argv;
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const OUT = path.join(WEB, 'adm2');
const SIMP = path.join(GB, 'simp');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SIMP, { recursive: true });

const meta = readJSON(path.join(WEB, 'meta.json'));
const N = meta.months, res = meta.tileRes, cols = Math.round(360 / res);
const catalog = readJSON(path.join(GB, 'all_adm2.json'));
// geoBoundaries uses ISO 3166-1 alpha-3; Natural Earth uses its own ADM0_A3 for a few units.
const NE_OF_ISO = { XKX: 'KOS', PSE: 'PSX', SSD: 'SDS', ESH: 'SAH', ALA: 'ALD' };

// ------------------------------------------------------------ geometry helpers
const polysOf = g => (!g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
function inRing(x, y, r) {
  let ins = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function inGeom(x, y, g) {
  for (const p of polysOf(g)) {
    if (!inRing(x, y, p[0])) continue;
    let hole = false;
    for (let h = 1; h < p.length; h++) if (inRing(x, y, p[h])) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
}
function bboxOf(g) {
  let w = 180, s = 90, e = -180, n = -90;
  for (const p of polysOf(g)) for (const [x, y] of p[0]) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
  return [w, s, e, n];
}
function areaKm2(g) {
  const R = 6378137, rad = Math.PI / 180;
  const ring = r => { let a = 0; for (let i = 0; i < r.length; i++) { const p1 = r[i], p2 = r[(i + 1) % r.length]; a += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad)); } return Math.abs(a * R * R / 2); };
  let t = 0;
  for (const p of polysOf(g)) { t += ring(p[0]); for (let h = 1; h < p.length; h++) t -= ring(p[h]); }
  return t / 1e6;
}
function repPoint(g) {
  let best = null, n = -1;
  for (const p of polysOf(g)) if (p[0].length > n) { n = p[0].length; best = p[0]; }
  if (!best) return null;
  let x = 0, y = 0;
  for (const [a, b] of best) { x += a; y += b; }
  const c = [x / best.length, y / best.length];
  return inGeom(c[0], c[1], g) ? c : best[Math.floor(best.length / 3)];
}
const ringSign = r => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += (r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]); return a; };
function rewindD3(g) {
  const fix = poly => poly.filter(r => r.length >= 4).map((r, i) => ((i === 0) === (ringSign(r) > 0) ? r : r.slice().reverse()));
  if (g.type === 'Polygon') return { type: 'Polygon', coordinates: fix(g.coordinates) };
  if (g.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: g.coordinates.map(fix).filter(p => p.length) };
  return g;
}
const r4 = v => Math.round(v * 10000) / 10000;
// Province ids can hold characters that are not valid in file names (e.g. "GUM+00?"); the app uses the same mapping.
const fileKey = id => String(id).replace(/[^A-Za-z0-9_-]/g, c => '_' + c.charCodeAt(0).toString(16));
const q1 = v => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);

// ------------------------------------------------------------ 1. simplify every country (mapshaper)
for (const m of catalog) {
  const iso = m.boundaryISO, src = path.join(GB, `${iso}.geojson`), dst = path.join(SIMP, `${iso}.json`);
  if (!fs.existsSync(src) || fs.existsSync(dst)) continue;
  try {
    execFileSync(MAPSHAPER, ['-i', src, '-filter-fields', 'shapeName,shapeID', '-simplify', 'interval=350', 'keep-shapes', '-o', `precision=0.0005`, 'format=geojson', dst], { stdio: 'pipe', shell: process.platform === 'win32' });
  } catch (e) { console.warn(`simplify failed for ${iso}: ${String(e.stderr || e.message).slice(0, 160)}`); }
}

// ------------------------------------------------------------ 2. nest each subdivision inside a Natural Earth province / state
const subs = []; // {iso, a3, uid, id, name, geom, bbox, H, g}
const perUnit = new Map(); // uid -> {a3, meta, list}
let orphan = 0;
for (const m of catalog) {
  const iso = m.boundaryISO, a3 = NE_OF_ISO[iso] || iso;
  const sp = path.join(SIMP, `${iso}.json`), rp = path.join(WEB, 'regions', `${a3}.json`);
  if (!fs.existsSync(sp) || !fs.existsSync(rp)) { if (fs.existsSync(sp)) console.warn(`no Natural Earth provinces for ${iso}`); continue; }
  const gj = readJSON(sp), regions = readJSON(rp);
  const units = regions.geo.features.map(f => ({ id: f.properties.id, geom: f.geometry, bbox: bboxOf(f.geometry), u: regions.units.find(u => u.id === f.properties.id) }));
  for (const f of gj.features) {
    if (!f.geometry || !/Polygon/.test(f.geometry.type)) continue;
    const p = repPoint(f.geometry);
    if (!p) continue;
    let host = units.find(u => p[0] >= u.bbox[0] && p[0] <= u.bbox[2] && p[1] >= u.bbox[1] && p[1] <= u.bbox[3] && inGeom(p[0], p[1], u.geom));
    if (!host) {
      // Borders differ slightly between datasets: take the province whose centre is nearest.
      let bd = Infinity;
      for (const u of units) { const d = (u.u.lat - p[1]) ** 2 + ((u.u.lon - p[0]) * Math.cos(p[1] * Math.PI / 180)) ** 2; if (d < bd) { bd = d; host = u; } }
      if (!host || bd > 4) { orphan++; continue; }
    }
    const s = { iso, a3, uid: host.id, id: String(f.properties.shapeID || `${iso}-${subs.length}`), name: f.properties.shapeName || '—', geom: f.geometry, bbox: bboxOf(f.geometry), H: new Float64Array(N), g: [] };
    subs.push(s);
    if (!perUnit.has(host.id)) perUnit.set(host.id, { a3, iso, meta: m, list: [] });
    perUnit.get(host.id).list.push(s);
  }
}
console.log(`Subdivisions nested: ${subs.length.toLocaleString()} in ${perUnit.size.toLocaleString()} provinces / states (${orphan} left out, far from any province)`);

// ------------------------------------------------------------ 3. assign harmonized cells to subdivisions
const buckets = new Map();
subs.forEach((s, i) => {
  const [w, so, e, n] = s.bbox;
  for (let x = Math.floor(w); x <= Math.floor(e); x++) for (let y = Math.floor(so); y <= Math.floor(n); y++) {
    const k = (y + 90) * 360 + (x + 180);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(i);
  }
});
const subAt = (lon, lat) => {
  const c = buckets.get((Math.floor(lat) + 90) * 360 + (Math.floor(lon) + 180));
  if (!c) return -1;
  for (const i of c) { const b = subs[i].bbox; if (lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && inGeom(lon, lat, subs[i].geom)) return i; }
  return -1;
};
const NEAR = [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]];
let nCells = 0, nIn = 0;
for (const key of meta.tiles) {
  const tile = readJSON(path.join(WEB, 'tiles', `${key}.json`));
  for (const [g, , arr] of tile.cells) {
    const lat = -90 + (Math.floor(g / cols) + 0.5) * res, lon = -180 + ((g % cols) + 0.5) * res;
    nCells++;
    let i = subAt(lon, lat);
    for (let k = 0; i < 0 && k < NEAR.length; k++) i = subAt(lon + NEAR[k][0] * res, lat + NEAR[k][1] * res);
    if (i < 0) continue;
    nIn++;
    const s = subs[i];
    s.g.push(g);
    for (let j = 0; j < arr.length; j += 3) { const t = arr[j]; if (t < N) s.H[t] += arr[j + 1] / 10; }
  }
}
console.log(`Burning cells inside a subdivision: ${nIn.toLocaleString()} of ${nCells.toLocaleString()} (${(100 * nIn / nCells).toFixed(1)}%)`);

// ------------------------------------------------------------ 4. one file per province / state
const roundGeom = g => rewindD3(JSON.parse(JSON.stringify(g, (k, v) => (typeof v === 'number' ? r4(v) : v))));
let files = 0, bytes = 0;
for (const [uid, { a3, iso, meta: m, list }] of perUnit) {
  if (list.length < 2) continue; // a single subdivision adds nothing below its province
  list.sort((a, b) => a.name.localeCompare(b.name));
  const seen = new Set();
  for (const s of list) { while (seen.has(s.id)) s.id += '_'; seen.add(s.id); }
  const out = {
    uid, a3, iso, n: N,
    canonical: m.boundaryCanonical && m.boundaryCanonical !== 'nan' ? m.boundaryCanonical : '',
    source: m.boundarySource || '', license: m.boundaryLicense || '', year: m.boundaryYearRepresented || '',
    units: list.map(s => ({ id: s.id, name: s.name, bbox: s.bbox.map(r4), km2: Math.round(areaKm2(s.geom)), cells: s.g.length })),
    H: Object.fromEntries(list.map(s => [s.id, Array.from(s.H, q1)])),
    G: Object.fromEntries(list.map(s => [s.id, s.g.sort((a, b) => a - b)])),
    geo: { type: 'FeatureCollection', features: list.map(s => ({ type: 'Feature', properties: { id: s.id }, geometry: roundGeom(s.geom) })) },
  };
  const txt = JSON.stringify(out);
  fs.writeFileSync(path.join(OUT, `${fileKey(uid)}.json`), txt);
  files++; bytes += txt.length;
}
console.log(`Wrote ${files.toLocaleString()} province files with subdivisions (${(bytes / 1048576).toFixed(1)} MB).`);
