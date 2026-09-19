import type { AuthProviderProps } from 'react-oidc-context';

export const oidcAuthority = import.meta.env.VITE_OIDC_AUTHORITY;
export const oidcClientId = import.meta.env.VITE_OIDC_CLIENT_ID;

export const isOidcConfigured = Boolean(oidcAuthority && oidcClientId);

export const oidcConfig: AuthProviderProps = {
  authority: oidcAuthority,
  client_id: oidcClientId,
  redirect_uri: window.location.origin,
  scope: import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
