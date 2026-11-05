// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// Semua nilai uang disimpan dalam USD. Modal awal $500 = Rp9.066.000 (kurs 18.132)
export const RATE = 18132;
export const START_MONEY = 500;
export const TIME_SCALE = 1;      // 1 = waktu nyata. Isi 60 untuk tes cepat (1 jam jadi 1 menit)
export const WAGE_PER_HOUR = 2;   // gaji per pekerja per jam
export const HIRE_COST = 100;
export const SALE_HOURS = 2;      // satu batch penjualan di Toko Lv1 = 2 jam
export const BASE_CAP = 10;       // unit per penjualan di Toko Lv1 (x level toko)
// Tahap A: ekonomi. imp=1 -> harga ikut kurs impor. Supplier: harga x mult, kualitas q (1-3)
export const SUP = { cheap:{mult:0.8,q:1}, std:{mult:1,q:2}, prem:{mult:1.3,q:3} };
export const TAX = 0.11;          // pajak (PPN) atas penjualan
export const RENT_HOUR = 4;       // sewa per jam per level bangunan
export const POWER_HOUR = 3;      // listrik per jam per level pabrik saat produksi (idle = 1/6)
export const LOAN_STEP = 1000;    // pinjaman per tap
export const LOAN_RATE = 0.001;   // bunga 0,1% per jam game
// Tahap B: produksi & penjualan
export const WAGE = { 1:1.5, 2:2.5, 3:4 };      // gaji/jam menurut skill (Junior/Menengah/Senior)
export const HIRE = { 1:80, 2:200, 3:450 };     // biaya rekrut
export const DAY_SEC = 600;                     // 10 menit nyata = 1 hari game (30 hari = 1 bulan)
export const WH_BASE = 40, WH_PER = 20;         // kapasitas gudang = 40 + 20 x level pabrik
export const SEG = { hemat:0.5, mid:0.35, prem:0.15 };   // porsi segmen pasar
export const SEASONS = [{m:3,id:'lebaran',x:1.6},{m:6,id:'school',x:1.5,only:'shoes'},{m:10,id:'harbolnas',x:1.5,ch:'online'},{m:11,id:'year',x:1.3}];
// Peta 2D: 10 lahan dalam satu petak (4 pertama gratis). Harga lahan dalam USD. NEW_B = bangunan tambahan untuk lahan kosong.
export const SLOTS = 10, WH_BLD = 30;     // WH_BLD = tambahan kapasitas gudang per level Gudang
export const SLOT_COST = [0, 0, 0, 100, 150, 250, 400, 650, 1000, 1500];
export const BUILD_SEC = { factory: 60, store: 60, farm: 60 };   // waktu konstruksi (detik, memakai jam server)
export const NEW_B = { factory:{cost:200,icon:'factory',fx:'fx_factory'}, store:{cost:150,icon:'store',fx:'fx_store'}, warehouse:{cost:300,icon:'warehouse',fx:'fx_warehouse'}, farm:{cost:250,icon:'farm',fx:'fx_farm'} };
export const D = {
  materials: { leather:{icon:'leather',price:8,imp:1}, rubber:{icon:'rubber',price:4,imp:1}, thread:{icon:'thread',price:1}, fabric:{icon:'fabric',price:6},
    // bahan mentah (sumber untuk produksi bahan baku di Pabrik)
    cotton:{icon:'cotton',price:0.6}, hide:{icon:'hide',price:5,imp:1}, latex:{icon:'latex',price:2.5,imp:1}, dye:{icon:'dye',price:3} },
  // Pabrik juga bisa membuat bahan baku sendiri (hemat dibanding beli jadi di Pasar, tapi butuh waktu)
  craft: {
    thread:{icon:'thread',lvl:1,time:300,batch:20,recipe:{cotton:10}},
    rubber:{icon:'rubber',lvl:1,time:600,batch:5,recipe:{latex:5}},
    leather:{icon:'leather',lvl:1,time:900,batch:5,recipe:{hide:5,dye:1}},
    fabric:{icon:'fabric',lvl:2,time:600,batch:10,recipe:{thread:20,dye:4}}
  },
  // time = detik per batch; recipe = bahan per batch
  products: {
    shoes:{icon:'shoes',lvl:1,time:600,base:40,batch:5,recipe:{leather:5,rubber:5,thread:10}},
    dress:{icon:'dress',lvl:3,time:2400,base:140,batch:5,recipe:{fabric:15,thread:10,dye:3}},
    jacket:{icon:'jacket',lvl:4,time:3600,base:260,batch:4,recipe:{leather:10,fabric:10,thread:10}},
    shirt:{icon:'shirt',lvl:2,time:900,base:25,batch:10,recipe:{fabric:20,thread:10}},
    bag:{icon:'bag',lvl:3,time:1800,base:90,batch:5,recipe:{leather:15,thread:15}}
  },
  // cost naik x1.8 tiap level, time (detik) dikali level saat ini
  // Kebun: panen bahan mentah (tanpa bahan masukan, biaya 40% harga pasar). time = detik per panen
  grow: { cotton:{time:600,batch:50}, dye:{time:900,batch:10}, latex:{time:900,batch:20}, hide:{time:1200,batch:10} },
  buildings: {
    farm:{icon:'farm',cost:600,time:3600,fx:'fx_farm'},
    factory:{icon:'factory',cost:1000,time:3600,fx:'fx_factory'},
    office:{icon:'office',cost:800,time:3600,fx:'fx_office'},
    store:{icon:'store',cost:1200,time:5400,fx:'fx_store'},
    warehouse:{icon:'warehouse',cost:300,time:3600,fx:'fx_warehouse'}
  },
  research: { basic:{cost:500,time:1800,lvl:1} },
  goals1: { made:10, sold:10, research:'basic' }
};
// Sesi 1: kualitas & riset. Riset kualitas per produk (level 0-4), butuh Poin Sains (SP) + uang + waktu. Tiap level = +0.5 kualitas (maks Q5).
export const QR = { max: 4, sp: [10, 30, 70, 150], mul: [10, 30, 80, 200], time: [1800, 3600, 7200, 14400], bonus: 0.5 };
export const SCI = { office: 1.5, make: 2, sell: 0.1 };   // SP: per jam per level Kantor, per batch produksi, per unit terjual
export const BTN = { login: 5, make: 10, sell: 10, plot: 500 };   // Kancing Emas: bonus login / produksi / penjualan, harga petak lahan

// Kode tukar (menu Tukar kode). Hadiah Kancing Emas, sekali pakai per kode. Ubah/tambah sesuka hati.
export const REDEEM = { WELCOME: { btn: 10 }, FASHION: { btn: 25 }, DESAINER: { btn: 50 } };

// Level berbasis XP (mengikuti riset Sim Companies). XP per jam game. Level 1->2 = 5, 2->3 = 10, selanjutnya 10 x Fibonacci: 20, 30, 50, 80, 130, 210, 340, 550, 890, ...
export const XP = { active: 12, build: 36.5, up: 36 };   // bangunan aktif (produksi/jual/panen) | konstruksi baru | upgrade, semuanya per jam durasi
export const xpNeed = lv => { if (lv <= 1) return 5; if (lv === 2) return 10; let a = 1, b = 1; for (let i = 2; i < lv; i++) [a, b] = [b, a + b]; return 10 * b; };   // XP untuk naik dari lv ke lv+1
export const xpCum = lv => { let s = 0; for (let l = 1; l < lv; l++) s += xpNeed(l); return s; };   // total XP saat mencapai level lv
export const levelFor = xp => { let l = 1; while (xp >= xpCum(l + 1)) l++; return l; };

// ===== v22: logika ekonomi ala Sim Companies (semua angka bisa diubah di sini) =====
// 1) Overhead admin: makin besar perusahaan, biaya operasional (gaji + sewa + listrik) ikut naik. COO menurunkannya.
export const ADMIN = { free: 4, per: 0.03, max: 0.6 };   // gratis sampai total level bangunan = free; tiap level di atasnya +3%; maks +60%
// 2) Fase ekonomi: diundi tiap PHASE_DAYS hari game (1 hari game = DAY_SEC detik nyata). dem = pengali permintaan ritel, mat = harga bahan, px = harga pasar/grosir/bursa
export const PHASE_DAYS = 7;
export const PHASES = { recession: { dem: 0.75, mat: 0.92, px: 0.85 }, normal: { dem: 1, mat: 1, px: 1 }, boom: { dem: 1.3, mat: 1.12, px: 1.1 } };
export const PHASE_TRANS = { recession: { recession: 0.4, normal: 0.6, boom: 0 }, normal: { recession: 0.2, normal: 0.6, boom: 0.2 }, boom: { recession: 0, normal: 0.5, boom: 0.5 } };
// 3) Kejenuhan pasar ritel: tiap unit terjual menambah n/depth; pesaing (NPC) ikut menambah; pulih x decay tiap jam; permintaan x (1 - max x kejenuhan)
export const SAT = { depth: 40, max: 0.4, decay: 0.7, rival: 0.25 };
// 4) Bursa (exchange) vs kontrak langsung. Harga acuan = base x qm(Q) x indeks bursa. Bursa: biaya 3% + ongkos kirim/unit. Kontrak: biaya 0%, ongkos kirim 50%, harga sedikit di bawah acuan.
export const EXCH = { fee: 0.03, ship: 0.5, spread: 0.08, depth: 150, lvl: 2 };   // spread = selisih beli-jual; depth = unit yang menggeser indeks ~100%
export const CONTRACT = { disc: 0.01, shipMul: 0.5 };
// 5) Riset kualitas berbasis peluang (RNG). Gagal: SP kembali sebagian, uang & waktu hangus.
export const QRC = { base: [0.9, 0.75, 0.6, 0.45], refund: 0.5 };
// 6) Eksekutif (terbuka di level EXEC_LVL). Gaji per jam game, masa kerja acak (hari game), peluang dibajak per jam.
export const EXEC_LVL = 15;
export const EXEC = { coo: { hire: 4000, sal: 25, adm: 0.5 }, cfo: { hire: 4000, sal: 25, int: 0.5, cash: 0.5 }, cmo: { hire: 4000, sal: 25, spd: 0.1 }, cto: { hire: 4000, sal: 25, qr: 0.15 } };   // COO: admin, CFO: bunga & pajak kas, CMO: waktu jual, CTO: peluang riset
export const EXEC_LIFE = [40, 80];
export const POACH = 0.004;

// ===== v23: panel ala Sim Companies =====
// Pajak kas: kas di atas (free x level Kantor) dikenai rate per jam. CFO memotongnya.
export const CASH = { free: 20000, rate: 0.0005 };
// Order book bursa: volume beli NPC per jam = batch x volMul x pengali fase. Pesaing memasang 5 level harga (ladder) dengan total rival x volume.
export const ORD = { volMul: 4, rival: 1.25, max: 8 };
// Obligasi: nominal kelipatan step, bunga per "hari obligasi" (dayH jam nyata) antara min-max. Makin tinggi bunga, makin cepat terbeli (waitMax -> waitMin jam).
export const BOND = { step: 5000, min: 0.005, max: 0.006, dayH: 24, waitMax: 12, waitMin: 2, cap: 20000, lvl: 2, sellback: 0.98 };
// Runtuhkan bangunan: pengembalian sebagian dari total biaya bangun + upgrade
export const SCRAP_REFUND = 0.3;

// Kas di header tidak berkurang tiap detik: biaya berjalan (gaji, sewa, listrik, admin, eksekutif, bunga obligasi, pajak kas) ditampung di S.due dan dibayar saat ada progres (produksi/penjualan/kontrak selesai). false = perilaku lama.
export const CASH_SETTLE = true;
