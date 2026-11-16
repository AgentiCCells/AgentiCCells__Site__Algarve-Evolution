// Gate: fails the build on any problem. Never weaken a check to get a release out.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const problems = [];
const fail = m => problems.push(m);
const hype = /\b(revolutionary|cutting[- ]edge|seamless(?:ly)?|world[- ]class|game[- ]changing)\b/i;
const files = walk('_site');
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
      const target = u.startsWith('/') ? join('_site', u) : join(dirname(f), u);
      if (!existsSync(target) && !existsSync(join(target, 'index.html'))) fail(`${f}: broken link ${u}`);
    }
  }
}
if (!existsSync('_site/version.json')) fail('no version.json');
if (!existsSync('_site/index.html')) fail('no index.html');
try { JSON.parse(readFileSync('hub.json', 'utf8')); } catch (e) { fail('hub.json is missing or not JSON'); }
// Content rules (sites-loop brief): every fact links to its source, sources come from the named
// material, and every page says it is not approved by Algarve Evolution until Dinis confirms it is.
const allowedHosts = ['promptugal.news', 'newsroom.sgit.ai'];
const readJson = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { fail(`${f}: missing or not JSON`); return null; } };
const srcFile = readJson('src/data/sources.json');
const known = new Set((srcFile?.sources || []).map(x => x.url));
for (const x of srcFile?.sources || []) {
  let host = ''; try { host = new URL(x.url).hostname; } catch { fail(`sources.json: bad URL ${x.url}`); continue; }
  if (!allowedHosts.includes(host)) fail(`sources.json: ${x.url} is not from ${allowedHosts.join(' or ')}`);
  if (!x.publisher || !x.title || !/^\d{4}-\d{2}-\d{2}$/.test(x.read || '')) fail(`sources.json: ${x.url} needs publisher, title and read date`);
}
const items = [
  ...(readJson('src/data/events.json')?.events || []).map(i => ['events', i]),
  ...(readJson('src/data/programmes.json')?.pillars || []).flatMap(p => p.programmes.map(i => ['programmes', i])),
  ...(readJson('src/data/figures.json')?.figures || []).map(i => ['figures', i]),
  ...(readJson('src/data/proposals.json')?.proposals || []).map(i => ['proposals', i]),
];
for (const [file, i] of items) {
  if (!i.sources?.length) fail(`${file}.json: ${i.id} has no source`);
  for (const u of i.sources || []) if (!known.has(u)) fail(`${file}.json: ${i.id} cites ${u}, which is not in sources.json`);
  for (const k of ['name', 'label', 'summary']) if (i[k] && (!i[k].en || !i[k].pt)) fail(`${file}.json: ${i.id} ${k} needs en and pt`);
}
for (const [file, i] of items) if (file === 'proposals' && i.status !== 'proposal') fail(`proposals.json: ${i.id} must be marked status "proposal"`);
for (const f of files.filter(f => f.endsWith('.html'))) {
  const s = readFileSync(f, 'utf8');
  if (/<!-- data:[a-z]+ -->/.test(s)) fail(`${f}: data block not rendered`);
  if (!/not yet approved by Algarve Evolution|ainda não aprovado pela Algarve Evolution/.test(s)) fail(`${f}: no "not yet approved by Algarve Evolution" notice`);
}
if (problems.length) { console.error(problems.join('\n')); console.error(`FAILED: ${problems.length} problem(s)`); process.exit(1); }
console.log('OK');
