// Compile the talent map's real layer (organisations only, no private persons) from PrompTugal.news research.
// Dev-time script: the build does not run it (files starting with _ are skipped); the build only reads the compiled JSON.
// Usage: node scripts/pages/_talent-map-data.mjs <path to a PrompTugal__News__Website clone> [commit]
// Reads data/by-place/<municipality>.json for the 16 Algarve municipalities, quarteira.json (a parish of Loulé) and
// algarve.json (arrays ai_map, start_company, investors, contacts), plus the partners in src/data/ecosystem.json, and
// the Portuguese summaries in src/talent-map/data/what-pt.json. Writes src/talent-map/data/organisations.json.
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0; the compiled text is CC BY 4.0 (PrompTugal.news).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2] || process.env.PROMPTUGAL_DIR;
if (!src || !existsSync(join(src, 'data/by-place/faro.json'))) { console.error('usage: node scripts/pages/_talent-map-data.mjs <PrompTugal__News__Website clone> [commit]'); process.exit(1); }
const commit = process.argv[3] || '';
const read = f => JSON.parse(readFileSync(f, 'utf8'));
const places = read('src/data/places.json').municipalities;
const eco = read('src/data/ecosystem.json');
const sources = new Map(read('src/data/sources.json').sources.map(s => [s.url, s]));
const ptFile = 'src/talent-map/data/what-pt.json';
const pt = existsSync(ptFile) ? read(ptFile) : {};

const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = s => fold(s).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64).replace(/-$/, '');
const bare = s => fold(s).replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// The same organisation, named differently in different files.
const ALIAS = {
  'universidade do algarve ualg': 'universidade-do-algarve', 'universidade do algarve': 'universidade-do-algarve',
  'university of algarve': 'universidade-do-algarve',
  'algarve stp systems and technology partnership': 'algarve-stp', 'algarve stp': 'algarve-stp',
  'nera associacao empresarial da regiao do algarve': 'nera', 'nera the regional business association loule': 'nera', 'nera': 'nera',
  'gdg lagos google developer group': 'gdg-lagos', 'google developer group lagos': 'gdg-lagos',
  'municipio de alcoutim': 'municipio-de-alcoutim',
  'camara municipal de lagos': 'camara-municipal-de-lagos',
  'algarve 6 0 smart territorial hub': 'algarve-6-0-smart-territorial-hub',
  'eurocidade do guadiana ayamonte vila real de santo antonio castro marim': 'eurocidade-do-guadiana', 'eurocidade do guadiana': 'eurocidade-do-guadiana',
  'ualg tec campus': 'ualg-tec-campus',
  'portimao cowork': 'portimao-cowork', 'portimao cowork space': 'portimao-cowork',
  'celeiro de ideias': 'celeiro-de-ideias',
  'startup portimao': 'startup-portimao', 'startup portimao business incubator': 'startup-portimao',
  'cria': 'cria', 'cria university of algarve': 'cria',
};
const keyOf = name => ALIAS[bare(name)] || ALIAS[fold(name).replace(/[^a-z0-9]+/g, ' ').trim()] || slug(name);

// Roles a founder understands.
const KINDS = ['support', 'incubation', 'education', 'community', 'public', 'company', 'funding'];
const fromStart = { 'public desk': 'support', space: 'incubation', incubator: 'incubation', accelerator: 'incubation', mentoring: 'incubation', funding: 'support', community: 'community' };
const fromMap = { 'public body': 'public', company: 'company', startup: 'company', institution: 'education', community: 'community' };
const orgKind = e => {
  const s = fold(`${e.name} ${e.what}`);
  if (/incubat|ninho|nest\b|accelerat|cowork|colagos|fabrica do empreendedor|level up|celerator|startup portimao|business centre/.test(s)) return 'incubation';
  if (/colab|research|laborator|universi|school|escola|liceu|faculd/.test(s)) return 'education';
  if (/associa|consortium|business association|algarve evolution|algarve stp|parkalgar|interreg|project/.test(s)) return 'support';
  return 'support';
};
// Hand-checked kinds where the source type says less than the text.
const KIND_OVERRIDE = {
  'algarve-evolution': 'support', 'algarve-stp': 'support', 'nera': 'support', 'caritas-diocesana-do-algarve': 'community',
  'the-collab-bar': 'community', 'lagos-remoters': 'community', 'lagos-digital-nomads': 'community', 'tavira-works': 'incubation',
  'cowork-aljezur': 'incubation', 'ualg-tec-campus': 'incubation',
  'centro-ciencia-viva-de-tavira': 'education', 'territorios-criativos': 'community', 'loule-concelho-global': 'community',
  's2aquacolab': 'education', 'kipt-colab': 'education', 'digiatla': 'education', 'agrobotics-ditwins': 'education',
  'kttseadrones-cross-border-spain-and-portugal-project-with-a-sagres-pilot': 'education',
  'robotics4farmers-prr-agenda-with-municipio-de-alcoutim-as-a-named-partner': 'education',
  'loule-design-lab-loule-criativo': 'incubation', 'ninho-de-empresas-de-loule-iefp': 'incubation',
  'algarve-innovation-and-technology-park-pppita-pechao': 'incubation', 'parkalgar': 'support',
};

const TOWN_OF_FILE = Object.fromEntries(places.map(p => [p.id, p.id]));
TOWN_OF_FILE.quarteira = 'loule';
// Faro first (where most organisations are based), then the other municipalities, Quarteira, and the region last.
const files = ['faro', ...places.map(p => p.id).filter(id => id !== 'faro').sort(), 'quarteira', 'algarve'];

const orgs = new Map();
const dropped = { no_source: [], person: [], contacts_attached: 0 };
const ARRAYS = ['ai_map', 'start_company', 'investors'];
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

for (const file of files) {
  const d = read(join(src, 'data/by-place', `${file}.json`));
  const town = file === 'algarve' ? 'algarve' : TOWN_OF_FILE[file];
  for (const arr of ARRAYS) for (const e of d[arr] || []) {
    if (!e.source_url) { dropped.no_source.push(`${file}: ${e.name}`); continue; }
    if (e.role === 'person' || e.consent) { dropped.person.push(`${file}: ${e.name}`); continue; }
    const id = keyOf(e.name);
    const kind = KIND_OVERRIDE[id] || (arr === 'investors' ? 'funding' : arr === 'start_company' ? (fromStart[e.kind] || 'support') : (fromMap[e.type] || orgKind(e)));
    const occ = { town, what: clean(e.what), url: e.url || e.source_url, source_url: e.source_url, read_on: e.read_on, ai: clean(e.ai_path), amount: e.amount, date: e.date, arr };
    let o = orgs.get(id);
    if (!o) {
      o = { id, name: clean(e.name), kind, town, towns: [town], what: occ.what, url: occ.url, source_url: occ.source_url, read_on: occ.read_on };
      if (occ.ai) o.ai = occ.ai; if (occ.amount) o.amount = occ.amount; if (occ.date) o.date = occ.date;
      o.from = 'PrompTugal.news research'; o._kinds = { [arr]: kind };
      orgs.set(id, o);
    } else {
      if (!o.towns.includes(town)) o.towns.push(town);
      o._kinds[arr] ||= kind;
      if (occ.what !== o.what) (o.also ||= []).push({ town, what: occ.what, source_url: occ.source_url, read_on: occ.read_on });
    }
  }
  // Contacts: published channels. Attach to the organisation they belong to; otherwise list the body itself.
  for (const c of d.contacts || []) {
    if (!c.source_url) { dropped.no_source.push(`${file}: ${c.name}`); continue; }
    const base = clean(c.name.split(/[,:]/)[0]);
    const target = [...orgs.values()].find(o => o.towns.includes(town) && (bare(o.name) === bare(base) || keyOf(o.name) === keyOf(base) || bare(o.name.split(/[,:]/)[0]) === bare(base)));
    const contact = { label: clean(c.name), channel: clean(c.channel), url: c.url || c.source_url, source_url: c.source_url, read_on: c.read_on };
    if (target) { (target.contacts ||= []).push(contact); dropped.contacts_attached++; continue; }
    const id = keyOf(base);
    orgs.set(id, { id, name: base, kind: 'public', town, towns: [town], what: clean(c.what), url: contact.url, source_url: c.source_url, read_on: c.read_on, from: 'PrompTugal.news research', contacts: [contact] });
  }
}

// Algarve Evolution's partners, from src/data/ecosystem.json (also PrompTugal.news research).
const PARTNER_IDS = { ualg: 'universidade-do-algarve', stp: 'algarve-stp', nera: 'nera', gdg: 'gdg-lagos' };
const PARTNER_NEW = {
  amal: { name: 'AMAL, the Algarve intermunicipal community', kind: 'public' },
  anje: { name: 'ANJE, national association of young entrepreneurs', kind: 'support' },
  ja: { name: 'Junior Achievement Portugal', kind: 'education' },
  startupPt: { name: 'Startup Portugal', kind: 'support' },
};
for (const n of eco.nodes.filter(n => n.kind === 'partner')) {
  const url = eco.sources[n.src]?.url; if (!url) continue;
  const read_on = sources.get(url)?.read || '2026-11-06';
  const partner = { note: n.note, source_url: url, read_on };
  const id = PARTNER_IDS[n.id];
  if (id && orgs.has(id)) { orgs.get(id).partner = partner; continue; }
  const extra = PARTNER_NEW[n.id] || { name: n.label, kind: 'support' };
  const nid = id || slug(extra.name);
  orgs.set(nid, { id: nid, name: extra.name, kind: extra.kind, town: 'algarve', towns: ['algarve'], what: n.note, url, source_url: url, read_on,
    from: 'PrompTugal.news research (Algarve Evolution network data)', partner });
}
// Algarve Evolution itself: our own entry.
if (orgs.has('algarve-evolution')) orgs.get('algarve-evolution').us = true;

const out = [...orgs.values()].map(o => {
  // A role named in start_company (how to start a company here) says most to a founder, then investors, then the AI map.
  if (o._kinds && !KIND_OVERRIDE[o.id]) o.kind = o._kinds.start_company || o._kinds.investors || o._kinds.ai_map;
  delete o._kinds;
  if (pt[o.id]) o.pt = pt[o.id];
  return o;
}).sort((a, b) => fold(a.name).localeCompare(fold(b.name)));

const count = (f) => out.reduce((m, o) => { for (const k of [].concat(f(o))) m[k] = (m[k] || 0) + 1; return m; }, {});
const doc = {
  about: 'Organisations in the Algarve that a founder, a company or a student can turn to, compiled from PrompTugal.news public research. Organisations only: no private person is listed. Each entry keeps its source and the date it was read. Text CC BY 4.0 (PrompTugal.news); compiled by sites-dev@AgentiCCells.dinis with scripts/pages/_talent-map-data.mjs.',
  from: { repo: 'https://github.com/PrompTugal/PrompTugal__News__Website', commit, files: files.map(f => `data/by-place/${f}.json`).concat('src/data/ecosystem.json (partners)'), licence: 'Code Apache-2.0; text CC BY 4.0' },
  compiled: new Date().toISOString().slice(0, 10),
  kinds: KINDS,
  counts: { total: out.length, by_kind: count(o => o.kind), by_town: count(o => o.town), by_presence: count(o => o.towns) },
  organisations: out,
};
writeFileSync('src/talent-map/data/organisations.json', JSON.stringify(doc, null, 1) + '\n');
const missingPt = out.filter(o => !o.pt).map(o => o.id);
console.log(`organisations: ${out.length}; contacts attached: ${dropped.contacts_attached}; dropped without source: ${dropped.no_source.length}; persons skipped: ${dropped.person.length}; without pt: ${missingPt.length}`);
console.log('by kind', doc.counts.by_kind);
console.log('by town', doc.counts.by_town);
if (process.env.LIST_MISSING_PT) console.log(JSON.stringify(Object.fromEntries(out.filter(o => !o.pt).map(o => [o.id, o.what])), null, 1));
