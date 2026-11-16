# Undangan Online — Adat Makassar (FREE)

Template undangan pernikahan digital bertema **adat Makassar**, dibuat untuk **FREE / gratis** agar siapa pun dapat membuat dan menyesuaikan undangan sendiri. Tampilan hijau-emas dengan dekorasi geometris merupakan interpretasi desain, bukan dokumentasi ritual adat.

**Seluruh data contoh adalah dummy.** Repository ini tidak menyertakan database pemilik, foto pribadi, daftar tamu asli, rekening asli, kata sandi, atau kredensial layanan. Gunakan database PostgreSQL milik Anda sendiri. Gratis mengacu pada template; hosting dan database dapat memiliki biaya dari penyedianya.

## Fitur

- Cover personal dari token tamu terdaftar; token yang diubah sembarangan diarahkan ke halaman peringatan.
- Profil kedua mempelai, orang tua, acara, countdown WITA, lokasi, kalender, cerita, galeri, hadiah, dan ucapan.
- Panel admin: pengaturan undangan, daftar tamu, salin link, WhatsApp, statistik kunjungan, RSVP, dan moderasi ucapan.
- Upload foto mempelai wanita, mempelai pria, dan banyak foto galeri; pratinjau, ganti, dan hapus dari pilihan.
- JPG, PNG, WebP maksimal 10 MB / 40 megapiksel per foto; galeri maksimal 40 foto. Gambar dikonversi ke WebP hingga 2400 piksel dan disimpan di PostgreSQL.
- Layout responsif, animasi pembukaan, dan dukungan reduced motion.
- Musik opsional melalui URL pada pengaturan. Musik/video pihak lain tidak dibundel.

## Menjalankan

Prasyarat: Node.js 22.12+ dan PostgreSQL. Buat **database baru khusus demo**, jangan arahkan konfigurasi ke database pribadi/produksi.

```bash
git clone https://github.com/ANDIAFIF/Undangan-Online.git
cd Undangan-Online
npm install
cp .env.example .env
```

Isi `.env` dengan koneksi database sendiri, password admin yang kuat, dan secret acak. Buat secret menggunakan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` lalu salin hasilnya ke `AUTH_SECRET`.

```bash
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000/demo-makassar` untuk undangan umum, dan `http://localhost:3000/admin` untuk login. Seed membuat nama, keluarga, tamu, alamat, dan ucapan dummy; rekening hadiah dan nomor telepon dikosongkan. Seed melewati database yang sudah memiliki undangan.

## Upload foto dan bagikan undangan

1. Login ke **Admin → Pengaturan**.
2. Pilih **Upload Foto dari Perangkat** pada masing-masing mempelai; gunakan **Upload Foto Galeri** untuk memilih banyak foto.
3. Tunggu pratinjau muncul, lalu klik **Simpan Perubahan**.
4. Buat tamu di **Daftar Tamu** dan klik **Salin Link**. Gunakan token yang dibuat sistem, bukan nama bebas pada URL.

Foto yang dihapus dari pilihan tidak langsung dihapus dari penyimpanan agar tautan lama tidak rusak. Backup PostgreSQL mencakup foto upload. Foto undangan dapat dibaca publik melalui URL-nya.

## Konfigurasi

| Variabel | Isi |
| --- | --- |
| `DATABASE_URL` | PostgreSQL milik Anda sendiri |
| `ADMIN_PASSWORD` | Password admin Anda |
| `AUTH_SECRET` | Secret acak minimal 32 karakter |
| `NEXT_PUBLIC_SITE_URL` | Alamat situs Anda |

`.env.example` hanya berisi placeholder, bukan akun yang bisa digunakan. `.env`, dump database, foto upload lokal, cache build, dan folder kerja diabaikan Git.

## Build dan hosting

```bash
npm run build
npm run start
```

Stack: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL, dan Sharp. Sediakan runtime Node.js yang mendukung Sharp, koneksi PostgreSQL, serta variabel lingkungan di hosting. Terapkan skema ke database baru sebelum menjalankan aplikasi. Batas request hosting/proxy harus mendukung ukuran upload yang dipilih; beberapa layanan membatasi di bawah 10 MB. Restart server setelah perubahan skema/Prisma Client.

## Lisensi

Kode dan dekorasi SVG bawaan tersedia gratis di bawah lisensi MIT. Dependensi dan font Google mempertahankan lisensi masing-masing. Foto, musik, dan konten yang ditambahkan pengguna harus memiliki izin penggunaan yang sesuai.
