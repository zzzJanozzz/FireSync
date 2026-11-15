// FireSync 2D map: a flat (equirectangular) view of the same record, drawn on one canvas. It shares the
// region layer, the hit-testing and the camera framing with the 3D globe, and only redraws when something
// changes, so it is the light option for slow machines and phones.
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import { fire } from './util.js';
import { featPath, pickFeature } from './regions.js';

const BASE = 'assets/tex/earth-blue-marble.webp';
const LEVELS = 14;
const COLORS = Array.from({ length: LEVELS }, (_, i) => fire(i / (LEVELS - 1)));
const STROKE = { context: ['rgba(236,232,223,0.22)', 0.7], country: ['rgba(236,232,223,0.5)', 0.9], unit: ['rgba(236,232,223,0.72)', 1], sub: ['rgba(236,232,223,0.55)', 0.8] };

// Cells grouped by colour level so each level is one fill call: {res, levels: [Float32Array of lon0, lat0 ...]}
function bucket(cells, res, vmax) {
  const lmax = Math.log10(1 + Math.max(1, vmax)), tmp = Array.from({ length: LEVELS }, () => []);
  for (const c of cells) {
    const x = Math.log10(1 + c.v) / lmax;
    tmp[Math.max(0, Math.min(LEVELS - 1, Math.round(x * (LEVELS - 1))))].push(c.lng - res / 2, c.lat - res / 2);
  }
  return { res, levels: tmp.map(a => Float32Array.from(a)) };
}

export function createMap2D(el, { onHover, onClick } = {}) {
  const cv = document.createElement('canvas');
  cv.className = 'map2d-canvas';
  el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => invalidate();
  img.src = BASE;

  let W = 1, H = 1, dpr = 1;
  const view = { lon: -45, lat: -8, s: 2 }; // centre and scale in CSS pixels per degree
  let feats = [], byKind = { context: [], country: [], unit: [], sub: [] }, fillFn = null, hover = null;
  let ctxCells = null, focusCells = null, outline = [], ghost = null, anchor = null, anim = 0, dirty = false;

  const minScale = () => Math.max(W / 360, H / 180) * 0.999;
  const fitScale = () => Math.max(W / 360, H / 180);
  function clamp() {
    view.s = Math.max(minScale(), Math.min(260, view.s));
    const hw = W / 2 / view.s, hh = H / 2 / view.s;
    view.lon = hw >= 180 ? 0 : Math.max(-180 + hw, Math.min(180 - hw, view.lon));
    view.lat = hh >= 90 ? 0 : Math.max(-90 + hh, Math.min(90 - hh, view.lat));
  }
  const toLL = (x, y) => ({ lng: view.lon + (x - W / 2) / view.s, lat: view.lat - (y - H / 2) / view.s });
  function invalidate() { if (dirty) return; dirty = true; requestAnimationFrame(draw); }

  function draw() {
    dirty = false;
    if (el.hidden || W < 2) return;
    const s = view.s * dpr, tx = (W / 2 - view.lon * view.s) * dpr, ty = (H / 2 + view.lat * view.s) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (img.complete && img.naturalWidth) {
      ctx.globalAlpha = 0.78;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, tx - 180 * s, ty - 90 * s, 360 * s, 180 * s);
      ctx.globalAlpha = 1;
    }
    ctx.setTransform(s, 0, 0, -s, tx, ty); // from here on the canvas is addressed in longitude / latitude
    const lw = px => (px * dpr) / s;
    if (fillFn) for (const k of ['country', 'unit', 'sub']) for (const f of byKind[k]) {
      const c = fillFn(f);
      if (c) { ctx.fillStyle = c; ctx.fill(featPath(f), 'evenodd'); }
    }
    for (const layer of [ctxCells, focusCells]) {
      if (!layer) continue;
      const gap = view.s * layer.res > 7 ? layer.res * 0.06 : 0, size = layer.res - gap;
      ctx.globalAlpha = 0.9;
      layer.levels.forEach((a, i) => {
        if (!a.length) return;
        ctx.fillStyle = COLORS[i];
        ctx.beginPath();
        for (let j = 0; j < a.length; j += 2) ctx.rect(a[j] + gap / 2, a[j + 1] + gap / 2, size, size);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    ctx.lineJoin = 'round';
    for (const k of ['context', 'country', 'unit', 'sub']) {
      if (!byKind[k].length) continue;
      ctx.strokeStyle = STROKE[k][0]; ctx.lineWidth = lw(STROKE[k][1]);
      for (const f of byKind[k]) ctx.stroke(featPath(f));
    }
    if (outline.length) {
      ctx.beginPath();
      for (const r of outline) { if (r.length < 2) continue; ctx.moveTo(r[0][1], r[0][0]); for (let i = 1; i < r.length; i++) ctx.lineTo(r[i][1], r[i][0]); }
      ctx.strokeStyle = 'rgba(5,5,5,0.7)'; ctx.lineWidth = lw(5); ctx.stroke();
      ctx.shadowColor = '#ffd666'; ctx.shadowBlur = 12 * dpr;                     // glow
      ctx.strokeStyle = '#fffbe6'; ctx.lineWidth = lw(2.6); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (hover) {
      const p = featPath(hover);
      ctx.fillStyle = 'rgba(255,247,194,0.16)'; ctx.fill(p, 'evenodd');
      ctx.strokeStyle = '#fff7c2'; ctx.lineWidth = lw(1.6); ctx.stroke(p);
    }
    if (ghost) {
      ctx.beginPath();
      ctx.moveTo(ghost[0][1], ghost[0][0]);
      for (let i = 1; i < ghost.length; i++) ctx.lineTo(ghost[i][1], ghost[i][0]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(251,191,36,0.10)'; ctx.fill();
      ctx.setLineDash([lw(6), lw(4)]);
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = lw(1.6); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    const first = W < 2;
    W = w; H = h; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    if (first) { if (anchor) fit(anchor.bbox, anchor.opts, 0); else { view.s = fitScale(); view.lon = -45; view.lat = -8; } }
    clamp();
    invalidate();
  }
  new ResizeObserver(resize).observe(el);

  function animateTo(lon, lat, s, ms) {
    cancelAnimationFrame(anim);
    if (!ms) { view.lon = lon; view.lat = lat; view.s = s; clamp(); invalidate(); return; }
    const a = { ...view }, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      view.lon = a.lon + (lon - a.lon) * e; view.lat = a.lat + (lat - a.lat) * e;
      view.s = Math.exp(Math.log(a.s) + (Math.log(s) - Math.log(a.s)) * e);
      clamp(); invalidate();
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function fit(bbox, { pad = 1.3 } = {}, ms = 700) {
    const [w, s, e, n] = bbox, sx = Math.max(0.2, e - w) * pad, sy = Math.max(0.2, n - s) * pad;
    animateTo((w + e) / 2, (s + n) / 2, Math.max(minScale(), Math.min(200, W / sx, H / sy)), ms);
  }

  // ---------------------------------------------------------- pointer: pan, zoom, pinch, hover, click
  const ptrs = new Map();
  let down = null, pinch = null, hraf = 0, hpend = null;
  const local = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function zoomAt(x, y, factor) {
    const before = toLL(x, y);
    view.s *= factor; clamp();
    const after = toLL(x, y);
    view.lon += before.lng - after.lng; view.lat += before.lat - after.lat;
    clamp(); invalidate();
  }
  cv.addEventListener('wheel', e => { e.preventDefault(); cancelAnimationFrame(anim); const p = local(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0016)); }, { passive: false });
  cv.addEventListener('dblclick', e => { const p = local(e); zoomAt(p.x, p.y, 1.8); });
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    cancelAnimationFrame(anim);
    ptrs.set(e.pointerId, local(e));
    if (ptrs.size === 1) down = { ...local(e), t: performance.now(), moved: false };
    else { down = null; const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
  });
  cv.addEventListener('pointermove', e => {
    const p = local(e);
    if (ptrs.has(e.pointerId)) {
      const prev = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, p);
      if (ptrs.size === 1) {
        if (down && Math.hypot(p.x - down.x, p.y - down.y) > 5) down.moved = true;
        view.lon -= (p.x - prev.x) / view.s; view.lat += (p.y - prev.y) / view.s;
        clamp(); invalidate();
      } else if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.d > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d);
        pinch.d = d;
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    hpend = p;
    if (hraf) return;
    hraf = requestAnimationFrame(() => {
      hraf = 0;
      const c = toLL(hpend.x, hpend.y), inside = Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180;
      const f = inside ? pickFeature(feats, c.lat, c.lng) : null;
      if (f !== hover) { hover = f; cv.style.cursor = f ? 'pointer' : ''; invalidate(); }
      if (onHover) onHover(f, inside ? c : null);
    });
  });
  const release = e => {
    const p = local(e), d = down;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    down = null;
    if (!d || e.type !== 'pointerup' || d.moved || performance.now() - d.t > 700) return;
    const c = toLL(p.x, p.y);
    if (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) return;
    if (onClick) onClick(pickFeature(feats, c.lat, c.lng), c);
  };
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);
  cv.addEventListener('pointerleave', () => { if (hover) { hover = null; invalidate(); } if (onHover) onHover(null, null); });

  return {
    setContext(flat, instant) {
      if (!flat || !flat.length) { ctxCells = null; invalidate(); return 0; }
      const cells = [];
      let vmax = 1;
      for (let i = 0; i < flat.length; i += 2) {
        const idx = flat[i], v = flat[i + 1];
        if (v > vmax) vmax = v;
        cells.push({ lat: Math.floor(idx / 360) - 90 + 0.5, lng: (idx % 360) - 180 + 0.5, v });
      }
      ctxCells = bucket(cells, 1, vmax);
      invalidate();
      return vmax;
    },
    hideContext() { ctxCells = null; invalidate(); },
    setFocus(data) {
      if (!data || !data.length) { focusCells = null; invalidate(); return 0; }
      let vmax = 1;
      for (const d of data) if (d.v > vmax) vmax = d.v;
      focusCells = bucket(data, 0.25, vmax);
      invalidate();
      return vmax;
    },
    clearFocus() { focusCells = null; invalidate(); },
    setOutline(rings) { outline = rings || []; invalidate(); },
    focusBBox(bbox, opts = {}) { anchor = { bbox, opts }; fit(bbox, opts, opts.ms === 0 ? 0 : 700); },
    home(ms = 700) { anchor = null; animateTo(-45, -8, fitScale(), ms); },
    releaseAnchor() { anchor = null; },
    recenter() { if (anchor) fit(anchor.bbox, anchor.opts, 600); },
    get anchored() { return !!anchor; },
    zoomBy(f) { zoomAt(W / 2, H / 2, 1 / f); },
    setRegions(list) {
      feats = list || [];
      byKind = { context: [], country: [], unit: [], sub: [] };
      for (const f of feats) (byKind[f.kind] || byKind.context).push(f);
      if (hover && !feats.includes(hover)) hover = null;
      invalidate();
    },
    styleRegions({ fill }) { fillFn = fill || null; invalidate(); },
    setGhost(ring) { ghost = ring && ring.length ? ring : null; invalidate(); },
    setActive(on) { if (on) { resize(); invalidate(); } },
    kmPerPx() { return 111.32 / view.s; },
  };
}
