# Arsitektur Lapor WKI

## Alur data

1. Browser memuat SPA React (`index.html` + `assets/`) dari subdomain.
2. SPA memanggil `GET api.php?action=flows` → daftar pertanyaan (`server/app/flows.php`) dan aturan unggahan.
3. Pengguna menjawab lewat chat; jawaban ditahan di memori browser (tidak disimpan ke storage browser, demi privasi).
4. `POST api.php?action=submit` (multipart: `type`, `answers` JSON, `files[]`, `website` honeypot).
5. Server memvalidasi ulang (jenis, panjang, email, tanggal, file), menyimpan ke MySQL (`reports`, `attachments`),
   memindahkan file ke `storage/uploads/YYYY/MM/<acak>.<ext>`, lalu mengirim email via `Mailer` (mail() atau SMTP).
6. Admin membuka `#/admin`, login Microsoft (MSAL). `admin-api.php` memverifikasi token lewat Graph `/me` dan hanya menerima email di `auth.admins` (sesi + CSRF) untuk daftar, detail, unduh lampiran, status, CSV.

## Komponen

- **web/src/App.tsx** — mesin keadaan chat: fase `loading → choose → asking → files → review → sending → done`.
- **web/src/components/** — `Header` (progres), `MessageList` (log + ReviewCard + DoneCard), `Composer` (input per jenis, unggah, aksi).
- **web/src/validate.ts** — validasi klien (email, telepon, tanggal, file). Server tetap memvalidasi ulang.
- **server/api.php** — endpoint publik (flows, submit, track). **server/admin-api.php** — API dashboard admin. **server/admin.php** — pengalihan ke `#/admin`. **server/app/** — bootstrap (DB, throttle), flows, mailer.

## Keputusan desain

- Semua pertanyaan opsional dan boleh dilewati (sama dengan form Microsoft sebelumnya).
- Ringkasan sebelum kirim, dengan tombol ubah per jawaban.
- Kode laporan acak (`WBS-…`/`GRT-…`) sebagai satu-satunya pegangan pelapor untuk tindak lanjut.
- Definisi pertanyaan berada di server agar bisa diubah tanpa build ulang.

## Tabel database

| Tabel | Isi |
|---|---|
| reports | ref, type, answers (JSON), status, admin_note, public_note, email_status, created_at, updated_at |
| attachments | report_id, orig_name, stored_name (acak), mime, size |
| rate_limit | hash pengirim + waktu (dibersihkan otomatis setelah 24 jam) |
