# Undangan Digital + Panel Admin

Undangan pernikahan digital interaktif bertema pixel Karnaval Kita lengkap dengan **panel admin** untuk membuat link unik per tamu, memantau siapa yang sudah membuka undangan, dan mengelola RSVP/ucapan.

## Fitur

**Halaman undangan** (`/{slug}?to={token-tamu}`)
- Cover dengan nama tamu dari database melalui token terdaftar pada parameter `?to=`. Token tidak dikenal, kosong, atau ganda diarahkan ke `/url-tidak-valid`.
- Musik latar (mulai setelah tombol *Buka Undangan* ditekan, sesuai kebijakan autoplay browser)
- Profil kedua mempelai + tombol Instagram
- Countdown menuju hari acara
- Kutipan/ayat + kata pengantar
- Detail Akad & Resepsi + tombol **Lihat Lokasi** dan **Simpan ke Kalender** (.ics)
- Love story (timeline)
- Galeri foto dengan lightbox
- Wedding gift: rekening/e-wallet dengan tombol **Salin**, plus alamat kirim kado
- RSVP (Hadir / Ragu / Tidak Hadir) + ucapan & doa, langsung tampil di halaman
- Turut mengundang + penutup

**Panel admin** (`/admin`)
| Halaman | Fungsi |
|---|---|
| Dashboard | Statistik tamu, yang sudah membuka, RSVP hadir/ragu/tidak hadir, perkiraan jumlah jiwa, ucapan terbaru |
| Daftar Tamu | Tambah/edit/hapus tamu, **Salin Link**, kirim via **WhatsApp**, cari & filter status |
| Ucapan & RSVP | Moderasi: sembunyikan/tampilkan atau hapus ucapan |
| Pengaturan | Data mempelai, teks undangan, tanggal & venue, rekening, love story, galeri, musik, turut mengundang |

**Pencatatan kunjungan**: setiap kali tamu membuka link, `openCount`, `firstOpenedAt`, dan `lastOpenedAt` diperbarui (sekali per sesi browser).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL · `jose` (cookie JWT) · `zod`

## Menjalankan lokal

```bash
npm install
cp .env.example .env      # lalu isi nilainya
npx prisma db push        # buat tabel
npm run db:seed           # data contoh + 3 tamu
npm run dev               # http://localhost:3000
```

Password admin default dari `.env` (`ADMIN_PASSWORD`). Buka `http://localhost:3000/admin`.

### Variabel lingkungan

| Nama | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Postgres |
| `ADMIN_PASSWORD` | Password masuk `/admin` |
| `AUTH_SECRET` | String acak ≥32 karakter untuk menandatangani cookie sesi |
| `NEXT_PUBLIC_SITE_URL` | URL publik situs |

### Postgres lokal (Homebrew)

```bash
brew services start postgresql@18
createdb undangan
# DATABASE_URL="postgresql://<user>@localhost:5432/undangan?schema=public"
```

## Deploy ke Vercel

1. Push repo ke GitHub, import ke Vercel.
2. Buat database Postgres (Neon/Supabase/Vercel Postgres), salin connection string.
3. Set env `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
4. Setelah deploy pertama: `npx prisma migrate deploy` (atau `prisma db push`) dari lokal dengan `DATABASE_URL` produksi.
5. Buka `/admin`, tambah tamu, lalu bagikan link hasil tombol **Salin Link**.

## Struktur

```
prisma/schema.prisma          Invitation, Guest, Wish
prisma/seed.ts                Data contoh
src/app/[slug]/page.tsx       Halaman undangan (SSR)
src/app/admin/(panel)/*       Panel admin (dilindungi middleware)
src/app/admin/login/          Halaman login (di luar guard)
src/app/api/rsvp/             Kirim RSVP + ucapan
src/app/api/track/            Catat kunjungan tamu
src/app/api/calendar/         Unduh .ics
src/app/api/admin/*           CRUD tamu, moderasi ucapan, pengaturan
src/components/invitation/*   Cover, Countdown, Gallery, Guestbook, MusicPlayer
public/ornaments/*            Ornamen SVG (bingkai, divider, motif)
public/img/*                  Placeholder foto (ganti dengan foto sendiri)
public/audio/                 Taruh file musik di sini
```

## Mengganti aset

### Upload foto dari perangkat

Buka **Admin → Pengaturan**. Di bagian kedua mempelai, gunakan **Upload Foto dari Perangkat** untuk foto Putri dan Afif. Di bagian galeri, gunakan **Upload Foto Galeri** untuk memilih beberapa foto sekaligus (maksimal 40 foto). Pratinjau muncul setelah upload; tombol **Hapus** mengeluarkan foto dari pilihan. Klik **Simpan Perubahan** untuk menerapkan pilihan ke undangan.

Upload menerima JPG, PNG, dan WebP tanpa animasi, maksimal 10 MB dan 40 megapiksel per foto. Server menyesuaikan orientasi, memperkecil foto hingga 2400 piksel, menghapus metadata, dan menyimpan hasil WebP di tabel PostgreSQL `UploadedPhoto`. File tidak bergantung pada disk sementara hosting. Terapkan skema dengan `npx prisma db push` sebelum menjalankan versi ini; restart server setelah Prisma Client diperbarui. Foto yang dihapus dari pilihan tetap tersimpan di database agar tautan yang sudah dipakai tidak rusak.

- **Foto mempelai**: isi kolom Foto di *Pengaturan*, misal `/img/mempelai-wanita.jpg` (taruh file di `public/img/`).
- **Galeri**: isi daftar URL di *Pengaturan* (satu per baris), kosongkan untuk memakai placeholder.
- **Musik**: taruh file di `public/audio/music.mp3`, lalu isi kolom URL Musik di *Pengaturan*.
- **Ornamen**: ganti SVG di `public/ornaments/` bila ingin motif sendiri.

## Riwayat tema sebelumnya (tidak aktif)

Tampilan mengacu pada https://ganami.my.id/524/putra-putri?to=namatamu. Implementasi tetap memakai Next.js dan data proyek yang sudah ada; tidak menyalin backend, foto mempelai, rekening, atau data tamu dari referensi. Video pembuka, musik, dekorasi, dan dua font cover memakai aset referensi yang disimpan lokal.

Dua aset dekorasi disimpan lokal agar tidak menggunakan hotlink:
- `public/img/theme/bugishijau.jpeg` dari `https://ganami.my.id/assets_plush/img/bugishijau.jpeg`.
- `public/img/theme/bugiss2.jpeg` dari `https://ganami.my.id/assets_plush/img/bugiss2.jpeg`.

Layout desktop memakai panel dekorasi tetap dan kolom undangan 460 px; layar kecil menggunakan satu kolom. Navigasi bawah, jarak kartu, font, cover, zoom, dan lightbox galeri telah diperbaiki. Parameter `?to=` harus cocok dengan token tamu terdaftar pada undangan tersebut; nama bebas dari URL tidak ditampilkan. URL tanpa parameter `to` tetap menampilkan undangan umum.

Foto placeholder tetap dipertahankan jika belum diisi. Jika URL musik pada pengaturan kosong, pemutar menggunakan musik referensi lokal; URL musik khusus tetap diutamakan. Tidak ada perubahan data database atau publikasi hosting dalam pekerjaan tampilan ini.


### Arsip aset tema sebelumnya

- `public/video/bugis-opening.mp4`: `https://ganami.my.id/assets_plush/img/Bugis22.mp4` (20,969 detik, H.264, 608 × 1080).
- `public/audio/reference-wedding.mp3`: `https://ganami.my.id/assets/uploads/524/music_6aa23b6da63561.17800955.mp3` (101,146 detik, loop).
- `public/fonts/Caladea.ttf` dan `PoltawskiNowy.otf`: direktori `https://ganami.my.id/assets_plush/fonts/`.

Cover masuk selama 3 detik dan bergeser ke atas saat dibuka. Video dimulai setelah klik; teks mengikuti waktu video mulai detik 9, dengan stagger 350 ms, kemudian poster tampil setelah video selesai. Reveal saat scroll memakai durasi 2,5 detik, varian slide/zoom, dan dapat terulang. Musik dipicu langsung pada gestur pengguna untuk kompatibilitas autoplay, dengan tombol jeda/putar. Preferensi reduced motion melewati video dan menampilkan teks; kegagalan video tetap menampilkan poster dan isi.

Build produksi disimpan di `.next-production`, terpisah dari cache development `.next`, sehingga verifikasi produksi tidak menimpa server development yang sedang berjalan.

## Karnaval Kita (tema aktif)

Halaman publik kini menggunakan `src/components/invitation/karnaval/`, dengan referensi visual [Karnaval Kita Quest](https://inveet.id/theme-preview/karnaval-kita-quest). Data mempelai, tanggal, tempat, musik, rekening, galeri, dan token tamu tetap berasal dari database proyek. Cover menggunakan nama panggilan yang sudah tersimpan. Panel admin tetap tersedia di `/admin`.

- Cover pixel, pilihan karakter pria/wanita, sambutan dari teks pembuka yang sudah ada, dan panduan.
- Peta tiga area dengan joystick/WASD/panah, tombol aksi, stan undangan, bianglala berputar, orkes, pemandu kucing interaktif, dan lentera ucapan yang bisa diketuk. Desktop memakai area permainan 480 px seperti referensi.
- Modal mempelai, acara/countdown/peta/kalender, galeri/lightbox, kisah, hadiah/salin rekening, RSVP, QR tautan undangan, dan pintasan undangan ringkas.
- Lempar Gelang: enam lemparan, bidik lalu atur tenaga. Pancing Bebek: 30 detik, empat nilai bebek. Skor memberi 1–3 kupon, kunjungan pertama memberi satu kupon, enam aksesori dapat ditukar dan dikenakan. Kupon dan inventaris disimpan di perangkat per undangan/token tamu.
- Papan skor tersimpan di PostgreSQL, dengan sesi permainan sekali pakai, batas skor, dan pemeriksaan durasi dasar. Skor berasal dari klien; ini bukan sistem anti-cheat kompetitif.
- Chat antartamu dan kehadiran karakter tersimpan di PostgreSQL. Polling kehadiran setiap 2,5 detik, chat setiap 4 detik; karakter menghilang setelah 12 detik tanpa pembaruan. Riwayat chat yang ditampilkan dibatasi 24 jam.
- Photobox: kamera depan, tiga pose dengan hitung mundur, pilihan foto dari perangkat, empat efek, tiga desain bingkai (Karnaval/Tiket/Klasik), warna bingkai yang langsung memperbarui hasil, dan unduhan PNG 680 × 1680. Foto photobox diproses di perangkat, tidak diunggah.
- Ucapan menerima 25 stiker PNG/GIF dari katalog referensi dan rekaman suara opsional maksimal 30 detik/3 MB. Rekaman disimpan di PostgreSQL; audio ucapan tersembunyi hanya dapat diakses admin.

Sambutan memakai teks pembuka undangan, sesuai pilihan pengguna. Tombol **Dengarkan teks** memakai `speechSynthesis` browser, bukan rekaman/kloning suara mempelai. Catatan internal tamu tidak dibuka kepada tamu. QR berisi tautan undangan; tidak menyatakan tamu sudah check-in. Chat dan papan skor memakai backend proyek sendiri, bukan koneksi ke layanan Inveet.

### Skema dan menjalankan

Setelah mengambil perubahan di lingkungan lain, jalankan:

```bash
npm install
npx prisma db push
npm run build
npm run start
```

Tambahan skema: `CarnivalPresence`, `CarnivalChat`, `CarnivalRun`, `UploadedVoice`, serta kolom opsional `Wish.voiceId` dan `Wish.sticker`. Tidak perlu menjalankan seed ulang. Pengujian lokal telah menerapkan perubahan skema secara aditif pada database lokal; penerapan ke database hosting belum dilakukan.

```bash
npx tsx --test src/lib/carnival.test.ts src/lib/invitation-guest.test.ts
```

Uji browser dan integrasi lokal memakai skrip di `.work/karnaval/` (diabaikan Git). Hasil final: 64 pemeriksaan alur browser pada 320/390/768/1440 px, 9 pemeriksaan detail interaksi, 23 pemeriksaan backend, dan 5 unit test lulus, termasuk putaran permainan, penukaran kupon, photobox dari foto, RSVP, rekaman, moderasi, chat, kehadiran, penolakan replay skor, dan admin. Kamera tiga pose dan rekaman mikrofon diuji dengan perangkat simulasi Chrome; backend rekaman juga diuji dengan audio sintetis. Kamera/mikrofon fisik serta ketersediaan suara pembaca teks browser belum diuji.

Aset tema dan font berada di `public/karnaval/` dan `karnaval/fonts.css`, disimpan lokal dari aset publik referensi. Sumber setiap aset visual dicatat di `public/karnaval/SOURCES.md`. Kode aplikasi tetap Next.js; backend Inveet tidak disalin atau digunakan. Build produksi tetap terpisah di `.next-production`.

### Pembaruan photobox dan deploy VPS

Perbaikan kamera memiliki 7 tes tambahan untuk fallback constraint, pembatalan izin, frame belum siap, timeout, dan pesan error. Pengguna sudah mengonfirmasi kamera fisik tampil di localhost. Bingkai kini dapat diganti setelah foto tanpa mengambil ulang.

Panduan Ubuntu + PM2 dengan database VPS yang sudah ada: [docs/DEPLOY-VPS.md](docs/DEPLOY-VPS.md). Konfigurasi proses opsional tersedia di `ecosystem.config.js`; sesuaikan port/nama dengan deployment yang berjalan.
