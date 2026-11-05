// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { LOAN_STEP, LOAN_RATE } from '../data.js?v=26';
import { T, fmt } from '../i18n.js?v=26';
import { ic } from '../icons.js?v=26';
import * as depth from '../depth.js?v=26';
import { G } from '../state.js?v=26';
import * as econ from '../econ.js?v=26';

let sub = 'report';
const limit = () => 4000 * G.S.b.office;
const row = (k, v) => `<div class="row"><span>${T(k)}</span><b>${fmt(v)}</b></div>`;
const cost = (k, v) => `<div class="row"><span>${T(k)}</span><span class="mute">−${fmt(v)}</span></div>`;

const panels = {
  report: () => { const L = G.S.led, net = L.rev - L.tax - L.mat - L.wage - L.power - L.rent - L.int - (L.fee || 0) - (L.maint || 0) - (L.mkt || 0) - (L.adm || 0) - (L.exec || 0) - (L.bexp || 0) - (L.ctax || 0) + (L.binc || 0);
    return `<div class="card"><h2>${ic('money')}${T('report')}</h2>${row('rev', L.rev)}${cost('tax', L.tax)}${cost('matx', L.mat)}${cost('wagex', L.wage)}${cost('power', L.power)}${cost('rent', L.rent)}${cost('intr', L.int)}${cost('feex', L.fee || 0)}${cost('maintx', L.maint || 0)}${cost('mktx', L.mkt || 0)}${cost('admx', L.adm || 0)}${cost('execx', L.exec || 0)}${cost('bexpx', L.bexp || 0)}${cost('ctaxx', L.ctax || 0)}${row('bincx', L.binc || 0)}
    <div class="row"><b>${T('net')}</b><b class="${net >= 0 ? 'pos' : 'neg'}">${net < 0 ? '−' : ''}${fmt(Math.abs(net))}</b></div></div>
    <div class="card"><div class="row"><span>${T('due_t')}</span><b class="${(G.S.due || 0) > 0 ? 'neg' : ''}">${fmt(Math.max(0, G.S.due || 0))}</b></div><div class="mute">${T('due_h')}</div></div>`; },
  bank: () => { const S = G.S, l = S.loan;
    return `<div class="card"><h2>${ic('office')}${T('bank')}</h2>
    <div class="row"><span>${T('loan')}</span><b class="${l > 0 ? 'neg' : ''}">${fmt(l)}</b></div>
    <div class="row"><span>${T('limit')}</span><span>${fmt(limit())}</span></div>
    <div class="row"><span>${T('rate')}</span><span>${LOAN_RATE * 100}%${T('perh')}</span></div><div class="mute">${T('overdraft')}</div></div>
    <div class="card"><div class="row"><button class="b" data-a="borrow" ${limit() - l < LOAN_STEP ? 'disabled' : ''}>${T('borrow')} · ${fmt(LOAN_STEP)}</button>
    <button class="b" data-a="repay" ${l <= 0 || S.money <= 0 ? 'disabled' : ''}>${T('repay')}</button></div></div>`; }
};

panels.rank = depth.rankPanel; panels.eco = econ.panel; panels.bonds = econ.bondsPanel;
export const view = () => `<div class="tabs">${[['report', 'money'], ['bank', 'office'], ['bonds', 'money'], ['eco', 'chart'], ['rank', 'star']].map(([k, i]) => `<button class="chip ${k === sub ? 'on' : ''}" data-a="fsub:${k}">${ic(i)}<span>${T(k)}</span></button>`).join('')}</div>` + panels[sub]();

export const actions = {
  fsub: k => { sub = k; },
  borrow: () => { const S = G.S; if (limit() - S.loan >= LOAN_STEP) { S.loan += LOAN_STEP; S.money += LOAN_STEP; } },
  repay: () => { const S = G.S, a = Math.min(S.money, S.loan); S.money -= a; S.loan -= a; }
};
