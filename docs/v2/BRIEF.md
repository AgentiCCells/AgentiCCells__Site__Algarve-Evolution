# V2: the Algarve Innovation Hub, on Odoo

## Dinis Cruz and António Guerreiro (executive director, Algarve Evolution), 16 November 2026, in their meeting
Dinis: "Odoo from Algarve Evolution point of view is the source of truth ... let's create an MVP already with Odoo because it's open source. So we should be able to spin it up ourselves and then integrate it." Two pieces of work: (A) "how do we get more data into Odoo? How do we leverage what exists? ... almost build an abstraction layer so that we can put data better in there" (gaps: spreadsheets not in Odoo; "death by 1,000 cuts": many small requests); (B) "how can we build all sorts of examples, prototypes, MVPs on top of it, and even an iOS app ... where Odoo is the source of truth. So we just consume data from Odoo ... there's going to be two feeds. There's going to be a public feed and a private feed. The public feed leverages stuff that's published. The private feed, you need an API key to access it because not everything Odoo is public."
"move everything that happens to like a V1 ... park all of that ... this is like the V2, so the whole website is now going to be focused on this AI Innovation Hub." "It's important to experience this, not to draw it." "get the different personas to try it out." V2 in English only.

António (in Portuguese, our summary): the project is the Algarve Innovation Hub, an experimentation field, starting with four complementary activities:
1. INC/ACC, incubation and acceleration programmes: manage the programmes; mentors (today one-to-one mentoring, one mentor per company; also guest mentors who run clinics and workshops); measure KPIs from month 0 to month 6 of each company, make the results public and reflect on the indicators.
2. Challenge Connect: a company presents a challenge; other companies or individual professionals present themselves as suppliers; from detailed information, produce a matching result for the company; the company chooses, or Algarve Evolution triages and suggests the best or a top 3.
3. Vibathon: hackathons and workshops; participants, mentors, jury; the projects; who registered; what they presented at the end; and a next step after the event.
4. Talent Ecosystem: a larger database: the Algarve Digital Innovators network (communities, established informal groups, the people in them), grouped as professionals, consultants, mentors, investors; also project partners (co-financed projects) and the stakeholders of the regional business innovation hub.

## Rules for V2
- Odoo is the source of truth. The site reads only the feeds exported from Odoo.
- Real organisations and events may come from public sources (with their source). Every person, startup, mentor, KPI, challenge, application, project and score we invent is marked "simulated" everywhere it shows. Never invent a real person's data. António Guerreiro is the only real person named.
- The prototype banner stays ("A prototype website made by the PrompTugal team for Algarve Evolution; not yet approved by Algarve Evolution").
- Public feed: only records published in Odoo. Private feed: the rest, never in clear in the public repository.

## António's whiteboard (photo: docs/v2/whiteboard-2026-11-16.jpg, shared by Dinis on 16 November 2026)
- Title: **AE INNOVATION HUB** (Algarve Evolution Innovation Hub). Use "AE Innovation Hub" as the name.
- Four boxes, each with António's keywords in Portuguese:
  - INC/ACC: "incubação, aceleração, mentores, KPIs"
  - CHALLENGE CONNECT: "desafios, fornecedores, matching"; a reference written beside it: "IN-Q-TEL .org" (In-Q-Tel, Dinis's "reference, which I worked before ... the US company who does this"), the model for matching a client's challenges with outside companies and startups. A reference for us, not something to name on the site.
  - VIBATHON: "hackathons, workshops, júris"
  - TALENT ECOSYSTEM: "talento, competências, parceiros, rede ADI" (talent, competences or skills, partners, the ADI network).
- "ODOO INFRASTRUCTURE" frames all four: Odoo is the base layer under every activity.
- Along the bottom: "IDEIAS, NECESSIDADES" (ideas, needs): an input stream into the hub.
- Bottom right: spreadsheets feeding into Odoo, and Odoo feeding the official site ("official ... <- ODOO").

## Related reading on the SGit Newsroom (Dinis Cruz, 16 November 2026)
- "Integrate with whatever is on the other side" (https://newsroom.sgit.ai/articles/integrate-with-whatever-is-on-the-other-side.html): never ask a customer to move; build around what they have; their system gets better and we retire our code, or ours becomes the better place. Mentions today's meeting without naming the organisation or linking the MVP.
- "Odoo's agents can now write to the system of record" (https://newsroom.sgit.ai/articles/odoo-and-our-stack.html): use the future now (any Odoo version); plan, then apply, through a vault, with a person's signed approval and a lasting record; a behaviour policy per Odoo agent (grant, mandate, gap); Odoo Online exposes the external API only on custom plans.
- 31 October 2026, the material V1 was built from: "Joining Algarve Evolution", "An Algarve talent map", "Spreadsheet to App", "Sell to the companies that already have the problem", "Vibathon Algarve 2026".
