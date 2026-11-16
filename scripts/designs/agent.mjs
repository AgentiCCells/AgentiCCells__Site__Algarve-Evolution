// "Ask the Agent": the site as a conversation. Every answer is composed here, at build time, from src/data,
// with its sources. The page renders all questions and answers as a readable FAQ; src/d/agent/agent.js turns
// them into a chat, with a typing effect, a free-text box matched by keywords (no model, no network) and a
// command palette (Ctrl or Cmd + K). Code Apache-2.0; text CC BY 4.0. sites-design@AgentiCCells.dinis, 16 November 2026.
import { tlTitle, nodeShort, relPt } from './future.mjs';

export const meta = {
  slug: 'agent', order: 8, group: 'bold',
  name: { en: 'Ask the Agent', pt: 'Pergunte ao Agente' },
  tagline: { en: 'An AI-native site you talk to', pt: 'Um site nativo de IA com quem fala' },
};

const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9€ ]+/g, ' ').replace(/\s+/g, ' ').trim();

export function render({ lang, data, h, chrome, other }) {
  const { esc, t, source } = h;
  const L = (en, pt) => (lang === 'pt' ? pt : en);
  const v = data.voice, eco = data.ecosystem;
  const fig = id => data.figures.figures.find(f => f.id === id);
  const quote = data.people.quotes[0];
  const person = data.people.people.find(p => p.id === quote.by);
  const pillars = data.programmes.pillars;
  const allProg = pillars.flatMap(p => p.programmes.map(g => ({ ...g, pillar: p })));
  const prog = id => allProg.find(g => g.id === id);
  const ev = id => data.events.events.find(e => e.id === id);
  const tl = at => eco.timeline.find(e => e.t === at);
  const pre = lang === 'pt' ? '/pt' : '';

  // ---------- building blocks ----------
  // Source chips: every fact links to its original. A publisher named twice shows the article title too.
  const chips = (refs, cls = 'chips') => {
    const seen = new Set();
    const list = [].concat(refs || []).filter(Boolean).map(r => source(r)).filter(s => (seen.has(s.url) ? false : seen.add(s.url)));
    if (!list.length) return '';
    const pubs = list.map(s => s.publisher);
    return `<p class="${cls}"><span class="chips-l">${esc(list.length > 1 ? h.words.sources : h.words.source)}</span>${list.map((s, i) => {
      const dup = pubs.filter(p => p === s.publisher).length > 1;
      const short = s.title.length > 46 ? s.title.slice(0, 44).replace(/[\s,]+\S*$/, '') + '...' : s.title;
      return `<a class="chip" href="${esc(s.url)}" title="${esc(s.title)}" rel="noopener"><span class="chip-n">${i + 1}</span>${esc(s.publisher)}${dup ? `<span class="chip-t">${esc(short)}</span>` : ''}</a>`;
    }).join('')}</p>`;
  };
  const mini = refs => chips(refs, 'chips mini');
  const lead = text => `<p class="lead">${esc(text)}</p>`;
  const tiles = items => `<div class="tiles">${items.map(x => `<div class="tile"${x.c ? ` style="--c:${x.c}"` : ''}><p class="tv">${esc(x.value)}</p><p class="tl">${esc(x.label)}</p>${x.note ? `<p class="tn">${esc(x.note)}</p>` : ''}${x.src ? mini(x.src) : ''}</div>`).join('')}</div>`;
  const figTile = id => { const f = fig(id); return { value: t(f.value), label: t(f.label), note: f.note ? t(f.note) : '', src: f.sources }; };
  const timeline = items => `<ol class="tline">${items.map(x => `<li><p class="tw">${esc(x.when)}</p><div><h4>${esc(x.title)}</h4>${x.text ? `<p>${esc(x.text)}</p>` : ''}${mini(x.src)}</div></li>`).join('')}</ol>`;
  const evItem = e => ({ when: `${e.approximate ? L('about ', 'cerca de ') : ''}${h.date(e.start)}${e.end ? ` ${L('to', 'a')} ${h.date(e.end)}` : ''} · ${t(e.place)}`, title: t(e.name), text: t(e.summary), src: e.sources });
  const tlItem = at => { const e = tl(at); return { when: e.when, title: tlTitle(e, lang), text: e.text, src: e.src }; };
  const progCard = g => `<div class="card"><p class="card-k">${esc(t(g.pillar.name))}</p><h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${mini(g.sources)}</div>`;
  const quoteCard = () => `<figure class="qcard"><blockquote><p>${esc(t(quote.text))}</p></blockquote><figcaption><span class="qav" aria-hidden="true">AG</span><span><strong>${esc(person.name)}</strong> ${esc(t(person.role))}, Algarve Evolution · <time datetime="${quote.date}">${esc(h.date(quote.date))}</time>${lang === 'pt' && quote.translation_note ? `<em>${esc(quote.translation_note.pt)}</em>` : ''}</span></figcaption>${mini(quote.sources)}</figure>`;
  const appCard = (a, prop) => `<a class="card app" href="${pre}${a.href}"><p class="card-k">${esc(h.words.proposal)} · ${L('working prototype', 'protótipo a funcionar')}</p><h4>${esc(t(a.name))}</h4><p>${esc(t(a.summary))}</p><span class="go">${L('Open it', 'Abrir')} <span aria-hidden="true">→</span></span></a>`;

  // Mini map of the 16 municipalities.
  const munis = data.places.municipalities;
  const M = { lon0: -9.02, lat0: 37.56, k: 520, c: Math.cos(37.2 * Math.PI / 180) };
  const mx = lon => (lon - M.lon0) * M.c * M.k, my = lat => (M.lat0 - lat) * M.k;
  const poly = rings => rings.map(r => r.map(ring => ring.map(([lo, la], i) => `${i ? 'L' : 'M'}${mx(lo).toFixed(1)},${my(la).toFixed(1)}`).join(' ')).join(' ')).join(' ');
  const act = eco.places.map(p => p.name);
  const miniMap = `<figure class="mmap"><svg viewBox="0 0 740 330" role="img" aria-label="${esc(L('Map of the Algarve: our base in Faro, the 16 municipalities, and places where our events have been held', 'Mapa do Algarve: a nossa sede em Faro, os 16 municípios e lugares onde decorreram os nossos eventos'))}">
    <path class="es" d="${poly(data.places.outline.countries.Spain)}"/><path class="pt" d="${poly(data.places.outline.countries.Portugal)}"/>
    ${munis.map(m => { const x = mx(m.ll[0]), y = my(m.ll[1]); const on = act.includes(m.name); return `<circle class="${m.id === 'faro' ? 'hq' : on ? 'on' : 'mu'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m.id === 'faro' ? 9 : on ? 6.5 : 5}"><title>${esc(m.name)}</title></circle>`; }).join('')}
    ${munis.filter(m => ['faro', 'lagos', 'portimao', 'albufeira', 'tavira', 'loule', 'monchique', 'aljezur', 'vila-real-de-santo-antonio'].includes(m.id)).map(m => { const x = mx(m.ll[0]), y = my(m.ll[1]); const up = ['monchique', 'aljezur', 'loule'].includes(m.id); const nm = m.id === 'vila-real-de-santo-antonio' ? 'V. R. S. António' : m.name; const end = m.id === 'vila-real-de-santo-antonio'; return `<text x="${(x + (end ? 4 : 0)).toFixed(1)}" y="${(y + (up ? -14 : 26)).toFixed(1)}" text-anchor="${end ? 'end' : 'middle'}" class="${m.id === 'faro' ? 'hq-t' : ''}">${esc(nm)}</text>`; }).join('')}
  </svg><figcaption><span><i class="k hq"></i>${L('Faro, our base', 'Faro, a nossa sede')}</span><span><i class="k on"></i>${L('where events have been held', 'onde decorreram eventos')}</span><span><i class="k mu"></i>${L('the other municipalities', 'os outros municípios')}</span></figcaption></figure>`;

  // Members over time, as small bars.
  const bars = [
    { y: L('2019', '2019'), v: 29, label: L('about 29 ICT companies', 'cerca de 29 empresas de TIC'), src: 'pres19' },
    { y: L('2024', '2024'), v: 70, label: L('about 70 companies and individuals', 'cerca de 70 empresas e particulares'), src: 'pres24' },
    { y: L('Oct 2026', 'out 2026'), v: 106, label: L('106 active members, own site', '106 membros ativos, site próprio'), src: fig('members').sources[0] },
    { y: L('Nov 2026', 'nov 2026'), v: 118, label: L('118 active members, as reported', '118 membros ativos, segundo notícia'), src: 'psn' },
  ];
  const barChart = `<figure class="bars"><div class="bars-in">${bars.map(b => `<div class="bar" style="--v:${(b.v / 118 * 100).toFixed(1)}%"><span class="bv">${b.v}</span><span class="bb"></span><span class="by">${esc(b.y)}</span></div>`).join('')}</div><figcaption>${bars.map(b => `<span>${esc(b.y)}: ${esc(b.label)}</span>`).join(' · ')}. ${L('Different sources count different things; the bars are not one series.', 'As fontes contam coisas diferentes; as barras não são uma série.')}${mini(bars.map(b => b.src))}</figcaption></figure>`;

  // Partners and what we do together, from the ecosystem graph.
  const node = id => eco.nodes.find(x => x.id === id);
  const label = id => nodeShort[lang][id] || node(id).label;
  const rel = r => (lang === 'pt' ? relPt[r] || r : r);
  const partnerIds = ['ualg', 'stp', 'amal', 'nera', 'anje', 'ja', 'startupPt'];
  const partnerCards = `<div class="plist">${partnerIds.map(id => {
    const ls = eco.links.filter(([a, b]) => b === id && a !== 'ae' && node(a).kind !== 'municipality');
    return `<div class="pcard"><h4>${esc(label(id))}</h4><p>${ls.map(([a, , r]) => `${esc(label(a))} <span>(${esc(rel(r))})</span>`).join(', ')}</p></div>`;
  }).join('')}</div>`;

  const goalsTiles = tiles(v.goals.map((g, i) => ({ value: lang === 'pt' && g.value_pt ? g.value_pt : g.value, label: t(g.label), c: ['#e0902a', '#e8603c', '#0e9aa0'][i] })));
  const steps = `<ol class="steps">${v.join.map(j => `<li>${esc(t(j))}</li>`).join('')}</ol>`;
  const apps = v.apps.map(a => appCard(a, data.proposals.proposals.find(p => p.id === a.id))).join('');
  const third = data.proposals.proposals.find(p => p.id === 'sell-to-the-problem');
  const dataFiles = `<p class="files">${['voice', 'figures', 'programmes', 'events', 'ecosystem', 'people', 'places', 'proposals', 'sources'].map(f => `<a class="file" href="/data/${f}.json">${f}.json</a>`).join('')}</p>`;

  // ---------- the answers ----------
  const A = [
    { id: 'who', q: L('Who are you?', 'Quem são vocês?'), d: L('The association, in a paragraph', 'A associação, num parágrafo'),
      kw: 'who are you,who,about,algarve evolution,association,organisation,organization,introduce,hello,hi,hey,quem,quem sao,sobre,associacao,organizacao,ola,bom dia,boa tarde,apresentem',
      follow: ['goals', 'programmes', 'history'],
      body: lead(t(v.hero_lede)) + `<p>${esc(t(v.mission))}</p>` + tiles([figTile('founded'), figTile('members'), figTile('jobs')]) + chips([...fig('founded').sources, 'psn']) },
    { id: 'goals', q: L('What are your goals for 2032?', 'Quais são os vossos objetivos para 2032?'), d: L('Three targets, in numbers', 'Três metas, em números'),
      kw: 'goal,goals,2032,target,targets,plan,plans,ambition,aim,aims,500,150,50000,50 000,future,objetivo,objetivos,meta,metas,plano,planos,ambicao,futuro',
      follow: ['director', 'partners', 'programmes'],
      body: lead(L('By 2032 we aim to support 500 companies, help create 150 startups and reach 50,000 people. These are targets, not results.', 'Até 2032 queremos apoiar 500 empresas, ajudar a criar 150 startups e alcançar 50.000 pessoas. São metas, não resultados.')) + goalsTiles + chips(v.goals_sources) + `<p class="sub">${L('Our executive director on these goals:', 'O nosso diretor executivo sobre estes objetivos:')}</p>` + quoteCard() },
    { id: 'programmes', q: L('What do you run?', 'O que fazem?'), d: L('Three pillars, ten programmes', 'Três pilares, dez programas'),
      kw: 'run,programme,programmes,program,programs,what do you do,do you do,work,pillar,pillars,founder2founder,incubator,inova,buildathon,buildathons,education,showcase,projects,services,fazem,programa,programas,pilar,pilares,incubadora,educacao,projetos,servicos,trabalho',
      follow: ['ideas', 'join', 'tourism'],
      body: lead(t(v.pillars_intro)) + pillars.map(p => `<h3 class="grp">${esc(t(p.name))}</h3><div class="cards">${p.programmes.map(g => progCard({ ...g, pillar: p })).join('')}</div>`).join('') },
    { id: 'where', q: L('Where are you?', 'Onde estão?'), d: L('Faro, and all 16 municipalities', 'Faro, e os 16 municípios'),
      kw: 'where,location,located,based,faro,map,region,municipalities,municipality,town,towns,office,address,algarve,onde,localizacao,sede,mapa,regiao,municipios,municipio,concelho,concelhos,lagos,portimao,tavira',
      follow: ['partners', 'join', 'y2025'],
      body: lead(L('We are based in Faro, and our work reaches all 16 of the Algarve\'s municipalities: Algarve Digital Innovators has mapped 24 digital communities across them.', 'Estamos sediados em Faro, e o nosso trabalho chega aos 16 municípios do Algarve: a Algarve Digital Innovators mapeou 24 comunidades digitais em todos eles.')) + miniMap + `<ul class="tags">${munis.map(m => `<li${m.id === 'faro' ? ' class="hq"' : ''}>${esc(m.name)}</li>`).join('')}</ul>` + chips(['psn', ...prog('algarve-digital-innovators').sources, 'adi', ...eco.places.map(p => p.src)]) },
    { id: 'partners', q: L('Who do you work with?', 'Com quem trabalham?'), d: L('Universities, parks, associations', 'Universidades, parques, associações'),
      kw: 'partner,partners,work with,with whom,university,ualg,stp,amal,nera,anje,junior achievement,startup portugal,network,ecosystem,collaborate,collaboration,parceiro,parceiros,com quem,universidade,rede,ecossistema,colaborar,colaboracao,trabalham',
      follow: ['programmes', 'where', 'y2025'],
      body: lead(t(v.network_intro)) + `<p class="sub">${L('Partners, and what we do together:', 'Parceiros, e o que fazemos em conjunto:')}</p>` + partnerCards + chips(['adi', 'venture', 'ws25', 'econews22', 'psn']) },
    { id: 'join', q: L('How do I join?', 'Como me posso juntar?'), d: L('Events, communities, membership', 'Eventos, comunidades, adesão'),
      kw: 'join,joining,member,membership,sign up,signup,become,price,cost,fee,fees,150,start,take part,participate,involved,aderir,adesao,membro,socio,juntar,inscrever,inscricao,preco,custo,quota,participar,envolver',
      follow: ['where', 'programmes', 'ideas'],
      body: lead(L('Three ways in, from the lightest to the most committed:', 'Três formas de chegar, da mais leve à mais comprometida:')) + steps + `<p class="note">${L('This prototype takes no sign-ups and keeps no data. Everything happens through Algarve Evolution itself, on algarveevolution.pt; check there for current terms.', 'Este protótipo não faz inscrições nem guarda dados. Tudo acontece através da própria Algarve Evolution, em algarveevolution.pt; confirme lá as condições atuais.')}</p>` + chips(v.join_sources) },
    { id: 'y2025', q: L('What happened in 2025?', 'O que aconteceu em 2025?'), d: L('Launches and summits', 'Lançamentos e cimeiras'),
      kw: '2025,happened,last year,web summit,tech hub summit,summit,launch,digital innovators,roadshow,aconteceu,ano passado,lancamento,cimeira',
      follow: ['y2026', 'events', 'partners'],
      body: lead(L('2025 was a year of launches and summits:', '2025 foi um ano de lançamentos e cimeiras:')) + timeline([evItem(ev('algarve-digital-innovators-launch-2025')), evItem(ev('algarve-tech-hub-summit-2025')), evItem(ev('algarve-startups-at-web-summit-2025')), tlItem(2025.97)]) },
    { id: 'y2026', q: L('What is new in 2026?', 'O que há de novo em 2026?'), d: L('From community to ecosystem', 'Da comunidade ao ecossistema'),
      kw: '2026,new,news,latest,recent,recently,this year,vibathon,founder2founder,venture lab,novo,novidades,noticias,recente,este ano',
      follow: ['ideas', 'goals', 'programmes'],
      body: lead(L('We describe 2026 as the year we move from building a community to making the ecosystem work.', 'Descrevemos 2026 como o ano em que passamos de construir uma comunidade a pôr o ecossistema a funcionar.')) + mini(['psn']) + timeline([tlItem(2026.05), tlItem(2026.55), tlItem(2026.8), evItem(ev('vibathon-algarve-2026')), tlItem(2026.86)]) },
    { id: 'ideas', q: L('Show me the two working ideas', 'Mostrem-me as duas ideias a funcionar'), d: L('Proposals, built as prototypes', 'Propostas, feitas protótipos'),
      kw: 'idea,ideas,proposal,proposals,prototype,prototypes,app,apps,talent map,talent,spreadsheet,spreadsheet to app,try,demo,working,show me,ideia,ideias,proposta,propostas,prototipo,prototipos,aplicacao,mapa de talento,talento,folha de calculo,experimentar,mostrem',
      follow: ['join', 'programmes', 'honest'],
      body: lead(t(v.try_intro)) + `<div class="cards two">${apps}</div><div class="card plain"><p class="card-k">${esc(h.words.proposal)} · ${L('not built', 'não construída')}</p><h4>${esc(t(third.name))}</h4><p>${esc(t(third.summary))}</p></div>` + chips(data.proposals.proposals.flatMap(p => p.sources)) },
    { id: 'numbers', q: L('What are your numbers?', 'Quais são os vossos números?'), d: L('Members, jobs, events, communities', 'Membros, empregos, eventos, comunidades'),
      kw: 'numbers,number,figures,figure,stats,statistics,how many,members,jobs,employment,events,participants,communities,turnover,revenue,size,numeros,estatisticas,quantos,quantas,membros,empregos,eventos,participantes,comunidades,faturacao,dimensao',
      follow: ['history', 'goals', 'events'],
      body: lead(L('Our own figures, as reported. Nobody here has audited them; where two sources differ, both are shown.', 'Os nossos próprios números, tal como foram noticiados. Ninguém aqui os auditou; quando duas fontes diferem, mostramos as duas.')) + tiles(['members', 'jobs', 'events', 'communities', 'founded'].map(figTile)) },
    { id: 'history', q: L('How did you start?', 'Como começaram?'), d: L('From 29 companies to 118 members', 'De 29 empresas a 118 membros'),
      kw: 'start,started,begin,began,beginning,history,story,founded,founding,origin,origins,2018,2019,grow,grew,growth,comecaram,comecar,inicio,historia,fundada,fundacao,origem,crescimento,cresceram',
      follow: ['numbers', 'y2025', 'goals'],
      body: lead(t(v.story_intro)) + barChart + timeline([tlItem(2018), tlItem(2019.7), tlItem(2022.25)]) },
    { id: 'director', q: L('Who leads Algarve Evolution?', 'Quem lidera a Algarve Evolution?'), d: L('Our executive director', 'O nosso diretor executivo'),
      kw: 'lead,leads,leader,leadership,director,executive,executive director,ceo,head,antonio,guerreiro,team,people,run by,diretor,executivo,diretor executivo,lider,lidera,lideranca,equipa,pessoas',
      follow: ['goals', 'y2026', 'who'],
      body: lead(L(`${person.name} is our executive director.`, `${person.name} é o nosso diretor executivo.`)) + `<p>${esc(t(person.summary))}</p>` + mini(person.sources) + quoteCard() },
    { id: 'events', q: L('What events do you run?', 'Que eventos organizam?'), d: L('Summits, buildathons, conferences', 'Cimeiras, buildathons, conferências'),
      kw: 'event,events,meetup,meetups,summit,summits,calendar,agenda,conference,conferences,gathering,eventos,evento,conferencia,conferencias,encontro,encontros,cimeira,cimeiras,calendario',
      follow: ['y2025', 'join', 'where'],
      body: lead(L('Days we ran, co-ran or partnered, newest first. All are past; our current calendar is on algarveevolution.pt.', 'Dias que organizámos, coorganizámos ou apoiámos, do mais recente para o mais antigo. Todos já passaram; a nossa agenda atual está em algarveevolution.pt.')) + timeline(data.events.events.map(evItem)) + mini(['site']) },
    { id: 'tourism', q: L('Why beyond tourism?', 'Porquê para além do turismo?'), d: L('Our mandate', 'A nossa missão'),
      kw: 'tourism,economy,diversify,diversification,beyond,mission,mandate,why,purpose,industries,competitive,ai,robotics,turismo,economia,diversificar,diversificacao,alem,missao,porque,proposito,industrias,competitivas,robotica',
      follow: ['programmes', 'goals', 'who'],
      body: lead(t(v.mission)) + mini(['psn']) + `<p class="sub">${L('One way we do it, for the tourism businesses already here:', 'Uma das formas, para as empresas de turismo que já cá estão:')}</p><div class="cards">${progCard(prog('inova-algarve-3'))}</div>` },
    { id: 'honest', q: L('How do you answer?', 'Como responde?'), d: L('No model, no network, only sourced data', 'Sem modelo, sem rede, só dados com fonte'),
      kw: 'how do you answer,how do you work,how does this work,are you ai,ai,artificial intelligence,llm,chatgpt,gpt,claude,bot,robot,model,real,data,privacy,private,source,sources,trust,true,accurate,como responde,como funciona,es uma ia,ia,inteligencia artificial,modelo,privacidade,dados,fonte,fontes,confianca,verdade',
      follow: ['who', 'ideas', 'numbers'],
      body: lead(L('I am not a language model. I am this prototype site, answering from its own data files: every answer was written when the site was built, from the files below, and every fact links to its original source. When you type, your words are matched to the closest answer here in your browser. Nothing you type is sent anywhere.', 'Não sou um modelo de linguagem. Sou este protótipo de site, a responder a partir dos seus próprios ficheiros de dados: cada resposta foi escrita quando o site foi construído, a partir dos ficheiros abaixo, e cada facto liga à sua fonte original. Quando escreve, as suas palavras são comparadas com a resposta mais próxima, aqui no seu navegador. Nada do que escreve é enviado para lado nenhum.')) + dataFiles + `<p class="note">${esc(t(v.banner))} ${esc(t(v.footer_disclosure))}</p>` },
  ];
  const byId = Object.fromEntries(A.map(a => [a.id, a]));
  const suggest = ['who', 'goals', 'programmes', 'where', 'partners', 'join', 'y2025', 'ideas'];

  const UI = {
    greet: L('Hello. I am the Algarve Evolution assistant on this prototype site. Ask me who we are, what we run, our goals for 2032 or how to join. I answer only from this site\'s sourced data, and every answer shows its sources.', 'Olá. Sou o assistente da Algarve Evolution neste protótipo de site. Pergunte-me quem somos, o que fazemos, os nossos objetivos para 2032 ou como se juntar a nós. Respondo apenas com os dados com fonte deste site, e cada resposta mostra as suas fontes.'),
    none: L('I do not have a sourced answer for that, and I will not guess. I answer only from this site\'s data. Here is what I can tell you about:', 'Não tenho uma resposta com fonte para isso, e não vou adivinhar. Respondo apenas com os dados deste site. Eis o que lhe posso dizer:'),
    matched: L('Best match for', 'Melhor correspondência para'),
    also: L('You might also mean', 'Talvez queira dizer'),
    more: L('Ask next', 'Pergunte a seguir'),
    copied: L('Link copied', 'Ligação copiada'),
    noresults: L('No question matches. Press Enter to ask anyway.', 'Nenhuma pergunta corresponde. Prima Enter para perguntar na mesma.'),
  };
  const json = JSON.stringify({
    lang, ui: UI, suggest,
    answers: A.map(a => ({ id: a.id, q: a.q, d: a.d, kw: [...new Set([...a.kw.split(','), norm(a.q)].map(norm).filter(Boolean))], follow: a.follow })),
    data: { goals: v.goals, figures: data.figures.figures, municipalities: munis.map(m => m.name), sources: data.sources.sources.map(s => ({ url: s.url, publisher: s.publisher, title: s.title })) },
  }).replace(/</g, '\\u003c');

  const orb = (cls = 'orb') => `<span class="${cls}" aria-hidden="true"><svg viewBox="0 0 40 40"><defs><radialGradient id="og-${cls}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffd27a"/><stop offset=".45" stop-color="#e8603c"/><stop offset="1" stop-color="#0e7c86"/></radialGradient></defs><circle cx="20" cy="20" r="19" fill="url(#og-${cls})"/><path d="M6 24c4-2.5 7.5 1.5 14 0s10-2.5 14 0" stroke="#fff" stroke-opacity=".85" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="15" r="4.5" fill="#fff" fill-opacity=".92"/></svg></span>`;
  const kbd = '<kbd>Ctrl</kbd><kbd>K</kbd>';

  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">
<title>${esc(L('Ask Algarve Evolution', 'Pergunte à Algarve Evolution'))}</title>
<meta name="description" content="${esc(L('Ask Algarve Evolution about its work, goals and partners; every answer comes from sourced data.', 'Pergunte à Algarve Evolution sobre o seu trabalho, objetivos e parceiros; cada resposta vem de dados com fonte.'))} ${esc(t(v.banner))}">
<meta name="color-scheme" content="light dark">
<script>(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('ae-agent-theme');if(t)d.dataset.theme=t;}catch(e){}})()</script>
${chrome.head}
<link rel="stylesheet" href="/d/agent/agent.css">
<link rel="alternate" hreflang="${lang === 'en' ? 'pt' : 'en'}" href="${other}">
</head>
<body>
${chrome.banner}
<a class="skip" href="#log">${L('Skip to the conversation', 'Saltar para a conversa')}</a>
<div class="app">
  <aside class="side" aria-label="${L('Topics', 'Temas')}">
    <div class="brand">${orb()}<div><strong>Algarve Evolution</strong><span>${L('Assistant', 'Assistente')} <em>${L('prototype', 'protótipo')}</em></span></div></div>
    <button type="button" class="newchat" data-new hidden><span aria-hidden="true">+</span> ${L('New conversation', 'Nova conversa')}</button>
    <button type="button" class="search" data-palette hidden><span>${L('Jump to an answer', 'Ir para uma resposta')}</span><span class="keys">${kbd}</span></button>
    <nav class="topics" aria-label="${L('All questions', 'Todas as perguntas')}"><p class="side-h">${L('Questions I can answer', 'Perguntas a que sei responder')}</p><ol>${A.map(a => `<li><a href="#a-${a.id}" data-ask="${a.id}">${esc(a.q)}</a></li>`).join('')}</ol></nav>
    <div class="side-foot">
      <p>${L('Answers come only from this site\'s sourced data. No AI model runs here, and nothing you type leaves your browser.', 'As respostas vêm apenas dos dados com fonte deste site. Não corre aqui nenhum modelo de IA, e nada do que escreve sai do seu navegador.')}</p>
      <div class="side-ctl"><button type="button" class="theme" data-theme-toggle hidden aria-label="${L('Switch light or dark', 'Alternar claro ou escuro')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button><a href="${other}" hreflang="${lang === 'en' ? 'pt' : 'en'}">${lang === 'en' ? 'Português' : 'English'}</a></div>
    </div>
  </aside>

  <main class="main" id="main">
    <header class="top">
      <div class="top-l">${orb('orb sm')}<div><h1>${L('Ask Algarve Evolution', 'Pergunte à Algarve Evolution')}</h1><p class="status"><span class="dot" aria-hidden="true"></span>${L('Sourced answers only', 'Só respostas com fonte')}</p></div></div>
      <div class="top-r"><button type="button" class="iconbtn" data-palette hidden aria-label="${L('Jump to an answer', 'Ir para uma resposta')}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><span class="keys">${kbd}</span></button><button type="button" class="iconbtn theme-m" data-theme-toggle hidden aria-label="${L('Switch light or dark', 'Alternar claro ou escuro')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button></div>
    </header>

    <div class="log" id="log" tabindex="-1" aria-label="${L('Conversation', 'Conversa')}">
      <div class="msg bot greet"><div class="av">${orb('orb av-o')}</div><div class="body"><p class="lead">${esc(UI.greet)}</p>
        <div class="sugg" data-sugg>${suggest.map(id => `<a class="sg" href="#a-${id}" data-ask="${id}"><strong>${esc(byId[id].q)}</strong><span>${esc(byId[id].d)}</span></a>`).join('')}</div>
        <noscript><p class="note">${L('JavaScript is off, so here is the whole conversation: every question I can answer, with its answer and sources.', 'O JavaScript está desligado, por isso aqui está a conversa toda: cada pergunta a que sei responder, com a resposta e as fontes.')}</p></noscript>
      </div></div>
      <div class="faq" data-faq>
${A.map(a => `      <article class="qa" id="a-${a.id}" data-id="${a.id}" aria-labelledby="q-${a.id}">
        <div class="msg user"><h2 class="bubble" id="q-${a.id}">${esc(a.q)}</h2></div>
        <div class="msg bot"><div class="av">${orb('orb av-o')}</div><div class="body">${a.body}</div></div>
      </article>`).join('\n')}
      </div>
    </div>

    <div class="dock">
      <form class="composer" data-composer hidden autocomplete="off">
        <label class="vh" for="ask">${L('Ask a question', 'Faça uma pergunta')}</label>
        <textarea id="ask" rows="1" placeholder="${L('Ask about our goals, programmes, partners, events...', 'Pergunte pelos objetivos, programas, parceiros, eventos...')}" enterkeyhint="send"></textarea>
        <button type="submit" class="send" aria-label="${L('Send', 'Enviar')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
      </form>
      <p class="disclaim">${L('Matches your words to answers written from sourced data, in your browser. No model, no network.', 'Compara as suas palavras com respostas escritas a partir de dados com fonte, no seu navegador. Sem modelo, sem rede.')} <span class="disc-k">${L('Press', 'Prima')} ${kbd} ${L('to jump', 'para saltar')}.</span></p>
    </div>
    <p class="vh" aria-live="polite" data-live></p>
  </main>
</div>

<dialog class="pal" aria-label="${L('Jump to an answer', 'Ir para uma resposta')}">
  <div class="pal-in">
    <div class="pal-s"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="${L('Type to search the answers', 'Escreva para procurar nas respostas')}" aria-label="${L('Search the answers', 'Procurar nas respostas')}"><kbd>Esc</kbd></div>
    <ul id="pal-list" role="listbox" aria-label="${L('Answers', 'Respostas')}"></ul>
    <p class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> ${L('move', 'mover')}</span><span><kbd>Enter</kbd> ${L('ask', 'perguntar')}</span><span><kbd>Esc</kbd> ${L('close', 'fechar')}</span></p>
  </div>
</dialog>

<footer class="foot"><p>${esc(t(v.footer_disclosure))}</p><p>${esc(t(v.banner))} <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a> · ${L('Version', 'Versão')} ${esc(chrome.version)} · ${L('Code Apache-2.0; text CC BY 4.0', 'Código Apache-2.0; texto CC BY 4.0')} · <a href="/d/agent/fonts/README.md">${L('Fonts', 'Tipos de letra')}</a></p></footer>
<script type="application/json" id="agent-data">${json}</script>
<script src="/d/agent/agent.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
