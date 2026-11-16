// Writes the static templates of the default design "coast" (src/index.html, src/pt/index.html) from src/data.
// The <!-- data:NAME --> markers are left for scripts/render.mjs. Run from the repository root.
// Owner: sites-design@AgentiCCells.dinis. Code Apache-2.0.
import { writeFileSync } from 'node:fs';
const R = process.cwd();
const { loadData, helpers, chrome } = await import(R + '/scripts/site-data.mjs');
const { timelineItem, partnerItem, algarveMap } = await import(R + '/scripts/designs/corporate.mjs');
const data = loadData('src/data');

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
    dataH: 'Every fact, as data', dataP: 'The figures, programmes, events and proposals on this page are published as files, each item with its sources, in English and Portuguese.',
    peopleKick: 'Our people', peopleTitle: 'Who leads the team',
    srcSummary: 'Sources', srcNote: 'every fact on this page comes from one of these',
    official: 'Our official site is', version: 'Version', licence: 'Code Apache-2.0, text and drawings CC BY 4.0', otherLang: 'Português', desc: "Algarve Evolution's goals, story, partners, work and events, each linked to its source.",
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
    dataH: 'Cada facto, em dados', dataP: 'Os números, programas, eventos e propostas desta página estão publicados em ficheiros, cada item com as suas fontes, em inglês e em português.',
    peopleKick: 'As nossas pessoas', peopleTitle: 'Quem lidera a equipa',
    srcSummary: 'Fontes', srcNote: 'cada facto desta página vem de uma destas',
    official: 'O nosso site oficial é', version: 'Versão', licence: 'Código Apache-2.0, textos e desenhos CC BY 4.0', otherLang: 'English', desc: 'Os objetivos, a história, os parceiros, o trabalho e os eventos da Algarve Evolution, cada um com a sua fonte.',
  },
};

for (const lang of ['en', 'pt']) {
  const h = helpers(data, lang); const { esc, t, cite, date } = h; const v = data.voice; const W = C[lang]; const pt = lang === 'pt';
  const self = pt ? '/pt/' : '/', other = pt ? '/' : '/pt/', otherLang = pt ? 'en' : 'pt';
  const ch = chrome(data, lang, { slug: 'coast', version: '__VERSION__', other });
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
<link rel="alternate" hreflang="${otherLang}" href="${other}">
<link rel="stylesheet" href="/assets/chrome.css">
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
    <a class="lang" href="${other}" hreflang="${otherLang}" lang="${otherLang}">${otherLang.toUpperCase()}</a>
    <nav class="nav" aria-label="${W.sections}">
${W.nav.map(([id, label]) => `      <a href="#${id}">${label}</a>`).join('\n')}
    </nav>
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
${v.goals.map(g => `        <li><strong>${esc((pt && g.value_pt) || g.value)}</strong><span>${esc(t(g.label))}</span></li>`).join('\n')}
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
      <h2 id="h-story">${pt ? 'A nossa história' : 'Our story'}</h2>
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
${v.apps.map(a => `      <li class="try-app"><a class="try-card" href="${pt ? '/pt' : ''}${a.href}">${icon(a.id)}<span class="tag">${W.proposal} · ${W.working}</span><span class="try-name">${esc(t(a.name))}</span><span class="try-sum">${esc(t(a.summary))}</span><span class="try-go">${W.open} <span aria-hidden="true">&rarr;</span></span></a>${cite(propOf(a.id)?.sources)}</li>`).join('\n')}
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
    <p>${W.version} __VERSION__ · <a href="https://dev.vault.sgraph.ai/#sgit_public_read_7ac35a2d04c8f0310df448016f55b0fa5d1f3f813c03c118bb6e1cb6b4eb451f%3Ajg76g6nx">vault jg76g6nx</a> · ${W.licence} · <a href="${other}" hreflang="${otherLang}" lang="${otherLang}">${W.otherLang}</a></p>
  </div>
</footer>
${ch.foot}
</body>
</html>
`;
  writeFileSync(pt ? 'src/pt/index.html' : 'src/index.html', html);
}
console.log('wrote src/index.html and src/pt/index.html');
