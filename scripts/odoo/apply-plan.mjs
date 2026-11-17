#!/usr/bin/env node
// The plan broker: applies a signed plan from the hub's Plan page (/v2/plan/) to the experimentation Odoo.
// docs/v2/PLAN.md. The pattern: snapshot, plan, policy check, signed approval, broker, record.
//
//   node scripts/odoo/apply-plan.mjs plan.json            dry run (the default): checks, reads, prints what it would do
//   node scripts/odoo/apply-plan.mjs plan.json --apply    applies it and appends a record
//
// What it checks, trusting nothing in the plan:
//   1. the signature (ECDSA P-256, SHA-256, over the canonical JSON of the plan without its signature) and that the
//      fingerprint is the key's own;
//   2. that the reviewer's key is on the allow list (scripts/odoo/reviewers.json; a person adds keys) and the plan
//      was not signed in demo mode;
//   3. every call against the broker's own policy (src/hub/plan-policy.js): allowed models and methods only, no unlink,
//      nothing on users or access rights, no value left to fill in. An item with one failing call is skipped whole;
//   4. the target: the experimentation Odoo only (loopback, or a host named in PLAN_ODOO_HOSTS), never
//      algarveevolution.pt, and the database must hold the AE Innovation Hub;
//   5. the snapshot: before writing to existing records it reads them; if one changed in Odoo after the feed the item
//      was made from, the item is skipped.
// Then, with --apply, it makes the calls in order through the Odoo 19 JSON-2 API as the dedicated user "plan-broker"
// (create and update hub records, no delete), resolving "<id from step 1>"-style references to earlier results, and
// appends one line to scripts/odoo/applied/<date>.jsonl: the plan's hash, the reviewer's fingerprint, every call with
// Odoo's answer and the values before. A plan already in the record is not applied again.
//
// Settings (environment): ODOO_URL (http://127.0.0.1:8069), ODOO_DB (algarve_innovation_hub),
// PLAN_BROKER_API_KEY or PLAN_BROKER_API_KEY_FILE (/root/.agents/odoo/plan-broker-api-key), PLAN_ODOO_HOSTS (extra
// experimentation hosts, comma separated), PLAN_REVIEWERS (scripts/odoo/reviewers.json), PLAN_RECORD_DIR
// (scripts/odoo/applied). Options: --reviewers <file>, --record-dir <dir>, --again (apply a plan already recorded).
// Node 22, no dependencies. Prints no secret. Written by odoo@AgentiCCells.dinis. Apache-2.0.
import { readFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto, createHash } from 'node:crypto';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const flag = name => args.includes(name);
const planFile = args.find((a, i) => !a.startsWith('--') && !['--reviewers', '--record-dir'].includes(args[i - 1]));
const APPLY = flag('--apply');
const URL_ = (process.env.ODOO_URL || 'http://127.0.0.1:8069').replace(/\/$/, '');
const DB = process.env.ODOO_DB || 'algarve_innovation_hub';
const REVIEWERS = opt('--reviewers') || process.env.PLAN_REVIEWERS || join(here, 'reviewers.json');
const RECORD_DIR = opt('--record-dir') || process.env.PLAN_RECORD_DIR || join(here, 'applied');
const KEY_FILE = process.env.PLAN_BROKER_API_KEY_FILE || '/root/.agents/odoo/plan-broker-api-key';

const out = (...a) => console.log(...a);
const fail = (code, msg) => { console.error(`REFUSED: ${msg}`); process.exit(code); };
if (!planFile || flag('--help')) { out('usage: node scripts/odoo/apply-plan.mjs plan.json [--apply] [--reviewers <file>] [--record-dir <dir>] [--again]'); process.exit(planFile ? 0 : 2); }

// ------------------------------------------------------------------ the broker's own policy (shared with the Plan page)
const ctx = {}; ctx.globalThis = ctx;
vm.runInNewContext(readFileSync(join(repo, 'src', 'hub', 'plan-policy.js'), 'utf8'), ctx, { filename: 'plan-policy.js' });
const P = ctx.PlanPolicy;

// ------------------------------------------------------------------ 1. the plan and its signature
let plan;
try { plan = JSON.parse(readFileSync(planFile, 'utf8')); } catch (e) { fail(2, `cannot read ${planFile}: ${e.message}`); }
if (plan?.v !== 1 || !Array.isArray(plan.items) || !plan.reviewer?.publicKeyJwk || typeof plan.signature !== 'string') fail(2, 'not a signed plan (v 1, reviewer.publicKeyJwk, items, signature)');
const jwk = plan.reviewer.publicKeyJwk;
const fingerprint = createHash('sha256').update(P.keyId(jwk)).digest('hex');
const planHash = createHash('sha256').update(P.signedPart(plan)).digest('hex');
out(`Plan ${planFile}`);
out(`  made ${plan.created} on ${plan.hub || 'the hub'}, ${plan.items.length} approved item(s), ${(plan.rejected || []).length} rejected`);
out(`  plan hash   sha256:${planHash}`);
out(`  reviewer    ${plan.reviewer.name || '(no name)'}, key ${fingerprint.slice(0, 32).replace(/(.{4})(?=.)/g, '$1 ')}`);
if (fingerprint !== plan.reviewer.fingerprint) fail(3, 'the fingerprint in the plan is not the fingerprint of its key');
let sigOk = false;
try {
  const pub = await crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  sigOk = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, Buffer.from(plan.signature, 'base64url'), new TextEncoder().encode(P.signedPart(plan)));
} catch (e) { fail(3, `the signature cannot be checked: ${e.message}`); }
if (!sigOk) fail(3, 'the signature does not match: the plan changed after it was signed, or another key signed it');
out('  signature   valid (ECDSA P-256 over the canonical plan)');

// ------------------------------------------------------------------ 2. the allow list
let allow = [];
try { allow = JSON.parse(readFileSync(REVIEWERS, 'utf8')).reviewers || []; } catch (e) { fail(4, `cannot read the reviewers' list ${REVIEWERS}: ${e.message}`); }
const listed = allow.find(r => r.fingerprint === fingerprint && r.publicKeyJwk && P.keyId(r.publicKeyJwk) === P.keyId(jwk));
if (!listed) {
  console.error(`REFUSED: the reviewer's key is not on the list (${REVIEWERS}, ${allow.length} key(s)).`);
  console.error('A person who may approve changes adds this entry to "reviewers" in a reviewed commit:');
  console.error(JSON.stringify({ name: plan.reviewer.name || '', fingerprint, publicKeyJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, added: new Date().toISOString().slice(0, 10), added_by: '<who added it>' }, null, 2));
  process.exit(4);
}
out(`  reviewer    on the list (${REVIEWERS.startsWith(repo) ? REVIEWERS.slice(repo.length + 1) : REVIEWERS}) as "${listed.name}"`);
if (plan.mode !== 'review') fail(4, `the plan was signed in ${plan.mode || 'an unknown'} mode on the hub, not as the Algarve Evolution team`);

// ------------------------------------------------------------------ 3. the policy, item by item
const checked = plan.items.map(it => ({ it, c: P.checkItem(it) }));
out('');
out('Policy (src/hub/plan-policy.js):');
for (const { it, c } of checked) {
  out(`  ${c.ok ? 'OK  ' : 'SKIP'} ${it.title} [${it.source}, ${it.calls.length} call(s)]`);
  c.checks.filter(x => !x.ok).forEach(x => out(`         call ${x.call}: ${x.rule}: ${x.note}`));
}
const todo = checked.filter(x => x.c.ok).map(x => x.it);
if (!todo.length) fail(5, 'no item passes the policy');

// ------------------------------------------------------------------ 4. the target: the experimentation Odoo only
const host = new URL(URL_).hostname;
const extra = (process.env.PLAN_ODOO_HOSTS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
if (/(^|\.)algarveevolution\.pt$/i.test(host)) fail(6, 'never against Algarve Evolution\'s official Odoo');
if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host) && !extra.includes(host.toLowerCase())) fail(6, `${host} is not the experimentation Odoo (loopback, or a host named in PLAN_ODOO_HOSTS)`);

let KEY = process.env.PLAN_BROKER_API_KEY?.trim();
if (!KEY && existsSync(KEY_FILE)) KEY = readFileSync(KEY_FILE, 'utf8').trim();
if (!KEY && APPLY) fail(7, `no API key for the plan-broker user (PLAN_BROKER_API_KEY or ${KEY_FILE}; scripts/odoo/setup-local.sh makes it)`);
async function call(model, method, body = {}) {
  const res = await fetch(`${URL_}/json/2/${model}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `bearer ${KEY}`, 'X-Odoo-Database': DB },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) { const e = new Error(`${model}/${method}: HTTP ${res.status} ${(data?.message || String(text)).split('\n')[0].slice(0, 300)}`); e.status = res.status; throw e; }
  return data;
}
let online = false;
if (KEY) {
  try {
    const hub = await call('aih.hub', 'search_read', { fields: ['name'], limit: 1 });
    if (!Array.isArray(hub) || !hub.length) fail(6, `${URL_} (${DB}) holds no AE Innovation Hub`);
    online = true;
    out('');
    out(`Target: ${URL_}, database ${DB}: "${hub[0].name}", as the plan-broker user`);
  } catch (e) { if (APPLY) fail(6, `cannot reach the experimentation Odoo: ${e.message}`); out(`\nTarget: ${URL_} not reachable (${e.message}); the dry run goes on without reading`); }
} else out(`\nTarget: ${URL_}, database ${DB} (no broker key here: the dry run does not read Odoo)`);

// ------------------------------------------------------------------ the record: a plan is applied once
const records = () => (existsSync(RECORD_DIR) ? readdirSync(RECORD_DIR).filter(f => f.endsWith('.jsonl')).flatMap(f => readFileSync(join(RECORD_DIR, f), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)) : []);
const before = records().find(r => r.plan_hash === `sha256:${planHash}` && r.mode === 'apply');
if (before && APPLY && !flag('--again')) fail(8, `this plan was applied on ${before.at} (see ${RECORD_DIR}); pass --again to apply it once more`);

// ------------------------------------------------------------------ 5 and 6. snapshot, then dry run or apply
// Resolve "<id from step 1>" and "<model: name>" values. Results of earlier calls are lists of ids (create, search)
// or of records (search_read); "id" takes the first, "ids" all of them.
const idsOf = r => (Array.isArray(r) ? r.map(x => (x && typeof x === 'object' ? x.id : x)).filter(x => typeof x === 'number') : typeof r === 'number' ? [r] : []);
async function resolveBody(body, results, live) {
  const named = {};
  async function val(v) {
    const ref = P.refOf(v);
    if (ref) {
      if (!live) return `(${ref.many ? 'ids' : 'id'} from call ${ref.step})`;
      const ids = idsOf(results[ref.step - 1]);
      if (!ids.length) throw new Error(`"${v}": call ${ref.step} returned no id`);
      return ref.many ? ids : ids[0];
    }
    const n = P.namedOf(v);
    if (n) {
      if (!online) return `(${n.model} named "${n.name}")`;
      const k = `${n.model}|${n.name}`;
      if (!(k in named)) {
        const rows = await call(n.model, 'search_read', { domain: [['name', '=', n.name]], fields: ['id'], limit: 2 });
        if (rows.length !== 1) throw new Error(`"${v}": ${rows.length} records of ${n.model} have that name`);
        named[k] = rows[0].id;
      }
      return named[k];
    }
    return v;
  }
  async function walk(v) {
    if (Array.isArray(v)) {
      const outA = [];
      for (const x of v) { const r = await walk(x); if (Array.isArray(r) && typeof x === 'string' && P.refOf(x)?.many) outA.push(...r); else outA.push(r); }
      return outA;
    }
    if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = await walk(x); return o; }
    return val(v);
  }
  return walk(body);
}
// A ref that stands for a list inside a [6, 0, ...] command must stay a list: [[6, 0, "ids from call 1"]] becomes
// [[6, 0, ["ids from call 1"]]] before the references are resolved.
function fixCommands(body) {
  const w = v => {
    if (Array.isArray(v)) { if (v.length === 3 && v[0] === 6 && v[1] === 0 && !Array.isArray(v[2])) return [6, 0, [v[2]].flat()]; return v.map(w); }
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, w(x)]));
    return v;
  };
  return w(body);
}
// The snapshot: current values of what a write changes, and whether the record changed after the item's feed.
async function snapshot(model, method, body) {
  if (!online || method !== 'write' || !Array.isArray(body.ids) || !body.ids.every(n => typeof n === 'number')) return null;
  const fields = [...new Set([...Object.keys(body.vals || {}), 'write_date'])];
  return call(model, 'read', { ids: body.ids, fields });
}
const odooTime = s => (s ? new Date(`${String(s).replace(' ', 'T')}Z`) : null);

const record = { at: new Date().toISOString(), mode: APPLY ? 'apply' : 'dry-run', plan_hash: `sha256:${planHash}`, plan_created: plan.created, hub: plan.hub || null, reviewer: { name: listed.name, fingerprint }, odoo: { url: URL_, db: DB }, broker: 'scripts/odoo/apply-plan.mjs', items: [] };
out('');
out(APPLY ? 'Applying:' : 'Dry run (nothing is written; pass --apply to write):');
let applied = 0, failed = 0;
for (const it of plan.items) {
  const rec = { id: it.id, source: it.source, title: it.title, status: 'skipped', calls: [] };
  record.items.push(rec);
  if (!todo.includes(it)) { rec.reason = 'policy'; continue; }
  out(`\n  ${it.title} [${it.source}]`);
  const results = [];
  try {
    // Snapshot first, for every write to existing records, before anything in this item is written.
    for (const [i, c] of it.calls.entries()) {
      const { model, method } = P.parsePath(c.path);
      const snap = await snapshot(model, method, c.body).catch(() => null);
      if (snap) {
        rec.calls[i] = { before: snap };
        const since = it.snapshot?.exported ? new Date(it.snapshot.exported) : null;
        const changed = since ? snap.filter(r => odooTime(r.write_date) > since) : [];
        if (changed.length) { rec.status = 'skipped'; rec.reason = `record(s) ${changed.map(r => r.id).join(', ')} of ${model} changed in Odoo after the snapshot (${it.snapshot.exported})`; throw Object.assign(new Error(rec.reason), { stale: true }); }
      }
    }
    for (const [i, c] of it.calls.entries()) {
      const { model, method } = P.parsePath(c.path);
      const body = await resolveBody(fixCommands(c.body), results, APPLY);
      const line = `    ${i + 1}. POST ${c.path} ${JSON.stringify(body)}`;
      out(line.length > 400 ? `${line.slice(0, 400)}…` : line);
      const r = rec.calls[i] || {}; r.path = c.path; r.body = body; rec.calls[i] = r;
      if (r.before) out(`       before: ${JSON.stringify(r.before.map(({ write_date, ...x }) => x))}`);
      if (!APPLY) { results.push(null); continue; }
      const res = await call(model, method, body);
      results.push(res); r.result = res;
      out(`       Odoo: ${JSON.stringify(res).slice(0, 200)}`);
    }
    rec.status = APPLY ? 'applied' : 'would apply';
    if (APPLY) applied += 1;
  } catch (e) {
    if (!e.stale) { rec.status = results.length ? 'partly applied' : 'failed'; rec.error = e.message; failed += 1; }
    out(`    ${e.stale ? 'SKIPPED' : 'FAILED'}: ${e.message}`);
  }
}
out('');
out(`${APPLY ? 'Applied' : 'Would apply'} ${APPLY ? applied : record.items.filter(i => i.status === 'would apply').length} of ${plan.items.length} item(s)${failed ? `, ${failed} failed` : ''}${checked.length - todo.length ? `, ${checked.length - todo.length} refused by the policy` : ''}.`);
if (APPLY) {
  mkdirSync(RECORD_DIR, { recursive: true });
  const file = join(RECORD_DIR, `${record.at.slice(0, 10)}.jsonl`);
  appendFileSync(file, `${JSON.stringify(record)}\n`);
  out(`Record appended to ${file.startsWith(repo) ? file.slice(repo.length + 1) : file}.`);
}
process.exit(failed ? 1 : 0);
