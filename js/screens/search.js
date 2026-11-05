// (c) 2026 FashionGame. Pencarian lokal: barang, bangunan, halaman, pemain (NPC peringkat).
import { D } from '../data.js?v=28';
import { T } from '../i18n.js?v=28';
import { ic } from '../icons.js?v=28';
import { rankList } from '../depth.js?v=28';
let q = '';
const esc = x => String(x || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const PAGES = [['prof', 'p_card'], ['goal', 'goal'], ['ct', 'contracts'], ['rank', 'rank'], ['ach', 'ach'], ['lib', 'lib'], ['enc', 'enc'], ['notes', 'notesm'], ['redeem', 'redeem'], ['margin', 'margin'], ['set', 'settings'], ['about', 'about']];
const BLD = ['factory', 'store', 'office', 'warehouse', 'bank', 'boutique', 'studio'];
const sec = (t, rows) => rows.length ? `<div class="cath"><span class="cat">${T(t)}</span></div>` + rows.map(([a, ico, l]) => `<button class="b srh" data-a="${a}">${ico ? ic(ico) : ''}${esc(l)}</button>`).join('') : '';
export const view = () => { const t = q.trim().toLowerCase(),
    box = `<h2>${ic('search')} ${T('search')}</h2><div class="card"><input class="srch" data-in="srch:x" value="${esc(q)}" placeholder="${T('s_ph')}" enterkeyhint="search" autocomplete="off"></div>`;
  if (!t) return box;
  const ok = (k, l) => String(l).toLowerCase().includes(t) || k.toLowerCase().includes(t),
    items = [...Object.keys(D.products), ...Object.keys(D.materials)].filter(k => ok(k, T(k))).map(k => [`item:${k}@warehouse`, k, T(k)]),
    bld = BLD.filter(k => ok(k, T(k))).map(k => ['tab:map', k === 'bank' ? 'office' : k, T(k)]),
    pg = PAGES.filter(([k, l]) => ok(k, T(l))).map(([k, l]) => [`go:${k}`, '', T(l)]),
    pl = rankList().filter(r => ok('', r[0])).map(r => ['go:rank', 'star', r[0]]),
    html = sec('s_items', items) + sec('s_bld', bld) + sec('s_pages', pg) + sec('s_players', pl);
  return box + (html || `<div class="card mute">${T('s_none')}</div>`); };
export const actions = { srch: s => { q = String(s).slice(2); } };
