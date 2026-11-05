// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// Halaman bangunan (gaya Sim Companies): gambar besar, tombol aksi, riwayat, carousel barang + satu tombol aksi besar.
import * as econ from '../econ.js?v=25';
import { D, TAX, WAGE, RENT_HOUR } from '../data.js?v=25';
import { T, fmt } from '../i18n.js?v=25';
import { ic } from '../icons.js?v=25';
import { ART } from '../art.js?v=25';
import { G, now, dur, mm, busy, count, bMax, upCost, upSec, shortfall, unitCost, factoryMult, whCap, whUsed, fixCost, defectRate, demand, saleCap, CH, bulkPrice, compPrice } from '../state.js?v=25';
import * as store from './store.js?v=25';
import * as farm from './farm.js?v=25';
import * as factory from './factory.js?v=25';

let cur = 'factory'; const pick = {};
const byLvl = o => Object.keys(o).sort((a, b) => o[a].lvl - o[b].lvl);
const itemsOf = t => t === 'factory' ? [...byLvl(D.products), ...byLvl(D.craft)]
  : t === 'farm' ? Object.keys(D.grow) : t === 'store' ? byLvl(D.products).filter(k => D.products[k].lvl <= G.S.level) : [];
const sel = t => { const L = itemsOf(t); return L.includes(pick[t]) ? pick[t] : L[0]; };
const def = id => D.products[id] || D.craft[id] || D.grow[id] || {};
const ago = t => { const m = Math.max(0, Math.floor((now() - t) / 60000)); return m < 1 ? T('justnow') : m < 60 ? m + ' ' + T('min') : m < 1440 ? Math.floor(m / 60) + ' ' + T('hour') : Math.floor(m / 1440) + ' ' + T('day'); };
const row = (a, b) => `<div class="row"><span>${a}</span><b>${b}</b></div>`;

const history = t => { const L = (G.S.lg || []).filter(e => e.b === t).slice(0, 3);
  return L.length ? `<div class="hist">${L.map(e => `<div class="hc">${ART[e.id] || ''}<div><small>${ago(e.t)}</small><b>${e.n.toLocaleString()} ${T(e.id)}${e.m ? ` · +${fmt(e.m)}` : ''}</b></div></div>`).join('')}</div>` : ''; };

const running = t => G.S.jobs.filter(j => (t === 'factory' && j.k === 'make') || (t === 'farm' && j.k === 'grow') || (t === 'store' && j.k === 'sell'))
  .map(j => { const p = j.st ? Math.min(1, (now() - j.st) / (j.end - j.st)) : 0;
    return `<div class="rj">${ART[j.id] || ''}<div><b>×${j.n} ${T(j.id)}</b><div class="bar"><i style="width:${p * 100}%"></i></div></div><span>${ic('timer')}${mm(j.end - now())}</span></div>`; }).join('');

const nextIdle = t => { const k = { factory: 'make', farm: 'grow', store: 'sell' }[t], j = k && G.S.jobs.filter(j => j.k === k).sort((a, b) => a.end - b.end)[0];
  return j ? `<div class="nxi">${T('nextidle')}: ${T(j.id)} · ${mm(j.end - now())} &gt;&gt;</div>` : ''; };
const stats = t => { const S = G.S, lv = S.b[t];
  if (t === 'factory') return row(T('wages'), fmt(S.wk.reduce((a, k) => a + WAGE[k], 0)) + '/h') + row(T('workers'), S.wk.length)
    + `<div class="row"><span>${T('machine')} ${Math.round(S.cond * 100)}%</span><button class="b" data-a="fix" ${fixCost() <= 0 || S.money < fixCost() ? 'disabled' : ''}>${T('maintain')} · ${fmt(fixCost())}</button></div><div class="bar"><i style="width:${S.cond * 100}%"></i></div>`
    + row(T('warehouse'), `${whUsed()}/${whCap()}`);
  if (t === 'store') return row(T('wages'), fmt(S.wk.reduce((a, k) => a + WAGE[k], 0)) + '/h') + row(T('workers'), S.wk.length) + row(T('admin'), Math.ceil(S.wk.length * 0.3)) + row(T('slots'), `${count('sell')}/${lv}`) + row(T('rep'), Math.round(S.rep) + '/100') + row(T('rent'), fmt(RENT_HOUR * lv) + '/h');
  if (t === 'farm') return row(T('slots'), `${count('grow')}/${lv}`) + row(T('rent'), fmt(RENT_HOUR * lv) + '/h');
  return row(T('warehouse'), `${whUsed()}/${whCap()}`) + `<div class="bar"><i style="width:${Math.min(100, whUsed() / whCap() * 100)}%"></i></div>`; };

const selector = t => { const S = G.S, id = sel(t); if (!id) return '';
  const d = def(id), L = itemsOf(t), nav = `<button class="nv" data-a="pk:-1" aria-label="prev">‹</button><div class="big">${ART[id]}</div><button class="nv" data-a="pk:1" aria-label="next">›</button>`;
  const dots = `<div class="dots">${L.map(k => `<i class="${k === id ? 'on' : ''}"></i>`).join('')}</div>`;
  if (t === 'store') { const c = store.curCh(), C = CH[c], p0 = C.fixed ? C.price(id, S.sq[id] || 2) : (S.price[id] || D.products[id].base), st = S.stock[id] || 0, mx = Math.min(st, C.cap()), q = S.sq[id] || 2;
    const n = Math.max(0, Math.min(mx, (S.qty || {})[id] ?? mx)), dm = C.fixed ? 1 : demand(id, p0, q, c), sold = Math.floor(n * dm), pu = p0 * (1 - TAX - C.fee) - C.ship - unitCost(id), ms = dur(C.sec());
    const hh = Math.floor(ms / 3600000), mn = Math.round(ms % 3600000 / 60000), fin = new Date(now() + ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), net = sold * pu, pph = ms > 0 ? net / (ms / 3600000) : 0;
    const full = busy('up', 'store') || count('sell') >= S.b.store, chv = up => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="${up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return `<div class="tabs w">${Object.entries(CH).map(([k, x]) => `<button class="chip ${k === c ? 'on' : ''}" data-a="ch:${k}" ${x.ok() ? '' : 'disabled'}>${ic(x.icon)}<span>${T('ch_' + k)}</span></button>`).join('')}</div>
    <div class="sc"><div class="sci"><span class="stars" aria-label="Q${q.toFixed(1)}">${'★'.repeat(Math.min(5, Math.max(1, Math.round(q))))}</span>${ART[id]}</div>
      <div class="scr"><h3>${T(id)}</h3><div>${T('stock')}: ${st}</div><div>${T('pprofit')}: <span class="${pu >= 0 ? 'pos' : 'neg'}">${fmt(pu)}</span> <span class="qm" title="${T('qhint')}">?</span></div>
        <div>${T('finishes')}: ${fin}</div><small>${T('inx')} ${hh ? hh + 'h, ' : ''}${mn}m</small><hr><b>${T('phour')}: ${fmt(pph)}</b></div></div>
    <div class="scn"><button class="nv sm" data-a="pk:-1" aria-label="prev">‹</button>${dots}<button class="nv sm" data-a="pk:1" aria-label="next">›</button></div>
    <div class="qp"><div><h4>${T('qty')}</h4><div class="stp"><button class="chv" data-a="sqty:${id},-1" aria-label="-">${chv(0)}</button><input type="number" inputmode="numeric" min="0" max="${mx}" value="${n}" data-in="sqtyset:${id}" aria-label="${T('qty')}"><button class="chv" data-a="sqty:${id},1" aria-label="+">${chv(1)}</button></div></div>
      <div><h4>${T('pricel')}</h4>${C.fixed ? `<div class="stp"><span class="fx">${fmt(p0)}</span></div>` : `<div class="stp"><button class="chv" data-a="price:${id},-1" aria-label="-">${chv(0)}</button><input type="number" inputmode="numeric" min="1" value="${Math.round(p0)}" data-in="pset:${id}" aria-label="${T('pricel')}"><button class="chv" data-a="price:${id},1" aria-label="+">${chv(1)}</button></div>`}</div></div>
    <div class="mute row"><span>${T('comp')} ${fmt(compPrice(id))}</span><span>${T('demand')} ${Math.round(dm * 100)}% · ≈ ${fmt(net)}</span></div>
    <button class="b go" data-a="sell:${id}" ${full || !n || !C.ok() ? 'disabled' : ''}>${T('sell')} ${n}</button>`; }
  const locked = d.lvl > S.level;
  const ings = t === 'farm' ? '' : `<div class="ings">${Object.entries(d.recipe || {}).map(([m, n]) => { const h = Math.floor(S.mat[m] || 0); return `<span class="ing ${h < n ? 'bad' : ''}">${ART[m]}<b>${h}/${n}</b></span>`; }).join('')}</div>`;
  let cost, sec, ok, why = '', act;
  if (t === 'farm') { cost = farm.growCost(id); sec = farm.growSec(id); ok = farm.canGrow(id); act = `grow:${id}`; if (!ok) why = busy('up', 'farm') ? T('building') : count('grow') >= S.b.farm ? `${T('slots')} ${count('grow')}/${S.b.farm}` : T('nomoney'); }
  else { const sf = shortfall(id); cost = sf.cost; sec = d.time * factoryMult(); ok = !locked && factory.canMake(id); act = `make:${id}`;
    if (locked) why = `${T('locked')} ${d.lvl}`; else if (!ok) why = busy('up', 'factory') ? T('building') : count('make') >= S.b.factory ? `${T('slots')} ${count('make')}/${S.b.factory}` : S.cond <= 0.2 ? T('broken') : S.money < sf.cost ? T('nomoney') : `${T('warehouse')} ${whUsed()}/${whCap()}`; }
  return `<div class="car2">${nav}</div>${dots}<h2 class="pn">${locked ? ic('lock') : ''}${T(id)}</h2>
    <div class="mute c">×${d.batch} · ${ic('timer')}${mm(dur(sec))}${D.products[id] ? ` · ${T('defect')} ~${Math.round(defectRate(2) * 100)}%` : ''}</div>${ings}
    ${t === 'farm' ? '' : `<div class="mute c">${T('cost')} ${fmt(unitCost(id))}/${T('unit')}</div>`}
    ${why ? `<div class="why">${why}</div>` : ''}<button class="b go" data-a="${act}" ${ok ? '' : 'disabled'}>${t === 'farm' ? T('grow') : cost > 0 ? T('buymake') : T('make')}${cost > 0 ? ' · ' + fmt(cost) : ''}</button>`; };

export const page = (t, hero) => { cur = t; const S = G.S, lv = S.b[t], top = lv >= bMax(), up = S.jobs.find(j => j.k === 'up' && j.id === t);
  return `<div class="bp"><div class="bph"><div class="bpb"><button class="sq" data-a="close" aria-label="${T('close')}">✕</button>
    ${t === 'store' ? `<button class="sq red" data-a="sell:${sel('store')}" aria-label="${T('sell')}">${ic('store')}</button>` : ''}
    ${t === 'office' ? '' : `<button class="sq" data-a="up:${t}" ${top || up || S.money < upCost(t) ? 'disabled' : ''} aria-label="${T('upgrade')}">${ic('upgrade')}</button>`}</div>
    ${!top && !up ? `<div class="upl">${T('upgrade')} · ${fmt(upCost(t))} · ${mm(dur(upSec(t)))}</div>` : up ? `<div class="upl">${ic('timer')}${mm(up.end - now())}</div>` : `<div class="upl">${T('max')}</div>`}
    <button class="enc" data-a="go:lib"><i>?</i>${T('encyc')}</button><div class="hero">${hero}</div><div class="bpt"><h1>${T(t)}</h1><div>${T('level')} ${lv}</div></div></div>
    <div class="bps">${stats(t)}${econ.scrapRow(t)}${nextIdle(t)}</div>${history(t)}${up ? '' : `<div class="bpx">${selector(t)}</div>${running(t)}`}</div>`; };

export const actions = {
  pk: d => { const L = itemsOf(cur), i = Math.max(0, L.indexOf(sel(cur))); pick[cur] = L[(i + +d + L.length) % L.length]; }
};
