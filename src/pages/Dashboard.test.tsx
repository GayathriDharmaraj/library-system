import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { setBooks, setMembers, setIssues, setActivity } from '../services/storage';
import { formatDate, todayISO, addDays } from '../utils/dateUtils';
import type { Book, Member, IssueRecord, ActivityItem } from '../types';

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverStub;
  }
});

const book = (overrides: Partial<Book>): Book => ({
  id: 'BK-001',
  isbn: '9780743273565',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  category: 'Fiction',
  publisher: 'Scribner',
  publishedYear: 1925,
  totalCopies: 5,
  availableCopies: 5,
  description: '',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: '2026-01-01',
  ...overrides,
});

const member = (overrides: Partial<Member>): Member => ({
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
  booksIssued: 0,
  ...overrides,
});

const issue = (overrides: Partial<IssueRecord>): IssueRecord => ({
  id: 'ISS-001',
  bookId: 'BK-001',
  memberId: 'MEM-001',
  issueDate: addDays(todayISO(), -10),
  dueDate: addDays(todayISO(), 4),
  returnDate: null,
  status: 'Issued',
  fine: 0,
  ...overrides,
});

describe('Dashboard', () => {
  it('renders the page heading and current-date subtitle', () => {
    setBooks([]);
    setMembers([]);
    setIssues([]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('page-heading')).toHaveTextContent('Dashboard');
    expect(screen.getByText(`A snapshot of LibraryHub activity today, ${formatDate(todayISO())}.`)).toBeInTheDocument();
  });

  it('renders zero for every stat when there is no data', () => {
    setBooks([]);
    setMembers([]);
    setIssues([]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('stat-total-books-value')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-available-books-value')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-issued-books-value')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-total-members-value')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-overdue-books-value')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-due-today-value')).toHaveTextContent('0');
  });

  it('sums totalCopies and availableCopies across all books', () => {
    setBooks([
      book({ id: 'BK-001', totalCopies: 5, availableCopies: 3 }),
      book({ id: 'BK-002', totalCopies: 4, availableCopies: 4 }),
      book({ id: 'BK-003', totalCopies: 2, availableCopies: 0 }),
    ]);
    setMembers([]);
    setIssues([]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('stat-total-books-value')).toHaveTextContent('11');
    expect(screen.getByTestId('stat-available-books-value')).toHaveTextContent('7');
  });

  it('counts total members directly from the members list', () => {
    setBooks([]);
    setMembers([member({ id: 'MEM-001' }), member({ id: 'MEM-002' }), member({ id: 'MEM-003' })]);
    setIssues([]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('stat-total-members-value')).toHaveTextContent('3');
  });

  it('counts issued and overdue books, and excludes returned issues from the issued count', () => {
    setBooks([]);
    setMembers([]);
    setIssues([
      issue({ id: 'ISS-001', status: 'Issued', dueDate: addDays(todayISO(), 4) }),
      issue({ id: 'ISS-002', status: 'Overdue', dueDate: addDays(todayISO(), -3) }),
      issue({ id: 'ISS-003', status: 'Returned', dueDate: addDays(todayISO(), -10), returnDate: addDays(todayISO(), -8) }),
    ]);
    setActivity([]);
    render(<Dashboard />);
    // issuedBooks counts every non-Returned issue (Issued + Overdue) = 2
    expect(screen.getByTestId('stat-issued-books-value')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-overdue-books-value')).toHaveTextContent('1');
  });

  it('counts books due today, excluding returned issues that happen to be due today', () => {
    setBooks([]);
    setMembers([]);
    setIssues([
      issue({ id: 'ISS-001', status: 'Issued', dueDate: todayISO() }),
      issue({ id: 'ISS-002', status: 'Returned', dueDate: todayISO(), returnDate: todayISO() }),
      issue({ id: 'ISS-003', status: 'Issued', dueDate: addDays(todayISO(), 5) }),
    ]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('stat-due-today-value')).toHaveTextContent('1');
  });

  it('renders recent activity items with their message text', () => {
    setBooks([]);
    setMembers([]);
    setIssues([]);
    const activity: ActivityItem[] = [
      { id: 'ACT-1', type: 'issue', message: 'Book "Dune" issued to Priya Iyer', timestamp: new Date().toISOString() },
      { id: 'ACT-2', type: 'return', message: 'Book "The Alchemist" returned by Rohan Nair', timestamp: new Date().toISOString() },
      { id: 'ACT-3', type: 'member', message: 'New member registered: Tanvi Desai', timestamp: new Date().toISOString() },
    ];
    setActivity(activity);
    render(<Dashboard />);
    expect(screen.getByTestId('activity-item-ACT-1')).toHaveTextContent('Book "Dune" issued to Priya Iyer');
    expect(screen.getByTestId('activity-item-ACT-2')).toHaveTextContent('Book "The Alchemist" returned by Rohan Nair');
    expect(screen.getByTestId('activity-item-ACT-3')).toHaveTextContent('New member registered: Tanvi Desai');
  });

  it('renders the icon glyph matching each activity type', () => {
    setBooks([]);
    setMembers([]);
    setIssues([]);
    setActivity([
      { id: 'ACT-1', type: 'issue', message: 'issued', timestamp: new Date().toISOString() },
      { id: 'ACT-2', type: 'return', message: 'returned', timestamp: new Date().toISOString() },
      { id: 'ACT-3', type: 'book', message: 'book added', timestamp: new Date().toISOString() },
    ]);
    render(<Dashboard />);
    expect(screen.getByTestId('activity-item-ACT-1')).toHaveTextContent('↷');
    expect(screen.getByTestId('activity-item-ACT-2')).toHaveTextContent('↶');
    expect(screen.getByTestId('activity-item-ACT-3')).toHaveTextContent('▤');
  });

  it('renders an empty activity panel without crashing when there is no activity', () => {
    setBooks([]);
    setMembers([]);
    setIssues([]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    expect(screen.queryByTestId(/^activity-item-/)).not.toBeInTheDocument();
  });

  it('renders all three chart panels', () => {
    setBooks([book({})]);
    setMembers([]);
    setIssues([issue({})]);
    setActivity([]);
    render(<Dashboard />);
    expect(screen.getByTestId('chart-monthly-issues')).toBeInTheDocument();
    expect(screen.getByTestId('chart-category-popularity')).toBeInTheDocument();
    expect(screen.getByTestId('chart-returned-vs-issued')).toBeInTheDocument();
  });
});
