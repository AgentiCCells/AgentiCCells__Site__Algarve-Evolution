// Build: copy src/ to the output folder, render the data blocks, render every design and app page,
// stamp the version, write version.json and designs.json.
// SITE_VERSION is set by CI only (v0.1.N); a local build says "dev".
// SITE_OUT picks the output folder (default _site), so several people can build at once.
import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeRenderer } from './render.mjs';
import { loadData, helpers, chrome, designPath, localise, LANGS, langPath } from './site-data.mjs';

const version = process.env.SITE_VERSION || 'dev';
const out = process.env.SITE_OUT || '_site';
rmSync(out, { recursive: true, force: true });
cpSync('src', out, { recursive: true });
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const render = makeRenderer('src/data');
const raw = loadData('src/data');
const data = raw; // English view; each page gets localise(raw, lang)
const views = Object.fromEntries(LANGS.map(l => [l, localise(raw, l)]));

// A design or page that throws is reported; the build fails at the end. BUILD_KEEP_GOING=1 writes the rest anyway,
// so several people can work on different designs at once (CI never sets it).
const failures = [];
const attempt = (what, fn) => { try { fn(); } catch (e) { failures.push(`${what}: ${e.message}`); console.error(`FAILED ${what}: ${e.stack.split('\n').slice(0, 2).join(' ')}`); } };
const write = (path, html) => { const f = join(out, path, 'index.html'); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); };
const load = async dir => existsSync(dir)
  ? (await Promise.all(readdirSync(dir).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort()
      .map(f => import(pathToFileURL(join(dir, f)).href)))) : [];

// Designs: scripts/designs/<slug>.mjs exports meta and render(ctx). The default design ("coast") is the
// template in src/index.html and src/pt/index.html, rendered by render.mjs below.
const designs = await load('scripts/designs');
const manifest = [{ slug: 'coast', order: 1, group: 'classic', name: { en: 'The Coast', pt: 'A Costa', es: 'La Costa', fr: 'La Côte' }, tagline: { en: 'Warm, editorial, the default', pt: 'Quente, editorial, o padrão', es: 'Cálido, editorial, el predeterminado', fr: 'Chaleureux, éditorial, par défaut' } }];
for (const d of designs) {
  const { meta } = d;
  manifest.push({ slug: meta.slug, order: meta.order, group: meta.group, name: meta.name, tagline: meta.tagline });
  const alt = Object.fromEntries(LANGS.map(l => [l, designPath(meta.slug, l)]));
  for (const lang of LANGS) {
    const other = alt[lang === 'en' ? 'pt' : 'en'];
    const ctx = { lang, langs: LANGS, alt, data: views[lang], h: helpers(views[lang], lang), version, slug: meta.slug, self: alt[lang], other,
      home: designPath('coast', lang), chrome: chrome(views[lang], lang, { slug: meta.slug, version, alt }) };
    attempt(`design ${meta.slug} (${lang})`, () => write(alt[lang], d.render(ctx)));
  }
}
manifest.sort((a, b) => a.order - b.order);
for (const m of manifest) { m.paths = Object.fromEntries(LANGS.map(l => [l, designPath(m.slug, l)])); m.thumb = existsSync(join('src/assets/designs', `${m.slug}.jpg`)) ? `/assets/designs/${m.slug}.jpg` : null; }
writeFileSync(join(out, 'designs.json'), JSON.stringify({ default: 'coast', designs: manifest }, null, 1) + '\n');

// App pages: scripts/pages/<name>.mjs exports name, paths { en } (other languages are /<lang> + the English path) and render(ctx).
for (const p of await load('scripts/pages')) {
  const alt = Object.fromEntries(LANGS.map(l => [l, p.paths?.[l] && l !== 'en' && l !== 'pt' ? p.paths[l] : langPath(p.paths.en, l)]));
  for (const lang of LANGS) {
    const other = alt[lang === 'en' ? 'pt' : 'en'];
    const ctx = { lang, langs: LANGS, alt, data: views[lang], h: helpers(views[lang], lang), version, slug: p.name || 'app', self: alt[lang], other, home: designPath('coast', lang),
      chrome: chrome(views[lang], lang, { slug: 'app', version, alt, app: p.name }) };
    attempt(`page ${p.name} (${lang})`, () => write(alt[lang], p.render(ctx)));
  }
}

for (const f of walk(out)) {
  if (!/\.(html|js|css|json|md|txt)$/.test(f)) continue;
  let s = readFileSync(f, 'utf8'); const before = s;
  if (f.endsWith('.html')) s = render(s);
  s = s.replaceAll('__VERSION__', version);
  if (s !== before) writeFileSync(f, s);
}
writeFileSync(join(out, 'version.json'), JSON.stringify({ version, commit: process.env.GITHUB_SHA || 'local', built: new Date().toISOString() }, null, 2) + '\n');
writeFileSync(join(out, '.nojekyll'), '');
console.log(`built ${out}/ (${version}): ${manifest.length} designs`);
if (failures.length) { console.error(`${failures.length} render failure(s)`); if (process.env.BUILD_KEEP_GOING !== '1') process.exit(1); }
