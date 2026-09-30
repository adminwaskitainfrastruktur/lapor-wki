# Lapor WKI — WBS & Pelaporan Gratifikasi (form bergaya chat)

Web pelaporan mandiri untuk PT Waskita Karya Infrastruktur. Berjalan di **subdomain** dari domain utama
(usulan: `lapor.waskitainfrastruktur.co.id`), terpisah dari WordPress.

- Pelapor mengisi lewat percakapan (satu pertanyaan per giliran), tanpa login, boleh anonim.
- Boleh unggah lampiran (file asli, hingga 5 file × 10 MB).
- Laporan tersimpan di database MySQL Hostinger, lalu email notifikasi (dengan lampiran) dikirim ke penerima per jenis.
- Halaman admin `/admin.php` untuk melihat laporan, mengunduh lampiran, mengubah status, dan ekspor CSV.

| Jenis | Kode | Penerima email (bisa diubah di `app/config.php`) |
|---|---|---|
| Whistleblowing System | `WBS-XXXXXXXX` | daftar `recipients.wbs` |
| Pelaporan Gratifikasi | `GRT-XXXXXXXX` | daftar `recipients.gratifikasi` |

Tautan langsung: `/?jenis=wbs` dan `/?jenis=gratifikasi` (melewati pilihan jenis).

## Struktur

```
web/      Frontend React + TypeScript (Vite). Tampilan chat.
server/   Backend PHP (api.php, admin.php, app/*) untuk hosting Hostinger.
scripts/  assemble.mjs (menyusun deploy/), smtp_sink.py (uji email lokal)
design-system/lapor-wki/MASTER.md   Aturan desain (ui-ux-pro-max)
deploy/   Hasil susunan siap upload (dibuat oleh scripts/assemble.mjs, tidak di-commit)
docs/     Catatan arsitektur + vault Obsidian hasil graphify
```

Daftar pertanyaan ada di **satu tempat**: `server/app/flows.php`. Frontend membacanya lewat `api.php?action=flows`.
Untuk mengubah/menambah pertanyaan cukup edit file itu (tanpa build ulang).

## Menjalankan lokal

Butuh Node 20+, PHP 8.1+ (ada di Laragon), dan MySQL.

```bash
cd web && npm install
node scripts/assemble.mjs          # build web + susun deploy/
# buat deploy/app/config.php dari server/app/config.sample.php (isi DB lokal)
php -S 127.0.0.1:8081 -t deploy    # buka http://127.0.0.1:8081/
```

Catatan Windows: folder proyek ini mengandung `&`, sehingga `npx`/`npm run` bisa gagal. Script di `web/package.json`
sudah memakai `node node_modules/...` langsung. Bila ada yang error, jalankan perintah yang sama lewat `node`.

Uji email tanpa server email asli: `python scripts/smtp_sink.py 2525 tmp-mail` lalu set `mail.driver=smtp`,
`host=127.0.0.1`, `port=2525`, `secure=none` di config. Email tersimpan sebagai `.eml`.

## Deploy ke Hostinger (subdomain)

1. **Subdomain**: hPanel > Domains > Subdomains > buat `lapor` (folder mis. `public_html/lapor`).
   Hostinger otomatis mengurus DNS dan SSL untuk subdomain di domain yang sama.
2. **Database**: hPanel > Databases > MySQL Databases > buat database + user. Catat nama, user, password.
   Tabel dibuat otomatis saat halaman pertama dipakai.
3. **Susun paket**: `node scripts/assemble.mjs`, lalu upload **isi** folder `deploy/` ke folder subdomain
   (File Manager atau FTP).
4. **Folder lampiran di luar web** (disarankan): buat folder `lapor-storage` di home akun (sejajar dengan `domains/`),
   isi `storage_dir` di config dengan path lengkapnya.
5. **Config**: salin `app/config.sample.php` menjadi `app/config.php`, isi database, `app_secret` (teks acak panjang),
   penerima email, dan bagian `mail` (lihat di bawah).
6. **Admin**: buka `/admin.php?setup`, buat hash password (min. 10 karakter), tempel ke `admin_users` di config.
   Setelah ada akun, halaman setup otomatis mati.
7. **Cek keamanan**: pastikan `https://lapor.../app/config.php` dan `https://lapor.../storage/` menghasilkan 403/404.
8. **Uji**: kirim satu laporan uji per jenis; cek email masuk, lampiran ikut, dan tampil di `/admin.php`.

### Email

- `driver: 'mail'`: memakai email bawaan hosting. Tanpa setelan, tetapi rawan masuk spam di Outlook.
- `driver: 'smtp'`: isi host/port/user/pass. Login SMTP basic Microsoft 365 **sudah dimatikan Microsoft**, jadi jangan
  pakai `smtp.office365.com`. Pilihan: mailbox email di Hostinger (`smtp.hostinger.com`, 465/ssl) atau layanan
  seperti SendLayer/Brevo (perlu record SPF/DKIM di DNS domain).

### Tombol dari website utama

Di halaman WBS dan Gratifikasi (WordPress/Elementor) tambahkan tombol ke:
`https://lapor.waskitainfrastruktur.co.id/?jenis=wbs` dan `https://lapor.waskitainfrastruktur.co.id/?jenis=gratifikasi`.
Di web baru, tombol "Kembali ke website" mengarah ke domain utama.

## Privasi & keamanan (ringkas)

- Tidak ada login, tidak ada cookie pelacak. IP tidak disimpan; pembatas kiriman memakai hash harian yang tidak bisa dibalik.
- Semua jawaban opsional. Lampiran dibatasi jenis dan ukuran, disimpan dengan nama acak, hanya bisa diunduh admin.
- Anti-spam: pembatas kiriman per pengirim, kolom jebakan (honeypot), pemeriksaan asal permintaan.
- Admin: password di-hash, sesi httpOnly + SameSite, CSRF pada ubah status, login dibatasi 10 percobaan / 15 menit.
- Lampiran **tidak dipindai antivirus**. Unduh dan buka dengan hati-hati.
