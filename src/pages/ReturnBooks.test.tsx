import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import ReturnBooks from './ReturnBooks';
import ToastStack from '../components/ToastStack';
import { getBooks, setBooks, getMembers, setMembers, getIssues, setIssues } from '../services/storage';
import type { Book, Member, IssueRecord } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';
import { calculateFine, overdueDays } from '../utils/fine';

const book1: Book = {
  id: 'BK-001',
  isbn: '9780001112223',
  title: 'Overdue Book',
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

const book2: Book = { ...book1, id: 'BK-002', title: 'On Time Book', totalCopies: 3, availableCopies: 1 };

const member1: Member = {
  id: 'MEM-001',
  firstName: 'Isha',
  lastName: 'Verma',
  email: 'isha@mail.com',
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

const member2: Member = { ...member1, id: 'MEM-002', firstName: 'Rohan', lastName: 'Nair', booksIssued: 1 };

const overdueDueDate = addDays(todayISO(), -10);
const onTimeDueDate = addDays(todayISO(), 5);

const issueOverdue: IssueRecord = {
  id: 'ISS-001',
  bookId: book1.id,
  memberId: member1.id,
  issueDate: addDays(overdueDueDate, -14),
  dueDate: overdueDueDate,
  returnDate: null,
  status: 'Overdue',
  fine: 0,
};

const issueOnTime: IssueRecord = {
  id: 'ISS-002',
  bookId: book2.id,
  memberId: member2.id,
  issueDate: addDays(onTimeDueDate, -14),
  dueDate: onTimeDueDate,
  returnDate: null,
  status: 'Issued',
  fine: 0,
};

const issueAlreadyReturned: IssueRecord = {
  id: 'ISS-003',
  bookId: book1.id,
  memberId: member1.id,
  issueDate: addDays(todayISO(), -30),
  dueDate: addDays(todayISO(), -16),
  returnDate: addDays(todayISO(), -20),
  status: 'Returned',
  fine: 0,
};

describe('ReturnBooks', () => {
  it('shows an empty state when there are no active issues', () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueAlreadyReturned]);
    renderWithProviders(<ReturnBooks />);
    expect(screen.getByTestId('return-books-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('return-books-table')).not.toBeInTheDocument();
  });

  it('lists only non-returned issues, sorted by due date ascending', () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOnTime, issueOverdue, issueAlreadyReturned]);
    renderWithProviders(<ReturnBooks />);
    expect(screen.queryByTestId(`return-row-${issueAlreadyReturned.id}`)).not.toBeInTheDocument();
    const rows = screen.getAllByTestId(/^return-row-/);
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual([
      `return-row-${issueOverdue.id}`,
      `return-row-${issueOnTime.id}`,
    ]);
  });

  it('shows overdue status, days overdue, and a computed fine for an overdue issue', () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOverdue]);
    renderWithProviders(<ReturnBooks />);
    const row = screen.getByTestId(`return-row-${issueOverdue.id}`);
    const days = overdueDays(issueOverdue.dueDate, null);
    const fine = calculateFine(issueOverdue.dueDate, null);
    expect(within(row).getByTestId('status-badge-overdue')).toBeInTheDocument();
    expect(row).toHaveTextContent(String(days));
    expect(row).toHaveTextContent(`₹${fine}`);
  });

  it('shows a dash and zero fine for a book that is not yet overdue', () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOnTime]);
    renderWithProviders(<ReturnBooks />);
    const row = screen.getByTestId(`return-row-${issueOnTime.id}`);
    expect(within(row).getByTestId('status-badge-issued')).toBeInTheDocument();
    expect(row).toHaveTextContent('—');
    expect(row).toHaveTextContent('₹0');
  });

  it('opens a confirm dialog mentioning the fine for an overdue return', async () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOverdue]);
    const user = userEvent.setup();
    renderWithProviders(<ReturnBooks />);
    await user.click(screen.getByTestId(`return-book-button-${issueOverdue.id}`));
    const dialog = screen.getByTestId('confirm-return-dialog');
    const fine = calculateFine(issueOverdue.dueDate, null);
    expect(dialog).toHaveTextContent(`A fine of ₹${fine} will be applied`);
  });

  it('opens a confirm dialog with no fine mention for an on-time return', async () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOnTime]);
    const user = userEvent.setup();
    renderWithProviders(<ReturnBooks />);
    await user.click(screen.getByTestId(`return-book-button-${issueOnTime.id}`));
    expect(screen.getByTestId('confirm-return-dialog')).toHaveTextContent('No fine will be applied.');
  });

  it('cancelling the return dialog makes no changes', async () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOverdue]);
    const user = userEvent.setup();
    renderWithProviders(<ReturnBooks />);
    await user.click(screen.getByTestId(`return-book-button-${issueOverdue.id}`));
    await user.click(screen.getByTestId('confirm-return-dialog-cancel'));
    expect(screen.queryByTestId('confirm-return-dialog')).not.toBeInTheDocument();
    expect(getIssues()[0].status).toBe('Overdue');
    expect(screen.getByTestId(`return-row-${issueOverdue.id}`)).toBeInTheDocument();
  });

  it('confirming an overdue return updates storage and shows a fine toast', async () => {
    setBooks([book1, book2]);
    setMembers([member1, member2]);
    setIssues([issueOverdue]);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ReturnBooks />
        <ToastStack />
      </>
    );
    const days = overdueDays(issueOverdue.dueDate, null);
    const fine = calculateFine(issueOverdue.dueDate, null);

    await user.click(screen.getByTestId(`return-book-button-${issueOverdue.id}`));
    await user.click(screen.getByTestId('confirm-return-dialog-confirm'));

    const updatedIssue = getIssues().find((i) => i.id === issueOverdue.id);
    expect(updatedIssue?.status).toBe('Returned');
    expect(updatedIssue?.returnDate).toBe(todayISO());
    expect(updatedIssue?.fine).toBe(fine);

    const updatedBook = getBooks().find((b) => b.id === book1.id);
    expect(updatedBook?.availableCopies).toBe(book1.availableCopies + 1);
    expect(updatedBook?.status).toBe('Available');

    const updatedMember = getMembers().find((m) => m.id === member1.id);
    expect(updatedMember?.booksIssued).toBe(0);

    expect(screen.getByTestId('toast-success')).toHaveTextContent(
      `A fine of ₹${fine} was recorded for ${days} overdue day(s).`
    );
    expect(screen.queryByTestId(`return-row-${issueOverdue.id}`)).not.toBeInTheDocument();
  });

  it('confirming an on-time return shows a no-fine toast and never floors member count below zero', async () => {
    const memberAtZero = { ...member2, booksIssued: 0 };
    setBooks([book1, book2]);
    setMembers([member1, memberAtZero]);
    setIssues([issueOnTime]);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ReturnBooks />
        <ToastStack />
      </>
    );
    await user.click(screen.getByTestId(`return-book-button-${issueOnTime.id}`));
    await user.click(screen.getByTestId('confirm-return-dialog-confirm'));

    const updatedIssue = getIssues().find((i) => i.id === issueOnTime.id);
    expect(updatedIssue?.fine).toBe(0);
    const updatedMember = getMembers().find((m) => m.id === memberAtZero.id);
    expect(updatedMember?.booksIssued).toBe(0);
    expect(screen.getByTestId('toast-success')).toHaveTextContent('Book returned successfully, right on time.');
  });
});
