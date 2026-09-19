import { describe, expect, it } from 'vitest';
import { Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'react-router-dom';
import { renderRoutesWithProviders } from '../test/utils';
import { NewRequestPage } from './NewRequestPage';

function DetailStub() {
  const { id } = useParams<{ id: string }>();
  return <p>Detail page for {id}</p>;
}

describe('NewRequestPage', () => {
  it('shows client-side validation errors and does not submit when fields are invalid', async () => {
    renderRoutesWithProviders(<Route path="/requests/new" element={<NewRequestPage />} />, {
      initialEntries: ['/requests/new'],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Criar pedido' }));

    expect(await screen.findByText('O título deve ter pelo menos 3 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('A descrição deve ter pelo menos 10 caracteres.')).toBeInTheDocument();
  });

  it('creates the request and navigates to its detail page on success', async () => {
    renderRoutesWithProviders(
      <>
        <Route path="/requests/new" element={<NewRequestPage />} />
        <Route path="/requests/:id" element={<DetailStub />} />
      </>,
      { initialEntries: ['/requests/new'] },
    );

    await userEvent.type(screen.getByLabelText('Título'), 'Printer is not responding');
    await userEvent.type(screen.getByLabelText('Descrição'), 'The printer on the 3rd floor stopped responding today.');
    await userEvent.type(screen.getByLabelText('Categoria'), 'Hardware');
    await userEvent.type(screen.getByLabelText('Nome do requerente'), 'Maria Silva');
    await userEvent.type(screen.getByLabelText('Email do requerente'), 'maria.silva@example.com');

    await userEvent.click(screen.getByRole('button', { name: 'Criar pedido' }));

    expect(await screen.findByText(/Detail page for REQ-1006/)).toBeInTheDocument();
  });
});
