// (c) 2026 FashionGame. Pasar/Bursa ala Sim Companies: ticker harga, kategori berisi ikon barang, 'Terakhir dilihat'. Ketuk barang -> halaman barang (penjual & pembeli NPC).
import { D } from '../data.js?v=28';
import { T, fmt } from '../i18n.js?v=28';
import { ic } from '../icons.js?v=28';
import { ART } from '../art.js?v=28';
import * as depth from '../depth.js?v=28';
import { subbar } from '../subbar.js?v=28';
import { G, matPrice } from '../state.js?v=28';
import * as econ from '../econ.js?v=28';

const GROUPS = [['cat_farm', ['cotton', 'hide', 'latex', 'dye']], ['cat_mat', ['thread', 'rubber', 'leather', 'fabric']], ['cat_prod', Object.keys(D.products)]];
const SUBS = [['ex', 'cart', 'exch'], ['xc', 'chart', 'xc_t'], ['ct', 'money', 'contracts']];
const price = id => D.materials[id] ? matPrice(id, 'std') : G.S.price[id] || D.products[id].base;
const dir = m => { const p = Math.round((G.S.mk.idx[m] * (D.materials[m].imp ? G.S.mk.fx : 1) - 1) * 100); return p > 0 ? ['▲', 'up'] : p < 0 ? ['▼', 'dn'] : ['•', 'eq']; };
const ticker = () => `<div class="tkr">${Object.keys(D.materials).map(m => { const [a, c] = dir(m); return `<span class="tk" data-a="item:${m}@market">${ic(D.materials[m].icon)}<b>${fmt(price(m))}</b><i class="${c}">${a}</i></span>`; }).join('')}</div>`;
const xt = id => { const lock = D.products[id] && D.products[id].lvl > G.S.level;
  return `<div class="xt ${lock ? 'lock' : ''}" data-a="item:${id}@market" role="button" aria-label="${T(id)}">${ART[id]}<small>${lock ? ic('lock') : fmt(price(id))}</small></div>`; };
const grid = () => { const rec = (G.S.rec || []).filter(k => ART[k]);
  return GROUPS.map(([c, ids]) => `<div class="cat">${T(c)}</div><div class="xg">${ids.map(xt).join('')}</div>`).join('')
    + (rec.length ? `<div class="cat">${T('recent')}</div><div class="xg">${rec.map(xt).join('')}</div>` : ''); };

let ms = 'ex';
export const view = () => (ms === 'ct' ? `<div class="cat">${T('contracts')}${G.S.dp.ct.length ? ' · ' + G.S.dp.ct.length : ''}</div>` + depth.contracts() : ms === 'xc' ? econ.exchPanel() + econ.orderPanel() + econ.retailStats() : ticker() + grid()) + subbar(SUBS, ms, 'msub');
export const actions = {
  msub: k => { ms = k; },
  sup: k => { G.sup = k; }
};
