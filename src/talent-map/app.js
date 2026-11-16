// Our talent map: the interactive layer. The page is complete without it (rendered at build time); this adds
// the map filter, search, matching, the needs board, the consent preview and the simulated pay-per-contact meter.
// Everything stays in this browser: nothing is sent anywhere. Owner: sites-dev@AgentiCCells.dinis. Apache-2.0.
(async () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const I = JSON.parse($('#tm-i18n').textContent), L = I.lang, W = I.w, pt = L === 'pt';
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = v => (v && typeof v === 'object' ? (v[L] ?? v.en) : (v ?? ''));
  const euro = n => (pt ? `${n.toFixed(2).replace('.', ',')} €` : `€${n.toFixed(2)}`);
  const day = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const town = id => I.towns[id] || id;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = el => el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const X = pt ? {
    credit: 'Crédito', contacts: n => `${n} contacto${n === 1 ? '' : 's'}`, add: 'Mais 5 €', sim: 'Simulado',
    org: n => `${n} organizaç${n === 1 ? 'ão' : 'ões'}`, ppl: n => `${n} entrada${n === 1 ? '' : 's'} aprovada${n === 1 ? '' : 's'}, simulada${n === 1 ? '' : 's'}`, in: 'em',
    best: q => `As melhores correspondências para «${q}»`, ranked: (a, b) => `${a} organizaç${a === 1 ? 'ão' : 'ões'} e ${b} pessoa${b === 1 ? '' : 's'} simulada${b === 1 ? '' : 's'}, ordenadas pelo que pediu, pelo tipo de ajuda e pelo concelho.`,
    read: 'Percebemos', kindOf: 'tipo de ajuda', where: 'onde', words: 'palavras',
    whyKind: k => `Tipo: ${k}`, whyRole: r => `Oferece: ${r}`, whyTown: t => `Em ${t}`, whyRegion: 'Atua em todo o Algarve', whyWords: w => `Menciona ${w.map(x => `«${x}»`).join(', ')}`, whyPartner: 'Trabalha connosco', whyBuilds: 'Faz software ou aplicações',
    more: 'Mostrar mais', post: 'Publicar isto como necessidade', clear: 'Limpar', none: 'Ainda não há correspondências. Experimente menos palavras, outro concelho, ou publique-o como necessidade para que a pessoa certa o encontre.',
    third: 'Isto é a terceira proposta a funcionar: uma empresa cuja primeira aplicação precisa de ajuda, ligada aos fornecedores da região.',
    c: { funding: 'financiamento ou investimento', mentor: 'mentoria', space: 'espaço ou incubadora', talent: 'serviços ou talento', learn: 'ensino ou investigação', community: 'uma comunidade', public: 'uma entidade pública', app: 'ajuda com uma aplicação' },
    close: 'Fechar', original: 'Texto original (inglês)', aiNote: 'Ligação à IA (nota do PrompTugal.news, em inglês)', also: t => `Também em ${t}`, alsoRegion: 'Também em todo o Algarve', reach: 'Como contactar (canal público)', partner: 'Trabalha connosco',
    their: 'A página deles', source: 'Fonte', from: (d) => `Da pesquisa pública do PrompTugal.news, lida a ${d}. As páginas públicas abrem-se de graça: não usa crédito.`,
    amount: 'Montante', date: 'Data', town: 'Concelho', sector: 'Setor', rate: 'Preço ou ticket', langs: 'Línguas',
    simNote: 'Inventada para este protótipo. No mapa real, esta entrada só apareceria depois de a pessoa a aprovar.',
    show: 'Mostrar contacto', paid: 'Pago do seu crédito, depois de ver o perfil. Quem está no mapa nunca paga. Simulado: nada é cobrado.',
    revealed: 'apresentado pelo mapa', revealedNote: 'Simulado: nada foi cobrado e nada foi enviado.', broke: 'O seu crédito acabou. Junte 5 € no topo para continuar (simulado).',
    status: { yes: 'Aprovou a sua entrada (simulado)', no: 'Disse que não: não é publicada', wait: 'Ainda não respondeu: não é publicada' },
    answer: 'Resposta neste navegador', okSay: 'Aprovado, só neste navegador. No mapa real, a entrada fica publicada com a data de hoje guardada como consentimento, e o mesmo link permite retirá-la.',
    noSay: 'Entendido. Não será publicada, e os seus dados ficam onde os deu.', changeSay: 'Obrigado. No mapa real as alterações voltam à nossa caixa de correio e enviamos-lhe uma nova pré-visualização para aprovar.',
    offer: 'O que oferece', send: 'Enviar alterações', mine: 'Só neste navegador', del: 'Apagar', posted: 'Publicada, só neste navegador. Nada foi enviado. Veja as correspondências acima.',
    reset: 'Repor o que este navegador guardou (crédito, necessidades, respostas)', resetDone: 'Reposto.', wait: 'Sem resposta',
  } : {
    credit: 'Credit', contacts: n => `${n} contact${n === 1 ? '' : 's'}`, add: 'Add €5', sim: 'Simulated',
    org: n => `${n} organisation${n === 1 ? '' : 's'}`, ppl: n => `${n} approved listing${n === 1 ? '' : 's'}, simulated`, in: 'in',
    best: q => `Best matches for “${q}”`, ranked: (a, b) => `${a} organisation${a === 1 ? '' : 's'} and ${b} simulated ${b === 1 ? 'person' : 'people'}, ranked by what you asked for, the kind of help and the town.`,
    read: 'We read', kindOf: 'kind of help', where: 'where', words: 'words',
    whyKind: k => `Kind: ${k}`, whyRole: r => `Offers: ${r}`, whyTown: t => `In ${t}`, whyRegion: 'Works across the Algarve', whyWords: w => `Mentions ${w.map(x => `“${x}”`).join(', ')}`, whyPartner: 'Works with us', whyBuilds: 'Builds software or apps',
    more: 'Show more', post: 'Post this as a need', clear: 'Clear', none: 'No match yet. Try fewer words or another town, or post it as a need so the right person finds you.',
    third: 'This is the third proposal at work: a business whose first app needs help, matched with the region\'s providers.',
    c: { funding: 'funding or investment', mentor: 'mentoring', space: 'a space or incubator', talent: 'services or talent', learn: 'education or research', community: 'a community', public: 'a public body', app: 'help with an app' },
    close: 'Close', original: '', aiNote: 'Link to AI (PrompTugal.news note)', also: t => `Also in ${t}`, alsoRegion: 'Across the Algarve too', reach: 'How to reach them (public channel)', partner: 'Works with us',
    their: 'Their page', source: 'Source', from: d => `From PrompTugal.news public research, read on ${d}. Public pages are free to open: no credit is used.`,
    amount: 'Amount', date: 'Date', town: 'Town', sector: 'Sector', rate: 'Rate or ticket', langs: 'Languages',
    simNote: 'Invented for this prototype. In the real map, this listing would appear only after the person approved it.',
    show: 'Show contact', paid: 'Paid from your credit, after you have seen the profile. Listed people never pay. Simulated: nothing is charged.',
    revealed: 'introduced by the map', revealedNote: 'Simulated: nothing was charged and nothing was sent.', broke: 'Your credit is used up. Add €5 at the top to carry on (simulated).',
    status: { yes: 'Approved their listing (simulated)', no: 'Said no: not listed', wait: 'Has not answered yet: not listed' },
    answer: 'Answer in this browser', okSay: 'Approved, in this browser only. In the real map the listing goes live with today\'s date kept as the consent, and the same link withdraws it.',
    noSay: 'Understood. You will not be listed, and your details stay where you gave them.', changeSay: 'Thank you. In the real map your changes come back to our mailbox, and we send you a corrected preview to approve.',
    offer: 'What you offer', send: 'Send changes', mine: 'Only in this browser', del: 'Delete', posted: 'Posted, in this browser only. Nothing was sent. Its matches are above.',
    reset: 'Reset what this browser has kept (credit, posted needs, answers)', resetDone: 'Reset.', wait: 'No answer',
  };

  // State kept in this browser only.
  const KEY = 'tm-state-v1';
  const fresh = () => ({ credit: 5, uses: 0, unlocked: {}, consent: {}, edits: {}, posted: [] });
  let S = fresh();
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  let O, P, N;
  try {
    [O, P, N] = await Promise.all(['organisations', 'people', 'needs'].map(f => fetch(`/talent-map/data/${f}.json`).then(r => { if (!r.ok) throw new Error(f); return r.json(); })));
  } catch { return; } // The page still works as rendered.
  const orgs = O.organisations, people = P.people, needs = N.needs;
  const byOrg = new Map(orgs.map(o => [o.id, o])), byPerson = new Map(people.map(p => [p.id, p]));
  const listed = p => (S.consent[p.id] ? S.consent[p.id] === 'yes' : p.approved);
  const pv = p => ({ ...p, offer: S.edits[p.id]?.offer ? { en: S.edits[p.id].offer, pt: S.edits[p.id].offer } : p.offer, rate: S.edits[p.id]?.rate ? { en: S.edits[p.id].rate, pt: S.edits[p.id].rate } : p.rate });

  // Meter
  const meter = $('#tm-meter');
  const drawMeter = () => { meter.innerHTML = `<span class="tm-sim">${X.sim}</span><span><span class="tm-meter-l">${X.credit} </span><b>${euro(S.credit)}</b></span><span class="tm-meter-n">${X.contacts(S.uses)}</span><button type="button" id="tm-topup">${X.add}</button>`; $('#tm-topup').onclick = () => { S.credit += 5; save(); drawMeter(); }; };
  meter.hidden = false; drawMeter();

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
      $('#tm-count').textContent = X.org(shown.size) + (F.town ? ` ${X.in} ${town(F.town)}` : '');
    } else {
      for (const c of personCards) {
        const p = byPerson.get(c.dataset.id); const base = listed(p) && qOk(c.dataset.s);
        if (base && (!F.roles.size || p.roles.some(r => F.roles.has(r)))) tally[p.town] = (tally[p.town] || 0) + 1;
        if (base && (!F.town || p.town === F.town)) p.roles.forEach(r => { roleTally[r] = (roleTally[r] || 0) + 1; });
        const ok = base && (!F.town || p.town === F.town) && (!F.roles.size || p.roles.some(r => F.roles.has(r)));
        c.hidden = !ok; if (ok) shown.add(p.id);
      }
      roleOpts.forEach(k => { const n = roleTally[k.dataset.role] || 0; k.querySelector('b').textContent = n; k.classList.toggle('is-zero', !n); });
      $('#tm-count').textContent = X.ppl(shown.size) + (F.town ? ` ${X.in} ${town(F.town)}` : '');
    }
    bubbles.forEach(b => setBubble(b, tally[b.dataset.town] || 0));
    townChips.forEach(a => { const n = tally[a.dataset.town] || 0; a.querySelector('b').textContent = n; a.classList.toggle('is-on', F.town === a.dataset.town); a.classList.toggle('is-zero', !n); if (F.town === a.dataset.town) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    $('#tm-ftown').value = F.town;
    $('#tm-clear').hidden = !(F.q || F.town || (org ? F.kinds.size : F.roles.size));
  }
  const byOrgSearch = new Map(orgCards.map(c => [c.dataset.id, c.dataset.s]));
  for (const o of orgs) if (!byOrgSearch.has(o.id)) byOrgSearch.set(o.id, fold(o.name));

  const pickTown = (id, scroll) => { F.town = F.town === id ? '' : id; apply(); if (scroll && innerWidth < 992) go($('#tm-count')); };
  bubbles.forEach(b => b.addEventListener('click', e => { e.preventDefault(); pickTown(b.dataset.town, true); }));
  townChips.forEach(a => a.addEventListener('click', e => { e.preventDefault(); pickTown(a.dataset.town, false); }));
  $('#tm-ftown').addEventListener('change', e => { F.town = e.target.value; apply(); });
  $('#tm-fq').addEventListener('input', e => { F.q = fold(e.target.value).trim(); apply(); });
  kindOpts.forEach(k => k.querySelector('input').addEventListener('change', e => { e.target.checked ? F.kinds.add(e.target.value) : F.kinds.delete(e.target.value); apply(); }));
  roleOpts.forEach(k => k.querySelector('input').addEventListener('change', e => { e.target.checked ? F.roles.add(e.target.value) : F.roles.delete(e.target.value); apply(); }));
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
    t.addEventListener('click', () => setLayer(t.dataset.layer));
    t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const o = tabs.find(x => x !== t); o.focus(); setLayer(o.dataset.layer); } });
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
  const box = (h, body, en) => `<div class="tm-d-box"><h3>${h}${en && pt ? ' (em inglês)' : ''}</h3>${body}</div>`;
  function openOrg(o) {
    const text = pt && o.pt ? o.pt : o.what;
    din.innerHTML = `<button type="button" class="tm-d-close" aria-label="${X.close}">×</button>
<div class="tm-card-top">${kindChip(o)}${o.us ? `<span class="tm-flag tm-us">${esc(W.us)}</span>` : o.partner ? `<span class="tm-flag">${X.partner}</span>` : ''}</div>
<h2 id="tm-d-title">${esc(o.name)}</h2><p class="tm-d-place">${esc(o.towns.map(town).join(' · '))}</p>
<p${pt && o.pt ? '' : ' lang="en"'}>${esc(text)}</p>
${pt && o.pt ? `<details><summary>${X.original}</summary><p lang="en">${esc(o.what)}</p></details>` : ''}
${o.amount || o.date ? `<div class="tm-d-kv">${o.amount ? `<div><span>${X.amount}</span>${esc(o.amount)}</div>` : ''}${o.date ? `<div><span>${X.date}</span>${esc(day(o.date))}</div>` : ''}</div>` : ''}
${o.ai ? box(X.aiNote, `<p lang="en">${esc(o.ai)}</p>`) : ''}
${(o.also || []).map(a => box(a.town === 'algarve' ? X.alsoRegion : X.also(town(a.town)), `<p lang="en">${esc(a.what)}</p><p class="tm-d-note">${esc(X.source)}: <a href="${esc(a.source_url)}" rel="noopener">${esc(host(a.source_url))}</a>, ${esc(day(a.read_on))}</p>`, true)).join('')}
${(o.contacts || []).map(c => box(X.reach, `<p lang="en">${esc(c.channel || c.label)}</p><p class="tm-d-note"><a href="${esc(c.url)}" rel="noopener">${esc(host(c.url))}</a>, ${esc(day(c.read_on))}</p>`, true)).join('')}
${o.partner ? box(X.partner, `<p lang="en">${esc(o.partner.note)}</p><p class="tm-d-note">${esc(X.source)}: <a href="${esc(o.partner.source_url)}" rel="noopener">${esc(host(o.partner.source_url))}</a></p>`, true) : ''}
<div class="tm-d-links"><a href="${esc(o.url)}" rel="noopener">${X.their}: ${esc(host(o.url))} ↗</a>${o.url !== o.source_url ? `<a href="${esc(o.source_url)}" rel="noopener">${X.source}: ${esc(host(o.source_url))} ↗</a>` : ''}</div>
<p class="tm-d-note">${esc(X.from(day(o.read_on)))}</p>`;
    show();
  }
  function openPerson(p0) {
    const p = pv(p0), un = S.unlocked[p.id], st = S.consent[p.id] || (p.approved ? 'yes' : 'wait');
    din.innerHTML = `<button type="button" class="tm-d-close" aria-label="${X.close}">×</button>
<div class="tm-card-top"><span class="tm-sim">${X.sim}</span>${p.roles.map(r => `<span class="tm-role r-${r}">${esc(I.roles[r])}</span>`).join('')}</div>
<div class="tm-person-h"><span class="tm-avatar" aria-hidden="true">${esc(p.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><h2 id="tm-d-title">${esc(p.name)}</h2></div>
<p class="tm-d-note">${X.simNote}</p>
<div class="tm-d-kv"><div><span>${X.town}</span>${esc(town(p.town))}</div><div><span>${X.sector}</span>${esc(T(p.sector))}</div><div><span>${X.rate}</span>${esc(T(p.rate))}</div><div><span>${X.langs}</span>${esc(p.langs)}</div></div>
<p>${esc(T(p.offer))}</p>
<div id="tm-contact">${un ? `<div class="tm-reveal">${esc(fold(p.name.split(' ')[0]))}@example.pt · ${X.revealed}</div><p class="tm-d-note">${X.revealedNote}</p>`
      : `<button type="button" class="tm-btn tm-btn-main" id="tm-unlock">${X.show} · ${euro(0.5)}</button><p class="tm-d-note">${X.paid}</p>`}</div>
<p class="tm-d-note">${X.status[st]}</p>`;
    const b = $('#tm-unlock', din);
    if (b) b.onclick = () => {
      if (S.credit < 0.5) { $('#tm-contact', din).insertAdjacentHTML('beforeend', `<p class="tm-d-note" role="alert">${X.broke}</p>`); return; }
      S.credit = Math.round((S.credit - 0.5) * 100) / 100; S.uses++; S.unlocked[p.id] = 1; save(); drawMeter(); openPerson(p0);
      $('#tm-d-in .tm-reveal')?.setAttribute('tabindex', '-1'); $('#tm-d-in .tm-reveal')?.focus();
    };
    show();
  }
  function show() { $('.tm-d-close', din).onclick = () => dlg.close(); if (!dlg.open) dlg.showModal(); din.scrollTop = 0; dlg.scrollTop = 0; }
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-open]'); if (!a) return;
    const [kind, id] = a.dataset.open.split(':');
    if (kind === 'org' && byOrg.has(id)) { e.preventDefault(); openOrg(byOrg.get(id)); }
    if (kind === 'person' && byPerson.has(id)) { e.preventDefault(); openPerson(byPerson.get(id)); }
  });

  // ---------- Matching ----------
  const STOP = new Set(('i a an the for in at on of to my our we us me need needs want wants looking look someone somebody with and or who can could help please find is are be it this that from near by some any get now new would like just first our your their more than ' +
    'um uma uns umas o os as de do da dos das em no na nos nas para por com e ou que preciso precisamos procuro procuramos quero queremos meu minha nosso nossa alguem ajuda ajudar ja tem temos ter primeira primeiro sua seu mais').split(' '));
  const TOWN_ALIAS = { loule: ['quarteira', 'vilamoura', 'almancil'], 'vila-do-bispo': ['sagres'], portimao: ['alvor'], lagoa: ['ferragudo', 'carvoeiro'], 'vila-real-de-santo-antonio': ['vrsa', 'monte gordo'], faro: ['gambelas', 'penha'], olhao: ['pechao', 'marim'], 'sao-bras-de-alportel': ['sao bras'] };
  const TOWNS = Object.keys(I.towns).filter(id => id !== 'algarve').flatMap(id => [fold(I.towns[id]), ...(TOWN_ALIAS[id] || [])].map(a => [a, id])).sort((a, b) => b[0].length - a[0].length);
  const CONCEPTS = [
    { id: 'funding', w: 'fund funding funds funded grant grants invest investor investors investment money capital seed preseed angel angels finance financing equity vc venture financiamento financiar investimento investidor investidores subsidio subvencao incentivo incentivos capital', kinds: ['funding', 'support'], roles: ['investor'] },
    { id: 'mentor', w: 'mentor mentors mentoring mentorship advice adviser advisor coach coaching guidance fundraising mentoria mentores mentora conselho orientacao', kinds: ['incubation'], roles: ['mentor'] },
    { id: 'space', w: 'incubator incubators incubation accelerator acceleration office offices space desk cowork coworking workspace incubadora incubadoras incubacao aceleradora aceleracao escritorio espaco ninho', kinds: ['incubation'] },
    { id: 'talent', w: 'designer designers developer developers dev programmer engineer freelancer freelance hire hiring consultant consultants marketing lawyer legal accountant agency studio contractor service services provider providers programador programadora designer advogado advogada consultor consultora contratar servicos servico fornecedor fornecedores', kinds: ['company'], roles: ['talent'] },
    { id: 'learn', w: 'university research researcher lab laboratory student students course courses training study school science universidade investigacao investigador laboratorio estudante estudantes curso cursos formacao escola ciencia', kinds: ['education'] },
    { id: 'community', w: 'community communities meetup meetups event events network networking peers comunidade comunidades evento eventos rede encontro encontros', kinds: ['community'] },
    { id: 'public', w: 'council municipality licence license licensing permit public government camara municipio licenca licenciamento publico junta', kinds: ['public'] },
    { id: 'app', w: 'app apps application spreadsheet software platform website automation system systems users aplicacao aplicacoes folha plataforma site automatizar automacao sistema utilizadores', kinds: ['company'], roles: ['talent'] },
  ].map(c => ({ ...c, set: new Set(c.w.split(' ')) }));
  const SYN = [
    'design designer designers ux ui brand branding figma usability',
    'hardware iot embedded robot robots robotics robotica sensor sensors sensores electronics drones',
    'prototype prototypes prototipo prototipos proof-of-concept poc pilot piloto demonstration validation validacao',
    'ai ia artificial intelligence inteligencia machine learning agents agent agentes llm rag chatbot chatbots',
    'sea marine ocean aquaculture aquacultura mar maritime fish fisheries pescas blue underwater salt sal',
    'tourism tourist hotel hotels hospitality turismo hotelaria hotel hoteis guest guests booking bookings reservations reservas restaurant restaurants',
    'health saude medical clinical medicine medicina biotech',
    'agriculture agricultura farm farmers farming agrifood irrigation rega',
    'energy solar wind mobility energia mobilidade',
    'data dados dashboards analytics',
    'software developer programmer app apps application aplicacao aplicacoes web website websites site sites platform plataforma python typescript it informatica',
    'legal law lawyer juridico advogado incorporation visas contracts',
    'marketing content social media conteudos redes',
    'fundraising funding investment investor investimento financiamento',
    'startup startups founder founders fundador fundadores empreendedor empreendedores entrepreneur entrepreneurs',
  ].map(s => s.split(' '));
  const synOf = w => { const g = SYN.find(g => g.includes(w)); return g ? [...new Set([w, ...g])] : [w]; };
  const groupOf = w => { const i = SYN.findIndex(g => g.includes(w) || g.includes(w.replace(/s$/, ''))); return i < 0 ? w.replace(/s$/, '') : `g${i}`; };
  const PROVIDER = /\b(software|developers?|websites?|web app|automates?|automation|automacao|automatiza|it company|it consulting|informatica|information.systems|digital solutions|chatbots?|programador|programmer|full-stack|data-driven)\b/;
  const reFor = v => new RegExp(`\\b${v.replace(/[-.]/g, '\\$&')}${v.length > 3 ? '(?:s|es)?' : ''}\\b`);
  const KIND_WORDS = { support: 'support apoio funding financiamento', incubation: 'mentoring mentoria incubation incubacao incubator incubadora', education: 'education ensino research investigacao', community: 'community comunidade', public: 'public publico', company: 'company empresa', funding: 'investment investimento grant subvencao' };
  const idx = [
    ...orgs.map(o => ({ type: 'org', o, name: fold(o.name), text: fold([o.what, o.pt, o.ai, (o.also || []).map(a => a.what).join(' '), o.partner?.note, KIND_WORDS[o.kind]].join(' ')) })),
    ...people.map(p => ({ type: 'person', p, name: fold(p.name), text: fold([p.offer.en, p.offer.pt, p.sector.en, p.sector.pt, p.tags, p.roles.join(' ')].join(' ')) })),
  ];

  function parse(q, hint = {}) {
    let f = ` ${fold(q).replace(/[^a-z0-9€\s-]/g, ' ')} `;
    let tw = hint.town || '';
    for (const [a, id] of TOWNS) { const re = new RegExp(`\\s${a}\\s`); if (re.test(f)) { if (!tw) tw = id; f = f.replace(re, ' '); } }
    const toks = f.split(/[\s-]+/).filter(x => x.length > 1 && !STOP.has(x) && !/^\d+$/.test(x));
    const concepts = CONCEPTS.filter(c => toks.some(x => c.set.has(x) || c.set.has(x.replace(/s$/, ''))));
    if (hint.role) { const c = CONCEPTS.find(c => c.id === { talent: 'talent', mentor: 'mentor', investor: 'funding' }[hint.role]); if (c && !concepts.includes(c)) concepts.push(c); }
    const seen = new Set();
    const terms = [...new Set(toks)].filter(x => { const k = groupOf(x); if (seen.has(k)) return false; seen.add(k); return true; })
      .map(x => ({ word: x, key: groupOf(x), generic: CONCEPTS.some(c => c.set.has(x)) && groupOf(x) === x.replace(/s$/, ''), vars: synOf(x).concat(x.endsWith('s') ? synOf(x.slice(0, -1)) : []).map(reFor) }));
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
  function runAsk(q, hint = {}, scroll = true) {
    q = q.trim(); if (!q) return;
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
      ...pq.concepts.map(c => `${X.kindOf}: <b>${esc(X.c[c.id])}</b>`),
      pq.town ? `${X.where}: <b>${esc(town(pq.town))}</b>` : '',
      pq.terms.length ? `${X.words}: ${pq.terms.map(t => `<b>${esc(t.word)}</b>`).join(' ')}` : '',
    ].filter(Boolean);
    const third = pq.concepts.some(c => c.id === 'app');
    res.innerHTML = `<div class="tm-res-head"><h2 tabindex="-1" id="tm-res-h">${esc(X.best(lastQ))}</h2><p>${out.length ? esc(X.ranked(nOrg, nPpl)) : ''}</p></div>
${read.length ? `<p class="tm-understood">${X.read}: ${read.join(' · ')}</p>` : ''}
${third ? `<div class="tm-third-in" style="margin-bottom:1rem"><p>${esc(X.third)}</p></div>` : ''}
${out.length ? `<ol class="tm-res-list">${top.map((r, i) => {
      const { e } = r;
      if (e.type === 'org') {
        const o = e.o;
        return `<li class="tm-res"><span class="tm-res-rank">${i + 1}</span><div class="tm-card-top">${kindChip(o)}</div><h3><button type="button" data-open="org:${esc(o.id)}">${esc(o.name)}</button></h3><p class="tm-place">${esc(o.towns.map(town).join(' · '))}</p><p class="tm-res-what"${pt && o.pt ? '' : ' lang="en"'}>${esc(pt && o.pt ? o.pt : o.what)}</p><ul class="tm-why">${r.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul><div class="tm-score" aria-hidden="true"><i style="width:${Math.max(8, Math.round(100 * r.s / max))}%"></i></div></li>`;
      }
      const p = pv(e.p);
      return `<li class="tm-res is-sim"><span class="tm-res-rank">${i + 1}</span><div class="tm-card-top"><span class="tm-sim">${X.sim}</span>${p.roles.map(x => `<span class="tm-role r-${x}">${esc(I.roles[x])}</span>`).join('')}</div><h3><button type="button" data-open="person:${p.id}">${esc(p.name)}</button></h3><p class="tm-place">${esc(town(p.town))} · ${esc(T(p.sector))} · ${esc(T(p.rate))}</p><p class="tm-res-what">${esc(T(p.offer))}</p><ul class="tm-why">${r.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul><div class="tm-score" aria-hidden="true"><i style="width:${Math.max(8, Math.round(100 * r.s / max))}%"></i></div></li>`;
    }).join('')}</ol>` : `<p class="tm-res-empty">${esc(X.none)}</p>`}
<div class="tm-res-more">${out.length > limit ? `<button type="button" class="tm-btn tm-btn-ghost" id="tm-more">${X.more} (${out.length - limit})</button>` : ''}<button type="button" class="tm-btn tm-btn-ghost" id="tm-to-post">${X.post}</button><button type="button" class="tm-btn tm-btn-ghost" id="tm-res-clear">${X.clear}</button></div>`;
    $('#tm-more', res)?.addEventListener('click', () => { limit += 8; drawResults(); });
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
      list.insertAdjacentHTML('afterbegin', `<li class="tm-need is-mine" data-mine="${esc(n.id)}"><div class="tm-card-top"><span class="tm-mine">${X.mine}</span>${role}</div><h4>${esc(n.what)}</h4><p class="tm-place">${esc(n.who)} · ${esc(town(n.town))}</p><p><strong>${esc(W.offer)}:</strong> ${esc(n.pay)}</p>
<div class="tm-need-acts"><button type="button" class="tm-btn tm-btn-main" data-match-mine="${esc(n.id)}">${esc(W.findMatches)}</button><button type="button" class="tm-btn tm-btn-ghost" data-del="${esc(n.id)}">${X.del}</button></div></li>`);
    }
  }
  list.addEventListener('click', e => {
    const m = e.target.closest('[data-match-need]'), mm = e.target.closest('[data-match-mine]'), d = e.target.closest('[data-del]');
    if (m) { const n = needs.find(x => x.id === m.dataset.matchNeed); $('#tm-q').value = needQuery(n); runAsk(`${T(n.what)} ${T(n.tags)} ${town(n.town)}`, { town: n.town, role: n.role }); }
    if (mm) { const n = S.posted.find(x => x.id === mm.dataset.matchMine); $('#tm-q').value = `${n.what} ${town(n.town)}`; runAsk(n.what, { town: n.town, role: n.role }); }
    if (d) { S.posted = S.posted.filter(x => x.id !== d.dataset.del); save(); drawPosted(); }
  });
  $$('[data-match-need]').forEach(b => { b.hidden = false; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = { id: `u${Date.now()}`, who: form.who.value.trim(), what: form.what.value.trim(), town: form.town.value, pay: form.pay.value.trim(), role: form.role.value };
    if (!n.who || !n.what || !n.pay) return;
    S.posted.push(n); save(); drawPosted(); form.reset();
    $('#tm-post-done').textContent = X.posted;
    $('#tm-q').value = `${n.what} ${town(n.town)}`; runAsk(n.what, { town: n.town, role: n.role });
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
<p class="tm-d-note">${X.answer}: ${esc(X.status[st])}</p>
<p class="tm-mail-say${sayNo ? ' is-no' : ''}" aria-live="polite" ${say ? '' : 'hidden'}>${esc(say)}</p>`;
    const ch = $('#tm-change', mail);
    if (ch) { ch.offer.focus(); ch.addEventListener('submit', ev => { ev.preventDefault(); S.edits[p.id] = { offer: ch.offer.value.trim(), rate: ch.rate.value.trim() }; save(); drawPeople(); drawMail(X.changeSay); }); }
  }
  mail.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    const id = who.value;
    if (b.dataset.c === 'yes') { S.consent[id] = 'yes'; save(); drawPeople(); apply(); drawMail(X.okSay); }
    if (b.dataset.c === 'no') { S.consent[id] = 'no'; save(); drawPeople(); apply(); drawMail(X.noSay, true); }
    if (b.dataset.c === 'change') drawMail('', false, true);
  });
  who.addEventListener('change', () => drawMail());
  drawMail();

  // ---------- Reset ----------
  const resetP = document.createElement('p');
  resetP.innerHTML = `<button type="button" class="tm-chip" id="tm-reset">${X.reset}</button> <span id="tm-reset-done" aria-live="polite"></span>`;
  $('.tm-foot-grid > div').appendChild(resetP);
  $('#tm-reset').addEventListener('click', () => { S = fresh(); save(); drawMeter(); drawPosted(); drawPeople(); apply(); drawMail(); $('#tm-reset-done').textContent = X.resetDone; });

  drawPeople(); drawPosted(); apply();
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) { $('#tm-q').value = q0; runAsk(q0, {}, false); }
})();
