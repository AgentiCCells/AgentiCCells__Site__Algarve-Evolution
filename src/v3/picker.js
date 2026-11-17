// The V3 design picker: António's four designs over the same real data. The last choice is remembered in this browser
// to mark it in the picker; it never redirects.
(() => {
  const cfg = JSON.parse(document.getElementById('v3-designs')?.textContent || '{}');
  const KEY = 'v3-design'; const store = { get() { try { return localStorage.getItem(KEY); } catch { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch {} } };
  const here = cfg.current;
  // The home page always shows The Brief (it is the site's front door); the picker moves between designs.
  if (!location.search.includes('design=') || here) store.set(here);
  let box;
  function open() {
    if (!box) {
      box = document.createElement('div'); box.className = 'v3-pick'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Choose a design');
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      box.innerHTML = `<div class="v3-pick-box"><button type="button" class="v3-pick-close" aria-label="Close">×</button><h2>Choose a design</h2><p>The four designs António picked, over the same real data: only what Algarve Evolution has published, each fact with its source.</p><div class="v3-pick-grid">${(cfg.designs || []).map(d => `<a href="${esc(d.path)}?design=${esc(d.slug)}" data-slug="${esc(d.slug)}"${d.slug === here ? ' aria-current="true"' : ''}><div class="v3-pick-thumb" style="background-image:url('/v3/thumbs/${esc(d.slug)}.jpg')"></div><strong>${esc(d.name)}</strong><span>${esc(d.tagline)}</span></a>`).join('')}</div></div>`;
      document.body.appendChild(box);
      box.addEventListener('click', e => { if (e.target === box || e.target.closest('.v3-pick-close')) close(); });
      box.querySelectorAll('[data-slug]').forEach(a => a.addEventListener('click', () => store.set(a.dataset.slug)));
    }
    box.hidden = false; document.body.style.overflow = 'hidden'; box.querySelector('.v3-pick-close').focus();
  }
  function close() { box.hidden = true; document.body.style.overflow = ''; document.querySelector('[data-v3-picker]')?.focus(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box && !box.hidden) close(); });
  document.querySelectorAll('[data-v3-picker]').forEach(b => b.addEventListener('click', open));
})();
