#!/usr/bin/env node
// Check the exported feeds against docs/v2/CONTRACT.md.
//   node scripts/odoo/check-feeds.mjs              checks src/feeds/public.json and the shape of private.enc.json
//   FEED_ACCESS_KEY_FILE=/root/.agents/odoo/private-feed-key node scripts/odoo/check-feeds.mjs
//                                                  also decrypts the private feed (WebCrypto, as a browser
//                                                  would), checks it, and checks that a wrong key fails
// Checks: shapes and enums, unique ids, references, the consent rule, that no private field or
// e-mail address leaks into public.json, that real records carry a source and simulated ones say so.
// Prints OK or the list of problems (exit 1). Prints no secret. Node 22, no dependencies.
// Written by odoo@AgentiCCells.dinis. Apache-2.0.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');
const DIR = process.env.FEED_OUT || join(repo, 'src', 'feeds');
const problems = [];
const fail = (msg) => problems.push(msg);

const ENTITIES = ['programmes', 'companies', 'mentors', 'sessions', 'kpis', 'reflections', 'challenges', 'suppliers',
  'applications', 'matches', 'vibathons', 'projects', 'talent', 'communities', 'events'];
const ACTIVITIES = ['inc-acc', 'challenge-connect', 'vibathon', 'talent'];
const PEOPLE_TALENT = ['professional', 'consultant', 'investor', 'mentor'];
const PRIVATE_KEYS = ['notes', 'contact', 'participants', 'scores', 'email', 'phone', 'team_ids', 'partner_id'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const URLRE = /^https?:\/\/\S+$/;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

const T = {
  str: (v) => typeof v === 'string' && v.length > 0,
  strOrNull: (v) => v === null || typeof v === 'string',
  num: (v) => typeof v === 'number' && Number.isFinite(v),
  int: (v) => Number.isInteger(v),
  bool: (v) => typeof v === 'boolean',
  date: (v) => typeof v === 'string' && DATE.test(v),
  dateOrNull: (v) => v === null || (typeof v === 'string' && DATE.test(v)),
  strArr: (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
  enum: (...xs) => (v) => xs.includes(v),
  enumOrNull: (...xs) => (v) => v === null || xs.includes(v),
  optional: (t) => Object.assign((v) => v === undefined || t(v), { optional: true }),
};

// Fields per entity: [name, type check]. The common fields are checked separately.
const SHAPE = {
  programmes: { kind: T.enum('incubation', 'acceleration'), name: T.str, cohort: T.strOrNull, start: T.dateOrNull, end: T.dateOrNull,
    months: (v) => v === 6, status: T.enum('planned', 'running', 'finished'), summary: T.strOrNull, company_ids: T.strArr, mentor_ids: T.strArr },
  companies: { name: T.str, sector: T.strOrNull, town: T.strOrNull, stage: T.strOrNull, programme_id: T.strOrNull, summary: T.strOrNull,
    website: T.optional(T.str) },
  mentors: { name: T.str, kind: T.enum('one_to_one', 'guest'), expertise: T.strArr, town: T.strOrNull, company_ids: T.strArr, consent: T.bool },
  sessions: { programme_id: T.str, company_id: T.optional(T.str), mentor_id: T.strOrNull, kind: T.enum('one_to_one', 'clinic', 'workshop'),
    date: T.date, topic: T.str, notes: T.optional(T.str) },
  kpis: { company_id: T.str, month: (v) => T.int(v) && v >= 0 && v <= 6, revenue_eur: T.num, customers: T.int, team_size: T.int,
    funding_eur: T.num, product_stage: T.strOrNull },
  reflections: { programme_id: T.str, month: T.int, text: T.str },
  challenges: { company_id: T.optional(T.str), org: T.optional(T.strOrNull), title: T.str, town: T.strOrNull, problem: T.strOrNull, requirements: T.strArr,
    skills: T.strArr, budget_eur_min: T.num, budget_eur_max: T.num, deadline: T.dateOrNull, status: T.enum('open', 'matching', 'matched', 'closed') },
  suppliers: { kind: T.enum('company', 'individual'), name: T.str, town: T.strOrNull, capabilities: T.strArr, rate: T.optional(T.str),
    contact: T.optional(T.str), consent: T.bool },
  applications: { challenge_id: T.str, supplier_id: T.strOrNull, proposal: T.strOrNull, price_eur: T.num, days: T.int },
  matches: { challenge_id: T.str, ranked: (v) => Array.isArray(v) && v.every((x) => T.str(x.application_id) && T.num(x.score) && T.strArr(x.reasons)),
    decision: T.enumOrNull('company', 'ae_triage'), chosen_application_id: T.optional(T.str), suggested_application_ids: T.strArr },
  vibathons: { kind: T.enum('hackathon', 'workshop', 'buildathon'), name: T.str, date: T.date, venue: T.strOrNull, town: T.strOrNull, event_id: T.strOrNull,
    mentor_ids: T.strArr, jury: (v) => Array.isArray(v) && v.every((j) => T.str(j.name) && T.strOrNull(j.role)), registrations: T.int,
    participants: T.optional((v) => Array.isArray(v) && v.every((p) => T.str(p.name) && (p.role === undefined || T.enumOrNull('builder', 'designer', 'business', 'other')(p.role)))), project_ids: T.strArr, next_steps: T.strArr },
  projects: { vibathon_id: T.str, name: T.str, team: T.strArr, team_ids: T.optional(T.strArr), mentor_id: T.strOrNull, summary: T.strOrNull, prize: T.optional(T.str),
    scores: T.optional((v) => Array.isArray(v) && v.every((x) => T.str(x.juror) && T.str(x.criterion) && T.num(x.score))), next_step: T.strOrNull },
  talent: { kind: T.enum('community', 'informal_group', 'professional', 'consultant', 'mentor', 'investor', 'partner', 'stakeholder'),
    name: T.str, town: T.strOrNull, community_id: T.optional(T.str), tags: T.strArr, consent: T.bool, summary: T.strOrNull },
  communities: { name: T.str, municipality: T.strOrNull, kind: T.strOrNull, members: T.optional(T.int) },
  events: { name: T.str, start: (v) => LOCAL_DT.test(v), end: (v) => LOCAL_DT.test(v), place: T.strOrNull, url: (v) => URLRE.test(v) },
};
const COMMON = ['id', 'odoo', 'simulated', 'published', 'source'];

function checkFeed(feed, which) {
  const at = (e, r) => `${which} ${e}[${r?.id ?? '?'}]`;
  if (!feed.meta || feed.meta.feed !== which) fail(`${which}: meta.feed must be "${which}"`);
  if (!feed.meta?.exported || Number.isNaN(Date.parse(feed.meta.exported))) fail(`${which}: meta.exported is not an ISO time`);
  for (const k of ['url', 'version', 'db']) if (!T.str(feed.meta?.odoo?.[k])) fail(`${which}: meta.odoo.${k} missing`);
  if (which === 'public') {
    const w = feed.meta?.withheld;
    if (!w || Object.keys(w).sort().join() !== 'mentors,suppliers,talent' || !Object.values(w).every(T.int)) fail('public: meta.withheld must be { talent, mentors, suppliers } counts');
  } else if (feed.meta?.withheld !== undefined) fail('private: meta.withheld belongs to the public feed only');
  if (feed.hub?.name !== 'AE Innovation Hub') fail(`${which}: hub.name must be "AE Innovation Hub" (António Guerreiro's whiteboard, 16 November 2026)`);
  const acts = feed.hub?.activities || [];
  if (acts.map((a) => a.id).sort().join() !== [...ACTIVITIES].sort().join()) fail(`${which}: hub.activities must be the four activities`);
  for (const a of acts) if (!T.str(a.name) || !T.str(a.summary)) fail(`${which}: hub activity ${a.id} needs name and summary`);

  const ids = {};
  for (const e of ENTITIES) {
    const arr = feed[e];
    if (!Array.isArray(arr)) { fail(`${which}: ${e} is not an array`); ids[e] = new Set(); continue; }
    if (feed.meta?.counts?.[e] !== arr.length) fail(`${which}: meta.counts.${e} is ${feed.meta?.counts?.[e]}, the array has ${arr.length}`);
    ids[e] = new Set();
    for (const r of arr) {
      if (!T.str(r.id)) fail(`${at(e, r)}: id must be a non-empty string`);
      if (ids[e].has(r.id)) fail(`${at(e, r)}: duplicate id`);
      ids[e].add(r.id);
      if (!r.odoo || !T.str(r.odoo.model) || !T.int(r.odoo.id)) fail(`${at(e, r)}: odoo must be { model, id }`);
      if (!T.bool(r.simulated) || !T.bool(r.published)) fail(`${at(e, r)}: simulated and published must be booleans`);
      if (r.source !== undefined && !URLRE.test(r.source)) fail(`${at(e, r)}: source is not a URL`);
      if (!r.simulated && !r.source) fail(`${at(e, r)}: real data needs a source URL`);
      const label = r.name || r.title;
      if (r.simulated && label && !/\(simulated\)/.test(label)) fail(`${at(e, r)}: simulated record whose name does not say "(simulated)"`);
      if (which === 'public' && !r.published) fail(`${at(e, r)}: unpublished record in the public feed`);
      for (const [f, t] of Object.entries(SHAPE[e])) {
        if (r[f] === undefined && !t.optional) fail(`${at(e, r)}: missing ${f}`);
        else if (!t(r[f])) fail(`${at(e, r)}: bad ${f}: ${JSON.stringify(r[f])?.slice(0, 80)}`);
      }
      for (const f of Object.keys(r)) if (!COMMON.includes(f) && !(f in SHAPE[e])) fail(`${at(e, r)}: field not in the contract: ${f}`);
    }
  }

  // References
  const ref = (e, r, f, target, nullable = false) => {
    const v = r[f];
    if (v === undefined || (v === null && nullable)) return;
    if (!ids[target].has(v)) fail(`${at(e, r)}: ${f} ${JSON.stringify(v)} is not in ${target}`);
  };
  const refs = (e, r, f, target) => (r[f] || []).forEach((v) => { if (!ids[target].has(v)) fail(`${at(e, r)}: ${f} has ${v}, not in ${target}`); });
  feed.programmes.forEach((r) => { refs('programmes', r, 'company_ids', 'companies'); refs('programmes', r, 'mentor_ids', 'mentors'); });
  feed.companies.forEach((r) => ref('companies', r, 'programme_id', 'programmes', true));
  feed.mentors.forEach((r) => refs('mentors', r, 'company_ids', 'companies'));
  feed.sessions.forEach((r) => { ref('sessions', r, 'programme_id', 'programmes'); ref('sessions', r, 'company_id', 'companies'); ref('sessions', r, 'mentor_id', 'mentors', true); });
  feed.kpis.forEach((r) => ref('kpis', r, 'company_id', 'companies'));
  feed.reflections.forEach((r) => ref('reflections', r, 'programme_id', 'programmes'));
  feed.challenges.forEach((r) => { ref('challenges', r, 'company_id', 'companies'); if (r.company_id === undefined && r.org === undefined) fail(`${at('challenges', r)}: needs company_id or org`); });
  const appChallenge = new Map(feed.applications.map((a) => [a.id, a.challenge_id]));
  feed.applications.forEach((r) => { ref('applications', r, 'challenge_id', 'challenges'); ref('applications', r, 'supplier_id', 'suppliers', true); });
  feed.matches.forEach((r) => {
    ref('matches', r, 'challenge_id', 'challenges');
    r.ranked.forEach((x, i) => {
      if (appChallenge.get(x.application_id) !== r.challenge_id) fail(`${at('matches', r)}: ranked ${x.application_id} is not an application to ${r.challenge_id}`);
      if (i && x.score > r.ranked[i - 1].score) fail(`${at('matches', r)}: ranked is not in score order`);
    });
    ref('matches', r, 'chosen_application_id', 'applications');
    refs('matches', r, 'suggested_application_ids', 'applications');
    r.suggested_application_ids.forEach((a) => { if (appChallenge.get(a) !== r.challenge_id) fail(`${at('matches', r)}: suggested ${a} is not an application to ${r.challenge_id}`); });
    if (r.suggested_application_ids.length > 3) fail(`${at('matches', r)}: more than 3 suggested applications`);
  });
  feed.vibathons.forEach((r) => { refs('vibathons', r, 'mentor_ids', 'mentors'); refs('vibathons', r, 'project_ids', 'projects'); ref('vibathons', r, 'event_id', 'events', true); });
  feed.projects.forEach((r) => { ref('projects', r, 'vibathon_id', 'vibathons'); ref('projects', r, 'mentor_id', 'mentors', true); });
  feed.talent.forEach((r) => ref('talent', r, 'community_id', 'communities'));
  return ids;
}

function checkPublicRules(feed) {
  // Consent: people appear only with consent.
  feed.mentors.forEach((r) => { if (!r.consent) fail(`public mentors[${r.id}]: no consent`); });
  feed.suppliers.forEach((r) => { if (r.kind === 'individual' && !r.consent) fail(`public suppliers[${r.id}]: individual without consent`); });
  feed.talent.forEach((r) => { if (PEOPLE_TALENT.includes(r.kind) && !r.consent) fail(`public talent[${r.id}]: ${r.kind} without consent`); });
  // No private field anywhere, and no e-mail address in any string.
  const walk = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (PRIVATE_KEYS.includes(k)) fail(`public: private field "${k}" at ${path}`);
        walk(x, `${path}.${k}`);
      }
    } else if (typeof v === 'string' && EMAIL.test(v)) fail(`public: an e-mail address at ${path}`);
  };
  walk(feed, '$');
}

// ------------------------------------------------------------------ run
const pubPath = join(DIR, 'public.json');
const encPath = join(DIR, 'private.enc.json');
const pub = JSON.parse(readFileSync(pubPath, 'utf8'));
const pubIds = checkFeed(pub, 'public');
checkPublicRules(pub);

const enc = JSON.parse(readFileSync(encPath, 'utf8'));
const b = (x) => Buffer.from(x || '', 'base64');
if (enc.v !== 1) fail('private.enc.json: v must be 1');
if (Object.keys(enc).sort().join() !== 'ciphertext,iv,kdf,v' || Object.keys(enc.kdf || {}).sort().join() !== 'iterations,salt') fail('private.enc.json: must be exactly {v, kdf:{salt, iterations}, iv, ciphertext}');
if (enc.kdf?.iterations !== 200000) fail('private.enc.json: kdf.iterations must be 200000');
if (b(enc.kdf?.salt).length < 16) fail('private.enc.json: salt must be at least 16 bytes');
if (b(enc.iv).length !== 12) fail('private.enc.json: iv must be 12 bytes');
if (b(enc.ciphertext).length < 1000) fail('private.enc.json: ciphertext looks too short');
const rawEnc = readFileSync(encPath, 'utf8');
if (/simulated|Person \d|example\.invalid/.test(rawEnc)) fail('private.enc.json: holds clear text');

async function decrypt(e, accessKey) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(accessKey), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b(e.kdf.salt), iterations: e.kdf.iterations },
    material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(e.iv) }, key, b(e.ciphertext));
  return JSON.parse(new TextDecoder().decode(pt));
}

let decrypted = 'not attempted (no FEED_ACCESS_KEY or FEED_ACCESS_KEY_FILE)';
const keyFile = process.env.FEED_ACCESS_KEY_FILE;
const accessKey = process.env.FEED_ACCESS_KEY || (keyFile && existsSync(keyFile) ? readFileSync(keyFile, 'utf8').trim() : null);
let priv = null;
if (accessKey) {
  try {
    priv = await decrypt(enc, accessKey);
    decrypted = 'decrypted with the access key';
  } catch {
    fail('private.enc.json: could not decrypt with the access key');
  }
  try { await decrypt(enc, accessKey + 'x'); fail('private.enc.json: a wrong key decrypted it'); } catch { /* expected */ }
}
if (priv) {
  checkFeed(priv, 'private');
  for (const e of ENTITIES) for (const id of pubIds[e]) if (!priv[e].some((r) => r.id === id)) fail(`private ${e}: missing ${id}, which is public`);
  const has = (e, f) => priv[e].some((r) => r[f] !== undefined);
  for (const [e, f] of [['sessions', 'notes'], ['suppliers', 'contact'], ['vibathons', 'participants'], ['projects', 'scores']]) {
    if (!has(e, f)) fail(`private ${e}: no record holds ${f}`);
  }
}

console.log('entity          public' + (priv ? '  private' : ''));
for (const e of ENTITIES) console.log(`${e.padEnd(15)} ${String(pub[e].length).padStart(6)}` + (priv ? `  ${String(priv[e].length).padStart(7)}` : ''));
console.log(`private feed: ${decrypted}`);
if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  for (const p of problems.slice(0, 60)) console.log(' - ' + p);
  process.exit(1);
}
console.log('OK');
