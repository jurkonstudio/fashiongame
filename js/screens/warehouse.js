// (c) 2026 FashionGame. Gudang ala Sim Companies: kategori + kartu stok 3 kolom (hanya yang dimiliki, 'Lihat semua' untuk semua) + analisis margin.
import { D } from '../data.js?v=26';
import { T, fmt } from '../i18n.js?v=26';
import { ic } from '../icons.js?v=26';
import { ART } from '../art.js?v=26';
import { G, matPrice, whCap, whUsed } from '../state.js?v=26';
import { subbar } from '../subbar.js?v=26';
import * as margin from './margin.js?v=26';

let sub = 'stock', all = false;
const GROUPS = [['cat_farm', () => ['cotton', 'hide', 'latex', 'dye']], ['cat_mat', () => ['thread', 'rubber', 'leather', 'fabric']], ['cat_prod', () => Object.keys(D.products)]];
const kf = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : String(n);
const tile = (id, q, price, lock, q2) => `<div class="wt ${lock ? 'lock' : ''}" data-a="item:${id}@warehouse">${ART[id]}<div class="p">${fmt(price)}</div><div class="q">${lock ? ic('lock') : kf(q)}</div><div class="n">${T(id)}${q2 ? `<small>${q2}</small>` : ''}</div></div>`;
const SUBS = [['stock', 'warehouse', 'warehouse'], ['margin', 'chart', 'margin']];

export const view = () => { const S = G.S, used = whUsed(), cap = whCap(), pc = Math.min(100, used / cap * 100),
    val = Object.entries(S.stock).reduce((a, [k, n]) => a + n * (S.price[k] || D.products[k].base), 0), bar = subbar(SUBS, sub, 'wsub');
  if (sub === 'margin') return margin.view() + bar;
  const info = (id, isM) => isM ? [Math.floor(S.mat[id] || 0), matPrice(id), 0, S.mq[id] ? 'Q' + S.mq[id].toFixed(1) : '']
    : [S.stock[id] || 0, S.price[id] || D.products[id].base, D.products[id].lvl > S.level, S.sq[id] ? 'Q' + S.sq[id].toFixed(1) : ''];
  let first = true, any = false;
  const secs = GROUPS.map(([cat, ids], gi) => { const isM = gi < 2,
      L = ids().map(id => [id, ...info(id, isM)]).filter(x => all || (x[1] > 0 && !x[3]));
    if (!L.length) return ''; any = true;
    const link = first ? `<span class="wall" data-a="wall" role="button">${all ? '‹ ' : ''}${T('showall')}</span>` : ''; first = false;
    return `<div class="cath"><span class="cat">${T(cat)}</span>${link}</div><div class="wg">${L.map(([id, q, p, lock, q2]) => tile(id, q, p, lock, q2)).join('')}</div>`; }).join('');
  const ctReady = (S.dp.ct || []).map((c, i) => [c, i]).filter(([c]) => (S.stock[c.p] || 0) >= c.n && (S.sq[c.p] || 2) >= c.q).map(([c, i]) => `<div class="card"><div class="row"><span>${ic(D.products[c.p].icon)}${c.n}× ${T(c.p)} · Q≥${c.q}</span><button class="b" data-a="deliver:${i}">${T('deliver')} · ${fmt(c.n * c.pr)}</button></div></div>`).join('');
  const head = `<div class="card"><div class="row"><b>${ic('warehouse')}${used}/${cap}</b><span class="mute">${T('stockval')} ${fmt(val)}</span></div><div class="bar"><i style="width:${pc}%"></i></div><div class="row"><button class="b" data-a="go:xc">${ic('chart')} ${T('xc_t')}</button><button class="b" data-a="go:ct">${ic('cart')} ${T('contracts')}</button><button class="b" data-a="csv">${T('csv')}</button></div></div>` + ctReady;
  return head + (any ? secs : `<div class="card mute">${T('whempty')}</div><div class="cath"><span></span><span class="wall" data-a="wall" role="button">${T('showall')}</span></div>`) + bar; };
const csv = () => { const S = G.S, r = [['type', 'id', 'name', 'qty', 'quality', 'unit_price', 'value']];
  for (const [k, n] of Object.entries(S.stock)) if (D.products[k] && n > 0) { const p = S.price[k] || D.products[k].base; r.push(['product', k, T(k), n, (S.sq[k] || 0).toFixed(1), p.toFixed(2), (n * p).toFixed(2)]); }
  for (const [k, n] of Object.entries(S.mat)) if (D.materials[k] && n >= 1) { const p = matPrice(k); r.push(['material', k, T(k), Math.floor(n), (S.mq[k] || 0).toFixed(1), p.toFixed(2), (Math.floor(n) * p).toFixed(2)]); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([r.map(x => x.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'fashiongame-stock.csv'; document.body.appendChild(a); a.click(); a.remove(); };
export const actions = { csv, wsub: k => { sub = k; }, wall: () => { all = !all; } };
