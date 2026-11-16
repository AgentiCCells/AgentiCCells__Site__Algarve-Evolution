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

// The site's languages. English is served at /, every other language under /<code>/.
// To add one: add it here, add its words below, then add <code> fields to the data (k_<code> or {en, pt, es, fr, ...}).
export const LANGS = ['en', 'pt', 'es', 'fr'];
export const LANG_NAMES = { en: 'English', pt: 'Português', es: 'Español', fr: 'Français' };

const WORDS = {
  en: { source: 'Source', sources: 'Sources', proposal: 'Proposal', target: 'target', designs: 'Designs', choose: 'Choose a design', language: 'Language', ideas: 'Working ideas', site: 'The site', here: 'You are here', back: 'Back to the site' },
  pt: { source: 'Fonte', sources: 'Fontes', proposal: 'Proposta', target: 'meta', designs: 'Designs', choose: 'Escolha um design', language: 'Língua', ideas: 'Ideias a funcionar', site: 'O site', here: 'Está aqui', back: 'Voltar ao site' },
  es: { source: 'Fuente', sources: 'Fuentes', proposal: 'Propuesta', target: 'meta', designs: 'Diseños', choose: 'Elija un diseño', language: 'Idioma', ideas: 'Ideas en marcha', site: 'El sitio', here: 'Está aquí', back: 'Volver al sitio' },
  fr: { source: 'Source', sources: 'Sources', proposal: 'Proposition', target: 'objectif', designs: 'Designs', choose: 'Choisir un design', language: 'Langue', ideas: 'Idées en action', site: 'Le site', here: 'Vous êtes ici', back: 'Retour au site' },
};
export const words = lang => WORDS[lang] || WORDS.en;

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
    return `<p class="${cls}">${words(lang)[uniq.length > 1 ? 'sources' : 'source']}: ${links.join(', ')}</p>`;
  };
  const date = iso => formatDate(iso, lang);
  const num = n => Number(n).toLocaleString({ en: 'en-GB', pt: 'pt-PT', es: 'es-ES', fr: 'fr-FR' }[lang] || 'en-GB');
  // A string chosen by language from a table { en, pt, es, fr }, falling back to English.
  const pick = table => table[lang] ?? table.en;
  return { esc, t, source, link, cite, date, num, pick, words: words(lang), lang, langs: LANGS, langNames: LANG_NAMES };
}

// Paths: the default design lives at /, /pt/, /es/, /fr/; every other design at /d/<slug>/ and /<lang>/d/<slug>/.
export const langPath = (enPath, lang) => (lang === 'en' ? enPath : `/${lang}${enPath}`);
export function designPath(slug, lang, defaultSlug = 'coast') {
  return langPath(slug === defaultSlug ? '/' : `/d/${slug}/`, lang);
}
export const APPS = [
  { id: 'talent-map', path: '/talent-map/', name: { en: 'Talent map', pt: 'Mapa de talento', es: 'Mapa de talento', fr: 'Carte des talents' } },
  { id: 'spreadsheet-to-app', path: '/spreadsheet-to-app/', name: { en: 'Spreadsheet to App', pt: 'Da folha à aplicação', es: 'De la hoja a la app', fr: 'Du tableur à l\'app' } },
];

// What every page carries: the prototype banner (required by the gate), the language links, the design picker,
// and the bar of working ideas (the two apps), which marks where you are when you are inside one.
// alt: { en, pt, es, fr } paths of this same page in each language. app: the id of the app page, if any.
export function chrome(data, lang, { slug, version, alt, app = null, home = designPath('coast', lang) }) {
  const { esc, t } = helpers(data, lang);
  const v = data.voice; const W = words(lang);
  const langs = LANGS.map(l => l === lang
    ? `<span class="ae-proto-lang" aria-current="true" lang="${l}">${l.toUpperCase()}</span>`
    : `<a class="ae-proto-lang" href="${esc(alt[l])}" hreflang="${l}" lang="${l}" title="${esc(LANG_NAMES[l])}">${l.toUpperCase()}</a>`).join('');
  const ideas = [`<a class="ae-ideas-site" href="${esc(home)}">${esc(app ? W.back : W.site)}</a>`]
    .concat(APPS.map(a => a.id === app
      ? `<a class="ae-ideas-app" href="${esc(langPath(a.path, lang))}" aria-current="page"><span class="ae-ideas-here">${esc(W.here)}:</span> ${esc(a.name[lang] || a.name.en)}</a>`
      : `<a class="ae-ideas-app" href="${esc(langPath(a.path, lang))}">${esc(a.name[lang] || a.name.en)}</a>`)).join('');
  return {
    head: `<link rel="stylesheet" href="/assets/chrome.css">` + LANGS.filter(l => l !== lang).map(l => `<link rel="alternate" hreflang="${l}" href="${esc(alt[l])}">`).join(''),
    banner: `<div class="ae-proto" role="note" data-design="${esc(slug)}"><span>${esc(t(v.banner))}</span> <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a> <button type="button" class="ae-proto-pick" data-ae-picker>${esc(W.choose)}</button> <span class="ae-proto-langs" role="group" aria-label="${esc(W.language)}">${langs}</span></div>` +
      `<nav class="ae-ideas${app ? ' ae-ideas-in' : ''}" aria-label="${esc(W.ideas)}"><span class="ae-ideas-label">${esc(W.ideas)}</span>${ideas}</nav>`,
    foot: `<script src="/assets/chrome.js" data-lang="${lang}" data-slug="${esc(slug)}" data-version="${esc(version)}" defer></script>`,
    version, langs: LANGS, alt,
  };
}
