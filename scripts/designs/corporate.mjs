// "The Institution": Algarve Evolution as a regional development agency would present itself.
// Navy and white, one vermilion accent, a 12-column grid, a KPI band, report-style endnotes.
// Owner: sites-design@AgentiCCells.dinis. Code Apache-2.0; text CC BY 4.0.
// Every fact comes from src/data/*.json and carries its source through h.cite().
// The Portuguese wording for the ecosystem timeline and partner notes (which the data holds in English only)
// is exported for the default design too; it translates, it adds no facts.

export const meta = {
  slug: 'corporate', order: 2, group: 'classic',
  name: { en: 'The Institution', pt: 'A Instituição' },
  tagline: { en: 'Corporate, clear, annual-report grade', pt: 'Corporativo, claro, ao nível de um relatório anual' },
};

// Timeline entries in our own voice, keyed by the entry's t value in ecosystem.json. Unknown entries fall back to the data.
export const TIMELINE = {
  2018: { when: { pt: '2018' }, title: { en: 'The community begins', pt: 'A comunidade começa' },
    text: { en: 'A small group of local entrepreneurs starts building the region\'s innovation community (our own account, as reported in 2026).', pt: 'Um pequeno grupo de empresários locais começa a construir a comunidade de inovação da região (o nosso próprio relato, noticiado em 2026).' } },
  2019.7: { when: { pt: '12 set 2019' }, title: { en: 'Officially presented in Faro', pt: 'Apresentação oficial em Faro' },
    text: { en: 'At the Centro Ciência Viva do Algarve: a non-profit association of about 29 ICT companies, aiming at critical mass and one voice at events such as Web Summit.', pt: 'No Centro Ciência Viva do Algarve: uma associação sem fins lucrativos de cerca de 29 empresas de TIC, em busca de massa crítica e de uma só voz em eventos como a Web Summit.' },
    stat: { en: 'about 29 ICT companies', pt: 'cerca de 29 empresas de TIC' } },
  2022.25: { when: { pt: '28 mar a 3 abr 2022' }, title: { en: 'The first Algarve Tech Hub Summit', pt: 'A primeira Algarve Tech Hub Summit' },
    text: { en: 'Hybrid, in Faro and Loulé; we were one of about twelve promoting entities, with Algarve STP and the University of the Algarve.', pt: 'Híbrida, em Faro e Loulé; fomos uma de cerca de doze entidades promotoras, com o Algarve STP e a Universidade do Algarve.' } },
  2024.42: { when: { pt: '1 jun 2024' }, title: { en: 'Impact Algarve', pt: 'Impact Algarve' },
    text: { en: 'Organised by Get Real and us at the University of the Algarve\'s Tec Campus, Faro (the year is inferred from the page).', pt: 'Organizado pela Get Real e por nós no Tec Campus da Universidade do Algarve, em Faro (o ano é deduzido da página).' } },
  2024.53: { when: { pt: '11 jul 2024' }, title: { en: 'A president elected for 2024 to 2027', pt: 'Um presidente eleito para 2024 a 2027' },
    text: { en: 'Our members elect a president for 2024 to 2027, after the outgoing president.', pt: 'Os nossos membros elegem um presidente para 2024 a 2027, sucedendo ao presidente cessante.' },
    stat: { en: 'about 70 companies and individuals', pt: 'cerca de 70 empresas e particulares' } },
  2024.8: { when: { pt: '23 a 25 out 2024' }, title: { en: 'The Summit in Albufeira', pt: 'A Summit em Albufeira' },
    text: { en: 'Algarve Tech Hub Summit at Hotel Alisios, Albufeira.', pt: 'Algarve Tech Hub Summit no Hotel Alisios, em Albufeira.' } },
  2025.68: { when: { pt: 'set 2025' }, title: { en: 'Algarve Digital Innovators launched', pt: 'Lançamento da Algarve Digital Innovators' },
    text: { en: 'Launched in Lagos, with a roadshow from September to November 2025.', pt: 'Lançada em Lagos, com um roadshow de setembro a novembro de 2025.' } },
  2025.85: { when: { pt: '6 a 7 nov 2025' }, title: { en: 'The Summit in Lagos', pt: 'A Summit em Lagos' },
    text: { en: 'Algarve Tech Hub Summit, with over 500 participants reported (a headline only was read).', pt: 'Algarve Tech Hub Summit, com mais de 500 participantes noticiados (só foi lido o título).' } },
  2025.87: { when: { pt: '10 a 13 nov 2025' }, title: { en: '24 Algarve startups at Web Summit', pt: '24 startups do Algarve na Web Summit' },
    text: { en: 'We are a named partner of the project that takes them to Web Summit Lisbon.', pt: 'Somos parceiros nomeados do projeto que as leva à Web Summit Lisboa.' } },
  2025.97: { when: { pt: 'final de 2025' }, title: { en: 'Wrap Party in Faro', pt: 'Wrap Party em Faro' },
    text: { en: 'Recaps the Algarve\'s November series, from Buildathon to Web Summit.', pt: 'Recapitula a série de novembro no Algarve, do Buildathon à Web Summit.' } },
  2026.05: { when: { pt: 'jan 2026' }, title: { en: 'Our incubator recognised', pt: 'A nossa incubadora reconhecida' },
    text: { en: 'Recognised by Startup Portugal.', pt: 'Reconhecida pela Startup Portugal.' } },
  2026.55: { when: { pt: 'jul 2026' }, title: { en: 'Venture Lab and the 2030 plan', pt: 'Venture Lab e o plano 2030' },
    text: { en: 'Venture Lab by AlgarveSTP selects 12 companies (10 July); the Algarve Digital Innovators 2030 plan names 24 communities.', pt: 'O Venture Lab by AlgarveSTP seleciona 12 empresas (10 de julho); o plano 2030 da Algarve Digital Innovators prevê 24 comunidades.' } },
  2026.8: { when: { pt: 'out 2026' }, title: { en: 'Founder2Founder launched', pt: 'Lançamento do Founder2Founder' },
    text: { en: '8 companies chosen from 41 applications.', pt: '8 empresas escolhidas entre 41 candidaturas.' } },
  2026.86: { when: { pt: '5 a 7 nov 2026' }, title: { en: 'A week in the Algarve', pt: 'Uma semana no Algarve' },
    text: { en: 'TMCT\'26 in Portimão (5 to 7), the Private Wealth gathering in Almancil (6) and DevFest Lagos (7): the first two are on our calendar, and we are a partner of the third.', pt: 'O TMCT\'26 em Portimão (5 a 7), o encontro Private Wealth em Almancil (6) e o DevFest Lagos (7): os dois primeiros estão no nosso calendário e somos parceiros do terceiro.' },
    stat: { en: '118 active members', pt: '118 membros ativos' } },
  2027.3: { when: { pt: '2027' }, title: { en: 'The Tech Hub Summit returns', pt: 'A Tech Hub Summit regressa' },
    text: { en: 'Confirmed to return; dates and venue not announced.', pt: 'Regresso confirmado; datas e local por anunciar.' } },
};

export const PARTNERS = {
  ualg: { label: { en: 'University of the Algarve', pt: 'Universidade do Algarve' },
    note: { en: 'Partner in Algarve Digital Innovators, the Tech Hub Summit and our education work; lead promoter of the 2025 Web Summit project.', pt: 'Parceira na Algarve Digital Innovators, na Tech Hub Summit e no nosso trabalho de educação; promotora principal do projeto Web Summit 2025.' } },
  stp: { label: { en: 'Algarve STP', pt: 'Algarve STP' },
    note: { en: 'Science and technology park; partner in Algarve Digital Innovators, Venture Lab, the Tech Hub Summit and the 2025 Web Summit project.', pt: 'Parque de ciência e tecnologia; parceiro na Algarve Digital Innovators, no Venture Lab, na Tech Hub Summit e no projeto Web Summit 2025.' } },
  amal: { label: { en: 'AMAL', pt: 'AMAL' },
    note: { en: 'The Algarve\'s intermunicipal community; partner in Algarve Digital Innovators, Venture Lab and the 2025 Web Summit project.', pt: 'A comunidade intermunicipal do Algarve; parceira na Algarve Digital Innovators, no Venture Lab e no projeto Web Summit 2025.' } },
  nera: { label: { en: 'NERA', pt: 'NERA' },
    note: { en: 'Business association of the Algarve; partner in Algarve Digital Innovators, Venture Lab and the 2025 Web Summit project.', pt: 'Associação empresarial do Algarve; parceira na Algarve Digital Innovators, no Venture Lab e no projeto Web Summit 2025.' } },
  anje: { label: { en: 'ANJE', pt: 'ANJE' },
    note: { en: 'National association of young entrepreneurs; partner in Algarve Digital Innovators and Venture Lab; ran the 2025 Web Summit competition.', pt: 'Associação nacional de jovens empresários; parceira na Algarve Digital Innovators e no Venture Lab; organizou o concurso Web Summit 2025.' } },
  ja: { label: { en: 'Junior Achievement Portugal', pt: 'Junior Achievement Portugal' },
    note: { en: 'Runs "The Company" with our education work.', pt: 'Dinamiza "A Empresa" com o nosso trabalho de educação.' } },
  startupPt: { label: { en: 'Startup Portugal', pt: 'Startup Portugal' },
    note: { en: 'Recognised our incubator in January 2026.', pt: 'Reconheceu a nossa incubadora em janeiro de 2026.' } },
  gdg: { label: { en: 'Google Developer Group Lagos', pt: 'Google Developer Group Lagos' },
    note: { en: 'Organiser of DevFest Lagos 2026, where we are a partner.', pt: 'Organizador do DevFest Lagos 2026, de que somos parceiros.' } },
};

export const timelineItem = (e, lang) => {
  const x = TIMELINE[e.t] || {};
  const pick = (o, fb) => (o && (o[lang] ?? o.en)) || fb;
  return { when: lang === 'pt' ? pick(x.when, e.when) : e.when, title: pick(x.title, e.title), text: pick(x.text, e.text), stat: e.stat ? pick(x.stat, e.stat) : '', src: e.src, future: !!e.future, year: String(Math.floor(e.t)) };
};
export const partnerItem = (n, lang) => {
  const x = PARTNERS[n.id] || {};
  return { id: n.id, label: x.label?.[lang] || n.label, note: x.note?.[lang] || n.note, src: n.src };
};

// A stylised Algarve: the coastline and border from places.json and a dot for each of the 16 municipalities.
export function algarveMap(places, { w = 600, cls = 'map', label = '', hq = 'faro', hqLabel = 'Faro', id = 'am' } = {}) {
  const lon0 = -9.08, lon1 = -7.22, lat0 = 36.9, lat1 = 37.78, k = Math.cos(37.2 * Math.PI / 180);
  const sx = w / ((lon1 - lon0) * k), h = Math.round((lat1 - lat0) * sx);
  const P = ([lon, lat]) => [+((lon - lon0) * k * sx).toFixed(1), +((lat1 - lat) * sx).toFixed(1)];
  const ring = r => 'M' + r.map(p => P(p).join(' ')).join('L') + 'Z';
  const path = c => (places.outline.countries[c] || []).map(pg => pg.map(ring).join('')).join('');
  const r = +(w / 150).toFixed(1);
  const dots = places.municipalities.map(m => { const [x, y] = P(m.ll); return m.id === hq
    ? `<g class="map-hq"><circle cx="${x}" cy="${y}" r="${r * 2.6}" class="map-ring"/><circle cx="${x}" cy="${y}" r="${r * 1.3}"/><text x="${x + r * 3.6}" y="${y + r * 3.4}">${hqLabel}</text></g>`
    : `<circle cx="${x}" cy="${y}" r="${r}"><title>${m.name}</title></circle>`; }).join('');
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><defs>` +
    `<pattern id="${id}-d" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.25" class="map-dot"/></pattern>` +
    `<pattern id="${id}-e" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r=".8" class="map-dot-es"/></pattern>` +
    `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
    `<mask id="${id}-m"><rect width="${w}" height="${h}" fill="url(#${id}-g)"/></mask></defs>` +
    `<g mask="url(#${id}-m)"><path class="map-es" fill="url(#${id}-e)" d="${path('Spain')}"/><path class="map-pt" fill="url(#${id}-d)" d="${path('Portugal')}"/></g>` +
    `<g class="map-dots">${dots}</g></svg>`;
}

const L = {
  en: {
    skip: 'Skip to content', nav: 'Sections', overview: 'Overview',
    kpi: 'Key figures', mission: 'Mission', leadership: 'Leadership', programmes: 'Programmes', history: 'History', network: 'Network', events: 'Events', prototypes: 'Prototypes', join: 'Join', notes: 'Sources',
    place: 'Faro, Portugal', since: 'A non-profit association since 2018', mapLabel: 'Map of the Algarve with a dot for each of its 16 municipalities',
    results: 'As reported', resultsNote: 'Our own figures, as reported. Nobody has audited them; where two sources differ, both are shown.',
    targets: 'Targets for 2032', kickers: { founded: 'Founded', members: 'Members', jobs: 'Jobs', events: 'Events', communities: 'Communities' },
    missionKicker: 'Our mandate', leadKicker: 'Leadership', role: 'Executive director', quoteOn: 'On the 2032 goals', said: 'Written',
    pillarsTitle: 'Three pillars of work', swipe: 'Swipe for all three', prog: n => `${n} programme${n === 1 ? '' : 's'}`,
    historyTitle: 'Our story', prev: 'Earlier', next: 'Later', trackLabel: 'Timeline, 2018 to 2027', future: 'Planned',
    networkTitle: 'Partners and places', partnersH: 'Partners', munisH: 'All 16 municipalities',
    munisNote: 'Algarve Digital Innovators\' communities cover the Algarve\'s 16 municipalities, the members of AMAL.',
    eventsTitle: 'Events', eventsIntro: 'Days we ran, co-ran or partnered, newest first. All are past; our current calendar is on algarveevolution.pt.',
    th: ['Date', 'Event', 'Place', 'Summary'], about: 'about',
    protoKicker: 'Prototypes', oneMore: 'And one more idea', proposal: 'Proposal', working: 'Working prototype', open: 'Open the prototype',
    joinKicker: 'Membership',
    notesTitle: 'Notes and sources', notesIntro: 'Every fact on this page links to one of these. Read dates are when the source was checked.', published: 'published', read: 'read', cites: 'cites',
    official: 'The official site is', version: 'Version', licence: 'Code Apache-2.0; text and drawings CC BY 4.0.', top: 'Back to top',
  },
  pt: {
    skip: 'Saltar para o conteúdo', nav: 'Secções', overview: 'Visão geral',
    kpi: 'Números', mission: 'Missão', leadership: 'Direção', programmes: 'Programas', history: 'História', network: 'Rede', events: 'Eventos', prototypes: 'Protótipos', join: 'Aderir', notes: 'Fontes',
    place: 'Faro, Portugal', since: 'Uma associação sem fins lucrativos desde 2018', mapLabel: 'Mapa do Algarve com um ponto por cada um dos seus 16 municípios',
    results: 'Segundo as notícias', resultsNote: 'Os nossos próprios números, tal como foram noticiados. Ninguém os auditou; quando duas fontes diferem, mostramos ambas.',
    targets: 'Metas para 2032', kickers: { founded: 'Fundação', members: 'Membros', jobs: 'Emprego', events: 'Eventos', communities: 'Comunidades' },
    missionKicker: 'A nossa missão', leadKicker: 'Direção', role: 'Diretor executivo', quoteOn: 'Sobre os objetivos para 2032', said: 'Escrito a',
    pillarsTitle: 'Três pilares de trabalho', swipe: 'Deslize para ver os três', prog: n => `${n} programa${n === 1 ? '' : 's'}`,
    historyTitle: 'A nossa história', prev: 'Anterior', next: 'Seguinte', trackLabel: 'Cronologia, 2018 a 2027', future: 'Previsto',
    networkTitle: 'Parceiros e territórios', partnersH: 'Parceiros', munisH: 'Os 16 municípios',
    munisNote: 'As comunidades da Algarve Digital Innovators cobrem os 16 municípios do Algarve, os membros da AMAL.',
    eventsTitle: 'Eventos', eventsIntro: 'Dias que organizámos, coorganizámos ou apoiámos como parceiros, do mais recente para o mais antigo. Todos já passaram; o calendário atual está em algarveevolution.pt.',
    th: ['Data', 'Evento', 'Local', 'Resumo'], about: 'cerca de',
    protoKicker: 'Protótipos', oneMore: 'E mais uma ideia', proposal: 'Proposta', working: 'Protótipo a funcionar', open: 'Abrir o protótipo',
    joinKicker: 'Adesão',
    notesTitle: 'Notas e fontes', notesIntro: 'Cada facto desta página liga a uma destas fontes. A data de leitura é quando a fonte foi verificada.', published: 'publicado a', read: 'lido a', cites: 'cita',
    official: 'O site oficial é', version: 'Versão', licence: 'Código Apache-2.0; textos e desenhos CC BY 4.0.', top: 'Voltar ao topo',
  },
};

export function render({ lang, data, h, chrome, other }) {
  const { esc, t, cite, date } = h; const v = data.voice; const W = L[lang];
  const pt = lang === 'pt';
  const appHref = a => (pt ? '/pt' : '') + a.href;
  const range = (s, e) => {
    if (!e) return date(s);
    const [y1, m1, d1] = s.split('-').map(Number); const [y2, m2, d2] = e.split('-').map(Number);
    if (y1 === y2 && m1 === m2) { const full = date(e); return pt ? `${d1} a ${full}` : `${d1} to ${full}`; }
    return pt ? `${date(s)} a ${date(e)}` : `${date(s)} to ${date(e)}`;
  };
  const fig = id => data.figures.figures.find(f => f.id === id);
  const kpis = ['founded', 'members', 'jobs', 'events', 'communities'].map(fig).filter(Boolean);
  const person = data.people.people[0]; const quote = data.people.quotes.find(q => q.by === person.id);
  const partners = data.ecosystem.nodes.filter(n => n.kind === 'partner').map(n => partnerItem(n, lang));
  const timeline = data.ecosystem.timeline.map(e => timelineItem(e, lang));
  const proposals = data.proposals.proposals; const propOf = id => proposals.find(p => p.id === id);
  const extra = proposals.filter(p => !v.apps.some(a => a.id === p.id));
  const navItems = [['kpi', W.kpi], ['mission', W.mission], ['leadership', W.leadership], ['programmes', W.programmes], ['history', W.history], ['network', W.network], ['events', W.events], ['prototypes', W.prototypes], ['join', W.join], ['notes', W.notes]];
  const srcIndex = new Map(data.sources.sources.map((s, i) => [s.url, i + 1]));
  const kpiVal = x => esc(x).replace(/([^\d\s.,+·]+(?:\s[^\d\s.,+·]+)*)/g, '<small>$1</small>');
  const hosts = list => { if (!list?.length) return ''; const seen = new Map(); for (const u of list) { const host = new URL(u).hostname.replace(/^www\./, ''); if (!seen.has(host)) seen.set(host, u); }
    return ` ${pt ? 'Cita' : 'Cites'}: ${[...seen].map(([host, u]) => `<a href="${esc(u)}" rel="noopener">${esc(host)}</a>`).join(', ')}.`; };
  const goalVal = g => (pt && g.value_pt) || g.value;

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Algarve Evolution: ${esc(t(v.tagline))}</title>
<meta name="description" content="${esc(t(v.mission))} ${esc(t(v.banner))}">
<meta name="theme-color" content="#0a1d3d">
${chrome.head}
<link rel="stylesheet" href="/d/corporate/style.css">
<link rel="alternate" hreflang="${pt ? 'en' : 'pt'}" href="${other}">
</head>
<body>
${chrome.banner}
<a class="skip" href="#main">${W.skip}</a>
<header class="masthead" id="top">
  <div class="grid">
    <a class="wordmark" href="#top" aria-label="Algarve Evolution, ${W.top.toLowerCase()}"><span class="wm-mark" aria-hidden="true"></span><span class="wm-text">Algarve<b>Evolution</b></span></a>
    <p class="mast-meta">${W.place}<span aria-hidden="true"> · </span><a href="${other}" hreflang="${pt ? 'en' : 'pt'}" lang="${pt ? 'en' : 'pt'}">${pt ? 'English' : 'Português'}</a></p>
  </div>
</header>

<main id="main">
<section class="hero" aria-labelledby="h-hero">
  <div class="grid">
    <div class="hero-copy">
      <p class="kicker kicker-light">${W.since}</p>
      <h1 id="h-hero">${esc(t(v.tagline))}</h1>
      <p class="lede">${esc(t(v.hero_lede))}</p>
      ${cite(fig('founded')?.sources.concat(v.story_sources), 'src src-light')}
    </div>
    <figure class="hero-map">
      ${algarveMap(data.places, { w: 560, cls: 'map', label: W.mapLabel, id: 'hm' })}
      <figcaption><span class="hm-n">16</span> ${pt ? 'municípios, uma rede' : 'municipalities, one network'} ${cite(['adi', data.places.municipalities_source], 'src src-light')}</figcaption>
    </figure>
  </div>
</section>

<nav class="secnav" aria-label="${W.nav}">
  <div class="grid"><ul>${navItems.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ul></div>
</nav>

<section id="kpi" class="kpi" aria-labelledby="h-kpi">
  <div class="grid">
    <header class="sec-head">
      <p class="kicker">${W.kpi}</p>
      <h2 id="h-kpi">${W.results}</h2>
      <p class="sec-intro">${W.resultsNote}</p>
    </header>
    <ul class="kpi-list">
${kpis.map(f => `      <li class="kpi-item"><p class="kpi-kick">${W.kickers[f.id]}</p><p class="kpi-val">${kpiVal(t(f.value))}</p><p class="kpi-label">${esc(t(f.label))}</p>${f.note ? `<p class="kpi-note">${esc(t(f.note))}</p>` : ''}${cite(f.sources)}</li>`).join('\n')}
    </ul>
    <div class="targets" aria-labelledby="h-targets">
      <div class="targets-head"><h3 id="h-targets">${W.targets}</h3><p>${esc(t(v.goals_note))}</p>${cite(v.goals_sources, 'src src-light')}</div>
      <ul class="targets-list">${v.goals.map(g => `<li><span class="tg-val">${esc(goalVal(g))}</span><span class="tg-label">${esc(t(g.label))}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section id="mission" class="mission" aria-labelledby="h-mission">
  <div class="grid">
    <p class="kicker">${W.missionKicker}</p>
    <h2 id="h-mission" class="statement">${esc(t(v.mission))}</h2>
    ${cite('psn')}
  </div>
</section>

<section id="leadership" class="leadership" aria-labelledby="h-lead">
  <div class="grid">
    <header class="sec-head"><p class="kicker">${W.leadKicker}</p><h2 id="h-lead" class="vh">${W.leadership}</h2></header>
    <div class="lead-card">
      <div class="monogram" aria-hidden="true">AG</div>
      <p class="lead-name">${esc(person.name)}</p>
      <p class="lead-role">${esc(t(person.role))}, Algarve Evolution</p>
      <p class="lead-sum">${esc(t(person.summary))}</p>
      ${cite(person.sources)}
    </div>
    <figure class="lead-quote">
      <p class="lq-on">${W.quoteOn}</p>
      <blockquote><p>${esc(t(quote.text))}</p></blockquote>
      <figcaption><b>${esc(person.name)}</b>, ${esc(t(person.role)).toLowerCase()}, ${esc(date(quote.date))}.${quote.translation_note?.[lang] ? ` <span class="tnote">${esc(quote.translation_note[lang])}</span>` : ''}</figcaption>
      ${cite(quote.sources)}
    </figure>
  </div>
</section>

<section id="programmes" class="pillars" aria-labelledby="h-pillars">
  <div class="grid">
    <header class="sec-head"><p class="kicker">${W.programmes}</p><h2 id="h-pillars">${W.pillarsTitle}</h2><p class="sec-intro">${esc(t(v.pillars_intro))}</p></header>
    <p class="swipe" aria-hidden="true">${W.swipe} &rarr;</p>
    <div class="pillar-row" tabindex="0" role="region" aria-label="${W.pillarsTitle}">
${data.programmes.pillars.map((p, i) => `      <article class="pillar" id="pillar-${esc(p.id)}">
        <header><span class="pl-num">0${i + 1}</span><h3>${esc(t(p.name))}</h3><p class="pl-count">${W.prog(p.programmes.length)}</p></header>
        <ul>${p.programmes.map(g => `<li id="prog-${esc(g.id)}"><h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${cite(g.sources)}</li>`).join('')}</ul>
      </article>`).join('\n')}
    </div>
  </div>
</section>

<section id="history" class="history" aria-labelledby="h-history">
  <div class="grid">
    <header class="sec-head sec-head-row">
      <div><p class="kicker">${W.history}</p><h2 id="h-history">${W.historyTitle}</h2><p class="sec-intro">${esc(t(v.story_intro))}</p>${cite(v.story_sources)}</div>
      <div class="tl-ctrl" hidden><button type="button" class="tl-btn" data-dir="-1" aria-label="${W.prev}"><span aria-hidden="true">&larr;</span></button><button type="button" class="tl-btn" data-dir="1" aria-label="${W.next}"><span aria-hidden="true">&rarr;</span></button></div>
    </header>
  </div>
  <div class="tl-wrap">
    <ol class="tl" tabindex="0" aria-label="${W.trackLabel}">
${timeline.map((e, i) => `      <li class="tl-item${e.future ? ' is-future' : ''}${i === 0 || timeline[i - 1].year !== e.year ? ' new-year' : ''}"><p class="tl-year" aria-hidden="true">${e.year}</p><p class="tl-when">${esc(e.when)}${e.future ? ` · ${W.future}` : ''}</p><h3>${esc(e.title)}</h3><p class="tl-text">${esc(e.text)}</p>${e.stat ? `<p class="tl-stat">${esc(e.stat)}</p>` : ''}${cite(e.src)}</li>`).join('\n')}
    </ol>
  </div>
</section>

<section id="network" class="network" aria-labelledby="h-network">
  <div class="grid">
    <header class="sec-head"><p class="kicker">${W.network}</p><h2 id="h-network">${W.networkTitle}</h2><p class="sec-intro">${esc(t(v.network_intro))}</p>${cite('adi')}</header>
    <h3 class="sub-h">${W.partnersH}</h3>
    <ul class="wall">
${partners.map(p => `      <li class="wall-item"><p class="wall-name wm-${esc(p.id)}">${esc(p.label)}</p><p class="wall-note">${esc(p.note)}</p>${cite(p.src)}</li>`).join('\n')}
    </ul>
    <div class="munis">
      <div class="munis-text"><h3 class="sub-h">${W.munisH}</h3><p>${W.munisNote}</p>${cite(['adi', data.places.municipalities_source])}</div>
      <ul class="munis-list">${data.places.municipalities.map(m => m.name).sort((a, b) => a.localeCompare(b, 'pt')).map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section id="events" class="events" aria-labelledby="h-events">
  <div class="grid">
    <header class="sec-head"><p class="kicker">${W.events}</p><h2 id="h-events">${W.eventsTitle}</h2><p class="sec-intro">${esc(W.eventsIntro)}</p></header>
    <div class="table-wrap">
      <table class="ev-table">
        <thead><tr>${W.th.map(x => `<th scope="col">${x}</th>`).join('')}</tr></thead>
        <tbody>
${data.events.events.map(e => `          <tr id="ev-${esc(e.id)}"><td class="ev-date" data-th="${W.th[0]}"><time datetime="${esc(e.start)}">${e.approximate ? W.about + ' ' : ''}${esc(range(e.start, e.end))}</time></td><th scope="row" class="ev-name" data-th="${W.th[1]}">${esc(t(e.name))}</th><td class="ev-place" data-th="${W.th[2]}">${esc(t(e.place))}</td><td class="ev-sum" data-th="${W.th[3]}">${esc(t(e.summary))}${cite(e.sources)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section id="prototypes" class="protos" aria-labelledby="h-protos">
  <div class="grid">
    <header class="sec-head"><p class="kicker kicker-light">${W.protoKicker}</p><h2 id="h-protos">${esc(t(v.try_title))}</h2><p class="sec-intro">${esc(t(v.try_intro))}</p></header>
    <div class="proto-row">
${v.apps.map((a, i) => `      <a class="proto" href="${appHref(a)}"><span class="proto-tag">${W.proposal} · ${W.working}</span><span class="proto-num">A${i + 1}</span><span class="proto-name">${esc(t(a.name))}</span><span class="proto-sum">${esc(t(a.summary))}</span><span class="proto-go">${W.open} <span aria-hidden="true">&rarr;</span></span></a>`).join('\n')}
      ${extra.map(p => `<div class="proto proto-idea"><span class="proto-tag">${W.proposal}</span><span class="proto-num">${W.oneMore}</span><span class="proto-name">${esc(t(p.name))}</span><span class="proto-sum">${esc(t(p.summary))}</span>${cite(p.sources, 'src src-light')}</div>`).join('')}
    </div>
    ${cite(v.apps.flatMap(a => propOf(a.id)?.sources || []), 'src src-light')}
  </div>
</section>

<section id="join" class="join" aria-labelledby="h-join">
  <div class="grid">
    <header class="sec-head"><p class="kicker">${W.joinKicker}</p><h2 id="h-join">${esc(t(v.join_title))}</h2></header>
    <ol class="join-list">${v.join.map((j, i) => `<li><span class="jn">0${i + 1}</span><p>${esc(t(j))}</p></li>`).join('')}</ol>
    ${cite(v.join_sources)}
  </div>
</section>

<section id="notes" class="notes" aria-labelledby="h-notes">
  <div class="grid">
    <header class="sec-head"><p class="kicker">${W.notes}</p><h2 id="h-notes">${W.notesTitle}</h2><p class="sec-intro">${W.notesIntro}</p></header>
    <ol class="endnotes">
${data.sources.sources.map(s => `      <li id="n${srcIndex.get(s.url)}"><span class="en-pub">${esc(s.publisher)}</span> <a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a>${s.published ? `, ${W.published} ${esc(date(s.published))}` : ''}; ${W.read} ${esc(date(s.read))}.${hosts(s.primary)}</li>`).join('\n')}
    </ol>
  </div>
</section>
</main>

<footer class="foot">
  <div class="grid">
    <div class="foot-brand"><span class="wm-mark" aria-hidden="true"></span><p>Algarve Evolution</p></div>
    <div class="foot-text">
      <p class="foot-banner">${esc(t(v.banner))}</p>
      <p>${esc(t(v.footer_disclosure))}</p>
      <p>${W.official} <a href="https://www.algarveevolution.pt/" rel="noopener">algarveevolution.pt</a>. ${W.version} ${esc(chrome.version)}. ${W.licence} <a href="${other}" hreflang="${pt ? 'en' : 'pt'}" lang="${pt ? 'en' : 'pt'}">${pt ? 'English' : 'Português'}</a> · <a href="#top">${W.top}</a></p>
    </div>
  </div>
</footer>
<script src="/d/corporate/site.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
