/** Kode laporan yang dikirim dari perangkat ini. Hanya tersimpan di browser pelapor, tidak dikirim ke server. */
export interface SavedReport {
  ref: string;
  title: string;
  at: string; // ISO
}

const KEY = 'lapor-wki:refs';

export function loadReports(): SavedReport[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? (v as SavedReport[]).filter((r) => r && typeof r.ref === 'string') : [];
  } catch {
    return [];
  }
}

export function saveReport(r: SavedReport): void {
  try {
    const list = [r, ...loadReports().filter((x) => x.ref !== r.ref)].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* penyimpanan browser tidak tersedia: abaikan */
  }
}

export function forgetReport(ref: string): SavedReport[] {
  const list = loadReports().filter((x) => x.ref !== ref);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* abaikan */
  }
  return list;
}
