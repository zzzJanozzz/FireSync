// FireSync burning-activity calendar (year x month heatmap with provenance and anomalies).
// Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md. License: Apache-2.0
import { yearOf, monthOf, tOf, isRecon, inferno, diverging, textOn, compact, median, logScale, T_SNPP } from './util.js';

export class Calendar {
  constructor(el, { onSelect, onHover }) {
    this.el = el;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.cells = new Map();
    this.rowsKey = '';
    el.addEventListener('keydown', e => this.key(e));
  }

  build(firstYear, lastYear, labels) {
    const key = `${firstYear}-${lastYear}-${labels.months.join('')}`;
    if (key === this.rowsKey) return;
    this.rowsKey = key;
    this.cells.clear();
    const el = this.el;
    el.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'cal';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', labels.aria);
    const add = (cls, text) => { const d = document.createElement('div'); d.className = cls; if (text != null) d.textContent = text; grid.appendChild(d); return d; };
    add('hd', labels.year);
    labels.months.forEach(m => add('hd', m));
    add('hd', labels.total);
    this.yearEls = new Map();
    this.totEls = new Map();
    for (let y = lastYear; y >= firstYear; y--) {
      if (y === lastYear) add('era-sep', labels.viirsEra);
      if (y === 2011) add('era-sep', labels.modisEra);
      const ye = add('yr', String(y));
      ye.dataset.year = y;
      ye.addEventListener('click', () => {
        const t = tOf(y, this.selMonth ?? 7);
        this.onSelect && this.onSelect(t);
      });
      this.yearEls.set(y, ye);
      for (let m = 0; m < 12; m++) {
        const t = tOf(y, m);
        const c = add('cell');
        c.dataset.t = t;
        c.setAttribute('role', 'gridcell');
        c.tabIndex = -1;
        c.addEventListener('click', () => { if (!c.classList.contains('nodata')) this.onSelect && this.onSelect(t); });
        c.addEventListener('mouseenter', () => this.onHover && !c.classList.contains('nodata') && this.onHover(t, c.getBoundingClientRect()));
        c.addEventListener('mouseleave', () => this.onHover && this.onHover(null));
        c.addEventListener('focus', () => this.onHover && !c.classList.contains('nodata') && this.onHover(t, c.getBoundingClientRect()));
        c.addEventListener('blur', () => this.onHover && this.onHover(null));
        this.cells.set(t, c);
      }
      this.totEls.set(y, add('tot'));
    }
    add('foot lbl', labels.median);
    this.footEls = labels.months.map(() => add('foot'));
    add('foot');
    el.appendChild(grid);
  }

  // values: Float64Array by t; n = number of months with data; baseline = [y0, y1]
  update({ values, n, mode, baseline, selT, labels, firstYear, lastYear, monthCellLabel }) {
    this.build(firstYear, lastYear, labels);
    this.values = values; this.n = n;
    // medians per calendar month (baseline years, leave-one-out handled per cell)
    const byMonth = Array.from({ length: 12 }, () => []);
    for (let y = baseline[0]; y <= baseline[1]; y++)
      for (let m = 0; m < 12; m++) { const t = tOf(y, m); if (t >= 0 && t < n) byMonth[m].push({ y, v: values[t] }); }
    const medAll = byMonth.map(a => median(a.map(o => o.v)));
    const scale = logScale(values, n);
    let i = 0;
    for (let y = lastYear; y >= firstYear; y--) {
      let tot = 0, complete = true;
      for (let m = 0; m < 12; m++, i++) {
        const t = tOf(y, m);
        const c = this.cells.get(t);
        c.style.transitionDelay = `${Math.min(600, i * 1.6)}ms`;
        if (t < 0 || t >= n) {
          c.className = 'cell nodata'; c.textContent = ''; c.style.background = ''; c.removeAttribute('aria-label');
          complete = false;
          continue;
        }
        const v = values[t];
        tot += v;
        let bg;
        if (mode === 'anomaly') {
          const others = byMonth[m].filter(o => o.y !== y).map(o => o.v);
          const med = others.length ? median(others) : medAll[m];
          const r = Math.log2((v + 1) / (med + 1));
          bg = diverging(0.5 + 0.5 * Math.max(-1, Math.min(1, r / 2)));
        } else {
          const x = scale(v);
          bg = x < 0 ? '#0d1424' : inferno(0.04 + 0.96 * x);
        }
        c.style.background = bg;
        c.style.color = textOn(bg);
        c.textContent = compact(v);
        c.className = 'cell' + (isRecon(t) ? ' recon' : '') + (t === selT ? ' sel' : '');
        c.setAttribute('aria-label', monthCellLabel(t, v));
      }
      const te = this.totEls.get(y);
      te.textContent = compact(tot) + (complete ? '' : '*');
      const ye = this.yearEls.get(y);
      ye.classList.toggle('sel', selT != null && yearOf(selT) === y);
    }
    this.footEls.forEach((el, m) => { el.textContent = compact(medAll[m]); });
    this.selT = selT;
    this.selMonth = selT != null ? monthOf(selT) : 7;
    const sel = this.cells.get(selT);
    if (sel) { this.cells.forEach(c => (c.tabIndex = -1)); sel.tabIndex = 0; }
    return { medians: medAll };
  }

  setPlaying(t) {
    if (this.playingEl) this.playingEl.classList.remove('playing');
    this.playingEl = t != null ? this.cells.get(t) : null;
    if (this.playingEl) this.playingEl.classList.add('playing');
  }

  key(e) {
    if (this.selT == null) return;
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 12, ArrowDown: -12 }[e.key];
    if (d == null) return;
    e.preventDefault();
    const t = Math.max(0, Math.min(this.n - 1, this.selT + d));
    this.onSelect && this.onSelect(t);
    requestAnimationFrame(() => { const c = this.cells.get(t); if (c) c.focus(); });
  }
}

export function eraOf(t) { return t < T_SNPP ? 'recon' : 'obs'; }
