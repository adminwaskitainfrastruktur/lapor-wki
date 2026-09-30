import type { Answers, FlowsResponse, TrackedReport } from './types';

let flowsPromise: Promise<FlowsResponse> | null = null;

/** Definisi percakapan + konfigurasi publik. Dimuat sekali lalu dipakai bersama oleh semua halaman. */
export function fetchFlows(): Promise<FlowsResponse> {
  flowsPromise ??= fetch('api.php?action=flows', { headers: { Accept: 'application/json' } }).then(async (res) => {
    if (!res.ok) throw new Error('Gagal memuat layanan (' + res.status + ')');
    return (await res.json()) as FlowsResponse;
  });
  flowsPromise.catch(() => {
    flowsPromise = null;
  });
  return flowsPromise;
}

export async function trackReport(ref: string): Promise<{ ok: boolean; report?: TrackedReport; error?: string }> {
  try {
    const res = await fetch('api.php?action=track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    });
    const data = await res.json().catch(() => null);
    if (data && typeof data.ok === 'boolean') return data;
    return { ok: false, error: 'Server tidak merespons dengan benar (' + res.status + ').' };
  } catch {
    return { ok: false, error: 'Koneksi terputus. Periksa internet Anda lalu coba lagi.' };
  }
}

export interface SubmitResult {
  ok: boolean;
  ref?: string;
  error?: string;
}

export async function submitReport(type: string, answers: Answers, files: File[]): Promise<SubmitResult> {
  const body = new FormData();
  body.append('type', type);
  body.append('answers', JSON.stringify(answers));
  body.append('website', ''); // kolom jebakan bot, dibiarkan kosong
  files.forEach((f) => body.append('files[]', f, f.name));
  try {
    const res = await fetch('api.php?action=submit', { method: 'POST', body });
    const data = (await res.json().catch(() => null)) as SubmitResult | null;
    if (data && typeof data.ok === 'boolean') return data;
    return { ok: false, error: 'Server tidak merespons dengan benar (' + res.status + ').' };
  } catch {
    return { ok: false, error: 'Koneksi terputus. Periksa internet Anda lalu coba lagi.' };
  }
}
