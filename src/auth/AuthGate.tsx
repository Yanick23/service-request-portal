import { useEffect, type ReactNode } from 'react';
import { useAuth, hasAuthParams } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { Alert } from '../components/Alert';
import { setAccessTokenGetter } from '../api/client';

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    setAccessTokenGetter(() => auth.user?.access_token);
  }, [auth.user]);

  useEffect(() => {
    if (auth.isLoading || auth.isAuthenticated || hasAuthParams() || auth.activeNavigator) return;
    auth.signinRedirect();
  }, [auth, auth.isLoading, auth.isAuthenticated, auth.activeNavigator]);

  if (auth.error) {
    return (
      <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 px-4 text-center">
        <Alert variant="danger">Falha na autenticação: {auth.error.message}</Alert>
        <Button onClick={() => auth.signinRedirect()}>Tentar novamente</Button>
      </div>
    );
  }

  if (auth.isLoading || !auth.isAuthenticated) {
    return (
      <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">A autenticar...</p>
      </div>
    );
  }

  return <>{children}</>;
}
