// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, TAX } from '../data.js?v=11';
import { T, fmt } from '../i18n.js?v=11';
import { ic } from '../icons.js?v=11';
import { G, unitCost, demand, compPrice, bulkPrice, CH } from '../state.js?v=11';

// Layar teks/logika: margin per produk dan per channel (tanpa tombol aksi).
export const view = () => { const S = G.S;
  return Object.entries(D.products).map(([id, p]) => {
    if (p.lvl > S.level) return `<div class="card mute">${ic('lock')}${ic(p.icon)} ${T(id)} · ${T('locked')} ${p.lvl}</div>`;
    const q = S.sq[id] || 2, c = unitCost(id), pr = S.price[id] || p.base, gross = { store: pr, online: pr, bulk: bulkPrice(id, q) },
      net = { store: pr * (1 - TAX), online: pr * (1 - TAX - CH.online.fee) - CH.online.ship, bulk: bulkPrice(id, q) * (1 - TAX) },
      best = Object.keys(net).reduce((a, k) => net[k] > net[a] ? k : a), r = (k, v) => `<div class="row"><span>${T(k)}</span><b>${v}</b></div>`;
    return `<div class="card"><h2>${ic(p.icon)}${T(id)}</h2>${r('ucost', fmt(c))}${r('sellp', fmt(pr))}${r('pcomp', fmt(compPrice(id)))}${r('bep', fmt(c / (1 - TAX)))}${r('demand', Math.round(demand(id, pr, q, 'store') * 100) + '%')}
    ${Object.keys(net).map(k => { const m = net[k] - c; return `<div class="row"><span>${ic(CH[k].icon)}${T('ch_' + k)}${k === best ? ' ★' : ''}</span><b class="${m >= 0 ? 'pos' : 'neg'}">${m < 0 ? '−' : ''}${fmt(Math.abs(m))} (${Math.round(m / gross[k] * 100)}%)</b></div>`; }).join('')}</div>`;
  }).join(''); };
export const actions = {};
