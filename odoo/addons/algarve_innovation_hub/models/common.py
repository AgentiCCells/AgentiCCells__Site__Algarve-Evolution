from odoo import fields, models


class AihFeedMixin(models.AbstractModel):
    """Fields every hub record carries so the exporter can write the feeds."""
    _name = 'aih.feed.mixin'
    _description = 'Innovation Hub feed fields'

    feed_key = fields.Char(
        'Feed id', index=True, copy=False,
        help='Stable id used in the exported feeds. Left empty, the exporter uses <prefix>-<database id>.')
    is_published = fields.Boolean(
        'Published', default=False, copy=False,
        help='Only published records go to the public feed.')
    simulated = fields.Boolean(
        'Simulated', default=False,
        help='Invented data for the prototype. It is marked "simulated" wherever it shows.')
    source_url = fields.Char('Source URL', help='Where real public data was read.')

    _feed_key_unique = models.Constraint('UNIQUE(feed_key)', 'The feed id must be unique.')


class AihSkill(models.Model):
    """A skill, capability or area of expertise, shared by mentors, suppliers and challenges."""
    _name = 'aih.skill'
    _description = 'Innovation Hub skill'
    _order = 'name'

    name = fields.Char(required=True)

    _name_unique = models.Constraint('UNIQUE(name)', 'The skill already exists.')


class AihActivity(models.Model):
    """The four activities of the hub, so the feed's hub section also comes from Odoo."""
    _name = 'aih.activity'
    _description = 'Innovation Hub activity'
    _order = 'sequence, id'

    code = fields.Selection([
        ('inc-acc', 'INC/ACC'),
        ('challenge-connect', 'Challenge Connect'),
        ('vibathon', 'Vibathon'),
        ('talent', 'Talent Ecosystem'),
    ], required=True)
    name = fields.Char(required=True)
    summary = fields.Text()
    sequence = fields.Integer(default=10)
    is_published = fields.Boolean('Published', default=True)

    _code_unique = models.Constraint('UNIQUE(code)', 'Each activity appears once.')
