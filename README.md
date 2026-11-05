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

## Update v8 (detail barang & penjualan toko)
- Gudang: ketuk barang membuka detail (js/screens/item.js): jumlah, kualitas, biaya sumber, rincian biaya (bahan/pekerja/administrasi), grafik 7 hari, tombol aksi (Beli x10/x50, Atur harga, Jual di toko, Produksi batch, Kirim kontrak), order bursa NPC (Pembeli/Penjual, ketuk untuk trading 10 unit, biaya 2%), dan navigasi barang sebelumnya/berikutnya.
- Toko di peta: panel kini menampilkan Riwayat penjualan (30 terakhir, saluran, laku dari total, pendapatan bersih) + permintaan & stok per produk. Log disimpan di S.dp.log.
- Menu samping: Pencapaian (10), Perpustakaan (resep & dipakai di), Tentang (js/screens/more.js).
- Riwayat harga bahan disimpan di S.dp.hist (sampel per hari game). Cache ?v=8.

## Update v9 (Kancing Emas & peta 2D baru)
- Mata uang kedua **Kancing Emas** (S.btn). Atur di js/data.js: `BTN = { login: 5, make: 10, sell: 10, plot: 500 }`. Bonus login 1x per hari (jam server), +10 tiap batch produksi selesai, +10 tiap penjualan selesai (jika ada yang laku). Ganti nama di js/lang2.js (kunci `btn`) dan ikon `GB` di js/art.js.
- Petak/slot lahan kini dibeli dengan Kancing Emas (500), bukan uang. Saldo tampil di HUD (pill emas).
- Peta 2D: pulau berlapis (air beranimasi, tepi tanah, jalan ber-marka), mobil berjalan, lampu jalan, pohon di tepi, awan bergerak, label nama bangunan, siang/malam mengikuti jam perangkat (langit gelap, bintang, lampu menyala). Cache ?v=9.

## Update v11 (peta 3D WebGL)
- js/screens/map3d.js: peta 3D sungguhan (Three.js r160, dimuat dari CDN jsdelivr, versi dipin). Model low-poly (Kantor, Pabrik bergerigi + cerobong berasap, Toko ber-awning, Gudang bergelombang), tekstur prosedural dari canvas (tanpa file gambar), bayangan real-time (PCF soft), tone mapping ACES, air facet beranimasi, awan, mobil, lampu jalan dengan PointLight saat malam, jendela menyala di malam hari.
- Interaksi: ketuk petak/bangunan (sama seperti peta SVG), geser horizontal untuk memutar kamera. Tombol PRODUCE/SELL, timer, dan label muncul sebagai overlay HTML yang mengikuti posisi 3D.
- Fallback otomatis ke peta SVG bila CDN/WebGL tidak tersedia (mode offline penuh tetap memakai peta SVG). Catatan: ini satu-satunya dependensi eksternal; untuk offline penuh, unduh three.module.js ke folder lib/ dan ubah URL3 di map3d.js.

## Update v12 (sesi 1: peta 2D tanpa teks + bahan baku dari Pabrik)
- Peta 3D (Three.js) dihapus. Peta kini 2D isometrik SVG bergaya fashion (palet plum/pink/krem). Tanpa dependensi CDN untuk peta.
- Di peta hanya ada gelembung ikon: timer produksi/penjualan/konstruksi, hasil barang (+n) saat produksi selesai, uang (+$) saat penjualan selesai (hilang sendiri setelah 12 dtk). Tidak ada label teks, kartu, atau toast di tab Peta.
- Semua tindakan: ketuk bangunan > panel. Gelembung merah muda (ikon sepatu) di Pabrik = produksi cepat; gelembung hijau (ikon uang) di Toko = jual cepat.
- Pabrik kini juga memproduksi **bahan baku** (data.js: `D.craft`). Bahan mentah baru: Kapas, Kulit mentah, Lateks, Pewarna (dibeli di Pasar). Resep: Benang = 10 Kapas; Karet = 5 Lateks; Kulit = 5 Kulit mentah + 1 Pewarna; Kain = 20 Benang + 4 Pewarna. Bahan hasil Pabrik masuk stok bahan dengan biaya rata-rata dan kualitas dari bahan sumber. Kekurangan bahan dibeli otomatis di Pasar.
- Save lama kompatibel (indeks harga bahan mentah ditambahkan otomatis).
- Rencana sesi berikutnya: (2) panel Pabrik bertab Produk/Bahan + seni bangunan fashion, (3) rantai bahan lebih dalam & bangunan baru, (4) polesan animasi + balancing.

## Update v13 (sesi 2)
- Panel Pabrik bertab Produk / Bahan (js/screens/factory.js, aksi `ft`).
- Seni bangunan: gulungan kain warna-warni di atap Gudang, manekin bergaun pink di jendela Toko.
- Peta ditaruh lebih ke tengah layar. Cache ?v=14.
- Sesi 3 (rencana): rantai bahan lebih dalam + bangunan baru; sesi 4: animasi & balancing.

## Update v14 (sesi 3: Kebun + produk baru)
- Bangunan baru **Kebun** (js/screens/farm.js, D.grow di data.js): panen Kapas, Pewarna, Lateks, Kulit mentah tanpa bahan masukan (biaya 40% harga pasar). Dibangun di lahan kosong ($250), bisa di-upgrade (slot panen = level, -10% waktu per level). Hasil masuk stok bahan.
- Rantai penuh: Kebun > bahan mentah > Pabrik (benang/kain/kulit/karet) > Pabrik (produk) > Toko.
- Produk baru: **Gaun** (Lv3) dan **Jaket** (Lv4). Resep ada di data.js (D.products).
- Peta: bangunan Kebun dengan semak kapas, gelembung panen. Save lama kompatibel (S.b.farm ditambahkan otomatis). Cache ?v=14.

## Update v15 (sesi 4: halaman bangunan ala Sim Companies)
- Ketuk Pabrik/Toko/Kebun/Gudang di peta membuka **halaman penuh** (js/screens/bp.js): gambar bangunan besar, tombol tutup & upgrade, statistik, riwayat hasil terakhir (kartu hijau, S.lg), lalu carousel barang besar (‹ ›) dengan bahan (merah bila kurang), waktu, dan satu tombol aksi besar (Produksi / Panen / Jual). Toko punya tab kanal + atur harga.
- Panel bawah lama tetap dipakai untuk lahan terkunci/kosong. Riwayat (S.lg) dicatat otomatis di state.fx(). Cache ?v=15.

## Update v16 (sesi 1 dari 4: kualitas ala Sim Companies)
- Poin Sains (SP): +1.5/jam per level Kantor, +2 per batch produksi, +0.1 per unit terjual (data.js: `SCI`).
- Riset kualitas per produk (Kantor > Riset): 4 bintang, tiap bintang +0.5 kualitas, butuh SP + uang + waktu (data.js: `QR`). Kualitas akhir = rata-rata kualitas bahan + bonus riset, maks Q5.
- Harga acuan kini `0.6 + 0.2 x Q` (Q1 = 0.8x, Q2 = 1x, Q5 = 1.6x). Kontrak bisa meminta Q lebih tinggi.
- Rencana: sesi 2 pasar penawaran/permintaan, sesi 3 nilai perusahaan lengkap, sesi 4 polesan & balancing.

## Update v17 (sesi 1b: tab utama jadi grid bangunan ala Sim Companies)
- Tab "Peta" diganti **Bangunan**: grid kartu per slot lahan (js/screens/map.js, fungsi `view`). Peta isometrik lama tetap ada sebagai `mapView` (tidak dipakai).
- Tiap kartu: status, progress bar + timer, hasil terakhir (+n barang / +uang), tombol aksi langsung (PRODUCE / SELL n / HARVEST) dan Upgrade. Ketuk judul kartu = halaman detail bangunan (bp.js) seperti sebelumnya.
- Beli lahan (`pbuy`) dan bangun (`pbuild`) langsung dari kartu, tanpa panel perantara. Kantor membuka tab Kantor.
- Toast notifikasi kini juga tampil di tab Bangunan. Cache ?v=17.
