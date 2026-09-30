import { ArrowLeft, ChatCircleDots, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react';
import { href, type Page } from '../router';
import { Logo } from './Logo';

const MAIN_SITE = 'https://waskitainfrastruktur.co.id';

const ITEMS: { page: Page; label: string; short: string; icon: typeof ChatCircleDots }[] = [
  { page: 'chat', label: 'Buat laporan', short: 'Lapor', icon: ChatCircleDots },
  { page: 'lacak', label: 'Lacak laporan', short: 'Lacak', icon: MagnifyingGlass },
  { page: 'admin', label: 'Admin', short: 'Admin', icon: ShieldCheck },
];

/** Navigasi utama. Layar lebar: sidebar kiri. Ponsel: bilah atas ringkas. */
export function SideNav({ page }: { page: Page }) {
  return (
    <nav className="sidenav" aria-label="Menu utama">
      <a className="sidenav__brand" href={href('chat')}>
        <Logo size={36} />
        <span>
          <span className="sidenav__title">Layanan Pelaporan</span>
          <span className="sidenav__sub">PT Waskita Karya Infrastruktur</span>
        </span>
      </a>
      <ul className="sidenav__list">
        {ITEMS.map(({ page: p, label, short, icon: Icon }) => (
          <li key={p} className={p === 'admin' ? 'sidenav__item--admin' : undefined}>
            <a className="sidenav__link" href={href(p)} aria-current={page === p ? 'page' : undefined}>
              <Icon size={20} weight={page === p ? 'fill' : 'regular'} aria-hidden="true" />
              <span className="sidenav__label">{label}</span>
              <span className="sidenav__short">{short}</span>
            </a>
          </li>
        ))}
      </ul>
      <a className="sidenav__back" href={MAIN_SITE}>
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke website
      </a>
    </nav>
  );
}
