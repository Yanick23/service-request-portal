import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../../../components/PriorityBadge';

describe('PriorityBadge', () => {
  it.each(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)('renders the %s label', (priority) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(priority)).toBeInTheDocument();
  });
});
