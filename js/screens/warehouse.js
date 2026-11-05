// (c) 2026 FashionGame. Gudang: kartu stok bergambar per kategori + analisis margin.
import { D } from '../data.js?v=14';
import { T, fmt } from '../i18n.js?v=14';
import { ic } from '../icons.js?v=14';
import { ART } from '../art.js?v=14';
import { G, matPrice, whCap, whUsed } from '../state.js?v=14';
import * as margin from './margin.js?v=14';

let sub = 'stock';
const tile = (id, q, price, lock, go, q2) => `<div class="wt ${lock ? 'lock' : ''}" data-a="${go}">${ART[id]}<div class="p">${fmt(price)}</div><div class="q">${lock ? ic('lock') : q}</div><div class="n">${T(id)}${q2 ? `<small>${q2}</small>` : ''}</div></div>`;
export const view = () => { const S = G.S, used = whUsed(), cap = whCap(), pc = Math.min(100, used / cap * 100),
    val = Object.entries(S.stock).reduce((a, [k, n]) => a + n * (S.price[k] || D.products[k].base), 0),
    tabs = `<div class="tabs">${[['stock', 'warehouse'], ['margin', 'chart']].map(([k, i]) => `<button class="chip ${k === sub ? 'on' : ''}" data-a="wsub:${k}">${ic(i)}<span>${T(k === 'stock' ? 'warehouse' : 'margin')}</span></button>`).join('')}</div>`;
  if (sub === 'margin') return tabs + margin.view();
  return tabs + `<div class="card"><div class="row"><b>${ic('warehouse')}${used}/${cap}</b><span class="mute">${T('stockval')} ${fmt(val)}</span></div><div class="bar"><i style="width:${pc}%"></i></div></div>`
    + `<div class="cat">${T('cat_mat')}</div><div class="wg">${Object.keys(D.materials).map(m => tile(m, Math.floor(S.mat[m] || 0), matPrice(m), 0, 'item:' + m, S.mq[m] ? 'Q' + S.mq[m].toFixed(1) : '')).join('')}</div>`
    + `<div class="cat">${T('cat_prod')}</div><div class="wg">${Object.entries(D.products).map(([k, p]) => tile(k, S.stock[k] || 0, S.price[k] || p.base, p.lvl > S.level, 'item:' + k, S.sq[k] ? 'Q' + S.sq[k].toFixed(1) : '')).join('')}</div>`; };
export const actions = { wsub: k => { sub = k; } };
