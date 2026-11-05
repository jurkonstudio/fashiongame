// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, SUP } from '../data.js?v=7';
import { T, fmt } from '../i18n.js?v=7';
import { ic } from '../icons.js?v=7';
import * as depth from '../depth.js?v=7';
import { G, matPrice, buyMat } from '../state.js?v=7';

let qty = 10;                       // 0 = maksimal sesuai uang
const OPTS = [1, 10, 50, 100, 0];
const amount = id => qty || Math.floor(G.S.money / matPrice(id));
const arrow = p => `<span class="${p > 0 ? 'neg' : p < 0 ? 'pos' : 'mute'}">${p > 0 ? '▲' : p < 0 ? '▼' : '•'}${Math.abs(p)}%</span>`;
const trend = m => arrow(Math.round((G.S.mk.idx[m] * (D.materials[m].imp ? G.S.mk.fx : 1) - 1) * 100));

const mats = () => `<div class="tabs">${Object.entries(SUP).map(([k, s]) => `<button class="chip ${k === G.sup ? 'on' : ''}" data-a="sup:${k}"><span>${T(k)}</span><span>Q${s.q} · ×${s.mult}</span></button>`).join('')}</div>
  <div class="card"><div class="row">${OPTS.map(q => `<button class="chip ${q === qty ? 'on' : ''}" data-a="qty:${q}">${q ? '×' + q : T('maxq')}</button>`).join('')}</div>
  <div class="row mute"><span>${T('fxi')} ${arrow(Math.round((G.S.mk.fx - 1) * 100))}</span><span>${T('mktupd')}</span></div></div>` +
  Object.entries(D.materials).map(([id, m]) => { const n = amount(id), c = n * matPrice(id), S = G.S;
    return `<div class="card"><div class="row"><span>${ic(m.icon)}${T(id)}</span><span class="mute">${T('have')} ${S.mat[id] || 0}${S.mq[id] ? ' · Q' + S.mq[id].toFixed(1) : ''}</span></div>
    <div class="row"><span>${fmt(matPrice(id))}/${T('unit')} ${trend(id)}</span><button class="b" data-a="buy:${id}" ${!n || S.money < c ? 'disabled' : ''}>${T('buy')} ${n} · ${fmt(c)}</button></div></div>`; }).join('');

let ms = 'mats';
export const view = () => `<div class="tabs">${[['mats', 'fabric'], ['ct', 'cart']].map(([k, i]) => `<button class="chip ${k === ms ? 'on' : ''}" data-a="msub:${k}">${ic(i)}<span>${T(k === 'ct' ? 'contracts' : 'mats')}${k === 'ct' && G.S.dp.ct.length ? ' · ' + G.S.dp.ct.length : ''}</span></button>`).join('')}</div>` + (ms === 'ct' ? depth.contracts() : mats());
export const actions = {
  msub: k => { ms = k; },
  qty: q => { qty = +q; },
  sup: k => { G.sup = k; },
  buy: id => { buyMat(id, amount(id)); }
};
