// Gate: fails the build on any problem. Never weaken a check to get a release out.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const problems = [];
const fail = m => problems.push(m);
const hype = /\b(revolutionary|cutting[- ]edge|seamless(?:ly)?|world[- ]class|game[- ]changing)\b/i;
const out = process.env.SITE_OUT || '_site';
const files = walk(out);
for (const f of files) {
  if (!/\.(html|js|css|json|md)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((line, i) => {
    if (line.includes('—')) fail(`${f}:${i + 1}: em dash`);
    const m = line.match(hype); if (m) fail(`${f}:${i + 1}: hype word "${m[0]}"`);
  });
  if (f.endsWith('.html')) {
    if (!/<title>[^<]+<\/title>/.test(s)) fail(`${f}: no <title>`);
    if (!/<html lang="/.test(s)) fail(`${f}: no lang on <html>`);
    for (const m of s.matchAll(/<script[^>]+src="([^"]+)"/g)) if (/^(https?:)?\/\//.test(m[1])) fail(`${f}: third-party script ${m[1]}`);
    for (const m of s.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1]; if (/^(https?:|mailto:|data:|\/\/)/.test(u)) continue;
      const target = u.startsWith('/') ? join(out, u) : join(dirname(f), u);
      if (!existsSync(target) && !existsSync(join(target, 'index.html'))) fail(`${f}: broken link ${u}`);
    }
  }
}
if (!existsSync(join(out, 'version.json'))) fail('no version.json');
if (!existsSync(join(out, 'index.html'))) fail('no index.html');
try { JSON.parse(readFileSync('hub.json', 'utf8')); } catch (e) { fail('hub.json is missing or not JSON'); }
// Content rules (sites-loop brief): every fact links to its source, and every page says it is not approved
// by Algarve Evolution until Dinis confirms it is. Sources: Dinis Cruz, 16 November 2026, "Yes, you should quote
// original sources ... if you can find it", so any https source is allowed; each needs publisher, title and read date.
const readJson = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { fail(`${f}: missing or not JSON`); return null; } };
const srcFile = readJson('src/data/sources.json');
const known = new Set((srcFile?.sources || []).map(x => x.url));
for (const x of srcFile?.sources || []) {
  let host = ''; try { host = new URL(x.url).hostname; } catch { fail(`sources.json: bad URL ${x.url}`); continue; }
  if (!x.url.startsWith('https://')) fail(`sources.json: ${x.url} is not https`);
  if (!x.publisher || !x.title || !/^\d{4}-\d{2}-\d{2}$/.test(x.read || '')) fail(`sources.json: ${x.url} needs publisher, title and read date`);
}
const items = [
  ...(readJson('src/data/events.json')?.events || []).map(i => ['events', i]),
  ...(readJson('src/data/programmes.json')?.pillars || []).flatMap(p => p.programmes.map(i => ['programmes', i])),
  ...(readJson('src/data/figures.json')?.figures || []).map(i => ['figures', i]),
  ...(readJson('src/data/proposals.json')?.proposals || []).map(i => ['proposals', i]),
  ...(readJson('src/data/people.json')?.people || []).map(i => ['people', i]),
  ...(readJson('src/data/people.json')?.quotes || []).map(i => ['people', i]),
];
// The ecosystem data cites by key; every key must resolve to a listed source.
const eco = readJson('src/data/ecosystem.json');
for (const [kind, list] of [['nodes', eco?.nodes], ['timeline', eco?.timeline], ['places', eco?.places]])
  for (const i of list || []) { const u = eco.sources[i.src]?.url; if (!u) fail(`ecosystem.json: ${kind} ${i.id || i.title || i.name} has no source`); else if (!known.has(u)) fail(`ecosystem.json: ${u} is not in sources.json`); }
// Every Portuguese field in the ecosystem data has its Spanish and French twin.
for (const list of [eco?.nodes, eco?.timeline, eco?.places]) for (const i of list || []) for (const k of Object.keys(i).filter(k => k.endsWith('_pt'))) { const b = k.slice(0, -3); if (!i[`${b}_es`] || !i[`${b}_fr`]) fail(`ecosystem.json: ${i.id || i.title || i.name} has ${k} but no ${b}_es or ${b}_fr`); }
const voice = readJson('src/data/voice.json');
for (const k of Object.keys(voice || {}).filter(k => k.endsWith('_sources'))) for (const u of voice[k]) if (!known.has(u)) fail(`voice.json: ${k} cites ${u}, which is not in sources.json`);
for (const [file, i] of items) {
  if (!i.sources?.length) fail(`${file}.json: ${i.id} has no source`);
  for (const u of i.sources || []) if (!known.has(u)) fail(`${file}.json: ${i.id} cites ${u}, which is not in sources.json`);
  for (const k of ['name', 'label', 'summary', 'text', 'role']) if (i[k] && !(file === 'people' && k === 'name') && (!i[k].en || !i[k].pt || !i[k].es || !i[k].fr)) fail(`${file}.json: ${i.id} ${k} needs en, pt, es and fr`);
}
for (const [file, i] of items) if (file === 'proposals' && i.status !== 'proposal') fail(`proposals.json: ${i.id} must be marked status "proposal"`);
for (const f of files.filter(f => f.endsWith('.html'))) {
  const s = readFileSync(f, 'utf8');
  if (/<!-- data:[a-z]+ -->/.test(s)) fail(`${f}: data block not rendered`);
  if (!/not yet approved by Algarve Evolution|ainda não aprovado pela Algarve Evolution|(?:aún|todavía) no aprobado por Algarve Evolution|pas encore approuvé par Algarve Evolution/.test(s)) fail(`${f}: no "not yet approved by Algarve Evolution" notice`);
}
// No links to a publisher's staging or test host (a source captured from stg.example.com, 2026-11-16).
for (const f of files.filter(f => /\.(html|json)$/.test(f))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/((?:stg|staging|test|preview)\.[a-z0-9.-]+)/gi)) fail(`${f}: link to a staging or test host ${m[1]}`);
}
// Every design and every app page exists in every language (Dinis Cruz, 16 November 2026: four languages).
const LANGS = ['en', 'pt', 'es', 'fr'];
const manifest = (() => { try { return JSON.parse(readFileSync(join(out, 'designs.json'), 'utf8')); } catch { fail('designs.json missing'); return { designs: [] }; } })();
for (const d of manifest.designs) for (const l of LANGS) { const p = d.paths?.[l]; if (!p || !existsSync(join(out, p, 'index.html'))) fail(`design ${d.slug}: no ${l} page`); }
for (const a of ['/talent-map/', '/spreadsheet-to-app/']) for (const l of LANGS) { const p = l === 'en' ? a : `/${l}${a}`; if (!existsSync(join(out, p, 'index.html'))) fail(`app ${a}: no ${l} page`); }
for (const f of files.filter(f => f.endsWith('.html'))) { const m = readFileSync(f, 'utf8').match(/<html lang="([a-z]{2})/); const rel = f.slice(out.length + 1); const want = rel.match(/^(pt|es|fr)\//)?.[1] || 'en'; if (m && m[1] !== want && !rel.startsWith('spreadsheet-to-app/example/')) fail(`${f}: <html lang="${m[1]}"> but the page is under /${want === 'en' ? '' : want + '/'}`); }
if (problems.length) { console.error(problems.join('\n')); console.error(`FAILED: ${problems.length} problem(s)`); process.exit(1); }
console.log('OK');
