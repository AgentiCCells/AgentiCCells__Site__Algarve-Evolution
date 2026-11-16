// Design "Azulejo": Algarve Evolution in the language of Portuguese tiles. Hand-built SVG tile patterns in
// cobalt on white with Algarve yellow and terracotta, every section framed like a tile panel, rounded type,
// drawn icons (sun, wave, orange, boat, laptop), sticker figures, and a mosaic of the 16 municipalities whose
// tiles turn over to show what happened there. Every fact is cited with h.cite().
// By sites-design@AgentiCCells.dinis, 16 November 2026. Code Apache-2.0, text and drawings CC BY 4.0.
import { timelineEntry, PARTNERS, eventDate, langLinks, keepHyphens } from './brief.mjs';
import { APPS, langPath } from '../site-data.mjs';

export const meta = {
  slug: 'azulejo', order: 4, group: 'classic',
  name: { en: 'Azulejo', pt: 'Azulejo', es: 'Azulejo', fr: 'Azulejo' },
  tagline: { en: 'Playful, Portuguese, full of colour', pt: 'Divertido, português, cheio de cor', es: 'Alegre, portugués, lleno de color', fr: 'Ludique, portugais, plein de couleurs' },
};

// Drawn icons, 64 by 64, in the tile colours. Decorative: always aria-hidden.
const C = { blue: '#163f86', cobalt: '#1f4e9c', sky: '#9fc0ec', pale: '#dce7f7', yellow: '#f4b52a', terra: '#c75b39', orange: '#f28c28', leaf: '#3d8b4f', white: '#fffdf8' };
const S = `stroke="${C.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
const ICONS = {
  sun: `<g ${S} fill="none"><path d="M32 5v7M32 52v7M5 32h7M52 32h7M12.9 12.9l5 5M46.1 46.1l5 5M12.9 51.1l5-5M46.1 17.9l5-5"/></g><circle cx="32" cy="32" r="14" fill="${C.yellow}" ${S}/><path d="M24.5 29.5a8.5 8.5 0 0 1 6-6" fill="none" stroke="${C.white}" stroke-width="3" stroke-linecap="round"/>`,
  wave: `<path d="M5 50C9 31 24 17 41 20c11 2 14 13 6 17-6 3-11-3-6-7-9-2-16 6-17 20Z" fill="${C.cobalt}" ${S}/><path d="M33 26c5-2 10 0 12 3" fill="none" stroke="${C.white}" stroke-width="2.5" stroke-linecap="round"/><path d="M4 56q7-5 14 0t14 0 14 0 14 0" fill="none" ${S}/>`,
  orange: `<path d="M33 17C35 8 45 4 53 6c-2 9-11 13-20 11Z" fill="${C.leaf}" ${S}/><path d="M32 18v-7" fill="none" ${S}/><circle cx="32" cy="38" r="20" fill="${C.orange}" ${S}/><g fill="#d76a12"><circle cx="40" cy="44" r="1.6"/><circle cx="34" cy="49" r="1.6"/><circle cx="44" cy="36" r="1.6"/><circle cx="26" cy="45" r="1.6"/></g><path d="M21 33a12 12 0 0 1 8-8" fill="none" stroke="${C.white}" stroke-width="3" stroke-linecap="round"/>`,
  boat: `<path d="M32 42V9" fill="none" ${S}/><path d="M34.5 12 53 38H34.5Z" fill="${C.white}" ${S}/><path d="M29.5 17 15 38h14.5Z" fill="${C.yellow}" ${S}/><path d="M32 9l8 3-8 3" fill="${C.terra}" ${S}/><path d="M7 42h50l-7 10H14Z" fill="${C.terra}" ${S}/><path d="M4 58q7-5 14 0t14 0 14 0 14 0" fill="none" ${S}/>`,
  laptop: `<rect x="12" y="13" width="40" height="29" rx="3" fill="${C.white}" ${S}/><rect x="16.5" y="17.5" width="31" height="20" rx="1.5" fill="${C.pale}"/><g fill="none" stroke-width="4" stroke-linecap="round"><path d="M22 33v-5" stroke="${C.terra}"/><path d="M28 33v-9" stroke="${C.yellow}"/><path d="M34 33v-7" stroke="${C.cobalt}"/><path d="M40 33V22" stroke="${C.terra}"/></g><path d="M5 46h54l-4 7H9Z" fill="${C.sky}" ${S}/>`,
  pin: `<path d="M32 58C21 44 15 35 15 26a17 17 0 0 1 34 0c0 9-6 18-17 32Z" fill="${C.terra}" ${S}/><circle cx="32" cy="26" r="7" fill="${C.white}" ${S}/>`,
};
const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

// The mosaic: each municipality at a column and row on a 9 by 3 grid (west to east, north and south), plus
// what we did there, short, from ecosystem.json places (our words; each with that place's source key).
const GRID = {
  aljezur: [1, 1], monchique: [3, 1], silves: [4, 1], loule: [6, 1], 'sao-bras-de-alportel': [7, 1], alcoutim: [8, 1], 'castro-marim': [9, 1],
  'vila-do-bispo': [1, 2], lagos: [2, 2], portimao: [3, 2], lagoa: [4, 2], albufeira: [5, 2], faro: [6, 2], olhao: [7, 2], tavira: [8, 2], 'vila-real-de-santo-antonio': [9, 2],
};
// Reading order on a phone (three columns): roughly west to east.
const PHONE_ORDER = ['aljezur', 'monchique', 'silves', 'vila-do-bispo', 'lagos', 'portimao', 'lagoa', 'albufeira', 'loule', '*sun', 'sao-bras-de-alportel', 'faro', 'olhao', 'tavira', 'alcoutim', 'castro-marim', 'vila-real-de-santo-antonio', '*orange'];
const PLACE = {
  faro: { en: 'Our home. We were officially presented here in 2019.', pt: 'A nossa casa. Fomos apresentados oficialmente aqui em 2019.', es: 'Nuestra casa. Aquí nos presentamos oficialmente en 2019.', fr: 'Chez nous. Nous y avons été présentés officiellement en 2019.', src: 'pres19', home: true },
  lagos: { en: 'Algarve Digital Innovators launched here, Sep 2025.', pt: 'Aqui foi lançada a Algarve Digital Innovators, set. 2025.', es: 'Aquí se lanzó Algarve Digital Innovators, sept. 2025.', fr: 'Algarve Digital Innovators y a été lancé, sept. 2025.', src: 'adi' },
  portimao: { en: 'TMCT\'26, 5 to 7 Nov 2026, on our calendar.', pt: 'TMCT\'26, 5 a 7 nov. 2026, no nosso calendário.', es: 'TMCT\'26, del 5 al 7 nov. 2026, en nuestro calendario.', fr: 'TMCT\'26, du 5 au 7 nov. 2026, dans notre calendrier.', src: 'tmct' },
  albufeira: { en: 'Algarve Tech Hub Summit, 23 to 25 Oct 2024.', pt: 'Algarve Tech Hub Summit, 23 a 25 out. 2024.', es: 'Algarve Tech Hub Summit, del 23 al 25 oct. 2024.', fr: 'Algarve Tech Hub Summit, du 23 au 25 oct. 2024.', src: 'aths24' },
  loule: { en: 'The first Tech Hub Summit, 2022, with Faro.', pt: 'A primeira Tech Hub Summit, 2022, com Faro.', es: 'La primera Tech Hub Summit, 2022, con Faro.', fr: 'Le premier Tech Hub Summit, 2022, avec Faro.', src: 'econews22' },
  tavira: { en: 'Algarve Tech Afterwork, which we co-organised.', pt: 'Algarve Tech Afterwork, que coorganizámos.', es: 'Algarve Tech Afterwork, que coorganizamos.', fr: 'Algarve Tech Afterwork, que nous avons co-organisé.', src: 'afterwork' },
  monchique: { en: 'A stop for our Grow Algarve Meetup.', pt: 'Uma paragem do nosso Grow Algarve Meetup.', es: 'Una parada de nuestro Grow Algarve Meetup.', fr: 'Une étape de notre Grow Algarve Meetup.', src: 'meetup' },
};
const PLACE_DEFAULT = { en: 'One of the 16 municipalities in Algarve Digital Innovators.', pt: 'Um dos 16 municípios da Algarve Digital Innovators.', es: 'Uno de los 16 municipios de Algarve Digital Innovators.', fr: 'L\'une des 16 municipalités d\'Algarve Digital Innovators.', src: 'adi' };

const W = {
  en: {
    skip: 'Skip to content', menu: 'Sections',
    nav: [['goals', 'Goals'], ['work', 'Our work'], ['map', 'Map'], ['story', 'Story'], ['events', 'Events'], ['join', 'Join'], ['ideas', 'Try it']],
    kicker: 'Faro, Algarve', sinceWord: 'since', based: 'based in Faro', mandate: 'Our mandate',
    cta1: 'Join us', cta2: 'Try two ideas', target: 'Target for 2032',
    figures: 'In figures', figuresIntro: 'Our own figures, as reported. Nobody outside has audited them; where two sources differ, we show both.',
    quote: 'In our words', about: 'on our goals for 2032',
    pillars: 'Three pillars',
    map: 'All 16 municipalities', mapIntro: 'Each tile is one of the Algarve\'s 16 municipalities, placed roughly where it sits on the map. Hover, tap or tab to a tile to turn it over.', mapKey: 'A sun marks a place with a story from our work.', home: 'Home',
    story: 'Our story, tile by tile', next: 'Next',
    partners: 'Who we work with',
    events: 'Events', eventsIntro: 'Days we ran, co-ran or joined as a partner, newest first. All are past; our current calendar is on algarveevolution.pt.',
    joinCta: 'See the membership categories', proposal: 'Proposal', open: 'Open the prototype',
    sources: 'Sources', sourcesIntro: 'Every fact on this page links to one of these.', published: 'published', read: 'read', cites: 'It cites',
    version: 'Version', licence: 'Code Apache-2.0; text and drawings CC BY 4.0. Type: Fredoka and Nunito (SIL Open Font License 1.1).', top: 'Back to the top',
    qo: '“', qc: '”',
  },
  pt: {
    skip: 'Saltar para o conteúdo', menu: 'Secções',
    nav: [['goals', 'Objetivos'], ['work', 'O trabalho'], ['map', 'Mapa'], ['story', 'História'], ['events', 'Eventos'], ['join', 'Aderir'], ['ideas', 'Experimente']],
    kicker: 'Faro, Algarve', sinceWord: 'desde', based: 'sediados em Faro', mandate: 'A nossa missão',
    cta1: 'Junte-se a nós', cta2: 'Experimente duas ideias', target: 'Meta para 2032',
    figures: 'Em números', figuresIntro: 'Os nossos próprios números, tal como foram noticiados. Ninguém de fora os auditou; quando duas fontes divergem, mostramos ambas.',
    quote: 'Nas nossas palavras', about: 'sobre os nossos objetivos para 2032',
    pillars: 'Três pilares',
    map: 'Os 16 municípios', mapIntro: 'Cada azulejo é um dos 16 municípios do Algarve, colocado mais ou menos onde fica no mapa. Passe o rato, toque ou use a tecla Tab para virar um azulejo.', mapKey: 'Um sol marca um lugar com uma história do nosso trabalho.', home: 'Sede',
    story: 'A nossa história, azulejo a azulejo', next: 'A seguir',
    partners: 'Com quem trabalhamos',
    events: 'Eventos', eventsIntro: 'Dias que organizámos, coorganizámos ou em que fomos parceiros, do mais recente para o mais antigo. Todos já passaram; o calendário atual está em algarveevolution.pt.',
    joinCta: 'Ver as categorias de membro', proposal: 'Proposta', open: 'Abrir o protótipo',
    sources: 'Fontes', sourcesIntro: 'Cada facto nesta página liga a uma destas fontes.', published: 'publicado a', read: 'lido a', cites: 'Cita',
    version: 'Versão', licence: 'Código Apache-2.0; texto e desenhos CC BY 4.0. Tipos de letra: Fredoka e Nunito (SIL Open Font License 1.1).', top: 'Voltar ao início',
    qo: '«', qc: '»',
  },
  es: {
    skip: 'Saltar al contenido', menu: 'Secciones',
    nav: [['goals', 'Objetivos'], ['work', 'Nuestro trabajo'], ['map', 'Mapa'], ['story', 'Historia'], ['events', 'Eventos'], ['join', 'Unirse'], ['ideas', 'Pruébelo']],
    kicker: 'Faro, Algarve', sinceWord: 'desde', based: 'con sede en Faro', mandate: 'Nuestra misión',
    cta1: 'Únase a nosotros', cta2: 'Pruebe dos ideas', target: 'Meta para 2032',
    figures: 'En cifras', figuresIntro: 'Nuestras propias cifras, tal como se publicaron. Nadie de fuera las ha auditado; cuando dos fuentes difieren, mostramos ambas.',
    quote: 'En nuestras palabras', about: 'sobre nuestros objetivos para 2032',
    pillars: 'Tres pilares',
    map: 'Los 16 municipios', mapIntro: 'Cada azulejo es uno de los 16 municipios del Algarve, situado más o menos donde está en el mapa. Pase el ratón, toque o use la tecla Tab para girar un azulejo.', mapKey: 'Un sol marca un lugar con una historia de nuestro trabajo.', home: 'Sede',
    story: 'Nuestra historia, azulejo a azulejo', next: 'Próximo',
    partners: 'Con quién trabajamos',
    events: 'Eventos', eventsIntro: 'Jornadas que organizamos, coorganizamos o en las que participamos como socios, de la más reciente a la más antigua. Todas han pasado; nuestro calendario actual está en algarveevolution.pt.',
    joinCta: 'Ver las categorías de socio', proposal: 'Propuesta', open: 'Abrir el prototipo',
    sources: 'Fuentes', sourcesIntro: 'Cada dato de esta página enlaza con una de estas fuentes.', published: 'publicado el', read: 'leído el', cites: 'Cita',
    version: 'Versión', licence: 'Código Apache-2.0; texto y dibujos CC BY 4.0. Tipografías: Fredoka y Nunito (SIL Open Font License 1.1).', top: 'Volver arriba',
    qo: '«', qc: '»',
  },
  fr: {
    skip: 'Aller au contenu', menu: 'Sections',
    nav: [['goals', 'Objectifs'], ['work', 'Notre travail'], ['map', 'Carte'], ['story', 'Histoire'], ['events', 'Événements'], ['join', 'Adhérer'], ['ideas', 'Essayer']],
    kicker: 'Faro, Algarve', sinceWord: 'depuis', based: 'basés à Faro', mandate: 'Notre mission',
    cta1: 'Rejoignez-nous', cta2: 'Essayez deux idées', target: 'Objectif pour 2032',
    figures: 'En chiffres', figuresIntro: 'Nos propres chiffres, tels que publiés. Personne d\'extérieur ne les a audités\u202f; quand deux sources divergent, nous montrons les deux.',
    quote: 'Avec nos mots', about: 'à propos de nos objectifs pour 2032',
    pillars: 'Trois piliers',
    map: 'Les 16 municipalités', mapIntro: 'Chaque azulejo est l\'une des 16 municipalités de l\'Algarve, placée à peu près là où elle se trouve sur la carte. Survolez, touchez ou atteignez un azulejo avec la touche Tab pour le retourner.', mapKey: 'Un soleil marque un lieu lié à une histoire de notre travail.', home: 'Siège',
    story: 'Notre histoire, azulejo par azulejo', next: 'À venir',
    partners: 'Avec qui nous travaillons',
    events: 'Événements', eventsIntro: 'Les journées que nous avons organisées, co-organisées ou rejointes comme partenaire, de la plus récente à la plus ancienne. Toutes sont passées\u202f; notre calendrier actuel est sur algarveevolution.pt.',
    joinCta: 'Voir les catégories de membre', proposal: 'Proposition', open: 'Ouvrir le prototype',
    sources: 'Sources', sourcesIntro: 'Chaque fait de cette page renvoie à l\'une de ces sources.', published: 'publié le', read: 'lu le', cites: 'Cite\u202f',
    version: 'Version', licence: 'Code Apache-2.0\u202f; texte et dessins CC BY 4.0. Polices\u202f: Fredoka et Nunito (SIL Open Font License 1.1).', top: 'Retour en haut',
    qo: '«', qc: '»',
  },
};

export function render({ lang, data, h, chrome, alt }) {
  const { esc, t } = h; const v = data.voice; const w = W[lang] || W.en;
  const goalValue = g => (/^\d{1,3}(,\d{3})+$/.test(g.value) ? h.num(Number(g.value.replace(/,/g, ''))) : g.value);

  // h.cite(), and a list of every source used, for the sources panel at the end.
  const used = [];
  const cite = (refs, cls = 'src') => { for (const r of [].concat(refs || []).filter(Boolean)) { const u = h.source(r).url; if (!used.includes(u)) used.push(u); } return h.cite(refs, cls); };
  const head = (id, kick, title, intro = '', ic = '', extra = '') => `<header class="sec-head">${ic ? `<span class="sec-ic">${icon(ic)}</span>` : ''}<div>${kick ? `<p class="kick">${esc(kick)}</p>` : ''}<h2 id="h-${id}">${esc(title)}</h2>${intro ? `<p class="intro">${esc(intro)}</p>` : ''}${extra}</div></header>`;

  const founded = data.figures.figures.find(f => f.id === 'founded');
  const figures = data.figures.figures.filter(f => f.id !== 'targets-2032' && f.id !== 'founded');
  const quote = data.people.quotes[0]; const person = data.people.people.find(p => p.id === quote.by);
  const proposals = Object.fromEntries(data.proposals.proposals.map(p => [p.id, p]));
  const pillarIcon = { education: 'laptop', startups: 'boat', ecosystem: 'orange' };
  const appIcon = { 'talent-map': 'pin', 'spreadsheet-to-app': 'laptop' };
  const munis = Object.fromEntries(data.places.municipalities.map(m => [m.id, m]));

  // Hero art: a three by three panel of tiles; the drawn ones carry the icons.
  const art = [['flor'], ['icon', 'sun', 'y'], ['sol'], ['icon', 'wave', 'b'], ['icon', 'orange', 'w'], ['flor'], ['sol'], ['icon', 'boat', 'w'], ['icon', 'laptop', 'y']]
    .map(([k, ic, tone], i) => `<span class="at at-${k}${tone ? ` tone-${tone}` : ''}" style="--i:${i}">${k === 'icon' ? icon(ic) : ''}</span>`).join('');

  const tile = id => {
    if (id.startsWith('*')) { const [c, r] = id === '*sun' ? [2, 1] : [5, 1]; return `<li class="mt mt-deco" aria-hidden="true" style="--c:${c};--r:${r}"><span class="mt-face">${icon(id.slice(1))}</span></li>`; }
    const m = munis[id]; const p = PLACE[id] || PLACE_DEFAULT; const story = !!PLACE[id]; const [c, r] = GRID[id];
    return `<li class="mt${story ? ' mt-story' : ''}${p.home ? ' mt-home' : ''}" style="--c:${c};--r:${r}">
<div class="mt-card" tabindex="0" role="group" aria-label="${esc(m.name)}"><div class="mt-in">
<div class="mt-front">${story ? icon('sun', 'mt-sun') : ''}<span class="mt-name">${esc(m.name)}</span>${p.home ? `<span class="mt-badge">${esc(w.home)}</span>` : ''}</div>
<div class="mt-back"><p>${esc(p[lang] || p.en)}</p>${cite(p.src, 'src mt-src')}</div>
</div></div></li>`;
  };
  const sea = Array.from({ length: 9 }, (_, i) => `<li class="mt mt-sea${i === 4 ? ' mt-boat' : ''}" aria-hidden="true" style="--c:${i + 1};--r:3">${i === 4 ? `<span class="mt-face">${icon('boat')}</span>` : ''}</li>`).join('');

  const tl = data.ecosystem.timeline.map((raw, i) => { const e = timelineEntry(raw, lang); return `<li class="tt${e.future ? ' tt-future' : ''}"><div class="tt-in"><p class="tt-when"><span class="tt-n" aria-hidden="true">${i + 1}</span>${esc(e.when)}${e.future ? ` <em>${w.next}</em>` : ''}</p><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${e.stat ? `<p class="tt-stat">${esc(e.stat)}</p>` : ''}${cite(e.src)}</div></li>`; }).join('');

  const tones = ['y', 'b', 't', 'w'];

  const body = `
<section class="hero" aria-labelledby="h-top">
  <div class="wrap hero-grid">
    <div class="panel hero-panel"><div class="pin">
      <p class="kick">${esc(w.kicker)}</p>
      <h1 id="h-top">${keepHyphens(h, t(v.tagline))}</h1>
      <p class="lede">${esc(t(v.hero_lede))}</p>
      <p class="ctas"><a class="btn btn-y" href="#join">${esc(w.cta1)}</a> <a class="btn btn-b" href="#ideas">${esc(w.cta2)}</a></p>
      ${cite(['psn', ...founded.sources])}
    </div></div>
    <div class="hero-art-wrap" aria-hidden="true">
      <div class="hero-art">${art}</div>
      <span class="sticker st-since"><b>2018</b>${esc(w.sinceWord)}</span>
      <span class="sticker st-faro">${icon('pin', 'st-ic')}${esc(w.based)}</span>
    </div>
  </div>
</section>

<section class="mandate" aria-labelledby="h-mandate">
  <div class="wrap"><div class="ribbon">${icon('sun', 'rb-ic')}<div><h2 id="h-mandate" class="kick">${esc(w.mandate)}</h2><p class="rb-text">${esc(t(v.mission))}</p>${cite('psn')}</div></div></div>
</section>

<section class="sec" id="goals" aria-labelledby="h-goals">
  <div class="wrap">
    ${head('goals', t(v.goals_note), t(v.goals_title), '', 'sun')}
    <ol class="goals">${v.goals.map((g, i) => `<li class="goal tone-${['b', 'y', 't'][i]}"><span class="goal-k">${esc(w.target)}</span><span class="goal-v">${esc(goalValue(g))}</span><span class="goal-l">${esc(t(g.label))}</span></li>`).join('')}</ol>
    ${cite(v.goals_sources)}
  </div>
</section>

<section class="sec sec-tint" id="figures" aria-labelledby="h-figures">
  <div class="wrap">
    ${head('figures', '', w.figures, w.figuresIntro)}
    <ul class="stickers">${figures.map((f, i) => `<li class="fig tone-${tones[i % 4]}" style="--r:${[-2.2, 1.6, -1.2, 2.4][i % 4]}deg"><span class="fig-v">${esc(t(f.value))}</span><span class="fig-l">${esc(t(f.label))}</span>${f.note ? `<span class="fig-n">${esc(t(f.note))}</span>` : ''}${cite(f.sources)}</li>`).join('')}</ul>
  </div>
</section>

<section class="sec" id="quote" aria-labelledby="h-quote">
  <div class="wrap">
    <h2 id="h-quote" class="sr-only">${esc(w.quote)}</h2>
    <figure class="panel quote-panel"><div class="pin">
      <span class="qmark${w.qo === '«' ? ' qmark-g' : ''}" aria-hidden="true">${w.qo}</span>
      <blockquote><p>${esc(t(quote.text))}</p></blockquote>
      <figcaption><span class="q-badge" aria-hidden="true">${icon('sun')}</span><span><strong>${esc(person.name)}</strong>${esc(t(person.role))}, ${esc(w.about)}, <time datetime="${esc(quote.date)}">${esc(h.date(quote.date))}</time>${quote.translation_note && quote.translation_note[lang] ? `<em>${esc(quote.translation_note[lang])}</em>` : ''}</span></figcaption>
      ${cite(quote.sources)}
    </div></figure>
  </div>
</section>

<section class="sec sec-tint" id="work" aria-labelledby="h-work">
  <div class="wrap">
    ${head('work', '', w.pillars, t(v.pillars_intro))}
    <div class="pillars">${data.programmes.pillars.map((p, i) => `<section class="panel pillar tone-${['b', 'y', 't'][i]}" aria-labelledby="pl-${esc(p.id)}"><div class="pin">
      <header class="pl-head"><span class="pl-ic">${icon(pillarIcon[p.id] || 'sun')}</span><h3 id="pl-${esc(p.id)}"><span class="pl-n">${i + 1}</span>${esc(t(p.name))}</h3></header>
      <ul>${p.programmes.map(g => `<li><h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${cite(g.sources)}</li>`).join('')}</ul>
    </div></section>`).join('')}</div>
  </div>
</section>

<section class="sec" id="map" aria-labelledby="h-map">
  <div class="wrap">
    ${head('map', 'Algarve', w.map, w.mapIntro, 'wave')}
    <p class="map-key">${icon('sun', 'key-ic')}${esc(w.mapKey)}</p>
    <ol class="mosaic" data-flip>${PHONE_ORDER.map(tile).join('')}${sea}</ol>
    ${cite(['adi', data.places.municipalities_source])}
  </div>
</section>

<section class="sec sec-tint" id="story" aria-labelledby="h-story">
  <div class="wrap">
    ${head('story', '2018 · 2027', w.story, t(v.story_intro), 'boat', cite(v.story_sources))}
    <ol class="tiles-tl">${tl}</ol>
  </div>
</section>

<section class="sec" id="partners" aria-labelledby="h-partners">
  <div class="wrap">
    ${head('partners', '', w.partners, t(v.network_intro), '', cite(['adi', 'psn']))}
    <ul class="partners">${PARTNERS.map((p, i) => `<li class="ptile tone-${tones[i % 4]}"><h3>${esc(t(p.name))}</h3><p>${esc(t(p.role))}</p>${cite(p.src)}</li>`).join('')}</ul>
  </div>
</section>

<section class="sec sec-tint" id="events" aria-labelledby="h-events">
  <div class="wrap">
    ${head('events', '', w.events, w.eventsIntro)}
    <ol class="cards">${data.events.events.map((e, i) => `<li class="card"><p class="stamp tone-${tones[i % 4]}"><time datetime="${esc(e.start)}">${esc(eventDate(e, h))}</time></p><h3>${esc(t(e.name))}</h3><p class="place">${icon('pin', 'pl-pin')}${esc(t(e.place))}</p><p>${esc(t(e.summary))}</p>${cite(e.sources)}</li>`).join('')}</ol>
  </div>
</section>

<section class="sec" id="join" aria-labelledby="h-join">
  <div class="wrap">
    <div class="panel join-panel"><div class="pin">
      ${head('join', '', t(v.join_title), '', 'orange')}
      <ol class="steps">${v.join.map((j, i) => `<li><span class="step-n" aria-hidden="true">${i + 1}</span><p>${esc(t(j))}</p></li>`).join('')}</ol>
      <p class="ctas"><a class="btn btn-y" href="https://www.algarveevolution.pt/join-us" rel="noopener">${esc(w.joinCta)}</a></p>
      ${cite(v.join_sources)}
    </div></div>
  </div>
</section>

<section class="sec sec-tint" id="ideas" aria-labelledby="h-ideas">
  <div class="wrap">
    ${head('ideas', '', t(v.try_title), t(v.try_intro), 'laptop')}
    <div class="ideas">${v.apps.map((a, i) => { const p = proposals[a.id]; const href = langPath(a.href, lang); return `<article class="panel idea tone-${['y', 'b'][i]}"><div class="pin">
      <span class="sticker st-prop">${esc(w.proposal)}</span>
      <span class="idea-ic">${icon(appIcon[a.id] || 'laptop')}</span>
      <h3><a href="${esc(href)}">${esc(t(a.name))}</a></h3>
      <p>${esc(t(a.summary))}</p>
      <p class="go" aria-hidden="true">${esc(w.open)} <span>&rarr;</span></p>
      ${p ? cite(p.sources) : ''}
    </div></article>`; }).join('')}</div>
  </div>
</section>`;

  const srcByUrl = new Map(data.sources.sources.map(s => [s.url, s]));
  const sources = `
<section class="sec" id="sources" aria-labelledby="h-sources">
  <div class="wrap">
    <div class="panel src-panel"><div class="pin">
      ${head('sources', '', w.sources, w.sourcesIntro)}
      <ol class="srclist">${used.map(url => { const s = srcByUrl.get(url) || h.source(url); if (!srcByUrl.has(url)) return `<li><a href="${esc(url)}" rel="noopener">${esc(s.publisher)}</a></li>`; return `<li><a href="${esc(url)}" rel="noopener">${esc(s.title)}</a>. ${esc(s.publisher)}${s.published ? `, ${w.published} ${esc(h.date(s.published))}` : ''}${s.read ? `; ${w.read} ${esc(h.date(s.read))}` : ''}.${s.primary?.length ? ` <span class="pc">${w.cites}: ${s.primary.map(u => `<a href="${esc(u)}" rel="noopener">${esc(new URL(u).hostname.replace(/^www\./, '') + new URL(u).pathname.replace(/\/$/, ''))}</a>`).join(', ')}.</span>` : ''}</li>`; }).join('')}</ol>
    </div></div>
  </div>
</section>`;

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Algarve Evolution: ${esc(t(v.tagline))}</title>
<meta name="description" content="${esc(t(v.tagline))}. ${esc(t(v.banner))}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#1f4e9c">
${chrome.head}
<link rel="preload" href="/d/azulejo/fonts/fredoka-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/d/azulejo/fonts/nunito-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/d/azulejo/style.css">
</head>
<body class="az">
${chrome.banner}
<a class="skip" href="#main">${esc(w.skip)}</a>
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="#main"><span class="logo-tile" aria-hidden="true"></span><span>Algarve<br>Evolution</span></a>
    <nav class="nav" aria-label="${esc(w.menu)}"><ul>${w.nav.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join('')}</ul></nav>
    <nav class="apps" aria-label="${esc(h.words.ideas)}">${APPS.map(a => `<a class="app" href="${esc(langPath(a.path, lang))}">${icon(appIcon[a.id] || 'laptop', 'app-ic')}<span>${esc(a.name[lang] || a.name.en)}</span></a>`).join('')}</nav>
  </div>
</header>
<div class="strip" aria-hidden="true"></div>
<main id="main">
${body}
${sources}
</main>
<footer class="foot">
  <div class="strip strip-foot" aria-hidden="true"></div>
  <div class="wrap foot-in">
    <p class="foot-logo"><span class="logo-tile" aria-hidden="true"></span>Algarve Evolution</p>
    <div class="foot-text">
      <p><strong>${esc(t(v.banner))}</strong> <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a>.</p>
      <p>${esc(t(v.footer_disclosure))}</p>
      <p class="small">${w.version} ${esc(chrome.version)} · ${esc(w.licence)} · <a href="#main">${esc(w.top)}</a></p>
      <p class="small foot-langs" role="group" aria-label="${esc(h.words.language)}">${langLinks(h, alt)}</p>
    </div>
  </div>
</footer>
<script src="/d/azulejo/app.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
