# V2 data contract: the feeds Odoo exports and the site reads

Two files with the same shape, exported from Odoo by scripts/odoo/export-feeds.mjs:
- `src/feeds/public.json`: published records only, public fields only. Committed and served.
- private feed: every record and field. Never committed in clear. Published only encrypted (`src/feeds/private.enc.json`, AES-GCM, key derived with PBKDF2 from an access key); the site decrypts it in the browser when a staff member enters the key ("you need an API key to access it"). The key is never in the repository.

Every record carries: `id` (stable string), `odoo` ({ model, id }), `simulated` (bool), `published` (bool), and `source` (URL) when it is real public data.

```
{
  "meta": { "feed": "public|private", "exported": ISO, "odoo": { "url", "version", "db" }, "counts": {...} },
  "hub": { "name": "Algarve Innovation Hub", "activities": [ { "id": "inc-acc|challenge-connect|vibathon|talent", "name", "summary" } ] },
  "programmes": [ { id, kind: "incubation"|"acceleration", name, cohort, start, end, months: 6, status: "planned"|"running"|"finished", summary, company_ids[], mentor_ids[] } ],
  "companies":  [ { id, name, sector, town, stage, programme_id, summary, website? } ],
  "mentors":    [ { id, name, kind: "one_to_one"|"guest", expertise[], town, company_ids[] } ],
  "sessions":   [ { id, programme_id, company_id?, mentor_id, kind: "one_to_one"|"clinic"|"workshop", date, topic, notes? (private) } ],
  "kpis":       [ { company_id, month: 0..6, revenue_eur, customers, team_size, funding_eur, product_stage } ],
  "reflections":[ { programme_id, month, text } ],
  "challenges": [ { id, company_id|org, title, problem, requirements[], skills[], budget_eur_min, budget_eur_max, deadline, status: "open"|"matching"|"matched"|"closed" } ],
  "suppliers":  [ { id, kind: "company"|"individual", name, town, capabilities[], rate?, contact? (private) } ],
  "applications":[ { id, challenge_id, supplier_id, proposal, price_eur, days } ],
  "matches":    [ { challenge_id, ranked: [ { application_id, score, reasons[] } ], decision: "company"|"ae_triage"|null, chosen_application_id? } ],
  "vibathons":  [ { id, kind: "hackathon"|"workshop"|"buildathon", name, date, venue, town, mentor_ids[], jury[ {name, role} ], registrations: n, participants? (private: [{name, email}]), project_ids[], next_steps[] } ],
  "projects":   [ { id, vibathon_id, name, team[], summary, prize?, scores? (private), next_step } ],
  "talent":     [ { id, kind: "community"|"informal_group"|"professional"|"consultant"|"mentor"|"investor"|"partner"|"stakeholder", name, town, community_id?, tags[], consent: bool, summary, source? } ],
  "communities":[ { id, name, municipality, kind, members?, source? } ],
  "events":     [ { id, name, start, end, place, url, source } ]   // real, from algarveevolution.pt public Odoo
}
```
In the public feed: people (mentors, talent of kind professional/consultant/investor, suppliers of kind individual) appear only when `consent` is true; private fields (`notes`, `contact`, `participants`, `scores`) are absent.

## Changes agreed after the first export (16 November 2026, proposed by odoo@, accepted by sites@)
1. `consent` on mentors and suppliers, so the consent rule can be checked from the feed itself.
2. `id`, `odoo`, `simulated`, `published` on every record, kpis, reflections and matches included (match ids `match-<challenge id>`).
3. In public.json a reference to a record that is not public is `null` (single) or dropped (lists): e.g. a session by a mentor without consent keeps `"mentor_id": null`.
4. The consent rule also covers talent of kind `mentor`, project team names and jurors.
5. The private feed also carries `projects[].team_ids` and `vibathons[].jury[].partner_id`; the public feed strips them.
6. Event `start` and `end` are local time without seconds (e.g. `2025-06-26T18:00`).
