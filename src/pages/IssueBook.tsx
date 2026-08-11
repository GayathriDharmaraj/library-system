import { useMemo, useState, type FormEvent } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import type { IssueRecord } from '../types';
import { getBooks, getIssues, getMembers, nextId, pushActivity, setBooks, setIssues, setMembers } from '../services/storage';
import { addDays, formatDate, todayISO } from '../utils/dateUtils';

const MAX_BOOKS_PER_MEMBER = 5;

export default function IssueBook() {
  const { showToast } = useToast();
  const [books, setBooksState] = useState(() => getBooks());
  const [members, setMembersState] = useState(() => getMembers());
  const [issues, setIssuesState] = useState(() => getIssues());

  const [memberId, setMemberId] = useState('');
  const [bookId, setBookId] = useState('');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 14));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedMember = members.find((m) => m.id === memberId);
  const selectedBook = books.find((b) => b.id === bookId);

  const memberActiveIssues = useMemo(
    () => issues.filter((i) => i.memberId === memberId && i.status !== 'Returned'),
    [issues, memberId]
  );
  const memberOverdue = memberActiveIssues.filter((i) => i.status === 'Overdue');

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!memberId) nextErrors.member = 'Please select a member.';
    if (!bookId) nextErrors.book = 'Please select a book.';
    if (!issueDate) nextErrors.issueDate = 'Issue date is required.';
    else if (issueDate < todayISO()) nextErrors.issueDate = 'Issue date cannot be in the past.';
    if (!dueDate) nextErrors.dueDate = 'Due date is required.';
    else if (dueDate < issueDate) nextErrors.dueDate = 'Due date cannot be before the issue date.';

    if (selectedBook && selectedBook.availableCopies <= 0) {
      nextErrors.book = 'This book has no available copies right now.';
    }
    if (selectedMember && memberActiveIssues.length >= MAX_BOOKS_PER_MEMBER) {
      nextErrors.member = `This member already has ${MAX_BOOKS_PER_MEMBER} books issued (the maximum allowed).`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReview = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmIssue = () => {
    if (!selectedBook || !selectedMember) return;

    const updatedBooks = books.map((b) =>
      b.id === selectedBook.id
        ? {
            ...b,
            availableCopies: b.availableCopies - 1,
            status: b.availableCopies - 1 > 0 ? ('Available' as const) : ('Unavailable' as const),
          }
        : b
    );
    const updatedMembers = members.map((m) =>
      m.id === selectedMember.id ? { ...m, booksIssued: m.booksIssued + 1 } : m
    );
    const newIssue: IssueRecord = {
      id: nextId('ISS', issues.map((i) => i.id)),
      bookId: selectedBook.id,
      memberId: selectedMember.id,
      issueDate,
      dueDate,
      returnDate: null,
      status: 'Issued',
      fine: 0,
    };
    const updatedIssues = [newIssue, ...issues];

    setBooks(updatedBooks);
    setMembers(updatedMembers);
    setIssues(updatedIssues);
    setBooksState(updatedBooks);
    setMembersState(updatedMembers);
    setIssuesState(updatedIssues);

    pushActivity({ type: 'issue', message: `Book "${selectedBook.title}" issued to ${selectedMember.firstName} ${selectedMember.lastName}` });
    showToast(`"${selectedBook.title}" issued to ${selectedMember.firstName} ${selectedMember.lastName}.`, 'success');

    setConfirmOpen(false);
    setMemberId('');
    setBookId('');
    setIssueDate(todayISO());
    setDueDate(addDays(todayISO(), 14));
    setErrors({});
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl" data-testid="issue-book-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Issue Book</h1>
        <p className="text-sm text-ink-600">Issue an available book to a registered member.</p>
      </div>

      <form onSubmit={handleReview} noValidate data-testid="issue-book-form" className="bg-white rounded-xl border border-ink-900/10 p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="issue-select-member" className="block text-sm font-medium text-ink-800 mb-1">Select Member</label>
          <select
            id="issue-select-member"
            data-testid="issue-select-member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${errors.member ? 'border-rust-glow' : 'border-ink-900/15'}`}
          >
            <option value="">Choose a member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.id})</option>
            ))}
          </select>
          {errors.member && <p data-testid="issue-member-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.member}</p>}
        </div>

        {selectedMember && (
          <div className="bg-paper-100 rounded-lg p-3 text-sm text-ink-700 flex flex-col gap-1" data-testid="member-issue-summary">
            <span>Currently issued: <strong>{memberActiveIssues.length}</strong> / {MAX_BOOKS_PER_MEMBER}</span>
            <span>Overdue books: <strong className={memberOverdue.length > 0 ? 'text-rust-glow' : ''}>{memberOverdue.length}</strong></span>
          </div>
        )}

        <div>
          <label htmlFor="issue-select-book" className="block text-sm font-medium text-ink-800 mb-1">Select Book</label>
          <select
            id="issue-select-book"
            data-testid="issue-select-book"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${errors.book ? 'border-rust-glow' : 'border-ink-900/15'}`}
          >
            <option value="">Choose a book...</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title} — {b.availableCopies} available</option>
            ))}
          </select>
          {errors.book && <p data-testid="issue-book-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.book}</p>}
        </div>

        {selectedBook && (
          <div className="bg-paper-100 rounded-lg p-3 text-sm text-ink-700" data-testid="book-availability-summary">
            <span>Available copies: <strong>{selectedBook.availableCopies}</strong> of {selectedBook.totalCopies}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="issue-date" className="block text-sm font-medium text-ink-800 mb-1">Issue Date</label>
            <input
              id="issue-date"
              data-testid="issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.issueDate ? 'border-rust-glow' : 'border-ink-900/15'}`}
            />
            {errors.issueDate && <p data-testid="issue-date-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.issueDate}</p>}
          </div>
          <div>
            <label htmlFor="issue-due-date" className="block text-sm font-medium text-ink-800 mb-1">Due Date</label>
            <input
              id="issue-due-date"
              data-testid="issue-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.dueDate ? 'border-rust-glow' : 'border-ink-900/15'}`}
            />
            {errors.dueDate && <p data-testid="issue-due-date-error" role="alert" className="text-rust-glow text-xs mt-1">{errors.dueDate}</p>}
          </div>
        </div>

        <button
          type="submit"
          data-testid="issue-book-button"
          className="self-start bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg px-5 py-2.5"
        >
          Issue Book
        </button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm book issue"
        message={
          selectedBook && selectedMember
            ? `Issue "${selectedBook.title}" to ${selectedMember.firstName} ${selectedMember.lastName}, due back on ${formatDate(dueDate)}?`
            : ''
        }
        confirmLabel="Confirm Issue"
        testId="confirm-issue-dialog"
        onConfirm={handleConfirmIssue}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
