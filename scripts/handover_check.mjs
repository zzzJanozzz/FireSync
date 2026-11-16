// FireSync hand-over check on untouched data. Suomi NPP left FIRMS on 2 November 2026 and NOAA-20 now
// carries the record. The NOAA-20 -> Suomi NPP factors were fitted on 2018-2025. October 2026 is the one
// full month in which both satellites are in the 2026 record, and it was never used in the fit, so it is
// an out-of-sample test: NOAA-20 x factor should reproduce what Suomi NPP saw, country by country.
// Developed with SI (Claude, Anthropic) assistance. License: Apache-2.0
//
// Usage: node scripts/handover_check.mjs web/data
import fs from 'node:fs';
import path from 'node:path';

const [, , WEB = 'web/data'] = process.argv;
const rd = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const T = (2026 - 2000) * 12 + 9 - 10; // October 2026 (t = 0 is November 2000)
const MIN = 20;

const factors = rd(path.join(WEB, 'factors.json')).global.noaa20; // [day, night]
const f = (factors[0] + factors[1]) / 2; // monthly country totals are not split by day / night
const rows = [];
for (const c of rd(path.join(WEB, 'countries.json'))) {
  const p = path.join(WEB, 'cal', `${c.id}.json`);
  if (!fs.existsSync(p)) continue;
  const cal = rd(p);
  if (!cal.S || !cal.N) continue;
  const obs = cal.S[T] || 0, n20 = cal.N[T] || 0;
  if (obs >= MIN && n20 > 0) rows.push({ id: c.id, name: c.name, obs, pred: n20 * f });
}
const ape = rows.map(r => Math.abs(r.pred - r.obs) / r.obs).sort((a, b) => a - b);
const q = x => ape[Math.min(ape.length - 1, Math.floor(ape.length * x))];
const sumObs = rows.reduce((a, r) => a + r.obs, 0), sumPred = rows.reduce((a, r) => a + r.pred, 0);
const out = {
  month: '2026-10', fitted: '2018-2025', minObs: MIN, factor: Number(f.toFixed(3)), factorsDayNight: factors,
  pairs: rows.length, mdape: Number(q(0.5).toFixed(4)), p75: Number(q(0.75).toFixed(4)),
  bias: Number((sumPred / sumObs - 1).toFixed(4)),
  within10: Number((ape.filter(x => x <= 0.1).length / ape.length).toFixed(4)),
  within20: Number((ape.filter(x => x <= 0.2).length / ape.length).toFixed(4)),
  observed: Math.round(sumObs), predicted: Math.round(sumPred),
  points: rows.sort((a, b) => b.obs - a.obs).slice(0, 60).map(r => [r.name, Math.round(r.obs), Math.round(r.pred)]),
};
fs.writeFileSync(path.join(WEB, 'handover.json'), JSON.stringify(out));
console.log(`October 2026, ${out.pairs} countries: median abs. error ${(out.mdape * 100).toFixed(1)}%, total bias ${(out.bias * 100).toFixed(1)}%, within 10%: ${(out.within10 * 100).toFixed(0)}%, within 20%: ${(out.within20 * 100).toFixed(0)}%`);
