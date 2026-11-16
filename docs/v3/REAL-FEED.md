# The real feed (src/feeds/real.json): contract

Built by scripts/v3/build-real-feed.mjs from real, published sources only. Every record carries `source` (a URL) and, where known, `read` (date). Nothing simulated. No person is named except António Guerreiro, executive director. No e-mail address, telephone number, personal profile link or group-chat invitation is kept.

```
node scripts/odoo/sync-public.mjs                refresh src/data/odoo.json (events, news) from their public Odoo
node scripts/v3/build-real-feed.mjs              read their public pages (one at a time, with a pause) and write the feed
node scripts/v3/build-real-feed.mjs --offline    rebuild from the pages already in the feed (no requests)
node scripts/v3/build-real-feed.mjs --check [f]  check a feed; exit 1 on any problem (also run after every build)
```

The check: every record has a source URL (http or https); no `simulated: true` and no "(simulated)" anywhere; no e-mail address, telephone number, personal profile or invitation link anywhere; `activity` is one of the four (null allowed only on events and pages); every count in `meta.counts` matches its list, and the lists match their inputs (160 events and 20 posts in odoo.json, 211 organisations, every seed community present, one ADI community per card on their page).

```
{
  "meta": { "built": ISO, "contract", "rule", "sources": { "odoo", "pages", "data", "ecosystem", "communities", "organisations", "newsroom" },
            "sources_index": [ { url, publisher, title, published, read } ],          // src/data/sources.json
            "pages_from", "pages_read", "pages_unread": [ { url, status } ], "odoo": { url, version, read },
            "classification": "kind, town and activity are our classification from names and places",
            "counts": { activities, programmes, pages, events, events_upcoming, news, vibathons, communities, communities_adi, organisations, gaps,
                        figures, timeline, partners, events_by_kind, events_by_activity, events_by_region, organisations_by_kind } },
  "hub": { "name": "AE Innovation Hub", full_name, basis, base,
           "activities": [ { "id": "inc-acc"|"challenge-connect"|"vibathon"|"talent", name, keywords (as written), keywords_en, summary } ],
           "inputs": { id: "ideas-needs", what, known, odoo: [], odoo_note, v2 } },   // the whiteboard's input stream: a gap across all four
  "organisation": { name, url, tagline, lede, mission, voice_sources: [url],
           goals: [ { value, label, kind: "target", source, sources } ], goals_note,
           executive_director: { name, role, summary, source, sources }, quote: { text, by, about, date, source, sources },
           figures: [ { id, value, label, note?, kind: "own figure"|"target", source, sources } ], figures_note,
           timeline: [ { when, t, title, text, stat?, source, source_label } ],          // ecosystem source keys resolved to URLs
           partners: [ { id, name, kind: "partner", note, source, source_label } ],
           network: { nodes: [ { id, name, kind, note, source } ], links: [ { from, to, rel } ], from },
           events: [ { id, name, start, end?, approximate?, place, summary, source, sources } ],   // src/data/events.json (as reported)
           adi: { communities, members, mapped_listed, label, source, read },      // as stated on their ADI page
           documents: [ { title, year, source, read } ] },                          // the strategic documents listed on their /hub page
  "programmes": [ { id, name, pillar, activity, summary, note?, facts: [ { text, source, sources?, own_words?, read? } ], page, source, sources } ],
           // src/data/programmes.json (10), plus Algarve Empreende and the AI and Robotics pilot for 15 tourism SMEs from their own pages;
           // a fact taken from a page is kept only while the page, read in that run, still says it
  "pages": [ { url, path, group: "programme"|"community"|"hub"|"events"|"help"|"legal"|"shop"|"organisation", title, description, headings: [h1/h2],
           activity: id|null, data?: { mapped_communities: [ { name, url } ], stated: { communities, members }, documents: [...] }, source, read } ],
           // every non-event, non-blog, non-profile page in their sitemap: title, meta description, first h1/h2 headings; no body copy
  "events": [ { id, name, names_person?, name_safe?, start, end, tz, place, town, region: "algarve"|"portugal"|"abroad"|"online"|null, town_from?,
           kind: "hackathon"|"workshop"|"summit"|"meetup"|"conference"|"other", activity: id|null, url, register, ics, source, read } ],
  "news": [ { title, url, date, blog, source, read } ],
  "vibathons": [ { id, name, date, start, end, place, town, kind: "buildathon"|"hackathon", activity: "vibathon", url, odoo_event,
           facts: [ { text, source, sources?, gap? } ], source, read } ],   // Vibathon Algarve 2026 (events.json, the newsroom article), then hackathons from events
  "communities": [ { id, name, adi: true|false, municipality, municipality_from?, kind, kind_from?, summary?, url, members?, source, read, research?: { source, read } } ],
           // adi: true = on the ADI network's own list (source: their page); research adds PrompTugal.news's reading where it matches
  "organisations": [ { id, name, kind, town, towns, what, url, source, read } ],   // 211, organisations only; contact blocks dropped
  "places": { municipalities, municipalities_source, outline, about, activity: [ { name, ll, note, hq?, source } ], source },
  "gaps": [ { id, activity, what, known, odoo: ["aih.programme.company", "aih.kpi", ...], v2: "/inc-acc/" } ]   // what a real hub needs that is not public
}
```

## Changes from the first draft of this contract (data@AgentiCCells.dinis, 16 November 2026)
- `communities` now starts from the ADI network's own list of 24 mapped communities on their Odoo page /algarveempreende (names and the public links on each card), matched with the 14 communities from PrompTugal.news research; 5 research communities not on their list stay with `adi: false`. No count per community is published, so `members` is absent.
- `programmes` gains `pillar`, `sources`, `note`, and two programmes from their own pages (Algarve Empreende; the AI and Robotics Action Plan pilot for 15 tourism SMEs). The pilot page says 15 winners where src/data/programmes.json reports 20 for INOVA Algarve 3.0; both are shown, with a `note`.
- `pages` gains `path`, `group`, `headings` and `data` (lists published as data: mapped communities, stated totals, document titles). Their Odoo pages have almost no meta descriptions, so `description` is usually empty and `headings` carry the content.
- `events` gains `conference` as a kind, `region`, `tz`, `ics`, and `names_person` / `name_safe` for the two titles that name a guest speaker.
- `organisation` gains `network`, `events` (as reported), `adi` and `documents`; every item keeps `source` and `sources`.
- `gaps` entries always have one of the four activities; the ideas-and-needs gap moved to `hub.inputs`.
