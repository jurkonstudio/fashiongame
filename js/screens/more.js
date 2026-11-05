// (c) 2026 FashionGame. Menu samping: Pencapaian, Perpustakaan (resep), Tentang.
import * as econ from '../econ.js?v=22';
import { D, REDEEM, SEG, TAX, BTN } from '../data.js?v=22';
import { T, fmt } from '../i18n.js?v=22';
import { ic } from '../icons.js?v=22';
import { ART } from '../art.js?v=22';
import { G, now, toasts } from '../state.js?v=22';

let sub = 'ach';
export const ACH = [['first', 'Penjualan pertama', 'First sale', S => S.sold >= 1], ['s100', '100 unit terjual', '100 units sold', S => S.sold >= 100], ['s500', '500 unit terjual', '500 units sold', S => S.sold >= 500],
  ['lv3', 'Capai Level 3', 'Reach Level 3', S => S.level >= 3], ['lv4', 'Capai Level 4', 'Reach Level 4', S => S.level >= 4], ['rep50', 'Reputasi 50', 'Reputation 50', S => S.rep >= 50],
  ['team', 'Tim 5 pekerja', 'Team of 5', S => S.wk.length >= 5], ['rich', 'Kas $10.000', 'Cash $10,000', S => S.money >= 10000], ['ct5', '5 kontrak selesai', '5 contracts done', S => (S.dp.cdone || 0) >= 5], ['free', 'Bebas pinjaman', 'Debt free', S => S.sold >= 10 && S.loan <= 0]];
const esc = x => String(x || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const lg = (a, b) => G.S.lang === 'id' ? a : b;
const ENC = [
  ['XP & Level', 'XP & Level', 'Level naik dari XP: bangunan yang sedang bekerja memberi 12 XP/jam, konstruksi baru 36,5 XP/jam, upgrade 36 XP/jam. Kebutuhan XP: 5, 10, 20, 30, 50, 80, 130, 210, 340, 550, lalu terus naik. Level membuka produk baru dan batas upgrade bangunan.', 'Levels rise with XP: working buildings give 12 XP/h, new construction 36.5 XP/h, upgrades 36 XP/h. XP needed: 5, 10, 20, 30, 50, 80, 130, 210, 340, 550, then keeps growing. Levels unlock new products and the building upgrade cap.'],
  ['Kualitas (Q1–Q5)', 'Quality (Q1–Q5)', 'Bahan dari supplier Murah/Standar/Premium menentukan kualitas produk. Riset kualitas menambah +0,5 per level (maks Q5). Kualitas tinggi menaikkan harga acuan dan menurunkan produk cacat.', 'Materials from Cheap/Standard/Premium suppliers set product quality. Quality research adds +0.5 per level (max Q5). Higher quality raises the reference price and lowers defects.'],
  ['Reputasi', 'Reputation', 'Naik saat produk bagus terjual dan kontrak selesai. Reputasi tinggi dibutuhkan untuk menarik pembeli segmen premium.', 'Rises when good products sell and contracts are fulfilled. High reputation is needed to attract premium buyers.'],
  ['Segmen pasar', 'Market segments', `Pembeli terbagi tiga: Hemat ${SEG.hemat * 100}%, Menengah ${SEG.mid * 100}%, Premium ${SEG.prem * 100}%. Harga jual menentukan segmen mana yang mau membeli.`, `Buyers split in three: Budget ${SEG.hemat * 100}%, Mid ${SEG.mid * 100}%, Premium ${SEG.prem * 100}%. Your price decides which segments will buy.`],
  ['Channel penjualan', 'Sales channels', 'Toko: tanpa biaya. Online: permintaan lebih tinggi, biaya 8% + ongkir, butuh Kantor Lv2. Grosir: harga tetap 70% dari acuan, pembeli pasti ada, butuh Toko Lv2.', 'Store: no fee. Online: higher demand, 8% fee + shipping, needs Office Lv2. Wholesale: fixed price at 70% of reference, buyers guaranteed, needs Store Lv2.'],
  ['Musim & peristiwa', 'Seasons & events', 'Lebaran, tahun ajaran baru, Harbolnas, dan akhir tahun menaikkan permintaan. Peristiwa pasar (mogok, diskon, tarif impor, viral) mengubah harga bahan atau permintaan sementara.', 'Eid, back-to-school, online sale and year-end boost demand. Market events (strike, sale, import tariff, viral) temporarily change material prices or demand.'],
  ['Mesin & cacat', 'Machines & defects', 'Setiap produksi menurunkan kondisi mesin. Mesin buruk menambah waktu produksi dan peluang cacat. Lakukan perawatan di Pabrik.', 'Every production run wears the machine down. A worn machine slows production and raises defects. Maintain it in the Factory.'],
  ['Kancing Emas', 'Gold Buttons', `Mata uang premium: bonus login ${BTN.login}, produksi ${BTN.make}, penjualan ${BTN.sell}. Dipakai membeli lahan (${BTN.plot}) dan slot etalase.`, `Premium currency: login bonus ${BTN.login}, production ${BTN.make}, sales ${BTN.sell}. Used to buy plots (${BTN.plot}) and display case slots.`],
  ['Poin Sains', 'Science Points', 'Dihasilkan Kantor, produksi, dan penjualan. Dipakai untuk riset kualitas tiap produk.', 'Produced by the Office, production and sales. Spent on per-product quality research.'],
  ['Pajak', 'Tax', `Penjualan dikenai PPN ${TAX * 100}%. Gaji, sewa, dan listrik dibayar otomatis; kas kurang berubah jadi pinjaman.`, `Sales carry ${TAX * 100}% VAT. Wages, rent and power are paid automatically; a cash shortfall becomes a loan.`]];
const P = {
  enc: () => `<div class="card mute">${T('encintro')}</div>` + econ.calc() + ENC.map(e => `<details class="card enc"><summary>${lg(e[0], e[1])}</summary><div class="mute">${lg(e[2], e[3])}</div></details>`).join(''),
  notes: () => `<div class="card kc"><textarea class="in" rows="14" data-n="notes" maxlength="300" aria-label="${T('notesm')}">${String(G.S.notes || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])}</textarea></div>`,
  redeem: () => `<div class="card kc"><div class="mute">${T('rc_hint')}</div><input class="in" data-n="rc" value="${esc(G.S.rc)}" placeholder="${T('rc_ph')}" maxlength="24" autocapitalize="characters"><div class="row"><button class="b" data-a="redeemgo">${T('redeem')}</button></div></div>`,
  ach: () => { const S = G.S, n = ACH.filter(a => a[3](S)).length;
    return `<div class="card"><h2>${ic('star')}${T('ach')} ${n}/${ACH.length}</h2><div class="bar"><i style="width:${n / ACH.length * 100}%"></i></div></div>` + ACH.map(a => `<div class="card ${a[3](S) ? '' : 'mute'}"><div class="row"><span>${a[3](S) ? '★' : '☆'} ${lg(a[1], a[2])}</span><b>${a[3](S) ? '✓' : '–'}</b></div></div>`).join(''); },
  lib: () => Object.entries(D.products).map(([k, p]) => `<div class="card" data-a="item:${k}" style="cursor:pointer"><div class="row"><span class="lib">${ART[k]}<b>${T(k)}</b></span><span class="mute">Lv${p.lvl} · ${fmt(p.base)}</span></div><div class="mute">${T('recipe')}: ${Object.entries(p.recipe).map(([m, n]) => n + '× ' + T(m)).join(', ')} → ${p.batch} ${T('unit')}</div></div>`).join('')
    + Object.entries(D.materials).map(([k, m]) => `<div class="card" data-a="item:${k}" style="cursor:pointer"><div class="row"><span class="lib">${ART[k]}<b>${T(k)}</b></span><span class="mute">${fmt(m.price)}</span></div><div class="mute">${T('usedin')}: ${Object.entries(D.products).filter(([, p]) => p.recipe[k]).map(([x]) => T(x)).join(', ')}</div></div>`).join(''),
  about: () => `<div class="card"><h2>FashionGame v8</h2><div class="mute">${lg('Simulasi pabrik fashion: beli bahan di bursa, produksi di Pabrik, jual lewat Toko, Online, atau Grosir. Jaga reputasi, kualitas, dan kas.', 'Fashion factory sim: buy materials on the exchange, produce in the Factory, sell via Store, Online or Wholesale. Mind reputation, quality and cash.')}</div></div>`
};
const TTL = { ach: 'ach', lib: 'lib', about: 'about', enc: 'enc', notes: 'notesm', redeem: 'redeem' };
export const view = () => `<h2>${T(TTL[sub])}</h2>` + P[sub]();
export const actions = { msub2: k => { sub = k; },
  redeemgo: () => { const S = G.S, c = String(S.rc || '').trim().toUpperCase(), r = REDEEM[c]; S.rc = ''; S.rd = S.rd || [];
    const say = k => toasts.push({ txt: T(k), t: now() });
    if (!r) return say('rc_bad'); if (S.rd.includes(c)) return say('rc_used');
    S.rd.push(c); S.btn += r.btn; toasts.push({ txt: `${T('rc_ok')}: +${r.btn} ◉ ${T('btn')}`, t: now() }); } };
