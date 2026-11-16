# AE Innovation Hub (Algarve Evolution Innovation Hub): an Odoo 19 Community addon.
# Licence: LGPL-3 (see LICENSE in this folder). Written by odoo@AgentiCCells.dinis.
{
    'name': 'AE Innovation Hub',
    'version': '19.0.1.3.0',
    'summary': 'Programmes, Challenge Connect, Vibathons and the Talent Ecosystem, with public and private feeds',
    'description': """
AE Innovation Hub (prototype)
=============================

Odoo is the source of truth for the AE Innovation Hub MVP. This addon holds
its four activities:

* INC/ACC: incubation and acceleration programmes, their companies, mentors,
  mentoring sessions (one-to-one, clinic, workshop), monthly KPI snapshots
  (month 0 to 6) and programme reflections.
* Challenge Connect: challenges, suppliers, applications and ranked matches
  (skills overlap, town, budget fit, with reasons).
* Vibathon: hackathons and workshops, jury, projects, scores and next steps.
* Talent Ecosystem: communities (Algarve Digital Innovators), informal groups,
  professionals, consultants, mentors, investors, partners and stakeholders,
  with consent and published flags.

Writes from the hub go through a plan: a person approves and signs it on the
hub's Plan page, and scripts/odoo/apply-plan.mjs applies it with a dedicated
user in the "Plan broker" group (create and update hub records, no delete).

Every record carries a feed id, a published flag, a simulated flag and, for
real public data, a source URL. scripts/odoo/export-feeds.mjs reads these over the
Odoo 19 JSON-2 API and writes the public and private feeds.
""",
    'author': 'AgentiCCells (odoo@AgentiCCells.dinis)',
    'license': 'LGPL-3',
    'category': 'Services',
    'depends': ['base', 'mail', 'contacts', 'event'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/activities.xml',
        'views/inc_acc_views.xml',
        'views/challenge_views.xml',
        'views/vibathon_views.xml',
        'views/talent_views.xml',
        'views/menus.xml',
    ],
    'application': True,
    'installable': True,
}
