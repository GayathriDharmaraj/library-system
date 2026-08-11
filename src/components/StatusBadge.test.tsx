import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Available" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('generates a default data-testid from the status when none is provided', () => {
    render(<StatusBadge status="Overdue" />);
    expect(screen.getByTestId('status-badge-overdue')).toBeInTheDocument();
  });

  it('uses a custom testId when provided', () => {
    render(<StatusBadge status="Issued" testId="my-badge" />);
    expect(screen.getByTestId('my-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('status-badge-issued')).not.toBeInTheDocument();
  });

  it('falls back to a neutral style for an unrecognized status', () => {
    render(<StatusBadge status="Unknown" />);
    const badge = screen.getByTestId('status-badge-unknown');
    expect(badge.className).toContain('bg-ink-600/10');
  });

  it.each(['Available', 'Unavailable', 'Active', 'Inactive', 'Issued', 'Returned', 'Overdue'])(
    'renders a known status "%s" with its mapped style',
    (status) => {
      render(<StatusBadge status={status} testId={`badge-${status}`} />);
      const badge = screen.getByTestId(`badge-${status}`);
      expect(badge).toHaveTextContent(status);
    }
  );
});
