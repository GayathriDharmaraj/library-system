import { useMemo } from 'react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getBooks, getIssues, getMembers } from '../services/storage';
import { formatDate } from '../utils/dateUtils';
import { calculateFine, overdueDays } from '../utils/fine';

export default function MyAccount() {
  const { user } = useAuth();
  const members = useMemo(() => getMembers(), []);
  const books = useMemo(() => getBooks(), []);
  const issues = useMemo(() => getIssues(), []);

  const member = members.find((m) => m.id === user?.memberId);

  if (!user || !member) {
    return (
      <div data-testid="my-account-page">
        <EmptyState
          testId="my-account-unavailable"
          title="No linked member record"
          message="This login isn't linked to a library member account. Contact a librarian for help."
        />
      </div>
    );
  }

  const myIssues = issues
    .filter((i) => i.memberId === member.id)
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  const currentLoans = myIssues.filter((i) => i.status !== 'Returned');
  const pastLoans = myIssues.filter((i) => i.status === 'Returned');
  const overdueLoans = currentLoans.filter((i) => i.status === 'Overdue');
  const outstandingFine = overdueLoans.reduce((sum, i) => sum + calculateFine(i.dueDate, null), 0);

  return (
    <div className="flex flex-col gap-6" data-testid="my-account-page">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900" data-testid="page-heading">My Account</h1>
        <p className="text-sm text-ink-600">Your borrowed books, fines, and membership details.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Books Borrowed" value={currentLoans.length} testId="stat-current-loans" />
        <StatCard label="Overdue" value={overdueLoans.length} testId="stat-overdue-loans" accent="var(--color-rust-glow)" />
        <StatCard label="Fine Due" value={`₹${outstandingFine}`} testId="stat-outstanding-fine" accent="var(--color-rust-glow)" />
        <StatCard label="Membership" value={member.membershipType} testId="stat-membership-type" />
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 p-6 flex flex-col sm:flex-row gap-6" data-testid="my-account-profile">
        <div
          className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-xl self-center sm:self-start"
          style={{ backgroundColor: user.avatarColor }}
          aria-hidden="true"
        >
          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display font-semibold text-lg text-ink-900" data-testid="my-account-name">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-ink-600 text-sm">Member since {formatDate(member.joinDate)}</p>
            </div>
            <StatusBadge status={member.status} testId="my-account-status" />
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-ink-900">{member.email}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Phone</dt>
              <dd className="text-ink-900">{member.phone}</dd>
            </div>
            <div>
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Membership Expiry</dt>
              <dd className="text-ink-900">{formatDate(member.membershipExpiry)}</dd>
            </div>
            <div className="sm:col-span-3">
              <dt className="text-ink-600 text-xs uppercase tracking-wide">Address</dt>
              <dd className="text-ink-900">{member.address}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        <h3 className="font-display font-semibold text-sm text-ink-900 px-4 pt-4 pb-2">Currently Borrowed</h3>
        {currentLoans.length === 0 ? (
          <EmptyState testId="current-loans-empty" title="No books currently borrowed" message="Visit the library to borrow a book." />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="current-loans-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fine If Returned Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {currentLoans.map((record) => {
                  const book = books.find((b) => b.id === record.bookId);
                  const days = overdueDays(record.dueDate, null);
                  const fine = calculateFine(record.dueDate, null);
                  return (
                    <tr key={record.id} data-testid={`current-loan-row-${record.id}`}>
                      <td className="px-4 py-3 text-ink-900">{book?.title ?? 'Unknown Book'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.dueDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3 text-ink-700">{days > 0 ? `₹${fine}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-ink-900/10 overflow-hidden">
        <h3 className="font-display font-semibold text-sm text-ink-900 px-4 pt-4 pb-2">Borrowing History</h3>
        {pastLoans.length === 0 ? (
          <EmptyState testId="past-loans-empty" title="No returned books yet" message="Books you've returned will show up here." />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm" data-testid="past-loans-table">
              <thead>
                <tr className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-600">
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Fine Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {pastLoans.map((record) => {
                  const book = books.find((b) => b.id === record.bookId);
                  return (
                    <tr key={record.id} data-testid={`past-loan-row-${record.id}`}>
                      <td className="px-4 py-3 text-ink-900">{book?.title ?? 'Unknown Book'}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.issueDate)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatDate(record.returnDate)}</td>
                      <td className="px-4 py-3 text-ink-700">₹{record.fine}</td>
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
