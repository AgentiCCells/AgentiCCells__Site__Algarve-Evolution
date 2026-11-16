// The Atlas (bold): map-first. A full-viewport SVG map of the Algarve drawn from places.json, the 16 municipalities,
// the ecosystem's places as rich markers, a timeline scrubber (ecosystem.json timeline), layers, and the story below.
// Everything is rendered at build time (works without JavaScript); /d/atlas/atlas.js adds pan, zoom, layers and play.
// Also exports the shared helpers the Mission Control design uses (projection, outline, ecosystem text, menu).
// sites-dev@AgentiCCells.dinis, 16 November 2026. Code Apache-2.0, text CC BY 4.0.
import { readFileSync } from 'node:fs';
import { APPS, langPath } from '../site-data.mjs';

export const meta = {
  slug: 'atlas', order: 6, group: 'bold',
  name: { en: 'The Atlas', pt: 'O Atlas', es: 'El Atlas', fr: 'L\'Atlas' },
  tagline: { en: 'The Algarve, mapped', pt: 'O Algarve, no mapa', es: 'El Algarve, en el mapa', fr: 'L\'Algarve, en carte' },
};

// ---------- shared helpers (also used by mission.mjs) ----------
// The English timeline, for machine dates (isoOf parses English "when"; the page's data may be in another language).
const ecoEn = JSON.parse(readFileSync(new URL('../../src/data/ecosystem.json', import.meta.url), 'utf8'));
export const whenEn = t => (ecoEn.timeline.find(e => e.t === t) || {}).when || '';

// The relationship words on the ecosystem's links ([from, to, word] in ecosystem.json, which has no
// translated fields for them): our translation, adding nothing. Unknown words stay in English.
const LINK_WORDS = {
  runs: { pt: 'gere', es: 'gestiona', fr: 'gère' }, leads: { pt: 'lidera', es: 'lidera', fr: 'pilote' },
  'co-organises': { pt: 'coorganiza', es: 'coorganiza', fr: 'coorganise' },
  'one of six partners': { pt: 'um de seis parceiros', es: 'uno de seis socios', fr: 'l\'un des six partenaires' },
  organises: { pt: 'organiza', es: 'organiza', fr: 'organise' }, 'created with': { pt: 'criada com', es: 'creada con', fr: 'créé avec' },
  across: { pt: 'em', es: 'en', fr: 'dans' }, with: { pt: 'com', es: 'con', fr: 'avec' }, by: { pt: 'por', es: 'por', fr: 'par' },
  partner: { pt: 'parceiro', es: 'socio', fr: 'partenaire' }, 'recognised by': { pt: 'reconhecida por', es: 'reconocida por', fr: 'reconnu par' },
  'project partner': { pt: 'parceira do projeto', es: 'socia del proyecto', fr: 'partenaire du projet' },
  'lead promoter': { pt: 'promotora principal', es: 'promotora principal', fr: 'promoteur principal' },
  'ran the competition': { pt: 'organizou o concurso', es: 'organizó el concurso', fr: 'a organisé le concours' },
  'none found yet': { pt: 'nada encontrado ainda', es: 'nada encontrado aún', fr: 'rien trouvé pour l\'instant' },
  'partner of': { pt: 'parceira de', es: 'socia de', fr: 'partenaire de' }, 'organised by': { pt: 'organizado por', es: 'organizado por', fr: 'organisé par' },
  lists: { pt: 'lista', es: 'incluye', fr: 'répertorie' }, 'presented with': { pt: 'apresentado com', es: 'presentado con', fr: 'présenté avec' },
  organiser: { pt: 'organizadora', es: 'organizadora', fr: 'organisateur' },
};

// The ecosystem data in a language. ctx.data is already localised (title_pt, title_es... replace title), so this
// adds the timeline keys and the link words. Where a translation has not landed yet, the English shows.
export function ecoIn(data, lang) {
  const E = data.ecosystem;
  const timeline = E.timeline.map(e => ({ ...e, key: String(e.t) }));
  const links = E.links.map(([a, b, l]) => [a, b, (LINK_WORDS[l] || {})[lang] ?? l]);
  return { timeline, nodes: E.nodes, links, places: E.places, sources: E.sources };
}

// The two working ideas (APPS in site-data.mjs) as menu links, in the page's language.
export const appLinks = (lang, esc, cls = '') => APPS.map(a => `<a class="${cls}" href="${esc(langPath(a.path, lang))}" data-app="${a.id}">${esc(a.name[lang] || a.name.en)}</a>`);

// Equirectangular projection, scaled by cos(37.2°), 1000 units per degree of latitude. Drawing only.
const LON0 = -9.1, LAT0 = 37.62, COS = Math.cos(37.2 * Math.PI / 180), K = 1000;
export const MAP = { w: 1593, h: 740, lon0: LON0, lat0: LAT0, kmPerUnit: 111.2 / K };
export const proj = ([lon, lat]) => [Math.round((lon - LON0) * COS * K * 10) / 10, Math.round((LAT0 - lat) * K * 10) / 10];

// A ring of [lon, lat] as an SVG path, optionally smoothed (Catmull-Rom to Bézier).
export function pathOf(ring, { closed = true, smooth = 0.5, project = proj } = {}) {
  const p = ring.map(project).filter((q, i, a) => i === 0 || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
  const f = q => `${Math.round(q[0] * 10) / 10},${Math.round(q[1] * 10) / 10}`;
  if (!smooth) return `M${p.map(f).join('L')}${closed ? 'Z' : ''}`;
  const n = p.length, at = i => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(p[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) * smooth / 3, p1[1] + (p2[1] - p0[1]) * smooth / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * smooth / 3, p2[1] - (p3[1] - p1[1]) * smooth / 3];
    d += `C${f(c1)} ${f(c2)} ${f(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}

// The outline from places.json split into land, coast and the Portugal-Spain border (the Guadiana mouth splits them).
export function outline(data) {
  const c = data.places.outline.countries; const pt = c.Portugal[0][0], es = c.Spain[0][0];
  const mouthP = pt.findIndex(q => q[0] === -7.4071), mouthS = es.findIndex(q => q[0] === -7.4071);
  return { portugal: pt, spain: es, coastPt: pt.slice(mouthP), coastEs: es.slice(0, mouthS + 1), border: pt.slice(0, mouthP + 1) };
}

// "12 Sep 2019" -> "2019-09-12"; "Sep 2025" -> "2025-09"; "Late 2025" -> "2025-Q4"; "28 Mar to 3 Apr 2022" -> "2022-03-28".
export function isoOf(when) {
  const M = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const pad = n => String(n).padStart(2, '0');
  const y = (when.match(/(\d{4})\s*$/) || [])[1];
  let m = when.match(/^(\d{1,2})\s+(?:to\s+\d{1,2}\s+)?([A-Za-z]{3})/);
  if (m) return `${y}-${pad(M[m[2].toLowerCase()])}-${pad(m[1])}`;
  m = when.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+to/); if (m) return `${y}-${pad(M[m[2].toLowerCase()])}-${pad(m[1])}`;
  m = when.match(/^([A-Za-z]{3})\s+\d{4}$/); if (m && M[m[1].toLowerCase()]) return `${y}-${pad(M[m[1].toLowerCase()])}`;
  if (/^late/i.test(when)) return `${y}-Q4`;
  return y;
}

// Where each timeline entry happened, as its own text says (keys are the entries' t values).
export const EVENT_PLACES = {
  '2019.7': ['Faro'], '2022.25': ['Faro', 'Loulé'], '2024.42': ['Faro'], '2024.8': ['Albufeira'], '2025.68': ['Lagos'],
  '2025.85': ['Lagos'], '2025.87': ['Lisboa'], '2025.97': ['Faro'], '2026.86': ['Portimão', 'Almancil', 'Lagos'],
};

// ---------- the Atlas ----------
const L = {
  en: {
    kicker: 'Algarve Evolution · The Atlas', skip: 'Skip the map, read the story', mapLabel: 'Map of the Algarve, with Algarve Evolution\'s places and timeline',
    layers: 'Layers', lEvents: 'Events', lProg: 'Programmes', lNet: 'ADI network', zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Show the whole region',
    approx: 'Approximate positions', km: '10 km', play: 'Play the timeline', pause: 'Pause', prev: 'Previous event', next: 'Next event', year: 'Year',
    close: 'Close', welcomeTitle: 'Where our work happens', welcome: 'Every marker is a place where our work has happened, with the source that reports it. Choose a place, switch layers, or play the timeline from 2018.',
    hint: 'Drag to move, pinch or scroll to zoom.', hq: 'Our base', muni: 'One of the 16 municipalities of the Algarve, all part of the Algarve Digital Innovators network.',
    eventsHere: 'Here on the timeline', progsHere: 'Programmes here', noPlace: 'no place given', future: 'Planned',
    sea: 'Atlantic Ocean', spain: 'Spain', region: 'Algarve', lisbon: 'Web Summit, Lisbon', toLisbon: 'to Lisbon',
    netTitle: 'Algarve Digital Innovators', netNote: 'Lines join neighbouring municipalities to show the network; they are not routes or borders.',
    figuresTitle: 'The key, in figures', figuresIntro: 'Our own figures, as our sources report them. Nobody has audited them; where two sources differ, we show both.',
    storyTitle: 'From a small group to an ecosystem', chronicle: 'The chronicle', chronicleIntro: 'Our timeline, from the ecosystem data behind the map.',
    gazetteer: 'Gazetteer', gazetteerIntro: 'The places on the map and what happened there.', municipalities: 'The 16 municipalities',
    pillarsTitle: 'Three pillars', partnersTitle: 'Who we work with', eventsTitle: 'Events we ran or co-ran', goalsNote: 'Targets, not results.',
    quoteBy: 'Executive director', ideasNote: 'Proposals made to us, built as working prototypes. Nothing in them is agreed yet.', open: 'Open',
    sourcesTitle: 'Sources', sourcesIntro: 'Every fact on this page links to one of these.', version: 'Version', madeBy: 'Map drawn from Natural Earth (public domain) via the outline in our data. Relief is drawn for effect, not survey data.',
    back: 'Back to the map', lat: 'N', lon: 'W',
    lgHq: 'Our base, Faro', lgPlace: 'A place in our story', lgMuni: 'Municipality (16)', lgEv: 'An event on the timeline', lgProg: 'Programmes, with how many', lgNet: 'The ADI network', lgBorder: 'Border with Spain',
    detail: 'Detail', municipality: 'Municipality', place: 'Place', about: 'about', from: '', to: 'to', lisbonName: 'Lisbon', typeface: 'Typeface: Cormorant Garamond (SIL OFL 1.1).',
    ctrlHint: 'Ctrl + scroll to zoom', nav: 'Menu', nMap: 'Map', nFig: 'Figures', nPillars: 'Programmes', nChron: 'Chronicle', nPlaces: 'Places', nIdeas: 'Working ideas',
    campus2: 'The Penha and Gambelas campuses.', campusP: 'The Portimão campus.', ed22F: 'First edition, 2022, with Loulé.', ed22L: 'First edition, 2022, with Faro.', ed24: 'The 2024 edition.', ed25: 'The 2025 edition.',
  },
  pt: {
    kicker: 'Algarve Evolution · O Atlas', skip: 'Saltar o mapa, ler a história', mapLabel: 'Mapa do Algarve, com os locais e a cronologia da Algarve Evolution',
    layers: 'Camadas', lEvents: 'Eventos', lProg: 'Programas', lNet: 'Rede ADI', zoomIn: 'Aproximar', zoomOut: 'Afastar', reset: 'Ver toda a região',
    approx: 'Posições aproximadas', km: '10 km', play: 'Reproduzir a cronologia', pause: 'Pausa', prev: 'Evento anterior', next: 'Evento seguinte', year: 'Ano',
    close: 'Fechar', welcomeTitle: 'Onde o nosso trabalho acontece', welcome: 'Cada marcador é um local onde o nosso trabalho aconteceu, com a fonte que o relata. Escolha um local, mude de camada ou reproduza a cronologia desde 2018.',
    hint: 'Arraste para mover, use dois dedos ou a roda para aproximar.', hq: 'A nossa sede', muni: 'Um dos 16 municípios do Algarve, todos parte da rede Algarve Digital Innovators.',
    eventsHere: 'Aqui, na cronologia', progsHere: 'Programas aqui', noPlace: 'sem local indicado', future: 'Previsto',
    sea: 'Oceano Atlântico', spain: 'Espanha', region: 'Algarve', lisbon: 'Web Summit, Lisboa', toLisbon: 'para Lisboa',
    netTitle: 'Algarve Digital Innovators', netNote: 'As linhas unem municípios vizinhos para mostrar a rede; não são percursos nem fronteiras.',
    figuresTitle: 'A legenda, em números', figuresIntro: 'Os nossos números, tal como as fontes os relatam. Ninguém os auditou; quando duas fontes diferem, mostramos as duas.',
    storyTitle: 'De um pequeno grupo a um ecossistema', chronicle: 'A crónica', chronicleIntro: 'A nossa cronologia, a partir dos dados do ecossistema por trás do mapa.',
    gazetteer: 'Índice de locais', gazetteerIntro: 'Os locais do mapa e o que lá aconteceu.', municipalities: 'Os 16 municípios',
    pillarsTitle: 'Três pilares', partnersTitle: 'Com quem trabalhamos', eventsTitle: 'Eventos que organizámos ou coorganizámos', goalsNote: 'Metas, não resultados.',
    quoteBy: 'Diretor executivo', ideasNote: 'Propostas que nos foram feitas, construídas como protótipos a funcionar. Nada nelas está ainda acordado.', open: 'Abrir',
    sourcesTitle: 'Fontes', sourcesIntro: 'Cada facto desta página tem ligação para uma destas fontes.', version: 'Versão', madeBy: 'Mapa desenhado a partir do Natural Earth (domínio público), pelo contorno dos nossos dados. O relevo é ilustrativo, não um levantamento.',
    back: 'Voltar ao mapa', lat: 'N', lon: 'O',
    lgHq: 'A nossa sede, Faro', lgPlace: 'Um local da nossa história', lgMuni: 'Município (16)', lgEv: 'Um evento da cronologia', lgProg: 'Programas, e quantos', lgNet: 'A rede ADI', lgBorder: 'Fronteira com Espanha',
    detail: 'Detalhe', municipality: 'Município', place: 'Localidade', about: 'cerca de', from: '', to: 'a', lisbonName: 'Lisboa', typeface: 'Tipo de letra: Cormorant Garamond (SIL OFL 1.1).',
    ctrlHint: 'Ctrl + roda do rato para aproximar', nav: 'Menu', nMap: 'Mapa', nFig: 'Números', nPillars: 'Programas', nChron: 'Crónica', nPlaces: 'Locais', nIdeas: 'Ideias a funcionar',
    campus2: 'Campi da Penha e de Gambelas.', campusP: 'Campus de Portimão.', ed22F: 'Primeira edição, 2022, com Loulé.', ed22L: 'Primeira edição, 2022, com Faro.', ed24: 'Edição de 2024.', ed25: 'Edição de 2025.',
  },
  es: {
    kicker: 'Algarve Evolution · El Atlas', skip: 'Saltar el mapa, leer la historia', mapLabel: 'Mapa del Algarve, con los lugares y la cronología de Algarve Evolution',
    layers: 'Capas', lEvents: 'Eventos', lProg: 'Programas', lNet: 'Red ADI', zoomIn: 'Acercar', zoomOut: 'Alejar', reset: 'Ver toda la región',
    approx: 'Posiciones aproximadas', km: '10 km', play: 'Reproducir la cronología', pause: 'Pausa', prev: 'Evento anterior', next: 'Evento siguiente', year: 'Año',
    close: 'Cerrar', welcomeTitle: 'Donde sucede nuestro trabajo', welcome: 'Cada marcador es un lugar donde ha tenido lugar nuestro trabajo, con la fuente que lo recoge. Elija un lugar, cambie de capa o reproduzca la cronología desde 2018.',
    hint: 'Arrastre para mover; pellizque o use la rueda para acercar.', hq: 'Nuestra sede', muni: 'Uno de los 16 municipios del Algarve, todos parte de la red Algarve Digital Innovators.',
    eventsHere: 'Aquí, en la cronología', progsHere: 'Programas aquí', noPlace: 'sin lugar indicado', future: 'Previsto',
    sea: 'Océano Atlántico', spain: 'España', region: 'Algarve', lisbon: 'Web Summit, Lisboa', toLisbon: 'a Lisboa',
    netTitle: 'Algarve Digital Innovators', netNote: 'Las líneas unen municipios vecinos para mostrar la red; no son rutas ni fronteras.',
    figuresTitle: 'La leyenda, en cifras', figuresIntro: 'Nuestras propias cifras, tal como las recogen nuestras fuentes. Nadie las ha auditado; cuando dos fuentes difieren, mostramos ambas.',
    storyTitle: 'De un pequeño grupo a un ecosistema', chronicle: 'La crónica', chronicleIntro: 'Nuestra cronología, a partir de los datos del ecosistema que hay detrás del mapa.',
    gazetteer: 'Índice de lugares', gazetteerIntro: 'Los lugares del mapa y lo que sucedió en ellos.', municipalities: 'Los 16 municipios',
    pillarsTitle: 'Tres pilares', partnersTitle: 'Con quién trabajamos', eventsTitle: 'Eventos que organizamos o coorganizamos', goalsNote: 'Metas, no resultados.',
    quoteBy: 'Director ejecutivo', ideasNote: 'Propuestas que nos han hecho, construidas como prototipos que funcionan. Nada en ellas está acordado todavía.', open: 'Abrir',
    sourcesTitle: 'Fuentes', sourcesIntro: 'Cada dato de esta página enlaza con una de estas fuentes.', version: 'Versión', madeBy: 'Mapa dibujado a partir de Natural Earth (dominio público), mediante el contorno de nuestros datos. El relieve es ilustrativo, no un levantamiento topográfico.',
    back: 'Volver al mapa', lat: 'N', lon: 'O',
    lgHq: 'Nuestra sede, Faro', lgPlace: 'Un lugar de nuestra historia', lgMuni: 'Municipio (16)', lgEv: 'Un evento de la cronología', lgProg: 'Programas, y cuántos', lgNet: 'La red ADI', lgBorder: 'Frontera con España',
    detail: 'Detalle', municipality: 'Municipio', place: 'Localidad', about: 'hacia el', from: 'del ', to: 'al', lisbonName: 'Lisboa', typeface: 'Tipografía: Cormorant Garamond (SIL OFL 1.1).',
    ctrlHint: 'Ctrl + rueda del ratón para acercar', nav: 'Menú', nMap: 'Mapa', nFig: 'Cifras', nPillars: 'Programas', nChron: 'Crónica', nPlaces: 'Lugares', nIdeas: 'Ideas en marcha',
    campus2: 'Los campus de Penha y Gambelas.', campusP: 'El campus de Portimão.', ed22F: 'Primera edición, 2022, con Loulé.', ed22L: 'Primera edición, 2022, con Faro.', ed24: 'La edición de 2024.', ed25: 'La edición de 2025.',
  },
  fr: {
    kicker: 'Algarve Evolution · L\'Atlas', skip: 'Passer la carte, lire l\'histoire', mapLabel: 'Carte de l\'Algarve, avec les lieux et la chronologie d\'Algarve Evolution',
    layers: 'Calques', lEvents: 'Événements', lProg: 'Programmes', lNet: 'Réseau ADI', zoomIn: 'Zoom avant', zoomOut: 'Zoom arrière', reset: 'Voir toute la région',
    approx: 'Positions approximatives', km: '10 km', play: 'Lire la chronologie', pause: 'Pause', prev: 'Événement précédent', next: 'Événement suivant', year: 'Année',
    close: 'Fermer', welcomeTitle: 'Là où notre travail se fait', welcome: 'Chaque repère est un lieu où notre travail a eu lieu, avec la source qui le rapporte. Choisissez un lieu, changez de calque ou lancez la chronologie depuis 2018.',
    hint: 'Faites glisser pour déplacer, pincez ou utilisez la molette pour zoomer.', hq: 'Notre siège', muni: 'L\'une des 16 communes de l\'Algarve, toutes membres du réseau Algarve Digital Innovators.',
    eventsHere: 'Ici, dans la chronologie', progsHere: 'Programmes ici', noPlace: 'lieu non précisé', future: 'Prévu',
    sea: 'Océan Atlantique', spain: 'Espagne', region: 'Algarve', lisbon: 'Web Summit, Lisbonne', toLisbon: 'vers Lisbonne',
    netTitle: 'Algarve Digital Innovators', netNote: 'Les lignes relient des communes voisines pour montrer le réseau. Ce ne sont ni des itinéraires ni des frontières.',
    figuresTitle: 'La légende, en chiffres', figuresIntro: 'Nos propres chiffres, tels que nos sources les rapportent. Personne ne les a audités. Quand deux sources diffèrent, nous montrons les deux.',
    storyTitle: 'D\'un petit groupe à un écosystème', chronicle: 'La chronique', chronicleIntro: 'Notre chronologie, à partir des données de l\'écosystème derrière la carte.',
    gazetteer: 'Index des lieux', gazetteerIntro: 'Les lieux de la carte et ce qui s\'y est passé.', municipalities: 'Les 16 communes',
    pillarsTitle: 'Trois piliers', partnersTitle: 'Avec qui nous travaillons', eventsTitle: 'Les événements que nous avons organisés ou coorganisés', goalsNote: 'Des objectifs, pas des résultats.',
    quoteBy: 'Directeur exécutif', ideasNote: 'Des propositions qui nous ont été faites, réalisées sous forme de prototypes qui fonctionnent. Rien n\'y est encore convenu.', open: 'Ouvrir',
    sourcesTitle: 'Sources', sourcesIntro: 'Chaque fait de cette page renvoie à l\'une de ces sources.', version: 'Version', madeBy: 'Carte tracée à partir de Natural Earth (domaine public), d\'après le contour de nos données. Le relief est illustratif, ce n\'est pas un relevé.',
    back: 'Retour à la carte', lat: 'N', lon: 'O',
    lgHq: 'Notre siège, Faro', lgPlace: 'Un lieu de notre histoire', lgMuni: 'Commune (16)', lgEv: 'Un événement de la chronologie', lgProg: 'Programmes, avec leur nombre', lgNet: 'Le réseau ADI', lgBorder: 'Frontière avec l\'Espagne',
    detail: 'Détail', municipality: 'Commune', place: 'Localité', about: 'vers le', from: 'du ', to: 'au', lisbonName: 'Lisbonne', typeface: 'Police de caractères\u00a0: Cormorant Garamond (SIL OFL 1.1).',
    ctrlHint: 'Ctrl + molette pour zoomer', nav: 'Menu', nMap: 'Carte', nFig: 'Chiffres', nPillars: 'Programmes', nChron: 'Chronique', nPlaces: 'Lieux', nIdeas: 'Idées en action',
    campus2: 'Les campus de Penha et de Gambelas.', campusP: 'Le campus de Portimão.', ed22F: 'Première édition, 2022, avec Loulé.', ed22L: 'Première édition, 2022, avec Faro.', ed24: 'L\'édition 2024.', ed25: 'L\'édition 2025.',
  },
};

// Hand-tuned label placement for the municipalities: [dx, dy, anchor] in screen pixels; pri 2 hides when zoomed out.
const MUNI_LABEL = {
  faro: [-12, 18, 'end'], olhao: [9, 15, 'start'], loule: [-9, -7, 'end'], 'sao-bras-de-alportel': [0, -10, 'middle'],
  silves: [0, -11, 'middle'], lagoa: [8, 15, 'start'], portimao: [-10, 17, 'end'], lagos: [-12, 18, 'end'], albufeira: [0, 22, 'middle'],
  'vila-do-bispo': [-2, 18, 'middle'], aljezur: [-9, 4, 'end'], monchique: [0, -14, 'middle'], tavira: [0, 22, 'middle'],
  'castro-marim': [-8, -6, 'end'], 'vila-real-de-santo-antonio': [-8, 14, 'end', 'Vila Real de|Santo António'], alcoutim: [-9, 4, 'end'],
};
const PLACE_LABEL = { Almancil: [10, 16, 'start'], Salir: [10, 4, 'start'] };
const PRI2 = new Set(['olhao', 'sao-bras-de-alportel', 'lagoa', 'silves', 'castro-marim', 'vila-real-de-santo-antonio', 'aljezur', 'vila-do-bispo']);

const slugOf = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function render({ lang, data, h, chrome }) {
  const { esc, t, cite } = h; const v = data.voice; const W = L[lang] || L.en;
  const E = ecoIn(data, lang); const O = outline(data);
  const munis = data.places.municipalities;
  const muniByName = new Map(munis.map(m => [m.name, m]));
  const placeByName = new Map(E.places.map(p => [p.name, p]));
  const where = name => name === 'Lisboa' ? proj([-8.97, 37.40]) : proj((placeByName.get(name) || muniByName.get(name)).ll);
  const evId = e => `ev-${e.key.replace('.', '-')}`;
  const placeId = name => `place-${slugOf(name)}`;
  const progs = Object.fromEntries(data.programmes.pillars.flatMap(p => p.programmes.map(g => [g.id, g])));
  const node = id => E.nodes.find(n => n.id === id);
  const evAt = name => E.timeline.filter(e => (EVENT_PLACES[e.key] || []).includes(name));

  // Programmes where the data states a place (ids into programmes.json, ecosystem nodes or events.json).
  const progName = id => t(progs[id].name);
  const PROG_PINS = [
    { at: 'Faro', items: [
      { name: progName('ualg-entrepreneurship'), note: W.campus2, src: progs['ualg-entrepreneurship'].sources },
      { name: progName('buildathons'), note: `${t(data.events.events[0].name)}, ${t(data.events.events[0].place)}.`, src: data.events.events[0].sources },
      { name: node('grow').label, note: node('grow').note, src: ['meetup'] },
      { name: node('aths').label, note: W.ed22F, src: ['econews22'] } ] },
    { at: 'Portimão', items: [{ name: progName('ualg-entrepreneurship'), note: W.campusP, src: progs['ualg-entrepreneurship'].sources }] },
    { at: 'Lagos', items: [
      { name: progName('algarve-digital-innovators'), note: E.timeline.find(e => e.key === '2025.68').text, src: ['adi'] },
      { name: node('aths').label, note: W.ed25, src: data.events.events[2].sources } ] },
    { at: 'Albufeira', items: [{ name: node('aths').label, note: W.ed24, src: ['aths24'] }] },
    { at: 'Loulé', items: [{ name: node('aths').label, note: W.ed22L, src: ['econews22'] }] },
    { at: 'Salir', items: [{ name: node('grow').label, note: placeByName.get('Salir').note, src: ['meetup'] }] },
    { at: 'Monchique', items: [{ name: node('grow').label, note: placeByName.get('Monchique').note, src: ['meetup'] }] },
  ];

  // ---- the map ----
  const coastD = pathOf(O.coastPt, { closed: false }) + pathOf(O.coastEs, { closed: false });
  const landPt = pathOf(O.portugal), landEs = pathOf(O.spain);
  const grat = [];
  for (let lon = -9; lon <= -7.2; lon += 0.25) { const [x] = proj([lon, 37]); grat.push(`<path d="M${x},-400V1200"/>`); }
  for (let lat = 37; lat <= 37.6; lat += 0.25) { const [, y] = proj([-9, lat]); grat.push(`<path d="M-400,${y}H2000"/>`); }
  const dm = d => { const a = Math.abs(d), deg = Math.floor(a + 1e-9), min = Math.round((a - deg) * 60); return `${deg}°${min ? String(min).padStart(2, '0') + '′' : ''}`; };
  const gratLabels = [];
  for (let lon = -8.75; lon <= -7.4; lon += 0.25) { const [x] = proj([lon, 37]); gratLabels.push(`<text x="${x + 5}" y="${proj([0, 36.952])[1]}">${dm(lon)} ${W.lon}</text>`); }
  for (let lat = 37; lat <= 37.5; lat += 0.25) { const [, y] = proj([-9, lat]); gratLabels.push(`<text x="${proj([-9.08, 0])[0]}" y="${y - 6}">${dm(lat)} ${W.lat}</text>`); }

  // ADI network: each municipality joined to its two or three nearest neighbours (a drawing of the network, not roads).
  const mp = munis.map(m => ({ ...m, p: proj(m.ll) }));
  const edges = new Set();
  for (const a of mp) {
    mp.filter(b => b !== a).map(b => [b, Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1])]).sort((x, y) => x[1] - y[1]).slice(0, 3)
      .forEach(([b, d]) => { if (d < 260) edges.add([a.id, b.id].sort().join('|')); });
  }
  const mpById = new Map(mp.map(m => [m.id, m]));
  const netLines = [...edges].map(e => { const [a, b] = e.split('|').map(id => mpById.get(id).p); const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.12;
    return `<path d="M${a}Q${mx},${my} ${b}"/>`; }).join('');

  const mk = (cls, [x, y], inner, attrs = '') => `<g class="mk ${cls}" transform="translate(${x} ${y})"${attrs}><g class="mk-s">${inner}</g></g>`;
  const label = (text, dx, dy, anchor, cls = '', lines) => lines
    ? `<text class="lbl ${cls}" x="${dx}" y="${dy}" text-anchor="${anchor}">${lines.split('|').map((l, i) => `<tspan x="${dx}" dy="${i ? 12 : 0}">${esc(l)}</tspan>`).join('')}</text>`
    : `<text class="lbl ${cls}" x="${dx}" y="${dy}" text-anchor="${anchor}">${esc(text)}</text>`;
  const ecoNames = new Set(E.places.map(p => p.name));

  const muniMarks = mp.filter(m => !ecoNames.has(m.name)).map(m => { const [dx, dy, an, lines] = MUNI_LABEL[m.id] || [8, 4, 'start'];
    return `<a href="#m-${m.id}" class="mk-link" data-card="muni-${m.id}" aria-label="${esc(m.name)}">${mk(`mk-muni${PRI2.has(m.id) ? ' pri2' : ''}`, m.p,
      `<circle r="9" class="hit"/><circle r="3.6" class="dot"/>${label(m.name, dx, dy, an, '', lines)}`)}</a>`; }).join('');

  const placeMarks = E.places.map(p => { const m = munis.find(x => x.name === p.name); const [dx, dy, an] = m ? (MUNI_LABEL[m.id] || [10, 4, 'start']) : (PLACE_LABEL[p.name] || [10, 4, 'start']);
    const hq = p.hq; const big = hq ? 1.25 : 1;
    const inner = hq
      ? `<circle r="22" class="hit"/><circle r="17" class="hq-pulse"/><circle r="11" class="hq-ring"/><path class="hq-star" d="M0,-8L2.2,-2.2L8,0L2.2,2.2L0,8L-2.2,2.2L-8,0L-2.2,-2.2Z"/>${label(p.name, -16, 6, 'end', 'lbl-place lbl-hq')}<text class="lbl-tag" x="-16" y="21" text-anchor="end">${esc(W.hq)}</text>`
      : `<circle r="14" class="hit"/><circle r="7.5" class="pl-ring"/><circle r="3.2" class="pl-dot"/>${label(p.name, dx * big, dy, an, 'lbl-place')}`;
    return `<a href="#${placeId(p.name)}" class="mk-link" data-card="${placeId(p.name)}" aria-label="${esc(p.name)}${hq ? `, ${esc(W.hq)}` : ''}">${mk(`mk-place${hq ? ' mk-hq' : ''}`, proj(p.ll), inner)}</a>`; }).join('');

  const faroP = where('Faro');
  const evMarks = E.timeline.flatMap(e => (EVENT_PLACES[e.key] || []).map((name, i) => {
    const p = where(name); const lis = name === 'Lisboa';
    const arc = name === 'Faro' ? '' : (() => { const dx = p[0] - faroP[0], dy = p[1] - faroP[1]; const d = Math.hypot(dx, dy); const mx = (p[0] + faroP[0]) / 2 + dy * 0.18, my = (p[1] + faroP[1]) / 2 - Math.abs(dx) * 0.18 - d * 0.08;
      return `<path class="ev-arc" data-t="${e.t}" d="M${faroP}Q${mx.toFixed(1)},${my.toFixed(1)} ${p}" pathLength="1"/>`; })();
    return { arc, mark: `<a href="#${evId(e)}" class="mk-link ev-link" data-card="${evId(e)}" data-t="${e.t}" tabindex="-1" aria-label="${esc(e.when)}: ${esc(e.title)}">${mk('mk-ev', p,
      `<circle r="12" class="ev-ring"/><circle r="4" class="ev-dot"/>${lis ? `<text class="lbl lbl-lis" x="-8" y="-18">↑ ${esc(W.lisbon)}</text>` : ''}`, ` data-t="${e.t}" data-i="${i}"`)}</a>` };
  }));

  const PIN_OFF = { Salir: [-14, -14], Monchique: [17, 2] };
  const progMarks = PROG_PINS.map(pp => { const p = where(pp.at); const [ox, oy] = PIN_OFF[pp.at] || [13, -13]; return `<a href="#prog-${slugOf(pp.at)}" class="mk-link" data-card="prog-${slugOf(pp.at)}" aria-label="${esc(W.progsHere)}: ${esc(pp.at)}">${mk('mk-prog', p,
    `<g transform="translate(${ox} ${oy})"><circle r="12" class="hit"/><rect x="-8" y="-8" width="16" height="16" rx="3" transform="rotate(45)" class="pg-d"/><text class="pg-n" y="4" text-anchor="middle">${pp.items.length}</text></g>`)}</a>`; }).join('');

  const netMuni = mp.map(m => `<circle cx="${m.p[0]}" cy="${m.p[1]}" r="16" class="net-halo"/>`).join('');

  const svg = `<svg class="atl-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(W.mapLabel)}" tabindex="0">
<defs>
  <linearGradient id="sea" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#cfe2e1"/><stop offset=".55" stop-color="#b6d3d6"/><stop offset="1" stop-color="#9fc2c9"/></linearGradient>
  <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#16323a" stop-opacity="0"/><stop offset="1" stop-color="#16323a" stop-opacity=".22"/></radialGradient>
  <clipPath id="landclip"><path d="${landPt}"/><path d="${landEs}"/></clipPath>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0V7" stroke="#8a7a62" stroke-width=".8" stroke-opacity=".28"/></pattern>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect x="-2000" y="-2000" width="${MAP.w + 4000}" height="${MAP.h + 4000}" fill="url(#sea)"/>
<g class="grat">${grat.join('')}</g>
<g class="ripples" fill="none">
  <path d="${coastD}" stroke-width="44" stroke-opacity=".10"/><path d="${coastD}" stroke-width="26" stroke-opacity=".14"/>
  <path d="${coastD}" stroke-width="13" stroke-opacity=".22"/><path d="${coastD}" stroke-width="5" stroke-opacity=".35"/>
</g>
<path d="${landPt}" class="land-shadow" filter="url(#soft)" transform="translate(3 6)"/>
<path d="${landPt}" class="land"/><path d="${landEs}" class="land"/>
<image href="/d/atlas/relief.webp" x="-80" y="-360" width="1760" height="1120" clip-path="url(#landclip)" preserveAspectRatio="none"/>
<path d="${landEs}" class="spain"/><path d="${landEs}" fill="url(#hatch)"/>
<path d="${pathOf(O.border, { closed: false, smooth: 0.3 })}" class="border"/>
<path d="${coastD}" class="coast"/>
<g class="grat-l">${gratLabels.join('')}</g>
<text class="sea-l" x="${proj([-8.12, 36.9])[0]}" y="${proj([0, 36.9])[1]}" text-anchor="middle">${esc(W.sea)}</text>
<text class="spain-l" transform="translate(${proj([-7.405, 37.43]).join(' ')}) rotate(-78)" text-anchor="middle">${esc(W.spain)}</text>
<text class="region-l" x="${proj([-8.12, 37.4])[0]}" y="${proj([0, 37.4])[1]}" text-anchor="middle">${esc(W.region)}</text>
<g class="layer layer-net" data-layer="net"><g class="net-lines" fill="none">${netLines}</g>${netMuni}</g>
<g class="layer layer-events" data-layer="events">${evMarks.map(x => x.arc).join('')}</g>
<g class="layer layer-events" data-layer="events">${evMarks.map(x => x.mark).join('')}</g>
<g class="base">${muniMarks}${placeMarks}</g>
<g class="layer layer-prog" data-layer="prog">${progMarks}</g>
<rect x="-2000" y="-2000" width="${MAP.w + 4000}" height="${MAP.h + 4000}" fill="url(#vig)" pointer-events="none" class="vig"/>
</svg>`;

  // ---- cards (story below the map; the panel shows a copy of the chosen one) ----
  const evCard = e => `<article class="card ev-card${e.future ? ' is-future' : ''}" id="${evId(e)}" data-t="${e.t}">
  <p class="card-k"><time>${esc(e.when)}</time>${e.future ? ` · <span class="tag">${esc(W.future)}</span>` : ''}${(EVENT_PLACES[e.key] || []).length ? ` · ${esc(EVENT_PLACES[e.key].map(n => n === 'Lisboa' ? W.lisbonName : n).join(', '))}` : ` · <span class="np">${esc(W.noPlace)}</span>`}</p>
  <h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${e.stat ? `<p class="stat">${esc(e.stat)}</p>` : ''}${cite(e.src)}</article>`;
  const placeCard = p => { const evs = evAt(p.name); return `<article class="card place-card" id="${placeId(p.name)}">
  <p class="card-k">${p.hq ? esc(W.hq) : esc(munis.some(m => m.name === p.name) ? W.municipality : W.place)} · ${p.ll[1].toFixed(2)}° ${W.lat}, ${Math.abs(p.ll[0]).toFixed(2)}° ${W.lon}</p>
  <h3>${esc(p.name)}</h3><p>${esc(p.note)}</p>${cite(p.src)}
  ${evs.length ? `<p class="card-sub">${esc(W.eventsHere)}</p><ul class="mini">${evs.map(e => `<li><a href="#${evId(e)}" data-card="${evId(e)}"><time>${esc(e.when)}</time> ${esc(e.title)}</a></li>`).join('')}</ul>` : ''}</article>`; };
  const muniCard = m => { const evs = evAt(m.name); return `<template id="tpl-muni-${m.id}"><article class="card muni-card"><p class="card-k">${esc(W.municipality)} · ${m.ll[1].toFixed(2)}° ${W.lat}, ${Math.abs(m.ll[0]).toFixed(2)}° ${W.lon}</p><h3>${esc(m.name)}</h3><p>${esc(W.muni)}</p>${cite(['adi', data.places.municipalities_source])}
  ${evs.length ? `<p class="card-sub">${esc(W.eventsHere)}</p><ul class="mini">${evs.map(e => `<li><a href="#${evId(e)}" data-card="${evId(e)}"><time>${esc(e.when)}</time> ${esc(e.title)}</a></li>`).join('')}</ul>` : ''}</article></template>`; };
  const progCards = PROG_PINS.map(pp => `<template id="tpl-prog-${slugOf(pp.at)}"><article class="card prog-card" id="prog-${slugOf(pp.at)}"><p class="card-k">${esc(W.progsHere)}</p><h3>${esc(pp.at)}</h3>
  <ul class="plist">${pp.items.map(i => `<li><strong>${esc(i.name)}</strong> <span>${esc(i.note)}</span>${cite(i.src)}</li>`).join('')}</ul></article></template>`).join('');
  const adiProg = progs['algarve-digital-innovators'];
  const netCard = `<template id="tpl-net"><article class="card net-card" id="net"><p class="card-k">${esc(W.lNet)}</p><h3>${esc(W.netTitle)}</h3><p>${esc(t(adiProg.summary))}</p>${cite(adiProg.sources)}<p>${esc(E.nodes.find(n => n.id === 'adi').note)}</p>${cite('adi')}<p class="muted">${esc(W.netNote)}</p></article></template>`;
  const welcome = `<div class="card welcome" id="welcome"><p class="card-k">${esc(W.kicker)}</p><h3>${esc(W.welcomeTitle)}</h3><p>${esc(W.welcome)}</p><ul class="legend"><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="9" fill="#fffaf0" stroke="#a8431c" stroke-width="2.2"/><path fill="#a8431c" d="M0,-6L1.7,-1.7L6,0L1.7,1.7L0,6L-1.7,1.7L-6,0L-1.7,-1.7Z"/></svg>${esc(W.lgHq)}</li><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="7" fill="rgba(168,67,28,.14)" stroke="#a8431c" stroke-width="1.6"/><circle r="3" fill="#a8431c"/></svg>${esc(W.lgPlace)}</li><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="3.6" fill="#fffaf0" stroke="#2c3a3e" stroke-width="1.5"/></svg>${esc(W.lgMuni)}</li><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="9" fill="rgba(208,96,42,.12)" stroke="#d0602a" stroke-width="2"/><circle r="3.4" fill="#d0602a"/></svg>${esc(W.lgEv)}</li><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><rect x="-6" y="-6" width="12" height="12" rx="2" transform="rotate(45)" fill="#fffaf0" stroke="#6a467c" stroke-width="1.8"/></svg>${esc(W.lgProg)}</li><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-10,4Q0,-6 10,4" fill="none" stroke="#1d6a74" stroke-width="1.8" stroke-dasharray="4 3"/></svg>${esc(W.lgNet)}</li><li><svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-10,0H10" stroke="#7b5a36" stroke-width="1.6" stroke-dasharray="5 2 1.5 2"/></svg>${esc(W.lgBorder)}</li></ul><p class="muted js-only">${esc(W.hint)}</p></div>`;

  // Timeline scrubber ticks
  const T0 = 2018, T1 = 2027.5; const pc = x => ((x - T0) / (T1 - T0) * 100).toFixed(2);
  const years = []; for (let y = 2018; y <= 2027; y++) years.push(`<span class="yr" style="left:${pc(y)}%">${y}</span>`);
  const pips = E.timeline.map((e, i) => `<button type="button" class="pip${e.future ? ' fut' : ''}" style="left:${pc(e.t)}%" data-i="${i}" data-t="${e.t}" tabindex="-1" aria-hidden="true" title="${esc(e.when)}: ${esc(e.title)}"></button>`).join('');

  const figures = data.figures.figures.filter(f => f.id !== 'targets-2032');
  const sym = ['◆', '●', '▲', '■', '◉'];
  const q = data.people.quotes[0]; const person = data.people.people.find(p => p.id === q.by);
  const partners = E.nodes.filter(n => n.kind === 'partner' || n.id === 'amal');
  const uniqPartners = [...new Map(partners.map(n => [n.id, n])).values()];
  const S = (id, title, inner, cls = '') => `<section class="st ${cls}" id="${id}" aria-labelledby="h-${id}"><div class="st-in"><h2 id="h-${id}">${title}</h2>${inner}</div></section>`;

  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(t(meta.name))}: ${esc(t(v.tagline))} | Algarve Evolution</title>
<meta name="description" content="${esc(t(v.hero_lede))}">
<meta name="theme-color" content="#f3eee2">
${chrome.head}
<link rel="preload" href="/d/atlas/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/d/atlas/atlas.css">
</head>
<body class="atl">
${chrome.banner}
<a class="skip" href="#story">${esc(W.skip)}</a>
<nav class="atl-nav" aria-label="${esc(W.nav)}">
  <a class="atl-brand" href="#map"><svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0,-11L2.6,-2.6L11,0L2.6,2.6L0,11L-2.6,2.6L-11,0L-2.6,-2.6Z"/></svg>Algarve Evolution <span>${esc(t(meta.name))}</span></a>
  <div class="atl-nav-sec">${[['figures', W.nFig], ['pillars', W.nPillars], ['chronicle', W.nChron], ['gazetteer', W.nPlaces]].map(([id, l]) => `<a href="#${id}">${esc(l)}</a>`).join('')}</div>
  <div class="atl-nav-ideas" role="group" aria-label="${esc(W.nIdeas)}"><span class="atl-nav-k" aria-hidden="true">${esc(W.nIdeas)}</span>${appLinks(lang, esc, 'atl-app').join('')}</div>
</nav>
<section class="atl-map show-events" id="map" aria-labelledby="atl-title" data-t0="${T0}" data-t1="${T1}" data-lang="${lang}" data-ctrl-hint="${esc(W.ctrlHint)}">
  <div class="atl-stage">${svg}</div>
  <header class="atl-head">
    <p class="kicker">${esc(W.kicker)}</p>
    <h1 id="atl-title">${esc(t(meta.tagline))}</h1>
    <p class="atl-sub">${esc(t(v.tagline))}</p>
  </header>
  <div class="atl-tools">
    <div class="atl-layers" role="group" aria-label="${esc(W.layers)}">
      <button type="button" class="chip" data-layer-btn="events" aria-pressed="true"><span class="sw sw-ev"></span>${esc(W.lEvents)}</button>
      <button type="button" class="chip" data-layer-btn="prog" aria-pressed="false"><span class="sw sw-pg"></span>${esc(W.lProg)}</button>
      <button type="button" class="chip" data-layer-btn="net" aria-pressed="false"><span class="sw sw-net"></span>${esc(W.lNet)}</button>
    </div>
  </div>
  <div class="atl-zoom" role="group" aria-label="Zoom">
    <button type="button" data-zoom="in" aria-label="${esc(W.zoomIn)}" title="${esc(W.zoomIn)}">+</button>
    <button type="button" data-zoom="out" aria-label="${esc(W.zoomOut)}" title="${esc(W.zoomOut)}">−</button>
    <button type="button" data-zoom="reset" aria-label="${esc(W.reset)}" title="${esc(W.reset)}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
  </div>
  <svg class="atl-rose" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="34" fill="rgba(251,248,241,.7)" stroke="#5f6c6e" stroke-width=".8"/><circle r="28" fill="none" stroke="#5f6c6e" stroke-width=".5" stroke-dasharray="1.5 2.5"/>
    <path d="M0,-44L6,-6L0,0Z" fill="#1c2a2f"/><path d="M0,-44L-6,-6L0,0Z" fill="#a8431c"/><path d="M0,44L6,6L0,0Z" fill="#a8431c"/><path d="M0,44L-6,6L0,0Z" fill="#1c2a2f"/>
    <path d="M44,0L6,-6L0,0Z" fill="#a8431c"/><path d="M44,0L6,6L0,0Z" fill="#1c2a2f"/><path d="M-44,0L-6,6L0,0Z" fill="#a8431c"/><path d="M-44,0L-6,-6L0,0Z" fill="#1c2a2f"/>
    <text y="-46" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-weight="700" font-size="14" fill="#1c2a2f">N</text></svg>
  <div class="atl-scale" aria-hidden="true"><span class="bar"></span><span class="txt">${esc(W.km)} · ${esc(W.approx)}</span></div>
  <aside class="atl-panel" aria-label="${esc(W.detail)}" tabindex="-1">
    <button type="button" class="atl-close" aria-label="${esc(W.close)}">×</button>
    <div class="atl-grab" aria-hidden="true"></div>
    <div class="atl-panel-body" aria-live="polite">${welcome}</div>
  </aside>
  <div class="atl-scrub">
    <button type="button" class="sc-play" aria-label="${esc(W.play)}" data-play="${esc(W.play)}" data-pause="${esc(W.pause)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5l11 7-11 7z"/><path class="i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>
    <button type="button" class="sc-step" data-step="-1" aria-label="${esc(W.prev)}">‹</button>
    <div class="sc-track-wrap">
      <div class="sc-now"><span class="sc-year">2018 → 2027</span><span class="sc-title">${esc(W.play)}</span></div>
      <div class="sc-track"><div class="sc-fill"></div>${years.join('')}${pips}
        <input type="range" class="sc-range" min="${T0}" max="${T1}" step="0.01" value="${T1}" aria-label="${esc(W.year)}"></div>
    </div>
    <button type="button" class="sc-step" data-step="1" aria-label="${esc(W.next)}">›</button>
  </div>
  <div hidden>${progCards}${netCard}${munis.filter(m => !ecoNames.has(m.name)).map(muniCard).join('')}</div>
</section>

<main id="story" class="story">
  <section class="st st-intro" aria-labelledby="h-intro"><div class="st-in">
    <p class="kicker">Algarve Evolution</p>
    <h2 id="h-intro">${esc(t(v.tagline))}</h2>
    <p class="lede">${esc(t(v.hero_lede))}</p>
    <p>${esc(t(v.mission))}</p>
    <p>${esc(t(v.story_intro))}</p>${cite(v.story_sources)}
  </div></section>

  ${S('figures', esc(W.figuresTitle), `<p class="intro">${esc(W.figuresIntro)}</p><ul class="key">${figures.map((f, i) => `<li id="fig-${f.id}"><span class="key-sym" aria-hidden="true">${sym[i % sym.length]}</span><div><strong>${esc(t(f.value))}</strong><span>${esc(t(f.label))}</span>${f.note ? `<em>${esc(t(f.note))}</em>` : ''}${cite(f.sources)}</div></li>`).join('')}</ul>`)}

  <section class="st st-goals" id="goals" aria-labelledby="h-goals"><div class="st-in">
    <h2 id="h-goals">${esc(t(v.goals_title))}</h2>
    <ol class="goals">${v.goals.map(g => `<li><strong>${esc(g.value)}</strong><span>${esc(t(g.label))}</span></li>`).join('')}</ol>
    <p class="note">${esc(t(v.goals_note))}</p>${cite(v.goals_sources)}
    <figure class="quote"><blockquote><p>${esc(t(q.text))}</p></blockquote><figcaption><strong>${esc(person.name)}</strong>, ${esc(t(person.role))} · <time datetime="${q.date}">${esc(h.date(q.date))}</time>${q.translation_note?.[lang] ? ` · <span class="tnote">${esc(q.translation_note[lang])}</span>` : ''}${cite(q.sources)}</figcaption></figure>
  </div></section>

  ${S('pillars', esc(W.pillarsTitle), `<p class="intro">${esc(t(v.pillars_intro))}</p><div class="pillars">${data.programmes.pillars.map((p, i) => `<section class="pillar" aria-labelledby="pl-${p.id}"><p class="pillar-n">${['I', 'II', 'III'][i]}</p><h3 id="pl-${p.id}">${esc(t(p.name))}</h3><ul>${p.programmes.map(g => `<li id="prog-${g.id}"><h4>${esc(t(g.name))}</h4><p>${esc(t(g.summary))}</p>${cite(g.sources)}</li>`).join('')}</ul></section>`).join('')}</div>`)}

  ${S('chronicle', esc(W.chronicle), `<p class="intro">${esc(W.chronicleIntro)}</p><div class="chron">${E.timeline.map(evCard).join('')}</div>`, 'st-chron')}

  ${S('gazetteer', esc(W.gazetteer), `<p class="intro">${esc(W.gazetteerIntro)}</p><div class="gaz">${E.places.map(placeCard).join('')}</div>
    <h3 class="sub">${esc(W.municipalities)}</h3><p class="intro">${esc(W.muni)}</p>${cite(['adi', data.places.municipalities_source])}<ul class="munis">${munis.map(m => `<li id="m-${m.id}"><strong>${esc(m.name)}</strong> <span>${m.ll[1].toFixed(2)}° ${W.lat}, ${Math.abs(m.ll[0]).toFixed(2)}° ${W.lon}</span></li>`).join('')}</ul>`, 'st-gaz')}

  ${S('partners', esc(W.partnersTitle), `<p class="intro">${esc(t(v.network_intro))}</p>${cite(['adi', 'psn'])}<ul class="partners">${uniqPartners.map(n => `<li><strong>${esc(n.label)}</strong><span>${esc(n.note)}</span>${cite(n.src)}</li>`).join('')}</ul>`)}

  ${S('events', esc(W.eventsTitle), `<ol class="evlist">${data.events.events.map(e => `<li id="event-${e.id}"><p class="card-k"><time datetime="${e.start}">${e.approximate ? `${esc(W.about)} ` : ''}${e.end ? esc(W.from) : ''}${esc(h.date(e.start))}${e.end ? ` ${esc(W.to)} ${esc(h.date(e.end))}` : ''}</time> · ${esc(t(e.place))}</p><h3>${esc(t(e.name))}</h3><p>${esc(t(e.summary))}</p>${cite(e.sources)}</li>`).join('')}</ol>`)}

  ${S('join', esc(t(v.join_title)), `<ol class="join">${v.join.map(j => `<li>${esc(t(j))}</li>`).join('')}</ol>${cite(v.join_sources)}`, 'st-join')}

  ${S('ideas', esc(t(v.try_title)), `<p class="intro">${esc(t(v.try_intro))}</p><div class="ideas">${v.apps.map(a => { return `<a class="idea" href="${esc(langPath(a.href, lang))}"><span class="tag">${esc(h.words.proposal)}</span><strong>${esc(t(a.name))}</strong><span>${esc(t(a.summary))}</span><span class="go">${esc(W.open)} →</span></a>`; }).join('')}</div>${cite(data.proposals.proposals.filter(p => v.apps.some(a => a.id === p.id)).flatMap(p => p.sources))}`, 'st-ideas')}

  <section class="st st-sources" id="sources" aria-labelledby="h-sources"><div class="st-in">
    <h2 id="h-sources">${esc(W.sourcesTitle)}</h2><p class="intro">${esc(W.sourcesIntro)}</p>
    <!-- data:sources -->
  </div></section>
  <p class="back"><a href="#map">↑ ${esc(W.back)}</a></p>
</main>
<footer class="foot"><div class="st-in">
  <p>${esc(t(v.banner))}</p><p>${esc(t(v.footer_disclosure))}</p>${cite('https://newsroom.sgit.ai/articles/joining-algarve-evolution.html')}
  <p class="muted">${esc(W.madeBy)} ${esc(W.typeface)} ${esc(W.version)} ${esc(chrome.version)}</p>
</div></footer>
<script src="/d/atlas/atlas.js" defer></script>
${chrome.foot}
</body>
</html>`;
}
