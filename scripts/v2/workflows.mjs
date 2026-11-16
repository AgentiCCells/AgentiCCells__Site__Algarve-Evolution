// Workflows: ten agentic cells for the "death by a thousand cuts" at Algarve Evolution (V2, the AE Innovation Hub).
// Each cell maps one painful email or business workflow end to end with an agent: the trigger and the channel, the
// steps, the data it reads from Odoo, its agent behaviour policy (grant, mandate, gap, barriers), an illustrative
// time saving, its place on the AgentiCCells ladder, and a TRY IT panel that runs the cell in the browser with
// transparent rules (no model call, no network) and sends its proposed Odoo calls to the plan queue.
// The cells and their runners live in src/hub/workflows.js (one ES module, used here at build time and in the
// browser); the sample inputs are in src/hub/workflows/. Owner: cells@AgentiCCells.dinis. Apache-2.0, text CC BY 4.0.
import { readFileSync } from 'node:fs';
import { CELLS, LADDER, CONNECTORS, NOT_CONNECTED } from '../../src/hub/workflows.js';

export const path = '/workflows/';
export const title = 'Workflows: ten agentic cells';
export const nav = 'Workflows';

const fmt = m => (m >= 720 ? '1 to 2 days' : m >= 60 ? `${Math.round(m / 60)} hour${m >= 90 ? 's' : ''}` : `${m} min`);
const pad = n => String(n).padStart(2, '0');

export function render({ layout, feed, data, h, PERSONAS }) {
  const { esc } = h;
  const plabel = id => PERSONAS.find(p => p.id === id)?.label || id;
  // Membership categories come from src/data (voice.json "join"), with their source.
  const joinText = (data.voice.join || []).map(j => j.en).find(t => /member/i.test(t)) || '';
  const membership = { name: (joinText.match(/include (\w+),/) || [])[1] || 'Start', price: Number((joinText.match(/€(\d+)/) || [])[1] || 0), text: joinText, sources: data.voice.join_sources || [] };
  const sample = f => { try { return readFileSync(`src/hub/workflows/${f}`, 'utf8').trim(); } catch { return ''; } };
  const models = [...new Set(CELLS.flatMap(c => c.models))];
  const connectorsUsed = [...new Set(CELLS.flatMap(c => c.trigger.connectors))];
  const quote = 'You take specific workflows and you map them end to end with an agent, so that it can become as simple or as complex as it needs to be ... it\'s not just a connector ... it\'s a connector with behaviour policies.';
  const quote2 = 'You receive an email and the email needs to go to the CRM, needs to collect some data, or somebody\'s asking for a bit of information ... at the moment, those are the things that take ten at a time, and they\'re really hard to do.';
  const BARRIER = { approval: ['Needs a person', 'tag-warn'], refused: ['Refused', 'tag-accent'], boundary: ['Boundary', 'tag-odoo'] };

  const cellCard = c => {
    const forAttr = c.for.length ? ` data-for="${esc(c.for.join(' '))}"` : '';
    const pctCell = Math.max(2, Math.round((100 * c.time.cell) / c.time.today));
    return `<article class="wf-cell" id="${esc(c.id)}" data-cell="${esc(c.id)}"${forAttr} aria-labelledby="cell-${c.n}-h">
  <header class="wf-cell-head">
    <p class="wf-cell-n"><span>Cell ${pad(c.n)}</span> ${esc(c.activity)}</p>
    <h3 id="cell-${c.n}-h">${esc(c.title)}</h3>
    <p class="wf-ask">${esc(c.ask)}</p>
    <p class="wf-cell-tags">${c.for.map(p => `<span class="tag wf-tag-for">For: ${esc(plabel(p))}</span>`).join(' ')} <span class="tag tag-navy">${esc(LADDER[c.ladder].name)}</span> ${c.models.map(m => `<span class="tag tag-odoo">${esc(m)}</span>`).join(' ')}</p>
  </header>
  <div class="wf-cell-body">
    <div class="wf-how">
      <div class="wf-block"><p class="wf-label">Trigger and channel</p><p class="wf-trigger">${esc(c.trigger.what)}</p>
        <ul class="wf-conns">${c.trigger.connectors.map(k => `<li><span class="wf-plug" aria-hidden="true"></span>${esc(CONNECTORS[k])} <span class="wf-nc">${esc(NOT_CONNECTED)}</span></li>`).join('')}</ul></div>
      <div class="wf-block"><p class="wf-label">End to end</p><ol class="wf-flow">${c.steps.map((s, i) => `<li><span class="wf-flow-n" aria-hidden="true">${i + 1}</span>${esc(s)}</li>`).join('')}</ol></div>
      <div class="wf-block"><p class="wf-label">Data it reads</p><dl class="wf-reads">${c.reads.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></div>
      <details class="wf-abp"><summary><span class="wf-label">Agent behaviour policy</span> <span class="wf-abp-hint">grant, mandate, gap, barriers</span></summary>
        <div class="wf-abp-grid">
          <div><p class="wf-abp-k">Grant <span>what it can reach</span></p><ul>${c.policy.grant.map(g => `<li><code>${esc(g)}</code></li>`).join('')}</ul></div>
          <div><p class="wf-abp-k">Mandate <span>what it was asked to do</span></p><p>${esc(c.policy.mandate)}</p></div>
          <div><p class="wf-abp-k">Gap <span>reach beyond the mandate</span></p><ul>${c.policy.gap.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
          <div><p class="wf-abp-k">Barriers <span>what stops it</span></p><ul class="wf-barriers">${c.policy.barriers.map(([k, t]) => `<li><span class="tag ${BARRIER[k][1]}">${BARRIER[k][0]}</span> ${esc(t)}</li>`).join('')}<li><span class="tag tag-accent">Refused</span> Sending anything, in this prototype</li></ul></div>
        </div></details>
      <div class="wf-block wf-time-block"><p class="wf-label">Time ${esc(c.time.per)} <span class="wf-est">illustrative estimate, not measured</span></p>
        <div class="wf-time" role="img" aria-label="Today ${esc(c.time.todayText)}; with the cell ${esc(c.time.cellText)}. Illustrative estimate, not measured.">
          <div class="wf-time-row"><span class="wf-time-k">Today</span><span class="wf-time-bar"><i style="width:100%"></i></span><span class="wf-time-v">${esc(fmt(c.time.today))}</span></div>
          <div class="wf-time-row is-cell"><span class="wf-time-k">With the cell</span><span class="wf-time-bar"><i style="width:${pctCell}%"></i></span><span class="wf-time-v">${esc(fmt(c.time.cell))}</span></div>
        </div>
        <p class="wf-small">${esc(c.time.todayText[0].toUpperCase() + c.time.todayText.slice(1))}; with the cell, ${esc(c.time.cellText)}.</p></div>
      <p class="wf-ladder-line"><span class="wf-label">On the ladder</span> ${esc(c.ladderNote)}</p>
    </div>
    <div class="wf-try" role="group" aria-labelledby="try-${c.n}-h">
      <p class="wf-try-k">Try it</p>
      <h4 id="try-${c.n}-h">Run cell ${c.n} on an input</h4>
      <p class="wf-small">Every sample is invented and marked simulated. Pick one, change it, or paste your own.</p>
      <div class="wf-samples" role="group" aria-label="Sample inputs for cell ${c.n}">${c.samples.map((s, i) => `<button type="button" class="wf-sample" data-sample="${esc(s.file)}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>
      <label class="field wf-input"><span>Input ${/\.csv$/.test(c.samples[0].file) ? '(a spreadsheet, as CSV)' : '(an email or a form)'}</span><textarea data-input rows="12" spellcheck="false" autocomplete="off">${esc(sample(c.samples[0].file))}</textarea></label>
      <div class="wf-try-actions"><button type="button" class="btn btn-accent" data-run>Run the cell</button> <button type="button" class="btn btn-sm" data-clear>Clear</button> <span class="wf-try-msg" data-try-msg role="status"></span></div>
      <p class="wf-small wf-norules">No model and no network: transparent rules stand in for the model, here in your browser. In production a model drafts and the policy checks. Nothing is sent and nothing is written.</p>
    </div>
  </div>
  <div class="wf-out" data-out hidden></div>
</article>`;
  };

  const row = c => `<tr${c.for.length ? ` data-for="${esc(c.for.join(' '))}"` : ''}>
  <td data-th="Cell"><a href="#${esc(c.id)}"><span class="wf-tn">${pad(c.n)}</span> ${esc(c.title)}</a></td>
  <td data-th="Trigger and channel">${esc(c.trigger.what)}</td>
  <td data-th="Proposes writes to">${c.models.map(m => `<code>${esc(m)}</code>`).join(' ')}</td>
  <td data-th="Waits for a person"><ul class="wf-waits">${c.policy.barriers.filter(b => b[0] === 'approval').map(b => { const t = String(b[1]).trim(); return `<li>${esc(t.charAt(0).toUpperCase() + t.slice(1))}</li>`; }).join('')}</ul></td>
  <td data-th="Time, illustrative" class="num"><span class="wf-nw">${esc(fmt(c.time.today))}</span> → <span class="wf-nw">${esc(fmt(c.time.cell))}</span> <span class="wf-per">${esc(c.time.per)}</span></td>
  <td data-th="Ladder">${esc(LADDER[c.ladder].name)}</td>
  <td data-th="Touches">${c.for.length ? c.for.map(p => esc(plabel(p))).join(', ') : 'The Algarve Evolution team'}</td>
</tr>`;

  const personaPanel = (id, head, nums, text) => `<div class="persona-panel" data-only="${id}" hidden><p class="persona-panel-head">${esc(head)}</p><p>${text}</p><p class="wf-jumps">${nums.map(n => `<a class="btn btn-sm" href="#${esc(CELLS[n - 1].id)}">Cell ${n}: ${esc(CELLS[n - 1].title)}</a>`).join(' ')}</p></div>`;
  const staffCounts = feed.meta?.withheld || {};

  const body = `
<section class="wf-hero">
  <div class="hub-wrap wf-hero-grid">
    <div>
      <p class="kicker kicker-light">AE Innovation Hub · workflows</p>
      <h1>Ten agentic cells for the death by a thousand cuts</h1>
      <p class="lede">The small requests that arrive ten at a time: a supplier asking who to talk to, a founder looking for a mentor, a membership form, the monthly KPIs, a mentor's notes, a problem by email, a sign-up sheet, a funder's report, the weekly digest, a member list. Each one, mapped end to end with an agent that works with Odoo, the feeds and the spreadsheets, under a policy, with a person's approval before anything leaves.</p>
      <figure class="wf-quote"><blockquote><p>${esc(quote)}</p></blockquote><figcaption>The PrompTugal team, in the meeting with António Guerreiro, 16 November 2026</figcaption></figure>
    </div>
    <div class="wf-hero-side">
      <dl class="wf-hero-stats" aria-label="The ten cells at a glance">
        <div><dt>Cells</dt><dd>${CELLS.length}</dd><dd class="wf-hs-note">each a working demo below</dd></div>
        <div><dt>Odoo models</dt><dd>${models.length}</dd><dd class="wf-hs-note">they propose writes to</dd></div>
        <div><dt>Connectors</dt><dd>${connectorsUsed.length}</dd><dd class="wf-hs-note">named; none connected here</dd></div>
        <div><dt>Sent</dt><dd>0</dd><dd class="wf-hs-note">emails, invoices or notices: a person approves each</dd></div>
      </dl>
      <p class="wf-hero-chips"><span>Each cell reads from Odoo:</span> ${h.odoo('aih.programme.company', feed.companies.length)} ${h.odoo('aih.challenge', feed.challenges.length)} ${h.odoo('res.partner', feed.mentors.length + feed.suppliers.length + feed.talent.length)} ${h.odoo('aih.kpi', feed.kpis.length)} ${h.odoo('aih.session', feed.sessions.length)} ${h.odoo('event.event', feed.events.length)}</p>
    </div>
  </div>
</section>
<nav class="wf-jump" aria-label="On this page"><div class="hub-wrap"><ul>
  <li><a href="#why">Cells, not connectors</a></li><li><a href="#summary">The ten at a glance</a></li>${CELLS.map(c => `<li><a href="#${esc(c.id)}">${c.n}</a></li>`).join('')}<li><a href="#ladder">The ladder</a></li><li><a href="#limits">What this does not claim</a></li>
</ul></div></nav>

<section class="hub-sec hub-sec-tight hub-sec-mist wf-personas" aria-label="Your cells">
  <div class="hub-wrap hub-stack">
    <div class="persona-panel" data-only="visitor"><p class="persona-panel-head">Try it as someone</p><p>Pick a persona above to see the cells that touch you highlighted. Every cell runs for everyone: pick a sample in its TRY IT panel and press Run.</p></div>
    ${personaPanel('supplier', 'For suppliers', [1], 'You write to the hub with your services. Cell 1 reads your email, finds open challenges and companies that may need you, and drafts a reply. It never names a company to you before that company agrees.')}
    ${personaPanel('founder', 'For founders', [2, 4], 'Ask for a mentor or an expert and cell 2 finds people who agreed to be listed, then asks them first. Cell 4 is the monthly KPI round: send your numbers by email or in the sheet, and odd ones come back to you as a question, not an error.')}
    ${personaPanel('mentor', 'For mentors', [5], 'Email your session notes as you would anyway. Cell 5 logs the session, keeps your notes private, removes contact details from them, and proposes the next session.')}
    ${personaPanel('challenger', 'For challenge owners', [6], 'Describe your problem in an email. Cell 6 drafts a structured challenge for you to correct, lists what is missing, and notifies the top suppliers only after you confirm and the team approves.')}
    ${personaPanel('participant', 'For participants and jurors', [7], 'Sign up in the form. Cell 7 registers you once, with your role, lists you in the directory only if you said yes, and prepares your confirmation.')}
    ${personaPanel('professional', 'For professionals and investors', [2, 10], 'Cell 2 is how founders find you, if you agreed to be listed. Cell 10 is how a community\'s member list joins the network: only people who said yes are added; others are asked first.')}
    <div class="persona-panel persona-panel-private" data-only="staff" hidden><p class="persona-panel-head">For the Algarve Evolution team</p><p>All ten cells are yours to run. With the private feed open, the cells also see what the public cannot: supplier contacts, people without consent (shown greyed, never suggested), the participants already registered for dedupe, and the last private session notes. The public feed today leaves out ${esc(staffCounts.talent ?? 0)} talent, ${esc(staffCounts.mentors ?? 0)} mentor and ${esc(staffCounts.suppliers ?? 0)} supplier records for lack of consent.</p></div>
  </div>
</section>

<section class="hub-sec wf-why" id="why" aria-labelledby="why-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">Why cells</p><h2 class="hub-h2" id="why-h">Cells, not connectors</h2>
      <p class="hub-lede">A connector moves data from one place to another. A cell does the same work a person does with it: it reads, looks things up, decides what to propose, and then stops at the points where a person must decide. Three things make the difference.</p></div>
    <div class="hub-cols-3 wf-three">
      <div class="card"><p class="card-kicker">1 · The policy</p><h3>Grant, mandate, gap, barriers</h3><p>Every cell has an agent behaviour policy: what it can reach in Odoo and in the mailboxes (the grant), what it was asked to do (the mandate), the difference between the two (the gap), and what stops it (the barriers). Odoo's access rights are a real boundary; a sentence in a prompt is only an expectation.</p></div>
      <div class="card"><p class="card-kicker">2 · The approval</p><h3>A person decides what leaves</h3><p>Any outbound email, any invoice, any contact with someone who has not agreed: the cell drafts, a person approves. Proposed Odoo writes go to the <a href="/plan/">plan queue</a>, where the team reviews them and signs the approval with a key made in their browser.</p></div>
      <div class="card"><p class="card-kicker">3 · The record</p><h3>What changed, and who approved it</h3><p>The signed plan, the policy checks and the result of each call are kept, longer than any chat. In Odoo, each cell leaves a to-do with its draft on the contact it touched, so the work waits where the team already looks.</p></div>
    </div>
    <ol class="wf-pipe" aria-label="How a cell runs, end to end">
      <li><b>Trigger</b><span>an email, a form, a sheet, a date</span></li>
      <li><b>Read</b><span>the input and the Odoo feeds</span></li>
      <li><b>Draft</b><span>a model in production; rules here</span></li>
      <li><b>Policy check</b><span>allowed, needs approval, refused</span></li>
      <li><b>Plan queue</b><span>the Odoo calls, with their checks</span></li>
      <li class="is-person"><b>A person approves</b><span>signed, in the browser</span></li>
      <li><b>Broker</b><span>writes to the experimentation Odoo</span></li>
      <li><b>Record</b><span>what changed and who approved</span></li>
    </ol>
    <figure class="wf-quote wf-quote-light"><blockquote><p>${esc(quote2)}</p></blockquote><figcaption>The PrompTugal team, in the meeting with António Guerreiro, 16 November 2026</figcaption></figure>
    <p class="wf-small wf-reading">Further reading on the SGit Newsroom (16 November 2026): <a href="https://newsroom.sgit.ai/articles/odoo-and-our-stack.html" rel="noopener">Odoo's agents can now write to the system of record</a> (plan, then apply; a behaviour policy per Odoo agent) and <a href="https://newsroom.sgit.ai/articles/integrate-with-whatever-is-on-the-other-side.html" rel="noopener">Integrate with whatever is on the other side</a> (build around what is there; start with the manual workflows).</p>
  </div>
</section>

<section class="hub-sec hub-sec-mist wf-summary" id="summary" aria-labelledby="sum-h">
  <div class="hub-wrap">
    <div class="hub-head-row"><div class="hub-head"><p class="kicker">At a glance</p><h2 class="hub-h2" id="sum-h">The ten cells</h2>
      <p class="hub-lede">Times are illustrative estimates for discussion, not measurements. They show where the hours go today, so the team can say which cells to try first.</p></div>
      ${h.odoo('aih.*, res.partner, event.event')}</div>
    <div class="hub-table-wrap wf-sum-wrap"><table class="hub-table wf-sum-table"><colgroup><col class="c-cell"><col class="c-trig"><col class="c-writes"><col class="c-waits"><col class="c-time"><col class="c-ladder"><col class="c-touch"></colgroup><caption>The ten cells: trigger, Odoo models, what waits for a person, time today against with the cell (illustrative), ladder, and who each one touches.</caption>
      <thead><tr><th scope="col">Cell</th><th scope="col">Trigger and channel</th><th scope="col">Proposes writes to</th><th scope="col">Waits for a person</th><th scope="col">Time, illustrative</th><th scope="col">Ladder</th><th scope="col">Touches</th></tr></thead>
      <tbody>${CELLS.map(row).join('')}</tbody></table></div>
  </div>
</section>

<section class="hub-sec wf-cells" id="cells" aria-labelledby="cells-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">The ten cells</p><h2 class="hub-h2" id="cells-h">Each one, end to end, working</h2>
      <p class="hub-lede">Read how each cell works, then run it in its TRY IT panel. You will see what it extracted, what it matched in Odoo and why, the drafts it wrote, its policy check, and the Odoo calls it proposes for the plan queue.</p></div>
    <div class="wf-cell-list">
${CELLS.map(cellCard).join('\n')}
    </div>
  </div>
</section>

<section class="hub-sec hub-sec-navy wf-ladder" id="ladder" aria-labelledby="ladder-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">The AgentiCCells ladder</p><h2 class="hub-h2" id="ladder-h">From one cell to a network</h2>
      <p class="hub-lede">One agent on one workflow is the smallest cell, and nine of these ten are that size. They can start one at a time, and grow only where they earn it.</p></div>
    <ol class="wf-rungs">
      ${LADDER.map((l, i) => { const ns = CELLS.filter(c => c.ladder === i).map(c => c.n); const extra = i === 2 ? 'All ten together, with a conductor that routes each email to the right cell, one board and a key per cell.' : i === 3 ? 'Partners, municipalities and communities each running their own cells, sharing policies and the plan queue.' : ''; return `<li class="wf-rung"><p class="wf-rung-n">${i + 1}</p><h3>${esc(l.name)}</h3><p>${esc(l.text)}</p><p class="wf-rung-cells">${ns.length ? `Here: ${ns.map(n => `<a href="#${esc(CELLS[n - 1].id)}">cell ${n}</a>`).join(', ')}` : esc(extra)}</p></li>`; }).join('')}
    </ol>
    <p class="wf-small wf-ladder-src">The ladder's sizes are AgentiCCells' (<a href="https://agenticcells.com/cells/" rel="noopener">agenticcells.com/cells</a>); where each cell sits is our proposal.</p>
  </div>
</section>

<section class="hub-sec hub-sec-tight wf-limits" id="limits" aria-labelledby="lim-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">Plainly</p><h2 class="hub-h2" id="lim-h">What this page does not claim</h2></div>
    <ul class="wf-limit-list">
      <li><b>No model runs here.</b> Keyword rules, shown with the words that triggered them, stand in for the model. In production a model reads and drafts; the policy checks every step either way.</li>
      <li><b>Nothing is sent or written.</b> No email, invoice, notice or calendar invitation leaves this page, and no call reaches Odoo. Calls added to the plan queue are kept in this browser only.</li>
      <li><b>No connector is connected.</b> Gmail, Outlook, Google Forms and Sheets, Excel, calendars and WhatsApp are named as the places each cell would plug into.</li>
      <li><b>Some calls need Odoo apps that the experimentation Odoo does not have.</b> CRM, Invoicing, Calendar and Email Marketing are not installed there; the calls show what Algarve Evolution's Odoo would receive if it uses them. We do not know which apps it uses.</li>
      <li><b>The times are illustrative estimates, not measured.</b> They are for the team to correct.</li>
      <li><b>Every sample is invented.</b> Senders, companies and numbers are simulated and marked as such; events in the digest and the report are real, from algarveevolution.pt, with their sources. Membership: only the Start category (€${esc(membership.price)} a year) is in our data, from <a href="${esc(membership.sources[0] || 'https://www.algarveevolution.pt/join-us')}" rel="noopener">algarveevolution.pt/join-us</a>.</li>
    </ul>
  </div>
</section>
<script type="application/json" id="wf-data">${JSON.stringify({ membership }).replace(/</g, '\\u003c')}</script>`;

  return layout({
    body,
    description: 'Ten agentic cells for the many small requests at Algarve Evolution: each workflow mapped end to end with an agent, Odoo, a behaviour policy and a person\'s approval, with a working demo of each.',
    head: '<link rel="stylesheet" href="/hub/workflows.css">',
    scripts: '<script src="/hub/plan-policy.js" defer></script>\n<script type="module" src="/hub/workflows.js"></script>',
    pageClass: 'page-workflows',
  });
}
