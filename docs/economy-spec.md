# FashionGame Online — Spesifikasi Ekonomi (v0.1)

Status: draf untuk disetujui. Semua angka berasal dari prototipe (`js/data.js`) dan bisa diubah lewat tabel `game_config` / seed, tanpa mengubah kode.

## 1. Prinsip
1. **Server-authoritative.** Klien (browser) hanya membaca. Semua perubahan uang, stok, dan timer lewat fungsi Postgres (`supabase/migrations/0003_functions.sql`). Klien tidak punya hak tulis ke tabel.
2. **Claude AI tidak pernah mengubah angka ekonomi.** Perannya hanya menilai desain dan menulis ulasan NPC (lihat bagian 8). Hasilnya ditulis oleh Edge Function ke kolom `designs.score`.
3. **Waktu = waktu nyata.** Tidak ada percepatan waktu game. Satu-satunya percepatan: **menyelesaikan bangunan/upgrade dengan Kancing Emas**.
4. **Timer = timestamp absolut** (`finish_at`, `build_until`). Tidak ada tick per detik. Hasil dihitung saat dibaca/diklaim.
5. **Cron hanya untuk pekerjaan berkala:** harga pasar tiap jam, sewa/bunga tiap jam.

## 2. Mata uang
| | Cash | Kancing Emas |
|---|---|---|
| Disimpan | USD (`brands.cash`) | integer (`brands.buttons`) |
| Tampilan | **Bahasa ID → Rp (kurs 18.132), bahasa EN → $** | angka biasa |
| Didapat | penjualan, bonus awal $500 | login harian +5, tiap batch produksi +10, tiap penjualan +10 |
| Dipakai | semua pembelian dan biaya | **hanya** percepat bangunan/upgrade, beli lahan |
| Uang nyata | belum ada | belum ada |

Konversi Rp/$ hanya di tampilan (klien). Database tidak pernah menyimpan Rupiah.

## 3. Waktu, tick, dan percepatan
- Produksi: `waktu = detik_resep × jumlah_batch × 0,9^(level_pabrik−1)`.
- Bangun pertama: 60 detik (Pabrik/Toko/Kebun/Gudang). Upgrade: `base_seconds × level_saat_ini`.
- **Percepat dengan Kancing Emas:** `biaya = max(1, ceil(sisa_detik / 1800))` = **1 Kancing per 30 menit tersisa**. Berlaku untuk bangun dan upgrade saja, **tidak** untuk produksi atau riset.
- Pasar NPC (cron tiap jam): `indeks ← indeks + 0,3 × (1 − indeks) ± 8%`, dibatasi 0,7–1,5. Kejenuhan ×0,7 per jam.
- Biaya berkala (cron tiap jam): sewa = Σ(level × sewa_per_jam). Kas kurang → jadi hutang, bunga 0,1%/jam.

## 4. Level pemain (logika per level)
Target naik level (dari prototipe, dihitung server dari `made`, `sold`, `revenue`, `reputation`, level bangunan):

| Level | Syarat naik | Membuka |
|---|---|---|
| 1 → 2 | produksi 10, jual 10, riset dasar | Kaos, Kain |
| 2 → 3 | jual 100, reputasi 30, Toko Lv2 | Tas, Gaun |
| 3 → 4 | jual 400, pendapatan $15.000, reputasi 60, Kantor Lv3 | Jaket |
| 4+ | (belum dirancang) | lahan & bangunan lebih tinggi |

Batas level bangunan = **2 + level pemain**.

Contoh kurva upgrade Pabrik (biaya ×1,8 per level, waktu = 1 jam × level):
| Upgrade | Biaya | Waktu | Percepat |
|---|---|---|---|
| 1→2 | $1.000 | 1 jam | 2 Kancing |
| 2→3 | $1.800 | 2 jam | 4 |
| 3→4 | $3.240 | 3 jam | 6 |
| 4→5 | $5.832 | 4 jam | 8 |

Manfaat per level Pabrik: +1 slot produksi paralel, waktu −10%. Toko: +10 unit per penjualan, kapasitas naik.

## 5. Katalog & resep (seed)
Bahan mentah: Kapas, Kulit mentah, Lateks, Pewarna. Bahan: Benang, Karet, Kulit, Kain. Produk: Sepatu (Lv1), Kaos (Lv2), Tas & Gaun (Lv3), Jaket (Lv4). Resep lengkap di `seed/seed.sql`.

## 6. Kualitas
- Satu tumpukan inventory per kualitas: kunci `(brand, item, quality)`.
- Supplier NPC: Murah Q1 (×0,8 harga), Standar Q2 (×1), Premium Q3 (×1,3).
- **Aturan MVP:** satu produksi memakai bahan dengan kualitas yang sama; hasilnya berkualitas sama. Q4–Q5 dibuka oleh riset (sesi berikutnya).
- Pengali harga: `0,6 + 0,2 × Q` → Q1 0,8×, Q2 1×, Q3 1,2×, Q5 1,6×.

## 7. Pasar NPC (harga NPC dulu)
- Harga jual produk: `harga_dasar × pengali_Q × indeks × (1 − 0,4 × min(1, kejenuhan))`.
- Jual n unit → kejenuhan += n / 40 (`market_depth`). Pasar pulih 30%/jam.
- Beli bahan n unit → indeks bahan += 0,002 × n (maks 1,6).
- Pajak penjualan 11%. Butuh Toko; maks jual per transaksi = 10 × level Toko.
- Market antar pemain (order book) dibuka di fase berikutnya; tabel `market_orders` baru dibuat saat itu.

## 8. Desain & Claude AI (NPC)
- Desain dibuat dari **pilihan terbatas** (kategori, gaya, warna, bahan) + nama pendek. Tidak ada unggah gambar → tidak perlu moderasi gambar.
- Edge Function memanggil Claude untuk memberi skor 0–100 + ulasan singkat, dibandingkan dengan tren musim. Kunci API hanya di secret Edge Function.
- Skor desain nanti memengaruhi permintaan (pengali kecil, mis. 0,9–1,2). Keputusan angka ini ditunda sampai fase desain.
- Pembatasan: maks N penilaian per brand per hari (mencegah biaya API membengkak).

## 9. Keamanan & anti-curang
- RLS: pemain hanya `select` data miliknya. Tidak ada policy insert/update/delete.
- Fungsi `pay`, `market_tick`, `costs_tick`, `settle_builds` tidak dapat dipanggil klien.
- Fungsi aksi memakai `auth.uid()` untuk kepemilikan dan `FOR UPDATE` untuk mencegah balapan data.
- **Asumsi (pertanyaan 8 belum dijawab):** satu brand per akun (`brands.owner_id unique`). Rate limit per aksi ditambahkan sebelum rilis publik.

## 10. Hasil uji
Skema dan fungsi diuji di PostgreSQL 16 dengan stub Supabase: alur bangun → beli → produksi berantai → klaim → jual → pasar jenuh → tick pasar → sewa; penolakan (slot penuh, bahan kurang, kapasitas jual, tulis langsung ke tabel, memanggil `pay`); dan pemain lain tidak bisa melihat data brand. Belum diuji di proyek Supabase sungguhan.

## 11. Catatan balancing (perlu keputusan)
- Rantai produksi sendiri sangat murah (biaya sepatu ≈ $8,7/unit vs harga $40). Prototipe punya selisih serupa. Saran: naikkan harga bahan mentah atau turunkan harga dasar produk sebelum rilis.
- Sewa $12/jam untuk 3 bangunan berjalan terus walau pemain offline; pertimbangkan batas hutang atau masa tenggang.

## 12. Yang belum diputuskan
- Pertanyaan 7 (desain bebas/terbatas) dan 8 (anti-curang) dijawab dengan asumsi di atas.
- Jumlah level di atas Lv4, riset kualitas versi server, dan market antar pemain.

## 13. Logika tambahan ala Sim Companies (v22, prototipe klien)
Status: sudah berjalan di prototipe (`js/econ.js`, konstanta di akhir `js/data.js`). Saat dipindah ke server, tabel `game_config` menampung konstanta yang sama.

| Mekanik | Rumus | Catatan |
|---|---|---|
| Overhead admin | `min(0,6, max(0, Σlevel − 4) × 0,03) × (1 − 0,5 × COO)` | mengalikan gaji + sewa + listrik |
| Fase ekonomi | undi tiap 7 hari game, matriks `PHASE_TRANS` | pengali `dem` / `mat` / `px`: Resesi 0,75/0,92/0,85, Normal 1/1/1, Booming 1,3/1,12/1,1 |
| Kejenuhan | `jual += n/40`, `× 0,7` per jam, pesaing `+rand(0..0,25)` | permintaan `× (1 − 0,4 × min(1, jenuh))` |
| Bursa | harga jual = acuan × 0,96; harga beli = acuan × 1,04; biaya 3% + $0,5/unit | indeks bergeser `±n/150` per transaksi, kembali ke harga fase 30%/jam |
| Kontrak | harga = acuan × 0,99; biaya 0%; ongkos kirim 50% | butuh Kantor Lv2 |
| Riset | peluang `[0,9; 0,75; 0,6; 0,45] + 0,15 × CTO` (maks 0,95) | gagal: 50% SP kembali |
| Eksekutif | rekrut $4.000, gaji $25/jam, masa 40–80 hari, dibajak 0,4%/jam | terbuka level 15 |

Untuk versi server: pindahkan undian fase, kejenuhan global (jumlah jual semua pemain), dan `market_orders` (bursa antar pemain sungguhan) ke fungsi Postgres + pg_cron. Pesaing NPC di klien bisa dihapus setelah ada cukup pemain.
