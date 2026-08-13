import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import MyAccount from './MyAccount';
import { login } from '../services/auth';
import { setBooks, setMembers, setIssues } from '../services/storage';
import type { Book, Member, IssueRecord } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';
import { calculateFine } from '../utils/fine';

const member: Member = {
  id: 'MEM-008',
  firstName: 'Ananya',
  lastName: 'Menon',
  email: 'ananya.menon@mail.com',
  phone: '9810000959',
  dob: '1990-01-01',
  address: '107 MG Road, Bengaluru, KA',
  membershipType: 'Premium',
  membershipStart: '2025-01-01',
  membershipExpiry: '2027-01-01',
  status: 'Active',
  joinDate: '2025-01-01',
  booksIssued: 0,
};

const book1: Book = {
  id: 'BK-001',
  isbn: '9780001112223',
  title: 'Currently Borrowed Book',
  author: 'Author A',
  category: 'Fiction',
  publisher: 'Pub Co',
  publishedYear: 2000,
  totalCopies: 3,
  availableCopies: 1,
  description: '',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: todayISO(),
};

const book2: Book = { ...book1, id: 'BK-002', title: 'Previously Returned Book' };

function loginAsMember() {
  login('member@library.com', 'Member@123', true);
}

describe('MyAccount', () => {
  it('shows an unavailable state when the logged-in user has no linked member record', () => {
    loginAsMember();
    setMembers([]); // MEM-008 no longer exists
    setBooks([]);
    setIssues([]);
    renderWithProviders(<MyAccount />);
    expect(screen.getByTestId('my-account-unavailable')).toBeInTheDocument();
  });

  it('renders the member profile summary', () => {
    loginAsMember();
    setMembers([member]);
    setBooks([]);
    setIssues([]);
    renderWithProviders(<MyAccount />);
    expect(screen.getByTestId('my-account-name')).toHaveTextContent('Ananya Menon');
    expect(screen.getByTestId('stat-membership-type-value')).toHaveTextContent('Premium');
    expect(screen.getByText('ananya.menon@mail.com')).toBeInTheDocument();
  });

  it('shows empty states when there are no current or past loans', () => {
    loginAsMember();
    setMembers([member]);
    setBooks([]);
    setIssues([]);
    renderWithProviders(<MyAccount />);
    expect(screen.getByTestId('current-loans-empty')).toBeInTheDocument();
    expect(screen.getByTestId('past-loans-empty')).toBeInTheDocument();
    expect(screen.getByTestId('stat-current-loans-value')).toHaveTextContent('0');
  });

  it('lists a currently borrowed book with no fine when not yet overdue', () => {
    const issue: IssueRecord = {
      id: 'ISS-001',
      bookId: book1.id,
      memberId: member.id,
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), 5),
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    loginAsMember();
    setMembers([member]);
    setBooks([book1]);
    setIssues([issue]);
    renderWithProviders(<MyAccount />);
    const row = screen.getByTestId('current-loan-row-ISS-001');
    expect(within(row).getByText('Currently Borrowed Book')).toBeInTheDocument();
    expect(within(row).getByTestId('status-badge-issued')).toBeInTheDocument();
    expect(row).toHaveTextContent('—');
  });

  it('shows the live overdue fine for a currently overdue book and rolls it into the outstanding total', () => {
    const dueDate = addDays(todayISO(), -5);
    const issue: IssueRecord = {
      id: 'ISS-002',
      bookId: book1.id,
      memberId: member.id,
      issueDate: addDays(dueDate, -14),
      dueDate,
      returnDate: null,
      status: 'Overdue',
      fine: 0,
    };
    loginAsMember();
    setMembers([member]);
    setBooks([book1]);
    setIssues([issue]);
    renderWithProviders(<MyAccount />);
    const fine = calculateFine(dueDate, null);
    const row = screen.getByTestId('current-loan-row-ISS-002');
    expect(row).toHaveTextContent(`₹${fine}`);
    expect(screen.getByTestId('stat-outstanding-fine-value')).toHaveTextContent(`₹${fine}`);
    expect(screen.getByTestId('stat-overdue-loans-value')).toHaveTextContent('1');
  });

  it('lists past (returned) loans separately from current loans', () => {
    const returned: IssueRecord = {
      id: 'ISS-003',
      bookId: book2.id,
      memberId: member.id,
      issueDate: addDays(todayISO(), -30),
      dueDate: addDays(todayISO(), -16),
      returnDate: addDays(todayISO(), -20),
      status: 'Returned',
      fine: 40,
    };
    loginAsMember();
    setMembers([member]);
    setBooks([book2]);
    setIssues([returned]);
    renderWithProviders(<MyAccount />);
    expect(screen.queryByTestId('current-loan-row-ISS-003')).not.toBeInTheDocument();
    const row = screen.getByTestId('past-loan-row-ISS-003');
    expect(within(row).getByText('Previously Returned Book')).toBeInTheDocument();
    expect(row).toHaveTextContent('₹40');
    expect(screen.getByTestId('stat-current-loans-value')).toHaveTextContent('0');
  });

  it('only shows loans belonging to the logged-in member', () => {
    const otherMemberIssue: IssueRecord = {
      id: 'ISS-999',
      bookId: book1.id,
      memberId: 'MEM-999',
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), 5),
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    loginAsMember();
    setMembers([member]);
    setBooks([book1]);
    setIssues([otherMemberIssue]);
    renderWithProviders(<MyAccount />);
    expect(screen.getByTestId('current-loans-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('current-loan-row-ISS-999')).not.toBeInTheDocument();
  });

  it('falls back to "Unknown Book" when the referenced book no longer exists', () => {
    const issue: IssueRecord = {
      id: 'ISS-004',
      bookId: 'BK-DELETED',
      memberId: member.id,
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), 5),
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    loginAsMember();
    setMembers([member]);
    setBooks([]);
    setIssues([issue]);
    renderWithProviders(<MyAccount />);
    expect(screen.getByTestId('current-loan-row-ISS-004')).toHaveTextContent('Unknown Book');
  });
});
