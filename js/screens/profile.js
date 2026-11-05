// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// Profil perusahaan: satu halaman panjang (gaya Sim Companies) dengan identitas FashionGame. Nama eksekutif adalah tokoh fiktif buatan sendiri.
import { D, WAGE, SLOT_COST } from '../data.js?v=22';
import { T, fmt } from '../i18n.js?v=22';
import { ic } from '../icons.js?v=22';
import { city, GB } from '../art.js?v=22';
import { rankList } from '../depth.js?v=22';
import * as econ from '../econ.js?v=22';
import { ACH } from './more.js?v=22';
import { G, now, clk, toasts, unitCost, factoryMult, adminPct } from '../state.js?v=22';

let ed = false;
const EX = [['coo', 'Bayu Anggara'], ['cfo', 'Sinta Maheswari'], ['cmo', 'Dimas Kurnia'], ['cto', 'Laras Prameswari']];
const CERT = [[7, 'c1'], [30, 'c2'], [90, 'c3'], [365, 'c4']];
const esc = x => String(x || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const lg = (a, b) => G.S.lang === 'id' ? a : b;
// blok dua kolom: judul tebal + label rata kanan | garis | nilai
const ks = (title, rows, sub) => `<div class="card kc"><div class="ks"><b class="l h">${title}${sub ? `<small>${sub}</small>` : ''}</b><span class="r"></span>${rows.map(([k, v]) => `<span class="l">${k}</span><span class="r">${v}</span>`).join('')}</div></div>`;
const trophy = c => `<svg viewBox="0 0 64 64" class="trophy" aria-hidden="true"><path d="M18 8h28v14a14 14 0 0 1-28 0z" fill="${c}"/><path d="M18 12H8c0 10 5 16 12 17M46 12h10c0 10-5 16-12 17" fill="none" stroke="${c}" stroke-width="4"/><rect x="29" y="34" width="6" height="12" fill="${c}"/><rect x="20" y="46" width="24" height="8" rx="3" fill="${c}"/></svg>`;
const stars = n => `<div class="dst">${'★'.repeat(n)}</div>`;

export const view = () => { const S = G.S, L = rankList(), pos = L.findIndex(r => r[2] === 1) + 1, rp = S.rep, rt = rp >= 80 ? 'A' : rp >= 60 ? 'B' : rp >= 40 ? 'C' : rp >= 20 ? 'D' : 'E',
    tags = Object.keys(D.products).filter(k => D.products[k].lvl <= S.level), cap = S.b.office * 5,
    bval = Object.keys(D.buildings).filter(id => S.b[id]).reduce((a, id) => { let s = 0; for (let l = 1; l <= S.b[id]; l++) s += D.buildings[id].cost * 1.8 ** (l - 1); return a + s; }, 0) + S.land.slots.reduce((a, s, i) => a + (s.own ? SLOT_COST[i] : 0), 0),
    rval = S.research.reduce((a, id) => a + D.research[id].cost, 0),
    ival = Object.entries(S.mat).reduce((a, [m, n]) => a + n * (S.mc[m] || 0), 0) + Object.entries(S.stock).reduce((a, [id, n]) => a + n * unitCost(id), 0),
    wages = S.wk.reduce((a, k) => a + WAGE[k], 0), avg = S.wk.length ? S.wk.reduce((a, k) => a + k, 0) / S.wk.length : 0,
    pb = Math.round((1 - factoryMult()) * 100), sb = Math.round((1 - .85 ** (S.b.store - 1)) * 100),
    qs = Object.values(S.sq || {}), aq = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : 2, style = Math.round(rp * .5 + aq * 10 + tags.length * 4),
    prev = (S.pn || []).join(', ') || '–', age = Math.floor((now() - S.t0) / 864e5);
  // --- kepala perusahaan ---
  let o = `<div class="card kc phd"><img class="plogo" src="assets/logo.svg" alt=""><div class="pmeta"><span class="onl">● ${T('online')}</span><div class="pname">${esc(S.name)}</div><div class="plegal">${T('legalco')}</div>`
    + `<button class="lnk" data-a="pcopy">${ic('research')}${T('copycb')}</button><button class="lnk" data-a="pedit">${ic('profile')}${ed ? T('done2') : T('editacc')}</button></div></div>`;
  if (ed) o += `<div class="card kc"><label class="lab">${T('pname')}</label><input class="in" data-n="name" value="${esc(S.name)}" maxlength="30"><label class="lab">${T('stags')}</label><input class="in" data-n="tags" value="${esc(S.tags)}" maxlength="80"><label class="lab">${T('adesc')}</label><textarea class="in" rows="4" data-n="desc" maxlength="300">${esc(S.desc)}</textarea></div>`;
  // --- peta mini + catatan pribadi ---
  o += `<div class="card pc">${city(S.land.slots, S.level)}</div>`
    + `<div class="card kc"><h2>${T('notesabout')} ${esc(S.name)}</h2><textarea class="in" rows="3" data-n="notes" maxlength="300">${esc(S.notes)}</textarea></div>`;
  // --- peringkat & info ---
  o += ks(T('rankings'), [[T('cvalue'), '#' + pos + ' / ' + L.length], [T('stylescore'), style], [T('rep'), Math.round(rp)], [T('sold'), S.sold]])
    + ks(T('info'), [[T('rating'), `<span class="rt">${rt}</span>`], [T('govtier'), 'T' + S.level], [T('est'), new Date(S.t0).toLocaleDateString()], [T('country'), '🇮🇩 Indonesia'], [T('lastseen'), T('today')], [T('ltime'), clk(Date.now())], [T('prevnames'), esc(prev)],
      [T('stags'), (esc(S.tags) || tags.map(k => T(k)).join(', ')) + ` <button class="mini-b" data-a="pedit">${ic('profile')}${T('edit')}</button>`]]);
  o += `<div class="card kc dsc">${S.desc ? esc(S.desc).replace(/\n/g, '<br>') : `<span class="mute">${T('nodesc')}</span>`}</div>`;
  // --- tim, bonus, valuasi, kewajiban ---
  o += econ.execsCard()
    + ks(T('emp'), [[T('workers'), `${S.wk.length}/${cap}`], [T('avgskill'), avg.toFixed(1)], [T('wagetot'), fmt(wages) + T('perh')]])
    + ks(T('bonus'), [[T('prodspd'), pb + '% +0%'], [T('salespd'), sb + '% +0%'], [T('adm_pct'), '+' + Math.round(adminPct() * 100) + '%']])
    + ks(T('valu'), [[T('cvalue'), fmt(S.money + bval + rval + ival - S.loan + econ.bondsInv() - econ.bondsOut())], [T('bvalue'), fmt(bval)], [T('rvalue'), fmt(rval)], [T('ivalue'), fmt(ival)]], `(${T('asof')} ${clk(Date.now())})`)
    + ks(T('liab'), [[T('loan'), `<span class="${S.loan > 0 ? 'neg' : ''}">${fmt(S.loan)}</span>`], [T('bonds'), econ.bondsOut() ? fmt(econ.bondsOut()) : T('none')]]);
  // --- etalase pencapaian ---
  const earned = ACH.map((a, i) => ({ a, st: 1 + Math.floor(i / 2) })).filter(x => x.a[3](S)).sort((x, y) => y.st - x.st), open = 2 + (S.dc3 ? 1 : 0);
  const slot = i => earned[i] ? `<div class="dcc"><div class="dct">${lg(earned[i].a[1], earned[i].a[2])}</div>${trophy(earned[i].st > 3 ? '#e0a21a' : '#4a4752')}${stars(earned[i].st)}</div>`
    : `<div class="dcc empty"><div class="dct">${T('emptyslot')}</div>${trophy('#c8c3d0')}</div>`;
  o += `<div class="card kc"><h2>${T('dcase')}</h2><div class="dcg">${Array.from({ length: open }, (_, i) => slot(i)).join('')}${S.dc3 ? '' : `<button class="dcc lockd" data-a="dcunlock" ${S.btn < 50 ? 'disabled' : ''}>${ic('lock')}<b>${T('unlockslot')} 50 ${GB}</b></button>`}</div></div>`;
  // --- kontrak terbuka ---
  const ct = S.dp.ct;
  o += `<div class="card kc"><h2>${T('openct')}</h2>${ct.length ? ct.map(c => `<div class="row"><span>${ic(D.products[c.p].icon)}${c.n}× ${T(c.p)} · Q≥${c.q}</span><b>${fmt(c.pr)}/${T('unit')}</b></div>`).join('') + `<div class="row"><button class="lnk" data-a="go:ct">${ic('cart')}${T('toexch')}</button></div>` : `<div class="mute">${T('noct')}</div>`}</div>`;
  // --- sertifikat veteran ---
  o += `<div class="card kc"><h2>${T('certs')} · ${age} ${T('days')}</h2><div class="certg">${CERT.map(([d, k]) => `<div class="cert ${age >= d ? 'on' : ''}">${ic('star')}<small>${T('cert')}</small><b>${T(k)}</b><span>${age >= d ? '✓' : `${age}/${d} ${T('days')}`}</span></div>`).join('')}</div></div>`;
  return o; };

export const actions = {
  pedit: () => { ed = !ed; },
  pcopy: () => { const S = G.S, txt = `${S.name} · Lv${S.level} · FashionGame`; try { navigator.clipboard.writeText(txt); toasts.push({ txt: T('copied'), t: now() }); } catch {} },
  dcunlock: () => { const S = G.S; if (S.dc3 || S.btn < 50) return; S.btn -= 50; S.dc3 = 1; }
};
