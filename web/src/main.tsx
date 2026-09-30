import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import './styles.css';
import './dashboard.css';

// Jendela popup login Microsoft kembali ke halaman ini membawa ?code=/#code=. Jangan render aplikasi di popup:
// jendela induk (MSAL) yang membaca hasilnya lalu menutup popup.
const inAuthPopup = window.opener && window.opener !== window && /[#&?](code|error)=/.test(window.location.hash + window.location.search);

if (!inAuthPopup) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
}
