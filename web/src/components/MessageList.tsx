import { useEffect, useRef } from 'react';
import { CheckCircle, PencilSimple, Paperclip, ShieldCheck, Warning } from '@phosphor-icons/react';
import type { Answers, ChatMessage, Flow } from '../types';
import { formatBytes, formatDateId } from '../validate';

interface ListProps {
  messages: ChatMessage[];
  typing: boolean;
  children?: React.ReactNode;
}

export function MessageList({ messages, typing, children }: ListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  // Selalu gulir area percakapan ke bagian paling bawah (tanpa animasi gulir agar tidak terpotong)
  const hasChildren = Boolean(children);
  useEffect(() => {
    const stage = endRef.current?.closest('.stage');
    if (!stage) return;
    const toBottom = () => stage.scrollTo({ top: stage.scrollHeight, behavior: 'auto' });
    toBottom();
    const id = requestAnimationFrame(toBottom);
    return () => cancelAnimationFrame(id);
  }, [messages.length, typing, hasChildren]);

  return (
    <div className="log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Percakapan">
      {messages.map((m, i) => (
        <Bubble key={m.id} message={m} showAvatar={m.role === 'bot' && (i === 0 || messages[i - 1].role !== 'bot' || messages[i - 1].kind === 'section')} />
      ))}
      {typing && (
        <div className="row row--bot" aria-hidden="true">
          <span className="avatar avatar--ghost" />
          <div className="bubble bubble--bot bubble--typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}
      {children}
      <div ref={endRef} />
    </div>
  );
}

function Bubble({ message, showAvatar }: { message: ChatMessage; showAvatar: boolean }) {
  if (message.kind === 'section') {
    return (
      <div className="section-chip" role="separator" aria-label={message.text}>
        <span>{message.text}</span>
      </div>
    );
  }
  const cls = ['bubble', message.role === 'user' ? 'bubble--user' : 'bubble--bot'];
  if (message.kind === 'error') cls.push('bubble--error');
  return (
    <div className={`row row--${message.role}`}>
      {message.role === 'bot' &&
        (showAvatar ? (
          <span className="avatar" aria-hidden="true">
            <ShieldCheck size={18} weight="fill" />
          </span>
        ) : (
          <span className="avatar avatar--ghost" />
        ))}
      <div className={cls.join(' ')}>
        {message.kind === 'error' && <Warning size={18} weight="fill" aria-hidden="true" className="bubble__icon" />}
        <span className="bubble__text">{message.text}</span>
      </div>
    </div>
  );
}

interface ReviewProps {
  flow: Flow;
  answers: Answers;
  files: File[];
  onEdit: (index: number) => void;
  disabled: boolean;
}

export function ReviewCard({ flow, answers, files, onEdit, disabled }: ReviewProps) {
  return (
    <section className="review" aria-label="Ringkasan laporan">
      <h2 className="review__title">Ringkasan laporan</h2>
      <dl className="review__list">
        {flow.steps.map((s, i) => {
          const v = answers[s.key];
          return (
            <div key={s.key} className="review__item">
              <div className="review__text">
                <dt>{s.label}</dt>
                <dd className={v ? '' : 'muted'}>{v ? (s.type === 'date' ? formatDateId(v) : v) : 'Tidak diisi'}</dd>
              </div>
              <button type="button" className="icon-btn" onClick={() => onEdit(i)} disabled={disabled} aria-label={`Ubah jawaban: ${s.label}`}>
                <PencilSimple size={20} aria-hidden="true" />
              </button>
            </div>
          );
        })}
        <div className="review__item">
          <div className="review__text">
            <dt>Lampiran</dt>
            <dd className={files.length ? '' : 'muted'}>
              {files.length ? (
                <ul className="review__files">
                  {files.map((f) => (
                    <li key={f.name + f.size}>
                      <Paperclip size={16} aria-hidden="true" /> {f.name} <span className="muted">({formatBytes(f.size)})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                'Tidak ada'
              )}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}

export function DoneCard({ refCode, outro }: { refCode: string; outro: string }) {
  const copy = () => {
    void navigator.clipboard?.writeText(refCode);
  };
  return (
    <section className="done" aria-label="Laporan terkirim">
      <CheckCircle size={40} weight="fill" className="done__icon" aria-hidden="true" />
      <h2 className="done__title">Laporan terkirim</h2>
      <p>{outro}</p>
      <p className="done__ref-label">Kode referensi Anda</p>
      <p className="done__ref">{refCode}</p>
      <button type="button" className="btn btn--ghost" onClick={copy}>
        Salin kode
      </button>
      <p className="muted small">Simpan kode ini bila Anda ingin menanyakan tindak lanjut. Kami tidak mencatat alamat IP atau identitas Anda.</p>
    </section>
  );
}
