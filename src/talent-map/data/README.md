# The talent map's data

The data behind Algarve Evolution's talent map, a working prototype of the proposal "An Algarve talent map" (SGit Newsroom, 31 October 2026, https://newsroom.sgit.ai/articles/an-algarve-talent-map.html). Nothing here is approved by Algarve Evolution. These files are self-contained so they can be synced into an sgit vault as they are.

## Files

| File | What it holds | Real or simulated |
|---|---|---|
| `organisations.json` | 211 organisations in the Algarve that a founder, a company or a student can turn to: support and funding, mentoring and incubation, education and research, communities, public bodies, companies, investment and grants. | Real, from public sources. Organisations only. |
| `what-pt.json` | Short Portuguese versions of each organisation's description, by id. Merged into `organisations.json` as `pt`. | Our translation. |
| `what-es.json`, `what-fr.json` | Spanish (Spain) and French (France) versions of the same short descriptions, translated faithfully from the Portuguese and checked against the English; proper names kept. Merged as `es` and `fr`. | Our translation. |
| `people.json` | 14 people offering services, mentoring or investment, with their texts in English, Portuguese, Spanish and French. | Simulated: every person is invented. |
| `needs.json` | 4 needs posted by founders, a company and students, in the same four languages. | Simulated. |

## Where the organisations come from

- PrompTugal.news public research: `data/by-place/<municipality>.json` for the Algarve's 16 municipalities, `quarteira.json` (a parish of Loulé, counted as Loulé) and `algarve.json` (region-wide), arrays `ai_map`, `start_company`, `investors` and `contacts`. Repository https://github.com/PrompTugal/PrompTugal__News__Website, commit 895904677aabed56fa1d9737e259c128149c28ed (16 November 2026). Code Apache-2.0; text CC BY 4.0. Each entry keeps the source URL and the date PrompTugal.news read it (`source_url`, `read_on`).
- Algarve Evolution's partners, from `src/data/ecosystem.json` in this repository (itself taken from PrompTugal.news, Apache-2.0 code, CC BY 4.0 text). Partners already in the research get a `partner` note; four (AMAL, ANJE, Junior Achievement Portugal, Startup Portugal) are added as region-wide entries.

## How they were compiled

`node scripts/pages/_talent-map-data.mjs <PrompTugal__News__Website clone> <commit>` (the build does not run it; it only reads the compiled JSON).

- Organisations only. The `talent` array, which names a private person, is not read, and any entry marked as a person is skipped (none were found in the four arrays read).
- Entries without a `source_url` are dropped (none were).
- The same organisation in several files is one entry: `town` is where it is first found (Faro first, then the other municipalities, then the region), `towns` lists every place it appears, and `also` keeps the other places' descriptions with their own sources.
- Contacts (published channels such as a council's general email page) are attached to the organisation they belong to as `contacts`; a channel with no matching organisation is listed as the public body itself.
- `kind` maps the research's types to roles a founder understands: `support` (support and funding: business associations, development desks, competitions and incentive schemes), `incubation` (mentoring and incubation: incubators, accelerators, coworking and business spaces, mentoring programmes), `education` (education and research), `community`, `public` (public body), `company` (companies and startups), `funding` (investment and grants: who funded what, with the amount where the source gives one). A few kinds are set by hand where the source type says less than the text; they are listed in the script.
- `what` is the English text as PrompTugal.news wrote it, less sentences about PrompTugal.news's own build. `pt` is our shorter Portuguese version, faithful to it; `es` and `fr` are our Spanish and French versions of that short text. The compiler reports how many organisations lack each translation (`without pt / es / fr`); `LIST_MISSING=es` prints the ones to translate next. `ai` is PrompTugal.news's note on the organisation's link to AI, where given.
- `from` says where each entry came from.

## Licence

Text CC BY 4.0 (PrompTugal.news research; the simulated people and needs from the SGit Newsroom's public vault cig07f79, CC BY 4.0). Code Apache-2.0.
