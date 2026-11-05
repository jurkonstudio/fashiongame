# FashionGame

Simulasi pabrik fashion. Web game (HTML/JS), jalan di Chrome HP.

## Struktur
- index.html — halaman utama
- css/style.css — tampilan
- js/data.js — bahan, produk, bangunan, riset, kurs (RATE=18132)
- js/i18n.js — bahasa ID/EN + format Rp / $
- js/api.js — Supabase (auto simpan) atau localStorage
- js/main.js — router layar, render, loop
- js/state.js — state, timer, tick penjualan
- js/screens/ — map (isometrik), market, margin, office, finance, profile; factory & store dipakai di dalam bangunan peta
- supabase/schema.sql — tabel `saves` + RLS
- assets/map/ — cadangan aset peta (peta 2D digambar SVG lewat js/screens/map.js)

## Pasang
1. Supabase: SQL Editor, jalankan supabase/schema.sql.
2. Authentication > Providers: aktifkan **Anonymous sign-ins**.
3. Isi js/config.js dengan URL dan anon key.
4. Upload ke GitHub, Settings > Pages > branch main / root.
5. Buka link Pages di HP. Tanpa config, game jalan offline.

Timer (produksi, upgrade, riset) memakai waktu selesai absolut, jadi tetap berjalan saat game ditutup.

## Aturan game (Level 1)
- Produksi: 1 batch sepatu (5 unit) = 10 menit. Penjualan: 1 batch (maks 10 unit) = 2 jam di Toko Lv1.
- Harga di atas harga dasar menurunkan permintaan; unit yang tidak laku kembali ke stok.
- Upgrade bangunan memakai waktu dan membuat bangunan itu tidak bisa dipakai selama upgrade. Level bangunan maks = 2 + level pemain.
- Untuk tes cepat, ubah TIME_SCALE di js/data.js (mis. 60).
- Pasar: pilih jumlah beli (×1, ×10, ×50, ×100, Maks). Di Pabrik, tombol produksi otomatis membeli bahan yang kurang.
- assets/icons/: 21 ikon SVG khusus FashionGame (lihat preview.html). Hak cipta di assets/LICENSE.txt. Ganti nama pemilik bila perlu.
- Kantor punya sub-tab: Target, Pekerja, Riset, Bangunan.

## Tahap A (ekonomi)
- Harga bahan berubah tiap jam game; kulit & karet ikut kurs impor.
- Supplier Murah/Standar/Premium (kualitas 1-3). Kualitas bahan menentukan kualitas produk dan harga acuan jual.
- Biaya: gaji, sewa, listrik, pajak 11%, bunga pinjaman. Kas kurang otomatis jadi pinjaman.
- Layar Keuangan: laporan laba rugi + bank.

## Tahap B (produksi & penjualan)
- Pekerja Junior/Menengah/Senior: gaji beda, skill mempercepat produksi dan menurunkan cacat.
- Mesin aus tiap batch (turun 3%); perawatan berbayar. Mesin <=20% = berhenti. Gudang terbatas.
- Cacat produksi acak (skill, kualitas bahan, kondisi mesin).
- Pasar 3 segmen (hemat/menengah/premium) + harga pesaing + reputasi merek + musim (Lebaran, tahun ajaran, Harbolnas, akhir tahun).
- Channel: Toko, Online (fee 8% + ongkir, butuh Kantor Lv2), Grosir (harga tetap, butuh Toko Lv2).
- 10 menit nyata = 1 hari game; 30 hari = 1 bulan.

## Peta isometrik & navigasi (Tahap C)
- Modal awal **$500 = Rp9.066.000** (START_MONEY di data.js; uang disimpan USD, tampil Rupiah/USD sesuai Profil > Preferensi).
- Satu petak lahan, 10 slot bangunan (SLOT_COST di data.js). Awal: Kantor (pajangan), Pabrik, Toko. Slot 4-10 dibeli, lalu bangun Gudang. Pabrik/Toko/Gudang di-upgrade dengan timer; tindakan Pabrik & Toko dilakukan di dalam bangunan (ketuk di peta).
- Peta berubah menurut level: Lv1 Kampung Konveksi, Lv2 Kota Kecil, Lv3 Distrik Mode, Lv4+ Metropolis Fashion; bangunan makin tinggi.
- Navigasi: Peta, Pasar, Margin (teks), Kantor, Keuangan. Profil (tombol kanan atas): Perusahaan (eksekutif, karyawan, bonus, valuasi, kewajiban), Akun, Bahasa, Preferensi, Notifikasi, Obrolan, Reset.
- Save lama kompatibel; uang lama tidak berubah. Hapus localStorage `fg` untuk mulai dari $500.

## Hak cipta & lisensi
Semua kode, ikon SVG, ilustrasi peta, teks, dan nama tokoh adalah karya orisinal (lihat LICENSE). Tidak ada aset internet, font luar, atau gambar pihak ketiga.

## Update v2
- Tampilan gaya editor (gelap, aksen biru, font lebih kecil 14px). Default bahasa English + USD.
- Pemain baru: $500, hanya Kantor. Panduan di Peta: bangun Pabrik ($200) > produksi > bangun Toko ($150) > jual. Pemasukan hanya dari penjualan Toko.
- Timer memakai jam server Supabase (RPC `server_now`, sinkron tiap 5 menit). Jalankan ulang supabase/schema.sql.

## Update v3
- Aksi langsung di peta: tombol PRODUCE di Pabrik, SELL n di Toko, timer + progress bar di atas bangunan. Ketuk bangunan untuk panel detail.
- Pabrik & Toko dibangun dengan timer konstruksi (60 dtk, jam server).
- Tutorial: produksi pertama 10x lebih cepat, penjualan pertama ~2 menit. Setelah penjualan pertama, kecepatan normal.
- Untuk tes cepat: TIME_SCALE di js/data.js (mis. 60).

## Update v4 (identitas FashionGame)
- Ikon & logo baru buatan sendiri (assets/icons/*.svg, assets/logo.svg): ubin plum + jahitan putus-putus, motif gantungan baju, benang, kancing.
- Palet merek: plum gelap + magenta/coral + emas. Kartu & tombol bergaya jahitan.
- Bangunan di peta punya emblem: gantungan baju (Kantor, Toko), gulungan benang (Pabrik).
- Notifikasi toast saat produksi, penjualan, atau konstruksi selesai.
- Cache: versi ?v=4 pada impor & index.html. Naikkan angka saat update.

## Update v5
- Tema terang bergaya glass (putih, panel semi transparan, blur). Cache ?v=5.

## Update v6 (kedalaman ala Sim Companies)
- js/depth.js (modul baru) + js/lang2.js (teks ID/EN). Cache ?v=6.
- Peristiwa pasar acak (mogok pelabuhan, obral tekstil, tren viral, daya beli lesu, tarif impor): memengaruhi harga bahan / permintaan, tampil sebagai lencana di HUD.
- Kontrak (Pasar > Kontrak): pembeli ritel menawar harga di atas pasar, butuh jumlah + kualitas minimum, ada tenggat. Dibuka setelah penjualan pertama.
- Pemasaran (Kantor > Pemasaran): 3 kampanye (Sosmed, Influencer, Baliho) menaikkan permintaan sementara; biaya masuk laporan laba rugi.
- Target level bertingkat Lv1 sampai Lv4 (produksi, penjualan, pendapatan, reputasi, level Toko/Kantor).
- Peringkat (Keuangan > Peringkat): valuasi kamu vs 5 pesaing NPC yang tumbuh tiap hari game.
- Save lama kompatibel (field `dp` otomatis ditambahkan).

## Update v7 (tampilan modern ala Sim Companies)
- HUD gelap: menu, avatar, peringkat, uang (pill hijau), level + persen XP. Navigasi bawah gelap: Peta, Gudang, Pasar, Kantor, Keuangan. Cache ?v=7.
- Menu samping (hamburger): Profil, Target, Kontrak, Peringkat, Margin, Bahasa/Setelan.
- Gudang (js/screens/warehouse.js): kartu bergambar per kategori (bahan baku, produk jadi) dengan harga, jumlah, kualitas; bar kapasitas + nilai stok; tab Margin dipindah ke sini.
- Profil perusahaan (Profil > Profil): thumbnail kota sesuai level, nama/deskripsi/catatan pribadi yang bisa diedit, peringkat valuasi, rating A-E dari reputasi, tier, tanggal berdiri, tag produk.
- Ilustrasi: js/art.js (7 barang + thumbnail kota).
