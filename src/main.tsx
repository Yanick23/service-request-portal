import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Root } from './Root';
import './index.css';

const queryClient = new QueryClient();

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  const { worker } = await import('./mocks/browser');
  // On GitHub Pages the app (and the worker script) live under /service-request-portal/,
  // not the domain root — the worker's scope is capped to whatever directory it's
  // registered from, so it must be pointed at BASE_URL explicitly.
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}

enableMocking()
  .catch((error) => {
    console.error('Failed to start the mock API worker, continuing without it.', error);
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Root />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>,
    );
  });
