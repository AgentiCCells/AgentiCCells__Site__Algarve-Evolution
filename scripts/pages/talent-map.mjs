// Our talent map: a working prototype of the proposal "An Algarve talent map" (SGit Newsroom, 31 October 2026).
// Rendered at build time in en and pt so the whole list reads without JavaScript; /talent-map/app.js adds the map,
// filters, matching, the needs board, the consent preview and the simulated pay-per-contact meter.
// Real layer: organisations only, from PrompTugal.news research (src/talent-map/data/organisations.json, compiled by
// scripts/pages/_talent-map-data.mjs). People and needs are simulated (the prototype's invented data).
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0; text CC BY 4.0.
import { readFileSync } from 'node:fs';

export const name = 'talent-map';
export const paths = { en: '/talent-map/', pt: '/pt/talent-map/' };

const read = f => JSON.parse(readFileSync(new URL(`../../src/talent-map/data/${f}`, import.meta.url), 'utf8'));
const PROPOSAL = 'https://newsroom.sgit.ai/articles/an-algarve-talent-map.html';
const MATCH_PROPOSAL = 'https://newsroom.sgit.ai/articles/sell-to-the-companies-that-already-have-the-problem.html';
const REPO = 'https://github.com/PrompTugal/PrompTugal__News__Website';

export const KIND = {
  support: { en: 'Support and funding', pt: 'Apoio e financiamento', den: 'Associations, development desks, competitions, incentive schemes', dpt: 'Associações, gabinetes de apoio, concursos, incentivos' },
  incubation: { en: 'Mentoring and incubation', pt: 'Mentoria e incubação', den: 'Incubators, accelerators, coworking, mentoring', dpt: 'Incubadoras, aceleradoras, coworking, mentoria' },
  education: { en: 'Education and research', pt: 'Ensino e investigação', den: 'Universities, research centres, schools', dpt: 'Universidades, centros de investigação, escolas' },
  community: { en: 'Communities', pt: 'Comunidades', den: 'Meetups and networks', dpt: 'Encontros e redes' },
  public: { en: 'Public bodies', pt: 'Entidades públicas', den: 'Councils and regional bodies', dpt: 'Câmaras e entidades regionais' },
  company: { en: 'Companies', pt: 'Empresas', den: 'Companies and startups', dpt: 'Empresas e startups' },
  funding: { en: 'Investment and grants', pt: 'Investimento e subvenções', den: 'Who funded what, with amounts where given', dpt: 'Quem financiou o quê, com montantes quando indicados' },
};
const ROLE = { talent: { en: 'Services and talent', pt: 'Serviços e talento' }, mentor: { en: 'Mentor', pt: 'Mentoria' }, investor: { en: 'Investor', pt: 'Investimento' } };

const W = {
  en: {
    title: 'Our talent map: who in the Algarve can help | Algarve Evolution',
    desc: 'A working prototype of our talent map: real organisations from public research, simulated people, needs and matching. Not yet approved by Algarve Evolution.',
    skip: 'Skip to content', home: 'Algarve Evolution home', crumb: 'Our talent map',
    nav: [['ask', 'Ask'], ['explore', 'Explore'], ['needs', 'Needs'], ['consent', 'Consent'], ['how', 'How it works']],
    proto: 'Working prototype of a proposal', notAgreed: 'Nothing here is agreed yet',
    h1: 'Our talent map', h1sub: 'Who in the Algarve can help you, by town and by need.',
    lede: 'We have mapped the people in the region who provide services, mentor and invest. This prototype shows how that map could work in public: say what you need, and find the organisations and people who fit.',
    lede2: 'The organisations are real, each with its public source. The people are simulated: in the real map, nobody is listed until they have seen their own listing and said yes.',
    realTag: 'Real', realTxt: 'organisations, each with its source', simTag: 'Simulated', simTxt: 'people and needs, invented',
    askLabel: 'What do you need?', askPh: 'For example: a designer in Faro', askBtn: 'Find matches',
    askHint: 'Type it as you would say it. We rank organisations and simulated people by what you ask for, the kind of help and the town, and show why each one matched.',
    tryLabel: 'Try',
    examples: ['I need a designer in Faro', 'Funding for a hardware prototype', 'An incubator in Portimão', 'A mentor for fundraising', 'An AI developer for my hotel', 'Our first app now needs 50 users'],
    noscriptAsk: 'Matching needs JavaScript. The full list below works without it.',
    stats: [['organisations from public research'], ['municipalities, and the region'], ['simulated people'], ['simulated needs']],
    statsSrc: 'Counts of this page\'s data: organisations from PrompTugal.news research, people and needs from the proposal\'s prototype.',
    thirdTitle: 'This also shows a third proposal',
    thirdTxt: 'When a business has built its own first app and five or fifty people now need to use it, match it with the region\'s service providers. Try',
    thirdTry: 'Our first app now needs 50 users',
    exploreH: 'Explore the map', exploreIntro: 'Click a municipality to see who is there, then narrow it down by the kind of help you need.',
    layerOrg: 'Organisations', layerPeople: 'People', layerPeopleSim: 'simulated',
    mapTitle: 'Map of the Algarve\'s 16 municipalities', mapDesc: 'Each circle is a municipality; its size is the number of entries there. Select one to filter the list.',
    region: 'Across the Algarve', regionShort: 'Region-wide', allTowns: 'Every municipality',
    search: 'Search', searchPh: 'Name, topic or town', kindLegend: 'What kind of help', where: 'Where', clear: 'Clear filters',
    mapNote: 'Circles sit at each municipality\'s approximate centre. Outline: Natural Earth (public domain).',
    countOrg: n => `${n} organisation${n === 1 ? '' : 's'}`, countPeople: n => `${n} approved listing${n === 1 ? '' : 's'}, simulated`,
    alsoHere: 'Also active here', source: 'Source', read: 'read', partner: 'Works with us', us: 'That is us', open: 'Open',
    simBadge: 'Simulated', consentBanner: 'Every person here is invented.', consentBanner2: 'The real map lists nobody until they have seen their own listing and said yes, and anyone can withdraw.', consentLink: 'See the consent step',
    awaiting: 'Not listed: has not answered yet', approved: 'Approved their listing',
    needsH: 'Needs board', needsIntro: 'What founders, companies and students are looking for. Anyone listed can answer; we make the introduction.',
    offer: 'Offer', findMatches: 'Find matches', postH: 'Post a need',
    postNote: 'Posting is free. In this prototype your need is kept only in this browser (localStorage): nothing is sent to anyone, nobody else sees it, and you can delete it.',
    fWho: 'Who you are', fWhoPh: 'A founder in Faro', fWhat: 'What you need', fWhatPh: 'A part-time developer for a two-month pilot with three hotels',
    fTown: 'Where', fPay: 'What you will pay', fPayPh: '€300/day, about 20 days', fRole: 'What kind of help',
    fRoles: [['talent', 'Services and talent'], ['mentor', 'A mentor'], ['investor', 'Investment'], ['org', 'An organisation']],
    fSubmit: 'Post it, in this browser',
    consentH: 'Consent first',
    consentTxt: 'These are people\'s names, skills, rates and contact details, so the order matters. Before anyone is listed, they receive a preview of their own listing from the map\'s mailbox, with three answers. Nobody is published until they say yes; the date of their yes is kept, and they can withdraw at any time. Being listed is free.',
    previewFor: 'Show the preview for', mailFrom: 'From', mailTo: 'To', mailSubject: 'Subject',
    mailFromV: 'Our talent map (a simulated mailbox)', mailSubjectV: 'Your listing on our talent map: approve, change or say no',
    mailHello: 'Hello', mailBody: 'You took part in our mapping of the region\'s talent. Before anything is published, this is exactly how your listing would appear. Nothing appears until you approve it, and you can remove it at any time.',
    approve: 'Approve and publish', change: 'Change something', noList: 'Do not list me',
    howH: 'How it would work',
    how: [
      ['The spreadsheet we already hold', 'It stays ours. Only approved rows ever leave it.'],
      ['A mailbox of its own', 'For previews, approvals and introductions.'],
      ['A Claude session', 'It reads the spreadsheet, builds the site, writes each preview and handles the replies.'],
      ['A repository with Pages', 'No server and no database: the approved data is a file, and the site reads it.'],
    ],
    payH: 'Pay per contact, after the value',
    payTxt: 'Being listed is free, and so is browsing and posting a need. A visitor pays a little per contact, after seeing the profile. In this prototype a contact costs €0.50 from €5 of starting credit, as in the proposal\'s prototype: it is simulated, nothing is charged and nothing is sent. What an introduction is worth is not decided.',
    footData: 'Data', footSources: 'Sources', footLicence: 'Licence',
    footDataTxt: 'Organisations: PrompTugal.news public research, compiled on', footDataTxt2: 'People and needs: invented, from the proposal\'s prototype (public vault cig07f79).',
    footLic: 'Text CC BY 4.0, code Apache-2.0.', back: 'Back to our home page', version: 'Version',
    files: 'The data files', readme: 'How they were compiled',
  },
  pt: {
    title: 'O nosso mapa de talento: quem pode ajudar no Algarve | Algarve Evolution',
    desc: 'Um protótipo a funcionar do nosso mapa de talento: organizações reais a partir de pesquisa pública, pessoas, necessidades e correspondências simuladas. Ainda não aprovado pela Algarve Evolution.',
    skip: 'Saltar para o conteúdo', home: 'Página inicial da Algarve Evolution', crumb: 'Mapa de talento',
    nav: [['ask', 'Pedir'], ['explore', 'Explorar'], ['needs', 'Necessidades'], ['consent', 'Consentimento'], ['how', 'Como funciona']],
    proto: 'Protótipo a funcionar de uma proposta', notAgreed: 'Nada aqui está ainda acordado',
    h1: 'O nosso mapa de talento', h1sub: 'Quem pode ajudar no Algarve, por concelho e por necessidade.',
    lede: 'Fizemos o levantamento das pessoas da região que prestam serviços, são mentoras ou investem. Este protótipo mostra como esse mapa pode funcionar em público: diga o que precisa e encontre as organizações e as pessoas certas.',
    lede2: 'As organizações são reais, cada uma com a sua fonte pública. As pessoas são simuladas: no mapa real, ninguém é publicado sem ver a sua entrada e dizer que sim.',
    realTag: 'Real', realTxt: 'organizações, cada uma com a sua fonte', simTag: 'Simulado', simTxt: 'pessoas e necessidades, inventadas',
    askLabel: 'De que precisa?', askPh: 'Por exemplo: um designer em Faro', askBtn: 'Encontrar',
    askHint: 'Escreva como diria. Ordenamos organizações e pessoas simuladas pelo que pede, pelo tipo de ajuda e pelo concelho, e mostramos porque cada uma aparece.',
    tryLabel: 'Experimente',
    examples: ['Preciso de um designer em Faro', 'Financiamento para um protótipo de hardware', 'Uma incubadora em Portimão', 'Um mentor para angariar investimento', 'Um programador de IA para o meu hotel', 'A nossa primeira aplicação já tem 50 utilizadores'],
    noscriptAsk: 'As correspondências precisam de JavaScript. A lista completa abaixo funciona sem ele.',
    stats: [['organizações a partir de pesquisa pública'], ['concelhos, e a região'], ['pessoas simuladas'], ['necessidades simuladas']],
    statsSrc: 'Contagens dos dados desta página: organizações da pesquisa do PrompTugal.news, pessoas e necessidades do protótipo da proposta.',
    thirdTitle: 'Isto mostra também uma terceira proposta',
    thirdTxt: 'Quando uma empresa construiu a sua primeira aplicação e cinco ou cinquenta pessoas precisam de a usar, ligá-la aos fornecedores de serviços da região. Experimente',
    thirdTry: 'A nossa primeira aplicação já tem 50 utilizadores',
    exploreH: 'Explorar o mapa', exploreIntro: 'Clique num concelho para ver quem lá está e depois escolha o tipo de ajuda de que precisa.',
    layerOrg: 'Organizações', layerPeople: 'Pessoas', layerPeopleSim: 'simuladas',
    mapTitle: 'Mapa dos 16 concelhos do Algarve', mapDesc: 'Cada círculo é um concelho; o tamanho é o número de entradas. Escolha um para filtrar a lista.',
    region: 'Todo o Algarve', regionShort: 'Toda a região', allTowns: 'Todos os concelhos',
    search: 'Pesquisar', searchPh: 'Nome, tema ou concelho', kindLegend: 'Que tipo de ajuda', where: 'Onde', clear: 'Limpar filtros',
    mapNote: 'Os círculos estão no centro aproximado de cada concelho. Contorno: Natural Earth (domínio público).',
    countOrg: n => `${n} organizaç${n === 1 ? 'ão' : 'ões'}`, countPeople: n => `${n} entrada${n === 1 ? '' : 's'} aprovada${n === 1 ? '' : 's'}, simulada${n === 1 ? '' : 's'}`,
    alsoHere: 'Também ativas aqui', source: 'Fonte', read: 'lido a', partner: 'Trabalha connosco', us: 'Somos nós', open: 'Abrir',
    simBadge: 'Simulado', consentBanner: 'Todas as pessoas aqui são inventadas.', consentBanner2: 'O mapa real não publica ninguém sem que veja a sua entrada e diga que sim, e qualquer pessoa pode retirar-se.', consentLink: 'Ver o passo do consentimento',
    awaiting: 'Não publicada: ainda não respondeu', approved: 'Aprovou a sua entrada',
    needsH: 'Quadro de necessidades', needsIntro: 'O que fundadores, empresas e estudantes procuram. Quem está no mapa pode responder; nós fazemos a apresentação.',
    offer: 'Oferta', findMatches: 'Encontrar', postH: 'Publicar uma necessidade',
    postNote: 'Publicar é gratuito. Neste protótipo a sua necessidade fica só neste navegador (localStorage): nada é enviado, mais ninguém a vê e pode apagá-la.',
    fWho: 'Quem é', fWhoPh: 'Uma fundadora em Faro', fWhat: 'De que precisa', fWhatPh: 'Um programador a tempo parcial para um piloto de dois meses com três hotéis',
    fTown: 'Onde', fPay: 'Quanto vai pagar', fPayPh: '300 €/dia, cerca de 20 dias', fRole: 'Que tipo de ajuda',
    fRoles: [['talent', 'Serviços e talento'], ['mentor', 'Mentoria'], ['investor', 'Investimento'], ['org', 'Uma organização']],
    fSubmit: 'Publicar, neste navegador',
    consentH: 'Consentimento primeiro',
    consentTxt: 'São nomes, competências, preços e contactos de pessoas, por isso a ordem importa. Antes de alguém ser publicado, recebe da caixa de correio do mapa uma pré-visualização da sua entrada, com três respostas. Ninguém é publicado sem dizer que sim; a data do sim fica guardada e pode retirar-se a qualquer momento. Estar no mapa é gratuito.',
    previewFor: 'Mostrar a pré-visualização de', mailFrom: 'De', mailTo: 'Para', mailSubject: 'Assunto',
    mailFromV: 'O nosso mapa de talento (caixa de correio simulada)', mailSubjectV: 'A sua entrada no nosso mapa de talento: aprovar, alterar ou recusar',
    mailHello: 'Olá', mailBody: 'Participou no nosso levantamento do talento da região. Antes de publicarmos alguma coisa, é exatamente assim que a sua entrada apareceria. Nada aparece sem a sua aprovação e pode retirá-la a qualquer momento.',
    approve: 'Aprovar e publicar', change: 'Alterar alguma coisa', noList: 'Não me publiquem',
    howH: 'Como funcionaria',
    how: [
      ['A folha de cálculo que já temos', 'Continua nossa. Só as linhas aprovadas saem dela.'],
      ['Uma caixa de correio própria', 'Para pré-visualizações, aprovações e apresentações.'],
      ['Uma sessão do Claude', 'Lê a folha de cálculo, constrói o site, escreve cada pré-visualização e trata das respostas.'],
      ['Um repositório com Pages', 'Sem servidor nem base de dados: os dados aprovados são um ficheiro e o site lê-o.'],
    ],
    payH: 'Pagar por contacto, depois do valor',
    payTxt: 'Estar no mapa é gratuito, tal como navegar e publicar uma necessidade. Quem visita paga um pouco por contacto, depois de ver o perfil. Neste protótipo um contacto custa 0,50 € de 5 € de crédito inicial, como no protótipo da proposta: é simulado, nada é cobrado e nada é enviado. O valor de uma apresentação não está decidido.',
    footData: 'Dados', footSources: 'Fontes', footLicence: 'Licença',
    footDataTxt: 'Organizações: pesquisa pública do PrompTugal.news, compilada a', footDataTxt2: 'Pessoas e necessidades: inventadas, do protótipo da proposta (cofre público cig07f79).',
    footLic: 'Texto CC BY 4.0, código Apache-2.0.', back: 'Voltar à nossa página inicial', version: 'Versão',
    files: 'Os ficheiros de dados', readme: 'Como foram compilados',
  },
};

// The map: equirectangular, scaled for latitude, fitted to the Algarve.
const LON0 = -9.1, LON1 = -7.27, LAT0 = 36.93, LAT1 = 37.56, COS = Math.cos(37.25 * Math.PI / 180);
const K = 1000 / ((LON1 - LON0) * COS), MAP_H = Math.round((LAT1 - LAT0) * K);
const proj = ([lon, lat]) => [+((lon - LON0) * COS * K).toFixed(1), +((LAT1 - lat) * K).toFixed(1)];
// Small nudges where two centres would overlap, and where each label goes (side, lines, anchor, dx), hand-placed.
const NUDGE = { 'castro-marim': [-20, -13], 'vila-real-de-santo-antonio': [16, 11], olhao: [10, 2], lagoa: [12, 0], portimao: [-8, 0], silves: [12, -16] };
const LABEL = {
  faro: { side: 'l' }, olhao: { side: 'r' }, loule: { side: 'l' }, 'sao-bras-de-alportel': { side: 't', lines: ['São Brás', 'de Alportel'] },
  tavira: { side: 'b' }, 'vila-real-de-santo-antonio': { side: 'b', lines: ['Vila Real de', 'Santo António'], anchor: 'end', dx: 55 },
  'castro-marim': { side: 't' }, alcoutim: { side: 'l' }, albufeira: { side: 'b' }, lagoa: { side: 'b' }, portimao: { side: 't' },
  silves: { side: 't' }, lagos: { side: 'b' }, 'vila-do-bispo': { side: 'b' }, aljezur: { side: 't' }, monchique: { side: 't' },
};
export const radius = n => (n ? 9 + Math.sqrt(n) * 4.6 : 6);
// Where a label sits relative to its circle; app.js uses the same rule when the circles resize.
export const labelAt = (side, r, lines = 1, dx = 0) => side === 'b' ? [dx, r + 26] : side === 't' ? [dx, -r - 10 - (lines - 1) * 24]
  : side === 'l' ? [-r - 8 + dx, 8 - (lines - 1) * 12] : [r + 8 + dx, 8 - (lines - 1) * 12];

function mapSvg({ data, w, lang, presence }) {
  const o = data.places.outline.countries;
  const ring = poly => poly.map(r => 'M' + r.map(p => proj(p).join(',')).join('L') + 'Z').join('');
  const path = mp => mp.map(ring).join('');
  const bubbles = data.places.municipalities.map(m => {
    const [x0, y0] = proj(m.ll); const [nx, ny] = NUDGE[m.id] || [0, 0]; const x = +(x0 + nx).toFixed(1), y = +(y0 + ny).toFixed(1);
    const n = presence[m.id] || 0, r = radius(n), L = LABEL[m.id] || { side: 'r' }, lines = L.lines || [m.name];
    const anchor = L.anchor || (L.side === 'l' ? 'end' : L.side === 'r' ? 'start' : 'middle');
    const [lx, ly] = labelAt(L.side, r, lines.length, L.dx || 0);
    return `<a class="tm-bub" href="#town-${m.id}" data-town="${m.id}" data-x="${x}" data-y="${y}" data-side="${L.side}" data-lines="${lines.length}" data-dx="${L.dx || 0}" aria-label="${m.name}: ${n}">` +
      `<circle class="tm-bub-c" cx="${x}" cy="${y}" r="${r.toFixed(1)}"/><text class="tm-bub-n" x="${x}" y="${y + 7.5}" text-anchor="middle">${n}</text>` +
      `<text class="tm-bub-l" transform="translate(${(x + lx).toFixed(1)} ${(y + ly).toFixed(1)})" text-anchor="${anchor}">${lines.map((l, i) => `<tspan x="0" dy="${i ? 24 : 0}">${l}</tspan>`).join('')}</text></a>`;
  }).join('');
  const region = presence.algarve || 0, rw = lang === 'pt' ? 236 : 276;
  return `<svg class="tm-map-svg" viewBox="0 0 1000 ${MAP_H}" role="group" aria-labelledby="tm-map-t" aria-describedby="tm-map-d">
<title id="tm-map-t">${w.mapTitle}</title><desc id="tm-map-d">${w.mapDesc}</desc>
<defs><pattern id="tm-waves" width="44" height="18" patternUnits="userSpaceOnUse"><path d="M0 9c5.5-5 11-5 16.5 0s11 5 16.5 0 11-5 11 0" fill="none" class="tm-wave"/></pattern></defs>
<rect class="tm-sea" width="1000" height="${MAP_H}"/><rect width="1000" height="${MAP_H}" fill="url(#tm-waves)"/>
<path class="tm-es" d="${path(o.Spain)}"/><path class="tm-pt" d="${path(o.Portugal)}"/>
<text class="tm-geo" x="215" y="${MAP_H - 20}">${lang === 'pt' ? 'Oceano Atlântico' : 'Atlantic Ocean'}</text>
<text class="tm-geo" x="985" y="150" text-anchor="end">${lang === 'pt' ? 'Espanha' : 'Spain'}</text>
<a class="tm-bub tm-bub-region" href="#town-algarve" data-town="algarve" aria-label="${w.region}: ${region}"><rect x="14" y="14" width="${rw}" height="50" rx="25"/><text class="tm-bub-rt" x="36" y="47">${w.region}</text><text class="tm-bub-rn" x="${14 + rw - 22}" y="47" text-anchor="end">${region}</text></a>
${bubbles}
</svg>`;
}

export function render(ctx) {
  const { lang, data, h, chrome, other, home } = ctx;
  const { esc, t, cite, date } = h; const w = W[lang]; const v = data.voice;
  const orgDoc = read('organisations.json'), people = read('people.json').people, needs = read('needs.json').needs;
  const orgs = orgDoc.organisations;
  const munis = data.places.municipalities;
  const townName = id => id === 'algarve' ? w.region : (munis.find(m => m.id === id)?.name || id);
  const presence = {}; for (const o of orgs) for (const tw of o.towns) presence[tw] = (presence[tw] || 0) + 1;
  const kindCount = {}; for (const o of orgs) kindCount[o.kind] = (kindCount[o.kind] || 0) + 1;
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const kindLabel = k => KIND[k][lang];
  const orderTowns = ['algarve', ...munis.map(m => m.id).sort((a, b) => fold(townName(a)).localeCompare(fold(townName(b))))];
  const euro = n => lang === 'pt' ? `${n.toFixed(2).replace('.', ',')} €` : `€${n.toFixed(2)}`;

  const orgCard = o => {
    const text = lang === 'pt' && o.pt ? o.pt : o.what;
    const search = fold([o.name, o.what, o.pt, o.ai, kindLabel(o.kind), o.towns.map(townName).join(' ')].join(' '));
    return `<li class="tm-card tm-org" id="org-${esc(o.id)}" data-id="${esc(o.id)}" data-kind="${o.kind}" data-towns="${o.towns.join(' ')}" data-s="${esc(search)}">
<div class="tm-card-top"><span class="tm-kind k-${o.kind}">${esc(kindLabel(o.kind))}</span>${o.us ? `<span class="tm-flag tm-us">${w.us}</span>` : o.partner ? `<span class="tm-flag">${w.partner}</span>` : ''}</div>
<h4><a class="tm-open" href="#org-${esc(o.id)}" data-open="org:${esc(o.id)}">${esc(o.name)}</a></h4>
<p class="tm-place">${esc(o.towns.map(townName).join(' · '))}${o.amount ? ` · <strong>${esc(o.amount)}</strong>` : ''}</p>
<p class="tm-what"${lang === 'pt' && o.pt ? '' : ' lang="en"'}>${esc(text)}</p>
<p class="tm-src">${w.source}: <a href="${esc(o.source_url)}" rel="noopener">${esc(host(o.source_url))}</a>, ${w.read} ${esc(date(o.read_on))}</p>
</li>`;
  };
  const groups = orderTowns.map(tw => {
    const own = orgs.filter(o => o.town === tw); const also = orgs.filter(o => o.town !== tw && o.towns.includes(tw));
    if (!own.length && !also.length) return '';
    return `<section class="tm-group" id="town-${tw}" data-town="${tw}" aria-labelledby="tg-${tw}">
<h3 id="tg-${tw}"><span>${esc(townName(tw))}</span> <span class="tm-group-n">${(presence[tw] || 0)}</span></h3>
<ul class="tm-cards">${own.map(orgCard).join('\n')}</ul>
${also.length ? `<p class="tm-also"><span>${w.alsoHere}:</span> ${also.map(o => `<a href="#org-${esc(o.id)}" class="tm-also-a" data-id="${esc(o.id)}" data-open="org:${esc(o.id)}" data-kind="${o.kind}" data-s="${esc(fold([o.name, o.what, o.pt, kindLabel(o.kind)].join(' ')))}">${esc(o.name)}</a>`).join('')}</p>` : ''}
</section>`;
  }).join('\n');

  const initials = n => n.split(/\s+/).map(x => x[0]).slice(0, 2).join('');
  const personCard = p => `<li class="tm-card tm-person${p.approved ? '' : ' tm-wait'}" id="person-${p.id}" data-id="${p.id}" data-town="${p.town}" data-roles="${p.roles.join(' ')}" data-s="${esc(fold([p.name, t(p.sector), t(p.offer), p.offer.en, p.tags, townName(p.town), p.roles.map(r => ROLE[r][lang]).join(' ')].join(' ')))}"${p.approved ? '' : ' hidden'}>
<div class="tm-card-top"><span class="tm-sim">${w.simBadge}</span>${p.roles.map(r => `<span class="tm-role r-${r}">${ROLE[r][lang]}</span>`).join('')}</div>
<div class="tm-person-h"><span class="tm-avatar" aria-hidden="true">${esc(initials(p.name))}</span><div><h4><a class="tm-open" href="#person-${p.id}" data-open="person:${p.id}">${esc(p.name)}</a></h4>
<p class="tm-place">${esc(townName(p.town))} · ${esc(t(p.sector))} · ${esc(t(p.rate))}</p></div></div>
<p class="tm-what">${esc(t(p.offer))}</p>
<p class="tm-src">${p.approved ? w.approved : w.awaiting} · ${esc(p.langs)}</p>
</li>`;

  const needCard = n => `<li class="tm-need" data-id="${n.id}" data-town="${n.town}"><div class="tm-card-top"><span class="tm-sim">${w.simBadge}</span><span class="tm-role r-${n.role}">${ROLE[n.role][lang]}</span></div>
<h4>${esc(t(n.what))}</h4><p class="tm-place">${esc(t(n.who))}</p><p><strong>${w.offer}:</strong> ${esc(t(n.pay))}</p><p class="tm-tags">${esc(t(n.tags))}</p>
<button type="button" class="tm-btn tm-btn-ghost" data-match-need="${n.id}" hidden>${w.findMatches}</button></li>`;

  const kinds = Object.keys(KIND);
  const approved = people.filter(p => p.approved).length;
  const i18n = { lang, w: { ...w, countOrg: undefined, countPeople: undefined }, kinds: Object.fromEntries(kinds.map(k => [k, { label: KIND[k][lang] }])),
    roles: Object.fromEntries(Object.entries(ROLE).map(([k, r]) => [k, r[lang]])), towns: Object.fromEntries(orderTowns.map(id => [id, townName(id)])) };
  const mark = `<svg class="tm-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="13" r="7" fill="#f2a65a"/><path d="M2 21c4-2 8 2 14 0s10-2 14 0v9H2z" fill="#1f7a8c"/><path d="M2 25c4-2 8 2 14 0s10-2 14 0" stroke="#bfe3e8" stroke-width="1.5" fill="none"/></svg>`;

  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(w.title)}</title>
<meta name="description" content="${esc(w.desc)}">
<meta name="theme-color" content="#0b3954">
${chrome.head}
<link rel="stylesheet" href="/talent-map/style.css">
<link rel="alternate" hreflang="${lang === 'en' ? 'pt' : 'en'}" href="${other}">
<script>document.documentElement.className='js'</script>
</head>
<body class="tm">
${chrome.banner}
<a class="tm-skip" href="#main">${w.skip}</a>
<header class="tm-top">
 <div class="tm-wrap tm-top-in">
  <a class="tm-brand" href="${home}" aria-label="${esc(w.home)}">${mark}<span>Algarve Evolution</span></a>
  <span class="tm-crumb" aria-hidden="true">/</span><span class="tm-crumb-t">${w.crumb}</span>
  <nav class="tm-nav" aria-label="${w.crumb}">${w.nav.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</nav>
  <div class="tm-meter" id="tm-meter" hidden aria-live="polite"></div>
 </div>
</header>

<main id="main">
<section class="tm-hero" id="ask" aria-labelledby="tm-h1">
 <div class="tm-wrap tm-hero-in">
  <div class="tm-hero-copy">
   <p class="tm-eyebrow"><span class="tm-pill tm-pill-proto">${w.proto}</span><span class="tm-pill tm-pill-line">${w.notAgreed}</span></p>
   <h1 id="tm-h1">${w.h1}</h1>
   <p class="tm-h1sub">${w.h1sub}</p>
   <p class="tm-lede">${w.lede}</p>
   <p class="tm-lede tm-lede2">${w.lede2}</p>
   ${cite(PROPOSAL, 'src tm-hero-src')}
   <ul class="tm-legend"><li><span class="tm-dot tm-dot-real"></span><strong>${w.realTag}</strong> ${w.realTxt}</li><li><span class="tm-dot tm-dot-sim"></span><strong>${w.simTag}</strong> ${w.simTxt}</li></ul>
  </div>
  <form class="tm-ask" id="tm-ask" role="search" action="#ask">
   <label for="tm-q" class="tm-ask-l">${w.askLabel}</label>
   <div class="tm-ask-row"><input id="tm-q" name="q" type="search" autocomplete="off" placeholder="${esc(w.askPh)}" enterkeyhint="search"><button class="tm-btn tm-btn-main" type="submit">${w.askBtn}</button></div>
   <p class="tm-ask-hint">${w.askHint}</p>
   <p class="tm-try"><span>${w.tryLabel}:</span> ${w.examples.map(x => `<button type="button" class="tm-chip" data-ask="${esc(x)}">${esc(x)}</button>`).join('')}</p>
   <noscript><p class="tm-ask-hint"><strong>${w.noscriptAsk}</strong></p></noscript>
  </form>
 </div>
 <div class="tm-wrap"><ul class="tm-stats">
  <li><strong>${orgs.length}</strong><span>${w.stats[0][0]}</span></li>
  <li><strong>16</strong><span>${w.stats[1][0]}</span></li>
  <li><strong>${people.length}</strong><span>${w.stats[2][0]}</span></li>
  <li><strong>${needs.length}</strong><span>${w.stats[3][0]}</span></li>
 </ul><p class="tm-stats-src">${w.statsSrc}</p></div>
</section>

<section class="tm-results tm-wrap" id="tm-results" aria-live="polite" hidden></section>

<section class="tm-third tm-wrap" aria-label="${esc(w.thirdTitle)}">
 <div class="tm-third-in"><p class="tm-third-t">${w.thirdTitle}</p><p>${w.thirdTxt} <button type="button" class="tm-chip tm-chip-dark" data-ask="${esc(w.thirdTry)}">${esc(w.thirdTry)}</button></p>${cite(MATCH_PROPOSAL, 'src')}</div>
</section>

<section class="tm-explore" id="explore" aria-labelledby="tm-explore-h">
 <div class="tm-wrap">
  <div class="tm-sec-head">
   <div><h2 id="tm-explore-h">${w.exploreH}</h2><p>${w.exploreIntro}</p></div>
   <div class="tm-layer" role="tablist" aria-label="${w.exploreH}" hidden>
    <button type="button" role="tab" id="tm-tab-org" aria-selected="true" aria-controls="tm-list-org" data-layer="org">${w.layerOrg} <b>${orgs.length}</b></button>
    <button type="button" role="tab" id="tm-tab-people" aria-selected="false" aria-controls="tm-list-people" data-layer="people">${w.layerPeople} <b>${approved}</b> <i>${w.layerPeopleSim}</i></button>
   </div>
  </div>
  <div class="tm-explore-grid">
   <figure class="tm-map" id="tm-map">${mapSvg({ data, w, lang, presence })}
    <nav class="tm-towns" aria-label="${w.where}">${orderTowns.map(id => `<a href="#town-${id}" data-town="${id}" class="tm-town">${esc(townName(id))} <b>${presence[id] || 0}</b></a>`).join('')}</nav>
    <figcaption>${w.mapNote}</figcaption></figure>
   <div class="tm-filters" id="tm-filters">
    <div class="tm-f-search"><label for="tm-fq">${w.search}</label><input id="tm-fq" type="search" placeholder="${esc(w.searchPh)}" autocomplete="off"></div>
    <fieldset class="tm-f-kinds" id="tm-f-kinds"><legend>${w.kindLegend}</legend>
     ${kinds.map(k => `<label class="tm-kopt" data-kind="${k}"><input type="checkbox" value="${k}"><span class="tm-kdot k-${k}"></span><span class="tm-kname">${KIND[k][lang]}<small>${KIND[k][lang === 'pt' ? 'dpt' : 'den']}</small></span><span class="tm-kbar"><i style="width:${Math.round(100 * kindCount[k] / Math.max(...Object.values(kindCount)))}%"></i></span><b>${kindCount[k]}</b></label>`).join('')}
    </fieldset>
    <fieldset class="tm-f-roles" id="tm-f-roles" hidden><legend>${w.kindLegend}</legend>
     ${Object.keys(ROLE).map(r => `<label class="tm-kopt" data-role="${r}"><input type="checkbox" value="${r}"><span class="tm-kdot r-${r}"></span><span class="tm-kname">${ROLE[r][lang]}</span><b></b></label>`).join('')}
    </fieldset>
    <div class="tm-f-where"><label for="tm-ftown">${w.where}</label><select id="tm-ftown"><option value="">${w.allTowns}</option>${orderTowns.map(id => `<option value="${id}">${esc(townName(id))}</option>`).join('')}</select></div>
    <button type="button" class="tm-btn tm-btn-ghost tm-clear" id="tm-clear" hidden>${w.clear}</button>
   </div>
  </div>
  <p class="tm-count" id="tm-count" aria-live="polite"></p>
  <div class="tm-list" id="tm-list-org" role="tabpanel" aria-labelledby="tm-tab-org">
${groups}
  </div>
  <div class="tm-list tm-list-people" id="tm-list-people" role="tabpanel" aria-labelledby="tm-tab-people">
   <h3 class="tm-people-h">${w.layerPeople} <span class="tm-sim">${w.simBadge}</span></h3>
   <div class="tm-consent-banner" role="note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3Z"/></svg><p><strong>${w.consentBanner}</strong> ${w.consentBanner2} <a href="#consent">${w.consentLink}</a></p></div>
   <ul class="tm-cards">${people.map(personCard).join('\n')}</ul>
  </div>
 </div>
</section>

<section class="tm-needs" id="needs" aria-labelledby="tm-needs-h">
 <div class="tm-wrap">
  <div class="tm-sec-head"><div><h2 id="tm-needs-h">${w.needsH}</h2><p>${w.needsIntro}</p></div></div>
  <div class="tm-needs-grid">
   <ul class="tm-needs-list" id="tm-needs-list">${needs.map(needCard).join('\n')}</ul>
   <form class="tm-post" id="tm-post" hidden>
    <h3>${w.postH}</h3><p class="tm-post-note">${w.postNote}</p>
    <label>${w.fWho}<input name="who" required maxlength="80" placeholder="${esc(w.fWhoPh)}"></label>
    <label>${w.fWhat}<textarea name="what" required maxlength="240" rows="3" placeholder="${esc(w.fWhatPh)}"></textarea></label>
    <div class="tm-post-2"><label>${w.fTown}<select name="town">${munis.map(m => m.id).sort().map(id => `<option value="${id}"${id === 'faro' ? ' selected' : ''}>${esc(townName(id))}</option>`).join('')}</select></label>
    <label>${w.fRole}<select name="role">${w.fRoles.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label></div>
    <label>${w.fPay}<input name="pay" required maxlength="80" placeholder="${esc(w.fPayPh)}"></label>
    <button class="tm-btn tm-btn-main" type="submit">${w.fSubmit}</button>
    <p class="tm-post-done" id="tm-post-done" aria-live="polite"></p>
   </form>
  </div>
 </div>
</section>

<section class="tm-consent" id="consent" aria-labelledby="tm-consent-h">
 <div class="tm-wrap tm-consent-grid">
  <div class="tm-consent-copy">
   <h2 id="tm-consent-h">${w.consentH}</h2>
   <p>${w.consentTxt}</p>
   ${cite(PROPOSAL)}
   <ol class="tm-steps"><li>${lang === 'pt' ? 'Construir o site com pessoas simuladas, como este.' : 'Build the site with simulated people, like this one.'}</li><li>${lang === 'pt' ? 'Enviar a cada pessoa a pré-visualização da sua entrada.' : 'Send each person a preview of their own listing.'}</li><li>${lang === 'pt' ? 'Publicar só quem aprovar, com a data do sim.' : 'Publish only those who approve, with the date of their yes.'}</li><li>${lang === 'pt' ? 'Deixar pesquisar, publicar necessidades e pagar por contacto.' : 'Let visitors search, post needs and pay per contact.'}</li></ol>
  </div>
  <div class="tm-mail" id="tm-mail">
   <div class="tm-mail-bar"><span></span><span></span><span></span><label class="tm-mail-pick" hidden>${w.previewFor} <select id="tm-mail-who">${people.map(p => `<option value="${p.id}"${p.id === people.find(x => !x.approved)?.id ? ' selected' : ''}>${esc(p.name)}${p.approved ? '' : ` (${lang === 'pt' ? 'sem resposta' : 'no answer yet'})`}</option>`).join('')}</select></label></div>
   <div class="tm-mail-body" id="tm-mail-body">
    ${(() => { const p = people.find(x => !x.approved); return `<dl class="tm-mail-h"><dt>${w.mailFrom}</dt><dd>${w.mailFromV}</dd><dt>${w.mailTo}</dt><dd>${esc(p.name)} <span class="tm-sim">${w.simBadge}</span></dd><dt>${w.mailSubject}</dt><dd><strong>${w.mailSubjectV}</strong></dd></dl>
    <p>${w.mailHello} ${esc(p.name.split(' ')[0])},</p><p>${w.mailBody}</p>
    <div class="tm-card tm-person tm-preview"><div class="tm-card-top">${p.roles.map(r => `<span class="tm-role r-${r}">${ROLE[r][lang]}</span>`).join('')}</div><div class="tm-person-h"><span class="tm-avatar" aria-hidden="true">${esc(initials(p.name))}</span><div><h4>${esc(p.name)}</h4><p class="tm-place">${esc(townName(p.town))} · ${esc(t(p.sector))} · ${esc(t(p.rate))}</p></div></div><p class="tm-what">${esc(t(p.offer))}</p></div>
    <div class="tm-mail-actions"><button type="button" class="tm-btn tm-btn-main" disabled>${w.approve}</button><button type="button" class="tm-btn tm-btn-ghost" disabled>${w.change}</button><button type="button" class="tm-btn tm-btn-ghost" disabled>${w.noList}</button></div>`; })()}
   </div>
  </div>
 </div>
</section>

<section class="tm-how" id="how" aria-labelledby="tm-how-h">
 <div class="tm-wrap">
  <h2 id="tm-how-h">${w.howH}</h2>
  <ol class="tm-how-grid">${w.how.map(([a, b], i) => `<li><span class="tm-how-n">${i + 1}</span><h3>${a}</h3><p>${b}</p></li>`).join('')}</ol>
  <div class="tm-pay"><div><h3>${w.payH}</h3><p>${w.payTxt}</p>${cite(PROPOSAL)}</div><div class="tm-pay-demo" aria-hidden="true"><span>${lang === 'pt' ? 'Crédito' : 'Credit'}</span><strong>${euro(4.5)}</strong><span>${lang === 'pt' ? '1 contacto' : '1 contact'} · ${euro(0.5)}</span></div></div>
 </div>
</section>
</main>

<footer class="tm-foot">
 <div class="tm-wrap tm-foot-grid">
  <div><h2>${w.footData}</h2><p>${w.footDataTxt} ${esc(date(orgDoc.compiled))}, <a href="${REPO}" rel="noopener">PrompTugal__News__Website</a> (data/by-place, ${lang === 'pt' ? 'código' : 'code'} Apache-2.0, ${lang === 'pt' ? 'texto' : 'text'} CC BY 4.0), ${lang === 'pt' ? 'e os parceiros dos dados do nosso ecossistema' : 'and the partners in our ecosystem data'}. ${w.footDataTxt2}</p>
   <p><a href="/talent-map/data/organisations.json">${w.files}</a> · <a href="/talent-map/data/README.md">${w.readme}</a></p></div>
  <div><h2>${w.footSources}</h2>${cite([PROPOSAL, MATCH_PROPOSAL, 'https://promptugal.news/organisations/algarve-evolution/index.html'], 'src')}<p>${w.footLic}</p></div>
  <div><h2>Algarve Evolution</h2><p><a href="${home}">${w.back}</a></p><p>${esc(t(v.banner))}</p><p class="tm-foot-small">${esc(t(v.footer_disclosure))}</p><p class="tm-foot-small">${w.version} ${esc(chrome.version)}</p></div>
 </div>
</footer>

<dialog class="tm-dialog" id="tm-dialog" aria-labelledby="tm-d-title"><div class="tm-d-in" id="tm-d-in"></div></dialog>
<script type="application/json" id="tm-i18n">${JSON.stringify(i18n).replace(/</g, '\\u003c')}</script>
<script src="/talent-map/app.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
