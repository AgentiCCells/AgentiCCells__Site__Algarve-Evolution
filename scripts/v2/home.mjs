// The hub's home: António Guerreiro's whiteboard made clickable, the four activities with live counts from Odoo,
// the personas to try it as, what is coming up (real events from Algarve Evolution's Odoo) and how Odoo feeds it all.
// Owner: sites-design@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0. Every number comes from the feed.
export const path = '/';
export const title = 'AE Innovation Hub';
export const nav = 'The Hub';

// António's keywords from the whiteboard (docs/v2/BRIEF.md, 16 November 2026), in English, with his Portuguese.
const BOARD = {
  'inc-acc': { href: '/inc-acc/', short: 'INC/ACC', keys: 'incubation, acceleration, mentors, KPIs', pt: 'incubação, aceleração, mentores, KPIs', for: 'founder mentor',
    counts: [['programmes', 'programmes'], ['companies', 'companies'], ['mentors', 'mentors'], ['sessions', 'sessions']], models: ['aih.programme', 'aih.session', 'aih.kpi'] },
  'challenge-connect': { href: '/challenge-connect/', short: 'Challenge Connect', keys: 'challenges, suppliers, matching', pt: 'desafios, fornecedores, matching', for: 'challenger supplier',
    counts: [['challenges', 'challenges'], ['suppliers', 'suppliers'], ['applications', 'applications']], models: ['aih.challenge', 'aih.application'] },
  vibathon: { href: '/vibathon/', short: 'Vibathon', keys: 'hackathons, workshops, juries', pt: 'hackathons, workshops, júris', for: 'participant mentor',
    counts: [['vibathons', 'Vibathons'], ['projects', 'projects'], ['registrations', 'registrations']], models: ['aih.vibathon', 'aih.project'] },
  talent: { href: '/talent/', short: 'Talent Ecosystem', keys: 'talent, competences, partners, the ADI network', pt: 'talento, competências, parceiros, rede ADI', for: 'supplier',
    counts: [['talent', 'people and organisations'], ['communities', 'communities']], models: ['res.partner', 'aih.community'] },
};

// What each persona finds, and where to start. Shown in the "you are trying it as" strip and on the persona cards.
const PERSONA_COPY = {
  visitor: { start: '/inc-acc/', page: 'INC/ACC', text: 'Everything Algarve Evolution has published in Odoo: the programmes and their public KPIs, open challenges, Vibathon projects, the talent network and real events.' },
  founder: { start: '/inc-acc/', page: 'INC/ACC', text: 'Your programme, your mentor and your sessions, your KPIs from month 0 to month 6, and the reflection on the indicators.' },
  mentor: { start: '/inc-acc/', page: 'INC/ACC', text: 'The companies you mentor one to one, guest clinics and workshops, logging a session, and the Vibathons you mentor at.' },
  challenger: { start: '/challenge-connect/', page: 'Challenge Connect', text: 'Post a challenge, see who applied and the ranked matching result, then choose a supplier or ask Algarve Evolution for a top 3.' },
  supplier: { start: '/challenge-connect/', page: 'Challenge Connect', text: 'Open challenges that fit what you do, applying with a proposal, price and days, and your place in the talent network.' },
  participant: { start: '/vibathon/', page: 'Vibathon', text: 'Registering for a Vibathon, the projects and the jury, what was presented at the end and the next step after the event.' },
  staff: { start: '/odoo/', page: 'Odoo', text: 'The private feed, once you enter the access key: session notes, contact details, participants and jury scores, on every page.' },
};

export function render({ layout, feed, data, h, PERSONAS }) {
  const { esc, num, odoo, sim, src } = h;
  const today = String(feed.meta?.exported || '').slice(0, 10);
  const counts = {
    programmes: feed.programmes.length, companies: feed.companies.length, mentors: feed.mentors.length, sessions: feed.sessions.length,
    challenges: feed.challenges.length, suppliers: feed.suppliers.length, applications: feed.applications.length,
    vibathons: feed.vibathons.length, projects: feed.projects.length, registrations: feed.vibathons.reduce((s, v) => s + (v.registrations || 0), 0),
    talent: feed.talent.length, communities: feed.communities.length, events: feed.events.length,
  };
  const publicTotal = Object.entries(feed).filter(([, v]) => Array.isArray(v)).reduce((s, [, v]) => s + v.length, 0);
  const count = (key, label) => `<div><dt>${esc(label)}</dt><dd data-count="${key}" data-public="${counts[key]}">${num(counts[key])}</dd></div>`;

  // ---------- Hero ----------
  const hero = `
<section class="home-hero" aria-labelledby="home-title">
  <div class="hub-wrap home-hero-grid">
    <div class="home-hero-copy">
      <p class="kicker kicker-light">AE Innovation Hub · a prototype</p>
      <h1 id="home-title">Experience the vision, <em>then think again.</em></h1>
      <p class="home-lede">The AE Innovation Hub is our experimentation field: four complementary activities, from incubation and acceleration to the region's talent network, built on one source of truth, Odoo. This prototype is made to be used, not drawn on a wall. Try it as a founder, a mentor, a challenge owner or our own team, then tell us what to change.</p>
      <div class="home-cta">
        <a class="btn btn-accent" href="#try">Choose a persona</a>
        <a class="btn btn-on-navy" href="#board">See the four activities</a>
      </div>
    </div>
    <aside class="home-live" aria-labelledby="home-live-h">
      <p class="home-live-head" id="home-live-h"><span class="home-pulse" aria-hidden="true"></span>Read from Odoo</p>
      <dl class="home-live-list">
        ${count('companies', 'companies in programmes')}
        ${count('challenges', 'challenges')}
        ${count('vibathons', 'Vibathons')}
        ${count('talent', 'in the talent network')}
        ${count('events', 'events on their Odoo')}
      </dl>
      <p class="home-live-note" data-home-live-note>Public feed, exported ${esc(h.date(feed.meta?.exported))}. Programmes, companies, challenges and people are <span class="sim-badge">Simulated</span>; events, communities and organisations are real and link to their sources.</p>
    </aside>
  </div>
</section>`;

  // ---------- The persona strip ----------
  const p0 = PERSONA_COPY.visitor;
  const you = `
<div class="home-you" data-home-you>
  <div class="hub-wrap home-you-row">
    <p class="home-you-who">Trying the hub as <strong data-home-you-name>Visitor</strong></p>
    <p class="home-you-text" data-home-you-text aria-live="polite">${esc(p0.text)}</p>
    <a class="btn btn-sm btn-primary home-you-go" data-home-you-go href="${p0.start}">Start with ${esc(p0.page)} <span aria-hidden="true">&rarr;</span></a>
  </div>
</div>`;

  // ---------- The whiteboard, redrawn and clickable ----------
  const acts = feed.hub.activities.map((a, i) => {
    const b = BOARD[a.id]; if (!b) return '';
    return `
        <a class="wb-box" href="${b.href}" data-for="${b.for}">
          <span class="wb-num">0${i + 1}</span>
          <h3 class="wb-name">${esc(b.short)}</h3>
          <p class="wb-keys">${esc(b.keys)}</p>
          <p class="wb-pt"><span class="vh">António's words: </span><span lang="pt">${esc(b.pt)}</span></p>
          <p class="wb-sum">${esc(a.summary)}</p>
          <dl class="wb-counts">${b.counts.map(([k, l]) => count(k, l)).join('')}</dl>
          <span class="wb-foot"><span class="wb-models">${b.models.map(m => `<span class="wb-model">${esc(m)}</span>`).join('')}</span><span class="wb-go">Open ${esc(b.short)} <span aria-hidden="true">&rarr;</span></span></span>
        </a>`;
  }).join('');
  const board = `
<section class="hub-sec home-board" id="board" aria-labelledby="board-h">
  <div class="hub-wrap">
    <div class="hub-head-row">
      <div class="hub-head">
        <p class="kicker">From the whiteboard to a working hub</p>
        <h2 class="hub-h2" id="board-h">Four activities, one Odoo underneath</h2>
        <p class="hub-lede">This is António Guerreiro's drawing of the hub from our meeting on 16 November 2026, redrawn so you can click it. Each box is a working page, the keywords are his, and every number is read from Odoo.</p>
      </div>
      ${odoo('aih.activity', feed.hub.activities.length)}
    </div>
    <div class="wb">
      <div class="wb-title"><span>AE Innovation Hub</span></div>
      <div class="wb-frame">
        <p class="wb-frame-label">Odoo infrastructure</p>
        <div class="wb-grid">${acts}
        </div>
        <div class="wb-base">
          <p class="wb-base-name"><span class="odoo-dot" aria-hidden="true"></span>Odoo 19: the source of truth</p>
          <p class="wb-base-text">Every box above reads the same Odoo. Records are entered once, published when they are ready, and exported as two feeds.</p>
          <a class="wb-base-go" href="/odoo/">How Odoo is used <span aria-hidden="true">&rarr;</span></a>
        </div>
      </div>
      <div class="wb-bottom">
        <a class="wb-ideas" href="/odoo/#ideas-and-needs">
          <svg class="wb-ideas-arrow" viewBox="0 0 40 56" aria-hidden="true" focusable="false"><path d="M20 54V6M6 20 20 6l14 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>
          <span><strong>Ideas and needs</strong><span class="wb-pt" lang="pt">ideias, necessidades</span>
          <span class="wb-ideas-text">The stream that feeds the hub: a need from a company, an idea for a programme or an event. Send one and see the Odoo record it would create.</span></span>
        </a>
        <div class="wb-flow" role="img" aria-label="Spreadsheets flow into Odoo, and Odoo feeds the official site">
          <span class="wb-flow-node">Spreadsheets</span>
          <span class="wb-flow-arrow" aria-hidden="true"></span>
          <span class="wb-flow-node wb-flow-odoo">Odoo</span>
          <span class="wb-flow-arrow" aria-hidden="true"></span>
          <a class="wb-flow-node" href="https://www.algarveevolution.pt/" rel="noopener">Official site</a>
        </div>
      </div>
    </div>
    <p class="src">Redrawn from a photo of António Guerreiro's whiteboard, 16 November 2026; his keywords translated from Portuguese. The counts are the public feed; the Algarve Evolution team sees the private counts.</p>
  </div>
</section>`;

  // ---------- Try it as ----------
  const tryIt = `
<section class="hub-sec hub-sec-mist home-try" id="try" aria-labelledby="try-h">
  <div class="hub-wrap">
    <div class="hub-head">
      <p class="kicker">Try it as</p>
      <h2 class="hub-h2" id="try-h">Seven people, seven different hubs</h2>
      <p class="hub-lede">Pick who you are. Every page changes for that persona: what is highlighted, which panels you see, and what you can do. Your choice stays with you as you move around the site; the switch is also in the header.</p>
    </div>
    <ul class="home-personas">
      ${PERSONAS.map((p, i) => { const c = PERSONA_COPY[p.id] || PERSONA_COPY.visitor; return `<li>
        <button type="button" class="home-persona${p.id === 'staff' ? ' home-persona-staff' : ''}" data-set-persona="${p.id}" aria-pressed="${p.id === 'visitor'}">
          <span class="home-persona-top"><span class="home-persona-n">${String(i + 1).padStart(2, '0')}</span><span class="home-persona-now">Selected</span></span>
          <span class="home-persona-name">${esc(p.label)}</span>
          <span class="home-persona-hint">${esc(p.hint)}</span>
          <span class="home-persona-text">${esc(c.text)}</span>
          <span class="home-persona-go">${p.id === 'staff' ? 'Enter the access key' : `Try it as ${esc(p.label.toLowerCase())}`} <span aria-hidden="true">&rarr;</span></span>
        </button></li>`; }).join('\n      ')}
    </ul>
  </div>
</section>`;

  // ---------- What is coming up ----------
  const upcoming = feed.events.filter(e => String(e.start).slice(0, 10) >= today).sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 6);
  const when = iso => { const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`); return { day: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }), date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }), time: String(iso).slice(11, 16) }; };
  const where = place => {
    if (!place) return 'Place to be confirmed';
    if (/^online$/i.test(place.trim())) return 'Online';
    const parts = place.split(',').map(s => s.trim()).filter(Boolean);
    const town = (place.match(/\d{4}-\d{3}\s+([^,]+)/) || [])[1];
    let venue = parts[0];
    if (venue.length > 42) venue = venue.slice(0, 40).replace(/\s+\S*$/, '') + '…';
    const end = town ? town.trim() : parts[parts.length - 1];
    return venue && venue !== end ? `${venue}, ${end}` : end;
  };
  const rows = upcoming.map(e => { const w = when(e.start); return `
        <tr>
          <td class="home-ev-when" data-th="When"><span class="home-ev-day">${esc(w.day)}</span> <span class="home-ev-date">${esc(w.date)}</span>${w.time && w.time !== '00:00' ? ` <span class="home-ev-time">${esc(w.time)}</span>` : ''}</td>
          <th scope="row" class="home-ev-name"><a href="${esc(e.url || e.source)}" rel="noopener">${esc(e.name)}</a></th>
          <td class="home-ev-place" data-th="Where" title="${esc(e.place || '')}">${esc(where(e.place))}</td>
          <td class="home-ev-src" data-th="Source">${src(e)}</td>
        </tr>`; }).join('');
  const nextVib = feed.vibathons.filter(v => v.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const openCh = feed.challenges.filter(c => ['open', 'matching'].includes(c.status)).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const running = feed.programmes.filter(p => p.status === 'running');
  const hubNext = [
    nextVib && `<a class="card card-link card-accent" href="/vibathon/"><span class="card-kicker">Next Vibathon</span><h3>${esc(nextVib.name)}</h3><span class="card-meta">${esc(h.date(nextVib.date))} · ${esc(nextVib.town)} ${sim(nextVib)}</span><span class="card-foot">${odoo('aih.vibathon')}<span class="home-go">Register <span aria-hidden="true">&rarr;</span></span></span></a>`,
    openCh.length && `<a class="card card-link" href="/challenge-connect/"><span class="card-kicker">${num(openCh.length)} challenges taking applications</span><h3>${esc(openCh[0].title)}</h3><span class="card-meta">Closes ${esc(h.date(openCh[0].deadline))} · ${esc(h.money(openCh[0].budget_eur_min))} to ${esc(h.money(openCh[0].budget_eur_max))} ${sim(openCh[0])}</span><span class="card-foot">${odoo('aih.challenge')}<span class="home-go">Apply <span aria-hidden="true">&rarr;</span></span></span></a>`,
    running[0] && `<a class="card card-link" href="/inc-acc/"><span class="card-kicker">Programme running now</span><h3>${esc(running[0].name)}</h3><span class="card-meta">Until ${esc(h.date(running[0].end))} · ${num(running[0].company_ids.length)} companies ${sim(running[0])}</span><span class="card-foot">${odoo('aih.programme')}<span class="home-go">See the KPIs <span aria-hidden="true">&rarr;</span></span></span></a>`,
  ].filter(Boolean).join('\n        ');
  const coming = `
<section class="hub-sec home-coming" id="coming-up" aria-labelledby="coming-h">
  <div class="hub-wrap">
    <div class="hub-head-row">
      <div class="hub-head">
        <p class="kicker">What is coming up</p>
        <h2 class="hub-h2" id="coming-h">The next dates, straight from Odoo</h2>
        <p class="hub-lede">Real events published on Algarve Evolution's own Odoo, read on ${esc(h.date(data.odoo?.read || today))}. Each links to its page there, where people read the details and register.</p>
      </div>
      ${odoo('event.event', feed.events.length)}
    </div>
    <div class="home-coming-grid">
      <div class="hub-table-wrap">
        <table class="hub-table home-ev">
          <caption class="vh">The next ${num(upcoming.length)} events after ${esc(h.date(today))}</caption>
          <thead><tr><th scope="col">When</th><th scope="col">Event</th><th scope="col">Where</th><th scope="col"><span class="vh">Source</span></th></tr></thead>
          <tbody>${rows}
          </tbody>
        </table>
        <p class="home-ev-all"><a href="https://www.algarveevolution.pt/event" rel="noopener">All events on algarveevolution.pt</a> · ${num(feed.events.length)} in the feed</p>
      </div>
      <div class="home-coming-hub">
        <p class="sub-h">In the hub next</p>
        ${hubNext}
      </div>
    </div>
  </div>
</section>`;

  // ---------- Odoo, the source of truth, and the two feeds ----------
  const flow = `
<svg class="home-flow" viewBox="0 0 360 452" role="img" aria-labelledby="flow-t flow-d" focusable="false">
  <title id="flow-t">How the data flows</title>
  <desc id="flow-d">Spreadsheets, ideas and needs, and the team's own entries go into Odoo. Odoo runs the official site and exports two feeds: the public feed with published records, and the private feed, encrypted, which needs an access key. The AE Innovation Hub reads both; future apps such as an iOS app would read the same feeds.</desc>
  <defs><marker id="flow-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#a9b6cc"/></marker>
  <marker id="flow-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#ffd58a"/></marker></defs>
  <g class="fl-in">
    <rect x="4" y="4" width="108" height="44"/><text x="58" y="31">Spreadsheets</text>
    <rect x="126" y="4" width="108" height="44"/><text x="180" y="31">Ideas, needs</text>
    <rect x="248" y="4" width="108" height="44"/><text x="302" y="31">Team entries</text>
  </g>
  <g class="fl-line"><path d="M58 48v42" marker-end="url(#flow-a)"/><path d="M180 48v42" marker-end="url(#flow-a)"/><path d="M302 48v20H222v22" marker-end="url(#flow-a)"/></g>
  <g class="fl-odoo"><rect x="4" y="96" width="236" height="78"/><text class="fl-big" x="122" y="128">Odoo 19</text><text class="fl-small" x="122" y="150">source of truth · aih.* models</text></g>
  <g class="fl-line"><path d="M240 135h30" marker-end="url(#flow-a)"/></g>
  <g class="fl-site"><rect x="274" y="104" width="82" height="62"/><text x="315" y="131">Official</text><text x="315" y="149">site</text></g>
  <text class="fl-label" x="190" y="200">export, read only</text>
  <g class="fl-line"><path d="M64 174v40" marker-end="url(#flow-a)"/><path d="M180 174v40" marker-end="url(#flow-a)"/></g>
  <g class="fl-feed"><rect x="4" y="220" width="166" height="70"/><text class="fl-strong" x="87" y="250">Public feed</text><text class="fl-small" x="87" y="271">published records</text></g>
  <g class="fl-feed fl-private"><rect x="190" y="220" width="166" height="70"/><text class="fl-strong" x="273" y="250">Private feed</text><text class="fl-small" x="273" y="271">needs an access key</text>
    <path class="fl-lock" d="M339 236v-4a4.5 4.5 0 0 1 9 0v4"/><rect class="fl-lock-body" x="336" y="236" width="15" height="11"/></g>
  <g class="fl-line"><path d="M64 290v66" marker-end="url(#flow-a)"/><path d="M110 290 250 356" marker-end="url(#flow-a)"/></g>
  <g class="fl-line fl-key"><path d="M220 290 120 356" marker-end="url(#flow-g)"/><path d="M300 290v66" marker-end="url(#flow-g)"/></g>
  <g class="fl-hub"><rect x="4" y="362" width="166" height="70"/><text class="fl-strong" x="87" y="392">AE Innovation Hub</text><text class="fl-small" x="87" y="413">this site</text></g>
  <g class="fl-app"><rect x="190" y="362" width="166" height="70"/><text class="fl-strong" x="273" y="392">iOS app</text><text class="fl-small" x="273" y="413">future apps, same feeds</text></g>
</svg>`;
  const odooBand = `
<section class="hub-sec hub-sec-navy home-odoo" id="odoo" aria-labelledby="odoo-h">
  <div class="hub-wrap home-odoo-grid">
    <div class="home-odoo-copy">
      <p class="kicker">One source of truth</p>
      <h2 class="hub-h2" id="odoo-h">Odoo holds the data. Everything else reads it.</h2>
      <p class="hub-lede">Algarve Evolution already runs its website and events on Odoo 19. The hub adds the models for the four activities, so a programme, a challenge or a Vibathon is entered once and every page, report and app reads the same record. Nothing on this site writes to Odoo: where an action would, it shows the exact call instead.</p>
      <div class="home-feeds">
        <div class="home-feed">
          <p class="home-feed-name">Public feed</p>
          <p>Only records published in Odoo, only public fields, and people only when they have consented. Served with the site; anyone can read it.</p>
          <p class="home-feed-n"><strong>${num(publicTotal)}</strong> records · <a href="/feeds/public.json">open the file</a></p>
        </div>
        <div class="home-feed home-feed-private">
          <p class="home-feed-name">Private feed</p>
          <p>Every record and field: session notes, contacts, participants, jury scores. Published only encrypted; the team opens it with an access key, in their own browser tab.</p>
          <p class="home-feed-n" data-home-private-n>Locked · <button type="button" class="home-link-btn" data-set-persona="staff">open as the team</button></p>
        </div>
      </div>
      <p class="src src-light">Today the feeds come from a local Odoo 19 we run for this prototype, seeded with Algarve Evolution's real public events and organisations and with simulated records. Pointed at their own Odoo, the site would not change. Their Odoo: <a href="https://www.algarveevolution.pt/" rel="noopener">algarveevolution.pt</a>.</p>
    </div>
    <figure class="home-odoo-fig">
      ${flow}
      <figcaption>Spreadsheets and requests go into Odoo once; the site, the official site and future apps all read from it.</figcaption>
    </figure>
  </div>
  <div class="hub-wrap">
    <aside class="persona-panel persona-panel-private home-staff" data-only="staff" aria-labelledby="staff-h">
      <p class="persona-panel-head" id="staff-h">For the Algarve Evolution team: public and private feed side by side</p>
      <p class="home-staff-wait" data-home-staff-wait>Enter the access key to compare what Odoo publishes with what it holds. <button type="button" class="btn btn-sm btn-primary" data-open-key>Enter the access key</button></p>
      <div class="hub-table-wrap" data-home-staff-table hidden>
        <table class="hub-table hub-table-pairs home-staff-t">
          <thead><tr><th scope="col">Odoo records</th><th scope="col" class="num">Public feed</th><th scope="col" class="num">Private feed</th><th scope="col">Held back from the public</th></tr></thead>
          <tbody data-home-staff-rows></tbody>
        </table>
      </div>
    </aside>
  </div>
</section>`;

  // ---------- António's words ----------
  const person = data.people.people.find(p => p.id === 'antonio-guerreiro');
  const q = data.people.quotes.find(x => x.by === 'antonio-guerreiro');
  const quote = q ? `
<section class="hub-sec home-quote" aria-label="António Guerreiro on the 2032 goals">
  <div class="hub-wrap home-quote-grid">
    <figure class="home-quote-fig">
      <blockquote><p>${esc(q.text.en)}</p></blockquote>
      <figcaption><strong>${esc(person?.name || 'António Guerreiro')}</strong>, ${esc((person?.role?.en || 'Executive director').toLowerCase())}, Algarve Evolution, on ${esc(q.about)} (targets, not results), ${esc(h.date(q.date))}. ${q.sources.map(u => `<a class="src-link" href="${esc(u)}" rel="noopener">source</a>`).join(' ')}</figcaption>
    </figure>
    <div class="home-quote-side">
      <p class="sub-h">Why a prototype</p>
      <p>A vision drawn on a wall takes months to build and is hard to change. A prototype built in a day can be tried by the people it is for, and changed the next morning. This one is for Algarve Evolution's team and partners to use, argue with and reshape.</p>
      <a class="btn btn-primary" href="#try">Try it as a persona</a>
    </div>
  </div>
</section>` : '';

  // ---------- V1, quietly ----------
  const v1 = `
<section class="hub-sec-tight home-v1" aria-label="Earlier experiments">
  <div class="hub-wrap home-v1-row">
    <p><strong>Before the hub:</strong> our first round of experiments, with designs for the site and two working ideas, is parked as it was.</p>
    <a class="btn btn-sm" href="/v1/">See the V1 experiments <span aria-hidden="true">&rarr;</span></a>
  </div>
</section>`;

  const personaJson = JSON.stringify(Object.fromEntries(PERSONAS.map(p => [p.id, { label: p.label, ...(PERSONA_COPY[p.id] || PERSONA_COPY.visitor) }]))).replace(/</g, '\\u003c');
  const labels = { programmes: 'Programmes', companies: 'Companies', mentors: 'Mentors', sessions: 'Mentoring sessions', kpis: 'KPI records', challenges: 'Challenges', suppliers: 'Suppliers', applications: 'Applications', vibathons: 'Vibathons', projects: 'Projects', talent: 'Talent network', communities: 'Communities', events: 'Events' };
  const script = `
<script type="application/json" id="home-persona-copy">${personaJson}</script>
<script type="application/json" id="home-count-labels">${JSON.stringify(labels)}</script>
<script>
(() => {
  const copy = JSON.parse(document.getElementById('home-persona-copy').textContent);
  const labels = JSON.parse(document.getElementById('home-count-labels').textContent);
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const fmt = n => Number(n || 0).toLocaleString('en-GB');
  const setPersona = id => { const s = $('[data-persona-select]'); if (!s) return; s.value = id; s.dispatchEvent(new Event('change', { bubbles: true })); };
  $$('[data-set-persona]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.setPersona;
    if (id === 'staff' && window.HUB && HUB.persona === 'staff' && !HUB.privateFeed) { openKey(); return; }
    setPersona(id);
    if (b.classList.contains('home-persona') && id !== 'staff') $('[data-home-you]')?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
  // Re-open the access key dialog: switching away and back to staff makes hub.js ask again.
  function openKey() { setPersona('visitor'); setPersona('staff'); }
  $$('[data-open-key]').forEach(b => b.addEventListener('click', openKey));
  function privateCounts(f) {
    const c = {}; for (const [k, v] of Object.entries(f)) if (Array.isArray(v)) c[k] = v.length;
    c.registrations = (f.vibathons || []).reduce((s, v) => s + (v.registrations || 0), 0); return c;
  }
  function counts() {
    const priv = window.HUB && HUB.persona === 'staff' && HUB.privateFeed ? privateCounts(HUB.privateFeed) : null;
    $$('[data-count]').forEach(el => {
      const pub = Number(el.dataset.public), v = priv ? priv[el.dataset.count] ?? pub : pub;
      el.textContent = fmt(v);
      if (priv && v > pub) { const s = document.createElement('span'); s.className = 'home-plus'; s.textContent = '+' + fmt(v - pub) + ' private'; el.append(s); }
    });
    document.body.classList.toggle('home-private-counts', !!priv);
    const note = $('[data-home-live-note]');
    if (note) { note.dataset.public ||= note.innerHTML; note.innerHTML = priv ? 'Private feed, open in this tab: the counts include records Odoo holds but does not publish. Switch persona to see the public counts again.' : note.dataset.public; }
  }
  function persona(id) {
    const c = copy[id] || copy.visitor;
    const name = $('[data-home-you-name]'), text = $('[data-home-you-text]'), go = $('[data-home-you-go]');
    if (name) name.textContent = c.label;
    if (text) text.textContent = id === 'staff' && window.HUB && HUB.privateFeed ? 'The private feed is open in this tab. Every page now shows what only the team should see: session notes, contact details, participants and jury scores. Compare the two feeds below.' : c.text;
    if (go) { go.href = c.start; go.firstChild.textContent = 'Start with ' + c.page + ' '; }
    $$('.home-persona').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setPersona === id)));
    counts();
  }
  // The staff view: what Odoo holds against what it publishes, model by model.
  const people = ['mentors', 'suppliers', 'talent'];
  const privateFields = { sessions: 'session notes', suppliers: 'contact details', vibathons: 'participants', projects: 'jury scores' };
  function priv(f) {
    const c = privateCounts(f);
    HUB.publicFeed().then(pf => {
      const tbody = $('[data-home-staff-rows]'); if (!tbody) return;
      const total = Object.values(f).filter(Array.isArray).reduce((s, v) => s + v.length, 0); tbody.innerHTML = '';
      for (const k of Object.keys(labels)) {
        const n = c[k] ?? 0, p = Array.isArray(pf[k]) ? pf[k].length : 0, diff = n - p;
        const held = [];
        if (diff > 0) held.push(fmt(diff) + (diff === 1 ? ' record' : ' records') + (people.includes(k) ? ' not published or without consent' : ' not published'));
        if (privateFields[k]) held.push('all ' + privateFields[k]);
        const tr = document.createElement('tr');
        tr.innerHTML = '<th scope="row"></th><td class="num" data-th="Public feed"></td><td class="num" data-th="Private feed"></td><td data-th="Held back from the public"></td>';
        tr.children[0].textContent = labels[k]; tr.children[1].textContent = fmt(p); tr.children[2].textContent = fmt(n);
        tr.children[3].textContent = held.length ? held.join('; ') : 'nothing';
        tbody.append(tr);
      }
      const el = $('[data-home-private-n]'); if (el) el.innerHTML = '<strong>' + fmt(total) + '</strong> records · open in this tab';
    });
    $('[data-home-staff-wait]')?.setAttribute('hidden', '');
    $('[data-home-staff-table]')?.removeAttribute('hidden');
    persona(HUB.persona);
  }
  const start = () => { if (!window.HUB) return; HUB.on('persona', persona); HUB.on('private', priv); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
</script>`;

  return layout({
    body: hero + you + board + tryIt + coming + odooBand + quote + v1,
    description: 'The AE Innovation Hub by Algarve Evolution: incubation and acceleration, Challenge Connect, Vibathon and the Talent Ecosystem, four activities on one source of truth, Odoo. A prototype to try as different personas.',
    head: '<link rel="stylesheet" href="/hub/home.css">',
    scripts: script,
    pageClass: 'page-home',
  });
}
