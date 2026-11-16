// A simulated pay-per-use wallet shared by the working ideas (talent map, Spreadsheet to App).
// Dinis Cruz, 16 November 2026: "make it so that every action, every click I do discounts something ... as soon as you
// load the page ... we kind of show that workflow in action". Nothing is charged and nothing is sent: the balance lives
// only in this browser (localStorage), and the page says so.
//
// API (window.AECredit):
//   charge(cents, label)  -> true if paid, false if the credit ran out (then the top-up offer opens)
//   balance()             -> cents left
//   topUp(cents)          -> adds simulated credit
//   reset()               -> back to the starting credit, statement cleared
//   on(fn)                -> fn({ balance, entry }) after every change
// Declarative: any element with data-ae-charge="<cents>" and data-ae-charge-label="<text>" charges when clicked.
// The script tag may carry data-lang (en, pt, es, fr), data-app (an id for the statement) and data-open-cents
// (what opening the page costs; default 1).
(() => {
  const me = document.currentScript;
  const lang = me?.dataset.lang || document.documentElement.lang || 'en';
  const app = me?.dataset.app || 'app';
  const KEY = 'ae-credit-v1', START = 500;
  const W = ({
    en: { credit: 'Credit', sim: 'Simulated', statement: 'Your statement', note: 'A simulation of paying per use: every action costs a few cents from your credit. Nothing is charged and nothing is sent; the balance lives only in this browser.', top: 'Add €5 (simulated)', reset: 'Reset', close: 'Close', empty: 'No charges yet.', out: 'Your credit has run out. Add €5 of simulated credit to carry on.', opened: 'Opened', toppedUp: 'Added credit', spent: 'Spent', actions: 'actions' },
    pt: { credit: 'Crédito', sim: 'Simulado', statement: 'O seu extrato', note: 'Uma simulação de pagar por utilização: cada ação custa alguns cêntimos do seu crédito. Nada é cobrado e nada é enviado; o saldo fica só neste navegador.', top: 'Adicionar 5 € (simulado)', reset: 'Repor', close: 'Fechar', empty: 'Ainda sem cobranças.', out: 'O seu crédito acabou. Adicione 5 € de crédito simulado para continuar.', opened: 'Abriu', toppedUp: 'Crédito adicionado', spent: 'Gasto', actions: 'ações' },
    es: { credit: 'Crédito', sim: 'Simulado', statement: 'Su extracto', note: 'Una simulación de pago por uso: cada acción cuesta unos céntimos de su crédito. No se cobra nada y no se envía nada; el saldo vive solo en este navegador.', top: 'Añadir 5 € (simulado)', reset: 'Restablecer', close: 'Cerrar', empty: 'Aún no hay cargos.', out: 'Se ha agotado su crédito. Añada 5 € de crédito simulado para continuar.', opened: 'Abrió', toppedUp: 'Crédito añadido', spent: 'Gastado', actions: 'acciones' },
    fr: { credit: 'Crédit', sim: 'Simulé', statement: 'Votre relevé', note: 'Une simulation du paiement à l\'usage : chaque action coûte quelques centimes de votre crédit. Rien n\'est débité et rien n\'est envoyé ; le solde reste dans ce navigateur.', top: 'Ajouter 5 € (simulé)', reset: 'Réinitialiser', close: 'Fermer', empty: 'Aucun débit pour l\'instant.', out: 'Votre crédit est épuisé. Ajoutez 5 € de crédit simulé pour continuer.', opened: 'Ouvert', toppedUp: 'Crédit ajouté', spent: 'Dépensé', actions: 'actions' },
  })[lang] || null;
  const L = W || { credit: 'Credit' };
  const fmt = c => new Intl.NumberFormat({ en: 'en-IE', pt: 'pt-PT', es: 'es-ES', fr: 'fr-FR' }[lang] || 'en-IE', { style: 'currency', currency: 'EUR' }).format(c / 100);
  const text = l => (l && typeof l === 'object' ? (l[lang] ?? l.en) : String(l ?? ''));

  let state;
  const load = () => { try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; } if (!state || typeof state.balance !== 'number') state = { balance: START, entries: [] }; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  load();
  const listeners = [];
  const emit = entry => { listeners.forEach(fn => { try { fn({ balance: state.balance, entry }); } catch {} }); render(entry); };
  const add = (cents, label, sign) => {
    const entry = { at: new Date().toISOString(), app, cents: sign * cents, label: text(label), balance: state.balance + sign * cents };
    state.balance = entry.balance; state.entries.unshift(entry); state.entries = state.entries.slice(0, 200); save(); emit(entry); return entry;
  };
  const api = {
    charge(cents, label) { cents = Math.max(0, Math.round(cents)); if (state.balance < cents) { openPanel(true); return false; } add(cents, label, -1); return true; },
    balance: () => state.balance,
    topUp(cents = 500) { add(cents, L.toppedUp, +1); },
    reset() { state = { balance: START, entries: [] }; save(); emit(null); },
    on(fn) { listeners.push(fn); },
  };
  window.AECredit = api;

  // The meter: a pill fixed at the bottom of the screen, a toast for each charge, and the statement panel.
  const css = `.aec{position:fixed;left:16px;bottom:16px;z-index:1500;font:600 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}
.aec-pill{display:flex;align-items:center;gap:.55rem;padding:.55rem .9rem .55rem .7rem;border-radius:999px;border:0;background:#14213d;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;font:inherit}
.aec-pill:focus-visible{outline:3px solid #ffd58a;outline-offset:2px}
.aec-coin{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe7a8,#f0b429 60%,#b7791f);box-shadow:inset 0 -2px 0 rgba(0,0,0,.2)}
.aec-bal{font-variant-numeric:tabular-nums;font-size:16px}
.aec-sim{font-size:10px;letter-spacing:.1em;text-transform:uppercase;background:#ffd58a;color:#14213d;border-radius:4px;padding:2px 5px}
.aec-toast{position:absolute;left:calc(100% + 10px);bottom:6px;white-space:nowrap;background:#fff;color:#14213d;border:1px solid #e3d5b5;border-radius:10px;padding:.4rem .7rem;box-shadow:0 6px 18px rgba(0,0,0,.15);font-weight:600;animation:aec-up 2.2s ease forwards}
.aec-toast b{color:#b42318;font-variant-numeric:tabular-nums}.aec-toast.plus b{color:#11734b}
@keyframes aec-up{0%{opacity:0;transform:translateY(8px)}12%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}
.aec-pill.bump .aec-bal{animation:aec-bump .5s ease}@keyframes aec-bump{40%{color:#ffb4a8;transform:scale(1.12)}}
.aec-panel{position:absolute;left:0;bottom:calc(100% + 10px);width:min(360px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;background:#fffdf8;color:#1b1b1b;border:1px solid #e3d5b5;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:16px;font-weight:400}
.aec-panel[hidden]{display:none}.aec-panel h2{font:700 18px/1.2 Georgia,serif;margin:0 0 .3rem}.aec-panel p{margin:.2rem 0 .7rem;font-size:13px;color:#4a4a4a}
.aec-out{background:#fff1ee;border:1px solid #f3c2b8;border-radius:10px;padding:.5rem .7rem;color:#8a1c0b!important}
.aec-sum{display:flex;gap:1rem;font-size:13px;margin:.2rem 0 .6rem}.aec-sum strong{font-variant-numeric:tabular-nums}
.aec-list{list-style:none;margin:0 0 .8rem;padding:0;font-size:13px}.aec-list li{display:flex;justify-content:space-between;gap:.6rem;padding:.35rem 0;border-bottom:1px solid #efe6d2}
.aec-list span:last-child{font-variant-numeric:tabular-nums;font-weight:700;color:#b42318}.aec-list li.plus span:last-child{color:#11734b}
.aec-list small{display:block;color:#777}
.aec-btns{display:flex;gap:.5rem;flex-wrap:wrap}.aec-btns button{font:600 13px system-ui,sans-serif;border-radius:999px;padding:.4rem .8rem;cursor:pointer;border:1px solid #14213d;background:#fff;color:#14213d}
.aec-btns button.primary{background:#14213d;color:#fff}.aec-btns button:focus-visible{outline:3px solid #f0b429;outline-offset:2px}
@media (max-width:600px){.aec-toast{left:0;bottom:calc(100% + 8px);white-space:normal;max-width:calc(100vw - 32px)}}
@media (prefers-reduced-motion:reduce){.aec-toast{animation:none}.aec-pill.bump .aec-bal{animation:none}}
@media print{.aec{display:none}}`;
  let root, pill, bal, panel, list, sum, outNote;
  function build() {
    if (root || !W) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'aec';
    root.innerHTML = `<div class="aec-panel" role="dialog" aria-label="${L.statement}" hidden><h2>${L.statement}</h2><p>${L.note}</p><p class="aec-out" hidden>${L.out}</p><div class="aec-sum"></div><ul class="aec-list"></ul><div class="aec-btns"><button type="button" class="primary" data-a="top">${L.top}</button><button type="button" data-a="reset">${L.reset}</button><button type="button" data-a="close">${L.close}</button></div></div>
<button type="button" class="aec-pill" aria-expanded="false" aria-live="polite"><span class="aec-coin" aria-hidden="true"></span><span>${L.credit}</span> <span class="aec-bal"></span> <span class="aec-sim">${L.sim}</span></button>`;
    document.body.appendChild(root);
    pill = root.querySelector('.aec-pill'); bal = root.querySelector('.aec-bal'); panel = root.querySelector('.aec-panel');
    list = root.querySelector('.aec-list'); sum = root.querySelector('.aec-sum'); outNote = root.querySelector('.aec-out');
    pill.addEventListener('click', () => (panel.hidden ? openPanel(false) : closePanel()));
    root.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'top') api.topUp(500); if (a === 'reset') api.reset(); if (a === 'close') closePanel(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) closePanel(); });
  }
  function openPanel(out) { build(); if (!panel) return; outNote.hidden = !out; panel.hidden = false; pill.setAttribute('aria-expanded', 'true'); renderList(); }
  function closePanel() { panel.hidden = true; pill.setAttribute('aria-expanded', 'false'); pill.focus(); }
  function renderList() {
    if (!list) return;
    const spent = state.entries.filter(e => e.cents < 0);
    sum.innerHTML = `<span>${L.spent} <strong>${fmt(-spent.reduce((s, e) => s + e.cents, 0))}</strong></span><span><strong>${spent.length}</strong> ${L.actions}</span>`;
    list.innerHTML = state.entries.length ? state.entries.slice(0, 60).map(e => `<li class="${e.cents > 0 ? 'plus' : ''}"><span>${escapeHtml(e.label)}<small>${new Date(e.at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small></span><span>${e.cents > 0 ? '+' : '−'}${fmt(Math.abs(e.cents))}</span></li>`).join('') : `<li>${L.empty}</li>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function render(entry) {
    build(); if (!bal) return;
    bal.textContent = fmt(state.balance);
    if (entry) {
      const t = document.createElement('div'); t.className = 'aec-toast' + (entry.cents > 0 ? ' plus' : '');
      t.innerHTML = `<b>${entry.cents > 0 ? '+' : '−'}${fmt(Math.abs(entry.cents))}</b> · ${escapeHtml(entry.label)}`;
      root.appendChild(t); setTimeout(() => t.remove(), 2300);
      pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    }
    if (!panel.hidden) renderList();
  }
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-ae-charge]'); if (!el) return;
    const ok = api.charge(Number(el.dataset.aeCharge), el.dataset.aeChargeLabel || el.textContent.trim().slice(0, 40));
    if (!ok) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // data-auto-cents="<n>" on the script tag: any other click on a button, link inside the page, checkbox, select or
  // summary in <main> costs n cents, labelled with what was clicked. Elements inside [data-ae-free] never charge.
  const auto = Number(me?.dataset.autoCents || 0);
  if (auto > 0) {
    document.addEventListener('click', e => {
      const el = e.target.closest('button, a[href^="#"], a[role="button"], input[type="checkbox"], input[type="radio"], summary, [role="tab"]');
      if (!el || el.closest('.aec, .ae-proto, .ae-ideas, .ae-pick, [data-ae-free], [data-ae-charge]') || !el.closest('main')) return;
      const what = (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 40) || '·';
      api.charge(auto, what);
    }, true);
  }
  const start = () => { render(null); const open = Number(me?.dataset.openCents ?? 1); const title = me?.dataset.title || document.title.split(':')[0]; if (open > 0) setTimeout(() => api.charge(open, `${L.opened}${lang === 'fr' ? '\u00a0' : ''}: ${title}`), 600); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
