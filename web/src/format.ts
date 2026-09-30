const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** '2026-09-30 14:05:00' → '30 Sep 2026, 14.05' (waktu server, WIB). */
export function formatDateTime(s: string | null | undefined): string {
  if (!s) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s);
  if (!m) return s;
  const date = `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return m[4] ? `${date}, ${m[4]}.${m[5]}` : date;
}

export const STATUS_LABEL: Record<string, string> = {
  baru: 'Diterima',
  ditinjau: 'Sedang ditinjau',
  selesai: 'Selesai',
};

export const STATUS_ORDER = ['baru', 'ditinjau', 'selesai'] as const;
