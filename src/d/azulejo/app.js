// Azulejo: the municipality tiles turn over on hover, on keyboard focus, and on tap. Without this script,
// they turn over on hover and focus (CSS only). By sites-design@AgentiCCells.dinis. Apache-2.0.
(() => {
  document.documentElement.classList.add('js');
  const cards = [...document.querySelectorAll('.mt-card')];
  // Both faces are in the page for screen readers; turning a tile over only changes what is shown.
  const set = (card, on) => card.classList.toggle('is-flipped', on);
  for (const card of cards) {
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const on = !card.classList.contains('is-flipped');
      for (const c of cards) if (c !== card) set(c, false);
      set(card, on);
    });
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      if (e.key === 'Escape') set(card, false);
    });
  }
})();
