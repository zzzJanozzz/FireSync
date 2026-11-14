// FireSync 3D globe: NASA Blue Marble imagery, relief, specular oceans, moving clouds, atmosphere,
// and GPU-instanced hotspot columns that animate between months without rebuilding geometry.
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/+esm';
import Globe from 'https://cdn.jsdelivr.net/npm/globe.gl@2.34.2/+esm';
import { fire } from './util.js';

// NASA Blue Marble, relief, water mask, star field and clouds from the three-globe / globe.gl examples (MIT),
// re-encoded as WebP and served from our own domain: 8.2 MB -> 1.3 MB, and no third-party CDN for imagery.
const TEX = 'assets/tex/';
const CLOUDS = TEX + 'clouds.webp';
const UP = new THREE.Vector3(0, 1, 0);

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

export function createGlobe(el, { onPick, onRegion } = {}) {
  const globe = new Globe(el, { animateIn: true, rendererConfig: { antialias: true, powerPreference: 'high-performance' } })
    .width(el.clientWidth).height(el.clientHeight)
    .backgroundColor('#050505')
    .globeImageUrl(TEX + 'earth-blue-marble.webp')
    .bumpImageUrl(TEX + 'earth-topology.webp')
    .backgroundImageUrl(TEX + 'night-sky.webp')
    .showAtmosphere(true).atmosphereColor('#8db8e8').atmosphereAltitude(0.17)
    .showGraticules(false)
    .pathPoints('pts').pathPointLat(p => p[0]).pathPointLng(p => p[1]).pathPointAlt(p => p[2])
    .pathColor(() => 'rgba(236,232,223,0.95)')
    .pathStroke(1.4).pathDashLength(0.02).pathDashGap(0.01).pathDashAnimateTime(16000)
    .pathTransitionDuration(0)
    .ringLat('lat').ringLng('lng')
    .ringColor(() => t => `rgba(255,${Math.round(150 + 80 * (1 - t))},70,${Math.max(0, 1 - t)})`)
    .ringMaxRadius('maxR').ringPropagationSpeed(1.6).ringRepeatPeriod(1400).ringAltitude(0.003)
    .onGlobeClick(({ lat, lng }) => onPick && onPick(lat, lng, null));

  // ---------------------------------------------------------- regions layer (countries, provinces / states)
  // Each feature: {geometry, kind: 'country' | 'context' | 'unit' | 'sub', id, ...}. Caps are nearly
  // transparent so the hotspot columns stay readable; the fill function paints the choropleth.
  let hover = null;
  let style = { fill: null, selected: null, label: null };
  const ALT = { context: 0.0015, country: 0.0025, unit: 0.0035, sub: 0.0045 };
  const capColor = f => {
    const isHover = hover === f, isSel = style.selected != null && f.id === style.selected;
    if (isSel) return isHover ? 'rgba(255,247,194,0.10)' : 'rgba(0,0,0,0)';
    const fill = style.fill ? style.fill(f) : null;
    if (isHover) return fill ? fill.replace(/[\d.]+\)$/, '0.82)') : 'rgba(255,247,194,0.16)';
    return fill || 'rgba(0,0,0,0)';
  };
  const strokeColor = f => {
    if (style.selected != null && f.id === style.selected) return 'rgba(255,247,194,0.95)';
    if (hover === f) return 'rgba(255,247,194,0.95)';
    return f.kind === 'context' ? 'rgba(236,232,223,0.16)' : f.kind === 'country' ? 'rgba(236,232,223,0.34)' : f.kind === 'sub' ? 'rgba(236,232,223,0.42)' : 'rgba(236,232,223,0.5)';
  };
  const restyle = () => {
    globe.polygonCapColor(f => capColor(f)).polygonStrokeColor(f => strokeColor(f));
  };
  globe.polygonsData([])
    .polygonGeoJsonGeometry('geometry')
    .polygonCapCurvatureResolution(3)
    .polygonsTransitionDuration(0)
    .polygonAltitude(f => ALT[f.kind] || 0.003)
    .polygonSideColor(() => 'rgba(0,0,0,0)')
    .polygonLabel(f => (style.label ? style.label(f) : ''))
    .onPolygonHover(f => {
      hover = f || null;
      el.style.cursor = hover ? 'pointer' : '';
      restyle();
    })
    .onPolygonClick((f, ev, coords) => onRegion && onRegion(f, coords || {}));
  restyle();

  try { globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); } catch (e) { /* older globe.gl */ }
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

  let clouds = null, showClouds = true;
  new THREE.TextureLoader().load(CLOUDS, tex => {
    clouds = new THREE.Mesh(new THREE.SphereGeometry(globe.getGlobeRadius() * 1.006, 75, 75),
      new THREE.MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false }));
    clouds.visible = showClouds;
    globe.scene().add(clouds);
  });

  const context = new Columns(globe, 30000, { maxAlt: 0.09 });
  const focus = new Columns(globe, 40000, { maxAlt: 0.06 });
  (function loop() {
    if (clouds && showClouds) clouds.rotation.y -= 0.00009;
    context.tick(); focus.tick();
    requestAnimationFrame(loop);
  })();

  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.enableDamping = true;
  controls.minDistance = 105;
  controls.maxDistance = 900;
  globe.pointOfView({ lat: -10, lng: -40, altitude: 2.6 }, 0);
  new ResizeObserver(() => globe.width(el.clientWidth).height(el.clientHeight)).observe(el);

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
    setOutline(rings) { globe.pathsData((rings || []).map(r => ({ pts: r }))); },
    flyTo(lat, lng, altitude = 1.2, ms = 1600) {
      controls.autoRotate = false;
      globe.pointOfView({ lat, lng, altitude }, ms);
    },
    anchorTo(lat, lng, altitude, ms = 1600) {
      anchor = { lat, lng, altitude };
      controls.autoRotate = false;
      globe.pointOfView(anchor, ms);
    },
    releaseAnchor() { anchor = null; },
    recenter(ms = 1200) { if (anchor) globe.pointOfView(anchor, ms); },
    get anchored() { return !!anchor; },
    setAutoRotate(on) { controls.autoRotate = on && !anchor; },
    get autoRotate() { return controls.autoRotate; },
    toggleClouds() { showClouds = !showClouds; if (clouds) clouds.visible = showClouds; return showClouds; },
    // Replace the clickable region polygons (countries or provinces / states).
    setRegions(features) { hover = null; globe.polygonsData(features || []); restyle(); },
    // fill: feature -> 'rgba(...)' | null; selected: feature id drawn as a bright outline; label: feature -> HTML
    styleRegions(next) { style = { ...style, ...next }; restyle(); },
  };
}
