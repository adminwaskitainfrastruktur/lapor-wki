import { PencilSimple } from '@phosphor-icons/react';
import type { Answers, Flow, Phase } from '../types';
import { formatDateId } from '../validate';

interface Props {
  flow: Flow | null;
  answers: Answers;
  idx: number;
  phase: Phase;
  /** Baris dengan indeks < reached sudah pernah ditanyakan dan boleh diubah. */
  reached: number;
  /** True saat bot sedang mengetik atau laporan sedang dikirim. */
  locked: boolean;
  onEdit: (index: number) => void;
}

/** Tema C: berkas laporan yang terisi langsung selagi pelapor menjawab. Baris yang sudah dilewati bisa diklik untuk diubah. Hanya tampil di layar lebar. */
export function DocPanel({ flow, answers, idx, phase, reached, locked, onEdit }: Props) {
  const filled = flow ? flow.steps.filter((s) => answers[s.key]).length : 0;
  const canEdit = phase === 'asking' || phase === 'files' || phase === 'review';
  return (
    <aside className="doc" aria-label="Berkas laporan">
      <div className="doc__head">
        <h2 className="doc__title">Berkas laporan</h2>
        {flow && (
          <span className="doc__count">
            {filled}/{flow.steps.length}
          </span>
        )}
      </div>
      <p className="doc__sub">{canEdit ? 'Terisi otomatis. Klik baris untuk mengubah jawaban.' : 'Terisi otomatis saat Anda menjawab.'}</p>
      {!flow && <p className="muted">Pilih jenis laporan untuk memulai.</p>}
      {flow?.steps.map((s, i) => {
        const v = answers[s.key];
        const current = phase === 'asking' && i === idx;
        const editable = canEdit && i < reached && !current;
        const value = v ? (s.type === 'date' ? formatDateId(v) : v) : '—';
        const content = (
          <>
            <span className={'doc__dot' + (v ? ' doc__dot--done' : current ? ' doc__dot--now' : '')} aria-hidden="true" />
            <span className="doc__body">
              <span className="doc__label">{s.label}</span>
              <span className={'doc__value' + (v ? '' : ' muted')}>{value}</span>
            </span>
            {editable && <PencilSimple className="doc__edit" size={16} aria-hidden="true" />}
          </>
        );
        return (
          <div key={s.key}>
            {s.section && <div className="doc__section">{s.section}</div>}
            {editable ? (
              <button type="button" className="doc__row doc__row--btn" onClick={() => onEdit(i)} disabled={locked} aria-label={`Ubah jawaban: ${s.label}. Saat ini: ${v ? value : 'belum diisi'}`}>
                {content}
              </button>
            ) : (
              <div className={'doc__row' + (current ? ' doc__row--now' : '')}>{content}</div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
