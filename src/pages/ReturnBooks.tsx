import { useMemo, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import type { IssueRecord } from '../types';
import { getBooks, getIssues, getMembers, pushActivity, setBooks, setIssues, setMembers } from '../services/storage';
import { formatDate, todayISO } from '../utils/dateUtils';
import { calculateFine, overdueDays } from '../utils/fine';

export default function ReturnBooks() {
  const { showToast } = useToast();
  const [books, setBooksState] = useState(() => getBooks());
  const [members, setMembersState] = useState(() => getMembers());
  const [issues, setIssuesState] = useState(() => getIssues());
  const [returningIssue, setReturningIssue] = useState<IssueRecord | null>(null);

  const activeIssues = useMemo(
    () =>
      issues
        .filter((i) => i.status !== 'Returned')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [issues]
  );

  const getBook = (id: string) => books.find((b) => b.id === id);
  const getMember = (id: string) => members.find((m) => m.id === id);

  const handleConfirmReturn = () => {
    if (!returningIssue) return;
    const returnDate = todayISO();
    const fine = calculateFine(returningIssue.dueDate, returnDate);

    const updatedIssues = issues.map((i) =>
      i.id === returningIssue.id ? { ...i, returnDate, status: 'Returned' as const, fine } : i
    );
    const book = getBook(returningIssue.bookId);
    const updatedBooks = books.map((b) =>
      b.id === returningIssue.bookId
        ? {
            ...b,
            availableCopies: b.availableCopies + 1,
            status: 'Available' as const,
          }
        : b
    );
    const member = getMember(returningIssue.memberId);
    const updatedMembers = members.map((m) =>
      m.id === returningIssue.memberId ? { ...m, booksIssued: Math.max(0, m.booksIssued - 1) } : m
    );

    setIssues(updatedIssues);
    setBooks(updatedBooks);
    setMembers(updatedMembers);
    setIssuesState(updatedIssues);
    setBooksState(updatedBooks);
    setMembersState(updatedMembers);

    pushActivity({ type: 'return', message: `Book "${book?.title}" returned by ${member?.firstName} ${member?.lastName}` });
    showToast(
      fine > 0
        ? `Book returned. A fine of ₹${fine} was recorded for ${overdueDays(returningIssue.dueDate, returnDate)} overdue day(s).`
        : 'Book returned successfully, right on time.',
      'success'
    );
    setReturningIssue(null);
  };

  return (
    <div className="flex flex-col gap-5" data-testid="return-books-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">Return Books</h1>
        <p className="text-sm text-ink-600">{activeIssues.length} books currently checked out</p>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        {activeIssues.length === 0 ? (
          <EmptyState testId="return-books-empty" title="No books are currently issued" message="All copies have been returned." />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="return-books-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Issue ID</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Return Status</th>
                  <th className="px-4 py-3">Days Overdue</th>
                  <th className="px-4 py-3">Fine</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {activeIssues.map((issue) => {
                  const book = getBook(issue.bookId);
                  const member = getMember(issue.memberId);
                  const days = overdueDays(issue.dueDate, null);
                  const fine = calculateFine(issue.dueDate, null);
                  return (
                    <tr key={issue.id} data-testid={`return-row-${issue.id}`} className="hover:bg-ink-900/[0.02]">
                      <td className="px-4 py-3 stamp text-xs">{issue.id}</td>
                      <td className="px-4 py-3 text-ink-900">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</td>
                      <td className="px-4 py-3 text-ink-900">{book?.title ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(issue.dueDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={days > 0 ? 'Overdue' : 'Issued'} /></td>
                      <td className="px-4 py-3 text-ink-700">{days > 0 ? days : '—'}</td>
                      <td className="px-4 py-3 text-ink-700">₹{fine}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          data-testid={`return-book-button-${issue.id}`}
                          onClick={() => setReturningIssue(issue)}
                          className="text-brand-600 hover:underline text-xs font-medium"
                        >
                          Return Book
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(returningIssue)}
        title="Confirm return"
        message={
          returningIssue
            ? `Mark "${getBook(returningIssue.bookId)?.title}" as returned today? ${
                overdueDays(returningIssue.dueDate, null) > 0
                  ? `A fine of ₹${calculateFine(returningIssue.dueDate, null)} will be applied for ${overdueDays(returningIssue.dueDate, null)} overdue day(s).`
                  : 'No fine will be applied.'
              }`
            : ''
        }
        confirmLabel="Confirm Return"
        testId="confirm-return-dialog"
        onConfirm={handleConfirmReturn}
        onCancel={() => setReturningIssue(null)}
      />
    </div>
  );
}
