# Catatan Pengujian

Tanggal pengerjaan: 17 November 2026.

## Pemeriksaan yang benar-benar dijalankan

- `node --check` untuk JavaScript inline pada `index.html`.
- `node --check` untuk seluruh berkas Netlify Functions dan helper `.mjs`.
- Build statis lokal melalui `node scripts/build.mjs`.
- Uji fungsi server dengan mock Netlify Blobs: login siswa idempotent (termasuk spasi dan kapitalisasi), simpan/baca nilai, simpan refleksi, dua pengiriman proyek bersamaan (tepat satu klaim berhasil), autentikasi guru, akses endpoint foto, dan reset masing-masing bagian secara terpisah.

## Yang belum dapat dinyatakan lulus

- Deploy ke akun/site Netlify pengguna belum dilakukan.
- Uji integrasi terhadap Netlify Blobs yang sebenarnya belum dilakukan.
- Belum dilakukan uji visual manual pada HP, tablet, dan laptop, termasuk orientasi portrait/landscape.
- Belum diuji dengan dua browser/perangkat sungguhan. Mock hanya memverifikasi alur fungsi dan kontrak yang ditulis, bukan layanan Netlify produksi.

Karena itu, hasil ini adalah paket proyek yang telah diperbaiki dan lolos pemeriksaan sintaks serta uji fungsi terisolasi, bukan klaim bahwa seluruh skenario produksi sudah lulus. Setelah dideploy dan environment variable disetel, lakukan checklist pada README di URL Netlify.
