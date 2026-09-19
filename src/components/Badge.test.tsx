import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

describe('StatusBadge', () => {
  it.each(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const)('renders the %s label', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it.each(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)('renders the %s label', (priority) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(priority)).toBeInTheDocument();
  });
});
