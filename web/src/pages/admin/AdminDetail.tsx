import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, DownloadSimple, Paperclip } from '@phosphor-icons/react';
import { formatDateTime } from '../../format';
import { href } from '../../router';
import { formatBytes, formatDateId } from '../../validate';
import { ApiError, downloadUrl, getReport, updateReport, type ReportDetail } from './adminApi';

const STATUS_TEXT: Record<string, string> = { baru: 'Baru', ditinjau: 'Sedang ditinjau', selesai: 'Selesai' };

export function AdminDetail({ id, onAuthLost }: { id: number; onAuthLost: (message: string) => void }) {
  const [r, setR] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('baru');
  const [adminNote, setAdminNote] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fail = (e: unknown) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) onAuthLost(e.message);
    else setError(e instanceof Error ? e.message : String(e));
  };

  useEffect(() => {
    setR(null);
    setError(null);
    getReport(id)
      .then((d) => {
        setR(d);
        setStatus(d.status);
        setAdminNote(d.adminNote);
        setPublicNote(d.publicNote);
      })
      .catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!r) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await updateReport(r.id, status, adminNote, publicNote);
      setR({ ...r, status, adminNote, publicNote, updatedAt: res.updatedAt });
      setSaved(true);
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const back = (
    <a className="back-link" href={href('admin')}>
      <ArrowLeft size={16} aria-hidden="true" /> Semua laporan
    </a>
  );

  if (!r) {
    return (
      <>
        {back}
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="muted">Memuat…</p>
        )}
      </>
    );
  }

  let lastSection: string | null = null;
  return (
    <>
      {back}
      <div className="detail">
        <div className="detail__main">
          <section className="panel">
            <div className="result__head">
              <div>
                <p className="result__ref">{r.ref}</p>
                <p className="muted small">
                  {r.typeTitle} · masuk {formatDateTime(r.createdAt)}
                  {r.updatedAt && ` · diperbarui ${formatDateTime(r.updatedAt)}`}
                </p>
              </div>
              <span className={`badge badge--${r.status}`}>{STATUS_TEXT[r.status] ?? r.status}</span>
            </div>
            <dl className="answers">
              {r.answers.map((a) => {
                const head = a.section && a.section !== lastSection ? a.section : null;
                if (a.section) lastSection = a.section;
                return (
                  <div key={a.key}>
                    {head && <div className="doc__section">{head}</div>}
                    <div className="answers__item">
                      <dt>{a.label}</dt>
                      <dd className={a.value ? '' : 'muted'}>{a.value ? (a.type === 'date' ? formatDateId(a.value) : a.value) : 'Tidak diisi'}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel">
            <h2 className="panel__title">
              <Paperclip size={20} aria-hidden="true" /> Lampiran ({r.attachments.length})
            </h2>
            {r.attachments.length === 0 ? (
              <p className="muted">Tidak ada lampiran.</p>
            ) : (
              <ul className="files">
                {r.attachments.map((f) => (
                  <li key={f.id}>
                    <a className="files__item" href={downloadUrl(f.id)}>
                      <DownloadSimple size={18} aria-hidden="true" />
                      <span className="files__name">{f.name}</span>
                      <span className="muted small">{formatBytes(f.size)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form className="panel" onSubmit={(e) => void save(e)}>
            <h2 className="panel__title">Tindak lanjut</h2>
            <label className="field-label" htmlFor="st">
              Status
            </label>
            <select id="st" className="input" value={status} onChange={(e) => (setStatus(e.target.value), setSaved(false))}>
              {Object.entries(STATUS_TEXT).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="pub">
              Tanggapan untuk pelapor
            </label>
            <textarea id="pub" className="input input--area" rows={3} value={publicNote} maxLength={2000} onChange={(e) => (setPublicNote(e.target.value), setSaved(false))} />
            <p className="muted small">Tampil di menu Lacak laporan bagi pemegang kode laporan.</p>
            <label className="field-label" htmlFor="note">
              Catatan internal
            </label>
            <textarea id="note" className="input input--area" rows={4} value={adminNote} maxLength={4000} onChange={(e) => (setAdminNote(e.target.value), setSaved(false))} />
            <p className="muted small">Hanya terlihat oleh admin.</p>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn--primary btn--wide" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
            {saved && (
              <p className="saved" role="status">
                <CheckCircle size={18} weight="fill" aria-hidden="true" /> Tersimpan
              </p>
            )}
          </form>

          <section className="panel">
            <h2 className="panel__title">Notifikasi email</h2>
            <p className={r.emailStatus?.startsWith('gagal') ? 'field-error' : 'muted small'}>{r.emailStatus ?? 'Belum ada catatan.'}</p>
          </section>
        </aside>
      </div>
    </>
  );
}
