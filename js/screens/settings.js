// (c) 2026 FashionGame. Pengaturan (dibuka dari menu): umum, tampilan peta, notifikasi, akun, data.
import { T } from '../i18n.js?v=24';
import { setLang, setCur } from '../i18n.js?v=24';
import { SUPABASE_URL } from '../config.js?v=24';
import { ic } from '../icons.js?v=24';
import { G, fresh, now, toasts } from '../state.js?v=24';

let arm = false;
const sec = (h, b) => `<div class="card kc"><h2>${h}</h2>${b}</div>`;
const line = (l, c) => `<div class="srow"><span>${l}</span><div class="seg">${c}</div></div>`;
const seg = (items, cur, a) => items.map(([k, l]) => `<button class="chip ${String(k) === String(cur) ? 'on' : ''}" data-a="${a}:${k}">${l}</button>`).join('');

export const view = () => { const S = G.S, P = S.pref;
  return sec(T('s_general'), line(T('p_lang'), seg([['id', 'Indonesia'], ['en', 'English']], S.lang, 'setlang')) + line(T('cur'), seg([['idr', 'Rp'], ['usd', '$']], S.cur, 'cur')) + line(T('clock'), seg([['0', '12h'], ['1', '24h']], P.h24 ? 1 : 0, 'h24')))
    + sec(T('s_map'), line(T('map'), seg([['auto', T('map_auto')], ['day', T('map_day')], ['night', T('map_night')]], P.map || 'auto', 'mapt')))
    + sec(T('p_notif'), [['n1', 'ntf1'], ['n2', 'ntf2'], ['n3', 'ntf3']].map(([k, l]) => line(T(l), seg([['1', T('on')], ['0', T('off')]], P[k] ? 1 : 0, 'ntg:' + k))).join(''))
    + sec(T('s_acct'), line(T('s_storage'), `<b>${SUPABASE_URL ? T('cloud') : T('local')}</b>`) + `<div class="mute">${T('savehint')}</div><div class="srow"><button class="lnk" data-a="go:prof">${ic('profile')}${T('editacc')}</button><button class="lnk" data-a="go:redeem">${ic('star')}${T('redeem')}</button></div><div class="srow"><button class="b" disabled>${T('delacc')}</button><span class="mute">${T('soon')}</span></div>`)
    + sec(T('s_data'), `<div class="srow"><button class="lnk" data-a="sexport">${ic('research')}${T('export')}</button></div>`)
    + sec(T('danger'), `<div class="row"><button class="b" data-a="${arm ? 'rst2' : 'rst'}">${T(arm ? 'rstask' : 'rstco')}</button></div>`)
    + `<div class="card kc mute">${T('legal')}</div>`; };

export const actions = {
  setlang: l => { setLang(G.S.lang = l); document.documentElement.lang = l; },
  cur: c => { setCur(G.S.cur = c); },
  h24: v => { G.S.pref.h24 = +v; },
  mapt: v => { G.S.pref.map = v; },
  ntg: a => { const [k, v] = a.split(':'); G.S.pref[k] = +v; },
  sexport: () => { try { navigator.clipboard.writeText(JSON.stringify(G.S)); toasts.push({ txt: T('exported'), t: now() }); } catch {} },
  rst: () => { arm = true; },
  rst2: () => { const l = G.S.lang; G.S = fresh(); G.S.lang = l; setCur(G.S.cur); arm = false; }
};
