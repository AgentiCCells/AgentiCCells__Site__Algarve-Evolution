// Spreadsheet to App: the proposed session programme, with a working tool that turns a spreadsheet into an app in the browser.
// The programme text is rendered here at build time in English, Portuguese, Spanish and French; the tool (src/spreadsheet-to-app/) needs JavaScript.
// Text from the SGit Newsroom article of 31 October 2026 and its public pack (vault ph10xfc1), CC BY 4.0.
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.
import { readFileSync } from 'node:fs';
import { APPS } from '../site-data.mjs';

export const name = 'spreadsheet-to-app';
export const paths = { en: '/spreadsheet-to-app/' }; // other languages: /pt/, /es/, /fr/ + this path

const ARTICLE = 'https://newsroom.sgit.ai/articles/spreadsheet-to-app-sessions.html';
const EX = new URL('../../src/spreadsheet-to-app/examples/', import.meta.url);

const EXAMPLES = [
  { id: 'holiday', file: '01-holiday-home-changeover.md', type: 'DOC',
    name: { en: 'Closing the house', pt: 'Fechar a casa', es: 'Cerrar la casa', fr: 'Fermer la maison' },
    blurb: { en: 'A holiday home checklist kept for years as a Word document, the important steps in bold.', pt: 'Uma lista de uma casa de férias guardada durante anos como documento Word, com os passos importantes a negrito.',
      es: 'La lista de una casa de vacaciones guardada durante años como documento de Word, con los pasos importantes en negrita.', fr: 'La liste d\'une maison de vacances tenue pendant des années dans un document Word, les étapes importantes en gras.' },
    view: { en: 'Essentials first, by phase', pt: 'O essencial primeiro, por fase', es: 'Lo esencial primero, por fase', fr: 'L\'essentiel d\'abord, par phase' } },
  { id: 'stock', file: '02-restaurant-stock.csv', type: 'CSV',
    name: { en: 'Restaurant stock', pt: 'Stock de um restaurante', es: 'Existencias de un restaurante', fr: 'Stock d\'un restaurant' },
    blurb: { en: 'Items, minimums, suppliers and order days.', pt: 'Artigos, mínimos, fornecedores e dias de encomenda.', es: 'Artículos, mínimos, proveedores y días de pedido.', fr: 'Articles, minimums, fournisseurs et jours de commande.' },
    view: { en: 'What to order', pt: 'O que encomendar', es: 'Qué pedir', fr: 'Ce qu\'il faut commander' } },
  { id: 'surf', file: '03-surf-school-bookings.csv', type: 'CSV',
    name: { en: 'Surf school bookings', pt: 'Reservas de uma escola de surf', es: 'Reservas de una escuela de surf', fr: 'Réservations d\'une école de surf' },
    blurb: { en: 'Lessons, students, instructors, beaches and payments.', pt: 'Aulas, alunos, instrutores, praias e pagamentos.', es: 'Clases, alumnos, monitores, playas y pagos.', fr: 'Cours, élèves, moniteurs, plages et paiements.' },
    view: { en: "This week's lessons", pt: 'As aulas desta semana', es: 'Las clases de esta semana', fr: 'Les cours de cette semaine' } },
  { id: 'invoices', file: '04-freelancer-invoices.csv', type: 'CSV',
    name: { en: 'Freelancer invoices', pt: 'Faturas de um freelancer', es: 'Facturas de un autónomo', fr: 'Factures d\'un indépendant' },
    blurb: { en: 'Clients, due dates, amounts and what has been paid.', pt: 'Clientes, datas de vencimento, montantes e o que já foi pago.', es: 'Clientes, fechas de vencimiento, importes y lo que ya se ha pagado.', fr: 'Clients, échéances, montants et ce qui a déjà été payé.' },
    view: { en: 'Unpaid invoices', pt: 'Faturas por pagar', es: 'Facturas pendientes de pago', fr: 'Factures impayées' } },
  { id: 'members', file: '05-association-members-events.csv', type: 'CSV',
    name: { en: 'Association members', pt: 'Membros de uma associação', es: 'Socios de una asociación', fr: 'Membres d\'une association' },
    blurb: { en: 'Members, membership type, who has paid, and the events they came to.', pt: 'Membros, tipo de quota, quem pagou e os eventos a que vieram.', es: 'Socios, tipo de cuota, quién ha pagado y los eventos a los que vinieron.', fr: 'Membres, type d\'adhésion, qui a payé et les événements auxquels ils sont venus.' },
    view: { en: 'Members who have not paid', pt: 'Membros que não pagaram', es: 'Socios que no han pagado', fr: 'Membres qui n\'ont pas payé' } },
];

const PROMPTS = [
  { title: { en: 'A list I can search', pt: 'Uma lista onde posso pesquisar', es: 'Una lista en la que pueda buscar', fr: 'Une liste où je peux chercher' },
    text: { en: 'Here is my spreadsheet, with dummy data. Build a single-page web app that shows it as a list I can search and filter. Keep the data in the browser: no database, no login, no server. Show the columns that matter most first.',
      pt: 'Aqui está a minha folha de cálculo, com dados fictícios. Constrói uma aplicação web de uma só página que a mostre como uma lista onde posso pesquisar e filtrar. Guarda os dados no navegador: sem base de dados, sem login, sem servidor. Mostra primeiro as colunas mais importantes.',
      es: 'Aquí tienes mi hoja de cálculo, con datos ficticios. Construye una aplicación web de una sola página que la muestre como una lista en la que pueda buscar y filtrar. Guarda los datos en el navegador: sin base de datos, sin inicio de sesión, sin servidor. Muestra primero las columnas que más importan.',
      fr: 'Voici mon tableur, avec des données fictives. Construis une application web d\'une seule page qui l\'affiche sous forme de liste où je peux chercher et filtrer. Garde les données dans le navigateur : pas de base de données, pas de connexion, pas de serveur. Affiche d\'abord les colonnes les plus importantes.' } },
  { title: { en: 'Add and change rows', pt: 'Acrescentar e alterar linhas', es: 'Añadir y cambiar filas', fr: 'Ajouter et modifier des lignes' },
    text: { en: "Add a form to add a row and to edit or delete one. Save everything in the browser's local storage, and add buttons to export the data as CSV and to import it again.",
      pt: 'Acrescenta um formulário para adicionar uma linha e para editar ou apagar uma. Guarda tudo no armazenamento local do navegador e acrescenta botões para exportar os dados em CSV e para os voltar a importar.',
      es: 'Añade un formulario para añadir una fila y para editar o borrar una. Guarda todo en el almacenamiento local del navegador y añade botones para exportar los datos en CSV y para volver a importarlos.',
      fr: 'Ajoute un formulaire pour ajouter une ligne et pour en modifier ou en supprimer une. Enregistre tout dans le stockage local du navigateur, et ajoute des boutons pour exporter les données en CSV et pour les réimporter.' } },
  { title: { en: 'The view I use most', pt: 'A vista que mais uso', es: 'La vista que más uso', fr: 'La vue que j\'utilise le plus' },
    text: { en: "The view I use most is: [today's tasks / what to order / unpaid invoices / this week's lessons / members who have not paid]. Make it the first screen, with the most important items first, and let me mark each one done.",
      pt: 'A vista que mais uso é: [as tarefas de hoje / o que encomendar / as faturas por pagar / as aulas desta semana / os membros que não pagaram]. Faz dela o primeiro ecrã, com os itens mais importantes primeiro, e deixa-me marcar cada um como feito.',
      es: 'La vista que más uso es: [las tareas de hoy / qué pedir / las facturas pendientes de pago / las clases de esta semana / los socios que no han pagado]. Haz que sea la primera pantalla, con los elementos más importantes primero, y déjame marcar cada uno como hecho.',
      fr: 'La vue que j\'utilise le plus est : [les tâches du jour / ce qu\'il faut commander / les factures impayées / les cours de cette semaine / les membres qui n\'ont pas payé]. Fais-en le premier écran, avec les éléments les plus importants en premier, et laisse-moi marquer chacun comme fait.' } },
  { title: { en: 'Remember every run', pt: 'Lembrar cada ronda', es: 'Recordar cada ronda', fr: 'Garder chaque tournée' },
    text: { en: 'Every time I finish a run (a day, an order, a session), keep a small dated record of what I did, what I skipped and a note. Show the history as a list, newest first.',
      pt: 'Sempre que termino uma ronda (um dia, uma encomenda, uma sessão), guarda um pequeno registo datado do que fiz, do que saltei e uma nota. Mostra o histórico como uma lista, do mais recente para o mais antigo.',
      es: 'Cada vez que termine una ronda (un día, un pedido, una sesión), guarda un pequeño registro con fecha de lo que hice, lo que me salté y una nota. Muestra el historial como una lista, de lo más reciente a lo más antiguo.',
      fr: 'Chaque fois que je termine une tournée (une journée, une commande, une séance), garde un petit relevé daté de ce que j\'ai fait, de ce que j\'ai sauté, et une note. Affiche l\'historique sous forme de liste, du plus récent au plus ancien.' } },
  { title: { en: 'Publish it and say what it is', pt: 'Publicar e dizer o que é', es: 'Publicarla y decir qué es', fr: 'La publier et dire ce que c\'est' },
    text: { en: 'Publish it so someone else can open it. Write a short "about" section: what the app does, where the data is kept, and what it does not do yet.',
      pt: 'Publica-a para que outra pessoa a possa abrir. Escreve uma pequena secção "sobre": o que a aplicação faz, onde ficam guardados os dados e o que ainda não faz.',
      es: 'Publícala para que otra persona pueda abrirla. Escribe una breve sección "acerca de": qué hace la aplicación, dónde se guardan los datos y qué no hace todavía.',
      fr: 'Publie-la pour que quelqu\'un d\'autre puisse l\'ouvrir. Écris une courte rubrique « à propos » : ce que fait l\'application, où sont gardées les données et ce qu\'elle ne fait pas encore.' } },
];

const DAY = [
  ['09:00', { en: 'Welcome; why spreadsheets become apps now (15 min)', pt: 'Boas-vindas; porque é que as folhas de cálculo se tornam aplicações agora (15 min)', es: 'Bienvenida; por qué las hojas de cálculo se convierten ahora en aplicaciones (15 min)', fr: 'Accueil ; pourquoi les tableurs deviennent des applications maintenant (15 min)' }],
  ['09:15', { en: 'Demo: one example spreadsheet to a published app, live, with the five prompts (30 min)', pt: 'Demonstração: uma folha de exemplo até uma aplicação publicada, ao vivo, com as cinco instruções (30 min)', es: 'Demostración: de una hoja de ejemplo a una aplicación publicada, en directo, con las cinco instrucciones (30 min)', fr: 'Démonstration : d\'un tableur d\'exemple à une application publiée, en direct, avec les cinq instructions (30 min)' }],
  ['09:45', { en: 'Build, part 1: prompts 1 and 2, with mentors at the tables', pt: 'Construção, parte 1: instruções 1 e 2, com mentores nas mesas', es: 'Construcción, parte 1: instrucciones 1 y 2, con mentores en las mesas', fr: 'Construction, partie 1 : instructions 1 et 2, avec des mentors aux tables' }, 'build'],
  ['11:30', { en: 'Show one thing that worked and one that broke (two minutes per table)', pt: 'Mostrar uma coisa que funcionou e uma que falhou (dois minutos por mesa)', es: 'Mostrar una cosa que funcionó y una que falló (dos minutos por mesa)', fr: 'Montrer une chose qui a marché et une qui a cassé (deux minutes par table)' }],
  ['12:00', { en: 'Lunch', pt: 'Almoço', es: 'Comida', fr: 'Déjeuner' }, 'break'],
  ['13:00', { en: 'Build, part 2: prompts 3, 4 and 5; publish', pt: 'Construção, parte 2: instruções 3, 4 e 5; publicar', es: 'Construcción, parte 2: instrucciones 3, 4 y 5; publicar', fr: 'Construction, partie 2 : instructions 3, 4 et 5 ; publier' }, 'build'],
  ['15:30', { en: 'Share: give your app to someone at another table and watch them use it', pt: 'Partilhar: dê a sua aplicação a alguém de outra mesa e veja como a usa', es: 'Compartir: dé su aplicación a alguien de otra mesa y vea cómo la usa', fr: 'Partager : donnez votre application à quelqu\'un d\'une autre table et regardez comment cette personne l\'utilise' }, 'key'],
  ['16:00', { en: 'The handover: what it takes for five or fifty people to use it (backups, changes, security)', pt: 'A passagem: o que é preciso para cinco ou cinquenta pessoas a usarem (cópias de segurança, alterações, segurança)', es: 'El traspaso: lo que hace falta para que cinco o cincuenta personas la usen (copias de seguridad, cambios, seguridad)', fr: 'La passation : ce qu\'il faut pour que cinq ou cinquante personnes l\'utilisent (sauvegardes, modifications, sécurité)' }],
  ['16:45', { en: "Show and tell; the jury's picks", pt: 'Mostrar e contar; as escolhas do júri', es: 'Mostrar y contar; las elecciones del jurado', fr: 'Présentations ; les choix du jury' }],
  ['17:30', { en: 'Next steps: who will release which apps properly, and how', pt: 'Próximos passos: quem vai lançar que aplicações a sério, e como', es: 'Próximos pasos: quién lanzará qué aplicaciones como es debido, y cómo', fr: 'Prochaines étapes : qui publiera quelles applications pour de bon, et comment' }],
];

const T = {
  en: {
    title: 'Spreadsheet to App: bring a spreadsheet from your work, leave with an app',
    desc: 'A proposed session programme: bring a spreadsheet from your work, with dummy data, and leave with an app. Try it now with one of five examples or your own file; nothing leaves your browser.',
    home: 'Home', navTry: 'Try it', navPrompts: 'The five prompts', navDay: 'The day', navPublish: 'Publishing',
    tag: 'Proposal: no session has been run yet',
    h1: 'Spreadsheet to App', sub: 'Bring a spreadsheet from your work, leave with an app.',
    lede: 'A programme of sessions proposed to us by the SGit Newsroom on 31 October 2026. One premise: let\'s turn your spreadsheet into an application. It would bring out the people we most want to reach: people in local businesses who already run part of their work on spreadsheets, who are curious about AI, and who want to understand it by doing something useful.',
    ctaTry: 'Try it now, in your browser', ctaPrompts: 'Read the five prompts',
    reqTitle: 'The only two requirements',
    req: ['An account with a model that can build an app: Lovable, Claude, ChatGPT, Mistral or another.', 'A spreadsheet or document from your work, with dummy data: the same shape as the real one, close enough to be useful, and safe to publish.'],
    reqAfter: 'That is all. Dummy data keeps everything confidential out, so nothing has to be protected, and it means the app can be published and shared on the day, which is where the learning happens.',
    reqLaptop: 'Bring a laptop and a charger. Free tiers can work; event credits help.',
    tryKicker: 'Try it', tryTitle: 'No blank page',
    tryLede: 'Most workshops stall at the same moment: someone asks what problem you want to solve, and the room goes quiet. Here, people arrive with the problem already written down, as a spreadsheet they use every week. For anyone who arrives without one, there are five ready-made examples, invented and publishable. Pick one, or bring your own, and watch the five prompts turn it into an app.',
    tryHonest: 'This page builds the app with simple rules in your browser, not with an AI model, so you can see in seconds the kind of app the five prompts produce. On the day, you build your own with the model you choose.',
    pickTitle: 'Pick an example', pickView: 'First screen', raw: 'Open the raw file',
    noscript: 'The tool needs JavaScript. The examples above open as raw files, and the programme below reads without it.',
    privacy: 'Nothing leaves your browser. Files are read on this page and kept in this browser only.',
    promptsKicker: 'The method', promptsTitle: 'Five prompts, in order',
    promptsLede: 'Use any model that can build and publish a small web app: Lovable, Claude, ChatGPT, Mistral or another. Paste your spreadsheet (dummy data only) or one of the examples with the first prompt, then send the others one at a time, using the app between each.',
    promptN: n => `Prompt ${n}`, copy: 'Copy', copied: 'Copied',
    after: 'After the five: use it for real, then come back with what broke or what you missed. That is the next prompt.',
    dayKicker: 'A mock event (simulated)', dayTitle: 'The day',
    dayLede: 'A one-day session, in the format of the Vibathon Algarve 2026. Mentors at the tables, a moment where each app is handed to someone at another table, and a session on what it takes for five or fifty people to use it.',
    pubKicker: 'Where the apps live', pubTitle: 'Three ways to publish',
    pubLede: 'A programme can use all three.',
    ways: [
      ['A', "Each person's own tool", 'Lovable, a Claude artifact or a ChatGPT canvas can all publish a small app with a link.'],
      ['B', 'A GitHub organisation for the programme', 'We would have a GitHub organisation with a template repository; each participant gets a repository made from it, published with GitHub Pages. Everyone starts from the same base, and every app has a history.'],
      ['C', 'A small team that moves them', "Participants publish from their own tool, share the link, and a team of the region's providers moves the app into the organisation for them during the afternoon. This is the first taste of villager services, on the day."],
    ],
    afterTitle: 'After the day',
    afterList: ["Every app has a page, with its owner's permission.", 'A follow-up within a week: what the app needs to be used by others, and who in the region can do it.'],
    market: "Many of these apps will break later, when more people need them and the person who built them has a day job. That is when the region's providers come in, and that is the market these sessions create.",
    packKicker: 'The pack', packTitle: 'A worked example, and everything in the open',
    packText: 'The first example, the holiday home checklist, was converted into an app with the five prompts for the proposal. It shows the three phases, the essential steps first, a way to add a step, a note and a history for every run, and an honest "about" that says the data stays in the browser and that sharing between two phones is not there yet.',
    packLink: 'Open the worked example from the pack', packLinkNote: '',
    packVault: 'The examples, the five prompts, the mock event plan and the converted app are published together as a public, read-only sgit vault (ph10xfc1), so our team can open it, copy it and use it for the first session. Everything in it is invented and licensed for reuse (CC BY 4.0).',
    packFiles: 'The files, as served here:',
    claimsTitle: 'What this does not claim',
    claims: ['It is a proposal, with a mock event. No session has been run yet, and nothing in it is agreed.', 'Every example, person and figure in the pack is invented.', "The converted app was built for the proposal, to show what the five prompts produce; a participant's will look different. So will the apps made by the tool on this page.", 'The models change. The prompts are written for any model that can build and publish a small web app.', "The proposal's author stated an interest: The Cyber Boardroom is joining Algarve Evolution and offers villager services."],
    footProposal: 'Proposed to us by the SGit Newsroom on 31 October 2026. Text and examples CC BY 4.0; the tool\'s code Apache-2.0.',
    back: 'Back to the home page', onPage: 'On this page', version: 'Version', exNote: '',
    payNote: 'Pay per use, simulated: every action in the tool costs a few cents of credit (watch the counter at the bottom left). Nothing is charged; the credit lives only in this browser.', payTitle: 'Simulated credit, per use',
  },
  pt: {
    title: 'Da folha de cálculo à aplicação: traga uma folha de cálculo do seu trabalho, saia com uma aplicação',
    desc: 'Um programa de sessões proposto: traga uma folha de cálculo do seu trabalho, com dados fictícios, e saia com uma aplicação. Experimente já com um de cinco exemplos ou com o seu ficheiro; nada sai do seu navegador.',
    home: 'Início', navTry: 'Experimentar', navPrompts: 'As cinco instruções', navDay: 'O dia', navPublish: 'Publicar',
    tag: 'Proposta: ainda não se realizou nenhuma sessão',
    h1: 'Da folha de cálculo à aplicação', sub: 'Traga uma folha de cálculo do seu trabalho, saia com uma aplicação.',
    lede: 'Um programa de sessões que nos foi proposto pelo SGit Newsroom a 31 de outubro de 2026. Uma premissa: vamos transformar a sua folha de cálculo numa aplicação. Traria as pessoas que mais queremos alcançar: quem trabalha em empresas locais e já gere parte do trabalho em folhas de cálculo, tem curiosidade pela IA e quer percebê-la fazendo algo útil.',
    ctaTry: 'Experimente já, no seu navegador', ctaPrompts: 'Ler as cinco instruções',
    reqTitle: 'Os dois únicos requisitos',
    req: ['Uma conta num modelo que consiga construir uma aplicação: Lovable, Claude, ChatGPT, Mistral ou outro.', 'Uma folha de cálculo ou um documento do seu trabalho, com dados fictícios: com a mesma forma que o verdadeiro, suficientemente próximo para ser útil e seguro para publicar.'],
    reqAfter: 'Mais nada. Os dados fictícios deixam de fora tudo o que é confidencial, por isso nada precisa de ser protegido, e permitem publicar e partilhar a aplicação no próprio dia, que é onde se aprende.',
    reqLaptop: 'Traga um portátil e um carregador. Os planos gratuitos podem servir; os créditos do evento ajudam.',
    tryKicker: 'Experimentar', tryTitle: 'Sem página em branco',
    tryLede: 'A maior parte dos workshops encrava no mesmo momento: alguém pergunta que problema quer resolver e a sala fica em silêncio. Aqui, as pessoas chegam com o problema já escrito, numa folha de cálculo que usam todas as semanas. Para quem chegar sem nenhuma, há cinco exemplos prontos, inventados e publicáveis. Escolha um, ou traga o seu, e veja as cinco instruções transformá-lo numa aplicação.',
    tryHonest: 'Esta página constrói a aplicação com regras simples no seu navegador, não com um modelo de IA, para que veja em segundos o tipo de aplicação que as cinco instruções produzem. No dia, cada pessoa constrói a sua com o modelo que escolher.',
    pickTitle: 'Escolha um exemplo', pickView: 'Primeiro ecrã', raw: 'Abrir o ficheiro original',
    noscript: 'A ferramenta precisa de JavaScript. Os exemplos acima abrem como ficheiros originais e o programa abaixo lê-se sem ele.',
    privacy: 'Nada sai do seu navegador. Os ficheiros são lidos nesta página e ficam guardados só neste navegador.',
    promptsKicker: 'O método', promptsTitle: 'Cinco instruções, por ordem',
    promptsLede: 'Use qualquer modelo que consiga construir e publicar uma pequena aplicação web: Lovable, Claude, ChatGPT, Mistral ou outro. Cole a sua folha de cálculo (só dados fictícios) ou um dos exemplos com a primeira instrução e depois envie as outras uma de cada vez, usando a aplicação entre cada uma.',
    promptN: n => `Instrução ${n}`, copy: 'Copiar', copied: 'Copiado',
    after: 'Depois das cinco: use-a a sério e volte com o que falhou ou o que faltou. Essa é a instrução seguinte.',
    dayKicker: 'Um evento simulado', dayTitle: 'O dia',
    dayLede: 'Uma sessão de um dia, no formato do Vibathon Algarve 2026. Mentores nas mesas, um momento em que cada aplicação passa para alguém de outra mesa e uma sessão sobre o que é preciso para cinco ou cinquenta pessoas a usarem.',
    pubKicker: 'Onde ficam as aplicações', pubTitle: 'Três formas de publicar',
    pubLede: 'Um programa pode usar as três.',
    ways: [
      ['A', 'A ferramenta de cada pessoa', 'O Lovable, um artifact do Claude ou um canvas do ChatGPT podem publicar uma pequena aplicação com um link.'],
      ['B', 'Uma organização GitHub para o programa', 'Teríamos uma organização GitHub com um repositório modelo; cada participante recebe um repositório feito a partir dele, publicado com o GitHub Pages. Todos partem da mesma base e cada aplicação tem um histórico.'],
      ['C', 'Uma pequena equipa que as muda', 'Os participantes publicam a partir da sua ferramenta, partilham o link e uma equipa de fornecedores da região muda a aplicação para a organização, durante a tarde. É a primeira amostra dos serviços de aldeia (villager services), no próprio dia.'],
    ],
    afterTitle: 'Depois do dia',
    afterList: ['Cada aplicação tem uma página, com a autorização de quem a fez.', 'Um acompanhamento no prazo de uma semana: o que a aplicação precisa para ser usada por outros e quem na região o pode fazer.'],
    market: 'Muitas destas aplicações vão falhar mais tarde, quando mais pessoas precisarem delas e quem as construiu tiver o seu emprego. É aí que entram os fornecedores da região, e é esse o mercado que estas sessões criam.',
    packKicker: 'O pacote', packTitle: 'Um exemplo trabalhado, e tudo à vista',
    packText: 'O primeiro exemplo, a lista da casa de férias, foi convertido numa aplicação com as cinco instruções para a proposta. Mostra as três fases, primeiro os passos essenciais, uma forma de acrescentar um passo, uma nota e um histórico de cada ronda, e um "sobre" honesto que diz que os dados ficam no navegador e que a partilha entre dois telemóveis ainda não existe.',
    packLink: 'Abrir o exemplo trabalhado do pacote', packLinkNote: '(em inglês)',
    packVault: 'Os exemplos, as cinco instruções, o plano do evento simulado e a aplicação convertida estão publicados juntos num cofre sgit público, só de leitura (ph10xfc1), para que a nossa equipa o possa abrir, copiar e usar na primeira sessão. Tudo nele é inventado e tem licença para reutilização (CC BY 4.0).',
    packFiles: 'Os ficheiros, tal como estão aqui:',
    claimsTitle: 'O que isto não afirma',
    claims: ['É uma proposta, com um evento simulado. Ainda não se realizou nenhuma sessão e nada nela está acordado.', 'Todos os exemplos, pessoas e números do pacote são inventados.', 'A aplicação convertida foi feita para a proposta, para mostrar o que as cinco instruções produzem; a de cada participante será diferente. Tal como as aplicações feitas pela ferramenta desta página.', 'Os modelos mudam. As instruções foram escritas para qualquer modelo que consiga construir e publicar uma pequena aplicação web.', 'O autor da proposta declarou um interesse: a The Cyber Boardroom vai aderir à Algarve Evolution e oferece serviços de aldeia (villager services).'],
    footProposal: 'Proposto pelo SGit Newsroom a 31 de outubro de 2026. Textos e exemplos CC BY 4.0; o código da ferramenta Apache-2.0.',
    back: 'Voltar à página inicial', onPage: 'Nesta página', version: 'Versão',
    exNote: 'Os exemplos estão em inglês, tal como o pacote os publica; a aplicação à volta deles segue a sua língua.',
    payNote: 'Pagar por utilização, simulado: cada ação na ferramenta custa alguns cêntimos de crédito (veja o contador em baixo, à esquerda). Nada é cobrado; o crédito fica só neste navegador.', payTitle: 'Crédito simulado, por utilização',
  },
  es: {
    title: 'De la hoja de cálculo a la app: traiga una hoja de cálculo de su trabajo y llévese una aplicación',
    desc: 'Un programa de sesiones propuesto: traiga una hoja de cálculo de su trabajo, con datos ficticios, y llévese una aplicación. Pruébelo ya con uno de cinco ejemplos o con su propio archivo; nada sale de su navegador.',
    home: 'Inicio', navTry: 'Probar', navPrompts: 'Las cinco instrucciones', navDay: 'El día', navPublish: 'Publicar',
    tag: 'Propuesta: todavía no se ha celebrado ninguna sesión',
    h1: 'De la hoja de cálculo a la app', sub: 'Traiga una hoja de cálculo de su trabajo y llévese una aplicación.',
    lede: 'Un programa de sesiones que nos propuso el SGit Newsroom el 31 de octubre de 2026. Una premisa: convirtamos su hoja de cálculo en una aplicación. Atraería a las personas que más queremos alcanzar: quienes trabajan en empresas locales y ya llevan parte de su trabajo en hojas de cálculo, sienten curiosidad por la IA y quieren entenderla haciendo algo útil.',
    ctaTry: 'Pruébelo ya, en su navegador', ctaPrompts: 'Leer las cinco instrucciones',
    reqTitle: 'Los dos únicos requisitos',
    req: ['Una cuenta en un modelo que pueda construir una aplicación: Lovable, Claude, ChatGPT, Mistral u otro.', 'Una hoja de cálculo o un documento de su trabajo, con datos ficticios: con la misma forma que el real, lo bastante parecido para ser útil y seguro para publicar.'],
    reqAfter: 'Nada más. Los datos ficticios dejan fuera todo lo confidencial, así que no hay nada que proteger, y permiten publicar y compartir la aplicación el mismo día, que es donde se aprende.',
    reqLaptop: 'Traiga un portátil y un cargador. Los planes gratuitos pueden servir; los créditos del evento ayudan.',
    tryKicker: 'Probar', tryTitle: 'Sin página en blanco',
    tryLede: 'La mayoría de los talleres se atascan en el mismo momento: alguien pregunta qué problema quiere resolver y la sala se queda en silencio. Aquí, la gente llega con el problema ya escrito, en una hoja de cálculo que usa cada semana. Para quien llegue sin ninguna, hay cinco ejemplos preparados, inventados y publicables. Elija uno, o traiga el suyo, y vea cómo las cinco instrucciones lo convierten en una aplicación.',
    tryHonest: 'Esta página construye la aplicación con reglas sencillas en su navegador, no con un modelo de IA, para que vea en segundos el tipo de aplicación que producen las cinco instrucciones. El día de la sesión, cada persona construye la suya con el modelo que elija.',
    pickTitle: 'Elija un ejemplo', pickView: 'Primera pantalla', raw: 'Abrir el archivo original',
    noscript: 'La herramienta necesita JavaScript. Los ejemplos de arriba se abren como archivos originales y el programa de abajo se lee sin él.',
    privacy: 'Nada sale de su navegador. Los archivos se leen en esta página y se guardan solo en este navegador.',
    promptsKicker: 'El método', promptsTitle: 'Cinco instrucciones, en orden',
    promptsLede: 'Use cualquier modelo que pueda construir y publicar una pequeña aplicación web: Lovable, Claude, ChatGPT, Mistral u otro. Pegue su hoja de cálculo (solo datos ficticios) o uno de los ejemplos con la primera instrucción y después envíe las demás de una en una, usando la aplicación entre cada una.',
    promptN: n => `Instrucción ${n}`, copy: 'Copiar', copied: 'Copiado',
    after: 'Después de las cinco: úsela de verdad y vuelva con lo que falló o lo que echó en falta. Esa es la siguiente instrucción.',
    dayKicker: 'Un evento simulado', dayTitle: 'El día',
    dayLede: 'Una sesión de un día, con el formato del Vibathon Algarve 2026. Mentores en las mesas, un momento en que cada aplicación pasa a alguien de otra mesa y una sesión sobre lo que hace falta para que cinco o cincuenta personas la usen.',
    pubKicker: 'Dónde viven las aplicaciones', pubTitle: 'Tres formas de publicar',
    pubLede: 'Un programa puede usar las tres.',
    ways: [
      ['A', 'La herramienta de cada persona', 'Lovable, un artifact de Claude o un canvas de ChatGPT pueden publicar una pequeña aplicación con un enlace.'],
      ['B', 'Una organización de GitHub para el programa', 'Tendríamos una organización de GitHub con un repositorio plantilla; cada participante recibe un repositorio hecho a partir de ella, publicado con GitHub Pages. Todos parten de la misma base y cada aplicación tiene un historial.'],
      ['C', 'Un pequeño equipo que las traslada', 'Los participantes publican desde su propia herramienta, comparten el enlace y un equipo de proveedores de la región traslada la aplicación a la organización por ellos durante la tarde. Es la primera muestra de los servicios de aldea (villager services), el mismo día.'],
    ],
    afterTitle: 'Después del día',
    afterList: ['Cada aplicación tiene una página, con el permiso de quien la hizo.', 'Un seguimiento en el plazo de una semana: lo que necesita la aplicación para que la usen otros y quién en la región puede hacerlo.'],
    market: 'Muchas de estas aplicaciones fallarán más adelante, cuando más personas las necesiten y quien las construyó tenga su propio trabajo. Ahí entran los proveedores de la región, y ese es el mercado que crean estas sesiones.',
    packKicker: 'El paquete', packTitle: 'Un ejemplo resuelto, y todo a la vista',
    packText: 'El primer ejemplo, la lista de la casa de vacaciones, se convirtió en una aplicación con las cinco instrucciones para la propuesta. Muestra las tres fases, primero los pasos esenciales, una forma de añadir un paso, una nota y un historial de cada ronda, y un "acerca de" honesto que dice que los datos se quedan en el navegador y que todavía no se pueden compartir entre dos teléfonos.',
    packLink: 'Abrir el ejemplo resuelto del paquete', packLinkNote: '(en inglés)',
    packVault: 'Los ejemplos, las cinco instrucciones, el plan del evento simulado y la aplicación convertida están publicados juntos en una bóveda sgit pública, de solo lectura (ph10xfc1), para que nuestro equipo pueda abrirla, copiarla y usarla en la primera sesión. Todo en ella es inventado y tiene licencia de reutilización (CC BY 4.0).',
    packFiles: 'Los archivos, tal como se sirven aquí:',
    claimsTitle: 'Lo que esto no afirma',
    claims: ['Es una propuesta, con un evento simulado. Todavía no se ha celebrado ninguna sesión y nada en ella está acordado.', 'Todos los ejemplos, personas y cifras del paquete son inventados.', 'La aplicación convertida se hizo para la propuesta, para mostrar lo que producen las cinco instrucciones; la de cada participante será distinta. También lo serán las aplicaciones que hace la herramienta de esta página.', 'Los modelos cambian. Las instrucciones están escritas para cualquier modelo que pueda construir y publicar una pequeña aplicación web.', 'El autor de la propuesta declaró un interés: The Cyber Boardroom se une a Algarve Evolution y ofrece servicios de aldea (villager services).'],
    footProposal: 'Propuesto por el SGit Newsroom el 31 de octubre de 2026. Textos y ejemplos CC BY 4.0; el código de la herramienta, Apache-2.0.',
    back: 'Volver a la página de inicio', onPage: 'En esta página', version: 'Versión',
    exNote: 'Los ejemplos están en inglés, tal como los publica el paquete; la aplicación que los rodea sigue su idioma.',
    payNote: 'Pago por uso, simulado: cada acción en la herramienta cuesta unos céntimos de crédito (mire el contador abajo a la izquierda). No se cobra nada; el crédito vive solo en este navegador.', payTitle: 'Crédito simulado, por uso',
  },
  fr: {
    title: 'Du tableur à l\'app : apportez un tableur de votre travail, repartez avec une application',
    desc: 'Un programme de sessions proposé : apportez un tableur de votre travail, avec des données fictives, et repartez avec une application. Essayez dès maintenant avec l\'un des cinq exemples ou votre propre fichier ; rien ne quitte votre navigateur.',
    home: 'Accueil', navTry: 'Essayer', navPrompts: 'Les cinq instructions', navDay: 'La journée', navPublish: 'Publier',
    tag: 'Proposition : aucune session n\'a encore eu lieu',
    h1: 'Du tableur à l\'app', sub: 'Apportez un tableur de votre travail, repartez avec une application.',
    lede: 'Un programme de sessions que nous a proposé le SGit Newsroom le 31 octobre 2026. Un principe : transformons votre tableur en application. Il attirerait les personnes que nous voulons le plus toucher : celles qui travaillent dans des entreprises locales, gèrent déjà une partie de leur travail dans des tableurs, sont curieuses de l\'IA et veulent la comprendre en faisant quelque chose d\'utile.',
    ctaTry: 'Essayez maintenant, dans votre navigateur', ctaPrompts: 'Lire les cinq instructions',
    reqTitle: 'Les deux seules conditions',
    req: ['Un compte sur un modèle capable de construire une application : Lovable, Claude, ChatGPT, Mistral ou un autre.', 'Un tableur ou un document de votre travail, avec des données fictives : la même forme que le vrai, assez proche pour être utile, et sans risque à publier.'],
    reqAfter: 'C\'est tout. Les données fictives laissent de côté tout ce qui est confidentiel, donc rien n\'a besoin d\'être protégé, et l\'application peut être publiée et partagée le jour même : c\'est là qu\'on apprend.',
    reqLaptop: 'Apportez un ordinateur portable et un chargeur. Les offres gratuites peuvent suffire ; les crédits de l\'événement aident.',
    tryKicker: 'Essayer', tryTitle: 'Pas de page blanche',
    tryLede: 'La plupart des ateliers calent au même moment : quelqu\'un demande quel problème vous voulez résoudre, et la salle se tait. Ici, les gens arrivent avec le problème déjà écrit, dans un tableur qu\'ils utilisent chaque semaine. Pour qui arrive sans, il y a cinq exemples prêts à l\'emploi, inventés et publiables. Choisissez-en un, ou apportez le vôtre, et regardez les cinq instructions le transformer en application.',
    tryHonest: 'Cette page construit l\'application avec des règles simples dans votre navigateur, pas avec un modèle d\'IA, pour que vous voyiez en quelques secondes le type d\'application que produisent les cinq instructions. Le jour venu, chacun construit la sienne avec le modèle de son choix.',
    pickTitle: 'Choisissez un exemple', pickView: 'Premier écran', raw: 'Ouvrir le fichier brut',
    noscript: 'L\'outil a besoin de JavaScript. Les exemples ci-dessus s\'ouvrent comme fichiers bruts, et le programme ci-dessous se lit sans lui.',
    privacy: 'Rien ne quitte votre navigateur. Les fichiers sont lus sur cette page et gardés uniquement dans ce navigateur.',
    promptsKicker: 'La méthode', promptsTitle: 'Cinq instructions, dans l\'ordre',
    promptsLede: 'Utilisez n\'importe quel modèle capable de construire et de publier une petite application web : Lovable, Claude, ChatGPT, Mistral ou un autre. Collez votre tableur (données fictives uniquement) ou l\'un des exemples avec la première instruction, puis envoyez les autres une à une, en utilisant l\'application entre chacune.',
    promptN: n => `Instruction ${n}`, copy: 'Copier', copied: 'Copié',
    after: 'Après les cinq : utilisez-la pour de vrai, puis revenez avec ce qui a cassé ou ce qui vous a manqué. C\'est l\'instruction suivante.',
    dayKicker: 'Un événement fictif (simulé)', dayTitle: 'La journée',
    dayLede: 'Une session d\'une journée, au format du Vibathon Algarve 2026. Des mentors aux tables, un moment où chaque application est confiée à quelqu\'un d\'une autre table, et une session sur ce qu\'il faut pour que cinq ou cinquante personnes l\'utilisent.',
    pubKicker: 'Où vivent les applications', pubTitle: 'Trois façons de publier',
    pubLede: 'Un programme peut utiliser les trois.',
    ways: [
      ['A', 'L\'outil de chacun', 'Lovable, un artifact Claude ou un canvas ChatGPT peuvent tous publier une petite application avec un lien.'],
      ['B', 'Une organisation GitHub pour le programme', 'Nous aurions une organisation GitHub avec un dépôt modèle ; chaque participant reçoit un dépôt créé à partir de celui-ci, publié avec GitHub Pages. Tout le monde part de la même base, et chaque application a un historique.'],
      ['C', 'Une petite équipe qui les déplace', 'Les participants publient depuis leur propre outil, partagent le lien, et une équipe de prestataires de la région déplace l\'application dans l\'organisation pour eux pendant l\'après-midi. C\'est le premier avant-goût des services de village (villager services), le jour même.'],
    ],
    afterTitle: 'Après la journée',
    afterList: ['Chaque application a une page, avec l\'accord de son auteur.', 'Un suivi dans la semaine : ce dont l\'application a besoin pour être utilisée par d\'autres, et qui dans la région peut le faire.'],
    market: 'Beaucoup de ces applications casseront plus tard, quand davantage de personnes en auront besoin et que leur auteur aura un autre travail. C\'est là qu\'interviennent les prestataires de la région, et c\'est le marché que ces sessions créent.',
    packKicker: 'Le dossier', packTitle: 'Un exemple complet, et tout en accès libre',
    packText: 'Le premier exemple, la liste de la maison de vacances, a été converti en application avec les cinq instructions pour la proposition. Il montre les trois phases, les étapes essentielles d\'abord, un moyen d\'ajouter une étape, une note et un historique pour chaque tournée, et une rubrique « à propos » honnête qui dit que les données restent dans le navigateur et que le partage entre deux téléphones n\'existe pas encore.',
    packLink: 'Ouvrir l\'exemple complet du dossier', packLinkNote: '(en anglais)',
    packVault: 'Les exemples, les cinq instructions, le plan de l\'événement fictif et l\'application convertie sont publiés ensemble dans un coffre sgit public en lecture seule (ph10xfc1), pour que notre équipe puisse l\'ouvrir, le copier et l\'utiliser pour la première session. Tout y est inventé et sous licence de réutilisation (CC BY 4.0).',
    packFiles: 'Les fichiers, tels qu\'ils sont servis ici :',
    claimsTitle: 'Ce que ceci n\'affirme pas',
    claims: ['C\'est une proposition, avec un événement fictif. Aucune session n\'a encore eu lieu, et rien n\'y est convenu.', 'Chaque exemple, personne et chiffre du dossier est inventé.', 'L\'application convertie a été construite pour la proposition, pour montrer ce que produisent les cinq instructions ; celle d\'un participant sera différente. Tout comme les applications créées par l\'outil de cette page.', 'Les modèles changent. Les instructions sont écrites pour n\'importe quel modèle capable de construire et de publier une petite application web.', 'L\'auteur de la proposition a déclaré un intérêt : The Cyber Boardroom rejoint Algarve Evolution et propose des services de village (villager services).'],
    footProposal: 'Proposé par le SGit Newsroom le 31 octobre 2026. Textes et exemples CC BY 4.0 ; le code de l\'outil Apache-2.0.',
    back: 'Retour à la page d\'accueil', onPage: 'Sur cette page', version: 'Version',
    exNote: 'Les exemples sont en anglais, tels que le dossier les fournit ; l\'application autour suit votre langue.',
    payNote: 'Paiement à l\'usage, simulé : chaque action dans l\'outil coûte quelques centimes de crédit (regardez le compteur en bas à gauche). Rien n\'est débité ; le crédit reste dans ce navigateur.', payTitle: 'Crédit simulé, à l\'usage',
  },
};

// French puts a no-break space before : ; ? ! and inside « ». Applied once, to every French string on this page.
const frNb = s => s.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
const nbAll = v => (typeof v === 'string' ? frNb(v) : Array.isArray(v) ? v.map(nbAll) : v && typeof v === 'object' && !(v instanceof Function) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nbAll(x)])) : v);
T.fr = nbAll(T.fr);
const fixFr = o => { if (Array.isArray(o)) o.forEach(fixFr); else if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (k === 'fr' && typeof o[k] === 'string') o[k] = frNb(o[k]); else fixFr(o[k]); } };
fixFr(EXAMPLES); fixFr(PROMPTS); fixFr(DAY);
const LOCALE = { en: 'en-GB', pt: 'pt-PT', es: 'es-ES', fr: 'fr-FR' };
// What each action in the tool costs (simulated cents); tool.js holds the same prices and charges them.
const PRICE = { load: 5, download: 25 };

const HERO_ART = `<svg class="s2p-art" viewBox="0 0 520 380" aria-hidden="true" focusable="false">
  <g class="a-sheet" transform="rotate(-6 150 190)">
    <rect x="22" y="58" width="250" height="270" rx="14" class="a-paper"/>
    <rect x="22" y="58" width="250" height="38" rx="14" class="a-head"/><rect x="22" y="80" width="250" height="16" class="a-head"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="22" x2="272" y1="${96 + i * 38}" y2="${96 + i * 38}" class="a-grid"/>`).join('')}
    <line x1="112" x2="112" y1="58" y2="328" class="a-grid"/><line x1="192" x2="192" y1="58" y2="328" class="a-grid"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="34" y="${108 + i * 38}" width="${50 + (i * 17) % 26}" height="10" rx="5" class="a-cell"/><rect x="124" y="${108 + i * 38}" width="${30 + (i * 11) % 30}" height="10" rx="5" class="a-cell"/><rect x="204" y="${108 + i * 38}" width="${28 + (i * 7) % 22}" height="10" rx="5" class="a-num"/>`).join('')}
    <rect x="34" y="70" width="46" height="12" rx="6" class="a-hcell"/><rect x="124" y="70" width="40" height="12" rx="6" class="a-hcell"/><rect x="204" y="70" width="36" height="12" rx="6" class="a-hcell"/>
  </g>
  <g class="a-flow"><path d="M262 196 C 300 150, 320 150, 352 170" class="a-arrow"/><path d="M344 160 l12 11 -15 5" class="a-arrow"/>
    ${[1, 2, 3, 4, 5].map((n, i) => `<g transform="translate(${262 + i * 20} ${232 + (i % 2) * 14})"><circle r="11" class="a-dot"/><text y="4" text-anchor="middle" class="a-dott">${n}</text></g>`).join('')}</g>
  <g class="a-phone">
    <rect x="352" y="34" width="150" height="312" rx="26" class="a-case"/><rect x="362" y="46" width="130" height="288" rx="18" class="a-screen"/>
    <rect x="374" y="62" width="70" height="10" rx="5" class="a-title"/><rect x="374" y="80" width="106" height="20" rx="10" class="a-search"/>
    ${[0, 1, 2].map(i => `<g transform="translate(374 ${112 + i * 46})"><rect width="106" height="38" rx="9" class="a-card"/><rect x="10" y="12" width="14" height="14" rx="4" class="${i < 2 ? 'a-check on' : 'a-check'}"/>${i < 2 ? '<path d="M13 19l3 3 6-7" class="a-tick"/>' : ''}<rect x="32" y="11" width="${48 - i * 6}" height="7" rx="3.5" class="a-line"/><rect x="32" y="22" width="${34 + i * 6}" height="6" rx="3" class="a-line2"/></g>`).join('')}
    <g transform="translate(374 256)">${[30, 52, 22, 40, 60].map((h, i) => `<rect x="${i * 22}" y="${62 - h}" width="14" height="${h}" rx="4" class="a-bar"/>`).join('')}</g>
  </g>
</svg>`;

export function render(ctx) {
  const { lang, h, chrome, home, alt } = ctx; const { esc, t, cite } = h; const L = T[lang];
  const self = ctx.self;
  const appName = APPS.find(a => a.id === name).name[lang];
  const eur = c => new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'EUR' }).format(c / 100);
  const colon = lang === 'fr' ? '\u00a0:' : ':';
  const examples = EXAMPLES.map(e => ({ id: e.id, file: e.file, type: e.type, name: t(e.name), blurb: t(e.blurb), view: t(e.view), text: readFileSync(new URL(e.file, EX), 'utf8') }));
  const json = JSON.stringify({ lang, eur: { download: eur(PRICE.download) }, examples, prompts: PROMPTS.map(p => ({ title: t(p.title), text: t(p.text) })) }).replace(/</g, '\\u003c');
  const src = cite(ARTICLE);
  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(L.title)} · Algarve Evolution</title>
<meta name="description" content="${esc(L.desc)}">
<meta name="color-scheme" content="light dark">
${chrome.head}
<link rel="stylesheet" href="/spreadsheet-to-app/page.css">
<link rel="stylesheet" href="/spreadsheet-to-app/app.css">
</head>
<body class="s2p">
${chrome.banner}
<a class="s2p-skip" href="#try">${esc(L.navTry)}</a>
<header class="s2p-top"><div class="s2p-wrap s2p-topin">
  <p class="s2p-title"><a class="s2p-brand" href="${home}" title="${esc(L.back)}"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" class="b-sun"/><path d="M3 20c4-3 8-3 13 0s9 3 13 0v6a15 15 0 0 1-26 0z" class="b-sea"/></svg><span class="s2p-brandn">Algarve Evolution</span></a><span class="s2p-slash" aria-hidden="true">/</span><span class="s2p-appn">${esc(appName)}</span></p>
  <nav class="s2p-nav" aria-label="${esc(L.onPage)}"><a href="#try">${esc(L.navTry)}</a><a href="#prompts">${esc(L.navPrompts)}</a><a href="#day">${esc(L.navDay)}</a><a href="#publish">${esc(L.navPublish)}</a></nav>
  <a class="s2p-home" href="#try">${esc(L.navTry)}</a>
</div></header>

<main id="main">
<section class="s2p-hero"><div class="s2p-wrap s2p-herogrid">
  <div class="s2p-herotext">
    <p class="s2p-tag"><span class="s2p-tagdot" aria-hidden="true"></span>${esc(L.tag)}</p>
    <h1>${esc(L.h1)}</h1>
    <p class="s2p-sub">${esc(L.sub)}</p>
    <p class="s2p-lede">${esc(L.lede)}</p>
    <p class="s2p-ctas"><a class="s2p-cta" href="#try">${esc(L.ctaTry)}</a><a class="s2p-cta2" href="#prompts">${esc(L.ctaPrompts)}</a></p>
    ${src}
  </div>
  <div class="s2p-heroside">
    ${HERO_ART}
    <div class="s2p-req"><h2>${esc(L.reqTitle)}</h2><ol>${L.req.map(r => `<li>${esc(r)}</li>`).join('')}</ol><p>${esc(L.reqAfter)}</p><p class="s2p-small">${esc(L.reqLaptop)}</p></div>
  </div>
</div></section>

<section class="s2p-try" id="try" aria-labelledby="try-h"><div class="s2p-wrap">
  <div class="s2p-tryhead">
    <p class="s2p-kicker">${esc(L.tryKicker)}</p>
    <h2 id="try-h">${esc(L.tryTitle)}</h2>
    <p class="s2p-trylede">${esc(L.tryLede)}</p>
    <p class="s2p-honest">${esc(L.tryHonest)}</p>
  </div>
  <div id="s2a-tool" class="s2p-tool">
    <p class="s2p-paynote"><span class="s2p-coin" aria-hidden="true"></span>${esc(L.payNote)}</p>
    <h3 class="s2p-pickh">${esc(L.pickTitle)}</h3>
    <ul class="s2p-picks" role="list">${examples.map((e, i) => `<li><a class="s2p-pick" href="/spreadsheet-to-app/examples/${e.file}" data-example="${e.id}" title="${esc(L.raw)}"><span class="s2p-pickn">0${i + 1}<span class="s2p-pickr"><span class="s2p-price" title="${esc(L.payTitle)}">${esc(eur(PRICE.load))}</span><em>${e.type}</em></span></span><strong>${esc(e.name)}</strong><span class="s2p-pickb">${esc(e.blurb)}</span><span class="s2p-pickv"><span>${esc(L.pickView)}${colon}</span> ${esc(e.view)}</span></a></li>`).join('')}
      <li class="s2p-ownli" data-own hidden></li></ul>
    ${L.exNote ? `<p class="s2p-exnote">${esc(L.exNote)}</p>` : ''}
    <noscript><p class="s2p-noscript">${esc(L.noscript)}</p></noscript>
    <p class="s2p-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>${esc(L.privacy)}</p>
    <div id="s2a-window" class="s2p-window" hidden></div>
  </div>
  ${cite(ARTICLE, 'src s2p-srcdark')}
</div></section>

<section class="s2p-sec" id="prompts" aria-labelledby="prompts-h"><div class="s2p-wrap">
  <p class="s2p-kicker">${esc(L.promptsKicker)}</p>
  <h2 id="prompts-h">${esc(L.promptsTitle)}</h2>
  <p class="s2p-lead">${esc(L.promptsLede)}</p>
  <ol class="s2p-prompts">${PROMPTS.map((p, i) => `<li class="s2p-prompt"><div class="s2p-ph"><span class="s2p-pn">${i + 1}</span><div><p class="s2p-pk">${esc(L.promptN(i + 1))}</p><h3>${esc(t(p.title))}</h3></div><button type="button" class="s2p-copy" data-copy="prompt-${i + 1}" data-label="${esc(L.copy)}" data-done="${esc(L.copied)}" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg><span>${esc(L.copy)}</span><span class="s2p-sr"> ${esc(L.promptN(i + 1))}</span></button></div><blockquote id="prompt-${i + 1}" lang="${lang}">${esc(t(p.text))}</blockquote></li>`).join('')}</ol>
  <p class="s2p-after">${esc(L.after)}</p>
  ${src}
</div></section>

<section class="s2p-sec s2p-alt" id="day" aria-labelledby="day-h"><div class="s2p-wrap s2p-daygrid">
  <div><p class="s2p-kicker">${esc(L.dayKicker)}</p><h2 id="day-h">${esc(L.dayTitle)}</h2><p class="s2p-lead">${esc(L.dayLede)}</p>${src}</div>
  <ol class="s2p-day">${DAY.map(([time, what, kind]) => `<li${kind ? ` class="is-${kind}"` : ''}><time>${time}</time><span>${esc(t(what))}</span></li>`).join('')}</ol>
</div></section>

<section class="s2p-sec" id="publish" aria-labelledby="pub-h"><div class="s2p-wrap">
  <p class="s2p-kicker">${esc(L.pubKicker)}</p>
  <h2 id="pub-h">${esc(L.pubTitle)}</h2>
  <p class="s2p-lead">${esc(L.pubLede)}</p>
  <ol class="s2p-ways">${L.ways.map(([k, a, b]) => `<li><span class="s2p-wk">${k}</span><h3>${esc(a)}</h3><p>${esc(b)}</p></li>`).join('')}</ol>
  <div class="s2p-aftergrid"><div><h3>${esc(L.afterTitle)}</h3><ul>${L.afterList.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><p class="s2p-market">${esc(L.market)}</p></div>
  ${src}
</div></section>

<section class="s2p-sec s2p-alt" id="pack" aria-labelledby="pack-h"><div class="s2p-wrap s2p-packgrid">
  <div>
    <p class="s2p-kicker">${esc(L.packKicker)}</p>
    <h2 id="pack-h">${esc(L.packTitle)}</h2>
    <p>${esc(L.packText)}</p>
    <p><a class="s2p-cta" href="/spreadsheet-to-app/example/">${esc(L.packLink)}</a> ${L.packLinkNote ? `<span class="s2p-small">${esc(L.packLinkNote)}</span>` : ''}</p>
    <p>${esc(L.packVault)}</p>
    ${src}
  </div>
  <div class="s2p-files"><p>${esc(L.packFiles)}</p><ul>${examples.map(e => `<li><a href="/spreadsheet-to-app/examples/${e.file}">${e.file}</a></li>`).join('')}<li><a href="/spreadsheet-to-app/examples/prompts.md">prompts.md</a></li><li><a href="/spreadsheet-to-app/examples/event-plan.md">event-plan.md</a></li><li><a href="/spreadsheet-to-app/examples/README.md">README.md</a></li></ul></div>
</div></section>

<section class="s2p-sec" id="claims" aria-labelledby="claims-h"><div class="s2p-wrap s2p-narrow">
  <h2 id="claims-h">${esc(L.claimsTitle)}</h2>
  <ul class="s2p-claims">${L.claims.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  ${src}
</div></section>
</main>

<footer class="s2p-foot"><div class="s2p-wrap">
  <p><a href="${home}">${esc(L.back)}</a> · ${h.langs.filter(l => l !== lang).map(l => `<a href="${esc(alt[l])}" hreflang="${l}" lang="${l}">${esc(h.langNames[l])}</a>`).join(' · ')}</p>
  <p>${esc(t(ctx.data.voice.banner))}</p>
  <p>${esc(L.footProposal)}</p>
  ${src}
  <p class="s2p-small">${esc(L.version)} ${esc(chrome.version)} · ${esc(self)}</p>
</div></footer>
<script type="application/json" id="s2a-data">${json}</script>
<script src="/spreadsheet-to-app/engine.js" defer></script>
<script src="/spreadsheet-to-app/tool.js" defer></script>
<script src="/assets/credit.js" data-lang="${lang}" data-app="spreadsheet-to-app" data-title="${esc(appName)}" defer></script>
${chrome.foot}
</body>
</html>`;
}
