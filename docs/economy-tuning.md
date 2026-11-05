# Catatan Penyetelan Ekonomi

## Keputusan: Skenario C (v28.2)
Tujuan: FashionGame dibuat lebih realistis dan kompleks seperti Sim Companies. Angka disetel untuk pemain sendiri dulu, perhitungan dipindah ke server nanti.

Masalah sebelumnya: produksi sendiri terlalu murah (sepatu ~$8,7 vs harga $40), sehingga integrasi vertikal tidak menantang dan kaos/gaun terlalu menguntungkan.

Perubahan (harga dasar bahan, USD):
| Bahan | Sebelum | Sesudah | Naik |
|---|---|---|---|
| Kapas (raw) | 0,6 | 0,9 | 1,5× |
| Kulit mentah (raw) | 5 | 7 | 1,4× |
| Lateks (raw) | 2,5 | 3,25 | 1,3× |
| Pewarna (raw) | 3 | 3,6 | 1,2× |
| Benang | 1 | 1,2 | 1,2× |
| Karet | 4 | 4,6 | 1,15× |
| Kulit | 8 | 9,2 | 1,15× |
| Kain | 6 | 6,6 | 1,1× |

Dampak biaya bahan per unit (bahan saja, belum termasuk gaji, listrik, sewa, overhead, pajak):
| Produk | Harga | Beli dari pasar | Produksi sendiri | Hemat integrasi |
|---|---|---|---|---|
| Sepatu | $40 | 41% | 30% | 27% |
| Kaos | $25 | 58% | 21% | 64% |
| Gaun | $140 | 17% | 7% | 59% |
| Jaket | $260 | 16% | 10% | 38% |
| Tas | $90 | 35% | 27% | 21% |

## Catatan
- Kaos dan gaun masih terlalu menguntungkan di jalur integrasi. Penyetelan lanjutan bisa lewat harga kain atau harga jual.
- Angka ini belum melalui simulasi jangka panjang (permintaan, kejenuhan, fase ekonomi).
- Harga yang sama ada di `js/data.js` dan `seed/seed.sql`. Keduanya harus diubah bersama.

## Keputusan: Penyetelan lanjutan (v28.3)
Disetujui: naikkan bahan lagi 1,5×, naikkan biaya operasional sekitar 3× (upah, sewa, listrik), dan tambahkan batas permintaan per produk.

Yang sudah diterapkan:
- Harga bahan: kapas 1,35; lateks 4,875; kulit mentah 10,5; pewarna 5,4; benang 1,8; karet 6,9; kulit 13,8; kain 9,9 (`js/data.js` dan `seed/seed.sql`).
- Upah per jam: 4,5 / 7,5 / 12 (skill 1/2/3). Sewa per level per jam: 12. Listrik per jam: 9.

Hasil model (laba bersih % omzet, belum termasuk pajak kas dan biaya bangun):
| Profil | Laba |
|---|---|
| Awal sepatu, produksi sendiri | 20% |
| Awal sepatu, beli bahan | 4% |
| Lv2 sepatu, produksi sendiri | 22% |
| Lv3 tas | 37% |
| Lv3 gaun | 71% |
| Lv4 jaket | 68% |

Belum tercapai: tas, gaun, dan jaket masih di atas 15–25%. Dua sebab:
1. Harga gaun dan jaket terlalu tinggi dibanding biaya bahannya. Untuk gaun, bahan hanya sekitar 11% dari harga jual.
2. Batas permintaan per produk belum diterapkan. Perlu diputuskan satuannya dulu: per hari game (10 menit nyata) atau per jam nyata.

Belum diterapkan: batas permintaan, satu pekerja per slot produksi, biaya perawatan, dan biaya pemasaran.
