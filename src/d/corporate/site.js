// "The Institution": marks the section in view in the sticky nav, and adds earlier/later buttons to the timeline.
// The page works without it. Owner: sites-design@AgentiCCells.dinis. Code Apache-2.0.
(() => {
  const links = [...document.querySelectorAll('.secnav a')];
  const nav = document.querySelector('.secnav ul');
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const mark = id => {
    links.forEach(a => a.removeAttribute('aria-current'));
    const a = byId.get(id); if (!a) return;
    a.setAttribute('aria-current', 'true');
    const l = a.offsetLeft - 16, r = a.offsetLeft + a.offsetWidth + 16;
    if (l < nav.scrollLeft || r > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: l, behavior: 'auto' });
  };
  const secs = [...byId.keys()].map(id => document.getElementById(id)).filter(Boolean);
  let ticking = false, current = '';
  const pick = () => {
    ticking = false;
    const line = innerHeight * 0.35; let id = '';
    for (const s of secs) if (s.getBoundingClientRect().top <= line) id = s.id;
    if (id !== current) { current = id; if (id) mark(id); else links.forEach(a => a.removeAttribute('aria-current')); }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
  pick();
  const track = document.querySelector('.tl'), ctrl = document.querySelector('.tl-ctrl');
  if (track && ctrl) {
    ctrl.hidden = false;
    const [prev, next] = ctrl.querySelectorAll('button');
    const step = () => (track.querySelector('.tl-item')?.offsetWidth || 280) * 2;
    const update = () => { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4; };
    ctrl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) track.scrollBy({ left: step() * Number(b.dataset.dir), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update); update();
  }
})();
