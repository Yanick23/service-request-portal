import { AuthProvider } from 'react-oidc-context';
import App from './App';
import { AuthGate } from './auth/AuthGate';
import { MissingOidcConfig } from './auth/MissingOidcConfig';
import { isOidcConfigured, oidcConfig } from './auth/config';

export function Root() {
  if (!isOidcConfigured) return <MissingOidcConfig />;

  return (
    <AuthProvider {...oidcConfig}>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  );
}
