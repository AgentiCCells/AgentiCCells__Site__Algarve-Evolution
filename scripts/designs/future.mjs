// "The Future": a cinematic, scroll-driven design with AI-made imagery and data-drawn infographics.
// Every fact comes from src/data with its source; every AI image is captioned as an illustration.
// Images: src/d/future/img/README.md (model, prompt, date, cost). Fonts: src/d/future/fonts/README.md.
// Code Apache-2.0; text and images CC BY 4.0. Made by sites-design@AgentiCCells.dinis, 16 November 2026.

export const meta = {
  slug: 'future', order: 7, group: 'bold',
  name: { en: 'The Future', pt: 'O Futuro' },
  tagline: { en: 'Cinematic, AI-made imagery and infographics', pt: 'Imagens e infografias cinematográficas feitas com IA' },
};

// Portuguese for the ecosystem timeline (the data file holds English only). Translations, no new facts.
export const timelinePt = {
  '2018': { when: '2018', title: 'A comunidade começa', text: 'Um pequeno grupo de empresários locais começa a construir a comunidade de inovação da região (relato da própria organização, noticiado em 2026).' },
  '12 Sep 2019': { when: '12 set 2019', title: 'Apresentação oficial, Faro', text: 'No Centro Ciência Viva do Algarve: uma associação sem fins lucrativos de cerca de 29 empresas de TIC, à procura de massa crítica e de uma só voz em eventos como a Web Summit.', stat: '29 empresas associadas' },
  '28 Mar to 3 Apr 2022': { when: '28 mar a 3 abr 2022', title: 'Primeira Algarve Tech Hub Summit', text: 'Híbrida, em Faro e Loulé; a Algarve Evolution foi uma de cerca de doze entidades promotoras, com o Algarve STP e a Universidade do Algarve.' },
  '1 Jun 2024': { when: '1 jun 2024', title: 'Impact Algarve', text: 'Organizada pela Get Real e pela Algarve Evolution no TEC Campus da Universidade do Algarve, em Faro (o ano é inferido da página).' },
  '11 Jul 2024': { when: '11 jul 2024', title: 'Eleição de um novo presidente', text: 'A associação elege um presidente para 2024 a 2027, depois do presidente cessante.', stat: 'cerca de 70 empresas e particulares' },
  '23 to 25 Oct 2024': { when: '23 a 25 out 2024', title: 'Summit, Albufeira', text: 'Algarve Tech Hub Summit no Hotel Alisios, em Albufeira.' },
  'Sep 2025': { when: 'set 2025', title: 'Lançamento da Algarve Digital Innovators', text: 'Lançada em Lagos, com um roadshow de setembro a novembro de 2025.' },
  '6 to 7 Nov 2025': { when: '6 a 7 nov 2025', title: 'Summit, Lagos', text: 'Algarve Tech Hub Summit, com mais de 500 participantes noticiados (só foi lido o título).' },
  '10 to 13 Nov 2025': { when: '10 a 13 nov 2025', title: '24 startups algarvias na Web Summit', text: 'A Algarve Evolution é parceira nomeada do projeto que as leva à Web Summit Lisboa.' },
  'Late 2025': { when: 'final de 2025', title: 'Wrap Party, Faro', text: 'Revê a série de novembro no Algarve, do Buildathon à Web Summit.' },
  'Jan 2026': { when: 'jan 2026', title: 'Incubadora reconhecida', text: 'Reconhecida pela Startup Portugal.' },
  'Jul 2026': { when: 'jul 2026', title: 'O Venture Lab e o plano 2030', text: 'O Venture Lab by AlgarveSTP seleciona 12 empresas (10 jul); o plano 2030 da ADI identifica 24 comunidades.' },
  'Oct 2026': { when: 'out 2026', title: 'Lançamento do Founder2Founder', text: '8 empresas escolhidas entre 41 candidaturas.' },
  '5 to 7 Nov 2026': { when: '5 a 7 nov 2026', title: 'Uma semana cheia no Algarve', text: "O TMCT'26 em Portimão (5 a 7), o encontro Private Wealth em Almancil (6) e o DevFest Lagos (7): os dois primeiros estão na agenda da Algarve Evolution, no terceiro é parceira.", stat: '118 membros ativos' },
  '2027': { when: '2027', title: 'A Tech Hub Summit regressa', text: 'Regresso confirmado; datas e local por anunciar.' },
};
// The 2026 entry's own title ("This week in the Algarve") was written in its week; we date it instead.
export const timelineEnTitle = { '5 to 7 Nov 2026': 'A busy week in the Algarve' };

// Portuguese labels for the ecosystem graph.
export const nodePt = { education: 'Educação', incubator: 'Incubadora', munis: '16 municípios', ualg: 'Universidade do Algarve', ws25: 'Web Summit Lisboa 2025', inova: 'INOVA Algarve 3.0' };
export const nodeEn = { ualg: 'University of the Algarve', inova: 'INOVA Algarve 3.0' };
export const relPt = { runs: 'gere', leads: 'lidera', 'co-organises': 'coorganiza', 'one of six partners': 'um de seis parceiros', organises: 'organiza', 'created with': 'criada com', across: 'em', with: 'com', by: 'de', partner: 'parceiro', 'recognised by': 'reconhecida por', 'project partner': 'parceira do projeto', 'lead promoter': 'promotora principal', 'ran the competition': 'organizou o concurso' };

export function render({ lang, data, h, chrome, other }) {
  const { esc, t, cite, num } = h;
  const L = (en, pt) => (lang === 'pt' ? pt : en);
  const v = data.voice, eco = data.ecosystem;
  const fig = id => data.figures.figures.find(f => f.id === id);
  const quote = data.people.quotes[0];
  const person = data.people.people.find(p => p.id === quote.by);
  const prog = data.programmes.pillars;
  const tl = eco.timeline;
  const AI = L('AI-generated illustration', 'Ilustração gerada por IA');
  const words = s => esc(s).split(' ').map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');
  const img = (name, alt, cls = '', eager = false) =>
    `<img class="${cls}" src="/d/future/img/${name}.webp" width="1376" height="768" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
  const cap = text => `<p class="cap"><span class="cap-tag">${AI}</span> ${esc(text)}</p>`;

  // ---------- Growth chart (members over time) ----------
  const G = { w: 900, h: 420, l: 56, r: 30, t: 40, b: 56, x0: 2018, x1: 2027.2, y1: 130 };
  const gx = x => G.l + (x - G.x0) / (G.x1 - G.x0) * (G.w - G.l - G.r);
  const gy = y => G.h - G.b - y / G.y1 * (G.h - G.t - G.b);
  const pts = [
    { t: 2019.7, y: 29, label: L('about 29', 'cerca de 29'), what: L('ICT companies, presented in Faro, Sep 2019', 'empresas de TIC, apresentação em Faro, set 2019'), src: 'pres19' },
    { t: 2024.53, y: 70, label: L('about 70', 'cerca de 70'), what: L('companies and individuals, Jul 2024', 'empresas e particulares, jul 2024'), src: 'pres24' },
    { t: 2026.83, y: 106, label: '106', what: L('active members on its own site, 31 Oct 2026', 'membros ativos no próprio site, 31 out 2026'), src: fig('members').sources[0] },
    { t: 2026.84, y: 118, label: '118', what: L('active members as reported, 1 Nov 2026', 'membros ativos segundo notícia, 1 nov 2026'), src: 'psn' },
  ];
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${gx(p.t).toFixed(1)},${gy(p.y).toFixed(1)}`).join(' ');
  const area = `${line} L${gx(pts.at(-1).t).toFixed(1)},${gy(0)} L${gx(pts[0].t).toFixed(1)},${gy(0)} Z`;
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];
  const growthSvg = `<svg class="growth" viewBox="0 0 ${G.w} ${G.h}" role="img" aria-labelledby="growth-t growth-d">
  <title id="growth-t">${L('Members over time', 'Membros ao longo do tempo')}</title>
  <desc id="growth-d">${esc(pts.map(p => `${p.label}: ${p.what}`).join('; '))}</desc>
  <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#52e5d6" stop-opacity=".45"/><stop offset="1" stop-color="#52e5d6" stop-opacity="0"/></linearGradient>
  <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb547"/><stop offset=".6" stop-color="#ff6f4f"/><stop offset="1" stop-color="#52e5d6"/></linearGradient></defs>
  ${[0, 30, 60, 90, 120].map(y => `<line class="grid" x1="${G.l}" x2="${G.w - G.r}" y1="${gy(y)}" y2="${gy(y)}"/><text class="ax" x="${G.l - 12}" y="${gy(y) + 5}" text-anchor="end">${y}</text>`).join('')}
  ${years.map(y => `<text class="ax" x="${gx(y)}" y="${G.h - G.b + 30}" text-anchor="middle">${y}</text><line class="tick" x1="${gx(y)}" x2="${gx(y)}" y1="${gy(0)}" y2="${gy(0) + 6}"/>`).join('')}
  <circle class="seed" cx="${gx(2018)}" cy="${gy(0)}" r="7"/><text class="ann" x="${gx(2018) + 12}" y="${gy(0) - 14}">${L('2018: the community begins', '2018: a comunidade começa')}</text>
  <path class="area" d="${area}" fill="url(#gArea)"/>
  <path class="ln" d="${line}" pathLength="1" stroke="url(#gLine)"/>
  ${pts.map((p, i) => `<g class="pt" style="--d:${i}"><circle cx="${gx(p.t)}" cy="${gy(p.y)}" r="${i > 1 ? 8 : 9}"/><text class="pv" x="${gx(p.t) + (i === 2 ? -20 : i === 3 ? -20 : 0)}" y="${gy(p.y) + (i === 2 ? 12 : -20)}" text-anchor="${i > 1 ? 'end' : 'middle'}">${esc(p.label)}</text></g>`).join('')}
</svg>`;

  // ---------- Pillars radial infographic ----------
  const pillarColour = ['#ffb547', '#ff6f4f', '#52e5d6'];
  const pillarShort = [L('Education', 'Educação'), L('Startups and SMEs', 'Startups e PME'), L('The ecosystem', 'O ecossistema')];
  const rad = d => d * Math.PI / 180;
  const P = (r, a) => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
  const arc = (r0, r1, a0, a1) => {
    const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1), [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0);
    const lg = a1 - a0 > 180 ? 1 : 0;
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r1},${r1} 0 ${lg} 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${r0},${r0} 0 ${lg} 0 ${x3.toFixed(1)},${y3.toFixed(1)} Z`;
  };
  let n = 0;
  const radial = prog.map((p, i) => {
    const a0 = -150 + i * 120 + 3, a1 = a0 + 114, mid = (a0 + a1) / 2;
        const nodes = p.programmes.map((g, j) => {
      n += 1; const k = p.programmes.length;
      const a = a0 + 10 + (a1 - a0 - 20) * (k === 1 ? 0.5 : j / (k - 1));
      const [x, y] = P(250, a), [sx, sy] = P(172, a);
      return `<g class="pn" data-n="${n}"><line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${pillarColour[i]}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="25" stroke="${pillarColour[i]}"/><text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle">${String(n).padStart(2, '0')}</text></g>`;
    }).join('');
    // The pillar's name runs along its arc; on the lower half the path runs backwards so the text reads upright.
    const low = mid > 0 && mid < 180, r = 133;
    const [ax0, ay0] = P(r, low ? a1 - 4 : a0 + 4), [ax1, ay1] = P(r, low ? a0 + 4 : a1 - 4);
    const tp = `M${ax0.toFixed(1)},${ay0.toFixed(1)} A${r},${r} 0 0 ${low ? 0 : 1} ${ax1.toFixed(1)},${ay1.toFixed(1)}`;
    return `<path class="pa" d="${arc(98, 168, a0, a1)}" fill="${pillarColour[i]}"/><path id="pp-${i}" d="${tp}" fill="none"/><text class="pl"><textPath href="#pp-${i}" startOffset="50%" text-anchor="middle" dominant-baseline="central">${esc(pillarShort[i])}</textPath></text>${nodes}`;
  }).join('');
  const radialSvg = `<svg class="radial" viewBox="-300 -300 600 600" role="img" aria-label="${esc(L('Our three pillars and ten programmes, numbered as in the list', 'Os nossos três pilares e dez programas, numerados como na lista'))}">
  <circle class="orb" r="290"/><circle class="orb" r="250" stroke-dasharray="2 8"/>
  ${radial}
  <circle class="core" r="84"/><text class="ct" y="-6" text-anchor="middle">Algarve</text><text class="ct" y="20" text-anchor="middle">Evolution</text>
</svg>`;
  n = 0;
  const progList = prog.map((p, i) => `<div class="pg" style="--c:${pillarColour[i]}"><h3><span class="dot"></span>${esc(t(p.name))}</h3><ol>${p.programmes.map(g => { n += 1; return `<li data-n="${n}"><span class="no">${String(n).padStart(2, '0')}</span><div><h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${cite(g.sources)}</div></li>`; }).join('')}</ol></div>`).join('');

  // ---------- Ecosystem network ----------
  const keep = { centre: ['ae'], inner: ['education', 'aths', 'adi', 'venture', 'ws25', 'incubator', 'f2f', 'inova', 'grow'], outer: ['ja', 'ualg', 'stp', 'munis', 'amal', 'nera', 'anje', 'startupPt'] };
  const angle = { education: -162, aths: -126, adi: -90, venture: -54, ws25: -18, incubator: 36, f2f: 82, inova: 126, grow: 168, ja: -178, ualg: -146, stp: -116, munis: -90, amal: -64, nera: -38, anje: 2, startupPt: 42 };
  const node = id => eco.nodes.find(x => x.id === id);
  const label = id => (lang === 'pt' ? nodePt[id] : nodeEn[id]) || node(id).label;
  const pos = { ae: [0, 0] };
  for (const id of keep.inner) pos[id] = P(175, angle[id]);
  for (const id of keep.outer) pos[id] = P(300, angle[id]);
  const shown = new Set(Object.keys(pos));
  const links = eco.links.filter(([a, b]) => shown.has(a) && shown.has(b));
  const rel = r => (lang === 'pt' ? relPt[r] || r : r);
  const netSvg = `<svg class="net" viewBox="-560 -350 1120 680" role="img" aria-label="${esc(L('Our network: programmes on the inner ring, partners on the outer ring', 'A nossa rede: programas no anel interior, parceiros no anel exterior'))}">
  <circle class="orb" r="175"/><circle class="orb" r="300" stroke-dasharray="2 10"/>
  ${links.map(([a, b, r], i) => `<path class="lk${a === 'ae' ? ' lk0' : ''}" data-a="${a}" data-b="${b}" style="--i:${i}" d="M${pos[a][0].toFixed(1)},${pos[a][1].toFixed(1)} Q${((pos[a][0] + pos[b][0]) * 0.42).toFixed(1)},${((pos[a][1] + pos[b][1]) * 0.42).toFixed(1)} ${pos[b][0].toFixed(1)},${pos[b][1].toFixed(1)}"><title>${esc(label(a))}: ${esc(rel(r))} ${esc(label(b))}</title></path>`).join('')}
  ${Object.entries(pos).map(([id, [x, y]]) => {
    const k = node(id).kind; const right = x > 8, left = x < -8;
    const anchor = id === 'ae' ? 'middle' : right ? 'start' : left ? 'end' : 'middle';
    const dx = id === 'ae' ? 0 : right ? 18 : left ? -18 : 0, dy = id === 'ae' ? 0 : (!right && !left) ? (y < 0 ? -22 : 34) : 6;
    return `<g class="nd nd-${k}" data-id="${id}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${id === 'ae' ? 54 : k === 'programme' || k === 'summit' ? 11 : 9}"/>${id === 'ae' ? `<text class="ct" x="0" y="-4" text-anchor="middle">Algarve</text><text class="ct" x="0" y="20" text-anchor="middle">Evolution</text>` : `<text class="lbl" x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${esc(label(id))}</text>`}</g>`;
  }).join('')}
</svg>`;
  const partnerList = keep.outer.map(id => {
    const ls = links.filter(([a, b]) => b === id || a === id).map(([a, b, r]) => `${esc(label(a === id ? b : a))} <em>(${esc(rel(r))})</em>`);
    return `<li><strong>${esc(label(id))}</strong><span>${ls.join(', ')}</span></li>`;
  }).join('');
  const netSrc = [...new Set([...keep.centre, ...keep.inner, ...keep.outer].map(id => node(id).src))];

  // ---------- Map of the 16 municipalities ----------
  const M = { lon0: -9.02, lat0: 37.56, k: 600, c: Math.cos(rad(37.2)) };
  const mx = lon => (lon - M.lon0) * M.c * M.k, my = lat => (M.lat0 - lat) * M.k;
  const poly = rings => rings.map(r => r.map((ring) => ring.map(([lo, la], i) => `${i ? 'L' : 'M'}${mx(lo).toFixed(1)},${my(la).toFixed(1)}`).join(' ')).join(' ')).join(' ');
  const outline = data.places.outline.countries;
  const munis = data.places.municipalities;
  const lab = { faro: [0, 26, 'middle'], olhao: [10, 22, 'start'], 'sao-bras-de-alportel': [8, -12, 'start'], loule: [-10, -10, 'end'], tavira: [0, 26, 'middle'], 'vila-real-de-santo-antonio': [12, 16, 'start'], 'castro-marim': [12, -4, 'start'], alcoutim: [12, 5, 'start'], albufeira: [0, 26, 'middle'], lagoa: [4, 26, 'middle'], portimao: [-8, -14, 'end'], silves: [10, -10, 'start'], lagos: [0, 26, 'middle'], 'vila-do-bispo': [-6, 26, 'middle'], aljezur: [12, 5, 'start'], monchique: [12, 5, 'start'] };
  const mp = Object.fromEntries(munis.map(m => [m.id, [mx(m.ll[0]), my(m.ll[1])]]));
  const edges = new Set();
  for (const a of munis) {
    const near = munis.filter(b => b.id !== a.id).map(b => [b.id, Math.hypot(mp[a.id][0] - mp[b.id][0], mp[a.id][1] - mp[b.id][1])]).sort((p, q) => p[1] - q[1]).slice(0, 2);
    for (const [b] of near) edges.add([a.id, b].sort().join('|'));
  }
  const mapSvg = `<svg class="map" viewBox="0 0 880 380" role="img" aria-label="${esc(L('Map of the Algarve with its 16 municipalities', 'Mapa do Algarve com os seus 16 municípios'))}">
  <path class="land es" d="${poly(outline.Spain)}"/><path class="land pt" d="${poly(outline.Portugal)}"/>
  ${[...edges].map((e, i) => { const [a, b] = e.split('|'); return `<line class="me" style="--i:${i}" x1="${mp[a][0].toFixed(1)}" y1="${mp[a][1].toFixed(1)}" x2="${mp[b][0].toFixed(1)}" y2="${mp[b][1].toFixed(1)}"/>`; }).join('')}
  <circle class="hq-ring" cx="${mp.faro[0].toFixed(1)}" cy="${mp.faro[1].toFixed(1)}" r="14"/>
  ${munis.map((m, i) => { const [x, y] = mp[m.id]; const [dx, dy, an] = lab[m.id] || [0, 24, 'middle']; return `<g class="mu${m.id === 'faro' ? ' hq' : ''}" style="--i:${i}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m.id === 'faro' ? 7 : 5}"/><text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${an}">${m.id === 'vila-real-de-santo-antonio' ? `Vila Real de<tspan x="${(x + dx).toFixed(1)}" dy="17">Santo António</tspan>` : esc(m.name)}</text></g>`; }).join('')}
  <text class="sea" x="250" y="350">${L('Atlantic Ocean', 'Oceano Atlântico')}</text><text class="sea" x="860" y="120" text-anchor="end">${L('Spain', 'Espanha')}</text>
</svg>`;

  // ---------- Timeline ----------
  const tlCards = tl.map(e => {
    const p = lang === 'pt' ? timelinePt[e.when] || {} : {};
    const title = p.title || timelineEnTitle[e.when] || e.title;
    const stat = e.stat ? (p.stat || e.stat) : '';
    return `<li class="tc${e.future ? ' future' : ''}"><p class="tw">${esc(p.when || e.when)}</p><h3>${esc(title)}</h3><p>${esc(p.text || e.text)}</p>${stat ? `<p class="ts">${esc(stat)}</p>` : ''}${cite(e.src)}</li>`;
  }).join('') + `<li class="tc goal"><p class="tw">2032</p><h3>${esc(t(v.goals_title))}</h3><p class="tg">${v.goals.map(g => `<b>${esc(lang === 'pt' && g.value_pt ? g.value_pt : g.value)}</b> ${esc(t(g.label))}`).join('<br>')}</p><p class="ts">${esc(t(v.goals_note))}</p>${cite(v.goals_sources)}</li>`;

  // ---------- Big figures ----------
  const stat = (id, pre, value, count, unit, label) => `<div class="stat rv"><p class="sv">${pre ? `<span class="spre">${esc(pre)}</span>` : ''}<span class="cnt" data-to="${count}">${esc(value)}</span>${unit ? `<span class="su">${esc(unit)}</span>` : ''}</p><p class="sl">${esc(label)}</p>${fig(id).note ? `<p class="sn">${esc(t(fig(id).note))}</p>` : ''}${cite(fig(id).sources)}</div>`;
  const vib = data.events.events.find(e => e.id === 'vibathon-algarve-2026');
  const inova = prog[1].programmes.find(g => g.id === 'inova-algarve-3');
  const adi = prog[2].programmes.find(g => g.id === 'algarve-digital-innovators');
  const apps = v.apps.map(a => ({ ...a, prop: data.proposals.proposals.find(p => p.id === a.id) }));

  const chapters = [['mission', L('Beyond tourism', 'Além do turismo')], ['goals', '2032'], ['growth', L('Growth', 'Crescimento')], ['pillars', L('Pillars', 'Pilares')], ['network', L('Network', 'Rede')], ['map', L('16 municipalities', '16 municípios')], ['road', L('The road', 'O caminho')], ['join', L('Join us', 'Junte-se')], ['try', L('Try it', 'Experimente')]];
  const head = (no, id, kicker, title) => `<header class="ch-head"><p class="ch-no" aria-hidden="true">${no}</p><p class="kicker">${esc(kicker)}</p><h2 id="h-${id}" class="kin">${words(title)}</h2></header>`;

  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(L('Algarve Evolution: the future, in pictures and figures', 'Algarve Evolution: o futuro, em imagens e números'))}</title>
<meta name="description" content="${esc(t(v.tagline))}. ${esc(t(v.banner))}">
<meta name="theme-color" content="#05070d"><meta name="color-scheme" content="dark">
<script>document.documentElement.classList.add('js')</script>
${chrome.head}
<link rel="preload" href="/d/future/fonts/InterDisplay-Black.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/d/future/style.css">
<link rel="alternate" hreflang="${lang === 'en' ? 'pt' : 'en'}" href="${other}">
</head>
<body>
${chrome.banner}
<a class="skip" href="#main">${L('Skip to content', 'Saltar para o conteúdo')}</a>
<div class="progress" aria-hidden="true"></div>
<nav class="chap" aria-label="${L('Chapters', 'Capítulos')}"><ol>${chapters.map(([id, name], i) => `<li><a href="#${id}"><span>${String(i + 1).padStart(2, '0')}</span> ${esc(name)}</a></li>`).join('')}</ol></nav>
<main id="main">

<section class="hero" aria-labelledby="h-top">
  <div class="hero-media">${img('coast', L('Illustration: golden limestone cliffs and sea arches on the Algarve coast at dawn, with low timber-and-glass pavilions and solar canopies on the clifftop.', 'Ilustração: falésias douradas e arcos de rocha na costa algarvia ao amanhecer, com pavilhões baixos de madeira e vidro e coberturas solares no topo da falésia.'), 'hero-img', true)}</div>
  <div class="hero-in">
    <p class="eyebrow">Algarve Evolution · Faro · ${L('since 2018', 'desde 2018')}</p>
    <h1 id="h-top" class="kin hero-h">${words(t(v.tagline))}</h1>
    <p class="lede">${esc(t(v.hero_lede))}</p>
    ${cite([...fig('founded').sources, 'psn'])}
    <a class="cue" href="#mission">${L('Scroll into the future', 'Deslize para o futuro')} <span aria-hidden="true">↓</span></a>
  </div>
  ${cap(L('The Algarve coast at dawn, imagined. Not a photograph.', 'A costa algarvia ao amanhecer, imaginada. Não é uma fotografia.'))}
</section>

<section id="mission" class="ch mission" aria-labelledby="h-mission">
  ${head('01', 'mission', L('Our mandate', 'A nossa missão'), L('Beyond tourism', 'Além do turismo'))}
  <p class="reveal-text">${words(t(v.mission))}</p>
  ${cite('psn')}
</section>

<section id="goals" class="ch goals" aria-labelledby="h-goals">
  ${head('02', 'goals', L('Targets, not results', 'Metas, não resultados'), t(v.goals_title))}
  <figure class="goal-fig">
    <div class="goal-stage">
      ${img('goals', L('Illustration: three glowing towers of light on a dark glass floor, each taller than the last, one per goal.', 'Ilustração: três torres de luz num chão de vidro escuro, cada uma mais alta do que a anterior, uma por objetivo.'), 'goal-img')}
      <ol class="goal-nums">${v.goals.map((g, i) => `<li style="--c:${pillarColour[i]}"><span class="gv"><span class="cnt" data-to="${g.value.replace(/,/g, '')}">${esc(lang === 'pt' && g.value_pt ? g.value_pt : g.value)}</span></span><span class="gl">${esc(t(g.label))}</span></li>`).join('')}</ol>
    </div>
    <figcaption>${cap(L('The towers are artwork; the numbers are set in the page, from the source. They are targets for 2032, not results.', 'As torres são uma ilustração; os números estão escritos na página, a partir da fonte. São metas para 2032, não resultados.'))}${cite(v.goals_sources)}</figcaption>
  </figure>
</section>

<section class="quote" aria-label="${L('Quote', 'Citação')}">
  <figure>
    <p class="q-ctx">${L('On the 2032 goals', 'Sobre os objetivos para 2032')}</p>
    <blockquote${lang === 'pt' ? ' lang="pt"' : ''}><p>${words(t(quote.text))}</p></blockquote>
    <figcaption><strong>${esc(person.name)}</strong>, ${esc(t(person.role).toLowerCase())}, Algarve Evolution · <time datetime="${quote.date}">${esc(h.date(quote.date))}</time>${lang === 'pt' && quote.translation_note ? `<span class="tn">${esc(quote.translation_note.pt)}</span>` : ''}</figcaption>
    ${cite(quote.sources)}
  </figure>
</section>

<section id="growth" class="ch growth-ch" aria-labelledby="h-growth">
  ${head('03', 'growth', L('Members over time', 'Membros ao longo do tempo'), L('From 29 to 118', 'De 29 a 118'))}
  <p class="intro">${esc(t(v.story_intro))}</p>
  <figure class="chart rv">
    ${growthSvg}
    <figcaption>
      <ol class="pts">${pts.map(p => `<li><b>${esc(p.label)}</b> ${esc(p.what)}. ${cite(p.src)}</li>`).join('')}</ol>
      <p class="fine">${L('The counts come from different sources and do not measure the same thing: ICT companies in 2019, companies and individuals in 2024, active members (professionals and companies) in 2026. The line joins them; there is no data in between.', 'As contagens vêm de fontes diferentes e não medem o mesmo: empresas de TIC em 2019, empresas e particulares em 2024, membros ativos (profissionais e empresas) em 2026. A linha une-as; não há dados pelo meio.')}</p>
    </figcaption>
  </figure>
  <div class="stats">
    ${stat('events', '', '142', 142, '+', t(fig('events').label))}
    ${stat('jobs', L('about', 'cerca de'), L('1,000', '1.000'), 1000, '', t(fig('jobs').label))}
    ${stat('communities', '', '24', 24, '', t(fig('communities').label))}
  </div>
</section>

<section class="plate" aria-labelledby="h-build">
  <div class="plate-media">${img('hall', L('Illustration: a university hall at night, long tables of laptops and cables, people working, a large projection wall glowing orange and blue.', 'Ilustração: um auditório universitário à noite, mesas compridas com portáteis e cabos, pessoas a trabalhar, uma grande parede de projeção em laranja e azul.'), 'plate-img')}</div>
  <div class="plate-in">
    <p class="kicker">${esc(t(prog[0].programmes[2].name))} · <time datetime="${vib.start}">${esc(h.date(vib.start))}</time> · ${esc(t(vib.place))}</p>
    <h2 id="h-build" class="kin">${words(t(vib.name))}</h2>
    <p>${esc(t(vib.summary))}</p>
    ${cite(vib.sources)}
  </div>
  ${cap(L('A build day, imagined. Not the real event.', 'Um dia de construção, imaginado. Não é o evento real.'))}
</section>

<section id="pillars" class="ch pillars" aria-labelledby="h-pillars">
  ${head('04', 'pillars', L('What we run', 'O que fazemos'), L('Three pillars, ten programmes', 'Três pilares, dez programas'))}
  <p class="intro">${esc(t(v.pillars_intro))}</p>
  <div class="pill-grid">
    <div class="radial-wrap rv">${radialSvg}</div>
    <div class="prog-list">${progList}</div>
  </div>
</section>

<section class="plate plate-r" aria-labelledby="h-industry">
  <div class="plate-media">${img('harbour', L('Illustration: a small Algarve fishing harbour at blue hour, coloured wooden boats and nets, with thin lines of light drawn over the water like a data display.', 'Ilustração: um pequeno porto de pesca algarvio ao anoitecer, barcos de madeira coloridos e redes, com linhas finas de luz sobre a água, como um ecrã de dados.'), 'plate-img')}</div>
  <div class="plate-in">
    <p class="kicker">${esc(t(inova.name))}</p>
    <h2 id="h-industry" class="kin">${words(L('Industries we already have, made more competitive', 'As indústrias que já temos, mais competitivas'))}</h2>
    <p>${esc(t(inova.summary))}</p>
    ${cite(inova.sources)}
  </div>
  ${cap(L('A working harbour with a data layer, imagined.', 'Um porto de pesca com uma camada de dados, imaginado.'))}
</section>

<section id="network" class="ch network" aria-labelledby="h-network">
  ${head('05', 'network', L('Who we work with', 'Com quem trabalhamos'), L('The ecosystem, mapped', 'O ecossistema, mapeado'))}
  <p class="intro">${esc(t(v.network_intro))}</p>
  <figure class="net-fig rv">${netSvg}<figcaption class="legend"><span><i class="lg lg-c"></i>Algarve Evolution</span><span><i class="lg lg-p"></i>${L('programmes and summits', 'programas e cimeiras')}</span><span><i class="lg lg-o"></i>${L('partners and places', 'parceiros e territórios')}</span></figcaption></figure>
  <h3 class="sub">${L('Partners, and what we do together', 'Parceiros, e o que fazemos em conjunto')}</h3>
  <ul class="partners">${partnerList}</ul>
  ${cite(netSrc)}
</section>

<section id="map" class="ch mapch" aria-labelledby="h-map">
  <div class="map-bg">${img('towns', L('Illustration: Algarve towns at night seen from above the sea, joined by thin lines of light.', 'Ilustração: vilas do Algarve à noite vistas do mar, ligadas por linhas finas de luz.'), 'map-bg-img')}</div>
  <div class="map-in">
    ${head('06', 'map', L('Algarve Digital Innovators', 'Algarve Digital Innovators'), L('All 16 municipalities', 'Os 16 municípios'))}
    <div class="map-num rv"><p class="mega"><span class="cnt" data-to="16">16</span></p><p>${L('municipalities', 'municípios')}</p><p class="mega2"><span class="cnt" data-to="24">24</span></p><p>${L('digital communities mapped', 'comunidades digitais mapeadas')}</p></div>
    <figure class="map-fig rv">${mapSvg}<figcaption><ul class="muni-list">${munis.map(m => `<li${m.id === 'faro' ? ' class="hq"' : ''}>${esc(m.name)}</li>`).join('')}</ul><p class="fine">${L('Faro, ringed, is where we are based. Lines join each municipality to its two nearest neighbours: a drawing, not a map of real links. Outline: Natural Earth (public domain).', 'Faro, assinalado, é onde estamos sediados. As linhas ligam cada município aos dois vizinhos mais próximos: um desenho, não um mapa de ligações reais. Contorno: Natural Earth (domínio público).')}</p></figcaption></figure>
    <p class="intro">${esc(t(adi.summary))}</p>
    ${cite([...adi.sources, 'adi'])}
  </div>
  ${cap(L('Algarve towns at night, joined by light, imagined.', 'Vilas do Algarve à noite, ligadas pela luz, imaginadas.'))}
</section>

<section id="road" class="ch road" aria-labelledby="h-road">
  ${head('07', 'road', L('2018 to 2032', '2018 a 2032'), L('The road so far, and ahead', 'O caminho até aqui, e o que vem'))}
  <div class="track-wrap">
    <div class="track-ctl"><button type="button" class="tb" data-dir="-1" aria-label="${L('Earlier', 'Anterior')}">←</button><button type="button" class="tb" data-dir="1" aria-label="${L('Later', 'Seguinte')}">→</button></div>
    <ol class="track" tabindex="0" aria-label="${L('Timeline, scroll sideways', 'Cronologia, deslize para o lado')}">${tlCards}</ol>
  </div>
</section>

<section id="join" class="plate join" aria-labelledby="h-join">
  <div class="plate-media">${img('cork', L('Illustration: a freshly harvested cork oak in golden grass in the inland Algarve hills, with raised solar panels and a small drone behind.', 'Ilustração: um sobreiro acabado de descortiçar num prado dourado da serra algarvia, com painéis solares elevados e um pequeno drone ao fundo.'), 'plate-img')}</div>
  <div class="plate-in">
    <p class="kicker">08</p>
    <h2 id="h-join" class="kin">${words(t(v.join_title))}</h2>
    <ol class="steps">${v.join.map((j, i) => `<li><span>${i + 1}</span>${esc(t(j))}</li>`).join('')}</ol>
    ${cite(v.join_sources)}
  </div>
  ${cap(L('Cork oak and solar in the inland Algarve, imagined.', 'Sobreiro e energia solar na serra algarvia, imaginados.'))}
</section>

<section id="try" class="ch try" aria-labelledby="h-try">
  ${head('09', 'try', L('Proposals, working', 'Propostas, a funcionar'), t(v.try_title))}
  <p class="intro">${esc(t(v.try_intro))}</p>
  <div class="apps">${apps.map((a, i) => `<a class="app rv" href="${lang === 'pt' ? '/pt' : ''}${a.href}">
    <svg class="app-art" viewBox="0 0 320 160" aria-hidden="true">${i === 0
      ? munis.map((m, k) => { const [x, y] = mp[m.id]; return `<circle cx="${(x * 0.36 + 14).toFixed(1)}" cy="${(y * 0.36 + 12).toFixed(1)}" r="${k % 3 ? 3 : 5}"/>`; }).join('') + [...edges].map(e => { const [a2, b2] = e.split('|'); return `<line x1="${(mp[a2][0] * 0.36 + 14).toFixed(1)}" y1="${(mp[a2][1] * 0.36 + 12).toFixed(1)}" x2="${(mp[b2][0] * 0.36 + 14).toFixed(1)}" y2="${(mp[b2][1] * 0.36 + 12).toFixed(1)}"/>`; }).join('')
      : Array.from({ length: 24 }, (_, k) => `<rect x="${16 + (k % 4) * 30}" y="${24 + Math.floor(k / 4) * 20}" width="26" height="16" rx="2"/>`).join('') + `<path class="arr" d="M150 80 H186 M176 70 L188 80 L176 90"/><rect class="ph" x="210" y="20" width="84" height="124" rx="14"/><rect class="ph2" x="222" y="40" width="60" height="14" rx="4"/><rect class="ph2" x="222" y="62" width="60" height="30" rx="4"/><rect class="ph2" x="222" y="100" width="40" height="14" rx="4"/>`}</svg>
    <span class="tag">${esc(h.words.proposal)}</span>
    <h3>${esc(t(a.name))}</h3><p>${esc(t(a.summary))}</p><span class="go">${L('Open the working prototype', 'Abrir o protótipo')} <span aria-hidden="true">→</span></span></a>`).join('')}</div>
  ${cite(apps.flatMap(a => a.prop?.sources || []))}
</section>

<section id="sources" class="ch sources" aria-labelledby="h-sources">
  <h2 id="h-sources">${L('Sources', 'Fontes')}</h2>
  <p class="intro">${L('Every fact on this page links to one of these. The figures are the organisation\'s own, as reported; nobody here has audited them.', 'Cada facto nesta página liga a uma destas fontes. Os números são os da própria organização, tal como foram noticiados; ninguém aqui os auditou.')}</p>
  <ol class="srcs">${data.sources.sources.map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a> <span>${esc(s.publisher)}${s.published ? `, ${esc(h.date(s.published))}` : ''}</span></li>`).join('')}</ol>
  <p class="fine">${L('Images: AI-generated illustrations, made for this prototype with Google Gemini image models through OpenRouter; none shows a real place, event or person.', 'Imagens: ilustrações geradas por IA, feitas para este protótipo com modelos de imagem Google Gemini através do OpenRouter; nenhuma mostra um lugar, evento ou pessoa reais.')} <a href="/d/future/img/README.md">${L('Models, prompts and costs', 'Modelos, instruções e custos')}</a> · <a href="/d/future/fonts/README.md">${L('Fonts', 'Tipos de letra')}</a> · ${L('Data', 'Dados')}: <a href="/data/figures.json">figures</a>, <a href="/data/programmes.json">programmes</a>, <a href="/data/ecosystem.json">ecosystem</a>, <a href="/data/sources.json">sources</a></p>
</section>

</main>
<footer class="foot">
  <p class="big">${words(t(v.tagline))}</p>
  <p>${esc(t(v.footer_disclosure))}</p>
  <p>${esc(t(v.banner))} <a href="https://www.algarveevolution.pt/" rel="noopener">${esc(t(v.banner_link))}</a></p>
  <p class="fine">${L('Version', 'Versão')} ${esc(chrome.version)} · ${L('Code Apache-2.0; text and images CC BY 4.0', 'Código Apache-2.0; texto e imagens CC BY 4.0')} · <a href="${other}" hreflang="${lang === 'en' ? 'pt' : 'en'}">${lang === 'en' ? 'Português' : 'English'}</a></p>
</footer>
<script src="/d/future/app.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
