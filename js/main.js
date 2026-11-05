// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { ic } from './icons.js?v=20';
import { T, fmt, setLang, setCur } from './i18n.js?v=20';
import { init, load, save, serverOffset, status } from './api.js?v=20';
import { D } from './data.js?v=20';
import { G, fresh, tick, setOffset, toasts, now } from './state.js?v=20';
import * as map from './screens/map.js?v=20';
import * as market from './screens/market.js?v=20';
import * as margin from './screens/margin.js?v=20';
import * as factory from './screens/factory.js?v=20';
import * as store from './screens/store.js?v=20';
import * as farm from './screens/farm.js?v=20';
import * as bp from './screens/bp.js?v=20';
import * as office from './screens/office.js?v=20';
import * as finance from './screens/finance.js?v=20';
import * as depth from './depth.js?v=20';
import * as warehouse from './screens/warehouse.js?v=20';
import { GB } from './art.js?v=20';
import * as item from './screens/item.js?v=20';
import * as more from './screens/more.js?v=20';
import * as profile from './screens/profile.js?v=20';

// Peta = tindakan Pabrik & Toko (di dalam bangunan). Tab lain = layar teks/logika. Profil dibuka dari tombol di HUD.
const screens = { map, item, more, warehouse, market, margin, office, finance, profile };   // tambah layar baru di sini
const NAV = ['map', 'warehouse', 'market', 'office', 'finance'];
const ICON = { map: 'factory', warehouse: 'warehouse', market: 'cart', margin: 'chart', office: 'office', finance: 'money' };
const $ = s => document.querySelector(s);
let tab = 'map', lastSel = null, menu = false;

const actions = {
  ...Object.assign({}, ...[map, item, more, warehouse, market, margin, factory, store, farm, bp, office, finance, profile, depth].map(s => s.actions)),
  lang: () => { setLang(G.S.lang = G.S.lang === 'id' ? 'en' : 'id'); document.documentElement.lang = G.S.lang; },
  tab: t => { tab = t; menu = false; map.actions.close(); },
  menu: () => { menu = !menu; },
  item: k => { menu = false; map.actions.close(); const [i, o] = k.split('@'); item.actions.pick(i, o); tab = 'item'; },
  go: k => { menu = false; map.actions.close(); const g = { prof: ['profile', () => profile.actions.psub('card')], set: ['profile', () => profile.actions.psub('lang')], margin: ['warehouse', () => warehouse.actions.wsub('margin')], ct: ['market', () => market.actions.msub('ct')], rank: ['finance', () => finance.actions.fsub('rank')], goal: ['office', () => office.actions.sub('goal')], ach: ['more', () => more.actions.msub2('ach')], lib: ['more', () => more.actions.msub2('lib')], about: ['more', () => more.actions.msub2('about')] }[k]; tab = g[0]; g[1](); }
};

const setHTML = (el, h) => { if (el._h !== h) { el._h = h; el.innerHTML = h; } };   // render hanya jika berubah

const lvlBar = depth.lvlBar;

const DR = [['prof', 'p_card', 'profile'], ['goal', 'goal', 'target'], ['ct', 'contracts', 'cart'], ['rank', 'rank', 'star'], ['ach', 'ach', 'star'], ['lib', 'lib', 'research'], ['margin', 'margin', 'chart'], ['set', 'p_lang', 'office'], ['about', 'about', 'office']];
function render() {
  const S = G.S, pr = depth.prog(), xp = pr ? Math.round(pr.p * 100) : 100;
  setHTML($('#hud'), `<div class="hud1"><button class="hb" data-a="menu" aria-label="${T('menu')}"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></button><button class="av" data-a="go:prof" aria-label="${T('profile')}"><img class="logo" src="assets/logo.svg" alt=""></button><span class="sp"></span><button data-a="go:rank" aria-label="${T('rank')}">${ic('star')}</button><span class="money">${fmt(S.money)}</span><span class="lvp">★ ${S.level}<small>${xp}%</small></span></div><div class="hud2"><span class="pill gb">${GB}${Math.floor(S.btn)}</span><span class="pill">${ic('star')} Lv${S.level}</span><span class="pill">${ic('worker')} ${S.workers}</span><span class="pill">${ic('timer')} ${S.jobs.length}</span><span class="pill ${status.mode === 'cloud' ? 'ok' : status.mode === 'error' ? 'bad' : ''}">● ${status.mode === 'cloud' ? 'Cloud' : status.mode === 'error' ? 'Offline' : status.mode === 'connecting' ? '…' : 'Local'}${status.mode === 'cloud' && !status.clock ? ' · clock?' : ''}</span></div>${depth.banner()}`);
  setHTML($('#toast'), toasts.filter(x => now() - x.t < 6000).slice(-3).map(x => `<div>${x.txt}</div>`).join(''));
  const warn = status.mode === 'error' ? `<div class="card err"><b>Cloud unavailable, playing offline</b><div class="mute">${String(status.err).replace(/[<>&]/g, '')}</div></div>` : '';
  if (!document.activeElement?.dataset?.n) setHTML($('#view'), warn + (tab === 'profile' ? `<h2>${ic('profile')}${T('profile')}</h2>` : '') + screens[tab].view());
  document.body.classList.toggle('maptab', tab === 'map');
  const cv = $('#city'); if (cv) { cv.classList.add('full'); cv.hidden = tab !== 'map'; if (tab === 'map') try { map.city(cv); } catch (e) { console.error(e); } }
  const sh = $('#sheet'), st = sh.querySelector('.shb, .bp')?.scrollTop || 0, sel = map.selected();
  if (!document.activeElement?.dataset?.in) setHTML(sh, tab === 'map' ? map.sheet() : '');
  const nb = sh.querySelector('.shb, .bp'); if (nb && sel === lastSel) nb.scrollTop = st;   // jaga posisi scroll panel saat refresh tiap detik
  lastSel = sel;
  setHTML($('#drawer'), menu ? `<div class="shbg" data-a="menu"></div><aside class="dw"><div class="dh"><img class="logo" src="assets/logo.svg" alt=""><div><b>${String(S.name).replace(/[<>&]/g, '')}</b><small>Lv${S.level}</small></div></div>${DR.map(([k, l, i]) => `<button data-a="go:${k}">${ic(i)}${T(l)}</button>`).join('')}</aside>` : '');
  setHTML($('#nav'), NAV.map(t => `<button data-a="tab:${t}" class="${t === tab || (tab === 'item' && t === item.origin()) ? 'on' : ''}">${ic(ICON[t])}${T(t)}</button>`).join(''));
  const rs = document.documentElement.style; rs.setProperty('--hudh', $('#hud').offsetHeight + 'px'); rs.setProperty('--navh', $('#nav').offsetHeight + 'px');
}

document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.n; if (k) G.S[k] = e.target.value.slice(0, 300); });
document.addEventListener('change', e => { const d = e.target.dataset && e.target.dataset.in; if (!d) return; const [a, id] = d.split(':'); actions[a](id + ',' + e.target.value); tick(); render(); });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const [a, arg] = el.dataset.a.split(/:(.*)/s); actions[a](arg); tick(); depth.tick(); render();
});

(async () => { try {
  await init();
  setOffset(await serverOffset());                                  // timer ikut jam server
  setInterval(async () => setOffset(await serverOffset()), 300000);   // sinkron ulang tiap 5 menit
  G.S = Object.assign(fresh(), (await load()) || {});   // migrasi save lama
  G.S.b.farm = G.S.b.farm || 0;
  for (const m in D.materials) G.S.mk.idx[m] = G.S.mk.idx[m] ?? 1;   // bahan mentah baru (migrasi save lama)
  G.S.sp = G.S.sp || 0; G.S.rq = G.S.rq || {}; G.S.rqSpent = G.S.rqSpent || 0;   // migrasi v16
  if (G.S.wk.length !== G.S.workers) G.S.wk = Array(G.S.workers).fill(1);
  setLang(G.S.lang); setCur(G.S.cur);
  tick(); depth.tick(); render();
  setInterval(() => { tick(); depth.tick(); render(); }, 1000);
  setInterval(() => save(G.S), 5000);
  document.addEventListener('visibilitychange', () => document.hidden && save(G.S));
} catch (e) { document.querySelector('#view').innerHTML = `<div class="card err"><b>Startup error</b><div class="mute">${String(e && e.message || e).replace(/[<>&]/g, '')}</div></div>`; console.error(e); } })();
