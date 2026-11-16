// "Ask the Agent": turns the build-time FAQ into a conversation. Code Apache-2.0.
// No language model and no network: typed questions are matched to the written answers by keywords (en and pt),
// here in the browser. Every answer and its sources were rendered at build time from src/data.
(() => {
  const D = JSON.parse(document.getElementById('agent-data').textContent);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const log = $('#log'), faq = $('[data-faq]'), live = $('[data-live]');
  const byId = Object.fromEntries(D.answers.map(a => [a.id, a]));
  const bodies = {};
  $$('.qa', faq).forEach(a => { bodies[a.dataset.id] = $('.msg.bot .body', a).innerHTML; });
  const orb = $('.greet .av').innerHTML;
  const thread = document.createElement('div'); thread.className = 'thread'; faq.after(thread);
  $$('[data-composer],[data-palette],[data-new],[data-theme-toggle]').forEach(el => { el.hidden = false; });
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $$('kbd').forEach(k => { if (k.textContent === 'Ctrl') k.textContent = '⌘'; });
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9€ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const T = D.lang === 'pt'
    ? { copy: 'Copiar ligação', again: 'Perguntar de novo' }
    : { copy: 'Copy link', again: 'Ask again' };

  // ---------- matching: deterministic keyword scores ----------
  const GENERIC = new Set(['about', 'who', 'what', 'how', 'why', 'new', 'start', 'real', 'true', 'work', 'do', 'run', 'show me', 'sobre', 'quem', 'porque', 'novo', 'trabalho', 'ai', 'ia', 'data', 'dados', 'try', 'algarve']);
  const score = text => {
    const n = norm(text), toks = n.split(' ').filter(Boolean), padded = ` ${n} `;
    return D.answers.map(a => {
      let s = 0; const hit = [];
      for (const kw of a.kw) {
        const w = GENERIC.has(kw) ? 0.5 : 1;
        if (kw.includes(' ')) { if (padded.includes(` ${kw} `)) { s += (1.5 + kw.split(' ').length) * w; hit.push(kw); } }
        else if (toks.includes(kw)) { s += 1.5 * w; hit.push(kw); }
        else if (kw.length >= 5 && toks.some(t => t.length >= 5 && (t.startsWith(kw) || kw.startsWith(t)))) { s += 0.9 * w; hit.push(kw); }
      }
      if (n === norm(a.q)) s += 20;
      return { id: a.id, s, hit };
    }).sort((x, y) => y.s - x.s);
  };

  // ---------- rendering ----------
  const scrollTo = el => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const userMsg = text => {
    const m = document.createElement('div'); m.className = 'msg user in';
    m.innerHTML = `<div class="bubble">${esc(text)}</div>`; thread.append(m); return m;
  };
  const botMsg = () => {
    const m = document.createElement('div'); m.className = 'msg bot in';
    m.innerHTML = `<div class="av">${orb}</div><div class="body"><span class="thinking" aria-hidden="true"><i></i><i></i><i></i></span></div>`;
    thread.append(m); return m;
  };
  const typeInto = (el, done) => {
    const html = el.innerHTML, text = el.textContent;
    if (reduce || !text) { done(); return; }
    el.textContent = ''; el.classList.add('typing');
    const dur = Math.min(1400, text.length * 11), t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = text.slice(0, Math.ceil(text.length * k));
      if (k < 1) requestAnimationFrame(step); else { el.innerHTML = html; el.classList.remove('typing'); done(); }
    };
    requestAnimationFrame(step);
  };
  const reveal = body => {
    [...body.children].forEach((c, i) => c.style.setProperty('--k', i));
    body.classList.add('show'); requestAnimationFrame(() => body.classList.remove('pend'));
  };
  const followUps = (ids, label) => `<div class="follow"><span class="follow-l">${esc(label)}</span>${ids.filter(id => byId[id]).map(id => `<button type="button" class="fu" data-ask="${id}">${esc(byId[id].q)}</button>`).join('')}</div>`;
  const setCurrent = id => $$('.topics a').forEach(a => { if (a.dataset.ask === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });

  let busy = false;
  const answer = (id, typed, ranked) => {
    const a = byId[id]; if (!a || busy) return;
    busy = true;
    const u = userMsg(typed || a.q);
    const b = botMsg(); const body = $('.body', b);
    scrollTo(u);
    const note = typed && norm(typed) !== norm(a.q) ? `<p class="matchnote">${esc(D.ui.matched)} “${esc(typed)}”: <b>${esc(a.q)}</b></p>` : '';
    setTimeout(() => {
      body.innerHTML = note + bodies[id];
      body.classList.add('pend');
      const lead = $('.lead', body);
      const fin = () => {
        reveal(body);
        const alt = ranked ? ranked.filter(r => r.id !== id && r.s > 0 && r.s >= ranked[0].s * 0.7).slice(0, 2).map(r => r.id) : [];
        body.insertAdjacentHTML('beforeend', (alt.length ? followUps(alt, D.ui.also) : '') + followUps(a.follow, D.ui.more) +
          `<div class="tools"><button type="button" class="tool" data-copy="${id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>${T.copy}</button></div>`);
        live.textContent = `${a.q} ${lead ? lead.textContent : ''}`;
        busy = false;
      };
      lead ? typeInto(lead, fin) : fin();
      setCurrent(id);
      try { history.replaceState(null, '', `#a-${id}`); } catch (e) { /* file or sandbox */ }
    }, reduce ? 0 : 420 + Math.random() * 260);
  };
  const noAnswer = typed => {
    if (busy) return; busy = true;
    const u = userMsg(typed); const b = botMsg(); const body = $('.body', b); scrollTo(u);
    setTimeout(() => {
      body.innerHTML = `<p class="lead">${esc(D.ui.none)}</p>`;
      typeInto($('.lead', body), () => { body.insertAdjacentHTML('beforeend', followUps(D.answers.map(a => a.id), '')); live.textContent = D.ui.none; busy = false; });
    }, reduce ? 0 : 420);
  };
  const askText = text => {
    const q = text.trim(); if (!q) return;
    const r = score(q);
    if (r[0].s >= 0.7) answer(r[0].id, q, r); else noAnswer(q);
  };

  // ---------- composer ----------
  const form = $('[data-composer]'), ta = $('#ask'), send = $('.send', form);
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; send.disabled = !ta.value.trim(); };
  ta.addEventListener('input', fit); fit();
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', e => { e.preventDefault(); if (busy) return; askText(ta.value); ta.value = ''; fit(); });

  // ---------- clicks: any [data-ask] asks; copy link; new conversation ----------
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-ask]');
    if (q) { e.preventDefault(); answer(q.dataset.ask); return; }
    const c = e.target.closest('[data-copy]');
    if (c) {
      const url = `${location.origin}${location.pathname}#a-${c.dataset.copy}`;
      const ok = () => { c.lastChild.textContent = D.ui.copied; setTimeout(() => { c.lastChild.textContent = T.copy; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, () => {}); return;
    }
    if (e.target.closest('[data-new]')) { thread.innerHTML = ''; setCurrent(null); try { history.replaceState(null, '', location.pathname); } catch (er) { /* ignore */ } $('.main').scrollTo(0, 0); window.scrollTo(0, 0); ta.focus(); }
  });

  // ---------- theme ----------
  const root = document.documentElement;
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = cur === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ae-agent-theme', root.dataset.theme); } catch (e) { /* storage blocked */ }
  }));

  // ---------- command palette ----------
  const pal = $('.pal'), pin = $('input', pal), list = $('#pal-list');
  let items = [], sel = 0;
  const draw = () => {
    const q = pin.value.trim();
    if (!q) items = D.answers.map(a => a.id);
    else {
      const nq = norm(q), r = score(q);
      const sub = D.answers.filter(a => norm(a.q).includes(nq) || norm(a.d).includes(nq)).map(a => a.id);
      items = [...new Set([...sub, ...r.filter(x => x.s > 0).map(x => x.id)])];
    }
    sel = Math.min(sel, Math.max(0, items.length - 1));
    list.innerHTML = items.length
      ? items.map((id, i) => `<li role="option" id="po-${id}" data-id="${id}" aria-selected="${i === sel}"><strong>${esc(byId[id].q)}</strong><span>${esc(byId[id].d)}</span></li>`).join('')
      : `<li class="empty" role="option" aria-disabled="true">${esc(D.ui.noresults)}</li>`;
    pin.setAttribute('aria-activedescendant', items.length ? `po-${items[sel]}` : '');
    $('[aria-selected="true"]', list)?.scrollIntoView({ block: 'nearest' });
  };
  const openPal = () => { if (pal.open) return; pin.value = ''; sel = 0; draw(); pal.showModal(); pin.focus(); };
  const choose = () => { const id = items[sel]; const typed = pin.value.trim(); pal.close(); if (id) answer(id); else if (typed) askText(typed); };
  $$('[data-palette]').forEach(b => b.addEventListener('click', openPal));
  pin.addEventListener('input', () => { sel = 0; draw(); });
  pin.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, items.length); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(1, items.length); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(); }
  });
  list.addEventListener('click', e => { const li = e.target.closest('li[data-id]'); if (li) { sel = items.indexOf(li.dataset.id); choose(); } });
  pal.addEventListener('click', e => { if (e.target === pal) pal.close(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPal(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !pal.open) { e.preventDefault(); ta.focus(); }
  });

  // ---------- start: type the greeting, then answer a linked question ----------
  const g = $('.greet .lead'), sg = $('[data-sugg]');
  sg.classList.add('pend');
  typeInto(g, () => {
    reveal(sg);
    const m = location.hash.match(/^#a-([a-z0-9-]+)$/);
    if (m && byId[m[1]]) answer(m[1]);
  });
})();
