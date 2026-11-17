// Odoo: the source of truth. How the AE Innovation Hub uses Odoo, and the "get more data into Odoo" side:
//   1. the architecture: Algarve Evolution's official Odoo (algarveevolution.pt, Odoo 19 Enterprise) and our
//      experimentation Odoo 19 Community with the algarve_innovation_hub addon, the two feeds, the hub and future apps;
//   2. the addon's models, with live counts from the feed (read from the addon's own source at build time);
//   3. a working "spreadsheet to Odoo" importer (src/hub/odoo.js): detect the model, map, validate, preview, and the
//      Odoo JSON-2 calls it would make (not sent), plus an Odoo-ready CSV for Odoo's own import;
//   4. "Ideas and needs": small requests kept in this browser, triaged, with the project.task call;
//   5. the public and private feeds side by side, and what is withheld and why.
// Owner: odoo@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const path = '/v2/odoo/';
export const title = 'Odoo: the source of truth';
export const nav = 'Odoo';

const ADDON = 'odoo/addons/algarve_innovation_hub';

// ---------------------------------------------------------------- the addon, read from its source
// Every model and field the page names is checked against the addon here, so the page cannot drift from Odoo.
function readAddon() {
  const models = {};
  for (const f of readdirSync(join(ADDON, 'models')).filter(f => f.endsWith('.py') && f !== '__init__.py')) {
    const src = readFileSync(join(ADDON, 'models', f), 'utf8');
    for (const block of src.split(/\nclass /).slice(1)) {
      const name = block.match(/\n\s+_name = '([^']+)'/)?.[1] || block.match(/\n\s+_inherit = '([^']+)'/)?.[1];
      if (!name) continue;
      const fields = [...block.matchAll(/\n {4}(\w+) = fields\.(\w+)\(/g)].map(m => ({ name: m[1], type: m[2] }));
      const m = models[name] ||= { name, file: f, extends: !block.match(/\n\s+_name = '/), description: block.match(/_description = '([^']+)'/)?.[1] || '', fields: [] };
      m.fields.push(...fields);
      if (/_inherit = \[[^\]]*'aih\.feed\.mixin'/.test(block)) m.mixin = true;
    }
  }
  // Fields from the feed mixin (feed id, published, simulated, source URL) count as the model's own.
  for (const m of Object.values(models)) if (m.mixin) m.inherited = models['aih.feed.mixin'].fields;
  const manifest = readFileSync(join(ADDON, '__manifest__.py'), 'utf8');
  return { models, version: manifest.match(/'version': '([^']+)'/)?.[1] || '', licence: manifest.match(/'license': '([^']+)'/)?.[1] || '' };
}

// The hub models: what each holds, its activity, and how to count it in a feed (src/hub/odoo.js counts the same way).
const MODELS = [
  { model: 'aih.hub', act: 'hub', holds: 'The hub itself: its name, "AE Innovation Hub".', count: 'hub', feed: 'hub.name' },
  { model: 'aih.activity', act: 'hub', holds: 'The four activities and their summaries, with António Guerreiro\'s keywords.', count: 'activities', feed: 'hub.activities' },
  { model: 'aih.programme', act: 'inc-acc', holds: 'Incubation and acceleration programmes: cohort, dates, six months, status, mentors.', count: 'programmes', feed: 'programmes' },
  { model: 'aih.programme.company', act: 'inc-acc', holds: 'The companies in a programme: sector, town, stage, their one-to-one mentor.', count: 'companies', feed: 'companies' },
  { model: 'aih.session', act: 'inc-acc', holds: 'Mentoring sessions: one-to-one, clinic or workshop, date, topic. Notes are private.', count: 'sessions', feed: 'sessions' },
  { model: 'aih.kpi', act: 'inc-acc', holds: 'A KPI snapshot per company per month, from month 0 to month 6: revenue, customers, team, funding, product stage.', count: 'kpis', feed: 'kpis' },
  { model: 'aih.reflection', act: 'inc-acc', holds: 'The programme\'s reflection on its indicators, by month.', count: 'reflections', feed: 'reflections' },
  { model: 'aih.challenge', act: 'challenge-connect', holds: 'Challenges: problem, town, requirements, skills wanted, budget, deadline, status, who decides, Algarve Evolution\'s suggested top 3.', count: 'challenges', feed: 'challenges, matches' },
  { model: 'aih.application', act: 'challenge-connect', holds: 'Suppliers\' answers to a challenge: proposal, price, days, and the match score, rank and reasons.', count: 'applications', feed: 'applications' },
  { model: 'aih.vibathon', act: 'vibathon', holds: 'Hackathons, workshops and buildathons: date, venue, the linked Odoo event, mentors, registrations, next steps.', count: 'vibathons', feed: 'vibathons' },
  { model: 'aih.vibathon.jury', act: 'vibathon', holds: 'The jury of each Vibathon: name and role.', count: 'jury', feed: 'vibathons[].jury' },
  { model: 'aih.vibathon.participant', act: 'vibathon', holds: 'Who took part, with e-mail and how they join (builder, designer, business). Private: never in the public feed.', count: 'participants', feed: 'vibathons[].participants', private: true },
  { model: 'aih.project', act: 'vibathon', holds: 'The projects presented at the end: team, summary, prize, next step, the mentor who follows it, and a chatter for office hours.', count: 'projects', feed: 'projects' },
  { model: 'aih.project.score', act: 'vibathon', holds: 'Each juror\'s score per criterion. Private.', count: 'scores', feed: 'projects[].scores', private: true },
  { model: 'aih.community', act: 'talent', holds: 'Communities of the ADI network (Algarve Digital Innovators) and near it, each with its source.', count: 'communities', feed: 'communities' },
  { model: 'aih.skill', act: 'shared', holds: 'Skills and competences, shared by mentors, suppliers and challenges, so matching can compare them.', count: 'skills', feed: 'expertise, capabilities, skills' },
  { model: 'res.partner', act: 'shared', ext: true, holds: 'Odoo\'s own Contacts, extended: mentors, suppliers and talent, with published, consent and simulated flags.', count: 'partners', feed: 'mentors, suppliers, talent' },
  { model: 'event.event', act: 'talent', ext: true, holds: 'Odoo\'s own Events, extended: the events read from algarveevolution.pt, each linking to its page there.', count: 'events', feed: 'events' },
];
const ACT = { hub: 'The hub', 'inc-acc': 'INC/ACC', 'challenge-connect': 'Challenge Connect', vibathon: 'Vibathon', talent: 'Talent Ecosystem', shared: 'Shared' };

export function countOf(feed, key) {
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

// The Algarve's 16 municipalities, and places people write instead of their municipality.
const TOWNS = ['Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Faro', 'Lagoa', 'Lagos', 'Loulé', 'Monchique', 'Olhão', 'Portimão', 'São Brás de Alportel', 'Silves', 'Tavira', 'Vila do Bispo', 'Vila Real de Santo António'];
const LOCALITIES = { quarteira: 'Loulé', vilamoura: 'Loulé', almancil: 'Loulé', 'armacao de pera': 'Silves', alvor: 'Portimão', 'praia da rocha': 'Portimão', sagres: 'Vila do Bispo', parchal: 'Lagoa', carvoeiro: 'Lagoa', montenegro: 'Faro', gambelas: 'Faro', 'monte gordo': 'Vila Real de Santo António', 'vila real de sto antonio': 'Vila Real de Santo António', vrsa: 'Vila Real de Santo António', 'sao bras': 'São Brás de Alportel' };

// ---------------------------------------------------------------- the importer's targets
// Each sample spreadsheet maps to one hub model. `aliases` are header names (English and Portuguese) that map to a
// field; `feed` is the same value's name in the feed, used to show what an update would change.
const TARGETS = [
  {
    id: 'mentors', label: 'Mentors', model: 'res.partner', entity: 'mentors', sample: 'mentors.csv', sampleLabel: 'Mentors list', personas: 'mentor staff',
    note: 'Contacts flagged as mentors. Odoo\'s Contacts exist in every Odoo; the aih_ fields come with the addon.',
    fixed: { aih_is_mentor: true, is_company: false, aih_published: false },
    fields: [
      { f: 'name', label: 'Name', req: true, type: 'char', feed: 'name', aliases: ['name', 'nome', 'full name', 'nome completo', 'mentor'] },
      { f: 'email', label: 'E-mail', type: 'email', aliases: ['email', 'e-mail', 'mail', 'correio electronico', 'correio eletronico'] },
      { f: 'phone', label: 'Phone', type: 'char', aliases: ['phone', 'telefone', 'telemovel', 'mobile', 'tel'] },
      { f: 'city', label: 'Town', type: 'town', feed: 'town', aliases: ['town', 'city', 'municipality', 'concelho', 'cidade', 'localidade'] },
      { f: 'aih_mentor_kind', label: 'Mentor kind', type: 'selection', feed: 'kind', options: { one_to_one: ['one to one', 'one-to-one', '1:1', 'um-para-um', 'um para um', 'individual'], guest: ['guest', 'convidado', 'convidada', 'guest mentor'] }, aliases: ['mentor kind', 'kind', 'tipo de mentoria', 'tipo de mentor'] },
      { f: 'aih_expertise_ids', label: 'Expertise', type: 'skills', feed: 'expertise', aliases: ['expertise', 'skills', 'areas de especialidade', 'areas', 'especialidade', 'competencias'] },
      { f: 'aih_consent', label: 'Consent to be listed', type: 'bool', feed: 'consent', aliases: ['consent', 'consentimento', 'rgpd', 'gdpr', 'autoriza'] },
    ],
  },
  {
    id: 'startups', label: 'Startups in a programme', model: 'aih.programme.company', entity: 'companies', sample: 'startups.csv', sampleLabel: 'Startups list', personas: 'founder staff',
    note: 'Companies in an incubation or acceleration programme. This model exists where the addon is installed.',
    fixed: { is_published: false },
    fields: [
      { f: 'name', label: 'Name', req: true, type: 'char', feed: 'name', aliases: ['company', 'name', 'startup', 'empresa', 'nome', 'company name'] },
      { f: 'sector', label: 'Sector', type: 'char', feed: 'sector', aliases: ['sector', 'setor', 'industry', 'area'] },
      { f: 'town', label: 'Town', type: 'town', feed: 'town', aliases: ['town', 'city', 'municipality', 'concelho', 'cidade', 'localidade'] },
      { f: 'stage', label: 'Stage', type: 'selection', feed: 'stage', options: { idea: ['idea', 'ideia'], pre_seed: ['pre-seed', 'pre seed', 'preseed'], seed: ['seed'], early_revenue: ['early revenue', 'first revenue', 'primeiras vendas'], growth: ['growth', 'crescimento'] }, aliases: ['stage', 'fase', 'estagio'] },
      { f: 'programme_id', label: 'Programme', type: 'ref', ref: 'programmes', feed: 'programme_id', aliases: ['programme', 'program', 'programa', 'cohort', 'coorte'] },
      { f: 'website', label: 'Website', type: 'url', aliases: ['website', 'site', 'url', 'web'] },
      { f: 'summary', label: 'Summary', type: 'text', feed: 'summary', aliases: ['description', 'summary', 'descricao', 'resumo', 'about'] },
    ],
  },
  {
    id: 'suppliers', label: 'Challenge suppliers', model: 'res.partner', entity: 'suppliers', sample: 'suppliers.csv', sampleLabel: 'Challenge suppliers', personas: 'supplier challenger staff',
    note: 'Contacts flagged as suppliers for Challenge Connect: companies, or individual professionals.',
    fixed: { aih_is_supplier: true, aih_published: false },
    fields: [
      { f: 'name', label: 'Name', req: true, type: 'char', feed: 'name', aliases: ['supplier', 'name', 'fornecedor', 'nome', 'company'] },
      { f: 'is_company', label: 'Company or individual', type: 'selection', feed: 'kind', feedMap: { true: 'company', false: 'individual' }, options: { true: ['company', 'empresa', 'lda', 'sa', 'organisation'], false: ['individual', 'freelancer', 'professional', 'profissional', 'person', 'pessoa'] }, aliases: ['type', 'tipo', 'kind', 'company or individual'] },
      { f: 'city', label: 'Town', type: 'town', feed: 'town', aliases: ['town', 'city', 'municipality', 'concelho', 'cidade', 'localidade'] },
      { f: 'aih_capability_ids', label: 'Capabilities', type: 'skills', feed: 'capabilities', aliases: ['capabilities', 'skills', 'competencias', 'servicos', 'services'] },
      { f: 'aih_rate', label: 'Rate', type: 'char', feed: 'rate', aliases: ['rate', 'day rate', 'hourly rate', 'preco', 'taxa', 'price'] },
      { f: 'email', label: 'E-mail', type: 'email', aliases: ['email', 'e-mail', 'mail'] },
      { f: 'phone', label: 'Phone', type: 'char', aliases: ['phone', 'telefone', 'telemovel', 'mobile'] },
      { f: 'aih_consent', label: 'Consent to be listed', type: 'bool', feed: 'consent', aliases: ['consent', 'consentimento', 'rgpd', 'gdpr'] },
    ],
  },
  {
    id: 'participants', label: 'Event participants', model: 'aih.vibathon.participant', entity: null, sample: 'participants.csv', sampleLabel: 'Event participants', personas: 'participant staff',
    note: 'Who registered for a Vibathon. Private: participants never reach the public feed.',
    fixed: {},
    fields: [
      { f: 'vibathon_id', label: 'Vibathon', req: true, type: 'ref', ref: 'vibathons', aliases: ['event', 'vibathon', 'evento', 'hackathon', 'workshop'] },
      { f: 'name', label: 'Name', req: true, type: 'char', aliases: ['participant', 'name', 'nome', 'participante', 'registrant'] },
      { f: 'email', label: 'E-mail', type: 'email', aliases: ['email', 'e-mail', 'mail'] },
    ],
  },
  {
    id: 'community', label: 'Community members', model: 'res.partner', entity: 'talent', sample: 'community.csv', sampleLabel: 'Community members', personas: 'visitor staff',
    note: 'People in the Talent Ecosystem: professionals, consultants, mentors and investors, linked to their community of the ADI network.',
    fixed: { aih_published: false },
    fields: [
      { f: 'name', label: 'Name', req: true, type: 'char', feed: 'name', aliases: ['name', 'nome', 'member', 'membro'] },
      { f: 'aih_talent_kind', label: 'Talent kind', type: 'selection', feed: 'kind', options: { professional: ['professional', 'profissional'], consultant: ['consultant', 'consultor', 'consultora'], mentor: ['mentor', 'mentora'], investor: ['investor', 'investidor', 'investidora', 'business angel'], informal_group: ['informal group', 'grupo informal'], partner: ['partner', 'parceiro', 'project partner'], stakeholder: ['stakeholder', 'parte interessada'] }, aliases: ['perfil', 'profile', 'talent kind', 'kind', 'role', 'papel'] },
      { f: 'city', label: 'Town', type: 'town', feed: 'town', aliases: ['town', 'city', 'municipality', 'concelho', 'cidade', 'localidade'] },
      { f: 'aih_community_id', label: 'Community', type: 'ref', ref: 'communities', feed: 'community_id', aliases: ['community', 'comunidade', 'group', 'grupo'] },
      { f: 'category_id', label: 'Tags', type: 'tags', feed: 'tags', aliases: ['tags', 'etiquetas', 'skills', 'competencias', 'areas'] },
      { f: 'aih_consent', label: 'Consent to be listed', type: 'bool', feed: 'consent', aliases: ['consent', 'consentimento', 'rgpd', 'gdpr'] },
      { f: 'email', label: 'E-mail', type: 'email', aliases: ['email', 'e-mail', 'mail'] },
    ],
  },
];

// ---------------------------------------------------------------- ideas and needs
const LANES = [
  { id: 'config', label: 'Odoo, by configuration', short: 'Configuration', text: 'Done in Algarve Evolution\'s own Odoo with what it already has: a list view, a filter, an export, a field added with Studio (Enterprise), a website edit. No code.' },
  { id: 'experiment', label: 'An experiment here', short: 'Experiment', text: 'Tried first in the experimentation Odoo and on this hub, where it is cheap to change. If it works, it moves to the official Odoo.' },
  { id: 'partner', label: 'The Odoo partner', short: 'Odoo partner', text: 'Needs the partner who runs the official Odoo: hosting, upgrades (Odoo 20), integrations, installing the addon, access rights.' },
];
const KINDS = [
  { id: 'idea', label: 'An idea', lane: 'experiment' },
  { id: 'need', label: 'A need', lane: 'experiment' },
  { id: 'data_fix', label: 'Data fix', lane: 'config' },
  { id: 'new_field', label: 'New field', lane: 'config' },
  { id: 'report', label: 'Report', lane: 'config' },
  { id: 'page_change', label: 'Page change', lane: 'config' },
  { id: 'export', label: 'Export', lane: 'config' },
  { id: 'integration', label: 'Integration or upgrade', lane: 'partner' },
];
// Example requests, invented for the prototype (simulated): the "death by a thousand cuts" kind.
const SEED_REQUESTS = [
  { id: 'req-s1', kind: 'data_fix', title: 'Twelve contacts have the town written as "Loule"', who: 'the Algarve Evolution team', due: '2026-11-20', details: 'Fix them to Loulé so the Challenge Connect town score works.', lane: 'config', how: 'In Contacts, filter City = Loule, select all, edit the city once (list view mass edit).' },
  { id: 'req-s2', kind: 'new_field', title: 'Add "year founded" to the startup form', who: 'INC/ACC programme', due: '2026-11-28', details: 'The programme partner asks for it in the month 6 report.', lane: 'config', how: 'Studio in Odoo Enterprise adds the field to the form; or add it to the addon here first.' },
  { id: 'req-s3', kind: 'report', title: 'Mentoring hours per programme, every month', who: 'the programme partner', due: '2026-12-01', details: 'One table: programme, mentor, sessions, hours.', lane: 'config', how: 'A pivot view on mentoring sessions grouped by programme and mentor, saved as a favourite.' },
  { id: 'req-s4', kind: 'export', title: 'Export the list of mentors who agreed to be listed', who: 'a co-financed project partner', due: '2026-11-24', details: 'Name, expertise and town only.', lane: 'config', how: 'Contacts, filter Mentor and Consent, Export with the three columns.' },
  { id: 'req-s5', kind: 'page_change', title: 'Show the next Vibathon on the events page', who: 'Communication', due: '2026-11-21', details: 'Its date moved to 20 February 2027.', lane: 'config', how: 'Edit the event in Events; the website shows it.' },
  { id: 'req-s6', kind: 'need', title: 'Startups should update their own KPIs each month', who: 'Founders in the programme', due: '2027-01-15', details: 'Today they send a spreadsheet by e-mail and someone copies it into Odoo.', lane: 'experiment', how: 'A KPI form on this hub writing aih.kpi records; then the Odoo portal.' },
  { id: 'req-s7', kind: 'idea', title: 'A reminder to mentors the day before each session', who: 'Mentors', due: '2027-01-31', details: 'Many sessions are rescheduled at the last minute.', lane: 'experiment', how: 'An automation rule on aih.session in the experimentation Odoo, then the same rule in the official one.' },
  { id: 'req-s8', kind: 'integration', title: 'Install the hub\'s models in the official Odoo, then upgrade to Odoo 20', who: 'the Algarve Evolution team', due: '2027-03-31', details: 'Once the experiments settle.', lane: 'partner', how: 'The partner installs the addon (or rebuilds the models with Studio) and plans the upgrade.' },
].map(r => ({ ...r, simulated: true, created: '2026-11-16' }));

// ---------------------------------------------------------------- render
export function render({ layout, feed, data, h }) {
  const { esc, num } = h;
  const addon = readAddon();
  for (const m of MODELS) if (!addon.models[m.model]) throw new Error(`odoo.mjs: model ${m.model} is not in the addon`);
  for (const t of TARGETS) {
    const am = addon.models[t.model]; if (!am) throw new Error(`odoo.mjs: target model ${t.model} is not in the addon`);
    const std = new Set(['name', 'email', 'phone', 'city', 'is_company', 'category_id']); // Odoo's own res.partner fields
    for (const f of [...t.fields.map(x => x.f), ...Object.keys(t.fixed)]) if (![...am.fields, ...(am.inherited || [])].some(x => x.name === f) && !(t.model === 'res.partner' && std.has(f))) throw new Error(`odoo.mjs: ${t.model}.${f} is not in the addon`);
  }
  const newModels = MODELS.filter(m => !m.ext).length, extModels = MODELS.filter(m => m.ext).length;
  const pubTotal = Object.values(feed.meta.counts).reduce((a, b) => a + b, 0);
  const official = data.odoo; // read from algarveevolution.pt's public pages (src/data/odoo.json)
  const offUrl = official.source;
  const offRead = h.date(official.read);
  const exp = feed.meta.odoo;
  const counts = Object.fromEntries(MODELS.map(m => [m.model, countOf(feed, m.count)]));
  const actCount = {
    'inc-acc': feed.programmes.length + feed.companies.length + feed.sessions.length + feed.kpis.length,
    'challenge-connect': feed.challenges.length + feed.applications.length + feed.suppliers.length,
    vibathon: feed.vibathons.length + feed.projects.length,
    talent: feed.talent.length + feed.communities.length + feed.events.length,
  };
  const acts = feed.hub.activities;

  // -------- the architecture, wide (900 px and up) and stacked (phones)
  const T = (x, y, s, cls = '') => `<text x="${x}" y="${y}"${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;
  const box = (x, y, w, hh, cls, lines) => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6"/>${lines.map(([s, c], i) => T(x + 14, y + 26 + i * 19, s, c)).join('')}</g>`;
  let mk = 'ahw'; // each SVG has its own marker: a marker inside a hidden SVG does not draw
  const arrow = (d, cls = '') => `<path class="ar ${cls}" d="${d}" marker-end="url(#${mk})"/>`;
  const defsOf = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker></defs>`;
  const actShort = { 'inc-acc': ['INC/ACC', 'incubation,', 'acceleration,', 'mentors, KPIs'], 'challenge-connect': ['Challenge Connect', 'challenges,', 'suppliers,', 'matching'], vibathon: ['Vibathon', 'hackathons,', 'workshops,', 'juries'], talent: ['Talent Ecosystem', 'talent, competences,', 'partners,', 'ADI network'] };
  const actBoxes = (x0, y0, w, gap) => acts.map((a, i) => {
    const [n, ...k] = actShort[a.id] || [a.name];
    const x = x0 + i * (w + gap);
    return `<g class="d-act"><rect x="${x}" y="${y0}" width="${w}" height="118" rx="6"/>${T(x + 12, y0 + 24, n, 'd-h d-h-s')}${k.map((s, j) => T(x + 12, y0 + 44 + j * 17, s, 'd-s')).join('')}${T(x + 12, y0 + 106, `${num(actCount[a.id])} records`, 'd-n')}</g>`;
  }).join('');
  const wide = `<svg class="arch arch-wide" viewBox="0 0 1200 730" role="img" aria-labelledby="arch-t arch-d"><title id="arch-t">How the AE Innovation Hub uses Odoo</title><desc id="arch-d">Spreadsheets and public sources go into Odoo through the importer. Odoo infrastructure is the base layer under the four activities: our experimentation Odoo 19 Community with the hub addon, and Algarve Evolution's official Odoo 19 Enterprise at algarveevolution.pt. What works moves from the experiment to the official Odoo. The experimentation Odoo exports a public feed and an encrypted private feed, read by this hub and by future apps. The official Odoo feeds the official site. Ideas and needs flow in along the bottom and are triaged.</desc>${defsOf('ahw')}
  ${T(20, 28, 'IN', 'd-k')}${T(250, 28, 'THE FOUR ACTIVITIES, ON ODOO', 'd-k')}${T(930, 28, 'OUT', 'd-k')}
  ${actBoxes(250, 40, 151, 12)}
  <g class="d-infra"><rect x="240" y="172" width="660" height="392" rx="10"/>${T(262, 548, 'ODOO INFRASTRUCTURE', 'd-k2')}</g>
  ${box(262, 196, 616, 124, 'd-exp', [['Experimentation Odoo', 'd-h'], ['Odoo 19 Community, run by the PrompTugal team, with the hub\'s own models', 'd-s'], [`addon algarve_innovation_hub ${addon.version}: ${newModels} new models, ${extModels} of Odoo's extended`, 'd-m'], ['The place to try things: cheap to change, simulated data where real data is missing.', 'd-s'], ['Odoo 20 can run here first, to test the addon before the official upgrade.', 'd-s']])}
  ${arrow('M570 322 L 570 382', 'ar-promote')}${T(584, 357, 'promote what works', 'd-l d-l-promote')}
  ${box(262, 388, 616, 124, 'd-off', [['Official Odoo', 'd-h'], ['algarveevolution.pt', 'd-m'], ['Odoo 19 Enterprise; upgrade to Odoo 20 planned.', 'd-s'], ['The mature system: website, events, news, contacts.', 'd-s'], [`Read today through its public pages: ${num(official.events.length)} events and ${num(official.posts.length)} news posts.`, 'd-s']])}
  ${box(20, 196, 186, 120, 'd-in', [['Spreadsheets', 'd-h'], ['lists kept outside Odoo', 'd-s'], ['today: mentors, startups,', 'd-s'], ['suppliers, participants,', 'd-s'], ['community members', 'd-s']])}
  ${box(20, 340, 186, 120, 'd-in', [['Public sources', 'd-h'], ['communities, partners,', 'd-s'], ['events (also from', 'd-s'], ['algarveevolution.pt), each', 'd-s'], ['with its source URL', 'd-s']])}
  ${arrow('M206 250 L 256 250')}${T(207, 240, 'importer', 'd-l')}
  ${arrow('M206 400 C 232 400 230 300 256 296')}
  ${box(930, 52, 120, 96, 'd-app', [['This hub', 'd-h'], ['AE Innovation', 'd-s'], ['Hub site, reads', 'd-s'], ['the feeds', 'd-s']])}
  ${box(1060, 52, 120, 96, 'd-app d-future', [['iOS app', 'd-h'], ['future: the', 'd-s'], ['same feeds, no', 'd-s'], ['new backend', 'd-s']])}
  ${T(930, 200, 'export, read-only API key', 'd-l')}
  ${box(930, 212, 250, 52, 'd-feed', [['Public feed', 'd-h'], ['', '']])}${T(944, 255, `public.json · ${num(pubTotal)} records`, 'd-s')}
  ${box(930, 278, 250, 52, 'd-feed d-priv', [['Private feed', 'd-h'], ['', '']])}${T(944, 321, 'private.enc.json · encrypted, key', 'd-s')}
  ${arrow('M878 238 L 924 238')}${arrow('M878 300 L 924 302')}
  ${arrow('M990 212 L 990 154')}${arrow('M1120 212 L 1120 154', 'ar-dash')}
  ${box(930, 404, 250, 92, 'd-off2', [['Official website', 'd-h'], ['algarveevolution.pt, built on the', 'd-s'], ['official Odoo; people read and', 'd-s'], ['register there', 'd-s']])}
  ${arrow('M878 450 L 924 450')}
  <g class="d-ideas"><rect x="20" y="640" width="1160" height="76" rx="8"/>${T(40, 670, 'IDEAS AND NEEDS', 'd-k2')}${T(40, 694, 'From the team, founders, mentors and partners: triaged into Odoo by configuration, an experiment here, or the Odoo partner.', 'd-s')}</g>
  ${arrow('M420 640 L 420 570')}${arrow('M720 640 L 720 570')}
</svg>`;
  mk = 'aht';
  const tallActs = acts.map((a, i) => {
    const [n, ...k] = actShort[a.id] || [a.name];
    const x = 12 + (i % 2) * 172, y = 142 + Math.floor(i / 2) * 100;
    return `<g class="d-act"><rect x="${x}" y="${y}" width="164" height="94" rx="6"/>${T(x + 10, y + 20, n, 'd-h d-h-s')}${k.map((s, j) => T(x + 10, y + 37 + j * 15, s, 'd-s')).join('')}${T(x + 10, y + 84, `${num(actCount[a.id])} records`, 'd-n')}</g>`;
  }).join('');
  const tall = `<svg class="arch arch-tall" viewBox="0 0 360 1010" role="img" aria-labelledby="arch-t2 arch-d"><title id="arch-t2">How the AE Innovation Hub uses Odoo</title>${defsOf('aht')}
  ${box(12, 10, 164, 76, 'd-in', [['Spreadsheets', 'd-h'], ['lists outside Odoo', 'd-s'], ['into the importer', 'd-s']])}
  ${box(184, 10, 164, 76, 'd-in', [['Public sources', 'd-h'], ['communities, events', 'd-s'], ['with their source', 'd-s']])}
  ${arrow('M94 86 L 94 132')}${arrow('M266 86 L 266 132')}
  <g class="d-infra"><rect x="4" y="124" width="352" height="560" rx="10"/>${T(64, 672, 'ODOO INFRASTRUCTURE', 'd-k2')}</g>
  ${tallActs}
  ${box(12, 344, 336, 128, 'd-off', [['Official Odoo', 'd-h'], ['algarveevolution.pt', 'd-m'], ['Odoo 19 Enterprise, Odoo 20 planned', 'd-s'], ['feeds the official website', 'd-s'], [`read today: ${official.events.length} events, ${official.posts.length} posts`, 'd-s']])}
  ${arrow('M180 510 L 180 478', 'ar-promote')}${T(192, 498, 'promote what works', 'd-l d-l-promote')}
  ${box(12, 514, 336, 130, 'd-exp', [['Experimentation Odoo', 'd-h'], ['Odoo 19 Community, run by us', 'd-s'], [`addon algarve_innovation_hub`, 'd-m'], [`${newModels} new models, ${extModels} extended`, 'd-s'], ['cheap to change; can run Odoo 20 first', 'd-s']])}
  ${arrow('M40 646 L 40 712')}${arrow('M320 646 L 320 712')}
  ${box(12, 716, 164, 76, 'd-feed', [['Public feed', 'd-h'], [`${num(pubTotal)} records`, 'd-s'], ['public.json', 'd-m']])}
  ${box(184, 716, 164, 76, 'd-feed d-priv', [['Private feed', 'd-h'], ['encrypted, key', 'd-s'], ['private.enc.json', 'd-m']])}
  ${arrow('M180 794 L 180 816')}
  ${box(12, 820, 164, 70, 'd-app', [['This hub', 'd-h'], ['reads the feeds', 'd-s']])}
  ${box(184, 820, 164, 70, 'd-app d-future', [['Future: iOS app', 'd-h'], ['the same feeds', 'd-s']])}
  <g class="d-ideas"><rect x="4" y="910" width="352" height="92" rx="8"/>${T(16, 936, 'IDEAS AND NEEDS', 'd-k2')}${T(16, 958, 'from the team, founders, mentors and', 'd-s')}${T(16, 976, 'partners; triaged: configuration, an', 'd-s')}${T(16, 994, 'experiment here, or the Odoo partner', 'd-s')}</g>
</svg>`;

  // -------- the models table
  const modelRows = MODELS.map(m => {
    const am = addon.models[m.model];
    return `<tr data-model="${esc(m.model)}"><th scope="row"><code>${esc(m.model)}</code>${m.ext ? '<span class="od-ext">Odoo\'s own, extended</span>' : ''}</th><td data-th="Activity" class="od-act">${esc(ACT[m.act])}</td><td data-th="What it holds">${esc(m.holds)}<span class="od-meta">${am.fields.length} ${am.fields.length === 1 ? 'field' : 'fields'}${m.ext ? ' added' : ''} · feed: <code>${esc(m.feed)}</code></span></td><td data-th="Public" class="num od-cnt" data-count="pub">${m.private ? '<span class="od-none" title="Private: never in the public feed">private</span>' : num(counts[m.model])}</td><td data-th="Private" class="num od-cnt" data-count="priv" data-key="${esc(m.count)}"><span class="od-locked">locked</span></td></tr>`;
  }).join('');

  // -------- the feed explorer (public side at build time; src/hub/odoo.js adds the private side)
  const ENT = Object.keys(feed.meta.counts);
  const max = Math.max(...ENT.map(e => feed.meta.counts[e]));
  const feedRows = ENT.map(e => `<tr data-ent="${e}"><th scope="row">${esc(e)}</th><td class="od-n">${num(feed.meta.counts[e])}</td><td class="od-n" data-priv><span class="od-locked">locked</span></td><td class="od-n" data-held>?</td><td class="od-bar-cell"><svg class="od-bar" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><rect class="b-priv" x="0" y="0" width="0" height="14"/><rect class="b-pub" x="0" y="0" width="${(200 * feed.meta.counts[e] / max).toFixed(1)}" height="14"/></svg></td></tr>`).join('');

  // -------- what moves to the official Odoo
  const moves = [
    ['The hub\'s models (programmes, KPIs, challenges, Vibathons, talent)', 'Installed as the addon, which needs an Odoo that accepts custom addons (Odoo.sh or self-hosted). On Odoo Online the same models can be rebuilt with Studio. We do not know how their Odoo is hosted.', 'Odoo partner'],
    ['A field or a rule that proved useful here', 'Added in the official Odoo with Studio or by the partner, with the same technical name, so feeds and apps keep working.', 'Configuration'],
    ['Spreadsheet mappings from the importer', 'Odoo\'s own import (Favourites keep the column mapping), or a scheduled import job written once the format is stable.', 'Configuration'],
    ['Ideas and needs', 'A project in Odoo\'s Project app, with the three triage lanes as tags or stages.', 'Configuration'],
    ['The feed exporter', 'Runs in their CI with a read-only API key of their own, and publishes the two feeds. The keys stay with them.', 'Odoo partner'],
    ['Odoo 20', 'We run Odoo 20 here first, test the addon and the feeds on it, then they upgrade with fewer surprises.', 'Experiment'],
  ];
  const laneOf = { Configuration: 'config', Experiment: 'experiment', 'Odoo partner': 'partner' };

  const config = {
    odoo: { experiment: { url: exp.url, db: exp.db, version: exp.version }, official: { url: offUrl.replace(/\/$/, ''), db: '<their database>', version: `${official.odoo} Enterprise` } },
    towns: TOWNS, localities: LOCALITIES, targets: TARGETS, models: MODELS.map(({ model, count, private: p }) => ({ model, count, private: !!p })),
    lanes: LANES, kinds: KINDS, seeds: SEED_REQUESTS, skills: [...new Set([...feed.mentors.flatMap(r => r.expertise), ...feed.suppliers.flatMap(r => r.capabilities), ...feed.challenges.flatMap(r => r.skills)])].sort(),
  };

  const NOT_STAFF = 'visitor founder mentor challenger supplier participant';
  const head = (n, kick, h2, lede) => `<div class="hub-head"><p class="kicker">${n} · ${esc(kick)}</p><h2 class="hub-h2">${esc(h2)}</h2><p class="hub-lede">${lede}</p></div>`;
  const body = `
<section class="od-hero">
  <div class="hub-wrap od-hero-grid">
    <div class="od-hero-copy">
      <p class="kicker kicker-light">Odoo infrastructure</p>
      <h1>Odoo: the source of truth</h1>
      <p class="lede">Every number, list and card on this hub is read from Odoo. Algarve Evolution already runs its official site on Odoo. Next to it we keep an Odoo for experiments, where the hub's four activities live today. Here is how the two fit, and how more of what the team keeps in spreadsheets and e-mails can get into Odoo.</p>
      <p class="od-hero-links"><a class="btn btn-accent" href="#import">Try the spreadsheet importer</a> <a class="btn btn-on-navy" href="#ideas-and-needs">Bring an idea or a need</a></p>
    </div>
    <dl class="od-two">
      <div class="od-two-off"><dt>Official Odoo</dt><dd><a href="${esc(offUrl)}" rel="noopener">algarveevolution.pt</a>, Odoo ${esc(official.odoo)} Enterprise; Odoo 20 planned</dd><dd class="od-two-n"><b>${num(official.events.length)}</b> events and <b>${num(official.posts.length)}</b> news posts read from its public pages on ${esc(offRead)} (<a href="/v1/odoo/">the V1 page</a>, <a href="/data/odoo.json">data</a>)</dd></div>
      <div class="od-two-exp"><dt>Experimentation Odoo</dt><dd>Odoo ${esc(exp.version)} Community with the addon <code>algarve_innovation_hub</code> ${esc(addon.version)}, run by the PrompTugal team</dd><dd class="od-two-n"><b>${num(pubTotal)}</b> records in the public feed, exported ${esc(h.date(feed.meta.exported))}</dd></div>
    </dl>
  </div>
</section>

<nav class="od-toc" aria-label="On this page"><div class="hub-wrap"><ol>
  <li><a href="#arch">How it fits</a></li><li><a href="#models">The models</a></li><li><a href="#import">Spreadsheet to Odoo</a></li><li><a href="#ideas-and-needs">Ideas and needs</a></li><li><a href="#feeds">Public and private</a></li><li><a href="#official">To the official Odoo</a></li>
</ol></div></nav>

<section id="arch" class="hub-sec">
  <div class="hub-wrap">
    ${head(1, 'How it fits', 'Two Odoos, one source of truth', 'The official Odoo is the mature system: the website, events and news that people use today. The experimentation Odoo is where we try things quickly, with the hub\'s own models and simulated data where real data is missing. When something works, it moves to the official Odoo. As on António Guerreiro\'s whiteboard, Odoo is the layer under all four activities, spreadsheets flow in, and ideas and needs come in along the bottom.')}
    <figure class="od-fig">
      ${wide}${tall}
      <figcaption>${h.odoo('aih.hub', 1)} ${h.odoo('aih.activity', acts.length)} Counts are from the public feed. <span class="od-fig-dash"><svg width="28" height="8" aria-hidden="true"><path d="M0 4h28" class="ar ar-dash"/></svg> dashed: not built yet, or read from public pages</span></figcaption>
    </figure>
    <ol class="od-steps">
      <li><b>In.</b> Spreadsheets go through the <a href="#import">importer</a>; public organisations, communities and events come in with their source URL. Ideas and needs are <a href="#ideas-and-needs">triaged</a>.</li>
      <li><b>Experiment.</b> Our Odoo 19 Community holds the addon's ${newModels} models (and extends Contacts and Events). Records carry <code>published</code>, <code>consent</code> and <code>simulated</code> flags.</li>
      <li><b>Feeds.</b> A read-only Odoo user exports two files: the <a href="/feeds/public.json">public feed</a> (published records, public fields, people only with consent) and the private feed, encrypted, for the team.</li>
      <li><b>Out.</b> This hub, and later an iOS app, read only the feeds. Nothing else is a source.</li>
      <li><b>Promote.</b> What works <a href="#official">moves to the official Odoo</a>, which keeps feeding the official site.</li>
    </ol>
  </div>
</section>

<section id="models" class="hub-sec hub-sec-mist">
  <div class="hub-wrap">
    <div class="hub-head-row">
      ${head(2, 'The models', 'What the addon keeps in Odoo', `The addon <code>algarve_innovation_hub</code> (${esc(addon.version)}, ${esc(addon.licence)}) adds ${newModels} models and extends two of Odoo's own. This table is read from its source code when the site is built; the counts come from the feed.`)}
      ${h.odoo('aih.*', MODELS.length)}
    </div>
    <div class="persona-panel persona-panel-private od-pp" data-only="staff"><p class="persona-panel-head">Algarve Evolution team</p><p>The Private column is counted from the private feed open in this tab: everything in Odoo, published or not.</p></div>
    <div class="persona-panel od-pp" data-only="${NOT_STAFF}"><p class="persona-panel-head">The private column</p><p>Try the page as the <b>Algarve Evolution team</b> (with the access key) to count what Odoo holds beyond the public feed.</p></div>
    <div class="hub-table-wrap">
      <table class="hub-table hub-table-pairs od-models-t">
        <thead><tr><th scope="col">Odoo model</th><th scope="col">Activity</th><th scope="col">What it holds</th><th scope="col" class="num">Public</th><th scope="col" class="num">Private</th></tr></thead>
        <tbody>${modelRows}</tbody>
      </table>
    </div>
    <p class="src">Source: <code>odoo/addons/algarve_innovation_hub/models/*.py</code> and the public feed exported ${esc(h.date(feed.meta.exported))}. Simulated records are invented for the prototype and say so in their names; real ones keep their source URL.</p>
  </div>
</section>

<section id="import" class="hub-sec">
  <div class="hub-wrap">
    ${head(3, 'Spreadsheet to Odoo', 'Bring a spreadsheet; get it into Odoo', 'Some of the team\'s lists still live in spreadsheets. This is the bottom right of António Guerreiro\'s whiteboard: spreadsheets flowing into Odoo, and Odoo feeding the official site. Drop or paste a CSV, or pick a sample. The page works out which hub model it fits, maps the columns, checks every row against the feed, and shows the Odoo calls it would make. It also gives you a CSV in Odoo\'s own import format, so the team could import it today by hand.')}
    <div class="imp" data-imp>
      <div class="imp-in">
        <h3 class="imp-h"><span class="imp-n">a</span> Your spreadsheet</h3>
        <div class="imp-samples" role="group" aria-label="Sample spreadsheets (invented rows)">
          <span class="imp-lab">Samples, invented rows</span>
          ${TARGETS.map(t => `<button type="button" class="imp-sample" aria-pressed="false" data-sample="${t.id}" data-for="${t.personas}">${esc(t.sampleLabel)}</button>`).join('')}
        </div>
        <label class="imp-drop" data-drop>
          <input type="file" accept=".csv,text/csv,text/plain" data-file class="vh">
          <span class="imp-drop-t"><b>Drop a CSV file here</b> or <u>choose one</u></span>
          <span class="imp-drop-s">Read in this browser only; nothing is uploaded. Commas or semicolons, as Excel saves them in Portugal.</span>
        </label>
        <label class="field imp-paste-f"><span>Or paste it</span><textarea class="imp-paste" rows="6" spellcheck="false" data-paste placeholder="Name,Email,Town&#10;Person 90 (simulated),person90@example.invalid,Faro"></textarea></label>
        <p class="imp-status" data-imp-status role="status" aria-live="polite"></p>
      </div>
      <div class="imp-out" data-imp-out hidden>
        <div class="imp-step">
          <h3 class="imp-h"><span class="imp-n">b</span> Which hub model</h3>
          <div class="imp-detect" data-detect></div>
        </div>
        <div class="imp-step">
          <h3 class="imp-h"><span class="imp-n">c</span> Columns to fields</h3>
          <p class="imp-hint">Matched by name, in English or Portuguese. Change any you disagree with.</p>
          <div class="hub-table-wrap"><table class="hub-table imp-map" data-map></table></div>
        </div>
        <div class="imp-step">
          <h3 class="imp-h"><span class="imp-n">d</span> Checked against the feed</h3>
          <p class="imp-sum" data-sum></p>
          <div class="imp-opts">
            <label><input type="checkbox" data-opt-sim> Mark these records simulated</label>
            <label>Rows already in Odoo <select data-opt-dup><option value="write">update them (write)</option><option value="skip">leave them alone</option></select></label>
            <label>Batch size <select data-opt-batch><option>2</option><option>5</option><option selected>50</option><option>200</option></select></label>
          </div>
          <div class="persona-panel persona-panel-private od-pp" data-only="staff"><p class="persona-panel-head">Algarve Evolution team</p><p>Checked against the private feed: duplicates of unpublished records and of people without consent are caught too.</p></div>
          <div class="persona-panel od-pp" data-only="${NOT_STAFF}"><p class="persona-panel-head">Checked against the public feed</p><p>The Algarve Evolution team, with the private feed open, also catches duplicates of unpublished records (try the mentors sample as them: Mentor 12 is in Odoo but not public).</p></div>
          <div class="hub-table-wrap"><table class="hub-table imp-prev" data-prev></table></div>
        </div>
        <div class="imp-step">
          <h3 class="imp-h"><span class="imp-n">e</span> Into Odoo</h3>
          <div class="imp-target" role="radiogroup" aria-label="Which Odoo">
            <label><input type="radio" name="imp-odoo" value="experiment" checked> Our experimentation Odoo</label>
            <label><input type="radio" name="imp-odoo" value="official"> Their official Odoo</label>
          </div>
          <p class="imp-hint" data-target-note></p>
          <div class="od-calls" data-calls></div>
          <div class="imp-actions">
            <button type="button" class="btn btn-primary" data-dl-csv>Download the Odoo import CSV</button>
            <button type="button" class="btn" data-copy-calls>Copy the calls</button>
          </div>
          <p class="imp-hint" data-csv-note></p>
        </div>
      </div>
    </div>
    <noscript><p class="imp-hint">The importer runs in your browser and needs JavaScript. The samples are here: ${TARGETS.map(t => `<a href="/hub/odoo-samples/${t.sample}">${esc(t.sample)}</a>`).join(', ')}.</p></noscript>
  </div>
</section>

<section id="ideas-and-needs" class="hub-sec hub-sec-mist">
  <div class="hub-wrap">
    ${head(4, 'Ideas and needs', 'A thousand small requests, one place', 'Along the bottom of the whiteboard: ideas and needs. Anyone can bring one, and the team\'s many small requests (a data fix, a field, a report, a page, an export) go to the same place instead of a dozen e-mails. Each is triaged: done in Odoo by configuration, tried as an experiment here, or passed to the Odoo partner. In Odoo, each is a task in the Project app.')}
    <div class="req">
      <form class="hub-form req-form" data-req-form>
        <h3 class="imp-h">Bring an idea or a need</h3>
        <label class="field"><span>What is it</span><input name="title" required maxlength="140" placeholder="For example: export the mentors list for a partner"></label>
        <div class="req-row">
          <label class="field"><span>Type</span><select name="kind">${KINDS.map(k => `<option value="${k.id}">${esc(k.label)}</option>`).join('')}</select></label>
          <label class="field"><span>Due</span><input name="due" type="date"></label>
        </div>
        <label class="field"><span>Who it is for</span><input name="who" maxlength="80" placeholder="For example: programme partner" data-req-who></label>
        <label class="field"><span>Details</span><textarea name="details" rows="3" maxlength="600"></textarea></label>
        <div class="req-submit"><p class="req-triage-p">Suggested triage: <b data-req-suggest>An experiment here</b></p>
        <button class="btn btn-accent" type="submit">Add it</button>
        <p><span class="local-note">Kept in this browser only</span></p>
        <p class="field-hint">In Odoo it would be a task in a project; the call is on each card.</p></div>
      </form>
      <div>
        <div class="persona-panel persona-panel-private od-pp" data-only="staff"><p class="persona-panel-head">Algarve Evolution team</p><p>You triage: move a request between lanes, mark it done, remove your own.</p></div>
        <div class="persona-panel od-pp" data-only="${NOT_STAFF}"><p class="persona-panel-head">Who triages</p><p>The Algarve Evolution team triages. Try the page as them to move requests between lanes.</p></div>
        <div class="req-board" data-req-board>
          ${LANES.map(l => `<div class="req-lane req-lane-${l.id}" data-lane="${l.id}" role="group" aria-labelledby="lane-${l.id}"><header><h3 id="lane-${l.id}">${esc(l.label)} <span class="req-count" data-lane-count>0</span></h3><p>${esc(l.text)}</p></header><ol class="req-list" data-lane-list></ol></div>`).join('')}
        </div>
      </div>
    </div>
    <p class="src">The example requests are simulated: invented for the prototype to show the kind of small requests a team receives.</p>
  </div>
</section>

<section id="feeds" class="hub-sec">
  <div class="hub-wrap">
    ${head(5, 'Public and private', 'What the public sees, and what stays with the team', 'Not everything in Odoo is public. Odoo exports two feeds. The public one holds only what is published, only public fields, and people only when they have agreed to be listed. The private one holds everything and is encrypted; the team opens it in the browser with an access key.')}
    <div class="fx">
      <div class="fx-chart">
        <div class="hub-table-wrap od-scroll" tabindex="0" role="region" aria-label="Records per entity, public and private">
          <table class="fx-t">
            <thead><tr><th scope="col">Entity</th><th scope="col" class="od-n">Public</th><th scope="col" class="od-n">Private</th><th scope="col" class="od-n">Withheld</th><th scope="col" class="od-bar-cell"><span class="fx-key"><i class="k-pub"></i>public <i class="k-priv"></i>private only</span></th></tr></thead>
            <tbody>${feedRows}</tbody>
          </table>
        </div>
        <p class="src">Public feed: <a href="/feeds/public.json">/feeds/public.json</a>, exported ${esc(h.date(feed.meta.exported))} from Odoo ${esc(exp.version)}. Private feed: <a href="/feeds/private.enc.json">/feeds/private.enc.json</a>, AES-256-GCM.</p>
      </div>
      <div class="fx-why">
        <h3>Why a record is withheld</h3>
        <ul class="fx-rules">
          <li><b>Not published.</b> A record reaches the public feed only when someone ticks Published in Odoo. Imports arrive unpublished.</li>
          <li><b>No consent.</b> Mentors, individual suppliers, professionals, consultants, investors, team members and jurors appear only when they agreed to be listed.${feed.meta.withheld ? ` In this export that leaves out ${num(feed.meta.withheld.talent)} talent profiles, ${num(feed.meta.withheld.mentors)} mentor${feed.meta.withheld.mentors === 1 ? '' : 's'} and ${num(feed.meta.withheld.suppliers)} individual supplier${feed.meta.withheld.suppliers === 1 ? '' : 's'} (<code>meta.withheld</code>: counts only).` : ''}</li>
          <li><b>Its parent is not public.</b> Sessions and KPIs of an unpublished company stay private; a link to someone not public becomes empty.</li>
          <li><b>Private fields.</b> Session notes, supplier contacts, Vibathon participants and jury scores are never in the public feed.</li>
        </ul>
        <div class="persona-panel persona-panel-private fx-private" data-only="staff"><p class="persona-panel-head">Private feed</p><div data-fx-private><p class="fx-wait">Opening the private feed…</p></div></div>
        <div class="persona-panel fx-lock" data-only="${NOT_STAFF}"><p class="persona-panel-head">Record by record</p><p>Choose <b>Algarve Evolution team</b> in "Try it as" and enter the access key to compare the two feeds record by record.</p></div>
      </div>
    </div>
  </div>
</section>

<section id="official" class="hub-sec hub-sec-mist">
  <div class="hub-wrap">
    ${head(6, 'To the official Odoo', 'What moves when it works', 'Experiments stay cheap because they happen here. What proves useful moves to the official Odoo, the mature system, in one of three ways: configuration, the Odoo partner, or a further experiment first.')}
    <ul class="cards mv">${moves.map(([a, b, c]) => `<li class="card mv-${laneOf[c]}"><p class="card-kicker">${esc(c)}</p><h3>${esc(a)}</h3><p>${esc(b)}</p></li>`).join('')}</ul>
    <div class="od-run">
      <h3>Run it yourself</h3>
      <p>The experimentation Odoo rebuilds from the repository with one script, and the feeds re-export from it:</p>
      <pre><code>scripts/odoo/setup-local.sh --export</code></pre>
      <p>The steps are in <code>scripts/odoo/RUN.md</code> and <code>src/feeds/README.md</code> in the site's repository. Pointing the exporter at Algarve Evolution's own Odoo is a proposal written up there: the keys stay in their CI and no customer data comes to us.</p>
    </div>
  </div>
</section>

<section id="approach" class="hub-sec">
  <div class="hub-wrap">
    ${head(7, 'How we work with Odoo', 'Build around it; do not ask anyone to move', 'The thinking behind this hub, as the PrompTugal team wrote it up on the SGit Newsroom on 16 November 2026, the day of our meeting.')}
    <ul class="cards">
      <li class="card"><p class="card-kicker">Integrate with what is there</p><h3>Use the Odoo we already have</h3><p>Our data and workflows already live in Odoo, and many of the manual ones can be improved. So nothing here asks us to move: it reads from Odoo, builds better interfaces and prototypes around it, and starts with the manual workflows. Then one of two things happens: Odoo gets better and ships what was built here, and the experiment's code is retired; or what was built here becomes the better place, and work moves to it over time.</p><p class="card-meta"><a href="https://newsroom.sgit.ai/articles/integrate-with-whatever-is-on-the-other-side.html" rel="noopener">SGit Newsroom, "Integrate with whatever is on the other side"</a></p></li>
      <li class="card"><p class="card-kicker">Use the future now</p><h3>No need to wait for Odoo 20</h3><p>Odoo 20 lets its own AI agents create and update records and adds an MCP server; Odoo 19, which we run today, already has the JSON-2 API this hub uses. Agents, approvals and better screens work on the version we have now, and when we move to 20 the hub uses its agents too and retires whatever they replace.</p><p class="card-meta"><a href="https://newsroom.sgit.ai/articles/odoo-and-our-stack.html" rel="noopener">SGit Newsroom, "Odoo's agents can now write to the system of record"</a></p></li>
      <li class="card"><p class="card-kicker">Plan, then apply <span class="tag tag-ok">Built</span></p><h3>Every write to Odoo, signed</h3><p>Every "Odoo call" panel on this hub can be added to one plan. On the <a href="/v2/plan/">Plan page</a> the team approves each change and signs the plan with a key made in their browser; a small broker then checks the signature, the reviewer and its own policy (hub models only, no deletes, no users or access rights), compares each record with its snapshot, and applies the plan through the API, keeping a record of every change. It applies only to our experimentation Odoo, never to the official one.</p><p class="card-meta"><a href="https://newsroom.sgit.ai/articles/odoo-and-our-stack.html" rel="noopener">SGit Newsroom, "Odoo's agents can now write to the system of record"</a></p></li>
      <li class="card"><p class="card-kicker">A behaviour policy for each agent</p><h3>What it can reach, against what it was asked to do</h3><p>An API key carries its user's rights. The feed exporter here reads through a dedicated Odoo user in a read-only group, so its reach is its mandate: read published hub records, write nothing. Every agent or integration that touches Odoo gets the same written policy: its grant, its mandate and the gap between them.</p><p class="card-meta"><a href="https://newsroom.sgit.ai/articles/odoo-and-our-stack.html" rel="noopener">SGit Newsroom, "Odoo's agents can now write to the system of record"</a></p></li>
    </ul>
    <p class="local-note">One thing to check with the Odoo partner: on Odoo Online, the external API (which the private feed and any write-back would use) is available only on custom plans; Odoo.sh and self-hosted Odoo include it (same source).</p>
  </div>
</section>
<script type="application/json" id="odoo-config">${JSON.stringify(config).replace(/</g, '\\u003c')}</script>`;
  return layout({
    body,
    description: 'How the AE Innovation Hub uses Odoo: the official Odoo and the experimentation Odoo, the addon\'s models, a spreadsheet to Odoo importer, ideas and needs, and the public and private feeds.',
    head: '<link rel="stylesheet" href="/hub/odoo.css">',
    scripts: '<script src="/hub/odoo.js" defer></script>',
    pageClass: 'page-odoo',
  });
}
