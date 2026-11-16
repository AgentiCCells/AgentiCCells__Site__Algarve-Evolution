// Mission Control: motion and interaction. Counters, target rings, the network's hand-written physics, the radar
// readout, the typed timeline log and the split-flap status board. No libraries. Without this file every panel
// still shows its content. Motion stops under prefers-reduced-motion or with the "Motion" switch.
// Code Apache-2.0. sites-dev@AgentiCCells.dinis
(() => {
  const html = document.documentElement; html.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  let calm = rm.matches || store.get('ae-mc-calm') === '1';
  const btn = $('.motion');
  function setCalm(c) { calm = c; html.classList.toggle('calm', c); if (btn) { btn.setAttribute('aria-pressed', String(!c)); btn.textContent = c ? btn.dataset.off : btn.dataset.on; } }
  setCalm(calm);
  btn?.addEventListener('click', () => { setCalm(!calm); store.set('ae-mc-calm', calm ? '1' : '0'); if (!calm) kick(); });

  // Faro clock and the days to 2032
  const clock = $('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => { if (clock) clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);
  const tm = $('[data-tminus]');
  if (tm) { const n = new Date(); const d = Math.ceil((Date.UTC(2032, 0, 1) - Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5); tm.textContent = d.toLocaleString(html.lang === 'pt' ? 'pt-PT' : 'en-GB'); }

  // ---------- counters, rings, bars, flaps: run when a panel comes into view ----------
  const NUM = /\d{1,3}(?:[.,]\d{3})+|\d+/g;
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    const final = el.textContent; if (calm) return;
    const parts = []; let last = 0;
    for (const m of final.matchAll(NUM)) {
      const raw = m[0]; const sep = (raw.match(/[.,]/) || [''])[0]; const n = Number(raw.replace(/[.,]/g, ''));
      parts.push(final.slice(last, m.index)); parts.push({ n, sep, year: !sep && raw.length === 4 && /^(19|20)/.test(raw) }); last = m.index + raw.length;
    }
    parts.push(final.slice(last));
    const t0 = performance.now(), ms = 1500;
    const f = (n, sep) => sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n);
    const step = now => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = parts.map(p => typeof p === 'string' ? p : f(p.year ? Math.round(p.n - (1 - e) * 26) : Math.round(p.n * e), p.sep)).join('');
      if (k < 1) requestAnimationFrame(step); else el.textContent = final; };
    requestAnimationFrame(step);
  }
  const rings = $$('.rg-fg');
  const C = 2 * Math.PI * 52;
  if (!calm) rings.forEach(r => { r.style.strokeDashoffset = C.toFixed(1); });
  function flap(el) {
    if (el.dataset.done) return; el.dataset.done = '1'; if (calm) return;
    const final = el.textContent, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const t0 = performance.now(), ms = 900 + Math.random() * 500;
    el.setAttribute('aria-label', final);
    const step = now => { const k = Math.min(1, (now - t0) / ms), fixed = Math.floor(final.length * k);
      el.textContent = final.split('').map((c, i) => i < fixed || c === ' ' ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
      if (k < 1) requestAnimationFrame(step); else { el.textContent = final; el.removeAttribute('aria-label'); } };
    requestAnimationFrame(step);
  }
  function enter(pn) {
    if (pn.classList.contains('in')) return; pn.classList.add('in');
    $$('[data-count]', pn).forEach(count);
    $$('.rg-fg', pn).forEach((r, i) => setTimeout(() => { r.style.strokeDashoffset = '0'; }, 120 * i));
    $$('.flap', pn).forEach((f, i) => setTimeout(() => flap(f), 60 * i));
    if (pn.id === 'log') typeLog();
  }
  const pns = $$('.pn');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { enter(e.target); io.unobserve(e.target); } }), { threshold: 0.15 });
    pns.forEach(p => io.observe(p));
    setTimeout(() => pns.forEach(enter), 9000);
  } else pns.forEach(enter);

  // ---------- timeline log ----------
  const term = $('.term'); let typeTimer = 0;
  function typeLog() {
    if (!term) return; clearTimeout(typeTimer);
    const lines = $$('.tl-line', term);
    if (calm) { term.classList.remove('typing'); return; }
    term.classList.add('typing'); lines.forEach(l => l.classList.remove('shown'));
    let i = 0;
    const next = () => { if (i >= lines.length) { term.classList.remove('typing'); return; }
      lines[i++].classList.add('shown'); term.scrollTop = term.scrollHeight; typeTimer = setTimeout(next, calm ? 0 : 340); };
    next();
  }
  $('.btn-replay')?.addEventListener('click', () => { term.scrollTop = 0; typeLog(); });

  // ---------- network ----------
  const svg = $('.net');
  const insBody = $('.ins-body');
  const cards = new Map($$('.idx-grid .ins-card').map(c => [c.dataset.node, c]));
  let kick = () => {};
  if (svg) {
    const N = $$('.nd', svg).map(g => { const m = g.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\)/);
      return { g, id: g.dataset.id, r: +g.dataset.r, x: +m[1], y: +m[2], vx: 0, vy: 0, fixed: false }; });
    const byId = new Map(N.map(n => [n.id, n]));
    const L = $$('.ed', svg).map(l => ({ l, a: byId.get(l.dataset.a), b: byId.get(l.dataset.b) }));
    const vb = svg.viewBox.baseVal, W = vb.width, H = vb.height;
    let alpha = 0.02, raf = 0;
    function draw() {
      for (const n of N) n.g.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
      for (const e of L) { e.l.setAttribute('x1', e.a.x.toFixed(1)); e.l.setAttribute('y1', e.a.y.toFixed(1)); e.l.setAttribute('x2', e.b.x.toFixed(1)); e.l.setAttribute('y2', e.b.y.toFixed(1)); }
    }
    // The same forces as the build-time layout (scripts/designs/mission.mjs, tickForces).
    function step() {
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j]; let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
        const f = Math.min(40, 16000 / d2) * alpha; dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
        const min = a.r + b.r + 34; if (d < min) { const push = (min - d) / 2; if (!a.fixed) { a.x -= dx * push; a.y -= dy * push; } if (!b.fixed) { b.x += dx * push; b.y += dy * push; } }
      }
      for (const { a, b } of L) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, rest = a.id === 'ae' || b.id === 'ae' ? 175 : 125;
        const f = (d - rest) * 0.03 * alpha; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f; }
      for (const n of N) {
        const g = n.id === 'ae' ? 30 : 1; n.vx += (W / 2 - n.x) * 0.0018 * alpha * g; n.vy += (H / 2 - n.y) * 0.0036 * alpha * g;
        n.vx *= 0.8; n.vy *= 0.8;
        if (!n.fixed) { n.x = Math.max(80, Math.min(W - 80, n.x + n.vx)); n.y = Math.max(36, Math.min(H - 36, n.y + n.vy)); }
      }
    }
    function loop() { step(); draw(); alpha *= 0.985; if (alpha > 0.004 && !calm) raf = requestAnimationFrame(loop); else raf = 0; }
    kick = (a = 0.25) => { alpha = Math.max(alpha, a); if (!raf && !calm) raf = requestAnimationFrame(loop); };
    kick(0.03);
    const box = svg.parentElement; if (box.scrollWidth > box.clientWidth) box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2;

    // selection and the inspector
    let sel = 'ae';
    const neighbours = id => new Set(L.filter(e => e.a.id === id || e.b.id === id).flatMap(e => [e.a.id, e.b.id]));
    function highlight(id) {
      const nb = id ? neighbours(id) : new Set();
      svg.classList.toggle('focus', !!id);
      for (const n of N) { n.g.classList.toggle('hi', nb.has(n.id)); n.g.classList.toggle('sel', n.id === sel); }
      for (const e of L) e.l.classList.toggle('hi', !!id && (e.a.id === id || e.b.id === id));
    }
    function inspect(id) { const c = cards.get(id); if (c) insBody.replaceChildren(c.cloneNode(true)); }
    function select(id, focus) { sel = id; inspect(id); highlight(id); if (focus) byId.get(id)?.g.focus({ preventScroll: true }); }
    highlight(null); byId.get('ae').g.classList.add('sel');
    N.forEach(n => {
      n.g.addEventListener('mouseenter', () => { inspect(n.id); highlight(n.id); });
      n.g.addEventListener('mouseleave', () => { inspect(sel); highlight(sel === 'ae' && !svg.dataset.touched ? null : sel); });
      n.g.addEventListener('focus', () => { svg.dataset.touched = '1'; select(n.id); });
      n.g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); } });
    });
    insBody.addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) { svg.dataset.touched = '1'; select(b.dataset.goto, true); } });

    // drag a node (pointer), tap to select
    const toSvg = (cx, cy) => { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.nd'); if (!g) return;
      const n = byId.get(g.dataset.id); const p = toSvg(e.clientX, e.clientY);
      drag = { n, dx: n.x - p.x, dy: n.y - p.y, moved: false, sx: e.clientX, sy: e.clientY, id: e.pointerId };
      g.setPointerCapture(e.pointerId); n.fixed = true; g.classList.add('drag');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      drag.moved = true; const p = toSvg(e.clientX, e.clientY);
      drag.n.x = Math.max(30, Math.min(W - 30, p.x + drag.dx)); drag.n.y = Math.max(20, Math.min(H - 20, p.y + drag.dy));
      if (calm) draw(); else kick(0.2);
    });
    const up = e => { if (!drag || e.pointerId !== drag.id) return; const { n, moved } = drag; n.fixed = false; n.g.classList.remove('drag'); drag = null;
      svg.dataset.touched = '1'; if (!moved) select(n.id); };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  }

  // ---------- radar ----------
  const ro = $('.ro-body');
  if (ro) {
    let selB = null;
    const show = a => { const src = document.getElementById(a.dataset.ct); if (!src) return; const c = src.cloneNode(true); c.removeAttribute('id'); ro.replaceChildren(...c.childNodes); };
    $$('.blip, .blip-m').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); selB?.classList.remove('sel'); selB = a; a.classList.add('sel'); show(a); });
      a.addEventListener('mouseenter', () => show(a));
      a.addEventListener('mouseleave', () => { if (selB) show(selB); });
      a.addEventListener('focus', () => show(a));
    });
    const hq = $('.blip.hq'); if (hq) { selB = hq; hq.classList.add('sel'); show(hq); }
  }
})();
