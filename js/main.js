// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { ic } from './icons.js?v=28';
import { T, fmt, setLang, setCur } from './i18n.js?v=28';
import { init, load, save, serverOffset, status } from './api.js?v=28';
import { D, xpCum } from './data.js?v=28';
import { G, fresh, tick, setOffset, toasts, now, mm } from './state.js?v=28';
import * as map from './screens/map.js?v=28';
import * as market from './screens/market.js?v=28';
import * as margin from './screens/margin.js?v=28';
import * as factory from './screens/factory.js?v=28';
import * as store from './screens/store.js?v=28';
import * as farm from './screens/farm.js?v=28';
import * as bp from './screens/bp.js?v=28';
import * as office from './screens/office.js?v=28';
import * as finance from './screens/finance.js?v=28';
import * as depth from './depth.js?v=28';
import * as econ from './econ.js?v=28';
import * as warehouse from './screens/warehouse.js?v=28';
import { GB } from './art.js?v=28';
import * as item from './screens/item.js?v=28';
import * as more from './screens/more.js?v=28';
import * as profile from './screens/profile.js?v=28';
import * as settings from './screens/settings.js?v=28';
import * as btnshop from './screens/btnshop.js?v=28';
import * as chat from './screens/chat.js?v=28';
import * as search from './screens/search.js?v=28';
import { loading, boot } from './loading.js?v=28';

// Peta = tindakan Pabrik & Toko (di dalam bangunan). Tab lain = layar teks/logika. Profil dibuka dari tombol di HUD.
const screens = { map, item, more, warehouse, market, margin, office, finance, profile, settings, btnshop, chat, search };   // tambah layar baru di sini
const NAV = ['map', 'warehouse', 'market', 'chat', 'search'];
const ICON = { map: 'factory', warehouse: 'warehouse', market: 'cart', margin: 'chart', office: 'office', finance: 'money', chat: 'chat', search: 'search' };
const $ = s => document.querySelector(s);
let tab = 'map', lastSel = null, menu = false;

const actions = {
  ...Object.assign({}, ...[map, item, more, warehouse, market, margin, factory, store, farm, bp, office, finance, profile, settings, btnshop, chat, search, depth, econ].map(s => s.actions)),
  lang: () => { setLang(G.S.lang = G.S.lang === 'id' ? 'en' : 'id'); document.documentElement.lang = G.S.lang; },
  tab: t => { tab = t; menu = false; map.actions.close(); },
  menu: () => { menu = !menu; },
  xp: () => { const pr = depth.prog(); toasts.push({ txt: `${T('xp_left')}: ${Math.max(0, Math.ceil(pr.need - pr.cur))} ${T('hd_xp')} → Lv ${G.S.level + 1}`, t: now() }); },
  item: k => { menu = false; map.actions.close(); const [i, o] = k.split('@'); item.actions.pick(i, o); tab = 'item'; },
  go: k => { menu = false; map.actions.close(); const g = { prof: ['profile', () => {}], set: ['settings', () => {}], enc: ['more', () => more.actions.msub2('enc')], notes: ['more', () => more.actions.msub2('notes')], redeem: ['more', () => more.actions.msub2('redeem')], margin: ['warehouse', () => warehouse.actions.wsub('margin')], ct: ['market', () => market.actions.msub('ct')], xc: ['market', () => market.actions.msub('xc')], rank: ['finance', () => finance.actions.fsub('rank')], eco: ['finance', () => finance.actions.fsub('eco')], bank: ['finance', () => finance.actions.fsub('bank')], goal: ['office', () => office.actions.sub('goal')], ach: ['more', () => more.actions.msub2('ach')], lib: ['more', () => more.actions.msub2('lib')], about: ['more', () => more.actions.msub2('about')], btnshop: ['btnshop', () => {}], chat: ['chat', () => {}], search: ['search', () => {}] }[k]; tab = g[0]; g[1](); }
};

const setHTML = (el, h) => { if (el._h !== h) { el._h = h; el.innerHTML = h; } };   // render hanya jika berubah

const lvlBar = depth.lvlBar;
const esc = x => String(x || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
let lastMoney = null, gain = null;   // animasi "+kas" hanya muncul saat kas bertambah (ada progres)

// Header gaya Sim Companies: baris 1 = menu, avatar+cincin XP, nama & bar XP, Kancing Emas, kas. Baris 2 = ikon dinamis (hanya muncul bila relevan).
const chip = (a, ico, txt, cls = '') => `<button class="chp ${cls}" data-a="${a}">${ico}<span>${txt}</span></button>`;
function hud() {
  const S = G.S, t = now(), pr = depth.prog(), d = S.dp || {}, E = S.eco, jobs = S.jobs.filter(j => j.end > t);
  if (lastMoney === null) lastMoney = S.money;
  if (S.money > lastMoney + 0.005) gain = { v: S.money - lastMoney, t };   // kas naik = ada progres
  lastMoney = S.money; if (gain && t - gain.t > 3500) gain = null;
  const c = [];
  if (S.cond < 0.35 && S.b.factory) c.push(chip('tab:map', ic('factory'), T('hd_mach'), 'bad'));
  const ready = (d.ct || []).filter(k => (S.stock[k.p] || 0) >= k.n && (S.sq[k.p] || 2) >= k.q).length;
  if ((d.ct || []).length) c.push(chip('go:ct', ic('cart'), `${T('hd_ct')} ${d.ct.length}${ready ? ' · ' + ready + ' ' + T('hd_ready') : ''}`, ready ? 'ok' : ''));
  if (jobs.length) c.push(chip('tab:map', ic('timer'), `${T('hd_next')} ${mm(Math.min(...jobs.map(j => j.end)) - t)} · ${jobs.length}`));
  if (d.ev) c.push(chip('tab:market', ic('chart'), `${T('ev_' + d.ev.id)} · ${mm(d.ev.end - t)}`, ['strike', 'tariff', 'slump'].includes(d.ev.id) ? 'bad' : 'ok'));
  if (d.camp) c.push(chip('tab:market', ic('star'), `${T('camp_' + d.camp.id)} · ${mm(d.camp.end - t)}`, 'ok'));
  if (E) c.push(chip('go:eco', ic('chart'), `${T('ph_' + E.ph)}`, E.ph === 'recession' ? 'bad' : E.ph === 'boom' ? 'ok' : ''));
  if ((S.due || 0) > 0.005) c.push(chip('tab:finance', ic('money'), `${T('hd_bills')} ${fmt(S.due)}`, 'warn'));
  if (S.loan > 0.005) c.push(chip('go:bank', ic('office'), `${T('loan')} ${fmt(S.loan)}`, 'bad'));
  if (d.contest) c.push(chip('go:rank', ic('star'), T('hd_contest'), 'ok'));
  if ((S.inbox || []).length) c.push(chip('go:chat', ic('chat'), `${T('hd_msg')} ${S.inbox.length}`, 'warn'));
  const rk = depth.rankList().findIndex(r => r[2] === 1) + 1;
  c.push(chip('go:rank', ic('star'), `#${rk}`));
  c.push(chip('go:prof', ic('worker'), `${S.workers}`));
  c.push(`<span class="chp st ${status.mode === 'cloud' ? 'ok' : status.mode === 'error' ? 'bad' : ''}">● ${status.mode === 'cloud' ? 'Cloud' : status.mode === 'error' ? 'Offline' : status.mode === 'connecting' ? '…' : 'Local'}${status.mode === 'cloud' && !status.clock ? ' · clock?' : ''}</span>`);
  return `<div class="hud1"><button class="hb" data-a="menu" aria-label="${T('menu')}"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></button>`
    + `<button class="av ring" data-a="go:prof" aria-label="${T('profile')}" style="--p:${Math.round(pr.p * 360)}deg"><img class="logo" src="assets/logo.svg" alt=""><b class="lvb">${S.level}</b></button>`
    + `<div class="who"><span class="nm" data-a="go:prof" role="button">${esc(S.name)}</span><span class="xb" data-a="xp" role="button"><i style="width:${Math.round(pr.p * 100)}%"></i></span><small data-a="xp" role="button">Lv ${S.level} · ${Math.floor(pr.cur)}/${pr.need} ${T('hd_xp')}</small></div>`
    + `<span class="sp"></span><button class="gbp" data-a="go:btnshop" aria-label="${T('btn')}">${GB}<b>${Math.floor(S.btn)}</b></button>`
    + `<button class="cash" data-a="tab:finance" aria-label="${T('cash')}"><small>${T('cash')}</small><b class="money">${fmt(S.money)}</b>${gain ? `<em class="gain">+${fmt(gain.v)}</em>` : ''}</button></div>`
    + `<div class="hud2">${c.join('')}</div>`;
}

const DR = [['prof', 'p_card'], ['goal', 'goal'], ['ct', 'contracts'], ['rank', 'rank'], ['ach', 'ach'], ['lib', 'lib'], ['enc', 'enc'], ['notes', 'notesm'], ['redeem', 'redeem'], ['margin', 'margin'], ['set', 'settings'], ['about', 'about']];   // menu samping ala Sim Companies
function render() {
  setHTML($('#hud'), hud());
  setHTML($('#toast'), toasts.filter(x => now() - x.t < 6000).slice(-3).map(x => `<div>${x.txt}</div>`).join(''));
  const warn = status.mode === 'error' ? `<div class="card err"><b>Cloud unavailable, playing offline</b><div class="mute">${String(status.err).replace(/[<>&]/g, '')}</div></div>` : '';
  if (!document.activeElement?.dataset?.n) setHTML($('#view'), warn + (tab === 'settings' ? `<h2>${ic('office')}${T('settings')}</h2>` : '') + screens[tab].view());
  document.body.classList.toggle('maptab', tab === 'map');
  const cv = $('#city'); if (cv) { cv.classList.add('full'); cv.hidden = tab !== 'map'; if (tab === 'map') try { map.city(cv); } catch (e) { console.error(e); } }
  const sh = $('#sheet'), st = sh.querySelector('.shb, .bp')?.scrollTop || 0, sel = map.selected();
  if (!document.activeElement?.dataset?.in) setHTML(sh, tab === 'map' ? map.sheet() : '');
  const nb = sh.querySelector('.shb, .bp'); if (nb && sel === lastSel) nb.scrollTop = st;   // jaga posisi scroll panel saat refresh tiap detik
  lastSel = sel;
  setHTML($('#drawer'), menu ? `<div class="shbg" data-a="menu"></div><aside class="dw">${DR.map(([k, l]) => `<button data-a="go:${k}">${T(l)}</button>`).join('')}</aside>` : '');
  setHTML($('#nav'), NAV.map(t => `<button data-a="tab:${t}" class="${t === tab || (tab === 'item' && t === item.origin()) ? 'on' : ''}">${ic(ICON[t])}${T(t)}</button>`).join(''));
  const rs = document.documentElement.style; rs.setProperty('--hudh', $('#hud').offsetHeight + 'px'); rs.setProperty('--navh', $('#nav').offsetHeight + 'px');
}

document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.n; if (!k) return; const v = e.target.value.slice(0, 300);
  if (k === 'name' && v !== G.S.name && G.S.name) { const p = (G.S.pn = G.S.pn || []).filter(x => x !== G.S.name && x !== v); p.unshift(G.S.name); G.S.pn = p.slice(0, 3); }   // riwayat nama sebelumnya
  G.S[k] = v; });
document.addEventListener('change', e => { const d = e.target.dataset && e.target.dataset.in; if (!d) return; const [a, id] = d.split(':'); actions[a](id + ',' + e.target.value); tick(); render(); });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const [a, arg] = el.dataset.a.split(/:(.*)/s); actions[a](arg); tick(); depth.tick(); econ.tick(); render();
});

// Kerangka shell saat G.S belum ada: header & nav tanpa aksi, konten = "Memuat data ...".
function skeleton() {
  setHTML($('#hud'), `<div class="hud1"><button class="hb" disabled aria-label="${T('menu')}"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></button>`
    + `<button class="av ring" disabled aria-label="${T('profile')}" style="--p:0deg"><img class="logo" src="assets/logo.svg" alt=""></button>`
    + `<div class="who"><span class="nm">&nbsp;</span><span class="xb"><i style="width:0"></i></span></div><span class="sp"></span>`
    + `<span class="cash"><small>${T('cash')}</small><b class="money">—</b></span></div><div class="hud2"></div>`);
  setHTML($('#nav'), NAV.map(t => `<button disabled>${ic(ICON[t])}${T(t)}</button>`).join(''));
  setHTML($('#view'), loading());
  const rs = document.documentElement.style; rs.setProperty('--hudh', $('#hud').offsetHeight + 'px'); rs.setProperty('--navh', $('#nav').offsetHeight + 'px');
}

(async () => { try {
  setLang(boot.lang()); skeleton(); boot.set(5);   // modul termuat; shell kerangka sudah di belakang splash
  let off = false;
  const step = async (p, f, fb) => { try { return await f(); } catch (e) { off = true; console.error(e); return fb; } finally { boot.set(p); if (off || status.mode === 'error') boot.msg(T('boot_offline')); } };   // gagal -> lanjut offline
  await step(20, init);
  setOffset(await step(40, serverOffset, 0));                        // timer ikut jam server
  setInterval(async () => setOffset(await serverOffset()), 300000);   // sinkron ulang tiap 5 menit
  const saved = await step(65, load, null);
  G.S = Object.assign(fresh(), saved || {});   // migrasi save lama
  G.S.b.farm = G.S.b.farm || 0;
  for (const m in D.materials) G.S.mk.idx[m] = G.S.mk.idx[m] ?? 1;   // bahan mentah baru (migrasi save lama)
  if (G.S.xp == null) G.S.xp = xpCum(G.S.level);   // migrasi: level lama -> XP setara
  G.S.inbox = G.S.inbox || [];   // migrasi v25
  G.S.hist = G.S.hist || []; G.S.chat = G.S.chat || {};   // migrasi v28.1
  G.S.sp = G.S.sp || 0; G.S.rq = G.S.rq || {}; G.S.rqSpent = G.S.rqSpent || 0;   // migrasi v16
  if (G.S.wk.length !== G.S.workers) G.S.wk = Array(G.S.workers).fill(1);
  setLang(G.S.lang); setCur(G.S.cur); document.documentElement.lang = G.S.lang; boot.set(80);
  tick(); depth.tick(); econ.tick(); render();
  setInterval(() => { tick(); depth.tick(); econ.tick(); finance.snap(); render(); }, 1000);
  setInterval(() => save(G.S), 5000);
  document.addEventListener('visibilitychange', () => document.hidden && save(G.S));
  boot.set(100); await boot.done();
} catch (e) { document.querySelector('#view').innerHTML = `<div class="card err"><b>Startup error</b><div class="mute">${String(e && e.message || e).replace(/[<>&]/g, '')}</div></div>`; console.error(e); boot.done(); } })();
