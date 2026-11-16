// FireSync region helpers shared by the 3D globe and the 2D map: bounding boxes, hit-testing on the CPU
// (no GPU ray-casting against thousands of meshes), canvas paths and camera framing.
// Developed with SI (Claude, Anthropic) assistance. License: Apache-2.0
import { pointInGeom } from './data.js';

export const polysOf = g => (!g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);

// [west, south, east, north] of a feature, cached on the feature.
export function featBBox(f) {
  if (f._bb) return f._bb;
  let w = 180, s = 90, e = -180, n = -90;
  for (const poly of polysOf(f.geometry)) for (const [x, y] of poly[0]) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
  return (f._bb = [w, s, e, n]);
}
export function unionBBox(feats) {
  let w = 180, s = 90, e = -180, n = -90;
  for (const f of feats) { const b = featBBox(f); if (b[0] < w) w = b[0]; if (b[1] < s) s = b[1]; if (b[2] > e) e = b[2]; if (b[3] > n) n = b[3]; }
  return feats.length ? [w, s, e, n] : null;
}

// Canvas path of a feature in longitude / latitude units (the views set the transform), cached on the feature.
export function featPath(f) {
  if (f._path) return f._path;
  const p = new Path2D();
  for (const poly of polysOf(f.geometry)) for (const ring of poly) {
    if (ring.length < 3) continue;
    p.moveTo(ring[0][0], ring[0][1]);
    for (let i = 1; i < ring.length; i++) p.lineTo(ring[i][0], ring[i][1]);
    p.closePath();
  }
  return (f._path = p);
}

// Topmost feature under a point. Features are listed from the coarsest level to the finest, so the last hit wins.
export function pickFeature(feats, lat, lng) {
  for (let i = feats.length - 1; i >= 0; i--) {
    const f = feats[i], b = featBBox(f);
    if (lng < b[0] || lng > b[2] || lat < b[1] || lat > b[3]) continue;
    if (pointInGeom(lng, lat, f.geometry)) return f;
  }
  return null;
}

// Bounding box of the polygons that hold `frac` of the area: frames the mainland and ignores far islands
// and overseas territories (Alaska and Hawaii for the United States, French Guiana for France).
export function mainBBox(geom, frac = 0.75) {
  const parts = [];
  for (const poly of polysOf(geom)) {
    const r = poly[0];
    let a = 0, w = 180, s = 90, e = -180, n = -90;
    for (let i = 0; i < r.length - 1; i++) {
      a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
      const x = r[i][0], y = r[i][1];
      if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y;
    }
    parts.push({ a: Math.abs(a / 2) * Math.cos(((s + n) / 2) * Math.PI / 180), bb: [w, s, e, n] });
  }
  if (!parts.length) return null;
  parts.sort((x, y) => y.a - x.a);
  const total = parts.reduce((t, p) => t + p.a, 0);
  let acc = 0;
  const bb = [180, 90, -180, -90];
  for (const p of parts) {
    if (p.bb[0] < bb[0]) bb[0] = p.bb[0]; if (p.bb[1] < bb[1]) bb[1] = p.bb[1];
    if (p.bb[2] > bb[2]) bb[2] = p.bb[2]; if (p.bb[3] > bb[3]) bb[3] = p.bb[3];
    acc += p.a;
    if (acc >= total * frac) break;
  }
  return bb;
}

// Camera altitude (in globe radii) that frames a bounding box in a viewport of the given aspect ratio.
// Vertical field of view of the globe camera: 50 degrees.
export function altitudeFor(bbox, aspect, { pad = 1.3, minAlt = 0.14, maxAlt = 2.4 } = {}) {
  const rad = Math.PI / 180, [w, s, e, n] = bbox;
  const hv = Math.min(1.45, Math.max(0.002, ((n - s) / 2) * rad));
  const hh = Math.min(1.45, Math.max(0.002, ((e - w) / 2) * Math.cos(((s + n) / 2) * rad) * rad));
  const tv = Math.tan(25 * rad), th = tv * Math.max(0.3, aspect);
  const need = (phi, t) => Math.sin(phi) / t + Math.cos(phi) - 1;
  return Math.max(minAlt, Math.min(maxAlt, Math.max(need(hv, tv), need(hh, th)) * pad));
}
