// The hub in the browser: the persona you try it as, and the staff view that unlocks the private feed.
// Odoo is the source of truth; the public feed is served with the site, the private feed only encrypted.
// window.HUB = { persona, publicFeed(), privateFeed, on(event, fn), plan }. Events: 'persona', 'private'.
// HUB.plan (docs/v2/PLAN.md): the changes proposed to Odoo, kept in this browser, reviewed and signed on /plan/.
// Every <details class="odoo-call"> gets an "Add to plan" button, so pages need no changes.
(() => {
  const personas = JSON.parse(document.getElementById('hub-personas')?.textContent || '[]');
  const store = { get: (s, k) => { try { return s.getItem(k); } catch { return null; } }, set: (s, k, v) => { try { s.setItem(k, v); } catch {} } };
  const listeners = {};
  const HUB = window.HUB = {
    persona: 'visitor', privateFeed: null, _public: null,
    on(ev, fn) { (listeners[ev] ||= []).push(fn); if (ev === 'persona') fn(HUB.persona); if (ev === 'private' && HUB.privateFeed) fn(HUB.privateFeed); },
    emit(ev, v) { (listeners[ev] || []).forEach(fn => { try { fn(v); } catch (e) { console.warn(e); } }); },
    async publicFeed() { return HUB._public ||= fetch('/feeds/public.json').then(r => r.json()); },
  };
  const sel = document.querySelector('[data-persona-select]'), hint = document.querySelector('[data-persona-hint]'), state = document.querySelector('[data-feed-state]');
  function apply(id) {
    HUB.persona = id; document.body.dataset.persona = id;
    const p = personas.find(x => x.id === id); if (hint && p) hint.textContent = p.hint;
    if (sel) sel.value = id;
    // data-for="founder mentor": highlighted for those personas. data-only="staff": shown only to them.
    document.querySelectorAll('[data-for]').forEach(el => el.classList.toggle('for-me', el.dataset.for.split(/\s+/).includes(id)));
    document.querySelectorAll('[data-only]').forEach(el => { el.hidden = !el.dataset.only.split(/\s+/).includes(id); });
    store.set(localStorage, 'hub-persona', id); HUB.emit('persona', id);
    if (id === 'staff' && !HUB.privateFeed) askKey();
  }
  // The staff view: the access key is asked for here, used in this tab only, and never sent anywhere.
  const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function open(accessKey) {
    const enc = await fetch('/feeds/private.enc.json').then(r => r.json());
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(accessKey), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b(enc.kdf.salt), iterations: enc.kdf.iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(enc.iv) }, key, b(enc.ciphertext));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  let dlg;
  function askKey() {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'key-dialog';
      dlg.innerHTML = `<form method="dialog"><h2>Algarve Evolution team</h2><p>Not everything in Odoo is public. Enter the access key to open the private feed in this tab: sessions' notes, contact details, participants and jury scores. The key stays in this browser tab; nothing is sent.</p><label>Access key <input name="k" type="password" autocomplete="off" required></label><p class="key-msg" role="alert"></p><menu><button value="cancel" formnovalidate>Stay public</button> <button value="ok" class="primary">Open the private feed</button></menu></form>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('close', async () => {
        if (dlg.returnValue !== 'ok') return;
        const k = dlg.querySelector('[name=k]').value; dlg.querySelector('[name=k]').value = '';
        try { await unlock(k); } catch { dlg.querySelector('.key-msg').textContent = 'That key does not open the private feed.'; dlg.showModal(); }
      });
    }
    dlg.querySelector('.key-msg').textContent = ''; dlg.showModal();
  }
  async function unlock(k) {
    HUB.privateFeed = await open(k); store.set(sessionStorage, 'hub-key', k);
    if (state) { state.textContent = 'Private feed open in this tab (Odoo, all records)'; state.classList.add('is-private'); }
    document.body.classList.add('has-private'); HUB.emit('private', HUB.privateFeed);
  }

  // ------------------------------------------------------------------ the plan (docs/v2/PLAN.md)
  // HUB.plan.add({ source, title, calls: [{ method, path, body }], policy?, refs?, simulated?, snapshot? }) -> id.
  // Kept in localStorage ("hub-plan"), in this browser only; reviewed, approved and signed on /plan/.
  const PLAN_KEY = 'hub-plan', planFns = [];
  const readPlan = () => { try { const v = JSON.parse(store.get(localStorage, PLAN_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  let planItems = readPlan(), snapshot = null;
  const pageId = () => location.pathname.replace(/^\/+|\/+$/g, '') || 'home';
  const normCall = c => ({ method: String(c?.method || 'POST').toUpperCase(), path: String(c?.path || ''), body: c?.body === undefined ? null : c.body, ...(c?.raw ? { raw: String(c.raw).slice(0, 4000) } : {}), ...(c?.why ? { why: String(c.why) } : {}) });
  const callsKey = calls => JSON.stringify(calls.map(c => [c.method, c.path, c.body ?? c.raw ?? null]));
  const copy = v => JSON.parse(JSON.stringify(v));
  function planChanged() {
    planBadge(); planRefresh();
    planFns.forEach(fn => { try { fn(copy(planItems)); } catch (e) { console.warn(e); } });
  }
  const savePlan = () => { store.set(localStorage, PLAN_KEY, JSON.stringify(planItems)); planChanged(); };
  function noteSnapshot() {
    if (snapshot) return;
    HUB.publicFeed().then(f => { snapshot = { feed: 'public', exported: f?.meta?.exported || null }; }).catch(() => {});
  }
  HUB.plan = {
    add(item) {
      if (!item || !Array.isArray(item.calls) || !item.calls.length) throw new Error('HUB.plan.add: an item needs at least one call');
      const calls = item.calls.map(normCall), source = String(item.source || pageId()), key = callsKey(calls);
      const same = planItems.find(x => x.source === source && callsKey(x.calls) === key);
      if (same) return same.id;
      const it = { id: `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, source, title: String(item.title || `${calls[0].method} ${calls[0].path}`), calls, added: new Date().toISOString(), page: location.pathname };
      if (item.policy) it.policy = copy(item.policy);
      if (Array.isArray(item.refs)) it.refs = item.refs.map(String);
      if (item.simulated) it.simulated = true;
      if (item.snapshot || snapshot) it.snapshot = copy(item.snapshot || snapshot);
      planItems.push(it); savePlan(); return it.id;
    },
    list: () => copy(planItems),
    get: id => { const x = planItems.find(i => i.id === id); return x ? copy(x) : null; },
    find(calls, source) { const key = callsKey(calls.map(normCall)); const x = planItems.find(i => callsKey(i.calls) === key && (!source || i.source === source)); return x ? x.id : null; },
    remove(id) { const n = planItems.length; planItems = planItems.filter(i => i.id !== id); if (planItems.length !== n) savePlan(); },
    clear() { planItems = []; savePlan(); },
    on(fn) { planFns.push(fn); try { fn(copy(planItems)); } catch (e) { console.warn(e); } },
  };
  addEventListener('storage', e => { if (e.key === PLAN_KEY) { planItems = readPlan(); planChanged(); } });

  // The count in the header, next to the feed state.
  let badge;
  function planBadge() {
    if (!badge && state) {
      badge = document.createElement('a'); badge.className = 'plan-badge'; badge.href = '/plan/';
      badge.innerHTML = 'Plan <b data-plan-n>0</b>';
      state.after(badge);
    }
    if (!badge) return;
    const n = planItems.length;
    badge.querySelector('[data-plan-n]').textContent = String(n);
    badge.setAttribute('aria-label', `Plan: ${n} proposed ${n === 1 ? 'change' : 'changes'} to Odoo, kept in this browser`);
    badge.hidden = n === 0 && location.pathname !== '/plan/';
    if (location.pathname === '/plan/') badge.setAttribute('aria-current', 'page');
  }

  // "Add to plan" on every Odoo call panel. A panel that sits with others in one container is one action of
  // several calls (find, then create, then rank): the button adds them together, as one item.
  function readPanel(d) {
    const verb = (d.querySelector('.odoo-call-verb')?.textContent || 'POST').trim().toUpperCase();
    const pre = d.querySelector('pre'), text = pre ? pre.textContent : '';
    let path = (d.querySelector('summary code')?.textContent || '').trim();
    if (!/^\/json\/2\//.test(path)) { const m = text.match(/\/json\/2\/[a-z0-9_.]+\/[a-z0-9_]+/i); path = m ? m[0] : `/json/2/${path.replace(/^\/+/, '')}`; }
    let body = null; const i = text.search(/^[[{]/m);
    if (i >= 0) { try { body = JSON.parse(text.slice(i)); } catch { body = null; } }
    const why = (d.querySelector('.cc-call-step, .od-why')?.textContent || '').trim().replace(/^\d+\.\s*/, '');
    return { method: verb, path, body, ...(body ? {} : { raw: text }), ...(why ? { why } : {}) };
  }
  const groupOf = d => (d.parentElement ? [...d.parentElement.children].filter(x => x.matches('details.odoo-call') && x.dataset.plan !== 'off') : [d]);
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  function titleOf(panels, calls) {
    const box = panels[0].parentElement;
    let head = clean(box?.querySelector(':scope > .cc-calls-what, :scope > .vb-call-title')?.firstChild?.textContent)
      || clean(box?.getAttribute('aria-label')).replace(/^Odoo calls?:\s*/i, '');
    for (let el = box; !head && el && el !== document.body; el = el.parentElement) {
      const h = el.querySelector('h4, h3, h2, legend');
      if (h && !h.closest('details.odoo-call')) { const c = h.cloneNode(true); c.querySelectorAll('.sim-badge, .tag, .odoo-chip, .visually-hidden').forEach(x => x.remove()); head = clean(c.textContent); }
    }
    const what = calls.map(c => { const m = c.path.match(/\/json\/2\/([^/]+)\/([^/]+)/); return m ? `${m[2]} ${m[1]}` : c.path; });
    const desc = what.length > 2 ? `${what[0]}, then ${what.length - 1} more` : what.join(', then ');
    return head ? `${head}: ${desc}` : desc;
  }
  function planButtonState(d) {
    const panels = groupOf(d), calls = panels.map(readPanel), id = HUB.plan.find(calls, pageId());
    const btn = d.querySelector(':scope > .plan-add .plan-add-btn'), msg = d.querySelector(':scope > .plan-add .plan-add-msg');
    if (!btn) return;
    const label = id ? 'Added to plan' : panels.length > 1 ? `Add these ${panels.length} calls to plan` : 'Add to plan';
    if (btn.textContent !== label) btn.textContent = label;
    if (btn.getAttribute('aria-pressed') !== String(!!id)) btn.setAttribute('aria-pressed', String(!!id));
    const n = planItems.length;
    const html = id ? `In your plan${n > 1 ? ` with ${n - 1} other change${n - 1 === 1 ? '' : 's'}` : ''}, waiting for review. <a href="/plan/#queue">Review the plan</a>` : 'Nothing is sent: the Algarve Evolution team reviews and signs the plan first.';
    if (msg.innerHTML !== html) msg.innerHTML = html;
  }
  function enhance(d) {
    if (d.dataset.plan) return; d.dataset.plan = 'on';
    const bar = document.createElement('div'); bar.className = 'plan-add';
    bar.innerHTML = '<button type="button" class="plan-add-btn" aria-pressed="false">Add to plan</button> <span class="plan-add-msg"></span>';
    (d.querySelector(':scope > summary') || d.firstChild)?.after(bar);
    // Keep the focus where it is on mouse down: a form field losing focus fires "change", many pages then redraw
    // the panel, and the click would land on a button that is gone.
    bar.querySelector('button').addEventListener('mousedown', e => e.preventDefault());
    bar.querySelector('button').addEventListener('click', () => {
      const panels = groupOf(d), calls = panels.map(readPanel), id = HUB.plan.find(calls, pageId());
      if (id) { HUB.plan.remove(id); return; }
      HUB.plan.add({ source: pageId(), title: titleOf(panels, calls), calls });
    });
    planButtonState(d); noteSnapshot();
  }
  function planRefresh() { document.querySelectorAll('details.odoo-call[data-plan="on"]').forEach(planButtonState); }
  let queued = false;
  const scan = () => { queued = false; document.querySelectorAll('details.odoo-call:not([data-plan])').forEach(enhance); };
  new MutationObserver(muts => {
    if (queued) return;
    if (muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('details.odoo-call:not([data-plan])') || n.querySelector?.('details.odoo-call:not([data-plan])'))))) { queued = true; requestAnimationFrame(scan); }
  }).observe(document.body, { childList: true, subtree: true });
  // A panel's text can change in place (a form re-renders it as you type): keep its button honest.
  document.addEventListener('input', () => requestAnimationFrame(planRefresh), true);
  document.addEventListener('change', () => requestAnimationFrame(planRefresh), true);

  // Styles for the button and the count (kept here so pages need nothing).
  const css = document.createElement('style');
  css.textContent = `.plan-add{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 14px;border-top:1px solid var(--hub-odoo-line,#e3d2de);background:#fff;font:13px/1.45 var(--sans,system-ui,sans-serif)}
.plan-add-btn{display:inline-flex;align-items:center;gap:.4rem;min-height:36px;padding:6px 12px;font:700 13px/1.2 var(--sans,system-ui,sans-serif);color:var(--hub-odoo,#714b67);background:#fff;border:1px solid var(--hub-odoo,#714b67);border-radius:0;cursor:pointer}
.plan-add-btn::before{content:"+";font-size:15px;line-height:1}
.plan-add-btn:hover{background:var(--hub-odoo-soft,#f6eff4)}
.plan-add-btn[aria-pressed="true"]{background:var(--hub-odoo,#714b67);color:#fff}
.plan-add-btn[aria-pressed="true"]::before{content:"\\2713"}
.plan-add-btn:focus-visible{outline:3px solid var(--hub-accent,#e8492b);outline-offset:2px}
.plan-add-msg{flex:1 1 14rem;min-width:0;color:var(--hub-muted,#4a5468);font-size:12.5px}
.plan-add-msg a{font-weight:700;color:var(--hub-odoo,#714b67)}
.plan-badge{display:inline-flex;align-items:center;gap:.45rem;min-height:28px;padding:.15rem .3rem .15rem .6rem;font:700 12px/1.2 var(--sans,system-ui,sans-serif);color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.45)}
.plan-badge:hover{color:#fff;background:rgba(255,255,255,.1)}
.plan-badge b{min-width:1.6em;padding:.15rem .35rem;text-align:center;background:var(--hub-accent-ink,#b8361b);color:#fff;font-variant-numeric:tabular-nums}
.plan-badge[aria-current="page"]{border-color:#fff}
.plan-badge:focus-visible{outline:3px solid var(--hub-gold,#ffd58a);outline-offset:2px}
.plan-badge[hidden]{display:none}`;
  document.head.appendChild(css);
  planBadge(); scan();

  sel?.addEventListener('change', () => apply(sel.value));
  const saved = store.get(localStorage, 'hub-persona'); const k = store.get(sessionStorage, 'hub-key');
  apply(personas.some(p => p.id === saved) && saved !== 'staff' ? saved : 'visitor');
  if (saved === 'staff' && k) unlock(k).then(() => apply('staff')).catch(() => apply('visitor'));
})();
