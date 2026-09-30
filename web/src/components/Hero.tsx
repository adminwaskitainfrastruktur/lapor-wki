import { EyeSlash, LockKey, Paperclip, UserCircleMinus } from '@phosphor-icons/react';
import { Logo } from './Logo';

const MAIN_SITE = 'https://waskitainfrastruktur.co.id';

const POINTS = [
  { icon: EyeSlash, title: 'Identitas dirahasiakan', text: 'Nama boleh dikosongkan. Kami tidak mencatat alamat IP Anda.' },
  { icon: UserCircleMinus, title: 'Tanpa login', text: 'Tidak perlu akun. Bisa diisi dari ponsel maupun komputer.' },
  { icon: Paperclip, title: 'Lampirkan bukti', text: 'Foto, dokumen, atau video pendukung bisa diunggah langsung.' },
  { icon: LockKey, title: 'Langsung ke tim berwenang', text: 'Laporan hanya diterima oleh pihak yang menanganinya.' },
];

/** Panel identitas (tema A, layar lebar). Disembunyikan di tema B/C dan di ponsel lewat CSS. */
export function Hero() {
  return (
    <aside className="hero" aria-label="Tentang layanan">
      <div className="hero__inner">
        <div className="hero__brand">
          <Logo size={42} inverse />
          <span className="hero__org">PT Waskita Karya Infrastruktur</span>
        </div>
        <h2 className="hero__title">Suara Anda penting. Laporkan dengan aman.</h2>
        <p className="hero__lead">
          Layanan resmi untuk menyampaikan dugaan pelanggaran (WBS) dan penerimaan gratifikasi, dengan perlindungan kerahasiaan pelapor.
        </p>
        <ul className="hero__points">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="hero__icon" aria-hidden="true">
                <Icon size={22} weight="duotone" />
              </span>
              <span>
                <strong>{title}</strong>
                <span className="hero__text">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <a className="hero__link" href={MAIN_SITE}>
          ← Kembali ke waskitainfrastruktur.co.id
        </a>
      </div>
    </aside>
  );
}
