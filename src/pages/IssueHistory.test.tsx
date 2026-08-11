import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import IssueHistory from './IssueHistory';
import { setBooks, setMembers, setIssues } from '../services/storage';
import type { Book, Member, IssueRecord } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';

function makeBook(id: string, title: string): Book {
  return {
    id,
    isbn: `978000${id}`,
    title,
    author: 'Author A',
    category: 'Fiction',
    publisher: 'Pub Co',
    publishedYear: 2000,
    totalCopies: 5,
    availableCopies: 2,
    description: '',
    status: 'Available',
    coverColor: '#4f46e5',
    createdAt: todayISO(),
  };
}

function makeMember(id: string, firstName: string, lastName: string): Member {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}@mail.com`,
    phone: '9812345678',
    dob: '1995-05-20',
    address: '2 Reading Row',
    membershipType: 'Basic',
    membershipStart: todayISO(),
    membershipExpiry: addDays(todayISO(), 365),
    status: 'Active',
    joinDate: todayISO(),
    booksIssued: 1,
  };
}

function makeIssue(
  id: string,
  bookId: string,
  memberId: string,
  issueOffset: number,
  status: IssueRecord['status'] = 'Issued',
  fine = 0
): IssueRecord {
  return {
    id,
    bookId,
    memberId,
    issueDate: addDays(todayISO(), issueOffset),
    dueDate: addDays(todayISO(), issueOffset + 14),
    returnDate: status === 'Returned' ? addDays(todayISO(), issueOffset + 10) : null,
    status,
    fine,
  };
}

const book1 = makeBook('BK-001', 'Dune');
const book2 = makeBook('BK-002', 'Sapiens');
const member1 = makeMember('MEM-001', 'Isha', 'Verma');
const member2 = makeMember('MEM-002', 'Rohan', 'Nair');

describe('IssueHistory', () => {
  it('shows an empty state when there are no issue records', () => {
    setBooks([book1]);
    setMembers([member1]);
    setIssues([]);
    renderWithProviders(<IssueHistory />);
    expect(screen.getByTestId('issue-history-empty')).toBeInTheDocument();
    expect(screen.getByTestId('page-heading').parentElement).toHaveTextContent('0 of 0 total issue records');
  });

  it('lists all issue records sorted by issue date descending by default', () => {
    const older = makeIssue('ISS-001', book1.id, member1.id, -30);
    const newer = makeIssue('ISS-002', book1.id, member1.id, -5);
    setBooks([book1]);
    setMembers([member1]);
    setIssues([older, newer]);
    renderWithProviders(<IssueHistory />);
    const rows = screen.getAllByTestId(/^history-row-/);
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual([`history-row-${newer.id}`, `history-row-${older.id}`]);
  });

  it('shows a dash for a null return date and the correct status badge and fine', () => {
    const issue = makeIssue('ISS-001', book1.id, member1.id, -5, 'Issued', 0);
    setBooks([book1]);
    setMembers([member1]);
    setIssues([issue]);
    renderWithProviders(<IssueHistory />);
    const row = screen.getByTestId(`history-row-${issue.id}`);
    expect(within(row).getByTestId('status-badge-issued')).toBeInTheDocument();
    expect(row).toHaveTextContent('—');
    expect(row).toHaveTextContent('₹0');
  });

  it('shows the return date and fine for a returned record', () => {
    const issue = makeIssue('ISS-001', book1.id, member1.id, -30, 'Returned', 50);
    setBooks([book1]);
    setMembers([member1]);
    setIssues([issue]);
    renderWithProviders(<IssueHistory />);
    const row = screen.getByTestId(`history-row-${issue.id}`);
    expect(within(row).getByTestId('status-badge-returned')).toBeInTheDocument();
    expect(row).toHaveTextContent('₹50');
  });

  it('filters by issue date range', async () => {
    const early = makeIssue('ISS-001', book1.id, member1.id, -30);
    const late = makeIssue('ISS-002', book1.id, member1.id, -5);
    setBooks([book1]);
    setMembers([member1]);
    setIssues([early, late]);
    const user = userEvent.setup();
    renderWithProviders(<IssueHistory />);
    await user.type(screen.getByTestId('history-from-date'), addDays(todayISO(), -10));
    expect(screen.queryByTestId(`history-row-${early.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`history-row-${late.id}`)).toBeInTheDocument();
  });

  it('filters by book', async () => {
    const issue1 = makeIssue('ISS-001', book1.id, member1.id, -5);
    const issue2 = makeIssue('ISS-002', book2.id, member2.id, -5);
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issue1, issue2]);
    const user = userEvent.setup();
    renderWithProviders(<IssueHistory />);
    await user.selectOptions(screen.getByTestId('history-book-filter'), book2.id);
    expect(screen.queryByTestId(`history-row-${issue1.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`history-row-${issue2.id}`)).toBeInTheDocument();
  });

  it('filters by member', async () => {
    const issue1 = makeIssue('ISS-001', book1.id, member1.id, -5);
    const issue2 = makeIssue('ISS-002', book2.id, member2.id, -5);
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issue1, issue2]);
    const user = userEvent.setup();
    renderWithProviders(<IssueHistory />);
    await user.selectOptions(screen.getByTestId('history-member-filter'), member2.id);
    expect(screen.queryByTestId(`history-row-${issue1.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`history-row-${issue2.id}`)).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const issued = makeIssue('ISS-001', book1.id, member1.id, -5, 'Issued');
    const returned = makeIssue('ISS-002', book1.id, member1.id, -30, 'Returned');
    setBooks([book1]);
    setMembers([member1]);
    setIssues([issued, returned]);
    const user = userEvent.setup();
    renderWithProviders(<IssueHistory />);
    await user.selectOptions(screen.getByTestId('history-status-filter'), 'Returned');
    expect(screen.queryByTestId(`history-row-${issued.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`history-row-${returned.id}`)).toBeInTheDocument();
  });

  it('clears all filters and re-shows every record', async () => {
    const issue1 = makeIssue('ISS-001', book1.id, member1.id, -5, 'Issued');
    const issue2 = makeIssue('ISS-002', book2.id, member2.id, -30, 'Returned');
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issue1, issue2]);
    const user = userEvent.setup();
    renderWithProviders(<IssueHistory />);
    await user.selectOptions(screen.getByTestId('history-status-filter'), 'Returned');
    expect(screen.queryByTestId(`history-row-${issue1.id}`)).not.toBeInTheDocument();

    await user.click(screen.getByTestId('clear-history-filters-button'));
    expect(screen.getByTestId('history-status-filter')).toHaveValue('');
    expect(screen.getByTestId(`history-row-${issue1.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`history-row-${issue2.id}`)).toBeInTheDocument();
  });

  it('paginates when there are more than one page of records', async () => {
    const issues = Array.from({ length: 12 }, (_, i) => makeIssue(`ISS-${i + 1}`, book1.id, member1.id, -(i + 1)));
    setBooks([book1]);
    setMembers([member1]);
    setIssues(issues);
    const user = userEvent.setup();
    renderWithProviders(<IssueHistory />);

    expect(screen.getByTestId('issue-history-pagination-range-label')).toHaveTextContent('Showing 1–10 of 12');
    expect(screen.getAllByTestId(/^history-row-/)).toHaveLength(10);

    await user.click(screen.getByTestId('issue-history-pagination-next'));
    expect(screen.getByTestId('issue-history-pagination-range-label')).toHaveTextContent('Showing 11–12 of 12');
    expect(screen.getAllByTestId(/^history-row-/)).toHaveLength(2);
  });
});
