import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import IssueBook from './IssueBook';
import ToastStack from '../components/ToastStack';
import { getBooks, setBooks, getMembers, setMembers, getIssues, setIssues } from '../services/storage';
import type { Book, Member, IssueRecord } from '../types';
import { addDays, todayISO } from '../utils/dateUtils';

const bookAvailable: Book = {
  id: 'BK-001',
  isbn: '9780001112223',
  title: 'Available Book',
  author: 'Author A',
  category: 'Fiction',
  publisher: 'Pub Co',
  publishedYear: 2000,
  totalCopies: 3,
  availableCopies: 3,
  description: '',
  status: 'Available',
  coverColor: '#4f46e5',
  createdAt: todayISO(),
};

const bookLastCopy: Book = { ...bookAvailable, id: 'BK-003', title: 'Last Copy Book', totalCopies: 1, availableCopies: 1 };

const bookUnavailable: Book = {
  ...bookAvailable,
  id: 'BK-002',
  title: 'No Copies Book',
  totalCopies: 2,
  availableCopies: 0,
  status: 'Unavailable',
};

const memberActive: Member = {
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
  booksIssued: 0,
};

const memberAtMax: Member = { ...memberActive, id: 'MEM-002', firstName: 'Rohan', lastName: 'Nair', booksIssued: 5 };
const memberPremium: Member = { ...memberActive, id: 'MEM-003', firstName: 'Priya', lastName: 'Rao', membershipType: 'Premium', booksIssued: 5 };
const memberStudent: Member = { ...memberActive, id: 'MEM-004', firstName: 'Arjun', lastName: 'Bose', membershipType: 'Student', booksIssued: 3 };

function issuesForMember(memberId: string, count: number): IssueRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ISS-${memberId}-${i + 1}`,
    bookId: bookAvailable.id,
    memberId,
    issueDate: todayISO(),
    dueDate: addDays(todayISO(), 14),
    returnDate: null,
    status: 'Issued' as const,
    fine: 0,
  }));
}

function issuesForMaxedMember(): IssueRecord[] {
  return issuesForMember(memberAtMax.id, 5);
}

describe('IssueBook', () => {
  it('renders the issue form with member and book selects', () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    renderWithProviders(<IssueBook />);
    expect(screen.getByTestId('page-heading')).toHaveTextContent('Issue Book');
    expect(screen.getByTestId('issue-select-member')).toBeInTheDocument();
    expect(screen.getByTestId('issue-select-book')).toBeInTheDocument();
  });

  it('requires a member and a book before submitting', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.getByTestId('issue-member-error')).toHaveTextContent('Please select a member.');
    expect(screen.getByTestId('issue-book-error')).toHaveTextContent('Please select a book.');
    expect(screen.queryByTestId('confirm-issue-dialog')).not.toBeInTheDocument();
  });

  it('shows summaries once a member and book are selected', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    expect(screen.getByTestId('member-issue-summary')).toHaveTextContent('Currently issued: 0 / 5');
    expect(screen.getByTestId('member-issue-summary')).toHaveTextContent('Overdue books: 0');
    expect(screen.getByTestId('book-availability-summary')).toHaveTextContent('Available copies: 3 of 3');
  });

  it('rejects issuing a book with no available copies', async () => {
    setBooks([bookAvailable, bookUnavailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookUnavailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.getByTestId('issue-book-error')).toHaveTextContent('This book has no available copies right now.');
  });

  it('rejects issuing to a Basic member who already has the maximum of 5 books', async () => {
    setBooks([bookAvailable]);
    setMembers([memberAtMax]);
    setIssues(issuesForMaxedMember());
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberAtMax.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.getByTestId('issue-member-error')).toHaveTextContent(
      'This member already has 5 books issued (the maximum allowed).'
    );
  });

  it('rejects issuing to a Student member who already has the maximum of 3 books', async () => {
    setBooks([bookAvailable]);
    setMembers([memberStudent]);
    setIssues(issuesForMember(memberStudent.id, 3));
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberStudent.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.getByTestId('issue-member-error')).toHaveTextContent(
      'This member already has 3 books issued (the maximum allowed).'
    );
  });

  it('allows issuing to a Premium member regardless of how many books they already have', async () => {
    setBooks([bookAvailable]);
    setMembers([memberPremium]);
    setIssues(issuesForMember(memberPremium.id, 5));
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberPremium.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.queryByTestId('issue-member-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('confirm-issue-dialog')).toBeInTheDocument();
  });

  it('shows an infinity symbol instead of a numeric limit for a Premium member', async () => {
    setBooks([bookAvailable]);
    setMembers([memberPremium]);
    setIssues(issuesForMember(memberPremium.id, 5));
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberPremium.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    expect(screen.getByTestId('member-issue-summary')).toHaveTextContent('Currently issued: 5 / ∞');
  });

  it('rejects a due date before the issue date', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    fireEvent.change(screen.getByTestId('issue-due-date'), { target: { value: addDays(todayISO(), -1) } });
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.getByTestId('issue-due-date-error')).toHaveTextContent('Due date cannot be before the issue date.');
  });

  it('rejects an issue date in the past', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    fireEvent.change(screen.getByTestId('issue-date'), { target: { value: addDays(todayISO(), -2) } });
    await user.click(screen.getByTestId('issue-book-button'));
    expect(screen.getByTestId('issue-date-error')).toHaveTextContent('Issue date cannot be in the past.');
  });

  it('opens a confirmation dialog with the correct summary when the form is valid', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    const dialog = screen.getByTestId('confirm-issue-dialog');
    expect(dialog).toHaveTextContent('Available Book');
    expect(dialog).toHaveTextContent('Isha Verma');
  });

  it('confirming a valid issue updates storage and resets the form', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <IssueBook />
        <ToastStack />
      </>
    );
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    await user.click(screen.getByTestId('confirm-issue-dialog-confirm'));

    const updatedBook = getBooks().find((b) => b.id === bookAvailable.id);
    expect(updatedBook?.availableCopies).toBe(2);
    expect(updatedBook?.status).toBe('Available');

    const updatedMember = getMembers().find((m) => m.id === memberActive.id);
    expect(updatedMember?.booksIssued).toBe(1);

    const issues = getIssues();
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ bookId: bookAvailable.id, memberId: memberActive.id, status: 'Issued', fine: 0, returnDate: null });

    expect(screen.getByTestId('toast-success')).toHaveTextContent('issued to Isha Verma');
    expect(screen.queryByTestId('confirm-issue-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('issue-select-member')).toHaveValue('');
    expect(screen.getByTestId('issue-select-book')).toHaveValue('');
  });

  it('marks the book Unavailable when the last available copy is issued', async () => {
    setBooks([bookLastCopy]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookLastCopy.id);
    await user.click(screen.getByTestId('issue-book-button'));
    await user.click(screen.getByTestId('confirm-issue-dialog-confirm'));

    const updatedBook = getBooks().find((b) => b.id === bookLastCopy.id);
    expect(updatedBook?.availableCopies).toBe(0);
    expect(updatedBook?.status).toBe('Unavailable');
  });

  it('cancelling the confirmation dialog makes no changes', async () => {
    setBooks([bookAvailable]);
    setMembers([memberActive]);
    setIssues([]);
    const user = userEvent.setup();
    renderWithProviders(<IssueBook />);
    await user.selectOptions(screen.getByTestId('issue-select-member'), memberActive.id);
    await user.selectOptions(screen.getByTestId('issue-select-book'), bookAvailable.id);
    await user.click(screen.getByTestId('issue-book-button'));
    await user.click(screen.getByTestId('confirm-issue-dialog-cancel'));
    expect(screen.queryByTestId('confirm-issue-dialog')).not.toBeInTheDocument();
    expect(getIssues()).toHaveLength(0);
    expect(getBooks()[0].availableCopies).toBe(3);
  });
});
