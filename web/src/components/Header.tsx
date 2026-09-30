import { LockKey } from '@phosphor-icons/react';
import { Logo } from './Logo';

const MAIN_SITE = 'https://waskitainfrastruktur.co.id';

interface Props {
  flowTitle?: string;
  progress?: { current: number; total: number; section?: string };
}

export function Header({ flowTitle, progress }: Props) {
  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  return (
    <header className="app-header">
      <div className="app-header__row">
        <a className="back-link" href={MAIN_SITE}>
          <span aria-hidden="true">←</span>
          <span>Kembali ke website</span>
        </a>
        <div className="brand">
          <Logo size={40} />
          <div>
            <h1 className="brand__title">Layanan Pelaporan</h1>
            <p className="brand__sub">PT Waskita Karya Infrastruktur{flowTitle ? ` · ${flowTitle}` : ''}</p>
          </div>
        </div>
        <span className="privacy-pill">
          <LockKey size={16} weight="fill" aria-hidden="true" />
          Rahasia · tanpa login
        </span>
      </div>
      {progress && (
        <div className="progress" aria-label={`Kemajuan pengisian: pertanyaan ${progress.current} dari ${progress.total}`}>
          <div className="progress__meta">
            <span>
              Pertanyaan {progress.current} dari {progress.total}
            </span>
            {progress.section && <span className="progress__section">{progress.section}</span>}
          </div>
          <div className="progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="progress__bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </header>
  );
}
