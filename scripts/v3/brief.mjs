// V3 design "The Brief": the AE Innovation Hub told with real, published data only, in the Swiss typographic
// style António Guerreiro picked from V1 (one strong column on a 12-column grid, monochrome with one ochre
// accent, hairline rules, numbered sections, numbered endnotes). Every fact carries an endnote number; the
// notes at the foot list every source in the order it is first used. Where nothing is published yet, the page
// says so and names the Odoo records that would fill the gap, with a link to the V2 page that shows it.
// Data: ctx.real (src/feeds/real.json, contract in docs/v3/REAL-FEED.md); until that file exists, the same
// shapes are built from ctx.data (src/data) and the real (non-simulated) records of the public Odoo feed.
// By sites-design@AgentiCCells.dinis, 16 November 2026. Code Apache-2.0, text CC BY 4.0.
import { readFileSync, existsSync } from 'node:fs';

export const meta = { slug: 'brief', order: 1, name: 'The Brief', tagline: 'Read it in two minutes' };

const ODOO = 'https://www.algarveevolution.pt';
const V2_NAME = { '/': 'The Hub', '/inc-acc/': 'INC/ACC', '/challenge-connect/': 'Challenge Connect', '/vibathon/': 'Vibathon', '/talent/': 'Talent Ecosystem', '/odoo/': 'Odoo', '/workflows/': 'Workflows', '/plan/': 'Plan' };

// The four activities on António's whiteboard (docs/v2/BRIEF.md), with his keywords and our English gloss.
const ACTIVITIES = [
  { id: 'inc-acc', name: 'INC/ACC', long: 'Incubation and acceleration', keywords: 'incubação, aceleração, mentores, KPIs', gloss: 'incubation, acceleration, mentors, KPIs', v2: '/inc-acc/' },
  { id: 'challenge-connect', name: 'Challenge Connect', long: 'Challenges matched with suppliers', keywords: 'desafios, fornecedores, matching', gloss: 'challenges, suppliers, matching', v2: '/challenge-connect/' },
  { id: 'vibathon', name: 'Vibathon', long: 'Hackathons and workshops', keywords: 'hackathons, workshops, júris', gloss: 'hackathons, workshops, juries', v2: '/vibathon/' },
  { id: 'talent', name: 'Talent Ecosystem', long: 'The people and partners of the region', keywords: 'talento, competências, parceiros, rede ADI', gloss: 'talent, skills, partners, the ADI network', v2: '/talent/' },
];

// What real data does not exist publicly yet, and the hub addon's records that would hold it
// (odoo/addons/algarve_innovation_hub). Used until real.json carries its own "gaps".
const GAPS = [
  { activity: 'inc-acc', what: 'The startups in each programme, their mentor and their mentoring sessions', odoo: ['aih.programme.company', 'aih.session', 'res.partner (mentor)'], v2: '/inc-acc/' },
  { activity: 'inc-acc', what: 'Each company\'s KPIs from month 0 to month 6, made public, and the reflection on the indicators', odoo: ['aih.kpi', 'aih.reflection'], v2: '/inc-acc/' },
  { activity: 'challenge-connect', what: 'Challenges from companies, the suppliers who apply, and the matching result (the best, or a top 3)', odoo: ['aih.challenge', 'aih.application'], v2: '/challenge-connect/' },
  { activity: 'vibathon', what: 'Who registered, the mentors and the jury, the projects presented, the scores and the next step after each event', odoo: ['aih.vibathon', 'aih.vibathon.participant', 'aih.vibathon.jury', 'aih.project', 'aih.project.score'], v2: '/vibathon/' },
  { activity: 'talent', what: 'The people in the network (professionals, consultants, mentors, investors), each listed only with their consent, and their skills', odoo: ['res.partner (talent kind, consent)', 'aih.skill'], v2: '/talent/' },
  { activity: 'talent', what: 'The members of each community, and the communities not yet recorded', odoo: ['aih.community'], v2: '/talent/' },
];

// Partners (ecosystem.json nodes of kind "partner"), with V1's short roles. Used until real.json has partners.
const PARTNERS = [
  { name: 'University of the Algarve', role: 'Partner in Algarve Digital Innovators, the Tech Hub Summit and Algarve Evolution\'s education work; lead promoter of the 2025 Web Summit project.', src: 'adi' },
  { name: 'Algarve STP', role: 'Science and technology park; partner in Algarve Digital Innovators, Venture Lab, the Tech Hub Summit and the 2025 Web Summit project.', src: 'adi' },
  { name: 'AMAL', role: 'The Algarve\'s intermunicipal community; partner in Algarve Digital Innovators, Venture Lab and the 2025 Web Summit project.', src: 'adi' },
  { name: 'NERA', role: 'Business association of the Algarve; partner in Algarve Digital Innovators, Venture Lab and the 2025 Web Summit project.', src: 'adi' },
  { name: 'ANJE', role: 'National association of young entrepreneurs; partner in Algarve Digital Innovators and Venture Lab; ran the 2025 Web Summit competition.', src: 'ws25' },
  { name: 'Junior Achievement Portugal', role: 'Runs "The Company" with Algarve Evolution\'s education work.', src: 'psn' },
  { name: 'Startup Portugal', role: 'Recognised the incubator in January 2026.', src: 'psn' },
  { name: 'Google Developer Group Lagos', role: 'Organiser of DevFest Lagos 2026, where Algarve Evolution is a partner.', src: 'devfest' },
];

// The kinds of the 211 organisations (the talent map data), in plain words.
const ORG_KINDS = { company: 'Companies', public: 'Public bodies', education: 'Schools and universities', incubation: 'Incubators and accelerators', support: 'Support services', funding: 'Funding', community: 'Communities' };

const HUB_NOTE = { key: 'hub-whiteboard', title: 'António Guerreiro\'s whiteboard of the AE Innovation Hub, drawn in his meeting with Dinis Cruz on 16 November 2026', publisher: 'Algarve Evolution and the PrompTugal team', extra: 'A photo shared by Dinis Cruz on 16 November 2026; not published.' };

// The page's data, read from ctx.real, or built from ctx.data and the real records of the Odoo feed.
function model(ctx) {
  const { data, h } = ctx;
  const R = ctx.real && !ctx.real.missing && Object.keys(ctx.real).length > 1 ? ctx.real : null;
  const t = v => h.t(v);
  const srcs = x => [].concat(x?.sources || [], x?.source || [], x?.src || []).filter(Boolean);
  const readJson = f => { try { return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { return null; } };
  const odoo = data.odoo || {};
  const read = R?.meta?.odoo?.read || odoo.read || (R?.meta?.built || '').slice(0, 10) || '2026-11-16';
  const odooVersion = R?.meta?.odoo?.version || odoo.odoo || '19.0';

  // The hub and its four activities.
  const ra = Object.fromEntries((R?.hub?.activities || []).map(a => [a.id, a]));
  const activities = ACTIVITIES.map(a => ({ ...a, summary: t(ra[a.id]?.summary) || '', keywords: t(ra[a.id]?.keywords) || a.keywords, gloss: t(ra[a.id]?.keywords_en) || a.gloss }));

  // Algarve Evolution.
  const o = R?.organisation || {};
  const v = data.voice;
  const person = data.people.people[0];
  const q = o.quote || data.people.quotes[0];
  const quote = { text: t(q.text), date: q.date, by: t(q.by_name || o.executive_director?.name) || (data.people.people.find(p => p.id === q.by) || person).name, role: t(o.executive_director?.role) || t(person.role), sources: srcs(q) };
  const figs = (o.figures?.length ? o.figures : data.figures.figures).filter(f => !['targets-2032', 'founded', 'communities'].includes(f.id));
  const org = {
    name: t(o.name) || 'Algarve Evolution',
    lede: (t(o.lede) && !/^we\b/i.test(t(o.lede))) ? t(o.lede) : 'Algarve Evolution is a Faro-based association that connects the region\'s entrepreneurs, talent, startups, smaller companies and partners. It began in 2018 as a small group of local entrepreneurs.',
    mission: (t(o.mission) || t(v.mission)).replace(/^Our mandate is/, 'Its mandate is'),
    missionSrc: o.mission_sources?.length ? o.mission_sources : ['psn'],
    ledeSrc: [...(o.voice_sources?.length ? o.voice_sources : ['psn']), ...(data.figures.figures.find(f => f.id === 'founded')?.sources || [])],
    goals: (o.goals?.length ? o.goals : v.goals).map(g => ({ value: t(g.value), label: t(g.label) })),
    goalsSrc: o.goals?.length ? [...new Set(o.goals.flatMap(srcs))] : v.goals_sources,
    goalsNote: t(o.goals_note) || t(v.goals_note),
    quote,
    figures: figs.map(f => ({ value: t(f.value), label: t(f.label), note: t(f.note), sources: srcs(f) })),
    founded: data.figures.figures.find(f => f.id === 'founded'),
    timeline: (o.timeline?.length ? o.timeline : data.ecosystem.timeline).map(e => ({ when: t(e.when), title: /^this week\b/i.test(t(e.title)) ? 'A week in the Algarve' : t(e.title), text: t(e.text), stat: t(e.stat), sources: srcs(e), future: !!e.future })),
    partners: (o.partners?.length ? o.partners : PARTNERS).map(p => ({ name: t(p.name || p.label), role: t(p.role || p.note), sources: srcs(p), url: p.url })),
    storyIntro: t(v.story_intro), storySrc: v.story_sources,
  };

  // Programmes: real.json's, or the V1 programmes with their pages on their Odoo.
  const PAGE = { founder2founder: '/founder2founder', incubator: '/incubator', 'inova-algarve-3': '/inovaalgarve', 'ualg-entrepreneurship': '/education', 'the-company': '/education', 'algarve-digital-innovators': '/adi' };
  const ACT = { founder2founder: 'inc-acc', incubator: 'inc-acc', 'inova-algarve-3': 'inc-acc', 'startup-showcase': 'inc-acc', 'ualg-entrepreneurship': 'education', 'the-company': 'education', buildathons: 'vibathon', 'algarve-digital-innovators': 'talent', 'algarve-tech-hub-summit': 'other', 'ccdr-digital-platform': 'other' };
  const programmes = R?.programmes?.length
    ? R.programmes.map(p => {
      const page = (R.pages || []).find(x => x.url === p.page);
      const name = t(p.name) === t(p.name).toUpperCase() && page ? t(page.title).replace(/\s*\|.*$/, '') : t(p.name);   // a heading in capitals: use the page's title
      return { id: p.id, name, activity: /education/i.test(t(p.pillar)) && p.activity !== 'vibathon' ? 'education' : (p.activity || 'other'), summary: t(p.summary), sources: srcs(p), facts: (p.facts || []).map(f => ({ text: t(f.text), sources: srcs(f), own: !!f.own_words })), note: t(p.note), page: p.page };
    })
    : data.programmes.pillars.flatMap(pl => pl.programmes.map(p => ({ id: p.id, name: t(p.name), activity: ACT[p.id] || 'other', summary: '', facts: [{ text: t(p.summary), sources: p.sources }], page: PAGE[p.id] ? ODOO + PAGE[p.id] : null })));
  const pages = R?.pages || [];
  const hubPage = pages.find(x => x.path === '/hub');

  // Events and news from their Odoo.
  const munis = (R?.places?.municipalities || data.places.municipalities);
  const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const townOf = place => { if (/^\s*online\s*$/i.test(place || '')) return 'Online'; const f = fold(place); const m = munis.find(x => f.includes(fold(x.name))); return m ? m.name : ''; };
  const kindOf = name => (/hack|vibathon|buildathon|design sprint|startup weekend/i.test(name) ? 'hackathon' : /workshop|curso livre|como usar a ia|masterclass|bootcamp|clinic|ai for startup/i.test(name) ? 'workshop' : /summit/i.test(name) ? 'summit' : /meetup|meeting|pitch night/i.test(name) ? 'meetup' : 'other');
  const events = (R?.events?.length ? R.events : odoo.events || []).map(e => ({ id: e.id, name: clean(e.name), start: e.start, end: e.end, place: e.place || '', town: e.town || townOf(e.place), url: e.url, register: e.register, kind: e.kind || kindOf(e.name), source: e.source || e.url }));
  const news = (R?.news?.length ? R.news : odoo.posts || []).map(p => ({ title: clean(p.title), url: p.url, date: p.date, blog: clean(p.blog) }));

  // Vibathon Algarve 2026 and the real hackathons and workshops.
  const vibEvent = events.find(e => /vibathon/i.test(e.name) && e.start.startsWith('2026-10-31'));
  const v1vib = data.events.events.find(e => e.id === 'vibathon-algarve-2026');
  const vibathons = R?.vibathons?.length
    ? R.vibathons.map(x => ({ name: clean(t(x.name)), date: x.date, start: x.start || x.date, end: x.end, place: t(x.place), town: t(x.town), kind: x.kind, url: x.url, facts: (x.facts || []).map(f => ({ text: t(f.text), sources: srcs(f), gap: f.gap })) }))
    : [{ name: t(v1vib.name), date: v1vib.start, start: v1vib.start, place: t(v1vib.place), url: vibEvent?.url, facts: [{ text: t(v1vib.summary), sources: v1vib.sources }] },
      ...events.filter(e => e.kind === 'hackathon' && !/vibathon/i.test(e.name)).map(e => ({ name: e.name, date: e.start.slice(0, 10), start: e.start, end: e.end, place: e.place, town: e.town, kind: 'hackathon', url: e.url, facts: [] }))];
  const workshops = events.filter(e => e.kind === 'workshop');

  // The Talent Ecosystem: real communities, organisations and places.
  const feed = R ? null : readJson('src/feeds/public.json');
  const communities = (R?.communities || (feed?.communities || []).filter(c => c.simulated === false)).map(c => ({ name: t(c.name), municipality: t(c.municipality), kind: t(c.kind), members: c.members, source: c.source, url: c.url, adi: !!c.adi }));
  const adiFig = (o.figures?.length ? o.figures : data.figures.figures).find(f => f.id === 'communities');
  const orgsFile = R ? null : readJson('v1-source/src/talent-map/data/organisations.json');
  const organisations = R?.organisations || orgsFile?.organisations || [];
  const orgMeta = String(R?.meta?.sources?.organisations || '');
  const orgSource = (orgMeta.match(/https:\/\/promptugal\.news\/\S*/) || [])[0] || 'https://promptugal.news/places/index.html';

  return { R, adiFig, read, odooVersion, activities, org, programmes, pages, hubPage, events, news, vibathons, workshops, communities, organisations, orgSource, orgMeta, munis, gaps: R?.gaps?.length ? R.gaps : GAPS, counts: R?.meta?.counts || {} };
}

// Titles from their Odoo and blog: entities decoded, decorative emoji dropped, long dashes as hyphens.
function clean(s) {
  return String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[\u2013\u2014]/g, '-').replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\s{2,}/g, ' ').trim();
}

export function render(ctx) {
  const { h, chrome } = ctx; const { esc } = h;
  const m = model(ctx);
  const pad = n => String(n).padStart(2, '0');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = iso => { const [y, mo, d] = String(iso).slice(0, 10).split('-'); return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`; };
  const dayShort = iso => { const [, mo, d] = String(iso).slice(0, 10).split('-'); return `${Number(d)} ${MONTHS[Number(mo) - 1]}`; };
  const time = iso => (String(iso).length > 10 ? String(iso).slice(11, 16) : '');
  const range = e => { const s = String(e.start).slice(0, 10), f = String(e.end || '').slice(0, 10); if (!f || f === s) return day(s); return s.slice(0, 7) === f.slice(0, 7) ? `${Number(s.slice(8))} to ${day(f)}` : `${dayShort(s)} to ${day(f)}`; };
  const long = iso => h.date(String(iso).slice(0, 10));

  // Endnotes: each source gets a number the first time it is cited.
  const srcByUrl = new Map(ctx.data.sources.sources.map(s => [s.url, s]));
  const notes = []; const noteNo = new Map();
  const PUB = { 'algarveevolution.pt': 'Algarve Evolution', 'newsroom.sgit.ai': 'SGit Newsroom', 'promptugal.news': 'PrompTugal.news', 'postal.pt': 'Postal do Algarve', 'barlavento.pt': 'Barlavento', 'gdg.community.dev': 'Google Developer Groups', 'meetup.com': 'Meetup', 'luma.com': 'Luma' };
  const describe = ref => {
    if (ref && typeof ref === 'object') return { key: ref.url || ref.key, ...ref };
    let s; try { s = h.source(ref); } catch { return null; }
    const known = srcByUrl.get(s.url);
    if (known) return { key: s.url, ...known };
    let host = ''; try { host = new URL(s.url).hostname.replace(/^www\./, ''); } catch { return null; }
    return { key: s.url, url: s.url, publisher: PUB[host] || host, title: s.title !== s.url ? s.title : '' };
  };
  const noteFor = d => { if (!noteNo.has(d.key)) { notes.push(d); noteNo.set(d.key, notes.length); } return noteNo.get(d.key); };
  const sup = d => { const n = noteFor(d); return `<sup><a class="nref" href="#n${n}" aria-label="Note ${n}">${n}</a></sup>`; };
  const cite = (refs, lead) => {
    const ds = [].concat(refs || []).filter(Boolean).map(describe).filter(Boolean);
    const seen = new Set(); const uniq = ds.filter(d => (seen.has(d.key) ? false : seen.add(d.key)));
    if (!uniq.length) return '';
    const pubs = uniq.map(d => d.publisher);
    const items = uniq.map(d => { const label = pubs.filter(p => p === d.publisher).length > 1 && d.title ? `${d.publisher}, "${d.title}"` : d.publisher; return `${d.url ? `<a href="${esc(d.url)}" rel="noopener">${esc(label)}</a>` : esc(label)}${sup(d)}`; });
    return `<p class="src">${esc(lead || (uniq.length > 1 ? 'Sources' : 'Source'))}: ${items.join(', ')}</p>`;
  };
  // The collections read from their Odoo, each one note.
  const N_EVENTS = { key: ODOO + '/events', url: ODOO + '/events', publisher: 'Algarve Evolution', title: `Events on their Odoo website (Odoo ${m.odooVersion}): one page and one iCal file per event`, read: m.read };
  const N_BLOG = { key: ODOO + '/blog', url: ODOO + '/blog', publisher: 'Algarve Evolution', title: 'The blog on their Odoo website: six blogs, read through their feeds', read: m.read };
  const N_SITEMAP = { key: ODOO + '/sitemap.xml', url: ODOO + '/sitemap.xml', publisher: 'Algarve Evolution', title: `Their Odoo website (Odoo ${m.odooVersion}): the public pages in its sitemap`, read: m.read };
  const N_ORGS = { key: m.orgSource, url: m.orgSource, publisher: 'PrompTugal.news', title: `Public research by place: ${m.organisations.length} organisations in the Algarve, each with its own source (no people)`, read: m.read, extra: m.orgMeta ? `Compiled as: ${m.orgMeta}.` : '' };

  const sections = [
    ['hub', 'The hub'], ['ae', 'Who runs it'], ['goals', 'Goals for 2032'], ['inc-acc', 'INC/ACC'], ['challenge-connect', 'Challenge Connect'],
    ['vibathon', 'Vibathon'], ['talent', 'Talent Ecosystem'], ['coming', 'Coming up'], ['news', 'News'], ['story', 'The story in time'],
    ['gaps', 'What your Odoo would fill'], ['notes', 'Notes'],
  ];
  const no = id => pad(sections.findIndex(s => s[0] === id) + 1);
  const sec = (id, body, cls = '') => `
<section class="row ${cls}" id="s-${id}" aria-labelledby="h-${id}">
  <div class="lab"><span class="no" aria-hidden="true">${no(id)}</span><h2 id="h-${id}">${esc(sections.find(s => s[0] === id)[1])}</h2></div>
  <div class="body">${body}</div>
</section>`;
  const v2link = (path, text) => `<a class="v2" href="${esc(path)}">${esc(text || `See it in V2: ${V2_NAME[path] || path}`)} <span aria-hidden="true">&rarr;</span></a>`;
  const gapBox = act => {
    const gs = m.gaps.filter(g => g.activity === act); if (!gs.length) return '';
    return `<aside class="gap" aria-label="Not published yet"><p class="gap-k">Not published yet · your Odoo would fill this</p><ul>${gs.map(g => `<li><span class="gap-w">${esc(h.t(g.what))}</span>${g.known ? `<span class="gap-n">${esc(h.t(g.known))}</span>` : ''}<span class="gap-o">${odooList(g)}</span></li>`).join('')}</ul><p class="gap-go">${v2link(gs[0].v2)}</p></aside>`;
  };
  const odooList = g => {
    const list = [].concat(g.odoo || []);
    return list.length ? list.map(x => `<code>${esc(x)}</code>`).join(' ') : (g.odoo_note ? `<span class="gap-p">${esc(h.t(g.odoo_note))}</span>` : '');
  };
  const evRow = (e, reg = true) => `<li><span class="tw"><time datetime="${esc(String(e.start).slice(0, 10))}">${esc(range(e))}</time>${time(e.start) ? `<em>${esc(time(e.start))}</em>` : ''}</span><div><h3><a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a></h3><p class="place">${esc(e.town && e.town !== 'Online' ? `${e.town} · ${short(e.place)}` : short(e.place))}</p>${reg && e.register ? `<p class="reg"><a href="${esc(e.register)}" rel="noopener">Register on their Odoo<span class="vh">: ${esc(e.name)}</span></a></p>` : ''}</div></li>`;
  const lineRow = e => `<li><time datetime="${esc(String(e.start).slice(0, 10))}">${esc(day(e.start))}</time> <a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a>${e.town ? `<span class="lt"> · ${esc(e.town)}</span>` : ''}</li>`;
  // A programme: its summary, the facts that add to it, and the words on its own page, each cited.
  const progBody = p => {
    // Facts that only repeat the summary are left out; two at most, to keep the read short.
    const norm = x => String(x).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const words = x => new Set(norm(x).split(' ').filter(w => w.length > 3));
    const repeats = (a, b) => { const A = words(a), B = words(b); if (!A.size) return true; let n = 0; for (const w of A) if (B.has(w)) n++; return n / A.size > 0.6 || norm(b).includes(norm(a)); };
    const extra = p.facts.filter(f => !f.own && !repeats(f.text, p.summary)).filter((f, i, arr) => !arr.slice(0, i).some(g => repeats(f.text, g.text))).slice(0, 2);
    const own = p.facts.filter(f => f.own);
    const lead = p.summary && !own.some(f => f.text === p.summary) ? `<p>${esc(p.summary)}</p>${cite(p.sources?.length ? p.sources : p.facts.find(f => f.text === p.summary)?.sources)}` : '';
    const more = extra.length ? `<ul class="facts">${extra.map(f => `<li>${esc(f.text)}${cite(f.sources)}</li>`).join('')}</ul>` : '';
    const heads = own.length ? `<p class="ow">Headings on their page: ${own.flatMap(f => f.text.split(/\.\s+/)).filter(Boolean).map(x => `<q>${esc(x.replace(/\.$/, ''))}</q>`).join(', ')}</p>` : '';
    return lead + more + heads + (p.note ? `<p class="ow">Note: ${esc(p.note.replace(/src\/data\/programmes\.json reports/, 'the press reports').replace(/this page says/, 'their page says'))}</p>` : '');
  };
  const short = place => { const p = String(place).split(',').map(s => s.trim()).filter(Boolean); return p.slice(0, 2).join(', '); };

  const today = m.read;
  const upcoming = m.events.filter(e => String(e.start).slice(0, 10) >= today).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const byDateDesc = (a, b) => String(b.start).localeCompare(String(a.start));
  const featured = m.vibathons[0];
  const hackathons = m.vibathons.slice(1).sort(byDateDesc);
  const workshops = [...m.workshops].sort(byDateDesc);
  const handsOn = [...hackathons, ...workshops];
  const incAcc = [...m.programmes.filter(p => p.activity === 'inc-acc'), ...m.programmes.filter(p => p.activity === 'education')];
  const talentProgs = m.programmes.filter(p => !['inc-acc', 'education', 'vibathon', 'challenge-connect'].includes(p.activity));
  const vibProgs = m.programmes.filter(p => p.activity === 'vibathon');
  const ccPages = m.pages.filter(p => p.activity === 'challenge-connect');
  const ccPosts = m.news.filter(p => /\bcall\b|challenge|applications open|looking for|provas de conceito|survey/i.test(p.title));
  const orgCount = m.organisations.length;
  const byKind = Object.entries(m.organisations.reduce((a, x) => ((a[x.kind] = (a[x.kind] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
  const townName = id => (/^algarve/i.test(id) ? 'Region-wide' : (m.munis.find(x => x.id === id)?.name || id));
  const byTown = Object.entries(m.organisations.reduce((a, x) => ((a[x.town] = (a[x.town] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1] || townName(a[0]).localeCompare(townName(b[0])));
  const adiFig = m.adiFig;
  const adiComms = m.communities.filter(c => c.adi), otherComms = m.communities.filter(c => !c.adi);
  const commGroups = list => Object.entries(list.reduce((a, c) => ((a[c.municipality || ''] = a[c.municipality || ''] || []).push(c), a), {}))
    .sort((a, b) => (!a[0] ? 2 : /region/i.test(a[0]) ? 1 : 0) - (!b[0] ? 2 : /region/i.test(b[0]) ? 1 : 0) || a[0].localeCompare(b[0]));
  const commList = list => `<dl class="comms">${commGroups(list).map(([town, cs]) => `<div><dt>${esc(town || 'Town not stated')}</dt><dd>${cs.map(c => `<span class="cm">${c.url ? `<a href="${esc(c.url)}" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}<span class="ck"> ${esc(c.kind)}${c.members ? `, ${h.num(c.members)} members` : ''}</span></span>`).join('')}</dd></div>`).join('')}</dl>${cite([...new Set(list.map(c => c.source).filter(Boolean))])}`;
  const maxKind = Math.max(1, ...byKind.map(x => x[1]));
  const programmeCount = incAcc.length;

  // The hero comes first, so its sources take the first note numbers.
  const heroCite = cite([HUB_NOTE, 'psn', ...(m.org.founded?.sources || [])]);

  const body = [
    sec('hub', `<p class="intro">One hub, four complementary activities, on Odoo. António Guerreiro drew it on a whiteboard on 16 November 2026; this is what each part holds today in published data.</p>
<div class="hubmap">
  <p class="hub-in"><span class="hub-k">In</span> Ideas, needs <span lang="pt">(ideias, necessidades)</span> <span class="hub-arr" aria-hidden="true">&darr;</span> <span class="hub-none">nothing published yet</span></p>
  <ol class="acts">${m.activities.map((a, i) => {
    const stat = { 'inc-acc': `${programmeCount} programmes, ${incAcc.filter(p => p.page).length} with a page on their Odoo`, 'challenge-connect': 'No challenge published yet', vibathon: `${featured ? featured.name : 'Vibathon'}, ${hackathons.length} hackathons and ${workshops.length} workshops on their Odoo`, talent: `${adiComms.length ? `${adiComms.length} ADI communities listed` : `${m.communities.length} communities on record`}, ${orgCount} organisations, ${m.org.partners.length} partners` }[a.id];
    return `<li><a href="#s-${a.id}"><span class="pn">${no('hub')}.${i + 1}</span><strong>${esc(a.name)}</strong><span class="kw" lang="pt">${esc(a.keywords)}</span><span class="gls">${esc(a.gloss)}</span><span class="st${a.id === 'challenge-connect' ? ' st-gap' : ''}">${esc(stat)}</span></a></li>`;
  }).join('')}</ol>
  <p class="hub-base"><span class="hub-k">Base</span> Odoo infrastructure: their website runs on Odoo ${esc(m.odooVersion)}, with ${m.events.length} events and ${m.news.length} recent posts read on ${esc(long(m.read))}${sup(N_SITEMAP)}</p>
</div>${cite(HUB_NOTE)}
${m.hubPage ? `<p class="intro small">Their Odoo already has a page called <a href="${esc(m.hubPage.url)}" rel="noopener">${esc(clean(h.t(m.hubPage.title)).replace(/\s*\|.*$/, ''))}</a>${(m.hubPage.headings || []).length > 1 ? `, with the sections ${(m.hubPage.headings || []).slice(1, 4).map(x => `<q>${esc(clean(x))}</q>`).join(', ')}` : ''}.${sup(N_SITEMAP)}</p>` : ''}`, 'row-hub'),

    sec('ae', `<p class="statement">${esc(m.org.mission)}</p>${cite(m.org.missionSrc)}
<p class="intro">${esc(m.org.lede)}</p>${cite(m.org.ledeSrc)}
<p class="intro small">Their own figures, as reported. Nobody outside has audited them; where two sources differ, both are shown.</p>
<dl class="figs">${m.org.figures.map(f => `<div class="fig"><dt>${esc(f.value)}</dt><dd><span class="fl">${esc(f.label)}</span>${f.note ? `<span class="fn">${esc(f.note)}</span>` : ''}${cite(f.sources)}</dd></div>`).join('')}</dl>`),

    sec('goals', `<ol class="goals">${m.org.goals.map(g => `<li><span class="gk">Target</span><span class="gv">${esc(g.value)}</span><span class="gl">${esc(g.label)}</span></li>`).join('')}</ol>
<p class="flag">${esc(m.org.goalsNote.replace(/\.$/, ''))}</p>${cite(m.org.goalsSrc)}
<figure class="quote"><blockquote><p><span class="qo" aria-hidden="true">“</span>${esc(m.org.quote.text)}<span aria-hidden="true">”</span></p></blockquote>
<figcaption><strong>${esc(m.org.quote.by)}</strong>, ${esc(m.org.quote.role.toLowerCase())} of Algarve Evolution, on the goals for 2032, <time datetime="${esc(m.org.quote.date)}">${esc(long(m.org.quote.date))}</time>.</figcaption></figure>${cite(m.org.quote.sources)}`, 'row-quote'),

    sec('inc-acc', `<p class="intro"><span class="kw" lang="pt">incubação, aceleração, mentores, KPIs</span> The programmes that exist, as published, each with its page on their Odoo where there is one.</p>
<ol class="progs">${incAcc.map((p, i) => `<li${p.activity === 'education' ? ' class="edu"' : ''}><h3><span class="pn">${no('inc-acc')}.${i + 1}</span><span>${esc(p.name)}${p.activity === 'education' ? ' <span class="tagx">Education</span>' : ''}</span></h3>${progBody(p)}${p.page ? `<p class="page"><a href="${esc(p.page)}" rel="noopener">Their page: ${esc(p.page.replace(/^https?:\/\/(www\.)?/, ''))}</a>${sup(N_SITEMAP)}</p>` : ''}</li>`).join('')}</ol>
${gapBox('inc-acc')}`),

    sec('challenge-connect', `<p class="intro"><span class="kw" lang="pt">desafios, fornecedores, matching</span> A company presents a challenge; companies and professionals apply as suppliers; a matching result ranks them. No challenge, application or match has been published yet.</p>
${ccPages.length || ccPosts.length ? `<h3 class="sub">The nearest public things: calls on their Odoo</h3>
<ol class="evs evs-tight">${ccPages.map(p => `<li><span class="tw">Page</span><div><h3><a href="${esc(p.url)}" rel="noopener">${esc(clean(h.t(p.title)))}</a></h3>${p.description ? `<p>${esc(clean(h.t(p.description)))}</p>` : ''}</div></li>`).join('')}${ccPosts.slice(0, 5).map(p => `<li><span class="tw"><time datetime="${esc(p.date)}">${esc(day(p.date))}</time></span><div><h3><a href="${esc(p.url)}" rel="noopener">${esc(p.title)}</a></h3><p class="place">${esc(p.blog)}</p></div></li>`).join('')}</ol>${cite([ccPages.length ? N_SITEMAP : null, ccPosts.length ? N_BLOG : null])}` : ''}
${gapBox('challenge-connect')}`),

    sec('vibathon', `<p class="intro"><span class="kw" lang="pt">hackathons, workshops, júris</span> Days of building, with mentors and a jury.</p>
${featured ? (() => { const fs = featured.facts.filter(f => !f.gap); const [lead, ...rest] = fs; return `<article class="vib"><p class="kick">${esc(featured.date ? day(featured.date) : '')}${featured.place ? ` · ${esc(featured.place)}` : ''}</p><h3>${featured.url ? `<a href="${esc(featured.url)}" rel="noopener">${esc(featured.name)}</a>` : esc(featured.name)}</h3>${lead ? `<p class="vib-lede">${esc(lead.text)}</p>${cite(lead.sources)}` : ''}${(() => { const four = rest.filter(f => !(lead && /sold out/i.test(lead.text) && /sold out/i.test(f.text))).slice(0, 4); return four.length ? `<ul class="facts">${four.map(f => `<li>${esc(f.text)}</li>`).join('')}</ul>${cite(four.flatMap(f => f.sources))}` : ''; })()}${featured.url ? `<p class="page"><a href="${esc(featured.url)}" rel="noopener">Its page on their Odoo</a>${sup(N_EVENTS)}</p>` : ''}</article>`; })() : ''}
${vibProgs.map(p => `<p class="intro small"><strong>${esc(p.name)}.</strong> ${esc(p.summary || p.facts.map(f => f.text).join(' '))}</p>${cite(p.facts.flatMap(f => f.sources))}`).join('')}
<div class="two">
  <div><h3 class="sub">${hackathons.length} hackathons on their Odoo</h3><ol class="lines">${hackathons.map(lineRow).join('')}</ol></div>
  <div><h3 class="sub">${workshops.length} workshops on their Odoo</h3><ol class="lines">${workshops.slice(0, 7).map(lineRow).join('')}</ol>${workshops.length > 7 ? `<p class="more small-more"><a href="${ODOO}/events" rel="noopener">${workshops.length - 7} earlier workshops on their Odoo</a></p>` : ''}</div>
</div>
<p class="intro small">Hackathon and workshop are our reading of each event's name, not a label on their Odoo.</p>${cite(N_EVENTS)}
${gapBox('vibathon')}`),

    sec('talent', `<p class="intro"><span class="kw" lang="pt">talento, competências, parceiros, rede ADI</span> ${adiFig ? `<strong>${esc(h.t(adiFig.value))}</strong> ${esc(h.t(adiFig.label))}, across the region's 16 municipalities (the network's own figures).` : ''}</p>${adiFig ? cite(adiFig.sources) : ''}
${talentProgs.length ? `<h3 class="sub">Network and ecosystem programmes</h3>
<dl class="partners eco">${talentProgs.map(p => `<div><dt>${esc(p.name)}</dt><dd>${esc(p.summary || p.facts.map(f => f.text).join(' '))}${cite([...new Set(p.facts.flatMap(f => f.sources))])}${p.page ? `<p class="page"><a href="${esc(p.page)}" rel="noopener">Their page: ${esc(p.page.replace(/^https?:\/\/(www\.)?/, ''))}</a>${sup(N_SITEMAP)}</p>` : ''}</dd></div>`).join('')}</dl>` : ''}
${adiComms.length ? `<h3 class="sub">The ${adiComms.length} communities on their ADI list, by town</h3>${commList(adiComms)}` : ''}
${otherComms.length ? `<h3 class="sub">${adiComms.length ? `${otherComms.length} more found in public sources` : `${otherComms.length} communities on record, by town`}</h3>${commList(otherComms)}` : ''}
<p class="intro small">The town and the kind of each community are read from its name or its page where the list does not give them.</p>
<h3 class="sub">Partners</h3>
<dl class="partners">${m.org.partners.map(p => `<div><dt>${esc(p.name)}</dt><dd>${esc(p.role)}${cite(p.sources)}</dd></div>`).join('')}</dl>
<h3 class="sub">${orgCount} organisations a founder or a student can turn to</h3>
<p class="intro small">Organisations only, no people. By kind, and by the town each is based in.</p>
<div class="orgs">
  <table class="bars"><caption class="vh">Organisations by kind</caption><thead><tr><th scope="col">Kind</th><th scope="col">Count</th></tr></thead><tbody>${byKind.map(([k, n]) => `<tr><th scope="row">${esc(ORG_KINDS[k] || k)}</th><td><span class="bw"><span class="bar" style="--w:${(n / maxKind * 100).toFixed(1)}%"></span><span class="bn">${n}</span></span></td></tr>`).join('')}</tbody></table>
  <table class="towns"><caption class="vh">Organisations by town</caption><thead><tr><th scope="col">Town</th><th scope="col">Count</th></tr></thead><tbody>${byTown.map(([k, n]) => `<tr><th scope="row">${esc(townName(k))}</th><td>${n}</td></tr>`).join('')}</tbody></table>
</div>${cite(N_ORGS)}
${gapBox('talent')}`),

    sec('coming', `<p class="intro">From their Odoo, as read on ${esc(long(m.read))}: ${upcoming.length} events from that day on. Register on each event's page there.</p>
<ol class="evs">${upcoming.slice(0, 8).map(e => evRow(e)).join('')}</ol>
<p class="more"><a href="${ODOO}/events" rel="noopener">All events on their Odoo</a></p>${cite(N_EVENTS)}`),

    sec('news', `<ol class="evs evs-tight news">${m.news.slice(0, 6).map(p => `<li><span class="tw"><time datetime="${esc(p.date)}">${esc(day(p.date))}</time></span><div><h3><a href="${esc(p.url)}" rel="noopener">${esc(p.title)}</a></h3><p class="place">${esc(p.blog)}</p></div></li>`).join('')}</ol>
<p class="more"><a href="${ODOO}/blog" rel="noopener">The blog on their Odoo</a></p>${cite(N_BLOG)}`),

    sec('story', `<p class="intro">${esc(m.org.storyIntro)}</p>${cite(m.org.storySrc)}
<ol class="tl">${m.org.timeline.map(e => `<li${e.future ? ' class="future"' : ''}><span class="tw">${esc(e.when)}${e.future ? '<em>Next</em>' : ''}</span><div><h3>${esc(e.title)}</h3><p>${esc(e.text)}${e.stat ? ` <span class="stat">${esc(e.stat)}</span>` : ''}</p>${cite(e.sources)}</div></li>`).join('')}</ol>`),

    sec('gaps', `<p class="intro">What is not published yet. Each gap names the records in the hub's Odoo addon that would hold it, and links to the V2 page that shows what it could look like. Getting this data into Odoo is the first piece of work.</p>
<ol class="gaps">${m.gaps.map((g, i) => { const a = m.activities.find(x => x.id === g.activity); return `<li><span class="sn" aria-hidden="true">${i + 1}</span><div><p class="gp-k">${esc(a ? a.name : 'The hub')}</p><p class="gp-w">${esc(h.t(g.what))}</p>${g.known ? `<p class="gp-n">${esc(h.t(g.known))}</p>` : ''}<p class="gp-o">${odooList(g)}</p><p class="gp-v2">${v2link(g.v2)}</p></div></li>`; }).join('')}</ol>`),
  ];

  const hero = `
<header class="hero" id="top">
  <p class="kicker"><span>Algarve Evolution</span><span>Faro, Algarve</span><span>Real data, read ${esc(day(m.read))}</span></p>
  <h1>AE Innovation Hub</h1>
  <p class="deck">Four activities on one Odoo, told only with what is published.</p>
  <div class="row row-hero">
    <div class="lab"><span class="no" aria-hidden="true">00</span><h2 id="h-two">In two minutes</h2></div>
    <div class="body"><p class="lede">Algarve Evolution, a Faro association begun in 2018, is setting up the AE Innovation Hub: incubation and acceleration, Challenge Connect, Vibathon and the Talent Ecosystem, all on its Odoo. Here is what each part holds in published data, every fact with a numbered note. Where nothing is published yet, the page says so and names the Odoo records that would fill the gap.</p>__HERO_CITE__</div>
    <nav class="toc" aria-label="Contents"><h2>Contents</h2><ol>${sections.map(([id, title], i) => `<li><a href="#s-${id}"><span>${pad(i + 1)}</span>${esc(title)}</a></li>`).join('')}</ol></nav>
  </div>
</header>`;
  const main = body.join('\n');

  const notesHtml = sec('notes', `<p class="intro">Each number in the text points here. Each note links to the page where the fact was read.</p>
<ol class="notes">${notes.map((d, i) => {
    const s = (d.url && srcByUrl.get(d.url)) || d;
    const title = s.title || d.title || (d.url ? d.url.replace(/^https?:\/\/(www\.)?/, '') : '');
    return `<li id="n${i + 1}"><span>${d.url ? `<a href="${esc(d.url)}" rel="noopener">${esc(title)}</a>` : esc(title)}. ${esc(s.publisher || d.publisher || '')}${s.published ? `, published ${esc(long(s.published))}` : ''}${(s.read || d.read) ? `; read ${esc(long(s.read || d.read))}` : ''}.${d.extra ? ` <span class="pc">${esc(d.extra)}</span>` : ''}${d.url ? `<span class="url" aria-hidden="true">${esc(d.url)}</span>` : ''}</span></li>`;
  }).join('')}</ol>`, 'row-notes');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AE Innovation Hub: The Brief</title>
<meta name="description" content="The AE Innovation Hub of Algarve Evolution in two minutes, from real, published data only, each fact with its source.">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#faf9f6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)">
${chrome.head}
<link rel="preload" href="/v3/brief/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/v3/brief/style.css">
</head>
<body class="brief">
${chrome.banner}
<a class="skip" href="#main">Skip to content</a>
<div class="mast"><div class="wrap mast-in">
  <a class="mark" href="#top">AE Innovation Hub</a>
  <p class="mast-t"><span>${esc(meta.name)}</span> <span class="mast-sub">${esc(meta.tagline)}</span></p>
  <nav class="mast-apps" aria-label="Jump to">
    <a class="app" href="#s-coming">Coming up</a><a class="app" href="#s-gaps">What Odoo would fill</a>
  </nav>
</div></div>
<main id="main" class="wrap">
${hero.replace('__HERO_CITE__', heroCite)}
${main}
${notesHtml}
</main>
<footer class="foot"><div class="wrap foot-in">
  <p class="foot-mark">AE Innovation Hub <span>${esc(meta.name)} · V3, real data only</span></p>
  <div class="foot-text">
    <p><strong>${esc(h.t(ctx.data.voice.banner))}</strong> <a href="${ODOO}/" rel="noopener">${esc(h.t(ctx.data.voice.banner_link))}</a>.</p>
    <p>V3 shows only what Algarve Evolution and the press have published. V2 shows what the hub could be, with simulated records marked as such: <a href="/">open V2</a>.</p>
    <p class="small">Version ${esc(chrome.version)} · Code Apache-2.0; text CC BY 4.0. Set in Inter (SIL Open Font License 1.1). · <a href="#top">Back to the top</a></p>
  </div>
</div></footer>
${chrome.foot}
</body>
</html>`;
  return html;
}
