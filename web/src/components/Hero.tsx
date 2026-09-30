import { EyeSlash, LockKey, Paperclip, ShieldCheck, UserCircleMinus } from '@phosphor-icons/react';

const MAIN_SITE = 'https://waskitainfrastruktur.co.id';

const POINTS = [
  { icon: EyeSlash, title: 'Identitas dirahasiakan', text: 'Nama boleh dikosongkan. Kami tidak mencatat alamat IP Anda.' },
  { icon: UserCircleMinus, title: 'Tanpa login', text: 'Tidak perlu akun. Bisa diisi dari ponsel maupun komputer.' },
  { icon: Paperclip, title: 'Lampirkan bukti', text: 'Foto, dokumen, atau video pendukung bisa diunggah langsung.' },
  { icon: LockKey, title: 'Langsung ke tim berwenang', text: 'Laporan hanya diterima oleh pihak yang menanganinya.' },
];

/** Panel identitas untuk layar lebar. Disembunyikan di ponsel (brand tampil di header chat). */
export function Hero() {
  return (
    <aside className="hero" aria-label="Tentang layanan">
      <div className="hero__inner">
        <div className="hero__brand">
          <span className="hero__mark" aria-hidden="true">
            <ShieldCheck size={30} weight="fill" />
          </span>
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
          &larr; Kembali ke waskitainfrastruktur.co.id
        </a>
      </div>
    </aside>
  );
}
