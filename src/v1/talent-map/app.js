// Our talent map: the interactive layer. The page is complete without it (rendered at build time); this adds
// the map filter, search, matching, the needs board, the consent preview and the simulated pay-per-contact meter.
// Everything stays in this browser: nothing is sent anywhere. Owner: sites-dev@AgentiCCells.dinis. Apache-2.0.
(async () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const I = JSON.parse($('#tm-i18n').textContent), L = I.lang, W = I.w;
  const LOCALE = { en: 'en-GB', pt: 'pt-PT', es: 'es-ES', fr: 'fr-FR' }[L] || 'en-GB';
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = v => (v && typeof v === 'object' ? (v[L] ?? v.en) : (v ?? ''));
  const euro = n => (L === 'en' ? `€${n.toFixed(2)}` : `${n.toFixed(2).replace('.', ',')} €`);
  const inLang = o => (L !== 'en' && o[L]) || ''; // the organisation's description in this language, if we have it
  const day = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const town = id => I.towns[id] || id;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = el => el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const pl = (n, one, many) => (n === 1 ? one : many);
  const C = L === 'fr' ? '\u00a0: ' : ': '; // French puts a space before a colon
  const XS = {
    pt: {
      org: n => `${n} ${pl(n, 'organização', 'organizações')}`, ppl: n => `${n} ${pl(n, 'entrada aprovada, simulada', 'entradas aprovadas, simuladas')}`, in: t => `em ${t}`,
      best: q => `As melhores correspondências para «${q}»`, ranked: (a, b) => `${a} ${pl(a, 'organização', 'organizações')} e ${b} ${pl(b, 'pessoa simulada', 'pessoas simuladas')}, ordenadas pelo que pediu, pelo tipo de ajuda e pelo concelho.`,
      read: 'Percebemos', kindOf: 'tipo de ajuda', where: 'onde', words: 'palavras',
      whyKind: k => `Tipo: ${k}`, whyRole: r => `Oferece: ${r}`, whyTown: t => `Em ${t}`, whyRegion: 'Atua em todo o Algarve', whyWords: w => `Menciona ${w.map(x => `«${x}»`).join(', ')}`, whyPartner: 'Trabalha connosco', whyBuilds: 'Faz software ou aplicações',
      more: 'Mostrar mais', post: 'Publicar isto como necessidade', clear: 'Limpar', none: 'Ainda não há correspondências. Experimente menos palavras, outro concelho, ou publique-o como necessidade para que a pessoa certa o encontre.',
      third: 'Isto é a terceira proposta a funcionar: uma empresa cuja primeira aplicação precisa de ajuda, ligada aos fornecedores da região.',
      c: { funding: 'financiamento ou investimento', mentor: 'mentoria', space: 'espaço ou incubadora', talent: 'serviços ou talento', learn: 'ensino ou investigação', community: 'uma comunidade', public: 'uma entidade pública', app: 'ajuda com uma aplicação' },
      sim: 'Simulado',
      close: 'Fechar', original: 'Texto original (inglês)', inEn: ' (em inglês)', aiNote: 'Ligação à IA (nota do PrompTugal.news, em inglês)', also: t => `Também em ${t}`, alsoRegion: 'Também em todo o Algarve', reach: 'Como contactar (canal público)', partner: 'Trabalha connosco',
      their: 'A página deles', source: 'Fonte', from: d => `Da pesquisa pública do PrompTugal.news, lida a ${d}. Abrir o perfil custou 3 cêntimos de crédito simulado; as ligações para fora são gratuitas.`,
      amount: 'Montante', date: 'Data', town: 'Concelho', sector: 'Setor', rate: 'Preço ou ticket', langs: 'Línguas',
      simNote: 'Inventada para este protótipo. No mapa real, esta entrada só apareceria depois de a pessoa a aprovar.',
      show: 'Mostrar contacto', paid: 'Pago do seu crédito, depois de ver o perfil. Quem está no mapa nunca paga. Simulado: nada é cobrado.',
      revealed: 'apresentado pelo mapa', revealedNote: 'Pagou 0,50 € de crédito simulado. Nada foi cobrado e nada foi enviado.', broke: 'O seu crédito acabou. Junte 5 € de crédito simulado para continuar.', topup: 'Adicionar 5 € (simulado)',
      status: { yes: 'Aprovou a sua entrada (simulado)', no: 'Disse que não: não é publicada', wait: 'Ainda não respondeu: não é publicada' },
      answer: 'Resposta neste navegador', okSay: 'Aprovado, só neste navegador. No mapa real, a entrada fica publicada com a data de hoje guardada como consentimento, e o mesmo link permite retirá-la.',
      noSay: 'Entendido. Não será publicada, e os seus dados ficam onde os deu.', changeSay: 'Obrigado. No mapa real as alterações voltam à nossa caixa de correio e enviamos-lhe uma nova pré-visualização para aprovar.',
      offer: 'O que oferece', send: 'Enviar alterações', mine: 'Só neste navegador', del: 'Apagar', posted: 'Publicada, só neste navegador. Nada foi enviado. Veja as correspondências acima.',
      reset: 'Repor o que este navegador guardou (necessidades, respostas)', resetDone: 'Reposto.',
      ch: { ask: q => `Pesquisa: ${q}`, town: t => `Concelho: ${t}`, kind: k => `Filtro: ${k}`, word: q => `Filtro: ${q}`, layer: l => `Ver: ${l}`, org: n => `Perfil: ${n}`, person: n => `Perfil: ${n}`, contact: n => `Contacto: ${n}`, need: 'Correspondências de uma necessidade', post: 'Publicou uma necessidade', more: 'Mais resultados', consent: a => `Pré-visualização: ${a}`, preview: n => `Pré-visualização de ${n}` },
    },
    es: {
      org: n => `${n} ${pl(n, 'organización', 'organizaciones')}`, ppl: n => `${n} ${pl(n, 'ficha aprobada, simulada', 'fichas aprobadas, simuladas')}`, in: t => `en ${t}`,
      best: q => `Mejores coincidencias para «${q}»`, ranked: (a, b) => `${a} ${pl(a, 'organización', 'organizaciones')} y ${b} ${pl(b, 'persona simulada', 'personas simuladas')}, ordenadas por lo que pidió, el tipo de ayuda y el municipio.`,
      read: 'Entendimos', kindOf: 'tipo de ayuda', where: 'dónde', words: 'palabras',
      whyKind: k => `Tipo: ${k}`, whyRole: r => `Ofrece: ${r}`, whyTown: t => `En ${t}`, whyRegion: 'Trabaja en todo el Algarve', whyWords: w => `Menciona ${w.map(x => `«${x}»`).join(', ')}`, whyPartner: 'Trabaja con nosotros', whyBuilds: 'Hace software o aplicaciones',
      more: 'Mostrar más', post: 'Publicar esto como necesidad', clear: 'Borrar', none: 'Aún no hay coincidencias. Pruebe con menos palabras u otro municipio, o publíquelo como necesidad para que la persona adecuada le encuentre.',
      third: 'Esta es la tercera propuesta en marcha: una empresa cuya primera aplicación necesita ayuda, puesta en contacto con los proveedores de la región.',
      c: { funding: 'financiación o inversión', mentor: 'mentoría', space: 'un espacio o una incubadora', talent: 'servicios o talento', learn: 'educación o investigación', community: 'una comunidad', public: 'una entidad pública', app: 'ayuda con una aplicación' },
      sim: 'Simulado',
      close: 'Cerrar', original: 'Texto original (inglés)', inEn: ' (en inglés)', aiNote: 'Relación con la IA (nota de PrompTugal.news, en inglés)', also: t => `También en ${t}`, alsoRegion: 'También en todo el Algarve', reach: 'Cómo contactar (canal público)', partner: 'Trabaja con nosotros',
      their: 'Su página', source: 'Fuente', from: d => `De la investigación pública de PrompTugal.news, leída el ${d}. Abrir el perfil costó 3 céntimos de crédito simulado; los enlaces externos son gratis.`,
      amount: 'Importe', date: 'Fecha', town: 'Municipio', sector: 'Sector', rate: 'Tarifa o ticket', langs: 'Idiomas',
      simNote: 'Inventada para este prototipo. En el mapa real, esta ficha solo aparecería después de que la persona la aprobara.',
      show: 'Mostrar contacto', paid: 'Se paga de su crédito, después de ver el perfil. Quien está en el mapa nunca paga. Simulado: no se cobra nada.',
      revealed: 'presentado por el mapa', revealedNote: 'Pagó 0,50 € de crédito simulado. No se cobró nada y no se envió nada.', broke: 'Se le ha acabado el crédito. Añada 5 € de crédito simulado para seguir.', topup: 'Añadir 5 € (simulado)',
      status: { yes: 'Aprobó su ficha (simulado)', no: 'Dijo que no: no se publica', wait: 'Aún no ha respondido: no se publica' },
      answer: 'Respuesta en este navegador', okSay: 'Aprobado, solo en este navegador. En el mapa real, la ficha se publica con la fecha de hoy guardada como consentimiento, y el mismo enlace permite retirarla.',
      noSay: 'Entendido. No se le publicará, y sus datos se quedan donde los dio.', changeSay: 'Gracias. En el mapa real, sus cambios vuelven a nuestro buzón y le enviamos una vista previa corregida para que la apruebe.',
      offer: 'Lo que ofrece', send: 'Enviar cambios', mine: 'Solo en este navegador', del: 'Borrar', posted: 'Publicada, solo en este navegador. No se envió nada. Sus coincidencias están arriba.',
      reset: 'Restablecer lo que guardó este navegador (necesidades, respuestas)', resetDone: 'Restablecido.',
      ch: { ask: q => `Búsqueda: ${q}`, town: t => `Municipio: ${t}`, kind: k => `Filtro: ${k}`, word: q => `Filtro: ${q}`, layer: l => `Ver: ${l}`, org: n => `Perfil: ${n}`, person: n => `Perfil: ${n}`, contact: n => `Contacto: ${n}`, need: 'Coincidencias de una necesidad', post: 'Publicó una necesidad', more: 'Más resultados', consent: a => `Vista previa: ${a}`, preview: n => `Vista previa de ${n}` },
    },
    fr: {
      org: n => `${n} ${pl(n, 'organisation', 'organisations')}`, ppl: n => `${n} ${pl(n, 'fiche approuvée, simulée', 'fiches approuvées, simulées')}`, in: t => `à ${t}`,
      best: q => `Meilleures correspondances pour « ${q} »`, ranked: (a, b) => `${a} ${pl(a, 'organisation', 'organisations')} et ${b} ${pl(b, 'personne simulée', 'personnes simulées')}, classées selon votre demande, le type d'aide et la commune.`,
      read: 'Nous avons compris', kindOf: 'type d\'aide', where: 'où', words: 'mots',
      whyKind: k => `Type : ${k}`, whyRole: r => `Propose : ${r}`, whyTown: t => `À ${t}`, whyRegion: 'Agit dans tout l\'Algarve', whyWords: w => `Mentionne ${w.map(x => `« ${x} »`).join(', ')}`, whyPartner: 'Travaille avec nous', whyBuilds: 'Fait du logiciel ou des applications',
      more: 'Afficher plus', post: 'Publier ceci comme besoin', clear: 'Effacer', none: 'Pas encore de correspondance. Essayez avec moins de mots ou une autre commune, ou publiez-le comme besoin pour que la bonne personne vous trouve.',
      third: 'C\'est la troisième proposition en action : une entreprise dont la première application a besoin d\'aide, mise en relation avec les prestataires de la région.',
      c: { funding: 'financement ou investissement', mentor: 'mentorat', space: 'un espace ou un incubateur', talent: 'services ou talents', learn: 'enseignement ou recherche', community: 'une communauté', public: 'un organisme public', app: 'de l\'aide pour une application' },
      sim: 'Simulé',
      close: 'Fermer', original: 'Texte original (anglais)', inEn: ' (en anglais)', aiNote: 'Lien avec l\'IA (note de PrompTugal.news, en anglais)', also: t => `Aussi à ${t}`, alsoRegion: 'Aussi dans tout l\'Algarve', reach: 'Comment les contacter (canal public)', partner: 'Travaille avec nous',
      their: 'Leur page', source: 'Source', from: d => `Issu des recherches publiques de PrompTugal.news, lues le ${d}. Ouvrir le profil a coûté 3 centimes de crédit simulé ; les liens externes sont gratuits.`,
      amount: 'Montant', date: 'Date', town: 'Commune', sector: 'Secteur', rate: 'Tarif ou ticket', langs: 'Langues',
      simNote: 'Inventée pour ce prototype. Dans la vraie carte, cette fiche n\'apparaîtrait qu\'après l\'accord de la personne.',
      show: 'Voir le contact', paid: 'Payé sur votre crédit, après avoir vu le profil. Les personnes inscrites ne paient jamais. Simulé : rien n\'est débité.',
      revealed: 'mis en relation par la carte', revealedNote: 'Vous avez payé 0,50 € de crédit simulé. Rien n\'a été débité et rien n\'a été envoyé.', broke: 'Votre crédit est épuisé. Ajoutez 5 € de crédit simulé pour continuer.', topup: 'Ajouter 5 € (simulé)',
      status: { yes: 'A approuvé sa fiche (simulé)', no: 'A dit non : non publiée', wait: 'N\'a pas encore répondu : non publiée' },
      answer: 'Réponse dans ce navigateur', okSay: 'Approuvé, dans ce navigateur seulement. Dans la vraie carte, la fiche est publiée avec la date du jour conservée comme consentement, et le même lien permet de la retirer.',
      noSay: 'Entendu. Votre fiche ne sera pas publiée, et vos données restent là où vous les avez confiées.', changeSay: 'Merci. Dans la vraie carte, vos modifications reviennent à notre boîte aux lettres et nous vous envoyons un aperçu corrigé à approuver.',
      offer: 'Ce que vous proposez', send: 'Envoyer les modifications', mine: 'Seulement dans ce navigateur', del: 'Supprimer', posted: 'Publié, dans ce navigateur seulement. Rien n\'a été envoyé. Ses correspondances sont ci-dessus.',
      reset: 'Réinitialiser ce que ce navigateur a gardé (besoins, réponses)', resetDone: 'Réinitialisé.',
      ch: { ask: q => `Recherche : ${q}`, town: t => `Commune : ${t}`, kind: k => `Filtre : ${k}`, word: q => `Filtre : ${q}`, layer: l => `Voir : ${l}`, org: n => `Profil : ${n}`, person: n => `Profil : ${n}`, contact: n => `Contact : ${n}`, need: 'Correspondances d\'un besoin', post: 'A publié un besoin', more: 'Plus de résultats', consent: a => `Aperçu : ${a}`, preview: n => `Aperçu pour ${n}` },
    },
    en: {
      org: n => `${n} ${pl(n, 'organisation', 'organisations')}`, ppl: n => `${n} ${pl(n, 'approved listing', 'approved listings')}, simulated`, in: t => `in ${t}`,
      best: q => `Best matches for “${q}”`, ranked: (a, b) => `${a} ${pl(a, 'organisation', 'organisations')} and ${b} simulated ${pl(b, 'person', 'people')}, ranked by what you asked for, the kind of help and the town.`,
      read: 'We read', kindOf: 'kind of help', where: 'where', words: 'words',
      whyKind: k => `Kind: ${k}`, whyRole: r => `Offers: ${r}`, whyTown: t => `In ${t}`, whyRegion: 'Works across the Algarve', whyWords: w => `Mentions ${w.map(x => `“${x}”`).join(', ')}`, whyPartner: 'Works with us', whyBuilds: 'Builds software or apps',
      more: 'Show more', post: 'Post this as a need', clear: 'Clear', none: 'No match yet. Try fewer words or another town, or post it as a need so the right person finds you.',
      third: 'This is the third proposal at work: a business whose first app needs help, matched with the region\'s providers.',
      c: { funding: 'funding or investment', mentor: 'mentoring', space: 'a space or incubator', talent: 'services or talent', learn: 'education or research', community: 'a community', public: 'a public body', app: 'help with an app' },
      sim: 'Simulated',
      close: 'Close', original: '', inEn: '', aiNote: 'Link to AI (PrompTugal.news note)', also: t => `Also in ${t}`, alsoRegion: 'Across the Algarve too', reach: 'How to reach them (public channel)', partner: 'Works with us',
      their: 'Their page', source: 'Source', from: d => `From PrompTugal.news public research, read on ${d}. Opening this profile cost 3 cents of simulated credit; links out are free.`,
      amount: 'Amount', date: 'Date', town: 'Town', sector: 'Sector', rate: 'Rate or ticket', langs: 'Languages',
      simNote: 'Invented for this prototype. In the real map, this listing would appear only after the person approved it.',
      show: 'Show contact', paid: 'Paid from your credit, after you have seen the profile. Listed people never pay. Simulated: nothing is charged.',
      revealed: 'introduced by the map', revealedNote: 'You paid €0.50 of simulated credit. Nothing was charged and nothing was sent.', broke: 'Your credit is used up. Add €5 of simulated credit to carry on.', topup: 'Add €5 (simulated)',
      status: { yes: 'Approved their listing (simulated)', no: 'Said no: not listed', wait: 'Has not answered yet: not listed' },
      answer: 'Answer in this browser', okSay: 'Approved, in this browser only. In the real map the listing goes live with today\'s date kept as the consent, and the same link withdraws it.',
      noSay: 'Understood. You will not be listed, and your details stay where you gave them.', changeSay: 'Thank you. In the real map your changes come back to our mailbox, and we send you a corrected preview to approve.',
      offer: 'What you offer', send: 'Send changes', mine: 'Only in this browser', del: 'Delete', posted: 'Posted, in this browser only. Nothing was sent. Its matches are above.',
      reset: 'Reset what this browser has kept (posted needs, answers)', resetDone: 'Reset.',
      ch: { ask: q => `Search: ${q}`, town: t => `Town: ${t}`, kind: k => `Filter: ${k}`, word: q => `Filter: ${q}`, layer: l => `Show: ${l}`, org: n => `Profile: ${n}`, person: n => `Profile: ${n}`, contact: n => `Contact: ${n}`, need: 'Matches for a need', post: 'Posted a need', more: 'More results', consent: a => `Consent preview: ${a}`, preview: n => `Preview for ${n}` },
    },
  };
  const X = XS[L] || XS.en;
  // The shared simulated wallet (/v1/assets/credit.js): every action costs a few cents, after the value. pay() is false
  // when the credit has run out (the wallet then offers a simulated top-up) and the action stops.
  const PRICE = { ask: 2, filter: 1, profile: 3, contact: 50, need: 2, post: 10, consent: 1, more: 1 };
  const short = s => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > 48 ? `${s.slice(0, 47)}…` : s; };
  const pay = (cents, label) => (window.AECredit ? window.AECredit.charge(cents, short(label)) : true);

  // State kept in this browser only.
  const KEY = 'tm-state-v1';
  const fresh = () => ({ unlocked: {}, consent: {}, edits: {}, posted: [] });
  let S = fresh();
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  let O, P, N;
  try {
    [O, P, N] = await Promise.all(['organisations', 'people', 'needs'].map(f => fetch(`/v1/talent-map/data/${f}.json`).then(r => { if (!r.ok) throw new Error(f); return r.json(); })));
  } catch { return; } // The page still works as rendered.
  const orgs = O.organisations, people = P.people, needs = N.needs;
  const byOrg = new Map(orgs.map(o => [o.id, o])), byPerson = new Map(people.map(p => [p.id, p]));
  const listed = p => (S.consent[p.id] ? S.consent[p.id] === 'yes' : p.approved);
  const pv = p => ({ ...p, offer: S.edits[p.id]?.offer ? { en: S.edits[p.id].offer, [L]: S.edits[p.id].offer } : p.offer, rate: S.edits[p.id]?.rate ? { en: S.edits[p.id].rate, [L]: S.edits[p.id].rate } : p.rate });


  // ---------- Explore: filters, map, list ----------
  const F = { layer: 'org', q: '', kinds: new Set(), roles: new Set(), town: '' };
  const orgCards = $$('.tm-org'), alsoLinks = $$('.tm-also-a'), groups = $$('.tm-group'), personCards = $$('.tm-person:not(.tm-preview)', $('#tm-list-people'));
  const bubbles = $$('.tm-bub'), townChips = $$('.tm-town'), kindOpts = $$('#tm-f-kinds .tm-kopt'), roleOpts = $$('#tm-f-roles .tm-kopt');
  const qOk = s => !F.q || F.q.split(/\s+/).every(w => s.includes(w));
  const small = matchMedia('(max-width: 40rem)');
  const radius = n => (small.matches ? (n ? 13 + Math.sqrt(n) * 6.4 : 8) : (n ? 9 + Math.sqrt(n) * 4.6 : 6));
  small.addEventListener('change', () => apply());
  $('.tm-layer').hidden = false; $('#tm-list-org').classList.add('is-on');

  function setBubble(b, n) {
    const id = b.dataset.town; b.classList.toggle('is-zero', !n); b.classList.toggle('is-on', F.town === id);
    if (F.town === id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    b.setAttribute('aria-label', `${town(id)}: ${n}`);
    if (id === 'algarve') { b.querySelector('.tm-bub-rn').textContent = n; return; }
    const r = radius(n), x = +b.dataset.x, y = +b.dataset.y, c = b.querySelector('.tm-bub-c'), l = b.querySelector('.tm-bub-l');
    c.setAttribute('r', r.toFixed(1)); c.style.r = `${r.toFixed(1)}px`; b.querySelector('.tm-bub-n').textContent = n || '';
    const side = b.dataset.side, lines = +b.dataset.lines || 1, dx = +b.dataset.dx || 0;
    const [lx, ly] = side === 'b' ? [dx, r + 26] : side === 't' ? [dx, -r - 10 - (lines - 1) * 24] : side === 'l' ? [-r - 8 + dx, 8 - (lines - 1) * 12] : [r + 8 + dx, 8 - (lines - 1) * 12];
    l.setAttribute('transform', `translate(${(x + lx).toFixed(1)} ${(y + ly).toFixed(1)})`);
  }

  function apply() {
    const org = F.layer === 'org';
    const tally = {}, kindTally = {}, roleTally = {};
    let shown = new Set();
    if (org) {
      const kOk = el => !F.kinds.size || F.kinds.has(el.dataset.kind);
      for (const o of orgs) { // counts per town (ignoring the town filter) and per kind (ignoring the kind filter)
        const s = byOrgSearch.get(o.id);
        if (!qOk(s)) continue;
        if (!F.kinds.size || F.kinds.has(o.kind)) for (const tw of o.towns) tally[tw] = (tally[tw] || 0) + 1;
        if (!F.town || o.towns.includes(F.town)) kindTally[o.kind] = (kindTally[o.kind] || 0) + 1;
      }
      for (const g of groups) {
        const inTown = !F.town || g.dataset.town === F.town;
        let any = false;
        for (const c of $$('.tm-org', g)) { const ok = inTown && kOk(c) && qOk(c.dataset.s); c.hidden = !ok; if (ok) { any = true; shown.add(c.dataset.id); } }
        const also = $$('.tm-also-a', g); let anyAlso = false;
        for (const a of also) { const ok = inTown && kOk(a) && qOk(a.dataset.s); a.hidden = !ok; if (ok) { anyAlso = true; if (F.town) shown.add(a.dataset.id); } }
        const ap = $('.tm-also', g); if (ap) ap.hidden = !anyAlso;
        g.hidden = !(any || anyAlso);
      }
      kindOpts.forEach(k => { const n = kindTally[k.dataset.kind] || 0; k.querySelector('b').textContent = n; k.classList.toggle('is-zero', !n); });
      const mx = Math.max(1, ...Object.values(kindTally)); kindOpts.forEach(k => { k.querySelector('.tm-kbar i').style.width = `${Math.round(100 * (kindTally[k.dataset.kind] || 0) / mx)}%`; });
      $('#tm-count').textContent = X.org(shown.size) + where();
    } else {
      for (const c of personCards) {
        const p = byPerson.get(c.dataset.id); const base = listed(p) && qOk(c.dataset.s);
        if (base && (!F.roles.size || p.roles.some(r => F.roles.has(r)))) tally[p.town] = (tally[p.town] || 0) + 1;
        if (base && (!F.town || p.town === F.town)) p.roles.forEach(r => { roleTally[r] = (roleTally[r] || 0) + 1; });
        const ok = base && (!F.town || p.town === F.town) && (!F.roles.size || p.roles.some(r => F.roles.has(r)));
        c.hidden = !ok; if (ok) shown.add(p.id);
      }
      roleOpts.forEach(k => { const n = roleTally[k.dataset.role] || 0; k.querySelector('b').textContent = n; k.classList.toggle('is-zero', !n); });
      $('#tm-count').textContent = X.ppl(shown.size) + where();
    }
    bubbles.forEach(b => setBubble(b, tally[b.dataset.town] || 0));
    townChips.forEach(a => { const n = tally[a.dataset.town] || 0; a.querySelector('b').textContent = n; a.classList.toggle('is-on', F.town === a.dataset.town); a.classList.toggle('is-zero', !n); if (F.town === a.dataset.town) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    $('#tm-ftown').value = F.town;
    $('#tm-clear').hidden = !(F.q || F.town || (org ? F.kinds.size : F.roles.size));
  }
  const where = () => (!F.town ? '' : F.town === 'algarve' ? ` · ${town(F.town)}` : ` ${X.in(town(F.town))}`);
  const byOrgSearch = new Map(orgCards.map(c => [c.dataset.id, c.dataset.s]));
  for (const o of orgs) if (!byOrgSearch.has(o.id)) byOrgSearch.set(o.id, fold(o.name));

  // Choosing a town or a kind costs 1 cent; clearing a choice is free.
  const pickTown = (id, scroll) => {
    if (F.town !== id && !pay(PRICE.filter, X.ch.town(town(id)))) return;
    F.town = F.town === id ? '' : id; apply(); if (scroll && innerWidth < 992) go($('#tm-count'));
  };
  bubbles.forEach(b => b.addEventListener('click', e => { e.preventDefault(); pickTown(b.dataset.town, true); }));
  townChips.forEach(a => a.addEventListener('click', e => { e.preventDefault(); pickTown(a.dataset.town, false); }));
  $('#tm-ftown').addEventListener('change', e => { const v = e.target.value; if (v && !pay(PRICE.filter, X.ch.town(town(v)))) { e.target.value = F.town; return; } F.town = v; apply(); });
  // Typing filters as you go; the search is paid once, when you stop typing for a moment.
  let fqTimer = 0, fqPaid = '';
  $('#tm-fq').addEventListener('input', e => {
    F.q = fold(e.target.value).trim(); apply(); clearTimeout(fqTimer);
    fqTimer = setTimeout(() => { if (F.q.length > 1 && F.q !== fqPaid) { fqPaid = F.q; pay(PRICE.filter, X.ch.word(e.target.value)); } }, 900);
  });
  const toggle = (set, e, label) => {
    if (e.target.checked && !pay(PRICE.filter, X.ch.kind(label))) { e.target.checked = false; return; }
    e.target.checked ? set.add(e.target.value) : set.delete(e.target.value); apply();
  };
  kindOpts.forEach(k => k.querySelector('input').addEventListener('change', e => toggle(F.kinds, e, I.kinds[e.target.value].label)));
  roleOpts.forEach(k => k.querySelector('input').addEventListener('change', e => toggle(F.roles, e, I.roles[e.target.value])));
  $('#tm-clear').addEventListener('click', () => { F.q = ''; F.town = ''; F.kinds.clear(); F.roles.clear(); $('#tm-fq').value = ''; $$('.tm-filters input[type=checkbox]').forEach(i => { i.checked = false; }); apply(); });
  const tabs = $$('.tm-layer [role=tab]');
  const setLayer = layer => {
    F.layer = layer;
    tabs.forEach(t => { const on = t.dataset.layer === layer; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    $('#tm-list-org').classList.toggle('is-on', layer === 'org'); $('#tm-list-people').classList.toggle('is-on', layer === 'people');
    $('#tm-f-kinds').hidden = layer !== 'org'; $('#tm-f-roles').hidden = layer === 'org';
    $('.tm-bub-region').style.display = layer === 'org' ? '' : 'none';
    $('.tm-town[data-town=algarve]').hidden = layer !== 'org';
    $$('option[value=algarve]', $('#tm-ftown')).forEach(o => { o.hidden = layer !== 'org'; });
    if (layer !== 'org' && F.town === 'algarve') F.town = '';
    apply();
  };
  tabs.forEach(t => {
    const choose = x => { if (F.layer !== x.dataset.layer && !pay(PRICE.filter, X.ch.layer(x.firstChild.textContent.trim()))) return false; setLayer(x.dataset.layer); return true; };
    t.addEventListener('click', () => choose(t));
    t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const o = tabs.find(x => x !== t); o.focus(); choose(o); } });
  });
  tabs[1].tabIndex = -1;

  // People cards reflect consent answers given in this browser.
  function drawPeople() {
    for (const c of personCards) {
      const p = byPerson.get(c.dataset.id), q = pv(p), st = S.consent[p.id] || (p.approved ? 'yes' : 'wait');
      c.classList.toggle('tm-wait', !listed(p));
      c.querySelector('.tm-what').textContent = T(q.offer);
      c.querySelector('.tm-place').textContent = `${town(p.town)} · ${T(p.sector)} · ${T(q.rate)}`;
      c.querySelector('.tm-src').textContent = `${X.status[st]} · ${p.langs}`;
    }
    const n = people.filter(listed).length; $('#tm-tab-people b').textContent = n;
  }

  // ---------- Profile dialog ----------
  const dlg = $('#tm-dialog'), din = $('#tm-d-in');
  const kindChip = o => `<span class="tm-kind k-${o.kind}">${esc(I.kinds[o.kind].label)}</span>`;
  const box = (h, body, en) => `<div class="tm-d-box"><h3>${h}${en ? X.inEn : ''}</h3>${body}</div>`;
  function openOrg(o) {
    const text = inLang(o) || o.what;
    din.innerHTML = `<button type="button" class="tm-d-close" aria-label="${X.close}">×</button>
<div class="tm-card-top">${kindChip(o)}${o.us ? `<span class="tm-flag tm-us">${esc(W.us)}</span>` : o.partner ? `<span class="tm-flag">${X.partner}</span>` : ''}</div>
<h2 id="tm-d-title">${esc(o.name)}</h2><p class="tm-d-place">${esc(o.towns.map(town).join(' · '))}</p>
<p${inLang(o) || L === 'en' ? '' : ' lang="en"'}>${esc(text)}</p>
${inLang(o) ? `<details><summary>${X.original}</summary><p lang="en">${esc(o.what)}</p></details>` : ''}
${o.amount || o.date ? `<div class="tm-d-kv">${o.amount ? `<div><span>${X.amount}</span>${esc(o.amount)}</div>` : ''}${o.date ? `<div><span>${X.date}</span>${esc(day(o.date))}</div>` : ''}</div>` : ''}
${o.ai ? box(X.aiNote, `<p lang="en">${esc(o.ai)}</p>`) : ''}
${(o.also || []).map(a => box(a.town === 'algarve' ? X.alsoRegion : X.also(town(a.town)), `<p lang="en">${esc(a.what)}</p><p class="tm-d-note">${esc(X.source)}${C}<a href="${esc(a.source_url)}" rel="noopener">${esc(host(a.source_url))}</a>, ${esc(day(a.read_on))}</p>`, true)).join('')}
${(o.contacts || []).map(c => box(X.reach, `<p lang="en">${esc(c.channel || c.label)}</p><p class="tm-d-note"><a href="${esc(c.url)}" rel="noopener">${esc(host(c.url))}</a>, ${esc(day(c.read_on))}</p>`, true)).join('')}
${o.partner ? box(X.partner, `<p lang="en">${esc(o.partner.note)}</p><p class="tm-d-note">${esc(X.source)}${C}<a href="${esc(o.partner.source_url)}" rel="noopener">${esc(host(o.partner.source_url))}</a></p>`, true) : ''}
<div class="tm-d-links"><a href="${esc(o.url)}" rel="noopener">${X.their}${C}${esc(host(o.url))} ↗</a>${o.url !== o.source_url ? `<a href="${esc(o.source_url)}" rel="noopener">${X.source}: ${esc(host(o.source_url))} ↗</a>` : ''}</div>
<p class="tm-d-note">${esc(X.from(day(o.read_on)))}</p>`;
    show();
  }
  function openPerson(p0, paid) {
    const p = pv(p0), un = S.unlocked[p.id], st = S.consent[p.id] || (p.approved ? 'yes' : 'wait');
    din.innerHTML = `<button type="button" class="tm-d-close" aria-label="${X.close}">×</button>
<div class="tm-card-top"><span class="tm-sim">${X.sim}</span>${p.roles.map(r => `<span class="tm-role r-${r}">${esc(I.roles[r])}</span>`).join('')}</div>
<div class="tm-person-h"><span class="tm-avatar" aria-hidden="true">${esc(p.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><h2 id="tm-d-title">${esc(p.name)}</h2></div>
<p class="tm-d-note">${X.simNote}</p>
<div class="tm-d-kv"><div><span>${X.town}</span>${esc(town(p.town))}</div><div><span>${X.sector}</span>${esc(T(p.sector))}</div><div><span>${X.rate}</span>${esc(T(p.rate))}</div><div><span>${X.langs}</span>${esc(p.langs)}</div></div>
<p>${esc(T(p.offer))}</p>
<div id="tm-contact">${un ? `<div class="tm-reveal">${esc(fold(p.name.split(' ')[0]))}@example.pt · ${X.revealed}</div><p class="tm-d-note">${X.revealedNote}</p>`
      : `<button type="button" class="tm-btn tm-btn-main" id="tm-unlock">${X.show} · ${euro(PRICE.contact / 100)}</button><p class="tm-d-note">${X.paid}</p>`}</div>
<p class="tm-d-note">${X.status[st]}</p>`;
    const b = $('#tm-unlock', din);
    if (b) b.onclick = () => {
      // Out of credit: the wallet's own top-up sits behind this modal dialog, so offer the (simulated) top-up here too.
      if (!pay(PRICE.contact, X.ch.contact(p.name))) {
        if (!$('#tm-broke', din)) $('#tm-contact', din).insertAdjacentHTML('beforeend', `<p class="tm-d-note tm-broke" id="tm-broke" role="alert">${X.broke} <button type="button" class="tm-btn tm-btn-ghost" id="tm-topup">${X.topup}</button></p>`);
        $('#tm-topup', din)?.addEventListener('click', () => { window.AECredit?.topUp(500); $('#tm-broke', din)?.remove(); b.focus(); });
        return;
      }
      S.unlocked[p.id] = 1; save(); openPerson(p0, true);
      $('#tm-d-in .tm-reveal')?.setAttribute('tabindex', '-1'); $('#tm-d-in .tm-reveal')?.focus();
    };
    show();
  }
  function show() { $('.tm-d-close', din).onclick = () => dlg.close(); if (!dlg.open) dlg.showModal(); din.scrollTop = 0; dlg.scrollTop = 0; }
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-open]'); if (!a) return;
    const [kind, id] = a.dataset.open.split(':');
    // Opening a profile costs 3 cents; the full card is already on the page, so without credit the link still scrolls to it.
    if (kind === 'org' && byOrg.has(id)) { e.preventDefault(); if (pay(PRICE.profile, X.ch.org(byOrg.get(id).name))) openOrg(byOrg.get(id)); }
    if (kind === 'person' && byPerson.has(id)) { e.preventDefault(); if (pay(PRICE.profile, X.ch.person(byPerson.get(id).name))) openPerson(byPerson.get(id)); }
  });

  // ---------- Matching ----------
  // Requests are understood in English, Portuguese, Spanish and French: accents are folded away (diseñador -> disenador),
  // filler words are dropped, and each word is matched with its synonyms in the four languages.
  const STOP = new Set(('i a an the for in at on of to my our we us me need needs want wants looking look someone somebody with and or who can could help please find is are be it this that from near by some any get now new would like just first our your their more than ' +
    'um uma uns umas o os as de do da dos das em no na nos nas para por com e ou que preciso precisamos procuro procuramos quero queremos meu minha nosso nossa alguem ajuda ajudar ja tem temos ter primeira primeiro sua seu mais ' +
    'un una unos unas el la los las del al y en con sin necesito necesitamos necesita necesitan busco buscamos buscando quiero queremos mi mis nuestro nuestra nuestros nuestras alguien ayudar tengo tenemos tiene tienen hay ya primer primera su sus mas ahora nuevo nueva encontrar favor es son estoy estamos ' +
    'je j nous on une des le les du d l au aux et ou pour avec dans sur mon ma mes notre nos votre vos quelqu quelque cherche cherchons chercher besoin faut voudrais voudrions veux voulons aimerais aide aider trouver qui est sont deja premiere premier maintenant plus nouveau nouvelle doit doivent servir il elle ce cette ces').split(' '));
  // Phrases that only mean "I am looking for" (so "recherche" there is not research, and "ai" is not AI).
  const PHRASES = /\s(?:j ai besoin d(?:e|un|une)?|j ai besoin|je recherche|nous recherchons|on recherche|il me faut|il nous faut|me hace falta|nos hace falta|estoy buscando|estamos buscando)\s/g;
  const TOWN_ALIAS = { loule: ['quarteira', 'vilamoura', 'almancil'], 'vila-do-bispo': ['sagres'], portimao: ['alvor'], lagoa: ['ferragudo', 'carvoeiro'], 'vila-real-de-santo-antonio': ['vrsa', 'monte gordo'], faro: ['gambelas', 'penha'], olhao: ['pechao', 'marim'], 'sao-bras-de-alportel': ['sao bras'] };
  const TOWNS = Object.keys(I.towns).filter(id => id !== 'algarve').flatMap(id => [fold(I.towns[id]), ...(TOWN_ALIAS[id] || [])].map(a => [a, id])).sort((a, b) => b[0].length - a[0].length);
  const CONCEPTS = [
    { id: 'funding', w: 'fund funding funds funded grant grants invest investor investors investment money capital seed preseed angel angels finance financing equity vc venture financiamento financiar investimento investidor investidores subsidio subvencao incentivo incentivos ' +
      'financiacion financiar inversion inversor inversora inversores subvencion subvenciones ayudas semilla dinero fondos ' +
      'financement financements financer investissement investisseur investisseuse investisseurs subvention subventions argent amorcage levee fonds', kinds: ['funding', 'support'], roles: ['investor'] },
    { id: 'mentor', w: 'mentor mentors mentoring mentorship advice adviser advisor coach coaching guidance fundraising mentoria mentores mentora conselho orientacao ' +
      'asesoramiento asesor asesora consejo orientacion ' +
      'mentore mentorat conseil conseils conseiller accompagnement parrain parrainage', kinds: ['incubation'], roles: ['mentor'] },
    { id: 'space', w: 'incubator incubators incubation accelerator acceleration office offices space desk cowork coworking workspace incubadora incubadoras incubacao aceleradora aceleracao escritorio espaco ninho ' +
      'incubacion aceleracion oficina oficinas espacio vivero ' +
      'incubateur incubateurs accelerateur acceleration bureau bureaux espace pepiniere locaux', kinds: ['incubation'] },
    { id: 'talent', w: 'designer designers developer developers dev programmer engineer freelancer freelance hire hiring consultant consultants marketing lawyer legal accountant agency studio contractor service services provider providers programador programadora advogado advogada consultor consultora contratar servicos servico fornecedor fornecedores ' +
      'disenador disenadora disenadores desarrollador desarrolladora desarrolladores programadores ingeniero ingeniera autonomo abogado abogada contable agencia servicio servicios proveedor proveedores ' +
      'graphiste developpeur developpeuse developpeurs programmeur programmeuse ingenieur ingenieure independant embaucher recruter consultante avocat avocate comptable agence prestataire prestataires fournisseur', kinds: ['company'], roles: ['talent'] },
    { id: 'learn', w: 'university research researcher lab laboratory student students course courses training study school science universidade investigacao investigador laboratorio estudante estudantes curso cursos formacao escola ciencia ' +
      'universidad investigacion investigadora estudiantes formacion escuela ' +
      'universite recherche chercheur chercheuse laboratoire etudiant etudiante etudiants cours formation ecole sciences', kinds: ['education'] },
    { id: 'community', w: 'community communities meetup meetups event events network networking peers comunidade comunidades evento eventos rede encontro encontros ' +
      'comunidad redes encuentro encuentros ' +
      'communaute communautes evenement evenements reseau reseaux rencontre rencontres', kinds: ['community'] },
    { id: 'public', w: 'council municipality licence license licensing permit public government camara municipio licenca licenciamento publico junta ' +
      'ayuntamiento licencia licencias permiso gobierno administracion ' +
      'mairie commune municipalite permis administration gouvernement collectivite', kinds: ['public'] },
    { id: 'app', w: 'app apps application spreadsheet software platform website automation system systems users aplicacao aplicacoes folha plataforma site automatizar automacao sistema utilizadores ' +
      'aplicacion aplicaciones hoja automatizacion usuarios ' +
      'applications tableur logiciel plateforme automatiser automatisation systeme utilisateurs', kinds: ['company'], roles: ['talent'] },
  ].map(c => ({ ...c, set: new Set(c.w.split(' ')) }));
  const SYN = [
    'design designer designers ux ui brand branding figma usability disenador disenadora disenadores diseno graphiste marca marque',
    'hardware iot embedded robot robots robotics robotica robotique sensor sensors sensores capteurs electronics electronica electronique drones materiel',
    'prototype prototypes prototipo prototipos proof-of-concept poc pilot piloto pilote demonstration validation validacao validacion',
    'ai ia artificial intelligence inteligencia artificielle machine learning agents agent agentes llm rag chatbot chatbots',
    'sea marine ocean aquaculture aquacultura acuicultura mar mer maritime maritimo oceano fish fisheries pescas pesca peche blue underwater salt sal sel',
    'tourism tourist hotel hotels hospitality turismo tourisme hotelaria hosteleria hotellerie hoteis hoteles guest guests booking bookings reservations reservas reservation restaurant restaurants restaurante restaurantes',
    'health saude salud sante medical clinical medicine medicina medecine biotech',
    'agriculture agricultura farm farmers farming agrifood agroalimentaire agroalimentario irrigation rega riego agricultores agriculteurs agricole agricola',
    'energy solar wind mobility energia energie solaire mobilidade movilidad mobilite',
    'data dados datos donnees dashboards analytics',
    'software developer programmer app apps application aplicacao aplicacoes aplicacion aplicaciones web website websites site sites platform plataforma plateforme logiciel python typescript it informatica informatique desarrollador developpeur programmeur',
    'legal law lawyer juridico juridique advogado abogado avocat incorporation visas contracts contratos contrats',
    'marketing content social media conteudos contenidos contenu redes reseaux',
    'fundraising funding investment investor investimento financiamento financiacion inversion inversor financement investissement investisseur',
    'startup startups founder founders fundador fundadora fundadores fondateur fondatrice fondateurs empreendedor empreendedores emprendedor emprendedores entrepreneur entrepreneurs',
  ].map(s => s.split(' '));
  const synOf = w => { const g = SYN.find(g => g.includes(w)); return g ? [...new Set([w, ...g])] : [w]; };
  const groupOf = w => { const i = SYN.findIndex(g => g.includes(w) || g.includes(w.replace(/s$/, ''))); return i < 0 ? w.replace(/s$/, '') : `g${i}`; };
  const PROVIDER = /\b(software|developers?|websites?|web app|automates?|automation|automacao|automatiza|it company|it consulting|informatica|informatique|logiciels?|desarrollo de software|information.systems|digital solutions|chatbots?|programador|programmer|full-stack|data-driven)\b/;
  const reFor = v => new RegExp(`\\b${v.replace(/[-.]/g, '\\$&')}${v.length > 3 ? '(?:s|es)?' : ''}\\b`);
  const KIND_WORDS = { support: 'support apoio funding financiamento apoyo financiacion soutien financement', incubation: 'mentoring mentoria incubation incubacao incubator incubadora incubacion mentorat incubateur', education: 'education ensino research investigacao educacion investigacion enseignement recherche', community: 'community comunidade comunidad communaute', public: 'public publico', company: 'company empresa entreprise', funding: 'investment investimento grant subvencao inversion subvencion investissement subvention' };
  const idx = [
    ...orgs.map(o => ({ type: 'org', o, name: fold(o.name), text: fold([o.what, o.pt, o.es, o.fr, o.ai, (o.also || []).map(a => a.what).join(' '), o.partner?.note, KIND_WORDS[o.kind]].join(' ')) })),
    ...people.map(p => ({ type: 'person', p, name: fold(p.name), text: fold([...['offer', 'sector'].flatMap(k => Object.values(p[k])), p.tags, p.roles.join(' ')].join(' ')) })),
  ];

  // Ways of saying "raise investment" in the four languages, read as one word the vocabulary knows.
  const RAISE = /\s(?:raise|raising) (?:money|funds|capital|a round)\s|\s(?:angariar|captar|levantar) (?:de )?(?:investimento|financiamento|capital)\s|\sangariacao de (?:investimento|financiamento)\s|\s(?:captar|recaudar|levantar) (?:inversion|inversiones|financiacion|fondos|capital)\s|\s(?:lever|levee) (?:des|de|du) (?:fonds|capital|capitaux)\s/g;
  function parse(q, hint = {}) {
    // Words are matched folded (no accents) but shown as typed: diseñador, not disenador.
    const shown = new Map(String(q).split(/[^\p{L}\p{N}€-]+/u).filter(Boolean).map(x => [fold(x), x]));
    const show = w => w.split(' ').map(x => shown.get(x) || x).join(' ');
    let f = ` ${fold(q).replace(/[^a-z0-9€\s-]/g, ' ').replace(/\s+/g, ' ')} `.replace(PHRASES, ' ').replace(PHRASES, ' ');
    f = f.replace(RAISE, m => { shown.set('fundraising', show(m.trim())); return ' fundraising '; });
    let tw = hint.town || '';
    for (const [a, id] of TOWNS) { const re = new RegExp(`\\s${a}\\s`); if (re.test(f)) { if (!tw) tw = id; f = f.replace(re, ' '); } }
    const toks = f.split(/[\s-]+/).filter(x => x.length > 1 && !STOP.has(x) && !/^\d+$/.test(x));
    const concepts = CONCEPTS.filter(c => toks.some(x => c.set.has(x) || c.set.has(x.replace(/s$/, ''))));
    if (hint.role) { const c = CONCEPTS.find(c => c.id === { talent: 'talent', mentor: 'mentor', investor: 'funding' }[hint.role]); if (c && !concepts.includes(c)) concepts.push(c); }
    const seen = new Set();
    const terms = [...new Set(toks)].filter(x => { const k = groupOf(x); if (seen.has(k)) return false; seen.add(k); return true; })
      .map(x => ({ word: show(x), key: groupOf(x), generic: CONCEPTS.some(c => c.set.has(x)) && groupOf(x) === x.replace(/s$/, ''), vars: synOf(x).concat(x.endsWith('s') ? synOf(x.slice(0, -1)) : []).map(reFor) }));
    return { town: tw, concepts, terms, orgOnly: hint.role === 'org' };
  }
  function match(q, hint) {
    const pq = parse(q, hint);
    const out = [];
    for (const e of idx) {
      if (e.type === 'person' && (!listed(e.p) || pq.orgOnly)) continue;
      let topic = 0, specific = 0; const why = [], words = [];
      for (const t of pq.terms) {
        const w = t.vars.some(r => r.test(e.name)) ? 3 : t.vars.some(r => r.test(e.text)) ? 2 : 0;
        if (w) { topic += t.generic ? 0.5 : w; words.push(t.word); if (!t.generic) specific += w; }
      }
      let cs = 0;
      for (const c of pq.concepts) {
        if (e.type === 'org' && c.kinds.includes(e.o.kind)) { cs = Math.max(cs, c.kinds[0] === e.o.kind ? 3 : 2); }
        if (e.type === 'person' && c.roles?.some(r => e.p.roles.includes(r))) cs = Math.max(cs, 3);
      }
      if (cs) why.push(e.type === 'org' ? X.whyKind(I.kinds[e.o.kind].label) : X.whyRole(e.p.roles.filter(r => pq.concepts.some(c => c.roles?.includes(r))).map(r => I.roles[r]).join(', ')));
      let s = topic + cs;
      if (pq.orgOnly && e.type === 'org') s += 1;
      const hasWhat = s > 0;
      // Asked for something specific that this entry never mentions: keep it, lower down.
      if (pq.terms.some(t => !t.generic) && !specific) s *= 0.4;
      // Someone looking for a service, or a business whose first app needs help: favour the region's software and service providers.
      if ((specific || !pq.terms.some(t => !t.generic)) && pq.concepts.some(c => c.id === 'app' || c.id === 'talent') && PROVIDER.test(e.text) && (e.type === 'person' || ['company', 'support'].includes(e.o.kind))) { s += 3; why.push(X.whyBuilds); }
      const towns = e.type === 'org' ? e.o.towns : [e.p.town];
      if (pq.town) {
        if (towns.includes(pq.town)) { s *= 1.6; why.push(X.whyTown(town(pq.town))); }
        else if (towns.includes('algarve')) { s *= 1.15; why.push(X.whyRegion); }
        else s *= 0.6;
      }
      if (!hasWhat && !(pq.town && !pq.terms.length && !pq.concepts.length && towns.includes(pq.town))) continue;
      if (hasWhat && s < 2) continue; // too weak to show
      if (!hasWhat) s = 1;
      if (words.length) why.push(X.whyWords(words));
      if (e.type === 'org' && (e.o.partner || e.o.us)) { s += 0.3; if (e.o.partner) why.push(X.whyPartner); }
      out.push({ e, s, why });
    }
    out.sort((a, b) => b.s - a.s || (a.e.type === 'org' ? a.e.o.name : a.e.p.name).localeCompare(b.e.type === 'org' ? b.e.o.name : b.e.p.name));
    return { pq, out };
  }

  const res = $('#tm-results');
  let lastQ = '', lastHint = {}, limit = 8;
  // A search costs 2 cents (a need's matches 2, after posting it free: the posting paid). Without credit nothing runs.
  function runAsk(q, hint = {}, { scroll = true, cents = PRICE.ask, label = X.ch.ask(q) } = {}) {
    q = q.trim(); if (!q) return;
    if (cents && !pay(cents, label)) return;
    lastQ = q; lastHint = hint; limit = 8;
    drawResults(); res.hidden = false;
    try { const u = new URL(location.href); u.searchParams.set('q', q); history.replaceState(null, '', u); } catch {}
    if (scroll) go(res);
  }
  function drawResults() {
    const { pq, out } = match(lastQ, lastHint);
    const top = out.slice(0, limit), max = out[0]?.s || 1;
    const nOrg = out.filter(r => r.e.type === 'org').length, nPpl = out.length - nOrg;
    const read = [
      ...pq.concepts.map(c => `${X.kindOf}${C}<b>${esc(X.c[c.id])}</b>`),
      pq.town ? `${X.where}${C}<b>${esc(town(pq.town))}</b>` : '',
      pq.terms.length ? `${X.words}${C}${pq.terms.map(t => `<b>${esc(t.word)}</b>`).join(' ')}` : '',
    ].filter(Boolean);
    const third = pq.concepts.some(c => c.id === 'app');
    res.innerHTML = `<div class="tm-res-head"><h2 tabindex="-1" id="tm-res-h">${esc(X.best(lastQ))}</h2><p>${out.length ? esc(X.ranked(nOrg, nPpl)) : ''}</p></div>
${read.length ? `<p class="tm-understood">${X.read}${C}${read.join(' · ')}</p>` : ''}
${third ? `<div class="tm-third-in" style="margin-bottom:1rem"><p>${esc(X.third)}</p></div>` : ''}
${out.length ? `<ol class="tm-res-list">${top.map((r, i) => {
      const { e } = r;
      if (e.type === 'org') {
        const o = e.o;
        return `<li class="tm-res"><span class="tm-res-rank">${i + 1}</span><div class="tm-card-top">${kindChip(o)}</div><h3><button type="button" data-open="org:${esc(o.id)}">${esc(o.name)}</button></h3><p class="tm-place">${esc(o.towns.map(town).join(' · '))}</p><p class="tm-res-what"${inLang(o) || L === 'en' ? '' : ' lang="en"'}>${esc(inLang(o) || o.what)}</p><ul class="tm-why">${r.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul><div class="tm-score" aria-hidden="true"><i style="width:${Math.max(8, Math.round(100 * r.s / max))}%"></i></div></li>`;
      }
      const p = pv(e.p);
      return `<li class="tm-res is-sim"><span class="tm-res-rank">${i + 1}</span><div class="tm-card-top"><span class="tm-sim">${X.sim}</span>${p.roles.map(x => `<span class="tm-role r-${x}">${esc(I.roles[x])}</span>`).join('')}</div><h3><button type="button" data-open="person:${p.id}">${esc(p.name)}</button></h3><p class="tm-place">${esc(town(p.town))} · ${esc(T(p.sector))} · ${esc(T(p.rate))}</p><p class="tm-res-what">${esc(T(p.offer))}</p><ul class="tm-why">${r.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul><div class="tm-score" aria-hidden="true"><i style="width:${Math.max(8, Math.round(100 * r.s / max))}%"></i></div></li>`;
    }).join('')}</ol>` : `<p class="tm-res-empty">${esc(X.none)}</p>`}
<div class="tm-res-more">${out.length > limit ? `<button type="button" class="tm-btn tm-btn-ghost" id="tm-more">${X.more} (${out.length - limit})</button>` : ''}<button type="button" class="tm-btn tm-btn-ghost" id="tm-to-post">${X.post}</button><button type="button" class="tm-btn tm-btn-ghost" id="tm-res-clear">${X.clear}</button></div>`;
    $('#tm-more', res)?.addEventListener('click', () => { if (!pay(PRICE.more, X.ch.more)) return; limit += 8; drawResults(); });
    $('#tm-to-post', res).addEventListener('click', () => { const f = $('#tm-post'); f.what.value = lastQ; if (pq.town) f.town.value = pq.town; go(f); setTimeout(() => f.who.focus({ preventScroll: true }), reduced ? 0 : 500); });
    $('#tm-res-clear', res).addEventListener('click', () => { res.hidden = true; res.innerHTML = ''; $('#tm-q').value = ''; try { const u = new URL(location.href); u.searchParams.delete('q'); history.replaceState(null, '', u); } catch {} $('#tm-q').focus(); });
  }
  $('#tm-ask').addEventListener('submit', e => { e.preventDefault(); runAsk($('#tm-q').value); });
  $$('[data-ask]').forEach(b => b.addEventListener('click', () => { $('#tm-q').value = b.dataset.ask; runAsk(b.dataset.ask); }));

  // ---------- Needs board ----------
  const list = $('#tm-needs-list'), form = $('#tm-post');
  form.hidden = false;
  const needQuery = n => `${T(n.what)} ${town(n.town)}`;
  function drawPosted() {
    $$('.tm-need.is-mine', list).forEach(x => x.remove());
    for (const n of [...S.posted].reverse()) {
      const role = n.role === 'org' ? `<span class="tm-role r-org">${esc(W.fRoles.find(r => r[0] === 'org')[1])}</span>` : `<span class="tm-role r-${n.role}">${esc(I.roles[n.role])}</span>`;
      list.insertAdjacentHTML('afterbegin', `<li class="tm-need is-mine" data-mine="${esc(n.id)}"><div class="tm-card-top"><span class="tm-mine">${X.mine}</span>${role}</div><h4>${esc(n.what)}</h4><p class="tm-place">${esc(n.who)} · ${esc(town(n.town))}</p><p><strong>${esc(W.offer)}${C.trimEnd()}</strong> ${esc(n.pay)}</p>
<div class="tm-need-acts"><button type="button" class="tm-btn tm-btn-main" data-match-mine="${esc(n.id)}">${esc(W.findMatches)}</button><button type="button" class="tm-btn tm-btn-ghost" data-del="${esc(n.id)}">${X.del}</button></div></li>`);
    }
  }
  list.addEventListener('click', e => {
    const m = e.target.closest('[data-match-need]'), mm = e.target.closest('[data-match-mine]'), d = e.target.closest('[data-del]');
    if (m) { const n = needs.find(x => x.id === m.dataset.matchNeed); $('#tm-q').value = needQuery(n); runAsk(`${T(n.what)} ${T(n.tags)} ${town(n.town)}`, { town: n.town, role: n.role }, { cents: PRICE.need, label: `${X.ch.need}${C}${T(n.what)}` }); }
    if (mm) { const n = S.posted.find(x => x.id === mm.dataset.matchMine); $('#tm-q').value = `${n.what} ${town(n.town)}`; runAsk(n.what, { town: n.town, role: n.role }, { cents: PRICE.need, label: `${X.ch.need}${C}${n.what}` }); }
    if (d) { S.posted = S.posted.filter(x => x.id !== d.dataset.del); save(); drawPosted(); }
  });
  $$('[data-match-need]').forEach(b => { b.hidden = false; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = { id: `u${Date.now()}`, who: form.who.value.trim(), what: form.what.value.trim(), town: form.town.value, pay: form.pay.value.trim(), role: form.role.value };
    if (!n.who || !n.what || !n.pay) return;
    if (!pay(PRICE.post, `${X.ch.post}${C}${n.what}`)) return;
    S.posted.push(n); save(); drawPosted(); form.reset();
    $('#tm-post-done').textContent = X.posted;
    $('#tm-q').value = `${n.what} ${town(n.town)}`; runAsk(n.what, { town: n.town, role: n.role }, { cents: 0 });
  });

  // ---------- Consent preview ----------
  const pick = $('.tm-mail-pick'), who = $('#tm-mail-who'), mail = $('#tm-mail-body');
  pick.hidden = false;
  function drawMail(say = '', sayNo = false, editing = false) {
    const p0 = byPerson.get(who.value), p = pv(p0), st = S.consent[p.id] || (p.approved ? 'yes' : 'wait');
    mail.innerHTML = `<dl class="tm-mail-h"><dt>${esc(W.mailFrom)}</dt><dd>${esc(W.mailFromV)}</dd><dt>${esc(W.mailTo)}</dt><dd>${esc(p.name)} <span class="tm-sim">${X.sim}</span></dd><dt>${esc(W.mailSubject)}</dt><dd><strong>${esc(W.mailSubjectV)}</strong></dd></dl>
<p>${esc(W.mailHello)} ${esc(p.name.split(' ')[0])},</p><p>${esc(W.mailBody)}</p>
<div class="tm-card tm-person tm-preview"><div class="tm-card-top">${p.roles.map(r => `<span class="tm-role r-${r}">${esc(I.roles[r])}</span>`).join('')}</div><div class="tm-person-h"><span class="tm-avatar" aria-hidden="true">${esc(p.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><h4>${esc(p.name)}</h4><p class="tm-place">${esc(town(p.town))} · ${esc(T(p.sector))} · ${esc(T(p.rate))}</p></div></div><p class="tm-what">${esc(T(p.offer))}</p></div>
${editing ? `<form class="tm-change" id="tm-change"><label>${X.offer}<textarea name="offer" rows="3" maxlength="200">${esc(T(p.offer))}</textarea></label><label>${esc(X.rate)}<input name="rate" maxlength="60" value="${esc(T(p.rate))}"></label><button class="tm-btn tm-btn-main" type="submit">${X.send}</button></form>` : ''}
<div class="tm-mail-actions"><button type="button" class="tm-btn tm-btn-main" data-c="yes">${esc(W.approve)}</button><button type="button" class="tm-btn tm-btn-ghost" data-c="change">${esc(W.change)}</button><button type="button" class="tm-btn tm-btn-ghost" data-c="no">${esc(W.noList)}</button></div>
<p class="tm-d-note">${X.answer}${C}${esc(X.status[st])}</p>
<p class="tm-mail-say${sayNo ? ' is-no' : ''}" aria-live="polite" ${say ? '' : 'hidden'}>${esc(say)}</p>`;
    const ch = $('#tm-change', mail);
    if (ch) { ch.offer.focus(); ch.addEventListener('submit', ev => { ev.preventDefault(); if (!pay(PRICE.consent, X.ch.consent(X.send))) return; S.edits[p.id] = { offer: ch.offer.value.trim(), rate: ch.rate.value.trim() }; save(); drawPeople(); drawMail(X.changeSay); }); }
  }
  mail.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    const id = who.value;
    if (!pay(PRICE.consent, X.ch.consent(b.textContent))) return;
    if (b.dataset.c === 'yes') { S.consent[id] = 'yes'; save(); drawPeople(); apply(); drawMail(X.okSay); }
    if (b.dataset.c === 'no') { S.consent[id] = 'no'; save(); drawPeople(); apply(); drawMail(X.noSay, true); }
    if (b.dataset.c === 'change') drawMail('', false, true);
  });
  let whoWas = who.value;
  who.addEventListener('change', () => { if (!pay(PRICE.consent, X.ch.preview(byPerson.get(who.value).name))) { who.value = whoWas; return; } whoWas = who.value; drawMail(); });
  drawMail();

  // ---------- Reset ----------
  const resetP = document.createElement('p');
  resetP.innerHTML = `<button type="button" class="tm-chip" id="tm-reset">${X.reset}</button> <span id="tm-reset-done" aria-live="polite"></span>`;
  $('.tm-foot-grid > div').appendChild(resetP);
  $('#tm-reset').addEventListener('click', () => { S = fresh(); save(); drawPosted(); drawPeople(); apply(); drawMail(); $('#tm-reset-done').textContent = X.resetDone; });

  drawPeople(); drawPosted(); apply();
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) { $('#tm-q').value = q0; runAsk(q0, {}, { scroll: false }); }
})();
