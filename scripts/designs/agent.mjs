// "Ask the Agent": the site as a conversation. Every answer is composed here, at build time, from src/data,
// with its sources. The page renders all questions and answers as a readable FAQ; src/d/agent/agent.js turns
// them into a chat, with a typing effect, a free-text box matched by keywords (no model, no network) and a
// command palette (Ctrl or Cmd + K). Four languages (en, pt, es, fr): every string of our own is written in all
// four, L(en, pt, es, fr), and the keywords of all four are matched on every page, so a question typed in any of
// them finds its answer. Code Apache-2.0; text CC BY 4.0. sites-design@AgentiCCells.dinis, 16 November 2026.
import { tlTitle, nodeShort, relIn, goalValue } from './future.mjs';
import { APPS, langPath } from '../site-data.mjs';

export const meta = {
  slug: 'agent', order: 8, group: 'bold',
  name: { en: 'Ask the Agent', pt: 'Pergunte ao Agente', es: 'Pregunte al Agente', fr: 'Demandez à l\'Agent' },
  tagline: { en: 'An AI-native site you talk to', pt: 'Um site nativo de IA com quem fala', es: 'Un sitio nativo de IA con el que se habla', fr: 'Un site natif de l\'IA, à qui l\'on parle' },
};

// Lower case, accents off (é, ç, ñ, ã all become plain letters), apostrophes and punctuation to spaces.
export const norm = s => String(s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9€ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const NB = ' '; // French puts a non-breaking space before : ? ! ;

// Keywords for each answer, in English, Portuguese, Spanish and French (written without accents; norm() strips
// them from what is typed). All four sets are used on every page.
export const KW = {
  who: {
    en: 'who are you,who,about,algarve evolution,association,organisation,organization,introduce,hello,hi,hey',
    pt: 'quem,quem sao,sobre,associacao,organizacao,ola,bom dia,boa tarde,apresentem',
    es: 'quien,quienes,quienes son,quienes sois,acerca de,asociacion,hola,buenos dias,buenas tardes,presentense',
    fr: 'qui,qui etes vous,vous etes qui,a propos,association,bonjour,salut,bonsoir,presentez vous,presentation',
  },
  goals: {
    en: 'goal,goals,2032,target,targets,plan,plans,ambition,aim,aims,500,150,50000,50 000,future',
    pt: 'objetivo,objetivos,meta,metas,plano,planos,ambicao,futuro',
    es: 'objetivo,objetivos,meta,metas,planes,ambicion,futuro',
    fr: 'objectif,objectifs,but,buts,cible,cibles,ambition,ambitions,avenir,futur',
  },
  programmes: {
    en: 'run,programme,programmes,program,programs,what do you do,do you do,work,pillar,pillars,founder2founder,incubator,inova,buildathon,buildathons,education,showcase,projects,services',
    pt: 'fazem,programa,programas,pilar,pilares,incubadora,educacao,projetos,servicos,trabalho',
    es: 'que hacen,que haceis,hacen,programa,programas,pilar,pilares,incubadora,educacion,proyectos,servicios,actividades',
    fr: 'que faites vous,faites vous,programme,programmes,pilier,piliers,incubateur,education,projets,services,activites',
  },
  where: {
    en: 'where,location,located,based,faro,map,region,municipalities,municipality,town,towns,office,offices,address,headquarters,algarve',
    pt: 'onde,localizacao,sede,morada,escritorio,escritorios,ficam,situados,mapa,regiao,municipios,municipio,concelho,concelhos,lagos,portimao,tavira',
    es: 'donde,ubicacion,ubicados,sede,direccion,oficina,oficinas,mapa,region,municipios,municipio,ciudades,pueblos,donde estan',
    fr: 'ou etes vous,ou est,ou se trouve,ou etes,ou sont,adresse,siege,bureau,bureaux,carte,region,municipalites,municipalite,communes,commune,villes,situes,localisation',
  },
  partners: {
    en: 'partner,partners,work with,with whom,university,ualg,stp,amal,nera,anje,junior achievement,startup portugal,network,ecosystem,collaborate,collaboration',
    pt: 'parceiro,parceiros,com quem,universidade,rede,ecossistema,colaborar,colaboracao,trabalham',
    es: 'socio,socios,con quien,con quienes,trabajan,colaboran,universidad,red,ecosistema,colaborar,colaboracion,aliados',
    fr: 'partenaire,partenaires,avec qui,travaillez,universite,reseau,ecosysteme,collaborer,collaboration',
  },
  join: {
    en: 'join,joining,member,membership,sign up,signup,become,price,cost,fee,fees,150,start,take part,participate,involved,pay',
    pt: 'aderir,adesao,membro,socio,juntar,inscrever,inscricao,preco,custo,custa,quanto custa,pagar,quota,participar,envolver',
    es: 'unirme,unirse,uno,hacerse socio,ser socio,afiliarse,afiliacion,inscribirme,inscripcion,precio,coste,cuesta,cuanto cuesta,cuota,pagar,participar,apuntarme',
    fr: 'rejoindre,adherer,adhesion,membre,devenir membre,inscription,inscrire,prix,cout,combien coute,combien ca coute,tarif,cotisation,payer,participer',
  },
  y2025: {
    en: '2025,happened,last year,web summit,tech hub summit,summit,launch,digital innovators,roadshow',
    pt: 'aconteceu,ano passado,lancamento,cimeira',
    es: 'paso,ocurrio,el ano pasado,ano pasado,cumbre,lanzamiento',
    fr: 's est il passe,passe en,l an dernier,annee derniere,sommet,lancement',
  },
  y2026: {
    en: '2026,new,news,latest,recent,recently,this year,vibathon,founder2founder,venture lab',
    pt: 'novo,novidades,noticias,recente,este ano',
    es: 'nuevo,novedades,noticias,reciente,este ano,ultimas',
    fr: 'quoi de neuf,neuf,nouveau,nouveautes,nouvelles,actualites,recent,cette annee',
  },
  ideas: {
    en: 'idea,ideas,proposal,proposals,prototype,prototypes,app,apps,talent map,talent,spreadsheet,spreadsheet to app,try,demo,working,show me',
    pt: 'ideia,ideias,proposta,propostas,prototipo,prototipos,aplicacao,mapa de talento,talento,folha de calculo,da folha a aplicacao,experimentar,mostrem',
    es: 'idea,ideas,propuesta,propuestas,prototipo,prototipos,aplicacion,mapa de talento,talento,hoja de calculo,de la hoja a la app,probar,ensenenme,ensename,muestrenme',
    fr: 'idee,idees,proposition,propositions,prototype,application,carte des talents,talents,tableur,du tableur a l app,essayer,montrez moi',
  },
  numbers: {
    en: 'numbers,number,figures,figure,stats,statistics,how many,members,jobs,employment,events,participants,communities,turnover,revenue,size',
    pt: 'numeros,estatisticas,quantos,quantas,membros,empregos,eventos,participantes,comunidades,faturacao,dimensao',
    es: 'numeros,cifras,estadisticas,cuantos,cuantas,miembros,empleos,puestos de trabajo,participantes,comunidades,facturacion,tamano',
    fr: 'chiffres,nombres,statistiques,combien,membres,emplois,participants,communautes,chiffre d affaires,taille',
  },
  history: {
    en: 'start,started,begin,began,beginning,history,story,founded,founding,origin,origins,2018,2019,grow,grew,growth',
    pt: 'comecaram,comecar,inicio,historia,fundada,fundacao,origem,crescimento,cresceram',
    es: 'empezaron,empezar,comenzaron,inicio,historia,fundada,fundacion,origen,crecimiento,crecieron',
    fr: 'commence,commencement,debut,debuts,histoire,fondee,fondation,origine,croissance',
  },
  director: {
    en: 'lead,leads,leader,leadership,director,executive,executive director,ceo,head,antonio,guerreiro,team,people,run by',
    pt: 'diretor,executivo,diretor executivo,lider,lidera,lideranca,equipa,pessoas',
    es: 'dirige,quien dirige,director,ejecutivo,director ejecutivo,lider,liderazgo,equipo,personas',
    fr: 'dirige,qui dirige,directeur,directeur executif,directeur general,responsable,equipe,personnes',
  },
  events: {
    en: 'event,events,meetup,meetups,summit,summits,calendar,agenda,conference,conferences,gathering',
    pt: 'eventos,evento,conferencia,conferencias,encontro,encontros,cimeira,cimeiras,calendario',
    es: 'evento,eventos,encuentro,encuentros,cumbre,cumbres,calendario,conferencia,conferencias,organizan',
    fr: 'evenement,evenements,rencontre,rencontres,sommet,sommets,calendrier,conference,conferences,organisez',
  },
  tourism: {
    en: 'tourism,economy,diversify,diversification,beyond,mission,mandate,why,purpose,industries,competitive,robotics,robots',
    pt: 'turismo,economia,diversificar,diversificacao,alem,missao,porque,proposito,industrias,competitivas,robotica',
    es: 'turismo,economia,diversificar,diversificacion,mas alla,mision,por que,proposito,industrias,competitivas,robotica',
    fr: 'tourisme,economie,diversifier,diversification,au dela,mission,pourquoi,raison d etre,industries,competitives,robotique',
  },
  honest: {
    en: 'how do you answer,how do you work,how does this work,are you ai,are you an ai,are you a bot,are you a robot,ai,artificial intelligence,llm,chatgpt,gpt,claude,bot,robot,model,real,data,privacy,private,source,sources,trust,true,accurate',
    pt: 'como responde,como funciona,es uma ia,ia,inteligencia artificial,modelo,privacidade,dados,fonte,fontes,confianca,verdade',
    es: 'como responde,como funciona,eres una ia,es una ia,inteligencia artificial,modelo,privacidad,datos,fuente,fuentes,confianza,verdad',
    fr: 'comment repondez vous,comment ca marche,comment fonctionne,etes vous une ia,intelligence artificielle,modele,confidentialite,vie privee,donnees,source,sources,confiance,vrai',
  },
};
// Words that hint but do not decide (half weight in the browser's scoring).
export const GENERIC = ['about', 'who', 'what', 'how', 'why', 'new', 'start', 'real', 'true', 'work', 'do', 'run', 'show me', 'sobre', 'quem', 'porque', 'novo', 'trabalho', 'ai', 'ia', 'data', 'dados', 'try', 'algarve', 'algarve evolution',
  'quien', 'quienes', 'nuevo', 'por que', 'datos', 'uno', 'paso', 'hacen', 'trabajan', 'qui', 'pourquoi', 'nouveau', 'neuf', 'donnees', 'travaillez', 'faites vous', 'a propos', 'responsable'];

export function render({ lang, data, h, chrome }) {
  const { esc, t, source } = h;
  const L = (en, pt, es, fr) => ({ en, pt, es, fr })[lang] ?? en;
  const v = data.voice, eco = data.ecosystem;
  const fig = id => data.figures.figures.find(f => f.id === id);
  const quote = data.people.quotes[0];
  const person = data.people.people.find(p => p.id === quote.by);
  const pillars = data.programmes.pillars;
  const allProg = pillars.flatMap(p => p.programmes.map(g => ({ ...g, pillar: p })));
  const prog = id => allProg.find(g => g.id === id);
  const ev = id => data.events.events.find(e => e.id === id);
  const tl = at => eco.timeline.find(e => e.t === at);
  const appName = a => a.name[lang] || a.name.en;
  const appHref = a => langPath(a.path, lang);

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
  const range = (a, b) => L(`${a} to ${b}`, `${a} a ${b}`, `del ${a} al ${b}`, `du ${a} au ${b}`);
  const evItem = e => ({ when: `${e.approximate ? L('about ', 'cerca de ', 'hacia ', 'vers ') : ''}${e.end ? range(h.date(e.start), h.date(e.end)) : h.date(e.start)} · ${t(e.place)}`, title: t(e.name), text: t(e.summary), src: e.sources });
  const tlItem = at => { const e = tl(at); return { when: e.when, title: tlTitle(e, lang), text: e.text, src: e.src }; };
  const progCard = (g, k = true) => `<div class="card">${k ? `<p class="card-k">${esc(t(g.pillar.name))}</p>` : ''}<h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${mini(g.sources)}</div>`;
  const quoteCard = () => `<figure class="qcard"><blockquote${quote.text[lang] ? '' : ' lang="en"'}><p>${esc(t(quote.text))}</p></blockquote><figcaption><span class="qav" aria-hidden="true">AG</span><span><strong>${esc(person.name)}</strong> ${esc(t(person.role))}, Algarve Evolution · <time datetime="${quote.date}">${esc(h.date(quote.date))}</time>${lang !== 'en' && quote.text[lang] && quote.translation_note?.[lang] ? `<em>${esc(quote.translation_note[lang])}</em>` : ''}</span></figcaption>${mini(quote.sources)}</figure>`;
  const appCard = a => `<a class="card app" href="${esc(langPath(a.href, lang))}"><p class="card-k">${esc(h.words.proposal)} · ${L('working prototype', 'protótipo a funcionar', 'prototipo en marcha', 'prototype en action')}</p><h4>${esc(t(a.name))}</h4><p>${esc(t(a.summary))}</p><span class="go">${L('Open it', 'Abrir', 'Abrirlo', 'L\'ouvrir')} <span aria-hidden="true">→</span></span></a>`;

  // Mini map of the 16 municipalities.
  const munis = data.places.municipalities;
  const M = { lon0: -9.02, lat0: 37.56, k: 520, c: Math.cos(37.2 * Math.PI / 180) };
  const mx = lon => (lon - M.lon0) * M.c * M.k, my = lat => (M.lat0 - lat) * M.k;
  const poly = rings => rings.map(r => r.map(ring => ring.map(([lo, la], i) => `${i ? 'L' : 'M'}${mx(lo).toFixed(1)},${my(la).toFixed(1)}`).join(' ')).join(' ')).join(' ');
  const act = eco.places.map(p => p.name);
  const miniMap = `<figure class="mmap"><svg viewBox="0 0 740 330" role="img" aria-label="${esc(L('Map of the Algarve: our base in Faro, the 16 municipalities, and places where our events have been held', 'Mapa do Algarve: a nossa sede em Faro, os 16 municípios e lugares onde decorreram os nossos eventos', 'Mapa del Algarve: nuestra sede en Faro, los 16 municipios y los lugares donde se han celebrado nuestros eventos', `Carte de l'Algarve${NB}: notre siège à Faro, les 16 municipalités et les lieux où se sont tenus nos événements`))}">
    <path class="es" d="${poly(data.places.outline.countries.Spain)}"/><path class="pt" d="${poly(data.places.outline.countries.Portugal)}"/>
    ${munis.map(m => { const x = mx(m.ll[0]), y = my(m.ll[1]); const on = act.includes(m.name); return `<circle class="${m.id === 'faro' ? 'hq' : on ? 'on' : 'mu'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m.id === 'faro' ? 9 : on ? 6.5 : 5}"><title>${esc(m.name)}</title></circle>`; }).join('')}
    ${munis.filter(m => ['faro', 'lagos', 'portimao', 'albufeira', 'tavira', 'loule', 'monchique', 'aljezur', 'vila-real-de-santo-antonio'].includes(m.id)).map(m => { const x = mx(m.ll[0]), y = my(m.ll[1]); const up = ['monchique', 'aljezur', 'loule'].includes(m.id); const nm = m.id === 'vila-real-de-santo-antonio' ? 'V. R. S. António' : m.name; const end = m.id === 'vila-real-de-santo-antonio'; return `<text x="${(x + (end ? 4 : 0)).toFixed(1)}" y="${(y + (up ? -14 : 26)).toFixed(1)}" text-anchor="${end ? 'end' : 'middle'}" class="${m.id === 'faro' ? 'hq-t' : ''}">${esc(nm)}</text>`; }).join('')}
  </svg><figcaption><span><i class="k hq"></i>${L('Faro, our base', 'Faro, a nossa sede', 'Faro, nuestra sede', 'Faro, notre siège')}</span><span><i class="k on"></i>${L('where events have been held', 'onde decorreram eventos', 'donde se han celebrado eventos', 'lieux de nos événements')}</span><span><i class="k mu"></i>${L('the other municipalities', 'os outros municípios', 'los demás municipios', 'les autres municipalités')}</span></figcaption></figure>`;

  // Members over time, as small bars.
  const bars = [
    { y: '2019', v: 29, label: L('about 29 ICT companies', 'cerca de 29 empresas de TIC', 'unas 29 empresas TIC', 'environ 29 entreprises du numérique'), src: 'pres19' },
    { y: '2024', v: 70, label: L('about 70 companies and individuals', 'cerca de 70 empresas e particulares', 'unos 70 empresas y particulares', 'environ 70 entreprises et particuliers'), src: 'pres24' },
    { y: L('Oct 2026', 'out 2026', 'oct. 2026', 'oct. 2026'), v: 106, label: L('106 active members, own site', '106 membros ativos, site próprio', '106 miembros activos, sitio propio', '106 membres actifs, site propre'), src: fig('members').sources[0] },
    { y: L('Nov 2026', 'nov 2026', 'nov. 2026', 'nov. 2026'), v: 118, label: L('118 active members, as reported', '118 membros ativos, segundo notícia', '118 miembros activos, según la prensa', '118 membres actifs, selon la presse'), src: 'psn' },
  ];
  const barChart = `<figure class="bars"><div class="bars-in">${bars.map(b => `<div class="bar" style="--v:${(b.v / 118 * 100).toFixed(1)}%"><span class="bv">${b.v}</span><span class="bb"></span><span class="by">${esc(b.y)}</span></div>`).join('')}</div><figcaption>${bars.map(b => `<span>${esc(b.y)}${lang === 'fr' ? NB : ''}: ${esc(b.label)}</span>`).join(' · ')}. ${L('Different sources count different things; the bars are not one series.', 'As fontes contam coisas diferentes; as barras não são uma série.', 'Las fuentes cuentan cosas distintas; las barras no son una serie.', `Les sources ne comptent pas la même chose${NB}; les barres ne forment pas une série.`)}${mini(bars.map(b => b.src))}</figcaption></figure>`;

  // Partners and what we do together, from the ecosystem graph.
  const node = id => eco.nodes.find(x => x.id === id);
  const label = id => (nodeShort[lang] || {})[id] || node(id).label;
  const rel = r => relIn(lang, r);
  const partnerIds = ['ualg', 'stp', 'amal', 'nera', 'anje', 'ja', 'startupPt'];
  const partnerCards = `<div class="plist">${partnerIds.map(id => {
    const ls = eco.links.filter(([a, b]) => b === id && a !== 'ae' && node(a).kind !== 'municipality');
    return `<div class="pcard"><h4>${esc(label(id))}</h4><p>${ls.map(([a, , r]) => `${esc(label(a))} <span>(${esc(rel(r))})</span>`).join(', ')}</p></div>`;
  }).join('')}</div>`;

  const goalsTiles = tiles(v.goals.map((g, i) => ({ value: goalValue(g, lang, h), label: t(g.label), c: ['#e0902a', '#e8603c', '#0e9aa0'][i] })));
  const steps = `<ol class="steps">${v.join.map(j => `<li>${esc(t(j))}</li>`).join('')}</ol>`;
  const apps = v.apps.map(appCard).join('');
  const third = data.proposals.proposals.find(p => p.id === 'sell-to-the-problem');
  const dataFiles = `<p class="files">${['voice', 'figures', 'programmes', 'events', 'ecosystem', 'people', 'places', 'proposals', 'sources'].map(f => `<a class="file" href="/data/${f}.json">${f}.json</a>`).join('')}</p>`;
  const n50k = goalValue(v.goals[2], lang, h);
  const colon = lang === 'fr' ? `${NB}:` : ':';

  // ---------- the answers ----------
  const A = [
    { id: 'who', q: L('Who are you?', 'Quem são vocês?', '¿Quiénes son?', `Qui êtes-vous${NB}?`), d: L('The association, in a paragraph', 'A associação, num parágrafo', 'La asociación, en un párrafo', 'L\'association, en un paragraphe'),
      follow: ['goals', 'programmes', 'history'],
      body: lead(t(v.hero_lede)) + `<p>${esc(t(v.mission))}</p>` + tiles([figTile('founded'), figTile('members'), figTile('jobs')]) + chips([...fig('founded').sources, 'psn']) },
    { id: 'goals', q: L('What are your goals for 2032?', 'Quais são os vossos objetivos para 2032?', '¿Cuáles son sus objetivos para 2032?', `Quels sont vos objectifs pour 2032${NB}?`), d: L('Three targets, in numbers', 'Três metas, em números', 'Tres metas, en cifras', 'Trois objectifs, en chiffres'),
      follow: ['director', 'partners', 'programmes'],
      body: lead(L(`By 2032 we aim to support 500 companies, help create 150 startups and reach ${n50k} people. These are targets, not results.`, `Até 2032 queremos apoiar 500 empresas, ajudar a criar 150 startups e alcançar ${n50k} pessoas. São metas, não resultados.`, `Para 2032 queremos apoyar a 500 empresas, ayudar a crear 150 startups y llegar a ${n50k} personas. Son metas, no resultados.`, `D'ici 2032, nous voulons accompagner 500 entreprises, aider à créer 150 startups et toucher ${n50k} personnes. Ce sont des objectifs, pas des résultats.`)) + goalsTiles + chips(v.goals_sources) + `<p class="sub">${L('Our executive director on these goals:', 'O nosso diretor executivo sobre estes objetivos:', 'Nuestro director ejecutivo, sobre estos objetivos:', 'Notre directeur exécutif, sur ces objectifs')}${lang === 'fr' ? colon : ''}</p>` + quoteCard() },
    { id: 'programmes', q: L('What do you run?', 'O que fazem?', '¿Qué hacen?', `Que faites-vous${NB}?`), d: L('Three pillars, ten programmes', 'Três pilares, dez programas', 'Tres pilares, diez programas', 'Trois piliers, dix programmes'),
      follow: ['ideas', 'join', 'tourism'],
      body: lead(t(v.pillars_intro)) + pillars.map(p => `<h3 class="grp">${esc(t(p.name))}</h3><div class="cards">${p.programmes.map(g => progCard({ ...g, pillar: p }, false)).join('')}</div>`).join('') },
    { id: 'where', q: L('Where are you?', 'Onde estão?', '¿Dónde están?', `Où êtes-vous${NB}?`), d: L('Faro, and all 16 municipalities', 'Faro, e os 16 municípios', 'Faro, y los 16 municipios', 'Faro, et les 16 municipalités'),
      follow: ['partners', 'join', 'y2025'],
      body: lead(L('We are based in Faro, and our work reaches all 16 of the Algarve\'s municipalities: Algarve Digital Innovators has mapped 24 digital communities across them.', 'Estamos sediados em Faro, e o nosso trabalho chega aos 16 municípios do Algarve: a Algarve Digital Innovators mapeou 24 comunidades digitais em todos eles.', 'Tenemos nuestra sede en Faro, y nuestro trabajo llega a los 16 municipios del Algarve: Algarve Digital Innovators ha mapeado 24 comunidades digitales en todos ellos.', `Nous sommes basés à Faro, et notre travail s'étend aux 16 municipalités de l'Algarve${NB}: Algarve Digital Innovators y a recensé 24 communautés numériques.`)) + miniMap + `<ul class="tags">${munis.map(m => `<li${m.id === 'faro' ? ' class="hq"' : ''}>${esc(m.name)}</li>`).join('')}</ul>` + chips(['psn', ...prog('algarve-digital-innovators').sources, 'adi', ...eco.places.map(p => p.src)]) },
    { id: 'partners', q: L('Who do you work with?', 'Com quem trabalham?', '¿Con quién trabajan?', `Avec qui travaillez-vous${NB}?`), d: L('Universities, parks, associations', 'Universidades, parques, associações', 'Universidades, parques, asociaciones', 'Universités, parcs, associations'),
      follow: ['programmes', 'where', 'y2025'],
      body: lead(t(v.network_intro)) + `<p class="sub">${L('Partners, and what we do together', 'Parceiros, e o que fazemos em conjunto', 'Socios, y lo que hacemos juntos', 'Nos partenaires, et ce que nous faisons ensemble')}${colon}</p>` + partnerCards + chips(['adi', 'venture', 'ws25', 'econews22', 'psn']) },
    { id: 'join', q: L('How do I join?', 'Como me posso juntar?', '¿Cómo me uno?', `Comment vous rejoindre${NB}?`), d: L('Events, communities, membership', 'Eventos, comunidades, adesão', 'Eventos, comunidades, afiliación', 'Événements, communautés, adhésion'),
      follow: ['where', 'programmes', 'ideas'],
      body: lead(L('Three ways in, from the lightest to the most committed:', 'Três formas de chegar, da mais leve à mais comprometida:', 'Tres formas de entrar, de la más ligera a la más comprometida:', `Trois façons d'entrer, de la plus légère à la plus engagée${NB}:`)) + steps + `<p class="note">${L('This prototype takes no sign-ups and keeps no data. Everything happens through Algarve Evolution itself, on algarveevolution.pt; check there for current terms.', 'Este protótipo não faz inscrições nem guarda dados. Tudo acontece através da própria Algarve Evolution, em algarveevolution.pt; confirme lá as condições atuais.', 'Este prototipo no admite inscripciones ni guarda datos. Todo se hace a través de la propia Algarve Evolution, en algarveevolution.pt; consulte allí las condiciones actuales.', `Ce prototype ne prend aucune inscription et ne conserve aucune donnée. Tout passe par Algarve Evolution elle-même, sur algarveevolution.pt${NB}; vérifiez-y les conditions actuelles.`)}</p>` + chips(v.join_sources) },
    { id: 'y2025', q: L('What happened in 2025?', 'O que aconteceu em 2025?', '¿Qué pasó en 2025?', `Que s'est-il passé en 2025${NB}?`), d: L('Launches and summits', 'Lançamentos e cimeiras', 'Lanzamientos y cumbres', 'Lancements et sommets'),
      follow: ['y2026', 'events', 'partners'],
      body: lead(L('2025 was a year of launches and summits:', '2025 foi um ano de lançamentos e cimeiras:', '2025 fue un año de lanzamientos y cumbres:', `2025 a été une année de lancements et de sommets${NB}:`)) + timeline([evItem(ev('algarve-digital-innovators-launch-2025')), evItem(ev('algarve-tech-hub-summit-2025')), evItem(ev('algarve-startups-at-web-summit-2025')), tlItem(2025.97)]) },
    { id: 'y2026', q: L('What is new in 2026?', 'O que há de novo em 2026?', '¿Qué hay de nuevo en 2026?', `Quoi de neuf en 2026${NB}?`), d: L('From community to ecosystem', 'Da comunidade ao ecossistema', 'De la comunidad al ecosistema', 'De la communauté à l\'écosystème'),
      follow: ['ideas', 'goals', 'programmes'],
      body: lead(L('We describe 2026 as the year we move from building a community to making the ecosystem work.', 'Descrevemos 2026 como o ano em que passamos de construir uma comunidade a pôr o ecossistema a funcionar.', 'Describimos 2026 como el año en que pasamos de construir una comunidad a hacer funcionar el ecosistema.', 'Nous décrivons 2026 comme l\'année où nous passons de la construction d\'une communauté à un écosystème qui fonctionne.')) + mini(['psn']) + timeline([tlItem(2026.05), tlItem(2026.55), tlItem(2026.8), evItem(ev('vibathon-algarve-2026')), tlItem(2026.86)]) },
    { id: 'ideas', q: L('Show me the two working ideas', 'Mostrem-me as duas ideias a funcionar', 'Enséñenme las dos ideas en marcha', 'Montrez-moi les deux idées en action'), d: L('Proposals, built as prototypes', 'Propostas, feitas protótipos', 'Propuestas, convertidas en prototipos', 'Des propositions, devenues prototypes'),
      follow: ['join', 'programmes', 'honest'],
      body: lead(t(v.try_intro)) + `<div class="cards two">${apps}</div><div class="card plain"><p class="card-k">${esc(h.words.proposal)} · ${L('not built', 'não construída', 'no construida', 'non réalisée')}</p><h4>${esc(t(third.name))}</h4><p>${esc(t(third.summary))}</p></div>` + chips(data.proposals.proposals.flatMap(p => p.sources)) },
    { id: 'numbers', q: L('What are your numbers?', 'Quais são os vossos números?', '¿Cuáles son sus cifras?', `Quels sont vos chiffres${NB}?`), d: L('Members, jobs, events, communities', 'Membros, empregos, eventos, comunidades', 'Miembros, empleos, eventos, comunidades', 'Membres, emplois, événements, communautés'),
      follow: ['history', 'goals', 'events'],
      body: lead(L('Our own figures, as reported. Nobody here has audited them; where two sources differ, both are shown.', 'Os nossos próprios números, tal como foram noticiados. Ninguém aqui os auditou; quando duas fontes diferem, mostramos as duas.', 'Nuestras propias cifras, tal como se publicaron. Nadie aquí las ha auditado; cuando dos fuentes difieren, mostramos las dos.', `Nos propres chiffres, tels qu'ils ont été publiés. Personne ici ne les a vérifiés${NB}; quand deux sources diffèrent, nous montrons les deux.`)) + tiles(['members', 'jobs', 'events', 'communities', 'founded'].map(figTile)) },
    { id: 'history', q: L('How did you start?', 'Como começaram?', '¿Cómo empezaron?', `Comment avez-vous commencé${NB}?`), d: L('From 29 companies to 118 members', 'De 29 empresas a 118 membros', 'De 29 empresas a 118 miembros', 'De 29 entreprises à 118 membres'),
      follow: ['numbers', 'y2025', 'goals'],
      body: lead(t(v.story_intro)) + barChart + timeline([tlItem(2018), tlItem(2019.7), tlItem(2022.25)]) },
    { id: 'director', q: L('Who leads Algarve Evolution?', 'Quem lidera a Algarve Evolution?', '¿Quién dirige Algarve Evolution?', `Qui dirige Algarve Evolution${NB}?`), d: L('Our executive director', 'O nosso diretor executivo', 'Nuestro director ejecutivo', 'Notre directeur exécutif'),
      follow: ['goals', 'y2026', 'who'],
      body: lead(L(`${person.name} is our executive director.`, `${person.name} é o nosso diretor executivo.`, `${person.name} es nuestro director ejecutivo.`, `${person.name} est notre directeur exécutif.`)) + `<p>${esc(t(person.summary))}</p>` + mini(person.sources) + quoteCard() },
    { id: 'events', q: L('What events do you run?', 'Que eventos organizam?', '¿Qué eventos organizan?', `Quels événements organisez-vous${NB}?`), d: L('Summits, buildathons, conferences', 'Cimeiras, buildathons, conferências', 'Cumbres, buildathons, conferencias', 'Sommets, buildathons, conférences'),
      follow: ['y2025', 'join', 'where'],
      body: lead(L('Days we ran, co-ran or partnered, newest first. All are past; our current calendar is on algarveevolution.pt.', 'Dias que organizámos, coorganizámos ou apoiámos, do mais recente para o mais antigo. Todos já passaram; a nossa agenda atual está em algarveevolution.pt.', 'Jornadas que organizamos, coorganizamos o apoyamos, de la más reciente a la más antigua. Todas han pasado ya; nuestra agenda actual está en algarveevolution.pt.', `Les journées que nous avons organisées, coorganisées ou soutenues, de la plus récente à la plus ancienne. Toutes sont passées${NB}; notre agenda actuel est sur algarveevolution.pt.`)) + timeline(data.events.events.map(evItem)) + mini(['site']) },
    { id: 'tourism', q: L('Why beyond tourism?', 'Porquê para além do turismo?', '¿Por qué más allá del turismo?', `Pourquoi au-delà du tourisme${NB}?`), d: L('Our mandate', 'A nossa missão', 'Nuestra misión', 'Notre mission'),
      follow: ['programmes', 'goals', 'who'],
      body: lead(t(v.mission)) + mini(['psn']) + `<p class="sub">${L('One way we do it, for the tourism businesses already here', 'Uma das formas, para as empresas de turismo que já cá estão', 'Una de las formas de hacerlo, para las empresas turísticas que ya están aquí', 'L\'une de nos façons de faire, pour les entreprises touristiques déjà présentes')}${colon}</p><div class="cards">${progCard(prog('inova-algarve-3'))}</div>` },
    { id: 'honest', q: L('How do you answer?', 'Como responde?', '¿Cómo responde?', `Comment répondez-vous${NB}?`), d: L('No model, no network, only sourced data', 'Sem modelo, sem rede, só dados com fonte', 'Sin modelo, sin red, solo datos con fuente', 'Sans modèle, sans réseau, seulement des données sourcées'),
      follow: ['who', 'ideas', 'numbers'],
      body: lead(L('I am not a language model. I am this prototype site, answering from its own data files: every answer was written when the site was built, from the files below, and every fact links to its original source. When you type, your words are matched to the closest answer here in your browser. Nothing you type is sent anywhere.', 'Não sou um modelo de linguagem. Sou este protótipo de site, a responder a partir dos seus próprios ficheiros de dados: cada resposta foi escrita quando o site foi construído, a partir dos ficheiros abaixo, e cada facto liga à sua fonte original. Quando escreve, as suas palavras são comparadas com a resposta mais próxima, aqui no seu navegador. Nada do que escreve é enviado para lado nenhum.', 'No soy un modelo de lenguaje. Soy este prototipo de sitio, que responde a partir de sus propios archivos de datos: cada respuesta se escribió cuando se construyó el sitio, a partir de los archivos de abajo, y cada dato enlaza con su fuente original. Cuando escribe, sus palabras se comparan con la respuesta más cercana, aquí, en su navegador. Nada de lo que escribe se envía a ninguna parte.', `Je ne suis pas un modèle de langage. Je suis ce prototype de site, qui répond à partir de ses propres fichiers de données${NB}: chaque réponse a été écrite lors de la construction du site, à partir des fichiers ci-dessous, et chaque fait renvoie à sa source d'origine. Quand vous écrivez, vos mots sont comparés à la réponse la plus proche, ici, dans votre navigateur. Rien de ce que vous écrivez n'est envoyé nulle part.`)) + dataFiles + `<p class="note">${esc(t(v.banner))}</p>` },
  ];
  const byId = Object.fromEntries(A.map(a => [a.id, a]));
  const suggest = ['who', 'goals', 'programmes', 'where', 'partners', 'join', 'y2025', 'ideas'];

  // The two working ideas, as links (top menu, sidebar, greeting cards, palette). They open the apps themselves.
  const appIcon = ['<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="5" cy="13" r="2.2"/><circle cx="15" cy="6" r="2.2"/><circle cx="12" cy="15" r="1.6"/><path d="M5 13 15 6M15 6l-3 9M5 13l7 2"/></svg>',
    '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="8" height="12" rx="1"/><path d="M2.5 8h8M2.5 12h8M6.5 4v12"/><rect x="13" y="3" width="5" height="14" rx="1.6"/></svg>'];
  const appKw = { 'talent-map': 'talent map,talent,mapa de talento,talento,carte des talents,talents,map,mapa,carte', 'spreadsheet-to-app': 'spreadsheet,spreadsheet to app,folha de calculo,folha,hoja de calculo,hoja,tableur,app,aplicacao,aplicacion,application' };
  const appLine = L('Working idea: open the prototype', 'Ideia a funcionar: abrir o protótipo', 'Idea en marcha: abrir el prototipo', `Idée en action${NB}: ouvrir le prototype`);
  const ideasWord = h.words.ideas;

  const UI = {
    greet: L('Hello. I am the Algarve Evolution assistant on this prototype site. Ask me who we are, what we run, our goals for 2032 or how to join. I answer only from this site\'s sourced data, and every answer shows its sources.', 'Olá. Sou o assistente da Algarve Evolution neste protótipo de site. Pergunte-me quem somos, o que fazemos, os nossos objetivos para 2032 ou como se juntar a nós. Respondo apenas com os dados com fonte deste site, e cada resposta mostra as suas fontes.', 'Hola. Soy el asistente de Algarve Evolution en este prototipo de sitio. Pregúnteme quiénes somos, qué hacemos, nuestros objetivos para 2032 o cómo unirse. Respondo solo con los datos con fuente de este sitio, y cada respuesta muestra sus fuentes.', 'Bonjour. Je suis l\'assistant d\'Algarve Evolution sur ce prototype de site. Demandez-moi qui nous sommes, ce que nous menons, nos objectifs pour 2032 ou comment nous rejoindre. Je réponds uniquement à partir des données sourcées de ce site, et chaque réponse montre ses sources.'),
    none: L('I do not have a sourced answer for that, and I will not guess. I answer only from this site\'s data. Here is what I can tell you about:', 'Não tenho uma resposta com fonte para isso, e não vou adivinhar. Respondo apenas com os dados deste site. Eis o que lhe posso dizer:', 'No tengo una respuesta con fuente para eso, y no voy a adivinar. Respondo solo con los datos de este sitio. Esto es lo que puedo contarle:', `Je n'ai pas de réponse sourcée à cela, et je ne vais pas deviner. Je réponds uniquement à partir des données de ce site. Voici ce dont je peux vous parler${NB}:`),
    matched: L('Best match for', 'Melhor correspondência para', 'Mejor coincidencia para', 'Meilleure correspondance pour'),
    colon,
    also: L('You might also mean', 'Talvez queira dizer', 'Quizá quiera decir', 'Vous vouliez peut-être dire'),
    more: L('Ask next', 'Pergunte a seguir', 'Pregunte a continuación', 'Questions suivantes'),
    copy: L('Copy link', 'Copiar ligação', 'Copiar enlace', 'Copier le lien'),
    copied: L('Link copied', 'Ligação copiada', 'Enlace copiado', 'Lien copié'),
    noresults: L('No question matches. Press Enter to ask anyway.', 'Nenhuma pergunta corresponde. Prima Enter para perguntar na mesma.', 'Ninguna pregunta coincide. Pulse Intro para preguntar de todos modos.', 'Aucune question ne correspond. Appuyez sur Entrée pour demander quand même.'),
    quote: lang === 'fr' ? ['« ', ' »'] : lang === 'es' || lang === 'pt' ? ['«', '»'] : ['“', '”'],
  };
  const gen = new Set(GENERIC);
  const json = JSON.stringify({
    lang, ui: UI, suggest, generic: GENERIC,
    answers: A.map(a => ({ id: a.id, q: a.q, d: a.d, kw: [...new Set([...Object.values(KW[a.id]).join(',').split(','), norm(a.q)].map(norm).filter(Boolean))], follow: a.follow })),
    apps: APPS.map(a => ({ id: a.id, q: appName(a), d: appLine, href: appHref(a), kw: appKw[a.id].split(',').map(norm).filter(k => !gen.has(k)) })),
  }).replace(/</g, '\\u003c');

  const orb = (cls = 'orb') => `<span class="${cls}" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M6 24c4-2.5 7.5 1.5 14 0s10-2.5 14 0" stroke="#fff" stroke-opacity=".9" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="20" cy="15" r="4.5" fill="#fff" fill-opacity=".95"/></svg></span>`;
  const kbd = '<kbd>Ctrl</kbd><kbd>K</kbd>';
  const jump = L('Jump to an answer', 'Ir para uma resposta', 'Ir a una respuesta', 'Aller à une réponse');
  const themeL = L('Switch light or dark', 'Alternar claro ou escuro', 'Cambiar entre claro y oscuro', 'Basculer entre clair et sombre');

  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">
<title>${esc(L('Ask Algarve Evolution', 'Pergunte à Algarve Evolution', 'Pregunte a Algarve Evolution', 'Demandez à Algarve Evolution'))}</title>
<meta name="description" content="${esc(L('Ask Algarve Evolution about its work, goals and partners; every answer comes from sourced data.', 'Pergunte à Algarve Evolution sobre o seu trabalho, objetivos e parceiros; cada resposta vem de dados com fonte.', 'Pregunte a Algarve Evolution por su trabajo, sus objetivos y sus socios; cada respuesta procede de datos con fuente.', `Interrogez Algarve Evolution sur son travail, ses objectifs et ses partenaires${NB}; chaque réponse vient de données sourcées.`))} ${esc(t(v.banner))}">
<meta name="color-scheme" content="light dark">
<script>(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('ae-agent-theme');if(t)d.dataset.theme=t;}catch(e){}})()</script>
${chrome.head}
<link rel="stylesheet" href="/d/agent/agent.css">
</head>
<body>
${chrome.banner}
<a class="skip" href="#log">${L('Skip to the conversation', 'Saltar para a conversa', 'Saltar a la conversación', 'Aller à la conversation')}</a>
<div class="shell">
  <aside class="side" aria-label="${L('Topics', 'Temas', 'Temas', 'Thèmes')}">
    <div class="brand">${orb()}<div><strong>Algarve Evolution</strong><span>${L('Assistant', 'Assistente', 'Asistente', 'Assistant')} <em>${L('prototype', 'protótipo', 'prototipo', 'prototype')}</em></span></div></div>
    <button type="button" class="newchat" data-new hidden><span aria-hidden="true">+</span> ${L('New conversation', 'Nova conversa', 'Nueva conversación', 'Nouvelle conversation')}</button>
    <button type="button" class="search" data-palette hidden><span>${jump}</span><span class="keys">${kbd}</span></button>
    <nav class="side-apps" aria-label="${esc(ideasWord)}"><p class="side-h">${esc(ideasWord)}</p><ul>${APPS.map((a, i) => `<li><a href="${esc(appHref(a))}">${appIcon[i]}<span>${esc(appName(a))}</span><span class="ext" aria-hidden="true">→</span></a></li>`).join('')}</ul></nav>
    <nav class="topics" aria-label="${L('All questions', 'Todas as perguntas', 'Todas las preguntas', 'Toutes les questions')}"><p class="side-h">${L('Questions I can answer', 'Perguntas a que sei responder', 'Preguntas que sé responder', 'Questions auxquelles je sais répondre')}</p><ol>${A.map(a => `<li><a href="#a-${a.id}" data-ask="${a.id}">${esc(a.q)}</a></li>`).join('')}</ol></nav>
    <div class="side-foot">
      <p>${L('Answers come only from this site\'s sourced data. No AI model runs here, and nothing you type leaves your browser.', 'As respostas vêm apenas dos dados com fonte deste site. Não corre aqui nenhum modelo de IA, e nada do que escreve sai do seu navegador.', 'Las respuestas proceden solo de los datos con fuente de este sitio. Aquí no se ejecuta ningún modelo de IA, y nada de lo que escribe sale de su navegador.', 'Les réponses viennent uniquement des données sourcées de ce site. Aucun modèle d\'IA ne tourne ici, et rien de ce que vous écrivez ne quitte votre navigateur.')}</p>
      <div class="side-ctl"><button type="button" class="theme" data-theme-toggle hidden aria-label="${themeL}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button><span class="side-langs">${h.langs.filter(l => l !== lang).map(l => `<a href="${esc(chrome.alt[l])}" hreflang="${l}" lang="${l}" title="${esc(h.langNames[l])}">${l.toUpperCase()}</a>`).join('')}</span></div>
    </div>
  </aside>

  <main class="main" id="main">
    <header class="top">
      <div class="top-l">${orb('orb sm')}<div><h1>${L('Ask Algarve Evolution', 'Pergunte à Algarve Evolution', 'Pregunte a Algarve Evolution', 'Demandez à Algarve Evolution')}</h1><p class="status"><span class="dot" aria-hidden="true"></span>${L('Sourced answers only', 'Só respostas com fonte', 'Solo respuestas con fuente', 'Réponses sourcées uniquement')}</p></div></div>
      <nav class="top-apps" aria-label="${esc(ideasWord)}">${APPS.map((a, i) => `<a class="tapp" href="${esc(appHref(a))}">${appIcon[i]}<span>${esc(appName(a))}</span></a>`).join('')}</nav>
      <div class="top-r"><button type="button" class="iconbtn" data-palette hidden aria-label="${jump}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><span class="keys">${kbd}</span></button><button type="button" class="iconbtn theme-m" data-theme-toggle hidden aria-label="${themeL}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button></div>
    </header>

    <div class="log" id="log" tabindex="-1" aria-label="${L('Conversation', 'Conversa', 'Conversación', 'Conversation')}">
      <div class="hello">${orb('orb xl')}<h2>${L('Ask us anything about Algarve Evolution', 'Pergunte-nos o que quiser sobre a Algarve Evolution', 'Pregúntenos lo que quiera sobre Algarve Evolution', 'Posez-nous toutes vos questions sur Algarve Evolution')}</h2><p>${L(`${A.length} sourced answers · four languages · no model, no network`, `${A.length} respostas com fonte · quatro línguas · sem modelo, sem rede`, `${A.length} respuestas con fuente · cuatro idiomas · sin modelo, sin red`, `${A.length} réponses sourcées · quatre langues · sans modèle, sans réseau`)}</p></div>
      <div class="msg bot greet"><div class="av">${orb('orb av-o')}</div><div class="body"><p class="lead">${esc(UI.greet)}</p>
        <div class="sugg" data-sugg>${suggest.map(id => `<a class="sg" href="#a-${id}" data-ask="${id}"><strong>${esc(byId[id].q)}</strong><span>${esc(byId[id].d)}</span></a>`).join('')}${APPS.map((a, i) => `<a class="sg sg-app" href="${esc(appHref(a))}">${appIcon[i]}<strong>${esc(appName(a))} <span class="ext" aria-hidden="true">→</span></strong><span>${esc(appLine)}</span></a>`).join('')}</div>
        <noscript><p class="note">${L('JavaScript is off, so here is the whole conversation: every question I can answer, with its answer and sources.', 'O JavaScript está desligado, por isso aqui está a conversa toda: cada pergunta a que sei responder, com a resposta e as fontes.', 'JavaScript está desactivado, así que aquí tiene toda la conversación: cada pregunta que sé responder, con su respuesta y sus fuentes.', `JavaScript est désactivé${NB}: voici donc toute la conversation, chaque question à laquelle je sais répondre, avec sa réponse et ses sources.`)}</p></noscript>
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
        <label class="vh" for="ask">${L('Ask a question', 'Faça uma pergunta', 'Haga una pregunta', 'Posez une question')}</label>
        <textarea id="ask" rows="1" placeholder="${L('Ask about our goals, programmes, partners, events...', 'Pergunte pelos objetivos, programas, parceiros, eventos...', 'Pregunte por objetivos, programas, socios, eventos...', 'Nos objectifs, programmes, partenaires, événements...')}" enterkeyhint="send"></textarea>
        <button type="submit" class="send" aria-label="${L('Send', 'Enviar', 'Enviar', 'Envoyer')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
      </form>
      <p class="disclaim">${L('Matches your words to answers written from sourced data, in your browser. No model, no network.', 'Compara as suas palavras com respostas escritas a partir de dados com fonte, no seu navegador. Sem modelo, sem rede.', 'Compara sus palabras con respuestas escritas a partir de datos con fuente, en su navegador. Sin modelo, sin red.', 'Compare vos mots à des réponses écrites à partir de données sourcées, dans votre navigateur. Sans modèle, sans réseau.')} <span class="disc-k">${L('Press', 'Prima', 'Pulse', 'Appuyez sur')} ${kbd} ${L('to jump', 'para saltar', 'para saltar', 'pour aller à une réponse')}.</span></p>
    </div>
    <p class="vh" aria-live="polite" data-live></p>
    <footer class="foot"><p>${esc(t(v.footer_disclosure))}</p><p>${esc(t(v.banner))} <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a> · ${L('Version', 'Versão', 'Versión', 'Version')} ${esc(chrome.version)} · ${L('Code Apache-2.0; text CC BY 4.0', 'Código Apache-2.0; texto CC BY 4.0', 'Código Apache-2.0; texto CC BY 4.0', `Code Apache-2.0${NB}; texte CC BY 4.0`)} · <a href="/d/agent/fonts/README.md">${L('Fonts', 'Tipos de letra', 'Tipografías', 'Polices')}</a></p></footer>
  </main>
</div>

<dialog class="pal" aria-label="${jump}">
  <div class="pal-in">
    <div class="pal-s"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="${L('Type to search the answers', 'Escreva para procurar nas respostas', 'Escriba para buscar en las respuestas', 'Tapez pour chercher dans les réponses')}" aria-label="${L('Search the answers', 'Procurar nas respostas', 'Buscar en las respuestas', 'Chercher dans les réponses')}"><kbd>Esc</kbd></div>
    <ul id="pal-list" role="listbox" aria-label="${L('Answers', 'Respostas', 'Respuestas', 'Réponses')}"></ul>
    <p class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> ${L('move', 'mover', 'mover', 'naviguer')}</span><span><kbd>Enter</kbd> ${L('ask', 'perguntar', 'preguntar', 'demander')}</span><span><kbd>Esc</kbd> ${L('close', 'fechar', 'cerrar', 'fermer')}</span></p>
  </div>
</dialog>


<script type="application/json" id="agent-data">${json}</script>
<script src="/d/agent/agent.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
