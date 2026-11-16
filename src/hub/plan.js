// The Plan page (/plan/): review, approve, sign, export and verify the changes proposed to Odoo.
// Reads the queue from window.HUB.plan (src/hub/hub.js) and the broker's policy from window.PlanPolicy
// (src/hub/plan-policy.js, the same file scripts/odoo/apply-plan.mjs loads). Reviews, the reviewer's name and the last
// signed plan are kept in localStorage; the reviewer's private key in IndexedDB, made non-extractable.
// Nothing here talks to Odoo or to any other host. Owner: odoo@AgentiCCells.dinis. Apache-2.0.
(() => {
  const C = JSON.parse(document.getElementById('plan-config')?.textContent || '{}');
  const P = window.PlanPolicy, HUB = window.HUB;
  if (!P || !HUB?.plan) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage off: this tab only */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
    json(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  };
  const K = { review: 'hub-plan-review', seeded: 'hub-plan-seeded', name: 'hub-plan-reviewer', demo: 'hub-plan-demo', signed: 'hub-plan-signed' };
  let review = ls.json(K.review, {}), items = [], demo = ls.get(K.demo) === '1', key = null, keyNote = '', signed = ls.json(K.signed, null), clearArmed = 0;
  const when = iso => { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
  const day = iso => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso; } };
  const plural = (n, w, ws = `${w}s`) => `${n} ${n === 1 ? w : ws}`;
  const canReview = () => HUB.persona === 'staff' || demo;
  const mode = () => (HUB.persona === 'staff' ? 'review' : 'demo');

  // ------------------------------------------------------------------ records, from the feeds
  const byOdoo = {}, byId = {};
  const FIELD_MODEL = { challenge_id: 'aih.challenge', supplier_id: 'res.partner', partner_id: 'res.partner', mentor_id: 'res.partner', company_id: 'aih.programme.company', programme_id: 'aih.programme', vibathon_id: 'aih.vibathon', project_id: 'aih.project', application_id: 'aih.application', chosen_application_id: 'aih.application', community_id: 'aih.community', aih_community_id: 'aih.community' };
  function indexFeed(feed, priv) {
    if (!feed) return;
    const companies = Object.fromEntries((feed.companies || []).map(c => [c.id, c]));
    for (const [list, rows] of Object.entries(feed)) {
      if (!Array.isArray(rows)) continue;
      for (const r of rows) {
        if (!r || !r.odoo || !r.id) continue;
        const label = r.name || r.title || r.topic || (list === 'kpis' ? `${companies[r.company_id]?.name || r.company_id}, month ${r.month}` : '') || (list === 'reflections' ? `Reflection, month ${r.month}` : '') || r.id;
        const e = { id: r.id, model: r.odoo.model, oid: r.odoo.id, label, simulated: !!r.simulated, priv: !!priv && !byId[r.id] };
        if (!byId[r.id] || !priv) byId[r.id] = e;
        byOdoo[`${r.odoo.model}:${r.odoo.id}`] ||= e;
      }
    }
  }
  function touched(it) {
    const out = new Map();
    const addOdoo = (model, id) => { if (typeof id !== 'number') return; const e = byOdoo[`${model}:${id}`]; out.set(`${model}:${id}`, e || { model, oid: id, label: null }); };
    for (const c of it.calls) {
      const p = P.parsePath(c.path); if (!p || !c.body || typeof c.body !== 'object') continue;
      (Array.isArray(c.body.ids) ? c.body.ids : []).forEach(id => addOdoo(p.model, id));
      const vals = Array.isArray(c.body.vals_list) ? c.body.vals_list : c.body.vals ? [c.body.vals] : [];
      vals.forEach(v => Object.entries(v || {}).forEach(([f, x]) => { if (FIELD_MODEL[f]) addOdoo(FIELD_MODEL[f], x); }));
    }
    (it.refs || []).forEach(r => { const e = byId[r]; if (e && !out.has(`${e.model}:${e.oid}`)) out.set(`${e.model}:${e.oid}`, e); });
    return [...out.values()];
  }

  // ------------------------------------------------------------------ the queue
  const queue = $('[data-queue]');
  // Sources are page ids ("inc-acc") or workflow cells ("workflow:<cell id>", from the Workflows page).
  const sourceLabel = s => C.sources?.[s] || (String(s).startsWith('workflow:') ? `${C.sources?.workflows || 'Workflows'}: ${String(s).slice(9)}` : s);
  const sourceHref = s => (s === 'home' ? '/' : C.sources?.[s] ? `/${s}/` : String(s).startsWith('workflow:') ? `/workflows/#${encodeURIComponent(String(s).slice(9))}` : null);
  const pretty = c => (c.body ? JSON.stringify(c.body, null, 2) : c.raw || '(no body)');
  const decision = id => review[id]?.decision || null;
  const checksHtml = list => `<ul class="pl-checks">${list.map(c => `<li class="${c.ok ? 'is-ok' : 'is-bad'}"><span class="pl-ck" aria-hidden="true">${c.ok ? '✓' : '✕'}</span><span><span class="visually-hidden">${c.ok ? 'Passes: ' : 'Fails: '}</span>${c.call ? `<b>Call ${c.call}</b> · ` : ''}${esc(c.rule)}${c.note ? `: ${esc(c.note)}` : ''}</span></li>`).join('')}</ul>`;
  // One line per call when all its checks pass; each failing check on its own line, with its reason.
  const RULE = { model: 'model', method: 'method', fields: 'hub fields only', refs: 'references', values: 'values', ids: 'ids', size: 'size', body: 'body', form: 'form' };
  function brokerLines(it, chk) {
    const out = chk.checks.filter(c => c.call === 0);
    it.calls.forEach((c, i) => {
      const mine = chk.checks.filter(x => x.call === i + 1), p = P.parsePath(c.path);
      const what = p ? `${p.model}/${p.method}` : c.path;
      if (mine.every(x => x.ok)) {
        const refs = mine.filter(x => x.rule === 'refs').map(x => x.note.replace(/^"[^"]*" /, '')).join('; ');
        out.push({ call: i + 1, rule: what, ok: true, note: `allowed (${[...new Set(mine.filter(x => x.rule !== 'refs').map(x => RULE[x.rule] || x.rule))].join(', ')} pass)${refs ? `; ${refs}` : ''}` });
      } else mine.filter(x => !x.ok).forEach(x => out.push({ call: i + 1, rule: `${what}: ${RULE[x.rule] || x.rule}`, ok: false, note: x.note }));
    });
    return out;
  }
  function itemHtml(it) {
    const chk = P.checkItem(it), dec = decision(it.id), bad = chk.checks.filter(c => !c.ok).length;
    const recs = touched(it);
    const state = dec === 'approved' ? '<span class="tag tag-ok">Approved</span>' : dec === 'rejected' ? '<span class="tag tag-accent">Rejected</span>' : '<span class="tag">Waiting for review</span>';
    const href = sourceHref(it.source);
    const src = href ? `<a href="${href}">${esc(sourceLabel(it.source))}</a>` : esc(sourceLabel(it.source));
    const pageChecks = it.policy ? `<h5>The page's own policy</h5><dl class="pl-pol">${it.policy.agent ? `<div><dt>Agent</dt><dd>${esc(it.policy.agent)}</dd></div>` : ''}${it.policy.grant ? `<div><dt>Grant</dt><dd>${(Array.isArray(it.policy.grant) ? it.policy.grant : [it.policy.grant]).map(g => `<code>${esc(g)}</code>`).join(' ')}</dd></div>` : ''}${it.policy.mandate ? `<div><dt>Mandate</dt><dd>${esc(it.policy.mandate)}</dd></div>` : ''}</dl>${Array.isArray(it.policy.checks) && it.policy.checks.length ? checksHtml(it.policy.checks) : ''}` : '';
    const recHtml = recs.length ? `<ul class="pl-refs">${recs.map(r => `<li><span class="odoo-chip"><span class="odoo-dot" aria-hidden="true"></span>${esc(r.model)} · ${esc(r.oid)}</span> ${r.label ? `<span>${esc(r.label)}</span>${r.simulated ? ' <span class="sim-badge">Simulated</span>' : ''}${r.priv ? ' <span class="tag tag-odoo">private feed</span>' : ''}` : `<span class="pl-muted">${HUB.persona === 'staff' && !HUB.privateFeed ? 'not in the public feed: open the private feed to see it' : 'not in the public feed'}</span>`}</li>`).join('')}</ul>` : '<p class="pl-muted">New records only; nothing existing is changed.</p>';
    const why = !chk.ok ? 'The broker would refuse it: a check fails. Change it on the page it came from and add it again.' : !canReview() ? 'Approving is for the Algarve Evolution team. Turn on the demo above to try it.' : '';
    return `<article class="pl-item pl-is-${dec || 'waiting'}" data-id="${esc(it.id)}" aria-labelledby="t-${esc(it.id)}">
  <header class="pl-item-head">
    <div class="pl-item-titles">
      <p class="pl-item-tags">${state}${it.simulated ? ' <span class="sim-badge" title="Invented for the prototype">Simulated</span>' : ''}${bad ? ` <span class="tag tag-warn">${plural(bad, 'policy issue')}</span>` : ' <span class="tag tag-odoo">Policy checks pass</span>'}${mode() === 'demo' && dec ? ' <span class="tag">Demo</span>' : ''}</p>
      <h4 id="t-${esc(it.id)}">${esc(it.title)}</h4>
      <p class="pl-item-sub">From ${src} · added ${esc(when(it.added))} · ${plural(it.calls.length, 'call')}, ${plural(chk.writes, 'write')}${it.snapshot?.exported ? ` · snapshot: the ${esc(it.snapshot.feed || 'public')} feed of ${esc(day(it.snapshot.exported))}` : ''}</p>
    </div>
  </header>
  <div class="pl-item-body">
    <div class="pl-calls">${it.calls.map((c, i) => `<details class="odoo-call" data-plan="off" data-k="${esc(it.id)}:${i}"${it.calls.length <= 2 ? ' open' : ''}><summary><span class="odoo-call-verb">${esc(c.method)}</span> <code>${esc(c.path)}</code> <span class="odoo-call-flag">in the plan · not sent</span></summary>${c.why ? `<p class="odoo-call-note pl-why">${it.calls.length > 1 ? `${i + 1}. ` : ''}${esc(c.why)}</p>` : ''}<pre tabindex="0"><code>${esc(pretty(c))}</code></pre></details>`).join('')}</div>
    <div class="pl-side">
      <h5>Policy checks <span>the broker's, run in your browser</span></h5>${checksHtml(brokerLines(it, chk))}
      ${pageChecks}
      <h5>Records it touches</h5>${recHtml}
    </div>
  </div>
  <footer class="pl-item-actions">
    <button type="button" class="btn btn-sm ${dec === 'approved' ? 'btn-primary' : ''}" data-act="approve" aria-pressed="${dec === 'approved'}"${!chk.ok || !canReview() ? ' disabled' : ''}>${dec === 'approved' ? '✓ Approved' : 'Approve'}</button>
    <button type="button" class="btn btn-sm ${dec === 'rejected' ? 'pl-btn-rejected' : ''}" data-act="reject" aria-pressed="${dec === 'rejected'}"${!canReview() ? ' disabled' : ''}>${dec === 'rejected' ? '✕ Rejected' : 'Reject'}</button>
    <button type="button" class="btn btn-sm pl-btn-quiet" data-act="remove">Remove from plan</button>
    ${why ? `<span class="pl-item-why">${esc(why)}</span>` : ''}
  </footer>
</article>`;
  }

  function render() {
    items = HUB.plan.list();
    const ids = new Set(items.map(i => i.id)); let pruned = false;
    Object.keys(review).forEach(id => { if (!ids.has(id)) { delete review[id]; pruned = true; } });
    if (pruned) ls.set(K.review, JSON.stringify(review));
    const checks = Object.fromEntries(items.map(i => [i.id, P.checkItem(i)]));
    const approved = items.filter(i => decision(i.id) === 'approved' && checks[i.id].ok);
    const stat = (k, v) => { const el = $(`[data-stat="${k}"]`); if (el) el.textContent = String(v); };
    stat('items', items.length); stat('approved', approved.length); stat('issues', items.filter(i => !checks[i.id].ok).length);
    const rejected = items.filter(i => decision(i.id) === 'rejected').length;
    $('[data-queue-count]').textContent = items.length ? `${plural(items.length, 'item')} in this browser's plan: ${approved.length} approved, ${rejected} rejected, ${items.length - approved.length - rejected} waiting.` : 'The plan in this browser is empty.';
    // Keep focus and open panels across the re-render.
    const a = document.activeElement, focus = a && queue.contains(a) ? { id: a.closest('[data-id]')?.dataset.id, act: a.dataset.act } : null;
    const open = new Set([...queue.querySelectorAll('details[data-k]')].filter(d => d.open).map(d => d.dataset.k));
    const closed = new Set([...queue.querySelectorAll('details[data-k]')].filter(d => !d.open).map(d => d.dataset.k));
    if (!items.length) {
      queue.innerHTML = `<div class="pl-empty"><h3>Nothing in the plan yet</h3><p>Open <a href="/inc-acc/">INC/ACC</a>, <a href="/challenge-connect/">Challenge Connect</a>, <a href="/vibathon/">Vibathon</a> or <a href="/talent/">the Talent Ecosystem</a>, use a form, and press <b>Add to plan</b> on its Odoo call panel. Or add the two examples above.</p></div>`;
    } else {
      const groups = new Map(); items.forEach(i => { if (!groups.has(i.source)) groups.set(i.source, []); groups.get(i.source).push(i); });
      queue.innerHTML = [...groups].map(([s, list]) => `<section class="pl-group" aria-label="From ${esc(sourceLabel(s))}"><h3 class="pl-group-h"><span>From ${esc(sourceLabel(s))}</span> <span class="pl-group-n">${plural(list.length, 'item')}</span></h3>${list.map(itemHtml).join('')}</section>`).join('');
      queue.querySelectorAll('details[data-k]').forEach(d => { if (open.has(d.dataset.k)) d.open = true; if (closed.has(d.dataset.k)) d.open = false; });
      if (focus?.id) { const el = queue.querySelector(`[data-id="${CSS.escape(focus.id)}"] [data-act="${focus.act}"]`); if (el && !el.disabled) el.focus(); else queue.querySelector(`[data-id="${CSS.escape(focus.id)}"] [data-act="remove"]`)?.focus(); }
    }
    const pn = $('[data-private-note]'); if (pn) pn.textContent = HUB.privateFeed ? 'The private feed is open: private records show by name.' : 'Open the private feed to see private records by name.';
    renderSign();
  }

  queue.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return;
    const id = b.closest('[data-id]').dataset.id, act = b.dataset.act;
    if (act === 'remove') { const next = b.closest('.pl-item').nextElementSibling || b.closest('.pl-group').nextElementSibling; HUB.plan.remove(id); next?.querySelector?.('button[data-act="remove"]')?.focus(); return; }
    const d = act === 'approve' ? 'approved' : 'rejected';
    if (review[id]?.decision === d) delete review[id]; else review[id] = { decision: d, at: new Date().toISOString(), mode: mode() };
    ls.set(K.review, JSON.stringify(review)); render();
  });
  $('[data-seed]')?.addEventListener('click', () => { (C.seeds || []).forEach(s => HUB.plan.add(s)); ls.set(K.seeded, '1'); });
  $('[data-clear]')?.addEventListener('click', e => {
    const b = e.currentTarget;
    if (!items.length) return;
    if (Date.now() - clearArmed > 5000) { clearArmed = Date.now(); b.textContent = 'Press again to empty it'; setTimeout(() => { b.textContent = 'Empty the plan'; }, 5000); return; }
    clearArmed = 0; b.textContent = 'Empty the plan'; review = {}; ls.set(K.review, '{}'); HUB.plan.clear();
  });
  const demoBox = $('[data-demo]');
  if (demoBox) { demoBox.checked = demo; demoBox.addEventListener('change', () => { demo = demoBox.checked; ls.set(K.demo, demo ? '1' : '0'); render(); }); }

  // ------------------------------------------------------------------ the reviewer's key (IndexedDB, non-extractable)
  const idb = {
    open: () => new Promise((res, rej) => { const r = indexedDB.open('hub-plan', 1); r.onupgradeneeded = () => r.result.createObjectStore('keys'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }),
    async run(mode_, fn) { const db = await idb.open(); return new Promise((res, rej) => { const t = db.transaction('keys', mode_); const q = fn(t.objectStore('keys')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); },
    get: k => idb.run('readonly', s => s.get(k)),
    put: (k, v) => idb.run('readwrite', s => s.put(v, k)),
    del: k => idb.run('readwrite', s => s.delete(k)),
  };
  const enc = s => new TextEncoder().encode(s);
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(s).length / 4) * 4, '=')), c => c.charCodeAt(0));
  const fingerprint = async jwk => hex(await crypto.subtle.digest('SHA-256', enc(P.keyId(jwk))));
  const fpShort = fp => String(fp || '').slice(0, 32).replace(/(.{4})(?=.)/g, '$1 ');
  async function loadKey() {
    try { key = (await idb.get('reviewer')) || null; } catch { key = null; keyNote = 'This browser does not keep keys (private window or storage off): a key made now lasts for this tab only.'; }
  }
  async function makeKey() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
    const full = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const publicKeyJwk = { kty: full.kty, crv: full.crv, x: full.x, y: full.y };
    key = { privateKey: pair.privateKey, publicKeyJwk, fingerprint: await fingerprint(publicKeyJwk), created: new Date().toISOString() };
    try { await idb.put('reviewer', key); } catch { keyNote = 'This browser does not keep keys: this one lasts for this tab only.'; }
  }
  const nameBox = $('[data-reviewer-name]');
  if (nameBox) { nameBox.value = ls.get(K.name) || ''; nameBox.addEventListener('input', () => { ls.set(K.name, nameBox.value.trim()); renderSign(); }); }

  // ------------------------------------------------------------------ sign and export
  const approvedItems = () => items.filter(i => decision(i.id) === 'approved' && P.checkItem(i).ok);
  const approvedKey = () => JSON.stringify(approvedItems().map(i => [i.id, i.calls]));
  let signedFor = ls.get('hub-plan-signed-for');
  function renderKey() {
    const box = $('[data-key-state]'); if (!box) return;
    if (!key) {
      box.innerHTML = `<p>No reviewer key in this browser yet.</p>${keyNote ? `<p class="pl-small">${esc(keyNote)}</p>` : ''}<p><button type="button" class="btn btn-sm" data-make-key${canReview() ? '' : ' disabled'}>Make my reviewer key</button></p>${canReview() ? '' : '<p class="pl-small">For the Algarve Evolution team, or turn on the demo in the queue.</p>'}`;
      return;
    }
    const entry = { name: nameBox?.value.trim() || '<the reviewer\'s name>', fingerprint: key.fingerprint, publicKeyJwk: key.publicKeyJwk, added: day(new Date().toISOString()), added_by: '<who added it>' };
    box.innerHTML = `<dl class="pl-keydl"><div><dt>Fingerprint (SHA-256)</dt><dd><code class="pl-fp" title="${esc(key.fingerprint)}">${esc(fpShort(key.fingerprint))}</code></dd></div><div><dt>Made</dt><dd>${esc(when(key.created))}, in this browser</dd></div><div><dt>Private half</dt><dd>Cannot be exported; stays in this browser</dd></div></dl>
      ${keyNote ? `<p class="pl-small">${esc(keyNote)}</p>` : ''}
      <details class="pl-entry"><summary>The entry for <code>reviewers.json</code></summary><p class="pl-small">The public key only. A person adds it to <code>scripts/odoo/reviewers.json</code> in a reviewed commit; then the broker accepts plans this key signs.</p><pre tabindex="0"><code>${esc(JSON.stringify(entry, null, 2))}</code></pre></details>
      <p><button type="button" class="btn btn-sm pl-btn-quiet" data-forget-key>Forget this key</button></p>`;
  }
  function renderSign() {
    renderKey();
    const box = $('[data-sign-state]'); if (!box) return;
    const ap = approvedItems(), name = nameBox?.value.trim();
    const stale = signed && signedFor !== approvedKey();
    let h = '';
    if (!ap.length) h += '<p>Approve at least one item in the queue first.</p>';
    else {
      h += `<p><b>${plural(ap.length, 'approved item')}</b> ready to sign${items.length - ap.length ? `; ${plural(items.length - ap.length, 'other')} stay${items.length - ap.length === 1 ? 's' : ''} out of the plan` : ''}.</p>`;
      if (!canReview()) h += '<p class="pl-small">Signing is for the Algarve Evolution team. Turn on the demo in the queue to try it.</p>';
      else if (!name) h += '<p class="pl-small">Write your name on the left first: it goes in the plan with your key.</p>';
      if (!signed || stale) h += `<p><button type="button" class="btn btn-accent" data-sign${!canReview() || !name ? ' disabled' : ''}>${key ? '' : 'Make a key and '}${key ? 'Sign' : 'sign'} ${plural(ap.length, 'approved item')}${mode() === 'demo' ? ' (demo)' : ''}</button></p>`;
    }
    if (signed) {
      h += `<div class="pl-signed${stale ? ' is-stale' : ''}"><p class="pl-signed-h">${stale ? 'Signed before your last change: sign again' : 'Signed'}${signed.mode === 'demo' ? ' <span class="tag">Demo</span>' : ''}</p>
        <p>${esc(signed.reviewer?.name)} · ${esc(when(signed.created))} · ${plural(signed.items.length, 'item')} · key <code>${esc(fpShort(signed.reviewer?.fingerprint).slice(0, 19))}</code></p>
        <p class="pl-signed-actions"><button type="button" class="btn btn-sm btn-primary" data-download>Download plan.json</button></p>
        <details class="pl-entry"><summary>See the signed plan</summary><pre tabindex="0"><code>${esc(JSON.stringify(signed, null, 2))}</code></pre></details>
        <p class="pl-small">Then, in a terminal: <code>node scripts/odoo/apply-plan.mjs plan.json</code> shows what the broker would do; <code>--apply</code> does it.</p></div>`;
    }
    box.innerHTML = h;
  }
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-make-key], [data-forget-key], [data-sign], [data-download]'); if (!t || t.disabled) return;
    if (t.matches('[data-make-key]')) { t.disabled = true; await makeKey(); renderSign(); $('[data-forget-key]')?.focus(); }
    if (t.matches('[data-forget-key]')) { try { await idb.del('reviewer'); } catch { /* ignore */ } key = null; renderSign(); $('[data-make-key]')?.focus(); }
    if (t.matches('[data-sign]')) { t.disabled = true; try { await signPlan(); } catch (err) { console.warn(err); t.disabled = false; } renderSign(); $('[data-download]')?.focus(); }
    if (t.matches('[data-download]') && signed) download(signed);
  });
  async function signPlan() {
    if (!key) await makeKey();
    const plan = {
      v: 1, created: new Date().toISOString(), mode: mode(), hub: `${location.origin}/plan/`,
      reviewer: { name: nameBox.value.trim(), publicKeyJwk: key.publicKeyJwk, fingerprint: key.fingerprint },
      items: approvedItems().map(i => ({ ...i, review: { decision: 'approved', at: review[i.id].at } })),
      rejected: items.filter(i => decision(i.id) === 'rejected').map(i => i.id),
    };
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, enc(P.signedPart(plan)));
    plan.signature = b64u(sig);
    signed = plan; signedFor = approvedKey();
    ls.set(K.signed, JSON.stringify(plan)); ls.set('hub-plan-signed-for', signedFor);
  }
  function download(plan) {
    const blob = new Blob([`${JSON.stringify(plan, null, 2)}\n`], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `plan-${plan.created.slice(0, 10)}-${String(plan.reviewer?.fingerprint).slice(0, 8)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ------------------------------------------------------------------ verify a signed plan
  const vout = $('[data-verify-out]');
  async function verify(text, name) {
    const row = (ok, label, note) => `<li class="${ok ? 'is-ok' : 'is-bad'}"><span class="pl-ck" aria-hidden="true">${ok ? '✓' : '✕'}</span><span><span class="visually-hidden">${ok ? 'Yes: ' : 'No: '}</span><b>${esc(label)}</b>${note ? `: ${note}` : ''}</span></li>`;
    let plan;
    try { plan = JSON.parse(text); } catch { vout.innerHTML = `<div class="pl-vres is-bad"><p class="pl-vres-h">Not a plan</p><p>${esc(name)} is not JSON.</p></div>`; return; }
    if (plan?.v !== 1 || !plan.reviewer?.publicKeyJwk || !plan.signature || !Array.isArray(plan.items)) { vout.innerHTML = `<div class="pl-vres is-bad"><p class="pl-vres-h">Not a signed plan</p><p>${esc(name)} lacks the version, the reviewer's key, the items or the signature.</p></div>`; return; }
    const jwk = plan.reviewer.publicKeyJwk;
    let fp = '', sigOk = false, err = '';
    try {
      fp = await fingerprint(jwk);
      const pub = await crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      sigOk = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, unb64u(plan.signature), enc(P.signedPart(plan)));
    } catch (e2) { err = e2.message || String(e2); }
    const fpOk = fp && fp === plan.reviewer.fingerprint;
    const listed = (C.reviewers || []).some(r => r.fingerprint === fp);
    const mine = key && key.fingerprint === fp;
    const res = plan.items.map(i => ({ i, c: P.checkItem(i) }));
    const allOk = sigOk && fpOk && res.every(r => r.c.ok);
    vout.innerHTML = `<div class="pl-vres ${allOk ? 'is-ok' : 'is-bad'}"><p class="pl-vres-h">${sigOk && fpOk ? 'The signature is valid' : 'The signature does not match'}</p>
      <ul class="pl-checks">
        ${row(sigOk, 'Signature', sigOk ? 'made by this key over exactly these items' : `the plan changed after signing, or another key signed it${err ? ` (${esc(err)})` : ''}`)}
        ${row(fpOk, 'Fingerprint', `<code>${esc(fpShort(fp))}</code>${fpOk ? '' : ' is not the one the plan claims'}`)}
        ${row(listed, 'On the broker\'s list', listed ? 'scripts/odoo/reviewers.json had this key when the site was built' : 'not in scripts/odoo/reviewers.json when the site was built: the broker refuses it until a person adds the key')}
        ${row(plan.mode !== 'demo', 'Made for review', plan.mode === 'demo' ? 'signed in demo mode: the broker refuses demo plans' : 'signed as the Algarve Evolution team')}
        ${row(res.every(r => r.c.ok), 'Policy', `${plural(res.filter(r => r.c.ok).length, 'item')} of ${res.length} pass the broker's policy`)}
      </ul>
      <p>Signed by <b>${esc(plan.reviewer.name)}</b> on ${esc(when(plan.created))}${mine ? ', with the key in this browser' : ''}. ${plural(plan.items.length, 'item')}:</p>
      <ol class="pl-vitems">${res.map(r => `<li>${esc(r.i.title)} <span class="pl-muted">(${esc(sourceLabel(r.i.source))}, ${plural(r.i.calls?.length || 0, 'call')})</span>${r.c.ok ? '' : ' <span class="tag tag-warn">policy issue</span>'}</li>`).join('')}</ol></div>`;
  }
  const fileIn = $('[data-verify-file]'), drop = $('[data-drop]');
  const readFile = f => { if (!f) return; if (f.size > 2e6) { vout.innerHTML = '<div class="pl-vres is-bad"><p class="pl-vres-h">Too large</p><p>A plan is a small JSON file.</p></div>'; return; } f.text().then(t => verify(t, f.name)); };
  fileIn?.addEventListener('change', () => readFile(fileIn.files[0]));
  drop?.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('is-over'); });
  drop?.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop?.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('is-over'); readFile(e.dataTransfer.files[0]); });

  // ------------------------------------------------------------------ start
  if (!ls.get(K.seeded)) { (C.seeds || []).forEach(s => HUB.plan.add(s)); ls.set(K.seeded, '1'); }
  HUB.publicFeed().then(f => { indexFeed(f, false); render(); }).catch(() => {});
  HUB.on('private', f => { indexFeed(f, true); render(); });
  loadKey().then(() => { HUB.on('persona', () => render()); HUB.plan.on(() => render()); });
})();
