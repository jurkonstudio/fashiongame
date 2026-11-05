// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, WAGE, HIRE } from '../data.js';
import { T, fmt } from '../i18n.js';
import { ic } from '../icons.js';
import { G, now, dur, mm, busy, job, bMax, upCost, upSec } from '../state.js';

let sub = 'goal';
const SUBS = [['goal', 'target', 't_goal'], ['workers', 'worker', 'workers'], ['research', 'research', 'research'], ['build', 'office', 't_build']];
const bar = n => `<div class="bar"><i style="width:${Math.min(100, n)}%"></i></div>`;

const panels = {
  goal: () => { const S = G.S, g = D.goals1;
    return S.level > 1 ? `<div class="card"><h2>${ic('star')}Lv${S.level}</h2><div class="mute">${T('nextgoal')}</div></div>` :
    `<div class="card"><h2>${ic('target')}${T('goal')} 2</h2>
    <div class="row"><span>${T('make')}</span><span>${S.made}/${g.made}</span></div>${bar(S.made / g.made * 100)}
    <div class="row"><span>${T('sold')}</span><span>${S.sold}/${g.sold}</span></div>${bar(S.sold / g.sold * 100)}
    <div class="row"><span>${ic('research')}${T(g.research)}</span><span>${S.research.includes(g.research) ? '✓' : '–'}</span></div></div>`; },
  workers: () => { const S = G.S, cap = S.b.office * 5, full = S.wk.length >= cap, n = k => S.wk.filter(x => x === k).length;
    return `<div class="card"><h2>${ic('worker')}${T('workers')}: ${S.wk.length}/${cap}</h2>${[1, 2, 3].map(k => `<div class="row"><span>${T('skill' + k)} ×${n(k)}</span><span class="mute">${fmt(WAGE[k])}${T('perh')}</span></div>`).join('')}
    <div class="row"><span>${T('wage')}</span><b>${fmt(S.wk.reduce((a, k) => a + WAGE[k], 0))}</b></div></div>` +
    [1, 2, 3].map(k => `<div class="card"><div class="row"><span>${T('skill' + k)} · ${fmt(WAGE[k])}${T('perh')}</span><button class="b" data-a="hire:${k}" ${full || S.money < HIRE[k] ? 'disabled' : ''}>${T('hire')} · ${fmt(HIRE[k])}</button></div></div>`).join(''); },
  research: () => { const S = G.S;
    return Object.entries(D.research).map(([id, r]) => `<div class="card"><div class="row"><span>${ic('research')}${T(id)} · ${mm(dur(r.time))}</span>${S.research.includes(id) ? `<b>${T('done')}</b>` :
      `<button class="b" data-a="res:${id}" ${busy('res', id) || S.money < r.cost ? 'disabled' : ''}>${T('research')} · ${fmt(r.cost)}</button>`}</div>${job('res', id)}</div>`).join(''); },
  build: () => { const S = G.S;
    return Object.entries(D.buildings).filter(([id]) => S.b[id]).map(([id, b]) => { const lv = S.b[id], top = lv >= bMax();
      return `<div class="card"><div class="row"><span>${ic(b.icon)}${T(id)} Lv${lv}/${bMax()}</span>
      <button class="b" data-a="up:${id}" ${top || busy('up', id) || S.money < upCost(id) ? 'disabled' : ''}>${top ? T('max') : `${T('upgrade')} · ${fmt(upCost(id))} · ${mm(dur(upSec(id)))}`}</button></div>
      <div class="mute row"><span>${T(b.fx)}</span></div>${job('up', id)}</div>`; }).join(''); }
};

export const view = () => `<div class="tabs">${SUBS.map(([k, i, l]) => `<button class="chip ${k === sub ? 'on' : ''}" data-a="sub:${k}">${ic(i)}<span>${T(l)}</span></button>`).join('')}</div>` + panels[sub]();

export const actions = {
  sub: k => { sub = k; },
  up: id => { const S = G.S; if (busy('up', id) || S.b[id] >= bMax() || S.money < upCost(id)) return; S.money -= upCost(id); S.jobs.push({ k: 'up', id, end: now() + dur(upSec(id)) }); },
  res: id => { const S = G.S, r = D.research[id]; if (busy('res', id) || S.research.includes(id) || S.money < r.cost) return; S.money -= r.cost; S.jobs.push({ k: 'res', id, end: now() + dur(r.time) }); },
  hire: k => { const S = G.S; if (S.money >= HIRE[k] && S.wk.length < S.b.office * 5) { S.money -= HIRE[k]; S.wk.push(+k); S.workers = S.wk.length; } }
};
