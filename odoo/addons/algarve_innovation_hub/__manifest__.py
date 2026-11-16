# Algarve Innovation Hub: an Odoo 19 Community addon.
# Licence: LGPL-3 (see LICENSE in this folder). Written by odoo@AgentiCCells.dinis.
{
    'name': 'Algarve Innovation Hub',
    'version': '19.0.1.0.0',
    'summary': 'Programmes, Challenge Connect, Vibathons and the Talent Ecosystem, with public and private feeds',
    'description': """
Algarve Innovation Hub (prototype)
==================================

Odoo is the source of truth for the Algarve Innovation Hub MVP. This addon holds
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

Every record carries a feed id, a published flag, a simulated flag and, for
real public data, a source URL. scripts/odoo/export-feeds.mjs reads these over
JSON-RPC and writes the public and private feeds.
""",
    'author': 'AgentiCCells (odoo@AgentiCCells.dinis)',
    'license': 'LGPL-3',
    'category': 'Services',
    'depends': ['base', 'contacts', 'event'],
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
