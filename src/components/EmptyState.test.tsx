import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the title and message', () => {
    render(<EmptyState title="No books found" message="Try adjusting your filters." testId="empty-books" />);
    expect(screen.getByTestId('empty-books')).toBeInTheDocument();
    expect(screen.getByText('No books found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });

  it('renders an action node when provided', () => {
    render(
      <EmptyState
        title="No members"
        message="Add your first member."
        testId="empty-members"
        action={<button>Add Member</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
  });

  it('renders without an action when none is provided', () => {
    render(<EmptyState title="No results" message="Nothing here." testId="empty-generic" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
