// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { ic } from './icons.js';
import { T, fmt, setLang, setCur } from './i18n.js';
import { init, load, save, serverOffset } from './api.js';
import { G, fresh, tick, setOffset } from './state.js';
import * as map from './screens/map.js';
import * as market from './screens/market.js';
import * as margin from './screens/margin.js';
import * as factory from './screens/factory.js';
import * as store from './screens/store.js';
import * as office from './screens/office.js';
import * as finance from './screens/finance.js';
import * as profile from './screens/profile.js';

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

function render() {
  const S = G.S;
  setHTML($('#hud'), `<div class="hud1"><span class="money">${fmt(S.money)}</span><button data-a="tab:profile" aria-label="${T('profile')}">${ic('profile')}</button></div><div class="hud2"><span class="pill">${ic('star')} Lv${S.level}</span><span class="pill">${ic('worker')} ${S.workers}</span><span class="pill">${ic('timer')} ${S.jobs.length}</span></div>`);
  setHTML($('#view'), (tab === 'profile' ? `<h2>${ic('profile')}${T('profile')}</h2>` : '') + screens[tab].view());
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

(async () => {
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
})();
