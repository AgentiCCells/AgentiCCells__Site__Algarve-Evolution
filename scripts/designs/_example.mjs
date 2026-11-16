// Reference design (not built: files starting with _ are skipped). Copy to <slug>.mjs to start a design.
// ctx: { lang, data, h, version, slug, self, other, home, chrome }
//   data: every src/data/*.json by name (voice, figures, programmes, events, proposals, sources, ecosystem, people, places)
//   h: { esc, t, cite, link, source, date, num, words, lang }   (t picks the language; cite links sources)
export const meta = {
  slug: 'example', order: 99, group: 'classic',            // group: 'classic' or 'bold'
  name: { en: 'Example', pt: 'Exemplo' }, tagline: { en: 'One line', pt: 'Uma linha' },
};
export function render({ lang, data, h, chrome, other }) {
  const { esc, t, cite } = h; const v = data.voice;
  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Algarve Evolution: ${esc(t(v.tagline))}</title>
${chrome.head}
<link rel="stylesheet" href="/d/example/style.css">
<link rel="alternate" hreflang="${lang === 'en' ? 'pt' : 'en'}" href="${other}">
</head>
<body>
${chrome.banner}
<main>
  <h1>${esc(t(v.tagline))}</h1>
  <p>${esc(t(v.hero_lede))}</p>
  ${cite(data.voice.goals_sources)}
  <ul>${data.ecosystem.timeline.map(e => `<li>${esc(e.when)}: ${esc(t(e.title))} ${cite(e.src)}</li>`).join('')}</ul>
</main>
<footer><p>${esc(t(v.banner))}</p><p>Version ${chrome.version}</p></footer>
${chrome.foot}
</body>
</html>`;
}
