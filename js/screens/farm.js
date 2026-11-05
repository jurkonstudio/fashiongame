// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// Kebun: panen bahan mentah tanpa bahan masukan. Biaya = 40% harga pasar. Slot = level Kebun.
import { D } from '../data.js?v=18';
import { T, fmt } from '../i18n.js?v=18';
import { ic } from '../icons.js?v=18';
import { G, now, dur, mm, busy, count } from '../state.js?v=18';

export const growCost = id => D.grow[id].batch * D.materials[id].price * 0.4;
export const growSec = id => D.grow[id].time * 0.9 ** (G.S.b.farm - 1);
export const canGrow = id => !busy('up', 'farm') && count('grow') < G.S.b.farm && G.S.money >= growCost(id);

export const view = () => { const S = G.S;
  return `<div class="card"><h2>${ic('farm')}${T('farm')} Lv${S.b.farm}</h2><div class="row"><span>${T('slots')}</span><b>${count('grow')}/${S.b.farm}</b></div></div>`
    + Object.entries(D.grow).map(([id, g]) => `<div class="card"><div class="row"><span>${ic(D.materials[id].icon)}${T(id)} ×${g.batch} · ${mm(dur(growSec(id)))}</span>
      <button class="b" data-a="grow:${id}" ${canGrow(id) ? '' : 'disabled'}>${T('grow')} · ${fmt(growCost(id))}</button></div>
      <div class="mute row"><span>${T('market')} ${fmt(g.batch * D.materials[id].price)}</span><span>${Math.floor(S.mat[id] || 0)}</span></div></div>`).join('')
    + S.jobs.filter(j => j.k === 'grow').map(j => `<div class="card"><div class="row"><span>${ic(D.materials[j.id].icon)} ×${j.n}</span><span>${ic('timer')}${mm(j.end - now())}</span></div></div>`).join('');
};
export const actions = {
  grow: id => { const S = G.S; if (!D.grow[id] || !canGrow(id)) return; const c = growCost(id);
    S.money -= c; S.jobs.push({ k: 'grow', id, n: D.grow[id].batch, c, st: now(), end: now() + dur(growSec(id)) }); },
  qgrow: () => { const id = Object.keys(D.grow).find(k => (G.S.mat[k] || 0) < 20) || 'cotton'; actions.grow(id); }
};
