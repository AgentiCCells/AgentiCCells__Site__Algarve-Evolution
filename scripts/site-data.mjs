// Shared data and helpers for every design (scripts/designs/*.mjs) and the apps.
// Loads src/data/*.json once; helpers render text in a language and link every fact to its source.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { formatDate } from './render.mjs';

export function loadData(dir = 'src/data') {
  const data = {};
  for (const f of readdirSync(dir)) if (f.endsWith('.json')) data[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return data;
}

// A view of the data for one language: wherever an object has both k and k_<lang> (for example title and
// title_pt), k takes the translated value. Designs then read e.title and get the page's language.
export function localise(data, lang) {
  const walk = v => {
    if (Array.isArray(v)) return v.map(walk);
    if (!v || typeof v !== 'object') return v;
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = walk(x);
    if (lang !== 'en') for (const k of Object.keys(o)) if (o[`${k}_${lang}`] !== undefined && !k.endsWith(`_${lang}`)) o[k] = o[`${k}_${lang}`];
    return o;
  };
  return walk(data);
}

const WORDS = {
  en: { source: 'Source', sources: 'Sources', proposal: 'Proposal', target: 'target', designs: 'Designs', choose: 'Choose a design', lang: 'Português', langShort: 'PT' },
  pt: { source: 'Fonte', sources: 'Fontes', proposal: 'Proposta', target: 'meta', designs: 'Designs', choose: 'Escolha um design', lang: 'English', langShort: 'EN' },
};

export function helpers(data, lang) {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const t = v => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.en ?? '') : (v ?? ''));
  const byUrl = new Map(data.sources.sources.map(s => [s.url, s]));
  const eco = data.ecosystem.sources;
  // A source given as a URL, or as an ecosystem key (psn, adi, ...), always resolves to { url, publisher, title }.
  const source = ref => {
    const url = eco[ref]?.url || ref;
    const s = byUrl.get(url);
    return s || { url, publisher: new URL(url).hostname.replace(/^www\./, ''), title: eco[ref]?.label || url };
  };
  const link = (ref, text) => { const s = source(ref); return `<a href="${esc(s.url)}" title="${esc(s.title)}" rel="noopener">${esc(text ?? s.publisher)}</a>`; };
  // "Sources: Postal do Algarve, Portugal Startup News" with each name linked to the original.
  const cite = (refs, cls = 'src') => {
    const list = [].concat(refs || []).filter(Boolean); if (!list.length) return '';
    const seen = new Set(); const uniq = list.filter(r => { const u = source(r).url; if (seen.has(u)) return false; seen.add(u); return true; });
    const pubs = uniq.map(r => source(r).publisher);
    const links = uniq.map(r => { const s = source(r); const dup = pubs.filter(p => p === s.publisher).length > 1; return link(r, dup ? `${s.publisher}, "${s.title}"` : s.publisher); });
    return `<p class="${cls}">${WORDS[lang][uniq.length > 1 ? 'sources' : 'source']}: ${links.join(', ')}</p>`;
  };
  const date = iso => formatDate(iso, lang);
  const num = n => Number(n).toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-GB');
  return { esc, t, source, link, cite, date, num, words: WORDS[lang], lang };
}

// Paths: the default design lives at / and /pt/; every other design at /d/<slug>/ and /pt/d/<slug>/.
export function designPath(slug, lang, defaultSlug = 'coast') {
  const base = slug === defaultSlug ? '/' : `/d/${slug}/`;
  return lang === 'pt' ? `/pt${base}` : base;
}

// What every page carries: the prototype banner (required by the gate), the design picker and the language link.
export function chrome(data, lang, { slug, version, other }) {
  const { esc, t } = helpers(data, lang);
  const v = data.voice;
  return {
    head: `<link rel="stylesheet" href="/assets/chrome.css">`,
    banner: `<div class="ae-proto" role="note" data-design="${esc(slug)}"><span>${esc(t(v.banner))}</span> <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a> <button type="button" class="ae-proto-pick" data-ae-picker>${esc(WORDS[lang].choose)}</button> <a class="ae-proto-lang" href="${esc(other)}" hreflang="${lang === 'pt' ? 'en' : 'pt'}">${WORDS[lang].langShort}</a></div>`,
    foot: `<script src="/assets/chrome.js" data-lang="${lang}" data-slug="${esc(slug)}" data-version="${esc(version)}" defer></script>`,
    version,
  };
}
