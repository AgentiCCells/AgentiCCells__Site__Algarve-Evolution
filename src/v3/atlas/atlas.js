// V3 The Atlas: pan and zoom (buttons, drag, pinch, ctrl+wheel, keys), layers, the detail panel and the timeline
// scrubber over the real timeline and the months of events on Algarve Evolution's Odoo. No libraries. The page works
// without this file: the map, the markers and every card are in the HTML. From V1's Atlas (v1-source/src/d/atlas/atlas.js).
// Code Apache-2.0. sites-dev@AgentiCCells.dinis
(() => {
  const root = document.getElementById('map'); if (!root) return;
  document.documentElement.classList.add('js');
  const $ = (s, el = root) => el.querySelector(s), $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const svg = $('.atl-svg'), stage = $('.atl-stage'), panel = $('.atl-panel'), body = $('.atl-panel-body');
  const MW = 1593, MH = 740, BOX = [70, 140, 1420, 640];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The same breakpoint as the CSS (max-width:760px), read the same way, so the camera and the layout never disagree.
  const phoneMQ = matchMedia('(max-width:760px)');
  const phone = () => phoneMQ.matches;
  const welcomeHTML = body.innerHTML;

  // Layout: the height of everything above the map (the V3 banner, our menu) and the title card's height feed the CSS.
  const head = $('.atl-head');
  function measure() {
    document.documentElement.style.setProperty('--bh', Math.max(0, Math.round(root.getBoundingClientRect().top + scrollY)) + 'px');
    root.style.setProperty('--headh', head.offsetHeight + 'px');
  }
  measure();

  // ---------- camera ----------
  // cam.z is pixels per map unit. Markers and labels are counter-scaled by 1/cam.z (apply), so cam.z must always be
  // a positive, finite number: a negative zoom turns that counter-scale into a 180 degree turn and every name on
  // the map reads upside down. That is what happened in V1 when the camera was set up while the map had no real size
  // yet (a page loaded in the background, a preview or in-app browser that sizes the view late): the free area
  // came out negative, so did the zoom and the zoom limits, and nothing corrected it until the window was resized.
  // So the camera waits for a real size, the fit can never go below a small positive zoom, and clamp() resets
  // anything that is not a positive finite number.
  const cam = { x: MW / 2, y: MH / 2, z: 1 };
  const ZMIN = 0.02, MIN_SIZE = 120;
  let zFit = 0.3, ready = false, touched = false;
  const size = () => [stage.clientWidth, stage.clientHeight];
  const sized = () => { const [w, h] = size(); return w >= MIN_SIZE && h >= MIN_SIZE; };
  const ok = n => typeof n === 'number' && isFinite(n);
  function insets() {
    const r = root.getBoundingClientRect(), tools = $('.atl-tools').getBoundingClientRect(), sc = $('.atl-scrub').getBoundingClientRect();
    const top = tools.bottom - r.top + 8, bottom = r.bottom - sc.top + 8;
    if (phone()) return { l: 8, r: 8, t: top, b: bottom };
    const p = panel.getBoundingClientRect();
    return { l: 90, r: r.right - p.left + 16, t: Math.min(top, r.height * 0.32), b: bottom };
  }
  function fitView() {
    const [w, h] = size(), i = insets();
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    // The free area between the overlays, never less than a third of the map's box on either axis.
    const fw = Math.max(w - i.l - i.r, w / 3), fh = Math.max(h - i.t - i.b, h / 3);
    const z = Math.max(ZMIN, Math.min(fw / bw, fh / bh));
    const cx = (BOX[0] + BOX[2]) / 2 - ((i.l - i.r) / 2) / z, cy = (BOX[1] + BOX[3]) / 2 - ((i.t - i.b) / 2) / z;
    return { x: cx, y: cy, z };
  }
  function homeView() {
    const f = fitView(); zFit = f.z;
    if (!phone()) return f;
    const [, h] = size(), i = insets();
    const z = Math.max(f.z, Math.min(0.47, (h - i.t - i.b) / (BOX[3] - BOX[1] + 40)));
    return { x: 610, y: (BOX[1] + BOX[3]) / 2 + 40 - ((i.t - i.b) / 2) / z, z };
  }
  function clamp() {
    if (!(zFit > 0) || !ok(zFit)) zFit = 0.3;
    if (!(cam.z > 0) || !ok(cam.z) || !ok(cam.x) || !ok(cam.y)) Object.assign(cam, homeView());
    cam.z = Math.max(zFit * 0.85, Math.min(zFit * 10, cam.z));
    cam.x = Math.max(0, Math.min(MW, cam.x)); cam.y = Math.max(40, Math.min(MH, cam.y));
  }
  const scales = $$('.mk-s'), bar = $('.atl-scale .bar'), barTxt = $('.atl-scale .txt');
  const kmPerUnit = 0.1112, approx = barTxt.textContent.split('·')[1] || '';
  function apply() {
    if (!ready) return;
    clamp();
    const [w, h] = size();
    svg.setAttribute('viewBox', `${(cam.x - w / 2 / cam.z).toFixed(2)} ${(cam.y - h / 2 / cam.z).toFixed(2)} ${(w / cam.z).toFixed(2)} ${(h / cam.z).toFixed(2)}`);
    const s = `scale(${(1 / cam.z).toFixed(4)})`;
    for (const g of scales) g.setAttribute('transform', s);
    const km = [5, 10, 20, 50].find(k => k / kmPerUnit * cam.z >= 60) || 50;
    bar.style.width = `${(km / kmPerUnit * cam.z).toFixed(1)}px`; barTxt.textContent = `${km} km ·${approx}`;
    root.classList.toggle('z-lo', cam.z < 0.5); root.classList.toggle('z-xlo', cam.z < 0.34);
  }
  let anim = 0;
  function flyTo(to, ms = 650) {
    cancelAnimationFrame(anim); touched = true;
    if (!(to.z > 0) || !ok(to.z)) to = { ...to, z: cam.z };
    if (reduce || ms === 0) { Object.assign(cam, to); apply(); return; }
    const from = { ...cam }, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      cam.x = from.x + (to.x - from.x) * e; cam.y = from.y + (to.y - from.y) * e; cam.z = from.z * Math.pow(to.z / from.z, e); apply();
      if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function toMap(cx, cy) { const r = svg.getBoundingClientRect(); return [cam.x + (cx - r.left - r.width / 2) / cam.z, cam.y + (cy - r.top - r.height / 2) / cam.z]; }
  function zoomAt(cx, cy, f) {
    const [mx, my] = toMap(cx, cy), r = svg.getBoundingClientRect();
    touched = true; cam.z *= f; clamp();
    cam.x = mx - (cx - r.left - r.width / 2) / cam.z; cam.y = my - (cy - r.top - r.height / 2) / cam.z; apply();
  }
  function zoomCentre(f) { const to = { ...cam, z: Math.max(zFit * 0.85, Math.min(zFit * 10, cam.z * f)) }; flyTo(to, 300); }

  // Set the camera once the map has a real size, and again whenever its size changes: before the visitor has moved
  // the map, back to the home view; after, keep their view and only refresh the zoom limits.
  function layout() {
    measure();
    if (!sized()) return;
    if (!ready || !touched) { ready = true; cancelAnimationFrame(anim); Object.assign(cam, homeView()); }
    else zFit = fitView().z;
    apply();
  }
  layout();
  let rt; const relayout = () => { clearTimeout(rt); rt = setTimeout(layout, ready ? 120 : 0); };
  addEventListener('resize', relayout);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(relayout); ro.observe(stage); ro.observe(head); }
  addEventListener('pageshow', relayout);

  // drag and pinch
  const pts = new Map(); let g0 = null, moved = false, captured = false;
  svg.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false; cancelAnimationFrame(anim);
    g0 = snapshot();
  });
  function snapshot() { const p = [...pts.values()]; const mid = p.reduce((a, q) => [a[0] + q[0] / p.length, a[1] + q[1] / p.length], [0, 0]);
    const d = p.length > 1 ? Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) : 0; return { mid, d, cam: { ...cam }, map: toMap(mid[0], mid[1]) }; }
  svg.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    const s = snapshot();
    if (s.d && !g0.d) g0 = s; // a second finger arrived
    if (!moved && Math.hypot(s.mid[0] - g0.mid[0], s.mid[1] - g0.mid[1]) < 5 && !(s.d && Math.abs(s.d - g0.d) > 5)) return;
    if (!captured) { try { svg.setPointerCapture(e.pointerId); } catch {} captured = true; svg.classList.add('dragging'); }
    moved = true; touched = true;
    if (s.d && g0.d) { cam.z = g0.cam.z * s.d / g0.d; clamp(); }
    const r = svg.getBoundingClientRect();
    cam.x = g0.map[0] - (s.mid[0] - r.left - r.width / 2) / cam.z; cam.y = g0.map[1] - (s.mid[1] - r.top - r.height / 2) / cam.z; apply();
  });
  const end = e => { pts.delete(e.pointerId); if (pts.size) g0 = snapshot(); else { captured = false; svg.classList.remove('dragging'); } };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = root.dataset.ctrlHint || 'Ctrl + scroll'; root.appendChild(hint);
  let ht;
  svg.addEventListener('wheel', e => {
    if (!(e.ctrlKey || e.metaKey)) { hint.classList.add('show'); clearTimeout(ht); ht = setTimeout(() => hint.classList.remove('show'), 1100); return; }
    e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022)));
  }, { passive: false });
  svg.addEventListener('keydown', e => {
    const k = e.key, d = 80 / cam.z;
    const mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[k];
    if (mv && e.target === svg) { e.preventDefault(); flyTo({ ...cam, x: cam.x + mv[0], y: cam.y + mv[1] }, 200); }
    else if (k === '+' || k === '=') { e.preventDefault(); zoomCentre(1.5); }
    else if (k === '-' || k === '_') { e.preventDefault(); zoomCentre(1 / 1.5); }
    else if (k === '0') { e.preventDefault(); flyTo(fitView()); }
  });
  $$('[data-zoom]').forEach(b => b.addEventListener('click', () => {
    const z = b.dataset.zoom; if (z === 'in') zoomCentre(1.6); else if (z === 'out') zoomCentre(1 / 1.6); else flyTo(fitView());
  }));

  // ---------- panel ----------
  // A card is the element with that id (a place, an activity, a month, a timeline entry, the gaps) or a template.
  // With a section (data-sec), the panel scrolls to that part of the card: a place's events, programmes, calls...
  function show(id, { open = true, focus = false, fly = false, sec = null } = {}) {
    let src = document.getElementById(id), node;
    if (src && src.tagName !== 'TEMPLATE') node = src.cloneNode(true);
    else { const tpl = document.getElementById(`tpl-${id}`) || src; if (!tpl || !tpl.content) return; node = tpl.content.firstElementChild.cloneNode(true); }
    node.removeAttribute('id'); node.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    body.replaceChildren(node); panel.scrollTop = 0;
    $$('.mk-link.is-sel').forEach(a => a.classList.remove('is-sel'));
    $$(`.base .mk-link[data-card="${id}"]`).forEach(a => a.classList.add('is-sel'));
    if (sec) { const s = node.querySelector(`[data-sec="${sec}"]`); if (s) { s.classList.add('hl'); const d = s.querySelector('details.past'); if (d && sec === 'events') d.open = true;
      requestAnimationFrame(() => { panel.scrollTop = Math.max(0, s.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - 12); }); } }
    if (open && phone()) panel.classList.add('open');
    if (focus) panel.focus({ preventScroll: true });
    if (fly) { const a = $(`.base .mk-link[data-card="${id}"] .mk`); if (a) { const m = a.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\)/); if (m) flyTo({ x: +m[1], y: +m[2] + (phone() ? 60 / cam.z : 0), z: Math.max(cam.z, zFit * 1.6) }); } }
  }
  function closePanel() { panel.classList.remove('open'); $$('.mk-link.is-sel').forEach(a => a.classList.remove('is-sel'));
    if (!phone()) body.innerHTML = welcomeHTML; }
  $('.atl-close').addEventListener('click', closePanel);
  // On phones the detail sheet is fixed to the screen: close it when the map scrolls out of view.
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (!es[0].isIntersecting && phone()) panel.classList.remove('open'); }).observe(root);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });
  root.addEventListener('click', e => {
    const a = e.target.closest('a[data-card]'); if (!a || !root.contains(a)) return;
    e.preventDefault(); stop();
    const id = a.dataset.card;
    const st = stops.find(s => s.id === id); if (st) setYear(st.t, { quiet: true });
    show(id, { focus: e.detail === 0, fly: a.closest('.atl-panel') != null && id.startsWith('town-'), sec: a.dataset.sec || null });
  });

  // ---------- layers ----------
  function setLayer(name, on) {
    const b = $(`[data-layer-btn="${name}"]`); if (!b) return;
    b.setAttribute('aria-pressed', String(on)); root.classList.toggle(`show-${name}`, on);
  }
  $$('[data-layer-btn]').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.layerBtn, on = b.getAttribute('aria-pressed') !== 'true';
    setLayer(name, on); stop();
    if (on && name !== 'events') show(`act-${name}`, { open: true });
  }));
  $$('[data-card-btn]').forEach(b => b.addEventListener('click', () => { stop(); show(b.dataset.cardBtn, { open: true, focus: true }); }));
  // "Show the layer" in the essentials below the map: back up to the map with that layer on.
  document.querySelectorAll('[data-show-layer]').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.showLayer; setLayer(name, true);
    root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => show(`act-${name}`, { open: true }), reduce ? 0 : 450);
  }));
  document.querySelectorAll('a[data-card="gaps"]').forEach(a => { if (!root.contains(a)) a.removeAttribute('data-card'); });

  // ---------- timeline ----------
  // The track has two scales: 2018 to mid 2025 (the timeline) on the first 30%, then month by month (their events).
  const stops = JSON.parse(document.getElementById('atl-stops')?.textContent || '[]');
  const range = $('.sc-range'), fill = $('.sc-fill'), yearEl = $('.sc-year'), titleEl = $('.sc-title'), playBtn = $('.sc-play');
  const T0 = +root.dataset.t0, T1 = +root.dataset.t1, [SY, SP] = root.dataset.split.split(',').map(Number), TODAY = +root.dataset.today;
  const pos = x => (x <= SY ? (x - T0) / (SY - T0) * SP : SP + (x - SY) / (T1 - SY) * (1 - SP));
  const tOf = p => (p <= SP ? T0 + p / SP * (SY - T0) : SY + (p - SP) / (1 - SP) * (T1 - SY));
  const evLinks = $$('.ev-link').map(a => ({ a, ts: a.dataset.ts.split(',').map(Number), up: a.querySelector('.ev-up'), past: a.querySelector('.ev-past'), town: a.querySelector('.mk').dataset.town }));
  const arcs = $$('.ev-arc'), pips = $$('.pip, .bar'), baseLinks = $$('.base .mk-link');
  const rOf = n => (n ? 7 + 2.3 * Math.sqrt(n) : 0);
  let year = T1, lastNow = null;
  function latest(y) { let r = null; for (const s of stops) if (s.t <= y + 1e-6) r = s; return r; }
  function setYear(y, { quiet = false, atEnd = false } = {}) {
    year = Math.max(T0, Math.min(T1, y)); range.value = Math.round(pos(year) * 1000);
    fill.style.width = `${(pos(year) * 100).toFixed(2)}%`;
    const now = atEnd ? null : latest(year);
    const towns = new Set(now ? now.towns : []);
    for (const e of evLinks) {
      let past = 0, all = 0; for (const t of e.ts) if (t <= year + 1e-6) { all++; if (t < TODAY) past++; }
      e.up.setAttribute('r', rOf(all).toFixed(1)); e.past.setAttribute('r', rOf(past).toFixed(1));
      e.a.classList.toggle('off', all === 0); e.a.classList.toggle('now', towns.has(e.town));
    }
    for (const a of baseLinks) a.classList.toggle('now', towns.has((a.dataset.card || '').replace('town-', '')));
    for (const p of arcs) { const on = !!now && p.dataset.stop === now.id; if (on && !p.classList.contains('now')) void p.getBBox(); p.classList.toggle('now', on); }
    for (const p of pips) { const t = +p.dataset.t; p.classList.toggle('on', t <= year + 1e-6); p.classList.toggle('now', !!now && p.dataset.stop === now.id); }
    if (atEnd) { yearEl.textContent = '2018 → 2027'; titleEl.textContent = phone() ? '' : playBtn.dataset.play; }
    else { yearEl.textContent = now ? now.year : String(Math.floor(year)); titleEl.textContent = now ? now.label : ''; }
    range.setAttribute('aria-valuetext', now ? now.label : String(Math.floor(year)));
    if (!quiet && now && now.id !== lastNow && !phone()) show(now.id, { open: false });
    lastNow = now ? now.id : null;
  }
  setYear(T1, { atEnd: true });
  // Dragging or clicking the track snaps to an entry or a month when it is within a few pixels of one.
  range.addEventListener('input', () => { stop(); const v = +range.value; if (v >= 1000) { setYear(T1, { atEnd: true }); return; }
    const w = range.getBoundingClientRect().width || 1000, near = stops.map(s => [s, Math.abs(pos(s.t) * 1000 - v) * w / 1000]).filter(([, px]) => px < 9).sort((a, b) => a[1] - b[1])[0];
    setYear(near ? near[0].t : tOf(v / 1000)); });
  // Arrow keys on the scrubber step from one entry to the next instead of one thousandth of the track.
  range.addEventListener('keydown', e => {
    const dir = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (dir) { e.preventDefault(); stop(); stepTo(dir); }
    else if (e.key === 'End') { e.preventDefault(); stop(); setYear(T1, { atEnd: true }); }
    else if (e.key === 'Home') { e.preventDefault(); stop(); setYear(stops[0].t, { quiet: true }); show(stops[0].id, { open: false }); }
  });
  pips.forEach(p => p.addEventListener('click', () => { stop(); const s = stops.find(x => x.id === p.dataset.stop); if (!s) return; setYear(s.t, { quiet: true }); show(s.id); }));
  function stepTo(dir) {
    const i = stops.findIndex(s => s.id === lastNow);
    let j = i < 0 ? (dir > 0 ? 0 : stops.length - 1) : i + dir;
    j = Math.max(0, Math.min(stops.length - 1, j));
    setYear(stops[j].t, { quiet: true }); show(stops[j].id, { open: !phone() || panel.classList.contains('open') });
  }
  $$('.sc-step').forEach(b => b.addEventListener('click', () => { stop(); stepTo(+b.dataset.step); }));

  let playing = false, timer = 0, tween = 0;
  function stop() { if (!playing) return; playing = false; clearTimeout(timer); cancelAnimationFrame(tween); playBtn.classList.remove('playing'); playBtn.setAttribute('aria-label', playBtn.dataset.play); }
  function play() {
    playing = true; playBtn.classList.add('playing'); playBtn.setAttribute('aria-label', playBtn.dataset.pause);
    let i = stops.findIndex(s => s.id === lastNow) + 1;
    if (year >= T1 - 0.01 || i <= 0 || i >= stops.length) { i = 0; setYear(T0, { quiet: true }); }
    const next = () => {
      if (!playing) return;
      if (i >= stops.length) { stop(); setYear(T1, { atEnd: true }); return; }
      const s = stops[i++], from = year, p0 = pos(from), p1 = pos(s.t), t0 = performance.now(), ms = reduce ? 0 : Math.min(1200, 250 + Math.abs(p1 - p0) * 3000);
      const go = now => { if (!playing) return; const k = ms ? Math.min(1, (now - t0) / ms) : 1; const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        setYear(tOf(p0 + (p1 - p0) * e), { quiet: true });
        if (k < 1) tween = requestAnimationFrame(go);
        else { setYear(s.t, { quiet: true }); show(s.id, { open: false }); timer = setTimeout(next, reduce ? 3200 : s.kind === 'mo' ? 1900 : 2600); } };
      tween = requestAnimationFrame(go);
    };
    next();
  }
  playBtn.addEventListener('click', () => playing ? stop() : play());
})();
