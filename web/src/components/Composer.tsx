import { useEffect, useRef, useState } from 'react';
import { ArrowClockwise, CaretRight, Gift, PaperPlaneTilt, Paperclip, ShieldWarning, UploadSimple, X } from '@phosphor-icons/react';
import type { Flow, Step, UploadRules } from '../types';
import { formatBytes, validateFiles } from '../validate';

/* ---------- Pilihan cepat ---------- */
const FLOW_ICONS: Record<string, typeof Gift> = { wbs: ShieldWarning, gratifikasi: Gift };

export function QuickReplies({ flows, onPick }: { flows: Record<string, Flow>; onPick: (id: string) => void }) {
  return (
    <div className="composer composer--choices" role="group" aria-label="Pilih jenis laporan">
      {Object.entries(flows).map(([id, f]) => {
        const Icon = FLOW_ICONS[id] ?? ShieldWarning;
        return (
          <button key={id} type="button" className="choice" onClick={() => onPick(id)}>
            <span className="choice__icon" aria-hidden="true">
              <Icon size={26} weight="duotone" />
            </span>
            <span className="choice__body">
              <span className="choice__title">{f.button}</span>
              <span className="choice__blurb">{f.blurb}</span>
            </span>
            <CaretRight size={20} aria-hidden="true" className="choice__caret" />
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Input jawaban ---------- */
interface AnswerProps {
  step: Step;
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onInvalid: (message: string) => void;
  disabled: boolean;
}

export function AnswerInput({ step, value, error, onChange, onSubmit, onSkip, onInvalid, disabled }: AnswerProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const errId = 'answer-error';

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [step.key, disabled]);

  const common = {
    id: 'answer',
    'aria-label': step.q,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
    value,
    disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  // Tanggal yang diketik tidak valid atau melewati hari ini dianggap kosong oleh browser; beri tahu pengguna.
  const trySubmit = () => {
    const el = ref.current;
    if (step.type === 'date' && el instanceof HTMLInputElement && !el.value && (el.validity.badInput || el.validity.rangeOverflow)) {
      onInvalid('Tanggal tidak valid atau melewati hari ini. Pilih tanggal kejadian yang benar, atau lewati pertanyaan ini.');
      return;
    }
    onSubmit();
  };

  const keydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      trySubmit();
    }
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        trySubmit();
      }}
    >
      {error && (
        <p id={errId} className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="composer__row">
        {step.type === 'longtext' ? (
          <textarea
            {...common}
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            className="input input--area"
            rows={4}
            maxLength={5000}
            placeholder="Ketik jawaban Anda… (Shift+Enter untuk baris baru)"
            onKeyDown={keydown}
          />
        ) : (
          <input
            {...common}
            ref={ref as React.RefObject<HTMLInputElement>}
            className="input"
            type={step.type === 'date' ? 'date' : step.type === 'email' ? 'email' : step.type === 'tel' ? 'tel' : 'text'}
            inputMode={step.type === 'tel' ? 'tel' : step.type === 'email' ? 'email' : undefined}
            autoComplete="off"
            maxLength={500}
            max={step.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
            placeholder={step.type === 'date' ? '' : 'Ketik jawaban Anda…'}
            onKeyDown={keydown}
          />
        )}
        <button type="submit" className="btn btn--primary btn--icon" disabled={disabled || !value.trim()} aria-label="Kirim jawaban">
          <PaperPlaneTilt size={22} weight="fill" aria-hidden="true" />
        </button>
      </div>
      <div className="composer__actions">
        <button type="button" className="btn btn--ghost" onClick={onSkip} disabled={disabled}>
          Lewati pertanyaan ini
        </button>
        <span className="hint">Boleh dikosongkan</span>
      </div>
    </form>
  );
}

/* ---------- Unggah file ---------- */
interface FilesProps {
  rules: UploadRules;
  files: File[];
  onChange: (f: File[]) => void;
  onNext: () => void;
}

export function FileStep({ rules, files, onChange, onNext }: FilesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const { accepted, problems: p } = validateFiles(files, Array.from(list), rules);
    setProblems(p);
    if (accepted.length) onChange([...files, ...accepted]);
  };

  return (
    <div className="composer">
      <div
        className={'dropzone' + (drag ? ' dropzone--over' : '')}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
      >
        <UploadSimple size={28} aria-hidden="true" />
        <p className="dropzone__title">Tarik file ke sini, atau</p>
        <button type="button" className="btn btn--outline" onClick={() => inputRef.current?.click()}>
          <Paperclip size={20} aria-hidden="true" /> Pilih file
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={rules.extensions.map((e) => '.' + e).join(',')}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="hint">
          Maksimal {rules.maxFiles} file, masing-masing {rules.maxSizeMb} MB. Jenis: {rules.extensions.join(', ')}.
        </p>
      </div>

      {problems.length > 0 && (
        <ul className="field-error" role="alert">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="chips" aria-label="File yang dipilih">
          {files.map((f) => (
            <li key={f.name + f.size} className="chip">
              <Paperclip size={16} aria-hidden="true" />
              <span className="chip__name">{f.name}</span>
              <span className="muted">{formatBytes(f.size)}</span>
              <button type="button" className="icon-btn icon-btn--small" onClick={() => onChange(files.filter((x) => x !== f))} aria-label={`Hapus ${f.name}`}>
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="composer__actions">
        <button type="button" className="btn btn--primary" onClick={onNext}>
          {files.length ? 'Lanjut' : 'Lewati, tidak ada lampiran'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Kirim / ulang ---------- */
export function ReviewActions({ onSend, onRestart, sending, error }: { onSend: () => void; onRestart: () => void; sending: boolean; error: string | null }) {
  return (
    <div className="composer composer--stack">
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="btn btn--primary btn--wide" onClick={onSend} disabled={sending}>
        {sending ? (
          <>
            <span className="spinner" aria-hidden="true" /> Mengirim…
          </>
        ) : (
          <>
            <PaperPlaneTilt size={20} weight="fill" aria-hidden="true" /> Kirim laporan
          </>
        )}
      </button>
      <button type="button" className="btn btn--ghost" onClick={onRestart} disabled={sending}>
        <ArrowClockwise size={18} aria-hidden="true" /> Mulai dari awal
      </button>
    </div>
  );
}

export function DoneActions({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="composer composer--stack">
      <button type="button" className="btn btn--outline btn--wide" onClick={onRestart}>
        Buat laporan baru
      </button>
    </div>
  );
}
