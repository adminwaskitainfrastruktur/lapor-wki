import { useEffect, useState } from 'react';

export type Page = 'chat' | 'lacak' | 'admin';

export interface Route {
  page: Page;
  params: URLSearchParams;
}

/** Routing sederhana berbasis hash: #/ (chat), #/lacak, #/admin?id=12. Halaman utama tetap chatbot. */
export function parseHash(hash: string = window.location.hash): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  // Balasan login Microsoft (#code=... / #error=...) diproses oleh halaman admin
  if (/^(code|error|state)=/.test(path)) return { page: 'admin', params: new URLSearchParams() };
  const page: Page = path === 'lacak' ? 'lacak' : path === 'admin' ? 'admin' : 'chat';
  return { page, params: new URLSearchParams(query) };
}

// Saat kembali dari login Microsoft (mode redirect), MSAL menghapus #code=... dari URL dan memicu hashchange.
// Selama balasan itu diproses, tetap di halaman admin agar prosesnya tidak terputus.
let authReturn = /^#\/?(code|error|state)=/.test(window.location.hash);

export function endAuthReturn(): void {
  authReturn = false;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const on = () => {
      if (authReturn && !/^#\/?admin/.test(window.location.hash)) return;
      setRoute(parseHash());
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function href(page: Page, params?: Record<string, string | number>): string {
  const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
  return page === 'chat' ? '#/' + q : `#/${page}${q}`;
}

export function go(page: Page, params?: Record<string, string | number>): void {
  window.location.hash = href(page, params);
}
