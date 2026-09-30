import { useCallback, useEffect, useState } from 'react';
import { LockKey, MicrosoftOutlookLogo, SignOut, Warning } from '@phosphor-icons/react';
import { fetchFlows } from '../../api';
import type { AuthConfig } from '../../types';
import { endAuthReturn } from '../../router';
import { ApiError, login, logout, me, type AdminUser } from './adminApi';
import { completeRedirect, forgetMicrosoft, isAuthResponse, signInMicrosoft } from './msal';
import { AdminDashboard } from './AdminDashboard';
import { AdminDetail } from './AdminDetail';

type Gate = { s: 'checking' } | { s: 'out'; error?: string; denied?: string } | { s: 'busy' } | { s: 'in'; user: AdminUser };

/** Dashboard admin. Hanya akun Microsoft 365 yang terdaftar di server (auth.admins) yang bisa masuk. */
export default function AdminPage({ reportId }: { reportId: number | null }) {
  const [gate, setGate] = useState<Gate>({ s: 'checking' });
  const [auth, setAuth] = useState<AuthConfig | null>(null);

  const handleError = useCallback(async (e: unknown, cfg: AuthConfig | null) => {
    // Ditolak karena akun tidak terdaftar (server menyertakan email). 403 lain (mis. asal permintaan) tampil sebagai galat biasa.
    if (e instanceof ApiError && e.status === 403 && e.email) {
      if (cfg) await forgetMicrosoft(cfg).catch(() => undefined);
      setGate({ s: 'out', denied: e.email });
      return;
    }
    const code = (e as { errorCode?: string }).errorCode ?? '';
    setGate({
      s: 'out',
      error:
        code === 'user_cancelled'
          ? 'Login dibatalkan.'
          : e instanceof ApiError
            ? e.message
            : 'Login Microsoft gagal' + (code ? ` (${code})` : '') + '. Coba lagi.',
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cfg: AuthConfig | null = null;
      try {
        cfg = (await fetchFlows()).auth;
        if (!cancelled) setAuth(cfg);
      } catch {
        /* konfigurasi gagal dimuat: tombol login akan memberi tahu */
      }
      // Kembali dari login Microsoft mode redirect (popup diblokir)
      if (cfg?.clientId && isAuthResponse()) {
        setGate({ s: 'busy' });
        try {
          const token = await completeRedirect(cfg);
          endAuthReturn();
          window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&](code|state|session_state|client_info)=[^&]*/g, '') + '#/admin');
          if (token) {
            const user = await login(token);
            if (!cancelled) setGate({ s: 'in', user });
            return;
          }
        } catch (e) {
          endAuthReturn();
          window.history.replaceState(null, '', window.location.pathname + '#/admin');
          if (!cancelled) await handleError(e, cfg);
          return;
        }
      }
      try {
        const u = await me();
        if (!cancelled) setGate(u ? { s: 'in', user: u } : { s: 'out' });
      } catch (e) {
        if (!cancelled) setGate({ s: 'out', error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const signIn = async () => {
    if (!auth?.clientId) {
      setGate({ s: 'out', error: 'Login Microsoft belum dikonfigurasi di server.' });
      return;
    }
    setGate({ s: 'busy' });
    try {
      const token = await signInMicrosoft(auth);
      const user = await login(token);
      setGate({ s: 'in', user });
    } catch (e) {
      await handleError(e, auth);
    }
  };

  const signOut = useCallback(async () => {
    await logout();
    if (auth) await forgetMicrosoft(auth).catch(() => undefined);
    setGate({ s: 'out' });
  }, [auth]);

  /** Dipanggil bila server menolak sesi (kedaluwarsa atau akses dicabut). */
  const onAuthLost = useCallback((message: string) => setGate({ s: 'out', error: message }), []);

  if (gate.s === 'in') {
    return (
      <main className="page page--wide">
        <header className="page__head page__head--row">
          <div>
            <p className="page__eyebrow">Dashboard admin</p>
            <h1 className="page__title">{reportId ? 'Detail laporan' : 'Laporan masuk'}</h1>
          </div>
          <div className="admin-user">
            <span className="admin-user__avatar" aria-hidden="true">
              {gate.user.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <span className="admin-user__text">
              <strong>{gate.user.name}</strong>
              <span className="muted small">{gate.user.email}</span>
            </span>
            <button type="button" className="btn btn--ghost" onClick={() => void signOut()}>
              <SignOut size={18} aria-hidden="true" /> Keluar
            </button>
          </div>
        </header>
        {reportId ? <AdminDetail id={reportId} onAuthLost={onAuthLost} /> : <AdminDashboard onAuthLost={onAuthLost} />}
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Dashboard admin</p>
        <h1 className="page__title">Masuk admin</h1>
        <p className="page__lead">Khusus tim penanganan laporan. Masuk memakai akun Microsoft 365 kantor.</p>
      </header>
      <section className="panel login">
        <span className="login__icon" aria-hidden="true">
          <LockKey size={28} weight="duotone" />
        </span>
        {gate.s === 'out' && gate.denied && (
          <div className="alert" role="alert">
            <Warning size={20} weight="fill" aria-hidden="true" />
            <span>
              <strong>{gate.denied}</strong> tidak memiliki akses admin. Hanya akun yang ditunjuk yang dapat membuka dashboard ini.
            </span>
          </div>
        )}
        {gate.s === 'out' && gate.error && (
          <p className="field-error" role="alert">
            {gate.error}
          </p>
        )}
        <button type="button" className="btn btn--primary btn--wide" onClick={() => void signIn()} disabled={gate.s !== 'out'}>
          <MicrosoftOutlookLogo size={20} weight="fill" aria-hidden="true" />
          {gate.s === 'checking' ? 'Memeriksa sesi…' : gate.s === 'busy' ? 'Menunggu login Microsoft…' : gate.s === 'out' && gate.denied ? 'Masuk dengan akun lain' : 'Masuk dengan Microsoft'}
        </button>
        <p className="muted small">Akun @waskitainfrastruktur.co.id yang tidak terdaftar sebagai admin akan ditolak. Login terbuka di jendela popup.</p>
      </section>
    </main>
  );
}
