// Shared layout and helpers for V2, the AE Innovation Hub (Algarve Evolution) (English only).
// Every page is scripts/v2/<name>.mjs exporting `path`, `title`, optional `nav` (its label in the main menu) and
// render(ctx). ctx = hubContext(...): { feed, data, version, path, h, layout, ix, NAV, PERSONAS }.
// Odoo is the source of truth: pages read only the public feed (src/feeds/public.json); the staff view decrypts
// the private feed in the browser (src/hub/hub.js). Docs: docs/v2/BRIEF.md, docs/v2/CONTRACT.md.
import { formatDate } from '../render.mjs';

export const NAV = [
  { path: '/', label: 'The Hub' },
  { path: '/inc-acc/', label: 'INC/ACC' },
  { path: '/challenge-connect/', label: 'Challenge Connect' },
  { path: '/vibathon/', label: 'Vibathon' },
  { path: '/talent/', label: 'Talent Ecosystem' },
  { path: '/workflows/', label: 'Workflows' },
  { path: '/plan/', label: 'Plan' },
  { path: '/odoo/', label: 'Odoo' },
];
// The personas a visitor can try the hub as (Dinis: "get the different personas to try it out").
export const PERSONAS = [
  { id: 'visitor', label: 'Visitor', hint: 'What anyone can see' },
  { id: 'founder', label: 'Founder', hint: 'A startup in a programme' },
  { id: 'mentor', label: 'Mentor', hint: 'One-to-one or guest mentor' },
  { id: 'challenger', label: 'Challenge owner', hint: 'A company with a problem' },
  { id: 'supplier', label: 'Supplier', hint: 'A company or professional with a solution' },
  { id: 'participant', label: 'Participant or jury', hint: 'At a Vibathon' },
  { id: 'professional', label: 'Professional or investor', hint: 'A consultant, professional or investor in the network' },
  { id: 'staff', label: 'Algarve Evolution team', hint: 'Unlocks the private feed with an access key' },
];

export function hubContext({ data, feed, version, path, title }) {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const date = iso => (iso ? formatDate(String(iso).slice(0, 10), 'en') : '');
  const num = n => Number(n ?? 0).toLocaleString('en-GB');
  const money = n => `€${Number(n ?? 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  // Index every list in the feed by id: ix.companies['co-10'].
  const ix = Object.fromEntries(Object.entries(feed).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, Object.fromEntries(v.filter(r => r && r.id).map(r => [r.id, r]))]));
  // A small chip that says which Odoo records a block is built from ("Odoo · aih.programme · 2").
  const odoo = (model, count) => `<span class="odoo-chip" title="Read from Odoo, model ${esc(model)}"><span class="odoo-dot" aria-hidden="true"></span>Odoo · ${esc(model)}${count != null ? ` · ${num(count)}` : ''}</span>`;
  const sim = r => (r?.simulated ? '<span class="sim-badge" title="Invented for the prototype">Simulated</span>' : '');
  const src = r => (r?.source ? `<a class="src-link" href="${esc(r.source)}" rel="noopener">source</a>` : '');
  const h = { esc, date, num, money, odoo, sim, src };
  const exported = feed.meta?.exported ? date(feed.meta.exported) : '';
  const v = data.voice;
  const layout = ({ body, description = '', head = '', scripts = '', pageClass = '' }) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}${path === '/' ? '' : ' · AE Innovation Hub'}</title>
<meta name="description" content="${esc(description || 'The AE Innovation Hub by Algarve Evolution: incubation and acceleration, Challenge Connect, Vibathon and the Talent Ecosystem, with Odoo as the source of truth.')}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0a1d3d">
<link rel="icon" href="/hub/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/hub/base.css">
<link rel="stylesheet" href="/hub/hub.css">
${head}
</head>
<body class="${esc(pageClass)}" data-persona="visitor">
<a class="skip" href="#main">Skip to content</a>
<div class="proto" role="note"><span>${esc(v.banner.en)}</span> <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(v.banner_link.en)}</a> <a class="proto-v1" href="/v1/">V1 experiments</a></div>
<header class="hub-top">
  <div class="hub-wrap hub-top-row">
    <a class="hub-brand" href="/"><span class="hub-mark" aria-hidden="true"></span><span><strong>AE Innovation Hub</strong><small>Algarve Evolution</small></span></a>
    <nav class="hub-nav" aria-label="Hub"><ul>${NAV.map(n => `<li><a href="${n.path}"${n.path === path ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('')}</ul></nav>
  </div>
  <div class="hub-wrap persona-row">
    <label class="persona-label" for="persona">Try it as</label>
    <select id="persona" class="persona-select" data-persona-select>${PERSONAS.map(p => `<option value="${p.id}">${esc(p.label)}</option>`).join('')}</select>
    <span class="persona-hint" data-persona-hint>${esc(PERSONAS[0].hint)}</span>
    <span class="feed-state" data-feed-state>Public feed · exported from Odoo ${esc(exported)}</span>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="hub-foot">
  <div class="hub-wrap">
    <p><strong>${esc(v.banner.en)}</strong></p>
    <p>Everything on these pages is read from Odoo, Algarve Evolution's source of truth: the public feed exported on ${esc(exported)} (${esc(feed.meta?.odoo?.version || 'Odoo')}). Records marked <span class="sim-badge">Simulated</span> are invented for the prototype; real organisations and events link to their sources. António Guerreiro, executive director, is the only person named.</p>
    <p>${esc(v.footer_disclosure.en)}</p>
    <p>Version __VERSION__ · <a href="/feeds/public.json">public feed</a> · <a href="/odoo/">how Odoo is used</a> · <a href="/decks/">decks</a> · <a href="/v3/">V3, real data only</a> · <a href="/v1/">V1 experiments</a> · code Apache-2.0, Odoo addon LGPL-3, text CC BY 4.0</p>
  </div>
</footer>
<script type="application/json" id="hub-personas">${JSON.stringify(PERSONAS)}</script>
<script src="/hub/hub.js" defer></script>
${scripts}
</body>
</html>`;
  return { feed, data, version, path, title, h, layout, ix, NAV, PERSONAS };
}
