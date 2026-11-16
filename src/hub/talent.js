// The Talent Ecosystem: the Algarve Digital Innovators network as a directory, a map, a competence matrix, a
// network and a consent flow. Odoo is the source of truth: everything here is read from the feed exported from
// Odoo (res.partner with aih_talent_kind, aih.community, and the hub's activities).
// This file is an ES module used twice: scripts/v2/talent.mjs imports the render functions at build time, and the
// browser loads it as <script type="module"> to make the page explorable (filters, map, finder, network, the
// "your listing" flow and, for the Algarve Evolution team, the private feed and the data-quality panel).
// Nothing is ever sent to Odoo from here: actions are kept in this browser and show the Odoo call they would make.
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0.

export const KINDS = [
  { id: 'community', label: 'Communities', one: 'Community', group: 'net' },
  { id: 'informal_group', label: 'Informal groups', one: 'Informal group', group: 'net' },
  { id: 'professional', label: 'Professionals', one: 'Professional', group: 'people' },
  { id: 'consultant', label: 'Consultants', one: 'Consultant', group: 'people' },
  { id: 'mentor', label: 'Mentors', one: 'Mentor', group: 'people' },
  { id: 'investor', label: 'Investors', one: 'Investor', group: 'people' },
  { id: 'partner', label: 'Project partners', one: 'Project partner', group: 'org' },
  { id: 'stakeholder', label: 'Stakeholders', one: 'Stakeholder', group: 'org' },
];
// Challenges still looking for suppliers.
export const OPEN = new Set(['open', 'matching']);
export const PEOPLE = new Set(['professional', 'consultant', 'mentor', 'investor']);
const KIND = Object.fromEntries([...KINDS, { id: 'supplier', label: 'Supplier companies', one: 'Supplier company (Challenge Connect)', group: 'org' }].map(k => [k.id, k]));
export const ACTS = [
  { id: 'inc', label: 'INC/ACC', href: '/inc-acc/' },
  { id: 'cc', label: 'Challenge Connect', href: '/challenge-connect/' },
  { id: 'vib', label: 'Vibathon', href: '/vibathon/' },
];

// ------------------------------------------------------------------ small helpers (same markup as the hub's h.*)
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = n => Number(n ?? 0).toLocaleString('en-GB');
export const chip = (model, count) => `<span class="odoo-chip" title="Read from Odoo, model ${esc(model)}"><span class="odoo-dot" aria-hidden="true"></span>Odoo · ${esc(model)}${count != null ? ` · ${num(count)}` : ''}</span>`;
const simB = r => (r?.simulated ? '<span class="sim-badge" title="Invented for the prototype">Simulated</span>' : '');
const srcL = r => (r?.source ? `<a class="src-link" href="${esc(r.source)}" rel="noopener">source</a>` : '');
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const uniq = a => [...new Set(a.filter(Boolean))];
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
// "Connect the guest chatbot to three hotel booking systems (simulated)" -> "Connect the guest chatbot… (simulated)"
const shortName = (s, n) => { const sim = / \(simulated\)$/.test(s); const b = s.replace(/ \(simulated\)$/, ''); return sim ? cut(b, n - 12) + ' (simulated)' : cut(b, n); };

// Towns that are not municipalities, mapped to their municipality (Quarteira is in Loulé, and so on).
const ALIAS = { quarteira: 'loule', almancil: 'loule', vilamoura: 'loule', ferragudo: 'lagoa', alvor: 'portimao', sagres: 'vila-do-bispo', 'monte gordo': 'vila-real-de-santo-antonio', 'armacao de pera': 'silves', vrsa: 'vila-real-de-santo-antonio' };
export function muniResolver(munis) {
  const byName = new Map(munis.map(m => [norm(m.name), m.id]));
  return v => { if (!v) return null; const n = norm(v); if (byName.has(n)) return byName.get(n); if (ALIAS[n]) return ALIAS[n]; if (/algarve|region/.test(n)) return 'region'; return 'outside'; };
}
export const muniLabel = (munis, id) => (id === 'region' ? 'Algarve-wide' : id === 'outside' ? 'Outside the Algarve' : id ? (munis.find(m => m.id === id)?.name || id) : 'No town in Odoo');

// ------------------------------------------------------------------ the model: one list of entries from the feed
// opts.priv: the feed is the private one (every record; people without consent are marked "not public").
// opts.local: what this browser changed ({ listing: { id: { consent, vals } }, fixes: { id: { town, community_id } } }).
export function buildModel(feed, munis, { priv = false, local = {} } = {}) {
  const L = a => (Array.isArray(a) ? a : []);
  const byId = a => new Map(L(a).map(r => [r.id, r]));
  const coms = byId(feed.communities), mentors = byId(feed.mentors), sups = byId(feed.suppliers), companies = byId(feed.companies);
  const programmes = L(feed.programmes), challenges = L(feed.challenges), vibathons = L(feed.vibathons), projects = L(feed.projects);
  const vocab = uniq([...L(feed.mentors).flatMap(m => m.expertise || []), ...L(feed.suppliers).flatMap(s => s.capabilities || []), ...challenges.flatMap(c => c.skills || [])]).sort((a, b) => a.localeCompare(b));
  const isComp = new Set(vocab);
  const muniOf = muniResolver(munis);
  const listing = local.listing || {}, fixes = local.fixes || {};

  // Links to the hub's activities, from the activities themselves.
  const act = id => {
    const inc = new Set(), cc = new Set(), vib = new Set(), roles = new Set();
    const m = mentors.get(id);
    if (m) { roles.add('mentor'); for (const c of m.company_ids || []) { const p = companies.get(c)?.programme_id; if (p) inc.add(p); } }
    for (const p of programmes) if ((p.mentor_ids || []).includes(id) && (!m || !(m.company_ids || []).length)) inc.add(p.id);
    for (const a of L(feed.applications)) if (a.supplier_id === id) { cc.add(a.challenge_id); roles.add('supplier'); }
    return { inc, cc, vib, roles };
  };
  const entries = [];
  const linkVib = (e) => {
    for (const v of vibathons) {
      if ((v.mentor_ids || []).includes(e.id)) { e.vib.add(v.id); e.roles.add('vibathon mentor'); }
      for (const j of v.jury || []) if (j.partner_id ? j.partner_id === e.id : j.name === e.name) { e.vib.add(v.id); e.roles.add('jury'); }
    }
    for (const p of projects) {
      const inTeam = p.team_ids ? p.team_ids.includes(e.id) : (p.team || []).includes(e.name);
      if (inTeam && p.vibathon_id) { e.vib.add(p.vibathon_id); e.roles.add('team member'); }
    }
  };
  for (const t of L(feed.talent)) {
    const com = t.community_id ? coms.get(t.community_id) : null;
    const own = !!com && t.id === `t-${com.id}`;
    const fx = fixes[t.id] || {}, ls = listing[t.id] || {};
    const town = ls.vals?.town ?? fx.town ?? t.town ?? null;
    let muni = muniOf(town);
    if (!muni && own) muni = muniOf(com.municipality);
    const kind = ls.vals?.kind || t.kind;
    const comps = ls.vals?.comps || uniq([...(t.tags || []).filter(x => isComp.has(x)), ...(mentors.get(t.id)?.expertise || []), ...(sups.get(t.id)?.capabilities || [])]);
    const a = act(t.id);
    const e = {
      id: t.id, odoo: t.odoo, kind, name: t.name, town, muni, comps, summary: ls.vals?.summary ?? t.summary ?? '',
      tags: (t.tags || []).filter(x => !isComp.has(x)), source: t.source || null, simulated: !!t.simulated,
      consent: ls.consent ?? !!t.consent, published: !!t.published, isPerson: PEOPLE.has(kind),
      communityId: own ? null : (fx.community_id ?? t.community_id ?? null), comRecord: own ? com.id : null,
      inc: a.inc, cc: a.cc, vib: a.vib, roles: a.roles, changed: !!(ls.vals || fx.town || fx.community_id || ls.consent != null),
    };
    linkVib(e);
    entries.push(e);
  }
  // Communities in aih.community with no contact record of their own still belong to the directory.
  const hasRecord = new Set(entries.map(e => e.comRecord).filter(Boolean));
  for (const c of L(feed.communities)) if (!hasRecord.has(c.id)) {
    entries.push({
      id: c.id, odoo: c.odoo, kind: /informal/.test(c.kind || '') ? 'informal_group' : 'community', name: c.name, town: null,
      muni: muniOf(c.municipality), comps: [], summary: `${c.kind ? c.kind[0].toUpperCase() + c.kind.slice(1) : 'Community'} in ${c.municipality || 'the Algarve'}${c.members ? `, ${num(c.members)} members` : ''}.`,
      tags: [], source: c.source || null, simulated: !!c.simulated, consent: true, published: !!c.published, isPerson: false,
      communityId: null, comRecord: c.id, noContact: true, inc: new Set(), cc: new Set(), vib: new Set(), roles: new Set(),
    });
  }
  // Supplier companies of Challenge Connect: not one of the eight kinds, but found by competence and in the network.
  const suppliers = L(feed.suppliers).filter(s => s.kind === 'company').map(s => {
    const a = act(s.id);
    return { id: s.id, odoo: s.odoo, kind: 'supplier', name: s.name, town: s.town, muni: muniOf(s.town), comps: s.capabilities || [], summary: s.rate ? `Challenge Connect supplier, ${s.rate}.` : 'Challenge Connect supplier.', tags: [], simulated: !!s.simulated, source: s.source || null, consent: true, published: !!s.published, isPerson: false, communityId: null, inc: a.inc, cc: a.cc, vib: new Set(), roles: a.roles, contact: s.contact };
  });
  for (const e of [...entries, ...suppliers]) e.notPublic = !e.published || (e.isPerson && !e.consent);
  // In the public view, a person who has withdrawn consent in this browser leaves the directory too.
  const visible = priv ? entries : entries.filter(e => !e.notPublic);
  const withdrawnHere = priv ? 0 : entries.filter(e => e.isPerson && e.published && !e.consent).length;
  const feedWithheld = feed.meta?.withheld;
  const withheldFeed = typeof feedWithheld === 'number' ? feedWithheld : (feedWithheld && typeof feedWithheld.talent === 'number' ? feedWithheld.talent : null);
  const hidden = priv ? entries.filter(e => e.isPerson && e.published && !e.consent).length : (withheldFeed == null ? null : withheldFeed + withdrawnHere);
  return {
    priv, entries: visible, all: entries, suppliers, vocab, munis, coms: L(feed.communities), programmes, challenges, vibathons, projects,
    listed: visible.filter(e => e.isPerson && !e.notPublic).length, hidden, withdrawnHere, odooDb: feed.meta?.odoo?.db || 'algarve_innovation_hub',
  };
}

// ------------------------------------------------------------------ filtering
export const EMPTY = { kinds: [], comp: '', muni: '', q: '', origin: '', community: '' };
const hay = e => norm([e.name, e.summary, e.town, ...e.comps, ...e.tags, KIND[e.kind]?.one].join(' '));
export function matches(e, f, skip = '') {
  if (skip !== 'kinds' && f.kinds.length && !f.kinds.includes(e.kind)) return false;
  if (skip !== 'comp' && f.comp && !e.comps.includes(f.comp)) return false;
  if (skip !== 'muni' && f.muni && (e.muni || 'none') !== f.muni) return false;
  if (f.origin === 'real' && e.simulated) return false;
  if (f.origin === 'simulated' && !e.simulated) return false;
  if (f.community && e.communityId !== f.community && e.comRecord !== f.community) return false;
  if (f.q) { const h = hay(e); if (!norm(f.q).split(/\s+/).every(w => h.includes(w))) return false; }
  return true;
}
const KORDER = Object.fromEntries(KINDS.map((k, i) => [k.id, i]));
export const sortEntries = a => a.slice().sort((x, y) => (KORDER[x.kind] - KORDER[y.kind]) || x.name.localeCompare(y.name, 'en'));

// ------------------------------------------------------------------ directory
export function kindFilters(model, f) {
  return KINDS.map(k => {
    const n = model.entries.filter(e => e.kind === k.id && matches(e, f, 'kinds')).length;
    const on = f.kinds.includes(k.id);
    return `<button type="button" class="te-kind g-${k.group}" data-kind="${k.id}" aria-pressed="${on}"><span class="te-kind-l">${esc(k.label)}</span><span class="te-kind-n">${num(n)}</span></button>`;
  }).join('');
}
export function card(e, model) {
  const k = KIND[e.kind] || { one: e.kind, group: 'org' };
  const com = e.communityId ? model.coms.find(c => c.id === e.communityId) : null;
  const links = [];
  if (com) links.push(`Member of <button type="button" class="te-link" data-community="${esc(com.id)}">${esc(com.name)}</button>`);
  if (e.inc.size) links.push(`<a href="/inc-acc/">INC/ACC mentor</a>`);
  if (e.cc.size) links.push(`<a href="/challenge-connect/">Challenge Connect supplier</a>`);
  if (e.vib.size) links.push(`<a href="/vibathon/">Vibathon ${esc([...e.roles].filter(r => /jury|team|vibathon/.test(r)).map(r => r.replace('vibathon ', '')).join(', ') || 'participant')}</a>`);
  if (e.comRecord) { const n = model.entries.filter(x => x.communityId === e.comRecord).length; if (n) links.push(`<button type="button" class="te-link" data-community="${esc(e.comRecord)}">${n} ${n === 1 ? 'person' : 'people'} listed</button>`); }
  const np = model.priv && e.notPublic ? `<span class="tag tag-accent" title="In Odoo, but not in the public feed">${!e.published ? 'Not published' : 'Not public: no consent'}</span>` : '';
  const ml = muniLabel(model.munis, e.muni), where = e.town && e.town !== ml ? `${ml} (${e.town})` : ml;
  const mine = e.changed ? '<span class="tag tag-warn" title="Changed in this browser only">Changed here</span>' : '';
  return `<article class="te-card g-${k.group}${e.notPublic ? ' is-np' : ''}" data-id="${esc(e.id)}">
<p class="te-card-k"><span>${esc(k.one)}</span><span class="te-card-t">${esc(where)}</span></p>
<h3>${esc(e.name)}</h3>
<p class="te-card-b">${simB(e)}${e.source ? ` <span class="tag tag-ok">Real</span> ${srcL(e)}` : ''}${np}${mine}</p>
${e.summary ? `<p class="te-card-s">${esc(e.summary)}</p>` : ''}
${e.comps.length ? `<ul class="te-tags" aria-label="Competences">${e.comps.map(c => `<li class="tag">${esc(c)}</li>`).join('')}</ul>` : ''}
${links.length ? `<p class="te-card-l">${links.join(' · ')}</p>` : ''}
<p class="te-card-o">Odoo ${esc(e.odoo?.model || '')} #${esc(e.odoo?.id ?? '')}${model.priv && e.contact ? ` · ${esc(e.contact)}` : ''}</p>
</article>`;
}
export function directory(model, f, limit = 24) {
  const list = sortEntries(model.entries.filter(e => matches(e, f)));
  const shown = list.slice(0, limit);
  return { total: list.length, html: shown.map(e => card(e, model)).join('') || '<p class="te-empty">Nothing matches these filters. Clear one to see more.</p>', more: list.length - shown.length };
}

// ------------------------------------------------------------------ the map of the Algarve (outline from places.json)
export const MAP = { w: 900, h: 400, lon0: -9.06, lon1: -7.24, lat0: 36.93, lat1: 37.565 };
const K = Math.cos(37.2 * Math.PI / 180);
const SX = MAP.w / ((MAP.lon1 - MAP.lon0) * K);
export const project = ([lon, lat]) => [+((lon - MAP.lon0) * K * SX).toFixed(1), +((MAP.lat1 - lat) * SX).toFixed(1)];
// Where each municipality's name sits, so the crowded coast stays readable: [dx sign, dy sign, anchor].
const LABEL = {
  'vila-do-bispo': [0, 1, 'middle'], lagos: [0, 1, 'middle'], portimao: [0, 1, 'middle'], lagoa: [1, 0, 'start'], silves: [0, -1, 'middle'],
  monchique: [0, -1, 'middle'], aljezur: [0, -1, 'middle'], albufeira: [0, 1, 'middle'], loule: [-1, -1, 'end'], 'sao-bras-de-alportel': [1, -1, 'start'],
  faro: [-1, 1, 'end'], olhao: [1, 1, 'start'], tavira: [0, 1, 'middle'], 'vila-real-de-santo-antonio': [0, 0, 'end', [-7.265, 37.035]], 'castro-marim': [-1, -1, 'end'], alcoutim: [1, 0, 'start'],
};
export function mapBase(outline) {
  const ring = r => 'M' + r.map(p => project(p).join(' ')).join('L') + 'Z';
  const path = c => (outline.countries[c] || []).map(pg => pg.map(ring).join('')).join('');
  return `<rect class="tm-sea" width="${MAP.w}" height="${MAP.h}"/><path class="tm-es" d="${path('Spain')}"/><path class="tm-pt" d="${path('Portugal')}"/>` +
    `<text class="tm-geo" x="${project([-7.33, 37.5])[0]}" y="${project([-7.33, 37.5])[1]}">Spain</text><text class="tm-geo tm-sea-t" x="${project([-8.35, 36.97])[0]}" y="${project([-8.35, 36.97])[1]}">Atlantic Ocean</text>`;
}
export const radius = n => (n ? +(5 + 4.2 * Math.sqrt(n)).toFixed(1) : 3);
export function mapMarks(model, f) {
  const counts = {}; for (const e of model.entries) if (matches(e, f, 'muni')) counts[e.muni || 'none'] = (counts[e.muni || 'none'] || 0) + 1;
  const comsBy = {}; for (const c of model.coms) { const m = muniResolver(model.munis)(c.municipality) || 'none'; (comsBy[m] ||= []).push(c); }
  const g = model.munis.map(m => {
    const [x, y] = project(m.ll); const n = counts[m.id] || 0; const r = radius(n); const sel = f.muni === m.id;
    const [lx, ly, an, at] = LABEL[m.id] || [0, 1, 'middle'];
    let tx = x + lx * (r + 4), ty = y + (ly > 0 ? r + 15 : ly < 0 ? -(r + 6) : 4), lead = '';
    // A label placed away from a crowded spot, with a thin leader line back to its circle.
    if (at) { [tx, ty] = project(at); lead = `<path class="tm-lead" d="M${x} ${y + r}L${tx - 30} ${ty - 12}"/>`; }
    const cs = comsBy[m.id] || [];
    const sq = cs.map((c, i) => { const sx = x - (cs.length * 10 - 2) / 2 + i * 10, sy = y - r - 12; return `<rect class="tm-com" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="8" height="8"><title>${esc(c.name)} (community, real)</title></rect>`; }).join('');
    return `<g class="tm-m${sel ? ' is-sel' : ''}${n ? '' : ' is-zero'}" data-muni="${m.id}" tabindex="0" role="button" aria-pressed="${sel}" aria-label="${esc(m.name)}: ${n} in the current selection${cs.length ? `, ${cs.length} ${cs.length === 1 ? 'community' : 'communities'}` : ''}">` +
      `<circle class="tm-hit" cx="${x}" cy="${y}" r="${Math.max(r, 14)}"/><circle class="tm-c" cx="${x}" cy="${y}" r="${r}"/>` +
      lead + (n && r >= 11 ? `<text class="tm-n" x="${x}" y="${y + 4}">${n}</text>` : '') + sq +
      `<text class="tm-label" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${an}">${esc(m.name)}${n && r < 11 ? ` · ${n}` : ''}</text><title>${esc(m.name)}: ${n}</title></g>`;
  }).join('');
  return { svg: g, counts, comsBy };
}
// The list beside the map: every municipality with its count and its (real) communities.
export function muniList(model, f) {
  const { counts, comsBy } = mapMarks(model, f);
  const order = model.munis.slice().sort((a, b) => a.ll[0] - b.ll[0]);
  const row = (id, name) => {
    const n = counts[id] || 0, cs = comsBy[id] || [];
    return `<li class="${f.muni === id ? 'is-sel' : ''}"><button type="button" class="te-muni" data-muni="${id}" aria-pressed="${f.muni === id}"><span>${esc(name)}</span><b>${n}</b></button>${cs.length ? `<ul class="te-muni-c">${cs.map(c => `<li><span class="te-sq" aria-hidden="true"></span>${esc(c.name)} ${srcL(c)}</li>`).join('')}</ul>` : ''}</li>`;
  };
  return order.map(m => row(m.id, m.name)).join('') + row('region', 'Algarve-wide') + (counts.outside ? row('outside', 'Outside the Algarve') : '') + (counts.none ? row('none', 'No town in Odoo') : '');
}

// ------------------------------------------------------------------ competences
const MCOLS = [
  { id: 'professional', label: 'Professionals' }, { id: 'consultant', label: 'Consultants' }, { id: 'mentor', label: 'Mentors' },
  { id: 'investor', label: 'Investors' }, { id: 'supplier', label: 'Supplier companies' },
];
const level = (n, max) => (!n ? 0 : Math.min(4, Math.ceil((n / Math.max(1, max)) * 4)));
export function matrix(model, mode = 'kind') {
  const pool = [...model.entries, ...model.suppliers.filter(s => model.priv || !s.notPublic)];
  const cols = mode === 'kind' ? MCOLS : model.munis.slice().sort((a, b) => a.ll[0] - b.ll[0]).map(m => ({ id: m.id, label: m.name }));
  const key = e => (mode === 'kind' ? e.kind : e.muni);
  const demand = c => model.challenges.filter(ch => (ch.skills || []).includes(c) && OPEN.has(ch.status)).length;
  const rows = model.vocab.map(c => {
    const has = pool.filter(e => e.comps.includes(c));
    return { c, total: has.length, cells: cols.map(col => has.filter(e => key(e) === col.id).length), demand: demand(c) };
  }).sort((a, b) => b.total - a.total || a.c.localeCompare(b.c));
  const max = Math.max(1, ...rows.flatMap(r => r.cells));
  const head = `<tr><th scope="col" class="te-mx-c">Competence</th>${cols.map(c => `<th scope="col"${mode === 'muni' ? ' class="te-mx-v"' : ''}><span>${esc(c.label)}</span></th>`).join('')}<th scope="col" class="te-mx-t"><span>Total</span></th><th scope="col" class="te-mx-d"><span>Open challenges asking</span></th></tr>`;
  const body = rows.map(r => `<tr${r.total === 0 ? ' class="is-gap"' : ''}><th scope="row" class="te-mx-c">${esc(r.c)}</th>${r.cells.map((n, i) => `<td><button type="button" class="te-mx-b l${level(n, max)}" data-comp="${esc(r.c)}" data-${mode === 'kind' ? 'who' : 'where'}="${esc(cols[i].id)}" aria-label="${esc(r.c)}, ${esc(cols[i].label)}: ${n}">${n || '·'}</button></td>`).join('')}<td class="te-mx-t"><button type="button" class="te-mx-b te-mx-tb" data-comp="${esc(r.c)}" aria-label="${esc(r.c)}, everyone: ${r.total}">${r.total}</button></td><td class="te-mx-d">${r.demand ? `<a href="/challenge-connect/" class="te-dem${r.demand > r.total / 3 ? ' is-short' : ''}" title="Open challenges in Challenge Connect that ask for ${esc(r.c)}">${r.demand}</a>` : '<span class="te-dim">·</span>'}</td></tr>`).join('');
  return `<table class="te-mx te-mx-${mode}"><caption class="vh">Competences by ${mode === 'kind' ? 'kind' : 'municipality'}: how many people and companies in the ${model.priv ? 'private' : 'public'} feed have each competence</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

// Find people or organisations by competence: rank by competences matched, then same municipality.
export const WHO = [
  { id: '', label: 'Anyone' }, { id: 'mentor', label: 'A mentor' }, { id: 'investor', label: 'An investor' },
  { id: 'professional consultant', label: 'A professional or consultant' }, { id: 'supplier', label: 'A supplier company' },
  { id: 'community informal_group', label: 'A community or group' }, { id: 'partner stakeholder', label: 'An organisation' },
];
export function find(model, { comps = [], who = '', where = '' }) {
  const kinds = who ? who.split(' ') : null;
  const pool = [...model.entries, ...model.suppliers.filter(s => model.priv || !s.notPublic)];
  const res = pool.filter(e => !kinds || kinds.includes(e.kind)).map(e => {
    const hit = comps.filter(c => e.comps.includes(c));
    const near = where && e.muni === where;
    return { e, hit, near, score: hit.length * 3 + (near ? 1 : 0) + (e.cc.size || e.inc.size ? .2 : 0) };
  }).filter(r => (comps.length ? r.hit.length : true) && (!where || comps.length || r.near))
    .sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name, 'en'));
  const asks = comps.length ? model.challenges.filter(ch => OPEN.has(ch.status) && comps.some(c => (ch.skills || []).includes(c))) : [];
  return { res, asks };
}
export function findHtml(model, q, limit = 10) {
  const { res, asks } = find(model, q);
  if (!q.comps.length && !q.who && !q.where) return '<p class="te-empty">Choose a competence, a challenge, or who you are looking for.</p>';
  const rows = res.slice(0, limit).map(({ e, hit, near }) => {
    const k = KIND[e.kind];
    const why = [...hit.map(c => `has ${esc(c)}`), near ? `in ${esc(muniLabel(model.munis, e.muni))}` : '', e.inc.size ? 'mentors in INC/ACC' : '', e.cc.size ? 'already applied in Challenge Connect' : ''].filter(Boolean);
    return `<li class="te-hit${e.notPublic ? ' is-np' : ''}"><div><p class="te-hit-k">${esc(k.one)} · ${esc(muniLabel(model.munis, e.muni))}</p><h4>${esc(e.name)} ${simB(e)} ${srcL(e)}</h4><p class="te-hit-w">${why.join(' · ') || esc(e.summary)}</p>${e.notPublic ? '<p class="te-hit-np">Not public: ask for their consent before you introduce them.</p>' : ''}</div><span class="te-hit-s" aria-label="${hit.length} of ${q.comps.length} competences">${q.comps.length ? `${hit.length}/${q.comps.length}` : ''}</span></li>`;
  }).join('');
  return `<p class="te-find-n"><b>${res.length}</b> ${res.length === 1 ? 'match' : 'matches'}${res.length > limit ? `, the best ${limit} shown` : ''}.</p>${rows ? `<ol class="te-hits">${rows}</ol>` : '<p class="te-empty">Nobody in the feed has that yet: a gap the hub could fill.</p>'}` +
    (asks.length ? `<div class="te-asks"><p><b>Challenge Connect:</b> ${asks.length} open ${asks.length === 1 ? 'challenge asks' : 'challenges ask'} for ${q.comps.length > 1 ? 'these competences' : 'this competence'}.</p><ul>${asks.map(ch => `<li><a href="/challenge-connect/">${esc(ch.title)}</a> <span class="te-st">${esc(ch.status)}</span></li>`).join('')}</ul></div>` : '');
}

// ------------------------------------------------------------------ the network: communities, people, activities
export function networkData(model) {
  const lonOf = c => model.munis.find(m => m.id === muniResolver(model.munis)(c.municipality))?.ll[0] ?? 0;
  const left = model.coms.slice().sort((a, b) => lonOf(a) - lonOf(b) || a.name.localeCompare(b.name));
  const lix = new Map(left.map((c, i) => [c.id, i]));
  const right = [
    ...model.programmes.map(p => ({ id: p.id, name: p.name, act: 'inc' })),
    ...model.challenges.map(c => ({ id: c.id, name: c.title, act: 'cc' })),
    ...model.vibathons.map(v => ({ id: v.id, name: v.name, act: 'vib' })),
  ];
  const rix = new Map(right.map((r, i) => [r.id, i]));
  const linked = e => e.communityId || e.inc.size || e.cc.size || e.vib.size;
  const people = model.entries.filter(e => e.isPerson && linked(e));
  const firstR = e => Math.min(...[...e.inc, ...e.cc, ...e.vib].map(id => rix.get(id) ?? 99), 99);
  people.sort((a, b) => ((lix.get(a.communityId) ?? 99) - (lix.get(b.communityId) ?? 99)) || (firstR(a) - firstR(b)) || a.name.localeCompare(b.name));
  const sup = model.suppliers.filter(s => s.cc.size && (model.priv || !s.notPublic)).sort((a, b) => firstR(a) - firstR(b) || a.name.localeCompare(b.name));
  const middle = [...people, ...sup];
  const edges = [];
  for (const e of middle) {
    if (e.communityId && lix.has(e.communityId)) edges.push({ a: e.communityId, b: e.id, t: 'com' });
    for (const [set, t] of [[e.inc, 'inc'], [e.cc, 'cc'], [e.vib, 'vib']]) for (const id of set) if (rix.has(id)) edges.push({ a: e.id, b: id, t });
  }
  const unlinked = model.entries.filter(e => e.isPerson && !linked(e));
  return { left, middle, right, edges, unlinked };
}
export function networkSvg(model) {
  const { left, middle, right, edges } = networkData(model);
  const W = 1040, top = 54, row = 25, H = top + Math.max(middle.length, 12) * row + 16;
  const ys = (n, i, pad = 0) => +(top + pad + (n <= 1 ? (H - top - 16) / 2 : i * ((H - top - 16 - pad * 2) / (n - 1)))).toFixed(1);
  const pos = {};
  left.forEach((c, i) => { pos[c.id] = [280, ys(left.length, i, 10)]; });
  middle.forEach((e, i) => { pos[e.id] = [530, top + i * row + row / 2]; });
  // Activities in three groups with a heading each.
  const groups = ACTS.map(a => ({ a, items: right.filter(r => r.act === a.id) })).filter(g => g.items.length);
  const slots = right.length + groups.length; const step = (H - top - 16) / Math.max(1, slots - 1);
  let s = 0; const heads = [];
  for (const g of groups) { heads.push([g.a, top + s * step]); s++; for (const r of g.items) { pos[r.id] = [790, +(top + s * step).toFixed(1)]; s++; } }
  const curve = (a, b) => { const [x1, y1] = a, [x2, y2] = b; const m = (x1 + x2) / 2; return `M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}`; };
  const e = edges.map(ed => {
    const A = pos[ed.a], B = pos[ed.b]; if (!A || !B) return '';
    const from = ed.t === 'com' ? [A[0] + 6, A[1]] : [A[0] + 100, A[1]], to = ed.t === 'com' ? [B[0] - 100, B[1]] : [B[0] - 6, B[1]];
    return `<path class="nw-e t-${ed.t}" data-a="${esc(ed.a)}" data-b="${esc(ed.b)}" d="${curve(from, to)}"/>`;
  }).join('');
  const node = (id, cls, inner, label) => `<g class="nw-n ${cls}" data-node="${esc(id)}" tabindex="0" role="button" aria-label="${esc(label)}">${inner}</g>`;
  const L = left.map(c => { const [x, y] = pos[c.id]; return node(c.id, 'nw-com', `<circle cx="${x}" cy="${y}" r="6"/><text x="${x - 12}" y="${y + 4}" text-anchor="end">${esc(cut(c.name, 34))}</text><title>${esc(c.name)} (${esc(c.municipality || '')}, real)</title>`, `${c.name}, community`); }).join('');
  const M = middle.map(p => { const [x, y] = pos[p.id]; const k = p.kind === 'supplier' ? 'nw-sup' : 'nw-per'; return node(p.id, `${k}${p.notPublic ? ' is-np' : ''}`, `<rect x="${x - 100}" y="${y - 9}" width="200" height="18" rx="9"/><text x="${x}" y="${y + 4}" text-anchor="middle">${esc(cut(p.name, 30))}</text><title>${esc(p.name)}, ${esc(KIND[p.kind].one)}${p.notPublic ? ', not public' : ''}</title>`, `${p.name}, ${KIND[p.kind].one}${p.notPublic ? ', not public' : ''}`); }).join('');
  const R = right.map(r => { const [x, y] = pos[r.id]; return node(r.id, `nw-act a-${r.act}`, `<circle cx="${x}" cy="${y}" r="6"/><text x="${x + 12}" y="${y + 4}">${esc(shortName(r.name, 34))}</text><title>${esc(r.name)}</title>`, `${r.name}, ${ACTS.find(a => a.id === r.act).label}`); }).join('');
  const Hd = heads.map(([a, y]) => `<text class="nw-gh a-${a.id}" x="784" y="${(+y + 4).toFixed(1)}">${esc(a.label.toUpperCase())}</text>`).join('');
  return `<svg class="nw" viewBox="0 0 ${W} ${H}" role="group" aria-label="Network: ${left.length} communities, ${middle.length} people and supplier companies, ${right.length} hub activities, ${edges.length} links">
<text class="nw-col" x="280" y="22" text-anchor="end">COMMUNITIES · ${left.length}</text><text class="nw-col" x="530" y="22" text-anchor="middle">PEOPLE AND SUPPLIERS · ${middle.length}</text><text class="nw-col" x="784" y="22">HUB ACTIVITIES · ${right.length}</text>
<g class="nw-edges">${e}</g>${Hd}<g>${L}${M}${R}</g></svg>`;
}

// ------------------------------------------------------------------ data quality (the "get more data into Odoo" side)
const council = new Set(['municipio', 'camara', 'municipal', 'cm', 'council']);
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'the', 'of', 'and', 'e', 'a', 'o', 'em', 'na', 'no', 'simulated', 'community']);
const words = n => norm(n).replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w)).map(w => (council.has(w) ? 'council' : w));
export function nameSimilarity(a, b) {
  let A = words(a), B = words(b);
  // "GDG Lagos" and "Google Developer Group Lagos": an acronym in one name stands for words in the other.
  for (const w of A) if (w.length >= 3 && w.length <= 5 && !B.includes(w)) { const k = B.map(y => y[0]).join('').indexOf(w); if (k >= 0) B = [...B.slice(0, k), w, ...B.slice(k + w.length)]; }
  for (const w of B) if (w.length >= 3 && w.length <= 5 && !A.includes(w)) { const k = A.map(y => y[0]).join('').indexOf(w); if (k >= 0) A = [...A.slice(0, k), w, ...A.slice(k + w.length)]; }
  const SA = new Set(A), SB = new Set(B); const inter = [...SA].filter(x => SB.has(x)).length; const all = new Set([...SA, ...SB]).size;
  return all ? inter / all : 0;
}
export function quality(model, privFeed) {
  const all = model.all;
  const missingTown = all.filter(e => !e.muni);
  const noConsent = all.filter(e => e.isPerson && e.published && !e.consent);
  const unpublished = all.filter(e => !e.published);
  const dups = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j];
    if ((a.comRecord && (a.comRecord === b.comRecord || a.comRecord === b.communityId)) || (b.comRecord && b.comRecord === a.communityId)) continue;
    const s = nameSimilarity(a.name, b.name); if (s >= .6) dups.push({ a, b, s });
  }
  const { unlinked } = networkData({ ...model, entries: all });
  const noContact = all.filter(e => e.noContact);
  const orgsNoComp = all.filter(e => (e.kind === 'partner' || e.kind === 'stakeholder') && !e.comps.length);
  // People in the hub's activities (team members, jurors) who are not in the Talent Ecosystem at all.
  const known = new Set(all.map(e => e.id));
  const outside = new Map();
  for (const p of privFeed?.projects || []) (p.team_ids || []).forEach((id, i) => { if (id && !known.has(id)) outside.set(id, { id, name: p.team?.[i] || id, where: `team of ${p.name}` }); });
  for (const v of privFeed?.vibathons || []) for (const j of v.jury || []) if (j.partner_id && !known.has(j.partner_id)) outside.set(j.partner_id, { id: j.partner_id, name: j.name, where: `jury of ${v.name}` });
  return { missingTown, noConsent, unpublished, dups, unlinked, noContact, orgsNoComp, outside: [...outside.values()] };
}

// ------------------------------------------------------------------ the Odoo call panel (never sent)
export function odooCall(steps, db, note = '') {
  const head = `Authorization: bearer <API key of a hub user allowed to change contacts>\nX-Odoo-Database: ${db}\nContent-Type: application/json\n\n`;
  return `<div class="te-calls">${steps.map((s, i) => `<details class="odoo-call" open><summary><span class="odoo-call-verb">POST</span> <code>/json/2/${esc(s.model)}/${esc(s.method)}</code> <span class="odoo-call-flag">not sent: prototype</span></summary>${steps.length > 1 ? `<p class="odoo-call-note">Step ${i + 1} of ${steps.length}${s.why ? `: ${esc(s.why)}` : ''}</p>` : ''}<pre><code>${esc(head + JSON.stringify(s.body, null, 2))}</code></pre>${note && i === steps.length - 1 ? `<p class="odoo-call-note">${esc(note)}</p>` : ''}</details>`).join('')}</div>`;
}

// ================================================================== the browser
if (typeof document !== 'undefined' && document.getElementById('te-root')) {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('te-local-v1') || '{}'); } catch { return {}; } },
    set(v) { try { localStorage.setItem('te-local-v1', JSON.stringify(v)); } catch {} },
  };
  const places = JSON.parse($('#te-places').textContent);
  const munis = places.municipalities;
  let local = store.get(); local.listing ||= {}; local.fixes ||= {}; local.asked ||= {}; local.created ||= [];
  const save = () => store.set(local);
  // Phones get shorter first pages: 8 cards and 6 matches, with "Show more" for the rest.
  const phone = window.matchMedia('(max-width: 40rem)').matches;
  const FIRST = phone ? 8 : 24, HITS = phone ? 6 : 10;
  let pub = null, model = null, f = { ...EMPTY }, limit = FIRST, mxMode = 'kind', q = { comps: [], who: '', where: '' };
  const usePrivate = () => window.HUB?.persona === 'staff' && window.HUB?.privateFeed;
  const feed = () => (usePrivate() ? window.HUB.privateFeed : pub);

  const FIND_FOR = {
    founder: () => ({ comps: ['Finance and fundraising'], who: 'mentor', where: '' }),
    mentor: () => ({ comps: ['Product management'], who: 'mentor', where: '' }),
    staff: () => ({ comps: ['Cybersecurity'], who: '', where: '' }),
  };
  let qTouched = false;
  function defaultFind() {
    if (qTouched) return;
    const ch = model.challenges.find(c => OPEN.has(c.status));
    q = (FIND_FOR[window.HUB?.persona] || (() => ({ comps: ch ? ch.skills.slice() : [], who: '', where: '', ch: ch?.id })))();
    const sel = $('#te-fch'); if (sel) sel.value = q.ch || '';
  }
  function rebuild() { model = buildModel(feed(), munis, { priv: !!usePrivate(), local }); defaultFind(); renderAll(); }
  function renderAll() { renderDirectory(); renderMap(); renderMatrix(); renderFind(); renderNetwork(); renderConsent(); renderListing(); renderQuality(); }

  // ---- directory
  function renderDirectory() {
    $('#te-kinds').innerHTML = kindFilters(model, f);
    $('#te-dir-chips').innerHTML = chip('res.partner', model.all.filter(e => e.odoo?.model === 'res.partner' && (model.priv || !e.notPublic)).length) + ' ' + chip('aih.community', model.coms.length);
    const d = directory(model, f, limit);
    $('#te-cards').innerHTML = d.html;
    $('#te-count').textContent = `${d.total} of ${model.entries.length} ${model.priv ? 'records in Odoo (private feed)' : 'records in the public feed'}`;
    const more = $('#te-more'); more.hidden = d.more <= 0; more.textContent = `Show ${Math.min(d.more, 48)} more of ${d.more}`;
    const active = [];
    if (f.comp) active.push(['comp', `Competence: ${f.comp}`]);
    if (f.muni) active.push(['muni', `Where: ${muniLabel(munis, f.muni === 'none' ? null : f.muni)}`]);
    if (f.community) active.push(['community', `Community: ${model.coms.find(c => c.id === f.community)?.name || f.community}`]);
    $('#te-active').innerHTML = active.map(([k, l]) => `<button type="button" class="te-act" data-clear="${k}">${esc(l)} <span aria-hidden="true">×</span><span class="vh"> (remove)</span></button>`).join('');
    $('#te-comp').value = f.comp; $('#te-muni').value = f.muni; $('#te-origin').value = f.origin;
    if ($('#te-q').value !== f.q) $('#te-q').value = f.q;
  }
  function renderConsent() {
    $$('[data-te-listed]').forEach(el => { el.textContent = num(model.listed); });
    const h = model.hidden;
    $$('[data-te-hidden]').forEach(el => { el.textContent = h == null ? (model.withdrawnHere ? `not yet in the feed, plus ${model.withdrawnHere} here` : 'not yet in the feed') : num(h); el.classList.toggle('is-unknown', h == null); });
    const dots = $('#te-dots');
    if (dots) {
      const n = model.listed, m = h ?? model.withdrawnHere;
      dots.innerHTML = Array.from({ length: n }, () => '<i class="d-on"></i>').join('') + Array.from({ length: m }, () => '<i class="d-off"></i>').join('') + (h == null ? '<i class="d-q" title="The public feed does not carry this number yet">?</i>' : '');
      dots.setAttribute('aria-label', `${n} people listed with consent${h == null ? '' : `, ${m} not listed for lack of consent`}`);
    }
    const note = $('#te-consent-note');
    if (note) note.textContent = model.priv ? 'You see the private feed: the people without consent are in the directory below, marked "Not public".' : (h == null ? 'The number of people withheld is not in the public feed yet (one field to add to the export; the Algarve Evolution team sees it).' : model.withdrawnHere ? `${model.withdrawnHere} of them withdrew in this browser (kept here only).` : 'Their records stay in Odoo; the public feed leaves them out.');
  }
  // ---- map
  function renderMap() {
    $('#te-marks').innerHTML = mapMarks(model, f).svg;
    $('#te-munis').innerHTML = muniList(model, f);
    $('#te-map-n').textContent = model.entries.filter(e => matches(e, f, 'muni')).length;
  }
  // ---- competences
  function renderMatrix() { $('#te-mx').innerHTML = matrix(model, mxMode); $$('[data-mx]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mx === mxMode))); }
  function renderFind() {
    $('#te-find-res').innerHTML = findHtml(model, q, HITS);
    $('#te-fc').value = q.comps.length === 1 ? q.comps[0] : ''; $('#te-fw').value = q.who; $('#te-fm').value = q.where;
    $('#te-fcomps').innerHTML = q.comps.length > 1 ? q.comps.map(c => `<span class="tag">${esc(c)}</span>`).join('') : '';
  }
  // ---- network
  let focusNode = null;
  function renderNetwork() {
    $('#te-nw').innerHTML = networkSvg(model);
    const nd = networkData(model);
    const sel = $('#te-nw-focus'); const cur = focusNode;
    sel.innerHTML = '<option value="">Choose a community, person or activity</option>' +
      `<optgroup label="Communities">${nd.left.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>` +
      `<optgroup label="People and suppliers">${nd.middle.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>` +
      `<optgroup label="Hub activities">${nd.right.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>`;
    $('#te-nw-unl').textContent = nd.unlinked.length;
    focus(cur && $(`[data-node="${CSS.escape(cur)}"]`) ? cur : null);
  }
  function focus(id) {
    focusNode = id; const svg = $('#te-nw svg'); if (!svg) return;
    svg.classList.toggle('is-focus', !!id); $$('.on', svg).forEach(el => el.classList.remove('on'));
    $('#te-nw-focus').value = id || '';
    const out = $('#te-nw-detail');
    if (!id) { out.innerHTML = '<p>Choose a node (click, tap, or Tab then Enter) to see who and what it connects.</p>'; return; }
    const nd = networkData(model); const all = [...nd.left, ...nd.middle, ...nd.right];
    const name = x => all.find(n => n.id === x)?.name || x;
    const rel = new Set([id]);
    $$('.nw-e', svg).forEach(p => { if (p.dataset.a === id || p.dataset.b === id) { p.classList.add('on'); rel.add(p.dataset.a); rel.add(p.dataset.b); } });
    // A community lights up its members' activities too: community -> member -> activity.
    if (nd.left.some(c => c.id === id)) $$('.nw-e', svg).forEach(p => { if (rel.has(p.dataset.a) && p.dataset.a !== id && !p.classList.contains('t-com')) { p.classList.add('on'); rel.add(p.dataset.b); } });
    rel.forEach(r => $(`[data-node="${CSS.escape(r)}"]`, svg)?.classList.add('on'));
    const m = nd.middle.find(x => x.id === id);
    const lines = nd.edges.filter(e => e.a === id || e.b === id).map(e => { const o = e.a === id ? e.b : e.a; const t = { com: 'community', inc: 'INC/ACC', cc: 'Challenge Connect', vib: 'Vibathon' }[e.t]; return `<li><span class="te-et t-${e.t}">${t}</span> ${esc(name(o))}</li>`; });
    out.innerHTML = `<h3>${esc(name(id))}</h3>${m ? `<p>${esc(KIND[m.kind].one)} · ${esc(muniLabel(munis, m.muni))} ${simB(m)}${m.notPublic ? ' <span class="tag tag-accent">Not public</span>' : ''}</p>` : ''}<ul class="te-nw-l">${lines.join('') || '<li>No links yet.</li>'}</ul>`;
  }
  // ---- your listing (approve, change, do not list me)
  const listable = () => model.all.filter(e => e.isPerson && e.published && (model.priv || e.consent || local.listing[e.id]));
  const DEFAULT_FOR = { mentor: 'p-mentor-01', supplier: 'p-person-41', founder: 'p-person-16', challenger: 'p-person-42', participant: 'p-person-04', visitor: 'p-person-01' };
  let me = null, editing = false;
  function renderListing() {
    const box = $('#te-me-out'); if (!box || model.priv) return;
    const opts = listable();
    if (!me || (me !== 'new' && !opts.some(e => e.id === me))) me = opts.find(e => e.id === DEFAULT_FOR[window.HUB?.persona])?.id || opts[0]?.id || 'new';
    $('#te-me').innerHTML = opts.map(e => `<option value="${esc(e.id)}"${e.id === me ? ' selected' : ''}>${esc(e.name)} · ${esc(KIND[e.kind].one)}</option>`).join('') + `<option value="new"${me === 'new' ? ' selected' : ''}>I am not listed yet</option>`;
    const out = $('#te-me-out');
    if (me === 'new') { out.innerHTML = newForm(); return; }
    const e = model.all.find(x => x.id === me); const st = local.listing[me];
    const status = e.consent ? (st?.consent === true ? 'You approved this listing.' : 'Listed: you gave consent and Algarve Evolution published it.') : 'Not listed: you asked not to be listed. You are now counted among the people withheld.';
    const comPick = model.coms.find(c => c.id === e.communityId);
    out.innerHTML = `<div class="te-me-grid"><div><p class="te-me-h">How the public directory shows you${e.consent ? '' : ' <b>(hidden now)</b>'}</p><div class="te-me-card${e.consent ? '' : ' is-off'}">${card(e, model)}</div>
<p class="te-me-st" role="status">${esc(status)} ${st ? '<span class="local-note">Kept in this browser only</span>' : ''}</p>
<div class="te-me-btns"><button type="button" class="btn btn-primary" data-me="approve">Approve as shown</button><button type="button" class="btn" data-me="change" aria-expanded="${editing}">Change</button><button type="button" class="btn te-btn-x" data-me="withdraw">Do not list me</button>${st ? '<button type="button" class="btn te-btn-l" data-me="reset">Forget my choices</button>' : ''}</div>
${editing ? editForm(e) : ''}</div>
<div><p class="te-me-h">What Odoo holds for you (res.partner #${esc(e.odoo?.id)})</p><dl class="te-dl"><dt>Name</dt><dd>${esc(e.name)}</dd><dt>Kind <code>aih_talent_kind</code></dt><dd>${esc(KIND[e.kind].one)}</dd><dt>Town <code>city</code></dt><dd>${esc(e.town || 'none')}</dd><dt>Competences <code>category_id</code></dt><dd>${esc(e.comps.join(', ') || 'none')}</dd><dt>Community <code>aih_community_id</code></dt><dd>${esc(comPick?.name || 'none')}</dd><dt>Summary <code>aih_summary</code></dt><dd>${esc(e.summary)}</dd><dt>Consent <code>aih_consent</code></dt><dd>${e.consent ? 'yes' : 'no'}</dd><dt>Published <code>aih_published</code></dt><dd>${e.published ? 'yes' : 'no'}</dd></dl>
<div id="te-me-call">${lastCall || odooCall([{ model: 'res.partner', method: 'write', body: { ids: [e.odoo?.id], vals: { aih_consent: true } } }], model.odooDb, 'Approving sets consent on your contact. Choose an action to see its call.')}</div></div></div>`;
  }
  let lastCall = '';
  const KSEL = ['professional', 'consultant', 'mentor', 'investor'];
  function editForm(e) {
    return `<form class="te-form hub-form" id="te-edit"><fieldset><legend>Change your listing</legend>
<label class="field"><span>Kind</span> <select name="kind">${KSEL.map(k => `<option value="${k}"${k === e.kind ? ' selected' : ''}>${KIND[k].one}</option>`).join('')}</select></label>
<label class="field"><span>Town</span> <select name="town"><option value="">No town</option>${munis.map(m => `<option${m.name === e.town ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
<label class="field te-wide"><span>Summary</span> <textarea name="summary" rows="3" maxlength="400">${esc(e.summary)}</textarea></label>
<fieldset class="te-wide te-checks"><legend>Competences</legend>${model.vocab.map(c => `<label><input type="checkbox" name="comp" value="${esc(c)}"${e.comps.includes(c) ? ' checked' : ''}> ${esc(c)}</label>`).join('')}</fieldset>
<p class="te-wide"><button class="btn btn-primary">Save the change and keep my consent</button></p></fieldset></form>`;
  }
  function newForm() {
    const c = local.created;
    return `<form class="te-form hub-form" id="te-new"><fieldset><legend>Ask to be listed in the Talent Ecosystem</legend>
<label class="field"><span>Name</span> <input name="name" required maxlength="80" autocomplete="off" placeholder="As you want it shown"></label>
<label class="field"><span>Kind</span> <select name="kind">${KSEL.map(k => `<option value="${k}">${KIND[k].one}</option>`).join('')}</select></label>
<label class="field"><span>Town</span> <select name="town">${munis.map(m => `<option>${esc(m.name)}</option>`).join('')}</select></label>
<label class="field"><span>Community</span> <select name="community"><option value="">None</option>${model.coms.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></label>
<label class="field te-wide"><span>Summary</span> <textarea name="summary" rows="2" maxlength="400" placeholder="What you do, in a sentence"></textarea></label>
<fieldset class="te-wide te-checks"><legend>Competences</legend>${model.vocab.map(v => `<label><input type="checkbox" name="comp" value="${esc(v)}"> ${esc(v)}</label>`).join('')}</fieldset>
<label class="te-wide te-agree"><input type="checkbox" name="consent" required> I agree to be listed in the public directory of the AE Innovation Hub. I can withdraw at any time.</label>
<p class="te-wide"><button class="btn btn-primary">Ask to be listed</button> <span class="te-dim">Algarve Evolution reviews new listings before they are published.</span></p></fieldset></form>
${c.length ? `<p class="te-me-st" role="status">Asked in this browser (kept here only, awaiting review): ${c.map(x => esc(x.name)).join(', ')}.</p>` : ''}
<div id="te-me-call">${lastCall}</div>`;
  }
  const catSteps = comps => [{ model: 'res.partner.category', method: 'search_read', why: 'find the competence tags by name', body: { domain: [['name', 'in', comps]], fields: ['id', 'name'] } }];
  function meAction(kind) {
    const e = model.all.find(x => x.id === me); if (!e) return;
    const id = e.odoo?.id;
    if (kind === 'approve') { local.listing[me] = { ...(local.listing[me] || {}), consent: true }; editing = false; lastCall = odooCall([{ model: 'res.partner', method: 'write', body: { ids: [id], vals: { aih_consent: true, aih_published: true } } }], model.odooDb, 'You approved your listing as shown.'); }
    if (kind === 'withdraw') { local.listing[me] = { ...(local.listing[me] || {}), consent: false }; editing = false; lastCall = odooCall([{ model: 'res.partner', method: 'write', body: { ids: [id], vals: { aih_consent: false } } }], model.odooDb, 'Your contact stays in Odoo for Algarve Evolution; the next export leaves you out of the public feed.'); }
    if (kind === 'reset') { delete local.listing[me]; editing = false; lastCall = ''; }
    if (kind === 'change') { editing = !editing; }
    save(); rebuild();
  }
  // ---- data quality (staff, private feed)
  function renderQuality() {
    const box = $('#te-quality'); if (!box) return;
    if (!model.priv) { box.innerHTML = '<p class="te-empty">Open the private feed (choose "Algarve Evolution team" and enter the access key) to see the full database and what is missing in Odoo.</p>'; return; }
    const Q = quality(model, window.HUB.privateFeed);
    const tile = (id, n, label) => `<a class="te-qt${n ? '' : ' is-ok'}" href="#q-${id}"><b>${n}</b><span>${label}</span></a>`;
    const muniSel = id => `<select data-fix-town="${esc(id)}" aria-label="Town"><option value="">Choose a municipality</option>${munis.map(m => `<option>${esc(m.name)}</option>`).join('')}</select>`;
    const comSel = id => `<select data-fix-com="${esc(id)}" aria-label="Community"><option value="">Link to a community</option>${model.coms.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>`;
    const who = e => `<b>${esc(e.name)}</b> <span class="te-dim">${esc(KIND[e.kind]?.one || '')} · Odoo ${esc(e.odoo?.model)} #${esc(e.odoo?.id)}</span>`;
    const sec = (id, title, why, rows, n = rows.length) => `<details class="te-q" id="q-${id}"${openQ.has(id) ? ' open' : ''}><summary><span>${esc(title)}</span><b>${n}</b></summary><p class="te-q-why">${why}</p>${rows.length ? `<ul>${rows.join('')}</ul>` : '<p class="te-dim">Nothing to fix.</p>'}</details>`;
    box.innerHTML = `<div class="te-qts">${tile('town', Q.missingTown.length, 'missing towns')}${tile('consent', Q.noConsent.length, 'people without consent')}${tile('dup', Q.dups.length, 'likely duplicates')}${tile('unlinked', Q.unlinked.length + Q.outside.length, 'unlinked people')}${tile('contact', Q.noContact.length, 'communities with no contact')}${tile('comp', Q.orgsNoComp.length, 'organisations with no competences')}</div>
${sec('town', 'Missing towns', 'Without a town a record cannot go on the map or be found "near me". Pick the municipality; the fix is one write to Odoo.', Q.missingTown.map(e => `<li data-row="${esc(e.id)}">${who(e)} ${muniSel(e.id)}</li>`))}
${sec('consent', 'People without consent', 'They are in Odoo and hidden from the public feed. Asking is a to-do on their contact for the person who knows them; nothing is sent from here.', Q.noConsent.map(e => `<li data-row="${esc(e.id)}">${who(e)} ${local.asked[e.id] ? '<span class="tag tag-ok">Asked</span> <span class="local-note">Kept in this browser only</span>' : `<button type="button" class="btn btn-sm" data-ask="${esc(e.id)}">Ask for consent</button>`}</li>`))}
${sec('dup', 'Likely duplicates', 'Names that look like the same organisation. A community and a contact are linked; two contacts are merged in Odoo.', Q.dups.map(d => `<li data-row="${esc(d.a.id)}">${who(d.a)} <span class="te-dim">and</span> ${who(d.b)} <span class="te-dim">(${Math.round(d.s * 100)}% alike)</span> <button type="button" class="btn btn-sm" data-dup="${esc(d.a.id)}|${esc(d.b.id)}">Show the fix</button></li>`))}
${sec('unlinked', 'Unlinked people', 'People in no community and no hub activity, and people in Vibathon teams or juries who are not in the Talent Ecosystem.', [...Q.unlinked.map(e => `<li data-row="${esc(e.id)}">${who(e)} ${comSel(e.id)}</li>`), ...Q.outside.map(o => `<li data-row="${esc(o.id)}"><b>${esc(o.name)}</b> <span class="te-dim">${esc(o.where)}, not in the Talent Ecosystem</span> <button type="button" class="btn btn-sm" data-add="${esc(o.id)}">Add as a professional</button></li>`)])}
${sec('contact', 'Communities with no contact record', 'These are in aih.community but have no res.partner, so they have no town, consent or competences of their own.', Q.noContact.map(e => `<li data-row="${esc(e.id)}">${who(e)} <button type="button" class="btn btn-sm" data-mkcontact="${esc(e.id)}">Create the contact</button></li>`))}
${sec('comp', 'Organisations with no competences', 'Partners and stakeholders carry type tags only, so "find by competence" cannot find them. A spreadsheet of competences per organisation would fill this in one import.', Q.orgsNoComp.slice(0, 12).map(e => `<li data-row="${esc(e.id)}">${who(e)}</li>`).concat(Q.orgsNoComp.length > 12 ? [`<li class="te-dim">and ${Q.orgsNoComp.length - 12} more (all in the CSV)</li>`] : []), Q.orgsNoComp.length)}
${Q.unpublished.length ? `<p class="te-dim">Also: ${Q.unpublished.length} record${Q.unpublished.length === 1 ? '' : 's'} with consent but not published: ${Q.unpublished.map(e => esc(e.name)).join(', ')}.</p>` : ''}
<p class="te-q-csv"><button type="button" class="btn" data-csv>Download the open issues as a spreadsheet (CSV)</button> <span class="te-dim">To fill in and import into Odoo: the "get more data into Odoo" path. Made in this browser; nothing leaves it.</span></p>
<div id="te-q-call"></div>`;
    placeCall();
  }
  let qCall = '', qFor = null; const openQ = new Set(['town', 'consent']);
  // The Odoo call shows next to the row it came from (or at the top of its list when the fix removed the row).
  function placeCall() {
    if (!qCall) return;
    const html = `<li class="te-q-callrow">${qCall}</li>`;
    const row = qFor && $(`#te-quality [data-row="${CSS.escape(qFor.id)}"]`);
    if (row) { row.insertAdjacentHTML('afterend', html); return; }
    const d = qFor && $(`#q-${qFor.sec}`);
    if (d) { d.open = true; const ul = $('ul', d); if (ul) ul.insertAdjacentHTML('afterbegin', html); else d.insertAdjacentHTML('beforeend', `<ul>${html}</ul>`); return; }
    $('#te-q-call').innerHTML = qCall;
  }
  const showCall = () => $('.te-q-callrow')?.scrollIntoView({ block: 'nearest' });
  const later = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  function csv() {
    const Q = quality(model, window.HUB.privateFeed);
    const rows = [['issue', 'odoo_model', 'odoo_id', 'feed_id', 'name', 'kind', 'value_to_fill']];
    Q.missingTown.forEach(e => rows.push(['missing town', e.odoo?.model, e.odoo?.id, e.id, e.name, e.kind, '']));
    Q.noConsent.forEach(e => rows.push(['no consent', e.odoo?.model, e.odoo?.id, e.id, e.name, e.kind, '']));
    Q.dups.forEach(d => rows.push(['likely duplicate', d.a.odoo?.model, d.a.odoo?.id, d.a.id, `${d.a.name} = ${d.b.name}`, d.a.kind, '']));
    Q.unlinked.forEach(e => rows.push(['no community or activity', e.odoo?.model, e.odoo?.id, e.id, e.name, e.kind, '']));
    Q.outside.forEach(o => rows.push(['not in the Talent Ecosystem', 'res.partner', '', o.id, o.name, '', '']));
    Q.noContact.forEach(e => rows.push(['community with no contact', e.odoo?.model, e.odoo?.id, e.id, e.name, e.kind, '']));
    Q.orgsNoComp.forEach(e => rows.push(['no competences', e.odoo?.model, e.odoo?.id, e.id, e.name, e.kind, '']));
    const text = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = 'talent-ecosystem-open-issues.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---- events
  const root = $('#te-root');
  // Controls that are redrawn when chosen (kinds, municipalities, matrix toggles) keep the keyboard focus.
  root.addEventListener('click', ev => {
    const t = ev.target.closest('[data-kind], [data-muni], [data-mx]'); if (!t) return;
    const key = ['kind', 'muni', 'mx'].find(k => t.dataset[k] != null); const sel = `[data-${key}="${CSS.escape(t.dataset[key])}"]${t.classList.contains('tm-m') ? '.tm-m' : t.classList.contains('te-muni') ? '.te-muni' : ''}`;
    const had = document.activeElement === t;
    setTimeout(() => { if (had) root.querySelector(sel)?.focus(); }, 0);
  }, true);
  root.addEventListener('click', ev => {
    const t = ev.target.closest('button, [data-muni], [data-node]'); if (!t || !root.contains(t)) return;
    if (t.dataset.kind) { const k = t.dataset.kind; f.kinds = f.kinds.includes(k) ? f.kinds.filter(x => x !== k) : [...f.kinds, k]; limit = FIRST; renderDirectory(); renderMap(); return; }
    if (t.dataset.clear) { f[t.dataset.clear] = ''; renderDirectory(); renderMap(); return; }
    if (t.dataset.community) { f = { ...EMPTY, community: t.dataset.community }; limit = FIRST; renderDirectory(); renderMap(); $('#directory').scrollIntoView({ block: 'start' }); return; }
    if (t.dataset.muni && (t.classList.contains('tm-m') || t.classList.contains('te-muni'))) { f.muni = f.muni === t.dataset.muni ? '' : t.dataset.muni; limit = FIRST; renderDirectory(); renderMap(); return; }
    if (t.id === 'te-more') { limit += 48; renderDirectory(); return; }
    if (t.id === 'te-reset') { f = { ...EMPTY }; limit = FIRST; renderDirectory(); renderMap(); return; }
    if (t.id === 'te-to-dir') { $('#directory').scrollIntoView({ block: 'start' }); return; }
    if (t.dataset.mx) { mxMode = t.dataset.mx; renderMatrix(); return; }
    if (t.classList.contains('te-mx-b')) { qTouched = true; q = { comps: [t.dataset.comp], who: t.dataset.who ? (WHO.find(w => w.id.split(' ').includes(t.dataset.who))?.id || t.dataset.who) : '', where: t.dataset.where || '' }; renderFind(); $('#find').scrollIntoView({ block: 'start' }); return; }
    if (t.dataset.preset) { qTouched = true; const p = JSON.parse(t.dataset.preset); q = { comps: p.comps || [], who: p.who || '', where: p.where || '' }; $('#te-fch').value = p.ch || ''; renderFind(); return; }
    if (t.dataset.node) { focus(focusNode === t.dataset.node ? null : t.dataset.node); return; }
    if (t.dataset.me) { meAction(t.dataset.me); return; }
    if (t.dataset.ask) { const e = model.all.find(x => x.id === t.dataset.ask); qFor = { sec: 'consent', id: e.id }; local.asked[e.id] = true; save(); qCall = odooCall([{ model: 'res.partner', method: 'activity_schedule', body: { ids: [e.odoo.id], act_type_xmlid: 'mail.mail_activity_data_todo', summary: 'Ask for consent to be listed in the Talent Ecosystem', note: 'The person who knows them asks; on a yes, tick "Consent to be listed".', date_deadline: later() } }], model.odooDb, `A to-do on ${e.name}'s contact. Nothing is e-mailed from the hub.`); renderQuality(); showCall(); return; }
    if (t.dataset.dup) { const [a, b] = t.dataset.dup.split('|').map(id => model.all.find(x => x.id === id)); qFor = { sec: 'dup', id: a.id }; const com = [a, b].find(x => x.odoo?.model === 'aih.community'), par = [a, b].filter(x => x.odoo?.model === 'res.partner'); qCall = com && par.length ? odooCall([{ model: 'res.partner', method: 'write', body: { ids: [par[0].odoo.id], vals: { aih_community_id: com.odoo.id, aih_talent_kind: 'community' } } }], model.odooDb, `Link the contact ${par[0].name} to the community ${com.name}, so they are one record in the directory.`) : odooCall([{ model: 'base.partner.merge.automatic.wizard', method: 'create', why: 'prepare the merge', body: { vals_list: [{ partner_ids: [[6, 0, par.map(x => x.odoo.id)]], dst_partner_id: par[0].odoo.id }] } }, { model: 'base.partner.merge.automatic.wizard', method: 'action_merge', why: 'merge into the first contact', body: { ids: ['<id from step 1>'] } }], model.odooDb); renderQuality(); showCall(); return; }
    if (t.dataset.add) { qFor = { sec: 'unlinked', id: t.dataset.add }; qCall = odooCall([{ model: 'res.partner', method: 'search', why: 'find the contact by its hub id', body: { domain: [['aih_feed_key', '=', t.dataset.add]] } }, { model: 'res.partner', method: 'write', why: 'add them to the Talent Ecosystem, not yet published', body: { ids: ['<id from step 1>'], vals: { aih_talent_kind: 'professional', aih_published: false } } }], model.odooDb); renderQuality(); showCall(); return; }
    if (t.dataset.mkcontact) { const e = model.all.find(x => x.id === t.dataset.mkcontact); qFor = { sec: 'contact', id: e.id }; qCall = odooCall([{ model: 'res.partner', method: 'create', body: { vals_list: [{ name: e.name, is_company: true, aih_talent_kind: e.kind, aih_community_id: e.odoo.id, aih_source_url: e.source, aih_published: true, aih_feed_key: `t-${e.id}` }] } }], model.odooDb, 'A contact for the community, so it can carry a town, competences and its own page.'); renderQuality(); showCall(); return; }
    if (t.hasAttribute('data-csv')) { csv(); return; }
  });
  root.addEventListener('toggle', ev => { const d = ev.target; if (d.classList?.contains('te-q')) { const id = d.id.slice(2); d.open ? openQ.add(id) : openQ.delete(id); } }, true);
  root.addEventListener('click', ev => { const a = ev.target.closest('.te-qt'); if (a) { const d = document.querySelector(a.getAttribute('href')); if (d) d.open = true; } });
  root.addEventListener('keydown', ev => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role="button"][data-muni], [role="button"][data-node]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  root.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'te-comp') { f.comp = t.value; limit = FIRST; renderDirectory(); renderMap(); }
    if (t.id === 'te-muni') { f.muni = t.value; limit = FIRST; renderDirectory(); renderMap(); }
    if (t.id === 'te-origin') { f.origin = t.value; limit = FIRST; renderDirectory(); renderMap(); }
    if (t.id === 'te-fc') { qTouched = true; q.comps = t.value ? [t.value] : []; $('#te-fch').value = ''; renderFind(); }
    if (t.id === 'te-fch') { qTouched = true; const ch = model.challenges.find(c => c.id === t.value); q.comps = ch ? ch.skills.slice() : []; if (ch && !q.who) q.who = ''; renderFind(); }
    if (t.id === 'te-fw') { qTouched = true; q.who = t.value; renderFind(); }
    if (t.id === 'te-fm') { qTouched = true; q.where = t.value; renderFind(); }
    if (t.id === 'te-nw-focus') { focus(t.value || null); }
    if (t.id === 'te-me') { me = t.value; editing = false; lastCall = ''; renderListing(); }
    if (t.dataset.fixTown) { const e = model.all.find(x => x.id === t.dataset.fixTown); qFor = { sec: 'town', id: e.id }; local.fixes[e.id] = { ...(local.fixes[e.id] || {}), town: t.value }; save(); qCall = odooCall([{ model: e.odoo.model === 'aih.community' ? 'aih.community' : 'res.partner', method: 'write', body: { ids: [e.odoo.id], vals: e.odoo.model === 'aih.community' ? { municipality: t.value } : { city: t.value } } }], model.odooDb, `${e.name} now shows in ${t.value} in this browser.`); rebuild(); showCall(); }
    if (t.dataset.fixCom) { const e = model.all.find(x => x.id === t.dataset.fixCom); qFor = { sec: 'unlinked', id: e.id }; const c = model.coms.find(x => x.id === t.value); local.fixes[e.id] = { ...(local.fixes[e.id] || {}), community_id: t.value }; save(); qCall = odooCall([{ model: 'res.partner', method: 'write', body: { ids: [e.odoo.id], vals: { aih_community_id: c.odoo.id } } }], model.odooDb, `${e.name} is now a member of ${c.name} in this browser.`); rebuild(); showCall(); }
  });
  root.addEventListener('input', ev => { if (ev.target.id === 'te-q') { f.q = ev.target.value; limit = FIRST; renderDirectory(); renderMap(); } });
  root.addEventListener('submit', ev => {
    ev.preventDefault(); const fm = ev.target; const d = new FormData(fm);
    if (fm.id === 'te-edit') {
      const e = model.all.find(x => x.id === me); const comps = d.getAll('comp');
      const vals = { kind: d.get('kind'), town: d.get('town') || null, summary: String(d.get('summary') || '').trim(), comps };
      local.listing[me] = { consent: true, vals }; editing = false; save();
      lastCall = odooCall([...catSteps(comps), { model: 'res.partner', method: 'write', why: 'save your listing', body: { ids: [e.odoo.id], vals: { aih_talent_kind: vals.kind, city: vals.town || false, aih_summary: vals.summary, category_id: [[6, 0, ['<ids from step 1>']]], aih_consent: true } } }], model.odooDb, 'Competences are contact tags in Odoo, found by name first.');
      rebuild();
    }
    if (fm.id === 'te-new') {
      const comps = d.getAll('comp'); const c = model.coms.find(x => x.id === d.get('community'));
      const vals = { name: String(d.get('name')).trim(), is_company: false, city: d.get('town'), aih_talent_kind: d.get('kind'), aih_summary: String(d.get('summary') || '').trim(), aih_consent: true, aih_published: false, category_id: [[6, 0, ['<ids from step 1>']]] };
      if (c) vals.aih_community_id = c.odoo.id;
      local.created.push({ name: vals.name, kind: vals.kind }); save();
      lastCall = odooCall([...(comps.length ? catSteps(comps) : []), { model: 'res.partner', method: 'create', why: 'your new contact, waiting for review', body: { vals_list: [comps.length ? vals : (({ category_id, ...v }) => v)(vals)] } }], model.odooDb, 'Published only after Algarve Evolution reviews it (aih_published stays false until then).');
      renderListing();
    }
    if (fm.id === 'te-dir-form') { /* the search box filters as you type */ }
  });

  // ---- personas: highlight presets, switch feeds
  // A new persona starts from its own listing and its own question in the finder.
  window.HUB?.on('persona', () => { if (pub) { editing = false; me = null; lastCall = ''; qTouched = false; rebuild(); } });
  window.HUB?.on('private', () => { if (pub) rebuild(); });
  (window.HUB ? window.HUB.publicFeed() : fetch('/feeds/public.json').then(r => r.json())).then(p => { pub = p; rebuild(); document.body.classList.add('te-ready'); });
}
