from odoo import fields, models

TALENT_KINDS = [
    ('community', 'Community'),
    ('informal_group', 'Informal group'),
    ('professional', 'Professional'),
    ('consultant', 'Consultant'),
    ('mentor', 'Mentor'),
    ('investor', 'Investor'),
    ('partner', 'Project partner'),
    ('stakeholder', 'Stakeholder'),
]


class AihCommunity(models.Model):
    """A community in the Algarve Digital Innovators network, or near it."""
    _name = 'aih.community'
    _inherit = ['aih.feed.mixin']
    _description = 'Community (Algarve Digital Innovators)'
    _order = 'municipality, name'

    name = fields.Char(required=True)
    municipality = fields.Char()
    kind = fields.Char(help='For example: developer group, community, coworking, project.')
    members = fields.Integer(help='Only when a source states it.')
    summary = fields.Text()
    url = fields.Char('Website')
    talent_ids = fields.One2many('res.partner', 'aih_community_id', string='Talent')


class ResPartner(models.Model):
    """People and organisations of the hub: mentors, suppliers and talent.

    The fields are prefixed with aih_ so they never clash with website modules that
    add their own is_published to contacts.
    """
    _inherit = 'res.partner'

    aih_feed_key = fields.Char('Hub feed id', index=True, copy=False)
    aih_published = fields.Boolean('Published in the hub', copy=False)
    aih_consent = fields.Boolean(
        'Consent to be listed', copy=False,
        help='A person appears in the public feed only with consent (and published).')
    aih_simulated = fields.Boolean('Simulated (hub)')
    aih_source_url = fields.Char('Hub source URL')
    aih_summary = fields.Text('Hub summary')

    aih_is_mentor = fields.Boolean('Mentor')
    aih_mentor_kind = fields.Selection([('one_to_one', 'One-to-one'), ('guest', 'Guest')], string='Mentor kind')
    aih_expertise_ids = fields.Many2many(
        'aih.skill', 'aih_partner_expertise_rel', 'partner_id', 'skill_id', string='Expertise')

    aih_is_supplier = fields.Boolean('Supplier')
    aih_capability_ids = fields.Many2many(
        'aih.skill', 'aih_partner_capability_rel', 'partner_id', 'skill_id', string='Capabilities')
    aih_rate = fields.Char('Rate', help='For example "45 EUR an hour".')

    aih_talent_kind = fields.Selection(TALENT_KINDS, string='Talent kind')
    aih_community_id = fields.Many2one('aih.community', string='Community')


class EventEvent(models.Model):
    _inherit = 'event.event'

    aih_feed_key = fields.Char('Hub feed id', index=True, copy=False)
    aih_published = fields.Boolean('Published in the hub', copy=False)
    aih_simulated = fields.Boolean('Simulated (hub)')
    aih_source_url = fields.Char('Hub source URL')
    aih_place = fields.Char('Place (as published)')
    aih_url = fields.Char('Event page')
