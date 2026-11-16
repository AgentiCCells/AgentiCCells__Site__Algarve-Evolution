# The real feed (src/feeds/real.json): contract

Built by scripts/v3/build-real-feed.mjs from real, published sources only. Every record carries `source` (a URL) and, where known, `read` (date). Nothing simulated.
```
{
  "meta": { "built": ISO, "sources": { "odoo": "https://www.algarveevolution.pt (Odoo <version>, read <date>)", ... }, "counts": {...} },
  "hub": { "name": "AE Innovation Hub", "activities": [ { "id": "inc-acc"|"challenge-connect"|"vibathon"|"talent", "name", "keywords": "António's whiteboard words", "summary" } ] },
  "organisation": { "name": "Algarve Evolution", "tagline", "lede", "mission", "goals": [...], "quote": {...}, "executive_director": {...}, "figures": [...], "timeline": [...], "partners": [...] },   // from src/data, each item with sources
  "programmes": [ { id, name, activity, summary, facts: [ { text, source } ], page?: "<their Odoo page URL>" } ],   // INC/ACC and other real programmes: Founder2Founder, Incubator, INOVA Algarve 3.0, Algarve Digital Innovators, Algarve Empreende, education ...
  "pages": [ { url, title, description, activity? } ],          // their public Odoo pages (title + meta description only), e.g. /incubator, /founder2founder
  "events": [ { id, name, start, end, place, town?, url, register, kind?: "hackathon"|"workshop"|"summit"|"meetup"|"other", activity?, source } ],   // from their public Odoo (src/data/odoo.json), refreshed
  "news": [ { title, url, date, blog } ],                       // their blog feeds
  "vibathons": [ { name, date, place, facts: [ { text, source } ] } ],   // Vibathon Algarve 2026 (src/data/events.json, newsroom article) and real hackathons from events
  "communities": [ { id, name, municipality, kind, members?, source } ],   // the real ADI communities
  "organisations": [ { id, name, kind, town, what, url, source, read } ],   // 211 public organisations (v1-source/src/talent-map/data/organisations.json), no people
  "places": { "municipalities": [...], "outline": {...} },      // src/data/places.json
  "gaps": [ { activity, what: "Startups in each programme and their KPIs from month 0 to 6", odoo: ["aih.programme.company", "aih.kpi"], v2: "/inc-acc/" } ]   // what real data does not exist publicly yet
}
```
