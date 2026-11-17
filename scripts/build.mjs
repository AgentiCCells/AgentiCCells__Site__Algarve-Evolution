// Build V2, the Algarve Innovation Hub: copy src/ to the output folder (src/v1/ is the parked V1, served as is),
// render every page in scripts/v2/*.mjs from the Odoo feed (src/feeds/public.json), stamp the version.
// SITE_VERSION is set by CI only (v0.1.N); a local build says "dev". SITE_OUT picks the output folder.
// V1's source is parked in v1-source/ and its build in src/v1/ (scripts/park-v1.mjs).
import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadData } from './site-data.mjs';
import { hubContext } from './v2/_hub.mjs';
import { v3Context, v3Path } from './v3/_v3.mjs';

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
// V3: real data only, António's four designs (scripts/v3/<slug>.mjs), from src/feeds/real.json.
const real = existsSync('src/feeds/real.json') ? JSON.parse(readFileSync('src/feeds/real.json', 'utf8')) : { meta: {}, missing: true };
const v3mods = existsSync('scripts/v3') ? (await Promise.all(readdirSync('scripts/v3').filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort().map(f => import(pathToFileURL(join('scripts/v3', f)).href)))).filter(m => m.meta).sort((a, b) => a.meta.order - b.meta.order) : [];
const v3designs = v3mods.map(m => m.meta);
for (const m of v3mods) {
  try {
    const ctx = v3Context({ data, real, version, slug: m.meta.slug, designs: v3designs });
    const file = join(out, v3Path(m.meta.slug), 'index.html'); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, m.render(ctx));
  } catch (e) { failures.push(`v3/${m.meta.slug}: ${e.message}`); console.error(`FAILED v3/${m.meta.slug}: ${e.stack.split('\n').slice(0, 3).join(' ')}`); }
}
// Old addresses keep working: V2 moved from / to /v2/ and V3 from /v3/ to / (Dinis Cruz, 16 November 2026:
// "the home page should be V3"). Each old path gets a small page that sends the visitor on.
const moved = { ...Object.fromEntries(['inc-acc', 'challenge-connect', 'vibathon', 'talent', 'workflows', 'plan', 'odoo'].map(p => [`/${p}/`, `/v2/${p}/`])),
  ...Object.fromEntries(v3mods.map(m => [`/v3/${m.meta.slug === 'brief' ? '' : m.meta.slug + '/'}`, v3Path(m.meta.slug)])) };
for (const [from, to] of Object.entries(moved)) {
  const file = join(out, from, 'index.html'); if (existsSync(file)) continue; mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Moved to ${to}</title><meta name="robots" content="noindex, nofollow"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"></head>\n<body><p>A prototype website made by the PrompTugal team for Algarve Evolution; not yet approved by Algarve Evolution.</p><p>This page has moved to <a href="${to}">${to}</a>.</p><script>location.replace(${JSON.stringify(to)} + location.hash)</script></body></html>\n`);
}
if (v3mods.length) writeFileSync(join(out, 'v3', 'designs.json'), JSON.stringify({ default: 'brief', designs: v3designs.map(d => ({ ...d, path: v3Path(d.slug) })) }, null, 1) + '\n');
for (const f of walk(out)) {
  if (f.startsWith(join(out, 'v1'))) continue;                       // the parked V1 keeps its own stamp
  if (!/\.(html|js|css|json|md|txt)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8'); const t = s.replaceAll('__VERSION__', version);
  if (t !== s) writeFileSync(f, t);
}
writeFileSync(join(out, 'version.json'), JSON.stringify({ version, commit: process.env.GITHUB_SHA || 'local', built: new Date().toISOString(), feed: feed.meta?.exported || null }, null, 2) + '\n');
writeFileSync(join(out, '.nojekyll'), '');
console.log(`built ${out}/ (${version}): ${manifest.length} V2 pages from the Odoo feed (${feed.meta?.exported || 'no date'}), ${v3mods.length} V3 designs (real data), V1 parked at /v1/`);
if (failures.length) { console.error(`${failures.length} page failure(s)`); if (process.env.BUILD_KEEP_GOING !== '1') process.exit(1); }
