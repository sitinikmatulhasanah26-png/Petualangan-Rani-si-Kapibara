# Petualangan Rani – Netlify edition

Proyek ini mempertahankan HTML pembelajaran Petualangan Rani yang diberikan, lalu memindahkan pencatatan siswa, nilai per soal, refleksi, proyek poster, dan otorisasi guru ke Netlify Functions + Netlify Blobs.

## Struktur

- `index.html` — antarmuka utama; materi, peta, kuis, karakter, dan fitur pembelajaran lama dipertahankan.
- `netlify/functions/students.mjs` — login/nama siswa (idempotent berdasarkan nama yang dinormalisasi).
- `netlify/functions/scores.mjs` — simpan/perbarui nilai tiap soal.
- `netlify/functions/reflections.mjs` — simpan refleksi.
- `netlify/functions/projects.mjs` — pengumpulan satu poster per nama; klaim memakai `onlyIfNew`.
- `netlify/functions/project-image.mjs` — menyajikan foto untuk guru dengan sesi bertanda tangan.
- `netlify/functions/teacher.mjs` — login guru, rekap gabungan, dan reset terpisah.
- `netlify/functions/lib/shared.mjs` — validasi, akses Blobs, dan sesi guru.
- `netlify.toml`, `package.json` — konfigurasi deploy.

## Deploy ke Netlify

1. Ekstrak ZIP ini. Unggah folder proyek ke repositori Git (disarankan), lalu di Netlify pilih **Add new site → Import an existing project** dan hubungkan repositori tersebut.
2. Biarkan Netlify membaca `netlify.toml`: Build command `npm run build`, Publish directory `dist`, Functions directory `netlify/functions`. Build script menyalin `index.html` ke `dist/` sehingga dependensi dan kode Functions tidak ikut dipublikasikan sebagai file statis.
3. Alternatif melalui terminal setelah ekstraksi: jalankan `npm install`, `npx netlify login`, `npx netlify link`, lalu `npx netlify deploy --build --prod`. ZIP ini adalah paket sumber lengkap; jangan mengunggahnya sebagai situs statis drag-and-drop biasa karena deploy statis tidak menjalankan Netlify Functions.
3. Buka **Site configuration → Environment variables**. Tambahkan:
   - `TEACHER_PIN`: PIN rahasia guru, minimal 4 karakter. Jangan gunakan contoh.
   - `TEACHER_SESSION_SECRET`: string acak panjang minimal 32 karakter. Contoh pembuatan: `openssl rand -hex 32`.
   Pastikan scope mencakup Functions. Jangan menaruh kedua nilai ini di HTML, Git, atau file publik.
4. Deploy / trigger deploy ulang setelah environment variable diatur. Netlify Blobs akan dibuat otomatis saat Functions pertama kali mengaksesnya.
5. Buka URL Netlify yang sama pada perangkat siswa dan guru. Data server hanya sama untuk deployment/site Netlify yang sama.

## Uji fungsi

### Sebagai siswa
1. Buka URL Netlify dari browser biasa/incognito, pilih **Mode Siswa**, isi nama lengkap.
2. Login harus berhasil hanya ketika server dapat dijangkau. Nama baru langsung ditulis ke Blobs.
3. Mulai kuis dan jawab satu soal. Setiap jawaban menulis nilai 10 (benar) atau 0 (salah) pada kunci soal tersebut; pengulangan kuis memperbarui nilai soal yang sama.
4. Buka proyek, pilih/foto Poster Peta Indonesia, periksa pratinjau, lalu kirim. Server mengompres data di browser dan menyimpan foto di Blobs.
5. Kirim refleksi. Bila permintaan gagal, formulir tetap terbuka untuk dicoba lagi.

### Sebagai guru
1. Pilih **Mode Guru**, masukkan `TEACHER_PIN` yang diatur pada Netlify.
2. Buka **Hasil Belajar**, **Rekapan Proyek**, dan **Refleksi**. Refresh memuat data terbaru dari Blobs.
3. Klik foto poster untuk membuka ukuran penuh. URL foto memerlukan token sesi guru yang masih berlaku.
4. Uji reset masing-masing bagian secara terpisah. Konfirmasi ditampilkan sebelum penghapusan.

## Catatan desain dan batasan yang perlu diketahui

- Data siswa, nilai, refleksi, metadata proyek, dan foto tidak bergantung pada `localStorage`. `localStorage` hanya dipakai sebagai antrean sementara untuk nilai yang gagal dikirim saat koneksi terputus dan untuk preferensi tampilan.
- Nilai disimpan per pasangan siswa/identitas soal, sehingga nilai yang belum pernah disimpan tampil sebagai 0. Total merupakan jumlah nilai tiap soal yang tercatat (10 untuk benar, 0 untuk salah).
- Login siswa memakai nama lengkap tanpa PIN. Nama dinormalisasi untuk mencegah duplikasi akibat spasi atau perbedaan huruf besar/kecil.
- Satu poster per nama dijamin oleh penulisan kondisional `onlyIfNew` pada satu kunci proyek per siswa. Dua permintaan bersamaan tidak dapat sama-sama mengklaim kunci yang sama. Bila upload foto gagal setelah klaim, klaim dibatalkan agar siswa dapat mencoba lagi.
- Netlify Blobs cocok untuk file dan key/value sederhana. Penulisan skor tiap soal dan klaim proyek menggunakan kunci terpisah; sistem tidak memakai operasi read-modify-write atas satu blob bersama.
- Reset **Hasil Belajar** menghapus skor, bukan daftar login siswa. Dengan demikian siswa tetap tercatat dan tampil dengan nilai 0. Reset proyek menghapus metadata proyek dan file fotonya. Reset refleksi hanya menghapus refleksi.
- Token guru berlaku 8 jam dan disimpan di `sessionStorage` browser guru. Foto hanya dapat diminta dengan token guru yang valid.
- Tidak ada mode revisi proyek di versi ini; pengumpulan kedua ditolak. Jika kelak diperlukan, mekanisme revisi harus dibuat sebagai aksi guru yang diautentikasi.
- Aplikasi memerlukan koneksi internet untuk login, menyimpan nilai, mengirim proyek/refleksi, dan membuka rekap. Jika jawaban kuis gagal dikirim, antrean sementara disimpan di browser dan dicoba kembali saat koneksi pulih; status gagal ditampilkan, tidak dianggap sudah tersimpan di server.
- Uji lintas perangkat, kuota/limit akun Netlify, dan konfigurasi domain harus dilakukan pada site Netlify yang benar-benar sudah dideploy. File lokal/preview statis tidak dapat membuktikan penyimpanan Blobs.
