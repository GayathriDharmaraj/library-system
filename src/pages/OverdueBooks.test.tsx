import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import OverdueBooks from './OverdueBooks';
import ToastStack from '../components/ToastStack';
import { setBooks, setMembers, setIssues } from '../services/storage';
import type { Book, Member, IssueRecord } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';
import { calculateFine, overdueDays } from '../utils/fine';

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

function makeMember(id: string, firstName: string, lastName: string, email: string): Member {
  return {
    id,
    firstName,
    lastName,
    email,
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

function makeIssue(id: string, bookId: string, memberId: string, dueOffset: number, status: IssueRecord['status'] = 'Overdue'): IssueRecord {
  return {
    id,
    bookId,
    memberId,
    issueDate: addDays(todayISO(), dueOffset - 14),
    dueDate: addDays(todayISO(), dueOffset),
    returnDate: status === 'Returned' ? todayISO() : null,
    status,
    fine: 0,
  };
}

const book1 = makeBook('BK-001', 'Dune');
const book2 = makeBook('BK-002', 'Sapiens');
const member1 = makeMember('MEM-001', 'Isha', 'Verma', 'isha@mail.com');
const member2 = makeMember('MEM-002', 'Rohan', 'Nair', 'rohan@mail.com');

describe('OverdueBooks', () => {
  it('shows an empty state when there are no overdue issues', () => {
    setBooks([book1]);
    setMembers([member1]);
    setIssues([makeIssue('ISS-001', book1.id, member1.id, 5, 'Issued'), makeIssue('ISS-002', book1.id, member1.id, -5, 'Returned')]);
    renderWithProviders(<OverdueBooks />);
    expect(screen.getByTestId('overdue-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('overdue-table')).not.toBeInTheDocument();
  });

  it('lists only issues that are overdue, excluding returned and not-yet-due records', () => {
    const overdue = makeIssue('ISS-001', book1.id, member1.id, -5);
    const dueToday = makeIssue('ISS-002', book1.id, member1.id, 0, 'Issued');
    const notYetDue = makeIssue('ISS-003', book1.id, member1.id, 5, 'Issued');
    const returnedOverdue = makeIssue('ISS-004', book1.id, member1.id, -5, 'Returned');
    setBooks([book1]);
    setMembers([member1]);
    setIssues([overdue, dueToday, notYetDue, returnedOverdue]);
    renderWithProviders(<OverdueBooks />);
    expect(screen.getByTestId(`overdue-row-${overdue.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`overdue-row-${dueToday.id}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`overdue-row-${notYetDue.id}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`overdue-row-${returnedOverdue.id}`)).not.toBeInTheDocument();
  });

  it('computes days overdue, fine, and severity label correctly', () => {
    const lowIssue = makeIssue('ISS-LOW', book1.id, member1.id, -2);
    setBooks([book1]);
    setMembers([member1]);
    setIssues([lowIssue]);
    renderWithProviders(<OverdueBooks />);
    const days = overdueDays(lowIssue.dueDate, null);
    const fine = calculateFine(lowIssue.dueDate, null);
    const severityCell = screen.getByTestId(`overdue-severity-${lowIssue.id}`);
    expect(severityCell).toHaveTextContent(`${days} days`);
    expect(severityCell).toHaveAttribute('title', '1–3 days');
    expect(screen.getByTestId(`overdue-row-${lowIssue.id}`)).toHaveTextContent(`₹${fine}`);
  });

  it('filters results by search term matching member name or book title', async () => {
    const issue1 = makeIssue('ISS-001', book1.id, member1.id, -5);
    const issue2 = makeIssue('ISS-002', book2.id, member2.id, -5);
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issue1, issue2]);
    const user = userEvent.setup();
    renderWithProviders(<OverdueBooks />);
    await user.type(screen.getByTestId('overdue-search'), 'Sapiens');
    expect(screen.queryByTestId(`overdue-row-${issue1.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`overdue-row-${issue2.id}`)).toBeInTheDocument();
  });

  it('filters results by severity', async () => {
    const lowIssue = makeIssue('ISS-LOW', book1.id, member1.id, -2);
    const highIssue = makeIssue('ISS-HIGH', book2.id, member2.id, -10);
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([lowIssue, highIssue]);
    const user = userEvent.setup();
    renderWithProviders(<OverdueBooks />);
    await user.selectOptions(screen.getByTestId('overdue-severity-filter'), 'high');
    expect(screen.queryByTestId(`overdue-row-${lowIssue.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`overdue-row-${highIssue.id}`)).toBeInTheDocument();
  });

  it('toggles sort direction between descending (default) and ascending by days overdue', async () => {
    const lowIssue = makeIssue('ISS-LOW', book1.id, member1.id, -2);
    const highIssue = makeIssue('ISS-HIGH', book2.id, member2.id, -10);
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([lowIssue, highIssue]);
    const user = userEvent.setup();
    renderWithProviders(<OverdueBooks />);

    let rows = screen.getAllByTestId(/^overdue-row-/);
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual([`overdue-row-${highIssue.id}`, `overdue-row-${lowIssue.id}`]);

    await user.click(screen.getByTestId('overdue-sort-toggle'));
    rows = screen.getAllByTestId(/^overdue-row-/);
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual([`overdue-row-${lowIssue.id}`, `overdue-row-${highIssue.id}`]);
  });

  it('paginates when there are more than one page of overdue issues', async () => {
    const issues = Array.from({ length: 15 }, (_, i) => makeIssue(`ISS-${i + 1}`, book1.id, member1.id, -(i + 1)));
    setBooks([book1]);
    setMembers([member1]);
    setIssues(issues);
    const user = userEvent.setup();
    renderWithProviders(<OverdueBooks />);

    expect(screen.getByTestId('overdue-pagination-range-label')).toHaveTextContent('Showing 1–10 of 15');
    expect(screen.getAllByTestId(/^overdue-row-/)).toHaveLength(10);

    await user.click(screen.getByTestId('overdue-pagination-next'));
    expect(screen.getByTestId('overdue-pagination-range-label')).toHaveTextContent('Showing 11–15 of 15');
    expect(screen.getAllByTestId(/^overdue-row-/)).toHaveLength(5);
  });

  it('shows an info toast with the member email when Contact Member is clicked', async () => {
    const issue = makeIssue('ISS-001', book1.id, member1.id, -5);
    setBooks([book1]);
    setMembers([member1]);
    setIssues([issue]);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <OverdueBooks />
        <ToastStack />
      </>
    );
    await user.click(screen.getByTestId(`contact-member-${issue.id}`));
    expect(screen.getByTestId('toast-info')).toHaveTextContent(
      `A reminder email would be sent to ${member1.email} in a live system.`
    );
  });
});
