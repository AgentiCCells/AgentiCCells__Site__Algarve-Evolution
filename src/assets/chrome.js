// The design picker: the same site in several designs. The choice is kept in this browser only.
(() => {
  const me = document.currentScript, lang = me.dataset.lang || 'en', slug = me.dataset.slug || 'coast';
  const KEY = 'ae-design';
  const store = { get() { try { return localStorage.getItem(KEY); } catch { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch {} } };
  const W = ({
    en: { title: 'Choose a design', intro: 'The same site, the same facts and sources, in several designs. Your choice is kept in this browser only.', classic: 'Classic', bold: 'Bold', close: 'Close' },
    pt: { title: 'Escolha um design', intro: 'O mesmo site, os mesmos factos e fontes, em vários designs. A escolha fica só neste navegador.', classic: 'Clássicos', bold: 'Ousados', close: 'Fechar' },
    es: { title: 'Elija un diseño', intro: 'El mismo sitio, los mismos hechos y fuentes, en varios diseños. Su elección se guarda solo en este navegador.', classic: 'Clásicos', bold: 'Atrevidos', close: 'Cerrar' },
    fr: { title: 'Choisir un design', intro: 'Le même site, les mêmes faits et sources, en plusieurs designs. Votre choix reste dans ce navigateur.', classic: 'Classiques', bold: 'Audacieux', close: 'Fermer' },
  })[lang] || null;
  const q = new URLSearchParams(location.search).get('design');
  if (q) store.set(q);
  // The default design at / remembers a chosen design and opens it, unless ?design= says otherwise.
  if (slug === 'coast' && !q) { const saved = store.get(); if (saved && saved !== 'coast') fetch('/designs.json').then(r => r.json()).then(m => { const d = m.designs.find(x => x.slug === saved); if (d) location.replace((d.paths[lang] || d.paths.en)); }).catch(() => {}); }
  if (slug !== 'app' && slug !== 'coast' && !q) store.set(slug);
  let box;
  async function open() {
    if (!box) {
      const m = await (await fetch('/designs.json')).json();
      box = document.createElement('div'); box.className = 'ae-pick'; box.hidden = true;
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', W.title);
      const card = d => `<a class="ae-pick-card" href="${(d.paths[lang] || d.paths.en)}?design=${d.slug}" data-slug="${d.slug}"${d.slug === slug ? ' aria-current="true"' : ''}><div class="ae-pick-thumb"${d.thumb ? ` style="background-image:url('${d.thumb}')"` : ''}></div><strong>${d.name[lang] || d.name.en}</strong><span>${d.tagline[lang] || d.tagline.en}</span></a>`;
      const group = g => m.designs.filter(d => d.group === g).map(card).join('');
      box.innerHTML = `<div class="ae-pick-box"><button type="button" class="ae-pick-close" aria-label="${W.close}">×</button><h2>${W.title}</h2><p>${W.intro}</p><h3>${W.classic}</h3><div class="ae-pick-grid">${group('classic')}</div><h3>${W.bold}</h3><div class="ae-pick-grid">${group('bold')}</div></div>`;
      document.body.appendChild(box);
      box.addEventListener('click', e => { if (e.target === box || e.target.closest('.ae-pick-close')) close(); });
      box.querySelectorAll('.ae-pick-card').forEach(a => a.addEventListener('click', () => store.set(a.dataset.slug)));
    }
    box.hidden = false; document.body.style.overflow = 'hidden'; box.querySelector('.ae-pick-close').focus();
  }
  function close() { box.hidden = true; document.body.style.overflow = ''; document.querySelector('[data-ae-picker]')?.focus(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box && !box.hidden) close(); });
  document.querySelectorAll('[data-ae-picker]').forEach(b => b.addEventListener('click', open));
})();
