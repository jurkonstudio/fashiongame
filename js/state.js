// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { ic } from './icons.js?v=24';
import { T, fmt } from './i18n.js?v=24';
import { D, XP, BTN, QR, SCI, SUP, SEG, SEASONS, ADMIN, SAT, EXCH, CONTRACT, QRC, EXEC, WAGE, DAY_SEC, WH_BASE, WH_PER, START_MONEY, CASH_SETTLE, SLOTS, WH_BLD, TIME_SCALE, SALE_HOURS, BASE_CAP, TAX, RENT_HOUR, POWER_HOUR, LOAN_RATE } from './data.js?v=24';
export const MOD = { dem: () => 1, mat: () => 1, px: () => 1 };   // diisi depth.js (peristiwa, pemasaran)
export const G = { S: null, sup: 'std' };           // state aktif + supplier terpilih
export const toasts = [];
const toast = txt => { toasts.push({ txt, t: now() }); if (toasts.length > 20) toasts.shift(); };
let OFF = 0;                                   // selisih jam server Supabase - jam perangkat
export const setOffset = o => { OFF = o; };
export const now = () => Date.now() + OFF;     // semua timer pakai waktu server
export const dur = sec => sec * 1000 / TIME_SCALE;
export const fresh = () => ({ money: START_MONEY, level: 1, xp: 0, mat: {}, stock: {}, made: 0, sold: 0,
  b: { factory: 0, office: 1, store: 0, farm: 0 }, jobs: [], workers: 1, research: [], price: { shoes: 40 }, last: now(), lang: 'en',
  mk: { t: now(), fx: 1, idx: { leather: 1, rubber: 1, thread: 1, fabric: 1, cotton: 1, hide: 1, latex: 1, dye: 1 } }, mc: {}, mq: {}, sq: {}, loan: 0, due: 0,
  led: { rev: 0, tax: 0, mat: 0, wage: 0, power: 0, rent: 0, int: 0, fee: 0, maint: 0 },
  sp: 0, rq: {}, rqSpent: 0, wk: [1], cond: 1, rep: 10, scrap: 0, t0: now(),
  land: { slots: Array.from({ length: SLOTS }, (_, i) => ({ own: i < 3, t: i === 0 ? 'office' : null })) }, btn: 0, name: 'My Fashion Co.', desc: '', notes: '', dp: { ev: null, evAt: 0, camp: null, ct: [], ctAt: 0 }, cur: 'usd', pref: { n1: 1, n2: 1, n3: 1 } });

export const mm = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s % 60).padStart(2, '0'); };

// --- pasar & bahan ---
export const itemDef = id => D.products[id] || D.craft[id];
export const matPrice = (m, sup = G.sup) => D.materials[m].price * (G.S.mk.idx[m] ?? 1) * (D.materials[m].imp ? G.S.mk.fx : 1) * SUP[sup].mult * MOD.mat(m);
export const buyMat = (m, n, sup = G.sup) => { const S = G.S, c = matPrice(m, sup) * n; if (n <= 0 || S.money < c) return false;
  S.money -= c; const o = S.mat[m] || 0, t = o + n;
  S.mc[m] = ((S.mc[m] || 0) * o + c) / t; S.mq[m] = ((S.mq[m] || 0) * o + SUP[sup].q * n) / t; S.mat[m] = t; return true; };
export const shortfall = id => { let cost = 0; const miss = {};
  for (const [m, n] of Object.entries(itemDef(id).recipe)) { const k = Math.max(0, n - (G.S.mat[m] || 0)); if (k) { miss[m] = k; cost += k * matPrice(m); } }
  return { cost, miss }; };
export const qBonus = id => D.products[id] ? ((G.S.rq || {})[id] || 0) * QR.bonus : 0;   // bonus kualitas dari riset
export const useBatch = id => { const S = G.S; let cost = 0, q = 0, u = 0;       // pakai bahan stok, hitung HPP + kualitas
  for (const [m, n] of Object.entries(itemDef(id).recipe)) { cost += n * (S.mc[m] || 0); q += n * (S.mq[m] || 1); u += n; S.mat[m] -= n; }
  S.led.mat += cost; return { cost, q: Math.min(5, q / u + qBonus(id)) }; };

// --- rumus ---
export const unitCost = id => { const p = itemDef(id), S = G.S; return Object.entries(p.recipe).reduce((a, [m, n]) => a + n * (S.mc[m] || matPrice(m)), 0) / p.batch; };
export const qm = q => 0.6 + 0.2 * q;                                             // pengali harga acuan dari kualitas
export const demand = (id, price, q = 2, ch = 'store') => {       // 3 segmen pasar x pesaing x musim x channel
  const b = D.products[id].base, rp = Math.min(1, G.S.rep / 50), f = r => Math.min(1, (r / price) ** 2);
  const d = SEG.hemat * Math.min(1, (b * 0.85 / price) ** 2.5) + SEG.mid * f(b * qm(q)) + SEG.prem * f(b * 1.5 * q / 3) * rp;
  const cf = Math.min(1.2, Math.max(0.5, (compPrice(id) / price) ** 0.6));
  return Math.min(1, d * cf * season(id, ch) * CH[ch].dm * MOD.dem(id, ch)); };
export const workerSpeed = () => 1 - Math.min(0.5, G.S.wk.reduce((a, k) => a + k, 0) * 0.04);
export const factoryMult = () => workerSpeed() * 0.9 ** (G.S.b.factory - 1) * (1 + (1 - G.S.cond) * 0.3) * (G.S.sold ? 1 : 0.1);   // produksi pertama 10x lebih cepat (tutorial)
export const saleSec = () => SALE_HOURS * 3600 * 0.85 ** (G.S.b.store - 1) * (1 - EXEC.cmo.spd * xAct('cmo')) * (G.S.sold ? 1 : 1 / 60);   // penjualan pertama ~2 menit (tutorial)
export const saleCap = () => BASE_CAP * G.S.b.store;
export const bMax = () => 2 + G.S.level;
export const upCost = id => Math.round(D.buildings[id].cost * 1.8 ** (G.S.b[id] - 1));
export const upSec = id => D.buildings[id].time * G.S.b[id];
export const busy = (k, id) => G.S.jobs.some(j => j.k === k && j.id === id);
export const count = k => G.S.jobs.filter(j => j.k === k).length;
export const job = (k, id) => { const j = G.S.jobs.find(j => j.k === k && j.id === id); return j ? `<div class="mute">${ic('timer')}${mm(j.end - now())}</div>` : ''; };

export const pay = (c, k) => { const S = G.S; if (S.money >= c) S.money -= c; else { S.loan += c - S.money; S.money = 0; } S.led[k] = (S.led[k] || 0) + c; };   // kurang kas -> jadi pinjaman
export const accrue = (c, k) => { const S = G.S; if (!CASH_SETTLE) return pay(c, k); S.led[k] = (S.led[k] || 0) + c; S.due = (S.due || 0) + c; };   // biaya berjalan: dicatat di laporan, tapi kas baru berkurang saat settle
export const income = (c, k) => { const S = G.S; if (!CASH_SETTLE) { S.money += c; } else S.due = (S.due || 0) - c; S.led[k] = (S.led[k] || 0) + c; };   // pemasukan berjalan (bunga obligasi): ikut ditampung
export const settle = () => { const S = G.S, d = S.due || 0; if (!d) return; S.due = 0;   // progres terjadi -> lunasi tagihan bersih
  if (d < 0) S.money -= d; else if (S.money >= d) S.money -= d; else { S.loan += d - S.money; S.money = 0; } };
export const fx = o => { const S = G.S, t = now(); S.fx = (S.fx || []).filter(e => t - e.t < 30000); S.fx.push({ ...o, t }); (S.lg = S.lg || []).unshift({ ...o, t }); S.lg.length = Math.min(S.lg.length, 40); };
const rnd = a => (Math.random() * 2 - 1) * a;
function stepMarket() { const k = G.S.mk;
  for (const m in D.materials) { const v = k.idx[m] ?? 1; k.idx[m] = Math.min(1.5, Math.max(0.7, v + 0.3 * (1 - v) + rnd(0.08))); }
  k.fx = Math.min(1.2, Math.max(0.9, k.fx + 0.2 * (1 - k.fx) + rnd(0.03))); }

export function tick() {
  const S = G.S, t = now(), t0 = S.last, h = Math.max(0, (t - S.last) / 1000 * TIME_SCALE / 3600); S.last = t;
  let n = 0; while (t - S.mk.t >= dur(3600)) { S.mk.t += dur(3600); if (n++ < 48) stepMarket(); }
  S.workers = S.wk.length;
  const w = S.b.factory ? S.wk.reduce((a, k) => a + WAGE[k], 0) * h : 0, rt = RENT_HOUR * Object.values(S.b).reduce((a, n) => a + n, 0) * h, pw = (count('make') ? POWER_HOUR : POWER_HOUR / 6) * S.b.factory * h;
  accrue(w, 'wage'); accrue(rt, 'rent'); accrue(pw, 'power'); accrue((w + rt + pw) * adminPct(), 'adm');   // overhead admin (v22)
  S.sp = (S.sp || 0) + SCI.office * S.b.office * h;
  const i = S.loan * LOAN_RATE * h * (1 - EXEC.cfo.int * xAct('cfo')); S.loan += i; S.led.int += i;
  // XP: 12/jam untuk tiap bangunan yang sedang bekerja (Pabrik: produksi, Toko: jual, Kebun: panen). Dihitung dari tumpang-tindih waktu job dengan selang tick, jadi tetap adil saat game ditinggal.
  for (const k of ['make', 'sell', 'grow']) { let ov = 0;
    for (const j of S.jobs) if (j.k === k) ov = Math.max(ov, Math.min(t, j.end) - Math.max(t0, j.st || t0));
    if (ov > 0) S.xp = (S.xp || 0) + XP.active * ov / 1000 * TIME_SCALE / 3600; }
  const nJobs = S.jobs.length;
  S.jobs = S.jobs.filter(j => {
    if (j.end > t) return true;
    if (j.k === 'grow') { const o = S.mat[j.id] || 0, t2 = o + j.n;   // panen Kebun masuk stok bahan
      S.mc[j.id] = ((S.mc[j.id] || 0) * o + j.c) / t2; S.mq[j.id] = ((S.mq[j.id] || 0) * o + 2 * j.n) / t2; S.mat[j.id] = t2;
      fx({ b: 'farm', id: j.id, n: j.n }); toast(`${T('done')}: ${j.n} × ${T(j.id)}`); return false; }
    if (j.k === 'make' && D.craft[j.id]) { const o = S.mat[j.id] || 0, t2 = o + j.n;   // bahan baku hasil Pabrik masuk stok bahan
      S.mc[j.id] = ((S.mc[j.id] || 0) * o + (j.c || 0)) / t2; S.mq[j.id] = ((S.mq[j.id] || 0) * o + j.q * j.n) / t2; S.mat[j.id] = t2;
      S.cond = Math.max(0, S.cond - 0.02); S.btn += BTN.make; S.sp += SCI.make; fx({ b: 'factory', id: j.id, n: j.n }); toast(`${T('done')}: ${j.n} × ${T(j.id)}`); return false; }
    if (j.k === 'make') { let good = 0; const dr = defectRate(j.q);
      for (let i = 0; i < j.n; i++) if (Math.random() >= dr) good++;
      S.scrap += j.n - good; if (good) { S.sp += SCI.make; S.btn += BTN.make; toast(`+${BTN.make} ◉ ${T('btn')}`); } toast(`${T('done')}: ${good}/${j.n} × ${T(j.id)}`); S.cond = Math.max(0, S.cond - 0.03);
      if (good) fx({ b: 'factory', id: j.id, n: good });
      if (good) { const st = S.stock[j.id] || 0; S.sq[j.id] = ((S.sq[j.id] || 0) * st + j.q * good) / (st + good); S.stock[j.id] = st + good; S.made += good; } }
    if (j.k === 'sell') { const c = CH[j.ch || 'store'], s = c.fixed ? j.n : Math.floor(j.n * demand(j.id, j.price, j.q, j.ch || 'store')),
        rev = s * j.price, tx = rev * TAX, fee = rev * c.fee + s * c.ship;
      (S.dp.log = S.dp.log || []).unshift({ t, id: j.id, ch: j.ch || 'store', n: j.n, s, pr: j.price, net: rev - tx - fee }); S.dp.log.length = Math.min(S.dp.log.length, 30);
      S.sold += s; if (c.hit) c.hit(j.id, s); else addSat(j.id, s); S.sp += s * SCI.sell; if (s > 0) { S.btn += BTN.sell; toast(`+${BTN.sell} ◉ ${T('btn')}`); } toast(`${T('sold')} ${s} ${T(j.id)} · +${fmt(rev - tx - fee)}`); S.money += rev - tx - fee; S.led.rev += rev; S.led.tax += tx; S.led.fee = (S.led.fee || 0) + fee;
      if (s > 0) fx({ b: 'store', id: j.id, n: s, m: rev - tx - fee });
      S.rep = Math.min(100, Math.max(0, S.rep + s * (0.05 + (j.q - 2) * 0.15))); S.stock[j.id] = (S.stock[j.id] || 0) + j.n - s; }
    if (j.k === 'up') { const hh = (j.st ? (j.end - j.st) / 1000 * TIME_SCALE : upSec(j.id)) / 3600; S.xp = (S.xp || 0) + hh * (S.b[j.id] === 0 ? XP.build : XP.up); S.b[j.id]++; toast(`${T('done')}: ${T(j.id)} Lv${S.b[j.id]}`); }
    if (j.k === 'res') S.research.push(j.id);
    if (j.k === 'qr') { const n0 = S.rq[j.id] || 0;   // riset kualitas berbasis peluang (v22)
      if (Math.random() < qrChance(n0)) { S.rq[j.id] = n0 + 1; toast(`${T('done')}: ${T(j.id)} ★${S.rq[j.id]}`); }
      else { const back = Math.round(QR.sp[n0] * QRC.refund); S.sp += back; toast(`${T('qr_fail')}: ${T(j.id)} · +${back} SP`); } }
    return false;
  });
  if (S.jobs.length < nJobs) settle();   // ada pekerjaan selesai = progres
}

// --- Tahap B: kalender, pesaing, channel, gudang, mesin, cacat ---
export const day = () => Math.floor((now() - G.S.t0) / dur(DAY_SEC));
export const month = () => Math.floor(day() / 30) % 12;
export const season = (id, ch) => SEASONS.filter(s => s.m === month() && (!s.only || s.only === id) && (!s.ch || s.ch === ch)).reduce((a, s) => a * s.x, 1);
export const compPrice = id => D.products[id].base * (1 + 0.12 * Math.sin(day() / 20 + id.length));
// --- v22: eksekutif, overhead admin, kejenuhan, bursa ---
export const xAct = r => { const e = ((G.S && G.S.ex) || {})[r]; return e && e.end > now() ? 1 : 0; };   // eksekutif aktif = 1
export const adminRaw = () => Math.min(ADMIN.max, Math.max(0, Object.values(G.S.b).reduce((a, n) => a + n, 0) - ADMIN.free) * ADMIN.per);
export const adminPct = () => adminRaw() * (1 - EXEC.coo.adm * xAct('coo'));
export const qrChance = n => Math.min(0.95, QRC.base[n] + EXEC.cto.qr * xAct('cto'));
export const satTotal = id => Math.min(1.5, ((G.S.sat || {})[id] || 0) + (((G.S.eco || {}).rv || {})[id] || 0));   // jualanmu + pesaing
export const satFactor = id => 1 - SAT.max * Math.min(1, satTotal(id));
const addSat = (id, n) => { const S = G.S; S.sat = S.sat || {}; S.sat[id] = (S.sat[id] || 0) + n / SAT.depth; };
export const exchRef = (id, q = 2) => D.products[id].base * qm(q) * (((G.S.eco || {}).xi || {})[id] ?? 1);   // harga acuan bursa
export const CH = {
  store:  { icon: 'store',   dm: 1,    fee: 0,    ship: 0,   sec: () => saleSec(),      cap: () => saleCap(),                 ok: () => true },
  online: { icon: 'cart',    dm: 1.15, fee: 0.08, ship: 0.8, sec: () => saleSec() * .5, cap: () => Math.round(saleCap() * 1.5), ok: () => G.S.b.office >= 2 },
  bulk:   { fixed: 1, price: (id, q) => bulkPrice(id, q), icon: 'factory', dm: 1,    fee: 0,    ship: 0,   sec: () => saleSec() * 2,  cap: () => saleCap() * 3,             ok: () => G.S.b.store >= 2 },
  exch:   { fixed: 1, price: (id, q) => exchRef(id, q) * (1 - EXCH.spread / 2), hit: (id, n) => { const e = G.S.eco; if (e) { e.xi = e.xi || {}; e.xi[id] = Math.max(0.6, (e.xi[id] ?? 1) * (1 - n / EXCH.depth)); } },
    icon: 'chart', dm: 1, fee: EXCH.fee, ship: EXCH.ship, sec: () => saleSec() * 0.5, cap: () => saleCap() * 2, ok: () => G.S.level >= EXCH.lvl },
  contract: { fixed: 1, price: (id, q) => exchRef(id, q) * (1 - CONTRACT.disc), hit: () => {},
    icon: 'office', dm: 1, fee: 0, ship: EXCH.ship * CONTRACT.shipMul, sec: () => saleSec() * 1.5, cap: () => saleCap() * 2, ok: () => G.S.level >= EXCH.lvl && G.S.b.office >= 2 }
};
export const bulkPrice = (id, q = 2) => D.products[id].base * qm(q) * 0.7 * MOD.px();      // harga grosir tetap, pembeli pasti ada
export const whCap = () => WH_BASE + WH_PER * G.S.b.factory + WH_BLD * (G.S.b.warehouse || 0);
export const whUsed = () => Object.values(G.S.stock).reduce((a, n) => a + n, 0) + G.S.jobs.filter(j => j.k === 'make' && D.products[j.id]).reduce((a, j) => a + j.n, 0);
export const defectRate = q => Math.min(0.4, Math.max(0.01, 0.15 - 0.03 * G.S.wk.reduce((a, k) => a + k, 0) / G.S.wk.length - 0.02 * (q - 1) + (1 - G.S.cond) * 0.15));
export const fixCost = () => Math.round(150 * G.S.b.factory * (1 - G.S.cond));

export const clk = ms => new Date(ms).toLocaleTimeString((G.S.pref || {}).h24 ? 'en-GB' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: !(G.S.pref || {}).h24 });   // jam lokal, 12/24 jam sesuai Pengaturan
