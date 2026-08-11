import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete item?"
        message="This cannot be undone."
        testId="delete-dialog"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
  });

  it('renders the title and message when open', () => {
    render(
      <ConfirmDialog
        open
        title="Delete item?"
        message="This cannot be undone."
        testId="delete-dialog"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByTestId('delete-dialog-overlay')).toHaveAttribute('role', 'alertdialog');
  });

  it('uses default Confirm/Cancel labels when none are provided', () => {
    render(
      <ConfirmDialog open title="T" message="M" testId="d" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByTestId('d-confirm')).toHaveTextContent('Confirm');
    expect(screen.getByTestId('d-cancel')).toHaveTextContent('Cancel');
  });

  it('uses custom labels when provided', () => {
    render(
      <ConfirmDialog
        open
        title="T"
        message="M"
        testId="d"
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId('d-confirm')).toHaveTextContent('Log out');
    expect(screen.getByTestId('d-cancel')).toHaveTextContent('Stay signed in');
  });

  it('applies danger styling to the confirm button when danger is true', () => {
    render(
      <ConfirmDialog open title="T" message="M" testId="d" danger onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByTestId('d-confirm').className).toContain('bg-rust-glow');
  });

  it('applies default styling to the confirm button when danger is false', () => {
    render(
      <ConfirmDialog open title="T" message="M" testId="d" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByTestId('d-confirm').className).toContain('bg-brand-600');
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="T" message="M" testId="d" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.click(screen.getByTestId('d-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="T" message="M" testId="d" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByTestId('d-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
