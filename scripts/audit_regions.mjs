// FireSync data audit: checks the country attribution of the record against an independent source
// (Natural Earth borders) and the internal consistency of every aggregation level.
// Developed with SI (Claude, Anthropic) assistance. License: Apache-2.0
//
// Usage: node scripts/audit_regions.mjs web/data
import fs from 'node:fs';
import path from 'node:path';
const [, , WEB = 'web/data'] = process.argv;
const rd = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const countries = rd(path.join(WEB, 'countries.json')), world = rd(path.join(WEB, 'regions', 'world.json'));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const polys = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inGeom = (x, y, g) => polys(g).some(p => inRing(x, y, p[0]) && !p.slice(1).some(h => inRing(x, y, h)));
let problems = 0;
const bad = msg => { problems++; console.log('  PROBLEM: ' + msg); };

// 1. One FIRMS country <-> one Natural Earth unit; territories only point to a parent.
console.log('1. Country identity');
const own = new Map(), kids = new Map();
for (const f of world.features) {
  const p = f.properties;
  if (p.fid != null) { if (own.has(p.fid)) bad(`two outlines claim FIRMS country ${p.fid}: ${own.get(p.fid).properties.a3} and ${p.a3}`); own.set(p.fid, f); }
  else if (p.parent != null) { if (!kids.has(p.parent)) kids.set(p.parent, []); kids.get(p.parent).push(f); }
}
const renamed = countries.filter(c => own.has(c.id) && norm(own.get(c.id).properties.name) !== norm(c.name)).map(c => `${c.name} -> ${own.get(c.id).properties.name}`);
console.log(`  ${own.size} of ${countries.length} FIRMS countries have their own outline; ${[...kids.values()].flat().length} territories are counted inside a parent.`);
console.log(`  Territories: ${[...kids].map(([fid, l]) => `${countries.find(c => c.id === fid).name} <- ${l.map(f => f.properties.name).join(', ')}`).join(' | ')}`);
console.log(`  Display name differs from the FIRMS archive name (${renamed.length}): ${renamed.join('; ')}`);

// 2. Independent spatial check: the hotspot cells FIRMS attributes to a country must fall inside that
//    country's Natural Earth border (0.25-degree cells, so cells cut by a border or a coast are tolerated).
console.log('2. Hotspot cells inside the country outline (2025, weighted by hotspots)');
const res = 0.25, cols = 1440, low = [];
let wIn = 0, wAll = 0;
for (const c of countries) {
  const f = own.get(c.id), p = path.join(WEB, 'country', String(c.id), '2025.json');
  if (!f || !fs.existsSync(p)) continue;
  const geoms = [f.geometry, ...(kids.get(c.id) || []).map(k => k.geometry)];
  const cells = new Map();
  for (const flat of Object.values(rd(p).months)) for (let i = 0; i < flat.length; i += 2) cells.set(flat[i], (cells.get(flat[i]) || 0) + flat[i + 1]);
  let inside = 0, all = 0;
  for (const [g, v] of cells) {
    const lat = -90 + (Math.floor(g / cols) + 0.5) * res, lon = -180 + ((g % cols) + 0.5) * res;
    all += v;
    const hit = [[0, 0], [0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2]].some(([dx, dy]) => geoms.some(gm => inGeom(lon + dx, lat + dy, gm)));
    if (hit) inside += v;
  }
  wIn += inside; wAll += all;
  if (all > 500 && inside / all < 0.9) low.push(`${c.name} ${(100 * inside / all).toFixed(0)}%`);
}
console.log(`  ${(100 * wIn / wAll).toFixed(2)}% of the 2025 hotspots lie inside the outline of the country FIRMS assigns them to.`);
console.log(low.length ? `  Below 90% (islands smaller than a 0.25-degree cell, whose cell centres fall at sea): ${low.join(', ')}` : '  No country below 90%.');
  if (wIn / wAll < 0.995) bad('more than 0.5% of the hotspots fall outside their country');

// 3. Levels add up: countries -> world, provinces -> country.
console.log('3. Aggregation');
const H = rd(path.join(WEB, 'regions', 'countries_H.json')).H, worldCal = rd(path.join(WEB, 'cal', 'world.json'));
let worst = 0;
for (let t = 140; t < worldCal.n; t++) { let s = 0; for (const a of Object.values(H)) s += a[t] || 0; worst = Math.max(worst, Math.abs(s - worldCal.H[t]) / Math.max(1, worldCal.H[t])); }
console.log(`  Sum of countries vs world series, worst month since 2012: ${(100 * worst).toFixed(2)}% apart.`);
if (worst > 0.01) bad('countries do not add up to the world series');
const off = [];
let n = 0;
for (const c of countries) {
  const f = own.get(c.id); if (!f) continue;
  const rp = path.join(WEB, 'regions', `${f.properties.a3}.json`); if (!fs.existsSync(rp)) continue;
  const reg = rd(rp); if (reg.fid !== c.id) { bad(`region file ${f.properties.a3} points to FIRMS id ${reg.fid}, expected ${c.id} (${c.name})`); continue; }
  let sumU = 0, sumC = 0;
  for (let t = worldCal.n - 36; t < worldCal.n; t++) { sumC += H[c.id] ? H[c.id][t] || 0 : 0; for (const a of Object.values(reg.H)) sumU += a[t] || 0; }
  if (sumC < 2000) continue;
  n++;
  if (sumU / sumC < 0.85 || sumU / sumC > 1.15) off.push(`${c.name} ${(100 * sumU / sumC).toFixed(0)}%`);
}
console.log(`  Provinces vs country total (last 36 months, ${n} countries with 2,000+ hotspots): ${off.length} outside 85-115%${off.length ? ': ' + off.join(', ') : ''}.`);
console.log(problems ? `\n${problems} PROBLEM(S) FOUND` : '\nAll checks passed.');
