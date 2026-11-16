// Read Algarve Evolution's public Odoo website (their core platform and single source of truth) into
// src/data/odoo.json: every event from the sitemap with its iCal export (name, start, end, place), and the
// blog's Atom feeds (title, date, link). Read only, no credentials, public pages only, one request at a time
// with a pause, as robots.txt allows. Run by hand or on a schedule: node scripts/odoo/sync-public.mjs
// Dinis Cruz, 16 November 2026: "can we integrate with https://www.odoo.com which is what they are using as core
// platform and the single source of truth".
// What is kept: names, dates, places and links. Descriptions, e-mail addresses and telephone numbers are not
// copied: the event page on their Odoo stays the place to read and register.
import { writeFileSync } from 'node:fs';

const BASE = process.env.ODOO_SITE || 'https://www.algarveevolution.pt';
const PAUSE = Number(process.env.ODOO_PAUSE_MS || 300);
const UA = 'site-sync (read-only; public pages; robots.txt respected)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, kind = 'text') {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (r.ok) return kind === 'json' ? r.json() : r.text();
      if (r.status === 404) return null;
    } catch {}
    await sleep(1000 * (i + 1));
  }
  return null;
}
// Our house style has no long dashes; their titles sometimes do. Only titles and places are kept, so a
// spaced long dash becomes a spaced hyphen and nothing else changes.
const tidy = s => String(s || '').replace(/\s*[\u2014\u2013]\s*/g, ' - ').replace(/\s+/g, ' ').trim();

function ical(text) {
  if (!text) return null;
  const body = text.replace(/\r?\n[ \t]/g, '');            // unfold continued lines
  const ev = body.split('BEGIN:VEVENT')[1]?.split('END:VEVENT')[0] || '';
  const field = name => { const m = ev.match(new RegExp(`^${name}(;[^:\\n]*)?:(.*)$`, 'm')); return m ? { params: m[1] || '', value: m[2].trim() } : null; };
  const unesc = v => v.replace(/\\n/g, ' ').replace(/\\([,;\\])/g, '$1');
  const when = f => { if (!f) return null; const m = f.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/); if (!m) return null;
    return m[4] ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : `${m[1]}-${m[2]}-${m[3]}`; };
  const tz = (field('DTSTART')?.params.match(/TZID=([^;]+)/) || [])[1] || null;
  return { name: tidy(unesc(field('SUMMARY')?.value || '')), start: when(field('DTSTART')), end: when(field('DTEND')), tz, place: tidy(unesc(field('LOCATION')?.value || '')) || null };
}

const now = new Date();
const read = now.toISOString().slice(0, 10);
const version = await fetch(`${BASE}/web/webclient/version_info`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': UA }, body: '{"jsonrpc":"2.0","method":"call","params":{}}' })
  .then(r => r.json()).then(j => j.result?.server_serie || null).catch(() => null);
const sitemap = await get(`${BASE}/sitemap.xml`) || '';
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
const eventUrls = [...new Set(locs.filter(u => new RegExp(`^${BASE.replace(/[.]/g, '\\.')}/event/[a-z0-9-]+-\\d+$`).test(u)))];
const feeds = [...new Set(locs.filter(u => /\/blog\/[a-z0-9-]+-\d+\/feed$/.test(u)))];

const events = [];
for (const url of eventUrls) {
  await sleep(PAUSE);
  const e = ical(await get(`${url}/ics`));
  if (!e || !e.name || !e.start) continue;
  const id = url.split('/event/')[1];
  events.push({ id, ...e, url, register: `${url}/register`, ics: `${url}/ics` });
}
events.sort((a, b) => b.start.localeCompare(a.start));

const posts = [];
for (const feed of feeds) {
  await sleep(PAUSE);
  const xml = await get(feed); if (!xml) continue;
  const blog = tidy((xml.match(/<feed[^>]*>\s*<title>([^<]*)<\/title>/) || [])[1] || '');
  for (const entry of xml.split('<entry>').slice(1)) {
    const title = tidy((entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, '') || '');
    const link = (entry.match(/<link href="([^"]+)"/) || [])[1];
    const date = ((entry.match(/<published>([^<]+)<\/published>/) || entry.match(/<updated>([^<]+)<\/updated>/) || [])[1] || '').slice(0, 10);
    if (title && link) posts.push({ title, url: link, date, blog });
  }
}
const seen = new Set();
const uniqPosts = posts.filter(p => (seen.has(p.url) ? false : seen.add(p.url))).sort((a, b) => b.date.localeCompare(a.date));

const out = {
  about: `Read from Algarve Evolution's own Odoo website (${BASE}, Odoo ${version || 'version unknown'}), their core platform and single source of truth, on ${read} by scripts/odoo/sync-public.mjs: public pages only, read only, no credentials. Names, dates, places and links only; each item links back to its page on their Odoo, where people read and register. Long dashes in titles are shown as hyphens.`,
  source: BASE, odoo: version, read, from: { sitemap: `${BASE}/sitemap.xml`, events: 'one iCal export per event (/event/<slug>/ics)', news: feeds },
  events, posts: uniqPosts,
};
writeFileSync('src/data/odoo.json', JSON.stringify(out, null, 1) + '\n');
console.log(`odoo ${version}: ${events.length} events (${events.filter(e => e.start >= read).length} upcoming), ${uniqPosts.length} posts from ${feeds.length} feeds`);
