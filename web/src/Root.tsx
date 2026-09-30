import { lazy, Suspense, useEffect } from 'react';
import App from './App';
import { SideNav } from './components/SideNav';
import { TrackPage } from './pages/TrackPage';
import { useRoute } from './router';
import { getTheme } from './theme';

// Dashboard admin (beserta MSAL) dimuat terpisah agar halaman pelapor tetap ringan.
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

const TITLES = { chat: 'Layanan Pelaporan', lacak: 'Lacak laporan', admin: 'Dashboard admin' } as const;

export default function Root() {
  const route = useRoute();
  const theme = getTheme();

  useEffect(() => {
    document.title = `${TITLES[route.page]} | PT Waskita Karya Infrastruktur`;
  }, [route.page]);

  const id = Number(route.params.get('id'));

  return (
    <div className="frame" data-theme={theme} data-page={route.page}>
      <SideNav page={route.page} />
      <div className="frame__main">
        {/* Chat tetap terpasang saat berpindah menu supaya percakapan yang sedang diisi tidak hilang. */}
        <div className="frame__chat" hidden={route.page !== 'chat'}>
          <App />
        </div>
        {route.page === 'lacak' && <TrackPage initialRef={route.params.get('ref') ?? ''} />}
        {route.page === 'admin' && (
          <Suspense fallback={<p className="page muted">Memuat dashboard…</p>}>
            <AdminPage reportId={Number.isFinite(id) && id > 0 ? id : null} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
