/* Spreadsheet to App: the tool on /spreadsheet-to-app/. Pick an example or bring a file, then walk the five prompts.
   Everything happens in this page; files are read locally and kept in this browser's storage. Nothing is uploaded.
   Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0. */
(() => {
  'use strict';
  const S = window.S2A; if (!S) return;
  const D = JSON.parse(document.getElementById('s2a-data').textContent);
  const lang = S.LANGS.includes(D.lang) ? D.lang : 'en'; S.setLang(lang);
  const esc = S.esc;
  const W = {
    en: {
      own: 'Your own file', ownB: 'Drop a CSV or a Markdown checklist here, or choose one.', choose: 'Choose a file', paste: 'Paste instead', pasteL: 'Paste a CSV or a Markdown checklist', make: 'Make the app',
      errEmpty: 'That file is empty.', errRead: 'We could not read that. Is it a CSV, or a Markdown checklist?', errXlsx: 'That is an Excel file. In Excel or Sheets, save or download it as CSV, then bring the CSV.',
      kept: 'Kept in this browser', restored: 'Your changes from last time are back.', rc: (r, c) => `${r} rows · ${c} columns`, steps: 'The five prompts',
      prompt: n => `Prompt ${n}`, copy: 'Copy', copied: 'Copied', prev: 'Previous', next: t => `Next: ${t}`, again: 'Pick another', step: (n, t) => `Step ${n} of 5: ${t}`,
      intro: [
        'Search, filter and sort. Click a column heading to sort by it. The columns that matter most come first.',
        'Add, edit or delete rows with a form made from your columns. Everything is saved in this browser; export a CSV at any time.',
        'The first screen of the app, chosen from your columns: the most important items first. Mark each one as you go.',
        'When you finish, save the run: what you did, what you skipped, and a note. The history keeps every run, newest first.',
        'Download the app as one HTML file with your data inside and an honest "about". Open it anywhere; publish it one of three ways.',
      ],
      und: 'What the app understood', undHelp: 'Each column\'s type was guessed from its name and its values. Change a guess and the app follows.', undSum: (n, s) => `${n} columns: ${s}`,
      appName: 'App name', aboutL: 'The "about" section', dl: 'Download the app', dlNote: kb => `One HTML file, about ${kb} KB, with your data inside. It works offline and makes no requests to the internet.`,
      preview: 'The file you will download, running', previewNote: 'A live preview. Changes you make in it stay in the preview.', ways: 'Then publish it, one of three ways',
      wA: ['Your own tool', 'Upload the file to a tool that publishes a page with a link.'], wB: ['A GitHub repository', 'Name it index.html, put it in a repository made from the programme\'s template, and turn on GitHub Pages.'], wC: ['A team that moves it', 'Share the file; a team of the region\'s providers moves it into the organisation for you.'],
      more: 'More on the three ways', resetAbout: 'Write it again from the data', fail: 'The app could not be built here. Reload the page and try again.',
    },
    pt: {
      own: 'O seu ficheiro', ownB: 'Largue aqui um CSV ou uma lista em Markdown, ou escolha um.', choose: 'Escolher ficheiro', paste: 'Colar texto', pasteL: 'Cole um CSV ou uma lista em Markdown', make: 'Fazer a aplicação',
      errEmpty: 'Esse ficheiro está vazio.', errRead: 'Não conseguimos ler isso. É um CSV ou uma lista em Markdown?', errXlsx: 'Isso é um ficheiro Excel. No Excel ou no Sheets, guarde-o ou descarregue-o como CSV e traga o CSV.',
      kept: 'Guardado neste navegador', restored: 'As suas alterações da última vez estão de volta.', rc: (r, c) => `${r} linhas · ${c} colunas`, steps: 'As cinco instruções',
      prompt: n => `Instrução ${n}`, copy: 'Copiar', copied: 'Copiado', prev: 'Anterior', next: t => `A seguir: ${t}`, again: 'Escolher outro', step: (n, t) => `Passo ${n} de 5: ${t}`,
      intro: [
        'Pesquise, filtre e ordene. Clique no título de uma coluna para ordenar. As colunas mais importantes aparecem primeiro.',
        'Adicione, edite ou apague linhas com um formulário feito a partir das suas colunas. Tudo fica guardado neste navegador; exporte um CSV quando quiser.',
        'O primeiro ecrã da aplicação, escolhido a partir das suas colunas: primeiro os itens mais importantes. Marque cada um à medida que avança.',
        'Quando terminar, guarde a ronda: o que fez, o que saltou e uma nota. O histórico guarda todas as rondas, da mais recente para a mais antiga.',
        'Descarregue a aplicação num só ficheiro HTML, com os seus dados lá dentro e um "sobre" honesto. Abra-a em qualquer lado; publique-a de uma de três formas.',
      ],
      und: 'O que a aplicação percebeu', undHelp: 'O tipo de cada coluna foi deduzido do nome e dos valores. Mude uma dedução e a aplicação acompanha.', undSum: (n, s) => `${n} colunas: ${s}`,
      appName: 'Nome da aplicação', aboutL: 'A secção "sobre"', dl: 'Descarregar a aplicação', dlNote: kb => `Um ficheiro HTML, com cerca de ${kb} KB, com os seus dados lá dentro. Funciona sem internet e não faz pedidos à internet.`,
      preview: 'O ficheiro que vai descarregar, a funcionar', previewNote: 'Uma pré-visualização ao vivo. As alterações feitas nela ficam na pré-visualização.', ways: 'Depois publique-a, de uma de três formas',
      wA: ['A sua ferramenta', 'Carregue o ficheiro numa ferramenta que publique uma página com um link.'], wB: ['Um repositório GitHub', 'Chame-lhe index.html, ponha-o num repositório feito a partir do modelo do programa e ative o GitHub Pages.'], wC: ['Uma equipa que a muda', 'Partilhe o ficheiro; uma equipa de fornecedores da região muda-o para a organização por si.'],
      more: 'Mais sobre as três formas', resetAbout: 'Escrever de novo a partir dos dados', fail: 'Não foi possível construir a aplicação aqui. Recarregue a página e tente de novo.',
    },
    es: {
      own: 'Su propio archivo', ownB: 'Suelte aquí un CSV o una lista en Markdown, o elija uno.', choose: 'Elegir archivo', paste: 'Pegar texto', pasteL: 'Pegue un CSV o una lista en Markdown', make: 'Crear la aplicación',
      errEmpty: 'Ese archivo está vacío.', errRead: 'No hemos podido leerlo. ¿Es un CSV o una lista en Markdown?', errXlsx: 'Es un archivo de Excel. En Excel o en Sheets, guárdelo o descárguelo como CSV y traiga el CSV.',
      kept: 'Guardado en este navegador', restored: 'Sus cambios de la última vez han vuelto.', rc: (r, c) => `${r} filas · ${c} columnas`, steps: 'Las cinco instrucciones',
      prompt: n => `Instrucción ${n}`, copy: 'Copiar', copied: 'Copiado', prev: 'Anterior', next: t => `Siguiente: ${t}`, again: 'Elegir otro', step: (n, t) => `Paso ${n} de 5: ${t}`,
      intro: [
        'Busque, filtre y ordene. Haga clic en el título de una columna para ordenar por ella. Las columnas que más importan aparecen primero.',
        'Añada, edite o borre filas con un formulario hecho a partir de sus columnas. Todo se guarda en este navegador; exporte un CSV cuando quiera.',
        'La primera pantalla de la aplicación, elegida a partir de sus columnas: primero los elementos más importantes. Marque cada uno a medida que avanza.',
        'Cuando termine, guarde la ronda: lo que hizo, lo que se saltó y una nota. El historial guarda todas las rondas, de la más reciente a la más antigua.',
        'Descargue la aplicación en un solo archivo HTML, con sus datos dentro y un "acerca de" honesto. Ábrala en cualquier sitio; publíquela de una de tres formas.',
      ],
      und: 'Lo que entendió la aplicación', undHelp: 'El tipo de cada columna se ha deducido de su nombre y sus valores. Cambie una deducción y la aplicación la sigue.', undSum: (n, s) => `${n} columnas: ${s}`,
      appName: 'Nombre de la aplicación', aboutL: 'La sección "acerca de"', dl: 'Descargar la aplicación', dlNote: kb => `Un archivo HTML, de unos ${kb} KB, con sus datos dentro. Funciona sin conexión y no hace peticiones a internet.`,
      preview: 'El archivo que va a descargar, funcionando', previewNote: 'Una vista previa en directo. Los cambios que haga en ella se quedan en la vista previa.', ways: 'Después publíquela, de una de tres formas',
      wA: ['Su propia herramienta', 'Suba el archivo a una herramienta que publique una página con un enlace.'], wB: ['Un repositorio de GitHub', 'Llámelo index.html, póngalo en un repositorio hecho a partir de la plantilla del programa y active GitHub Pages.'], wC: ['Un equipo que la traslada', 'Comparta el archivo; un equipo de proveedores de la región lo traslada a la organización por usted.'],
      more: 'Más sobre las tres formas', resetAbout: 'Escribirla de nuevo a partir de los datos', fail: 'No se pudo construir la aplicación aquí. Recargue la página e inténtelo de nuevo.',
    },
    fr: {
      own: 'Votre propre fichier', ownB: 'Déposez ici un CSV ou une liste en Markdown, ou choisissez-en un.', choose: 'Choisir un fichier', paste: 'Coller du texte', pasteL: 'Collez un CSV ou une liste en Markdown', make: 'Créer l\'application',
      errEmpty: 'Ce fichier est vide.', errRead: 'Nous n\'avons pas pu le lire. Est-ce un CSV ou une liste en Markdown ?', errXlsx: 'C\'est un fichier Excel. Dans Excel ou Sheets, enregistrez-le ou téléchargez-le au format CSV, puis apportez le CSV.',
      kept: 'Gardé dans ce navigateur', restored: 'Vos modifications de la dernière fois sont de retour.', rc: (r, c) => `${r} lignes · ${c} colonnes`, steps: 'Les cinq instructions',
      prompt: n => `Instruction ${n}`, copy: 'Copier', copied: 'Copié', prev: 'Précédent', next: t => `Suivant : ${t}`, again: 'En choisir un autre', step: (n, t) => `Étape ${n} sur 5 : ${t}`,
      intro: [
        'Cherchez, filtrez et triez. Cliquez sur l\'en-tête d\'une colonne pour trier. Les colonnes les plus importantes viennent en premier.',
        'Ajoutez, modifiez ou supprimez des lignes avec un formulaire fait à partir de vos colonnes. Tout est enregistré dans ce navigateur ; exportez un CSV quand vous voulez.',
        'Le premier écran de l\'application, choisi à partir de vos colonnes : les éléments les plus importants d\'abord. Marquez chacun au fur et à mesure.',
        'Quand vous avez fini, enregistrez la tournée : ce que vous avez fait, ce que vous avez sauté, et une note. L\'historique garde chaque tournée, de la plus récente à la plus ancienne.',
        'Téléchargez l\'application en un seul fichier HTML, avec vos données à l\'intérieur et une rubrique « à propos » honnête. Ouvrez-la n\'importe où ; publiez-la de l\'une des trois façons.',
      ],
      und: 'Ce que l\'application a compris', undHelp: 'Le type de chaque colonne a été deviné à partir de son nom et de ses valeurs. Changez une supposition et l\'application suit.', undSum: (n, s) => `${n} colonnes : ${s}`,
      appName: 'Nom de l\'application', aboutL: 'La rubrique « à propos »', dl: 'Télécharger l\'application', dlNote: kb => `Un seul fichier HTML, d'environ ${kb} Ko, avec vos données à l'intérieur. Il fonctionne hors ligne et ne fait aucune requête vers internet.`,
      preview: 'Le fichier que vous allez télécharger, en marche', previewNote: 'Un aperçu en direct. Les modifications faites ici restent dans l\'aperçu.', ways: 'Puis publiez-la, de l\'une des trois façons',
      wA: ['Votre propre outil', 'Déposez le fichier dans un outil qui publie une page avec un lien.'], wB: ['Un dépôt GitHub', 'Nommez-le index.html, placez-le dans un dépôt créé à partir du modèle du programme et activez GitHub Pages.'], wC: ['Une équipe qui la déplace', 'Partagez le fichier ; une équipe de prestataires de la région le déplace dans l\'organisation pour vous.'],
      more: 'En savoir plus sur les trois façons', resetAbout: 'La réécrire à partir des données', fail: 'Impossible de construire l\'application ici. Rechargez la page et réessayez.',
    },
  }[lang];
  // Pay per use: what each action costs in simulated cents (the shared wallet, /assets/credit.js), and its label.
  const PRICE = { load: 5, step: 1, search: 1, filter: 1, sort: 1, add: 1, edit: 1, del: 1, type: 1, done: 1, view: 1, date: 1, phase: 1, run: 2, export: 2, import: 2, download: 25, copy: 1 };
  const PAY = {
    en: { load: n => `Loaded ${n}`, step: n => `Opened step ${n}`, search: q => `Searched "${q}"`, filter: 'Filtered the list', sort: 'Sorted the list', add: 'Added a row', edit: 'Edited a row', del: 'Deleted a row', type: 'Changed a column type', done: 'Marked an item done', view: 'Changed the view', date: 'Changed the date', phase: 'Changed the phase', run: 'Saved a run to the history', export: 'Exported a CSV', import: 'Imported a CSV', download: 'Downloaded the single-file app', copy: n => `Copied prompt ${n}` },
    pt: { load: n => `Carregou ${n}`, step: n => `Abriu o passo ${n}`, search: q => `Pesquisou "${q}"`, filter: 'Filtrou a lista', sort: 'Ordenou a lista', add: 'Adicionou uma linha', edit: 'Editou uma linha', del: 'Apagou uma linha', type: 'Mudou o tipo de uma coluna', done: 'Marcou um item como feito', view: 'Mudou de vista', date: 'Mudou a data', phase: 'Mudou de fase', run: 'Guardou uma ronda no histórico', export: 'Exportou um CSV', import: 'Importou um CSV', download: 'Descarregou a aplicação num só ficheiro', copy: n => `Copiou a instrução ${n}` },
    es: { load: n => `Cargó ${n}`, step: n => `Abrió el paso ${n}`, search: q => `Buscó "${q}"`, filter: 'Filtró la lista', sort: 'Ordenó la lista', add: 'Añadió una fila', edit: 'Editó una fila', del: 'Borró una fila', type: 'Cambió el tipo de una columna', done: 'Marcó un elemento como hecho', view: 'Cambió de vista', date: 'Cambió la fecha', phase: 'Cambió de fase', run: 'Guardó una ronda en el historial', export: 'Exportó un CSV', import: 'Importó un CSV', download: 'Descargó la aplicación en un solo archivo', copy: n => `Copió la instrucción ${n}` },
    fr: { load: n => `A chargé ${n}`, step: n => `A ouvert l'étape ${n}`, search: q => `A cherché « ${q} »`, filter: 'A filtré la liste', sort: 'A trié la liste', add: 'A ajouté une ligne', edit: 'A modifié une ligne', del: 'A supprimé une ligne', type: 'A changé le type d\'une colonne', done: 'A marqué un élément comme fait', view: 'A changé de vue', date: 'A changé la date', phase: 'A changé de phase', run: 'A enregistré une tournée', export: 'A exporté un CSV', import: 'A importé un CSV', download: 'A téléchargé l\'application en un fichier', copy: n => `A copié l'instruction ${n}` },
  }[lang];
  const pay = (kind, info) => {
    const C = window.AECredit; if (!C) return true;
    const l = PAY[kind]; let label = typeof l === 'function' ? l(String(info ?? '').slice(0, 28)) : l || kind;
    if (lang === 'fr') label = label.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»');
    return C.charge(PRICE[kind] ?? 1, label) !== false;
  };
  S.setPay(pay);
  if (lang === 'fr') { const nb = v => typeof v === 'string' ? v.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0') : typeof v === 'function' ? (...a) => nb(v(...a)) : Array.isArray(v) ? v.map(nb) : v; for (const k of Object.keys(W)) W[k] = nb(W[k]); }
  const ICON_COPY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>';
  const ICON_LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const LAST = 's2a:v1:last:' + lang;

  /* ---------- copy buttons (the five prompts, and the prompt shown at each step) ---------- */
  async function copyText(text, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { ok = document.execCommand('copy'); } catch { ok = false; } ta.remove();
    }
    if (ok && btn) { const s = btn.querySelector('span'); const old = s.textContent; s.textContent = btn.dataset.done || W.copied; btn.classList.add('is-copied'); setTimeout(() => { s.textContent = old; btn.classList.remove('is-copied'); }, 1600); }
  }
  document.querySelectorAll('[data-copy]').forEach(b => { b.hidden = false; b.addEventListener('click', () => { if (pay('copy', b.dataset.copy.replace(/\D/g, ''))) copyText(document.getElementById(b.dataset.copy).textContent, b); }); });

  /* ---------- the picker ---------- */
  const tool = document.getElementById('s2a-tool'), win = document.getElementById('s2a-window');
  const ownLi = tool.querySelector('[data-own]');
  ownLi.hidden = false;
  ownLi.innerHTML = `<div class="s2p-own" data-drop>
    <span class="s2p-pickn">+<em>CSV · MD</em></span><strong>${W.own}</strong><span class="s2p-pickb">${W.ownB}</span>
    <span class="s2p-ownbar"><label class="s2p-ownbtn">${W.choose}<input type="file" accept=".csv,.tsv,.txt,.md,.markdown,text/csv,text/markdown,text/plain" data-file></label><button type="button" class="s2p-ownlink" data-paste aria-expanded="false">${W.paste}</button></span>
    <span class="s2p-err" role="alert" data-err></span></div>
    <div class="s2p-pastebox" data-pastebox hidden><label for="s2a-paste">${W.pasteL}</label><textarea id="s2a-paste" rows="6" spellcheck="false" placeholder="name;date;amount&#10;Item A;2026-11-16;12,50"></textarea><button type="button" class="s2p-ownbtn" data-make>${W.make}</button></div>`;
  const err = t => { ownLi.querySelector('[data-err]').textContent = t || ''; };
  const exById = id => D.examples.find(e => e.id === id);

  function loadText(text, name, fromExample, user) {
    err('');
    if (/\.(xlsx|xls|ods|numbers)$/i.test(name || '')) { err(W.errXlsx); return; }
    let m;
    try { m = S.parse(text, name); } catch (e) { err(e.message === 'empty' ? W.errEmpty : W.errRead); return; }
    if (!m.rows.length) { err(W.errEmpty); return; }
    if (user && !pay('load', fromExample ? fromExample.name : (name === 'pasted.csv' || name === 'pasted.md' ? W.paste.toLowerCase() : name))) return;
    if (fromExample) { m.id = 'ex-' + fromExample.id + '-' + lang; m.name = fromExample.name; }
    open(S.makeApp(m), fromExample ? fromExample.id : null, user);
  }
  tool.addEventListener('click', e => {
    const a = e.target.closest('[data-example]');
    if (a) { e.preventDefault(); const ex = exById(a.dataset.example); loadText(ex.text, ex.file, ex, true); return; }
    if (e.target.closest('[data-paste]')) { const box = ownLi.querySelector('[data-pastebox]'); box.hidden = !box.hidden; e.target.closest('[data-paste]').setAttribute('aria-expanded', String(!box.hidden)); if (!box.hidden) box.querySelector('textarea').focus(); return; }
    if (e.target.closest('[data-make]')) { const v = ownLi.querySelector('textarea').value; loadText(v, /^\s*#|^\s*[-*]\s/m.test(v) && !/[;,\t]/.test(v.split('\n')[0]) ? 'pasted.md' : 'pasted.csv', null, true); }
  });
  ownLi.querySelector('[data-file]').addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = ''; });
  const drop = ownLi.querySelector('[data-drop]');
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
  function readFile(f) {
    if (/\.(xlsx|xls|ods|numbers)$/i.test(f.name)) { err(W.errXlsx); return; }
    if (f.size > 5e6) { err(W.errRead); return; }
    f.text().then(t => loadText(t, f.name, null, true), () => err(W.errRead));
  }

  /* ---------- the app window ---------- */
  let A = null, step = 0, exId = null;
  function open(app, id, user) {
    A = app; exId = id; step = 0;
    S.store.set(LAST, { id: A.key, ex: id });
    tool.querySelectorAll('[data-example]').forEach(a => a.setAttribute('aria-current', String(a.dataset.example === id)));
    win.hidden = false; drawWindow(); drawStep();
    if (user) { win.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); win.querySelector('.s2p-wintitle').focus({ preventScroll: true }); }
  }
  function drawWindow() {
    const m = A.st.meta;
    win.innerHTML = `<div class="s2p-winbar"><span class="s2p-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <h3 class="s2p-wintitle" tabindex="-1">${esc(m.name)}</h3>
      <span class="s2p-winmeta"><span>${esc(m.source || '')}</span><span data-rc>${esc(W.rc(A.st.rows.length, A.st.cols.length))}</span><span class="s2p-kept">${ICON_LOCK}${W.kept}</span></span></div>
      ${A.restored ? `<p class="s2p-restored">${W.restored}</p>` : ''}
      <nav class="s2p-steps" aria-label="${esc(W.steps)}"><ol>${D.prompts.map((p, i) => `<li><button type="button" data-step="${i}"><span class="s2p-sn">${i + 1}</span><span class="s2p-sl">${esc(p.title)}</span></button></li>`).join('')}</ol></nav>
      <div class="s2p-stephead"><div class="s2p-bubble"><p class="s2p-bk">${esc(W.prompt(step + 1))}</p><p class="s2p-bt" data-ptext></p></div><button type="button" class="s2p-copy is-small" data-pcopy data-done="${esc(W.copied)}">${ICON_COPY}<span>${W.copy}</span></button></div>
      <h4 class="s2p-stepname" data-stepname tabindex="-1"></h4><p class="s2p-stepintro" data-intro></p>
      <div class="s2p-stepbody s2a" data-body></div>
      <div class="s2p-stepnav"><button type="button" class="s2p-navbtn" data-prev>← ${W.prev}</button><button type="button" class="s2p-navbtn is-next" data-next></button></div>`;
    win.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => go(+b.dataset.step)));
    win.querySelector('[data-prev]').addEventListener('click', () => go(step - 1));
    win.querySelector('[data-next]').addEventListener('click', () => go(step + 1));
    win.querySelector('[data-pcopy]').addEventListener('click', e => { if (pay('copy', step + 1)) copyText(D.prompts[step].text, e.currentTarget); });
  }
  function go(n) { if (n < 0 || n > 4 || n === step) return; if (!pay('step', n + 1)) return; step = n; drawStep(); win.querySelector('[data-stepname]').focus({ preventScroll: true }); const r = win.querySelector('.s2p-steps').getBoundingClientRect(); if (r.top < 0) win.querySelector('.s2p-steps').scrollIntoView({ block: 'start' }); }
  function drawStep() {
    win.querySelectorAll('[data-step]').forEach(b => { const i = +b.dataset.step; if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('is-past', i < step); });
    win.querySelector('.s2p-bk').textContent = W.prompt(step + 1);
    win.querySelector('[data-ptext]').textContent = D.prompts[step].text;
    win.querySelector('[data-stepname]').textContent = W.step(step + 1, D.prompts[step].title);
    win.querySelector('[data-intro]').textContent = W.intro[step];
    win.querySelector('[data-prev]').hidden = step === 0;
    const nx = win.querySelector('[data-next]'); nx.hidden = step === 4; if (step < 4) nx.textContent = W.next(D.prompts[step + 1].title) + ' →';
    const old = win.querySelector('[data-body]'), body = document.createElement('div'); body.dataset.body = ''; body.className = 's2p-stepbody s2a is-step' + (step + 1); old.replaceWith(body);
    A.opts.onChange = (a, why) => { const rc = win.querySelector('[data-rc]'); if (rc) rc.textContent = W.rc(A.st.rows.length, A.st.cols.length); if (why === 'reset') { A.restored = false; win.querySelector('.s2p-restored')?.remove(); } };
    if (step === 0) { body.innerHTML = '<div data-und></div><div data-list></div>'; understood(body.querySelector('[data-und]')); S.list(body.querySelector('[data-list]'), A, { editable: false }); }
    else if (step === 1) S.list(body, A, { editable: true });
    else if (step === 2) S.viewUI(body, A);
    else if (step === 3) { body.innerHTML = '<div class="s2p-two"><div data-v></div><div data-h></div></div>'; const hv = body.querySelector('[data-h]'); S.viewUI(body.querySelector('[data-v]'), A, { pick: false }); S.historyUI(hv, A);
      const prevChange = A.opts.onChange; A.opts.onChange = (a, why) => { prevChange(a, why); if (document.activeElement && body.querySelector('[data-v]').contains(document.activeElement)) S.historyUI(hv, A); else S.viewUI(body.querySelector('[data-v]'), A, { pick: false }); }; }
    else publish(body);
  }

  /* ---------- step 1: what the app understood ---------- */
  function understood(el) {
    const L = S.L[lang], counts = {};
    A.st.cols.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });
    const sum = Object.entries(counts).map(([k, n]) => `${n} ${L.types[k].toLowerCase()}`).join(', ');
    el.innerHTML = `<details class="s2a-und"${window.matchMedia('(min-width: 900px)').matches ? ' open' : ''}><summary><strong>${W.und}</strong> <span>${esc(W.undSum(A.st.cols.length, sum))}</span></summary>
      <p class="s2a-undhelp">${W.undHelp}</p><ul class="s2a-undlist">${A.st.cols.map((c, i) => `<li><label for="ty-${i}"><span class="s2a-undn">${esc(S.nice(c.name))}${c.title ? ' <small>★</small>' : ''}</span><span class="s2a-undx">${esc(A.st.rows.map(r => r[c.key]).find(Boolean) || '')}</span></label><select id="ty-${i}" data-ty="${i}">${Object.entries(L.types).map(([k, v]) => `<option value="${k}"${k === c.type ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></li>`).join('')}</ul></details>`;
    el.addEventListener('change', e => {
      const i = e.target.dataset.ty; if (i === undefined) return;
      const c = A.st.cols[+i]; if (!pay('type')) { e.target.value = c.type; return; } c.type = e.target.value; c.fixed = true;
      if (c.type === 'bool' && !c.vocab) c.vocab = ['yes', 'no']; if (c.type === 'money' && !c.cur) c.cur = 'EUR'; if (c.type === 'date' && !c.fmt) c.fmt = 'iso';
      A.changed(); const open = el.querySelector('details').open; drawStep(); win.querySelector('details.s2a-und').open = open; win.querySelector(`[data-ty="${i}"]`).focus();
    });
  }

  /* ---------- step 5: publish ---------- */
  let assets = null;
  const getAssets = () => assets || (assets = Promise.all(['/spreadsheet-to-app/app.css', '/spreadsheet-to-app/engine.js'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.text(); }))));
  async function buildHTML(name, about) {
    const [css, js] = await getAssets();
    const st = A.st, built = new Date().toISOString();
    const model = { id: st.meta.id || S.slug(name), name, source: st.meta.source, kind: st.meta.kind, intro: st.meta.intro, delim: st.meta.delim, cols: st.cols, rows: st.rows, done: {} };
    const payload = JSON.stringify({ lang, name, built, model, about, viewKind: st.viewKind, ref: st.ref }).replace(/</g, '\\u003c');
    const closeTag = '</' + 'script>';
    return '<!doctype html>\n<html lang="' + lang + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="color-scheme" content="light dark">\n<title>' + esc(name) + '</title>\n' +
      '<!-- Made with the Spreadsheet to App prototype (code Apache-2.0). The data below is the maker\'s own. -->\n<style>\n' + css + '\n</style>\n</head>\n<body class="s2a s2a-solo">\n<div id="app"></div>\n<script>\n' + js + '\n' + closeTag + '\n<script>S2A.standalone(document.getElementById("app"), ' + payload + ');' + closeTag + '\n</body>\n</html>\n';
  }
  function publish(el) {
    const def = S.aboutDefaults(A);
    const about = Object.assign({}, def, A.st.about || {});
    const name = A.st.appName || A.st.meta.name;
    const L = S.L[lang];
    el.innerHTML = `<div class="s2p-pub">
      <div class="s2p-pubform">
        <label class="s2a-field is-wide"><span>${W.appName}</span><input type="text" data-name value="${esc(name)}"></label>
        <fieldset class="s2p-about"><legend>${W.aboutL}</legend>
          ${['what', 'where', 'not'].map(k => `<label class="s2a-field is-wide"><span>${esc(L.about[k])}</span><textarea rows="${k === 'what' ? 5 : 4}" data-about="${k}">${esc(about[k])}</textarea></label>`).join('')}
          <button type="button" class="s2a-link" data-reabout>${W.resetAbout}</button></fieldset>
        <button type="button" class="s2p-cta s2p-dl" data-dl><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/></svg>${W.dl}${D.eur ? `<span class="s2p-price is-btn">${esc(D.eur.download)}</span>` : ''}</button>
        <p class="s2p-small" data-dlnote></p>
        <div class="s2p-pubways"><h5>${W.ways}</h5><ol>${[W.wA, W.wB, W.wC].map((x, i) => `<li><b>${'ABC'[i]}. ${esc(x[0])}</b> ${esc(x[1])}</li>`).join('')}</ol><a href="#publish">${W.more}</a></div>
      </div>
      <figure class="s2p-preview"><figcaption>${W.preview}</figcaption><div class="s2p-phone"><iframe title="${esc(W.preview)}" sandbox="allow-scripts allow-downloads" data-frame></iframe></div><p class="s2p-small">${W.previewNote}</p></figure>
    </div>`;
    const frame = el.querySelector('[data-frame]'); let html = '', timer;
    const read = () => ({ name: el.querySelector('[data-name]').value.trim() || A.st.meta.name, about: Object.fromEntries(['what', 'where', 'not'].map(k => [k, el.querySelector(`[data-about="${k}"]`).value.trim()])) });
    const refresh = async () => {
      const r = read();
      try { html = await buildHTML(r.name, r.about); } catch { el.querySelector('[data-dlnote]').textContent = W.fail; return; }
      frame.srcdoc = html; el.querySelector('[data-dlnote]').textContent = W.dlNote(Math.max(1, Math.round(new Blob([html]).size / 1024)));
    };
    el.oninput = () => {
      const r = read(); A.st.appName = r.name; A.st.about = r.about; A.save();
      clearTimeout(timer); timer = setTimeout(refresh, 500);
    };
    el.querySelector('[data-reabout]').addEventListener('click', () => { delete A.st.about; A.save(); publish(el); });
    el.querySelector('[data-dl]').addEventListener('click', async () => { if (!pay('download')) return; const r = read(); html = await buildHTML(r.name, r.about); S.download(S.slug(r.name) + '.html', html, 'text/html;charset=utf-8'); });
    refresh();
  }

  /* ---------- start: the last app this browser used, or the restaurant stock example ---------- */
  const last = S.store.get(LAST);
  if (last && last.ex && exById(last.ex)) { const ex = exById(last.ex); loadText(ex.text, ex.file, ex, false); }
  else if (last && last.id && S.store.get(last.id)) {
    const st = S.store.get(last.id); const m = Object.assign({}, st.meta, { cols: st.cols, rows: st.rows, done: {} });
    open(S.makeApp(m), null, false);
  } else { const ex = exById('stock'); loadText(ex.text, ex.file, ex, false); }
})();
