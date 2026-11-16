// Plan, then apply: the hub's review queue (docs/v2/PLAN.md).
// Every "Odoo call" panel on the hub can be added to a plan kept in this browser (window.HUB.plan, src/hub/hub.js).
// Here the Algarve Evolution team reviews each proposed change (grouped by source, with its calls, the broker's
// policy checks run in the browser and the records it touches), approves or rejects it, signs the approved plan
// with an ECDSA P-256 key made in the browser, exports plan.json and verifies signed plans. The broker,
// scripts/odoo/apply-plan.mjs, applies a signed plan to the experimentation Odoo and appends a record.
// The pattern: SGit Newsroom, "Odoo's agents can now write to the system of record" (16 November 2026).
// Owner: odoo@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export const path = '/plan/';
export const title = 'Plan, then apply';
export const nav = 'Plan';

const ARTICLE = 'https://newsroom.sgit.ai/articles/odoo-and-our-stack.html';

// The broker's own policy, the same file the broker loads (src/hub/plan-policy.js).
function loadPolicy() {
  const ctx = {}; ctx.globalThis = ctx;
  vm.runInNewContext(readFileSync('src/hub/plan-policy.js', 'utf8'), ctx, { filename: 'plan-policy.js' });
  return ctx.PlanPolicy;
}
// The reviewers the broker accepts, and the plans it has applied (scripts/odoo/applied/*.jsonl).
function loadBrokerState() {
  let reviewers = [];
  try { reviewers = JSON.parse(readFileSync('scripts/odoo/reviewers.json', 'utf8')).reviewers || []; } catch { reviewers = []; }
  const dir = 'scripts/odoo/applied'; let applied = 0, items = 0, last = null;
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort()) {
      for (const line of readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean)) {
        try { const r = JSON.parse(line); applied += 1; items += (r.items || []).filter(i => i.status === 'applied').length; last = r.at || last; } catch { /* a broken line is skipped */ }
      }
    }
  }
  return { reviewers: reviewers.map(r => ({ name: r.name || '', fingerprint: r.fingerprint || '' })), applied, items, last };
}

// Two example items, so a first visitor sees a queue. Built from the feed (real Odoo ids of simulated records).
function seedItems(feed) {
  const out = [];
  const snapshot = { feed: 'public', exported: feed.meta?.exported || null };
  const ch = feed.challenges.find(c => c.status === 'open') || feed.challenges[0];
  const applied = new Set(feed.applications.filter(a => a.challenge_id === ch?.id).map(a => a.supplier_id));
  const sup = feed.suppliers.find(s => s.kind === 'company' && !applied.has(s.id)) || feed.suppliers[0];
  if (ch && sup) {
    const price = Math.round(((ch.budget_eur_min || 0) + (ch.budget_eur_max || 0)) / 2 / 100) * 100;
    out.push({
      source: 'challenge-connect', simulated: true, snapshot,
      title: `Example: ${sup.name} applies to "${ch.title}"`,
      calls: [
        { method: 'POST', path: '/json/2/aih.application/create', why: 'Create the application', body: { vals_list: [{ challenge_id: ch.odoo.id, supplier_id: sup.odoo.id, proposal: 'A first version in four weeks, then two weeks of tests with the challenge owner. Invented for the prototype.', price_eur: price, days: 30, simulated: true }] } },
        { method: 'POST', path: '/json/2/aih.challenge/action_compute_matches', why: 'Score and rank every application of the challenge again', body: { ids: [ch.odoo.id] } },
      ],
      policy: {
        agent: 'Challenge Connect page (supplier form)',
        grant: ['aih.application: create', 'aih.challenge: action_compute_matches'],
        mandate: 'A supplier applies to an open challenge; the ranking is computed again. It may not change the challenge itself.',
        checks: [
          { rule: 'The challenge takes applications', ok: ['open', 'matching'].includes(ch.status), note: `${ch.id} is "${ch.status}" in the feed.` },
          { rule: 'The supplier is listed with consent', ok: !!sup.consent, note: `${sup.id} has consent: ${sup.consent ? 'yes' : 'no'}.` },
          { rule: 'The price is inside the budget', ok: price >= ch.budget_eur_min && price <= ch.budget_eur_max, note: `€${price} against €${ch.budget_eur_min} to €${ch.budget_eur_max}.` },
        ],
        needs_approval: true,
      },
      refs: [ch.id, sup.id],
    });
  }
  const prog = feed.programmes.find(p => p.status === 'running') || feed.programmes[0];
  const co = feed.companies.find(c => c.programme_id === prog?.id);
  const ks = feed.kpis.filter(k => k.company_id === co?.id).sort((a, b) => b.month - a.month);
  const k = ks[0];
  if (co && k) {
    out.push({
      source: 'inc-acc', simulated: true, snapshot,
      title: `Example: ${co.name} corrects its customers for month ${k.month} (${k.customers} to ${k.customers + 2})`,
      calls: [{ method: 'POST', path: '/json/2/aih.kpi/write', why: 'Correct the KPI snapshot', body: { ids: [k.odoo.id], vals: { customers: k.customers + 2 } } }],
      policy: {
        agent: 'INC/ACC page (founder KPI form)',
        grant: ['aih.kpi: create, write'],
        mandate: 'A founder records or corrects their own company\'s monthly numbers. Publishing them is for the Algarve Evolution team.',
        checks: [
          { rule: 'The snapshot belongs to the founder\'s company', ok: true, note: `${k.id} is ${co.id}'s month ${k.month}.` },
          { rule: 'Does not publish', ok: true, note: 'is_published is not in the change.' },
        ],
        needs_approval: true,
      },
      refs: [co.id, k.id],
    });
  }
  return out;
}

export function render(ctx) {
  const { feed, h, layout, NAV } = ctx;
  const { esc, num, date } = h;
  const P = loadPolicy();
  const broker = loadBrokerState();
  const seeds = seedItems(feed);
  const exported = feed.meta?.exported;
  const sources = Object.fromEntries(NAV.map(n => [n.path.replace(/^\/+|\/+$/g, '') || 'home', n.label]));
  const config = { seeds, sources, exported, reviewers: broker.reviewers, article: ARTICLE };

  const steps = [
    { n: 1, id: 'snapshot', name: 'Snapshot', where: 'Odoo, through the feed', cls: 'odoo', text: `What the page knew when you acted: the feed exported from Odoo on ${esc(date(exported))}. The broker reads the records again before it writes.` },
    { n: 2, id: 'plan', name: 'Plan', where: 'Any page of the hub', cls: 'hub', text: 'The exact Odoo JSON-2 calls, from an "Odoo call" panel or a workflow, gathered in a queue. Nothing is sent.' },
    { n: 3, id: 'policy', name: 'Policy check', where: 'This page, then the broker', cls: 'hub', text: 'Each call against a written policy: hub models only, no deleting, no users or access rights, no value left to fill in.' },
    { n: 4, id: 'approval', name: 'Signed approval', where: 'This page', cls: 'accent', text: 'A person on the Algarve Evolution team approves each item and signs the plan with a key made in their own browser.' },
    { n: 5, id: 'broker', name: 'Broker', where: 'scripts/odoo/apply-plan.mjs', cls: 'odoo', text: 'Checks the signature against the reviewers\' list and the policy again, dry-runs, then writes through a user that may only create and update hub records.' },
    { n: 6, id: 'record', name: 'Record', where: 'scripts/odoo/applied/, in git', cls: 'odoo', text: 'What was applied, under whose key, with Odoo\'s answers: a record that outlasts any chat.' },
  ];
  const flow = `<ol class="pl-flow" aria-label="Plan, then apply, in six steps">${steps.map(s => `<li class="pl-step pl-step-${s.cls}" id="step-${s.id}"><span class="pl-step-n" aria-hidden="true">${s.n}</span><h3>${esc(s.name)}</h3><p>${s.text}</p><p class="pl-step-where">${esc(s.where)}</p></li>`).join('')}</ol>`;

  const modelRows = Object.entries(P.MODELS).map(([m, v]) => `<tr><th scope="row"><code>${esc(m)}</code></th><td data-th="Methods">${v.methods.map(x => `<code>${esc(x)}</code>`).join(' ')}</td><td data-th="Limits">${esc(v.why)}${v.fields ? `: ${v.fields.map(f => `<code>${esc(f)}</code>`).join(' ')} and the <code>${esc(v.fieldPrefix)}</code> fields` : ''}</td></tr>`).join('');
  const NOT_STAFF = 'visitor founder mentor challenger supplier participant professional';

  const body = `
<section class="pl-hero">
  <div class="hub-wrap pl-hero-grid">
    <div>
      <p class="kicker kicker-light">Plan, then apply</p>
      <h1>Every change to Odoo, reviewed and signed before it is made</h1>
      <p class="lede">Each "Odoo call" panel on this hub is a proposed change. Add it to the plan. The Algarve Evolution team checks it against a written policy, approves it and signs it with their own key. A small broker then applies it to the experimentation Odoo and keeps a record. Nothing on this page writes to Odoo.</p>
      <p class="pl-hero-links"><a class="btn btn-accent" href="#queue">Review the queue</a> <a class="btn btn-on-navy" href="#how">How it works</a></p>
    </div>
    <dl class="pl-hero-stats" aria-live="polite">
      <div><dt>In this browser's plan</dt><dd data-stat="items">0</dd></div>
      <div><dt>Approved</dt><dd data-stat="approved">0</dd></div>
      <div><dt>Policy issues</dt><dd data-stat="issues">0</dd></div>
      <div><dt>Plans applied to the experimentation Odoo</dt><dd>${num(broker.applied)}</dd><dd class="pl-hero-src">from <code>scripts/odoo/applied/</code> at build time${broker.last ? `, last ${esc(date(broker.last))}` : ''}</dd></div>
    </dl>
  </div>
</section>

<nav class="pl-toc" aria-label="On this page"><div class="hub-wrap"><ol>
  <li><a href="#how">How it works</a></li><li><a href="#queue">The queue</a></li><li><a href="#sign">Sign and export</a></li><li><a href="#verify">Check a signed plan</a></li><li><a href="#broker">The broker</a></li>
</ol></div></nav>

<section id="how" class="hub-sec">
  <div class="hub-wrap">
    <div class="hub-head-row">
      <div class="hub-head"><p class="kicker">1 · How it works</p><h2 class="hub-h2">Snapshot, plan, policy check, signed approval, broker, record</h2>
      <p class="hub-lede">People and, later, Odoo's own agents propose changes; only a person approves them, and only a small program with narrow rights writes them. Each step leaves something you can check.</p></div>
    </div>
    ${flow}
    <div class="pl-article">
      <p><strong>Where the pattern comes from.</strong> The PrompTugal team wrote it up on the SGit Newsroom on 16 November 2026, the day of our meeting: <a href="${ARTICLE}" rel="noopener">"Odoo's agents can now write to the system of record"</a>. A plan written to a lane, a check against what that agent may do, a person approving with their own key, a broker applying it through the API, and a record that lasts longer than any chat history.</p>
      <p>Here, the plan lives in your browser instead of a vault lane, and the record is a file in git. Both are proposals for this prototype.</p>
    </div>
  </div>
</section>

<section id="queue" class="hub-sec hub-sec-mist">
  <div class="hub-wrap">
    <div class="hub-head-row">
      <div class="hub-head"><p class="kicker">2 · The queue</p><h2 class="hub-h2">What would change in Odoo</h2>
      <p class="hub-lede">Grouped by where it came from. Each item shows its calls, the broker's policy checks (run here, in your browser) and the records it touches. Approve or reject each one.</p></div>
      <p class="local-note">Kept in this browser only</p>
    </div>
    <div class="persona-panel" data-only="staff"><p class="persona-panel-head">For the Algarve Evolution team</p><p>You review as the team. Approve what should happen, reject the rest, then sign the approved items below. <span data-private-note>Open the private feed to see private records by name.</span></p></div>
    <div class="persona-panel pl-demo" data-only="${NOT_STAFF}"><p class="persona-panel-head">Approving is for the Algarve Evolution team</p><p>You can see every proposed change and its checks. To feel how it works, try it as a demo: what you approve and sign is labelled a demo, and the broker refuses demo plans.</p>
      <label class="pl-switch"><input type="checkbox" data-demo> Try approving and signing (demo)</label></div>
    <div class="pl-queue-bar">
      <p class="pl-queue-count" data-queue-count role="status"></p>
      <div class="pl-queue-actions"><button type="button" class="btn btn-sm" data-seed>Add the two examples</button> <button type="button" class="btn btn-sm" data-clear>Empty the plan</button></div>
    </div>
    <div data-queue class="pl-queue"><p class="pl-empty">Loading the plan kept in this browser…</p></div>
  </div>
</section>

<section id="sign" class="hub-sec">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">3 · Sign and export</p><h2 class="hub-h2">Sign the approved items</h2>
    <p class="hub-lede">Signing makes a reviewer key in this browser (ECDSA P-256). Its private half cannot leave the browser, not even through this page; its public half and fingerprint travel with the plan, so anyone can check who approved it and that nothing changed since.</p></div>
    <div class="pl-sign">
      <div class="pl-panel">
        <h3>Your reviewer key</h3>
        <label class="field"><span>Your name, as it goes in the plan</span><input type="text" data-reviewer-name autocomplete="name" maxlength="80" placeholder="For example: AE programme team"></label>
        <div data-key-state class="pl-key"><p>Checking for a key in this browser…</p></div>
        <p class="pl-small">The broker accepts a plan only if this public key is on its list, <code>scripts/odoo/reviewers.json</code>. A person adds it there, in a reviewed commit. ${broker.reviewers.length ? `It holds ${num(broker.reviewers.length)} key${broker.reviewers.length === 1 ? '' : 's'} today.` : 'The list is empty today.'}</p>
      </div>
      <div class="pl-panel">
        <h3>The signed plan</h3>
        <div data-sign-state><p>Approve at least one item first.</p></div>
      </div>
    </div>
  </div>
</section>

<section id="verify" class="hub-sec hub-sec-mist">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">4 · Check a signed plan</p><h2 class="hub-h2">Is this plan what was approved?</h2>
    <p class="hub-lede">Open a plan.json: its signature is checked here, in your browser, against the public key inside it, and every item goes through the policy again. The file is not uploaded anywhere.</p></div>
    <div class="pl-verify">
      <label class="pl-drop" data-drop><input type="file" accept="application/json,.json" data-verify-file><span class="pl-drop-btn">Choose a plan.json</span><span class="pl-drop-hint">or drop it here</span></label>
      <div data-verify-out class="pl-verify-out" aria-live="polite"></div>
    </div>
  </div>
</section>

<section id="broker" class="hub-sec">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">5 · The broker</p><h2 class="hub-h2">A small program with narrow rights</h2>
    <p class="hub-lede">The broker is the only thing that writes. It trusts nothing in the plan it is given: it checks the signature, the reviewer and every call again, and it writes only to the experimentation Odoo.</p></div>
    <div class="hub-cols">
      <div class="hub-stack">
        <pre class="pl-cmd"><code># what it would do (the default)
node scripts/odoo/apply-plan.mjs plan.json

# do it, against the experimentation Odoo
node scripts/odoo/apply-plan.mjs plan.json --apply</code></pre>
        <ol class="pl-checks-list">
          <li><strong>Signature.</strong> ECDSA P-256 over the plan's canonical JSON; the fingerprint must match the key.</li>
          <li><strong>Reviewer.</strong> The key must be on <code>scripts/odoo/reviewers.json</code>. Demo plans are refused.</li>
          <li><strong>Policy.</strong> Every call against the table on the right; an item with one failing call is skipped whole.</li>
          <li><strong>Target.</strong> The experimentation Odoo only: it refuses any address but this one, and never <code>algarveevolution.pt</code>.</li>
          <li><strong>Snapshot.</strong> Before a write, it reads the records; if one changed in Odoo after the feed the plan was made from, the item is skipped.</li>
          <li><strong>Record.</strong> With <code>--apply</code>, one line per run in <code>scripts/odoo/applied/&lt;date&gt;.jsonl</code>: the plan's hash, the reviewer's fingerprint, every call and Odoo's answer. A plan is applied once.</li>
        </ol>
        <p class="pl-small">It writes as the Odoo user <code>plan-broker</code>, in the addon's "Plan broker" group: create and update hub records and hub contacts, never delete. Each call is its own transaction in Odoo, so an item that fails half way is reported as partly applied.</p>
      </div>
      <div class="hub-table-wrap">
        <table class="hub-table pl-policy-table">
          <caption>The broker's policy (<code>src/hub/plan-policy.js</code>): what a call may touch. Anything else is refused, and so are users, groups, access rights and settings.</caption>
          <thead><tr><th scope="col">Model</th><th scope="col">Methods</th><th scope="col">Limits</th></tr></thead>
          <tbody>${modelRows}</tbody>
        </table>
      </div>
    </div>
  </div>
</section>
<script type="application/json" id="plan-config">${JSON.stringify(config).replace(/</g, '\\u003c')}</script>`;

  return layout({
    body,
    description: 'Plan, then apply: every change the hub would make to Odoo, reviewed by the Algarve Evolution team, checked against a written policy, signed in the browser and applied by a small broker that keeps a record.',
    head: '<link rel="stylesheet" href="/hub/plan.css">',
    scripts: '<script src="/hub/plan-policy.js" defer></script>\n<script src="/hub/plan.js" defer></script>',
    pageClass: 'page-plan',
  });
}
