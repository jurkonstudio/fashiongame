// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, SUP } from '../data.js?v=14';
import { T, fmt } from '../i18n.js?v=14';
import { ic } from '../icons.js?v=14';
import { G, itemDef, now, dur, mm, unitCost, factoryMult, busy, count, shortfall, buyMat, useBatch, whCap, whUsed, defectRate, fixCost } from '../state.js?v=14';

const blocked = id => { const S = G.S;
  return busy('up', 'factory') || count('make') >= S.b.factory || S.cond <= 0.2 || (D.products[id] && whUsed() + D.products[id].batch > whCap()); };

export const canMake = id => { const sf = shortfall(id); return !blocked(id) && G.S.money >= sf.cost; };

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
  make: id => {
    const S = G.S, p = itemDef(id), sf = shortfall(id);
    if (blocked(id) || S.money < sf.cost) return;
    for (const m in sf.miss) buyMat(m, sf.miss[m]);
    const u = useBatch(id);
    S.jobs.push({ k: 'make', id, n: p.batch, q: u.q, c: u.cost, st: now(), end: now() + dur(p.time) * factoryMult() });
  }
};
