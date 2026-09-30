import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Copy, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { href } from '../router';

interface Props {
  code: string;
  onClose: () => void;
}

/**
 * Popup wajib setelah laporan terkirim: menampilkan kode laporan dan mengingatkan pelapor untuk menyimpannya.
 * Kode adalah satu-satunya cara melacak laporan, dan tidak bisa dikirim ulang karena identitas pelapor tidak dicatat.
 */
export function CodeDialog({ code, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // clipboard tidak tersedia (mis. http): pilih teks agar bisa disalin manual
      const sel = window.getSelection();
      const el = document.getElementById('report-code');
      if (sel && el) {
        sel.removeAllRanges();
        const r = document.createRange();
        r.selectNodeContents(el);
        sel.addRange(r);
      }
    }
  };

  return (
    <dialog
      ref={ref}
      className="code-dialog"
      aria-labelledby="code-title"
      aria-describedby="code-desc"
      // Esc tidak menutup diam-diam; pelapor harus menekan tombol konfirmasi.
      // keydown perlu dicegah juga: Chrome tetap menutup dialog pada Esc kedua bila hanya 'cancel' yang dicegah.
      onCancel={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.preventDefault();
      }}
    >
      <div className="code-dialog__body">
        <CheckCircle size={44} weight="fill" className="code-dialog__ok" aria-hidden="true" />
        <h2 id="code-title" className="code-dialog__title">
          Laporan Anda sudah terkirim
        </h2>
        <p className="code-dialog__label">Kode laporan Anda</p>
        <p className="code-dialog__code" id="report-code">
          {code}
        </p>
        <button type="button" className="btn btn--outline" onClick={() => void copy()}>
          {copied ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copied ? 'Kode tersalin' : 'Salin kode'}
        </button>
        <div className="code-dialog__warn" role="note" id="code-desc">
          <WarningCircle size={22} weight="fill" aria-hidden="true" />
          <p>
            <strong>Simpan kode ini untuk melacak laporan Anda nanti.</strong> Kami tidak mencatat identitas Anda, sehingga kode ini tidak bisa dikirim ulang bila hilang. Catat atau salin
            sekarang.
          </p>
        </div>
        <div className="code-dialog__actions">
          <button type="button" className="btn btn--primary btn--wide" onClick={onClose}>
            Saya sudah menyimpan kode
          </button>
          <a className="btn btn--ghost" href={href('lacak', { ref: code })} onClick={onClose}>
            <MagnifyingGlass size={18} aria-hidden="true" /> Lacak laporan ini
          </a>
        </div>
      </div>
    </dialog>
  );
}
