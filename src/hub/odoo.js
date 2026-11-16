// The Odoo page in the browser: the spreadsheet to Odoo importer, ideas and needs, and the public/private feed
// explorer. Nothing is sent anywhere: the Odoo calls are shown, marked "not sent: prototype". Requests are kept in
// this browser (localStorage). The private feed comes from hub.js once the team opens it (HUB.on('private')).
// Owner: odoo@AgentiCCells.dinis. Code Apache-2.0.
(() => {
  const C = JSON.parse(document.getElementById('odoo-config')?.textContent || 'null');
  if (!C) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_\s]+/g, ' ').replace(/[.:]+$/, '').trim();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const num = n => Number(n ?? 0).toLocaleString('en-GB');
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: kept for this visit only */ } },
  };
  const HUB = window.HUB || { on() {}, publicFeed: () => fetch('/feeds/public.json').then(r => r.json()), persona: 'visitor' };
  let PUB = null, PRIV = null, persona = HUB.persona || 'visitor';
  const isStaff = () => persona === 'staff' && !!PRIV;
  const feedNow = () => (isStaff() ? PRIV : PUB);

  // ------------------------------------------------------------ counts (the same rules as scripts/v2/odoo.mjs)
  function countOf(feed, key) {
    const sum = (arr, f) => (arr || []).reduce((n, r) => n + (Array.isArray(r[f]) ? r[f].length : 0), 0);
    switch (key) {
      case 'hub': return feed.hub?.name ? 1 : 0;
      case 'activities': return feed.hub?.activities?.length || 0;
      case 'jury': return sum(feed.vibathons, 'jury');
      case 'participants': return sum(feed.vibathons, 'participants');
      case 'scores': return sum(feed.projects, 'scores');
      case 'skills': return new Set([...(feed.mentors || []).flatMap(r => r.expertise), ...(feed.suppliers || []).flatMap(r => r.capabilities), ...(feed.challenges || []).flatMap(r => r.skills)]).size;
      case 'partners': return new Set([...(feed.mentors || []), ...(feed.suppliers || []), ...(feed.talent || [])].map(r => r.id)).size;
      default: return (feed[key] || []).length;
    }
  }

  // ============================================================ 1. the importer
  const imp = $('[data-imp]');
  const state = { text: '', name: '', csv: null, target: null, map: [], rows: [], sample: false };

  // CSV, as Excel and Google Sheets write it: quotes, commas or semicolons (Portuguese Excel), CRLF, a BOM.
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/).find(l => l.trim()) || '';
    const counts = { ',': 0, ';': 0, '\t': 0 }; let q = false;
    for (const ch of first) { if (ch === '"') q = !q; else if (!q && ch in counts) counts[ch]++; }
    const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : ',';
    const rows = []; let row = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch; continue; }
      if (ch === '"') inQ = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const clean = rows.filter(r => r.some(c => c.trim()));
    const headers = (clean.shift() || []).map(h => h.trim());
    return { headers, rows: clean.map(r => headers.map((_, i) => (r[i] ?? '').trim())), delim };
  }

  const aliasHit = (header, field) => {
    const h = norm(header); if (!h) return 0;
    if (norm(field.f) === h || norm(field.label) === h) return 3;
    for (const a of field.aliases) { if (a === h) return 3; }
    for (const a of field.aliases) { if (a.length >= 4 && (h.startsWith(a + ' ') || h.endsWith(' ' + a) || h.includes(' ' + a + ' '))) return 2; }
    for (const a of field.aliases) { if (a.length >= 5 && h.includes(a)) return 1; }
    return 0;
  };
  function autoMap(target, headers) {
    const used = new Set();
    const best = headers.map(hd => {
      const cands = target.fields.map(f => [f, aliasHit(hd, f)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
      return cands;
    });
    // strongest matches first, each field used once
    const order = headers.map((_, i) => i).sort((a, b) => (best[b][0]?.[1] || 0) - (best[a][0]?.[1] || 0));
    const map = headers.map(() => '');
    for (const i of order) { const c = best[i].find(([f]) => !used.has(f.f)); if (c) { map[i] = c[0].f; used.add(c[0].f); } }
    return map;
  }
  // Values that only fit one model (a stage, a mentor kind, a programme's name) count as evidence too.
  function selectionHit(field, v) { const n = norm(v); if (!n) return null; return Object.entries(field.options).find(([k, opts]) => norm(k) === n || opts.some(o => norm(o) === n))?.[0] ?? null; }
  function refFind(field, v, feed) {
    const n = norm(v); if (!n || !feed) return null;
    const list = feed[field.ref] || [];
    return list.find(r => norm(r.name) === n || norm(r.id) === n || (r.cohort && norm(r.cohort) === n) || (field.ref === 'vibathons' && r.date === v.trim())) || null;
  }
  function detect(csv) {
    return C.targets.map(t => {
      const map = autoMap(t, csv.headers);
      const hits = map.filter(Boolean).length;
      let ev = 0, evn = 0;
      map.forEach((f, i) => {
        const fd = t.fields.find(x => x.f === f); if (!fd) return;
        const vals = csv.rows.map(r => r[i]).filter(Boolean).slice(0, 20); if (!vals.length) return;
        if (fd.type === 'selection') { evn++; ev += vals.filter(v => selectionHit(fd, v) !== null).length / vals.length; }
        if (fd.type === 'ref') { evn++; ev += vals.filter(v => refFind(fd, v, PRIV || PUB)).length / vals.length; }
      });
      const reqOk = t.fields.filter(f => f.req).every(f => map.includes(f.f));
      const score = Math.round(100 * (0.65 * hits / Math.max(csv.headers.length, 1) + 0.25 * (evn ? ev / evn : 0.5) + (reqOk ? 0.1 : 0)));
      return { t, map, score: Math.min(100, score), reqOk };
    }).sort((a, b) => b.score - a.score);
  }

  // ---- checking one row
  const EMAIL = /^[^\s@()<>,;]+@[^\s@()<>,;]+\.[a-z]{2,}$/i;
  const townOf = v => {
    const n = norm(v); if (!n) return { town: '' };
    const m = C.towns.find(t => norm(t) === n); if (m) return { town: m, fixed: m !== v.trim() };
    const loc = C.localities[n]; if (loc) return { town: loc, locality: v.trim() };
    return { town: v.trim(), outside: true };
  };
  const BOOL_T = ['yes', 'sim', 'true', '1', 'x', 'y', 's', 'ok'], BOOL_F = ['no', 'nao', 'false', '0', 'n'];
  const listOf = v => String(v || '').split(/[,;/|]/).map(s => s.trim()).filter(Boolean);

  function knownSkills() { const f = feedNow(); const s = new Set(C.skills); if (f) { f.mentors.forEach(r => r.expertise.forEach(x => s.add(x))); f.suppliers.forEach(r => r.capabilities.forEach(x => s.add(x))); } return s; }
  function knownTags() { const f = feedNow(); return new Set((f?.talent || []).flatMap(r => r.tags)); }
  // Existing contacts or records, by name: for res.partner every hub list is the same Odoo model.
  function existing(t) {
    const f = feedNow(); if (!f) return [];
    if (t.model === 'res.partner') return [...f.mentors.map(r => ({ r, ent: 'mentors' })), ...f.suppliers.map(r => ({ r, ent: 'suppliers' })), ...f.talent.map(r => ({ r, ent: 'talent' }))];
    if (t.entity) return f[t.entity].map(r => ({ r, ent: t.entity }));
    return [];
  }
  const inPublic = (ent, id) => !!PUB?.[ent]?.some(x => x.id === id);

  function check() {
    const t = state.target, csv = state.csv, f = feedNow();
    const ks = knownSkills(), kt = knownTags();
    const ex = existing(t);
    const seen = new Map();
    state.rows = csv.rows.map((raw, ri) => {
      const rec = { n: ri + 2, raw, vals: {}, show: {}, issues: [], status: 'new', match: null, changes: [], newSkills: [], newTags: [] };
      const add = (level, msg) => rec.issues.push({ level, msg });
      t.fields.forEach(fd => {
        const i = state.map.indexOf(fd.f); const v = i >= 0 ? raw[i] : '';
        if (!v) { if (fd.req) add('error', `${fd.label} is required`); if (fd.type === 'bool' && i >= 0) add('warn', 'No consent recorded: the record stays out of the public feed'); return; }
        switch (fd.type) {
          case 'email': if (EMAIL.test(v)) { rec.vals[fd.f] = v; rec.show[fd.f] = v; } else add('error', `"${v}" is not an e-mail address`); break;
          case 'town': { const r = townOf(v); rec.vals[fd.f] = r.town; rec.show[fd.f] = r.town;
            if (r.fixed) add('info', `"${v}" written as ${r.town}`); if (r.locality) add('info', `${r.locality} is in ${r.town}, one of the 16 municipalities`);
            if (r.outside) add('warn', `${v} is not one of the Algarve's 16 municipalities`); break; }
          case 'selection': { const k = selectionHit(fd, v);
            if (k === null) add('warn', `"${v}" is not a ${fd.label.toLowerCase()} Odoo knows (${Object.keys(fd.options).map(x => x.replace(/_/g, ' ')).join(', ')}): left empty`);
            else { rec.vals[fd.f] = fd.f === 'is_company' ? k === 'true' : k; rec.show[fd.f] = fd.f === 'is_company' ? (k === 'true' ? 'company' : 'individual') : k.replace(/_/g, ' '); } break; }
          case 'bool': { const n = norm(v);
            if (BOOL_T.includes(n)) { rec.vals[fd.f] = true; rec.show[fd.f] = 'yes'; }
            else if (BOOL_F.includes(n)) { rec.vals[fd.f] = false; rec.show[fd.f] = 'no'; if (fd.f === 'aih_consent') add('info', 'No consent: kept in Odoo, never in the public feed'); }
            else add('warn', `"${v}" is not yes or no: left empty`); break; }
          case 'skills': case 'tags': { const items = listOf(v); const known = fd.type === 'skills' ? ks : kt;
            const fresh = items.filter(x => ![...known].some(k => norm(k) === norm(x)));
            const canon = items.map(x => [...known].find(k => norm(k) === norm(x)) || x);
            rec.vals[fd.f] = canon; rec.show[fd.f] = canon.join(', ');
            if (fresh.length) { (fd.type === 'skills' ? rec.newSkills : rec.newTags).push(...fresh); add('info', `New ${fd.type === 'skills' ? 'skill' : 'tag'}${fresh.length > 1 ? 's' : ''} created first: ${fresh.join(', ')}`); } break; }
          case 'ref': { const r = refFind(fd, v, f);
            if (r) { rec.vals[fd.f] = r.odoo.id; rec.show[fd.f] = r.name; rec.refIds = { ...(rec.refIds || {}), [fd.f]: r.id }; }
            else if (fd.req) add('error', `"${v}" is not a ${fd.label.toLowerCase()} in Odoo`);
            else add('warn', `"${v}" is not a ${fd.label.toLowerCase()} in Odoo: left empty`); break; }
          case 'url': { const u = /^https?:\/\//i.test(v) ? v : `https://${v}`; rec.vals[fd.f] = u; rec.show[fd.f] = u; break; }
          default: rec.vals[fd.f] = v; rec.show[fd.f] = v;
        }
      });
      // duplicates in the file
      const key = t.id === 'participants' ? `${rec.vals.vibathon_id}|${norm(rec.vals.email || rec.vals.name)}` : norm(rec.vals.name);
      if (rec.vals.name) { if (seen.has(key)) add('error', `Same as row ${seen.get(key)} in this file`); else seen.set(key, rec.n); }
      // duplicates against Odoo (the feed)
      if (rec.vals.name && t.id === 'participants' && PRIV && isStaff()) {
        const vib = PRIV.vibathons.find(v => v.odoo.id === rec.vals.vibathon_id);
        const p = vib?.participants?.find(p => norm(p.email) === norm(rec.vals.email) || norm(p.name) === norm(rec.vals.name));
        if (p) { rec.status = 'same'; add('info', `Already registered for ${vib.name}`); }
      } else if (rec.vals.name) {
        const hit = ex.find(x => norm(x.r.name) === norm(rec.vals.name));
        if (hit) {
          rec.match = hit; rec.status = 'update';
          if (!inPublic(hit.ent, hit.r.id)) add('info', `In Odoo but not in the public feed (${hit.r.published === false ? 'not published' : hit.r.consent === false ? 'no consent' : 'its parent is not public'})`);
          // what would change, compared with the feed
          const same = hit.ent === t.entity;
          t.fields.forEach(fd => {
            if (!fd.feed || fd.f === 'name' || !(fd.f in rec.vals) || !same) return;
            let old = hit.r[fd.feed]; let nv = rec.vals[fd.f];
            if (fd.feedMap) old = Object.entries(fd.feedMap).find(([, x]) => x === old)?.[0] === 'true';
            if (fd.type === 'ref') old = (PRIV || PUB)?.[fd.ref]?.find(r => r.id === old)?.odoo.id ?? null;
            const a = JSON.stringify(Array.isArray(old) ? [...old].map(norm).sort() : typeof old === 'string' ? norm(old) : old ?? null);
            const b = JSON.stringify(Array.isArray(nv) ? [...nv].map(norm).sort() : typeof nv === 'string' ? norm(nv) : nv ?? null);
            if (a !== b) rec.changes.push({ f: fd.f, label: fd.label, from: Array.isArray(old) ? old.join(', ') : fd.type === 'ref' ? ((PRIV || PUB)[fd.ref].find(r => r.odoo.id === old)?.name ?? old) : old, to: rec.show[fd.f] });
          });
          const flag = Object.keys(t.fixed).find(k => /^aih_is_/.test(k));
          if (!same && flag) rec.changes.push({ f: flag, label: `also a ${t.label.toLowerCase().replace(/s$/, '')}`, from: hit.ent.replace(/s$/, ''), to: 'yes', flag: true });
          if (!rec.changes.length) { rec.status = 'same'; add('info', 'Already in Odoo with the same values: nothing to change'); }
          else add('info', `Already in Odoo (${hit.ent}, id ${hit.r.odoo.id}): ${rec.changes.length} change${rec.changes.length > 1 ? 's' : ''}`);
        }
      }
      if (rec.issues.some(x => x.level === 'error')) rec.status = 'error';
      return rec;
    });
  }

  // ---- the Odoo calls (JSON-2) and the Odoo import CSV
  const odooHost = () => C.odoo[$('input[name=imp-odoo]:checked')?.value || 'experiment'];
  const ph = (model, name) => `<${model}: ${name}>`;
  function vals(rec, forWrite) {
    const t = state.target, o = {};
    const put = (k, v) => { if (v !== undefined && v !== null && !(Array.isArray(v) && !v.length)) o[k] = v; };
    t.fields.forEach(fd => {
      if (!(fd.f in rec.vals)) return;
      if (forWrite && !rec.changes.some(c => c.f === fd.f)) return;
      const v = rec.vals[fd.f];
      if (fd.type === 'skills') put(fd.f, [[6, 0, v.map(x => ph('aih.skill', x))]]);
      else if (fd.type === 'tags') put(fd.f, [[6, 0, v.map(x => ph('res.partner.category', x))]]);
      else put(fd.f, v);
    });
    if (forWrite) { rec.changes.filter(c => c.flag).forEach(c => { o[c.f] = true; }); return o; }
    Object.assign(o, t.fixed);
    const sim = $('[data-opt-sim]')?.checked;
    if (t.model === 'res.partner') { o.aih_feed_key = `p-imp-${slug(rec.vals.name)}`; if (sim) o.aih_simulated = true; }
    else if (t.id !== 'participants') { o.feed_key = `${t.id === 'startups' ? 'co' : t.id}-imp-${slug(rec.vals.name)}`; if (sim) o.simulated = true; }
    return o;
  }
  function calls() {
    const t = state.target, host = odooHost(), out = [];
    const ok = state.rows.filter(r => r.status === 'new');
    const upd = $('[data-opt-dup]')?.value === 'write' ? state.rows.filter(r => r.status === 'update') : [];
    const size = Number($('[data-opt-batch]')?.value || 50);
    const used = [...ok, ...upd];
    const skillNames = [...new Set(used.flatMap(r => t.fields.filter(f => f.type === 'skills').flatMap(f => r.vals[f.f] || [])))];
    const tagNames = [...new Set(used.flatMap(r => t.fields.filter(f => f.type === 'tags').flatMap(f => r.vals[f.f] || [])))];
    const newSkills = [...new Set(used.flatMap(r => r.newSkills))], newTags = [...new Set(used.flatMap(r => r.newTags))];
    if (skillNames.length) {
      out.push({ model: 'aih.skill', method: 'search_read', why: 'Look up the ids of the skills the rows name (the values in angle brackets below).', body: { domain: [['name', 'in', skillNames]], fields: ['id', 'name'] } });
      if (newSkills.length) out.push({ model: 'aih.skill', method: 'create', why: `Create the skill${newSkills.length > 1 ? 's' : ''} Odoo does not have yet.`, body: { vals_list: newSkills.map(name => ({ name })) } });
    }
    if (tagNames.length) {
      out.push({ model: 'res.partner.category', method: 'search_read', why: 'Look up the ids of the contact tags.', body: { domain: [['name', 'in', tagNames]], fields: ['id', 'name'] } });
      if (newTags.length) out.push({ model: 'res.partner.category', method: 'create', why: 'Create the tags Odoo does not have yet.', body: { vals_list: newTags.map(name => ({ name })) } });
    }
    for (let i = 0; i < ok.length; i += size) {
      const b = ok.slice(i, i + size);
      out.push({ model: t.model, method: 'create', why: `Create ${b.length} record${b.length > 1 ? 's' : ''} (rows ${b.map(r => r.n).join(', ')}).`, body: { vals_list: b.map(r => vals(r, false)) } });
    }
    for (const r of upd) out.push({ model: t.model, method: 'write', why: `Update ${r.vals.name} (row ${r.n}): ${r.changes.map(c => c.label.toLowerCase()).join(', ')}.`, body: { ids: [r.match.r.odoo.id], vals: vals(r, true) } });
    return { host, out };
  }
  // JSON as Odoo's docs print it, with short arrays of plain values kept on one line.
  const pretty = v => {
    let t = JSON.stringify(v, null, 2), prev;
    do { prev = t; t = t.replace(/\[\s*((?:[^\[\]{}\n]|\n|\[[^\[\]\n{}]*\])*?)\s*\]/g, (m, inner) => { const one = `[${inner.split(/,\s*\n\s*/).join(', ').trim()}]`; return one.length <= 88 && !one.includes('\n') ? one : m; }); } while (t !== prev);
    return t;
  };
  const callText = (host, c) => `POST ${host.url}/json/2/${c.model}/${c.method}\nAuthorization: bearer <API key of a user allowed to write>\nX-Odoo-Database: ${host.db}\nContent-Type: application/json\n\n${pretty(c.body)}`;
  function odooCSV() {
    const t = state.target, rows = state.rows.filter(r => r.status === 'new');
    const sim = $('[data-opt-sim]')?.checked;
    const fixed = Object.keys(t.fixed);
    const cols = ['id', ...t.fields.filter(fd => state.map.includes(fd.f)).map(fd => fd.f), ...fixed];
    if (sim) cols.push(t.model === 'res.partner' ? 'aih_simulated' : t.id === 'participants' ? null : 'simulated');
    const cs = cols.filter(Boolean);
    const cell = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const val = (r, col) => {
      if (col === 'id') return `aih_import.${t.model.replace(/\./g, '_')}_${slug(r.vals.name)}`;
      if (col in t.fixed) return t.fixed[col] === true ? '1' : t.fixed[col] === false ? '0' : t.fixed[col];
      if (col === 'aih_simulated' || col === 'simulated') return '1';
      const fd = t.fields.find(x => x.f === col); const v = r.vals[col];
      if (v === undefined) return '';
      if (fd.type === 'bool') return v ? '1' : '0';
      if (fd.f === 'is_company') return v ? '1' : '0';
      if (fd.type === 'skills' || fd.type === 'tags') return v.join(',');
      if (fd.type === 'ref') return r.show[col];
      return v;
    };
    return [cs.join(','), ...rows.map(r => cs.map(c => cell(val(r, c))).join(','))].join('\r\n') + '\r\n';
  }

  // ---- drawing the importer
  const TAG = { new: 'tag-ok', update: 'tag-navy', same: '', error: 'tag-accent' };
  const pill = s => `<span class="tag ${TAG[s]}">${{ new: 'New', update: 'Update', same: 'Unchanged', error: 'Left out' }[s]}</span>`;
  function draw() {
    const out = $('[data-imp-out]'); if (!state.csv) { out.hidden = true; return; }
    out.hidden = false;
    const t = state.target, csv = state.csv;
    // b. detection
    const cand = state.cands;
    $('[data-detect]').innerHTML = `<p class="imp-hint">${esc(state.name)}: ${num(csv.rows.length)} rows, ${csv.headers.length} columns, separated by ${{ ',': 'commas', ';': 'semicolons', '\t': 'tabs' }[csv.delim]}.</p><fieldset class="imp-cands"><legend class="vh">Hub model</legend>${cand.map((c, i) => `<label class="imp-cand${c.t.id === t.id ? ' is-on' : ''}"><input type="radio" name="imp-target" value="${c.t.id}"${c.t.id === t.id ? ' checked' : ''}><span class="imp-cand-n">${esc(c.t.label)}${i === 0 ? ' <em>best fit</em>' : ''}</span><code>${esc(c.t.model)}</code><span class="imp-cand-bar" aria-hidden="true"><i style="width:${c.score}%"></i></span><span class="imp-cand-s">${c.score}%</span></label>`).join('')}</fieldset><p class="imp-hint">${esc(t.note)}</p>`;
    // c. mapping
    const opts = sel => `<option value="">Leave out</option>${t.fields.map(fd => `<option value="${fd.f}"${fd.f === sel ? ' selected' : ''}>${esc(fd.label)}${fd.req ? ' (required)' : ''} · ${esc(fd.f)}</option>`).join('')}`;
    const missing = t.fields.filter(fd => fd.req && !state.map.includes(fd.f));
    $('[data-map]').innerHTML = `<thead><tr><th scope="col">Column in your file</th><th scope="col">First value</th><th scope="col">Odoo field</th></tr></thead><tbody>${csv.headers.map((hd, i) => `<tr><th scope="row">${esc(hd || `(column ${i + 1})`)}</th><td class="imp-ex" data-th="First value">${esc(csv.rows.find(r => r[i])?.[i] || '')}</td><td data-th="Odoo field"><label class="vh" for="map-${i}">Odoo field for ${esc(hd)}</label><select id="map-${i}" data-map-i="${i}" class="${state.map[i] ? 'is-mapped' : ''}">${opts(state.map[i])}</select></td></tr>`).join('')}</tbody>${missing.length ? `<tfoot><tr><td colspan="3" class="imp-miss" data-th="Missing">Required and not mapped: ${missing.map(m => esc(m.label)).join(', ')}. Every row will be left out until a column is mapped to it.</td></tr></tfoot>` : ''}`;
    // d. preview
    const cols = t.fields.filter(fd => state.map.includes(fd.f));
    const c = { new: 0, update: 0, same: 0, error: 0 }; let warns = 0;
    state.rows.forEach(r => { c[r.status]++; warns += r.issues.filter(x => x.level === 'warn').length; });
    $('[data-sum]').innerHTML = `<b>${num(state.rows.length)}</b> rows: <span class="tag tag-ok">${c.new} new</span> <span class="tag tag-navy">${c.update} update${c.update === 1 ? '' : 's'}</span> <span class="tag">${c.same} unchanged</span> <span class="tag tag-accent">${c.error} left out</span>${warns ? ` · ${warns} warning${warns > 1 ? 's' : ''}` : ''}. Checked against the ${isStaff() ? 'private' : 'public'} feed.`;
    const issue = x => `<li class="iss-${x.level}"><span class="vh">${x.level === 'error' ? 'Error' : x.level === 'warn' ? 'Warning' : 'Note'}: </span>${esc(x.msg)}</li>`;
    const recCell = r => {
      const nameF = cols.find(fd => fd.f === 'name');
      const pairs = cols.filter(fd => fd !== nameF).map(fd => {
        const ch = r.changes.find(x => x.f === fd.f); const v = r.show[fd.f];
        if (!ch && (v === undefined || v === '')) return '';
        return `<li><span class="imp-k">${esc(fd.label)}</span> ${ch ? `<del>${esc(ch.from ?? 'empty')}</del> <ins>${esc(ch.to)}</ins>` : esc(v)}</li>`;
      }).join('') + r.changes.filter(c => c.flag).map(c => `<li><span class="imp-k">Flag</span> <ins>${esc(c.label)}</ins></li>`).join('');
      return `<p class="imp-rec-n">${esc(r.show.name || r.raw[state.map.indexOf('name')] || '(no name)')}</p><ul class="imp-kv">${pairs}</ul>`;
    };
    $('[data-prev]').innerHTML = `<thead><tr><th scope="col">Row</th><th scope="col">Result</th><th scope="col">Record</th><th scope="col">Checks</th></tr></thead><tbody>${state.rows.map(r => `<tr class="row-${r.status}"><th scope="row" class="imp-rn">Row ${r.n}</th><td data-th="Result">${pill(r.status)}${r.match ? `<span class="imp-id">Odoo id ${r.match.r.odoo.id}</span>` : ''}</td><td data-th="Record" class="imp-rec">${recCell(r)}</td><td data-th="Checks"><ul class="imp-iss">${r.issues.map(issue).join('') || '<li class="iss-ok">No problems</li>'}</ul></td></tr>`).join('')}</tbody>`;
    // e. calls
    const { host, out: list } = calls();
    const custom = !['res.partner'].includes(t.model);
    $('[data-target-note]').textContent = $('input[name=imp-odoo]:checked').value === 'official'
      ? (custom ? `${t.model} exists only where the addon is installed: their Odoo needs it first (see section 6). The contacts and tags calls would work there today.` : `Contacts exist in every Odoo; the aih_ fields need the addon or the same fields added with Studio. Their API key and database name stay with them.`)
      : `Our experimentation Odoo (${host.version}, local to the PrompTugal team), which has the addon.`;
    const head = `<p class="od-calls-h"><b>${list.length} Odoo call${list.length === 1 ? '' : 's'}</b>, in order, over the Odoo 19 JSON-2 API. None is sent: this is a prototype.</p>`;
    $('[data-calls]').innerHTML = list.length ? head + list.map((cl, i) => `<details class="odoo-call"${i < 3 ? ' open' : ''}><summary><span class="odoo-call-verb">POST</span> <code>/json/2/${esc(cl.model)}/${esc(cl.method)}</code> <span class="odoo-call-flag">not sent: prototype</span></summary><p class="odoo-call-note od-why">${i + 1}. ${esc(cl.why)}</p><pre><code>${esc(callText(host, cl))}</code></pre></details>`).join('') + `<p class="odoo-call-note od-calls-f">Values in angle brackets are ids the first call looks up. Imported records arrive unpublished: someone at Algarve Evolution checks consent and publishes them in Odoo.</p>`
      : head + '<p class="odoo-call-note od-calls-f">Nothing to send: no row is new or changed.</p>';
    const nNew = c.new;
    $('[data-csv-note]').textContent = nNew ? `The CSV holds the ${nNew} new record${nNew > 1 ? 's' : ''} with external ids, in Odoo's import format: in Odoo, open the list, Favourites, Import records, and load it. ${c.update ? 'Updates are left out of the CSV: they need the write calls, or an export from Odoo with its ids.' : ''}` : 'No new records for the CSV.';
    $('[data-dl-csv]').disabled = !nNew;
  }

  function load(text, name, sample) {
    state.text = text; state.name = name; state.sample = sample;
    const csv = parseCSV(text);
    const st = $('[data-imp-status]');
    if (!csv.headers.length || !csv.rows.length) { state.csv = null; st.textContent = 'That does not look like a table with a header row and at least one row.'; draw(); return; }
    state.csv = csv; state.cands = detect(csv);
    pick(state.cands[0].t.id);
    $('[data-opt-sim]').checked = sample || csv.rows.some(r => r.some(c => /\(simulated\)/i.test(c)));
    st.textContent = `Read ${name}: ${csv.rows.length} rows. Best fit: ${state.target.label} (${state.cands[0].score}%).`;
    draw();
  }
  function pick(id) {
    state.target = C.targets.find(t => t.id === id);
    state.map = state.cands.find(c => c.t.id === id)?.map || autoMap(state.target, state.csv.headers);
    check();
  }
  function rerun() { if (!state.csv) return; state.cands = detect(state.csv); check(); draw(); }

  if (imp) {
    $$('[data-sample]', imp).forEach(b => b.addEventListener('click', async () => {
      const t = C.targets.find(x => x.id === b.dataset.sample);
      $$('[data-sample]', imp).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      try { const txt = await fetch(`/hub/odoo-samples/${t.sample}`).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }); $('[data-paste]').value = txt; load(txt, t.sample, true); }
      catch { $('[data-imp-status]').textContent = 'The sample could not be loaded.'; }
    }));
    const fileIn = $('[data-file]'), drop = $('[data-drop]');
    const readFile = file => { if (!file) return; if (file.size > 2e6) { $('[data-imp-status]').textContent = 'That file is over 2 MB; try a smaller export.'; return; } const fr = new FileReader(); fr.onload = () => { $('[data-paste]').value = String(fr.result); $$('[data-sample]', imp).forEach(x => x.setAttribute('aria-pressed', 'false')); load(String(fr.result), file.name, false); }; fr.readAsText(file); };
    fileIn.addEventListener('change', () => readFile(fileIn.files[0]));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', e => readFile(e.dataTransfer?.files?.[0]));
    let tm; $('[data-paste]').addEventListener('input', e => { clearTimeout(tm); tm = setTimeout(() => { const v = e.target.value; if (v.trim()) { $$('[data-sample]', imp).forEach(x => x.setAttribute('aria-pressed', 'false')); load(v, 'Pasted table', false); } }, 400); });
    imp.addEventListener('change', e => {
      const el = e.target;
      if (el.name === 'imp-target') { pick(el.value); draw(); }
      else if (el.dataset.mapI !== undefined) {
        const i = Number(el.dataset.mapI); const v = el.value;
        if (v) state.map = state.map.map(x => (x === v ? '' : x)); // one column per field
        state.map[i] = v; check(); draw();
      } else if (el.matches('[data-opt-sim],[data-opt-dup],[data-opt-batch],input[name=imp-odoo]')) draw();
    });
    $('[data-dl-csv]').addEventListener('click', () => {
      const blob = new Blob([odooCSV()], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${state.target.id}-odoo-import.csv`;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
    $('[data-copy-calls]').addEventListener('click', async e => {
      const { host, out } = calls(); const txt = out.map(c => callText(host, c)).join('\n\n');
      try { await navigator.clipboard.writeText(txt); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Copy failed: select the text instead'; }
      setTimeout(() => { e.target.textContent = 'Copy the calls'; }, 1800);
    });
  }

  // ============================================================ 2. ideas and needs
  const KEY = 'aih-odoo-requests-v1';
  const laneName = Object.fromEntries(C.lanes.map(l => [l.id, l.label]));
  const kindName = Object.fromEntries(C.kinds.map(k => [k.id, k.label]));
  const kindLane = Object.fromEntries(C.kinds.map(k => [k.id, k.lane]));
  let reqs = store.get(KEY);
  if (!Array.isArray(reqs?.items)) reqs = { items: C.seeds.map(s => ({ ...s })) };
  const saveReqs = () => store.set(KEY, reqs);
  const taskCall = r => {
    const host = C.odoo.experiment;
    const body = { vals_list: [{
      name: r.title, project_id: ph('project.project', 'AE Innovation Hub: ideas and needs'),
      description: `<p>${esc(r.details || '')}</p><p>For: ${esc(r.who || 'not given')}</p>`,
      ...(r.due ? { date_deadline: `${r.due} 17:00:00` } : {}),
      tag_ids: [[6, 0, [ph('project.tags', kindName[r.kind]), ph('project.tags', laneName[r.lane])]]],
    }] };
    return `POST ${host.url}/json/2/project.task/create\nAuthorization: bearer <API key>\nX-Odoo-Database: ${host.db}\nContent-Type: application/json\n\n${pretty(body)}`;
  };
  const fmtDate = d => { try { return new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
  function drawReqs() {
    const staff = persona === 'staff';
    C.lanes.forEach(l => {
      const lane = $(`[data-lane="${l.id}"]`); if (!lane) return;
      const items = reqs.items.filter(r => r.lane === l.id).sort((a, b) => (a.done - b.done) || String(a.due || '9').localeCompare(String(b.due || '9')));
      $('[data-lane-count]', lane).textContent = items.filter(r => !r.done).length;
      $('[data-lane-list]', lane).innerHTML = items.map(r => `<li class="req-card${r.done ? ' is-done' : ''}" data-id="${esc(r.id)}">
        <p class="req-meta"><span class="tag tag-navy">${esc(kindName[r.kind] || r.kind)}</span>${r.simulated ? '<span class="sim-badge" title="Invented for the prototype">Simulated</span>' : '<span class="tag tag-ok">Added in this browser</span>'}${r.done ? '<span class="tag">Done</span>' : ''}</p>
        <h4>${esc(r.title)}</h4>
        <p class="req-who">${r.who ? `For: ${esc(r.who)}` : 'For: not given'}${r.due ? ` · due ${esc(fmtDate(r.due))}` : ''}</p>
        ${r.details ? `<p class="req-det">${esc(r.details)}</p>` : ''}${r.how ? `<p class="req-how"><b>How:</b> ${esc(r.how)}</p>` : ''}
        ${staff ? `<div class="req-ctl"><label>Triage <select data-act="lane">${C.lanes.map(x => `<option value="${x.id}"${x.id === r.lane ? ' selected' : ''}>${esc(x.short)}</option>`).join('')}</select></label><button type="button" class="btn btn-sm" data-act="done">${r.done ? 'Reopen' : 'Mark done'}</button>${r.simulated ? '' : '<button type="button" class="btn btn-sm" data-act="del">Remove</button>'}</div>` : ''}
        <details class="odoo-call req-call"><summary><span class="odoo-call-verb">POST</span> <code>project.task/create</code> <span class="odoo-call-flag">not sent: prototype</span></summary><pre><code>${esc(taskCall(r))}</code></pre></details>
      </li>`).join('') || '<li class="req-empty">Nothing here yet.</li>';
    });
  }
  const form = $('[data-req-form]');
  if (form) {
    const sug = () => { $('[data-req-suggest]').textContent = laneName[kindLane[form.kind.value]]; };
    form.kind.addEventListener('change', sug); sug();
    form.addEventListener('submit', e => {
      e.preventDefault();
      const r = { id: `req-${Date.now().toString(36)}`, kind: form.kind.value, title: form.title.value.trim(), who: form.who.value.trim(), due: form.due.value, details: form.details.value.trim(), lane: kindLane[form.kind.value], simulated: false, created: new Date().toISOString().slice(0, 10), by: persona };
      if (!r.title) return;
      reqs.items.unshift(r); saveReqs(); drawReqs(); form.reset(); sug(); setWho();
      const card = $(`[data-id="${r.id}"]`); if (card) { card.classList.add('is-new'); card.setAttribute('tabindex', '-1'); card.focus({ preventScroll: false }); }
    });
    $('[data-req-board]').addEventListener('change', e => {
      if (e.target.dataset.act !== 'lane') return;
      const r = reqs.items.find(x => x.id === e.target.closest('[data-id]').dataset.id); r.lane = e.target.value; saveReqs(); drawReqs();
      $(`[data-id="${r.id}"] select`)?.focus();
    });
    $('[data-req-board]').addEventListener('click', e => {
      const act = e.target.dataset?.act; if (!act || act === 'lane') return;
      const id = e.target.closest('[data-id]').dataset.id; const r = reqs.items.find(x => x.id === id);
      if (act === 'done') r.done = !r.done; if (act === 'del') reqs.items = reqs.items.filter(x => x.id !== id);
      saveReqs(); drawReqs();
    });
  }
  const WHO = { founder: 'Founders in the programme', mentor: 'Mentors', challenger: 'A company with a challenge', supplier: 'Suppliers', participant: 'Vibathon participants', staff: 'Algarve Evolution team', visitor: '' };
  function setWho() { const w = $('[data-req-who]'); if (w && !w.value) w.value = WHO[persona] || ''; }

  // ============================================================ 3. public and private
  function reasonOf(ent, r, pub) {
    if (r.published === false) return 'Not published';
    if (r.consent === false) return 'No consent';
    const parent = r.company_id && !pub.companies.some(c => c.id === r.company_id) ? (PRIV.companies.find(c => c.id === r.company_id)?.name || r.company_id)
      : r.vibathon_id && !pub.vibathons.some(v => v.id === r.vibathon_id) ? r.vibathon_id
      : r.programme_id && !pub.programmes.some(p => p.id === r.programme_id) ? r.programme_id : null;
    return parent ? `Its parent is not public (${parent})` : 'Its parent is not public';
  }
  function drawFeeds() {
    const show = persona === 'staff' && PRIV;
    // the models table
    $$('[data-count="priv"]').forEach(td => { td.innerHTML = show ? num(countOf(PRIV, td.dataset.key)) : '<span class="od-locked">locked</span>'; });
    // the feed table and its bars
    const ents = $$('[data-ent]');
    const max = Math.max(...ents.map(tr => show ? (PRIV[tr.dataset.ent] || []).length : (PUB?.meta.counts[tr.dataset.ent] || 0)), 1);
    ents.forEach(tr => {
      const e = tr.dataset.ent, pub = PUB ? PUB.meta.counts[e] : null, priv = show ? (PRIV[e] || []).length : null;
      $('[data-priv]', tr).innerHTML = show ? num(priv) : '<span class="od-locked">locked</span>';
      $('[data-held]', tr).textContent = show ? num(priv - pub) : '?';
      $('[data-held]', tr).classList.toggle('is-held', !!show && priv > pub);
      if (pub !== null) {
        $('.b-pub', tr).setAttribute('width', (200 * pub / max).toFixed(1));
        $('.b-priv', tr).setAttribute('width', show ? (200 * priv / max).toFixed(1) : '0');
      }
    });
    const box = $('[data-fx-private]'); if (!box) return;
    if (!show) { box.innerHTML = `<p class="fx-wait">The private feed is not open in this tab.</p><button type="button" class="btn btn-primary" data-open-key>Enter the access key</button>`; return; }
    const groups = {};
    for (const e of Object.keys(PRIV.meta.counts)) {
      const ids = new Set((PUB[e] || []).map(r => r.id));
      for (const r of PRIV[e]) if (!ids.has(r.id)) { const why = reasonOf(e, r, PUB).replace(/ \(.*$/, ''); (groups[why] ||= []).push({ e, r, full: reasonOf(e, r, PUB) }); }
    }
    const pf = [
      ['Session notes', PRIV.sessions.filter(s => s.notes).length, 'aih.session.notes'],
      ['Supplier contacts', PRIV.suppliers.filter(s => s.contact).length, 'res.partner email, phone'],
      ['Vibathon participants', countOf(PRIV, 'participants'), 'aih.vibathon.participant'],
      ['Jury scores', countOf(PRIV, 'scores'), 'aih.project.score'],
      ['Team names without consent', PRIV.projects.reduce((n, p) => n + p.team.length, 0) - PUB.projects.reduce((n, p) => n + p.team.length, 0), 'aih.project.team_ids'],
      ['Links emptied (a session\'s mentor, an application\'s supplier)', PUB.sessions.filter(s => s.mentor_id === null).length + PUB.applications.filter(a => a.supplier_id === null).length, 'set to null'],
    ];
    const label = ({ e, r }) => r.name || r.title || (e === 'sessions' ? `${r.topic} (${r.date})` : e === 'kpis' ? `${r.company_id}, month ${r.month}` : r.id);
    box.innerHTML = `<h4>Withheld from the public feed, record by record</h4>${Object.entries(groups).map(([why, list]) => `<details class="fx-g"${list.length < 8 ? ' open' : ''}><summary><b>${esc(why)}</b> · ${list.length}</summary><ul>${list.map(x => `<li><span class="fx-e">${esc(x.e)}</span> ${esc(label(x))} ${x.r.simulated ? '<span class="sim-badge">Simulated</span>' : ''}${x.full !== why ? `<span class="fx-why2">${esc(x.full.slice(why.length).replace(/^ \(|\)$/g, ''))}</span>` : ''}</li>`).join('')}</ul></details>`).join('')}
      <h4>Private fields</h4><table class="fx-pf"><tbody>${pf.map(([a, n, m]) => `<tr><th scope="row">${esc(a)}</th><td class="od-n">${num(n)}</td><td><code>${esc(m)}</code></td></tr>`).join('')}</tbody></table>`;
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-open-key]')) return;
    const sel = document.querySelector('[data-persona-select]'); if (!sel) return;
    sel.value = 'visitor'; sel.dispatchEvent(new Event('change')); sel.value = 'staff'; sel.dispatchEvent(new Event('change'));
  });

  // ============================================================ wiring
  HUB.publicFeed().then(f => { PUB = f; drawFeeds(); rerun(); }).catch(() => { $('[data-imp-status]') && ($('[data-imp-status]').textContent = 'The public feed could not be read; checks against Odoo are off.'); });
  HUB.on('persona', id => {
    persona = id; drawReqs(); setWho();
    if (!state.csv) $$('[data-sample]').forEach(b => b.classList.toggle('is-suggested', b.dataset.for.split(' ').includes(id) && id !== 'staff'));
    if (PUB) { drawFeeds(); rerun(); }
  });
  HUB.on('private', f => { PRIV = f; if (PUB) { drawFeeds(); rerun(); } });
  drawReqs();
})();
