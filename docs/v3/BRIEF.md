# V3: the AE Innovation Hub, real data only, in António's four designs

## Dinis Cruz, 16 November 2026
"question: based on the data that we have, do you think we can make multiple versions of the site ONLY using real data? ... from the 8 designs we created, the 4 that Antonio liked are: The brief, Mission Control, The Atlas, The Future." Then: "yes please build V3 using those 4 designs (and yes keep v2)".

## What V3 is
- The AE Innovation Hub (António's whiteboard: INC/ACC, Challenge Connect, Vibathon, Talent Ecosystem, on Odoo infrastructure, with ideas and needs flowing in) told ONLY with real, published data, each fact linked to its source.
- Four designs over the same data: The Brief (default, /v3/), Mission Control (/v3/mission/), The Atlas (/v3/atlas/), The Future (/v3/future/), with a picker. English only. Built from V1's design modules (v1-source/scripts/designs/{brief,mission,atlas,future}.mjs and v1-source/src/d/<slug>/), restructured around the hub.
- V2 (the simulated "what it could be", at /) stays. V3 says "what you have"; V2 says "what it could be". V3 links to V2 in its banner.
- Where real data does not exist (startups in programmes and their KPIs, mentors, challenges and applications, Vibathon projects, jury and scores, individual people), V3 shows an honest gap: "Your Odoo would fill this", naming the Odoo records that would (from the hub addon, odoo/addons/algarve_innovation_hub) and linking to the V2 page that shows what it could look like. The gaps make the first piece of work visible: getting more data into Odoo.

## Rules
- Real only: nothing simulated, no invented number, name, quote, date or partner. Every fact cites its source (h.cite or the record's source URL). Self-reported figures are labelled as the organisation's own; targets as targets.
- No person named except António Guerreiro (people.json). Organisations from public sources with their links.
- Algarve Evolution's Odoo is the source of truth for events and news: each links back to its page on their Odoo (register there).
- Not to be indexed or linked from anywhere else (António's request): the chrome carries noindex.
