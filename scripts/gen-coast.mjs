// Writes the static templates of the default design "coast" (src/index.html, src/pt/, src/es/, src/fr/index.html) from src/data.
// The <!-- data:NAME --> markers are left for scripts/render.mjs. Run from the repository root.
// Owner: sites-design@AgentiCCells.dinis. Code Apache-2.0.
import { writeFileSync, mkdirSync } from 'node:fs';
const R = process.cwd();
const { loadData, localise, helpers, chrome, LANGS, LANG_NAMES, APPS, designPath, langPath } = await import(R + '/scripts/site-data.mjs');
const { timelineItem, partnerItem, algarveMap } = await import(R + '/scripts/designs/corporate.mjs');
const raw = loadData('src/data');

const C = {
  en: {
    title: "Algarve Evolution: building the Algarve's economy beyond tourism", skip: 'Skip to content', sections: 'Sections', top: 'top of page',
    nav: [['goals', 'Goals'], ['story', 'Story'], ['partners', 'Partners'], ['work', 'Work'], ['events', 'Events'], ['try', 'Try it'], ['join', 'Join us']],
    eyebrow: 'Faro, Algarve · since 2018', ctaJoin: 'Join us', ctaTry: 'Try two ideas, working',
    goalsKick: 'Where we are going', goalsIntro: 'Where we want the Algarve to be by 2032.',
    quoteKick: 'From our executive director', role: 'Executive director',
    storyKick: 'Where we come from', trackLabel: 'Our story, 2018 to 2027', planned: 'Planned', swipe: 'Swipe',
    partnersKick: 'Who we work with', partnersTitle: 'Partners and all 16 municipalities', munisH: 'The 16 municipalities',
    munisNote: "Algarve Digital Innovators' communities cover the Algarve's 16 municipalities, the members of AMAL.", mapLabel: 'Map of the Algarve with a dot for each of its 16 municipalities; Faro, where we are based, is ringed',
    workKick: 'What we do', workTitle: 'Our work, on three pillars',
    figKick: 'Where we are now', figTitle: 'In figures', figIntro: 'Our own figures, as reported. Nobody has audited them; where two sources differ, both are shown.',
    evKick: 'Where we meet', evTitle: 'Events', evIntro: 'Days we ran, co-ran or partnered, newest first. All are past; our current calendar is on <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>.',
    tryKick: 'Working prototypes', proposal: 'Proposal', working: 'working prototype', open: 'Open it', oneMore: 'And one more idea',
    joinKick: 'Take part', joinIntro: 'Everything happens through <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>. This prototype takes no sign-ups and keeps no data.',
    dataH: 'Every fact, as data', dataP: 'The figures, programmes, events and proposals on this page are published as files, each item with its sources and its translations.',
    storyTitle: 'Our story', apps: 'Working prototypes', languages: 'This page in',
    peopleKick: 'Our people', peopleTitle: 'Who leads the team',
    srcSummary: 'Sources', srcNote: 'every fact on this page comes from one of these',
    official: 'Our official site is', version: 'Version', licence: 'Code Apache-2.0, text and drawings CC BY 4.0', desc: "Algarve Evolution's goals, story, partners, work and events, each linked to its source.",
  },
  pt: {
    title: 'Algarve Evolution: construir a economia do Algarve para além do turismo', skip: 'Saltar para o conteúdo', sections: 'Secções', top: 'topo da página',
    nav: [['goals', 'Objetivos'], ['story', 'História'], ['partners', 'Parceiros'], ['work', 'Trabalho'], ['events', 'Eventos'], ['try', 'Experimente'], ['join', 'Aderir']],
    eyebrow: 'Faro, Algarve · desde 2018', ctaJoin: 'Junte-se a nós', ctaTry: 'Experimente duas ideias',
    goalsKick: 'Para onde vamos', goalsIntro: 'Onde queremos que o Algarve esteja em 2032.',
    quoteKick: 'Do nosso diretor executivo', role: 'Diretor executivo',
    storyKick: 'De onde vimos', trackLabel: 'A nossa história, 2018 a 2027', planned: 'Previsto', swipe: 'Deslize',
    partnersKick: 'Com quem trabalhamos', partnersTitle: 'Parceiros e os 16 municípios', munisH: 'Os 16 municípios',
    munisNote: 'As comunidades da Algarve Digital Innovators cobrem os 16 municípios do Algarve, os membros da AMAL.', mapLabel: 'Mapa do Algarve com um ponto por cada um dos seus 16 municípios; Faro, onde estamos sediados, tem um círculo',
    workKick: 'O que fazemos', workTitle: 'O nosso trabalho, em três pilares',
    figKick: 'Onde estamos hoje', figTitle: 'Em números', figIntro: 'Os nossos próprios números, tal como foram noticiados. Ninguém os auditou; quando duas fontes diferem, mostramos ambas.',
    evKick: 'Onde nos encontramos', evTitle: 'Eventos', evIntro: 'Dias que organizámos, coorganizámos ou apoiámos como parceiros, do mais recente para o mais antigo. Todos já passaram; o calendário atual está em <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>.',
    tryKick: 'Protótipos a funcionar', proposal: 'Proposta', working: 'protótipo a funcionar', open: 'Abrir', oneMore: 'E mais uma ideia',
    joinKick: 'Participar', joinIntro: 'Tudo acontece através de <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>. Este protótipo não recolhe inscrições nem guarda dados.',
    dataH: 'Cada facto, em dados', dataP: 'Os números, programas, eventos e propostas desta página estão publicados em ficheiros, cada item com as suas fontes e as suas traduções.',
    storyTitle: 'A nossa história', apps: 'Protótipos a funcionar', languages: 'Esta página em',
    peopleKick: 'As nossas pessoas', peopleTitle: 'Quem lidera a equipa',
    srcSummary: 'Fontes', srcNote: 'cada facto desta página vem de uma destas',
    official: 'O nosso site oficial é', version: 'Versão', licence: 'Código Apache-2.0, textos e desenhos CC BY 4.0', desc: 'Os objetivos, a história, os parceiros, o trabalho e os eventos da Algarve Evolution, cada um com a sua fonte.',
  },
  es: {
    title: 'Algarve Evolution: construir la economía del Algarve más allá del turismo', skip: 'Saltar al contenido', sections: 'Secciones', top: 'inicio de la página',
    nav: [['goals', 'Objetivos'], ['story', 'Historia'], ['partners', 'Socios'], ['work', 'Trabajo'], ['events', 'Eventos'], ['try', 'Pruébelo'], ['join', 'Únase']],
    eyebrow: 'Faro, Algarve · desde 2018', ctaJoin: 'Únase a nosotros', ctaTry: 'Pruebe dos ideas en funcionamiento',
    goalsKick: 'Hacia dónde vamos', goalsIntro: 'Dónde queremos que esté el Algarve en 2032.',
    quoteKick: 'De nuestro director ejecutivo', role: 'Director ejecutivo',
    storyKick: 'De dónde venimos', trackLabel: 'Nuestra historia, de 2018 a 2027', planned: 'Previsto', swipe: 'Deslice',
    partnersKick: 'Con quién trabajamos', partnersTitle: 'Socios y los 16 municipios', munisH: 'Los 16 municipios',
    munisNote: 'Las comunidades de Algarve Digital Innovators cubren los 16 municipios del Algarve, miembros de AMAL.', mapLabel: 'Mapa del Algarve con un punto por cada uno de sus 16 municipios; Faro, donde tenemos nuestra sede, está rodeado con un círculo',
    workKick: 'Lo que hacemos', workTitle: 'Nuestro trabajo, en tres pilares',
    figKick: 'Dónde estamos hoy', figTitle: 'En cifras', figIntro: 'Nuestras propias cifras, tal como se publicaron. Nadie las ha auditado; cuando dos fuentes difieren, mostramos ambas.',
    evKick: 'Dónde nos encontramos', evTitle: 'Eventos', evIntro: 'Jornadas que organizamos, coorganizamos o apoyamos como socios, de la más reciente a la más antigua. Todas han pasado ya; nuestro calendario actual está en <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>.',
    tryKick: 'Prototipos en funcionamiento', proposal: 'Propuesta', working: 'prototipo en funcionamiento', open: 'Abrir', oneMore: 'Y una idea más',
    joinKick: 'Participar', joinIntro: 'Todo pasa por <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>. Este prototipo no recoge inscripciones ni guarda datos.',
    dataH: 'Cada dato, en archivos', dataP: 'Las cifras, programas, eventos y propuestas de esta página están publicados en archivos, cada elemento con sus fuentes y sus traducciones.',
    storyTitle: 'Nuestra historia', apps: 'Prototipos en funcionamiento', languages: 'Esta página en',
    peopleKick: 'Nuestro equipo', peopleTitle: 'Quién dirige el equipo',
    srcSummary: 'Fuentes', srcNote: 'cada dato de esta página procede de una de ellas',
    official: 'Nuestro sitio oficial es', version: 'Versión', licence: 'Código Apache-2.0, textos y dibujos CC BY 4.0', desc: 'Los objetivos, la historia, los socios, el trabajo y los eventos de Algarve Evolution, cada uno con su fuente.',
  },
  fr: {
    title: 'Algarve Evolution\u00a0: bâtir l\'économie de l\'Algarve au-delà du tourisme', skip: 'Aller au contenu', sections: 'Sections', top: 'haut de page',
    nav: [['goals', 'Objectifs'], ['story', 'Histoire'], ['partners', 'Partenaires'], ['work', 'Action'], ['events', 'Événements'], ['try', 'Essayer'], ['join', 'Adhérer']],
    eyebrow: 'Faro, Algarve · depuis 2018', ctaJoin: 'Rejoignez-nous', ctaTry: 'Essayez deux idées en action',
    goalsKick: 'Où nous allons', goalsIntro: 'Là où nous voulons que l\'Algarve soit en 2032.',
    quoteKick: 'De notre directeur exécutif', role: 'Directeur exécutif',
    storyKick: 'D\'où nous venons', trackLabel: 'Notre histoire, de 2018 à 2027', planned: 'Prévu', swipe: 'Faites glisser',
    partnersKick: 'Avec qui nous travaillons', partnersTitle: 'Nos partenaires et les 16 communes', munisH: 'Les 16 communes',
    munisNote: 'Les communautés d\'Algarve Digital Innovators couvrent les 16 communes de l\'Algarve, membres de l\'AMAL.', mapLabel: 'Carte de l\'Algarve avec un point pour chacune de ses 16 communes\u00a0; Faro, où nous sommes installés, est entouré',
    workKick: 'Ce que nous faisons', workTitle: 'Notre action, en trois piliers',
    figKick: 'Où nous en sommes', figTitle: 'En chiffres', figIntro: 'Nos propres chiffres, tels que publiés. Personne ne les a audités\u00a0; quand deux sources divergent, nous montrons les deux.',
    evKick: 'Où nous nous retrouvons', evTitle: 'Événements', evIntro: 'Les journées que nous avons organisées, coorganisées ou soutenues comme partenaire, de la plus récente à la plus ancienne. Toutes sont passées\u00a0; notre agenda actuel est sur <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>.',
    tryKick: 'Prototypes en état de marche', proposal: 'Proposition', working: 'prototype en état de marche', open: 'Ouvrir', oneMore: 'Et une idée de plus',
    joinKick: 'Participer', joinIntro: 'Tout se passe sur <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>. Ce prototype ne prend aucune inscription et ne conserve aucune donnée.',
    dataH: 'Chaque fait, en données', dataP: 'Les chiffres, programmes, événements et propositions de cette page sont publiés sous forme de fichiers, chaque élément avec ses sources et ses traductions.',
    storyTitle: 'Notre histoire', apps: 'Prototypes en état de marche', languages: 'Cette page en',
    peopleKick: 'Notre équipe', peopleTitle: 'Qui dirige l\'équipe',
    srcSummary: 'Sources', srcNote: 'chaque fait de cette page vient de l\'une d\'elles',
    official: 'Notre site officiel est', version: 'Version', licence: 'Code Apache-2.0, textes et dessins CC BY 4.0', desc: 'Les objectifs, l\'histoire, les partenaires, l\'action et les événements d\'Algarve Evolution, chacun avec sa source.',
  },
};

const alt = Object.fromEntries(LANGS.map(l => [l, designPath('coast', l)]));
for (const lang of LANGS) {
  const data = localise(raw, lang); // k_<lang> fields replace k, so data text is in this language where it has been translated
  const h = helpers(data, lang); const { esc, t, cite, date } = h; const v = data.voice; const W = C[lang] || C.en;
  const self = alt[lang];
  const ch = chrome(data, lang, { slug: 'coast', version: '__VERSION__', alt });
  const appLinks = APPS.map((a, i) => `<a class="nav-app" href="${esc(langPath(a.path, lang))}"><span class="nav-app-n" aria-hidden="true">${i + 1}</span>${esc(a.name[lang] || a.name.en)}</a>`).join('');
  const langLinks = LANGS.map(l => l === lang ? `<span aria-current="true">${esc(LANG_NAMES[l])}</span>` : `<a href="${esc(alt[l])}" hreflang="${l}" lang="${l}">${esc(LANG_NAMES[l])}</a>`).join(' · ');
  const person = data.people.people[0], quote = data.people.quotes.find(q => q.by === person.id);
  const fig = id => data.figures.figures.find(f => f.id === id);
  const timeline = data.ecosystem.timeline.map(e => timelineItem(e, lang));
  const partners = data.ecosystem.nodes.filter(n => n.kind === 'partner').map(n => partnerItem(n, lang));
  const props = data.proposals.proposals, propOf = id => props.find(p => p.id === id);
  const extra = props.filter(p => !v.apps.some(a => a.id === p.id));
  const munis = data.places.municipalities.map(m => m.name).sort((a, b) => a.localeCompare(b, 'pt'));
  const n = i => String(i).padStart(2, '0');
  let sec = 0; const kick = text => `<p class="kick"><span class="kick-n">${n(++sec)}</span>${text}</p>`;
  const icon = id => id === 'talent-map'
    ? `<svg class="try-ico" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 44 C 18 38 28 46 40 40 S 54 34 58 36 V 58 H6Z" fill="var(--sea-2)" opacity=".25"/><circle cx="20" cy="26" r="5" fill="var(--ochre)"/><circle cx="40" cy="18" r="5" fill="var(--sea-2)"/><circle cx="46" cy="34" r="5" fill="var(--sun)"/><path d="M20 26 L40 18 L46 34 L20 26" stroke="var(--ink)" stroke-width="1.6" fill="none" opacity=".55"/></svg>`
    : `<svg class="try-ico" viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="12" width="30" height="36" rx="3" fill="none" stroke="var(--ink)" stroke-width="1.8" opacity=".6"/><path d="M6 24 H36 M6 36 H36 M18 12 V48" stroke="var(--ink)" stroke-width="1.4" opacity=".45"/><path d="M38 30 h8 m-4 -4 l4 4 l-4 4" stroke="var(--ochre)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="48" y="16" width="12" height="28" rx="3" fill="var(--sea-2)"/><rect x="50.5" y="21" width="7" height="3" rx="1" fill="#fff"/><rect x="50.5" y="27" width="7" height="3" rx="1" fill="#fff" opacity=".7"/></svg>`;

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(W.title)}</title>
<meta name="description" content="${esc(W.desc)} ${esc(t(v.banner))}">
${ch.head}
<link rel="stylesheet" href="/style.css">
<meta name="theme-color" content="#0b3954">
</head>
<body>
<!-- Static template of the default design "coast". The banner and the script before </body> match scripts/site-data.mjs chrome(). -->
${ch.banner}
<a class="skip" href="#main">${W.skip}</a>

<header class="top">
  <div class="wrap">
    <a class="brand" href="${self}" aria-label="Algarve Evolution, ${W.top}">
      <svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="13" r="7" fill="#f2a65a"/><path d="M2 21c4-2 8 2 14 0s10-2 14 0v9H2z" fill="#1f7a8c"/><path d="M2 25c4-2 8 2 14 0s10-2 14 0" stroke="#bfe3e8" stroke-width="1.5" fill="none"/></svg>
      Algarve Evolution
    </a>
    <nav class="nav" aria-label="${W.sections}">
${W.nav.map(([id, label]) => `      <a href="#${id}">${label}</a>`).join('\n')}
    </nav>
    <nav class="nav-apps" aria-label="${W.apps}">${appLinks}</nav>
  </div>
</header>

<main id="main">

<div class="hero">
  <div class="wrap">
    <div class="hero-copy">
      <p class="eyebrow">${W.eyebrow}</p>
      <h1>${esc(t(v.tagline))}</h1>
      <p class="lede">${esc(t(v.hero_lede))}</p>
      <div class="cta">
        <a class="btn btn-primary" href="#join">${W.ctaJoin}</a>
        <a class="btn btn-ghost" href="#try">${W.ctaTry}</a>
      </div>
      ${cite(['psn', ...fig('founded').sources], 'src hero-src')}
    </div>
  </div>
  <img class="hero-art" src="/assets/coast.svg" alt="">
</div>

<section id="goals" class="band goals" aria-labelledby="h-goals">
  <div class="wrap goals-grid">
    <div class="goals-main">
      ${kick(W.goalsKick)}
      <h2 id="h-goals">${esc(t(v.goals_title))}</h2>
      <p class="intro">${W.goalsIntro}</p>
      <ul class="goal-list">
${v.goals.map(g => `        <li><strong>${esc(g.value)}</strong><span>${esc(t(g.label))}</span></li>`).join('\n')}
      </ul>
      <p class="goal-note">${esc(t(v.goals_note))}</p>
      ${cite(v.goals_sources)}
    </div>
    <figure class="quote">
      <p class="quote-kick">${W.quoteKick}</p>
      <blockquote><p>${esc(t(quote.text))}</p></blockquote>
      <figcaption><span class="mono" aria-hidden="true">AG</span><span><strong>${esc(person.name)}</strong><br>${esc(t(person.role))}, ${esc(date(quote.date))}</span></figcaption>
      ${quote.translation_note?.[lang] ? `<p class="tnote">${esc(quote.translation_note[lang])}</p>` : ''}
      ${cite(quote.sources)}
    </figure>
  </div>
</section>

<section id="story" class="band alt story-band" aria-labelledby="h-story">
  <div class="wrap story-grid">
    <div class="story-head">
      ${kick(W.storyKick)}
      <h2 id="h-story">${W.storyTitle}</h2>
      <p class="intro">${esc(t(v.story_intro))}</p>
      ${cite(v.story_sources)}
      <p class="swipe" aria-hidden="true">${W.swipe} &rarr;</p>
    </div>
    <ol class="story" tabindex="0" aria-label="${W.trackLabel}">
${timeline.map(e => `      <li class="st${e.future ? ' st-future' : ''}"><p class="st-when">${esc(e.when)}${e.future ? ` · ${W.planned}` : ''}</p><div class="st-body"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${e.stat ? `<p class="st-stat">${esc(e.stat)}</p>` : ''}${cite(e.src)}</div></li>`).join('\n')}
    </ol>
  </div>
</section>

<section id="partners" class="band" aria-labelledby="h-partners">
  <div class="wrap">
    ${kick(W.partnersKick)}
    <h2 id="h-partners">${W.partnersTitle}</h2>
    <p class="intro">${esc(t(v.network_intro))}</p>
    ${cite('adi', 'src intro-src')}
    <div class="partners-grid">
      <ul class="partners">
${partners.map(p => `        <li><p class="pt-name">${esc(p.label)}</p><p class="pt-note">${esc(p.note)}</p>${cite(p.src)}</li>`).join('\n')}
      </ul>
      <figure class="munis">
        ${algarveMap(data.places, { w: 520, cls: 'map', label: W.mapLabel, id: 'cm', hqLabel: 'Faro' })}
        <figcaption>
          <h3>${W.munisH}</h3>
          <p class="munis-list">${munis.map(m => `<span>${esc(m)}</span>`).join(' ')}</p>
          <p class="munis-note">${W.munisNote}</p>
          ${cite(['adi', data.places.municipalities_source])}
        </figcaption>
      </figure>
    </div>
  </div>
</section>

<section id="work" class="band alt" aria-labelledby="h-work">
  <div class="wrap">
    ${kick(W.workKick)}
    <h2 id="h-work">${W.workTitle}</h2>
    <p class="intro">${esc(t(v.pillars_intro))}</p>
    <p class="swipe" aria-hidden="true">${W.swipe} &rarr;</p>
    <div class="pillars" tabindex="0" role="region" aria-label="${W.workTitle}">
<!-- data:programmes -->
    </div>
  </div>
</section>

<section id="figures" class="band" aria-labelledby="h-figures">
  <div class="wrap">
    ${kick(W.figKick)}
    <h2 id="h-figures">${W.figTitle}</h2>
    <p class="intro">${W.figIntro}</p>
<!-- data:figures -->
  </div>
</section>

<section id="events" class="band alt" aria-labelledby="h-events">
  <div class="wrap">
    ${kick(W.evKick)}
    <h2 id="h-events">${W.evTitle}</h2>
    <p class="intro">${W.evIntro}</p>
    <p class="swipe swipe-sm" aria-hidden="true">${W.swipe} &rarr;</p>
<!-- data:events -->
  </div>
</section>

<section id="try" class="band try" aria-labelledby="h-try">
  <div class="wrap">
    ${kick(W.tryKick)}
    <h2 id="h-try">${esc(t(v.try_title))}</h2>
    <p class="intro">${esc(t(v.try_intro))}</p>
    <ul class="try-list">
${v.apps.map(a => `      <li class="try-app"><a class="try-card" href="${esc(langPath(a.href, lang))}">${icon(a.id)}<span class="tag">${W.proposal} · ${W.working}</span><span class="try-name">${esc(t(a.name))}</span><span class="try-sum">${esc(t(a.summary))}</span><span class="try-go">${W.open} <span aria-hidden="true">&rarr;</span></span></a>${cite(propOf(a.id)?.sources)}</li>`).join('\n')}
${extra.map(p => `      <li class="try-idea"><p class="try-more">${W.oneMore}</p><p class="tag">${W.proposal}</p><h3>${esc(t(p.name))}</h3><p>${esc(t(p.summary))}</p>${cite(p.sources)}</li>`).join('\n')}
    </ul>
  </div>
</section>

<section id="join" class="band alt" aria-labelledby="h-join">
  <div class="wrap join">
    <div>
      ${kick(W.joinKick)}
      <h2 id="h-join">${esc(t(v.join_title))}</h2>
      <p class="intro">${W.joinIntro}</p>
      <ol class="steps">
${v.join.map(j => `        <li>${esc(t(j))}</li>`).join('\n')}
      </ol>
      ${cite(v.join_sources)}
    </div>
    <aside class="panel" aria-label="${W.dataH}">
      <h3>${W.dataH}</h3>
      <p>${W.dataP}</p>
      <ul class="chips">
${['figures', 'programmes', 'events', 'proposals', 'sources'].map(f => `        <li><a href="/data/${f}.json">${f}</a></li>`).join('\n')}
      </ul>
    </aside>
  </div>
</section>

<section id="people" class="band" aria-labelledby="h-people">
  <div class="wrap people">
    ${kick(W.peopleKick)}
    <h2 id="h-people">${W.peopleTitle}</h2>
    <div class="person">
      <span class="mono mono-lg" aria-hidden="true">AG</span>
      <div>
        <h3>${esc(person.name)}</h3>
        <p class="person-role">${esc(t(person.role))}</p>
        <p>${esc(t(person.summary))}</p>
        ${cite(person.sources)}
      </div>
    </div>
  </div>
</section>

<section id="sources" class="band alt sources-band" aria-labelledby="h-sources">
  <div class="wrap">
    <details>
      <summary><h2 id="h-sources">${W.srcSummary} <span>${W.srcNote} (${data.sources.sources.length})</span></h2></summary>
<!-- data:sources -->
    </details>
  </div>
</section>

</main>

<footer>
  <div class="wrap">
    <p class="prep">${esc(t(v.banner))}</p>
    <p>${esc(t(v.footer_disclosure))}</p>
    <p>${W.official} <a href="https://www.algarveevolution.pt/">algarveevolution.pt</a>.</p>
    <p>${W.version} __VERSION__ · <a href="https://dev.vault.sgraph.ai/#sgit_public_read_7ac35a2d04c8f0310df448016f55b0fa5d1f3f813c03c118bb6e1cb6b4eb451f%3Ajg76g6nx">vault jg76g6nx</a> · ${W.licence}</p>
    <p class="foot-langs">${W.languages}: ${langLinks}</p>
  </div>
</footer>
${ch.foot}
</body>
</html>
`;
  const file = lang === 'en' ? 'src/index.html' : `src/${lang}/index.html`;
  if (lang !== 'en') mkdirSync(`src/${lang}`, { recursive: true });
  writeFileSync(file, html);
}
console.log(`wrote the coast template in ${LANGS.length} languages: ${LANGS.map(l => (l === 'en' ? 'src/index.html' : `src/${l}/index.html`)).join(', ')}`);
