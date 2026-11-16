// V3 "The Future": the AE Innovation Hub as a dark, cinematic scroll story, told with real data only.
// Built from V1's The Future (v1-source/scripts/designs/future.mjs), which António Guerreiro picked on 16 November 2026.
// Reads ctx.real (src/feeds/real.json, contract docs/v3/REAL-FEED.md); every fact links to its source.
// The six images are V1's AI-generated illustrations (src/v3/future/img/README.md), each captioned as such.
// Fonts: src/v3/future/fonts/README.md. English only. Code Apache-2.0; text and images CC BY 4.0.
// Made by sites-design@AgentiCCells.dinis, 16 November 2026.

import { readFileSync, existsSync } from 'node:fs';

export const meta = { slug: 'future', order: 4, name: 'The Future', tagline: 'Cinematic, with real data' };

const ACT_COLOUR = { 'inc-acc': '#ffb547', 'challenge-connect': '#ff6f4f', vibathon: '#52e5d6', talent: '#a9b8ff' };
const ACT_ORDER = ['inc-acc', 'challenge-connect', 'vibathon', 'talent'];
const ACT_SHORT = { 'inc-acc': 'INC/ACC', 'challenge-connect': 'Challenge Connect', vibathon: 'Vibathon', talent: 'Talent Ecosystem' };
const KIND = { hackathon: ['Hackathons and buildathons', '#52e5d6'], workshop: ['Workshops and training', '#ffb547'], summit: ['Summits, fairs and conferences', '#ff6f4f'], meetup: ['Meetups and community', '#a9b8ff'], other: ['Other', '#7d869e'] };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// The fallback guesses, used only where the real feed leaves a field out. Each is named on the page where it shows.
const guessKind = name => {
  const n = fold(name);
  if (/hackathon|vibathon|buildathon|build day|game jam/.test(n)) return 'hackathon';
  if (/workshop|masterclass|bootcamp|training|formacao|curso|clinic|webinar|academy/.test(n)) return 'workshop';
  if (/summit|forum|conference|congress|fair|feira|expo|web summit|transfiere|gathering|awards|festival/.test(n)) return 'summit';
  if (/meetup|meet up|afterwork|after work|grow algarve|networking|breakfast|community|comunidade|talk|drinks|meeting/.test(n)) return 'meetup';
  return 'other';
};
const LOCALITY = { gambelas: 'faro', penha: 'faro', alvor: 'portimao', 'mexilhoeira grande': 'portimao', almancil: 'loule', quarteira: 'loule', vilamoura: 'loule', parchal: 'lagoa', carvoeiro: 'lagoa', alcantarilha: 'silves', 'armacao de pera': 'silves', sagres: 'vila-do-bispo', altura: 'castro-marim', 'monte gordo': 'vila-real-de-santo-antonio', 'santa luzia': 'tavira', fuseta: 'olhao', 'odeceixe': 'aljezur' };

// Until src/feeds/real.json exists: the same kinds of real records, read from the sourced files they will come from.
const readJson = f => { try { return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { return null; } };
const PROG_ACT = { founder2founder: 'inc-acc', incubator: 'inc-acc', 'startup-showcase': 'inc-acc', 'inova-algarve-3': 'inc-acc', buildathons: 'vibathon', 'algarve-digital-innovators': 'talent', 'algarve-tech-hub-summit': 'talent', 'ccdr-digital-platform': 'talent' };
const fallbackProgrammes = d => d.programmes.pillars.flatMap(p => p.programmes.map(g => ({ id: g.id, name: g.name.en, activity: PROG_ACT[g.id] || 'education', summary: g.summary.en, facts: g.sources.slice(0, 1).map(u => ({ text: 'Reported by', source: u })) })));
const FALLBACK_GAPS = [
  { activity: 'inc-acc', what: 'Startups in each programme and their KPIs from month 0 to 6', odoo: ['aih.programme.company', 'aih.kpi'], v2: '/inc-acc/' },
  { activity: 'inc-acc', what: 'Mentors and their sessions with each company', odoo: ['res.partner', 'aih.session'], v2: '/inc-acc/' },
  { activity: 'challenge-connect', what: 'Challenges, supplier applications and the matching result', odoo: ['aih.challenge', 'aih.application'], v2: '/challenge-connect/' },
  { activity: 'vibathon', what: 'Vibathon projects, the jury and their scores', odoo: ['aih.project', 'aih.vibathon.jury', 'aih.project.score'], v2: '/vibathon/' },
  { activity: 'talent', what: 'The people in each community, by skill, with their consent', odoo: ['res.partner', 'aih.skill', 'aih.community'], v2: '/talent/' },
];

function feedFrom(ctx) {
  const r = ctx.real && !ctx.real.missing && ctx.real.hub ? ctx.real : null;
  const d = ctx.data;
  const munis = (r?.places?.municipalities?.length ? r.places : d.places).municipalities;
  const outline = (r?.places?.outline?.countries ? r.places : d.places).outline;
  const muniOf = text => {
    const t = ' ' + fold(text).replace(/[^a-z0-9]+/g, ' ') + ' ';
    for (const m of [...munis].sort((a, b) => b.name.length - a.name.length)) if (t.includes(' ' + fold(m.name).replace(/[^a-z0-9]+/g, ' ') + ' ')) return m.id;
    for (const [k, id] of Object.entries(LOCALITY)) if (t.includes(' ' + k + ' ')) return id;
    return null;
  };
  const odooEvents = (r?.events || d.odoo.events.map(e => ({ ...e, source: e.url }))).map(e => ({
    ...e, kind: e.kind === 'conference' ? 'summit' : (KIND[e.kind] ? e.kind : guessKind(e.name)), town: e.town !== undefined ? (munis.find(m => m.id === e.town || fold(m.name) === fold(e.town))?.id || null) : (muniOf(e.place) || muniOf(e.name)), kindGuessed: !e.kind,
  }));
  const fig = id => (r?.organisation?.figures || []).find(f => f.id === id) || d.figures.figures.find(f => f.id === id);
  const quote = d.people.quotes[0];
  const person = d.people.people.find(p => p.id === quote.by);
  const org = r?.organisation || {};
  return {
    isReal: !!r,
    built: String(r?.meta?.built || d.odoo.read).slice(0, 10),
    odooSource: r?.meta?.sources?.odoo || `${d.odoo.odoo ? d.odoo.source : 'https://www.algarveevolution.pt'} (Odoo ${d.odoo.odoo}, read ${d.odoo.read})`,
    odooVersion: r?.meta?.odoo?.version || d.odoo.odoo,
    classification: r?.meta?.classification || '',
    activities: ACT_ORDER.map(id => (r?.hub?.activities || []).find(a => a.id === id) || { id, name: ACT_SHORT[id], keywords: '', summary: '' }),
    hubName: r?.hub?.name || 'AE Innovation Hub',
    org,
    goals: (org.goals?.length ? org.goals : d.voice.goals).map(g => ({ value: String(g.value), label: typeof g.label === 'object' ? g.label.en : g.label, sources: g.sources })),
    goalSources: org.goals_sources || org.goals?.flatMap(g => g.sources || []).filter(Boolean) || d.voice.goals_sources,
    quote: org.quote?.text ? org.quote : { text: quote.text.en, date: quote.date, sources: quote.sources, by: person.name, role: person.role.en },
    person,
    fig,
    programmes: r?.programmes || fallbackProgrammes(d),
    pages: r?.pages || [],
    events: odooEvents,
    news: (r?.news || d.odoo.posts).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))),
    vibathons: r?.vibathons || d.events.events.filter(e => /vibathon|buildathon|hackathon/i.test(e.name.en)).map(e => ({ name: e.name.en, date: e.start, place: e.place.en, facts: [{ text: e.summary.en, source: e.sources[0] }] })),
    communities: (r?.communities || readJson('src/feeds/public.json')?.communities?.filter(c => c.simulated === false) || []).map(c => ({ ...c, mid: munis.find(m => m.id === c.municipality || fold(m.name) === fold(c.municipality))?.id || null })),
    organisations: (r?.organisations || readJson('v1-source/src/talent-map/data/organisations.json')?.organisations || []).map(o => ({ ...o, mid: munis.find(m => m.id === o.town || fold(m.name) === fold(o.town))?.id || null })),
    munis, outline,
    gaps: r?.gaps || FALLBACK_GAPS,
    sources: r?.meta?.sources || {},
  };
}

export function render(ctx) {
  const { data, h, chrome, self } = ctx;
  const { esc } = h;
  const F = feedFrom(ctx);
  const eco = data.ecosystem;
  const used = new Map();
  const cite = (refs, cls) => { const list = [].concat(refs || []).filter(Boolean).map(x => (typeof x === 'object' ? x.url || x.source : x)).filter(Boolean); for (const x of list) { const s = h.source(x); used.set(s.url, s); } return h.cite(list, cls); };
  const D = iso => h.date(String(iso).slice(0, 10));
  const words = s => esc(s).split(' ').map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');
  const AI = 'AI-generated illustration';
  const img = (name, alt, cls = '', eager = false) => `<img class="${cls}" src="/v3/future/img/${name}.webp" width="1376" height="768" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
  const cap = text => `<p class="cap"><span class="cap-tag">${AI}</span> ${esc(text)}</p>`;
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
  const today = F.built;
  const rad = d => d * Math.PI / 180;
  const P = (r, a) => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
  const f1 = n => n.toFixed(1);
  const odooHome = 'https://www.algarveevolution.pt/';
  const actName = id => ACT_SHORT[id] || id;

  // ---------- What is real, per activity ----------
  const progBy = id => F.programmes.filter(p => p.activity === id);
  const evBy = id => F.events.filter(e => e.activity === id);
  const pagesBy = id => F.pages.filter(p => p.activity === id);
  const gapsBy = id => F.gaps.filter(g => g.activity === id);
  const hackathons = F.events.filter(e => e.kind === 'hackathon');
  const algarveOrgs = F.organisations.length;
  const realCount = {
    'inc-acc': [[progBy('inc-acc').length, 'programme'], [evBy('inc-acc').length, 'event in their Odoo', 'events in their Odoo']],
    'challenge-connect': [[progBy('challenge-connect').length, 'programme'], [evBy('challenge-connect').length, 'event in their Odoo', 'events in their Odoo']],
    vibathon: [[F.vibathons.length, 'hackathon with a public record', 'hackathons with a public record'], [Math.max(evBy('vibathon').length, hackathons.length), 'hackathon in their Odoo', 'hackathons in their Odoo']],
    talent: [[F.communities.length, 'community', 'communities'], [algarveOrgs, 'organisation mapped', 'organisations mapped']],
  };

  // ---------- 01 The hub: four activities on Odoo ----------
  const hubIcon = {
    'inc-acc': '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 32 18 20l6 6 10-14"/><path d="M27 12h7v7"/></svg>',
    'challenge-connect': '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="10" cy="20" r="5"/><circle cx="30" cy="10" r="4"/><circle cx="30" cy="20" r="4"/><circle cx="30" cy="30" r="4"/><path d="M15 20h11M14 17l12-6M14 23l12 6"/></svg>',
    vibathon: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="9" width="28" height="18" rx="2"/><path d="M3 31h34M15 15l-4 3 4 3M25 15l4 3-4 3"/></svg>',
    talent: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="4"/><circle cx="8" cy="10" r="3"/><circle cx="33" cy="12" r="3"/><circle cx="9" cy="31" r="3"/><circle cx="31" cy="31" r="3"/><path d="M17 18 10 12M23 18l8-5M17 23l-6 6M23 23l6 6"/></svg>',
  };
  const pageTitle = p => String(p.title || p.path).replace(/\s*\|\s*Algarve Evolution\s*$/, '').trim();
  const pageLinks = id => { const seen = new Set(); const list = pagesBy(id).filter(p => p.path !== '/hub' && !/^\/(forum|helpdesk|slides|calendar|appointment)/.test(p.path)).filter(p => { const t = fold(pageTitle(p)); if (seen.has(t)) return false; seen.add(t); return true; }); return list.length ? `<p class="act-pages"><span>On their Odoo</span>${list.map(p => `<a href="${esc(p.url)}" rel="noopener">${esc(pageTitle(p))}</a>`).join('')}</p>` : ''; };
  const hubPage = F.pages.find(p => p.path === '/hub');
  const has = re => F.pages.some(p => re.test(p.path));
  const apps = [['Website', `${F.pages.length || ''} public pages`.trim(), F.pages.length > 0], ['Events', `${F.events.length} events`, F.events.length > 0], ['Blog', `${F.news.length} posts`, F.news.length > 0], ['Helpdesk', 'members and support', has(/^\/helpdesk/)], ['Forum', 'questions and answers', has(/^\/forum/)], ['eLearning', 'courses', has(/^\/slides/)], ['Appointments', 'business clinic', has(/^\/appointment/)], ['Shop', 'products', has(/^\/shop/)]].filter(x => x[2]);
  const hubCards = F.activities.map((a, i) => {
    const c = ACT_COLOUR[a.id];
    const counts = realCount[a.id].map(([n, one, many]) => `<li><b class="cnt" data-to="${n}">${n}</b> ${esc(n === 1 ? one : (many || one + 's'))}</li>`).join('');
    const empty = realCount[a.id].every(([n]) => !n);
    return `<li class="act rv" style="--c:${c};--d:${i}"><span class="act-ic">${hubIcon[a.id]}</span><p class="act-no">0${i + 1}</p><h3>${esc(a.name || actName(a.id))}</h3>${a.keywords ? `<p class="act-kw" lang="pt"><span class="sr" lang="en">António's keywords, in Portuguese: </span>${esc(a.keywords)}</p>${a.keywords_en ? `<p class="act-kwe">${esc(a.keywords_en)}</p>` : ''}` : ''}${a.summary ? `<p class="act-sum">${esc(a.summary)}</p>` : ''}<p class="act-real">Real and public today</p><ul class="act-counts${empty ? ' none' : ''}">${counts}</ul>${empty ? '<p class="act-gap">No public records yet. <a href="#gaps">Your Odoo would fill this</a>.</p>' : ''}${pageLinks(a.id)}</li>`;
  }).join('');
  const odooLine = `${F.odooVersion ? `Odoo ${esc(F.odooVersion)}` : 'Odoo'} already runs algarveevolution.pt: ${esc(plural(F.events.length, 'event'))} and ${esc(plural(F.news.length, 'news post'))} read from it on ${esc(D(today))}.`;

  // ---------- 03 Growth: members over time, from the sources ----------
  const G = { w: 900, h: 420, l: 56, r: 30, t: 40, b: 56, x0: 2018, x1: 2027.2, y1: 130 };
  const gx = x => G.l + (x - G.x0) / (G.x1 - G.x0) * (G.w - G.l - G.r);
  const gy = y => G.h - G.b - y / G.y1 * (G.h - G.t - G.b);
  const memSrc = F.fig('members').sources;
  const pts = [
    { t: 2019.7, y: 29, label: 'about 29', what: 'ICT companies, presented in Faro, Sep 2019', src: 'pres19' },
    { t: 2024.53, y: 70, label: 'about 70', what: 'companies and individuals, Jul 2024', src: 'pres24' },
    { t: 2026.83, y: 106, label: '106', what: 'active members on its own site, 31 Oct 2026', src: memSrc[0] },
    { t: 2026.84, y: 118, label: '118', what: 'active members as reported, 1 Nov 2026', src: 'psn' },
  ];
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${f1(gx(p.t))},${f1(gy(p.y))}`).join(' ');
  const area = `${line} L${f1(gx(pts.at(-1).t))},${gy(0)} L${f1(gx(pts[0].t))},${gy(0)} Z`;
  const growthSvg = `<svg class="growth" viewBox="0 0 ${G.w} ${G.h}" role="img" aria-labelledby="growth-t growth-d">
  <title id="growth-t">Members over time</title><desc id="growth-d">${esc(pts.map(p => `${p.label}: ${p.what}`).join('; '))}</desc>
  <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#52e5d6" stop-opacity=".45"/><stop offset="1" stop-color="#52e5d6" stop-opacity="0"/></linearGradient>
  <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb547"/><stop offset=".6" stop-color="#ff6f4f"/><stop offset="1" stop-color="#52e5d6"/></linearGradient></defs>
  ${[0, 30, 60, 90, 120].map(y => `<line class="grid" x1="${G.l}" x2="${G.w - G.r}" y1="${gy(y)}" y2="${gy(y)}"/><text class="ax" x="${G.l - 12}" y="${gy(y) + 5}" text-anchor="end">${y}</text>`).join('')}
  ${[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].map(y => `<text class="ax${y % 2 ? ' odd' : ''}" x="${gx(y)}" y="${G.h - G.b + 30}" text-anchor="middle">${y}</text><line class="tick" x1="${gx(y)}" x2="${gx(y)}" y1="${gy(0)}" y2="${gy(0) + 6}"/>`).join('')}
  <circle class="seed" cx="${gx(2018)}" cy="${gy(0)}" r="7"/><text class="ann" x="${gx(2018) + 12}" y="${gy(0) - 14}">2018: the community begins</text>
  <path class="area" d="${area}" fill="url(#gArea)"/><path class="ln" d="${line}" pathLength="1" stroke="url(#gLine)"/>
  ${pts.map((p, i) => `<g class="pt" style="--d:${i}"><circle cx="${gx(p.t)}" cy="${gy(p.y)}" r="${i > 1 ? 8 : 9}"/><text class="pv" x="${gx(p.t) + (i > 1 ? -20 : 0)}" y="${gy(p.y) + (i === 2 ? 12 : -20)}" text-anchor="${i > 1 ? 'end' : 'middle'}">${esc(p.label)}</text></g>`).join('')}
</svg>`;
  const figText = (id, k) => { const v = F.fig(id)?.[k]; return v && typeof v === 'object' ? v.en : v || ''; };
  const stat = (id, pre, value, count, unit, cls = '') => `<div class="stat rv ${cls}"><p class="sv">${pre ? `<span class="spre">${esc(pre)}</span>` : ''}<span class="cnt" data-to="${count}">${esc(value)}</span>${unit ? `<span class="su">${esc(unit)}</span>` : ''}</p><p class="sl">${esc(figText(id, 'label'))}</p>${figText(id, 'note') ? `<p class="sn">${esc(figText(id, 'note'))}</p>` : ''}${cite(F.fig(id).sources)}</div>`;

  // ---------- 04 Programmes, by activity: a radial drawn from the feed ----------
  const arc = (r0, r1, a0, a1) => {
    const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1), [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0);
    const lg = a1 - a0 > 180 ? 1 : 0;
    return `M${f1(x0)},${f1(y0)} A${r1},${r1} 0 ${lg} 1 ${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)} A${r0},${r0} 0 ${lg} 0 ${f1(x3)},${f1(y3)} Z`;
  };
  const factList = (facts, summary) => { const list = (facts || []).filter(x => x.text && x.text !== summary); for (const x of facts || []) if (x.text === summary) cite(x.sources || x.source); return list.length ? `<ul class="facts">${list.map(x => `<li>${x.own_words ? `Their page: “${esc(x.text)}”` : esc(x.text)} ${cite(x.sources || x.source, 'src src-in')}</li>`).join('')}</ul>` : (facts || []).length ? cite(facts.flatMap(x => x.sources || x.source)) : ''; };
  const progGroups = ACT_ORDER.map(id => ({ id, list: progBy(id) }));
  const other = F.programmes.filter(p => !ACT_ORDER.includes(p.activity));
  if (other.length) progGroups.push({ id: 'other', list: other });
  const radialGroups = progGroups.filter(g => g.id !== 'other');
  let n = 0;
  const numberOf = new Map();
  for (const g of progGroups) for (const p of g.list) numberOf.set(p, ++n);
  const radial = radialGroups.map((g, i) => {
    const c = ACT_COLOUR[g.id];
    const a0 = -135 + i * 90 + 3, a1 = a0 + 84, mid = (a0 + a1) / 2;
    const k = g.list.length;
    const nodes = g.list.map((p, j) => {
      const a = a0 + 10 + (a1 - a0 - 20) * (k === 1 ? 0.5 : j / (k - 1));
      const [x, y] = P(250, a), [sx, sy] = P(172, a); const no = numberOf.get(p);
      return `<g class="pn" data-n="${no}"><line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(x)}" y2="${f1(y)}" stroke="${c}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${k > 5 ? 19 : 25}" stroke="${c}"/><text x="${f1(x)}" y="${f1(y + 6)}" text-anchor="middle">${String(no).padStart(2, '0')}</text></g>`;
    }).join('');
    const low = mid > 0 && mid < 180, r = 133;
    const [ax0, ay0] = P(r, low ? a1 - 4 : a0 + 4), [ax1, ay1] = P(r, low ? a0 + 4 : a1 - 4);
    const tp = `M${f1(ax0)},${f1(ay0)} A${r},${r} 0 0 ${low ? 0 : 1} ${f1(ax1)},${f1(ay1)}`;
    const [ex, ey] = P(232, mid);
    return `<path class="pa${k ? '' : ' empty'}" d="${arc(98, 168, a0, a1)}" ${k ? `fill="${c}"` : `stroke="${c}"`}/><path id="pp-${i}" d="${tp}" fill="none"/><text class="pl${k ? '' : ' pl-empty'}"${k ? '' : ` style="fill:${c}"`}><textPath href="#pp-${i}" startOffset="50%" text-anchor="middle" dominant-baseline="central">${esc(actName(g.id))}</textPath></text>${k ? nodes : `<text class="pe" x="${f1(ex)}" y="${f1(ey)}" text-anchor="middle" fill="${c}">none public yet</text>`}`;
  }).join('');
  const radialSvg = `<svg class="radial" viewBox="-300 -300 600 600" role="img" aria-label="${esc(`The hub's four activities and their ${F.programmes.length} real programmes, numbered as in the list${radialGroups.filter(g => !g.list.length).map(g => `; ${actName(g.id)} has none public yet`).join('')}`)}">
  <circle class="orb" r="290"/><circle class="orb" r="250" stroke-dasharray="2 8"/>${radial}
  <circle class="core" r="84"/><text class="ct" y="-6" text-anchor="middle">AE</text><text class="ct ct2" y="20" text-anchor="middle">Innovation Hub</text>
</svg>`;
  const progList = progGroups.map(g => {
    const c = ACT_COLOUR[g.id] || '#7d869e';
    const body = g.list.length
      ? `<ol>${g.list.map(p => `<li data-n="${numberOf.get(p)}"><span class="no">${String(numberOf.get(p)).padStart(2, '0')}</span><div><h4>${esc(p.name)}</h4>${p.summary ? `<p>${esc(p.summary)}</p>` : ''}${factList(p.facts, p.summary)}${p.page ? `<p class="odoo-link"><a href="${esc(p.page)}" rel="noopener">Its page on their Odoo</a></p>` : ''}</div></li>`).join('')}</ol>`
      : `<p class="pg-none">No public programme yet. <a href="#gaps">What your Odoo would fill</a>.</p>`;
    return `<div class="pg" style="--c:${c}"><h3><span class="dot"></span>${esc(g.id === 'other' ? 'Other programmes' : actName(g.id))}</h3>${body}</div>`;
  }).join('');
  const inova = F.programmes.find(p => /inova/i.test(p.name));

  // ---------- 05 Ecosystem network (src/data/ecosystem.json, each node sourced) ----------
  const keep = { inner: ['education', 'aths', 'adi', 'venture', 'grow', 'incubator', 'f2f', 'inova', 'ws25'], outer: ['ja', 'ualg', 'stp', 'munis', 'amal', 'nera', 'anje', 'startupPt'] };
  const angle = { education: -162, aths: -126, adi: -90, venture: -54, ws25: -18, incubator: 36, f2f: 82, inova: 126, grow: 168, ja: -178, ualg: -146, stp: -116, munis: -90, amal: -64, nera: -38, anje: 2, startupPt: 42 };
  const nodeShort = { ualg: 'University of the Algarve', inova: 'INOVA Algarve 3.0' };
  const node = id => eco.nodes.find(x => x.id === id);
  const label = id => nodeShort[id] || node(id).label;
  const pos = { ae: [0, 0] };
  for (const id of keep.inner) pos[id] = P(175, angle[id]);
  for (const id of keep.outer) pos[id] = P(300, angle[id]);
  const shown = new Set(Object.keys(pos));
  const links = eco.links.filter(([a, b]) => shown.has(a) && shown.has(b));
  const netSvg = `<svg class="net" viewBox="-560 -350 1120 680" role="img" aria-label="The network: programmes and summits on the inner ring, partners on the outer ring">
  <circle class="orb" r="175"/><circle class="orb" r="300" stroke-dasharray="2 10"/>
  ${links.map(([a, b, r], i) => `<path class="lk${a === 'ae' ? ' lk0' : ''}" data-a="${a}" data-b="${b}" style="--i:${i}" d="M${f1(pos[a][0])},${f1(pos[a][1])} Q${f1((pos[a][0] + pos[b][0]) * 0.42)},${f1((pos[a][1] + pos[b][1]) * 0.42)} ${f1(pos[b][0])},${f1(pos[b][1])}"><title>${esc(label(a))}: ${esc(r)} ${esc(label(b))}</title></path>`).join('')}
  ${Object.entries(pos).map(([id, [x, y]]) => {
    const k = node(id).kind; const right = x > 8, left = x < -8;
    const anchor = id === 'ae' ? 'middle' : right ? 'start' : left ? 'end' : 'middle';
    const dx = id === 'ae' ? 0 : right ? 18 : left ? -18 : 0, dy = id === 'ae' ? 0 : (!right && !left) ? (y < 0 ? -22 : 34) : 6;
    return `<g class="nd nd-${k}" data-id="${id}"><circle cx="${f1(x)}" cy="${f1(y)}" r="${id === 'ae' ? 54 : k === 'programme' || k === 'summit' ? 11 : 9}"/>${id === 'ae' ? '<text class="ct" x="0" y="-4" text-anchor="middle">Algarve</text><text class="ct" x="0" y="20" text-anchor="middle">Evolution</text>' : `<text class="lbl" x="${f1(x + dx)}" y="${f1(y + dy)}" text-anchor="${anchor}">${esc(label(id))}</text>`}</g>`;
  }).join('')}
</svg>`;
  const partnerList = keep.outer.map(id => `<li><strong>${esc(label(id))}</strong><span>${links.filter(([a, b]) => a === id || b === id).map(([a, b, r]) => `${esc(label(a === id ? b : a))} <em>(${esc(r)})</em>`).join(', ')}</span></li>`).join('');
  const netSrc = [...new Set(['ae', ...keep.inner, ...keep.outer].map(id => node(id).src))];

  // ---------- 06 The 16 municipalities: organisations, ADI communities and Odoo events ----------
  const M = { lon0: -9.02, lat0: 37.56, k: 600, c: Math.cos(rad(37.2)) };
  const mx = lon => (lon - M.lon0) * M.c * M.k, my = lat => (M.lat0 - lat) * M.k;
  const poly = rings => rings.map(r => r.map(ring => ring.map(([lo, la], i) => `${i ? 'L' : 'M'}${f1(mx(lo))},${f1(my(la))}`).join(' ')).join(' ')).join(' ');
  const munis = F.munis;
  const mp = Object.fromEntries(munis.map(m => [m.id, [mx(m.ll[0]), my(m.ll[1])]]));
  const orgsIn = id => F.organisations.filter(o => o.mid === id).length;
  const comsIn = id => F.communities.filter(c => c.mid === id);
  const evIn = id => F.events.filter(e => e.town === id).length;
  const regionOrgs = F.organisations.filter(o => !o.mid).length;
  const regionComs = F.communities.filter(c => !c.mid);
  const maxOrg = Math.max(1, ...munis.map(m => orgsIn(m.id)));
  const lab = { faro: [0, 30, 'middle'], olhao: [12, 26, 'start'], 'sao-bras-de-alportel': [10, -14, 'start'], loule: [-12, -12, 'end'], tavira: [0, 30, 'middle'], 'vila-real-de-santo-antonio': [14, 18, 'start'], 'castro-marim': [14, -6, 'start'], alcoutim: [14, 5, 'start'], albufeira: [0, 30, 'middle'], lagoa: [4, 30, 'middle'], portimao: [-10, -16, 'end'], silves: [12, -12, 'start'], lagos: [0, 30, 'middle'], 'vila-do-bispo': [-6, 30, 'middle'], aljezur: [14, 5, 'start'], monchique: [14, 5, 'start'] };
  const rOf = id => 4 + Math.sqrt(orgsIn(id) / maxOrg) * 16;
  const mapSvg = `<svg class="map" viewBox="0 0 880 380" role="img" aria-labelledby="map-t map-d">
  <title id="map-t">The 16 municipalities of the Algarve</title>
  <desc id="map-d">${esc(munis.map(m => `${m.name}: ${plural(orgsIn(m.id), 'organisation')}, ${plural(comsIn(m.id).length, 'community', 'communities')}, ${plural(evIn(m.id), 'event')}`).join('; '))}</desc>
  <path class="land es" d="${poly(F.outline.countries.Spain)}"/><path class="land pt" d="${poly(F.outline.countries.Portugal)}"/>
  ${munis.map((m, i) => { const [x, y] = mp[m.id]; const r = rOf(m.id); const cs = comsIn(m.id); return `<g class="mu${m.id === 'faro' ? ' hq' : ''}" style="--i:${i}"><circle class="mo" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/><circle class="mc" cx="${f1(x)}" cy="${f1(y)}" r="3"/>${cs.map((c, j) => { const [cx, cy] = P(r + 7, -90 + j * 40); return `<circle class="cm" cx="${f1(x + cx)}" cy="${f1(y + cy)}" r="4"><title>${esc(c.name)}</title></circle>`; }).join('')}</g>`; }).join('')}
  ${munis.map(m => { const [x, y] = mp[m.id]; const [dx, dy, an] = lab[m.id] || [0, 24, 'middle']; const yy = y + dy + (dy > 0 ? rOf(m.id) - 8 : -(rOf(m.id) - 8) * (dy < -8 ? 1 : 0)); return `<text class="ml" x="${f1(x + dx)}" y="${f1(yy)}" text-anchor="${an}">${m.id === 'vila-real-de-santo-antonio' ? `Vila Real de<tspan x="${f1(x + dx)}" dy="17">Santo António</tspan>` : esc(m.name)}<tspan class="mn" x="${f1(x + dx)}" dy="16">${orgsIn(m.id)}</tspan></text>`; }).join('')}
  <text class="sea" x="250" y="356">Atlantic Ocean</text><text class="sea" x="860" y="120" text-anchor="end">Spain</text>
</svg>`;
  const muniRows = munis.map(m => ({ m, o: orgsIn(m.id), c: comsIn(m.id), e: evIn(m.id) })).sort((a, b) => b.o - a.o || b.e - a.e || a.m.name.localeCompare(b.m.name));
  const maxE = Math.max(1, ...muniRows.map(r => r.e));
  const muniTable = `<table class="mtab"><caption class="sr">Organisations, communities and Odoo events in each municipality</caption><thead><tr><th scope="col">Municipality</th><th scope="col">Organisations</th><th scope="col">ADI communities</th><th scope="col">Events in their Odoo</th></tr></thead><tbody>${muniRows.map(r => `<tr${r.m.id === 'faro' ? ' class="hq"' : ''}><th scope="row">${esc(r.m.name)}</th><td><span class="bar bo" style="--w:${(r.o / maxOrg * 100).toFixed(0)}%"></span><span class="bn">${r.o}</span></td><td>${r.c.length ? `<span class="bn">${r.c.length}</span> <span class="cn">${r.c.map(c => (c.source ? `<a href="${esc(c.source)}" rel="noopener">${esc(c.name)}</a>` : esc(c.name))).join(', ')}</span>` : '<span class="zero">0</span>'}</td><td><span class="bar be" style="--w:${(r.e / maxE * 100).toFixed(0)}%"></span><span class="bn">${r.e}</span></td></tr>`).join('')}</tbody></table>`;
  for (const c of F.communities) if (c.source) { const s = h.source(c.source); used.set(s.url, s); }
  const adi = F.programmes.find(p => /digital innovators/i.test(p.name));

  // ---------- 07 Vibathon and the real hackathons ----------
  const shortPlace = p => { if (!p || p === 'null') return ''; const parts = String(p).split(',').map(x => x.trim()).filter(Boolean); return parts.length > 2 ? `${parts[0]}, ${parts.at(-2).replace(/^\d{4}-\d{3}\s*/, '')}` : parts.join(', '); };
  const vib = F.vibathons.find(v => /vibathon/i.test(v.name)) || F.vibathons[0];
  const vibOthers = F.vibathons.filter(v => v !== vib);
  const vibCard = v => { const facts = (v.facts || []).filter(x => !/^Listed on Algarve Evolution's Odoo/.test(x.text)); return `<li class="hk rv"><p class="hk-when">${v.date ? `<time datetime="${esc(String(v.date).slice(0, 10))}">${esc(D(v.date))}</time>` : ''}${v.town || v.place ? ` · ${esc(v.town || shortPlace(v.place))}` : ''}</p><h3>${v.url ? `<a href="${esc(v.url)}" rel="noopener">${esc(v.name)}</a>` : esc(v.name)}</h3>${v.place ? `<p class="hk-place">${esc(shortPlace(v.place))}</p>` : ''}${facts.length ? `<ul class="facts">${facts.map(x => `<li>${esc(x.text)} ${cite(x.sources || x.source, 'src src-in')}</li>`).join('')}</ul>` : ''}${v.url ? `<p class="odoo-link"><a href="${esc(v.url)}" rel="noopener">On their Odoo</a>${v.date && String(v.date).slice(0, 10) >= today ? ` · <a href="${esc(v.url)}/register" rel="noopener">Register</a>` : ''}</p>` : ''}</li>`; };
  const hackOdoo = hackathons.filter(e => !F.vibathons.some(v => v.url && v.url === e.url)).sort((a, b) => a.start.localeCompare(b.start));

  // ---------- 08 Their calendar: events per month from their Odoo ----------
  const ym = s => String(s).slice(0, 7);
  const mons = [];
  if (F.events.length) {
    const all = F.events.map(e => ym(e.start)).sort();
    let [y, m] = all[0].split('-').map(Number); const [y2, m2] = all.at(-1).split('-').map(Number);
    while (y < y2 || (y === y2 && m <= m2)) { mons.push(`${y}-${String(m).padStart(2, '0')}`); m += 1; if (m > 12) { m = 1; y += 1; } }
  }
  const kinds = Object.keys(KIND).filter(k => F.events.some(e => e.kind === k));
  const perMon = mons.map(k => ({ k, by: Object.fromEntries(kinds.map(kd => [kd, F.events.filter(e => ym(e.start) === k && e.kind === kd).length])) }));
  perMon.forEach(p => { p.n = Object.values(p.by).reduce((a, b) => a + b, 0); });
  const maxM = Math.max(4, ...perMon.map(p => p.n));
  const C = { w: 900, h: 380, l: 44, r: 16, t: 40, b: 70 };
  const cw = (C.w - C.l - C.r) / Math.max(1, mons.length);
  const cy = v => C.h - C.b - v / maxM * (C.h - C.t - C.b);
  const ticks = [0, 5, 10, 15, 20, 25, 30].filter(v => v <= maxM);
  const todayX = (() => { const i = mons.indexOf(ym(today)); return i < 0 ? null : C.l + cw * (i + Number(today.slice(8, 10)) / 31); })();
  const busiest = perMon.reduce((a, b) => (b.n > a.n ? b : a), perMon[0] || { n: 0, k: '' });
  const monName = k => `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
  const calSvg = `<svg class="cal" viewBox="0 0 ${C.w} ${C.h}" role="img" aria-labelledby="cal-t cal-d">
  <title id="cal-t">Events per month in their Odoo</title>
  <desc id="cal-d">${esc(perMon.map(p => `${monName(p.k)}: ${p.n}`).join('; '))}</desc>
  ${ticks.map(v => `<line class="grid" x1="${C.l}" x2="${C.w - C.r}" y1="${f1(cy(v))}" y2="${f1(cy(v))}"/><text class="ax" x="${C.l - 10}" y="${f1(cy(v) + 5)}" text-anchor="end">${v}</text>`).join('')}
  ${perMon.map((p, i) => { let acc = 0; const x = C.l + cw * i + cw * 0.14, w = cw * 0.72; const future = p.k > ym(today); return `<g class="cb${future ? ' fut' : ''}" style="--i:${i}"><title>${esc(`${monName(p.k)}: ${plural(p.n, 'event')}`)}</title>${kinds.map(kd => { const v = p.by[kd]; if (!v) return ''; const y0 = cy(acc), y1 = cy(acc + v); acc += v; return `<rect x="${f1(x)}" y="${f1(y1)}" width="${f1(w)}" height="${f1(Math.max(0, y0 - y1 - 1.5))}" rx="2" fill="${KIND[kd][1]}"/>`; }).join('')}${p.n ? `<text class="cv" x="${f1(x + w / 2)}" y="${f1(cy(p.n) - 8)}" text-anchor="middle">${p.n}</text>` : ''}<text class="ax mo${p.k.endsWith('-01') || i === 0 ? ' yr' : ''}" x="${f1(x + w / 2)}" y="${C.h - C.b + 24}" text-anchor="middle">${MONTHS[Number(p.k.slice(5, 7)) - 1][0]}</text>${p.k.endsWith('-01') || i === 0 ? `<text class="ax yl" x="${f1(C.l + cw * i + 4)}" y="${C.h - C.b + 52}">${p.k.slice(0, 4)}</text><line class="tick" x1="${f1(C.l + cw * i)}" x2="${f1(C.l + cw * i)}" y1="${C.h - C.b + 4}" y2="${C.h - C.b + 58}"/>` : ''}</g>`; }).join('')}
  ${todayX ? `<line class="today" x1="${f1(todayX)}" x2="${f1(todayX)}" y1="${C.t - 18}" y2="${C.h - C.b}"/><text class="today-l" x="${f1(todayX - 8)}" y="${C.t - 22}" text-anchor="end">read ${esc(D(today))}</text>` : ''}
</svg>`;
  const calTable = `<details class="nums"><summary>The numbers, month by month</summary><table><thead><tr><th scope="col">Month</th>${kinds.map(k => `<th scope="col">${esc(KIND[k][0])}</th>`).join('')}<th scope="col">All</th></tr></thead><tbody>${perMon.map(p => `<tr><th scope="row">${esc(monName(p.k))}</th>${kinds.map(k => `<td>${p.by[k]}</td>`).join('')}<td>${p.n}</td></tr>`).join('')}</tbody></table></details>`;
  const kindsGuessed = F.events.some(e => e.kindGuessed);
  const inAlgarve = F.events.filter(e => e.town).length;

  // ---------- 09 Coming up, from their Odoo; and their news ----------
  const upcoming = F.events.filter(e => String(e.end || e.start).slice(0, 10) >= today).sort((a, b) => a.start.localeCompare(b.start));
  const evCard = e => { const [y, m, d] = String(e.start).slice(0, 10).split('-'); return `<li class="ev"><p class="ev-date" aria-hidden="true"><b>${Number(d)}</b><span>${MONTHS[Number(m) - 1]}</span><i>${y}</i></p><div class="ev-body"><p class="ev-kind" style="--k:${KIND[e.kind]?.[1] || '#7d869e'}">${esc(KIND[e.kind]?.[0] || 'Event')}</p><h3><a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a></h3><p class="ev-meta"><time datetime="${esc(e.start)}">${esc(D(e.start))}${e.end && e.end.slice(0, 10) !== e.start.slice(0, 10) ? ` to ${esc(D(e.end))}` : ''}</time>${shortPlace(e.place) ? ` · ${esc(shortPlace(e.place))}` : ''}</p><p class="ev-go">${e.register ? `<a class="reg" href="${esc(e.register)}" rel="noopener">Register on their Odoo<span class="sr">: ${esc(e.name)}</span></a>` : ''}</p></div></li>`; };
  const news = F.news.slice(0, 6);

  // ---------- 10 What your Odoo would fill ----------
  const gapGroups = ACT_ORDER.map(id => ({ id, list: gapsBy(id) })).filter(g => g.list.length);
  const gapOther = F.gaps.filter(g => !ACT_ORDER.includes(g.activity));
  if (gapOther.length) gapGroups.push({ id: 'other', list: gapOther });
  const gapCards = gapGroups.map(g => g.list.map(x => `<li class="gap rv" style="--c:${ACT_COLOUR[g.id] || '#7d869e'}"><p class="gap-act">${esc(g.id === 'other' ? 'The hub' : actName(g.id))}</p><h3>${esc(x.what)}</h3>${x.known ? `<p class="gap-known"><span>Known today</span>${esc(x.known)}</p>` : ''}${(x.odoo || []).length ? `<p class="gap-rec"><span>Odoo records</span>${x.odoo.map(o => `<code>${esc(o)}</code>`).join(' ')}</p>` : ''}${x.v2 ? `<a class="gap-v2" href="${esc(x.v2)}">What it could be <span class="gap-sim">V2, simulated</span> <span aria-hidden="true">→</span></a>` : ''}</li>`).join('')).join('');

  // ---------- Chapters and menu ----------
  const chapters = [['mission', 'Beyond tourism'], ['hub', 'The hub'], ['goals', '2032'], ['growth', 'Growth'], ['programmes', 'Programmes'], ['network', 'Network'], ['map', '16 municipalities'], ['hackathons', 'Vibathon'], ['calendar', 'Calendar'], ['coming', 'Coming up'], ['gaps', 'Your Odoo']];
  const head = (no, id, kicker, title) => `<header class="ch-head"><p class="ch-no" aria-hidden="true">${no}</p><p class="kicker">${esc(kicker)}</p><h2 id="h-${id}" class="kin">${words(title)}</h2></header>`;
  const topMenu = `<header class="fx-top"><div class="fx-top-in">
  <a class="fx-brand" href="${esc(self)}"><span class="fx-mark" aria-hidden="true"></span><span class="fx-word">${esc(F.hubName)}</span></a>
  <nav class="fx-nav" aria-label="Main menu">
    <ul class="fx-chap">${['hub', 'programmes', 'map', 'calendar', 'gaps'].map(id => chapters.find(c => c[0] === id)).map(([id, name]) => `<li><a href="#${id}">${esc(name)}</a></li>`).join('')}</ul>
    <ul class="fx-apps"><li><a class="fx-app" href="#coming"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12" rx="2"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4"/><circle cx="10" cy="12.5" r="1.6"/></svg><span>Coming up</span></a></li><li><a class="fx-app fx-app2" href="#gaps"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="2" stroke-dasharray="3 2.2"/><path d="M10 7v6M7 10h6"/></svg><span>Your Odoo</span></a></li></ul>
  </nav>
</div></header>`;

  const mission = typeof F.org.mission === 'string' && !/^our /i.test(F.org.mission) ? F.org.mission : 'Algarve Evolution\'s mandate is to diversify the Algarve\'s economy beyond tourism and help the region\'s established industries become more competitive.';
  const missionSrc = F.org.mission_sources || F.org.sources || 'psn';
  const q = F.quote;
  const qBy = q.by && typeof q.by === 'string' && !/^[a-z-]+$/.test(q.by) ? q.by : F.person.name;
  const qRole = (typeof q.role === 'object' ? q.role.en : q.role) || F.person.role.en;
  const qText = typeof q.text === 'object' ? q.text.en : q.text;

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AE Innovation Hub: the future, in real data</title>
<meta name="description" content="The AE Innovation Hub of Algarve Evolution, told with real, published data only: four activities on Odoo, the 2032 targets, programmes, the network, the 16 municipalities, hackathons, the calendar from their Odoo, and what their Odoo would fill.">
<meta name="theme-color" content="#05070d"><meta name="color-scheme" content="dark">
<script>document.documentElement.classList.add('js')</script>
${chrome.head}
<link rel="preload" href="/v3/future/fonts/InterDisplay-Black.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/v3/future/style.css">
</head>
<body>
${chrome.banner}
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
${topMenu}
<nav class="chap" aria-label="Chapters"><ol>${chapters.map(([id, name], i) => `<li><a href="#${id}"><span>${String(i + 1).padStart(2, '0')}</span> ${esc(name)}</a></li>`).join('')}</ol></nav>
<main id="main">

<section class="hero" aria-labelledby="h-top">
  <div class="hero-media">${img('coast', 'Illustration: golden limestone cliffs and sea arches on the Algarve coast at dawn, with low timber-and-glass pavilions and solar canopies on the clifftop.', 'hero-img', true)}</div>
  <div class="hero-in">
    <p class="eyebrow">Algarve Evolution · Faro · since 2018</p>
    <h1 id="h-top" class="kin hero-h">${words(F.hubName)}</h1>
    <p class="hero-sub">Four activities on one Odoo. Only what is real.</p>
    <p class="lede">Algarve Evolution, a Faro association that began in 2018 as a small group of local entrepreneurs, is setting up the ${esc(F.hubName)}: incubation and acceleration, Challenge Connect, Vibathon and a talent ecosystem, on the Odoo that already runs its site. This page uses only published data, each fact linked to its source. Where the data does not exist yet, it says so.</p>
    ${cite([...F.fig('founded').sources, 'psn'])}
    <ul class="hero-facts">
      <li><b class="cnt" data-to="${F.events.length}">${F.events.length}</b> events in their Odoo</li>
      <li><b class="cnt" data-to="${F.programmes.length}">${F.programmes.length}</b> programmes with a public record</li>
      <li><b class="cnt" data-to="${F.communities.length}">${F.communities.length}</b> communities</li>
      <li><b class="cnt" data-to="${algarveOrgs}">${algarveOrgs}</b> organisations mapped</li>
    </ul>
    <a class="cue" href="#mission">Scroll into the future <span aria-hidden="true">↓</span></a>
  </div>
  ${cap('The Algarve coast at dawn, imagined. Not a photograph.')}
</section>

<section id="mission" class="ch mission" aria-labelledby="h-mission">
  ${head('01', 'mission', 'The mandate', 'Beyond tourism')}
  <p class="reveal-text">${words(mission)}</p>
  ${cite(missionSrc)}
</section>

<section id="hub" class="ch hub" aria-labelledby="h-hub">
  ${head('02', 'hub', 'António\'s whiteboard, 16 November 2026', `${F.hubName}: four activities, one Odoo`)}
  <p class="intro">The hub starts with four complementary activities. Odoo is the layer under all of them, and ideas and needs flow in from the region. Each card counts what is real and public today.</p>
  <div class="hubd">
    <ol class="acts">${hubCards}</ol>
    <div class="odoo-band rv"><span class="ob-glow" aria-hidden="true"></span><p class="ob-name">Odoo infrastructure</p><p class="ob-line">${odooLine}</p><ul class="ob-apps" aria-label="Odoo apps with public pages on their site">${apps.map(([n, w]) => `<li><b>${esc(n)}</b> ${esc(w)}</li>`).join('')}</ul><p class="ob-note">Apps read from the public pages in their sitemap; what runs behind the login is not visible from outside.</p>${cite([odooHome, F.pages.length ? 'https://www.algarveevolution.pt/sitemap.xml' : null])}</div>
    ${hubPage ? `<div class="hub-page rv"><p class="kicker">Already on their Odoo</p><p class="hp-t"><a href="${esc(hubPage.url)}" rel="noopener">${esc(pageTitle(hubPage))}</a></p><p class="hp-h">The page's own headings: ${(hubPage.headings || []).slice(1).map(x => `“${esc(x)}”`).join(', ')}.</p>${cite(hubPage.source || hubPage.url)}</div>` : ''}
    <div class="ideas rv" aria-hidden="true"><span>Ideas</span><i></i><span>Needs</span><i></i><span>Ideas</span><i></i><span>Needs</span></div>
    <p class="ideas-l">Ideas and needs from the region flow into the hub.</p>
  </div>
</section>

<section id="goals" class="ch goals" aria-labelledby="h-goals">
  ${head('03', 'goals', 'Targets, not results', 'The goals for 2032')}
  <figure class="goal-fig">
    <div class="goal-stage">
      ${img('goals', 'Illustration: three glowing towers of light on a dark glass floor, each taller than the last, one per goal.', 'goal-img')}
      <ol class="goal-nums">${F.goals.map((g, i) => `<li style="--c:${['#ffb547', '#ff6f4f', '#52e5d6'][i % 3]}"><span class="gv"><span class="cnt" data-to="${g.value.replace(/\D/g, '')}">${esc(g.value)}</span></span><span class="gl">${esc(g.label)}</span><span class="gt">target</span></li>`).join('')}</ol>
    </div>
    <figcaption>${cap('The towers are artwork; the numbers are set in the page, from the source. They are targets for 2032, not results.')}${cite(F.goalSources)}</figcaption>
  </figure>
</section>

<section class="quote" aria-label="Quote">
  <figure>
    <p class="q-ctx">On the 2032 goals</p>
    <blockquote><p>${words(qText)}</p></blockquote>
    <figcaption><strong>${esc(qBy)}</strong>, ${esc(String(qRole).toLowerCase())}, Algarve Evolution${q.date ? ` · <time datetime="${esc(q.date)}">${esc(D(q.date))}</time>` : ''}</figcaption>
    ${cite(q.sources)}
  </figure>
</section>

<section id="growth" class="ch growth-ch" aria-labelledby="h-growth">
  ${head('04', 'growth', 'Members over time', 'From 29 to 118')}
  <p class="intro">From about 29 technology companies in 2019 to 118 active members in 2026, as the sources report it.</p>
  <figure class="chart rv">
    ${growthSvg}
    <figcaption>
      <ol class="pts">${pts.map(p => `<li><b>${esc(p.label)}</b> ${esc(p.what)}. ${cite(p.src)}</li>`).join('')}</ol>
      <p class="fine">The counts come from different sources and do not measure the same thing: ICT companies in 2019, companies and individuals in 2024, active members (professionals and companies) in 2026. The line joins them; there is no data in between.</p>
    </figcaption>
  </figure>
  <div class="stats">
    ${stat('events', '', '142', 142, '+')}
    ${stat('jobs', 'about', '1,000', 1000, '')}
    ${stat('communities', '', '24', 24, '', 'cy')}
  </div>
  <p class="fine own">These are the organisation's own figures, as reported; nobody here has audited them.</p>
</section>

<section id="programmes" class="ch pillars" aria-labelledby="h-programmes">
  ${head('05', 'programmes', 'What runs today', `${F.programmes.length} real programmes, four activities`)}
  <p class="intro">Every programme with a public record, placed under the hub activity it belongs to. An empty arc is an honest gap.</p>
  <div class="pill-grid">
    <div class="radial-wrap rv">${radialSvg}</div>
    <div class="prog-list">${progList}</div>
  </div>
</section>

${inova ? `<section class="plate plate-r" aria-labelledby="h-industry">
  <div class="plate-media">${img('harbour', 'Illustration: a small Algarve fishing harbour at blue hour, coloured wooden boats and nets, with thin lines of light drawn over the water like a data display.', 'plate-img')}</div>
  <div class="plate-in">
    <p class="kicker">${esc(inova.name)}</p>
    <h2 id="h-industry" class="kin">${words('Industries the region already has, made more competitive')}</h2>
    ${inova.summary ? `<p>${esc(inova.summary)}</p>` : ''}
    ${cite((inova.facts || []).map(x => x.source))}
  </div>
  ${cap('A working harbour with a data layer, imagined.')}
</section>` : ''}

<section id="network" class="ch network" aria-labelledby="h-network">
  ${head('06', 'network', 'Who it works with', 'The ecosystem, mapped')}
  <p class="intro">Programmes and summits on the inner ring; the partners named in the sources on the outer ring. Each line is a link a source describes.</p>
  <figure class="net-fig rv">${netSvg}<figcaption class="legend"><span><i class="lg lg-c"></i>Algarve Evolution</span><span><i class="lg lg-p"></i>programmes and summits</span><span><i class="lg lg-o"></i>partners and places</span></figcaption></figure>
  <h3 class="sub">Partners, and what they do together</h3>
  <ul class="partners">${partnerList}</ul>
  ${cite(netSrc)}
</section>

<section id="map" class="ch mapch" aria-labelledby="h-map">
  <div class="map-bg">${img('towns', 'Illustration: Algarve towns at night seen from above the sea, joined by thin lines of light.', 'map-bg-img')}</div>
  <div class="map-in">
    ${head('07', 'map', 'Talent Ecosystem · the ADI network', 'All 16 municipalities')}
    <div class="map-num rv"><p class="mega"><span class="cnt" data-to="${algarveOrgs}">${algarveOrgs}</span></p><p>public organisations mapped across the region</p><p class="mega2"><span class="cnt" data-to="${F.communities.length}">${F.communities.length}</span></p><p>communities with a public record (Algarve Digital Innovators reports 24 in all)</p></div>
    <figure class="map-fig rv">${mapSvg}<figcaption class="legend"><span><i class="lg lg-o"></i>organisations (circle size)</span><span><i class="lg lg-cm"></i>one ADI community</span><span><i class="lg lg-c"></i>Faro, the hub's base</span></figcaption></figure>
    <div class="map-txt">
      <p class="intro">${adi?.summary ? esc(adi.summary) : 'Algarve Digital Innovators maps the digital communities across the region\'s 16 municipalities.'}</p>
      ${cite(adi ? (adi.facts || []).map(x => x.source) : F.fig('communities').sources)}
    </div>
  </div>
  <div class="mtab-wrap rv">${muniTable}
    <p class="fine">Organisations: the public list of ${algarveOrgs} (organisations only, no people), by their main town; ${regionOrgs} more work across the whole region. Communities: the real ADI communities${regionComs.length ? `; ${regionComs.map(c => esc(c.name)).join(', ')} cover the whole region` : ''}. Events: their Odoo events whose place names the municipality (${inAlgarve} of ${F.events.length}; the rest are online or outside the Algarve). Outline: Natural Earth (public domain).</p>
    <p class="src">Data: <a href="/v1/talent-map/data/organisations.json">the organisations list</a> (each entry with its own source), <a href="#calendar">their Odoo</a> for events.</p>
  </div>
  ${cap('Algarve towns at night, joined by light, imagined.')}
</section>

${vib ? `<section id="hackathons" class="plate" aria-labelledby="h-build">
  <div class="plate-media">${img('hall', 'Illustration: a university hall at night, long tables of laptops and cables, people working, a large projection wall glowing orange and blue.', 'plate-img')}</div>
  <div class="plate-in">
    <p class="kicker">Vibathon · ${vib.date ? `<time datetime="${esc(String(vib.date).slice(0, 10))}">${esc(D(vib.date))}</time>` : ''}${vib.place ? ` · ${esc(vib.place)}` : ''}</p>
    <h2 id="h-build" class="kin">${words(vib.name)}</h2>
    <ul class="facts big">${(vib.facts || []).map(x => `<li>${esc(x.text)} ${cite(x.sources || x.source, 'src src-in')}</li>`).join('')}</ul>${vib.url ? `<p class="odoo-link"><a href="${esc(vib.url)}" rel="noopener">Its page on their Odoo</a></p>` : ''}
  </div>
  ${cap('A build day, imagined. Not the real event.')}
</section>` : `<span id="hackathons"></span>`}

<section class="ch hacks" aria-labelledby="h-hacks">
  ${head('08', 'hacks', 'Vibathon · hackathons, workshops, juries', 'The real hackathons')}
  <p class="intro">Hackathons with a public record, and the hackathon and buildathon events in their Odoo. The projects, jury and scores are not public yet.</p>
  ${vibOthers.length ? `<ol class="hks">${vibOthers.map(vibCard).join('')}</ol>` : ''}
  ${hackOdoo.length ? `<h3 class="sub">In their Odoo</h3><ol class="evs evs-hk">${hackOdoo.map(evCard).join('')}</ol>` : ''}
  <p class="gap-inline">Projects, jury and scores: <a href="#gaps">your Odoo would fill this</a>; <a href="/vibathon/">see what it could be</a> (V2, simulated).</p>
</section>

<section id="calendar" class="ch calch" aria-labelledby="h-calendar">
  ${head('09', 'calendar', `From their Odoo ${F.odooVersion ? esc(F.odooVersion) : ''}`.trim(), `${F.events.length} events, month by month`)}
  <p class="intro">Every event published on their Odoo, by the month it starts. The busiest month was ${esc(monName(busiest.k || today.slice(0, 7)))}, with ${plural(busiest.n, 'event')}.</p>
  <figure class="chart cal-fig rv">
    <div class="cal-scroll">${calSvg}</div>
    <figcaption><p class="legend">${kinds.map(k => `<span><i class="lg" style="background:${KIND[k][1]};border-color:${KIND[k][1]}"></i>${esc(KIND[k][0])} (${F.events.filter(e => e.kind === k).length})</span>`).join('')}</p>
    ${calTable}
    <p class="fine">${F.classification ? `${esc(F.classification)} ` : kindsGuessed ? 'The kind of each event is read from its name on this page; their Odoo does not publish it. ' : ''}Read on ${esc(D(today))}. Each event links to its page on their Odoo.</p>
    ${cite(F.events.length ? 'https://www.algarveevolution.pt/event' : odooHome)}</figcaption>
  </figure>
</section>

<section id="coming" class="ch coming" aria-labelledby="h-coming">
  ${head('10', 'coming', 'Register on their Odoo', 'What is coming up')}
  <p class="intro">${upcoming.length ? `${plural(upcoming.length, 'event')} from ${esc(D(today))} onwards, in date order. Registration happens on their Odoo.` : 'No upcoming events were published on their Odoo when it was read.'}</p>
  <ol class="evs">${upcoming.map(evCard).join('')}</ol>
  <h3 class="sub">Their news</h3>
  <ol class="news">${news.map(p => `<li class="nw rv"><p class="nw-meta"><time datetime="${esc(p.date)}">${esc(D(p.date))}</time> · ${esc(p.blog || 'News')}</p><h4><a href="${esc(p.url)}" rel="noopener">${esc(p.title)}</a></h4></li>`).join('')}</ol>
  ${cite(news.length ? news[0].url : odooHome)}
</section>

<section class="plate join" aria-labelledby="h-fill">
  <div class="plate-media">${img('cork', 'Illustration: a freshly harvested cork oak in golden grass in the inland Algarve hills, with raised solar panels and a small drone behind.', 'plate-img')}</div>
  <div class="plate-in">
    <p class="kicker">11 · What it could be</p>
    <h2 id="h-fill" class="kin">${words('What your Odoo would fill')}</h2>
    <p>Most of the hub's own work has no public data yet: the startups in each programme and their KPIs, mentors, challenges and applications, Vibathon projects, the jury and their scores. Getting that into Odoo is the first piece of work. V2 shows what each page could look like, with simulated data.</p>
  </div>
  ${cap('Cork oak and solar in the inland Algarve, imagined.')}
</section>

<section id="gaps" class="ch gaps" aria-labelledby="h-gaps">
  ${head('11', 'gaps', 'The gaps, by activity', 'Your Odoo would fill this')}
  <p class="intro">Each card names what is missing, the Odoo records that would hold it (from the hub's Odoo addon), and the V2 page that shows it with simulated data.</p>
  <ol class="gapl">${gapCards}</ol>
  <p class="v2-all"><a class="fx-app" href="/">Open V2: what it could be <span aria-hidden="true">→</span></a></p>
</section>

<section id="sources" class="ch sources" aria-labelledby="h-sources">
  <h2 id="h-sources">Sources</h2>
  <p class="intro">Every fact on this page links to one of these. Figures are the organisation's own, as reported; targets are targets. Nothing on this page is simulated.</p>
  <ol class="srcs">__SOURCES__</ol>
  <p class="fine">${F.isReal ? 'Data: the real feed (src/feeds/real.json), built from public sources only.' : 'Data: the sourced facts in src/data, until the real feed is built.'} Odoo: ${esc(F.odooSource)}. Images: AI-generated illustrations made for V1 of this prototype with Google Gemini image models through OpenRouter; none shows a real place, event or person. <a href="/v3/future/img/README.md">Models, prompts and costs</a> · <a href="/v3/future/fonts/README.md">Fonts</a></p>
</section>

</main>
<footer class="foot">
  <p class="big">${words('Real data first. Then the rest.')}</p>
  <p>${esc(data.voice.banner.en)} <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(data.voice.banner_link.en)}</a></p>
  <p>V3 shows what Algarve Evolution has published. <a href="/">V2 shows what it could be</a>, with simulated data.</p>
  <p class="fine">Version ${esc(chrome.version)} · Code Apache-2.0; text and images CC BY 4.0</p>
</footer>
<script src="/v3/future/app.js" defer></script>
${chrome.foot}
</body>
</html>`;
  const srcs = [...used.values()].sort((a, b) => a.publisher.localeCompare(b.publisher) || a.title.localeCompare(b.title)).map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a> <span>${esc(s.publisher)}${s.published ? `, ${esc(D(s.published))}` : ''}</span></li>`).join('');
  return html.replace('__SOURCES__', srcs);
}
