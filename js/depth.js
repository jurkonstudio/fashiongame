// (c) 2026 FashionGame. Kedalaman game v6: peristiwa pasar, kontrak, pemasaran, target level, peringkat.
import { ic } from './icons.js?v=21';
import { T, fmt } from './i18n.js?v=21';
import { D, TAX, BTN, XP, xpNeed, xpCum, levelFor } from './data.js?v=21';
import { G, now, dur, mm, MOD, qm, day, toasts, matPrice, demand } from './state.js?v=21';

const EV = { strike:{ h:6, mat:{ leather:1.3, rubber:1.3 } }, sale:{ h:6, mat:{ fabric:.75, thread:.8 } }, viral:{ h:4, dem:1.4 }, slump:{ h:6, dem:.75 }, tariff:{ h:8, mat:{ leather:1.2, rubber:1.2, fabric:1.15 } } };
const CAMP = { social:{ cost:60, x:1.15, h:4, rep:0 }, influ:{ cost:250, x:1.35, h:6, rep:3 }, board:{ cost:600, x:1.25, h:24, rep:8 } };
const GOALS = { 1:{ made:10, sold:10, res:'basic' }, 2:{ sold:100, rep:30, store:2 }, 3:{ sold:400, rev:15000, rep:60, office:3 } };
const RIV = [['Benang Emas', 9000, .02], ['Kain Nusantara', 4000, .03], ['Sepatu Jaya', 1500, .05], ['Mode Kita', 700, .04], ['Batik Modern', 300, .06]];
export const fresh = () => ({ ev:null, evAt:0, camp:null, ct:[], ctAt:0 });
const hr = n => dur(3600 * n), pick = a => a[Math.random() * a.length | 0];
MOD.dem = () => { const d = G.S.dp; return (d.camp ? CAMP[d.camp.id].x : 1) * (d.ev && EV[d.ev.id].dem || 1); };
MOD.mat = m => { const e = G.S.dp.ev; return e && EV[e.id].mat && EV[e.id].mat[m] || 1; };

const newContract = () => { const S = G.S, t = now(), id = pick(Object.keys(D.products).filter(k => D.products[k].lvl <= S.level)), p = D.products[id],
    q = 1 + (Math.random() * (S.level > 3 ? 5 : S.level > 2 ? 4 : 3) | 0), n = p.batch * (1 + (Math.random() * 3 | 0));
  S.dp.ct.push({ p: id, n, q, pr: +(p.base * qm(q) * (1.1 + Math.random() * .3)).toFixed(2), end: t + hr(4 + Math.random() * 8) }); };

export function tick() { const S = G.S, d = S.dp, t = now(), today = new Date(t).toISOString().slice(0, 10);
  if (d.login !== today) { d.login = today; S.btn += BTN.login; toasts.push({ txt: `+${BTN.login} ◉ ${T('btn')} · login`, t }); }
  if (d.ev && d.ev.end <= t) d.ev = null;
  if (d.camp && d.camp.end <= t) d.camp = null;
  if (!d.evAt) d.evAt = t + hr(2);
  if (!d.ev && t >= d.evAt) { const id = pick(Object.keys(EV)); d.ev = { id, end: t + hr(EV[id].h) }; d.evAt = d.ev.end + hr(3 + Math.random() * 5); toasts.push({ txt: T('ev_' + id), t }); }
  d.ct = d.ct.filter(c => c.end > t);
  if (d.hd !== day()) { d.hd = day(); const h = d.hist = d.hist || {}; for (const m in D.materials) { const a = h[m] = h[m] || Array.from({ length: 7 }, () => matPrice(m, 'std') * (.95 + Math.random() * .1)); a.push(matPrice(m, 'std')); if (a.length > 7) a.shift(); } }
  if (!d.ctAt) d.ctAt = t;
  if (S.sold >= 1 && d.ct.length < 3 && t >= d.ctAt) { newContract(); d.ctAt = t + hr(.5 + Math.random() * .5); }
  const lv = levelFor(S.xp || 0); while (S.level < lv) { S.level++; toasts.push({ txt: '★ Level ' + S.level, t }); } }

const chk = g => { const S = G.S;
  return [['made', S.made], ['sold', S.sold], ['rev', S.led.rev], ['rep', S.rep], ['store', S.b.store, 'storelv'], ['office', S.b.office, 'officelv']]
    .filter(x => g[x[0]]).map(x => ['gl_' + (x[2] || x[0]), Math.min(x[1], g[x[0]]), g[x[0]]]).concat(g.res ? [['gl_res', +S.research.includes(g.res), 1]] : []); };
export const prog = () => { const S = G.S, need = xpNeed(S.level), cur = Math.max(0, (S.xp || 0) - xpCum(S.level)); return { p: Math.min(1, cur / need), cur, need }; };   // progres XP ke level berikutnya
const bar = n => `<div class="bar"><i style="width:${Math.min(100, Math.round(n))}%"></i></div>`;
export const lvlBar = () => { const p = prog(); return `<div class="lvl"><span>Lv${G.S.level + 1}</span>${bar(p.p * 100)}<b>${Math.floor(p.cur)}/${p.need} XP</b></div>`; };
export const banner = () => { const d = G.S.dp, t = now(), c = [];
  if (d.ev) c.push(`<span class="tag ${EV[d.ev.id].dem < 1 || EV[d.ev.id].mat && !EV[d.ev.id].mat.fabric || d.ev.id === 'strike' || d.ev.id === 'tariff' ? 'bad' : 'ok'}">${ic('chart')}${T('ev_' + d.ev.id)} · ${mm(d.ev.end - t)}</span>`);
  if (d.camp) c.push(`<span class="tag ok">${ic('star')}${T('camp_' + d.camp.id)} · ${mm(d.camp.end - t)}</span>`);
  return c.length ? `<div class="evbar">${c.join('')}</div>` : ''; };
export const goalPanel = () => { const S = G.S, p = prog(), act = [['make', 'factory'], ['sell', 'store'], ['grow', 'farm']].filter(([k]) => S.jobs.some(j => j.k === k)).length;
  return `<div class="card"><h2>${ic('star')}${T('goal')} ${S.level + 1}</h2><div class="row"><span>${T('xp_tot')}</span><b>${Math.floor(S.xp || 0)} XP</b></div><div class="row"><span>${T('xptonext')} ${S.level + 1}</span><b>${Math.floor(p.cur)}/${p.need}</b></div>${bar(p.p * 100)}<div class="row mute"><span>${T('xph')}</span><b>${(act * XP.active)} XP${T('perh')}</b></div><div class="mute">${T('reward')}</div></div>`
    + `<div class="card"><h2>${ic('chart')}${T('xpsrc')}</h2><div class="row"><span>${T('xp_s1')}</span><b>${XP.active} XP${T('perh')}</b></div><div class="row"><span>${T('xp_s2')}</span><b>${XP.build} XP${T('perh')}</b></div><div class="row"><span>${T('xp_s3')}</span><b>${XP.up} XP${T('perh')}</b></div><div class="mute">${T('xp_idle')}</div></div>`
    + `<div class="card"><h2>${ic('target')}${T('xpnext')}</h2>${Array.from({ length: 6 }, (_, i) => S.level + i).map(l => `<div class="row ${l === S.level ? '' : 'mute'}"><span>Lv${l} → Lv${l + 1}</span><b>${xpNeed(l)} XP</b></div>`).join('')}</div>`; };
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
    const rev = c.n * c.pr; S.stock[c.p] -= c.n; S.money += rev * (1 - TAX); S.led.rev += rev; S.led.tax += rev * TAX; S.sold += c.n; S.rep = Math.min(100, S.rep + c.n * .2); S.dp.ct.splice(+i, 1); S.dp.cdone = (S.dp.cdone || 0) + 1; },
  camp: id => { const S = G.S, c = CAMP[id]; if (!c || S.dp.camp || S.money < c.cost) return; S.money -= c.cost; S.led.mkt = (S.led.mkt || 0) + c.cost; S.rep = Math.min(100, S.rep + c.rep); S.dp.camp = { id, end: now() + dur(c.h * 3600) }; }
};

export const hist = id => D.materials[id] ? (G.S.dp.hist || {})[id] || [] : Array.from({ length: 7 }, (_, i) => D.products[id].base * (1 + .12 * Math.sin((day() - 6 + i) / 20 + id.length)) * qm(G.S.sq[id] || 2));
export const salesPanel = () => { const S = G.S, L = S.dp.log || [], tot = L.reduce((a, x) => [a[0] + x.n, a[1] + x.s, a[2] + x.net], [0, 0, 0]);
  return `<div class="card"><h2>${ic('chart')}${T('saleslog')}</h2><div class="row"><span>${T('sellthru')}</span><b>${tot[0] ? Math.round(tot[1] / tot[0] * 100) : 0}%</b></div><div class="row"><span>${T('netrev')}</span><b>${fmt(tot[2])}</b></div></div>`
    + `<div class="card">${Object.entries(D.products).filter(([, p]) => p.lvl <= S.level).map(([k, p]) => { const pr = S.price[k] || p.base; return `<div class="row"><span>${ic(p.icon)}${T(k)} · ${fmt(pr)}</span><span class="mute">${T('demand')} ${Math.round(demand(k, pr, S.sq[k] || 2, 'store') * 100)}% · ${T('stock')} ${S.stock[k] || 0}</span></div>`; }).join('')}</div>`
    + (L.length ? `<div class="card">${L.slice(0, 8).map(x => `<div class="row"><span>${ic(D.products[x.id].icon)}${x.s}/${x.n} × ${T(x.id)} @ ${fmt(x.pr)} <small class="mute">${T('ch_' + x.ch)}</small></span><b class="pos">+${fmt(x.net)}</b></div>`).join('')}</div>` : `<div class="card mute">${T('nosales')}</div>`); };
