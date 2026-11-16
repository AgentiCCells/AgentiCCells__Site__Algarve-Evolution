// Vibathon in the browser: register, submit a project, score as a juror, the teams a mentor helps, and the staff
// view (participants, registrations data, jury scores, the follow-ups as CSV) once the private feed is open.
// Nothing is sent anywhere: what a person does is kept in this browser (localStorage), and every action shows
// the Odoo 19 JSON-2 call it would make, marked "not sent: prototype". Owner: sites-dev@AgentiCCells.dinis. Apache-2.0.
(() => {
  const D = JSON.parse(document.getElementById('vb-data')?.textContent || 'null'); if (!D) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(`vb-${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`vb-${k}`, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(`vb-${k}`); } catch {} },
  };
  const HUB = window.HUB || { on() {}, persona: 'visitor' };
  const personas = JSON.parse(document.getElementById('hub-personas')?.textContent || '[]');
  const SIM = '<span class="sim-badge" title="Invented for the prototype">Simulated</span>';
  const sim = r => (r?.simulated ? SIM : '');
  const lane = id => D.lanes.find(l => l.id === id) || (id === 'none' ? { id: 'none', name: 'No follow-up', href: '#after' } : D.lanes[2]);
  const oid = r => (r && typeof r.odoo === 'object' ? r.odoo?.id : r?.odoo);
  const laneOf = step => (D.rules.find(r => new RegExp(r.re, 'i').test(step || '')) || { id: 'talent' }).id;
  const fmtDate = iso => { try { return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } };
  const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const f1 = n => (n == null ? '-' : n.toFixed(1));
  let priv = null, persona = HUB.persona || 'visitor';
  const V = id => (priv?.vibathons || D.vibathons).find(v => v.id === id) || D.vibathons.find(v => v.id === id);
  const projects = () => (priv?.projects || D.projects).map(p => ({ ...p, lane: laneOf(p.next_step) }));
  const P = id => projects().find(p => p.id === id);
  const isPublicProject = id => D.projects.some(p => p.id === id);

  // ---------------------------------------------------------------- the "Odoo call" panel
  const AUTH = 'Authorization: bearer <API key of an Odoo integration user, never in the browser>';
  function showCall(el, title, steps) {
    if (!el) return;
    el.innerHTML = `<div class="vb-call-head"><strong>Odoo call</strong> <span>${esc(title)}</span> <span class="vb-notsent">not sent: prototype</span></div>${steps.map((s, i) => `
      <pre tabindex="0" aria-label="Odoo call ${i + 1}: ${esc(s.model)} ${esc(s.method)}"><code>POST /json/2/${esc(s.model)}/${esc(s.method)}
${esc(AUTH)}
Content-Type: application/json

${esc(JSON.stringify(s.body, null, 2))}</code></pre>${s.note ? `<p class="vb-call-note">${esc(s.note)}</p>` : ''}`).join('')}`;
  }

  // ---------------------------------------------------------------- persona
  function onPersona(id) {
    persona = id;
    const names = { visitor: 'a visitor', founder: 'a founder', mentor: 'a mentor', challenger: 'a challenge owner', supplier: 'a supplier', participant: 'a participant or juror', staff: 'the Algarve Evolution team' };
    const nm = $('[data-vb-persona-name]'); if (nm) nm.textContent = `as ${names[id] || (personas.find(x => x.id === id)?.label || id)}`;
    renderStaff(); renderScoreSlots(); renderCompare(); renderLaneControls(); if (pick) renderMentor();
  }
  $$('[data-go-persona]').forEach(b => b.addEventListener('click', e => {
    const sel = $('[data-persona-select]'); if (!sel) return;
    e.preventDefault(); sel.value = b.dataset.goPersona; sel.dispatchEvent(new Event('change'));
    $('#you')?.scrollIntoView({ block: 'start' }); $('#you')?.focus?.();
  }));

  // ---------------------------------------------------------------- participant or juror
  const roleInputs = $$('input[name="vb-role"]');
  function setRole(r) { document.body.dataset.vbRole = r; roleInputs.forEach(i => { i.checked = i.value === r; }); store.set('role', r); }
  roleInputs.forEach(i => i.addEventListener('change', () => setRole(i.value)));
  setRole(store.get('role', 'participant'));

  // Register for the next vibathon.
  const reg = $('#vb-register');
  function regCall() {
    if (!reg) return;
    const f = new FormData(reg), name = f.get('name') || '<your name>', email = f.get('email') || '<your e-mail>';
    showCall($('[data-call="register"]', reg), 'two calls: your contact, then your registration', [
      { model: 'res.partner', method: 'create', body: { vals_list: [{ name, email, aih_consent: !!f.get('consent') }] }, note: 'Creates your contact (a real flow would first look for an existing one). aih_consent is what lets the hub show your name if your team presents.' },
      { model: 'aih.vibathon.participant', method: 'create', body: { vals_list: [{ vibathon_id: Number(reg.dataset.odooId), partner_id: '<id returned by the first call>', name, email }] }, note: `Adds you to ${D.next?.name || 'the event'} (aih.vibathon id ${reg.dataset.odooId}). The addon has no field for how you join (${f.get('as')}): a proposal for aih.vibathon.participant.` },
    ]);
  }
  if (reg) {
    const saved = store.get(`reg-${reg.dataset.vibathon}`);
    if (saved) { reg.name.value = saved.name; reg.email.value = saved.email; reg.as.value = saved.as; reg.consent.checked = !!saved.consent; }
    reg.addEventListener('input', regCall); reg.addEventListener('change', regCall); regCall();
    reg.addEventListener('submit', e => {
      e.preventDefault(); const msg = $('.vb-msg', reg);
      const f = new FormData(reg), name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim();
      if (!name) { msg.textContent = 'Please give your name.'; reg.name.focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Please give a valid e-mail address.'; reg.email.focus(); return; }
      store.set(`reg-${reg.dataset.vibathon}`, { name, email, as: f.get('as'), consent: !!f.get('consent'), at: new Date().toISOString() });
      msg.textContent = 'You are registered, in this browser only. The calls below are what Odoo would receive.'; regCall(); renderTrack();
    });
  }

  // Submit a project.
  const sub = $('#vb-submit');
  function subCall() {
    if (!sub) return;
    const f = new FormData(sub);
    const team = String(f.get('team') || '').split(',').map(s => s.trim()).filter(Boolean);
    showCall($('[data-call="submit"]', sub), 'your project', [{ model: 'aih.project', method: 'create', body: { vals_list: [{ vibathon_id: Number(sub.dataset.odooId), name: f.get('name') || '<project name>', summary: f.get('summary') || '<what it does>', next_step: f.get('next_step') || '<your next step>', team_ids: [[6, 0, ['<your res.partner id>', ...team.map(t => `<res.partner id of ${t}>`)]]], is_published: false }] }, note: 'Team members are contacts (res.partner); their names show in public only with their consent. The project stays unpublished until the team publishes it after the event.' }]);
  }
  if (sub) {
    const saved = store.get(`project-${sub.dataset.vibathon}`);
    if (saved) ['name', 'team', 'summary', 'next_step'].forEach(k => { sub[k].value = saved[k] || ''; });
    sub.addEventListener('input', subCall); subCall();
    sub.addEventListener('submit', e => {
      e.preventDefault(); const msg = $('.vb-msg', sub);
      const f = Object.fromEntries(new FormData(sub)); for (const k of ['name', 'team', 'summary', 'next_step']) f[k] = String(f[k] || '').trim();
      const miss = ['name', 'summary', 'next_step'].find(k => !f[k]); if (miss) { msg.textContent = 'Please fill in the name, what it does and your next step.'; sub[miss].focus(); return; }
      store.set(`project-${sub.dataset.vibathon}`, { ...f, at: new Date().toISOString() });
      msg.textContent = `Submitted, in this browser only. Your next step goes to ${lane(laneOf(f.next_step)).name}.`; subCall(); renderTrack(); renderMine();
    });
  }

  // Your journey: register, build, present, next step.
  function renderTrack() {
    const t = $('[data-track]'); if (!t || !D.next) return;
    const r = store.get(`reg-${D.next.id}`), s = store.get(`project-${D.next.id}`), v = V(D.next.id);
    const set = (k, state, text) => { const li = $(`[data-track-step="${k}"]`, t); li.dataset.state = state; if (text) $(`[data-track-text="${k}"]`, t).innerHTML = text; };
    set('register', r ? 'done' : 'now', r ? `Registered as ${esc(r.name)} for ${esc(D.next.name)}` : `For ${esc(D.next.name)}, ${esc(fmtDate(D.next.date))}`);
    set('build', r ? (s ? 'done' : 'now') : 'later', `On ${esc(fmtDate(D.next.date))}, with ${v.mentor_ids.length} mentor${v.mentor_ids.length === 1 ? '' : 's'} on hand`);
    set('present', s ? 'done' : r ? 'now' : 'later', s ? `"${esc(s.name)}" submitted` : 'Submit your project before you present');
    const l = s && lane(laneOf(s.next_step));
    const cta = $('[data-track-cta]'); if (cta) { cta.textContent = !r ? `Register for ${D.next.name}` : !s ? 'Submit your project' : 'See your registration and project'; cta.href = !r ? `#${D.next.id}` : '#vb-submit'; }
    set('next', s ? 'done' : 'later', s ? `${esc(s.next_step)}: <a href="${l.href}">${esc(l.name)}</a>` : 'Appears when you submit a project');
  }
  $('[data-reset]')?.addEventListener('click', () => {
    if (D.next) { store.del(`reg-${D.next.id}`); store.del(`project-${D.next.id}`); }
    store.del('scores'); store.del('lanes'); store.del('office');
    reg?.reset(); sub?.reset(); regCall(); subCall(); renderTrack(); renderMine(); renderSheet(); renderLanes();
  });

  // ---------------------------------------------------------------- the jury: score sheet and comparison
  const sheet = $('[data-sheet]');
  const sheetProjects = () => { const v = V(sheet?.dataset.vibathon); return v ? projects().filter(p => p.vibathon_id === v.id) : []; };
  function scoresCall() {
    const mine = store.get('scores', {}), draft = readSheet();
    const rows = Object.entries({ ...mine, ...draft }).flatMap(([pid, sc]) => D.criteria.map(c => ({ project_id: oid(P(pid)) ?? pid, juror: 'Juror in this browser (simulated)', criterion: c, score: sc[c] })));
    showCall($('[data-call="scores"]'), `${rows.length} scores`, [{ model: 'aih.project.score', method: 'create', body: { vals_list: rows.length ? rows : [{ project_id: '<project id>', juror: '<your name>', criterion: D.criteria[0], score: '<1 to 10>' }] }, note: 'One record per project, juror and criterion. Odoo keeps the average on the project (score_total); the scores stay in the private feed.' }]);
  }
  function readSheet() {
    const o = {}; $$('[data-row]', sheet || document).forEach(r => { o[r.dataset.row] = Object.fromEntries(D.criteria.map(c => [c, Number($(`input[data-c="${c}"]`, r).value)])); }); return o;
  }
  function renderSheet() {
    if (!sheet) return;
    const mine = store.get('scores', {});
    sheet.innerHTML = `<div class="vb-sheet-head" aria-hidden="true"><span>Project</span>${D.criteria.map(c => `<span>${esc(c)}</span>`).join('')}<span>Average</span></div>` + sheetProjects().map(p => {
      const sc = mine[p.id] || {}; const avg = mean(D.criteria.map(c => Number(sc[c] ?? 5)));
      return `<div class="vb-row" data-row="${esc(p.id)}" role="group" aria-label="${esc(p.name)}"><div class="vb-row-name"><strong>${esc(p.name)}</strong> ${sim(p)} ${isPublicProject(p.id) ? '' : '<span class="vb-unpub">Not published</span>'}${mine[p.id] ? '<small class="vb-saved">Scored</small>' : ''}</div>${D.criteria.map(c => `<label class="vb-slider"><span class="vb-slider-l">${esc(c)}</span><input type="range" min="1" max="10" step="1" value="${esc(sc[c] ?? 5)}" data-c="${esc(c)}" aria-label="${esc(c)} for ${esc(p.name)}"><output>${esc(sc[c] ?? 5)}</output></label>`).join('')}<div class="vb-row-avg"><span class="vb-slider-l">Average</span><output data-avg>${f1(avg)}</output></div></div>`;
    }).join('');
    juryProgress(); scoresCall();
  }
  sheet?.addEventListener('input', e => {
    const r = e.target.closest('[data-row]'); if (!r) return;
    e.target.nextElementSibling.value = e.target.value;
    $('[data-avg]', r).value = f1(mean(D.criteria.map(c => Number($(`input[data-c="${c}"]`, r).value))));
    scoresCall();
  });
  $('[data-save-scores]')?.addEventListener('click', () => {
    store.set('scores', { ...store.get('scores', {}), ...readSheet() });
    $('[data-scores-msg]').textContent = 'Your scores are recorded in this browser only. The call below is what Odoo would receive.';
    renderSheet(); renderCompare();
  });
  function juryProgress() {
    const el = $('[data-jury-progress]'); if (!el) return;
    const n = Object.keys(store.get('scores', {})).filter(id => sheetProjects().some(p => p.id === id)).length;
    el.textContent = `You have scored ${n} of ${sheetProjects().length} projects.`;
  }
  // Staff with the private feed: your scores next to the jury's, drawn as a dot plot.
  function juryStats(p) {
    const s = p.scores || []; if (!s.length) return null;
    const jurors = [...new Set(s.map(x => x.juror))];
    return { avg: mean(s.map(x => x.score)), byC: Object.fromEntries(D.criteria.map(c => [c, mean(s.filter(x => x.criterion === c).map(x => x.score))])), byJ: jurors.map(j => ({ j, avg: mean(s.filter(x => x.juror === j).map(x => x.score)) })), n: s.length };
  }
  function renderCompare() {
    const el = $('[data-compare]'); if (!el) return;
    if (!priv || persona !== 'staff') { el.innerHTML = persona === 'staff' ? '<p class="vb-locked vb-locked-dark">Open the private feed to compare your scores with the jury\'s.</p>' : ''; return; }
    const mine = store.get('scores', {});
    const rows = sheetProjects().map(p => ({ p, st: juryStats(p), you: mine[p.id] ? mean(D.criteria.map(c => mine[p.id][c])) : null })).filter(r => r.st).sort((a, b) => b.st.avg - a.st.avg);
    if (!rows.length) { el.innerHTML = ''; return; }
    const W = 640, L = 190, R = 20, rowH = 34, top = 26, x = v => L + (v - 1) / 9 * (W - L - R);
    const svg = `<svg viewBox="0 0 ${W} ${top + rows.length * rowH + 8}" role="img" aria-label="Jury average and your average per project, on a scale of 1 to 10">
      ${[1, 4, 7, 10].map(t => `<g><line x1="${x(t)}" x2="${x(t)}" y1="${top - 6}" y2="${top + rows.length * rowH}" class="cmp-grid"/><text x="${x(t)}" y="${top - 10}" class="cmp-tick">${t}</text></g>`).join('')}
      ${rows.map((r, i) => { const y = top + i * rowH + rowH / 2; return `<g><text x="0" y="${y + 4}" class="cmp-name">${esc(r.p.name.replace(/\s*\(simulated\)/, ''))}</text>
        ${r.st.byJ.map(j => `<circle cx="${x(j.avg).toFixed(1)}" cy="${y}" r="4" class="cmp-juror"><title>${esc(j.j)}: ${f1(j.avg)}</title></circle>`).join('')}
        <circle cx="${x(r.st.avg).toFixed(1)}" cy="${y}" r="7" class="cmp-jury"><title>Jury average ${f1(r.st.avg)}</title></circle>
        ${r.you != null ? `<rect x="${(x(r.you) - 6).toFixed(1)}" y="${y - 6}" width="12" height="12" transform="rotate(45 ${x(r.you).toFixed(1)} ${y})" class="cmp-you"><title>You ${f1(r.you)}</title></rect>` : ''}</g>`; }).join('')}
    </svg>`;
    el.innerHTML = `<div class="vb-compare"><h4>Your scores and the jury's (private feed)</h4>
      <p class="vb-legend"><span class="lg lg-jury"></span>Jury average <span class="lg lg-juror"></span>Each juror <span class="lg lg-you"></span>You (this browser)</p>${svg}
      <div class="vb-table-wrap" tabindex="0"><table class="vb-table vb-table-dark"><caption class="vh">Scores by project</caption><thead><tr><th scope="col">Project</th>${D.criteria.map(c => `<th scope="col">${esc(c)}</th>`).join('')}<th scope="col">Jury</th><th scope="col">You</th><th scope="col">Prize</th></tr></thead>
      <tbody>${rows.map(r => `<tr><th scope="row">${esc(r.p.name)}</th>${D.criteria.map(c => `<td>${f1(r.st.byC[c])}</td>`).join('')}<td><strong>${f1(r.st.avg)}</strong></td><td>${f1(r.you)}</td><td>${esc((r.p.prize || '').replace(/\s*\(simulated\)/, '')) || '-'}</td></tr>`).join('')}</tbody></table></div>
      <p class="vb-note-light">${rows.length} projects, ${rows.reduce((s, r) => s + r.st.n, 0)} scores from ${new Set(rows.flatMap(r => r.st.byJ.map(j => j.j))).size} jurors, all simulated, from aih.project.score in the private feed.</p></div>`;
  }

  // ---------------------------------------------------------------- mentor: the teams you help
  const pick = $('[data-mentor-pick]');
  function renderMentor() {
    const view = $('[data-mentor-view]'); if (!view || !pick) return;
    const id = pick.value; store.set('mentor', id);
    $$('[data-mentor]').forEach(el => el.classList.toggle('is-me', persona === 'mentor' && el.dataset.mentor === id));
    const office = store.get('office', {});
    const vibs = D.vibathons.filter(v => v.mentor_ids.includes(id));
    view.innerHTML = vibs.length ? vibs.map(v => {
      const ps = projects().filter(p => p.vibathon_id === v.id && isPublicProject(p.id));
      const past = v.date < D.today;
      return `<div class="vb-mentor-ev"><h3><a href="#${esc(v.id)}">${esc(v.name)}</a> ${sim(v)}</h3><p class="vb-where">${esc(fmtDate(v.date))} · ${esc(v.venue)} · ${past ? 'took place' : `upcoming, ${v.registrations} registered so far`}</p>
        ${ps.length ? `<ul class="vb-mentor-teams">${ps.map(p => `<li><strong>${esc(p.name)}</strong> ${sim(p)}<span>${esc(p.team.join(', ') || 'Team not public')}</span><span class="vb-next"><span>Next step</span> ${esc(p.next_step)} (${esc(lane(p.lane).name)})</span><button type="button" class="vb-btn vb-btn-small" data-office="${esc(p.id)}" aria-pressed="${office[p.id] ? 'true' : 'false'}">${office[p.id] ? 'Office hours offered' : 'Offer office hours'}</button></li>`).join('')}</ul>` : `<p class="vb-empty">${past ? 'No projects recorded.' : 'The teams form on the day; you will see them here once they submit their projects.'}</p>`}</div>`;
    }).join('') + '<p class="vb-note">Mentors help every team at their event; Odoo does not yet link a mentor to a single project, nor keep a mentor\'s offer of office hours (kept in this browser only). A proposal for the addon: a mentor field and the chatter on aih.project.</p>' : '<p class="vb-empty">You are not a mentor at any vibathon in Odoo.</p>';
  }
  if (pick) {
    const saved = store.get('mentor'); if (saved && [...pick.options].some(o => o.value === saved)) pick.value = saved;
    pick.addEventListener('change', renderMentor);
    $('[data-mentor-view]')?.addEventListener('click', e => { const b = e.target.closest('[data-office]'); if (!b) return; const o = store.get('office', {}); o[b.dataset.office] = !o[b.dataset.office]; store.set('office', o); renderMentor(); $(`[data-office="${b.dataset.office}"]`)?.focus(); });
    renderMentor();
  }

  // ---------------------------------------------------------------- the follow-up pipeline
  const laneFor = p => store.get('lanes', {})[p.id] || p.lane;
  function routeCall(p, to) {
    const team = (p.team || []).map(n => ({ n, id: D.people[n]?.odoo ?? priv?.talent?.find(t => t.name === n)?.odoo?.id }));
    if (to === 'none') { showCall($('[data-call="route"]'), `"${p.name}": no follow-up`, [{ model: 'aih.project', method: 'write', body: { ids: [oid(p)], vals: { next_step: p.next_step } }, note: 'Nothing to route: the next step stays as it is in Odoo.' }]); return; }
    const steps = {
      'inc-acc': [{ model: 'aih.programme.company', method: 'create', body: { vals_list: [{ name: p.name, summary: p.summary, stage: 'idea', programme_id: null }] }, note: 'A candidate company for the next cohort; the programme is chosen at selection.' }],
      challenge: [{ model: 'res.partner', method: 'create', body: { vals_list: [{ name: `${p.name} team`, is_company: true, aih_is_supplier: true, aih_summary: p.summary, aih_published: false, aih_consent: false }] }, note: 'The team as a supplier in Challenge Connect, ready to apply to a challenge for its pilot.' }],
      talent: [{ model: 'res.partner', method: 'write', body: { ids: team.map(t => t.id ?? `<res.partner id of ${t.n}>`), vals: { aih_talent_kind: 'professional' } }, note: 'The team members join the Talent Ecosystem as professionals.' }],
    }[to];
    showCall($('[data-call="route"]'), `move "${p.name}" to ${lane(to).name}`, steps);
  }
  function renderLanes() {
    const mine = D.next && store.get(`project-${D.next.id}`);
    const list = projects().filter(p => isPublicProject(p.id) || persona === 'staff');
    D.lanes.forEach(l => {
      const ul = $(`[data-lane-list="${l.id}"]`); if (!ul) return;
      const ps = list.filter(p => laneFor(p) === l.id);
      const items = ps.map(p => `<li class="vb-card${store.get('lanes', {})[p.id] ? ' is-moved' : ''}" data-card="${esc(p.id)}"><strong>${esc(p.name)}</strong> ${sim(p)} ${isPublicProject(p.id) ? '' : '<span class="vb-unpub">Not published</span>'}<span>${esc(p.next_step)}</span><small>${esc(V(p.vibathon_id)?.name || '')}${p.prize ? ` · ${esc(p.prize.replace(/\s*\(simulated\)/, ''))}` : ''}${store.get('lanes', {})[p.id] ? ' · moved in this browser' : ''}</small><span class="vb-move" data-move-slot></span></li>`);
      if (mine && laneOf(mine.next_step) === l.id) items.push(`<li class="vb-card is-mine"><strong>${esc(mine.name)}</strong> <span class="vb-yours">Yours, in this browser</span><span>${esc(mine.next_step)}</span><small>${esc(D.next.name)}</small></li>`);
      ul.innerHTML = items.join('') || '<li class="vb-empty">No team in this lane yet.</li>';
      const n = $(`[data-lane-count="${l.id}"]`); if (n) n.textContent = items.length;
    });
    const none = list.filter(p => laneFor(p) === 'none'), nl = $('[data-no-lane]');
    if (nl) nl.innerHTML = none.length ? `<p class="vb-note">No follow-up: ${none.map(p => `<span data-card="${esc(p.id)}"><strong>${esc(p.name)}</strong> (${esc(p.next_step)}) <span class="vb-move" data-move-slot></span></span>`).join('; ')}</p>` : '';
    renderLaneControls();
  }
  function renderLaneControls() {
    $$('[data-move-slot]').forEach(slot => {
      if (persona !== 'staff') { slot.innerHTML = ''; return; }
      const id = slot.closest('[data-card]').dataset.card, p = P(id); if (!p) return;
      slot.innerHTML = `<label>Move to <select data-move="${esc(id)}">${D.lanes.map(l => `<option value="${l.id}"${laneFor(p) === l.id ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}<option value="none"${laneFor(p) === 'none' ? ' selected' : ''}>No follow-up</option></select></label>`;
    });
  }
  document.addEventListener('change', e => {
    const s = e.target.closest('[data-move]'); if (!s) return;
    const id = s.dataset.move, p = P(id), o = store.get('lanes', {});
    if (s.value === p.lane) delete o[id]; else o[id] = s.value; store.set('lanes', o);
    renderLanes(); routeCall(p, s.value); $(`[data-move="${id}"]`)?.focus();
  });
  const renderMine = renderLanes;

  // ---------------------------------------------------------------- staff: the private feed
  function renderScoreSlots() {
    $$('[data-score-slot]').forEach(el => {
      const p = priv && P(el.dataset.scoreSlot); const st = p && juryStats(p);
      el.innerHTML = st ? `<p class="vb-score-line"><strong>Jury ${f1(st.avg)}</strong> ${D.criteria.map(c => `<span>${esc(c)} ${f1(st.byC[c])}</span>`).join('')} <small>${st.byJ.length} jurors, private</small></p>` : '';
    });
  }
  function renderStaff() {
    const view = $('[data-staff-view]'); const note = $('[data-export-note]');
    if (note) note.textContent = priv ? 'Includes the private fields: unpublished projects, jury averages and team contacts.' : 'Public fields only until the private feed is open.';
    if (!priv) return;
    const pubV = id => D.vibathons.find(v => v.id === id);
    view.innerHTML = `<h3 class="vb-staff-h">The private feed is open in this tab</h3><div class="vb-table-wrap" tabindex="0"><table class="vb-table"><caption class="vh">Registrations data per vibathon</caption>
      <thead><tr><th scope="col">Vibathon</th><th scope="col">Date</th><th scope="col">Registered</th><th scope="col">Participant records</th><th scope="col">Jurors (named in public)</th><th scope="col">Projects (published)</th><th scope="col">Jury scores</th></tr></thead>
      <tbody>${priv.vibathons.map(v => { const ps = priv.projects.filter(p => p.vibathon_id === v.id); const pv = pubV(v.id); return `<tr><th scope="row"><a href="#${esc(v.id)}">${esc(v.name)}</a></th><td>${esc(fmtDate(v.date))}</td><td>${v.registrations}</td><td>${(v.participants || []).length}</td><td>${(v.jury || []).length} (${(pv?.jury || []).length})</td><td>${ps.length} (${ps.filter(p => isPublicProject(p.id)).length})</td><td>${ps.reduce((s, p) => s + (p.scores || []).length, 0)}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="vb-note">Participant records are the people Odoo holds a contact for; registrations is the count recorded for the event. Every record here is simulated. ${'<span class="odoo-chip"><span class="odoo-dot" aria-hidden="true"></span>Odoo · aih.vibathon.participant · ' + priv.vibathons.reduce((s, v) => s + (v.participants || []).length, 0) + '</span>'}</p>`;
    // Into each event: participants, the full jury, mentors without consent, unpublished projects.
    priv.vibathons.forEach(v => {
      const parts = $(`[data-participants-slot="${v.id}"]`);
      if (parts) parts.innerHTML = (v.participants || []).length ? `<details class="vb-details"><summary>${v.participants.length} participant records (private)</summary><div class="vb-table-wrap" tabindex="0"><table class="vb-table"><thead><tr><th scope="col">Name</th><th scope="col">E-mail</th></tr></thead><tbody>${v.participants.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.email || '')}</td></tr>`).join('')}</tbody></table></div></details>` : '<p class="vb-empty">No participant records yet.</p>';
      const pv = pubV(v.id);
      const jury = $(`[data-jury-slot="${v.id}"]`);
      if (jury) { const hidden = (v.jury || []).filter(j => !(pv?.jury || []).some(x => x.name === j.name)); jury.innerHTML = hidden.length ? `<p class="vb-priv-h">Also on the jury, not named in public (no consent):</p><ul class="vb-jury">${hidden.map(j => `<li><strong>${esc(j.name)}</strong><small>${esc(j.role || '')} · ${esc(j.partner_id || '')}</small></li>`).join('')}</ul>` : ''; }
      const men = $(`[data-mentors-slot="${v.id}"]`);
      if (men) { const hidden = (v.mentor_ids || []).filter(id => !(pv?.mentor_ids || []).includes(id)).map(id => priv.mentors.find(m => m.id === id)).filter(Boolean); men.innerHTML = hidden.length ? `<p class="vb-priv-h">Also mentoring, not named in public (no consent):</p><ul class="vb-people">${hidden.map(m => `<li class="vb-person"><span class="vb-avatar" aria-hidden="true">${esc(m.name.replace(/\D/g, '').slice(-2))}</span><span><strong>${esc(m.name)}</strong> ${sim(m)}<small>${esc((m.expertise || []).join(', '))}</small></span></li>`).join('')}</ul>` : ''; }
      const extra = $(`[data-extra-projects="${v.id}"]`);
      if (extra) { const ps = priv.projects.filter(p => p.vibathon_id === v.id && !isPublicProject(p.id)); extra.innerHTML = ps.length ? `<p class="vb-priv-h">Presented but not published in Odoo:</p><ul class="vb-projects">${ps.map(p => { const st = juryStats(p); return `<li class="vb-project"><div class="vb-project-top"><span class="vb-unpub">Not published</span> ${sim(p)}</div><h4>${esc(p.name)}</h4><p>${esc(p.summary)}</p><p class="vb-team">${esc((p.team || []).join(', '))}</p><p class="vb-next"><span>Next step</span> ${esc(p.next_step)}</p>${st ? `<p class="vb-score-line"><strong>Jury ${f1(st.avg)}</strong></p>` : ''}</li>`; }).join('')}</ul>` : ''; }
    });
  }
  $('[data-export]')?.addEventListener('click', () => {
    const cols = ['vibathon', 'vibathon_date', 'project', 'simulated', 'published', 'team', 'prize', 'next_step', 'lane', 'jury_average', 'jury_scores', 'team_contacts'];
    const rows = projects().map(p => { const v = V(p.vibathon_id), st = priv ? juryStats(p) : null; return { vibathon: v?.name, vibathon_date: v?.date, project: p.name, simulated: p.simulated, published: isPublicProject(p.id), team: (p.team || []).join('; '), prize: p.prize || '', next_step: p.next_step, lane: lane(laneFor(p)).name, jury_average: st ? st.avg.toFixed(2) : '', jury_scores: st ? st.n : '', team_contacts: (p.team_ids || []).join('; ') }; });
    const mine = D.next && store.get(`project-${D.next.id}`);
    if (mine) rows.push({ vibathon: D.next.name, vibathon_date: D.next.date, project: mine.name, simulated: true, published: false, team: mine.team, prize: '', next_step: mine.next_step, lane: lane(laneOf(mine.next_step)).name, jury_average: '', jury_scores: '', team_contacts: 'this browser' });
    const q = x => { const s = String(x ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\r\n') + '\r\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `vibathon-follow-ups-${D.today}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    const n = $('[data-export-note]'); if (n) n.textContent = `Exported ${rows.length} follow-ups${priv ? ' with the private fields' : ' (public fields only)'}. Made in this browser; nothing is sent.`;
  });

  // ---------------------------------------------------------------- start
  HUB.on('private', feed => { priv = feed; renderStaff(); renderScoreSlots(); renderSheet(); renderCompare(); renderLanes(); });
  HUB.on('persona', id => { onPersona(id); renderLanes(); });
  renderTrack(); renderSheet(); renderLanes();
})();
