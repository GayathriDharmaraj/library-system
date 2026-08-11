import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToast } from '../context/ToastContext';
import ToastStack from './ToastStack';
import { renderWithProviders } from '../test/test-utils';

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Book issued successfully')}>Trigger Success</button>
      <button onClick={() => showToast('Something went wrong', 'error')}>Trigger Error</button>
      <button onClick={() => showToast('Heads up', 'info')}>Trigger Info</button>
    </div>
  );
}

describe('ToastStack', () => {
  it('renders no toasts initially', () => {
    renderWithProviders(<ToastStack />);
    expect(screen.getByTestId('toast-container')).toBeEmptyDOMElement();
  });

  it('displays a toast with default type "success" when triggered', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ToastTrigger />
        <ToastStack />
      </>
    );
    await user.click(screen.getByText('Trigger Success'));
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Book issued successfully');
  });

  it('displays an error toast with the correct styling', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ToastTrigger />
        <ToastStack />
      </>
    );
    await user.click(screen.getByText('Trigger Error'));
    const toast = screen.getByTestId('toast-error');
    expect(toast).toHaveTextContent('Something went wrong');
    expect(toast.className).toContain('bg-rust-glow');
  });

  it('displays an info toast', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ToastTrigger />
        <ToastStack />
      </>
    );
    await user.click(screen.getByText('Trigger Info'));
    expect(screen.getByTestId('toast-info')).toHaveTextContent('Heads up');
  });

  it('stacks multiple toasts at once', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ToastTrigger />
        <ToastStack />
      </>
    );
    await user.click(screen.getByText('Trigger Success'));
    await user.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });

  it('dismisses a toast when its dismiss button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ToastTrigger />
        <ToastStack />
      </>
    );
    await user.click(screen.getByText('Trigger Success'));
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    await user.click(screen.getByTestId('toast-dismiss'));
    expect(screen.queryByTestId('toast-success')).not.toBeInTheDocument();
  });
});
