// V3 Mission Control: the AE Innovation Hub as a live dashboard, REAL DATA ONLY (docs/v3/BRIEF.md).
// Restructured from V1's Mission Control (v1-source/scripts/designs/mission.mjs), which António Guerreiro picked:
// a dark HUD with neon panels, counters, a hand-written force-directed network, a radar map and a terminal log.
// Panels: the four hub activities (António's whiteboard, 16 November 2026) with their real counts and an honest gap
// readout naming the Odoo records that would fill it; what is coming up on their Odoo; their blog; the network of
// Algarve Evolution, its programmes, partners, communities and organisations (no people); the radar of the 16
// municipalities; the timeline log; the 2032 targets with António's quote; and "Odoo: source of truth".
// Reads ctx.real (src/feeds/real.json, docs/v3/REAL-FEED.md); where a part of it is missing, the same real records
// are read from ctx.data and the public files they came from. Nothing simulated. Code Apache-2.0, text CC BY 4.0.
// sites-dev@AgentiCCells.dinis, 16 November 2026.
import { readFileSync } from 'node:fs';

export const meta = { slug: 'mission', order: 2, name: 'Mission Control', tagline: 'The ecosystem as a live dashboard' };

const ROOT = new URL('../../', import.meta.url);
const readJ = p => { try { return JSON.parse(readFileSync(new URL(p, ROOT), 'utf8')); } catch { return null; } };
const BASE = '/v3/mission';

// ---------- the hub (António's whiteboard, 16 November 2026: docs/v2/BRIEF.md) ----------
const ACT = {
  'inc-acc': { code: 'A-01', short: 'INC/ACC', v2: '/v2/inc-acc/', words: ['incubation', 'acceleration', 'mentors', 'KPIs'], pt: 'incubação, aceleração, mentores, KPIs', tone: 'cyan' },
  'challenge-connect': { code: 'A-02', short: 'Challenge Connect', v2: '/v2/challenge-connect/', words: ['challenges', 'suppliers', 'matching'], pt: 'desafios, fornecedores, matching', tone: 'mag' },
  vibathon: { code: 'A-03', short: 'Vibathon', v2: '/v2/vibathon/', words: ['hackathons', 'workshops', 'juries'], pt: 'hackathons, workshops, júris', tone: 'amber' },
  talent: { code: 'A-04', short: 'Talent', v2: '/v2/talent/', words: ['talent', 'competences', 'partners', 'ADI network'], pt: 'talento, competências, parceiros, rede ADI', tone: 'green' },
};
const ACT_IDS = Object.keys(ACT);
// What real data does not exist publicly yet, and the hub addon's records that would hold it
// (odoo/addons/algarve_innovation_hub). Used only where the real feed carries no gaps.
const GAPS = [
  { activity: 'inc-acc', what: 'The startups in each programme, their mentors and sessions, and their KPIs from month 0 to month 6', odoo: ['aih.programme.company', 'aih.session', 'aih.kpi', 'aih.reflection'], v2: '/v2/inc-acc/' },
  { activity: 'challenge-connect', what: 'Challenges from companies, the suppliers who apply and the matching result', odoo: ['aih.challenge', 'aih.application'], v2: '/v2/challenge-connect/' },
  { activity: 'vibathon', what: 'Who registered, the mentors and jury, the projects presented, their scores and the next step', odoo: ['aih.vibathon.participant', 'aih.vibathon.jury', 'aih.project', 'aih.project.score'], v2: '/v2/vibathon/' },
  { activity: 'talent', what: 'The people in the ADI network, grouped as professionals, consultants, mentors and investors, with their skills', odoo: ['res.partner', 'aih.skill'], v2: '/v2/talent/' },
];
// Which hub activity each real programme belongs to (our grouping, from the whiteboard's four boxes).
const PROG_ACT = { founder2founder: 'inc-acc', f2f: 'inc-acc', incubator: 'inc-acc', 'inova-algarve-3': 'inc-acc', inova: 'inc-acc', 'startup-showcase': 'inc-acc',
  buildathons: 'vibathon', 'algarve-tech-hub-summit': 'vibathon', aths: 'vibathon', 'algarve-digital-innovators': 'talent', adi: 'talent', grow: 'talent', venture: 'inc-acc' };
const ORG_SHORT = { support: 'Support', incubation: 'Incubation', education: 'Education', public: 'Public bodies', company: 'Companies', funding: 'Funding' };
const ORG_KINDS = { support: 'Support', incubation: 'Incubation and mentoring', education: 'Education and research', public: 'Public bodies', company: 'Companies', funding: 'Investment and grants', community: 'Communities' };
const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

// ---------- shared helpers copied from V1 (v1-source/scripts/designs/atlas.mjs) ----------
function pathOf(ring, { closed = true, smooth = 0.5, project } = {}) {
  const p = ring.map(project).filter((q, i, a) => i === 0 || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
  const f = q => `${Math.round(q[0] * 10) / 10},${Math.round(q[1] * 10) / 10}`;
  if (!smooth) return `M${p.map(f).join('L')}${closed ? 'Z' : ''}`;
  const n = p.length, at = i => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(p[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) * smooth / 3, p1[1] + (p2[1] - p0[1]) * smooth / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * smooth / 3, p2[1] - (p3[1] - p1[1]) * smooth / 3];
    d += `C${f(c1)} ${f(c2)} ${f(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}
function outline(places) {
  const c = places.outline.countries; const pt = c.Portugal[0][0], es = c.Spain[0][0];
  const mouthP = pt.findIndex(q => q[0] === -7.4071);
  return { portugal: pt, spain: es, coastPt: pt.slice(mouthP), border: pt.slice(0, mouthP + 1) };
}
// "12 Sep 2019" -> "2019-09-12"; "Sep 2025" -> "2025-09"; "Late 2025" -> "2025-Q4"; "28 Mar to 3 Apr 2022" -> "2022-03-28".
function isoOf(when) {
  if (/^\d{4}(-\d{2}){0,2}$/.test(when || '')) return when;
  const M = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const pad = n => String(n).padStart(2, '0'); when = String(when || '');
  const y = (when.match(/(\d{4})\s*$/) || [])[1];
  let m = when.match(/^(\d{1,2})\s+(?:to\s+\d{1,2}\s+)?([A-Za-z]{3})/);
  if (m) return `${y}-${pad(M[m[2].toLowerCase()])}-${pad(m[1])}`;
  m = when.match(/^([A-Za-z]{3})\s+\d{4}$/); if (m && M[m[1].toLowerCase()]) return `${y}-${pad(M[m[1].toLowerCase()])}`;
  if (/^late/i.test(when)) return `${y}-Q4`;
  return y || when;
}
// The same forces run here at build time and in the browser (src/v3/mission/mission.js).
function tickForces(P, E, W, H, alpha) {
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const a = P[i], b = P[j]; let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
    const f = Math.min(40, 14000 / d2) * alpha; dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    const min = a.r + b.r + 26; if (d < min) { const push = (min - d) / 2; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
  }
  for (const [a, b] of E) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; const rest = a.id === 'ae' || b.id === 'ae' ? 150 : 105;
    const f = (d - rest) * 0.03 * alpha; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f; }
  for (const p of P) { const g = p.id === 'ae' ? 30 : 1; p.vx += (W / 2 - p.x) * 0.0018 * alpha * g; p.vy += (H / 2 - p.y) * 0.0036 * alpha * g;
    p.vx *= 0.8; p.vy *= 0.8; p.x = Math.max(70, Math.min(W - 70, p.x + p.vx)); p.y = Math.max(30, Math.min(H - 30, p.y + p.vy)); }
}
const R = { centre: 30, activity: 19, programme: 13, partner: 11, community: 8, orgs: 12, municipality: 12 };
function layout(nodes, links, W, H) {
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const ring = { centre: 0, activity: 120, programme: 200, partner: 300, community: 320, orgs: 290, municipality: 310 };
  const P = nodes.map((n, i) => { const a = i * 2.39996 + rnd() * 0.3, r = ring[n.kind] ?? 220; return { id: n.id, r: R[n.kind] || 10, x: W / 2 + Math.cos(a) * r * 1.4, y: H / 2 + Math.sin(a) * r * 0.85, vx: 0, vy: 0 }; });
  const by = new Map(P.map(p => [p.id, p]));
  const E = links.map(([a, b]) => [by.get(a), by.get(b)]).filter(([a, b]) => a && b);
  for (let it = 0; it < 1600; it++) tickForces(P, E, W, H, Math.max(0.02, 1 - it / 1300));
  return by;
}

// ---------- reading the real feed (with the same real records from ctx.data where a part is missing) ----------
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TOWNS = [
  ['vila-real-de-santo-antonio', /vila real de santo ant|monte gordo/i], ['sao-bras-de-alportel', /s[aã]o br[aá]s/i], ['castro-marim', /castro marim/i],
  ['vila-do-bispo', /vila do bispo|sagres/i], ['alcoutim', /alcoutim/i], ['aljezur', /aljezur/i], ['monchique', /monchique/i],
  ['lagoa', /\blagoa\b|parchal|carvoeiro|estombar|ferragudo/i], ['lagos', /\blagos\b/i], ['portimao', /portim[aã]o|\balvor\b|mexilhoeira/i],
  ['silves', /silves|arma[cç][aã]o de p[eê]ra|alcantarilha|algoz/i], ['albufeira', /albufeira/i], ['loule', /loul[eé]|quarteira|vilamoura|almancil|\bsalir\b/i],
  ['olhao', /olh[aã]o/i], ['tavira', /tavira/i], ['faro', /\bfaro\b|gambelas|campus da penha|ualg tec/i],
];
const townOf = (e, munis) => { if (e.town) { const s = slug(e.town); if (munis.some(m => m.id === s)) return s; } const hay = `${e.place || ''}`; for (const [id, re] of TOWNS) if (re.test(hay)) return id; return null; };
const kindOf = name => /hack|vibathon|buildathon/i.test(name) ? 'hackathon' : /workshop|bootcamp|masterclass/i.test(name) ? 'workshop' : /summit|forum|festival|conference|congress|world cup/i.test(name) ? 'summit' : /meetup|meeting|pitch|afterwork|networking/i.test(name) ? 'meetup' : 'other';

// A title that names a person (a guest speaker) is shown only in its safe form (docs/v3/REAL-FEED.md, Changes).
const safeName = e => (e.names_person ? (e.name_safe || 'An event with a guest speaker') : e.name);
// meta.sources values may be a string, a URL or { label, url }.
const srcMeta = v => { if (!v) return null; if (typeof v === 'object') return { label: String(v.label || v.title || v.url || ''), url: v.url || null }; const s = String(v); return { label: s, url: (s.match(/https:\/\/[^\s),]+/) || [])[0] || null }; };

function hubData({ real, data, h }) {
  const R0 = real && !real.missing ? real : {};
  const odoo = data.odoo || {};
  const pub = readJ('src/feeds/public.json') || {};
  const org = R0.organisation || {};
  const today = new Date().toISOString().slice(0, 10);
  const odooSrc = String(R0.meta?.sources?.odoo || '');
  const mo = R0.meta?.odoo || {};
  const sys = {
    url: (mo.url || (odooSrc.match(/https:\/\/[^\s)]+/) || [])[0] || odoo.source || 'https://www.algarveevolution.pt').replace(/\/$/, ''),
    version: mo.version || (odooSrc.match(/Odoo ([\d.]+)/) || [])[1] || odoo.odoo || '',
    read: mo.read || (odooSrc.match(/read (\d{4}-\d{2}-\d{2})/) || [])[1] || odoo.read || '',
    pagesFrom: R0.meta?.pages_from || '', classification: R0.meta?.classification || '',
    built: R0.meta?.built || '', feeds: odoo.from?.news || [], sitemap: odoo.from?.sitemap || '', about: odoo.about || '',
    fromReal: !!R0.meta?.built,
  };
  const acts = (R0.hub?.activities?.length ? R0.hub.activities : pub.hub?.activities || []).filter(a => ACT[a.id]);
  const activities = ACT_IDS.map(id => { const a = acts.find(x => x.id === id) || { id, name: ACT[id].short };
    return { ...ACT[id], ...a, id, keywords: a.keywords_en || (a.keywords && !/[ãçõé]/.test(a.keywords) ? a.keywords : ACT[id].words.join(', ')), pt: a.keywords_en && a.keywords ? a.keywords : ACT[id].pt }; });
  const programmes = R0.programmes?.length ? R0.programmes.map(p => ({ ...p, activity: p.activity || PROG_ACT[p.id] || null, facts: p.facts || [] }))
    : data.programmes.pillars.flatMap(pl => pl.programmes.map(g => ({ id: g.id, name: h.t(g.name), pillar: h.t(pl.name), activity: PROG_ACT[g.id] || null, summary: h.t(g.summary), facts: [{ text: h.t(g.summary), source: g.sources }] })));
  const events = (R0.events?.length ? R0.events : (odoo.events || []).map(e => ({ ...e, source: e.url })))
    .map(e => ({ ...e, name: safeName(e), kind: e.kind || kindOf(e.name), source: e.source || e.url, day: String(e.start || '').slice(0, 10) }))
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const munis = (R0.places?.municipalities?.length ? R0.places.municipalities : data.places.municipalities).map(m => ({ ...m, id: m.id || slug(m.name) }));
  events.forEach(e => { e.muni = e.region && e.region !== 'algarve' ? null : townOf(e, munis); });
  const upcoming = events.filter(e => (e.end || e.start || '').slice(0, 10) >= today);
  const news = (R0.news?.length ? R0.news : odoo.posts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const communities = (R0.communities?.length ? R0.communities : (pub.communities || []).filter(c => c.simulated === false && c.published !== false))
    .map(c => ({ id: c.id, name: c.name, municipality: c.municipality || '', kind: c.kind || 'community', members: c.members, source: c.source, url: c.url || c.source, adi: c.adi, summary: c.summary }));
  const orgFile = readJ('v1-source/src/talent-map/data/organisations.json');
  const organisations = (R0.organisations?.length ? R0.organisations : (orgFile?.organisations || []).map(o => ({ id: o.id, name: o.name, kind: o.kind, town: o.town, what: o.what, url: o.url, source: o.source_url, read: o.read_on })))
    .map(o => ({ ...o, townId: slug(o.town) }));
  const net = org.network?.nodes?.length ? { nodes: org.network.nodes.map(n => ({ id: n.id, kind: n.kind, label: h.t(n.name || n.label), note: h.t(n.note), src: n.source || n.sources })), links: org.network.links.map(l => Array.isArray(l) ? l : [l.from, l.to, l.rel]) }
    : { nodes: data.ecosystem.nodes.map(n => ({ id: n.id, kind: n.kind, label: h.t(n.label), note: h.t(n.note), src: data.ecosystem.sources[n.src]?.url })), links: data.ecosystem.links };
  const orgSource = (typeof R0.meta?.sources?.organisations === 'string' && /^(https:\/\/|\/)/.test(R0.meta.sources.organisations) ? R0.meta.sources.organisations : srcMeta(R0.meta?.sources?.organisations)?.url) || orgFile?.from?.repo || 'https://newsroom.sgit.ai/articles/an-algarve-talent-map.html';
  const vibathons = (R0.vibathons?.length ? R0.vibathons.map(vb => ({ ...vb, name: safeName(vb) })) : data.events.events.filter(e => /vibathon/i.test(h.t(e.name))).map(e => ({ name: h.t(e.name), date: e.start, place: h.t(e.place), facts: [{ text: h.t(e.summary), source: e.sources }] })));
  const labels = R0.meta?.source_labels || {};
  const metaSources = Object.entries(R0.meta?.sources || {}).map(([k, v]) => { const m = srcMeta(v) || {}; const url = m.url || (typeof v === 'string' && /^(https:\/\/|\/)/.test(v) ? v : null); return { key: k, url, label: labels[k] ? String(labels[k]) : m.label }; }).filter(x => x.label);
  const communitiesNote = R0.communities_note || null;
  const inputs = R0.hub?.inputs || (R0.gaps || []).find(g => g.id === 'ideas-needs') || null;
  const known = new Set([...(R0.meta?.sources_index || []), ...data.sources.sources].map(x => x.url));
  const gaps = (R0.gaps?.length ? R0.gaps : GAPS).filter(g => g.activity);
  const eco = data.ecosystem;
  const ecoSrc = k => eco.sources[k]?.url || k;
  const timeline = (org.timeline?.length ? org.timeline : eco.timeline).map(e => ({ when: e.when || e.date || '', title: h.t(e.title), text: h.t(e.text), stat: e.stat, future: e.future, src: [].concat(e.sources || e.source || (e.src ? ecoSrc(e.src) : [])).map(ecoSrc) }));
  const goals = (org.goals?.length ? org.goals : data.voice.goals).map(g => ({ value: h.t(g.value), label: h.t(g.label), sources: g.sources }));
  const goalsSources = org.goals?.[0]?.sources || data.voice.goals_sources;
  const q0 = org.quote || data.people.quotes[0]; const person = org.executive_director || data.people.people.find(p => p.id === q0.by) || {};
  const quote = { text: h.t(q0.text), date: q0.date, sources: q0.sources || [].concat(q0.source || []), about: q0.about };
  const figures = (org.figures?.length ? org.figures : data.figures.figures).map(f => ({ id: f.id, value: h.t(f.value), label: h.t(f.label), note: h.t(f.note), sources: f.sources || [].concat(f.source || []) }));
  const pages = R0.pages || [];
  return { communitiesNote, metaSources, inputs, known, net, sys, activities, programmes, events, upcoming, news, communities, organisations, orgSource, vibathons, gaps, timeline, goals, goalsSources, quote, person, figures, munis, pages, today, fromReal: !!R0.meta?.built };
}

export function render(ctx) {
  const { data, h, chrome } = ctx;
  const { esc, num } = h; const t = v => h.t(v);
  const X = hubData(ctx);
  const cited = new Map();
  // The sources list holds the published documents cited here (src/data/sources.json and the feed's sources_index), not every record link.
  const note = refs => { for (const r of [].concat(refs || []).filter(Boolean)) { try { const s = h.source(r); if (X.known.has(s.url) && !cited.has(s.url)) cited.set(s.url, s); } catch { /* not a URL */ } } };
  const srcLine = (url, label) => `<p class="src">Source: <a href="${esc(url)}" rel="noopener">${esc(label)}</a></p>`;
  const cite = (refs, cls) => { note(refs); try { return h.cite(refs, cls); } catch { return ''; } };
  const ext = (url, text, cls = '') => { note(url); return `<a href="${esc(url)}"${cls ? ` class="${cls}"` : ''} rel="noopener">${esc(text)}</a>`; };
  const dateEn = iso => { try { return h.date(String(iso).slice(0, 10)); } catch { return String(iso); } };
  const timeOf = iso => (String(iso).match(/T(\d{2}:\d{2})/) || [])[1] || '';
  const v = data.voice;
  const panel = (id, code, title, inner, { cls = '', sub = '', live = '' } = {}) => `<section class="pn ${cls}" id="${id}" aria-labelledby="h-${id}">
  <header class="pn-h"><span class="pn-code" aria-hidden="true">${code}</span><h2 id="h-${id}">${title}</h2>${live ? `<span class="pn-live" aria-hidden="true">${live}</span>` : ''}</header>
  ${sub ? `<p class="pn-sub">${sub}</p>` : ''}${inner}</section>`;
  const odooLabel = `Odoo${X.sys.version ? ` ${X.sys.version}` : ''}`;
  const odooHost = X.sys.url.replace(/^https:\/\//, '').replace(/\/$/, '');

  // ---------- figures (their own, as reported) ----------
  const fig = id => X.figures.find(f => f.id === id);
  const figCodes = { founded: 'YR', members: 'MBR', jobs: 'JOB', events: 'EVT', communities: 'COM' };
  const tele = X.figures.filter(f => figCodes[f.id]).map((f, i) => `<li class="tl tl-${i}"><span class="tl-k" aria-hidden="true">${figCodes[f.id]}</span><strong class="tl-v" data-count>${esc(f.value)}</strong><span class="tl-l">${esc(f.label)}</span>${f.note ? `<em class="tl-n">${esc(f.note)}</em>` : ''}${cite(f.sources)}</li>`).join('');

  // ---------- the four activities ----------
  const progsOf = id => X.programmes.filter(p => p.activity === id);
  const factOf = p => (p.facts || [])[0] || {};
  const srcsOf = x => [].concat(x?.sources || x?.source || []);
  const f2f = X.programmes.find(p => /founder2founder/i.test(t(p.name)));
  const f2fText = f2f ? (f2f.facts || []).map(f => t(f.text)).join(' ') + ' ' + t(f2f.summary || '') : '';
  const f2fM = f2fText.match(/(\w+) companies chosen from (\d+) applications/i);
  const comFig = fig('communities'); const comMembers = comFig ? (comFig.label.match(/([\d,.]+) members/) || [])[1] : null;
  const vibs = X.vibathons; const vibMain = vibs.find(vb => /vibathon/i.test(vb.name)) || vibs[0];
  const workshops = X.events.filter(e => e.kind === 'workshop');
  const pagesOf = id => X.pages.filter(p => p.activity === id);
  const orgCount = X.organisations.length; const orgCompanies = X.organisations.filter(o => o.kind === 'company').length;
  const stat = (val, label, src, { cls = '', count = true } = {}) => `<li class="st ${cls}"><strong class="st-v"${count ? ' data-count' : ''}>${esc(val)}</strong><span class="st-l">${esc(label)}</span>${src?.html ? src.html : src && [].concat(src).length ? cite(src) : ''}</li>`;
  const orgSrc = { html: srcLine(X.orgSource, 'PrompTugal.news research') };
  const odooEv = { html: srcLine(X.sys.url + '/event', 'their Odoo calendar') };
  const adiComs = X.communities.filter(c => c.adi === true), resComs = X.communities.filter(c => c.adi === false);
  const adiPage = adiComs[0]?.source;
  const statGap = label => `<li class="st st-gap"><strong class="st-v"><span aria-hidden="true">--</span><span class="vh">No public figure:</span></strong><span class="st-l">${esc(label)}</span></li>`;
  const pagesStat = id => { const ps = pagesOf(id); return ps.length ? stat(String(ps.length), `public pages about it on their Odoo`, X.sys.pagesFrom || X.sys.url) : ''; };
  const STATS = {
    'inc-acc': [
      stat(String(progsOf('inc-acc').length), 'real programmes on record', progsOf('inc-acc').flatMap(p => srcsOf(factOf(p))).slice(0, 3)),
      f2fM ? stat(`${WORDNUM[f2fM[1].toLowerCase()] ?? f2fM[1]} of ${f2fM[2]}`, 'companies chosen from applications to Founder2Founder (reported)', srcsOf(factOf(f2f))) : '',
      pagesStat('inc-acc'),
      statGap('company KPIs, month 0 to 6, published'),
    ],
    'challenge-connect': [
      statGap('challenges published'), statGap('supplier applications'), statGap('matching results'),
      orgCompanies ? stat(String(orgCompanies), `companies among ${orgCount} organisations in the public map; none has said it wants to be a supplier`, orgSrc) : '',
    ],
    vibathon: [
      vibMain ? stat(dateEn(vibMain.date || vibMain.start), `${vibMain.name}, ${vibMain.place || vibMain.town || ''}`, srcsOf(factOf(vibMain)).concat(srcsOf(vibMain)).slice(0, 2), { count: false, cls: 'st-date' }) : '',
      stat(String(vibs.length), 'hackathons and buildathons on record', odooEv),
      workshops.length ? stat(String(workshops.length), 'workshops on their Odoo calendar', odooEv) : '',
      statGap('projects, jury and scores published'),
    ],
    talent: [
      comFig && !adiComs.length ? stat(comFig.value, 'digital communities mapped by ADI (their figure)', comFig.sources) : '',
      comMembers ? stat(comMembers, 'members between them (their figure)', comFig.sources) : '',
      adiComs.length ? stat(String(X.communitiesNote?.adi_listed ?? adiComs.length), 'communities in the ADI network, named on their page', { html: srcLine(X.communitiesNote?.source || adiPage, 'their ADI page on Odoo') }) : stat(String(X.communities.length), 'communities found in public sources', X.communities.map(c => c.source).slice(0, 1)),
      resComs.length ? stat(String(X.communitiesNote?.other_public ?? resComs.length), 'more communities with a public record in research, not on their list', X.communitiesNote?.research_source ? { html: srcLine(X.communitiesNote.research_source, 'PrompTugal.news research') } : orgSrc) : '',
      stat(String(orgCount), 'organisations mapped from public sources (no people)', orgSrc),
    ],
  };
  const progLi = p => `<li><strong>${esc(t(p.name))}</strong> ${esc(t(factOf(p).text || p.summary || ''))}${p.page ? ` ${ext(p.page, 'Their page')}` : ''}</li>`;
  const FACTS = {
    'inc-acc': progsOf('inc-acc').map(progLi).join(''),
    'challenge-connect': `<li>Nothing is published yet: no challenge, supplier or match. The model is the one on António Guerreiro's whiteboard: a company presents a challenge, companies and professionals apply, and a ranked result suggests the best or a top 3.</li>`,
    vibathon: (vibMain ? `<li><strong>${esc(vibMain.name)}</strong> ${(vibMain.facts || []).slice(0, 3).map(f => esc(t(f.text))).join(' ')}</li>` : '')
      + vibs.filter(vb => vb !== vibMain).slice(0, 6).map(vb => `<li><span class="mono-d">${esc(String(vb.date || vb.start || '').slice(0, 10))}</span> ${vb.url ? ext(vb.url, vb.name) : esc(vb.name)}${vb.town ? ` · ${esc(vb.town)}` : ''}</li>`).join('')
      + progsOf('vibathon').map(progLi).join(''),
    talent: (X.communitiesNote?.text ? `<li>${esc(X.communitiesNote.text)}</li>` : '') + progsOf('talent').map(progLi).join(''),
  };
  const modelName = m => String(m).replace(/\s*\(.*$/, '');
  const modelCode = m => { const n = modelName(m), rest = String(m).slice(n.length).trim(); return `<code${rest ? ` title="${esc(rest.replace(/^\(|\)$/g, ''))}"` : ''}>${esc(n)}</code>`; };
  const actPanel = a => {
    const gs = X.gaps.filter(g => g.activity === a.id);
    const kw = String(a.keywords).split(/\s*,\s*/).filter(Boolean);
    const v2 = gs[0]?.v2 || a.v2;
    return `<section class="pn act act-${a.tone} span-6" id="act-${a.id}" aria-labelledby="h-act-${a.id}">
  <header class="pn-h"><span class="pn-code" aria-hidden="true">${a.code}</span><h2 id="h-act-${a.id}">${esc(a.short)}</h2><span class="pn-live" aria-hidden="true">${gs.length ? `${gs.length} GAP${gs.length > 1 ? 'S' : ''}` : 'LIVE'}</span></header>
  <p class="act-name">${esc(a.summary || a.name)}</p>
  <ul class="kw" aria-label="António's keywords">${kw.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
  <p class="wb">On António Guerreiro's whiteboard, 16 November 2026: <span lang="pt">${esc(a.pt)}</span></p>
  <div class="act-body"><div class="act-real"><p class="col-h"><span class="led ok" aria-hidden="true"></span>Real, published</p><ul class="stats">${STATS[a.id].join('')}</ul>
  <details class="act-more"><summary>What is real</summary><ul class="facts">${FACTS[a.id]}</ul></details></div>
  ${gs.length ? `<div class="gapbox"><p class="gap-h"><span class="led amber blink" aria-hidden="true"></span>Gaps: your Odoo would fill these</p><ol class="gaps">${gs.map(g => `<li><p class="gap-w">${esc(g.what)}</p>${g.known ? `<p class="gap-n">${esc(g.known)}</p>` : ''}<p class="gap"><span class="gap-k">Awaiting Odoo:</span> ${[...new Set((g.odoo || []).map(modelName))].map(n => modelCode((g.odoo || []).find(m => modelName(m) === n))).join(' ')}</p></li>`).join('')}</ol></div>` : ''}</div>
  <a class="act-go" href="${esc(v2)}">See what it could be in V2 <span aria-hidden="true">→</span></a>
</section>`;
  };

  // ---------- coming up from their Odoo ----------
  const evKind = { hackathon: 'Hackathon', workshop: 'Workshop', summit: 'Summit', conference: 'Conference', talk: 'Talk', fair: 'Fair', awards: 'Awards', meetup: 'Meetup', other: 'Event' };
  const munisById = new Map(X.munis.map(m => [m.id, m]));
  const where = e => e.muni ? munisById.get(e.muni)?.name : e.region === 'online' || /online/i.test(e.place) ? 'Online' : e.town ? e.town : (String(e.place).split(',').map(s => s.trim()).filter(Boolean).slice(-1)[0] || '');
  const upList = X.upcoming.slice(0, 12);
  const upHTML = upList.length ? `<ol class="up">${upList.map((e, i) => `<li class="up-i${i === 0 ? ' next' : ''}" data-start="${esc(e.start)}" data-end="${esc(e.end || e.start)}">
    <div class="up-when"><span class="up-d">${esc(dateEn(e.day))}</span>${timeOf(e.start) ? `<span class="up-t">${esc(timeOf(e.start))}</span>` : ''}<span class="up-in" data-in aria-hidden="true"></span></div>
    <div class="up-what"><p class="up-k"><span class="led ${e.muni ? 'ok' : 'cyan'}" aria-hidden="true"></span>${esc(evKind[e.kind] || 'Event')} · ${esc(where(e))}${e.muni ? '' : ' · outside the Algarve'}</p>
    <h3>${ext(e.url, e.name)}</h3></div>
    <a class="up-reg" href="${esc(e.register || e.url)}" rel="noopener">Register<span class="vh"> for ${esc(e.name)}</span> <span aria-hidden="true">→</span></a></li>`).join('')}</ol>`
    : `<p class="muted">Nothing is listed as coming up on their Odoo right now.</p>`;
  const upcoming = `${upHTML}<p class="src">Source: ${ext(X.sys.url + '/event', `their Odoo calendar (${odooLabel}, read ${X.sys.read})`)}. Registration happens on their site.</p>`;

  // ---------- news feed ----------
  const newsHTML = `<ol class="news">${X.news.slice(0, 14).map((n, i) => `<li${i === 0 ? ' class="fresh"' : ''}><p class="nw-k"><time datetime="${esc(n.date)}">${esc(n.date)}</time> · ${esc(n.blog || 'Blog')}</p><h3>${ext(n.url, n.title)}</h3></li>`).join('')}</ol>
    <p class="src">Source: their blog feeds on ${ext(X.sys.url + '/blog', odooHost)} (${X.news.length} posts read ${esc(X.sys.read)}).</p>`;

  // ---------- network ----------
  const nodes = [], links = [];
  const add = n => { if (!nodes.some(x => x.id === n.id)) nodes.push(n); };
  const netNode = id => X.net.nodes.find(n => n.id === id);
  const SHORT = { adi: 'ADI', f2f: 'Founder2Founder', inova: 'INOVA 3.0', aths: 'Tech Hub Summit', venture: 'Venture Lab', grow: 'Grow Meetup', ualg: 'UAlg', stp: 'Algarve STP', ja: 'Junior Achievement', startupPt: 'Startup Portugal', munis: '16 municipalities' };
  const NODE_ACT = { adi: 'talent', f2f: 'inc-acc', incubator: 'inc-acc', inova: 'inc-acc', aths: 'talent', education: 'vibathon', venture: 'inc-acc', grow: 'talent' };
  const ae = netNode('ae');
  add({ id: 'ae', kind: 'centre', label: 'Algarve Evolution', short: 'Algarve Evolution', note: ae?.note, src: ae?.src });
  for (const a of X.activities) { add({ id: `act-${a.id}`, kind: 'activity', label: a.name || a.short, short: a.short, note: t(a.summary || ''), wb: true, v2: a.v2 }); links.push(['ae', `act-${a.id}`, 'runs']); }
  // Programmes, partners and the municipalities from the organisation's network; its one-off events and summits stay out.
  for (const n of X.net.nodes) if (['programme', 'partner', 'municipality'].includes(n.kind) && n.id !== 'lagos') add({ ...n, short: SHORT[n.id] || n.label });
  const ids0 = new Set(nodes.map(n => n.id));
  for (const [a, b, l] of X.net.links) if (ids0.has(a) && ids0.has(b)) links.push([a, b, l]);
  for (const [p, act] of Object.entries(NODE_ACT)) if (ids0.has(p)) links.push([`act-${act}`, p, 'includes']);
  for (let i = nodes.length - 1; i > 0; i--) if (!links.some(([a, b]) => a === nodes[i].id || b === nodes[i].id)) nodes.splice(i, 1);
  const adiName = slug(netNode('adi')?.label || 'Algarve Digital Innovators');
  for (const c of X.communities) { if (slug(c.name) === adiName) continue; const id = `com-${slug(c.id || c.name)}`;
    add({ id, kind: 'community', label: c.name, short: c.name.replace(/\s*\(.*\)\s*$/, '').replace(/\s+-\s+.*$/, ''), note: `${c.kind ? c.kind[0].toUpperCase() + c.kind.slice(1) : 'Community'}${c.municipality ? `, ${c.municipality}` : ', place not given'}${c.members ? `, ${num(c.members)} members (their page)` : ''}.${c.adi === true ? ' Named on the list of the ADI network on their Odoo.' : c.adi === false ? ' Found in public research; not on the ADI list.' : ''}${c.summary ? ` ${c.summary}` : ''}`, src: c.source, url: c.url });
    links.push(c.adi === false || !ids0.has('adi') ? ['act-talent', id, 'found in research'] : ['adi', id, 'maps']); }
  const byKind = {}; for (const o of X.organisations) (byKind[o.kind] ||= []).push(o);
  for (const [k, list] of Object.entries(byKind)) { if (k === 'community' || !ORG_KINDS[k]) continue; add({ id: `org-${k}`, kind: 'orgs', label: `${ORG_KINDS[k]}: ${list.length} organisations`, short: `${ORG_SHORT[k] || ORG_KINDS[k]} (${list.length})`, note: `${list.length} organisations in the Algarve, from public sources. Organisations only, no people.`, src: X.orgSource, orgs: list }); links.push(['act-talent', `org-${k}`, 'maps']); }
  const GW = 1100, GH = 720;
  const pos = layout(nodes, links, GW, GH);
  const shortOf = id => nodes.find(n => n.id === id)?.short || id;
  const edgeSVG = links.map(([a, b, l]) => { const p = pos.get(a), q = pos.get(b); if (!p || !q) return '';
    return `<line class="ed${a.startsWith('act-') || b.startsWith('act-') || a === 'ae' && b.startsWith('act-') ? ' ed-act' : ''}" data-a="${a}" data-b="${b}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}"><title>${esc(shortOf(a))} · ${esc(l)} · ${esc(shortOf(b))}</title></line>`; }).join('');
  const boxes = nodes.map(n => { const p = pos.get(n.id), r = R[n.kind] || 10; return [p.x - r, p.y - r, p.x + r, p.y + r]; });
  const lab = new Map(); const aeP = pos.get('ae');
  const ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  for (const n of nodes) { const p = pos.get(n.id), r = R[n.kind] || 10, fs = n.kind === 'community' ? 6.8 : n.kind === 'activity' ? 10.6 : n.kind === 'centre' ? 11.8 : 7.6, w = n.short.length * fs + 6, hh = 16;
    const c = n.id === 'ae' ? [[0, r + 18, 'middle'], [0, -(r + 9), 'middle']] : [[r + 6, 4, 'start'], [-(r + 6), 4, 'end'], [0, -(r + 7), 'middle'], [0, r + 16, 'middle'], [r + 2, -(r + 4), 'start'], [-(r + 2), -(r + 4), 'end'], [r + 2, r + 14, 'start'], [-(r + 2), r + 14, 'end']];
    let best = null;
    for (const [dx, dy, an] of c) { const x0 = an === 'start' ? p.x + dx : an === 'end' ? p.x + dx - w : p.x - w / 2; const bx = [x0, p.y + dy - 11, x0 + w, p.y + dy - 11 + hh];
      let sc = boxes.reduce((s, b) => s + ov(bx, b), 0) + [...lab.values()].reduce((s, b) => s + ov(bx, b.box) * 1.5, 0);
      if (bx[0] < 4 || bx[2] > GW - 4) sc += 5000; if ((an === 'start') !== (p.x > aeP.x) && an !== 'middle') sc += 30;
      if (!best || sc < best.sc) best = { sc, dx, dy, an, box: bx }; }
    lab.set(n.id, best); boxes.push(best.box); }
  const KINDS = { centre: 'Centre', activity: 'Hub activity', programme: 'Programme', partner: 'Partner', community: 'Community', orgs: 'Organisations', municipality: 'Municipalities' };
  // Algarve Evolution is drawn last, so its label sits above any node near it.
  const nodeSVG = [...nodes.filter(n => n.id !== 'ae'), ...nodes.filter(n => n.id === 'ae')].map(n => { const p = pos.get(n.id); const r = R[n.kind] || 10; const lb = lab.get(n.id);
    return `<g class="nd k-${n.kind}" data-id="${esc(n.id)}" data-r="${r}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(n.label)}: ${esc(KINDS[n.kind])}">
      <circle class="nd-halo" r="${r + 7}"/>${n.kind === 'activity' ? `<rect class="nd-c" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" transform="rotate(45)"/>` : `<circle class="nd-c" r="${r}"/>`}${n.id === 'ae' ? '<text class="nd-ae" y="5" text-anchor="middle">AE</text>' : ''}
      <text class="nd-l" x="${lb.dx}" y="${lb.dy}" text-anchor="${lb.an}">${esc(n.short)}</text></g>`; }).join('');
  const nodeCard = n => { const ls = links.filter(([a, b]) => a === n.id || b === n.id);
    return `<article class="ins-card" data-node="${esc(n.id)}"><p class="ins-k"><span class="led k-${n.kind}" aria-hidden="true"></span>${esc(KINDS[n.kind])}</p>
      <h3>${esc(n.label)}</h3>${n.note ? `<p>${esc(n.note)}</p>` : ''}${n.wb ? `<p class="fine">From António Guerreiro's whiteboard, 16 November 2026. <a href="${esc(n.v2)}">What it could be (V2)</a></p>` : ''}${n.url && n.url !== n.src ? `<p class="fine">${ext(n.url, 'Their own page')}</p>` : ''}${n.src ? cite(n.src) : ''}
      ${n.orgs ? `<ul class="ins-orgs">${n.orgs.slice(0, 60).map(o => `<li>${ext(o.url || o.source, o.name.replace(/\s*\(.*\)\s*$/, ''))}${o.town ? ` <span>${esc(o.town)}</span>` : ''}</li>`).join('')}</ul>` : ''}
      <p class="ins-sub">Links (${ls.length})</p><ul class="ins-links">${ls.map(([a, b, l]) => { const o = a === n.id ? b : a; const dir = a === n.id ? '→' : '←';
        return `<li><span class="arr" aria-hidden="true">${dir}</span> <span class="lk">${esc(l)}</span> <button type="button" data-goto="${esc(o)}">${esc(nodes.find(x => x.id === o)?.label || o)}</button></li>`; }).join('')}</ul></article>`; };
  const graph = `<div class="graph-wrap"><div class="graph"><svg class="net" viewBox="0 0 ${GW} ${GH}" role="group" aria-label="Network of Algarve Evolution, the hub's activities, programmes, partners, communities and organisations">
    <defs><radialGradient id="glow"><stop offset="0" stop-color="#00e5ff" stop-opacity=".35"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${GW / 2}" cy="${GH / 2}" r="300" fill="url(#glow)" opacity=".5"/>
    <g class="eds">${edgeSVG}</g><g class="nds">${nodeSVG}</g></svg>
    <ul class="legend">${Object.entries(KINDS).map(([k, l]) => `<li><span class="led k-${k}" aria-hidden="true"></span>${esc(l)} (${nodes.filter(n => n.kind === k).length})</li>`).join('')}</ul></div>
    <aside class="inspector" aria-label="Node inspector"><p class="ins-h">Node inspector</p><div class="ins-body" aria-live="polite">${nodeCard(nodes[0])}</div></aside></div>
    <details class="idx"><summary>Every node, as a list (${nodes.length})</summary><div class="idx-grid">${nodes.map(nodeCard).join('')}</div></details>`;

  // ---------- radar ----------
  const O = outline(data.places);
  const RS = 600, C0 = [-8.2, 37.2], KR = 455, COS = Math.cos(37.2 * Math.PI / 180);
  const rp = ([lon, lat]) => [RS / 2 + (lon - C0[0]) * COS * KR, RS / 2 - (lat - C0[1]) * KR];
  const rpath = (ring, o = {}) => pathOf(ring, { project: rp, ...o });
  const rad = [];
  for (let r = 60; r <= 290; r += 58) rad.push(`<circle cx="300" cy="300" r="${r}" class="rd-ring"/>`);
  for (let a = 0; a < 360; a += 10) { const rr = a % 30 ? 284 : 276; const s = Math.sin(a * Math.PI / 180), c = Math.cos(a * Math.PI / 180);
    rad.push(`<line x1="${(300 + s * rr).toFixed(1)}" y1="${(300 - c * rr).toFixed(1)}" x2="${(300 + s * 292).toFixed(1)}" y2="${(300 - c * 292).toFixed(1)}" class="rd-tk"/>`); }
  const ML = { 'vila-do-bispo': [6, 21, 'middle'], 'castro-marim': [-6, -6, 'end'], 'vila-real-de-santo-antonio': [-6, 14, 'end', 'V.R.S. ANTÓNIO'], olhao: [6, 14, 'start'], lagoa: [2, 17, 'middle'], silves: [6, -6, 'start'], loule: [-2, -10, 'middle'],
    'sao-bras-de-alportel': [0, -12, 'middle', 'S. BRÁS'], aljezur: [7, -6, 'start'], alcoutim: [-7, -6, 'end'], faro: [0, 22, 'middle'], lagos: [-8, 16, 'end'], portimao: [4, -10, 'middle'], albufeira: [0, 20, 'middle'], tavira: [0, 18, 'middle'], monchique: [8, -7, 'start'] };
  const comBy = {}; const regional = [];
  for (const c of X.communities) { const id = slug(c.municipality); if (X.munis.some(m => m.id === id)) (comBy[id] ||= []).push(c); else regional.push(c); }
  const evBy = {}; for (const e of X.events) if (e.muni) (evBy[e.muni] ||= []).push(e);
  const orgBy = {}; for (const o of X.organisations) if (o.townId) orgBy[o.townId] = (orgBy[o.townId] || 0) + 1;
  const upBy = id => (evBy[id] || []).filter(e => (e.end || e.start).slice(0, 10) >= X.today);
  const blips = X.munis.map((m, i) => { const [x, y] = rp(m.ll); const [lx, ly, la, sh] = ML[m.id] || [7, -6, 'start']; const hq = m.id === 'faro';
    const nC = (comBy[m.id] || []).length, nU = upBy(m.id).length, nE = (evBy[m.id] || []).length; const size = Math.min(9, 3 + Math.sqrt(nE + nC * 2) * 0.9);
    return `<a href="#ct-${m.id}" class="blip${hq ? ' hq' : ''}${nU ? ' live' : ''}" data-ct="ct-${m.id}" aria-label="${esc(m.name)}: ${nC} communities, ${nU} coming up, ${nE} events on record" style="--d:${(i * 0.37).toFixed(2)}s"><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="14" class="hit"/>${nU ? `<circle r="${(size + 5).toFixed(1)}" class="bp-p"/>` : ''}${nC ? `<circle r="${(size + 3).toFixed(1)}" class="bp-c"/>` : ''}<circle r="${size.toFixed(1)}" class="bp"/><text x="${lx}" y="${ly}" text-anchor="${la}" class="bp-l">${esc(sh || m.name.toUpperCase())}</text></g></a>`; }).join('');
  const ctCard = m => { const cs = comBy[m.id] || [], up = upBy(m.id), all = evBy[m.id] || [];
    return `<li id="ct-${m.id}" class="ct"><p class="ct-k">${m.id === 'faro' ? 'HQ · ' : ''}${m.ll[1].toFixed(3)}N ${Math.abs(m.ll[0]).toFixed(3)}W</p><h3>${esc(m.name)}</h3>
      <dl class="ct-n"><div><dt>Communities</dt><dd>${cs.length}</dd></div><div><dt>Coming up</dt><dd>${up.length}</dd></div><div><dt>Odoo events</dt><dd>${all.length}</dd></div><div><dt>Organisations</dt><dd>${orgBy[m.id] || 0}</dd></div></dl>
      ${cs.length ? `<p class="ct-sub">Communities</p><ul class="ct-l">${cs.map(c => `<li>${ext(c.url || c.source, c.name.replace(/\s*\(.*\)\s*$/, ''))} <span>${esc(c.kind)}</span></li>`).join('')}</ul>` : ''}
      ${up.length ? `<p class="ct-sub">Coming up</p><ul class="ct-l">${up.slice(0, 4).map(e => `<li><span class="mono-d">${esc(e.day)}</span> ${ext(e.url, e.name)} · <a href="${esc(e.register || e.url)}" rel="noopener">Register<span class="vh"> for ${esc(e.name)}</span></a></li>`).join('')}</ul>`
        : all.length ? `<p class="ct-sub">Latest on their calendar</p><ul class="ct-l">${all.slice(-2).reverse().map(e => `<li><span class="mono-d">${esc(e.day)}</span> ${ext(e.url, e.name)}</li>`).join('')}</ul>` : ''}
      ${cite([data.places.municipalities_source, ...(all.length ? [X.sys.url + '/event'] : [])].filter(Boolean))}</li>`; };
  const regionCard = `<li id="ct-region" class="ct"><p class="ct-k">REGION-WIDE</p><h3>Region-wide, or place not given</h3><p>Communities that work across the Algarve, or whose source gives no municipality.</p>
      <ul class="ct-l">${regional.map(c => `<li>${ext(c.url || c.source, c.name)}${c.members ? ` <span>${num(c.members)} members, their page</span>` : ''}</li>`).join('')}</ul></li>`;
  const totalUpAlg = X.upcoming.filter(e => e.muni).length;
  const radar = `<div class="radar-wrap"><div class="radar"><svg viewBox="0 0 ${RS} ${RS}" role="group" aria-label="Radar of the Algarve: the 16 municipalities with their communities and events">
    <defs><clipPath id="rclip"><circle cx="300" cy="300" r="292"/></clipPath><radialGradient id="rbg"><stop offset="0" stop-color="#062a2e"/><stop offset="1" stop-color="#020b0f"/></radialGradient></defs>
    <circle cx="300" cy="300" r="292" fill="url(#rbg)"/>
    <g clip-path="url(#rclip)"><path d="${rpath(O.spain)}" class="rd-es"/><path d="${rpath(O.portugal)}" class="rd-land"/>
      <path d="${rpath(O.coastPt, { closed: false })}" class="rd-coast"/><path d="${rpath(O.border, { closed: false, smooth: .3 })}" class="rd-border"/>
      <path d="M300,8V592M8,300H592" class="rd-x"/>${rad.join('')}</g>
    <g class="rd-blips">${blips}</g>
    <text x="300" y="22" text-anchor="middle" class="rd-n">N</text></svg><div class="sweep" aria-hidden="true"></div></div>
    <ul class="rd-key"><li><span class="led ok" aria-hidden="true"></span>Municipality, sized by events and communities</li><li><span class="ring-k" aria-hidden="true"></span>Has communities</li><li><span class="led amber" aria-hidden="true"></span>Something coming up</li><li><span class="led mag" aria-hidden="true"></span>Faro, their base</li></ul>
    <div class="readout" aria-live="polite"><p class="ro-h">Readout</p><div class="ro-body"><p class="muted">Choose a municipality to read it.</p></div></div>
    <button type="button" class="ro-region" data-ct="ct-region">Region-wide communities (${regional.length})</button></div>
    <details class="idx"><summary>All 16 municipalities, as a list</summary><ul class="ct-list">${X.munis.map(ctCard).join('')}${regionCard}</ul></details>`;

  // ---------- terminal log ----------
  const term = `<div class="term" tabindex="0" role="region" aria-label="Timeline log"><ol>${X.timeline.map(e => `<li class="tl-line${e.future ? ' fut' : ''}"><span class="ts">${esc(isoOf(e.when))}</span> <span class="gt" aria-hidden="true">&gt;</span> <strong>${esc(String(e.title).toUpperCase())}</strong><span class="tx">${esc(e.text)}${e.stat ? ` [${esc(e.stat)}]` : ''}</span>${cite(e.src, 'src tsrc')}</li>`).join('')}
    <li class="tl-line sys"><span class="ts">${esc(X.sys.read)}</span> <span class="gt" aria-hidden="true">&gt;</span> <strong>SYNC ${esc(odooLabel.toUpperCase())}</strong><span class="tx">Read ${num(X.events.length)} events and ${num(X.news.length)} blog posts from ${esc(odooHost)}: public pages only, read only, no credentials.</span></li></ol><p class="prompt" aria-hidden="true">&gt; <span class="cursor">_</span></p></div>
    <button type="button" class="btn-replay">Replay</button>`;

  // ---------- targets and the quote ----------
  const C = 2 * Math.PI * 52;
  const rings = X.goals.map((g, i) => `<li class="ring r-${i}"><svg viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="60" class="rg-tick"/><circle cx="66" cy="66" r="52" class="rg-bg"/><circle cx="66" cy="66" r="52" class="rg-fg" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:0" transform="rotate(-90 66 66)"/></svg>
      <div class="rg-in"><span class="rg-t">Target</span><strong data-count>${esc(g.value)}</strong><span class="rg-y">by 2032</span></div><span class="rg-l">${esc(g.label)}</span></li>`).join('');
  const now = new Date(); const days = Math.ceil((Date.UTC(2032, 0, 1) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 864e5);
  const targets = `<ol class="rings">${rings}</ol>${cite(X.goalsSources)}
    <div class="prog"><p class="prog-h"><span class="led amber blink" aria-hidden="true"></span>Progress towards them</p><p>No public count yet of companies supported, startups created or people reached against these targets. Awaiting Odoo: <code>aih.programme.company</code> <code>aih.kpi</code>.</p></div>
    <div class="tminus"><span class="tm-k">T minus</span><strong class="tm-v" data-tminus>${num(days)}</strong><span class="tm-l">days to 2032</span><p class="fine">Days from today to 1 January 2032: our calculation.</p></div>`;
  const wave = Array.from({ length: 48 }, (_, i) => `<i style="--h:${(30 + 60 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23))).toFixed(0)}%;--i:${i}"></i>`).join('');
  const trans = `<div class="tx-meta"><span>Channel 01</span><span>${esc(X.quote.date)}</span><span>From: ${esc(t(X.person.role) || 'Executive director')}</span></div><div class="wave" aria-hidden="true">${wave}</div>
    <blockquote><p>${esc(X.quote.text)}</p></blockquote><p class="tx-by"><strong>${esc(X.person.name || 'António Guerreiro')}</strong>, ${esc(t(X.person.role) || 'Executive director')}, Algarve Evolution, on the 2032 goals · <time datetime="${esc(X.quote.date)}">${esc(dateEn(X.quote.date))}</time></p>${cite(X.quote.sources)}`;

  // ---------- systems: Odoo, the source of truth ----------
  const upAlg = X.upcoming.filter(e => e.muni).length;
  const awaitingModels = [...new Set(X.gaps.flatMap(g => (g.odoo || []).map(modelName)))];
  const sysRows = [
    ['ok', 'Source of truth', `${ext(X.sys.url, odooHost)} runs ${esc(odooLabel)}, their core platform`],
    ['ok', 'Last sync', `${esc(X.sys.read)}${X.sys.built ? ` (feed built ${esc(String(X.sys.built).slice(0, 16).replace('T', ' '))} UTC)` : ''}`],
    ['ok', 'Method', 'Public pages only, read only, no credentials. Each item links back to its page on their Odoo.'],
    ['ok', 'Events read', `<b data-count>${num(X.events.length)}</b> from the sitemap and one iCal export per event; ${num(X.upcoming.length)} coming up, ${num(upAlg)} of them in the Algarve`],
    ['ok', 'Blog posts read', `<b data-count>${num(X.news.length)}</b> from ${num(X.sys.feeds.length || 6)} blog feeds`],
    ...(X.pages.length ? [['ok', 'Pages read', `<b data-count>${num(X.pages.length)}</b> public pages (title and description)`]] : []),
    ['wait', 'Hub records', `Not on their Odoo yet (${awaitingModels.length} models): <span class="codes">${awaitingModels.map(m => `<code>${esc(m)}</code>`).join(' ')}</span>`],
    ...(X.inputs ? [['wait', 'Ideas and needs', `${esc(X.inputs.known || 'Nothing is published.')} ${X.inputs.odoo_note ? `<span class="prop">${esc(X.inputs.odoo_note)}</span>` : ''}`]] : []),
    ...(X.sys.classification ? [['ok', 'Our classification', esc(X.sys.classification)]] : []),
  ];
  const systems = `<div class="sys-grid"><div class="sys-t" role="table" aria-label="Odoo status">${sysRows.map(([s, k, val]) => `<div class="sr" role="row"><span role="rowheader" class="sr-k"><span class="led ${s}" aria-hidden="true"></span>${esc(k)}</span><span role="cell" class="sr-v">${val}</span></div>`).join('')}</div>
    <figure class="pipe" aria-label="How data flows: ideas, needs and spreadsheets go into Odoo; Odoo feeds their site and this page">
      <ol><li class="pp-in"><span>Ideas, needs</span><span>Spreadsheets</span></li><li class="pp-core"><strong>ODOO</strong><span>${esc(X.sys.version || '')}</span></li><li class="pp-out"><span>${esc(odooHost)}</span><span>This page (V3)</span></li></ol>
      <figcaption>As on António Guerreiro's whiteboard: ideas and needs, and the spreadsheets, flow into Odoo; Odoo feeds the official site. This page reads only what their Odoo publishes.</figcaption></figure></div>
    <p class="sys-go"><a href="/v2/odoo/">What the hub's own Odoo could hold, in V2 <span aria-hidden="true">→</span></a></p>`;

  // ---------- programme status board ----------
  const STATUS = { 'ualg-entrepreneurship': ['ok', 'Running · Penha, Gambelas, Portimão'], 'the-company': ['ok', 'Running · secondary schools'], buildathons: ['ok', 'Latest: Vibathon Algarve 2026'],
    founder2founder: ['go', 'Launched Oct 2026 · 8 of 41'], incubator: ['go', 'Recognised Jan 2026 · early stage planned 2027'], 'inova-algarve-3': ['wait', 'Pilot · 20 tourism businesses'],
    'startup-showcase': ['ok', 'Annual'], 'algarve-digital-innovators': ['ok', '24 communities · plan to 2030'], 'algarve-tech-hub-summit': ['wait', 'Returns 2027'], 'ccdr-digital-platform': ['ok', 'Leading'], 'algarve-empreende': ['ok', 'Managed by six organisations'], 'ai-robotics-tourism-pilot': ['wait', 'Applications closed 30 Apr 2026 · 15 winners'] };
  const shortStatus = txt => { const w = String(txt).split(/\s+/); let o = ''; for (const x of w) { if ((o + ' ' + x).trim().length > 46) return o.trim() + '...'; o += ' ' + x; } return o.trim(); };
  const board = `<div class="board" role="table" aria-label="Programme status board"><div class="br br-h" role="row"><span role="columnheader">Hub activity</span><span role="columnheader">Programme</span><span role="columnheader">Status</span><span role="columnheader">Source</span></div>
    ${X.programmes.map(p => { const [cls, txt] = STATUS[p.id] || ['ok', shortStatus(t(factOf(p).text || p.summary || ''))]; const a = ACT[p.activity];
      return `<div class="br" role="row"><span role="cell" class="b-p">${a ? `${a.code} ${esc(a.short)}` : esc(p.pillar || 'Algarve Evolution')}</span><span role="cell" class="b-n">${esc(t(p.name))}</span><span role="cell" class="b-s"><span class="led ${cls}" aria-hidden="true"></span><span class="flap">${esc(txt)}</span></span><span role="cell" class="b-src">${cite((p.facts || []).flatMap(f => [].concat(f.source || [])), 'src')}</span></div>`; }).join('')}</div>
    <details class="idx"><summary>What each programme does</summary><ul class="pg-list">${X.programmes.map(p => `<li><strong>${esc(t(p.name))}</strong> ${esc(t(factOf(p).text || p.summary || ''))}${p.note ? ` <em>${esc(t(p.note))}</em>` : ''}</li>`).join('')}</ul></details>`;

  // ---------- hero ----------
  const nextEv = X.upcoming[0];
  const person = data.people.people[0];
  const heroSys = `<dl class="hero-sys">
      <div><dt>Base</dt><dd>Faro, Algarve</dd>${cite('psn')}</div>
      <div><dt>Phase</dt><dd>From building a community to making the ecosystem work (2026)</dd>${cite(person?.sources?.[1])}</div>
      <div><dt>Source of truth</dt><dd>${esc(odooLabel)} at ${esc(odooHost)}, read ${esc(X.sys.read)}</dd><p class="src">Source: ${ext(X.sys.url, 'Algarve Evolution')}</p></div>
      ${nextEv ? `<div><dt>Next on their calendar</dt><dd>${ext(nextEv.url, nextEv.name)}, ${esc(dateEn(nextEv.day))}</dd><p class="src"><a href="${esc(nextEv.register || nextEv.url)}" rel="noopener">Register on their Odoo</a></p></div>` : ''}
    </dl>`;

  const navItems = [['hub', 'P-01', 'Hub'], ['upcoming', 'P-02', 'Coming up'], ['news', 'P-03', 'News'], ['network', 'P-04', 'Network'], ['radar', 'P-05', 'Radar'], ['log', 'P-06', 'Log'], ['targets', 'P-07', 'Targets'], ['systems', 'P-08', 'Odoo']];
  const sourcesList = () => [...cited.values()].sort((a, b) => String(a.publisher).localeCompare(String(b.publisher)) || String(a.title).localeCompare(String(b.title)))
    .map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.publisher)}</a>${s.title && s.title !== s.url ? `, ${esc(s.title)}` : ''}</li>`).join('');

  // Render the panels first, so the sources list holds every link cited on the page.
  const P = {
    acts: X.activities.map(actPanel).join(''),
    upcoming: panel('upcoming', 'P-02', 'Coming up on their Odoo', upcoming, { cls: 'span-7', sub: `Events from Algarve Evolution's own Odoo, soonest first. Register on their site.`, live: `${X.upcoming.length} AHEAD` }),
    news: panel('news', 'P-03', 'News feed', newsHTML, { cls: 'span-5', sub: 'Their blog, newest first.', live: 'RX' }),
    network: panel('network', 'P-04', 'Ecosystem network', graph, { cls: 'span-12', sub: 'Algarve Evolution, the hub\'s four activities, its programmes and partners, the communities on record and the organisations mapped from public sources, grouped by kind. No people. Drag a node, or hover or focus one to read it.', live: `${nodes.length} N · ${links.length} L` }),
    radar: panel('radar', 'P-05', 'Radar: the Algarve', radar, { cls: 'span-6', sub: `The 16 municipalities with the communities on record and the events on their Odoo calendar (${totalUpAlg} coming up in the region). Positions approximate.`, live: 'SCAN' }),
    log: panel('log', 'P-06', 'Timeline log', term, { cls: 'span-6', sub: 'Algarve Evolution\'s timeline from published sources, oldest first, then the last sync.', live: 'TTY' }),
    targets: panel('targets', 'P-07', '2032 targets', targets, { cls: 'span-7', sub: '<span class="warn">Targets, not results</span>' }),
    trans: panel('trans', 'P-07B', 'Incoming transmission', trans, { cls: 'span-5 pn-trans', live: 'RX' }),
    systems: panel('systems', 'P-08', 'Odoo: source of truth', systems, { cls: 'span-12 pn-sys', sub: 'Their Odoo is the source of truth for events and news. Everything on the hub that is not there yet shows as a gap.', live: `${esc(odooLabel.toUpperCase())}` }),
    board: panel('board', 'P-09', 'Programme status board', board, { cls: 'span-12', sub: 'The real programmes, under the hub activity each belongs to (our grouping).' }),
  };
  const heroCites = cite(['psn']);
  const teleCites = tele;
  const feedSrc = X.metaSources.length ? `<h3 class="src-h">How the feed was read</h3><ul class="feed-src">${X.metaSources.map(m => `<li><span class="fs-k">${esc(m.key)}</span> ${m.url ? `<a href="${esc(m.url)}" rel="noopener">${esc(m.label)}</a>` : esc(m.label)}</li>`).join('')}</ul>` : '';
  const sources = panel('sources', 'P-10', 'Sources', `<h3 class="src-h">Published sources cited on this page</h3><ol>${sourcesList()}</ol>${feedSrc}<p class="fine">Each event, post, page, community and organisation also links to its own record or public page where it appears.</p>`, { cls: 'span-12 pn-src', sub: 'Every fact on this dashboard links to one of these, or to its own record.' });

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control: the AE Innovation Hub, live | Algarve Evolution</title>
<meta name="description" content="The AE Innovation Hub as a live dashboard, with only what Algarve Evolution has published: its four activities, what is coming up on its Odoo, its news, network, communities and 2032 targets.">
<meta name="theme-color" content="#04070b">
${chrome.head}
<link rel="preload" href="${BASE}/fonts/chakra-petch-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${BASE}/fonts/jetbrains-mono-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${BASE}/mission.css">
</head>
<body class="mc">
${chrome.banner}
<a class="skip" href="#dash">Skip to the dashboard</a>
<div class="hud">
  <p class="hud-id"><span class="hud-logo" aria-hidden="true"></span>AE <span class="sl">//</span> Mission Control</p>
  <p class="hud-mid"><span>Sector: Algarve</span><span>Base: Faro 37.02N 7.93W</span></p>
  <p class="hud-r"><span class="clock" aria-hidden="true"><span data-clock>--:--:--</span> Faro time</span><span class="badge"><span class="led ok" aria-hidden="true"></span>Real data only</span>
  <button type="button" class="motion" aria-pressed="true" data-on="Motion on" data-off="Motion off">Motion on</button></p>
  <nav class="hud-nav" aria-label="Dashboard menu">
    <div class="hn-sec">${navItems.map(([id, code, l]) => `<a href="#${id}"><span class="hn-c" aria-hidden="true">${code}</span>${esc(l)}</a>`).join('')}</div>
    <div class="hn-mods"><a class="hn-mod" href="#systems"><span class="hn-c" aria-hidden="true">SYS</span><span class="led ok" aria-hidden="true"></span>${esc(odooLabel)} · synced ${esc(X.sys.read)}</a></div>
  </nav>
</div>
<main id="dash" class="dash">
  <section class="hero" aria-labelledby="h-hero">
    <div class="hero-main">
      <p class="hero-k"><span class="led cyan blink" aria-hidden="true"></span>Transmission from Algarve Evolution</p>
      <h1 id="h-hero">AE Innovation Hub</h1>
      <p class="lede">Four activities on Odoo: incubation and acceleration, Challenge Connect, Vibathon and the talent ecosystem, with ideas and needs flowing in. Shown here only with what Algarve Evolution has published, each fact with its source.</p>
      <p class="mandate"><span>Mandate</span> ${esc(t(v.mission))}</p>
      ${heroCites}
      <ul class="hub-strip" aria-label="The four hub activities">${X.activities.map(a => `<li class="hs-${a.tone}"><a href="#act-${a.id}"><span class="hs-c">${a.code}</span>${esc(a.short)}</a></li>`).join('')}<li class="hs-base"><a href="#systems"><span class="hs-c">BASE</span>Odoo infrastructure</a></li></ul>
    </div>
    <div class="hero-side">
    <svg class="reticle" viewBox="0 0 300 300" aria-hidden="true"><g fill="none">
      <circle cx="150" cy="150" r="140" class="rt-1"/><circle cx="150" cy="150" r="112" class="rt-2"/><circle cx="150" cy="150" r="70" class="rt-3"/>
      <g class="rt-spin"><path d="M150 10a140 140 0 0 1 121 70" class="rt-arc"/><path d="M150 290a140 140 0 0 1-121-70" class="rt-arc"/></g>
      <g class="rt-spin2"><path d="M38 150a112 112 0 0 1 33-79" class="rt-arc2"/><path d="M262 150a112 112 0 0 1-33 79" class="rt-arc2"/></g>
      <path d="M150 0v60M150 240v60M0 150h60M240 150h60" class="rt-x"/><circle cx="150" cy="150" r="5" class="rt-c"/>
    </g><text x="150" y="196" text-anchor="middle" class="rt-t">FARO HQ</text><text x="150" y="212" text-anchor="middle" class="rt-t2">37.02N 7.93W</text></svg>
    ${heroSys}</div>
  </section>
  <section class="pn tele-pn" aria-labelledby="h-tele"><header class="pn-h"><span class="pn-code" aria-hidden="true">P-00</span><h2 id="h-tele">Telemetry</h2><span class="pn-live" aria-hidden="true">SELF-REPORTED</span></header>
    <p class="pn-sub">Algarve Evolution's own figures, as reported. Not audited; where sources differ, both are shown.</p><ul class="tele">${teleCites}</ul></section>
  <div class="grid" id="hub">
    <header class="grid-h span-12"><p><span class="pn-code" aria-hidden="true">P-01</span> The hub: four activities</p><p class="grid-s">Each with its real counts. Where nothing is published yet, the panel says which Odoo records would fill it, and links to V2, which shows what it could look like.</p></header>
    ${P.acts}
    ${P.upcoming}
    ${P.news}
    ${P.network}
    ${P.radar}
    ${P.log}
    ${P.targets}
    ${P.trans}
    ${P.systems}
    ${P.board}
    ${sources}
  </div>
</main>
<footer class="foot">
  <p>V3 shows what Algarve Evolution has published; <a href="/v2/">V2</a> shows what the hub could be, with simulated records. Code Apache-2.0, text CC BY 4.0.</p>
  <p class="fine">Typefaces: Chakra Petch and JetBrains Mono (SIL OFL 1.1). Version ${esc(chrome.version)}.</p>
</footer>
<script src="${BASE}/mission.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
