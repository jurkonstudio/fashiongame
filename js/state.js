// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { ic } from './icons.js?v=7';
import { T, fmt } from './i18n.js?v=7';
import { D, SUP, SEG, SEASONS, WAGE, DAY_SEC, WH_BASE, WH_PER, START_MONEY, SLOTS, WH_BLD, TIME_SCALE, SALE_HOURS, BASE_CAP, TAX, RENT_HOUR, POWER_HOUR, LOAN_RATE } from './data.js?v=7';
export const MOD = { dem: () => 1, mat: () => 1 };   // diisi depth.js (peristiwa, pemasaran)
export const G = { S: null, sup: 'std' };           // state aktif + supplier terpilih
export const toasts = [];
const toast = txt => { toasts.push({ txt, t: now() }); if (toasts.length > 20) toasts.shift(); };
let OFF = 0;                                   // selisih jam server Supabase - jam perangkat
export const setOffset = o => { OFF = o; };
export const now = () => Date.now() + OFF;     // semua timer pakai waktu server
export const dur = sec => sec * 1000 / TIME_SCALE;
export const fresh = () => ({ money: START_MONEY, level: 1, mat: {}, stock: {}, made: 0, sold: 0,
  b: { factory: 0, office: 1, store: 0 }, jobs: [], workers: 1, research: [], price: { shoes: 40 }, last: now(), lang: 'en',
  mk: { t: now(), fx: 1, idx: { leather: 1, rubber: 1, thread: 1, fabric: 1 } }, mc: {}, mq: {}, sq: {}, loan: 0,
  led: { rev: 0, tax: 0, mat: 0, wage: 0, power: 0, rent: 0, int: 0, fee: 0, maint: 0 },
  wk: [1], cond: 1, rep: 10, scrap: 0, t0: now(),
  land: { slots: Array.from({ length: SLOTS }, (_, i) => ({ own: i < 3, t: i === 0 ? 'office' : null })) }, name: 'My Fashion Co.', desc: '', notes: '', dp: { ev: null, evAt: 0, camp: null, ct: [], ctAt: 0 }, cur: 'usd', pref: { n1: 1, n2: 1, n3: 1 } });

export const mm = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s % 60).padStart(2, '0'); };

// --- pasar & bahan ---
export const matPrice = (m, sup = G.sup) => D.materials[m].price * G.S.mk.idx[m] * (D.materials[m].imp ? G.S.mk.fx : 1) * SUP[sup].mult * MOD.mat(m);
export const buyMat = (m, n, sup = G.sup) => { const S = G.S, c = matPrice(m, sup) * n; if (n <= 0 || S.money < c) return false;
  S.money -= c; const o = S.mat[m] || 0, t = o + n;
  S.mc[m] = ((S.mc[m] || 0) * o + c) / t; S.mq[m] = ((S.mq[m] || 0) * o + SUP[sup].q * n) / t; S.mat[m] = t; return true; };
export const shortfall = id => { let cost = 0; const miss = {};
  for (const [m, n] of Object.entries(D.products[id].recipe)) { const k = Math.max(0, n - (G.S.mat[m] || 0)); if (k) { miss[m] = k; cost += k * matPrice(m); } }
  return { cost, miss }; };
export const useBatch = id => { const S = G.S; let cost = 0, q = 0, u = 0;       // pakai bahan stok, hitung HPP + kualitas
  for (const [m, n] of Object.entries(D.products[id].recipe)) { cost += n * (S.mc[m] || 0); q += n * (S.mq[m] || 1); u += n; S.mat[m] -= n; }
  S.led.mat += cost; return { cost, q: q / u }; };

// --- rumus ---
export const unitCost = id => { const p = D.products[id], S = G.S; return Object.entries(p.recipe).reduce((a, [m, n]) => a + n * (S.mc[m] || matPrice(m)), 0) / p.batch; };
export const qm = q => 0.7 + 0.15 * q;                                             // pengali harga acuan dari kualitas
export const demand = (id, price, q = 2, ch = 'store') => {       // 3 segmen pasar x pesaing x musim x channel
  const b = D.products[id].base, rp = Math.min(1, G.S.rep / 50), f = r => Math.min(1, (r / price) ** 2);
  const d = SEG.hemat * Math.min(1, (b * 0.85 / price) ** 2.5) + SEG.mid * f(b * qm(q)) + SEG.prem * f(b * 1.5 * q / 3) * rp;
  const cf = Math.min(1.2, Math.max(0.5, (compPrice(id) / price) ** 0.6));
  return Math.min(1, d * cf * season(id, ch) * CH[ch].dm * MOD.dem()); };
export const workerSpeed = () => 1 - Math.min(0.5, G.S.wk.reduce((a, k) => a + k, 0) * 0.04);
export const factoryMult = () => workerSpeed() * 0.9 ** (G.S.b.factory - 1) * (1 + (1 - G.S.cond) * 0.3) * (G.S.sold ? 1 : 0.1);   // produksi pertama 10x lebih cepat (tutorial)
export const saleSec = () => SALE_HOURS * 3600 * 0.85 ** (G.S.b.store - 1) * (G.S.sold ? 1 : 1 / 60);   // penjualan pertama ~2 menit (tutorial)
export const saleCap = () => BASE_CAP * G.S.b.store;
export const bMax = () => 2 + G.S.level;
export const upCost = id => Math.round(D.buildings[id].cost * 1.8 ** (G.S.b[id] - 1));
export const upSec = id => D.buildings[id].time * G.S.b[id];
export const busy = (k, id) => G.S.jobs.some(j => j.k === k && j.id === id);
export const count = k => G.S.jobs.filter(j => j.k === k).length;
export const job = (k, id) => { const j = G.S.jobs.find(j => j.k === k && j.id === id); return j ? `<div class="mute">${ic('timer')}${mm(j.end - now())}</div>` : ''; };

const pay = (c, k) => { const S = G.S; if (S.money >= c) S.money -= c; else { S.loan += c - S.money; S.money = 0; } S.led[k] += c; };   // kurang kas -> jadi pinjaman
const rnd = a => (Math.random() * 2 - 1) * a;
function stepMarket() { const k = G.S.mk;
  for (const m in k.idx) k.idx[m] = Math.min(1.5, Math.max(0.7, k.idx[m] + 0.3 * (1 - k.idx[m]) + rnd(0.08)));
  k.fx = Math.min(1.2, Math.max(0.9, k.fx + 0.2 * (1 - k.fx) + rnd(0.03))); }

export function tick() {
  const S = G.S, t = now(), h = Math.max(0, (t - S.last) / 1000 * TIME_SCALE / 3600); S.last = t;
  let n = 0; while (t - S.mk.t >= dur(3600)) { S.mk.t += dur(3600); if (n++ < 48) stepMarket(); }
  S.workers = S.wk.length; pay(S.b.factory ? S.wk.reduce((a, k) => a + WAGE[k], 0) * h : 0, 'wage');
  pay(RENT_HOUR * Object.values(S.b).reduce((a, n) => a + n, 0) * h, 'rent');
  pay((count('make') ? POWER_HOUR : POWER_HOUR / 6) * S.b.factory * h, 'power');
  const i = S.loan * LOAN_RATE * h; S.loan += i; S.led.int += i;
  S.jobs = S.jobs.filter(j => {
    if (j.end > t) return true;
    if (j.k === 'make') { let good = 0; const dr = defectRate(j.q);
      for (let i = 0; i < j.n; i++) if (Math.random() >= dr) good++;
      S.scrap += j.n - good; toast(`${T('done')}: ${good}/${j.n} × ${T(j.id)}`); S.cond = Math.max(0, S.cond - 0.03);
      if (good) { const st = S.stock[j.id] || 0; S.sq[j.id] = ((S.sq[j.id] || 0) * st + j.q * good) / (st + good); S.stock[j.id] = st + good; S.made += good; } }
    if (j.k === 'sell') { const c = CH[j.ch || 'store'], s = j.ch === 'bulk' ? j.n : Math.floor(j.n * demand(j.id, j.price, j.q, j.ch || 'store')),
        rev = s * j.price, tx = rev * TAX, fee = rev * c.fee + s * c.ship;
      S.sold += s; toast(`${T('sold')} ${s} ${T(j.id)} · +${fmt(rev - tx - fee)}`); S.money += rev - tx - fee; S.led.rev += rev; S.led.tax += tx; S.led.fee = (S.led.fee || 0) + fee;
      S.rep = Math.min(100, Math.max(0, S.rep + s * (0.05 + (j.q - 2) * 0.15))); S.stock[j.id] = (S.stock[j.id] || 0) + j.n - s; }
    if (j.k === 'up') { S.b[j.id]++; toast(`${T('done')}: ${T(j.id)} Lv${S.b[j.id]}`); }
    if (j.k === 'res') S.research.push(j.id);
    return false;
  });
}

// --- Tahap B: kalender, pesaing, channel, gudang, mesin, cacat ---
export const day = () => Math.floor((now() - G.S.t0) / dur(DAY_SEC));
export const month = () => Math.floor(day() / 30) % 12;
export const season = (id, ch) => SEASONS.filter(s => s.m === month() && (!s.only || s.only === id) && (!s.ch || s.ch === ch)).reduce((a, s) => a * s.x, 1);
export const compPrice = id => D.products[id].base * (1 + 0.12 * Math.sin(day() / 20 + id.length));
export const CH = {
  store:  { icon: 'store',   dm: 1,    fee: 0,    ship: 0,   sec: () => saleSec(),      cap: () => saleCap(),                 ok: () => true },
  online: { icon: 'cart',    dm: 1.15, fee: 0.08, ship: 0.8, sec: () => saleSec() * .5, cap: () => Math.round(saleCap() * 1.5), ok: () => G.S.b.office >= 2 },
  bulk:   { icon: 'factory', dm: 1,    fee: 0,    ship: 0,   sec: () => saleSec() * 2,  cap: () => saleCap() * 3,             ok: () => G.S.b.store >= 2 }
};
export const bulkPrice = (id, q = 2) => D.products[id].base * qm(q) * 0.7;      // harga grosir tetap, pembeli pasti ada
export const whCap = () => WH_BASE + WH_PER * G.S.b.factory + WH_BLD * (G.S.b.warehouse || 0);
export const whUsed = () => Object.values(G.S.stock).reduce((a, n) => a + n, 0) + G.S.jobs.filter(j => j.k === 'make').reduce((a, j) => a + j.n, 0);
export const defectRate = q => Math.min(0.4, Math.max(0.01, 0.15 - 0.03 * G.S.wk.reduce((a, k) => a + k, 0) / G.S.wk.length - 0.02 * (q - 1) + (1 - G.S.cond) * 0.15));
export const fixCost = () => Math.round(150 * G.S.b.factory * (1 - G.S.cond));
