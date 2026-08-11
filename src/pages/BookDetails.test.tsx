import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookDetails from './BookDetails';
import { setBooks, setIssues, setMembers } from '../services/storage';
import type { Book, IssueRecord, Member } from '../types';

const book: Book = {
  id: 'BK-001',
  isbn: '9780743273565',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  category: 'Fiction',
  publisher: 'Scribner',
  publishedYear: 1925,
  totalCopies: 5,
  availableCopies: 3,
  description: 'A classic novel of the Jazz Age.',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const member: Member = {
  id: 'MEM-001',
  firstName: 'Aarav',
  lastName: 'Sharma',
  email: 'aarav.sharma@mail.com',
  phone: '9876543210',
  dob: '1990-01-15',
  address: '100 MG Road, Bengaluru, KA',
  membershipType: 'Basic',
  membershipStart: '2025-01-01',
  membershipExpiry: '2026-01-01',
  status: 'Active',
  joinDate: '2025-01-01',
  booksIssued: 1,
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/books" element={<div data-testid="books-list-page">Books List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BookDetails page', () => {
  it('renders book information for an existing book', () => {
    setBooks([book]);
    setMembers([]);
    setIssues([]);
    renderAt('/books/BK-001');

    expect(screen.getByTestId('page-heading')).toHaveTextContent('The Great Gatsby');
    expect(screen.getByText('by F. Scott Fitzgerald')).toBeInTheDocument();
    expect(screen.getByTestId('book-description')).toHaveTextContent('A classic novel of the Jazz Age.');
    expect(screen.getByTestId('detail-isbn')).toHaveTextContent('9780743273565');
    expect(screen.getByTestId('detail-total-copies')).toHaveTextContent('5');
    expect(screen.getByTestId('detail-available-copies')).toHaveTextContent('3');
    expect(screen.getByTestId('detail-issued-copies')).toHaveTextContent('2');
    expect(screen.getByTestId('status-badge-available')).toBeInTheDocument();
  });

  it('links back to the books list', () => {
    setBooks([book]);
    setMembers([]);
    setIssues([]);
    renderAt('/books/BK-001');
    expect(screen.getByTestId('back-to-books')).toHaveAttribute('href', '/books');
  });

  it('shows an empty state in the issue history when the book has never been issued', () => {
    setBooks([book]);
    setMembers([]);
    setIssues([]);
    renderAt('/books/BK-001');
    expect(screen.getByTestId('book-history-empty')).toHaveTextContent("This book hasn't been issued to any members.");
  });

  it('lists issue history rows sorted by most recent issue date first, with member names resolved', () => {
    const issues: IssueRecord[] = [
      { id: 'ISS-001', bookId: 'BK-001', memberId: 'MEM-001', issueDate: '2026-01-01', dueDate: '2026-01-15', returnDate: '2026-01-10', status: 'Returned', fine: 0 },
      { id: 'ISS-002', bookId: 'BK-001', memberId: 'MEM-001', issueDate: '2026-03-01', dueDate: '2026-03-15', returnDate: null, status: 'Issued', fine: 0 },
    ];
    setBooks([book]);
    setMembers([member]);
    setIssues(issues);
    renderAt('/books/BK-001');

    const rows = screen.getAllByTestId(/book-history-row-/);
    expect(rows[0]).toHaveAttribute('data-testid', 'book-history-row-ISS-002');
    expect(rows[1]).toHaveAttribute('data-testid', 'book-history-row-ISS-001');
    expect(rows[0]).toHaveTextContent('Aarav Sharma');
  });

  it('shows "Unknown Member" when the issue references a member no longer in storage', () => {
    const issues: IssueRecord[] = [
      { id: 'ISS-001', bookId: 'BK-001', memberId: 'MEM-GONE', issueDate: '2026-01-01', dueDate: '2026-01-15', returnDate: null, status: 'Issued', fine: 0 },
    ];
    setBooks([book]);
    setMembers([]);
    setIssues(issues);
    renderAt('/books/BK-001');
    expect(screen.getByTestId('book-history-row-ISS-001')).toHaveTextContent('Unknown Member');
  });

  it('only shows issue history rows belonging to this book', () => {
    const issues: IssueRecord[] = [
      { id: 'ISS-001', bookId: 'BK-001', memberId: 'MEM-001', issueDate: '2026-01-01', dueDate: '2026-01-15', returnDate: null, status: 'Issued', fine: 0 },
      { id: 'ISS-002', bookId: 'BK-999', memberId: 'MEM-001', issueDate: '2026-02-01', dueDate: '2026-02-15', returnDate: null, status: 'Issued', fine: 0 },
    ];
    setBooks([book]);
    setMembers([member]);
    setIssues(issues);
    renderAt('/books/BK-001');
    expect(screen.getByTestId('book-history-row-ISS-001')).toBeInTheDocument();
    expect(screen.queryByTestId('book-history-row-ISS-002')).not.toBeInTheDocument();
  });

  it('shows a "Book not found" state for an unknown id', () => {
    setBooks([book]);
    setMembers([]);
    setIssues([]);
    renderAt('/books/DOES-NOT-EXIST');
    expect(screen.getByTestId('book-not-found')).toHaveTextContent('Book not found');
    expect(screen.queryByTestId('page-heading')).not.toBeInTheDocument();
  });

  it('provides a link back to Books from the not-found state', () => {
    setBooks([]);
    setMembers([]);
    setIssues([]);
    renderAt('/books/BK-001');
    expect(screen.getByRole('link', { name: 'Back to Books' })).toHaveAttribute('href', '/books');
  });
});
