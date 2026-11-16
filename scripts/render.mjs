// Render the content data (src/data/*.json) into HTML at build time, so the page needs no JavaScript.
// A page marks where each block goes with <!-- data:NAME -->; the page's <html lang> picks the language.
// Every item links to its sources; validate.mjs checks that each item has at least one.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const load = (dir, name) => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (v, lang) => (v && typeof v === 'object' ? v[lang] ?? v.en : v);

const words = {
  en: { sources: 'Sources', source: 'Source', approx: 'about', proposal: 'Proposal', read: 'read', published: 'published', primary: 'which cites' },
  pt: { sources: 'Fontes', source: 'Fonte', approx: 'cerca de', proposal: 'Proposta', read: 'lido a', published: 'publicado a', primary: 'que cita' },
  es: { sources: 'Fuentes', source: 'Fuente', approx: 'hacia', proposal: 'Propuesta', read: 'leído el', published: 'publicado el', primary: 'que cita' },
  fr: { sources: 'Sources', source: 'Source', approx: 'vers', proposal: 'Proposition', read: 'lu le', published: 'publié le', primary: 'qui cite' },
};
const months = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};
const dayMonth = (d, m, lang) => lang === 'en' ? `${d} ${months.en[m - 1]}` : lang === 'fr' ? `${d === 1 ? '1er' : d} ${months.fr[m - 1]}` : `${d} de ${months[lang][m - 1]}`;
const ofYear = (lang) => (lang === 'pt' || lang === 'es') ? ' de ' : ' ';
const until = { en: 'to', pt: 'a', es: 'a', fr: 'au' };
export function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number); if (!months[lang]) lang = 'en';
  return `${dayMonth(d, m, lang)}${ofYear(lang)}${y}`;
}
function formatRange(start, end, lang) {
  if (!months[lang]) lang = 'en';
  if (!end) return formatDate(start, lang);
  const [y1, m1, d1] = start.split('-').map(Number); const [y2, m2] = end.split('-').map(Number);
  if (y1 === y2 && m1 === m2) {
    const d2 = Number(end.split('-')[2]);
    if (lang === 'en') return `${d1} to ${d2} ${months.en[m1 - 1]} ${y1}`;
    if (lang === 'fr') return `du ${d1} au ${d2} ${months.fr[m1 - 1]} ${y1}`;
    return `${d1} a ${d2} de ${months[lang][m1 - 1]} de ${y1}`;
  }
  return `${formatDate(start, lang)} ${until[lang]} ${formatDate(end, lang)}`;
}

export function makeRenderer(dataDir) {
  const sources = load(dataDir, 'sources').sources;
  const byUrl = new Map(sources.map(s => [s.url, s]));
  const cite = (urls, lang) => {
    const pubs = urls.map(u => byUrl.get(u)?.publisher);
    const links = urls.map((u, i) => {
      const s = byUrl.get(u); if (!s) return `<a href="${esc(u)}">${esc(u)}</a>`;
      // When one citation names the same publisher twice, the article title tells the links apart.
      const text = pubs.filter(p => p === s.publisher).length > 1 ? `${s.publisher}, "${s.title}"` : s.publisher;
      return `<a href="${esc(u)}" title="${esc(s.title)}">${esc(text)}</a>`;
    });
    return `<p class="src">${words[lang][urls.length > 1 ? 'sources' : 'source']}: ${links.join(', ')}</p>`;
  };
  const blocks = {
    figures: lang => `<ul class="figures">\n${load(dataDir, 'figures').figures.map(f =>
      `<li id="fig-${esc(f.id)}"><strong class="figure-value">${esc(t(f.value, lang))}</strong> <span class="figure-label">${esc(t(f.label, lang))}</span>` +
      (f.note ? ` <span class="figure-note">${esc(t(f.note, lang))}</span>` : '') + cite(f.sources, lang) + '</li>').join('\n')}\n</ul>`,
    programmes: lang => load(dataDir, 'programmes').pillars.map(p =>
      `<section class="pillar" id="pillar-${esc(p.id)}">\n<h3>${esc(t(p.name, lang))}</h3>\n<ul class="programmes">\n` +
      p.programmes.map(g => `<li id="prog-${esc(g.id)}"><h4>${esc(t(g.name, lang))}</h4><p>${esc(t(g.summary, lang))}</p>${cite(g.sources, lang)}</li>`).join('\n') +
      '\n</ul>\n</section>').join('\n'),
    events: lang => `<ol class="events">\n${load(dataDir, 'events').events.map(e =>
      `<li id="ev-${esc(e.id)}"><p class="when"><time datetime="${esc(e.start)}">${e.approximate ? words[lang].approx + ' ' : ''}${esc(formatRange(e.start, e.end, lang))}</time> · ${esc(t(e.place, lang))}</p>` +
      `<h3>${esc(t(e.name, lang))}</h3><p>${esc(t(e.summary, lang))}</p>${cite(e.sources, lang)}</li>`).join('\n')}\n</ol>`,
    proposals: lang => `<ul class="proposals">\n${load(dataDir, 'proposals').proposals.map(p =>
      `<li id="prop-${esc(p.id)}"><p class="tag">${words[lang].proposal}</p><h3>${esc(t(p.name, lang))}</h3><p>${esc(t(p.summary, lang))}</p>${cite(p.sources, lang)}</li>`).join('\n')}\n</ul>`,
    sources: lang => `<ol class="sources">\n${sources.map(s =>
      `<li><a href="${esc(s.url)}">${esc(s.title)}</a>, ${esc(s.publisher)}` +
      (s.published ? `, ${words[lang].published} ${esc(formatDate(s.published, lang))}` : '') +
      `; ${words[lang].read} ${esc(formatDate(s.read, lang))}.` +
      (s.primary?.length ? ` ${words[lang].primary}: ${s.primary.map(u => `<a href="${esc(u)}">${esc(new URL(u).hostname.replace(/^www\./, ''))}</a>`).join(', ')}.` : '') + '</li>').join('\n')}\n</ol>`,
  };
  return (html) => {
    const lang = (html.match(/<html lang="([a-z]{2})/) || [, 'en'])[1];
    return html.replace(/<!-- data:([a-z]+) -->/g, (m, name) => {
      if (!blocks[name]) throw new Error(`unknown data block ${name}`);
      return blocks[name](words[lang] ? lang : 'en');
    });
  };
}
