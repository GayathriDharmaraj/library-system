import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('renders the app logo and all nav items', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar mobileOpen={false} onNavigate={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('app-logo')).toHaveTextContent('LibraryHub');
    [
      'nav-dashboard',
      'nav-books',
      'nav-members',
      'nav-issue-book',
      'nav-return-books',
      'nav-overdue-books',
      'nav-issue-history',
      'nav-categories',
      'nav-profile',
    ].forEach((testId) => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('marks the current route as active', () => {
    render(
      <MemoryRouter initialEntries={['/books']}>
        <Sidebar mobileOpen={false} onNavigate={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('nav-books').className).toContain('bg-brand-600');
    expect(screen.getByTestId('nav-dashboard').className).not.toContain('bg-brand-600');
  });

  it('does not render the scrim when mobileOpen is false', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar mobileOpen={false} onNavigate={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('sidebar-scrim')).not.toBeInTheDocument();
  });

  it('renders the scrim when mobileOpen is true', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar mobileOpen onNavigate={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar-scrim')).toBeInTheDocument();
  });

  it('calls onNavigate when clicking the scrim', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar mobileOpen onNavigate={onNavigate} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    await user.click(screen.getByTestId('sidebar-scrim'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigate when a nav link is clicked', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar mobileOpen={false} onNavigate={onNavigate} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    await user.click(screen.getByTestId('nav-books'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when the logout button is clicked', async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar mobileOpen={false} onNavigate={vi.fn()} onLogout={onLogout} />
      </MemoryRouter>
    );
    await user.click(screen.getByTestId('logout-button'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
