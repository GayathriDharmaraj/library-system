import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Books from './Books';
import ToastStack from '../components/ToastStack';
import { renderWithProviders } from '../test/test-utils';
import { setBooks, setCategories, setIssues, getBooks } from '../services/storage';
import type { Book, Category, IssueRecord } from '../types';

const categories: Category[] = [
  { id: 'CAT-01', name: 'Fiction' },
  { id: 'CAT-02', name: 'Science' },
];

function makeBook(overrides: Partial<Book>): Book {
  return {
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
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const baseBooks: Book[] = [
  makeBook({ id: 'BK-001', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', isbn: '9780743273565', totalCopies: 5, availableCopies: 5, status: 'Available', publishedYear: 1925 }),
  makeBook({ id: 'BK-002', title: 'Dune', author: 'Frank Herbert', category: 'Science', isbn: '9780441013593', totalCopies: 3, availableCopies: 0, status: 'Unavailable', publishedYear: 1965 }),
];

function seed(books: Book[] = baseBooks, cats: Category[] = categories, issues: IssueRecord[] = []) {
  setCategories(cats);
  setBooks(books);
  setIssues(issues);
}

function renderBooks() {
  return renderWithProviders(
    <>
      <Books />
      <ToastStack />
    </>,
    { route: '/books' }
  );
}

describe('Books page', () => {
  it('renders the heading and the catalog count', () => {
    seed();
    renderBooks();
    expect(screen.getByTestId('page-heading')).toHaveTextContent('Books');
    expect(screen.getByText('2 of 2 titles in the catalog')).toBeInTheDocument();
  });

  it('renders a table row for each book', () => {
    seed();
    renderBooks();
    expect(screen.getByTestId('book-row-BK-001')).toBeInTheDocument();
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.getByTestId('book-row-BK-001')).toHaveTextContent('The Great Gatsby');
  });

  it('shows an empty state when there are no books at all', () => {
    seed([]);
    renderBooks();
    expect(screen.getByTestId('books-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('books-table')).not.toBeInTheDocument();
  });

  it('filters by title search', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.type(screen.getByTestId('books-search'), 'Dune');
    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 titles in the catalog')).toBeInTheDocument();
  });

  it('filters by author when the search field is switched to author', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.selectOptions(screen.getByTestId('books-search-field'), 'author');
    await user.type(screen.getByTestId('books-search'), 'Herbert');
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
  });

  it('filters by ISBN when the search field is switched to isbn', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.selectOptions(screen.getByTestId('books-search-field'), 'isbn');
    await user.type(screen.getByTestId('books-search'), '9780441013593');
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.selectOptions(screen.getByTestId('books-category-filter'), 'Science');
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
  });

  it('filters by availability', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.selectOptions(screen.getByTestId('books-availability-filter'), 'unavailable');
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
  });

  it('filters by status', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.selectOptions(screen.getByTestId('books-status-filter'), 'Unavailable');
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
  });

  it('shows a filtered empty state with a clear-filters action when no book matches', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.type(screen.getByTestId('books-search'), 'Nonexistent Title');
    expect(screen.getByTestId('books-empty-state')).toBeInTheDocument();
    await user.click(screen.getByText('Clear filters'));
    expect(screen.getByTestId('book-row-BK-001')).toBeInTheDocument();
  });

  it('clears all filters via the Clear Filters button', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.type(screen.getByTestId('books-search'), 'Dune');
    await user.click(screen.getByTestId('clear-filters-button'));
    expect(screen.getByTestId('books-search')).toHaveValue('');
    expect(screen.getByTestId('book-row-BK-001')).toBeInTheDocument();
    expect(screen.getByTestId('book-row-BK-002')).toBeInTheDocument();
  });

  it('toggles sort direction on the title column when clicked twice', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    const rowsOrder = () => screen.getAllByRole('row').slice(1).map((r) => r.getAttribute('data-testid'));

    expect(screen.getByTestId('sort-title')).toHaveTextContent('▲');
    expect(rowsOrder()).toEqual(['book-row-BK-002', 'book-row-BK-001']);

    await user.click(screen.getByTestId('sort-title'));
    expect(screen.getByTestId('sort-title')).toHaveTextContent('▼');
    expect(rowsOrder()).toEqual(['book-row-BK-001', 'book-row-BK-002']);

    await user.click(screen.getByTestId('sort-title'));
    expect(screen.getByTestId('sort-title')).toHaveTextContent('▲');
    expect(rowsOrder()).toEqual(['book-row-BK-002', 'book-row-BK-001']);
  });

  it('paginates when there are more books than the page size', async () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      makeBook({ id: `BK-${String(i + 1).padStart(3, '0')}`, title: `Book ${String(i + 1).padStart(2, '0')}`, isbn: `978000000000${i}` })
    );
    seed(many);
    const user = userEvent.setup();
    renderBooks();
    expect(screen.getByTestId('books-pagination-range-label')).toHaveTextContent('Showing 1–10 of 12');
    await user.click(screen.getByTestId('books-pagination-next'));
    expect(screen.getByTestId('books-pagination-range-label')).toHaveTextContent('Showing 11–12 of 12');
  });

  it('adds a new book via the Add Book modal and persists it to storage', async () => {
    seed();
    const user = userEvent.setup();
    renderBooks();
    await user.click(screen.getByTestId('add-book-button'));
    expect(screen.getByRole('heading', { name: 'Add Book' })).toBeInTheDocument();

    await user.type(screen.getByTestId('book-isbn'), '9780061120084');
    await user.type(screen.getByTestId('book-title'), 'To Kill a Mockingbird');
    await user.type(screen.getByTestId('book-author'), 'Harper Lee');
    await user.selectOptions(screen.getByTestId('book-category'), 'Fiction');
    await user.type(screen.getByTestId('book-publisher'), 'J.B. Lippincott');
    await user.type(screen.getByTestId('book-published-year'), '1960');
    await user.type(screen.getByTestId('book-total-copies'), '4');
    await user.click(screen.getByTestId('save-book-button'));

    expect(screen.getByText('"To Kill a Mockingbird" was added to the catalog.')).toBeInTheDocument();
    expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 titles in the catalog')).toBeInTheDocument();

    const persisted = getBooks();
    expect(persisted).toHaveLength(3);
    const created = persisted.find((b) => b.title === 'To Kill a Mockingbird');
    expect(created).toMatchObject({ id: 'BK-003', availableCopies: 4, status: 'Available' });
  });

  it('edits an existing book, recomputing available copies from currently issued copies', async () => {
    seed([makeBook({ id: 'BK-001', totalCopies: 5, availableCopies: 2 })]);
    const user = userEvent.setup();
    renderBooks();
    await user.click(screen.getByTestId('edit-book-BK-001'));
    expect(screen.getByRole('heading', { name: 'Edit Book' })).toBeInTheDocument();
    expect(screen.getByTestId('book-title')).toHaveValue('The Great Gatsby');

    await user.clear(screen.getByTestId('book-total-copies'));
    await user.type(screen.getByTestId('book-total-copies'), '10');
    await user.click(screen.getByTestId('save-book-button'));

    expect(screen.getByText('"The Great Gatsby" was updated.')).toBeInTheDocument();
    const [updated] = getBooks();
    expect(updated.totalCopies).toBe(10);
    expect(updated.availableCopies).toBe(7);
    expect(updated.status).toBe('Available');
  });

  it('clamps available copies to 0 and marks Unavailable when reduced below the issued count', async () => {
    seed([makeBook({ id: 'BK-001', totalCopies: 5, availableCopies: 1 })]);
    const user = userEvent.setup();
    renderBooks();
    await user.click(screen.getByTestId('edit-book-BK-001'));
    await user.clear(screen.getByTestId('book-total-copies'));
    await user.type(screen.getByTestId('book-total-copies'), '3');
    await user.click(screen.getByTestId('save-book-button'));

    const [updated] = getBooks();
    expect(updated.totalCopies).toBe(3);
    expect(updated.availableCopies).toBe(0);
    expect(updated.status).toBe('Unavailable');
  });

  it('deletes a book with a plain confirmation message when it has no active issues', async () => {
    seed([makeBook({ id: 'BK-001' })], categories, []);
    const user = userEvent.setup();
    renderBooks();
    await user.click(screen.getByTestId('delete-book-BK-001'));
    expect(screen.getByTestId('delete-book-dialog')).toHaveTextContent('will be permanently removed from the catalog.');
    await user.click(screen.getByTestId('delete-book-dialog-confirm'));

    expect(screen.queryByTestId('book-row-BK-001')).not.toBeInTheDocument();
    expect(getBooks()).toHaveLength(0);
    expect(screen.getByText('"The Great Gatsby" was removed from the catalog.')).toBeInTheDocument();
  });

  it('warns about active issues in the delete confirmation message', async () => {
    const issue: IssueRecord = {
      id: 'ISS-001',
      bookId: 'BK-001',
      memberId: 'MEM-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    seed([makeBook({ id: 'BK-001' })], categories, [issue]);
    const user = userEvent.setup();
    renderBooks();
    await user.click(screen.getByTestId('delete-book-BK-001'));
    expect(screen.getByTestId('delete-book-dialog')).toHaveTextContent('has copies currently issued');
  });

  it('cancelling the delete dialog keeps the book', async () => {
    seed([makeBook({ id: 'BK-001' })]);
    const user = userEvent.setup();
    renderBooks();
    await user.click(screen.getByTestId('delete-book-BK-001'));
    await user.click(screen.getByTestId('delete-book-dialog-cancel'));
    expect(screen.queryByTestId('delete-book-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('book-row-BK-001')).toBeInTheDocument();
    expect(getBooks()).toHaveLength(1);
  });
});
