from odoo import api, fields, models


class AihVibathon(models.Model):
    _name = 'aih.vibathon'
    _inherit = ['aih.feed.mixin']
    _description = 'Vibathon (hackathon, workshop or buildathon)'
    _order = 'date desc, id'

    name = fields.Char(required=True)
    kind = fields.Selection(
        [('hackathon', 'Hackathon'), ('workshop', 'Workshop'), ('buildathon', 'Buildathon')],
        required=True, default='hackathon')
    event_id = fields.Many2one('event.event', string='Odoo event', help='The event in the Events app, if there is one.')
    date = fields.Date(required=True)
    venue = fields.Char()
    town = fields.Char()
    summary = fields.Text()
    mentor_ids = fields.Many2many(
        'res.partner', 'aih_vibathon_mentor_rel', 'vibathon_id', 'partner_id', string='Mentors',
        domain=[('aih_is_mentor', '=', True)])
    jury_ids = fields.One2many('aih.vibathon.jury', 'vibathon_id', string='Jury')
    registrations = fields.Integer(help='How many people registered.')
    participant_ids = fields.One2many('aih.vibathon.participant', 'vibathon_id', string='Participants (private)')
    project_ids = fields.One2many('aih.project', 'vibathon_id', string='Projects')
    next_steps = fields.Text(help='One next step per line, for the event as a whole.')


class AihVibathonJury(models.Model):
    _name = 'aih.vibathon.jury'
    _description = 'Vibathon jury member'
    _order = 'vibathon_id, id'

    vibathon_id = fields.Many2one('aih.vibathon', required=True, ondelete='cascade')
    partner_id = fields.Many2one('res.partner', string='Contact')
    name = fields.Char(required=True)
    role = fields.Char()


class AihVibathonParticipant(models.Model):
    _name = 'aih.vibathon.participant'
    _description = 'Vibathon participant (private)'
    _order = 'vibathon_id, name'

    vibathon_id = fields.Many2one('aih.vibathon', required=True, ondelete='cascade')
    partner_id = fields.Many2one('res.partner', string='Contact')
    name = fields.Char(required=True)
    email = fields.Char()


class AihProject(models.Model):
    _name = 'aih.project'
    _inherit = ['aih.feed.mixin']
    _description = 'Vibathon project'
    _order = 'vibathon_id, score_total desc, id'

    vibathon_id = fields.Many2one('aih.vibathon', required=True, ondelete='cascade', index=True)
    name = fields.Char(required=True)
    team_ids = fields.Many2many('res.partner', 'aih_project_team_rel', 'project_id', 'partner_id', string='Team')
    summary = fields.Text()
    prize = fields.Char()
    score_ids = fields.One2many('aih.project.score', 'project_id', string='Jury scores (private)')
    score_total = fields.Float(compute='_compute_score_total', store=True, string='Average score')
    next_step = fields.Char()

    @api.depends('score_ids.score')
    def _compute_score_total(self):
        for rec in self:
            scores = rec.score_ids.mapped('score')
            rec.score_total = round(sum(scores) / len(scores), 2) if scores else 0.0


class AihProjectScore(models.Model):
    _name = 'aih.project.score'
    _description = 'Jury score for a project (private)'
    _order = 'project_id, juror, criterion'

    project_id = fields.Many2one('aih.project', required=True, ondelete='cascade')
    juror = fields.Char(required=True)
    criterion = fields.Char(required=True)
    score = fields.Float(help='1 to 10.')
    comment = fields.Char()
