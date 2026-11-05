// (c) 2026 FashionGame. Toko Kancing Emas: tukar ke uang (batas harian) + slot etalase.
import { T, fmt } from '../i18n.js?v=28';
import { ic } from '../icons.js?v=28';
import { GB } from '../art.js?v=28';
import { G, day, now, toasts } from '../state.js?v=28';
import { XCH } from '../data.js?v=28';

const soon = (ico, n) => `<div class="card mute"><div class="row"><b>${ic(ico)}${T(n)}</b><span>${T('bs_soon')}</span></div></div>`;
let qx = 1;
const usedToday = S => (S.xd && S.xd.d === day() ? S.xd.n : 0);
const left = S => Math.max(0, XCH.day - usedToday(S));
const cap = S => Math.min(Math.floor(S.btn), left(S));

export const view = () => { const S = G.S, c = cap(S), n = Math.min(qx, c);
  return `<h2>${GB} ${T('btnshop')}</h2><div class="card"><div class="row"><span>${T('btn')}</span><b>${Math.floor(S.btn)} ${GB}</b></div></div>`
    + `<div class="card"><div class="row"><b>${ic('money')}${T('xc_title')}</b><span class="mute">1 ${GB} = ${fmt(XCH.rate)}</span></div>`
    + `<div class="row"><span>${T('xc_left')}</span><b>${left(S)} ${GB}</b></div>`
    + `<div class="row"><button class="b" data-a="xq:-1" ${qx <= 1 ? 'disabled' : ''}>−</button><b>${n} ${GB}</b><button class="b" data-a="xq:1" ${qx >= c ? 'disabled' : ''}>+</button></div>`
    + `<div class="row"><button class="b" data-a="xgo" ${c < 1 ? 'disabled' : ''}>${T('xc_go')} ${n} · ${fmt(n * XCH.rate)}</button></div>`
    + (left(S) <= 0 ? `<div class="mute">${T('xc_done')}</div>` : '') + `</div>`
    + `<div class="card"><div class="row"><b>${ic('lock')}${T('bs_slot')}</b>${S.dc3 ? `<span class="mute">${T('bs_owned')}</span>` : `<button class="b" data-a="dcunlock" ${S.btn < XCH.dc ? 'disabled' : ''}>${XCH.dc} ${GB}</button>`}</div></div>`
    + soon('profile', 'bs_logo') + soon('upgrade', 'bs_auto')
    + `<div class="card"><button class="b" data-a="go:redeem">${ic('star')} ${T('redeem')}</button></div>`; };

export const actions = {
  xq: d => { qx = Math.max(1, qx + Number(d)); },
  xgo: () => { const S = G.S, n = Math.min(qx, cap(S)); if (n < 1) return;
    S.btn -= n; S.money += n * XCH.rate; S.xd = { d: day(), n: usedToday(S) + n };
    toasts.push({ txt: `${T('xc_ok')}: +${fmt(n * XCH.rate)}`, t: now() }); },
  dcunlock: () => { const S = G.S; if (S.dc3 || S.btn < XCH.dc) return; S.btn -= XCH.dc; S.dc3 = true; }
};
