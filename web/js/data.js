// FireSync data access: static harmonized products (pipeline/FireSync.cs), place search (OpenStreetMap
// Nominatim) and burned area (MODIS MCD64A1 via Microsoft Planetary Computer).
// Developed with SI (Claude, Anthropic) assistance. License: Apache-2.0
import { haversineKm, isRecon, monthOf, yearOf, T_AQUA, T_SNPP } from './util.js';

const BASE = 'data/';
const cache = new Map();
// A dropped connection or a 5xx from the host is retried twice (a flaky network at a demo should not
// leave a click doing nothing). A 404 is final: some files are optional.
async function fetchJSON(path, tries = 3) {
  for (let i = 0; ; i++) {
    let res = null;
    try { res = await fetch(BASE + path); } catch (e) { if (i >= tries - 1) throw new Error(`${path}: network error`); }
    if (res) {
      if (res.ok) return res.json();
      if (res.status < 500 || i >= tries - 1) throw new Error(`${path}: HTTP ${res.status}`);
    }
    await new Promise(r => setTimeout(r, 450 * (i + 1)));
  }
}
function getJSON(path) {
  if (!cache.has(path)) cache.set(path, fetchJSON(path).catch(e => { cache.delete(path); throw e; }));
  return cache.get(path);
}

export const getMeta = () => getJSON('meta.json');
export const getCountries = () => getJSON('countries.json');
export const getFactors = () => getJSON('factors.json');
export const getValidation = () => getJSON('validation.json');
export const getHandover = () => getJSON('handover.json');

function naiveFrom(cal, n) {
  const out = new Float64Array(n);
  for (let t = 0; t < n; t++) {
    const src = t < T_AQUA ? cal.T : t < T_SNPP ? cal.A : cal.S;
    out[t] = src ? src[t] || 0 : 0;
  }
  return out;
}

export async function countrySeries(id) {
  const cal = await getJSON(`cal/${id}.json`);
  const n = cal.n;
  return {
    kind: id === 'world' ? 'world' : 'country', id, name: cal.name, n,
    H: Float64Array.from(cal.H), lo: Float64Array.from(cal.lo), hi: Float64Array.from(cal.hi),
    naive: naiveFrom(cal, n),
    raw: { Terra: cal.T, Aqua: cal.A, 'Suomi NPP': cal.S, 'NOAA-20': cal.N },
  };
}

// Per-country 0.25-degree layer for one year: {"YYYY-MM": Int32Array[cell, value*10, ...]}
const cyCache = new Map();
export function countryYear(id, y) {
  const k = `${id}/${y}`;
  if (!cyCache.has(k)) cyCache.set(k, getJSON(`country/${k}.json`).then(j => {
    const out = {};
    for (const [label, flat] of Object.entries(j.months)) out[label] = Int32Array.from(flat);
    return out;
  }).catch(() => ({})));
  return cyCache.get(k);
}
export function cellCenter(cell, res = 0.25) {
  const cols = Math.round(360 / res);
  return { lat: -90 + (Math.floor(cell / cols) + 0.5) * res, lng: -180 + ((cell % cols) + 0.5) * res };
}

// ------------------------------------------------------------ geometry helpers
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function polygonsOf(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}
export function pointInGeom(lng, lat, geom) {
  for (const poly of polygonsOf(geom)) {
    if (!pointInRing(lng, lat, poly[0])) continue;
    let hole = false;
    for (let h = 1; h < poly.length; h++) if (pointInRing(lng, lat, poly[h])) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
}
export function geomBBox(geom) {
  let w = 180, s = 90, e = -180, n = -90;
  for (const poly of polygonsOf(geom)) for (const [x, y] of poly[0]) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
  return [w, s, e, n];
}
// Geodesic area in hectares (same spherical-excess formula as d3.geoArea / turf.area).
export function geomAreaHa(geom) {
  const R = 6378137, rad = Math.PI / 180;
  const ringArea = ring => {
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i], p2 = ring[(i + 1) % ring.length];
      a += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad));
    }
    return Math.abs(a * R * R / 2);
  };
  let total = 0;
  for (const poly of polygonsOf(geom)) { total += ringArea(poly[0]); for (let h = 1; h < poly.length; h++) total -= ringArea(poly[h]); }
  return total / 1e4;
}
export function geomCenter(geom) { const [w, s, e, n] = geomBBox(geom); return [(s + n) / 2, (w + e) / 2]; }
export function outlineRings(geom, alt = 0.006) {
  const rings = [];
  for (const poly of polygonsOf(geom)) for (const ring of poly) rings.push(ring.map(([x, y]) => [y, x, alt]));
  return rings;
}
export function circleGeom(lat, lon, radiusKm, steps = 64) {
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const b = (i / steps) * 2 * Math.PI;
    ring.push([lon + (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180))) * Math.cos(b), lat + (radiusKm / 111.32) * Math.sin(b)]);
  }
  return { type: 'Polygon', coordinates: [ring] };
}

// ------------------------------------------------------------ tiles: harmonized series for any shape
const tileCache = new Map();
function getTile(key) {
  if (!tileCache.has(key)) tileCache.set(key, getJSON(`tiles/${key}.json`));
  return tileCache.get(key);
}
// inside(lat, lon, cellIndex) decides which 0.25-degree cells belong to the area.
async function cellsSeries(bbox, inside, label) {
  const [meta, factors] = await Promise.all([getMeta(), getFactors()]);
  const res = meta.tileRes, tileDeg = meta.tileDeg, cols = Math.round(360 / res);
  const available = new Set(meta.tiles);
  const [w, s, e, nn] = bbox;
  const keys = [];
  for (let tx = Math.floor((Math.max(-180, w) + 180) / tileDeg); tx <= Math.floor((Math.min(179.999, e) + 180) / tileDeg); tx++)
    for (let ty = Math.floor((Math.max(-90, s) + 90) / tileDeg); ty <= Math.floor((Math.min(89.999, nn) + 90) / tileDeg); ty++) {
      const k = `${tx}_${ty}`;
      if (available.has(k)) keys.push(k);
    }
  const tiles = await Promise.all(keys.map(getTile));
  const n = meta.months;
  const H = new Float64Array(n), lo = new Float64Array(n), hi = new Float64Array(n), naive = new Float64Array(n);
  const cells = [];
  for (const tile of tiles)
    for (const [g, dom, arr] of tile.cells) {
      const clat = -90 + (Math.floor(g / cols) + 0.5) * res, clon = -180 + ((g % cols) + 0.5) * res;
      if (!inside(clat, clon, g)) continue;
      const f = factors.countries[dom];
      const series = new Float32Array(n);
      for (let i = 0; i < arr.length; i += 3) {
        const t = arr[i];
        if (t >= n) continue;
        const h = arr[i + 1] / 10;
        H[t] += h; series[t] = h; naive[t] += arr[i + 2];
        if (isRecon(t)) { const cm = monthOf(t); lo[t] += h * (f ? f.lo[cm] : 0.6); hi[t] += h * (f ? f.hi[cm] : 1.6); }
        else { lo[t] += h; hi[t] += h; }
      }
      cells.push({ key: g, lat: clat, lng: clon, series });
    }
  return { n, H, lo, hi, naive, cells, label };
}

export async function circleSeries(lat, lon, radiusKm) {
  const dLat = radiusKm / 111.32, dLon = Math.min(180, radiusKm / (111.32 * Math.max(0.02, Math.cos(lat * Math.PI / 180))));
  const r = await cellsSeries([lon - dLon, lat - dLat, lon + dLon, lat + dLat], (a, b) => haversineKm(lat, lon, a, b) <= radiusKm);
  const geom = circleGeom(lat, lon, radiusKm);
  return { ...r, kind: 'circle', id: `${lat.toFixed(3)},${lon.toFixed(3)},${radiusKm}`, lat, lon, radiusKm, geom, areaHa: Math.PI * radiusKm * radiusKm * 100, raw: null };
}

export async function polygonSeries(geom) {
  const bbox = geomBBox(geom);
  const r = await cellsSeries(bbox, (la, lo) => pointInGeom(lo, la, geom));
  return { ...r, kind: 'polygon', geom, bbox, areaHa: geomAreaHa(geom), raw: null };
}

// ------------------------------------------------------------ regions: countries and every province / state on Earth
// Built by scripts/build_regions.mjs from Natural Earth (public domain) and the FireSync tiles.
export const getWorldBorders = () => getJSON('regions/world.json');
export const getCountriesH = () => getJSON('regions/countries_H.json');
export const getRegionIndex = () => getJSON('regions/index.json');
export const getRegions = a3 => getJSON(`regions/${a3}.json`);

// Harmonized series of one province / state: exactly the cells the builder assigned to it.
export async function unitSeries(file, uid) {
  const u = file.units.find(x => x.id === uid);
  if (!u) throw new Error(`unknown region ${uid}`);
  const set = new Set(file.G[uid] || []);
  const f = file.geo.features.find(x => x.properties.id === uid);
  const geom = f ? f.geometry : null;
  const [w, s, e, n] = u.bbox;
  const r = await cellsSeries([w - 0.6, s - 0.6, e + 0.6, n + 0.6], (la, lo, g) => set.has(g));
  return { ...r, kind: 'region', geom, bbox: u.bbox, areaHa: u.km2 * 100, raw: null, unit: u };
}

// Third level (departments, counties, districts...): geoBoundaries gbOpen ADM2 (open licences, ~180 countries),
// nested in each province / state and joined to the cells by scripts/build_adm2.mjs. One small file per province.
const fileKey = id => String(id).replace(/[^A-Za-z0-9_-]/g, c => '_' + c.charCodeAt(0).toString(16));
export const getAdm2 = uid => getJSON(`adm2/${fileKey(uid)}.json`);
export async function subSeries(file, sid) {
  const u = file.units.find(x => x.id === sid);
  if (!u) throw new Error(`unknown subdivision ${sid}`);
  const set = new Set(file.G[sid] || []);
  const f = file.geo.features.find(x => x.properties.id === sid);
  const [w, s, e, n] = u.bbox;
  const r = await cellsSeries([w - 0.6, s - 0.6, e + 0.6, n + 0.6], (la, lo, g) => set.has(g));
  return { ...r, kind: 'sub', geom: f ? f.geometry : null, bbox: u.bbox, areaHa: u.km2 * 100, raw: null, unit: u };
}

// ------------------------------------------------------------ world layer (1-degree)
const yearCache = new Map();
export function globeYear(y) {
  if (!yearCache.has(y)) yearCache.set(y, getJSON(`globe/${y}.json`).then(j => {
    const out = {};
    for (const [label, flat] of Object.entries(j.months)) out[label] = Int32Array.from(flat);
    return out;
  }).catch(() => ({})));
  return yearCache.get(y);
}

// ------------------------------------------------------------ place search (OpenStreetMap Nominatim)
// Usage policy: max 1 request/s, no autocomplete; we query only on explicit search. Attribution: © OpenStreetMap contributors.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
let lastNominatim = 0;
async function nominatim(params) {
  const wait = 1100 - (Date.now() - lastNominatim);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastNominatim = Date.now();
  const u = new URL(NOMINATIM);
  Object.entries({ format: 'jsonv2', polygon_geojson: 1, ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Nominatim HTTP ${r.status}`);
  return r.json();
}
export async function searchPlaces(q, lang) {
  const res = await nominatim({ q, limit: 8, polygon_threshold: 0.003, 'accept-language': lang === 'es' ? 'es,en' : 'en,es' });
  return res.map(p => ({
    name: p.name || p.display_name.split(',')[0],
    full: p.display_name,
    type: p.addresstype || p.type,
    lat: Number(p.lat), lon: Number(p.lon),
    bbox: p.boundingbox ? [Number(p.boundingbox[2]), Number(p.boundingbox[0]), Number(p.boundingbox[3]), Number(p.boundingbox[1])] : null,
    geom: p.geojson && (p.geojson.type === 'Polygon' || p.geojson.type === 'MultiPolygon') ? p.geojson : null,
  }));
}
const boundaryCache = new Map();
export function countryBoundary(name) {
  if (!boundaryCache.has(name)) boundaryCache.set(name, nominatim({ country: name, featureType: 'country', limit: 1, polygon_threshold: 0.02 })
    .then(r => (r[0] && r[0].geojson && /Polygon/.test(r[0].geojson.type) ? r[0].geojson : null)).catch(() => null));
  return boundaryCache.get(name);
}

// ------------------------------------------------------------ burned area (MODIS MCD64A1, Planetary Computer)
// Burned hectares = (burned 500 m pixels / valid pixels inside the shape) x geodesic area of the shape.
// The statistics service shrinks any request wider than max_size pixels by reading image overviews, and the
// overviews of a burn mask inflate the burned share (Brazil, September 2024: 6% of the country instead of 1.3%).
// So the shape is cut into boxes small enough to be read at full resolution, every box is sent to each MODIS
// tile it touches, and each box contributes its own burned share times its own area.
const PC = 'https://planetarycomputer.microsoft.com/api';
const TILE_M = 1111950.5197, R_SIN = 6371007.181, RAD = Math.PI / 180;
function modisTile(lon, lat) {
  const x = R_SIN * lon * RAD * Math.cos(lat * RAD), y = R_SIN * lat * RAD;
  const h = Math.max(0, Math.min(35, Math.floor((x + 18 * TILE_M) / TILE_M))), v = Math.max(0, Math.min(17, Math.floor((9 * TILE_M - y) / TILE_M)));
  return `h${String(h).padStart(2, '0')}v${String(v).padStart(2, '0')}`;
}
// Sutherland-Hodgman clip of a closed ring against a longitude / latitude box.
function clipRing(ring, w, s, e, n) {
  let pts = ring.slice(0, -1);
  for (const [ax, val, sg] of [[0, w, 1], [0, e, -1], [1, s, 1], [1, n, -1]]) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      const in1 = sg * (p1[ax] - val) >= 0, in2 = sg * (p2[ax] - val) >= 0;
      if (in1) out.push(p1);
      if (in1 !== in2) { const t = (val - p1[ax]) / (p2[ax] - p1[ax]); out.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t]); }
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  pts.push(pts[0]);
  return pts;
}
function clipGeom(geom, w, s, e, n) {
  const polys = [];
  for (const poly of polygonsOf(geom)) {
    const outer = clipRing(poly[0], w, s, e, n);
    if (!outer) continue;
    polys.push([outer, ...poly.slice(1).map(h => clipRing(h, w, s, e, n)).filter(Boolean)]);
  }
  return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null;
}
const baCache = new Map();
export function burnedArea(aoiId, geom, areaHa, t) {
  const key = `${aoiId}|${t}`;
  if (baCache.has(key)) return baCache.get(key);
  const p = (async () => {
    const y = yearOf(t), m = monthOf(t) + 1;
    const start = `${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`;
    const end = `${y}-${String(m).padStart(2, '0')}-27T23:59:59Z`;
    const [w, s, e, n] = geomBBox(geom);
    // Boxes of 6 degrees (3 at high latitudes, where the sinusoidal grid is sheared) are read without downsampling.
    const size = Math.max(Math.abs(s), Math.abs(n)) > 50 ? 3 : 6;
    const nx = Math.max(1, Math.ceil((e - w) / size)), ny = Math.max(1, Math.ceil((n - s) / size));
    const jobs = [], boxes = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const bw = w + ((e - w) * i) / nx, be = w + ((e - w) * (i + 1)) / nx, bs = s + ((n - s) * j) / ny, bn = s + ((n - s) * (j + 1)) / ny;
      const part = nx * ny === 1 ? geom : clipGeom(geom, bw, bs, be, bn);
      if (!part) continue;
      const box = { ha: nx * ny === 1 ? areaHa : geomAreaHa(part), burned: 0, valid: 0 };
      boxes.push(box);
      const tiles = new Set();
      for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) tiles.add(modisTile(bw + ((be - bw) * a) / 4, bs + ((bn - bs) * b) / 4));
      for (const tile of tiles) jobs.push({ tile, part, box });
    }
    if (jobs.length > 150) return { status: 'toolarge' };
    const sr = await fetch(`${PC}/stac/v1/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: ['modis-64A1-061'], bbox: [w, s, e, n], datetime: `${start}/${end}`, limit: 250 }),
    }).then(r => r.json());
    const items = new Map(); // tile -> newest item id
    for (const f of sr.features || []) { const tile = (f.id.match(/h\d\dv\d\d/) || [])[0]; if (tile && (!items.has(tile) || f.id > items.get(tile))) items.set(tile, f.id); }
    if (!items.size) return { status: 'unavailable' };
    const todo = jobs.filter(j => items.has(j.tile));
    let okCount = 0, next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const { tile, part, box } = todo[next++];
        const res = await fetch(`${PC}/data/v1/item/statistics?collection=modis-64A1-061&item=${encodeURIComponent(items.get(tile))}&assets=Burn_Date&histogram_range=1,367&histogram_bins=1&max_size=2400`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'Feature', properties: {}, geometry: part }),
        }).then(r => (r.ok ? r.json() : null)).catch(() => null);
        const st = res && res.properties && res.properties.statistics && Object.values(res.properties.statistics)[0];
        if (!st) continue;
        okCount++;
        box.burned += (st.histogram && st.histogram[0] && st.histogram[0][0]) || 0;
        box.valid += st.valid_pixels || 0;
      }
    };
    await Promise.all(Array.from({ length: Math.min(12, todo.length) }, worker));
    if (!okCount) return { status: 'unavailable' };
    let ha = 0;
    for (const b of boxes) if (b.valid > 0) ha += (b.burned / b.valid) * b.ha;
    return { status: 'ok', ha, fraction: areaHa > 0 ? Math.min(1, ha / areaHa) : 0, tiles: items.size, requests: todo.length };
  })().catch(() => ({ status: 'error' }));
  baCache.set(key, p);
  return p;
}
