# Designs

The same site in several designs (Dinis Cruz, 16 November 2026: "create these sort of 8 different designs ... from more corporate, to more playful, to more advanced, to more kind of super crazy AI ... 4 normal and then 4 like going a bit crazy").

- The default design, "coast", is the template in `src/index.html` and `src/pt/index.html`, served at `/`, `/pt/`, `/es/` and `/fr/` (written by `scripts/gen-coast.mjs`).
- Every other design is `scripts/designs/<slug>.mjs` (see `_example.mjs`), with its own files in `src/d/<slug>/`, served at `/d/<slug>/` and `/<lang>/d/<slug>/`.
- `scripts/build.mjs` renders each design in every language in `LANGS` (English, Portuguese, Spanish, French; scripts/site-data.mjs) from `src/data/*.json` and writes `/designs.json`, which the design picker (`src/assets/chrome.js`) reads. Thumbnails: `src/assets/designs/<slug>.jpg`.
- Every page carries `chrome.head`, `chrome.banner` (the prototype notice the gate checks) and `chrome.foot` (the picker).
- Facts come only from `src/data/`; each links to its source with `h.cite()`. Copy is in Algarve Evolution's voice (`src/data/voice.json`).
- App pages (the working proposals) are `scripts/pages/<name>.mjs`, exporting `name`, `paths: { en, pt }` and `render(ctx)`, with files in `src/<name>/`.
- Build to your own folder with `SITE_OUT=<dir> node scripts/build.mjs`, then `SITE_OUT=<dir> node scripts/validate.mjs`.

- Languages: add a code to `LANGS` and its words in site-data.mjs and render.mjs, add `<code>` to every `{en, pt, ...}` text and a `k_<code>` beside every `k_pt` in src/data, and the tables in each design. The gate lists anything missing.
