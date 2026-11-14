// FireSync application wiring. Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import * as D from './data.js';
import * as U from './util.js';
import { Calendar } from './calendar.js';
import { createGlobe } from './globe.js';
import { createCharts, drawSeasonal, drawAnnual, drawScatter, drawDrift } from './charts.js';
import { I18N, tpl } from './i18n.js';

const $ = id => document.getElementById(id);
const state = {
  lang: 'en', aoi: { kind: 'world', id: 'world', name: 'World' }, series: null, t: null,
  mode: 'counts', view: 'harmonized', baseline: 'viirs', radiusKm: 150, playing: false, userRotate: true,
  meta: null, countries: [], validation: null, medians: null, places: [],
};
const L = () => I18N[state.lang];
let globeApi = null, calendar = null, charts = null;

const PRESETS = [
  { label: 'Chilecito · AR', name: 'Chilecito, La Rioja (Argentina)', lat: -29.18, lon: -67.64, r: 40, t: U.tOf(2026, 6) },
  { label: 'La Rioja · AR', place: 'Provincia de La Rioja, Argentina', t: U.tOf(2026, 6) },
  { label: 'Córdoba · AR', place: 'Provincia de Córdoba, Argentina', t: U.tOf(2020, 8) },
  { label: 'Rondônia · BR', place: 'Rondônia, Brasil', t: U.tOf(2019, 7) },
  { label: 'California · US', place: 'California, United States', t: U.tOf(2020, 7) },
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
  const [meta, countries, validation] = await Promise.all([D.getMeta(), D.getCountries(), D.getValidation()]);
  state.meta = meta; state.countries = countries.sort((a, b) => b.total - a.total); state.validation = validation;
  step(45, L().loadingGlobe);
  globeApi = createGlobe($('globe'), { onPick: (lat, lng) => { if (!state.playing) pickCircle(lat, lng, state.radiusKm); } });
  calendar = new Calendar($('calendar'), { onSelect: t => selectMonth(t), onHover: showTip });
  charts = createCharts({ seasonal: $('chSeasonal'), annual: $('chAnnual'), scatter: $('chScatter'), drift: $('chDrift') });
  setupUI();
  step(70, L().loading);
  const h = state.pendingHash;
  try {
    if (h && h.p) await pickCircle(h.p[0], h.p[1], h.p[2], { t: h.t });
    else if (h && h.c != null && countries.find(c => String(c.id) === String(h.c))) await pickCountry(countries.find(c => String(c.id) === String(h.c)), { t: h.t });
    else await pickWorld({ t: h && h.t });
  } catch (e) { console.error(e); await pickWorld({}); }
  drawValidation();
  step(100, L().ready);
  setTimeout(() => $('intro').classList.add('done'), 300);
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  setTimeout(() => { $('globeHint').style.opacity = '0'; }, 9000);
}

// ------------------------------------------------------------ areas of interest
function beginAOI() { if (state.playing) stop(); }

async function pickWorld({ t } = {}) {
  beginAOI();
  state.aoi = { kind: 'world', id: 'world', name: L().world };
  const s = await D.countrySeries('world');
  globeApi.releaseAnchor();
  globeApi.setOutline([]);
  globeApi.clearFocus();
  $('radiusCtl').classList.remove('on');
  await setSeries(s, t);
  globeApi.flyTo(-8, -45, 2.6, 1800);
  globeApi.setAutoRotate(state.userRotate);
  $('btnRotate').classList.toggle('on', state.userRotate);
}

async function pickCountry(c, { t } = {}) {
  beginAOI();
  state.aoi = { kind: 'country', id: c.id, name: c.name, lat: c.lat, lon: c.lon, bbox: c.bbox, geom: null };
  const s = await D.countrySeries(c.id);
  globeApi.hideContext();
  globeApi.setOutline([]);
  $('radiusCtl').classList.remove('on');
  const span = Math.max(c.bbox[2] - c.bbox[0], c.bbox[3] - c.bbox[1]);
  globeApi.anchorTo(c.lat, c.lon, Math.max(0.95, Math.min(2.4, span / 22)), 1800);
  $('btnRotate').classList.remove('on');
  await setSeries(s, t);
  // Real border from OpenStreetMap (outline and burned-area statistics). Fails gracefully.
  D.countryBoundary(c.name).then(g => {
    if (state.aoi.kind !== 'country' || state.aoi.id !== c.id || !g) return;
    state.aoi.geom = g; state.aoi.areaHa = D.geomAreaHa(g);
    globeApi.setOutline(D.outlineRings(g));
    updateBurned();
  });
}

async function pickCircle(lat, lon, r, { t, label } = {}) {
  beginAOI();
  state.radiusKm = r;
  $('radiusRange').value = r; $('radiusVal').textContent = r;
  const near = nearestCountry(lat, lon);
  const preset = label || (PRESETS.find(p => p.lat != null && Math.abs(p.lat - lat) < 0.01 && Math.abs(p.lon - lon) < 0.01) || {}).name;
  const name = preset || (near ? tpl(L().areaNear, { c: near.name }) : tpl(L().areaAt, { lat: lat.toFixed(2), lon: lon.toFixed(2) }));
  toast(`${name} · ${r} km`);
  const s = await D.circleSeries(lat, lon, r);
  state.aoi = { kind: 'circle', lat, lon, radiusKm: r, name, id: s.id, geom: s.geom, areaHa: s.areaHa };
  globeApi.hideContext();
  globeApi.setOutline(D.outlineRings(s.geom));
  $('radiusCtl').classList.add('on');
  globeApi.anchorTo(lat, lon, Math.max(0.14, Math.min(2.2, r / 260)), 1600);
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
  $('radiusCtl').classList.remove('on');
  const [w, so, e, n] = s.bbox;
  const span = Math.max(e - w, n - so);
  globeApi.anchorTo((so + n) / 2, (w + e) / 2, Math.max(0.14, Math.min(2.2, span / 16)), 1700);
  $('btnRotate').classList.remove('on');
  await setSeries(s, t);
}

async function pickPreset(p) {
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
    values: values(), n: s.n, mode: state.mode, baseline: baselineYears(), selT: t, firstYear: 2000, lastYear: U.yearOf(s.n - 1),
    labels: { months: l.months, year: l.year, total: l.total, median: l.median, viirsEra: l.viirsEra, modisEra: l.modisEra, aria: l.calTitle },
    monthCellLabel: (tt, v) => `${l.monthsLong[U.monthOf(tt)]} ${U.yearOf(tt)}: ${U.fmt(v, state.lang)}`,
  });
  state.medians = medians;
  renderLegend();
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
  let html;
  if (!(st.val > 0)) html = tpl(l.insightZero, { area: state.aoi.name, month: l.monthsLong[m], year: y, base, med: U.fmt(st.med, state.lang) });
  else {
    html = tpl(l.insight, {
      area: state.aoi.name, month: l.monthsLong[m], year: y, v: U.fmt(st.val, state.lang), anom: isFinite(st.anom) ? U.pct(st.anom, state.lang) : l.newActivity,
      base, med: U.fmt(st.med, state.lang), rank: st.rank, n: st.nYears, rec: st.isMax ? l.insightRec : st.isMin ? l.insightLow : '',
    });
    if (U.isRecon(t) && state.view === 'harmonized') html += tpl(l.insightRecon, { sat: U.refSatOf(t), lo: U.fmt(st.lo, state.lang), hi: U.fmt(st.hi, state.lang) });
  }
  $('insight').innerHTML = html + '<span id="insightBurn"></span>';
  const part = partialInfo();
  $('partialNote').textContent = part ? tpl(l.partial, { d: part.date }) : '';
  $('hudMonth').textContent = `${l.months[m]} ${y}`;
  $('hudValue').textContent = `${U.fmt(st.val, state.lang)} · ${isFinite(st.anom) ? U.pct(st.anom, state.lang) : ''}`;
  $('hudArea').textContent = state.aoi.name;
  $('timeRange').value = t;
  $('timeLabel').textContent = `${l.months[m]} ${y}`;
  drawSeasonal(charts.seasonal, { values: values(), n: s.n, year: y, baseline: baselineYears(), labels: { months: l.months, median: l.median, iqr: l.iqr }, lang: state.lang });
  drawAnnual(charts.annual, { series: s, lang: state.lang, selYear: y, showNaive: true, labels: { harmonized: l.harmonized, naive: l.naive, band: l.band, reconEra: l.reconEra } });
  await showGlobeMonth(t, { instant, rings: true });
  updateBurned();
  writeHash();
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
  renderPointsLegend(res, vmax);
}

function renderPointsLegend(res, vmax) {
  const l = L();
  $('ptsTitle').textContent = l.ptsTitle;
  $('ptsBody').textContent = tpl(l.ptsBody, { km: res === 1 ? '110' : '28' });
  $('ptsMax').textContent = vmax > 0 ? U.fmt(vmax, state.lang) : '—';
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
      if (ib && r.ha >= 10) ib.innerHTML = tpl(l.insightBurn, { ha: U.fmt(Math.round(r.ha / 10) * 10, state.lang) });
    } else { el.textContent = '—'; sub.textContent = r.status === 'unavailable' ? l.burnNA : l.burnErr; }
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
  $('aoiKicker').textContent = a.kind === 'polygon' ? (l.placeTypes[a.type] || l.kicker.polygon) : l.kicker[a.kind];
  $('aoiName').textContent = a.name;
  const lastLbl = `${l.months[U.monthOf(last)]} ${U.yearOf(last)}`;
  const areaTxt = a.areaHa ? ` · ${U.fmt(a.areaHa / 100, state.lang)} km²` : '';
  if (a.kind === 'circle') $('aoiMeta').textContent = `${a.lat.toFixed(3)}°, ${a.lon.toFixed(3)}° · ${tpl(l.radiusLabel, { r: a.radiusKm })} · ${s.cells.length} × 0.25° ${l.cells}`;
  else if (a.kind === 'polygon') $('aoiMeta').textContent = `${a.full || ''}${areaTxt} · ${s.cells.length} × 0.25° ${l.cells}`;
  else $('aoiMeta').textContent = tpl(l.countryMeta, { last: lastLbl });
  $('banner').textContent = tpl(l.banner, { last: lastLbl });
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
  $('pairsNote').textContent = tpl(l.pairs, { n: U.fmt(v.pairs, state.lang) });
  drawScatter(charts.scatter, { validation: v, labels: { engine: l.engine, naive: l.naiveF, obs: l.obs, pred: l.pred } });
  drawDrift(charts.drift, { validation: v, lang: state.lang, labels: { obsViirs: l.obsViirs, predAqua: l.predAqua, driftZone: l.driftZone } });
}

// ------------------------------------------------------------ exports
function areaSlug() { return U.slug(state.aoi.name) || 'area'; }
function exportCalendarCSV() {
  const s = state.series, v = values(), l = I18N.en;
  const rows = [['year', ...l.months, 'total'].join(',')];
  for (let y = 2000; y <= U.yearOf(s.n - 1); y++) {
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
  for (let t = 0; t < s.n; t++) {
    const y = U.yearOf(t), m = U.monthOf(t);
    rows.push([`${y}-${String(m + 1).padStart(2, '0')}`, s.H[t].toFixed(1), s.lo[t].toFixed(1), s.hi[t].toFixed(1), U.isRecon(t) ? 'reconstructed' : 'observed', U.refSatOf(t), s.naive[t].toFixed(0), ...sats.map(k => s.raw[k][t] ?? 0)].join(','));
  }
  U.download(`firesync_series_${areaSlug()}.csv`, rows.join('\n'));
  toast(L().saved);
}
function exportPNG() {
  const s = state.series, v = values(), l = L();
  const y0 = 2000, y1 = U.yearOf(s.n - 1), rowsN = y1 - y0 + 1;
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
  if (a.kind === 'circle') parts.push(`p=${a.lat.toFixed(3)},${a.lon.toFixed(3)},${a.radiusKm}`);
  parts.push(`t=${U.yearOf(state.t)}-${String(U.monthOf(state.t) + 1).padStart(2, '0')}`);
  if (state.lang !== 'en') parts.push(`lang=${state.lang}`);
  history.replaceState(null, '', `#${parts.join('&')}`);
}
function readHash() {
  const h = Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map(kv => kv.split('=')));
  const out = {};
  if (h.c) out.c = h.c;
  if (h.p) { const [a, b, r] = h.p.split(',').map(Number); if (isFinite(a) && isFinite(b)) out.p = [a, b, r || 150]; }
  if (h.t) { const [y, m] = h.t.split('-').map(Number); out.t = U.tOf(y, m - 1); }
  if (h.lang === 'es') state.lang = 'es';
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
  const setLang = lang => { state.lang = lang; applyLang(); if (state.aoi.kind === 'world') state.aoi.name = L().world; renderAOIHead(); renderEras(); selectMonth(state.t); drawValidation(); };
  $('langEn').addEventListener('click', () => setLang('en'));
  $('langEs').addEventListener('click', () => setLang('es'));
  $('btnWorld').addEventListener('click', () => pickWorld({ t: state.t }));
  $('btnPlay').addEventListener('click', () => (state.playing ? stop() : play()));
  $('timeRange').addEventListener('input', e => { if (state.playing) stop(); selectMonth(Number(e.target.value)); });
  $('btnRotate').addEventListener('click', () => {
    if (globeApi.anchored) { globeApi.recenter(); return; }
    state.userRotate = !globeApi.autoRotate; globeApi.setAutoRotate(state.userRotate); $('btnRotate').classList.toggle('on', state.userRotate);
  });
  $('btnClouds').addEventListener('click', () => $('btnClouds').classList.toggle('on', globeApi.toggleClouds()));
  $('btnHome').addEventListener('click', () => { if (globeApi.anchored) globeApi.recenter(); else globeApi.flyTo(-8, -45, 2.6, 1500); });
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
  const renderList = () => {
    const q = input.value.trim().toLowerCase();
    const cs = (q ? state.countries.filter(c => c.name.toLowerCase().includes(q)) : state.countries).slice(0, q ? 6 : 12).map(c => ({ kind: 'country', c }));
    list = [...cs, ...state.places.map(p => ({ kind: 'place', p }))];
    if (q.length >= 2) list.push({ kind: 'search', q: input.value.trim() });
    box.innerHTML = list.map((it, i) => {
      const cls = i === active ? 'active' : '';
      if (it.kind === 'country') return `<button role="option" class="${cls}" data-i="${i}"><span>${it.c.name}</span><small>${L().country}</small></button>`;
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
    else pickPlace(it.p, { t: state.t });
  };
  input.addEventListener('focus', () => { active = 0; renderList(); });
  input.addEventListener('input', () => { active = 0; state.places = []; renderList(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { active = Math.min(list.length - 1, active + 1); renderList(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); renderList(); e.preventDefault(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      const exact = state.countries.find(c => c.name.toLowerCase() === q.toLowerCase());
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

let toastT;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2000); }

boot().catch(err => {
  console.error(err);
  $('introStatus').textContent = `Error: ${err.message}`;
});
