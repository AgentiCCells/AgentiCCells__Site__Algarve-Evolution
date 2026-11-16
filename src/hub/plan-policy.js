// The plan broker's policy: which Odoo calls a signed plan may contain. One file, used twice:
//   - scripts/odoo/apply-plan.mjs loads it (node:vm) and checks every call again before it applies anything;
//   - the Plan page (/plan/) loads it to show the same checks in the browser before anyone signs.
// The broker never trusts the checks written in a plan; it runs these itself. Change this file in a reviewed commit.
// Plain script, no dependencies: sets globalThis.PlanPolicy. Owner: odoo@AgentiCCells.dinis. Apache-2.0.
(function (root) {
  'use strict';
  const READ = ['search', 'search_read', 'read', 'search_count', 'name_search'];
  const WRITE = ['create', 'write'];
  // Hub models the broker may create and update (the addon's "Plan broker" group: create and write, no delete).
  const HUB = ['aih.programme', 'aih.programme.company', 'aih.session', 'aih.kpi', 'aih.reflection', 'aih.challenge',
    'aih.application', 'aih.vibathon', 'aih.vibathon.jury', 'aih.vibathon.participant', 'aih.project',
    'aih.project.score', 'aih.community'];
  const MODELS = {};
  HUB.forEach(m => { MODELS[m] = { methods: READ.concat(WRITE), why: 'a hub model' }; });
  MODELS['aih.challenge'].methods.push('action_compute_matches');
  MODELS['aih.project'].methods.push('message_post');
  // Read only: lookups the hub's calls make first (skills, contact tags, events).
  ['aih.skill', 'aih.hub', 'aih.activity', 'res.partner.category', 'event.event'].forEach(m => { MODELS[m] = { methods: READ.slice(), why: 'read only' }; });
  // Contacts (mentors, suppliers, talent) live in res.partner: only the hub's own fields and a few basics.
  MODELS['res.partner'] = {
    methods: READ.concat(WRITE, ['activity_schedule']),
    why: 'hub contacts: hub fields only',
    fields: ['name', 'email', 'phone', 'is_company', 'city', 'website', 'category_id'],
    fieldPrefix: 'aih_',
  };
  // Never, whatever a plan says: users, groups, access rights, settings, other companies.
  const NEVER = /^(res\.users|res\.groups|res\.company|res\.config|ir\.|base\.|auth_|mail\.|bus\.)/;
  const LIMITS = { callsPerItem: 20, recordsPerCall: 50, idsPerCall: 200 };

  // A reference to the result of an earlier call in the same item, as the hub's panels write them:
  // "<id from step 1>", "ids from call 1", "<id returned by the first call>", "<ids from step 1>".
  const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };
  const REF = /^<?\s*(ids?)\s+(?:from|returned by)\s+(?:the\s+)?(?:(first|second|third|fourth|fifth)\s+(?:call|step)|(?:call|step)\s*(\d+))\s*>?$/i;
  function refOf(s) {
    if (typeof s !== 'string') return null;
    const m = s.trim().match(REF); if (!m) return null;
    return { many: m[1].toLowerCase() === 'ids', step: m[2] ? ORD[m[2].toLowerCase()] : Number(m[3]) };
  }
  // A record found by its name: "<res.partner.category: Design>" (the Odoo page's importer writes these).
  const NAMED = /^<([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+):\s*(.+)>$/;
  function namedOf(s) { const m = typeof s === 'string' && s.trim().match(NAMED); return m ? { model: m[1], name: m[2].trim() } : null; }
  // Anything else in angle brackets is a value a person still has to fill in.
  const HOLE = /^<[^<>]+>$/;

  function walk(v, fn) {
    if (Array.isArray(v)) v.forEach(x => walk(x, fn));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, fn));
    else fn(v);
  }
  function parsePath(path) {
    const m = String(path || '').match(/^\/json\/2\/([a-z][a-z0-9_.]*)\/([a-z_][a-z0-9_]*)$/);
    return m ? { model: m[1], method: m[2] } : null;
  }
  const isWrite = method => method !== undefined && !READ.includes(method);

  function checkCall(call, index) {
    const out = []; const add = (rule, ok, note) => out.push({ call: index + 1, rule, ok, note });
    const verb = String(call && call.method || '').toUpperCase();
    const p = parsePath(call && call.path);
    if (verb !== 'POST' || !p) { add('form', false, `Not an Odoo JSON-2 call (POST /json/2/<model>/<method>): ${verb} ${call && call.path}`); return out; }
    const { model, method } = p;
    const pol = MODELS[model];
    if (NEVER.test(model)) add('model', false, `${model} is never written by the broker (users, rights and settings stay with people).`);
    else if (!pol) add('model', false, `${model} is not on the broker's list (hub models and hub contacts only).`);
    else add('model', true, `${model}: ${pol.why}.`);
    if (method === 'unlink') add('method', false, 'Deleting (unlink) is never allowed: a person deletes in Odoo.');
    else if (method.startsWith('_')) add('method', false, `${method} is a private method.`);
    else if (pol && !pol.methods.includes(method)) add('method', false, `${model}/${method} is not allowed (allowed: ${pol.methods.join(', ')}).`);
    else if (pol) add('method', true, `${method} is allowed on ${model}.`);
    const body = call.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) { add('body', false, 'The JSON body could not be read from the panel.'); return out; }
    // Field limits (contacts) and sizes
    const valsList = Array.isArray(body.vals_list) ? body.vals_list : body.vals ? [body.vals] : [];
    if (pol && pol.fields && (method === 'create' || method === 'write')) {
      const bad = [...new Set(valsList.flatMap(v => Object.keys(v || {})))].filter(f => !pol.fields.includes(f) && !(pol.fieldPrefix && f.startsWith(pol.fieldPrefix)));
      add('fields', !bad.length, bad.length ? `Fields outside the hub's own on ${model}: ${bad.join(', ')}.` : `Only hub fields on ${model}.`);
    }
    if (Array.isArray(body.vals_list) && body.vals_list.length > LIMITS.recordsPerCall) add('size', false, `${body.vals_list.length} records in one call (at most ${LIMITS.recordsPerCall}).`);
    if (Array.isArray(body.ids) && body.ids.length > LIMITS.idsPerCall) add('size', false, `${body.ids.length} ids in one call (at most ${LIMITS.idsPerCall}).`);
    if (method === 'write' && (!Array.isArray(body.ids) || !body.ids.length)) add('ids', false, 'A write needs the ids of the records it changes.');
    // Values still to fill in, and references to earlier calls
    const holes = [], refs = [], named = [];
    walk(body, v => {
      if (v === null || v === undefined) return;
      const r = refOf(v); if (r) { refs.push([v, r]); return; }
      const n = namedOf(v); if (n) { named.push([v, n]); return; }
      if (typeof v === 'string' && HOLE.test(v.trim())) holes.push(v);
    });
    refs.forEach(([v, r]) => add('refs', r.step >= 1 && r.step <= index, r.step >= 1 && r.step <= index ? `"${v}" uses the result of call ${r.step}.` : `"${v}" points to call ${r.step}, which does not come before this one.`));
    named.forEach(([v, n]) => { const ok = !!(MODELS[n.model] && MODELS[n.model].methods.includes('search_read')); add('refs', ok, ok ? `"${v}" is looked up by name in ${n.model}.` : `"${v}": the broker may not look up ${n.model}.`); });
    if (holes.length) add('values', false, `Still to fill in: ${holes.slice(0, 4).join(', ')}${holes.length > 4 ? '…' : ''}.`);
    if (Array.isArray(body.ids) && body.ids.some(v => v === null || v === undefined || v === false)) add('ids', false, 'An id is missing (the record is not in the feed this page read).');
    return out;
  }

  // checkItem(item) -> { ok, writes, checks: [ { call, rule, ok, note } ] }
  function checkItem(item) {
    const calls = Array.isArray(item && item.calls) ? item.calls : [];
    const checks = [];
    if (!calls.length) checks.push({ call: 0, rule: 'calls', ok: false, note: 'No calls.' });
    if (calls.length > LIMITS.callsPerItem) checks.push({ call: 0, rule: 'calls', ok: false, note: `${calls.length} calls (at most ${LIMITS.callsPerItem} in one item).` });
    calls.forEach((c, i) => checks.push(...checkCall(c, i)));
    const writes = calls.filter(c => { const p = parsePath(c && c.path); return p && isWrite(p.method); }).length;
    return { ok: checks.every(c => c.ok), writes, checks };
  }

  // Canonical JSON: keys sorted at every level, no spaces. What a reviewer signs and the broker verifies.
  function canonical(v) {
    if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
    if (v && typeof v === 'object') return `{${Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
    return JSON.stringify(v === undefined ? null : v);
  }
  // The part of a public key that identifies it, and the bytes the fingerprint is taken over.
  const keyId = jwk => canonical({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  // What is signed: the whole plan except the signature.
  const signedPart = plan => { const o = {}; Object.keys(plan).forEach(k => { if (k !== 'signature') o[k] = plan[k]; }); return canonical(o); };

  root.PlanPolicy = { version: 1, MODELS, NEVER: String(NEVER), LIMITS, READ, WRITE, parsePath, isWrite, refOf, namedOf, checkCall, checkItem, canonical, keyId, signedPart };
})(typeof globalThis !== 'undefined' ? globalThis : this);
