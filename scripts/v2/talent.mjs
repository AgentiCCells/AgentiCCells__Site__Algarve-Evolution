// The Talent Ecosystem: the Algarve Digital Innovators network (communities, informal groups and the people in
// them), grouped as professionals, consultants, mentors and investors, with the partners of co-financed projects
// and the region's stakeholders. António's whiteboard: "talento, competências, parceiros, rede ADI".
// Rendered from the public feed at build time with the same functions the browser uses (src/hub/talent.js), so the
// first paint is the real page; the browser then adds filters, the finder, the network focus, the consent flow and,
// for the Algarve Evolution team, the private feed and the data-quality panel.
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.
import * as T from '../../src/hub/talent.js';

export const path = '/talent/';
export const title = 'Talent Ecosystem';
export const nav = 'Talent Ecosystem';

export function render({ layout, feed, data, h }) {
  const munis = data.places.municipalities;
  const model = T.buildModel(feed, munis);
  const f = { ...T.EMPTY };
  const e = model.entries;
  const count = k => e.filter(x => x.kind === k).length;
  const orgs = count('partner') + count('stakeholder');
  const covered = new Set(e.map(x => x.muni).filter(m => munis.some(mm => mm.id === m))).size;
  const dir = T.directory(model, f);
  const marks = T.mapMarks(model, f);
  const opt = (v, l) => `<option value="${h.esc(v)}">${h.esc(l)}</option>`;
  const muniOpts = munis.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt')).map(m => opt(m.id, m.name)).join('') + opt('region', 'Algarve-wide') + opt('outside', 'Outside the Algarve') + opt('none', 'No town in Odoo');
  const compOpts = model.vocab.map(c => opt(c, c)).join('');
  const partners = e.filter(x => x.kind === 'partner');
  const preset = (label, p) => `<button type="button" class="te-pre" data-preset="${h.esc(JSON.stringify(p))}">${h.esc(label)}</button>`;
  const openCh = model.challenges.filter(c => c.status !== 'closed');

  const body = `
<div id="te-root" class="te">
<section class="te-hero">
  <div class="hub-wrap te-hero-grid">
    <div>
      <p class="kicker kicker-light">Talent Ecosystem</p>
      <h1>Who is in the Algarve's innovation network, what they can do, and where</h1>
      <p class="te-lede">The AE Innovation Hub's larger database: the Algarve Digital Innovators network, its communities, informal groups and the people in them, grouped as professionals, consultants, mentors and investors; with the partners of co-financed projects and the region's stakeholders. Everything here is read from Odoo, and a person appears only when they have agreed.</p>
      <ul class="te-board" aria-label="On António's whiteboard"><li>Talent</li><li>Competences</li><li>Partners</li><li>The ADI network</li></ul>
    </div>
    <figure class="te-quote">
      <blockquote><p>A larger database: people in the Algarve Digital Innovators network, communities, established informal groups and the people in them, but not only them, grouped as professionals, consultants, mentors and investors. Also our partners in co-financed projects, and all the stakeholders of the region of this business innovation hub.</p></blockquote>
      <figcaption><b>António Guerreiro</b>, executive director, Algarve Evolution, 16 November 2026 (our translation from Portuguese)</figcaption>
    </figure>
  </div>
</section>

<section class="te-figs" aria-label="The ecosystem in numbers">
  <div class="hub-wrap">
    <ul class="te-fig-list">
      <li><span class="te-fig-k">Communities and groups</span><span class="te-fig-v">${model.coms.length}</span><span class="te-fig-l">real, each with its source</span>${h.odoo('aih.community', model.coms.length)}</li>
      <li><span class="te-fig-k">Organisations</span><span class="te-fig-v">${orgs}</span><span class="te-fig-l">${count('partner')} project partners and ${count('stakeholder')} stakeholders, real</span>${h.odoo('res.partner', orgs)}</li>
      <li><span class="te-fig-k">People listed</span><span class="te-fig-v" data-te-listed>${model.listed}</span><span class="te-fig-l">with consent; all simulated for the prototype</span>${h.odoo('res.partner', model.listed)}</li>
      <li class="te-fig-hid"><span class="te-fig-k">Withheld</span><span class="te-fig-v" data-te-hidden>${model.hidden == null ? 'not yet in the feed' : model.hidden}</span><span class="te-fig-l">people in Odoo who have not given consent</span><span class="te-fig-rule">aih_consent = false</span></li>
      <li><span class="te-fig-k">Competences</span><span class="te-fig-v">${model.vocab.length}</span><span class="te-fig-l">skills that people and suppliers carry</span>${h.odoo('aih.skill', model.vocab.length)}</li>
      <li><span class="te-fig-k">Municipalities</span><span class="te-fig-v">${covered}<small>/16</small></span><span class="te-fig-l">with at least one record</span></li>
    </ul>
  </div>
</section>

<div class="hub-wrap">
  <div class="te-try" aria-live="polite">
    <p data-only="visitor"><b>As a visitor:</b> browse the directory and the map, and find people by competence. The people you see have agreed to be listed; the number withheld shows the rule at work.</p>
    <p data-only="founder"><b>As a founder:</b> <a href="#find">find a mentor or an investor</a> by what you need. Try "a mentor for fundraising" below.</p>
    <p data-only="mentor"><b>As a mentor:</b> <a href="#listing">see your listing</a> as others see it, approve it, change it, or ask not to be listed.</p>
    <p data-only="supplier"><b>As a professional or consultant:</b> <a href="#listing">manage your listing</a>, and see in <a href="#competences">the competence matrix</a> which skills Challenge Connect asks for.</p>
    <p data-only="challenger"><b>As a challenge owner:</b> <a href="#find">find people and companies</a> with the competences your challenge needs.</p>
    <p data-only="participant"><b>As a participant or juror:</b> find your community on <a href="#map">the map</a> and the people from your Vibathon in <a href="#network">the network</a>.</p>
    <p data-only="staff"><b>As the Algarve Evolution team:</b> with the private feed open you see every contact, including people without consent (marked "Not public"), and <a href="#quality">what is missing in Odoo</a>.</p>
  </div>
  <nav class="te-toc" aria-label="On this page"><ul><li><a href="#directory">Directory</a></li><li><a href="#map">Map</a></li><li><a href="#competences">Competences</a></li><li><a href="#find">Find by competence</a></li><li><a href="#network">Network</a></li><li><a href="#partners">Partners</a></li><li data-only="visitor founder mentor challenger supplier participant"><a href="#listing">Your listing</a></li><li data-only="staff"><a href="#quality">Data quality</a></li></ul></nav>
</div>

<section id="directory" class="te-sec">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Directory</p><h2>The eight kinds of the ecosystem</h2><p class="te-intro">Filter by kind, competence and place, or search. Real organisations and communities link to their source; simulated people say so.</p><p class="te-chips">${h.odoo('res.partner', feed.talent.length)} ${h.odoo('aih.community', model.coms.length)}</p></header>
    <div class="te-consent" data-for="visitor">
      <div class="te-consent-n"><p><b data-te-listed>${model.listed}</b> people listed with consent</p><p class="te-consent-h"><b data-te-hidden>${model.hidden == null ? 'not yet in the feed' : model.hidden}</b> withheld for lack of consent</p></div>
      <div class="te-dots" id="te-dots" role="img" aria-label="${model.listed} people listed with consent">${'<i class="d-on"></i>'.repeat(model.listed)}${model.hidden == null ? '<i class="d-q">?</i>' : '<i class="d-off"></i>'.repeat(model.hidden)}</div>
      <p class="te-consent-r"><b>The rule:</b> a person is in the public feed only when their Odoo contact says <code>aih_consent</code> and is published. <span id="te-consent-note">${model.hidden == null ? 'The number of people withheld is not in the public feed yet (one field to add to the export; the Algarve Evolution team sees it).' : 'Their records stay in Odoo; the public feed leaves them out.'}</span></p>
    </div>
    <div class="te-dir">
      <form class="te-filters" id="te-dir-form" role="search" aria-label="Filter the directory">
        <label class="te-f">Search <input id="te-q" type="search" autocomplete="off" placeholder="Name, skill, town"></label>
        <fieldset class="te-f"><legend>Kind</legend><div class="te-kinds" id="te-kinds">${T.kindFilters(model, f)}</div></fieldset>
        <label class="te-f">Competence <select id="te-comp"><option value="">Any competence</option>${compOpts}</select></label>
        <label class="te-f">Where <select id="te-muni"><option value="">Anywhere</option>${muniOpts}</select></label>
        <label class="te-f">Records <select id="te-origin"><option value="">Real and simulated</option><option value="real">Real only (with a source)</option><option value="simulated">Simulated only</option></select></label>
        <p class="te-f"><button type="button" id="te-reset" class="te-btn te-btn-l">Clear all filters</button></p>
      </form>
      <div class="te-results">
        <p class="te-count"><span id="te-count">${dir.total} of ${e.length} records in the public feed</span></p>
        <div class="te-active" id="te-active"></div>
        <div class="te-cards" id="te-cards">${dir.html}</div>
        <p><button type="button" id="te-more" class="te-btn"${dir.more > 0 ? '' : ' hidden'}>Show ${Math.min(dir.more, 48)} more of ${dir.more}</button></p>
      </div>
    </div>
  </div>
</section>

<section id="map" class="te-sec te-sec-mist">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Map</p><h2>The ADI communities and the ecosystem, by municipality</h2><p class="te-intro">Circles grow with the records in the current selection (<b id="te-map-n">${e.length}</b>); the directory's filters apply here. Each square is a real community. Choose a municipality to filter the directory.</p><p class="te-chips">${h.odoo('aih.community', model.coms.length)} ${h.odoo('res.partner', feed.talent.length)}</p></header>
    <div class="te-map-grid">
      <figure class="te-map">
        <svg class="tm" viewBox="0 0 ${T.MAP.w} ${T.MAP.h}" role="group" aria-label="Map of the Algarve with the 16 municipalities">${T.mapBase(data.places.outline)}<g id="te-marks">${marks.svg}</g></svg>
        <figcaption class="te-legend"><span><i class="lg-c" aria-hidden="true"></i> Records in the selection</span><span><i class="lg-s" aria-hidden="true"></i> A community (real)</span><span class="te-dim">Municipality centres from <a href="${h.esc(data.places.municipalities_source)}" rel="noopener">AMAL's 16 members</a>; outline Natural Earth (public domain).</span></figcaption>
      </figure>
      <div class="te-munis-w"><p class="te-sub">By municipality, west to east</p><ul class="te-munis" id="te-munis">${T.muniList(model, f)}</ul></div>
    </div>
  </div>
</section>

<section id="competences" class="te-sec">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Competences</p><h2>Which competences exist, in whom, and where</h2><p class="te-intro">Each cell counts the people and supplier companies with a competence. The last column is demand: open challenges in Challenge Connect that ask for it. Marked in vermilion where demand is high for the supply. Choose a cell to find them.</p><p class="te-chips">${h.odoo('aih.skill', model.vocab.length)} ${h.odoo('aih.challenge', model.challenges.length)}</p></header>
    <div class="te-mx-bar"><div class="te-seg" role="group" aria-label="Columns"><button type="button" data-mx="kind" aria-pressed="true">By kind</button><button type="button" data-mx="muni" aria-pressed="false">By municipality</button></div>
      <p class="te-mx-key"><span class="te-dim">Fewer</span><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span class="te-dim">More</span></p></div>
    <div class="te-scroll" id="te-mx" role="region" aria-label="Competence matrix" tabindex="0">${T.matrix(model, 'kind')}</div>
  </div>
</section>

<section id="find" class="te-sec te-sec-mist">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Find by competence</p><h2>Find people or organisations by what you need</h2><p class="te-intro">Ranked by competences matched, then by place. The same competences drive the matching in Challenge Connect, so a challenge's needs can be the search.</p></header>
    <div class="te-find">
      <form class="te-find-f" data-for="founder challenger">
        <label>Competence <select id="te-fc"><option value="">Any</option>${compOpts}</select></label>
        <label>Or a Challenge Connect challenge <select id="te-fch"><option value="">None</option>${openCh.map(c => opt(c.id, c.title)).join('')}</select></label>
        <label>Who <select id="te-fw">${T.WHO.map(w => opt(w.id, w.label)).join('')}</select></label>
        <label>Near <select id="te-fm"><option value="">Anywhere</option>${munis.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt')).map(m => opt(m.id, m.name)).join('')}</select></label>
        <div id="te-fcomps" class="te-fcomps"></div>
        <div class="te-pres"><p class="te-sub">Try</p>
          ${preset('A mentor for fundraising', { comps: ['Finance and fundraising'], who: 'mentor' })}
          ${preset('An investor in AI', { comps: ['AI and machine learning'], who: 'investor' })}
          ${preset('A UX designer near Faro', { comps: ['UX design'], who: 'professional consultant', where: 'faro' })}
          ${openCh[0] ? preset(`Suppliers for challenge ${openCh[0].id.replace('ch-', '')}`, { comps: openCh[0].skills, ch: openCh[0].id }) : ''}
        </div>
      </form>
      <div class="te-find-r" id="te-find-res" aria-live="polite">${T.findHtml(model, { comps: [], who: '', where: '' })}</div>
    </div>
  </div>
</section>

<section id="network" class="te-sec">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Network</p><h2>Communities, their members, and the hub's activities</h2><p class="te-intro">Who belongs where, and who is also in the hub: mentors in INC/ACC, suppliers in Challenge Connect, jurors, mentors and teams at a Vibathon. <b id="te-nw-unl">${T.networkData(model).unlinked.length}</b> listed people have no link yet.</p></header>
    <div class="te-nw-bar"><label>Focus on <select id="te-nw-focus"><option value="">Choose a community, person or activity</option></select></label>
      <p class="te-legend"><span><i class="lg-e t-com" aria-hidden="true"></i> Member of a community</span><span><i class="lg-e t-inc" aria-hidden="true"></i> INC/ACC</span><span><i class="lg-e t-cc" aria-hidden="true"></i> Challenge Connect</span><span><i class="lg-e t-vib" aria-hidden="true"></i> Vibathon</span><span data-only="staff"><i class="lg-np" aria-hidden="true"></i> Not public</span></p></div>
    <div class="te-nw-grid">
      <div class="te-scroll te-nw" id="te-nw" role="region" aria-label="Network diagram" tabindex="0">${T.networkSvg(model)}</div>
      <div class="te-nw-detail" id="te-nw-detail" aria-live="polite"><p>Choose a node (click, tap, or Tab then Enter) to see who and what it connects.</p></div>
    </div>
    <p class="te-chips">${h.odoo('aih.community', model.coms.length)} ${h.odoo('aih.programme', model.programmes.length)} ${h.odoo('aih.application', feed.applications.length)} ${h.odoo('aih.vibathon', model.vibathons.length)}</p>
  </div>
</section>

<section id="partners" class="te-sec te-sec-mist">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Partners</p><h2>Project partners and the region's stakeholders</h2><p class="te-intro">The partners of co-financed projects, as their sources describe them, and ${count('stakeholder')} stakeholders: councils, institutions and organisations of the region, all in <a href="#directory">the directory</a>.</p><p class="te-chips">${h.odoo('res.partner', partners.length)}</p></header>
    <ul class="te-wall">${partners.map(p => `<li><h3>${h.esc(p.name)}</h3><p>${h.esc(p.summary)}</p><p class="te-wall-s">${h.esc(T.muniLabel(munis, p.muni))} · ${h.src(p)}</p></li>`).join('')}</ul>
  </div>
</section>

<section id="listing" class="te-sec" data-only="visitor founder mentor challenger supplier participant">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Your listing</p><h2>See your listing, and decide</h2><p class="te-intro">Before anyone is listed, they see their listing and choose: approve it, change it, or ask not to be listed. Try it as one of the simulated people. Your choice is <b>kept in this browser only</b>, and the directory, the map and the consent count change with it.</p></header>
    <div class="te-me" data-for="mentor supplier">
      <label class="te-me-pick">Your listing <select id="te-me"><option>Loading</option></select></label>
      <div id="te-me-out"><p class="te-empty">Loading your listing from the feed.</p></div>
    </div>
  </div>
</section>

<section id="quality" class="te-sec te-sec-mist" data-only="staff">
  <div class="hub-wrap">
    <header class="te-head"><p class="kicker">Data quality</p><h2>What is missing in Odoo</h2><p class="te-intro">The other side of the hub: getting more and better data into Odoo. From the private feed, every gap that stops a record from being found, mapped or listed, with the Odoo call that fixes it. Fixes are kept in this browser only.</p></header>
    <div id="te-quality"><p class="te-empty">Open the private feed to see the full database.</p></div>
  </div>
</section>
</div>
<script type="application/json" id="te-places">${JSON.stringify({ municipalities: munis }).replace(/</g, '\\u003c')}</script>`;

  return layout({
    body,
    description: 'The Talent Ecosystem of the AE Innovation Hub: the Algarve Digital Innovators communities, professionals, consultants, mentors, investors, project partners and stakeholders, by competence and municipality, read from Odoo.',
    head: '<link rel="stylesheet" href="/hub/talent.css">',
    scripts: '<script type="module" src="/hub/talent.js"></script>',
    pageClass: 'page-talent',
  });
}
