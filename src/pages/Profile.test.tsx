import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { login } from '../services/auth';
import { getBooks, setBooks } from '../services/storage';
import ToastStack from '../components/ToastStack';
import Profile from './Profile';
import { renderWithProviders } from '../test/test-utils';

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload: vi.fn() },
    writable: true,
  });
});

describe('Profile', () => {
  it('renders nothing when there is no authenticated user', () => {
    const { container } = renderWithProviders(<Profile />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the signed-in user\'s details in display mode', () => {
    login('admin@library.com', 'Admin@123', true);
    renderWithProviders(<Profile />);
    expect(screen.getByTestId('profile-name-display')).toHaveTextContent('Gayathri');
    expect(screen.getByTestId('profile-role-display')).toHaveTextContent('admin');
    expect(screen.getByTestId('profile-email-display')).toHaveTextContent('admin@library.com');
    expect(screen.getByTestId('profile-phone-display')).toHaveTextContent('9876543210');
    expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
  });

  it('switches to an editable form pre-filled with current values when Edit Profile is clicked', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('edit-profile-button'));
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.getByTestId('profile-name')).toHaveValue('Gayathri');
    expect(screen.getByTestId('profile-email')).toHaveValue('admin@library.com');
  });

  it('shows validation errors when saving invalid profile data', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('edit-profile-button'));
    await user.clear(screen.getByTestId('profile-name'));
    await user.clear(screen.getByTestId('profile-email'));
    await user.type(screen.getByTestId('profile-email'), 'not-an-email');
    await user.clear(screen.getByTestId('profile-phone'));
    await user.type(screen.getByTestId('profile-phone'), '123');
    await user.clear(screen.getByTestId('profile-address'));
    await user.click(screen.getByTestId('save-profile-button'));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument();
    expect(screen.getByText('Address is required.')).toBeInTheDocument();
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
  });

  it('saves valid profile changes, updates the display, and shows a success toast', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Profile />
        <ToastStack />
      </>
    );
    await user.click(screen.getByTestId('edit-profile-button'));
    await user.clear(screen.getByTestId('profile-name'));
    await user.type(screen.getByTestId('profile-name'), 'New Admin Name');
    await user.click(screen.getByTestId('save-profile-button'));
    expect(screen.getByTestId('profile-name-display')).toHaveTextContent('New Admin Name');
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Profile updated successfully.');
  });

  it('cancelling the edit form discards changes', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('edit-profile-button'));
    await user.clear(screen.getByTestId('profile-name'));
    await user.type(screen.getByTestId('profile-name'), 'Discarded Name');
    await user.click(screen.getByTestId('cancel-profile-button'));
    expect(screen.getByTestId('profile-name-display')).toHaveTextContent('Gayathri');
  });

  it('shows validation errors when changing the password with missing/invalid fields', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('change-password-button'));
    await user.type(screen.getByTestId('new-password'), 'weak');
    await user.type(screen.getByTestId('confirm-password'), 'different');
    await user.click(screen.getByTestId('save-password-button'));
    expect(screen.getByText('Current password is required.')).toBeInTheDocument();
    expect(screen.getByText('Password does not meet all requirements below.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('reflects password rule checklist state as the new password is typed', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('change-password-button'));
    const rules = screen.getByTestId('password-rules');
    expect(rules.textContent).toContain('○At least 8 characters');
    await user.type(screen.getByTestId('new-password'), 'Admin@123');
    expect(rules.textContent).toContain('✓At least 8 characters');
    expect(rules.textContent).toContain('✓One uppercase letter');
    expect(rules.textContent).toContain('✓One special character');
  });

  it('successfully changes the password when all fields are valid', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Profile />
        <ToastStack />
      </>
    );
    await user.click(screen.getByTestId('change-password-button'));
    await user.type(screen.getByTestId('current-password'), 'Admin@123');
    await user.type(screen.getByTestId('new-password'), 'NewPass@123');
    await user.type(screen.getByTestId('confirm-password'), 'NewPass@123');
    await user.click(screen.getByTestId('save-password-button'));
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Password changed successfully.');
    expect(screen.queryByTestId('change-password-form')).not.toBeInTheDocument();
  });

  it('cancelling the password form hides it without saving', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('change-password-button'));
    await user.click(screen.getByTestId('cancel-password-button'));
    expect(screen.queryByTestId('change-password-form')).not.toBeInTheDocument();
  });

  it('opens a confirmation dialog before resetting demo data', async () => {
    login('admin@library.com', 'Admin@123', true);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('reset-demo-data-button'));
    expect(screen.getByTestId('reset-demo-data-dialog')).toBeInTheDocument();
  });

  it('cancelling the reset dialog leaves existing data untouched', async () => {
    login('admin@library.com', 'Admin@123', true);
    setBooks([]);
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(screen.getByTestId('reset-demo-data-button'));
    await user.click(screen.getByTestId('reset-demo-data-dialog-cancel'));
    expect(screen.queryByTestId('reset-demo-data-dialog')).not.toBeInTheDocument();
    expect(getBooks()).toEqual([]);
  });

  it('confirming the reset dialog restores demo data and shows a success toast', async () => {
    login('admin@library.com', 'Admin@123', true);
    setBooks([]);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Profile />
        <ToastStack />
      </>
    );
    await user.click(screen.getByTestId('reset-demo-data-button'));
    await user.click(screen.getByTestId('reset-demo-data-dialog-confirm'));
    expect(getBooks().length).toBeGreaterThan(0);
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Demo data has been reset to its initial state.');
  });
});
