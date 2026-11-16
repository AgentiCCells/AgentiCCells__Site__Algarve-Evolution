// Park V1: build the V1 site from v1-source/ (or the current tree) and freeze it as a static snapshot in src/v1/,
// served at /v1/. Every root-relative link, asset, data file and script path is moved under /v1/.
// Dinis Cruz, 16 November 2026: "move everything that happens to like a V1, so you can park all of that ...
// this is like the V2, so the whole website is now going to be focused on this AI Innovation Hub."
// Usage: node scripts/park-v1.mjs <built V1 site folder>   (writes src/v1/; the gate then checks every link)
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const from = process.argv[2];
if (!from) { console.error('usage: node scripts/park-v1.mjs <built V1 site>'); process.exit(1); }
const to = 'src/v1';
rmSync(to, { recursive: true, force: true });
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
// Paths that exist at the root of the V1 site; any string that starts with one of them moves under /v1/.
const roots = ['d', 'assets', 'talent-map', 'spreadsheet-to-app', 'odoo', 'data', 'pt', 'es', 'fr', 'designs.json', 'feeds', 'style.css', 'version.json'];
const rootAlt = roots.map(r => r.replace(/\./g, '\\.')).join('|');
const inString = new RegExp(`(["'\`(=])/(${rootAlt})(?=[/"'\`?#)\\s]|$)`, 'g');
const homeAttr = /((?:href|src|action|content)=")\/(?=["?#])/g;          // href="/" and href="/#x"
const homeJson = /("(?:en|pt|es|fr|home|self|path)"\s*:\s*")\/(?=")/g;   // "en": "/" in designs.json and page data
let n = 0;
for (const f of walk(from)) {
  const rel = relative(from, f);
  if (rel === 'CNAME' || rel === '.nojekyll' || rel === 'version.json') continue;
  const out = join(to, rel); mkdirSync(dirname(out), { recursive: true });
  if (!/\.(html|css|js|json|md|txt|svg|xml)$/.test(f)) { copyFileSync(f, out); continue; }
  let s = readFileSync(f, 'utf8'); const before = s;
  s = s.replace(inString, '$1/v1/$2').replace(homeAttr, '$1/v1/').replace(homeJson, '$1/v1/');
  if (s !== before) n++;
  writeFileSync(out, s);
}
writeFileSync(join(to, 'PARKED.md'), `# V1, parked\n\nA frozen copy of the V1 site (eight designs, four languages, the talent map, Spreadsheet to App, Live from Odoo), served at /v1/. Built from v1-source/ and rewritten by scripts/park-v1.mjs on ${new Date().toISOString().slice(0, 10)}. To change V1, edit v1-source/, rebuild it and park it again.\n`);
console.log(`parked ${walk(to).length} files in ${to}/ (${n} rewritten)`);
