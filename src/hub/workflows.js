// Workflows: ten agentic cells for the "death by a thousand cuts" at Algarve Evolution.
// Each cell takes one painful workflow (an email, a form, a spreadsheet, a date in the calendar) and runs it end to
// end: read the input, look things up in Odoo, match, draft, check the agent behaviour policy, and propose the Odoo
// calls for a person to approve. In production a model drafts and the policy checks; here transparent rules stand
// in for the model, in the browser, with no model call and no network request. Nothing is ever sent or written.
// This file is an ES module used twice: scripts/v2/workflows.mjs imports CELLS at build time to render the page,
// and the browser loads it as <script type="module"> to run each cell's TRY IT panel.
// Proposed Odoo calls go to the hub's plan queue (window.HUB.plan.add, docs/v2/PLAN.md) when it is there.
// Owner: cells@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.

export const NOT_CONNECTED = 'not connected in this prototype';

// The AgentiCCells ladder (agenticcells.com/cells/): one agent on one workflow is the smallest cell.
export const LADDER = [
  { id: 'one', name: 'One agent', text: 'One agent on one workflow, with sub-agents in one runtime. The smallest cell.' },
  { id: 'few', name: 'A few sessions', text: 'One session per role (intake, matching, notices), sharing a lane and a vault.' },
  { id: 'team', name: 'A team', text: 'A conductor and its agents, a key per agent and a board of files: all ten cells together.' },
  { id: 'network', name: 'A network', text: 'Conductors of conductors across partners and municipalities, with shared policies and observability.' },
];

// Connectors a cell would plug into. None is connected here.
export const CONNECTORS = {
  gmail: 'Gmail (Google Workspace API)',
  outlook: 'Outlook (Microsoft Graph)',
  form: 'The hub site form (a POST to a vault lane)',
  gforms: 'Google Forms',
  sheets: 'Google Sheets',
  excel: 'Excel (OneDrive, Microsoft Graph)',
  calendar: 'Google Calendar or Outlook calendar',
  whatsapp: 'WhatsApp Business (Cloud API)',
  odoo: 'Odoo (JSON-2 API, automated and scheduled actions)',
};

// The ten cells. `for` lists the personas a cell touches (hub.js highlights them); staff sees all ten.
export const CELLS = [
  {
    n: 1, id: 'supplier-intro', activity: 'Challenge Connect', for: ['supplier'],
    title: 'A supplier asks: who should I talk to?',
    ask: '"I provide these services to startups. Who should I talk to? Who would be a good fit?"',
    trigger: { what: 'An email to the hub mailbox, or the supplier form', connectors: ['gmail', 'outlook', 'form'] },
    steps: ['Read the email', 'Pull out services, stages, sectors, town', 'Match programme companies and open challenges', 'Draft a reply with a double opt-in intro', 'Propose a supplier contact and a CRM lead', 'Queue for a person'],
    reads: [['Public feed', 'programme companies, open challenges, suppliers'], ['Private feed (staff)', 'supplier contacts, so a known supplier is not created twice'], ['The email', 'pasted below']],
    policy: {
      grant: ['res.partner: create, write (suppliers it creates, unpublished)', 'crm.lead: create', 'mail.activity: schedule a to-do for a person', 'mail.message: post an internal note', 'Hub mailbox: read, create drafts'],
      mandate: 'Answer suppliers who ask who to talk to: suggest open challenges and fitting companies, record the supplier as a lead, and draft a reply.',
      gap: ['res.partner write reaches every contact, not only the ones it creates. Proposal: an Odoo record rule that limits the cell\'s user to partners it created.', 'The mailbox grant can send; the mandate is drafts only.'],
      barriers: [['approval', 'Any reply or intro email'], ['refused', 'Naming a company to the supplier before the company agrees (double opt-in)'], ['refused', 'Publishing the supplier before they give consent'], ['boundary', 'Odoo access rights: the cell\'s user cannot publish or delete']],
    },
    time: { per: 'per email', today: 45, cell: 5, todayText: 'about 45 minutes: read, look up companies and challenges, write, log the lead', cellText: 'about 5 minutes to read the draft and approve' },
    ladder: 0, ladderNote: 'One agent on one workflow.',
    models: ['res.partner', 'crm.lead', 'mail.activity'],
    samples: [{ file: '1-supplier-security.txt', label: 'Security and GDPR consultancy' }, { file: '1-supplier-marketing.txt', label: 'Freelance designer' }],
  },
  {
    n: 2, id: 'expert-finder', activity: 'INC/ACC and Talent', for: ['founder', 'professional'],
    title: 'A startup asks for a mentor or an expert',
    ask: '"Before our pilot we need someone who knows data protection. Can you suggest a mentor or an expert?"',
    trigger: { what: 'An email from a founder, or a WhatsApp message to the programme team', connectors: ['gmail', 'outlook', 'whatsapp'] },
    steps: ['Read the request', 'Find the company and the skills it needs', 'Search mentors, professionals, consultants and investors', 'Keep only people who gave consent', 'Rank a top 3 with reasons', 'Draft the ask to the expert first'],
    reads: [['Public feed', 'mentors, talent (professionals, consultants, investors), individual suppliers, companies'], ['Private feed (staff)', 'people without consent, shown greyed and never suggested'], ['The email', 'pasted below']],
    policy: {
      grant: ['res.partner: read (mentors, talent)', 'mail.activity: schedule a to-do on a contact', 'aih.session: create (after both sides agree)', 'Programme mailbox: read, create drafts'],
      mandate: 'Find up to three people who can help a startup, with reasons, and draft the introductions for a person to send.',
      gap: ['res.partner read includes contacts without consent. Barrier today: the cell filters them out; proposal: a record rule on aih_consent for the cell\'s user.'],
      barriers: [['refused', 'Suggesting anyone who has not given consent'], ['approval', 'Asking the expert, and every intro email'], ['refused', 'Sharing the founder\'s contact before the expert agrees']],
    },
    time: { per: 'per request', today: 60, cell: 5, todayText: 'about an hour: remember who knows what, check, write two emails', cellText: 'about 5 minutes to check the top 3 and approve' },
    ladder: 0, ladderNote: 'One agent on one workflow.',
    models: ['res.partner', 'mail.activity', 'aih.session'],
    samples: [{ file: '2-founder-mentor.txt', label: 'Health tech: data protection and fundraising' }, { file: '2-founder-investor.txt', label: 'Blue economy: IoT sensors' }],
  },
  {
    n: 3, id: 'membership', activity: 'Members', for: [],
    title: 'A membership application',
    ask: '"We would like to become a member. What are the next steps and how do we pay?"',
    trigger: { what: 'An email, or the "Join us" form on the site', connectors: ['gmail', 'outlook', 'form'] },
    steps: ['Read the application', 'Check Odoo for the organisation', 'Pick the category from what we know', 'Draft an invoice (never posted)', 'Draft the welcome email', 'Queue both for approval'],
    reads: [['src/data', 'membership categories: Start at €150 a year (algarveevolution.pt/join-us, read 6 November 2026)'], ['Public feed', 'companies and talent, to avoid a duplicate'], ['The email or form', 'pasted below']],
    policy: {
      grant: ['res.partner: create (organisation and contact, unpublished)', 'account.move: create (draft invoices only)', 'mail.activity: schedule a to-do', 'Hub mailbox: read, create drafts'],
      mandate: 'Turn a membership application into a contact, a draft invoice and a draft welcome email for a person to approve.',
      gap: ['A user who can create invoices can usually post them. Proposal: give the cell\'s user the "Invoicing / Billing" draft rights only, with posting kept to staff.'],
      barriers: [['approval', 'Every invoice: the cell drafts, a person posts'], ['refused', 'Posting an invoice or registering a payment'], ['approval', 'The welcome email'], ['refused', 'Listing the member in the directory without consent']],
    },
    time: { per: 'per application', today: 30, cell: 5, todayText: 'about 30 minutes: create the contact, find the price, invoice, welcome email', cellText: 'about 5 minutes to approve the invoice and the email' },
    ladder: 0, ladderNote: 'One agent on one workflow; it joins finance\'s approval flow.',
    models: ['res.partner', 'account.move'],
    samples: [{ file: '3-membership-email.txt', label: 'A startup, by email' }, { file: '3-membership-form.txt', label: 'An association, by web form' }],
  },
  {
    n: 4, id: 'kpi-collection', activity: 'INC/ACC', for: ['founder'],
    title: 'Monthly KPI collection',
    ask: 'Every month: ask nine companies for six numbers, chase the late ones, retype the replies, spot the odd ones.',
    trigger: { what: 'A date in the calendar (the 1st of each month), then replies by email or in a shared spreadsheet', connectors: ['calendar', 'sheets', 'excel', 'gmail'] },
    steps: ['Read the sheet or the reply', 'Match each row to a programme company', 'Compare with last month', 'Flag anomalies for a person', 'Propose the clean rows as KPI records', 'Draft reminders for the missing'],
    reads: [['Public feed', 'programmes, companies and every KPI snapshot (month 0 to 6)'], ['The sheet or email', 'pasted below']],
    policy: {
      grant: ['aih.kpi: create (unpublished)', 'aih.programme.company: read', 'KPI mailbox and sheet: read; drafts'],
      mandate: 'Collect each programme company\'s monthly KPIs, record the clean ones unpublished, and flag the rest.',
      gap: ['aih.kpi create could also set is_published. Barrier: the call always sends is_published false; proposal: a field-level restriction on the cell\'s user.'],
      barriers: [['approval', 'Publishing any KPI'], ['approval', 'Anomalies: a person checks before they are written'], ['approval', 'Reminder emails (one approval for the batch)'], ['refused', 'Rows for companies outside the programme']],
    },
    time: { per: 'per month', today: 360, cell: 30, todayText: 'about 6 hours a month across chasing, retyping and checking', cellText: 'about 30 minutes a month to check the flags' },
    ladder: 0, ladderNote: 'One agent on one workflow, woken by a schedule.',
    models: ['aih.kpi'],
    samples: [{ file: '4-kpi-month5.csv', label: 'Month 5 sheet (Google Sheets export)' }, { file: '4-kpi-reply-email.txt', label: 'One founder replies by email' }],
  },
  {
    n: 5, id: 'session-notes', activity: 'INC/ACC', for: ['mentor'],
    title: 'A mentor\'s session notes by email',
    ask: '"Had our one-to-one today. Notes below. Next session 10 December."',
    trigger: { what: 'An email from a mentor to the sessions mailbox', connectors: ['gmail', 'outlook'] },
    steps: ['Read the email', 'Find the mentor and the company', 'Pull out date, kind, topic, notes, actions', 'Check the mentor follows this company', 'Keep notes private, mask contact details', 'Propose the session and the next one'],
    reads: [['Public feed', 'mentors, companies, programmes, sessions (for the topic list)'], ['Private feed (staff)', 'the last session\'s private notes'], ['The email', 'pasted below']],
    policy: {
      grant: ['aih.session: create', 'calendar.event: create (no invitations)', 'Sessions mailbox: read, create drafts'],
      mandate: 'Log a mentor\'s session from their email, with private notes, and propose the next session.',
      gap: ['aih.session create accepts any mentor and company. Barrier: the cell checks the mentor follows the company; proposal: a constraint in the addon.'],
      barriers: [['boundary', 'Notes go only into the private field, never in the public feed'], ['approval', 'A session for a company the mentor does not follow'], ['approval', 'Calendar invitations'], ['refused', 'Phone numbers or emails in notes: masked before saving']],
    },
    time: { per: 'per session', today: 15, cell: 2, todayText: 'about 15 minutes a session: the mentor writes, staff retypes into Odoo', cellText: 'about 2 minutes to approve' },
    ladder: 0, ladderNote: 'One agent on one workflow.',
    models: ['aih.session', 'calendar.event'],
    samples: [{ file: '5-session-notes.txt', label: 'Mentor 06 logs a one-to-one' }, { file: '5-session-notes-other.txt', label: 'A clinic by a different mentor' }],
  },
  {
    n: 6, id: 'challenge-intake', activity: 'Challenge Connect', for: ['challenger'],
    title: 'A company emails a problem',
    ask: '"Our owners want monthly energy and water readings for 40 flats. Can somebody help?"',
    trigger: { what: 'An email, or a WhatsApp message to Challenge Connect', connectors: ['gmail', 'outlook', 'whatsapp'] },
    steps: ['Read the problem', 'Draft a structured challenge', 'List what is missing', 'Score suppliers with Odoo\'s rule', 'Owner confirms the draft', 'Notify the top 3 only after approval'],
    reads: [['Public feed', 'suppliers, companies, the skill list (aih.skill), the match rule (skills 50, town 20, budget 30)'], ['Private feed (staff)', 'supplier contacts; suppliers without consent are never notified'], ['The email', 'pasted below']],
    policy: {
      grant: ['aih.challenge: create (unpublished), action_compute_matches', 'mail.activity: schedule a to-do', 'Challenges mailbox: read, create drafts'],
      mandate: 'Turn a problem sent by email into a challenge draft, compute the likely matches, and prepare the notices.',
      gap: ['The cell can create challenges for any company. Barrier: the owner confirms each draft before anything is published.'],
      barriers: [['approval', 'Publishing the challenge: the owner confirms'], ['approval', 'Notifying suppliers, only after it is published'], ['refused', 'Notifying a supplier without consent'], ['refused', 'Inventing a budget or a deadline: the cell asks']],
    },
    time: { per: 'per challenge', today: 120, cell: 20, todayText: 'about 2 hours of back and forth to structure it and find suppliers', cellText: 'about 20 minutes: the owner corrects the draft, staff approves the notices' },
    ladder: 1, ladderNote: 'A few sessions: intake, matching and notices as three roles on one lane.',
    models: ['aih.challenge', 'mail.activity'],
    samples: [{ file: '6-challenge-email.txt', label: 'Energy readings, with budget and date' }, { file: '6-challenge-vague.txt', label: 'Restaurant bookings, vague' }],
  },
  {
    n: 7, id: 'vibathon-signups', activity: 'Vibathon', for: ['participant'],
    title: 'Vibathon sign-ups from a spreadsheet',
    ask: 'A form fills a spreadsheet: duplicates, typos, a role in free text, and who agreed to what.',
    trigger: { what: 'New rows in the sign-up sheet behind a form', connectors: ['gforms', 'sheets', 'excel'] },
    steps: ['Read the rows', 'Clean emails and roles', 'Remove duplicates in the sheet', 'Check Odoo for people already registered', 'Respect each consent', 'Propose participants and a confirmation'],
    reads: [['Public feed', 'the next Vibathon, talent (for people already listed)'], ['Private feed (staff)', 'the participants already registered, to dedupe by email'], ['The sheet', 'pasted below']],
    policy: {
      grant: ['aih.vibathon.participant: create', 'aih.vibathon: write (registrations count)', 'res.partner: create (only with directory consent, unpublished)', 'Sign-up sheet: read'],
      mandate: 'Register the people who signed up, once each, with their role, and prepare one confirmation email.',
      gap: ['Participant records hold emails; the public feed never carries them. Barrier: the exporter strips private fields.'],
      barriers: [['approval', 'The confirmation email (one approval for the batch)'], ['refused', 'A directory listing for anyone who did not say yes'], ['refused', 'Rows with an invalid email: held for a person']],
    },
    time: { per: 'per event', today: 180, cell: 20, todayText: 'about 3 hours per event: clean, dedupe, retype, confirm', cellText: 'about 20 minutes to check the held rows and approve' },
    ladder: 0, ladderNote: 'One agent on one workflow.',
    models: ['aih.vibathon.participant', 'aih.vibathon', 'res.partner'],
    samples: [{ file: '7-vibathon-signups.csv', label: 'Google Forms export' }, { file: '7-vibathon-signups-excel.csv', label: 'Excel, in Portuguese' }],
  },
  {
    n: 8, id: 'funder-report', activity: 'Partners and funders', for: [],
    title: 'Reporting to a funder or a partner',
    ask: '"For the co-financed project, please send the figures for July to September: companies, sessions, jobs, revenue, events."',
    trigger: { what: 'An email from a funder or partner, or a reporting date in the calendar', connectors: ['gmail', 'outlook', 'calendar'] },
    steps: ['Read the request', 'Find the period and the programme', 'Aggregate the figures from Odoo', 'Name every gap, never estimate', 'Draft the report and a spreadsheet', 'Queue for approval'],
    reads: [['Public feed', 'programmes, companies, sessions, KPIs, Vibathons, events'], ['The request', 'pasted below']],
    policy: {
      grant: ['Read every hub model', 'ir.attachment: create (the report on the programme)', 'Reporting mailbox: read, create drafts'],
      mandate: 'Answer funders\' and partners\' requests for figures with aggregates from Odoo, in a report and a spreadsheet for a person to send.',
      gap: ['Read access includes personal data. Barrier: the cell sends aggregates only; a request for personal data is refused.'],
      barriers: [['approval', 'Sending the report'], ['refused', 'Personal data (names, emails) in a report'], ['refused', 'Estimating a figure Odoo does not hold'], ['approval', 'Simulated figures: never sent to a real funder']],
    },
    time: { per: 'per report', today: 720, cell: 60, todayText: 'one to two days per report, gathering numbers from sheets and emails', cellText: 'about an hour to check the figures and the gaps' },
    ladder: 0, ladderNote: 'One agent on one workflow.',
    models: ['ir.attachment'],
    samples: [{ file: '8-funder-request.txt', label: 'Funder: quarterly figures' }, { file: '8-partner-request.txt', label: 'Partner: figures and a participant list' }],
  },
  {
    n: 9, id: 'weekly-digest', activity: 'Community', for: [],
    title: 'The weekly digest',
    ask: 'Every Monday: what is on in the region, what is open, what is next, in one email.',
    trigger: { what: 'A schedule (Monday 08:00), with Odoo events and items that arrived by email', connectors: ['odoo', 'calendar', 'gmail'] },
    steps: ['Read the week and the extra items', 'Collect events from Odoo', 'Add the next Vibathon and open challenges', 'Mark unverified items', 'Draft the newsletter', 'Queue for approval'],
    reads: [['Public feed', 'events (real, from algarveevolution.pt, with sources), Vibathons, challenges, programmes'], ['The week\'s note', 'pasted below']],
    policy: {
      grant: ['mailing.mailing: create (draft)', 'event.event, aih.*: read published records', 'Hub mailbox: read'],
      mandate: 'Draft the weekly digest from published records, for a person to approve and send to the opt-in list.',
      gap: ['A user who can create mailings can usually send them. Proposal: the cell\'s user gets Email Marketing draft rights only.'],
      barriers: [['approval', 'Sending the digest'], ['boundary', 'Only the opt-in mailing list'], ['approval', 'Items that are not in Odoo yet'], ['refused', 'Unpublished records']],
    },
    time: { per: 'per week', today: 120, cell: 15, todayText: 'about 2 hours a week', cellText: 'about 15 minutes to read and approve' },
    ladder: 0, ladderNote: 'One agent on one workflow, woken by a schedule.',
    models: ['mailing.mailing'],
    samples: [{ file: '9-digest-week.txt', label: 'Week of 16 November' }, { file: '9-digest-december.txt', label: 'Week of 7 December' }],
  },
  {
    n: 10, id: 'community-import', activity: 'Talent Ecosystem', for: ['professional'],
    title: 'A community\'s member list as a spreadsheet',
    ask: '"Here is our member list. Can you add us to the network?"',
    trigger: { what: 'A spreadsheet sent by email, or shared from a drive', connectors: ['gmail', 'excel', 'sheets'] },
    steps: ['Read the sheet (any headers, any delimiter)', 'Find or propose the community', 'Dedupe in the sheet and against Odoo', 'Sort by consent: yes, no, not asked', 'Propose contacts for the yes rows', 'Draft consent requests'],
    reads: [['Public feed', 'communities, talent (to dedupe by name)'], ['Private feed (staff)', 'people without consent, to dedupe'], ['The sheet', 'pasted below']],
    policy: {
      grant: ['aih.community: create (unpublished)', 'res.partner: create (talent, unpublished)', 'Hub mailbox: read, create drafts'],
      mandate: 'Import a community\'s members into the Talent Ecosystem, once each, with their consent recorded.',
      gap: ['The cell receives personal data of people who have not agreed. Barrier: rows without consent never reach Odoo; "no" rows are dropped and only counted.'],
      barriers: [['refused', 'Importing anyone who said no'], ['approval', 'Consent requests to people not yet asked'], ['approval', 'Publishing anyone: staff checks first'], ['refused', 'Rows with an invalid email']],
    },
    time: { per: 'per list', today: 240, cell: 20, todayText: 'about 4 hours per list: clean, dedupe, retype, ask', cellText: 'about 20 minutes to approve' },
    ladder: 0, ladderNote: 'One agent on one workflow.',
    models: ['aih.community', 'res.partner'],
    samples: [{ file: '10-community-members.csv', label: 'A new informal group' }, { file: '10-community-members-excel.csv', label: 'Excel, in Portuguese, a community in Odoo' }],
  },
];

// ------------------------------------------------------------------ helpers
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const base = s => String(s ?? '').replace(/\s*\(simulated\)\s*$/i, '').trim();
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const uniq = a => [...new Set(a.filter(Boolean))];
const and = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
// The sentences that say what someone offers ("we provide", "I offer", "help with"), so a sector is not read as a service.
const offerText = t => { const s = String(t).split(/(?<=[.!?])\s+|\n/).filter(x => /\b(provide|offer|we do|services?|help (startups )?with|speciali[sz]e)/i.test(x)); return s.length ? s.join(' ') : t; };
const num = n => Number(n ?? 0).toLocaleString('en-GB');
const eur = n => `€${Number(n ?? 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const longDate = iso => { if (!iso) return ''; const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return `${d} ${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} ${y}`; };
const addMonths = (iso, k) => { const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 10); };
const addDays = (iso, k) => new Date(Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) + k * 864e5).toISOString().slice(0, 10);
const validEmail = e => /^[^\s@()]+@[^\s@()]+\.[^\s@()]+$/.test(String(e || '').trim());
const mask = e => String(e || '').replace(/^(.)[^@]*(@.*)$/, '$1***$2');
const scrub = t => String(t).replace(/^This (email|form submission) is invented.*$/gim, '').trim();
const STAGE_LABEL = { idea: 'idea', pre_seed: 'pre-seed', seed: 'seed', early_revenue: 'early revenue', growth: 'growth' };
const STAGE_ORDER = ['idea', 'pre_seed', 'seed', 'early_revenue', 'growth'];
const PRODUCT_ORDER = ['idea', 'prototype', 'mvp', 'launched', 'scaling'];

// The Algarve's municipalities (as the addon lists them) and towns that sit inside one.
const TOWNS = ['Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Faro', 'Lagoa', 'Lagos', 'Loulé', 'Monchique', 'Olhão', 'Portimão', 'São Brás de Alportel', 'Silves', 'Tavira', 'Vila do Bispo', 'Vila Real de Santo António'];
const TOWN_ALIAS = { quarteira: 'Loulé', vilamoura: 'Loulé', almancil: 'Loulé', alvor: 'Portimão', sagres: 'Vila do Bispo', ferragudo: 'Lagoa', 'armacao de pera': 'Silves', 'monte gordo': 'Vila Real de Santo António' };
function findTown(text) {
  const t = norm(text); let best = null;
  for (const town of TOWNS) { const i = t.search(new RegExp(`\\b${escRe(norm(town))}\\b`)); if (i >= 0 && (!best || i < best.i)) best = { i, town, raw: town }; }
  for (const [a, town] of Object.entries(TOWN_ALIAS)) { const i = t.search(new RegExp(`\\b${escRe(a)}\\b`)); if (i >= 0 && (!best || i < best.i)) best = { i, town, raw: a[0].toUpperCase() + a.slice(1) }; }
  return best;
}
const inAlgarve = town => TOWNS.some(t => norm(t) === norm(town)) || !!TOWN_ALIAS[norm(town)];

// Keyword rules: the stand-in for a model. Each rule is shown with the words that triggered it.
const SKILL_RULES = [
  ['AI and machine learning', [/\bAI\b/, /machine learning|artificial intelligence|\bLLMs?\b|computer vision/i]],
  ['Chatbots', [/chat ?bots?|conversational|virtual assistant|booking assistant/i]],
  ['Cloud and DevOps', [/\bcloud\b|devops|\baws\b|azure|kubernetes|hosting|stored in the EU/i]],
  ['Cybersecurity', [/cyber ?security|penetration test|pen ?test|iso 27001|data protection|\bsecurity\b/i]],
  ['Data engineering', [/data pipeline|data engineering|dashboards?\b|analytics|\betl\b|data scien/i]],
  ['E-commerce', [/e-?commerce|online shops?|web shop|marketplace/i]],
  ['IoT and sensors', [/\biot\b|sensors?\b|\bmeters\b/i]],
  ['Legal and IP', [/\blegal\b|lawyers?\b|intellectual property|trademark|patent|gdpr|contracts?\b/i]],
  ['Marketing', [/marketing|\bbrand\b|\bbranding\b|\bseo\b|social media|campaigns?\b/i]],
  ['Mobile apps', [/mobile apps?|\bios\b|android|whatsapp/i]],
  ['Product management', [/product management|product strategy|roadmap|\bmvp\b/i]],
  ['Robotics', [/robot/i]],
  ['Sales', [/\bsales\b|lead generation|go-to-market|selling/i]],
  ['UX design', [/\bux\b|user experience|user research|\bdesign(er)?\b|\bui\b/i]],
  ['Web development', [/websites?\b|web development|web app|front-?end|wordpress/i]],
  ['Finance and fundraising', [/fundrais|investors?\b|accounting|cap table|pitch deck/i]],
  ['Blue economy', [/blue economy|\boceans?\b|fishing|fishers?\b|\bthe sea\b/i]],
  ['Sustainability', [/sustainab|\benergy\b|carbon|\besg\b|circular/i]],
  ['Agritech', [/agritech|farm|irrigation|\bcrops?\b|orchard/i]],
  ['Tourism tech', [/tourism|hotels?\b|guesthouses?|hospitality/i]],
];
const SECTOR_RULES = [
  ['Tourism tech', [/tourism|hotels?\b|guesthouses?|hospitality/i]], ['Blue economy', [/blue economy|\boceans?\b|fishing|\bthe sea\b/i]],
  ['Agritech', [/agritech|farm|irrigation/i]], ['E-commerce', [/e-?commerce|online shops?/i]], ['Sustainability', [/sustainab|\benergy\b|carbon/i]],
  ['Edtech', [/edtech|education|schools?\b/i]], ['Marine services', [/marine|\bboats?\b|marina/i]], ['Circular economy', [/circular|recycl/i]],
  ['AI', [/\bAI\b/, /artificial intelligence/i]], ['Geospatial', [/geospatial|satellite/i]], ['Health tech', [/health|clinics?\b|medical/i]], ['Robotics', [/robot/i]],
];
// A rule of thumb for what each sector usually needs (an assumption to tune with the team, shown as such).
const SECTOR_NEEDS = { 'Tourism tech': ['Chatbots', 'Web development', 'Marketing'], 'Blue economy': ['IoT and sensors', 'Data engineering'], Agritech: ['IoT and sensors', 'Data engineering'], 'E-commerce': ['E-commerce', 'Marketing', 'Web development'], Sustainability: ['Data engineering', 'IoT and sensors'], Edtech: ['Mobile apps', 'UX design'], 'Marine services': ['Mobile apps', 'IoT and sensors'], 'Circular economy': ['E-commerce', 'Marketing'], AI: ['AI and machine learning', 'Cloud and DevOps', 'Cybersecurity'], Geospatial: ['Data engineering', 'AI and machine learning'], 'Health tech': ['Cybersecurity', 'Legal and IP'], Robotics: ['Robotics', 'IoT and sensors'] };
const STAGE_RULES = [['idea', /idea[- ]stage|\bidea\b/i], ['pre_seed', /pre-?seed/i], ['seed', /(?<!pre-)(?<!pre)\bseed\b/i], ['early_revenue', /early[- ]revenue|first revenue/i], ['growth', /\bgrowth\b|scale-?up/i]];
function detect(text, rules) {
  const out = [];
  for (const [key, res] of rules) for (const re of [].concat(res)) { const m = String(text).match(re); if (m) { out.push({ key, hit: m[0].trim() }); break; } }
  return out;
}
function stagesIn(text) {
  const t = String(text);
  const r = t.match(/from ([\w -]+?) (?:stage )?to ([\w -]+?)(?:[.,;\n]|$)/i);
  if (r) {
    const a = detect(r[1], STAGE_RULES)[0]?.key, b = detect(r[2], STAGE_RULES)[0]?.key;
    if (a && b) { const i = STAGE_ORDER.indexOf(a), j = STAGE_ORDER.indexOf(b); return { stages: STAGE_ORDER.slice(Math.min(i, j), Math.max(i, j) + 1), how: `range "${r[0].replace(/[.,;\n]$/, '').trim()}"` }; }
  }
  const d = detect(t, STAGE_RULES); return { stages: d.map(x => x.key), how: d.map(x => `"${x.hit}"`).join(', ') };
}

// Dates: ISO, "10 December 2026", "10 December" (next one), "end of March" or "by March" (last day of the next March).
function datesIn(text, ref) {
  const out = []; const t = String(text); const refY = Number(ref.slice(0, 4));
  for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) out.push({ iso: m[0], raw: m[0], i: m.index });
  const mon = MONTHS.join('|');
  for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)? (${mon})(?: (\\d{4}))?`, 'gi'))) {
    const mo = MONTHS.indexOf(m[2].toLowerCase()) + 1; let y = m[3] ? Number(m[3]) : refY;
    let iso = `${y}-${String(mo).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    if (!m[3] && iso < ref) iso = `${y + 1}${iso.slice(4)}`;
    out.push({ iso, raw: m[0], i: m.index });
  }
  for (const m of t.matchAll(new RegExp(`\\b(?:end of|by|before|in) (${mon})(?: (\\d{4}))?\\b`, 'gi'))) {
    const mo = MONTHS.indexOf(m[1].toLowerCase()) + 1; let y = m[2] ? Number(m[2]) : refY;
    const last = d => new Date(Date.UTC(d, mo, 0)).toISOString().slice(0, 10);
    let iso = last(y); if (!m[2] && iso < ref) iso = last(y + 1);
    if (!out.some(o => Math.abs(o.i - m.index) < 4)) out.push({ iso, raw: m[0], i: m.index, monthOnly: true });
  }
  return out.sort((a, b) => a.i - b.i);
}
// Money: "between 7,000 and 11,000 EUR", "€8k to €12k", "around 10,000 EUR".
function moneyIn(text) {
  const n = s => { const k = /k$/i.test(s); const v = Number(s.replace(/k$/i, '').replace(/[,\s]/g, '')); return k ? v * 1000 : v; };
  const N = '(\\d{1,3}(?:[,\\s]\\d{3})+|\\d+(?:\\.\\d+)?k?)';
  const r = String(text).match(new RegExp(`(?:between\\s*)?(?:€|EUR\\s*)?${N}\\s*(?:EUR|€)?\\s*(?:and|to|-)\\s*(?:€|EUR\\s*)?${N}\\s*(?:EUR|euros?|€)`, 'i'))
    || String(text).match(new RegExp(`(?:€|EUR\\s*)${N}\\s*(?:and|to|-)\\s*(?:€|EUR\\s*)?${N}`, 'i'));
  if (r) return { min: n(r[1]), max: n(r[2]), raw: r[0].trim() };
  const one = String(text).match(new RegExp(`(?:€\\s*${N}|${N}\\s*(?:EUR|euros?|€))`, 'i'));
  if (one) { const v = n(one[1] || one[2]); return { min: v, max: v, raw: one[0].trim() }; }
  return null;
}

export function parseEmail(text) {
  const s = String(text || '').replace(/\r/g, '');
  const cut = s.search(/\n\s*\n/);
  let head = '', body = s;
  if (/^[A-Za-z-]+:/.test(s) && cut > 0) { head = s.slice(0, cut); body = s.slice(cut).trim(); }
  const h = {};
  head.split('\n').forEach(l => { const m = l.match(/^([A-Za-z-]+):\s*(.*)$/); if (m) h[m[1].toLowerCase()] = m[2].trim(); });
  const a = String(h.from || '');
  const m = a.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  const from = m ? { name: m[1].trim(), email: m[2].trim() } : { name: a.replace(/\S+@\S+/, '').trim(), email: (a.match(/\S+@\S+/) || [''])[0] };
  return { h, from, subject: h.subject || '', date: (h.date || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] || '', body: scrub(body) };
}
// "Key: value" lines (web forms, emails with fields).
const fields = text => Object.fromEntries(String(text).split('\n').map(l => l.match(/^\s*([A-Za-z][\w ()/-]{1,40}?)\s*:\s*(.+)$/)).filter(Boolean).map(m => [norm(m[1]), m[2].trim()]));
export function parseCSV(text) {
  const s = String(text || '').replace(/\r/g, '').trim();
  const first = s.split('\n')[0] || '';
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.includes('\t') ? '\t' : ',');
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === delim) { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  row.push(cell); rows.push(row);
  const head = rows.shift().map(x => x.trim());
  return { delim, head, rows: rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((k, i) => [k, (r[i] ?? '').trim()]))) };
}
// Find a column by any of its names (English and Portuguese headers).
const col = (head, ...names) => head.find(h => names.some(n => norm(h).includes(n)));
const looksCSV = t => { const l = String(t).trim().split('\n'); return l.length > 1 && /[,;\t]/.test(l[0]) && !/^[A-Za-z-]+: /.test(l[0]); };

// Find a feed record whose name appears in the text ("Startup 13" finds "Startup 13 (simulated)").
function nameIn(text, list) {
  const t = norm(text); let best = null;
  for (const r of list) { const b = norm(base(r.name)); if (b && new RegExp(`\\b${escRe(b)}\\b`).test(t) && (!best || b.length > norm(base(best.name)).length)) best = r; }
  return best;
}
const sameName = (a, b) => norm(base(a)) === norm(base(b));
const consentOf = v => { const n = norm(v); if (/^(yes|y|sim|s|true|1|x|ok)$/.test(n)) return 'yes'; if (/^(no|n|nao|false|0)$/.test(n)) return 'no'; return ''; };

// One Odoo call: shown in a .odoo-call panel, and sent to the plan queue.
// flag: { later: 'why' } for a step that waits for something (not in this plan item), or { outside: 'why' } for a
// call the plan broker's policy (src/hub/plan-policy.js) does not allow: shown, never added to the plan.
const call = (model, method, body, why = '', note = '', flag = {}) => ({ model, method, body, why, note, ...flag });
const OUTSIDE = 'Not added to the plan: the plan broker writes only the hub\'s models and hub contacts (src/hub/plan-policy.js).';
const chk = (rule, v, note = '') => ({ rule, v, note }); // v: allowed | approval | refused
const NEEDS_APP = app => `Needs Odoo's ${app} app, which the experimentation Odoo does not have installed (the addon depends on base, mail, contacts and event).`;
const todo = (model, id, summary, note) => call(model, 'activity_schedule', { ids: [id], act_type_xmlid: 'mail.mail_activity_data_todo', summary, note }, 'A to-do for a person at Algarve Evolution, with the draft attached. Sends nothing.');
const note = (model, id, body) => call(model, 'message_post', { ids: [id], body, message_type: 'comment', subtype_xmlid: 'mail.mt_note' }, 'An internal note on the record: it notifies nobody.');
const SIGN = 'The Algarve Evolution team\n(drafted by an agentic cell, read and sent by a person)';

// ------------------------------------------------------------------ the ten runners
// Each takes (input text, ctx) and returns what the page shows. ctx = { F: feed, priv, ref: today, data, vocab }.
// Result: { summary, steps[], extracted[[label, value, how]], groups[{ title, note, items[] }], tables[], drafts[],
// checks[], calls[], privateNotes[], files[], plan: { title, refs } }.
const OPEN = new Set(['open', 'matching']);
const ORG_RE = /\b([A-Z][\w-]*(?: [A-Za-z][\w-]*){0,2} \d+ \(simulated\))/g;
const orgsIn = (text, exclude = '') => uniq((String(text).match(ORG_RE) || []).map(s => s.trim())).filter(x => !sameName(x, exclude) && !/^(Founder|Person|Mentor|Registrant|Funder|Partner)\b/.test(x));
const skillIds = list => [[6, 0, list.map(x => `<aih.skill: ${x}>`)]];
const ref1 = r => r?.odoo?.id ?? `<${r?.id || 'new'}>`;

function runSupplier(input, { F, priv, ref, vocab }) {
  const e = parseEmail(input); const text = `${e.subject}\n${e.body}`;
  const skills = detect(offerText(text), SKILL_RULES).filter(s => vocab.has(s.key));
  const st = stagesIn(text); const sectors = detect(text, SECTOR_RULES); const town = findTown(e.body);
  const freelancer = /freelanc|independent|self-employed/i.test(text);
  const org = orgsIn(e.body, e.from.name)[0] || e.from.name;
  const known = F.suppliers.find(s => sameName(s.name, org) || (priv && s.contact && norm(s.contact) === norm(e.from.email)));
  const cap = new Set(skills.map(s => s.key));
  const prog = Object.fromEntries(F.programmes.map(p => [p.id, p]));
  const companies = F.companies.map(c => {
    let score = 0; const why = []; let strong = false;
    if (st.stages.length) { if (st.stages.includes(c.stage)) { score += 25; why.push(`Stage: ${STAGE_LABEL[c.stage]}, which you work with (+25)`); } else why.push(`Stage: ${STAGE_LABEL[c.stage] || c.stage}, outside the stages you named (+0)`); }
    else { score += 12; why.push('Stage: none named, so half marks (+12)'); }
    if (sectors.some(s => s.key === c.sector)) { score += 25; strong = true; why.push(`Sector: ${c.sector}, which you named (+25)`); }
    let best = null;
    for (const ch of F.challenges.filter(ch => ch.company_id === c.id && OPEN.has(ch.status))) { const sh = ch.skills.filter(k => cap.has(k)); if (sh.length && (!best || sh.length / ch.skills.length > best.r)) best = { ch, sh, r: sh.length / ch.skills.length }; }
    if (best) { const p = Math.round(30 * best.r); score += p; strong = true; why.push(`Open challenge "${base(best.ch.title)}" wants ${best.sh.join(', ')} (+${p})`); }
    const needs = (SECTOR_NEEDS[c.sector] || []).filter(k => cap.has(k));
    if (needs.length) { score += 10; strong = true; why.push(`Rule of thumb: ${c.sector} companies often need ${needs.join(', ')} (+10)`); }
    if (prog[c.programme_id]?.status === 'running') { score += 10; why.push(`In the running ${prog[c.programme_id].kind} cohort (+10)`); }
    return { c, score, why, strong, ch: best?.ch };
  }).filter(x => x.strong && x.score >= 35).sort((a, b) => b.score - a.score).slice(0, 5);
  const challenges = F.challenges.filter(ch => OPEN.has(ch.status)).map(ch => ({ ch, sh: ch.skills.filter(k => cap.has(k)) })).filter(x => x.sh.length).sort((a, b) => b.sh.length / b.ch.skills.length - a.sh.length / a.ch.skills.length);
  const top3 = companies.slice(0, 3);
  const skillList = skills.map(s => s.key);
  const reply = [
    `Dear ${base(e.from.name)},`, '',
    `Thank you for writing to the AE Innovation Hub. From your email we read that you offer ${and(skillList) || 'services we could not classify'}${st.stages.length ? `, for ${and(st.stages.map(s => STAGE_LABEL[s]))} companies` : ''}${sectors.length ? `, especially in ${and(sectors.map(s => s.key))}` : ''}.`, '',
    challenges.length ? 'Open challenges on Challenge Connect that you can answer now:' : 'No open challenge on Challenge Connect fits these services today.',
    ...challenges.slice(0, 3).map(x => `- ${base(x.ch.title)} (wants ${x.ch.skills.join(', ')}; budget ${eur(x.ch.budget_eur_min)} to ${eur(x.ch.budget_eur_max)}): /challenge-connect/#challenge-${x.ch.id}`), '',
    top3.length ? `We also think ${top3.length === 1 ? 'one company' : `${top3.length} companies`} in our programmes may need this. We do not share their names or contacts before they agree: we will ask them first, and if they say yes we will introduce you both by email.` : 'We found no programme company with a clear need for this yet; we will keep your details for future challenges.', '',
    'You can also register as a supplier on Challenge Connect, so new challenges reach you. We list suppliers publicly only with their consent.', '',
    'Kind regards,', SIGN,
  ].join('\n');
  const intros = top3.map(x => ({ label: `Intro request to ${base(x.c.name)}`, to: `The founders of ${x.c.name} (their email is in Odoo, private)`, subject: 'Would you like an introduction to a supplier?',
    body: [`Hello,`, '', `A ${freelancer ? 'freelancer' : 'company'} in ${town?.town || 'the region'} offers ${skillList.join(', ')}. ${x.ch ? `It may help with your challenge "${base(x.ch.title)}".` : `Companies in ${x.c.sector} often need this.`}`, '', 'Would you like an introduction? Reply yes and we will introduce you both by email. If not, we will not share your details.', '', SIGN].join('\n') }));
  const partnerVals = { name: org, is_company: !freelancer, email: e.from.email, city: town?.town || false, aih_is_supplier: true, aih_capability_ids: skillIds(skillList), aih_consent: false, aih_published: false, aih_simulated: true };
  const pid = known ? known.odoo.id : '<id from call 1>';
  const calls = [
    known ? call('res.partner', 'write', { ids: [known.odoo.id], vals: { aih_capability_ids: skillList.map(x => [4, `<aih.skill: ${x}>`]) } }, `${known.name} is already in Odoo: add the services, do not create it twice.`)
      : call('res.partner', 'create', { vals_list: [partnerVals] }, 'The supplier as a contact: unpublished and without consent until they register.'),
    call('crm.lead', 'create', { vals_list: [{ name: `Supplier: ${org} offers ${skillList.slice(0, 3).join(', ')}`, type: 'lead', partner_id: pid, email_from: e.from.email, description: `Asked who to talk to (${e.date || ref}). Fits: ${challenges.map(x => x.ch.id).join(', ') || 'no open challenge'}; companies to ask: ${top3.map(x => x.c.id).join(', ') || 'none'}.` }] }, 'A lead in the CRM, so the conversation is not lost.', NEEDS_APP('CRM'), { outside: OUTSIDE }),
    todo('res.partner', pid, 'Review and send the reply drafted by the supplier-intro cell', reply),
  ];
  const checks = [
    chk('Read the public feed (companies, challenges, suppliers)', 'allowed', 'Published records only.'),
    known ? chk(`Add services to a supplier already in Odoo (${known.name})`, 'allowed', 'Write limited to the services field.') : chk('Create the supplier as an unpublished contact without consent', 'allowed', 'res.partner create with aih_published false and aih_consent false.'),
    chk('Publish the supplier on Challenge Connect', 'refused', 'No consent yet: the supplier registers and agrees first.'),
    chk('Name programme companies to the supplier', 'refused', 'Double opt-in: each company agrees before its name or contact is shared.'),
    chk(`Ask ${top3.length} compan${top3.length === 1 ? 'y' : 'ies'} whether they want an intro`, top3.length ? 'approval' : 'allowed', top3.length ? 'Outbound email: a person approves.' : 'Nobody to ask.'),
    chk('Send the reply to the supplier', 'approval', 'Outbound email: a person reads and sends it.'),
    chk('Create a CRM lead', 'refused', `Shown as a proposal, not added to the plan: ${NEEDS_APP('CRM')} The plan broker writes hub models only.`),
  ];
  return {
    summary: `${skillList.length} service${skillList.length === 1 ? '' : 's'} read, ${challenges.length} open challenge${challenges.length === 1 ? '' : 's'} and ${top3.length} compan${top3.length === 1 ? 'y' : 'ies'} matched; 1 reply and ${intros.length} intro request${intros.length === 1 ? '' : 's'} drafted.`,
    extracted: [['From', `${e.from.name} <${e.from.email}>`], ['Organisation', `${org}${freelancer ? ' (freelancer)' : ''}${known ? ' · already in Odoo' : ' · new to Odoo'}`], ['Services', skillList.join(', ') || 'none recognised', skills.map(s => `"${s.hit}"`).join(', ')], ['Stages', st.stages.map(s => STAGE_LABEL[s]).join(', ') || 'not named', st.how], ['Sectors', sectors.map(s => s.key).join(', ') || 'not named', sectors.map(s => `"${s.hit}"`).join(', ')], ['Town', town?.town || 'not named', town ? `"${town.raw}"` : '']],
    groups: [
      { title: 'Open challenges that fit', note: 'Challenges with status open or matching that want at least one of the services.', items: challenges.slice(0, 4).map(x => ({ name: x.ch.title, sim: x.ch.simulated, score: Math.round(100 * x.sh.length / x.ch.skills.length), reasons: [`Wants ${x.sh.length} of ${x.ch.skills.length} of these skills: ${x.sh.join(', ')}`, `Budget ${eur(x.ch.budget_eur_min)} to ${eur(x.ch.budget_eur_max)}, deadline ${longDate(x.ch.deadline)}`], href: `/v2/challenge-connect/#challenge-${x.ch.id}` })) },
      { title: 'Programme companies to ask first', note: 'Score out of 100: stage 25, sector 25, an open challenge of theirs 30, the sector rule of thumb 10, a running cohort 10. Not shared with the supplier until the company says yes.', items: companies.map(x => ({ name: x.c.name, sim: x.c.simulated, score: x.score, reasons: x.why, meta: `${x.c.sector} · ${x.c.town} · ${STAGE_LABEL[x.c.stage] || x.c.stage}` })) },
    ],
    drafts: [{ label: 'Reply to the supplier', to: `${e.from.name} <${e.from.email}>`, subject: `Re: ${e.subject}`, body: reply }, ...intros],
    checks, calls,
    privateNotes: priv ? [{ title: 'Private feed: supplier contacts checked', lines: [known ? `${known.name}: contact ${known.contact || 'none in Odoo'}` : `No supplier in Odoo with the name "${org}" or the email ${e.from.email}.`] }] : [],
    plan: { title: `Supplier ${org}: record as a lead and reply with ${challenges.length} challenge(s), ${top3.length} intro(s) to ask`, refs: [...challenges.map(x => x.ch.id), ...companies.map(x => x.c.id), ...(known ? [known.id] : [])] },
  };
}

function runExpert(input, { F, priv }) {
  const e = parseEmail(input); const text = `${e.subject}\n${e.body}`;
  const c = nameIn(text, F.companies);
  const needs = detect(text, SKILL_RULES); const need = needs.map(n => n.key);
  const wantMentor = /\bmentors?\b/i.test(text), wantInvestor = /\b(an|one) investor\b/i.test(text);
  const people = new Map();
  const add = (r, kind, skills, consent, extra = {}) => {
    const p = people.get(r.id) || { id: r.id, name: r.name, town: r.town, sim: r.simulated, odoo: r.odoo, kinds: new Set(), skills: new Set(), consent: true };
    p.kinds.add(kind); skills.forEach(s => p.skills.add(s)); if (consent === false) p.consent = false; Object.assign(p, extra); people.set(r.id, p);
  };
  F.mentors.forEach(m => add(m, m.kind === 'guest' ? 'guest mentor' : 'one-to-one mentor', m.expertise, m.consent, { companies: m.company_ids }));
  F.talent.filter(t => ['professional', 'consultant', 'investor'].includes(t.kind)).forEach(t => add(t, t.kind, t.tags, t.consent));
  F.suppliers.filter(s => s.kind === 'individual').forEach(s => add(s, 'individual supplier', s.capabilities, s.consent, { rate: s.rate, contact: s.contact }));
  const scored = [...people.values()].map(p => {
    const sh = need.filter(k => p.skills.has(k)); if (!sh.length) return null;
    let s = Math.round(60 * sh.length / need.length); const why = [`Skills: ${sh.length} of ${need.length} asked (${sh.join(', ')}) (+${s})`];
    if (c && p.town) { if (norm(p.town) === norm(c.town)) { s += 15; why.push(`Town: same as the company, ${p.town} (+15)`); } else if (inAlgarve(p.town)) { s += 8; why.push(`Town: elsewhere in the Algarve, ${p.town} (+8)`); } }
    const isMentor = [...p.kinds].some(k => /mentor/.test(k));
    if (wantMentor && isMentor) { s += 10; why.push('A programme mentor, as asked (+10)'); }
    if (wantInvestor && p.kinds.has('investor')) { s += 10; why.push('An investor, as asked (+10)'); }
    if (p.kinds.has('guest mentor')) { s += 5; why.push('Guest mentor: runs clinics, so one session is easy to set up (+5)'); }
    if ((p.companies || []).length >= 3) { s -= 5; why.push(`Already mentors ${p.companies.length} companies (-5)`); }
    if (c && (p.companies || []).includes(c.id)) { s += 5; why.push('Already this company\'s mentor: ask them first (+5)'); }
    return { p, score: Math.max(0, Math.min(100, s)), why, sh };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  // Top 3 that between them cover the most needs: each next pick adds 20 for every need not yet covered.
  const pool = scored.filter(x => x.p.consent); const top = []; const covered = new Set();
  while (top.length < 3 && pool.length) {
    pool.sort((a, b) => (b.score + 20 * b.sh.filter(k => !covered.has(k)).length) - (a.score + 20 * a.sh.filter(k => !covered.has(k)).length));
    const x = pool.shift(); top.push(x); x.sh.forEach(k => covered.add(k));
  }
  const held = priv ? scored.filter(x => !x.p.consent) : [];
  const kindOf = p => [...p.kinds].join(', ');
  const reply = [`Dear ${base(e.from.name)},`, '', `Thank you. You asked for help with ${and(need) || 'something we could not classify'}. From the people in the hub who have agreed to be listed, these look closest:`, '',
    ...top.map((x, i) => `${i + 1}. ${x.p.name}, ${kindOf(x.p)}${x.p.town ? `, ${x.p.town}` : ''}: ${x.sh.join(', ')}`), '',
    'We are asking each of them first whether they have time. When one says yes, we will introduce you both by email.', need.filter(k => !covered.has(k)).length ? `Nobody listed covers ${need.filter(k => !covered.has(k)).join(', ')} yet; we will look further.` : '', '', 'Kind regards,', SIGN].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  const asks = top.map(x => ({ label: `Ask ${base(x.p.name)} first`, to: `${x.p.name} (email in Odoo${priv && x.p.contact ? `: ${x.p.contact}` : ', private'})`, subject: `Could you help ${c ? base(c.name) : 'a startup'}?`, body: [`Hello,`, '', `${c ? `${c.name}, a ${c.sector} company in ${c.town}${c.programme_id ? ' in our programmes' : ''},` : 'A startup in our programmes'} is looking for help with ${x.sh.join(', ')}.`, '', 'Would you be open to a first conversation? If yes, we will introduce you by email. If not, we will not share your details.', '', SIGN].join('\n') }));
  const calls = top.map(x => todo('res.partner', x.p.odoo?.id, `Ask ${x.p.name} if they will take an intro to ${c?.name || 'the startup'}`, asks.find(a => a.label.includes(base(x.p.name)))?.body || ''));
  const mentorPick = top.find(x => [...x.p.kinds].some(k => /mentor/.test(k)));
  if (c && mentorPick) calls.push(call('aih.session', 'create', { vals_list: [{ programme_id: ix(F.programmes, c.programme_id)?.odoo?.id, company_id: c.odoo.id, mentor_id: mentorPick.p.odoo.id, kind: mentorPick.p.kinds.has('guest mentor') ? 'clinic' : 'one_to_one', date: '<agreed date>', topic: mentorPick.sh.join(', '), is_published: true, simulated: true }] }, 'Only after both sides say yes: the first session, in the programme record.', '', { later: 'A later step: once the expert and the founder agree a date. Not in this plan item.' }));
  return {
    summary: `${need.length} need${need.length === 1 ? '' : 's'} read; ${scored.length} people with a matching skill; top 3 with consent cover ${covered.size} of ${need.length}.`,
    extracted: [['From', `${e.from.name} <${e.from.email}>`], ['Company', c ? `${c.name}, ${c.sector}, ${c.town}` : 'not found in Odoo'], ['Needs', need.join(', ') || 'none recognised', needs.map(n => `"${n.hit}"`).join(', ')], ['Asked for', [wantMentor && 'a mentor', wantInvestor && 'an investor', /expert/i.test(text) && 'an expert'].filter(Boolean).join(', ') || 'not said']],
    groups: [{ title: 'Top 3, people with consent', note: 'Skills 60 (share of the needs), town 15, kind of help asked 10, guest mentor 5, load -5. Each next pick favours needs not yet covered.', items: top.map(x => ({ name: x.p.name, sim: x.p.sim, score: x.score, reasons: x.why, meta: `${kindOf(x.p)}${x.p.town ? ` · ${x.p.town}` : ''}${x.p.rate ? ` · ${x.p.rate}` : ''}` })) },
      ...(held.length ? [{ title: 'Matched, but no consent', note: 'Shown to the Algarve Evolution team only. Never suggested to the founder; the team may ask them for consent first.', private: true, items: held.slice(0, 4).map(x => ({ name: x.p.name, sim: x.p.sim, score: x.score, reasons: x.why, meta: kindOf(x.p), flag: 'No consent' })) }] : [])],
    drafts: [{ label: 'Reply to the founder', to: `${e.from.name} <${e.from.email}>`, subject: `Re: ${e.subject}`, body: reply }, ...asks],
    checks: [chk('Match only people who gave consent', 'allowed', `${pool.length + top.length} with consent considered.`), chk('Suggest people without consent', 'refused', priv ? `${held.length} matched in the private feed, held back.` : 'They are not in the public feed at all.'), chk('Ask each expert first', 'approval', 'Outbound email: a person approves each ask.'), chk('Share the founder\'s contact with the expert', 'refused', 'Only after the expert says yes (double opt-in).'), chk('Reply to the founder', 'approval', 'Outbound email.'), ...(c && mentorPick ? [chk('Create the first session', 'approval', 'Only once both sides agree a date.')] : [])],
    calls,
    privateNotes: priv && top.some(x => x.p.contact) ? [{ title: 'Private feed: contacts', lines: top.filter(x => x.p.contact).map(x => `${x.p.name}: ${x.p.contact}`) }] : [],
    plan: { title: `${c ? c.name : 'A startup'} asks for help: ask ${top.length} expert(s) first`, refs: [c?.id, ...top.map(x => x.p.id)].filter(Boolean) },
  };
}
const ix = (list, id) => list.find(r => r.id === id);

function runMembership(input, { F, data, ref }) {
  const isForm = !/^From:/m.test(input);
  const e = parseEmail(input); const f = fields(input); const text = `${e.subject}\n${e.body}`;
  const person = f.name || e.from.name; const email = f.email || e.from.email;
  const org = f.organisation || orgsIn(text, person)[0] || person;
  const type = norm(f.type || '') || (/\bstartup\b/i.test(text) ? 'startup' : /association/i.test(text) ? 'association' : /freelanc/i.test(text) ? 'professional' : 'company');
  const st = stagesIn(text); const town = findTown(f.town || text);
  const site = (text.match(/https?:\/\/[^\s)]+/) || [])[0];
  const nif = (text.match(/(?:NIF|VAT)[^\d\n]{0,20}(\d{9})/i) || [])[1];
  const nifOk = nif ? (() => { const d = nif.split('').map(Number); const s = d.slice(0, 8).reduce((a, x, i) => a + x * (9 - i), 0); const c = 11 - (s % 11); return (c >= 10 ? 0 : c) === d[8]; })() : null;
  const listRaw = f['list us in the directory'] || (/(happy|glad) to be listed|list us/i.test(text) ? 'yes' : '');
  const listing = consentOf(listRaw) || (/listed/i.test(text) ? 'yes' : '');
  const dup = [...F.companies, ...F.talent, ...F.suppliers].find(r => sameName(r.name, org));
  const m = data.membership; const cat = type === 'startup' ? m : null;
  const welcome = [`Dear ${base(person)},`, '', `Thank you for applying to join Algarve Evolution${org !== person ? ` with ${org}` : ''}.`, cat ? `As a startup, ${org} fits the ${cat.name} category, at €${cat.price} a year. You will receive the invoice separately once our team has checked it.` : 'Our team will confirm the membership category that fits you and come back to you with the details.', '',
    'What membership opens up: our events, the programmes and Challenge Connect, and the Algarve Digital Innovators network.', listing === 'yes' ? 'You told us you are happy to be listed in the hub directory; we will publish your listing once our team has reviewed it.' : 'We will not list you in the hub directory unless you ask us to.', '', 'Welcome,', SIGN].join('\n');
  const calls = [
    call('res.partner', 'create', { vals_list: [{ name: org, is_company: true, city: town?.town || false, website: site || false, aih_consent: listing === 'yes', aih_published: false, aih_simulated: true }] }, dup ? `Check first: "${dup.name}" is already in Odoo. If it is the same, write to it instead.` : 'The member organisation, unpublished.'),
    ...(org !== person ? [call('res.partner', 'create', { vals_list: [{ name: person, parent_id: '<id from call 1>', email, function: f.role || (text.match(/\n(Co-?founder|Founder|Chair|Director)[^\n]*/i) || [])[1] || false, aih_simulated: true }] }, 'The person who applied, as a contact of the organisation.', '', { outside: 'Not added to the plan: parent_id and function are outside the hub fields the plan broker may write (a proposal: allow them).' })] : []),
    ...(cat ? [call('account.move', 'create', { vals_list: [{ move_type: 'out_invoice', partner_id: '<id from call 1>', invoice_origin: `Membership application ${e.date || f.submitted || ref}`, invoice_line_ids: [[0, 0, { name: `Algarve Evolution membership: ${cat.name}, 12 months`, quantity: 1, price_unit: cat.price }]] }] }, 'A draft invoice: Odoo creates it in state draft; the cell never posts it.', `${NEEDS_APP('Invoicing')} Taxes are left to staff: we do not know Algarve Evolution's VAT treatment of memberships. If Algarve Evolution uses Odoo's Members app, the same is a membership line on the contact.`, { outside: OUTSIDE })] : []),
    todo('res.partner', '<id from call 1>', cat ? 'Check and post the membership invoice; send the welcome email' : 'Choose the membership category; then the cell drafts the invoice', welcome),
  ];
  return {
    summary: `${isForm ? 'Form' : 'Email'} from ${org}: ${cat ? `category ${cat.name} at €${cat.price} a year, invoice drafted` : 'category not in our data, staff choose'}; welcome email drafted.`,
    extracted: [['Channel', isForm ? 'web form' : 'email'], ['Applicant', `${person} <${email}>`], ['Organisation', `${org}${dup ? ` · a record named "${dup.name}" is already in Odoo` : ' · not in Odoo yet'}`], ['Type', type], ['Stage', st.stages.map(s => STAGE_LABEL[s]).join(', ') || 'not said', st.how], ['Town', town?.town || 'not said'], ['Website', site || 'none'], ['VAT number', nif ? `${nif}: ${nifOk ? 'format and check digit valid' : 'check digit does not match'} (not checked with the tax authority)` : 'none given'], ['Directory listing', listing === 'yes' ? 'yes, they agreed' : listing === 'no' ? 'no' : 'not asked']],
    groups: [{ title: 'Membership category', note: `From src/data (voice.json): "${m.text}" Source: ${m.sources[0]}, read 6 November 2026.`, items: [cat ? { name: `${cat.name}: €${cat.price} a year`, score: null, reasons: ['Rule: a startup applies, so Start', 'Our data names only this category; other categories and prices are Algarve Evolution\'s to add'] } : { name: 'No category from our data', score: null, flag: 'Staff choose', reasons: [`Rule: the applicant is ${type === 'association' ? 'an association' : `a ${type}`}, and our data names only Start (for startups)`, 'No invoice is drafted until a person picks the category and price'] }] }],
    drafts: [{ label: 'Welcome email', to: `${person} <${email}>`, subject: 'Welcome to Algarve Evolution', body: welcome }, ...(cat ? [{ label: 'Invoice (draft in Odoo)', to: org, subject: `Invoice: membership ${cat.name}, 12 months`, body: `Customer: ${org}${nif ? ` (VAT PT${nif})` : ''}\nLine: Algarve Evolution membership: ${cat.name}, 12 months\nQuantity: 1\nUnit price: €${cat.price}\nTaxes: set by staff\nState: draft (the cell cannot post it)` }] : [])],
    checks: [chk('Create the organisation and contact, unpublished', 'allowed', dup ? `Possible duplicate: "${dup.name}". A person confirms.` : 'No duplicate by name.'), cat ? chk('Draft the invoice', 'approval', 'Created as a draft; a person checks and posts it.') : chk('Draft an invoice without a known category', 'refused', 'The cell does not guess a price.'), chk('Post the invoice or register a payment', 'refused', 'Outside the mandate: staff only.'), chk('Send the welcome email', 'approval', 'Outbound email.'), chk('List the member in the directory', listing === 'yes' ? 'approval' : 'refused', listing === 'yes' ? 'They agreed; staff review before publishing.' : 'No consent to be listed.')],
    calls, plan: { title: `Membership: ${org}${cat ? ` (${cat.name}, €${cat.price} a year)` : ' (category to choose)'}`, refs: dup ? [dup.id] : [] },
  };
}

function runKpi(input, { F }) {
  const numv = v => { if (v == null || String(v).trim() === '') return null; const n = Number(String(v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : null; };
  let rows, channel;
  if (looksCSV(input)) {
    const p = parseCSV(input); const H = p.head;
    const k = { co: col(H, 'company', 'empresa'), m: col(H, 'month', 'mes'), rev: col(H, 'revenue', 'receita', 'faturacao'), cus: col(H, 'customer', 'client'), team: col(H, 'team', 'equipa'), fund: col(H, 'funding', 'financ'), st: col(H, 'stage', 'fase'), by: col(H, 'submitted', 'email') };
    rows = p.rows.map(r => ({ company: r[k.co], month: r[k.m], revenue_eur: r[k.rev], customers: r[k.cus], team_size: r[k.team], funding_eur: r[k.fund], product_stage: r[k.st], by: r[k.by] })); channel = `spreadsheet (${p.rows.length} rows, "${p.delim}" separated)`;
  } else {
    const e = parseEmail(input); const f = fields(e.body); const c = nameIn(`${e.from.name}\n${e.body}`, F.companies);
    rows = [{ company: c?.name || e.from.name, month: (`${e.subject} ${e.body}`.match(/month (\d)/i) || [])[1], revenue_eur: f.revenue, customers: f.customers, team_size: f['team size'] || f.team, funding_eur: f.funding, product_stage: f['product stage'] || f.stage, by: e.from.email }]; channel = `email from ${e.from.name}`;
  }
  const prog = F.programmes.find(p => p.status === 'running') || F.programmes[0];
  const lastMonth = id => Math.max(-1, ...F.kpis.filter(k => k.company_id === id).map(k => k.month));
  const table = []; const clean = []; const flagged = []; const refused = []; const seen = new Set();
  for (const r of rows) {
    const c = F.companies.find(x => sameName(x.name, r.company));
    if (!c || !prog.company_ids.includes(c.id)) { refused.push(r.company); table.push({ cells: [r.company || '(no name)', r.month || '', '', '', '', '', ''], status: 'refused', note: `Not a company of ${base(prog.name)}: not written` }); continue; }
    seen.add(c.id);
    const m = numv(r.month) ?? lastMonth(c.id) + 1;
    const prev = F.kpis.find(k => k.company_id === c.id && k.month === m - 1);
    const v = { revenue_eur: numv(r.revenue_eur), customers: numv(r.customers), team_size: numv(r.team_size), funding_eur: numv(r.funding_eur), product_stage: norm(r.product_stage) || null };
    const flags = [];
    const missing = Object.entries(v).filter(([, x]) => x == null).map(([key]) => key.replace(/_eur$/, '').replace('_', ' '));
    if (missing.length) flags.push(`Missing: ${missing.join(', ')}`);
    if (m !== lastMonth(c.id) + 1) flags.push(`Month ${m}, but Odoo expects month ${lastMonth(c.id) + 1}`);
    if (prev && !missing.length) {
      const ch = (a, b) => (b ? (a - b) / b : 0);
      const rv = ch(v.revenue_eur, prev.revenue_eur);
      if (rv < -0.3) flags.push(`Revenue down ${Math.round(-rv * 100)}% (${eur(prev.revenue_eur)} to ${eur(v.revenue_eur)})`);
      if (rv > 1) flags.push(`Revenue up ${Math.round(rv * 100)}%: confirm`);
      if (prev.customers && ch(v.customers, prev.customers) < -0.25) flags.push(`Customers down from ${prev.customers} to ${v.customers}`);
      if (Math.abs(v.team_size - prev.team_size) >= 3) flags.push(`Team from ${prev.team_size} to ${v.team_size}: confirm`);
      if (v.funding_eur < prev.funding_eur) flags.push(`Funding fell from ${eur(prev.funding_eur)} to ${eur(v.funding_eur)}, but it is cumulative`);
      if (v.funding_eur - prev.funding_eur >= 50000 && v.funding_eur > 2 * prev.funding_eur) flags.push(`Funding up from ${eur(prev.funding_eur)} to ${eur(v.funding_eur)}: confirm the new round`);
      if (PRODUCT_ORDER.indexOf(v.product_stage) >= 0 && PRODUCT_ORDER.indexOf(v.product_stage) < PRODUCT_ORDER.indexOf(prev.product_stage)) flags.push(`Product stage went back, ${prev.product_stage} to ${v.product_stage}`);
    }
    if (v.product_stage && !PRODUCT_ORDER.includes(v.product_stage)) flags.push(`Product stage "${r.product_stage}" is not one of Odoo's (${PRODUCT_ORDER.join(', ')})`);
    const pv = (key, f = x => num(x)) => (v[key] == null ? '?' : prev ? `${f(prev[key])} → ${f(v[key])}` : f(v[key]));
    table.push({ cells: [c.name, String(m), pv('revenue_eur', eur), pv('customers'), pv('team_size'), pv('funding_eur', eur), v.product_stage ? (prev ? `${prev.product_stage} → ${v.product_stage}` : v.product_stage) : '?'], status: flags.length ? 'held' : 'ok', note: flags.join('; ') || 'Clean: proposed for Odoo', ref: c.id });
    (flags.length ? flagged : clean).push({ c, m, v, flags, by: r.by });
  }
  const missingCos = looksCSV(input) ? prog.company_ids.filter(id => !seen.has(id)).map(id => ix(F.companies, id)).filter(Boolean) : [];
  const nextM = Math.max(0, ...clean.map(x => x.m), ...flagged.map(x => x.m));
  const drafts = [];
  if (missingCos.length) drafts.push({ label: `Reminder to ${missingCos.length} compan${missingCos.length === 1 ? 'y' : 'ies'}`, to: missingCos.map(c => `the founders of ${c.name}`).join('; ') + ' (emails in Odoo, private)', subject: `Reminder: your month ${nextM} numbers`, body: ['Hello,', '', `We have not yet received your month ${nextM} numbers for ${base(prog.name)}. Five figures, two minutes: revenue, customers, team size, funding to date and product stage.`, 'Reply to this email or fill in your row in the shared sheet.', '', 'Thank you,', SIGN].join('\n') });
  for (const x of flagged) drafts.push({ label: `Check with ${base(x.c.name)}`, to: x.by ? `${x.by}` : `the founders of ${x.c.name}`, subject: `A quick check on your month ${x.m} numbers`, body: ['Hello,', '', `Thank you for your month ${x.m} numbers. Before we record them, could you confirm:`, ...x.flags.map(f => `- ${f}`), '', SIGN].join('\n') });
  const calls = clean.length ? [call('aih.kpi', 'create', { vals_list: clean.map(x => ({ company_id: x.c.odoo.id, month: x.m, ...x.v, is_published: false, simulated: true })) }, `${clean.length} clean snapshot(s), unpublished: Algarve Evolution reviews and publishes them.`)] : [];
  return {
    summary: `${rows.length} row${rows.length === 1 ? '' : 's'} read: ${clean.length} clean, ${flagged.length} held for a person, ${refused.length} refused${missingCos.length ? `, ${missingCos.length} compan${missingCos.length === 1 ? 'y' : 'ies'} still to reply` : ''}.`,
    extracted: [['Channel', channel], ['Programme', `${prog.name} (${prog.status})`], ['Month collected', String(nextM)]],
    tables: [{ title: `Month ${nextM} against month ${nextM - 1} in Odoo`, head: ['Company', 'Month', 'Revenue', 'Customers', 'Team', 'Funding', 'Product stage'], rows: table, note: 'Rules: revenue down more than 30% or up more than 100%, customers down more than 25%, team up or down by 3 or more, funding lower than last month (it is cumulative) or more than doubled by 50,000 or more, product stage going back, missing values.' }],
    drafts, calls,
    checks: [chk(`Record ${clean.length} clean snapshot(s), unpublished`, 'allowed', 'aih.kpi create with is_published false.'), chk('Publish the KPIs', 'approval', 'Algarve Evolution reviews first; publishing adds them to the public results.'), ...(flagged.length ? [chk(`Write ${flagged.length} flagged row(s)`, 'approval', 'Held: a person checks with the founder first.')] : []), ...(refused.length ? [chk(`Rows for ${refused.join(', ')}`, 'refused', `Not in ${base(prog.name)}.`)] : []), ...(drafts.length ? [chk('Send reminders and checks', 'approval', 'Outbound email: one approval can cover the batch.')] : [])],
    plan: { title: `KPIs month ${nextM}: ${clean.length} to record, ${flagged.length} held`, refs: clean.map(x => x.c.id) },
  };
}

function runSession(input, { F, priv }) {
  const e = parseEmail(input); const text = `${e.subject}\n${e.body}`; const sent = e.date || '2026-11-16';
  const mentor = nameIn(e.from.name, F.mentors) || nameIn(text, F.mentors);
  const c = nameIn(e.body + '\n' + e.subject, F.companies);
  const kind = /\bclinic\b/i.test(text) ? 'clinic' : /\bworkshop\b/i.test(text) ? 'workshop' : 'one_to_one';
  const lines = e.body.split('\n');
  const nextLine = lines.find(l => /next session/i.test(l)) || '';
  // The session's date: "yesterday" or "today" against the email's date, else a date in the subject, else the email's date.
  let date = sent; let dateHow = 'the email\'s date';
  const subjDate = datesIn(e.subject, '2000-01-01')[0];
  if (/\byesterday\b/i.test(e.body)) { date = addDays(sent, -1); dateHow = '"yesterday", from the email\'s date'; }
  else if (/\btoday\b/i.test(e.body)) dateHow = '"today", the email\'s date';
  else if (subjDate) { date = /\d{4}/.test(subjDate.raw) ? subjDate.iso : `${sent.slice(0, 4)}${subjDate.iso.slice(4)}`; dateHow = `"${subjDate.raw}" in the subject`; }
  const topics = uniq(F.sessions.map(s => s.topic));
  const t = norm(text); const f = fields(e.body);
  const topic = topics.find(x => t.includes(norm(x))) || topics.find(x => t.includes(norm(x.split(' ')[0])) && norm(x).split(' ').length === 1) || (f.topic ? f.topic.replace(/\s*\(.*\)$/, '').replace(/^./, s => s.toUpperCase()) : 'Not given');
  const grab = (startRe, stopRe) => { const i = lines.findIndex(l => startRe.test(l)); if (i < 0) return ''; const out = [lines[i].replace(startRe, '').trim()]; for (let j = i + 1; j < lines.length && !stopRe.test(lines[j]); j++) out.push(lines[j].trim()); return out.join(' ').replace(/\s+/g, ' ').trim(); };
  let notes = grab(/^\s*(private )?notes?:\s*/i, /^\s*(actions?:|next session|mentor \d|$)/i);
  const masked = []; notes = notes.replace(/\+?\d[\d ]{7,}\d/g, () => { masked.push('a phone number'); return '[phone removed]'; }).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, () => { masked.push('an email address'); return '[email removed]'; });
  const ai = lines.findIndex(l => /^\s*actions?:/i.test(l)); const actions = []; if (ai >= 0) for (let j = ai + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) actions.push(lines[j].replace(/^\s*-\s+/, '').trim());
  const nd = datesIn(nextLine, date)[0]; const tm = (nextLine.match(/\b(\d{1,2}):(\d{2})\b/) || []);
  const next = nd ? `${nd.iso} ${tm[0] ? tm[0].padStart(5, '0') : '10:00'}` : null;
  const follows = mentor && c && (mentor.company_ids || []).includes(c.id);
  const realMentor = c ? F.mentors.find(m => (m.company_ids || []).includes(c.id)) : null;
  const prog = c ? ix(F.programmes, c.programme_id) : null;
  const lastNotes = priv && c ? F.sessions.filter(s => s.company_id === c.id && s.notes).sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const stop = next ? (() => { const [d, hm] = next.split(' '); const [h, mi] = hm.split(':').map(Number); return `${d} ${String(h + 1).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00`; })() : null;
  const calls = [call('aih.session', 'create', { vals_list: [{ programme_id: prog?.odoo?.id ?? false, company_id: c?.odoo?.id ?? false, mentor_id: mentor?.odoo?.id ?? '<mentor not found>', kind, date, topic, notes: [notes, actions.length ? `Actions: ${actions.join('; ')}` : ''].filter(Boolean).join('\n') || false, is_published: true, simulated: true }] }, 'The session. Date, kind and topic are public, as for every session; notes stay in the private field.')];
  if (next) calls.push(call('calendar.event', 'create', { vals_list: [{ name: `Mentoring: ${c ? base(c.name) : 'company'} with ${mentor ? base(mentor.name) : 'mentor'}`, start: `${next}:00`, stop, partner_ids: [[6, 0, [mentor?.odoo?.id ?? '<mentor>']]], description: actions.length ? `Actions from ${date}: ${actions.join('; ')}` : false }], context: { no_mail_to_attendees: true } }, 'The next session in the calendar, with no invitation sent.', NEEDS_APP('Calendar'), { outside: OUTSIDE }));
  return {
    summary: `${kind.replace(/_/g, '-')} on ${longDate(date)}${c ? ` with ${base(c.name)}` : ''}; topic "${topic}"; ${actions.length} action(s)${next ? `; next session ${longDate(next)}` : ''}.`,
    extracted: [['Mentor', mentor ? `${mentor.name} (${mentor.kind === 'guest' ? 'guest' : 'one-to-one'})` : `${e.from.name}: not a mentor in Odoo`], ['Company', c ? `${c.name}, ${prog ? base(prog.name) : 'no programme'}` : 'not found'], ['Date', longDate(date), dateHow], ['Kind', kind.replace(/_/g, '-')], ['Topic', topic, topics.includes(topic) ? 'matched to the topics already in Odoo' : 'new topic'], ['Private notes', notes || 'none', masked.length ? `masked: ${masked.join(', ')}` : 'kept private'], ['Actions', actions.join('; ') || 'none'], ['Next session', next ? `${longDate(next)}, ${next.slice(11)}` : 'not given', nextLine.trim()]],
    groups: [{ title: 'Who follows this company', note: 'From aih.programme.company and the mentor\'s companies in Odoo.', items: [{ name: realMentor ? realMentor.name : 'No mentor in Odoo', sim: realMentor?.simulated, score: null, reasons: [follows ? `${base(mentor.name)} is this company's mentor: the session is logged directly` : `${mentor ? base(mentor.name) : 'The sender'} is not this company's mentor${realMentor ? ` (${base(realMentor.name)} is)` : ''}: a person confirms before it is logged`], flag: follows ? '' : 'Check' }] }],
    drafts: [{ label: 'Receipt to the mentor', to: `${e.from.name} <${e.from.email}>`, subject: `Logged: ${base(c?.name || 'your session')}, ${longDate(date)}`, body: [`Thank you, ${base(e.from.name)}.`, '', `Logged: ${kind.replace(/_/g, '-')} with ${c ? c.name : 'the company'} on ${longDate(date)}, topic "${topic}".`, notes ? 'Your notes are kept private: only the Algarve Evolution team can read them.' : '', masked.length ? `We removed ${masked.join(' and ')} from the notes before saving.` : '', next ? `Next session: ${longDate(next)} at ${next.slice(11)} (no invitation sent yet).` : '', '', SIGN].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n') }],
    checks: [chk('Log the session', follows ? 'allowed' : 'approval', follows ? 'The mentor follows this company.' : 'The mentor does not follow this company in Odoo: a person confirms.'), chk('Keep notes private', 'allowed', 'Only the notes field, which the public feed never carries.'), ...(masked.length ? [chk(`Save ${masked.join(' and ')} found in the notes`, 'refused', 'Masked before saving: contact details belong on the contact, with consent.')] : []), ...(next ? [chk('Put the next session in the calendar', 'allowed', 'Created with no_mail_to_attendees.'), chk('Send calendar invitations', 'approval', 'Outbound: a person sends them.')] : []), chk('Send the receipt', 'approval', 'Outbound email.')],
    calls,
    privateNotes: priv ? [{ title: 'Private feed: the last notes for this company', lines: [lastNotes ? `${longDate(lastNotes.date)} (${lastNotes.topic}): ${lastNotes.notes}` : 'No earlier private notes in Odoo.'] }] : [],
    plan: { title: `Session: ${c ? base(c.name) : 'company'} with ${mentor ? base(mentor.name) : 'mentor'}, ${date}`, refs: [c?.id, mentor?.id].filter(Boolean) },
  };
}

function runChallenge(input, { F, priv, ref, vocab }) {
  const e = parseEmail(input); const text = `${e.subject}\n${e.body}`; const today = e.date || ref;
  const c = nameIn(text, F.companies); const org = c ? null : orgsIn(text, e.from.name)[0] || null;
  const paras = e.body.split(/\n\s*\n/).map(p => p.trim()).filter(p => p && !/^(hello|hi|dear|thank|best|regards)\b/i.test(p) && !/^\S+ \d+ \(simulated\)$/.test(p) && !/^(Founder|Person) /.test(p));
  const problem = paras.filter(p => !/^what we need/i.test(p) && !/budget|by the end|deadline/i.test(p) && !/^\s*-/.test(p)).slice(0, 2).join(' ').replace(/\s+/g, ' ').replace(/[^.?!]*\b(cost|budget|price)\b[^.?!]*[.?!]/gi, '').trim();
  const bullets = e.body.split('\n').filter(l => /^\s*-\s+/.test(l)).map(l => l.replace(/^\s*-\s+/, '').trim());
  const reqs = bullets.length ? bullets : (e.body.match(/[^.?!]*\b(need|must|should|could somebody)\b[^.?!]*[.?!]/gi) || []).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => !/\b(cost|budget|price|pay)\b/i.test(x));
  const skills = detect(text, SKILL_RULES).filter(s => vocab.has(s.key)); const want = skills.map(s => s.key);
  const budget = moneyIn(text); const dl = datesIn(text, today).find(d => d.iso > today);
  const town = findTown(text) || (c ? { town: c.town, raw: `${c.name}'s town` } : null);
  const title = e.subject.replace(/^(re|fwd?):\s*/i, '').replace(/^help with (our )?/i, '').replace(/^./, s => s.toUpperCase());
  const gaps = [!budget && 'What budget range do you have in mind? Even a rough range helps suppliers answer.', !dl && 'By when do you need it?', !want.length && 'What skills does it need? We could not tell from the email.', !town && 'Where is the work?', reqs.length < 2 && 'What would "done" look like? Two or three requirements help suppliers price it.'].filter(Boolean);
  const scored = F.suppliers.map(s => {
    const sh = want.filter(k => s.capabilities.includes(k)); const sk = want.length ? 50 * sh.length / want.length : 25;
    const tw = town && norm(s.town) === norm(town.town) ? 20 : inAlgarve(s.town) ? 10 : 0;
    const score = Math.round((sk + tw + 15) * 10) / 10;
    return { s, score, sh, why: [want.length ? `Skills: ${sh.length} of ${want.length} wanted (${sh.join(', ') || 'none'}) (+${Math.round(sk * 10) / 10})` : 'Skills: none listed, so half marks (+25)', tw === 20 ? `Town: same town, ${s.town} (+20)` : tw ? `Town: elsewhere in the Algarve, ${s.town} (+10)` : `Town: outside the Algarve, ${s.town} (+0)`, 'Budget: no price until they apply, so half marks (+15)'] };
  }).filter(x => x.sh.length).sort((a, b) => b.score - a.score);
  const top = scored.filter(x => x.s.consent !== false).slice(0, 3); const held = priv ? scored.filter(x => x.s.consent === false) : [];
  const owner = c ? c.name : org || e.from.name;
  const draft = { name: `${title} (simulated)`, company_id: c?.odoo?.id ?? false, org_name: c ? false : (org || e.from.name), town: town?.town || false, problem, requirements: reqs.join('\n'), skill_ids: skillIds(want), budget_eur_min: budget?.min ?? false, budget_eur_max: budget?.max ?? false, deadline: dl?.iso ?? false, state: 'open', is_published: false, simulated: true };
  const confirm = [`Dear ${base(e.from.name)},`, '', 'Thank you. Here is your problem written as a Challenge Connect challenge. Please correct anything that is wrong; nothing is published until you confirm.', '',
    `Title: ${title}`, `Posted by: ${owner}`, `Town: ${town?.town || '(please tell us)'}`, `Problem: ${problem}`, 'Requirements:', ...(reqs.length ? reqs.map(r => `- ${r}`) : ['- (please tell us)']), `Skills: ${want.join(', ') || '(please tell us)'}`, `Budget: ${budget ? `${eur(budget.min)} to ${eur(budget.max)}` : '(please tell us)'}`, `Deadline: ${dl ? longDate(dl.iso) : '(please tell us)'}`, '',
    ...(gaps.length ? ['Before we publish, a few questions:', ...gaps.map(g => `- ${g}`), ''] : []), top.length ? `Once it is published, we will invite ${top.length} supplier${top.length === 1 ? '' : 's'} who fit to apply; the matching result ranks every application.` : '', '', SIGN].join('\n');
  const notices = top.map(x => ({ label: `Notice to ${base(x.s.name)} (after approval)`, to: `${x.s.name}${priv && x.s.contact ? ` <${x.s.contact}>` : ' (email in Odoo, private)'}`, subject: `New challenge on Challenge Connect: ${title}`, body: ['Hello,', '', `A new challenge fits your skills (${x.sh.join(', ')}): "${title}", in ${town?.town || 'the Algarve'}${budget ? `, budget ${eur(budget.min)} to ${eur(budget.max)}` : ''}${dl ? `, by ${longDate(dl.iso)}` : ''}.`, 'You can read it and apply on Challenge Connect: /challenge-connect/', '', SIGN].join('\n') }));
  return {
    summary: `Challenge drafted for ${base(owner)}: ${want.length} skill(s), ${budget ? 'budget found' : 'no budget'}, ${dl ? 'deadline found' : 'no deadline'}; ${gaps.length} question(s) for the owner; top ${top.length} suppliers ready to notify after approval.`,
    extracted: [['From', `${e.from.name} <${e.from.email}>`], ['Posted by', c ? `${c.name} (programme company)` : `${owner} (not a programme company)`], ['Title', title], ['Problem', problem || '(not clear)'], ['Requirements', reqs.join('; ') || 'none found', bullets.length ? 'the bullet list' : 'sentences with "need", "must" or "should"'], ['Skills', want.join(', ') || 'none recognised', skills.map(s => `"${s.hit}"`).join(', ')], ['Budget', budget ? `${eur(budget.min)} to ${eur(budget.max)}` : 'not given', budget ? `"${budget.raw}"` : ''], ['Deadline', dl ? longDate(dl.iso) : 'not given', dl ? `"${dl.raw}"` : ''], ['Town', town?.town || 'not given', town ? `"${town.raw}"` : '']],
    groups: [{ title: 'Likely matches, with Odoo\'s own rule', note: 'The addon\'s score (aih.application): skills 50, town 20, budget 30. Before anyone applies there is no price, so budget gets half marks for all.', items: top.map(x => ({ name: x.s.name, sim: x.s.simulated, score: x.score, reasons: x.why, meta: `${x.s.kind === 'company' ? 'Company' : 'Individual'} · ${x.s.town} · ${x.s.rate || ''}` })) },
      ...(held.length ? [{ title: 'Would match, but no consent', note: 'Never notified.', private: true, items: held.map(x => ({ name: x.s.name, sim: x.s.simulated, score: x.score, reasons: x.why, flag: 'No consent' })) }] : []),
      ...(gaps.length ? [{ title: 'Missing: the cell asks, it does not guess', items: gaps.map(g => ({ name: g, score: null, reasons: [] })) }] : [])],
    drafts: [{ label: 'To the owner: confirm the draft', to: `${e.from.name} <${e.from.email}>`, subject: `Your challenge, as a draft: ${title}`, body: confirm }, ...notices],
    checks: [chk('Create the challenge, unpublished', 'allowed', 'aih.challenge create with is_published false.'), chk('Publish it', 'approval', 'The owner confirms the draft first.'), chk(`Notify ${top.length} supplier(s)`, 'approval', 'Only after it is published, and a person approves.'), ...(held.length ? [chk('Notify suppliers without consent', 'refused', `${held.length} held back.`)] : []), ...(gaps.length ? [chk('Fill in missing budget or deadline', 'refused', 'The cell asks the owner; it never invents them.')] : [])],
    calls: [call('aih.challenge', 'create', { vals_list: [draft] }, 'The challenge draft, unpublished.'), call('aih.challenge', 'write', { ids: ['<id from call 1>'], vals: { is_published: true } }, 'After the owner confirms: publish it.', '', { later: 'A later step: after the owner confirms the draft. Not in this plan item.' }), call('aih.challenge', 'action_compute_matches', { ids: ['<id from call 1>'] }, 'Once suppliers apply: score and rank every application.', '', { later: 'A later step: once suppliers have applied. Not in this plan item.' })],
    plan: { title: `Challenge draft from ${base(owner)}: ${title}`, refs: [c?.id, ...top.map(x => x.s.id)].filter(Boolean) },
  };
}

function runVibathon(input, { F, priv, ref }) {
  const p = parseCSV(input); const H = p.head;
  const k = { name: col(H, 'name', 'nome'), email: col(H, 'email'), role: col(H, 'join as', 'perfil', 'role'), town: col(H, 'town', 'concelho'), dir: col(H, 'directory', 'diretorio', 'list me'), photo: col(H, 'photo', 'foto') };
  const vib = [...F.vibathons].filter(v => v.date >= ref).sort((a, b) => a.date.localeCompare(b.date))[0] || F.vibathons[F.vibathons.length - 1];
  const already = new Map((vib.participants || []).map(x => [norm(x.email), x]));
  const roleOf = r => { const n = norm(r); return /develop|programad|engineer|data scien|builder/.test(n) ? 'builder' : /design/.test(n) ? 'designer' : /business|market|negocio|product|sales|gestor/.test(n) ? 'business' : 'other'; };
  const seen = new Set(); const rows = []; const add = []; const partners = [];
  p.rows.forEach((r, i) => {
    const email = String(r[k.email] || '').trim().toLowerCase(); const name = r[k.name]; const dir = consentOf(r[k.dir]); const role = roleOf(r[k.role]);
    const talent = F.talent.find(t => sameName(t.name, name));
    let status, note2;
    if (!validEmail(email)) { status = 'held'; note2 = `Email "${r[k.email]}" is not valid: held for a person`; }
    else if (seen.has(email)) { status = 'skip'; note2 = 'Duplicate of an earlier row in the sheet (same email, other case or spaces)'; }
    else if (already.has(email)) { status = 'skip'; note2 = 'Already registered in Odoo (private feed)'; }
    else { status = 'ok'; note2 = talent ? `New participant; already in the Talent Ecosystem as ${talent.name}, so linked, not duplicated` : 'New participant'; }
    if (validEmail(email)) seen.add(email);
    if (status === 'ok') { add.push({ vibathon_id: vib.odoo.id, name, email, role, ...(talent ? { partner_id: talent.odoo.id } : {}) }); if (dir === 'yes' && !talent) partners.push({ name, email, city: r[k.town] || false, aih_talent_kind: 'professional', aih_consent: true, aih_published: false, aih_simulated: true }); }
    rows.push({ cells: [String(i + 2), name, priv ? email || r[k.email] : mask(email || r[k.email]), `${r[k.role] || ''} → ${role}`, dir === 'yes' ? 'yes' : dir === 'no' ? 'no' : 'not answered', k.photo ? (consentOf(r[k.photo]) || 'not answered') : 'not asked'], status, note: note2 });
  });
  const noPhoto = k.photo ? p.rows.filter(r => consentOf(r[k.photo]) === 'no').length : 0;
  const conf = { label: `Confirmation to ${add.length} new participant(s)`, to: add.map(a => a.name).join('; '), subject: `You are registered: ${base(vib.name)}, ${longDate(vib.date)}`, body: ['Hello {first name},', '', `You are registered for ${vib.name} on ${longDate(vib.date)} at ${vib.venue}, as {role}.`, 'We will send the programme a week before.', '{if directory = yes} You asked to be listed in the hub directory: our team will review your listing before it is published.', '{if directory not answered} You can ask us at any time to list you in the hub directory.', '', SIGN].join('\n') };
  const calls = [];
  if (add.length) calls.push(call('aih.vibathon.participant', 'create', { vals_list: add }, `${add.length} new participant(s). Emails stay in the private feed.`), call('aih.vibathon', 'write', { ids: [vib.odoo.id], vals: { registrations: vib.registrations + add.length } }, `Registrations from ${vib.registrations} to ${vib.registrations + add.length}.`));
  if (partners.length) calls.push(call('res.partner', 'create', { vals_list: partners }, 'Only people who said yes to the directory, unpublished until reviewed.'));
  const held = rows.filter(r => r.status === 'held').length, dups = rows.filter(r => r.status === 'skip').length;
  return {
    summary: `${p.rows.length} rows: ${add.length} new, ${dups} duplicate(s) or already registered, ${held} held; ${partners.length} directory listing(s) proposed.`,
    extracted: [['Sheet', `${p.rows.length} rows, "${p.delim}" separated, columns: ${H.join(', ')}`], ['Vibathon', `${vib.name}, ${longDate(vib.date)}, ${vib.venue} (${vib.registrations} registered in Odoo)`], ['Dedupe against Odoo', priv ? `${already.size} participants already registered (private feed)` : 'Participants are private: open the private feed as the Algarve Evolution team to check them too. Talent names are checked from the public feed.']],
    tables: [{ title: 'Rows', head: ['Row', 'Name', priv ? 'Email' : 'Email (masked)', 'Role → Odoo', 'Directory', 'Photos'], rows, note: 'Roles map to Odoo\'s selection: builder, designer, business, other.' + (noPhoto ? ` ${noPhoto} person(s) said no to photos: the addon has no field for it, so the cell adds a note for the organisers (proposal: a field on aih.vibathon.participant).` : '') }],
    drafts: [conf], calls,
    checks: [chk(`Register ${add.length} participant(s)`, 'allowed', 'aih.vibathon.participant create.'), chk('Send the confirmation', 'approval', 'Outbound email: one approval for the batch.'), chk('List people who did not say yes', 'refused', `${p.rows.filter(r => consentOf(r[k.dir]) !== 'yes').length} not listed.`), ...(held ? [chk(`Register ${held} row(s) with an invalid email`, 'refused', 'Held for a person to fix.')] : []), ...(priv ? [] : [chk('Dedupe against registered participants', 'approval', 'Needs the private feed; in production the cell runs with the staff grant.')])],
    plan: { title: `${base(vib.name)}: register ${add.length} sign-up(s)`, refs: [vib.id] },
  };
}

function runReport(input, { F }) {
  const e = parseEmail(input); const text = `${e.subject}\n${e.body}`;
  const ds = datesIn(text, '2000-01-01').filter(d => !d.monthOnly);
  const deadlineD = ds.find(d => /\b(by|before)\s*$/i.test(text.slice(Math.max(0, d.i - 10), d.i)));
  const period = ds.filter(d => d !== deadlineD).slice(0, 2).map(d => d.iso).sort();
  const pS = period[0], pE = period[1] || period[0];
  const progs = /acceleration/i.test(text) && !/incubation/i.test(text) ? F.programmes.filter(p => p.kind === 'acceleration') : /incubation/i.test(text) && !/acceleration/i.test(text) ? F.programmes.filter(p => p.kind === 'incubation') : F.programmes;
  const wantsPersonal = /names? and (their )?e-?mail|e-?mail addresses|list of participants|participant list|contact details/i.test(text);
  const monthIdx = (p, iso) => Math.max(0, Math.min(p.months, (Number(iso.slice(0, 4)) - Number(p.start.slice(0, 4))) * 12 + Number(iso.slice(5, 7)) - Number(p.start.slice(5, 7))));
  const coIds = progs.flatMap(p => p.company_ids);
  const sess = F.sessions.filter(s => progs.some(p => p.id === s.programme_id) && s.date >= pS && s.date <= pE);
  const byKind = k => sess.filter(s => s.kind === k).length;
  let jobsA = 0, jobsB = 0, revA = 0, revB = 0, fund = 0, nK = 0; const ms = [];
  for (const p of progs) { const a = monthIdx(p, pS), b = monthIdx(p, pE); ms.push(`${base(p.name)}: month ${a} to month ${b}`);
    for (const id of p.company_ids) { const ka = F.kpis.find(k => k.company_id === id && k.month === a), kb = F.kpis.find(k => k.company_id === id && k.month === b); if (!ka || !kb) continue; nK++; jobsA += ka.team_size; jobsB += kb.team_size; revA += ka.revenue_eur; revB += kb.revenue_eur; fund += Math.max(0, kb.funding_eur - ka.funding_eur); } }
  const evs = F.events.filter(ev => ev.start.slice(0, 10) >= pS && ev.start.slice(0, 10) <= pE).sort((a, b) => a.start.localeCompare(b.start));
  const vibs = F.vibathons.filter(v => v.date >= pS && v.date <= pE);
  const asked = { women: /women|female|gender/i.test(text), events: /events?/i.test(text) };
  const rowsF = [
    ['Companies supported', String(coIds.length), 'aih.programme.company', 'simulated'],
    ['Mentoring sessions (one-to-one, clinic, workshop)', `${sess.length} (${byKind('one_to_one')}, ${byKind('clinic')}, ${byKind('workshop')})`, 'aih.session', 'simulated'],
    ['Jobs at the start and the end', `${jobsA} → ${jobsB}`, `aih.kpi (${nK} companies with both months)`, 'simulated'],
    ['Monthly revenue at the start and the end', `${eur(revA)} → ${eur(revB)}`, 'aih.kpi', 'simulated'],
    ['Funding raised in the period', eur(fund), 'aih.kpi (rise in cumulative funding)', 'simulated'],
    ...(asked.events ? [['Algarve Evolution events in the period', String(evs.length), 'event.event (all events, not only the programme\'s)', 'real, algarveevolution.pt'], ['Vibathon registrations in the period', vibs.length ? String(vibs.reduce((a, v) => a + v.registrations, 0)) : '0 (no Vibathon in the period)', 'aih.vibathon', 'simulated'], ['Event participants', 'not in Odoo\'s feed: a gap', 'event.registration is not exported', 'gap']] : []),
    ...(asked.women ? [['Companies led by women', 'not recorded in Odoo: a gap', 'no field in the addon', 'gap']] : []),
  ];
  const gaps = rowsF.filter(r => r[3] === 'gap');
  const csv = ['Figure,Value,Period,Odoo source,Data'].concat(rowsF.map(r => [r[0], r[1], `${pS} to ${pE}`, r[2], r[3]].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))).join('\n');
  const report = [`Dear ${base(e.from.name)},`, '', `Here are the figures for ${progs.map(p => base(p.name)).join(' and ')}, ${longDate(pS)} to ${longDate(pE)}, from Algarve Evolution's Odoo. A spreadsheet with the same figures is attached.`, '', ...rowsF.map(r => `- ${r[0]}: ${r[1]}`), '',
    gaps.length ? `Not recorded in Odoo, so not estimated: ${gaps.map(g => g[0].toLowerCase()).join('; ')}. We can start recording ${gaps.length === 1 ? 'it' : 'them'} if you need ${gaps.length === 1 ? 'it' : 'them'} for the next report.` : '', wantsPersonal ? 'You also asked for a list of participants with names and email addresses. We cannot share personal data without a legal basis and the people\'s consent; we can send aggregates, or forward your survey to participants ourselves.' : '', '', 'Kind regards,', SIGN].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  return {
    summary: `${rowsF.length} figures for ${longDate(pS)} to ${longDate(pE)}; ${gaps.length} gap(s) named, none estimated${wantsPersonal ? '; the request for personal data refused' : ''}.`,
    extracted: [['From', `${e.from.name} <${e.from.email}>`], ['Period', `${longDate(pS)} to ${longDate(pE)}`, period.join(' and ')], ['Programme', progs.map(p => base(p.name)).join(', ')], ['KPI months used', ms.join('; ')], ['Deadline', deadlineD ? longDate(deadlineD.iso) : 'not given'], ['Personal data asked', wantsPersonal ? 'yes: refused' : 'no']],
    tables: [{ title: 'Figures, each with its Odoo source', head: ['Figure', 'Value', 'Odoo source', 'Data'], rows: rowsF.map(r => ({ cells: r, status: r[3] === 'gap' ? 'held' : 'ok', note: '' })), note: 'Every figure from the programme is simulated, because the programme data in this Odoo is invented. Events are real.' },
      ...(evs.length ? [{ title: `Events in the period (${evs.length}, the first 6)`, head: ['Date', 'Event', 'Source'], rows: evs.slice(0, 6).map(ev => ({ cells: [longDate(ev.start), ev.name, ev.source], status: 'ok', note: '', link: 2 })) }] : [])],
    drafts: [{ label: 'Report to send', to: `${e.from.name} <${e.from.email}>`, subject: `Re: ${e.subject}`, body: report }],
    files: [{ name: `report-${pS}-to-${pE}.csv`, type: 'text/csv', text: csv }],
    checks: [chk('Aggregate figures from Odoo', 'allowed', 'Read only.'), chk('Send figures built from simulated data', 'approval', 'Simulated: never send to a real funder. With real data in Odoo, a person checks and sends.'), chk('Estimate figures Odoo does not hold', 'refused', gaps.length ? `${gaps.length} gap(s) named instead.` : 'No gaps.'), ...(wantsPersonal ? [chk('Send names and email addresses of participants', 'refused', 'Personal data: no legal basis or consent for this use.')] : []), chk('Send the report', 'approval', 'Outbound email.')],
    calls: [call('ir.attachment', 'create', { vals_list: [{ name: `report-${pS}-to-${pE}.csv`, res_model: 'aih.programme', res_id: progs[0].odoo.id, type: 'binary', mimetype: 'text/csv', datas: '<base64 of the spreadsheet>' }] }, 'Keep the report with the programme record in Odoo.', '', { outside: OUTSIDE })],
    plan: { title: `Report for ${base(e.from.name)}: ${longDate(pS)} to ${longDate(pE)}`, refs: progs.map(p => p.id) },
  };
}

function runDigest(input, { F, ref }) {
  const f = fields(input);
  const start = (String(f['week starting'] || '').match(/\d{4}-\d{2}-\d{2}/) || [])[0] || ref;
  const days = Number((String(f['look ahead'] || '').match(/\d+/) || [14])[0]); const end = addDays(start, days);
  const evs = F.events.filter(ev => ev.start.slice(0, 10) >= start && ev.start.slice(0, 10) < end).sort((a, b) => a.start.localeCompare(b.start));
  const vib = [...F.vibathons].filter(v => v.date >= start).sort((a, b) => a.date.localeCompare(b.date))[0];
  const chs = F.challenges.filter(c => OPEN.has(c.status) && c.deadline >= start).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const prog = F.programmes.find(p => p.status === 'running');
  const lines = input.split('\n'); const ei = lines.findIndex(l => /items that arrived/i.test(l));
  const extras = ei >= 0 ? lines.slice(ei + 1).filter(l => /^\s*-\s+/.test(l)).map(l => l.replace(/^\s*-\s+/, '').trim()).filter(l => !/^none\b/i.test(l)) : [];
  const time = s => s.slice(11, 16);
  const place = p => (String(p).split(',').map(x => x.trim()).find(x => x && !/^[0-9A-Z]{4,}\+[0-9A-Z]+$/.test(x)) || 'place to be confirmed').replace(/^[A-Z]+$/, w => w[0] + w.slice(1).toLowerCase()).replace(/\b([A-Z]{2,}(?: [A-Z&()]{2,})+)\b/g, m => m.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()));
  const body = [`This week at the AE Innovation Hub (${longDate(start)})`, '',
    'EVENTS', ...(evs.length ? evs.map(ev => `- ${longDate(ev.start)}, ${time(ev.start)}: ${ev.name.replace(/\.+$/, '')} (${place(ev.place)}). ${ev.url}`) : ['- No events in Odoo for these dates.']), '',
    ...(chs.length ? ['CHALLENGE CONNECT: OPEN CHALLENGES', ...chs.map(c => `- ${base(c.title)}, until ${longDate(c.deadline)}: /challenge-connect/#challenge-${c.id}`), ''] : []),
    ...(vib ? ['NEXT VIBATHON', `- ${base(vib.name)}, ${longDate(vib.date)}, ${vib.venue.replace(/\s*\(simulated venue\)/, '')}: /vibathon/`, ''] : []),
    ...(prog ? ['PROGRAMMES', `- ${base(prog.name)}: ${prog.company_ids.length} companies, until ${longDate(prog.end)}.`, ''] : []),
    ...(extras.length ? ['FROM THE COMMUNITY (to check before sending)', ...extras.map(x => `- ${x}`), ''] : []),
    'You receive this because you subscribed. Unsubscribe: {unsubscribe link}', SIGN].join('\n');
  return {
    summary: `${evs.length} event(s), ${chs.length} open challenge(s)${vib ? ', the next Vibathon' : ''} and ${extras.length} item(s) to check, from ${longDate(start)} to ${longDate(addDays(end, -1))}.`,
    extracted: [['Week starting', longDate(start)], ['Look ahead', `${days} days, to ${longDate(addDays(end, -1))}`], ['Audience', f.audience || 'the opt-in list'], ['Items from email', extras.length ? `${extras.length}, not in Odoo` : 'none']],
    groups: [{ title: 'From Odoo: events (real, published on algarveevolution.pt)', note: 'Read from event.event in the feed, each with its source page.', items: evs.map(ev => ({ name: ev.name, score: null, reasons: [`${longDate(ev.start)}, ${time(ev.start)} to ${time(ev.end)}`, ev.place], href: ev.source, ext: true })) },
      ...(extras.length ? [{ title: 'Not in Odoo: a person checks', items: extras.map(x => ({ name: x, score: null, flag: /job|asks us/i.test(x) ? 'Personal request' : 'Unverified', reasons: [/job|asks us/i.test(x) ? 'A request from a person: share only if they agree and staff approve' : 'Arrived by email: check it and add it to Odoo, then it is a normal item'] })) }] : [])],
    drafts: [{ label: 'Newsletter draft', to: f.audience || 'The opt-in mailing list', subject: `This week at the AE Innovation Hub: ${evs.length} event${evs.length === 1 ? '' : 's'}${chs.length ? `, ${chs.length} open challenge${chs.length === 1 ? '' : 's'}` : ''}`, body }],
    checks: [chk('Use published records only', 'allowed', 'Events, challenges, Vibathons and programmes from the public feed.'), chk('Link every real event to its source', 'allowed', `${evs.length} event page(s) on algarveevolution.pt.`), ...extras.map(x => chk(`Include "${x.slice(0, 60)}${x.length > 60 ? '...' : ''}"`, 'approval', 'Not in Odoo: a person checks it.')), chk('Send the digest', 'approval', 'Outbound email to a list: a person approves.'), chk('Send to anyone outside the opt-in list', 'refused', 'Only subscribers.')],
    calls: [call('mailing.mailing', 'create', { vals_list: [{ subject: `This week at the AE Innovation Hub (${longDate(start)})`, mailing_model_id: '<id of the mailing.list model>', contact_list_ids: [[6, 0, ['<id of the opt-in list>']]], body_html: `<p>${esc(body).replace(/\n/g, '<br>')}</p>`, state: 'draft' }] }, 'The digest as a draft mailing: nothing is sent until a person presses Send.', NEEDS_APP('Email Marketing'), { outside: OUTSIDE })],
    plan: { title: `Weekly digest, ${longDate(start)}`, refs: [...evs.map(ev => ev.id), ...chs.map(c => c.id), vib?.id].filter(Boolean) },
  };
}

function runImport(input, { F, priv }) {
  const p = parseCSV(input); const H = p.head;
  const k = { name: col(H, 'name', 'nome'), email: col(H, 'email'), town: col(H, 'town', 'concelho'), tags: col(H, 'interest', 'interesses', 'tags'), consent: col(H, 'consent', 'consentimento'), com: col(H, 'community', 'comunidade') };
  const comNames = uniq(p.rows.map(r => r[k.com]));
  const coms = comNames.map(n => ({ name: n, rec: F.communities.find(c => sameName(c.name, n)) }));
  const seen = new Set(); const rows = []; const create = []; const ask = []; let dropped = 0;
  p.rows.forEach((r, i) => {
    const email = String(r[k.email] || '').trim().toLowerCase(); const name = r[k.name]; const consent = consentOf(r[k.consent]);
    const existing = F.talent.find(t => sameName(t.name, name));
    let status, why;
    if (!validEmail(email)) { status = 'refused'; why = `Email "${r[k.email]}" is not valid: held for a person`; }
    else if (seen.has(email)) { status = 'skip'; why = 'Duplicate of an earlier row'; }
    else if (existing) { status = 'skip'; why = `Already in Odoo as ${existing.name}${existing.consent ? '' : ' (no consent recorded)'}: not duplicated`; }
    else if (consent === 'no') { status = 'refused'; why = 'Said no: dropped, only counted'; dropped++; }
    else if (!consent) { status = 'held'; why = 'Not asked: a consent request is drafted; nothing goes into Odoo yet'; ask.push({ name, email }); }
    else { status = 'ok'; why = 'Consent yes: proposed as a contact, unpublished'; const com = coms.find(c => c.name === r[k.com]); create.push({ name, email, city: r[k.town] || false, aih_talent_kind: 'professional', aih_community_id: com?.rec ? com.rec.odoo.id : '<id from call 1>', aih_consent: true, aih_published: false, aih_simulated: true, category_id: [[6, 0, String(r[k.tags] || '').split(/[,;]/).map(x => x.trim()).filter(Boolean).map(x => `<res.partner.category: ${x}>`)]] }); }
    if (validEmail(email)) seen.add(email);
    rows.push({ cells: [String(i + 2), name, priv ? email || r[k.email] : mask(email || r[k.email]), r[k.town] || '', r[k.tags] || '', consent || 'not asked'], status, note: why });
  });
  const newComs = coms.filter(c => !c.rec);
  const towns = p.rows.map(r => r[k.town]).filter(Boolean); const topTown = towns.sort((a, b) => towns.filter(x => x === b).length - towns.filter(x => x === a).length)[0];
  const calls = [...newComs.map(c => call('aih.community', 'create', { vals_list: [{ name: c.name, municipality: topTown || false, kind: 'informal group', is_published: false, simulated: true }] }, 'A community not yet in Odoo, unpublished until reviewed.')),
    ...(create.length ? [call('res.partner', 'create', { vals_list: create }, `${create.length} people who said yes, unpublished until Algarve Evolution reviews them.`)] : [])];
  return {
    summary: `${p.rows.length} rows: ${create.length} to import, ${ask.length} to ask for consent, ${dropped} dropped (said no), ${rows.filter(r => r.status === 'skip').length} duplicate(s), ${rows.filter(r => r.status === 'refused').length - dropped} invalid.`,
    extracted: [['Sheet', `${p.rows.length} rows, "${p.delim}" separated, columns: ${H.join(', ')}`], ['Community', coms.map(c => `${c.name}: ${c.rec ? 'in Odoo' : 'not in Odoo, proposed'}`).join('; ')], ['Dedupe', priv ? 'against every talent record, with or without consent (private feed)' : 'against talent with consent (public feed); the private feed also checks people without consent']],
    groups: coms.filter(c => c.rec).map(c => ({ title: 'Community in Odoo', items: [{ name: c.rec.name, sim: c.rec.simulated, score: null, reasons: [`${c.rec.kind}, ${c.rec.municipality}`], href: c.rec.source, ext: true }] })),
    tables: [{ title: 'Rows', head: ['Row', 'Name', priv ? 'Email' : 'Email (masked)', 'Town', 'Interests', 'Consent'], rows }],
    drafts: ask.length ? [{ label: `Consent request to ${ask.length} person(s)`, to: ask.map(a => a.name).join('; '), subject: 'May we list you in the AE Innovation Hub?', body: ['Hello {first name},', '', `${coms[0]?.name || 'Your community'} shared its member list with Algarve Evolution so that its members can join the Algarve Digital Innovators network in the AE Innovation Hub.`, 'We have not added you. Would you like to be listed? Reply yes, and tell us what you work on. If we do not hear from you, we delete your details from the list in 30 days.', '', SIGN].join('\n') }] : [],
    checks: [chk(`Import ${create.length} person(s) who said yes`, 'allowed', 'Unpublished; staff review before anything is public.'), chk(`Import ${dropped} person(s) who said no`, dropped ? 'refused' : 'allowed', dropped ? 'Dropped; only the count is kept.' : 'Nobody said no.'), chk(`Ask ${ask.length} person(s) for consent`, ask.length ? 'approval' : 'allowed', ask.length ? 'Outbound email: a person approves.' : 'Nobody to ask.'), ...(newComs.length ? [chk(`Create the community "${newComs[0].name}"`, 'allowed', 'Unpublished.')] : []), chk('Publish anyone', 'approval', 'Staff checks each listing first.')],
    calls, plan: { title: `Member list (${coms.map(c => c.name).join(', ')}): import ${create.length}, ask ${ask.length}`, refs: coms.filter(c => c.rec).map(c => c.rec.id) },
  };
}

export const RUN = { 'supplier-intro': runSupplier, 'expert-finder': runExpert, membership: runMembership, 'kpi-collection': runKpi, 'session-notes': runSession, 'challenge-intake': runChallenge, 'vibathon-signups': runVibathon, 'funder-report': runReport, 'weekly-digest': runDigest, 'community-import': runImport };
export function context(F, { priv = false, data = {} } = {}) {
  const vocab = new Set([...F.suppliers.flatMap(s => s.capabilities), ...F.challenges.flatMap(c => c.skills)]);
  return { F, priv, ref: String(F.meta?.exported || '2026-11-16').slice(0, 10), data, vocab };
}

// ------------------------------------------------------------------ the browser: render a result, wire the panels
export const VERDICT = { allowed: ['Allowed', 'tag-ok'], approval: ['Needs approval', 'tag-warn'], refused: ['Refused', 'tag-accent'] };
const scoreHtml = v => (v == null ? '' : `<span class="wf-score" aria-label="Score ${v} of 100"><b>${esc(v)}</b><span class="wf-score-of">/100</span><span class="wf-bar" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span></span>`);
const simB = on => (on ? ' <span class="sim-badge" title="Invented for the prototype">Simulated</span>' : '');
// With the plan queue on the page, the cell adds its calls as one item with its policy (the button under the
// panels), so hub.js's per-panel button is switched off for these panels (data-plan="off").
const hasPlan = () => typeof window !== 'undefined' && !!window.HUB?.plan?.add;
const callPanel = (c, i, n) => `<details class="odoo-call"${hasPlan() ? ' data-plan="off"' : ''}${i === 0 ? ' open' : ''}><summary><span class="odoo-call-verb">POST</span> <code>/json/2/${esc(c.model)}/${esc(c.method)}</code> <span class="odoo-call-flag">${c.outside ? 'outside the plan' : c.later ? 'a later step' : 'not sent: prototype'}</span></summary>${c.why ? `<p class="odoo-call-note">${n > 1 ? `${i + 1} of ${n}. ` : ''}${esc(c.why)}</p>` : ''}${c.outside || c.later ? `<p class="odoo-call-note wf-call-warn">${esc(c.outside || c.later)}</p>` : ''}<pre tabindex="0"><code>${esc(JSON.stringify(c.body, null, 2))}</code></pre>${c.note ? `<p class="odoo-call-note wf-call-warn">${esc(c.note)}</p>` : ''}</details>`;
const draftHtml = d => `<article class="wf-draft"><header class="wf-draft-head"><p class="wf-draft-label">${esc(d.label)} <span class="wf-draft-flag">Draft · not sent</span></p><dl><div><dt>To</dt><dd>${esc(d.to)}</dd></div><div><dt>Subject</dt><dd>${esc(d.subject)}</dd></div></dl></header><pre class="wf-draft-body" tabindex="0">${esc(d.body)}</pre></article>`;
const itemHtml = it => `<li class="wf-match${it.flag ? ' is-flag' : ''}"><div class="wf-match-top"><p class="wf-match-name">${it.href ? `<a href="${esc(it.href)}"${it.ext ? ' rel="noopener"' : ''}>${esc(it.name)}</a>` : esc(it.name)}${simB(it.sim)}${it.flag ? ` <span class="tag tag-warn">${esc(it.flag)}</span>` : ''}</p>${scoreHtml(it.score)}</div>${it.meta ? `<p class="wf-match-meta">${esc(it.meta)}</p>` : ''}${it.reasons?.length ? `<ul class="wf-reasons">${it.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li>`;
const STATUS = { ok: ['Proposed', 'tag-ok'], held: ['Held', 'tag-warn'], skip: ['Skipped', ''], refused: ['Refused', 'tag-accent'] };
const tableHtml = t => `<div class="wf-table"><p class="wf-sub">${esc(t.title)}</p><div class="hub-table-wrap"><table class="hub-table wf-tbl"><thead><tr>${t.head.map(x => `<th scope="col">${esc(x)}</th>`).join('')}<th scope="col">Result</th></tr></thead><tbody>${t.rows.map(r => `<tr class="is-${esc(r.status)}">${r.cells.map((c, i) => `<td data-th="${esc(t.head[i])}">${r.link === i ? `<a href="${esc(c)}" rel="noopener">source</a>` : esc(c)}</td>`).join('')}<td data-th="Result"><span class="tag ${STATUS[r.status]?.[1] || ''}">${STATUS[r.status]?.[0] || esc(r.status)}</span>${r.note ? `<span class="wf-row-note">${esc(r.note)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>${t.note ? `<p class="wf-small">${esc(t.note)}</p>` : ''}</div>`;

export function renderResult(cell, r, priv) {
  let k = 0; const h = t => `<h4 class="wf-res-h"><span>${++k}</span>${esc(t)}</h4>`;
  const counts = Object.fromEntries(Object.keys(VERDICT).map(v => [v, r.checks.filter(c => c.v === v).length]));
  const plan = hasPlan(); const ready = r.calls.filter(c => !c.later && !c.outside).length; const groups = (r.groups || []).filter(g => g.items.length);
  return `<div class="wf-res-head"><h3 class="wf-res-title" tabindex="-1">What the cell did</h3><p class="wf-res-sum">${esc(r.summary)}</p>
<p class="wf-res-meta">Ran in this browser with transparent rules on the ${priv ? '<strong>private feed</strong> (Algarve Evolution team)' : 'public feed'}. No model was called and nothing was sent. In production a model drafts, and the policy checks every step.</p></div>
<div class="wf-res-grid${groups.length ? '' : ' is-single'}">
<section class="wf-res-block">${h('Extracted from the input')}<dl class="wf-ex">${r.extracted.map(([a, b, how]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}${how ? `<span class="wf-rule">read from ${esc(how)}</span>` : ''}</dd></div>`).join('')}</dl></section>
${groups.length ? `<section class="wf-res-block">${h('Looked up in Odoo')}${groups.map(g => `<div class="wf-group${g.private ? ' persona-panel persona-panel-private' : ''}">${g.private ? '<p class="persona-panel-head">Private feed</p>' : ''}<p class="wf-sub">${esc(g.title)}</p>${g.note ? `<p class="wf-small">${esc(g.note)}</p>` : ''}<ol class="wf-matches">${g.items.map(itemHtml).join('')}</ol></div>`).join('')}</section>` : ''}
</div>
${(r.tables || []).length ? `<section class="wf-res-block">${h('Checked against Odoo')}${r.tables.map(tableHtml).join('')}</section>` : ''}
${r.drafts?.length ? `<section class="wf-res-block">${h(`Drafts (${r.drafts.length})`)}<div class="wf-drafts">${draftHtml(r.drafts[0])}${r.drafts.length > 1 ? `<details class="wf-more"><summary>${r.drafts.length - 1} more draft${r.drafts.length > 2 ? 's' : ''}</summary>${r.drafts.slice(1).map(draftHtml).join('')}</details>` : ''}</div></section>` : ''}
${r.files?.length ? `<p class="wf-files">${r.files.map((f, i) => `<button type="button" class="btn btn-sm" data-file="${i}">Save ${esc(f.name)}</button>`).join(' ')} <span class="wf-small">Made in this browser; nothing is uploaded.</span></p>` : ''}
${(r.privateNotes || []).map(p => `<div class="persona-panel persona-panel-private wf-private"><p class="persona-panel-head">${esc(p.title)}</p>${p.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`).join('')}
<div class="wf-res-grid wf-res-grid-b">
<section class="wf-res-block">${h('Policy check')}<p class="wf-counts"><span class="tag tag-ok">${counts.allowed} allowed</span> <span class="tag tag-warn">${counts.approval} need approval</span> <span class="tag tag-accent">${counts.refused} refused</span></p><ul class="wf-checks">${r.checks.map(c => `<li class="wf-check is-${c.v}"><span class="tag ${VERDICT[c.v][1]}">${VERDICT[c.v][0]}</span><div><p class="wf-check-rule">${esc(c.rule)}</p>${c.note ? `<p class="wf-check-note">${esc(c.note)}</p>` : ''}</div></li>`).join('')}</ul></section>
<section class="wf-res-block">${h(`Odoo calls it proposes (${r.calls.length})`)}${r.calls.length ? `<div class="wf-calls">${r.calls.map((c, i) => callPanel(c, i, r.calls.length)).join('')}</div>
${!plan ? '<p class="wf-small">The plan queue is not on this page yet: each call above is its own panel.</p>' : ready ? `<div class="wf-plan"><button type="button" class="btn btn-primary btn-sm" data-wf-plan aria-pressed="false">Add to the plan</button> <span class="wf-plan-msg" data-plan-msg role="status"></span></div><p class="wf-small wf-broker" data-broker></p>` : '<p class="wf-small">Nothing for the plan queue: every call here is a later step or outside what the plan broker may write. A person does these in Odoo.</p>'}` : '<p class="wf-small">No Odoo call: nothing to write.</p>'}</section>
</div>`;
}

export function planItem(cell, r) {
  return {
    source: `workflow:${cell.id}`, title: r.plan?.title || cell.title,
    calls: r.calls.filter(c => !c.later && !c.outside).map(c => ({ method: 'POST', path: `/json/2/${c.model}/${c.method}`, body: c.body })),
    policy: { agent: `cell:${cell.id}`, grant: cell.policy.grant, mandate: cell.policy.mandate, checks: r.checks.map(c => ({ rule: c.rule, ok: c.v !== 'refused', verdict: c.v, note: c.v === 'refused' ? `Refused: held back, not in this plan. ${c.note}` : c.note })), needs_approval: r.checks.some(c => c.v === 'approval') },
    refs: uniq(r.plan?.refs || []),
  };
}

// The "Add to the plan" button says whether this result's calls are already in the plan (it toggles them).
function planState(art) {
  const btn = art.querySelector('[data-wf-plan]'); const msg = art.querySelector('[data-plan-msg]'); const r = art._result?.();
  if (!btn || !r || !hasPlan()) return;
  const cell = CELLS.find(c => c.id === art.dataset.cell); const item = planItem(cell, r);
  const id = window.HUB.plan.find(item.calls, item.source); const n = window.HUB.plan.list().length;
  btn.setAttribute('aria-pressed', String(!!id)); btn.textContent = id ? 'In the plan: remove' : `Add ${item.calls.length === 1 ? 'this call' : `these ${item.calls.length} calls`} to the plan`;
  const pp = typeof globalThis !== 'undefined' && globalThis.PlanPolicy; const bx = art.querySelector('[data-broker]');
  if (pp && bx) { const ck = pp.checkItem(item); const bad = ck.checks.filter(c => !c.ok); bx.textContent = bad.length ? `The plan broker's policy would refuse ${bad.length} check(s): ${bad.slice(0, 2).map(c => c.note).join(' ')}` : `The plan broker's own policy (the one the Plan page and the broker run): all ${ck.checks.length} checks pass for ${item.calls.length} call${item.calls.length === 1 ? '' : 's'}.`; }
  msg.innerHTML = id ? `One item from workflow:${esc(cell.id)}, with its policy checks${n > 1 ? `, among ${n} in your plan` : ''}. Kept in this browser until the team reviews and signs it. <a href="/v2/plan/#queue">Review the plan</a>` : `Nothing is sent: the calls go to the plan queue as one item, with the cell's policy checks, for the Algarve Evolution team to review and sign.`;
}
async function boot() {
  const D = JSON.parse(document.getElementById('wf-data')?.textContent || '{}');
  const H = window.HUB;
  const pub = await (H ? H.publicFeed() : fetch('/feeds/public.json').then(x => x.json()));
  const current = () => (H?.persona === 'staff' && H?.privateFeed ? { F: H.privateFeed, priv: true } : { F: pub, priv: false });
  const ran = new Set(); const runners = {};
  document.querySelectorAll('[data-cell]').forEach(art => {
    const id = art.dataset.cell; const cell = CELLS.find(c => c.id === id); if (!cell) return;
    const ta = art.querySelector('[data-input]'); const out = art.querySelector('[data-out]'); const msg = art.querySelector('[data-try-msg]');
    let result = null;
    const run = (focus = true) => {
      if (!ta.value.trim()) { msg.textContent = 'Paste an input or pick a sample first.'; return; }
      const { F, priv } = current();
      try { result = RUN[id](ta.value, context(F, { priv, data: D })); }
      catch (err) { out.hidden = false; out.innerHTML = `<p class="wf-error">The rules could not read this input (${esc(err.message)}). Try one of the samples, or keep its shape: email headers then a blank line, or a header row for a sheet.</p>`; return; }
      out.innerHTML = renderResult(cell, result, priv); out.hidden = false; ran.add(id); msg.textContent = ''; planState(art);
      if (focus) out.querySelector('.wf-res-title')?.focus();
    };
    runners[id] = run; art._result = () => result;
    art.querySelector('[data-run]').addEventListener('click', () => run());
    art.querySelector('[data-clear]')?.addEventListener('click', () => { ta.value = ''; out.hidden = true; out.innerHTML = ''; ran.delete(id); art.querySelectorAll('[data-sample]').forEach(b => b.setAttribute('aria-pressed', 'false')); ta.focus(); });
    art.querySelectorAll('[data-sample]').forEach(b => b.addEventListener('click', async () => {
      try { const t = await fetch(`/hub/workflows/${b.dataset.sample}`).then(x => { if (!x.ok) throw new Error(x.status); return x.text(); }); ta.value = t.trim(); }
      catch { msg.textContent = 'That sample could not be loaded.'; return; }
      art.querySelectorAll('[data-sample]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); run(false);
    }));
    out.addEventListener('click', ev => {
      const pb = ev.target.closest('[data-wf-plan]'); const fb = ev.target.closest('[data-file]');
      if (pb && result && hasPlan()) {
        const item = planItem(cell, result); const id = window.HUB.plan.find(item.calls, item.source);
        if (id) window.HUB.plan.remove(id); else window.HUB.plan.add(item);
        planState(art);
      }
      if (fb && result) { const f = result.files[Number(fb.dataset.file)]; const url = URL.createObjectURL(new Blob([f.text], { type: f.type })); const a = Object.assign(document.createElement('a'), { href: url, download: f.name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    });
  });
  // The staff persona with the private feed changes what the cells can see: run again the ones already run.
  let lastPriv = current().priv;
  const refresh = () => { const p = current().priv; if (p === lastPriv) return; lastPriv = p; ran.forEach(id => runners[id]?.(false)); };
  H?.on('private', refresh); H?.on('persona', refresh);
  H?.plan?.on?.(() => document.querySelectorAll('[data-cell]').forEach(planState));
  document.body.classList.add('wf-ready');
}
if (typeof document !== 'undefined' && document.querySelector('[data-cell]')) boot();
