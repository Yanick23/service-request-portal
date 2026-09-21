import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../support/server';
import { renderWithProviders } from '../../support/utils';
import { RequestDetailPage } from '../../../pages/RequestDetailPage';

describe('RequestDetailPage', () => {
  it('shows a loading state before the request arrives', () => {
    renderWithProviders(<RequestDetailPage />, {
      path: '/requests/:id',
      initialEntries: ['/requests/REQ-1001'],
    });

    expect(screen.getByText('A carregar pedido...')).toBeInTheDocument();
  });

  it('renders the request details and the allowed status transitions', async () => {
    renderWithProviders(<RequestDetailPage />, {
      path: '/requests/:id',
      initialEntries: ['/requests/REQ-1001'],
    });

    expect(await screen.findByText('Unable to access customer portal')).toBeInTheDocument();
    expect(screen.getByText(/Example Customer/)).toBeInTheDocument();
    expect(screen.getByText(/customer@example.com/)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Marcar como IN_PROGRESS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como CLOSED' })).toBeInTheDocument();
  });

  it('shows no transitions available for a closed request', async () => {
    renderWithProviders(<RequestDetailPage />, {
      path: '/requests/:id',
      initialEntries: ['/requests/REQ-1005'],
    });

    expect(await screen.findByText('Request to update billing address')).toBeInTheDocument();
    expect(
      screen.getByText('Este pedido está fechado, sem mais transições possíveis.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como/ })).not.toBeInTheDocument();
  });

  it('updates the status and refreshes the allowed transitions on success', async () => {
    renderWithProviders(<RequestDetailPage />, {
      path: '/requests/:id',
      initialEntries: ['/requests/REQ-1001'],
    });

    await screen.findByText('Unable to access customer portal');

    await userEvent.click(screen.getByRole('button', { name: 'Marcar como IN_PROGRESS' }));

    expect(await screen.findByRole('button', { name: 'Marcar como RESOLVED' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como OPEN' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como IN_PROGRESS' })).not.toBeInTheDocument();
  });

  it('shows a conflict warning when the request was updated by someone else', async () => {
    server.use(
      http.patch('/api/requests/:id/status', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.test/problems/update-conflict',
            title: 'Update conflict',
            status: 409,
            detail: 'The request was updated by someone else. Refresh and try again.',
          },
          { status: 409 },
        ),
      ),
    );

    renderWithProviders(<RequestDetailPage />, {
      path: '/requests/:id',
      initialEntries: ['/requests/REQ-1001'],
    });

    await screen.findByText('Unable to access customer portal');
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como IN_PROGRESS' }));

    expect(
      await screen.findByText(/Este pedido foi alterado por outra pessoa entretanto/),
    ).toBeInTheDocument();
  });

  it('shows an error message when the request cannot be loaded', async () => {
    renderWithProviders(<RequestDetailPage />, {
      path: '/requests/:id',
      initialEntries: ['/requests/REQ-9999'],
    });

    expect(await screen.findByText('Não foi possível carregar este pedido.')).toBeInTheDocument();
  });
});
