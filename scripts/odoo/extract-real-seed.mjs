#!/usr/bin/env node
// Extract the real, public organisations and communities the Odoo seed uses from
// PrompTugal.news's by-place data, into scripts/odoo/seed/real-public.json.
// Usage: node scripts/odoo/extract-real-seed.mjs <path to PrompTugal data/by-place>
// Source: PrompTugal/PrompTugal__News__Website, data/by-place/*.json (code Apache-2.0,
// text CC BY 4.0; each entry keeps its own source URL). Run by odoo@AgentiCCells.dinis.
// Node 22, no dependencies.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) { console.error('usage: extract-real-seed.mjs <by-place dir>'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'seed', 'real-public.json');

const places = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  let d;
  try { d = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
  if (!d || typeof d !== 'object' || !d.id) continue;
  if (d.id === 'algarve' || d.parent === 'algarve' || d.parent === 'loule') places.push(d);
}

const base = (name) => name.split(/ \(|, /)[0].trim().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

// Communities: ai_map entries of type "community". A municipality's entry wins over the region's.
const INFORMAL = new Set(['lagos remoters', 'lagos digital nomads', 'loft community']);
const communities = new Map();
for (const p of places.sort((a, b) => (a.id === 'algarve') - (b.id === 'algarve'))) {
  for (const it of p.ai_map || []) {
    if (it.type !== 'community') continue;
    const key = base(it.name);
    if (communities.has(key)) continue;
    let kind = 'community';
    if (/^gdg|developer group/i.test(it.name)) kind = 'developer group';
    else if (/cowork/i.test(it.name)) kind = 'coworking';
    else if (/erasmus|project/i.test(it.name)) kind = 'project';
    else if (/digital innovators/i.test(it.name)) kind = 'network';
    else if (INFORMAL.has(key)) kind = 'informal group';
    communities.set(key, {
      key: 'com-' + slug(it.name), name: it.name, municipality: p.id === 'algarve' ? 'Algarve (region)' : p.name,
      kind, summary: it.what || '', url: it.url || null, source: it.source_url || it.url, read_on: it.read_on || null,
    });
  }
}

// Organisations for the stakeholder list: public bodies, institutions and organisations.
// Projects, pilots and one-off programmes are left out: they are not organisations.
const SKIP = /PRR|project|Interreg|pilot|agenda|digitali[sz]ation|waste|AGROBOTICS|KTTSeaDrones|Radar Social|REAVER|Modernizacao|\+ Proximo|protocol|partner of|SIMPATICO|Robotics4Farmers|Agrosocial|Digital Commerce|Bairro Comercial|Quarteira Lab|SmartCity|observatory|laborator|Smart Territorial|Associação de Municípios|consortium|Instituto Superior Tecnico|Politécnico de Beja|^Algarve Evolution$|Ayuntamiento/i;
const orgs = new Map();
for (const p of places) {
  for (const it of p.ai_map || []) {
    if (!['public body', 'institution', 'organisation'].includes(it.type)) continue;
    if (SKIP.test(it.name)) continue;
    const key = base(it.name);
    if (orgs.has(key)) continue;
    orgs.set(key, {
      key: 'org-' + slug(it.name), name: it.name, type: it.type, town: p.id === 'algarve' ? null : p.name,
      summary: it.what || '', url: it.url || null, source: it.source_url || it.url, read_on: it.read_on || null,
    });
  }
}

mkdirSync(dirname(out), { recursive: true });
const doc = {
  about: 'Real, public organisations and communities in the Algarve, read by PrompTugal.news researchers (data/by-place/*.json in PrompTugal/PrompTugal__News__Website; code Apache-2.0, text CC BY 4.0). Extracted for the Algarve Innovation Hub Odoo seed by scripts/odoo/extract-real-seed.mjs. Every entry keeps its source URL. Names and one-line descriptions only; no people.',
  extracted: new Date().toISOString().slice(0, 10),
  communities: [...communities.values()],
  organisations: [...orgs.values()],
};
writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
console.log(`communities ${doc.communities.length}, organisations ${doc.organisations.length} -> ${out}`);
