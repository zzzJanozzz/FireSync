// FireSync map view: one interface over the 3D globe (default) and the 2D map. It remembers what is
// on screen, so switching views replays the same regions, hotspots, outline and framing on the other one.
// Developed with SI (Claude, Anthropic) assistance. License: Apache-2.0
import { createGlobe } from './globe.js';
import { createMap2D } from './map2d.js';

export function createView({ el3d, el2d, onHover, onClick }) {
  const g = createGlobe(el3d, { onHover, onClick });
  let m = null, mode = '3d';
  const st = { context: null, focus: null, outline: [], regions: [], fill: null, bbox: null, opts: null, ghost: null };
  const cur = () => (mode === '3d' ? g : m);

  function replay(v, instantMove) {
    v.setRegions(st.regions);
    v.styleRegions({ fill: st.fill });
    if (st.context) v.setContext(st.context, true); else v.hideContext();
    if (st.focus) v.setFocus(st.focus[0], true, st.focus[1]); else v.clearFocus();
    v.setOutline(st.outline);
    v.setGhost(st.ghost);
    if (st.bbox) v.focusBBox(st.bbox, { ...st.opts, ms: instantMove ? 0 : 900 }); else v.home(instantMove ? 0 : 900);
  }

  return {
    get mode() { return mode; },
    setMode(next) {
      if (next === mode) return;
      mode = next;
      if (next === '2d') {
        g.setActive(false);
        el3d.hidden = true; el2d.hidden = false;
        if (!m) m = createMap2D(el2d, { onHover, onClick });
        m.setActive(true);
        replay(m, true);
      } else {
        el2d.hidden = true; el3d.hidden = false;
        g.setActive(true);
        replay(g, false);
      }
    },
    setContext(flat, instant) { st.context = flat && flat.length ? flat : null; return cur().setContext(flat, instant); },
    hideContext() { st.context = null; cur().hideContext(); },
    setFocus(data, instant, rings) { st.focus = data && data.length ? [data, rings] : null; return cur().setFocus(data, instant, rings); },
    clearFocus() { st.focus = null; cur().clearFocus(); },
    setOutline(rings) { st.outline = rings || []; cur().setOutline(st.outline); },
    setRegions(list) { st.regions = list || []; cur().setRegions(st.regions); },
    styleRegions({ fill }) { st.fill = fill || null; cur().styleRegions({ fill: st.fill }); },
    setGhost(ring) { st.ghost = ring || null; cur().setGhost(st.ghost); },
    // Frame a bounding box [w, s, e, n] and keep the view anchored on it.
    focusBBox(bbox, opts = {}) { st.bbox = bbox; st.opts = opts; cur().focusBBox(bbox, opts); },
    home() { st.bbox = null; cur().home(); },
    releaseAnchor() { st.bbox = null; cur().releaseAnchor(); },
    recenter(ms) { cur().recenter(ms); },
    get anchored() { return !!st.bbox; },
    zoomBy(f) { cur().zoomBy(f); },
    kmPerPx() { return cur().kmPerPx(); },
    setAutoRotate(on) { g.setAutoRotate(on); },
    get autoRotate() { return g.autoRotate; },
    toggleClouds() { return g.toggleClouds(); },
  };
}
