import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { login } from '../services/auth';
import ProtectedRoute from './ProtectedRoute';

function renderProtected(initialEntry = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div data-testid="protected-page">Protected Page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderStaffOnlyProtected(initialEntry = '/staff-only') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/my-account" element={<div data-testid="my-account-page">My Account Page</div>} />
          <Route element={<ProtectedRoute staffOnly />}>
            <Route path="/staff-only" element={<div data-testid="staff-only-page">Staff Only Page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no authenticated user', () => {
    renderProtected();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
  });

  it('renders the Layout with nested route content when a user is authenticated', () => {
    login('admin@library.com', 'Admin@123', true);
    renderProtected();
    expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('allows staff (admin/librarian) roles onto a staffOnly route', () => {
    login('librarian@library.com', 'Librarian@123', true);
    renderStaffOnlyProtected();
    expect(screen.getByTestId('staff-only-page')).toBeInTheDocument();
  });

  it('redirects a member role away from a staffOnly route to /my-account', () => {
    login('member@library.com', 'Member@123', true);
    renderStaffOnlyProtected();
    expect(screen.getByTestId('my-account-page')).toBeInTheDocument();
    expect(screen.queryByTestId('staff-only-page')).not.toBeInTheDocument();
  });
});
