# Seed the AE Innovation Hub (Algarve Evolution Innovation Hub) Odoo database. Re-runnable: every record is
# found by its feed id and updated, never duplicated.
#
# Run inside an Odoo shell (scripts/odoo/setup-local.sh does this):
#   AIH_REPO=<repo> odoo shell -c <conf> -d algarve_innovation_hub --no-http < scripts/odoo/seed.py
#
# Real, public data (each record keeps its source URL):
#   - organisations and communities: scripts/odoo/seed/real-public.json
#     (extracted from PrompTugal.news by-place data by extract-real-seed.mjs)
#   - Algarve Evolution's ecosystem partners: src/data/ecosystem.json
#   - events: src/data/odoo.json (read from algarveevolution.pt, their public Odoo)
# Everything else is SIMULATED: invented for the prototype, flagged simulated=True,
# and named so it cannot be mistaken for a real person or company
# ("Person 07 (simulated)", "Startup 03 (simulated)").
# Written by odoo@AgentiCCells.dinis. Apache-2.0.
import json
import os
import random
import statistics
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

REPO = os.environ.get('AIH_REPO') or os.getcwd()
rnd = random.Random(20261116)  # fixed seed: the simulation is the same on every run
SIM = ' (simulated)'
EX = 'example.invalid'  # never a real mail domain


def load(rel):
    with open(os.path.join(REPO, rel), encoding='utf-8') as f:
        return json.load(f)


def upsert(model, key, vals, key_field='feed_key'):
    Model = env[model].with_context(active_test=False, tracking_disable=True, mail_create_nolog=True)
    rec = Model.search([(key_field, '=', key)], limit=1)
    vals = dict(vals, **{key_field: key})
    if rec:
        rec.write(vals)
    else:
        rec = Model.create(vals)
    return rec


def partner(key, vals):
    return upsert('res.partner', key, vals, key_field='aih_feed_key')


def skills(*names):
    ids = []
    for n in names:
        s = env['aih.skill'].search([('name', '=', n)], limit=1) or env['aih.skill'].create({'name': n})
        ids.append(s.id)
    return [(6, 0, ids)]


def tags(*names):
    ids = []
    for n in names:
        if not n:
            continue
        c = env['res.partner.category'].search([('name', '=', n)], limit=1) or env['res.partner.category'].create({'name': n})
        ids.append(c.id)
    return [(6, 0, ids)]


counts = {}


def count(k, n=1):
    counts[k] = counts.get(k, 0) + n


# ---------------------------------------------------------------- the hub's name
# "AE INNOVATION HUB", as António Guerreiro wrote it on his whiteboard (16 November 2026).
# The addon's data file creates the record; the seed keeps its name right if someone changed it.
hub = env.ref('algarve_innovation_hub.hub_main', raise_if_not_found=False) or env['aih.hub'].search([], limit=1)
HUB = {'name': 'AE Innovation Hub', 'full_name': 'Algarve Evolution Innovation Hub'}
if hub:
    hub.write(HUB)
else:
    env['aih.hub'].create(HUB)

# ---------------------------------------------------------------- real: communities
real = load('scripts/odoo/seed/real-public.json')
eco = load('src/data/ecosystem.json')
ae_odoo = load('src/data/odoo.json')

community = {}
for c in real['communities']:
    rec = upsert('aih.community', c['key'], {
        'name': c['name'], 'municipality': c['municipality'], 'kind': c['kind'],
        'summary': c['summary'], 'url': c['url'], 'source_url': c['source'],
        'simulated': False, 'is_published': True,
    })
    community[c['key']] = rec
    count('communities (real)')
# Grow Algarve Meetup: organised by Algarve Evolution; member count as its source states.
grow = next(n for n in eco['nodes'] if n['id'] == 'grow')
rec = upsert('aih.community', 'com-grow-algarve-meetup', {
    'name': grow['label'], 'municipality': 'Algarve (region)', 'kind': 'meetup group',
    'members': 1623, 'summary': grow['note'], 'url': eco['sources'][grow['src']]['url'],
    'source_url': eco['sources'][grow['src']]['url'], 'simulated': False, 'is_published': True,
})
community[rec.feed_key] = rec
count('communities (real)')

# ---------------------------------------------------------------- real: talent (organisations)
TALENT_COMMUNITY_KIND = {'community': 'community', 'developer group': 'community', 'coworking': 'community',
                         'meetup group': 'community', 'informal group': 'informal_group'}
for key, rec in community.items():
    kind = TALENT_COMMUNITY_KIND.get(rec.kind)
    if not kind or 'GDG Lagos' in rec.name:  # GDG Lagos is listed below as an ecosystem partner
        continue
    partner('t-' + key, {
        'name': rec.name, 'is_company': True, 'city': None if '(region)' in rec.municipality else rec.municipality,
        'aih_talent_kind': kind, 'aih_community_id': rec.id, 'aih_summary': rec.summary,
        'aih_source_url': rec.source_url, 'website': rec.url, 'aih_simulated': False,
        'aih_published': True, 'aih_consent': False, 'category_id': tags('Community', rec.kind.title()),
    })
    count('talent (real organisations)')

PARTNER_TOWN = {'ualg': 'Faro', 'stp': 'Faro', 'amal': 'Faro', 'nera': 'Loulé', 'gdg': 'Lagos'}
for n in eco['nodes']:
    if n['kind'] != 'partner':
        continue
    partner('t-eco-' + n['id'], {
        'name': n['label'], 'is_company': True, 'city': PARTNER_TOWN.get(n['id']),
        'aih_talent_kind': 'partner', 'aih_summary': n['note'],
        'aih_source_url': eco['sources'][n['src']]['url'], 'aih_simulated': False,
        'aih_published': True, 'aih_consent': False, 'category_id': tags('Project partner'),
    })
    count('talent (real organisations)')

ALREADY_PARTNERS = ('universidade do algarve (ualg)', 'algarve stp', 'nera,')
for o in real['organisations']:
    if o['name'].lower().startswith(ALREADY_PARTNERS):
        continue
    partner('t-' + o['key'], {
        'name': o['name'], 'is_company': True, 'city': o['town'],
        'aih_talent_kind': 'stakeholder', 'aih_summary': o['summary'], 'website': o['url'],
        'aih_source_url': o['source'], 'aih_simulated': False, 'aih_published': True, 'aih_consent': False,
        'category_id': tags('Stakeholder', o['type'].title()),
    })
    count('talent (real organisations)')

# ---------------------------------------------------------------- real: events
lisbon, utc = ZoneInfo('Europe/Lisbon'), ZoneInfo('UTC')


def to_utc(s):
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=lisbon)
    return dt.astimezone(utc).replace(tzinfo=None)


for e in ae_odoo['events']:
    start = to_utc(e['start'])
    end = to_utc(e['end']) if e.get('end') else start + timedelta(hours=2)
    if end <= start:
        end = start + timedelta(hours=2)
    upsert('event.event', 'ev-' + e['id'], {
        'name': e['name'], 'date_begin': start, 'date_end': end, 'date_tz': e.get('tz') or 'Europe/Lisbon',
        'aih_place': e.get('place'), 'aih_url': e['url'], 'aih_source_url': e['url'],
        'aih_simulated': False, 'aih_published': True,
    }, key_field='aih_feed_key')
    count('events (real)')

# ================================================================ SIMULATED from here on
TOWNS = ['Faro', 'Loulé', 'Olhão', 'Tavira', 'Lagos', 'Portimão', 'Albufeira', 'Silves', 'Lagoa']
SKILLS = ['AI and machine learning', 'Data engineering', 'Web development', 'Mobile apps', 'UX design',
          'Cloud and DevOps', 'Cybersecurity', 'IoT and sensors', 'Marketing', 'Sales', 'Finance and fundraising',
          'Legal and IP', 'Tourism tech', 'Agritech', 'Blue economy', 'Product management', 'E-commerce',
          'Robotics', 'Sustainability', 'Chatbots']
real_communities = [r for r in community.values() if r.kind in ('community', 'developer group', 'coworking', 'informal group')]

# ---------------------------------------------------------------- mentors
mentors = {}
MENTOR_EXPERTISE = [
    ('Product management', 'UX design'), ('Finance and fundraising', 'Sales'), ('AI and machine learning', 'Data engineering'),
    ('Marketing', 'E-commerce'), ('Tourism tech', 'Sales'), ('Cloud and DevOps', 'Cybersecurity'),
    ('Blue economy', 'Sustainability'), ('Agritech', 'IoT and sensors'),
    ('Legal and IP',), ('Finance and fundraising',), ('UX design', 'Product management'), ('Chatbots', 'AI and machine learning'),
]
for i in range(1, 13):
    kind = 'one_to_one' if i <= 8 else 'guest'
    consent = i != 12  # Mentor 12 has not agreed to be listed: absent from the public feed
    mentors[i] = partner(f'p-mentor-{i:02d}', {
        'name': f'Mentor {i:02d}{SIM}', 'is_company': False, 'city': TOWNS[i % len(TOWNS)],
        'email': f'mentor{i:02d}@{EX}',
        'aih_is_mentor': True, 'aih_mentor_kind': kind, 'aih_expertise_ids': skills(*MENTOR_EXPERTISE[i - 1]),
        'aih_talent_kind': 'mentor', 'aih_consent': consent, 'aih_published': True, 'aih_simulated': True,
        'aih_summary': ('One-to-one mentor' if kind == 'one_to_one' else 'Guest mentor for clinics and workshops')
                       + ' in ' + ', '.join(MENTOR_EXPERTISE[i - 1]).lower() + '. Invented for the prototype.',
        'category_id': tags('Mentor', MENTOR_EXPERTISE[i - 1][0]),
    })
    count('mentors (simulated)')

# ---------------------------------------------------------------- programmes and companies
COMPANIES = [
    # (n, tagline, sector, town, stage)
    (1, 'AI booking assistant for guesthouses', 'Tourism tech', 'Faro', 'seed'),
    (2, 'Sensors for shellfish farms in the Ria Formosa', 'Blue economy', 'Olhão', 'pre_seed'),
    (3, 'Irrigation planning for citrus growers', 'Agritech', 'Silves', 'seed'),
    (4, 'Accessible walking-trail guides', 'Tourism tech', 'Monchique', 'idea'),
    (5, 'Local food marketplace for restaurants', 'E-commerce', 'Loulé', 'pre_seed'),
    (6, 'Energy dashboards for small hotels', 'Sustainability', 'Albufeira', 'seed'),
    (7, 'Language tutor app for seasonal workers', 'Edtech', 'Portimão', 'idea'),
    (8, 'Boat maintenance scheduling', 'Marine services', 'Lagos', 'pre_seed'),
    (9, 'Cork-based packaging design studio', 'Circular economy', 'São Brás de Alportel', 'idea'),
    (10, 'Multilingual guest chatbot for hotels', 'AI', 'Lagoa', 'early_revenue'),
    (11, 'Drone surveys of coastal erosion', 'Geospatial', 'Vila do Bispo', 'seed'),
    (12, 'Water-use analytics for golf courses', 'Sustainability', 'Loulé', 'early_revenue'),
    (13, 'Telehealth triage for rural clinics', 'Health tech', 'Tavira', 'seed'),
    (14, 'Demand forecasting for restaurants', 'AI', 'Faro', 'early_revenue'),
    (15, 'Booking platform for cycling tour operators', 'Tourism tech', 'Lagos', 'growth'),
    (16, 'Fish auction price data service', 'Blue economy', 'Portimão', 'seed'),
    (17, 'Co-living bookings for remote workers', 'Proptech', 'Aljezur', 'early_revenue'),
    (18, 'Cleaning robots for solar farms', 'Robotics', 'Castro Marim', 'seed'),
    (19, 'Online shop builder for craft makers', 'E-commerce', 'Vila Real de Santo António', 'growth'),
]
PROGRAMMES = [
    ('prog-inc-2026', 'incubation', 'Algarve Incubation Programme, 2026 cohort' + SIM, '2026-A',
     '2026-04-01', '2026-09-30', 'finished', range(1, 10),
     'Six months of incubation for idea and pre-seed teams: one mentor per company, monthly one-to-ones, '
     'guest clinics and workshops, and KPIs from month 0 to month 6. Invented for the prototype.'),
    ('prog-acc-2026', 'acceleration', 'Algarve Acceleration Programme, 2026 cohort' + SIM, '2026-B',
     '2026-07-01', '2026-12-31', 'running', range(10, 20),
     'Six months of acceleration for companies with first revenue: one mentor per company, investor clinics, '
     'and KPIs from month 0 to month 6 (month 4 so far). Invented for the prototype.'),
]
STAGE_ORDER = ['idea', 'prototype', 'mvp', 'launched', 'scaling']
START_PRODUCT = {'idea': 0, 'pre_seed': 1, 'seed': 2, 'early_revenue': 3, 'growth': 3}
REVENUE0 = {'idea': (0, 0), 'pre_seed': (0, 600), 'seed': (800, 4000), 'early_revenue': (4000, 12000), 'growth': (15000, 40000)}
companies, programmes = {}, {}
for key, kind, name, cohort, start, end, state, nums, summary in PROGRAMMES:
    prog = upsert('aih.programme', key, {
        'name': name, 'kind': kind, 'cohort': cohort, 'date_start': start, 'date_end': end, 'months': 6,
        'state': state, 'summary': summary, 'simulated': True, 'is_published': True,
    })
    programmes[key] = prog
    count('programmes (simulated)')
    for n, tagline, sector, town, stage in [c for c in COMPANIES if c[0] in nums]:
        mentor = mentors[((n - 1) % 8) + 1]
        companies[n] = upsert('aih.programme.company', f'co-{n:02d}', {
            'name': f'Startup {n:02d}{SIM}', 'programme_id': prog.id, 'sector': sector, 'town': town,
            'stage': stage, 'mentor_id': mentor.id, 'simulated': True,
            # Startup 17 has not yet agreed to be shown: unpublished, so absent from the public feed.
            'is_published': n != 17,
            'summary': f'{tagline}. Invented for the prototype.',
        })
        count('companies (simulated)')

# ---------------------------------------------------------------- sessions
TOPICS_1TO1 = ['Customer interviews', 'Pricing', 'Pitch deck', 'Hiring the first employee', 'Product roadmap',
               'Unit economics', 'Go-to-market plan', 'Funding options', 'Legal set-up', 'Metrics review']
CLINICS = [(9, 'clinic', 'Intellectual property clinic'), (10, 'clinic', 'Investor readiness clinic'),
           (11, 'workshop', 'Design sprint workshop'), (12, 'workshop', 'Building with AI assistants workshop'),
           (10, 'clinic', 'Grant applications clinic'), (11, 'workshop', 'User testing workshop')]
for key, prog in programmes.items():
    start = prog.date_start
    months = 6 if prog.state == 'finished' else 4
    guest_ids = set()
    for comp in prog.company_ids:
        n = int(comp.feed_key[3:])
        for m in range(months):
            d = start + timedelta(days=30 * m + 7 + (n % 10))
            upsert('aih.session', f'ses-{n:02d}-{m + 1}', {
                'programme_id': prog.id, 'company_id': comp.id, 'mentor_id': comp.mentor_id.id,
                'kind': 'one_to_one', 'date': d, 'topic': TOPICS_1TO1[(n + m) % len(TOPICS_1TO1)],
                'notes': f'Simulated private note: agreed two actions for month {m + 1}; next check-in in four weeks.',
                'simulated': True, 'is_published': True,
            })
            count('sessions (simulated)')
    for j, (mi, kind, topic) in enumerate(CLINICS[:5 if months == 6 else 4]):
        d = start + timedelta(days=30 * j + 20)
        upsert('aih.session', f'ses-{key[5:]}-g{j + 1}', {
            'programme_id': prog.id, 'company_id': False, 'mentor_id': mentors[mi].id, 'kind': kind, 'date': d,
            'topic': topic, 'notes': 'Simulated private note: attendance and follow-ups kept here.',
            'simulated': True, 'is_published': True,
        })
        guest_ids.add(mentors[mi].id)
        count('sessions (simulated)')
    prog.mentor_ids = [(6, 0, list(set(prog.company_ids.mentor_id.ids) | guest_ids))]

# ---------------------------------------------------------------- KPI snapshots (invented numbers)
kpi_rows = {}
for n, comp in companies.items():
    stage = comp.stage
    months = 6 if comp.programme_id.state == 'finished' else 4
    lo, hi = REVENUE0[stage]
    rev = float(rnd.randint(lo, hi)) if hi else 0.0
    cust = 0 if stage == 'idea' else rnd.randint(1, 8) * (10 if stage in ('early_revenue', 'growth') else 1)
    team = rnd.randint(1, 3) + (3 if stage == 'growth' else 0)
    funding = 0.0 if stage in ('idea', 'pre_seed') else float(rnd.choice([0, 10000, 25000, 50000]))
    prod = START_PRODUCT[stage]
    growth = rnd.uniform(0.02, 0.16)
    raise_month = rnd.choice([None, None, None, None, 3, 4, 5])
    rows = []
    for m in range(months + 1):
        if m:
            if rev == 0 and prod >= 2 and rnd.random() < 0.6:
                rev = float(rnd.randint(200, 900))
            else:
                rev = rev * (1 + growth + rnd.uniform(-0.05, 0.05))
            cust = int(round(cust * (1 + growth) + rnd.choice([0, 1, 1, 2]))) if prod >= 2 else cust
            if rnd.random() < 0.25:
                team += 1
            if m == raise_month:
                funding += float(rnd.choice([30000, 50000, 75000, 150000]))
            if rnd.random() < 0.35 and prod < 4:
                prod += 1
        rows.append((m, round(rev, -1), cust, team, funding, STAGE_ORDER[prod]))
        upsert('aih.kpi', f'kpi-{n:02d}-m{m}', {
            'company_id': comp.id, 'month': m, 'revenue_eur': round(rev, -1), 'customers': cust,
            'team_size': team, 'funding_eur': funding, 'product_stage': STAGE_ORDER[prod],
            'simulated': True, 'is_published': comp.is_published,
        })
        count('kpi snapshots (simulated)')
    kpi_rows[n] = rows

# ---------------------------------------------------------------- reflections (computed from the invented KPIs)


def reflect(prog, month):
    nums = [int(c.feed_key[3:]) for c in prog.company_ids]
    first = {n: kpi_rows[n][0] for n in nums}
    last = {n: kpi_rows[n][month] for n in nums}
    with_rev0 = [n for n in nums if first[n][1] > 0]
    growth = [last[n][1] / first[n][1] - 1 for n in with_rev0]
    new_rev = sum(1 for n in nums if first[n][1] == 0 and last[n][1] > 0)
    raised = sum(1 for n in nums if last[n][4] > first[n][4])
    team0, team1 = sum(first[n][3] for n in nums), sum(last[n][3] for n in nums)
    moved = sum(1 for n in nums if STAGE_ORDER.index(last[n][5]) > STAGE_ORDER.index(first[n][5]))
    med = statistics.median(growth) if growth else 0
    return (
        f'Simulated reflection, invented for the prototype, written from the simulated KPIs. '
        f'At month {month}, the {len(nums)} companies employ {team1} people (from {team0} at month 0). '
        f'Of the {len(with_rev0)} with revenue at entry, median monthly revenue grew {med:.0%}; '
        f'{new_rev} more made their first sale. {raised} raised new funding and {moved} moved their product '
        f'at least one stage. What we would ask next: are monthly revenue and customers the right indicators '
        f'for idea-stage teams, or should month 0 to 6 also count interviews and pilots? And which sessions '
        f'(one-to-one, clinic or workshop) came before the jumps?'
    )


upsert('aih.reflection', 'ref-inc-2026-m6', {'programme_id': programmes['prog-inc-2026'].id, 'month': 6,
       'text': reflect(programmes['prog-inc-2026'], 6), 'simulated': True, 'is_published': True})
upsert('aih.reflection', 'ref-acc-2026-m3', {'programme_id': programmes['prog-acc-2026'].id, 'month': 3,
       'text': reflect(programmes['prog-acc-2026'], 3), 'simulated': True, 'is_published': True})
count('reflections (simulated)', 2)

# ---------------------------------------------------------------- suppliers
suppliers = []
SUPPLIER_CAPS = [
    ('Web development', 'Cloud and DevOps', 'UX design'), ('Data engineering', 'Cloud and DevOps', 'AI and machine learning'),
    ('Marketing', 'UX design'), ('Cybersecurity', 'Cloud and DevOps'), ('Mobile apps', 'UX design', 'Web development'),
    ('IoT and sensors', 'Data engineering', 'Robotics'), ('AI and machine learning', 'Chatbots', 'Web development'),
    ('Legal and IP',), ('E-commerce', 'Web development', 'Marketing'),
]
for i, caps in enumerate(SUPPLIER_CAPS, start=1):
    suppliers.append(partner(f'p-supplier-co-{i:02d}', {
        'name': f'Supplier Co {i:02d}{SIM}', 'is_company': True, 'city': ['Faro', 'Loulé', 'Lisboa', 'Portimão', 'Lagos',
                                                                          'Olhão', 'Porto', 'Tavira', 'Albufeira'][i - 1],
        'email': f'hello@supplier{i:02d}.{EX}', 'aih_is_supplier': True, 'aih_capability_ids': skills(*caps),
        'aih_rate': f'{rnd.choice([400, 450, 500, 600, 650])} EUR a day', 'aih_consent': True, 'aih_published': True,
        'aih_simulated': True, 'aih_summary': 'Supplier company: ' + ', '.join(caps).lower() + '. Invented for the prototype.',
    }))
    count('suppliers (simulated)')
IND_CAPS = [('UX design', 'Product management'), ('Data engineering', 'AI and machine learning'), ('Marketing', 'Sales'),
            ('Mobile apps',), ('Cybersecurity', 'Legal and IP'), ('Web development', 'E-commerce'), ('IoT and sensors',)]
for j, caps in enumerate(IND_CAPS, start=41):
    suppliers.append(partner(f'p-person-{j:02d}', {
        'name': f'Person {j:02d}{SIM}', 'is_company': False, 'city': TOWNS[j % len(TOWNS)], 'email': f'person{j:02d}@{EX}',
        'phone': f'+351 900 000 0{j:02d}', 'aih_is_supplier': True, 'aih_capability_ids': skills(*caps),
        'aih_rate': f'{rnd.choice([35, 40, 50, 60])} EUR an hour', 'aih_consent': j <= 45, 'aih_published': True,
        'aih_simulated': True, 'aih_talent_kind': 'professional' if j % 2 else 'consultant', 'category_id': tags(*caps),
        'aih_summary': 'Individual professional: ' + ', '.join(caps).lower() + '. Invented for the prototype.',
    }))
    count('suppliers (simulated)')

# ---------------------------------------------------------------- challenges, applications, matches
CHALLENGES = [
    ('ch-01', 10, None, 'Connect the guest chatbot to three hotel booking systems',
     'Hotels use different property management systems; the chatbot cannot read bookings from them.',
     ['Read-only integration with three systems', 'Tested with two pilot hotels', 'Handover documentation'],
     ('Web development', 'AI and machine learning', 'Cloud and DevOps'), 6000, 12000, '2027-01-31', 'matching'),
    ('ch-02', 3, None, 'Sensor and satellite data pipeline for irrigation advice',
     'Field sensors and free satellite images arrive in different formats and are not combined.',
     ['Daily pipeline', 'Data stored in the EU', 'Simple dashboard for agronomists'],
     ('Data engineering', 'IoT and sensors', 'Cloud and DevOps'), 8000, 15000, '2026-12-15', 'matched'),
    ('ch-03', 6, None, 'Brand and website refresh for the hotel energy dashboard',
     'The current site does not explain the product to hotel owners.',
     ['New brand guide', 'Five-page website', 'Portuguese and English'],
     ('UX design', 'Marketing', 'Web development'), 3000, 6000, '2026-10-31', 'closed'),
    ('ch-04', 13, None, 'Security and data protection review before the first clinic pilot',
     'Health data needs a review before any patient uses the triage tool.',
     ['Threat model', 'Penetration test of the web app', 'GDPR checklist'],
     ('Cybersecurity', 'Legal and IP'), 4000, 9000, '2027-02-28', 'open'),
    ('ch-05', None, 'Restaurant association 01' + SIM, 'Mobile app for daily fish auction price alerts',
     'Restaurant owners want to know the morning auction prices before they plan the menu.',
     ['iOS and Android', 'Price alerts by species', 'Works on a weak signal'],
     ('Mobile apps', 'Data engineering', 'UX design'), 10000, 20000, '2027-03-31', 'matching'),
]
PROPOSALS = ['A fixed-price plan in three milestones.', 'A two-week discovery, then weekly releases.',
             'Reuse of an open-source base we maintain, to cut the cost.', 'A small team on site in the Algarve one day a week.',
             'A pilot first, then the full build if the pilot works.']
for key, cn, org, title, problem, reqs, sk, lo, hi, deadline, state in CHALLENGES:
    ch = upsert('aih.challenge', key, {
        'name': title + SIM, 'company_id': companies[cn].id if cn else False, 'org_name': org or False,
        'town': companies[cn].town if cn else 'Portimão', 'problem': problem + ' Invented for the prototype.',
        'requirements': '\n'.join(reqs), 'skill_ids': skills(*sk), 'budget_eur_min': lo, 'budget_eur_max': hi,
        'deadline': deadline, 'state': state, 'simulated': True, 'is_published': True,
        'decision': False, 'chosen_application_id': False,
    })
    count('challenges (simulated)')
    n_apps = rnd.randint(4, 8)
    wanted = set(ch.skill_ids.ids)
    # Suppliers whose capabilities fit tend to apply, but not only them.
    pool = sorted(suppliers, key=lambda s: -(len(wanted & set(s.aih_capability_ids.ids)) + rnd.uniform(0, 1.6)))
    keep = [f'app-{key[3:]}-{k}' for k in range(1, n_apps + 1)]
    ch.application_ids.filtered(lambda a: a.feed_key not in keep).unlink()
    for k, sup in enumerate(pool[:n_apps], start=1):
        price = round(rnd.uniform(lo * 0.6, hi * 1.4), -2)
        upsert('aih.application', f'app-{key[3:]}-{k}', {
            'challenge_id': ch.id, 'supplier_id': sup.id, 'proposal': rnd.choice(PROPOSALS) + ' Simulated.',
            'price_eur': price, 'days': rnd.choice([15, 20, 30, 45, 60]), 'simulated': True, 'is_published': True,
        })
        count('applications (simulated)')
    ch.action_compute_matches()
    ch.state = state  # keep the intended status after matching
    ranked = ch.application_ids.sorted('rank')
    if state == 'matched':  # the company chose, not always the top score
        ch.write({'decision': 'company', 'chosen_application_id': ranked[1 if len(ranked) > 1 else 0].id})
    elif state == 'closed':  # Algarve Evolution triaged and suggested a top 3; the first was chosen
        ch.write({'decision': 'ae_triage', 'chosen_application_id': ranked[0].id})

# ---------------------------------------------------------------- talent people (simulated)
people = {}
PEOPLE = []
for i in range(1, 11):
    PEOPLE.append((i, 'professional'))
for i in range(11, 16):
    PEOPLE.append((i, 'consultant'))
for i in range(16, 20):
    PEOPLE.append((i, 'investor'))
for i, kind in PEOPLE:
    sk = rnd.sample(SKILLS, 2)
    com = real_communities[i % len(real_communities)] if kind != 'investor' else False
    consent = i % 3 != 0  # every third person has not agreed: absent from the public feed
    people[i] = partner(f'p-person-{i:02d}', {
        'name': f'Person {i:02d}{SIM}', 'is_company': False, 'city': TOWNS[i % len(TOWNS)], 'email': f'person{i:02d}@{EX}',
        'aih_talent_kind': kind, 'aih_community_id': com.id if com else False, 'aih_consent': consent,
        'aih_published': i != 5,  # Person 05 is not published yet
        'aih_simulated': True, 'category_id': tags(*sk),
        'aih_summary': (f'{kind.title()} in {sk[0].lower()} and {sk[1].lower()}'
                        + (f'; a simulated member of {com.name}' if com else '; angel investor')
                        + '. Invented for the prototype.'),
    })
    count('talent people (simulated)')

# ---------------------------------------------------------------- vibathons
past = upsert('aih.vibathon', 'vib-2026-06', {
    'name': 'Blue Economy Build Day' + SIM, 'kind': 'hackathon', 'date': '2026-06-13',
    'venue': 'Faro (simulated venue)', 'town': 'Faro', 'registrations': 64,
    'summary': 'A one-day hackathon on ocean and coast problems, building with AI tools. Invented for the prototype.',
    'mentor_ids': [(6, 0, [mentors[3].id, mentors[7].id, mentors[12].id])],
    'next_steps': '\n'.join(['Top three teams invited to apply to the 2026 acceleration cohort',
                             'Mentor office hours for every team in July',
                             'Publish the projects on the hub site']),
    'simulated': True, 'is_published': True,
})
upcoming = upsert('aih.vibathon', 'vib-2027-02', {
    'name': 'Tourism and AI Workshop Day' + SIM, 'kind': 'workshop', 'date': '2027-02-20',
    'venue': 'Portimão (simulated venue)', 'town': 'Portimão', 'registrations': 37,
    'summary': 'Hands-on workshops for tourism businesses building their first AI assistant. Invented for the prototype.',
    'mentor_ids': [(6, 0, [mentors[5].id, mentors[12].id])], 'next_steps': False,
    'simulated': True, 'is_published': True,
})
count('vibathons (simulated)', 2)
for v in (past, upcoming):
    v.jury_ids.unlink()
    v.participant_ids.unlink()
jury = [(people[16], 'Investor'), (mentors[10], 'Investor readiness mentor'), (people[11], 'Consultant'), (people[18], 'Investor')]
for p, role in jury:
    env['aih.vibathon.jury'].create({'vibathon_id': past.id, 'partner_id': p.id, 'name': p.name, 'role': role + SIM})
for i in range(1, 25):
    p = people.get(i) if i <= 15 else None
    env['aih.vibathon.participant'].create({
        'vibathon_id': past.id, 'partner_id': p.id if p else False,
        'name': p.name if p else f'Participant {i:02d}{SIM}', 'email': f'participant{i:02d}@{EX}',
    })
for i in range(1, 9):
    env['aih.vibathon.participant'].create({'vibathon_id': upcoming.id, 'name': f'Registrant {i:02d}{SIM}',
                                            'email': f'registrant{i:02d}@{EX}'})
PROJECTS = [
    ('Tide-safe', 'Warns swimmers of strong currents from public buoy data.', 'Build a pilot with a beach concession'),
    ('Catch Log', 'A voice app for small-boat fishers to log their catch.', 'Test with three fishers in Olhão'),
    ('Reef Map', 'Maps artificial reefs from divers\' photos.', 'Find a dive school partner'),
    ('Salt Pan Guide', 'An audio guide to the salt pans, generated per visitor.', 'Apply to the incubation programme'),
    ('Marina Queue', 'Books fuel and pump-out slots at marinas.', 'Talk to two marinas'),
    ('Coast Watch', 'Citizen reports of erosion, checked against drone images.', 'Stopped: the team split up'),
]
CRITERIA = ['Problem', 'Prototype', 'Next step']
for k, (name, summary, nxt) in enumerate(PROJECTS, start=1):
    team = [people[(k * 2 + t) % 15 + 1].id for t in range(3)]
    proj = upsert('aih.project', f'prj-2026-06-{k}', {
        'vibathon_id': past.id, 'name': name + SIM, 'team_ids': [(6, 0, team)],
        'summary': summary + ' Invented for the prototype.', 'next_step': nxt,
        'prize': {1: 'First prize' + SIM, 2: 'Second prize' + SIM, 3: 'Third prize' + SIM}.get(k, False),
        'simulated': True, 'is_published': k != 6,  # the stopped project is not published
    })
    proj.score_ids.unlink()
    for p, _role in jury[:3]:
        for crit in CRITERIA:
            base_score = 9 - k * 0.8
            env['aih.project.score'].create({'project_id': proj.id, 'juror': p.name, 'criterion': crit,
                                             'score': round(max(1.0, min(10.0, base_score + rnd.uniform(-1, 1))), 1)})
    count('projects (simulated)')

env.cr.commit()
print('Seed done:', json.dumps(counts, sort_keys=True))
