// INC/ACC in the browser: chart controls and tooltips, the sessions calendar, and the persona workspaces
// (founder, mentor, Algarve Evolution team). Nothing here writes to Odoo: records are kept in this browser only
// and each form shows the Odoo 19 JSON-2 call it would make. Owner: sites-dev@AgentiCCells.dinis. Apache-2.0.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const DATA = JSON.parse($('#incacc-data')?.textContent || '{}');
  const HUB = window.HUB || { on() {}, persona: 'visitor' };
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = n => Number(n ?? 0).toLocaleString('en-GB');
  const money = n => `€${Number(n ?? 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  const plain = s => String(s || '').replace(/\s*\(simulated\)\s*$/i, '');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const D = iso => new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  const iso = d => d.toISOString().slice(0, 10);
  const addMonths = (s, m) => { const d = D(s); d.setUTCMonth(d.getUTCMonth() + m); return d; };
  const addDays = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return d; };
  const shortDate = s => { const d = D(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const change = (a, b) => { if (a === b) return 'no change'; if (!a) return b > 0 ? 'from zero' : 'no change'; const p = Math.round(((b - a) / a) * 100); return `${p > 0 ? '+' : ''}${p}%`; };
  const P = v => `${Math.round(v * 100) / 100}%`;
  const simB = r => (r?.simulated ? '<span class="sim-badge" title="Invented for the prototype">Simulated</span>' : '');
  const localB = '<span class="local-note" title="Kept in this browser only; not in Odoo">This browser only</span>';
  const KPIS = [
    { k: 'revenue_eur', label: 'Monthly revenue', money: true },
    { k: 'customers', label: 'Customers' },
    { k: 'team_size', label: 'People in the team' },
    { k: 'funding_eur', label: 'Funding raised to date', money: true },
  ];
  const PSTAGES = ['idea', 'prototype', 'mvp', 'launched', 'scaling'];
  const PSTAGE_LABEL = { idea: 'Idea', prototype: 'Prototype', mvp: 'MVP', launched: 'Launched', scaling: 'Scaling' };
  const KIND_LABEL = { one_to_one: 'One-to-one', clinic: 'Clinic', workshop: 'Workshop' };
  const fmt = (def, v) => (def.money ? money(v) : num(v));
  const progName = p => (p?.kind === 'acceleration' ? 'Acceleration' : 'Incubation');
  const kindCls = p => (p?.kind === 'acceleration' ? 'ia-acc' : 'ia-inc');

  // ------------------------------------------------------------------ this browser's records (never sent)
  const KEY = 'incacc-local-v1';
  const local = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  for (const k of ['kpis', 'sessions', 'reflections', 'publish']) local[k] ||= [];
  const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(local)); return true; } catch { return false; } };
  const pref = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  // ------------------------------------------------------------------ data access
  const pub = DATA;
  const byId = (list, id) => list.find(r => r.id === id);
  const prog = id => byId(pub.programmes, id);
  const mentorOf = cid => pub.mentors.find(m => (m.company_ids || []).includes(cid));
  const kpisOf = cid => {
    const rows = pub.kpis.filter(k => k.company_id === cid).map(k => ({ ...k }));
    for (const l of local.kpis.filter(k => k.company_id === cid)) { const i = rows.findIndex(r => r.month === l.month); if (i >= 0) rows[i] = { ...rows[i], ...l, local: true }; else rows.push({ ...l, local: true }); }
    return rows.sort((a, b) => a.month - b.month);
  };
  const sessionsOf = pred => [...pub.sessions.filter(pred), ...local.sessions.filter(pred).map(s => ({ ...s, local: true }))].sort((a, b) => b.date.localeCompare(a.date));
  const progNow = p => {
    const s = D(p.start), e = addMonths(p.start, p.months || 6), n = D(pub.now);
    if (n < s) return { frac: 0, state: 'planned', label: `Starts ${shortDate(p.start)}` };
    if (n >= e || p.status === 'finished') return { frac: 6, state: 'finished', label: 'Finished: month 6 of 6' };
    const f = ((n - s) / (e - s)) * (p.months || 6);
    return { frac: f, state: 'running', label: `In month ${Math.floor(f) + 1} of ${p.months || 6}` };
  };

  // ------------------------------------------------------------------ the Odoo call panel
  const callPanel = (model, method, body, note) => `<details class="odoo-call" open>
    <summary><span class="odoo-call-verb">POST</span> <code>/json/2/${esc(model)}/${esc(method)}</code> <span class="odoo-call-flag">Not sent: prototype</span></summary>
    <pre tabindex="0"><code>POST /json/2/${esc(model)}/${esc(method)}
Authorization: bearer &lt;API key of the signed-in user&gt;
X-Odoo-Database: ${esc(pub.db || '<database>')}
Content-Type: application/json

${esc(JSON.stringify(body, null, 2))}</code></pre>
    ${note ? `<p class="odoo-call-note">${note}</p>` : ''}</details>`;

  const spark = (pts, cls) => {
    if (!pts.length) return '';
    const vs = pts.map(p => p.v); const max = Math.max(...vs), min = Math.min(0, ...vs), r = max - min || 1;
    const x = m => 4 + (m / 6) * 92, y = v => 86 - ((v - min) / r) * 72;
    const segs = pts.slice(1).map((p, i) => `<line x1="${P(x(pts[i].m))}" y1="${P(y(pts[i].v))}" x2="${P(x(p.m))}" y2="${P(y(p.v))}"/>`).join('');
    const e = pts.at(-1);
    return `<svg class="ia-spark ${cls}" aria-hidden="true" focusable="false"><line class="ia-spark-base" x1="4%" x2="96%" y1="86%" y2="86%"/><g class="ia-spark-line">${segs}</g><circle class="ia-spark-start" cx="${P(x(pts[0].m))}" cy="${P(y(pts[0].v))}" r="3.5"/><circle class="ia-spark-end${e.local ? ' is-local' : ''}" cx="${P(x(e.m))}" cy="${P(y(e.v))}" r="4.5"/></svg>`;
  };

  const sessionItem = (s, opts = {}) => {
    const p = prog(s.programme_id); const c = byId(pub.companies, s.company_id) || (opts.companies && byId(opts.companies, s.company_id));
    const m = byId(pub.mentors, s.mentor_id) || (opts.mentors && byId(opts.mentors, s.mentor_id));
    return `<li class="${kindCls(p)}"><time datetime="${esc(s.date)}">${esc(shortDate(s.date))}</time><span class="ia-kind ia-kind-${esc(s.kind)}">${esc(KIND_LABEL[s.kind] || s.kind)}</span>
      <span class="ia-ses-topic">${esc(s.topic)} ${s.local ? localB : simB(s)}</span>
      <span class="ia-ses-who">${c ? esc(plain(c.name)) : `${esc(progName(p))} cohort`}${opts.showMentor !== false ? ` · ${m ? esc(plain(m.name)) : 'guest mentor (not public)'}` : ''}</span>
      ${opts.notes && s.notes ? `<span class="ia-ses-note">${esc(s.notes)}</span>` : ''}</li>`;
  };

  const markMine = (sel) => { $$('.ia-mine').forEach(el => el.classList.remove('ia-mine')); if (sel) $$(sel).forEach(el => el.classList.add('ia-mine')); };

  // ------------------------------------------------------------------ founder
  const wsF = $('#ws-founder');
  function founder() {
    if (!wsF) return;
    const cos = pub.companies;
    let cid = pref.get('incacc-founder'); if (!byId(cos, cid)) cid = (cos.find(c => prog(c.programme_id)?.status === 'running') || cos[0])?.id;
    const c = byId(cos, cid); const p = prog(c.programme_id); const n = progNow(p); const m = mentorOf(c.id);
    const ks = kpisOf(c.id); const last = ks.at(-1); const first = ks[0];
    const mine = sessionsOf(s => s.company_id === c.id || (!s.company_id && s.programme_id === p.id));
    // Next sessions: projected from the programme's rhythm (a one-to-one about every four weeks), not from Odoo.
    let next = '';
    if (n.state === 'running') {
      const end = iso(addMonths(p.start, p.months || 6));
      const lastOne = mine.find(s => s.kind === 'one_to_one');
      let d = lastOne ? iso(addDays(lastOne.date, 30)) : pub.now; const items = [];
      while (d < end && items.length < 3) { items.push(`<li><time datetime="${d}">${d < pub.now ? 'Due now' : `Around ${shortDate(d)}`}</time><span class="ia-kind ia-kind-one_to_one">One-to-one</span><span class="ia-ses-topic">With ${m ? esc(plain(m.name)) : 'your mentor'}</span></li>`); d = iso(addDays(d < pub.now ? pub.now : d, 30)); }
      const due = Math.min(6, (last?.month ?? -1) + 1); const dueDate = iso(addMonths(p.start, due));
      if ((last?.month ?? -1) < 6) items.push(`<li><time datetime="${dueDate}">${esc(shortDate(dueDate))}</time><span class="ia-kind ia-kind-kpi">KPIs</span><span class="ia-ses-topic">Month ${due} snapshot due</span></li>`);
      next = `<ol class="ia-ses-list">${items.join('')}</ol><p class="ia-note">Projected from the programme rhythm (a one-to-one about every four weeks); not in Odoo until the session is booked.</p>`;
    } else if (n.state === 'finished') next = `<p>The programme ended on ${esc(shortDate(p.end))}. Your month 6 results are in the <a href="#results-${p.kind === 'acceleration' ? 'acc' : 'inc'}">public results</a>.</p>`;
    else next = `<p>The programme starts on ${esc(shortDate(p.start))}.</p>`;
    const tiles = KPIS.map(def => `<li class="ia-mtile"><span class="ia-tile-label">${esc(def.label)}</span><span class="ia-mtile-val">${esc(fmt(def, last?.[def.k]))}</span><span class="ia-tile-from">M0 ${esc(fmt(def, first?.[def.k]))} → M${last?.month} · <b>${esc(change(first?.[def.k], last?.[def.k]))}</b>${last?.local ? ` ${localB}` : ''}</span>${spark(ks.map(k => ({ m: k.month, v: Number(k[def.k] || 0), local: k.local })), kindCls(p).replace('ia-', 'ia-s-'))}</li>`).join('')
      + `<li class="ia-mtile"><span class="ia-tile-label">Product stage</span><span class="ia-mtile-val">${esc(PSTAGE_LABEL[last?.product_stage] || '')}</span><span class="ia-tile-from">from ${esc(PSTAGE_LABEL[first?.product_stage] || '')} at month 0</span></li>`;
    const defMonth = Math.min(6, (last?.month ?? -1) + 1);
    wsF.innerHTML = `<div class="ia-ws-head"><div><p class="persona-panel-head">Founder workspace</p><h3>${esc(c.name)} ${simB(c)}</h3><p class="ia-ws-sub">${esc(progName(p))} · cohort ${esc(p.cohort)} · ${esc(n.label)} · ${esc(c.sector)}, ${esc(c.town)}</p></div>
      <label class="ia-pick">Pick your company <select id="ia-f-co">${pub.programmes.map(pp => `<optgroup label="${esc(progName(pp))}">${cos.filter(x => x.programme_id === pp.id).map(x => `<option value="${esc(x.id)}"${x.id === c.id ? ' selected' : ''}>${esc(plain(x.name))}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
    <div class="ia-ws-grid">
      <div class="ia-ws-col">
        <div class="ia-card"><h4>Your mentor</h4>${m ? `<p class="ia-card-big"><a href="#${esc(m.id)}">${esc(m.name)}</a> ${simB(m)}</p><p>${esc((m.expertise || []).join(', '))} · ${esc(m.town)}</p><p class="ia-note">${mine.filter(s => s.kind === 'one_to_one').length} one-to-ones with you in Odoo.</p>` : '<p>Your mentor has not agreed to be public yet.</p>'}</div>
        <div class="ia-card"><h4>Your next sessions</h4>${next}</div>
        <div class="ia-card"><h4>Your sessions so far <small>${mine.length}</small></h4><ol class="ia-ses-list ia-ses-compact">${mine.slice(0, 6).map(s => sessionItem(s)).join('')}</ol>${mine.length > 6 ? `<p class="ia-note">And ${mine.length - 6} earlier, in the <a href="#sessions">sessions calendar</a>.</p>` : ''}</div>
      </div>
      <div class="ia-ws-col">
        <div class="ia-card"><h4>Your KPIs, month 0 to month ${last?.month ?? 0}</h4><ul class="ia-mtiles">${tiles}</ul><p class="ia-note">Published in the <a href="#results">public results</a> once Algarve Evolution has reviewed them.</p></div>
        <form class="ia-card ia-form hub-form" id="ia-f-form" novalidate>
          <h4>Record this month's KPIs</h4>
          <p class="local-note">Kept in this browser only</p><p class="ia-note">The panel shows the call to Odoo's <code>aih.kpi</code> model that would store it.</p>
          <div class="ia-fields">
            <label class="field"><span>Month</span> <select name="month">${[0, 1, 2, 3, 4, 5, 6].map(i => `<option value="${i}"${i === defMonth ? ' selected' : ''}>Month ${i}${ks.some(k => k.month === i) ? ' (recorded)' : ''}</option>`).join('')}</select></label>
            <label class="field"><span>Revenue this month (€)</span> <input name="revenue_eur" type="number" min="0" step="10" inputmode="numeric" value="${last?.revenue_eur ?? 0}" required></label>
            <label class="field"><span>Customers</span> <input name="customers" type="number" min="0" step="1" inputmode="numeric" value="${last?.customers ?? 0}" required></label>
            <label class="field"><span>People in the team</span> <input name="team_size" type="number" min="0" step="1" inputmode="numeric" value="${last?.team_size ?? 1}" required></label>
            <label class="field"><span>Funding raised to date (€)</span> <input name="funding_eur" type="number" min="0" step="1000" inputmode="numeric" value="${last?.funding_eur ?? 0}" required></label>
            <label class="field"><span>Product stage</span> <select name="product_stage">${PSTAGES.map(s => `<option value="${s}"${s === last?.product_stage ? ' selected' : ''}>${PSTAGE_LABEL[s]}</option>`).join('')}</select></label>
          </div>
          <p class="ia-form-actions"><button type="submit" class="btn btn-primary">Record in this browser</button> <span class="ia-form-msg" role="status"></span></p>
          <div data-call></div>
          ${local.kpis.some(k => k.company_id === c.id) ? '<p><button type="button" class="ia-btn-link" data-clear-kpis>Forget the KPIs this browser recorded for this company</button></p>' : ''}
        </form>
      </div>
    </div>`;
    markMine(`[data-company="${c.id}"]`);
    $('#ia-f-co', wsF).addEventListener('change', e => { pref.set('incacc-founder', e.target.value); founder(); });
    const form = $('#ia-f-form', wsF);
    const vals = () => { const f = new FormData(form); return { month: Number(f.get('month')), revenue_eur: Number(f.get('revenue_eur')), customers: Number(f.get('customers')), team_size: Number(f.get('team_size')), funding_eur: Number(f.get('funding_eur')), product_stage: f.get('product_stage') }; };
    const showCall = () => {
      const v = vals(); const existing = pub.kpis.find(k => k.company_id === c.id && k.month === v.month);
      $('[data-call]', form).innerHTML = existing
        ? callPanel('aih.kpi', 'write', { ids: [existing.odoo?.id], vals: { revenue_eur: v.revenue_eur, customers: v.customers, team_size: v.team_size, funding_eur: v.funding_eur, product_stage: v.product_stage } }, `Month ${v.month} is already in Odoo (one snapshot per company per month), so this would update record ${esc(existing.odoo?.id)}.`)
        : callPanel('aih.kpi', 'create', { vals_list: [{ company_id: c.odoo?.id, month: v.month, ...Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'month')), is_published: false, simulated: true }] }, 'Created unpublished: Algarve Evolution reviews the numbers and publishes them, and the next export puts them in the public feed.');
    };
    form.addEventListener('input', showCall); form.addEventListener('change', showCall); showCall();
    form.addEventListener('submit', e => {
      e.preventDefault(); const v = vals(); const msg = $('.ia-form-msg', form);
      const bad = ['revenue_eur', 'customers', 'team_size', 'funding_eur'].find(k => !Number.isFinite(v[k]) || v[k] < 0);
      if (bad) { msg.textContent = 'Each number must be zero or more.'; form.elements[bad].focus(); return; }
      local.kpis = local.kpis.filter(k => !(k.company_id === c.id && k.month === v.month));
      local.kpis.push({ company_id: c.id, ...v, simulated: true });
      const ok = saveLocal(); founder();
      const m2 = $('.ia-form-msg', wsF); if (m2) m2.textContent = ok ? `Month ${v.month} recorded in this browser. Nothing was sent to Odoo.` : 'This browser does not allow storage; the record is kept until you leave the page.';
    });
    $('[data-clear-kpis]', wsF)?.addEventListener('click', () => { local.kpis = local.kpis.filter(k => k.company_id !== c.id); saveLocal(); founder(); });
  }

  // ------------------------------------------------------------------ mentor
  const wsM = $('#ws-mentor');
  function mentor() {
    if (!wsM) return;
    let mid = pref.get('incacc-mentor'); if (!byId(pub.mentors, mid)) mid = pub.mentors[0]?.id;
    const m = byId(pub.mentors, mid); if (!m) return;
    const cos = (m.company_ids || []).map(id => byId(pub.companies, id)).filter(Boolean);
    const mine = sessionsOf(s => s.mentor_id === m.id);
    const runningProgs = pub.programmes.filter(p => p.status !== 'finished');
    const coCards = cos.map(c => {
      const p = prog(c.programme_id); const ks = kpisOf(c.id); const a = ks[0], b = ks.at(-1);
      const lastS = mine.find(s => s.company_id === c.id);
      const days = lastS ? Math.round((D(pub.now) - D(lastS.date)) / 864e5) : null;
      return `<li class="ia-mco ${kindCls(p)}"><p class="ia-mco-name"><a href="#${esc(c.id)}">${esc(plain(c.name))}</a> ${simB(c)}</p><p class="ia-note">${esc(progName(p))} · ${esc(progNow(p).label)} · ${esc(c.sector)}</p>
        ${b ? `<p class="ia-mco-kpi">Revenue ${esc(money(a.revenue_eur))} → <strong>${esc(money(b.revenue_eur))}</strong> (M${b.month}) · customers ${esc(num(a.customers))} → <strong>${esc(num(b.customers))}</strong></p>` : ''}
        <p class="ia-mco-last">${lastS ? `Last session ${esc(shortDate(lastS.date))}: ${esc(lastS.topic)}${progNow(p).state === 'running' && days > 28 ? ` · <strong class="ia-due">${days} days ago: next one is due</strong>` : ''}` : 'No session yet'}</p></li>`;
    }).join('');
    const targetOpts = [
      ...cos.filter(c => prog(c.programme_id)?.status !== 'finished').map(c => `<option value="co:${esc(c.id)}">${esc(plain(c.name))} (one-to-one)</option>`),
      ...runningProgs.map(p => `<option value="prog:${esc(p.id)}">Whole ${esc(progName(p).toLowerCase())} cohort (clinic or workshop)</option>`),
    ].join('');
    wsM.innerHTML = `<div class="ia-ws-head"><div><p class="persona-panel-head">Mentor workspace</p><h3>${esc(m.name)} ${simB(m)}</h3><p class="ia-ws-sub">${m.kind === 'guest' ? 'Guest mentor' : 'One-to-one mentor'} · ${esc((m.expertise || []).join(', '))} · ${esc(m.town)}</p></div>
      <label class="ia-pick">Pick yourself <select id="ia-m-pick">${['one_to_one', 'guest'].map(k => `<optgroup label="${k === 'guest' ? 'Guest mentors' : 'One-to-one mentors'}">${pub.mentors.filter(x => x.kind === k).map(x => `<option value="${esc(x.id)}"${x.id === m.id ? ' selected' : ''}>${esc(plain(x.name))}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
    <div class="ia-ws-grid">
      <div class="ia-ws-col">
        ${cos.length ? `<div class="ia-card"><h4>Your companies <small>${cos.length}</small></h4><ul class="ia-mcos">${coCards}</ul></div>` : `<div class="ia-card"><h4>Your clinics and workshops</h4><p>Guest mentors work with a whole cohort rather than one company.</p></div>`}
        <div class="ia-card"><h4>Your sessions <small>${mine.length}</small></h4><ol class="ia-ses-list ia-ses-compact">${mine.slice(0, 8).map(s => sessionItem(s, { showMentor: false })).join('')}</ol>${mine.length > 8 ? `<p class="ia-note">And ${mine.length - 8} earlier, in the <a href="#sessions">sessions calendar</a>.</p>` : ''}</div>
      </div>
      <div class="ia-ws-col">
        <form class="ia-card ia-form hub-form" id="ia-m-form" novalidate>
          <h4>Log a session</h4>
          <p class="local-note">Kept in this browser only</p><p class="ia-note">The panel shows the call to Odoo's <code>aih.session</code> model that would store it. Notes stay private: the export never puts them in the public feed.</p>
          ${targetOpts ? `<div class="ia-fields">
            <label class="field"><span>With</span> <select name="target">${targetOpts}</select></label>
            <label class="field"><span>Kind</span> <select name="kind"><option value="one_to_one">One-to-one</option><option value="clinic">Clinic</option><option value="workshop">Workshop</option></select></label>
            <label class="field"><span>Date</span> <input name="date" type="date" value="${esc(pub.now)}" required></label>
            <label class="field ia-wide"><span>Topic</span> <input name="topic" type="text" maxlength="120" placeholder="For example: pricing for the second product" required></label>
            <label class="field ia-wide"><span>Private notes</span> <textarea name="notes" rows="3" maxlength="2000" placeholder="Actions agreed, what to check next time"></textarea></label>
          </div>
          <p class="ia-form-actions"><button type="submit" class="btn btn-primary">Log in this browser</button> <span class="ia-form-msg" role="status"></span></p>
          <div data-call></div>` : '<p>None of your programmes is running, so there is nothing to log today.</p>'}
          ${local.sessions.some(s => s.mentor_id === m.id) ? '<p><button type="button" class="ia-btn-link" data-clear-ses>Forget the sessions this browser logged for you</button></p>' : ''}
        </form>
      </div>
    </div>`;
    markMine(`[data-mentor="${m.id}"], ${cos.map(c => `[data-company="${c.id}"]`).join(', ') || '#none'}`);
    $('#ia-m-pick', wsM).addEventListener('change', e => { pref.set('incacc-mentor', e.target.value); mentor(); });
    $('[data-clear-ses]', wsM)?.addEventListener('click', () => { local.sessions = local.sessions.filter(s => s.mentor_id !== m.id); saveLocal(); mentor(); });
    const form = $('#ia-m-form', wsM); if (!form.elements.target) return;
    const vals = () => {
      const f = new FormData(form); const [t, id] = String(f.get('target')).split(':');
      const c = t === 'co' ? byId(pub.companies, id) : null; const p = c ? prog(c.programme_id) : prog(id);
      return { c, p, kind: f.get('kind'), date: f.get('date'), topic: String(f.get('topic') || '').trim(), notes: String(f.get('notes') || '').trim() };
    };
    let lastTarget = '';
    const showCall = () => {
      const v = vals(); const t = form.elements.target.value;
      if (t !== lastTarget) { form.elements.kind.value = v.c ? 'one_to_one' : (form.elements.kind.value === 'one_to_one' ? 'clinic' : form.elements.kind.value); lastTarget = t; }
      const kind = form.elements.kind.value;
      $('[data-call]', form).innerHTML = callPanel('aih.session', 'create', { vals_list: [{ programme_id: v.p?.odoo?.id, company_id: v.c ? v.c.odoo?.id : false, mentor_id: m.odoo?.id, kind, date: v.date, topic: v.topic || '…', notes: v.notes || false, is_published: true, simulated: true }] },
        `<code>mentor_id</code> is your contact (<code>res.partner</code> ${esc(m.odoo?.id)}); ${v.c ? `<code>company_id</code> is ${esc(plain(v.c.name))} in <code>aih.programme.company</code>` : 'no company: the session is open to the whole cohort'}.`);
    };
    form.addEventListener('input', showCall); form.addEventListener('change', showCall); showCall();
    form.addEventListener('submit', e => {
      e.preventDefault(); const v = vals(); const msg = $('.ia-form-msg', form);
      if (!v.topic) { msg.textContent = 'Add a topic first.'; form.elements.topic.focus(); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date || '')) { msg.textContent = 'Pick a date.'; form.elements.date.focus(); return; }
      local.sessions.push({ id: `local-${Date.now()}`, programme_id: v.p.id, company_id: v.c?.id || null, mentor_id: m.id, kind: form.elements.kind.value, date: v.date, topic: v.topic, notes: v.notes, simulated: true });
      const ok = saveLocal(); mentor();
      const m2 = $('.ia-form-msg', wsM); if (m2) m2.textContent = ok ? 'Session logged in this browser. Nothing was sent to Odoo.' : 'This browser does not allow storage; the session is kept until you leave the page.';
    });
  }

  // ------------------------------------------------------------------ Algarve Evolution team (private feed)
  const wsS = $('#ws-staff');
  function staff() {
    if (!wsS) return;
    const pf = HUB.privateFeed;
    if (!pf) {
      wsS.innerHTML = `<div class="ia-ws-head"><div><p class="persona-panel-head">Algarve Evolution team</p><h3>The private side of INC/ACC</h3><p class="ia-ws-sub">Session notes, companies not yet published, mentors who have not agreed to be public.</p></div></div>
        <div class="ia-card"><p>Not everything in Odoo is public. The private feed is published only encrypted; enter the team's access key to open it in this tab. The key never leaves this browser.</p><p><button type="button" class="btn btn-primary" data-open-key>Enter the access key</button></p></div>`;
      $('[data-open-key]', wsS).addEventListener('click', () => { const s = $('[data-persona-select]'); if (s) { s.value = 'staff'; s.dispatchEvent(new Event('change')); } });
      return;
    }
    const pubIds = k => new Set((pub[k] || []).map(r => r.id));
    const hidden = k => (pf[k] || []).filter(r => !pubIds(k).has(r.id));
    const hCos = hidden('companies'), hMen = hidden('mentors'), hSes = hidden('sessions'), hKpi = hidden('kpis');
    const pmentorOf = cid => (pf.mentors || []).find(m => (m.company_ids || []).includes(cid));
    const pprog = id => (pf.programmes || []).find(p => p.id === id) || prog(id);
    const pses = (pf.sessions || []).slice().sort((a, b) => b.date.localeCompare(a.date));
    const filterOpts = `<option value="all">All programmes</option>${(pf.programmes || []).map(p => `<option value="prog:${esc(p.id)}">${esc(progName(p))}</option>`).join('')}${(pf.companies || []).map(c => `<option value="co:${esc(c.id)}">${esc(plain(c.name))}${c.published ? '' : ' (not published)'}</option>`).join('')}`;
    const coBlock = hCos.map(c => {
      const ks = (pf.kpis || []).filter(k => k.company_id === c.id).sort((a, b) => a.month - b.month); const a = ks[0], b = ks.at(-1); const m = pmentorOf(c.id); const p = pprog(c.programme_id);
      const marked = local.publish.includes(c.id);
      return `<li class="ia-mco ${kindCls(p)}"><p class="ia-mco-name">${esc(c.name)} ${simB(c)} <span class="tag tag-odoo">Not published</span></p><p class="ia-note">${esc(progName(p))} · ${esc(c.sector)}, ${esc(c.town)} · mentor ${m ? esc(plain(m.name)) : 'none'}</p><p>${esc(c.summary || '')}</p>
        ${b ? `<p class="ia-mco-kpi">Revenue ${esc(money(a.revenue_eur))} → <strong>${esc(money(b.revenue_eur))}</strong> (M${b.month}) · customers ${esc(num(a.customers))} → <strong>${esc(num(b.customers))}</strong> · team ${esc(num(a.team_size))} → <strong>${esc(num(b.team_size))}</strong></p>` : ''}
        <p><button type="button" class="btn btn-primary btn-sm" data-publish="${esc(c.id)}" aria-pressed="${marked}">${marked ? 'Marked to publish (this browser only)' : 'Publish this company and its KPIs'}</button></p>
        ${marked ? callPanel('aih.programme.company', 'write', { ids: [c.odoo?.id], vals: { is_published: true } }, `Then the same for its ${ks.length} KPI snapshots: <code>POST /json/2/aih.kpi/write</code> with <code>{"ids": [${ks.map(k => k.odoo?.id).join(', ')}], "vals": {"is_published": true}}</code>. The next export adds them to the public feed and to the results.`) : ''}</li>`;
    }).join('');
    wsS.innerHTML = `<div class="ia-ws-head"><div><p class="persona-panel-head">Algarve Evolution team · private feed open</p><h3>The private side of INC/ACC</h3><p class="ia-ws-sub">Read from the private feed exported from Odoo, decrypted in this tab.</p></div></div>
      <ul class="ia-priv-stats">
        <li><strong>${(pf.companies || []).length}</strong> companies <span>${hCos.length} not published</span></li>
        <li><strong>${(pf.mentors || []).length}</strong> mentors <span>${hMen.length} without consent</span></li>
        <li><strong>${(pf.sessions || []).length}</strong> sessions <span>${(pf.sessions || []).filter(s => s.notes).length} with private notes</span></li>
        <li><strong>${(pf.kpis || []).length}</strong> KPI snapshots <span>${hKpi.length} not published</span></li>
      </ul>
      <div class="ia-ws-grid">
        <div class="ia-ws-col">
          <div class="ia-card"><h4>Companies not yet published <small>${hCos.length}</small></h4>${hCos.length ? `<ul class="ia-mcos">${coBlock}</ul>` : '<p>Every company is published.</p>'}</div>
          <div class="ia-card"><h4>Mentors without consent <small>${hMen.length}</small></h4>${hMen.length ? `<ul class="ia-plain">${hMen.map(m => { const n = (pf.sessions || []).filter(s => s.mentor_id === m.id); return `<li><strong>${esc(m.name)}</strong> ${simB(m)} · ${m.kind === 'guest' ? 'guest' : 'one-to-one'} · ${esc((m.expertise || []).join(', '))}<br><span class="ia-note">${n.length} session${n.length === 1 ? '' : 's'}: ${n.map(s => `${esc(s.topic)} (${esc(shortDate(s.date))})`).join('; ')}. Public pages show "a guest mentor (not public)" until consent is recorded in Odoo (<code>aih_consent</code> on the contact).</span></li>`; }).join('')}</ul>` : '<p>All mentors have consented.</p>'}</div>
          <form class="ia-card ia-form hub-form" id="ia-s-ref" novalidate><h4>Draft a reflection</h4><p class="local-note">Kept in this browser only</p><p class="ia-note">The call shows how it would be saved to <code>aih.reflection</code>, unpublished until approved.</p>
            <div class="ia-fields"><label class="field"><span>Programme</span> <select name="programme">${(pf.programmes || []).map(p => `<option value="${esc(p.id)}">${esc(progName(p))}, ${esc(p.cohort)}</option>`).join('')}</select></label><label class="field"><span>At month</span> <select name="month">${[0, 1, 2, 3, 4, 5, 6].map(i => `<option${i === 4 ? ' selected' : ''}>${i}</option>`).join('')}</select></label>
            <label class="field ia-wide"><span>Text</span> <textarea name="text" rows="4" maxlength="4000" placeholder="What the indicators show, what they miss, what we change for the next cohort"></textarea></label></div>
            <p class="ia-form-actions"><button type="submit" class="btn btn-primary">Keep the draft in this browser</button> <span class="ia-form-msg" role="status"></span></p><div data-call></div>
            ${local.reflections.length ? `<ul class="ia-plain">${local.reflections.map(r => `<li>${localB} ${esc(progName(pprog(r.programme_id)))}, month ${r.month}: ${esc(r.text)}</li>`).join('')}</ul>` : ''}</form>
        </div>
        <div class="ia-ws-col">
          <div class="ia-card"><h4>Session notes <small>private</small></h4>
            <label class="ia-pick ia-pick-inline">Show <select id="ia-s-filter">${filterOpts}</select></label>
            <ol class="ia-ses-list ia-ses-compact" id="ia-s-notes"></ol><p><button type="button" class="ia-btn-link" id="ia-s-more"></button></p></div>
        </div>
      </div>`;
    let limit = 10;
    const drawNotes = () => {
      const f = $('#ia-s-filter', wsS).value; const [t, id] = f.split(':');
      const list = pses.filter(s => f === 'all' || (t === 'prog' && s.programme_id === id) || (t === 'co' && s.company_id === id));
      $('#ia-s-notes', wsS).innerHTML = list.slice(0, limit).map(s => sessionItem({ ...s, simulated: s.simulated }, { notes: true, companies: pf.companies, mentors: pf.mentors })).join('') || '<li>No sessions.</li>';
      const more = $('#ia-s-more', wsS); more.hidden = list.length <= limit; more.textContent = `Show all ${list.length}`;
    };
    $('#ia-s-filter', wsS).addEventListener('change', () => { limit = 10; drawNotes(); });
    $('#ia-s-more', wsS).addEventListener('click', () => { limit = Infinity; drawNotes(); });
    drawNotes();
    $$('[data-publish]', wsS).forEach(b => b.addEventListener('click', () => { const id = b.dataset.publish; local.publish = local.publish.includes(id) ? local.publish.filter(x => x !== id) : [...local.publish, id]; saveLocal(); staff(); }));
    const rf = $('#ia-s-ref', wsS);
    const rv = () => { const f = new FormData(rf); return { programme_id: f.get('programme'), month: Number(f.get('month')), text: String(f.get('text') || '').trim() }; };
    const rcall = () => { const v = rv(); $('[data-call]', rf).innerHTML = callPanel('aih.reflection', 'create', { vals_list: [{ programme_id: pprog(v.programme_id)?.odoo?.id, month: v.month, text: v.text || '…', is_published: false, simulated: true }] }); };
    rf.addEventListener('input', rcall); rcall();
    rf.addEventListener('submit', e => { e.preventDefault(); const v = rv(); if (!v.text) { $('.ia-form-msg', rf).textContent = 'Write the reflection first.'; rf.elements.text.focus(); return; } local.reflections.push({ ...v, simulated: true }); saveLocal(); staff(); const m2 = $('#ia-s-ref .ia-form-msg', wsS); if (m2) m2.textContent = 'Draft kept in this browser. Nothing was sent to Odoo.'; });
  }

  // ------------------------------------------------------------------ persona wiring
  HUB.on('persona', id => {
    if (id === 'founder') founder(); else if (id === 'mentor') mentor(); else if (id === 'staff') staff(); else markMine(null);
  });
  HUB.on('private', () => { if (HUB.persona === 'staff') staff(); });
  $$('[data-persona-go]').forEach(b => b.addEventListener('click', () => {
    const s = $('[data-persona-select]'); if (!s) return; s.value = b.dataset.personaGo; s.dispatchEvent(new Event('change'));
    $('#you')?.scrollIntoView({ block: 'start' });
  }));

  // ------------------------------------------------------------------ results controls
  const res = $('#results');
  if (res) {
    res.classList.add('ia-js'); res.dataset.kpi = 'revenue_eur'; res.dataset.prog = 'inc';
    const first = $('[data-set-prog]', res); if (first) res.dataset.prog = first.dataset.setProg;
    $$('[data-set-kpi]', res).forEach(b => b.addEventListener('click', () => { res.dataset.kpi = b.dataset.setKpi; $$('[data-set-kpi]', res).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
    $$('[data-set-prog]', res).forEach(b => b.addEventListener('click', () => { res.dataset.prog = b.dataset.setProg; $$('[data-set-prog]', res).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  }
  $$('.ia-prog-links a[href^="#results-"]').forEach(a => a.addEventListener('click', () => { const k = a.getAttribute('href').replace('#results-', ''); $(`[data-set-prog="${k}"]`)?.click(); }));

  // ------------------------------------------------------------------ sessions calendar
  const months = $('.ia-months');
  if (months) {
    months.classList.add('ia-js');
    const show = key => { $$('[data-month-panel]', months).forEach(p => { p.hidden = p.dataset.monthPanel !== key; }); $$('[data-month]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.month === key))); };
    $$('[data-month]').forEach(b => b.addEventListener('click', () => { show(b.dataset.month); const pnl = $(`[data-month-panel="${b.dataset.month}"]`, months); if (pnl && pnl.getBoundingClientRect().top > window.innerHeight - 80) pnl.scrollIntoView({ block: 'nearest' }); }));
    show(months.dataset.defaultMonth);
  }

  // ------------------------------------------------------------------ tooltips for [data-tip]
  const tip = $('.ia-tip');
  if (tip) {
    const place = (x, y) => { tip.hidden = false; const r = tip.getBoundingClientRect(); const left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x + 12)); const top = y - r.height - 12 < 8 ? y + 16 : y - r.height - 12; tip.style.left = `${left}px`; tip.style.top = `${top}px`; };
    const target = e => e.target.closest?.('[data-tip]');
    document.addEventListener('pointermove', e => { const t = target(e); if (!t) { tip.hidden = true; return; } tip.textContent = t.dataset.tip || t.getAttribute('data-tip'); place(e.clientX, e.clientY); });
    document.addEventListener('focusin', e => { const t = target(e); if (!t) { tip.hidden = true; return; } tip.textContent = t.getAttribute('data-tip'); const r = t.getBoundingClientRect(); place(r.left + r.width / 2, r.top); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') tip.hidden = true; });
    window.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });
  }

  // Anchors land below the sticky hub header.
  const top = $('.hub-top');
  const pad = () => { if (!top) return; const h = getComputedStyle(top).position === 'sticky' ? top.offsetHeight : 0; document.documentElement.style.scrollPaddingTop = `${h + 12}px`; document.documentElement.style.setProperty('--ia-top', `${h}px`); };
  pad(); window.addEventListener('resize', pad);
})();
