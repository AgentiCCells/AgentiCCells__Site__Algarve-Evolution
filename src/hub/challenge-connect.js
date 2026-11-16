// Challenge Connect in the browser: the board filters, one challenge at a time, the matcher ("post a challenge"),
// applying as a supplier, the challenge owner's choice and the Algarve Evolution triage.
// The match score is the one in the Odoo addon (odoo/addons/algarve_innovation_hub/models/challenge.py,
// AihApplication._match_score): skills overlap 50, town 20, budget fit 30, with the same reasons.
// Nothing is written to Odoo: actions are kept in this browser only (localStorage) and each shows the Odoo 19
// JSON-2 call that would make it real, marked "not sent: prototype".
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0.
(() => {
  const cfgEl = document.getElementById('cc-config'); if (!cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = n => Number(n ?? 0).toLocaleString('en-GB', { maximumFractionDigits: 0 });
  const money = n => `€${num(n)}`;
  const r1 = x => Math.round(x * 10) / 10;
  const fmtDate = iso => { if (!iso) return ''; const d = new Date(`${iso}T12:00:00Z`); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
  const STATUS = { open: 'Open', matching: 'Matching', matched: 'Matched', closed: 'Closed' };
  const STATUS_TAG = { open: 'tag-accent', matching: 'tag-navy', matched: 'tag-ok', closed: '' };
  const statusTag = st => `<span class="tag ${STATUS_TAG[st] || ''} cc-status">${esc(STATUS[st] || st)}</span>`;

  // ------------------------------------------------------------------ the addon's match score, in JavaScript
  const ALGARVE_TOWNS = new Set(['albufeira', 'alcoutim', 'aljezur', 'castro marim', 'faro', 'lagoa', 'lagos', 'loulé', 'loule',
    'monchique', 'olhão', 'olhao', 'portimão', 'portimao', 'são brás de alportel', 'sao bras de alportel',
    'silves', 'tavira', 'vila do bispo', 'vila real de santo antónio', 'vila real de santo antonio', 'quarteira']);
  const W_SKILLS = 50, W_TOWN = 20, W_BUDGET = 30;
  // Python's format(x, '.0%') rounds half to even (0.325 gives 32%), so this does too.
  const pct = x => { const v = x * 100, f = Math.floor(v); const n = v - f === 0.5 ? (f % 2 === 0 ? f : f + 1) : Math.round(v); return `${n}%`; };
  // ch: { skills[], town, budget_eur_min, budget_eur_max }; sup: { capabilities[], town }; price in EUR.
  function matchScore(ch, sup, price) {
    const reasons = [];
    const wanted = new Set(ch.skills || []), offered = new Set(sup.capabilities || []);
    let skills;
    if (wanted.size) {
      const shared = [...wanted].filter(s => offered.has(s)).sort();
      skills = (W_SKILLS * shared.length) / wanted.size;
      reasons.push(`Skills: ${shared.length} of ${wanted.size} wanted (${shared.join(', ') || 'none'})`);
    } else { skills = W_SKILLS / 2; reasons.push('Skills: the challenge lists none, so half marks'); }
    const tSup = String(sup.town || '').trim().toLowerCase(), tCh = String(ch.town || '').trim().toLowerCase();
    let town;
    if (tSup && tSup === tCh) { town = W_TOWN; reasons.push(`Town: same town (${sup.town})`); }
    else if (ALGARVE_TOWNS.has(tSup)) { town = W_TOWN / 2; reasons.push(`Town: elsewhere in the Algarve (${sup.town})`); }
    else { town = 0; reasons.push(`Town: outside the Algarve (${sup.town || 'not given'})`); }
    const lo = Number(ch.budget_eur_min || 0), hi = Number(ch.budget_eur_max || 0), p = Number(price || 0);
    let budget;
    if (hi && lo <= p && p <= hi) { budget = W_BUDGET; reasons.push(`Budget: ${num(p)} EUR is inside ${num(lo)} to ${num(hi)} EUR`); }
    else if (hi && p < lo) { budget = (W_BUDGET * 2) / 3; reasons.push(`Budget: ${num(p)} EUR is below the range; check the scope`); }
    else if (hi && p > hi) { budget = Math.max(0, W_BUDGET * (1 - (p - hi) / hi)); reasons.push(`Budget: ${num(p)} EUR is ${pct((p - hi) / hi)} over the top of the range`); }
    else { budget = W_BUDGET / 2; reasons.push('Budget: no range given, so half marks'); }
    return { score: r1(skills + town + budget), reasons, parts: { skills: r1(skills), town, budget: r1(budget) } };
  }
  // A feed score split back into its parts from the addon's reasons (as the page does at build time).
  function partsFromReasons(score, reasons = []) {
    let skills = 25, town = 0;
    for (const r of reasons) {
      const m = r.match(/^Skills: (\d+) of (\d+)/); if (m) skills = (50 * Number(m[1])) / Number(m[2]);
      if (/^Town: same town/.test(r)) town = 20; else if (/^Town: elsewhere/.test(r)) town = 10;
    }
    return { skills: r1(skills), town, budget: Math.max(0, r1(score - skills - town)) };
  }
  // A supplier's likely price for a challenge: their day rate (or hourly rate, 8 hours a day) times the days expected.
  function estimate(sup, days) {
    const m = String(sup.rate || '').match(/([\d.,]+)\s*EUR\s+(?:a|an|per)\s+(day|hour)/i); if (!m) return null;
    const rate = Number(m[1].replace(/,/g, '')); const perDay = m[2].toLowerCase() === 'hour' ? rate * 8 : rate;
    return { price: Math.round(perDay * days), text: `${esc(sup.rate)}${m[2].toLowerCase() === 'hour' ? ' × 8 hours' : ''} × ${num(days)} days = ${money(perDay * days)}` };
  }
  window.CC = { matchScore, partsFromReasons };

  // ------------------------------------------------------------------ what this browser keeps
  const KEY = 'cc-state-v1';
  const state = (() => { try { return { posted: [], apps: [], decisions: {}, suggest: {}, me: '', ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { posted: [], apps: [], decisions: {}, suggest: {}, me: '' }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  // ------------------------------------------------------------------ the feed
  let pub = null, priv = null;
  const staff = () => window.HUB?.persona === 'staff' && !!priv;
  const persona = () => window.HUB?.persona || 'visitor';
  const feed = () => (staff() ? priv : pub);
  const byId = (list, id) => (feed()[list] || []).find(r => r.id === id);
  const ownerOf = c => (c.company_id ? byId('companies', c.company_id) : null);
  const ownerName = c => ownerOf(c)?.name || c.org || (String(c.id).startsWith('local-') ? c.org : 'Organisation not public');
  const chTown = c => (c.town !== undefined ? c.town : ownerOf(c)?.town || '');
  const challenge = id => byId('challenges', id) || state.posted.find(p => p.id === id);
  const matchOf = id => (feed().matches || []).find(m => m.challenge_id === id);

  // ------------------------------------------------------------------ the Odoo call panel
  const HEAD = `Authorization: bearer &lt;API key of the signed-in hub user&gt;\nX-Odoo-Database: ${esc(cfg.db)}\nContent-Type: application/json`;
  // JSON with short arrays on one line, as people write it by hand.
  const flat = v => v === null || typeof v !== 'object' || (Array.isArray(v) && v.every(flat));
  const inline = v => (Array.isArray(v) ? `[${v.map(inline).join(', ')}]` : JSON.stringify(v));
  const pretty = (v, ind = '') => {
    if (flat(v)) return inline(v);
    const n = `${ind}  `;
    if (Array.isArray(v)) return `[\n${v.map(x => n + pretty(x, n)).join(',\n')}\n${ind}]`;
    const ks = Object.keys(v); if (!ks.length) return '{}';
    return `{\n${ks.map(k => `${n}${JSON.stringify(k)}: ${pretty(v[k], n)}`).join(',\n')}\n${ind}}`;
  };
  function callPanel(what, calls, note = '') {
    return `<div class="cc-calls" role="region" aria-label="Odoo call: ${esc(what)}">
  <p class="cc-calls-what">${esc(what)}${calls.length > 1 ? ` <span class="cc-calls-n">${calls.length} calls</span>` : ''}</p>
  ${calls.map((c, i) => `<details class="odoo-call" open>
    <summary><span class="odoo-call-verb">POST</span> <code>/json/2/${esc(c.model)}/${esc(c.method)}</code> <span class="odoo-call-flag">not sent: prototype</span></summary>
    ${c.why ? `<p class="cc-call-step">${calls.length > 1 ? `${i + 1}. ` : ''}${esc(c.why)}</p>` : ''}<pre><code>${HEAD}\n\n${esc(pretty(c.body))}</code></pre>
  </details>`).join('')}
  ${note ? `<p class="odoo-call-note cc-calls-note">${note}</p>` : ''}
</div>`;
  }


  // ------------------------------------------------------------------ ranked rows
  const bar = (p, score) => {
    let x = 0; const seg = (v, cls) => { const r = `<rect class="${cls}" x="${Math.max(0, x).toFixed(1)}" y="0" width="${Math.max(0, v).toFixed(1)}" height="10"/>`; x += v; return r; };
    return `<svg class="cc-bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="Score ${score} of 100: skills ${p.skills}, town ${p.town}, budget ${p.budget}"><rect class="cc-bar-track" x="0" y="0" width="100" height="10"/>${seg(p.skills, 'cc-s-skills')}${seg(p.town, 'cc-s-town')}${seg(p.budget, 'cc-s-budget')}</svg>`;
  };
  const sim = r => (r?.simulated ? ' <span class="sim-badge" title="Invented for the prototype">Simulated</span>' : '');
  const supName = (s, anonText = 'A supplier who has not agreed to be named') => (s ? `${esc(s.name)}${sim(s)}${s.consent === false ? ' <span class="cc-private">Not listed publicly: no consent</span>' : ''}` : `<span class="cc-anon">${anonText}</span>`);
  function rowHTML(e, i, { act = '', chosen = false, extra = '' } = {}) {
    const s = e.sup;
    return `<li class="cc-rank${i < 3 ? ' is-top' : ''}${chosen ? ' is-chosen' : ''}${e.local ? ' is-local' : ''}" data-app="${esc(e.id)}">
  <span class="cc-rank-n" aria-label="Rank ${i + 1}">${i + 1}</span>
  <div class="cc-rank-who"><p class="cc-rank-name">${supName(s)}${i < 3 ? ' <span class="cc-top">Top 3</span>' : ''}${chosen ? ' <span class="cc-chosen">Chosen</span>' : ''}${e.local ? ' <span class="local-note">Yours: kept in this browser only</span>' : ''}</p>
    <p class="cc-rank-meta">${s ? `${s.kind === 'company' ? 'Company' : 'Individual professional'}${s.town ? ` · ${esc(s.town)}` : ''} · ` : ''}${e.price != null ? money(e.price) : 'no price'}${e.days ? ` · ${num(e.days)} days` : ''}</p>
    ${e.proposal ? `<p class="cc-rank-prop">${esc(e.proposal)}</p>` : ''}${extra}
    ${staff() && s?.contact ? `<p class="cc-rank-contact">Contact (private feed): ${esc(s.contact)}</p>` : ''}</div>
  <div class="cc-rank-eval"><div class="cc-rank-score"><span class="cc-score">${esc(e.score)}</span>${bar(e.parts, e.score)}</div>
  <ul class="cc-reasons">${e.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  ${act ? `<div class="cc-rank-act">${act}</div>` : ''}
</li>`;
  }

  // The ranked applications of a challenge: Odoo's ranking plus any application made in this browser, re-ranked as
  // action_compute_matches does (score down, then price, then Odoo id).
  function ranked(chId) {
    const c = challenge(chId), m = matchOf(chId);
    const list = (m?.ranked || []).map(r => {
      const a = byId('applications', r.application_id) || {};
      return { id: r.application_id, app: a, odooId: a.odoo?.id ?? 1e9, sup: a.supplier_id ? byId('suppliers', a.supplier_id) : null, score: r.score, reasons: r.reasons, parts: partsFromReasons(r.score, r.reasons), price: a.price_eur, days: a.days, proposal: a.proposal };
    });
    for (const a of state.apps.filter(x => x.challenge_id === chId)) {
      const sup = byId('suppliers', a.supplier_id) || pub.suppliers.find(s => s.id === a.supplier_id); if (!sup || !c) continue;
      const sc = matchScore({ ...c, town: chTown(c) }, sup, a.price_eur);
      list.push({ id: a.id, app: a, odooId: 2e9, sup, local: true, ...sc, price: a.price_eur, days: a.days, proposal: a.proposal });
    }
    return list.sort((x, y) => y.score - x.score || x.price - y.price || x.odooId - y.odooId);
  }
  const decisionOf = chId => state.decisions[chId] || (matchOf(chId) ? { decision: matchOf(chId).decision, chosen: matchOf(chId).chosen_application_id || null, odoo: true } : { decision: null });

  function renderRanks(chId) {
    const ol = $(`[data-ranks="${chId}"]`); if (!ol) return;
    const list = ranked(chId), d = decisionOf(chId);
    const canChoose = persona() === 'challenger' && !d.decision;
    ol.innerHTML = list.length ? list.map((e, i) => rowHTML(e, i, {
      chosen: d.chosen === e.id,
      act: canChoose ? `<button type="button" class="btn btn-sm" data-choose="${esc(chId)}" data-app-id="${esc(e.id)}">Choose this supplier</button>` : '',
    })).join('') : '<li class="cc-note">No applications yet. Odoo ranks them once suppliers apply.</li>';
  }

  function renderDecision(chId) {
    const box = $(`[data-decision="${chId}"]`); if (!box) return;
    const c = challenge(chId), list = ranked(chId), d = decisionOf(chId);
    const pos = list.findIndex(e => e.id === d.chosen), chosen = list[pos];
    const who = chosen ? (chosen.sup ? esc(chosen.sup.name) : 'a supplier who has not agreed to be named') : '';
    const where = chosen ? `, ranked ${pos + 1} of ${list.length}` : '';
    const local = d.odoo ? '' : ` <span class="local-note">Recorded in this browser only</span> <button type="button" class="cc-linkbtn" data-undo="${esc(chId)}">Undo</button>`;
    let html;
    if (!list.length) html = '<p class="cc-decision is-none"><strong>No applications yet.</strong> Odoo ranks them once suppliers apply.</p>';
    else if (d.decision === 'company') html = `<p class="cc-decision is-company"><strong>Decision: the company chose.</strong> ${esc(ownerName(c))} picked ${who || 'a supplier'} from the ranked list${where}.${local}</p>`;
    else if (d.decision === 'ae_triage') html = `<p class="cc-decision is-triage"><strong>Decision: Algarve Evolution triage.</strong> ${chosen ? `The team reviewed the applications and suggested ${who}${where}.` : `The company asked Algarve Evolution to review the applications and suggest the best or a top 3.${(state.suggest[chId] || []).length ? ` Suggested so far: ${state.suggest[chId].map(id => { const e = list.find(x => x.id === id); return e ? (e.sup ? esc(e.sup.name) : 'a supplier not named') : ''; }).filter(Boolean).join(', ')}.` : ''}`}${local}</p>`;
    else html = '<p class="cc-decision is-pending"><strong>Decision pending.</strong> The company can choose from the ranked list, or ask Algarve Evolution to triage and suggest the best or a top 3.</p>';
    box.innerHTML = html;
    const act = $(`[data-owner-act="${chId}"]`);
    if (act) act.innerHTML = list.length && !d.decision && persona() === 'challenger'
      ? `<p class="cc-owner-q">You are trying it as this challenge's owner. Choose one supplier above, or</p><button type="button" class="btn" data-triage-ask="${esc(chId)}">Ask Algarve Evolution to triage</button>`
      : d.decision && d.odoo && persona() === 'challenger' ? '<p class="cc-note">This decision is already recorded in Odoo.</p>' : '';
  }

  function renderChallenge(chId) { renderRanks(chId); renderDecision(chId); }
  const renderAllChallenges = () => pub && pub.challenges.forEach(c => renderChallenge(c.id));

  // ------------------------------------------------------------------ one challenge at a time
  const details = $$('.cc-detail'), pick = $('[data-pick]'), pickSel = $('[data-pick-select]');
  function show(chId, focus) {
    if (!details.some(d => d.dataset.ch === chId)) return;
    details.forEach(d => { d.hidden = d.dataset.ch !== chId; });
    if (pickSel) pickSel.value = chId;
    $$('.cc-card').forEach(c => c.classList.toggle('is-current', c.dataset.ch === chId));
    if (focus) { const el = $(`#challenge-${chId}`); el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'start' }); }
  }
  if (details.length) {
    if (pick) pick.hidden = false;
    const fromHash = (location.hash.match(/^#challenge-(.+)$/) || [])[1];
    show(fromHash && details.some(d => d.dataset.ch === fromHash) ? fromHash : (details.find(d => d.dataset.ch === 'ch-01') || details[0]).dataset.ch, !!fromHash);
    pickSel?.addEventListener('change', () => { show(pickSel.value); history.replaceState(null, '', `#challenge-${pickSel.value}`); });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-open]'); if (!a) return;
    e.preventDefault(); show(a.dataset.open, true); history.replaceState(null, '', `#challenge-${a.dataset.open}`);
  });
  window.addEventListener('hashchange', () => { const id = (location.hash.match(/^#challenge-(.+)$/) || [])[1]; if (id) show(id, true); });

  // ------------------------------------------------------------------ board filters
  let fStatus = 'all', fSkill = '';
  function filterBoard() {
    let n = 0;
    $$('[data-board] .cc-card').forEach(c => {
      const ok = (fStatus === 'all' || c.dataset.status === fStatus) && (!fSkill || c.dataset.skills.split('|').includes(fSkill));
      c.hidden = !ok; if (ok) n++;
    });
    $('[data-board-empty]').hidden = n > 0;
  }
  $$('[data-status-filter] .cc-chip').forEach(b => b.addEventListener('click', () => {
    fStatus = b.dataset.status; $$('[data-status-filter] .cc-chip').forEach(x => x.setAttribute('aria-pressed', String(x === b))); filterBoard();
  }));
  $('[data-skill-filter]')?.addEventListener('change', e => { fSkill = e.target.value; filterBoard(); });

  // ------------------------------------------------------------------ supplier directory
  let fKind = 'all', fCap = '';
  function renderDirectory() {
    const ul = $('[data-sups]'); if (!ul || !pub) return;
    $$('.cc-sup.is-private', ul).forEach(li => li.remove());
    if (staff()) {
      for (const s of priv.suppliers.filter(s => !pub.suppliers.some(p => p.id === s.id))) {
        ul.insertAdjacentHTML('beforeend', `<li class="card cc-sup is-private" data-sup="${esc(s.id)}" data-kind="${esc(s.kind)}" data-caps="${esc(s.capabilities.join('|'))}">
  <p class="cc-sup-kind">${s.kind === 'company' ? 'Company' : 'Individual'}${sim(s)} <span class="cc-private">Staff only: no consent to be listed</span></p>
  <h3 class="cc-sup-name">${esc(s.name)}</h3><p class="cc-sup-town">${esc(s.town || 'Town not given')}${s.rate ? ` · ${esc(s.rate)}` : ''}</p>
  <ul class="cc-tags">${s.capabilities.map(x => `<li class="tag">${esc(x)}</li>`).join('')}</ul>
  <p class="cc-sup-apps">${num(priv.applications.filter(a => a.supplier_id === s.id).length)} application(s) in Odoo</p><p class="cc-rank-contact" data-contact hidden></p></li>`);
      }
    }
    $$('.cc-sup', ul).forEach(li => {
      const s = staff() ? priv.suppliers.find(x => x.id === li.dataset.sup) : null; const c = $('[data-contact]', li);
      if (c) { c.hidden = !s?.contact; c.textContent = s?.contact ? `Contact (private feed): ${s.contact}` : ''; }
    });
    let n = 0;
    $$('.cc-sup', ul).forEach(li => {
      const ok = (fKind === 'all' || li.dataset.kind === fKind) && (!fCap || li.dataset.caps.split('|').includes(fCap));
      li.hidden = !ok; if (ok) n++;
    });
    $('[data-sups-empty]').hidden = n > 0;
    const all = $$('.cc-sup', ul);
    $$('[data-kind-n]').forEach(sp => { const k = sp.dataset.kindN; sp.textContent = all.filter(li => k === 'all' || li.dataset.kind === k).length; });
  }
  $$('[data-kind-filter] .cc-chip').forEach(b => b.addEventListener('click', () => {
    fKind = b.dataset.kind; $$('[data-kind-filter] .cc-chip').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderDirectory();
  }));
  $('[data-cap-filter]')?.addEventListener('change', e => { fCap = e.target.value; renderDirectory(); });

  // ------------------------------------------------------------------ supplier persona: who you are, what fits you
  const meSel = $('[data-me]');
  const me = () => pub?.suppliers.find(s => s.id === (meSel?.value || state.me)) || pub?.suppliers[0];
  function renderSupplier() {
    if (!pub) return;
    const s = me(); if (!s) return;
    const isSup = persona() === 'supplier';
    $('[data-me-caps]').innerHTML = `Your capabilities in Odoo: <strong>${s.capabilities.map(esc).join(', ')}</strong> · ${esc(s.town)}${s.rate ? ` · ${esc(s.rate)}` : ''}`;
    $$('[data-me-name]').forEach(el => { el.textContent = s.name; });
    const fits = pub.challenges.map(c => {
      const shared = c.skills.filter(k => s.capabilities.includes(k));
      const sc = matchScore({ ...c, town: chTown(c) }, s, 0);
      return { c, shared, pre: r1(sc.parts.skills + sc.parts.town), townReason: sc.reasons[1], takes: c.status === 'open' || c.status === 'matching', applied: state.apps.some(a => a.challenge_id === c.id && a.supplier_id === s.id) };
    }).sort((a, b) => b.takes - a.takes || b.pre - a.pre);
    $('[data-fitlist]').innerHTML = fits.map(f => `<li class="cc-fit-item${f.takes ? '' : ' is-past'}">
  <a href="#challenge-${esc(f.c.id)}" data-open="${esc(f.c.id)}">${esc(f.c.title)}</a>
  <span class="cc-fit-meta">${statusTag(f.c.status)} ${f.shared.length} of ${f.c.skills.length} skills${f.shared.length ? ` (${f.shared.map(esc).join(', ')})` : ''} · ${esc(f.townReason.replace(/^Town: /, ''))} · ${f.pre} of 70 before your price${f.applied ? ' · <strong>applied in this browser</strong>' : ''}</span>
</li>`).join('');
    $$('[data-board] .cc-card').forEach(card => {
      const c = pub.challenges.find(x => x.id === card.dataset.ch); const tag = $('[data-fit]', card);
      const n = c.skills.filter(k => s.capabilities.includes(k)).length;
      card.classList.toggle('is-fit', isSup && n > 0);
      tag.hidden = !isSup; tag.textContent = n ? `Fits you: ${n} of ${c.skills.length} skills` : 'No skill in common';
      tag.classList.toggle('is-no', !n);
    });
    $$('[data-apply]').forEach(f => preview(f));
  }
  meSel?.addEventListener('change', () => { state.me = meSel.value; save(); renderSupplier(); });

  function preview(form) {
    const chId = form.dataset.apply, c = challenge(chId), s = me(); if (!c || !s) return;
    const price = Number(form.price.value);
    const out = $('[data-preview]', form);
    if (!price) { out.textContent = 'Enter a price to see your score.'; return; }
    const sc = matchScore({ ...c, town: chTown(c) }, s, price);
    const others = ranked(chId).filter(e => !(e.local && e.app.supplier_id === s.id));
    const rank = others.filter(e => e.score > sc.score || (e.score === sc.score && e.price <= price)).length + 1;
    const prior = others.findIndex(e => !e.local && e.app?.supplier_id === s.id);
    out.innerHTML = `<strong>Your score would be ${sc.score} of 100, rank ${rank} of ${others.length + 1}.</strong> ${sc.reasons.map(esc).join('. ')}.${prior >= 0 ? ` <em>Odoo already holds an application from you for this challenge (ranked ${prior + 1}); this one would be a second.</em>` : ''}`;
  }
  document.addEventListener('input', e => { const f = e.target.closest('[data-apply]'); if (f) preview(f); });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-apply]'); if (!f) return;
    e.preventDefault();
    const chId = f.dataset.apply, c = challenge(chId), s = me();
    const app = { id: `local-app-${chId}-${s.id}`, challenge_id: chId, supplier_id: s.id, proposal: f.proposal.value.trim(), price_eur: Number(f.price.value), days: Number(f.days.value) };
    state.apps = state.apps.filter(a => a.id !== app.id).concat(app); save();
    renderChallenge(chId); renderSupplier(); renderOwners();
    $('[data-call]', f.parentElement).innerHTML = `<p class="cc-done" role="status">Applied. Your application is in the ranked list, kept in this browser only.</p>` + callPanel('Apply to this challenge as a supplier', [
      { why: 'Create the application', model: 'aih.application', method: 'create', body: { vals_list: [{ challenge_id: c.odoo.id, supplier_id: s.odoo.id, proposal: app.proposal, price_eur: app.price_eur, days: app.days }] } },
      { why: 'Score and rank every application of the challenge again', model: 'aih.challenge', method: 'action_compute_matches', body: { ids: [c.odoo.id] } },
    ], 'Odoo keeps a new application unpublished (<code>is_published</code> false) until Algarve Evolution publishes it, so it reaches the public feed only then.');
    const row = $(`[data-app="${app.id}"]`); row?.scrollIntoView({ block: 'nearest' });
  });

  // ------------------------------------------------------------------ challenge owner: choose, or ask for triage
  document.addEventListener('click', e => {
    const ch = e.target.closest('[data-choose]'), tri = e.target.closest('[data-triage-ask]'), undo = e.target.closest('[data-undo]');
    if (ch) {
      const chId = ch.dataset.choose, appId = ch.dataset.appId, c = challenge(chId);
      const entry = ranked(chId).find(x => x.id === appId);
      state.decisions[chId] = { decision: 'company', chosen: appId }; save(); renderChallenge(chId); renderOwners(); renderTriage();
      $(`[data-call-decision="${chId}"]`).innerHTML = callPanel('The company chooses a supplier', [
        { why: '', model: 'aih.challenge', method: 'write', body: { ids: [c.odoo.id], vals: { decision: 'company', chosen_application_id: entry?.local ? 'id from your application\'s create call' : entry?.odooId, state: 'matched' } } },
      ]);
      $(`[data-decision="${chId}"]`).scrollIntoView({ block: 'nearest' });
    }
    if (tri) {
      const chId = tri.dataset.triageAsk, c = challenge(chId);
      state.decisions[chId] = { decision: 'ae_triage', chosen: null }; save(); renderChallenge(chId); renderOwners(); renderTriage();
      $(`[data-call-decision="${chId}"]`).innerHTML = callPanel('Ask Algarve Evolution to triage', [
        { why: '', model: 'aih.challenge', method: 'write', body: { ids: [c.odoo.id], vals: { decision: 'ae_triage' } } },
      ], 'The challenge then waits in the Algarve Evolution team\'s triage view (switch to that persona to try it).');
    }
    if (undo) {
      const chId = undo.dataset.undo; delete state.decisions[chId]; delete state.suggest[chId]; save();
      renderChallenge(chId); renderOwners(); renderTriage(); const cd = $(`[data-call-decision="${chId}"]`); if (cd) cd.innerHTML = '';
    }
  });

  function renderOwners() {
    const box = $('[data-owner-list]'); if (!box || !pub) return;
    const pending = pub.challenges.filter(c => ranked(c.id).length && !decisionOf(c.id).decision);
    const decidedHere = pub.challenges.filter(c => state.decisions[c.id]);
    const top3 = id => ranked(id).slice(0, 3).map((e, i) => `<li><span class="cc-mini-n">${i + 1}</span> ${e.sup ? esc(e.sup.name) : '<span class="cc-anon">Supplier not named</span>'} <span class="cc-mini-s">${e.score}</span></li>`).join('');
    box.innerHTML = `${pending.length ? `<p class="cc-mine-h">Waiting for your decision</p><ul class="cc-mine-list">${pending.map(c => `<li class="cc-mine-item"><a href="#challenge-${esc(c.id)}" data-open="${esc(c.id)}">${esc(c.title)}</a><ol class="cc-mini">${top3(c.id)}</ol></li>`).join('')}</ul>` : '<p class="cc-note">No challenge is waiting for a decision.</p>'}
${decidedHere.length ? `<p class="cc-mine-h">Decided in this browser</p><ul class="cc-mine-list">${decidedHere.map(c => `<li class="cc-mine-item"><a href="#challenge-${esc(c.id)}" data-open="${esc(c.id)}">${esc(c.title)}</a> · ${state.decisions[c.id].decision === 'company' ? 'you chose' : 'sent to Algarve Evolution triage'}</li>`).join('')}</ul>` : ''}
${state.posted.length ? `<p class="cc-mine-h">Posted in this browser</p><ul class="cc-mine-list">${state.posted.map(p => `<li class="cc-mine-item"><a href="#post" data-load="${esc(p.id)}">${esc(p.title)}</a><ol class="cc-mini">${postRank(p).slice(0, 3).map((e, i) => `<li><span class="cc-mini-n">${i + 1}</span> ${esc(e.sup.name)} <span class="cc-mini-s">${e.score}</span></li>`).join('')}</ol></li>`).join('')}</ul>` : ''}`;
  }

  // ------------------------------------------------------------------ the matcher: post a challenge
  const post = $('[data-post]'); let postAll = false;
  const readPost = () => {
    const f = post; const skills = $$('input[name=skills]:checked', f).map(i => i.value);
    return { title: f.title.value.trim(), org: f.org.value.trim(), problem: f.problem.value.trim(), requirements: f.requirements.value.split('\n').map(s => s.trim()).filter(Boolean), skills, budget_eur_min: Number(f.min.value || 0), budget_eur_max: Number(f.max.value || 0), deadline: f.deadline.value, town: f.town.value, days: Number(f.days.value || 0) };
  };
  function postRank(p) {
    return feed().suppliers.map(sup => {
      const est = estimate(sup, p.days || 20);
      const sc = est ? matchScore(p, sup, est.price) : (() => { const x = matchScore({ ...p, budget_eur_max: 0 }, sup, 0); x.reasons[2] = 'Budget: no rate in Odoo, so half marks'; return x; })();
      return { id: sup.id, sup, ...sc, price: est?.price ?? null, est };
    }).sort((a, b) => b.score - a.score || (a.price ?? 1e12) - (b.price ?? 1e12) || a.sup.name.localeCompare(b.sup.name));
  }
  function postCalls(p) {
    return callPanel('Post this challenge to Odoo and rank the suppliers', [
      { why: 'Find the ids of the skills you picked', model: 'aih.skill', method: 'search_read', body: { domain: [['name', 'in', p.skills]], fields: ['name'] } },
      { why: 'Create the challenge', model: 'aih.challenge', method: 'create', body: { vals_list: [{ name: p.title, org_name: p.org, town: p.town || false, problem: p.problem, requirements: p.requirements.join('\n'), skill_ids: [[6, 0, 'ids from call 1']], budget_eur_min: p.budget_eur_min, budget_eur_max: p.budget_eur_max, deadline: p.deadline || false, state: 'open' }] } },
      { why: 'Once suppliers apply, score and rank their applications', model: 'aih.challenge', method: 'action_compute_matches', body: { ids: ['id from call 2'] } },
    ], 'The ranking is how each supplier in Odoo would score if they applied at their rate for the days you expect; Odoo ranks the real applications with the same score. A new challenge stays unpublished until Algarve Evolution publishes it.');
  }
  function renderPost() {
    if (!post || !pub) return;
    const p = readPost(), msg = $('[data-post-msg]');
    const problems = [];
    if (!p.skills.length) problems.push('Pick at least one skill.');
    if (p.budget_eur_max && p.budget_eur_min > p.budget_eur_max) problems.push('The budget "from" is above the budget "to".');
    msg.textContent = problems.join(' '); msg.classList.remove('is-ok');
    const list = postRank(p);
    const shown = postAll ? list : list.slice(0, 6);
    $('[data-post-ranks]').innerHTML = shown.map((e, i) => rowHTML(e, i, { extra: e.est ? `<p class="cc-est">Estimated price: ${e.est.text}</p>` : '' })).join('')
      + (list.length > 6 ? `<li class="cc-more"><button type="button" class="cc-linkbtn" data-post-all aria-expanded="${postAll}">${postAll ? 'Show the first 6 only' : `Show all ${list.length} suppliers`}</button></li>` : '');
    $('[data-post-call]').innerHTML = postCalls(p);
    return problems;
  }
  post?.addEventListener('input', renderPost);
  post?.addEventListener('change', renderPost);
  post?.addEventListener('submit', e => {
    e.preventDefault(); const problems = renderPost(); if (problems?.length) { $('[data-post-msg]').focus?.(); return; }
    const p = { id: `local-${Date.now().toString(36)}`, ...readPost(), created: new Date().toISOString().slice(0, 10) };
    state.posted = [p, ...state.posted].slice(0, 12); save();
    const m = $('[data-post-msg]'); m.textContent = 'Posted: kept in this browser only. It is now at the top of the board, and the Odoo calls are under the ranking.'; m.classList.add('is-ok');
    renderLocalBoard(); renderOwners();
  });
  function renderLocalBoard() {
    const ul = $('[data-local-board]'); if (!ul || !pub) return;
    ul.innerHTML = state.posted.map(p => {
      const top = postRank(p).slice(0, 3);
      return `<li class="card cc-card cc-card-local">
  <div class="cc-card-top">${statusTag('open')} <span class="local-note">Yours: kept in this browser only</span></div>
  <h3 class="cc-card-title">${esc(p.title)}</h3>
  <p class="card-meta">${esc(p.org)}${p.town ? ` · ${esc(p.town)}` : ''}</p>
  <p class="cc-card-problem">${esc(p.problem)}</p>
  <ul class="cc-tags">${p.skills.map(s => `<li class="tag">${esc(s)}</li>`).join('')}</ul>
  <dl class="cc-facts"><div><dt>Budget</dt><dd>${money(p.budget_eur_min)} to ${money(p.budget_eur_max)}</dd></div><div><dt>Deadline</dt><dd>${esc(fmtDate(p.deadline))}</dd></div></dl>
  <p class="cc-mine-h">Your top 3 suppliers</p><ol class="cc-mini">${top.map((e, i) => `<li><span class="cc-mini-n">${i + 1}</span> ${esc(e.sup.name)} <span class="cc-mini-s">${e.score}</span></li>`).join('')}</ol>
  <p class="card-foot cc-card-go"><button type="button" class="cc-linkbtn" data-load="${esc(p.id)}">See the full ranking</button> · <button type="button" class="cc-linkbtn" data-remove="${esc(p.id)}">Remove</button></p>
</li>`;
    }).join('');
  }
  document.addEventListener('click', e => {
    const l = e.target.closest('[data-load]'), r = e.target.closest('[data-remove]');
    if (l) {
      e.preventDefault(); const p = state.posted.find(x => x.id === l.dataset.load); if (!p || !post) return;
      post.title.value = p.title; post.org.value = p.org; post.problem.value = p.problem; post.requirements.value = p.requirements.join('\n');
      $$('input[name=skills]', post).forEach(i => { i.checked = p.skills.includes(i.value); });
      post.min.value = p.budget_eur_min; post.max.value = p.budget_eur_max; post.deadline.value = p.deadline; post.town.value = p.town; post.days.value = p.days;
      renderPost(); $('#post').scrollIntoView({ block: 'start' });
    }
    if (e.target.closest('[data-post-all]')) { postAll = !postAll; renderPost(); $('[data-post-all]')?.focus(); }
    if (r) { state.posted = state.posted.filter(x => x.id !== r.dataset.remove); save(); renderLocalBoard(); renderOwners(); }
  });

  // ------------------------------------------------------------------ Algarve Evolution team: triage
  function renderTriage() {
    const box = $('[data-triage]'); if (!box || !pub) return;
    if (!staff()) { box.innerHTML = '<p class="cc-note">The triage view needs the private feed. Choose "Open the private feed" above and enter the access key.</p>'; return; }
    const order = { matching: 0, open: 1, matched: 2, closed: 3 };
    const odooDecided = id => (matchOf(id)?.decision ? 1 : 0);
    const chs = [...priv.challenges].sort((a, b) => odooDecided(a.id) - odooDecided(b.id) || order[a.status] - order[b.status]);
    box.innerHTML = chs.map(c => {
      const list = ranked(c.id), d = decisionOf(c.id);
      const sugg = state.suggest[c.id] || list.slice(0, 3).map(e => e.id);
      return `<article class="cc-tri" data-tri="${esc(c.id)}">
  <header class="cc-tri-head"><div><p class="cc-detail-kick">${statusTag(c.status)}${sim(c)} <span class="cc-tri-dec">${d.decision === 'company' ? 'The company decides' : d.decision === 'ae_triage' ? 'Algarve Evolution triage' : 'Nobody has decided yet'}${d.odoo === undefined && d.decision ? ' (this browser)' : ''}</span></p>
    <h3 class="cc-h3"><a href="#challenge-${esc(c.id)}" data-open="${esc(c.id)}">${esc(c.title)}</a></h3>
    <p class="cc-tri-sub">${esc(ownerName(c))} · ${money(c.budget_eur_min)} to ${money(c.budget_eur_max)} · deadline ${esc(fmtDate(c.deadline))} · ${list.length} application(s)</p></div></header>
  <ol class="cc-tri-list">${list.map((e, i) => `<li class="cc-tri-row${sugg.includes(e.id) ? ' is-sugg' : ''}${d.chosen === e.id ? ' is-chosen' : ''}">
    <label class="cc-tri-tick"><input type="checkbox" data-sugg value="${esc(e.id)}" aria-label="Suggest rank ${i + 1}: ${esc(e.sup ? e.sup.name : 'supplier missing')}"${sugg.includes(e.id) ? ' checked' : ''}><span class="cc-rank-n">${i + 1}</span></label>
    <div class="cc-tri-who"><p class="cc-rank-name">${supName(e.sup, 'Supplier missing')}${e.local ? ' <span class="local-note">This browser</span>' : ''}</p>
      <p class="cc-rank-meta">${e.sup ? esc(e.sup.town || '') : ''} · ${e.price != null ? money(e.price) : ''} · ${num(e.days)} days</p>
      <p class="cc-rank-contact">${e.sup?.contact ? `Contact (private feed): ${esc(e.sup.contact)}` : 'No contact in Odoo'}</p></div>
    <div class="cc-rank-score"><span class="cc-score">${e.score}</span>${bar(e.parts, e.score)}</div>
  </li>`).join('') || '<li class="cc-note">No applications yet.</li>'}</ol>
  ${list.length ? `<div class="cc-tri-form">
    <p class="cc-tri-help" data-sugg-msg aria-live="polite">Ticked: the top 3 you suggest to the company (up to 3).</p>
    <label>Who decides <select data-tri-dec>${[['ae_triage', 'Algarve Evolution triage'], ['company', 'The company chooses'], ['', 'Not decided yet']].map(([v, l]) => `<option value="${v}"${(d.decision || 'ae_triage') === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Chosen supplier <select data-tri-chosen><option value="">None yet</option>${list.map((e, i) => `<option value="${esc(e.id)}"${d.chosen === e.id ? ' selected' : ''}>${i + 1}. ${esc(e.sup ? e.sup.name : 'Supplier missing')} (${e.score})</option>`).join('')}</select></label>
    <button type="button" class="btn btn-accent" data-tri-save="${esc(c.id)}">Record (kept in this browser only)</button>
  </div><div data-tri-call></div>` : ''}
</article>`;
    }).join('');
  }
  document.addEventListener('change', e => {
    const cb = e.target.closest('[data-sugg]'); if (!cb) return;
    const art = cb.closest('[data-tri]'); const ticked = $$('[data-sugg]:checked', art);
    if (ticked.length > 3) { cb.checked = false; $('[data-sugg-msg]', art).textContent = 'Up to 3: untick one first.'; return; }
    $('[data-sugg-msg]', art).textContent = `Ticked: ${ticked.length} of up to 3 suggested.`;
    cb.closest('.cc-tri-row').classList.toggle('is-sugg', cb.checked);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tri-save]'); if (!b) return;
    const art = b.closest('[data-tri]'), chId = b.dataset.triSave, c = challenge(chId), list = ranked(chId);
    const sugg = $$('[data-sugg]:checked', art).map(i => i.value), dec = $('[data-tri-dec]', art).value || null, chosen = $('[data-tri-chosen]', art).value || null;
    state.suggest[chId] = sugg; state.decisions[chId] = { decision: dec, chosen }; save();
    const oid = id => { const x = list.find(e => e.id === id); return x?.local ? 'id of the application made in this browser' : x?.odooId; };
    renderChallenge(chId); renderOwners();
    const panel = callPanel('Record the triage', [
      { why: '', model: 'aih.challenge', method: 'write', body: { ids: [c.odoo.id], vals: { decision: dec || false, chosen_application_id: chosen ? oid(chosen) : false, state: chosen ? 'matched' : 'matching', suggested_application_ids: [[6, 0, sugg.map(oid)]] } } },
    ], '<code>suggested_application_ids</code> is a field we propose to add to <code>aih.challenge</code> for the suggested top 3; it is not in the addon yet. The other fields are.');
    renderTriage();
    const art2 = $(`[data-tri="${chId}"]`); $('[data-tri-call]', art2).innerHTML = `<p class="cc-done" role="status">Recorded in this browser only.</p>${panel}`;
  });

  // ------------------------------------------------------------------ staff: open the private feed
  $('[data-unlock]')?.addEventListener('click', () => {
    const sel = $('[data-persona-select]'); if (!sel) return;
    sel.value = 'staff'; sel.dispatchEvent(new Event('change'));
  });
  function renderStaffState() {
    const p = $('[data-staff-state]'), btn = $('[data-unlock]'); if (!p) return;
    if (priv) {
      const hidden = priv.suppliers.length - (pub?.suppliers.length || 0);
      p.innerHTML = `The private feed is open in this tab: ${num(priv.applications.length)} applications with contact details, and ${num(hidden)} supplier(s) who have not agreed to be listed publicly. Go to <a href="#triage">Triage</a> to suggest a top 3 and record the decision.`;
      if (btn) btn.closest('p').hidden = true;
    }
  }

  // ------------------------------------------------------------------ start
  function renderAll() {
    if (!pub) return;
    renderAllChallenges(); renderDirectory(); renderSupplier(); renderOwners(); renderLocalBoard(); renderPost(); renderTriage(); renderStaffState();
  }
  const start = () => {
    if (!window.HUB) return;
    window.HUB.publicFeed().then(f => {
      pub = f;
      if (meSel && state.me && pub.suppliers.some(s => s.id === state.me)) meSel.value = state.me;
      renderAll();
    }).catch(() => { const r = $('[data-post-ranks]'); if (r) r.innerHTML = '<li class="cc-note">The feed could not be read.</li>'; });
    window.HUB.on('persona', () => renderAll());
    window.HUB.on('private', f => { priv = f; renderAll(); });
  };
  start();
})();
