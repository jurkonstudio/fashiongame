// (c) 2026 FashionGame. Kedalaman game v6: peristiwa pasar, kontrak, pemasaran, target level, peringkat.
import { ic } from './icons.js?v=7';
import { T, fmt } from './i18n.js?v=7';
import { D, TAX } from './data.js?v=7';
import { G, now, dur, mm, MOD, qm, day, toasts } from './state.js?v=7';

const EV = { strike:{ h:6, mat:{ leather:1.3, rubber:1.3 } }, sale:{ h:6, mat:{ fabric:.75, thread:.8 } }, viral:{ h:4, dem:1.4 }, slump:{ h:6, dem:.75 }, tariff:{ h:8, mat:{ leather:1.2, rubber:1.2, fabric:1.15 } } };
const CAMP = { social:{ cost:60, x:1.15, h:4, rep:0 }, influ:{ cost:250, x:1.35, h:6, rep:3 }, board:{ cost:600, x:1.25, h:24, rep:8 } };
const GOALS = { 1:{ made:10, sold:10, res:'basic' }, 2:{ sold:100, rep:30, store:2 }, 3:{ sold:400, rev:15000, rep:60, office:3 } };
const RIV = [['Benang Emas', 9000, .02], ['Kain Nusantara', 4000, .03], ['Sepatu Jaya', 1500, .05], ['Mode Kita', 700, .04], ['Batik Modern', 300, .06]];
export const fresh = () => ({ ev:null, evAt:0, camp:null, ct:[], ctAt:0 });
const hr = n => dur(3600 * n), pick = a => a[Math.random() * a.length | 0];
MOD.dem = () => { const d = G.S.dp; return (d.camp ? CAMP[d.camp.id].x : 1) * (d.ev && EV[d.ev.id].dem || 1); };
MOD.mat = m => { const e = G.S.dp.ev; return e && EV[e.id].mat && EV[e.id].mat[m] || 1; };

const newContract = () => { const S = G.S, t = now(), id = pick(Object.keys(D.products).filter(k => D.products[k].lvl <= S.level)), p = D.products[id],
    q = 1 + (Math.random() * (S.level > 2 ? 3 : 2) | 0), n = p.batch * (1 + (Math.random() * 3 | 0));
  S.dp.ct.push({ p: id, n, q, pr: +(p.base * qm(q) * (1.1 + Math.random() * .3)).toFixed(2), end: t + hr(4 + Math.random() * 8) }); };

export function tick() { const S = G.S, d = S.dp, t = now();
  if (d.ev && d.ev.end <= t) d.ev = null;
  if (d.camp && d.camp.end <= t) d.camp = null;
  if (!d.evAt) d.evAt = t + hr(2);
  if (!d.ev && t >= d.evAt) { const id = pick(Object.keys(EV)); d.ev = { id, end: t + hr(EV[id].h) }; d.evAt = d.ev.end + hr(3 + Math.random() * 5); toasts.push({ txt: T('ev_' + id), t }); }
  d.ct = d.ct.filter(c => c.end > t);
  if (!d.ctAt) d.ctAt = t;
  if (S.sold >= 1 && d.ct.length < 3 && t >= d.ctAt) { newContract(); d.ctAt = t + hr(.5 + Math.random() * .5); }
  const p = prog(); if (p && p.p >= 1) { S.level++; toasts.push({ txt: '★ Level ' + S.level, t }); } }

const chk = g => { const S = G.S;
  return [['made', S.made], ['sold', S.sold], ['rev', S.led.rev], ['rep', S.rep], ['store', S.b.store, 'storelv'], ['office', S.b.office, 'officelv']]
    .filter(x => g[x[0]]).map(x => ['gl_' + (x[2] || x[0]), Math.min(x[1], g[x[0]]), g[x[0]]]).concat(g.res ? [['gl_res', +S.research.includes(g.res), 1]] : []); };
export const prog = () => { const g = GOALS[G.S.level]; if (!g) return null; const r = chk(g); return { r, p: r.reduce((a, [, c, t]) => a + c / t, 0) / r.length }; };
const bar = n => `<div class="bar"><i style="width:${Math.min(100, Math.round(n))}%"></i></div>`;
export const lvlBar = () => { const p = prog(); return p ? `<div class="lvl"><span>${T('goal')} Lv${G.S.level + 1}</span>${bar(p.p * 100)}<b>${Math.round(p.p * 100)}%</b></div>` : ''; };
export const banner = () => { const d = G.S.dp, t = now(), c = [];
  if (d.ev) c.push(`<span class="tag ${EV[d.ev.id].dem < 1 || EV[d.ev.id].mat && !EV[d.ev.id].mat.fabric || d.ev.id === 'strike' || d.ev.id === 'tariff' ? 'bad' : 'ok'}">${ic('chart')}${T('ev_' + d.ev.id)} · ${mm(d.ev.end - t)}</span>`);
  if (d.camp) c.push(`<span class="tag ok">${ic('star')}${T('camp_' + d.camp.id)} · ${mm(d.camp.end - t)}</span>`);
  return c.length ? `<div class="evbar">${c.join('')}</div>` : ''; };
export const goalPanel = () => { const p = prog();
  return p ? `<div class="card"><h2>${ic('target')}${T('goal')} ${G.S.level + 1}</h2>${p.r.map(([k, c, t]) => `<div class="row"><span>${T(k)}</span><span>${Math.floor(c)}/${t}</span></div>${bar(c / t * 100)}`).join('')}<div class="mute">${T('reward')}</div></div>`
    : `<div class="card"><h2>${ic('star')}Lv${G.S.level}</h2><div class="mute">${T('maxlv')}</div></div>`; };
export const mktPanel = () => { const S = G.S, d = S.dp;
  return Object.entries(CAMP).map(([id, c]) => `<div class="card"><div class="row"><span>${ic('chart')}${T('camp_' + id)}</span><b>+${Math.round((c.x - 1) * 100)}% ${T('campx')}</b></div>
    <div class="row mute"><span>${mm(dur(c.h * 3600))}${c.rep ? ' · +' + c.rep + ' ' + T('rep') : ''}</span><button class="b" data-a="camp:${id}" ${d.camp || S.money < c.cost ? 'disabled' : ''}>${d.camp && d.camp.id === id ? T('active') : fmt(c.cost)}</button></div></div>`).join(''); };
export const contracts = () => { const S = G.S, d = S.dp;
  return `<div class="card"><h2>${ic('cart')}${T('contracts')}</h2><div class="mute">${T('ct_hint')}</div></div>` + (d.ct.length ? d.ct.map((c, i) => { const ok = (S.stock[c.p] || 0) >= c.n && (S.sq[c.p] || 2) >= c.q;
    return `<div class="card"><div class="row"><span>${ic(D.products[c.p].icon)}${c.n}× ${T(c.p)} · Q≥${c.q}</span><b>${fmt(c.n * c.pr)}</b></div><div class="row mute"><span>${fmt(c.pr)}/${T('unit')} · ${mm(c.end - now())}</span><button class="b" data-a="deliver:${i}" ${ok ? '' : 'disabled'}>${T('deliver')}</button></div></div>`; }).join('') : `<div class="card mute">${T('ct_none')}</div>`); };
const value = () => { const S = G.S; return S.money - S.loan + Object.entries(S.stock).reduce((a, [k, n]) => a + n * D.products[k].base * .6, 0) + Object.entries(S.b).reduce((a, [k, lv]) => a + D.buildings[k].cost * lv * .5, 0); };
export const rankList = () => [...RIV.map(([n, b, g]) => [n, b * (1 + g * day()), 0]), [T('you'), value(), 1]].sort((a, b) => b[1] - a[1]);
export const rankPanel = () => { const L = rankList();
  return `<div class="card"><h2>${ic('star')}${T('rank')}</h2><div class="mute">${T('rank_hint')}</div></div>` + L.map((r, i) => `<div class="card ${r[2] === 1 ? '' : 'mute'}"><div class="row"><span><b>#${i + 1}</b> ${r[0]}</span><b>${fmt(r[1])}</b></div></div>`).join(''); };

export const actions = {
  deliver: i => { const S = G.S, c = S.dp.ct[+i]; if (!c || (S.stock[c.p] || 0) < c.n || (S.sq[c.p] || 2) < c.q) return;
    const rev = c.n * c.pr; S.stock[c.p] -= c.n; S.money += rev * (1 - TAX); S.led.rev += rev; S.led.tax += rev * TAX; S.sold += c.n; S.rep = Math.min(100, S.rep + c.n * .2); S.dp.ct.splice(+i, 1); },
  camp: id => { const S = G.S, c = CAMP[id]; if (!c || S.dp.camp || S.money < c.cost) return; S.money -= c.cost; S.led.mkt = (S.led.mkt || 0) + c.cost; S.rep = Math.min(100, S.rep + c.rep); S.dp.camp = { id, end: now() + dur(c.h * 3600) }; }
};
