// FireSync charts (Apache ECharts). Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
/* global echarts */
import { tOf, yearOf, quantile, compact, fmt, T_SNPP, T_AQUA } from './util.js';

const AXIS = { axisLine: { lineStyle: { color: '#3b3832' } }, axisTick: { lineStyle: { color: '#3b3832' } }, axisLabel: { color: '#a49f94', fontFamily: 'IBM Plex Mono', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(236,232,223,0.06)' } } };
const TIP = { backgroundColor: '#f3efe6', borderColor: '#f3efe6', textStyle: { color: '#1a1814', fontSize: 12, fontFamily: 'IBM Plex Sans' }, extraCssText: 'border-radius:2px;box-shadow:0 8px 30px rgba(0,0,0,.5);' };

function chart(el) {
  const c = echarts.init(el, null, { renderer: 'canvas' });
  new ResizeObserver(() => c.resize()).observe(el);
  return c;
}

export function createCharts(els) {
  const seasonal = chart(els.seasonal), annual = chart(els.annual), scatter = chart(els.scatter), drift = chart(els.drift);
  return { seasonal, annual, scatter, drift };
}

export function drawSeasonal(c, { values, n, year, baseline, labels, lang }) {
  const med = [], p25 = [], p75 = [], cur = [];
  for (let m = 0; m < 12; m++) {
    const arr = [];
    for (let y = baseline[0]; y <= baseline[1]; y++) { if (y === year) continue; const t = tOf(y, m); if (t >= 0 && t < n) arr.push(values[t]); }
    arr.sort((a, b) => a - b);
    med.push(quantile(arr, 0.5)); p25.push(quantile(arr, 0.25)); p75.push(quantile(arr, 0.75));
    const t = tOf(year, m);
    cur.push(t >= 0 && t < n ? values[t] : null);
  }
  c.setOption({
    animationDuration: 700, animationEasing: 'cubicOut',
    grid: { left: 46, right: 12, top: 26, bottom: 24 },
    legend: { top: 0, right: 0, textStyle: { color: '#a49f94', fontSize: 11 }, itemWidth: 12, itemHeight: 8, data: [{ name: String(year), itemStyle: { color: '#a49f94' } }, labels.median, labels.iqr] },
    tooltip: { ...TIP, trigger: 'axis', valueFormatter: v => (v == null ? '—' : fmt(v, lang)) },
    xAxis: { type: 'category', data: labels.months, ...AXIS },
    yAxis: { type: 'value', ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: v => compact(v) } },
    series: [
      { name: 'p25', type: 'line', data: p25, stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, tooltip: { show: false } },
      { name: labels.iqr, type: 'line', data: p75.map((v, i) => v - p25[i]), stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(130,169,212,0.16)' }, itemStyle: { color: 'rgba(130,169,212,0.5)' }, tooltip: { show: false } },
      { name: String(year), type: 'bar', data: cur, barWidth: '55%', itemStyle: { borderRadius: [4, 4, 0, 0], color: p => (p.value > med[p.dataIndex] * 1.25 ? '#e8590c' : p.value < med[p.dataIndex] * 0.8 ? '#82a9d4' : '#a49f94') } },
      { name: labels.median, type: 'line', data: med, smooth: 0.3, symbol: 'circle', symbolSize: 5, lineStyle: { color: '#ece8df', width: 2 }, itemStyle: { color: '#ece8df' } },
    ],
  }, true);
}

export function drawAnnual(c, { series, labels, lang, selYear, showNaive }) {
  const { H, lo, hi, naive, n } = series;
  const lastYear = yearOf(n - 1);
  const years = [], h = [], l = [], u = [], nv = [];
  for (let y = 2001; y <= lastYear; y++) {
    let a = 0, b = 0, cc = 0, d = 0, months = 0;
    for (let m = 0; m < 12; m++) { const t = tOf(y, m); if (t < 0 || t >= n) continue; a += H[t]; b += lo[t]; cc += hi[t]; d += naive[t]; months++; }
    if (!months) continue;
    years.push(String(y)); h.push(a); l.push(b); u.push(cc - b); nv.push(d);
  }
  const recEnd = String(yearOf(T_SNPP - 1));
  c.setOption({
    animationDuration: 900, animationEasing: 'cubicOut',
    grid: { left: 52, right: 12, top: 30, bottom: 24 },
    legend: { top: 0, right: 0, textStyle: { color: '#a49f94', fontSize: 11 }, itemWidth: 12, itemHeight: 8, data: [{ name: labels.harmonized, itemStyle: { color: '#e8590c' } }, labels.band, ...(showNaive ? [labels.naive] : [])] },
    tooltip: { ...TIP, trigger: 'axis', formatter: ps => {
      const i = ps[0].dataIndex;
      return `<b>${years[i]}</b><br>${labels.harmonized}: ${fmt(h[i], lang)}<br>${labels.band}: ${fmt(l[i], lang)} – ${fmt(l[i] + u[i], lang)}${showNaive ? `<br>${labels.naive}: ${fmt(nv[i], lang)}` : ''}`;
    } },
    xAxis: { type: 'category', data: years, ...AXIS },
    yAxis: { type: 'value', ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: v => compact(v) } },
    series: [
      { name: 'lo', type: 'line', data: l, stack: 'u', symbol: 'none', lineStyle: { opacity: 0 }, tooltip: { show: false } },
      { name: labels.band, type: 'line', data: u, stack: 'u', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(181,101,29,0.22)' }, itemStyle: { color: 'rgba(181,101,29,0.6)' } },
      { name: labels.harmonized, type: 'bar', data: h, barWidth: '62%', itemStyle: { borderRadius: [3, 3, 0, 0], color: p => (years[p.dataIndex] === String(selYear) ? '#ece8df' : Number(years[p.dataIndex]) <= Number(recEnd) ? 'rgba(232,89,12,0.45)' : '#e8590c') },
        markArea: { silent: true, itemStyle: { color: 'rgba(236,232,223,0.03)' }, label: { color: '#716c62', fontSize: 10, fontFamily: 'IBM Plex Sans' }, data: [[{ name: labels.reconEra, xAxis: '2001' }, { xAxis: recEnd }]] } },
      ...(showNaive ? [{ name: labels.naive, type: 'line', data: nv, symbol: 'none', lineStyle: { color: '#82a9d4', width: 1.5, type: 'dashed' }, itemStyle: { color: '#82a9d4' } }] : []),
    ],
  }, true);
}

export function drawScatter(c, { validation, labels }) {
  const eng = validation.scatter.map(r => [r[0], Math.max(1, r[1])]);
  const nav = validation.scatter.map(r => [r[0], Math.max(1, r[2])]);
  const max = Math.max(...validation.scatter.map(r => Math.max(r[0], r[1], r[2])));
  c.setOption({
    animationDuration: 900,
    grid: { left: 62, right: 14, top: 30, bottom: 40 },
    legend: { top: 0, right: 0, textStyle: { color: '#a49f94', fontSize: 11 }, data: [labels.engine, labels.naive] },
    tooltip: { ...TIP, trigger: 'item', formatter: p => `${labels.obs}: ${compact(p.value[0])}<br>${labels.pred}: ${compact(p.value[1])}` },
    xAxis: { type: 'log', name: labels.obs, nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: '#a49f94', fontSize: 11 }, min: 10, max, ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: v => compact(v) } },
    yAxis: { type: 'log', name: labels.pred, nameLocation: 'middle', nameGap: 42, nameTextStyle: { color: '#a49f94', fontSize: 11 }, min: 1, max, ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: v => compact(v) } },
    series: [
      { name: labels.naive, type: 'scatter', data: nav, symbolSize: 3, itemStyle: { color: 'rgba(164,159,148,0.35)' } },
      { name: labels.engine, type: 'scatter', data: eng, symbolSize: 3.5, itemStyle: { color: 'rgba(232,89,12,0.7)' } },
      { type: 'line', data: [[10, 10], [max, max]], symbol: 'none', lineStyle: { color: '#ece8df', width: 1.5, type: 'dashed' }, tooltip: { show: false }, silent: true },
    ],
  }, true);
}

export function drawDrift(c, { validation, labels, lang }) {
  const d = validation.drift;
  c.setOption({
    animationDuration: 900,
    grid: { left: 52, right: 12, top: 52, bottom: 24 },
    legend: { top: 0, left: 0, orient: 'vertical', itemGap: 4, textStyle: { color: '#a49f94', fontSize: 11 }, data: [labels.obsViirs, labels.predAqua] },
    tooltip: { ...TIP, trigger: 'axis', valueFormatter: v => fmt(v, lang) },
    xAxis: { type: 'category', data: d.map(r => String(r.year)), ...AXIS },
    yAxis: { type: 'value', ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: v => compact(v) } },
    series: [
      { name: labels.obsViirs, type: 'bar', data: d.map(r => r.obs), barWidth: '55%', itemStyle: { color: 'rgba(130,169,212,0.55)', borderRadius: [1, 1, 0, 0] } },
      { name: labels.predAqua, type: 'line', data: d.map(r => r.pred), symbol: 'circle', symbolSize: 6, lineStyle: { color: '#e8590c', width: 2 }, itemStyle: { color: '#e8590c' },
        markArea: { silent: true, itemStyle: { color: 'rgba(232,89,12,0.06)' }, label: { color: '#f3965a', fontSize: 10, fontFamily: 'IBM Plex Sans', position: 'insideTop', distance: 4 }, data: [[{ name: labels.driftZone, xAxis: '2022' }, { xAxis: String(d[d.length - 1].year) }]] } },
    ],
  }, true);
}

export { T_AQUA };
