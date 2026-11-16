# AgentiCCells__Site__Algarve-Evolution

Status: placeholder page only, built by sites@AgentiCCells.dinis for Dinis Cruz. Content waits on a brief.

- Site source in `src/`. Every push to `dev` runs `.github/workflows/pages.yml`: Agent trailer check, build, validate, leak scan, deploy to GitHub Pages, then a tag. The version is v0.1.N, set by CI only (first release v0.1.0), shown on the page and at `/version.json`. Locally: `scripts/release.sh`.
- The same files live in an sgit vault (`.sg_vault/bare/` is its encrypted store, committed here; `.sg_vault/local/` holds keys and is never committed).
- Licences: code Apache-2.0 (see LICENSE), text and images CC BY 4.0.

## The vault

The same files are in sgit vault `jg76g6nx`. The read key is public on purpose (it gives read access only; the write key is never in this repository):

- Browse: https://dev.vault.sgraph.ai/#sgit_public_read_7ac35a2d04c8f0310df448016f55b0fa5d1f3f813c03c118bb6e1cb6b4eb451f%3Ajg76g6nx
- Clone: `pip install sgit-ai` then `sgit clone sgit_public_read_7ac35a2d04c8f0310df448016f55b0fa5d1f3f813c03c118bb6e1cb6b4eb451f:jg76g6nx`
