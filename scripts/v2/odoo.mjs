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

export const path = '/odoo/';
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
  { model: 'aih.challenge', act: 'challenge-connect', holds: 'Challenges: problem, requirements, skills wanted, budget, deadline, status, who decides.', count: 'challenges', feed: 'challenges, matches' },
  { model: 'aih.application', act: 'challenge-connect', holds: 'Suppliers\' answers to a challenge: proposal, price, days, and the match score, rank and reasons.', count: 'applications', feed: 'applications' },
  { model: 'aih.vibathon', act: 'vibathon', holds: 'Hackathons, workshops and buildathons: date, venue, mentors, registrations, next steps.', count: 'vibathons', feed: 'vibathons' },
  { model: 'aih.vibathon.jury', act: 'vibathon', holds: 'The jury of each Vibathon: name and role.', count: 'jury', feed: 'vibathons[].jury' },
  { model: 'aih.vibathon.participant', act: 'vibathon', holds: 'Who took part, with e-mail. Private: never in the public feed.', count: 'participants', feed: 'vibathons[].participants', private: true },
  { model: 'aih.project', act: 'vibathon', holds: 'The projects presented at the end: team, summary, prize, next step.', count: 'projects', feed: 'projects' },
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
  { id: 'req-s1', kind: 'data_fix', title: 'Twelve contacts have the town written as "Loule"', who: 'Algarve Evolution team', due: '2026-11-20', details: 'Fix them to Loulé so the Challenge Connect town score works.', lane: 'config', how: 'In Contacts, filter City = Loule, select all, edit the city once (list view mass edit).' },
  { id: 'req-s2', kind: 'new_field', title: 'Add "year founded" to the startup form', who: 'INC/ACC programme', due: '2026-11-28', details: 'The programme partner asks for it in the month 6 report.', lane: 'config', how: 'Studio in Odoo Enterprise adds the field to the form; or add it to the addon here first.' },
  { id: 'req-s3', kind: 'report', title: 'Mentoring hours per programme, every month', who: 'Programme partner', due: '2026-12-01', details: 'One table: programme, mentor, sessions, hours.', lane: 'config', how: 'A pivot view on mentoring sessions grouped by programme and mentor, saved as a favourite.' },
  { id: 'req-s4', kind: 'export', title: 'Export the list of mentors who agreed to be listed', who: 'A co-financed project partner', due: '2026-11-24', details: 'Name, expertise and town only.', lane: 'config', how: 'Contacts, filter Mentor and Consent, Export with the three columns.' },
  { id: 'req-s5', kind: 'page_change', title: 'Show the next Vibathon on the events page', who: 'Communication', due: '2026-11-21', details: 'Its date moved to 20 February 2027.', lane: 'config', how: 'Edit the event in Events; the website shows it.' },
  { id: 'req-s6', kind: 'need', title: 'Startups should update their own KPIs each month', who: 'Founders in the programme', due: '2027-01-15', details: 'Today they send a spreadsheet by e-mail and someone copies it into Odoo.', lane: 'experiment', how: 'A KPI form on this hub writing aih.kpi records; then the Odoo portal.' },
  { id: 'req-s7', kind: 'idea', title: 'A reminder to mentors the day before each session', who: 'Mentors', due: '2027-01-31', details: 'Many sessions are rescheduled at the last minute.', lane: 'experiment', how: 'An automation rule on aih.session in the experimentation Odoo, then the same rule in the official one.' },
  { id: 'req-s8', kind: 'integration', title: 'Install the hub\'s models in the official Odoo, then upgrade to Odoo 20', who: 'Algarve Evolution team', due: '2027-03-31', details: 'Once the experiments settle.', lane: 'partner', how: 'The partner installs the addon (or rebuilds the models with Studio) and plans the upgrade.' },
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
  const arrow = (d, cls = '') => `<path class="ar ${cls}" d="${d}" marker-end="url(#ah)"/>`;
  const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker></defs>`;
  const actShort = { 'inc-acc': ['INC/ACC', 'incubation, acceleration,', 'mentors, KPIs'], 'challenge-connect': ['Challenge Connect', 'challenges, suppliers,', 'matching'], vibathon: ['Vibathon', 'hackathons, workshops,', 'juries'], talent: ['Talent Ecosystem', 'talent, competences,', 'partners, ADI network'] };
  const actBoxes = (x0, y0, w, gap, cols) => acts.map((a, i) => {
    const [n, k1, k2] = actShort[a.id] || [a.name, '', ''];
    const x = x0 + (i % cols) * (w + gap), y = y0 + Math.floor(i / cols) * 112;
    return `<g class="d-act"><rect x="${x}" y="${y}" width="${w}" height="100" rx="6"/>${T(x + 12, y + 24, n, 'd-h')}${T(x + 12, y + 44, k1, 'd-s')}${T(x + 12, y + 61, k2, 'd-s')}${T(x + 12, y + 86, `${num(actCount[a.id])} records`, 'd-n')}</g>`;
  }).join('');
  const wide = `<svg class="arch arch-wide" viewBox="0 0 1200 720" role="img" aria-labelledby="arch-t arch-d"><title id="arch-t">How the AE Innovation Hub uses Odoo</title><desc id="arch-d">Spreadsheets and public sources go into Odoo through the importer. Odoo infrastructure is the base layer under the four activities: our experimentation Odoo 19 Community with the hub addon, and Algarve Evolution's official Odoo 19 Enterprise at algarveevolution.pt. What works moves from the experiment to the official Odoo. The experimentation Odoo exports a public feed and an encrypted private feed, read by this hub and by future apps. The official Odoo feeds the official site. Ideas and needs flow in along the bottom and are triaged.</desc>${defs}
  ${T(20, 28, 'IN', 'd-k')}${T(270, 28, 'THE FOUR ACTIVITIES, ON ODOO', 'd-k')}${T(910, 28, 'OUT', 'd-k')}
  ${box(20, 120, 210, 112, 'd-in', [['Spreadsheets', 'd-h'], ['lists kept outside Odoo', 'd-s'], ['today: mentors, startups,', 'd-s'], ['suppliers, participants', 'd-s']])}
  ${box(20, 290, 210, 92, 'd-in', [['Public sources', 'd-h'], ['communities, partners,', 'd-s'], ['events, each with its source', 'd-s']])}
  ${arrow('M230 176 C 252 176 252 330 282 330', '')}${T(238, 250, 'importer', 'd-l')}
  ${arrow('M230 336 L 282 336', '')}
  ${actBoxes(270, 44, 140, 13, 4)}
  <g class="d-infra"><rect x="262" y="160" width="610" height="390" rx="10"/>${T(282, 534, 'ODOO INFRASTRUCTURE', 'd-k2')}</g>
  ${box(282, 274, 260, 236, 'd-exp', [['Experimentation Odoo', 'd-h'], ['Odoo 19 Community, run by us', 'd-s'], [`addon algarve_innovation_hub ${addon.version}`, 'd-m'], [`${newModels} new models, ${extModels} extended`, 'd-s'], ['', ''], ['the place to try things:', 'd-s'], ['cheap to change, simulated', 'd-s'], ['data where real is missing', 'd-s'], ['can run Odoo 20 first', 'd-s']])}
  ${box(600, 274, 256, 236, 'd-off', [['Official Odoo', 'd-h'], ['algarveevolution.pt', 'd-m'], ['Odoo 19 Enterprise', 'd-s'], ['upgrade to Odoo 20 planned', 'd-s'], ['', ''], ['the mature system: website,', 'd-s'], ['events, news, contacts', 'd-s'], [`read today: ${official.events.length} events,`, 'd-s'], [`${official.posts.length} news posts`, 'd-s']])}
  ${arrow('M546 380 L 594 380', 'ar-promote')}${T(546, 366, 'promote', 'd-l')}${T(546, 404, 'what works', 'd-l')}
  ${box(910, 44, 270, 66, 'd-app', [['AE Innovation Hub (this site)', 'd-h'], ['every number read from the feeds', 'd-s']])}
  ${box(910, 128, 270, 66, 'd-app d-future', [['Future apps: iOS', 'd-h'], ['the same feeds, no new backend', 'd-s']])}
  ${box(910, 236, 270, 66, 'd-feed', [['Public feed  public.json', 'd-h'], [`published records: ${num(pubTotal)}`, 'd-s']])}
  ${box(910, 316, 270, 66, 'd-feed d-priv', [['Private feed  private.enc.json', 'd-h'], ['every record, encrypted, access key', 'd-s']])}
  ${arrow('M542 300 C 720 300 740 269 904 269', '')}${arrow('M542 316 C 720 316 740 349 904 349', '')}${T(700, 255, 'export (read-only API key)', 'd-l')}
  ${arrow('M1180 252 C 1196 200 1196 120 1184 88', '')}${arrow('M1172 316 C 1192 260 1192 190 1184 166', 'ar-dash')}
  ${box(910, 436, 270, 80, 'd-off2', [['Official website', 'd-h'], ['algarveevolution.pt, built on', 'd-s'], ['the official Odoo', 'd-s']])}
  ${arrow('M856 476 L 904 476', '')}
  ${arrow('M1045 516 C 1045 590 420 600 412 516', 'ar-dash')}${T(560, 584, 'its public events are read and seeded into the experiment', 'd-l')}
  <g class="d-ideas"><rect x="20" y="628" width="1160" height="72" rx="8"/>${T(40, 658, 'IDEAS AND NEEDS', 'd-k2')}${T(40, 682, 'from the team, founders, mentors, partners: triaged into configuration, an experiment here, or the Odoo partner', 'd-s')}</g>
  ${arrow('M412 628 L 412 556', '')}${arrow('M728 628 L 728 556', '')}
</svg>`;
  const tallActs = acts.map((a, i) => {
    const [n, k1, k2] = actShort[a.id] || [a.name, '', ''];
    const x = 12 + (i % 2) * 172, y = 142 + Math.floor(i / 2) * 96;
    return `<g class="d-act"><rect x="${x}" y="${y}" width="164" height="86" rx="6"/>${T(x + 10, y + 22, n, 'd-h')}${T(x + 10, y + 40, k1, 'd-s')}${T(x + 10, y + 56, k2, 'd-s')}${T(x + 10, y + 76, `${num(actCount[a.id])} records`, 'd-n')}</g>`;
  }).join('');
  const tall = `<svg class="arch arch-tall" viewBox="0 0 360 1010" role="img" aria-labelledby="arch-t2 arch-d"><title id="arch-t2">How the AE Innovation Hub uses Odoo</title>${defs}
  ${box(12, 10, 164, 76, 'd-in', [['Spreadsheets', 'd-h'], ['lists outside Odoo', 'd-s'], ['into the importer', 'd-s']])}
  ${box(184, 10, 164, 76, 'd-in', [['Public sources', 'd-h'], ['communities, events', 'd-s'], ['with their source', 'd-s']])}
  ${arrow('M94 86 L 94 132')}${arrow('M266 86 L 266 132')}
  <g class="d-infra"><rect x="4" y="124" width="352" height="560" rx="10"/>${T(16, 670, 'ODOO INFRASTRUCTURE', 'd-k2')}</g>
  ${tallActs}
  ${box(12, 344, 336, 128, 'd-exp', [['Experimentation Odoo', 'd-h'], ['Odoo 19 Community, run by us', 'd-s'], [`addon algarve_innovation_hub`, 'd-m'], [`${newModels} new models, ${extModels} extended`, 'd-s'], ['cheap to change; can run Odoo 20 first', 'd-s']])}
  ${arrow('M180 474 L 180 508', 'ar-promote')}${T(192, 496, 'promote what works', 'd-l')}
  ${box(12, 512, 336, 130, 'd-off', [['Official Odoo', 'd-h'], ['algarveevolution.pt', 'd-m'], ['Odoo 19 Enterprise, Odoo 20 planned', 'd-s'], ['website, events, news, contacts', 'd-s'], [`read today: ${official.events.length} events, ${official.posts.length} posts`, 'd-s']])}
  ${arrow('M94 686 L 94 712')}${arrow('M266 686 L 266 712')}
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
    return `<tr data-model="${esc(m.model)}"><th scope="row"><code>${esc(m.model)}</code>${m.ext ? '<span class="od-ext">Odoo\'s own, extended</span>' : ''}</th><td class="od-act">${esc(ACT[m.act])}</td><td>${esc(m.holds)}<span class="od-meta">${am.fields.length} ${m.ext ? 'fields added' : 'fields'} · feed: <code>${esc(m.feed)}</code></span></td><td class="od-n" data-count="pub">${m.private ? '<span class="od-none" title="Private: never in the public feed">private</span>' : num(counts[m.model])}</td><td class="od-n" data-count="priv" data-key="${esc(m.count)}"><span class="od-locked">locked</span></td></tr>`;
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

  const body = `
<section class="od-hero">
  <div class="grid">
    <div class="od-hero-copy">
      <p class="kicker kicker-light">Odoo infrastructure</p>
      <h1>Odoo: the source of truth</h1>
      <p class="lede">Every number, list and card on this hub is read from Odoo. Algarve Evolution already runs its official site on Odoo. Next to it we keep an Odoo for experiments, where the hub's four activities live today. Here is how the two fit, and how more of what the team keeps in spreadsheets and e-mails can get into Odoo.</p>
      <p class="od-hero-links"><a href="#import">Try the spreadsheet importer</a> <a href="#ideas">Bring an idea or a need</a></p>
    </div>
    <dl class="od-two">
      <div class="od-two-off"><dt>Official Odoo</dt><dd><a href="${esc(offUrl)}" rel="noopener">algarveevolution.pt</a>, Odoo ${esc(official.odoo)} Enterprise; Odoo 20 planned</dd><dd class="od-two-n"><b>${num(official.events.length)}</b> events and <b>${num(official.posts.length)}</b> news posts read from its public pages on ${esc(offRead)} (<a href="/v1/odoo/">the V1 page</a>, <a href="/data/odoo.json">data</a>)</dd></div>
      <div class="od-two-exp"><dt>Experimentation Odoo</dt><dd>Odoo ${esc(exp.version)} Community with the addon <code>algarve_innovation_hub</code> ${esc(addon.version)}, run by the PrompTugal team</dd><dd class="od-two-n"><b>${num(pubTotal)}</b> records in the public feed, exported ${esc(h.date(feed.meta.exported))}</dd></div>
    </dl>
  </div>
</section>

<nav class="od-toc" aria-label="On this page"><div class="grid"><ol>
  <li><a href="#arch">How it fits</a></li><li><a href="#models">The models</a></li><li><a href="#import">Spreadsheet to Odoo</a></li><li><a href="#ideas">Ideas and needs</a></li><li><a href="#feeds">Public and private</a></li><li><a href="#official">To the official Odoo</a></li>
</ol></div></nav>

<section id="arch" class="od-arch">
  <div class="grid">
    <div class="sec-head">
      <p class="kicker">1 · How it fits</p>
      <h2>Two Odoos, one source of truth</h2>
      <p class="sec-intro">The official Odoo is the mature system: the website, events and news that people use today. The experimentation Odoo is where we try things quickly, with the hub's own models and simulated data where real data is missing. When something works, it moves to the official Odoo. As on António Guerreiro's whiteboard, Odoo is the layer under all four activities, spreadsheets flow in, and ideas and needs come in along the bottom.</p>
    </div>
    <figure class="od-fig">
      ${wide}${tall}
      <figcaption>${h.odoo('aih.activity', acts.length)} ${h.odoo('aih.hub', 1)} Counts are from the public feed. <span class="od-fig-dash"><svg width="28" height="8" aria-hidden="true"><path d="M0 4h28" class="ar ar-dash"/></svg> dashed: not built yet, or read from public pages</span></figcaption>
    </figure>
    <ol class="od-steps">
      <li><b>In.</b> Spreadsheets go through the <a href="#import">importer</a>; public organisations, communities and events come in with their source URL. Ideas and needs are <a href="#ideas">triaged</a>.</li>
      <li><b>Experiment.</b> Our Odoo 19 Community holds the addon's ${newModels} models (and extends Contacts and Events). Records carry <code>published</code>, <code>consent</code> and <code>simulated</code> flags.</li>
      <li><b>Feeds.</b> A read-only Odoo user exports two files: the <a href="/feeds/public.json">public feed</a> (published records, public fields, people only with consent) and the private feed, encrypted, for the team.</li>
      <li><b>Out.</b> This hub, and later an iOS app, read only the feeds. Nothing else is a source.</li>
      <li><b>Promote.</b> What works <a href="#official">moves to the official Odoo</a>, which keeps feeding the official site.</li>
    </ol>
  </div>
</section>

<section id="models" class="od-models">
  <div class="grid">
    <div class="sec-head">
      <p class="kicker">2 · The models</p>
      <h2>What the addon keeps in Odoo</h2>
      <p class="sec-intro">The addon <code>algarve_innovation_hub</code> (${esc(addon.version)}, ${esc(addon.licence)}) adds ${newModels} models and extends two of Odoo's own. This table is read from its source code when the site is built, and the counts from the feed. <span data-only="staff">The private column fills in from the private feed you opened.</span><span data-only="visitor founder mentor challenger supplier participant">Try it as the Algarve Evolution team to fill in the private column.</span></p>
    </div>
    <div class="od-scroll" tabindex="0" role="region" aria-label="The addon's models">
      <table class="od-table od-models-t">
        <thead><tr><th scope="col">Odoo model</th><th scope="col">Activity</th><th scope="col">What it holds</th><th scope="col" class="od-n">Public</th><th scope="col" class="od-n">Private</th></tr></thead>
        <tbody>${modelRows}</tbody>
      </table>
    </div>
    <p class="src">Source: <code>odoo/addons/algarve_innovation_hub/models/*.py</code>, the public feed exported ${esc(h.date(feed.meta.exported))}. Simulated records are invented for the prototype and say so in their names; real ones keep their source URL.</p>
  </div>
</section>

<section id="import" class="od-import">
  <div class="grid">
    <div class="sec-head">
      <p class="kicker">3 · Spreadsheet to Odoo</p>
      <h2>Bring a spreadsheet; get it into Odoo</h2>
      <p class="sec-intro">Some of the team's lists still live in spreadsheets. This is the bottom right of the whiteboard: spreadsheets flowing into Odoo, and Odoo feeding the official site. Drop or paste a CSV, or pick a sample. The page works out which hub model it fits, maps the columns, checks every row against the feed, and shows the Odoo calls it would make. It also gives you a CSV in Odoo's own import format, so the team could import it today by hand.</p>
    </div>
    <div class="imp" data-imp>
      <div class="imp-in">
        <h3 class="imp-h"><span class="imp-n">a</span> Your spreadsheet</h3>
        <div class="imp-samples" role="group" aria-label="Sample spreadsheets (invented rows)">
          <span class="imp-lab">Samples, invented rows:</span>
          ${TARGETS.map(t => `<button type="button" class="imp-sample" data-sample="${t.id}" data-for="${t.personas}">${esc(t.sampleLabel)}</button>`).join('')}
        </div>
        <label class="imp-drop" data-drop>
          <input type="file" accept=".csv,text/csv,text/plain" data-file class="vh">
          <span class="imp-drop-t"><b>Drop a CSV file here</b> or <u>choose one</u></span>
          <span class="imp-drop-s">Read in this browser only; nothing is uploaded. Commas or semicolons, as Excel saves them in Portugal.</span>
        </label>
        <label class="imp-paste-l" for="imp-paste">Or paste it</label>
        <textarea id="imp-paste" class="imp-paste" rows="6" spellcheck="false" data-paste placeholder="Name,Email,Town&#10;Person 90 (simulated),person90@example.invalid,Faro"></textarea>
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
          <div class="od-scroll" tabindex="0" role="region" aria-label="Column mapping"><table class="od-table imp-map" data-map></table></div>
        </div>
        <div class="imp-step">
          <h3 class="imp-h"><span class="imp-n">d</span> Checked against the feed</h3>
          <p class="imp-sum" data-sum></p>
          <div class="imp-opts">
            <label><input type="checkbox" data-opt-sim> Mark these records simulated</label>
            <label>Rows already in Odoo <select data-opt-dup><option value="write">update them (write)</option><option value="skip">leave them alone</option></select></label>
            <label>Batch size <select data-opt-batch><option>2</option><option>5</option><option selected>50</option><option>200</option></select></label>
          </div>
          <div class="od-scroll" tabindex="0" role="region" aria-label="Preview of the records"><table class="od-table imp-prev" data-prev></table></div>
          <p class="imp-note" data-only="staff">You opened the private feed, so rows are also checked against unpublished records and people without consent.</p>
          <p class="imp-note" data-only="visitor founder mentor challenger supplier participant">Checked against the public feed. The Algarve Evolution team, with the private feed open, also catches duplicates of unpublished records.</p>
        </div>
        <div class="imp-step">
          <h3 class="imp-h"><span class="imp-n">e</span> Into Odoo</h3>
          <div class="imp-target" role="group" aria-label="Which Odoo">
            <label><input type="radio" name="imp-odoo" value="experiment" checked> Our experimentation Odoo</label>
            <label><input type="radio" name="imp-odoo" value="official"> Their official Odoo</label>
          </div>
          <p class="imp-hint" data-target-note></p>
          <div class="odoo-call" data-calls></div>
          <div class="imp-actions">
            <button type="button" class="od-btn od-btn-primary" data-dl-csv>Download the Odoo import CSV</button>
            <button type="button" class="od-btn" data-copy-calls>Copy the calls</button>
          </div>
          <p class="imp-hint" data-csv-note></p>
        </div>
      </div>
    </div>
    <noscript><p class="imp-hint">The importer runs in your browser and needs JavaScript. The samples are here: ${TARGETS.map(t => `<a href="/hub/odoo-samples/${t.sample}">${esc(t.sample)}</a>`).join(', ')}.</p></noscript>
  </div>
</section>

<section id="ideas" class="od-ideas">
  <div class="grid">
    <div class="sec-head">
      <p class="kicker">4 · Ideas and needs</p>
      <h2>A thousand small requests, one place</h2>
      <p class="sec-intro">Along the bottom of the whiteboard: ideas and needs. Anyone can bring one, and the team's many small requests (a data fix, a field, a report, a page, an export) go in the same place instead of a dozen e-mails. Each is triaged: done in Odoo by configuration, tried as an experiment here, or passed to the Odoo partner. Each would be a task in Odoo's Project app.</p>
    </div>
    <div class="req">
      <form class="req-form" data-req-form>
        <h3 class="imp-h">Bring an idea or a need</h3>
        <label>What is it <input name="title" required maxlength="140" placeholder="For example: export the mentors list for a partner"></label>
        <div class="req-row">
          <label>Type <select name="kind">${KINDS.map(k => `<option value="${k.id}">${esc(k.label)}</option>`).join('')}</select></label>
          <label>Due <input name="due" type="date"></label>
        </div>
        <label>Who it is for <input name="who" maxlength="80" placeholder="For example: programme partner" data-req-who></label>
        <label>Details <textarea name="details" rows="3" maxlength="600"></textarea></label>
        <p class="req-triage-p">Suggested triage: <b data-req-suggest>An experiment here</b></p>
        <button class="od-btn od-btn-primary" type="submit">Add it</button>
        <p class="req-kept">Kept in this browser only. In Odoo it would be a task; the call is on each card.</p>
      </form>
      <div class="req-board" data-req-board>
        ${LANES.map(l => `<section class="req-lane req-lane-${l.id}" data-lane="${l.id}" aria-labelledby="lane-${l.id}"><header><h3 id="lane-${l.id}">${esc(l.label)} <span class="req-count" data-lane-count>0</span></h3><p>${esc(l.text)}</p></header><ol class="req-list" data-lane-list></ol></section>`).join('')}
      </div>
    </div>
    <p class="imp-note" data-only="staff">As the Algarve Evolution team you can move a request between lanes and mark it done.</p>
    <p class="imp-note" data-only="visitor founder mentor challenger supplier participant">The Algarve Evolution team triages; try it as them to move requests between lanes.</p>
    <p class="src">The example requests are simulated: invented for the prototype to show the kind of small requests a team receives.</p>
  </div>
</section>

<section id="feeds" class="od-feeds">
  <div class="grid">
    <div class="sec-head">
      <p class="kicker">5 · Public and private</p>
      <h2>What the public sees, and what stays with the team</h2>
      <p class="sec-intro">"Not everything in Odoo is public." Odoo exports two feeds. The public one holds only what is published, only public fields, and people only when they have agreed to be listed. The private one holds everything and is encrypted; the team opens it in the browser with an access key.</p>
    </div>
    <div class="fx">
      <div class="fx-chart">
        <div class="od-scroll" tabindex="0" role="region" aria-label="Records per entity, public and private">
          <table class="od-table fx-t">
            <thead><tr><th scope="col">Entity</th><th scope="col" class="od-n">Public</th><th scope="col" class="od-n">Private</th><th scope="col" class="od-n">Withheld</th><th scope="col"><span class="fx-key"><i class="k-pub"></i>public <i class="k-priv"></i>private only</span></th></tr></thead>
            <tbody>${feedRows}</tbody>
          </table>
        </div>
        <p class="src">Public feed: <a href="/feeds/public.json">/feeds/public.json</a>, exported ${esc(h.date(feed.meta.exported))} from ${esc(exp.version)}. Private feed: <a href="/feeds/private.enc.json">/feeds/private.enc.json</a>, AES-256-GCM.</p>
      </div>
      <div class="fx-why">
        <h3>Why a record is withheld</h3>
        <ul class="fx-rules">
          <li><b>Not published.</b> A record reaches the public feed only when someone ticks Published in Odoo. Imports arrive unpublished.</li>
          <li><b>No consent.</b> Mentors, individual suppliers, professionals, consultants, investors, team members and jurors appear only when they agreed to be listed.</li>
          <li><b>Its parent is not public.</b> Sessions and KPIs of an unpublished company stay private; a link to someone not public becomes empty.</li>
          <li><b>Private fields.</b> Session notes, supplier contacts, Vibathon participants and jury scores are never in the public feed.</li>
        </ul>
        <div class="fx-private" data-only="staff" data-fx-private><p class="fx-wait">Opening the private feed…</p></div>
        <p class="fx-lock" data-only="visitor founder mentor challenger supplier participant">Choose <b>Algarve Evolution team</b> in "Try it as" and enter the access key to compare the two feeds record by record.</p>
      </div>
    </div>
  </div>
</section>

<section id="official" class="od-official">
  <div class="grid">
    <div class="sec-head">
      <p class="kicker">6 · To the official Odoo</p>
      <h2>What moves when it works</h2>
      <p class="sec-intro">Experiments stay cheap because they happen here. What proves useful moves to the official Odoo, the mature system, in one of three ways.</p>
    </div>
    <ul class="mv">${moves.map(([a, b, c]) => `<li class="mv-${laneOf[c]}"><h3>${esc(a)}</h3><p>${esc(b)}</p><span class="mv-tag">${esc(c)}</span></li>`).join('')}</ul>
    <div class="od-run">
      <h3>Run it yourself</h3>
      <p>The experimentation Odoo rebuilds from the repository with one script, and the feeds re-export from it:</p>
      <pre><code>scripts/odoo/setup-local.sh --export</code></pre>
      <p>The steps are in <code>scripts/odoo/RUN.md</code> and <code>src/feeds/README.md</code> in the site's repository. Pointing the exporter at Algarve Evolution's own Odoo is a proposal written up there: the keys stay in their CI and no customer data comes to us.</p>
    </div>
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
