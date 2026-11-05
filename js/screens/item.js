// (c) 2026 FashionGame. Detail barang: biaya, aksi, bursa NPC, grafik 7 hari. Dibuka dari Gudang/Perpustakaan.
import { D, SUP, WAGE, TAX, POWER_HOUR, RENT_HOUR } from '../data.js?v=26';
import { T, fmt } from '../i18n.js?v=26';
import { ic } from '../icons.js?v=26';
import { ART } from '../art.js?v=26';
import { G, matPrice, buyMat, unitCost, qm, demand, factoryMult, day } from '../state.js?v=26';
import { hist } from '../depth.js?v=26';
import * as store from './store.js?v=26';
import * as factory from './factory.js?v=26';

const ORDER = [...Object.keys(D.materials), ...Object.keys(D.products)], NPC = ['Benang Emas', 'Kain Nusantara', 'Sepatu Jaya', 'Mode Kita', 'Batik Modern'];
let id = 'leather', side = 'sell', from = 'warehouse';
export const origin = () => from;
const isM = k => !!D.materials[k];
const mp = k => isM(k) ? matPrice(k, 'std') : D.products[k].base * qm(G.S.sq[k] || 2) * .85;
const orders = s => { const h0 = day() * 7 + id.length * 5;
  return NPC.map((n, i) => { const h = (h0 + i * 13) % 97, sp = .012 * (i + 1) + .004 * (h % 3); return [n, 20 + h * (i + 3) * (isM(id) ? 10 : 1), +(mp(id) * (s === 'buy' ? 1 + sp : 1 - sp)).toFixed(3)]; }); };
const spark = a => { if (a.length < 2) return ''; const lo = Math.min(...a), r = Math.max(...a) - lo || 1;
  return `<svg viewBox="0 0 300 56" class="spark" aria-hidden="true"><polyline points="${a.map((v, i) => `${i * 300 / (a.length - 1)},${50 - (v - lo) / r * 44}`).join(' ')}" fill="none" stroke="#e8467c" stroke-width="2.4" stroke-linejoin="round"/></svg>`; };
const brk = k => { const p = D.products[k], S = G.S, hrs = p.time * factoryMult() / 3600 / p.batch;
  return [['cb_mat', unitCost(k)], ['cb_work', S.wk.reduce((a, x) => a + WAGE[x], 0) * hrs], ['cb_adm', (POWER_HOUR * S.b.factory + RENT_HOUR * Object.values(S.b).reduce((a, b) => a + b, 0)) * hrs]]; };
const ab = (a, i, l, dis) => `<button class="ab" data-a="${a}" ${dis ? 'disabled' : ''}>${ic(i)}<span>${l}</span></button>`;

export const view = () => { const S = G.S, m = isM(id), i = ORDER.indexOf(id), pv = ORDER[(i + ORDER.length - 1) % ORDER.length], nx = ORDER[(i + 1) % ORDER.length], p = D.products[id],
    have = m ? Math.floor(S.mat[id] || 0) : S.stock[id] || 0, q = m ? S.mq[id] : S.sq[id], src = m ? (S.mc[id] || matPrice(id, 'std')) : unitCost(id), h = hist(id), avg = h.length ? h.reduce((a, b) => a + b, 0) / h.length : mp(id);
  let o = `<div class="car"><button class="chip" data-a="tab:${from}">‹ ${T(from)}</button><button class="chip" data-a="inav:-1"><span class="mini">${ART[pv]}</span>‹</button><button class="chip" data-a="inav:1">›<span class="mini">${ART[nx]}</span></button></div>`
    + `<div class="card ih"><div><h2>${T(id)}</h2><div><b class="big">${have}</b> ${T('unit')}${q ? ` <span class="gold">${'★'.repeat(Math.round(q))}</span>` : ''}</div><div><b class="big">${fmt(src)}</b> <span class="mute">${T('sourcing')}</span></div></div>${ART[id]}</div>`;
  if (p && p.lvl > S.level) return o + `<div class="card mute">${ic('lock')} ${T('locked')} ${p.lvl}</div>`;
  if (m) o += `<div class="tabs">${Object.entries(SUP).map(([k, s]) => `<button class="chip ${k === G.sup ? 'on' : ''}" data-a="sup:${k}"><span>${T(k)}</span><span>Q${s.q} · ×${s.mult}</span></button>`).join('')}</div>`
    + `<div class="card">${[['market', matPrice(id, 'std')], ['avgbuy', S.mc[id] || 0], ['avg7', avg]].map(([k, v]) => `<div class="row"><span>${T(k)}</span><b>${fmt(v)}</b></div>`).join('')}</div>`
    + ab('ibuy:1', 'cart', `${T('buy')} ×1 · ${fmt(matPrice(id))}`, S.money < matPrice(id)) + ab('ibuy:10', 'cart', `${T('buy')} ×10 · ${fmt(matPrice(id) * 10)}`, S.money < matPrice(id) * 10) + ab('ibuy:50', 'cart', `${T('buy')} ×50 · ${fmt(matPrice(id) * 50)}`, S.money < matPrice(id) * 50);
  else { const b = brk(id), t = b.reduce((a, x) => a + x[1], 0) || 1, pr = S.price[id] || p.base, net = pr * (1 - TAX) - src;
    o += `<div class="card">${b.map(([k, v]) => `<div class="row"><span>${fmt(v)} <span class="mute">(${Math.round(v / t * 100)}%)</span></span><span>${T(k)}</span></div>`).join('')}</div>`
      + `<div class="card"><div class="row"><button class="chip" data-a="pp:-1">−</button><b>${fmt(pr)}</b><button class="chip" data-a="pp:1">+</button></div><div class="row mute"><span>${T('demand')} ${Math.round(demand(id, pr, S.sq[id] || 2, 'store') * 100)}%</span><span class="${net >= 0 ? 'pos' : 'neg'}">${T('margin')} ${net < 0 ? '−' : ''}${fmt(Math.abs(net))}</span></div></div>`
      + ab('isell', 'store', T('sellstore'), !store.canSell() || !have) + ab('imake', 'factory', T('makeb'), !factory.canMake(id)); }
  o += ab('go:ct', 'cart', T('sendct')) + `<div class="card"><div class="mute">${T('last7')}</div>${spark(h)}</div>`
    + `<div class="row"><b>${T('orders')}</b><span class="seg"><button class="chip ${side === 'sell' ? 'on' : ''}" data-a="exs:sell">${T('buyers')}</button><button class="chip ${side === 'buy' ? 'on' : ''}" data-a="exs:buy">${T('sellers')}</button></span></div>`
    + `<div class="card">${orders(side).map(([n, qty, pr], k) => `<div class="row ol" data-a="trade:${k}"><span class="mute">${qty}</span><span>${n}</span><b>${fmt(pr)}</b></div>`).join('')}<div class="mute">${T('ex_hint')}</div></div>`;
  return o; };

export const actions = {
  pick: (k, f) => { id = k; from = f || 'warehouse'; side = isM(k) && from === 'market' ? 'buy' : 'sell';
    const r = (G.S.rec = (G.S.rec || []).filter(x => x !== k)); r.unshift(k); r.length = Math.min(r.length, 5); },
  inav: d => { id = ORDER[(ORDER.indexOf(id) + +d + ORDER.length) % ORDER.length]; },
  exs: s => { side = s; },
  ibuy: n => { buyMat(id, +n); },
  pp: d => { const b = D.products[id]; if (b) { const c = G.S.price[id] || b.base; G.S.price[id] = Math.max(1, Math.round((c + +d * b.base * .05) * 100) / 100); } },
  isell: () => store.actions.sell(id),
  imake: () => factory.actions.make(id),
  trade: k => { const S = G.S, o = orders(side)[+k]; if (!o) return; const [, qty, pr] = o;
    if (side === 'buy') { if (!isM(id)) return; const n = Math.min(10, qty, Math.floor(S.money / pr)); if (n < 1) return;
      const c = pr * n, ol = S.mat[id] || 0, t = ol + n; S.money -= c; S.mc[id] = ((S.mc[id] || 0) * ol + c) / t; S.mq[id] = ((S.mq[id] || 0) * ol + 2 * n) / t; S.mat[id] = t; return; }
    const have = isM(id) ? Math.floor(S.mat[id] || 0) : S.stock[id] || 0, n = Math.min(10, qty, have); if (n < 1) return;
    const rev = pr * n, fee = rev * .02, tx = isM(id) ? 0 : rev * TAX; S.money += rev - fee - tx; S.led.fee = (S.led.fee || 0) + fee;
    if (isM(id)) S.mat[id] -= n; else { S.stock[id] -= n; S.led.rev += rev; S.led.tax += tx; S.sold += n; } }
};
