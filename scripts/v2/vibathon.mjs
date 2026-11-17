// Vibathon: hackathons, workshops and juries (the third activity of the AE Innovation Hub).
// The journey of every event: register, build, present, next step. Everything is read from the Odoo feed
// (aih.vibathon, aih.project, res.partner, event.event); the private parts (participants, jury scores) open in the
// browser for the Algarve Evolution team (src/hub/vibathon.js). Owner: sites-dev@AgentiCCells.dinis. Apache-2.0.
export const path = '/v2/vibathon/';
export const title = 'Vibathon: hackathons and workshops';
export const nav = 'Vibathon';

// The routing rule from a project's next step to a follow-up lane: a proposal of ours, not a field in Odoo.
// Rules are tried in order; partners are found in the Talent Ecosystem ("parceiros" on António's whiteboard).
export const LANES = [
  { id: 'inc-acc', name: 'INC/ACC', verb: 'Apply to incubation or acceleration', href: '/v2/inc-acc/' },
  { id: 'challenge', name: 'Challenge Connect', verb: 'Test it with a first customer or a pilot', href: '/v2/challenge-connect/' },
  { id: 'talent', name: 'Talent Ecosystem', verb: 'Find partners, skills and people in the network', href: '/v2/talent/' },
];
export const RULES = [
  { id: 'none', re: '^stopped|split up|abandon' },
  { id: 'inc-acc', re: 'incubat|accelerat|cohort|programme' },
  { id: 'talent', re: 'partner|co-?founder|developer|designer|network|community|hire' },
  { id: 'challenge', re: 'pilot|customer|client|concession|marina|fisher|hotel|test with|talk to|sell' },
];
export const laneOf = step => (RULES.find(r => new RegExp(r.re, 'i').test(step || '')) || { id: 'talent' }).id;
const NO_LANE = { id: 'none', name: 'No follow-up', verb: '', href: '#after' };
export const CRITERIA = ['Problem', 'Prototype', 'Next step'];

const KIND = { hackathon: 'Hackathon', workshop: 'Workshop', buildathon: 'Buildathon' };
const TOWNS = ['Faro', 'Lagos', 'Loulé', 'Portimão', 'Quarteira', 'Monchique', 'Olhão', 'Tavira', 'Albufeira', 'Silves', 'Aljezur', 'Lagoa', 'Porches', 'Vilamoura', 'Sagres'];
const noEmoji = s => String(s || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim();
const townOf = place => TOWNS.find(t => new RegExp(`\\b${t}\\b`, 'i').test(place || '')) || String(place || '').split(',')[0];

export function render({ layout, feed, data, h, ix }) {
  const { esc } = h;
  const today = String(feed.meta?.exported || '').slice(0, 10) || '2026-11-16';
  const vibs = [...(feed.vibathons || [])].sort((a, b) => a.date.localeCompare(b.date));
  const projects = feed.projects || [];
  const projOf = v => projects.filter(p => p.vibathon_id === v.id).sort((a, b) => rank(a) - rank(b));
  const rank = p => { const m = /first|second|third/i.exec(p.prize || ''); return m ? ['first', 'second', 'third'].indexOf(m[0].toLowerCase()) : 9; };
  const past = v => v.date < today;
  const upcoming = vibs.filter(v => !past(v));
  const next = upcoming[0];
  const lastPast = [...vibs].reverse().find(past);
  const mentorIds = [...new Set(vibs.flatMap(v => v.mentor_ids || []))];
  const totalReg = vibs.reduce((s, v) => s + (v.registrations || 0), 0);
  const jurors = vibs.reduce((s, v) => s + (v.jury || []).length, 0);
  const followUps = vibs.reduce((s, v) => s + (v.next_steps || []).length, 0) + projects.length;

  // The real Vibathon Algarve 2026: in src/data/events.json with its sources, and in Algarve Evolution's Events app.
  const real = (data.events?.events || []).find(e => e.id === 'vibathon-algarve-2026');
  const realOdoo = (feed.events || []).find(e => /^vibathon$/i.test(e.name) || /\/event\/vibathon-/.test(e.source || ''));
  const srcBy = new Map((data.sources?.sources || []).map(s => [s.url, s]));
  const cite = urls => (urls || []).map(u => `<a href="${esc(u)}" rel="noopener" title="${esc(srcBy.get(u)?.title || u)}">${esc(srcBy.get(u)?.publisher || new URL(u).hostname)}</a>`).join(', ');
  const related = (feed.events || [])
    .filter(e => e !== realOdoo && /hackathon|hack day|vibathon|build lab|8h2 build|build with ai|startup weekend|workshop|vibe.coding/i.test(e.name) && !/lisboa|porto|madrid|online/i.test(e.place || ''))
    .sort((a, b) => b.start.localeCompare(a.start)).slice(0, 8);

  const mentorCard = id => {
    const m = ix.mentors?.[id]; if (!m) return '';
    return `<li class="vb-person" data-mentor="${esc(m.id)}"><span class="vb-avatar" aria-hidden="true">${esc(m.name.replace(/\D/g, '').slice(-2) || 'M')}</span><span><strong>${esc(m.name)}</strong> ${h.sim(m)}<small>${m.kind === 'guest' ? 'Guest mentor' : 'One-to-one mentor'} · ${esc(m.town)}</small><small>${esc((m.expertise || []).join(', '))}</small></span></li>`;
  };
  const juryList = v => (v.jury || []).length
    ? `<ul class="vb-jury">${v.jury.map(j => `<li><strong>${esc(j.name)}</strong><small>${esc(j.role || '')}</small></li>`).join('')}</ul>`
    : `<p class="vb-empty">${past(v) ? 'No jury recorded in Odoo for this event.' : 'The jury is not announced yet.'}</p>`;
  const projectCard = p => {
    const lane = LANES.find(l => l.id === laneOf(p.next_step)) || NO_LANE;
    return `<li class="card vb-project${p.prize ? ' has-prize' : ''}" id="${esc(p.id)}" data-project="${esc(p.id)}">
      <div class="vb-project-top">${p.prize ? `<span class="vb-prize vb-prize-${rank(p)}">${esc(p.prize.replace(/\s*\(simulated\)/i, ''))}</span>` : '<span class="vb-prize vb-prize-none">Presented</span>'} ${h.sim(p)}</div>
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.summary)}</p>
      <p class="vb-team"><span class="vh">Team: </span>${(p.team || []).length ? esc(p.team.join(', ')) : '<em>Team not public (no consent)</em>'}</p>
      <p class="vb-next"><span>Next step</span> ${esc(p.next_step || 'Not set')} ${lane.id === 'none' ? '' : `<a class="vb-lane-tag lane-${lane.id}" href="#after">${esc(lane.name)}</a>`}</p>
      <div class="vb-private-slot" data-score-slot="${esc(p.id)}" data-only="staff" hidden></div>
    </li>`;
  };

  const eventDetail = v => {
    const ps = projOf(v); const isPast = past(v);
    return `<article class="vb-event" id="${esc(v.id)}" aria-labelledby="${esc(v.id)}-h">
    <header class="vb-event-head">
      <div>
        <p class="vb-meta"><span class="tag tag-navy">${esc(KIND[v.kind] || v.kind)}</span><span class="tag ${isPast ? '' : 'tag-accent'}">${isPast ? 'Took place' : 'Upcoming'}</span>${h.sim(v)} ${h.src(v)}</p>
        <h3 id="${esc(v.id)}-h">${esc(v.name)}</h3>
        <p class="vb-where">${esc(h.date(v.date))} · ${esc(v.venue)} · ${esc(v.town)}</p>
      </div>
      <div class="stats vb-stats">
        <div class="stat"><span class="stat-n">${h.num(v.registrations)}</span><span class="stat-l">registered</span></div>
        <div class="stat"><span class="stat-n">${h.num((v.mentor_ids || []).length)}</span><span class="stat-l">mentors</span></div>
        <div class="stat"><span class="stat-n">${h.num((v.jury || []).length)}</span><span class="stat-l">jurors</span></div>
        <div class="stat"><span class="stat-n">${h.num(ps.length)}</span><span class="stat-l">projects</span></div>
      </div>
    </header>
    <ol class="vb-steps">
      <li class="vb-step" data-for="participant staff">
        <div class="vb-step-label"><span class="vb-n">1</span><h4>Register</h4>${h.odoo('aih.vibathon.participant')}</div>
        <div class="vb-step-body">
          <p><strong>${h.num(v.registrations)} people registered.</strong> ${isPast ? 'Registration is closed.' : 'Registration is open.'} Who they are is private in Odoo: the Algarve Evolution team sees the participant list with the access key.</p>
          <div class="vb-private-slot" data-participants-slot="${esc(v.id)}" data-only="staff" hidden><p class="vb-locked">Open the private feed to see the participant records.</p></div>
          ${!isPast && v === next ? `<p data-only="visitor founder mentor challenger supplier"><a href="#you" class="btn btn-primary" data-go-persona="participant">Try it as a participant to register</a></p>
          <form class="vb-form hub-form" id="vb-register" data-only="participant" hidden data-vibathon="${esc(v.id)}" data-odoo-id="${esc(v.odoo?.id)}" novalidate>
            <h5>Register for ${esc(v.name)}</h5>
            <div class="vb-fields">
              <label class="field"><span>Your name</span><input name="name" autocomplete="name" required maxlength="80"></label>
              <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" required maxlength="120"></label>
              <label class="field"><span>You join as</span><select name="as"><option>Builder</option><option>Designer</option><option>Domain expert</option><option>Student</option></select></label>
            </div>
            <label class="vb-check"><input type="checkbox" name="consent"> <span>If my team presents, Algarve Evolution may show my name on the hub (consent, kept on my contact in Odoo).</span></label>
            <p class="vb-actions"><button class="btn btn-primary" type="submit">Register</button> <span class="local-note">Kept in this browser only. Nothing is sent.</span></p>
            <p class="vb-msg" role="status"></p>
            <div class="vb-odoo-call" data-call="register"></div>
          </form>` : ''}
        </div>
      </li>
      <li class="vb-step" data-for="mentor">
        <div class="vb-step-label"><span class="vb-n">2</span><h4>Build</h4>${h.odoo('res.partner', (v.mentor_ids || []).length)}</div>
        <div class="vb-step-body">
          <p>${isPast ? 'Teams built with' : 'Teams will build with'} ${h.num((v.mentor_ids || []).length)} mentor${(v.mentor_ids || []).length === 1 ? '' : 's'} on hand. Mentors are named only when they have given consent in Odoo.</p>
          <ul class="vb-people">${(v.mentor_ids || []).map(mentorCard).join('')}</ul>
          <div class="vb-private-slot" data-mentors-slot="${esc(v.id)}" data-only="staff" hidden></div>
        </div>
      </li>
      <li class="vb-step" data-for="participant visitor">
        <div class="vb-step-label"><span class="vb-n">3</span><h4>Present</h4>${h.odoo('aih.project', ps.length)}</div>
        <div class="vb-step-body">
          <div class="vb-present">
            <div class="vb-jury-box"><h5>The jury</h5>${juryList(v)}<p class="vb-rule">Consent rule: a juror appears here only when their contact in Odoo says they agreed to be named. Scores stay in the private feed.</p>${h.odoo('aih.vibathon.jury', (v.jury || []).length)}<div class="vb-private-slot" data-jury-slot="${esc(v.id)}" data-only="staff" hidden></div></div>
            <div class="vb-projects-box">
              ${ps.length ? `<h5>The projects presented at the end</h5><ul class="cards vb-projects">${ps.map(projectCard).join('')}</ul>` : `<p class="vb-empty">${isPast ? 'No projects recorded.' : 'Projects appear here when the teams present at the end of the day.'}</p>`}
              <div class="vb-private-slot" data-extra-projects="${esc(v.id)}" data-only="staff" hidden></div>
              ${!isPast && v === next ? `<form class="vb-form hub-form" id="vb-submit" data-only="participant" hidden data-vibathon="${esc(v.id)}" data-odoo-id="${esc(v.odoo?.id)}" novalidate>
                <h5>Submit your project (on the day, before you present)</h5>
                <div class="vb-fields">
                  <label class="field"><span>Project name</span><input name="name" required maxlength="60"></label>
                  <label class="field"><span>Team</span><input name="team" maxlength="200"><span class="field-hint">Names, separated by commas</span></label>
                  <label class="field vb-wide"><span>What it does, in one sentence</span><textarea name="summary" rows="2" required maxlength="240"></textarea></label>
                  <label class="field vb-wide"><span>Your next step after the event</span><input name="next_step" required maxlength="120" placeholder="For example: test with three hotels in Portimão"></label>
                </div>
                <p class="field-hint">Staff publish a project in Odoo after the event.</p>
                <p class="vb-actions"><button class="btn btn-primary" type="submit">Submit project</button> <span class="local-note">Kept in this browser only. Nothing is sent.</span></p>
                <p class="vb-msg" role="status"></p>
                <div class="vb-odoo-call" data-call="submit"></div>
              </form>` : ''}
            </div>
          </div>
        </div>
      </li>
      <li class="vb-step" data-for="founder challenger supplier staff">
        <div class="vb-step-label"><span class="vb-n">4</span><h4>Next step</h4>${h.odoo('aih.vibathon', 1)}</div>
        <div class="vb-step-body">
          ${(v.next_steps || []).length ? `<p>What Algarve Evolution does after the event:</p><ul class="vb-ticks">${v.next_steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul>${ps.length ? `<p>Every team leaves with its own next step, routed into the hub: <a href="#after">see the follow-up pipeline</a>.</p>` : ''}` : `<p class="vb-empty">${isPast ? 'No next steps recorded.' : 'The next steps are set after the event, one for the event and one for every team.'}</p>`}
        </div>
      </li>
    </ol>
  </article>`;
  };

  // The calendar: the feed's vibathons and the real Vibathon Algarve 2026, by date.
  const maxReg = Math.max(1, ...vibs.map(v => v.registrations || 0));
  const cal = [
    ...vibs.map(v => ({ date: v.date, html: `<li class="card${past(v) ? ' vb-past' : ' card-accent'}"><p class="card-kicker">${esc(h.date(v.date))}</p><h3><a href="#${esc(v.id)}">${esc(v.name)}</a></h3><p class="card-meta"><span class="tag tag-navy">${esc(KIND[v.kind] || v.kind)}</span>${past(v) ? '<span class="tag">Took place</span>' : '<span class="tag tag-accent">Upcoming</span>'} ${esc(v.venue)}</p><div class="progress" role="progressbar" aria-label="Registrations" aria-valuenow="${v.registrations || 0}" aria-valuemin="0" aria-valuemax="${maxReg}"><span style="--v:${Math.round((v.registrations || 0) / maxReg * 100)}%"></span></div><p class="card-foot"><span>${h.num(v.registrations)} registered · ${projOf(v).length} projects</span>${h.sim(v)}</p></li>` })),
    ...(real ? [{ date: real.start, html: `<li class="card vb-real-c"><p class="card-kicker">${esc(h.date(real.start))}</p><h3><a href="#real">${esc(real.name.en)}</a></h3><p class="card-meta"><span class="tag tag-ok">Real event</span>${real.start < today ? '<span class="tag">Took place</span>' : '<span class="tag tag-accent">Upcoming</span>'} ${esc(real.place.en)}</p><p>Sold out, with a waiting list.</p><p class="card-foot"><span>Registrations not in our Odoo</span><a class="src-link" href="${esc(real.sources[0])}" rel="noopener">source</a></p></li>` }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date)).map(x => x.html).join('');

  // The follow-up pipeline: every presented project in a lane.
  const laneCols = LANES.map(l => {
    const ps = projects.filter(p => laneOf(p.next_step) === l.id);
    return `<section class="vb-lane lane-${l.id}" data-lane="${l.id}" data-for="${l.id === 'inc-acc' ? 'founder' : l.id === 'challenge' ? 'challenger supplier' : 'none'}" aria-labelledby="lane-${l.id}-h">
      <header><h3 id="lane-${l.id}-h">${esc(l.name)}</h3><p>${esc(l.verb)}</p><span class="vb-lane-n" data-lane-count="${l.id}">${ps.length}</span></header>
      <ul class="vb-lane-list" data-lane-list="${l.id}">${ps.map(p => `<li class="vb-card" data-card="${esc(p.id)}"><strong>${esc(p.name)}</strong> ${h.sim(p)}<span>${esc(p.next_step)}</span><small>${esc(ix.vibathons?.[p.vibathon_id]?.name || '')}${p.prize ? ` · ${esc(p.prize.replace(/\s*\(simulated\)/i, ''))}` : ''}</small></li>`).join('') || '<li class="vb-empty">No team in this lane yet.</li>'}</ul>
      <a class="vb-lane-go" href="${l.href}">Go to ${esc(l.name)}</a>
    </section>`;
  }).join('');
  const teamPeople = [...new Set(projects.flatMap(p => p.team || []))];

  // The funnel for the last event that took place.
  const funnel = (() => {
    const v = lastPast; if (!v) return '';
    const ps = projOf(v);
    const rows = [['Registered', v.registrations || 0, 'aih.vibathon'], ['Projects presented', ps.length, 'aih.project'], ['Prizes', ps.filter(p => p.prize).length, 'aih.project'], ['Teams with a next step', ps.filter(p => p.next_step).length, 'aih.project']];
    const W = 360, rowH = 58, max = Math.max(...rows.map(r => r[1]), 1);
    const scale = n => Math.max(6, Math.sqrt(n / max) * (W - 44));
    return `<figure class="vb-funnel"><figcaption>From registration to next step: ${esc(v.name)} ${h.sim(v)}</figcaption>
      <svg viewBox="0 0 ${W} ${rows.length * rowH}" role="img" aria-label="${esc(rows.map(r => `${r[0]}: ${r[1]}`).join(', '))}" data-funnel>
        ${rows.map((r, i) => `<g transform="translate(0 ${i * rowH})"><text x="0" y="15" class="fl-label">${esc(r[0])}</text><rect x="0" y="23" width="${scale(r[1]).toFixed(1)}" height="24" class="fl-bar fl-${i}"></rect><text x="${(6 + scale(r[1])).toFixed(1)}" y="41" class="fl-val">${h.num(r[1])}</text></g>`).join('')}
      </svg><p class="vb-note">Bar length is the square root of the count, so the small numbers stay readable. Simulated records from Odoo.</p></figure>`;
  })();

  // What the browser needs: a small slice of the public feed.
  const client = {
    today, lanes: LANES, criteria: CRITERIA,
    next: next ? { id: next.id, odoo: next.odoo?.id, name: next.name, date: next.date } : null,
    vibathons: vibs.map(v => ({ id: v.id, odoo: v.odoo?.id, name: v.name, date: v.date, kind: v.kind, venue: v.venue, mentor_ids: v.mentor_ids || [], jury: v.jury || [], registrations: v.registrations, project_ids: projOf(v).map(p => p.id), simulated: v.simulated })),
    projects: projects.map(p => ({ id: p.id, odoo: p.odoo?.id, vibathon_id: p.vibathon_id, name: p.name, team: p.team || [], summary: p.summary, prize: p.prize || '', next_step: p.next_step || '', simulated: p.simulated, lane: laneOf(p.next_step) })),
    mentors: mentorIds.map(id => ix.mentors?.[id]).filter(Boolean).map(m => ({ id: m.id, odoo: m.odoo?.id, name: m.name, kind: m.kind, expertise: m.expertise || [], town: m.town })),
    people: Object.fromEntries([...(feed.talent || []), ...(feed.mentors || [])].filter(t => t.name).map(t => [t.name, { id: t.id, odoo: t.odoo?.id }])),
    rules: RULES,
  };

  const body = `
<div class="vb">
<section class="vb-hero" aria-labelledby="vb-h1">
  <div class="hub-wrap">
    <p class="kicker kicker-light">Vibathon · hackathons, workshops, juries</p>
    <h1 id="vb-h1">Register, build, present, next step.</h1>
    <p class="vb-lead">The third activity of the AE Innovation Hub. In António Guerreiro's words, it holds the hackathons and the workshops, the participants, the mentors of each programme and the jury; the projects; who registered and what they presented at the end; and a next step after the event. Every number below is read from Odoo.</p>
    <ol class="vb-journey" aria-label="The journey of a Vibathon">
      <li><a href="#calendar"><span class="vb-n">1</span><strong>Register</strong><span class="vb-j-num">${h.num(totalReg)}</span><span class="vb-j-txt">registrations across ${vibs.length} vibathons</span></a></li>
      <li><a href="#${esc((lastPast || vibs[0] || {}).id || 'calendar')}"><span class="vb-n">2</span><strong>Build</strong><span class="vb-j-num">${h.num(mentorIds.length)}</span><span class="vb-j-txt">mentors on hand</span></a></li>
      <li><a href="#jury"><span class="vb-n">3</span><strong>Present</strong><span class="vb-j-num">${h.num(projects.length)}</span><span class="vb-j-txt">projects, judged by ${h.num(jurors)} jurors</span></a></li>
      <li><a href="#after"><span class="vb-n">4</span><strong>Next step</strong><span class="vb-j-num">${h.num(followUps)}</span><span class="vb-j-txt">follow-ups into the hub</span></a></li>
    </ol>
    <p class="vb-chips">${h.odoo('aih.vibathon', vibs.length)} ${h.odoo('aih.project', projects.length)} ${h.odoo('aih.vibathon.jury', jurors)} ${h.odoo('event.event', realOdoo ? 1 + related.length : related.length)}</p>
  </div>
</section>

<section class="hub-sec hub-sec-mist hub-sec-tight vb-you" id="you" aria-labelledby="vb-you-h">
  <div class="hub-wrap">
    <h2 id="vb-you-h" class="vh">Your view <span data-vb-persona-name>as a visitor</span></h2>
    <div class="persona-panel vb-panel" data-only="visitor">
      <p class="persona-panel-head">For visitors</p>
      <p>You see what anyone can see: the vibathons, the projects the teams presented and where each team went next. Try the page as a <button type="button" class="vb-link" data-go-persona="participant">participant or juror</button>, a <button type="button" class="vb-link" data-go-persona="mentor">mentor</button> or the <button type="button" class="vb-link" data-go-persona="staff">Algarve Evolution team</button>.</p>
    </div>
    <div class="persona-panel vb-panel" data-only="participant" hidden>
      <p class="persona-panel-head">For participants and jurors</p>
      <div class="vb-role" role="radiogroup" aria-label="At the Vibathon you are">
        <label><input type="radio" name="vb-role" value="participant" checked> A participant</label>
        <label><input type="radio" name="vb-role" value="jury"> On the jury</label>
      </div>
      <div class="vb-role-participant">
        <ol class="vb-track" data-track aria-label="Your journey">
          <li data-track-step="register"><span class="vb-n">1</span><strong>Register</strong><small data-track-text="register">${next ? `For ${esc(next.name)}, ${esc(h.date(next.date))}` : 'No upcoming vibathon'}</small></li>
          <li data-track-step="build"><span class="vb-n">2</span><strong>Build</strong><small data-track-text="build">With the mentors on the day</small></li>
          <li data-track-step="present"><span class="vb-n">3</span><strong>Present</strong><small data-track-text="present">Submit your project before you present</small></li>
          <li data-track-step="next"><span class="vb-n">4</span><strong>Your next step</strong><small data-track-text="next">Appears when you submit a project</small></li>
        </ol>
        <p class="vb-panel-actions">${next ? `<a class="btn btn-primary" href="#${esc(next.id)}" data-track-cta>Register for ${esc(next.name)}</a>` : ''} <button type="button" class="vb-link" data-reset>Clear what this browser keeps</button></p>
      </div>
      <div class="vb-role-jury">
        <p>You are on the jury. Score the projects in the <a href="#jury">jury room</a> against three criteria; your scores stay in this browser, and the Odoo call that would record them is shown under the sheet. <span data-jury-progress></span></p>
      </div>
    </div>
    <div class="persona-panel vb-panel" data-only="mentor" hidden>
      <p class="persona-panel-head">For mentors: the teams you help</p>
      <label class="vb-inline">You are <select data-mentor-pick>${client.mentors.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></label>
      <div data-mentor-view></div>
    </div>
    <div class="persona-panel vb-panel" data-only="founder" hidden><p class="persona-panel-head">For founders</p><p>Teams whose next step is a programme are in the <a href="#after">INC/ACC lane</a>: they would join a cohort like yours. <a href="/v2/inc-acc/">See INC/ACC</a>.</p></div>
    <div class="persona-panel vb-panel" data-only="challenger" hidden><p class="persona-panel-head">For challenge owners</p><p>Teams looking for a first customer or a pilot are in the <a href="#after">Challenge Connect lane</a>. If one of them could solve your problem, <a href="/v2/challenge-connect/">post a challenge</a> and invite them to apply.</p></div>
    <div class="persona-panel vb-panel" data-only="supplier" hidden><p class="persona-panel-head">For suppliers</p><p>Vibathon teams become suppliers too: the <a href="#after">Challenge Connect lane</a> shows the ones ready for a pilot. <a href="/v2/challenge-connect/">See the open challenges</a>.</p></div>
    <div class="persona-panel persona-panel-private vb-panel" data-only="staff" hidden>
      <p class="persona-panel-head">Algarve Evolution team: the private feed</p>
      <div data-staff-view><p class="vb-locked">The private feed is not open in this tab. Choose "Algarve Evolution team" again and enter the access key to see participants, registrations data and jury scores.</p></div>
      <p class="vb-panel-actions"><button type="button" class="btn btn-primary" data-export>Export the follow-ups as CSV</button> <span class="local-note" data-export-note>Public fields only until the private feed is open.</span></p>
    </div>
  </div>
</section>

${real ? `<section class="hub-sec vb-real" id="real" aria-labelledby="real-h">
  <div class="hub-wrap vb-real-grid">
    <div class="vb-real-card">
      <p class="kicker">The real one</p>
      <h2 id="real-h">${esc(real.name.en)}</h2>
      <p class="vb-where">${esc(h.date(real.start))} · ${esc(real.place.en)}</p>
      <p class="vb-real-sum">${esc(real.summary.en)}</p>
      <p class="src">Sources: ${cite(real.sources)}${realOdoo ? `; and the event in Algarve Evolution's own Odoo: <a href="${esc(realOdoo.source)}" rel="noopener">${esc(noEmoji(realOdoo.name))}, ${esc(h.date(realOdoo.start))}</a> ${h.odoo('event.event', 1)}` : ''}</p>
      <p class="vb-real-gap">Its registrations, mentors, jury and projects are not in our Odoo. The vibathons below are <span class="sim-badge">Simulated</span> records that show how the next one would look once they are; anything real carries a source.</p>
    </div>
    ${related.length ? `<div class="vb-related">
      <h3>Other hackathons and workshops in Algarve Evolution's Events app</h3>
      <ul>${related.map(e => `<li><span class="vb-rel-date">${esc(h.date(e.start))}</span><a href="${esc(e.source || e.url)}" rel="noopener">${esc(noEmoji(e.name))}</a><small>${esc(townOf(e.place))}</small></li>`).join('')}</ul>
      <p class="src">Read from <a href="https://www.algarveevolution.pt/event" rel="noopener">algarveevolution.pt/event</a> into Odoo. ${h.odoo('event.event', related.length)}</p>
    </div>` : ''}
  </div>
</section>` : ''}

<section class="hub-sec hub-sec-mist vb-cal" id="calendar" aria-labelledby="cal-h">
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">The calendar</p><h2 id="cal-h" class="hub-h2">Vibathons, past and upcoming</h2><p class="hub-lede">Hackathons, workshops and buildathons, each with its date, venue, town and registrations.</p></div>${h.odoo('aih.vibathon', vibs.length)}</div>
    <ol class="cards vb-cal-list">${cal}</ol>
  </div>
</section>

<section class="hub-sec vb-events" aria-labelledby="ev-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">Each event</p><h2 id="ev-h" class="hub-h2">Who registered, who helped, what was presented</h2></div>
    ${[...vibs].sort((a, b) => (past(a) === past(b) ? b.date.localeCompare(a.date) : past(a) ? 1 : -1)).map(eventDetail).join('')}
  </div>
</section>

<section class="hub-sec hub-sec-navy vb-juryroom" id="jury" aria-labelledby="jury-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">The jury room</p><h2 id="jury-h" class="hub-h2">How the jury decides</h2>
      <p class="hub-lede">Each juror scores each project from 1 to 10 on three criteria: <strong>${CRITERIA.join('</strong>, <strong>')}</strong> (the criteria are a proposal). The average decides the prizes. Jurors are named only with their consent; the scores are private in Odoo (aih.project.score) and open only for the Algarve Evolution team.</p></div>
    <div class="vb-jury-grid">
      ${vibs.filter(v => (v.jury || []).length).map(v => `<div class="vb-jury-card"><h3>${esc(v.name)} ${h.sim(v)}</h3><ul class="vb-jury vb-jury-dark">${v.jury.map(j => `<li><strong>${esc(j.name)}</strong><small>${esc(j.role || '')}</small></li>`).join('')}</ul><p class="vb-note">${h.odoo('aih.vibathon.jury', v.jury.length)}</p></div>`).join('')}
      ${lastPast && projOf(lastPast).some(p => p.prize) ? `<div class="vb-jury-card vb-verdict"><h3>The verdict: ${esc(lastPast.name)}</h3><ol>${projOf(lastPast).filter(p => p.prize).map(p => `<li><span class="vb-prize vb-prize-${rank(p)}">${esc(p.prize.replace(/\s*\(simulated\)/i, ''))}</span><a href="#${esc(p.id)}">${esc(p.name)}</a></li>`).join('')}</ol><p class="vb-note-light">${projOf(lastPast).length - projOf(lastPast).filter(p => p.prize).length} more projects presented. ${h.odoo('aih.project', projOf(lastPast).length)}</p></div>` : ''}
      <div class="vb-jury-card"><h3>The consent rule</h3><p>A juror's name shows on the hub only when their contact in Odoo records consent. The private feed holds every juror, so the team can see who scored without naming anyone in public.</p></div>
    </div>
    <div class="vb-sheet" data-only="participant staff" hidden>
      <h3>Your score sheet${lastPast ? `: ${esc(lastPast.name)}` : ''}</h3>
      <p class="vb-note-light">Move each slider from 1 to 10. <span class="local-note">Kept in this browser only. Nothing is sent.</span> <span data-only="staff" hidden>With the private feed open, your scores sit next to the jury's.</span></p>
      <div class="vb-sheet-rows" data-sheet data-vibathon="${esc(lastPast?.id || '')}"></div>
      <p><button type="button" class="btn btn-on-navy" data-save-scores>Record my scores</button> <span class="vb-msg" role="status" data-scores-msg></span></p>
      <div class="vb-odoo-call" data-call="scores"></div>
      <div data-compare></div>
    </div>
  </div>
</section>

<section class="hub-sec vb-after" id="after" aria-labelledby="after-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">After the event</p><h2 id="after-h" class="hub-h2">Every team leaves with a next step</h2>
      <p class="hub-lede">The next step each team wrote in Odoo routes it into another activity of the hub. The routing rule (keywords in the next step) is a proposal of ours, not a field in Odoo; the team can move a project to another lane.</p></div>
    ${funnel}
    <div class="vb-lanes">${laneCols}</div>
    <div data-no-lane></div>
    <p class="vb-talent-note">And every team member (${h.num(teamPeople.length)} named with consent) is invited into the <a href="/v2/talent/">Talent Ecosystem</a>, whatever lane their project is in.</p>
    <div class="vb-odoo-call" data-call="route" data-only="staff" hidden></div>
  </div>
</section>
</div>
<script type="application/json" id="vb-data">${JSON.stringify(client).replace(/</g, '\\u003c')}</script>`;

  return layout({
    body,
    description: 'Vibathon in the AE Innovation Hub: hackathons and workshops with their registrations, mentors, jury, the projects presented and a next step for every team, read from Odoo.',
    head: '<link rel="stylesheet" href="/hub/vibathon.css">',
    scripts: '<script src="/hub/vibathon.js" defer></script>',
    pageClass: 'page-vibathon',
  });
}
