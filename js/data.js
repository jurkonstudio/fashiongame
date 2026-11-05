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
export const BUILD_SEC = { factory: 60, store: 60 };   // waktu konstruksi (detik, memakai jam server)
export const NEW_B = { factory:{cost:200,icon:'factory',fx:'fx_factory'}, store:{cost:150,icon:'store',fx:'fx_store'}, warehouse:{cost:300,icon:'warehouse',fx:'fx_warehouse'} };
export const D = {
  materials: { leather:{icon:'leather',price:8,imp:1}, rubber:{icon:'rubber',price:4,imp:1}, thread:{icon:'thread',price:1}, fabric:{icon:'fabric',price:6} },
  // time = detik per batch; recipe = bahan per batch
  products: {
    shoes:{icon:'shoes',lvl:1,time:600,base:40,batch:5,recipe:{leather:5,rubber:5,thread:10}},
    shirt:{icon:'shirt',lvl:2,time:900,base:25,batch:10,recipe:{fabric:20,thread:10}},
    bag:{icon:'bag',lvl:3,time:1800,base:90,batch:5,recipe:{leather:15,thread:15}}
  },
  // cost naik x1.8 tiap level, time (detik) dikali level saat ini
  buildings: {
    factory:{icon:'factory',cost:1000,time:3600,fx:'fx_factory'},
    office:{icon:'office',cost:800,time:3600,fx:'fx_office'},
    store:{icon:'store',cost:1200,time:5400,fx:'fx_store'},
    warehouse:{icon:'warehouse',cost:300,time:3600,fx:'fx_warehouse'}
  },
  research: { basic:{cost:500,time:1800,lvl:1} },
  goals1: { made:10, sold:10, research:'basic' }
};
