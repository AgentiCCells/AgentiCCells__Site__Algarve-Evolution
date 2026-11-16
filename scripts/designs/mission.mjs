// Mission Control (bold): the ecosystem as a live dashboard. A dark HUD with counters, target rings, a force-directed
// network of ecosystem.json (layout computed here at build time, then animated by hand-written physics in the browser),
// a radar map, a terminal log of the timeline, a programme status board, a transmission card and the two working ideas.
// Every panel is rendered at build time; /d/mission/mission.js adds the motion. Code Apache-2.0, text CC BY 4.0.
// sites-dev@AgentiCCells.dinis, 16 November 2026.
import { ecoIn, outline, pathOf, isoOf } from './atlas.mjs';

export const meta = {
  slug: 'mission', order: 5, group: 'bold',
  name: { en: 'Mission Control', pt: 'Centro de Comando' }, tagline: { en: 'The ecosystem as a live dashboard', pt: 'O ecossistema como um painel ao vivo' },
};

const L = {
  en: {
    sys: 'Mission Control', sector: 'Sector', base: 'Base', status: 'Status', proto: 'Prototype', local: 'Faro time',
    skip: 'Skip to the dashboard', heroK: 'Transmission from Algarve Evolution', mission: 'Mandate',
    phase: 'Phase', phaseV: 'From building a community to making the ecosystem work (2026)', next: 'Next milestone', nextV: 'Algarve Tech Hub Summit returns, 2027',
    tminus: 'T minus', days: 'days to 2032', calc: 'Days from today to 1 January 2032: our calculation.',
    p1: 'Telemetry', p1s: 'Our own figures, as reported. Not audited; where sources differ, both are shown.',
    signal: 'Membership signal', signalNote: 'Sources count members differently (companies; companies and individuals; members), so the bars are not a like-for-like series.',
    p2: '2032 targets', target: 'Target', notResult: 'Targets, not results',
    p3: 'Ecosystem network', p3s: 'Our network as data: drag a node, hover or focus one to read it. Lines are the relationships the sources describe.',
    inspector: 'Node inspector', links: 'Links', kind: 'Type', nodeIndex: 'Every node, as a list',
    kinds: { centre: 'Centre', programme: 'Programme', partner: 'Partner', municipality: 'Municipality', summit: 'Summit', event: 'Event' },
    dashed: 'Not found yet', listed: 'Listed on our calendar, organised by others',
    p4: 'Radar: the Algarve', p4s: 'The 16 municipalities and the places in our story. Positions approximate.', contacts: 'Contacts', readout: 'Readout', select: 'Choose a blip to read it.',
    p5: 'Timeline log', p5s: 'From the ecosystem data, oldest first.', replay: 'Replay',
    p6: 'Programme status board', pillar: 'Pillar', programme: 'Programme', stat: 'Status', src: 'Source',
    p7: 'Incoming transmission', channel: 'Channel', from: 'From',
    p8: 'Modules', modNote: 'Two ideas proposed to us, built as working prototypes. Nothing in them is agreed yet.', launch: 'Launch module', modStatus: 'Proposal, working prototype',
    p9: 'Mission log: events', p10: 'Open channels', p11: 'Allied stations', p12: 'Sources', p12s: 'Every fact on this dashboard links to one of these.',
    fonts: 'Typefaces: Chakra Petch and JetBrains Mono (SIL OFL 1.1).', version: 'Version', motion: 'Motion',
    motionOn: 'Motion on', motionOff: 'Motion off', growth: 'Growth',
  },
  pt: {
    sys: 'Centro de Comando', sector: 'Setor', base: 'Base', status: 'Estado', proto: 'Protótipo', local: 'Hora de Faro',
    skip: 'Saltar para o painel', heroK: 'Transmissão da Algarve Evolution', mission: 'Missão',
    phase: 'Fase', phaseV: 'De construir uma comunidade a pôr o ecossistema a funcionar (2026)', next: 'Próximo marco', nextV: 'A Algarve Tech Hub Summit regressa em 2027',
    tminus: 'T menos', days: 'dias até 2032', calc: 'Dias de hoje até 1 de janeiro de 2032: cálculo nosso.',
    p1: 'Telemetria', p1s: 'Os nossos números, tal como noticiados. Não auditados; quando as fontes diferem, mostramos as duas.',
    signal: 'Sinal de membros', signalNote: 'As fontes contam os membros de formas diferentes (empresas; empresas e particulares; membros), por isso as barras não são uma série comparável.',
    p2: 'Metas para 2032', target: 'Meta', notResult: 'Metas, não resultados',
    p3: 'Rede do ecossistema', p3s: 'A nossa rede como dados: arraste um nó, passe o cursor ou selecione-o para o ler. As linhas são as relações descritas pelas fontes.',
    inspector: 'Inspetor de nós', links: 'Ligações', kind: 'Tipo', nodeIndex: 'Todos os nós, em lista',
    kinds: { centre: 'Centro', programme: 'Programa', partner: 'Parceiro', municipality: 'Município', summit: 'Cimeira', event: 'Evento' },
    dashed: 'Ainda não encontrado', listed: 'No nosso calendário, organizado por outros',
    p4: 'Radar: o Algarve', p4s: 'Os 16 municípios e os locais da nossa história. Posições aproximadas.', contacts: 'Contactos', readout: 'Leitura', select: 'Escolha um ponto para o ler.',
    p5: 'Registo da cronologia', p5s: 'A partir dos dados do ecossistema, do mais antigo para o mais recente.', replay: 'Repetir',
    p6: 'Quadro de estado dos programas', pillar: 'Pilar', programme: 'Programa', stat: 'Estado', src: 'Fonte',
    p7: 'Transmissão recebida', channel: 'Canal', from: 'De',
    p8: 'Módulos', modNote: 'Duas ideias que nos foram propostas, construídas como protótipos a funcionar. Nada nelas está ainda acordado.', launch: 'Abrir módulo', modStatus: 'Proposta, protótipo a funcionar',
    p9: 'Diário de missão: eventos', p10: 'Canais abertos', p11: 'Estações aliadas', p12: 'Fontes', p12s: 'Cada facto deste painel tem ligação para uma destas fontes.',
    fonts: 'Tipos de letra: Chakra Petch e JetBrains Mono (SIL OFL 1.1).', version: 'Versão', motion: 'Movimento',
    motionOn: 'Movimento ligado', motionOff: 'Movimento desligado', growth: 'Crescimento',
  },
};

// Status lines for the board, each a short restatement of the programme's own summary (same sources).
const STATUS = {
  'ualg-entrepreneurship': ['ok', { en: 'Running · Penha, Gambelas, Portimão', pt: 'Em curso · Penha, Gambelas, Portimão' }],
  'the-company': ['ok', { en: 'Running · secondary schools', pt: 'Em curso · ensino secundário' }],
  buildathons: ['ok', { en: 'Latest: Vibathon Algarve 2026', pt: 'Último: Vibathon Algarve 2026' }],
  founder2founder: ['go', { en: 'Launched Oct 2026 · 8 of 41', pt: 'Lançado out 2026 · 8 de 41' }],
  incubator: ['go', { en: 'Recognised Jan 2026 · early stage planned 2027', pt: 'Reconhecida jan 2026 · fase inicial prevista 2027' }],
  'inova-algarve-3': ['wait', { en: 'Pilot · 20 tourism businesses', pt: 'Piloto · 20 empresas de turismo' }],
  'startup-showcase': ['ok', { en: 'Annual', pt: 'Anual' }],
  'algarve-digital-innovators': ['ok', { en: '24 communities · plan to 2030', pt: '24 comunidades · plano até 2030' }],
  'algarve-tech-hub-summit': ['wait', { en: 'Returns 2027', pt: 'Regressa em 2027' }],
  'ccdr-digital-platform': ['ok', { en: 'Leading', pt: 'Liderança' }],
};
// The 2027 return is stated in the summit's event record, which cites the same page as the programme.
const STATUS_SRC = { 'algarve-tech-hub-summit': 'https://promptugal.news/events/algarve-tech-hub-summit-2025/index.html', buildathons: 'https://newsroom.sgit.ai/articles/vibathon-algarve-2026.html' };

const SHORT = {
  en: { ae: 'Algarve Evolution', adi: 'ADI', f2f: 'Founder2Founder', inova: 'INOVA 3.0', aths: 'Tech Hub Summit', venture: 'Venture Lab', grow: 'Grow Meetup', ualg: 'UAlg', stp: 'Algarve STP',
    ja: 'Junior Achievement', startupPt: 'Startup Portugal', munis: '16 municipalities', lagos: 'CM Lagos', gdg: 'GDG Lagos', ws25: 'Web Summit 2025', ws26: 'Web Summit 2026',
    devfestEv: 'DevFest Lagos 2026', tmctEv: "TMCT'26", wealthEv: 'Private Wealth', wrapEv: 'Wrap Party 2025', afterEv: 'Tech Afterwork' },
  pt: { munis: '16 municípios', education: 'Educação', incubator: 'Incubadora', wealthEv: 'Private Wealth' },
};

// ---- build-time force layout (the browser continues it with the same forces, in mission.js) ----
export function tickForces(P, E, W, H, alpha) {
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const a = P[i], b = P[j]; let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
    const f = Math.min(40, 16000 / d2) * alpha; dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    const min = (a.r || 12) + (b.r || 12) + 34; if (d < min) { const push = (min - d) / 2; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
  }
  for (const [a, b] of E) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; const rest = a.id === 'ae' || b.id === 'ae' ? 175 : 125;
    const f = (d - rest) * 0.03 * alpha; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f; }
  for (const p of P) { const g = p.id === 'ae' ? 30 : 1; p.vx += (W / 2 - p.x) * 0.0018 * alpha * g; p.vy += (H / 2 - p.y) * 0.0036 * alpha * g;
    p.vx *= 0.8; p.vy *= 0.8; if (!p.fixed) { p.x = Math.max(80, Math.min(W - 80, p.x + p.vx)); p.y = Math.max(36, Math.min(H - 36, p.y + p.vy)); } }
}
const R = { centre: 30, programme: 15, partner: 12, municipality: 12, summit: 11, event: 9 };
function layout(nodes, links, W, H) {
  let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const ring = { centre: 0, programme: 150, partner: 290, municipality: 300, summit: 250, event: 230 };
  const P = nodes.map((n, i) => { const a = i * 2.39996 + rnd() * 0.3, r = ring[n.kind] ?? 200; return { id: n.id, r: R[n.kind] || 10, x: W / 2 + Math.cos(a) * r * 1.3, y: H / 2 + Math.sin(a) * r * 0.85, vx: 0, vy: 0 }; });
  const by = new Map(P.map(p => [p.id, p]));
  const E = links.map(([a, b]) => [by.get(a), by.get(b)]);
    for (let it = 0; it < 1400; it++) {
    const alpha = Math.max(0.02, 1 - it / 1200);
    tickForces(P, E, W, H, alpha);
  }
  return by;
}

export function render({ lang, data, h, chrome, other }) {
  const { esc, t, cite, num } = h; const v = data.voice; const W = L[lang]; const pt = lang === 'pt';
  const E = ecoIn(data, lang); const O = outline(data);
  const short = id => SHORT[lang][id] ?? SHORT.en[id] ?? E.nodes.find(n => n.id === id).label;
  const panel = (id, code, title, inner, { cls = '', sub = '', live = '' } = {}) => `<section class="pn ${cls}" id="${id}" aria-labelledby="h-${id}">
  <header class="pn-h"><span class="pn-code" aria-hidden="true">${code}</span><h2 id="h-${id}">${title}</h2>${live ? `<span class="pn-live" aria-hidden="true">${live}</span>` : ''}</header>
  ${sub ? `<p class="pn-sub">${sub}</p>` : ''}${inner}</section>`;

  // Figures
  const figs = data.figures.figures.filter(f => f.id !== 'targets-2032');
  const figHTML = `<ul class="tele">${figs.map((f, i) => `<li class="tl tl-${i}"><span class="tl-k">${['YR', 'MBR', 'JOB', 'EVT', 'COM'][i]}</span><strong class="tl-v" data-count>${esc(t(f.value))}</strong><span class="tl-l">${esc(t(f.label))}</span>${f.note ? `<em class="tl-n">${esc(t(f.note))}</em>` : ''}${cite(f.sources)}</li>`).join('')}</ul>`;
  const stat = k => E.timeline.find(e => e.key === k);
  const members = data.figures.figures.find(f => f.id === 'members');
  const bars = [
    { y: '2019', v: 29, max: 29, label: stat('2019.7').stat, src: stat('2019.7').src },
    { y: '2024', v: 70, max: 70, label: stat('2024.53').stat, src: stat('2024.53').src },
    { y: '2026', v: 106, max: 118, label: `${t(members.value)} ${pt ? 'membros ativos' : 'active members'}`, src: members.sources },
  ];
  const sig = `<figure class="signal"><figcaption>${esc(W.signal)}</figcaption><div class="bars">${bars.map(b => `<div class="bar"><div class="bar-col"><span class="bar-max" style="height:${(b.max / 118 * 100).toFixed(1)}%"></span><span class="bar-fill" style="height:${(b.v / 118 * 100).toFixed(1)}%"></span></div><b>${b.y}</b><span>${esc(b.label)}</span>${cite(b.src)}</div>`).join('')}</div><p class="fine">${esc(W.signalNote)}</p></figure>`;

  // Targets
  const rings = v.goals.map((g, i) => { const val = pt && g.value_pt ? g.value_pt : g.value; const C = 2 * Math.PI * 52;
    return `<li class="ring r-${i}"><svg viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="60" class="rg-tick"/><circle cx="66" cy="66" r="52" class="rg-bg"/><circle cx="66" cy="66" r="52" class="rg-fg" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:0" transform="rotate(-90 66 66)"/></svg>
      <div class="rg-in"><span class="rg-t">${esc(W.target)}</span><strong data-count>${esc(val)}</strong></div><span class="rg-l">${esc(t(g.label))}</span></li>`; }).join('');
  const now = new Date(); const days = Math.ceil((Date.UTC(2032, 0, 1) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 864e5);
  const targets = `<ol class="rings">${rings}</ol><p class="nr"><span class="led amber" aria-hidden="true"></span>${esc(t(v.goals_note))}</p>${cite(v.goals_sources)}
  <div class="tminus"><span class="tm-k">${esc(W.tminus)}</span><strong class="tm-v" data-tminus>${num(days)}</strong><span class="tm-l">${esc(W.days)}</span><p class="fine">${esc(W.calc)}</p></div>`;

  // Network graph
  const GW = 1000, GH = 640;
  const pos = layout(E.nodes, E.links, GW, GH);
  const edgeSVG = E.links.map(([a, b, l], i) => { const p = pos.get(a), q = pos.get(b); const dashed = E.nodes.find(n => n.id === b)?.dashed;
    return `<line class="ed${dashed ? ' dash' : ''}" data-a="${a}" data-b="${b}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}"><title>${esc(short(a))} · ${esc(l)} · ${esc(short(b))}</title></line>`; }).join('');
  // Label placement: try right, left, above, below; keep the one that overlaps least with nodes and labels placed so far.
  const boxes = E.nodes.map(n => { const p = pos.get(n.id), r = R[n.kind] || 10; return [p.x - r, p.y - r, p.x + r, p.y + r]; });
  const lab = new Map(); const aeP = pos.get('ae');
  const ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  for (const n of E.nodes) { const p = pos.get(n.id), r = R[n.kind] || 10, w = short(n.id).length * 7.7 + 4, hh = 15;
    const c = n.id === 'ae' ? [[0, r + 18, 'middle']] : [[r + 6, 4, 'start'], [-(r + 6), 4, 'end'], [0, -(r + 7), 'middle'], [0, r + 16, 'middle']];
    let best = null;
    for (const [dx, dy, an] of c) { const x0 = an === 'start' ? p.x + dx : an === 'end' ? p.x + dx - w : p.x - w / 2; const bx = [x0, p.y + dy - 11, x0 + w, p.y + dy - 11 + hh];
      let sc = boxes.reduce((t, b) => t + ov(bx, b), 0) + [...lab.values()].reduce((t, b) => t + ov(bx, b.box) * 1.5, 0);
      if (bx[0] < 4 || bx[2] > GW - 4) sc += 5000; if ((an === 'start') !== (p.x > aeP.x) && an !== 'middle') sc += 30;
      if (!best || sc < best.sc) best = { sc, dx, dy, an, box: bx }; }
    lab.set(n.id, best); boxes.push(best.box); }
  const nodeSVG = E.nodes.map(n => { const p = pos.get(n.id); const r = R[n.kind] || 10; const lb = lab.get(n.id);
    return `<g class="nd k-${n.kind}${n.dashed ? ' dash' : ''}${n.listed ? ' listed' : ''}" data-id="${n.id}" data-r="${r}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(n.label)}: ${esc(W.kinds[n.kind])}">
      <circle class="nd-halo" r="${r + 7}"/><circle class="nd-c" r="${r}"/>${n.id === 'ae' ? '<text class="nd-ae" y="5" text-anchor="middle">AE</text>' : ''}
      <text class="nd-l" x="${lb.dx}" y="${lb.dy}" text-anchor="${lb.an}">${esc(short(n.id))}</text></g>`; }).join('');
  const nodeCard = n => { const ls = E.links.filter(([a, b]) => a === n.id || b === n.id);
    return `<article class="ins-card" data-node="${n.id}"><p class="ins-k"><span class="led k-${n.kind}" aria-hidden="true"></span>${esc(W.kinds[n.kind])}${n.dashed ? ` · ${esc(W.dashed)}` : ''}${n.listed ? ` · ${esc(W.listed)}` : ''}</p>
      <h3>${esc(n.label)}</h3><p>${esc(n.note)}</p>${cite(n.src)}
      <p class="ins-sub">${esc(W.links)} (${ls.length})</p><ul class="ins-links">${ls.map(([a, b, l]) => { const o = a === n.id ? b : a; const dir = a === n.id ? '→' : '←';
        return `<li><span class="arr" aria-hidden="true">${dir}</span> <span class="lk">${esc(l)}</span> <button type="button" data-goto="${o}">${esc(E.nodes.find(x => x.id === o).label)}</button></li>`; }).join('')}</ul></article>`; };
  const graph = `<div class="graph-wrap"><div class="graph"><svg class="net" viewBox="0 0 ${GW} ${GH}" role="group" aria-label="${esc(W.p3)}">
    <defs><radialGradient id="glow"><stop offset="0" stop-color="#00e5ff" stop-opacity=".35"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${GW / 2}" cy="${GH / 2}" r="280" fill="url(#glow)" opacity=".5"/>
    <g class="eds">${edgeSVG}</g><g class="nds">${nodeSVG}</g></svg>
    <ul class="legend">${Object.entries(W.kinds).map(([k, l]) => `<li><span class="led k-${k}" aria-hidden="true"></span>${esc(l)}</li>`).join('')}</ul></div>
    <aside class="inspector" aria-label="${esc(W.inspector)}"><p class="ins-h">${esc(W.inspector)}</p><div class="ins-body" aria-live="polite">${nodeCard(E.nodes[0])}</div></aside></div>
    <details class="idx"><summary>${esc(W.nodeIndex)} (${E.nodes.length})</summary><div class="idx-grid">${E.nodes.map(nodeCard).join('')}</div></details>`;

  // Radar
  const RS = 600, C0 = [-8.17, 37.22], KR = 395, COS = Math.cos(37.2 * Math.PI / 180);
  const rp = ([lon, lat]) => [RS / 2 + (lon - C0[0]) * COS * KR, RS / 2 - (lat - C0[1]) * KR];
  const rpath = (ring, o = {}) => pathOf(ring, { project: rp, ...o });
  const rad = [];
  for (let r = 60; r <= 290; r += 58) rad.push(`<circle cx="300" cy="300" r="${r}" class="rd-ring"/>`);
  for (let a = 0; a < 360; a += 10) { const rr = a % 30 ? 284 : 276; const x1 = 300 + Math.sin(a * Math.PI / 180) * rr, y1 = 300 - Math.cos(a * Math.PI / 180) * rr, x2 = 300 + Math.sin(a * Math.PI / 180) * 292, y2 = 300 - Math.cos(a * Math.PI / 180) * 292;
    rad.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="rd-tk"/>`); }
  const ecoNames = new Set(E.places.map(p => p.name));
  const ML = { 'vila-do-bispo': [-6, 12, 'end'], 'castro-marim': [-6, -6, 'end'], 'vila-real-de-santo-antonio': [-6, 12, 'end'], olhao: [6, 12, 'start'], lagoa: [5, -6, 'start'], silves: [5, -6, 'start'], loule: [-6, -6, 'end'], 'sao-bras-de-alportel': [6, -6, 'start'], aljezur: [6, -6, 'start'], alcoutim: [-6, -6, 'end'] };
  const munis = data.places.municipalities.filter(m => !ecoNames.has(m.name)).map(m => { const [x, y] = rp(m.ll); const [lx, ly, la] = ML[m.id] || [6, -5, 'start'];
    return `<a href="#ct-m-${m.id}" class="blip-m" data-ct="ct-m-${m.id}" aria-label="${esc(m.name)}"><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="9" class="hit"/><circle r="3" class="bm"/><text x="${lx}" y="${ly}" text-anchor="${la}" class="bm-l">${esc(m.name.toUpperCase())}</text></g></a>`; }).join('');
  const PL = { Faro: [0, 20, 'middle'], Almancil: [-9, -8, 'end'], Lagos: [-8, 16, 'end'], Portimão: [6, 16, 'start'], Albufeira: [0, 18, 'middle'], Tavira: [0, 18, 'middle'], Salir: [8, -6, 'start'], Monchique: [8, -7, 'start'] };
  const blips = E.places.map((p, i) => { const [x, y] = rp(p.ll); const [dx, dy, an] = PL[p.name] || [8, -6, 'start'];
    return `<a href="#ct-${i}" class="blip${p.hq ? ' hq' : ''}" data-ct="ct-${i}" aria-label="${esc(p.name)}" style="--d:${(i * 0.37).toFixed(2)}s"><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="14" class="hit"/><circle r="${p.hq ? 13 : 9}" class="bp-p"/><circle r="${p.hq ? 6 : 4.5}" class="bp"/><text x="${dx}" y="${dy}" text-anchor="${an}" class="bp-l">${esc(p.name.toUpperCase())}</text></g></a>`; }).join('');
  const contacts = E.places.map((p, i) => `<li id="ct-${i}" class="ct"><p class="ct-k">${p.hq ? 'HQ · ' : ''}${p.ll[1].toFixed(3)}N ${Math.abs(p.ll[0]).toFixed(3)}W</p><h3>${esc(p.name)}</h3><p>${esc(p.note)}</p>${cite(p.src)}</li>`).join('')
    + data.places.municipalities.filter(m => !ecoNames.has(m.name)).map(m => `<li id="ct-m-${m.id}" class="ct ct-m"><p class="ct-k">${m.ll[1].toFixed(3)}N ${Math.abs(m.ll[0]).toFixed(3)}W</p><h3>${esc(m.name)}</h3><p>${pt ? 'Um dos 16 municípios do Algarve, todos na rede Algarve Digital Innovators.' : 'One of the 16 municipalities of the Algarve, all in the Algarve Digital Innovators network.'}</p>${cite(['adi', data.places.municipalities_source])}</li>`).join('');
  const radar = `<div class="radar-wrap"><div class="radar"><svg viewBox="0 0 ${RS} ${RS}" role="group" aria-label="${esc(W.p4)}">
    <defs><clipPath id="rclip"><circle cx="300" cy="300" r="292"/></clipPath><radialGradient id="rbg"><stop offset="0" stop-color="#062a2e"/><stop offset="1" stop-color="#020b0f"/></radialGradient></defs>
    <circle cx="300" cy="300" r="292" fill="url(#rbg)"/>
    <g clip-path="url(#rclip)"><path d="${rpath(O.spain)}" class="rd-es"/><path d="${rpath(O.portugal)}" class="rd-land"/>
      <path d="${rpath(O.coastPt, { closed: false })}" class="rd-coast"/><path d="${rpath(O.border, { closed: false, smooth: .3 })}" class="rd-border"/>
      <path d="M300,8V592M8,300H592" class="rd-x"/>${rad.join('')}</g>
    <g class="rd-blips">${munis}${blips}</g>
    <text x="300" y="22" text-anchor="middle" class="rd-n">N</text></svg><div class="sweep" aria-hidden="true"></div></div>
    <div class="readout" aria-live="polite"><p class="ro-h">${esc(W.readout)}</p><div class="ro-body"><p class="muted">${esc(W.select)}</p></div></div></div>
    <details class="idx"><summary>${esc(W.contacts)} (${E.places.length + 16 - [...ecoNames].filter(n => data.places.municipalities.some(m => m.name === n)).length})</summary><ul class="ct-list">${contacts}</ul></details>`;

  // Terminal
  const term = `<div class="term" tabindex="0" aria-label="${esc(W.p5)}"><ol>${E.timeline.map(e => `<li class="tl-line${e.future ? ' fut' : ''}"><span class="ts">${esc(isoOf(data.ecosystem.timeline.find(x => x.t === e.t).when))}</span> <span class="gt" aria-hidden="true">&gt;</span> <strong>${esc(e.title.toUpperCase())}</strong><span class="tx">${esc(e.text)}${e.stat ? ` [${esc(e.stat)}]` : ''}</span>${cite(e.src, 'src tsrc')}</li>`).join('')}</ol><p class="prompt" aria-hidden="true">&gt; <span class="cursor">_</span></p></div>
    <button type="button" class="btn-replay">${esc(W.replay)}</button>`;

  // Status board
  const board = `<p class="pn-sub">${esc(t(v.pillars_intro))}</p><div class="board" role="table" aria-label="${esc(W.p6)}"><div class="br br-h" role="row"><span role="columnheader">${esc(W.pillar)}</span><span role="columnheader">${esc(W.programme)}</span><span role="columnheader">${esc(W.stat)}</span><span role="columnheader">${esc(W.src)}</span></div>
    ${data.programmes.pillars.flatMap((p, pi) => p.programmes.map(g => { const [cls, txt] = STATUS[g.id] || ['ok', { en: '', pt: '' }];
      return `<div class="br" role="row" title="${esc(t(g.summary))}"><span role="cell" class="b-p">${String(pi + 1).padStart(2, '0')} ${esc(t(p.name))}</span><span role="cell" class="b-n">${esc(t(g.name))}</span><span role="cell" class="b-s"><span class="led ${cls}" aria-hidden="true"></span><span class="flap">${esc(t(txt))}</span></span><span role="cell" class="b-src">${cite([...new Set([...g.sources, ...(STATUS_SRC[g.id] ? [STATUS_SRC[g.id]] : [])])], 'src')}</span></div>`; })).join('')}</div>
    <details class="idx"><summary>${pt ? 'O que cada programa faz' : 'What each programme does'}</summary><ul class="pg-list">${data.programmes.pillars.flatMap(p => p.programmes.map(g => `<li><strong>${esc(t(g.name))}</strong> ${esc(t(g.summary))}</li>`)).join('')}</ul></details>`;

  // Transmission
  const q = data.people.quotes[0]; const person = data.people.people.find(p => p.id === q.by);
  const wave = Array.from({ length: 48 }, (_, i) => `<i style="--h:${(30 + 60 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23))).toFixed(0)}%;--i:${i}"></i>`).join('');
  const trans = `<div class="tx-meta"><span>${esc(W.channel)} 01</span><span>${q.date}</span><span>${esc(W.from)}: ${esc(t(person.role)).toUpperCase()}</span></div><div class="wave" aria-hidden="true">${wave}</div>
    <blockquote><p>${esc(t(q.text))}</p></blockquote><p class="tx-by"><strong>${esc(person.name)}</strong>, ${esc(t(person.role))} · <time datetime="${q.date}">${esc(h.date(q.date))}</time></p>${pt && q.translation_note?.pt ? `<p class="fine">${esc(q.translation_note.pt)}</p>` : ''}${cite(q.sources)}
    <p class="fine">${esc(t(person.summary))}</p>${cite(person.sources)}`;

  const mods = `<p class="pn-sub">${esc(W.modNote)}</p><div class="mods">${v.apps.map((a, i) => `<a class="mod" href="${pt ? '/pt' : ''}${a.href}"><span class="mod-k">MOD-0${i + 1} · ${esc(W.modStatus)}</span><strong>${esc(t(a.name))}</strong><span class="mod-s">${esc(t(a.summary))}</span><span class="mod-go">${esc(W.launch)} <span aria-hidden="true">→</span></span></a>`).join('')}</div>${cite(data.proposals.proposals.filter(p => v.apps.some(a => a.id === p.id)).flatMap(p => p.sources))}`;

  const evs = `<ol class="mlog">${data.events.events.map(e => `<li><p class="ml-k"><time datetime="${e.start}">${e.start}${e.end ? ` / ${e.end.slice(5)}` : ''}</time>${e.approximate ? ` (${pt ? 'aprox.' : 'approx.'})` : ''} · ${esc(t(e.place))}</p><h3>${esc(t(e.name))}</h3><p>${esc(t(e.summary))}</p>${cite(e.sources)}</li>`).join('')}</ol>`;
  const join = `<ol class="chan">${v.join.map((j, i) => `<li><span class="ch-k">CH-${'ABC'[i]}</span><p>${esc(t(j))}</p></li>`).join('')}</ol>${cite(v.join_sources)}`;
  const allies = `<p class="pn-sub">${esc(t(v.network_intro))}</p>${cite(['adi', 'psn'])}<ul class="allies">${E.nodes.filter(n => n.kind === 'partner').map(n => `<li><strong>${esc(n.label)}</strong><span>${esc(n.note)}</span>${cite(n.src)}</li>`).join('')}</ul>`;

  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t(meta.name))}: ${esc(t(v.tagline))} | Algarve Evolution</title>
<meta name="description" content="${esc(t(v.hero_lede))}">
<meta name="theme-color" content="#04070b">
${chrome.head}
<link rel="preload" href="/d/mission/fonts/chakra-petch-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/d/mission/fonts/jetbrains-mono-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/d/mission/mission.css">
<link rel="alternate" hreflang="${pt ? 'en' : 'pt'}" href="${other}">
</head>
<body class="mc">
${chrome.banner}
<a class="skip" href="#dash">${esc(W.skip)}</a>
<div class="hud" role="banner">
  <p class="hud-id"><span class="hud-logo" aria-hidden="true"></span>AE <span class="sl">//</span> ${esc(W.sys)}</p>
  <p class="hud-mid"><span>${esc(W.sector)}: ALGARVE</span><span>${esc(W.base)}: FARO 37.02N 7.93W</span></p>
  <p class="hud-r"><span class="clock" aria-hidden="true"><span data-clock>--:--:--</span> ${esc(W.local)}</span><span class="badge"><span class="led amber" aria-hidden="true"></span>${esc(W.status)}: ${esc(W.proto)}</span>
  <button type="button" class="motion" aria-pressed="true" data-on="${esc(W.motionOn)}" data-off="${esc(W.motionOff)}">${esc(W.motionOn)}</button></p>
</div>
<main id="dash" class="dash">
  <section class="hero" aria-labelledby="h-hero">
    <div class="hero-main">
      <p class="hero-k"><span class="led cyan blink" aria-hidden="true"></span>${esc(W.heroK)}</p>
      <h1 id="h-hero">${esc(t(v.tagline))}</h1>
      <p class="lede">${esc(t(v.hero_lede))}</p>
      <p class="mandate"><span>${esc(W.mission)}</span> ${esc(t(v.mission))}</p>
      ${cite(['psn'])}
    </div>
    <div class="hero-side">
    <svg class="reticle" viewBox="0 0 300 300" aria-hidden="true"><g fill="none">
      <circle cx="150" cy="150" r="140" class="rt-1"/><circle cx="150" cy="150" r="112" class="rt-2"/><circle cx="150" cy="150" r="70" class="rt-3"/>
      <g class="rt-spin"><path d="M150 10a140 140 0 0 1 121 70" class="rt-arc"/><path d="M150 290a140 140 0 0 1-121-70" class="rt-arc"/></g>
      <g class="rt-spin2"><path d="M38 150a112 112 0 0 1 33-79" class="rt-arc2"/><path d="M262 150a112 112 0 0 1-33 79" class="rt-arc2"/></g>
      <path d="M150 0v60M150 240v60M0 150h60M240 150h60" class="rt-x"/><circle cx="150" cy="150" r="5" class="rt-c"/>
    </g><text x="150" y="196" text-anchor="middle" class="rt-t">FARO HQ</text><text x="150" y="212" text-anchor="middle" class="rt-t2">37.02N 7.93W</text></svg>
    <dl class="hero-sys">
      <div><dt>${esc(W.base)}</dt><dd>Faro, Algarve</dd>${cite('psn')}</div>
      <div><dt>${esc(W.phase)}</dt><dd>${esc(W.phaseV)}</dd>${cite(person.sources[1])}</div>
      <div><dt>${esc(W.next)}</dt><dd>${esc(W.nextV)}</dd>${cite('psn')}</div>
      <div><dt>${esc(W.growth)}</dt><dd>${esc(t(v.story_intro))}</dd>${cite(v.story_sources)}</div>
    </dl></div>
  </section>
  <div class="grid">
    ${panel('tele', 'P-01', esc(W.p1), figHTML + sig, { cls: 'span-7', sub: esc(W.p1s), live: 'LIVE' })}
    ${panel('targets', 'P-02', esc(W.p2), targets, { cls: 'span-5', sub: `<span class="warn">${esc(W.notResult)}</span>` })}
    ${panel('network', 'P-03', esc(W.p3), graph, { cls: 'span-12', sub: esc(W.p3s), live: `${E.nodes.length} N · ${E.links.length} L` })}
    ${panel('radar', 'P-04', esc(W.p4), radar, { cls: 'span-6', sub: esc(W.p4s), live: 'SCAN' })}
    ${panel('log', 'P-05', esc(W.p5), term, { cls: 'span-6', sub: esc(W.p5s), live: 'TTY' })}
    ${panel('board', 'P-06', esc(W.p6), board, { cls: 'span-12' })}
    ${panel('trans', 'P-07', esc(W.p7), trans, { cls: 'span-7 pn-trans', live: 'RX' })}
    ${panel('modules', 'P-08', esc(W.p8), mods, { cls: 'span-5' })}
    ${panel('events', 'P-09', esc(W.p9), evs, { cls: 'span-7' })}
    ${panel('allies', 'P-10', esc(W.p11), allies, { cls: 'span-5' })}
    ${panel('join', 'P-11', esc(t(v.join_title)), join, { cls: 'span-12', sub: esc(W.p10) })}
    ${panel('sources', 'P-12', esc(W.p12), '<!-- data:sources -->', { cls: 'span-12 pn-src', sub: esc(W.p12s) })}
  </div>
</main>
<footer class="foot">
  <p>${esc(t(v.banner))}</p><p>${esc(t(v.footer_disclosure))}</p>${cite('https://newsroom.sgit.ai/articles/joining-algarve-evolution.html')}
  <p class="fine">${esc(W.fonts)} ${esc(W.version)} ${esc(chrome.version)}</p>
</footer>
<script src="/d/mission/mission.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
