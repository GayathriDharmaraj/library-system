import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberDetails from './MemberDetails';
import { setMembers, setBooks, setIssues } from '../services/storage';
import type { Member, Book, IssueRecord } from '../types';

function renderDetails(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/members/${id}`]}>
      <Routes>
        <Route path="/members" element={<div data-testid="members-list-page">Members List</div>} />
        <Route path="/members/:id" element={<MemberDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

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
  membershipExpiry: '2027-01-01',
  status: 'Active',
  joinDate: '2025-01-01',
  booksIssued: 1,
};

const book: Book = {
  id: 'BK-001',
  isbn: '9780743273565',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  category: 'Fiction',
  publisher: 'Scribner',
  publishedYear: 1925,
  totalCopies: 5,
  availableCopies: 4,
  description: 'desc',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: '2025-01-01',
};

describe('MemberDetails page', () => {
  it('shows a "not found" state for an unknown member id', () => {
    setMembers([]);
    renderDetails('MEM-DOES-NOT-EXIST');
    expect(screen.getByTestId('member-not-found')).toBeInTheDocument();
    expect(screen.getByText('Member not found')).toBeInTheDocument();
  });

  it('links back to the members list from the not-found state', () => {
    setMembers([]);
    renderDetails('MEM-DOES-NOT-EXIST');
    expect(screen.getByText('Back to Members')).toHaveAttribute('href', '/members');
  });

  it('renders the member profile fields', () => {
    setMembers([member]);
    setBooks([]);
    setIssues([]);
    renderDetails('MEM-001');
    expect(screen.getByTestId('page-heading')).toHaveTextContent('Aarav Sharma');
    expect(screen.getByText('aarav.sharma@mail.com')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(screen.getByText('100 MG Road, Bengaluru, KA')).toBeInTheDocument();
    expect(screen.getByTestId('member-books-issued')).toHaveTextContent('1');
    expect(screen.getByText(/Basic Member since/)).toBeInTheDocument();
  });

  it('has a working back-to-members link', () => {
    setMembers([member]);
    setBooks([]);
    setIssues([]);
    renderDetails('MEM-001');
    expect(screen.getByTestId('back-to-members')).toHaveAttribute('href', '/members');
  });

  it('shows an empty state when the member has no borrowing history', () => {
    setMembers([member]);
    setBooks([book]);
    setIssues([]);
    renderDetails('MEM-001');
    expect(screen.getByTestId('member-history-empty')).toBeInTheDocument();
  });

  it('renders borrowing history rows sorted by most recent issue date first', () => {
    setMembers([member]);
    setBooks([book]);
    const older: IssueRecord = {
      id: 'ISS-001',
      bookId: 'BK-001',
      memberId: 'MEM-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      returnDate: '2026-01-10',
      status: 'Returned',
      fine: 0,
    };
    const newer: IssueRecord = {
      id: 'ISS-002',
      bookId: 'BK-001',
      memberId: 'MEM-001',
      issueDate: '2026-03-01',
      dueDate: '2026-03-15',
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    setIssues([older, newer]);
    renderDetails('MEM-001');
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveAttribute('data-testid', 'member-history-row-ISS-002');
    expect(rows[1]).toHaveAttribute('data-testid', 'member-history-row-ISS-001');
  });

  it('shows the book title, fine amount, and status for each history row', () => {
    setMembers([member]);
    setBooks([book]);
    const record: IssueRecord = {
      id: 'ISS-001',
      bookId: 'BK-001',
      memberId: 'MEM-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-10',
      returnDate: '2026-01-15',
      status: 'Returned',
      fine: 50,
    };
    setIssues([record]);
    renderDetails('MEM-001');
    const row = screen.getByTestId('member-history-row-ISS-001');
    expect(row).toHaveTextContent('The Great Gatsby');
    expect(row).toHaveTextContent('₹50');
    expect(row).toHaveTextContent('Returned');
  });

  it('falls back to "Unknown Book" when the issue references a missing book', () => {
    setMembers([member]);
    setBooks([]);
    const record: IssueRecord = {
      id: 'ISS-001',
      bookId: 'BK-DELETED',
      memberId: 'MEM-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-10',
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    setIssues([record]);
    renderDetails('MEM-001');
    expect(screen.getByTestId('member-history-row-ISS-001')).toHaveTextContent('Unknown Book');
  });

  it('does not include issues belonging to other members', () => {
    setMembers([member, { ...member, id: 'MEM-002', firstName: 'Isha' }]);
    setBooks([book]);
    const otherMemberIssue: IssueRecord = {
      id: 'ISS-999',
      bookId: 'BK-001',
      memberId: 'MEM-002',
      issueDate: '2026-01-01',
      dueDate: '2026-01-10',
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    setIssues([otherMemberIssue]);
    renderDetails('MEM-001');
    expect(screen.getByTestId('member-history-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('member-history-row-ISS-999')).not.toBeInTheDocument();
  });
});
