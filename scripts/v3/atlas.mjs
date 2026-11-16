// V3 The Atlas: the AE Innovation Hub on a map, with real data only.
// Built from V1's Atlas (v1-source/scripts/designs/atlas.mjs), which António Guerreiro picked on 16 November 2026:
// a full-viewport SVG map of the Algarve, layers, a timeline scrubber and a side panel (a bottom sheet on phones).
// Layers: the events on Algarve Evolution's Odoo by town, and the hub's four activities (INC/ACC, Challenge Connect,
// Vibathon, Talent). The scrubber runs over the real timeline and their events, past and upcoming. Each place's card
// shows its real records with their sources; the gaps say what their Odoo would fill and link to the V2 pages.
// Everything is rendered at build time (works without JavaScript); /v3/atlas/atlas.js adds pan, zoom, layers and play.
// Data: ctx.real (src/feeds/real.json, docs/v3/REAL-FEED.md). Until that file exists, the same records are read from
// ctx.data and the files the feed is built from (public organisations and communities). Nothing simulated is read.
// sites-dev@AgentiCCells.dinis, 16 November 2026. Code Apache-2.0, text CC BY 4.0.
import { readFileSync } from 'node:fs';

export const meta = { slug: 'atlas', order: 3, name: 'The Atlas', tagline: 'The Algarve, mapped' };

const ROOT = new URL('../../', import.meta.url);
const readJson = p => { try { return JSON.parse(readFileSync(new URL(p, ROOT), 'utf8')); } catch { return null; } };

// ---------- drawing (from V1) ----------
// Equirectangular projection, scaled by cos(37.2°), 1000 units per degree of latitude. Drawing only.
const LON0 = -9.1, LAT0 = 37.62, COS = Math.cos(37.2 * Math.PI / 180), K = 1000;
const MAP = { w: 1593, h: 740 };
const proj = ([lon, lat]) => [Math.round((lon - LON0) * COS * K * 10) / 10, Math.round((LAT0 - lat) * K * 10) / 10];
function pathOf(ring, { closed = true, smooth = 0.5 } = {}) {
  const p = ring.map(proj).filter((q, i, a) => i === 0 || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
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
  const mouthP = pt.findIndex(q => q[0] === -7.4071), mouthS = es.findIndex(q => q[0] === -7.4071);
  return { portugal: pt, spain: es, coastPt: pt.slice(mouthP), coastEs: es.slice(0, mouthS + 1), border: pt.slice(0, mouthP + 1) };
}
// Hand-tuned label placement for the municipalities (V1): [dx, dy, anchor, lines]; PRI2 labels hide when zoomed out.
const MUNI_LABEL = {
  faro: [-12, 18, 'end'], olhao: [9, 15, 'start'], loule: [-9, -7, 'end'], 'sao-bras-de-alportel': [0, -10, 'middle'],
  silves: [0, -11, 'middle'], lagoa: [8, 15, 'start'], portimao: [-10, 17, 'end'], lagos: [-12, 18, 'end'], albufeira: [0, 22, 'middle'],
  'vila-do-bispo': [-2, 18, 'middle'], aljezur: [-9, 4, 'end'], monchique: [0, -14, 'middle'], tavira: [0, 22, 'middle'],
  'castro-marim': [-8, -6, 'end'], 'vila-real-de-santo-antonio': [-8, 14, 'end', 'Vila Real de|Santo António'], alcoutim: [-9, 4, 'end'],
};
const PRI2 = new Set(['olhao', 'sao-bras-de-alportel', 'lagoa', 'silves', 'castro-marim', 'vila-real-de-santo-antonio', 'aljezur', 'vila-do-bispo']);
const REGION_LL = [-8.02, 37.335], BEYOND_LL = [-8.99, 37.215];

// ---------- reading places out of text ----------
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Towns and campuses inside a municipality (so an event "in Almancil" is placed in Loulé). Geography, not data.
const ALIAS = {
  almancil: 'loule', quarteira: 'loule', vilamoura: 'loule', salir: 'loule', malhao: 'loule', boliqueime: 'loule', 'fonte do palheiro': 'loule',
  alvor: 'portimao', 'mexilhoeira grande': 'portimao', 'praia da rocha': 'portimao', gambelas: 'faro', 'campus da penha': 'faro', estoi: 'faro',
  carvoeiro: 'lagoa', ferragudo: 'lagoa', parchal: 'lagoa', alcantarilha: 'silves', 'armacao de pera': 'silves', altura: 'castro-marim',
  'monte gordo': 'vila-real-de-santo-antonio', sagres: 'vila-do-bispo', moncarapacho: 'olhao', fuseta: 'olhao', odeceixe: 'aljezur', cabanas: 'tavira',
};
// Portuguese postcodes of the Algarve (8xxx-xxx) by their first four digits.
const POST = [[8000, 8099, 'faro'], [8100, 8149, 'loule'], [8150, 8159, 'sao-bras-de-alportel'], [8200, 8299, 'albufeira'], [8300, 8399, 'silves'],
  [8400, 8499, 'lagoa'], [8500, 8549, 'portimao'], [8550, 8599, 'monchique'], [8600, 8649, 'lagos'], [8650, 8669, 'vila-do-bispo'], [8670, 8699, 'aljezur'],
  [8700, 8799, 'olhao'], [8800, 8899, 'tavira'], [8900, 8949, 'vila-real-de-santo-antonio'], [8950, 8969, 'castro-marim'], [8970, 8999, 'alcoutim']];

function placer(munis) {
  const names = munis.map(m => [fold(m.name).replace(/-/g, ' '), m.id]).sort((a, b) => b[0].length - a[0].length);
  const byId = new Set(munis.map(m => m.id));
  const words = [...names, ...Object.entries(ALIAS)].sort((a, b) => b[0].length - a[0].length);
  const inText = s => { const f = ` ${fold(s).replace(/[^a-z0-9]+/g, ' ')} `; for (const [w, id] of words) if (f.includes(` ${w} `)) return id; return null; };
  const post = s => { const m = String(s || '').match(/\b(8\d{3})-\d{3}\b/); if (!m) return null; const n = +m[1]; return (POST.find(([a, b]) => n >= a && n <= b) || [])[2] || null; };
  // A town, a place line and a name in, a municipality id, 'region', 'online' or 'beyond' out.
  return ({ town, place, name }) => {
    const t = fold(town);
    if (t) { if (byId.has(t)) return t; if (/algarve|region/.test(t) && !inText(town)) return 'region'; const x = inText(town); if (x) return x; }
    if (/^\s*(online|webinar)\b/i.test(place || '') || (!place && /^\s*webinar\b/i.test(name || ''))) return 'online';
    const p = post(place) || inText(place);
    if (p) return p;
    if (place && place.trim()) return 'beyond';
    return inText(name) || 'beyond';
  };
}

// ---------- the activities ----------
const ACTS = ['inc-acc', 'challenge-connect', 'vibathon', 'talent'];
const ACT = {
  'inc-acc': { short: 'INC/ACC', cls: 'inc', v2: '/inc-acc/', words: 'incubação, aceleração, mentores, KPIs' },
  'challenge-connect': { short: 'Challenge Connect', cls: 'chal', v2: '/challenge-connect/', words: 'desafios, fornecedores, matching' },
  vibathon: { short: 'Vibathon', cls: 'vib', v2: '/vibathon/', words: 'hackathons, workshops, júris' },
  talent: { short: 'Talent', cls: 'tal', v2: '/talent/', words: 'talento, competências, parceiros, rede ADI' },
};
// What no public source holds yet, by activity, with the hub addon's records that would hold it
// (odoo/addons/algarve_innovation_hub). Used only until src/feeds/real.json brings its own gaps.
const GAPS = [
  { activity: 'inc-acc', what: 'The startups in each programme, their mentors and mentoring sessions, and their KPIs from month 0 to month 6, with a reflection on the indicators.', odoo: ['aih.programme', 'aih.programme.company', 'aih.session', 'aih.kpi', 'aih.reflection'], v2: '/inc-acc/' },
  { activity: 'challenge-connect', what: 'The challenges companies bring, the companies and professionals who apply as suppliers, their applications and the matching result: the best or a top 3.', odoo: ['aih.challenge', 'aih.application', 'res.partner (supplier)'], v2: '/challenge-connect/' },
  { activity: 'vibathon', what: 'Who registered, the mentors and the jury, the projects presented at the end, their scores and the next step after each event.', odoo: ['aih.vibathon', 'aih.vibathon.participant', 'aih.vibathon.jury', 'aih.project', 'aih.project.score'], v2: '/vibathon/' },
  { activity: 'talent', what: 'The people in each community, with their consent, grouped as professionals, consultants, mentors and investors, with their skills; project partners and stakeholders.', odoo: ['aih.community', 'res.partner (talent)', 'aih.skill'], v2: '/talent/' },
];
// Programmes from src/data, by activity (only until real.json gives each programme its activity).
const PROG_ACT = { 'ualg-entrepreneurship': 'inc-acc', 'the-company': 'inc-acc', founder2founder: 'inc-acc', incubator: 'inc-acc', 'inova-algarve-3': 'inc-acc',
  'startup-showcase': 'inc-acc', buildathons: 'vibathon', 'algarve-digital-innovators': 'talent', 'algarve-tech-hub-summit': 'talent', 'ccdr-digital-platform': 'talent' };
const KIND_RX = [['hackathon', /hack|buildathon|vibathon|build with|build lab|8h2 build|startup weekend|design sprint|arcade/i],
  ['workshop', /workshop|webinar|como |how to|how i |intro to|101|curso|aprende|master your|vibe.coding|cria a tua|practical|building |from websites|decoded|deep dive|o que h[aá]|da automa|da sobrecarga|presen[cç]a|rethink|tend[eê]ncias|relat[oó]rio|ask me anything|\bama\b|\baua\b/i],
  ['summit', /summit|forum|f[oó]rum|conference|conf\b|festival|fair|feira|convention|show|expo|congress|devfest|wordcamp|web summit|tedx|awards|sinfo|transfiere|vivatech|gala|world cup/i],
  ['meetup', /meetup|meeting|networking|mixer|party|night|gathering|afterwork|celebration|talks|sessions|pizza|dialogue|open mic/i]];
const kindOf = name => (KIND_RX.find(([, rx]) => rx.test(name || '')) || ['other'])[0];
const KIND_LABEL = { hackathon: 'Hackathon', workshop: 'Workshop', talk: 'Talk', summit: 'Summit', conference: 'Conference', fair: 'Fair', awards: 'Awards', meetup: 'Meetup', other: 'Event' };
// Where the timeline entries happened, as their own text says (V1's reading; keys are the entries' t values).
const TL_PLACES = { '2019.7': ['faro'], '2022.25': ['faro', 'loule'], '2024.42': ['faro'], '2024.8': ['albufeira'], '2025.68': ['lagos'],
  '2025.85': ['lagos'], '2025.87': ['beyond'], '2025.97': ['faro'], '2026.86': ['portimao', 'loule', 'lagos'] };
const ORG_KIND = { incubation: 'Incubation', education: 'Education', community: 'Community', public: 'Public body', company: 'Company', funding: 'Funding', support: 'Support' };

// ---------- the model: one shape, from real.json or (until it exists) from the files it is built from ----------
const arr = x => (Array.isArray(x) ? x : []);
function model({ real, data, h }) {
  const { t } = h;
  const live = real && !real.missing && Array.isArray(real.events) && real.events.length > 0;
  const odoo = data.odoo;
  const munis = (live && real.places?.municipalities?.length ? real.places.municipalities : data.places.municipalities);
  const place = placer(munis);
  const om = live ? real.meta?.odoo || {} : {};
  const read = String(om.read || odoo.read || '').slice(0, 10);
  const today = read || new Date().toISOString().slice(0, 10);
  const yt = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return y + ((m - 1) * 30.44 + (d || 15) - 1) / 365.25; };
  const notIn = x => x && !['region', 'online', 'beyond'].includes(x);
  // Places named in a text (the programme's own summary and facts), as municipality ids.
  const townsIn = text => [...new Set(String(text || '').split(/[,;.():]| and | with /).map(s => place({ town: s })).filter(notIn))];

  // events: their public Odoo. The feed's region says where (algarve, portugal, abroad, online); town says which town.
  const rawEvents = live ? real.events : odoo.events.map(e => ({ ...e, id: e.url.split('/').pop(), source: e.url }));
  const events = rawEvents.filter(e => e.start).map(e => {
    const start = String(e.start).slice(0, 10), end = e.end ? String(e.end).slice(0, 10) : null;
    let at;
    if (e.region === 'online') at = 'online';
    else if (e.region === 'portugal' || e.region === 'abroad') at = 'beyond';
    else { at = place({ town: e.town, place: e.place, name: e.name }); if (e.region === 'algarve' && !notIn(at)) at = 'region'; }
    // Never a guest speaker's name: the feed gives name_safe for titles that name a person.
    const name = e.names_person ? (e.name_safe || 'An event (with a guest speaker)') : (e.name_safe || (live ? e.name : String(e.name).replace(/\s+with\s+\p{Lu}\p{Ll}+(?:\s+\p{Lu}\p{Ll}+)+\s*$/u, ' (with a guest speaker)')));
    return { id: e.id, name, start, end: end && end !== start ? end : null, place: e.place || '', town: e.town || null, url: e.url || e.source, register: e.register || null,
      source: e.source || e.url, kind: e.kind || kindOf(name), activity: e.activity || null, at, t: yt(start), up: start >= today };
  }).sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));
  const eventById = new Map(events.map(e => [e.id, e]));

  // the hub and its activities
  const pub = live ? null : readJson('src/feeds/public.json');
  const hubActs = arr(real?.hub?.activities).length ? real.hub.activities : arr(pub?.hub?.activities);
  const acts = ACTS.map(id => { const a = hubActs.find(x => x.id === id) || {};
    return { id, ...ACT[id], name: a.name || ACT[id].short, summary: a.summary || '', keywords: a.keywords || ACT[id].words, keywordsEn: a.keywords_en || '' }; });

  // programmes, each in the activity the feed gives it (null: in no activity)
  const progs = (live && arr(real.programmes).length ? real.programmes : data.programmes.pillars.flatMap(p => p.programmes.map(g => ({
    id: g.id, name: t(g.name), activity: PROG_ACT[g.id] || null, summary: t(g.summary), facts: [], sources: g.sources }))))
    .map(g => { const towns = townsIn([g.summary, ...arr(g.facts).map(f => f.text)].join('. '));
      const facts = arr(g.facts).filter(f => f.text && f.text !== g.summary);
      return { ...g, activity: g.activity || 'other', facts, sources: [...arr(g.sources), g.source, ...arr(g.facts).flatMap(f => [f.source, ...arr(f.sources)])].filter(Boolean), towns: towns.length ? towns : ['region'] }; });

  // their public Odoo pages for an activity (title only), when they are not already a programme's page
  const progPages = new Set(progs.map(g => g.page).filter(Boolean));
  const seenTitle = new Set();
  const pages = arr(real?.pages).filter(p => p.activity && !progPages.has(p.url)).map(p => ({ ...p, title: String(p.title || '').replace(/\s*\|\s*Algarve Evolution\s*$/i, '').trim() }))
    .filter(p => p.title && !seenTitle.has(p.title) && seenTitle.add(p.title)).map(p => ({ ...p, towns: townsIn(p.title) }));

  // news on their Odoo blogs; the calls among them are the nearest public thing to Challenge Connect today
  const news = (live && arr(real.news).length ? real.news : odoo.posts).map(n => ({ ...n, title: String(n.title).replace(/&amp;/g, '&') }));
  const CALL = /challenge|\bcalls?\b|applications open|looking for|provas de conceito|ignite|opens call/i;
  const challengeItems = [
    ...progs.filter(g => g.activity === 'challenge-connect').map(g => ({ kind: 'programme', name: g.name, text: g.summary, url: g.page || null, sources: g.sources, towns: g.towns })),
    ...pages.filter(p => p.activity === 'challenge-connect').map(p => ({ kind: 'page', name: p.title, text: p.description, url: p.url, sources: [p.url], towns: p.towns.length ? p.towns : ['region'] })),
    ...news.filter(n => CALL.test(n.title)).map(n => { const tw = townsIn(n.title); return { kind: 'news', name: n.title, date: n.date, url: n.url, sources: [n.source || n.url], towns: tw.length ? tw : ['region'] }; }),
  ];

  // Vibathon: the Vibathon records (Vibathon Algarve 2026 with what was reported, and the hackathons on their Odoo)
  // and the workshops on their Odoo. A record with only "Listed on their calendar" shows as its Odoo event.
  const vibRaw = live && arr(real.vibathons).length ? real.vibathons : data.events.events.filter(e => /vibathon/i.test(t(e.name))).map(e => ({
    name: t(e.name), date: e.start, place: t(e.place), facts: [{ text: t(e.summary), source: e.sources[0] }], sources: e.sources }));
  const vibathons = vibRaw.filter(v => arr(v.facts).some(f => !/^Listed on/i.test(f.text || '')))
    .map(v => ({ ...v, event: eventById.get(v.odoo_event) || null, sources: [...arr(v.sources), v.source, ...arr(v.facts).map(f => f.source)].filter(Boolean), at: place({ town: v.town, place: v.place, name: v.name }) }));
  const mainEv = new Set(vibathons.map(v => v.odoo_event).filter(Boolean));
  const vibIds = new Set(vibRaw.map(v => v.odoo_event).filter(Boolean));
  const vibEvents = events.filter(e => !mainEv.has(e.id) && (vibIds.has(e.id) || e.activity === 'vibathon' || e.kind === 'hackathon' || e.kind === 'workshop'));

  // Talent: the communities (the ADI network's list and others) and the public organisations by town (no people)
  const comms = (live && arr(real.communities).length ? real.communities : arr(pub?.communities).filter(c => c.simulated === false))
    .map(c => ({ ...c, at: c.municipality ? place({ town: c.municipality }) : 'region', unplaced: !c.municipality }));
  const orgFile = live ? null : readJson('v1-source/src/talent-map/data/organisations.json');
  const orgs = (live && arr(real.organisations).length ? real.organisations : arr(orgFile?.organisations).map(o => ({ id: o.id, name: o.name, kind: o.kind, town: o.town === 'algarve' ? 'Algarve (region)' : o.town, what: o.what, url: o.url, source: o.source_url, read: o.read_on })))
    .map(o => ({ ...o, at: place({ town: o.town }) }));
  // The gaps by activity, and the hub's input stream (ideas and needs) as a gap for the hub as a whole.
  const gaps = [...(arr(real?.gaps).length ? real.gaps : GAPS), ...(live && real.hub?.inputs?.what ? [{ ...real.hub.inputs, activity: null }] : [])];

  // the organisation: goals (targets), the quote, the timeline (from real.json, else src/data)
  const org = live ? real.organisation || {} : {};
  const v = data.voice;
  const q0 = data.people.quotes[0]; const person = data.people.people.find(p => p.id === q0.by);
  const goals = arr(org.goals).length ? org.goals.map(g => ({ value: t(g.value), label: t(g.label) })) : v.goals.map(g => ({ value: t(g.value), label: t(g.label) }));
  const goalsSources = arr(org.goals).length ? [...new Set(org.goals.flatMap(g => [g.source, ...arr(g.sources)]).filter(Boolean))] : v.goals_sources;
  const quote = org.quote?.text ? { text: t(org.quote.text), by: org.quote.by || person.name, role: t(org.executive_director?.role) || t(person.role), date: org.quote.date || q0.date, sources: [...arr(org.quote.sources), org.quote.source].filter(Boolean) }
    : { text: t(q0.text), by: person.name, role: t(person.role), date: q0.date, sources: q0.sources };
  const timeline = (arr(org.timeline).length ? org.timeline : data.ecosystem.timeline).map(e => ({ ...e, t: +e.t, key: String(e.t), src: e.sources || e.source || e.src }));
  const adi = org.adi || null;

  const meta = { read, today, live, odooUrl: om.url || odoo.source || 'https://www.algarveevolution.pt', odooVersion: om.version || odoo.odoo, built: real?.meta?.built || null, classification: real?.meta?.classification || null };
  return { munis, events, acts, progs, pages, news, challengeItems, vibathons, vibEvents, comms, orgs, gaps, goals, goalsSources, goalsNote: org.goals_note || t(v.goals_note) || 'Targets, not results.', quote, timeline, adi, meta,
    lede: t(org.lede) || t(v.hero_lede), mission: t(org.mission) || t(v.mission), ledeSources: arr(org.voice_sources).length ? org.voice_sources : v.story_sources };
}

// ---------- render ----------
export function render(ctx) {
  const { h, chrome, data } = ctx;
  const { esc } = h;
  const M = model(ctx);
  const used = new Map();
  const cite = (refs, cls) => { const list = [].concat(refs || []).filter(Boolean); for (const r of list) { try { const s = h.source(r); used.set(s.url, s); } catch {} } return h.cite(list, cls); };
  const d = iso => h.date(iso.slice(0, 10));
  const range = e => e.end ? `${d(e.start)} to ${d(e.end)}` : d(e.start);
  const num = n => h.num(n);
  const plural = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
  const O = outline(data.places);
  const munis = M.munis.map(m => ({ ...m, p: proj(m.ll) }));
  const muniById = new Map(munis.map(m => [m.id, m]));
  const spots = [...munis.map(m => m.id), 'region'];
  const posOf = id => id === 'region' ? proj(REGION_LL) : id === 'beyond' ? proj(BEYOND_LL) : muniById.get(id).p;
  const nameOf = id => id === 'region' ? 'Across the region' : id === 'beyond' ? 'Beyond the Algarve' : muniById.get(id).name;
  const odooHost = M.meta.odooUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const odooSrc = `<p class="src">Source: <a href="${esc(M.meta.odooUrl)}" rel="noopener">their Odoo (${esc(odooHost)})</a>${M.meta.read ? `, read ${esc(d(M.meta.read))}` : ''}</p>`;
  used.set(M.meta.odooUrl, { url: M.meta.odooUrl, publisher: 'Algarve Evolution', title: `Their Odoo website (Odoo ${M.meta.odooVersion || ''}), events and news` });
  const actName = id => M.acts.find(a => a.id === id)?.name || 'The hub as a whole';

  // ---- what is where ----
  const at = (list, id, key = 'at') => list.filter(x => (Array.isArray(x[key]) ? x[key].includes(id) : x[key] === id));
  const progsOf = act => M.progs.filter(g => g.activity === act), pagesOf = act => M.pages.filter(p => p.activity === act);
  const byTown = id => ({
    events: at(M.events, id), progs: at(progsOf('inc-acc'), id, 'towns'), pagesInc: at(pagesOf('inc-acc'), id, 'towns'), chal: at(M.challengeItems, id, 'towns'),
    vib: at(M.vibathons, id), vibProgs: at(progsOf('vibathon'), id, 'towns'), vibEv: at(M.vibEvents, id), pagesVib: at(pagesOf('vibathon'), id, 'towns'),
    comms: at(M.comms, id), orgs: at(M.orgs, id), talProgs: at(progsOf('talent'), id, 'towns'), pagesTal: at(pagesOf('talent'), id, 'towns'), other: at(progsOf('other'), id, 'towns'),
  });
  const T = Object.fromEntries([...spots, 'beyond', 'online'].map(id => [id, byTown(id)]));
  const badgeN = (id, act) => { const x = T[id]; return act === 'inc-acc' ? x.progs.length + x.pagesInc.length : act === 'challenge-connect' ? x.chal.length
    : act === 'vibathon' ? x.vib.length + x.vibProgs.length + x.vibEv.length + x.pagesVib.length : x.comms.length + x.orgs.length + x.talProgs.length + x.pagesTal.length; };
  const outEvents = [...T.beyond.events, ...T.online.events];

  // ---- timeline stops: the real timeline and each month with events on their Odoo ----
  const monthKey = iso => iso.slice(0, 7);
  const months = [...new Set(M.events.map(e => monthKey(e.start)))].sort();
  const monthName = k => { const [y, m] = k.split('-').map(Number); return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`; };
  const monthT = k => { const [y, m] = k.split('-').map(Number); return +(y + (m - 1) / 12 + 1 / 24).toFixed(3); };
  const stops = [
    ...M.timeline.map(e => ({ id: `tl-${e.key.replace('.', '-')}`, t: e.t, kind: 'tl', label: `${e.when} · ${e.title}`, year: (String(e.when).match(/\d{4}/) || [String(Math.floor(e.t))])[0], towns: TL_PLACES[e.key] || [], future: !!e.future })),
    ...months.map(k => { const evs = M.events.filter(e => monthKey(e.start) === k); return { id: `mo-${k}`, t: monthT(k), kind: 'mo', label: `${monthName(k)} · ${plural(evs.length, 'event')} on their Odoo`, year: k.slice(0, 4), towns: [...new Set(evs.map(e => e.at === 'online' ? 'beyond' : e.at))], future: k > monthKey(M.meta.today), n: evs.length }; }),
  ].sort((a, b) => a.t - b.t);
  const T0 = 2018, T1 = 2027.35, SPLIT = [2025.3, 0.3];
  const pos = x => (x <= SPLIT[0] ? (x - T0) / (SPLIT[0] - T0) * SPLIT[1] : SPLIT[1] + (x - SPLIT[0]) / (T1 - SPLIT[0]) * (1 - SPLIT[1]));
  const pc = x => (Math.max(0, Math.min(1, pos(x))) * 100).toFixed(2);
  const todayT = M.events.length ? (() => { const [y, m, dd] = M.meta.today.split('-').map(Number); return y + ((m - 1) * 30.44 + dd - 1) / 365.25; })() : T1;

  // ---- the map ----
  const coastD = pathOf(O.coastPt, { closed: false }) + pathOf(O.coastEs, { closed: false });
  const landPt = pathOf(O.portugal), landEs = pathOf(O.spain);
  const grat = [];
  for (let lon = -9; lon <= -7.2; lon += 0.25) { const [x] = proj([lon, 37]); grat.push(`<path d="M${x},-400V1200"/>`); }
  for (let lat = 37; lat <= 37.6; lat += 0.25) { const [, y] = proj([-9, lat]); grat.push(`<path d="M-400,${y}H2000"/>`); }
  const dm = x => { const a = Math.abs(x), deg = Math.floor(a + 1e-9), min = Math.round((a - deg) * 60); return `${deg}°${min ? String(min).padStart(2, '0') + '′' : ''}`; };
  const gratLabels = [];
  for (let lon = -8.75; lon <= -7.4; lon += 0.25) { const [x] = proj([lon, 37]); gratLabels.push(`<text x="${x + 5}" y="${proj([0, 36.952])[1]}">${dm(lon)} W</text>`); }
  for (let lat = 37; lat <= 37.5; lat += 0.25) { const [, y] = proj([-9, lat]); gratLabels.push(`<text x="${proj([-9.08, 0])[0]}" y="${y - 6}">${dm(lat)} N</text>`); }

  // The ADI network (Talent layer): each municipality joined to its nearest neighbours. A drawing, not roads.
  const edges = new Set();
  for (const a of munis) munis.filter(b => b !== a).map(b => [b, Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1])]).sort((x, y) => x[1] - y[1]).slice(0, 3)
    .forEach(([b, dist]) => { if (dist < 260) edges.add([a.id, b.id].sort().join('|')); });
  const netLines = [...edges].map(e => { const [a, b] = e.split('|').map(id => muniById.get(id).p); const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.12; return `<path d="M${a}Q${mx},${my} ${b}"/>`; }).join('');

  const mk = (cls, [x, y], inner, attrs = '') => `<g class="mk ${cls}" transform="translate(${x} ${y})"${attrs}><g class="mk-s">${inner}</g></g>`;
  const label = (text, dx, dy, anchor, cls = '', lines) => lines
    ? `<text class="lbl ${cls}" x="${dx}" y="${dy}" text-anchor="${anchor}">${lines.split('|').map((l, i) => `<tspan x="${dx}" dy="${i ? 12 : 0}">${esc(l)}</tspan>`).join('')}</text>`
    : `<text class="lbl ${cls}" x="${dx}" y="${dy}" text-anchor="${anchor}">${esc(text)}</text>`;
  const rOf = n => (n ? 7 + 2.3 * Math.sqrt(n) : 0);
  const tsOf = list => list.map(e => e.t.toFixed(3)).join(',');

  // Names go in their own layer above the badges, so a badge never hides a name.
  const labelMarks = [];
  const baseMarks = munis.map(m => {
    const hq = m.id === 'faro'; const [dx, dy, an, lines] = MUNI_LABEL[m.id] || [8, 4, 'start'];
    const n = T[m.id].events.length; const R = rOf(n);
    const inner = hq
      ? `<circle r="22" class="hit"/><circle r="17" class="hq-pulse"/><circle r="11" class="hq-ring"/><path class="hq-star" d="M0,-8L2.2,-2.2L8,0L2.2,2.2L0,8L-2.2,2.2L-8,0L-2.2,-2.2Z"/>`
      : `<circle r="11" class="hit"/><circle r="3.8" class="dot"/>`;
    labelMarks.push(mk(`mk-lbl${PRI2.has(m.id) ? ' pri2' : ''}`, m.p, hq ? `${label(m.name, -Math.max(16, R + 4), 6, 'end', 'lbl-place lbl-hq')}<text class="lbl-tag" x="${-Math.max(16, R + 4)}" y="21" text-anchor="end">AE base · UAlg TEC Campus</text>` : label(m.name, dx, dy, an, '', lines)));
    return `<a href="#town-${m.id}" class="mk-link" data-card="town-${m.id}" aria-label="${esc(m.name)}${hq ? ', Algarve Evolution\'s base' : ''}">${mk(`mk-muni${hq ? ' mk-hq' : ''}${PRI2.has(m.id) ? ' pri2' : ''}`, m.p, inner)}</a>`;
  }).join('');
  const regionMark = `<a href="#town-region" class="mk-link" data-card="town-region" aria-label="Across the region: records for the whole Algarve">${mk('mk-region', posOf('region'), `<circle r="16" class="hit"/><circle r="12" class="rg-ring"/><circle r="3" class="rg-dot"/>`)}</a>`;
  labelMarks.push(mk('mk-lbl', posOf('region'), '<text class="lbl lbl-rg" y="-19" text-anchor="middle">Across the region</text>'));

  // events layer: a bubble per town, its size from how many events (past solid, upcoming dashed)
  const evMarks = [...spots.filter(id => id !== 'region'), 'beyond'].map(id => {
    const list = id === 'beyond' ? outEvents : T[id].events; if (!list.length) return '';
    const past = list.filter(e => !e.up).length, up = list.length - past;
    const lis = id === 'beyond' ? `<text class="lbl lbl-lis" x="0" y="${-rOf(list.length) - 8}" text-anchor="middle"><tspan x="0">↑ Lisbon, Porto, abroad</tspan><tspan x="0" dy="16">and online</tspan></text>` : '';
    return `<a href="#town-${id}" class="mk-link ev-link" data-card="town-${id}" data-sec="events" data-ts="${tsOf(list)}" data-today="${todayT.toFixed(3)}" aria-label="${esc(nameOf(id))}: ${plural(list.length, 'event')} on their Odoo, ${num(up)} upcoming">${mk('mk-ev', posOf(id),
      `<circle class="ev-up" r="${rOf(list.length).toFixed(1)}"/><circle class="ev-past" r="${rOf(past).toFixed(1)}"/>${lis}<title>${esc(nameOf(id))}: ${plural(list.length, 'event')}, ${num(up)} upcoming</title>`, ` data-town="${id}"`)}</a>`;
  }).join('');
  // arcs from Algarve Evolution's base to where each stop happened
  const faroP = posOf('faro');
  const arcs = stops.flatMap(s => s.towns.filter(id => id !== 'faro' && (id === 'beyond' || muniById.has(id))).map(id => {
    const p = posOf(id); const dx = p[0] - faroP[0], dy = p[1] - faroP[1]; const dist = Math.hypot(dx, dy);
    const mx = (p[0] + faroP[0]) / 2 + dy * 0.18, my = (p[1] + faroP[1]) / 2 - Math.abs(dx) * 0.18 - dist * 0.08;
    return `<path class="ev-arc" data-stop="${s.id}" d="M${faroP}Q${mx.toFixed(1)},${my.toFixed(1)} ${p}" pathLength="1"/>`;
  })).join('');

  // activity badges, set around each place outside its event bubble
  // Each place's badges sit in an arc on the side away from its name: above a name set below, below a name set above,
  // and to the right of a name set on the left. The four activities keep the same order in every arc.
  const ARCS = { below: [-157.5, -112.5, -67.5, -22.5], above: [157.5, 112.5, 67.5, 22.5], left: [-67.5, -22.5, 22.5, 67.5], right: [-112.5, -157.5, 157.5, 112.5] };
  const sideOf = id => { if (id === 'faro') return 'below'; if (id === 'region') return 'above'; const [, dy, an] = MUNI_LABEL[id] || [8, 4, 'start']; return dy > 8 ? 'below' : dy < -4 ? 'above' : an === 'end' ? 'left' : 'right'; };
  const GLYPH = {
    'inc-acc': '<rect x="-8.5" y="-8.5" width="17" height="17" rx="3" transform="rotate(45)" class="bg"/>',
    'challenge-connect': '<rect x="-9" y="-9" width="18" height="18" rx="2.5" class="bg"/>',
    vibathon: '<path d="M0,-12L11,8H-11Z" class="bg" stroke-linejoin="round"/>',
    talent: '<path d="M0,-11L9.5,-5.5V5.5L0,11L-9.5,5.5V-5.5Z" class="bg" stroke-linejoin="round"/>',
  };
  const badgeLayer = act => [...spots].map(id => {
    const n = badgeN(id, act); if (!n) return '';
    const R = id === 'region' ? 12 : Math.max(9, rOf(T[id].events.length)); const dist = Math.max(R + 10, 25); const a = ARCS[sideOf(id)][ACTS.indexOf(act)] * Math.PI / 180;
    const ox = (Math.cos(a) * dist).toFixed(1), oy = (Math.sin(a) * dist).toFixed(1);
    return `<a href="#town-${id}" class="mk-link bd-link" data-card="town-${id}" data-sec="${act}" aria-label="${esc(nameOf(id))}: ${esc(ACT[act].short)}, ${num(n)} ${n === 1 ? 'record' : 'records'}">${mk(`mk-bd bd-${ACT[act].cls}`, posOf(id),
      `<g transform="translate(${ox} ${oy})"><circle r="13" class="hit"/>${GLYPH[act]}<text class="bd-n" y="${act === 'vibathon' ? 5.5 : 3.8}" text-anchor="middle">${n > 99 ? '99+' : n}</text></g>`)}</a>`;
  }).join('');

  const svg = `<svg class="atl-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Map of the Algarve: the AE Innovation Hub's places, events and activities" tabindex="0">
<defs>
  <linearGradient id="sea" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#cfe2e1"/><stop offset=".55" stop-color="#b6d3d6"/><stop offset="1" stop-color="#9fc2c9"/></linearGradient>
  <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#16323a" stop-opacity="0"/><stop offset="1" stop-color="#16323a" stop-opacity=".22"/></radialGradient>
  <clipPath id="landclip"><path d="${landPt}"/><path d="${landEs}"/></clipPath>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0V7" stroke="#8a7a62" stroke-width=".8" stroke-opacity=".28"/></pattern>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect x="-2000" y="-2000" width="${MAP.w + 4000}" height="${MAP.h + 4000}" fill="url(#sea)"/>
<g class="grat">${grat.join('')}</g>
<g class="ripples" fill="none"><path d="${coastD}" stroke-width="44" stroke-opacity=".10"/><path d="${coastD}" stroke-width="26" stroke-opacity=".14"/><path d="${coastD}" stroke-width="13" stroke-opacity=".22"/><path d="${coastD}" stroke-width="5" stroke-opacity=".35"/></g>
<path d="${landPt}" class="land-shadow" filter="url(#soft)" transform="translate(3 6)"/>
<path d="${landPt}" class="land"/><path d="${landEs}" class="land"/>
<image href="/v3/atlas/relief.webp" x="-80" y="-360" width="1760" height="1120" clip-path="url(#landclip)" preserveAspectRatio="none"/>
<path d="${landEs}" class="spain"/><path d="${landEs}" fill="url(#hatch)"/>
<path d="${pathOf(O.border, { closed: false, smooth: 0.3 })}" class="border"/>
<path d="${coastD}" class="coast"/>
<g class="grat-l">${gratLabels.join('')}</g>
<text class="sea-l" x="${proj([-8.12, 36.9])[0]}" y="${proj([0, 36.9])[1]}" text-anchor="middle">Atlantic Ocean</text>
<text class="spain-l" transform="translate(${proj([-7.405, 37.43]).join(' ')}) rotate(-78)" text-anchor="middle">Spain</text>
<text class="region-l" x="${proj([-8.12, 37.47])[0]}" y="${proj([0, 37.47])[1]}" text-anchor="middle">Algarve</text>
<g class="layer layer-talent" data-layer="talent"><g class="net-lines" fill="none">${netLines}</g></g>
<g class="layer layer-events" data-layer="events">${arcs}${evMarks}</g>
<g class="base">${regionMark}${baseMarks}</g>
${ACTS.map(a => `<g class="layer layer-${a}" data-layer="${a}">${badgeLayer(a)}</g>`).join('\n')}
<g class="labels" aria-hidden="true">${labelMarks.join('')}</g>
<rect x="-2000" y="-2000" width="${MAP.w + 4000}" height="${MAP.h + 4000}" fill="url(#vig)" pointer-events="none" class="vig"/>
</svg>`;

  // ---- records as list items ----
  const evItem = (e, withTown) => `<li class="evi${e.up ? ' up' : ''}"><time datetime="${e.start}">${esc(range(e))}</time> <a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a> <span class="kd kd-${e.kind}">${esc(KIND_LABEL[e.kind] || 'Event')}</span>${withTown ? ` <span class="where">${esc(e.at === 'online' ? 'Online' : e.at === 'beyond' ? (e.place ? e.place.split(',').slice(-2).join(',').trim() : 'No place given') : nameOf(e.at))}</span>` : ''}${e.up ? ` <a class="reg" href="${esc(e.register || `${e.url}/register`)}" rel="noopener">Register<span class="vh">: ${esc(e.name)}</span></a>` : ''}</li>`;
  const evList = (list, withTown) => `<ul class="evl">${list.map(e => evItem(e, withTown)).join('')}</ul>`;
  const progItem = g => `<li><strong>${esc(g.name)}</strong>${g.summary ? `<span>${esc(g.summary)}</span>` : ''}${arr(g.facts).length ? `<ul class="facts">${g.facts.map(f => `<li>${esc(f.text)}</li>`).join('')}</ul>` : ''}${g.note && !/src\//.test(g.note) ? `<span class="note-s">${esc(g.note)}</span>` : ''}${g.page ? `<a class="pg" href="${esc(g.page)}" rel="noopener">Their page on their Odoo</a>` : ''}${cite(g.sources)}</li>`;
  const pageItem = p => `<li><a href="${esc(p.url)}" rel="noopener">${esc(p.title)}</a> <span class="where">their page</span></li>`;
  const pageList = list => list.length ? `<p class="lead">Their pages on their Odoo</p><ul class="mini pages">${list.map(pageItem).join('')}</ul>` : '';
  const chalItem = c => `<li><strong>${c.url ? `<a href="${esc(c.url)}" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}</strong>${c.date ? `<span><time datetime="${esc(c.date)}">${esc(d(c.date))}</time>, ${c.kind === 'news' ? 'on their Odoo blog' : 'their page'}</span>` : ''}${c.text ? `<span>${esc(c.text)}</span>` : ''}${cite(c.sources)}</li>`;
  const vibItem = v => `<li><strong>${esc(v.name)}</strong><span>${v.date ? `${esc(d(String(v.date)))}` : ''}${v.place ? `, ${esc(v.place)}` : ''}</span>${arr(v.facts).length ? `<ul class="facts">${v.facts.map(f => `<li>${esc(f.text)}</li>`).join('')}</ul>` : ''}${v.event ? `<a class="pg" href="${esc(v.event.url)}" rel="noopener">Its event page on their Odoo</a>` : ''}${cite(v.sources)}</li>`;
  const commItem = (c, where) => `<li><strong>${c.url ? `<a href="${esc(c.url)}" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}</strong> <span class="kd">${esc(c.kind || 'community')}</span>${c.adi ? ' <span class="kd kd-adi">ADI network</span>' : c.adi === false ? ' <span class="kd">research</span>' : ''}${where ? ` <span class="where">${esc(c.unplaced ? 'place not stated' : nameOf(c.at))}</span>` : ''}${c.members ? ` <span class="mem">${num(c.members)} members (as stated)</span>` : ''}${c.summary ? `<span>${esc(c.summary)}</span>` : ''}${cite(c.source)}</li>`;
  const orgGroups = list => { const g = {}; for (const o of list) (g[o.kind] = g[o.kind] || []).push(o);
    return Object.keys(ORG_KIND).filter(k => g[k]).map(k => `<details class="og"><summary>${esc(ORG_KIND[k])} <span>${num(g[k].length)}</span></summary><ul class="orgs">${g[k].map(o => `<li><a href="${esc(o.url || o.source)}" rel="noopener">${esc(o.name)}</a>${o.what ? `<span>${esc(o.what)}</span>` : ''}${o.source && o.source !== o.url ? cite(o.source) : ''}</li>`).join('')}</ul></details>`).join(''); };
  const gapLine = acts => `<p class="gapline"><a href="#gaps" data-card="gaps">Not public yet: ${esc(acts)}. Your Odoo would fill this →</a></p>`;

  // ---- a card per place: its real records, with sources ----
  const ll = m => `${m.ll[1].toFixed(2)}° N, ${Math.abs(m.ll[0]).toFixed(2)}° W`;
  const townCard = id => {
    const x = T[id]; const m = muniById.get(id);
    const evs = id === 'beyond' ? outEvents : x.events; const up = evs.filter(e => e.up), past = evs.filter(e => !e.up).reverse();
    const sec = (act, title, body) => body ? `<section class="sec sec-${act}" data-sec="${act}"><h4><span class="sw sw-${act === 'events' ? 'ev' : ACT[act]?.cls || 'gap'}" aria-hidden="true"></span>${esc(title)}</h4>${body}</section>` : '';
    const kicker = id === 'faro' ? `Algarve Evolution's base · ${ll(m)}` : m ? `Municipality · ${ll(m)}` : id === 'region' ? 'The whole Algarve, or place not stated' : 'Outside the Algarve';
    const intro = id === 'faro' ? '<p>Algarve Evolution is based at the UAlg TEC Campus, Campus da Penha, Faro, where many of the events on their Odoo take place.</p>'
      : id === 'region' ? '<p>Records that cover the whole Algarve, and records whose source does not say where they are.</p>'
      : id === 'beyond' ? '<p>Events on their Odoo held outside the Algarve, online, or with no place given.</p>' : '';
    const nProg = x.progs.length + x.vibProgs.length + x.talProgs.length + x.other.length, nVib = x.vib.length + x.vibEv.length;
    const counts = [evs.length && plural(evs.length, 'event'), nProg && plural(nProg, 'programme'), x.chal.length && plural(x.chal.length, 'call'),
      nVib && plural(nVib, 'hackathon or workshop', 'hackathons and workshops'), x.comms.length && plural(x.comms.length, 'community', 'communities'), x.orgs.length && plural(x.orgs.length, 'organisation')].filter(Boolean);
    const evBody = evs.length ? `${up.length ? `<p class="lead">${plural(up.length, 'upcoming event')}</p>${evList(up, id === 'beyond')}` : ''}${past.length ? `<details class="past"${up.length ? '' : ' open'}><summary>${plural(past.length, 'past event')}</summary>${evList(past, id === 'beyond')}</details>` : ''}${odooSrc}` : '';
    const missing = ['startups and KPIs', 'challenges', (x.vib.length || x.vibEv.length) && 'projects and juries', 'people'].filter(Boolean);
    const placedC = x.comms.filter(c => !c.unplaced), unplacedC = x.comms.filter(c => c.unplaced);
    return `<article class="card town-card" id="town-${id}"><p class="card-k">${esc(kicker)}</p><h3>${esc(nameOf(id))}</h3>${intro}${counts.length ? `<p class="counts">${counts.map(c => `<span>${esc(c)}</span>`).join('')}</p>` : '<p class="muted">Nothing published for this place yet.</p>'}
${sec('events', 'Events on their Odoo', evBody)}
${sec('inc-acc', `${actName('inc-acc')}: programmes`, (x.progs.length || x.pagesInc.length) ? `${x.progs.length ? `<ul class="plist">${x.progs.map(progItem).join('')}</ul>` : ''}${pageList(x.pagesInc)}` : '')}
${sec('challenge-connect', 'Challenge Connect: calls in public', x.chal.length ? `<ul class="plist">${x.chal.map(chalItem).join('')}</ul>` : '')}
${sec('vibathon', 'Vibathon: hackathons and workshops', (x.vib.length || x.vibEv.length || x.vibProgs.length || x.pagesVib.length) ? `${x.vib.length ? `<ul class="plist">${x.vib.map(vibItem).join('')}</ul>` : ''}${x.vibProgs.length ? `<ul class="plist">${x.vibProgs.map(progItem).join('')}</ul>` : ''}${x.vibEv.length ? `<p class="lead">${plural(x.vibEv.length, 'hackathon or workshop', 'hackathons and workshops')} on their Odoo</p>${evList([...x.vibEv].reverse(), false)}${odooSrc}` : ''}${pageList(x.pagesVib)}` : '')}
${sec('talent', 'Talent: communities and organisations', badgeN(id, 'talent') ? `${x.talProgs.length ? `<ul class="plist">${x.talProgs.map(progItem).join('')}</ul>` : ''}${placedC.length ? `<p class="lead">${plural(placedC.length, 'community', 'communities')}</p><ul class="plist comms">${placedC.map(c => commItem(c)).join('')}</ul>` : ''}${unplacedC.length ? `<p class="lead">${plural(unplacedC.length, 'community', 'communities')} whose place the source does not state</p><ul class="plist comms">${unplacedC.map(c => commItem(c)).join('')}</ul>` : ''}${x.orgs.length ? `<p class="lead">${plural(x.orgs.length, 'organisation')} (organisations only, no people)</p>${orgGroups(x.orgs)}` : ''}${pageList(x.pagesTal)}` : '')}
${sec('other', 'Other programmes', x.other.length ? `<ul class="plist">${x.other.map(progItem).join('')}</ul>` : '')}
${id !== 'beyond' ? gapLine(missing.join(', ')) : ''}</article>`;
  };

  // ---- the four activities (story, and the panel's layer cards) ----
  const gapItems = list => `<ul class="gapl">${list.map(g => `<li><p><strong>${esc(g.what)}</strong></p>${g.known ? `<p class="known">${esc(g.known)}</p>` : ''}${arr(g.odoo).length ? `<p class="gap-m">${g.odoo.map(o => `<code>${esc(o)}</code>`).join(' ')}</p>` : ''}${g.odoo_note ? `<p class="known">${esc(g.odoo_note)}</p>` : ''}</li>`).join('')}</ul>`;
  const actBody = a => {
    const gs = M.gaps.filter(g => g.activity === a.id);
    const spotsWith = spots.filter(id => badgeN(id, a.id) > 0).sort((p, q) => badgeN(q, a.id) - badgeN(p, a.id));
    let exists = '';
    if (a.id === 'inc-acc') { const list = progsOf('inc-acc'); exists = `<p class="lead">${plural(list.length, 'programme')} in public sources</p><ul class="plist">${list.map(progItem).join('')}</ul>${pageList(pagesOf('inc-acc'))}`; }
    if (a.id === 'challenge-connect') exists = `<p class="lead">No challenge, supplier or match is published anywhere yet.</p>${M.challengeItems.length ? `<p>The nearest public records: ${plural(M.challengeItems.length, 'call')} for ideas, projects and companies on their Odoo blog (our reading of the titles).</p><ul class="plist">${M.challengeItems.map(chalItem).join('')}</ul>` : ''}`;
    if (a.id === 'vibathon') { const upV = M.vibEvents.filter(e => e.up); exists = `${M.vibathons.length ? `<ul class="plist">${M.vibathons.map(vibItem).join('')}</ul>` : ''}${progsOf('vibathon').length ? `<ul class="plist">${progsOf('vibathon').map(progItem).join('')}</ul>` : ''}<p class="lead">${plural(M.vibEvents.length, 'other hackathon or workshop', 'other hackathons and workshops')} on their Odoo, ${num(upV.length)} upcoming</p>${upV.length ? evList(upV, true) : ''}${odooSrc}`; }
    if (a.id === 'talent') { const adiC = M.comms.filter(c => c.adi), resC = M.comms.filter(c => !c.adi);
      exists = `<p class="lead">${M.adi ? `${esc(M.adi.communities)} communities in the ADI network, from their own page, which states ${esc(M.adi.members)} members in total (their figure).` : `${plural(adiC.length, 'community', 'communities')} in the ADI network.`}</p>${M.adi ? cite(M.adi.source) : ''}<ul class="plist comms">${adiC.map(c => commItem(c, true)).join('')}</ul>${resC.length ? `<p class="lead">${plural(resC.length, 'more community', 'more communities')} from public research, not on their list</p><ul class="plist comms">${resC.map(c => commItem(c, true)).join('')}</ul>` : ''}<p class="lead">${plural(M.orgs.length, 'public organisation')} by town (organisations only, no people), and the programmes</p><ul class="plist">${progsOf('talent').map(progItem).join('')}</ul>`; }
    const where = spotsWith.length ? `<p class="card-sub">On the map</p><ul class="mini">${spotsWith.map(id => `<li><a href="#town-${id}" data-card="town-${id}" data-sec="${a.id}"><span>${esc(nameOf(id))}</span> <b>${num(badgeN(id, a.id))}</b></a></li>`).join('')}</ul>` : '';
    const gapBox = gs.length ? `<div class="gap"><p class="gap-k">Your Odoo would fill this</p>${gapItems(gs)}<a class="gap-go" href="${esc(gs[0].v2 || a.v2)}">See what it could look like: V2, simulated →</a></div>` : '';
    const gapShort = gs.length ? `<div class="gap"><p class="gap-k">Your Odoo would fill this</p><ul class="gapl short">${gs.map(g => `<li>${esc(g.what)}</li>`).join('')}</ul><a class="gap-go" href="${esc(gs[0].v2 || a.v2)}">V2: what it could look like →</a></div>` : '';
    return { exists, where, gapBox, gapShort };
  };
  const actCard = a => { const b = actBody(a); return `<article class="card act-card act-${a.cls}" id="act-${a.id}"><p class="card-k"><span class="sw sw-${a.cls}" aria-hidden="true"></span>Layer · ${esc(a.short)}</p><h3>${esc(a.name)}</h3><p class="kw"><span lang="pt">${esc(a.keywords)}</span>${a.keywordsEn ? ` <span class="kw-en">(${esc(a.keywordsEn)})</span>` : ''}</p><p>${esc(a.summary)}</p>${b.exists}${b.where}${b.gapBox}</article>`; };
  const gapGroups = [...ACTS, null].map(act => [act, M.gaps.filter(g => (g.activity || null) === act)]).filter(([, l]) => l.length);
  const gapsCard = `<article class="card gaps-card" id="gaps"><p class="card-k">The gaps</p><h3>What your Odoo would fill</h3><p>These records do not exist in any public source yet. The hub's Odoo addon has a place for each; V2 shows what they could look like, with simulated data. This is the first piece of work: getting more data into Odoo.</p><ol class="gaps">${gapGroups.map(([act, l]) => `<li><p class="gap-k"><span class="sw sw-${act ? ACT[act].cls : 'gap'}" aria-hidden="true"></span>${esc(act ? actName(act) : 'The hub as a whole')}</p>${gapItems(l)}<a class="gap-go" href="${esc(l[0].v2 || '/')}">V2: what it could look like →</a></li>`).join('')}</ol></article>`;

  // ---- timeline and month cards ----
  const tlCard = e => `<article class="card tl-card${e.future ? ' is-future' : ''}" id="tl-${e.key.replace('.', '-')}" data-t="${e.t}"><p class="card-k"><time>${esc(e.when)}</time>${e.future ? ' · <span class="tag">Planned</span>' : ''}${(TL_PLACES[e.key] || []).length ? ` · ${esc(TL_PLACES[e.key].map(id => id === 'beyond' ? 'Lisbon' : nameOf(id)).join(', '))}` : ''}</p><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${e.stat ? `<p class="stat">${esc(e.stat)} (their own figure)</p>` : ''}${cite(e.src)}</article>`;
  const moCard = k => { const evs = M.events.filter(e => monthKey(e.start) === k); const up = evs.filter(e => e.up).length;
    return `<article class="card mo-card" id="mo-${k}" data-t="${monthT(k)}"><p class="card-k">${esc(plural(evs.length, 'event'))} on their Odoo${up ? ` · ${num(up)} upcoming` : ''}</p><h3>${esc(monthName(k))}</h3>${evList(evs, true)}${odooSrc}</article>`; };

  // ---- the scrubber ----
  const yearLabels = [[2018, '2018'], [2020, '2020'], [2022, '2022'], [2024, '2024'], [2025.5, 'Jul 2025'], [2026, '2026'], [2026.5, 'Jul 2026'], [2027, '2027']]
    .map(([y, l], i) => `<span class="yr${i % 2 ? ' yr-minor' : ''}" style="left:${pc(y)}%">${l}</span>`).join('');
  const maxN = Math.max(1, ...stops.filter(s => s.kind === 'mo').map(s => s.n));
  const bars = stops.filter(s => s.kind === 'mo').map(s => { const k = s.id.slice(3); const [y, m] = k.split('-').map(Number); const a = +pc(y + (m - 1) / 12), b = +pc(y + m / 12);
    return `<button type="button" class="bar${s.future ? ' fut' : ''}" style="left:${a}%;width:calc(${(b - a).toFixed(2)}% - 2px);height:${(4 + 18 * s.n / maxN).toFixed(1)}px" data-stop="${s.id}" data-t="${s.t}" tabindex="-1" aria-hidden="true" title="${esc(s.label)}"></button>`; }).join('');
  const pips = stops.filter(s => s.kind === 'tl').map(s => `<button type="button" class="pip${s.future ? ' fut' : ''}" style="left:${pc(s.t)}%" data-stop="${s.id}" data-t="${s.t}" tabindex="-1" aria-hidden="true" title="${esc(s.label)}"></button>`).join('');
  const stopsJson = JSON.stringify(stops.map(s => ({ id: s.id, t: s.t, label: s.label, year: s.year, towns: s.towns, kind: s.kind }))).replace(/</g, '\\u003c');

  // ---- the welcome card and legend ----
  const evN = M.events.length, upN = M.events.filter(e => e.up).length;
  const first = M.events[0]?.start, last = M.events[M.events.length - 1]?.start;
  const lg = (icon, text) => `<li><svg viewBox="-13 -13 26 26" aria-hidden="true">${icon}</svg>${text}</li>`;
  const welcome = `<div class="card welcome" id="welcome"><p class="card-k">AE Innovation Hub · The Atlas</p><h3>The hub, where it happens</h3>
<p>Every marker is a place with real, published records: ${plural(evN, 'event')} on Algarve Evolution's Odoo (${first ? esc(d(first)) : ''} to ${last ? esc(d(last)) : ''}, ${num(upN)} upcoming), the programmes, the calls, the communities and the organisations, each with its source.</p>
<p>Choose a place, switch on an activity, or play the timeline from 2018.</p>
<ul class="legend">
${lg('<circle r="10" fill="#fffaf0" stroke="#a8431c" stroke-width="2.2"/><path fill="#a8431c" d="M0,-6.5L1.8,-1.8L6.5,0L1.8,1.8L0,6.5L-1.8,1.8L-6.5,0L-1.8,-1.8Z"/>', 'Algarve Evolution\'s base, Faro')}
${lg('<circle r="4" fill="#fffaf0" stroke="#2c3a3e" stroke-width="1.6"/>', 'Municipality (16)')}
${lg('<circle r="11" fill="none" stroke="#a8431c" stroke-width="1.6" stroke-dasharray="3 2.5"/><circle r="7" fill="rgba(208,96,42,.32)" stroke="#a8431c" stroke-width="1.6"/>', 'Events: past (solid) and upcoming (dashed); size shows how many')}
${lg(`<g transform="scale(.85)">${GLYPH['inc-acc']}</g>`.replace('class="bg"', 'class="bg" fill="#fffaf0" stroke="#6a467c" stroke-width="2"'), 'INC/ACC: programmes')}
${lg(`<g transform="scale(.85)">${GLYPH['challenge-connect']}</g>`.replace('class="bg"', 'class="bg" fill="#fffaf0" stroke="#2b4c8c" stroke-width="2"'), 'Challenge Connect: calls in public')}
${lg(`<g transform="scale(.85)">${GLYPH.vibathon}</g>`.replace('class="bg"', 'class="bg" fill="#fffaf0" stroke="#8a5a00" stroke-width="2"'), 'Vibathon: hackathons and workshops')}
${lg(`<g transform="scale(.85)">${GLYPH.talent}</g>`.replace('class="bg"', 'class="bg" fill="#fffaf0" stroke="#1d6a74" stroke-width="2"'), 'Talent: communities and organisations')}
${lg('<circle r="10" fill="rgba(251,248,241,.6)" stroke="#5f6c6e" stroke-width="1.5" stroke-dasharray="3 3"/>', 'Across the region')}
</ul>
<p><a href="#gaps" data-card="gaps" class="gap-open">What your Odoo would fill →</a></p>
<p class="muted js-only">Drag to move, pinch or Ctrl + scroll to zoom.</p></div>`;

  // ---- the essentials below the map ----
  const S = (id, title, inner, cls = '') => `<section class="st ${cls}" id="${id}" aria-labelledby="h-${id}"><div class="st-in">${title ? `<h2 id="h-${id}">${title}</h2>` : ''}${inner}</div></section>`;
  const goals = M.goals.map(g => `<li><strong>${esc(g.value)}</strong><span>${esc(g.label)}</span></li>`).join('');
  const actCols = M.acts.map(a => { const b = actBody(a); const n = spots.reduce((s, id) => s + badgeN(id, a.id), 0);
    return `<section class="actc act-${a.cls}" aria-labelledby="ac-${a.id}"><p class="actc-k"><span class="sw sw-${a.cls}" aria-hidden="true"></span>${esc(a.short)}</p><h3 id="ac-${a.id}">${esc(a.name)}</h3><p class="kw"><span lang="pt">${esc(a.keywords)}</span>${a.keywordsEn ? ` <span class="kw-en">(${esc(a.keywordsEn)})</span>` : ''}</p><p>${esc(a.summary)}</p>
<p class="actc-n"><strong>${num(n)}</strong> real ${n === 1 ? 'record' : 'records'} on the map <button type="button" class="linkish" data-show-layer="${a.id}">Show the layer</button></p>${b.gapShort}</section>`; }).join('');
  const upcoming = M.events.filter(e => e.up);
  const monthsDesc = [...months].reverse();
  const sources = () => [...used.values()].sort((a, b) => (a.publisher || '').localeCompare(b.publisher || '') || (a.title || '').localeCompare(b.title || ''));
  const feedNote = M.meta.live ? `From the real feed (src/feeds/real.json${M.meta.built ? `, built ${esc(d(String(M.meta.built)))}` : ''}).` : 'From the records the real feed is built from: their Odoo, read with no credentials, and public sources.';

  const story = `
<main id="story" class="story">
  <section class="st st-intro" aria-labelledby="h-intro"><div class="st-in">
    <p class="kicker">AE Innovation Hub · real data only</p>
    <h2 id="h-intro">Four activities on one Odoo, placed on the map</h2>
    <p class="lede">${esc(M.lede)}</p>
    <p>${esc(M.mission)}</p>${cite(M.ledeSources)}
    <p>The hub António Guerreiro drew on the whiteboard has four activities, INC/ACC, Challenge Connect, Vibathon and the Talent Ecosystem, with Odoo under all of them. This map shows only what is published today, each record with its source. Where nothing is published yet, it says so and shows what your Odoo would fill.</p>
  </div></section>

  <section class="st st-goals" id="goals" aria-labelledby="h-goals"><div class="st-in">
    <h2 id="h-goals">The goals for 2032</h2>
    <ol class="goals">${goals}</ol>
    <p class="note">${esc(M.goalsNote)}</p>${cite(M.goalsSources)}
    <figure class="quote"><blockquote><p>${esc(M.quote.text)}</p></blockquote><figcaption><strong>${esc(M.quote.by)}</strong>, ${esc(M.quote.role)}, Algarve Evolution · <time datetime="${esc(M.quote.date)}">${esc(d(M.quote.date))}</time>${cite(M.quote.sources)}</figcaption></figure>
  </div></section>

  ${S('activities', 'The four activities', `<p class="intro">António's whiteboard words in Portuguese under each name. The counts are records on this map; the boxes say what is not public yet.</p><div class="acts">${actCols}</div><div class="gaps-wrap">${gapsCard}</div><div hidden>${M.acts.map(actCard).join('')}</div>`, 'st-acts')}

  ${S('events', 'Events on their Odoo', `<p class="intro">${plural(evN, 'event')} from Algarve Evolution's Odoo, the source of truth for events. Each links to its page there; register there. ${num(upN)} upcoming from ${esc(d(M.meta.today))}.</p>${odooSrc}
    ${upcoming.length ? `<h3 class="sub">Upcoming</h3>${evList(upcoming, true)}` : ''}
    <h3 class="sub">Month by month</h3><div class="months">${monthsDesc.map(k => `<details class="mo"${k >= monthKey(M.meta.today) ? ' open' : ''}><summary>${esc(monthName(k))} <span>${num(M.events.filter(e => monthKey(e.start) === k).length)}</span></summary>${moCard(k)}</details>`).join('')}</div>`, 'st-events')}

  ${S('places', 'Places', `<p class="intro">The 16 municipalities, the whole region and beyond: each place's records, as the map's panel shows them.</p><div class="gaz">${[...munis.filter(m => T[m.id].events.length || badgeN(m.id, 'talent') || badgeN(m.id, 'inc-acc') || badgeN(m.id, 'challenge-connect') || badgeN(m.id, 'vibathon')).sort((a, b) => T[b.id].events.length - T[a.id].events.length || a.name.localeCompare(b.name)).map(m => m.id), 'region', 'beyond'].map(id => `<details class="gz"><summary><span>${esc(nameOf(id))}</span> <small>${esc([(id === 'beyond' ? outEvents : T[id].events).length && plural((id === 'beyond' ? outEvents : T[id].events).length, 'event'), id !== 'beyond' && badgeN(id, 'talent') && `${num(badgeN(id, 'talent'))} in Talent`].filter(Boolean).join(' · '))}</small></summary>${townCard(id)}</details>`).join('')}</div>
    <div hidden>${munis.filter(m => !(T[m.id].events.length || badgeN(m.id, 'talent') || badgeN(m.id, 'inc-acc') || badgeN(m.id, 'challenge-connect') || badgeN(m.id, 'vibathon'))).map(m => townCard(m.id)).join('')}</div>`, 'st-places')}

  ${S('timeline', 'The timeline', `<p class="intro">From a small group of local entrepreneurs in 2018 to the hub. The scrubber on the map plays these entries and the months of events.</p><div class="chron">${M.timeline.map(tlCard).join('')}</div>`, 'st-chron')}

  <section class="st st-sources" id="sources" aria-labelledby="h-sources"><div class="st-in">
    <h2 id="h-sources">Sources</h2><p class="intro">Every record on this page links to one of these. ${feedNote}</p>
    <ol>${'<!--SOURCES-->'}</ol>
  </div></section>
  <p class="back"><a href="#map">↑ Back to the map</a></p>
</main>`;

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>The Atlas: the AE Innovation Hub, mapped | V3</title>
<meta name="description" content="The AE Innovation Hub on a map of the Algarve: events from Algarve Evolution's Odoo by town, the four activities, and what is not public yet. Real data only.">
<meta name="theme-color" content="#f3eee2">
${chrome.head}
<link rel="preload" href="/v3/atlas/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/v3/atlas/atlas.css">
</head>
<body class="atl">
${chrome.banner}
<a class="skip" href="#story">Skip the map, read the essentials</a>
<nav class="atl-nav" aria-label="The Atlas">
  <a class="atl-brand" href="#map"><svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0,-11L2.6,-2.6L11,0L2.6,2.6L0,11L-2.6,2.6L-11,0L-2.6,-2.6Z"/></svg>AE Innovation Hub <span>The Atlas</span></a>
  <div class="atl-nav-sec">${[['goals', 'Goals'], ['activities', 'Activities'], ['events', 'Events'], ['places', 'Places'], ['timeline', 'Timeline'], ['sources', 'Sources']].map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</div>
</nav>
<section class="atl-map show-events" id="map" aria-labelledby="atl-title" data-t0="${T0}" data-t1="${T1}" data-split="${SPLIT.join(',')}" data-today="${todayT.toFixed(3)}" data-ctrl-hint="Ctrl + scroll to zoom">
  <div class="atl-stage">${svg}</div>
  <header class="atl-head">
    <p class="kicker">AE Innovation Hub · The Atlas</p>
    <h1 id="atl-title">The Algarve, mapped</h1>
    <p class="atl-sub">The hub's four activities and their events, real records only</p>
  </header>
  <div class="atl-tools">
    <div class="atl-layers" role="group" aria-label="Layers">
      <button type="button" class="chip" data-layer-btn="events" aria-pressed="true"><span class="sw sw-ev"></span>Events</button>
      ${M.acts.map(a => `<button type="button" class="chip" data-layer-btn="${a.id}" aria-pressed="false"><span class="sw sw-${a.cls}"></span>${esc(a.short)}</button>`).join('')}
      <button type="button" class="chip chip-gap" data-card-btn="gaps"><span class="sw sw-gap"></span>What your Odoo would fill</button>
    </div>
  </div>
  <div class="atl-zoom" role="group" aria-label="Zoom">
    <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in">+</button>
    <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out">−</button>
    <button type="button" data-zoom="reset" aria-label="Show the whole region" title="Show the whole region"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
  </div>
  <svg class="atl-rose" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="34" fill="rgba(251,248,241,.7)" stroke="#5f6c6e" stroke-width=".8"/><circle r="28" fill="none" stroke="#5f6c6e" stroke-width=".5" stroke-dasharray="1.5 2.5"/>
    <path d="M0,-44L6,-6L0,0Z" fill="#1c2a2f"/><path d="M0,-44L-6,-6L0,0Z" fill="#a8431c"/><path d="M0,44L6,6L0,0Z" fill="#a8431c"/><path d="M0,44L-6,6L0,0Z" fill="#1c2a2f"/>
    <path d="M44,0L6,-6L0,0Z" fill="#a8431c"/><path d="M44,0L6,6L0,0Z" fill="#1c2a2f"/><path d="M-44,0L-6,6L0,0Z" fill="#a8431c"/><path d="M-44,0L-6,-6L0,0Z" fill="#1c2a2f"/>
    <text y="-46" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-weight="700" font-size="14" fill="#1c2a2f">N</text></svg>
  <div class="atl-scale" aria-hidden="true"><span class="bar"></span><span class="txt">10 km · Approximate positions</span></div>
  <aside class="atl-panel" aria-label="Detail" tabindex="-1">
    <button type="button" class="atl-close" aria-label="Close">×</button>
    <div class="atl-grab" aria-hidden="true"></div>
    <div class="atl-panel-body" aria-live="polite">${welcome}</div>
  </aside>
  <div class="atl-scrub">
    <button type="button" class="sc-play" aria-label="Play the timeline" data-play="Play the timeline" data-pause="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5l11 7-11 7z"/><path class="i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>
    <button type="button" class="sc-step" data-step="-1" aria-label="Previous">‹</button>
    <div class="sc-track-wrap">
      <div class="sc-now"><span class="sc-year">2018 → 2027</span><span class="sc-title">Play the timeline</span></div>
      <div class="sc-bars">${bars}</div>
      <div class="sc-track"><div class="sc-fill"></div><span class="sc-split" style="left:${(SPLIT[1] * 100).toFixed(2)}%" title="Months from here"></span><span class="sc-today" style="left:${pc(todayT)}%"><span>Today</span></span>${yearLabels}${pips}
        <input type="range" class="sc-range" min="0" max="1000" step="1" value="1000" aria-label="Date on the timeline"></div>
    </div>
    <button type="button" class="sc-step" data-step="1" aria-label="Next">›</button>
  </div>
  <script type="application/json" id="atl-stops">${stopsJson}</script>
</section>
${story}
<footer class="foot"><div class="st-in">
  <p>${esc(data.voice.banner.en)}</p>
  <p>V3 shows only real, published records, each with its source. <a href="/">V2</a> shows what the hub could be, with simulated records.</p>
  <p class="muted">Map drawn from Natural Earth (public domain) via the outline in the site's data; town positions are approximate; relief is drawn for effect, not survey data. Typeface: Cormorant Garamond (SIL OFL 1.1). Built from V1's Atlas. Version ${esc(chrome.version)}.</p>
</div></footer>
<script src="/v3/atlas/atlas.js" defer></script>
${chrome.foot}
</body>
</html>`;
  return html.replace('<!--SOURCES-->', sources().map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.publisher || s.url)}</a>${s.title && s.title !== s.url ? `, ${esc(s.title)}` : ''}${s.read ? ` <span class="muted">(read ${esc(d(s.read))})</span>` : ''}</li>`).join(''));
}
