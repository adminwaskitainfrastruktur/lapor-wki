export type Theme = 'a' | 'b' | 'c';

/** A = chat halus (panel identitas), B = satu pertanyaan (tipografis), C = chat + berkas laporan langsung. */
export const DEFAULT_THEME: Theme = 'c';

/** Pilih tema lewat ?tema=a|b|c (untuk review). Setelah dipilih, ganti DEFAULT_THEME dan hapus parameter ini. */
export function getTheme(): Theme {
  const q = new URLSearchParams(window.location.search).get('tema');
  return q === 'a' || q === 'b' || q === 'c' ? q : DEFAULT_THEME;
}
