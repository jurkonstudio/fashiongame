// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, WAGE, SLOT_COST } from '../data.js?v=16';
import { T, fmt, setLang, setCur } from '../i18n.js?v=16';
import { SUPABASE_URL } from '../config.js?v=16';
import { ic } from '../icons.js?v=16';
import { city } from '../art.js?v=16';
import { rankList } from '../depth.js?v=16';
import { G, fresh, unitCost, factoryMult } from '../state.js?v=16';

// Profil & pengaturan (teks/logika). Nama eksekutif adalah tokoh fiktif buatan sendiri.
let sub = 'card', arm = false;
const SUBS = [['card', 'p_card'], ['company', 'p_company'], ['account', 'p_account'], ['lang', 'p_lang'], ['pref', 'p_pref'], ['notif', 'p_notif'], ['chat', 'p_chat'], ['reset', 'p_reset']];
const EX = [['coo', 'Bayu Anggara'], ['cfo', 'Sinta Maheswari'], ['cmo', 'Dimas Kurnia'], ['cto', 'Laras Prameswari']];
const row = (k, v) => `<div class="row"><span>${T(k)}</span><b>${v}</b></div>`;
const card = (h, b) => `<div class="card"><h2>${h}</h2>${b}</div>`;
const chips = (items, cur, a, w) => `<div class="tabs ${w || ''}">${items.map(([k, l]) => `<button class="chip ${k === cur ? 'on' : ''}" data-a="${a}:${k}">${l}</button>`).join('')}</div>`;

const esc = x => String(x || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const PANELS = {
  card: () => { const S = G.S, L = rankList(), pos = L.findIndex(r => r[2] === 1) + 1, rp = S.rep, rt = rp >= 80 ? 'A' : rp >= 60 ? 'B' : rp >= 40 ? 'C' : rp >= 20 ? 'D' : 'E', tags = Object.keys(D.products).filter(k => D.products[k].lvl <= S.level);
    return `<div class="card pc">${city(S.land.slots, S.level)}<input class="in" data-n="name" value="${esc(S.name)}" maxlength="30" aria-label="${T('cname')}"></div>`
      + card(T('rankings'), row('cvalue', '#' + pos + ' / ' + L.length) + row('rep', Math.round(rp)) + row('sold', S.sold))
      + card(T('info'), row('rating', `<span class="rt">${rt}</span>`) + row('govtier', 'T' + S.level) + row('est', new Date(S.t0).toLocaleDateString()) + row('country', 'Indonesia') + row('lastseen', T('today')) + `<div class="row">${tags.map(k => `<span class="tag ok">${ic(D.products[k].icon)}${T(k)}</span>`).join('')}</div>`)
      + card(T('desc'), `<textarea class="in" rows="3" data-n="desc" maxlength="300">${esc(S.desc)}</textarea>`)
      + card(T('notes'), `<textarea class="in" rows="3" data-n="notes" maxlength="300">${esc(S.notes)}</textarea>`); },
  company: () => { const S = G.S, cap = S.b.office * 5;
    const bval = Object.keys(D.buildings).filter(id => S.b[id]).reduce((a, id) => { let s = 0; for (let l = 1; l <= S.b[id]; l++) s += D.buildings[id].cost * 1.8 ** (l - 1); return a + s; }, 0) + S.land.slots.reduce((a, s, i) => a + (s.own ? SLOT_COST[i] : 0), 0);
    const rval = S.research.reduce((a, id) => a + D.research[id].cost, 0);
    const ival = Object.entries(S.mat).reduce((a, [m, n]) => a + n * (S.mc[m] || 0), 0) + Object.entries(S.stock).reduce((a, [id, n]) => a + n * unitCost(id), 0);
    const wages = S.wk.reduce((a, k) => a + WAGE[k], 0), avg = S.wk.length ? S.wk.reduce((a, k) => a + k, 0) / S.wk.length : 0;
    const pb = Math.round((1 - factoryMult()) * 100), sb = Math.round((1 - .85 ** (S.b.store - 1)) * 100);
    return card(`${ic('star')}${T('execs')}`, EX.map(([k, n]) => row(k, n)).join('') + `<div class="mute">${T('exec_note')}</div>`)
      + card(`${ic('worker')}${T('emp')}`, row('workers', `${S.wk.length}/${cap}`) + row('avgskill', avg.toFixed(1)) + row('wagetot', fmt(wages) + T('perh')))
      + card(`${ic('upgrade')}${T('bonus')}`, row('prodspd', pb + '%') + row('salespd', sb + '%'))
      + card(`${ic('money')}${T('valu')}`, row('asof', new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })) + row('cvalue', fmt(S.money + bval + rval + ival - S.loan)) + row('bvalue', fmt(bval)) + row('rvalue', fmt(rval)) + row('ivalue', fmt(ival)))
      + card(`${ic('office')}${T('liab')}`, row('loan', `<span class="${S.loan > 0 ? 'neg' : ''}">${fmt(S.loan)}</span>`) + row('bonds', T('none'))); },
  account: () => card(`${ic('office')}${T('p_account')}`, row('mode', SUPABASE_URL ? T('cloud') : T('local')) + row('emailpw', `<span class="mute">${T('soon')}</span>`) + `<div class="row"><button class="b" disabled>${T('delacc')}</button><span class="mute">${T('soon')}</span></div>`) + `<div class="card mute">${T('legal')}</div>`,
  lang: () => card(T('p_lang'), chips([['id', 'Bahasa Indonesia'], ['en', 'English']], G.S.lang, 'setlang')),
  pref: () => card(T('cur'), chips([['idr', 'Rupiah (Rp)'], ['usd', 'US Dollar ($)']], G.S.cur, 'cur')),
  notif: () => card(T('p_notif'), [['n1', 'ntf1'], ['n2', 'ntf2'], ['n3', 'ntf3']].map(([k, l]) => `<div class="row"><span>${T(l)}</span><button class="chip ${G.S.pref[k] ? 'on' : ''}" style="flex:none;min-width:84px" data-a="ntg:${k}">${T(G.S.pref[k] ? 'on' : 'off')}</button></div>`).join('')),
  chat: () => `<div class="card mute">${ic('worker')} ${T('chatsoon')}</div>`,
  reset: () => card(T('p_reset'), `<div class="row"><button class="b" data-a="${arm ? 'rst2' : 'rst'}">${T(arm ? 'rstask' : 'rstco')}</button></div>`)
};

export const view = () => chips(SUBS.map(([k, l]) => [k, T(l)]), sub, 'psub', 'w') + PANELS[sub]();
export const actions = {
  psub: k => { sub = k; arm = false; },
  setlang: l => { setLang(G.S.lang = l); document.documentElement.lang = l; },
  cur: c => { setCur(G.S.cur = c); },
  ntg: k => { G.S.pref[k] = G.S.pref[k] ? 0 : 1; },
  rst: () => { arm = true; },
  rst2: () => { const l = G.S.lang; G.S = fresh(); G.S.lang = l; setCur(G.S.cur); arm = false; }
};
