// FireSync 3D globe: NASA Blue Marble imagery, relief, specular oceans, moving clouds, atmosphere,
// GPU-instanced hotspot columns that animate between months, and a region layer (country, province /
// state and department borders plus a monthly choropleth) that costs a handful of draw calls:
// borders are merged line meshes, fills are canvas textures on sphere patches, and hover / click are
// resolved on the CPU with a ray-sphere test and point-in-polygon instead of GPU ray-casting.
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/+esm';
import Globe from 'https://cdn.jsdelivr.net/npm/globe.gl@2.34.2/+esm';
import { fire } from './util.js';
import { featBBox, featPath, pickFeature, unionBBox, polysOf, altitudeFor } from './regions.js';

// NASA Blue Marble, relief, water mask, star field and clouds from the three-globe / globe.gl examples (MIT),
// re-encoded as WebP and served from our own domain: 8.2 MB -> 1.3 MB, and no third-party CDN for imagery.
const TEX = 'assets/tex/';
const CLOUDS = TEX + 'clouds.webp';
const UP = new THREE.Vector3(0, 1, 0);
const D2R = Math.PI / 180;
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// One instanced mesh of hexagonal columns. Values ease toward their targets every frame.
class Columns {
  constructor(globe, capacity, { maxAlt, opacity = 1 }) {
    this.globe = globe;
    this.R = globe.getGlobeRadius();
    this.maxAlt = maxAlt;
    const geo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: opacity < 1, opacity });
    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    globe.scene().add(this.mesh);
    this.capacity = capacity;
    this.items = new Map(); // key -> {pos, quat, rad, cur, target, color}
    this.dirty = false;
    this._m = new THREE.Matrix4(); this._s = new THREE.Vector3();
  }
  // data: [{key, lat, lng, v}], radDeg: cell half-size in degrees, vmax: value mapped to full height
  set(data, radDeg, vmax, instant = false) {
    const lmax = Math.log10(1 + Math.max(1, vmax));
    const seen = new Set();
    for (const d of data) {
      seen.add(d.key);
      let it = this.items.get(d.key);
      if (!it) {
        const c = this.globe.getCoords(d.lat, d.lng, 0);
        const pos = new THREE.Vector3(c.x, c.y, c.z);
        const quat = new THREE.Quaternion().setFromUnitVectors(UP, pos.clone().normalize());
        it = { pos, quat, cur: 0, target: 0, color: new THREE.Color(), rad: 0 };
        this.items.set(d.key, it);
      }
      const x = Math.log10(1 + d.v) / lmax;
      it.target = 0.0012 + this.maxAlt * Math.pow(x, 2.2);
      it.rad = radDeg * (0.55 + 0.45 * x) * Math.PI / 180 * this.R;
      it.color.set(fire(x));
      if (instant) it.cur = it.target;
    }
    for (const [k, it] of this.items) if (!seen.has(k)) { it.target = 0; if (instant) this.items.delete(k); }
    this.dirty = true;
  }
  clear() { for (const it of this.items.values()) it.target = 0; this.dirty = true; }
  tick() {
    if (!this.dirty) return;
    let i = 0, moving = false;
    for (const [k, it] of this.items) {
      const d = it.target - it.cur;
      if (Math.abs(d) > 1e-5) { it.cur += d * 0.2; moving = true; } else it.cur = it.target;
      if (it.cur <= 1e-4 && it.target === 0) { this.items.delete(k); continue; }
      if (i >= this.capacity) continue;
      this._s.set(it.rad, it.cur * this.R, it.rad);
      this._m.compose(it.pos, it.quat, this._s);
      this.mesh.setMatrixAt(i, this._m);
      this.mesh.setColorAt(i, it.color);
      i++;
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.dirty = moving;
  }
}

// ------------------------------------------------------------ region layer
// Unit-sphere direction of a latitude / longitude, in three-globe's convention (checked against getCoords at start-up).
function makeXYZ(globe) {
  const fast = (lat, lng, out, o) => {
    const phi = (90 - lat) * D2R, th = (90 - lng) * D2R, sp = Math.sin(phi);
    out[o] = sp * Math.cos(th); out[o + 1] = Math.cos(phi); out[o + 2] = sp * Math.sin(th);
  };
  const R = globe.getGlobeRadius(), c = globe.getCoords(37, -58, 0), t = [0, 0, 0];
  fast(37, -58, t, 0);
  if (Math.abs(t[0] * R - c.x) + Math.abs(t[1] * R - c.y) + Math.abs(t[2] * R - c.z) < 1e-3) return fast;
  return (lat, lng, out, o) => { const p = globe.getCoords(lat, lng, 0); out[o] = p.x / R; out[o + 1] = p.y / R; out[o + 2] = p.z / R; };
}

// Border of a feature as line segments on the unit sphere (cached). Long edges are subdivided so they follow
// the curvature; edges that only exist because a polygon was cut at the antimeridian are skipped.
function featSegs(f, xyz) {
  if (f._seg) return f._seg;
  const ll = [];
  for (const poly of polysOf(f.geometry)) for (const ring of poly) {
    for (let i = 0; i < ring.length - 1; i++) {
      const x1 = ring[i][0], y1 = ring[i][1], x2 = ring[i + 1][0], y2 = ring[i + 1][1];
      if (Math.abs(x1) > 179.98 && Math.abs(x2) > 179.98) continue;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 1.5));
      for (let k = 0; k < n; k++) ll.push(x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, x1 + ((x2 - x1) * (k + 1)) / n, y1 + ((y2 - y1) * (k + 1)) / n);
    }
  }
  const out = new Float32Array((ll.length / 2) * 3);
  for (let i = 0, o = 0; i < ll.length; i += 2, o += 3) xyz(ll[i + 1], ll[i], out, o);
  return (f._seg = out);
}

// Every border of one level in a single draw call.
class Lines {
  constructor(scene, R, alt, color, opacity, order, loop = false) {
    this.mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    this.obj = loop ? new THREE.LineLoop(new THREE.BufferGeometry(), this.mat) : new THREE.LineSegments(new THREE.BufferGeometry(), this.mat);
    this.obj.scale.setScalar(R * (1 + alt));
    this.obj.frustumCulled = false; this.obj.renderOrder = order; this.obj.visible = false;
    scene.add(this.obj);
  }
  set(arrays) {
    let total = 0;
    for (const a of arrays) total += a.length;
    this.obj.geometry.dispose();
    const geo = new THREE.BufferGeometry();
    if (total) {
      const pos = new Float32Array(total);
      let o = 0;
      for (const a of arrays) { pos.set(a, o); o += a.length; }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    }
    this.obj.geometry = geo;
    this.obj.visible = total > 0;
  }
}

// Choropleth fill: a canvas drawn in longitude / latitude, mapped on a patch of the sphere. One draw call.
class Patch {
  constructor(scene, R, alt, order, xyz, { budget = 4.2e6, maxSide = 4096, fixed = 0 } = {}) {
    this.xyz = xyz; this.budget = budget; this.maxSide = maxSide; this.fixed = fixed;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = fixed || 2;
    this.ctx = this.canvas.getContext('2d');
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.mesh.scale.setScalar(R * (1 + alt));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = order; this.mesh.visible = false;
    scene.add(this.mesh);
    this.bbox = null; this.key = '';
    if (fixed) this.newTexture();
  }
  newTexture() {
    if (this.mat.map) this.mat.map.dispose();
    const tex = new THREE.CanvasTexture(this.canvas);
    tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.mat.map = tex; this.mat.needsUpdate = true;
  }
  setBBox(bbox) {
    const key = bbox.join(',');
    if (key === this.key) return;
    this.key = key; this.bbox = bbox;
    const [w, s, e, n] = bbox, sx = Math.max(0.01, e - w), sy = Math.max(0.01, n - s);
    if (!this.fixed) {
      const k = Math.min(Math.sqrt(this.budget / (sx * sy)), this.maxSide / sx, this.maxSide / sy, 220);
      this.canvas.width = Math.max(32, Math.ceil(sx * k)); this.canvas.height = Math.max(32, Math.ceil(sy * k));
      this.newTexture(); // a resized canvas needs a fresh GPU texture
    }
    const nx = Math.max(2, Math.min(180, Math.ceil(sx / 2))), ny = Math.max(2, Math.min(90, Math.ceil(sy / 2)));
    const pos = new Float32Array((nx + 1) * (ny + 1) * 3), uv = new Float32Array((nx + 1) * (ny + 1) * 2), idx = [];
    for (let j = 0, p = 0, q = 0; j <= ny; j++) for (let i = 0; i <= nx; i++, p += 3, q += 2) {
      this.xyz(n - (sy * j) / ny, w + (sx * i) / nx, pos, p);
      uv[q] = i / nx; uv[q + 1] = 1 - j / ny;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    this.mesh.geometry.dispose();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.mesh.geometry = geo;
  }
  // feats: features to paint; fill: feature -> css colour or null
  draw(feats, fill) {
    if (!feats.length || !fill) { this.mesh.visible = false; return; }
    if (!this.fixed) this.setBBox(unionBBox(feats));
    const { ctx, canvas } = this, [w, s, e, n] = this.bbox;
    const sx = canvas.width / Math.max(0.01, e - w), sy = canvas.height / Math.max(0.01, n - s);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(sx, 0, 0, -sy, -w * sx, n * sy);
    let any = false;
    for (const f of feats) {
      const c = fill(f);
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fill(featPath(f), 'evenodd');
      any = true;
    }
    this.mat.map.needsUpdate = true;
    this.mesh.visible = any;
  }
  hide() { this.mesh.visible = false; }
}

export function createGlobe(el, { onHover, onClick } = {}) {
  const globe = new Globe(el, { animateIn: true, rendererConfig: { antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' } })
    .width(el.clientWidth).height(el.clientHeight)
    .backgroundColor('#050505')
    .globeImageUrl(TEX + 'earth-blue-marble.webp')
    .bumpImageUrl(TEX + 'earth-topology.webp')
    .backgroundImageUrl(TEX + 'night-sky.webp')
    .showAtmosphere(true).atmosphereColor('#8db8e8').atmosphereAltitude(0.17)
    .showGraticules(false)
    .enablePointerInteraction(false) // no GPU ray-casting: hover and click are resolved below
    .pathPoints('pts').pathPointLat(p => p[0]).pathPointLng(p => p[1]).pathPointAlt(p => p[2])
    .pathColor(() => 'rgba(236,232,223,0.95)')
    .pathStroke(1.4).pathDashLength(0.02).pathDashGap(0.01).pathDashAnimateTime(16000)
    .pathTransitionDuration(0)
    .ringLat('lat').ringLng('lng')
    .ringColor(() => t => `rgba(255,${Math.round(150 + 80 * (1 - t))},70,${Math.max(0, 1 - t)})`)
    .ringMaxRadius('maxR').ringPropagationSpeed(1.6).ringRepeatPeriod(1400).ringAltitude(0.003);

  // Retina phones would otherwise render 3x the pixels for no visible gain.
  try { globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, COARSE ? 1.5 : 1.75)); } catch (e) { /* older globe.gl */ }
  const mat = globe.globeMaterial();
  mat.bumpScale = 12;
  new THREE.TextureLoader().load(TEX + 'earth-water.webp', tex => {
    mat.specularMap = tex; mat.specular = new THREE.Color('#5f7894'); mat.shininess = 18; mat.needsUpdate = true;
  });
  setTimeout(() => {
    const lights = globe.lights ? globe.lights() : [];
    const dir = lights.find(l => l.type === 'DirectionalLight');
    if (dir) { dir.position.set(1.2, 0.6, 1.4); dir.intensity = 2.6; }
    const amb = lights.find(l => l.type === 'AmbientLight');
    if (amb) amb.intensity = 0.9;
  });

  const R = globe.getGlobeRadius(), scene = globe.scene(), xyz = makeXYZ(globe);
  let clouds = null, showClouds = true;
  new THREE.TextureLoader().load(CLOUDS, tex => {
    clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.006, 75, 75),
      new THREE.MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false }));
    clouds.visible = showClouds; clouds.renderOrder = 20;
    scene.add(clouds);
  });

  const context = new Columns(globe, 30000, { maxAlt: 0.09 });
  const focus = new Columns(globe, 40000, { maxAlt: 0.06 });

  // ---------------------------------------------------------- regions: borders, fills, hover, pick
  const px = COARSE ? { budget: 1.1e6, maxSide: 2048 } : { budget: 4.2e6, maxSide: 4096 };
  const fills = {
    country: new Patch(scene, R, 0.0012, 1, xyz, { budget: COARSE ? 5e5 : 2.1e6, maxSide: 2048 }),
    unit: new Patch(scene, R, 0.0018, 2, xyz, px),
    sub: new Patch(scene, R, 0.0024, 3, xyz, px),
  };
  const hoverFill = new Patch(scene, R, 0.003, 4, xyz, { fixed: 384 });
  const borders = {
    context: new Lines(scene, R, 0.0026, 0xece8df, 0.2, 5),
    country: new Lines(scene, R, 0.0026, 0xece8df, 0.42, 5),
    unit: new Lines(scene, R, 0.0032, 0xece8df, 0.6, 6),
    sub: new Lines(scene, R, 0.0036, 0xece8df, 0.48, 7),
  };
  const selLines = new Lines(scene, R, 0.0042, 0xfff7c2, 0.9, 8);
  const hoverLines = new Lines(scene, R, 0.0046, 0xfff7c2, 1, 9);
  const ghost = new Lines(scene, R, 0.005, 0xfbbf24, 0.95, 10, true);
  let feats = [], byKind = { context: [], country: [], unit: [], sub: [] }, fillFn = null, hover = null;

  const drawFills = () => { for (const k of ['country', 'unit', 'sub']) fills[k].draw(byKind[k], fillFn); };
  function setHover(f) {
    if (f === hover) return;
    hover = f;
    hoverLines.set(f ? [featSegs(f, xyz)] : []);
    if (f) { hoverFill.setBBox(featBBox(f)); hoverFill.draw([f], () => 'rgba(255,247,194,0.17)'); } else hoverFill.hide();
    el.style.cursor = f ? 'pointer' : '';
  }

  // Latitude / longitude under a screen point: analytic ray-sphere intersection.
  const _o = new THREE.Vector3(), _d = new THREE.Vector3();
  function toLatLng(clientX, clientY) {
    const rect = el.getBoundingClientRect(), cam = globe.camera();
    _o.setFromMatrixPosition(cam.matrixWorld);
    _d.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1, 0.5).unproject(cam).sub(_o).normalize();
    const b = _o.dot(_d), disc = b * b - (_o.dot(_o) - R * R);
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc);
    if (t < 0) return null;
    const g = globe.toGeoCoords({ x: _o.x + _d.x * t, y: _o.y + _d.y * t, z: _o.z + _d.z * t });
    return { lat: g.lat, lng: g.lng };
  }
  let pending = null, raf = 0, down = null, touches = 0;
  el.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    pending = e;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const c = toLatLng(pending.clientX, pending.clientY), f = c ? pickFeature(feats, c.lat, c.lng) : null;
      setHover(f);
      if (onHover) onHover(f, c);
    });
  });
  el.addEventListener('pointerleave', () => { setHover(null); if (onHover) onHover(null, null); });
  el.addEventListener('pointerdown', e => { touches++; down = touches === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; });
  const release = e => {
    touches = Math.max(0, touches - 1);
    const d = down; down = null;
    if (!d || e.type !== 'pointerup' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 700) return;
    const c = toLatLng(e.clientX, e.clientY);
    if (onClick) onClick(c ? pickFeature(feats, c.lat, c.lng) : null, c);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  // ---------------------------------------------------------- animation loop (paused when the globe is not shown)
  let active = true, onScreen = true, running = false;
  function loop() {
    if (!active || !onScreen) { running = false; return; }
    if (clouds && showClouds) clouds.rotation.y -= 0.00009;
    context.tick(); focus.tick();
    requestAnimationFrame(loop);
  }
  function sync() {
    const run = active && onScreen;
    if (run) globe.resumeAnimation(); else globe.pauseAnimation();
    if (run && !running) { running = true; requestAnimationFrame(loop); }
  }
  running = true; requestAnimationFrame(loop);
  new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(el);

  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.enableDamping = true;
  controls.minDistance = 105;
  controls.maxDistance = 900;
  const HOME = { lat: -8, lng: -45, altitude: 2.35 };
  globe.pointOfView(HOME, 0);
  new ResizeObserver(() => { if (el.clientWidth && el.clientHeight) globe.width(el.clientWidth).height(el.clientHeight); }).observe(el);
  window.__fsDebug = () => { const i = globe.renderer().info.render; return { calls: i.calls, tris: i.triangles }; };

  let anchor = null;
  return {
    globe,
    // World context layer (1-degree cells). flat = [cellIndex, value, ...]
    setContext(flat, instant = false) {
      if (!flat || !flat.length) { context.clear(); return 0; }
      const data = [];
      let vmax = 1;
      for (let i = 0; i < flat.length; i += 2) {
        const idx = flat[i], v = flat[i + 1];
        if (v > vmax) vmax = v;
        data.push({ key: idx, lat: Math.floor(idx / 360) - 90 + 0.5, lng: (idx % 360) - 180 + 0.5, v });
      }
      context.set(data, 0.42, vmax, instant);
      return vmax;
    },
    hideContext() { context.clear(); },
    // Focus layer (0.25-degree cells of the selected place): [{key, lat, lng, v}]
    setFocus(data, instant = false, showRings = true) {
      if (!data || !data.length) { focus.clear(); globe.ringsData([]); return 0; }
      let vmax = 1;
      for (const d of data) if (d.v > vmax) vmax = d.v;
      focus.set(data, 0.11, vmax, instant);
      if (showRings) {
        const top = [...data].sort((a, b) => b.v - a.v).slice(0, 4).map(d => ({ lat: d.lat, lng: d.lng, maxR: 1.2 }));
        globe.ringsData(top);
      } else globe.ringsData([]);
      return vmax;
    },
    clearFocus() { focus.clear(); globe.ringsData([]); },
    // Outline of the selected area: every ring as a thin bright line, the longest ones also as animated dashes.
    setOutline(rings) {
      rings = rings || [];
      const arrs = rings.map(r => {
        const out = new Float32Array(Math.max(0, r.length - 1) * 6);
        for (let i = 0, o = 0; i < r.length - 1; i++, o += 6) { xyz(r[i][0], r[i][1], out, o); xyz(r[i + 1][0], r[i + 1][1], out, o + 3); }
        return out;
      });
      selLines.set(arrs);
      const top = [...rings].sort((a, b) => b.length - a.length).slice(0, 8);
      globe.pathsData(top.map(r => ({ pts: r })));
    },
    // Frame a bounding box [w, s, e, n]; the camera stays anchored on it.
    focusBBox(bbox, { ms = 1500, minAlt = 0.16, pad = 1.3 } = {}) {
      const aspect = el.clientWidth / Math.max(1, el.clientHeight);
      anchor = { lat: (bbox[1] + bbox[3]) / 2, lng: (bbox[0] + bbox[2]) / 2, altitude: altitudeFor(bbox, aspect, { pad, minAlt }) };
      controls.autoRotate = false;
      globe.pointOfView(anchor, ms);
    },
    home(ms = 1500) { anchor = null; globe.pointOfView(HOME, ms); },
    releaseAnchor() { anchor = null; },
    recenter(ms = 1200) { if (anchor) globe.pointOfView(anchor, ms); },
    get anchored() { return !!anchor; },
    zoomBy(f) { const p = globe.pointOfView(); globe.pointOfView({ altitude: Math.max(0.05, Math.min(6, p.altitude * f)) }, 300); },
    setAutoRotate(on) { controls.autoRotate = on && !anchor; },
    get autoRotate() { return controls.autoRotate; },
    toggleClouds() { showClouds = !showClouds; if (clouds) clouds.visible = showClouds; return showClouds; },
    // Regions of the current level, coarsest first: {kind: 'context' | 'country' | 'unit' | 'sub', id, geometry}
    setRegions(list) {
      feats = list || [];
      byKind = { context: [], country: [], unit: [], sub: [] };
      for (const f of feats) (byKind[f.kind] || byKind.context).push(f);
      for (const k of Object.keys(borders)) borders[k].set(byKind[k].map(f => featSegs(f, xyz)));
      if (hover && !feats.includes(hover)) setHover(null);
      drawFills();
    },
    // fill: feature -> css colour | null (null hides the choropleth)
    styleRegions({ fill }) { fillFn = fill || null; drawFills(); },
    // ring: [[lat, lng], ...] preview of the circle that a click would analyze, or null
    setGhost(ring) {
      if (!ring) { ghost.set([]); return; }
      const out = new Float32Array(ring.length * 3);
      for (let i = 0; i < ring.length; i++) xyz(ring[i][0], ring[i][1], out, i * 3);
      ghost.set([out]);
    },
    setActive(on) { active = on; sync(); },
    // Kilometres per screen pixel at the centre of the view (used to size the circle to what is on screen).
    kmPerPx() { return (globe.pointOfView().altitude * 6371 * 2 * Math.tan(25 * D2R)) / Math.max(1, el.clientHeight); },
  };
}
