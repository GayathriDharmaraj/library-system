import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookFormModal from './BookFormModal';
import type { Book, Category } from '../types';

const categories: Category[] = [
  { id: 'CAT-01', name: 'Fiction' },
  { id: 'CAT-02', name: 'Science' },
];

const existingBook: Book = {
  id: 'BK-001',
  isbn: '9780743273565',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  category: 'Fiction',
  publisher: 'Scribner',
  publishedYear: 1925,
  totalCopies: 5,
  availableCopies: 5,
  description: 'A classic novel.',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: '2026-01-01',
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('book-isbn'), '9780061120084');
  await user.type(screen.getByTestId('book-title'), 'To Kill a Mockingbird');
  await user.type(screen.getByTestId('book-author'), 'Harper Lee');
  await user.selectOptions(screen.getByTestId('book-category'), 'Fiction');
  await user.type(screen.getByTestId('book-publisher'), 'J.B. Lippincott');
  await user.type(screen.getByTestId('book-published-year'), '1960');
  await user.type(screen.getByTestId('book-total-copies'), '4');
}

describe('BookFormModal', () => {
  it('renders "Add Book" title and button labels when creating a new book', () => {
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    expect(screen.getByRole('heading', { name: 'Add Book' })).toBeInTheDocument();
    expect(screen.getByTestId('save-book-button')).toHaveTextContent('Add Book');
  });

  it('renders "Edit Book" title and pre-fills fields when editing an existing book', () => {
    render(
      <BookFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={categories}
        existingIsbns={[existingBook.isbn]}
        initialBook={existingBook}
      />
    );
    expect(screen.getByText('Edit Book')).toBeInTheDocument();
    expect(screen.getByTestId('save-book-button')).toHaveTextContent('Save Changes');
    expect(screen.getByTestId('book-title')).toHaveValue('The Great Gatsby');
    expect(screen.getByTestId('book-isbn')).toHaveValue('9780743273565');
  });

  it('shows required-field errors when submitting an empty form', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={onSubmit} categories={categories} existingIsbns={[]} />
    );
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.getByTestId('book-isbn-error')).toHaveTextContent('ISBN is required.');
    expect(screen.getByTestId('book-title-error')).toHaveTextContent('Book title is required.');
    expect(screen.getByTestId('book-author-error')).toHaveTextContent('Author is required.');
    expect(screen.getByTestId('book-category-error')).toHaveTextContent('Please select a category.');
    expect(screen.getByTestId('book-publisher-error')).toHaveTextContent('Publisher is required.');
    expect(screen.getByTestId('book-published-year-error')).toHaveTextContent('Published year is required.');
    expect(screen.getByTestId('book-total-copies-error')).toHaveTextContent('Number of copies is required.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid ISBN', async () => {
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    await user.type(screen.getByTestId('book-isbn'), '12345');
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.getByTestId('book-isbn-error')).toHaveTextContent('Enter a valid 10 or 13 digit ISBN.');
  });

  it('rejects a duplicate ISBN when creating a new book', async () => {
    const user = userEvent.setup();
    render(
      <BookFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={categories}
        existingIsbns={['9780743273565']}
      />
    );
    await user.type(screen.getByTestId('book-isbn'), '9780743273565');
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.getByTestId('book-isbn-error')).toHaveTextContent('This ISBN already exists in the catalog.');
  });

  it('allows keeping the same ISBN when editing that same book', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BookFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        categories={categories}
        existingIsbns={[existingBook.isbn]}
        initialBook={existingBook}
      />
    );
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.queryByTestId('book-isbn-error')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('rejects a published year outside the valid range', async () => {
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    await user.type(screen.getByTestId('book-published-year'), '1000');
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.getByTestId('book-published-year-error')).toBeInTheDocument();
  });

  it('rejects a non-positive number of copies', async () => {
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    await user.type(screen.getByTestId('book-total-copies'), '0');
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.getByTestId('book-total-copies-error')).toHaveTextContent('Number of copies must be greater than 0.');
  });

  it('rejects a description over 1000 characters', async () => {
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    fireEvent.change(screen.getByTestId('book-description'), { target: { value: 'a'.repeat(1001) } });
    await user.click(screen.getByTestId('save-book-button'));
    expect(screen.getByTestId('book-description-error')).toBeInTheDocument();
  });

  it('submits the trimmed and normalized payload when the form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={vi.fn()} onSubmit={onSubmit} categories={categories} existingIsbns={[]} />
    );
    await fillValidForm(user);
    await user.click(screen.getByTestId('save-book-button'));
    expect(onSubmit).toHaveBeenCalledWith({
      isbn: '9780061120084',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      category: 'Fiction',
      publisher: 'J.B. Lippincott',
      publishedYear: 1960,
      totalCopies: 4,
      description: '',
    });
  });

  it('calls onClose when the cancel button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <BookFormModal open onClose={onClose} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    await user.click(screen.getByTestId('cancel-book-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets the form to blank when reopened without an initialBook', () => {
    const { rerender } = render(
      <BookFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        categories={categories}
        existingIsbns={[]}
        initialBook={existingBook}
      />
    );
    rerender(
      <BookFormModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    rerender(
      <BookFormModal open onClose={vi.fn()} onSubmit={vi.fn()} categories={categories} existingIsbns={[]} />
    );
    expect(screen.getByTestId('book-title')).toHaveValue('');
  });
});
