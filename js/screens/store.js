// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, SEASONS, TAX } from '../data.js?v=3';
import { T, fmt } from '../i18n.js?v=3';
import { ic } from '../icons.js?v=3';
import { G, now, dur, mm, unitCost, demand, saleCap, busy, count, CH, bulkPrice, month, compPrice } from '../state.js?v=3';

let ch = 'store';
const pr = id => ch === 'bulk' ? bulkPrice(id, G.S.sq[id] || 2) : (G.S.price[id] || D.products[id].base);

export const view = () => {
  const S = G.S, C = CH[ch], up = busy('up', 'store'), full = up || count('sell') >= S.b.store, ev = SEASONS.filter(s => s.m === month());
  return `<div class="tabs">${Object.entries(CH).map(([k, c]) => `<button class="chip ${k === ch ? 'on' : ''}" data-a="ch:${k}" ${c.ok() ? '' : 'disabled'}>${ic(c.icon)}<span>${T('ch_' + k)}</span></button>`).join('')}</div>
  <div class="card"><h2>${ic('store')}${T('store')} Lv${S.b.store}</h2>
    <div class="row"><span>${T('slots')}</span><b>${count('sell')}/${S.b.store}</b></div>
    <div class="row"><span>${T('capacity')}</span><b>${C.cap()} ${T('unit')} · ${mm(dur(C.sec()))}</b></div>
    <div class="row"><span>${T('rep')}</span><b>${Math.round(S.rep)}/100</b></div>
    <div class="row"><span>${T('month')} ${month() + 1}</span><b class="${ev.length ? 'pos' : 'mute'}">${ev.length ? ev.map(e => T(e.id) + ' ×' + e.x).join(', ') : '–'}</b></div>
    ${!C.ok() ? `<div class="mute">${ic('lock')}${T('need_' + ch)}</div>` : ''}${up ? `<div class="mute">${ic('upgrade')} ${T('building')}</div>` : ''}</div>` +
  Object.entries(D.products).filter(([, p]) => p.lvl <= S.level).map(([id, p]) => {
    const p0 = pr(id), mg = p0 - unitCost(id), st = S.stock[id] || 0, n = Math.min(st, C.cap()), q = S.sq[id] || 2;
    const dm = ch === 'bulk' ? 1 : demand(id, p0, q, ch), net = Math.floor(n * dm) * p0 * (1 - TAX - C.fee) - Math.floor(n * dm) * C.ship;
    return `<div class="card"><div class="row"><span>${ic(p.icon)}${T(id)}</span><span>${T('stock')} ${st}${S.sq[id] ? ' · Q' + S.sq[id].toFixed(1) : ''}</span></div>
    <div class="row">${ch === 'bulk' ? `<b>${fmt(p0)}</b><span class="mute">${T('fixed')}</span>` : `<button class="b" data-a="price:${id},-1">−</button><b>${fmt(p0)}</b><button class="b" data-a="price:${id},1">+</button>`}</div>
    <div class="row mute"><span>${T('margin')}</span><span>${fmt(mg)} (${Math.round(mg / unitCost(id) * 100)}%)</span></div>
    <div class="row mute"><span>${T('demand')} · ${T('comp')} ${fmt(compPrice(id))}</span><span>${Math.round(dm * 100)}%</span></div>
    <div class="row"><span class="mute">≈ ${fmt(net)}</span><button class="b" data-a="sell:${id}" ${full || !n || !C.ok() ? 'disabled' : ''}>${T('sell')} ${n} ${T('unit')}</button></div></div>`;
  }).join('') +
  S.jobs.filter(j => j.k === 'sell').map(j => `<div class="card"><div class="row"><span>${ic(D.products[j.id].icon)} ×${j.n} @ ${fmt(j.price)} ${ic(CH[j.ch || 'store'].icon)}</span><span>${ic('timer')}${mm(j.end - now())}</span></div></div>`).join('');
};

export const canSell = () => { const S = G.S; return !busy('up', 'store') && count('sell') < S.b.store && Object.values(S.stock).some(n => n > 0); };

export const actions = {
  ch: k => { ch = k; },
  price: s => { const [id, d] = s.split(','); G.S.price[id] = Math.max(1, (G.S.price[id] || D.products[id].base) + +d); },
  sell: id => {
    const S = G.S, C = CH[ch], n = Math.min(S.stock[id] || 0, C.cap());
    if (!n || !C.ok() || busy('up', 'store') || count('sell') >= S.b.store) return;
    S.stock[id] -= n;
    S.jobs.push({ k: 'sell', id, n, ch, price: pr(id), q: S.sq[id] || 2, st: now(), end: now() + dur(C.sec()) });
  }
};
