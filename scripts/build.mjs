// Build V2, the Algarve Innovation Hub: copy src/ to the output folder (src/v1/ is the parked V1, served as is),
// render every page in scripts/v2/*.mjs from the Odoo feed (src/feeds/public.json), stamp the version.
// SITE_VERSION is set by CI only (v0.1.N); a local build says "dev". SITE_OUT picks the output folder.
// V1's source is parked in v1-source/ and its build in src/v1/ (scripts/park-v1.mjs).
import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadData } from './site-data.mjs';
import { hubContext } from './v2/_hub.mjs';

const version = process.env.SITE_VERSION || 'dev';
const out = process.env.SITE_OUT || '_site';
rmSync(out, { recursive: true, force: true });
cpSync('src', out, { recursive: true });
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

const data = loadData('src/data');
const feed = JSON.parse(readFileSync('src/feeds/public.json', 'utf8'));
const failures = [];
const pages = existsSync('scripts/v2') ? readdirSync('scripts/v2').filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort() : [];
const manifest = [];
for (const f of pages) {
  const m = await import(pathToFileURL(join('scripts/v2', f)).href);
  try {
    const ctx = hubContext({ data, feed, version, path: m.path, title: m.title });
    const html = m.render(ctx);
    const file = join(out, m.path, 'index.html'); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, html);
    manifest.push({ path: m.path, title: m.title, nav: m.nav ?? null });
  } catch (e) { failures.push(`${f}: ${e.message}`); console.error(`FAILED ${f}: ${e.stack.split('\n').slice(0, 3).join(' ')}`); }
}
writeFileSync(join(out, 'pages.json'), JSON.stringify(manifest, null, 1) + '\n');
for (const f of walk(out)) {
  if (f.startsWith(join(out, 'v1'))) continue;                       // the parked V1 keeps its own stamp
  if (!/\.(html|js|css|json|md|txt)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8'); const t = s.replaceAll('__VERSION__', version);
  if (t !== s) writeFileSync(f, t);
}
writeFileSync(join(out, 'version.json'), JSON.stringify({ version, commit: process.env.GITHUB_SHA || 'local', built: new Date().toISOString(), feed: feed.meta?.exported || null }, null, 2) + '\n');
writeFileSync(join(out, '.nojekyll'), '');
console.log(`built ${out}/ (${version}): ${manifest.length} V2 pages from the Odoo feed (${feed.meta?.exported || 'no date'}), V1 parked at /v1/`);
if (failures.length) { console.error(`${failures.length} page failure(s)`); if (process.env.BUILD_KEEP_GOING !== '1') process.exit(1); }
