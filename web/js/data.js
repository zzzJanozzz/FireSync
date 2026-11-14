// FireSync data access: static harmonized products (pipeline/FireSync.cs), place search (OpenStreetMap
// Nominatim) and burned area (MODIS MCD64A1 via Microsoft Planetary Computer).
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import { haversineKm, isRecon, monthOf, yearOf, T_AQUA, T_SNPP } from './util.js';

const BASE = 'data/';
const cache = new Map();
function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(BASE + path).then(r => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.json();
    }).catch(e => { cache.delete(path); throw e; }));
  }
  return cache.get(path);
}

export const getMeta = () => getJSON('meta.json');
export const getCountries = () => getJSON('countries.json');
export const getFactors = () => getJSON('factors.json');
export const getValidation = () => getJSON('validation.json');

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
export function outlineRings(geom, alt = 0.004) {
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
      if (!inside(clat, clon)) continue;
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
const PC = 'https://planetarycomputer.microsoft.com/api';
const baCache = new Map();
export function burnedArea(aoiId, geom, areaHa, t) {
  const key = `${aoiId}|${t}`;
  if (baCache.has(key)) return baCache.get(key);
  const p = (async () => {
    const y = yearOf(t), m = monthOf(t) + 1;
    const start = `${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`;
    const end = `${y}-${String(m).padStart(2, '0')}-27T23:59:59Z`;
    const bbox = geomBBox(geom);
    const sr = await fetch(`${PC}/stac/v1/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: ['modis-64A1-061'], bbox, datetime: `${start}/${end}`, limit: 60 }),
    }).then(r => r.json());
    const items = (sr.features || []).map(f => f.id);
    if (!items.length) return { status: 'unavailable' };
    const feature = { type: 'Feature', properties: {}, geometry: geom };
    let burned = 0, valid = 0;
    const results = await Promise.all(items.map(id => fetch(`${PC}/data/v1/item/statistics?collection=modis-64A1-061&item=${encodeURIComponent(id)}&assets=Burn_Date&histogram_range=1,367&histogram_bins=1&max_size=1024`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feature),
    }).then(r => (r.ok ? r.json() : null)).catch(() => null)));
    for (const res of results) {
      const st = res && res.properties && res.properties.statistics && Object.values(res.properties.statistics)[0];
      if (!st) continue;
      burned += (st.histogram && st.histogram[0] && st.histogram[0][0]) || 0;
      valid += st.valid_pixels || 0;
    }
    if (!valid) return { status: 'unavailable' };
    return { status: 'ok', ha: (burned / valid) * areaHa, fraction: burned / valid, tiles: items.length };
  })().catch(() => ({ status: 'error' }));
  baCache.set(key, p);
  return p;
}
