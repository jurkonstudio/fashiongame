// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// v22: logika ekonomi ala Sim Companies: fase ekonomi, kejenuhan pasar, overhead admin, bursa/kontrak, eksekutif.
// Memakai pola yang sama dengan depth.js (membungkus MOD) supaya state.js tetap kecil.
import './depth.js?v=22';   // depth.js mengisi MOD.dem/MOD.mat lebih dulu; econ membungkusnya
import { D, PHASES, PHASE_TRANS, PHASE_DAYS, SAT, EXCH, EXEC, EXEC_LVL, EXEC_LIFE, POACH, ADMIN, DAY_SEC, TIME_SCALE, WAGE, RENT_HOUR, POWER_HOUR } from './data.js?v=22';
import { T, fmt } from './i18n.js?v=22';
import { ic } from './icons.js?v=22';
import { G, MOD, now, dur, mm, day, pay, toasts, xAct, adminRaw, adminPct, satTotal, satFactor, exchRef, whCap, whUsed } from './state.js?v=22';

const EXN = { coo: 'Bayu Anggara', cfo: 'Sinta Maheswari', cmo: 'Dimas Kurnia', cto: 'Laras Prameswari' };   // tokoh fiktif
const ph = () => PHASES[(G.S.eco || {}).ph || 'normal'];
const rnd = a => (Math.random() * 2 - 1) * a, clamp = (a, b, v) => Math.min(b, Math.max(a, v));
const week = () => Math.floor(day() / PHASE_DAYS);
const toast = txt => toasts.push({ txt, t: now() });

// --- pengait ke rumus permintaan & harga (state.js memanggil MOD) ---
const d0 = MOD.dem, m0 = MOD.mat;
MOD.dem = (id, ch) => d0() * ph().dem * (id ? satFactor(id) : 1) * (1 + EXEC.cmo.dem * xAct('cmo'));   // fase x kejenuhan x CMO
MOD.mat = m => m0(m) * ph().mat;
MOD.px = () => ph().px;

const roll = cur => { let r = Math.random(); for (const [k, p] of Object.entries(PHASE_TRANS[cur])) { if ((r -= p) < 0) return k; } return cur; };

function hourly(S, E) {
  for (const id in D.products) {
    S.sat[id] = (S.sat[id] || 0) * SAT.decay; if (S.sat[id] < 0.005) S.sat[id] = 0;                    // jualanmu pulih
    E.rv[id] = clamp(0, 1, (E.rv[id] || 0) * SAT.decay + Math.random() * SAT.rival);                 // pesaing (NPC) menjual terus
    const x = E.xi[id] ?? 1; E.xi[id] = clamp(0.6, 1.4, x + 0.3 * (ph().px - x) + rnd(0.04));         // indeks bursa: tarik ke harga fase
  }
  for (const r in S.ex) if (S.ex[r] && Math.random() < POACH) { S.ex[r] = null; toast(`${T(r)} · ${T('ex_poach')}`); }   // eksekutif dibajak
}

export function tick() { const S = G.S; if (!S) return; const t = now();
  const E = S.eco = S.eco || { ph: 'normal', wk: week(), t, last: t, xi: {}, rv: {} };
  E.xi = E.xi || {}; E.rv = E.rv || {}; S.sat = S.sat || {}; S.ex = S.ex || {}; E.last = E.last || t;
  const before = E.ph; let n = 0;
  while (E.wk < week() && n++ < 6) { E.wk++; E.ph = roll(E.ph); }   // undi fase tiap minggu game (tetap jalan walau game ditinggal)
  if (E.wk < week()) E.wk = week();
  if (E.ph !== before) toast(T('ph_' + E.ph));
  let k = 0; while (t - E.t >= dur(3600) && k++ < 48) { E.t += dur(3600); hourly(S, E); }
  if (t - E.t >= dur(3600)) E.t = t;
  const h = Math.max(0, (t - E.last) / 1000 * TIME_SCALE / 3600); E.last = t;   // gaji eksekutif per jam game
  for (const r in S.ex) { const e = S.ex[r]; if (!e) continue; if (e.end <= t) { S.ex[r] = null; toast(`${T(r)} · ${T('ex_retire')}`); } else pay(EXEC[r].sal * h, 'exec'); }
}

export const banner = () => { const E = G.S.eco; if (!E) return ''; const left = G.S.t0 + (E.wk + 1) * PHASE_DAYS * dur(DAY_SEC) - now();
  return `<div class="evbar"><span class="tag ${E.ph === 'recession' ? 'bad' : E.ph === 'boom' ? 'ok' : ''}">${ic('chart')}${T('ph_' + E.ph)} · ${mm(left)}</span></div>`; };

// --- Keuangan > Ekonomi ---
const bar = n => `<div class="bar"><i style="width:${Math.min(100, Math.round(n))}%"></i></div>`;
const row = (a, b, c = '') => `<div class="row"><span>${a}</span><b class="${c}">${b}</b></div>`;
export const panel = () => { const S = G.S, E = S.eco || { ph: 'normal', wk: week() }, P = PHASES[E.ph], left = S.t0 + (E.wk + 1) * PHASE_DAYS * dur(DAY_SEC) - now(),
    lv = Object.values(S.b).reduce((a, n) => a + n, 0), raw = adminRaw(), eff = adminPct(),
    ops = (S.b.factory ? S.wk.reduce((a, k) => a + WAGE[k], 0) : 0) + RENT_HOUR * lv + POWER_HOUR / 6 * S.b.factory,
    pc = v => (v >= 1 ? '+' : '−') + Math.abs(Math.round((v - 1) * 100)) + '%';
  return `<div class="card"><h2>${ic('chart')}${T('phase')}</h2>${row(T('ph_' + E.ph), mm(left), E.ph === 'recession' ? 'neg' : E.ph === 'boom' ? 'pos' : '')}`
    + `<div class="row mute"><span>${T('ph_dem')}</span><span>${pc(P.dem)}</span></div><div class="row mute"><span>${T('ph_mat')}</span><span>${pc(P.mat)}</span></div><div class="row mute"><span>${T('ph_px')}</span><span>${pc(P.px)}</span></div><div class="mute">${T('ph_hint')}</div></div>`
    + `<div class="card"><h2>${ic('office')}${T('admx')}</h2>${row(T('adm_lv'), `${lv} / ${ADMIN.free}`)}${row(T('adm_pct'), '+' + Math.round(eff * 100) + '%', eff > 0 ? 'neg' : '')}`
    + `<div class="row mute"><span>${T('adm_coo')}</span><span>${xAct('coo') ? '−' + Math.round(EXEC.coo.adm * 100) + '%' : '–'} (${Math.round(raw * 100)}% → ${Math.round(eff * 100)}%)</span></div>`
    + `<div class="row mute"><span>${T('adm_cost')}</span><span>${fmt(ops * eff)}${T('perh')}</span></div><div class="mute">${T('adm_hint')}</div></div>`
    + `<div class="card"><h2>${ic('cart')}${T('sat_t')}</h2>${Object.entries(D.products).filter(([, p]) => p.lvl <= S.level).map(([id, p]) => { const s = satTotal(id);
      return `<div class="row"><span>${ic(p.icon)}${T(id)}</span><span class="mute">${Math.round(s * 100)}% · ×${satFactor(id).toFixed(2)}</span></div>${bar(s * 100)}`; }).join('')}<div class="mute">${T('sat_hint')}</div></div>`; };

// --- Pasar > Barang Jadi: beli dari bursa (sisi ritel) ---
export const xAsk = id => exchRef(id, 2) * (1 + EXCH.spread / 2);
export const exchPanel = () => { const S = G.S, lock = S.level < EXCH.lvl, free = whCap() - whUsed();
  return `<div class="card"><h2>${ic('chart')}${T('xc_t')}</h2><div class="mute">${T('xc_hint')}</div>${lock ? `<div class="mute">${ic('lock')}${T('need_exch')}</div>` : ''}<div class="row mute"><span>${T('xc_free')}</span><span>${free}</span></div></div>`
    + Object.entries(D.products).filter(([, p]) => p.lvl <= S.level).map(([id, p]) => { const a = xAsk(id), unit = a * (1 + EXCH.fee) + EXCH.ship, xi = ((S.eco || {}).xi || {})[id] ?? 1;
      return `<div class="card"><div class="row"><span>${ic(p.icon)}${T(id)}</span><b>${fmt(a)}</b></div><div class="row mute"><span>${T('xc_idx')} ${Math.round(xi * 100)}% · ${T('xc_all')} ${fmt(unit)}/${T('unit')}</span><span>${T('stock')} ${S.stock[id] || 0}</span></div>`
        + `<div class="row">${[10, 50].map(n => `<button class="b" data-a="xbuy:${id},${n}" ${lock || S.money < unit * n || free < n ? 'disabled' : ''}>${T('buy')} ${n}</button>`).join('')}</div></div>`; }).join(''); };

// --- Profil: eksekutif ---
export const execsCard = () => { const S = G.S, t = now(), lock = S.level < EXEC_LVL;
  return `<div class="card"><h2>${ic('profile')}${T('execs')}</h2>${lock ? `<div class="mute">${ic('lock')}${T('ex_lock')} ${EXEC_LVL}</div>` : ''}`
    + Object.entries(EXEC).map(([r, c]) => { const e = (S.ex || {})[r], on = e && e.end > t;
      return `<div class="row"><span>${T(r)} · ${EXN[r]}<br><small class="mute">${T('fxe_' + r)} · ${fmt(c.sal)}${T('perh')}</small></span>`
        + (on ? `<span class="mute">${mm(e.end - t)} <button class="b" data-a="xfire:${r}">${T('ex_fire')}</button></span>` : `<button class="b" data-a="xhire:${r}" ${lock || S.money < c.hire ? 'disabled' : ''}>${T('hire')} · ${fmt(c.hire)}</button>`) + `</div>`; }).join('') + `</div>`; };

export const actions = {
  xhire: r => { const S = G.S, c = EXEC[r]; if (!c || S.level < EXEC_LVL || xAct(r) || S.money < c.hire) return;
    S.money -= c.hire; S.led.exec = (S.led.exec || 0) + c.hire; S.ex = S.ex || {};
    S.ex[r] = { st: now(), end: now() + dur(DAY_SEC * (EXEC_LIFE[0] + Math.random() * (EXEC_LIFE[1] - EXEC_LIFE[0]))) }; },
  xfire: r => { if (G.S.ex) G.S.ex[r] = null; },
  xbuy: s => { const [id, k] = s.split(','), n = Math.floor(+k), S = G.S;
    if (!D.products[id] || !(n > 0) || S.level < EXCH.lvl || D.products[id].lvl > S.level || whCap() - whUsed() < n) return;
    const a = xAsk(id), fee = n * (a * EXCH.fee + EXCH.ship), tot = n * a + fee; if (S.money < tot) return;
    S.money -= tot; S.led.mat += n * a; S.led.fee = (S.led.fee || 0) + fee;
    const st = S.stock[id] || 0; S.sq[id] = ((S.sq[id] || 0) * st + 2 * n) / (st + n); S.stock[id] = st + n;   // barang bursa berkualitas Q2
    const E = S.eco; if (E) E.xi[id] = Math.min(1.4, (E.xi[id] ?? 1) * (1 + n / EXCH.depth)); }
};
