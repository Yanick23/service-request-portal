import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../../components/StatusBadge';

describe('StatusBadge', () => {
  it.each(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const)('renders the %s label', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });
});
