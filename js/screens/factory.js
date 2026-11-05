// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, SUP, WAGE, POWER_HOUR } from '../data.js?v=28';
import { T, fmt } from '../i18n.js?v=28';
import { ic } from '../icons.js?v=28';
import { ART } from '../art.js?v=28';
import { G, itemDef, now, dur, mm, unitCost, factoryMult, busy, count, shortfall, buyMat, useBatch, whCap, whUsed, defectRate, fixCost, clk, adminPct, qBonus, matPrice } from '../state.js?v=28';

const blocked = (id, b = 1) => { const S = G.S;
  return busy('up', 'factory') || count('make') >= S.b.factory || S.cond <= 0.2 || (D.products[id] && whUsed() + D.products[id].batch * b > whCap()); };

export const canMake = (id, b = 1) => { const sf = shortfall(id, b); return !blocked(id, b) && G.S.money >= sf.cost; };

// ===== v27: panel produksi (jumlah batch, selesai jam, kualitas lewat supplier, beli bahan kurang) =====
const HARD = 99, qb = {};                                   // qb = jumlah batch pilihan per barang
const oneMs = id => dur(itemDef(id).time) * factoryMult();   // durasi 1 batch (ms)
const maxB = id => { const p = itemDef(id); let m = HARD;
  if (D.products[id]) m = Math.min(m, Math.floor((whCap() - whUsed()) / p.batch));
  while (m > 1 && shortfall(id, m).cost > G.S.money) m--;     // yang mampu dibeli
  return Math.max(1, m); };
const bOf = id => Math.max(1, Math.min(maxB(id), qb[id] || 1));
const hrsOf = (id, b) => itemDef(id).time * factoryMult() * b / 3600;   // jam game untuk b batch
const opCost = (id, b) => { const S = G.S, h = hrsOf(id, b);
  return (S.wk.reduce((a, k) => a + WAGE[k], 0) * h + POWER_HOUR * S.b.factory * h) * (1 + adminPct()); };
const fitUntil = (id, ms) => Math.max(1, Math.min(maxB(id), Math.floor(ms / oneMs(id))));   // batch yang muat dalam ms
const nextAt = hr => { const d = new Date(now()); d.setHours(hr, 0, 0, 0); if (d.getTime() <= now() + 60000) d.setDate(d.getDate() + 1); return d.getTime(); };
const chv = d => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="${d ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const supKeys = Object.keys(SUP);

export const panel = id => { const S = G.S, p = itemDef(id), b = bOf(id), mx = maxB(id), one = oneMs(id), sf = shortfall(id, b), prod = !!D.products[id];
  const ok = !blocked(id, b) && S.money >= sf.cost, endAt = now() + one * b, units = p.batch * b, op = opCost(id, b);
  const q = Math.min(5, SUP[G.sup].q + qBonus(id)), missN = Object.keys(sf.miss).length;
  const hh = Math.floor(one * b / 3600000), mn = Math.floor(one * b % 3600000 / 60000), dtx = (hh ? hh + 'h ' : '') + mn + 'm';
  const fin = [9, 13, 21].map(h => { const t = nextAt(h); return [clk(t), fitUntil(id, t - now())]; });
  const by = [[1, '1h'], [6, '6h'], [24, '24h']].map(([h, l]) => [l, fitUntil(id, h * 3600000)]).concat([[T('pm_max'), mx]]);
  const chips = (L, act) => L.map(([l, n]) => `<button class="chip ${n === b ? 'on' : ''}" data-a="${act}:${id},${n}">${l}</button>`).join('');
  let why = ''; if (!ok) why = busy('up', 'factory') ? T('building') : count('make') >= S.b.factory ? `${T('slots')} ${count('make')}/${S.b.factory}` : S.cond <= 0.2 ? T('broken') : S.money < sf.cost ? T('nomoney') : `${T('pm_wh')} ${whUsed()}/${whCap()}`;
  return `<div class="pm">
    <div class="pm-ings">${Object.entries(p.recipe).map(([m, n]) => { const h = Math.floor(S.mat[m] || 0), need = n * b; return `<span class="ing ${h < need ? 'bad' : ''}">${ART[m]}<b>${need.toLocaleString()}</b><small>${h.toLocaleString()}</small></span>`; }).join('')}</div>
    <div class="pm-sum">
      <div><small>${T('pm_fin')}</small><b>${clk(endAt)}</b><em>${dtx}</em></div>
      <div><small>${T('pm_out')}</small><b>×${units.toLocaleString()}</b><em>${prod ? `${T('defect')} ~${Math.round(defectRate(q) * 100)}%` : T('mats')}</em></div>
      <div><small>${T('pm_ops')}</small><b>${fmt(op)}</b><em>${fmt((sf.cost + op) / units)}/${T('unit')}</em></div></div>
    <div class="pm-g"><h4>${T('pm_fin')}</h4><div class="pm-r">${chips(fin, 'mkfin')}</div></div>
    <div class="pm-g"><h4>${T('pm_by')}</h4><div class="pm-r">${chips(by, 'mkby')}</div></div>
    <div class="qp"><div><h4>${T('pm_qual')}</h4><div class="stp"><button class="chv" data-a="mksup:-1" aria-label="-">${chv(0)}</button><span class="pm-q" title="Q${q.toFixed(1)}"><span class="stars2">${'★'.repeat(Math.max(1, Math.round(q)))}</span><small>${T(G.sup)} · ×${SUP[G.sup].mult}</small></span><button class="chv" data-a="mksup:1" aria-label="+">${chv(1)}</button></div></div>
      <div><h4>${T('qty')}</h4><div class="stp"><button class="chv" data-a="mkq:${id},-1" aria-label="-">${chv(0)}</button><input type="number" inputmode="numeric" min="1" max="${mx}" value="${b}" data-in="mkset:${id}" aria-label="${T('qty')}"><button class="chv" data-a="mkq:${id},1" aria-label="+">${chv(1)}</button></div></div></div>
    ${missN ? `<div class="pm-warn"><div class="pm-wl">⚠ ${T('pm_miss')}: ${Object.entries(sf.miss).map(([m, n]) => `<span class="ing">${ART[m]}<b>${Math.ceil(n).toLocaleString()}</b></span>`).join('')}</div>
      <button class="b sm" data-a="mkbuy:${id},${b}" ${S.money < sf.cost ? 'disabled' : ''}>${T('pm_buy')} · ${fmt(sf.cost)}</button></div>` : ''}
    ${why ? `<div class="why">${why}</div>` : ''}
    <button class="b go" data-a="make:${id},${b}" ${ok ? '' : 'disabled'}>${sf.cost > 0 ? T('buymake') : T('make')} ×${b}${sf.cost > 0 ? ' · ' + fmt(sf.cost) : ''}</button></div>`; };

let ftab = 'prod';
export const view = () => {
  const S = G.S, fc = fixCost();
  return `<div class="card"><h2>${ic('factory')}${T('factory')} Lv${S.b.factory}</h2>
    <div class="row"><span>${T('slots')}</span><b>${count('make')}/${S.b.factory}</b></div>
    <div class="row"><span>${T('machine')} ${Math.round(S.cond * 100)}%</span><button class="b" data-a="fix" ${fc <= 0 || S.money < fc ? 'disabled' : ''}>${T('maintain')} · ${fmt(fc)}</button></div>
    <div class="bar"><i style="width:${S.cond * 100}%"></i></div>
    ${S.cond <= 0.2 ? `<div class="neg">${T('broken')}</div>` : ''}
    <div class="row"><span>${T('warehouse')}</span><b class="${whUsed() >= whCap() ? 'neg' : ''}">${whUsed()}/${whCap()}</b></div>
    <div class="row mute"><span>${T('supplier')}</span><span>${T(G.sup)}</span></div>
    <div class="row mute"><span>${T('scrap')}</span><span>${S.scrap} ${T('unit')}</span></div></div>` +
    `<div class="tabs w">${[['prod', 'shirt', 'cat_prod'], ['mat', 'fabric', 'mats']].map(([k, i, l]) => `<button class="chip ${k === ftab ? 'on' : ''}" data-a="ft:${k}">${ic(i)}<span>${T(l)}</span></button>`).join('')}</div>` +
    Object.entries(ftab === 'prod' ? D.products : D.craft).map(([id, p]) => {
      if (p.lvl > S.level) return `<div class="card mute">${ic('lock')} ${ic(p.icon)} ${T(id)} · ${T('locked')} ${p.lvl}</div>`;
      const sf = shortfall(id), ok = !blocked(id) && S.money >= sf.cost;
      return `<div class="card"><div class="row"><span>${ic(p.icon)}${T(id)} ×${p.batch} · ${mm(dur(p.time) * factoryMult())}</span>
        <button class="b" data-a="make:${id}" ${ok ? '' : 'disabled'}>${sf.cost > 0 ? `${T('buymake')} · ${fmt(sf.cost)}` : T('make')}</button></div>
        <div class="mute row"><span>${Object.entries(p.recipe).map(([m, n]) => `${ic(D.materials[m].icon)}${Math.min(S.mat[m] || 0, n)}/${n}`).join(' ')}</span><span>${D.products[id] ? `${T('defect')} ~${Math.round(defectRate(SUP[G.sup].q) * 100)}%` : ''}</span></div>
        <div class="mute row"><span>${T('cost')} ${fmt(unitCost(id))}/${T('unit')}</span></div></div>`;
    }).join('') +
    S.jobs.filter(j => j.k === 'make').map(j => `<div class="card"><div class="row"><span>${ic(itemDef(j.id).icon)} ×${j.n}</span><span>${ic('timer')}${mm(j.end - now())}</span></div></div>`).join('');
};

export const actions = {
  ft: k => { ftab = k; },
  fix: () => { const S = G.S, c = fixCost(); if (c <= 0 || S.money < c) return; S.money -= c; S.led.maint = (S.led.maint || 0) + c; S.cond = 1; },
  make: a => {                                   // "id" atau "id,jumlahBatch"
    const [id, bs] = String(a).split(','), S = G.S, p = itemDef(id), b = Math.max(1, Math.min(HARD, Math.round(+bs) || 1)), sf = shortfall(id, b);
    if (!p || blocked(id, b) || S.money < sf.cost) return;
    for (const m in sf.miss) buyMat(m, sf.miss[m]);
    const u = useBatch(id, b);
    S.jobs.push({ k: 'make', id, n: p.batch * b, q: u.q, c: u.cost, st: now(), end: now() + dur(p.time) * factoryMult() * b });
    qb[id] = 1;
  },
  mkq: s => { const [id, d] = s.split(','); qb[id] = Math.max(1, Math.min(maxB(id), bOf(id) + +d)); },
  mkset: s => { const [id, v] = s.split(','); qb[id] = Math.max(1, Math.min(maxB(id), Math.round(+v) || 1)); },
  mkfin: s => { const [id, n] = s.split(','); qb[id] = Math.max(1, Math.min(maxB(id), +n)); },
  mkby: s => { const [id, n] = s.split(','); qb[id] = Math.max(1, Math.min(maxB(id), +n)); },
  mksup: d => { const i = supKeys.indexOf(G.sup); G.sup = supKeys[Math.max(0, Math.min(supKeys.length - 1, i + +d))]; },   // kualitas bahan = pilihan supplier
  mkbuy: s => { const [id, bs] = s.split(','), sf = shortfall(id, +bs || 1); if (G.S.money < sf.cost) return; for (const m in sf.miss) buyMat(m, sf.miss[m]); }
};
