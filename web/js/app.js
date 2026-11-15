// FireSync application wiring. Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import * as D from './data.js';
import * as U from './util.js';
import { Calendar } from './calendar.js';
import { createView } from './view.js';
import { mainBBox, pickFeature } from './regions.js';
import { createCharts, drawSeasonal, drawAnnual, drawScatter, drawDrift } from './charts.js';
import { I18N, tpl } from './i18n.js?v=20261115c';
import { createPeriod } from './period.js?v=20261115c';

const $ = id => document.getElementById(id);
const state = {
  lang: 'en', aoi: { kind: 'world', id: 'world', name: 'World' }, series: null, t: null,
  mode: 'counts', view: 'harmonized', baseline: 'viirs', radiusKm: 200, playing: false, userRotate: true, map: '3d',
  meta: null, countries: [], validation: null, medians: null, places: [],
  // Regionalization: click mode, choropleth fill, borders, the open country's provinces / states and their subdivisions.
  pickMode: 'region', fill: true, world: null, countriesH: null, regions: null, adm2: null, regionIndex: null,
  a3ByFid: new Map(), fidByA3: new Map(), nameEs: new Map(), nameEn: new Map(), rankAll: false,
  yFrom: 2000, yTo: null, // year range shown in the calendar and exported (null = latest year)
};
const L = () => I18N[state.lang];
let globeApi = null, calendar = null, charts = null, period = null;

const PRESETS = [
  { label: 'Chilecito · AR', name: 'Chilecito, La Rioja (Argentina)', lat: -29.18, lon: -67.64, r: 40, t: U.tOf(2026, 6) },
  { label: 'La Rioja · AR', region: ['ARG', 'La Rioja'], t: U.tOf(2026, 6) },
  { label: 'Córdoba · AR', region: ['ARG', 'Córdoba'], t: U.tOf(2020, 8) },
  { label: 'Rondônia · BR', region: ['BRA', 'Rondônia'], t: U.tOf(2019, 7) },
  { label: 'California · US', region: ['USA', 'California'], t: U.tOf(2020, 7) },
  { label: 'New South Wales · AU', region: ['AUS', 'New South Wales'], t: U.tOf(2019, 11) },
  { label: 'Sakha · RU', region: ['RUS', 'Sakha (Yakutia)'], t: U.tOf(2021, 6) },
  { label: 'Kalimantan Tengah · ID', region: ['IDN', 'Kalimantan Tengah'], t: U.tOf(2015, 8) },
  { label: 'Australia', country: 'Australia', t: U.tOf(2019, 11) },
  { label: 'Canada', country: 'Canada', t: U.tOf(2023, 5) },
];

// ------------------------------------------------------------ boot
async function boot() {
  const bar = $('introBar'), status = $('introStatus');
  const step = (p, txt) => { bar.style.width = `${p}%`; status.textContent = txt; };
  readHash();
  applyLang();
  step(15, L().loading);
  const [meta, countries, validation, world] = await Promise.all([D.getMeta(), D.getCountries(), D.getValidation(), D.getWorldBorders().catch(() => null)]);
  state.meta = meta; state.countries = countries.sort((a, b) => b.total - a.total); state.validation = validation;
  initWorld(world);
  D.getCountriesH().then(h => { state.countriesH = h; refreshRegions(); renderRanking(); }).catch(() => {});
  D.getHandover().then(h => { state.handover = h; if (charts) drawValidation(); }).catch(() => {});
  step(45, L().loadingGlobe);
  globeApi = createView({ el3d: $('globe'), el2d: $('map2d'), onHover: onViewHover, onClick: onViewClick });
  calendar = new Calendar($('calendar'), { onSelect: t => selectMonth(t), onHover: showTip });
  charts = createCharts({ seasonal: $('chSeasonal'), annual: $('chAnnual'), scatter: $('chScatter'), drift: $('chDrift') });
  setupUI();
  period = createPeriod({ state, L, values, baselineYears, selectMonth: t => selectMonth(t), areaSlug, toast, onChange: () => writeHash() });
  step(70, L().loading);
  const h = state.pendingHash;
  try {
    if (h && h.r) {
      await pickRegion(h.r[0], h.r[1], { t: h.t });
      if (h.r[2]) {
        await state.adm2Ready;
        const f = state.adm2 && state.adm2.features.find(x => String(x.id) === h.r[2]);
        if (f) await pickSub(f, { t: h.t });
      }
    }
    else if (h && h.p) await pickCircle(h.p[0], h.p[1], h.p[2], { t: h.t });
    else if (h && h.c != null && countries.find(c => String(c.id) === String(h.c))) await pickCountry(countries.find(c => String(c.id) === String(h.c)), { t: h.t });
    else await pickWorld({ t: h && h.t });
  } catch (e) { console.error(e); await pickWorld({}); }
  drawValidation();
  step(100, L().ready);
  if (h && h.v === '2d') setMapView('2d');
  setTimeout(() => { $('intro').classList.add('done'); document.body.classList.add('ready'); }, 300);
  stabilizeLayout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(stabilizeLayout);
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  setTimeout(() => { $('globeHint').style.opacity = '0'; }, 9000);
}

// ------------------------------------------------------------ areas of interest
function beginAOI() { if (state.playing) stop(); }

// ------------------------------------------------------------ regions (borders, provinces / states, subdivisions)
const normTxt = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function initWorld(world) {
  if (!world) return;
  state.world = world;
  state.worldFeats = world.features.map(f => ({ kind: 'country', id: `c:${f.properties.a3}`, a3: f.properties.a3, fid: f.properties.fid, parent: f.properties.parent ?? null, name: f.properties.name, name_es: f.properties.name_es, adm1: f.properties.adm1, geometry: f.geometry }));
  // fid: the FIRMS country this outline IS. parent: a territory that FIRMS counts inside another country
  // (Ashmore and Cartier inside Australia, Western Sahara inside Morocco). A territory never renames its parent.
  for (const f of state.worldFeats) {
    if (f.fid == null) { if (f.parent != null) state.fidByA3.set(f.a3, f.parent); continue; }
    state.a3ByFid.set(f.fid, f.a3);
    state.fidByA3.set(f.a3, f.fid);
    if (f.name_es) state.nameEs.set(f.fid, f.name_es);
    if (f.name) state.nameEn.set(f.fid, f.name);
  }
}
// Display names come from Natural Earth ("Russia", "Ivory Coast"); the FIRMS archive name is the fallback.
const cName = c => (c ? (state.lang === 'es' ? state.nameEs.get(c.id) : state.nameEn.get(c.id)) || c.name : '');
const featFid = f => (f.fid != null ? f.fid : f.parent);
// Every name a country can be searched by: FIRMS archive name, Natural Earth English and Spanish names.
const countryKey = c => c._key || (c._key = [c.name, state.nameEn.get(c.id), state.nameEs.get(c.id)].filter(Boolean).map(normTxt).join('|'));
const countryByFid = fid => state.countries.find(c => c.id === fid);
const uName = u => (state.lang === 'es' ? u.name_es || u.name : u.name_en || u.name);
const uType = u => (state.lang === 'es' ? (L().typeEs[u.type_en] || u.type || u.type_en) : u.type_en || u.type) || L().fRegion;
const worldFeatOf = a3 => state.worldFeats && state.worldFeats.find(f => f.a3 === a3);
// Name of the third level as geoBoundaries calls it in that country ("departments", "counties"...), localized.
// [plural EN, singular EN, plural ES, singular ES], keyed by geoBoundaries' "canonical" name (singular or plural).
const ADM2_ROWS = [
  [['department', 'departments'], ['Departments', 'Department', 'Departamentos', 'Departamento']],
  [['county', 'counties', 'county level', 'counties and unitary authorities', 'county, city, special city'], ['Counties', 'County', 'Condados', 'Condado']],
  [['district', 'districts', 'government district', 'district municipality', 'subdistrict', 'districts (aqdya)'], ['Districts', 'District', 'Distritos', 'Distrito']],
  [['municipality', 'municipalities', 'municipio', 'municipios', 'municipalities and towns', 'kommune', 'opštini'], ['Municipalities', 'Municipality', 'Municipios', 'Municipio']],
  [['province', 'provinces'], ['Provinces', 'Province', 'Provincias', 'Provincia']],
  [['commune', 'communes', 'municipal communities'], ['Communes', 'Commune', 'Comunas', 'Comuna']],
  [['raion', 'raions', 'okres', 'tuman'], ['Districts', 'District', 'Distritos', 'Distrito']],
  [['prefecture', 'prefectures'], ['Prefectures', 'Prefecture', 'Prefecturas', 'Prefectura']],
  [['sub-prefectures', 'subprefectures'], ['Sub-prefectures', 'Sub-prefecture', 'Subprefecturas', 'Subprefectura']],
  [['canton', 'cantons'], ['Cantons', 'Canton', 'Cantones', 'Cantón']],
  [['governorate'], ['Governorates', 'Governorate', 'Gobernaciones', 'Gobernación']],
  [['divisions'], ['Divisions', 'Division', 'Divisiones', 'División']],
  [['constituency', 'constituencies'], ['Constituencies', 'Constituency', 'Circunscripciones', 'Circunscripción']],
  [['regions'], ['Regions', 'Region', 'Regiones', 'Región']],
  [['townships'], ['Townships', 'Township', 'Municipios', 'Municipio']],
  [['local government areas', 'territorial authorities'], ['Local government areas', 'Local government area', 'Áreas de gobierno local', 'Área de gobierno local']],
  [['community', 'communities'], ['Communities', 'Community', 'Comunidades', 'Comunidad']],
  [['parishes', 'freguesia'], ['Parishes', 'Parish', 'Parroquias', 'Parroquia']],
  [['regency, city'], ['Regencies and cities', 'Regency / city', 'Regencias y ciudades', 'Regencia / ciudad']],
];
const ADM2_NAMES = Object.fromEntries(ADM2_ROWS.flatMap(([keys, row]) => keys.map(k => [k, row])));
function adm2Kind(singular) {
  const c = state.adm2 && state.adm2.canonical ? String(state.adm2.canonical).toLowerCase().trim() : '';
  const row = ADM2_NAMES[c];
  if (!row) return L().fAdm2;
  return row[(state.lang === 'es' ? 2 : 0) + (singular ? 1 : 0)];
}

// The polygons drawn on the globe for the current level, plus their choropleth fill.
function refreshRegions() {
  if (!globeApi || !state.worldFeats) return;
  const a = state.aoi, feats = [];
  const a3 = a.kind === 'country' || a.kind === 'region' || a.kind === 'sub' ? a.a3 : null;
  const deep = a3 && state.regions && state.regions.a3 === a3;
  for (const f of state.worldFeats) {
    if (deep && f.a3 === a3) continue;
    if (a.kind === 'world') feats.push(f);
    else feats.push(f.ctx || (f.ctx = { ...f, kind: 'context' }));
  }
  if (deep) {
    const file = state.regions;
    if (!file.feats) file.feats = file.geo.features.map(g => ({ kind: 'unit', id: g.properties.id, unit: file.units.find(u => u.id === g.properties.id), geometry: g.geometry }));
    feats.push(...file.feats);
    if ((a.kind === 'region' || a.kind === 'sub') && state.adm2 && state.adm2.uid === a.uid) {
      if (!state.adm2.feats) state.adm2.feats = state.adm2.features.map(s => ({ kind: 'sub', id: `s:${s.id}`, sub: s, geometry: s.geom }));
      feats.push(...state.adm2.feats);
    }
  }
  globeApi.setRegions(feats);
  restyleRegions();
}

// Stable log scale per level (p99 over every unit-month) so the time-lapse shows real change.
function scaleOf(obj) {
  if (obj.__p99) return obj.__p99;
  const vals = [];
  for (const arr of Object.values(obj.H)) for (const v of arr) if (v > 0) vals.push(v);
  vals.sort((x, y) => x - y);
  obj.__p99 = Math.max(5, vals.length ? vals[Math.floor(vals.length * 0.99)] : 5);
  return obj.__p99;
}
function fillColor(v, vmax) {
  if (!(v > 0)) return 'rgba(255,255,255,0.025)';
  const x = Math.min(1, Math.log10(1 + v) / Math.log10(1 + vmax));
  return U.inferno(0.1 + 0.9 * x).replace('rgb(', 'rgba(').replace(')', ',0.52)');
}
function seriesStats(arr, t) {
  if (!arr) return null;
  const m = U.monthOf(t), y = U.yearOf(t), [b0, b1] = baselineYears(), base = [];
  for (let yy = b0; yy <= b1; yy++) { if (yy === y) continue; const tt = U.tOf(yy, m); if (tt >= 0 && tt < arr.length) base.push(arr[tt]); }
  const v = arr[t] || 0, med = U.median(base);
  return { v, med, anom: med > 0 ? v / med - 1 : v > 0 ? Infinity : 0 };
}
const featSeries = f => {
  if (f.kind === 'unit') return state.regions && state.regions.H[f.id];
  if (f.kind === 'sub') return state.adm2 && state.adm2.H && state.adm2.H[f.sub.id];
  if ((f.kind === 'country' || f.kind === 'context') && state.countriesH && featFid(f) != null) return state.countriesH.H[featFid(f)];
  return null;
};
function restyleRegions() {
  if (!globeApi) return;
  const a = state.aoi, t = state.t ?? 0, l = L();
  const unitMax = state.regions ? scaleOf(state.regions) : 1;
  const ctyMax = state.countriesH ? scaleOf(state.countriesH) : 1;
  const subMax = state.adm2 && state.adm2.H ? scaleOf(state.adm2) : 1;
  // The selected province / department stays clear so its own hotspots read well.
  const selected = a.kind === 'region' ? a.uid : a.kind === 'sub' ? `s:${a.sid}` : null;
  globeApi.styleRegions({
    fill: !state.fill ? null : f => {
      if (f.kind === 'context' || f.id === selected) return null;
      if (f.kind === 'unit' && a.kind === 'sub') return null;
      const arr = featSeries(f);
      if (!arr) return null;
      return fillColor(arr[t], f.kind === 'unit' ? unitMax : f.kind === 'sub' ? subMax : ctyMax);
    },
  });
  renderHover();
}

// Fixed readout of the region under the cursor (it sits in the corner, so it never covers the map).
function renderHover() {
  const box = $('hoverBox');
  if (!box) return;
  const f = state.hoverF, c = state.hoverC, l = L(), t = state.t ?? 0;
  if (!f && !(c && state.pickMode === 'circle')) { box.classList.remove('on'); return; }
  let kind, title, val = '', hint;
  if (f) {
    if (f.kind === 'unit') { title = uName(f.unit); kind = uType(f.unit); }
    else if (f.kind === 'sub') { title = f.sub.name; kind = adm2Kind(true); }
    else { title = state.lang === 'es' ? f.name_es || f.name : f.name; kind = l.country; }
    const st = seriesStats(featSeries(f), t);
    if (st) val = `${U.fmt(st.v, state.lang)} · ${isFinite(st.anom) ? U.pct(st.anom, state.lang) : l.newActivity}`;
    hint = state.pickMode === 'circle' ? tpl(l.tipCircleR, { r: state.radiusKm }) : f.kind === 'country' || f.kind === 'context' ? l.tipDrill : l.tipOpen;
    // A territory without its own FIRMS record: the numbers are those of the country that includes it.
    if (f.fid == null && f.parent != null && (f.kind === 'country' || f.kind === 'context')) hint = tpl(l.tipAlias, { c: cName(countryByFid(f.parent)) });
  } else {
    kind = l.kicker.circle; title = `${c.lat.toFixed(2)}°, ${c.lng.toFixed(2)}°`; hint = tpl(l.tipCircleR, { r: state.radiusKm });
  }
  $('hoverKind').textContent = kind;
  $('hoverName').textContent = title;
  $('hoverVal').textContent = val;
  $('hoverHint').textContent = hint;
  box.classList.add('on');
}
function onViewHover(f, c) {
  const changed = f !== state.hoverF || (state.pickMode === 'circle' && !f);
  state.hoverF = f; state.hoverC = c;
  if (state.pickMode === 'circle') globeApi.setGhost(c && !state.playing ? D.circleGeom(c.lat, c.lng, state.radiusKm, 72).coordinates[0].map(([x, y]) => [y, x]) : null);
  if (changed) renderHover();
}
function onViewClick(f, c) {
  if (state.playing || !c) return;
  if (state.pickMode === 'circle') return pickCircle(c.lat, c.lng, state.radiusKm);
  if (!f) { toast(L().oceanHint); return; }
  if (f.kind === 'unit') return pickRegion(state.regions.a3, f.id, { t: state.t });
  if (f.kind === 'sub') return pickSub(f.sub, { t: state.t });
  const cty = featFid(f) != null ? countryByFid(featFid(f)) : null;
  if (cty) return pickCountry(cty, { t: state.t });
  return pickPlace({ name: f.name, full: f.name, type: 'country', lat: c.lat, lon: c.lng, geom: f.geometry }, { t: state.t });
}

async function loadRegions(a3) {
  try { const file = await D.getRegions(a3); return file; } catch (e) { console.warn(e); return null; }
}

async function pickWorld({ t } = {}) {
  beginAOI();
  state.aoi = { kind: 'world', id: 'world', name: L().world };
  state.adm2 = null;
  const s = await D.countrySeries('world');
  globeApi.setOutline([]);
  globeApi.clearFocus();
  $('radiusCtl').classList.toggle('on', state.pickMode === 'circle');
  refreshRegions();
  await setSeries(s, t);
  globeApi.home();
  globeApi.setAutoRotate(state.userRotate);
  $('btnRotate').classList.toggle('on', state.userRotate);
}

async function pickCountry(c, { t } = {}) {
  beginAOI();
  const a3 = state.a3ByFid.get(c.id) || null;
  const wf = a3 && worldFeatOf(a3);
  state.aoi = { kind: 'country', id: c.id, name: cName(c), a3, lat: c.lat, lon: c.lon, bbox: c.bbox, geom: wf ? wf.geometry : null, areaHa: wf ? D.geomAreaHa(wf.geometry) : null };
  state.adm2 = null;
  const a = state.aoi;
  const [s, file] = await Promise.all([D.countrySeries(c.id), a3 ? loadRegions(a3) : null]);
  if (state.aoi !== a) return;
  if (file) state.regions = file;
  globeApi.hideContext();
  globeApi.setOutline(a.geom ? D.outlineRings(a.geom) : []);
  $('radiusCtl').classList.toggle('on', state.pickMode === 'circle');
  // Frame the mainland (not far islands or overseas territories), close enough to click a province.
  globeApi.focusBBox((wf && mainBBox(wf.geometry)) || c.bbox, { minAlt: 0.2, pad: 1.25, ms: 1700 });
  $('btnRotate').classList.remove('on');
  refreshRegions();
  await setSeries(s, t);
  if (a.geom) return;
  // No Natural Earth polygon for this FIRMS unit: real border from OpenStreetMap. Fails gracefully.
  D.countryBoundary(c.name).then(g => {
    if (state.aoi !== a || !g) return;
    a.geom = g; a.areaHa = D.geomAreaHa(g);
    globeApi.setOutline(D.outlineRings(g));
    updateBurned();
  });
}

// One province / state (Natural Earth admin-1) of any country.
async function pickRegion(a3, uid, { t } = {}) {
  beginAOI();
  const file = await loadRegions(a3);
  const u = file && file.units.find(x => x.id === uid);
  if (!u) { toast(L().regionErr); return; }
  state.regions = file;
  const fid = file.fid != null ? file.fid : state.fidByA3.get(a3);
  const country = fid != null ? countryByFid(fid) : null;
  const s = await D.unitSeries(file, uid);
  if (!s.cells.length) {
    // Smaller than one 0.25-degree cell: fall back to a circle of the same area around its centre.
    return pickCircle(u.lat, u.lon, Math.max(12, Math.round(Math.sqrt(u.km2 / Math.PI))), { t, label: uName(u) });
  }
  state.aoi = { kind: 'region', a3, uid, unit: u, country, name: uName(u), type: uType(u), lat: u.lat, lon: u.lon, geom: s.geom, areaHa: s.areaHa, id: `ne:${uid}` };
  if (!state.adm2 || state.adm2.uid !== uid) state.adm2 = null;
  const a = state.aoi;
  globeApi.hideContext();
  globeApi.setOutline(s.geom ? D.outlineRings(s.geom) : []);
  $('radiusCtl').classList.toggle('on', state.pickMode === 'circle');
  globeApi.focusBBox((s.geom && mainBBox(s.geom, 0.85)) || u.bbox, { minAlt: 0.15, pad: 1.35, ms: 1600 });
  $('btnRotate').classList.remove('on');
  refreshRegions();
  await setSeries(s, t);
  state.adm2Ready = loadAdm2(a);
}

// Third level: departments / counties / districts inside the selected province (geoBoundaries, on demand).
function loadAdm2(a) {
  if (state.adm2 && state.adm2.uid === a.uid) { syncFilters(); return Promise.resolve(); }
  $('fAdm2Wrap').hidden = false;
  $('selAdm2').innerHTML = `<option value="">${L().adm2Loading}</option>`;
  $('selAdm2').disabled = true;
  return D.getAdm2(a.uid).then(file => {
    const features = file.units.map(u => ({ id: u.id, name: u.name, unit: u, geom: (file.geo.features.find(f => f.properties.id === u.id) || {}).geometry })).filter(f => f.geom);
    return { ...file, features };
  }).catch(() => null).then(sub => {
    if (state.aoi !== a && !(state.aoi.kind === 'sub' && state.aoi.uid === a.uid)) return;
    state.adm2 = sub && sub.features.length > 1 ? { ...sub, uid: a.uid } : { features: [], uid: a.uid, none: true };
    refreshRegions();
    syncFilters();
    renderRanking();
    if (state.lastPts) renderPointsLegend(...state.lastPts);
  });
}

async function pickSub(sub, { t } = {}) {
  beginAOI();
  const parent = state.aoi.kind === 'region' || state.aoi.kind === 'sub' ? state.aoi : null;
  if (!parent) return;
  const s = state.adm2 && state.adm2.G ? await D.subSeries(state.adm2, sub.id) : await D.polygonSeries(sub.geom);
  if (!s.cells.length) {
    const km2 = D.geomAreaHa(sub.geom) / 100;
    return pickCircle(...D.geomCenter(sub.geom), Math.max(10, Math.round(Math.sqrt(km2 / Math.PI))), { t, label: sub.name });
  }
  state.aoi = { kind: 'sub', a3: parent.a3, uid: parent.uid, unit: parent.unit, country: parent.country, sid: sub.id, sub, name: sub.name, parentName: parent.unit ? uName(parent.unit) : '', lat: (s.bbox[1] + s.bbox[3]) / 2, lon: (s.bbox[0] + s.bbox[2]) / 2, geom: sub.geom, areaHa: s.areaHa, id: `gb:${sub.id}` };
  globeApi.hideContext();
  globeApi.setOutline(D.outlineRings(sub.geom));
  globeApi.focusBBox(s.bbox, { minAlt: 0.11, pad: 1.6, ms: 1400 });
  $('btnRotate').classList.remove('on');
  refreshRegions();
  await setSeries(s, t);
}

async function pickCircle(lat, lon, r, { t, label } = {}) {
  beginAOI();
  state.radiusKm = r;
  $('radiusRange').value = r; $('radiusVal').textContent = r;
  const near = nearestCountry(lat, lon);
  const preset = label || (PRESETS.find(p => p.lat != null && Math.abs(p.lat - lat) < 0.01 && Math.abs(p.lon - lon) < 0.01) || {}).name;
  const name = preset || (near ? tpl(L().areaNear, { c: cName(near) }) : tpl(L().areaAt, { lat: lat.toFixed(2), lon: lon.toFixed(2) }));
  toast(`${name} · ${r} km`);
  const s = await D.circleSeries(lat, lon, r);
  state.aoi = { kind: 'circle', lat, lon, radiusKm: r, name, id: s.id, geom: s.geom, areaHa: s.areaHa };
  globeApi.hideContext();
  globeApi.setOutline(D.outlineRings(s.geom));
  $('radiusCtl').classList.add('on');
  refreshRegions();
  const dLat = r / 111.32, dLon = Math.min(170, r / (111.32 * Math.max(0.05, Math.cos(lat * Math.PI / 180))));
  globeApi.focusBBox([lon - dLon, lat - dLat, lon + dLon, lat + dLat], { minAlt: 0.11, pad: 1.7, ms: 1500 });
  $('btnRotate').classList.remove('on');
  await setSeries(s, t);
}

async function pickPlace(p, { t } = {}) {
  beginAOI();
  if (!p.geom) return pickCircle(p.lat, p.lon, 25, { t, label: p.name });
  toast(p.full || p.name);
  const s = await D.polygonSeries(p.geom);
  if (!s.cells.length) return pickCircle(p.lat, p.lon, Math.max(20, Math.sqrt(s.areaHa / 100 / Math.PI)), { t, label: p.name });
  state.aoi = { kind: 'polygon', name: p.name, full: p.full, type: p.type, lat: p.lat, lon: p.lon, geom: p.geom, areaHa: s.areaHa, id: `osm:${p.name}` };
  globeApi.hideContext();
  globeApi.setOutline(D.outlineRings(p.geom));
  $('radiusCtl').classList.toggle('on', state.pickMode === 'circle');
  refreshRegions();
  globeApi.focusBBox(mainBBox(p.geom, 0.85) || s.bbox, { minAlt: 0.12, pad: 1.4, ms: 1600 });
  $('btnRotate').classList.remove('on');
  await setSeries(s, t);
}

async function pickPreset(p) {
  if (p.region) {
    const file = await loadRegions(p.region[0]);
    const u = file && (file.units.find(x => x.name === p.region[1] || x.name_en === p.region[1]) || file.units.find(x => normTxt(x.name).includes(normTxt(p.region[1]))));
    if (u) return pickRegion(file.a3, u.id, { t: p.t });
  }
  if (p.country) { const c = state.countries.find(c => c.name === p.country); if (c) return pickCountry(c, { t: p.t }); }
  if (p.place) {
    try { const res = await D.searchPlaces(p.place, state.lang); const hit = res.find(r => r.geom) || res[0]; if (hit) return pickPlace({ ...hit, name: p.label.split(' · ')[0] }, { t: p.t }); } catch (e) { console.warn(e); }
    return;
  }
  return pickCircle(p.lat, p.lon, p.r, { t: p.t });
}

function nearestCountry(lat, lon) {
  let best = null, bd = Infinity;
  for (const c of state.countries) {
    const [w, s, e, n] = c.bbox;
    const inside = lat >= s - 0.5 && lat <= n + 0.5 && lon >= w - 0.5 && lon <= e + 0.5;
    const d = U.haversineKm(lat, lon, c.lat, c.lon) * (inside ? 0.25 : 1);
    if (d < bd) { bd = d; best = c; }
  }
  return bd < 2500 ? best : null;
}

async function setSeries(s, t) {
  state.series = s;
  const last = s.n - 1;
  state.t = t != null && t >= 0 && t <= last ? t : (state.t != null && state.t <= last ? state.t : last);
  $('timeRange').max = last;
  renderAOIHead();
  await selectMonth(state.t, { instant: true });
}

// ------------------------------------------------------------ month selection
const baselineYears = () => (state.baseline === 'full' ? [2003, 2025] : [2012, 2025]);
// Year range chosen by the user (calendar rows and every download follow it).
function yearRange() {
  const last = state.series ? U.yearOf(state.series.n - 1) : 2026;
  const to = Math.min(last, state.yTo || last), from = Math.max(2000, Math.min(state.yFrom, to));
  return [from, to];
}
const values = () => (state.view === 'naive' ? state.series.naive : state.series.H);

function monthStats(t) {
  const s = state.series, v = values(), m = U.monthOf(t), y = U.yearOf(t), [b0, b1] = baselineYears();
  const base = [];
  for (let yy = b0; yy <= b1; yy++) { if (yy === y) continue; const tt = U.tOf(yy, m); if (tt >= 0 && tt < s.n) base.push(v[tt]); }
  const med = U.median(base);
  const all = [];
  for (let yy = 2001; yy <= U.yearOf(s.n - 1); yy++) { const tt = U.tOf(yy, m); if (tt >= 0 && tt < s.n) all.push(v[tt]); }
  const val = v[t];
  const rank = 1 + all.filter(x => x > val).length;
  const anom = med > 0 ? val / med - 1 : (val > 0 ? Infinity : 0);
  return { val, med, anom, rank, nYears: all.length, isMax: rank === 1, isMin: all.every(x => x >= val) && all.length > 1, lo: s.lo[t], hi: s.hi[t] };
}

async function selectMonth(t, { instant = false } = {}) {
  const s = state.series;
  if (!s) return;
  t = Math.max(0, Math.min(s.n - 1, t));
  state.t = t;
  const l = L(), y = U.yearOf(t), m = U.monthOf(t);
  const { medians } = calendar.update({
    values: values(), n: s.n, mode: state.mode, baseline: baselineYears(), selT: t, firstYear: yearRange()[0], lastYear: yearRange()[1],
    labels: { months: l.months, year: l.year, total: l.total, median: l.median, viirsEra: l.viirsEra, modisEra: l.modisEra, aria: l.calTitle },
    monthCellLabel: (tt, v) => `${l.monthsLong[U.monthOf(tt)]} ${U.yearOf(tt)}: ${U.fmt(v, state.lang)}`,
  });
  state.medians = medians;
  if (!state.playing) calendar.setPlaying(null);
  renderLegend();
  renderFacts();
  const st = monthStats(t);
  U.animateNumber($('kpiSel'), st.val, { lang: state.lang });
  $('kpiSelSub').textContent = `${l.monthsLong[m]} ${y} · ${l.kSelSub}`;
  U.animateNumber($('kpiMed'), st.med, { lang: state.lang });
  $('kpiMedSub').textContent = `${l.monthsLong[m]} · ${baselineYears().join('–')}`;
  const anomEl = $('kpiAnom');
  anomEl.textContent = isFinite(st.anom) ? U.pct(st.anom, state.lang) : '—';
  anomEl.className = 'v ' + (st.anom > 0.25 ? 'hot' : st.anom < -0.2 ? 'cool' : '');
  $('kpiAnomSub').textContent = !isFinite(st.anom) ? l.medZero : st.anom > 0.25 ? l.above : st.anom < -0.2 ? l.below : '≈';
  $('kpiRank').textContent = `#${st.rank}`;
  $('kpiRank').className = 'v ' + (st.rank <= 3 ? 'hot' : '');
  $('kpiRankSub').textContent = tpl(l.kRankSub, { n: st.nYears });
  const base = baselineYears().join('–');
  // The sentence in any language (the other ones are only measured, so the block keeps its height on a language switch).
  const sentence = g => {
    const k = I18N[g];
    if (!(st.val > 0)) return tpl(k.insightZero, { area: state.aoi.name, month: k.monthsLong[m], year: y, base, med: U.fmt(st.med, g) });
    let h = tpl(k.insight, {
      area: state.aoi.name, month: k.monthsLong[m], year: y, v: U.fmt(st.val, g), anom: isFinite(st.anom) ? U.pct(st.anom, g) : k.newActivity,
      base, med: U.fmt(st.med, g), rank: st.rank, n: st.nYears, rec: st.isMax ? k.insightRec : st.isMin ? k.insightLow : '',
    });
    if (U.isRecon(t) && state.view === 'harmonized') h += tpl(k.insightRecon, { sat: U.refSatOf(t), lo: U.fmt(st.lo, g), hi: U.fmt(st.hi, g) });
    return h;
  };
  $('insight').innerHTML = sentence(state.lang) + '<span id="insightBurn"></span>';
  state.insightAll = Object.fromEntries(Object.keys(I18N).map(g => [g, sentence(g)]));
  state.burnHa = null;
  fitInsight();
  const part = partialInfo();
  if (part) put($('partialNote'), 'partial', { d: part.date }); else { $('partialNote').textContent = ''; $('partialNote').style.minHeight = ''; }
  $('hudMonth').textContent = `${l.months[m]} ${y}`;
  $('hudValue').textContent = `${U.fmt(st.val, state.lang)} · ${isFinite(st.anom) ? U.pct(st.anom, state.lang) : ''}`;
  $('hudArea').textContent = state.aoi.name;
  $('timeRange').value = t;
  $('timeLabel').textContent = `${l.months[m]} ${y}`;
  drawSeasonal(charts.seasonal, { values: values(), n: s.n, year: y, baseline: baselineYears(), labels: { months: l.months, median: l.median, iqr: l.iqr }, lang: state.lang });
  drawAnnual(charts.annual, { series: s, lang: state.lang, selYear: y, showNaive: true, labels: { harmonized: l.harmonized, naive: l.naive, band: l.band, reconEra: l.reconEra } });
  renderRanking();
  if (period) period.render();
  await showGlobeMonth(t, { instant, rings: true });
  updateBurned();
  writeHash();
}

// While the timeline is being dragged: move the map, the big label and the calendar marker only.
// The full update (calendar colours, charts, ranking, burned area) runs once the drag pauses.
function scrubMonth(t) {
  const s = state.series;
  if (!s) return;
  t = Math.max(0, Math.min(s.n - 1, t));
  state.t = t;
  const l = L(), v = values()[t];
  $('hudMonth').textContent = `${l.months[U.monthOf(t)]} ${U.yearOf(t)}`;
  $('hudValue').textContent = U.fmt(v, state.lang);
  $('timeLabel').textContent = `${l.months[U.monthOf(t)]} ${U.yearOf(t)}`;
  calendar.setPlaying(t);
  showGlobeMonth(t, { instant: false, rings: false });
}

// The challenge question in one line: which months and years had the most fire?
function renderFacts() {
  const s = state.series, v = values(), l = L(), [ya, yb] = yearRange(), el = $('calFacts');
  let bt = -1, bv = 0;
  const tot = new Map();
  for (let t = 0; t < s.n; t++) {
    const y = U.yearOf(t);
    if (y < ya || y > yb) continue;
    if (v[t] > bv) { bv = v[t]; bt = t; }
    tot.set(y, (tot.get(y) || 0) + v[t]);
  }
  if (bt < 0) { el.innerHTML = `<div class="fact"><div class="fk">${l.factNone}</div></div>`; return; }
  let by = ya, byv = -1;
  for (const [y, x] of tot) if (x > byv) { byv = x; by = y; }
  const med = state.medians || [], sum = med.reduce((a, b) => a + b, 0);
  let bs = 0, bsum = -1;
  for (let m = 0; m < 12; m++) { const x = med[m] + med[(m + 1) % 12] + med[(m + 2) % 12]; if (x > bsum) { bsum = x; bs = m; } }
  const st = monthStats(state.t), m = U.monthOf(state.t);
  const fact = (k, val, sub, t) => `<${t != null ? `button type="button" data-t="${t}"` : 'div'} class="fact"><div class="fk">${k}</div><div class="fv">${val}</div><div class="fs">${sub}</div></${t != null ? 'button' : 'div'}>`;
  el.innerHTML = fact(l.factPeakMonth, `${l.months[U.monthOf(bt)]} ${U.yearOf(bt)}`, `${U.compact(bv)} ${l.factUnit}`, bt)
    + fact(l.factPeakYear, String(by), `${U.compact(byv)} ${l.factUnit}`, Math.max(0, Math.min(s.n - 1, U.tOf(by, m))))
    + fact(l.factSeason, sum > 0 ? `${l.months[bs]}–${l.months[(bs + 2) % 12]}` : '—', sum > 0 ? tpl(l.factShare, { p: Math.round((100 * bsum) / sum) }) : '', null)
    + fact(`${l.monthsLong[m]} ${U.yearOf(state.t)}`, isFinite(st.anom) ? U.pct(st.anom, state.lang) : l.newActivity, tpl(l.factRank, { r: st.rank, n: st.nYears }), null);
  el.querySelectorAll('button[data-t]').forEach(b => b.addEventListener('click', () => selectMonth(Number(b.dataset.t))));
}

// Draw the selected month on the globe: the world layer in World mode, only the place's cells otherwise.
async function showGlobeMonth(t, { instant = false, rings = true } = {}) {
  const y = U.yearOf(t), label = `${y}-${String(U.monthOf(t) + 1).padStart(2, '0')}`;
  const lastYear = U.yearOf(state.meta.months - 1);
  const a = state.aoi, s = state.series;
  let vmax = 0, res = 1;
  if (a.kind === 'world') {
    const yd = await D.globeYear(y);
    if (state.t !== t) return;
    vmax = globeApi.setContext(yd[label], instant);
    if (y + 1 <= lastYear) D.globeYear(y + 1);
  } else if (a.kind === 'country') {
    const yd = await D.countryYear(a.id, y);
    if (state.t !== t || state.aoi !== a) return;
    const flat = yd[label] || [];
    const data = [];
    for (let i = 0; i < flat.length; i += 2) { const c = D.cellCenter(flat[i]); data.push({ key: flat[i], lat: c.lat, lng: c.lng, v: flat[i + 1] / 10 }); }
    vmax = globeApi.setFocus(data, instant, rings); res = 0.25;
    if (y + 1 <= lastYear) D.countryYear(a.id, y + 1);
  } else if (s.cells) {
    const data = [];
    for (const c of s.cells) { const v = c.series[t]; if (v > 0) data.push({ key: c.key, lat: c.lat, lng: c.lng, v }); }
    vmax = globeApi.setFocus(data, instant, rings); res = 0.25;
  }
  restyleRegions();
  renderPointsLegend(res, vmax);
}

function renderPointsLegend(res, vmax) {
  const l = L(), a = state.aoi;
  state.lastPts = [res, vmax];
  const flat = state.map === '2d';
  $('ptsTitle').textContent = flat ? l.ptsTitle2d : l.ptsTitle;
  put($('ptsBody'), flat ? 'ptsBody2d' : 'ptsBody', { km: res === 1 ? '110' : '28' });
  $('ptsMax').textContent = vmax > 0 ? U.fmt(vmax, state.lang) : '—';
  const fillOn = state.fill && (a.kind === 'world' ? !!state.countriesH : !!(state.regions && (a.kind === 'country' || a.kind === 'region' || a.kind === 'sub') && a.a3 === state.regions.a3));
  const subsOn = (a.kind === 'region' || a.kind === 'sub') && state.adm2 && state.adm2.uid === a.uid && !state.adm2.none;
  $('fillKey').hidden = !fillOn;
  put($('fillKey'), a.kind === 'world' ? 'fillKeyWorld' : subsOn ? 'fillKeySubs' : 'fillKeyRegions', { x: adm2Kind(false).toLowerCase() });
}

// Burned area (MODIS MCD64A1 via Planetary Computer) for the selected area and month.
let burnTimer;
function updateBurned() {
  clearTimeout(burnTimer);
  const el = $('kpiBurn'), sub = $('kpiBurnSub'), l = L(), a = state.aoi, t = state.t;
  if (a.kind === 'world' || !a.geom) { el.textContent = '—'; sub.textContent = a.kind === 'world' ? l.burnPick : l.burnLoading; return; }
  if (state.playing) return;
  el.textContent = '…'; sub.textContent = l.burnLoading;
  burnTimer = setTimeout(async () => {
    const r = await D.burnedArea(a.id, a.geom, a.areaHa, t);
    if (state.aoi !== a || state.t !== t) return;
    if (r.status === 'ok') {
      U.animateNumber(el, r.ha, { lang: state.lang, format: v => U.fmt(Math.round(v / 10) * 10, state.lang) });
      sub.textContent = tpl(l.burnSub, { p: U.fmt(r.fraction * 100, state.lang, r.fraction < 0.01 ? 2 : 1) });
      const ib = $('insightBurn');
      if (ib && r.ha >= 10) { ib.innerHTML = tpl(l.insightBurn, { ha: U.fmt(Math.round(r.ha / 10) * 10, state.lang) }); state.burnHa = Math.round(r.ha / 10) * 10; fitInsight(); }
    } else { el.textContent = '—'; sub.textContent = r.status === 'unavailable' ? l.burnNA : r.status === 'toolarge' ? l.burnBig : l.burnErr; }
  }, 500);
}

// ------------------------------------------------------------ time-lapse (camera stays anchored, no auto-rotation)
async function play() {
  const s = state.series;
  state.playing = true;
  $('icoPlay').innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
  $('btnPlay').setAttribute('aria-label', L().pause);
  globeApi.setAutoRotate(false);
  globeApi.recenter(900);
  let t = state.t >= s.n - 1 ? 0 : state.t;
  const l = L();
  const frameMs = 260;
  while (state.playing && t < s.n) {
    const started = performance.now();
    const y = U.yearOf(t), m = U.monthOf(t);
    state.t = t;
    await showGlobeMonth(t, { instant: false, rings: false });
    if (!state.playing) break;
    calendar.setPlaying(t);
    const v = values()[t];
    $('hudMonth').textContent = `${l.months[m]} ${y}`;
    $('hudValue').textContent = `${U.fmt(v, state.lang)} ${U.isRecon(t) ? '· MODIS → VIIRS' : '· VIIRS'}`;
    $('timeRange').value = t; $('timeLabel').textContent = `${l.months[m]} ${y}`;
    await U.sleep(Math.max(30, frameMs - (performance.now() - started)));
    t++;
  }
  stop();
}
function stop() {
  const was = state.playing;
  state.playing = false;
  calendar.setPlaying(null);
  $('icoPlay').innerHTML = '<path d="M7 4v16l13-8z"/>';
  $('btnPlay').setAttribute('aria-label', L().play);
  if (state.aoi.kind === 'world') globeApi.setAutoRotate(state.userRotate);
  if (was && state.series) selectMonth(Math.min(state.t, state.series.n - 1));
}

// ------------------------------------------------------------ rendering helpers
function renderAOIHead() {
  const l = L(), a = state.aoi, s = state.series, last = s.n - 1;
  if (a.kind === 'country') { const c = countryByFid(a.id); if (c) a.name = cName(c); }
  if (a.kind === 'region' && a.unit) { a.name = uName(a.unit); a.type = uType(a.unit); }
  if (a.kind === 'sub' && a.unit) a.parentName = uName(a.unit);
  const subKind = adm2Kind(true);
  $('aoiKicker').textContent = a.kind === 'polygon' ? (l.placeTypes[a.type] || l.kicker.polygon) : a.kind === 'region' ? a.type : a.kind === 'sub' ? subKind : l.kicker[a.kind];
  $('aoiName').textContent = a.name;
  const lastLbl = `${l.months[U.monthOf(last)]} ${U.yearOf(last)}`;
  const areaTxt = a.areaHa ? ` · ${U.fmt(a.areaHa / 100, state.lang)} km²` : '';
  const ctry = a.country ? cName(a.country) : '';
  if (a.kind === 'circle') $('aoiMeta').textContent = `${a.lat.toFixed(3)}°, ${a.lon.toFixed(3)}° · ${tpl(l.radiusLabel, { r: a.radiusKm })} · ${s.cells.length} × 0.25° ${l.cells}`;
  else if (a.kind === 'polygon') $('aoiMeta').textContent = `${a.full || ''}${areaTxt} · ${s.cells.length} × 0.25° ${l.cells}`;
  else if (a.kind === 'region') $('aoiMeta').textContent = `${[a.unit.iso, ctry].filter(Boolean).join(' · ')}${areaTxt} · ${s.cells.length} × 0.25° ${l.cells}`;
  else if (a.kind === 'sub') $('aoiMeta').textContent = `${[a.parentName, ctry].filter(Boolean).join(', ')}${areaTxt} · ${s.cells.length} × 0.25° ${l.cells} · geoBoundaries`;
  else $('aoiMeta').textContent = tpl(l.countryMeta, { last: lastLbl });
  // Source and licence of the department boundaries, on hover.
  $('aoiMeta').title = a.kind === 'sub' && state.adm2 && state.adm2.source ? `${state.adm2.source}${state.adm2.license ? ` · ${state.adm2.license}` : ''}` : '';
  renderCrumbs();
  syncFilters();
  renderRanking();
  $('selActions').hidden = a.kind === 'world';
  document.body.classList.toggle('has-sel', a.kind !== 'world');
  $('btnUpTxt').textContent = parentTarget().label;
  if (state.meta && state.meta.lastDate) {
    const [fy, fm, fd] = state.meta.lastDate.split('-').map(Number);
    $('freshTxt').textContent = tpl(l.fresh, { d: `${fd} ${l.months[fm - 1]} ${fy}` });
    $('fresh').title = l.freshTitle;
  }
  put($('banner'), 'banner', { last: lastLbl });
  const chips = $('presetChips');
  chips.innerHTML = '';
  const k = document.createElement('span'); k.className = 'chip label'; k.textContent = l.presets; chips.appendChild(k);
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = p.label;
    b.addEventListener('click', () => pickPreset(p));
    chips.appendChild(b);
  }
}

// ------------------------------------------------------------ same page shape in every language
// A text built from a template: written in the current language, with room for its longest translation.
function put(el, key, vars = {}) {
  const texts = Object.keys(I18N).map(g => tpl(I18N[g][key], vars)), sig = `${texts.join('|')}|${el.clientWidth}`;
  if (el._sig !== sig && el.offsetParent) {
    el._sig = sig; el.style.minHeight = '';
    let h = 0;
    for (const x of texts) { el.textContent = x; h = Math.max(h, el.getBoundingClientRect().height); }
    el.style.minHeight = `${Math.ceil(h)}px`;
  }
  el.textContent = tpl(L()[key], vars);
}
// The summary sentence reserves the height of its longest translation.
function fitInsight() {
  const el = $('insight');
  if (!state.insightAll || !el.clientWidth) return;
  let ghost = $('insightGhost');
  if (!ghost) {
    ghost = document.createElement('p');
    ghost.id = 'insightGhost'; ghost.className = 'insight'; ghost.setAttribute('aria-hidden', 'true');
    ghost.style.cssText = 'position:absolute;left:0;top:0;margin:0;visibility:hidden;pointer-events:none';
    el.parentElement.appendChild(ghost);
  }
  ghost.style.width = `${el.clientWidth}px`;
  let h = 0;
  for (const g of Object.keys(I18N)) {
    ghost.innerHTML = state.insightAll[g] + (state.burnHa != null ? tpl(I18N[g].insightBurn, { ha: U.fmt(state.burnHa, g) }) : '');
    h = Math.max(h, ghost.offsetHeight);
  }
  el.style.minHeight = `${h}px`;
}
// Every translated label reserves the room of its longest version: buttons and menu entries keep their width,
// paragraphs keep their height, and the long texts written once per language (method, limitations) match.
function stabilizeLayout() {
  const langs = Object.keys(I18N), WIDE = '.topbar, .hud-tr, .sel-actions, .controls, .downloads, .rc-head, .per-presets';
  const jobs = [];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const texts = langs.map(g => I18N[g][el.dataset.i18n]).filter(x => typeof x === 'string');
    if (texts.length < 2 || texts.every(x => x === texts[0]) || !el.offsetParent) return;
    el.style.minWidth = ''; el.style.minHeight = '';
    jobs.push({ el, texts, wide: !!el.closest(WIDE) });
  });
  for (const j of jobs) {
    const cur = j.el.textContent;
    j.w = 0; j.h = 0;
    for (const x of j.texts) { j.el.textContent = x; const r = j.el.getBoundingClientRect(); j.w = Math.max(j.w, r.width); j.h = Math.max(j.h, r.height); }
    j.el.textContent = cur;
  }
  for (const j of jobs) {
    if (j.wide) {
      if (getComputedStyle(j.el).display === 'inline') j.el.style.display = 'inline-block';
      j.el.style.minWidth = `${Math.ceil(j.w)}px`; j.el.style.textAlign = 'center';
    } else j.el.style.minHeight = `${Math.ceil(j.h)}px`;
  }
  const groups = new Map();
  document.querySelectorAll('[data-lang]').forEach(el => {
    const key = el.parentElement, cls = el.className || '-';
    if (!groups.has(key)) groups.set(key, new Map());
    if (!groups.get(key).has(cls)) groups.get(key).set(cls, []);
    groups.get(key).get(cls).push(el);
  });
  for (const byClass of groups.values()) for (const els of byClass.values()) {
    let h = 0;
    for (const el of els) { const was = el.hidden; el.hidden = false; el.style.minHeight = ''; h = Math.max(h, el.offsetHeight); el.hidden = was; }
    if (h) for (const el of els) el.style.minHeight = `${h}px`;
  }
  fitInsight();
}

// One level up from the current selection (the "back" button and the Escape key).
function parentTarget() {
  const a = state.aoi;
  if (a.kind === 'sub') return { label: a.unit ? uName(a.unit) : a.parentName, go: () => pickRegion(a.a3, a.uid, { t: state.t }) };
  if (a.kind === 'region' && a.country) return { label: cName(a.country), go: () => pickCountry(a.country, { t: state.t }) };
  if (a.kind === 'circle' || a.kind === 'polygon') {
    const f = state.worldFeats && a.lat != null ? pickFeature(state.worldFeats, a.lat, a.lon) : null, c = f && featFid(f) != null ? countryByFid(featFid(f)) : null;
    if (c) return { label: cName(c), go: () => pickCountry(c, { t: state.t }) };
  }
  return { label: L().world, go: () => pickWorld({ t: state.t }) };
}

// 3D globe (default) or 2D map.
function setMapView(v) {
  state.map = v;
  globeApi.setMode(v);
  $('v3d').classList.toggle('on', v === '3d'); $('v2d').classList.toggle('on', v === '2d');
  $('v3d').setAttribute('aria-pressed', v === '3d'); $('v2d').setAttribute('aria-pressed', v === '2d');
  document.body.classList.toggle('view-2d', v === '2d');
  if (state.lastPts) renderPointsLegend(...state.lastPts);
  if (state.series) writeHash();
}

// Sticky header: sliding section marker, reading progress, and its height for the sticky map.
function setupNav() {
  const bar = $('topbar'), nav = $('nav'), ink = $('navInk'), links = [...nav.querySelectorAll('a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  let active = null;
  const moveInk = a => {
    if (!a) { ink.style.opacity = '0'; return; }
    ink.style.opacity = '1'; ink.style.width = `${a.offsetWidth}px`; ink.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  links.forEach(a => { a.addEventListener('mouseenter', () => moveInk(a)); a.addEventListener('focus', () => moveInk(a)); });
  nav.addEventListener('mouseleave', () => moveInk(active));
  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    bar.classList.toggle('scrolled', y > 24);
    const probe = bar.offsetHeight + 90;
    let cur = null;
    secs.forEach((sec, i) => { if (sec && !sec.hidden && sec.getBoundingClientRect().top <= probe) cur = links[i]; });
    if (cur !== active) { active = cur; links.forEach(a => a.classList.toggle('on', a === cur)); if (!nav.matches(':hover')) moveInk(cur); }
  };
  let raf = 0;
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
  new ResizeObserver(() => { document.documentElement.style.setProperty('--topbar-h', `${bar.offsetHeight}px`); moveInk(active); }).observe(bar);
  onScroll();
}

// Breadcrumb: World > Country > Province / state > Department
function renderCrumbs() {
  const l = L(), a = state.aoi, items = [{ k: 'world', label: l.world }];
  const c = a.kind === 'country' ? countryByFid(a.id) : a.country;
  if (c && a.kind !== 'world') items.push({ k: 'country', label: cName(c) });
  if ((a.kind === 'region' || a.kind === 'sub') && a.unit) items.push({ k: 'region', label: uName(a.unit) });
  if (a.kind === 'sub') items.push({ k: 'sub', label: a.name });
  if (a.kind === 'circle' || a.kind === 'polygon') items.push({ k: 'self', label: a.name });
  const el = $('crumbs');
  el.innerHTML = items.map((it, i) => (i === items.length - 1 ? `<span aria-current="page">${it.label}</span>` : `<button type="button" data-k="${it.k}">${it.label}</button><i aria-hidden="true">›</i>`)).join('');
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k;
    if (k === 'world') pickWorld({ t: state.t });
    else if (k === 'country' && c) pickCountry(c, { t: state.t });
    else if (k === 'region') pickRegion(a.a3, a.uid, { t: state.t });
  }));
}

// Filters: country -> province / state -> department / county (third level loads on demand).
function populateCountrySelect() {
  const sel = $('selCountry'), l = L();
  const list = [...state.countries].filter(c => c.total > 0).sort((x, y) => cName(x).localeCompare(cName(y), state.lang));
  sel.innerHTML = `<option value="">${l.fAll}</option>` + list.map(c => `<option value="${c.id}">${cName(c)}</option>`).join('');
}
function syncFilters() {
  const a = state.aoi, l = L();
  const fid = a.kind === 'country' ? a.id : a.country ? a.country.id : null;
  $('selCountry').value = fid != null && (a.kind === 'country' || a.kind === 'region' || a.kind === 'sub') ? String(fid) : '';
  const reg = $('selRegion'), file = state.regions;
  const deep = (a.kind === 'country' || a.kind === 'region' || a.kind === 'sub') && file && a.a3 === file.a3;
  $('fRegionWrap').hidden = !deep;
  if (deep) {
    const units = [...file.units].sort((x, y) => uName(x).localeCompare(uName(y), state.lang));
    const counts = new Map();
    for (const u of units) { const k = uType(u); counts.set(k, (counts.get(k) || 0) + 1); }
    const typ = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || l.fRegion;
    $('fRegionLbl').textContent = `${typ} (${units.length})`;
    reg.innerHTML = `<option value="">${tpl(l.fAllOf, { x: a.kind === 'country' ? a.name : cName(a.country) || file.admin })}</option>` + units.map(u => `<option value="${u.id}">${uName(u)}</option>`).join('');
    reg.value = a.kind === 'region' || a.kind === 'sub' ? a.uid : '';
  }
  const sub = $('selAdm2'), d = state.adm2;
  const inRegion = a.kind === 'region' || a.kind === 'sub';
  $('fAdm2Wrap').hidden = !inRegion;
  if (inRegion && d && d.uid === a.uid) {
    sub.disabled = !!d.none;
    $('fAdm2Lbl').textContent = d.none ? l.fAdm2 : `${adm2Kind(false)} (${d.features.length})`;
    sub.innerHTML = d.none ? `<option value="">${l.adm2None}</option>` : `<option value="">${tpl(l.fAllOf, { x: a.parentName || a.name })}</option>` + d.features.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    sub.value = a.kind === 'sub' ? a.sid : '';
  }
}

// Ranking: where is it burning this month? Countries at world level, provinces / states inside a country.
function rankingItems() {
  const a = state.aoi;
  if (a.kind === 'world') {
    if (!state.countriesH) return null;
    return state.countries.filter(c => state.countriesH.H[c.id]).map(c => ({ name: cName(c), sub: '', arr: state.countriesH.H[c.id], go: () => pickCountry(c, { t: state.t }) }));
  }
  // Inside a province: rank its departments / counties when we have them.
  const d = state.adm2;
  if ((a.kind === 'region' || a.kind === 'sub') && d && d.uid === a.uid && !d.none && d.H) {
    return d.features.map(f => ({ name: f.name, sub: '', arr: d.H[f.id], sel: a.kind === 'sub' && a.sid === f.id, go: () => pickSub(f, { t: state.t }) }));
  }
  const file = state.regions;
  if (!file || !(a.kind === 'country' || a.kind === 'region' || a.kind === 'sub') || a.a3 !== file.a3) return null;
  return file.units.map(u => ({ name: uName(u), sub: uType(u), arr: file.H[u.id], sel: (a.kind === 'region' || a.kind === 'sub') && a.uid === u.id, go: () => pickRegion(file.a3, u.id, { t: state.t }) }));
}
function renderRanking() {
  const card = $('rankSec'), l = L(), a = state.aoi;
  const items = state.series ? rankingItems() : null;
  if (!items || items.length < 2) { card.hidden = true; return; }
  card.hidden = false;
  const t = state.t, mo = `${l.monthsLong[U.monthOf(t)]} ${U.yearOf(t)}`;
  const rows = items.map(it => ({ ...it, st: seriesStats(it.arr, t) })).sort((x, y) => y.st.v - x.st.v);
  const active = rows.filter(r => r.st.v > 0).length;
  const inProv = (a.kind === 'region' || a.kind === 'sub') && state.adm2 && state.adm2.uid === a.uid && !state.adm2.none && state.adm2.H;
  const where = a.kind === 'country' ? a.name : inProv ? (a.unit ? uName(a.unit) : a.name) : cName(a.country) || '';
  $('rankTitle').textContent = a.kind === 'world' ? tpl(l.rankWorld, { m: mo }) : tpl(l.rankRegions, { m: mo, c: where });
  put($('rankSub'), 'rankSub', { n: U.fmt(active, state.lang), total: U.fmt(rows.length, state.lang) });
  const top = rows[0] && rows[0].st.v > 0 ? rows[0].st.v : 1;
  const limit = state.rankAll ? rows.length : 8;
  let shown = rows.slice(0, limit);
  const selRow = rows.findIndex(r => r.sel);
  if (selRow >= limit) shown = [...shown, rows[selRow]];
  $('rankList').innerHTML = shown.map(r => {
    const i = rows.indexOf(r);
    const an = r.st.anom, cls = an > 0.25 ? 'hot' : an < -0.2 ? 'cool' : '';
    const anTxt = r.st.v > 0 || r.st.med > 0 ? (isFinite(an) ? U.pct(an, state.lang) : l.newActivity) : '—';
    return `<button type="button" class="rk${r.sel ? ' sel' : ''}" data-i="${i}" role="listitem"><span class="rk-n">${i + 1}</span><span class="rk-name">${r.name}${r.sub ? `<small>${r.sub}</small>` : ''}</span><span class="rk-bar"><i style="width:${Math.max(0.5, (100 * r.st.v) / top).toFixed(1)}%"></i></span><span class="rk-v">${U.fmt(r.st.v, state.lang)}</span><span class="rk-a ${cls}">${anTxt}</span></button>`;
  }).join('');
  $('rankList').querySelectorAll('.rk').forEach(b => b.addEventListener('click', () => rows[Number(b.dataset.i)].go()));
  $('rankMore').hidden = rows.length <= 8;
  $('rankMore').textContent = state.rankAll ? l.rankLess : tpl(l.rankMore, { n: rows.length });
}

function renderLegend() {
  const l = L();
  const ramp = state.mode === 'anomaly' ? U.cssGradient(U.DIVERGING) : U.cssGradient(U.INFERNO);
  const ends = state.mode === 'anomaly' ? [l.below, l.above] : [l.low, l.high];
  $('legend').innerHTML = `<div class="ramp-wrap"><span>${ends[0]}</span><div class="ramp" style="background:${ramp}"></div><span>${ends[1]}</span>${state.mode === 'counts' ? '<span>(log)</span>' : '<span>(÷4 … ×4)</span>'}</div>
    <div class="keys"><span><i class="sw hatch"></i>${l.reconKey}</span><span><i class="sw" style="background:${U.inferno(0.7)}"></i>${l.obsKey}</span></div>`;
}

function renderEras() {
  const n = state.meta.months, l = L();
  const eras = [[0, 20, '#6f6a61', l.eraTerra], [20, 135, '#b5651d', l.eraAqua], [135, n, '#ece8df', l.eraViirs]];
  $('eraStrip').innerHTML = eras.map(([a, b, c]) => `<i style="width:${((b - a) / n) * 100}%;background:${c}"></i>`).join('');
  $('eraLegend').innerHTML = eras.map(([, , c, name]) => `<span style="--c:${c}">${name}</span>`).join('');
}

function partialInfo() {
  const d = state.meta && state.meta.lastDate;
  if (!d || !state.series) return null;
  const [y, m, day] = d.split('-').map(Number);
  const t = U.tOf(y, m - 1);
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return t === state.series.n - 1 && day < daysIn ? { t, date: d } : null;
}

function showTip(t, rect) {
  const tip = $('tooltip');
  if (t == null) { tip.classList.remove('show'); return; }
  const l = L(), s = state.series, st = monthStats(t), m = U.monthOf(t), y = U.yearOf(t);
  const src = U.isRecon(t) ? tpl(l.srcRecon, { sat: U.refSatOf(t) }) : tpl(l.srcObs, { sat: U.refSatOf(t) });
  tip.innerHTML = `<div class="t">${l.monthsLong[m]} ${y}</div>
    <div class="r"><span>${l.tipH}</span><b>${U.fmt(s.H[t], state.lang)}</b></div>
    ${U.isRecon(t) ? `<div class="r"><span>${l.tipRange}</span><b>${U.fmt(s.lo[t], state.lang)}–${U.fmt(s.hi[t], state.lang)}</b></div>` : ''}
    <div class="r"><span>${l.tipNaive}</span><b>${U.fmt(s.naive[t], state.lang)}</b></div>
    <div class="r"><span>${l.tipMed}</span><b>${U.fmt(st.med, state.lang)}</b></div>
    <div class="r"><span>${l.tipAnom}</span><b>${isFinite(st.anom) ? U.pct(st.anom, state.lang) : '∞'}</b></div>
    <div class="r"><span>${l.tipSrc}</span><b>${src}</b></div>`;
  tip.style.left = `${Math.min(window.innerWidth - 230, rect.right + 10)}px`;
  tip.style.top = `${Math.max(10, rect.top - 10)}px`;
  tip.classList.add('show');
}

function drawValidation() {
  const v = state.validation, l = L();
  const row = (k, e, n, f) => `<div class="metric"><div class="k">${k}</div>
    <div class="row"><span>${l.engine}</span><b>${f(e)}</b></div>
    <div class="row naive"><span>${l.naiveF}</span><b>${f(n)}</b></div></div>`;
  const p = x => `${U.fmt(x * 100, state.lang, 1)}%`;
  $('metrics').innerHTML = row(l.mdape, v.engine.mdape, v.naive.mdape, p) + row(l.bias, v.engine.bias, v.naive.bias, x => U.pct(x, state.lang)) + row(l.rlog, v.engine.rlog, v.naive.rlog, x => U.fmt(x, state.lang, 3));
  put($('pairsNote'), 'pairs', { n: U.fmt(v.pairs, state.lang) });
  const h = state.handover;
  $('handover').hidden = !h;
  if (h) {
    const one = (k, val, sub) => `<div class="metric"><div class="k">${k}</div><div class="row"><span>${sub}</span><b>${val}</b></div></div>`;
    $('handMetrics').innerHTML = one(l.handErr, p(h.mdape), l.engine) + one(l.handBias, U.pct(h.bias, state.lang), `NOAA-20 × ${U.fmt(h.factor, state.lang, 3)}`) + one(l.handWithin, `${U.fmt(h.within10 * 100, state.lang)}%`, tpl(l.handWithin20, { p: U.fmt(h.within20 * 100, state.lang) }));
    put($('handNote'), 'handPairs', { n: U.fmt(h.pairs, state.lang), o: U.fmt(h.observed, state.lang), q: U.fmt(h.predicted, state.lang) });
  }
  drawScatter(charts.scatter, { validation: v, labels: { engine: l.engine, naive: l.naiveF, obs: l.obs, pred: l.pred } });
  drawDrift(charts.drift, { validation: v, lang: state.lang, labels: { obsViirs: l.obsViirs, predAqua: l.predAqua, driftZone: l.driftZone } });
}

// ------------------------------------------------------------ exports
function areaSlug() { return U.slug(state.aoi.name) || 'area'; }
function exportCalendarCSV() {
  const s = state.series, v = values(), l = I18N.en;
  const rows = [['year', ...l.months, 'total'].join(',')];
  const [ya, yb] = yearRange();
  for (let y = ya; y <= yb; y++) {
    const cells = []; let tot = 0;
    for (let m = 0; m < 12; m++) { const t = U.tOf(y, m); if (t < 0 || t >= s.n) cells.push(''); else { cells.push(v[t].toFixed(1)); tot += v[t]; } }
    rows.push([y, ...cells, tot.toFixed(1)].join(','));
  }
  U.download(`firesync_calendar_${areaSlug()}_${state.view}.csv`, rows.join('\n'));
  toast(L().saved);
}
function exportSeriesCSV() {
  const s = state.series;
  const head = ['month', 'harmonized_viirs_equivalent', 'likely_low', 'likely_high', 'provenance', 'reference_satellite', 'naive_splice_raw'];
  const sats = s.raw ? Object.keys(s.raw).filter(k => s.raw[k]) : [];
  head.push(...sats.map(k => `raw_${U.slug(k)}`));
  const rows = [head.join(',')];
  const [ya, yb] = yearRange();
  for (let t = 0; t < s.n; t++) {
    if (U.yearOf(t) < ya || U.yearOf(t) > yb) continue;
    const y = U.yearOf(t), m = U.monthOf(t);
    rows.push([`${y}-${String(m + 1).padStart(2, '0')}`, s.H[t].toFixed(1), s.lo[t].toFixed(1), s.hi[t].toFixed(1), U.isRecon(t) ? 'reconstructed' : 'observed', U.refSatOf(t), s.naive[t].toFixed(0), ...sats.map(k => s.raw[k][t] ?? 0)].join(','));
  }
  U.download(`firesync_series_${areaSlug()}.csv`, rows.join('\n'));
  toast(L().saved);
}
function exportPNG() {
  const s = state.series, v = values(), l = L();
  const [y0, y1] = yearRange(), rowsN = y1 - y0 + 1;
  const cw = 58, ch = 24, left = 70, top = 96, W = left + 12 * cw + 90, Hh = top + rowsN * ch + 70;
  const c = document.createElement('canvas'); c.width = W * 2; c.height = Hh * 2;
  const g = c.getContext('2d'); g.scale(2, 2);
  g.fillStyle = '#0e0d0b'; g.fillRect(0, 0, W, Hh);
  g.fillStyle = '#ece8df'; g.font = '600 22px "Source Serif 4", Georgia, serif'; g.fillText(`${state.aoi.name}`, 24, 38);
  g.fillStyle = '#a49f94'; g.font = '13px "IBM Plex Sans", sans-serif';
  g.fillText(`FireSync · ${l.calTitle} · ${state.view === 'naive' ? l.naive : l.harmonized} · ${state.mode === 'anomaly' ? l.anomaly : l.counts}`, 24, 60);
  g.font = '11px "IBM Plex Sans", sans-serif';
  l.months.forEach((mm, i) => g.fillText(mm, left + i * cw + 16, top - 10));
  const scale = U.logScale(v, s.n);
  g.font = '10px "IBM Plex Mono", monospace';
  for (let y = y1, r = 0; y >= y0; y--, r++) {
    g.fillStyle = '#a49f94'; g.fillText(String(y), 24, top + r * ch + 15);
    for (let m = 0; m < 12; m++) {
      const t = U.tOf(y, m); if (t < 0 || t >= s.n) continue;
      const val = v[t];
      let bg;
      if (state.mode === 'anomaly') { const med = state.medians[m]; bg = U.diverging(0.5 + 0.5 * Math.max(-1, Math.min(1, Math.log2((val + 1) / (med + 1)) / 2))); }
      else { const x = scale(val); bg = x < 0 ? '#1c1a16' : U.inferno(0.04 + 0.96 * x); }
      g.fillStyle = bg; g.fillRect(left + m * cw, top + r * ch, cw - 2, ch - 2);
      if (U.isRecon(t)) { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; for (let k = -ch; k < cw; k += 5) { g.beginPath(); g.moveTo(left + m * cw + k, top + r * ch + ch - 2); g.lineTo(left + m * cw + k + ch - 2, top + r * ch); g.stroke(); } }
      g.fillStyle = U.textOn(bg); g.fillText(U.compact(val), left + m * cw + 8, top + r * ch + 15);
    }
  }
  g.fillStyle = '#716c62'; g.font = '11px "IBM Plex Sans", sans-serif';
  g.fillText('Data: NASA FIRMS (MODIS C6.1/6.2, VIIRS 375 m). Hatched = reconstructed from MODIS. FireSync, NASA Space Apps 2026.', 24, Hh - 24);
  c.toBlob(b => { U.download(`firesync_calendar_${areaSlug()}.png`, b); toast(L().saved); });
}

// ------------------------------------------------------------ URL state
function writeHash() {
  const a = state.aoi, parts = [];
  if (a.kind === 'country') parts.push(`c=${a.id}`);
  if (a.kind === 'region') parts.push(`r=${a.a3}~${a.uid}`);
  if (a.kind === 'sub') parts.push(`r=${a.a3}~${a.uid}~${encodeURIComponent(a.sid)}`);
  if (a.kind === 'circle') parts.push(`p=${a.lat.toFixed(3)},${a.lon.toFixed(3)},${a.radiusKm}`);
  parts.push(`t=${U.yearOf(state.t)}-${String(U.monthOf(state.t) + 1).padStart(2, '0')}`);
  const [ya, yb] = yearRange();
  if (state.series && (ya !== 2000 || yb !== U.yearOf(state.series.n - 1))) parts.push(`yr=${ya}-${yb}`);
  if (state.series && state.pFrom != null && !(state.pTo === state.series.n - 1 && state.pFrom === Math.max(0, state.series.n - 12))) {
    const ym = t => `${U.yearOf(t)}-${String(U.monthOf(t) + 1).padStart(2, '0')}`;
    parts.push(`pr=${ym(state.pFrom)}~${ym(state.pTo)}`);
  }
  if (state.lang !== 'en') parts.push(`lang=${state.lang}`);
  if (state.map === '2d') parts.push('v=2d');
  history.replaceState(null, '', `#${parts.join('&')}`);
}
function readHash() {
  const h = Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map(kv => kv.split('=')));
  const out = {};
  if (h.c) out.c = h.c;
  if (h.r) { const [a3, uid, sid] = h.r.split('~').map(decodeURIComponent); if (a3 && uid) out.r = [a3, uid, sid || null]; }
  if (h.v === '2d') out.v = '2d';
  if (h.p) { const [a, b, r] = h.p.split(',').map(Number); if (isFinite(a) && isFinite(b)) out.p = [a, b, r || 150]; }
  if (h.t) { const [y, m] = h.t.split('-').map(Number); out.t = U.tOf(y, m - 1); }
  if (h.lang === 'es') state.lang = 'es';
  if (h.yr) { const [a, b] = h.yr.split('-').map(Number); if (a >= 2000 && b >= a) { state.yFrom = a; state.yTo = b; } }
  if (h.pr) {
    const [a, b] = h.pr.split('~').map(s => s.split('-').map(Number));
    if (a && b && a[0] >= 2000 && b[0] >= 2000 && a[1] >= 1 && b[1] >= 1) { state.pFrom = Math.max(0, U.tOf(a[0], a[1] - 1)); state.pTo = Math.max(0, U.tOf(b[0], b[1] - 1)); }
  }
  state.pendingHash = out;
}

// ------------------------------------------------------------ UI wiring
function applyLang() {
  const l = L();
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = l[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = l[el.dataset.i18nPh]; });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = l[el.dataset.i18nTitle]; });
  document.querySelectorAll('[data-lang]').forEach(el => { el.hidden = el.dataset.lang !== state.lang; });
  $('langEn').classList.toggle('on', state.lang === 'en');
  $('langEs').classList.toggle('on', state.lang === 'es');
}

function setupUI() {
  const seg = (a, b, key, va, vb) => {
    $(a).addEventListener('click', () => { state[key] = va; $(a).classList.add('on'); $(b).classList.remove('on'); selectMonth(state.t); });
    $(b).addEventListener('click', () => { state[key] = vb; $(b).classList.add('on'); $(a).classList.remove('on'); selectMonth(state.t); });
  };
  seg('mCounts', 'mAnom', 'mode', 'counts', 'anomaly');
  seg('vHarm', 'vNaive', 'view', 'harmonized', 'naive');
  $('baseSel').addEventListener('change', e => { state.baseline = e.target.value; selectMonth(state.t); });
  const fillYears = () => {
    const last = state.meta ? U.yearOf(state.meta.months - 1) : 2026, [ya, yb] = yearRange();
    const opts = sel => Array.from({ length: last - 2000 + 1 }, (_, i) => 2000 + i).map(y => `<option value="${y}"${y === sel ? ' selected' : ''}>${y}</option>`).join('');
    $('yFrom').innerHTML = opts(ya); $('yTo').innerHTML = opts(yb);
  };
  fillYears();
  const onYears = () => {
    let a = Number($('yFrom').value), b = Number($('yTo').value);
    if (a > b) [a, b] = [b, a];
    state.yFrom = a; state.yTo = b; fillYears();
    const [ya, yb] = yearRange();
    const t = U.yearOf(state.t) < ya || U.yearOf(state.t) > yb ? Math.min(state.series.n - 1, U.tOf(yb, U.monthOf(state.t))) : state.t;
    selectMonth(Math.max(0, t));
  };
  $('yFrom').addEventListener('change', onYears);
  $('yTo').addEventListener('change', onYears);
  const setLang = lang => { state.lang = lang; applyLang(); if (state.aoi.kind === 'world') state.aoi.name = L().world; populateCountrySelect(); renderAOIHead(); renderEras(); selectMonth(state.t); drawValidation(); stabilizeLayout(); searchHint(); };
  $('langEn').addEventListener('click', () => setLang('en'));
  $('langEs').addEventListener('click', () => setLang('es'));
  $('btnWorld').addEventListener('click', () => pickWorld({ t: state.t }));
  $('btnPlay').addEventListener('click', () => (state.playing ? stop() : play()));
  let scrubT;
  $('timeRange').addEventListener('input', e => {
    if (state.playing) stop();
    const t = Number(e.target.value);
    scrubMonth(t);
    clearTimeout(scrubT); scrubT = setTimeout(() => selectMonth(t), 150);
  });
  $('btnRotate').addEventListener('click', () => {
    if (globeApi.anchored) { globeApi.recenter(); return; }
    state.userRotate = !globeApi.autoRotate; globeApi.setAutoRotate(state.userRotate); $('btnRotate').classList.toggle('on', state.userRotate);
  });
  $('btnClouds').addEventListener('click', () => $('btnClouds').classList.toggle('on', globeApi.toggleClouds()));
  $('btnHome').addEventListener('click', () => { if (globeApi.anchored) globeApi.recenter(); else globeApi.home(); });
  $('btnZoomIn').addEventListener('click', () => globeApi.zoomBy(0.6));
  $('btnZoomOut').addEventListener('click', () => globeApi.zoomBy(1 / 0.6));
  $('v3d').addEventListener('click', () => setMapView('3d'));
  $('v2d').addEventListener('click', () => setMapView('2d'));
  // Click mode: regions (country -> province / state -> department) or a circle of adjustable radius.
  const setPickMode = m => {
    const was = state.pickMode;
    state.pickMode = m;
    $('pmRegion').classList.toggle('on', m === 'region'); $('pmCircle').classList.toggle('on', m === 'circle');
    $('pmRegion').setAttribute('aria-pressed', m === 'region'); $('pmCircle').setAttribute('aria-pressed', m === 'circle');
    $('radiusCtl').classList.toggle('on', m === 'circle' || state.aoi.kind === 'circle');
    document.body.classList.toggle('mode-circle', m === 'circle');
    if (m === 'region') globeApi.setGhost(null);
    // A circle sized to what is on screen (about 70 px of radius), so it is never a dot at world scale.
    if (m === 'circle' && was !== 'circle' && state.aoi.kind !== 'circle') {
      const km = globeApi.kmPerPx() * 70, step = km > 300 ? 50 : 10;
      const r = Math.max(20, Math.min(1000, Math.round(km / step) * step));
      state.radiusKm = r; $('radiusRange').value = r; $('radiusVal').textContent = r;
    }
    $('globeHint').textContent = m === 'circle' ? L().pickHintCircle : L().pickHint;
    $('globeHint').style.opacity = '1';
    clearTimeout(setPickMode.t); setPickMode.t = setTimeout(() => { $('globeHint').style.opacity = '0'; }, 5000);
    // Back to regions with a circle still on the map: drop the circle and open the country under it.
    if (m === 'region' && was === 'circle' && state.aoi.kind === 'circle') parentTarget().go();
    renderHover();
  };
  $('pmRegion').addEventListener('click', () => setPickMode('region'));
  $('pmCircle').addEventListener('click', () => setPickMode('circle'));
  $('btnFill').addEventListener('click', () => {
    state.fill = !state.fill;
    $('btnFill').classList.toggle('on', state.fill); $('btnFill').setAttribute('aria-pressed', state.fill);
    restyleRegions(); if (state.lastPts) renderPointsLegend(...state.lastPts);
  });
  // Leave the current selection: one level up, or all the way to the world.
  $('btnUp').addEventListener('click', () => parentTarget().go());
  $('btnClear').addEventListener('click', () => pickWorld({ t: state.t }));
  document.addEventListener('keydown', e => {
    const typing = /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
    if (e.key === 'Escape' && !typing && state.aoi.kind !== 'world') parentTarget().go();
    if (e.key === '/' && !typing) { e.preventDefault(); $('search').focus(); }
  });
  $('radiusPresets').addEventListener('click', e => {
    const b = e.target.closest('button[data-r]');
    if (!b) return;
    $('radiusRange').value = b.dataset.r;
    $('radiusRange').dispatchEvent(new Event('input'));
  });
  setupNav();

  // The logo works like on any site: back to the start. World, latest month, no filters, 3D, top of the page.
  // The language stays as chosen.
  document.querySelector('.brand').addEventListener('click', e => {
    e.preventDefault();
    if (state.playing) stop();
    Object.assign(state, { mode: 'counts', view: 'harmonized', baseline: 'viirs', yFrom: 2000, yTo: null, pFrom: null, pTo: null, fill: true, rankAll: false, userRotate: true, places: [] });
    $('mCounts').classList.add('on'); $('mAnom').classList.remove('on');
    $('vHarm').classList.add('on'); $('vNaive').classList.remove('on');
    $('baseSel').value = 'viirs';
    $('btnFill').classList.add('on'); $('btnFill').setAttribute('aria-pressed', 'true');
    $('search').value = ''; $('searchResults').classList.remove('open');
    $('popLatLon').classList.remove('open');
    fillYears();
    if (state.map !== '3d') setMapView('3d');
    if (state.pickMode !== 'region') { state.aoi = { kind: 'world' }; setPickMode('region'); }
    pickWorld({ t: state.meta.months - 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Search box: while it is empty and idle, it types examples of what can be searched.
  let hintT = 0, hintI = 0;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  searchHint = () => {
    clearTimeout(hintT);
    const inp = $('search'), base = L().search, list = L().searchEx || [];
    inp.placeholder = base;
    if (still || !list.length) return;
    const run = (word, n, back) => {
      if (document.activeElement === inp || inp.value) { inp.placeholder = base; hintT = setTimeout(() => run(list[hintI % list.length], 0, false), 2500); return; }
      inp.placeholder = n ? `${word.slice(0, n)}${n < word.length && !back ? '▏' : ''}` : base;
      if (!back && n < word.length) hintT = setTimeout(() => run(word, n + 1, false), 75);
      else if (!back) hintT = setTimeout(() => run(word, n, true), 1700);
      else if (n > 0) hintT = setTimeout(() => run(word, n - 1, true), 28);
      else { hintI++; hintT = setTimeout(() => run(list[hintI % list.length], 0, false), 1400); }
    };
    hintT = setTimeout(() => run(list[hintI % list.length], 0, false), 3200);
  };
  searchHint();
  let fitT;
  window.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(stabilizeLayout, 220); });

  // Region filters.
  populateCountrySelect();
  $('selCountry').addEventListener('change', e => {
    const v = e.target.value;
    if (!v) return pickWorld({ t: state.t });
    const c = countryByFid(Number(v));
    if (c) pickCountry(c, { t: state.t });
  });
  $('selRegion').addEventListener('change', e => {
    const v = e.target.value, a = state.aoi, file = state.regions;
    if (!file) return;
    if (v) return pickRegion(file.a3, v, { t: state.t });
    const fid = file.fid != null ? file.fid : state.fidByA3.get(file.a3);
    const c = countryByFid(fid);
    if (c) pickCountry(c, { t: state.t });
    else if (a.kind !== 'world') pickWorld({ t: state.t });
  });
  $('selAdm2').addEventListener('change', e => {
    const v = e.target.value, a = state.aoi, d = state.adm2;
    if (!d) return;
    if (!v) { if (a.kind === 'sub') pickRegion(a.a3, a.uid, { t: state.t }); return; }
    const f = d.features.find(x => String(x.id) === v);
    if (f) pickSub(f, { t: state.t });
  });
  $('rankMore').addEventListener('click', () => { state.rankAll = !state.rankAll; renderRanking(); });

  let rt;
  $('radiusRange').addEventListener('input', e => {
    const r = Number(e.target.value); $('radiusVal').textContent = r; state.radiusKm = r;
    clearTimeout(rt);
    if (state.aoi.kind === 'circle') rt = setTimeout(() => pickCircle(state.aoi.lat, state.aoi.lon, r, { t: state.t, label: state.aoi.name }), 350);
  });
  $('btnLatLon').addEventListener('click', () => { const p = $('popLatLon'); const open = !p.classList.contains('open'); p.classList.toggle('open', open); $('btnLatLon').setAttribute('aria-expanded', open); });
  $('popLatLon').addEventListener('submit', e => {
    e.preventDefault();
    const lat = Number($('inLat').value), lon = Number($('inLon').value), r = Number($('inRad').value) || 50;
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    $('popLatLon').classList.remove('open');
    pickCircle(lat, lon, Math.max(10, Math.min(1500, r)), { t: state.t });
  });

  // Search: countries instantly; provinces, cities and localities from OpenStreetMap on Enter.
  const input = $('search'), box = $('searchResults');
  let active = 0, list = [];
  const typeLabel = ty => (L().placeTypes[ty] || ty || '');
  const ensureIndex = () => {
    if (state.regionIndex || ensureIndex.p) return;
    ensureIndex.p = D.getRegionIndex().then(ix => {
      state.regionIndex = ix.units.map(r => ({ id: r[0], a3: r[1], name: r[2], name_en: r[3] || r[2], name_es: r[4] || r[2], type_en: r[5], key: normTxt([r[2], r[3], r[4]].join(' ')) }));
      // A territory that is its own country (French Guiana) has one unit with the same name: list it once, as a country.
      const perCountry = new Map();
      for (const r of state.regionIndex) perCountry.set(r.a3, (perCountry.get(r.a3) || 0) + 1);
      for (const r of state.regionIndex) r.solo = perCountry.get(r.a3) === 1 && state.fidByA3.has(r.a3);
      if (document.activeElement === input) renderList();
    }).catch(() => {});
  };
  const regionMatches = q => {
    if (!state.regionIndex || q.length < 2) return [];
    const nq = normTxt(q), out = [];
    for (const r of state.regionIndex) {
      const i = r.key.indexOf(nq);
      if (i < 0) continue;
      out.push({ r, score: (i === 0 || r.key[i - 1] === ' ' ? 0 : 1) });
    }
    out.sort((x, y) => x.score - y.score || x.r.name.length - y.r.name.length);
    return out.filter(x => !x.r.solo).slice(0, 7).map(x => ({ kind: 'region', r: x.r }));
  };
  const regionCountry = r => { const fid = state.fidByA3.get(r.a3); const c = fid != null ? countryByFid(fid) : null; return c ? cName(c) : r.a3; };
  const renderList = () => {
    const raw = input.value.trim(), q = normTxt(raw);
    const cs = (q ? state.countries.filter(c => countryKey(c).includes(q)) : state.countries).slice(0, q ? 5 : 12).map(c => ({ kind: 'country', c }));
    list = [...cs, ...regionMatches(raw), ...state.places.map(p => ({ kind: 'place', p }))];
    if (q.length >= 2) list.push({ kind: 'search', q: raw });
    box.innerHTML = list.map((it, i) => {
      const cls = i === active ? 'active' : '';
      if (it.kind === 'country') return `<button role="option" class="${cls}" data-i="${i}"><span>${cName(it.c)}</span><small>${L().country}</small></button>`;
      if (it.kind === 'region') return `<button role="option" class="${cls}" data-i="${i}"><span>${uName(it.r)}<br><small>${regionCountry(it.r)}</small></span><small>${(state.lang === 'es' ? L().typeEs[it.r.type_en] : it.r.type_en) || L().fRegion}</small></button>`;
      if (it.kind === 'place') return `<button role="option" class="${cls}" data-i="${i}"><span>${it.p.name}<br><small>${it.p.full.split(',').slice(1, 3).join(',')}</small></span><small>${typeLabel(it.p.type)}</small></button>`;
      return `<button role="option" class="${cls}" data-i="${i}"><span>${tpl(L().searchPlaces, { q: it.q })}</span><small>OSM ↵</small></button>`;
    }).join('');
    box.classList.toggle('open', list.length > 0);
  };
  const runPlaceSearch = async q => {
    box.innerHTML = `<button disabled><span>${L().searching}</span></button>`; box.classList.add('open');
    try { state.places = (await D.searchPlaces(q, state.lang)).slice(0, 8); } catch (e) { state.places = []; toast(L().searchErr); }
    active = state.places.length ? Math.min(list.length, 0) : 0;
    renderList();
    const firstPlace = list.findIndex(x => x.kind === 'place');
    if (firstPlace >= 0) { active = firstPlace; renderList(); }
  };
  const choose = it => {
    if (!it) return;
    if (it.kind === 'search') { runPlaceSearch(it.q); return; }
    box.classList.remove('open'); input.blur();
    if (it.kind === 'country') pickCountry(it.c, { t: state.t });
    else if (it.kind === 'region') pickRegion(it.r.a3, it.r.id, { t: state.t });
    else pickPlace(it.p, { t: state.t });
  };
  input.addEventListener('focus', () => { active = 0; ensureIndex(); renderList(); });
  input.addEventListener('input', () => { active = 0; state.places = []; renderList(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { active = Math.min(list.length - 1, active + 1); renderList(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); renderList(); e.preventDefault(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      const exact = state.countries.find(c => countryKey(c).split('|').includes(normTxt(q)));
      if (list[active] && (list[active].kind !== 'search' || !exact)) choose(list[active]);
      else if (exact) choose({ kind: 'country', c: exact });
    } else if (e.key === 'Escape') { box.classList.remove('open'); input.blur(); }
  });
  box.addEventListener('mousedown', e => { const b = e.target.closest('button[data-i]'); if (b) { e.preventDefault(); choose(list[Number(b.dataset.i)]); } });
  input.addEventListener('blur', () => setTimeout(() => box.classList.remove('open'), 200));

  $('dlCal').addEventListener('click', exportCalendarCSV);
  $('dlSeries').addEventListener('click', exportSeriesCSV);
  $('dlPng').addEventListener('click', exportPNG);
  $('btnShare').addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => toast(L().copied)); });
  renderEras();
}

let searchHint = () => {};
let toastT;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2000); }

// A data file that still fails after the automatic retries: say so, the click was not ignored.
window.addEventListener('unhandledrejection', e => {
  const msg = String((e.reason && e.reason.message) || '');
  if (/HTTP \d|network error|Failed to fetch/.test(msg)) { console.warn(msg); toast(L().netErr); }
});

boot().catch(err => {
  console.error(err);
  $('introStatus').textContent = `Error: ${err.message}`;
});
