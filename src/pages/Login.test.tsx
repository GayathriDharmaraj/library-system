import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { login as authLogin } from '../services/auth';
import Login from './Login';

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  it('renders the login form with title and demo credentials hint', () => {
    renderLogin();
    expect(screen.getByTestId('app-title')).toHaveTextContent('LibraryHub');
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('demo-credentials')).toHaveTextContent('admin@library.com');
    expect(screen.getByTestId('demo-credentials')).toHaveTextContent('librarian@library.com');
  });

  it('shows required-field errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByTestId('login-button'));
    expect(screen.getByTestId('login-username-error')).toHaveTextContent('Username or email is required.');
    expect(screen.getByTestId('login-password-error')).toHaveTextContent('Password is required.');
  });

  it('logs in successfully with valid admin credentials and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'admin@library.com');
    await user.type(screen.getByTestId('login-password'), 'Admin@123');
    await user.click(screen.getByTestId('login-button'));
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('logs in successfully with valid librarian credentials', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'librarian@library.com');
    await user.type(screen.getByTestId('login-password'), 'Librarian@123');
    await user.click(screen.getByTestId('login-button'));
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('shows a form-level error for an unknown email', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'nobody@library.com');
    await user.type(screen.getByTestId('login-password'), 'whatever');
    await user.click(screen.getByTestId('login-button'));
    expect(screen.getByTestId('login-error')).toHaveTextContent('No account found with this username.');
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  it('shows a form-level error for an incorrect password', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'admin@library.com');
    await user.type(screen.getByTestId('login-password'), 'wrongpass');
    await user.click(screen.getByTestId('login-button'));
    expect(screen.getByTestId('login-error')).toHaveTextContent('Incorrect password. Please try again.');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByTestId('login-password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByTestId('toggle-password-visibility'));
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('toggle-password-visibility')).toHaveTextContent('Hide');
    await user.click(screen.getByTestId('toggle-password-visibility'));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows an informational error when "Forgot password?" is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByTestId('forgot-password-link'));
    expect(screen.getByTestId('login-error')).toHaveTextContent("Password reset isn't available in this demo");
  });

  it('stores the session in sessionStorage when "Remember me" is unchecked', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'admin@library.com');
    await user.type(screen.getByTestId('login-password'), 'Admin@123');
    await user.click(screen.getByTestId('login-button'));
    expect(sessionStorage.getItem('library_session')).not.toBeNull();
    expect(localStorage.getItem('library_session')).toBeNull();
  });

  it('stores the session in localStorage when "Remember me" is checked', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByTestId('remember-me'));
    await user.type(screen.getByTestId('login-username'), 'admin@library.com');
    await user.type(screen.getByTestId('login-password'), 'Admin@123');
    await user.click(screen.getByTestId('login-button'));
    expect(localStorage.getItem('library_session')).not.toBeNull();
  });

  it('redirects immediately to /dashboard when a user is already authenticated', () => {
    authLogin('admin@library.com', 'Admin@123', true);
    renderLogin();
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });
});
