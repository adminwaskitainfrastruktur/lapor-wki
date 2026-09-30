# Design System — Lapor WKI (Master)

Produk: layanan pelaporan online PT Waskita Karya Infrastruktur (WBS + Pelaporan Gratifikasi) dengan pengisian bergaya chat.
Prinsip: tenang, tepercaya, rahasia, ramah di ponsel. Tidak seperti landing page marketing.

> Catatan: hasil `--design-system` otomatis (tema OLED gelap + pola landing testimoni) **ditolak** karena tidak cocok untuk produk ini.
> Palet di bawah diambil dari pencarian `--domain color` "Government Portal / Civic Services" dan diverifikasi.

## Gaya
- Terang sebagai utama, mode gelap didukung (desain berpasangan, kontras dicek terpisah).
- Kartu putih, sudut 16px, bayangan tipis konsisten (3 tingkat), tanpa blur dekoratif.
- Pola halaman: satu kolom percakapan (max 720px), header ringkas, bilah input menempel di bawah.

## Warna (token semantik)
| Token | Terang | Gelap |
|---|---|---|
| --color-primary | #1E40AF | #93B4FF |
| --color-on-primary | #FFFFFF | #0B1A45 |
| --color-secondary | #3B82F6 | #3B82F6 |
| --color-accent | #16A34A | #4ADE80 |
| --color-background | #EFF6FF | #0B1220 |
| --color-foreground | #1E3A8A | #E6ECFF |
| --color-card | #FFFFFF | #131C30 |
| --color-muted | #E9EFF5 | #1A2438 |
| --color-muted-foreground | #475569 | #A7B4CC |
| --color-border | #BFDBFE | #26324A |
| --color-destructive | #DC2626 | #F87171 |
| --color-ring | #1E40AF | #93B4FF |

Kontras teks normal minimal 4.5:1; status tidak hanya dengan warna (selalu ada ikon/teks).

## Tipografi
- Judul: Lexend (500–700). Isi: Source Sans 3 (400–600).
- Skala: 14 / 16 / 18 / 22 / 28. Isi minimal 16px, line-height 1.6. Angka referensi memakai tabular-nums.

## Spasi & bentuk
- Skala 4/8: 4, 8, 12, 16, 24, 32, 48. Radius 12 (input/tombol) dan 16 (kartu, gelembung chat).
- Target sentuh minimal 44×44px. Input tinggi minimal 48px.

## Gerak
- Transform/opacity saja. Masuk 200–260ms (ease-out), keluar 140–180ms.
- Indikator mengetik bot maksimal ~600ms. Hormati `prefers-reduced-motion` (tanpa animasi, pesan langsung tampil).

## Komponen kunci
- Gelembung bot (kiri) dan pengguna (kanan), `role="log"` + `aria-live="polite"` pada daftar pesan.
- Bilah input adaptif per jenis: teks, email, telepon, tanggal, teks panjang, unggah file. Selalu ada tombol "Lewati" untuk pertanyaan opsional.
- Progres "Pertanyaan n dari N" + bagian (A–D untuk gratifikasi).
- Ringkasan sebelum kirim (dapat diedit per jawaban), lalu layar sukses dengan kode referensi.
- Ikon: Phosphor (`@phosphor-icons/react`), gaya konsisten, tanpa emoji.

## Aksesibilitas
- Fokus terlihat 2–3px, skip link, urutan tab sesuai visual, label terlihat (bukan placeholder saja).
- Kesalahan di dekat kolom + `aria-describedby`; pesan menyebut penyebab dan cara memperbaiki.
- Setelah pesan baru, fokus tetap di bilah input. Toast tidak mencuri fokus.

## Hindari
- Tema gelap-saja, dekorasi berlebihan, emoji sebagai ikon, kontras rendah abu di abu, animasi width/height.
