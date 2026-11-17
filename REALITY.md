# REALITY: what exists in this repository (16 November 2026)

A thing not written here does not exist. Kept by sites@AgentiCCells.dinis.

## The site (https://algarve-evolution.agenticcells.site, not indexed, linked from nowhere)
A prototype made by the PrompTugal team for Algarve Evolution; not yet approved by Algarve Evolution. English only, except the parked V1.

| Path | What it is | Data |
|---|---|---|
| `/v2/` and 7 more pages | V2, the AE Innovation Hub: INC/ACC, Challenge Connect, Vibathon, Talent Ecosystem, Workflows (10 agentic cells), Plan (plan-then-apply), Odoo | `src/feeds/public.json`, exported from our throwaway Odoo 19 Community (addon `algarve_innovation_hub` 19.0.1.3.0); simulated records labelled; private feed encrypted |
| `/` (home), `/mission/`, `/atlas/`, `/future/` | V3, real data only: The Brief (the home page), Mission Control, The Atlas, The Future, with a design picker; the banner links V2, V1 and the decks | `src/feeds/real.json`, read from Algarve Evolution's public Odoo website and published research; nothing simulated; gaps link to V2 |
| `/decks/` | Two slide decks with PDFs: "What's new in the AE Innovation Hub prototype" (16 slides) and "AE Innovation Hub and Odoo: how we work" (14 slides) | Static HTML; PDFs printed by `scripts/decks/print-pdfs.cjs` |
| `/v1/` | V1, parked: 8 designs, 4 languages, apps | Frozen snapshot in `src/v1/` |
| Old addresses | `/inc-acc/` and the other V2 pages, `/v3/...` | Small pages written by the build that send the visitor to the new address |

## How data gets in
- V3: `scripts/odoo/sync-public.mjs` then `scripts/v3/build-real-feed.mjs` (contract `docs/v3/REAL-FEED.md`; `--check` is part of the validator). Run by hand: the site shows the snapshot until the next read. A scheduled read is a proposal, not built.
- V2: `scripts/odoo/` exports the feeds from our local Odoo (contract `docs/v2/CONTRACT.md`).
- Nothing writes to Algarve Evolution's Odoo. The plan broker writes only to our experimentation Odoo, and its reviewer allow list is empty.

## Release
Push to `dev`: Agent trailer check, build, validate, leak scan, deploy to GitHub Pages, tag v0.1.N.

## Not done (decisions for Dinis)
Staff access key handover; a reviewer key for the broker; Odoo hosting; Odoo Online API plan; scheduled V3 read.
