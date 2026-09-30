/**
 * Placeholder logo WKI. Ganti isi komponen ini dengan <img src="/logo-wki.svg" alt="" /> begitu file logo resmi tersedia.
 */
export function Logo({ size = 42, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <span className={'logo' + (inverse ? ' logo--inverse' : '')} style={{ width: size, height: size }} aria-hidden="true">
      <span className="logo__text">WKI</span>
      <span className="logo__bar" />
    </span>
  );
}
