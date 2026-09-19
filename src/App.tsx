import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { RequestsListPage } from './pages/RequestsListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-card px-4 py-3.5 sm:px-6">
        <Link to="/requests" className="text-base font-semibold">
          Service Request Portal
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-12 sm:px-6">
        <Routes>
          <Route path="/" element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<RequestsListPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
