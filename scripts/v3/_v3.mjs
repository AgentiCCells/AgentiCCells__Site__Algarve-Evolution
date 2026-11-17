// V3: the AE Innovation Hub with REAL DATA ONLY, in the four designs António Guerreiro liked (16 November 2026):
// The Brief, Mission Control, The Atlas, The Future. English only. V2 (the simulated "what it could be") stays at /.
// Dinis Cruz, 16 November 2026: "yes please build V3 using those 4 designs (and yes keep v2)".
// Each design is scripts/v3/<slug>.mjs exporting `meta` { slug, order, name, tagline } and render(ctx); its files
// live in src/v3/<slug>/ (served at /v3/<slug>/...). The Brief is the default at /v3/; the others at /v3/<slug>/.
// ctx = { real, data, h, chrome, slug, self, designs, version }:
//   real  = src/feeds/real.json (docs/v3/REAL-FEED.md): only real records, each with its source; never simulated.
//   data  = src/data/*.json in English (the sourced facts V1 was built from).
//   h     = { esc, t, cite, link, source, date, num } (cite links each fact to its source).
//   chrome = { head, banner, foot }: the prototype note, the V3 design picker, links to V2. Every page carries all three.
import { helpers, localise } from '../site-data.mjs';

export const V3_DEFAULT = 'brief';
export const v3Path = slug => (slug === V3_DEFAULT ? '/' : `/${slug}/`);

export function v3Context({ data, real, version, slug, designs }) {
  const en = localise(data, 'en');
  const h = helpers(en, 'en');
  const { esc } = h;
  const v = en.voice;
  const list = designs.map(d => ({ slug: d.slug, name: d.name, tagline: d.tagline, path: v3Path(d.slug) }));
  const chrome = {
    head: `<link rel="stylesheet" href="/v3/v3.css"><meta name="robots" content="noindex, nofollow"><link rel="icon" href="/hub/favicon.svg" type="image/svg+xml">`,
    // Two rows: the prototype note, then V3's four designs (all visible, the current one marked) and the other versions.
    banner: `<div class="v3-proto" role="note"><div class="v3-row"><span>${esc(v.banner.en)}</span> <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(v.banner_link.en)}</a></div><nav class="v3-row v3-nav" aria-label="Versions and designs"><span class="v3-tag">V3 · real data only</span><span class="v3-designs">${list.map(d => `<a class="v3-d" href="${d.path}"${d.slug === slug ? ' aria-current="page"' : ''}>${esc(d.name)}</a>`).join('')}</span><button type="button" class="v3-pick-btn" data-v3-picker aria-haspopup="dialog">Compare designs</button><span class="v3-sep" aria-hidden="true"></span><a class="v3-ver" href="/decks/">Decks</a><a class="v3-ver" href="/v2/">V2: what it could be</a><a class="v3-ver" href="/v1/">V1 experiments</a></nav></div>`,
    foot: `<script type="application/json" id="v3-designs">${JSON.stringify({ current: slug, designs: list }).replace(/</g, '\\u003c')}</script><script src="/v3/picker.js" defer></script>`,
    version,
  };
  return { real, data: en, h, chrome, slug, self: v3Path(slug), designs: list, version };
}
