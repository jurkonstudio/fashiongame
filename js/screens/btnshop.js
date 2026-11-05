// (c) 2026 FashionGame. Toko Kancing Emas.
import { T } from '../i18n.js?v=28';
import { ic } from '../icons.js?v=28';
import { GB } from '../art.js?v=28';
import { G } from '../state.js?v=28';
const soon = (ico, n) => `<div class="card mute"><div class="row"><b>${ic(ico)}${T(n)}</b><span>${T('bs_soon')}</span></div></div>`;
export const view = () => { const S = G.S;
  return `<h2>${GB} ${T('btnshop')}</h2><div class="card"><div class="row"><span>${T('btn')}</span><b>${Math.floor(S.btn)} ${GB}</b></div></div>`
    + `<div class="card"><div class="row"><b>${ic('lock')}${T('bs_slot')}</b>${S.dc3 ? `<span class="mute">${T('bs_owned')}</span>` : `<button class="b" data-a="dcunlock" ${S.btn < 50 ? 'disabled' : ''}>50 ${GB}</button>`}</div></div>`
    + soon('profile', 'bs_logo') + soon('upgrade', 'bs_auto')
    + `<div class="card"><button class="b" data-a="go:redeem">${ic('star')} ${T('redeem')}</button></div>`; };
export const actions = {};
