# Update VPS Ubuntu + PM2

Target: `https://afifoundputri.my.id`. Database sudah ada di VPS, menurut pengguna. Jangan mengganti `.env` VPS dengan `.env` laptop, menjalankan seed, atau mengimpor database laptop. GitHub hanya membawa kode/aset publik; data tamu, foto unggahan, ucapan, dan pengaturan tetap di PostgreSQL VPS.

Panduan ini belum dijalankan pada VPS. Pengguna mengonfirmasi folder `/opt/undangan/app`. Nama proses PM2, port, versi Ubuntu/Node, reverse proxy, serta isi skema VPS belum diperiksa. Ganti placeholder sebelum menjalankan perintah. Jalankan perintah satu per satu; berhenti jika gagal.

## 1. Periksa instalasi yang berjalan

SSH dengan akun yang biasa menjalankan PM2, lalu:

```bash
cd /opt/undangan/app
pwd
pm2 list
node --version
npm --version
git status --short
git remote -v
git rev-parse HEAD
```

Catat commit lama dan nama proses untuk rollback. Pastikan remote adalah `ANDIAFIF/Undangan-Online`. Jika ada perubahan lokal, simpan/review terlebih dahulu; jangan gunakan `git reset --hard`. Gunakan versi Node yang memenuhi `engines` dependensi lockfile. Jangan melakukan upgrade runtime bersamaan tanpa memeriksa kompatibilitas aplikasi lain.

Backup database VPS dengan prosedur PostgreSQL yang biasa dipakai. Contoh untuk database lokal (ganti nama database aktual; perintah ini tidak memakai DATABASE_URL Prisma):

```bash
mkdir -p "$HOME/undangan-backups"
chmod 700 "$HOME/undangan-backups"
(umask 077; sudo -u postgres pg_dump -Fc NAMA_DATABASE_VPS > "$HOME/undangan-backups/before-karnaval.dump")
pg_restore --list "$HOME/undangan-backups/before-karnaval.dump"
```

Gunakan nama backup baru bila file sudah ada. Jika PostgreSQL berada di host lain, gunakan backup layanan tersebut atau `pg_dump` dengan host/user yang benar. Jangan lanjut sebelum backup berhasil. Simpan salinan `.env` secara privat di luar repositori. Jangan membagikan dump atau rahasia di chat/GitHub.

## 2. Ambil branch terbaru

```bash
git fetch origin
git switch --track origin/feat/karnaval-photobox-vps-20261117
```

Jika branch lokal sudah ada, gunakan `git switch feat/karnaval-photobox-vps-20261117` lalu `git pull --ff-only`.

Pertahankan DATABASE_URL, ADMIN_PASSWORD, AUTH_SECRET VPS. Pastikan variabel ini di `.env` bernilai:

```dotenv
NEXT_PUBLIC_SITE_URL="https://afifoundputri.my.id"
```

Jika variabel yang sama pernah disetel lewat PM2/shell, sesuaikan juga sumber tersebut supaya tidak menimpa `.env`. Jangan tampilkan nilai rahasia saat memeriksa konfigurasi.

## 3. Update saat maintenance singkat

Ganti `NAMA_PROSES_PM2` dengan nama yang benar dari `pm2 list`. Menghentikan proses sebelum mengganti dependencies/build mencegah aplikasi berjalan dengan file build yang sedang ditimpa.

```bash
pm2 stop NAMA_PROSES_PM2
npm ci --include=dev
npx prisma db push
npm run build
pm2 restart NAMA_PROSES_PM2 --update-env
pm2 save
```

Proyek menggunakan Prisma 6 dari lockfile, tanpa riwayat migration. `db push` menambahkan tabel/kolom fitur karnaval. Jika Prisma meminta penghapusan data atau reset, **berhenti** dan periksa perbedaan skema; jangan menambah `--accept-data-loss` atau `--force-reset`. Jangan menjalankan `npm run db:seed` pada database ini.

Build produksi ada di `.next-production`. Proses lama harus menjalankan `npm start` atau `next start` dari folder proyek yang benar, bukan development server. Jika proses lama memiliki konfigurasi lain, periksa sebelum restart.

`ecosystem.config.js` disediakan sebagai alternatif untuk proses baru. Jangan menjalankannya bersamaan dengan proses lama pada port yang sama. Setelah proses lama dihentikan dan nama/port disesuaikan:

```bash
APP_PORT=PORT_APLIKASI pm2 start ecosystem.config.js
pm2 save
```

Konfigurasi ini mendengarkan pada loopback, memerlukan reverse proxy. Pertahankan konfigurasi proxy/TLS domain yang sudah bekerja. Proxy harus meneruskan `Host`, `X-Forwarded-Proto`, dan alamat klien yang benar. Bila menggunakan Nginx, batas request perlu cukup untuk unggahan foto 10 MB (misalnya `client_max_body_size 12m;`). Periksa `sudo nginx -t` sebelum reload setelah perubahan. Akses kamera dari HP memerlukan HTTPS yang valid.

## 4. Validasi

```bash
pm2 list
pm2 logs NAMA_PROSES_PM2 --lines 50 --nostream
curl -I http://127.0.0.1:PORT_APLIKASI/AFIFoundPutri
curl -I https://afifoundputri.my.id/AFIFoundPutri
```

Buka domain di browser: periksa data mempelai/tamu, login admin, foto galeri, RSVP, chat, game, dan photobox. Berikan izin kamera, ambil tiga pose, ganti bingkai, unduh PNG. Pastikan tautan tamu lama masih diterima. Jangan menyebarkan log yang mengandung data pribadi atau connection string.

## Jika update gagal

Jangan terus restart build yang gagal. Simpan pesan error, lalu kembalikan kode ke commit lama yang dicatat pada langkah 1, instal dependency dan build ulang sebelum menghidupkan proses. Kolom/tabel tambahan yang tidak dipakai kode lama umumnya dapat tetap ada; jangan melakukan schema push balik secara otomatis. Pemulihan database dari backup adalah langkah terpisah yang perlu menilai ucapan/data baru sejak backup.

## Referensi resmi

- [PM2 ecosystem configuration](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [Next.js self-hosting dan reverse proxy](https://nextjs.org/docs/app/guides/self-hosting)
