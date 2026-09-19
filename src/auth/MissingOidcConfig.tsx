import { Alert } from '../components/Alert';

export function MissingOidcConfig() {
  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <Alert variant="danger">
        Autenticação OIDC não está configurada. Define VITE_OIDC_AUTHORITY e VITE_OIDC_CLIENT_ID no ficheiro .env
        (ver .env.example).
      </Alert>
    </div>
  );
}
