import { useEffect, useState } from 'react';
import { ChatCenteredText, CheckCircle, Circle, ClockCounterClockwise, MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { trackReport } from '../api';
import { formatDateTime, STATUS_LABEL, STATUS_ORDER } from '../format';
import { forgetReport, loadReports, type SavedReport } from '../myReports';
import type { TrackedReport } from '../types';

const STEP_TEXT: Record<string, string> = {
  baru: 'Laporan tercatat dan menunggu ditinjau tim berwenang.',
  ditinjau: 'Tim sedang menelaah laporan Anda.',
  selesai: 'Penanganan laporan telah selesai.',
};

/** Dashboard pelapor: cek status dengan kode laporan, plus daftar laporan yang dikirim dari perangkat ini. */
export function TrackPage({ initialRef }: { initialRef: string }) {
  const [code, setCode] = useState(initialRef);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedReport | null>(null);
  const [mine, setMine] = useState<SavedReport[]>(() => loadReports());

  const lookup = async (ref: string) => {
    const clean = ref.trim().toUpperCase();
    setCode(clean);
    if (!clean) {
      setResult(null);
      setError('Masukkan kode laporan terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await trackReport(clean);
    setBusy(false);
    if (res.ok && res.report) {
      setResult(res.report);
    } else {
      setResult(null);
      setError(res.error ?? 'Laporan tidak ditemukan.');
    }
  };

  useEffect(() => {
    setMine(loadReports());
    if (initialRef) void lookup(initialRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef]);

  const current = result ? STATUS_ORDER.indexOf(result.status as (typeof STATUS_ORDER)[number]) : -1;

  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Dashboard pelapor</p>
        <h1 className="page__title">Lacak laporan</h1>
        <p className="page__lead">Masukkan kode laporan yang Anda terima setelah mengirim laporan untuk melihat status tindak lanjutnya.</p>
      </header>

      <form
        className="panel track-form"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code);
        }}
      >
        <label className="field-label" htmlFor="ref">
          Kode laporan
        </label>
        <div className="track-form__row">
          <input
            id="ref"
            className="input input--mono"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="WBS-AB12CD34"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'ref-error' : undefined}
          />
          <button type="submit" className="btn btn--primary" disabled={busy}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            {busy ? 'Mencari…' : 'Cek status'}
          </button>
        </div>
        {error && (
          <p className="field-error" id="ref-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section className="panel" aria-label={`Status laporan ${result.ref}`}>
          <div className="result__head">
            <div>
              <p className="result__ref">{result.ref}</p>
              <p className="muted small">
                {result.typeTitle} · masuk {formatDateTime(result.createdAt)}
              </p>
            </div>
            <span className={`badge badge--${result.status}`}>{STATUS_LABEL[result.status] ?? result.status}</span>
          </div>
          <ol className="steps">
            {STATUS_ORDER.map((s, i) => {
              const state = i < current ? 'done' : i === current ? 'now' : 'todo';
              return (
                <li key={s} className={`steps__item steps__item--${state}`}>
                  {state === 'todo' ? <Circle size={22} aria-hidden="true" /> : <CheckCircle size={22} weight="fill" aria-hidden="true" />}
                  <div>
                    <p className="steps__title">{STATUS_LABEL[s]}</p>
                    {state !== 'todo' && <p className="muted small">{STEP_TEXT[s]}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {result.publicNote && (
            <div className="note">
              <p className="note__title">
                <ChatCenteredText size={18} aria-hidden="true" /> Tanggapan tim
              </p>
              <p className="note__body">{result.publicNote}</p>
            </div>
          )}
          <p className="muted small">Terakhir diperbarui: {formatDateTime(result.updatedAt ?? result.createdAt)}</p>
        </section>
      )}

      <section className="panel" aria-labelledby="mine-title">
        <h2 className="panel__title" id="mine-title">
          <ClockCounterClockwise size={20} aria-hidden="true" /> Laporan dari perangkat ini
        </h2>
        {mine.length === 0 ? (
          <p className="muted">Belum ada. Kode laporan yang Anda kirim dari browser ini akan muncul di sini.</p>
        ) : (
          <ul className="mine">
            {mine.map((r) => (
              <li key={r.ref} className="mine__item">
                <button type="button" className="mine__open" onClick={() => void lookup(r.ref)}>
                  <span className="mine__ref">{r.ref}</span>
                  <span className="muted small">
                    {r.title} · {new Date(r.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </button>
                <button type="button" className="icon-btn" onClick={() => setMine(forgetReport(r.ref))} aria-label={`Hapus ${r.ref} dari perangkat ini`}>
                  <Trash size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">Daftar ini hanya tersimpan di browser Anda dan tidak dikirim ke server. Hapus bila perangkat dipakai bersama.</p>
      </section>
    </main>
  );
}
