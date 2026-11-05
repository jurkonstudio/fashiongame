Taruh isi folder ini di root repo (di samping index.html): `docs/`, `supabase/`, `seed/`.
Urutan menjalankan di Supabase SQL Editor: 0001_core.sql → 0002_rls.sql → 0003_functions.sql → seed/seed.sql.
Setelah itu aktifkan pg_cron dan jalankan dua baris `cron.schedule` di akhir 0003.
