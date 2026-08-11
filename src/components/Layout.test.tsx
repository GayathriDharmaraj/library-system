import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { login } from '../services/auth';
import Layout from './Layout';

function renderLayout(initialEntry = '/home') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route element={<Layout />}>
            <Route path="/home" element={<div data-testid="home-page">Home Page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renders the signed-in user name and role in the header', () => {
    login('admin@library.com', 'Admin@123', true);
    renderLayout();
    expect(screen.getByTestId('topbar-user-name')).toHaveTextContent('Ananya Admin');
    expect(screen.getByTestId('topbar-user-role')).toHaveTextContent('admin');
  });

  it('renders the nested route content via the Outlet', () => {
    login('admin@library.com', 'Admin@123', true);
    renderLayout();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders the sidebar', () => {
    login('admin@library.com', 'Admin@123', true);
    renderLayout();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('opens a logout confirmation dialog when the logout button is clicked', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByTestId('logout-button'));
    expect(screen.getByTestId('confirm-logout-dialog')).toBeInTheDocument();
  });

  it('cancelling the logout dialog keeps the user on the page', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByTestId('logout-button'));
    await user.click(screen.getByTestId('confirm-logout-dialog-cancel'));
    expect(screen.queryByTestId('confirm-logout-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('confirming logout navigates to the login page', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByTestId('logout-button'));
    await user.click(screen.getByTestId('confirm-logout-dialog-confirm'));
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('toggles the mobile sidebar when the hamburger menu is clicked', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderLayout();
    expect(screen.queryByTestId('sidebar-scrim')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('hamburger-menu'));
    expect(screen.getByTestId('sidebar-scrim')).toBeInTheDocument();
  });
});
