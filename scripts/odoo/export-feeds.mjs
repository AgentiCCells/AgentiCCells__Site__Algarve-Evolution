#!/usr/bin/env node
// Export the AE Innovation Hub (Algarve Evolution Innovation Hub) feeds from Odoo, as docs/v2/CONTRACT.md says:
//   src/feeds/public.json       published records, public fields, people only with consent
//   src/feeds/private.enc.json  every record and field, encrypted (AES-256-GCM, key from
//                               PBKDF2-SHA256 over an access key, 200,000 iterations)
// It reads Odoo over the Odoo 19 JSON-2 API (POST /json/2/<model>/<method>) with the API key
// of a dedicated read-only user. Node 22, no dependencies. Prints no secret.
//
// Settings (environment variables; defaults suit the local Odoo from setup-local.sh):
//   ODOO_URL                  http://127.0.0.1:8069
//   ODOO_DB                   algarve_innovation_hub
//   ODOO_API_KEY              the read-only user's API key, or else read from ODOO_API_KEY_FILE
//   ODOO_API_KEY_FILE         /root/.agents/odoo/feed-api-key
//   FEED_ACCESS_KEY           the private feed's access key, or else read from FEED_ACCESS_KEY_FILE
//   FEED_ACCESS_KEY_FILE      /root/.agents/odoo/private-feed-key (created, mode 600, if missing)
//   FEED_OUT                  <repo>/src/feeds
//   FEED_PRIVATE_PLAIN        a path to also write the private feed in clear (for local checks only;
//                             never inside the repository)
// Written by odoo@AgentiCCells.dinis. Apache-2.0.
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');
const URL_ = (process.env.ODOO_URL || 'http://127.0.0.1:8069').replace(/\/$/, '');
const DB = process.env.ODOO_DB || 'algarve_innovation_hub';
const OUT = process.env.FEED_OUT || join(repo, 'src', 'feeds');
const SECRETS = '/root/.agents/odoo';

function secret(envName, fileEnv, fallbackFile, create) {
  if (process.env[envName]) return process.env[envName].trim();
  const file = process.env[fileEnv] || fallbackFile;
  if (!existsSync(file)) {
    if (!create) throw new Error(`no ${envName} and no ${file}`);
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
    writeFileSync(file, key + '\n', { mode: 0o600 });
    chmodSync(file, 0o600);
    console.log(`private feed access key: created in ${file} (mode 600)`);
  }
  return readFileSync(file, 'utf8').trim();
}
const API_KEY = secret('ODOO_API_KEY', 'ODOO_API_KEY_FILE', join(SECRETS, 'feed-api-key'), false);
const ACCESS_KEY = secret('FEED_ACCESS_KEY', 'FEED_ACCESS_KEY_FILE', join(SECRETS, 'private-feed-key'), true);

// ------------------------------------------------------------------ Odoo JSON-2 client
async function call(model, method, body = {}) {
  const res = await fetch(`${URL_}/json/2/${model}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `bearer ${API_KEY}`, 'X-Odoo-Database': DB },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${model}.${method}: HTTP ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}
const read = (model, domain, fields, order = 'id') => call(model, 'search_read', { domain, fields, order });

async function serverVersion() {
  const res = await fetch(`${URL_}/web/webclient/version_info`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
  });
  const j = await res.json();
  return j.result?.server_version || 'unknown';
}

// ------------------------------------------------------------------ helpers
const m2o = (v) => (Array.isArray(v) ? v[0] : null);
const s = (v) => (v === false || v === undefined ? null : v);
const lines = (v) => (v ? String(v).split('\n').map((x) => x.trim()).filter(Boolean) : []);
const key = (r, prefix) => r.feed_key || `${prefix}-${r.id}`;
const pkey = (r) => r.aih_feed_key || `partner-${r.id}`;
const base = (model, r, id, published, simulated, source) => {
  const o = { id, odoo: { model, id: r.id }, simulated: !!simulated, published: !!published };
  if (source) o.source = source;
  return o;
};
const feedBase = (model, r, prefix) => base(model, r, key(r, prefix), r.is_published, r.simulated, r.source_url);
const partnerBase = (r) => base('res.partner', r, pkey(r), r.aih_published, r.aih_simulated, r.aih_source_url);

// Odoo datetimes are UTC "YYYY-MM-DD HH:MM:SS"; the feed shows local time as the source does.
function localIso(utc, tz) {
  if (!utc) return null;
  const d = new Date(utc.replace(' ', 'T') + 'Z');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: tz || 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// ------------------------------------------------------------------ read everything (the private feed)
async function buildPrivate() {
  const F = ['feed_key', 'is_published', 'simulated', 'source_url'];
  const PF = ['aih_feed_key', 'aih_published', 'aih_simulated', 'aih_source_url', 'aih_consent', 'name', 'city', 'is_company', 'email', 'phone'];

  const [hubs, activities, skills, cats] = await Promise.all([
    read('aih.hub', [], ['name'], 'id'),
    read('aih.activity', [], ['code', 'name', 'summary', 'is_published'], 'sequence, id'),
    read('aih.skill', [], ['name']),
    read('res.partner.category', [], ['name']),
  ]);
  const skillName = new Map(skills.map((x) => [x.id, x.name]));
  const catName = new Map(cats.map((x) => [x.id, x.name]));

  const [progs, comps, sessions, kpis, refls, chals, apps, vibs, juries, parts, projs, scores, comms, events] = await Promise.all([
    read('aih.programme', [], [...F, 'name', 'kind', 'cohort', 'date_start', 'date_end', 'months', 'state', 'summary', 'company_ids', 'mentor_ids']),
    read('aih.programme.company', [], [...F, 'name', 'sector', 'town', 'stage', 'programme_id', 'summary', 'website', 'mentor_id']),
    read('aih.session', [], [...F, 'programme_id', 'company_id', 'mentor_id', 'kind', 'date', 'topic', 'notes'], 'date, id'),
    read('aih.kpi', [], [...F, 'company_id', 'month', 'revenue_eur', 'customers', 'team_size', 'funding_eur', 'product_stage'], 'company_id, month'),
    read('aih.reflection', [], [...F, 'programme_id', 'month', 'text']),
    read('aih.challenge', [], [...F, 'name', 'company_id', 'org_name', 'town', 'problem', 'requirements', 'skill_ids', 'budget_eur_min', 'budget_eur_max', 'deadline', 'state', 'decision', 'chosen_application_id', 'suggested_application_ids']),
    read('aih.application', [], [...F, 'challenge_id', 'supplier_id', 'proposal', 'price_eur', 'days', 'score', 'rank', 'reasons'], 'challenge_id, rank, id'),
    read('aih.vibathon', [], [...F, 'name', 'kind', 'date', 'venue', 'town', 'event_id', 'mentor_ids', 'registrations', 'project_ids', 'next_steps'], 'date, id'),
    read('aih.vibathon.jury', [], ['vibathon_id', 'partner_id', 'name', 'role']),
    read('aih.vibathon.participant', [], ['vibathon_id', 'partner_id', 'name', 'email', 'role']),
    read('aih.project', [], [...F, 'vibathon_id', 'name', 'team_ids', 'mentor_id', 'summary', 'prize', 'next_step', 'score_total']),
    read('aih.project.score', [], ['project_id', 'juror', 'criterion', 'score']),
    read('aih.community', [], [...F, 'name', 'municipality', 'kind', 'members']),
    read('event.event', [['aih_feed_key', '!=', false]], ['aih_feed_key', 'aih_published', 'aih_simulated', 'aih_source_url', 'name', 'date_begin', 'date_end', 'date_tz', 'aih_place', 'aih_url'], 'date_begin, id'),
  ]);
  const hubPartners = await read('res.partner', ['|', '|', ['aih_is_mentor', '=', true], ['aih_is_supplier', '=', true], ['aih_talent_kind', '!=', false]],
    [...PF, 'aih_is_mentor', 'aih_mentor_kind', 'aih_expertise_ids', 'aih_is_supplier', 'aih_capability_ids', 'aih_rate', 'aih_talent_kind', 'aih_community_id', 'aih_summary', 'category_id']);
  // Team members and jurors may be any contact; read the ones not already loaded.
  const known = new Set(hubPartners.map((p) => p.id));
  const extraIds = [...new Set([...projs.flatMap((p) => p.team_ids), ...juries.map((j) => m2o(j.partner_id)).filter(Boolean)])].filter((id) => !known.has(id));
  const extra = extraIds.length ? await read('res.partner', [['id', 'in', extraIds]], [...PF, 'aih_talent_kind']) : [];
  const partners = new Map([...hubPartners, ...extra].map((p) => [p.id, p]));

  // Linked events are read by feed id; an event without one (not in the hub) exports as null.
  const linked = [...new Set(vibs.map((r) => m2o(r.event_id)).filter(Boolean))];
  const eventKey = new Map((linked.length ? await read('event.event', [['id', 'in', linked]], ['aih_feed_key']) : [])
    .filter((e) => e.aih_feed_key).map((e) => [e.id, e.aih_feed_key]));
  const ids = {
    prog: new Map(progs.map((r) => [r.id, key(r, 'prog')])),
    comp: new Map(comps.map((r) => [r.id, key(r, 'co')])),
    app: new Map(apps.map((r) => [r.id, key(r, 'app')])),
    proj: new Map(projs.map((r) => [r.id, key(r, 'prj')])),
    vib: new Map(vibs.map((r) => [r.id, key(r, 'vib')])),
    com: new Map(comms.map((r) => [r.id, key(r, 'com')])),
    chal: new Map(chals.map((r) => [r.id, key(r, 'ch')])),
    partner: (id) => (partners.has(id) ? pkey(partners.get(id)) : `partner-${id}`),
  };

  const feed = {
    hub: {
      name: hubs[0]?.name || 'AE Innovation Hub',
      activities: activities.filter((a) => a.is_published).map((a) => ({ id: a.code, name: a.name, summary: s(a.summary) })),
    },
    programmes: progs.map((r) => ({
      ...feedBase('aih.programme', r, 'prog'), kind: r.kind, name: r.name, cohort: s(r.cohort),
      start: s(r.date_start), end: s(r.date_end), months: r.months, status: r.state, summary: s(r.summary),
      company_ids: r.company_ids.map((i) => ids.comp.get(i)), mentor_ids: r.mentor_ids.map(ids.partner),
    })),
    companies: comps.map((r) => {
      const o = {
        ...feedBase('aih.programme.company', r, 'co'), name: r.name, sector: s(r.sector), town: s(r.town),
        stage: s(r.stage), programme_id: ids.prog.get(m2o(r.programme_id)) || null, summary: s(r.summary),
      };
      if (r.website) o.website = r.website;
      return o;
    }),
    mentors: hubPartners.filter((p) => p.aih_is_mentor).map((p) => ({
      ...partnerBase(p), consent: !!p.aih_consent, name: p.name, kind: s(p.aih_mentor_kind),
      expertise: p.aih_expertise_ids.map((i) => skillName.get(i)), town: s(p.city),
      company_ids: comps.filter((c) => m2o(c.mentor_id) === p.id).map((c) => ids.comp.get(c.id)),
    })),
    sessions: sessions.map((r) => {
      const o = { ...feedBase('aih.session', r, 'ses'), programme_id: ids.prog.get(m2o(r.programme_id)) };
      if (m2o(r.company_id)) o.company_id = ids.comp.get(m2o(r.company_id));
      Object.assign(o, { mentor_id: ids.partner(m2o(r.mentor_id)), kind: r.kind, date: r.date, topic: r.topic });
      if (r.notes) o.notes = r.notes;
      return o;
    }),
    kpis: kpis.map((r) => ({
      ...feedBase('aih.kpi', r, 'kpi'), company_id: ids.comp.get(m2o(r.company_id)), month: r.month,
      revenue_eur: r.revenue_eur, customers: r.customers, team_size: r.team_size, funding_eur: r.funding_eur,
      product_stage: s(r.product_stage),
    })),
    reflections: refls.map((r) => ({
      ...feedBase('aih.reflection', r, 'ref'), programme_id: ids.prog.get(m2o(r.programme_id)), month: r.month, text: r.text,
    })),
    challenges: chals.map((r) => {
      const o = { ...feedBase('aih.challenge', r, 'ch') };
      if (m2o(r.company_id)) o.company_id = ids.comp.get(m2o(r.company_id));
      else o.org = s(r.org_name);
      return Object.assign(o, {
        title: r.name, town: s(r.town), problem: s(r.problem), requirements: lines(r.requirements),
        skills: r.skill_ids.map((i) => skillName.get(i)), budget_eur_min: r.budget_eur_min, budget_eur_max: r.budget_eur_max,
        deadline: s(r.deadline), status: r.state,
      });
    }),
    suppliers: hubPartners.filter((p) => p.aih_is_supplier).map((p) => {
      const o = {
        ...partnerBase(p), consent: !!p.aih_consent, kind: p.is_company ? 'company' : 'individual', name: p.name,
        town: s(p.city), capabilities: p.aih_capability_ids.map((i) => skillName.get(i)),
      };
      if (p.aih_rate) o.rate = p.aih_rate;
      const contact = [p.email, p.phone].filter(Boolean).join(', ');
      if (contact) o.contact = contact;
      return o;
    }),
    applications: apps.map((r) => ({
      ...feedBase('aih.application', r, 'app'), challenge_id: ids.chal.get(m2o(r.challenge_id)),
      supplier_id: ids.partner(m2o(r.supplier_id)), proposal: s(r.proposal), price_eur: r.price_eur, days: r.days,
    })),
    matches: chals.map((c) => {
      const ranked = apps.filter((a) => m2o(a.challenge_id) === c.id && a.rank > 0)
        .sort((a, b) => a.rank - b.rank)
        .map((a) => ({ application_id: ids.app.get(a.id), score: a.score, reasons: lines(a.reasons) }));
      const o = {
        ...base('aih.challenge', c, `match-${key(c, 'ch')}`, c.is_published, c.simulated, c.source_url),
        challenge_id: ids.chal.get(c.id), ranked, decision: s(c.decision),
        suggested_application_ids: c.suggested_application_ids.map((i) => ids.app.get(i)).filter(Boolean),
      };
      if (m2o(c.chosen_application_id)) o.chosen_application_id = ids.app.get(m2o(c.chosen_application_id));
      return o;
    }).filter((m) => m.ranked.length),
    vibathons: vibs.map((r) => ({
      ...feedBase('aih.vibathon', r, 'vib'), kind: r.kind, name: r.name, date: r.date, venue: s(r.venue), town: s(r.town),
      event_id: m2o(r.event_id) ? (eventKey.get(m2o(r.event_id)) || null) : null,
      mentor_ids: r.mentor_ids.map(ids.partner),
      jury: juries.filter((j) => m2o(j.vibathon_id) === r.id).map((j) => ({
        name: j.name, role: s(j.role), ...(m2o(j.partner_id) ? { partner_id: ids.partner(m2o(j.partner_id)) } : {}),
      })),
      registrations: r.registrations,
      participants: parts.filter((p) => m2o(p.vibathon_id) === r.id).map((p) => ({ name: p.name, email: s(p.email), role: s(p.role) })),
      project_ids: r.project_ids.map((i) => ids.proj.get(i)), next_steps: lines(r.next_steps),
    })),
    projects: projs.map((r) => {
      const o = {
        ...feedBase('aih.project', r, 'prj'), vibathon_id: ids.vib.get(m2o(r.vibathon_id)), name: r.name,
        team: r.team_ids.map((i) => partners.get(i)?.name).filter(Boolean),
        team_ids: r.team_ids.map(ids.partner), mentor_id: m2o(r.mentor_id) ? ids.partner(m2o(r.mentor_id)) : null,
        summary: s(r.summary),
      };
      if (r.prize) o.prize = r.prize;
      o.scores = scores.filter((x) => m2o(x.project_id) === r.id).map((x) => ({ juror: x.juror, criterion: x.criterion, score: x.score }));
      o.next_step = s(r.next_step);
      return o;
    }),
    talent: hubPartners.filter((p) => p.aih_talent_kind).map((p) => {
      const o = { ...partnerBase(p), kind: p.aih_talent_kind, name: p.name, town: s(p.city) };
      if (m2o(p.aih_community_id)) o.community_id = ids.com.get(m2o(p.aih_community_id));
      return Object.assign(o, {
        tags: p.category_id.map((i) => catName.get(i)).filter(Boolean), consent: !!p.aih_consent,
        summary: s(p.aih_summary),
      });
    }),
    communities: comms.map((r) => {
      const o = { ...feedBase('aih.community', r, 'com'), name: r.name, municipality: s(r.municipality), kind: s(r.kind) };
      if (r.members) o.members = r.members;
      return o;
    }),
    events: events.map((r) => ({
      ...base('event.event', r, r.aih_feed_key, r.aih_published, r.aih_simulated, r.aih_source_url || r.aih_url),
      name: r.name, start: localIso(r.date_begin, r.date_tz), end: localIso(r.date_end, r.date_tz),
      place: s(r.aih_place), url: s(r.aih_url),
    })),
  };
  // Private helpers the public filter needs, removed before writing.
  feed._partners = partners;
  return feed;
}

// ------------------------------------------------------------------ the public feed
// Kinds of talent that are people: shown only with consent. (The contract names
// professional, consultant and investor; mentor is a person too, so it follows the same rule.)
const PEOPLE_TALENT = new Set(['professional', 'consultant', 'investor', 'mentor']);
const PRIVATE_FIELDS = ['notes', 'contact', 'participants', 'scores'];

function buildPublic(priv) {
  const partners = priv._partners;
  // A contact may be shown when published, and, for a person, with consent.
  const byFeedId = new Map([...partners.values()].map((p) => [p.aih_feed_key || `partner-${p.id}`, p]));
  const personOk = (pid) => {
    const p = byFeedId.get(pid);
    return !!p && !!p.aih_published && (p.is_company || !!p.aih_consent);
  };
  const partnerIsCompany = (pid) => !!byFeedId.get(pid)?.is_company;
  const pub = (arr) => arr.filter((r) => r.published);
  const strip = (r) => { const o = { ...r }; for (const f of PRIVATE_FIELDS) delete o[f]; return o; };

  const programmes = pub(priv.programmes);
  const progIds = new Set(programmes.map((r) => r.id));
  const companies = pub(priv.companies).filter((r) => !r.programme_id || progIds.has(r.programme_id));
  const compIds = new Set(companies.map((r) => r.id));
  const mentors = pub(priv.mentors).filter((r) => r.consent);
  const mentorIds = new Set(mentors.map((r) => r.id));
  const suppliers = pub(priv.suppliers).filter((r) => r.kind === 'company' || r.consent).map(strip);
  const supplierIds = new Set(suppliers.map((r) => r.id));
  const challenges = pub(priv.challenges).map((r) => {
    if (r.company_id && !compIds.has(r.company_id)) { const o = { ...r }; delete o.company_id; o.org = null; return o; }
    return r;
  });
  const chalIds = new Set(challenges.map((r) => r.id));
  const applications = pub(priv.applications).filter((r) => chalIds.has(r.challenge_id))
    .map((r) => ({ ...r, supplier_id: supplierIds.has(r.supplier_id) ? r.supplier_id : null }));
  const appIds = new Set(applications.map((r) => r.id));
  const communities = pub(priv.communities);
  const comIds = new Set(communities.map((r) => r.id));
  const vibathons0 = pub(priv.vibathons);
  const vibIds = new Set(vibathons0.map((r) => r.id));
  const projects = pub(priv.projects).filter((r) => vibIds.has(r.vibathon_id)).map((r) => {
    const o = { ...strip(r), mentor_id: r.mentor_id && mentorIds.has(r.mentor_id) ? r.mentor_id : null };
    const keep = r.team_ids.map((pid, i) => [pid, r.team[i]]).filter(([pid]) => personOk(pid));
    o.team = keep.map(([, name]) => name);
    delete o.team_ids; // the ids stay in the private feed only
    return o;
  });
  const projIds = new Set(projects.map((r) => r.id));
  const pubEventIds = new Set(pub(priv.events).map((r) => r.id));

  return {
    hub: priv.hub, // only published activities are read
    programmes: programmes.map((r) => ({
      ...r, company_ids: r.company_ids.filter((i) => compIds.has(i)), mentor_ids: r.mentor_ids.filter((i) => mentorIds.has(i)),
    })),
    companies,
    mentors: mentors.map((r) => ({ ...r, company_ids: r.company_ids.filter((i) => compIds.has(i)) })),
    sessions: pub(priv.sessions).filter((r) => progIds.has(r.programme_id) && (!r.company_id || compIds.has(r.company_id)))
      .map((r) => ({ ...strip(r), mentor_id: mentorIds.has(r.mentor_id) ? r.mentor_id : null })),
    kpis: pub(priv.kpis).filter((r) => compIds.has(r.company_id)),
    reflections: pub(priv.reflections).filter((r) => progIds.has(r.programme_id)),
    challenges,
    suppliers,
    applications,
    matches: pub(priv.matches).filter((m) => chalIds.has(m.challenge_id)).map((m) => {
      const o = { ...m, ranked: m.ranked.filter((x) => appIds.has(x.application_id)),
        suggested_application_ids: m.suggested_application_ids.filter((i) => appIds.has(i)) };
      if (o.chosen_application_id && !appIds.has(o.chosen_application_id)) delete o.chosen_application_id;
      return o;
    }),
    vibathons: vibathons0.map((r) => ({
      ...strip(r), mentor_ids: r.mentor_ids.filter((i) => mentorIds.has(i)),
      event_id: r.event_id && pubEventIds.has(r.event_id) ? r.event_id : null,
      jury: r.jury.filter((j) => !j.partner_id || personOk(j.partner_id)).map(({ name, role }) => ({ name, role })),
      project_ids: r.project_ids.filter((i) => projIds.has(i)),
    })),
    projects,
    talent: pub(priv.talent).filter((r) => !(PEOPLE_TALENT.has(r.kind) || !partnerIsCompany(r.id)) || r.consent).map((r) => {
      const o = { ...r };
      if (o.community_id && !comIds.has(o.community_id)) delete o.community_id;
      return o;
    }),
    communities,
    events: pub(priv.events),
  };
}

// ------------------------------------------------------------------ encryption (WebCrypto, as in a browser)
const b64 = (u8) => Buffer.from(u8).toString('base64');
async function encrypt(plaintext, accessKey, iterations = 200000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(accessKey), 'PBKDF2', false, ['deriveKey']);
  const aes = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, new TextEncoder().encode(plaintext)));
  return { v: 1, kdf: { salt: b64(salt), iterations }, iv: b64(iv), ciphertext: b64(ct) };
}

// ------------------------------------------------------------------ main
const ENTITIES = ['programmes', 'companies', 'mentors', 'sessions', 'kpis', 'reflections', 'challenges', 'suppliers',
  'applications', 'matches', 'vibathons', 'projects', 'talent', 'communities', 'events'];
const countsOf = (f) => Object.fromEntries(ENTITIES.map((e) => [e, f[e].length]));

const version = await serverVersion();
const priv = await buildPrivate();
const pubBody = buildPublic(priv);
delete priv._partners;
const exported = new Date().toISOString();
const meta = (feed, body) => ({ feed, exported, odoo: { url: URL_, version, db: DB }, counts: countsOf(body) });
const publicFeed = { meta: meta('public', pubBody), ...pubBody };
const privateFeed = { meta: meta('private', priv), ...priv };

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'public.json'), JSON.stringify(publicFeed, null, 1) + '\n');
writeFileSync(join(OUT, 'private.enc.json'), JSON.stringify(await encrypt(JSON.stringify(privateFeed), ACCESS_KEY)) + '\n');
if (process.env.FEED_PRIVATE_PLAIN) {
  const p = resolve(process.env.FEED_PRIVATE_PLAIN);
  if (p.startsWith(repo + '/')) throw new Error('FEED_PRIVATE_PLAIN must be outside the repository');
  writeFileSync(p, JSON.stringify(privateFeed, null, 1) + '\n', { mode: 0o600 });
}
console.log(`Odoo ${version} at ${URL_} (db ${DB})`);
console.log('entity          public  private');
for (const e of ENTITIES) console.log(`${e.padEnd(15)} ${String(publicFeed.meta.counts[e]).padStart(6)}  ${String(privateFeed.meta.counts[e]).padStart(7)}`);
console.log(`wrote ${join(OUT, 'public.json')} and ${join(OUT, 'private.enc.json')}`);
