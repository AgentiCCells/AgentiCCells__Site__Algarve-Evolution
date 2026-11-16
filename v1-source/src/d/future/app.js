// "The Future": scroll reveals, counters, chapter nav, network highlight, timeline buttons. Code Apache-2.0.
// Everything is in the page without this script; it only adds motion and interaction.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Count a number up from zero, then put the original text back exactly.
  const count = el => {
    if (el.dataset.done) return; el.dataset.done = '1';
    const to = Number(el.dataset.to), orig = el.textContent;
    if (reduce || !to) return;
    const m = orig.match(/\d[\d.,\u00a0\u202f]*/); if (!m) return;
    const pre = orig.slice(0, m.index), post = orig.slice(m.index + m[0].length);
    // Group digits as the page's own text does (1,000 / 1.000 / 1 000 / 1000), so the count never changes style.
    const sep = (m[0].match(/\D/) || [''])[0], fmt = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    const t0 = performance.now(), dur = 1600 + Math.min(900, to / 40);
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = k < 1 ? pre + fmt(Math.round(to * e)) + post : orig;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const targets = $$('.kin, .rv, .quote, .chart, .net-fig');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
    }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
    const ioc = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); ioc.unobserve(e.target); } }), { threshold: 0.6 });
    $$('.cnt').forEach(el => ioc.observe(el));
  }
  // The hero headline appears at once.
  requestAnimationFrame(() => $$('.hero .kin').forEach(el => el.classList.add('in')));

  // Progress bar where CSS scroll timelines are not supported.
  const bar = document.querySelector('.progress');
  if (bar && !CSS.supports('animation-timeline: scroll()')) {
    const upd = () => { const h = document.documentElement; bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`; };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // Chapter nav: mark the chapter in view.
  const links = $$('.chap a');
  if (links.length && 'IntersectionObserver' in window) {
    const byId = new Map(links.map(a => [a.hash.slice(1), a]));
    const ion = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      byId.get(e.target.id)?.setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((a, id) => { const s = document.getElementById(id); if (s) ion.observe(s); });
  }

  // Network: hovering a node lights its links.
  const net = document.querySelector('.net');
  if (net) {
    const lit = id => $$('.lk', net).forEach(l => l.classList.toggle('on', !!id && (l.dataset.a === id || l.dataset.b === id)));
    $$('.nd', net).forEach(n => { n.addEventListener('mouseenter', () => lit(n.dataset.id)); n.addEventListener('mouseleave', () => lit(null)); });
  }

  // Timeline: buttons scroll one card.
  const track = document.querySelector('.track');
  $$('.tb').forEach(b => b.addEventListener('click', () => {
    const card = track.querySelector('.tc'); const w = card ? card.getBoundingClientRect().width + 16 : 320;
    track.scrollBy({ left: Number(b.dataset.dir) * w, behavior: reduce ? 'auto' : 'smooth' });
  }));
})();
