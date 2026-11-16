#!/usr/bin/env node
// Build src/feeds/real.json, the V3 real feed (contract: docs/v3/REAL-FEED.md), from real, published sources only.
// A dev-time script, not a page: it exports no `meta`, so scripts/build.mjs does not render it.
// Dinis Cruz, 16 November 2026: "do you think we can make multiple versions of the site ONLY using real data?"
// and "yes please build V3 using those 4 designs (and yes keep v2)".
//
// Usage (from the repository root, Node 22, no dependencies):
//   node scripts/odoo/sync-public.mjs           refresh src/data/odoo.json from their public Odoo first
//   node scripts/v3/build-real-feed.mjs         read their public Odoo pages (polite) and write the feed
//   node scripts/v3/build-real-feed.mjs --offline   reuse the pages already in src/feeds/real.json
//   node scripts/v3/build-real-feed.mjs --check     check the feed and exit 1 on any problem
//
// Inputs, all real and each carrying its source:
//   src/data/odoo.json   events and news from Algarve Evolution's own Odoo (www.algarveevolution.pt)
//   their sitemap        the non-event, non-blog pages: title, meta description and h1/h2 headings only, no body copy
//   src/data/*.json      voice, figures, programmes, events, people, ecosystem, places, sources (the facts V1 used)
//   scripts/odoo/seed/real-public.json and v1-source/src/talent-map/data/organisations.json (PrompTugal.news research)
//   the SGit Newsroom article on Vibathon Algarve 2026 (facts as stated there)
// What is never kept: body copy, descriptions of events, e-mail addresses, telephone numbers, contact blocks,
// and any person other than António Guerreiro, executive director (src/data/people.json).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = 'src/feeds/real.json';
const BASE = 'https://www.algarveevolution.pt';
const UA = 'site-sync (read-only; public pages; robots.txt respected)';
const PAUSE = Number(process.env.ODOO_PAUSE_MS || 600);
const args = new Set(process.argv.slice(2));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const J = f => JSON.parse(readFileSync(f, 'utf8'));
const tidy = s => String(s ?? '').replace(/\s*[—–]\s*/g, ' - ').replace(/\s+/g, ' ').trim();
const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const en = v => (v && typeof v === 'object' && !Array.isArray(v) ? (v.en ?? '') : (v ?? ''));

// Personal contact details must never reach the feed.
export const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
// A link is kept only if it is an organisation's or a group's public page: never a person's profile, never a group-chat
// invitation (joining one shows members' telephone numbers).
export const PRIVATE_LINK = /linkedin\.com\/in\/|chat\.whatsapp\.com|wa\.me\/|t\.me\/\+|discord\.gg|mailto:|tel:/i;
const publicLink = u => (u && !PRIVATE_LINK.test(u) ? u : null);
export const PHONE = /(?:\+|\b00)\d{2,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{3}[\s.-]?\d{3,4}\b|\b[29]\d{2}[\s.]\d{3}[\s.]\d{3}\b|\b[29]\d{8}\b/;

// scripts/build.mjs imports every module in scripts/v3 to look for `meta`; nothing here runs unless this file is the
// command being run.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  if (args.has('--check')) { const f = process.argv.slice(2).find(a => a.endsWith('.json')) || OUT; process.exit(check(J(f)) ? 0 : 1); }
  await main();
}

async function main() {

// ---------- inputs ----------
const odoo = J('src/data/odoo.json');
const voice = J('src/data/voice.json');
const figures = J('src/data/figures.json');
const programmesData = J('src/data/programmes.json');
const eventsData = J('src/data/events.json');
const peopleData = J('src/data/people.json');
const eco = J('src/data/ecosystem.json');
const placesData = J('src/data/places.json');
const sourcesData = J('src/data/sources.json');
const seed = J('scripts/odoo/seed/real-public.json');
const orgsData = J('v1-source/src/talent-map/data/organisations.json');
const previous = existsSync(OUT) ? J(OUT) : null;

const srcIndex = new Map(sourcesData.sources.map(s => [s.url, s]));
const readOf = url => srcIndex.get(url)?.read || null;
const ecoUrl = key => eco.sources[key]?.url || null;          // resolve an ecosystem source key to its URL
const ecoLabel = key => eco.sources[key]?.label || null;
const muniName = Object.fromEntries(placesData.municipalities.map(m => [m.id, m.name]));
muniName.algarve = 'Algarve (region)';
const NEWSROOM_VIBATHON = 'https://newsroom.sgit.ai/articles/vibathon-algarve-2026.html';

// ---------- the hub (António's whiteboard, 16 November 2026; our framing, not a published fact) ----------
const hub = {
  name: 'AE Innovation Hub',
  full_name: 'Algarve Evolution Innovation Hub',
  basis: "António Guerreiro's whiteboard, 16 November 2026 (docs/v2/BRIEF.md). The four activities are the hub's plan; the records under them are the real, published data that exists today.",
  activities: [
    { id: 'inc-acc', name: 'INC/ACC', keywords: 'incubação, aceleração, mentores, KPIs', keywords_en: 'incubation, acceleration, mentors, KPIs',
      summary: 'Incubation and acceleration programmes: one mentor per company, guest mentors for clinics and workshops, and KPIs from month 0 to month 6 of each company, made public and reflected on.' },
    { id: 'challenge-connect', name: 'Challenge Connect', keywords: 'desafios, fornecedores, matching', keywords_en: 'challenges, suppliers, matching',
      summary: 'A company presents a challenge; companies and professionals present themselves as suppliers; a match result helps the company choose, or Algarve Evolution suggests the best or a top 3.' },
    { id: 'vibathon', name: 'Vibathon', keywords: 'hackathons, workshops, júris', keywords_en: 'hackathons, workshops, juries',
      summary: 'Hackathons and workshops: participants, mentors and a jury; the projects and what each presented; and a next step after the event.' },
    { id: 'talent', name: 'Talent Ecosystem', keywords: 'talento, competências, parceiros, rede ADI', keywords_en: 'talent, competences, partners, the ADI network',
      summary: 'The Algarve Digital Innovators network: communities and informal groups, professionals, consultants, mentors and investors, project partners and the stakeholders of the regional innovation hub.' },
  ],
  base: 'Odoo infrastructure under all four activities; ideas and needs flow in; spreadsheets feed Odoo and Odoo feeds the official site.',
};

// ---------- the organisation (src/data, each item with its sources) ----------
const person = peopleData.people.find(p => p.id === 'antonio-guerreiro');
const quote = peopleData.quotes.find(q => q.by === 'antonio-guerreiro');
const sourced = (sources) => { const list = (sources || []).filter(Boolean); return { source: list[0] || null, sources: list }; };
const organisation = {
  name: 'Algarve Evolution',
  url: `${BASE}/`,
  tagline: en(voice.tagline),
  lede: en(voice.hero_lede),
  mission: en(voice.mission),
  voice_sources: [...new Set([...(voice.story_sources || []), ...(voice.goals_sources || [])])],
  goals: voice.goals.map(g => ({ value: g.value, label: en(g.label), kind: 'target', ...sourced(voice.goals_sources) })),
  goals_note: en(voice.goals_note),
  executive_director: { name: person.name, role: en(person.role), summary: en(person.summary), ...sourced(person.sources) },
  quote: { text: en(quote.text), by: person.name, about: quote.about, date: quote.date, ...sourced(quote.sources) },
  figures: figures.figures.map(f => ({ id: f.id, value: en(f.value), label: en(f.label), note: en(f.note) || undefined,
    kind: f.id.startsWith('targets') ? 'target' : 'own figure', ...sourced(f.sources) })),
  figures_note: "The organisation's own figures as its sources report them; nobody here has audited them. Targets are targets, not results.",
  timeline: eco.timeline.map(t => ({ when: t.when, t: t.t, title: t.title, text: t.text, stat: t.stat, source: ecoUrl(t.src), source_label: ecoLabel(t.src) })),
  partners: eco.nodes.filter(n => n.kind === 'partner').map(n => ({ id: n.id, name: n.label, kind: 'partner', note: n.note, source: ecoUrl(n.src), source_label: ecoLabel(n.src) })),
  network: {
    nodes: eco.nodes.map(n => ({ id: n.id, name: n.label, kind: n.kind, note: n.note, source: ecoUrl(n.src) })),
    links: eco.links.map(([from, to, rel]) => ({ from, to, rel })),
    from: eco.from,
  },
  events: eventsData.events.map(e => ({ id: e.id, name: en(e.name), start: e.start, end: e.end, approximate: e.approximate || undefined,
    place: en(e.place), summary: en(e.summary), ...sourced(e.sources) })),
};

// ---------- their public Odoo pages (title, meta description, h1/h2 only) ----------
const PAGE_ACTIVITY = {
  '/incubator': 'inc-acc', '/founder2founder': 'inc-acc', '/startups-smbs': 'inc-acc', '/algarveempreende': 'inc-acc',
  '/inovaalgarve': 'inc-acc', '/15-sme-algarvian-tourism-companies': 'inc-acc', '/appointment': 'inc-acc', '/calendar': 'inc-acc',
  '/adi': 'talent', '/adi-ag-presentation': 'talent', '/adi-gallery': 'talent', '/community-member': 'talent',
  '/join-us': 'talent', '/innovation-ecosystem': 'talent', '/forum': 'talent', '/forum/help-1': 'talent', '/forum/help-1/faq': 'talent',
  '/education': 'vibathon', '/events': 'vibathon',
};
// What kind of page it is, so a design can pick the pages that matter and leave the help desk and legal pages out.
const pageGroup = path => /^\/(incubator|founder2founder|startups-smbs|algarveempreende|inovaalgarve|15-sme|education|innovation-ecosystem)/.test(path) ? 'programme'
  : /^\/(adi|community-member|join-us)/.test(path) ? 'community'
  : /^\/hub$/.test(path) ? 'hub'
  : /^\/(events|calendar|appointment)$/.test(path) ? 'events'
  : /^\/(helpdesk|forum|slides)/.test(path) ? 'help'
  : /^\/(privacy|terms)$/.test(path) ? 'legal'
  : /^\/shop/.test(path) ? 'shop'
  : 'organisation';
function decode(s) {
  return String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
const clean = s => tidy(decode(String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+([,.!?:;])/g, '$1'));
// The page as lines of text (only to find the lists and stated numbers below; no body copy is kept).
const lines = html => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?(p|li|div|h\d|section|ul|ol|td|tr)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, ''))
  .replace(/[\u200b-\u200d\ufeff]/g, '').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
// Lists Algarve Evolution publishes as data on its own pages: the communities the ADI network mapped (each card's name
// and the link it gives), the numbers it states beside them, and the titles of the strategic documents on /hub.
function extras(path, html) {
  const x = {};
  if (path === '/algarveempreende') {
    const a = html.search(/List of Mapped Commu/i), b = html.search(/activities and events/i);
    if (a > 0 && b > a) x.mapped_communities = [...html.slice(a, b).matchAll(/<h3[^>]*card-title[^>]*>([\s\S]*?)<\/h3>/gi)]
      .map(m => ({ name: clean(m[1]), url: publicLink((m[1].match(/href="([^"]+)"/) || [])[1]) })).filter(c => c.name);
    const L = lines(html);
    const stated = re => { const l = L.find(l => re.test(l)); return l ? l.replace(re, '').trim() : null; };
    x.stated = { communities: stated(/\s*IDENTIFIED COMMUNITIES\s*$/i), members: stated(/\s*COMMUNITY MEMBERS\s*$/i) };
    x.text = L.join(' ');
  }
  if (path === '/hub') {
    const L = lines(html); const a = L.findIndex(l => /^Strategic Documents/i.test(l)); const b = L.findIndex((l, i) => i > a && /^Some of our/i.test(l));
    if (a >= 0 && b > a) x.documents = L.slice(a + 1, b).filter(l => /\((19|20)\d{2}\)$/.test(l)).map(t => ({ title: t, year: +t.match(/\((\d{4})\)$/)[1] }));
  }
  if (path === '/15-sme-algarvian-tourism-companies') x.text = lines(html).join(' ');
  return x;
}
const safe = s => s && !EMAIL.test(s) && !PHONE.test(s);
async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (r.ok) return { status: r.status, url: r.url, text: await r.text() };
      if (r.status === 404 || r.status === 403) return { status: r.status, url: r.url, text: '' };
    } catch {}
    await sleep(1000 * (i + 1));
  }
  return { status: 0, url, text: '' };
}
const texts = {};   // page text held in memory only, to confirm the facts quoted from it below
async function readPages(read) {
  const sm = await get(`${BASE}/sitemap.xml`);
  const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  // Not kept: events and blog (in the events and news lists), people's profiles, and the bare site info page.
  const skip = u => /\/(event|blog)(\/|$)/.test(u) || /\/profile\//.test(u) || /\/website\/info$/.test(u);
  const urls = [...new Set(locs.filter(u => u.startsWith(BASE) && !skip(u)))];
  const pages = [];
  for (const url of urls) {
    await sleep(PAUSE);
    const r = await get(url);
    if (r.status !== 200 || !r.text) { pages.push({ url, status: r.status, unread: true }); continue; }
    const html = r.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
    const title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
    const meta = (name) => clean(decode((html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i')) || [''])[0].match(/content=["']([^"']*)["']/i)?.[1] || ''));
    const description = meta('description') || meta('og:description');
    const headings = [];
    for (const m of html.matchAll(/<(h[12])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const t = clean(m[2]);
      if (t && t.length <= 160 && safe(t) && !headings.includes(t)) headings.push(t);
      if (headings.length >= 8) break;
    }
    const path = new URL(url).pathname.replace(/\/$/, '') || '/';
    const ex = extras(path, html);
    if (ex.text) { texts[path] = ex.text; delete ex.text; }
    pages.push({ url, path, group: pageGroup(path), title: safe(title) ? title : '', description: safe(description) ? description : '', headings,
      activity: PAGE_ACTIVITY[path] || null, ...(Object.keys(ex).length ? { data: ex } : {}), source: url, read });
  }
  return { pages, sitemap: `${BASE}/sitemap.xml`, read };
}

// ---------- events from their Odoo (classified from the name and place) ----------
const TOWN_WORDS = [
  ['faro', 'Faro'], ['penha', 'Faro'], ['gambelas', 'Faro'], ['ualg tec', 'Faro'],
  ['loule', 'Loulé'], ['almancil', 'Loulé'], ['quarteira', 'Loulé'], ['vilamoura', 'Loulé'], ['salir', 'Loulé'], ['ancao', 'Loulé'],
  ['portimao', 'Portimão'], ['alvor', 'Portimão'], ['mexilhoeira grande', 'Portimão'],
  ['lagos', 'Lagos'], ['olhao', 'Olhão'], ['silves', 'Silves'], ['alcantarilha', 'Silves'],
  ['lagoa', 'Lagoa'], ['carvoeiro', 'Lagoa'], ['tavira', 'Tavira'], ['albufeira', 'Albufeira'], ['monchique', 'Monchique'],
  ['aljezur', 'Aljezur'], ['vila do bispo', 'Vila do Bispo'], ['sagres', 'Vila do Bispo'], ['castro marim', 'Castro Marim'],
  ['alcoutim', 'Alcoutim'], ['sao bras', 'São Brás de Alportel'], ['vila real de santo antonio', 'Vila Real de Santo António'],
  ['altura', 'Castro Marim'], ['porches', 'Lagoa'],
];
const ELSEWHERE = [
  ['lisboa', 'Lisbon', 'portugal'], ['lisbon', 'Lisbon', 'portugal'], ['taguspark', 'Oeiras', 'portugal'], ['porto', 'Porto', 'portugal'],
  ['cascais', 'Cascais', 'portugal'], ['campo gran', 'Lisbon', 'portugal'], ['malaga', 'Málaga', 'abroad'], ['madrid', 'Madrid', 'abroad'],
  ['sevilla', 'Seville', 'abroad'], ['barcelona', 'Barcelona', 'abroad'], ['london', 'London', 'abroad'], ['new york', 'New York', 'abroad'],
  ['paris', 'Paris', 'abroad'], ['amesterdam', 'Amsterdam', 'abroad'], ['amsterdam', 'Amsterdam', 'abroad'], ['rio de janeiro', 'Rio de Janeiro', 'abroad'],
  ['vancouver', 'Vancouver', 'abroad'], ['cape town', 'Cape Town', 'abroad'],
];
const hasWord = (text, w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(text);
function whereIs(place, name) {
  const p = fold(place);
  if (!p) { const n = fold(name); for (const [w, t] of TOWN_WORDS) if (hasWord(n, w)) return { town: t, region: 'algarve', town_from: 'name' }; return { town: null, region: null }; }
  if (/^(online|webinar)$/.test(p.trim())) return { town: null, region: 'online' };
  // A town elsewhere wins only if no Algarve town is in the address (Porto de Recreio de Olhão is in Olhão).
  for (const [w, t] of TOWN_WORDS) if (hasWord(p, w)) return { town: t, region: 'algarve' };
  for (const [w, t, region] of ELSEWHERE) if (hasWord(p, w)) return { town: t, region };
  if (/\balgarve\b/.test(p)) return { town: null, region: 'algarve' };
  const n = fold(name);
  for (const [w, t] of TOWN_WORDS) if (hasWord(n, w)) return { town: t, region: 'algarve', town_from: 'name' };
  return { town: null, region: null };
}
function kindOf(name) {
  const n = fold(name);
  if (/hackathon|hack day|hackday|buildathon|vibathon|build lab|8h2 build|startup weekend|design sprint/.test(n)) return 'hackathon';
  if (/summit/.test(n)) return 'summit';
  if (/workshop|webinar|curso|course|masterclass|bootcamp|formacao|training|aprende|\b101\b|deep dive|build with ai|intro to|practical guide|cria a tua|your way to/.test(n)) return 'workshop';
  if (/meetup|meet-up|mixer|networking|party|pitch night|fuckup nights|pizza|celebration|anniversary|gathering|warm-up|grow algarve/.test(n)) return 'meetup';
  if (/conference|\bconf\b|forum|festival|devfest|\bfest\b|show\b|expo|convention|congress|wordcamp|tedx|fair\b|feira|meeting|world cup|web ?summit/.test(n)) return 'conference';
  return 'other';
}
function activityOf(name, kind) {
  const n = fold(name);
  if (kind === 'hackathon') return 'vibathon';
  if (/startup|founder|investor|pitch|incubat|accelerat|scale|entrepreneur|empreend|unicorn|\bventure|sotavento invest/.test(n) || /\bCRIA\b/.test(name)) return 'inc-acc';
  if (kind === 'meetup' || /community|gdg|devfest|careers|estagios|emprego|\brh\b|geek|digital innovators/.test(n)) return 'talent';
  return null;
}
// Titles as published, with HTML entities decoded and invisible characters removed. Two titles name a guest speaker;
// they keep the published title and add `name_safe` without the name, since V3 names no person but António Guerreiro.
const title = s => tidy(decode(s).replace(/[\u200b-\u200d\ufeff]/g, ''));
const SPEAKER = /\s+with\s+([A-Z][a-zà-ÿ]+(?:\s+[A-Z][a-zà-ÿ]+)+)$/;
const events = odoo.events.map(o => {
  const e = { ...o, name: title(o.name) };
  const kind = kindOf(e.name);
  const speaker = SPEAKER.test(e.name) && !/\b(AI|WooCommerce|Gemma)\b/.test(e.name.match(SPEAKER)[1]);
  const where = whereIs(e.place, e.name);
  return { id: e.id, name: e.name, ...(speaker ? { names_person: true, name_safe: `${e.name.replace(SPEAKER, '')} (with a guest speaker)` } : {}), start: e.start, end: e.end, tz: e.tz, place: e.place, ...where, kind, activity: activityOf(e.name, kind),
    url: e.url, register: e.register, ics: e.ics, source: e.url, read: odoo.read };
});
const news = odoo.posts.map(p => ({ title: title(p.title), url: p.url, date: p.date, blog: p.blog, source: p.url, read: odoo.read }));

// ---------- programmes (src/data/programmes.json, the ecosystem's notes, and their own pages) ----------
const PROGRAMME = {
  'founder2founder':            { activity: 'inc-acc',  page: '/founder2founder', node: 'f2f' },
  'incubator':                  { activity: 'inc-acc',  page: '/incubator', node: 'incubator' },
  'inova-algarve-3':            { activity: 'inc-acc',  page: '/inovaalgarve', node: 'inova' },
  'startup-showcase':           { activity: 'inc-acc',  page: '/startups-smbs' },
  'ualg-entrepreneurship':      { activity: 'talent',   page: '/education', node: 'education' },
  'the-company':                { activity: 'talent',   page: '/education' },
  'buildathons':                { activity: 'vibathon', page: '/education' },
  'algarve-digital-innovators': { activity: 'talent',   page: '/adi', node: 'adi' },
  'algarve-tech-hub-summit':    { activity: 'talent',   page: '/innovation-ecosystem', node: 'aths' },
  'ccdr-digital-platform':      { activity: 'talent',   page: '/innovation-ecosystem' },   // the regional hub's stakeholders
};

// ---------- communities and organisations (PrompTugal.news public research; no people) ----------
const organisations = orgsData.organisations.map(o => ({ id: o.id, name: o.name, kind: o.kind, town: muniName[o.town] || o.town,
  towns: (o.towns || []).map(t => muniName[t] || t), what: o.what, url: o.url, source: o.source_url, read: o.read_on }));
const seedNames = new Set(seed.organisations.map(o => fold(o.name)));
const notInOrgs = seed.organisations.filter(o => !organisations.some(x => fold(x.name) === fold(o.name) || x.source === o.source));

// ---------- gaps: what a real hub needs that is not public anywhere ----------
const gaps = [
  { id: 'programme-companies', activity: 'inc-acc', what: 'Startups in each programme and their KPIs from month 0 to 6',
    known: 'Founder2Founder chose eight companies from 41 applications (reported); their names and KPIs are not published.',
    odoo: ['aih.programme', 'aih.programme.company', 'aih.kpi', 'aih.reflection'], v2: '/inc-acc/' },
  { id: 'mentors', activity: 'inc-acc', what: 'Mentors (one-to-one and guest) and their mentoring sessions, clinics and workshops',
    known: 'Founder2Founder gives each company a mentor (reported); no mentor is named publicly with consent.',
    odoo: ['res.partner (aih_is_mentor, aih_mentor_kind, aih_expertise_ids)', 'aih.session'], v2: '/inc-acc/' },
  { id: 'challenges', activity: 'challenge-connect', what: 'Challenges presented by companies, with requirements, budget and deadline',
    known: 'No challenge is published anywhere.', odoo: ['aih.challenge', 'aih.skill'], v2: '/challenge-connect/' },
  { id: 'suppliers', activity: 'challenge-connect', what: 'Suppliers (companies and individual professionals) and their capabilities',
    known: 'Public organisations are listed below; none has said it wants to be a supplier.', odoo: ['res.partner (aih_is_supplier, aih_capability_ids, aih_rate)', 'aih.skill'], v2: '/challenge-connect/' },
  { id: 'applications', activity: 'challenge-connect', what: 'Applications to each challenge, the match scores and the top 3 Algarve Evolution suggests',
    known: 'None exist yet.', odoo: ['aih.application'], v2: '/challenge-connect/' },
  { id: 'vibathon-projects', activity: 'vibathon', what: 'The projects built at each Vibathon, what each team presented, and the next step after the event',
    known: 'The projects built at Vibathon Algarve 2026 and the winners were not published when the newsroom wrote about the day.',
    odoo: ['aih.vibathon', 'aih.project'], v2: '/vibathon/' },
  { id: 'vibathon-jury', activity: 'vibathon', what: 'The jury of each Vibathon and their scores',
    known: 'Vibathon Algarve 2026 had a jury and prizes (reported); its members and scores are not public.',
    odoo: ['aih.vibathon.jury', 'aih.project.score'], v2: '/vibathon/' },
  { id: 'vibathon-participants', activity: 'vibathon', what: 'Who registered and took part (private), and how many',
    known: 'Vibathon Algarve 2026 sold out and opened a waiting list (reported); no count is published.',
    odoo: ['aih.vibathon.participant', 'aih.vibathon (registrations)', 'event.registration'], v2: '/vibathon/' },
  { id: 'talent-people', activity: 'talent', what: 'People in the talent network (professionals, consultants, mentors, investors), listed only with their consent',
    known: 'No person is listed publicly with consent; only organisations are.', odoo: ['res.partner (aih_talent_kind, aih_consent, aih_published, aih_community_id)'], v2: '/talent/' },
  { id: 'competences', activity: 'talent', what: 'Competences: the skills of people and organisations, to match talent with needs',
    known: 'No public skills register exists.', odoo: ['aih.skill', 'res.partner (aih_expertise_ids, aih_capability_ids)'], v2: '/talent/' },
  { id: 'community-members', activity: 'talent', what: 'The members of each community in the Algarve Digital Innovators network, and what each community does',
    known: 'Their ADI page lists 24 mapped communities and states 5,839 members in total; no member count or activity record is published for any one community.',
    odoo: ['aih.community (members)', 'res.partner (aih_community_id)'], v2: '/talent/' },
  { id: 'partners-stakeholders', activity: 'talent', what: 'Project partners in co-financed projects and the stakeholders of the regional innovation hub, with their role',
    known: 'Eight partners are named in public sources (see organisation.partners); their roles in each project are not.',
    odoo: ['res.partner (aih_talent_kind: partner, stakeholder)'], v2: '/talent/' },
];
// Ideas and needs feed all four activities, so this gap sits on the hub rather than in `gaps` (where every entry has one activity).
hub.inputs = { id: 'ideas-needs', what: 'Ideas and needs coming into the hub (the input stream along the bottom of the whiteboard)',
  known: 'Nothing is published.', odoo: [], odoo_note: 'Proposal: the hub addon has no model for this yet; a CRM lead (crm.lead) or a Helpdesk ticket could hold it.', v2: '/' };

// ---------- vibathons ----------
const vEvent = eventsData.events.find(e => e.id === 'vibathon-algarve-2026');
const vOdoo = odoo.events.find(e => /^vibathon/i.test(e.name) && e.start.startsWith('2026-10-31'));
const N = NEWSROOM_VIBATHON;
const vibathons = [{
  id: 'vibathon-algarve-2026', name: 'Vibathon Algarve 2026', date: '2026-10-31', start: vOdoo?.start || '2026-10-31T09:00', end: vOdoo?.end || '2026-10-31T18:00',
  place: 'UAlg TEC Campus, Penha campus, Faro', town: 'Faro', kind: 'buildathon', activity: 'vibathon',
  url: vOdoo?.url || null, odoo_event: vOdoo?.id || null,
  facts: [
    { text: en(vEvent.summary), source: vEvent.sources[0], sources: vEvent.sources },
    { text: 'Organised by Algarve Evolution with Lovable, at the UAlg TEC Campus on the Penha campus in Faro, on 31 October 2026, from nine to six.', source: N },
    { text: 'Registration was free; the event sold out and opened a waiting list.', source: N },
    { text: 'The room filled with students, professionals, creatives and the curious, many with no coding experience at all.', source: N },
    { text: 'Each participant got free Lovable credits, meals, an introduction to the tool and the day to build, with mentors and volunteers, and a jury and prizes at the end.', source: N },
    { text: 'The crew\'s T-shirts carried the event\'s line: "Build something the Algarve world needs."', source: N },
    { text: "The opening thanked CRIA, the University of the Algarve's division for entrepreneurship and technology transfer, which runs the university's incubator.", source: N },
    { text: 'António Guerreiro, executive director of Algarve Evolution, opened the day.', source: N },
    { text: 'The projects built on the day, and the jury\'s winners, were not known when the article was written.', source: N, gap: 'vibathon-projects' },
  ],
  source: N, read: readOf(N),
}];
for (const e of events.filter(e => e.kind === 'hackathon' && e.id !== vOdoo?.id)) {
  vibathons.push({ id: e.id, name: e.name, date: e.start.slice(0, 10), start: e.start, end: e.end, place: e.place, town: e.town, kind: 'hackathon',
    activity: 'vibathon', url: e.url, odoo_event: e.id,
    facts: [{ text: `Listed on Algarve Evolution's Odoo events calendar for ${e.start.slice(0, 10)}${e.town ? `, in ${e.town}` : ''}.`, source: e.url }],
    source: e.url, read: odoo.read });
}

// ---------- pages, then programmes that need them ----------
let pagesBlock;
if (args.has('--offline') && previous?.pages?.length) {
  pagesBlock = { pages: previous.pages, sitemap: previous.meta?.pages_from || `${BASE}/sitemap.xml`, read: previous.meta?.pages_read || null };
  console.log(`offline: reusing ${previous.pages.length} pages read ${pagesBlock.read}`);
} else {
  const read = new Date().toISOString().slice(0, 10);
  pagesBlock = await readPages(read);
  console.log(`pages: ${pagesBlock.pages.filter(p => !p.unread).length} read, ${pagesBlock.pages.filter(p => p.unread).length} unread`);
}
const unreadPages = pagesBlock.pages.filter(p => p.unread).map(p => ({ url: p.url, status: p.status }));
const pages = pagesBlock.pages.filter(p => !p.unread);
const pageBy = path => pages.find(p => p.path === path);

const programmes = [];
for (const pillar of programmesData.pillars) for (const g of pillar.programmes) {
  const m = PROGRAMME[g.id] || {};
  const node = m.node && eco.nodes.find(n => n.id === m.node);
  const facts = [{ text: en(g.summary), source: g.sources[0], sources: g.sources }];
  if (node?.note && ecoUrl(node.src)) facts.push({ text: node.note, source: ecoUrl(node.src) });
  const pg = m.page && pageBy(m.page);
  if (pg?.description) facts.push({ text: pg.description, source: pg.url, own_words: true });
  programmes.push({ id: g.id, name: en(g.name), pillar: en(pillar.name), activity: m.activity ?? null, summary: en(g.summary), facts,
    page: pg?.url || (m.page ? `${BASE}${m.page}` : undefined), source: g.sources[0], sources: g.sources });
}
// Their own programme pages that src/data does not cover. Each fact is kept only if the page, read in this run, still
// says it (the `confirm` pattern); with --offline the facts confirmed in the previous run are kept.
const PAGE_PROGRAMMES = [
  { id: 'algarve-empreende', path: '/algarveempreende', name: 'Algarve Empreende', activity: 'inc-acc',
    summary: "A project to help the region's SMEs build their capacity for innovation, managed by the University of the Algarve, NERA, Algarve Evolution, Algarve STP, ANJE and AMAL.",
    facts: [
      { text: 'Algarve Empreende is managed by the University of the Algarve, NERA, Algarve Evolution, Algarve STP, ANJE and AMAL.', confirm: /ALGARVE EMPREENDE is managed by Universidade do Algarve, NERA, Algarve Evolution, Algarve STP, ANJE and AMAL/i },
      { text: "Its main goal is to strengthen the region's business landscape by helping SMEs build their capacity for innovation, through cooperation and \"coopetition\", within the Algarve's smart specialisation areas (RIS3).", confirm: /capacity for innovation[\s\S]*RIS3/i },
      { text: 'It supports SMEs in launching innovative projects and developing new products and services.', confirm: /launching innovative projects/i },
    ] },
  { id: 'ai-robotics-tourism-pilot', path: '/15-sme-algarvian-tourism-companies', name: 'AI and Robotics Action Plan: a pilot for 15 tourism SMEs', activity: 'inc-acc',
    summary: 'A pilot programme for Algarve tourism companies: 15 winners receive a free diagnostic, personalised consultancy and a tailored action plan for artificial intelligence and robotics.',
    note: 'src/data/programmes.json reports a pilot of free consultancy for 20 tourism businesses under INOVA Algarve 3.0; this page says 15 winners. Both are shown as published.',
    facts: [
      { text: 'A pilot programme for companies in the Algarve tourism sector: 15 winners receive a free diagnostic, specialised and personalised consultancy, and a tailored action plan for artificial intelligence and robotics.', confirm: /15 winners[\s\S]*free diagnostic/i },
      { text: 'Applications were open from 20 February to 30 April 2026.', confirm: /February 20th to April 30th, 2026/i },
      { text: 'Information sessions were held in Portimão on 17 March, in Faro on 20 March and online on 30 March 2026.', confirm: /PORTIM.O, MARCH 17, 2026[\s\S]*FARO, MARCH 20, 2026[\s\S]*ONLINE, MARCH 30, 2026/i },
    ] },
];
const unconfirmed = [];
for (const d of PAGE_PROGRAMMES) {
  const pg = pageBy(d.path);
  if (!pg) { unconfirmed.push(`${d.id}: page not read`); continue; }
  let facts;
  if (texts[d.path]) {
    facts = d.facts.filter(f => (f.confirm.test(texts[d.path]) ? true : (unconfirmed.push(`${d.id}: "${f.text.slice(0, 50)}..." no longer on ${pg.url}`), false)))
      .map(f => ({ text: f.text, source: pg.url, read: pg.read }));
  } else facts = previous?.programmes?.find(p => p.id === d.id)?.facts || [];
  if (!facts.length) continue;
  programmes.push({ id: d.id, name: d.name, pillar: 'Startups and smaller companies', activity: d.activity, summary: d.summary, note: d.note,
    facts, page: pg.url, source: pg.url, sources: [pg.url], read: pg.read });
}
if (unconfirmed.length) console.warn(`not confirmed on their pages:\n  ${unconfirmed.join('\n  ')}`);

// ---------- communities: the ADI network's own list, with PrompTugal.news research where it matches ----------
const adiPage = pageBy('/algarveempreende');
const mapped = adiPage?.data?.mapped_communities || [];
const base = n => fold(n).replace(/\(.*?\)/g, '').replace(/\bportugal\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const ALIAS = { 'geek girls faro': 'geek girls faro', 'gdg lagos': 'gdg lagos' };
const seedBy = new Map(seed.communities.map(c => [ALIAS[base(c.name)] || base(c.name), c]));
const guessKind = n => /nomad|remoter|diginomad/i.test(n) ? 'informal group' : /^(gdg|flutter|wordpress)\b/i.test(n) ? 'developer group' : /cowork/i.test(n) ? 'coworking' : 'community';
const guessTown = n => { const f = fold(n); for (const [w, t] of TOWN_WORDS) if (hasWord(f, w)) return t; return null; };
const usedSeed = new Set();
const communities = mapped.map(m => {
  const c = seedBy.get(base(m.name)); if (c) usedSeed.add(c.key);
  const town = c?.municipality || guessTown(m.name);
  return { id: slug(m.name), name: m.name, adi: true, municipality: town, municipality_from: c ? 'research' : (town ? 'name' : undefined),
    kind: c?.kind || guessKind(m.name), kind_from: c ? 'research' : 'name', summary: c?.summary, url: publicLink(m.url) || c?.url || null,
    source: adiPage.url, read: adiPage.read, research: c ? { source: c.source, read: c.read_on } : undefined };
});
for (const c of seed.communities.filter(c => !usedSeed.has(c.key))) {
  communities.push({ id: c.key.replace(/^com-/, ''), name: c.name, adi: false, municipality: c.municipality, kind: c.kind,
    summary: c.summary, url: c.url, members: c.members ?? undefined, source: c.source, read: c.read_on });
}
if (adiPage?.data?.stated) organisation.adi = { communities: adiPage.data.stated.communities, members: adiPage.data.stated.members?.replace('.', ','),
  mapped_listed: mapped.length, label: 'communities identified and their members, as stated on the ADI network page', source: adiPage.url, read: adiPage.read };
if (pageBy('/hub')?.data?.documents) organisation.documents = pageBy('/hub').data.documents.map(d => ({ ...d, source: pageBy('/hub').url, read: pageBy('/hub').read }));

// ---------- places ----------
const places = {
  municipalities: placesData.municipalities, municipalities_source: placesData.municipalities_source,
  outline: placesData.outline, about: placesData.about,
  activity: eco.places.map(p => ({ name: p.name, ll: p.ll, note: p.note, hq: p.hq || undefined, source: ecoUrl(p.src) })),
  source: placesData.municipalities_source,
};

// ---------- meta ----------
const count = (xs, k) => xs.reduce((o, x) => (o[x[k] ?? 'none'] = (o[x[k] ?? 'none'] || 0) + 1, o), {});
const upcoming = events.filter(e => e.start >= odoo.read).length;
const feed = {
  meta: {
    built: new Date().toISOString(),
    contract: 'docs/v3/REAL-FEED.md',
    rule: 'Real, published data only. Every record carries its source URL; nothing is simulated. No person is named except António Guerreiro, executive director. No e-mail address or telephone number is kept.',
    sources: {
      odoo: `${BASE} (Odoo ${odoo.odoo || 'version unknown'}, read ${odoo.read}): ${events.length} events from one iCal export each, ${news.length} posts from ${odoo.from.news.length} blog feeds`,
      pages: `${pagesBlock.sitemap} (read ${pagesBlock.read}): ${pages.length} public pages, title, meta description and h1/h2 headings only`,
      data: `src/data (the facts V1 was built from): ${sourcesData.sources.length} sources in src/data/sources.json, each read on or before ${[...new Set(sourcesData.sources.map(s => s.read))].sort().pop()}`,
      ecosystem: eco.from,
      communities: `The ADI network's list of mapped communities on ${BASE}/algarveempreende (read ${adiPage?.read || 'not read'}), matched with PrompTugal.news research (data/by-place, CC BY 4.0) extracted ${seed.extracted} into scripts/odoo/seed/real-public.json`,
      organisations: `PrompTugal.news research, ${orgsData.from?.repo || ''} at ${orgsData.from?.commit || ''}, compiled ${orgsData.compiled}; organisations only, contacts dropped`,
      newsroom: `${N} (SGit Newsroom, ${srcIndex.get(N)?.published || '2026-10-31'}): facts as stated there`,
    },
    sources_index: sourcesData.sources.map(s => ({ url: s.url, publisher: s.publisher, title: s.title, published: s.published, read: s.read })),
    pages_from: pagesBlock.sitemap, pages_read: pagesBlock.read, pages_unread: unreadPages,
    odoo: { url: BASE, version: odoo.odoo, read: odoo.read },
    classification: 'Event kind, town and hub activity, and page and programme activity, are our classification from names and places; they are not published by Algarve Evolution.',
    counts: {
      activities: hub.activities.length, programmes: programmes.length, pages: pages.length, events: events.length, events_upcoming: upcoming, news: news.length,
      vibathons: vibathons.length, communities: communities.length, communities_adi: communities.filter(c => c.adi).length, organisations: organisations.length, gaps: gaps.length,
      figures: organisation.figures.length, timeline: organisation.timeline.length, partners: organisation.partners.length,
      events_by_kind: count(events, 'kind'), events_by_activity: count(events, 'activity'), events_by_region: count(events, 'region'),
      organisations_by_kind: count(organisations, 'kind'),
    },
  },
  hub, organisation, programmes, pages, events, news, vibathons, communities, organisations, places, gaps,
};
if (notInOrgs.length) console.warn(`note: ${notInOrgs.length} seed organisations are not among the 211`);
void seedNames;
writeFileSync(OUT, JSON.stringify(feed, null, 1) + '\n');
console.log(`wrote ${OUT}: ${JSON.stringify(Object.fromEntries(Object.entries(feed.meta.counts).filter(([, v]) => typeof v === 'number')))}`);
if (!check(feed)) process.exit(1);
}

// ---------- the check ----------
function check(feed) {
  const problems = [];
  const isUrl = u => typeof u === 'string' && /^https?:\/\/[^\s]+$/.test(u);
  const need = (where, rec) => { if (!isUrl(rec?.source)) problems.push(`${where}: no source URL`); };
  const o = feed.organisation || {};
  for (const [k, xs] of Object.entries({ goals: o.goals, figures: o.figures, timeline: o.timeline, partners: o.partners, events: o.events, 'network.nodes': o.network?.nodes }))
    (xs || []).forEach((x, i) => need(`organisation.${k}[${i}]`, x));
  need('organisation.executive_director', o.executive_director);
  need('organisation.quote', o.quote);
  for (const k of ['programmes', 'pages', 'events', 'news', 'vibathons', 'communities', 'organisations']) (feed[k] || []).forEach((x, i) => need(`${k}[${i}] ${x.id || x.name || x.title || x.url}`, x));
  for (const k of ['programmes', 'vibathons']) (feed[k] || []).forEach((x, i) => (x.facts || []).forEach((f, j) => need(`${k}[${i}].facts[${j}]`, f)));
  (feed.places?.activity || []).forEach((x, i) => need(`places.activity[${i}]`, x));
  if (!isUrl(feed.places?.source)) problems.push('places: no source URL');
  for (const [i, e] of (feed.events || []).entries()) { if (!isUrl(e.url) || !isUrl(e.register)) problems.push(`events[${i}]: url and register must link to their Odoo`); }
  const ACT = new Set((feed.hub?.activities || []).map(a => a.id));
  for (const k of ['gaps', 'programmes', 'vibathons']) (feed[k] || []).forEach((x, i) => { if (!ACT.has(x.activity)) problems.push(`${k}[${i}]: activity "${x.activity}" is not one of the hub's four`); });
  for (const k of ['events', 'pages']) (feed[k] || []).forEach((x, i) => { if (x.activity !== null && !ACT.has(x.activity)) problems.push(`${k}[${i}]: activity "${x.activity}" is not one of the hub's four or null`); });
  for (const [i, g] of (feed.gaps || []).entries()) { if (!g.what || !Array.isArray(g.odoo) || !g.v2) problems.push(`gaps[${i}]: needs what, odoo and v2`); if (!g.odoo.length && !g.odoo_note) problems.push(`gaps[${i}]: no Odoo model and no note`); }
  // Nothing simulated, anywhere in the tree.
  (function walk(v, path) {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (v && typeof v === 'object') {
      if (v.simulated === true || v.aih_simulated === true) problems.push(`${path}: simulated: true`);
      for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
      return;
    }
    if (typeof v === 'string' && /\(simulated\)/i.test(v)) problems.push(`${path}: "(simulated)" in "${v.slice(0, 60)}"`);
  })(feed, 'feed');
  // No e-mail address or telephone number, anywhere (URLs are checked too).
  (function walk(v, path) {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (v && typeof v === 'object') { for (const [k, x] of Object.entries(v)) if (k !== 'outline' && k !== 'municipalities') walk(x, `${path}.${k}`); return; }
    if (typeof v !== 'string') return;
    if (EMAIL.test(v)) problems.push(`${path}: e-mail address in "${v.slice(0, 60)}..."`);
    if (PHONE.test(v)) problems.push(`${path}: telephone number in "${v.match(PHONE)[0]}"`);
    if (PRIVATE_LINK.test(v)) problems.push(`${path}: a person's profile or a private invitation link: ${v.slice(0, 60)}`);
  })(feed, 'feed');
  // Counts match.
  const c = feed.meta?.counts || {};
  for (const k of ['programmes', 'pages', 'events', 'news', 'vibathons', 'communities', 'organisations', 'gaps'])
    if (c[k] !== (feed[k] || []).length) problems.push(`meta.counts.${k} is ${c[k]}, the list has ${(feed[k] || []).length}`);
  if (c.activities !== feed.hub?.activities?.length) problems.push('meta.counts.activities does not match');
  if (c.figures !== o.figures?.length || c.timeline !== o.timeline?.length || c.partners !== o.partners?.length) problems.push('meta.counts for the organisation do not match');
  for (const k of ['events_by_kind', 'events_by_activity', 'events_by_region']) { const s = Object.values(c[k] || {}).reduce((a, b) => a + b, 0); if (s !== c.events) problems.push(`meta.counts.${k} sums to ${s}, not ${c.events}`); }
  const ob = Object.values(c.organisations_by_kind || {}).reduce((a, b) => a + b, 0); if (ob !== c.organisations) problems.push('meta.counts.organisations_by_kind does not sum');
  // Against the inputs.
  try {
    const od = J('src/data/odoo.json'); if ((feed.events || []).length !== od.events.length) problems.push(`events: ${feed.events.length} in the feed, ${od.events.length} in src/data/odoo.json`);
    if ((feed.news || []).length !== od.posts.length) problems.push(`news: ${feed.news.length} in the feed, ${od.posts.length} in src/data/odoo.json`);
    const og = J('v1-source/src/talent-map/data/organisations.json'); if ((feed.organisations || []).length !== og.organisations.length) problems.push(`organisations: ${feed.organisations.length}, expected ${og.organisations.length}`);
    const sd = J('scripts/odoo/seed/real-public.json');
    for (const c of sd.communities) if (!(feed.communities || []).some(x => x.source === c.source || x.research?.source === c.source)) problems.push(`communities: ${c.name} from the seed is missing`);
    const listed = (feed.pages || []).find(p => p.path === '/algarveempreende')?.data?.mapped_communities?.length || 0;
    if ((feed.communities || []).filter(c => c.adi).length !== listed) problems.push(`communities: ${feed.communities.filter(c => c.adi).length} ADI communities, their page lists ${listed}`);
  } catch (e) { problems.push(`could not read the inputs: ${e.message}`); }
  // Only António Guerreiro is named among people.
  const ids = new Set(); for (const k of ['programmes', 'pages', 'events', 'vibathons', 'communities', 'organisations', 'gaps']) for (const x of feed[k] || []) { const id = x.id || x.url; if (ids.has(`${k}:${id}`)) problems.push(`${k}: duplicate ${id}`); ids.add(`${k}:${id}`); }
  if (problems.length) { console.error(`real feed check: ${problems.length} problem(s)`); for (const p of problems.slice(0, 80)) console.error(`  ${p}`); return false; }
  console.log(`real feed check OK: ${JSON.stringify(Object.fromEntries(Object.entries(c).filter(([, v]) => typeof v === 'number')))}`);
  return true;
}
