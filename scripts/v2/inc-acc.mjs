// INC/ACC: the incubation and acceleration programmes of the AE Innovation Hub, read from Odoo.
// António Guerreiro asked for: managing the programmes, the mentors (one-to-one, one mentor per company; guest
// mentors for clinics and workshops), KPIs from month 0 to month 6 made public, and a reflection on the indicators.
// Everything here comes from the public feed (aih.programme, aih.programme.company, res.partner mentors,
// aih.session, aih.kpi, aih.reflection). Persona workspaces and the staff view are drawn by src/hub/inc-acc.js.
// Owner: sites-dev@AgentiCCells.dinis. Code Apache-2.0, text CC BY 4.0.
export const path = '/inc-acc/';
export const title = 'INC/ACC: incubation and acceleration';
export const nav = 'INC/ACC';

const KPIS = [
  { k: 'revenue_eur', label: 'Monthly revenue', short: 'Revenue', money: true },
  { k: 'customers', label: 'Customers', short: 'Customers', unit: 'customers' },
  { k: 'team_size', label: 'People in the team', short: 'Team', unit: 'people' },
  { k: 'funding_eur', label: 'Funding raised to date', short: 'Funding', money: true },
];
const PSTAGES = ['idea', 'prototype', 'mvp', 'launched', 'scaling'];
const PSTAGE_LABEL = { idea: 'Idea', prototype: 'Prototype', mvp: 'MVP', launched: 'Launched', scaling: 'Scaling' };
const CSTAGE_LABEL = { idea: 'Idea', pre_seed: 'Pre-seed', seed: 'Seed', early_revenue: 'Early revenue', growth: 'Growth' };
const KIND_LABEL = { one_to_one: 'One-to-one', clinic: 'Clinic', workshop: 'Workshop' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const D = iso => new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
const addMonths = (iso, m) => { const d = D(iso); d.setUTCMonth(d.getUTCMonth() + m); return d; };
const isoOf = d => d.toISOString().slice(0, 10);
const shortDate = iso => { const d = D(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const P = v => `${(Math.round(v * 100) / 100).toString()}%`;
const plain = name => String(name || '').replace(/\s*\(simulated\)\s*$/i, '');

export function render({ layout, feed, h }) {
  const { esc, num, money, odoo, sim } = h;
  const NOW = String(feed.meta?.exported || new Date().toISOString()).slice(0, 10);
  const progs = feed.programmes || [];
  const companies = feed.companies || [];
  const mentors = feed.mentors || [];
  const sessions = (feed.sessions || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const kpis = feed.kpis || [];
  const reflections = feed.reflections || [];
  const byId = (list, id) => list.find(r => r.id === id);
  const kindOf = p => (p.kind === 'acceleration' ? 'acc' : 'inc');
  const progName = p => (p.kind === 'acceleration' ? 'Acceleration' : 'Incubation');
  const coOf = p => companies.filter(c => c.programme_id === p.id);
  const mentorOf = cid => mentors.find(m => (m.company_ids || []).includes(cid));
  const kOf = cid => kpis.filter(k => k.company_id === cid).sort((a, b) => a.month - b.month);
  const fmt = (def, v) => (def.money ? money(v) : num(v));
  const compact = (def, v) => {
    const s = Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('en-GB', { maximumFractionDigits: v >= 100000 ? 0 : 1 })}k` : num(v);
    return def.money ? `€${s}` : s;
  };
  const change = (a, b) => {
    if (a === b) return 'no change';
    if (!a) return b > 0 ? 'from zero' : 'no change';
    const p = Math.round(((b - a) / a) * 100);
    return `${p > 0 ? '+' : ''}${p}%`;
  };
  const lastMonthOf = p => Math.max(0, ...kpis.filter(k => coOf(p).some(c => c.id === k.company_id)).map(k => k.month));
  // Cohort totals by month, only months where every company has a snapshot.
  const cohort = (p, key) => {
    const ids = coOf(p).map(c => c.id); const out = [];
    for (let m = 0; m <= 6; m++) {
      const ks = kpis.filter(k => k.month === m && ids.includes(k.company_id));
      if (ks.length && ks.length === ids.length) out.push({ m, v: ks.reduce((s, k) => s + Number(k[key] || 0), 0) });
    }
    return out;
  };
  // Where a programme is now, in programme months (0 to 6), from the date of the Odoo export.
  const progNow = p => {
    const s = D(p.start), e = addMonths(p.start, p.months || 6), n = D(NOW);
    if (n < s) return { frac: 0, label: `Starts ${h.date(p.start)}`, state: 'planned' };
    if (n >= e || p.status === 'finished') return { frac: 6, label: 'Finished: month 6 of 6', state: 'finished' };
    const f = ((n - s) / (e - s)) * (p.months || 6);
    return { frac: f, label: `In month ${Math.floor(f) + 1} of ${p.months || 6}`, state: 'running' };
  };
  const statusPill = p => `<span class="ia-status ia-status-${esc(p.status)}">${esc(p.status === 'running' ? 'Running' : p.status === 'finished' ? 'Finished' : 'Planned')}</span>`;

  // ------------------------------------------------------------------ month timeline (0 to 6)
  const timeline = p => {
    const n = progNow(p); const last = lastMonthOf(p);
    const nodes = Array.from({ length: (p.months || 6) + 1 }, (_, m) => {
      const d = m === 0 ? D(p.start) : addMonths(p.start, m - 1);
      const st = m <= last ? 'kpi' : m <= n.frac ? 'done' : 'future';
      return `<li class="ia-tl-node is-${st}" style="left:${P((m / 6) * 100)}"><span class="ia-tl-dot" aria-hidden="true"></span><span class="ia-tl-m">M${m}</span><span class="ia-tl-d">${m === 0 ? `${d.getUTCDate()} ` : ''}${MONTHS[d.getUTCMonth()]}</span><span class="vh">${m <= last ? ': KPIs recorded' : ': no KPIs yet'}</span></li>`;
    }).join('');
    const nowMark = n.state === 'running' ? `<span class="ia-tl-now" style="left:${P((n.frac / 6) * 100)}"><span>Now</span></span>` : '';
    return `<div class="ia-tl ia-${kindOf(p)}" role="group" aria-label="${esc(progName(p))} timeline, ${esc(n.label)}, KPIs recorded to month ${last}">
      <div class="ia-tl-track" aria-hidden="true"><span class="ia-tl-fill" style="width:${P((Math.min(n.frac, 6) / 6) * 100)}"></span></div>${nowMark}
      <ol>${nodes}</ol></div>`;
  };

  // ------------------------------------------------------------------ figures
  const totals = { companies: companies.length, mentors: mentors.length, sessions: sessions.length };
  const oneToOne = sessions.filter(s => s.kind === 'one_to_one').length;
  const clinics = sessions.filter(s => s.kind === 'clinic').length;
  const workshops = sessions.filter(s => s.kind === 'workshop').length;
  const team0 = progs.reduce((s, p) => s + (cohort(p, 'team_size')[0]?.v || 0), 0);
  const teamL = progs.reduce((s, p) => s + (cohort(p, 'team_size').at(-1)?.v || 0), 0);

  // ------------------------------------------------------------------ charts
  const spark = (pts, cls, maxMonths = 6, tips) => {
    if (!pts.length) return '';
    const vs = pts.map(p => p.v); const max = Math.max(...vs), min = Math.min(0, ...vs); const r = max - min || 1;
    const x = m => 4 + (m / maxMonths) * 92; const y = v => 86 - ((v - min) / r) * 72;
    const segs = pts.slice(1).map((p, i) => `<line x1="${P(x(pts[i].m))}" y1="${P(y(pts[i].v))}" x2="${P(x(p.m))}" y2="${P(y(p.v))}"/>`).join('');
    const end = pts.at(-1);
    const bands = tips ? pts.map(p => `<rect class="ia-band" x="${P(x(p.m) - 46 / maxMonths)}" y="0" width="${P(92 / maxMonths)}" height="100%" data-tip="${esc(tips(p))}"/>`).join('') : '';
    return `<svg class="ia-spark ${cls}" aria-hidden="true" focusable="false"><line class="ia-spark-base" x1="4%" x2="96%" y1="86%" y2="86%"/><g class="ia-spark-line">${segs}</g><circle class="ia-spark-start" cx="${P(x(pts[0].m))}" cy="${P(y(pts[0].v))}" r="3.5"/><circle class="ia-spark-end" cx="${P(x(end.m))}" cy="${P(y(end.v))}" r="4.5"/>${bands}</svg>`;
  };

  // Cohort growth since month 0 (month 0 = 100), both programmes on one indexed axis.
  const cohortChart = def => {
    const series = progs.map(p => {
      const c = cohort(p, def.k); const base = c[0]?.v || 0;
      return { p, pts: c.map(x => ({ m: x.m, v: x.v, idx: base ? (x.v / base) * 100 : 100 })) };
    });
    const all = series.flatMap(s => s.pts.map(x => x.idx));
    const lo = Math.min(100, ...all), hi = Math.max(100, ...all);
    const step = hi - lo <= 120 ? 25 : hi - lo <= 300 ? 50 : 100;
    const min = Math.floor(lo / step) * step, max = Math.max(min + step, Math.ceil(hi / step) * step);
    const x = m => 9 + (m / 6) * 84; const y = v => 10 + (1 - (v - min) / (max - min)) * 76;
    let g = '';
    for (let t = min; t <= max; t += step) g += `<line class="${t === 100 ? 'ia-base' : 'ia-grid'}" x1="0" x2="100%" y1="${P(y(t))}" y2="${P(y(t))}"/><text class="ia-tick" x="0" y="${P(y(t))}" dy="-5">${t}</text>`;
    for (let m = 0; m <= 6; m++) g += `<text class="ia-tick" x="${P(x(m))}" y="100%" dy="-4" text-anchor="middle">M${m}</text>`;
    const lines = series.map((s, si) => {
      const cls = `ia-s-${kindOf(s.p)}`;
      const segs = s.pts.slice(1).map((pt, i) => `<line x1="${P(x(s.pts[i].m))}" y1="${P(y(s.pts[i].idx))}" x2="${P(x(pt.m))}" y2="${P(y(pt.idx))}"/>`).join('');
      const dots = s.pts.map((pt, i) => `<circle cx="${P(x(pt.m))}" cy="${P(y(pt.idx))}" r="${i === s.pts.length - 1 ? 5.5 : 4}"/>`).join('');
      const end = s.pts.at(-1);
      const other = series[1 - si]?.pts.find(q => q.m === end?.m);
      const below = other && other.idx > end.idx;
      const atEdge = end && end.m >= 6;
      const label = end ? `<text class="ia-end" x="${P(x(end.m))}" y="${P(y(end.idx))}" dx="${atEdge ? -10 : 9}" dy="${below ? 18 : atEdge ? -12 : -9}" text-anchor="${atEdge ? 'end' : 'start'}">${esc(change(s.pts[0].v, end.v))}</text>` : '';
      return `<g class="${cls}"><g class="ia-line-segs">${segs}</g><g class="ia-line-dots">${dots}</g>${label}</g>`;
    }).join('');
    const bands = Array.from({ length: 7 }, (_, m) => {
      const parts = series.map(s => { const pt = s.pts.find(q => q.m === m); return pt ? `${progName(s.p)} ${Math.round(pt.idx)} (${fmt(def, pt.v)}${def.money ? '' : ` ${def.unit}`})` : `${progName(s.p)}: not yet`; });
      const tip = `Month ${m}: ${parts.join(' · ')}`;
      return `<rect class="ia-band" x="${P(x(m) - 84 / 12)}" y="0" width="${P(84 / 6)}" height="100%" tabindex="0" role="img" aria-label="${esc(tip)}" data-tip="${esc(tip)}"/>`;
    }).join('');
    return `<figure class="ia-chart" data-k="${def.k}">
      <figcaption><strong>${esc(def.label)}: cohort growth since month 0</strong><span>Cohort total, indexed so month 0 = 100. ${sim({ simulated: true })}</span></figcaption>
      <svg class="ia-line" role="img" aria-label="${esc(`${def.label}, cohort total indexed to month 0 = 100. ${series.map(s => `${progName(s.p)}: ${s.pts.map(pt => `month ${pt.m} ${Math.round(pt.idx)}`).join(', ')}`).join('. ')}`)}">${g}${lines}${bands}</svg>
    </figure>`;
  };

  // Month 0 against the latest month, company by company, on one shared axis (a dumbbell chart).
  const dumbbell = (p, def) => {
    const last = lastMonthOf(p);
    const rows = coOf(p).map(c => { const ks = kOf(c.id); return { c, a: ks[0], b: ks.at(-1) }; }).filter(r => r.a)
      .sort((r1, r2) => r2.b[def.k] - r1.b[def.k]);
    const hi = Math.max(1, ...rows.flatMap(r => [r.a[def.k], r.b[def.k]]));
    const mag = 10 ** Math.floor(Math.log10(hi)); const stepC = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => hi / s <= 5) || mag * 10;
    const max = Math.ceil(hi / stepC) * stepC; const ticks = []; for (let t = 0; t <= max; t += stepC) ticks.push(t);
    const x = v => 3 + (v / max) * 94;
    const grid = ticks.map(t => `<line class="ia-grid" x1="${P(x(t))}" x2="${P(x(t))}" y1="0" y2="100%"/>`).join('');
    const axis = `<div class="ia-db-row ia-db-axis" aria-hidden="true"><span></span><svg class="ia-db-svg">${ticks.map((t, i) => `<text class="ia-tick${i % 2 && i !== ticks.length - 1 ? ' ia-tick-minor' : ''}" x="${P(x(t))}" y="70%" text-anchor="${i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}">${esc(compact(def, t))}</text>`).join('')}</svg><span></span></div>`;
    const body = rows.map(({ c, a, b }) => {
      const tip = `${plain(c.name)}: ${fmt(def, a[def.k])} at month 0, ${fmt(def, b[def.k])} at month ${b.month} (${change(a[def.k], b[def.k])})`;
      return `<div class="ia-db-row" data-tip="${esc(tip)}"><span class="ia-db-name">${esc(plain(c.name))}</span>
        <svg class="ia-db-svg" role="img" aria-label="${esc(tip)}">${grid}<line class="ia-db-bar" x1="${P(x(a[def.k]))}" x2="${P(x(b[def.k]))}" y1="50%" y2="50%"/><circle class="ia-db-a" cx="${P(x(a[def.k]))}" cy="50%" r="5"/><circle class="ia-db-b" cx="${P(x(b[def.k]))}" cy="50%" r="6"/></svg>
        <span class="ia-db-delta">${esc(change(a[def.k], b[def.k]))}</span></div>`;
    }).join('');
    return `<figure class="ia-chart ia-db ia-${kindOf(p)}" data-k="${def.k}">
      <figcaption><strong>${esc(def.label)}: month 0 and month ${last}, company by company</strong><span><i class="ia-key ia-key-a" aria-hidden="true"></i>Month 0 <i class="ia-key ia-key-b" aria-hidden="true"></i>Month ${last}${last < 6 ? ' (latest)' : ''} ${sim({ simulated: true })}</span></figcaption>
      ${axis}${body}</figure>`;
  };

  const ladder = (a, b, cls) => {
    const ia = PSTAGES.indexOf(a), ib = PSTAGES.indexOf(b);
    return `<svg class="ia-ladder ${cls}" role="img" aria-label="${esc(`${PSTAGE_LABEL[a] || a} to ${PSTAGE_LABEL[b] || b}`)}">${PSTAGES.map((s, i) => `<rect x="${P(i * 20 + 1)}" y="3" width="${P(17)}" height="10" rx="2" class="${i === ia ? 'is-start' : ''} ${i > ia && i <= ib ? 'is-moved' : ''} ${i === ib && ia === ib ? 'is-same' : ''}"/>`).join('')}</svg>`;
  };

  // ------------------------------------------------------------------ results, per programme
  const resultsFor = p => {
    const k = kindOf(p); const last = lastMonthOf(p); const cos = coOf(p);
    const moved = cos.filter(c => { const ks = kOf(c.id); return ks.length && PSTAGES.indexOf(ks.at(-1).product_stage) > PSTAGES.indexOf(ks[0].product_stage); }).length;
    const firstSale = cos.filter(c => { const ks = kOf(c.id); return ks.length && !ks[0].revenue_eur && ks.at(-1).revenue_eur > 0; }).length;
    const tiles = KPIS.map(def => {
      const c = cohort(p, def.k); const a = c[0]?.v || 0, b = c.at(-1)?.v || 0;
      const delta = def.k === 'team_size' ? `${b - a >= 0 ? '+' : ''}${b - a} people` : def.k === 'funding_eur' ? `${money(b - a)} new` : change(a, b);
      return `<li class="stat ia-tile"><span class="stat-l ia-tile-label">${esc(def.label)}</span><span class="stat-n">${esc(fmt(def, b))}</span><span class="stat-note ia-tile-from">from ${esc(fmt(def, a))} at month 0 · <b>${esc(delta)}</b></span>${spark(c, `ia-s-${k}`, 6, pt => `Month ${pt.m}: ${fmt(def, pt.v)}`)}</li>`;
    }).join('') + `<li class="stat ia-tile"><span class="stat-l ia-tile-label">Product stage</span><span class="stat-n">${moved} of ${cos.length}</span><span class="stat-note ia-tile-from">moved at least one stage${firstSale ? ` · <b>${firstSale} made a first sale</b>` : ''}</span></li>`;
    const small = cos.map(c => {
      const ks = kOf(c.id); if (!ks.length) return '';
      const variants = KPIS.map(def => {
        const pts = ks.map(q => ({ m: q.month, v: Number(q[def.k] || 0) }));
        return `<div class="ia-sm-k" data-k="${def.k}"><p class="ia-sm-v"><span>M0 ${esc(compact(def, pts[0].v))}</span><span aria-hidden="true">→</span><strong>M${pts.at(-1).m} ${esc(compact(def, pts.at(-1).v))}</strong></p><p class="ia-sm-d">${esc(change(pts[0].v, pts.at(-1).v))}</p>${spark(pts, `ia-s-${k}`, 6, pt => `${plain(c.name)}, month ${pt.m}: ${fmt(def, pt.v)}`)}</div>`;
      }).join('');
      return `<li class="ia-sm"><a class="ia-sm-name" href="#${esc(c.id)}">${esc(plain(c.name))}</a><span class="ia-sm-sector">${esc(c.sector)}</span>${variants}</li>`;
    }).join('');
    const rows = cos.map(c => {
      const ks = kOf(c.id); if (!ks.length) return ''; const a = ks[0], b = ks.at(-1); const m = mentorOf(c.id);
      const cell = def => `<td class="num" data-th="${esc(def.short)}"><span class="ia-from">${esc(fmt(def, a[def.k]))}</span> <span aria-hidden="true">→</span><span class="vh"> to </span> <strong>${esc(fmt(def, b[def.k]))}</strong><small>${esc(change(a[def.k], b[def.k]))}</small></td>`;
      return `<tr><th scope="row"><a href="#${esc(c.id)}">${esc(c.name)}</a> ${sim(c)}<small>${esc(c.sector)} · ${esc(c.town)}</small></th><td data-th="Mentor">${m ? esc(plain(m.name)) : '<span class="ia-muted">Not public</span>'}</td>${KPIS.map(cell).join('')}<td data-th="Product stage">${ladder(a.product_stage, b.product_stage, `ia-s-${k}`)}<small>${esc(PSTAGE_LABEL[a.product_stage])} → ${esc(PSTAGE_LABEL[b.product_stage])}</small></td></tr>`;
    }).join('');
    const tot = def => { const c = cohort(p, def.k); return `<td class="num" data-th="${esc(def.short)}"><span class="ia-from">${esc(fmt(def, c[0]?.v || 0))}</span> → <strong>${esc(fmt(def, c.at(-1)?.v || 0))}</strong><small>${esc(change(c[0]?.v || 0, c.at(-1)?.v || 0))}</small></td>`; };
    return `<div class="ia-prog-results ia-${k}" data-prog="${k}" id="results-${k}">
      <h3 class="ia-pr-head"><span class="ia-swatch" aria-hidden="true"></span>${esc(progName(p))}, cohort ${esc(p.cohort)}: month 0 to month ${last}${last < 6 ? ' (so far)' : ''} ${sim(p)}</h3>
      <ul class="stats ia-tiles">${tiles}</ul>
      <div class="ia-two">
        <div>${KPIS.map(def => dumbbell(p, def)).join('')}</div>
        <div><h4 class="ia-h4">Each company, month by month</h4><p class="ia-note">Each small chart has its own scale; the values say how far each company moved. Hover a month to read it.</p><ul class="ia-sms">${small}</ul></div>
      </div>
      <h4 class="ia-h4">From month 0 to month ${last}: the table</h4>
      <div class="hub-table-wrap ia-table-wrap" role="region" aria-label="${esc(progName(p))}: month 0 to month ${last}, table" tabindex="0">
      <table class="hub-table hub-table-pairs ia-table"><caption class="vh">${esc(progName(p))} cohort ${esc(p.cohort)}, simulated KPIs from Odoo, month 0 against month ${last}</caption>
      <thead><tr><th scope="col">Company</th><th scope="col">Mentor</th>${KPIS.map(d => `<th scope="col" class="num">${esc(d.short)}</th>`).join('')}<th scope="col">Product stage</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th scope="row">The cohort (${cos.length} companies)</th><td class="ia-empty"></td>${KPIS.map(tot).join('')}<td data-th="Product stage"><small>${moved} of ${cos.length} moved</small></td></tr></tfoot></table></div>
    </div>`;
  };

  // ------------------------------------------------------------------ reading the indicators (computed)
  const reading = p => {
    const cos = coOf(p); const rev = cohort(p, 'revenue_eur'); const last = lastMonthOf(p);
    let best = null; for (let i = 1; i < rev.length; i++) { const d = rev[i].v - rev[i - 1].v; if (!best || d > best.d) best = { m: rev[i].m, d }; }
    const winFrom = best ? isoOf(addMonths(p.start, best.m - 1)) : null, winTo = best ? isoOf(addMonths(p.start, best.m)) : null;
    const guests = best ? sessions.filter(s => s.programme_id === p.id && s.kind !== 'one_to_one' && s.date >= winFrom && s.date < winTo) : [];
    const growers = cos.map(c => { const ks = kOf(c.id); return { c, a: ks[0]?.revenue_eur || 0, b: ks.at(-1)?.revenue_eur || 0 }; }).filter(r => r.a > 0).sort((r1, r2) => r2.b / r2.a - r1.b / r1.a);
    const zero = cos.filter(c => !(kOf(c.id)[0]?.revenue_eur));
    const zeroMoved = zero.filter(c => { const ks = kOf(c.id); return PSTAGES.indexOf(ks.at(-1)?.product_stage) > PSTAGES.indexOf(ks[0]?.product_stage); }).length;
    const zeroSold = zero.filter(c => kOf(c.id).at(-1)?.revenue_eur > 0).length;
    const t = cohort(p, 'team_size');
    const items = [];
    if (best) items.push(`The cohort's largest monthly rise in revenue came in month ${best.m} (${money(best.d)} more than month ${best.m - 1}). ${guests.length ? `Guest sessions held in that month: ${guests.map(s => `${s.topic} (${shortDate(s.date)})`).join('; ')}.` : 'No guest session was held in that month; only one-to-ones.'}`);
    if (growers.length) items.push(`Of the ${growers.length} companies with revenue at entry, ${plain(growers[0].c.name)} grew most (${change(growers[0].a, growers[0].b)}) and ${plain(growers.at(-1).c.name)} least (${change(growers.at(-1).a, growers.at(-1).b)}).`);
    if (zero.length) items.push(`${zero.length} ${zero.length === 1 ? 'company' : 'companies'} had no revenue at month 0: ${zeroSold} made a first sale by month ${last}, and ${zeroMoved} moved the product at least one stage. Revenue alone would miss most of their progress.`);
    if (t.length) items.push(`The ${cos.length} companies employ ${t.at(-1).v} people at month ${t.at(-1).m}, from ${t[0].v} at month 0.`);
    return `<li class="ia-${kindOf(p)}"><h4><span class="ia-swatch" aria-hidden="true"></span>${esc(progName(p))}, cohort ${esc(p.cohort)}</h4><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></li>`;
  };

  // ------------------------------------------------------------------ sessions calendar
  const calStart = D(progs.map(p => p.start).sort()[0] || NOW), calEnd = D(progs.map(p => p.end).sort().at(-1) || NOW);
  const calMonths = []; for (let d = new Date(calStart); d <= calEnd; d.setUTCMonth(d.getUTCMonth() + 1)) calMonths.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  const nowKey = NOW.slice(0, 7);
  const mkey = cm => `${cm.y}-${String(cm.m + 1).padStart(2, '0')}`;
  const withSessions = calMonths.filter(cm => sessions.some(s => s.date.startsWith(mkey(cm))));
  const defaultMonth = withSessions.length ? mkey(withSessions.at(-1)) : mkey(calMonths[0]);
  const mentorName = id => { const m = byId(mentors, id); return m ? plain(m.name) : 'a guest mentor (not public)'; };
  const coName = id => { const c = byId(companies, id); return c ? plain(c.name) : 'A company not yet public'; };
  const calendar = calMonths.map(cm => {
    const key = mkey(cm);
    const lanes = progs.map(p => {
      const inRange = key >= p.start.slice(0, 7) && key <= p.end.slice(0, 7);
      const ss = sessions.filter(s => s.programme_id === p.id && s.date.startsWith(key));
      const o = ss.filter(s => s.kind === 'one_to_one');
      const g = ss.filter(s => s.kind !== 'one_to_one');
      if (!inRange) return `<div class="ia-lane ia-${kindOf(p)} is-out"><span class="vh">${esc(progName(p))}: not running</span></div>`;
      return `<div class="ia-lane ia-${kindOf(p)}"><span class="ia-lane-name">${esc(progName(p))}</span>${o.length ? `<span class="ia-dots" aria-label="${o.length} one-to-one sessions">${o.map(s => `<i title="${esc(`${shortDate(s.date)}: ${coName(s.company_id)} with ${mentorName(s.mentor_id)}, ${s.topic}`)}"></i>`).join('')}</span><span class="ia-lane-n">${o.length} one-to-one${o.length === 1 ? '' : 's'}</span>` : `<span class="ia-lane-n ia-muted">${key > nowKey ? 'Ahead' : key === nowKey ? 'None in Odoo yet' : 'No one-to-ones'}</span>`}${g.map(s => `<span class="ia-guest ia-guest-${s.kind}">${esc(KIND_LABEL[s.kind])}: ${esc(s.topic.replace(/\s*(clinic|workshop)$/i, ''))}</span>`).join('')}</div>`;
    }).join('');
    const isNow = key === nowKey;
    return `<li class="ia-cal-m${isNow ? ' is-now' : ''}"><button type="button" class="ia-cal-btn" data-month="${key}" aria-pressed="${key === defaultMonth}"><span class="ia-cal-name">${MONTHS[cm.m]} <small>${cm.y}</small></span>${isNow ? '<span class="ia-cal-now">Now</span>' : ''}</button>${lanes}</li>`;
  }).join('');
  const monthPanels = calMonths.map(cm => {
    const key = mkey(cm); const ss = sessions.filter(s => s.date.startsWith(key));
    const body = ss.length ? `<ol class="ia-ses-list">${ss.map(s => { const p = byId(progs, s.programme_id); return `<li class="ia-${p ? kindOf(p) : 'inc'}"><time datetime="${esc(s.date)}">${esc(shortDate(s.date))}</time><span class="ia-kind ia-kind-${esc(s.kind)}">${esc(KIND_LABEL[s.kind])}</span><span class="ia-ses-topic">${esc(s.topic)} ${sim(s)}</span><span class="ia-ses-who">${s.company_id ? `${esc(coName(s.company_id))} with ` : `${esc(p ? progName(p) : '')} cohort, run by `}${esc(mentorName(s.mentor_id))}</span></li>`; }).join('')}</ol>`
      : `<p class="ia-muted">No sessions in Odoo for ${MONTHS_LONG[cm.m]} ${cm.y}.${key >= nowKey ? ' The acceleration programme runs to the end of December; sessions appear here when they are recorded in Odoo.' : ''}</p>`;
    return `<div class="ia-month-panel" data-month-panel="${key}"><h3>${MONTHS_LONG[cm.m]} ${cm.y}: ${ss.length} session${ss.length === 1 ? '' : 's'}</h3>${body}</div>`;
  }).join('');

  // ------------------------------------------------------------------ companies and mentors
  const companyCard = c => {
    const ks = kOf(c.id); const m = mentorOf(c.id); const p = byId(progs, c.programme_id);
    const a = ks[0], b = ks.at(-1);
    return `<li class="card ia-co ia-${p ? kindOf(p) : 'inc'}" id="${esc(c.id)}" data-company="${esc(c.id)}">
      <h4>${esc(c.name)} ${sim(c)}</h4><p class="ia-co-sum">${esc(c.summary)}</p>
      <p class="ia-tags"><span class="tag">${esc(c.sector)}</span><span class="tag">${esc(c.town)}</span><span class="tag">Entered at ${esc(CSTAGE_LABEL[c.stage] || c.stage)}</span></p>
      <p class="ia-co-mentor"><span>One-to-one mentor</span> ${m ? `<a href="#${esc(m.id)}">${esc(m.name)}</a>` : '<span class="ia-muted">Not public</span>'}</p>
      ${a ? `<p class="ia-co-kpi"><span>Revenue a month</span> ${esc(money(a.revenue_eur))} → <strong>${esc(money(b.revenue_eur))}</strong> <small>M0 to M${b.month}</small></p>` : ''}
      ${c.website ? `<p><a href="${esc(c.website)}" rel="noopener">Website</a></p>` : ''}</li>`;
  };
  const mentorCard = m => {
    const ss = sessions.filter(s => s.mentor_id === m.id);
    const cos = (m.company_ids || []).map(id => byId(companies, id)).filter(Boolean);
    const guest = ss.filter(s => s.kind !== 'one_to_one');
    return `<li class="card ia-mentor" id="${esc(m.id)}" data-mentor="${esc(m.id)}">
      <div class="ia-mono" aria-hidden="true">${esc(plain(m.name).replace(/^Mentor\s*/, 'M'))}</div>
      <div><h4>${esc(m.name)} ${sim(m)}</h4><p class="ia-mentor-meta">${esc(m.kind === 'guest' ? 'Guest mentor' : 'One-to-one mentor')} · ${esc(m.town)}</p>
      <p class="ia-tags">${(m.expertise || []).map(e => `<span class="tag">${esc(e)}</span>`).join('')}</p>
      ${cos.length ? `<p class="ia-mentor-cos">${cos.map(c => { const p = byId(progs, c.programme_id); return `<a class="ia-pill ia-${p ? kindOf(p) : 'inc'}" href="#${esc(c.id)}">${esc(plain(c.name))}</a>`; }).join('')}</p>` : ''}
      ${guest.length ? `<ul class="ia-mentor-ses">${guest.map(s => `<li>${esc(s.topic)}, ${esc(shortDate(s.date))}</li>`).join('')}</ul>` : ''}
      <p class="ia-mentor-n">${ss.length} session${ss.length === 1 ? '' : 's'} in Odoo</p></div></li>`;
  };
  const unnamedGuest = sessions.filter(s => s.kind !== 'one_to_one' && !s.mentor_id);

  // Data for the persona workspaces (src/hub/inc-acc.js), all from the public feed.
  const slim = {
    now: NOW, db: feed.meta?.odoo?.db || '', odooVersion: feed.meta?.odoo?.version || '',
    programmes: progs.map(p => ({ id: p.id, odoo: p.odoo, kind: p.kind, name: p.name, cohort: p.cohort, start: p.start, end: p.end, months: p.months, status: p.status, simulated: p.simulated })),
    companies: companies.map(c => ({ id: c.id, odoo: c.odoo, name: c.name, sector: c.sector, town: c.town, stage: c.stage, programme_id: c.programme_id, simulated: c.simulated, published: c.published })),
    mentors: mentors.map(m => ({ id: m.id, odoo: m.odoo, name: m.name, kind: m.kind, expertise: m.expertise, town: m.town, company_ids: m.company_ids, simulated: m.simulated })),
    sessions: sessions.map(s => ({ id: s.id, odoo: s.odoo, programme_id: s.programme_id, company_id: s.company_id, mentor_id: s.mentor_id, kind: s.kind, date: s.date, topic: s.topic, simulated: s.simulated })),
    kpis: kpis.map(k => ({ id: k.id, odoo: k.odoo, company_id: k.company_id, month: k.month, revenue_eur: k.revenue_eur, customers: k.customers, team_size: k.team_size, funding_eur: k.funding_eur, product_stage: k.product_stage, simulated: k.simulated })),
  };

  const progCards = progs.map(p => {
    const n = progNow(p); const ss = sessions.filter(s => s.programme_id === p.id);
    const ms = (p.mentor_ids || []).map(id => byId(mentors, id)).filter(Boolean);
    return `<article class="ia-prog ia-${kindOf(p)}" id="prog-${kindOf(p)}">
      <header><p class="ia-prog-kind"><span class="ia-swatch" aria-hidden="true"></span>${esc(progName(p))} · cohort ${esc(p.cohort)}</p>${statusPill(p)}</header>
      <h3>${esc(p.name)} ${sim(p)}</h3>
      <p class="ia-prog-dates">${esc(h.date(p.start))} to ${esc(h.date(p.end))} · <strong>${esc(n.label)}</strong></p>
      ${timeline(p)}
      <p class="ia-prog-sum">${esc(p.summary)}</p>
      <dl class="ia-prog-facts">
        <div><dt>Companies</dt><dd>${coOf(p).length}</dd></div>
        <div><dt>One-to-one mentors</dt><dd>${ms.filter(m => m.kind === 'one_to_one' && m.company_ids.some(id => coOf(p).some(c => c.id === id))).length}</dd></div>
        <div><dt>One-to-ones</dt><dd>${ss.filter(s => s.kind === 'one_to_one').length}</dd></div>
        <div><dt>Clinics and workshops</dt><dd>${ss.filter(s => s.kind !== 'one_to_one').length}</dd></div>
        <div><dt>KPIs recorded to month</dt><dd>${lastMonthOf(p)}</dd></div>
      </dl>
      <p class="ia-prog-links"><a href="#results-${kindOf(p)}">Results</a> · <a href="#companies-${kindOf(p)}">Companies</a></p>
    </article>`;
  }).join('');

  const quote = 'Incubation and acceleration programmes where we can manage the whole programme and have the information on the mentors: one-to-one mentoring, one mentor for one company, and guest mentors who run clinics and workshops. Our intention is to measure KPIs: where the company started, at month 0, and how far it has come by the end, at month 6; to make those results public and to reflect on those indicators.';

  const body = `
<section class="ia-hero">
  <div class="hub-wrap ia-hero-grid">
    <div class="ia-hero-copy">
      <p class="kicker kicker-light">AE Innovation Hub · activity 1 of 4</p>
      <h1>Incubation and acceleration</h1>
      <p class="lede">Two six-month programmes for Algarve startups. One mentor for each company, guest mentors for clinics and workshops, and every company's KPIs from month 0 to month 6, published here and read together.</p>
      <figure class="ia-quote"><blockquote><p>${esc(quote)}</p></blockquote><figcaption>António Guerreiro, executive director, Algarve Evolution, 16 November 2026 (our translation from Portuguese)</figcaption></figure>
    </div>
    <div class="ia-hero-side"><dl class="ia-hero-stats" aria-label="INC/ACC in Odoo today">
      <div><dt>Programmes</dt><dd>${progs.length}</dd><dd class="ia-hs-note">${progs.map(p => `${esc(progName(p))}: ${esc(p.status)}`).join(' · ')}</dd></div>
      <div><dt>Companies</dt><dd>${totals.companies}</dd><dd class="ia-hs-note">${progs.map(p => `${coOf(p).length} in ${esc(progName(p).toLowerCase())}`).join(' · ')}</dd></div>
      <div><dt>Mentors</dt><dd>${totals.mentors}</dd><dd class="ia-hs-note">${mentors.filter(m => m.kind === 'one_to_one').length} one-to-one · ${mentors.filter(m => m.kind === 'guest').length} guest</dd></div>
      <div><dt>Sessions</dt><dd>${totals.sessions}</dd><dd class="ia-hs-note">${oneToOne} one-to-ones · ${clinics} clinics · ${workshops} workshops</dd></div>
    </dl>
<p class="ia-hero-chips"><span>Read from Odoo:</span> ${odoo('aih.programme', progs.length)} ${odoo('aih.programme.company', totals.companies)} ${odoo('res.partner', totals.mentors)} ${odoo('aih.session', totals.sessions)}</p></div>
  </div>
</section>
<nav class="ia-jump" aria-label="On this page"><div class="hub-wrap"><ul>
  <li><a href="#you">Your view</a></li><li><a href="#programmes">Programmes</a></li><li><a href="#results">Public results</a></li><li><a href="#reflection">Reflection</a></li><li><a href="#companies">Companies</a></li><li><a href="#mentors">Mentors</a></li><li><a href="#sessions">Sessions</a></li>
</ul></div></nav>

<section class="hub-sec hub-sec-tight hub-sec-mist ia-you" id="you" aria-labelledby="you-h">
  <div class="hub-wrap">
    <div class="ia-you-head"><p class="kicker">Your view</p><h2 class="hub-h2" id="you-h">Try INC/ACC as the people who use it</h2></div>
    <div class="persona-panel" data-only="visitor">
      <p class="persona-panel-head">For visitors</p>
      <p>You are seeing what anyone can see: the programmes, the companies and mentors who agreed to be public, and the results. The workspaces below change with the persona.</p>
      <p class="ia-go"><button type="button" class="btn btn-primary" data-persona-go="founder">Try it as a founder</button><button type="button" class="btn" data-persona-go="mentor">as a mentor</button><button type="button" class="btn" data-persona-go="staff">as the Algarve Evolution team</button><a href="#results">or read the public results</a></p>
    </div>
    <div class="persona-panel" data-only="challenger supplier participant">
      <p class="persona-panel-head">For this persona</p>
      <p>This persona matters most on <a href="/challenge-connect/">Challenge Connect</a> and <a href="/vibathon/">Vibathon</a>. INC/ACC is for founders, mentors and the Algarve Evolution team; the results below are public for everyone.</p>
      <p class="ia-go"><button type="button" class="btn btn-primary" data-persona-go="founder">Try it as a founder</button><button type="button" class="btn" data-persona-go="mentor">as a mentor</button></p>
    </div>
    <div class="persona-panel ia-ws" data-only="founder" id="ws-founder" aria-live="polite"><noscript><p>The founder workspace needs JavaScript.</p></noscript></div>
    <div class="persona-panel ia-ws" data-only="mentor" id="ws-mentor" aria-live="polite"><noscript><p>The mentor workspace needs JavaScript.</p></noscript></div>
    <div class="persona-panel persona-panel-private ia-ws" data-only="staff" id="ws-staff" aria-live="polite"><noscript><p>The team view needs JavaScript.</p></noscript></div>
  </div>
</section>

<section class="hub-sec ia-progs" id="programmes" aria-labelledby="prog-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">The programmes</p><h2 class="hub-h2" id="prog-h">Two cohorts, six months each</h2>
      <p class="hub-lede">Incubation is for idea and pre-seed teams; acceleration for companies with first revenue. Each runs from month 0, when a company joins and records its starting KPIs, to month 6. The marker shows where each programme is on ${esc(h.date(NOW))}, the date of the Odoo export.</p>
      <p class="ia-chips">${odoo('aih.programme', progs.length)}</p></div>
    <div class="ia-prog-row">${progCards}</div>
  </div>
</section>

<section class="hub-sec hub-sec-mist ia-results" id="results" aria-labelledby="res-h">
  <div class="hub-wrap">
    <div class="hub-head" data-for="visitor"><p class="kicker">Public results</p><h2 class="hub-h2" id="res-h">What changed between month 0 and month 6</h2>
      <p class="hub-lede">Every company records five indicators each month: revenue, customers, team, funding and product stage. Algarve Evolution publishes them, company by company and for the cohort, so anyone can see what the programmes achieve and question it.</p>
      <p class="ia-simnote"><span class="sim-badge">Simulated</span> Every KPI on this page is invented for the prototype and stored in our local Odoo. With Algarve Evolution's Odoo the same charts would show real results. ${odoo('aih.kpi', kpis.length)}</p>
    </div>
    <div class="ia-hero-fig">
      <p class="ia-hf-label">People working in the ${totals.companies} companies</p>
      <p class="ia-hf-val">${teamL}</p>
      <p class="ia-hf-from">from ${team0} when they joined: <strong>+${teamL - team0} jobs</strong> in the Algarve, at each company's latest month ${sim({ simulated: true })}</p>
    </div>
    <div class="ia-controls" role="group" aria-label="Choose what the charts show">
      <div class="ia-seg" role="group" aria-label="Indicator">${KPIS.map((d, i) => `<button type="button" data-set-kpi="${d.k}" aria-pressed="${i === 0}">${esc(d.short)}</button>`).join('')}</div>
      <div class="ia-seg" role="group" aria-label="Programme">${progs.map((p, i) => `<button type="button" data-set-prog="${kindOf(p)}" aria-pressed="${i === 0}"><span class="ia-swatch ia-${kindOf(p)}" aria-hidden="true"></span>${esc(progName(p))}</button>`).join('')}</div>
    </div>
    <div class="ia-cohort">
      <div class="ia-cohort-chart">${KPIS.map(cohortChart).join('')}
        <p class="ia-legend">${progs.map(p => `<span class="ia-${kindOf(p)}"><i class="ia-key-line" aria-hidden="true"></i>${esc(progName(p))} (${coOf(p).length} companies, to month ${lastMonthOf(p)})</span>`).join('')}</p></div>
      <div class="ia-cohort-text"><h3>Read it as growth</h3><p>The two cohorts start from very different places, so the chart indexes each cohort's total to 100 at month 0. A line at 200 means the cohort doubled that indicator. Hover or tab through a month to read the values in euros or people.</p><p>Incubation finished in September with all six months; acceleration is in month ${Math.floor(progNow(progs.find(p => p.kind === 'acceleration') || progs[0]).frac) + 1} and has recorded month ${lastMonthOf(progs.find(p => p.kind === 'acceleration') || progs[0])}.</p></div>
    </div>
    ${progs.map(resultsFor).join('')}
    <p class="ia-download">The numbers behind every chart: <a href="/feeds/public.json">the public feed</a> (JSON, exported from Odoo on ${esc(h.date(NOW))}).</p>
  </div>
</section>

<section class="hub-sec ia-reflect" id="reflection" aria-labelledby="ref-h">
  <div class="hub-wrap">
    <div class="hub-head"><p class="kicker">Reflection</p><h2 class="hub-h2" id="ref-h">What the indicators say, and what they miss</h2>
      <p class="hub-lede">António asked for the results to come with a reflection. Algarve Evolution writes one in Odoo for each programme; this page adds a reading computed from the same KPIs. Both are simulated here.</p></div>
    <div class="ia-ref-row">
      <div class="ia-ref-odoo"><h3>Written in Odoo ${odoo('aih.reflection', reflections.length)}</h3>
        ${reflections.map(r => { const p = byId(progs, r.programme_id); return `<blockquote class="ia-ref ia-${p ? kindOf(p) : 'inc'}"><p class="ia-ref-meta"><span class="ia-swatch" aria-hidden="true"></span>${esc(p ? progName(p) : '')} · at month ${r.month} ${sim(r)}</p><p>${esc(r.text)}</p></blockquote>`; }).join('')}
      </div>
      <div class="ia-ref-read"><h3>Read from the KPIs by this page</h3><p class="ia-note">Computed when the page is built, from the simulated KPIs and sessions. A session in the same month as a rise is a lead to look into, not a cause.</p><ul class="ia-reading">${progs.map(reading).join('')}</ul>
        <div class="ia-questions"><h4>Questions to take to the next cohort</h4><ul><li>Should idea-stage teams also report interviews, pilots and letters of intent, so month 0 to 6 shows their progress?</li><li>Is funding raised a goal of incubation, or a distraction from first customers?</li><li>Which mix of one-to-ones, clinics and workshops came before the largest moves, cohort after cohort?</li><li>Which results should stay private until the company agrees to publish them?</li></ul></div>
      </div>
    </div>
  </div>
</section>

<section class="hub-sec ia-cos" id="companies" aria-labelledby="co-h">
  <div class="hub-wrap">
    <div class="hub-head" data-for="founder"><p class="kicker">The companies</p><h2 class="hub-h2" id="co-h">${totals.companies} companies, each with one mentor</h2>
      <p class="hub-lede">Sector, town, the stage they joined at and their one-to-one mentor, as published in Odoo. Companies that have not agreed to be public are not in the public feed.</p>
      <p class="ia-chips">${odoo('aih.programme.company', totals.companies)}</p></div>
    ${progs.map(p => `<div class="ia-co-group ia-${kindOf(p)}" id="companies-${kindOf(p)}"><h3><span class="ia-swatch" aria-hidden="true"></span>${esc(progName(p))}, cohort ${esc(p.cohort)} <small>${coOf(p).length} companies</small></h3><ul class="cards ia-co-list">${coOf(p).map(companyCard).join('')}</ul></div>`).join('')}
  </div>
</section>

<section class="hub-sec hub-sec-mist ia-mentors" id="mentors" aria-labelledby="men-h">
  <div class="hub-wrap">
    <div class="hub-head" data-for="mentor"><p class="kicker">The mentors</p><h2 class="hub-h2" id="men-h">One-to-one mentors and guest mentors</h2>
      <p class="hub-lede">Today each company has one mentor for monthly one-to-ones. Guest mentors run clinics and workshops for a whole cohort. Mentors appear here only once they have agreed to be public.</p>
      <p class="ia-chips">${odoo('res.partner', totals.mentors)}</p></div>
    <div class="ia-men-group"><h3>One-to-one mentors <small>${mentors.filter(m => m.kind === 'one_to_one').length}</small></h3><ul class="cards ia-men-list">${mentors.filter(m => m.kind === 'one_to_one').map(mentorCard).join('')}</ul></div>
    <div class="ia-men-group"><h3>Guest mentors <small>${mentors.filter(m => m.kind === 'guest').length}</small></h3><ul class="cards ia-men-list">${mentors.filter(m => m.kind === 'guest').map(mentorCard).join('')}</ul>
      ${unnamedGuest.length ? `<p class="ia-note">${unnamedGuest.length} ${unnamedGuest.length === 1 ? 'session was' : 'sessions were'} run by a guest mentor who has not agreed to be public: ${unnamedGuest.map(s => `${esc(s.topic)} (${esc(shortDate(s.date))})`).join('; ')}. Odoo keeps the name; the public feed does not.</p>` : ''}</div>
  </div>
</section>

<section class="hub-sec ia-sessions" id="sessions" aria-labelledby="ses-h">
  <div class="hub-wrap">
    <div class="hub-head" data-for="mentor staff"><p class="kicker">The sessions</p><h2 class="hub-h2" id="ses-h">${totals.sessions} sessions, month by month</h2>
      <p class="hub-lede">Each dot is a one-to-one; clinics and workshops are named. Choose a month to see who met whom and on what topic. Private notes stay in Odoo; the Algarve Evolution team sees them in its view.</p>
      <p class="ia-chips">${odoo('aih.session', totals.sessions)}</p></div>
    <ol class="ia-cal" style="--ia-cal-n:${calMonths.length}">${calendar}</ol>
    <p class="ia-legend ia-cal-legend"><span class="ia-inc"><i class="ia-key-dot" aria-hidden="true"></i>Incubation one-to-one</span><span class="ia-acc"><i class="ia-key-dot" aria-hidden="true"></i>Acceleration one-to-one</span><span><i class="ia-guest-key ia-guest-clinic" aria-hidden="true"></i>Clinic</span><span><i class="ia-guest-key ia-guest-workshop" aria-hidden="true"></i>Workshop</span></p>
    <div class="ia-months" data-default-month="${defaultMonth}">${monthPanels}</div>
  </div>
</section>
<div class="ia-tip" role="tooltip" hidden></div>
<script type="application/json" id="incacc-data">${JSON.stringify(slim).replace(/</g, '\\u003c')}</script>`;

  return layout({
    body,
    description: 'INC/ACC at the AE Innovation Hub: the incubation and acceleration programmes, their companies and mentors, the sessions, and the KPIs from month 0 to month 6, published from Odoo. Simulated data for the prototype.',
    head: '<link rel="stylesheet" href="/hub/inc-acc.css">',
    scripts: '<script src="/hub/inc-acc.js" defer></script>',
    pageClass: 'page-inc-acc',
  });
}
