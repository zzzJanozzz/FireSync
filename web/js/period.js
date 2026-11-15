// FireSync period analytics: any region + any date range -> summary, chart and downloads.
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import * as U from './util.js';
import { I18N, tpl } from './i18n.js?v=20261115c';

const $ = id => document.getElementById(id);

// ctx: { state, L, values, baselineYears, selectMonth, areaSlug, toast, onChange }
export function createPeriod(ctx) {
  const { state } = ctx;
  const cv = $('perChart');
  let bars = [];   // [{t, x0, x1}] for hit-testing
  let hoverT = null, filled = '';

  const lastT = () => state.series.n - 1;
  const clampRange = () => {
    const n = lastT();
    let a = state.pFrom, b = state.pTo;
    if (a == null || b == null) { b = n; a = Math.max(0, n - 11); }
    a = Math.max(0, Math.min(n, a)); b = Math.max(0, Math.min(n, b));
    if (a > b) [a, b] = [b, a];
    state.pFrom = a; state.pTo = b;
    return [a, b];
  };

  function fillSelects() {
    const l = ctx.L(), n = lastT(), [a, b] = clampRange();
    const y0 = U.yearOf(0), y1 = U.yearOf(n);
    const years = sel => Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i).map(y => `<option value="${y}"${y === sel ? ' selected' : ''}>${y}</option>`).join('');
    const months = sel => l.months.map((m, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${m}</option>`).join('');
    $('perFromM').innerHTML = months(U.monthOf(a)); $('perFromY').innerHTML = years(U.yearOf(a));
    $('perToM').innerHTML = months(U.monthOf(b)); $('perToY').innerHTML = years(U.yearOf(b));
  }

  function readSelects() {
    const t1 = U.tOf(Number($('perFromY').value), Number($('perFromM').value));
    const t2 = U.tOf(Number($('perToY').value), Number($('perToM').value));
    state.pFrom = t1; state.pTo = t2;
    clampRange();
    render(); ctx.onChange();
  }

  function setRange(a, b) { state.pFrom = a; state.pTo = b; clampRange(); render(); ctx.onChange(); }

  // Everything the box shows and exports, computed once.
  function stats() {
    const s = state.series, v = ctx.values(), [a, b] = clampRange(), med = state.medians || [];
    let tot = 0, lo = 0, hi = 0, exp = 0, peakT = a, above = 0, recon = 0;
    const rows = [];
    for (let t = a; t <= b; t++) {
      const m = U.monthOf(t), md = med[m] ?? 0;
      tot += v[t]; lo += s.lo[t]; hi += s.hi[t]; exp += md;
      if (v[t] > v[peakT]) peakT = t;
      if (v[t] > md) above++;
      if (U.isRecon(t)) recon++;
      rows.push({ t, v: v[t], lo: s.lo[t], hi: s.hi[t], med: md });
    }
    const n = b - a + 1;
    return { a, b, n, tot, lo, hi, exp, anom: exp > 0 ? tot / exp - 1 : null, peakT, peakV: v[peakT], above, recon, mean: tot / n, rows };
  }

  const likelyTxt = (st, l) => (st.hi - st.lo < 0.5 ? l.perExact : tpl(l.perLikely, { lo: U.fmt(st.lo, state.lang), hi: U.fmt(st.hi, state.lang) }));
  const label = (t, l = ctx.L()) => `${l.months[U.monthOf(t)]} ${U.yearOf(t)}`;
  const rangeLabel = (st, l = ctx.L()) => (st.a === st.b ? label(st.a, l) : `${label(st.a, l)} – ${label(st.b, l)}`);

  // Bars = hotspots per month (fire ramp), dashed line = median of the same month, whiskers = likely range,
  // hatched = reconstructed from MODIS. Used on screen and in the PNG report.
  function drawChart(g, x, y, w, h, st, { selT = null, hover = null, lang = state.lang, small = 11 } = {}) {
    const l = I18N[lang];
    const padL = 46, padB = 22, padT = 8, cw = w - padL - 6, chh = h - padB - padT;
    let max = 0;
    for (const r of st.rows) max = Math.max(max, r.v, r.med, st.n <= 60 ? r.hi : 0);
    max = max > 0 ? max * 1.08 : 1;
    const Y = val => y + padT + chh - (val / max) * chh;
    g.save();
    g.font = `${small}px "IBM Plex Mono", monospace`; g.textBaseline = 'middle';
    // grid
    for (let i = 0; i <= 4; i++) {
      const val = (max / 1.08) * (i / 4), yy = Y(val);
      g.strokeStyle = i === 0 ? '#3b3832' : '#2a2823'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + padL, Math.round(yy) + 0.5); g.lineTo(x + w - 6, Math.round(yy) + 0.5); g.stroke();
      g.fillStyle = '#716c62'; g.textAlign = 'right'; g.fillText(U.compact(val), x + padL - 6, yy);
    }
    const bw = cw / st.n, gap = bw > 6 ? Math.min(3, bw * 0.18) : 0;
    const scale = U.logScale(st.rows.map(r => r.v), st.n);
    const out = [];
    st.rows.forEach((r, i) => {
      const x0 = x + padL + i * bw, x1 = x0 + bw - gap, yy = Y(r.v);
      const k = scale(r.v);
      g.fillStyle = k < 0 ? '#2a2823' : U.inferno(0.25 + 0.75 * k);
      g.fillRect(x0, yy, Math.max(1, x1 - x0), y + padT + chh - yy);
      if (U.isRecon(r.t) && bw > 3) {
        g.save(); g.beginPath(); g.rect(x0, yy, x1 - x0, y + padT + chh - yy); g.clip();
        g.strokeStyle = 'rgba(255,255,255,.25)';
        for (let k2 = -chh; k2 < bw + chh; k2 += 5) { g.beginPath(); g.moveTo(x0 + k2, y + padT + chh); g.lineTo(x0 + k2 + chh, y + padT); g.stroke(); }
        g.restore();
      }
      if (st.n <= 60 && r.hi > r.lo) {
        const xm = (x0 + x1) / 2;
        g.strokeStyle = 'rgba(236,232,223,.55)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(xm, Y(r.hi)); g.lineTo(xm, Y(r.lo)); g.stroke();
      }
      if (r.t === selT) { g.strokeStyle = '#ece8df'; g.lineWidth = 2; g.strokeRect(x0 + 1, yy + 1, Math.max(1, x1 - x0 - 2), Math.max(1, y + padT + chh - yy - 2)); g.fillStyle = '#ece8df'; g.beginPath(); g.moveTo((x0 + x1) / 2 - 5, yy - 9); g.lineTo((x0 + x1) / 2 + 5, yy - 9); g.lineTo((x0 + x1) / 2, yy - 3); g.fill(); }
      if (r.t === hover) { g.strokeStyle = '#ece8df'; g.lineWidth = 1.5; g.strokeRect(x0 - 1, y + padT, x1 - x0 + 2, chh); }
      out.push({ t: r.t, x0, x1: x0 + bw });
    });
    // median line
    g.strokeStyle = '#82a9d4'; g.lineWidth = 1.6; g.setLineDash([4, 3]); g.beginPath();
    st.rows.forEach((r, i) => { const xm = x + padL + i * bw + (bw - gap) / 2, yy = Y(r.med); i ? g.lineTo(xm, yy) : g.moveTo(xm, yy); });
    g.stroke(); g.setLineDash([]);
    // x labels: a few, never overlapping
    g.fillStyle = '#a49f94'; g.textAlign = 'center'; g.textBaseline = 'top';
    const every = Math.max(1, Math.ceil(st.n / Math.max(2, Math.floor(cw / 62))));
    const ystep = Math.max(1, Math.ceil((st.n / 12) / Math.max(1, Math.floor(cw / 46))));
    st.rows.forEach((r, i) => {
      const xm = x + padL + i * bw + bw / 2;
      let txt = '';
      if (st.n > 36) { if (U.monthOf(r.t) === 0 && U.yearOf(r.t) % ystep === 0) txt = String(U.yearOf(r.t)); }
      else if (!(i % every)) txt = `${l.months[U.monthOf(r.t)]} ${String(U.yearOf(r.t)).slice(2)}`;
      if (txt) g.fillText(txt, xm, y + padT + chh + 6);
    });
    g.restore();
    return out;
  }

  function sizeCanvas() {
    const w = cv.parentElement.clientWidth || 600, h = w < 520 ? 190 : 230, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = `${h}px`; }
    return { w, h, dpr };
  }

  function paint(st) {
    const { w, h, dpr } = sizeCanvas(), g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    bars = drawChart(g, 0, 0, w, h, st, { selT: state.t, hover: hoverT });
  }

  function readout(st, t) {
    const l = ctx.L(), r = st.rows.find(q => q.t === t);
    if (!r) { $('perRead').innerHTML = `<span class="per-key"><i class="k-bar"></i>${l.perKeyBars}</span><span class="per-key"><i class="k-med"></i>${l.perKeyMed}</span><span class="per-key"><i class="k-hatch"></i>${l.perKeyRecon}</span>`; return; }
    const an = r.med > 0 ? U.pct(r.v / r.med - 1, state.lang) : '—';
    $('perRead').innerHTML = `<b>${l.monthsLong[U.monthOf(t)]} ${U.yearOf(t)}</b> · ${U.fmt(r.v, state.lang)} ${l.perHot} · ${l.median} ${U.fmt(r.med, state.lang)} · ${an}${U.isRecon(t) ? ` · ${l.perRecon1}` : ''}`;
  }

  function render() {
    if (!state.series) return;
    if (filled !== `${state.lang}|${state.series.n}`) { fillSelects(); filled = `${state.lang}|${state.series.n}`; }
    const l = ctx.L(), st = stats();
    $('perArea').textContent = state.aoi.name;
    $('perRange').textContent = `${rangeLabel(st)} · ${tpl(l.perMonths, { n: st.n })}`;
    $('perTot').textContent = U.fmt(st.tot, state.lang);
    $('perTotSub').textContent = likelyTxt(st, l);
    const an = $('perAnom');
    an.textContent = st.anom == null ? '—' : U.pct(st.anom, state.lang);
    an.className = 'v ' + (st.anom > 0.25 ? 'hot' : st.anom < -0.2 ? 'cool' : '');
    $('perAnomSub').textContent = tpl(l.perExpected, { e: U.fmt(st.exp, state.lang), b: ctx.baselineYears().join('–') });
    $('perPeak').textContent = label(st.peakT);
    $('perPeakSub').textContent = `${U.fmt(st.peakV, state.lang)} ${l.perHot}`;
    $('perAbove').textContent = `${st.above}/${st.n}`;
    $('perAboveSub').textContent = st.recon ? tpl(l.perReconN, { n: st.recon }) : l.perAboveSub;
    document.querySelectorAll('#perPresets button').forEach(b => b.classList.toggle('on', presetRange(b.dataset.p).join() === [st.a, st.b].join()));
    paint(st);
    readout(st, hoverT);
    state.perStats = st;
  }

  function presetRange(p) {
    const n = lastT(), ly = U.yearOf(n);
    if (p === '12') return [Math.max(0, n - 11), n];
    if (p === 'ytd') return [Math.max(0, U.tOf(ly, 0)), n];
    if (p === 'prev') return [U.tOf(ly - 1, 0), U.tOf(ly - 1, 11)];
    if (p === 'viirs') return [U.T_SNPP, U.tOf(2025, 11)];
    if (p === 'all') return [0, n];
    if (p === 'sel') { const y = U.yearOf(state.t); return [Math.max(0, U.tOf(y, 0)), Math.min(n, U.tOf(y, 11))]; }
    return [n - 11, n];
  }

  // ---------------------------------------------------------------- downloads
  function exportCSV() {
    const st = stats(), s = state.series, sats = s.raw ? Object.keys(s.raw).filter(k => s.raw[k]) : [];
    const q = x => `"${String(x).replace(/"/g, '""')}"`;
    const lines = [
      `# FireSync period analytics (NASA Space Apps 2026)`,
      `# area,${q(state.aoi.name)}`,
      `# period,${U.yearOf(st.a)}-${String(U.monthOf(st.a) + 1).padStart(2, '0')},${U.yearOf(st.b)}-${String(U.monthOf(st.b) + 1).padStart(2, '0')}`,
      `# series,${state.view === 'naive' ? 'naive splice (raw reference sensor)' : 'harmonized VIIRS-equivalent hotspots'}`,
      `# total,${st.tot.toFixed(1)},likely_low,${st.lo.toFixed(1)},likely_high,${st.hi.toFixed(1)}`,
      `# expected_from_median,${st.exp.toFixed(1)},anomaly_pct,${st.anom == null ? '' : (st.anom * 100).toFixed(1)},baseline,${ctx.baselineYears().join('-')}`,
      `# peak_month,${U.yearOf(st.peakT)}-${String(U.monthOf(st.peakT) + 1).padStart(2, '0')},${st.peakV.toFixed(1)}`,
      `# months_above_median,${st.above},of,${st.n}`,
      `# source,NASA FIRMS MODIS C6.1/6.2 + VIIRS 375 m; https://firesync.space`,
      ['month', 'hotspots', 'likely_low', 'likely_high', 'median_same_month', 'anomaly_pct', 'provenance', 'reference_satellite', ...sats.map(k => `raw_${U.slug(k)}`)].join(','),
    ];
    for (const r of st.rows) {
      lines.push([`${U.yearOf(r.t)}-${String(U.monthOf(r.t) + 1).padStart(2, '0')}`, r.v.toFixed(1), r.lo.toFixed(1), r.hi.toFixed(1), r.med.toFixed(1),
        r.med > 0 ? ((r.v / r.med - 1) * 100).toFixed(1) : '', U.isRecon(r.t) ? 'reconstructed' : 'observed', U.refSatOf(r.t), ...sats.map(k => s.raw[k][r.t] ?? 0)].join(','));
    }
    U.download(`firesync_period_${ctx.areaSlug()}_${fileRange(st)}.csv`, lines.join('\n'));
    ctx.toast(ctx.L().saved);
  }
  const fileRange = st => `${U.yearOf(st.a)}${String(U.monthOf(st.a) + 1).padStart(2, '0')}-${U.yearOf(st.b)}${String(U.monthOf(st.b) + 1).padStart(2, '0')}`;

  function exportJSON() {
    const st = stats();
    const ym = t => `${U.yearOf(t)}-${String(U.monthOf(t) + 1).padStart(2, '0')}`;
    const out = {
      source: 'FireSync (NASA FIRMS MODIS + VIIRS, harmonized)', url: location.href, area: state.aoi.name, kind: state.aoi.kind,
      period: { from: ym(st.a), to: ym(st.b), months: st.n }, series: state.view, baseline: ctx.baselineYears(),
      summary: { total: +st.tot.toFixed(1), likely: [+st.lo.toFixed(1), +st.hi.toFixed(1)], expected: +st.exp.toFixed(1), anomaly: st.anom == null ? null : +st.anom.toFixed(4), peak: { month: ym(st.peakT), hotspots: +st.peakV.toFixed(1) }, monthsAboveMedian: st.above, reconstructedMonths: st.recon },
      months: st.rows.map(r => ({ month: ym(r.t), hotspots: +r.v.toFixed(1), likely: [+r.lo.toFixed(1), +r.hi.toFixed(1)], median: +r.med.toFixed(1), provenance: U.isRecon(r.t) ? 'reconstructed' : 'observed', satellite: U.refSatOf(r.t) })),
    };
    U.download(`firesync_period_${ctx.areaSlug()}_${fileRange(st)}.json`, JSON.stringify(out, null, 1), 'application/json');
    ctx.toast(ctx.L().saved);
  }

  // One-page report: title, period, the four numbers and the chart.
  function exportPNG() {
    const st = stats(), l = ctx.L(), W = 1200, H = 720;
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    const g = c.getContext('2d'); g.scale(2, 2);
    g.fillStyle = '#0e0d0b'; g.fillRect(0, 0, W, H);
    // fire-ramp rule
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#932667'); gr.addColorStop(0.45, '#dd513a'); gr.addColorStop(1, '#fca50a');
    g.fillStyle = gr; g.fillRect(0, 0, W, 4);
    g.fillStyle = '#f3965a'; g.font = '12px "IBM Plex Mono", monospace'; g.fillText(l.perKicker.toUpperCase(), 40, 44);
    g.fillStyle = '#ece8df'; g.font = '600 34px "Source Serif 4", Georgia, serif'; g.fillText(state.aoi.name, 40, 86);
    g.fillStyle = '#a49f94'; g.font = '16px "IBM Plex Sans", sans-serif';
    g.fillText(`${rangeLabel(st, l)} · ${tpl(l.perMonths, { n: st.n })} · ${state.view === 'naive' ? l.naive : l.harmonized}`, 40, 114);
    const cards = [
      [l.perTotal, U.fmt(st.tot, state.lang), likelyTxt(st, l)],
      [l.perVs, st.anom == null ? '—' : U.pct(st.anom, state.lang), tpl(l.perExpected, { e: U.fmt(st.exp, state.lang), b: ctx.baselineYears().join('–') })],
      [l.perPeakK, label(st.peakT, l), `${U.fmt(st.peakV, state.lang)} ${l.perHot}`],
      [l.perAboveK, `${st.above}/${st.n}`, st.recon ? tpl(l.perReconN, { n: st.recon }) : l.perAboveSub],
    ];
    const cw = (W - 80) / 4;
    g.strokeStyle = '#2a2823'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(40, 140.5); g.lineTo(W - 40, 140.5); g.moveTo(40, 252.5); g.lineTo(W - 40, 252.5); g.stroke();
    cards.forEach(([k, v, s], i) => {
      const x = 40 + i * cw + (i ? 18 : 0);
      if (i) { g.beginPath(); g.moveTo(40 + i * cw + 0.5, 140); g.lineTo(40 + i * cw + 0.5, 252); g.stroke(); }
      g.fillStyle = '#a49f94'; g.font = '14px "IBM Plex Sans", sans-serif'; g.fillText(k, x, 170);
      g.fillStyle = i === 1 && st.anom > 0.25 ? '#f3965a' : i === 1 && st.anom < -0.2 ? '#82a9d4' : '#ece8df';
      g.font = '600 36px "Source Serif 4", Georgia, serif'; g.fillText(v, x, 214);
      g.fillStyle = '#716c62'; g.font = '13px "IBM Plex Sans", sans-serif'; g.fillText(s, x, 238);
    });
    drawChart(g, 40, 282, W - 80, 340, st, { lang: state.lang, small: 12 });
    // key
    g.font = '13px "IBM Plex Sans", sans-serif'; g.textBaseline = 'middle';
    let kx = 40; const ky = 650;
    g.fillStyle = '#f37819'; g.fillRect(kx, ky - 6, 14, 12); g.fillStyle = '#a49f94'; g.fillText(l.perKeyBars, kx + 20, ky); kx += 40 + g.measureText(l.perKeyBars).width;
    g.strokeStyle = '#82a9d4'; g.setLineDash([4, 3]); g.lineWidth = 2; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + 18, ky); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#a49f94'; g.fillText(l.perKeyMed, kx + 24, ky); kx += 44 + g.measureText(l.perKeyMed).width;
    g.fillText(`| ${l.perKeyRange}`, kx, ky); kx += 24 + g.measureText(`| ${l.perKeyRange}`).width;
    g.fillText(`▨ ${l.perKeyRecon}`, kx, ky);
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#716c62'; g.font = '12px "IBM Plex Sans", sans-serif';
    g.fillText('Data: NASA FIRMS (MODIS C6.1/6.2, VIIRS 375 m), harmonized by FireSync · NASA Space Apps 2026 · firesync.space', 40, H - 28);
    c.toBlob(b => { U.download(`firesync_report_${ctx.areaSlug()}_${fileRange(st)}.png`, b); ctx.toast(l.saved); });
  }

  // ---------------------------------------------------------------- wiring
  ['perFromM', 'perFromY', 'perToM', 'perToY'].forEach(id => $(id).addEventListener('change', readSelects));
  $('perPresets').addEventListener('click', e => {
    const b = e.target.closest('button[data-p]'); if (!b) return;
    const [a, z] = presetRange(b.dataset.p); setRange(a, z); fillSelects();
  });
  $('perCsv').addEventListener('click', exportCSV);
  $('perJson').addEventListener('click', exportJSON);
  $('perPng').addEventListener('click', exportPNG);
  const hit = e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left; const b = bars.find(q => x >= q.x0 && x < q.x1); return b ? b.t : null; };
  cv.addEventListener('mousemove', e => { const t = hit(e); if (t !== hoverT) { hoverT = t; if (state.perStats) { paint(state.perStats); readout(state.perStats, t); } } });
  cv.addEventListener('mouseleave', () => { hoverT = null; if (state.perStats) { paint(state.perStats); readout(state.perStats, null); } });
  cv.addEventListener('click', e => { const t = hit(e); if (t != null) ctx.selectMonth(t); });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => state.perStats && paint(state.perStats), 120); });

  return { render, fillSelects, refresh() { fillSelects(); render(); } };
}
