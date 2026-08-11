import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Total Books" value={42} testId="stat-books" />);
    expect(screen.getByText('Total Books')).toBeInTheDocument();
    expect(screen.getByTestId('stat-books-value')).toHaveTextContent('42');
  });

  it('renders a string value', () => {
    render(<StatCard label="Status" value="Healthy" testId="stat-status" />);
    expect(screen.getByTestId('stat-status-value')).toHaveTextContent('Healthy');
  });

  it('appends a suffix when provided', () => {
    render(<StatCard label="Fine" value={120} suffix="₹" testId="stat-fine" />);
    expect(screen.getByTestId('stat-fine-value')).toHaveTextContent('120₹');
  });

  it('does not render a suffix element when none is provided', () => {
    render(<StatCard label="Total" value={5} testId="stat-total" />);
    const valueEl = screen.getByTestId('stat-total-value');
    expect(valueEl.querySelector('span')).not.toBeInTheDocument();
  });

  it('applies a custom accent color', () => {
    render(<StatCard label="Overdue" value={3} accent="#ff0000" testId="stat-overdue" />);
    expect(screen.getByTestId('stat-overdue-value')).toHaveStyle({ color: '#ff0000' });
  });
});
