import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { RequestsListPage } from './pages/RequestsListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { NewRequestPage } from './pages/NewRequestPage';

function App() {
  const auth = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3.5 sm:px-6">
        <Link to="/requests" className="text-base font-semibold">
          Service Request Portal
        </Link>
        <div className="flex items-center gap-3">
          {auth.user?.profile.email && (
            <span className="text-sm text-muted-foreground">{auth.user.profile.email}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => auth.signoutRedirect({ post_logout_redirect_uri: window.location.origin })}
          >
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-12 sm:px-6">
        <Routes>
          <Route path="/" element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<RequestsListPage />} />
          <Route path="/requests/new" element={<NewRequestPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
