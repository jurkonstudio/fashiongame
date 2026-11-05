// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// v22: logika ekonomi ala Sim Companies: fase ekonomi, kejenuhan pasar, overhead admin, bursa/kontrak, eksekutif.
// Memakai pola yang sama dengan depth.js (membungkus MOD) supaya state.js tetap kecil.
import './depth.js?v=28';   // depth.js mengisi MOD.dem/MOD.mat lebih dulu; econ membungkusnya
import { D, PHASES, PHASE_TRANS, PHASE_DAYS, SAT, EXCH, EXEC, EXEC_LVL, EXEC_LIFE, POACH, ADMIN, DAY_SEC, TIME_SCALE, WAGE, RENT_HOUR, POWER_HOUR, TAX, CASH, ORD, BOND, SCRAP_REFUND } from './data.js?v=28';
import { T, fmt } from './i18n.js?v=28';
import { ic } from './icons.js?v=28';
import { G, MOD, now, dur, mm, day, pay, accrue, income, settle as payDue, toasts, xAct, adminRaw, adminPct, satTotal, satFactor, exchRef, whCap, whUsed, CH, unitCost, demand } from './state.js?v=28';

const EXN = { coo: 'Bayu Anggara', cfo: 'Sinta Maheswari', cmo: 'Dimas Kurnia', cto: 'Laras Prameswari' };   // tokoh fiktif
const ph = () => PHASES[(G.S.eco || {}).ph || 'normal'];
const rnd = a => (Math.random() * 2 - 1) * a, clamp = (a, b, v) => Math.min(b, Math.max(a, v));
const week = () => Math.floor(day() / PHASE_DAYS);
const toast = txt => toasts.push({ txt, t: now() });

// --- pengait ke rumus permintaan & harga (state.js memanggil MOD) ---
const d0 = MOD.dem, m0 = MOD.mat;
MOD.dem = (id, ch) => d0() * ph().dem * (id ? satFactor(id) : 1);   // fase x kejenuhan
MOD.mat = m => m0(m) * ph().mat;
MOD.px = () => ph().px;

const roll = cur => { let r = Math.random(); for (const [k, p] of Object.entries(PHASE_TRANS[cur])) { if ((r -= p) < 0) return k; } return cur; };

function hourly(S, E) {
  for (const id in D.products) {
    S.sat[id] = (S.sat[id] || 0) * SAT.decay; if (S.sat[id] < 0.005) S.sat[id] = 0;                    // jualanmu pulih
    E.rv[id] = clamp(0, 1, (E.rv[id] || 0) * SAT.decay + Math.random() * SAT.rival);                 // pesaing (NPC) menjual terus
    const x = E.xi[id] ?? 1; E.xi[id] = clamp(0.6, 1.4, x + 0.3 * (ph().px - x) + rnd(0.04));         // indeks bursa: tarik ke harga fase
  }
  fillOrders(S, E);
  const B = S.bd; if (B) B.inv = B.inv.filter(b => Math.random() >= b.risk / BOND.dayH || (toast(`${T('bd_default')}: ${b.who}`), false));   // peminjam gagal bayar
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
  for (const r in S.ex) { const e = S.ex[r]; if (!e) continue; if (e.end <= t) { S.ex[r] = null; toast(`${T(r)} · ${T('ex_retire')}`); } else accrue(EXEC[r].sal * h, 'exec'); }
  const free = CASH.free * S.b.office; if (S.money > free) { const tx = (S.money - free) * CASH.rate * h * (1 - EXEC.cfo.cash * xAct('cfo')); accrue(tx, 'ctax'); }   // pajak kas menganggur
  bondTick(S, t, h);
}

export const banner = () => { const E = G.S.eco; if (!E) return ''; const left = G.S.t0 + (E.wk + 1) * PHASE_DAYS * dur(DAY_SEC) - now();
  return `<div class="evbar"><span class="tag ${E.ph === 'recession' ? 'bad' : E.ph === 'boom' ? 'ok' : ''}">${ic('chart')}${T('ph_' + E.ph)} · ${mm(left)}</span></div>`; };


// --- v23: order book bursa (jual dengan harga limit, antre dari termurah) ---
const LAD = [0.97, 1, 1.03, 1.06, 1.1];
const settle = (S, E, o, f) => { const rev = f * o.price, tx = rev * TAX, fee = rev * EXCH.fee + f * EXCH.ship;
  S.money += rev - tx - fee; S.led.rev += rev; S.led.tax += tx; S.led.fee = (S.led.fee || 0) + fee; S.sold += f; payDue();
  E.xi[o.id] = Math.max(0.6, (E.xi[o.id] ?? 1) * (1 - f / EXCH.depth)); };
function fillOrders(S, E) { const O = S.ord || []; if (!O.length) return;
  for (const id of new Set(O.map(o => o.id))) {
    const mine = O.filter(o => o.id === id && o.n > 0), ref = exchRef(id, 2), V = D.products[id].batch * ORD.volMul * ph().dem;
    const rows = LAD.map(m => ({ p: ref * m, n: V * ORD.rival / LAD.length, o: null })).concat(mine.map(o => ({ p: o.price, n: o.n, o })));
    rows.sort((a, b) => a.p - b.p || (a.o ? 1 : 0) - (b.o ? 1 : 0));   // termurah dulu; harga sama: pesaing dulu
    let left = V;
    for (const r of rows) { if (left <= 0) break; const take = Math.min(r.n, left); left -= take;
      if (r.o) { r.o.fr = (r.o.fr || 0) + take; const f = Math.min(r.o.n, Math.floor(r.o.fr)); if (f > 0) { r.o.fr -= f; r.o.n -= f; r.o.done = (r.o.done || 0) + f; settle(S, E, r.o, f); } } } }
  S.ord = O.filter(o => o.n > 0); }

// --- v23: obligasi ---
const ISS = [['Benang Emas', 0.005, 0.0002], ['Kain Nusantara', 0.0053, 0.0008], ['Sepatu Jaya', 0.0057, 0.002], ['Mode Kita', 0.006, 0.004]];   // penerbit NPC: nama, bunga/hari, risiko gagal bayar/hari
const bd = () => (G.S.bd = G.S.bd || { out: [], inv: [], k: 1, r: 0.0055 });
export const bondsOut = () => bd().out.filter(b => b.sold).reduce((a, b) => a + b.nom, 0);
export const bondsInv = () => bd().inv.reduce((a, b) => a + b.nom, 0);
const waitH = r => (BOND.waitMax - (r - BOND.min) / (BOND.max - BOND.min) * (BOND.waitMax - BOND.waitMin)) * (G.S.eco && G.S.eco.ph === 'recession' ? 1.5 : 1);
function bondTick(S, t, h) { const B = bd();
  for (const b of B.out) { if (!b.sold && b.at <= t) { b.sold = true; S.money += b.nom; toast(`${T('bd_sold')}: ${fmt(b.nom)}`); } if (b.sold) accrue(b.nom * b.rate * h / BOND.dayH, 'bexp'); }
  for (const b of B.inv) { income(b.nom * b.rate * h / BOND.dayH, 'binc'); } }

// --- v23: kalkulator Ensiklopedia (laba bersih per jam menurut kualitas & harga, memakai fase & kejenuhan saat ini) ---
const cal = { id: 'shoes', q: 2, pr: null };
export const calc = () => { const S = G.S, ids = Object.keys(D.products).filter(k => D.products[k].lvl <= S.level); if (!ids.includes(cal.id)) cal.id = ids[0];
  const uc = unitCost(cal.id), pr = cal.pr ?? (S.price[cal.id] || D.products[cal.id].base);
  const rows = ['store', 'online', 'bulk', 'exch', 'contract'].map(k => { const C = CH[k], p = C.fixed ? C.price(cal.id, cal.q) : pr, dm = C.fixed ? 1 : demand(cal.id, pr, cal.q, k),
      sold = Math.floor(C.cap() * dm), net = sold * (p * (1 - TAX - C.fee) - C.ship - uc), h = dur(C.sec()) / 3600000;
    return `<div class="row ${C.ok() ? '' : 'mute'}"><span>${ic(C.icon)}${T('ch_' + k)} <small class="mute">${sold}/${C.cap()} · ${fmt(p)}</small></span><b class="${net >= 0 ? 'pos' : 'neg'}">${net < 0 ? '−' : ''}${fmt(Math.abs(net / h))}${T('perh')}</b></div>`; }).join('');
  return `<div class="card"><h2>${ic('chart')}${T('enc_calc')}</h2><div class="mute">${T('enc_calc_h')} ${T('ph_' + ((S.eco || {}).ph || 'normal'))} · ${T('sat_t')} ${Math.round(satTotal(cal.id) * 100)}%</div>`
    + `<div class="tabs w">${ids.map(k => `<button class="chip ${k === cal.id ? 'on' : ''}" data-a="ecid:${k}">${ic(D.products[k].icon)}<span>${T(k)}</span></button>`).join('')}</div>`
    + `<div class="row"><span>${T('quality')} Q</span><span><button class="b" data-a="ecq:-1">−</button> <b>Q${cal.q}</b> <button class="b" data-a="ecq:1">+</button></span></div>`
    + `<div class="row"><span>${T('pricel')}</span><span><button class="b" data-a="ecp:-1">−</button> <b>${fmt(pr)}</b> <button class="b" data-a="ecp:1">+</button></span></div>`
    + `<div class="row mute"><span>${T('ucost')}</span><span>${fmt(uc)}</span></div>${rows}</div>`; };

// --- v23: runtuhkan bangunan ---
export const scrapValue = t => { let s = 0; for (let l = 1; l <= (G.S.b[t] || 0); l++) s += D.buildings[t].cost * 1.8 ** (l - 1); return Math.round(s * SCRAP_REFUND); };
export const scrapBusy = t => G.S.jobs.some(j => j.id === t && j.k === 'up') || G.S.jobs.some(j => j.k === ({ factory: 'make', store: 'sell', farm: 'grow' })[t]);
export const scrapRow = t => t === 'office' || !G.S.b[t] ? '' : `<div class="row"><span>${T('scrap')} <small class="mute">+${fmt(scrapValue(t))}</small></span><button class="b" data-a="scrap" ${scrapBusy(t) ? 'disabled' : ''}>${T('scrap')}</button></div>`;

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
let xq = 2;   // filter kualitas bursa (Q1-Q7)
export const xAsk = (id, q = xq) => exchRef(id, q) * (1 + EXCH.spread / 2);
export const exchPanel = () => { const S = G.S, lock = S.level < EXCH.lvl, free = whCap() - whUsed();
  return `<div class="card"><h2>${ic('chart')}${T('xc_t')}</h2><div class="mute">${T('xc_hint')}</div>${lock ? `<div class="mute">${ic('lock')}${T('need_exch')}</div>` : ''}<div class="row mute"><span>${T('xc_free')}</span><span>${free}</span></div><div class=\"row\"><span>${T('quality')}</span><span><button class=\"b\" data-a=\"xq:-1\" ${xq <= 1 ? 'disabled' : ''}>−</button> <b>Q${xq}</b> <button class=\"b\" data-a=\"xq:1\" ${xq >= 7 ? 'disabled' : ''}>+</button></span></div></div>`
    + Object.entries(D.products).filter(([, p]) => p.lvl <= S.level).map(([id, p]) => { const a = xAsk(id), unit = a * (1 + EXCH.fee) + EXCH.ship, xi = ((S.eco || {}).xi || {})[id] ?? 1;
      return `<div class="card"><div class="row"><span>${ic(p.icon)}${T(id)}</span><b>${fmt(a)}</b></div><div class="row mute"><span>${T('xc_idx')} ${Math.round(xi * 100)}% · ${T('xc_all')} ${fmt(unit)}/${T('unit')}</span><span>${T('stock')} ${S.stock[id] || 0}</span></div>`
        + `<div class="row">${[10, 50].map(n => `<button class="b" data-a="xbuy:${id},${n}" ${lock || S.money < unit * n || free < n ? 'disabled' : ''}>${T('buy')} ${n}</button>`).join('')}</div></div>`; }).join(''); };


// --- Pasar > Barang jadi: order book jual ---
const opx = id => G.S.opx && G.S.opx[id] || +(exchRef(id, 2)).toFixed(2);
export const orderPanel = () => { const S = G.S, lock = S.level < EXCH.lvl, O = S.ord || [];
  const sell = Object.entries(D.products).filter(([k, p]) => p.lvl <= S.level && (S.stock[k] || 0) > 0).map(([id, p]) => { const ref = exchRef(id, 2), pr = opx(id), V = p.batch * ORD.volMul * ph().dem;
    return `<div class="card"><div class="row"><span>${ic(p.icon)}${T(id)} · ${T('stock')} ${S.stock[id]}</span><span class="mute">${T('xc_ref')} ${fmt(ref)}</span></div>`
      + `<div class="row"><span><button class="b" data-a="opx:${id},-1">−</button> <b>${fmt(pr)}</b> <button class="b" data-a="opx:${id},1">+</button></span><span class="mute">${T('ord_vol')} ${Math.round(V)}/${T('perh').slice(1)}</span></div>`
      + `<div class="row">${[10, 50, 'all'].map(n => `<button class="b" data-a="ord:${id},${n}" ${lock || O.length >= ORD.max ? 'disabled' : ''}>${T('sell')} ${n === 'all' ? T('maxq') : n}</button>`).join('')}</div></div>`; }).join('');
  return `<div class="card"><h2>${ic('cart')}${T('ord_t')}</h2><div class="mute">${T('ord_hint')}</div></div>` + sell
    + (O.length ? `<div class="card"><h2>${T('ord_open')}</h2>${O.map((o, i) => `<div class="row"><span>${ic(D.products[o.id].icon)}${o.n}/${o.n + (o.done || 0)} × ${T(o.id)} @ ${fmt(o.price)}</span><button class="b" data-a="ocan:${i}">${T('cancel')}</button></div>`).join('')}</div>` : ''); };

// --- Keuangan > Obligasi ---
export const bondsPanel = () => { const S = G.S, B = bd(), t = now(), lock = S.level < BOND.lvl, nom = B.k * BOND.step, cap = BOND.cap * S.b.office, used = B.out.reduce((a, b) => a + b.nom, 0);
  return `<div class="card"><h2>${ic('office')}${T('bd_issue')}</h2><div class="mute">${T('bd_hint')}</div>${lock ? `<div class="mute">${ic('lock')}${T('need_exch')}</div>` : ''}`
    + `<div class="row"><span>${T('bd_nom')}</span><span><button class="b" data-a="bnom:-1">−</button> <b>${fmt(nom)}</b> <button class="b" data-a="bnom:1">+</button></span></div>`
    + `<div class="row"><span>${T('bd_rate')}</span><span><button class="b" data-a="brate:-1">−</button> <b>${(B.r * 100).toFixed(2)}%${T('bd_day')}</b> <button class="b" data-a="brate:1">+</button></span></div>`
    + `<div class="row mute"><span>${T('bd_wait')} ≈ ${waitH(B.r).toFixed(1)}${T('hour').slice(0, 1)} · ${T('bd_cost')} ${fmt(nom * B.r)}${T('bd_day')}</span><span>${fmt(used)}/${fmt(cap)}</span></div>`
    + `<div class="row"><button class="b" data-a="bissue" ${lock || used + nom > cap || B.out.length >= 6 ? 'disabled' : ''}>${T('bd_issue')} · ${fmt(nom)}</button></div></div>`
    + (B.out.length ? `<div class="card"><h2>${T('bd_mine')}</h2>${B.out.map((b, i) => `<div class="row"><span>${fmt(b.nom)} · ${(b.rate * 100).toFixed(2)}%${b.sold ? '' : ` · ${T('bd_wait')} ${mm(b.at - t)}`}</span><button class="b" data-a="brepay:${i}" ${b.sold && S.money < b.nom ? 'disabled' : ''}>${b.sold ? T('repay') : T('cancel')}</button></div>`).join('')}</div>` : '')
    + `<div class="card"><h2>${ic('money')}${T('bd_buy')}</h2>${ISS.map(([n, r, k], i) => `<div class="row"><span>${n} · ${(r * 100).toFixed(2)}%${T('bd_day')}<br><small class="mute">${T('bd_risk')} ${(k * 100).toFixed(2)}%${T('bd_day')}</small></span><button class="b" data-a="bbuy:${i}" ${lock || S.money < BOND.step ? 'disabled' : ''}>${fmt(BOND.step)}</button></div>`).join('')}</div>`
    + (B.inv.length ? `<div class="card"><h2>${T('bd_held')}</h2>${B.inv.map((b, i) => `<div class="row"><span>${b.who} · ${fmt(b.nom)} · ${(b.rate * 100).toFixed(2)}%</span><button class="b" data-a="bsell:${i}">${T('sell')}</button></div>`).join('')}</div>` : ''); };

// --- Profil: eksekutif ---
export const execsCard = () => { const S = G.S, t = now(), lock = S.level < EXEC_LVL;
  return `<div class="card"><h2>${ic('profile')}${T('execs')}</h2>${lock ? `<div class="mute">${ic('lock')}${T('ex_lock')} ${EXEC_LVL}</div>` : ''}`
    + Object.entries(EXEC).map(([r, c]) => { const e = (S.ex || {})[r], on = e && e.end > t;
      return `<div class="row"><span>${T(r)} · ${EXN[r]}<br><small class="mute">${T('fxe_' + r)} · ${fmt(c.sal)}${T('perh')}</small></span>`
        + (on ? `<span class="mute">${mm(e.end - t)} <button class="b" data-a="xfire:${r}">${T('ex_fire')}</button></span>` : `<button class="b" data-a="xhire:${r}" ${lock || S.money < c.hire ? 'disabled' : ''}>${T('hire')} · ${fmt(c.hire)}</button>`) + `</div>`; }).join('') + `</div>`; };

export const retailStats = () => { const S = G.S;
  return `<div class="card"><h2>${ic('chart')}${T('st_t')}</h2><div class="row mute"><span>${T('st_dem')}</span><span>${Math.round(ph().dem * 100)}%</span></div>`
    + Object.entries(D.products).filter(([, p]) => p.lvl <= S.level).map(([id, p]) => { const xi = ((S.eco || {}).xi || {})[id] ?? 1, s = satTotal(id);
      return `<div class="row"><span>${ic(p.icon)}${T(id)}</span><span class="mute">Q${xq} ${fmt(exchRef(id, xq))} · ${T('xc_idx')} ${Math.round(xi * 100)}% · ${T('st_sat')} ${Math.round(s * 100)}%</span></div>`; }).join('') + `<div class="mute">${T('st_hint')}</div></div>`; };
export const actions = {
  xq: d => { xq = clamp(1, 7, xq + +d); },
  xhire: r => { const S = G.S, c = EXEC[r]; if (!c || S.level < EXEC_LVL || xAct(r) || S.money < c.hire) return;
    S.money -= c.hire; S.led.exec = (S.led.exec || 0) + c.hire; S.ex = S.ex || {};
    S.ex[r] = { st: now(), end: now() + dur(DAY_SEC * (EXEC_LIFE[0] + Math.random() * (EXEC_LIFE[1] - EXEC_LIFE[0]))) }; },
  xfire: r => { if (G.S.ex) G.S.ex[r] = null; },
  opx: s => { const [id, d] = s.split(','), S = G.S; S.opx = S.opx || {}; S.opx[id] = Math.max(1, +(opx(id) + +d * Math.max(0.5, exchRef(id, 2) * 0.02)).toFixed(2)); },
  ord: s => { const [id, k] = s.split(','), S = G.S, have = S.stock[id] || 0, n = k === 'all' ? have : Math.min(have, Math.floor(+k)); S.ord = S.ord || [];
    if (!D.products[id] || n <= 0 || S.level < EXCH.lvl || S.ord.length >= ORD.max) return;
    S.stock[id] -= n; S.ord.push({ id, n, price: opx(id), q: S.sq[id] || 2, st: now(), fr: 0, done: 0 }); },
  ocan: i => { const S = G.S, o = (S.ord || [])[+i]; if (!o) return; S.stock[o.id] = (S.stock[o.id] || 0) + o.n; S.ord.splice(+i, 1); },
  bnom: d => { const B = bd(); B.k = clamp(1, 10, B.k + +d); },
  brate: d => { const B = bd(); B.r = clamp(BOND.min, BOND.max, +(B.r + +d * 0.0005).toFixed(4)); },
  bissue: () => { const S = G.S, B = bd(), nom = B.k * BOND.step, used = B.out.reduce((a, b) => a + b.nom, 0); if (S.level < BOND.lvl || used + nom > BOND.cap * S.b.office || B.out.length >= 6) return;
    B.out.push({ nom, rate: B.r, at: now() + dur(3600 * waitH(B.r)), sold: false }); },
  brepay: i => { const S = G.S, B = bd(), b = B.out[+i]; if (!b) return; if (b.sold) { if (S.money < b.nom) return; S.money -= b.nom; } B.out.splice(+i, 1); },
  bbuy: i => { const S = G.S, B = bd(), o = ISS[+i]; if (!o || S.level < BOND.lvl || S.money < BOND.step) return; S.money -= BOND.step; B.inv.push({ nom: BOND.step, rate: o[1], risk: o[2], who: o[0] }); },
  bsell: i => { const S = G.S, B = bd(), b = B.inv[+i]; if (!b) return; S.money += b.nom * BOND.sellback; B.inv.splice(+i, 1); },
  ecid: k => { cal.id = k; cal.pr = null; },
  ecq: d => { cal.q = clamp(1, 7, cal.q + +d); },
  ecp: d => { const S = G.S; cal.pr = Math.max(1, (cal.pr ?? (S.price[cal.id] || D.products[cal.id].base)) + +d); },
  xbuy: s => { const [id, k] = s.split(','), n = Math.floor(+k), S = G.S;
    if (!D.products[id] || !(n > 0) || S.level < EXCH.lvl || D.products[id].lvl > S.level || whCap() - whUsed() < n) return;
    const a = xAsk(id), fee = n * (a * EXCH.fee + EXCH.ship), tot = n * a + fee; if (S.money < tot) return;
    S.money -= tot; S.led.mat += n * a; S.led.fee = (S.led.fee || 0) + fee;
    const st = S.stock[id] || 0; S.sq[id] = ((S.sq[id] || 0) * st + xq * n) / (st + n); S.stock[id] = st + n;   // barang bursa berkualitas sesuai filter
    const E = S.eco; if (E) E.xi[id] = Math.min(1.4, (E.xi[id] ?? 1) * (1 + n / EXCH.depth)); }
};
