import type { Step, UploadRules } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mengembalikan pesan kesalahan, atau null jika valid. Jawaban kosong selalu valid (semua opsional). */
export function validateAnswer(step: Step, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const max = step.type === 'longtext' ? 5000 : 500;
  if (v.length > max) return `Terlalu panjang. Maksimal ${max} karakter (sekarang ${v.length}).`;
  if (step.type === 'email' && !EMAIL_RE.test(v)) return 'Format email belum benar. Contoh: nama@perusahaan.co.id';
  if (step.type === 'tel' && !/^[0-9+()\-\s.]{5,25}$/.test(v)) return 'Nomor telepon hanya boleh berisi angka, spasi, +, -, atau tanda kurung.';
  if (step.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Pilih tanggal yang valid.';
  return null;
}

export function validateFiles(current: File[], incoming: File[], rules: UploadRules): { accepted: File[]; problems: string[] } {
  const accepted: File[] = [];
  const problems: string[] = [];
  const maxBytes = rules.maxSizeMb * 1024 * 1024;
  for (const f of incoming) {
    const ext = f.name.includes('.') ? f.name.split('.').pop()!.toLowerCase() : '';
    if (!rules.extensions.includes(ext)) {
      problems.push(`"${f.name}" ditolak: jenis file .${ext || '?'} tidak diizinkan.`);
    } else if (f.size > maxBytes) {
      problems.push(`"${f.name}" ditolak: lebih dari ${rules.maxSizeMb} MB.`);
    } else if (current.length + accepted.length >= rules.maxFiles) {
      problems.push(`"${f.name}" tidak ditambahkan: maksimal ${rules.maxFiles} file.`);
    } else if ([...current, ...accepted].some((x) => x.name === f.name && x.size === f.size)) {
      problems.push(`"${f.name}" sudah ada.`);
    } else {
      accepted.push(f);
    }
  }
  return { accepted, problems };
}

export function formatBytes(n: number): string {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

export function formatDateId(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${Number(m[3])} ${bulan[Number(m[2]) - 1]} ${m[1]}`;
}
