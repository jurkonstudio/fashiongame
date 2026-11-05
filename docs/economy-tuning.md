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
