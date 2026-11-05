// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { ic } from './icons.js?v=5';
import { T, fmt, setLang, setCur } from './i18n.js?v=5';
import { init, load, save, serverOffset, status } from './api.js?v=5';
import { D } from './data.js?v=5';
import { G, fresh, tick, setOffset, toasts, now } from './state.js?v=5';
import * as map from './screens/map.js?v=5';
import * as market from './screens/market.js?v=5';
import * as margin from './screens/margin.js?v=5';
import * as factory from './screens/factory.js?v=5';
import * as store from './screens/store.js?v=5';
import * as office from './screens/office.js?v=5';
import * as finance from './screens/finance.js?v=5';
import * as profile from './screens/profile.js?v=5';

// Peta = tindakan Pabrik & Toko (di dalam bangunan). Tab lain = layar teks/logika. Profil dibuka dari tombol di HUD.
const screens = { map, market, margin, office, finance, profile };   // tambah layar baru di sini
const NAV = ['map', 'market', 'margin', 'office', 'finance'];
const ICON = { map: 'map', market: 'cart', margin: 'chart', office: 'office', finance: 'money' };
const $ = s => document.querySelector(s);
let tab = 'map', lastSel = null;

const actions = {
  ...Object.assign({}, ...[map, market, margin, factory, store, office, finance, profile].map(s => s.actions)),
  lang: () => { setLang(G.S.lang = G.S.lang === 'id' ? 'en' : 'id'); document.documentElement.lang = G.S.lang; },
  tab: t => { tab = t; map.actions.close(); }
};

const setHTML = (el, h) => { if (el._h !== h) { el._h = h; el.innerHTML = h; } };   // render hanya jika berubah

const lvlBar = S => { if (S.level !== 1) return ''; const g = D.goals1, p = (Math.min(S.made, g.made) / g.made + Math.min(S.sold, g.sold) / g.sold + (S.research.includes(g.research) ? 1 : 0)) / 3;
  return `<div class="lvl"><span>${T('goal')} Lv2</span><div class="bar"><i style="width:${Math.round(p * 100)}%"></i></div><b>${Math.round(p * 100)}%</b></div>`; };

function render() {
  const S = G.S;
  setHTML($('#hud'), `<div class="hud1"><span class="brand"><img class="logo" src="assets/logo.svg" alt=""><span>FASHION<b>GAME</b></span></span><span class="money">${fmt(S.money)}</span><button data-a="tab:profile" aria-label="${T('profile')}">${ic('profile')}</button></div><div class="hud2"><span class="pill">${ic('star')} Lv${S.level}</span><span class="pill">${ic('worker')} ${S.workers}</span><span class="pill">${ic('timer')} ${S.jobs.length}</span><span class="pill ${status.mode === 'cloud' ? 'ok' : status.mode === 'error' ? 'bad' : ''}">● ${status.mode === 'cloud' ? 'Cloud' : status.mode === 'error' ? 'Offline' : status.mode === 'connecting' ? '…' : 'Local'}${status.mode === 'cloud' && !status.clock ? ' · clock?' : ''}</span></div>${lvlBar(S)}`);
  setHTML($('#toast'), toasts.filter(x => now() - x.t < 6000).slice(-3).map(x => `<div>${x.txt}</div>`).join(''));
  const warn = status.mode === 'error' ? `<div class="card err"><b>Cloud unavailable, playing offline</b><div class="mute">${String(status.err).replace(/[<>&]/g, '')}</div></div>` : '';
  setHTML($('#view'), warn + (tab === 'profile' ? `<h2>${ic('profile')}${T('profile')}</h2>` : '') + screens[tab].view());
  const sh = $('#sheet'), st = sh.querySelector('.shb')?.scrollTop || 0, sel = map.selected();
  setHTML(sh, tab === 'map' ? map.sheet() : '');
  const nb = sh.querySelector('.shb'); if (nb && sel === lastSel) nb.scrollTop = st;   // jaga posisi scroll panel saat refresh tiap detik
  lastSel = sel;
  setHTML($('#nav'), NAV.map(t => `<button data-a="tab:${t}" class="${t === tab ? 'on' : ''}">${ic(ICON[t])}${T(t)}</button>`).join(''));
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const [a, arg] = el.dataset.a.split(/:(.*)/s); actions[a](arg); tick(); render();
});

(async () => { try {
  await init();
  setOffset(await serverOffset());                                  // timer ikut jam server
  setInterval(async () => setOffset(await serverOffset()), 300000);   // sinkron ulang tiap 5 menit
  G.S = Object.assign(fresh(), (await load()) || {});   // migrasi save lama
  if (G.S.wk.length !== G.S.workers) G.S.wk = Array(G.S.workers).fill(1);
  setLang(G.S.lang); setCur(G.S.cur);
  tick(); render();
  setInterval(() => { tick(); render(); }, 1000);
  setInterval(() => save(G.S), 5000);
  document.addEventListener('visibilitychange', () => document.hidden && save(G.S));
} catch (e) { document.querySelector('#view').innerHTML = `<div class="card err"><b>Startup error</b><div class="mute">${String(e && e.message || e).replace(/[<>&]/g, '')}</div></div>`; console.error(e); } })();
