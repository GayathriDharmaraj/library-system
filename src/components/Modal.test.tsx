import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="My Modal" testId="my-modal">
        <p>Body</p>
      </Modal>
    );
    expect(screen.queryByTestId('my-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('my-modal-overlay')).not.toBeInTheDocument();
  });

  it('renders the title and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="My Modal" testId="my-modal">
        <p>Body content</p>
      </Modal>
    );
    expect(screen.getByTestId('my-modal')).toBeInTheDocument();
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('exposes dialog accessibility attributes', () => {
    render(
      <Modal open onClose={vi.fn()} title="Accessible" testId="acc-modal">
        <p>Body</p>
      </Modal>
    );
    const overlay = screen.getByTestId('acc-modal-overlay');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-labelledby', 'acc-modal-title');
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="My Modal" testId="my-modal">
        <p>Body</p>
      </Modal>
    );
    await user.click(screen.getByTestId('my-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies the default widthClass when none is provided', () => {
    render(
      <Modal open onClose={vi.fn()} title="Default width" testId="w-modal">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByTestId('w-modal').className).toContain('max-w-lg');
  });

  it('applies a custom widthClass when provided', () => {
    render(
      <Modal open onClose={vi.fn()} title="Custom width" testId="w-modal" widthClass="max-w-2xl">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByTestId('w-modal').className).toContain('max-w-2xl');
  });
});
