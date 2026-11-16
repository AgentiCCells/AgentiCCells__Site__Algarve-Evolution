// Design "The Brief": the whole site in the shortest clear form, set in the Swiss typographic style.
// One strong column on a 12-column grid, a large type scale, monochrome with one ochre accent, hairline rules,
// numbered sections and numbered endnotes. Every fact is cited with h.cite(); each cited source also gets an
// endnote number, so the notes at the foot of the page list every source in the order it is first used.
// By sites-design@AgentiCCells.dinis, 16 November 2026. Code Apache-2.0, text CC BY 4.0.
import { APPS, langPath } from '../site-data.mjs';

export const meta = {
  slug: 'brief', order: 3, group: 'classic',
  name: { en: 'The Brief', pt: 'O Resumo', es: 'El Resumen', fr: 'L\u2019Essentiel' },
  tagline: { en: 'Read it in two minutes', pt: 'Leia em dois minutos', es: 'Léalo en dos minutos', fr: 'À lire en deux minutes' },
};

// A timeline entry in the page's language. The build hands each page data already localised (title_pt,
// title_es and so on replace title), so this only renames the November 2026 entry: its "this week" was
// written on 6 November, and the page is read after that week. Shared with the Azulejo design.
const WEEK = { en: 'A week in the Algarve', pt: 'Uma semana no Algarve', es: 'Una semana en el Algarve', fr: 'Une semaine en Algarve' };
const THIS_WEEK = /^(this week|esta semana|cette semaine)\b/i;
export function timelineEntry(e, lang = 'en') {
  return { when: e.when, title: THIS_WEEK.test(e.title || '') ? (WEEK[lang] || WEEK.en) : e.title, text: e.text, stat: e.stat || '', src: e.src, future: !!e.future };
}

// Our partners (ecosystem.json nodes of kind "partner"), each with a short role in four languages,
// written from the node's note, with the node's source key.
export const PARTNERS = [
  { id: 'ualg', name: { en: 'University of the Algarve', pt: 'Universidade do Algarve', es: 'Universidad del Algarve', fr: 'Université de l\'Algarve' },
    role: { en: 'Partner in Algarve Digital Innovators, the Tech Hub Summit and our education work; lead promoter of the 2025 Web Summit project.', pt: 'Parceira na Algarve Digital Innovators, na Tech Hub Summit e no nosso trabalho de educação; promotora principal do projeto Web Summit 2025.', es: 'Socia en Algarve Digital Innovators, en la Tech Hub Summit y en nuestro trabajo educativo; promotora principal del proyecto Web Summit 2025.', fr: 'Partenaire d\'Algarve Digital Innovators, du Tech Hub Summit et de notre travail éducatif\u202f; promotrice principale du projet Web Summit 2025.' }, src: 'adi' },
  { id: 'stp', name: { en: 'Algarve STP' },
    role: { en: 'Science and technology park; partner in Algarve Digital Innovators, Venture Lab, the Tech Hub Summit and the 2025 Web Summit project.', pt: 'Parque de ciência e tecnologia; parceiro na Algarve Digital Innovators, na Venture Lab, na Tech Hub Summit e no projeto Web Summit 2025.', es: 'Parque de ciencia y tecnología; socio en Algarve Digital Innovators, Venture Lab, la Tech Hub Summit y el proyecto Web Summit 2025.', fr: 'Parc scientifique et technologique\u202f; partenaire d\'Algarve Digital Innovators, de Venture Lab, du Tech Hub Summit et du projet Web Summit 2025.' }, src: 'adi' },
  { id: 'amal', name: { en: 'AMAL' },
    role: { en: 'The Algarve\'s intermunicipal community; partner in Algarve Digital Innovators, Venture Lab and the 2025 Web Summit project.', pt: 'A comunidade intermunicipal do Algarve; parceira na Algarve Digital Innovators, na Venture Lab e no projeto Web Summit 2025.', es: 'La comunidad intermunicipal del Algarve; socia en Algarve Digital Innovators, Venture Lab y el proyecto Web Summit 2025.', fr: 'La communauté intermunicipale de l\'Algarve\u202f; partenaire d\'Algarve Digital Innovators, de Venture Lab et du projet Web Summit 2025.' }, src: 'adi' },
  { id: 'nera', name: { en: 'NERA' },
    role: { en: 'Business association of the Algarve; partner in Algarve Digital Innovators, Venture Lab and the 2025 Web Summit project.', pt: 'Associação empresarial do Algarve; parceira na Algarve Digital Innovators, na Venture Lab e no projeto Web Summit 2025.', es: 'Asociación empresarial del Algarve; socia en Algarve Digital Innovators, Venture Lab y el proyecto Web Summit 2025.', fr: 'Association des entreprises de l\'Algarve\u202f; partenaire d\'Algarve Digital Innovators, de Venture Lab et du projet Web Summit 2025.' }, src: 'adi' },
  { id: 'anje', name: { en: 'ANJE' },
    role: { en: 'National association of young entrepreneurs; partner in Algarve Digital Innovators and Venture Lab; ran the 2025 Web Summit competition.', pt: 'Associação nacional de jovens empresários; parceira na Algarve Digital Innovators e na Venture Lab; organizou o concurso Web Summit 2025.', es: 'Asociación nacional de jóvenes empresarios; socia en Algarve Digital Innovators y Venture Lab; organizó el concurso Web Summit 2025.', fr: 'Association nationale des jeunes entrepreneurs\u202f; partenaire d\'Algarve Digital Innovators et de Venture Lab\u202f; a organisé le concours Web Summit 2025.' }, src: 'ws25' },
  { id: 'ja', name: { en: 'Junior Achievement Portugal' },
    role: { en: 'Runs "The Company" with our education work.', pt: 'Dinamiza "A Empresa" com o nosso trabalho de educação.', es: 'Lleva «The Company» junto a nuestro trabajo educativo.', fr: 'Anime «\u00a0The Company\u00a0» avec notre travail éducatif.' }, src: 'psn' },
  { id: 'startupPt', name: { en: 'Startup Portugal' },
    role: { en: 'Recognised our incubator in January 2026.', pt: 'Reconheceu a nossa incubadora em janeiro de 2026.', es: 'Reconoció nuestra incubadora en enero de 2026.', fr: 'A reconnu notre incubateur en janvier 2026.' }, src: 'psn' },
  { id: 'gdg', name: { en: 'Google Developer Group Lagos' },
    role: { en: 'Organiser of DevFest Lagos 2026, where we are a partner.', pt: 'Organizador do DevFest Lagos 2026, de que somos parceiros.', es: 'Organizador del DevFest Lagos 2026, del que somos socios.', fr: 'Organisateur du DevFest Lagos 2026, dont nous sommes partenaires.' }, src: 'devfest' },
];

// An event's date in the page's language: "6 to 7 November 2025", "del 6 al 7 de noviembre de 2025",
// "vers le 8 septembre 2025".
const RANGE = {
  en: { about: 'about ', from: '', to: ' to ' },
  pt: { about: 'cerca de ', from: '', to: ' a ' },
  es: { about: 'hacia el ', from: 'del ', to: ' al ' },
  fr: { about: 'vers le ', from: 'du ', to: ' au ' },
};
export function eventDate(e, h) {
  const r = RANGE[h.lang] || RANGE.en;
  const about = e.approximate ? r.about : '';
  if (!e.end) return about + h.date(e.start);
  const [y1, m1, d1] = e.start.split('-'), [y2, m2] = e.end.split('-');
  const day1 = h.lang === 'fr' && Number(d1) === 1 ? '1er' : String(Number(d1));
  return about + r.from + (y1 === y2 && m1 === m2 ? `${day1}${r.to}${h.date(e.end)}` : `${h.date(e.start)}${r.to}${h.date(e.end)}`);
}

// Escaped text in which a short hyphenated word ("au-delà", "co-founder") never breaks at its hyphen,
// for the big headings, where a broken compound reads badly.
export function keepHyphens(h, text) {
  return h.esc(text).replace(/(^|\s)([^\s-]{1,7}-[^\s-]{1,8})(?=[\s.,;:!?]|$)/gu, '$1<span class="nw">$2</span>');
}

// Our menu also carries the two working ideas (the apps), and our footer every language, from ctx.alt.
export function appLinks(h, langPath, APPS, cls = '') {
  return APPS.map(a => `<a class="${cls}" href="${h.esc(langPath(a.path, h.lang))}" data-app="${h.esc(a.id)}">${h.esc(a.name[h.lang] || a.name.en)}</a>`).join('');
}
export function langLinks(h, alt) {
  return h.langs.map(l => l === h.lang
    ? `<span aria-current="true" lang="${l}">${h.esc(h.langNames[l])}</span>`
    : `<a href="${h.esc(alt[l])}" hreflang="${l}" lang="${l}">${h.esc(h.langNames[l])}</a>`).join(' · ');
}

const W = {
  en: {
    skip: 'Skip to content', where: 'Faro, Algarve', since: 'Since 2018', contents: 'Contents', top: 'Back to the top',
    s: { who: 'Who we are', mandate: 'The mandate', goals: 'Our goals for 2032', figures: 'In figures', quote: 'In our words', pillars: 'Three pillars', timeline: 'Timeline', partners: 'Partners', events: 'Events', join: 'Join us', ideas: 'Two working ideas', notes: 'Notes' },
    target: 'Target', figuresIntro: 'Our own figures, as reported. Nobody outside has audited them; where two sources differ, we show both.',
    quoteBy: 'executive director, on our goals for 2032', eventsIntro: 'Days we ran, co-ran or joined as a partner, newest first. All are past; our current calendar is on algarveevolution.pt.',
    future: 'Next', proposal: 'Proposal, nothing agreed', open: 'Open the working prototype', membership: 'Membership categories on algarveevolution.pt',
    notesIntro: 'Each number in the text points here. Each note links to the page where the fact was read.', published: 'published', read: 'read', cites: 'It cites',
    version: 'Version', licence: 'Code Apache-2.0; text CC BY 4.0. Set in Inter (SIL Open Font License 1.1).', note: 'Note',
    qo: '“', qc: '”',
  },
  pt: {
    skip: 'Saltar para o conteúdo', where: 'Faro, Algarve', since: 'Desde 2018', contents: 'Índice', top: 'Voltar ao início',
    s: { who: 'Quem somos', mandate: 'A missão', goals: 'Os nossos objetivos para 2032', figures: 'Em números', quote: 'Nas nossas palavras', pillars: 'Três pilares', timeline: 'Cronologia', partners: 'Parceiros', events: 'Eventos', join: 'Junte-se a nós', ideas: 'Duas ideias a funcionar', notes: 'Notas' },
    target: 'Meta', figuresIntro: 'Os nossos próprios números, tal como foram noticiados. Ninguém de fora os auditou; quando duas fontes divergem, mostramos ambas.',
    quoteBy: 'diretor executivo, sobre os nossos objetivos para 2032', eventsIntro: 'Dias que organizámos, coorganizámos ou em que fomos parceiros, do mais recente para o mais antigo. Todos já passaram; o calendário atual está em algarveevolution.pt.',
    future: 'A seguir', proposal: 'Proposta, nada acordado', open: 'Abrir o protótipo a funcionar', membership: 'Categorias de membro em algarveevolution.pt',
    notesIntro: 'Cada número no texto remete para aqui. Cada nota liga à página onde o facto foi lido.', published: 'publicado a', read: 'lido a', cites: 'Cita',
    version: 'Versão', licence: 'Código Apache-2.0; texto CC BY 4.0. Composto em Inter (SIL Open Font License 1.1).', note: 'Nota',
    qo: '«', qc: '»',
  },
  es: {
    skip: 'Saltar al contenido', where: 'Faro, Algarve', since: 'Desde 2018', contents: 'Índice', top: 'Volver arriba',
    s: { who: 'Quiénes somos', mandate: 'Nuestra misión', goals: 'Nuestros objetivos para 2032', figures: 'En cifras', quote: 'En nuestras palabras', pillars: 'Tres pilares', timeline: 'Cronología', partners: 'Socios', events: 'Eventos', join: 'Únase a nosotros', ideas: 'Dos ideas en marcha', notes: 'Notas' },
    target: 'Meta', figuresIntro: 'Nuestras propias cifras, tal como se publicaron. Nadie de fuera las ha auditado; cuando dos fuentes difieren, mostramos ambas.',
    quoteBy: 'director ejecutivo, sobre nuestros objetivos para 2032', eventsIntro: 'Jornadas que organizamos, coorganizamos o en las que participamos como socios, de la más reciente a la más antigua. Todas han pasado; nuestro calendario actual está en algarveevolution.pt.',
    future: 'Próximo', proposal: 'Propuesta, nada acordado', open: 'Abrir el prototipo en funcionamiento', membership: 'Categorías de socio en algarveevolution.pt',
    notesIntro: 'Cada número del texto remite aquí. Cada nota enlaza con la página donde se leyó el dato.', published: 'publicado el', read: 'leído el', cites: 'Cita',
    version: 'Versión', licence: 'Código Apache-2.0; texto CC BY 4.0. Compuesto en Inter (SIL Open Font License 1.1).', note: 'Nota',
    qo: '«', qc: '»',
  },
  fr: {
    skip: 'Aller au contenu', where: 'Faro, Algarve', since: 'Depuis 2018', contents: 'Sommaire', top: 'Retour en haut',
    s: { who: 'Qui sommes-nous', mandate: 'Notre mission', goals: 'Nos objectifs pour 2032', figures: 'En chiffres', quote: 'Avec nos mots', pillars: 'Trois piliers', timeline: 'Chronologie', partners: 'Partenaires', events: 'Événements', join: 'Rejoignez-nous', ideas: 'Deux idées en action', notes: 'Notes' },
    target: 'Objectif', figuresIntro: 'Nos propres chiffres, tels que publiés. Personne d\'extérieur ne les a audités\u202f; quand deux sources divergent, nous montrons les deux.',
    quoteBy: 'directeur exécutif, à propos de nos objectifs pour 2032', eventsIntro: 'Les journées que nous avons organisées, co-organisées ou rejointes comme partenaire, de la plus récente à la plus ancienne. Toutes sont passées\u202f; notre calendrier actuel est sur algarveevolution.pt.',
    future: 'À venir', proposal: 'Proposition, rien de convenu', open: 'Ouvrir le prototype', membership: 'Catégories de membre sur algarveevolution.pt',
    notesIntro: 'Chaque numéro du texte renvoie ici. Chaque note mène à la page où le fait a été lu.', published: 'publié le', read: 'lu le', cites: 'Cite\u202f',
    version: 'Version', licence: 'Code Apache-2.0\u202f; texte CC BY 4.0. Composé en Inter (SIL Open Font License 1.1).', note: 'Note',
    qo: '«\u00a0', qc: '\u00a0»',
  },
};

export function render({ lang, data, h, chrome, alt }) {
  const { esc, t } = h; const v = data.voice; const w = W[lang] || W.en;
  // A target such as "50,000" in each language's digits, unless the data already gives it localised.
  const goalValue = g => (/^\d{1,3}(,\d{3})+$/.test(g.value) ? h.num(Number(g.value.replace(/,/g, ''))) : g.value);
  const pad = n => String(n).padStart(2, '0');

  // Citations: h.cite() plus an endnote number after each source link.
  const notes = []; const noteNo = new Map();
  const noteFor = url => { if (!noteNo.has(url)) { notes.push(url); noteNo.set(url, notes.length); } return noteNo.get(url); };
  const cite = refs => {
    const list = [].concat(refs || []).filter(Boolean); if (!list.length) return '';
    const urls = [...new Set(list.map(r => h.source(r).url))]; let i = 0;
    return h.cite(list, 'src').replace(/<\/a>/g, () => { const n = noteFor(urls[i++]); return `</a><sup><a class="nref" href="#n${n}" aria-label="${w.note} ${n}">${n}</a></sup>`; });
  };

  const figures = data.figures.figures.filter(f => f.id !== 'targets-2032' && f.id !== 'founded');
  const quote = data.people.quotes[0]; const person = data.people.people.find(p => p.id === quote.by);
  const proposals = Object.fromEntries(data.proposals.proposals.map(p => [p.id, p]));
  const sections = [
    ['mandate', w.s.mandate], ['goals', w.s.goals], ['figures', w.s.figures], ['quote', w.s.quote], ['pillars', w.s.pillars],
    ['timeline', w.s.timeline], ['partners', w.s.partners], ['events', w.s.events], ['join', w.s.join], ['ideas', w.s.ideas], ['notes', w.s.notes],
  ];
  const no = id => pad(sections.findIndex(s => s[0] === id) + 1);
  const sec = (id, body, cls = '') => `
<section class="row ${cls}" id="s-${id}" aria-labelledby="h-${id}">
  <div class="lab"><span class="no" aria-hidden="true">${no(id)}</span><h2 id="h-${id}">${esc(sections.find(s => s[0] === id)[1])}</h2></div>
  <div class="body">${body}</div>
</section>`;

  // The hero comes first on the page, so its sources take the first note numbers.
  const heroCite = cite(['psn', ...data.figures.figures.find(f => f.id === 'founded').sources]);
  const body = [
    sec('mandate', `<p class="statement">${esc(t(v.mission))}</p>${cite('psn')}`),

    sec('goals', `<ol class="goals">${v.goals.map(g => `<li><span class="gk">${w.target}</span><span class="gv">${esc(goalValue(g))}</span><span class="gl">${esc(t(g.label))}</span></li>`).join('')}</ol>
<p class="flag">${esc(t(v.goals_note))}</p>${cite(v.goals_sources)}`),

    sec('figures', `<p class="intro">${esc(w.figuresIntro)}</p>
<dl class="figs">${figures.map(f => `<div class="fig"><dt>${esc(t(f.value))}</dt><dd><span class="fl">${esc(t(f.label))}</span>${f.note ? `<span class="fn">${esc(t(f.note))}</span>` : ''}${cite(f.sources)}</dd></div>`).join('')}</dl>`),

    sec('quote', `<figure class="quote"><blockquote><p><span class="qo" aria-hidden="true">${w.qo}</span>${esc(t(quote.text))}<span aria-hidden="true">${w.qc}</span></p></blockquote>
<figcaption><strong>${esc(person.name)}</strong>, ${esc(w.quoteBy)}, <time datetime="${esc(quote.date)}">${esc(h.date(quote.date))}</time>.${quote.translation_note && quote.translation_note[lang] ? ` <span class="tn">${esc(quote.translation_note[lang])}</span>` : ''}</figcaption></figure>${cite(quote.sources)}`, 'row-quote'),

    sec('pillars', `<p class="intro">${esc(t(v.pillars_intro))}</p>
<div class="pillars">${data.programmes.pillars.map((p, i) => `<section class="pillar" aria-labelledby="p-${esc(p.id)}"><h3 id="p-${esc(p.id)}"><span class="pn">${no('pillars')}.${i + 1}</span>${esc(t(p.name))}</h3>
<ul>${p.programmes.map(g => `<li><h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${cite(g.sources)}</li>`).join('')}</ul></section>`).join('')}</div>`),

    sec('timeline', `<p class="intro">${esc(t(v.story_intro))}</p>${cite(v.story_sources)}
<ol class="tl">${data.ecosystem.timeline.map(raw => { const e = timelineEntry(raw, lang); return `<li${e.future ? ' class="future"' : ''}><span class="tw">${esc(e.when)}${e.future ? `<em>${w.future}</em>` : ''}</span><div><h3>${esc(e.title)}</h3><p>${esc(e.text)}${e.stat ? ` <span class="stat">${esc(e.stat)}</span>` : ''}</p>${cite(e.src)}</div></li>`; }).join('')}</ol>`),

    sec('partners', `<p class="intro">${esc(t(v.network_intro))}</p>${cite(['adi', 'psn'])}
<dl class="partners">${PARTNERS.map(p => `<div><dt>${esc(t(p.name))}</dt><dd>${esc(t(p.role))}${cite(p.src)}</dd></div>`).join('')}</dl>`),

    sec('events', `<p class="intro">${esc(w.eventsIntro)}</p>
<ol class="evs">${data.events.events.map(e => `<li><span class="tw"><time datetime="${esc(e.start)}">${esc(eventDate(e, h))}</time></span><div><h3>${esc(t(e.name))}</h3><p class="place">${esc(t(e.place))}</p><p>${esc(t(e.summary))}</p>${cite(e.sources)}</div></li>`).join('')}</ol>`),

    sec('join', `<ol class="steps">${v.join.map((j, i) => `<li><span class="sn" aria-hidden="true">${i + 1}</span><p>${esc(t(j))}</p></li>`).join('')}</ol>
<p class="more"><a href="https://www.algarveevolution.pt/join-us" rel="noopener">${esc(w.membership)}</a></p>${cite(v.join_sources)}`),

    sec('ideas', `<p class="intro">${esc(t(v.try_intro))}</p>
<div class="ideas">${v.apps.map((a, i) => { const p = proposals[a.id]; const href = langPath(a.href, lang); return `<article class="idea"><p class="kick">${no('ideas')}.${i + 1} · ${esc(w.proposal)}</p><h3><a href="${esc(href)}">${esc(t(a.name))}</a></h3><p>${esc(t(a.summary))}</p><p class="go"><a href="${esc(href)}" aria-hidden="true" tabindex="-1">${esc(w.open)} <span>&rarr;</span></a></p>${p ? cite(p.sources) : ''}</article>`; }).join('')}</div>`),
  ];

  const hero = `
<header class="hero" id="top">
  <p class="kicker"><span>Algarve Evolution</span><span>${esc(w.where)}</span><span>${esc(w.since)}</span></p>
  <h1>${keepHyphens(h, t(v.tagline))}</h1>
  <div class="row row-hero">
    <div class="lab"><span class="no" aria-hidden="true">00</span><h2 id="h-who">${esc(w.s.who)}</h2></div>
    <div class="body"><p class="lede">${esc(t(v.hero_lede))}</p>__HERO_CITE__</div>
    <nav class="toc" aria-label="${esc(w.contents)}"><h2>${esc(w.contents)}</h2><ol>${sections.map(([id, title], i) => `<li><a href="#s-${id}"><span>${pad(i + 1)}</span>${esc(title)}</a></li>`).join('')}</ol></nav>
  </div>
</header>`;
  const main = body.join('\n');

  const srcByUrl = new Map(data.sources.sources.map(s => [s.url, s]));
  const notesHtml = sec('notes', `<p class="intro">${esc(w.notesIntro)}</p>
<ol class="notes">${notes.map((url, i) => { const s = srcByUrl.get(url) || h.source(url); return `<li id="n${i + 1}"><span><a href="${esc(url)}" rel="noopener">${esc(s.title)}</a>. ${esc(s.publisher)}${s.published ? `, ${w.published} ${esc(h.date(s.published))}` : ''}${s.read ? `; ${w.read} ${esc(h.date(s.read))}` : ''}.${s.primary?.length ? ` <span class="pc">${w.cites}: ${s.primary.map(u => `<a href="${esc(u)}" rel="noopener">${esc(new URL(u).hostname.replace(/^www\./, '') + new URL(u).pathname.replace(/\/$/, ''))}</a>`).join(', ')}.</span>` : ''}<span class="url" aria-hidden="true">${esc(url)}</span></span></li>`; }).join('')}</ol>`, 'row-notes');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Algarve Evolution: ${esc(t(meta.name))}</title>
<meta name="description" content="${esc(t(v.tagline))}. ${esc(t(v.banner))}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#faf9f6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)">
${chrome.head}
<link rel="preload" href="/d/brief/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/d/brief/style.css">
</head>
<body class="brief">
${chrome.banner}
<a class="skip" href="#main">${esc(w.skip)}</a>
<div class="mast"><div class="wrap mast-in">
  <a class="mark" href="#top">Algarve Evolution</a>
  <p class="mast-t"><span>${esc(t(meta.name))}</span> <span class="mast-sub">${esc(t(meta.tagline))}</span></p>
  <nav class="mast-apps" aria-label="${esc(h.words.ideas)}">${appLinks(h, langPath, APPS, 'app')}</nav>
</div></div>
<main id="main" class="wrap">
${hero.replace('__HERO_CITE__', heroCite)}
${main}
${notesHtml}
</main>
<footer class="foot"><div class="wrap foot-in">
  <p class="foot-mark">Algarve Evolution <span>${esc(t(meta.name))}</span></p>
  <div class="foot-text">
    <p><strong>${esc(t(v.banner))}</strong> <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a>.</p>
    <p>${esc(t(v.footer_disclosure))}</p>
    <p class="small">${w.version} ${esc(chrome.version)} · ${esc(w.licence)} · <a href="#top">${esc(w.top)}</a></p>
    <p class="small foot-langs" role="group" aria-label="${esc(h.words.language)}">${langLinks(h, alt)}</p>
  </div>
</div></footer>
${chrome.foot}
</body>
</html>`;
}
