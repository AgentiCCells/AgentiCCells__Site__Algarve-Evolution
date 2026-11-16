from odoo import api, fields, models

# The Algarve's 16 municipalities, used by the town part of the match score.
ALGARVE_TOWNS = {
    'albufeira', 'alcoutim', 'aljezur', 'castro marim', 'faro', 'lagoa', 'lagos', 'loulé', 'loule',
    'monchique', 'olhão', 'olhao', 'portimão', 'portimao', 'são brás de alportel', 'sao bras de alportel',
    'silves', 'tavira', 'vila do bispo', 'vila real de santo antónio', 'vila real de santo antonio',
    'quarteira',
}

# Weights of the three parts of the match score (they add up to 100).
W_SKILLS, W_TOWN, W_BUDGET = 50.0, 20.0, 30.0


class AihChallenge(models.Model):
    _name = 'aih.challenge'
    _inherit = ['aih.feed.mixin']
    _description = 'Challenge Connect challenge'
    _order = 'deadline, id'

    name = fields.Char('Title', required=True)
    company_id = fields.Many2one('aih.programme.company', string='Company')
    org_name = fields.Char('Organisation', help='Use when the challenger is not a programme company.')
    town = fields.Char()
    problem = fields.Text()
    requirements = fields.Text(help='One requirement per line.')
    skill_ids = fields.Many2many('aih.skill', 'aih_challenge_skill_rel', 'challenge_id', 'skill_id', string='Skills wanted')
    budget_eur_min = fields.Float('Budget from (EUR)')
    budget_eur_max = fields.Float('Budget to (EUR)')
    deadline = fields.Date()
    state = fields.Selection([
        ('open', 'Open'), ('matching', 'Matching'), ('matched', 'Matched'), ('closed', 'Closed'),
    ], string='Status', default='open', required=True)
    application_ids = fields.One2many('aih.application', 'challenge_id', string='Applications')
    decision = fields.Selection(
        [('company', 'Company chooses'), ('ae_triage', 'Algarve Evolution triage')],
        help='Who decides: the company itself, or Algarve Evolution suggesting the best or a top 3.')
    chosen_application_id = fields.Many2one('aih.application', domain="[('challenge_id', '=', id)]")
    application_count = fields.Integer(compute='_compute_application_count')

    @api.depends('application_ids')
    def _compute_application_count(self):
        for rec in self:
            rec.application_count = len(rec.application_ids)

    def action_compute_matches(self):
        """Score every application and rank them (1 is best)."""
        for challenge in self:
            apps = challenge.application_ids
            for app in apps:
                score, reasons = app._match_score()
                app.write({'score': score, 'reasons': '\n'.join(reasons)})
            for rank, app in enumerate(apps.sorted(lambda a: (-a.score, a.price_eur, a.id)), start=1):
                app.rank = rank
            if challenge.state == 'open' and apps:
                challenge.state = 'matching'
        return True


class AihApplication(models.Model):
    _name = 'aih.application'
    _inherit = ['aih.feed.mixin']
    _description = 'Application to a challenge'
    _order = 'challenge_id, rank, id'

    challenge_id = fields.Many2one('aih.challenge', required=True, ondelete='cascade', index=True)
    supplier_id = fields.Many2one('res.partner', string='Supplier', required=True, domain=[('aih_is_supplier', '=', True)])
    proposal = fields.Text()
    price_eur = fields.Float('Price (EUR)')
    days = fields.Integer('Days to deliver')
    score = fields.Float(readonly=True, help='0 to 100: skills overlap (50), town (20), budget fit (30).')
    rank = fields.Integer(readonly=True)
    reasons = fields.Text(readonly=True)

    def _match_score(self):
        """Return (score 0..100, reasons) for this application against its challenge."""
        self.ensure_one()
        ch, sup = self.challenge_id, self.supplier_id
        reasons = []
        wanted = set(ch.skill_ids.ids)
        offered = set(sup.aih_capability_ids.ids)
        if wanted:
            shared = wanted & offered
            skills = W_SKILLS * len(shared) / len(wanted)
            names = ', '.join(sorted(self.env['aih.skill'].browse(list(shared)).mapped('name'))) or 'none'
            reasons.append(f'Skills: {len(shared)} of {len(wanted)} wanted ({names})')
        else:
            skills = W_SKILLS / 2
            reasons.append('Skills: the challenge lists none, so half marks')
        town_sup = (sup.city or '').strip().lower()
        town_ch = (ch.town or (ch.company_id.town if ch.company_id else '') or '').strip().lower()
        if town_sup and town_sup == town_ch:
            town = W_TOWN
            reasons.append(f'Town: same town ({sup.city})')
        elif town_sup in ALGARVE_TOWNS:
            town = W_TOWN / 2
            reasons.append(f'Town: elsewhere in the Algarve ({sup.city})')
        else:
            town = 0.0
            reasons.append(f'Town: outside the Algarve ({sup.city or "not given"})')
        lo, hi, price = ch.budget_eur_min, ch.budget_eur_max, self.price_eur
        if hi and lo <= price <= hi:
            budget = W_BUDGET
            reasons.append(f'Budget: {price:,.0f} EUR is inside {lo:,.0f} to {hi:,.0f} EUR')
        elif hi and price < lo:
            budget = W_BUDGET * 2 / 3
            reasons.append(f'Budget: {price:,.0f} EUR is below the range; check the scope')
        elif hi and price > hi:
            budget = max(0.0, W_BUDGET * (1 - (price - hi) / hi))
            reasons.append(f'Budget: {price:,.0f} EUR is {(price - hi) / hi:.0%} over the top of the range')
        else:
            budget = W_BUDGET / 2
            reasons.append('Budget: no range given, so half marks')
        return round(skills + town + budget, 1), reasons
