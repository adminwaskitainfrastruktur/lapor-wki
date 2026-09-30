export interface AdminUser {
  email: string;
  name: string;
}

export interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  daily: { date: string; count: number }[];
  mailFail: number;
  statuses: Record<string, string>;
  types: Record<string, string>;
}

export interface ReportRow {
  id: number;
  ref: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  emailStatus: string | null;
  files: number;
  snippet: string;
}

export interface ReportDetail {
  id: number;
  ref: string;
  type: string;
  typeTitle: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  emailStatus: string | null;
  adminNote: string;
  publicNote: string;
  answers: { key: string; label: string; section: string | null; type: string; value: string }[];
  attachments: { id: number; name: string; mime: string; size: number }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public email?: string,
  ) {
    super(message);
  }
}

const BASE = 'admin-api.php';
let csrf = '';

async function call<T>(action: string, init?: { method?: string; body?: unknown; query?: Record<string, string> }): Promise<T> {
  const q = new URLSearchParams({ action, ...(init?.query ?? {}) });
  let res: Response;
  try {
    res = await fetch(`${BASE}?${q}`, {
      method: init?.method ?? 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Koneksi terputus. Periksa internet lalu coba lagi.', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new ApiError(data?.error ?? `Permintaan gagal (${res.status}).`, res.status, data?.email);
  }
  return data as T;
}

export async function me(): Promise<AdminUser | null> {
  try {
    const r = await call<{ user: AdminUser; csrf: string }>('me');
    csrf = r.csrf;
    return r.user;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export async function login(token: string): Promise<AdminUser> {
  const r = await call<{ user: AdminUser; csrf: string }>('login', { method: 'POST', body: { token } });
  csrf = r.csrf;
  return r.user;
}

export async function logout(): Promise<void> {
  await call('logout', { method: 'POST', body: {} }).catch(() => undefined);
  csrf = '';
}

export const getStats = () => call<Stats & { ok: true }>('stats');

export const listReports = (f: { type: string; status: string; q: string }) =>
  call<{ rows: ReportRow[] }>('list', { query: f }).then((r) => r.rows);

export const getReport = (id: number) => call<{ report: ReportDetail }>('detail', { query: { id: String(id) } }).then((r) => r.report);

export const updateReport = (id: number, status: string, adminNote: string, publicNote: string) =>
  call<{ updatedAt: string }>('update', { method: 'POST', body: { id, status, adminNote, publicNote } });

export const downloadUrl = (attachmentId: number) => `${BASE}?action=download&id=${attachmentId}`;
export const csvUrl = () => `${BASE}?action=csv`;
