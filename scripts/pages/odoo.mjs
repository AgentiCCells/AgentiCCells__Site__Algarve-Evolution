// "Live from our Odoo": Algarve Evolution's events and news read from their own Odoo website (their core
// platform and single source of truth) by scripts/odoo/sync-public.mjs, and how a deeper integration would work.
// Every item links back to its page on their Odoo, where people read and register.
export const name = 'odoo';
export const paths = { en: '/odoo/' };

const T = {
  title: { en: 'Live from our Odoo', pt: 'Ao vivo do nosso Odoo', es: 'En directo desde nuestro Odoo', fr: 'En direct de notre Odoo' },
  kicker: { en: 'Integration, working', pt: 'Integração, a funcionar', es: 'Integración, en marcha', fr: 'Intégration, en action' },
  lede: {
    en: 'Odoo is the platform we run on and our single source of truth. Our events and news on this site come straight from it: names, dates, places and links. To read more or to register, you go to our Odoo.',
    pt: 'O Odoo é a plataforma em que trabalhamos e a nossa única fonte de verdade. Os nossos eventos e notícias neste site vêm diretamente dele: nomes, datas, locais e ligações. Para ler mais ou para se inscrever, vai ao nosso Odoo.',
    es: 'Odoo es la plataforma en la que trabajamos y nuestra única fuente de verdad. Nuestros eventos y noticias en este sitio vienen directamente de él: nombres, fechas, lugares y enlaces. Para leer más o inscribirse, se va a nuestro Odoo.',
    fr: 'Odoo est la plateforme sur laquelle nous travaillons et notre unique source de vérité. Nos événements et nos actualités sur ce site en viennent directement : noms, dates, lieux et liens. Pour en savoir plus ou pour s’inscrire, on va sur notre Odoo.',
  },
  read: { en: d => `Read from our Odoo on ${d}`, pt: d => `Lido do nosso Odoo a ${d}`, es: d => `Leído de nuestro Odoo el ${d}`, fr: d => `Lu depuis notre Odoo le ${d}` },
  stats: {
    events: { en: 'events in Odoo', pt: 'eventos no Odoo', es: 'eventos en Odoo', fr: 'événements dans Odoo' },
    upcoming: { en: 'coming up', pt: 'a seguir', es: 'próximos', fr: 'à venir' },
    posts: { en: 'news posts', pt: 'notícias', es: 'noticias', fr: 'actualités' },
    version: { en: 'Odoo version', pt: 'versão do Odoo', es: 'versión de Odoo', fr: 'version d’Odoo' },
  },
  upcoming: { en: 'Coming up', pt: 'A seguir', es: 'Próximamente', fr: 'À venir' },
  none: { en: 'Nothing is scheduled in Odoo after this page was built.', pt: 'Nada está agendado no Odoo depois da data desta página.', es: 'No hay nada programado en Odoo después de la fecha de esta página.', fr: 'Rien n’est prévu dans Odoo après la date de cette page.' },
  register: { en: 'Register on Odoo', pt: 'Inscrever no Odoo', es: 'Inscribirse en Odoo', fr: 'S’inscrire sur Odoo' },
  cal: { en: 'Add to calendar', pt: 'Adicionar ao calendário', es: 'Añadir al calendario', fr: 'Ajouter au calendrier' },
  past: { en: 'Recently', pt: 'Recentemente', es: 'Recientemente', fr: 'Récemment' },
  more: { en: n => `and ${n} more on our Odoo`, pt: n => `e mais ${n} no nosso Odoo`, es: n => `y ${n} más en nuestro Odoo`, fr: n => `et ${n} autres sur notre Odoo` },
  news: { en: 'News from our blog', pt: 'Notícias do nosso blogue', es: 'Noticias de nuestro blog', fr: 'Actualités de notre blog' },
  how: { en: 'How the integration works', pt: 'Como funciona a integração', es: 'Cómo funciona la integración', fr: 'Comment fonctionne l’intégration' },
  steps: [
    { tag: { en: 'Now', pt: 'Agora', es: 'Ahora', fr: 'Maintenant' }, state: 'live',
      h: { en: 'Read from the public website', pt: 'Ler do site público', es: 'Leer del sitio público', fr: 'Lire le site public' },
      p: { en: 'The site reads what our Odoo already publishes: the sitemap, one calendar file per event and the blog feeds. No password, no API key, public pages only, one request at a time. It keeps names, dates, places and links, never descriptions, e-mail addresses or telephone numbers.',
           pt: 'O site lê o que o nosso Odoo já publica: o mapa do site, um ficheiro de calendário por evento e os feeds do blogue. Sem palavra-passe nem chave de API, só páginas públicas, um pedido de cada vez. Guarda nomes, datas, locais e ligações, nunca descrições, emails ou telefones.',
           es: 'El sitio lee lo que nuestro Odoo ya publica: el mapa del sitio, un archivo de calendario por evento y los feeds del blog. Sin contraseña ni clave de API, solo páginas públicas, una petición cada vez. Guarda nombres, fechas, lugares y enlaces, nunca descripciones, correos ni teléfonos.',
           fr: 'Le site lit ce que notre Odoo publie déjà : le plan du site, un fichier de calendrier par événement et les flux du blog. Sans mot de passe ni clé d’API, pages publiques seulement, une requête à la fois. Il garde les noms, dates, lieux et liens, jamais les descriptions, e-mails ou téléphones.' } },
    { tag: { en: 'Next', pt: 'A seguir', es: 'Después', fr: 'Ensuite' }, state: 'proposal',
      h: { en: 'Read with our own API key', pt: 'Ler com a nossa chave de API', es: 'Leer con nuestra propia clave de API', fr: 'Lire avec notre propre clé d’API' },
      p: { en: 'With a read-only API key created in our Odoo and kept as a secret in our own build, the site could read more of what Odoo holds: event seats and status, programmes, and the talent map from our contacts, listing only those who have said yes. The key stays with us; the site never stores data of its own.',
           pt: 'Com uma chave de API só de leitura criada no nosso Odoo e guardada como segredo no nosso próprio build, o site podia ler mais do que o Odoo guarda: lugares e estado dos eventos, programas e o mapa de talento a partir dos nossos contactos, publicando só quem disse que sim. A chave fica connosco; o site nunca guarda dados seus.',
           es: 'Con una clave de API de solo lectura creada en nuestro Odoo y guardada como secreto en nuestro propio build, el sitio podría leer más de lo que guarda Odoo: plazas y estado de los eventos, programas y el mapa de talento a partir de nuestros contactos, publicando solo a quien haya dicho que sí. La clave se queda con nosotros; el sitio nunca guarda datos propios.',
           fr: 'Avec une clé d’API en lecture seule créée dans notre Odoo et gardée comme secret dans notre propre build, le site pourrait lire davantage de ce que contient Odoo : places et statut des événements, programmes, et la carte des talents à partir de nos contacts, en ne publiant que ceux qui ont dit oui. La clé reste chez nous ; le site ne garde jamais de données à lui.' } },
    { tag: { en: 'Later', pt: 'Mais tarde', es: 'Más adelante', fr: 'Plus tard' }, state: 'proposal',
      h: { en: 'Write back to Odoo', pt: 'Escrever de volta no Odoo', es: 'Escribir de vuelta en Odoo', fr: 'Écrire en retour dans Odoo' },
      p: { en: 'What people do on the site could land in Odoo, where our team already works: a need posted on the talent map as a lead or a ticket, a consent answer as a tag on the contact, and pay-per-use credit in Odoo’s own accounts. Nothing is written to our Odoo today.',
           pt: 'O que as pessoas fazem no site podia chegar ao Odoo, onde a nossa equipa já trabalha: uma necessidade publicada no mapa de talento como oportunidade ou pedido, uma resposta de consentimento como etiqueta no contacto e o crédito de pagamento por utilização nas contas do próprio Odoo. Hoje nada é escrito no nosso Odoo.',
           es: 'Lo que la gente hace en el sitio podría llegar a Odoo, donde nuestro equipo ya trabaja: una necesidad publicada en el mapa de talento como oportunidad o ticket, una respuesta de consentimiento como etiqueta en el contacto y el crédito de pago por uso en las cuentas del propio Odoo. Hoy no se escribe nada en nuestro Odoo.',
           fr: 'Ce que les gens font sur le site pourrait arriver dans Odoo, où notre équipe travaille déjà : un besoin publié sur la carte des talents comme piste ou ticket, une réponse de consentement comme étiquette sur le contact, et le crédit de paiement à l’usage dans les comptes d’Odoo. Aujourd’hui, rien n’est écrit dans notre Odoo.' } },
  ],
  stateWord: { live: { en: 'Working', pt: 'A funcionar', es: 'En marcha', fr: 'En action' }, proposal: { en: 'Proposal', pt: 'Proposta', es: 'Propuesta', fr: 'Proposition' } },
  data: { en: 'The data, as a file', pt: 'Os dados, como ficheiro', es: 'Los datos, como archivo', fr: 'Les données, en fichier' },
  allEvents: { en: 'All our events on Odoo', pt: 'Todos os nossos eventos no Odoo', es: 'Todos nuestros eventos en Odoo', fr: 'Tous nos événements sur Odoo' },
};

export function render({ lang, data, h, chrome, home }) {
  const { esc, date, num } = h; const p = tbl => tbl[lang] ?? tbl.en;
  const o = data.odoo || { events: [], posts: [], read: '', source: 'https://www.algarveevolution.pt' };
  const today = o.read || new Date().toISOString().slice(0, 10);
  const upcoming = o.events.filter(e => e.start.slice(0, 10) >= today).sort((a, b) => a.start.localeCompare(b.start));
  const past = o.events.filter(e => e.start.slice(0, 10) < today);
  const time = s => (s.length > 10 ? s.slice(11, 16) : '');
  const when = e => {
    const d1 = e.start.slice(0, 10), d2 = (e.end || '').slice(0, 10);
    const t = time(e.start) ? ` · ${time(e.start)}${e.end && d1 === d2 && time(e.end) ? `–${time(e.end)}` : ''}` : '';
    return d2 && d2 !== d1 ? `${date(d1)} → ${date(d2)}` : `${date(d1)}${t}`;
  };
  const town = pl => (pl || '').split(',').map(s => s.trim()).filter(Boolean).slice(-2, -1)[0] || pl || '';
  const card = e => `<li class="od-ev"><p class="od-when"><time datetime="${esc(e.start)}">${esc(when(e))}</time></p><h3><a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a></h3>${e.place ? `<p class="od-place">${esc(e.place)}</p>` : ''}<p class="od-links"><a class="od-btn" href="${esc(e.register)}" rel="noopener">${esc(p(T.register))}</a> <a href="${esc(e.ics)}" rel="noopener">${esc(p(T.cal))}</a></p></li>`;
  const row = e => `<li><time datetime="${esc(e.start)}">${esc(date(e.start.slice(0, 10)))}</time> <a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a>${e.place ? ` <span>${esc(town(e.place))}</span>` : ''}</li>`;
  const SHOW = 24;
  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Algarve Evolution: ${esc(p(T.title))}</title>
<meta name="description" content="${esc(p(T.lede))}">
${chrome.head}
<link rel="stylesheet" href="/odoo/odoo.css">
</head>
<body>
${chrome.banner}
<header class="od-top"><div class="od-wrap"><a class="od-brand" href="${esc(home)}">Algarve Evolution</a> <span class="od-sep">/</span> <span>${esc(p(T.title))}</span></div></header>
<main id="main" class="od-wrap">
<section class="od-hero">
  <p class="od-kicker">${esc(p(T.kicker))}</p>
  <h1>${esc(p(T.title))}</h1>
  <p class="od-lede">${esc(p(T.lede))}</p>
  <p class="od-read">${esc(p(T.read)(date(today)))} · <a href="${esc(o.source)}" rel="noopener">${esc(o.source.replace(/^https?:\/\/(www\.)?/, ''))}</a></p>
  <ul class="od-stats">
    <li><strong>${num(o.events.length)}</strong> ${esc(p(T.stats.events))}</li>
    <li><strong>${num(upcoming.length)}</strong> ${esc(p(T.stats.upcoming))}</li>
    <li><strong>${num(o.posts.length)}</strong> ${esc(p(T.stats.posts))}</li>
    <li><strong>${esc(o.odoo || '?')}</strong> ${esc(p(T.stats.version))}</li>
  </ul>
</section>
<section class="od-sec" aria-labelledby="od-up"><h2 id="od-up">${esc(p(T.upcoming))}</h2>
${upcoming.length ? `<ul class="od-cards">${upcoming.map(card).join('')}</ul>` : `<p>${esc(p(T.none))}</p>`}
</section>
<section class="od-sec od-split">
  <div aria-labelledby="od-past"><h2 id="od-past">${esc(p(T.past))}</h2><ul class="od-list">${past.slice(0, SHOW).map(row).join('')}</ul>
  ${past.length > SHOW ? `<p class="od-more"><a href="${esc(o.source)}/event" rel="noopener">${esc(p(T.more)(num(past.length - SHOW)))}</a></p>` : ''}</div>
  <div aria-labelledby="od-news"><h2 id="od-news">${esc(p(T.news))}</h2><ul class="od-list">${o.posts.slice(0, 12).map(n => `<li><time datetime="${esc(n.date)}">${esc(n.date ? date(n.date) : '')}</time> <a href="${esc(n.url)}" rel="noopener">${esc(n.title)}</a> <span>${esc(n.blog)}</span></li>`).join('')}</ul></div>
</section>
<section class="od-sec" aria-labelledby="od-how"><h2 id="od-how">${esc(p(T.how))}</h2>
<ol class="od-steps">${T.steps.map((s, i) => `<li class="od-step od-${s.state}"><p class="od-tag"><span>${i + 1}</span> ${esc(p(s.tag))} · <em>${esc(p(T.stateWord[s.state]))}</em></p><h3>${esc(p(s.h))}</h3><p>${esc(p(s.p))}</p></li>`).join('')}</ol>
<p class="od-foot"><a href="/data/odoo.json">${esc(p(T.data))}</a> · <a href="${esc(o.source)}/event" rel="noopener">${esc(p(T.allEvents))}</a></p>
</section>
</main>
${chrome.foot}
</body>
</html>`;
}
