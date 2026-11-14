// FireSync regions builder: country borders + every first-level subdivision on Earth (Natural Earth,
// public domain), joined to the FireSync record. For each of the ~4,600 provinces / states it sums
// the harmonized 0.25-degree cells whose centre falls inside the shape, so the web app can draw a
// province choropleth, rank provinces and open any province instantly.
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
//
// Usage (after scripts/build_regions.sh has simplified the Natural Earth shapefiles):
//   node scripts/build_regions.mjs data/raw/ne web/data
import fs from 'node:fs';
import path from 'node:path';

const [, , NE = 'data/raw/ne', WEB = 'web/data'] = process.argv;
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const OUT = path.join(WEB, 'regions');
fs.mkdirSync(OUT, { recursive: true });

const meta = readJSON(path.join(WEB, 'meta.json'));
const N = meta.months;
const countries = readJSON(path.join(WEB, 'countries.json'));
const world = readJSON(path.join(NE, 'world.json'));
const adm1 = readJSON(path.join(NE, 'adm1.json'));

// ------------------------------------------------------------ FIRMS country name -> Natural Earth ADM0_A3
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const OVERRIDES = {
  'Aland Islands': 'ALD', 'Brunei Darussalam': 'BRN', 'Cape Verde': 'CPV', 'Cote d Ivoire': 'CIV', 'Czech Republic': 'CZE',
  'Democratic Republic of the Congo': 'COD', 'Dem Rep Korea': 'PRK', 'Republic of Korea': 'KOR', 'Republic of Congo': 'COG',
  'Lao PDR': 'LAO', 'Macedonia Former Yugoslav Republic of': 'MKD', 'Russian Federation': 'RUS', 'Swaziland': 'SWZ',
  'The Gambia': 'GMB', 'Timor-Leste': 'TLS', 'United States': 'USA', 'United Kingdom': 'GBR', 'Tanzania': 'TZA',
  'Serbia': 'SRB', 'Bahamas': 'BHS', 'Faeroe Islands': 'FRO', 'Federated States of Micronesia': 'FSM',
  'Wallis and Futuna Islands': 'WLF', 'Saint-Martin': 'MAF', 'Saint-Barthelemy': 'BLM', 'Heard I and McDonald Islands': 'HMD',
  'United States Minor Outlying Islands': 'UMI', 'United States Virgin Islands': 'VIR', 'British Virgin Islands': 'VGB',
  'Hong Kong': 'HKG', 'Palestine': 'PSX', 'Kosovo': 'KOS', 'Curacao': 'CUW', 'Sint Maarten': 'SXM', 'Saint Helena': 'SHN',
  'Falkland Islands': 'FLK', 'French Southern and Antarctic Lands': 'ATF', 'Antarctica': 'ATA', 'Somalia': 'SOM',
  'Cyprus': 'CYP', 'Morocco': 'MAR', 'Saint Pierre and Miquelon': 'SPM', 'Vietnam': 'VNM', 'Syria': 'SYR', 'Iran': 'IRN',
  'Bolivia': 'BOL', 'Venezuela': 'VEN', 'Moldova': 'MDA', 'Taiwan': 'TWN', 'Guinea-Bissau': 'GNB', 'Pitcairn Islands': 'PCN',
};
// Natural Earth units FIRMS folds into a neighbour (FIRMS country attribution follows the parent).
const NE_ALIAS = { SOL: 'SOM', CYN: 'CYP', SAH: 'MAR', KAB: 'KAZ', SCR: 'CHN', CNM: 'CYP', ESB: 'CYP', WSB: 'CYP', BJN: 'COL', SER: 'COL', USG: 'CUB', IOA: 'AUS', CSI: 'AUS', ATC: 'AUS', CLP: 'FRA', PGA: 'CHN', BRI: 'GBR' };

const neByA3 = new Map(), neByName = new Map();
for (const f of world.features) {
  const p = f.properties;
  neByA3.set(p.ADM0_A3, p);
  for (const k of [p.ADMIN, p.NAME, p.NAME_EN, p.NAME_ES]) if (k) neByName.set(norm(k), p.ADM0_A3);
}
const a3ByFid = new Map(), fidByA3 = new Map(), unmatched = [];
for (const c of countries) {
  let a3 = OVERRIDES[c.name];
  if (!a3 || !neByA3.has(a3)) a3 = neByName.get(norm(c.name)) || a3;
  if (a3 && neByA3.has(a3)) { a3ByFid.set(c.id, a3); fidByA3.set(a3, c.id); }
  else unmatched.push(c.name);
}
for (const [alias, parent] of Object.entries(NE_ALIAS)) if (!fidByA3.has(alias) && fidByA3.has(parent)) fidByA3.set(alias, fidByA3.get(parent));
console.log(`FIRMS countries matched to Natural Earth: ${a3ByFid.size}/${countries.length}`);
if (unmatched.length) console.log(`  without a Natural Earth polygon (outline falls back to OpenStreetMap): ${unmatched.join(', ')}`);

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
const r3 = v => Math.round(v * 1000) / 1000;

// ------------------------------------------------------------ provinces / states
const TYPE_ES = {
  Province: 'Provincia', State: 'Estado', Region: 'Región', Department: 'Departamento', County: 'Condado', District: 'Distrito',
  Municipality: 'Municipio', Prefecture: 'Prefectura', Governorate: 'Gobernación', Oblast: 'Óblast', Republic: 'República',
  Territory: 'Territorio', 'Autonomous Region': 'Región autónoma', 'Autonomous Community': 'Comunidad autónoma',
  'Federal District': 'Distrito federal', 'Capital District': 'Distrito capital', Canton: 'Cantón', Parish: 'Parroquia',
  Emirate: 'Emirato', Division: 'División', 'Metropolitan Region': 'Región metropolitana', Krai: 'Krai', 'Autonomous Okrug': 'Distrito autónomo',
  'Federal City': 'Ciudad federal', 'Independent City': 'Ciudad independiente', Island: 'Isla', 'Island council': 'Consejo insular',
  Voivodeship: 'Voivodato', Commune: 'Comuna', Zone: 'Zona', 'Unitary District': 'Distrito unitario', 'Autonomous Province': 'Provincia autónoma',
};
const units = [];
for (const f of adm1.features) {
  const p = f.properties;
  if (!f.geometry) continue;
  const a3 = p.adm0_a3;
  const id = p.adm1_code || `${a3}-${units.length}`;
  // Natural Earth data quirk: Buenos Aires province is typed like the federal capital.
  if (a3 === 'ARG' && p.name === 'Buenos Aires') { p.type_en = 'Province'; p.type = 'Provincia'; }
  const bb = bboxOf(f.geometry);
  units.push({
    id, a3, admin: p.admin,
    name: p.name || p.name_en || id, name_en: p.name_en || p.name || id, name_es: p.name_es || p.name || p.name_en || id,
    type_en: p.type_en || '', type: p.type || '', iso: p.iso_3166_2 || '',
    lat: r3(Number(p.latitude) || (bb[1] + bb[3]) / 2), lon: r3(Number(p.longitude) || (bb[0] + bb[2]) / 2),
    bbox: bb.map(r3), km2: Math.round(areaKm2(f.geometry)), geom: f.geometry,
    H: new Float64Array(N), cells: 0, g: [],
  });
}
console.log(`Natural Earth admin-1 units: ${units.length} in ${new Set(units.map(u => u.a3)).size} countries`);

// Spatial index: 1-degree buckets -> candidate units.
const buckets = new Map();
units.forEach((u, i) => {
  const [w, s, e, n] = u.bbox;
  for (let x = Math.floor(w); x <= Math.floor(e); x++) for (let y = Math.floor(s); y <= Math.floor(n); y++) {
    const k = (y + 90) * 360 + (x + 180);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(i);
  }
});
function unitAt(lon, lat) {
  const k = (Math.floor(lat) + 90) * 360 + (Math.floor(lon) + 180);
  const cand = buckets.get(k);
  if (!cand) return -1;
  for (const i of cand) {
    const [w, s, e, n] = units[i].bbox;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    if (inGeom(lon, lat, units[i].geom)) return i;
  }
  return -1;
}

// ------------------------------------------------------------ sum harmonized tile cells per unit
const res = meta.tileRes, cols = Math.round(360 / res);
const NEAR = [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]];
let nCells = 0, nAssigned = 0;
for (const key of meta.tiles) {
  const tile = readJSON(path.join(WEB, 'tiles', `${key}.json`));
  for (const [g, , arr] of tile.cells) {
    const lat = -90 + (Math.floor(g / cols) + 0.5) * res, lon = -180 + ((g % cols) + 0.5) * res;
    nCells++;
    // Centre inside a shape; otherwise (coastal cells whose centre is offshore) try points around the centre.
    let i = unitAt(lon, lat);
    for (let k = 0; i < 0 && k < NEAR.length; k++) i = unitAt(lon + NEAR[k][0] * res, lat + NEAR[k][1] * res);
    if (i < 0) continue;
    nAssigned++;
    const u = units[i];
    u.cells++; u.g.push(g);
    for (let j = 0; j < arr.length; j += 3) { const t = arr[j]; if (t < N) u.H[t] += arr[j + 1] / 10; }
  }
}
console.log(`Tile cells with fire: ${nCells.toLocaleString()} · inside a province/state: ${nAssigned.toLocaleString()} (${(100 * nAssigned / nCells).toFixed(1)}%)`);

// ------------------------------------------------------------ write per-country region files
const q1 = v => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
// globe.gl (d3-geo spherical convention) needs clockwise exterior rings and counter-clockwise holes;
// mapshaper writes RFC 7946 (the opposite), which three-globe would fill as the rest of the planet.
const ringSign = r => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += (r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]); return a; }; // > 0: clockwise
function rewindD3(g) {
  const fix = poly => poly.filter(r => r.length >= 4).map((r, i) => ((i === 0) === (ringSign(r) > 0) ? r : r.slice().reverse()));
  if (g.type === 'Polygon') return { type: 'Polygon', coordinates: fix(g.coordinates) };
  if (g.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: g.coordinates.map(fix).filter(p => p.length) };
  return g;
}
const roundGeom = g => rewindD3(JSON.parse(JSON.stringify(g, (k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v))));
const byA3 = new Map();
for (const u of units) { if (!byA3.has(u.a3)) byA3.set(u.a3, []); byA3.get(u.a3).push(u); }
const index = [];
for (const [a3, list] of byA3) {
  list.sort((a, b) => a.name.localeCompare(b.name));
  const fid = fidByA3.has(a3) ? fidByA3.get(a3) : null;
  const out = {
    a3, fid, admin: list[0].admin, n: N,
    units: list.map(u => ({ id: u.id, name: u.name, name_en: u.name_en, name_es: u.name_es, type_en: u.type_en, type: u.type, iso: u.iso, lat: u.lat, lon: u.lon, bbox: u.bbox, km2: u.km2, cells: u.cells })),
    H: Object.fromEntries(list.map(u => [u.id, Array.from(u.H, q1)])),
    // 0.25-degree cells (row-major index) assigned to each unit: the app sums exactly these cells from the tiles.
    G: Object.fromEntries(list.map(u => [u.id, u.g.sort((a, b) => a - b)])),
    geo: { type: 'FeatureCollection', features: list.map(u => ({ type: 'Feature', properties: { id: u.id }, geometry: roundGeom(u.geom) })) },
  };
  fs.writeFileSync(path.join(OUT, `${a3}.json`), JSON.stringify(out));
  for (const u of list) index.push([u.id, a3, u.name, u.name_en !== u.name ? u.name_en : '', u.name_es !== u.name ? u.name_es : '', u.type_en, u.lat, u.lon]);
}
// Search index of every province / state on Earth (instant local search, no network round-trip).
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ fields: ['id', 'a3', 'name', 'name_en', 'name_es', 'type_en', 'lat', 'lon'], units: index }));
console.log(`Wrote ${byA3.size} country region files and an index of ${index.length} provinces / states.`);

// ------------------------------------------------------------ world borders (hover / click on the globe)
const worldOut = {
  type: 'FeatureCollection',
  features: world.features.filter(f => f.geometry && f.properties.ADM0_A3 !== 'ATA').map(f => {
    const p = f.properties;
    return { type: 'Feature', properties: { a3: p.ADM0_A3, name: p.NAME_EN || p.ADMIN || p.NAME, name_es: p.NAME_ES || p.NAME, fid: fidByA3.has(p.ADM0_A3) ? fidByA3.get(p.ADM0_A3) : null, adm1: byA3.has(p.ADM0_A3) ? byA3.get(p.ADM0_A3).length : 0 }, geometry: roundGeom(f.geometry) };
  }),
};
fs.writeFileSync(path.join(OUT, 'world.json'), JSON.stringify(worldOut));

// ------------------------------------------------------------ monthly series of every country (world ranking)
const ranks = {};
for (const c of countries) {
  const p = path.join(WEB, 'cal', `${c.id}.json`);
  if (!fs.existsSync(p)) continue;
  ranks[c.id] = readJSON(p).H.map(q1);
}
fs.writeFileSync(path.join(OUT, 'countries_H.json'), JSON.stringify({ n: N, a3: Object.fromEntries(a3ByFid), H: ranks }));
console.log('Wrote world.json (country borders) and countries_H.json (country series for the world ranking).');
