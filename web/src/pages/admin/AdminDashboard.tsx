import { useEffect, useMemo, useState } from 'react';
import { DownloadSimple, EnvelopeSimple, MagnifyingGlass, Paperclip, Warning } from '@phosphor-icons/react';
import { formatDateTime } from '../../format';
import { href } from '../../router';
import { ApiError, csvUrl, getStats, listReports, type ReportRow, type Stats } from './adminApi';

const STATUS_TEXT: Record<string, string> = { baru: 'Baru', ditinjau: 'Sedang ditinjau', selesai: 'Selesai' };

export function AdminDashboard({ onAuthLost }: { onAuthLost: (message: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  const fail = (e: unknown) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) onAuthLost(e.message);
    else setError(e instanceof Error ? e.message : String(e));
  };

  useEffect(() => {
    getStats().then(setStats).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRows(null);
    listReports({ type, status, q: query }).then(setRows).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, query]);

  const maxDaily = useMemo(() => Math.max(1, ...(stats?.daily.map((d) => d.count) ?? [1])), [stats]);

  return (
    <>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      <section className="stats" aria-label="Ringkasan">
        <div className="stat">
          <span className="stat__label">Total laporan</span>
          <span className="stat__value">{stats?.total ?? '–'}</span>
          <span className="stat__meta">
            {stats ? Object.entries(stats.byType).map(([k, n]) => `${stats.types[k] ?? k}: ${n}`).join(' · ') : ' '}
          </span>
        </div>
        {(['baru', 'ditinjau', 'selesai'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`stat stat--${s} stat--btn`}
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? '' : s)}
          >
            <span className="stat__label">{STATUS_TEXT[s]}</span>
            <span className="stat__value">{stats?.byStatus[s] ?? '–'}</span>
            <span className="stat__meta">{status === s ? 'Filter aktif, klik untuk hapus' : 'Klik untuk menyaring'}</span>
          </button>
        ))}
      </section>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="trend-title">
          <h2 className="panel__title" id="trend-title">
            Laporan 14 hari terakhir
          </h2>
          <div className="bars" role="img" aria-label={stats ? stats.daily.map((d) => `${formatDateTime(d.date)}: ${d.count}`).join(', ') : 'Memuat'}>
            {stats?.daily.map((d) => (
              <div key={d.date} className="bars__col" title={`${formatDateTime(d.date)}: ${d.count} laporan`}>
                <span className="bars__n">{d.count || ''}</span>
                <span className="bars__bar" style={{ height: `${(d.count / maxDaily) * 100}%` }} />
                <span className="bars__d">{Number(d.date.slice(8))}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel" aria-labelledby="health-title">
          <h2 className="panel__title" id="health-title">
            <EnvelopeSimple size={20} aria-hidden="true" /> Notifikasi email
          </h2>
          {stats && stats.mailFail > 0 ? (
            <div className="alert">
              <Warning size={20} weight="fill" aria-hidden="true" />
              <span>
                <strong>{stats.mailFail} laporan</strong> gagal dikirim ke email tim. Laporan tetap tersimpan di sini.
              </span>
            </div>
          ) : (
            <p className="muted">{stats ? 'Semua notifikasi email terkirim.' : 'Memuat…'}</p>
          )}
          <a className="btn btn--outline" href={csvUrl()}>
            <DownloadSimple size={18} aria-hidden="true" /> Ekspor CSV
          </a>
        </section>
      </div>

      <section className="panel" aria-labelledby="list-title">
        <div className="toolbar">
          <h2 className="panel__title" id="list-title">
            Daftar laporan {rows && <span className="muted small">({rows.length})</span>}
          </h2>
          <form
            className="toolbar__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(q.trim());
            }}
          >
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input className="input input--sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode atau isi laporan" aria-label="Cari laporan" />
          </form>
          <select className="input input--sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Jenis laporan">
            <option value="">Semua jenis</option>
            {stats && Object.entries(stats.types).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
          <select className="input input--sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Semua status</option>
            {Object.entries(STATUS_TEXT).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {!rows ? (
          <p className="muted">Memuat…</p>
        ) : rows.length === 0 ? (
          <p className="muted">Tidak ada laporan yang cocok.</p>
        ) : (
          <ul className="reports">
            {rows.map((r) => (
              <li key={r.id}>
                <a className="report-row" href={href('admin', { id: r.id })}>
                  <span className="report-row__main">
                    <span className="report-row__ref">{r.ref}</span>
                    <span className="report-row__snippet">{r.snippet || <span className="muted">Tanpa uraian</span>}</span>
                  </span>
                  <span className="report-row__meta">
                    <span className={`badge badge--${r.status}`}>{STATUS_TEXT[r.status] ?? r.status}</span>
                    <span className="muted small">{stats?.types[r.type] ?? r.type}</span>
                    <span className="muted small">{formatDateTime(r.createdAt)}</span>
                    {r.files > 0 && (
                      <span className="muted small">
                        <Paperclip size={14} aria-hidden="true" /> {r.files}
                      </span>
                    )}
                    {r.emailStatus?.startsWith('gagal') && <span className="badge badge--warn">Email gagal</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
