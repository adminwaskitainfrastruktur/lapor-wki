import { PublicClientApplication, type PopupRequest } from '@azure/msal-browser';
import type { AuthConfig } from '../../types';

let pending: Promise<PublicClientApplication> | null = null;

const SCOPES = ['User.Read'];

const REQUEST: PopupRequest = {
  scopes: SCOPES,
  prompt: 'select_account',
  extraQueryParameters: { domain_hint: 'waskitainfrastruktur.co.id' },
};

/** Satu instance saja; janji inisialisasi dipakai bersama agar pemanggilan bersamaan (React StrictMode) tidak memakai instance yang belum siap. */
function getMsal(cfg: AuthConfig): Promise<PublicClientApplication> {
  pending ??= (async () => {
    const instance = new PublicClientApplication({
      auth: {
        clientId: cfg.clientId,
        authority: cfg.authority,
        // Kembali ke halaman ini. Di popup, main.tsx tidak merender aplikasi; pada mode redirect, hasilnya diproses di sini.
        redirectUri: window.location.origin + window.location.pathname,
        navigateToLoginRequestUrl: false,
      },
      cache: { cacheLocation: 'sessionStorage' },
    });
    await instance.initialize();
    return instance;
  })();
  return pending;
}

/** True bila URL saat ini adalah balasan login Microsoft (mode redirect). */
export function isAuthResponse(): boolean {
  return /(^|[#&?])(code|error)=/.test(window.location.hash.replace(/^#\/?/, '') + '&' + window.location.search.slice(1));
}

/**
 * Login Microsoft (sama seperti aplikasi IT Asset: popup). Bila popup diblokir browser, beralih ke mode redirect;
 * fungsi ini lalu tidak kembali karena halaman berpindah ke login.microsoftonline.com.
 * Mengembalikan access token Graph (User.Read) yang dikirim sekali ke server; server yang memutuskan akses admin.
 */
export async function signInMicrosoft(cfg: AuthConfig): Promise<string> {
  const msal = await getMsal(cfg);
  try {
    const res = await msal.loginPopup(REQUEST);
    msal.setActiveAccount(res.account);
    if (res.accessToken) return res.accessToken;
    return (await msal.acquireTokenSilent({ scopes: SCOPES, account: res.account })).accessToken;
  } catch (e) {
    const code = (e as { errorCode?: string }).errorCode ?? '';
    if (code === 'popup_window_error' || code === 'empty_window_error') {
      await msal.loginRedirect(REQUEST);
      return new Promise<string>(() => undefined); // halaman sedang berpindah
    }
    throw e;
  }
}

/** Selesaikan login mode redirect. Mengembalikan access token, atau null bila tidak ada balasan login. */
export async function completeRedirect(cfg: AuthConfig): Promise<string | null> {
  const msal = await getMsal(cfg);
  const res = await msal.handleRedirectPromise();
  if (!res) return null;
  msal.setActiveAccount(res.account);
  return res.accessToken || (await msal.acquireTokenSilent({ scopes: SCOPES, account: res.account })).accessToken;
}

/** Lupakan akun Microsoft di aplikasi ini saja (tidak keluar dari Outlook/Teams). */
export async function forgetMicrosoft(cfg: AuthConfig): Promise<void> {
  const msal = await getMsal(cfg);
  await msal.clearCache();
}
