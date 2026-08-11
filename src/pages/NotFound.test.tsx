import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound', () => {
  it('renders the 404 page container', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  it('renders the heading text', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByTestId('page-heading')).toHaveTextContent('This page has been checked out');
  });

  it('renders a link back to the dashboard', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    const link = screen.getByTestId('not-found-home-link');
    expect(link).toHaveTextContent('Back to Dashboard');
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});
