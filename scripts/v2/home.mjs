// The hub's home. (Placeholder until the home agent writes the real one.)
export const path = '/';
export const title = 'Algarve Innovation Hub';
export function render({ layout, feed, h }) {
  return layout({ body: `<section class="hub-wrap"><h1>${h.esc(feed.hub.name)}</h1><ul>${feed.hub.activities.map(a => `<li><strong>${h.esc(a.name)}</strong>: ${h.esc(a.summary)}</li>`).join('')}</ul>${h.odoo('aih.activity', feed.hub.activities.length)}</section>` });
}
