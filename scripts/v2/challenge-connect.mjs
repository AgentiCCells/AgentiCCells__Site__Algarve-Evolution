// Challenge Connect: companies with a problem post a challenge, companies and individual professionals answer it as
// suppliers, Odoo scores and ranks the answers, and the company chooses or Algarve Evolution triages a top 3.
// Everything here is read from the Odoo feed (aih.challenge, aih.application, res.partner suppliers, aih.skill).
// The browser part (src/hub/challenge-connect.js) runs the same match score as the addon
// (odoo/addons/algarve_innovation_hub/models/challenge.py: skills 50, town 20, budget 30) and shows the Odoo calls.
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.
export const path = '/v2/challenge-connect/';
export const title = 'Challenge Connect';
export const nav = 'Challenge Connect';

// The Algarve's municipalities, as the addon lists them for the town part of the score.
const TOWNS = ['Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Faro', 'Lagoa', 'Lagos', 'Loulé', 'Monchique', 'Olhão', 'Portimão', 'Quarteira', 'São Brás de Alportel', 'Silves', 'Tavira', 'Vila do Bispo', 'Vila Real de Santo António'];
const STATUS = { open: 'Open', matching: 'Matching', matched: 'Matched', closed: 'Closed' };
const STATUS_TAG = { open: 'tag-accent', matching: 'tag-navy', matched: 'tag-ok', closed: '' };
const STATUS_NOTE = { open: 'Taking applications', matching: 'Applications scored, decision pending', matched: 'A supplier was chosen', closed: 'Closed' };

// Split a feed score back into its three parts from the addon's own reasons.
export function parts(score, reasons = []) {
  let skills = 25, town = 0;
  for (const r of reasons) {
    const m = r.match(/^Skills: (\d+) of (\d+)/); if (m) skills = (50 * Number(m[1])) / Number(m[2]);
    if (/^Skills: the challenge lists none/.test(r)) skills = 25;
    if (/^Town: same town/.test(r)) town = 20; else if (/^Town: elsewhere/.test(r)) town = 10;
  }
  const budget = Math.max(0, Math.round((score - skills - town) * 10) / 10);
  return { skills: Math.round(skills * 10) / 10, town, budget };
}

export function render({ layout, feed, h, ix }) {
  const { esc } = h;
  const today = String(feed.meta?.exported || '').slice(0, 10);
  const daysTo = d => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  const chs = feed.challenges, apps = feed.applications, sups = feed.suppliers;
  const matchOf = id => feed.matches.find(m => m.challenge_id === id);
  const appsOf = id => apps.filter(a => a.challenge_id === id);
  const owner = c => (c.company_id ? ix.companies[c.company_id] : null);
  const ownerName = c => owner(c)?.name || c.org || 'Organisation not public';
  const ownerTown = c => owner(c)?.town || '';
  const skills = [...new Set([...sups.flatMap(s => s.capabilities), ...chs.flatMap(c => c.skills)])].sort();
  const decided = feed.matches.filter(m => m.decision).length;
  const openish = chs.filter(c => c.status === 'open' || c.status === 'matching').length;

  const bar = (p, score, label) => {
    const w = v => Math.max(0, v).toFixed(1);
    let x = 0; const seg = (v, cls) => { const r = `<rect class="${cls}" x="${w(x)}" y="0" width="${w(v)}" height="10"/>`; x += v; return r; };
    return `<svg class="cc-bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="${esc(label || `Score ${score} of 100: skills ${p.skills}, town ${p.town}, budget ${p.budget}`)}"><rect class="cc-bar-track" x="0" y="0" width="100" height="10"/>${seg(p.skills, 'cc-s-skills')}${seg(p.town, 'cc-s-town')}${seg(p.budget, 'cc-s-budget')}</svg>`;
  };
  const legend = `<p class="cc-legend" aria-hidden="true"><span><i class="cc-k cc-s-skills"></i>Skills (up to 50)</span><span><i class="cc-k cc-s-town"></i>Town (up to 20)</span><span><i class="cc-k cc-s-budget"></i>Budget fit (up to 30)</span></p>`;
  const tags = list => `<ul class="cc-tags">${list.map(s => `<li class="tag">${esc(s)}</li>`).join('')}</ul>`;
  const pill = st => `<span class="tag ${STATUS_TAG[st] || ''} cc-status">${esc(STATUS[st] || st)}</span>`;
  const deadline = c => {
    const n = daysTo(c.deadline);
    const rel = c.status === 'closed' || c.status === 'matched' ? '' : n < 0 ? ' (passed)' : n === 0 ? ' (today)' : ` (in ${n} day${n === 1 ? '' : 's'})`;
    return `${esc(h.date(c.deadline))}${rel}`;
  };
  const supplierLine = s => (s ? `${esc(s.name)} ${h.sim(s)}` : '<span class="cc-anon">A supplier who has not agreed to be named</span>');

  // ---- One ranked row of a matching result (src/hub/challenge-connect.js draws the same markup).
  const row = (c, m, r, i) => {
    const a = ix.applications[r.application_id] || {}; const s = a.supplier_id ? ix.suppliers[a.supplier_id] : null; const p = parts(r.score, r.reasons);
    const chosen = m.chosen_application_id === r.application_id;
    return `<li class="cc-rank${i < 3 ? ' is-top' : ''}${chosen ? ' is-chosen' : ''}" data-app="${esc(r.application_id)}">
  <span class="cc-rank-n" aria-label="Rank ${i + 1}">${i + 1}</span>
  <div class="cc-rank-who"><p class="cc-rank-name">${supplierLine(s)}${i < 3 ? ' <span class="cc-top">Top 3</span>' : ''}${chosen ? ' <span class="cc-chosen">Chosen</span>' : ''}</p>
    <p class="cc-rank-meta">${s ? `${s.kind === 'company' ? 'Company' : 'Individual professional'}${s.town ? ` · ${esc(s.town)}` : ''} · ` : ''}${h.money(a.price_eur)} · ${h.num(a.days)} days</p>
    ${a.proposal ? `<p class="cc-rank-prop">${esc(a.proposal)}</p>` : ''}
    <p class="cc-rank-contact" data-contact hidden></p></div>
  <div class="cc-rank-eval"><div class="cc-rank-score"><span class="cc-score">${esc(r.score)}</span>${bar(p, r.score)}</div>
  <ul class="cc-reasons">${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="cc-rank-act" data-act></div>
</li>`;
  };

  const decisionText = (c, m) => {
    if (!m || !m.ranked.length) return `<p class="cc-decision is-none"><strong>No applications yet.</strong> Odoo ranks them once suppliers apply.</p>`;
    const chosen = m.chosen_application_id ? ix.applications[m.chosen_application_id] : null;
    const who = chosen ? (chosen.supplier_id && ix.suppliers[chosen.supplier_id] ? esc(ix.suppliers[chosen.supplier_id].name) : 'a supplier who has not agreed to be named') : '';
    if (m.decision === 'company') return `<p class="cc-decision is-company"><strong>Decision: the company chose.</strong> ${esc(ownerName(c))} picked ${who || 'a supplier'} from the ranked list${chosen ? `, ranked ${m.ranked.findIndex(r => r.application_id === m.chosen_application_id) + 1} of ${m.ranked.length}` : ''}.</p>`;
    if (m.decision === 'ae_triage') return `<p class="cc-decision is-triage"><strong>Decision: Algarve Evolution triage.</strong> The team reviewed the applications and suggested ${who || 'a top 3'}${chosen ? `, ranked ${m.ranked.findIndex(r => r.application_id === m.chosen_application_id) + 1} of ${m.ranked.length}` : ''}.</p>`;
    return `<p class="cc-decision is-pending"><strong>Decision pending.</strong> The company can choose from the ranked list, or ask Algarve Evolution to triage and suggest the best or a top 3.</p>`;
  };

  // ---- The board of challenges.
  const card = c => {
    const m = matchOf(c.id); const n = appsOf(c.id).length; const best = m?.ranked?.[0];
    return `<li class="card cc-card${c.status === 'open' ? ' card-accent' : ''}" data-ch="${esc(c.id)}" data-status="${esc(c.status)}" data-skills="${esc(c.skills.join('|'))}">
  <div class="cc-card-top">${pill(c.status)} ${h.sim(c)}<span class="cc-fit" data-fit hidden></span></div>
  <h3 class="cc-card-title"><a href="#challenge-${esc(c.id)}" data-open="${esc(c.id)}">${esc(c.title)}</a></h3>
  <p class="card-meta">${esc(ownerName(c))}${ownerTown(c) ? ` · ${esc(ownerTown(c))}` : ''}</p>
  <p class="cc-card-problem">${esc(c.problem)}</p>
  ${tags(c.skills)}
  <dl class="cc-facts">
    <div><dt>Budget</dt><dd>${h.money(c.budget_eur_min)} to ${h.money(c.budget_eur_max)}</dd></div>
    <div><dt>Deadline</dt><dd>${deadline(c)}</dd></div>
    <div><dt>Applications</dt><dd>${h.num(n)}</dd></div>
    <div><dt>Best score</dt><dd>${best ? `${esc(best.score)} of 100` : 'None yet'}</dd></div>
  </dl>
  <p class="card-foot cc-card-go"><a href="#challenge-${esc(c.id)}" data-open="${esc(c.id)}" aria-label="Requirements, applications and matching result: ${esc(c.title)}">Requirements and matching result</a></p>
</li>`;
  };

  // ---- One challenge in full, with its applications and matching result.
  const detail = c => {
    const m = matchOf(c.id) || { ranked: [], decision: null };
    const takes = c.status === 'open' || c.status === 'matching';
    return `<article class="cc-detail" id="challenge-${esc(c.id)}" data-ch="${esc(c.id)}" tabindex="-1" aria-labelledby="t-${esc(c.id)}">
  <header class="cc-detail-head">
    <p class="cc-detail-kick">${pill(c.status)} <span>${esc(STATUS_NOTE[c.status] || '')}</span> ${h.sim(c)} ${h.odoo('aih.challenge')}</p>
    <h3 id="t-${esc(c.id)}">${esc(c.title)}</h3>
    <p class="cc-detail-owner">Posted by <strong>${esc(ownerName(c))}</strong>${owner(c) ? ` ${h.sim(owner(c))}` : ''}${ownerTown(c) ? `, ${esc(ownerTown(c))}` : ', town not given'}</p>
  </header>
  <div class="cc-detail-grid">
    <div class="cc-brief">
      <h4 class="cc-h4">1 · The problem</h4>
      <p class="cc-problem">${esc(c.problem)}</p>
      <h4 class="cc-h4">Requirements</h4>
      <ul class="cc-reqs">${c.requirements.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <h4 class="cc-h4">Skills wanted</h4>
      ${tags(c.skills)}
      <dl class="cc-facts cc-facts-2">
        <div><dt>Budget range</dt><dd>${h.money(c.budget_eur_min)} to ${h.money(c.budget_eur_max)}</dd></div>
        <div><dt>Deadline</dt><dd>${deadline(c)}</dd></div>
      </dl>
      <div class="cc-apply" data-only="supplier" hidden>
        ${takes ? `<h4 class="cc-h4">Apply as a supplier</h4>
        <form class="hub-form cc-form" data-apply="${esc(c.id)}">
          <p class="cc-as">Applying as <strong data-me-name>the supplier you picked above</strong>. <a href="#as-supplier">Change</a></p>
          <label class="field"><span>Your proposal</span><textarea name="proposal" rows="3" required maxlength="600" placeholder="How you would solve it, in a few lines"></textarea></label>
          <div class="cc-form-row"><label class="field"><span>Price (EUR)</span><input name="price" type="number" min="0" step="100" required inputmode="numeric" value="${Math.round((c.budget_eur_min + c.budget_eur_max) / 2 / 100) * 100}"></label>
          <label class="field"><span>Days to deliver</span><input name="days" type="number" min="1" max="365" required inputmode="numeric" value="20"></label></div>
          <p class="cc-preview" data-preview aria-live="polite"></p>
          <button class="btn btn-accent" type="submit">Apply (kept in this browser only)</button>
        </form>
        <div data-call></div>` : `<p class="cc-note">This challenge is ${esc(STATUS[c.status].toLowerCase())}: it no longer takes applications.</p>`}
      </div>
    </div>
    <div class="cc-result">
      <div class="cc-result-head"><h4 class="cc-h4">2 and 3 · Applications, scored and ranked</h4>${h.odoo('aih.application', appsOf(c.id).length)}</div>
      <p class="cc-result-intro">Odoo scores every application out of 100 (skills overlap 50, town 20, budget fit 30) and ranks them. The top 3 are highlighted.</p>
      ${legend}
      <ol class="cc-ranks" data-ranks="${esc(c.id)}">${m.ranked.map((r, i) => row(c, m, r, i)).join('')}</ol>
      <h4 class="cc-h4">4 · The decision</h4>
      <div data-decision="${esc(c.id)}">${decisionText(c, m)}</div>
      <div class="cc-owner-act" data-only="challenger" hidden data-owner-act="${esc(c.id)}"></div>
      <div data-call-decision="${esc(c.id)}"></div>
      <h4 class="cc-h4">5 · Next step</h4>
      <p class="cc-next">${m.decision ? 'A short paid pilot with the chosen supplier, agreed between the company and the supplier, with Algarve Evolution following the result.' : 'Once a supplier is chosen: a short paid pilot with them, with Algarve Evolution following the result.'} <span class="cc-proposal">Proposal: not yet in Odoo</span></p>
    </div>
  </div>
</article>`;
  };

  const supCard = s => `<li class="card cc-sup" data-sup="${esc(s.id)}" data-kind="${esc(s.kind)}" data-caps="${esc(s.capabilities.join('|'))}">
  <p class="cc-sup-kind">${s.kind === 'company' ? 'Company' : 'Individual'} ${h.sim(s)}</p>
  <h3 class="cc-sup-name">${esc(s.name)}</h3>
  <p class="cc-sup-town">${esc(s.town || 'Town not given')}${s.rate ? ` · ${esc(s.rate)}` : ''}</p>
  ${tags(s.capabilities)}
  <p class="cc-sup-apps">${h.num(apps.filter(a => a.supplier_id === s.id).length)} application(s) in Odoo</p>
  <p class="cc-rank-contact" data-contact hidden></p>
</li>`;

  const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(l)}</option>`;
  const cfg = { towns: TOWNS, skills, today, db: feed.meta?.odoo?.db || 'algarve_innovation_hub' };

  const body = `<div class="cc">
<section class="hub-sec hub-sec-navy cc-hero">
  <div class="hub-wrap cc-hero-grid">
    <div class="cc-hero-copy">
      <p class="kicker kicker-light">Activity 2 of 4 · AE Innovation Hub</p>
      <h1>Challenge Connect</h1>
      <p class="cc-lede">A company presents a challenge. Other companies and individual professionals answer it as suppliers. Odoo scores every answer and ranks them, and the company chooses, or Algarve Evolution triages and suggests the best or a top 3.</p>
      <p class="cc-hero-links"><a class="btn" href="#board">See the open challenges</a> <a class="btn btn-on-navy" href="#post">Post a challenge</a></p>
    </div>
    <ul class="stats stats-on-navy cc-stats" aria-label="Challenge Connect in Odoo today">
      <li class="stat"><span class="stat-n">${h.num(openish)}</span><span class="stat-l">challenges taking applications or being matched</span><span class="stat-note">${h.odoo('aih.challenge', chs.length)}</span></li>
      <li class="stat"><span class="stat-n">${h.num(apps.length)}</span><span class="stat-l">applications scored</span><span class="stat-note">${h.odoo('aih.application', apps.length)}</span></li>
      <li class="stat"><span class="stat-n">${h.num(sups.length)}</span><span class="stat-l">suppliers who agreed to be listed</span><span class="stat-note">${h.odoo('res.partner', sups.length)}</span></li>
      <li class="stat"><span class="stat-n">${h.num(decided)}</span><span class="stat-l">decisions made: company or Algarve Evolution</span><span class="stat-note">${h.odoo('aih.challenge', feed.matches.length)}</span></li>
    </ul>
  </div>
</section>

<section class="hub-sec hub-sec-tight cc-quote-band">
  <div class="hub-wrap cc-quote-grid">
    <blockquote class="cc-quote"><p>Companies on the problem side, suppliers on the solution side. From detailed information, we give the company that presented the challenge a matching result with the suppliers' data. The company can choose, or we can do the triage and suggest the best qualified, or a top 3.</p>
    <footer>António Guerreiro, executive director, Algarve Evolution, 16 November 2026. Our translation from Portuguese.</footer></blockquote>
    <ol class="cc-steps" aria-label="How a challenge moves">
      <li><span class="cc-step-n">1</span><strong>Problem</strong><span>The challenge owner writes a clear problem, requirements, skills, budget and deadline.</span></li>
      <li><span class="cc-step-n">2</span><strong>Responses</strong><span>Companies and professionals apply with a proposal, a price and the days they need.</span></li>
      <li><span class="cc-step-n">3</span><strong>Evaluation</strong><span>Odoo scores each application the same way: skills 50, town 20, budget 30.</span></li>
      <li><span class="cc-step-n">4</span><strong>Decision</strong><span>The company chooses, or Algarve Evolution triages and suggests a top 3.</span></li>
      <li><span class="cc-step-n">5</span><strong>Next step</strong><span>A short pilot with the chosen supplier. <em class="cc-proposal">Proposal</em></span></li>
    </ol>
  </div>
</section>

<nav class="cc-local" aria-label="On this page"><div class="hub-wrap"><ul>
  <li><a href="#board">Open challenges</a></li><li><a href="#challenge">Matching result</a></li><li><a href="#post">Post a challenge</a></li><li><a href="#suppliers">Suppliers</a></li><li data-only="staff" hidden><a href="#triage">Triage</a></li><li><a href="#how">How it reads Odoo</a></li>
</ul></div></nav>

<section class="hub-sec-tight cc-persona" aria-label="What you can do here">
  <div class="hub-wrap">
    <div class="persona-panel cc-pp" data-only="visitor founder mentor participant">
      <p class="persona-panel-head">Trying it as a visitor</p>
      <p>You see what Algarve Evolution publishes in Odoo: the challenges, the suppliers who agreed to be listed, and each matching result. Switch to <strong>Challenge owner</strong>, <strong>Supplier</strong> or <strong>Algarve Evolution team</strong> in the bar above to act.</p>
    </div>
    <div class="persona-panel cc-pp" data-only="challenger" hidden>
      <p class="persona-panel-head">Trying it as a challenge owner</p>
      <p><a href="#post">Post a challenge</a> and Odoo's suppliers are ranked at once. For a challenge already in Odoo, see your top 3 and choose one, or ask Algarve Evolution to triage.</p>
      <div class="cc-mine" data-owner-list aria-live="polite"></div>
    </div>
    <div class="persona-panel cc-pp" data-only="supplier" hidden id="as-supplier">
      <p class="persona-panel-head">Trying it as a supplier</p>
      <label class="cc-me">You are <select data-me>${sups.map((s, i) => opt(s.id, `${s.name} · ${s.kind === 'company' ? 'company' : 'individual'} · ${s.town}`, i === 0)).join('')}</select></label>
      <p class="cc-me-caps" data-me-caps></p>
      <p>Challenges that fit your capabilities, best first. Open one to apply.</p>
      <ol class="cc-fitlist" data-fitlist aria-live="polite"></ol>
    </div>
    <div class="persona-panel persona-panel-private cc-pp" data-only="staff" hidden>
      <p class="persona-panel-head">Trying it as the Algarve Evolution team</p>
      <p data-staff-state>Open the private feed (the access key dialog) to see every application with the suppliers' contact details, including those who have not agreed to be listed. Then go to <a href="#triage">Triage</a> to suggest a top 3 and record the decision.</p>
      <p><button class="btn btn-primary" type="button" data-unlock>Open the private feed</button></p>
    </div>
  </div>
</section>

<section id="board" class="hub-sec cc-sec">
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">The board</p><h2 class="hub-h2">Challenges</h2></div>${h.odoo('aih.challenge', chs.length)}</div>
    <div class="cc-filters" role="group" aria-label="Filter the challenges">
      <div class="cc-chips" data-status-filter>${['all', 'open', 'matching', 'matched', 'closed'].map((s, i) => `<button type="button" class="cc-chip" data-status="${s}" aria-pressed="${i === 0}">${s === 'all' ? 'All' : STATUS[s]} <span>${s === 'all' ? chs.length : chs.filter(c => c.status === s).length}</span></button>`).join('')}</div>
      <label class="cc-skillfilter">Skill <select data-skill-filter>${opt('', 'Any skill', true)}${skills.map(s => opt(s, s)).join('')}</select></label>
    </div>
    <ul class="cards cc-board cc-local-board" data-local-board aria-live="polite"></ul>
    <ul class="cards cc-board" data-board>${chs.map(card).join('')}</ul>
    <p class="cc-empty" data-board-empty hidden>No challenge matches these filters.</p>
  </div>
</section>

<section id="challenge" class="hub-sec hub-sec-mist cc-sec">
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">One challenge</p><h2 class="hub-h2">Applications and the matching result</h2></div>
      <label class="cc-pick" data-pick hidden>Challenge <select data-pick-select>${chs.map(c => opt(c.id, c.title)).join('')}</select></label></div>
    <div class="cc-details">${chs.map(detail).join('')}</div>
  </div>
</section>

<section id="post" class="hub-sec cc-sec" data-for="challenger">
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">Try the matcher</p><h2 class="hub-h2">Post a challenge</h2><p class="hub-lede">Describe the problem and the suppliers in Odoo are ranked at once, with the same score Odoo uses. Each supplier is priced at their day rate for the days you expect, so the budget part is an estimate until they apply with a real price.</p></div>${h.odoo('res.partner', sups.length)}</div>
    <div class="cc-post-grid">
      <form class="hub-form cc-form cc-post" data-post>
        <label class="field"><span>Title</span><input name="title" required maxlength="140" value="Booking data for a small hotel group"></label>
        <label class="field"><span>Organisation</span><input name="org" required maxlength="120" value="Your company"></label>
        <label class="field"><span>The problem</span><textarea name="problem" rows="3" required maxlength="800">Three small hotels keep bookings in different systems and cannot see occupancy in one place.</textarea></label>
        <label class="field"><span>Requirements</span><small class="field-hint">One per line</small><textarea name="requirements" rows="3" maxlength="800">Read-only connection to each system
One occupancy view for the managers
Data kept in the EU</textarea></label>
        <fieldset class="cc-skillset"><legend>Skills wanted <span class="cc-hint">(pick one or more)</span></legend>${skills.map(s => `<label class="cc-check"><input type="checkbox" name="skills" value="${esc(s)}"${['Data engineering', 'Web development'].includes(s) ? ' checked' : ''}> ${esc(s)}</label>`).join('')}</fieldset>
        <div class="cc-form-row">
          <label class="field"><span>Budget from (EUR)</span><input name="min" type="number" min="0" step="500" required inputmode="numeric" value="5000"></label>
          <label class="field"><span>Budget to (EUR)</span><input name="max" type="number" min="0" step="500" required inputmode="numeric" value="12000"></label>
        </div>
        <div class="cc-form-row">
          <label class="field"><span>Deadline</span><input name="deadline" type="date" required value="2027-03-31"></label>
          <label class="field"><span>Town</span><select name="town">${TOWNS.map(t => opt(t, t, t === 'Faro')).join('')}${opt('', 'Outside the Algarve or not given')}</select></label>
        </div>
        <label class="field"><span>Days of work you expect</span><small class="field-hint">Used to estimate each supplier's price from their rate</small><input name="days" type="number" min="1" max="365" required inputmode="numeric" value="20"></label>
        <p class="cc-form-msg" data-post-msg role="status"></p>
        <div class="cc-form-actions"><button class="btn btn-accent" type="submit">Post it (kept in this browser only)</button></div>
      </form>
      <div class="cc-post-out">
        <div class="cc-result-head"><h3 class="cc-h3">Suppliers ranked for this challenge</h3><span class="cc-live">Updates as you type</span></div>
        ${legend}
        <ol class="cc-ranks" data-post-ranks aria-live="polite"><li class="cc-note">The ranking appears here once the page has read the feed.</li></ol>
        <div data-post-call></div>
      </div>
    </div>
  </div>
</section>

<section id="suppliers" class="hub-sec hub-sec-mist cc-sec">
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">The solution side</p><h2 class="hub-h2">Suppliers</h2><p class="hub-lede">Companies and individual professionals who offer their capabilities. Individuals are listed only when they have agreed to be.</p></div>${h.odoo('res.partner', sups.length)}</div>
    <div class="cc-filters" role="group" aria-label="Filter the suppliers">
      <div class="cc-chips" data-kind-filter>${[['all', 'All', sups.length], ['company', 'Companies', sups.filter(s => s.kind === 'company').length], ['individual', 'Individuals', sups.filter(s => s.kind === 'individual').length]].map(([k, l, n], i) => `<button type="button" class="cc-chip" data-kind="${k}" aria-pressed="${i === 0}">${l} <span data-kind-n="${k}">${n}</span></button>`).join('')}</div>
      <label class="cc-skillfilter">Capability <select data-cap-filter>${opt('', 'Any capability', true)}${skills.map(s => opt(s, s)).join('')}</select></label>
    </div>
    <ul class="cards cc-sups" data-sups>${sups.map(supCard).join('')}</ul>
    <p class="cc-empty" data-sups-empty hidden>No supplier matches these filters.</p>
  </div>
</section>

<section id="triage" class="hub-sec cc-sec" data-only="staff" hidden>
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">Algarve Evolution team</p><h2 class="hub-h2">Triage</h2><p class="hub-lede">Every application, with the suppliers' contact details from the private feed. Tick the top 3 you suggest (Odoo's ranking is ticked to start), record who decides and who was chosen, and see the Odoo call.</p></div>${h.odoo('aih.application', apps.length)}</div>
    <div data-triage aria-live="polite"><p class="cc-note">The triage view needs the private feed. Choose "Open the private feed" above and enter the access key.</p></div>
  </div>
</section>

<section id="how" class="hub-sec hub-sec-mist cc-sec">
  <div class="hub-wrap cc-how">
    <div><p class="kicker">Odoo is the source of truth</p><h2 class="hub-h2">How this page reads Odoo</h2>
      <p class="hub-lede">Every challenge, application, supplier and score above is read from the feed exported from Odoo. Actions on this page do not write to Odoo: they are kept in this browser only, and each one shows the Odoo call that would make it real.</p>
      <p class="hub-lede"><a href="/v2/odoo/">How the hub uses Odoo</a> · <a href="/feeds/public.json">the public feed</a></p></div>
    <dl class="cc-models">
      <div><dt>${h.odoo('aih.challenge', chs.length)}</dt><dd>The challenge: problem, requirements, skills, budget, deadline, status, who decides and the chosen application.</dd></div>
      <div><dt>${h.odoo('aih.application', apps.length)}</dt><dd>An application: supplier, proposal, price, days, and the score, rank and reasons Odoo computes.</dd></div>
      <div><dt>${h.odoo('res.partner', sups.length)}</dt><dd>Suppliers are Odoo contacts marked as suppliers, with their capabilities, town, rate and consent.</dd></div>
      <div><dt>${h.odoo('aih.skill', skills.length)}</dt><dd>One list of skills shared by challenges, suppliers and mentors, so they can be compared.</dd></div>
      <div><dt>The score</dt><dd>Skills: 50 times the share of wanted skills the supplier has. Town: 20 for the same town, 10 elsewhere in the Algarve, 0 outside. Budget: 30 inside the range, 20 below it, and less the further over the top it is.</dd></div>
    </dl>
  </div>
</section>
</div>
<script type="application/json" id="cc-config">${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>`;

  return layout({
    body,
    description: 'Challenge Connect, part of the AE Innovation Hub: companies post challenges, suppliers apply, Odoo ranks the applications, and the company chooses or Algarve Evolution suggests a top 3.',
    head: '<link rel="stylesheet" href="/hub/challenge-connect.css">',
    scripts: '<script src="/hub/challenge-connect.js" defer></script>',
    pageClass: 'page-cc',
  });
}
