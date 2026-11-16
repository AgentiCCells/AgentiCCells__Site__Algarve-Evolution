/* Spreadsheet to App: the engine. Turns a CSV or a Markdown checklist into a small app, in the browser.
   Used by the tool at /spreadsheet-to-app/ and copied, whole, into every app the tool exports.
   Nothing here makes a network request. Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0. */
(function (root) {
  'use strict';

  /* ---------- words ---------- */
  const L = {
    en: {
      types: { text: 'Text', category: 'Category', number: 'Number', money: 'Money', date: 'Date', time: 'Time', bool: 'Yes/no', phone: 'Phone' },
      yes: 'Yes', no: 'No', empty: '(empty)', all: 'All', search: n => `Search ${n} rows`, showing: (n, t) => n === t ? `${t} rows` : `Showing ${n} of ${t} rows`,
      none: 'Nothing matches. Clear the search or a filter.', sortBy: 'Sort by', orig: 'As in the file', asc: 'Ascending', desc: 'Descending', clear: 'Clear',
      more: n => `Show ${n} more`, add: 'Add a row', edit: 'Edit', del: 'Delete', sure: 'Delete?', save: 'Save', cancel: 'Cancel',
      addTitle: 'Add a row', editTitle: 'Edit this row', exportCsv: 'Export CSV', importCsv: 'Import CSV', reset: 'Reset to the original', resetSure: 'Reset? Your changes go.',
      imported: n => `Imported ${n} rows.`, importDiff: 'That file has different columns. Load it as a new app instead.', importFail: 'Could not read that file as CSV.',
      saved: 'Saved in this browser.', deleted: 'Row deleted.', added: 'Row added.', changed: 'Row saved.', storeFail: 'This browser would not save; changes last until you close the page.',
      actions: 'Actions', required: 'At least one field needs a value.',
      done: 'Done', ordered: 'Ordered', chased: 'Chased', reminded: 'Reminded',
      marked: (n, t, a) => `${n} of ${t} marked "${a}"`, otherView: 'Another view', todayIs: 'Today is', useToday: 'Use today',
      v: {
        stock: ['What to order', 'Items below their minimum first, grouped by supplier, with what to order and what it costs.'],
        invoices: ['Unpaid invoices', 'Overdue first, the oldest at the top, with the totals.'],
        schedule: ['Today and this week', 'Today first, then the rest of the week, with who, where and what is still to be paid.'],
        members: ['Who has not paid', 'Not paid first, then everyone else.'],
        checklist: ['Essentials first, by phase', 'The essential steps first, then the rest of the phase.'],
        generic: ['Most important first', 'The rows that still need something first.'],
      },
      belowMin: 'Below minimum', ofItems: n => `of ${n} items`, ofRows: n => `of ${n}`, nothing: 'Nothing here.', outOfStock: 'Out of stock', costToMin: 'To reach the minimum', stockOf: (a, b, u) => `${a} of ${b}${u ? ' ' + u : ''} in stock`,
      orderAtLeast: (n, u) => `order ${n}${u ? ' ' + u : ''}`, orderDay: d => `orders ${d}`, orderToday: 'Order day today', aboveMin: 'At or above minimum', belowGroup: 'Below minimum',
      chCostCat: 'Cost to reach the minimum, by', chValueCat: 'Stock value, by', chCountBelow: 'Items below minimum, by',
      unpaid: 'Unpaid', overdue: 'Overdue', notDue: 'Not yet due', paid: 'Paid', withVat: v => `${v} with VAT`, daysOver: n => n === 1 ? '1 day overdue' : `${n} days overdue`,
      dueIn: n => n === 0 ? 'due today' : n === 1 ? 'due tomorrow' : `due in ${n} days`, dueOn: d => `due ${d}`, nInv: n => n === 1 ? '1 invoice' : `${n} invoices`,
      chUnpaidBy: 'Unpaid, by', chIssuedBy: 'Invoiced, by', week: 'week', month: 'month', year: 'year',
      today: 'Today', thisWeek: 'This week', earlier: 'Earlier this week', people: 'People this week', takings: 'Takings this week', cancelled: n => `${n} cancelled, not shown`,
      noneThisWeek: (a, b) => `Nothing on ${a} or in its week, so we show the week of ${b} as if it were today. Change the date to see another week.`,
      chByDay: 'This week, by day', chBy: 'This week, by', nRows: n => n === 1 ? '1 row' : `${n} rows`,
      notPaid: 'Not paid yet', paidN: (n, t) => `${n} of ${t}`, paidLabel: 'Paid', joined: d => `joined ${d}`, chMembersBy: 'Members, by', chJoinedBy: 'Joined, by year',
      essentials: 'Essentials', theRest: 'The rest', progress: 'Steps done', essentialsDone: 'Essentials done', ofN: (n, t) => `${n} of ${t}`, chDoneByPhase: 'Done, by phase', essential: 'essential',
      allRows: 'All rows', open: 'Still to do', closed: 'Done or closed', upcoming: 'Coming up', past: 'Past', total: 'Total', rows: 'Rows', countBy: 'Rows, by', sumBy: 'Total, by', byPeriod: p => `By ${p}`,
      wc: d => `w/c ${d}`,
      runTitle: 'Finish this run', runSum: (v, d, s) => `${v}: ${d} done, ${s} skipped.`, runDone: 'Done', runSkipped: 'Skipped', runNote: 'Note for this run',
      runPh: 'Anything to remember next time?', runSave: 'Save this run', runSaved: 'Saved to the history. The marks are cleared for the next run.',
      hist: 'History', histEmpty: 'No runs yet. Mark items in the view, then save your first run.', histDel: 'Delete this record', histItem: (d, s) => `${d} done, ${s} skipped`,
      nav: { view: 'The view I use most', list: 'All rows', hist: 'History', about: 'About' },
      about: { what: 'What it does', where: 'Where the data is kept', not: 'What it does not do yet' },
      madeWith: d => `Made in a browser with the Spreadsheet to App prototype on ${d}. This file makes no requests to the internet.`,
      resetPub: 'Reset to the published data',
    },
    pt: {
      types: { text: 'Texto', category: 'Categoria', number: 'Número', money: 'Dinheiro', date: 'Data', time: 'Hora', bool: 'Sim/não', phone: 'Telefone' },
      yes: 'Sim', no: 'Não', empty: '(vazio)', all: 'Todos', search: n => `Pesquisar ${n} linhas`, showing: (n, t) => n === t ? `${t} linhas` : `${n} de ${t} linhas`,
      none: 'Nada corresponde. Limpe a pesquisa ou um filtro.', sortBy: 'Ordenar por', orig: 'Como no ficheiro', asc: 'Crescente', desc: 'Decrescente', clear: 'Limpar',
      more: n => `Mostrar mais ${n}`, add: 'Adicionar linha', edit: 'Editar', del: 'Apagar', sure: 'Apagar?', save: 'Guardar', cancel: 'Cancelar',
      addTitle: 'Adicionar uma linha', editTitle: 'Editar esta linha', exportCsv: 'Exportar CSV', importCsv: 'Importar CSV', reset: 'Repor o original', resetSure: 'Repor? As alterações perdem-se.',
      imported: n => `Importadas ${n} linhas.`, importDiff: 'Esse ficheiro tem outras colunas. Carregue-o como uma nova aplicação.', importFail: 'Não foi possível ler esse ficheiro como CSV.',
      saved: 'Guardado neste navegador.', deleted: 'Linha apagada.', added: 'Linha adicionada.', changed: 'Linha guardada.', storeFail: 'Este navegador não guardou; as alterações duram até fechar a página.',
      actions: 'Ações', required: 'Pelo menos um campo precisa de um valor.',
      done: 'Feito', ordered: 'Encomendado', chased: 'Cobrado', reminded: 'Lembrado',
      marked: (n, t, a) => `${n} de ${t} marcados "${a}"`, otherView: 'Outra vista', todayIs: 'Hoje é', useToday: 'Usar hoje',
      v: {
        stock: ['O que encomendar', 'Primeiro os artigos abaixo do mínimo, por fornecedor, com o que encomendar e quanto custa.'],
        invoices: ['Faturas por pagar', 'Primeiro as vencidas, as mais antigas no topo, com os totais.'],
        schedule: ['Hoje e esta semana', 'Primeiro hoje, depois o resto da semana, com quem, onde e o que falta pagar.'],
        members: ['Quem não pagou', 'Primeiro quem não pagou, depois todos os outros.'],
        checklist: ['O essencial primeiro, por fase', 'Primeiro os passos essenciais, depois o resto da fase.'],
        generic: ['O mais importante primeiro', 'Primeiro as linhas que ainda precisam de algo.'],
      },
      belowMin: 'Abaixo do mínimo', ofItems: n => `de ${n} artigos`, ofRows: n => `de ${n}`, nothing: 'Nada aqui.', outOfStock: 'Esgotados', costToMin: 'Para chegar ao mínimo', stockOf: (a, b, u) => `${a} de ${b}${u ? ' ' + u : ''} em stock`,
      orderAtLeast: (n, u) => `encomendar ${n}${u ? ' ' + u : ''}`, orderDay: d => `encomenda: ${d}`, orderToday: 'Hoje é dia de encomenda', aboveMin: 'No mínimo ou acima', belowGroup: 'Abaixo do mínimo',
      chCostCat: 'Custo para chegar ao mínimo, por', chValueCat: 'Valor em stock, por', chCountBelow: 'Artigos abaixo do mínimo, por',
      unpaid: 'Por pagar', overdue: 'Vencidas', notDue: 'Ainda não vencidas', paid: 'Pagas', withVat: v => `${v} com IVA`, daysOver: n => n === 1 ? 'vencida há 1 dia' : `vencida há ${n} dias`,
      dueIn: n => n === 0 ? 'vence hoje' : n === 1 ? 'vence amanhã' : `vence daqui a ${n} dias`, dueOn: d => `vence a ${d}`, nInv: n => n === 1 ? '1 fatura' : `${n} faturas`,
      chUnpaidBy: 'Por pagar, por', chIssuedBy: 'Faturado, por', week: 'semana', month: 'mês', year: 'ano',
      today: 'Hoje', thisWeek: 'Esta semana', earlier: 'Antes, nesta semana', people: 'Pessoas esta semana', takings: 'Receita esta semana', cancelled: n => `${n} cancelada(s), não mostrada(s)`,
      noneThisWeek: (a, b) => `Não há nada a ${a} nem nessa semana, por isso mostramos a semana de ${b} como se fosse hoje. Mude a data para ver outra semana.`,
      chByDay: 'Esta semana, por dia', chBy: 'Esta semana, por', nRows: n => n === 1 ? '1 linha' : `${n} linhas`,
      notPaid: 'Ainda não pagaram', paidN: (n, t) => `${n} de ${t}`, paidLabel: 'Pagaram', joined: d => `aderiu a ${d}`, chMembersBy: 'Membros, por', chJoinedBy: 'Adesões, por ano',
      essentials: 'Essencial', theRest: 'O resto', progress: 'Passos feitos', essentialsDone: 'Essenciais feitos', ofN: (n, t) => `${n} de ${t}`, chDoneByPhase: 'Feito, por fase', essential: 'essencial',
      allRows: 'Todas as linhas', open: 'Por fazer', closed: 'Feito ou fechado', upcoming: 'A seguir', past: 'Passado', total: 'Total', rows: 'Linhas', countBy: 'Linhas, por', sumBy: 'Total, por', byPeriod: p => `Por ${p}`,
      wc: d => `sem. ${d}`,
      runTitle: 'Terminar esta ronda', runSum: (v, d, s) => `${v}: ${d} feitos, ${s} saltados.`, runDone: 'Feitos', runSkipped: 'Saltados', runNote: 'Nota desta ronda',
      runPh: 'Algo a lembrar da próxima vez?', runSave: 'Guardar esta ronda', runSaved: 'Guardado no histórico. As marcas foram limpas para a próxima ronda.',
      hist: 'Histórico', histEmpty: 'Ainda não há rondas. Marque itens na vista e guarde a primeira ronda.', histDel: 'Apagar este registo', histItem: (d, s) => `${d} feitos, ${s} saltados`,
      nav: { view: 'A vista que mais uso', list: 'Todas as linhas', hist: 'Histórico', about: 'Sobre' },
      about: { what: 'O que faz', where: 'Onde ficam os dados', not: 'O que ainda não faz' },
      madeWith: d => `Feita num navegador com o protótipo Da folha de cálculo à aplicação a ${d}. Este ficheiro não faz pedidos à internet.`,
      resetPub: 'Repor os dados publicados',
    },
  };
  let lang = 'en';
  const W = () => L[lang];
  const loc = () => (lang === 'pt' ? 'pt-PT' : 'en-GB');

  /* ---------- small helpers ---------- */
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const pad = n => String(n).padStart(2, '0');
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const utc = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  const isoOf = ms => new Date(ms).toISOString().slice(0, 10);
  const addDays = (iso, n) => isoOf(utc(iso) + n * 864e5);
  const dayDiff = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
  const weekday = iso => new Date(utc(iso)).getUTCDay();
  const weekStart = iso => addDays(iso, -((weekday(iso) + 6) % 7));
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'app';
  const uid = () => 'r' + Math.random().toString(36).slice(2, 9);
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage blocked */ } },
  };
  const download = (name, text, type) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  const ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V8m-5 5 5-5 5 5M5 4h14"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    bin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  };

  /* ---------- parsing ---------- */
  const countOutside = (line, d) => { let q = false, n = 0; for (const ch of line) { if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; };
  function sniff(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 12);
    let best = ',', score = -1;
    for (const d of [',', ';', '\t', '|']) {
      const c = lines.map(l => countOutside(l, d)); if (!c[0]) continue;
      const s = c.filter(x => x === c[0]).length * 100 + c[0];
      if (s > score) { score = s; best = d; }
    }
    return best;
  }
  function parseCSV(text, d) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch;
      } else if (ch === '"' && f.trim() === '') { q = true; f = ''; }
      else if (ch === d) { row.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += ch;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  const isChecklistText = (text, name) => {
    if (/\.(md|markdown)$/i.test(name || '')) return true;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const bullets = lines.filter(l => /^\s*([-*+]|\d+[.)])\s+\S/.test(l)).length;
    return bullets >= 3 && bullets / lines.length >= 0.4 && countOutside(lines[0] || '', sniff(text)) === 0;
  };
  function parseChecklist(text, name) {
    const N = lang === 'pt' ? ['Fase', 'Passo', 'Essencial'] : ['Phase', 'Step', 'Essential'];
    let title = '', intro = [], phase = '', rows = [], done = {}, seenList = false;
    for (const raw of text.split(/\r?\n/)) {
      const l = raw.trim(); if (!l) continue;
      let m;
      if ((m = l.match(/^#\s+(.*)/)) && !title) { title = m[1].trim(); continue; }
      if ((m = l.match(/^#{2,6}\s+(.*)/))) { phase = m[1].replace(/[*_`]/g, '').trim(); seenList = true; continue; }
      if ((m = l.match(/^(?:[-*+]|\d+[.)])\s+(?:\[( |x|X)\]\s+)?(.*)$/))) {
        seenList = true;
        const t = m[2]; const key = /(\*\*|__)(.+?)\1/.test(t);
        const step = t.replace(/(\*\*|__)/g, '').replace(/[*_`]/g, '').trim();
        const id = uid(); rows.push({ _id: id, c0: phase || (lang === 'pt' ? 'Lista' : 'List'), c1: step, c2: key ? 'yes' : 'no' });
        if (m[1] && m[1].toLowerCase() === 'x') done[id] = 1;
        continue;
      }
      if (!seenList) intro.push(l.replace(/(\*\*|__)/g, ''));
    }
    const nice = (title || (name || '').replace(/\.[^.]+$/, '').replace(/^\d+-/, '').replace(/-/g, ' ')).split(/:\s/)[0];
    return {
      kind: 'checklist', name: nice.charAt(0).toUpperCase() + nice.slice(1), title, intro: intro.join(' '),
      cols: [{ key: 'c0', name: N[0], type: 'category' }, { key: 'c1', name: N[1], type: 'text', title: true }, { key: 'c2', name: N[2], type: 'bool', vocab: ['yes', 'no'] }],
      rows, done,
    };
  }
  function parse(text, name) {
    text = String(text || '').replace(/^\uFEFF/, '');
    if (!text.trim()) throw new Error('empty');
    let m;
    if (isChecklistText(text, name)) m = parseChecklist(text, name);
    else {
      const d = sniff(text);
      const grid = parseCSV(text, d).map(r => r.map(v => v.trim())).filter(r => r.some(v => v !== ''));
      if (grid.length < 1) throw new Error('empty');
      const head = grid[0]; const width = Math.max(...grid.map(r => r.length));
      const seen = {}; const cols = [];
      for (let i = 0; i < width; i++) {
        let n = (head[i] || '').trim() || (lang === 'pt' ? `Coluna ${i + 1}` : `Column ${i + 1}`);
        if (seen[n]) n = `${n} (${++seen[n]})`; else seen[n] = 1;
        cols.push({ key: 'c' + i, name: n });
      }
      const rows = grid.slice(1).map(r => { const o = { _id: uid() }; cols.forEach((c, i) => { o[c.key] = r[i] ?? ''; }); return o; });
      const nice = (name || 'My spreadsheet').replace(/\.[^.]+$/, '').replace(/^\d+-/, '').replace(/[-_]+/g, ' ').trim();
      m = { kind: 'table', name: nice.charAt(0).toUpperCase() + nice.slice(1), delim: d, cols, rows, done: {} };
      infer(m);
    }
    m.source = name || ''; m.id = (m.source ? slug(m.source) + '-' : '') + hash(text);
    return m;
  }

  /* ---------- values and types ---------- */
  const BOOL_T = ['yes', 'y', 'true', 'sim', 's', 'verdadeiro', 'x', '✓', '✔', 'ok'];
  const BOOL_F = ['no', 'n', 'false', 'nao', 'falso', '-'];
  const boolOf = v => { const s = norm(v).trim(); if (BOOL_T.includes(s)) return true; if (BOOL_F.includes(s) || s === '') return s === '' ? null : false; return undefined; };
  function numOf(v, delim) {
    let s = String(v ?? '').trim(); if (!s) return null;
    s = s.replace(/[€$£%\s\u00a0]|EUR|eur/g, '');
    if (!/^[-+]?[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
    const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
    if (lc > -1 && ld > -1) s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (lc > -1) { const after = s.length - lc - 1; s = ((s.match(/,/g) || []).length > 1 || (after === 3 && delim !== ';')) ? s.replace(/,/g, '') : s.replace(',', '.'); }
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    const n = Number(s); return Number.isFinite(n) ? n : null;
  }
  function dateOf(v) {
    const s = String(v ?? '').trim(); let m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?$/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) { if (+m[2] > 12) return null; return `${m[3]}-${pad(m[2])}-${pad(m[1])}`; }
    return null;
  }
  const timeOf = v => { const m = String(v ?? '').trim().match(/^(\d{1,2})[:h](\d{2})$/); return m && +m[1] < 24 ? `${pad(m[1])}:${m[2]}` : null; };
  const RX = {
    money: /(price|pre[cç]o|amount|total|cost|custo|valor|montante|paid|pago|fee|quota|eur\b|_eur|euro|€|usd|gbp|revenue|receita|salary|sal[aá]rio|balance|saldo|budget|or[cç]amento)/i,
    id: /^(id|n[ºo°.]?|num(ber)?|n[uú]mero|invoice|fatura|factura|ref(erence)?|refer[eê]ncia|code|c[oó]digo|sku|nif|nipc|postcode|zip|year|ano)$/i,
    phone: /(phone|tel\b|tel[eé]f|mobile|telem|cell|whatsapp|contacto)/i,
    notes: /(note|nota|comment|coment|descri|obs|remark|detail|detalhe|address|morada)/i,
    pct: /(pct|percent|%|taxa)/i,
  };
  function infer(m) {
    const n = m.rows.length;
    for (const c of m.cols) {
      if (c.fixed) continue;
      const vals = m.rows.map(r => r[c.key]).filter(v => v !== '');
      const t = guess(c, vals, n, m.delim); Object.assign(c, t);
    }
    const tc = pickTitle(m.cols, m.rows); m.cols.forEach(c => { c.title = c === tc; });
  }
  function guess(c, vals, n, delim) {
    const name = c.name;
    if (!vals.length) return { type: 'text' };
    const b = vals.map(boolOf);
    if (b.every(x => x === true || x === false)) {
      const tw = vals.find((v, i) => b[i]); const fw = vals.find((v, i) => b[i] === false);
      return { type: 'bool', vocab: [tw || 'yes', fw || 'no'] };
    }
    if (vals.every(v => dateOf(v))) return { type: 'date', fmt: /^\d{4}-/.test(vals[0]) ? 'iso' : 'dmy' + (vals[0].match(/[/.-]/) || ['/'])[0] };
    if (vals.every(v => timeOf(v))) return { type: 'time' };
    const phoneish = vals.every(v => /^\+?[\d\s().-]{7,}$/.test(v) && (v.match(/\d/g) || []).length >= 7);
    if (phoneish && (RX.phone.test(name) || vals.every(v => v.startsWith('+')) || vals.every(v => /\d\s\d/.test(v)))) return { type: 'phone' };
    const nums = vals.map(v => numOf(v, delim));
    if (nums.every(x => x !== null) && !vals.some(v => /^0\d/.test(v)) && !RX.id.test(name)) {
      const sym = vals.join('').match(/[€$£]/);
      if (RX.money.test(name) || sym) return { type: 'money', cur: sym ? ({ '$': 'USD', '£': 'GBP' }[sym[0]] || 'EUR') : 'EUR' };
      return { type: 'number', unit: RX.pct.test(name) || vals.some(v => v.includes('%')) ? '%' : '' };
    }
    const distinct = new Set(vals.map(norm)).size;
    const avg = vals.reduce((a, v) => a + v.length, 0) / vals.length;
    const withEmpty = distinct + (vals.length < n ? 1 : 0);
    if (!RX.notes.test(name) && avg <= 28 && distinct <= Math.max(2, Math.min(20, Math.ceil(n * 0.75))) && (withEmpty < n || n <= 3)) return { type: 'category' };
    return { type: 'text' };
  }
  function pickTitle(cols, rows) {
    const pref = /^(name|nome|item|artigo|produto|product|student|aluno|member|membro|client|cliente|title|t[ií]tulo|step|passo|task|tarefa|invoice|fatura)/i;
    const cand = cols.filter(c => c.type === 'text' || c.type === 'category');
    const uniq = c => new Set(rows.map(r => norm(r[c.key]))).size / Math.max(1, rows.length);
    return cand.find(c => c.type === 'text' && pref.test(c.name) && uniq(c) > 0.6) || cand.find(c => c.type === 'text' && uniq(c) > 0.7 && !RX.notes.test(c.name)) || cand.find(c => pref.test(c.name)) || cand[0] || cols[0];
  }
  const nice = name => {
    let s = String(name).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    s = s.replace(/\b(eur|euro)$/i, '(€)').replace(/\bpct$/i, '(%)').replace(/\b(vat|iva|id|nif|url|sku)\b/gi, x => x.toUpperCase());
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  /* ---------- formatting ---------- */
  const moneyFmt = (n, cur = 'EUR') => new Intl.NumberFormat(loc(), { style: 'currency', currency: cur }).format(n);
  const numFmt = n => new Intl.NumberFormat(loc(), { maximumFractionDigits: 2 }).format(n);
  const dateFmt = (iso, opts) => new Intl.DateTimeFormat(loc(), Object.assign({ day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }, opts)).format(new Date(utc(iso)));
  const dayFmt = iso => dateFmt(iso, { weekday: 'long', day: 'numeric', month: 'short', year: undefined });
  function fmtText(v, c) {
    if (v === '' || v == null) return '';
    switch (c.type) {
      case 'money': { const n = numOf(v); return n === null ? v : moneyFmt(n, c.cur); }
      case 'number': { const n = numOf(v); return n === null ? v : numFmt(n) + (c.unit === '%' ? '%' : ''); }
      case 'date': { const d = dateOf(v); return d ? dateFmt(d) : v; }
      case 'bool': { const b = boolOf(v); return b === true ? W().yes : b === false ? W().no : v; }
      default: return v;
    }
  }
  function fmtHTML(v, c) {
    if (v === '' || v == null) return '<span class="s2a-nil" aria-label="' + esc(W().empty) + '">·</span>';
    if (c.type === 'bool') { const b = boolOf(v); return `<span class="s2a-pill ${b ? 'is-yes' : 'is-no'}">${esc(fmtText(v, c))}</span>`; }
    if (c.type === 'phone') return `<a class="s2a-tel" href="tel:${esc(v.replace(/[^\d+]/g, ''))}">${esc(v)}</a>`;
    if (c.type === 'category') return `<span class="s2a-chip">${esc(v)}</span>`;
    return esc(fmtText(v, c));
  }
  function sortVal(v, c) {
    if (v === '' || v == null) return null;
    if (c.type === 'money' || c.type === 'number') return numOf(v);
    if (c.type === 'date') return dateOf(v);
    if (c.type === 'bool') return boolOf(v) ? 1 : 0;
    return norm(v);
  }
  const cmp = (a, b) => (a === null ? 1 : b === null ? -1 : a < b ? -1 : a > b ? 1 : 0);

  /* ---------- the app instance ---------- */
  function makeApp(model, opts = {}) {
    const key = opts.key || ('s2a:v1:' + model.id);
    const fresh = () => ({ v: 1, meta: { id: model.id, name: model.name, source: model.source, kind: model.kind, intro: model.intro || '', delim: model.delim || ',' },
      cols: JSON.parse(JSON.stringify(model.cols)), rows: JSON.parse(JSON.stringify(model.rows)), done: Object.assign({}, model.done || {}), hist: [], viewKind: null, ref: null });
    const saved = opts.noRestore ? null : store.get(key);
    const sig = (cols, rows) => JSON.stringify([cols.map(c => [c.name, c.type]), rows.map(r => cols.map(c => r[c.key]))]);
    const changed = saved && saved.rows && (saved.hist?.length || Object.keys(saved.done || {}).length || saved.about || saved.appName || sig(saved.cols, saved.rows) !== sig(model.cols, model.rows));
    const A = {
      key, model, st: saved && saved.v === 1 && saved.rows ? saved : fresh(), restored: !!changed, ui: { q: '', f: {}, sort: null, phase: null, limit: 50 },
      opts, storeOk: true,
      cols() { return A.st.cols; },
      titleCol() { return A.st.cols.find(c => c.title) || A.st.cols[0]; },
      save() { A.storeOk = store.set(key, A.st); return A.storeOk; },
      reset() { A.st = fresh(); store.del(key); A.ui = { q: '', f: {}, sort: null, phase: null, limit: 50 }; },
      changed() { A.save(); if (opts.onChange) opts.onChange(A); },
    };
    if (!A.restored) A.save();
    return A;
  }

  /* ---------- views ("the view I use most") ---------- */
  const byName = (cols, rx, types) => cols.find(c => (!types || types.includes(c.type)) && rx.test(c.name));
  const SCHED_NOT = /(due|venc|join|ades|last|[uú]ltim|creat|criad|order|encomend|paid|pago|issued|emit|birth|nasc|updated)/i;
  function detect(A) {
    const c = A.cols(), out = [];
    const ess = byName(c, /(essential|important|key|crit|essencial|importante|obrigat|must)/i, ['bool']);
    if (A.st.meta.kind === 'checklist' || ess) out.push('checklist');
    if (byName(c, /(stock|qty|quant|on.?hand|exist|invent)/i, ['number', 'money']) && byName(c, /(min|reorder|\bpar\b|threshold|limiar)/i, ['number', 'money'])) out.push('stock');
    if (byName(c, /(due|venc|prazo|deadline|limite)/i, ['date']) && c.some(x => x.type === 'money')) out.push('invoices');
    if (byName(c, /(paid|pago|pag|quota|fee|dues|subscri)/i, ['bool'])) out.push('members');
    if (c.some(x => x.type === 'date' && !SCHED_NOT.test(x.name) && (/^(date|data|day|dia|when|quando|start|in[ií]cio|lesson|aula|session|sess|booking|reserva|event|evento)/i.test(x.name) || c.some(y => y.type === 'time')))) out.push('schedule');
    out.push('generic');
    return out;
  }
  const rowTitle = (A, r) => r[A.titleCol().key] || W().empty;
  function metaOf(A, r, skip, max = 4) {
    return A.cols().filter(c => !c.title && !skip.includes(c) && r[c.key] !== '' && c.type !== 'phone' && !(c.type === 'text' && String(r[c.key]).length > 60))
      .slice(0, max).map(c => c.type === 'bool' ? (boolOf(r[c.key]) ? nice(c.name) : '') : (c.type === 'text' || c.type === 'category' ? fmtText(r[c.key], c) : `${nice(c.name)}: ${fmtText(r[c.key], c)}`)).filter(Boolean);
  }
  function buckets(pairs) { // pairs: [iso, value]
    const ds = pairs.map(p => p[0]).sort(); if (!ds.length) return null;
    const span = dayDiff(ds[0], ds[ds.length - 1]);
    const unit = span <= 70 ? 'week' : span <= 800 ? 'month' : 'year';
    const keyOf = d => unit === 'week' ? weekStart(d) : unit === 'month' ? d.slice(0, 7) : d.slice(0, 4);
    const lab = k => unit === 'week' ? dateFmt(k, { year: undefined }) : unit === 'month' ? dateFmt(k + '-01', { day: undefined }) : k;
    const full = k => unit === 'week' ? W().wc(dateFmt(k)) : lab(k);
    const map = new Map();
    let k = keyOf(ds[0]); const end = keyOf(ds[ds.length - 1]); let guard = 0;
    while (guard++ < 60) { map.set(k, 0); if (k === end) break; k = unit === 'week' ? addDays(k, 7) : unit === 'month' ? keyOf(addDays(k + '-28', 7)) : String(+k + 1); }
    for (const [d, v] of pairs) { const kk = keyOf(d); if (map.has(kk)) map.set(kk, map.get(kk) + v); }
    return { unit, data: [...map].map(([kk, v]) => ({ label: lab(kk), full: full(kk), value: v })) };
  }
  const tally = (rows, col, val = () => 1) => {
    const m = new Map(); for (const r of rows) { const k = r[col.key] || W().empty; m.set(k, (m.get(k) || 0) + val(r)); }
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  };
  const tile = (label, value, sub) => ({ label, value, sub });

  function view(A, kind) {
    const c = A.cols(), rows = A.st.rows, w = W(), f = VIEWS[kind] || VIEWS.generic;
    const v = f(A, c, rows, w); v.kind = kind; [v.title, v.intro] = w.v[kind] || w.v.generic;
    v.items = v.groups.filter(g => g.todo).flatMap(g => g.items);
    return v;
  }
  const VIEWS = {
    stock(A, c, rows, w) {
      const s = byName(c, /(stock|qty|quant|on.?hand|exist|invent)/i, ['number', 'money']), mn = byName(c, /(min|reorder|\bpar\b|threshold|limiar)/i, ['number', 'money']);
      const price = byName(c, /(price|pre[cç]o|cost|custo|unit.?price)/i, ['money']) || c.find(x => x.type === 'money' && x !== s && x !== mn);
      const sup = byName(c, /(supplier|fornecedor|vendor|provider)/i, ['text', 'category']);
      const ph = c.find(x => x.type === 'phone');
      const day = byName(c, /(order.?day|dia|day|weekday)/i, ['text', 'category']);
      const unit = byName(c, /^(unit|unidade|un)$/i, ['text', 'category']);
      const cat = byName(c, /(categor|type|tipo|section|sec[cç]|family|fam[ií]lia|group|grupo)/i, ['category']) || c.find(x => x.type === 'category' && ![sup, day, unit].includes(x));
      const today = A.st.ref || todayISO(); const wd = weekday(today);
      const DAYS = [['sunday', 'domingo'], ['monday', 'segunda'], ['tuesday', 'terca'], ['wednesday', 'quarta'], ['thursday', 'quinta'], ['friday', 'sexta'], ['saturday', 'sabado']];
      const orderToday = r => { if (!day) return false; const d = norm(r[day.key]); return /^(daily|every ?day|diari|todos os dias)/.test(d) || DAYS[wd].some(x => d.startsWith(x.slice(0, 3)) && x.startsWith(d.slice(0, 3))); };
      const n = r => numOf(r[s.key]) ?? 0, m = r => numOf(r[mn.key]) ?? 0;
      const below = rows.filter(r => n(r) < m(r)).sort((a, b) => ((n(a) > 0) - (n(b) > 0)) || n(a) / (m(a) || 1) - n(b) / (m(b) || 1));
      const need = r => m(r) - n(r), cost = r => price ? need(r) * (numOf(r[price.key]) ?? 0) : 0;
      const skip = [s, mn, sup, ph, day, unit, price].filter(Boolean);
      const item = r => ({ id: r._id, title: rowTitle(A, r), meta: [w.stockOf(numFmt(n(r)), numFmt(m(r)), unit ? r[unit.key] : ''), w.orderAtLeast(numFmt(need(r)), unit ? r[unit.key] : '')].concat(metaOf(A, r, skip.concat(c.filter(x => x.type === 'date')), 1)),
        amount: price ? moneyFmt(cost(r), price.cur) : '', badge: n(r) <= 0 ? { t: w.outOfStock, tone: 'crit' } : orderToday(r) ? { t: w.orderToday, tone: 'good' } : null });
      const groups = [];
      if (sup) {
        const by = new Map(); for (const r of below) { const k = r[sup.key] || w.empty; if (!by.has(k)) by.set(k, []); by.get(k).push(r); }
        const list = [...by].sort((a, b) => (b[1].some(orderToday) - a[1].some(orderToday)) || a[0].localeCompare(b[0]));
        for (const [k, rs] of list) groups.push({ title: k, todo: true, sub: [ph && rs[0][ph.key] ? `<a class="s2a-tel" href="tel:${esc(rs[0][ph.key].replace(/[^\d+]/g, ''))}">${ICON.phone}${esc(rs[0][ph.key])}</a>` : '', day && rs[0][day.key] ? esc(w.orderDay(rs[0][day.key])) : ''].filter(Boolean).join(' · '), items: rs.map(item) });
      } else groups.push({ title: w.belowGroup, todo: true, items: below.map(item) });
      const rest = rows.filter(r => !below.includes(r));
      if (rest.length) groups.push({ title: w.aboveMin, todo: false, closed: true, items: rest.map(r => ({ id: r._id, title: rowTitle(A, r), meta: [w.stockOf(numFmt(n(r)), numFmt(m(r)), unit ? r[unit.key] : '')] })) });
      const tiles = [tile(w.belowMin, String(below.length), w.ofItems(rows.length)), tile(w.outOfStock, String(rows.filter(r => n(r) <= 0).length))];
      if (price) tiles.push(tile(w.costToMin, moneyFmt(below.reduce((a, r) => a + cost(r), 0), price.cur)));
      const charts = [];
      if (cat && price) {
        charts.push({ title: `${w.chCostCat} ${nice(cat.name).toLowerCase()}`, money: price.cur, data: tally(below, cat, cost) });
        charts.push({ title: `${w.chValueCat} ${nice(cat.name).toLowerCase()}`, money: price.cur, data: tally(rows, cat, r => n(r) * (numOf(r[price.key]) ?? 0)) });
      } else if (cat) charts.push({ title: `${w.chCountBelow} ${nice(cat.name).toLowerCase()}`, data: tally(below, cat) });
      return { action: w.ordered, tiles, groups, charts, keyCols: [s, mn, sup, day].filter(Boolean) };
    },
    invoices(A, c, rows, w) {
      const due = byName(c, /(due|venc|prazo|deadline|limite)/i, ['date']);
      const amt = byName(c, /(amount|total|valor|montante|value)/i, ['money']) || c.find(x => x.type === 'money');
      const pd = byName(c, /(paid|pago|pagamento|payment|settled|liquid)/i, ['date']);
      const pb = byName(c, /(paid|pago)/i, ['bool']);
      const stc = byName(c, /(status|estado|state)/i, ['category', 'text']);
      const cli = byName(c, /(client|cliente|customer|comprador|buyer)/i, ['text', 'category']);
      const vat = byName(c, /(vat|iva|tax)/i, ['number']);
      const issued = byName(c, /(issued|emit|date|data|sent|enviad)/i, ['date']);
      const ref = A.st.ref || todayISO();
      const paid = r => pd ? !!dateOf(r[pd.key]) : pb ? boolOf(r[pb.key]) === true : stc ? /(paid|pago|settled|liquidad)/i.test(r[stc.key]) : false;
      const a = r => numOf(r[amt.key]) ?? 0, withV = r => vat ? a(r) * (1 + (numOf(r[vat.key]) ?? 0) / 100) : a(r);
      const unpaid = rows.filter(r => !paid(r)), dd = r => dateOf(r[due.key]);
      const over = unpaid.filter(r => dd(r) && dd(r) < ref).sort((x, y) => dd(x).localeCompare(dd(y)));
      const notDue = unpaid.filter(r => !over.includes(r)).sort((x, y) => cmp(dd(x), dd(y)));
      const skip = [due, amt, pd, pb, vat, cli, issued].filter(Boolean);
      const title = r => cli && !cli.title ? `${rowTitle(A, r)} · ${r[cli.key]}` : rowTitle(A, r);
      const item = r => {
        const d = dd(r), late = d ? dayDiff(d, ref) : 0;
        return { id: r._id, title: title(r), meta: [d ? w.dueOn(dateFmt(d)) : ''].concat(metaOf(A, r, skip, 2)).filter(Boolean), amount: moneyFmt(a(r), amt.cur), sub: vat ? w.withVat(moneyFmt(withV(r), amt.cur)) : '',
          badge: d && late > 0 ? { t: w.daysOver(late), tone: 'crit' } : d && -late <= 7 ? { t: w.dueIn(-late), tone: 'warn' } : null };
      };
      const sum = (rs, fn = a) => moneyFmt(rs.reduce((x, r) => x + fn(r), 0), amt.cur);
      const groups = [{ title: w.overdue, todo: true, items: over.map(item) }, { title: w.notDue, todo: true, items: notDue.map(item) }];
      const pr = rows.filter(paid); if (pr.length) groups.push({ title: w.paid, todo: false, closed: true, items: pr.map(r => ({ id: r._id, title: title(r), meta: pd ? [`${w.paid}: ${fmtText(r[pd.key], pd)}`] : [], amount: moneyFmt(a(r), amt.cur) })) });
      const tiles = [tile(w.unpaid, sum(unpaid), w.nInv(unpaid.length) + (vat ? ' · ' + w.withVat(sum(unpaid, withV)) : '')), tile(w.overdue, sum(over), w.nInv(over.length)), tile(w.paid, sum(pr), w.nInv(pr.length))];
      const charts = [];
      if (cli) charts.push({ title: `${w.chUnpaidBy} ${nice(cli.name).toLowerCase()}`, money: amt.cur, data: tally(unpaid, cli, a) });
      const bk = issued ? buckets(rows.filter(r => dateOf(r[issued.key])).map(r => [dateOf(r[issued.key]), a(r)])) : null;
      if (bk) charts.push({ title: `${w.chIssuedBy} ${w[bk.unit]}`, money: amt.cur, vertical: true, data: bk.data });
      return { action: w.chased, tiles, groups, charts, refControl: true, keyCols: [cli, due, amt, pd || pb].filter(Boolean) };
    },
    schedule(A, c, rows, w) {
      const dc = c.find(x => x.type === 'date' && !SCHED_NOT.test(x.name) && /^(date|data|day|dia|when|quando|start|in[ií]cio|lesson|aula|session|sess|booking|reserva|event|evento)/i.test(x.name)) || c.find(x => x.type === 'date' && !SCHED_NOT.test(x.name));
      const tc = c.find(x => x.type === 'time');
      const stc = byName(c, /(status|estado|state)/i, ['category', 'text']);
      const money = c.find(x => x.type === 'money');
      const ppl = byName(c, /(group|size|people|pax|pessoas|participants|participantes|alunos|guests|h[oó]spedes)/i, ['number']);
      const who = byName(c, /(instructor|teacher|staff|professor|monitor|coach|treinador|guia|guide|host)/i, ['category', 'text']) || c.find(x => x.type === 'category' && x !== stc && !x.title);
      const cancelled = r => stc && /(cancel|anulad)/i.test(r[stc.key]);
      const d = r => dateOf(r[dc.key]);
      const act = rows.filter(r => d(r) && !cancelled(r));
      let ref = A.st.ref || todayISO(), note = '';
      const inWeek = (r, ws) => d(r) >= ws && d(r) <= addDays(ws, 6);
      if (!A.st.ref && !act.some(r => inWeek(r, weekStart(ref)))) {
        const ds = act.map(d).sort(); const fut = ds.find(x => x >= ref);
        if (ds.length) { const ws = weekStart(fut || ds[ds.length - 1]); const nr = ds.find(x => x >= ws); note = w.noneThisWeek(dateFmt(ref), dateFmt(nr)); ref = nr; }
      }
      const ws = weekStart(ref), week = act.filter(r => inWeek(r, ws));
      const byTime = (x, y) => cmp(d(x), d(y)) || cmp(tc ? timeOf(x[tc.key]) : null, tc ? timeOf(y[tc.key]) : null);
      const skip = [dc, tc, money].filter(Boolean);
      const item = r => {
        const s = stc ? norm(r[stc.key]) : '';
        return { id: r._id, title: (tc && r[tc.key] ? r[tc.key] + ' · ' : '') + rowTitle(A, r), meta: metaOf(A, r, skip.concat(stc ? [stc] : []), 5), amount: money && r[money.key] ? fmtText(r[money.key], money) : '',
          badge: stc && /(unpaid|deposit|pending|por pagar|sinal|pendente)/.test(s) ? { t: r[stc.key], tone: 'warn' } : null };
      };
      const groups = [];
      const days = [...new Set(week.map(d))].sort();
      for (const dy of days.filter(x => x >= ref)) groups.push({ title: dy === ref ? `${w.today}, ${dayFmt(dy)}` : dayFmt(dy), todo: true, items: week.filter(r => d(r) === dy).sort(byTime).map(item) });
      const early = week.filter(r => d(r) < ref).sort(byTime);
      if (early.length) groups.push({ title: w.earlier, todo: false, closed: true, items: early.map(item) });
      if (!groups.length) groups.push({ title: w.thisWeek, todo: true, items: [] });
      const cw = rows.filter(r => d(r) && cancelled(r) && inWeek(r, ws)).length;
      const tiles = [tile(w.today, String(week.filter(r => d(r) === ref).length), dateFmt(ref)), tile(w.thisWeek, String(week.length), cw ? w.cancelled(cw) : W().wc(dateFmt(ws, { year: undefined })))];
      if (ppl) tiles.push(tile(w.people, numFmt(week.reduce((x, r) => x + (numOf(r[ppl.key]) ?? 0), 0))));
      if (money) tiles.push(tile(w.takings, moneyFmt(week.reduce((x, r) => x + (numOf(r[money.key]) ?? 0), 0), money.cur)));
      const charts = [];
      const perDay = []; for (let i = 0; i < 7; i++) { const dy = addDays(ws, i); perDay.push({ label: dateFmt(dy, { weekday: 'short', day: undefined, month: undefined, year: undefined }).replace('.', '').slice(0, 3) + ' ' + +dy.slice(8), full: dayFmt(dy), value: week.filter(r => d(r) === dy).reduce((x, r) => x + (ppl ? (numOf(r[ppl.key]) ?? 0) : 1), 0) }); }
      charts.push({ title: w.chByDay + (ppl ? ` (${nice(ppl.name).toLowerCase()})` : ''), vertical: true, data: perDay });
      if (who) charts.push({ title: `${w.chBy} ${nice(who.name).toLowerCase()}`, data: tally(week, who) });
      return { action: w.done, tiles, groups, charts, note, ref, refControl: true, keyCols: [dc, tc, who, stc, money].filter(Boolean) };
    },
    members(A, c, rows, w) {
      const pb = byName(c, /(paid|pago|pag|quota|fee|dues|subscri)/i, ['bool']);
      const typ = byName(c, /(member|tipo|type|categor|plan|plano|tier|n[ií]vel|level)/i, ['category']) || c.find(x => x.type === 'category' && !x.title);
      const jn = byName(c, /(join|ades|since|desde|start|in[ií]cio)/i, ['date']);
      const unpaid = rows.filter(r => boolOf(r[pb.key]) !== true), paidR = rows.filter(r => boolOf(r[pb.key]) === true);
      const skip = [pb, jn].filter(Boolean);
      const item = r => ({ id: r._id, title: rowTitle(A, r), meta: (jn && dateOf(r[jn.key]) ? [w.joined(dateFmt(dateOf(r[jn.key])))] : []).concat(metaOf(A, r, skip, 4)) });
      const groups = [{ title: w.notPaid, todo: true, items: unpaid.map(item) }, { title: w.paidLabel, todo: false, closed: true, items: paidR.map(item) }];
      const tiles = [tile(w.notPaid, String(unpaid.length), w.ofRows(rows.length)), tile(w.paidLabel, w.paidN(paidR.length, rows.length))];
      const charts = [];
      if (typ) charts.push({ title: `${/(member|membro|s[oó]cio|associad)/i.test(A.titleCol().name) ? w.chMembersBy : w.countBy} ${nice(typ.name).toLowerCase()}`, data: tally(rows, typ) });
      if (jn) { const bk = buckets(rows.filter(r => dateOf(r[jn.key])).map(r => [dateOf(r[jn.key]), 1])); if (bk) charts.push({ title: `${w.byPeriod(w[bk.unit])}: ${nice(jn.name).toLowerCase()}`, vertical: true, data: bk.data }); }
      return { action: w.reminded, tiles, groups, charts, keyCols: [pb, typ, jn].filter(Boolean) };
    },
    checklist(A, c, rows, w) {
      const ess = byName(c, /(essential|important|key|crit|essencial|importante|obrigat|must)/i, ['bool']);
      const ph = byName(c, /(phase|fase|section|sec[cç]|stage|etapa|when|quando|part|parte)/i, ['category', 'text']) || c.find(x => x.type === 'category' && !x.title);
      const phases = ph ? [...new Set(rows.map(r => r[ph.key] || w.empty))] : [''];
      if (!phases.includes(A.ui.phase)) A.ui.phase = phases[0];
      const inPh = rows.filter(r => !ph || (r[ph.key] || w.empty) === A.ui.phase);
      const isE = r => ess && boolOf(r[ess.key]) === true;
      const item = r => ({ id: r._id, title: rowTitle(A, r), key: isE(r), meta: metaOf(A, r, [ph, ess].filter(Boolean), 2) });
      const e = inPh.filter(isE), rest = inPh.filter(r => !isE(r));
      const groups = ess ? [{ title: w.essentials, todo: true, items: e.map(item) }, { title: w.theRest, todo: true, items: rest.map(item) }] : [{ title: A.ui.phase || w.allRows, todo: true, items: inPh.map(item) }];
      const dn = r => !!A.st.done[r._id];
      const tiles = [tile(w.progress, w.ofN(inPh.filter(dn).length, inPh.length), A.ui.phase)];
      if (ess) tiles.push(tile(w.essentialsDone, w.ofN(e.filter(dn).length, e.length)));
      const charts = ph ? [{ title: w.chDoneByPhase, pct: true, data: phases.map(p => { const rs = rows.filter(r => (r[ph.key] || w.empty) === p); return { label: p, value: rs.length ? rs.filter(dn).length / rs.length : 0, text: w.ofN(rs.filter(dn).length, rs.length) }; }) }] : [];
      return { action: w.done, tiles, groups, charts, phases: ph ? phases : null, keyCols: [ph, ess].filter(Boolean) };
    },
    generic(A, c, rows, w) {
      const stc = byName(c, /(status|estado|state|stage|etapa)/i, ['category']);
      const dc = c.find(x => x.type === 'date'), bc = c.find(x => x.type === 'bool'), cat = c.find(x => x.type === 'category' && !x.title);
      const money = c.find(x => x.type === 'money') || c.find(x => x.type === 'number');
      const ref = A.st.ref || todayISO();
      const item = r => ({ id: r._id, title: rowTitle(A, r), meta: metaOf(A, r, money ? [money] : [], 4), amount: money && r[money.key] ? fmtText(r[money.key], money) : '' });
      let groups;
      const CLOSED = /(done|closed|complete|finished|paid|cancel|feito|fechad|conclu|pago|cancelad|resolved|resolvid)/i;
      if (stc) {
        const vals = [...new Set(rows.map(r => r[stc.key] || w.empty))].sort((a, b) => CLOSED.test(a) - CLOSED.test(b));
        groups = vals.map(v => ({ title: v, todo: !CLOSED.test(v), closed: CLOSED.test(v), items: rows.filter(r => (r[stc.key] || w.empty) === v).map(item) }));
      } else if (dc) {
        const d = r => dateOf(r[dc.key]);
        groups = [{ title: w.upcoming, todo: true, items: rows.filter(r => d(r) && d(r) >= ref).sort((a, b) => d(a).localeCompare(d(b))).map(item) },
          { title: w.past, todo: false, closed: true, items: rows.filter(r => !d(r) || d(r) < ref).sort((a, b) => cmp(d(b), d(a))).map(item) }];
      } else if (bc) {
        groups = [{ title: `${nice(bc.name)}: ${w.no}`, todo: true, items: rows.filter(r => boolOf(r[bc.key]) !== true).map(item) }, { title: `${nice(bc.name)}: ${w.yes}`, todo: false, closed: true, items: rows.filter(r => boolOf(r[bc.key]) === true).map(item) }];
      } else groups = [{ title: w.allRows, todo: true, items: rows.map(item) }];
      const tiles = [tile(w.rows, String(rows.length))];
      if (money) tiles.push(tile(w.total, money.type === 'money' ? moneyFmt(rows.reduce((x, r) => x + (numOf(r[money.key]) ?? 0), 0), money.cur) : numFmt(rows.reduce((x, r) => x + (numOf(r[money.key]) ?? 0), 0)), nice(money.name)));
      if (cat) tiles.push(tile(nice(cat.name), String(new Set(rows.map(r => r[cat.key])).size)));
      const charts = [];
      if (cat) charts.push(money ? { title: `${w.sumBy} ${nice(cat.name).toLowerCase()}`, money: money.type === 'money' ? money.cur : null, data: tally(rows, cat, r => numOf(r[money.key]) ?? 0) } : { title: `${w.countBy} ${nice(cat.name).toLowerCase()}`, data: tally(rows, cat) });
      if (dc) { const bk = buckets(rows.filter(r => dateOf(r[dc.key])).map(r => [dateOf(r[dc.key]), 1])); if (bk && bk.data.length > 1) charts.push({ title: `${w.countBy} ${w[bk.unit]}`, vertical: true, data: bk.data }); }
      return { action: w.done, tiles, groups, charts, refControl: !!dc, keyCols: [stc, dc, bc, cat].filter(Boolean) };
    },
  };

  /* ---------- charts (SVG, one series, drawn here) ---------- */
  const fmtV = (ch, v, d) => d && d.text ? d.text : ch.pct ? Math.round(v * 100) + '%' : ch.money ? moneyFmt(v, ch.money) : numFmt(v);
  const barPath = (x, y, wd, h, r, vertical) => {
    if (wd <= 0 || h <= 0) return '';
    r = Math.min(r, vertical ? wd / 2 : h / 2, vertical ? h : wd);
    return vertical
      ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + wd - r}Q${x + wd},${y} ${x + wd},${y + r}V${y + h}Z`
      : `M${x},${y}H${x + wd - r}Q${x + wd},${y} ${x + wd},${y + r}V${y + h - r}Q${x + wd},${y + h} ${x + wd - r},${y + h}H${x}Z`;
  };
  function chartSVG(ch, width) {
    const Wd = Math.max(200, Math.round(width || 320));
    const data = ch.data.filter(d => ch.vertical || d.value > 0 || ch.pct);
    if (!data.length || (!ch.pct && data.every(d => !d.value))) return '';
    const max = ch.pct ? 1 : Math.max(...data.map(d => d.value)) || 1;
    const table = `<table class="s2a-sr"><caption>${esc(ch.title)}</caption><tbody>${data.map(d => `<tr><th scope="row">${esc(d.full || d.label)}</th><td>${esc(fmtV(ch, d.value, d))}</td></tr>`).join('')}</tbody></table>`;
    let svg;
    if (ch.vertical) {
      const H = 160, top = 18, bottom = 30, n = data.length, gap = n > 10 ? 3 : 8, bw = (Wd - gap * (n - 1)) / n;
      const lw = Math.max(...data.map(d => String(d.label).length)) * 6.6 + 10, every = Math.max(1, Math.ceil(n * lw / Wd)), lab = every === 1 && bw > 22;
      svg = `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${esc(ch.title)}"><line class="s2a-axis" x1="0" x2="${Wd}" y1="${H - bottom + .5}" y2="${H - bottom + .5}"/>` + data.map((d, i) => {
        const h = (H - top - bottom) * d.value / max, x = i * (bw + gap), y = H - bottom - h;
        return `<g><title>${esc(d.full || d.label)}: ${esc(fmtV(ch, d.value, d))}</title><rect class="s2a-hit" x="${x}" y="0" width="${bw}" height="${H}"/><path class="s2a-cbar" d="${barPath(x, y, bw, h, 4, true)}"/>` +
          (lab && d.value ? `<text class="s2a-val" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${esc(ch.money ? numFmt(Math.round(d.value)) : fmtV(ch, d.value, d))}</text>` : '') +
          (i % every === 0 ? `<text class="s2a-lab" x="${x + bw / 2}" y="${H - bottom + 17}" text-anchor="middle">${esc(String(d.label).slice(0, 12))}</text>` : '') + '</g>';
      }).join('') + '</svg>';
    } else {
      const row = 40, H = data.length * row;
      svg = `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${esc(ch.title)}">` + data.map((d, i) => {
        const y = i * row, txt = fmtV(ch, d.value, d), room = Wd - 8 - txt.length * 7.2, bw = Math.max(d.value ? 3 : 0, room * d.value / max);
        return `<g><title>${esc(d.label)}: ${esc(txt)}</title><rect class="s2a-hit" x="0" y="${y}" width="${Wd}" height="${row}"/><text class="s2a-lab" x="0" y="${y + 13}">${esc(String(d.label).slice(0, Math.floor(Wd / 7)))}</text>` +
          (ch.pct ? `<rect class="s2a-track" x="0" y="${y + 19}" width="${room}" height="12" rx="4"/>` : '') +
          `<path class="s2a-cbar" d="${barPath(0, y + 19, bw, 12, 4, false)}"/><text class="s2a-val" x="${(ch.pct ? room : bw) + 6}" y="${y + 29.5}">${esc(txt)}</text></g>`;
      }).join('') + '</svg>';
    }
    return `<figure class="s2a-chart"><figcaption>${esc(ch.title)}</figcaption>${svg}${table}</figure>`;
  }

  /* ---------- the list (prompts 1 and 2) ---------- */
  function orderedCols(A) {
    const cols = A.cols(), tc = A.titleCol(); let key = [];
    try { key = view(A, A.st.viewKind || detect(A)[0]).keyCols || []; } catch { key = []; }
    const keyKeys = key.map(c => c.key);
    const isLong = c => c.type === 'text' && (RX.notes.test(c.name) || A.st.rows.some(r => String(r[c.key]).length > 60));
    return [tc].concat(cols.filter(c => keyKeys.includes(c.key) && c !== tc), cols.filter(c => !keyKeys.includes(c.key) && c !== tc && !isLong(c)), cols.filter(c => c !== tc && !keyKeys.includes(c.key) && isLong(c)));
  }
  function filtered(A) {
    const cols = A.cols(), q = norm(A.ui.q).trim();
    let rows = A.st.rows.filter(r => (!q || cols.some(c => norm(r[c.key]).includes(q) || norm(fmtText(r[c.key], c)).includes(q))) &&
      Object.entries(A.ui.f).every(([k, v]) => !v || (v === '\u0000' ? r[k] === '' : (cols.find(c => c.key === k)?.type === 'bool' ? String(boolOf(r[k]) === true) === v : r[k] === v))));
    if (A.ui.sort) { const c = cols.find(x => x.key === A.ui.sort.key); if (c) { const dir = A.ui.sort.dir; rows = rows.slice().sort((a, b) => { const x = sortVal(a[c.key], c), y = sortVal(b[c.key], c); if (x === null || y === null) return cmp(x, y); return cmp(x, y) * dir; }); } }
    return rows;
  }
  function list(el, A, { editable } = {}) {
    const w = W(), cols = orderedCols(A), fcols = A.cols().filter(c => c.type === 'category' || c.type === 'bool');
    const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(t)}</option>`;
    const filters = fcols.map(c => {
      const vals = c.type === 'bool' ? [['true', w.yes], ['false', w.no]] : [...new Set(A.st.rows.map(r => r[c.key]).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map(v => [v, v]);
      const hasEmpty = c.type !== 'bool' && A.st.rows.some(r => r[c.key] === '');
      return `<label class="s2a-filter"><span>${esc(nice(c.name))}</span><select data-f="${c.key}">${opt('', w.all)}${vals.map(([v, t]) => opt(v, t, A.ui.f[c.key] === v)).join('')}${hasEmpty ? opt('\u0000', w.empty, A.ui.f[c.key] === '\u0000') : ''}</select></label>`;
    }).join('');
    const sortSel = `<label class="s2a-filter s2a-sortsel"><span>${w.sortBy}</span><select data-sort>${opt('', w.orig)}${cols.map(c => [opt(c.key + ':1', `${nice(c.name)} ↑`, A.ui.sort && A.ui.sort.key === c.key && A.ui.sort.dir === 1), opt(c.key + ':-1', `${nice(c.name)} ↓`, A.ui.sort && A.ui.sort.key === c.key && A.ui.sort.dir === -1)].join('')).join('')}</select></label>`;
    el.innerHTML = `<div class="s2a-toolbar">
      <label class="s2a-search">${ICON.search}<span class="s2a-sr">${esc(w.search(A.st.rows.length))}</span><input type="search" value="${esc(A.ui.q)}" placeholder="${esc(w.search(A.st.rows.length))}" data-q></label>
      ${editable ? `<button type="button" class="s2a-btn s2a-primary" data-add>${ICON.plus}${w.add}</button>` : ''}
    </div>
    <div class="s2a-filters">${filters}${sortSel}<button type="button" class="s2a-link" data-clear hidden>${w.clear}</button></div>
    <p class="s2a-count" aria-live="polite" data-count></p>
    <div class="s2a-tablewrap"><table class="s2a-table${editable ? ' is-edit' : ''}"><thead><tr>${cols.map(c => `<th scope="col" class="t-${c.type}" data-k="${c.key}"><button type="button" data-sortk="${c.key}">${esc(nice(c.name))}<span class="s2a-arrow" aria-hidden="true"></span></button></th>`).join('')}${editable ? `<th scope="col" class="s2a-act"><span class="s2a-sr">${w.actions}</span></th>` : ''}</tr></thead><tbody data-body></tbody></table></div>
    <p class="s2a-none" data-none hidden>${w.none}</p>
    <div class="s2a-more" data-morewrap hidden><button type="button" class="s2a-btn" data-more></button></div>
    ${editable ? `<div class="s2a-io">
      <button type="button" class="s2a-btn" data-export>${ICON.down}${w.exportCsv}</button>
      <label class="s2a-btn s2a-file">${ICON.up}${w.importCsv}<input type="file" accept=".csv,.tsv,.txt,text/csv" data-import></label>
      <button type="button" class="s2a-btn s2a-quiet" data-reset>${ICON.undo}${A.opts.standalone ? w.resetPub : w.reset}</button>
      <span class="s2a-msg" role="status" data-msg></span></div>` : ''}`;
    const body = el.querySelector('[data-body]');
    const draw = () => {
      const rows = filtered(A), shown = rows.slice(0, A.ui.limit);
      el.querySelector('[data-count]').textContent = w.showing(rows.length, A.st.rows.length);
      el.querySelector('[data-none]').hidden = rows.length > 0;
      el.querySelector('[data-clear]').hidden = !A.ui.q && !Object.values(A.ui.f).some(Boolean);
      const mw = el.querySelector('[data-morewrap]'); mw.hidden = rows.length <= A.ui.limit; el.querySelector('[data-more]').textContent = w.more(Math.min(50, rows.length - A.ui.limit));
      el.querySelectorAll('th[data-k]').forEach(th => { const s = A.ui.sort && A.ui.sort.key === th.dataset.k ? A.ui.sort.dir : 0; th.setAttribute('aria-sort', s === 1 ? 'ascending' : s === -1 ? 'descending' : 'none'); });
      body.innerHTML = shown.map(r => `<tr data-id="${r._id}">${cols.map((c, i) => `<td class="t-${c.type}${c.title ? ' is-title' : ''}${i > 6 ? ' is-minor' : ''}" data-label="${esc(nice(c.name))}">${c.title ? `<strong>${esc(r[c.key]) || fmtHTML('', c)}</strong>` : fmtHTML(r[c.key], c)}</td>`).join('')}${editable ? `<td class="s2a-act"><button type="button" class="s2a-icon" data-edit aria-label="${esc(w.edit)}: ${esc(rowTitle(A, r))}">${ICON.edit}<span>${w.edit}</span></button><button type="button" class="s2a-icon s2a-danger" data-del aria-label="${esc(w.del)}: ${esc(rowTitle(A, r))}">${ICON.bin}<span>${w.del}</span></button></td>` : ''}</tr>`).join('');
    };
    const msg = t => { const m = el.querySelector('[data-msg]'); if (m) { m.textContent = A.storeOk ? t : w.storeFail; clearTimeout(m._t); m._t = setTimeout(() => { m.textContent = ''; }, 4000); } };
    el.querySelector('[data-q]').addEventListener('input', e => { A.ui.q = e.target.value; A.ui.limit = 50; draw(); });
    el.onchange = e => {
      if (e.target.dataset.f !== undefined) { A.ui.f[e.target.dataset.f] = e.target.value; A.ui.limit = 50; draw(); }
      if (e.target.hasAttribute('data-sort')) { const [k, d] = e.target.value.split(':'); A.ui.sort = k ? { key: k, dir: +d } : null; draw(); }
      if (e.target.hasAttribute('data-import') && e.target.files[0]) {
        const file = e.target.files[0]; file.text().then(text => {
          let m2; try { m2 = parse(text, file.name); } catch { msg(w.importFail); return; }
          const names = A.cols().map(c => norm(c.name)).join('|');
          if (m2.cols.map(c => norm(c.name)).join('|') !== names) { msg(w.importDiff); return; }
          A.st.rows = m2.rows; A.st.done = {}; A.changed(); list(el, A, { editable }); msg(w.imported(m2.rows.length));
        });
      }
    };
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      if (b.dataset.sortk) { const k = b.dataset.sortk; A.ui.sort = A.ui.sort && A.ui.sort.key === k ? (A.ui.sort.dir === 1 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 }; const s = el.querySelector('[data-sort]'); s.value = A.ui.sort ? `${A.ui.sort.key}:${A.ui.sort.dir}` : ''; draw(); }
      else if (b.hasAttribute('data-clear')) { A.ui.q = ''; A.ui.f = {}; list(el, A, { editable }); }
      else if (b.hasAttribute('data-more')) { A.ui.limit += 50; draw(); }
      else if (b.hasAttribute('data-add')) form(A, null, () => { list(el, A, { editable }); msg(w.added); });
      else if (b.hasAttribute('data-edit')) form(A, b.closest('tr').dataset.id, () => { list(el, A, { editable }); msg(w.changed); });
      else if (b.hasAttribute('data-del')) {
        if (!b.classList.contains('is-sure')) { b.classList.add('is-sure'); b.querySelector('span').textContent = w.sure; setTimeout(() => { if (b.isConnected) { b.classList.remove('is-sure'); b.querySelector('span').textContent = w.del; } }, 3000); return; }
        const id = b.closest('tr').dataset.id; A.st.rows = A.st.rows.filter(r => r._id !== id); delete A.st.done[id]; A.changed(); draw(); msg(w.deleted);
      } else if (b.hasAttribute('data-export')) download(slug(A.st.meta.name) + '.csv', toCSV(A), 'text/csv;charset=utf-8');
      else if (b.hasAttribute('data-reset')) {
        if (!b.classList.contains('is-sure')) { b.classList.add('is-sure'); b.lastChild.textContent = w.resetSure; setTimeout(() => { if (b.isConnected) { b.classList.remove('is-sure'); b.lastChild.textContent = A.opts.standalone ? w.resetPub : w.reset; } }, 3500); return; }
        A.reset(); A.save(); if (A.opts.onChange) A.opts.onChange(A, 'reset'); list(el, A, { editable });
      }
    };
    draw();
  }
  function toCSV(A) {
    const q = v => /[",\n\r;]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
    return '\uFEFF' + [A.cols().map(c => q(c.name)).join(',')].concat(A.st.rows.map(r => A.cols().map(c => q(r[c.key] ?? '')).join(','))).join('\r\n') + '\r\n';
  }
  function form(A, id, done) {
    const w = W(), row = id ? A.st.rows.find(r => r._id === id) : null;
    const dlg = document.createElement('dialog'); dlg.className = 's2a-dialog s2a';
    const field = c => {
      const v = row ? row[c.key] : '', nm = esc(nice(c.name)), idf = 'f-' + c.key;
      const lab = `<label for="${idf}">${nm} <small>${esc(w.types[c.type])}</small></label>`;
      switch (c.type) {
        case 'number': case 'money': return `<div class="s2a-field">${lab}<div class="s2a-affix">${c.type === 'money' ? `<span>${c.cur === 'USD' ? '$' : c.cur === 'GBP' ? '£' : '€'}</span>` : ''}<input id="${idf}" name="${c.key}" type="text" inputmode="decimal" value="${esc(v)}" autocomplete="off"></div></div>`;
        case 'date': return `<div class="s2a-field">${lab}<input id="${idf}" name="${c.key}" type="date" value="${esc(dateOf(v) || '')}"></div>`;
        case 'time': return `<div class="s2a-field">${lab}<input id="${idf}" name="${c.key}" type="time" value="${esc(timeOf(v) || '')}"></div>`;
        case 'bool': { const voc = c.vocab || ['yes', 'no']; const b = boolOf(v); return `<div class="s2a-field">${lab}<select id="${idf}" name="${c.key}"><option value=""></option><option value="${esc(voc[0])}"${b === true ? ' selected' : ''}>${w.yes}</option><option value="${esc(voc[1])}"${b === false ? ' selected' : ''}>${w.no}</option></select></div>`; }
        case 'phone': return `<div class="s2a-field">${lab}<input id="${idf}" name="${c.key}" type="tel" value="${esc(v)}" autocomplete="off"></div>`;
        case 'category': return `<div class="s2a-field">${lab}<input id="${idf}" name="${c.key}" list="dl-${c.key}" value="${esc(v)}" autocomplete="off"><datalist id="dl-${c.key}">${[...new Set(A.st.rows.map(r => r[c.key]).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>`;
        default: return RX.notes.test(c.name) || String(v).length > 50 ? `<div class="s2a-field is-wide">${lab}<textarea id="${idf}" name="${c.key}" rows="2">${esc(v)}</textarea></div>` : `<div class="s2a-field${c.title ? ' is-wide' : ''}">${lab}<input id="${idf}" name="${c.key}" type="text" value="${esc(v)}" autocomplete="off"></div>`;
      }
    };
    dlg.innerHTML = `<form method="dialog" class="s2a-form"><h3>${id ? w.editTitle : w.addTitle}</h3><div class="s2a-fields">${[A.titleCol()].concat(A.cols().filter(c => !c.title)).map(field).join('')}</div><p class="s2a-msg" role="alert" data-err></p><div class="s2a-formbar"><button type="button" class="s2a-btn" data-cancel>${w.cancel}</button><button type="submit" class="s2a-btn s2a-primary">${w.save}</button></div></form>`;
    document.body.appendChild(dlg);
    const close = () => { dlg.close(); dlg.remove(); };
    dlg.querySelector('[data-cancel]').addEventListener('click', close);
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
    dlg.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target), out = {};
      for (const c of A.cols()) {
        let v = String(fd.get(c.key) ?? '').trim();
        if (c.type === 'date' && v && c.fmt && c.fmt.startsWith('dmy')) { const s = c.fmt.slice(3) || '/'; v = `${v.slice(8, 10)}${s}${v.slice(5, 7)}${s}${v.slice(0, 4)}`; }
        out[c.key] = v;
      }
      if (!Object.values(out).some(Boolean)) { dlg.querySelector('[data-err]').textContent = w.required; return; }
      if (row) Object.assign(row, out); else A.st.rows.unshift(Object.assign({ _id: uid() }, out));
      A.changed(); close(); done();
    });
    dlg.showModal();
    const first = dlg.querySelector('input,select,textarea'); if (first) first.focus();
  }

  /* ---------- the view (prompt 3) ---------- */
  function viewUI(el, A, { pick = true } = {}) {
    const w = W(), kinds = detect(A); if (!kinds.includes(A.st.viewKind)) A.st.viewKind = kinds[0];
    const v = view(A, A.st.viewKind);
    const nDone = v.items.filter(i => A.st.done[i.id]).length;
    const itemHTML = (i, todo) => `<li class="s2a-item${A.st.done[i.id] ? ' is-done' : ''}${i.key ? ' is-key' : ''}">${todo ? `<input type="checkbox" id="d-${i.id}" data-done="${i.id}"${A.st.done[i.id] ? ' checked' : ''}>` : '<span class="s2a-dot" aria-hidden="true"></span>'}
      <${todo ? `label for="d-${i.id}"` : 'div'} class="s2a-item-main"><span class="s2a-item-t">${esc(i.title)}${i.key ? ` <span class="s2a-key">${w.essential}</span>` : ''}</span>${i.meta && i.meta.length ? `<span class="s2a-item-m">${i.meta.map(esc).join(' · ')}</span>` : ''}</${todo ? 'label' : 'div'}>
      ${i.badge || i.amount ? `<span class="s2a-item-r">${i.badge ? `<span class="s2a-badge is-${i.badge.tone}">${esc(i.badge.t)}</span>` : ''}${i.amount ? `<span class="s2a-amt">${esc(i.amount)}</span>` : ''}${i.sub ? `<span class="s2a-amt-sub">${esc(i.sub)}</span>` : ''}</span>` : ''}</li>`;
    const group = g => {
      const inner = `<ul class="s2a-items">${g.items.length ? g.items.map(i => itemHTML(i, g.todo)).join('') : `<li class="s2a-item is-empty">${w.nothing}</li>`}</ul>`;
      const head = `<span class="s2a-gt">${esc(g.title)}</span> <span class="s2a-gn">${g.items.length}</span>${g.sub ? `<span class="s2a-gs">${g.sub}</span>` : ''}`;
      return g.closed ? `<details class="s2a-group is-closed"><summary>${head}</summary>${inner}</details>` : `<section class="s2a-group"><h4>${head}</h4>${inner}</section>`;
    };
    const names = { checklist: w.v.checklist[0], stock: w.v.stock[0], invoices: w.v.invoices[0], members: w.v.members[0], schedule: w.v.schedule[0], generic: w.v.generic[0] };
    el.innerHTML = `<div class="s2a-viewhead"><div><h3 class="s2a-vt">${esc(v.title)}</h3><p class="s2a-vi">${esc(v.intro)}</p></div>
      ${pick && kinds.length > 1 ? `<label class="s2a-filter"><span>${w.otherView}</span><select data-kind>${kinds.map(k => `<option value="${k}"${k === v.kind ? ' selected' : ''}>${esc(names[k])}</option>`).join('')}</select></label>` : ''}</div>
      ${v.refControl ? `<div class="s2a-ref"><label>${w.todayIs} <input type="date" data-ref value="${esc(A.st.ref || v.ref || todayISO())}"></label>${A.st.ref ? `<button type="button" class="s2a-link" data-today>${w.useToday}</button>` : ''}</div>` : ''}
      ${v.note ? `<p class="s2a-note">${esc(v.note)}</p>` : ''}
      <div class="s2a-tiles">${v.tiles.map(t => `<div class="s2a-tile"><span class="s2a-tl">${esc(t.label)}</span><strong>${esc(t.value)}</strong>${t.sub ? `<span class="s2a-ts">${esc(t.sub)}</span>` : ''}</div>`).join('')}</div>
      ${v.phases ? `<div class="s2a-phases" role="group">${v.phases.map(p => `<button type="button" data-phase="${esc(p)}" aria-pressed="${p === A.ui.phase}">${esc(p)}</button>`).join('')}</div>` : ''}
      <div class="s2a-prog"><span>${esc(w.marked(nDone, v.items.length, v.action))}</span><span class="s2a-bar"><i style="width:${v.items.length ? 100 * nDone / v.items.length : 0}%"></i></span></div>
      <div class="s2a-groups">${v.groups.map(group).join('')}</div>
      ${v.charts.length ? `<div class="s2a-charts">${v.charts.map(c => chartSVG(c)).join('')}</div>` : ''}`;
    drawCharts(el, v.charts);
    el.onchange = e => {
      const t = e.target;
      if (t.dataset.done) { if (t.checked) A.st.done[t.dataset.done] = 1; else delete A.st.done[t.dataset.done]; A.changed(); viewUI(el, A, { pick }); const n = el.querySelector(`#d-${CSS.escape(t.dataset.done)}`); if (n) n.focus(); }
      else if (t.hasAttribute('data-kind')) { A.st.viewKind = t.value; A.changed(); viewUI(el, A, { pick }); el.querySelector('[data-kind]')?.focus(); }
      else if (t.hasAttribute('data-ref') && t.value) { A.st.ref = t.value; A.changed(); viewUI(el, A, { pick }); el.querySelector('[data-ref]')?.focus(); }
    };
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.phase !== undefined) { A.ui.phase = b.dataset.phase; viewUI(el, A, { pick }); el.querySelector(`[data-phase="${CSS.escape(b.dataset.phase)}"]`)?.focus(); }
      if (b.hasAttribute('data-today')) { A.st.ref = null; A.changed(); viewUI(el, A, { pick }); }
    };
  }

  // Charts are drawn at their real width, so the text stays at its real size on a phone and on a wide screen.
  function drawCharts(el, charts) {
    const box = el.querySelector('.s2a-charts'); if (!box) return;
    const draw = () => { const figs = box.querySelectorAll('.s2a-chart'); let i = 0; charts.forEach(c => { const html = chartSVG(c); if (!html) return; const f = figs[i++]; if (!f) return; const wd = f.clientWidth - 32; if (wd > 0 && Math.abs((f._w || 0) - wd) > 4) { f._w = wd; const t = document.createElement('div'); t.innerHTML = chartSVG(c, wd); const nf = t.firstChild; nf._w = wd; f.replaceWith(nf); } }); };
    draw();
    if (root.ResizeObserver) { if (el._ro) el._ro.disconnect(); el._ro = new ResizeObserver(() => { if (box.isConnected) requestAnimationFrame(draw); else el._ro.disconnect(); }); el._ro.observe(box); }
  }

  /* ---------- the history (prompt 4) ---------- */
  function historyUI(el, A) {
    const w = W(), kinds = detect(A); if (!kinds.includes(A.st.viewKind)) A.st.viewKind = kinds[0];
    const v = view(A, A.st.viewKind);
    const done = v.items.filter(i => A.st.done[i.id]), skipped = v.items.filter(i => !A.st.done[i.id]);
    const vname = v.title + (v.phases ? ' · ' + A.ui.phase : '');
    const when = iso => { const d = new Date(iso); return new Intl.DateTimeFormat(loc(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d); };
    el.innerHTML = `<div class="s2a-run"><h3 class="s2a-vt">${w.runTitle}</h3>
      <p class="s2a-runsum">${esc(w.runSum(vname, done.length, skipped.length))}</p>
      <div class="s2a-runlists"><div><h4>${w.runDone} <span class="s2a-gn">${done.length}</span></h4><ul>${done.map(i => `<li>${esc(i.title)}</li>`).join('') || '<li class="s2a-nil">·</li>'}</ul></div>
      <div><h4>${w.runSkipped} <span class="s2a-gn">${skipped.length}</span></h4><ul>${skipped.map(i => `<li>${esc(i.title)}</li>`).join('') || '<li class="s2a-nil">·</li>'}</ul></div></div>
      <label class="s2a-field is-wide"><span>${w.runNote}</span><textarea rows="2" data-note placeholder="${esc(w.runPh)}"></textarea></label>
      <div class="s2a-formbar is-left"><button type="button" class="s2a-btn s2a-primary" data-saverun>${w.runSave}</button><span class="s2a-msg" role="status" data-msg></span></div></div>
      <h3 class="s2a-vt s2a-hh">${w.hist}</h3>
      ${A.st.hist.length ? `<ol class="s2a-hist">${A.st.hist.map((h, i) => `<li><div class="s2a-hrow"><time datetime="${esc(h.at)}">${esc(when(h.at))}</time><button type="button" class="s2a-icon s2a-danger" data-hdel="${i}" aria-label="${esc(w.histDel)}">${ICON.bin}</button></div>
        <p class="s2a-hv"><strong>${esc(h.view)}</strong> · ${esc(w.histItem(h.done.length, h.skipped.length))}</p>${h.note ? `<p class="s2a-hn">${esc(h.note)}</p>` : ''}
        ${h.done.length || h.skipped.length ? `<details><summary>${w.runDone} / ${w.runSkipped}</summary>${h.done.length ? `<p><b>${w.runDone}:</b> ${h.done.map(esc).join('; ')}</p>` : ''}${h.skipped.length ? `<p><b>${w.runSkipped}:</b> ${h.skipped.map(esc).join('; ')}</p>` : ''}</details>` : ''}</li>`).join('')}</ol>` : `<p class="s2a-empty">${w.histEmpty}</p>`}`;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-saverun')) {
        A.st.hist.unshift({ at: new Date().toISOString(), view: vname, done: done.map(i => i.title), skipped: skipped.map(i => i.title), note: el.querySelector('[data-note]').value.trim() });
        v.items.forEach(i => { delete A.st.done[i.id]; }); A.changed(); historyUI(el, A);
        const m = el.querySelector('[data-msg]'); m.textContent = A.storeOk ? w.runSaved : w.storeFail; el.querySelector('[data-saverun]').focus();
      }
      if (b.dataset.hdel !== undefined) { A.st.hist.splice(+b.dataset.hdel, 1); A.changed(); historyUI(el, A); }
    };
  }

  /* ---------- about (prompt 5) ---------- */
  function aboutDefaults(A) {
    const m = A.st.meta, kinds = detect(A), v = view(A, A.st.viewKind && kinds.includes(A.st.viewKind) ? A.st.viewKind : kinds[0]);
    const n = A.st.rows.length, k = A.cols().length, d = dateFmt(todayISO());
    return lang === 'pt' ? {
      what: `Transforma ${m.source ? `o ficheiro ${m.source}` : 'uma folha de cálculo'} (${n} linhas, ${k} colunas) numa aplicação: "${v.title}" como primeiro ecrã, com os itens mais importantes primeiro e cada um marcado quando está feito; uma lista onde pode pesquisar, filtrar e ordenar; um formulário para adicionar, editar e apagar linhas; exportar e importar CSV; e um histórico datado de cada ronda.`,
      where: `Os dados que vê foram colocados neste ficheiro a ${d}. As alterações ficam guardadas só neste navegador, neste aparelho (armazenamento local). Nada é enviado para lado nenhum: não há servidor, login nem base de dados. Para guardar uma cópia, exporte um CSV.`,
      not: 'Ainda não partilha os dados entre dois aparelhos ou pessoas, não tem login, cópias de segurança nem lembretes, e não deixa várias pessoas editar ao mesmo tempo. Essas são as próximas instruções.',
    } : {
      what: `It turns ${m.source ? `the file ${m.source}` : 'a spreadsheet'} (${n} rows, ${k} columns) into an app: "${v.title}" as the first screen, the most important items first, each one marked when it is done; a list you can search, filter and sort; a form to add, edit and delete rows; CSV export and import; and a dated history of every run.`,
      where: `The data you see was put into this file on ${d}. Changes are kept in this browser only, on this device (local storage). Nothing is sent anywhere: there is no server, no login and no database. To keep a copy, export a CSV.`,
      not: 'It does not yet share the data between two devices or people, has no login, backups or reminders, and does not let several people edit at once. Those are the next prompts.',
    };
  }
  function aboutUI(el, about) {
    const w = W();
    el.innerHTML = `<div class="s2a-about"><h3>${w.about.what}</h3><p>${esc(about.what)}</p><h3>${w.about.where}</h3><p>${esc(about.where)}</p><h3>${w.about.not}</h3><p>${esc(about.not)}</p></div>`;
  }

  /* ---------- the exported, standalone app ---------- */
  function standalone(el, P) {
    lang = P.lang === 'pt' ? 'pt' : 'en';
    const A = makeApp(P.model, { key: 's2a-app:' + P.model.id + ':' + P.built, standalone: true });
    if (!A.restored) { A.st.viewKind = P.viewKind || null; A.st.ref = P.ref || null; A.st.hist = []; A.save(); }
    A.opts.onChange = (a, why) => { if (why === 'reset') { A.st.viewKind = P.viewKind || null; A.st.ref = P.ref || null; A.save(); } };
    const w = W(); let tab = 'view';
    const tabs = ['view', 'list', 'hist', 'about'];
    el.innerHTML = `<header class="s2a-sahead"><h1>${esc(P.name)}</h1><p>${esc(w.madeWith(dateFmt(P.built.slice(0, 10))))}</p>
      <nav class="s2a-tabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" id="tab-${t}" aria-controls="panel" data-tab="${t}">${w.nav[t]}</button>`).join('')}</nav></header>
      <main class="s2a-panel" id="panel" role="tabpanel" tabindex="-1"></main>`;
    const panel = el.querySelector('#panel');
    const show = t => {
      tab = t; el.querySelectorAll('[data-tab]').forEach(b => { b.setAttribute('aria-selected', b.dataset.tab === t); b.tabIndex = b.dataset.tab === t ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'tab-' + t);
      if (t === 'view') viewUI(panel, A, { pick: false }); else if (t === 'list') list(panel, A, { editable: true }); else if (t === 'hist') historyUI(panel, A); else aboutUI(panel, P.about);
    };
    el.querySelector('.s2a-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
    el.querySelector('.s2a-tabs').addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const i = (tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; show(tabs[i]); el.querySelector(`[data-tab="${tabs[i]}"]`).focus();
    });
    show('view');
  }

  root.S2A = { L, setLang: l => { lang = l === 'pt' ? 'pt' : 'en'; }, getLang: () => lang, parse, infer, makeApp, detect, view, list, viewUI, historyUI, aboutUI, aboutDefaults, standalone, chartSVG, esc, nice, slug, store, download, todayISO, dateFmt, toCSV };
})(typeof window !== 'undefined' ? window : globalThis);
