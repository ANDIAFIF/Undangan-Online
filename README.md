# Undangan Digital + Panel Admin

Undangan pernikahan digital satu halaman (tema hijau-emas adat Bugis) lengkap dengan **panel admin** untuk membuat link unik per tamu, memantau siapa yang sudah membuka undangan, dan mengelola RSVP/ucapan.

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

## Penyesuaian tampilan referensi

Tampilan mengacu pada https://ganami.my.id/524/putra-putri?to=namatamu. Implementasi tetap memakai Next.js dan data proyek yang sudah ada; tidak menyalin backend, foto mempelai, rekening, atau data tamu dari referensi. Video pembuka, musik, dekorasi, dan dua font cover memakai aset referensi yang disimpan lokal.

Dua aset dekorasi disimpan lokal agar tidak menggunakan hotlink:
- `public/img/theme/bugishijau.jpeg` dari `https://ganami.my.id/assets_plush/img/bugishijau.jpeg`.
- `public/img/theme/bugiss2.jpeg` dari `https://ganami.my.id/assets_plush/img/bugiss2.jpeg`.

Layout desktop memakai panel dekorasi tetap dan kolom undangan 460 px; layar kecil menggunakan satu kolom. Navigasi bawah, jarak kartu, font, cover, zoom, dan lightbox galeri telah diperbaiki. Parameter `?to=` harus cocok dengan token tamu terdaftar pada undangan tersebut; nama bebas dari URL tidak ditampilkan. URL tanpa parameter `to` tetap menampilkan undangan umum.

Foto placeholder tetap dipertahankan jika belum diisi. Jika URL musik pada pengaturan kosong, pemutar menggunakan musik referensi lokal; URL musik khusus tetap diutamakan. Tidak ada perubahan data database atau publikasi hosting dalam pekerjaan tampilan ini.


### Animasi dan audio referensi

- `public/video/bugis-opening.mp4`: `https://ganami.my.id/assets_plush/img/Bugis22.mp4` (20,969 detik, H.264, 608 × 1080).
- `public/audio/reference-wedding.mp3`: `https://ganami.my.id/assets/uploads/524/music_6aa23b6da63561.17800955.mp3` (101,146 detik, loop).
- `public/fonts/Caladea.ttf` dan `PoltawskiNowy.otf`: direktori `https://ganami.my.id/assets_plush/fonts/`.

Cover masuk selama 3 detik dan bergeser ke atas saat dibuka. Video dimulai setelah klik; teks mengikuti waktu video mulai detik 9, dengan stagger 350 ms, kemudian poster tampil setelah video selesai. Reveal saat scroll memakai durasi 2,5 detik, varian slide/zoom, dan dapat terulang. Musik dipicu langsung pada gestur pengguna untuk kompatibilitas autoplay, dengan tombol jeda/putar. Preferensi reduced motion melewati video dan menampilkan teks; kegagalan video tetap menampilkan poster dan isi.

Build produksi disimpan di `.next-production`, terpisah dari cache development `.next`, sehingga verifikasi produksi tidak menimpa server development yang sedang berjalan.
