from odoo import api, fields, models
from odoo.exceptions import ValidationError

PRODUCT_STAGES = [
    ('idea', 'Idea'),
    ('prototype', 'Prototype'),
    ('mvp', 'MVP'),
    ('launched', 'Launched'),
    ('scaling', 'Scaling'),
]


class AihProgramme(models.Model):
    _name = 'aih.programme'
    _inherit = ['aih.feed.mixin']
    _description = 'Incubation or acceleration programme'
    _order = 'date_start desc, id'

    name = fields.Char(required=True)
    kind = fields.Selection([('incubation', 'Incubation'), ('acceleration', 'Acceleration')], required=True)
    cohort = fields.Char()
    date_start = fields.Date('Start')
    date_end = fields.Date('End')
    months = fields.Integer(default=6)
    state = fields.Selection(
        [('planned', 'Planned'), ('running', 'Running'), ('finished', 'Finished')],
        string='Status', default='planned', required=True)
    summary = fields.Text()
    company_ids = fields.One2many('aih.programme.company', 'programme_id', string='Companies')
    mentor_ids = fields.Many2many(
        'res.partner', 'aih_programme_mentor_rel', 'programme_id', 'partner_id',
        string='Mentors', domain=[('aih_is_mentor', '=', True)])
    session_ids = fields.One2many('aih.session', 'programme_id', string='Sessions')
    reflection_ids = fields.One2many('aih.reflection', 'programme_id', string='Reflections')
    company_count = fields.Integer(compute='_compute_counts')
    session_count = fields.Integer(compute='_compute_counts')

    @api.depends('company_ids', 'session_ids')
    def _compute_counts(self):
        for rec in self:
            rec.company_count = len(rec.company_ids)
            rec.session_count = len(rec.session_ids)


class AihProgrammeCompany(models.Model):
    _name = 'aih.programme.company'
    _inherit = ['aih.feed.mixin']
    _description = 'Company in a programme'
    _order = 'programme_id, name'

    name = fields.Char(required=True)
    partner_id = fields.Many2one('res.partner', string='Contact record', help='Optional link to the company in Contacts.')
    sector = fields.Char()
    town = fields.Char()
    stage = fields.Selection([
        ('idea', 'Idea'), ('pre_seed', 'Pre-seed'), ('seed', 'Seed'),
        ('early_revenue', 'Early revenue'), ('growth', 'Growth'),
    ])
    programme_id = fields.Many2one('aih.programme', string='Programme', ondelete='set null', index=True)
    summary = fields.Text()
    website = fields.Char()
    mentor_id = fields.Many2one(
        'res.partner', string='One-to-one mentor', domain=[('aih_is_mentor', '=', True)],
        help='Today each company has one mentor.')
    kpi_ids = fields.One2many('aih.kpi', 'company_id', string='KPI snapshots')


class AihSession(models.Model):
    _name = 'aih.session'
    _inherit = ['aih.feed.mixin']
    _description = 'Mentoring session'
    _order = 'date desc, id'

    programme_id = fields.Many2one('aih.programme', required=True, ondelete='cascade', index=True)
    company_id = fields.Many2one(
        'aih.programme.company', string='Company', domain="[('programme_id', '=', programme_id)]",
        help='Empty for clinics and workshops open to the whole cohort.')
    mentor_id = fields.Many2one('res.partner', string='Mentor', required=True, domain=[('aih_is_mentor', '=', True)])
    kind = fields.Selection(
        [('one_to_one', 'One-to-one'), ('clinic', 'Clinic'), ('workshop', 'Workshop')],
        required=True, default='one_to_one')
    date = fields.Date(required=True)
    topic = fields.Char(required=True)
    notes = fields.Text(help='Private: never in the public feed.')


class AihKpi(models.Model):
    _name = 'aih.kpi'
    _inherit = ['aih.feed.mixin']
    _description = 'Monthly KPI snapshot'
    _order = 'company_id, month'

    company_id = fields.Many2one('aih.programme.company', required=True, ondelete='cascade', index=True)
    programme_id = fields.Many2one(related='company_id.programme_id', store=True)
    month = fields.Integer(required=True, help='Month 0 (entry) to month 6 (end of programme).')
    revenue_eur = fields.Float('Revenue (EUR)')
    customers = fields.Integer()
    team_size = fields.Integer()
    funding_eur = fields.Float('Funding (EUR)')
    product_stage = fields.Selection(PRODUCT_STAGES)

    _company_month_unique = models.Constraint('UNIQUE(company_id, month)', 'One snapshot per company per month.')

    @api.constrains('month')
    def _check_month(self):
        for rec in self:
            if not 0 <= rec.month <= 6:
                raise ValidationError('The month must be between 0 and 6.')


class AihReflection(models.Model):
    _name = 'aih.reflection'
    _inherit = ['aih.feed.mixin']
    _description = 'Programme reflection on the indicators'
    _order = 'programme_id, month'

    programme_id = fields.Many2one('aih.programme', required=True, ondelete='cascade', index=True)
    month = fields.Integer(required=True)
    text = fields.Text(required=True)
