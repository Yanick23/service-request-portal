import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { renderWithProviders } from '../test/utils';
import { RequestsListPage } from './RequestsListPage';

describe('RequestsListPage', () => {
  it('lists the seeded requests', async () => {
    renderWithProviders(<RequestsListPage />, { path: '/requests', initialEntries: ['/requests'] });

    expect(await screen.findByText('Unable to access customer portal')).toBeInTheDocument();
    expect(screen.getByText('Self-service app is down for all users')).toBeInTheDocument();
  });

  it('shows an empty state when no request matches the search', async () => {
    renderWithProviders(<RequestsListPage />, { path: '/requests', initialEntries: ['/requests'] });
    await screen.findByText('Unable to access customer portal');

    await userEvent.type(screen.getByPlaceholderText('Pesquisar por título ou requerente'), 'no-such-request');

    await waitFor(() => expect(screen.getByText('Nenhum pedido encontrado.')).toBeInTheDocument());
  });

  it('shows an error alert when the API request fails', async () => {
    server.use(
      http.get('/api/requests', () =>
        HttpResponse.json({ title: 'Erro inesperado', status: 500 }, { status: 500 }),
      ),
    );

    renderWithProviders(<RequestsListPage />, { path: '/requests', initialEntries: ['/requests'] });

    expect(await screen.findByText(/Não foi possível carregar os pedidos/)).toBeInTheDocument();
  });
});
