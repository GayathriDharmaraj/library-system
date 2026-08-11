import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { getBooks, getIssues, getMembers } from '../services/storage';
import { formatDate } from '../utils/dateUtils';

export default function BookDetails() {
  const { id } = useParams();
  const books = useMemo(() => getBooks(), []);
  const members = useMemo(() => getMembers(), []);
  const issues = useMemo(() => getIssues(), []);

  const book = books.find((b) => b.id === id);
  const history = issues
    .filter((i) => i.bookId === id)
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  if (!book) {
    return (
      <div data-testid="book-details-page">
        <EmptyState
          testId="book-not-found"
          title="Book not found"
          message="This book may have been deleted from the catalog."
          action={
            <Link to="/books" className="text-sm font-medium text-brand-600 hover:underline">
              Back to Books
            </Link>
          }
        />
      </div>
    );
  }

  const issuedCopies = book.totalCopies - book.availableCopies;

  return (
    <div className="flex flex-col gap-5" data-testid="book-details-page">
      <div>
        <Link to="/books" className="text-sm text-brand-600 hover:underline" data-testid="back-to-books">
          ← Back to Books
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-6 flex flex-col sm:flex-row gap-6">
        <div
          className="w-28 h-40 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-3xl self-center sm:self-start"
          style={{ backgroundColor: book.coverColor }}
          data-testid="book-cover"
          aria-hidden="true"
        >
          {book.title.charAt(0)}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">{book.title}</h1>
              <p className="text-ink-600 text-sm">by {book.author}</p>
            </div>
            <StatusBadge status={book.status} />
          </div>

          <p className="text-sm text-ink-700 mt-4" data-testid="book-description">{book.description}</p>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">ISBN</dt>
              <dd className="font-mono text-ink-900" data-testid="detail-isbn">{book.isbn}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Category</dt>
              <dd className="text-ink-900">{book.category}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Publisher</dt>
              <dd className="text-ink-900">{book.publisher}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Published Year</dt>
              <dd className="text-ink-900">{book.publishedYear}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Total Copies</dt>
              <dd className="text-ink-900" data-testid="detail-total-copies">{book.totalCopies}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Available Copies</dt>
              <dd className="text-ink-900" data-testid="detail-available-copies">{book.availableCopies}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Currently Issued</dt>
              <dd className="text-ink-900" data-testid="detail-issued-copies">{issuedCopies}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden" data-testid="book-issue-history">
        <h3 className="font-display font-semibold text-sm text-ink-900 px-4 pt-4 pb-2">Issue History</h3>
        {history.length === 0 ? (
          <EmptyState testId="book-history-empty" title="No issue history yet" message="This book hasn't been issued to any members." />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {history.map((record) => {
                  const member = members.find((m) => m.id === record.memberId);
                  return (
                    <tr key={record.id} data-testid={`book-history-row-${record.id}`}>
                      <td className="px-4 py-3 text-ink-900">{member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.dueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.returnDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
